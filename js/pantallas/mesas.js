/* Mesas de negociación: lista, detalle de la mesa con temas, tácticas, incidentes y apertura de mesas nuevas. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Me = () => C.Mesa;
  C.Pantallas = C.Pantallas || {};
  const col = v => v >= 62 ? '#3FBF7A' : v >= 40 ? '#E8A33D' : '#E0504A';
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || col(v)}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const gauge = v => { const p = (v + 70) / 140 * 100; return `<div style="position:relative;width:200px;height:10px;border-radius:5px;background:linear-gradient(90deg,#E0504A,#E8A33D 50%,#3FBF7A)"><i style="position:absolute;left:calc(${p}% - 5px);top:-3px;width:10px;height:16px;border-radius:3px;background:#fff;box-shadow:0 0 4px #000"></i></div>`; };
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const btn = (id, args, txt, cl) => UI.botonAccion(id, args || {}, txt || null, cl || 'chico');

  const detalle = (E, m) => {
    const M = Me(), amb = M.ambiente(m), ab = m.temas.filter(t => t.estado === 'abierto');
    const tt = M.TACT;
    const opts = ab.map(t => `<option value="${t.id}">${esc(t.n)}</option>`).join('');
    return `<div class="tarjeta"><h3>${M.TIPOS[m.tipo].icono} ${esc(m.titulo)}</h3>
      ${m.cfg ? `<div class="fila" style="gap:6px;flex-wrap:wrap;margin:6px 0"><span class="etq">📍 ${esc(m.cfg.sedeN)}</span><span class="etq">👥 ${m.cfg.equipo.map(x => esc(x.n)).join(' y ')} · hab. ${m.cfg.eqCal}</span>${m.cfg.garantias.map(g => `<span class="etq verde">🛡 ${esc(g)}</span>`).join('')}</div>` : ''}
      <div class="tenue" style="font-size:12.5px">Frente a ti: <b>${esc(m.contraparte.n)}</b> · ronda ${m.ronda} de ${m.max}${m.mediador ? ' · mediador: ' + esc(m.mediador.n) : ''}</div>
      <div class="grid g2" style="margin-top:10px"><div>${fila('Ambiente', `<span class="etq ${amb[1]}">${amb[0]}</span>`)}${fila('Impulso', gauge(m.momentum))}${fila('Confianza mutua', barra(m.confianza))}</div>
        <div>${fila('Tu fuerza relativa', barra(m.leverage, '#4C7FE0'))}${fila('Presión pública', barra(m.presion, '#9b7ad6'))}${fila('Costo político acumulado', `<b class="num">${Math.round(M.costoTotal(m))}</b>`)}</div></div>
      ${m.pendiente ? `<div class="tarjeta" style="margin-top:10px;border:1px solid #E8A33D"><h3>⚡ ${esc(m.pendiente.n)}</h3><div class="tenue" style="font-size:13px;margin-bottom:8px">${esc(m.pendiente.txt)}</div><div class="col">${m.pendiente.ops.map((o, i) => UI.botonAccion('resolverIncidenteMesa', { mesa: m.id, op: i }, o.t, 'prim')).join('')}</div></div>` : ''}
      <h4 class="sub-h" style="margin:14px 0 6px">Temas en discusión</h4>
      <div class="lista">${m.temas.map(t => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">${esc(t.n)} ${t.linea ? '<span class="etq rojo">línea roja</span>' : ''} ${t.estado === 'acordado' ? '<span class="etq verde">acordado</span>' : ''}</b><span>Peso ${t.peso} · concesiones tuyas ${Math.round(t.costoJ)}</span></div>${t.estado === 'abierto' ? barra(100 - t.brecha, '#3FBF7A', 100) : ''}
        ${t.estado === 'abierto' && !m.pendiente ? `<div class="fila" style="gap:6px;width:100%;margin-top:6px">${btn('mesaTactica', { mesa: m.id, tactica: 'proponer', tema: t.id }, 'Proponer')}${btn('mesaTactica', { mesa: m.id, tactica: 'ceder', tema: t.id }, 'Ceder')}${btn('mesaTactica', { mesa: m.id, tactica: 'presionar', tema: t.id }, 'Presionar')}</div>` : ''}</div>`).join('')}</div>
      ${!m.pendiente ? `<h4 class="sub-h" style="margin:14px 0 6px">Jugadas de la mesa</h4><div class="fila" style="gap:6px;flex-wrap:wrap">${['gesto', 'filtrar', 'mediador', 'pausa', 'ultimatum'].map(k => btn('mesaTactica', { mesa: m.id, tactica: k }, `${tt[k].icono} ${tt[k].n}`)).join('')}</div>
        ${ab.length >= 2 ? `<div class="fila accion-form" style="gap:6px;margin-top:8px;flex-wrap:wrap"><select data-arg="tema">${opts}</select><select data-arg="tema2">${ab.map((t, i) => `<option value="${t.id}"${i === 1 ? ' selected' : ''}>${esc(t.n)}</option>`).join('')}</select>${btn('mesaTactica', { mesa: m.id, tactica: 'paquete', tema: ab[0].id, tema2: ab[1].id }, '🧩 Negociar paquete')}</div>` : ''}
        <div class="fila" style="gap:6px;margin-top:10px">${btn('firmarAcuerdoMesa', { mesa: m.id }, '✍ Firmar acuerdo parcial')}${btn('abandonarMesa', { mesa: m.id }, '🚪 Levantarse de la mesa')}</div>` : ''}
      ${m.log.length ? `<h4 class="sub-h" style="margin:14px 0 6px">Bitácora de la mesa</h4><div class="lista">${m.log.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div>` : ''}</div>`;
  };

  const abrir = E => {
    const OP = C.OrdenPublico, grupos = OP ? OP.activos(E).filter(g => !E.ordenPublico.grupos[g.id].negociacion) : [];
    const paros = C.Movilizacion ? C.Movilizacion.ACTORES.filter(a => C.Movilizacion.actor(E, a.id) && C.Movilizacion.actor(E, a.id).paro) : [];
    const meds = C.Modelo ? C.Modelo.listaMedidas(E).slice(0, 12) : [];
    const MC = C.MesaCfg, cf = MC.cfg(E), K = MC.costo(E, 'paz', cf), cand = MC.candidatos(E);
    const ops = (arr, sel) => arr.map(([k, n]) => `<option value="${esc(k)}" ${k === sel ? 'selected' : ''}>${esc(n)}</option>`).join('');
    const sedes = MC.sedesPara(E, 'paz').concat(MC.sedesPara(E, 'paro').filter(x => !MC.sedesPara(E, 'paz').some(y => y.k === x.k))).concat(MC.sedesPara(E, 'cartel').filter(x => !MC.sedesPara(E, 'paz').some(y => y.k === x.k)));
    const eqOps = [['yo', `Yo mismo (habilidad ${MC.calidadYo(E)})`], ['ninguno', '— nadie —']].concat(cand.map(c => [c.id, `${c.n} (habilidad ${c.cal})`]));
    const gOps = Object.entries(MC.GARANT).map(([k, g]) => [k, g.n]);
    const cond = `<div class="tarjeta"><h3>⚙ Condiciones de la próxima mesa</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">La sede, el equipo de compromisarios y las garantías se aplican a las mesas que abras (paz, paro, pacto, transición, económicas, sometimiento y pactos con actores). Cuestan, pero compran confianza, un equipo más hábil y acuerdos más duraderos. Si delegas la negociación, tus concesiones te cuestan la mitad de aprobación.</div>
      <div class="accion-form"><div style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center;font-size:12.5px"><span>📍 Sede</span><select data-arg="sede" style="width:100%">${ops(sedes.map(x => [x.k, x.n]), cf.sede)}</select><span>👤 Compromisario 1</span><select data-arg="n1" style="width:100%">${ops(eqOps, cf.n1)}</select><span>👤 Compromisario 2</span><select data-arg="n2" style="width:100%">${ops(eqOps, cf.n2)}</select><span>🛡 Garantía 1</span><select data-arg="g1" style="width:100%">${ops(gOps, cf.g1)}</select><span>🛡 Garantía 2</span><select data-arg="g2" style="width:100%">${ops(gOps, cf.g2)}</select></div><div style="margin-top:8px">${UI.botonAccion('configurarMesa', { sede: cf.sede, n1: cf.n1, n2: cf.n2, g1: cf.g1, g2: cf.g2 }, 'Guardar condiciones', 'chico prim')}</div></div>
      <div class="tenue" style="font-size:12px;margin-top:8px">Actual: <b>${esc(MC.sede(cf).n)}</b> · equipo ${K.eq.miembros.map(x => esc(x.n)).join(' y ')} (habilidad ${K.eq.cal}) · garantías: ${K.gs.filter(g => g.n !== 'Sin garantes').map(g => esc(g.n)).join(', ') || 'ninguna'}<br>Costo al abrir: ${K.fiscal ? 'fiscal ' + K.fiscal + ' · ' : ''}${K.aprob ? 'aprobación ' + K.aprob + ' · ' : ''}${K.pts ? '+' + K.pts + ' punto(s) de agenda' : 'sin puntos extra'}. ${esc(MC.sede(cf).nota || '')}</div></div>`;
    return cond + `<div class="tarjeta"><h3>🪑 Abrir una mesa</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Cada mesa cuesta 2 puntos de agenda y se juega por rondas, con altos y bajos.</div>
      <div class="col">
        ${grupos.length ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><span style="min-width:100px">🕊 Paz con</span><select data-arg="ref">${grupos.map(g => `<option value="${g.id}">${esc(g.sigla)} · ${esc(g.nombre)}</option>`).join('')}</select>${UI.botonAccion('abrirMesa', { tipo: 'paz', ref: grupos[0].id }, 'Abrir', 'chico')}</div>` : '<div class="tenue" style="font-size:12px">🕊 No hay grupos armados disponibles para una mesa de paz.</div>'}
        ${paros.length ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><span style="min-width:100px">📢 Paro de</span><select data-arg="ref">${paros.map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select>${UI.botonAccion('abrirMesa', { tipo: 'paro', ref: paros[0].id }, 'Abrir', 'chico')}</div>` : '<div class="tenue" style="font-size:12px">📢 Ningún movimiento está en paro.</div>'}
        <div class="fila" style="gap:6px;flex-wrap:wrap"><span style="min-width:100px">🤝 Pacto social</span>${UI.botonAccion('abrirMesa', { tipo: 'pacto', ref: 'pacto' }, 'Abrir', 'chico')}</div>
        ${C.Regimen ? `<div class="fila" style="gap:6px;flex-wrap:wrap"><span style="min-width:100px">🗳 Transición</span>${UI.botonAccion('abrirMesa', { tipo: 'transicion', ref: 'transicion' }, 'Abrir', 'chico')}</div>` : ''}
        ${meds.length ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><span style="min-width:100px">🏦 Medida económica</span><select data-arg="ref">${meds.map(d => `<option value="${d.id}">${esc(d.n)}</option>`).join('')}</select>${UI.botonAccion('abrirMesa', { tipo: 'sector', ref: meds[0].id }, 'Negociar', 'chico')}</div>` : ''}</div></div>`;
  };

  C.Pantallas.mesas = {
    render(el) {
      const E = C.E, M = Me(), mesas = M.asegurar(E).activas; if (E.ui.mesaSel && !M.get(E, E.ui.mesaSel)) E.ui.mesaSel = null;
      const sel = E.ui.mesaSel ? M.get(E, E.ui.mesaSel) : mesas[0];
      const hist = M.asegurar(E).hist;
      el.innerHTML = `<div class="cab"><div><h1>Mesas de negociación</h1><div class="sub">Negociar es avanzar y retroceder: confianza, impulso, incidentes y decisiones difíciles.</div></div></div>
        <div class="grid g2" style="grid-template-columns:1fr 2fr"><div class="col">
          <div class="tarjeta"><h3>Mesas abiertas</h3>${mesas.length ? `<div class="lista">${mesas.map(m => `<div class="it clic" data-mesa="${m.id}" ${sel && sel.id === m.id ? 'style="background:rgba(217,180,90,.12)"' : ''}><div class="cuerpo"><b style="white-space:normal">${M.TIPOS[m.tipo].icono} ${esc(m.titulo)}</b><span>${esc(m.contraparte.n)} · ronda ${m.ronda}/${m.max}${m.pendiente ? ' · <b>incidente</b>' : ''}</span></div>${barra(100 - M.brechaProm(m), '#3FBF7A', 60)}</div>`).join('')}</div>` : '<div class="tenue">No hay mesas abiertas.</div>'}</div>
          ${abrir(E)}
          ${(M.asegurar(E).pactos || []).length ? `<div class="tarjeta"><h3>📜 Acuerdos firmados</h3><div class="lista">${M.asegurar(E).pactos.slice(0, 6).map(p => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">${esc(p.titulo)}</b><span>${U.fmtT(p.t0)} · ${p.garantias.length ? esc(p.garantias.join(', ')) : 'sin garantes'}</span>${p.estado === 'vigente' ? barra(p.durab, '#4C7FE0', 90) : ''}</div><span class="etq ${p.estado === 'vigente' ? 'amar' : p.estado === 'consolidado' ? 'verde' : 'rojo'}">${p.estado}</span>${p.estado === 'vigente' ? btn('reforzarPacto', { pacto: p.id }, 'Reforzar') : ''}</div>`).join('')}</div></div>` : ''}
          ${hist.length ? `<div class="tarjeta"><h3>Mesas cerradas</h3><div class="lista">${hist.map(m => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(m.titulo)}</b><span>${U.fmtT(m.t1)}</span></div><span class="etq ${m.estado === 'acuerdo' ? 'verde' : 'rojo'}">${m.estado}</span></div>`).join('')}</div></div>` : ''}</div>
        <div class="col">${sel ? detalle(E, sel) : '<div class="tarjeta vacio">Abre una mesa para empezar a negociar.</div>'}</div></div>`;
      el.onclick = e => { const x = e.target.closest('[data-mesa]'); if (x) { E.ui.mesaSel = x.dataset.mesa; C.App.refrescar(); } };
    }
  };
  C.Bus.on('ui:accion', ({ id, r }) => { const E = C.E; if (id === 'abrirMesa' && r && r.mesa && E) E.ui.mesaSel = r.mesa; });
})(window.CURUL);
