/* Economía y sociedad estructural (Fase 46): crisis de deuda con rescate del FMI y bonanzas (café, petróleo, coca) que dejan «enfermedad
   holandesa»; conflicto por la tierra (despojo, baldíos, restitución y reforma agraria); y corrupción sistémica (mermelada, carruseles,
   Fiscalía que persigue o encubre). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'economia', titular: txt, tono: tono == null ? 0 : tono, importante: !!imp, jugador: esPres(E) }); };
  const T = (y, m, d) => U.turnoDe(new Date(Date.UTC(y, m, d)));
  const ef = o => E => C.Pais.ef(E, o);

  /* ═══════ Deuda y FMI + bonanzas ═══════ */
  const COND = {
    recorte: { n: 'Recorte del gasto público', ejec(E) { C.Economia.programar(E, [{ v: 'deficit', d: -0.9, p: 'm' }], 'fmi'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 2, 3, 95); const p = E.partidos[E.gobierno.partido]; if (p) p.cohesion = cl(p.cohesion - 5, 0, 100); } },
    laboral: { n: 'Flexibilización laboral', ejec(E) { C.Economia.aplicarDelta(E, 'desempleo', 0.3); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 1.5, 3, 95); if (C.Movilizacion) C.Movilizacion.actor(E, 'cut').descontento = cl(C.Movilizacion.actor(E, 'cut').descontento + 12, 0, 100); } },
    tributaria: { n: 'Reforma tributaria', ejec(E) { C.Economia.programar(E, [{ v: 'deficit', d: -0.7, p: 'm' }], 'fmi'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 2.5, 3, 95); } },
    privatizar: { n: 'Venta de activos públicos', ejec(E) { C.Economia.programar(E, [{ v: 'deficit', d: -0.5, p: 'm' }, { v: 'confianza', d: 1, p: 'm' }], 'fmi'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 1, 3, 95); if (C.Movilizacion) C.Movilizacion.actor(E, 'cut').descontento = cl(C.Movilizacion.actor(E, 'cut').descontento + 8, 0, 100); } }
  };
  const BONANZAS = { cafe: { n: 'Bonanza cafetera', icono: '☕', ef: { exportaciones: 1.4, crecimiento: 0.012 } }, petroleo: { n: 'Superciclo del petróleo', icono: '🛢', ef: { exportaciones: 1.8, crecimiento: 0.014 } }, coca: { n: 'Bonanza marimbera y de la coca', icono: '🌿', ef: { exportaciones: 0.8, crecimiento: 0.008 } }, oro: { n: 'Auge del oro y el carbón', icono: '⛏', ef: { exportaciones: 1.0, crecimiento: 0.01 } } };
  const De = {
    COND, BONANZAS, clave: 'deudaFmi',
    asegurar(E) { if (E.deudaFmi && E.deudaFmi.riesgo != null) return E.deudaFmi; E.deudaFmi = { riesgo: 30, reservas: 60, fmi: null, crisis: null, bonanza: null, fondo: 0, hist: [], ultCrisis: -999, programas: 0 }; return E.deudaFmi; },
    init(E) { E.deudaFmi = null; }, migrar(E) { De.asegurar(E); },
    anotar(E, txt) { const d = De.asegurar(E); d.hist.unshift({ t: E.fecha.t, txt }); if (d.hist.length > 20) d.hist.length = 20; },
    objetivoRiesgo(E) {
      const Ec = E.economia, i = E.interv ? E.interv.sanciones : false, g = E.ins && E.ins.guerra && E.ins.guerra.activa, m = E.modelo && E.modelo.flags && E.modelo.flags.mor;
      return cl((Ec.deuda - 45) * 1.15 + (Ec.deficit - 3) * 5 + (50 - Ec.confianza) * 0.6 + (Ec.inflacion - 8) * 1.2 + (i ? 14 : 0) + (g ? 10 : 0) + (m ? 20 : 0) - (E.deudaFmi && E.deudaFmi.fmi ? 18 : 0), 0, 100);
    },
    iniciarFMI(E) {
      const d = De.asegurar(E), ks = Object.keys(COND).sort(() => U.rf(-1, 1)).slice(0, U.ri(2, 3));
      d.fmi = { desde: E.fecha.t, dur: 104, cond: ks.map(k => ({ k, cumplida: false })), suspendido: false }; d.programas++; d.riesgo = Math.max(0, d.riesgo - 25); d.reservas = cl(d.reservas + 30, 0, 100); E.economia.confianza = cl(E.economia.confianza + 3, 5, 95);
      De.anotar(E, 'Acuerdo con el FMI: ' + ks.map(k => COND[k].n).join(', ')); noti(E, `Colombia firma un acuerdo con el FMI: ${ks.map(k => COND[k].n.toLowerCase()).join(', ')}`, 0, true);
    },
    crisis(E) {
      const d = De.asegurar(E); d.ultCrisis = E.fecha.t; d.crisis = { t0: E.fecha.t };
      noti(E, 'CRISIS DE DEUDA: se agotan las reservas y los mercados cierran el crédito', -1, true); De.anotar(E, 'Estalla una crisis de deuda');
      if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('dd_crisis'), { forzar: true });
      else { De.resolverCrisis(E, 'fmi'); }
    },
    resolverCrisis(E, via) {
      const d = De.asegurar(E); d.crisis = null;
      if (via === 'fmi') { De.iniciarFMI(E); return C.Pais.ef(E, { rec: 0.5 }); }
      if (via === 'reestructurar') { d.riesgo = Math.max(0, d.riesgo - 15); E.economia.confianza = cl(E.economia.confianza - 3, 5, 95); E.economia.deuda = cl(E.economia.deuda - 8, 20, 120); C.Economia.aplicarDelta(E, 'inversion', -0.8); return C.Pais.ef(E, { rec: 1.5, honestidad: -1 }); }
      if (via === 'ajuste') { C.Economia.programar(E, [{ v: 'deficit', d: -1.4, p: 'm' }, { v: 'desempleo', d: 1.2, p: 'm' }, { v: 'pobreza', d: 1.5, p: 'l' }], 'ajuste'); d.riesgo = Math.max(0, d.riesgo - 22); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 6, 3, 95); return C.Pais.ef(E, { honestidad: 1 }); }
      d.riesgo = Math.min(100, d.riesgo + 10); E.economia.inflacion = cl(E.economia.inflacion + 4, 0, 60); return C.Pais.ef(E, { honestidad: -3 });   // monetizar
    },
    iniciarBonanza(E, tipo, dur) {
      const d = De.asegurar(E); if (d.bonanza) return; d.bonanza = { tipo, t0: E.fecha.t, dur: dur || U.ri(90, 200), fase: 'auge', ahorro: 0 };
      noti(E, `${BONANZAS[tipo].icono} ${BONANZAS[tipo].n}: entran divisas a raudales`, 1, true); De.anotar(E, 'Comienza: ' + BONANZAS[tipo].n);
      if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('dd_bonanza'), { forzar: true, vars: { b: BONANZAS[tipo].n } });
    },
    turno(E) {
      const d = De.asegurar(E), t = E.fecha.t, y = U.anio(), Ec = E.economia;
      d.riesgo = cl(d.riesgo + (De.objetivoRiesgo(E) - d.riesgo) * 0.02, 0, 100); d.reservas = cl(d.reservas + (62 - d.riesgo * 0.4 - d.reservas) * 0.02 + (d.bonanza && d.bonanza.fase === 'auge' ? 0.2 : 0), 0, 100);
      if (t % 4 === 0) U.serie('deuda:riesgo', d.riesgo);
      if (!d.crisis && d.riesgo > 75 && d.reservas < 32 && t - d.ultCrisis > 150 && U.chance(0.04)) De.crisis(E);
      // programa del FMI: condiciones con plazo
      if (d.fmi) {
        const f = d.fmi, pend = f.cond.filter(c => !c.cumplida);
        if (t - f.desde > 52 && pend.length && !f.suspendido) { f.suspendido = true; d.riesgo = cl(d.riesgo + 20, 0, 100); noti(E, 'El FMI suspende los desembolsos: Colombia incumplió las condiciones del acuerdo', -1, true); }
        if (t - f.desde > f.dur) { if (!pend.length) { E.economia.confianza = cl(E.economia.confianza + 2, 5, 95); noti(E, 'Colombia termina con éxito su programa con el FMI', 1); } d.fmi = null; }
      }
      // bonanzas: históricas (café 1975-78, marimbera 1976-82, petróleo 2004-14, oro/carbón 2005-2012) y aleatorias
      const bon = d.bonanza;
      if (!bon) {
        const H = [['cafe', 1975, 1978], ['coca', 1976, 1982], ['petroleo', 2004, 2014], ['oro', 2006, 2012]];
        for (const [k, a, b] of H) if (y >= a && y < b && !d['visto' + k]) { d['visto' + k] = true; De.iniciarBonanza(E, k, T(b, 0, 1) - t); }
        if (!d.bonanza && !E.meta.presim && U.chance(0.0015)) De.iniciarBonanza(E, U.pick(Object.keys(BONANZAS)), U.ri(80, 160));
      } else if (bon.fase === 'auge') {
        const b = BONANZAS[bon.tipo]; C.Economia.aplicarDelta(E, 'exportaciones', b.ef.exportaciones / 52); C.Economia.aplicarDelta(E, 'crecimiento', b.ef.crecimiento); Ec.deficit -= 0.003;
        if (t - bon.t0 > bon.dur) { bon.fase = 'caida'; bon.t1 = t; const sev = cl(1 - d.fondo / 100, 0.2, 1); bon.sev = sev; noti(E, `Termina la ${BONANZAS[bon.tipo].n.toLowerCase()}: caen los precios y llega la «enfermedad holandesa»`, -1, true); De.anotar(E, 'Termina ' + BONANZAS[bon.tipo].n); C.Economia.programar(E, [{ v: 'crecimiento', d: -1.2 * sev, p: 'm' }, { v: 'deficit', d: 1.2 * sev, p: 'm' }, { v: 'exportaciones', d: -3 * sev, p: 'm' }], 'bonanza'); d.fondo = cl(d.fondo * 0.6, 0, 100); }
      } else if (bon.fase === 'caida' && t - bon.t1 > 52) d.bonanza = null;
    },
    registrarAcciones() {
      const A = C.Acciones, pres = E => esPres(E) ? true : 'Sólo el Presidente';
      A.registrar({ id: 'pedirFMI', nombre: 'Pedir un programa de rescate al FMI', icono: '🏦', grupo: 'economia', costo: 3,
        disponible(E) { const p = pres(E); if (p !== true) return p; const d = De.asegurar(E); return d.fmi ? 'Ya tienes un programa vigente' : d.riesgo < 40 ? 'Todavía no lo necesitas' : true; },
        ejecutar(E) { De.iniciarFMI(E); return { ok: true, msg: 'Firmas el acuerdo con el FMI: llega crédito, y también condiciones que dividirán a tu partido' }; } });
      A.registrar({ id: 'cumplirCondicionFMI', nombre: 'Cumplir una condición del FMI', icono: '📑', grupo: 'economia', costo: 2,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; const f = De.asegurar(E).fmi; if (!f) return 'No hay programa con el FMI'; const c = f.cond.find(x => x.k === a.cond); return c && !c.cumplida ? true : 'Elige una condición pendiente'; },
        ejecutar(E, a) { const f = De.asegurar(E).fmi, c = f.cond.find(x => x.k === a.cond); c.cumplida = true; COND[a.cond].ejec(E); if (f.suspendido && !f.cond.some(x => !x.cumplida)) { f.suspendido = false; De.asegurar(E).riesgo = Math.max(0, De.asegurar(E).riesgo - 15); } return { ok: true, msg: `Cumples: ${COND[a.cond].n}. El costo político se hace sentir en tu partido` }; } });
      A.registrar({ id: 'ahorrarBonanza', nombre: 'Ahorrar la bonanza en un fondo de estabilización', icono: '🐖', grupo: 'economia', costo: 2,
        disponible(E) { const p = pres(E); if (p !== true) return p; const d = De.asegurar(E); return d.bonanza && d.bonanza.fase === 'auge' ? (d.fondo >= 90 ? 'El fondo ya está lleno' : true) : 'No hay bonanza en curso'; },
        ejecutar(E) { const d = De.asegurar(E); d.fondo = cl(d.fondo + 25, 0, 100); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.5, 3, 95); return { ok: true, msg: `Ahorras parte de las divisas: el fondo llega a ${Math.round(d.fondo)} %` }; } });
      A.registrar({ id: 'gastarBonanza', nombre: 'Gastar la bonanza en obras y subsidios', icono: '💸', grupo: 'economia', costo: 2,
        disponible(E) { const p = pres(E); if (p !== true) return p; const d = De.asegurar(E); return d.bonanza && d.bonanza.fase === 'auge' ? true : 'No hay bonanza en curso'; },
        ejecutar(E) { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 3, 3, 95); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.6), p: 'm' }, { v: 'pobreza', d: -0.4, p: 'm' }], 'bonanza'); return { ok: true, msg: 'Inauguras obras y repartes subsidios: el país aplaude… mientras dure la fiesta' }; } });
    }
  };
  C.Deuda = De; C.Tiempo.registrar('deudaFmi', De, 66); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Deuda'); De.registrarAcciones();

  /* ═══════ Tierras ═══════ */
  const Ti = {
    clave: 'tierras',
    asegurar(E) { if (E.tierras && E.tierras.gini != null) return E.tierras; E.tierras = { gini: 0.86, despojo: 15, restitucion: 0, conflicto: 40, titulada: 0, ult: {} }; return E.tierras; },
    init(E) { E.tierras = null; }, migrar(E) { Ti.asegurar(E); },
    turno(E) {
      const k = Ti.asegurar(E), y = U.anio(), t = E.fecha.t, ag = C.Movilizacion ? C.Movilizacion.actor(E, 'agrario').descontento : 30, v = C.Historia ? C.Historia.asegurar(E).violencia.nivel : 0;
      const para = (y >= 1985 && y <= 2008 ? 0.04 : 0.01) * (C.Cartel ? C.Cartel.asegurar(E).poder / 50 : 1);
      k.despojo = cl(k.despojo + para + v * 0.0005 - (k.restitucion > 0 ? 0.01 : 0), 0, 100);
      k.conflicto = cl(k.conflicto + (ag - 40) * 0.002 + (k.gini - 0.7) * 0.02 + k.despojo * 0.0003 - 0.01, 0, 100);
      k.gini = cl(k.gini + 0.00002, 0.5, 0.95);
      if (E.meta.presim || !esPres(E) || E.eventos.pendientes.length || !U.chance(0.004 + k.conflicto / 100 * 0.006)) return;
      C.Eventos.disparar(E, C.Eventos.plantilla(U.chance(0.5) ? 'tr_invasion' : 'tr_despojo'), { forzar: true });
    },
    registrarAcciones() {
      const A = C.Acciones, pres = E => esPres(E) ? true : 'Sólo el Presidente';
      A.registrar({ id: 'reformaAgraria', nombre: 'Reforma agraria', icono: '🌾', grupo: 'economia', costo: 3,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; const k = Ti.asegurar(E); if (!['expropiar', 'comprar', 'baldios'].includes(a.modo)) return 'Elige el modo'; return E.fecha.t - (k.ult[a.modo] || -99) < 26 ? 'Ya lo hiciste hace poco' : true; },
        ejecutar(E, a) { const k = Ti.asegurar(E); k.ult[a.modo] = E.fecha.t; const ag = C.Movilizacion && C.Movilizacion.actor(E, 'agrario');
          if (a.modo === 'expropiar') { k.gini = cl(k.gini - 0.02, 0.5, 0.95); k.conflicto = cl(k.conflicto - 10, 0, 100); if (ag) ag.descontento = cl(ag.descontento - 15, 0, 100); if (C.Poderes) { C.Poderes.mover(E, 'maquinas', -10); C.Poderes.mover(E, 'banca', -6); } C.Economia.aplicarDelta(E, 'inversion', -0.4); C.Economia.aplicarDelta(E, 'pobreza', -0.25); if (C.CIDH && U.chance(0.3)) C.CIDH.registrar(E, 'lider', { inst: 'paramilitar', evid: 30 }); return { ok: true, msg: 'Expropias latifundios improductivos: bajan la desigualdad y el conflicto, pero los terratenientes se enfurecen' }; }
          if (a.modo === 'comprar') { k.gini = cl(k.gini - 0.008, 0.5, 0.95); k.conflicto = cl(k.conflicto - 5, 0, 100); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.5), p: 'm' }, { v: 'pobreza', d: -0.15, p: 'l' }], 'tierras'); return { ok: true, msg: 'Compras tierras a precio de mercado para entregarlas a campesinos: cuesta, pero casi nadie se opone' }; }
          k.titulada += 5; k.conflicto = cl(k.conflicto - 3, 0, 100); if (ag) ag.descontento = cl(ag.descontento - 6, 0, 100); return { ok: true, msg: 'Titulas baldíos de la Nación a familias campesinas' }; } });
      A.registrar({ id: 'restituirTierras', nombre: 'Restituir tierras a las víctimas del despojo', icono: '🏞', grupo: 'economia', costo: 3,
        disponible(E) { const p = pres(E); if (p !== true) return p; const k = Ti.asegurar(E); return k.despojo < 8 ? 'Ya no queda despojo importante por restituir' : E.fecha.t - (k.ult.rest || -99) < 20 ? 'Ya lo hiciste hace poco' : true; },
        ejecutar(E) { const k = Ti.asegurar(E); k.ult.rest = E.fecha.t; k.despojo = cl(k.despojo - 8, 0, 100); k.restitucion += 1; if (C.CIDH) { const c = C.CIDH.asegurar(E); c.coop = cl(c.coop + 4, 0, 100); c.impun = cl(c.impun - 2, 0, 100); } if (C.Poderes) C.Poderes.mover(E, 'ong', 4); if (C.CIDH && U.chance(0.4)) C.CIDH.registrar(E, 'lider', { inst: 'paramilitar', evid: 35 }); C.Opinion.subirRec(E, 1.5); return { ok: true, msg: 'Devuelves tierras a familias despojadas; los reclamantes se vuelven blanco de amenazas' }; } });
    }
  };
  C.Tierras = Ti; C.Tiempo.registrar('tierras', Ti, 66); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Tierras'); Ti.registrarAcciones();

  /* ═══════ Corrupción sistémica ═══════ */
  const CASOS = [['Carrusel de la contratación', 'carrusel'], ['Mermelada: cupos indicativos para votos', 'mermelada'], ['Sobornos de una constructora transnacional', 'soborno'], ['Fraude en subsidios agrarios', 'subsidios'], ['Sobrecostos en una refinería', 'sobrecostos'], ['Cartel de la toga: sentencias a la carta', 'toga'], ['Contratos de ambulancias y alimentación escolar', 'contratos'], ['Quiebra fraudulenta de una comisionista', 'quiebra']];
  const Co = {
    clave: 'corr',
    asegurar(E) { if (E.corr && E.corr.casos) return E.corr; E.corr = { indice: 45, casos: [], fiscalia: 55, mermelada: 0, ult: -999 }; return E.corr; },
    init(E) { E.corr = null; }, migrar(E) { Co.asegurar(E); },
    efectoEscandalo(E, d) { const c = Co.asegurar(E); c.indice = cl(c.indice + d * 3, 0, 100); },
    indepFiscal(E) { const c = Co.asegurar(E), f = C.Control ? C.Control.titular(E, 'fiscal') : null; return cl(c.fiscalia + (f ? (f.agresiv - 50) * 0.2 : 0), 5, 95); },
    nuevoCaso(E, vis) {
      const [n, tipo] = U.pick(CASOS), c = Co.asegurar(E), tocaGob = U.chance(0.35);
      const k = { id: U.id('cc'), n, tipo, monto: U.ri(40, 4000), fase: 'oculto', t0: E.fecha.t, dur: 0, gob: tocaGob, resp: null, prot: false, culpable: null };
      c.casos.unshift(k); if (c.casos.length > 30) c.casos.length = 30; if (vis) Co.revelar(E, k); return k;
    },
    revelar(E, k) { k.fase = 'denunciado'; k.dur = U.ri(10, 26); k.t1 = E.fecha.t; E.opinion.escandalos = (E.opinion.escandalos || 0) + (k.gob ? 0.6 : 0.25); if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'escandalo', titular: `ESCÁNDALO: ${k.n} (${k.monto.toLocaleString('es-CO')} millones)${k.gob ? ' salpica al Gobierno' : ''}`, tono: -1, importante: true, jugador: k.gob && esPres(E) }); },
    turno(E) {
      const c = Co.asegurar(E), t = E.fecha.t, ind = Co.indepFiscal(E);
      c.indice = cl(c.indice + (45 - c.indice) * 0.001 + c.mermelada * 0.0005 - 0.003, 0, 100); c.mermelada = Math.max(0, c.mermelada - 0.05);
      E.economia.confianza = cl(E.economia.confianza - c.indice / 100 * 0.004, 5, 95);
      if (U.chance(0.012 * c.indice / 50)) Co.nuevoCaso(E, false);
      const pod = C.Poderes ? C.Poderes.asegurar(E).actores : null;
      for (const k of c.casos) {
        if (k.fase === 'oculto') { if (!(t - k.t0 < 4) && U.chance(0.004 + (pod ? (pod.prensa.poder + pod.ong.poder) / 200 * 0.008 : 0.004))) Co.revelar(E, k); continue; }
        if (['condena', 'archivado', 'impune'].includes(k.fase)) continue;
        k.dur--; if (k.dur > 0) continue;
        if (k.fase === 'denunciado') { if (k.prot || (k.gob && U.chance(0.55 - ind / 200))) { k.fase = 'impune'; c.indice = cl(c.indice + 1.5, 0, 100); if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'escandalo', titular: `La Fiscalía archiva el caso «${k.n}»: críticos denuncian impunidad`, tono: -1 }); } else { k.fase = 'investigacion'; k.dur = U.ri(20, 50); if (k.resp === 'J') E.jugador.riesgoJudicial = cl((E.jugador.riesgoJudicial || 0) + 15, 0, 100); } }
        else if (k.fase === 'investigacion') { k.fase = 'juicio'; k.dur = U.ri(25, 60); }
        else if (k.fase === 'juicio') {
          const cond = !k.prot && U.chance(0.35 + ind / 200); k.fase = cond ? 'condena' : 'impune'; c.indice = cl(c.indice + (cond ? -3 : 1.5), 0, 100);
          if (cond) { const vict = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && ['senador', 'representante', 'ministro', 'gobernador', 'alcalde'].includes(p.cargo.tipo)); if (vict.length) { const p = U.pick(vict); p.activo = false; p.cargo = null; C.Politicos.anotar(p, `Condenado por «${k.n}»`); k.culpable = p.nombre; } if (k.resp === 'J') { C.Pais.ef(E, { escandalo: `Condena por «${k.n}»`, honestidad: -8 }); E.jugador.riesgoJudicial = cl((E.jugador.riesgoJudicial || 0) + 20, 0, 100); } if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'escandalo', titular: `CONDENA en el caso «${k.n}»${k.culpable ? ': cae ' + k.culpable : ''}`, tono: 1, importante: true }); }
        }
      }
    },
    registrarAcciones() {
      const A = C.Acciones, pres = E => esPres(E) ? true : 'Sólo el Presidente';
      A.registrar({ id: 'repartirMermelada', nombre: 'Repartir «mermelada» a los congresistas', icono: '🍯', grupo: 'regimen', costo: 2,
        disponible(E) { const p = pres(E); if (p !== true) return p; return E.fecha.t - Co.asegurar(E).ult < 8 ? 'Ya repartiste hace poco' : true; },
        ejecutar(E) { const c = Co.asegurar(E); c.ult = E.fecha.t; c.mermelada += 6; c.indice = cl(c.indice + 2, 0, 100); for (const pid of E.gobierno.coalicion || []) { const p = E.partidos[pid]; if (p) p.cohesion = cl(p.cohesion + 2, 0, 100); } if (C.Poderes) C.Poderes.mover(E, 'maquinas', 6); E.jugador.riesgoJudicial = cl((E.jugador.riesgoJudicial || 0) + 3, 0, 100); if (U.chance(0.2)) { const k = Co.nuevoCaso(E, true); k.gob = true; k.resp = 'J'; k.n = 'Mermelada: cupos indicativos para votos'; } return { ok: true, msg: 'Repartes cupos y contratos: la coalición se alinea, pero crece el olor a corrupción' }; } });
      A.registrar({ id: 'presionarFiscalia', nombre: 'Influir en la Fiscalía', icono: '⚖', grupo: 'regimen', costo: 2,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; if (!['encubrir', 'respaldar'].includes(a.modo)) return 'Elige el modo'; return a.modo === 'encubrir' ? (Co.asegurar(E).casos.some(k => k.gob && !k.prot && !['condena', 'archivado', 'impune'].includes(k.fase)) ? true : 'No hay casos que te toquen') : true; },
        ejecutar(E, a) { const c = Co.asegurar(E);
          if (a.modo === 'encubrir') { let n = 0; for (const k of c.casos) if (k.gob && !k.prot && !['condena', 'archivado', 'impune'].includes(k.fase)) { k.prot = true; if (k.resp !== 'J') k.resp = 'J'; n++; } c.fiscalia = cl(c.fiscalia - 10, 0, 100); if (U.chance(0.3)) { C.Pais.ef(E, { escandalo: 'Presiones indebidas a la Fiscalía', honestidad: -6 }); return { ok: true, msg: `Blindas ${n} caso(s) pero te descubren: escándalo por obstrucción de la justicia` }; } return { ok: true, msg: `Blindas ${n} caso(s) incómodos: la Fiscalía los dejará dormir` }; }
          c.fiscalia = cl(c.fiscalia + 10, 0, 100); for (const k of c.casos) k.prot = false; E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 1, 3, 95); C.Opinion.subirRec(E, 1.5); return { ok: true, msg: 'Respaldas la independencia de la Fiscalía aunque los casos toquen a tu entorno' }; } });
    }
  };
  C.Corrupcion = Co; C.Tiempo.registrar('corr', Co, 67); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Corrupcion'); Co.registrarAcciones();

  /* ═══════ Eventos ═══════ */
  const evt = (id, icono, titulo, texto, ops) => ({ id, tipo: 'estructural', icono, alcance: 'jugador', sistema: true, peso: 1, titulo, texto, opciones: ops.map(([t, o]) => ({ t, fn: typeof o === 'function' ? o : ef(o) })) });
  C.DATA.eventos = (C.DATA.eventos || []).concat([
    evt('dd_crisis', '📉', 'Crisis de deuda', 'Se agotan las reservas, el peso se desploma y los acreedores no quieren renovar los créditos. Hay que decidir ya.', [
      ['Pedir un rescate al FMI y aceptar sus condiciones', E => De.resolverCrisis(E, 'fmi')], ['Reestructurar la deuda por las malas (moratoria parcial)', E => De.resolverCrisis(E, 'reestructurar')], ['Ajuste propio: recorte brutal del gasto', E => De.resolverCrisis(E, 'ajuste')], ['Monetizar el déficit: imprimir billetes', E => De.resolverCrisis(E, 'monetizar')]]),
    evt('dd_bonanza', '🎉', '{b}: ¿qué hacemos con la plata?', 'Entran divisas en cantidades inéditas. Los alcaldes y los gremios hacen fila; los economistas advierten que los precios no suben para siempre.', [
      ['Ahorrar en un fondo de estabilización', E => { const d = De.asegurar(E); d.fondo = cl(d.fondo + 30, 0, 100); return C.Pais.ef(E, { honestidad: 2, rec: 1 }); }],
      ['Gastar en obras y subsidios', E => { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 3, 3, 95); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.6), p: 'm' }], 'bonanza'); return C.Pais.ef(E, { rec: 1 }); }],
      ['Bajar impuestos a las empresas', E => { C.Economia.programar(E, [{ v: 'inversion', d: 0.5, p: 'm' }, { v: 'deficit', d: 0.3, p: 'm' }], 'bonanza'); return C.Pais.ef(E, { seg: { altos: 1 } }); }]]),
    evt('tr_invasion', '🏕', 'Invasión de tierras', 'Cientos de familias campesinas invaden una gran hacienda improductiva. Los propietarios exigen el desalojo inmediato.', [
      ['Negociar la compra de la tierra para los campesinos', E => { const k = Ti.asegurar(E); k.conflicto = cl(k.conflicto - 8, 0, 100); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.2), p: 'm' }], 'tierras'); return C.Pais.ef(E, { rec: 1, honestidad: 1 }); }],
      ['Ordenar el desalojo por la fuerza', E => { Ti.asegurar(E).conflicto = cl(Ti.asegurar(E).conflicto + 8, 0, 100); if (C.CIDH) C.CIDH.registrar(E, 'desplazamiento', { inst: 'policia', resp: 'J', evid: 35, vis: true }); return C.Pais.ef(E, { honestidad: -3, aprob: 1 }); }],
      ['Dejar que lo resuelvan los jueces', { rec: 0 }]]),
    evt('tr_despojo', '🏚', 'Denuncian despojo de tierras', 'Campesinos desplazados denuncian que hombres armados y notarios corruptos les quitaron sus fincas y que hoy son de empresarios y testaferros.', [
      ['Crear una unidad de restitución y proteger a los reclamantes', E => { const k = Ti.asegurar(E); k.despojo = cl(k.despojo - 4, 0, 100); if (C.CIDH) C.CIDH.asegurar(E).coop = cl(C.CIDH.asegurar(E).coop + 3, 0, 100); return C.Pais.ef(E, { honestidad: 3, rec: 1.5 }); }],
      ['Pedir pruebas y esperar a la justicia', { rec: 0 }],
      ['Restar importancia: «son casos aislados»', E => { if (C.CIDH) C.CIDH.asegurar(E).impun = cl(C.CIDH.asegurar(E).impun + 2, 0, 100); return C.Pais.ef(E, { honestidad: -2 }); }]])
  ]);
})(window.CURUL);
