/* Economía global: petróleo, café, ciclo mundial, tasa de EE. UU., pandemias y las herramientas del Presidente. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const graf = (E, clave, nombre, color, fmt) => { const s = (E.series['mundo:' + clave] || []).slice(-260); return `<div class="tarjeta"><h3>${nombre}</h3>${s.length > 2 ? G.linea([{ nombre, color, datos: s }], { alto: 150, fmt: fmt || (v => U.d1(v)), area: true }) : '<div class="vacio">Aún sin historia</div>'}</div>`; };

  C.Pantallas.mundoeco = {
    render(el) {
      const E = C.E, M = C.MundoEco, m = M.asegurar(E), pres = M.presidente(E);
      const col = (v, ref, inv) => (inv ? v <= ref : v >= ref) ? 'bien' : 'mal';
      const pan = m.pandemia;
      el.innerHTML = `<div class="cab"><div><h1>Economía global</h1><div class="sub">Los precios del crudo y del café, el ciclo mundial y la tasa de Estados Unidos mueven a Colombia sin pedirle permiso.</div></div></div>
        ${pan ? `<div class="resultado-jugador no" style="margin-bottom:14px"><div style="font-size:28px">🦠</div><div><b>Pandemia en curso</b><div class="tenue">Medida vigente: ${esc({ estricta: 'cuarentena estricta', focalizada: 'cuarentena focalizada', abierta: 'economía abierta' }[pan.medida])} · quedan ${Math.max(0, pan.dur - (E.fecha.t - pan.t0))} semanas</div></div></div>` : ''}
        <div class="grid g4">${Comp.kpi('Petróleo', Math.round(m.petroleo), `<span class="${col(m.petroleo, 100)}">${m.petroleo >= 100 ? '▲' : '▼'} índice base 100${E.fecha.t < m.cobertura ? ' · cubierto' : ''}</span>`)}${Comp.kpi('Café', Math.round(m.cafe), `<span class="${col(m.cafe, 100)}">índice base 100</span>`)}${Comp.kpi('Crecimiento mundial', U.d1(m.ciclo) + ' %', `<span class="${col(m.ciclo, 0.5)}">${m.ciclo < -1 ? 'recesión global' : m.ciclo < 0.5 ? 'debilidad' : 'expansión'}</span>`)}${Comp.kpi('Tasa de EE. UU.', U.d1(m.fed) + ' %', '<span class="tenue">encarece el crédito emergente</span>')}</div>
        <div class="grid g2" style="margin-top:14px">${graf(E, 'petroleo', 'Precio del petróleo (índice)', '#E8A33D', v => Math.round(v))}${graf(E, 'cafe', 'Precio del café (índice)', '#B58FE8', v => Math.round(v))}${graf(E, 'ciclo', 'Crecimiento de la economía mundial', '#6CC4F5', v => U.d1(v) + '%')}${graf(E, 'fed', 'Tasa de la Reserva Federal', '#E0504A', v => U.d1(v) + '%')}</div>
        <div class="grid g2" style="margin-top:14px"><div class="tarjeta"><h3>Herramientas macroeconómicas</h3>${pres ? `<div class="tenue" style="font-size:12px;margin-bottom:10px">Ahorra en las vacas gordas para no sufrir en las flacas.</div>
            <div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="tenue" style="min-width:150px">Fondo de estabilización: <b>${Math.round(m.fondo)}</b></span>${UI.botonAccion('fondoEstabilizacion', { op: 'ahorrar' }, 'Ahorrar 100', 'chico')}${UI.botonAccion('fondoEstabilizacion', { op: 'usar' }, 'Usar 100', 'chico')}</div>
            <div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="tenue" style="min-width:150px">Cobertura petrolera: <b>${E.fecha.t < m.cobertura ? 'vigente (' + (m.cobertura - E.fecha.t) + ' sem.)' : 'sin cobertura'}</b></span>${UI.botonAccion('coberturaPetrolera', {})}</div>
            <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><span class="tenue" style="min-width:150px">Postura fiscal: <b>${esc(M.MODOS[m.modo])}</b></span><select data-arg="modo">${Object.entries(M.MODOS).map(([k, n]) => `<option value="${k}" ${k === m.modo ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>${UI.botonAccion('posturaFiscal', {})}</div>` : '<div class="tenue" style="font-size:12.5px">Sólo el Presidente maneja la política macroeconómica. Cuando llegues a la Casa de Nariño tendrás un fondo de estabilización, coberturas y la postura fiscal a tu mando.</div>'}</div>
          <div class="tarjeta"><h3>Choques recientes</h3>${m.choques.length ? `<div class="lista">${m.choques.slice(0, 8).map(c => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(c.txt)}</b><span>${esc(U.fmtT(c.t))}</span></div></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">Sin choques en esta partida.</div>'}</div></div>`;
    }
  };
})(window.CURUL);
