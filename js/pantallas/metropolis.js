/* Áreas metropolitanas: mapa del país con todas las conurbaciones y mapa detallado de cada una dibujado con los polígonos de
   sus municipios; indicadores, junta metropolitana, proyectos, sobretasa, anexiones, empresa propia y comparación. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const Me = () => C.Metro, MU = () => C.DATA.municipios;
  const COL = { nucleo: '#D9B45A', miembro: '#4C7FE0', miembroDe: '#3b5a96', aspirante: '#9b7ad6', vecino: '#142038', tramite: '#E8A33D' };
  const ESTADO = { conurbacion: ['Conurbación sin gobierno', 'rojo'], tramite: ['En trámite', 'amar'], constituida: ['Constituida', 'verde'] };
  const bbCache = {};
  const bbox = code => {
    if (bbCache[code]) return bbCache[code];
    const m = MU()[code]; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, r; const re = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g;
    while ((r = re.exec(m.d))) { const x = +r[1], y = +r[2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return bbCache[code] = [x0, y0, x1, y1];
  };
  const heat = (v, mx) => { const t = U.clamp(Math.log10(Math.max(1, v)) / Math.log10(Math.max(10, mx)), 0, 1); return `hsl(${Math.round(210 - t * 170)},60%,${Math.round(26 + t * 24)}%)`; };
  const bar = (v, c) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:90px;height:7px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const colI = (k, v) => k === 'tension' ? (v < 40 ? '#3FBF7A' : v < 60 ? '#E8A33D' : '#E0504A') : (v >= 62 ? '#3FBF7A' : v >= 45 ? '#E8A33D' : '#E0504A');
  const nPais = E => U.suma(Object.values(E.deptos).map(d => d.poblacion)) * 1000;

  /* Mapa detallado de un área con los polígonos de sus municipios */
  const mapaArea = (E, a, capa) => {
    const d = Me().def(a.id), codes = a.miembros.concat(a.aspirantes);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const c of codes) { const b = bbox(c); x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
    const w0 = Math.max(x1 - x0, 34), h0 = Math.max(y1 - y0, 26), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, pad = Math.max(w0, h0) * 0.16;
    const X = cx - w0 / 2 - pad, Y = cy - h0 / 2 - pad, W = w0 + pad * 2, H = h0 + pad * 2;
    const sel = E.ui.metroMuni, mx = Math.max(...codes.map(Me().pob)), fs = W / 52;
    let s = `<svg viewBox="${X.toFixed(1)} ${Y.toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}" style="width:100%;height:auto;max-height:560px;display:block;background:#0b1424;border-radius:10px">`;
    const ctx = Object.entries(MU()).filter(([c, m]) => !codes.includes(c) && m.cx > X - W * 0.1 && m.cx < X + W * 1.1 && m.cy > Y - H * 0.1 && m.cy < Y + H * 1.1);
    for (const [c, m] of ctx) s += `<path d="${m.d}" fill="${COL.vecino}" stroke="#0b1424" stroke-width="${(W / 500).toFixed(2)}"/>`;
    for (const c of codes) {
      const m = MU()[c], rol = c === d.nucleo ? 'nucleo' : a.miembros.includes(c) ? 'miembro' : 'aspirante', cons = a.estado === 'constituida';
      let fill = rol === 'nucleo' ? COL.nucleo : rol === 'miembro' ? (cons ? COL.miembro : COL.miembroDe) : COL.aspirante;
      if (capa === 'poblacion') fill = heat(Me().pob(c), mx);
      const tt = `<b>${esc(m.n)}</b><br>${U.n(Me().pob(c))} habitantes<br>${rol === 'nucleo' ? 'Núcleo del área' : rol === 'miembro' ? (cons ? 'Miembro' : 'Parte de la conurbación') : 'Aspirante a sumarse'}`;
      s += `<path data-muni="${c}" d="${m.d}" fill="${fill}" fill-opacity="${rol === 'aspirante' ? 0.65 : 0.92}" stroke="${c === sel ? '#fff' : 'rgba(5,10,20,.8)'}" stroke-width="${c === sel ? (W / 180).toFixed(2) : (W / 520).toFixed(2)}" ${rol === 'aspirante' ? `stroke-dasharray="${(W / 160).toFixed(2)} ${(W / 240).toFixed(2)}"` : ''} stroke-linejoin="round" style="cursor:pointer"${UI.tt(tt)}/>`;
    }
    for (const c of codes) { const m = MU()[c], big = c === d.nucleo; s += `<text x="${m.cx}" y="${m.cy}" text-anchor="middle" style="font-size:${(big ? fs * 1.45 : fs).toFixed(2)}px;font-weight:${big ? 800 : 600};fill:#fff;paint-order:stroke;stroke:rgba(5,10,20,.85);stroke-width:${(fs * 0.22).toFixed(2)}px;pointer-events:none">${esc(m.n.length > 16 ? m.n.slice(0, 15) + '…' : m.n)}</text>`; }
    return s + '</svg>';
  };

  /* Mapa del país con todas las conurbaciones */
  const mapaPais = E => {
    const mp = C.DATA.mapa; let s = `<svg viewBox="${mp.viewBox}" style="width:100%;height:auto;max-height:560px;display:block;background:#0b1424;border-radius:10px">`;
    for (const g of Object.values(mp.deptos)) s += `<path d="${g.d}" fill="#17253f" stroke="#0b1424" stroke-width=".6"/>`;
    const sel = E.ui.metroSel || 'ABURRA';
    for (const a of Me().todas(E)) {
      const d = Me().def(a.id), col = a.estado === 'constituida' ? COL.miembro : a.estado === 'tramite' ? COL.tramite : '#5b6f99';
      for (const c of a.miembros) s += `<path d="${MU()[c].d}" fill="${c === d.nucleo ? COL.nucleo : col}" stroke="${a.id === sel ? '#fff' : 'none'}" stroke-width=".5" pointer-events="none"/>`;
      const n = MU()[d.nucleo], r = 3 + Math.sqrt(Me().poblacion(a) / 1e6) * 2.4;
      s += `<circle data-area="${a.id}" cx="${n.cx}" cy="${n.cy}" r="${r.toFixed(1)}" fill="rgba(217,180,90,.12)" stroke="${a.id === sel ? '#fff' : COL.nucleo}" stroke-width="${a.id === sel ? 1.6 : 0.8}" style="cursor:pointer"${UI.tt(`<b>${esc(d.corto)}</b><br>${U.n(Me().poblacion(a))} habitantes<br>${ESTADO[a.estado][0]}`)}/>`;
      s += `<text x="${n.cx + r + 1.5}" y="${n.cy + 2}" style="font-size:7px;font-weight:700;fill:#fff;paint-order:stroke;stroke:#0b1424;stroke-width:1.6px;pointer-events:none">${esc(d.corto)}</text>`;
    }
    return s + '</svg>';
  };

  const chips = (E, sel) => `<div class="fila" style="gap:6px;flex-wrap:wrap;margin:10px 0">${Me().todas(E).map(a => { const d = Me().def(a.id), e = ESTADO[a.estado]; return `<button class="btn chico ${a.id === sel ? 'prim' : ''}" data-area="${a.id}">${d.icono} ${esc(d.corto)}</button>`; }).join('')}</div>`;

  const indicadores = a => G.barrasH(Object.entries(Me().IND).map(([k, n]) => ({ etq: n, v: Math.round(a.indic[k]), color: colI(k, a.indic[k]) })), { max: 100, fmt: v => v, anchoEtq: '130px' });

  const fichaMuni = (E, a) => {
    const c = E.ui.metroMuni; if (!c || !(a.miembros.includes(c) || a.aspirantes.includes(c))) return '';
    const d = Me().def(a.id), m = MU()[c], rol = c === d.nucleo ? 'Núcleo' : a.miembros.includes(c) ? 'Miembro' : 'Aspirante', al = a.miembros.includes(c) ? Me().alcalde(E, a, c) : null, gest = Me().esGestor(E, a.id);
    const dp = C.DATA.departamentos.find(x => x.id === m.dp);
    return `<div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>${esc(m.n)}</h3><span class="etq">${rol}</span></div>
      <div class="tt-f"><span class="tenue">Habitantes</span><b>${U.n(Me().pob(c))}</b></div><div class="tt-f"><span class="tenue">Departamento</span><b>${esc(dp ? dp.nombre : m.dp)}</b></div><div class="tt-f"><span class="tenue">Peso en el área</span><b>${U.d1(Me().pob(c) / Math.max(1, Me().poblacionTotal(a)) * 100)} %</b></div>
      ${al ? `<div class="tt-f"><span class="tenue">Alcalde</span><b>${esc(al.nombre)}${E.partidos[al.partido] ? ' · ' + esc(E.partidos[al.partido].sigla) : ''}</b></div><div class="tt-f"><span class="tenue">Cercanía contigo</span>${bar(U.clamp(50 + al.afin / 2, 0, 100), '#7fa8e8')}</div>` : ''}
      <div class="fila" style="gap:6px;margin-top:8px;flex-wrap:wrap">${gest && al && !al.mio ? UI.botonAccion('cabildearAlcaldeMetropolitano', { area: a.id, code: c }, 'Cabildear al alcalde', 'chico') : ''}${gest && rol === 'Aspirante' ? UI.botonAccion('anexarMunicipio', { area: a.id, code: c }, 'Proponer la anexión', 'chico') : ''}</div></div>`;
  };

  const tabMapa = E => {
    const sel = E.ui.metroSel || 'ABURRA', a = Me().area(E, sel), d = Me().def(sel), capa = E.ui.metroCapa || 'estado', gest = Me().esGestor(E, sel), pob = Me().poblacion(a);
    const est = ESTADO[a.estado];
    const accionEstado = a.estado === 'conurbacion' ? `<div class="resultado-jugador no" style="margin:10px 0"><div style="font-size:24px">🚧</div><div><b>Conurbación sin gobierno propio</b><div class="tenue" style="font-size:12.5px">Los municipios funcionan como una sola ciudad, pero cada uno decide solo: la movilidad, el aire y los servicios se degradan. Constituirla exige el aval de los concejos y una consulta popular.</div>${gest ? `<div style="margin-top:8px">${UI.botonAccion('promoverAreaMetropolitana', { area: a.id }, 'Promover el área metropolitana', 'prim')}</div>` : ''}</div></div>`
      : a.estado === 'tramite' ? `<div class="resultado-jugador ok" style="margin:10px 0"><div style="font-size:24px">🗳</div><div><b>Trámite en curso</b><div class="tenue" style="font-size:12.5px">${a.consulta ? 'La consulta popular avanza en <a href="#" data-ir="participacion">Democracia directa</a>.' : 'Los alcaldes impulsan la consulta: pronto se sabrá.'}</div></div></div>` : '';
    return `<div class="tarjeta"><h3>Las grandes conurbaciones de Colombia</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Cada mancha es un conjunto de municipios que funciona como una sola ciudad. Azul: área constituida · gris: conurbación de hecho · naranja: en trámite. Toca un círculo para ver su detalle.</div>${mapaPais(E)}</div>
      ${chips(E, sel)}
      <div class="grid g4">${Comp.kpi('Población', U.n(pob), `<span class="tenue">${U.d1(pob / nPais(E) * 100)} % del país</span>`)}${Comp.kpi('Municipios', a.miembros.length, `<span class="tenue">${a.aspirantes.length} aspirante${a.aspirantes.length === 1 ? '' : 's'}</span>`)}${Comp.kpi('Estado', `<span style="font-size:20px">${est[0]}</span>`, `<span class="tenue">${a.desde ? 'desde ' + U.fmtT(a.desde) : d.fundada ? '' : 'sin institución'}</span>`)}${Comp.kpi('Integración', Math.round(a.indic.integracion) + '%', '<span class="tenue">qué tan unida actúa</span>')}</div>
      <div class="tarjeta" style="margin-top:14px"><div class="t-cab"><h3>${d.icono} ${esc(d.n)}</h3><div class="fila" style="gap:6px"><button class="btn chico ${capa === 'estado' ? 'prim' : ''}" data-capa="estado">Estado</button><button class="btn chico ${capa === 'poblacion' ? 'prim' : ''}" data-capa="poblacion">Población</button></div></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:8px">${esc(d.nota)}</div>${accionEstado}
        <div class="grid g-dash" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div>${mapaArea(E, a, capa)}<div class="fila" style="gap:10px;margin-top:6px;font-size:11.5px;flex-wrap:wrap"><span><i class="pto" style="background:${COL.nucleo}"></i> Núcleo</span><span><i class="pto" style="background:${a.estado === 'constituida' ? COL.miembro : COL.miembroDe}"></i> ${a.estado === 'constituida' ? 'Miembro' : 'Conurbación'}</span><span><i class="pto" style="background:${COL.aspirante}"></i> Aspirante</span><span><i class="pto" style="background:${COL.vecino}"></i> Vecinos</span></div></div>
          <div><h4 class="sub-h" style="margin:0 0 6px">Indicadores</h4>${indicadores(a)}${fichaMuni(E, a)}</div></div></div>`;
  };

  const tabGobierno = E => {
    const sel = E.ui.metroSel || 'ABURRA', a = Me().area(E, sel), d = Me().def(sel), gest = Me().esGestor(E, sel), cons = a.estado === 'constituida', tot = U.suma(a.miembros.map(Me().pob)) || 1;
    const junta = `<table class="tabla"><thead><tr><th>Municipio</th><th>Alcalde</th><th>Partido</th><th>Peso</th><th>Cercanía</th><th></th></tr></thead><tbody>${a.miembros.map(c => { const al = Me().alcalde(E, a, c), peso = Math.min(0.4, Me().pob(c) / tot); return `<tr><td><b>${esc(Me().nombreMuni(c))}</b></td><td>${esc(al.nombre)}${al.mio ? ' <span class="etq oro">tú</span>' : ''}</td><td>${E.partidos[al.partido] ? esc(E.partidos[al.partido].sigla) : '—'}</td><td class="num">${Math.round(peso * 100)} %</td><td>${bar(U.clamp(50 + al.afin / 2, 0, 100), '#7fa8e8')}</td><td>${gest && !al.mio ? UI.botonAccion('cabildearAlcaldeMetropolitano', { area: a.id, code: c }, '🤝', 'chico') : ''}</td></tr>`; }).join('')}</tbody></table>`;
    if (!cons) return `${chips(E, sel)}<div class="tarjeta"><h3>Junta de alcaldes · ${esc(d.corto)}</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Aún no hay área constituida, pero los alcaldes pesan en la consulta: cuanto más cercanos estén a tu propuesta, más fácil el aval de los concejos.</div>${junta}${gest && a.estado === 'conurbacion' ? `<div style="margin-top:10px">${UI.botonAccion('promoverAreaMetropolitana', { area: a.id }, 'Promover el área metropolitana', 'prim')}</div>` : ''}</div>`;
    const ig = Me().ingresos(E, a), ing = U.d1((ig.total - ig.servicio) * 52), deuda = a.caja.deuda || 0;
    const proys = a.proyectos.map(p => { const P = Me().PROYECTOS[p.tipo]; return `<div class="it"><div class="cuerpo"><b>${P.icono} ${esc(P.n)}</b><span>${p.resta} semanas para terminar</span></div></div>`; }).join('');
    const opP = Object.entries(Me().PROYECTOS).filter(([k]) => !a.proyectos.some(p => p.tipo === k)).map(([k, P]) => `<option value="${k}">${P.icono} ${esc(P.n)} · ${P.costo} bill. · ${P.sem} sem.</option>`).join('');
    const emp = a.empresa ? C.Empresas.asegurar(E).lista.find(x => x.id === a.empresa) : null;
    return `${chips(E, sel)}<div class="grid g4">${Comp.kpi('Fondo metropolitano', U.d1(a.caja.fondoRegalias * 100) / 100 + ' bill.', `<span class="tenue">≈ ${ing} bill. al año netos${deuda > 0.005 ? ' · deuda ' + U.d1(deuda * 100) / 100 + ' bill.' : ''}</span>`)}${Comp.kpi('Sobretasa', a.sobretasa + ' pto' + (a.sobretasa === 1 ? '' : 's'), '<span class="tenue">más recaudo, más tensión</span>')}${Comp.kpi('Director', a.director ? esc(a.director.nombre.split(' ')[0]) : '—', `<span class="tenue">capacidad ${a.director ? a.director.calidad : '—'}</span>`)}${Comp.kpi('Proyectos', a.proyectos.length + '/3', '<span class="tenue">en marcha</span>')}</div>
      <div class="grid g2" style="margin-top:14px"><div class="col"><div class="tarjeta"><h3>🏛 Junta metropolitana</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Los alcaldes votan ponderados por población (ninguno pesa más del 40 %). Con tensión alta, los periféricos votan peor.</div>${junta}</div>
        <div class="tarjeta"><h3>🎩 Dirección y finanzas</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">${a.director ? `Dirige ${esc(a.director.nombre)} (${a.director.perfil === 'tecnico' ? 'técnico' : 'político'}, capacidad ${a.director.calidad}), hasta ${U.fmtT(a.director.hasta)}.` : ''}</div>
          ${gest ? `<div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('nombrarDirectorMetropolitano', { area: a.id, perfil: 'tecnico' }, 'Nombrar un técnico', 'chico')}${UI.botonAccion('nombrarDirectorMetropolitano', { area: a.id, perfil: 'politico' }, 'Nombrar un político', 'chico')}</div>
          <h4 class="sub-h" style="margin:10px 0 4px">Sobretasa</h4><div class="fila" style="gap:6px">${[0, 1, 2, 3].map(n => UI.botonAccion('fijarSobretasaMetropolitana', { area: a.id, nivel: n }, (a.sobretasa === n ? '● ' : '') + n + ' pto', a.sobretasa === n ? 'chico prim' : 'chico')).join('')}</div><h4 class="sub-h" style="margin:10px 0 4px">Cómo conseguir plata</h4><div class="tenue" style="font-size:12px;margin-bottom:6px">Ingresos al año: sobretasa y recaudo propio ${U.d1(ig.propio * 52)} · aportes de los municipios ${U.d1(ig.municipios * 52)} · dividendos de la empresa ${U.d1(ig.dividendos * 52)} · servicio de deuda −${U.d1(ig.servicio * 52)} (billones).</div><div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('gestionarCofinanciacion', { area: a.id }, 'Cofinanciación de la Nación', 'chico')}${UI.botonAccion('cobrarValorizacion', { area: a.id }, 'Valorización', 'chico')}${[0.5, 1, 2].map(m => UI.botonAccion('contratarCreditoMetropolitano', { area: a.id, monto: m }, 'Crédito ' + m + ' bill.', 'chico')).join('')}</div>` : ''}</div></div>
      <div class="col"><div class="tarjeta"><h3>🏗 Proyectos metropolitanos</h3>${proys ? `<div class="lista" style="margin-bottom:8px">${proys}</div>` : '<div class="tenue" style="font-size:12px;margin-bottom:8px">Sin proyectos en marcha.</div>'}
          ${gest ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="proyecto" style="max-width:100%">${opP}</select>${UI.botonAccion('lanzarProyectoMetropolitano', { area: a.id }, null, 'chico')}</div><div class="tenue" style="font-size:11.5px;margin-top:6px">El área paga el 40 % del fondo; el resto lo cofinancia la Nación. El metro necesita además CONPES.</div>` : ''}</div>
        <div class="tarjeta"><h3>🏭 Empresa metropolitana</h3>${emp ? `<div class="tenue" style="font-size:12.5px"><b>${esc(emp.nombre)}</b> · cobertura ${Math.round(emp.cobertura)} % · calidad ${Math.round(emp.calidad)} · <a href="#" data-ir="empresas">ver en Empresas públicas</a></div>` : `<div class="tenue" style="font-size:12px;margin-bottom:6px">Una empresa propia (${esc(d.empresa.nombre)}) presta el servicio para toda el área.</div>${gest ? UI.botonAccion('crearEmpresaMetropolitana', { area: a.id }, 'Crear ' + d.empresa.nombre, 'chico') : ''}`}</div>
        ${a.aspirantes.length ? `<div class="tarjeta"><h3>➕ Municipios que pueden sumarse</h3><div class="lista">${a.aspirantes.map(c => `<div class="it"><div class="cuerpo"><b>${esc(Me().nombreMuni(c))}</b><span>${U.n(Me().pob(c))} habitantes</span></div>${gest ? UI.botonAccion('anexarMunicipio', { area: a.id, code: c }, 'Anexar', 'chico') : ''}</div>`).join('')}</div></div>` : ''}
        ${a.hist.length ? `<div class="tarjeta"><h3>Historial</h3><div class="lista">${a.hist.slice(0, 6).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };

  const tabComparar = E => {
    const filas = Me().todas(E).map(a => ({ a, d: Me().def(a.id), pob: Me().poblacion(a) })).sort((x, y) => y.pob - x.pob);
    return `<div class="tarjeta"><h3>Conurbaciones comparadas</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Clic en una fila para abrirla. Las áreas constituidas coordinan mejor la movilidad, el aire y los servicios.</div>
      <table class="tabla clic-filas"><thead><tr><th>Área</th><th>Estado</th><th>Municipios</th><th>Población</th><th>% país</th><th>Integr.</th><th>Movil.</th><th>Ambiente</th><th>Tensión</th></tr></thead><tbody>${filas.map(f => `<tr data-area="${f.a.id}" class="${(E.ui.metroSel || 'ABURRA') === f.a.id ? 'sel' : ''}"><td><b>${f.d.icono} ${esc(f.d.corto)}</b></td><td><span class="etq ${ESTADO[f.a.estado][1]}">${ESTADO[f.a.estado][0]}</span></td><td class="num">${f.a.miembros.length}</td><td class="num">${U.n(f.pob)}</td><td class="num">${U.d1(f.pob / nPais(E) * 100)} %</td><td class="num">${Math.round(f.a.indic.integracion)}</td><td class="num">${Math.round(f.a.indic.movilidad)}</td><td class="num">${Math.round(f.a.indic.ambiente)}</td><td class="num ${f.a.indic.tension > 60 ? 'mal' : ''}">${Math.round(f.a.indic.tension)}</td></tr>`).join('')}</tbody></table></div>
      <div class="tarjeta" style="margin-top:14px"><h3>Cuánto pesan las áreas en el país</h3>${G.barrasH(filas.map(f => ({ etq: f.d.corto, v: f.pob / nPais(E) * 100, color: f.a.estado === 'constituida' ? COL.miembro : '#5b6f99' })), { max: Math.max(5, filas[0].pob / nPais(E) * 100), fmt: v => U.d1(v) + ' %', anchoEtq: '110px' })}</div>`;
  };

  const tabEmpresas = E => {
    const q = C.Empresas.asegurar(E).lista.filter(e => e.nivel === 'metropolitano' && e.estado !== 'liquidada');
    return `<div class="tarjeta"><h3>Empresas metropolitanas</h3>${q.length ? `<div class="lista">${q.map(e => `<div class="it"><div class="cuerpo"><b>${esc(e.nombre)}</b><span>${esc(C.Empresas.ownerLabel(E, e))} · cobertura ${Math.round(e.cobertura)} % · calidad ${Math.round(e.calidad)} · rentab. ${U.d1(e.rentabilidad)} %</span></div><button class="btn chico" data-ir="empresas">Abrir</button></div>`).join('')}</div>` : '<div class="tenue">Ninguna todavía: crea la de tu área desde la pestaña Gobierno.</div>'}</div>`;
  };

  const TABS = [['mapa', 'Mapas', tabMapa], ['gobierno', 'Gobierno', tabGobierno], ['comparar', 'Comparar', tabComparar], ['empresas', 'Empresas', tabEmpresas]];
  C.Pantallas.metropolis = {
    render(el, params) {
      const E = C.E; Me().asegurar(E);
      const tab = (params && params.tab) || E.ui.metroTab || 'mapa'; E.ui.metroTab = tab;
      if (params && params.area) E.ui.metroSel = params.area;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Áreas metropolitanas</h1><div class="sub">Valle de Aburrá, Bogotá-Región, Cali, Barranquilla, Manizales, Pereira, Bucaramanga, Cartagena y Cúcuta: ciudades que ya son una sola mancha.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('metropolis', { tab: t.dataset.tab });
        if (e.target.closest('[data-accion], select, input')) return;
        const ir = e.target.closest('[data-ir]'); if (ir) { e.preventDefault(); return C.App.ir(ir.dataset.ir); }
        const ar = e.target.closest('[data-area]'); if (ar) { E.ui.metroSel = ar.dataset.area; E.ui.metroMuni = null; return C.App.refrescar(); }
        const cp = e.target.closest('[data-capa]'); if (cp) { E.ui.metroCapa = cp.dataset.capa; return C.App.refrescar(); }
        const mu = e.target.closest('[data-muni]'); if (mu) { E.ui.metroMuni = mu.dataset.muni; return C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
