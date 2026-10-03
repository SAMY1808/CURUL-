/* Historia con guion (Fase 44): motor genérico de episodios históricos (data/historia.js) y el medidor de la Violencia partidista.
   Cada episodio dispara sus hitos en su fecha real, en cualquier partida que lo cruce; si la partida empieza después de un hito,
   sólo se aplica su efecto de estado (`est`), no la noticia ni la decisión (`fn`). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp;
  const Hi = {
    clave: 'historia',
    asegurar(E) {
      if (E.historia && E.historia.eps) return E.historia;
      E.historia = { eps: {}, violencia: { nivel: 0 }, fp: { incentivos: null, soacha: false }, hist: [] };
      return E.historia;
    },
    init(E) { E.historia = null; }, migrar(E) { Hi.asegurar(E); },
    anotar(E, txt) { const h = Hi.asegurar(E); h.hist.unshift({ t: E.fecha.t, txt }); if (h.hist.length > 40) h.hist.length = 40; },
    estado(E, id) { const s = Hi.asegurar(E).eps[id]; return s ? s.estado : 'espera'; },
    turno(E) {
      const h = Hi.asegurar(E), T = C.DATA.historiaT, t = E.fecha.t;
      for (const D of C.DATA.historia || []) {
        const st = h.eps[D.id] || (h.eps[D.id] = { estado: 'espera', hechos: {} });
        if (st.estado === 'fin') continue;
        const ti = T(...D.inicio), tf = T(...D.fin);
        if (t < ti) continue;
        if (st.estado === 'espera') { st.estado = 'activo'; if (t - ti <= 3 && !E.meta.presim) Hi.anotar(E, `Comienza: ${D.nombre}`); }
        D.guion.forEach((g, i) => {
          const tg = T(...g.f); if (st.hechos[i] || t < tg) return; st.hechos[i] = true;
          try { if (g.est) g.est(E); if (g.fn && t - tg <= 3 && !E.meta.presim) { g.fn(E); Hi.anotar(E, `${D.icono} ${D.nombre}: hito del ${U.fmtT(tg)}`); } } catch (e) { console.error('[Historia]', D.id, i, e); }
        });
        if (t >= tf + 26 && Object.keys(st.hechos).length >= D.guion.length) st.estado = 'fin';
      }
      // la Violencia partidista erosiona la seguridad y alimenta los abusos; decae despacio
      const v = h.violencia;
      if (v.nivel > 0) {
        if (t % 4 === 0) for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad - v.nivel * 0.0025, 1, 99);
        v.nivel = cl(v.nivel - 0.025 + U.gauss(0, 0.15), 0, 100);
      }
      // falsos positivos: con incentivos a las bajas, los abusos de la fuerza pública se multiplican (con responsabilidad de mando)
      const fp = h.fp;
      if (fp.incentivos && !fp.soacha && C.CIDH && U.chance(0.05)) C.CIDH.registrar(E, 'ejecucion', { inst: 'ejercito', resp: E.gobierno.presidente === 'J' ? 'J' : null, evid: U.ri(25, 50) });
    }
  };
  C.Historia = Hi; C.Tiempo.registrar('historia', Hi, 69); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Historia');
})(window.CURUL);
