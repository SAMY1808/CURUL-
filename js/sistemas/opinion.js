/* Opinión pública: aprobación presidencial, imagen del jugador por segmento y región, encuestas. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const SEGMENTOS = {
    edad:  [ ['jovenes','18-28 años',-20,-40,.26], ['adultos','29-55 años',5,5,.49], ['mayores','56+ años',20,35,.25] ],
    nivel: [ ['bajos','Estratos 1-2',-25,15,.46], ['medios','Estratos 3-4',5,0,.40], ['altos','Estratos 5-6',35,-5,.14] ],
    educ:  [ ['basica','Básica',-10,25,.35], ['media','Media',0,5,.40], ['universitarios','Universitaria',0,-30,.25] ],
    zona:  [ ['urbano','Urbano',0,-10,.77], ['rural','Rural',-5,30,.23] ],
    sector:[ ['formales','Empleo formal',10,0,.42], ['informales','Informales',-15,15,.46], ['estudiantes','Estudiantes',-25,-35,.12] ]
  };
  const DIM = { edad: 'Edad', nivel: 'Nivel socioeconómico', educ: 'Nivel educativo', zona: 'Urbano / rural', sector: 'Sector laboral' };
  const TEMAS = { seguridad: 'Seguridad', economia: 'Economía', salud: 'Salud', corrupcion: 'Lucha contra la corrupción' };

  const O = {
    SEGMENTOS, DIM, TEMAS,
    init(E) {
      E.opinion = { aprobacionPres: 52, luna: 26, escandalos: 0, corrupcionAcum: 0, encuestas: [], ultimaEncuesta: null,
        aprobTemas: { seguridad: 50, economia: 50, salud: 50, corrupcion: 50 } };
    },
    /* Objetivo hacia el que converge la aprobación de cada tema, según los indicadores que le dan sustento. */
    objetivoTema(E, tema) {
      const Ev = E.economia;
      if (tema === 'seguridad') return U.prom(Object.values(E.deptos).map(d => d.seguridad));
      if (tema === 'economia') return U.clamp(50 - (Ev.desempleo - 9.5) * 2.2 - (Ev.inflacion - 4) * 2 + (Ev.crecimiento - 2.5) * 3.5, 3, 95);
      if (tema === 'salud') return U.prom(Object.values(E.deptos).map(d => d.salud));
      if (tema === 'corrupcion') return U.clamp(58 - E.opinion.escandalos * 6 - (E.opinion.corrupcionAcum || 0) * 3, 3, 92);
      return 50;
    },
    /* Favorabilidad (0-100) del jugador en un segmento */
    favSegmento(E, segId) {
      const J = E.jugador; let s = null;
      for (const dim of Object.values(SEGMENTOS)) for (const x of dim) if (x[0] === segId) s = x;
      const fit = 1 - U.distIdeo(J.ideologia, { eco: s[2], soc: s[3] }) * 2;
      return U.clamp(42 + fit * 18 + (J.imagen.seg[segId] || 0) + (J.credibilidad - 50) * 0.25 + (J.rep.cercania - 50) * 0.1, 3, 97);
    },
    favDepto(E, dId) {
      const J = E.jugador, d = E.deptos[dId];
      const fit = 1 - Math.abs(d.incl * 70 - J.ideologia.eco) / 140;
      const local = (J.residencia === dId ? 8 : 0) + (J.nacimiento === dId ? 5 : 0);
      return U.clamp(38 + fit * 22 + local + (J.imagen.dep[dId] || 0) + (J.credibilidad - 50) * 0.25, 3, 97);
    },
    recDepto(E, dId) {
      const J = E.jugador;
      const local = (J.residencia === dId ? 22 : 0) + (J.nacimiento === dId ? 10 : 0);
      return U.clamp(J.reconocimiento * 0.8 + local + (J.imagen.rec[dId] || 0), 0, 99);
    },
    favorabilidad(E) {
      let tot = 0; for (const x of SEGMENTOS.nivel) tot += O.favSegmento(E, x[0]) * x[4];
      return tot;
    },
    /* Aprobación presidencial por departamento */
    aprobDepto(E, dId) {
      const d = E.deptos[dId], pa = E.partidos[E.gobierno.partido];
      const fit = pa ? 1 - Math.abs(d.incl * 70 - pa.eco) / 140 : 0.5;
      return U.clamp(E.opinion.aprobacionPres + (fit - 0.6) * 30 + (d.seguridad - 50) * 0.1 + (d.ajusteAprob || 0), 3, 97);
    },
    /* Sube el reconocimiento con rendimientos decrecientes: ser conocido por todos es difícil */
    subirRec(E, x) {
      const J = E.jugador;
      J.reconocimiento = U.clamp(J.reconocimiento + (x > 0 ? x * Math.pow(1 - J.reconocimiento / 100, 1.3) : x), 0, 100);
    },
    /* Mueve la imagen del jugador en segmentos/departamentos */
    moverImagen(E, cambios) {
      const J = E.jugador;
      for (const [k, v] of Object.entries(cambios.seg || {})) J.imagen.seg[k] = U.clamp((J.imagen.seg[k] || 0) + v, -30, 30);
      for (const [k, v] of Object.entries(cambios.dep || {})) J.imagen.dep[k] = U.clamp((J.imagen.dep[k] || 0) + v, -30, 30);
      for (const [k, v] of Object.entries(cambios.rec || {})) J.imagen.rec[k] = U.clamp((J.imagen.rec[k] || 0) + v, 0, 60);
    },

    turno(E) {
      const O_ = E.opinion, Ev = E.economia;
      const seg = U.prom(Object.values(E.deptos).map(d => d.seguridad));
      let objetivo = 46 - (Ev.desempleo - 9.5) * 1.6 - (Ev.inflacion - 4) * 1.6 + (Ev.crecimiento - 2.5) * 2
                   + (seg - 50) * 0.25 - O_.escandalos * 2 + (Ev.confianza - 40) * 0.2;
      if (O_.luna > 0) { objetivo += O_.luna * 0.35; O_.luna -= 1; }
      O_.escandalos = Math.max(0, O_.escandalos - 0.03);
      O_.aprobacionPres += (objetivo - O_.aprobacionPres) * 0.04 + U.gauss(0, 0.35);
      O_.aprobacionPres = U.clamp(O_.aprobacionPres, 5, 90);
      U.serie('aprobacion', O_.aprobacionPres);
      O_.corrupcionAcum = Math.max(0, (O_.corrupcionAcum || 0) - 0.02);
      for (const tema of Object.keys(TEMAS)) {
        const obj = O.objetivoTema(E, tema);
        O_.aprobTemas[tema] += (obj - O_.aprobTemas[tema]) * 0.05 + U.gauss(0, 0.4);
        O_.aprobTemas[tema] = U.clamp(O_.aprobTemas[tema], 3, 95);
        U.serie('aprobTema:' + tema, O_.aprobTemas[tema]);
      }

      // Imagen del jugador: el reconocimiento se erosiona si no hay actividad pública
      const J = E.jugador;
      J.reconocimiento = U.clamp(J.reconocimiento - 0.04 - J.reconocimiento * 0.0025, 0, 100);
      for (const k of Object.keys(J.imagen.seg)) J.imagen.seg[k] *= 0.995;
      for (const k of Object.keys(J.imagen.dep)) J.imagen.dep[k] *= 0.995;
      J.popularidad = O.favorabilidad(E);
      U.serie('jug:favorabilidad', J.popularidad);
      U.serie('jug:reconocimiento', J.reconocimiento);

      // Las encuestas periódicas las hace ahora el sistema de Encuestas (js/sistemas/encuestas.js).
    }
  };

  C.Opinion = O;
  C.Tiempo.registrar('opinion', O, 20);
})(window.CURUL);
