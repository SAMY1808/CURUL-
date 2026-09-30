/* Empresas públicas: mapa de todas las que hay en el país, y gestión de las que diriges. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const Em = () => C.Empresas;
  const bill = v => '$' + U.d1(v) + ' bill.';
  const col = (v, a, b) => v >= a ? 'var(--si)' : v >= b ? 'var(--alerta)' : 'var(--no)';
  const mini = (v, c) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:64px;height:7px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;

  const detalle = (E, e) => {
    const mia = Em().esMia(E, e), g = e.gerente, m = e.meta, S = Em().SECTORES[e.sector];
    const serie = k => e.hist.map(h => [h[0], h[k]]);
    const form = mia ? `<div class="grid g2" style="margin-top:12px">
        <div class="tarjeta"><h3>👔 Gerente</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Marca la eficiencia y la integridad. Los políticos y los aliados de donantes politizan la empresa y aumentan el riesgo de escándalo.</div>
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="tipo">${Object.entries(Em().GERENTES).map(([k, x]) => `<option value="${k}">${esc(x.n)}</option>`).join('')}</select>${UI.botonAccion('nombrarGerente', { emp: e.id })}</div>
          <h3 style="margin-top:12px">🏷 Tarifas</h3><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="nivel">${Object.entries(Em().TARIFAS).map(([k, x]) => `<option value="${k}" ${k === e.tarifa ? 'selected' : ''}>${esc(x.n)}</option>`).join('')}</select>${UI.botonAccion('fijarTarifas', { emp: e.id })}</div></div>
        <div class="tarjeta"><h3>🎯 Meta</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Una meta específica o amplia, a dos años. Cumplirla mejora al gerente y tu imagen; fallarla te pasa factura.</div>
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="meta">${Object.entries(Em().METAS).map(([k, x]) => `<option value="${k}">${esc(x.n)}</option>`).join('')}</select>${UI.botonAccion('fijarMetaEmpresa', { emp: e.id })}</div>
          <h3 style="margin-top:12px">💉 Capital y venta</h3><div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('capitalizarEmpresa', { emp: e.id }, null, 'chico')}<select data-arg="pct"><option value="25">Vender 25 %</option><option value="49">Vender 49 %</option><option value="100">Vender 100 %</option></select>${UI.botonAccion('venderParticipacion', { emp: e.id }, null, 'chico peligro')}</div>
          ${e.paro ? `<div class="mal" style="font-size:12px;margin-top:8px">⚠ Paro sindical: ${e.paro.sem} semanas</div>${UI.botonAccion('atenderParoEmpresa', { emp: e.id }, null, 'chico')}` : ''}</div></div>` : `<div class="tenue" style="font-size:12px;margin-top:10px">La dirige ${esc(Em().ownerLabel(E, e))}. Sólo su titular da órdenes.</div>`;
    return `<div class="tarjeta" style="margin-top:14px;border-left:4px solid var(--oro)"><div class="t-cab"><h3>${S.icono} ${esc(e.nombre)}</h3><span class="etq oro">${esc(Em().ownerLabel(E, e))}</span></div>
      <div class="grid g4">${Comp.kpi('Cobertura', Math.round(e.cobertura) + ' %')}${Comp.kpi('Calidad', Math.round(e.calidad) + '/100')}${Comp.kpi('Rentabilidad', U.d1(e.rentabilidad) + ' %', `<span class="${e.rentabilidad < 0 ? 'mal' : 'tenue'}">tarifas ${esc(Em().TARIFAS[e.tarifa].n.split(' ')[0].toLowerCase())}</span>`)}${Comp.kpi('Sindicato', Math.round(e.sindicato) + '/100', `<span class="${e.sindicato > 70 ? 'mal' : 'tenue'}">${e.sindicato > 70 ? 'al borde del paro' : 'tensión laboral'}</span>`)}</div>
      <div class="grid g2" style="margin-top:12px"><div><div class="tt-f"><span class="tenue">Gerente</span><b>${esc(g.nombre)}</b></div><div class="tt-f"><span class="tenue">Perfil</span><b>${esc(Em().GERENTES[g.tipo].n)} · gestión ${g.gestion} · integridad ${g.integridad}</b></div><div class="tt-f"><span class="tenue">Capital / deuda</span><b>${bill(e.capital)} / ${bill(e.deuda)}</b></div><div class="tt-f"><span class="tenue">Politización</span><b>${Math.round(e.politizacion)}/100</b></div><div class="tt-f"><span class="tenue">Dividendos acumulados</span><b>${bill(e.dividendos)}</b></div>${e.vendido ? `<div class="tt-f"><span class="tenue">Vendido</span><b>${e.vendido} %</b></div>` : ''}
          <div class="tt-f"><span class="tenue">Meta vigente</span><b>${m ? esc(Em().METAS[m.tipo].n) + ' · ' + Math.max(0, m.hasta - E.fecha.t) + ' sem.' : 'Sin meta'}</b></div></div>
        <div>${e.hist.length > 2 ? G.linea([{ nombre: 'Cobertura', color: '#3FBF7A', datos: serie(2) }, { nombre: 'Calidad', color: '#6CC4F5', datos: serie(3) }], { alto: 150, min: 0, max: 100 }) : '<div class="vacio">El historial se llena con el tiempo</div>'}</div></div></div>${form}`;
  };

  C.Pantallas.empresas = {
    render(el, params) {
      const E = C.E, q = Em().asegurar(E), J = E.jugador, f = (params && params.f) || E.ui.empF || 'todas'; E.ui.empF = f;
      const todas = q.lista.filter(e => e.estado !== 'liquidada');
      const lista = todas.filter(e => f === 'todas' || (f === 'mias' ? Em().esMia(E, e) : e.nivel === f));
      const sel = todas.find(e => e.id === E.ui.empSel) || lista[0] || null;
      const propias = todas.filter(e => Em().esMia(E, e)), local = J.cargo === 'alcalde' || J.cargo === 'gobernador';
      const filtros = [['todas', 'Todas'], ['mias', 'Las mías'], ['nacional', 'Nacionales'], ['departamental', 'Departamentales'], ['municipal', 'Municipales']];
      el.innerHTML = `<div class="cab"><div><h1>Empresas públicas</h1><div class="sub">EPM, Emcali, el acueducto de Bogotá, la petrolera nacional… y las que tú crees. Gerentes, metas, tarifas, sindicatos y dividendos.</div></div></div>
        <div class="grid g4">${Comp.kpi('Empresas públicas', todas.length, `<span class="tenue">${propias.length} bajo tu mando</span>`)}${Comp.kpi('Capital total', bill(U.suma(todas.map(e => e.capital))))}${Comp.kpi('Rentabilidad media', U.d1(U.prom(todas.map(e => e.rentabilidad))) + ' %')}${Comp.kpi('En paro', todas.filter(e => e.paro).length, '<span class="tenue">servicios afectados</span>')}</div>
        <div class="tabs" style="margin-top:14px">${filtros.map(([k, n]) => `<button data-f="${k}" class="${k === f ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div class="tarjeta"><table class="tabla clic-filas"><thead><tr><th>Empresa</th><th>Dueño</th><th>Cobertura</th><th>Calidad</th><th>Rentab.</th><th>Deuda/cap.</th><th>Sindicato</th><th>Gerente</th></tr></thead><tbody>${lista.map(e => `<tr data-emp="${e.id}" class="${sel && sel.id === e.id ? 'sel' : ''}"><td><b>${Em().SECTORES[e.sector].icono} ${esc(e.nombre)}</b>${Em().esMia(E, e) ? ' <span class="etq oro">tuya</span>' : ''}${e.paro ? ' <span class="etq rojo">paro</span>' : ''}</td><td class="tenue" style="font-size:12px">${esc(Em().ownerLabel(E, e))}</td><td>${mini(e.cobertura, col(e.cobertura, 90, 70))}</td><td>${mini(e.calidad, col(e.calidad, 70, 50))}</td><td class="num ${e.rentabilidad < 0 ? 'mal' : ''}">${U.d1(e.rentabilidad)} %</td><td class="num">${Math.round(e.deuda / e.capital * 100)} %</td><td>${mini(e.sindicato, e.sindicato > 70 ? 'var(--no)' : 'var(--tenue)')}</td><td class="tenue" style="font-size:12px">${esc(e.gerente.nombre)}<div style="font-size:11px">${esc(Em().GERENTES[e.gerente.tipo].n)}</div></td></tr>`).join('') || '<tr><td colspan="8" class="tenue">No hay empresas en este filtro.</td></tr>'}</tbody></table></div>
        ${sel ? detalle(E, sel) : ''}
        ${local ? `<div class="tarjeta" style="margin-top:14px"><h3>🏭 Crear una empresa pública</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Necesita el visto bueno de tu ${J.cargo === 'gobernador' ? 'Asamblea' : 'Concejo'} y capital inicial de tu fondo de regalías. Nace con poca cobertura: hay que hacerla crecer.</div><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="sector">${Object.entries(Em().SECTORES).filter(([k]) => k !== 'petroleo').map(([k, s]) => `<option value="${k}">${s.icono} ${esc(s.n)}</option>`).join('')}</select>${UI.botonAccion('crearEmpresaPublica', {})}</div></div>` : ''}`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-f]'); if (t) return C.App.ir('empresas', { f: t.dataset.f });
        if (e.target.closest('[data-accion], select, input')) return;
        const r = e.target.closest('[data-emp]'); if (r) { E.ui.empSel = r.dataset.emp; C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
