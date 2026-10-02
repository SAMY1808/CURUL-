/* Narrativa (Fase 35): (1) debates presidenciales televisados con preguntas, estilos de respuesta, rivales y momentos
   virales; (2) logros y estadísticas globales que persisten entre partidas (localStorage); (3) biografía automática del
   personaje; y (4) la red de poder: rasgos de los políticos NPC, amistades, traiciones y matrimonios políticos. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  /* ═══════════ 1. Debates ═══════════ */
  const PREGUNTAS = [
    ['economia', 'hacienda', '¿Cómo va a reactivar la economía sin disparar el déficit?'], ['seguridad', 'seguridad', '¿Qué hará con los grupos armados y la extorsión en las ciudades?'],
    ['salud', 'salud', 'Las EPS están quebradas y los pacientes esperan meses por una cita: ¿qué propone?'], ['educacion', 'educacion', '¿Cómo piensa financiar la educación superior y cerrar la brecha rural?'],
    ['corrupcion', 'justicia', 'Hay candidatos con procesos abiertos. ¿Qué garantías ofrece de transparencia?'], ['paz', 'paz', '¿Continuará la paz con los grupos armados o endurecerá la mano?'],
    ['energia', 'energia', '¿Seguirá la exploración de petróleo y gas o apostará por la transición energética?'], ['empleo', 'empleo', 'Con la informalidad por encima del 55 %, ¿cómo generará empleo digno?'],
    ['ambiente', 'ambiente', 'La deforestación avanza en la Amazonía: ¿cuál es su plan?'], ['exteriores', 'exteriores', '¿Qué relación tendrá con Estados Unidos, Venezuela y el Mercosur?'],
    ['pensiones', 'empleo', 'Los adultos mayores no se pensionan: ¿reforma pensional pública o privada?'], ['tributaria', 'hacienda', '¿Subirá impuestos? Sea claro con los colombianos.']
  ];
  const ESTILOS = { tecnico: { n: 'Propuesta técnica con cifras', icono: '📊' }, emocional: { n: 'Mensaje emocional y cercano', icono: '❤' }, ataque: { n: 'Atacar a un rival', icono: '⚔' }, esquivar: { n: 'Esquivar la pregunta', icono: '🙈' } };
  const Db = {
    PREGUNTAS, ESTILOS, clave: 'debates',
    asegurar(E) { if (E.debates && E.debates.hechos) return E.debates; E.debates = { hechos: {}, actual: null, hist: [] }; return E.debates; },
    init(E) { E.debates = null; Db.asegurar(E); },
    rivales(E) { return C.Encuestas && C.Encuestas.campoPresidencial ? C.Encuestas.campoPresidencial(E).filter(c => c.pol !== 'J').slice(0, 4) : []; },
    abrir(E, ronda) {
      const d = Db.asegurar(E), ps = U.shuffle ? U.shuffle(PREGUNTAS.slice()).slice(0, 5) : PREGUNTAS.slice().sort(() => Math.random() - 0.5).slice(0, 5);
      d.actual = { id: U.id('db'), ronda, t0: E.fecha.t, limite: E.fecha.t + 3, i: 0, estado: 'abierto', preguntas: ps.map(p => ({ tema: p[0], sector: p[1], txt: p[2], estilo: null, puntos: null })), rivales: Db.rivales(E).map(r => r.nombre), total: 0, viral: null };
      C.Medios.noticia(E, { tipo: 'campana', titular: `Se acerca el debate presidencial televisado ${ronda === 1 ? '(primero)' : '(el decisivo)'}: ${E.jugador.nombre} está invitado`, tono: 0, jugador: true });
    },
    responder(E, estilo) {
      const J = E.jugador, d = Db.asegurar(E).actual, q = d.preguntas[d.i], at = J.atributos;
      const fit = J.intereses.includes(q.sector) ? 0.4 : 0;
      const base = (at.oratoria - 50) / 50;
      const est = { tecnico: [0.2 + ((J.rep && J.rep.competencia) || 50 - 50) / 100, 0.7], emocional: [(at.carisma - 50) / 100 + 0.2, 0.9], ataque: [(at.oratoria - 50) / 120, 1.7], esquivar: [-0.3, 0.3] }[estilo];
      const s = U.clamp(Math.round((base + est[0] + fit + U.gauss(0, est[1])) * 1.6), -3, 3);
      q.estilo = estilo; q.puntos = s; d.total += s; d.i++;
      if (Math.abs(s) === 3 && !d.viral) d.viral = { q: q.tema, buena: s > 0 };
      if (estilo === 'ataque' && s >= 2) d.golpes = (d.golpes || 0) + 1;
      if (d.i >= d.preguntas.length) Db.cerrar(E, d);
      return s;
    },
    cerrar(E, d) {
      const D = Db.asegurar(E); d.estado = 'jugado';
      d.rivalPts = d.rivales.map(n => ({ nombre: n, total: Math.round(U.gauss(0.3, 3.4) - (d.golpes ? 0.8 : 0)) }));
      const todos = d.rivalPts.concat([{ nombre: E.jugador.nombre, total: d.total, yo: true }]).sort((a, b) => b.total - a.total);
      d.puesto = todos.findIndex(x => x.yo) + 1; d.ranking = todos;
      const k = d.total + (d.viral ? (d.viral.buena ? 2 : -2) : 0);
      C.Opinion.subirRec(E, Math.max(-3, k * 0.8));
      const cambios = { rec: {}, dep: {} }; for (const id of Object.keys(E.deptos)) { cambios.rec[id] = k * 0.6; cambios.dep[id] = k * 0.22; } C.Opinion.moverImagen(E, cambios);
      d.efecto = k;
      C.Medios.noticia(E, { tipo: 'campana', titular: d.puesto === 1 ? `${E.jugador.nombre} gana el debate presidencial${d.viral && d.viral.buena ? ' y protagoniza el momento viral de la noche' : ''}` : d.puesto === todos.length ? `Debate presidencial: ${E.jugador.nombre} naufraga${d.viral && !d.viral.buena ? ' en un momento que se vuelve viral' : ''}` : `Debate presidencial: ${E.jugador.nombre} queda en el puesto ${d.puesto}`, tono: d.puesto === 1 ? 1 : d.puesto >= 3 ? -1 : 0, jugador: true, importante: true });
      D.hist.unshift(d); if (D.hist.length > 10) D.hist.length = 10; D.actual = null;
    },
    turno(E) {
      const D = Db.asegurar(E), cam = E.elecciones && E.elecciones.campana;
      if (D.actual && D.actual.estado === 'abierto' && E.fecha.t > D.actual.limite && D.actual.i === 0) {
        const d = D.actual; d.estado = 'ausente'; C.Opinion.subirRec(E, -3); D.hist.unshift(d); D.actual = null;
        C.Medios.noticia(E, { tipo: 'campana', titular: `${E.jugador.nombre} deja la silla vacía en el debate presidencial: críticas por evadir`, tono: -1, jugador: true });
      }
      if (!cam || cam.eleccion !== 'presidencial' || D.actual) return;
      const El = C.Elecciones, ev = El.proxima(E, 'presidencial'); if (!ev) return;
      const sem = El.semanasPara(E, ev);
      for (const h of [9, 4]) { const k = cam.anio + ':' + h; if (sem <= h && sem > h - 3 && !D.hechos[k]) { D.hechos[k] = true; Db.abrir(E, h === 9 ? 1 : 2); break; } }
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'responderDebate', nombre: 'Responder en el debate', icono: '🎙', grupo: 'campana', costo: 0,
        disponible(E, a) { const d = Db.asegurar(E).actual; return d && d.estado === 'abierto' ? (ESTILOS[a.estilo] ? true : 'Elige un estilo') : 'No hay debate abierto'; },
        ejecutar(E, a) { const s = Db.responder(E, a.estilo); return { ok: true, msg: s >= 2 ? 'Gran respuesta: el público aplaude' : s >= 0 ? 'Respuesta correcta' : s >= -1 ? 'Respuesta floja' : 'Tropiezo: tu rival lo aprovecha' }; } });
    }
  };

  /* ═══════════ 2. Logros y estadísticas globales ═══════════ */
  const LS = 'curul_logros_v1';
  const leyes = E => (E.jugador.historialLegislativo || []).filter(h => h.resultado === 'ley').length;
  const cargo = (E, c) => (E.jugador.ocupados || []).includes(c);
  const CAT = [
    ['primerLey', '📜', 'Legislador novato', 'Que se apruebe una ley de tu autoría.', E => leyes(E) >= 1],
    ['diezLeyes', '📚', 'Fábrica de leyes', 'Diez leyes de tu autoría.', E => leyes(E) >= 10],
    ['concejal', '🏘', 'Del barrio al concejo', 'Ser concejal.', E => cargo(E, 'concejal')],
    ['alcalde', '🏙', 'Alcalde', 'Gobernar un municipio.', E => cargo(E, 'alcalde')],
    ['diputado', '🏛', 'Diputado', 'Ser diputado departamental.', E => cargo(E, 'diputado')],
    ['representante', '🗳', 'Representante', 'Llegar a la Cámara.', E => cargo(E, 'representante')],
    ['senador', '🏛', 'Senador de la República', 'Llegar al Senado.', E => cargo(E, 'senador')],
    ['gobernador', '🗺', 'Gobernador', 'Gobernar un departamento.', E => cargo(E, 'gobernador')],
    ['ministro', '💼', 'Ministro', 'Ser ministro.', E => cargo(E, 'ministro')],
    ['presidente', '🦅', 'Presidente de la República', 'Llegar a la Casa de Nariño.', E => cargo(E, 'presidente')],
    ['carrera', '🎖', 'Carrera completa', 'Haber sido concejal, alcalde y senador.', E => cargo(E, 'concejal') && cargo(E, 'alcalde') && cargo(E, 'senador')],
    ['veterano', '⏳', 'Veterano', 'Diez años de carrera política.', E => E.fecha.t >= 520],
    ['dosDecadas', '🕰', 'Dos décadas', 'Veinte años de carrera.', E => E.fecha.t >= 1040],
    ['reelegido', '🔁', 'Imbatible en las urnas', 'Ganar tres elecciones.', E => (E.jugador.historialElectoral || []).filter(h => h.electo).length >= 3],
    ['populares', '❤', 'Presidente del pueblo', 'Superar el 70 % de aprobación siendo Presidente.', E => E.gobierno.presidente === 'J' && E.opinion.aprobacionPres >= 70],
    ['sinMancha', '🕊', 'Manos limpias', 'Cinco años como presidente sin un solo escándalo personal.', E => E.gobierno.presidente === 'J' && E.fecha.t >= 260 && !(E.jugador.escandalos || []).length],
    ['debate', '🎙', 'Rey del debate', 'Ganar un debate presidencial.', E => (E.debates && E.debates.hist || []).some(d => d.puesto === 1)],
    ['viral', '📱', 'Momento viral', 'Protagonizar un momento viral en un debate.', E => (E.debates && E.debates.hist || []).some(d => d.viral && d.viral.buena)],
    ['excepcion', '🚨', 'Poderes extraordinarios', 'Declarar un estado de excepción.', E => (E.decretos && (E.decretos.hist.some(h => h.jugador) || (E.decretos.exc && E.decretos.exc.jugador)))],
    ['metropolitano', '🏙', 'Constructor de ciudad', 'Constituir un área metropolitana.', E => C.Metro && C.Metro.todas(E).some(a => a.estado === 'constituida' && a.promoJ)],
    ['emprendedor', '🏭', 'Empresario del Estado', 'Crear una empresa pública.', E => !!(E.logros && (E.logros.acc.crearEmpresaPublica || E.logros.acc.crearEmpresaMetropolitana))],
    ['cartel', '🎯', 'Mano dura', 'Capturar a un cabecilla narco.', E => E.narco && E.narco.golpes >= 1 && E.gobierno.presidente === 'J'],
    ['extradicion', '✈', 'Extradición', 'Extraditar a un cabecilla.', E => E.narco && E.narco.extraditados >= 1 && E.gobierno.presidente === 'J'],
    ['desastres', '🆘', 'Respuesta ejemplar', 'Cerrar un desastre grave con una respuesta de 75 puntos o más.', E => E.riesgo && E.riesgo.hist.some(h => h.sev >= 3 && h.resp >= 75)],
    ['escudo', '⚖', 'Escudo de la Constitución', 'Que la Corte tumbe un estado de excepción que no justificaba la crisis.', E => E.decretos && E.decretos.hist.some(h => h.estado === 'inexequible')],
    ['reforma', '🏦', 'Reformador', 'Que se apruebe una reforma pensional, de salud o del Banco de la República.', E => Object.values(E.proyectos).some(p => p.estado === 'ley' && /^(pen_|sal_|banrep)/.test(p.plantilla))],
    ['legado', '🏆', 'Estadista', 'Alcanzar un legado de 140 puntos.', E => C.Legado && C.Legado.puntos(E) >= 140],
    ['familia', '👪', 'Dinastía', 'Tener un heredero político.', E => (E.jugador.familia || []).some(f => f.carreraPolitica || f.heredero)],
    ['mercosur', '🌎', 'Integrador', 'Adherir a Colombia al Mercosur.', E => !!(E.mercosur && E.mercosur.estado === 'miembro')]
  ];
  const Lg = {
    CAT, clave: 'logros',
    asegurar(E) { if (E.logros && E.logros.ok) return E.logros; E.logros = { ok: true, ids: {}, acc: {}, inicio: E.fecha.t }; return E.logros; },
    init(E) { E.logros = null; Lg.asegurar(E); },
    global() { try { const g = JSON.parse(localStorage.getItem(LS) || 'null'); if (g && g.ids) return g; } catch (e) {} return { ids: {}, stats: { partidas: 0, semanas: 0, leyes: 0, elecciones: 0, presidencias: 0, mejorLegado: 0, escandalos: 0 }, partidas: [] }; },
    guardarGlobal(g) { try { localStorage.setItem(LS, JSON.stringify(g)); } catch (e) {} },
    desbloquear(E, id, nombre) {
      const L = Lg.asegurar(E), g = Lg.global();
      if (L.ids[id]) return; L.ids[id] = { t: E.fecha.t, anio: U.anio() };
      const nuevo = !g.ids[id]; if (nuevo) g.ids[id] = { anio: U.anio(), personaje: E.jugador.nombre, t: Date.now() };
      Lg.guardarGlobal(g);
      if (nuevo && C.UI && C.UI.toast) C.UI.toast(`🏅 Logro desbloqueado: ${nombre}`, 'bien');
      C.Medios && C.Medios.noticia(E, { tipo: 'jugador', titular: `Logro: ${nombre}`, tono: 1, jugador: true });
    },
    revisar(E) { const L = Lg.asegurar(E); for (const [id, ic, n, d, f] of CAT) if (!L.ids[id]) { let ok = false; try { ok = !!f(E); } catch (e) {} if (ok) Lg.desbloquear(E, id, n); } },
    guardarEstadisticas(E) {
      const g = Lg.global(), J = E.jugador, key = J.nombre + '|' + (E.meta && E.meta.inicio), L = Lg.asegurar(E);
      let reg = g.partidas.find(p => p.k === key); if (!reg) { reg = { k: key, nombre: J.nombre, semanas: 0, leyes: 0, elecciones: 0, presidente: false, legado: 0, anio: U.anio() }; g.partidas.push(reg); g.stats.partidas++; if (g.partidas.length > 30) g.partidas.shift(); }
      const sem = E.fecha.t - L.inicio, leyesN = leyes(E), el = (J.historialElectoral || []).filter(h => h.electo).length, pr = (J.ocupados || []).includes('presidente'), lg = C.Legado ? C.Legado.puntos(E) : 0;
      g.stats.semanas += Math.max(0, sem - (reg.semanas || 0)); g.stats.leyes += Math.max(0, leyesN - reg.leyes); g.stats.elecciones += Math.max(0, el - reg.elecciones);
      if (pr && !reg.presidente) g.stats.presidencias++;
      g.stats.mejorLegado = Math.max(g.stats.mejorLegado, lg);
      Object.assign(reg, { nombre: J.nombre, semanas: sem, leyes: leyesN, elecciones: el, presidente: pr, legado: lg, anio: U.anio() });
      Lg.guardarGlobal(g);
    },
    turno(E) { if (E.fecha.t % 4 === 0) Lg.revisar(E); if (E.fecha.t % 26 === 0) Lg.guardarEstadisticas(E); }
  };
  C.Bus.on('accion', ({ id, r }) => { const E = C.E; if (!E || !E.logros) return; const L = Lg.asegurar(E); if (r && r.ok !== false && r.exito !== false) L.acc[id] = (L.acc[id] || 0) + 1; });

  /* ═══════════ 3. Biografía ═══════════ */
  const Bio = {
    texto(E) {
      const J = E.jugador, N = C.DATA.cargos, p = [], g = J.genero === 'F' ? 'a' : 'o';
      const nac = J.nac, edad = U.anio() - nac;
      p.push(`${J.nombre} nació en ${nac} en ${J.nacimiento || J.residencia || 'Colombia'}${J.profesion ? ' y se formó como ' + J.profesion.toLowerCase() : ''}${J.educacion ? ' (' + J.educacion.toLowerCase() + ')' : ''}. A sus ${edad} años es ${J.cargo && N[J.cargo] ? N[J.cargo].nombre.toLowerCase() : 'ciudadan' + g}${J.partido && E.partidos[J.partido] ? ', militante de ' + E.partidos[J.partido].nombre : ''}.`);
      const el = J.historialElectoral || [];
      if (el.length) {
        const gan = el.filter(h => h.electo), per = el.filter(h => !h.electo);
        p.push(`A lo largo de su carrera disputó ${el.length} elecciones: ganó ${gan.length}${gan.length ? ' (' + gan.map(h => `${h.cargo} en ${h.anio}`).join(', ') + ')' : ''}${per.length ? ' y perdió ' + per.length + ' (' + per.map(h => `${h.cargo} en ${h.anio}`).join(', ') + ')' : ''}.`);
      }
      const ley = (J.historialLegislativo || []).filter(h => h.resultado === 'ley');
      if (ley.length) p.push(`En el Congreso fue autor o coautor de ${ley.length} ley${ley.length > 1 ? 'es' : ''}, entre ellas «${ley[ley.length - 1].titulo}».`);
      if ((J.ocupados || []).includes('presidente')) {
        const ap = (E.series.aprobacion || []).map(x => x[1]);
        p.push(`Presidió la República${ap.length ? ' con una aprobación media de ' + Math.round(U.prom(ap.slice(-260))) + ' %' : ''}.${E.decretos && E.decretos.hist.length ? ' Gobernó bajo estado de excepción ' + E.decretos.hist.length + ' vez(es).' : ''}${E.narco && E.narco.golpes ? ` Su gobierno asestó ${E.narco.golpes} golpes al narcotráfico.` : ''}`);
      }
      if ((J.escandalos || []).length) p.push(`Su trayectoria estuvo marcada por ${J.escandalos.length} escándalo${J.escandalos.length > 1 ? 's' : ''}, como «${J.escandalos[J.escandalos.length - 1].titulo}».`);
      const lg = C.Legado ? C.Legado.puntos(E) : 0;
      if (C.Legado) p.push(`La historia lo recordará como «${C.Legado.titulo(lg)}» (${lg} puntos de legado).`);
      const h = (J.familia || []).filter(f => f.rol === 'Hijo' || f.rol === 'Hija');
      if (h.length) p.push(`Deja ${h.length} hij${h.length > 1 ? 'os' : 'o'}${h.some(x => x.carreraPolitica) ? ', de los cuales alguno ya incursiona en la política' : ''}.`);
      return p;
    },
    linea(E) {
      const J = E.jugador, out = [];
      for (const h of J.historialElectoral || []) out.push({ anio: h.anio, txt: `${h.electo ? 'Gana' : 'Pierde'} la elección a ${h.cargo}`, tipo: h.electo ? 'bien' : 'mal' });
      for (const h of J.historialLegislativo || []) if (h.resultado === 'ley') out.push({ anio: h.t != null ? U.fechaDe(h.t).getUTCFullYear() : null, txt: `Se aprueba su ley «${h.titulo}»`, tipo: 'bien' });
      for (const s of J.escandalos || []) out.push({ anio: s.t != null ? U.fechaDe(s.t).getUTCFullYear() : null, txt: `Escándalo: ${s.titulo}`, tipo: 'mal' });
      for (const [id, v] of Object.entries(Lg.asegurar(E).ids)) { const c = CAT.find(x => x[0] === id); if (c) out.push({ anio: v.anio, txt: `Logro: ${c[2]}`, tipo: 'info' }); }
      return out.filter(x => x.anio).sort((a, b) => a.anio - b.anio);
    }
  };

  /* ═══════════ 4. Red de poder ═══════════ */
  const RASGOS = { ambicioso: 'Ambicioso', leal: 'Leal', oportunista: 'Oportunista', tecnocrata: 'Tecnócrata', populista: 'Populista', corrupto: 'Corrupto', honesto: 'Honesto', carismatico: 'Carismático' };
  const Rd = {
    RASGOS, clave: 'red',
    asegurar(E) { if (E.red && E.red.lazos) return E.red; E.red = { lazos: [], hist: [], ultimo: 0 }; return E.red; },
    init(E) { E.red = null; Rd.asegurar(E); },
    rasgo(p) {
      if (p.rasgo) return p.rasgo;
      const r = p.r || {}, k = Object.keys(RASGOS); let s = (p.id + '').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      p.rasgo = (r.amb > 70 && s % 3 === 0) ? 'ambicioso' : (r.car > 70 && s % 2 === 0) ? 'carismatico' : k[s % k.length]; return p.rasgo;
    },
    notables(E) { return Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && (C.DATA.cargos[p.cargo.tipo] || { nivel: 0 }).nivel >= 3); },
    lazo(E, a, b) { return Rd.asegurar(E).lazos.find(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)); },
    anotar(E, txt) { const r = Rd.asegurar(E); r.hist.unshift({ t: E.fecha.t, txt }); if (r.hist.length > 15) r.hist.length = 15; },
    turno(E) {
      const R = Rd.asegurar(E); if (E.fecha.t - R.ultimo < 6) return; R.ultimo = E.fecha.t;
      const nots = Rd.notables(E); if (nots.length < 4) return;
      const a = U.pick(nots), b = U.pick(nots.filter(x => x.id !== a.id)); if (!b) return;
      const l = Rd.lazo(E, a.id, b.id);
      if (!l) {
        const afin = 1 - U.distIdeo(a, b);
        if (afin > 0.7 && U.chance(0.5)) { R.lazos.push({ a: a.id, b: b.id, tipo: 'alianza', t: E.fecha.t }); Rd.anotar(E, `${a.nombre} y ${b.nombre} sellan una alianza`); C.Medios.noticia(E, { tipo: 'partidos', titular: `${a.nombre} y ${b.nombre} anuncian una alianza política`, tono: 0 }); }
        else if (afin < 0.45 && U.chance(0.35)) { R.lazos.push({ a: a.id, b: b.id, tipo: 'enemistad', t: E.fecha.t }); Rd.anotar(E, `${a.nombre} y ${b.nombre} rompen lanzas`); }
        else if (a.partido !== b.partido && U.chance(0.04) && Rd.edadOK(a) && Rd.edadOK(b)) { R.lazos.push({ a: a.id, b: b.id, tipo: 'matrimonio', t: E.fecha.t }); Rd.anotar(E, `${a.nombre} y ${b.nombre} se casan: dos casas políticas se unen`); C.Medios.noticia(E, { tipo: 'partidos', titular: `Boda política: ${a.nombre} (${E.partidos[a.partido] ? E.partidos[a.partido].sigla : ''}) y ${b.nombre} (${E.partidos[b.partido] ? E.partidos[b.partido].sigla : ''}) se casan`, tono: 0 }); }
      } else if (l.tipo === 'alianza' && (Rd.rasgo(a) === 'oportunista' || Rd.rasgo(b) === 'oportunista') && U.chance(0.12)) {
        const t = Rd.rasgo(a) === 'oportunista' ? a : b, v = t === a ? b : a; l.tipo = 'enemistad'; l.t = E.fecha.t; Rd.anotar(E, `${t.nombre} traiciona a ${v.nombre}`);
        const pa = E.partidos[t.partido]; if (pa && pa.popularidad != null) pa.popularidad = Math.max(0, pa.popularidad - 0.3);
        C.Medios.noticia(E, { tipo: 'partidos', titular: `Traición política: ${t.nombre} rompe con su aliado ${v.nombre}`, tono: -1 });
      } else if (l.tipo === 'enemistad' && U.chance(0.05)) { R.lazos = R.lazos.filter(x => x !== l); Rd.anotar(E, `${a.nombre} y ${b.nombre} hacen las paces`); }
      if (R.lazos.length > 60) R.lazos.shift();
    },
    edadOK: p => (U.anio() - (p.nac || 1970)) >= 28 && (U.anio() - (p.nac || 1970)) <= 75,
    registrarAcciones() {
      C.Acciones.registrar({ id: 'tejerAlianzaNPC', nombre: 'Tejer una alianza con un político', icono: '🤝', grupo: 'politica', costo: 2,
        disponible(E, a) { const p = E.politicos[a.pol]; return p && p.activo ? (E.jugador.patrimonio >= 3 ? true : 'Necesitas $3 millones para atenderlo') : 'Elige un político'; },
        ejecutar(E, a) { const p = E.politicos[a.pol]; E.jugador.patrimonio -= 3; p.relJ = U.clamp((p.relJ || 0) + U.ri(8, 16), -100, 100); return { ok: true, msg: `${p.nombre} se acerca a ti (relación ${Math.round(p.relJ)})` }; } });
    }
  };

  C.Debates = Db; C.Logros = Lg; C.Biografia = Bio; C.Red = Rd;
  for (const [n, o, pr] of [['Debates', Db, 63], ['Logros', Lg, 64], ['Red', Rd, 65]]) { o.migrar = o.init; C.Tiempo.registrar(n.toLowerCase(), o, pr); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push(n); if (o.registrarAcciones) o.registrarAcciones(); }
})(window.CURUL);
