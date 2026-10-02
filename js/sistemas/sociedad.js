/* Riesgo y sociedad (Fase 33): (1) desastres naturales y la UNGRD —inundaciones, deslizamientos, incendios, sismos— con
   respuesta, calamidad pública, prevención y reconstrucción; (2) consulta previa a comunidades étnicas para megaproyectos
   extractivos y de infraestructura, con concertación, beneficios y el riesgo de saltársela (tutela, suspensión); y
   (3) narcotráfico: carteles con fuerza, corrupción y lavado, que se enfrentan con golpes, extradición, sometimiento y
   control financiero, y que se fragmentan cuando caen (el «efecto cucaracha»). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const gestorDe = (E, dep) => {
    const J = E.jugador;
    return E.gobierno.presidente === 'J' || (J.cargo === 'gobernador' && J.cargoInfo && J.cargoInfo.depto === dep) || (J.cargo === 'alcalde' && J.cargoInfo && J.cargoInfo.depto === dep);
  };
  const esPresJ = E => E.gobierno.presidente === 'J';

  /* ═══════════ 1. Desastres y UNGRD ═══════════ */
  const AMENAZAS = {
    inundacion: { n: 'Inundación', icono: '🌊', regs: ['Caribe', 'Pacífico', 'Andina', 'Orinoquía'], p: 0.032 },
    deslizamiento: { n: 'Deslizamiento', icono: '⛰', regs: ['Andina', 'Pacífico'], p: 0.016 },
    incendio: { n: 'Incendio forestal', icono: '🔥', regs: ['Andina', 'Orinoquía', 'Amazonía', 'Caribe'], p: 0.006 },
    sismo: { n: 'Sismo', icono: '🌋', regs: ['Andina', 'Pacífico', 'Caribe'], p: 0.0035, extra: 1 },
    huracan: { n: 'Huracán', icono: '🌀', regs: ['Insular', 'Caribe'], p: 0.004, extra: 1 },
    avalancha: { n: 'Avalancha o erupción', icono: '🏔', regs: ['Andina'], p: 0.0015, extra: 1 }
  };
  const R = {
    AMENAZAS,
    clave: 'riesgo',
    asegurar(E) {
      if (E.riesgo && E.riesgo.prep) return E.riesgo;
      E.riesgo = { prep: {}, ungrd: { calidad: 58, fondo: 1.0 }, activas: [], hist: [], total: { muertos: 0, damnif: 0, dano: 0 } };
      for (const d of Object.values(E.deptos)) E.riesgo.prep[d.id] = U.ri(18, 42);
      return E.riesgo;
    },
    init(E) { E.riesgo = null; R.asegurar(E); },
    gravedad(E) { const a = R.asegurar(E).activas.filter(x => x.resp < 70); return a.length ? U.clamp(Math.max(...a.map(x => x.sev * 21 - x.resp * 0.15)), 0, 100) : 0; },
    crear(E, tipo, depto) {
      const r = R.asegurar(E), A = AMENAZAS[tipo], d = E.deptos[depto];
      const sev = U.clamp(1 + Math.floor(-Math.log(Math.random() + 0.001) * 0.85) + (A.extra || 0), 1, 5);
      const prep = r.prep[depto] || 30, esc = d.poblacion / 2500, mit = 1 - prep / 130;
      const ev = { id: U.id('ds'), tipo, depto, sev, t: E.fecha.t, resp: 5, estado: 'activa', calamidad: false, ultimoRef: -9,
        damnif: Math.round(sev * sev * U.ri(700, 2600) * Math.max(0.3, esc) * mit), muertos: sev >= 3 ? Math.round(U.ri(0, sev * sev * sev * 3) * mit) : 0, dano: +(sev * sev * 0.11 * Math.max(0.4, esc) * mit).toFixed(2) };
      r.activas.push(ev);
      d.infraestructura = U.clamp(d.infraestructura - sev * 0.9 * mit, 5, 98); d.pobreza = U.clamp(d.pobreza + sev * 0.14, 3, 90);
      if (esPresJ(E) === false) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - sev * 0.15, 3, 95);
      C.Medios.noticia(E, { tipo: 'evento', titular: `${A.icono} ${A.n} en ${d.nombre}: ${U.n(ev.damnif)} damnificados${ev.muertos ? ' y ' + ev.muertos + ' muertos' : ''}`, tono: -1, importante: sev >= 3, ref: { depto } });
      return ev;
    },
    cerrar(E, ev) {
      const r = R.asegurar(E), d = E.deptos[ev.depto], A = AMENAZAS[ev.tipo], s = ev.resp;
      ev.estado = 'cerrada'; ev.t1 = E.fecha.t; r.activas = r.activas.filter(x => x !== ev);
      d.infraestructura = U.clamp(d.infraestructura + ev.sev * 0.6 * s / 100, 5, 98);
      const cost = ev.dano * (0.3 + 0.5 * s / 100) * (ev.calamidad ? 1 : 0.6);
      C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(cost) * 0.5, p: 'm' }], 'riesgo');
      const efecto = (s - 55) / 30 * (ev.sev >= 3 ? 1 : 0.3);
      if (E.gobierno.presidente === 'J' || U.chance(0.5)) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + efecto, 3, 95);
      if (gestorDe(E, ev.depto) && E.jugador.cargo !== 'ciudadano') C.Opinion.subirRec(E, efecto * 1.5);
      r.total.muertos += ev.muertos; r.total.damnif += ev.damnif; r.total.dano += ev.dano;
      ev.nota = s >= 75 ? 'Respuesta ejemplar' : s >= 50 ? 'Respuesta aceptable' : 'Respuesta deficiente';
      if (ev.sev >= 3 && r.ungrd.calidad < 55 && U.chance(0.25)) {
        E.opinion.escandalos = (E.opinion.escandalos || 0) + 1; E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1, 3, 95);
        C.Medios.noticia(E, { tipo: 'control', titular: `Escándalo en la reconstrucción de ${d.nombre}: la Contraloría investiga contratos de la UNGRD`, tono: -1, importante: true });
      } else if (ev.sev >= 3) C.Medios.noticia(E, { tipo: 'evento', titular: `${A.n} en ${d.nombre}: balance de la respuesta — ${ev.nota.toLowerCase()}`, tono: s >= 50 ? 1 : -1 });
      r.hist.unshift(ev); if (r.hist.length > 14) r.hist.length = 14;
    },
    turno(E) {
      const r = R.asegurar(E), nina = C.Clima && E.clima && E.clima.fase === 'nina', nino = C.Clima && E.clima && E.clima.fase === 'nino';
      for (const k of Object.keys(r.prep)) r.prep[k] = Math.max(5, r.prep[k] - 0.015);
      r.ungrd.fondo = Math.min(4, r.ungrd.fondo + 0.005);
      for (const [tipo, A] of Object.entries(AMENAZAS)) {
        let p = A.p * (tipo === 'inundacion' || tipo === 'deslizamiento' ? (nina ? 2.4 : nino ? 0.5 : 1) : tipo === 'incendio' ? (nino ? 5 : 1) : 1);
        if (!U.chance(p)) continue;
        const cand = Object.values(E.deptos).filter(d => A.regs.includes(d.region)); if (cand.length) R.crear(E, tipo, U.pesado(cand, d => d.poblacion + 300).id);
      }
      for (const ev of r.activas.slice()) {
        const sem = E.fecha.t - ev.t;
        ev.resp = U.clamp(ev.resp + r.ungrd.calidad / 60 * U.rf(1.2, 3.2) + (ev.calamidad ? 1.6 : 0), 0, 100);
        if (ev.resp >= 98 || sem >= 18) R.cerrar(E, ev);
      }
    },
    registrarAcciones() {
      const A = C.Acciones, ev = (E, a) => R.asegurar(E).activas.find(x => x.id === a.evento);
      const gest = (E, a) => { const x = ev(E, a); if (!x) return 'Elige el desastre'; return gestorDe(E, x.depto) ? true : 'Sólo el Presidente o el mandatario local gestionan la respuesta'; };
      A.registrar({ id: 'declararCalamidad', nombre: 'Declarar calamidad pública', icono: '🆘', grupo: 'local', costo: 2,
        disponible(E, a) { const g = gest(E, a); if (g !== true) return g; return ev(E, a).calamidad ? 'Ya está declarada' : true; },
        ejecutar(E, a) { const x = ev(E, a); x.calamidad = true; x.resp = Math.min(100, x.resp + 10); E.opinion.aprobacionPres += x.sev >= 3 ? 0.4 : 0; return { ok: true, msg: 'Calamidad declarada: se activan recursos extraordinarios y la respuesta se acelera' + (x.sev >= 4 && esPresJ(E) ? '. Podrías declarar emergencia económica, social y ecológica' : '') }; } });
      A.registrar({ id: 'reforzarRespuesta', nombre: 'Reforzar la respuesta (ayuda y logística)', icono: '🚁', grupo: 'local', costo: 2,
        disponible(E, a) { const g = gest(E, a); if (g !== true) return g; return E.fecha.t - ev(E, a).ultimoRef < 3 ? 'Espera unas semanas para el siguiente envío' : true; },
        ejecutar(E, a) { const x = ev(E, a), r = R.asegurar(E), c = +(x.dano * 0.1).toFixed(2); x.ultimoRef = E.fecha.t; x.resp = Math.min(100, x.resp + 15); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(c), p: 'm' }], 'riesgo'); return { ok: true, msg: `Se envían ayudas por ${c} billones: la respuesta avanza 15 puntos` }; } });
      A.registrar({ id: 'invertirPrevencion', nombre: 'Invertir en prevención de riesgos', icono: '🛟', grupo: 'local', costo: 2,
        disponible(E, a) { if (a.depto === 'todos') return esPresJ(E) ? true : 'Sólo el Presidente invierte a escala nacional'; return gestorDe(E, a.depto) ? true : 'Sólo el Presidente o el mandatario local'; },
        ejecutar(E, a) { const r = R.asegurar(E); const nac = a.depto === 'todos', c = nac ? 1.0 : 0.15; for (const k of Object.keys(r.prep)) if (nac || k === a.depto) r.prep[k] = Math.min(95, r.prep[k] + (nac ? 3 : 10)); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(c), p: 'm' }], 'riesgo'); return { ok: true, msg: nac ? 'Plan nacional de gestión del riesgo: +3 puntos de preparación en todo el país (1 billón)' : `Obras de mitigación en ${E.deptos[a.depto].nombre}: +10 de preparación (0,15 billones)` }; } });
      A.registrar({ id: 'fortalecerUNGRD', nombre: 'Fortalecer la UNGRD', icono: '🏢', grupo: 'ejecutivo', costo: 3,
        disponible(E) { return esPresJ(E) ? (R.asegurar(E).ungrd.calidad >= 95 ? 'Ya es excelente' : true) : 'Sólo el Presidente'; },
        ejecutar(E) { const r = R.asegurar(E); r.ungrd.calidad = Math.min(95, r.ungrd.calidad + 8); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.4), p: 'm' }], 'riesgo'); return { ok: true, msg: `La UNGRD mejora su capacidad (${Math.round(r.ungrd.calidad)}/100)` }; } });
    }
  };

  /* ═══════════ 2. Consulta previa ═══════════ */
  const ETN = { LAG: 0.45, CHO: 0.8, CAU: 0.5, NAR: 0.35, AMA: 0.6, VAU: 0.8, GUA: 0.7, VIC: 0.4, PUT: 0.4, CAQ: 0.2, VAL: 0.2, CES: 0.22, COR: 0.15, MAG: 0.12, ANT: 0.08, BOL: 0.12, SUC: 0.1, GUV: 0.35, MET: 0.07, CAS: 0.08, ARA: 0.12, TOL: 0.06, HUI: 0.06, NSA: 0.06 };
  const COMUN = { LAG: 'Wayuu', CHO: 'Comunidades negras e indígenas Emberá', CAU: 'Nasa y comunidades afro', NAR: 'Awá y comunidades afro', AMA: 'Pueblos amazónicos', VAU: 'Pueblos del Vaupés', GUA: 'Pueblos del Guainía', VIC: 'Sikuani', PUT: 'Pueblos kofán e inga', CAQ: 'Pueblos amazónicos', VAL: 'Comunidades afro del Pacífico', CES: 'Arhuacos y Kankuamos', COR: 'Zenú', ANT: 'Embera Chamí', GUV: 'Nukak y Jiw', MAG: 'Kogui y Arhuaco' };
  const PROYECTOS = {
    mineria: { n: 'Mina de oro y cobre', icono: '⛏', inv: [1.5, 5], emp: 1800, apoyo: 26, amb: 70, deps: ['ANT', 'CHO', 'CAU', 'CAL', 'BOL', 'NAR', 'CES'], ef: i => [{ v: 'inversion', d: i * 0.10, p: 'm' }, { v: 'exportaciones', d: i * 0.45, p: 'l' }, { v: 'crecimiento', d: i * 0.025, p: 'm' }] },
    hidrocarburos: { n: 'Campo petrolero y de gas', icono: '🛢', inv: [2, 6], emp: 1500, apoyo: 30, amb: 60, deps: ['MET', 'CAS', 'PUT', 'ARA', 'SAN', 'CES', 'VIC', 'LAG'], ef: i => [{ v: 'inversion', d: i * 0.12, p: 'm' }, { v: 'exportaciones', d: i * 0.55, p: 'l' }, { v: 'crecimiento', d: i * 0.03, p: 'm' }, { v: 'deficit', d: -i * 0.04, p: 'l' }] },
    hidroelectrica: { n: 'Hidroeléctrica y embalse', icono: '💧', inv: [1.5, 4], emp: 1200, apoyo: 34, amb: 65, deps: ['ANT', 'HUI', 'CAU', 'CAQ', 'SAN', 'TOL'], ef: i => [{ v: 'inversion', d: i * 0.10, p: 'm' }, { v: 'infraestructura', d: i * 0.05, p: 'l' }, { v: 'inflacion', d: -i * 0.02, p: 'l' }] },
    eolica: { n: 'Parque eólico y solar', icono: '🌬', inv: [0.8, 3], emp: 900, apoyo: 40, amb: 30, deps: ['LAG', 'CES', 'MAG', 'BOL', 'COR', 'SUC'], ef: i => [{ v: 'inversion', d: i * 0.12, p: 'm' }, { v: 'inflacion', d: -i * 0.02, p: 'l' }, { v: 'crecimiento', d: i * 0.02, p: 'm' }] },
    via: { n: 'Megavía y corredor logístico', icono: '🛣', inv: [1, 4], emp: 2200, apoyo: 44, amb: 40, deps: ['CHO', 'NAR', 'CAU', 'CAQ', 'PUT', 'GUV', 'VIC', 'LAG'], ef: i => [{ v: 'infraestructura', d: i * 0.10, p: 'l' }, { v: 'exportaciones', d: i * 0.20, p: 'l' }, { v: 'crecimiento', d: i * 0.02, p: 'm' }] },
    puerto: { n: 'Puerto de aguas profundas', icono: '🚢', inv: [1.5, 4], emp: 1400, apoyo: 38, amb: 50, deps: ['CHO', 'NAR', 'LAG', 'BOL', 'VAL', 'MAG'], ef: i => [{ v: 'exportaciones', d: i * 0.35, p: 'l' }, { v: 'infraestructura', d: i * 0.06, p: 'l' }, { v: 'inversion', d: i * 0.08, p: 'm' }] }
  };
  const CP = {
    PROYECTOS, ETN,
    clave: 'consulta',
    asegurar(E) { if (E.consulta && E.consulta.procesos) return E.consulta; E.consulta = { procesos: [], hist: [], ultimo: -99 }; return E.consulta; },
    init(E) { E.consulta = null; CP.asegurar(E); },
    comunidad: dep => COMUN[dep] || 'Comunidades locales',
    etn: dep => ETN[dep] || 0.04,
    nuevo(E) {
      const q = CP.asegurar(E), tipo = U.pick(Object.keys(PROYECTOS)), P = PROYECTOS[tipo], dep = U.pesado(P.deps.map(id => E.deptos[id]), d => (ETN[d.id] || 0.05) + 0.2).id;
      const etn = CP.etn(dep), inv = +U.rf(P.inv[0], P.inv[1]).toFixed(1);
      const pr = { id: U.id('cp'), tipo, nombre: `${P.n} de ${E.deptos[dep].nombre}`, depto: dep, inv, apoyo: Math.round(U.clamp(P.apoyo + 14 + U.ri(-12, 14) - etn * 12, 8, 85)), amb: P.amb + U.ri(-10, 12), estado: etn >= 0.1 ? 'estudio' : 'operando', t0: E.fecha.t, ronda: 0, comp: 0, gestionado: false };
      q.procesos.push(pr);
      if (pr.estado === 'operando') CP.operar(E, pr);
      else C.Medios.noticia(E, { tipo: 'evento', titular: `${P.icono} Se proyecta ${pr.nombre} (${inv} billones) y deberá surtir consulta previa con ${CP.comunidad(dep)}`, tono: 0, ref: { depto: dep } });
      return pr;
    },
    operar(E, pr) {
      const P = PROYECTOS[pr.tipo]; pr.estado = 'operando'; pr.tOp = E.fecha.t;
      C.Economia.programar(E, P.ef(pr.inv), 'cp:' + pr.id);
      const d = E.deptos[pr.depto]; d.seguridad = U.clamp(d.seguridad - pr.amb / 60, 1, 99);
      C.Medios.noticia(E, { tipo: 'evento', titular: `Arranca ${pr.nombre}: ${pr.inv} billones de inversión y ${U.n(P.emp)} empleos`, tono: 1, ref: { depto: pr.depto } });
    },
    gestor(E, pr) { const J = E.jugador; return esPresJ(E) || (J.cargo === 'gobernador' && J.cargoInfo && J.cargoInfo.depto === pr.depto) || (J.cargo === 'ministro' && ['ambiente', 'minas', 'interior', 'energia'].includes(J.cargoInfo && J.cargoInfo.ministerio)); },
    cerrar(E, pr, estado, nota) {
      const q = CP.asegurar(E); pr.estado = estado; pr.nota = nota; pr.t1 = E.fecha.t;
      q.hist.unshift(pr); q.procesos = q.procesos.filter(x => x !== pr); if (q.hist.length > 14) q.hist.length = 14;
    },
    turno(E) {
      const q = CP.asegurar(E);
      if (q.procesos.filter(p => ['estudio', 'consulta'].includes(p.estado)).length < 3 && U.chance(0.012) && E.fecha.t - q.ultimo > 14) { q.ultimo = E.fecha.t; CP.nuevo(E); }
      for (const pr of q.procesos.slice()) {
        const sem = E.fecha.t - pr.t0, d = E.deptos[pr.depto];
        if (pr.estado === 'estudio' && sem >= 4) { pr.estado = 'consulta'; pr.tC = E.fecha.t; }
        else if (pr.estado === 'consulta') {
          pr.apoyo = U.clamp(pr.apoyo + U.gauss(0, 1.2) + (pr.comp > 0 ? 0.4 : 0) + (E.gobierno.presidente !== 'J' && U.chance(0.25) ? 1.2 : 0), 0, 100);
          if (E.fecha.t - pr.tC >= 10) {
            if (pr.apoyo >= 55) { pr.estado = 'acuerdo'; C.Medios.noticia(E, { tipo: 'evento', titular: `${CP.comunidad(pr.depto)} y el Estado protocolizan la consulta previa de ${pr.nombre}`, tono: 1 }); }
            else if (pr.apoyo < 30 || pr.ronda >= 2) CP.cerrar(E, pr, 'rechazo', `La comunidad dice NO (${Math.round(pr.apoyo)} % de apoyo)`), C.Medios.noticia(E, { tipo: 'evento', titular: `${CP.comunidad(pr.depto)} rechaza ${pr.nombre} en la consulta previa: el proyecto se archiva`, tono: -1 });
            else { pr.ronda++; pr.tC = E.fecha.t; }
          }
        }
        else if (pr.estado === 'acuerdo') { if (E.gobierno.presidente === 'J' && !pr.gestionado) continue; CP.operar(E, pr); }
        else if (pr.estado === 'saltada' && !pr.tutela) {
          if (U.chance(0.07)) { pr.tutela = true; if (U.chance(0.7)) { pr.estado = 'suspendida'; E.economia.pendientes = E.economia.pendientes.filter(x => x.origen !== 'cp:' + pr.id); E.corte.tension = U.clamp(E.corte.tension + 6, 0, 100); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1.2, 3, 95); C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte suspende ${pr.nombre} por violar el derecho a la consulta previa`, tono: -1, importante: true }); } else pr.nota = 'La tutela fue negada'; }
        }
        else if (pr.estado === 'suspendida' && sem > 120) CP.cerrar(E, pr, 'archivado', 'Se agota el tiempo del proyecto');
        if (d && pr.estado === 'operando' && pr.apoyo < 40) d.seguridad = U.clamp(d.seguridad - 0.004, 1, 99);
      }
      // los proyectos aprobados pasan a operar con el tiempo
      for (const pr of q.procesos) if (pr.estado === 'operando' && E.fecha.t - (pr.tOp || pr.t0) > 156) CP.cerrar(E, pr, 'operando', 'En operación');
    },
    registrarAcciones() {
      const A = C.Acciones, pr = (E, a) => CP.asegurar(E).procesos.find(x => x.id === a.proceso);
      const gest = (E, a) => { const p = pr(E, a); if (!p) return 'Elige el proceso'; return CP.gestor(E, p) ? true : 'Sólo el Gobierno o el gobernador del departamento'; };
      A.registrar({ id: 'concertarConsulta', nombre: 'Concertar con la comunidad', icono: '🤝', grupo: 'ejecutivo', costo: 2,
        disponible(E, a) { const g = gest(E, a); if (g !== true) return g; const p = pr(E, a); return p.estado === 'consulta' || p.estado === 'estudio' ? true : 'El proceso no está en consulta'; },
        ejecutar(E, a) { const p = pr(E, a), c = +(p.inv * 0.04).toFixed(2); p.apoyo = Math.min(100, p.apoyo + U.ri(7, 13)); p.comp++; p.gestionado = true; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(c), p: 'm' }], 'consultaprevia'); return { ok: true, msg: `Plan de compensación y beneficios por ${c} billones: el apoyo sube a ${Math.round(p.apoyo)} %` }; } });
      A.registrar({ id: 'saltarConsulta', nombre: 'Saltarse la consulta (certificar «sin presencia étnica»)', icono: '⚠', grupo: 'ejecutivo', costo: 2,
        disponible(E, a) { const g = gest(E, a); if (g !== true) return g; const p = pr(E, a); return p.estado === 'consulta' || p.estado === 'estudio' ? true : 'El proceso no está en consulta'; },
        ejecutar(E, a) { const p = pr(E, a); p.estado = 'saltada'; p.apoyo = Math.max(0, p.apoyo - 25); CP.operar(E, p); p.estado = 'saltada'; E.opinion.aprobacionPres -= esPresJ(E) ? 0.4 : 0; return { ok: true, msg: 'El proyecto arranca sin consulta… pero la comunidad puede interponer tutela y la Corte suspenderlo' }; } });
      A.registrar({ id: 'aprobarProyectoAcordado', nombre: 'Dar luz verde al proyecto acordado', icono: '✅', grupo: 'ejecutivo', costo: 1,
        disponible(E, a) { const g = gest(E, a); if (g !== true) return g; return pr(E, a).estado === 'acuerdo' ? true : 'Aún no hay acuerdo'; },
        ejecutar(E, a) { const p = pr(E, a); p.gestionado = false; CP.operar(E, p); return { ok: true, msg: 'Licencia otorgada: el proyecto arranca con respaldo de la comunidad' }; } });
      A.registrar({ id: 'tomarPartidoConsulta', nombre: 'Respaldar u oponerte al proyecto', icono: '📣', grupo: 'control', costo: 2,
        disponible(E, a) { const p = pr(E, a); return p ? (p.estado === 'consulta' || p.estado === 'estudio' ? true : 'El proceso no está en consulta') : 'Elige el proceso'; },
        ejecutar(E, a) { const p = pr(E, a), op = a.postura === 'oponer'; p.apoyo = U.clamp(p.apoyo + (op ? -8 : 6), 0, 100); C.Opinion.subirRec(E, 1.5); E.jugador.rep.credibilidad = U.clamp((E.jugador.rep.credibilidad || 50) + (op ? 1 : 0), 0, 100); return { ok: true, msg: op ? 'Acompañas a la comunidad contra el proyecto' : 'Respaldas el proyecto ante la comunidad' }; } });
    }
  };

  /* ═══════════ 3. Narcotráfico ═══════════ */
  const NOMBRES = ['Clan del Golfo Verde', 'Red del Pacífico', 'Herederos del Norte del Valle', 'Los Centauros del Llano', 'Frente Costero', 'La Oficina del Valle', 'Los Cuervos del Urabá', 'Cartel de la Frontera', 'Los Pelusos del Catatumbo', 'La Cordillera'];
  const BASES = ['ANT', 'CHO', 'VAL', 'NAR', 'MET', 'NSA', 'COR', 'SUC', 'ATL', 'CAU', 'PUT', 'BOL'];
  const NA = {
    clave: 'narco',
    cartel(E, base) {
      const n = E.narco, libre = NOMBRES.filter(x => !n.carteles.some(c => c.nombre === x));
      const N = C.DATA.nombres, h = U.chance(0.8);
      return { id: U.id('ct'), nombre: U.pick(libre.length ? libre : NOMBRES), base: base || U.pick(BASES), fuerza: U.ri(28, 62), corrupcion: U.ri(15, 55), capturados: 0, jefe: `${U.pick(h ? N.h : N.m)} ${U.pick(N.a)}`, golpes: 0, t: E.fecha.t };
    },
    asegurar(E) {
      if (E.narco && E.narco.carteles) return E.narco;
      E.narco = { carteles: [], lavado: 24, infiltracion: 14, extraditados: 0, golpes: 0, uif: 0, ultimaOp: -99, hist: [] };
      for (let i = 0; i < 4; i++) E.narco.carteles.push(NA.cartel(E, BASES[i * 2 % BASES.length]));
      return E.narco;
    },
    init(E) { E.narco = null; NA.asegurar(E); },
    poder(E) { const n = NA.asegurar(E); return U.suma(n.carteles.map(c => c.fuerza)); },
    anotar(E, txt) { const n = NA.asegurar(E); n.hist.unshift({ t: E.fecha.t, txt }); if (n.hist.length > 12) n.hist.length = 12; },
    caida(E, c) {
      const n = E.narco; n.carteles = n.carteles.filter(x => x !== c);
      NA.anotar(E, `Cae ${c.nombre}`);
      // efecto cucaracha: se fragmenta en estructuras menores
      for (let i = 0; i < 2; i++) { const f = NA.cartel(E, U.chance(0.5) ? c.base : null); f.fuerza = U.ri(10, 22); n.carteles.push(f); }
      C.Medios.noticia(E, { tipo: 'seguridad', titular: `Cae ${c.nombre}, pero sus rutas se reparten entre estructuras menores`, tono: 0, importante: true });
    },
    gestor(E) { return C.Territorio.gestor(E); },
    turno(E) {
      const n = NA.asegurar(E), cult = C.Territorio ? C.Territorio.total(E) : 80000;
      for (const c of n.carteles.slice()) {
        const d = E.deptos[c.base];
        c.fuerza = U.clamp(c.fuerza + cult / 4e6 + U.gauss(0, 0.12) - 0.04, 0, 100);
        if (d) d.seguridad = U.clamp(d.seguridad - c.fuerza / 9000 + 0.003, 1, 99);
        if (c.fuerza < 6) { NA.caida(E, c); continue; }
        if (U.chance(c.fuerza / 14000) && d) {
          d.seguridad = U.clamp(d.seguridad - 1.8, 1, 99); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.25, 3, 95);
          C.Medios.noticia(E, { tipo: 'seguridad', titular: `Atentado atribuido a ${c.nombre} en ${d.nombre}`, tono: -1 });
        }
      }
      n.lavado = U.clamp(n.lavado + NA.poder(E) * 0.00035 - 0.03 - n.uif * 0.012, 2, 100);
      n.infiltracion = U.clamp(n.infiltracion + n.lavado * 0.0007 - 0.03 - n.uif * 0.01, 1, 100);
      if (n.lavado > 55) C.Economia.aplicarDelta(E, 'confianza', -0.02);
      if (n.infiltracion > 40 && U.chance(0.006 + (n.infiltracion - 40) / 5000)) {
        E.opinion.escandalos = (E.opinion.escandalos || 0) + 1;
        const pa = U.pick(Object.values(E.partidos)); if (pa && pa.popularidad != null) pa.popularidad = Math.max(0, pa.popularidad - 1.2);
        C.Medios.noticia(E, { tipo: 'control', titular: `Escándalo de narcopolítica: la Fiscalía vincula a congresistas con ${U.pick(n.carteles).nombre}`, tono: -1, importante: true });
        C.Economia.aplicarDelta(E, 'confianza', -0.3); n.infiltracion = Math.max(1, n.infiltracion - 6);
      }
      if (!esPresJ(E) && U.chance(0.012)) { const c = U.pick(n.carteles); if (c) { c.fuerza -= U.ri(8, 18); n.golpes++; if (c.fuerza < 6) NA.caida(E, c); } }
      if (n.carteles.length < 3 && U.chance(0.02)) n.carteles.push(NA.cartel(E));
    },
    registrarAcciones() {
      const A = C.Acciones, ct = (E, a) => NA.asegurar(E).carteles.find(x => x.id === a.cartel);
      const gest = (E, a) => { const g = NA.gestor(E); if (g !== true) return g; return !a || !a.cartel || ct(E, a) ? true : 'Elige la estructura'; };
      const retal = (E, c, p) => { if (U.chance(p)) { const d = E.deptos[c.base]; if (d) d.seguridad = U.clamp(d.seguridad - 2.2, 1, 99); E.opinion.aprobacionPres -= 0.5; C.Medios.noticia(E, { tipo: 'seguridad', titular: `${c.nombre} responde con violencia en ${d ? d.nombre : 'el país'}`, tono: -1 }); return true; } return false; };
      A.registrar({ id: 'golpeCartel', nombre: 'Operación contra una estructura narco', icono: '🎯', grupo: 'ejecutivo', costo: 3, disponible: gest,
        ejecutar(E, a) {
          const n = NA.asegurar(E), c = ct(E, a); if (E.fecha.t - n.ultimaOp < 3) return { ok: false, msg: 'Las operaciones necesitan unas semanas de inteligencia entre una y otra' };
          const p = U.clamp(0.42 + (60 - c.corrupcion) / 220 + (C.OrdenPublico && typeof C.OrdenPublico.fuerzaInstitucional(E) === 'number' ? C.OrdenPublico.fuerzaInstitucional(E) / 400 : 0.1), 0.2, 0.85);
          n.ultimaOp = E.fecha.t;
          if (!U.chance(p)) { c.corrupcion = Math.min(100, c.corrupcion + 2); return { ok: true, exito: false, msg: `La operación fracasa: hubo filtración (${Math.round(p * 100)} % de probabilidad)` }; }
          c.fuerza -= U.ri(14, 26); c.capturados++; c.golpes++; n.golpes++; const d = E.deptos[c.base]; if (d) d.seguridad = U.clamp(d.seguridad + 1.5, 1, 99); E.opinion.aprobacionPres += 0.7;
          const r = retal(E, c, 0.35);
          if (c.fuerza < 6) NA.caida(E, c); else NA.anotar(E, `Golpe a ${c.nombre}`);
          return { ok: true, msg: `Golpe certero a ${c.nombre}: queda con ${Math.max(0, Math.round(c.fuerza))} de fuerza${r ? '… y responde con violencia' : ''}. Hay cabecilla capturado para extraditar` };
        } });
      A.registrar({ id: 'extraditar', nombre: 'Extraditar a un cabecilla', icono: '✈', grupo: 'ejecutivo', costo: 2,
        disponible(E, a) { const g = gest(E, a); if (g !== true) return g; return ct(E, a).capturados > 0 ? true : 'No hay cabecillas capturados'; },
        ejecutar(E, a) { const n = NA.asegurar(E), c = ct(E, a); c.capturados--; c.fuerza -= 10; n.extraditados++; if (E.diplomacia && E.diplomacia.paises.USA) E.diplomacia.paises.USA.relacion = U.clamp(E.diplomacia.paises.USA.relacion + 5, 3, 97); retal(E, c, 0.5); if (c.fuerza < 6) NA.caida(E, c); return { ok: true, msg: `${c.jefe} es extraditado a Estados Unidos: sube la relación con Washington` }; } });
      A.registrar({ id: 'sometimiento', nombre: 'Negociar sometimiento a la justicia', icono: '📜', grupo: 'ejecutivo', costo: 3, disponible: gest,
        ejecutar(E, a) { const c = ct(E, a); c.fuerza -= 15; E.opinion.aprobacionPres -= 1.2; E.corte.tension = U.clamp(E.corte.tension + 3, 0, 100); if (c.fuerza < 6) NA.caida(E, c); return { ok: true, msg: `${c.nombre} se somete parcialmente: baja su fuerza, pero la opinión critica los beneficios judiciales` }; } });
      A.registrar({ id: 'fortalecerUIAF', nombre: 'Fortalecer la inteligencia financiera (UIAF)', icono: '🧮', grupo: 'ejecutivo', costo: 3,
        disponible(E) { const g = NA.gestor(E); return g !== true ? g : (NA.asegurar(E).uif >= 5 ? 'Ya está al máximo' : true); },
        ejecutar(E) { const n = NA.asegurar(E); n.uif++; n.lavado = Math.max(2, n.lavado - 8); n.infiltracion = Math.max(1, n.infiltracion - 4); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.2), p: 'm' }], 'narco'); return { ok: true, msg: `La UIAF sube de nivel (${n.uif}/5): menos lavado e infiltración` }; } });
      A.registrar({ id: 'controlPuertos', nombre: 'Escáneres y control de puertos y aeropuertos', icono: '🛃', grupo: 'ejecutivo', costo: 3,
        disponible(E) { const g = NA.gestor(E); return g !== true ? g : (E.fecha.t - (NA.asegurar(E).ultPuertos || -99) < 26 ? 'Espera seis meses para el siguiente plan' : true); },
        ejecutar(E) { const n = NA.asegurar(E); n.ultPuertos = E.fecha.t; for (const c of n.carteles) c.fuerza -= 5; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.35), p: 'm' }, { v: 'exportaciones', d: 0.1, p: 'm' }], 'narco'); for (const c of n.carteles.slice()) if (c.fuerza < 6) NA.caida(E, c); return { ok: true, msg: 'Más decomisos: todas las estructuras pierden fuerza' }; } });
    }
  };

  const wrap = (obj, nombre, pr) => { C.Tiempo.registrar(nombre, obj, pr); if (obj.registrarAcciones) obj.registrarAcciones(); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push(nombre === 'riesgo' ? 'Riesgo' : nombre === 'consultaprevia' ? 'ConsultaPrevia' : 'Narco'); };
  C.Riesgo = R; C.ConsultaPrevia = CP; C.Narco = NA;
  CP.clave = 'consulta'; R.clave = 'riesgo'; NA.clave = 'narco';
  R.migrar = R.init; CP.migrar = CP.init; NA.migrar = NA.init;
  wrap(R, 'riesgo', 57); wrap(CP, 'consultaprevia', 58); wrap(NA, 'narco', 59);
})(window.CURUL);
