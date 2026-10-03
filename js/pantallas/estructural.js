/* Deuda y FMI, bonanzas, tierras y corrupción sistémica (Fase 46). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || '#4C7FE0'}"></i></div><b class="num" style="min-width:28px">${Math.round(v)}</b></div>`;
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const btn = (id, args, txt, cl) => UI.botonAccion(id, args || {}, txt || null, cl || 'chico');
  const sel = (arg, opts) => `<select data-arg="${arg}">${opts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>`;
  const vacio = t => `<div class="tenue" style="font-size:13px">${t}</div>`;
  const lista = (arr, fn) => arr.length ? `<div class="lista">${arr.map(fn).join('')}</div>` : '';
  const G = C.Graf;

  const tabDeuda = E => {
    const De = C.Deuda, d = De.asegurar(E), Ec = E.economia, f = d.fmi;
    const fmi = f ? `<div class="resultado-jugador ${f.suspendido ? 'mal' : 'ok'}"><div style="font-size:24px">🏦</div><div><b>Programa con el FMI ${f.suspendido ? '(desembolsos suspendidos)' : 'vigente'}</b><div class="tenue" style="font-size:12.5px">${E.fecha.t - f.desde} de ${f.dur} semanas</div></div></div>${lista(f.cond, c => `<div class="it"><div class="cuerpo">${esc(De.COND[c.k].n)}</div>${c.cumplida ? '<span class="etq verde">cumplida</span>' : btn('cumplirCondicionFMI', { cond: c.k }, 'Cumplir')}</div>`)}` : vacio('Sin programa con el FMI.');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>📉 Deuda y riesgo país</h3>${fila('Deuda pública', `<b>${U.d1(Ec.deuda)} % del PIB</b>`)}${fila('Déficit', `<b>${U.d1(Ec.deficit)} % del PIB</b>`)}${fila('Riesgo país', barra(d.riesgo, d.riesgo > 60 ? '#E0504A' : '#E8A33D'))}${fila('Reservas internacionales', barra(d.reservas, '#3FBF7A'))}${d.crisis ? '<div class="etq rojo">Crisis de deuda en curso</div>' : ''}
        ${G && E.series['deuda:riesgo'] ? G.linea([{ nombre: 'Riesgo país', color: '#E0504A', datos: E.series['deuda:riesgo'] }], { alto: 110, min: 0, max: 100 }) : ''}<div style="margin-top:8px">${btn('pedirFMI', {}, 'Pedir rescate al FMI', 'prim')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>Programa del FMI</h3>${fmi}</div>${d.hist.length ? `<div class="tarjeta"><h3>Crónica</h3>${lista(d.hist.slice(0, 6), h => `<div class="it"><div class="cuerpo">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(h.t)}</div></div></div>`)}</div>` : ''}</div></div>`;
  };
  const tabBonanza = E => {
    const De = C.Deuda, d = De.asegurar(E), b = d.bonanza, B = b && De.BONANZAS[b.tipo];
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>${B ? B.icono : '💰'} Bonanzas</h3>${b ? `${fila('Bonanza', `<b>${esc(B.n)}</b>`)}${fila('Fase', `<span class="etq ${b.fase === 'auge' ? 'verde' : 'rojo'}">${b.fase === 'auge' ? 'auge' : 'caída (enfermedad holandesa)'}</span>`)}${b.fase === 'auge' ? fila('Termina en', `<b>${Math.max(0, b.dur - (E.fecha.t - b.t0))} semanas</b>` ) : ''}` : vacio('No hay bonanza en curso. Aparecen con el café, el petróleo, la coca o el oro.')}${fila('Fondo de estabilización', barra(d.fondo, '#6CC4F5'))}
      <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('ahorrarBonanza', {}, 'Ahorrar en el fondo')}${btn('gastarBonanza', {}, 'Gastar la bonanza')}</div><div class="tenue" style="font-size:12px;margin-top:8px">Un fondo lleno amortigua la caída; gastarlo todo trae aplausos hoy y una crisis mañana.</div></div></div></div>`;
  };
  const tabTierras = E => {
    const k = C.Tierras.asegurar(E), ag = C.Movilizacion ? C.Movilizacion.actor(E, 'agrario').descontento : 0;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🌾 Tierra y conflicto rural</h3>${fila('Concentración de la tierra (Gini)', `<b>${k.gini.toFixed(2)}</b>`)}${fila('Despojo pendiente', barra(k.despojo, '#E0504A'))}${fila('Conflicto agrario', barra(k.conflicto, '#E8A33D'))}${fila('Descontento del movimiento agrario', barra(ag, '#E8A33D'))}${fila('Procesos de restitución', `<b>${k.restitucion}</b>`)}${fila('Baldíos titulados', `<b>${k.titulada}</b>`)}</div></div>
      <div class="col"><div class="tarjeta"><h3>Política de tierras</h3><div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${sel('modo', [['expropiar', 'Expropiar latifundios'], ['comprar', 'Comprar tierras'], ['baldios', 'Titular baldíos']])}${btn('reformaAgraria', { modo: 'expropiar' }, 'Reforma agraria', 'prim')}</div><div>${btn('restituirTierras', {}, 'Restituir tierras a las víctimas')}</div></div></div></div>`;
  };
  const tabCorr = E => {
    const Co = C.Corrupcion, c = Co.asegurar(E), vis = c.casos.filter(k => k.fase !== 'oculto');
    const FASES = { denunciado: 'Denunciado', investigacion: 'En investigación', juicio: 'En juicio', condena: 'Condena', impune: 'Impune', archivado: 'Archivado' };
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🍯 Corrupción sistémica</h3>${fila('Índice de corrupción', barra(c.indice, c.indice > 55 ? '#E0504A' : '#E8A33D'))}${fila('Independencia de la Fiscalía', barra(Co.indepFiscal(E), '#3FBF7A'))}${fila('Casos ocultos sin destapar', `<b>${c.casos.filter(k => k.fase === 'oculto').length ? 'hay' : 'ninguno conocido'}</b>`)}
      <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('repartirMermelada', {}, 'Repartir mermelada')}${sel('modo', [['encubrir', 'Blindar casos que me tocan'], ['respaldar', 'Respaldar a la Fiscalía']])}${btn('presionarFiscalia', { modo: 'respaldar' }, 'Influir en la Fiscalía')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>Casos (${vis.length})</h3>${lista(vis.slice(0, 10), k => `<div class="it"><div class="cuerpo"><b>${esc(k.n)}</b> ${k.gob ? '<span class="etq amar">toca al Gobierno</span>' : ''} ${k.prot ? '<span class="etq rojo">blindado</span>' : ''}<div class="tenue" style="font-size:12px">${k.monto.toLocaleString('es-CO')} millones · ${esc(FASES[k.fase] || k.fase)}${k.culpable ? ' · ' + esc(k.culpable) : ''}</div></div></div>`) || vacio('Todavía no hay escándalos denunciados.')}</div></div></div>`;
  };
  const TABS = [['deuda', '📉 Deuda y FMI', tabDeuda], ['bonanza', '💰 Bonanzas', tabBonanza], ['tierras', '🌾 Tierras', tabTierras], ['corr', '🍯 Corrupción', tabCorr]];
  C.Pantallas.estructural = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.esTab || 'deuda'; E.ui.esTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Deuda, tierras y corrupción</h1><div class="sub">Crisis de deuda y FMI, bonanzas y enfermedad holandesa, conflicto por la tierra y corrupción sistémica.</div></div></div><div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('estructural', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
