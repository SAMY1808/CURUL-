/* Padrinazgo: el jugador respalda con su peso interno a compañeros de partido más pequeños, que se
   convierten en sus protegidos. Con el tiempo, puede cobrarles el favor pidiéndoles un cupo —una
   plaza real que sólo alguien con cargo o con la dirección del partido puede repartir— para un
   copartidario sin puesto o para un hijo adulto. Es la otra cara de la moneda del "aval": en vez de
   pedirle algo al partido, aquí es el jugador quien arma su propia red de lealtades. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const MARGEN_PESO = 12;     // cuánto peso interno de ventaja necesita el jugador para apadrinar
  const UMBRAL_CUPO = 25;     // lealtad mínima del protegido para poder pedirle un cupo
  const ENFRIAMIENTO_APOYO = 10;  // semanas entre dos apadrinamientos al mismo protegido
  const ENFRIAMIENTO_CUPO = 12;   // semanas entre dos cupos pedidos al mismo protegido

  const Pad = {
    asegurar(E) { E.jugador.protegidos = E.jugador.protegidos || {}; return E.jugador.protegidos; },
    /* Un protegido puede repartir un cupo real si ejerce un cargo (no basta con ser aspirante) o
       si dirige el partido, aunque hoy no tenga curul ni cargo ejecutivo. */
    puedeRepartir(E, pol) {
      if (pol.cargo && pol.cargo.tipo && pol.cargo.tipo !== 'aspirante') return true;
      const pa = E.partidos[pol.partido];
      return !!(pa && pa.lider === pol.id);
    },
    /* Copartidarios que el jugador puede apadrinar: de su mismo partido, activos, con menos peso
       interno que él (con margen), que no sea ya un protegido reciente. */
    candidatosApadrinar(E) {
      const J = E.jugador, prot = Pad.asegurar(E);
      if (!J.partido) return [];
      const pesoJ = C.Partidos.peso(E, E.politicos.J).nac;
      return C.Partidos.miembros(E, J.partido).filter(p => {
        if (p.id === 'J') return false;
        const peso = C.Partidos.peso(E, p).nac;
        if (pesoJ - peso < MARGEN_PESO) return false;
        const ya = prot[p.id];
        if (ya && E.fecha.t - (ya.ultimoApoyo || 0) < ENFRIAMIENTO_APOYO) return false;
        return true;
      }).sort((a, b) => C.Partidos.peso(E, b).nac - C.Partidos.peso(E, a).nac).slice(0, 8);
    },
    apadrinar(E, polId) {
      const J = E.jugador, pol = E.politicos[polId]; if (!pol) return { ok: false, msg: 'Ese político ya no existe' };
      const prot = Pad.asegurar(E);
      pol.fuerza = U.clamp(pol.fuerza + U.rf(6, 12), 5, 100);
      pol.relJ = U.clamp((pol.relJ || 0) + 10, -100, 100);
      const ya = prot[polId] || { relJ: 0, cupos: 0, ultimoCupo: null };
      ya.relJ = U.clamp(ya.relJ + 18, 0, 100);
      ya.ultimoApoyo = E.fecha.t;
      prot[polId] = ya;
      C.Politicos.anotar(pol, `Recibe el respaldo público de ${J.nombre}`);
      const pa = E.partidos[pol.partido];
      C.Medios.noticia(E, { tipo: 'partidos', titular: `${J.nombre} respalda públicamente a ${pol.nombre} dentro del ${pa ? pa.sigla : 'partido'}`, tono: 1, jugador: true });
      return { ok: true, msg: `Apadrinas a ${pol.nombre}: gana arrastre y queda en tu red de protegidos` };
    },
    /* Protegidos vivos/activos, con el político real detrás de cada entrada */
    misProtegidos(E) {
      return Object.entries(Pad.asegurar(E)).map(([id, r]) => ({ id, r, pol: E.politicos[id] })).filter(x => x.pol && x.pol.activo);
    },
    /* A quién puede beneficiar un cupo: copartidarios sin cargo propio (para darles una plataforma)
       y los hijos adultos del jugador (para conseguirles un puesto). */
    beneficiariosCupo(E) {
      const J = E.jugador;
      C.Familia.asegurarDatos(E);
      const copartidarios = J.partido ? Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.partido === J.partido && (!p.cargo || p.cargo.tipo === 'aspirante')).slice(0, 10) : [];
      const hijos = C.Familia.hijos(E).filter(f => C.Familia.adulto(f));
      return { copartidarios, hijos };
    },
    puedeCupo(E, protId) {
      const prot = Pad.asegurar(E)[protId]; if (!prot) return 'No es tu protegido';
      const pol = E.politicos[protId]; if (!pol || !pol.activo) return 'Ya no está activo en la política';
      if (prot.relJ < UMBRAL_CUPO) return 'Aún no confía lo suficiente en ti para pedirle un favor';
      if (prot.ultimoCupo != null && E.fecha.t - prot.ultimoCupo < ENFRIAMIENTO_CUPO) return 'Ya le pediste un cupo hace poco: espera unas semanas';
      if (!Pad.puedeRepartir(E, pol)) return 'Hoy no tiene ningún cargo ni dirección con el que darte un cupo';
      return true;
    },
    pedirCupo(E, protId, destinoTipo, destinoId) {
      const J = E.jugador, prot = Pad.asegurar(E)[protId], pol = E.politicos[protId];
      const nivel = ['gobernador', 'alcalde', 'diputado', 'concejal'].includes(pol.cargo && pol.cargo.tipo) ? 'dep' : 'nac';
      const peso = C.Partidos.peso(E, pol)[nivel];
      const prob = U.clamp(0.15 + prot.relJ / 130 + peso / 300, 0.1, 0.85);
      const exito = U.chance(prob);
      prot.ultimoCupo = E.fecha.t;
      if (!exito) {
        prot.relJ = U.clamp(prot.relJ - 6, 0, 100);
        return { ok: true, exito: false, msg: `${pol.nombre} no logra conseguirte el cupo esta vez` };
      }
      prot.relJ = U.clamp(prot.relJ - 14, 0, 100);
      prot.cupos = (prot.cupos || 0) + 1;
      let msg;
      if (destinoTipo === 'familia') {
        C.Familia.asegurarDatos(E);
        const hijo = J.familia.find(f => f.id === destinoId); if (!hijo) return { ok: false, msg: 'Elige a un hijo' };
        hijo.relacion = U.clamp(hijo.relacion + 8, 0, 100);
        hijo.atributos.gestion = U.clamp(hijo.atributos.gestion + 4, 0, 100);
        const monto = U.rf(20, 45);
        J.patrimonio += monto;
        hijo.empleo = { puesto: `contrato con ${pol.nombre}`, t: E.fecha.t };
        msg = `${pol.nombre} le consigue un puesto a ${hijo.nombre}: +${U.d1(monto)} millones para la familia`;
        if (U.chance(0.15)) {
          J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + U.ri(3, 8), 0, 100);
          C.Medios.noticia(E, { tipo: 'escandalo', titular: `Cuestionan el nombramiento de ${hijo.nombre}, ${hijo.rol === 'Hija' ? 'hija' : 'hijo'} de ${J.nombre}, por posible nepotismo`, tono: -1, jugador: true });
        }
      } else {
        const ali = E.politicos[destinoId]; if (!ali) return { ok: false, msg: 'Elige a un copartidario' };
        ali.fuerza = U.clamp(ali.fuerza + U.rf(10, 18), 5, 100);
        ali.relJ = U.clamp((ali.relJ || 0) + 8, -100, 100);
        C.Politicos.anotar(ali, `Consigue una plataforma gracias a ${pol.nombre}`);
        msg = `${pol.nombre} le abre paso a ${ali.nombre} dentro del partido`;
      }
      return { ok: true, exito: true, msg };
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'apadrinar', nombre: 'Apadrinar', icono: '🤝', grupo: 'partidos', costo: 2,
        disponible(E, a) {
          const pol = E.politicos[a.pol]; if (!pol || !pol.activo) return 'Ese político ya no existe';
          if (!Pad.candidatosApadrinar(E).some(p => p.id === a.pol)) return 'Ya no puedes apadrinarlo ahora mismo';
          return true;
        },
        ejecutar(E, a) { return Pad.apadrinar(E, a.pol); } });
      A.registrar({ id: 'pedirCupo', nombre: 'Pedir un cupo', icono: '🎟', grupo: 'partidos', costo: 1,
        disponible(E, a) { return Pad.puedeCupo(E, a.prot); },
        ejecutar(E, a) {
          const [tipo, id] = (a.destino || '').split(':');
          if (!tipo || !id) return { ok: false, msg: 'Elige a quién beneficiar' };
          return Pad.pedirCupo(E, a.prot, tipo, id);
        } });
    }
  };

  C.Padrinazgo = Pad;
  Pad.registrarAcciones();
})(window.CURUL);
