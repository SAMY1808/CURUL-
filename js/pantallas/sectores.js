/* Sectores: pensiones, salud (EPS) y finanzas (Banco de la República, dólar, banca). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:7px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const bueno = v => v >= 62 ? '#3FBF7A' : v >= 40 ? '#E8A33D' : '#E0504A';
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:4px 0"><span>${n}</span>${v}</div>`;
  const hist = h => h.length ? `<div class="tarjeta"><h3>Bitácora</h3><div class="lista">${h.slice(0, 8).map(x => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(x.txt)}</b><span>${U.fmtT(x.t)}</span></div></div>`).join('')}</div></div>` : '';
  const rad = (id, txt) => UI.botonAccion('radicar', { plantilla: id }, txt, 'chico');

  const tabPensiones = E => {
    const P = C.Pensiones, p = P.asegurar(E);
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>👴 Sistema pensional</h3>
      ${fila('Afiliados al régimen público (Colpensiones)', barra(p.rpm * 100, '#4C7FE0'))}
      ${fila('Cobertura de adultos mayores', barra(p.cob, bueno(p.cob * 1.8)))}
      ${fila('Costo fiscal (% del PIB)', `<b class="num">${U.d1(p.costo)} %</b>`)}
      ${fila('Edad de pensión (hombres / mujeres)', `<b class="num">${p.edadM} / ${p.edadF}</b>`)}
      ${fila('Pilar solidario', `<b class="num">${p.solid}/3</b>`)}
      ${fila('Informalidad laboral', `<b class="num">${U.d1(p.informal)} %</b>`)}
      <div class="tenue" style="font-size:12px;margin-top:8px">Un régimen público grande cubre más gente pero pesa más en el déficit; los fondos privados cuestan menos al Estado y dejan a más gente sin pensión. Las reformas se aprueban en el Congreso.</div></div></div>
      <div class="col"><div class="tarjeta"><h3>📜 Reformas posibles</h3><div class="lista">
        ${[['pen_publico', 'Pilar público (Colpensiones)'], ['pen_mixto', 'Sistema mixto de pilares'], ['pen_privado', 'Fondos privados'], ['pen_edad', 'Subir la edad de pensión'], ['pen_solidario', 'Pilar solidario universal']].map(([id, n]) => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${n}</b><span>${esc((C.DATA.plantillasProyectos.find(x => x.id === id) || {}).titulo || '')}</span></div>${rad(id, 'Radicar')}</div>`).join('')}</div></div>${hist(p.hist)}</div></div>`;
  };

  const tabSalud = E => {
    const S = C.EPS, s = S.asegurar(E), g = S.gestor(E) === true, M = { mixto: 'Mixto', publico: 'Público', privado: 'Privado' };
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🏥 Sistema de salud</h3>
      ${fila('Modelo', `<span class="etq">${M[s.modelo]}</span>`)}
      ${fila('Calidad del servicio', barra(s.calidad, bueno(s.calidad)))}
      ${fila('UPC (pago por afiliado)', `<b class="num">${s.upc} %</b>`)}
      ${fila('Liquidez hospitalaria', barra(s.hosp.liquidez, bueno(s.hosp.liquidez)))}
      ${fila('Deuda con hospitales', `<b class="num">${U.d1(s.hosp.deuda)} billones</b>`)}
      ${fila('Giro directo', `<b>${s.giro ? 'Sí' : 'No'}</b>`)}
      ${g ? `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${UI.botonAccion('ajustarUPC', { delta: 1 }, 'UPC +5', 'chico')}${UI.botonAccion('ajustarUPC', { delta: -1 }, 'UPC −5', 'chico')}${UI.botonAccion('capitalizarHospitales', {}, null, 'chico')}</div>` : ''}</div>
      <div class="tarjeta"><h3>📜 Reformas posibles</h3><div class="lista">${[['sal_publico', 'EPS gestoras y red pública'], ['sal_mixto', 'Modelo mixto con atención primaria'], ['sal_privado', 'Competencia y libre elección'], ['sal_giro', 'Giro directo a hospitales']].map(([id, n]) => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${n}</b></div>${rad(id, 'Radicar')}</div>`).join('')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>🏢 EPS</h3><div class="lista">${s.lista.map(x => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(x.nombre)}</b><span>${U.d1(x.share)} % de afiliados · ${x.estado === 'activa' ? 'activa' : x.estado === 'intervenida' ? 'intervenida' : 'liquidada'}</span></div>${x.estado !== 'liquidada' ? barra(x.solvencia, bueno(x.solvencia), 80) : '<span class="etq rojo">Liquidada</span>'}
        ${g && x.estado !== 'liquidada' ? `<div class="fila" style="gap:6px;width:100%;margin-top:6px">${x.estado === 'activa' ? UI.botonAccion('intervenirEPS', { eps: x.id }, 'Intervenir', 'chico') : ''}${UI.botonAccion('liquidarEPS', { eps: x.id }, 'Liquidar', 'chico')}</div>` : ''}</div>`).join('')}</div></div>${hist(s.hist)}</div></div>`;
  };

  const tabFinanzas = E => {
    const B = C.Banca, b = B.asegurar(E), Ev = E.economia, g = B.gestor(E) === true;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🏦 Banco de la República y mercado</h3>
      ${fila('Tasa de intervención', `<b class="num">${U.d1(Ev.tasa)} %</b>`)}
      ${fila('Inflación', `<b class="num">${U.d1(Ev.inflacion)} %</b>`)}
      ${fila('Dólar (pesos)', `<b class="num">$${U.n(Math.round(b.tc))}</b>`)}
      ${fila('Reservas internacionales', `<b class="num">${U.d1(b.reservas)} mil millones US$</b>`)}
      ${fila('Independencia del Banco', barra(b.indep, bueno(b.indep)))}
      ${fila('Sesgo de la junta', `<b>${b.sesgo > 0.5 ? 'Restrictivo (+' + b.sesgo + ')' : b.sesgo < -0.5 ? 'Expansivo (' + b.sesgo + ')' : 'Neutral'}</b>`)}
      ${fila('Solidez del sistema financiero', barra(b.solidez, bueno(b.solidez)))}
      ${b.presion ? `<div class="etq amar" style="margin-top:6px">Presionando para ${b.presion.dir} tasas hasta ${U.fmtT(b.presion.hasta)}</div>` : ''}
      ${b.crisis ? `<div class="etq rojo" style="margin-top:6px">CRISIS BANCARIA · gravedad ${b.crisis.grav}/100</div>` : ''}
      ${g ? `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px">${UI.botonAccion('presionarBanrep', { dir: 'bajar' }, 'Presionar: bajar tasas', 'chico')}${UI.botonAccion('presionarBanrep', { dir: 'subir' }, 'Presionar: subir tasas', 'chico')}${UI.botonAccion('nombrarCodirectorBanrep', { perfil: 'ortodoxo' }, 'Codirector ortodoxo', 'chico')}${UI.botonAccion('nombrarCodirectorBanrep', { perfil: 'heterodoxo' }, 'Codirector heterodoxo', 'chico')}${UI.botonAccion('intervenirCambio', { dir: 'vender' }, 'Vender dólares', 'chico')}${UI.botonAccion('intervenirCambio', { dir: 'comprar' }, 'Comprar dólares', 'chico')}${b.crisis ? UI.botonAccion('rescateBancario', {}, null, 'chico prim') : ''}</div>` : '<div class="tenue" style="font-size:12px;margin-top:8px">Sólo el Presidente o el ministro de Hacienda actúan sobre el Banco y el mercado cambiario.</div>'}</div></div>
      <div class="col"><div class="tarjeta"><h3>📜 Reformas posibles</h3><div class="lista">${[['banrep_reforma', 'Reforma a la junta del Banco'], ['fogafin', 'Fortalecer Fogafín']].map(([id, n]) => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${n}</b></div>${rad(id, 'Radicar')}</div>`).join('')}</div><div class="tenue" style="font-size:12px;margin-top:8px">Un dólar caro encarece las importaciones y sube la inflación, pero ayuda a las exportaciones. Los rescates cuestan, pero evitan una recesión mayor.</div></div>${hist(b.hist)}</div></div>`;
  };

  const TABS = [['pensiones', 'Pensiones', tabPensiones], ['salud', 'Salud y EPS', tabSalud], ['finanzas', 'Finanzas y Banco', tabFinanzas]];
  C.Pantallas.sectores = {
    render(el, params) {
      const E = C.E;
      const tab = (params && params.tab) || E.ui.secTab || 'pensiones'; E.ui.secTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Sectores estratégicos</h1><div class="sub">Pensiones, salud con sus EPS, y el sistema financiero con el Banco de la República.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('sectores', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
