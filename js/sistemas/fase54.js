/* Fase 54: regiones con identidad y paros cívicos, crisis internacionales con decisiones, elecciones más vivas (eventos de campaña)
   y el legado del mandato (balance al dejar el poder). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'general', titular: txt, tono: tono == null ? 0 : tono, importante: !!imp, jugador: esPres(E) }); };
  const nomP = id => (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const dep = (E, r) => Object.values(E.deptos).filter(d => d.region === r);

  /* ───────── Regiones ───────── */
  const DEMANDAS = {
    Caribe: ['agua potable y energía confiable para la costa', 'frenar la erosión costera y proteger a las comunidades', 'puertos y vías para el comercio del Caribe'],
    Pacífico: ['vías y conectividad para el Pacífico', 'seguridad y presencia del Estado en el litoral', 'salud y educación para las comunidades afro e indígenas'],
    Andina: ['más vías terciarias y acceso a mercados para el campo', 'transporte masivo y vivienda en las ciudades', 'precios justos para los cultivos andinos'],
    Amazonía: ['conectividad y presencia estatal en la selva', 'proteger la selva sin criminalizar a los colonos', 'salud y educación en zonas remotas'],
    Orinoquía: ['infraestructura vial para los llanos', 'seguridad jurídica para el agro y la ganadería', 'regalías petroleras para el territorio'],
    Insular: ['abastecimiento y transporte para las islas', 'protección frente a los huracanes', 'defensa de la soberanía y la reserva marina']
  };
  const Rg = {
    clave: 'regiones', DEMANDAS,
    nombres(E) { return [...new Set(Object.values(E.deptos).map(d => d.region))]; },
    asegurar(E) { if (E.regiones && E.regiones.sat) return E.regiones; const sat = {}; for (const r of Rg.nombres(E)) sat[r] = Rg.objetivo(E, r); E.regiones = { sat, paro: {}, dem: {}, ult: -999, ultAt: {}, hist: [] }; return E.regiones; },
    init(E) { E.regiones = null; }, migrar(E) { Rg.asegurar(E); },
    objetivo(E, r) { const d = dep(E, r); if (!d.length) return 50; const m = k => U.suma(d.map(x => x[k])) / d.length; return cl(m('seguridad') * 0.3 + m('educacion') * 0.2 + m('salud') * 0.2 + m('infraestructura') * 0.2 + (30 - m('pobreza')) * 0.4 + 20, 5, 95); },
    anotar(E, txt) { const R = Rg.asegurar(E); R.hist.unshift({ t: E.fecha.t, txt }); if (R.hist.length > 12) R.hist.length = 12; },
    turno(E) {
      C.instalarRitmo && C.instalarRitmo();
      const R = Rg.asegurar(E), t = E.fecha.t;
      for (const r of Rg.nombres(E)) {
        R.sat[r] = cl(R.sat[r] + (Rg.objetivo(E, r) - R.sat[r]) * 0.01 + U.gauss(0, 0.25) - (esPres(E) ? 0.02 : 0), 0, 100);
        const p = R.paro[r];
        if (p) { p.sev = cl(p.sev + 0.05, 1, 4); for (const d of dep(E, r)) d.seguridad = cl(d.seguridad - 0.08 * p.sev, 1, 99); if (esPres(E)) E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.03 * p.sev, 3, 95); if (R.sat[r] > 45 && !E.meta.presim) { delete R.paro[r]; noti(E, `Termina el paro cívico en la región ${r}`, 1); Rg.anotar(E, `Se levanta el paro cívico: ${r}`); } }
        else if (R.sat[r] < 22 && !E.meta.presim && U.chance(0.02)) { R.paro[r] = { t, sev: 1 }; noti(E, `PARO CÍVICO en la región ${r}: bloqueos y marchas exigen atención del Gobierno`, -1, true); Rg.anotar(E, `Estalla un paro cívico en ${r}`); }
      }
      if (E.meta.presim || !esPres(E) || E.eventos.pendientes.length || t - R.ult < 12 || !U.chance(0.012)) return;
      const r = U.pesado(Rg.nombres(E), x => 5 + (100 - R.sat[x])), txt = U.pick(DEMANDAS[r] || ['más atención del Gobierno']); R.ult = t;
      C.Eventos.disparar(E, C.Eventos.plantilla('rg_demanda'), { forzar: true, vars: { region: r, txt } });
    },
    mover(E, r, d, msg) { const R = Rg.asegurar(E); R.sat[r] = cl(R.sat[r] + d, 0, 100); return msg || ''; },
    registrarAcciones() {
      const R = C.Acciones.registrar.bind(C.Acciones), ok = (E, a) => Rg.nombres(E).includes(a.region) ? true : 'Elige la región';
      R({ id: 'invertirRegion', nombre: 'Anunciar un plan de inversión para una región', icono: '🏗', grupo: 'gobierno', costo: 2, disponible: ok,
        ejecutar(E, a) { C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.25), p: 'm' }], 'region'); Rg.mover(E, a.region, 15); for (const d of dep(E, a.region)) d.infraestructura = cl(d.infraestructura + 0.5, 1, 99); const R0 = Rg.asegurar(E); if (R0.dem[a.region]) delete R0.dem[a.region]; C.Opinion.subirRec(E, 0.6); return { ok: true, msg: `Anuncias un plan para la región ${a.region}: sube la satisfacción y mejora su infraestructura` }; } });
      R({ id: 'visitarRegion', nombre: 'Visitar una región y escuchar a sus líderes', icono: '🚌', grupo: 'gobierno', costo: 1,
        disponible(E, a) { const o = ok(E, a); if (o !== true) return o; const u = Rg.asegurar(E).ultAt[a.region]; return u != null && E.fecha.t - u < 8 ? 'Ya la visitaste hace poco' : true; },
        ejecutar(E, a) { Rg.asegurar(E).ultAt[a.region] = E.fecha.t; Rg.mover(E, a.region, 6); C.Opinion.subirRec(E, 0.6); return { ok: true, msg: `Recorres la región ${a.region}: la gente se siente escuchada` }; } });
    }
  };
  C.Regiones = Rg; C.Tiempo.registrar('regiones', Rg, 69); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Regiones'); Rg.registrarAcciones();

  /* ───────── Crisis internacionales ───────── */
  const TIPOS = {
    frontera: { n: 'Incidente en la frontera', ic: '🪖', pais: ['VEN', 'ECU', 'PER', 'BRA'], txt: p => `Tropas y civiles chocan en la frontera con ${nomP(p)}. Hay heridos, cierre de pasos y tensión diplomática.` },
    migracion: { n: 'Oleada migratoria', ic: '🚶', pais: ['VEN', 'ECU'], txt: p => `Una crisis en ${nomP(p)} empuja a miles de personas hacia Colombia: los municipios fronterizos se desbordan.` },
    bloqueo: { n: 'Sanciones y bloqueo comercial', ic: '🚢', pais: ['USA', 'VEN', 'ECU'], txt: p => `${nomP(p)} anuncia sanciones y trabas aduaneras contra los productos colombianos.` }
  };
  const Ci = {
    clave: 'crisisInt', TIPOS,
    asegurar(E) { if (E.crisisInt && E.crisisInt.activas) return E.crisisInt; E.crisisInt = { ult: -999, activas: [], hist: [] }; return E.crisisInt; },
    init(E) { E.crisisInt = null; }, migrar(E) { Ci.asegurar(E); },
    abrir(E, tipo, pais) { const c = Ci.asegurar(E), x = { id: U.id('ci'), tipo, pais, sev: U.ri(35, 55), t0: E.fecha.t, estado: 'activa' }; c.activas.unshift(x); c.ult = E.fecha.t; return x; },
    efecto(E, x) { const sev = x.sev; if (x.tipo === 'frontera') { for (const d of Object.values(E.deptos)) if (['Caribe', 'Andina', 'Amazonía', 'Orinoquía'].includes(d.region)) d.seguridad = cl(d.seguridad - 0.01 * sev / 20, 1, 99); } else if (x.tipo === 'migracion') { C.Economia.aplicarDelta(E, 'desempleo', 0.002 * sev / 20); } else C.Economia.aplicarDelta(E, 'exportaciones', -0.01 * sev / 20); if (esPres(E)) E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.03 * sev / 30, 3, 95); },
    turno(E) {
      const c = Ci.asegurar(E), t = E.fecha.t;
      for (const x of c.activas) { if (x.estado !== 'activa') continue; x.sev = cl(x.sev + 0.12, 0, 100); Ci.efecto(E, x); if (x.sev <= 8) { x.estado = 'resuelta'; x.t1 = t; noti(E, `Se supera la crisis: ${TIPOS[x.tipo].n.toLowerCase()} con ${nomP(x.pais)}`, 1); } else if (t - x.t0 > 104) { x.estado = 'enquistada'; } }
      c.activas = c.activas.filter(x => x.estado === 'activa' || t - (x.t1 || x.t0) < 30); if (c.activas.length > 6) c.activas.length = 6;
      if (E.meta.presim || !esPres(E) || E.eventos.pendientes.length || t - c.ult < 40 || c.activas.filter(x => x.estado === 'activa').length >= 2 || !U.chance(0.006)) return;
      const tipo = U.pick(Object.keys(TIPOS)), pais = U.pick(TIPOS[tipo].pais.filter(p => C.Diplomacia.pais(p) && E.diplomacia.paises[p]));
      if (!pais) return; const x = Ci.abrir(E, tipo, pais);
      C.Eventos.disparar(E, C.Eventos.plantilla('ci_crisis'), { forzar: true, vars: { cid: x.id, titulo: TIPOS[tipo].n, txt: TIPOS[tipo].txt(pais), pais: nomP(pais) } });
    },
    gestionar(E, x, via) {
      const st = E.diplomacia.paises[x.pais], rel = d => { if (st) st.relacion = cl(st.relacion + d, 3, 97); };
      if (via === 'diplomacia') { x.sev = cl(x.sev - U.ri(8, 16), 0, 100); rel(3); return `Tu cancillería negocia con ${nomP(x.pais)}: baja la tensión`; }
      if (via === 'fuerza') { x.sev = cl(x.sev - U.ri(10, 24), 0, 100); rel(-6); if (U.chance(0.25)) { x.sev = cl(x.sev + 12, 0, 100); return `La mano dura con ${nomP(x.pais)} escala el conflicto antes de calmarlo`; } C.Opinion.subirRec(E, 0.5); return `Muestras firmeza frente a ${nomP(x.pais)}: la crisis cede, a costa de la relación`; }
      if (via === 'bloque') { const b = ['can', 'mercosur'].find(id => C.Bloques.existe(E, id) && C.Bloques.colMiembro(E, id)); const f = b ? 14 : 6; x.sev = cl(x.sev - f, 0, 100); return b ? `Llevas el caso ${b === 'can' ? 'a la' : 'al'} ${C.Bloques.nombre(b)}: el respaldo regional pesa` : 'Buscas respaldo en la OEA y la ONU: ayuda, pero poco'; }
      x.sev = cl(x.sev - 10, 0, 100); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.2), p: 'm' }], 'crisisint'); return 'Destinas recursos humanitarios y logísticos: se alivia la presión';
    },
    registrarAcciones() {
      C.Acciones.registrar({ id: 'gestionarCrisisInt', nombre: 'Gestionar una crisis internacional', icono: '🌐', grupo: 'diplomacia', costo: 1,
        disponible(E, a) { const x = Ci.asegurar(E).activas.find(q => q.id === a.crisis); return x && x.estado === 'activa' ? (['diplomacia', 'fuerza', 'bloque', 'ayuda'].includes(a.via) ? true : 'Elige la vía') : 'Elige una crisis activa'; },
        ejecutar(E, a) { const x = Ci.asegurar(E).activas.find(q => q.id === a.crisis); return { ok: true, msg: Ci.gestionar(E, x, a.via) }; } });
    }
  };
  C.CrisisInt = Ci; C.Tiempo.registrar('crisisInt', Ci, 70); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('CrisisInt'); Ci.registrarAcciones();

  /* ───────── Legado ───────── */
  const Lg = {
    clave: 'balanceM',
    asegurar(E) { if (E.balanceM && E.balanceM.hist) return E.balanceM; E.balanceM = { eraPres: false, hist: [], t0: null }; return E.balanceM; },
    init(E) { E.balanceM = null; }, migrar(E) { Lg.asegurar(E); },
    balance(E) {
      const eco = E.economia, ds = Object.values(E.deptos), seg = U.suma(ds.map(d => d.seguridad)) / ds.length, J = E.jugador;
      const casos = C.CIDH && C.CIDH.asegurar ? (C.CIDH.asegurar(E).casos || []).length : 0;
      const dem = E.regimen ? (E.regimen.tipo === 'democracia' ? 80 : 30) - (E.regimen.golpes || 0) * 10 : 70;
      const c = { Popularidad: E.opinion.aprobacionPres, Economía: cl(50 + (eco.crecimiento || 0) * 4 - (eco.desempleo - 10) * 2 - (eco.pobreza - 30) * 0.8 - (eco.inflacion - 4) * 1.5, 5, 95), Seguridad: seg, Honestidad: (J.rep.honestidad + J.rep.transparencia) / 2, Instituciones: cl(dem - Math.min(25, casos * 1.5), 5, 95), Territorio: U.suma(Rg.nombres(E).map(r => Rg.asegurar(E).sat[r])) / Math.max(1, Rg.nombres(E).length) };
      for (const k of Object.keys(c)) c[k] = Math.round(cl(c[k], 0, 100)); const total = Math.round(U.suma(Object.values(c)) / Object.keys(c).length);
      const titulo = total >= 72 ? 'Estadista' : total >= 60 ? 'Presidente respetado' : total >= 48 ? 'Un mandato gris' : total >= 36 ? 'Mandato polémico' : 'Un gobierno para el olvido';
      return { c, total, titulo };
    },
    turno(E) {
      const L = Lg.asegurar(E), es = esPres(E);
      if (es && !L.eraPres) { L.eraPres = true; L.t0 = E.fecha.t; }
      else if (!es && L.eraPres) {
        L.eraPres = false; const b = Lg.balance(E); L.hist.unshift({ t: E.fecha.t, t0: L.t0, total: b.total, titulo: b.titulo, c: b.c }); if (L.hist.length > 6) L.hist.length = 6;
        if (!E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('lg_balance'), { forzar: true, vars: { titulo: b.titulo, total: b.total, mejor: Object.entries(b.c).sort((x, y) => y[1] - x[1])[0][0], peor: Object.entries(b.c).sort((x, y) => x[1] - y[1])[0][0] } });
      }
    }
  };
  C.BalanceM = Lg; C.Tiempo.registrar('balanceM', Lg, 90); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('BalanceM');

  /* ───────── Elecciones más vivas ───────── */
  const EV = {
    turno(E) { if (E.meta.presim || !E.elecciones || !E.elecciones.campana || E.eventos.pendientes.length) return; const k = E.elecciones; if (E.fecha.t - (k.ultVivo || -999) < 6 || !U.chance(0.014)) return; k.ultVivo = E.fecha.t; C.Eventos.disparar(E, C.Eventos.plantilla(U.pick(['el_escandalo', 'el_independiente', 'el_pregunta', 'el_blanco'])), { forzar: true }); }
  };
  C.Tiempo.registrar('eleccionesVivas', EV, 71);


  /* ───────── Ritmo de eventos (ajuste) ───────── */
  const RITMOS = { vivo: ['Vivo', 0], normal: ['Normal', 0], tranquilo: ['Tranquilo', 3] };
  const SEGUROS = ['economico', 'politico', 'general', 'regional', 'personal', 'area', 'actores', 'bloques', 'fase54', 'diplomacia'];
  let instalado = false;
  C.instalarRitmo = function () {
    if (instalado || !C.Eventos) return; instalado = true; const dis = C.Eventos.disparar;
    C.Eventos.disparar = function (E, pl, o) {
      const r = E && E.ajustes && E.ajustes.ritmo, gap = r && RITMOS[r] ? RITMOS[r][1] : 0;
      if (gap && pl && SEGUROS.includes(pl.tipo) && E.ajustes.ultEv != null && E.fecha.t - E.ajustes.ultEv < gap) return null;
      const res = dis.apply(this, arguments); if (E && E.ajustes) E.ajustes.ultEv = E.fecha.t; return res;
    };
  };
  C.Acciones.registrar({ id: 'fijarRitmo', nombre: 'Ajustar el ritmo de los eventos', icono: '🎚', grupo: 'personal', costo: 0,
    disponible(E, a) { return RITMOS[a.nivel] ? true : 'Elige el ritmo'; },
    ejecutar(E, a) { E.ajustes = E.ajustes || {}; E.ajustes.ritmo = a.nivel; return { ok: true, msg: `Ritmo de eventos: ${RITMOS[a.nivel][0]}${a.nivel === 'tranquilo' ? ' (menos eventos secundarios seguidos; los hitos históricos y electorales no se tocan)' : ''}` }; } });
  C.RITMOS = RITMOS;

  /* ───────── Eventos ───────── */
  const ef = o => E => C.Pais.ef(E, o);
  const ev = (id, ic, titulo, texto, ops, tipo) => ({ id, tipo: tipo || 'fase54', icono: ic, alcance: 'jugador', sistema: true, peso: 1, titulo, texto, opciones: ops.map(([t, f]) => ({ t, fn: typeof f === 'function' ? f : ef(f) })) });
  C.DATA.eventos = (C.DATA.eventos || []).concat([
    ev('rg_demanda', '🗺', 'La región {region} reclama atención', 'Los líderes de la región {region} exigen {txt}. Amenazan con un paro cívico si el Gobierno no responde.', [
      ['Comprometer un plan de inversión', (E, e) => { C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.25), p: 'm' }], 'region'); Rg.mover(E, e.ctx.vars.region, 14); return C.Pais.ef(E, { rec: 0.8 }); }],
      ['Visitar la región y escuchar', (E, e) => { Rg.mover(E, e.ctx.vars.region, 5); return C.Pais.ef(E, { rec: 1 }); }],
      ['Remitirlos a la gobernación', (E, e) => { Rg.mover(E, e.ctx.vars.region, -5); return C.Pais.ef(E, { rec: 0 }); }]]),
    ev('ci_crisis', '🌐', '{titulo}: {pais}', '{txt}', [
      ['Vía diplomática: llamar a consultas y negociar', (E, e) => { const x = Ci.asegurar(E).activas.find(q => q.id === e.ctx.vars.cid); return x ? Ci.gestionar(E, x, 'diplomacia') : ''; }],
      ['Mostrar fuerza: reforzar la frontera y responder', (E, e) => { const x = Ci.asegurar(E).activas.find(q => q.id === e.ctx.vars.cid); return x ? Ci.gestionar(E, x, 'fuerza') : ''; }],
      ['Llevar el caso al bloque regional', (E, e) => { const x = Ci.asegurar(E).activas.find(q => q.id === e.ctx.vars.cid); return x ? Ci.gestionar(E, x, 'bloque') : ''; }]], 'diplomacia'),
    ev('lg_balance', '🏅', 'Fin del mandato: {titulo}', 'Dejas el poder con un balance de {total} sobre 100. Lo mejor de tu gobierno: {mejor}; lo más débil: {peor}. La historia empieza a juzgarte.', [
      ['Escribir tus memorias', E => { E.jugador.patrimonio += 40; return C.Pais.ef(E, { rec: 2 }); }],
      ['Crear una fundación y apoyar a tu partido', E => C.Pais.ef(E, { rec: 1, partido: 3 })],
      ['Retirarte con discreción', E => C.Pais.ef(E, { honestidad: 1, rec: 0.5 })]]),
    ev('el_escandalo', '🗞', 'Escándalo de último minuto', 'A pocas semanas de la votación, un medio publica documentos que comprometen a gente de tu campaña. Los rivales piden explicaciones.', [
      ['Desmentir con pruebas y contraatacar', E => C.Pais.ef(E, { rec: 1, honestidad: -1 })],
      ['Reconocer el error y pedir perdón', E => C.Pais.ef(E, { honestidad: 2, rec: -0.5 })],
      ['Guardar silencio', E => C.Pais.ef(E, { rec: -1.5, escandalo: 'Escándalo de campaña' })]], 'elecciones'),
    ev('el_independiente', '🌱', 'Surge un movimiento independiente', 'Un movimiento ciudadano sin partido gana terreno en las encuestas y critica a toda la clase política, incluida tu campaña.', [
      ['Buscar un acuerdo programático con ellos', E => C.Pais.ef(E, { rec: 1.5, partido: -1 })],
      ['Descalificarlos como «outsiders»', E => C.Pais.ef(E, { rec: 0.5, honestidad: -1 })],
      ['Ignorarlos', E => C.Pais.ef(E, { rec: -0.5 })]], 'elecciones'),
    ev('el_pregunta', '🎤', 'Pregunta incómoda del público', 'En un foro ciudadano, una joven te pregunta por qué debería creerte después de tantas promesas incumplidas.', [
      ['Responder con datos y compromisos concretos', E => C.Pais.ef(E, { rec: 1.5, honestidad: 1 })],
      ['Esquivar con un discurso', E => C.Pais.ef(E, { rec: 0 })],
      ['Enojarte', E => C.Pais.ef(E, { rec: -1.5, honestidad: -1 })]], 'elecciones'),
    ev('el_blanco', '⬜', 'Campaña por el voto en blanco', 'Colectivos ciudadanos llaman a votar en blanco como protesta contra todos los candidatos. Los analistas debaten cuánto restará.', [
      ['Responder con propuestas nuevas para los desencantados', E => C.Pais.ef(E, { rec: 1.2, honestidad: 1 })],
      ['Pedir el voto útil', E => C.Pais.ef(E, { rec: 0.6 })],
      ['Burlarte de la iniciativa', E => C.Pais.ef(E, { rec: -0.5, honestidad: -1 })]], 'elecciones')
  ]);
})(window.CURUL);
