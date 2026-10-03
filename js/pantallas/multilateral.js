/* ONU, OEA y CIDH: los organismos multilaterales con vida propia (Fase 43). La CAN se movió a Comercio exterior (Fase 48). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const D = () => C.DATA.multi;
  const nom = id => id === 'COL' ? 'Colombia' : (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || '#4C7FE0'}"></i></div><b class="num" style="min-width:28px">${Math.round(v)}</b></div>`;
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const btn = (id, args, txt, cl) => UI.botonAccion(id, args || {}, txt || null, cl || 'chico');
  const colInd = v => v >= 60 ? '#3FBF7A' : v >= 35 ? '#E8A33D' : '#E0504A';
  const sel = (arg, opts) => `<select data-arg="${arg}">${opts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>`;
  const vacio = t => `<div class="tenue" style="font-size:13px">${t}</div>`;

  /* ── ONU ── */
  const tabONU = E => {
    const O = C.ONU, o = O.asegurar(E), y = U.anio(), P = C.MundoVivo.asegurar(E).presion;
    const ag = o.ag.hist.length ? `<div class="lista">${o.ag.hist.slice(0, 6).map(h => `<div class="it"><div class="cuerpo">${esc(h.n)}</div><span class="etq ${h.voto > 0 ? 'verde' : h.voto < 0 ? 'rojo' : 'amar'}">${h.voto > 0 ? 'A favor' : h.voto < 0 ? 'En contra' : 'Abstención'}</span></div>`).join('')}</div>` : vacio('Todavía no hay votaciones registradas.');
    const epu = o.epu.recs.length ? `<div class="lista">${o.epu.recs.map(r => `<div class="it"><div class="cuerpo" style="font-size:13px">${esc(r.n)}</div><span class="etq ${r.estado === 'aceptada' ? 'verde' : r.estado === 'rechazada' ? 'rojo' : 'amar'}">${esc(r.estado)}</span></div>`).join('')}</div>` : vacio(y < 2008 ? 'El Examen Periódico Universal existe desde 2008.' : `Próximo examen: ${U.fmtT(o.epu.prox)}.`);
    const mis = o.mision ? `<div class="resultado-jugador ok"><div style="font-size:24px">🕊</div><div><b>${esc(o.mision.nombre)}</b><div class="tenue" style="font-size:12.5px">Mandato hasta ${U.fmtT(o.mision.hasta)}. El Consejo de Seguridad lo renueva cada octubre.</div></div></div><div style="margin-top:8px">${btn('cabildearMision', {}, 'Cabildear la renovación')}</div>` : vacio('No hay misión de la ONU en el país. Se crea al firmar un acuerdo de paz.');
    const ods = o.ods.score ? `${fila('Índice ODS', barra(o.ods.score, colInd(o.ods.score)))}${fila('Puesto mundial', `<b>${o.ods.rank} de 166</b>`)}${C.Graf && o.ods.hist.length > 1 ? C.Graf.linea([{ nombre: 'ODS', color: '#6CC4F5', datos: o.ods.hist }], { alto: 90, min: 0, max: 100 }) : ''}` : vacio('El primer informe llega en unos meses.');
    return `<div class="grid g2"><div class="col">
      <div class="tarjeta"><h3>🌐 Asamblea General</h3><div class="tenue" style="font-size:12.5px;margin-bottom:6px">Cada voto reacomoda tu relación con los bloques. Secretario General: <b>${esc(o.sg.nombre)}</b>.</div>
        ${fila('Occidente', barra(50 + P.occidente, '#4C7FE0'))}${fila('Multipolar', barra(50 + P.multipolar, '#E8A33D'))}${fila('Bolivariano', barra(50 + P.bolivariano, '#E0504A'))}<h4 class="sub-h" style="margin:10px 0 6px">Tus votos recientes</h4>${ag}</div>
      <div class="tarjeta"><h3>📋 Examen Periódico Universal (Consejo de DD. HH.)</h3>${epu}</div></div>
      <div class="col"><div class="tarjeta"><h3>🕊 Misión de Verificación</h3>${mis}</div>
      <div class="tarjeta"><h3>🪖 Cascos azules y relatores</h3>${fila('Soldados en misiones de paz', `<b>${o.cascos.n}</b>`)}${fila('Bajas', `<b>${o.cascos.bajas}</b>`)}
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('desplegarCascos', {}, 'Enviar 200 soldados')}${btn('retirarCascos', {}, 'Retirar')}${btn('invitarRelator', {}, 'Invitar a un relator', 'chico')}</div></div>
      <div class="tarjeta"><h3>🎯 Objetivos de Desarrollo Sostenible</h3>${ods}</div>
      ${o.hist.length ? `<div class="tarjeta"><h3>Crónica de la ONU</h3><div class="lista">${o.hist.slice(0, 6).map(h => `<div class="it"><div class="cuerpo">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(h.t)}</div></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };

  /* ── OEA ── */
  const tabOEA = E => {
    const O = C.OEA, o = O.asegurar(E), mi = O.miembroCol(E);
    if (!O.activa()) return `<div class="tarjeta">${vacio('La Organización de Estados Americanos se funda en Bogotá en 1948. Antes sólo existía la Unión Panamericana.')}</div>`;
    const ls = Object.entries(o.paises).sort((a, b) => b[1].ind - a[1].ind);
    const casos = o.casos.slice(0, 6).map(c => { const t = O.votos(E, c), abierto = ['consejo', 'asamblea'].includes(c.fase); return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(nom(c.pais))}</b> <span class="etq ${abierto ? 'amar' : c.fase === 'suspendido' ? 'rojo' : ''}">${abierto ? (c.fase === 'consejo' ? 'Consejo Permanente' : 'Asamblea General') : esc(c.resultado || c.fase)}</span><div class="tenue" style="font-size:12px">${esc(c.motivo)} · ${abierto ? `${t.favor} de ${t.total} a favor, se necesitan ${t.necesario}` : U.fmtT(c.t0)}</div></div>${abierto && (E.gobierno.presidente === 'J' || (E.regimen && E.regimen.junta && E.regimen.junta.lider === 'J')) ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${c.pais === 'COL' ? '' : sel('lado', [['favor', 'Impulsar la suspensión'], ['contra', 'Frenarla']])}${btn('cabildearOEA', { caso: c.id, lado: 'favor' }, 'Cabildear')}</div>` : ''}</div>`; }).join('');
    const col = o.col;
    return `<div class="grid g2"><div class="col">
      <div class="tarjeta"><h3>🏛 OEA y Carta Democrática</h3>
        ${fila('Colombia en la OEA', mi ? '<span class="etq verde">miembro</span>' : '<span class="etq rojo">fuera</span>')}${fila('Índice democrático de Colombia', barra(col.ind, colInd(col.ind)))}${col.suspendida ? '<div class="etq rojo" style="margin:6px 0">Colombia está SUSPENDIDA de la OEA</div>' : ''}
        ${fila('Secretario General', `<b>${esc(o.sg.nombre)}</b> <span class="tenue">(${esc(o.sg.tend)})</span>`)}
        <div class="tenue" style="font-size:12px;margin:6px 0">${O.carta() ? 'La Carta Democrática se activa por golpes y rupturas del orden democrático. El Consejo Permanente decide por mayoría; la suspensión exige dos tercios.' : 'El mecanismo de defensa de la democracia nace en 1991 (Resolución 1080) y se consolida con la Carta Democrática de 2001.'}</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${sel('pais', ls.filter(([, p]) => p.estado === 'miembro').map(([id]) => [id, nom(id)]))}${btn('invocarCarta', { pais: 'VEN' }, 'Invocar la Carta', 'prim')}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('pedirCartaDemocratica', {}, 'Pedir la Carta para Colombia')}${mi ? btn('denunciarCartaOEA', {}, 'Retirar a Colombia de la OEA') : ''}</div></div>
      <div class="tarjeta"><h3>Casos de la Carta Democrática</h3>${casos ? `<div class="lista">${casos}</div>` : vacio('Ningún caso abierto.')}</div>
      <div class="tarjeta"><h3>🗳 Misiones de observación electoral</h3>${o.moe.length ? `<div class="lista">${o.moe.slice(0, 5).map(m => `<div class="it"><div class="cuerpo">${esc(m.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(m.t)}</div></div>${barra(m.q, colInd(m.q), 70)}</div>`).join('')}</div>` : vacio('Sin informes todavía.')}</div></div>
      <div class="col"><div class="tarjeta"><h3>Calidad democrática del hemisferio</h3><div class="lista">${ls.map(([id, p]) => `<div class="it"><div class="cuerpo">${esc(nom(id))} <span class="tenue" style="font-size:11.5px">${p.estado !== 'miembro' ? p.estado : ''}</span></div>${barra(p.ind, colInd(p.ind), 90)}</div>`).join('')}</div></div>
      ${o.hist.length ? `<div class="tarjeta"><h3>Crónica de la OEA</h3><div class="lista">${o.hist.slice(0, 6).map(h => `<div class="it"><div class="cuerpo">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(h.t)}</div></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };

  /* ── CIDH ── */
  const tabCIDH = E => {
    const K = C.CIDH, k = K.asegurar(E), ER = K.era(), esP = E.gobierno.presidente === 'J', vis = K.visibles(E).filter(c => !K.FIN.includes(c.fase)), cerr = K.visibles(E).filter(c => K.FIN.includes(c.fase)).length;
    const exp = k.casos.filter(c => c.resp === 'J' && c.fase !== 'oculto').length, expO = k.casos.filter(c => c.resp === 'J' && c.fase === 'oculto').length;
    const lista = vis.slice().sort((a, b) => D().CIDH_TIPOS[b.tipo].g - D().CIDH_TIPOS[a.tipo].g).slice(0, 12).map(c => { const T = D().CIDH_TIPOS[c.tipo], d = E.deptos[c.depto];
      const acc = esP && ['fondo', 'recomendaciones', 'corte', 'sentencia'].includes(c.fase) ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${sel('via', [['cumplir', 'Cumplir'], ['amistosa', 'Solución amistosa'], ['parcial', 'Cumplir en parte'], ['desacatar', 'Desconocer']])}${btn('respuestaCaso', { caso: c.id, via: 'cumplir' }, 'Responder')}</div>` : (!c.denJ && ['denunciado', 'admisibilidad', 'fondo'].includes(c.fase) ? btn('denunciarCIDH', { caso: c.id }, 'Impulsar el caso') : '');
      return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(T.n)}</b> ${c.sist ? '<span class="etq rojo">patrón sistemático</span>' : ''} ${c.resp === 'J' ? '<span class="etq rojo">responsabilidad de mando</span>' : ''} <span class="etq">${esc(K.FASES[c.fase])}</span><div class="tenue" style="font-size:12px">${esc(d ? d.nombre : '')} · ${c.victimas} víctima${c.victimas > 1 ? 's' : ''} · ${esc(D().CIDH_INST[c.inst])}${c.monto ? ` · reparación $${c.monto.toLocaleString('es-CO')} M` : ''}</div>${barra(c.evid, '#6CC4F5', 90)}</div>${acc}</div>`; }).join('');
    const cautel = k.cautelares.length ? `<div class="lista">${k.cautelares.map(m => `<div class="it"><div class="cuerpo">${esc(m.nombre)} <span class="tenue" style="font-size:12px">${esc((E.deptos[m.depto] || {}).nombre || '')}</span></div>${barra(100 - m.riesgo, m.protegido ? '#3FBF7A' : '#E0504A', 70)}${esP ? (m.protegido ? '<span class="etq verde">protegido</span>' : btn('protegerLider', { id: m.id }, 'Proteger')) : ''}</div>`).join('')}</div>` : vacio('Sin medidas cautelares vigentes.');
    const cpi = k.cpi.fase ? { examen: 'Examen preliminar', investigacion: 'Investigación formal', ordenes: 'Órdenes de arresto', cerrado: 'Cerrado' }[k.cpi.fase] : (ER.cpi ? 'Sin actuación' : 'Aún no existe (desde 2002)');
    const lesa = k.lesa.length ? `<div class="lista">${k.lesa.map(l => `<div class="it"><div class="cuerpo"><b>${esc(D().CIDH_TIPOS[l.tipo].n)}</b> · ${esc(D().CIDH_INST[l.inst])}<div class="tenue" style="font-size:12px">${l.n} casos · detectado ${U.fmtT(l.t)}${l.resp ? ' · con responsabilidad de mando' : ''}</div></div><span class="etq rojo">lesa humanidad</span></div>`).join('')}</div>` : vacio('Aún no se ha documentado ningún patrón sistemático.');
    return `<div class="grid g2"><div class="col">
      <div class="tarjeta"><h3>🔎 Investigar al Estado</h3><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Los abusos nacen ocultos. Si investigas a una institución puedes destapar casos y, si se repiten, un patrón de lesa humanidad. Si eres el Gobierno, también puedes ordenar a la Fiscalía que procese a los responsables.</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${sel('inst', Object.entries(D().CIDH_INST))}${btn('investigarAgentes', { inst: 'ejercito' }, 'Investigar', 'prim')}${esP ? btn('procesarInternamente', { inst: 'ejercito' }, 'Ordenar procesar a los responsables') : ''}</div>
        ${esP ? `<div style="margin-top:8px">${btn('cooperarCIDH', {}, 'Invitar a la CIDH (visita in loco)')}</div>` : ''}
        <div class="tenue" style="font-size:12px;margin-top:8px">Casos ocultos sin descubrir: ${K.ocultos(E).length ? '<b>hay</b>' : 'ninguno conocido'}${exp || expO ? ` · tu exposición penal: ${exp} caso(s) visibles con responsabilidad de mando` : ''}</div></div>
      <div class="tarjeta"><h3>Impunidad y cooperación</h3>${fila('Impunidad', barra(k.impun, k.impun >= 60 ? '#E0504A' : '#E8A33D'))}${fila('Cooperación con el sistema interamericano', barra(k.coop, '#3FBF7A'))}${fila('Corte Penal Internacional', `<b>${esc(cpi)}</b>`)}${fila('Casos cerrados', `<b>${cerr}</b>`)}${!ER.cidh ? '<div class="tenue" style="font-size:12px;margin-top:6px">Antes de 1959 no existe la CIDH: los abusos quedan sin tribunal.</div>' : !ER.corte ? '<div class="tenue" style="font-size:12px;margin-top:6px">Colombia reconoce la Corte IDH en 1985.</div>' : ''}</div>
      <div class="tarjeta"><h3>⚠ Lesa humanidad</h3>${lesa}</div></div>
      <div class="col"><div class="tarjeta"><h3>Casos en trámite (${vis.length})</h3>${lista ? `<div class="lista">${lista}</div>` : vacio('Todavía no hay casos denunciados. Los abusos ocultos salen a la luz por filtraciones, la prensa, las ONG o una investigación.')}</div>
      <div class="tarjeta"><h3>🛡 Medidas cautelares</h3>${cautel}</div></div></div>`;
  };

  const TABS = [['onu', '🌐 ONU', tabONU], ['oea', '🏛 OEA', tabOEA], ['cidh', '⚖ CIDH y lesa humanidad', tabCIDH]];
  C.Pantallas.multilateral = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.mlTab || 'onu'; E.ui.mlTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>ONU, OEA y CIDH</h1><div class="sub">El sistema multilateral: votos, Carta Democrática y derechos humanos. La Comunidad Andina vive ahora en Comercio exterior, junto al Mercosur.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('multilateral', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
