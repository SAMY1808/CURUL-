/* Herramientas de juego (Fase 47): cronología de la partida, resumen semanal con variaciones y simulador «¿qué pasaría si…?»
   (clona la partida, aplica una acción y avanza unas semanas con la misma semilla para comparar con no hacer nada). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const METR = [
    ['aprob', 'Aprobación del Gobierno', E => E.opinion.aprobacionPres, 1, 1], ['crec', 'Crecimiento', E => E.economia.crecimiento, 1, 1], ['inf', 'Inflación', E => E.economia.inflacion, 1, -1],
    ['des', 'Desempleo', E => E.economia.desempleo, 1, -1], ['pob', 'Pobreza', E => E.economia.pobreza, 1, -1], ['def', 'Déficit', E => E.economia.deficit, 1, -1], ['deu', 'Deuda pública', E => E.economia.deuda, 1, -1],
    ['conf', 'Confianza económica', E => E.economia.confianza, 1, 1], ['seg', 'Seguridad promedio', E => U.prom(Object.values(E.deptos).map(d => d.seguridad)), 1, 1],
    ['golpe', 'Riesgo de golpe', E => (E.regimen ? E.regimen.riesgo : 0), 0, -1], ['impun', 'Impunidad', E => (E.cidh ? E.cidh.impun : 0), 0, -1], ['corr', 'Corrupción', E => (E.corr ? E.corr.indice : 0), 0, -1],
    ['rec', 'Tu reconocimiento', E => E.jugador.reconocimiento || 0, 1, 1], ['riesgoJ', 'Tu riesgo judicial', E => E.jugador.riesgoJudicial || 0, 0, -1], ['pat', 'Tu patrimonio (M)', E => E.jugador.patrimonio || 0, 0, 1]
  ];
  const R = {
    METR, clave: 'resumen',
    asegurar(E) { if (E.resumen && E.resumen.hist) return E.resumen; E.resumen = { hist: [] }; return E.resumen; },
    init(E) { E.resumen = null; }, migrar(E) { R.asegurar(E); },
    snap(E) { const o = {}; for (const [k, , f] of METR) { try { const v = f(E); o[k] = Number.isFinite(v) ? v : 0; } catch (e) { o[k] = 0; } } return o; },
    turno(E) {
      const r = R.asegurar(E); r.hist.push({ t: E.fecha.t, v: R.snap(E) }); if (r.hist.length > 14) r.hist.shift();
    },
    /* Variaciones respecto a hace 1 y 4 semanas */
    variaciones(E) {
      const r = R.asegurar(E), h = r.hist, cur = R.snap(E), a = h.length >= 2 ? h[h.length - 2].v : null, b = h.length >= 5 ? h[h.length - 5].v : (h[0] ? h[0].v : null);
      return METR.map(([k, n, , dec, signo]) => ({ k, n, v: cur[k], d1: a ? cur[k] - a[k] : 0, d4: b ? cur[k] - b[k] : 0, dec, signo }));
    },
    noticiasSemana(E) { return (E.medios.noticias || []).filter(n => n.t >= E.fecha.t - 1 && (n.importante || n.jugador)).slice(0, 12); }
  };
  C.Resumen = R; C.Tiempo.registrar('resumen', R, 99); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Resumen');

  /* ── Cronología permanente ── */
  const Cr = {
    clave: 'cronologia',
    asegurar(E) { if (E.cronologia && E.cronologia.items) return E.cronologia; E.cronologia = { items: [] }; return E.cronologia; },
    init(E) { E.cronologia = null; }, migrar(E) { Cr.asegurar(E); },
    registrar(E, n) { const c = Cr.asegurar(E); c.items.unshift({ t: n.t, txt: n.titular, tipo: n.tipo, jug: !!n.jugador, tono: n.tono || 0 }); if (c.items.length > 500) c.items.length = 500; },
    items(E, filtro) {
      const c = Cr.asegurar(E).items.map(x => ({ t: x.t, txt: x.txt, tipo: x.tipo, jug: x.jug, tono: x.tono, cat: ['gobierno', 'regional'].includes(x.tipo) ? 'poder' : ['diplomacia'].includes(x.tipo) ? 'mundo' : ['economia'].includes(x.tipo) ? 'economia' : ['escandalo', 'judicial', 'control'].includes(x.tipo) ? 'justicia' : 'general' }));
      const J = E.jugador.trayectoria || [];
      const mios = J.map(x => ({ t: x.t, txt: x.txt, tipo: 'personal', jug: true, tono: 0, cat: 'mio' }));
      let all = filtro === 'mio' ? mios : filtro && filtro !== 'todo' ? c.filter(x => x.cat === filtro) : c.concat(mios);
      return all.sort((a, b) => b.t - a.t).slice(0, 200);
    }
  };
  C.Cronologia = Cr; (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Cronologia');
  C.Bus.on('noticia', n => { try { if (n.importante && C.E && !C.E.meta.presim) Cr.registrar(C.E, n); } catch (e) {} });

  /* ── Simulador «¿qué pasaría si…?» ── */
  const S = {
    ocupado: false,
    ejecutarClon(snap, id, args, semanas) {
      C.E = JSON.parse(snap); const E = C.E; E.meta.presim = true;
      E.jugador.agenda.puntos = 99; let msg = null;
      if (id) { const r = C.Acciones.ejecutar(id, args || {}); msg = r && r.msg; }
      for (let i = 0; i < semanas; i++) { E.eventos.pendientes = []; E.elecciones.nochePendiente = null; E.participacion && (E.participacion.resultadosPendientes = []); E.ui.finPartida = null; E.ui.sucesionPendiente = null; C.Tiempo.avanzar(); E.jugador.agenda.puntos = 99; }
      return { v: R.snap(E), msg, tipo: E.regimen ? E.regimen.tipo : 'democracia' };
    },
    probar(id, args, semanas) {
      if (S.ocupado) return { ok: false, msg: 'Ya hay una simulación en curso' };
      semanas = U.clamp(semanas || 8, 2, 26); const orig = C.E, snap = JSON.stringify(orig);
      const p = C.Acciones.puede(id, args || {}); if (p !== true) return { ok: false, msg: String(p) };
      S.ocupado = true;
      try {
        const base = S.ejecutarClon(snap, null, null, semanas), alt = S.ejecutarClon(snap, id, args, semanas), ahora = R.snap(JSON.parse(snap));
        return { ok: true, semanas, msg: alt.msg, filas: METR.map(([k, n, , dec, signo]) => ({ k, n, ahora: ahora[k], base: base.v[k], alt: alt.v[k], dif: alt.v[k] - base.v[k], signo, dec })), regBase: base.tipo, regAlt: alt.tipo };
      } catch (e) { console.error('[Simular]', e); return { ok: false, msg: 'La simulación falló: ' + e.message }; }
      finally { C.E = orig; S.ocupado = false; }
    }
  };
  C.Simular = S;
})(window.CURUL);
