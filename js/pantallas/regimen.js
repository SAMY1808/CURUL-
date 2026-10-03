/* Régimen político: termómetro del golpe, estado de la democracia, junta militar y transición. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const colR = v => v <= 30 ? '#3FBF7A' : v <= 55 ? '#E8A33D' : '#E0504A';
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 120}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || '#4C7FE0'}"></i></div><b class="num" style="min-width:30px">${Math.round(v)}</b></div>`;
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const btn = (id, args, txt, cl) => UI.botonAccion(id, args || {}, txt || null, cl || 'chico');
  C.Pantallas.regimen = {
    render(el) {
      const E = C.E, Rg = C.Regimen, r = Rg.asegurar(E), T = Rg.TIPOS[r.tipo], dem = Rg.democratico(E), pres = E.gobierno.presidente === 'J', j = r.junta;
      const fs = Rg.factores(E), R = Rg.riesgo(E);
      const estado = `<div class="tarjeta"><h3>${T[2]} ${esc(T[0])}</h3>
        ${fila('Libertades civiles', barra(r.libertad, r.libertad >= 55 ? '#3FBF7A' : '#E0504A'))}
        ${fila('Congreso', r.congreso ? '<span class="etq verde">en funciones</span>' : '<span class="etq rojo">disuelto</span>')}
        ${fila('Elecciones', r.elecciones ? '<span class="etq verde">vigentes</span>' : '<span class="etq rojo">suspendidas</span>')}
        ${fila('Golpes en la historia', `<b>${r.golpes}</b>`)}
        ${r.exilio ? '<div class="etq rojo">Estás en el exilio</div>' : ''}
        ${j ? `<h4 class="sub-h" style="margin:12px 0 6px">Junta de ${esc(j.nombre)}</h4>${fila('Legitimidad', barra(j.legit, j.legit >= 45 ? '#3FBF7A' : '#E0504A'))}${fila('Represión', barra(j.repres, '#E0504A'))}${fila('Resistencia civil', barra(j.resistencia, '#E8A33D'))}${fila('Aislamiento internacional', barra(j.aislamiento, '#9b7ad6'))}${fila('Censura', barra(j.censura, '#888'))}` : ''}
        ${r.transicion ? `<h4 class="sub-h" style="margin:12px 0 6px">Transición a la democracia</h4>${fila('Fase', `<span class="etq amar">${r.transicion.fase === 'apertura' ? 'Apertura y negociación' : 'Camino a las urnas'}</span>`)}${r.transicion.elecciones ? fila('Elecciones libres en', `<b>${Math.max(0, r.transicion.elecciones - E.fecha.t)} semanas</b>`) : ''}${r.transicion.tutela ? fila('Tutela militar pactada', barra(r.transicion.tutela, '#E8A33D')) : ''}` : ''}</div>`;
      const termo = dem ? `<div class="tarjeta"><h3>🌡 Termómetro del golpe</h3><div class="fila" style="gap:10px;align-items:center"><div style="font-size:30px;font-weight:800;color:${colR(R)}">${Math.round(R)}</div><div class="tenue" style="font-size:12.5px">${R < 30 ? 'Los cuarteles están tranquilos' : R < 55 ? 'Ruido de sables: hay que vigilar a los generales' : 'Peligro real de golpe de Estado'}</div></div>
        <div class="lista" style="margin-top:8px">${fs.filter(x => Math.abs(x[1]) >= 0.5).map(x => `<div class="it"><div class="cuerpo">${esc(x[0])}</div><b class="num" style="color:${x[1] > 0 ? '#E0504A' : '#3FBF7A'}">${x[1] > 0 ? '+' : ''}${U.d1(x[1])}</b></div>`).join('')}</div>
        ${r.consp ? `<div class="tenue" style="margin-top:8px">🗡 Tu conspiración avanza: ${Math.round(r.consp.avance)} %</div>` : ''}</div>` : '';
      const acc = [];
      if (dem && pres) acc.push(['Defender la democracia o torcerla', [['blindarFuerzas', null], ['purgarMilitares', null], ['capturarCorte', null], ['capturarControl', null], ['reformaReeleccion', null], ['autogolpeCongreso', null]]]);
      if (dem && !pres) acc.push(['Conspirar', [['conspirarGolpe', null], ['ejecutarGolpe', null], ['presionarGolpe', null]]]);
      if (!dem && pres && j && j.lider === 'J') acc.push(['Jefe de la junta', [['represionJunta', { nivel: 'subir' }, 'Más represión'], ['represionJunta', { nivel: 'bajar' }, 'Menos represión'], ['censuraJunta', null], ['propagandaJunta', null], ['obraPopulista', null], ['perseguirOpositores', null], ['constituyenteJunta', null], ['plebiscitoJunta', null], ['convocarTransicion', null]]]);
      if (!dem && !(pres && j && j.lider === 'J')) acc.push(['Bajo el régimen de facto', [['organizarResistencia', null], ['negociarTransicion', null], ['exiliarse', null], ['inscribirseTransicion', null]]]);
      const acciones = acc.map(([t, ids]) => `<div class="tarjeta"><h3>${t}</h3><div class="lista">${ids.map(([id, args, txt]) => { const a = C.Acciones.get ? C.Acciones.get(id) : null; return `<div class="it"><div class="cuerpo"><b>${a ? esc(a.nombre) : id}</b>${txt ? ' · ' + txt : ''}<div class="tenue" style="font-size:12px">${(() => { try { const d = a && a.disponible(E, args || {}); return d === true ? 'Disponible' : esc(d || ''); } catch (e) { return ''; } })()}</div></div>${btn(id, args || {}, txt || 'Ir')}</div>`; }).join('')}</div></div>`).join('');
      const marchas = `<div class="tarjeta"><h3>📣 Manifestaciones</h3><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Sacar a la gente a la calle mueve la opinión (o la resistencia contra un régimen), pero bajo una dictadura puede costar sangre.</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="tipo">${Object.entries(Rg.MARCHAS).map(([k, m]) => `<option value="${k}">${m[1]} ${esc(m[0])}</option>`).join('')}</select>${btn('convocarManifestacion', { tipo: 'contra' }, 'Convocar', 'prim')}</div>
        ${r.ultMarcha != null && E.fecha.t - r.ultMarcha < 3 ? '<div class="tenue" style="font-size:12px;margin-top:6px">Acabas de convocar una: espera unas semanas.</div>' : ''}</div>`;
      const el_ = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.id !== 'IND' && p.id !== 'MOV');
      const pol = `<div class="tarjeta"><h3>🎗 Partidos, golpistas y proscripciones</h3><div class="lista">${el_.map(p => { const g = (r.golpistas || []).some(x => x.pid === p.id); return `<div class="it"><div class="cuerpo"><b>${esc(p.nombre)}</b> ${p.proscrito ? '<span class="etq rojo">proscrito</span>' : ''} ${g ? '<span class="etq amar">presiona por un golpe</span>' : ''}<div class="tenue" style="font-size:12px">Popularidad ${U.d1(p.popularidad)} %</div></div>${p.proscrito ? btn('levantarProscripcion', { partido: p.id }, 'Levantar', 'chico') : btn('proscribirPartido', { partido: p.id }, 'Proscribir', 'chico')}</div>`; }).join('')}</div>${r.exiliados && r.exiliados.length ? `<div class="tenue" style="margin-top:8px">⛓ ${r.exiliados.length} opositores desterrados o presos.</div>` : ''}</div>`;
      const dic = `<div class="tarjeta"><h3>🎖 Dictaduras de la historia</h3>${(C.DATA.dictaduras || []).map(D => { const st = (r.hs || {})[D.id], e = st ? st.estado : 'espera'; const tag = r.dictadura && r.dictadura.id === D.id ? '<span class="etq rojo">en curso</span>' : e === 'fin' ? '<span class="etq">transcurrida</span>' : e === 'cancelada' ? '<span class="etq verde">evitada</span>' : '<span class="etq amar">en el calendario</span>'; return `<div style="margin-bottom:8px"><b>${D.icono} ${esc(D.nombre)}</b> ${tag}<div class="tenue" style="font-size:12.5px">${esc(D.desc)}</div></div>`; }).join('')}${(r.pasadas || []).length ? `<div class="tenue" style="font-size:12px">Regímenes de facto ya superados: ${(r.pasadas || []).map(x => esc(x.nombre)).join('; ')}.</div>` : ''}<div class="tenue" style="font-size:12px;margin-top:6px">Fuera de la historia, los golpes también ocurren al azar: más probables antes de 1991.</div></div>`;
      const mesa = E.mesas && E.mesas.activas.find(m => m.tipo === 'transicion');
      const hist = `<div class="tarjeta"><h3>Crónica del régimen</h3>${r.hist.length ? `<div class="lista">${r.hist.map(h => `<div class="it"><div class="cuerpo">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${esc(U.fmtT(h.t))}</div></div></div>`).join('')}</div>` : '<div class="tenue">Sin sobresaltos: la democracia aguanta.</div>'}</div>`;
      el.innerHTML = `<div class="cab"><div><h1>Régimen político</h1><div class="sub">Golpes de Estado, autogolpes, democraduras y el camino de regreso a la democracia.</div></div></div>
        <div class="grid g2"><div class="col">${estado}${termo}${mesa ? `<div class="tarjeta"><h3>🪑 Mesa de transición abierta</h3><div class="tenue">Se negocia el calendario electoral, la amnistía y las reglas del juego.</div><button class="btn chico" data-ir="mesas">Ir a la mesa</button></div>` : ''}</div><div class="col">${acciones}${marchas}${pol}${dic}${hist}</div></div>`;
      el.onclick = e => { const b = e.target.closest('[data-ir]'); if (b) C.App.ir(b.dataset.ir, mesa ? { mesa: mesa.id } : {}); };
    }
  };
})(window.CURUL);
