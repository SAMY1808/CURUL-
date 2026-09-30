/* Inteligencia y guerra sucia: interceptaciones, expedientes, campañas negras y bots. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  const blancos = E => Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && ['presidente', 'ministro', 'senador', 'representante', 'gobernador', 'alcalde'].includes(p.cargo.tipo))
    .sort((a, b) => (C.Partidos.peso(E, b).nac) - (C.Partidos.peso(E, a).nac)).slice(0, 45);
  const nombreCargo = p => C.DATA.cargos[p.cargo.tipo] ? C.DATA.cargos[p.cargo.tipo].nombre : p.cargo.tipo;

  const operaciones = E => {
    const I = C.Inteligencia, q = I.asegurar(E), pres = I.esPres(E), bl = blancos(E);
    const opt = bl.map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(nombreCargo(p))}${p.partido && E.partidos[p.partido] ? ' · ' + esc(E.partidos[p.partido].sigla) : ''}</option>`).join('');
    return `<div class="grid g2"><div class="tarjeta"><h3>🎧 Interceptar</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Escoges un blanco y un canal. ${pres ? `Como Presidente puedes ordenarlo a ${esc(I.siglaAgencia())}: más probable de acertar, pero más riesgo de escándalo.` : 'Como no eres Presidente sólo puedes contratar detectives privados (cuestan $25 millones cada uno).'} Si consigue algo, queda un expediente.</div>
        <div class="col accion-form" style="gap:8px"><select data-arg="objetivo">${opt}</select>
          <select data-arg="canal">${pres ? `<option value="estado">Servicio de inteligencia del Estado</option>` : ''}<option value="privado">Detectives privados ($25 M)</option></select>
          <div>${UI.botonAccion('interceptar', {})}</div></div></div>
      <div class="tarjeta"><h3>${esc(I.agencia())}</h3>${pres ? `<div style="display:flex;justify-content:center">${G.medidor(q.capacidad, { tam: 150, etq: 'CAPACIDAD', texto: Math.round(q.capacidad) + '' })}</div><div style="text-align:center;margin-top:6px">${UI.botonAccion('fortalecerInteligencia', {})}</div>` : '<div class="tenue" style="font-size:12.5px">No diriges el servicio de inteligencia. Cuando seas Presidente lo controlarás, con todo lo que eso implica.</div>'}
        ${q.chuzadoJ != null ? `<div class="resultado-jugador no" style="margin-top:10px"><div style="font-size:26px">👁</div><div><b>Te han estado espiando</b><div class="tenue">Puedes denunciarlo.</div></div>${UI.botonAccion('denunciarChuzadas', {})}</div>` : ''}</div></div>`;
  };

  const expedientes = E => {
    const I = C.Inteligencia, q = I.asegurar(E), vig = q.expedientes.filter(x => x.estado === 'vigente'), otros = q.expedientes.filter(x => x.estado !== 'vigente').slice(0, 8);
    return `<div class="tarjeta"><h3>Expedientes vigentes</h3>${vig.length ? `<div class="lista">${vig.map(x => { const v = I.valor(E, x), p = E.politicos[x.objetivo];
      return `<div class="it" style="align-items:flex-start"><div class="cuerpo" style="flex:1"><b>${esc(x.nombre)}</b><span style="white-space:normal">${esc(I.TIPOS_EXP[x.tipo].n)} · ${x.canal === 'estado' ? esc(I.siglaAgencia()) : 'detectives'} · ${esc(U.fmtT(x.t))} · valor hoy ${Math.round(v)}${p && p.partido && E.partidos[p.partido] ? ' · ' + esc(E.partidos[p.partido].sigla) : ''}</span></div>
        <span class="etq ${v > 60 ? 'rojo' : v > 35 ? 'amar' : ''}">gravedad ${Math.round(v)}</span>
        <div class="fila" style="gap:4px;flex-wrap:wrap">${Object.entries(I.USOS).map(([k, n]) => UI.botonAccion('usarExpediente', { id: x.id, uso: k }, n, 'chico')).join('')}</div></div>`; }).join('')}</div>` : '<div class="tenue" style="font-size:12px">No tienes expedientes. Ordena una interceptación en la pestaña Operaciones.</div>'}</div>
      ${otros.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Usados y archivados</h3><div class="lista">${otros.map(x => `<div class="it"><div class="cuerpo"><b>${esc(x.nombre)}</b><span>${esc(I.TIPOS_EXP[x.tipo].n)}</span></div><span class="etq">${{ filtrado: 'Filtrado', presionado: 'Usado para presionar', archivado: 'Archivado' }[x.estado]}</span></div>`).join('')}</div></div>` : ''}`;
  };

  const guerra = E => {
    const I = C.Inteligencia, q = I.asegurar(E), J = E.jugador;
    const rivales = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.id !== J.partido).sort((a, b) => b.popularidad - a.popularidad);
    return `<div class="grid g2"><div class="tarjeta"><h3>🕳 Campaña negra</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Pauta y perfiles falsos ($60 M) para desgastar a un partido rival. Funciona mejor con redes viralizadas; si te descubren, se devuelve contra ti y contra tu honestidad.</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="partido">${rivales.map(p => `<option value="${p.id}">${esc(p.nombre)} · ${U.d1(p.popularidad)} %</option>`).join('')}</select>${UI.botonAccion('campanaNegra', {})}</div></div>
      <div class="tarjeta"><h3>🤖 Ejército de bots</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Una bodega digital ($40 M) dispara la viralidad y tu reconocimiento por unas semanas. Puede destaparse.</div>
        <div class="fila" style="gap:8px;align-items:center">${UI.botonAccion('ejercitoBots', {})}<span class="tenue" style="font-size:12px">Viralidad ${Math.round(E.redes.viralidad)} · cancelaciones ${E.redes.cancelaciones}${q.bots > 0 ? ' · bots activos' : ''}</span></div></div></div>
      <div class="tarjeta" style="margin-top:14px"><h3>Nivel de riesgo</h3><div class="grid g3">${Comp.kpi('Riesgo de escándalo', Math.round(q.riesgo) + '/100', `<span class="${q.riesgo > 40 ? 'mal' : 'tenue'}">cada operación deja rastro</span>`)}${Comp.kpi('Tu riesgo judicial', Math.round(J.riesgoJudicial || 0) + '/100', '<span class="tenue">lo alimentan los escándalos</span>')}${Comp.kpi('Escándalos vividos', q.escandalos)}</div>
        ${q.historial.length ? `<div class="lista" style="margin-top:8px">${q.historial.slice(0, 6).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(h.txt)}</b><span>${esc(U.fmtT(h.t))}</span></div></div>`).join('')}</div>` : ''}</div>`;
  };

  const exterior = E => {
    const Es = C.Espionaje, e = Es.asegurar(E), pres = Es.puede(E) === true, D = C.Diplomacia;
    const pre = E.ui.espPais || 'VEN';
    const opPais = D.paises().map(p => `<option value="${p.id}" ${p.id === pre ? 'selected' : ''}>${esc(p.nombre)}${e.redes[p.id] ? ' · red ' + Math.round(e.redes[p.id]) + '%' : ''}</option>`).join('');
    const redes = Object.entries(e.redes).sort((a, b) => b[1] - a[1]);
    const info = redes.filter(([, r]) => r >= 30).slice(0, 8).map(([id]) => { const p = C.MundoVivo.pais(E, id); return `<tr><td><b>${esc(Es.nombre(id))}</b></td><td>${esc(p.lider)}</td><td class="num">${p.militar}</td><td class="num">${Math.round(p.estab)}</td><td>${p.proxElec != null ? U.fmtT(p.proxElec) : '—'}</td></tr>`; }).join('');
    return `${pres ? '' : '<div class="tenue" style="font-size:12px;margin-bottom:10px">Sólo el Presidente ordena operaciones en el exterior; aquí ves cómo va la contrainteligencia.</div>'}<div class="grid g4">${Comp.kpi('Contrainteligencia', Math.round(e.contra) + '%', '<span class="tenue">frena ataques ajenos</span>')}${Comp.kpi('Redes activas', redes.length, '<span class="tenue">países infiltrados</span>')}${Comp.kpi('Operaciones exitosas', e.exitos, `<span class="tenue">${e.expuestas} descubiertas</span>`)}${Comp.kpi('Ataques recibidos', e.ataquesRecibidos, `<span class="tenue">${e.detenidos} detenidos</span>`)}</div>
      <div class="grid g2" style="margin-top:14px"><div class="col"><div class="tarjeta"><h3>🕵 Operación encubierta</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Primero infiltra una red; con más red se desbloquean operaciones más fuertes y baja el riesgo de que te descubran. Ya usas las mismas agencias de inteligencia del Estado.</div>
        <div class="col accion-form" style="gap:8px"><select data-arg="pais">${opPais}</select>${Object.entries(Es.OPS).map(([k, o]) => `<div class="fila" style="gap:8px;align-items:center"><div style="flex:1;font-size:12px"><b>${o.icono} ${esc(o.n)}</b> <span class="tenue">· red ≥ ${o.red}% · riesgo base ${Math.round(o.riesgo * 100)}%</span><div class="tenue" style="font-size:11px">${esc(o.txt)}</div></div>${UI.botonAccion('op_' + k, {}, 'Ordenar', k === 'golpe' ? 'peligro' : '')}</div>`).join('')}</div>
        <div style="margin-top:10px">${UI.botonAccion('reforzarContrainteligencia', {}, 'Reforzar contrainteligencia')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>Redes en el exterior</h3>${redes.length ? `<div class="lista">${redes.map(([id, r]) => `<div class="it"><div class="cuerpo"><b>${esc(Es.nombre(id))}</b></div><div style="width:45%">${G.barrasH([{ etq: '', v: Math.round(r), color: '#7fa8e8' }], { max: 100 })}</div></div>`).join('')}</div>` : '<div class="tenue">Sin redes todavía.</div>'}</div>
        ${info ? `<div class="tarjeta"><h3>Informes de tus redes</h3><table class="tabla"><thead><tr><th>País</th><th>Líder</th><th>Militar</th><th>Estab.</th><th>Próx. elecciones</th></tr></thead><tbody>${info}</tbody></table></div>` : ''}
        <div class="tarjeta"><h3>Bitácora</h3>${e.historial.length ? `<div class="lista">${e.historial.slice(0, 10).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div>` : '<div class="tenue">Sin novedades.</div>'}</div></div></div>`;
  };

  const TABS = [['operaciones', 'Operaciones', operaciones], ['expedientes', 'Expedientes', expedientes], ['guerra', 'Guerra sucia', guerra], ['exterior', 'Espionaje exterior', exterior]];
  C.Pantallas.inteligencia = {
    render(el, params) {
      const E = C.E; C.Inteligencia.asegurar(E);
      const tab = (params && params.tab) || E.ui.intTab || 'operaciones'; E.ui.intTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0], nExp = E.inteligencia.expedientes.filter(x => x.estado === 'vigente').length;
      el.innerHTML = `<div class="cab"><div><h1>Inteligencia y guerra sucia</h1><div class="sub">La información es poder, y también el mayor riesgo de tu carrera. Todo lo que hagas aquí, si sale a la luz, te pasa factura.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}${k === 'expedientes' && nExp ? ` (${nExp})` : ''}</button>`).join('')}</div>
        <div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('inteligencia', { tab: t.dataset.tab }); };
      el.onchange = e => { if (e.target.matches('select[data-arg=pais]')) E.ui.espPais = e.target.value; };
    }
  };
})(window.CURUL);
