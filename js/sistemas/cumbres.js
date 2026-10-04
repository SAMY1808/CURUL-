/* Cumbres presidenciales y carrera diplomática (Fase 53). Cada semestre hay una cumbre del bloque (CAN o Mercosur) con agenda, bilaterales
   al margen y un comunicado final; las alianzas que forjas con otros presidentes inclinan después los votos del Consejo. Los embajadores
   hacen carrera: ganan experiencia y prestigio, protagonizan escándalos, son condecorados o ascendidos. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const nomP = id => id === 'COL' ? 'Colombia' : (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: tono || 0, importante: !!imp, jugador: esPres(E) }); };
  const PEDIDOS = { voto: 'Pedirle su voto en las normas pendientes', comercio: 'Un gesto comercial (mejor relación y exportaciones)', apoyo: 'Sellar una alianza personal entre presidentes' };
  const Cu = {
    PEDIDOS, clave: 'cumbres',
    asegurar(E) { if (E.cumbres && E.cumbres.alianzas) return E.cumbres; E.cumbres = { activa: null, prox: { can: E.fecha.t + U.ri(8, 30), mercosur: E.fecha.t + U.ri(8, 30) }, alianzas: {}, hist: [] }; return E.cumbres; },
    init(E) { E.cumbres = null; }, migrar(E) { Cu.asegurar(E); },
    alianza(E, pais) { return ((E.cumbres && E.cumbres.alianzas) || {})[pais] || 0; },
    anotar(E, txt) { const c = Cu.asegurar(E); c.hist.unshift({ t: E.fecha.t, txt }); if (c.hist.length > 12) c.hist.length = 12; },
    /* abre la cumbre: asistencia = 'personal' | 'canciller' */
    abrir(E, id, asistencia) {
      const c = Cu.asegurar(E), B = C.Bloques, ms = B.miembros(E, id).filter(x => x !== 'COL'), pend = B.st(E, id).prop.filter(p => !['aprobada', 'rechazada'].includes(p.fase)).slice(0, 4);
      c.activa = { id: U.id('cb'), bloque: id, t0: E.fecha.t, fin: E.fecha.t + 3, asistencia, bilat: asistencia === 'personal' ? 2 : 1, hechos: [], paises: ms, agenda: pend.map(p => p.id), tono: null };
      noti(E, `Cumbre presidencial de la ${B.nombre(id)}: ${asistencia === 'personal' ? E.jugador.nombre + ' asiste' : 'Colombia envía a su canciller'}`, 0, true);
    },
    cerrar(E, razon) { const c = Cu.asegurar(E), a = c.activa; if (!a) return; Cu.anotar(E, `${C.Bloques.nombre(a.bloque)}: ${a.hechos.length ? a.hechos.join('; ') : 'sin resultados'}${razon ? ' (' + razon + ')' : ''}`); c.activa = null; },
    turno(E) {
      const c = Cu.asegurar(E), t = E.fecha.t;
      for (const k of Object.keys(c.alianzas)) { c.alianzas[k] = Math.max(0, c.alianzas[k] - 0.05); if (c.alianzas[k] <= 0) delete c.alianzas[k]; }
      if (c.activa && t >= c.activa.fin) Cu.cerrar(E, 'terminó la cumbre');
      if (E.meta.presim || !esPres(E)) return;
      for (const id of ['can', 'mercosur']) {
        if (c.prox[id] == null || t < c.prox[id] || c.activa || E.eventos.pendientes.length) continue;
        if (!C.Bloques.existe(E, id) || !C.Bloques.colMiembro(E, id)) { c.prox[id] = t + 26; continue; }
        c.prox[id] = t + 26 + U.ri(-3, 3);
        C.Eventos.disparar(E, C.Eventos.plantilla('cb_invitacion'), { forzar: true, vars: { bid: id, bloque: C.Bloques.nombre(id), sede: nomP(U.pick(C.Bloques.miembros(E, id))) } });
      }
    },
    registrarAcciones() {
      const R = C.Acciones.registrar.bind(C.Acciones), act = E => { const a = Cu.asegurar(E).activa; return a && E.fecha.t < a.fin ? a : null; };
      R({ id: 'bilateralCumbre', nombre: 'Reunión bilateral al margen de la cumbre', icono: '🤝', grupo: 'diplomacia', costo: 1,
        disponible(E, a) { const x = act(E); if (!x) return 'No hay una cumbre en curso'; if (x.bilat <= 0) return 'Ya no tienes más espacio en la agenda de la cumbre'; if (!x.paises.includes(a.pais)) return 'Elige un presidente de la cumbre'; if (!PEDIDOS[a.pedido || 'voto']) return 'Elige qué pedir'; return x.hechos.some(h => h.includes(nomP(a.pais))) ? 'Ya te reuniste con él en esta cumbre' : true; },
        ejecutar(E, a) {
          const x = act(E), st = E.diplomacia.paises[a.pais], rel = st ? st.relacion : 50, al = Cu.alianza(E, a.pais), ped = a.pedido || 'voto', J = E.jugador;
          const p = cl(0.35 + (rel - 50) / 150 + al / 250 + ((J.atributos && J.atributos.negociacion) || 50) / 400 + (x.asistencia === 'personal' ? 0.1 : -0.1), 0.1, 0.9); x.bilat--; const ok = U.chance(p);
          if (st) st.relacion = cl(st.relacion + (ok ? 4 : -1), 3, 97);
          if (!ok) { x.hechos.push(`${nomP(a.pais)} escucha pero no se compromete`); return { ok: true, exito: false, msg: `La reunión con ${nomP(a.pais)} es cordial, pero no obtienes lo que pedías (${Math.round(p * 100)} % de probabilidad)` }; }
          const c = Cu.asegurar(E); c.alianzas[a.pais] = Math.min(100, (c.alianzas[a.pais] || 0) + (ped === 'apoyo' ? 25 : 12));
          if (ped === 'voto') for (const pr of C.Bloques.st(E, x.bloque).prop) if (pr.fase === 'consejo' && C.Bloques.mesa(E, x.bloque, pr).pos[a.pais]) { const px = pr.mesa.pos[a.pais]; px.ini = cl(px.ini + 0.12, 0, 1); C.Bloques.mesaMov(E, pr, a.pais, 0.18, 'acuerdo bilateral con tu presidente'); } else if (['comision', 'parlamento', 'dictamen'].includes(pr.fase)) pr.bonus = (pr.bonus || 0) + 0.02;
          if (ped === 'comercio') { C.Comercio && C.Comercio.moverRelacion && C.Comercio.moverRelacion(E, a.pais, 2); C.Economia.aplicarDelta(E, 'exportaciones', 0.05); }
          C.Opinion.subirRec(E, 0.6); x.hechos.push(`bilateral con ${nomP(a.pais)}`);
          return { ok: true, msg: `Sellas un buen entendimiento con el presidente de ${nomP(a.pais)} (${PEDIDOS[ped].toLowerCase()})` };
        } });
      R({ id: 'empujarAgendaCumbre', nombre: 'Empujar una norma en la agenda de la cumbre', icono: '📌', grupo: 'diplomacia', costo: 1,
        disponible(E, a) { const x = act(E); if (!x) return 'No hay una cumbre en curso'; const pr = C.Bloques.st(E, x.bloque).prop.find(q => q.id === a.prop); return pr && !['aprobada', 'rechazada'].includes(pr.fase) ? (x.hechos.includes('empuja «' + pr.titulo + '»') ? 'Ya la empujaste' : true) : 'Elige una norma en trámite'; },
        ejecutar(E, a) { const x = act(E), pr = C.Bloques.st(E, x.bloque).prop.find(q => q.id === a.prop); pr.bonus = (pr.bonus || 0) + 0.05; pr.dur = Math.min(pr.dur, 2); if (pr.fase === 'consejo') { const m = C.Bloques.mesa(E, x.bloque, pr); for (const k of Object.keys(m.pos)) C.Bloques.mesaMov(E, pr, k, 0.06, 'impulso de la cumbre'); } x.hechos.push('empuja «' + pr.titulo + '»'); return { ok: true, msg: `Los presidentes ponen «${pr.titulo}» en primer lugar de la agenda: se acelera su trámite` }; } });
      R({ id: 'firmarComunicado', nombre: 'Firmar el comunicado final de la cumbre', icono: '📝', grupo: 'diplomacia', costo: 1,
        disponible(E, a) { return act(E) ? (a.tono === 'ambicioso' || a.tono === 'prudente' ? true : 'Elige el tono') : 'No hay una cumbre en curso'; },
        ejecutar(E, a) {
          const x = act(E), B = C.Bloques, id = x.bloque, ms = x.paises, rel = U.suma(ms.map(p => (E.diplomacia.paises[p] || { relacion: 50 }).relacion)) / Math.max(1, ms.length), al = U.suma(ms.map(p => Cu.alianza(E, p))) / Math.max(1, ms.length);
          if (a.tono === 'prudente') { if (id === 'can') C.CAN.asegurar(E).integ = cl(C.CAN.asegurar(E).integ + 1.5, 0, 100); C.Opinion.subirRec(E, 0.8); x.hechos.push('comunicado prudente'); Cu.cerrar(E); return { ok: true, msg: 'Un comunicado sobrio: nadie queda inconforme, nada cambia mucho' }; }
          const p = cl(0.3 + (rel - 50) / 120 + al / 150 + x.hechos.length * 0.06, 0.1, 0.9);
          if (U.chance(p)) { if (id === 'can') C.CAN.asegurar(E).integ = cl(C.CAN.asegurar(E).integ + 5, 0, 100); else if (C.MercosurInst) C.MercosurInst.st(E).legit = cl(C.MercosurInst.st(E).legit + 3, 0, 100); C.Opinion.subirRec(E, 2.5); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 1.2, 3, 95); x.hechos.push('comunicado ambicioso firmado'); noti(E, `Declaración de la cumbre de la ${B.nombre(id)}: compromisos de integración más profunda`, 1, true); Cu.cerrar(E); return { ok: true, msg: `Los presidentes firman una declaración ambiciosa (${Math.round(p * 100)} % de probabilidad)` }; }
          C.Opinion.subirRec(E, 0.5); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.8, 3, 95); x.hechos.push('el comunicado ambicioso fracasa'); noti(E, `La cumbre de la ${B.nombre(id)} termina sin declaración conjunta: diferencias entre los presidentes`, -1); Cu.cerrar(E); return { ok: true, exito: false, msg: 'No hay consenso: la cumbre termina sin declaración conjunta' };
        } });
    }
  };
  C.Cumbres = Cu; C.Tiempo.registrar('cumbres', Cu, 66); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Cumbres'); Cu.registrarAcciones();
  C.DATA.eventos = (C.DATA.eventos || []).concat([{ id: 'cb_invitacion', tipo: 'bloques', icono: '🏛', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Cumbre presidencial de la {bloque}', texto: 'Los presidentes del bloque se reúnen en {sede}. Habrá agenda de normas, reuniones bilaterales al margen y un comunicado final. ¿Cómo participa Colombia?', opciones: [
    { t: 'Asistir personalmente (dos bilaterales)', fn: (E, e) => { C.Cumbres.abrir(E, e.ctx.vars.bid, 'personal'); return C.Pais.ef(E, { rec: 0.5 }); } },
    { t: 'Enviar al canciller (una bilateral, menos peso)', fn: (E, e) => { C.Cumbres.abrir(E, e.ctx.vars.bid, 'canciller'); return C.Pais.ef(E, { rec: 0 }); } },
    { t: 'No asistir', fn: (E, e) => { for (const p of C.Bloques.miembros(E, e.ctx.vars.bid)) { const st = E.diplomacia.paises[p]; if (st) st.relacion = cl(st.relacion - 1.5, 3, 97); } return C.Pais.ef(E, { rec: -0.5 }); } }] }]);
  // las alianzas entre presidentes inclinan el voto de cada delegación
  const pp = C.Bloques.probPais; C.Bloques.probPais = function (E, id, pais, pr) { return cl(pp.call(C.Bloques, E, id, pais, pr) + Cu.alianza(E, pais) / 100 * 0.12, 0.05, 0.95); };

  /* ── Carrera diplomática ── */
  const X = C.Exterior, xt = X.turno;
  X.turno = function (E) {
    xt.call(X, E); const x = X.asegurar(E), t = E.fecha.t;
    for (const [pid, e] of Object.entries(x.embajadas)) {
      const em = e.abierta && e.embajador; if (!em) continue;
      em.exp = (em.exp || 0) + 1; em.prestigio = em.prestigio == null ? 40 : em.prestigio;
      if (em.exp % 52 === 0 && em.tipo === 'carrera') { em.calidad = Math.min(95, em.calidad + 1); em.prestigio = cl(em.prestigio + 2, 0, 100); }
      if (E.meta.presim) continue;
      if (U.chance(0.0012)) { em.calidad = Math.max(15, em.calidad - 10); em.prestigio = cl(em.prestigio - 12, 0, 100); if (E.gobierno.presidente === 'J') C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Escándalo en la embajada de Colombia en ${nomP(pid)}: cuestionan a ${em.nombre}`, tono: -1, jugador: true }); if (em.calidad < 28) { e.embajador = null; } }
      else if (em.prestigio > 70 && em.exp > 150 && em.tipo === 'carrera' && U.chance(0.002)) { x.vice = { nombre: em.nombre, calidad: em.calidad, t }; e.embajador = null; if (E.gobierno.presidente === 'J') C.Medios.noticia(E, { tipo: 'diplomacia', titular: `${em.nombre} es ascendido a viceministro de Relaciones Exteriores tras su exitosa misión en ${nomP(pid)}`, tono: 1, jugador: true }); }
    }
    if (x.vice) for (const st of Object.values(E.diplomacia.paises)) st.relacion = cl(st.relacion + 0.004 * (x.vice.calidad - 40) / 40, 3, 97);
  };
  C.Acciones.registrar({ id: 'condecorarEmbajador', nombre: 'Condecorar a un embajador', icono: '🎖', grupo: 'diplomacia', costo: 1,
    disponible(E, a) { const e = X.asegurar(E).embajadas[a.pais]; if (!e || !e.abierta || !e.embajador) return 'No hay embajador en ese país'; return E.fecha.t - (e.embajador.cond || -999) < 52 ? 'Ya fue condecorado este año' : true; },
    ejecutar(E, a) { const em = X.asegurar(E).embajadas[a.pais].embajador; em.cond = E.fecha.t; em.prestigio = cl((em.prestigio || 40) + 8, 0, 100); em.calidad = Math.min(95, em.calidad + 2); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.02), p: 'm' }], 'diplomacia'); return { ok: true, msg: `Condecoras a ${em.nombre}: mejora su prestigio y su desempeño` }; } });
})(window.CURUL);
