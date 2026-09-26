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
      const corp = { miembros, anio: U.anio(), historial: [], ultimoVoto: null };
      d.corporaciones[organo] = corp;
      return corp;
    },
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
      }
      return { corp, depto, organo };
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
    }
  };
  C.Corporaciones = Co;
  Co.registrarAcciones();
  C.Bus.on('jugador:cargo', tipo => { if (tipo === 'diputado' || tipo === 'concejal') Co.asegurarJugador(C.E); });
})(window.CURUL);
