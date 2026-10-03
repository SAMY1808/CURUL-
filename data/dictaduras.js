/* Dictaduras históricas (Fase 42). Cada una tiene fecha de inicio, un régimen de partida y un guion de hitos con
   fecha: `est` cambia el estado del régimen (siempre se aplica, también si la partida empieza a mitad de la dictadura)
   y `fn` cuenta la historia (noticias y eventos; sólo si el hito ocurre «en vivo»). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const noti = (E, txt, tono) => C.Medios.noticia(E, { tipo: 'gobierno', titular: txt, tono: tono || 0, importante: true, jugador: true });
  const R = E => E.regimen;
  const j = E => R(E).junta;
  const ev = (E, id) => { if (!E.eventos.pendientes.length && !E.meta.presim) C.Eventos.disparar(E, C.Eventos.plantilla(id), { forzar: true }); };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const mover = (E, k, d) => { const x = j(E); if (x) x[k] = cl(x[k] + d, 0, 100); };
  const T = (y, m, d) => C.U.turnoDe(new Date(Date.UTC(y, m, d)));

  C.DATA.dictaduras = [
    { id: 'rojas', nombre: 'Dictadura del general Rojas Pinilla (1953-1957) y Junta Militar (1957-1958)', corto: 'Rojas Pinilla', icono: '🎖',
      lider: 'Gral. Gustavo Rojas Pinilla', inicio: [1953, 5, 13], fin: [1958, 7, 7], prob: 88, libertad: 42,
      desc: 'El 13 de junio de 1953 el comandante del Ejército derroca al presidente Laureano Gómez «para pacificar el país». Promete paz y obras; poco a poco cierra la prensa, reprime a los estudiantes y se perpetúa en el poder, hasta que un paro cívico lo tumba en mayo de 1957. Una Junta Militar prepara el plebiscito y las elecciones del Frente Nacional.',
      junta: { legit: 66, repres: 20, resistencia: 8, aislamiento: 6, censura: 20 },
      titular: 'GOLPE DE OPINIÓN: el general Gustavo Rojas Pinilla derroca al presidente y asume el poder «para pacificar el país»',
      guion: [
        { f: [1953, 5, 20], est: E => mover(E, 'legit', 5), fn: E => noti(E, 'Rojas Pinilla decreta la amnistía para las guerrillas liberales: miles de campesinos entregan las armas', 1) },
        { f: [1954, 5, 9], est: E => { mover(E, 'legit', -6); mover(E, 'resistencia', 8); mover(E, 'repres', 8); }, fn: E => { noti(E, 'Masacre de estudiantes en Bogotá: el Ejército dispara contra una marcha universitaria', -1); ev(E, 'rg_h_estudiantes'); } },
        { f: [1954, 8, 1], est: E => { R(E).constituyente = true; E.constitucion.articulos.reeleccion = 'permitida'; mover(E, 'legit', -2); }, fn: E => noti(E, 'La Asamblea Nacional Constituyente nombrada por el régimen sesiona sin elecciones y prolonga el mandato de Rojas', -1) },
        { f: [1954, 9, 15], est: E => { mover(E, 'repres', 4); mover(E, 'resistencia', 2); }, fn: E => noti(E, 'Un acto legislativo proscribe el comunismo y refuerza la persecución política', -1) },
        { f: [1955, 5, 1], est: E => { mover(E, 'censura', 25); mover(E, 'legit', -3); mover(E, 'resistencia', 3); if (C.Poderes) C.Poderes.mover(E, 'prensa', -12); }, fn: E => { noti(E, 'La dictadura clausura El Tiempo y asedia a la prensa liberal', -1); ev(E, 'rg_h_prensa'); } },
        { f: [1956, 7, 7], est: E => mover(E, 'legit', -2), fn: E => noti(E, 'Explotan siete camiones del Ejército cargados de dinamita en Cali: cientos de muertos', -1) },
        { f: [1957, 1, 1], est: E => { mover(E, 'resistencia', 12); mover(E, 'legit', -6); }, fn: E => noti(E, 'Pacto de Benidorm: Alberto Lleras y Laureano Gómez sellan la alianza liberal-conservadora contra Rojas', 0) },
        { f: [1957, 3, 1], est: E => { mover(E, 'legit', -10); mover(E, 'resistencia', 14); }, fn: E => noti(E, 'La Constituyente reelige a Rojas hasta 1962: el país se levanta contra la perpetuación', -1) },
        { f: [1957, 4, 6], est: E => { const x = j(E); if (x) { x.resistencia = Math.max(x.resistencia, 82); x.legit = Math.min(x.legit, 24); } }, fn: E => noti(E, 'PARO CÍVICO NACIONAL: bancos, comercio y transporte se paralizan en todo el país', -1) },
        { f: [1957, 4, 10], est: E => { const x = j(E); if (!x) return; x.nombre = 'Junta Militar de Gobierno (Gral. Gabriel París Gordillo)'; if (x.lider !== 'J') { const g = C.Regimen.crearGeneral(E, 'Gral. Gabriel París Gordillo'); x.lider = g.id; C.Regimen.instalarGobierno(E, g.id); } x.legit = 58; x.repres = 12; x.resistencia = 14; x.censura = 8; x.aislamiento = 4; R(E).libertad = Math.max(R(E).libertad, 55); R(E).dictadura.nombre = 'Junta Militar (1957-1958)'; if (!R(E).transicion) R(E).transicion = { fase: 'apertura', t0: E.fecha.t, motivo: 'la caída de Rojas Pinilla', mesa: null, tutela: 0, guion: true }; },
          fn: E => noti(E, 'Rojas Pinilla renuncia y parte al exilio: una Junta Militar de cinco generales asume el poder y promete elecciones', 1) },
        { f: [1957, 11, 1], est: E => { const r = R(E); if (!r.transicion || r.transicion.fase === 'apertura') { if (!r.transicion) r.transicion = { fase: 'apertura', t0: E.fecha.t, motivo: 'el plebiscito', mesa: null, tutela: 0 }; r.transicion.guion = true; r.transicion.fase = 'electoral'; r.transicion.mesa = null; r.transicion.elecciones = T(1958, 4, 4); r.transicion.posesion = T(1958, 7, 7); r.transicion.tutela = 15; r.libertad = Math.max(r.libertad, 60); C.Mesa && (E.mesas.activas = E.mesas.activas.filter(m => m.tipo !== 'transicion')); } },
          fn: E => noti(E, 'Plebiscito del 1.º de diciembre: el país aprueba el Frente Nacional y el voto de la mujer; elecciones el 4 de mayo de 1958', 1) }
      ] }
  ];
  C.DATA.dictaduraT = T;
})(window.CURUL);
