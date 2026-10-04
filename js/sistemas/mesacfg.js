/* Condiciones de una negociación (Fase 52): antes de abrir cualquier mesa eliges la sede, los compromisarios (tu equipo negociador) y las
   garantías. Todo tiene costo (puntos de agenda, fiscal, aprobación) pero compra algo: confianza inicial, menos incidentes, un equipo más
   hábil, un escudo político si delegas, y un acuerdo más duradero. Los acuerdos firmados quedan «vigentes» y pueden cumplirse o romperse. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, Mesa = C.Mesa, esPres = E => E.gobierno.presidente === 'J';
  const nomP = id => (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const SEDES = {
    bogota: { n: 'Casa de Nariño (Bogotá)', ic: '🏛', fiscal: 0, aprob: 0, conf: 0, mom: 0, lev: 4, inc: 0, nota: 'Sin costo; juegas de local, pero la contraparte desconfía de la sede oficial.' },
    neutral: { n: 'Sede neutral en Bogotá (universidad u hotel)', ic: '🏨', fiscal: 0.03, aprob: 0, conf: 3, mom: 1, lev: 0, inc: -0.02, nota: 'Barata y discreta: un poco más de confianza.' },
    iglesia: { n: 'Nunciatura (sede de la Iglesia)', ic: '⛪', fiscal: 0.02, aprob: 0, conf: 6, mom: 2, lev: -1, inc: -0.04, nota: 'Terreno respetado por ambos lados.' },
    region: { n: 'En el territorio (zona de encuentro)', ic: '⛺', fiscal: 0.05, aprob: -0.4, conf: 8, mom: 3, lev: -3, inc: 0.08, tipos: ['paz', 'paro', 'actor', 'pacto'], nota: 'Mucha confianza y gesto simbólico, pero más riesgo de incidentes y costo político.' },
    exterior: { n: 'En el exterior', ic: '✈', fiscal: 0.12, aprob: -0.2, conf: 7, mom: 4, lev: -4, inc: -0.06, pts: 1, tipos: ['paz', 'transicion', 'cartel'], nota: 'Un país anfitrión da garantías y discreción; cuesta y cede control.' }
  };
  const ANFITRIONES = ['CUB', 'NOR', 'CHL', 'MEX', 'ESP'];
  const GARANT = {
    ninguna: { n: 'Sin garantes', fiscal: 0, conf: 0, durab: 0, nota: '' },
    iglesia: { n: 'La Iglesia como garante', fiscal: 0, conf: 3, durab: 8 },
    onu: { n: 'Verificación de la ONU', fiscal: 0.1, conf: 6, durab: 18, pts: 1 },
    paises: { n: 'Países garantes y acompañantes', fiscal: 0.05, conf: 5, durab: 14 },
    corte: { n: 'Blindaje jurídico (control de la Corte)', fiscal: 0.02, conf: 0, durab: 16, rondas: 2 },
    fondo: { n: 'Fondo de implementación', fiscal: 0.35, conf: 4, durab: 22 },
    congreso: { n: 'Ratificación del Congreso', fiscal: 0, aprob: -0.2, conf: 2, durab: 12, pts: 1 }
  };
  const M = {
    SEDES, GARANT, ANFITRIONES,
    cfg(E) { const m = Mesa.asegurar(E); if (!m.cfg) m.cfg = { sede: 'bogota', n1: 'yo', n2: 'ninguno', g1: 'ninguna', g2: 'ninguna', host: 'CUB' }; if (!m.pactos) m.pactos = []; return m.cfg; },
    sedesPara(E, tipo) { const out = []; for (const [k, s] of Object.entries(SEDES)) if (!s.tipos || s.tipos.includes(tipo)) { if (k === 'exterior') for (const h of ANFITRIONES) { if (C.Diplomacia.pais(h)) out.push({ k: 'exterior:' + h, n: `En ${nomP(h)}`, s }); } else out.push({ k, n: s.n, s }); } return out; },
    sede(c) { const [k, h] = String(c.sede).split(':'); return Object.assign({ k, host: h }, SEDES[k] || SEDES.bogota); },
    calidadYo(E) { const J = E.jugador; return Math.round(cl(35 + ((J.atributos && J.atributos.negociacion) || 50) * 0.4 + (J.reconocimiento || 0) * 0.2, 20, 95)); },
    candidatos(E) { const X = C.Exterior; return X ? X.candidatos(E).map(p => ({ id: p.id, n: p.nombre, cal: X.desdePolitico(E, p).calidad })).sort((a, b) => b.cal - a.cal).slice(0, 12) : []; },
    miembro(E, k) { if (k === 'yo') return { id: 'yo', n: E.jugador.nombre, cal: M.calidadYo(E) }; if (!k || k === 'ninguno') return null; const p = E.politicos[k]; return p && p.activo && !p.mesaId ? { id: k, n: p.nombre, cal: C.Exterior.desdePolitico(E, p).calidad } : null; },
    equipo(E, c) {
      const a = M.miembro(E, c.n1), b = c.n2 !== c.n1 ? M.miembro(E, c.n2) : null, base = { id: 'tec', n: 'Equipo técnico de la Cancillería', cal: 40 };
      const l = [a, b].filter(Boolean); const cal = !l.length ? base.cal : l.length === 1 ? l[0].cal : l[0].cal * 0.65 + l[1].cal * 0.35;
      return { miembros: l.length ? l : [base], cal: Math.round(cal), yo: l.some(x => x.id === 'yo') };
    },
    costo(E, tipo, c) {
      c = c || M.cfg(E); const s = M.sede(c), eq = M.equipo(E, c), gs = [GARANT[c.g1], c.g2 !== c.g1 ? GARANT[c.g2] : null].filter(Boolean);
      let fiscal = (s.fiscal || 0) + gs.reduce((a, g) => a + (g.fiscal || 0), 0), aprob = (s.aprob || 0) + gs.reduce((a, g) => a + (g.aprob || 0), 0), pts = (s.pts || 0) + gs.reduce((a, g) => a + (g.pts || 0), 0);
      for (const x of eq.miembros) if (x.id !== 'yo' && x.id !== 'tec') fiscal += Math.max(0, x.cal - 50) * 0.003;
      return { fiscal: +fiscal.toFixed(2), aprob: +aprob.toFixed(1), pts, eq, s, gs };
    },
    estadoCfg(E, tipo) {
      const c = M.cfg(E), s = M.sede(c); if (s.tipos && !s.tipos.includes(tipo)) return 'La sede elegida no sirve para este tipo de mesa';
      for (const k of [c.n1, c.n2]) if (k !== 'yo' && k !== 'ninguno' && !M.miembro(E, k)) return 'Un compromisario ya no está disponible';
      return true;
    },
    aplicar(E, m) {
      const c = Object.assign({}, M.cfg(E)), K = M.costo(E, m.tipo, c); m.cfg = { sede: c.sede, sedeN: K.s.k === 'exterior' ? `En ${nomP(K.s.host)}` : K.s.n, host: K.s.host, equipo: K.eq.miembros.map(x => ({ id: x.id, n: x.n, cal: x.cal })), eqCal: K.eq.cal, yo: K.eq.yo, garantias: K.gs.filter(g => g !== GARANT.ninguna).map(g => g.n), durab: K.gs.reduce((a, g) => a + (g.durab || 0), 0), inc: K.s.inc + (K.gs.some(g => g === GARANT.onu) ? -0.03 : 0) };
      m.confianza = cl(m.confianza + K.s.conf + K.gs.reduce((a, g) => a + (g.conf || 0), 0), 0, 100); m.momentum += K.s.mom; m.leverage = cl((m.leverage || 50) + K.s.lev, 5, 95); m.max += K.gs.reduce((a, g) => a + (g.rondas || 0), 0);
      for (const x of K.eq.miembros) { const p = E.politicos[x.id]; if (p) p.mesaId = m.id; }
      if (K.fiscal) C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(K.fiscal), p: 'm' }], 'mesa');
      if (K.aprob) E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + K.aprob, 3, 95);
      if (K.s.host && E.diplomacia.paises[K.s.host]) E.diplomacia.paises[K.s.host].relacion = cl(E.diplomacia.paises[K.s.host].relacion + 3, 3, 97);
      Mesa.log(m, `Condiciones: sede ${m.cfg.sedeN}; equipo ${m.cfg.equipo.map(x => x.n).join(' y ')} (habilidad ${m.cfg.eqCal}); garantías: ${m.cfg.garantias.join(', ') || 'ninguna'}`);
    }
  };
  C.MesaCfg = M;
  // ── envolturas del motor de mesas ──
  const crear = Mesa.crear; Mesa.crear = function (E, tipo, ref, extra) { const m = crear.call(Mesa, E, tipo, ref, extra); if (Mesa._usar) M.aplicar(E, m); return m; };
  const tactica = Mesa.tactica; Mesa.tactica = function (E, m, id, t1, t2) {
    if (!m.cfg || !['proponer', 'ceder', 'presionar', 'paquete', 'ultimatum'].includes(id)) return tactica.call(Mesa, E, m, id, t1, t2);
    const antes = m.temas.map(t => t.brecha), ef = cl(0.55 + m.cfg.eqCal / 100 * 0.9, 0.6, 1.4); const msg = tactica.call(Mesa, E, m, id, t1, t2);
    m.temas.forEach((t, i) => { const d = antes[i] - t.brecha; if (d > 0 && t.estado === 'abierto') t.brecha = cl(antes[i] - d * ef, 0, 100); });
    return msg + (ef >= 1.1 ? ' (tu equipo negociador rinde)' : ef <= 0.85 ? ' (tu equipo es flojo)' : '');
  };
  const ronda = Mesa.ronda; Mesa.ronda = function (E, m) {
    const tenia = !!m.pendiente; ronda.call(Mesa, E, m);
    if (m.cfg && !tenia && m.estado === 'abierta') { const inc = m.cfg.inc || 0; if (inc < 0 && m.pendiente && U.chance(-inc * 6)) { Mesa.log(m, `Incidente evitado: ${m.pendiente.n} (las condiciones de la mesa lo contuvieron)`); m.pendiente = null; } else if (inc > 0 && !m.pendiente && U.chance(inc)) { const pool = Mesa.INC.filter(i => !i.tipos || i.tipos.includes(m.tipo)), x = U.pick(pool); m.pendiente = { id: x.id, n: x.n, txt: x.txt, ops: x.ops.map(o => ({ t: o[0], fx: o[1] })) }; Mesa.log(m, `Incidente: ${x.n}`); } }
  };
  const fx = Mesa.fx; Mesa.fx = function (E, m, f) { if (m.cfg && !m.cfg.yo && f && f.aprob < 0) f = Object.assign({}, f, { aprob: f.aprob * 0.5 }); return fx.call(Mesa, E, m, f); };
  const cerrar = Mesa.cerrar; Mesa.cerrar = function (E, m, r) {
    if (m.cfg) for (const x of m.cfg.equipo) { const p = E.politicos[x.id]; if (p && p.mesaId === m.id) p.mesaId = null; }
    cerrar.call(Mesa, E, m, r);
    if (m.cfg && r === 'acuerdo') { const P = M.cfg(E) && Mesa.asegurar(E).pactos; P.unshift({ id: U.id('pc'), titulo: m.titulo, tipo: m.tipo, ref: m.ref, t0: E.fecha.t, durab: cl(28 + m.cfg.durab + (m.cfg.eqCal - 50) * 0.3 + m.confianza * 0.15, 15, 100), garantias: m.cfg.garantias, estado: 'vigente', ult: -99 }); if (P.length > 12) P.length = 12; }
  };
  const turno = Mesa.turno; Mesa.turno = function (E) {
    turno.call(Mesa, E); const P = Mesa.asegurar(E).pactos || [], t = E.fecha.t;
    for (const p of P) if (p.estado === 'vigente') {
      p.durab = cl(p.durab - 0.12, 0, 100);
      if (E.meta.presim) continue;
      if (p.durab < 18 && U.chance(0.03)) { p.estado = 'roto'; for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad - 0.3, 1, 99); if (esPres(E)) E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 2, 3, 95); C.Medios.noticia(E, { tipo: 'general', titular: `Se rompe lo acordado en «${p.titulo}»: incumplimientos y desconfianza`, tono: -1, importante: true, jugador: esPres(E) }); }
      else if (t - p.t0 >= 104 && p.durab >= 30) { p.estado = 'consolidado'; C.Opinion.subirRec(E, 2); C.Medios.noticia(E, { tipo: 'general', titular: `Se consolida lo acordado en «${p.titulo}»: dos años de cumplimiento`, tono: 1, jugador: esPres(E) }); }
    }
  };
  // ── acciones ──
  const A = C.Acciones;
  A.registrar({ id: 'configurarMesa', nombre: 'Definir sede, compromisarios y garantías de la próxima mesa', icono: '⚙', grupo: 'negociacion', costo: 0,
    disponible(E, a) { return a.sede ? true : 'Elige la sede'; },
    ejecutar(E, a) { const c = M.cfg(E); c.sede = a.sede; c.n1 = a.n1 || 'yo'; c.n2 = a.n2 || 'ninguno'; c.g1 = a.g1 || 'ninguna'; c.g2 = a.g2 || 'ninguna'; const K = M.costo(E, 'paz', c); return { ok: true, msg: `Condiciones guardadas: costo ${K.fiscal ? 'fiscal ' + K.fiscal : 'fiscal nulo'}${K.aprob ? ', aprobación ' + K.aprob : ''}${K.pts ? ', +' + K.pts + ' pts de agenda' : ''}; equipo con habilidad ${K.eq.cal}` }; } });
  A.registrar({ id: 'reforzarPacto', nombre: 'Reforzar el cumplimiento de un acuerdo', icono: '🛠', grupo: 'negociacion', costo: 1,
    disponible(E, a) { const p = (Mesa.asegurar(E).pactos || []).find(x => x.id === a.pacto); return p && p.estado === 'vigente' ? (E.fecha.t - p.ult < 12 ? 'Espera unas semanas entre refuerzos' : true) : 'Elige un acuerdo vigente'; },
    ejecutar(E, a) { const p = Mesa.asegurar(E).pactos.find(x => x.id === a.pacto); p.durab = cl(p.durab + 10, 0, 100); p.ult = E.fecha.t; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.1), p: 'm' }], 'pacto'); return { ok: true, msg: `Destinas recursos y seguimiento a «${p.titulo}»: el acuerdo se afianza` }; } });
  // acciones que abren mesas: usan las condiciones y cuestan lo que cuesten
  for (const [id, tipo] of [['abrirMesa', null], ['negociarSometimiento', 'cartel'], ['pactoActor', 'actor']]) {
    const o = A.get(id); if (!o) continue;
    A.registrar(Object.assign({}, o, {
      costo: (E, a) => (typeof o.costo === 'function' ? o.costo(E, a) : o.costo || 0) + M.costo(E, tipo || (a && a.tipo) || 'paz').pts,
      disponible(E, a) { const r = o.disponible(E, a); if (r !== true) return r; return M.estadoCfg(E, tipo || (a && a.tipo) || 'paz'); },
      ejecutar(E, a) { Mesa._usar = true; try { return o.ejecutar(E, a); } finally { Mesa._usar = false; } }
    }));
  }
})(window.CURUL);
