/* Línea de tiempo, resumen semanal, simulador «¿qué pasaría si…?» y episodios históricos (Fase 47). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  let ultimoSim = null;
  const vacio = t => `<div class="tenue" style="font-size:13px">${t}</div>`;
  const fmt = (v, dec) => (dec ? U.d1(v) : Math.round(v).toLocaleString('es-CO'));
  const col = (d, signo) => { const b = d * signo; return Math.abs(d) < 0.05 ? '' : b > 0 ? 'color:#3FBF7A' : 'color:#E0504A'; };
  const flecha = d => Math.abs(d) < 0.05 ? '·' : d > 0 ? '▲' : '▼';

  const tabLinea = (E, f) => {
    const fil = [['todo', 'Todo'], ['mio', 'Mi vida'], ['poder', 'Poder'], ['economia', 'Economía'], ['mundo', 'Mundo'], ['justicia', 'Justicia y escándalos']], items = C.Cronologia.items(E, f);
    let anio = null;
    const filas = items.map(x => { const y = U.fechaDe(x.t).getUTCFullYear(), cab = y !== anio ? `<h4 class="sub-h" style="margin:14px 0 4px">${y}</h4>` : ''; anio = y; return `${cab}<div class="it"><div class="cuerpo" style="font-size:13px">${x.cat === 'mio' ? '👤 ' : ''}${esc(x.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(x.t)}</div></div><span class="etq ${x.tono > 0 ? 'verde' : x.tono < 0 ? 'rojo' : ''}" style="font-size:10px">${x.tono > 0 ? '+' : x.tono < 0 ? '−' : ''}</span></div>`; }).join('');
    return `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${fil.map(([k, n]) => `<button class="btn chico ${k === f ? 'prim' : ''}" data-fil="${k}">${n}</button>`).join('')}</div><div class="tarjeta"><div class="lista">${filas || vacio('Todavía no hay hitos registrados. Avanza unas semanas.')}</div></div>`;
  };
  const tabResumen = E => {
    const v = C.Resumen.variaciones(E), nws = C.Resumen.noticiasSemana(E);
    const filas = v.map(x => `<div class="it"><div class="cuerpo">${esc(x.n)}</div><b class="num" style="min-width:70px;text-align:right">${fmt(x.v, x.dec)}</b><span style="min-width:90px;text-align:right;${col(x.d1, x.signo)}">${flecha(x.d1)} ${Math.abs(x.d1) < 0.05 ? '' : (x.d1 > 0 ? '+' : '−') + fmt(Math.abs(x.d1), 1)} sem.</span><span style="min-width:100px;text-align:right;${col(x.d4, x.signo)}">${flecha(x.d4)} ${Math.abs(x.d4) < 0.05 ? '' : (x.d4 > 0 ? '+' : '−') + fmt(Math.abs(x.d4), 1)} / 4 sem.</span></div>`).join('');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>📊 Qué cambió</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Comparado con la semana pasada y con hace cuatro semanas. Verde = mejora, rojo = empeora.</div><div class="lista">${filas}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>📰 Esta semana</h3>${nws.length ? `<div class="lista">${nws.map(n => `<div class="it"><div class="cuerpo" style="font-size:13px">${esc(n.titular)}</div></div>`).join('')}</div>` : vacio('Semana tranquila.')}</div></div></div>`;
  };
  const tabSim = E => {
    const A = C.Acciones, acts = A.lista().filter(a => { try { return A.puede(a.id, {}) === true; } catch (e) { return false; } }).map(a => [a.id, `${a.icono || ''} ${a.nombre}`]);
    const r = ultimoSim;
    const res = r ? (r.ok ? `<div class="tarjeta" style="margin-top:12px"><h3>Resultado a ${r.semanas} semanas</h3><div class="tenue" style="font-size:12.5px;margin-bottom:6px">${esc(r.msg || '')}${r.regBase !== r.regAlt ? ` · Régimen: ${esc(r.regBase)} → ${esc(r.regAlt)}` : ''}</div><div class="lista">${r.filas.map(x => `<div class="it"><div class="cuerpo">${esc(x.n)}</div><span style="min-width:90px;text-align:right" class="tenue">hoy ${fmt(x.ahora, x.dec)}</span><span style="min-width:110px;text-align:right" class="tenue">sin hacer nada ${fmt(x.base, x.dec)}</span><b style="min-width:110px;text-align:right;${col(x.dif, x.signo)}">${Math.abs(x.dif) < 0.05 ? 'igual' : (x.dif > 0 ? '+' : '−') + fmt(Math.abs(x.dif), 1)}</b></div>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:8px">Estimación con la misma semilla de azar; la realidad puede variar. Nada de esto cambia tu partida.</div></div>` : `<div class="tarjeta" style="margin-top:12px">${vacio(esc(r.msg))}</div>`) : '';
    return `<div class="tarjeta"><h3>🔮 ¿Qué pasaría si…?</h3><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Elige una decisión disponible ahora y mira cómo cambiaría el país en unas semanas frente a no hacer nada. Es una simulación: no gastas puntos ni cambias nada.</div>
      <div class="fila" style="gap:6px;flex-wrap:wrap"><select id="sim-act">${acts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select><select id="sim-sem"><option value="4">4 semanas</option><option value="8" selected>8 semanas</option><option value="13">13 semanas</option><option value="26">26 semanas</option></select><button class="btn prim" data-sim="1">Simular</button></div></div>${res}`;
  };
  const tabHist = E => {
    const h = C.Historia.asegurar(E), v = h.violencia.nivel;
    const eps = C.DATA.historia.map(D => { const st = (h.eps[D.id] || {}).estado || 'espera'; return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${D.icono} ${esc(D.nombre)}</b> <span class="etq ${st === 'activo' ? 'rojo' : st === 'fin' ? '' : 'amar'}">${st === 'activo' ? 'en curso' : st === 'fin' ? 'transcurrido' : 'por venir'}</span><div class="tenue" style="font-size:12.5px">${esc(D.desc)}</div></div></div>`; }).join('');
    const dic = (C.DATA.dictaduras || []).map(D => `<div class="it"><div class="cuerpo"><b>${D.icono} ${esc(D.nombre)}</b><div class="tenue" style="font-size:12.5px">${esc(D.desc)}</div></div></div>`).join('');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🏛 Episodios históricos con guion</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Ocurren en su fecha real en cualquier partida que los cruce. Nivel de la violencia partidista: ${Math.round(v)}.</div><div class="lista">${eps}</div></div></div><div class="col"><div class="tarjeta"><h3>🎖 Dictaduras históricas</h3><div class="lista">${dic}</div></div>${h.hist.length ? `<div class="tarjeta"><h3>Hitos vividos</h3><div class="lista">${h.hist.slice(0, 10).map(x => `<div class="it"><div class="cuerpo" style="font-size:13px">${esc(x.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(x.t)}</div></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };
  const TABS = [['linea', '🕰 Línea de tiempo'], ['resumen', '📊 Resumen semanal'], ['sim', '🔮 ¿Qué pasaría si…?'], ['hist', '🏛 Episodios históricos']];
  C.Pantallas.cronologia = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.crnTab || 'linea', f = (params && params.f) || E.ui.crnFil || 'todo'; E.ui.crnTab = tab; E.ui.crnFil = f;
      const body = tab === 'linea' ? tabLinea(E, f) : tab === 'resumen' ? tabResumen(E) : tab === 'sim' ? tabSim(E) : tabHist(E);
      el.innerHTML = `<div class="cab"><div><h1>Cronología y herramientas</h1><div class="sub">La historia de tu partida, lo que cambió esta semana y un simulador para probar decisiones.</div></div></div><div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${body}</div>`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('cronologia', { tab: t.dataset.tab });
        const fl = e.target.closest('[data-fil]'); if (fl) return C.App.ir('cronologia', { tab: 'linea', f: fl.dataset.fil });
        const s = e.target.closest('[data-sim]'); if (s) { const id = el.querySelector('#sim-act').value, sem = +el.querySelector('#sim-sem').value; s.disabled = true; s.textContent = 'Simulando…'; setTimeout(() => { ultimoSim = C.Simular.probar(id, {}, sem); C.App.ir('cronologia', { tab: 'sim' }); }, 30); }
      };
    }
  };
})(window.CURUL);
