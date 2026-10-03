/* Actores con agenda propia (Fase 45): Iglesia, militares, banca, prensa, ONG, sindicatos, gremios, estudiantes, indígenas y campesinos
   te presentan demandas con plazo; puedes cumplirlas, negociarlas o ignorarlas, y firmar alianzas que luego te respaldan (marchas, juicio político). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const ACT = {
    iglesia: { n: 'Conferencia Episcopal e Iglesias', i: '⛪', p: 'poderes', d: ['que se blinde la educación religiosa y la defensa de la familia', 'que no se avance en reformas de costumbres'], ef: E => C.Pais.ef(E, { seg: { mayores: 1 } }) },
    militares: { n: 'Cúpula militar', i: '🎖', p: 'poderes', d: ['más presupuesto y ascensos para la tropa', 'respaldo jurídico frente a las investigaciones'], ef: E => { C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.4), p: 'm' }], 'actor'); return ''; } },
    banca: { n: 'Grupo financiero y banca', i: '🏦', p: 'poderes', d: ['estabilidad tributaria y menos impuestos a la banca', 'garantías al sistema financiero'], ef: E => { C.Economia.aplicarDelta(E, 'confianza', 1); return ''; } },
    prensa: { n: 'Barones de la prensa', i: '📰', p: 'poderes', d: ['pauta oficial y acceso exclusivo a la información', 'que no se regule el contenido informativo'], ef: E => { C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.1), p: 'm' }], 'actor'); return ''; } },
    ong: { n: 'ONG y cooperación internacional', i: '🌍', p: 'poderes', d: ['garantías para defensores de derechos humanos', 'una comisión de la verdad independiente'], ef: E => { if (C.CIDH) C.CIDH.asegurar(E).coop = cl(C.CIDH.asegurar(E).coop + 4, 0, 100); return ''; } },
    cut: { n: 'Central de Trabajadores', i: '🪧', p: 'mov', d: ['subir el salario mínimo por encima de la inflación', 'frenar la tercerización laboral'], ef: E => { C.Economia.aplicarDelta(E, 'desempleo', 0.1); return ''; } },
    gremios: { n: 'Gremios empresariales', i: '🏭', p: 'mov', d: ['rebajar los impuestos a las empresas', 'seguridad jurídica para la inversión'], ef: E => { C.Economia.aplicarDelta(E, 'inversion', 0.2); return ''; } },
    estudiantil: { n: 'Movimiento estudiantil', i: '🎓', p: 'mov', d: ['más presupuesto para la universidad pública', 'matrícula cero'], ef: E => { for (const d of Object.values(E.deptos)) d.educacion = cl(d.educacion + 0.3, 1, 99); return ''; } },
    indigena: { n: 'Movimiento indígena', i: '🪶', p: 'mov', d: ['cumplir los acuerdos pendientes sobre territorios', 'consulta previa efectiva'], ef: E => '' },
    agrario: { n: 'Movimiento agrario', i: '🌾', p: 'mov', d: ['precios de sustentación para las cosechas', 'avanzar la reforma rural'], ef: E => { C.Economia.aplicarDelta(E, 'pobreza', -0.1); return ''; } }
  };
  const A = {
    ACT, clave: 'actores',
    asegurar(E) { if (E.actores && E.actores.alianzas) return E.actores; E.actores = { alianzas: {}, agendas: [], ult: -999, hist: [] }; return E.actores; },
    init(E) { E.actores = null; }, migrar(E) { A.asegurar(E); },
    afin(E, id) { const d = ACT[id]; if (d.p === 'poderes') return C.Poderes ? C.Poderes.asegurar(E).actores[id].afin : 50; return 50 + (C.Movilizacion ? -(C.Movilizacion.actor(E, id).descontento - 30) * 0.5 + (C.Movilizacion.actor(E, id).relJ || 0) * 0.3 : 0); },
    mover(E, id, d) { const x = ACT[id]; if (x.p === 'poderes') { if (C.Poderes) C.Poderes.mover(E, id, d); } else if (C.Movilizacion) { const a = C.Movilizacion.actor(E, id); a.relJ = cl((a.relJ || 0) + d * 2, -100, 100); a.descontento = cl(a.descontento - d * 0.8, 0, 100); } },
    bono(E, ids) { const a = A.asegurar(E).alianzas; let s = 0; for (const id of ids) s += (a[id] || 0) / 100; return s; },
    responder(E, aid, via) {
      const ag = A.asegurar(E).agendas.find(x => x.id === aid), d = ag && ACT[ag.actor]; if (!ag || ag.estado !== 'abierta') return 'La demanda ya se resolvió';
      ag.estado = via; ag.fin = E.fecha.t; const msg = [];
      if (via === 'cumplir') { A.mover(E, ag.actor, 12); if (d.ef) d.ef(E); msg.push(C.Pais.ef(E, { rec: 0.8 })); }
      else if (via === 'negociar') { A.mover(E, ag.actor, 4); msg.push(C.Pais.ef(E, { rec: 0.4 })); }
      else { A.mover(E, ag.actor, -10); if (d.p === 'mov' && C.Movilizacion) C.Movilizacion.actor(E, ag.actor).descontento = cl(C.Movilizacion.actor(E, ag.actor).descontento + 12, 0, 100); msg.push(C.Pais.ef(E, { rec: 0 })); }
      return msg.join(' ');
    },
    turno(E) {
      const a = A.asegurar(E), t = E.fecha.t;
      for (const k of Object.keys(a.alianzas)) { a.alianzas[k] = Math.max(0, a.alianzas[k] - 0.06); if (a.alianzas[k] <= 0) delete a.alianzas[k]; }
      for (const ag of a.agendas) if (ag.estado === 'abierta' && t - ag.t0 > 26) { ag.estado = 'ignorada'; A.mover(E, ag.actor, -8); }
      if (a.agendas.length > 12) a.agendas.length = 12;
      if (E.meta.presim || !esPres(E) || E.eventos.pendientes.length || t - a.ult < 14 || !U.chance(0.02)) return;
      const id = U.pesado(Object.keys(ACT), k => 1 + (a.alianzas[k] ? 1.5 : 0)); const d = ACT[id], txt = U.pick(d.d);
      const ag = { id: U.id('ag'), actor: id, txt, t0: t, estado: 'abierta' }; a.agendas.unshift(ag); a.ult = t;
      C.Eventos.disparar(E, C.Eventos.plantilla('ac_demanda'), { forzar: true, vars: { actor: d.n, txt, aid: ag.id } });
    },
    registrarAcciones() {
      C.Acciones.registrar({ id: 'aliarseActor', nombre: 'Sellar una alianza con un actor social', icono: '🤝', grupo: 'regimen', costo: 2,
        disponible(E, a) { return ACT[a.actor] ? ((A.asegurar(E).alianzas[a.actor] || 0) >= 60 ? 'Ya son aliados firmes' : true) : 'Elige el actor'; },
        ejecutar(E, a) { const al = A.asegurar(E).alianzas; al[a.actor] = Math.min(100, (al[a.actor] || 0) + 25); A.mover(E, a.actor, 8); C.Opinion.subirRec(E, 0.6); return { ok: true, msg: `Sellas una alianza con ${ACT[a.actor].n}: te respaldarán en marchas y en momentos difíciles` }; } });
    }
  };
  C.Actores = A; C.Tiempo.registrar('actores', A, 77); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Actores'); A.registrarAcciones();
  C.DATA.eventos = (C.DATA.eventos || []).concat([{ id: 'ac_demanda', tipo: 'actores', icono: '📣', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Demanda de un actor: {actor}', texto: '{actor} te pide formalmente {txt}. Tienen un plazo y esperan respuesta.', opciones: [
    { t: 'Cumplir la demanda', fn: (E, e) => A.responder(E, e.ctx.vars.aid, 'cumplir') }, { t: 'Negociar una solución intermedia', fn: (E, e) => A.responder(E, e.ctx.vars.aid, 'negociar') }, { t: 'Rechazarla', fn: (E, e) => A.responder(E, e.ctx.vars.aid, 'rechazar') }] }]);
})(window.CURUL);
