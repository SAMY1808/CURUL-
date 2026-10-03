/* Régimen político (Fase 41). La democracia colombiana puede quebrarse: el termómetro del golpe sube con la impopularidad,
   la crisis económica, el desorden público, los escándalos, las medidas radicales y el humor de los militares. Un golpe
   de Estado instala una junta (Congreso disuelto, elecciones suspendidas, libertades recortadas); un presidente puede
   dar un autogolpe o ir capturando las instituciones hasta una «democradura»; y todo régimen no democrático puede
   terminar en una transición negociada (mesa de transición) que culmina en elecciones libres. El jugador puede
   resistir, conspirar, gobernar como jefe de la junta o negociar el regreso a la democracia. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TIPOS = { democracia: ['Democracia', 'verde', '🗳'], democradura: ['Democradura (democracia capturada)', 'amar', '🎭'], junta: ['Junta militar', 'rojo', '🎖'], autoritario: ['Régimen autoritario', 'rojo', '⛓'] };
  const esPres = E => E.gobierno.presidente === 'J';
  const Rg = {
    TIPOS, clave: 'regimen',
    asegurar(E) {
      if (E.regimen && E.regimen.tipo) return E.regimen;
      E.regimen = { tipo: 'democracia', desde: 0, libertad: 78, congreso: true, elecciones: true, decreto: false, junta: null, transicion: null, consp: null, riesgo: 15, blindaje: 0, captura: { corte: 0, control: 0, reeleccion: 0 }, golpes: 0, ult: -999, exilio: false, hist: [] };
      return E.regimen;
    },
    init(E) { E.regimen = null; Rg.asegurar(E); },
    anotar(E, txt) { const r = Rg.asegurar(E); r.hist.unshift({ t: E.fecha.t, txt }); if (r.hist.length > 20) r.hist.length = 20; },
    democratico: E => ['democracia', 'democradura'].includes(Rg.asegurar(E).tipo),
    poderDecreto(E) { const r = Rg.asegurar(E); return r.decreto || (r.tipo === 'democradura' && r.captura.corte >= 1) || r.tipo === 'junta' || r.tipo === 'autoritario'; },
    corteCapturada: E => Rg.asegurar(E).captura.corte >= 1 || ['junta', 'autoritario'].includes(Rg.asegurar(E).tipo),
    /* ── Termómetro del golpe: descompone el riesgo en factores ── */
    factores(E) {
      const r = Rg.asegurar(E), Ec = E.economia, ap = E.opinion.aprobacionPres, P = C.Poderes ? C.Poderes.asegurar(E).actores : null;
      const seg = U.prom(Object.values(E.deptos).map(d => d.seguridad));
      const mil = P ? P.militares : { poder: 60, afin: 50 }, usa = P ? P.usa : { afin: 50 };
      const paros = C.Movilizacion ? C.Movilizacion.ACTORES.filter(a => C.Movilizacion.actor(E, a.id) && C.Movilizacion.actor(E, a.id).paro).length : 0;
      const f = [
        ['Impopularidad del Gobierno', U.clamp((42 - ap) * 1.1, 0, 38)],
        ['Crisis económica', U.clamp((Ec.desempleo - 11) * 2.4 + (Ec.inflacion - 7) * 2 + (2 - Ec.crecimiento) * 3, 0, 22)],
        ['Desorden público', U.clamp((58 - seg) * 0.55, 0, 18)],
        ['Escándalos y corrupción', U.clamp((E.opinion.escandalos || 0) * 1.6, 0, 14)],
        ['Poder y malestar militar', U.clamp((mil.poder - 55) * 0.3 + (50 - mil.afin) * 0.35, 0, 22)],
        ['Medidas económicas radicales', U.clamp(Math.abs(C.Modelo ? C.Modelo.estatismo(E) : 0) * 0.45 + (C.Modelo && C.Modelo.asegurar(E).ind.confInv < 28 ? 8 : 0), 0, 18)],
        ['Paros y movilización', U.clamp(paros * 4, 0, 12)],
        ['Partidos que tocan a las puertas de los cuarteles', U.clamp((r.golpistas || []).length * 6, 0, 14)],
        ['Contexto histórico (época de golpes)', Rg.eraFactor ? (Rg.eraFactor(E) - 1) * 6 : 0],
        ['Respaldo de EE. UU.', -U.clamp((usa.afin - 50) * 0.22, -3, 8)],
        ['Blindaje militar del Gobierno', -U.clamp(r.blindaje, 0, 40)]
      ];
      return f;
    },
    riesgo(E) { const r = Rg.asegurar(E); r.riesgo = U.clamp(U.suma(Rg.factores(E).map(x => x[1])), 0, 100); return r.riesgo; },
    /* ── Instalación de gobiernos de facto ── */
    crearGeneral(E, nombre) { const N = C.DATA.nombres; const p = C.Politicos.crear(E, { partido: null, eco: U.ri(20, 55), soc: U.ri(35, 75), cargo: { tipo: 'presidente' } }); p.nombre = nombre || `Gral. ${U.pick(N.h)} ${U.pick(N.a)}`; p.profesion = 'Militar'; p.fuerza = 70; p.r.amb = 90; p.r.dis = 85; return p; },
    instalarGobierno(E, polId) {
      const g = E.gobierno, J = E.jugador;
      for (const id of Object.values(g.gabinete || {})) { const m = E.politicos[id]; if (m && m.cargo && m.cargo.tipo === 'ministro') m.cargo = null; }
      if (g.presidente && g.presidente !== 'J' && E.politicos[g.presidente]) { E.politicos[g.presidente].cargo = { tipo: 'expresidente' }; C.Politicos.anotar(E.politicos[g.presidente], 'Es derrocado'); }
      if (g.presidente === 'J' && polId !== 'J') C.Personaje.dejarCargo(E, 'Derrocado por un golpe de Estado');
      else if (J.cargo === 'ministro') C.Personaje.dejarCargo(E, 'La junta destituye al gabinete');
      E.gobierno = { presidente: polId, partido: null, vice: null, coalicion: [], gabinete: {}, desde: E.fecha.t, electo: null, agenda: [], ultimoProyecto: E.fecha.t, historialGabinete: [], estabilidadHist: [] };
      if (polId === 'J') C.Personaje.asumirCargo(E, 'presidente', {}); else { const p = E.politicos[polId]; p.cargo = { tipo: 'presidente' }; C.Politicos.anotar(p, 'Asume el poder tras un golpe de Estado'); }
      for (const m of C.Gobierno.todosMinisterios(E)) { try { C.Gobierno.designar(E, m.id, null, true); } catch (e) {} }
      E.opinion.aprobacionPres = U.rf(45, 58); E.opinion.luna = 8;
    },
    cerrarInstituciones(E, motivo) {
      const J = E.jugador, r = Rg.asegurar(E);
      r.congreso = false; r.elecciones = false; r.decreto = true;
      // el jugador pierde cualquier cargo de elección popular
      if (['senador', 'representante', 'diputado', 'concejal', 'gobernador', 'alcalde'].includes(J.cargo)) C.Personaje.dejarCargo(E, motivo || 'Las instituciones son disueltas');
      if (E.corte) E.corte.tension = U.clamp(E.corte.tension + 25, 0, 100);
      try { if (E.economia) { E.economia.confianza = U.clamp(E.economia.confianza - 6, 5, 95); } } catch (e) {}
    },
    /* Golpe de Estado: el general (o el jugador) toma el poder */
    golpe(E, lider, via, hist, silencioso) {
      const r = Rg.asegurar(E), J = E.jugador, antes = E.gobierno.presidente; r.golpes++; r.ult = E.fecha.t; r.consp = null;
      const D = hist && C.DATA.dictaduras ? C.DATA.dictaduras.find(d => d.id === hist) : null, gol = r.golpistas || [];
      const polId = lider === 'J' ? 'J' : Rg.crearGeneral(E, D && D.lider).id, nombre = lider === 'J' ? J.nombre : E.politicos[polId].nombre;
      r.tipo = 'junta'; r.desde = E.fecha.t; r.libertad = D ? D.libertad : 24; r.dictadura = D ? { id: D.id, nombre: D.nombre } : null; r.via = via || 'cuartelazo';
      r.junta = Object.assign({ lider: polId, nombre, legit: U.ri(40, 52) + (gol.length ? 6 : 0), repres: 45, resistencia: 14, aislamiento: 10, desde: E.fecha.t, censura: 30, miembros: [Rg.crearGeneral(E).id, Rg.crearGeneral(E).id] }, D ? D.junta : {}, { lider: polId, nombre });
      for (const g of gol) { const pa = E.partidos[g.pid]; if (pa) { pa.popularidad += 0.6; pa.relJ = pa.relJ || 0; } } r.golpistas = [];
      Rg.instalarGobierno(E, polId); Rg.cerrarInstituciones(E, 'La junta militar disuelve el Congreso');
      if (C.Poderes) { C.Poderes.mover(E, 'militares', 15); C.Poderes.mover(E, 'ong', -20); C.Poderes.mover(E, 'prensa', -8); }
      for (const p of Object.values(E.diplomacia ? E.diplomacia.paises : {})) p.relacion = U.clamp(p.relacion - 8, 3, 97);
      Rg.anotar(E, `Golpe de Estado: ${nombre} toma el poder`);
      if (!silencioso) C.Medios.noticia(E, { tipo: 'gobierno', titular: D && D.titular ? D.titular : `GOLPE DE ESTADO: ${nombre} asume el poder, disuelve el Congreso y suspende las elecciones`, tono: -1, importante: true, jugador: true });
      C.Bus.emit('regimen:golpe', { lider: polId, antes });
    },
    autogolpe(E, tipo) {
      const r = Rg.asegurar(E), J = E.jugador; r.golpes++; r.ult = E.fecha.t;
      if (tipo === 'cerrarCongreso') { r.tipo = 'autoritario'; r.desde = E.fecha.t; r.libertad = 38; Rg.cerrarInstituciones(E, 'El Presidente cierra el Congreso'); r.junta = null; E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 8, 3, 95); Rg.anotar(E, 'Autogolpe: el Presidente cierra el Congreso y asume poderes plenos'); C.Medios.noticia(E, { tipo: 'gobierno', titular: `AUTOGOLPE: ${J.nombre} cierra el Congreso y gobierna por decreto`, tono: -1, importante: true, jugador: true }); }
      for (const p of Object.values(E.diplomacia ? E.diplomacia.paises : {})) p.relacion = U.clamp(p.relacion - 6, 3, 97);
    },
    /* ── Democradura: capturar poco a poco las instituciones ── */
    capturar(E, que) {
      const r = Rg.asegurar(E); r.captura[que] = 1;
      if (que === 'reeleccion') { E.constitucion.articulos.reeleccion = 'permitida'; r.reeleccionLibre = true; }
      if (que === 'corte' && E.corte) E.corte.tension = 0;
      if (r.captura.corte && r.captura.control && r.captura.reeleccion && r.tipo === 'democracia') { r.tipo = 'democradura'; r.desde = E.fecha.t; Rg.anotar(E, 'La democracia queda capturada: nace una democradura'); C.Medios.noticia(E, { tipo: 'gobierno', titular: `Analistas advierten que Colombia deriva en una «democradura»`, tono: -1, importante: true }); }
    },
    /* ── Transición a la democracia ── */
    puedeMesa(E) { const r = Rg.asegurar(E); return ['junta', 'autoritario'].includes(r.tipo) ? (r.transicion && r.transicion.mesa ? 'Ya hay una mesa de transición' : true) : 'Sólo hay transición si el régimen no es democrático'; },
    crearMesa(E) {
      const r = Rg.asegurar(E), J = E.jugador, lidJ = esPres(E) && r.junta && r.junta.lider === 'J', j = r.junta || { legit: 40, resistencia: 30 };
      const lev = lidJ ? U.clamp(50 + (j.legit - 40) * 0.5 - j.resistencia * 0.2, 15, 85) : U.clamp(35 + j.resistencia * 0.45 - j.legit * 0.15, 15, 85);
      return { titulo: 'Transición a la democracia', contraparte: lidJ ? { n: 'Oposición democrática y sociedad civil', icono: '🗳', flex: U.clamp(40 + j.resistencia * 0.3, 20, 80), poder: j.resistencia } : { n: (r.tipo === 'junta' ? 'La junta militar' : 'El régimen autoritario'), icono: '🎖', flex: U.clamp(25 + (60 - j.legit) * 0.5 + j.resistencia * 0.2, 15, 75), poder: j.legit }, leverage: lev, jugadorEsRegimen: lidJ,
        temas: [{ id: 'calendario', n: 'Calendario electoral', brecha: U.ri(40, 80), peso: 3, linea: false }, { id: 'amnistia', n: 'Amnistía y garantías a los militares', brecha: U.ri(45, 85), peso: 2, linea: true }, { id: 'constitucion', n: 'Reglas del juego (constitución y partidos)', brecha: U.ri(40, 75), peso: 2, linea: false }, { id: 'fuerzas', n: 'Control civil de las Fuerzas Armadas', brecha: U.ri(50, 85), peso: 2, linea: true }, { id: 'verdad', n: 'Verdad y justicia para las víctimas', brecha: U.ri(50, 85), peso: 2, linea: false }, { id: 'libertades', n: 'Libertades, prensa y presos políticos', brecha: U.ri(35, 70), peso: 2, linea: false }].concat((r.proscritos || []).length ? [{ id: 'legalizacion', n: 'Legalización de los partidos proscritos', brecha: U.ri(40, 80), peso: 2, linea: false }] : []), npc: !(lidJ || true) };
    },
    iniciarTransicion(E, motivo, forzar) {
      const r = Rg.asegurar(E); if (r.transicion || Rg.democratico(E) || (r.dictadura && !forzar)) return;
      if (r.dictadura && r.hs && r.hs[r.dictadura.id]) r.hs[r.dictadura.id].estado = 'cancelada';   // la historia se desvía: el guion deja de mandar
      r.transicion = { fase: 'apertura', t0: E.fecha.t, motivo: motivo || '', mesa: null, tutela: 0 }; r.libertad = Math.min(60, r.libertad + 12);
      Rg.anotar(E, 'Se abre un proceso de transición a la democracia'); C.Medios.noticia(E, { tipo: 'gobierno', titular: `Se abre el camino a la transición: ${motivo || 'el régimen anuncia una apertura política'}`, tono: 1, importante: true });
      if (!(esPres(E) && r.junta && r.junta.lider === 'J')) { const m = C.Mesa.crear(E, 'transicion', 'transicion'); m.npc = !E.jugador.cargo || true; r.transicion.mesa = m.id; m.npc = !(r.jugadorMesa); }
    },
    mesaTerminada(E, m, res) {
      const r = Rg.asegurar(E), t = r.transicion; r.jugadorMesa = false; if (!t) return; t.mesa = null; const costo = C.Mesa.costoTotal(m);
      const amn = (m.temas.find(x => x.id === 'amnistia') || { costoJ: 0 }).costoJ;
      if (res === 'acuerdo') { t.fase = 'electoral'; t.elecciones = E.fecha.t + U.ri(13, 26); t.tutela = U.clamp(amn * 0.8 + (m.temas.find(x => x.id === 'fuerzas') || { costoJ: 0 }).costoJ * 0.6, 0, 60); r.libertad = Math.min(80, r.libertad + 15); r.elecciones = false; if (Rg.levantarTodas) Rg.levantarTodas(E, true); Rg.anotar(E, `Pacto de transición: elecciones libres en ${t.elecciones - E.fecha.t} semanas`); C.Medios.noticia(E, { tipo: 'gobierno', titular: `Acuerdo de transición: Colombia irá a elecciones libres en ${t.elecciones - E.fecha.t} semanas`, tono: 1, importante: true }); }
      else if (res === 'ruptura') { if (r.junta) { r.junta.legit = U.clamp(r.junta.legit - 6, 0, 100); r.junta.repres = U.clamp(r.junta.repres + 12, 0, 100); r.junta.resistencia = U.clamp(r.junta.resistencia + 10, 0, 100); } r.transicion = null; r.libertad = Math.max(10, r.libertad - 8); Rg.anotar(E, 'Fracasa la negociación de la transición: se endurece el régimen'); }
      else { t.fase = 'apertura'; t.mesa = null; }
    },
    celebrarElecciones(E) {
      const r = Rg.asegurar(E), El = C.Elecciones, t = r.transicion || {};
      r.elecciones = true; r.congreso = true; r.decreto = false;
      El.ejecutar(E, { tipo: 'congreso', fecha: U.hoy() });
      El.ejecutar(E, { tipo: 'presidencial', vuelta: 1, fecha: U.hoy() });
      if (E.elecciones.segundaVuelta) El.ejecutar(E, { tipo: 'presidencial', vuelta: 2, fecha: U.hoy() });
      if (t.posesion && E.fecha.t < t.posesion) { t.fase = 'posesion'; r.elecciones = false; r.congreso = false; Rg.anotar(E, 'Elecciones libres: el nuevo Presidente espera su posesión'); return; }
      Rg.restaurar(E);
    },
    restaurar(E) {
      const r = Rg.asegurar(E), t = r.transicion || {};
      r.elecciones = true; r.congreso = true; r.decreto = false;
      if (E.congreso.electos) C.Congreso.instalar(E, E.congreso.electos);
      if (E.gobierno.electo) { C.Gobierno.posesionar(E, E.gobierno.electo); }
      if (Rg.levantarTodas) Rg.levantarTodas(E, true);
      if (Rg.regresarExiliados) Rg.regresarExiliados(E);
      if (r.dictadura) { r.pasadas = (r.pasadas || []).concat([{ id: r.dictadura.id, nombre: r.dictadura.nombre, fin: E.fecha.t }]); r.dictadura = null; }
      r.tipo = 'democracia'; r.desde = E.fecha.t; r.libertad = 70 - (t.tutela || 0) * 0.15; r.junta = null; r.transicion = null; r.blindaje = 0; r.captura = { corte: 0, control: 0, reeleccion: 0 }; r.reeleccionLibre = false;
      Rg.anotar(E, 'Elecciones libres: regresa la democracia');
      C.Medios.noticia(E, { tipo: 'gobierno', titular: 'Colombia vuelve a la democracia: se instalan un nuevo Congreso y un Presidente elegidos en las urnas', tono: 1, importante: true });
      C.Bus.emit('regimen:democracia');
    },
    /* ── Semana a semana ── */
    turno(E) {
      const r = Rg.asegurar(E), t = E.fecha.t, J = E.jugador;
      r.blindaje = Math.max(0, r.blindaje - 0.04);
      if (Rg.turnoExtra) Rg.turnoExtra(E);
      if (Rg.democratico(E)) {
        const R = Rg.riesgo(E);
        if (t - r.ult > 52) { const p = Math.pow(R / 100, 3) * 0.012 * (Rg.eraFactor ? Rg.eraFactor(E) : 1); if (R > 40 && !E.eventos.pendientes.length && U.chance(p * 0.6) && esPres(E) && !r.consp) { C.Eventos.disparar(E, C.Eventos.plantilla('rg_ruido'), { forzar: true }); }
          if (U.chance(p)) Rg.intentoGolpe(E); }
        if (r.tipo === 'democradura') { r.libertad = Math.max(35, r.libertad - 0.03); }
        // conspiración del jugador
        if (r.consp && r.consp.lider === 'J' && t - r.consp.t0 > 60 && U.chance(0.015)) Rg.descubrirConspiracion(E);
        return;
      }
      // ── régimen de facto ──
      const j = r.junta;
      E.economia.confianza = U.clamp(E.economia.confianza - 0.02, 5, 95); E.economia.inversion -= 0.004;
      if (j) {
        j.legit = U.clamp(j.legit - 0.07 + (E.economia.crecimiento > 3 ? 0.04 : 0) - (E.economia.desempleo > 12 ? 0.04 : 0) - j.censura * 0.0003 + j.repres * 0.00005, 0, 100);
        j.resistencia = U.clamp(j.resistencia + (50 - j.legit) * 0.008 + j.repres * 0.004 - 0.15 - j.censura * 0.002, 0, 100);
        j.aislamiento = U.clamp(j.aislamiento + 0.02 + j.repres * 0.002, 0, 100); E.economia.exportaciones -= j.aislamiento * 0.0005;
        r.libertad = U.clamp(r.libertad - 0.01 + (r.transicion ? 0.05 : 0), 5, 90);
        // si el jugador no manda, la junta decide sola
        if (!(esPres(E) && j.lider === 'J')) {
          if (!r.dictadura && !r.transicion && (j.legit < 30 || j.resistencia > 62) && U.chance(0.012)) Rg.iniciarTransicion(E, 'la presión social y el desgaste de la junta');
          else if (!r.dictadura && !r.transicion && j.legit > 62 && j.resistencia < 28 && r.tipo === 'junta' && U.chance(0.006)) { r.tipo = 'autoritario'; Rg.anotar(E, 'La junta se institucionaliza: nace un régimen autoritario con «elecciones» controladas'); C.Medios.noticia(E, { tipo: 'gobierno', titular: 'La junta se institucionaliza y convoca un plebiscito para legitimarse', tono: -1, importante: true }); }
          if (!r.dictadura && U.chance(Math.pow(1 - j.legit / 100, 2) * 0.004)) Rg.contragolpe(E);
        }
      }
      if (!E.eventos.pendientes.length && !E.meta.presim && U.chance(0.02)) { const ids = r.transicion || r.dictadura ? ['rg_junta_protesta', 'rg_junta_desaparecidos'] : ['rg_junta_protesta', 'rg_junta_eeuu', 'rg_junta_desaparecidos', 'rg_transicion_ruido']; C.Eventos.disparar(E, C.Eventos.plantilla(U.pick(ids)), { forzar: true }); }
      if (r.transicion && r.transicion.fase === 'apertura' && !r.transicion.mesa && !r.transicion.guion && !E.mesas.activas.some(m => m.tipo === 'transicion') && U.chance(0.2) && !(esPres(E) && r.junta && r.junta.lider === 'J')) { const m = C.Mesa.crear(E, 'transicion', 'transicion'); m.npc = !r.jugadorMesa; r.transicion.mesa = m.id; }
      if (r.transicion && r.transicion.fase === 'electoral' && t >= r.transicion.elecciones) Rg.celebrarElecciones(E);
      else if (r.transicion && r.transicion.fase === 'posesion' && t >= r.transicion.posesion) Rg.restaurar(E);
    },
    intentoGolpe(E) {
      const r = Rg.asegurar(E), J = E.jugador; r.ult = E.fecha.t; const P = C.Poderes ? C.Poderes.asegurar(E).actores.militares : { poder: 60, afin: 50 };
      const p = U.clamp(0.4 + (P.poder - 55) / 140 + (45 - E.opinion.aprobacionPres) / 160 - r.blindaje / 90, 0.15, 0.85);
      if (esPres(E)) { C.Eventos.disparar(E, C.Eventos.plantilla('rg_golpe_presidente'), { forzar: true, vars: { prob: Math.round(p * 100) } }); r.pendienteGolpe = p; return; }
      if (U.chance(p)) { Rg.golpe(E, null, U.pick(['cuartelazo', 'cuartelazo', 'golpe cívico-militar'])); if (!E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('rg_golpe_otro'), { forzar: true }); }
      else { r.blindaje += 4; if (C.Poderes) C.Poderes.mover(E, 'militares', -6); C.Medios.noticia(E, { tipo: 'gobierno', titular: 'Se frustra un intento de golpe de Estado: arrestan a oficiales sublevados', tono: 1, importante: true }); Rg.anotar(E, 'Se frustra un intento de golpe de Estado'); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 3, 3, 95); }
    },
    /* Respuesta del presidente-jugador ante un golpe en marcha */
    resolverGolpeJ(E, via) {
      const r = Rg.asegurar(E), p = r.pendienteGolpe != null ? r.pendienteGolpe : 0.5, hh = r.golpeHist || null; r.pendienteGolpe = null; r.golpeHist = null;
      if (via === 'resistir') { const q = U.clamp(1 - p + 0.25 + (E.opinion.aprobacionPres - 35) / 250, 0.1, 0.85); if (U.chance(q)) { r.blindaje += 6; if (C.Poderes) C.Poderes.mover(E, 'militares', -8); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 6, 3, 95); if (hh && r.hs && r.hs[hh]) r.hs[hh].estado = 'cancelada'; Rg.anotar(E, 'Resistes un golpe y los leales lo derrotan'); C.Medios.noticia(E, { tipo: 'gobierno', titular: `${E.jugador.nombre} derrota un intento de golpe con el respaldo de las unidades leales`, tono: 1, importante: true, jugador: true }); return 'Los leales derrotan a los golpistas: sales fortalecido (+6 de aprobación)'; } Rg.golpe(E, null, 'cuartelazo', hh); return 'Tus fuerzas leales no alcanzan: los golpistas toman el poder y te derrocan'; }
      if (via === 'negociar') { Rg.golpe(E, null, 'negociado', hh); E.jugador.rep.honestidad = U.clamp(E.jugador.rep.honestidad, 0, 100); return 'Negocias tu salida: dejas el poder sin que corra sangre'; }
      Rg.golpe(E, null, 'huida', hh); r.exilio = true; return 'Huyes del país: la junta toma el poder y tú quedas en el exilio';
    },
    contragolpe(E) { const r = Rg.asegurar(E), j = r.junta; if (!j) return; const g = Rg.crearGeneral(E); j.lider = g.id; j.nombre = g.nombre; j.legit = U.ri(35, 50); j.repres = U.clamp(j.repres + 10, 0, 100); Rg.instalarGobierno(E, g.id); Rg.anotar(E, `Golpe palaciego: ${g.nombre} derroca a la cúpula de la junta`); C.Medios.noticia(E, { tipo: 'gobierno', titular: `Golpe palaciego dentro de la junta: ${g.nombre} asume el mando`, tono: -1, importante: true }); },
    descubrirConspiracion(E) { const r = Rg.asegurar(E), J = E.jugador; r.consp = null; J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + 25, 0, 100); C.Pais && C.Pais.ef(E, { escandalo: 'Conspiración para un golpe de Estado', honestidad: -6, rec: -4 }); if (C.DATA.cargos[J.cargo].nivel >= 2) C.Personaje.dejarCargo(E, 'Es destituido por conspirar contra el orden constitucional'); C.Medios.noticia(E, { tipo: 'gobierno', titular: `Descubren una conspiración golpista liderada por ${J.nombre}`, tono: -1, importante: true, jugador: true }); Rg.anotar(E, 'Se descubre tu conspiración'); },
    registrarAcciones() {
      const A = C.Acciones, P = E => C.Poderes ? C.Poderes.asegurar(E).actores.militares : { afin: 50, poder: 60 };
      const junta = E => { const r = Rg.asegurar(E); return r.junta && esPres(E) && r.junta.lider === 'J' ? r.junta : null; };
      // — Blindaje del Gobierno democrático —
      A.registrar({ id: 'blindarFuerzas', nombre: 'Blindar a las Fuerzas Militares (ascensos y presupuesto)', icono: '🛡', grupo: 'regimen', costo: 3,
        disponible(E) { return esPres(E) && Rg.democratico(E) ? (Rg.asegurar(E).blindaje >= 30 ? 'Ya están blindadas' : true) : 'Sólo un Presidente en democracia'; },
        ejecutar(E) { const r = Rg.asegurar(E); r.blindaje = Math.min(40, r.blindaje + 10); if (C.Poderes) { C.Poderes.mover(E, 'militares', 8); C.Poderes.st(E, 'militares').favor += 1; } C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.5), p: 'm' }], 'regimen'); return { ok: true, msg: 'Ascensos, aumento de presupuesto y gestos a la cúpula: el riesgo de golpe baja' }; } });
      A.registrar({ id: 'purgarMilitares', nombre: 'Purgar a los oficiales sospechosos', icono: '🧹', grupo: 'regimen', costo: 2,
        disponible(E) { return esPres(E) && Rg.democratico(E) ? true : 'Sólo un Presidente en democracia'; },
        ejecutar(E) { const r = Rg.asegurar(E); r.blindaje = Math.min(40, r.blindaje + 8); if (C.Poderes) C.Poderes.mover(E, 'militares', -14); if (U.chance(0.3)) { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1, 3, 95); return { ok: true, msg: 'Purgas la cúpula: menos riesgo de golpe, pero los militares te miran con rabia y la prensa critica' }; } return { ok: true, msg: 'Retiras a los oficiales más peligrosos: baja el riesgo, bajan las simpatías militares' }; } });
      // — Autogolpe y democradura —
      A.registrar({ id: 'autogolpeCongreso', nombre: 'Autogolpe: cerrar el Congreso', icono: '🧨', grupo: 'regimen', costo: 4,
        disponible(E) { return esPres(E) && Rg.democratico(E) ? true : 'Sólo un Presidente en democracia'; },
        ejecutar(E) { const m = P(E), p = U.clamp(0.28 + (m.afin - 50) / 140 + (E.opinion.aprobacionPres - 40) / 220 + (C.Poderes ? (C.Poderes.st(E, 'usa').afin - 50) / 400 : 0), 0.08, 0.8);
          if (U.chance(p)) { Rg.autogolpe(E, 'cerrarCongreso'); return { ok: true, msg: `El golpe de mano triunfa (${Math.round(p * 100)} % de probabilidad): gobiernas sin Congreso` }; }
          const J = E.jugador; E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 15, 3, 95); E.corte && (E.corte.tension = U.clamp(E.corte.tension + 20, 0, 100)); J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + 30, 0, 100); C.Pais && C.Pais.ef(E, { honestidad: -4, rec: -5 });
          C.Medios.noticia(E, { tipo: 'gobierno', titular: 'Fracasa el autogolpe del Presidente: el Congreso y la Corte lo desafían', tono: -1, importante: true, jugador: true });
          if (U.chance(0.35) && E.gobierno.vice && E.gobierno.vice !== 'J' && E.politicos[E.gobierno.vice]) { const v = E.gobierno.vice, pa = E.politicos[v].partido; C.Personaje.dejarCargo(E, 'Destituido tras un autogolpe fallido'); C.Gobierno.posesionar(E, { pol: v, partido: pa, vice: null }); return { ok: true, exito: false, msg: 'El autogolpe fracasa y el Congreso te destituye: asume el vicepresidente' }; }
          return { ok: true, exito: false, msg: `El autogolpe fracasa (${Math.round(p * 100)} % de probabilidad): pierdes 15 puntos de aprobación y quedas a un paso de la destitución` }; } });
      for (const [id, que, nombre, icono] of [['capturarCorte', 'corte', 'Capturar la Corte (magistrados afines)', '⚖'], ['capturarControl', 'control', 'Capturar los órganos de control', '🕵'], ['reformaReeleccion', 'reeleccion', 'Reforma para reelegirte indefinidamente', '♾']])
        A.registrar({ id, nombre, icono, grupo: 'regimen', costo: 3,
          disponible(E) { const r = Rg.asegurar(E); return esPres(E) && r.tipo === 'democracia' ? (r.captura[que] ? 'Ya está hecho' : true) : 'Sólo un Presidente en democracia plena'; },
          ejecutar(E) { const q = U.clamp(0.45 + (E.opinion.aprobacionPres - 40) / 150, 0.2, 0.8); if (!U.chance(q)) { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 3, 3, 95); return { ok: true, exito: false, msg: `Se destapa el intento (${Math.round(q * 100)} % de probabilidad de éxito): escándalo nacional` }; } Rg.capturar(E, que); return { ok: true, msg: `Lo logras: ${nombre.toLowerCase()}. Las instituciones empiezan a plegarse` + (Rg.asegurar(E).tipo === 'democradura' ? '… ya es una democradura' : '') }; } });
      // — Conspirar y dar el golpe —
      A.registrar({ id: 'conspirarGolpe', nombre: 'Conspirar contra el Gobierno', icono: '🗡', grupo: 'regimen', costo: 3,
        disponible(E) { if (!Rg.democratico(E)) return 'Ya no hay democracia que derrocar'; if (esPres(E)) return 'Eres el Presidente: usa el autogolpe'; const m = P(E); return m.afin >= 45 && C.DATA.cargos[E.jugador.cargo].nivel >= 2 ? true : 'Necesitas el respaldo (afinidad 45+) de los militares y un cargo político'; },
        ejecutar(E) { const r = Rg.asegurar(E), J = E.jugador; if (!r.consp) r.consp = { lider: 'J', t0: E.fecha.t, avance: 0 }; r.consp.avance = Math.min(100, r.consp.avance + 20 + (P(E).afin - 45) / 5); if (U.chance(0.1)) { Rg.descubrirConspiracion(E); return { ok: true, exito: false, msg: 'La conspiración se descubre antes de tiempo' }; } return { ok: true, msg: `La conspiración avanza: ${Math.round(r.consp.avance)} %` + (r.consp.avance >= 100 ? '. Ya puedes dar el golpe.' : '') }; } });
      A.registrar({ id: 'ejecutarGolpe', nombre: 'Dar el golpe de Estado', icono: '🎖', grupo: 'regimen', costo: 4,
        disponible(E) { const r = Rg.asegurar(E); return r.consp && r.consp.lider === 'J' && r.consp.avance >= 100 && Rg.democratico(E) ? true : 'La conspiración todavía no está lista'; },
        ejecutar(E) { const r = Rg.asegurar(E), m = P(E), p = U.clamp(0.4 + (m.poder - 55) / 140 + (m.afin - 50) / 120 + (45 - E.opinion.aprobacionPres) / 160 - r.blindaje / 90, 0.15, 0.88);
          if (U.chance(p)) { Rg.golpe(E, 'J', 'cuartelazo'); return { ok: true, msg: `¡EL GOLPE TRIUNFA! (${Math.round(p * 100)} %). Eres el jefe de la junta militar` }; }
          r.consp = null; const J = E.jugador; J.riesgoJudicial = 100; C.Pais.ef(E, { escandalo: 'Golpe de Estado fallido', honestidad: -10, rec: -10 }); if (C.DATA.cargos[J.cargo].nivel >= 1) C.Personaje.dejarCargo(E, 'Es capturado tras un golpe fallido'); r.blindaje += 6; Rg.anotar(E, 'Fracasa tu golpe de Estado'); C.Medios.noticia(E, { tipo: 'gobierno', titular: `Fracasa el golpe de ${J.nombre}: lo capturan junto a los oficiales sublevados`, tono: 1, importante: true, jugador: true }); return { ok: true, exito: false, msg: `El golpe fracasa (${Math.round(p * 100)} %): quedas capturado y sin cargo` }; } });
      // — Jefe de la junta —
      A.registrar({ id: 'represionJunta', nombre: 'Ajustar el nivel de represión', icono: '🚔', grupo: 'regimen', costo: 1,
        disponible(E, a) { return junta(E) ? true : 'Sólo el jefe de la junta'; },
        ejecutar(E, a) { const j = junta(E), d = a.nivel === 'bajar' ? -15 : 15; j.repres = U.clamp(j.repres + d, 0, 100); j.resistencia = U.clamp(j.resistencia + (d > 0 ? -4 : 3), 0, 100); j.legit = U.clamp(j.legit + (d > 0 ? -2 : 2), 0, 100); Rg.asegurar(E).libertad = U.clamp(Rg.asegurar(E).libertad - d * 0.4, 5, 90); return { ok: true, msg: d > 0 ? 'Aprietas el puño: baja la resistencia visible, sube el rechazo' : 'Aflojas la mano: respira la sociedad y respira la oposición' }; } });
      A.registrar({ id: 'censuraJunta', nombre: 'Censurar a la prensa', icono: '📵', grupo: 'regimen', costo: 1,
        disponible(E) { return junta(E) ? true : 'Sólo el jefe de la junta'; },
        ejecutar(E) { const j = junta(E); j.censura = U.clamp(j.censura + 20, 0, 100); j.legit = U.clamp(j.legit + 1, 0, 100); j.aislamiento = U.clamp(j.aislamiento + 5, 0, 100); if (C.Poderes) C.Poderes.mover(E, 'prensa', -12); return { ok: true, msg: 'Cierras medios y censuras la información: menos críticas, más aislamiento' }; } });
      A.registrar({ id: 'plebiscitoJunta', nombre: 'Institucionalizar el régimen (plebiscito)', icono: '📜', grupo: 'regimen', costo: 3,
        disponible(E) { const j = junta(E); return j && Rg.asegurar(E).tipo === 'junta' ? true : 'Sólo el jefe de una junta'; },
        ejecutar(E) { const r = Rg.asegurar(E), j = r.junta, p = U.clamp(0.3 + j.legit / 130 - j.resistencia / 250, 0.15, 0.85); if (U.chance(p)) { r.tipo = 'autoritario'; j.legit = U.clamp(j.legit + 10, 0, 100); Rg.anotar(E, 'Un plebiscito legitima al régimen'); C.Medios.noticia(E, { tipo: 'gobierno', titular: 'La junta gana un plebiscito controlado: nace el régimen autoritario', tono: -1, importante: true, jugador: true }); return { ok: true, msg: `El plebiscito pasa (${Math.round(p * 100)} %): tu régimen se institucionaliza` }; } j.legit = U.clamp(j.legit - 12, 0, 100); j.resistencia = U.clamp(j.resistencia + 10, 0, 100); return { ok: true, exito: false, msg: 'El plebiscito fracasa: se deslegitima la junta' }; } });
      A.registrar({ id: 'convocarTransicion', nombre: 'Convocar la transición a la democracia', icono: '🕊', grupo: 'regimen', costo: 2,
        disponible(E) { const r = Rg.asegurar(E); return junta(E) && !r.transicion ? true : 'Sólo el jefe del régimen, si no hay ya una transición'; },
        ejecutar(E) { const r = Rg.asegurar(E); r.jugadorMesa = true; Rg.iniciarTransicion(E, 'la propia junta lo convoca', true); r.transicion.mesa = null; const m = C.Mesa.crear(E, 'transicion', 'transicion'); m.npc = false; r.transicion.mesa = m.id; return { ok: true, msg: 'Anuncias el regreso a la democracia y abres la mesa de transición', mesa: m.id }; } });
      // — Oposición bajo la junta —
      A.registrar({ id: 'organizarResistencia', nombre: 'Organizar la resistencia civil', icono: '✊', grupo: 'regimen', costo: 3,
        disponible(E) { const r = Rg.asegurar(E); return !Rg.democratico(E) && !junta(E) ? true : 'Sólo la oposición a un régimen no democrático'; },
        ejecutar(E) { const r = Rg.asegurar(E), j = r.junta; if (j) { j.resistencia = U.clamp(j.resistencia + 9, 0, 100); j.legit = U.clamp(j.legit - 2, 0, 100); } C.Opinion.subirRec(E, 2.5); if (U.chance(0.18)) { E.jugador.riesgoJudicial = U.clamp((E.jugador.riesgoJudicial || 0) + 20, 0, 100); return { ok: true, exito: false, msg: 'La resistencia crece, pero la policía política te sigue de cerca' }; } return { ok: true, msg: 'Crece la resistencia: marchas, cacerolazos y redes clandestinas' }; } });
      A.registrar({ id: 'negociarTransicion', nombre: 'Negociar con la junta la transición', icono: '🕊', grupo: 'regimen', costo: 2,
        disponible(E) { const r = Rg.asegurar(E); return !Rg.democratico(E) && !junta(E) && !E.mesas.activas.some(m => m.tipo === 'transicion' && !m.npc) ? true : 'No disponible'; },
        ejecutar(E) { const r = Rg.asegurar(E); r.jugadorMesa = true; if (!r.transicion) Rg.iniciarTransicion(E, 'negociación con la oposición', true); for (const m of E.mesas.activas) if (m.tipo === 'transicion') { m.npc = false; m.leverage = Rg.crearMesa(E).leverage; } let m = E.mesas.activas.find(x => x.tipo === 'transicion'); if (!m) { m = C.Mesa.crear(E, 'transicion', 'transicion'); m.npc = false; } r.transicion.mesa = m.id; return { ok: true, msg: 'Te sientas a negociar con la junta', mesa: m.id }; } });
      A.registrar({ id: 'exiliarse', nombre: 'Exiliarte', icono: '✈', grupo: 'regimen', costo: 1,
        disponible(E) { return !Rg.democratico(E) && !junta(E) ? (Rg.asegurar(E).exilio ? 'Ya estás en el exilio' : true) : 'No disponible'; },
        ejecutar(E) { Rg.asegurar(E).exilio = true; E.jugador.riesgoJudicial = 0; C.Opinion.subirRec(E, 1); return { ok: true, msg: 'Sales del país: tu seguridad mejora, tu influencia se enfría' }; } });
      A.registrar({ id: 'inscribirseTransicion', nombre: 'Inscribir tu candidatura en la transición', icono: '🗳', grupo: 'regimen', costo: 2,
        disponible(E) { const t = Rg.asegurar(E).transicion; return t && t.fase === 'electoral' && !E.elecciones.campana ? true : 'Sólo en la fase electoral de una transición'; },
        ejecutar(E) { const r = C.Elecciones.inscribir(E, 'presidencia', null, 'firmas'); return r.ok ? { ok: true, msg: 'Inscribes tu candidatura a la Presidencia para las elecciones de la transición' } : { ok: false, msg: r.msg }; } });
    }
  };
  C.Regimen = Rg; Rg.migrar = Rg.init;
  C.Tiempo.registrar('regimen', Rg, 74); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Regimen'); Rg.registrarAcciones();
})(window.CURUL);
