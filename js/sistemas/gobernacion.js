/* Gobernación dinámica (Fase 39). El departamento deja de ser un número: se divide en subregiones y municipios con alcaldes
   que te siguen, te desafían o te piden plata; tiene vocaciones económicas con shocks y apuestas de inversión; amenaza
   armada por subregión; una Asamblea que aprueba (o no) ordenanzas con voto nominal; relaciones con la Nación (CONPES,
   transferencias, RAP con otros gobernadores y frente común); un plan de desarrollo con metas que se evalúa cada año;
   ferias y 29 eventos con decisión; y un ranking anual de gobernadores. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, G = () => C.DATA.gobernacion, GL = () => C.GobiernoLocal;
  const esPres = E => E.gobierno.presidente === 'J';
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const cacheMun = {};
  const munisDe = dep => cacheMun[dep] || (cacheMun[dep] = Object.entries(C.DATA.municipios).filter(([c, m]) => m.dp === dep).map(([c, m]) => ({ code: c, n: m.n, x: m.cx, y: m.cy, pob: m.pob })));

  /* k-medias ponderadas por población sobre las coordenadas del mapa */
  const agrupar = (pts, k) => {
    if (k <= 1 || pts.length <= k) return pts.length <= k && k > 1 ? pts.map(p => [p]) : [pts];
    const cs = [pts.reduce((a, p) => (p.pob > a.pob ? p : a), pts[0])];
    while (cs.length < k) cs.push(pts.reduce((a, p) => { const dm = Math.min(...cs.map(c => (c.x - p.x) ** 2 + (c.y - p.y) ** 2)); return dm > a.d ? { p, d: dm } : a; }, { p: pts[0], d: -1 }).p);
    let cen = cs.map(c => ({ x: c.x, y: c.y })), grp = [];
    for (let it = 0; it < 14; it++) {
      grp = cen.map(() => []);
      for (const p of pts) { let b = 0, bd = 1e18; cen.forEach((c, i) => { const dd = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (dd < bd) { bd = dd; b = i; } }); grp[b].push(p); }
      cen = grp.map((g, i) => g.length ? { x: U.suma(g.map(p => p.x * Math.sqrt(p.pob))) / U.suma(g.map(p => Math.sqrt(p.pob))), y: U.suma(g.map(p => p.y * Math.sqrt(p.pob))) / U.suma(g.map(p => Math.sqrt(p.pob))) } : cen[i]);
    }
    return grp.filter(g => g.length);
  };
  const dirTxt = (dx, dy) => { const a = Math.atan2(-dy, dx) * 180 / Math.PI; const n = ['Oriente', 'Nororiente', 'Norte', 'Noroccidente', 'Occidente', 'Suroccidente', 'Sur', 'Suroriente']; return n[Math.round(((a + 360) % 360) / 45) % 8]; };

  const Gb = {
    clave: null, MESES,
    esGob: E => E.jugador.cargo === 'gobernador' && !!(E.jugador.cargoInfo && E.jugador.cargoInfo.depto),
    depto: E => E.deptos[E.jugador.cargoInfo.depto],
    gl: E => GL().asegurar(E, E.jugador.cargoInfo.depto, 'gobernacion'),
    presupuesto: E => GL().presupuestoTotal(E, E.jugador.cargoInfo.depto, 'gobernacion'),
    fr: (E, f) => +(Gb.presupuesto(E) * f).toFixed(3),
    vocacion: E => G().VOCACION[E.jugador.cargoInfo.depto] || ['agro', 'comercio'],
    muni: code => C.DATA.municipios[code],
    /* ── Construcción perezosa del departamento ── */
    vida(E) {
      const g = Gb.gl(E); if (g.vida) return g.vida;
      const d = Gb.depto(E), J = E.jugador, ms = munisDe(d.id), n = ms.length;
      const k = n <= 3 ? 1 : U.clamp(Math.round(Math.sqrt(n) / 1.7), 2, 6);
      const cx = U.suma(ms.map(m => m.x)) / Math.max(1, n), cy = U.suma(ms.map(m => m.y)) / Math.max(1, n);
      const grupos = agrupar(ms, k), subs = []; const usados = {};
      grupos.sort((a, b) => U.suma(b.map(p => p.pob)) - U.suma(a.map(p => p.pob)));
      const capital = ms.find(m => m.n === d.capital) || ms.reduce((a, m) => (m.pob > a.pob ? m : a), ms[0] || { pob: 0 });
      grupos.forEach((gr, i) => {
        const gx = U.suma(gr.map(p => p.x)) / gr.length, gy = U.suma(gr.map(p => p.y)) / gr.length;
        let nombre = gr.includes(capital) ? 'Capital y entorno' : dirTxt(gx - cx, gy - cy); if (!gr.includes(capital)) { usados[nombre] = (usados[nombre] || 0) + 1; if (usados[nombre] > 1) nombre += ' ' + usados[nombre]; }
        if (grupos.length === 1) nombre = 'Todo el departamento';
        subs.push({ id: 's' + i, nombre, munis: gr.map(p => p.code), pob: U.suma(gr.map(p => p.pob)), amenaza: U.clamp(14 + (60 - d.seguridad) * 0.4 + U.gauss(0, 7), 3, 90), animo: 50 + U.ri(-8, 8), ruido: U.gauss(0, 6), cx: gx, cy: gy });
      });
      const parts = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.popularidad > 0);
      const munis = {};
      for (const m of ms) {
        const pa = U.pesado(parts, p => p.popularidad + 0.5), mine = pa.id === J.partido, ideo = { eco: U.clamp((pa.eco || 0) + U.gauss(0, 15), -90, 90), soc: U.clamp((pa.soc || 0) + U.gauss(0, 15), -90, 90) };
        const N = C.DATA.nombres, h = U.chance(0.78);
        munis[m.code] = { afin: Math.round(U.clamp(48 + (mine ? 20 : 0) - U.distIdeo(J.ideologia, ideo) * 35 + U.gauss(0, 10), 2, 98)), alcalde: { nombre: `${U.pick(h ? N.h : N.m)} ${U.pick(N.a)}`, partido: pa.id, ideo, ambicion: U.ri(10, 90) }, estado: 'normal', obras: 0, visita: -99 };
      }
      const metas = Object.entries(G().METAS).map(([id, M]) => ({ id, ind: M.ind, need: M.inv ? d[M.ind] * 1.4 : 100 - d[M.ind], base: d[M.ind], meta: M.meta * 2.2, n: M.n })).sort((a, b) => b.need - a.need).slice(0, 4);
      const sect = {}; for (const k2 of Gb.vocacion(E)) sect[k2] = U.ri(40, 66);
      const coal = (E.gobierno.coalicion || []).includes(J.partido);
      return g.vida = { abs0: Gb.absoluto(d), caja: Gb.fr(E, 0.02), animo: 52, asamblea: 50, subs, munis, eco: { sectores: sect, media: 52 }, nacion: { rel: coal ? 62 : 44, ultCONPES: -99, ultFrente: -99 }, rap: null,
        pdd: { metas, t0: E.fecha.t, evals: [], ult: E.fecha.t }, ord: { activas: {}, mods: { ingreso: 0 } }, rank: null, rankAnio: 0, feriaAnio: 0, cool: {}, racha: 0, hist: [], ultEvento: -99, amenazaMedia: 25, afinMedia: 50, presidenciable: 0 };
    },
    anotar(E, txt) { const v = Gb.vida(E); v.hist.unshift({ t: E.fecha.t, txt }); if (v.hist.length > 16) v.hist.length = 16; },
    recalc(E) { const v = Gb.vida(E), tp = U.suma(v.subs.map(s => s.pob)) || 1; v.amenazaMedia = U.suma(v.subs.map(s => s.amenaza * s.pob)) / tp; const ms = Object.values(v.munis); v.afinMedia = ms.length ? U.suma(ms.map(m => m.afin)) / ms.length : 50; const sc = Object.values(v.eco.sectores); v.eco.media = sc.length ? U.prom(sc) : 50; },
    /* Aplica efectos y devuelve un resumen */
    ef(E, o) {
      if (!Gb.esGob(E)) return '';
      const v = Gb.vida(E), d = Gb.depto(E), J = E.jugador, out = [], f = (k, ic, val, suf) => out.push(`${ic} ${val > 0 ? '+' : ''}${val}${suf || ''}`);
      if (o.animo) { v.animo = U.clamp(v.animo + o.animo, 0, 100); f('animo', '😀', o.animo); }
      if (o.amenaza) { for (const s of v.subs) s.amenaza = U.clamp(s.amenaza + o.amenaza, 0, 100); f('amenaza', '☠', o.amenaza, ' amenaza'); }
      if (o.afin) { for (const m of Object.values(v.munis)) m.afin = U.clamp(m.afin + o.afin, 0, 100); f('afin', '🤝', o.afin, ' alcaldes'); }
      if (o.nacion) { v.nacion.rel = U.clamp(v.nacion.rel + o.nacion, 0, 100); f('nacion', '🦅', o.nacion, ' Nación'); }
      if (o.asamblea) { v.asamblea = U.clamp(v.asamblea + o.asamblea, 0, 100); f('asamblea', '🏛', o.asamblea, ' Asamblea'); }
      if (o.caja) { v.caja += Gb.fr(E, o.caja); out.push(`💵 ${o.caja > 0 ? '+' : '−'}${Math.abs(o.caja * 100).toFixed(1)} % del presupuesto`); }
      if (o.rec) { C.Opinion.subirRec(E, o.rec); f('rec', '📣', o.rec, ' reconocimiento'); }
      if (o.aprob) { d.ajusteAprob = U.clamp((d.ajusteAprob || 0) + o.aprob, -30, 30); f('aprob', '👍', o.aprob, ' aprobación'); }
      if (o.honestidad) { J.rep.honestidad = U.clamp(J.rep.honestidad + o.honestidad, 0, 100); f('h', '⚖', o.honestidad, ' honestidad'); }
      for (const [k, ind] of [['seg', 'seguridad'], ['edu', 'educacion'], ['salud', 'salud'], ['infra', 'infraestructura']]) if (o[k]) { d[ind] = U.clamp(d[ind] + o[k], 1, 99); f(k, { seg: '🛡', edu: '🎓', salud: '🏥', infra: '🛣' }[k], o[k], ' ' + ind); }
      if (o.pobreza) d.pobreza = U.clamp(d.pobreza + o.pobreza, 3, 90), out.push(`📉 pobreza ${o.pobreza}`);
      if (o.empleo) { d.desempleo = U.clamp(d.desempleo - o.empleo * 0.15, 2, 40); out.push(`👷 empleo +${o.empleo}`); }
      for (const k of Object.keys(G().SECTORES)) if (o[k] && v.eco.sectores[k] != null) { v.eco.sectores[k] = U.clamp(v.eco.sectores[k] + o[k], 0, 100); out.push(`${G().SECTORES[k][1]} ${o[k] > 0 ? '+' : ''}${o[k]}`); }
      Gb.recalc(E); return out.join(' · ');
    },
    absoluto: d => 0.25 * d.seguridad + 0.2 * d.infraestructura + 0.15 * d.educacion + 0.15 * d.salud + 0.25 * (100 - d.pobreza),
    /* Puntaje del ranking: nivel del departamento (45 %), pulso regional (25 %) y mejora desde que asumiste (30 %): un departamento pobre también puede ganar */
    puntaje(E) {
      const d = Gb.depto(E), v = Gb.vida(E), a = Gb.absoluto(d);
      return 0.45 * a + 0.25 * (v.animo + v.eco.media) / 2 + 0.3 * (50 + (a - (v.abs0 != null ? v.abs0 : a)) * 3);
    },
    rankingAnual(E) {
      const v = Gb.vida(E), anio = U.anio(); v.rankAnio = anio;
      const otros = Object.values(E.deptos).filter(x => x.id !== E.jugador.cargoInfo.depto && x.id !== 'BOG').map(x => ({ nombre: 'Gobernación de ' + x.nombre, p: 0.45 * Gb.absoluto(x) + 0.25 * (60 + U.gauss(0, 10)) + 0.3 * (50 + U.gauss(0, 8)) }));
      const todos = otros.concat([{ nombre: 'Gobernación de ' + Gb.depto(E).nombre + ' (tú)', p: Gb.puntaje(E), yo: true }]).sort((a, b) => b.p - a.p);
      const puesto = todos.findIndex(x => x.yo) + 1;
      v.rank = { anio, puesto, total: todos.length, lista: todos.slice(0, 10) };
      if (puesto <= 5) { C.Opinion.subirRec(E, puesto === 1 ? 7 : puesto <= 3 ? 4 : 2.5); Gb.ef(E, { aprob: puesto === 1 ? 3 : 1.5, animo: 3 }); E.jugador.reconocimientos.push({ t: E.fecha.t, txt: `Gobernación ${puesto === 1 ? 'mejor calificada' : 'entre las cinco mejores'} del país (${anio})` }); v.presidenciable = Math.min(100, v.presidenciable + (puesto === 1 ? 14 : 7)); }
      Gb.anotar(E, `Ranking de gobernadores ${anio}: puesto ${puesto} de ${todos.length}`);
      C.Medios.noticia(E, { tipo: 'regional', titular: puesto === 1 ? `${E.jugador.nombre} es el mejor gobernador del país` : `Ranking de gobernadores ${anio}: ${E.jugador.nombre} queda en el puesto ${puesto}`, tono: puesto <= 5 ? 1 : puesto > 20 ? -1 : 0, jugador: true, importante: puesto <= 3 });
    },
    evaluarPDD(E) {
      const v = Gb.vida(E), d = Gb.depto(E), p = v.pdd; let s = 0;
      const det = p.metas.map(m => { const cur = d[m.ind], anios = Math.min(1, Math.max(0.25, (E.fecha.t - p.t0) / 208)), prog = U.clamp((cur - m.base) / (m.meta * anios), -0.5, 1.3); s += prog; return { id: m.id, prog }; });
      const score = Math.round(U.clamp(s / p.metas.length * 100, 0, 140)), anio = U.anio();
      p.evals.unshift({ anio, score, det }); if (p.evals.length > 6) p.evals.length = 6; p.ult = E.fecha.t;
      Gb.ef(E, { rec: score >= 60 ? 2 : score < 25 ? -1.5 : 0.5, aprob: score >= 60 ? 1.5 : score < 25 ? -1.5 : 0, animo: score >= 60 ? 3 : score < 25 ? -3 : 0 });
      Gb.anotar(E, `Evaluación del plan de desarrollo ${anio}: ${score} % de avance`);
      C.Medios.noticia(E, { tipo: 'regional', titular: `Plan de desarrollo de ${d.nombre}: ${score} % de avance en las metas`, tono: score >= 60 ? 1 : score < 25 ? -1 : 0, jugador: true });
    },
    evento(E) {
      const v = Gb.vida(E), d = Gb.depto(E), pool = C.DATA.eventos.filter(e => e.gobernacion && e.id !== 'ga_feria' && (!e.req || e.req(E, v)) && !E.eventos.historial.slice(0, 8).some(h => h.plantilla === e.id));
      const pl = U.pesado(pool, e => (e.peso || 1) * (e.sit ? e.sit(v, d, E) : 1));
      if (pl) C.Eventos.disparar(E, pl, { forzar: true, depto: d.id });
    },
    turno(E) {
      if (!Gb.esGob(E)) return;
      const v = Gb.vida(E), d = Gb.depto(E), t = E.fecha.t, anio = U.anio(), mes = U.hoy().getUTCMonth();
      // caja
      v.caja = Math.min(Gb.fr(E, 0.1), v.caja + Gb.fr(E, 0.1) / 52 * (1 + v.ord.mods.ingreso) * (0.8 + v.eco.media / 250));
      // amenaza por subregión (grupos armados con control en el departamento)
      const grupos = C.OrdenPublico ? C.OrdenPublico.activos(E).filter(gp => E.ordenPublico.grupos[gp.id].control.includes(d.id)) : [];
      const fz = grupos.length ? U.prom(grupos.map(gp => E.ordenPublico.grupos[gp.id].fuerza)) : 0;
      for (const s of v.subs) { const base = U.clamp(20 + fz * 0.5 + (66 - d.seguridad) * 0.4 + s.ruido, 6, 95); s.amenaza = U.clamp(s.amenaza + (base - s.amenaza) * 0.01 + U.gauss(0, 0.2), 0, 100); }
      // economía
      for (const k of Object.keys(v.eco.sectores)) v.eco.sectores[k] = U.clamp(v.eco.sectores[k] + (52 + (E.economia.crecimiento - 2.5) * 3 - v.eco.sectores[k]) * 0.006 + U.gauss(0, 0.3), 0, 100);
      Gb.recalc(E);
      d.desempleo = U.clamp(d.desempleo + (50 - v.eco.media) * 0.0004, 2, 40); d.pobreza = U.clamp(d.pobreza + (50 - v.eco.media) * 0.0003, 3, 90);
      d.seguridad = U.clamp(d.seguridad + (28 - v.amenazaMedia) * 0.0006, 1, 99);
      // alcaldes y ánimo
      const ms = Object.entries(v.munis);
      for (let i = 0; i < 6 && ms.length; i++) { const [c, m] = U.pick(ms); m.afin = U.clamp(m.afin + (48 - m.afin) * 0.012 + U.gauss(0, 1.1) - (m.estado === 'rebelde' ? 0.4 : 0), 0, 100); if (m.estado === 'rebelde' && m.afin > 45) m.estado = 'normal'; if (m.estado === 'normal' && m.afin < 14 && U.chance(0.25)) { m.estado = 'rebelde'; Gb.anotar(E, `${m.alcalde.nombre}, alcalde de ${Gb.muni(c).n}, se declara en rebeldía`); C.Medios.noticia(E, { tipo: 'regional', titular: `El alcalde de ${Gb.muni(c).n} desafía a ${E.jugador.nombre}: «no recibimos órdenes de la gobernación»`, tono: -1, jugador: true }); } }
      const obj = 0.25 * d.seguridad + 0.2 * v.eco.media + 0.2 * d.infraestructura + 0.15 * v.afinMedia + 0.2 * (100 - v.amenazaMedia);
      v.animo = U.clamp(v.animo + (obj - v.animo) * 0.04, 0, 100); d.ajusteAprob = U.clamp((d.ajusteAprob || 0) + (v.animo - 55) * 0.001, -30, 30);
      v.asamblea = U.clamp(v.asamblea + (50 - v.asamblea) * 0.004 + (v.animo > 60 ? 0.03 : v.animo < 40 ? -0.05 : 0), 0, 100);
      v.nacion.rel = U.clamp(v.nacion.rel + ((E.gobierno.coalicion || []).includes(E.jugador.partido) ? 0.01 : -0.005), 0, 100);
      for (const [k, T] of Object.entries(G().ORDENANZAS)) if (v.ord.activas[k]) { if (T.ef.agro && v.eco.sectores.agro != null) v.eco.sectores.agro = Math.min(100, v.eco.sectores.agro + 0.004); }
      // feria, evento, PDD, ranking
      if (!E.eventos.pendientes.length) {
        if (mes === Gb.mesFeria(E) && v.feriaAnio !== anio) { v.feriaAnio = anio; C.Eventos.disparar(E, C.Eventos.plantilla('ga_feria'), { forzar: true, depto: d.id }); }
        else if (t - v.ultEvento > 3 && U.chance(0.1)) { v.ultEvento = t; Gb.evento(E); }
      }
      if (t - v.pdd.ult >= 52) Gb.evaluarPDD(E);
      const dm = U.hoy(); if (dm.getUTCMonth() === 11 && dm.getUTCDate() >= 8 && dm.getUTCDate() < 15 && v.rankAnio !== anio) Gb.rankingAnual(E);
      if (v.rap && t - v.rap.ultCumbre >= 26) Gb.cumbreRAP(E);
      v.racha = v.animo >= 65 ? v.racha + 1 : v.animo < 45 ? Math.min(0, v.racha - 1) : Math.floor(v.racha * 0.9);
      if (v.racha === 39) { Gb.anotar(E, 'Nueve meses de departamento contento: suena tu nombre a nivel nacional'); v.presidenciable = Math.min(100, v.presidenciable + 6); C.Opinion.subirRec(E, 2.5); }
    },
    mesFeria(E) { const f = C.Alcaldia && C.Alcaldia.FIESTAS[E.jugador.cargoInfo.depto]; return f ? f[1] : 7; },
    cumbreRAP(E) {
      const v = Gb.vida(E), r = v.rap; r.ultCumbre = E.fecha.t;
      for (const id of r.miembros.concat([E.jugador.cargoInfo.depto])) { const x = E.deptos[id]; if (x) x.infraestructura = U.clamp(x.infraestructura + 0.6, 1, 99); }
      v.caja += Gb.fr(E, 0.01 * (r.miembros.length + 1)); v.nacion.rel = U.clamp(v.nacion.rel + 1, 0, 100); Gb.anotar(E, `Cumbre de la ${r.nombre}: obras conjuntas y más peso ante la Nación`);
      C.Medios.noticia(E, { tipo: 'regional', titular: `La ${r.nombre} acuerda obras conjuntas en su cumbre de gobernadores`, tono: 1 });
    },
    registrarAcciones() {
      const A = C.Acciones;
      const gob = E => Gb.esGob(E) ? true : 'Sólo el gobernador actúa sobre su departamento';
      const paga = (E, f) => { const v = Gb.vida(E), c = Gb.fr(E, f); return v.caja >= c ? true : `La caja de libre disposición no alcanza (${(v.caja * 1000).toFixed(0)} de ${(c * 1000).toFixed(0)} millones)`; };
      const cobra = (E, f) => { Gb.vida(E).caja -= Gb.fr(E, f); };
      const def = (id, nombre, icono, costo, f, cool, extra, ejecutar) => A.registrar({ id, nombre, icono, grupo: 'departamento', costo,
        disponible(E, a) { const x = gob(E); if (x !== true) return x; if (cool) { const v = Gb.vida(E), r = cool - (E.fecha.t - (v.cool[id] || -999)); if (r > 0) return `Disponible en ${r} semanas`; } if (extra) { const y = extra(E, a || {}); if (y !== true) return y; } return f ? paga(E, f) : true; },
        ejecutar(E, a) { if (f) cobra(E, f); if (cool) Gb.vida(E).cool[id] = E.fecha.t; return ejecutar(E, a || {}); } });
      const sub = (E, a) => Gb.vida(E).subs.find(s => s.id === a.sub);
      const mun = (E, a) => Gb.vida(E).munis[a.code];
      const exSub = (E, a) => sub(E, a) ? true : 'Elige la subregión';
      const exMun = (E, a) => mun(E, a) ? true : 'Elige el municipio';
      // — Territorio y alcaldes —
      def('consejoAlcaldes', 'Consejo de alcaldes', '🤝', 2, 0.003, 13, null, E => ({ ok: true, msg: 'Todos los alcaldes en una sola mesa: ' + Gb.ef(E, { afin: 5, rec: 1, animo: 1 }) }));
      def('visitarMunicipio', 'Visitar un municipio', '🚙', 1, 0.001, 0, exMun, (E, a) => { const m = mun(E, a), v = Gb.vida(E); if (E.fecha.t - m.visita < 6) return { ok: false, msg: 'Acabas de estar ahí' }; m.visita = E.fecha.t; const buena = U.chance(0.75); m.afin = U.clamp(m.afin + (buena ? 10 : -2), 0, 100); C.Opinion.subirRec(E, buena ? 1 : 0.2); if (buena && m.estado === 'rebelde' && m.afin > 40) m.estado = 'normal'; Gb.recalc(E); return { ok: true, msg: buena ? `${m.alcalde.nombre} te recibe con banda y tamales en ${Gb.muni(a.code).n}: afinidad +10` : `Visita incómoda en ${Gb.muni(a.code).n}: hubo reclamos de la comunidad` }; });
      def('convenioMunicipio', 'Firmar un convenio con un municipio', '📝', 2, 0.01, 0, exMun, (E, a) => { const m = mun(E, a), s = Gb.vida(E).subs.find(x => x.munis.includes(a.code)); m.afin = U.clamp(m.afin + 18, 0, 100); m.obras++; if (m.estado === 'rebelde') m.estado = 'normal'; if (s) s.animo = U.clamp(s.animo + 3, 0, 100); Gb.ef(E, { rec: 0.8, animo: 0.5, infra: 0.15 }); return { ok: true, msg: `Convenio de cofinanciación con ${Gb.muni(a.code).n}: el alcalde queda agradecido (afinidad +18)` }; });
      def('castigarMunicipio', 'Frenar recursos a un municipio rebelde', '🚫', 1, 0, 13, exMun, (E, a) => { const m = mun(E, a); m.afin = U.clamp(m.afin - 12, 0, 100); Gb.ef(E, { rec: 1, caja: 0.004 }); return { ok: true, msg: `Le cierras la llave a ${Gb.muni(a.code).n}: el alcalde se enfurece y tú te ahorras una platica` }; });
      def('gobiernoTerritorio', 'Gobierno en el territorio', '🏕', 3, 0.006, 8, exSub, (E, a) => { const s = sub(E, a), v = Gb.vida(E); s.animo = U.clamp(s.animo + 8, 0, 100); s.amenaza = U.clamp(s.amenaza - 3, 0, 100); for (const c of s.munis) v.munis[c].afin = U.clamp(v.munis[c].afin + 4, 0, 100); Gb.ef(E, { rec: 2.5, animo: 2 }); return { ok: true, msg: `Montas la gobernación en ${s.nombre} una semana: audiencias, obras y la gente en la plaza` }; });
      def('crearProvincia', 'Crear una provincia (asociación de municipios)', '🧩', 3, 0.01, 104, (E, a) => { const s = sub(E, a); if (!s) return 'Elige la subregión'; const v = Gb.vida(E), af = U.prom(s.munis.map(c => v.munis[c].afin)); return af >= 52 ? true : `Los alcaldes de la subregión no confían (afinidad media ${Math.round(af)}; se necesita 52)`; }, (E, a) => { const s = sub(E, a), v = Gb.vida(E); for (const k of Object.keys(v.eco.sectores)) v.eco.sectores[k] = Math.min(100, v.eco.sectores[k] + 3); s.animo = Math.min(100, s.animo + 6); s.provincia = true; return { ok: true, msg: `Nace la provincia de ${s.nombre}: planeación conjunta y mayor capacidad de gestión. ` + Gb.ef(E, { rec: 2, animo: 2, infra: 0.3 }) }; });
      // — Nación y regiones —
      def('gestionarCONPES', 'Gestionar un CONPES regional', '🏛', 3, 0, 26, null, (E, a) => {
        const v = Gb.vida(E), pr = esPres(E) ? 0.95 : U.clamp(0.22 + v.nacion.rel / 200 + (E.jugador.reconocimiento || 0) / 500 + (v.rap ? 0.08 : 0), 0.15, 0.85);
        if (!U.chance(pr)) return { ok: true, exito: false, msg: `El CONPES no aprueba la propuesta (${Math.round(pr * 100)} % de probabilidad). ` + Gb.ef(E, { nacion: -1 }) };
        const tipo = ['vial', 'salud', 'educación', 'agua potable'][U.ri(0, 3)], monto = +U.rf(0.08, 0.22).toFixed(2) * Math.sqrt(Gb.presupuesto(E)) / 2;
        v.caja += monto; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(monto), p: 'm' }], 'gobernacion');
        return { ok: true, msg: `El CONPES declara de importancia estratégica un proyecto de ${tipo}: ${monto.toFixed(2)} billones para tu caja. ` + Gb.ef(E, { nacion: 3, rec: 2, infra: tipo === 'vial' ? 1 : 0, salud: tipo === 'salud' ? 1.5 : 0, edu: tipo === 'educación' ? 1.5 : 0 }) };
      });
      def('presionarNacion', 'Reclamar a la Nación en medios', '📣', 1, 0, 13, null, E => esPres(E) ? { ok: false, msg: 'Eres el Presidente' } : { ok: true, msg: 'Subes el tono contra Bogotá: ' + Gb.ef(E, { rec: 3, animo: 2, nacion: -5 }) });
      A.registrar({ id: 'fundarRAP', nombre: 'Fundar una RAP con otros gobernadores', icono: '🧭', grupo: 'departamento', costo: 3,
        disponible(E) { const x = gob(E); if (x !== true) return x; return Gb.vida(E).rap ? 'Ya perteneces a una RAP' : true; },
        ejecutar(E) {
          const d = Gb.depto(E), v = Gb.vida(E), J = E.jugador;
          const cand = Object.values(E.deptos).filter(x => x.region === d.region && x.id !== d.id && x.gobernador && x.gobernador !== 'J' && E.politicos[x.gobernador]);
          const ok = cand.filter(x => { const p = E.politicos[x.gobernador]; return U.chance(U.clamp(0.55 - U.distIdeo(J.ideologia, p) * 0.6 + (p.partido === J.partido ? 0.15 : 0) + v.nacion.rel / 500, 0.1, 0.9)); });
          if (ok.length < 2) return { ok: true, exito: false, msg: `Sólo ${ok.length} de ${cand.length} gobernadores se suman: hacen falta al menos dos` };
          const nombre = G().REGIONES[d.region] || 'RAP regional'; v.rap = { nombre, region: d.region, miembros: ok.map(x => x.id), t: E.fecha.t, ultCumbre: E.fecha.t };
          Gb.anotar(E, `Nace la ${nombre} con ${ok.length + 1} gobernaciones`); C.Medios.noticia(E, { tipo: 'regional', titular: `Nace la ${nombre}: ${ok.length + 1} gobernaciones se unen para pedirle obras a la Nación`, tono: 1, jugador: true, importante: true });
          return { ok: true, msg: `Se funda la ${nombre} con ${ok.map(x => x.nombre).join(', ')}. ` + Gb.ef(E, { nacion: 5, rec: 3 }) };
        } });
      def('frenteComun', 'Frente común de gobernadores ante la Nación', '✊', 3, 0, 26, E => Gb.vida(E).rap ? true : 'Necesitas pertenecer a una RAP', E => {
        const v = Gb.vida(E), n = v.rap.miembros.length + 1, p = esPres(E) ? 0.95 : U.clamp(0.3 + 0.08 * n + (E.opinion.aprobacionPres < 40 ? 0.1 : 0), 0.2, 0.85);
        if (!U.chance(p)) return { ok: true, exito: false, msg: `La Nación se hace la sorda (${Math.round(p * 100)} % de probabilidad). ` + Gb.ef(E, { nacion: -3 }) };
        const monto = +(0.04 * n * Math.sqrt(Gb.presupuesto(E))).toFixed(2); v.caja += monto; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(monto), p: 'm' }], 'gobernacion');
        return { ok: true, msg: `El frente común arranca ${monto.toFixed(2)} billones a Hacienda. ` + Gb.ef(E, { nacion: 2, rec: 3 }) };
      });
      // — Economía —
      A.registrar({ id: 'atraerInversion', nombre: 'Atraer inversión a un sector', icono: '🏭', grupo: 'departamento', costo: 2,
        disponible(E, a) { const x = gob(E); if (x !== true) return x; if (!a.sector || Gb.vida(E).eco.sectores[a.sector] == null) return 'Elige uno de los sectores del departamento'; const y = paga(E, 0.01); return y; },
        ejecutar(E, a) { cobra(E, 0.01); const v = Gb.vida(E), p = U.clamp(0.35 + v.eco.media / 250 + v.nacion.rel / 500 + (v.rap ? 0.05 : 0), 0.2, 0.8); if (!U.chance(p)) return { ok: true, exito: false, msg: `La misión comercial vuelve sin acuerdos (${Math.round(p * 100)} % de probabilidad)` }; C.Medios.noticia(E, { tipo: 'regional', titular: `Nueva inversión en ${G().SECTORES[a.sector][0].toLowerCase()} para ${Gb.depto(E).nombre}`, tono: 1, jugador: true }); return { ok: true, msg: `Llega inversión a ${G().SECTORES[a.sector][0]}: ` + Gb.ef(E, { [a.sector]: 10, empleo: 3, rec: 2 }) }; } });
      def('zonaFranca', 'Zona franca departamental', '🛃', 3, 0.02, 208, E => (Gb.vocacion(E).some(k => ['industria', 'puertos', 'comercio', 'frontera'].includes(k)) ? true : 'El departamento no tiene vocación industrial o comercial'), E => {
        const voto = C.Corporaciones.votar(E, E.jugador.cargoInfo.depto, 'gobernacion', 'Crear una zona franca departamental');
        if (!voto.aprobado) { Gb.vida(E).cool.zonaFranca = -999; Gb.vida(E).caja += Gb.fr(E, 0.02); return { ok: true, exito: false, msg: `La Asamblea niega la zona franca (${voto.si}-${voto.no})` }; }
        const v = Gb.vida(E); for (const k of ['industria', 'puertos', 'comercio', 'frontera']) if (v.eco.sectores[k] != null) v.eco.sectores[k] = Math.min(100, v.eco.sectores[k] + 12);
        return { ok: true, msg: `La Asamblea aprueba la zona franca (${voto.si}-${voto.no}): ` + Gb.ef(E, { empleo: 4, rec: 2.5, caja: 0 }) };
      });
      A.registrar({ id: 'apoyarGremio', nombre: 'Apoyar a un gremio con un plan sectorial', icono: '🤝', grupo: 'departamento', costo: 1,
        disponible(E, a) { const x = gob(E); if (x !== true) return x; if (!a.sector || Gb.vida(E).eco.sectores[a.sector] == null) return 'Elige uno de los sectores del departamento'; return paga(E, 0.005); },
        ejecutar(E, a) { cobra(E, 0.005); return { ok: true, msg: `Plan sectorial para ${G().SECTORES[a.sector][0]}: ` + Gb.ef(E, { [a.sector]: 6, rec: 0.8 }) }; } });
      // — Seguridad —
      def('consejoSeguridad', 'Consejo de seguridad en una subregión', '🛡', 2, 0.004, 6, exSub, (E, a) => { const s = sub(E, a); s.amenaza = U.clamp(s.amenaza - 9, 0, 100); s.animo = Math.min(100, s.animo + 2); Gb.recalc(E); return { ok: true, msg: `Consejo de seguridad en ${s.nombre}: amenaza ${Math.round(s.amenaza)}. ` + Gb.ef(E, { rec: 1, seg: 0.4 }) }; });
      def('alertaTemprana', 'Sistema de alertas tempranas', '🚨', 2, 0.008, 52, null, E => ({ ok: true, msg: 'Alertas comunitarias y radios conectadas: ' + Gb.ef(E, { amenaza: -4, animo: 2, rec: 1 }) }));
      def('recompensaDep', 'Recompensas por cabecillas', '💰', 2, 0.006, 26, exSub, (E, a) => { const s = sub(E, a), ok = U.chance(0.6); if (!ok) return { ok: true, exito: false, msg: 'La recompensa no da resultados esta vez' }; s.amenaza = U.clamp(s.amenaza - 8, 0, 100); Gb.recalc(E); return { ok: true, msg: `Cae un cabecilla en ${s.nombre} gracias a una recompensa: ` + Gb.ef(E, { rec: 1.5, animo: 2 }) }; });
      def('pedirEjercito', 'Pedirle refuerzo al Ejército', '🎖', 2, 0, 26, exSub, (E, a) => { const s = sub(E, a), v = Gb.vida(E), p = esPres(E) ? 0.95 : U.clamp(0.4 + v.nacion.rel / 200, 0.2, 0.85); if (!U.chance(p)) return { ok: true, exito: false, msg: 'El Ministerio de Defensa te responde que no hay tropas disponibles. ' + Gb.ef(E, { nacion: -2 }) }; s.amenaza = U.clamp(s.amenaza - 12, 0, 100); Gb.recalc(E); return { ok: true, msg: `Llegan tropas a ${s.nombre}: ` + Gb.ef(E, { nacion: -1, animo: 2, rec: 1 }) }; });
      def('mesaComunidades', 'Mesa con comunidades y líderes sociales', '🗣', 2, 0.003, 8, exSub, (E, a) => { const s = sub(E, a); s.amenaza = U.clamp(s.amenaza - 5, 0, 100); s.animo = Math.min(100, s.animo + 6); Gb.recalc(E); return { ok: true, msg: `Mesa con comunidades en ${s.nombre}: bajan las tensiones. ` + Gb.ef(E, { rec: 1.2, animo: 1 }) }; });
      // — Asamblea —
      A.registrar({ id: 'proponerOrdenanzaDep', nombre: 'Proponer una ordenanza a la Asamblea', icono: '📜', grupo: 'departamento', costo: 2,
        disponible(E, a) { const x = gob(E); if (x !== true) return x; const T = G().ORDENANZAS[a.tipo]; if (!T) return 'Elige la ordenanza'; const v = Gb.vida(E), r = T.cool - (E.fecha.t - (v.cool['ord_' + a.tipo] || -999)); if (r > 0) return `Disponible en ${r} semanas`; return T.caja ? paga(E, T.caja) : true; },
        ejecutar(E, a) {
          const T = G().ORDENANZAS[a.tipo], v = Gb.vida(E); v.cool['ord_' + a.tipo] = E.fecha.t;
          const voto = C.Corporaciones.votar(E, E.jugador.cargoInfo.depto, 'gobernacion', T.n);
          if (!voto.aprobado) return { ok: true, exito: false, msg: `La Asamblea hunde la ordenanza «${T.n}» (${voto.si}-${voto.no}). ` + Gb.ef(E, { asamblea: -3 }) };
          if (T.caja) cobra(E, T.caja); v.ord.activas[a.tipo] = E.fecha.t; v.ord.mods.ingreso += T.ingreso;
          const e = Object.assign({}, T.ef); const txt = Gb.ef(E, Object.assign(e, { rec: 1.5, asamblea: 2 }));
          C.Medios.noticia(E, { tipo: 'regional', titular: `La Asamblea de ${Gb.depto(E).nombre} aprueba (${voto.si}-${voto.no}) la ordenanza: ${T.n.toLowerCase()}`, tono: 1, jugador: true });
          Gb.anotar(E, `Ordenanza aprobada: ${T.n}`); return { ok: true, msg: `Aprobada (${voto.si}-${voto.no}): ${T.n}. ${txt}` };
        } });
      def('desayunoAsamblea', 'Invitar a los diputados a «desayunar»', '☕', 2, 0.002, 13, null, E => { const turbio = U.chance(0.35); return { ok: true, msg: (turbio ? 'Entre café y empanadas salen los cupos: ' : 'Desayuno de trabajo con los diputados: ') + Gb.ef(E, { asamblea: 12, honestidad: turbio ? -2 : 0 }) }; });
      // — Presencia —
      def('campanaRegional', 'Campaña de imagen regional', '📱', 1, 0.003, 8, null, E => { const J = E.jugador, gana = U.chance(U.clamp(0.4 + J.atributos.carisma / 220, 0.25, 0.85)); return gana ? { ok: true, msg: '«Orgullo del departamento» se vuelve tendencia: ' + Gb.ef(E, { rec: 3, animo: 3, turismo: 2 }) } : { ok: true, exito: false, msg: 'La campaña no pega y te llueven los memes: ' + Gb.ef(E, { rec: 0.5, animo: -1 }) }; });
      def('lanzarPresidenciable', 'Coquetearle a la Presidencia', '🦅', 3, 0, 52, E => (Gb.vida(E).animo > 55 ? true : 'Antes tienes que tener contento al departamento'), E => { const v = Gb.vida(E); v.presidenciable = Math.min(100, v.presidenciable + 10); return { ok: true, msg: 'Sales en entrevistas nacionales: tu nombre suena para 2026… y 2030. ' + Gb.ef(E, { rec: 4, nacion: -3, animo: 1 }) }; });
    }
  };
  C.Gobernacion = Gb;
  C.Tiempo.registrar('gobernacion', Gb, 53);
  Gb.registrarAcciones();
})(window.CURUL);
