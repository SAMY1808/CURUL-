/* Riesgo y sociedad: desastres y UNGRD, consulta previa a comunidades étnicas y narcotráfico. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:7px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const bueno = v => v >= 62 ? '#3FBF7A' : v >= 40 ? '#E8A33D' : '#E0504A';
  const malo = v => v >= 62 ? '#E0504A' : v >= 38 ? '#E8A33D' : '#3FBF7A';

  const tabDesastres = E => {
    const R = C.Riesgo, r = R.asegurar(E), nm = id => E.deptos[id].nombre;
    const activos = r.activas.map(ev => {
      const A = R.AMENAZAS[ev.tipo], gest = ev.depto && (E.gobierno.presidente === 'J' || (E.jugador.cargoInfo && E.jugador.cargoInfo.depto === ev.depto && ['gobernador', 'alcalde'].includes(E.jugador.cargo)));
      return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">${A.icono} ${A.n} en ${esc(nm(ev.depto))} · severidad ${ev.sev}/5</b><span>${U.n(ev.damnif)} damnificados${ev.muertos ? ' · ' + ev.muertos + ' muertos' : ''} · daño ${ev.dano} bill.${ev.calamidad ? ' · calamidad declarada' : ''}</span></div>${barra(ev.resp, bueno(ev.resp), 90)}${gest ? `<div class="fila" style="gap:6px;width:100%;margin-top:6px">${UI.botonAccion('declararCalamidad', { evento: ev.id }, 'Calamidad', 'chico')}${UI.botonAccion('reforzarRespuesta', { evento: ev.id }, 'Reforzar', 'chico')}</div>` : ''}</div>`;
    }).join('');
    const prep = Object.entries(r.prep).sort((a, b) => a[1] - b[1]).slice(0, 8);
    const opts = Object.values(E.deptos).map(d => `<option value="${d.id}">${esc(d.nombre)}</option>`).join('');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🌪 Emergencias en curso</h3>${activos ? `<div class="lista">${activos}</div>` : '<div class="tenue">Ninguna emergencia activa.</div>'}<div class="tenue" style="font-size:12px;margin-top:8px">La barra es el avance de la respuesta. Una respuesta pobre castiga al Gobierno y al mandatario local; una buena lo premia.</div></div>
        ${r.hist.length ? `<div class="tarjeta"><h3>Historial</h3><div class="lista">${r.hist.map(ev => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${R.AMENAZAS[ev.tipo].icono} ${R.AMENAZAS[ev.tipo].n} en ${esc(nm(ev.depto))}</b><span>${U.fmtT(ev.t)} · ${ev.nota || ''} · ${U.n(ev.damnif)} damnificados</span></div></div>`).join('')}</div></div>` : ''}</div>
      <div class="col"><div class="tarjeta"><h3>🏢 UNGRD y preparación</h3><div class="fila" style="justify-content:space-between"><span>Capacidad de la UNGRD</span>${barra(r.ungrd.calidad, bueno(r.ungrd.calidad))}</div>
        <div class="tenue" style="font-size:12px;margin:6px 0">Acumulado: ${U.n(r.total.damnif)} damnificados · ${U.n(r.total.muertos)} muertos · ${U.d1(r.total.dano)} billones en daños.</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('fortalecerUNGRD', {}, null, 'chico')}${UI.botonAccion('invertirPrevencion', { depto: 'todos' }, 'Plan nacional de prevención', 'chico')}</div>
        <h4 style="margin:12px 0 6px">Territorios menos preparados</h4>${prep.map(([id, v]) => `<div class="fila" style="justify-content:space-between;margin:3px 0"><span>${esc(nm(id))}</span>${barra(v, bueno(v))}</div>`).join('')}
        <div class="fila accion-form" style="gap:6px;margin-top:10px"><select data-arg="depto">${opts}</select>${UI.botonAccion('invertirPrevencion', { depto: 'ANT' }, 'Mitigación local', 'chico')}</div></div></div></div>`;
  };

  const ESTADO = { estudio: ['En estudio', 'amar'], consulta: ['En consulta previa', 'amar'], acuerdo: ['Con acuerdo', 'verde'], rechazo: ['Rechazado', 'rojo'], saltada: ['Sin consulta', 'rojo'], suspendida: ['Suspendido por la Corte', 'rojo'], operando: ['En operación', 'verde'], archivado: ['Archivado', ''] };
  const tabConsulta = E => {
    const CP = C.ConsultaPrevia, q = CP.asegurar(E);
    const fila = p => {
      const P = CP.PROYECTOS[p.tipo], [n, c] = ESTADO[p.estado] || ['—', ''], g = CP.gestor(E, p), enC = ['estudio', 'consulta'].includes(p.estado);
      return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">${P.icono} ${esc(p.nombre)}</b><span>${p.inv} billones · ${esc(CP.comunidad(p.depto))} · impacto ambiental ${p.amb}${p.nota ? ' · ' + esc(p.nota) : ''}</span></div>${enC || p.estado === 'acuerdo' ? barra(p.apoyo, bueno(p.apoyo), 80) : ''}<span class="etq ${c}">${n}</span>
        <div class="fila" style="gap:6px;width:100%;margin-top:6px">${g && enC ? UI.botonAccion('concertarConsulta', { proceso: p.id }, 'Concertar', 'chico') + UI.botonAccion('saltarConsulta', { proceso: p.id }, 'Saltarse la consulta', 'chico') : ''}${g && p.estado === 'acuerdo' ? UI.botonAccion('aprobarProyectoAcordado', { proceso: p.id }, 'Dar luz verde', 'chico prim') : ''}${enC ? UI.botonAccion('tomarPartidoConsulta', { proceso: p.id, postura: 'oponer' }, 'Oponerme', 'chico') + UI.botonAccion('tomarPartidoConsulta', { proceso: p.id, postura: 'respaldar' }, 'Respaldar', 'chico') : ''}</div></div>`;
    };
    return `<div class="tarjeta"><h3>🪶 Consulta previa a comunidades étnicas</h3><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Los megaproyectos en territorios indígenas y afro exigen consulta previa. La barra es el apoyo de la comunidad: con 55 % o más hay acuerdo; por debajo de 33 % el proyecto se archiva. Saltarse la consulta acelera todo, pero una tutela puede suspenderlo.</div>
      ${q.procesos.length ? `<div class="lista">${q.procesos.map(fila).join('')}</div>` : '<div class="tenue">No hay proyectos en trámite: aparecen cada tanto.</div>'}</div>
      ${q.hist.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Historial</h3><div class="lista">${q.hist.map(p => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${CP.PROYECTOS[p.tipo].icono} ${esc(p.nombre)}</b><span>${esc(p.nota || '')} · ${U.fmtT(p.t1)}</span></div><span class="etq ${(ESTADO[p.estado] || [0, ''])[1]}">${(ESTADO[p.estado] || ['—'])[0]}</span></div>`).join('')}</div></div>` : ''}`;
  };

  const tabNarco = E => {
    const Na = C.Narco, n = Na.asegurar(E), g = Na.gestor(E) === true;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🕶 Estructuras narcotraficantes</h3><div class="lista">${n.carteles.sort((a, b) => b.fuerza - a.fuerza).map(c => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(c.nombre)}</b><span>Base: ${esc(E.deptos[c.base].nombre)} · cabecilla ${esc(c.jefe)}${c.capturados ? ' · <b>capturado</b>' : ''}</span></div>${barra(c.fuerza, malo(c.fuerza), 90)}
        ${g ? `<div class="fila" style="gap:6px;width:100%;margin-top:6px">${UI.botonAccion('golpeCartel', { cartel: c.id }, 'Operación', 'chico')}${c.capturados ? UI.botonAccion('extraditar', { cartel: c.id }, 'Extraditar', 'chico') : ''}${UI.botonAccion('sometimiento', { cartel: c.id }, 'Sometimiento', 'chico')}</div>` : ''}</div>`).join('')}</div>
        <div class="tenue" style="font-size:12px;margin-top:8px">Si una estructura cae, sus rutas se reparten y nacen otras menores («efecto cucaracha»). Los cultivos ilícitos las alimentan.</div></div></div>
      <div class="col"><div class="tarjeta"><h3>💸 Dinero ilícito</h3>
        <div class="fila" style="justify-content:space-between;margin:4px 0"><span>Lavado de activos</span>${barra(n.lavado, malo(n.lavado))}</div>
        <div class="fila" style="justify-content:space-between;margin:4px 0"><span>Infiltración política</span>${barra(n.infiltracion, malo(n.infiltracion))}</div>
        <div class="fila" style="justify-content:space-between;margin:4px 0"><span>Inteligencia financiera (UIAF)</span><b class="num">${n.uif}/5</b></div>
        <div class="tenue" style="font-size:12px;margin:8px 0">Con infiltración alta estallan escándalos de narcopolítica; con lavado alto cae la confianza económica. Golpes: ${n.golpes} · extraditados: ${n.extraditados}.</div>
        ${g ? `<div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('fortalecerUIAF', {}, null, 'chico')}${UI.botonAccion('controlPuertos', {}, null, 'chico')}</div>` : '<div class="tenue" style="font-size:12px">Sólo el Presidente o el ministro de Defensa dirigen la política antidrogas.</div>'}</div>
        ${n.hist.length ? `<div class="tarjeta"><h3>Bitácora</h3><div class="lista">${n.hist.map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };

  const TABS = [['desastres', 'Desastres y UNGRD', tabDesastres], ['consulta', 'Consulta previa', tabConsulta], ['narco', 'Narcotráfico', tabNarco]];
  C.Pantallas.sociedad = {
    render(el, params) {
      const E = C.E;
      const tab = (params && params.tab) || E.ui.socTab || 'desastres'; E.ui.socTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Riesgo y sociedad</h1><div class="sub">Desastres, comunidades étnicas frente a los megaproyectos, y la guerra contra el narcotráfico.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('sociedad', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
