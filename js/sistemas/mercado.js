/* Mercado de votos: la política real entre elección y elección. El jugador puede ganarse a un
   congresista con un puesto, una obra para su región, un favor personal o dinero (con riesgo de que
   lo denuncien), y puede intentar atraerlo a su partido (el cambio se hace efectivo en la próxima
   inscripción de listas, por la prohibición de doble militancia). Si eres Presidente, los partidos de
   tu coalición te pasan la cuenta: cuando su satisfacción cae, amenazan con irse y hay que decidir. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const OFERTAS = {
    favor: { n: 'Favor personal', icono: '🤝', costo: 1, desc: 'Un gesto: una recomendación, una invitación, un contacto.' },
    obra: { n: 'Obra para su región', icono: '🏗', costo: 2, desc: 'Prometes inversión en su departamento (sube el déficit).', poder: true },
    puesto: { n: 'Un puesto para su gente', icono: '💼', costo: 2, desc: 'Un cargo en el Gobierno para alguien de su confianza.', poder: true },
    dinero: { n: 'Dinero por debajo de la mesa', icono: '💰', costo: 1, desc: 'Muy efectivo, muy riesgoso: 60 millones y una posible denuncia.' }
  };
  const M = {
    OFERTAS,
    poder(E) { const J = E.jugador; return E.gobierno.presidente === 'J' || ['ministro', 'gobernador', 'alcalde'].includes(J.cargo); },
    miembros(E) { return [...C.Congreso.miembros(E, 'senado'), ...C.Congreso.miembros(E, 'camara')].filter(p => p.id !== 'J' && p.activo !== false); },
    /* 0-100: qué tan negociable es un congresista (pragmatismo, ambición, poca disciplina). */
    negociabilidad(p) { return Math.round(U.clamp((p.r.pra + p.r.amb) / 2 * 0.8 + (100 - p.r.dis) * 0.3 - Math.abs(p.relJ || 0) * 0.1, 0, 100)); },
    probAtraer(E, p) {
      const J = E.jugador, pa = E.partidos[J.partido], origen = E.partidos[p.partido];
      if (!pa) return 0;
      return U.clamp(0.12 + (p.relJ || 0) / 250 + p.r.amb / 500 - U.distIdeo(p, pa) * 0.5 + (origen && origen.cohesion < 55 ? 0.1 : 0) + (origen && origen.postura !== pa.postura ? 0.05 : 0), 0.03, 0.8);
    },
    turno(E) {
      if (E.meta.presim || E.gobierno.presidente !== 'J') return;
      const est = C.Gobierno.estabilidad(E), g = E.gobierno;
      if (g.coalicion.length < 2) return;
      const ps = Object.entries(est.porPartido).filter(([pid]) => pid !== g.partido && (E.partidos[pid] || {}).postura === 'gobierno' && (E.eventos.historial || []).slice(0, 15).every(h => !(h.plantilla === 'coalicionCobra' && h.ctx.pid === pid)));
      if (!ps.length) return;
      const [pid, x] = ps.sort((a, b) => a[1].s - b[1].s)[0];
      if (x.s < 42 && U.chance(0.03 + (42 - x.s) / 1200)) C.Eventos.disparar(E, C.Eventos.plantilla('coalicionCobra'), { pid, vars: { partido: E.partidos[pid].nombre } });
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'ofrecerAlCongresista', nombre: 'Ganarse a un congresista', icono: '🤝', grupo: 'congreso', costo: a => (OFERTAS[a && a.oferta] || { costo: 1 }).costo,
        ejecutar(E, a) {
          const J = E.jugador, p = E.politicos[a.pol], o = OFERTAS[a.oferta];
          if (!p || !p.activo || p.id === 'J' || !p.cargo) return { ok: false, msg: 'Elige al congresista' };
          if (!o) return { ok: false, msg: 'Elige qué le ofreces' };
          if (o.poder && !M.poder(E)) return { ok: false, msg: 'Sólo quien tiene cargos y presupuesto para repartir puede ofrecer eso' };
          if (p.ofertaJ != null && E.fecha.t - p.ofertaJ < 8) return { ok: false, msg: 'Ya lo atendiste hace poco: espera unas semanas' };
          if (a.oferta === 'dinero' && J.patrimonio < 60) return { ok: false, msg: `Necesitas ${U.cop(60)}` };
          p.ofertaJ = E.fecha.t;
          const d = { favor: 8, obra: 15, puesto: 25, dinero: 30 }[a.oferta] * (0.6 + M.negociabilidad(p) / 100 * 0.8);
          p.relJ = U.clamp((p.relJ || 0) + d, -100, 100);
          if (a.oferta === 'obra') { const dep = E.deptos[p.cargo.circ] || E.deptos[p.depto]; if (dep) dep.infraestructura = U.clamp(dep.infraestructura + 1, 1, 99); C.Economia.aplicarDelta(E, 'deficit', 0.03); }
          if (a.oferta === 'puesto') E.gobierno.cuotasEntregadas = (E.gobierno.cuotasEntregadas || 0) + 1;
          if (a.oferta === 'dinero') {
            J.patrimonio -= 60; J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + 5, 0, 100); E.opinion.corrupcionAcum = (E.opinion.corrupcionAcum || 0) + 0.4;
            if (U.chance(0.12 + (100 - p.r.dis) / 1000)) { C.Crisis.escandalo(E, { titulo: `${p.nombre} denuncia que le ofrecieron dinero por su voto`, texto: 'El congresista asegura que el ofrecimiento vino de tu entorno y anuncia que llevará el caso a la Fiscalía.', grav: 3 }); return { ok: true, msg: `${p.nombre} recibe el dinero... y lo denuncia`, exito: false }; }
          }
          return { ok: true, msg: `${p.nombre} recibe tu ofrecimiento (${o.n.toLowerCase()}): su relación contigo sube a ${Math.round(p.relJ)}` };
        } });
      A.registrar({ id: 'atraerCongresista', nombre: 'Atraer a mi partido', icono: '🧲', grupo: 'congreso', costo: 2,
        disponible: E => E.partidos[E.jugador.partido] ? true : 'Necesitas pertenecer a un partido',
        ejecutar(E, a) {
          const J = E.jugador, p = E.politicos[a.pol], pa = E.partidos[J.partido];
          if (!p || !p.activo || !p.partido || p.id === 'J' || !p.cargo) return { ok: false, msg: 'Elige al congresista' };
          if (p.partido === pa.id) return { ok: false, msg: 'Ya es de tu partido' };
          if (p.proximoPartido) return { ok: false, msg: 'Ya tiene decidido su próximo partido' };
          const prob = M.probAtraer(E, p);
          if (U.chance(prob)) {
            const origen = E.partidos[p.partido]; p.proximoPartido = pa.id; C.Politicos.anotar(p, `Anuncia que aspirará por el ${pa.sigla} tras las gestiones de ${J.nombre}`);
            if (origen) { origen.relJ = U.clamp(origen.relJ - 6, -100, 100); origen.cohesion = U.clamp(origen.cohesion - 1.5, 0, 100); }
            C.Medios.noticia(E, { tipo: 'partidos', titular: `${p.nombre} dejará ${origen ? 'el ' + origen.sigla : 'su partido'} y aspirará por el ${pa.nombre}`, tono: 0, jugador: true, importante: true });
            return { ok: true, msg: `${p.nombre} se pasará a tu partido en la próxima inscripción de listas` };
          }
          p.relJ = U.clamp((p.relJ || 0) - 5, -100, 100);
          return { ok: true, msg: `${p.nombre} declina la invitación (probabilidad ${Math.round(prob * 100)} %)`, exito: false };
        } });
    }
  };
  C.Mercado = M;
  C.Tiempo.registrar('mercado', M, 41);
  M.registrarAcciones();
})(window.CURUL);
