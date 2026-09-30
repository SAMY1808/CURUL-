/* Diplomacia: panorama mundial, embajadas, consulados y diáspora, organismos y Consejo de Seguridad,
   tratados y cumbres, e historial del servicio exterior. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const X = () => C.Exterior, D = () => C.Diplomacia;
  const colRel = r => r >= 62 ? '#3FBF7A' : r >= 48 ? '#8FB5E8' : r >= 35 ? '#E8A33D' : '#E0504A';
  const opcPaises = (E, filtro) => { const g = U.agrupar(D().paises().filter(filtro || (() => true)), p => p.region); return Object.entries(g).map(([r, ps]) => `<optgroup label="${esc(r)}">${ps.map(p => `<option value="${p.id}">${esc(p.nombre)} (${Math.round(E.diplomacia.paises[p.id].relacion)}%)</option>`).join('')}</optgroup>`).join(''); };
  const opcCand = E => X().candidatos(E).map(p => `<option value="${p.id}">${esc(p.nombre)} · ${p.partido && E.partidos[p.partido] ? esc(E.partidos[p.partido].sigla) : 'sin partido'}</option>`).join('');
  const aviso = E => X().esGestor(E) ? '' : '<div class="tenue" style="font-size:12px;margin-bottom:10px">El servicio exterior lo dirigen el Presidente y el Canciller: aquí puedes ver cómo va, pero no dar órdenes.</div>';

  const panorama = E => {
    const x = X().asegurar(E), ab = X().abiertas(E), s = x.csnu, rm = X().relMedia(E), at = X().diasporaAtendida(E);
    const regiones = U.agrupar(D().paises(), p => p.region);
    return `<div class="grid g4">${Comp.kpi('Embajadas abiertas', `${ab.length}<small class="tenue" style="font-size:15px">/${X().CUPO}</small>`, '<span class="tenue">países con embajada</span>')}${Comp.kpi('Relación media', Math.round(rm) + '%', '<span class="tenue">con los 193 países</span>')}${Comp.kpi('Diáspora atendida', Math.round(at) + '%', '<span class="tenue">consulados y embajadas</span>')}${Comp.kpi('Consejo de Seguridad', s.miembro ? 'Miembro' : s.candidatura ? 'Candidato' : '—', `<span class="tenue">${s.miembro ? 'hasta ' + esc(U.fmtT(s.hasta, false)) : s.candidatura ? 'avance ' + Math.round(s.candidatura.avance) + ' %' : 'sin candidatura'}</span>`)}</div>
      <div class="tarjeta" style="margin-top:14px"><h3>Mapa de relaciones</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Color = calidad de la relación (verde alta, rojo baja). 🏛 = embajada abierta.</div>
      ${Object.entries(regiones).map(([r, ps]) => `<div style="margin-bottom:10px"><div class="tenue" style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">${esc(r)}</div><div style="display:flex;flex-wrap:wrap;gap:4px">${ps.map(p => { const rel = E.diplomacia.paises[p.id].relacion, e = x.embajadas[p.id]; return `<span${UI.tt(`<b>${esc(p.nombre)}</b><br>Relación ${Math.round(rel)}%${e && e.abierta ? '<br>Embajada' + (e.embajador ? ' · ' + esc(e.embajador.nombre) : ' sin embajador') : ''}${E.diplomacia.paises[p.id].tratados.length ? '<br>' + E.diplomacia.paises[p.id].tratados.map(t => D().TRATADOS[t]).join(', ') : ''}`)} style="font-size:11.5px;padding:2px 7px;border-radius:10px;background:${colRel(rel)}22;border:1px solid ${colRel(rel)}66;color:var(--texto2)">${e && e.abierta ? '🏛 ' : ''}${esc(p.nombre)}</span>`; }).join('')}</div></div>`).join('')}</div>`;
  };

  const embajadas = E => {
    const x = X().asegurar(E), ab = X().abiertas(E).sort((a, b) => E.diplomacia.paises[b[0]].relacion - E.diplomacia.paises[a[0]].relacion);
    const sinEmb = id => !(x.embajadas[id] && x.embajadas[id].abierta);
    return `${aviso(E)}<div class="grid g3" style="margin-bottom:14px">
      <div class="tarjeta"><h3>🏛 Abrir embajada</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Una embajada mejora la relación semana a semana (según la calidad del embajador) y facilita TLC y adhesiones.</div><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="pais" style="max-width:100%">${opcPaises(E, p => sinEmb(p.id))}</select>${UI.botonAccion('abrirEmbajada', {})}</div></div>
      <div class="tarjeta"><h3>🎩 Nombrar embajador</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Los de carrera son estables; los políticos de confianza pagan favores, pero renuncian cuando cambia el gobierno.</div><div class="col accion-form" style="gap:6px"><select data-arg="pais">${opcPaises(E, p => !sinEmb(p.id))}</select><select data-arg="tipo"><option value="carrera">Diplomático de carrera</option><option value="politico">Político de confianza</option></select><select data-arg="pol"><option value="">— si es político, elige —</option>${opcCand(E)}</select>${UI.botonAccion('nombrarEmbajador', {})}</div></div>
      <div class="tarjeta"><h3>📦 Agregaduría comercial</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Un funcionario de comercio en la embajada acelera la relación y ayuda a cerrar acuerdos.</div><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="pais">${opcPaises(E, p => !sinEmb(p.id) && !x.agregadurias[p.id])}</select>${UI.botonAccion('abrirAgregaduria', {})}</div></div></div>
      <div class="tarjeta"><h3>Embajadas (${ab.length})</h3><table class="tabla"><thead><tr><th>País</th><th>Embajador</th><th>Calidad</th><th>Relación</th><th></th></tr></thead><tbody>${ab.map(([id, e]) => { const p = D().pais(id), r = E.diplomacia.paises[id].relacion, emb = e.embajador;
        return `<tr><td><b>${esc(p.nombre)}</b>${x.agregadurias[id] ? ' <span class="etq">📦</span>' : ''}<div class="tenue" style="font-size:11px">${esc(p.region)}</div></td><td>${emb ? `${esc(emb.nombre)}<div class="tenue" style="font-size:11px">${esc(X().TIPOS[emb.tipo])}</div>` : '<span class="etq amar">Encargado de negocios</span>'}</td><td style="width:130px">${emb ? G.barrasH([{ etq: '', v: emb.calidad, color: emb.calidad >= 65 ? 'var(--si)' : emb.calidad >= 45 ? 'var(--alerta)' : 'var(--no)' }], { max: 100, anchoEtq: '0px', anchoValor: '30px', fmt: v => Math.round(v) }) : '—'}</td><td><span class="etq" style="background:${colRel(r)}22;color:${colRel(r)}">${Math.round(r)}%</span></td><td>${X().esGestor(E) ? UI.botonAccion('cerrarEmbajada', { pais: id }, 'Cerrar', 'chico peligro') : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  };

  const consulados = E => {
    const x = X().asegurar(E), dia = C.DATA.diaspora;
    return `${aviso(E)}<div class="tarjeta"><h3>Diáspora y red consular</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Los colombianos en el exterior reclaman servicios, mandan remesas y —cuando los detienen o los expulsan— presionan al Gobierno. Cada nivel de red consular trae más remesas y mejor capacidad de respuesta en las crisis.</div>
      <table class="tabla"><thead><tr><th>País</th><th>Colombianos</th><th>Red consular</th><th>Embajada</th><th></th></tr></thead><tbody>${Object.entries(dia).sort((a, b) => b[1] - a[1]).map(([id, n]) => { const nv = x.consulados[id] || 0, e = x.embajadas[id];
        return `<tr><td><b>${esc(X().nombre(id))}</b></td><td class="num">${U.n(n * 1000)}</td><td>${'●'.repeat(nv)}${'○'.repeat(3 - nv)}</td><td>${e && e.abierta ? '🏛' : '<span class="tenue">—</span>'}</td><td>${X().esGestor(E) && nv < 3 ? UI.botonAccion('abrirConsulado', { pais: id }, 'Reforzar', 'chico') : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  };

  const organismos = E => {
    const x = X().asegurar(E), s = x.csnu, g = E.gobierno.presidente === 'J', misOpts = D().organismos().filter(o => E.diplomacia.organismos[o.id].miembro);
    const csnu = `<div class="tarjeta"><h3>🌐 Consejo de Seguridad de la ONU</h3>${s.miembro ? `<div class="resultado-jugador ok"><div style="font-size:26px">🌐</div><div><b>Colombia es miembro no permanente</b><div class="tenue">Hasta ${esc(U.fmtT(s.hasta, false))} · te tocará votar resoluciones que dividen a las potencias.</div></div></div>`
      : s.candidatura ? `<div class="tenue" style="font-size:12px;margin-bottom:6px">Candidatura en marcha: la Asamblea vota en junio de un año par.</div>${G.barrasH([{ etq: 'Apoyos', v: s.candidatura.avance, color: 'var(--oro)' }], { max: 100, fmt: v => Math.round(v) + '%', anchoEtq: '70px' })}<div class="fila" style="gap:6px;margin-top:8px">${UI.botonAccion('lobbyCSNU', {})}</div>`
      : `<div class="tenue" style="font-size:12px;margin-bottom:8px">Un puesto no permanente da prestigio, relación con todos los países y decisiones difíciles. Necesitas un buen jefe de misión ante la ONU y buenas relaciones.</div>${UI.botonAccion('candidatearCSNU', {})}`}
      <div class="tenue" style="font-size:12px;margin-top:8px">Veces que Colombia ha sido miembro en esta partida: ${s.veces}</div></div>`;
    return `${aviso(E)}<div class="grid g2"><div class="tarjeta"><h3>Organismos multilaterales</h3><div class="lista">${D().organismos().map(o => { const st = E.diplomacia.organismos[o.id], m = x.misiones[o.id];
      return `<div class="it" style="align-items:flex-start"><div class="cuerpo"><b>${esc(o.sigla)}</b><span style="white-space:normal">${esc(o.nombre)}${o.nota ? ' · ' + esc(o.nota) : ''}${st.postulacion ? ` · postulación ${Math.round(st.postulacion.avance)}%` : ''}${st.miembro ? `<br>Misión: ${m && m.jefe ? esc(m.jefe.nombre) + ' (calidad ' + m.jefe.calidad + ')' : 'sin jefe de misión'}` : ''}</span></div>
        <span class="etq ${st.miembro ? 'verde' : ''}">${st.miembro ? 'Miembro' : 'No es miembro'}</span>${g && !st.miembro && o.puedeUnirse ? UI.botonAccion('ingresarOrganismo', { organismo: o.id }, 'Solicitar ingreso', 'chico') : ''}${g && st.miembro && o.puedeRetirarse ? UI.botonAccion('retirarseOrganismo', { organismo: o.id }, 'Retirarse', 'chico peligro') : ''}</div>`; }).join('')}</div></div>
      <div class="col">${csnu}<div class="tarjeta"><h3>🏳 Jefe de misión</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Quien nos representa ante un organismo pesa en la relación con todos los países y en la candidatura al Consejo.</div><div class="col accion-form" style="gap:6px"><select data-arg="organismo">${misOpts.map(o => `<option value="${o.id}">${esc(o.sigla)}</option>`).join('')}</select><select data-arg="tipo"><option value="carrera">Diplomático de carrera</option><option value="politico">Político de confianza</option></select><select data-arg="pol"><option value="">— si es político, elige —</option>${opcCand(E)}</select>${UI.botonAccion('nombrarJefeMision', {})}</div></div></div></div>`;
  };

  const tratados = E => {
    const conT = Object.entries(E.diplomacia.paises).filter(([, s]) => s.tratados.length);
    return `${aviso(E)}<div class="grid g2"><div class="tarjeta"><h3>🌎 Cumbre bilateral</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Sólo el Presidente. Sube bastante la relación con un país.</div><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="pais" style="max-width:100%">${opcPaises(E)}</select>${UI.botonAccion('cumbreBilateral', {})}</div>
        <h3 style="margin-top:14px">📜 Firmar tratado</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Cooperación (educación) o defensa (seguridad). Los TLC se negocian en Comercio exterior.</div><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="pais" style="max-width:100%">${opcPaises(E)}</select><select data-arg="tipo">${Object.entries(D().TRATADOS).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>${UI.botonAccion('firmarTratado', {})}</div>
        <h3 style="margin-top:14px">🥂 Cuerpo diplomático</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Una cena con los embajadores acreditados calienta la relación con los países más fríos.</div>${UI.botonAccion('cenaDiplomatica', {})}</div>
      <div class="tarjeta"><h3>Tratados vigentes</h3>${conT.length ? `<div class="lista">${conT.map(([id, s]) => `<div class="it"><div class="cuerpo"><b>${esc(X().nombre(id))}</b><span>${s.tratados.map(t => esc(D().TRATADOS[t])).join(' · ')}</span></div><span class="etq" style="background:${colRel(s.relacion)}22;color:${colRel(s.relacion)}">${Math.round(s.relacion)}%</span></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">Aún no hay tratados firmados en esta partida.</div>'}</div></div>`;
  };

  const historial = E => {
    const x = X().asegurar(E);
    return `<div class="tarjeta"><h3>Actuaciones del servicio exterior</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Incidentes diplomáticos en esta partida: ${x.incidentes}.</div>${x.historial.length ? `<div class="lista">${x.historial.map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(h.txt)}</b><span>${esc(U.fmtT(h.t))}</span></div></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">Sin actuaciones todavía.</div>'}</div>`;
  };

  const TABS = [['panorama', 'Panorama', panorama], ['embajadas', 'Embajadas', embajadas], ['consulados', 'Diáspora', consulados], ['organismos', 'Organismos y ONU', organismos], ['tratados', 'Tratados y cumbres', tratados], ['historial', 'Historial', historial]];
  C.Pantallas.diplomacia = {
    render(el, params) {
      const E = C.E; X().asegurar(E);
      const tab = (params && params.tab) || E.ui.dipTab || 'panorama'; E.ui.dipTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Diplomacia</h1><div class="sub">Embajadas, consulados, organismos y tratados: cómo se ve Colombia desde afuera y qué tanto puede hacer allá.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('diplomacia', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
