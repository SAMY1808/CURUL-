/* Mi departamento: mapa con municipios y subregiones, alcaldes, economía regional, seguridad, Asamblea y Nación,
   plan de desarrollo, ranking y bitácora del gobernador. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const Gb = () => C.Gobernacion, GD = () => C.DATA.gobernacion;
  const col = v => v >= 62 ? '#3FBF7A' : v >= 42 ? '#E8A33D' : '#E0504A';
  const colM = v => v <= 25 ? '#3FBF7A' : v <= 50 ? '#E8A33D' : '#E0504A';
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 120}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || col(v)}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const PAL = ['#4C7FE0', '#D9B45A', '#9b7ad6', '#3FBF7A', '#E0504A', '#4FB0B8'];
  const bbCache = {};
  const bbox = code => { if (bbCache[code]) return bbCache[code]; const m = C.DATA.municipios[code]; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, r; const re = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g; while ((r = re.exec(m.d))) { const x = +r[1], y = +r[2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return bbCache[code] = [x0, y0, x1, y1]; };
  const btn = (id, args, txt) => UI.botonAccion(id, args || {}, txt || null, 'chico');

  const mapa = (E, capa) => {
    const v = Gb().vida(E), d = Gb().depto(E), codes = Object.keys(v.munis), subDe = {}; v.subs.forEach((s, i) => s.munis.forEach(c => subDe[c] = i));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const c of codes) { const b = bbox(c); x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
    const w0 = Math.max(x1 - x0, 30), h0 = Math.max(y1 - y0, 24), pad = Math.max(w0, h0) * 0.06, X = x0 - pad, Y = y0 - pad, W = w0 + pad * 2, H = h0 + pad * 2, sel = E.ui.depMuni;
    const mx = Math.max(...codes.map(c => C.DATA.municipios[c].pob)), fs = W / 70;
    let s = `<svg viewBox="${X.toFixed(1)} ${Y.toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}" style="width:100%;height:auto;max-height:600px;display:block;background:#0b1424;border-radius:10px">`;
    for (const c of codes) {
      const m = C.DATA.municipios[c], st = v.munis[c], sb = v.subs[subDe[c]];
      let fill = PAL[subDe[c] % PAL.length];
      if (capa === 'afin') fill = st.estado === 'rebelde' ? '#8b1a1a' : col(st.afin);
      else if (capa === 'amenaza') fill = colM(sb.amenaza);
      else if (capa === 'pob') { const t = U.clamp(Math.log10(Math.max(1, m.pob)) / Math.log10(Math.max(10, mx)), 0, 1); fill = `hsl(${Math.round(210 - t * 170)},60%,${Math.round(26 + t * 24)}%)`; }
      const tt = `<b>${esc(m.n)}</b><br>${U.n(m.pob)} habitantes<br>Subregión ${esc(sb.nombre)}<br>Alcalde: ${esc(st.alcalde.nombre)} (${esc(E.partidos[st.alcalde.partido] ? E.partidos[st.alcalde.partido].sigla : '')})<br>Afinidad contigo: ${Math.round(st.afin)}${st.estado === 'rebelde' ? ' · <b>REBELDE</b>' : ''}`;
      s += `<path data-muni="${c}" d="${m.d}" fill="${fill}" fill-opacity="0.9" stroke="${c === sel ? '#fff' : 'rgba(5,10,20,.7)'}" stroke-width="${c === sel ? (W / 220).toFixed(2) : (W / 900).toFixed(2)}" style="cursor:pointer"${UI.tt(tt)}/>`;
    }
    for (const sb of v.subs) s += `<text x="${sb.cx}" y="${sb.cy}" text-anchor="middle" style="font-size:${(fs * 1.3).toFixed(2)}px;font-weight:700;fill:#fff;paint-order:stroke;stroke:rgba(5,10,20,.9);stroke-width:${(fs * 0.3).toFixed(2)}px;pointer-events:none">${esc(sb.nombre)}</text>`;
    return s + '</svg>';
  };
  const ficha = (E, c) => {
    const v = Gb().vida(E), m = C.DATA.municipios[c], st = v.munis[c]; if (!st) return '';
    const sb = v.subs.find(x => x.munis.includes(c));
    return `<div class="tarjeta"><h3>📍 ${esc(m.n)}</h3><div class="tenue" style="font-size:12.5px">${U.n(m.pob)} habitantes · subregión ${esc(sb.nombre)}</div>
      ${fila('Alcalde', `<b>${esc(st.alcalde.nombre)}</b>`)}${fila('Partido', esc(E.partidos[st.alcalde.partido] ? E.partidos[st.alcalde.partido].sigla : '—'))}${fila('Afinidad contigo', barra(st.afin))}${fila('Convenios', `<b class="num">${st.obras}</b>`)}${st.estado === 'rebelde' ? '<div class="etq rojo" style="margin:4px 0">En rebeldía</div>' : ''}
      <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('visitarMunicipio', { code: c })}${btn('convenioMunicipio', { code: c })}${btn('castigarMunicipio', { code: c })}</div></div>`;
  };

  const tabResumen = E => {
    const v = Gb().vida(E), d = Gb().depto(E), p = v.pdd, ult = p.evals[0];
    const mes = GD() && Gb().MESES[Gb().mesFeria(E)];
    return `<div class="grid g4">
      <div class="kpi"><span class="l">Confianza regional</span><span class="v" style="color:${col(v.animo)}">${Math.round(v.animo)}</span><span class="d">${v.racha >= 39 ? '🔥 departamento contento' : v.racha <= -26 ? '⚠ inconforme' : 'racha ' + v.racha}</span></div>
      <div class="kpi"><span class="l">Caja de libre disposición</span><span class="v">$${U.n(Math.round(v.caja * 1000))} M</span><span class="d">se recarga cada semana</span></div>
      <div class="kpi"><span class="l">Alcaldes contigo</span><span class="v" style="color:${col(v.afinMedia)}">${Math.round(v.afinMedia)}</span><span class="d">${Object.values(v.munis).filter(m => m.estado === 'rebelde').length} en rebeldía</span></div>
      <div class="kpi"><span class="l">Aspiración presidencial</span><span class="v">${Math.round(v.presidenciable)}</span><span class="d">feria en ${mes}</span></div></div>
      <div class="grid g2" style="margin-top:14px"><div class="col">
        <div class="tarjeta"><h3>📋 Plan de desarrollo departamental</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Metas a 4 años elegidas según tus mayores rezagos. Se evalúan cada año.</div>
          ${p.metas.map(m => { const M = GD().METAS[m.id], cur = d[m.ind], prog = U.clamp((cur - m.base) / m.meta * 100, 0, 140); return fila(`${esc(M.n)} <span class="tenue">(${U.d1(m.base)} → ${U.d1(m.base + m.meta)})</span>`, barra(Math.min(100, prog), col(prog))); }).join('')}
          ${ult ? `<div class="tenue" style="font-size:12px;margin-top:6px">Última evaluación (${ult.anio}): <b>${ult.score} %</b></div>` : ''}</div>
        <div class="tarjeta"><h3>🏆 Ranking de gobernadores</h3>${v.rank ? `<div class="tenue" style="font-size:12px;margin-bottom:6px">${v.rank.anio}: puesto <b>${v.rank.puesto}</b> de ${v.rank.total}</div><div class="lista">${v.rank.lista.map((x, i) => `<div class="it" ${x.yo ? 'style="background:rgba(217,180,90,.12)"' : ''}><div class="cuerpo"><b>${i + 1}. ${esc(x.nombre)}</b></div><span class="num">${Math.round(x.p)}</span></div>`).join('')}</div>` : '<div class="tenue">Cada diciembre se publica el ranking. Los cinco primeros ganan fama nacional y empujan una candidatura presidencial.</div>'}</div></div>
      <div class="col"><div class="tarjeta"><h3>🎯 Acciones rápidas</h3><div class="fila" style="gap:6px;flex-wrap:wrap">${btn('consejoAlcaldes')}${btn('campanaRegional')}${btn('desayunoAsamblea')}${btn('lanzarPresidenciable')}${btn('alertaTemprana')}${btn('gestionarCONPES')}${btn('presionarNacion')}</div></div>
        ${v.hist.length ? `<div class="tarjeta"><h3>Bitácora</h3><div class="lista">${v.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };

  const tabMapa = E => {
    const v = Gb().vida(E), capa = E.ui.depCapa || 'sub', sel = E.ui.depMuni;
    const chips = [['sub', 'Subregiones'], ['afin', 'Afinidad de alcaldes'], ['amenaza', 'Amenaza armada'], ['pob', 'Población']].map(([k, n]) => `<button data-capa="${k}" class="${k === capa ? 'activo' : ''}">${n}</button>`).join('');
    return `<div class="seg" style="margin-bottom:10px">${chips}</div><div class="grid g2" style="grid-template-columns:2fr 1fr"><div>${mapa(E, capa)}</div><div class="col">${sel ? ficha(E, sel) : '<div class="tarjeta"><div class="tenue">Haz clic en un municipio para ver a su alcalde y actuar.</div></div>'}
      <div class="tarjeta"><h3>Subregiones</h3>${v.subs.map((s, i) => `<div class="fila" style="justify-content:space-between;margin:4px 0"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${PAL[i % PAL.length]};margin-right:6px"></i>${esc(s.nombre)}</span><span class="tenue" style="font-size:12px">${s.munis.length} mpios${s.provincia ? ' · provincia' : ''}</span></div>`).join('')}</div></div></div>`;
  };

  const tabAlcaldes = E => {
    const v = Gb().vida(E), ms = Object.entries(v.munis).map(([c, m]) => ({ c, m, mu: C.DATA.municipios[c] })).sort((a, b) => b.mu.pob - a.mu.pob);
    return `<div class="tarjeta"><h3>🤝 Alcaldes del departamento</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Cuanto mayor la afinidad, más cooperan; por debajo de 14 un alcalde puede declararse en rebeldía.</div>
      <table class="tabla"><thead><tr><th>Municipio</th><th>Alcalde</th><th>Part.</th><th>Hab.</th><th>Afinidad</th><th></th></tr></thead><tbody>${ms.slice(0, 40).map(({ c, m, mu }) => `<tr><td><b>${esc(mu.n)}</b>${m.estado === 'rebelde' ? ' <span class="etq rojo">rebelde</span>' : ''}</td><td>${esc(m.alcalde.nombre)}</td><td>${E.partidos[m.alcalde.partido] ? esc(E.partidos[m.alcalde.partido].sigla) : '—'}</td><td class="num">${U.n(mu.pob)}</td><td>${barra(m.afin, null, 80)}</td><td>${btn('convenioMunicipio', { code: c }, 'Convenio')}${btn('visitarMunicipio', { code: c }, 'Visitar')}</td></tr>`).join('')}</tbody></table>${ms.length > 40 ? `<div class="tenue" style="font-size:12px;margin-top:6px">Se muestran los 40 municipios más poblados de ${ms.length}.</div>` : ''}</div>`;
  };

  const tabEconomia = E => {
    const v = Gb().vida(E), d = Gb().depto(E), S = GD().SECTORES, sec = Object.entries(v.eco.sectores);
    const opts = sec.map(([k]) => `<option value="${k}">${S[k][1]} ${S[k][0]}</option>`).join('');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🏭 Economía regional</h3>${sec.map(([k, val]) => fila(`${S[k][1]} ${S[k][0]}`, barra(val))).join('')}${fila('Desempleo', `<b class="num">${U.d1(d.desempleo)} %</b>`)}${fila('Pobreza', `<b class="num">${U.d1(d.pobreza)} %</b>`)}
        <div class="tenue" style="font-size:12px;margin-top:8px">Cada departamento tiene su vocación; un shock (plaga, caída del petróleo, cierre de frontera) puede golpearla. Una economía fuerte sube tu caja y tu ánimo.</div></div></div>
      <div class="col"><div class="tarjeta"><h3>🚀 Apuestas de desarrollo</h3><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="sector">${opts}</select>${UI.botonAccion('atraerInversion', { sector: sec[0] ? sec[0][0] : '' }, 'Atraer inversión', 'chico')}${UI.botonAccion('apoyarGremio', { sector: sec[0] ? sec[0][0] : '' }, 'Apoyar gremio', 'chico')}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('zonaFranca')}</div></div></div></div>`;
  };

  const tabSeguridad = E => {
    const v = Gb().vida(E);
    return `<div class="tarjeta"><h3>🛡 Seguridad por subregión</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">La amenaza armada la determinan los grupos con presencia en el departamento y tu gestión. Menos es mejor.</div>
      <div class="lista">${v.subs.map(s => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(s.nombre)}</b><span>${s.munis.length} municipios · ${U.n(s.pob)} hab.</span></div>${barra(s.amenaza, colM(s.amenaza), 100)}<div class="fila" style="gap:6px;width:100%;margin-top:6px">${btn('consejoSeguridad', { sub: s.id }, 'Consejo de seguridad')}${btn('recompensaDep', { sub: s.id }, 'Recompensa')}${btn('pedirEjercito', { sub: s.id }, 'Pedir Ejército')}${btn('mesaComunidades', { sub: s.id }, 'Mesa con comunidades')}${btn('gobiernoTerritorio', { sub: s.id }, 'Gobierno en el territorio')}${btn('crearProvincia', { sub: s.id }, 'Crear provincia')}</div></div>`).join('')}</div></div>`;
  };

  const tabPolitica = E => {
    const v = Gb().vida(E), O = GD().ORDENANZAS, d = Gb().depto(E);
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🏛 Asamblea Departamental</h3>${fila('Relación con la Asamblea', barra(v.asamblea))}
        <div class="tenue" style="font-size:12px;margin:6px 0">Cada ordenanza se vota diputado por diputado. Con una Asamblea hostil, hasta lo bueno se hunde.</div>
        <div class="lista">${Object.entries(O).map(([k, T]) => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">${T.icono} ${esc(T.n)} ${v.ord.activas[k] ? '<span class="etq verde">vigente</span>' : ''}</b><span>${esc(T.txt)}</span></div>${UI.botonAccion('proponerOrdenanzaDep', { tipo: k }, 'Proponer', 'chico')}</div>`).join('')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>🦅 Nación y regiones</h3>${fila('Relación con el Gobierno Nacional', barra(v.nacion.rel))}
        ${v.rap ? `<div class="etq verde" style="margin:6px 0">${esc(v.rap.nombre)} · ${v.rap.miembros.length + 1} gobernaciones</div><div class="tenue" style="font-size:12px">Miembros: ${v.rap.miembros.map(id => esc(E.deptos[id].nombre)).join(', ')}. Cumbre cada seis meses con obras conjuntas.</div>` : '<div class="tenue" style="font-size:12px;margin:6px 0">Todavía no perteneces a una Región Administrativa y de Planificación (RAP).</div>'}
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('gestionarCONPES')}${btn('presionarNacion')}${v.rap ? btn('frenteComun') : btn('fundarRAP')}</div></div></div></div>`;
  };

  const TABS = [['resumen', 'Resumen', tabResumen], ['mapa', 'Mapa', tabMapa], ['alcaldes', 'Alcaldes', tabAlcaldes], ['economia', 'Economía', tabEconomia], ['seguridad', 'Seguridad', tabSeguridad], ['politica', 'Asamblea y Nación', tabPolitica]];
  C.Pantallas.departamento = {
    render(el, params) {
      const E = C.E;
      if (!Gb().esGob(E)) { el.innerHTML = `<div class="cab"><div><h1>Mi departamento</h1></div></div><div class="tarjeta vacio">Sólo disponible si eres gobernador.</div>`; return; }
      const d = Gb().depto(E); Gb().vida(E);
      const tab = (params && params.tab) || E.ui.depTab || 'resumen'; E.ui.depTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Gobernación de ${esc(d.nombre)}</h1><div class="sub">Subregiones, alcaldes, economía, seguridad, Asamblea y Nación: un departamento vivo.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('departamento', { tab: t.dataset.tab });
        if (e.target.closest('[data-accion], select, input')) return;
        const cp = e.target.closest('[data-capa]'); if (cp) { E.ui.depCapa = cp.dataset.capa; return C.App.refrescar(); }
        const mu = e.target.closest('[data-muni]'); if (mu) { E.ui.depMuni = mu.dataset.muni; return C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
