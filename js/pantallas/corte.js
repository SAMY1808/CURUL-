/* Corte Constitucional: magistrados, vacantes y ternas, demandas y fallos, leyes demandables y
   mandatos de estado de cosas inconstitucional. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const COLOR_RES = { exequible: 'verde', condicionada: 'amar', inexequible: 'rojo', inhibida: '' };
  const etqIdeo = m => `${Comp.etiquetaIdeo(m.eco)} · ${m.soc > 25 ? 'conservador' : m.soc < -25 ? 'progresista' : 'moderado'}`;

  const magistrados = E => {
    const K = C.Corte, c = E.corte, med = K.mediana(E);
    const pres = E.gobierno.presidente === 'J' ? E.jugador.ideologia : E.politicos[E.gobierno.presidente];
    const puntos = c.magistrados.map(m => ({ x: m.eco, y: m.soc, r: 6 + m.activismo / 14, color: '#8FB5E8', op: .85, etq: m.nombre.split(' ')[0], tt: `<b>${esc(m.nombre)}</b><br>${esc(etqIdeo(m))}<br>Activismo ${m.activismo} · prestigio ${m.prestigio}` }));
    puntos.push({ x: med.eco, y: med.soc, r: 8, color: '#FFF3C4', borde: '#D9B45A', bw: 3, tt: 'Mediana de la Corte' });
    if (pres) puntos.push({ x: pres.eco, y: pres.soc, r: 6, color: '#E0504A', tt: 'Presidente' });
    const tension = c.tension;
    const vacantes = c.vacantes.map(v => vacante(E, v)).join('');
    return `<div class="grid g4">
      ${Comp.kpi('Mediana de la Corte', esc(Comp.etiquetaIdeo(med.eco)), `<span class="tenue">${med.soc > 25 ? 'conservadora' : med.soc < -25 ? 'progresista' : 'moderada'} en lo social</span>`)}
      ${Comp.kpi('Activismo medio', Math.round(K.activismoMedio(E)) + '/100', '<span class="tenue">propensión a intervenir</span>')}
      ${Comp.kpi('Tensión con el Ejecutivo', Math.round(tension) + '/100', `<span class="${tension > 55 ? 'mal' : 'tenue'}">${tension > 55 ? 'fallos más duros contra el Gobierno' : 'relación institucional normal'}</span>`)}
      ${Comp.kpi('Vacantes', c.vacantes.length, '<span class="tenue">período de 8 años, elige el Senado</span>')}
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div class="tarjeta"><h3>Mapa ideológico de la Corte</h3><div style="display:flex;justify-content:center">${G.plano(puntos, { tam: 340 })}</div>
        <div class="tenue" style="font-size:12px;text-align:center">Tamaño = activismo. En dorado, la mediana; en rojo, tu Presidente.</div></div>
      <div class="tarjeta"><h3>Los nueve magistrados</h3><div class="lista">${c.magistrados.slice().sort((a, b) => a.hasta - b.hasta).map(m => `<div class="it">${Comp.avatar(E, m, 34)}<div class="cuerpo"><b>${esc(m.nombre)}</b><span class="tenue">${esc(etqIdeo(m))} · activismo ${m.activismo} · terna de ${esc(K.PROPONENTES[m.proponente])} · hasta ${esc(U.fmtT(m.hasta, false))}</span></div></div>`).join('')}</div></div>
    </div>${vacantes}`;
  };

  const vacante = (E, v) => {
    const K = C.Corte, esJ = E.gobierno.presidente === 'J';
    let cuerpo = '';
    if (v.estado === 'terna' && v.proponente === 'presidente' && esJ && v.opciones) {
      const ops = v.opciones, opt = i => ops.map((o, k) => `<option value="${o.id}" ${k === i ? 'selected' : ''}>${esc(o.nombre)} · ${esc(Comp.etiquetaIdeo(o.eco))} · activismo ${o.activismo}</option>`).join('');
      cuerpo = `<div class="tenue" style="font-size:12px;margin-bottom:8px">Te corresponde armar la terna: tres nombres. El Senado elegirá al que más apoyo reúna, así que uno demasiado cercano a ti puede perder frente a uno más moderado. Tienes ${Math.max(0, v.limite - E.fecha.t)} semanas o el Consejo lo arma por ti.</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="a">${opt(0)}</select><select data-arg="b">${opt(1)}</select><select data-arg="c">${opt(2)}</select>${UI.botonAccion('proponerTerna', { vacante: v.id })}</div>`;
    } else if (v.estado === 'terna') cuerpo = `<div class="tenue" style="font-size:12px">${esc(K.PROPONENTES[v.proponente])} arma la terna.</div>`;
    else cuerpo = `<div class="tenue" style="font-size:12px;margin-bottom:6px">Terna de ${esc(K.PROPONENTES[v.proponente])}; el Senado vota en ${Math.max(0, v.votaSenado - E.fecha.t)} semanas.</div><div class="lista">${v.terna.map(m => `<div class="it">${Comp.avatar(E, m, 30)}<div class="cuerpo"><b>${esc(m.nombre)}</b><span class="tenue">${esc(etqIdeo(m))} · apoyo esperado en el Senado ${Math.round(K.apoyoSenado(E, m) * 100)}%</span></div></div>`).join('')}</div>`;
    return `<div class="tarjeta" style="margin-top:14px"><div class="t-cab"><h3>Vacante: ${esc(v.saliente)}</h3><span class="etq oro">${v.estado === 'terna' ? 'Terna pendiente' : 'En el Senado'}</span></div>${cuerpo}</div>`;
  };

  const expedientes = E => {
    const K = C.Corte, c = E.corte;
    const abiertas = c.demandas.filter(d => d.estado === 'admitida').sort((a, b) => a.resolverEn - b.resolverEn);
    const fallos = c.fallos.slice().reverse().slice(0, 14);
    return `<div class="tarjeta"><h3>Demandas en estudio</h3>${abiertas.length ? `<table class="tabla"><thead><tr><th>Ley</th><th>Demandante</th><th>Vicio</th><th>Riesgo</th><th>Fallo en</th></tr></thead><tbody>${abiertas.map(d => `<tr><td><b>${esc(d.titulo)}</b></td><td>${esc(K.DEMANDANTES[d.demandante])}</td><td>${d.vicio === 'tramite' ? 'De trámite' : 'De fondo'}</td><td><span class="etq ${d.riesgo < 0.15 ? 'verde' : d.riesgo < 0.3 ? 'amar' : 'rojo'}">${Math.round(d.riesgo * 100)}%</span></td><td class="num">${Math.max(0, d.resolverEn - E.fecha.t)} sem.</td></tr>`).join('')}</tbody></table>` : '<div class="tenue" style="font-size:12px">No hay demandas contra leyes en este momento.</div>'}</div>
      <div class="tarjeta" style="margin-top:14px"><h3>Fallos recientes</h3>${fallos.length ? `<div class="lista">${fallos.map(f => `<div class="it"><span class="etq ${COLOR_RES[f.resultado] || ''}">${esc(K.RESULTADOS[f.resultado] || f.resultado)}</span><div class="cuerpo"><b>${esc(f.titulo)}</b><span class="tenue">${{ ley: 'Ley', tratado: 'Tratado', reforma: 'Reforma constitucional', objecion: 'Objeción presidencial' }[f.tipo] || f.tipo} · ${esc(U.fmtT(f.t))}${f.demandante ? ' · demandó ' + esc(K.DEMANDANTES[f.demandante]) : ''}</span></div>${(f.resultado === 'inexequible' || f.resultado === 'condicionada') ? (f.criticado ? '<span class="etq">Criticado</span>' : UI.botonAccion('criticarFallo', { fallo: f.id }, null, 'chico')) : ''}</div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">Aún no hay fallos en esta partida.</div>'}</div>`;
  };

  const leyes = E => {
    const K = C.Corte, c = E.corte;
    const ls = c.recientes.map(id => E.proyectos[id]).filter(p => p && p.estado === 'ley').reverse().slice(0, 14);
    return `<div class="tarjeta"><h3>Leyes recientes</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Cualquier ciudadano puede demandar una ley. El riesgo estima la probabilidad de que la Corte la tumbe si la demandan; cuanto más lejos esté su orientación de la mayoría de los magistrados, mayor.</div>
      ${ls.length ? `<div class="lista">${ls.map(p => { const s = K.semaforo(E, p), d = K.demandaDe(E, p.id); return `<div class="it"><div class="cuerpo"><b>${esc(p.titulo)}</b><span class="tenue">Ley ${p.ley}${p.gobierno ? ' · del Gobierno' : ''}${p.autor === 'J' ? ' · tuya' : ''} · ${d ? (d.estado === 'admitida' ? 'demanda en estudio' : 'ya fallada: ' + esc(K.RESULTADOS[d.resultado] || '')) : 'sin demanda'}</span></div><span class="etq ${s.clase}">${s.nivel} · ${Math.round(s.riesgo * 100)}%</span>${d ? '' : UI.botonAccion('demandarLey', { proyecto: p.id }, null, 'chico')}</div>`; }).join('')}</div>` : '<div class="tenue" style="font-size:12px">Aún no hay leyes recientes.</div>'}</div>`;
  };

  const mandatos = E => {
    const K = C.Corte, c = E.corte;
    const lista = c.mandatos.slice().reverse();
    return `<div class="tarjeta"><h3>Estado de cosas inconstitucional</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Cuando un sector lleva años abandonado, la Corte le da un plazo al Gobierno. Se cumple subiendo su presupuesto (5 % sobre su peso base) o mejorando el indicador en 2 puntos; si no, abre incidente de desacato.</div>
      ${lista.length ? `<div class="lista">${lista.map(m => { const cfg = K.ECI[m.sector], r = K.cumplimiento(E, m), idx = K.promedioIndice(E, cfg.indice); return `<div class="it" style="align-items:flex-start"><span style="font-size:20px">${cfg.icono}</span><div class="cuerpo"><b>${esc(cfg.nombre)}</b><span class="tenue">Indicador ${U.d1(m.base)} → ${U.d1(idx)} · presupuesto ${r.presupuesto ? 'suficiente' : 'insuficiente'}${m.estado === 'vigente' ? ` · ${Math.max(0, m.t + m.plazo - E.fecha.t)} sem. restantes` : ''}</span></div><span class="etq ${m.estado === 'vigente' ? 'amar' : m.estado === 'cumplido' ? 'verde' : 'rojo'}">${{ vigente: 'Vigente', cumplido: 'Cumplido', desacato: 'Desacato' }[m.estado]}</span></div>`; }).join('')}</div>` : '<div class="tenue" style="font-size:12px">La Corte no ha declarado ningún estado de cosas inconstitucional.</div>'}</div>`;
  };

  C.Pantallas.corte = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.corteTab || 'magistrados';
      E.ui.corteTab = tab;
      const tabs = [['magistrados', 'Magistrados'], ['expedientes', 'Demandas y fallos'], ['leyes', 'Leyes demandables'], ['mandatos', 'Mandatos'], ['control', 'Órganos de control']];
      const cuerpo = { magistrados, expedientes, leyes, mandatos, control: C.Pantallas.controlTab }[tab](E);
      el.innerHTML = `<div class="cab"><div><h1>Corte Constitucional</h1><div class="sub">Nueve magistrados que controlan leyes, tratados y reformas. Sus fallos pueden tumbar lo que apruebe el Congreso.</div></div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div style="margin-top:14px">${cuerpo}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('corte', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
