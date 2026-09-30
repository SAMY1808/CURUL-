/* Clima y recursos: El Niño / La Niña, embalses, alimentos, transición energética y migración. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const Cl = () => C.Clima;
  const aviso = E => Cl().puede(E) === true ? '' : '<div class="tenue" style="font-size:12px;margin-bottom:10px">Sólo el Presidente define estas políticas: aquí puedes ver cómo va todo.</div>';
  const graf = (E, clave, nombre, color, fmt) => { const s = (E.series[clave] || []).slice(-260); return `<div class="tarjeta"><h3>${nombre}</h3>${s.length > 2 ? G.linea([{ nombre, color, datos: s }], { alto: 140, fmt: fmt || (v => U.d1(v)), area: true }) : '<div class="vacio">Aún sin historia</div>'}</div>`; };

  const panorama = E => {
    const c = Cl().asegurar(E), f = c.fase, ico = f === 'nino' ? '☀' : f === 'nina' ? '🌧' : '🌤';
    const col = (v, ref, inv) => (inv ? v <= ref : v >= ref) ? 'bien' : 'mal';
    return `${aviso(E)}<div class="resultado-jugador ${f === 'neutro' ? 'ok' : 'no'}" style="margin-bottom:14px"><div style="font-size:28px">${ico}</div><div><b>Fase actual: ${Cl().nombreFase[f]}</b><div class="tenue">${f === 'nino' ? 'Sequía en el campo, menos agua en los embalses y alimentos más caros.' : f === 'nina' ? 'Lluvias intensas: daños en infraestructura y riesgo de inundaciones.' : 'Condiciones normales: embalses y precios tienden a estabilizarse.'} Índice ENSO: ${c.enso > 0 ? '+' : ''}${U.d1(c.enso)}</div></div></div>
      <div class="grid g4">${Comp.kpi('Embalses', Math.round(c.embalses) + '%', `<span class="${col(c.embalses, 40)}">${c.embalses < 28 ? 'riesgo de racionamiento' : c.embalses < 45 ? 'nivel bajo' : 'nivel adecuado'}</span>`)}${Comp.kpi('Índice de alimentos', Math.round(c.alimentos), `<span class="${col(c.alimentos, 120, true)}">100 = normal</span>`)}${Comp.kpi('Transición energética', Math.round(c.transicion) + '%', '<span class="tenue">avance de renovables</span>')}${Comp.kpi('Petróleo', E.mundoEco ? Math.round(E.mundoEco.petroleo) : '—', '<span class="tenue">USD/barril (índice)</span>')}</div>
      <div class="grid g2" style="margin-top:14px"><div class="col">${graf(E, 'clima:enso', 'Índice ENSO (+ Niño · − Niña)', '#E8A33D')}${graf(E, 'clima:embalses', 'Embalses (%)', '#7fa8e8', v => Math.round(v) + '%')}</div><div class="col">${graf(E, 'clima:alimentos', 'Índice de precios de alimentos', '#E0504A', v => Math.round(v))}
        <div class="tarjeta"><h3>🌱 Transición energética</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Más renovables blindan a la economía frente a las caídas del crudo, pero cuestan déficit hoy y molestan a la industria petrolera.</div>${G.barrasH([{ etq: 'Avance', v: Math.round(c.transicion), color: '#3FBF7A' }], { max: 100 })}<div style="margin-top:10px">${UI.botonAccion('impulsarTransicion', {}, 'Impulsar la transición', 'prim')}</div></div></div></div>
      <div class="tarjeta" style="margin-top:14px"><h3>Bitácora</h3>${c.hist.length ? `<div class="lista">${c.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div>` : '<div class="tenue">Sin novedades.</div>'}</div>`;
  };

  const migracion = E => {
    const c = Cl().asegurar(E), mv = C.MundoVivo;
    const fuentes = ['VEN', 'NIC', 'HTI', 'CUB'].map(id => ({ id, p: mv.pais(E, id) })).filter(x => x.p);
    return `${aviso(E)}<div class="grid g4">${Comp.kpi('Migrantes en Colombia', c.migrantes.toFixed(2) + ' M', '<span class="tenue">estimación</span>')}${Comp.kpi('Flujo actual', U.d1(c.flujo * 100 / 3) + '%', '<span class="tenue">de la capacidad de entrada</span>')}${Comp.kpi('Integración', Math.round(c.integracion) + '%', '<span class="tenue">empleo formal y servicios</span>')}${Comp.kpi('Política vigente', c.politica ? Cl().POLITICAS[c.politica].n.split(' ')[0] : 'Ninguna', '<span class="tenue">migratoria</span>')}</div>
      <div class="grid g2" style="margin-top:14px"><div class="col"><div class="tarjeta"><h3>Política migratoria</h3><div class="col" style="gap:8px">${Object.entries(Cl().POLITICAS).map(([k, p]) => `<div class="fila" style="gap:8px;align-items:center"><div style="flex:1;font-size:12.5px"><b>${c.politica === k ? '● ' : ''}${esc(p.n)}</b><div class="tenue" style="font-size:11.5px">${esc(p.txt)}</div></div>${UI.botonAccion('politicaMigratoria', { politica: k }, 'Aplicar')}</div>`).join('')}</div></div>
        ${graf(E, 'clima:migrantes', 'Migrantes en Colombia (millones)', '#B58FE8', v => v.toFixed(2))}</div>
      <div class="col"><div class="tarjeta"><h3>Países de origen</h3><table class="tabla"><thead><tr><th>País</th><th>Estabilidad</th><th>Inflación</th><th>Estado</th></tr></thead><tbody>${fuentes.map(x => `<tr><td><b>${esc(mv.nombre(x.id))}</b></td><td class="num ${x.p.estab < 35 ? 'mal' : ''}">${Math.round(x.p.estab)}</td><td class="num">${x.p.inflacion != null ? U.d1(x.p.inflacion) + '%' : '—'}</td><td>${x.p.crisis ? '<span class="etq rojo">' + esc(x.p.crisis.tipo) + '</span>' : '<span class="etq verde">sin crisis</span>'}</td></tr>`).join('')}</tbody></table><div class="tenue" style="font-size:12px;margin-top:8px">Cuanto más inestable el vecino, más gente cruza. Regularizar integra pero atrae; cerrar frena y enfría la relación.</div></div></div></div>`;
  };

  const TABS = [['panorama', 'Clima y recursos', panorama], ['migracion', 'Migración', migracion]];
  C.Pantallas.clima = {
    render(el, params) {
      const E = C.E; Cl().asegurar(E);
      const tab = (params && params.tab) || E.ui.climaTab || 'panorama'; E.ui.climaTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Clima, migración y recursos</h1><div class="sub">El Niño y La Niña, los embalses, el precio de los alimentos, la transición energética y quienes cruzan la frontera.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('clima', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
