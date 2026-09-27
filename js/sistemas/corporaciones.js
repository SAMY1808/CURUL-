/* Asambleas Departamentales y Concejos Municipales: corporaciones locales con miembros elegidos
   de verdad (misma cifra repartidora que el Congreso, sobre las cuotas de voto del departamento)
   y una votación nominal real para decisiones que necesitan su visto bueno (p. ej. crear una
   secretaría nueva). Igual que el resto de gobierno local, sólo se generan para el departamento
   donde el JUGADOR ejerce, de forma perezosa, para no disparar el tamaño de la partida. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const Co = {
    /* Número de escaños según la población (aprox. a los rangos reales de asambleas y concejos). */
    escanos(E, depto, organo) {
      const d = E.deptos[depto];
      const gobernacion = organo === 'gobernacion';
      const pob = gobernacion ? d.poblacion : C.GobiernoLocal.poblacionCapital(d);
      const base = gobernacion ? 11 : 7, tope = gobernacion ? 31 : 21, k = gobernacion ? 60 : 25, esc = gobernacion ? 3 : 2.2;
      return U.clamp(Math.round(base + Math.log2(Math.max(1, pob) / k) * esc), base, tope);
    },
    /* Crea (si no existe) la corporación, con miembros elegidos por cifra repartidora sobre las
       cuotas de voto reales del departamento. */
    asegurar(E, depto, organo) {
      const d = E.deptos[depto];
      d.corporaciones = d.corporaciones || {};
      if (d.corporaciones[organo]) return d.corporaciones[organo];
      const N = Co.escanos(E, depto, organo);
      const votos = C.Elecciones.cuotas(E, depto, true);
      const cur = C.Elecciones.dhondt(votos, N, 0);
      const miembros = [];
      const tipo = organo === 'gobernacion' ? 'diputado' : 'concejal';
      for (const [pid, n] of Object.entries(cur)) {
        for (let i = 0; i < n; i++) miembros.push(C.Politicos.crear(E, { partido: pid, depto, cargo: { tipo, depto } }).id);
      }
      const corp = { miembros, anio: U.anio(), historial: [], ultimoVoto: null, mesa: {}, mesaPendiente: null };
      d.corporaciones[organo] = corp;
      Co.resolverMesaSinJugador(E, depto, organo);
      return corp;
    },
    nombreCorp: organo => organo === 'gobernacion' ? 'la Asamblea' : 'el Concejo',
    miembros(E, depto, organo) { return Co.asegurar(E, depto, organo).miembros.map(id => E.politicos[id]).filter(Boolean); },
    mayoria(E, depto, organo) { return Math.floor(Co.miembros(E, depto, organo).length / 2) + 1; },
    /* Probabilidad individual (0-1) de que un diputado/concejal apoye al jugador en una votación,
       usada tanto para simular el voto real como para dar una estimación informativa previa. */
    probApoyo(E, pol) {
      const J = E.jugador;
      const pa = E.partidos[pol.partido];
      const afin = pa ? (pa.id === J.partido ? 0.85 : 1 - U.distIdeo(pa, E.partidos[J.partido] || pa)) : 0.5;
      return U.clamp(0.22 + afin * 0.58 + (J.atributos.negociacion / 100) * 0.16 + (pol.relJ || 0) / 300, 0.04, 0.95);
    },
    apoyoEsperado(E, depto, organo) {
      const m = Co.miembros(E, depto, organo);
      return m.length ? U.prom(m.map(p => Co.probApoyo(E, p))) : 0.5;
    },
    /* Votación nominal real: cada miembro vota según su afinidad, con asistencia e independencia
       propias (no es un simple lanzamiento de moneda global: cada curul cuenta). Si `autor` es
       un miembro de la corporación (p. ej. el jugador, cuando radica su propia iniciativa), su
       voto se cuenta como "sí": nadie vota en contra de su propia propuesta. */
    votar(E, depto, organo, asunto, autor) {
      const corp = Co.asegurar(E, depto, organo);
      const miembros = Co.miembros(E, depto, organo);
      const votos = {};
      for (const pol of miembros) {
        if (pol.id === autor) { votos[pol.id] = 'si'; continue; }
        if (!U.chance(pol.asistencia)) { votos[pol.id] = 'aus'; continue; }
        votos[pol.id] = U.chance(Co.probApoyo(E, pol)) ? 'si' : 'no';
      }
      const si = Object.values(votos).filter(v => v === 'si').length;
      const no = Object.values(votos).filter(v => v === 'no').length;
      const aus = miembros.length - si - no;
      const aprobado = si > no;
      const res = { asunto, votos, si, no, aus, aprobado, t: E.fecha.t };
      corp.ultimoVoto = res;
      corp.historial.unshift(res); if (corp.historial.length > 15) corp.historial.pop();
      return res;
    },
    hemiciclo(E, depto, organo, o = {}) {
      const miembros = Co.miembros(E, depto, organo);
      const corp = Co.asegurar(E, depto, organo);
      const votos = corp.ultimoVoto ? corp.ultimoVoto.votos : null;
      return C.Hemiciclo.svg(E, 'local', Object.assign({ miembros, modo: votos ? 'voto' : 'partido', votos,
        centroTxt: miembros.length, centroSub: (organo === 'gobernacion' ? 'DIPUTADOS' : 'CONCEJALES') + ' · MAYORÍA ' + Co.mayoria(E, depto, organo) }, o));
    },

    /* ── El jugador como diputado o concejal ──────────────────────────────────────────────────
       Si el jugador ejerce como diputado o concejal, se le inserta como miembro real de su
       propia Asamblea o Concejo (reemplazando a un colega de su mismo partido, o al primero de
       la lista si no hay ninguno), en vez de quedarse fuera mirando desde afuera. */
    ACTO: { gobernacion: 'Ordenanza', alcaldia: 'Acuerdo' },
    corpDe(J) { return J.cargo === 'diputado' ? 'gobernacion' : J.cargo === 'concejal' ? 'alcaldia' : null; },
    asegurarJugador(E) {
      const J = E.jugador, organo = Co.corpDe(J); if (!organo) return null;
      const depto = J.cargoInfo.depto || J.residencia;
      const corp = Co.asegurar(E, depto, organo);
      if (!corp.miembros.includes('J')) {
        let i = corp.miembros.findIndex(id => E.politicos[id] && E.politicos[id].partido === J.partido);
        if (i < 0) i = 0;
        corp.miembros[i] = 'J';
        // Al llegar el jugador a la corporación, se abre la elección de su mesa directiva: puede
        // disputarla en vez de que quede siempre en manos de otro, igual que en el Congreso.
        Co.abrirPostulacionMesa(E, depto, organo);
      }
      return { corp, depto, organo };
    },

    /* ── Mesa directiva de la Asamblea o el Concejo ──────────────────────────────────────────
       Mismo espíritu que la mesa del Senado/Cámara (Congreso.elegirMesas): si el jugador es
       miembro, puede pedir el aval de su partido o postularse de forma autónoma en vez de que se
       resuelva siempre sin él. Usa el peso interno DEPARTAMENTAL del jugador (Partidos.peso().dep),
       no el nacional, porque esto se juega en su propio departamento o municipio. */
    abrirPostulacionMesa(E, depto, organo) {
      const corp = Co.asegurar(E, depto, organo);
      corp.mesaPendiente = { t: E.fecha.t };
    },
    mejorPerfil(arr) { return arr.slice().sort((a, b) => (b.r.exp + b.r.amb + U.ri(0, 40)) - (a.r.exp + a.r.amb + U.ri(0, 40)))[0]; },
    resolverMesaSinJugador(E, depto, organo) {
      const corp = Co.asegurar(E, depto, organo);
      const ms = Co.miembros(E, depto, organo).filter(p => p.id !== 'J');
      const pres = Co.mejorPerfil(ms);
      const vice1 = Co.mejorPerfil(ms.filter(p => p !== pres && p.partido !== (pres || {}).partido));
      const vice2 = Co.mejorPerfil(ms.filter(p => p !== pres && p !== vice1));
      corp.mesa = { presidente: pres && pres.id, vice1: vice1 && vice1.id, vice2: vice2 && vice2.id, desde: E.fecha.t };
      corp.mesaPendiente = null;
    },
    probAvalLocal(E, depto) {
      const J = E.jugador, pa = E.partidos[J.partido]; if (!pa) return 0.1;
      const peso = C.Partidos.peso(E, E.politicos.J).dep;
      return U.clamp(0.15 + peso / 140 + (pa.relJ || 0) / 220, 0.05, 0.85);
    },
    resolverMesaConJugador(E, depto, organo, via) {
      const corp = Co.asegurar(E, depto, organo), J = E.jugador;
      const ms = Co.miembros(E, depto, organo).filter(p => p.id !== 'J');
      const rival1 = Co.mejorPerfil(ms);
      const rival2 = Co.mejorPerfil(ms.filter(p => p !== rival1 && p.partido !== (rival1 || {}).partido));
      const pesoJ = C.Partidos.peso(E, E.politicos.J).dep;
      const fuerzaJ = (pesoJ * 0.5 + J.reconocimiento * 0.3 + J.atributos.carisma * 0.2) * (via === 'aval' ? 1.25 : 0.75);
      const cand = [{ id: 'J', fuerza: fuerzaJ }];
      if (rival1) cand.push({ id: rival1.id, fuerza: rival1.r.exp * 0.6 + rival1.r.amb * 0.3 + rival1.r.car * 0.1 });
      if (rival2 && rival2 !== rival1) cand.push({ id: rival2.id, fuerza: rival2.r.exp * 0.6 + rival2.r.amb * 0.3 + rival2.r.car * 0.1 });
      const pesos = cand.map(c => Math.pow(c.fuerza + 5, 1.4) * Math.exp(U.gauss(0, 0.25)));
      const tot = U.suma(pesos);
      cand.forEach((c, i) => c.pct = pesos[i] / tot * 100);
      cand.sort((a, b) => b.pct - a.pct);
      const ganador = cand[0].id;
      const ms2 = Co.miembros(E, depto, organo).filter(p => p.id !== 'J' && p.id !== ganador);
      const vice1 = Co.mejorPerfil(ms2.filter(p => p.partido !== (ganador === 'J' ? J.partido : E.politicos[ganador].partido)));
      const vice2 = Co.mejorPerfil(ms2.filter(p => p !== vice1));
      corp.mesa = { presidente: ganador, vice1: vice1 && vice1.id, vice2: vice2 && vice2.id, desde: E.fecha.t };
      corp.mesaPendiente = null;
      const pa = E.partidos[J.partido], nombreCorp = Co.nombreCorp(organo);
      if (ganador === 'J') {
        J.reconocimiento = U.clamp(J.reconocimiento + 5, 0, 100);
        J.rep.liderazgo = U.clamp(J.rep.liderazgo + 3, 0, 100);
        if (pa) pa.relJ = U.clamp((pa.relJ || 0) + (via === 'aval' ? 5 : -2), -100, 100);
        C.Medios.noticia(E, { tipo: 'regional', titular: `${J.nombre} es elegido presidente de ${nombreCorp}${via === 'autonoma' ? ', sin el respaldo de su partido' : ''}`, tono: 1, importante: true, jugador: true });
      } else {
        const ganadorPol = E.politicos[ganador];
        C.Medios.noticia(E, { tipo: 'regional', titular: `${ganadorPol.nombre} es elegido presidente de ${nombreCorp}, no ${J.nombre}`, tono: 0, jugador: true });
      }
      return { ganador };
    },
    /* Radica una ordenanza o un acuerdo: se somete a votación nominal real (el jugador vota sí,
       por ser el autor) y, si se aprueba, tiene un efecto concreto sobre el departamento. */
    proponer(E, titulo, sector) {
      const J = E.jugador, organo = Co.corpDe(J); if (!organo) return null;
      const depto = J.cargoInfo.depto || J.residencia;
      const EFECTO = { salud: 'salud', educacion: 'educacion', infraestructura: 'infraestructura', gobierno: 'seguridad' };
      const voto = Co.votar(E, depto, organo, titulo, 'J');
      const d = E.deptos[depto];
      const campo = EFECTO[sector];
      let magnitud = 0;
      if (voto.aprobado && campo && d[campo] != null) { magnitud = U.rf(1.2, 2.8); d[campo] = U.clamp(d[campo] + magnitud, 1, 99); }
      if (voto.aprobado) { J.rep.liderazgo = U.clamp(J.rep.liderazgo + 0.5, 0, 100); C.Opinion.moverImagen(E, { dep: { [depto]: 1 } }); }
      const acto = Co.ACTO[organo];
      C.Politicos.anotar(E.politicos.J, `Radica ${titulo}`);
      C.Medios.noticia(E, { tipo: 'regional', titular: `${voto.aprobado ? 'Se aprueba' : 'Se hunde'} ${acto === 'Ordenanza' ? 'la ordenanza' : 'el acuerdo'} «${titulo}» (${voto.si}-${voto.no})`, tono: voto.aprobado ? 1 : -1, jugador: true });
      return { voto, magnitud, campo };
    },
    /* Si el jugador deja pasar demasiado tiempo sin decidir, la mesa se resuelve sin él. */
    turno(E) {
      for (const d of Object.values(E.deptos)) {
        if (!d.corporaciones) continue;
        for (const organo of Object.keys(d.corporaciones)) {
          const corp = d.corporaciones[organo];
          if (corp.mesaPendiente && E.fecha.t - corp.mesaPendiente.t >= 3) Co.resolverMesaSinJugador(E, d.id, organo);
        }
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'proponerOrdenanza', nombre: 'Radicar ordenanza/acuerdo', icono: '📜', grupo: 'corporacion', costo: 2,
        disponible(E, a) { return Co.corpDe(E.jugador) ? true : 'No ejerces como diputado ni concejal'; },
        ejecutar(E, a) {
          const titulo = (a.titulo || '').trim(); if (!titulo) return { ok: false, msg: 'Dale un título a tu propuesta' };
          const sector = C.DATA.sectores[a.sector] ? a.sector : 'politica';
          const r = Co.proponer(E, titulo, sector);
          return { ok: true, msg: `${r.voto.aprobado ? 'Se aprueba' : 'Se hunde'} tu propuesta (${r.voto.si}-${r.voto.no})` };
        } });
      const hayPostulacion = (E, a) => {
        const organo = Co.corpDe(E.jugador); if (!organo || organo !== a.organo) return 'No perteneces a esa corporación';
        const depto = E.jugador.cargoInfo.depto || E.jugador.residencia;
        return Co.asegurar(E, depto, organo).mesaPendiente ? true : 'No hay una elección de mesa directiva abierta';
      };
      A.registrar({ id: 'postularMesaAvalLocal', nombre: 'Pedir aval del partido', icono: '🎗', grupo: 'corporacion', costo: 1,
        disponible: hayPostulacion,
        ejecutar(E, a) {
          const depto = E.jugador.cargoInfo.depto || E.jugador.residencia;
          const J = E.jugador, pa = E.partidos[J.partido];
          const exito = U.chance(Co.probAvalLocal(E, depto));
          if (pa) pa.relJ = U.clamp((pa.relJ || 0) + (exito ? 4 : -2), -100, 100);
          C.Medios.noticia(E, { tipo: 'partidos', titular: exito ? `El ${pa ? pa.sigla : ''} respalda a ${J.nombre} para presidir ${Co.nombreCorp(a.organo)}` : `El ${pa ? pa.sigla : ''} no respalda a ${J.nombre} para la mesa directiva`, tono: exito ? 1 : -1, jugador: true });
          Co.resolverMesaConJugador(E, depto, a.organo, exito ? 'aval' : 'autonoma');
          return { ok: true, msg: exito ? 'Tu partido te avala: te postulas con su respaldo' : 'Tu partido no te avala, pero igual te postulas de forma autónoma', exito };
        } });
      A.registrar({ id: 'postularMesaAutonomaLocal', nombre: 'Postularme de forma autónoma', icono: '🚩', grupo: 'corporacion', costo: 1,
        disponible: hayPostulacion,
        ejecutar(E, a) {
          const depto = E.jugador.cargoInfo.depto || E.jugador.residencia;
          Co.resolverMesaConJugador(E, depto, a.organo, 'autonoma');
          return { ok: true, msg: 'Te postulas de forma autónoma, sin pedirle nada a tu partido' };
        } });
      A.registrar({ id: 'noPostularseMesaLocal', nombre: 'No postularme', icono: '➖', grupo: 'corporacion', costo: 0,
        disponible: hayPostulacion,
        ejecutar(E, a) {
          const depto = E.jugador.cargoInfo.depto || E.jugador.residencia;
          Co.resolverMesaSinJugador(E, depto, a.organo);
          return { ok: true, msg: 'No te postulas a la mesa directiva esta vez' };
        } });
    }
  };
  C.Corporaciones = Co;
  Co.registrarAcciones();
  C.Tiempo.registrar('corporaciones', Co, 56);
  C.Bus.on('jugador:cargo', tipo => { if (tipo === 'diputado' || tipo === 'concejal') Co.asegurarJugador(C.E); });
})(window.CURUL);
