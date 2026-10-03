/* Modelo económico: propiedad pública por sector, medidas radicales (por ley, decreto o negociadas) e indicadores. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  const col = v => v >= 62 ? '#3FBF7A' : v >= 40 ? '#E8A33D' : '#E0504A';
  const colM = v => v <= 25 ? '#3FBF7A' : v <= 50 ? '#E8A33D' : '#E0504A';
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || col(v)}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const vias = E => { const Mo = C.Modelo, out = [['ley', '📜 Por ley (Congreso)']]; if (E.gobierno.presidente === 'J') { out.push(['mesa', '🪑 Negociando con el sector']); if (Mo.puedeDecretar(E)) out.push(['decreto', '✍ Por decreto']); } return out.map(([k, n]) => `<option value="${k}">${n}</option>`).join(''); };

  const tabSectores = E => {
    const Mo = C.Modelo, m = Mo.asegurar(E), S = C.DATA.modelo.SECTORES, pres = E.gobierno.presidente === 'J', v = vias(E);
    return `<div class="tarjeta"><h3>🏭 Propiedad pública por sector</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Barra: % en manos del Estado. «Eficiencia» compara lo público con lo privado: la luna de miel de una estatización se agota; la privatización duele al principio y rinde después.</div>
      <table class="tabla"><thead><tr><th>Sector</th><th>Estatal</th><th>Meta</th><th>Efic. pública</th><th>Efic. privada</th><th>Medida</th></tr></thead><tbody>${Object.entries(S).map(([k, s]) => { const x = m.sec[k]; return `<tr><td><b>${s.icono} ${esc(s.n)}</b>${Math.abs(x.meta - x.S) > 0.5 ? ` <span class="etq amar">${x.meta > x.S ? 'estatizando' : 'privatizando'}</span>` : ''}</td><td>${barra(x.S, '#4C7FE0', 90)}</td><td class="num">${Math.round(x.meta)}</td><td>${barra(x.ef, col(x.ef), 70)}</td><td>${barra(x.efp, col(x.efp), 70)}</td>
        <td><div class="fila accion-form" style="gap:4px;flex-wrap:nowrap"><select data-arg="medida" style="max-width:150px"><option value="nacionalizar:${k}">Nacionalizar</option><option value="privatizar:${k}">Privatizar</option></select><select data-arg="via" style="max-width:150px">${v}</select>${UI.botonAccion('ejecutarMedida', { medida: 'nacionalizar:' + k, via: 'ley' }, 'Ir', 'chico')}${pres && x.S > 25 ? UI.botonAccion('reorganizarSector', { sector: k }, '🛠', 'chico') : ''}</div></td></tr>`; }).join('')}</tbody></table></div>`;
  };

  const tabMedidas = E => {
    const Mo = C.Modelo, m = Mo.asegurar(E), esp = Object.entries(C.DATA.modelo.ESPECIALES), v = vias(E), F = m.flags;
    const act = [F.cc && 'control cambiario', F.cp && 'control de precios', F.dol && 'dolarizada', F.mor && 'moratoria de la deuda', F.terapia && 'terapia de choque'].filter(Boolean);
    return `<div class="tarjeta"><h3>🧨 Medidas de choque</h3>${act.length ? `<div class="fila" style="gap:6px;margin-bottom:8px">${act.map(a => `<span class="etq amar">${a}</span>`).join('')}</div>` : ''}<div class="grid g2">${esp.map(([k, d]) => { const dis = (k === 'controlCambio' && F.cc) || (k === 'liberarCambio' && !F.cc) || (k === 'controlPrecios' && F.cp) || (k === 'liberarPrecios' && !F.cp) || (k === 'dolarizar' && F.dol) || (k === 'moratoria' && F.mor); return `<div class="tarjeta" style="opacity:${dis ? 0.45 : 1}"><b>${d.icono} ${esc(d.n)}</b><div class="tenue" style="font-size:12px;margin:4px 0 8px">${esc(d.txt)}</div>${dis ? '<span class="etq">Ya en vigor / no aplica</span>' : `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="via">${v}</select>${UI.botonAccion('ejecutarMedida', { medida: k, via: 'ley' }, 'Ejecutar', 'chico')}</div>`}</div>`; }).join('')}</div></div>
      ${m.decretos.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Decretos económicos</h3><div class="lista">${m.decretos.slice(-6).reverse().map(d => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(Mo.def(d.medida).n)}</b><span>${U.fmtT(d.t)}</span></div><span class="etq ${d.estado === 'tumbado' ? 'rojo' : d.estado === 'avalado' ? 'verde' : 'amar'}">${d.estado}</span></div>`).join('')}</div></div>` : ''}`;
  };

  const tabIndicadores = E => {
    const Mo = C.Modelo, m = Mo.asegurar(E), I = m.ind, S = E.series;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>📊 Termómetro del modelo</h3><div class="fila" style="margin-bottom:8px"><span class="etq oro" style="font-size:14px">${esc(Mo.etiqueta(E))}</span></div>
        ${fila('Confianza de los inversionistas', barra(I.confInv))}${fila('Fuga de capitales', barra(I.fuga, colM(I.fuga)))}${fila('Escasez de bienes', barra(I.escasez, colM(I.escasez)))}${fila('Prima del dólar paralelo', barra(I.paralelo, colM(I.paralelo)))}${fila('Sanciones y aislamiento', barra(I.sanciones, colM(I.sanciones)))}
        <div class="tenue" style="font-size:12px;margin-top:8px">Las medidas radicales asustan a los inversionistas, disparan la fuga y el mercado paralelo, y pueden traer sanciones. Con el tiempo todo se reacomoda… o se rompe.</div></div>
        ${m.hist.length ? `<div class="tarjeta"><h3>Crónica del modelo</h3><div class="lista">${m.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : ''}</div>
      <div class="col"><div class="tarjeta"><h3>Confianza de los inversionistas</h3>${G.linea([{ nombre: 'Confianza', color: '#6CC4F5', datos: S['modelo:confInv'] || [] }], { alto: 150, min: 0, max: 100, ref: 55 })}</div>
        <div class="tarjeta"><h3>Estatismo (cambio desde el punto de partida)</h3>${G.linea([{ nombre: 'Estatismo', color: '#D9B45A', datos: S['modelo:estatismo'] || [] }], { alto: 150, min: -40, max: 60, ref: 0 })}</div></div></div>`;
  };

  const TABS = [['sectores', 'Sectores', tabSectores], ['medidas', 'Medidas de choque', tabMedidas], ['indicadores', 'Termómetro', tabIndicadores]];
  C.Pantallas.modelo = {
    render(el, params) {
      const E = C.E; C.Modelo.asegurar(E);
      const tab = (params && params.tab) || E.ui.modTab || 'sectores'; E.ui.modTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Modelo económico</h1><div class="sub">Nacionalizar a lo Chávez, privatizarlo todo o quedarse en el medio: cada decisión tiene luna de miel, costo y consecuencias.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('modelo', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
