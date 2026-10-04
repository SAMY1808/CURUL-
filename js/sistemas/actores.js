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
    asegurar(E) { if (E.actores && E.actores.alianzas) { const a = E.actores; if (!a.lideres) { a.lideres = {}; a.ultReu = {}; a.pactos = []; a.ultFrente = -999; } return a; } E.actores = { alianzas: {}, agendas: [], ult: -999, hist: [], lideres: {}, ultReu: {}, pactos: [], ultFrente: -999 }; return E.actores; },
    // Fase 50: líderes, reuniones, pactos y frentes
    lider(E, id) { const a = A.asegurar(E); if (!a.lideres) { a.lideres = {}; a.ultReu = {}; a.pactos = []; a.ultFrente = -999; } let l = a.lideres[id]; if (!l || E.fecha.t - l.t0 > 208 + l.dur) { const N = C.DATA.nombres, h = U.chance(0.62); l = a.lideres[id] = { nombre: U.pick(h ? N.h : N.m) + ' ' + U.pick(N.a), t0: E.fecha.t, dur: U.ri(0, 150), perfil: U.pick(['dialoguista', 'combativo', 'pragmático', 'doctrinario']) }; } return l; },
    opositores(E) { return Object.keys(ACT).filter(id => A.afin(E, id) < 35); },
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
      for (const pc of (a.pactos || [])) if (pc.estado === 'vigente' && t >= pc.vence) {
        if (A.afin(E, pc.actor) >= 45) { pc.estado = 'cumplido'; a.alianzas[pc.actor] = Math.min(100, (a.alianzas[pc.actor] || 0) + 10); if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'general', titular: `Se cumple el pacto con ${ACT[pc.actor].n}: el sector respalda al gobierno`, tono: 1, jugador: esPres(E) }); }
        else { pc.estado = 'incumplido'; A.mover(E, pc.actor, -12); if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'general', titular: `${ACT[pc.actor].n} denuncia el incumplimiento del pacto firmado con ${E.jugador.nombre}`, tono: -1, jugador: esPres(E) }); }
      }
      if (a.pactos && a.pactos.length > 15) a.pactos.length = 15;
      // frente opositor: si tres o más actores están hartos, se coordinan
      if (!E.meta.presim && esPres(E) && !E.eventos.pendientes.length && t - (a.ultFrente || -999) > 40 && A.opositores(E).length >= 3 && U.chance(0.04)) {
        a.ultFrente = t; const ops = A.opositores(E); const ns = ops.slice(0, 4).map(i => ACT[i].n).join(', ');
        C.Eventos.disparar(E, C.Eventos.plantilla('ac_frente'), { forzar: true, vars: { lista: ns, n: ops.length } });
      }
      if (E.meta.presim || !esPres(E) || E.eventos.pendientes.length || t - a.ult < 14 || !U.chance(0.02)) return;
      const id = U.pesado(Object.keys(ACT), k => 1 + (a.alianzas[k] ? 1.5 : 0)); const d = ACT[id], txt = U.pick(d.d);
      const ag = { id: U.id('ag'), actor: id, txt, t0: t, estado: 'abierta' }; a.agendas.unshift(ag); a.ult = t;
      C.Eventos.disparar(E, C.Eventos.plantilla('ac_demanda'), { forzar: true, vars: { actor: d.n, txt, aid: ag.id } });
    },
    frenteGolpe(E, n, fuerte) { for (const id of A.opositores(E)) if (ACT[id].p === 'mov' && C.Movilizacion) C.Movilizacion.actor(E, id).descontento = cl(C.Movilizacion.actor(E, id).descontento + 6, 0, 100); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - n * (fuerte ? 2.2 : 1.2), 3, 95); for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad - 0.1 * n, 1, 99); },
    registrarAcciones() {
      const R = C.Acciones.registrar.bind(C.Acciones), val = a => ACT[a.actor] ? true : 'Elige el actor';
      R({ id: 'reunirseActor', nombre: 'Reunirte con el líder de un actor social', icono: '☕', grupo: 'regimen', costo: 1,
        disponible(E, a) { if (!ACT[a.actor]) return 'Elige el actor'; const u = A.asegurar(E).ultReu[a.actor]; return u != null && E.fecha.t - u < 8 ? 'Ya te reuniste hace poco con su líder' : true; },
        ejecutar(E, a) { const l = A.lider(E, a.actor), d = ACT[a.actor], k = l.perfil === 'combativo' ? 0.5 : l.perfil === 'dialoguista' ? 1.4 : 1; A.asegurar(E).ultReu[a.actor] = E.fecha.t; A.mover(E, a.actor, 4 * k); C.Opinion.subirRec(E, 0.4);
          const ab = A.asegurar(E).agendas.find(x => x.actor === a.actor && x.estado === 'abierta'); if (ab) { ab.t0 += 8; } return { ok: true, msg: `Te reúnes con ${l.nombre}, líder de ${d.n} (${l.perfil}): ${k >= 1 ? 'sale conforme con el diálogo' : 'sale escéptico'}${ab ? '; amplía el plazo de su demanda' : ''}` }; } });
      R({ id: 'financiarActor', nombre: 'Financiar un programa del actor social', icono: '💰', grupo: 'regimen', costo: 2,
        disponible(E, a) { return val(a); },
        ejecutar(E, a) { A.mover(E, a.actor, 7); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.3), p: 'm' }], 'actor'); const m = C.Pais.ef(E, { rec: 0.3 }); return { ok: true, msg: `Financias un programa de ${ACT[a.actor].n}. ${m}` }; } });
      R({ id: 'romperAlianzaActor', nombre: 'Romper una alianza con un actor', icono: '✂', grupo: 'regimen', costo: 1,
        disponible(E, a) { return ACT[a.actor] ? ((A.asegurar(E).alianzas[a.actor] || 0) > 0 ? true : 'No tienes alianza con él') : 'Elige el actor'; },
        ejecutar(E, a) { delete A.asegurar(E).alianzas[a.actor]; A.mover(E, a.actor, -9); return { ok: true, msg: `Rompes la alianza con ${ACT[a.actor].n}: se siente traicionado` }; } });
      R({ id: 'pactoActor', nombre: 'Negociar un pacto con un actor (mesa)', icono: '🪑', grupo: 'regimen', costo: 2,
        disponible(E, a) { return ACT[a.actor] ? C.Mesa.TIPOS.actor.puede(E, a.actor) : 'Elige el actor'; },
        ejecutar(E, a) { const m = C.Mesa.crear(E, 'actor', a.actor); return { ok: true, msg: `Se abre la mesa: ${m.titulo}`, mesa: m.id }; } });
      R({ id: 'convocarFrente', nombre: 'Convocar un frente social (marcha nacional)', icono: '📢', grupo: 'regimen', costo: 3,
        disponible(E) { const a = A.asegurar(E); if (esPres(E)) return 'Lo convoca la oposición'; if (E.fecha.t - (a.ultFrente || -999) < 30) return 'Aún no se recupera el movimiento'; return Object.keys(a.alianzas).filter(k => a.alianzas[k] >= 20).length >= 2 ? true : 'Necesitas al menos 2 actores aliados'; },
        ejecutar(E) { const a = A.asegurar(E), al = Object.keys(a.alianzas).filter(k => a.alianzas[k] >= 20); a.ultFrente = E.fecha.t; const fuerza = al.length + (E.opinion.aprobacionPres < 40 ? 1 : 0);
          E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - fuerza * 1.3, 3, 95); C.Opinion.subirRec(E, 1 + fuerza * 0.6); for (const id of al) A.mover(E, id, 2);
          C.Medios.noticia(E, { tipo: 'evento', titular: `Marcha nacional: ${al.map(i => ACT[i].n).slice(0, 3).join(', ')} se movilizan contra el Gobierno convocados por ${E.jugador.nombre}`, tono: -1, importante: true, jugador: true });
          return { ok: true, msg: `Convocas un frente de ${al.length} actores: la marcha golpea la aprobación del Gobierno y te da visibilidad` }; } });
      C.Acciones.registrar({ id: 'aliarseActor', nombre: 'Sellar una alianza con un actor social', icono: '🤝', grupo: 'regimen', costo: 2,
        disponible(E, a) { return ACT[a.actor] ? ((A.asegurar(E).alianzas[a.actor] || 0) >= 60 ? 'Ya son aliados firmes' : true) : 'Elige el actor'; },
        ejecutar(E, a) { const al = A.asegurar(E).alianzas; al[a.actor] = Math.min(100, (al[a.actor] || 0) + 25); A.mover(E, a.actor, 8); C.Opinion.subirRec(E, 0.6); return { ok: true, msg: `Sellas una alianza con ${ACT[a.actor].n}: te respaldarán en marchas y en momentos difíciles` }; } });
    }
  };
  C.Actores = A; C.Tiempo.registrar('actores', A, 77); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Actores'); A.registrarAcciones();
  C.DATA.eventos = (C.DATA.eventos || []).concat([{ id: 'ac_demanda', tipo: 'actores', icono: '📣', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Demanda de un actor: {actor}', texto: '{actor} te pide formalmente {txt}. Tienen un plazo y esperan respuesta.', opciones: [
    { t: 'Cumplir la demanda', fn: (E, e) => A.responder(E, e.ctx.vars.aid, 'cumplir') }, { t: 'Negociar una solución intermedia', fn: (E, e) => A.responder(E, e.ctx.vars.aid, 'negociar') }, { t: 'Rechazarla', fn: (E, e) => A.responder(E, e.ctx.vars.aid, 'rechazar') }] },
  { id: 'ac_frente', tipo: 'actores', icono: '✊', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Se forma un frente social contra el Gobierno', texto: '{lista} anuncian una acción conjunta: marchas simultáneas y una agenda común de {n} sectores inconformes.', opciones: [
    { t: 'Abrir un diálogo nacional con todos', fn: E => { for (const id of A.opositores(E)) A.mover(E, id, 6); return C.Pais.ef(E, { rec: 1.2, aprob: -0.5 }); } },
    { t: 'Dividirlos: negociar sólo con los más moderados', fn: E => { const o = A.opositores(E); if (o.length) A.mover(E, o[0], 10); A.frenteGolpe(E, o.length - 1, false); return C.Pais.ef(E, { rec: 0.5 }); } },
    { t: 'Desestimarlos y endurecer el pulso', fn: E => { A.frenteGolpe(E, A.opositores(E).length, true); for (const id of A.opositores(E)) A.mover(E, id, -4); return C.Pais.ef(E, { rec: 0 }); } }] }]);
  // tipo de mesa «actor»: pacto con un actor social, con cumplimiento posterior
  if (C.Mesa) C.Mesa.TIPOS.actor = { n: 'Pacto con un actor social', icono: '🤝',
    puede(E, ref) { return !ACT[ref] ? 'Elige el actor' : (A.asegurar(E).pactos || []).some(p => p.actor === ref && p.estado === 'vigente') ? 'Ya hay un pacto vigente con este actor' : true; },
    crear(E, ref) { const d = ACT[ref], af = A.afin(E, ref), l = A.lider(E, ref); return { titulo: `Pacto con ${d.n} (líder: ${l.nombre})`, contraparte: { n: d.n, icono: d.i, flex: cl(30 + af * 0.5 + (l.perfil === 'dialoguista' ? 12 : l.perfil === 'combativo' ? -10 : 0) + U.ri(-6, 6), 12, 85), poder: 50 }, leverage: cl(35 + af * 0.4 + (E.opinion.aprobacionPres - 45) * 0.3, 15, 85),
      temas: [{ id: 'agenda', n: 'Agenda del sector: ' + d.d[0], brecha: U.ri(35, 80), peso: 3, linea: false }, { id: 'recursos', n: 'Recursos presupuestales', brecha: U.ri(30, 75), peso: 2, linea: false }, { id: 'garantias', n: 'Garantías y participación en decisiones', brecha: U.ri(25, 70), peso: 2, linea: false }] }; },
    fin(E, m, r) { const id = m.ref, a = A.asegurar(E); if (r === 'acuerdo') { const q = 1 - C.Mesa.brechaProm(m) / 100; a.pactos.unshift({ actor: id, t0: E.fecha.t, vence: E.fecha.t + 52, estado: 'vigente' }); a.alianzas[id] = Math.min(100, (a.alianzas[id] || 0) + 20 + 25 * q); A.mover(E, id, 8 + 6 * q); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.2 + 0.4 * (1 - q)), p: 'm' }], 'actor'); C.Pais.ef(E, { rec: 0.8 });
        if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'general', titular: `${E.jugador.nombre} firma un pacto con ${ACT[id].n}: deberá cumplirse en el año`, tono: 1, jugador: esPres(E) }); }
      else { A.mover(E, id, -6); } } };
})(window.CURUL);
