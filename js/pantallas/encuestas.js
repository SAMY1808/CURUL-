/* Encuestas: promedio ponderado con bandas de error, aprobación y rumbo, intención de voto por partido
   y por candidato presidencial, tu imagen por segmentos, ficha de cada firma y encargo de encuestas propias. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const En = () => C.Encuestas;
  const COL_FIRMA = { invamer: '#8FB5E8', cnc: '#E8A33D', datexco: '#E0704A', gad: '#B58FE8', cifras: '#8C96A3', observatorio: '#3FBF7A' };

  /* Puntos con barra de error (margen) más línea de tendencia. series: [{nombre, color, puntos:[{t,v,m,firma,propia}], tend:[{t,v}]}] */
  const grafSondeos = (series, o = {}) => {
    const W = 640, H = o.alto || 230, pl = 40, pr = 12, pt = 10, pb = 24;
    const todos = series.flatMap(s => s.puntos);
    if (!todos.length) return '<div class="vacio">Todavía no hay encuestas publicadas</div>';
    const semanas = o.semanas || 78;
    const t1 = Math.max(...todos.map(p => p.t)), t0 = Math.max(Math.min(...todos.map(p => p.t)), t1 - semanas);
    const vis = todos.filter(p => p.t >= t0);
    let min = o.min != null ? o.min : Math.min(...vis.map(p => p.v - p.m)), max = o.max != null ? o.max : Math.max(...vis.map(p => p.v + p.m));
    const pad = (max - min) * 0.06; if (o.min == null) min = Math.max(0, min - pad); if (o.max == null) max = Math.min(100, max + pad);
    const x = t => pl + (t - t0) / ((t1 - t0) || 1) * (W - pl - pr), y = v => pt + (1 - (v - min) / ((max - min) || 1)) * (H - pt - pb);
    let s = `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">`;
    const paso = (max - min) > 40 ? 20 : (max - min) > 15 ? 5 : 2;
    for (let v = Math.ceil(min / paso) * paso; v <= max; v += paso) s += `<line class="rejilla" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${v}%</text>`;
    if (o.ref != null && o.ref >= min && o.ref <= max) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(o.ref)}" y2="${y(o.ref)}" stroke="#5d6c85" stroke-dasharray="4 4"/>`;
    for (const t of [t0, Math.round((t0 + t1) / 2), t1]) s += `<text x="${x(t)}" y="${H - 6}" text-anchor="${t === t0 ? 'start' : t === t1 ? 'end' : 'middle'}">${U.fmtT(t)}</text>`;
    for (const se of series) {
      const tend = se.tend.filter(p => p.t >= t0);
      for (const p of se.puntos.filter(q => q.t >= t0)) {
        const cx = x(p.t), col = p.propia ? '#FFF3C4' : (COL_FIRMA[p.firmaId] || se.color);
        s += `<g${UI.tt(`<b>${esc(p.firma)}</b>${p.propia ? ' (tuya)' : ''}<br>${esc(se.nombre)}: ${U.d1(p.v)} % ± ${U.d1(p.m)}<br>${esc(U.fmtT(p.t))}`)}><line x1="${cx}" x2="${cx}" y1="${y(p.v + p.m)}" y2="${y(p.v - p.m)}" stroke="${se.color}" stroke-opacity=".4" stroke-width="2"/><circle cx="${cx}" cy="${y(p.v)}" r="3.2" fill="${col}" stroke="${se.color}" stroke-width="1"/></g>`;
      }
      if (tend.length > 1) s += `<polyline points="${tend.map(p => x(p.t).toFixed(1) + ',' + y(p.v).toFixed(1)).join(' ')}" fill="none" stroke="${se.color}" stroke-width="2.6" stroke-linejoin="round"/>`;
    }
    return s + '</svg>' + (series.length > 1 ? `<div class="fila" style="gap:12px;flex-wrap:wrap;margin-top:6px">${series.map(se => `<span class="sigla"><i class="pto" style="background:${se.color}"></i>${esc(se.nombre)}</span>`).join('')}</div>` : '');
  };
  const conFirma = s => s.map(p => p);
  const serieDe = (E, ext, nombre, color) => {
    const E_ = C.Encuestas, pts = E_.serie(E, ext), ids = E_.publicadas(E);
    const puntos = pts.map((p, i) => Object.assign(p, { firmaId: (ids.find(e => e.t === p.t && e.firmaNombre === p.firma) || {}).firma }));
    return { nombre, color, puntos, tend: E_.tendencia(E, ext) };
  };

  const barraIncert = (v, m, color, max) => `<div class="barra-h" style="height:12px"><i style="width:${U.clamp(v, 0, max) / max * 100}%;background:${color}"></i><span style="position:absolute;left:${U.clamp(v - m, 0, max) / max * 100}%;width:${(U.clamp(v + m, 0, max) - U.clamp(v - m, 0, max)) / max * 100}%;top:5px;height:2px;background:#fff;opacity:.75"></span></div>`;

  const tablaUltimas = (E, n) => {
    const l = En().publicadas(E).slice().reverse().slice(0, n);
    return l.length ? `<table class="tabla"><thead><tr><th>Firma</th><th>Fecha</th><th>Muestra</th><th>Aprueba</th><th>Desaprueba</th><th>Margen</th></tr></thead><tbody>${l.map(e => `<tr><td><span class="sigla"><i class="pto" style="background:${COL_FIRMA[e.firma] || '#8C96A3'}"></i>${esc(e.firmaNombre)}</span>${e.cliente === 'J' ? ' <span class="etq oro">tuya</span>' : ''}${e.expuesta ? ' <span class="etq rojo">cocinada</span>' : ''}</td><td>${esc(U.fmtT(e.t))}</td><td class="num">${U.n(e.muestra)}</td><td class="num"><b>${U.d1(e.aprob.si)}</b> %</td><td class="num">${U.d1(e.aprob.no)} %</td><td class="num">± ${U.d1(e.margen)}</td></tr>`).join('')}</tbody></table>` : '<div class="tenue" style="font-size:12px">Aún no hay encuestas publicadas.</div>';
  };

  const resumen = E => {
    const En_ = En(), pr = En_.promedio(E, e => e.aprob.si), no = En_.promedio(E, e => e.aprob.no), rb = En_.promedio(E, e => e.rumbo), pv = En_.promedio(E, e => e.temas.seguridad);
    const pres = E.politicos[E.gobierno.presidente];
    const nombrePres = E.gobierno.presidente === 'J' ? E.jugador.nombre : (pres ? pres.nombre : '');
    const prob = En_.PROBLEMAS, last = En_.publicadas(E).slice(-6);
    const probs = Object.keys(prob).map(k => { const a = En_.promedio(E, e => e.problemas[k]); return { etq: prob[k], v: a ? a.v : 0 }; }).sort((a, b) => b.v - a.v);
    const temas = Object.entries(C.Opinion.TEMAS).map(([k, n]) => { const a = En_.promedio(E, e => e.temas[k]); return { etq: n, v: a ? a.v : 0, color: a && a.v >= 50 ? 'var(--si)' : 'var(--no)' }; });
    return `<div class="grid g3">
      <div class="tarjeta" style="text-align:center"><h3>Aprobación de ${esc(nombrePres)}</h3>${pr ? G.medidor(pr.v, { tam: 190, etq: 'PROMEDIO DE ENCUESTAS', texto: U.d1(pr.v) + '%' }) : '<div class="vacio">Sin datos</div>'}
        <div class="tenue" style="font-size:12px">${pr ? `± ${U.d1(pr.margen)} · ${pr.n} encuestas recientes · desaprueba ${no ? U.d1(no.v) : '—'} %` : ''}</div></div>
      <div class="tarjeta"><h3>¿El país va por buen camino?</h3>${rb ? `<div style="display:flex;justify-content:center">${G.medidor(rb.v, { tam: 150, etq: 'BUEN CAMINO', texto: Math.round(rb.v) + '%' })}</div><div class="tenue" style="font-size:12px;text-align:center">${Math.round(100 - rb.v)} % cree que el rumbo es equivocado o no sabe</div>` : '<div class="vacio">Sin datos</div>'}</div>
      <div class="tarjeta"><h3>Aprobación por tema</h3>${G.barrasH(temas, { max: 100, fmt: v => Math.round(v) + '%', anchoEtq: '130px' })}</div>
    </div>
    <div class="grid g-dash" style="margin-top:14px">
      <div class="tarjeta"><h3>Aprobación del Presidente · cada punto es una encuesta</h3>${grafSondeos([serieDe(E, e => e.aprob.si, 'Aprueba', '#3FBF7A'), serieDe(E, e => e.aprob.no, 'Desaprueba', '#E0504A')], { ref: 50, alto: 240 })}
        <div class="tenue" style="font-size:11.5px;margin-top:4px">La línea es el promedio ponderado por muestra y reputación de la firma. Las barras verticales son el margen de error.</div></div>
      <div class="col"><div class="tarjeta"><h3>Lo que más preocupa</h3>${G.barrasH(probs.map(p => ({ etq: p.etq, v: p.v, color: 'var(--oro)' })), { fmt: v => Math.round(v) + '%', anchoEtq: '150px' })}</div></div>
    </div>
    <div class="tarjeta" style="margin-top:14px"><h3>Últimas encuestas</h3>${tablaUltimas(E, 8)}</div>`;
  };

  const partidos = E => {
    const En_ = En(), ps = Object.values(E.partidos).filter(p => !p.especial && !p.futuro).map(p => { const a = En_.promedio(E, e => e.partidos[p.id]), b = En_.promedio(E, e => e.partidos[p.id], 60); return { p, a, tend: En_.tendencia(E, e => e.partidos[p.id], 10) }; }).filter(x => x.a).sort((a, b) => b.a.v - a.a.v);
    if (!ps.length) return '<div class="tarjeta"><div class="vacio">Todavía no hay encuestas publicadas</div></div>';
    const max = Math.max(...ps.map(x => x.a.v + 2), 5), ind = En_.promedio(E, e => e.indecisos);
    return `<div class="tarjeta"><h3>Intención de voto al Congreso</h3><div class="tenue" style="font-size:12px;margin-bottom:10px">Promedio de las últimas 10 semanas sobre el total de encuestados; la marca blanca es el margen de error. ${ind ? `Indecisos: ${U.d1(ind.v)} %.` : ''}</div>
      <table class="tabla"><thead><tr><th>Partido</th><th style="width:46%">Intención</th><th>Tendencia</th><th>vs. hace 6 meses</th></tr></thead><tbody>${ps.map(({ p, a, tend }) => {
        const viejo = tend.filter(t => t.t <= E.fecha.t - 22).pop(), ant = viejo ? viejo.v : null, d = ant != null ? a.v - ant : null;
        return `<tr><td><span class="sigla"><i class="pto" style="background:${p.color}"></i>${esc(p.nombre)}</span>${p.id === E.jugador.partido ? ' <span class="etq oro">Tu partido</span>' : ''}${p.id === E.gobierno.partido ? ' <span class="etq">Gobierno</span>' : ''}</td>
        <td><div style="display:grid;grid-template-columns:1fr 60px;gap:8px;align-items:center">${barraIncert(a.v, a.margen * Math.sqrt(Math.max(0.2, a.v / 50)), p.color, max)}<span class="num">${U.d1(a.v)} %</span></div></td>
        <td>${tend.length > 2 ? G.sparkline(tend.slice(-26).map(t => [t.t, t.v]), p.color, 90, 24) : ''}</td><td class="num ${d == null ? '' : d > 0.3 ? 'bien' : d < -0.3 ? 'mal' : 'tenue'}">${d == null ? '—' : (d > 0 ? '▲ +' : d < 0 ? '▼ ' : '') + U.d1(d)}</td></tr>`; }).join('')}</tbody></table></div>`;
  };

  const presidencial = E => {
    const En_ = En();
    if (!En_.hayPresidencial(E)) return '<div class="tarjeta"><h3>Carrera presidencial</h3><div class="tenue" style="font-size:12.5px">Todavía faltan más de dos años para las presidenciales: las firmas no miden aún intención de voto por candidato.</div></div>';
    const ult = En_.publicadas(E).filter(e => e.pres).slice(-6);
    if (!ult.length) return '<div class="tarjeta"><div class="vacio">La primera medición saldrá en las próximas semanas</div></div>';
    const pols = {}; for (const e of ult) for (const c of e.pres) pols[c.pol] = c;
    const lista = Object.values(pols).map(c => { const a = En_.promedio(E, e => { const x = e.pres && e.pres.find(k => k.pol === c.pol); return x ? x.pct : null; }, 12); return { c, a }; }).filter(x => x.a).sort((a, b) => b.a.v - a.a.v);
    const cols = ['#D9B45A', '#6CC4F5', '#E0504A', '#3FBF7A', '#B58FE8', '#E8A33D'];
    const series = lista.slice(0, 4).map((x, i) => serieDe(E, e => { const k = e.pres && e.pres.find(z => z.pol === x.c.pol); return k ? k.pct : null; }, x.c.nombre, cols[i]));
    const max = Math.max(...lista.map(x => x.a.v + 3), 10);
    return `<div class="grid g-dash"><div class="tarjeta"><h3>Carrera presidencial · primera vuelta</h3><div class="lista">${lista.map(({ c, a }, i) => { const pa = E.partidos[c.partido]; return `<div class="it"><span style="font-size:14px;width:20px;text-align:center;color:var(--tenue)">${i + 1}</span><div class="cuerpo" style="flex:1"><b>${esc(c.nombre)}${c.pol === 'J' ? ' <span class="etq oro">tú</span>' : ''}</b><span>${pa ? esc(pa.sigla) : ''}</span>${barraIncert(a.v, a.margen * 0.6, pa ? pa.color : '#8C96A3', max)}</div><span class="num" style="font-size:16px">${U.d1(a.v)} %</span></div>`; }).join('')}</div>
      <div class="tenue" style="font-size:11.5px;margin-top:6px">Con dos candidatos por encima del 50 % a favor gana en primera; si no, hay segunda vuelta entre los dos más votados.</div></div>
      <div class="tarjeta"><h3>Evolución de los cuatro primeros</h3>${grafSondeos(series, { alto: 260 })}</div></div>`;
  };

  const imagen = E => {
    const En_ = En(), J = E.jugador, fav = En_.promedio(E, e => e.jugador.fav, 16), rec = En_.promedio(E, e => e.jugador.rec, 16);
    const det = En_.publicadas(E).filter(e => Object.keys(e.segmentos || {}).length).slice(-1)[0];
    const segs = det ? Object.entries(C.Opinion.SEGMENTOS).map(([dim, xs]) => `<div><h4 class="sub-h" style="margin-top:0">${esc(C.Opinion.DIM[dim])}</h4>${G.barrasH(xs.map(s => ({ etq: s[1], v: det.segmentos[s[0]] || 0, color: (det.segmentos[s[0]] || 0) >= 50 ? 'var(--si)' : 'var(--no)' })), { max: 100, fmt: v => Math.round(v) + '%', anchoEtq: '110px' })}</div>`).join('') : '';
    return `<div class="grid g3"><div class="tarjeta" style="text-align:center"><h3>Tu favorabilidad</h3>${fav ? G.medidor(fav.v, { tam: 160, etq: 'FAVORABLE', texto: Math.round(fav.v) + '%' }) : '<div class="vacio">Sin datos</div>'}</div>
      <div class="tarjeta" style="text-align:center"><h3>Te conocen</h3>${rec ? G.medidor(rec.v, { tam: 160, etq: 'RECONOCIMIENTO', texto: Math.round(rec.v) + '%', color: 'var(--oro)' }) : '<div class="vacio">Sin datos</div>'}</div>
      <div class="tarjeta"><h3>Realidad vs. encuesta</h3><div class="lista"><div class="it"><div class="cuerpo"><b>Favorabilidad real</b><span>Lo que en verdad piensa el país</span></div><span class="num">${Math.round(J.popularidad)}%</span></div><div class="it"><div class="cuerpo"><b>Reconocimiento real</b><span></span></div><span class="num">${Math.round(J.reconocimiento)}%</span></div></div></div></div>
    <div class="tarjeta" style="margin-top:14px"><h3>Tu imagen por segmentos${det ? ' · ' + esc(det.firmaNombre) + ', ' + esc(U.fmtT(det.t)) : ''}</h3>${det ? `<div class="grid g3">${segs}</div>` : '<div class="tenue" style="font-size:12px">Aún no hay una encuesta con detalle por segmentos.</div>'}</div>
    <div class="tarjeta" style="margin-top:14px"><h3>Tu favorabilidad en el tiempo</h3>${grafSondeos([serieDe(E, e => e.jugador.fav, 'Favorable', '#D9B45A')], { alto: 200 })}</div>`;
  };

  const firmas = E => {
    const En_ = En(), q = En_.asegurar(E);
    return `<div class="tarjeta"><h3>Firmas encuestadoras</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">La reputación sube o baja según qué tan cerca quedaron de los resultados reales de cada elección. Una firma con mala reputación pesa menos en el promedio.</div>
      <table class="tabla"><thead><tr><th>Firma</th><th>Muestra</th><th>Margen</th><th>Sesgo</th><th style="width:22%">Reputación</th><th>Error histórico</th></tr></thead><tbody>${C.DATA.encuestadoras.map(f => { const fr = q.firmas[f.id], err = fr.errores.length ? U.prom(fr.errores.map(x => x.err)) : null, n = En_.publicadas(E).filter(e => e.firma === f.id).length;
        return `<tr><td><span class="sigla"><i class="pto" style="background:${COL_FIRMA[f.id]}"></i>${esc(f.nombre)}</span><div class="tenue" style="font-size:11.5px;white-space:normal;max-width:330px">${esc(f.estilo)}</div></td><td class="num">${U.n(f.muestra)}</td><td class="num">± ${U.d1(En_.margen(f.muestra))}</td>
        <td style="font-size:12px">${f.sesgoGob > 0.7 ? 'Pro Gobierno' : f.sesgoGob < -0.7 ? 'Crítica del Gobierno' : 'Neutral'}${f.sesgoEco > 1.5 ? ' · derecha' : f.sesgoEco < -1.5 ? ' · izquierda' : ''}</td>
        <td>${G.barrasH([{ etq: '', v: fr.rep, color: fr.rep >= 65 ? 'var(--si)' : fr.rep >= 45 ? 'var(--alerta)' : 'var(--no)' }], { max: 100, anchoEtq: '0px', anchoValor: '34px', fmt: v => Math.round(v) })}</td>
        <td class="num">${err != null ? '± ' + U.d1(err) + ' pts' : '<span class="tenue">sin elecciones aún</span>'}<div class="tenue" style="font-size:11px">${n} encuestas publicadas</div></td></tr>`; }).join('')}</tbody></table></div>`;
  };

  const encargar = E => {
    const q = En().asegurar(E), J = E.jugador, F = C.DATA.encuestadoras;
    return `<div class="grid g2"><div class="tarjeta"><h3>Encargar una encuesta</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Pagas de tu efectivo (${U.cop(J.patrimonio)}). Una muestra grande baja el margen de error. Si la pides «a tu favor» —inflando tu imagen— y la publicas, puede descubrirse: cuanto menos confiable la firma, más riesgo. Una encuesta que no publicas queda sólo para ti.</div>
      <div class="col accion-form" style="gap:8px"><label class="tenue" style="font-size:11px">Firma</label><select data-arg="firma">${F.map(f => `<option value="${f.id}">${esc(f.nombre)} · ${U.cop(f.precio)} por cada 1.000</option>`).join('')}</select>
        <label class="tenue" style="font-size:11px">Tamaño de la muestra</label><select data-arg="muestra">${En().MUESTRAS.map(n => `<option value="${n}" ${n === 1000 ? 'selected' : ''}>${U.n(n)} personas · ± ${U.d1(En().margen(n))}</option>`).join('')}</select>
        <label class="tenue" style="font-size:11px">Enfoque</label><select data-arg="modo"><option value="honesta">Honesta</option><option value="favor">A mi favor (cuesta 50 % más)</option></select>
        <label class="tenue" style="font-size:11px">¿Publicarla?</label><select data-arg="publicar"><option value="si">Sí, publicarla</option><option value="no">No, sólo para mí</option></select>
        <div>${UI.botonAccion('encargarEncuesta', {})}</div></div></div>
      <div class="tarjeta"><h3>Tus encuestas privadas</h3>${q.privadas.length ? `<div class="lista">${q.privadas.map(e => `<div class="it"><div class="cuerpo"><b>${esc(e.firmaNombre)} · ${esc(U.fmtT(e.t))}${e.empuje ? ' · a tu favor' : ''}</b><span style="white-space:normal">Favorable ${Math.round(e.jugador.fav)} % · reconocimiento ${Math.round(e.jugador.rec)} % · aprobación del Presidente ${U.d1(e.aprob.si)} % (± ${U.d1(e.margen)})${e.pres ? ' · lidera ' + esc(e.pres[0].nombre) + ' ' + U.d1(e.pres[0].pct) + ' %' : ''}</span></div></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">Aún no tienes encuestas privadas.</div>'}</div></div>`;
  };

  const TABS = [['resumen', 'Resumen', resumen], ['partidos', 'Partidos', partidos], ['presidencial', 'Carrera presidencial', presidencial], ['imagen', 'Mi imagen', imagen], ['firmas', 'Firmas', firmas], ['encargar', 'Encargar', encargar]];
  C.Pantallas.encuestas = {
    render(el, params) {
      const E = C.E; En().asegurar(E);
      const tab = (params && params.tab) || E.ui.encTab || 'resumen'; E.ui.encTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Encuestas</h1><div class="sub">Seis firmas miden al país con muestras, márgenes y sesgos distintos. Ninguna es la verdad: el promedio se acerca más.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('encuestas', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
