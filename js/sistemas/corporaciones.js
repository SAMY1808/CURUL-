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
       propias (no es un simple lanzamiento de moneda global: cada curul cuenta). */
    votar(E, depto, organo, asunto) {
      const corp = Co.asegurar(E, depto, organo);
      const miembros = Co.miembros(E, depto, organo);
      const votos = {};
      for (const pol of miembros) {
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
    }
  };
  C.Corporaciones = Co;
})(window.CURUL);
