/* Decretos y excepción: reglamentación de las leyes sancionadas y estados de excepción con revisión de la Corte. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const Dc = () => C.Decretos;
  const col = v => v >= 65 ? '#E0504A' : v >= 40 ? '#E8A33D' : '#3FBF7A';
  const barra = (v, c) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:120px;height:7px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const ESTADO = { pendiente: ['Pendiente', 'amar'], reglamentada: ['Reglamentada', 'verde'], restrictiva: ['Restrictiva', 'amar'], letraMuerta: ['Letra muerta', 'rojo'], vigente: ['Vigente', 'verde'], anulada: ['Anulada', 'rojo'] };

  const tabReglam = E => {
    const pres = Dc().esPres(E);
    const leyes = Object.values(E.proyectos).filter(p => p.estado === 'ley' && p.reglam && p.reglam.estado !== 'vigente').sort((a, b) => (b.sancionada || 0) - (a.sancionada || 0));
    const pend = leyes.filter(p => p.reglam.estado === 'pendiente');
    const fila = p => {
      const r = p.reglam, [n, c] = ESTADO[r.estado] || ['—', ''];
      const rest = r.estado === 'pendiente' ? Math.max(0, r.limite - E.fecha.t) : 0;
      const acc = r.estado !== 'pendiente' ? '' : pres
        ? `<div class="fila accion-form" style="gap:6px">${UI.botonAccion('reglamentarLey', { proyecto: p.id, modo: 'fiel' }, 'Reglamentar', 'chico prim')}${UI.botonAccion('reglamentarLey', { proyecto: p.id, modo: 'restrictivo' }, 'Restrictiva', 'chico')}</div>`
        : `<div class="fila" style="gap:6px">${UI.botonAccion('exigirReglamentacion', { proyecto: p.id }, 'Exigir', 'chico')}${UI.botonAccion('accionCumplimiento', { proyecto: p.id }, 'Acción de cumplimiento', 'chico')}</div>`;
      return `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(p.titulo)}</b><span>Ley ${p.ley} · ${r.estado === 'pendiente' ? `faltan ${rest} semanas para la letra muerta${r.presion ? ' · presión ×' + r.presion : ''}${r.orden != null ? ' · orden judicial vigente' : ''}` : r.t1 ? 'resuelta ' + U.fmtT(r.t1) + (r.escala != null && r.escala < 1 ? ' · ' + Math.round(r.escala * 100) + ' % de efectos' : '') : ''}</span></div><span class="etq ${c}">${n}</span>${acc}</div>`;
    };
    return `<div class="tarjeta"><h3>🖋 Reglamentación de las leyes</h3><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Una ley sancionada no produce efectos hasta que el Gobierno la reglamenta por decreto. Si pasa un año, queda en <b>letra muerta</b> y sólo rinde el 35 % de lo previsto. ${pres ? 'Tú eres el Gobierno: reglamenta fiel (todos los efectos) o restrictivo (65 % de efectos y 35 % menos costo).' : 'Como congresista puedes presionar al Gobierno o acudir al Consejo de Estado con una acción de cumplimiento.'}</div>
      <div class="fila" style="gap:14px;margin-bottom:8px"><span class="etq amar">${pend.length} pendientes</span><span class="etq verde">${leyes.filter(p => p.reglam.estado === 'reglamentada').length} reglamentadas</span><span class="etq rojo">${leyes.filter(p => p.reglam.estado === 'letraMuerta').length} letra muerta</span></div>
      ${leyes.length ? `<div class="lista">${leyes.slice(0, 40).map(fila).join('')}</div>` : '<div class="tenue">Aún no se ha sancionado ninguna ley que requiera reglamentación.</div>'}</div>`;
  };

  const tabExcepcion = E => {
    const D = Dc(), pres = D.esPres(E), exc = D.activa(E), g = D.gravedad(E), T = D.TIPOS;
    const grav = `<div class="tarjeta"><h3>📊 Gravedad real de la crisis</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">La Corte compara la declaratoria con la gravedad real: si la crisis no justifica el estado de excepción, lo tumba.</div>
      ${Object.entries(D.MOTIVOS).map(([k, n]) => `<div class="fila" style="justify-content:space-between;margin:4px 0"><span>${n}</span>${barra(g[k] || 0, col(g[k] || 0))}</div>`).join('')}
      <div class="tenue" style="font-size:12px;margin-top:6px">Semanas de excepción este año: <b>${D.semanasUsadas(E)}</b> de 13.</div></div>`;
    const cuerpo = exc ? (() => {
      const t = T[exc.tipo], rest = Math.max(0, exc.fin - E.fecha.t), r = D.riesgoDeclaratoria(E, exc);
      const disp = Object.entries(D.DECRETOS).filter(([k, d]) => d.t === exc.tipo);
      return `<div class="tarjeta"><h3>${t.icono} ${t.n} — vigente</h3><div class="tenue" style="font-size:12.5px">Motivo: ${D.MOTIVOS[exc.motivo]} · gravedad al declarar ${exc.gravedad}/100 · quedan ${rest} semanas · prórrogas ${exc.prorrogas}/${t.max}${exc.demandado ? ' · <b>demandada ante la Corte</b>' : ''}</div>
        <div class="fila" style="margin:8px 0;gap:8px">${exc.revisada ? '<span class="etq verde">Declaratoria avalada por la Corte</span>' : `<span class="etq ${r > 0.4 ? 'rojo' : r > 0.2 ? 'amar' : 'verde'}">Riesgo de que la Corte la tumbe: ${Math.round(r * 100)} %</span>`}</div>
        ${pres ? `<div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('prorrogarExcepcion', {}, null, 'chico')}${UI.botonAccion('levantarExcepcion', {}, null, 'chico')}</div>` : UI.botonAccion('demandarExcepcion', {}, null, 'chico')}
        <h4 style="margin:12px 0 6px">Decretos legislativos</h4>
        <div class="lista">${disp.map(([k, d]) => { const x = exc.decretos.find(z => z.clave === k); return `<div class="it"><div class="cuerpo"><b style="white-space:normal">${d.icono} ${esc(d.n)}</b><span>Riesgo base ${Math.round(d.riesgo * 100)} %${d.costo ? ' · ' + (d.costo > 0 ? 'cuesta ' : 'recauda ') + U.d1(Math.abs(d.costo)) + ' bill.' : ''}</span></div>${x ? `<span class="etq ${x.estado === 'inexequible' ? 'rojo' : x.estado === 'avalado' ? 'verde' : 'amar'}">${x.estado === 'vigente' ? 'En revisión' : x.estado === 'avalado' ? 'Avalado' : 'Tumbado'}</span>` : (pres ? UI.botonAccion('decretarExcepcion', { decreto: k }, 'Expedir', 'chico') : '')}</div>`; }).join('')}</div></div>`;
    })() : `<div class="tarjeta"><h3>🚨 Declarar estado de excepción</h3>${pres ? `<div class="accion-form"><div class="grid g2"><div class="campo"><label>Tipo</label><select data-arg="tipo">${Object.entries(T).map(([k, t]) => `<option value="${k}">${t.n}</option>`).join('')}</select></div>
        <div class="campo"><label>Motivo alegado</label><select data-arg="motivo">${Object.entries(D.MOTIVOS).map(([k, n]) => `<option value="${k}">${n} (${Math.round(g[k] || 0)})</option>`).join('')}</select></div></div>
        ${UI.botonAccion('declararExcepcion', { tipo: 'conmocion', motivo: 'orden' }, 'Declarar', 'prim')}
        <div class="tenue" style="font-size:12px;margin-top:8px">${Object.values(T).map(t => `<b>${t.icono} ${t.n}</b>: ${t.txt}`).join('<br>')}</div></div>` : '<div class="tenue">No hay estado de excepción vigente. Sólo el Presidente puede declararlo; como congresista puedes demandarlo ante la Corte si se declara.</div>'}</div>`;
    const hist = D.asegurar(E).hist;
    return `<div class="grid g2"><div class="col">${cuerpo}</div><div class="col">${grav}${hist.length ? `<div class="tarjeta"><h3>Historial</h3><div class="lista">${hist.map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${T[h.tipo].icono} ${T[h.tipo].n}</b><span>${U.fmtT(h.t0)} → ${U.fmtT(h.t1)} · ${esc(h.cierre || '')} · ${h.decretos.length} decretos</span></div><span class="etq ${h.estado === 'inexequible' ? 'rojo' : ''}">${h.estado === 'inexequible' ? 'Tumbado' : 'Terminado'}</span></div>`).join('')}</div></div>` : ''}</div></div>`;
  };

  const TABS = [['reglam', 'Reglamentación', tabReglam], ['excepcion', 'Estados de excepción', tabExcepcion]];
  C.Pantallas.decretos = {
    render(el, params) {
      const E = C.E; Dc().asegurar(E);
      const tab = (params && params.tab) || E.ui.decTab || 'reglam'; E.ui.decTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Decretos y excepción</h1><div class="sub">Las leyes necesitan reglamentación para surtir efecto; en crisis grave el Presidente puede gobernar por decreto, bajo el control de la Corte.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('decretos', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
