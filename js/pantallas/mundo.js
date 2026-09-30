/* Mapa mundial: casillas por país con capas (relación, alineamiento, régimen, estabilidad, economía, poder
   militar, crisis, embajadas y cada bloque), ficha del país, conflictos, bloques y ranking comparado. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const MV = () => C.MundoVivo, D = () => C.Diplomacia;
  const COLS = 46, FILAS = 23, CELDA = 24;
  const COL_ALIN = { occidente: '#4C7FE0', multipolar: '#E0504A', bolivariano: '#B58FE8' };
  const COL_REG = { democracia: '#3FBF7A', hibrido: '#E8C547', autoritario: '#E0504A', monarquia: '#B58FE8' };
  const rampa = (v, a, b) => { const t = U.clamp((v - a) / (b - a), 0, 1); return `hsl(${Math.round(t * 125)},62%,${Math.round(34 + t * 8)}%)`; };
  const azul = t => `hsl(212,${Math.round(30 + t * 40)}%,${Math.round(22 + t * 38)}%)`;
  let LAYOUT = null;

  /* Casillas: cada país va a la celda más cercana a su posición geográfica que esté libre. */
  const layout = () => {
    if (LAYOUT) return LAYOUT;
    const coords = C.DATA.coords, ocup = new Set(), out = {};
    const ideal = id => { const [lon, lat] = coords[id]; return [U.clamp((lon + 170) / 350 * (COLS - 1), 0, COLS - 1), U.clamp((78 - lat) / 133 * (FILAS - 1), 0, FILAS - 1)]; };
    const ids = Object.keys(coords).sort((a, b) => ((C.DATA.economias[b] || [0])[0]) - ((C.DATA.economias[a] || [0])[0]) || (a < b ? -1 : 1));
    for (const id of ids) {
      const [ix, iy] = ideal(id); let mejor = null, md = 1e9;
      for (let r = 0; r <= 8 && !mejor; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const cx = Math.round(ix) + dx, cy = Math.round(iy) + dy; if (cx < 0 || cy < 0 || cx >= COLS || cy >= FILAS || ocup.has(cx + ',' + cy)) continue;
        const d = Math.hypot(cx - ix, (cy - iy) * 1.1); if (d < md) { md = d; mejor = [cx, cy]; }
      }
      if (!mejor) mejor = [0, 0];
      ocup.add(mejor.join(',')); out[id] = mejor;
    }
    return LAYOUT = out;
  };

  const capas = () => [['relacion', 'Relación con Colombia'], ['alineamiento', 'Alineamiento geopolítico'], ['regimen', 'Régimen político'], ['estabilidad', 'Estabilidad'], ['pib', 'Tamaño de la economía'], ['crecimiento', 'Crecimiento'], ['militar', 'Poder militar'], ['crisis', 'Crisis y guerras'], ['embajadas', 'Embajadas y consulados'], ...C.DATA.bloques.map(b => ['bloque:' + b.id, 'Bloque: ' + b.n])];
  const colorDe = (E, id, capa) => {
    const v = MV().asegurar(E), p = v.paises[id], st = E.diplomacia.paises[id];
    if (id === 'COL') return '#FCD116';
    if (capa === 'relacion') return st ? rampa(st.relacion, 25, 80) : '#5d6c85';
    if (capa === 'alineamiento') { const a = MV().alin(id); return a ? COL_ALIN[a] : '#3a4a68'; }
    if (capa === 'regimen') return COL_REG[p.regimen];
    if (capa === 'estabilidad') return rampa(p.estab, 15, 75);
    if (capa === 'pib') return azul(U.clamp((Math.log10(Math.max(1, p.pib)) - 0.3) / 4, 0, 1));
    if (capa === 'crecimiento') return rampa(p.crec, -3, 6);
    if (capa === 'militar') return `hsl(28,${Math.round(30 + p.militar * 0.5)}%,${Math.round(22 + p.militar * 0.32)}%)`;
    if (capa === 'crisis') return p.crisis ? (p.crisis.tipo === 'recesión' ? '#E8A33D' : '#E0504A') : p.estab < 30 ? '#8a5a2b' : '#36486e';
    if (capa === 'embajadas') { const e = E.exterior && E.exterior.embajadas[id]; return e && e.abierta ? '#D9B45A' : '#36486e'; }
    if (capa.startsWith('bloque:')) { const b = C.DATA.bloques.find(x => x.id === capa.slice(7)); return b.m.includes(id) ? b.color : '#33456b'; }
    return '#36486e';
  };

  const mapa = E => {
    const capa = E.ui.mundoCapa || 'relacion', L = layout(), sel = E.ui.mundoSel || 'USA', v = MV().asegurar(E);
    let s = `<svg viewBox="0 0 ${COLS * CELDA} ${FILAS * CELDA}" style="width:100%;height:auto;display:block;background:#0b1424;border-radius:10px">`;
    for (const [id, [cx, cy]] of Object.entries(L)) {
      const p = v.paises[id], n = MV().nombre(id), st = E.diplomacia.paises[id];
      const tt = `<b>${esc(n)}</b><br>${p ? esc(MV().REG[p.regimen]) + ' · PIB ' + U.n(Math.round(p.pib)) + ' mil M USD' : ''}${st ? '<br>Relación ' + Math.round(st.relacion) + '%' : ''}${p && p.crisis ? '<br>⚠ ' + esc(p.crisis.tipo) : ''}`;
      s += `<g data-pais="${id}" style="cursor:pointer"${UI.tt(tt)}><rect x="${cx * CELDA + 1}" y="${cy * CELDA + 1}" width="${CELDA - 2}" height="${CELDA - 2}" rx="3" fill="${colorDe(E, id, capa)}" stroke="${id === sel ? '#fff' : id === 'COL' ? '#FCD116' : 'rgba(255,255,255,.08)'}" stroke-width="${id === sel ? 2 : 1}"/><text x="${cx * CELDA + CELDA / 2}" y="${cy * CELDA + CELDA / 2 + 2.6}" text-anchor="middle" style="font-size:9px;font-weight:700;fill:rgba(255,255,255,.88);pointer-events:none;letter-spacing:.02em">${id}</text></g>`;
    }
    return s + '</svg>';
  };

  const ficha = E => {
    const id = E.ui.mundoSel || 'USA', v = MV().asegurar(E), p = v.paises[id], st = E.diplomacia.paises[id]; if (!p) return '';
    const emb = E.exterior && E.exterior.embajadas[id], pres = E.gobierno.presidente === 'J', bl = MV().bloquesDe(id), al = MV().alin(id);
    const confl = v.conflictos.filter(c => c.a === id || c.b === id), sanc = v.sanciones[id];
    const relTxt = st ? `<span class="etq" style="background:${rampa(st.relacion, 25, 80)}33;color:${rampa(st.relacion, 25, 80)}">${Math.round(st.relacion)}%</span>` : '—';
    return `<div class="tarjeta"><div class="t-cab"><h3>${esc(MV().nombre(id))}</h3>${id !== 'COL' ? relTxt : '<span class="etq oro">Tu país</span>'}</div>
      <div class="tenue" style="font-size:12px;margin-bottom:8px">${esc((D().pais(id) || { region: 'Suramérica' }).region)} · ${esc(MV().REG[p.regimen])}${p.crisis ? ` · <b class="mal">${esc(p.crisis.tipo)}</b>` : ''}</div>
      <div class="tt-f"><span class="tenue">Gobierno</span><b>${esc(p.lider)} · ${esc(Comp.etiquetaIdeo(p.eco))}</b></div><div class="tt-f"><span class="tenue">PIB</span><b>${U.n(Math.round(p.pib))} mil M USD</b></div><div class="tt-f"><span class="tenue">Crecimiento</span><b class="${p.crec < 0 ? 'mal' : ''}">${U.d1(p.crec)} %</b></div><div class="tt-f"><span class="tenue">Población</span><b>${U.d1(p.pob)} M</b></div><div class="tt-f"><span class="tenue">PIB per cápita</span><b>${U.n(Math.round(p.pib / Math.max(0.05, p.pob) * 1000))} USD</b></div><div class="tt-f"><span class="tenue">Estabilidad</span><b>${Math.round(p.estab)}/100</b></div><div class="tt-f"><span class="tenue">Poder militar</span><b>${p.militar}/100</b></div>
      <div style="margin:8px 0">${bl.map(b => `<span class="etq" style="background:${b.color}33;color:${b.color};margin:0 4px 4px 0">${esc(b.n)}</span>`).join('') || '<span class="tenue" style="font-size:12px">Sin bloques</span>'}</div>
      ${al ? `<div class="tenue" style="font-size:12px">Eje: <b style="color:${COL_ALIN[al]}">${esc(MV().EJES[al])}</b></div>` : ''}
      ${emb && emb.abierta ? `<div class="tenue" style="font-size:12px;margin-top:4px">🏛 Embajada: ${emb.embajador ? esc(emb.embajador.nombre) + ' (calidad ' + emb.embajador.calidad + ')' : 'sin embajador'}</div>` : ''}
      ${st && st.tratados.length ? `<div class="tenue" style="font-size:12px;margin-top:4px">📜 ${st.tratados.map(t => esc(D().TRATADOS[t])).join(' · ')}</div>` : ''}
      ${confl.map(c => `<div class="tenue" style="font-size:12px;margin-top:4px">⚔ ${esc(c.n)}: <b>${esc(c.estado)}</b> (${Math.round(c.t)})</div>`).join('')}${sanc ? '<div class="mal" style="font-size:12px;margin-top:4px">🚫 Bajo tus sanciones</div>' : ''}
      ${id !== 'COL' ? `<div class="fila" style="gap:5px;flex-wrap:wrap;margin-top:10px">${pres ? UI.botonAccion('cumbreBilateral', { pais: id }, null, 'chico') : ''}${(!emb || !emb.abierta) && C.Exterior.esGestor(E) ? UI.botonAccion('abrirEmbajada', { pais: id }, null, 'chico') : ''}${C.Visitas && C.Visitas.puede(E) === true ? `<button class="btn chico" data-visita="${id}">🛫 Planear visita</button>` : ''}${pres ? (sanc ? UI.botonAccion('levantarSanciones', { pais: id }, null, 'chico') : UI.botonAccion('sancionarPais', { pais: id }, null, 'chico peligro')) + UI.botonAccion('ayudaHumanitaria', { pais: id }, null, 'chico') : ''}</div>` : ''}</div>`;
  };

  const vistaMapa = E => {
    const capa = E.ui.mundoCapa || 'relacion', al = MV().alineamiento(E), v = MV().asegurar(E);
    const leyenda = { relacion: ['Baja', 'Alta', rampa(25, 25, 80), rampa(80, 25, 80)], estabilidad: ['Inestable', 'Estable', rampa(15, 15, 75), rampa(75, 15, 75)], crecimiento: ['Recesión', 'Boom', rampa(-3, -3, 6), rampa(6, -3, 6)], pib: ['Pequeña', 'Gigante', azul(0), azul(1)], militar: ['Débil', 'Potencia', 'hsl(28,30%,22%)', 'hsl(28,80%,54%)'] }[capa];
    return `<div class="fila" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap"><label class="tenue" style="font-size:12px">Capa</label><select id="m-capa">${capas().map(([k, n]) => `<option value="${k}" ${k === capa ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        ${leyenda ? `<span class="tenue" style="font-size:11.5px;display:flex;align-items:center;gap:6px">${leyenda[0]} <i style="display:inline-block;width:90px;height:8px;border-radius:4px;background:linear-gradient(90deg,${leyenda[2]},${leyenda[3]})"></i> ${leyenda[1]}</span>` : capa === 'alineamiento' ? Object.entries(COL_ALIN).map(([k, c]) => `<span class="sigla"><i class="pto" style="background:${c}"></i>${esc(MV().EJES[k])}</span>`).join('') : capa === 'regimen' ? Object.entries(COL_REG).map(([k, c]) => `<span class="sigla"><i class="pto" style="background:${c}"></i>${esc(MV().REG[k])}</span>`).join('') : ''}</div>
      <div class="tarjeta" style="padding:10px">${mapa(E)}</div><div class="grid" style="margin-top:14px;grid-template-columns:1fr"><div class="col">${ficha(E)}
        <div class="tarjeta"><h3>Tu alineamiento</h3>${G.barrasH(Object.entries(al).map(([k, x]) => ({ etq: MV().EJES[k], v: x, color: COL_ALIN[k] })), { max: 100, marca: 50, fmt: x => Math.round(x) + '%', anchoEtq: '90px' })}<div class="tenue" style="font-size:11.5px;margin-top:6px">Relación media con los países de cada eje. Ser amigo de todos es difícil.</div></div>
        <div class="tarjeta"><h3>Noticias del mundo</h3><div class="lista">${v.historial.slice(0, 6).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400;font-size:12.5px">${esc(h.txt)}</b><span>${esc(U.fmtT(h.t))}</span></div></div>`).join('') || '<div class="tenue" style="font-size:12px">Sin novedades todavía.</div>'}</div></div></div></div>`;
  };

  const conflictos = E => {
    const v = MV().asegurar(E), pres = E.gobierno.presidente === 'J';
    return `<div class="tarjeta"><h3>Conflictos entre países</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">La tensión sube y baja sola. Si supera 88 puede estallar la guerra: se mueve el petróleo, se frena el mundo y te piden posición. Puedes ofrecer mediación.</div>
      <table class="tabla"><thead><tr><th>Conflicto</th><th>Estado</th><th style="width:26%">Tensión</th><th></th></tr></thead><tbody>${v.conflictos.slice().sort((a, b) => b.t - a.t).map(c => `<tr><td><b>${esc(c.n)}</b><div class="tenue" style="font-size:11px">${esc(MV().nombre(c.a))} · ${esc(MV().nombre(c.b))}</div></td><td><span class="etq ${c.estado === 'guerra' ? 'rojo' : c.estado === 'crisis' ? 'amar' : ''}">${esc({ latente: 'Latente', crisis: 'En crisis', guerra: 'Guerra' }[c.estado])}</span></td><td>${G.barrasH([{ etq: '', v: c.t, color: c.t > 80 ? 'var(--no)' : c.t > 60 ? 'var(--alerta)' : 'var(--tenue)' }], { max: 100, anchoEtq: '0px', anchoValor: '30px', fmt: x => Math.round(x) })}</td><td>${pres ? UI.botonAccion('mediarConflicto', { conflicto: c.id }, 'Mediar', 'chico') : ''}</td></tr>`).join('')}</tbody></table></div>`;
  };

  const bloques = E => {
    const al = MV().alineamiento(E);
    return `<div class="tarjeta"><h3>Alineamiento</h3>${G.barrasH(Object.entries(al).map(([k, x]) => ({ etq: MV().EJES[k], v: x, color: COL_ALIN[k] })), { max: 100, marca: 50, fmt: x => Math.round(x) + '%', anchoEtq: '100px' })}</div>
      <div class="grid g3" style="margin-top:14px">${C.DATA.bloques.map(b => { const rel = U.prom(b.m.filter(id => E.diplomacia.paises[id]).map(id => E.diplomacia.paises[id].relacion)), pib = U.suma(b.m.map(id => MV().pais(E, id).pib)), soy = C.DATA.bloques.find(x => x.id === b.id).m.includes('COL') || (E.diplomacia.organismos[b.id] && E.diplomacia.organismos[b.id].miembro);
        return `<div class="tarjeta" style="border-top:3px solid ${b.color}"><div class="t-cab"><h3>${esc(b.n)}</h3>${soy ? '<span class="etq oro">Colombia es miembro</span>' : ''}</div><div class="tenue" style="font-size:12px">${b.m.length} países · líder ${esc(MV().nombre(b.lider))} · PIB ${U.n(Math.round(pib))} mil M USD</div>${G.barrasH([{ etq: 'Relación', v: rel, color: rampa(rel, 25, 80) }], { max: 100, fmt: x => Math.round(x) + '%', anchoEtq: '65px' })}<div style="margin-top:6px"><button class="btn chico" data-bloque="${b.id}">Ver en el mapa</button></div></div>`; }).join('')}</div>`;
  };

  const ranking = E => {
    const v = MV().asegurar(E), ord = E.ui.mundoOrden || 'pib';
    const filas = Object.entries(v.paises).map(([id, p]) => ({ id, p, rel: (E.diplomacia.paises[id] || {}).relacion, pc: p.pib / Math.max(0.05, p.pob) * 1000 })).sort((a, b) => ({ pib: b.p.pib - a.p.pib, crec: b.p.crec - a.p.crec, pc: b.pc - a.pc, estab: b.p.estab - a.p.estab, militar: b.p.militar - a.p.militar, pob: b.p.pob - a.p.pob, rel: (b.rel || 0) - (a.rel || 0) }[ord]));
    const rk = filas.findIndex(f => f.id === 'COL') + 1;
    const th = (k, n) => `<th data-ord="${k}" style="cursor:pointer;${ord === k ? 'color:var(--oro2)' : ''}">${n}${ord === k ? ' ▼' : ''}</th>`;
    return `<div class="tarjeta"><h3>Economía y poder comparados</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Colombia ocupa el puesto ${rk} de ${filas.length} según «${{ pib: 'PIB', crec: 'crecimiento', pc: 'PIB per cápita', estab: 'estabilidad', militar: 'poder militar', pob: 'población', rel: 'relación' }[ord]}». Haz clic en una columna para ordenar.</div>
      <table class="tabla clic-filas"><thead><tr><th>#</th><th>País</th>${th('pib', 'PIB (mil M USD)')}${th('crec', 'Crec.')}${th('pob', 'Población')}${th('pc', 'PIB pc')}${th('estab', 'Estab.')}${th('militar', 'Militar')}${th('rel', 'Relación')}<th>Régimen</th></tr></thead><tbody>${filas.slice(0, 45).map((f, i) => `<tr data-pais="${f.id}" class="${f.id === 'COL' ? 'sel' : ''}"><td>${i + 1}</td><td><b>${esc(MV().nombre(f.id))}</b></td><td class="num">${U.n(Math.round(f.p.pib))}</td><td class="num ${f.p.crec < 0 ? 'mal' : ''}">${U.d1(f.p.crec)}%</td><td class="num">${U.d1(f.p.pob)} M</td><td class="num">${U.n(Math.round(f.pc))}</td><td class="num">${Math.round(f.p.estab)}</td><td class="num">${f.p.militar}</td><td class="num">${f.rel != null ? Math.round(f.rel) + '%' : '—'}</td><td class="tenue" style="font-size:12px">${esc(MV().REG[f.p.regimen])}</td></tr>`).join('')}</tbody></table></div>`;
  };

  const TABS = [['mapa', 'Mapa', vistaMapa], ['conflictos', 'Conflictos', conflictos], ['bloques', 'Bloques', bloques], ['ranking', 'Ranking', ranking]];
  C.Pantallas.mundo = {
    layout,
    render(el, params) {
      const E = C.E; MV().asegurar(E);
      const tab = (params && params.tab) || E.ui.mundoTab || 'mapa'; E.ui.mundoTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Mapa mundial</h1><div class="sub">193 países que cambian solos: elecciones, golpes, guerras y bloques. Cada casilla es un país.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div style="margin-top:14px">${cur[2](E)}</div>`;
      const capa = el.querySelector('#m-capa'); if (capa) capa.onchange = e => { E.ui.mundoCapa = e.target.value; C.App.refrescar(); };
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('mundo', { tab: t.dataset.tab });
        if (e.target.closest('[data-accion]')) return;
        const o = e.target.closest('[data-ord]'); if (o) { E.ui.mundoOrden = o.dataset.ord; return C.App.refrescar(); }
        const b = e.target.closest('[data-bloque]'); if (b) { E.ui.mundoCapa = 'bloque:' + b.dataset.bloque; return C.App.ir('mundo', { tab: 'mapa' }); }
        const vi = e.target.closest('[data-visita]'); if (vi) { E.ui.visitaPais = vi.dataset.visita; return C.App.ir('diplomacia', { tab: 'visitas' }); }
        const p = e.target.closest('[data-pais]'); if (p) { E.ui.mundoSel = p.dataset.pais; if (tab === 'ranking') return C.App.ir('mundo', { tab: 'mapa' }); C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
