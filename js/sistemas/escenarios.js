/* Escenarios históricos: fija objetivos con plazo (se evalúan cada semana y suman al legado) y dispara los
   hitos guionados en su fecha. `E.escenario` guarda el progreso. Una partida libre no tiene escenario. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const S = {
    def(id) { return (C.DATA.escenarios || []).find(e => e.id === id); },
    iniciar(E, id) {
      const d = S.def(id); if (!d) return;
      const hoy = U.hoy(), y = hoy.getUTCFullYear(), m = hoy.getUTCMonth(), hechos = {};
      d.guion.forEach((g, i) => { if (g.y < y || (g.y === y && g.m < m)) hechos[i] = true; });
      E.escenario = { id, objetivos: d.objetivos.map(o => ({ id: o.id, estado: 'pendiente', t: null })), hechos, inicio: E.fecha.t };
      C.Medios.noticia(E, { tipo: 'general', titular: `Escenario «${d.nombre}»: ${d.desc}`, tono: 0, importante: true, jugador: true });
    },
    cumplidos(E) { return E.escenario ? E.escenario.objetivos.filter(o => o.estado === 'cumplido').length : 0; },
    turno(E) {
      const sc = E.escenario; if (!sc || E.meta.presim) return;
      const d = S.def(sc.id); if (!d) return;
      const hoy = U.hoy(), y = hoy.getUTCFullYear(), m = hoy.getUTCMonth();
      d.guion.forEach((g, i) => { if (!sc.hechos[i] && (y > g.y || (y === g.y && m >= g.m))) { sc.hechos[i] = true; g.fn(E); } });
      sc.objetivos.forEach((o, i) => {
        if (o.estado !== 'pendiente') return;
        const def = d.objetivos[i], vencido = y >= def.hasta;
        if (!def.alFinal && def.check(E)) return S.cerrar(E, d, o, def, true);
        if (vencido) S.cerrar(E, d, o, def, !!def.check(E));
      });
    },
    cerrar(E, d, o, def, ok) {
      o.estado = ok ? 'cumplido' : 'fallido'; o.t = E.fecha.t;
      C.Medios.noticia(E, { tipo: 'general', titular: `${ok ? '✔ Objetivo cumplido' : '✖ Objetivo fallido'} (${d.nombre}): ${def.txt}`, tono: ok ? 1 : -1, importante: true, jugador: true });
      C.Personaje.anotar(E, `${ok ? 'Cumples' : 'Fallas'} el objetivo «${def.txt}»`);
      if (ok) C.Opinion.subirRec(E, 1.5);
    }
  };
  C.Escenarios = S;
  C.Tiempo.registrar('escenarios', S, 90);
})(window.CURUL);
