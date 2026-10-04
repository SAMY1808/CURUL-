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

  const capas = () => [['relacion', 'Relación con Colombia'], ['comercio', 'Comercio y TLC'], ['alianzas', 'Alianzas y tratados'], ['conflictos', 'Conflictos y guerras'], ['diaspora', 'Diáspora colombiana'], ['alineamiento', 'Alineamiento geopolítico'], ['regimen', 'Régimen político'], ['estabilidad', 'Estabilidad'], ['pib', 'Tamaño de la economía'], ['crecimiento', 'Crecimiento'], ['militar', 'Poder militar'], ['crisis', 'Crisis y guerras'], ['embajadas', 'Embajadas y consulados'], ['deuda', 'Deuda pública'], ['inflacion', 'Inflación'], ['desempleo', 'Desempleo'], ...C.DATA.bloques.map(b => ['bloque:' + b.id, 'Bloque: ' + b.n])];
  const M2 = () => C.MundoVivo;
  let TCACHE = null;
  const TRADE = E => {
    if (TCACHE && TCACHE.t === E.fecha.t) return TCACHE.v;
    const out = {}; try {
      const f = C.Comercio.flujos(E), mx = Math.max(1, ...C.DATA.sociosComercio.map(so => (f.expSocio[so.id] || 0) + (f.impSocio[so.id] || 0)));
      for (const so of C.DATA.sociosComercio) { const vv = (f.expSocio[so.id] || 0) + (f.impSocio[so.id] || 0), ac = E.comercio.acuerdos[so.id]; for (const id of so.paises) out[id] = { k: U.clamp(Math.sqrt(vv / mx) * (so.paises.length > 1 ? 0.75 : 1), 0.08, 1), tlc: !!(ac && ac.estado === 'vigente'), v: vv }; }
    } catch (e) { /* sin datos de comercio */ }
    TCACHE = { t: E.fecha.t, v: out }; return out;
  };
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
    if (capa === 'comercio') { const t = TRADE(E)[id]; return t ? (t.tlc ? `hsl(150,${Math.round(35 + t.k * 35)}%,${Math.round(24 + t.k * 26)}%)` : azul(t.k)) : '#2b3a5a'; }
    if (capa === 'alianzas') { const tr = st ? st.tratados : []; const b = M2().bloquesDe(id).some(x => x.m.includes('COL')); return tr.includes('defensa') && tr.includes('cooperacion') ? '#3FBF7A' : tr.includes('defensa') ? '#4C7FE0' : tr.length ? '#6aa8d8' : b ? '#7d6bb8' : '#2b3a5a'; }
    if (capa === 'conflictos') { const c = E.mundoVivo.conflictos.filter(x => x.a === id || x.b === id).sort((a, b) => b.t - a.t)[0]; return p.crisis ? '#B04AE0' : c ? (c.estado === 'guerra' ? '#E0504A' : c.estado === 'crisis' ? '#E8A33D' : '#8a7a3a') : '#2b3a5a'; }
    if (capa === 'diaspora') { const n = C.DATA.diaspora[id]; return n ? azul(U.clamp(Math.log10(n) / 3.6, 0.1, 1)) : '#2b3a5a'; }
    if (capa === 'deuda') return rampa(-M2().macro(id, p).deuda, -200, -25);
    if (capa === 'inflacion') return rampa(-Math.min(60, M2().macro(id, p).inflacion), -60, -1);
    if (capa === 'desempleo') return rampa(-M2().macro(id, p).desempleo, -25, -3);
    if (capa === 'crisis') return p.crisis ? (p.crisis.tipo === 'recesión' ? '#E8A33D' : '#E0504A') : p.estab < 30 ? '#8a5a2b' : '#36486e';
    if (capa === 'embajadas') { const e = E.exterior && E.exterior.embajadas[id]; return e && e.abierta ? '#D9B45A' : '#36486e'; }
    if (capa.startsWith('bloque:')) { const b = C.DATA.bloques.find(x => x.id === capa.slice(7)); return b.m.includes(id) ? b.color : '#33456b'; }
    return '#36486e';
  };

  const proj = id => { const F = C.DATA.formasMundo, c = C.DATA.coords[id]; return [(c[0] + 180) * F.K, (F.LAT0 - c[1]) * F.K]; };
  const tipTxt = (E, id) => { const p = MV().asegurar(E).paises[id], st = E.diplomacia.paises[id]; return `<b>${esc(MV().nombre(id))}</b><br>${p ? esc(MV().REG[p.regimen]) + ' · PIB ' + U.n(Math.round(p.pib)) + ' mil M USD' : ''}${st ? '<br>Relación ' + Math.round(st.relacion) + '%' : ''}${p && p.crisis ? '<br>⚠ ' + esc(p.crisis.tipo) : ''}`; };
  const mapaReal = E => {
    const F = C.DATA.formasMundo, capa = E.ui.mundoCapa || 'relacion', sel = E.ui.mundoSel || 'USA', v = MV().asegurar(E);
    let s = `<svg viewBox="0 0 ${F.W} ${F.H}" style="width:100%;height:auto;display:block;background:radial-gradient(ellipse at 50% 40%,#0f2038,#08111f);border-radius:10px">`;
    for (const id of F.neutro) if (F.p[id]) s += `<path d="${F.p[id]}" fill="#1b2740" stroke="#0b1424" stroke-width=".5"/>`;
    for (const id of Object.keys(v.paises)) {
      const p = v.paises[id], col = colorDe(E, id, capa), es = id === sel, cx = id === 'COL';
      if (F.p[id]) s += `<path data-pais="${id}" d="${F.p[id]}" fill="${col}" stroke="${es ? '#fff' : cx ? '#FCD116' : 'rgba(6,12,24,.75)'}" stroke-width="${es || cx ? 1.6 : .5}" stroke-linejoin="round" style="cursor:pointer"${UI.tt(tipTxt(E, id))}/>`;
      else if (C.DATA.coords[id]) { const [x, y] = proj(id); s += `<circle data-pais="${id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${es ? 5 : 3.6}" fill="${col}" stroke="${es ? '#fff' : 'rgba(6,12,24,.8)'}" stroke-width="${es ? 1.6 : .7}" style="cursor:pointer"${UI.tt(tipTxt(E, id))}/>`; }
    }
    const linea = (a, b, col, dash, w) => { if (!C.DATA.coords[a] || !C.DATA.coords[b]) return ''; const [x1, y1] = proj(a), [x2, y2] = proj(b), mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.hypot(x2 - x1, y2 - y1) * 0.18; return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${w || 1.4}" stroke-dasharray="${dash || ''}" opacity=".85" style="pointer-events:none"/>`; };
    if (capa === 'conflictos') for (const c of v.conflictos) s += linea(c.a, c.b, c.estado === 'guerra' ? '#ff5d55' : c.estado === 'crisis' ? '#ffb347' : '#b9a94d', c.estado === 'guerra' ? '' : '4 3', c.estado === 'guerra' ? 2.2 : 1.3);
    if (capa === 'alianzas') for (const [id, st] of Object.entries(E.diplomacia.paises)) for (const t of st.tratados) if (t !== 'comercio') s += linea('COL', id, t === 'defensa' ? '#6fa0ff' : '#7fe0aa', '', 1.2);
    if (capa === 'comercio') for (const [id, t] of Object.entries(TRADE(E))) if (t.k > 0.3 && id !== 'COL') s += linea('COL', id, t.tlc ? '#7fe0aa' : '#8fb5e8', '', 0.6 + t.k * 2);
    if (capa === 'embajadas' && E.exterior) for (const [id, e] of Object.entries(E.exterior.embajadas)) if (e.abierta && C.DATA.coords[id]) { const [x, y] = proj(id); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#fff" style="pointer-events:none"/>`; }
    return s + '</svg>';
  };
  const mapa = E => {
    if (C.DATA.formasMundo && (E.ui.mundoVista || 'mapa') === 'mapa') return mapaReal(E);
    return mapaCasillas(E);
  };
  const mapaCasillas = E => {
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
      ${emb && emb.abierta ? `<div class="tenue" style="font-size:12px;margin-top:4px">🏛 Embajada: ${emb.embajador ? esc(emb.embajador.nombre) + ' (calidad ' + emb.embajador.calidad + (emb.embajador.exp ? ', ' + Math.floor(emb.embajador.exp / 52) + ' años, prestigio ' + Math.round(emb.embajador.prestigio) : '') + ')' : 'sin embajador'}</div>` : ''}
      ${st && st.tratados.length ? `<div class="tenue" style="font-size:12px;margin-top:4px">📜 ${st.tratados.map(t => esc(D().TRATADOS[t])).join(' · ')}</div>` : ''}
      ${confl.map(c => `<div class="tenue" style="font-size:12px;margin-top:4px">⚔ ${esc(c.n)}: <b>${esc(c.estado)}</b> (${Math.round(c.t)})</div>`).join('')}${sanc ? '<div class="mal" style="font-size:12px;margin-top:4px">🚫 Bajo tus sanciones</div>' : ''}
      ${id !== 'COL' ? `<div class="fila" style="gap:5px;flex-wrap:wrap;margin-top:10px">${pres ? UI.botonAccion('cumbreBilateral', { pais: id }, null, 'chico') : ''}${(!emb || !emb.abierta) && C.Exterior.esGestor(E) ? UI.botonAccion('abrirEmbajada', { pais: id }, null, 'chico') : ''}${C.Visitas && C.Visitas.puede(E) === true ? `<button class="btn chico" data-visita="${id}">🛫 Planear visita</button>` : ''}${pres ? (sanc ? UI.botonAccion('levantarSanciones', { pais: id }, null, 'chico') : UI.botonAccion('sancionarPais', { pais: id }, null, 'chico peligro')) + UI.botonAccion('ayudaHumanitaria', { pais: id }, null, 'chico') : ''}</div>` : ''}</div>`;
  };

  const vistaMapa = E => {
    const capa = E.ui.mundoCapa || 'relacion', al = MV().alineamiento(E), v = MV().asegurar(E);
    const leyenda = { relacion: ['Baja', 'Alta', rampa(25, 25, 80), rampa(80, 25, 80)], estabilidad: ['Inestable', 'Estable', rampa(15, 15, 75), rampa(75, 15, 75)], crecimiento: ['Recesión', 'Boom', rampa(-3, -3, 6), rampa(6, -3, 6)], pib: ['Pequeña', 'Gigante', azul(0), azul(1)], militar: ['Débil', 'Potencia', 'hsl(28,30%,22%)', 'hsl(28,80%,54%)'], comercio: ['Poco comercio', 'Mucho (verde = TLC)', azul(0.1), azul(1)], diaspora: ['Pocos colombianos', 'Muchos', azul(0.1), azul(1)], deuda: ['Deuda alta', 'Deuda baja', rampa(-200, -200, -25), rampa(-25, -200, -25)], inflacion: ['Inflación alta', 'Estable', rampa(-60, -60, -1), rampa(-1, -60, -1)], desempleo: ['Desempleo alto', 'Bajo', rampa(-25, -25, -3), rampa(-3, -25, -3)] }[capa];
    const extra = { conflictos: [['#E0504A', 'Guerra'], ['#E8A33D', 'Crisis'], ['#8a7a3a', 'Latente'], ['#B04AE0', 'Crisis interna']], alianzas: [['#3FBF7A', 'Defensa + cooperación'], ['#4C7FE0', 'Defensa'], ['#6aa8d8', 'Cooperación'], ['#7d6bb8', 'Comparten bloque']] }[capa];
    return `<div class="fila" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap"><button class="btn chico" data-vista="${(E.ui.mundoVista || 'mapa') === 'mapa' ? 'casillas' : 'mapa'}">${(E.ui.mundoVista || 'mapa') === 'mapa' ? '▦ Casillas' : '🌍 Planisferio'}</button><label class="tenue" style="font-size:12px">Capa</label><select id="m-capa">${capas().map(([k, n]) => `<option value="${k}" ${k === capa ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        ${leyenda ? `<span class="tenue" style="font-size:11.5px;display:flex;align-items:center;gap:6px">${leyenda[0]} <i style="display:inline-block;width:90px;height:8px;border-radius:4px;background:linear-gradient(90deg,${leyenda[2]},${leyenda[3]})"></i> ${leyenda[1]}</span>` : extra ? extra.map(([c, n]) => `<span class="sigla"><i class="pto" style="background:${c}"></i>${n}</span>`).join('') : capa === 'alineamiento' ? Object.entries(COL_ALIN).map(([k, c]) => `<span class="sigla"><i class="pto" style="background:${c}"></i>${esc(MV().EJES[k])}</span>`).join('') : capa === 'regimen' ? Object.entries(COL_REG).map(([k, c]) => `<span class="sigla"><i class="pto" style="background:${c}"></i>${esc(MV().REG[k])}</span>`).join('') : ''}</div>
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
    const v = MV().asegurar(E), ord = E.ui.mundoOrden || 'pib', reg = E.ui.mundoReg || 'todas';
    const PC = f => f.p.pib / Math.max(0.05, f.p.pob) * 1000;
    const ORD = { pib: f => -f.p.pib, crec: f => -f.p.crec, pc: f => -PC(f), estab: f => -f.p.estab, militar: f => -f.p.militar, pob: f => -f.p.pob, rel: f => -(f.rel || 0), deuda: f => -f.p.deuda, inflacion: f => -f.p.inflacion, desempleo: f => -f.p.desempleo };
    const NOM = { pib: 'PIB', crec: 'crecimiento', pc: 'PIB per cápita', estab: 'estabilidad', militar: 'poder militar', pob: 'población', rel: 'relación', deuda: 'deuda pública', inflacion: 'inflación', desempleo: 'desempleo' };
    const todas = Object.entries(v.paises).map(([id, p]) => ({ id, p: MV().macro(id, p), rel: (E.diplomacia.paises[id] || {}).relacion, region: (D().pais(id) || { region: 'Suramérica' }).region })).sort((a, b) => ORD[ord](a) - ORD[ord](b));
    const rk = todas.findIndex(f => f.id === 'COL') + 1;
    const regiones = ['todas'].concat([...new Set(todas.map(f => f.region))].sort());
    const filas = todas.filter(f => reg === 'todas' || f.region === reg);
    const th = (k, n) => `<th data-ord="${k}" style="cursor:pointer;${ord === k ? 'color:var(--oro2)' : ''}">${n}${ord === k ? ' ▼' : ''}</th>`;
    const lim = E.ui.mundoTodos ? 200 : 40, col = (x, malo) => malo ? 'mal' : '';
    const media = k => U.prom(todas.map(f => f.p[k]));
    return `<div class="grid g4">${Comp.kpi('Puesto de Colombia', `${rk}<small class="tenue" style="font-size:15px">/${todas.length}</small>`, `<span class="tenue">por ${NOM[ord]}</span>`)}${Comp.kpi('Inflación media mundial', U.d1(media('inflacion')) + '%', '<span class="tenue">promedio de países</span>')}${Comp.kpi('Deuda media', Math.round(media('deuda')) + '%', '<span class="tenue">% del PIB</span>')}${Comp.kpi('Desempleo medio', U.d1(media('desempleo')) + '%', '<span class="tenue">promedio de países</span>')}</div>
      <div class="tarjeta" style="margin-top:14px"><div class="t-cab"><h3>Economía y poder comparados</h3><select id="m-reg">${regiones.map(r => `<option value="${r}" ${r === reg ? 'selected' : ''}>${r === 'todas' ? 'Todo el mundo' : esc(r)}</option>`).join('')}</select></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Haz clic en una columna para ordenar; clic en un país para ver su ficha en el mapa.</div>
      <div style="overflow-x:auto"><table class="tabla clic-filas"><thead><tr><th>#</th><th>País</th>${th('pib', 'PIB (mil M USD)')}${th('crec', 'Crec.')}${th('pc', 'PIB pc')}${th('deuda', 'Deuda %PIB')}${th('inflacion', 'Inflación')}${th('desempleo', 'Desempleo')}${th('estab', 'Estab.')}${th('militar', 'Militar')}${th('rel', 'Relación')}<th>Régimen</th></tr></thead><tbody>${filas.slice(0, lim).map(f => `<tr data-pais="${f.id}" class="${f.id === 'COL' ? 'sel' : ''}"><td>${todas.indexOf(f) + 1}</td><td><b>${esc(MV().nombre(f.id))}</b></td><td class="num">${U.n(Math.round(f.p.pib))}</td><td class="num ${col(0, f.p.crec < 0)}">${U.d1(f.p.crec)}%</td><td class="num">${U.n(Math.round(PC(f)))}</td><td class="num ${col(0, f.p.deuda > 100)}">${Math.round(f.p.deuda)}%</td><td class="num ${col(0, f.p.inflacion > 12)}">${U.d1(f.p.inflacion)}%</td><td class="num ${col(0, f.p.desempleo > 15)}">${U.d1(f.p.desempleo)}%</td><td class="num">${Math.round(f.p.estab)}</td><td class="num">${f.p.militar}</td><td class="num">${f.rel != null ? Math.round(f.rel) + '%' : '—'}</td><td class="tenue" style="font-size:12px">${esc(MV().REG[f.p.regimen])}</td></tr>`).join('')}</tbody></table></div>
      ${filas.length > 40 ? `<div style="margin-top:8px"><button class="btn chico" data-todos="1">${E.ui.mundoTodos ? 'Mostrar sólo los 40 primeros' : `Mostrar los ${filas.length} países`}</button></div>` : ''}</div>`;
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
      const rg = el.querySelector('#m-reg'); if (rg) rg.onchange = e => { E.ui.mundoReg = e.target.value; C.App.refrescar(); };
      const capa = el.querySelector('#m-capa'); if (capa) capa.onchange = e => { E.ui.mundoCapa = e.target.value; C.App.refrescar(); };
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('mundo', { tab: t.dataset.tab });
        if (e.target.closest('[data-accion]')) return;
        const td = e.target.closest('[data-todos]'); if (td) { E.ui.mundoTodos = !E.ui.mundoTodos; return C.App.refrescar(); }
        const vi0 = e.target.closest('[data-vista]'); if (vi0) { E.ui.mundoVista = vi0.dataset.vista; return C.App.refrescar(); }
        const o = e.target.closest('[data-ord]'); if (o) { E.ui.mundoOrden = o.dataset.ord; return C.App.refrescar(); }
        const b = e.target.closest('[data-bloque]'); if (b) { E.ui.mundoCapa = 'bloque:' + b.dataset.bloque; return C.App.ir('mundo', { tab: 'mapa' }); }
        const vi = e.target.closest('[data-visita]'); if (vi) { E.ui.visitaPais = vi.dataset.visita; return C.App.ir('diplomacia', { tab: 'visitas' }); }
        const p = e.target.closest('[data-pais]'); if (p) { E.ui.mundoSel = p.dataset.pais; if (tab === 'ranking') return C.App.ir('mundo', { tab: 'mapa' }); C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
