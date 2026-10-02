/* Debates, Logros (con estadísticas globales y biografía) y Red de poder. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const col = s => s >= 2 ? '#3FBF7A' : s >= 0 ? '#E8A33D' : '#E0504A';

  /* ── Debates ── */
  C.Pantallas.debates = {
    render(el) {
      const E = C.E, D = C.Debates.asegurar(E), a = D.actual, cam = E.elecciones.campana;
      let cuerpo;
      if (a && a.estado === 'abierto') {
        const q = a.preguntas[a.i];
        cuerpo = `<div class="tarjeta"><h3>📺 Debate presidencial ${a.ronda === 1 ? '(primero)' : '(decisivo)'} — pregunta ${a.i + 1} de ${a.preguntas.length}</h3>
          <div class="tenue" style="font-size:12.5px;margin-bottom:6px">Rivales en el estrado: ${a.rivales.map(esc).join(', ') || '—'}. Puntos acumulados: <b>${a.total}</b></div>
          <div class="tarjeta" style="background:rgba(255,255,255,.03)"><b style="white-space:normal;font-size:15px">«${esc(q.txt)}»</b></div>
          <div class="grid g2" style="margin-top:10px">${Object.entries(C.Debates.ESTILOS).map(([k, e]) => UI.botonAccion('responderDebate', { estilo: k }, `${e.icono} ${e.n}`, 'prim')).join('')}</div>
          <div class="tenue" style="font-size:12px;margin-top:8px">La propuesta técnica rinde si tienes competencia; el mensaje emocional, si tienes carisma; atacar es arriesgado pero puede ser viral; esquivar protege poco. Tus intereses temáticos suman.</div></div>`;
      } else cuerpo = `<div class="tarjeta"><h3>📺 Debates presidenciales</h3><div class="tenue">${cam && cam.eleccion === 'presidencial' ? 'Hay debates a nueve y a cuatro semanas de la primera vuelta. Cuando se programe uno aparecerá aquí.' : 'Sólo los candidatos a la Presidencia participan en los debates televisados.'}</div></div>`;
      const h = D.hist.map(d => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">Debate ${d.ronda === 1 ? 'primero' : 'decisivo'} — ${d.estado === 'ausente' ? 'silla vacía' : 'puesto ' + d.puesto + ' de ' + (d.ranking || []).length}</b><span>${d.estado === 'ausente' ? 'No asististe' : `Puntos ${d.total} · efecto ${d.efecto > 0 ? '+' : ''}${d.efecto}${d.viral ? ' · momento viral ' + (d.viral.buena ? '👍' : '👎') : ''}`}</span></div>${d.ranking ? `<div class="tenue" style="font-size:12px;width:100%">${d.ranking.map((r, i) => `${i + 1}. ${esc(r.nombre)} (${r.total})`).join(' · ')}</div>` : ''}</div>`).join('');
      el.innerHTML = `<div class="cab"><div><h1>Debates</h1><div class="sub">El cara a cara televisado puede mover millones de votos en una noche.</div></div></div>${cuerpo}${h ? `<div class="tarjeta" style="margin-top:14px"><h3>Historial</h3><div class="lista">${h}</div></div>` : ''}`;
    }
  };

  /* ── Logros, estadísticas y biografía ── */
  const tabLogros = E => {
    const L = C.Logros, mine = L.asegurar(E), g = L.global();
    const n = L.CAT.filter(c => g.ids[c[0]] || mine.ids[c[0]]).length;
    return `<div class="tenue" style="margin-bottom:10px">Has desbloqueado <b>${n}</b> de ${L.CAT.length} logros (se guardan entre partidas en este navegador).</div>
      <div class="grid g3">${L.CAT.map(([id, ic, nm, d]) => { const ok = g.ids[id] || mine.ids[id]; return `<div class="tarjeta" style="opacity:${ok ? 1 : 0.5}"><b style="white-space:normal">${ok ? ic : '🔒'} ${esc(nm)}</b><div class="tenue" style="font-size:12px;margin-top:4px">${esc(d)}</div>${ok ? `<div class="etq verde" style="margin-top:6px">${(g.ids[id] || mine.ids[id]).anio}${mine.ids[id] ? ' · esta partida' : ''}</div>` : ''}</div>`; }).join('')}</div>`;
  };
  const tabStats = E => {
    C.Logros.guardarEstadisticas(E);
    const g = C.Logros.global(), s = g.stats;
    return `<div class="grid g3">${[['Partidas jugadas', s.partidas], ['Años de carrera acumulados', Math.round(s.semanas / 52)], ['Leyes aprobadas', s.leyes], ['Elecciones ganadas', s.elecciones], ['Presidencias', s.presidencias], ['Mejor legado', s.mejorLegado]].map(([n, v]) => `<div class="tarjeta"><div class="tenue" style="font-size:12px">${n}</div><div style="font-size:26px;font-weight:700">${U.n(v)}</div></div>`).join('')}</div>
      <div class="tarjeta" style="margin-top:14px"><h3>Tus carreras</h3>${g.partidas.length ? `<table class="tabla"><thead><tr><th>Personaje</th><th>Años</th><th>Leyes</th><th>Elecc.</th><th>Presidente</th><th>Legado</th></tr></thead><tbody>${g.partidas.slice().reverse().map(p => `<tr><td><b>${esc(p.nombre)}</b></td><td class="num">${Math.round(p.semanas / 52)}</td><td class="num">${p.leyes}</td><td class="num">${p.elecciones}</td><td>${p.presidente ? '🦅' : '—'}</td><td class="num">${p.legado}</td></tr>`).join('')}</tbody></table>` : '<div class="tenue">Aún no hay carreras registradas.</div>'}</div>`;
  };
  const tabBio = E => {
    const B = C.Biografia, par = B.texto(E), lin = B.linea(E);
    return `<div class="grid g2"><div class="tarjeta"><h3>📖 Biografía de ${esc(E.jugador.nombre)}</h3>${par.map(p => `<p style="margin:8px 0;line-height:1.55">${esc(p)}</p>`).join('')}<button class="btn chico" id="bio-dl">⬇ Descargar texto</button></div>
      <div class="tarjeta"><h3>🕰 Línea de tiempo</h3>${lin.length ? `<div class="lista">${lin.map(x => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(x.txt)}</b><span>${x.anio}</span></div></div>`).join('')}</div>` : '<div class="tenue">Todavía no hay hitos.</div>'}</div></div>`;
  };
  const TABS = [['logros', 'Logros', tabLogros], ['stats', 'Estadísticas globales', tabStats], ['bio', 'Biografía', tabBio]];
  C.Pantallas.logros = {
    render(el, params) {
      const E = C.E; C.Logros.revisar(E);
      const tab = (params && params.tab) || E.ui.logTab || 'logros'; E.ui.logTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Logros y biografía</h1><div class="sub">Tu trayectoria, tus hitos y lo que dejas escrito en la historia.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('logros', { tab: t.dataset.tab });
        if (e.target.closest('#bio-dl')) { const blob = new Blob([C.Biografia.texto(E).join('\n\n')], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'biografia-' + E.jugador.nombre.replace(/\s+/g, '_') + '.txt'; a.click(); }
      };
    }
  };

  /* ── Red de poder ── */
  C.Pantallas.red = {
    render(el) {
      const E = C.E, R = C.Red, red = R.asegurar(E), nom = id => E.politicos[id] ? E.politicos[id].nombre : id;
      const ICO = { alianza: '🤝', enemistad: '⚔', matrimonio: '💍' };
      const nots = R.notables(E).sort((a, b) => (C.DATA.cargos[b.cargo.tipo].nivel - C.DATA.cargos[a.cargo.tipo].nivel) || (b.fuerza || 0) - (a.fuerza || 0)).slice(0, 24);
      el.innerHTML = `<div class="cab"><div><h1>Red de poder</h1><div class="sub">Rasgos, alianzas, enemistades, traiciones y bodas entre los políticos que mueven el país.</div></div></div>
        <div class="grid g2"><div class="tarjeta"><h3>🕸 Políticos influyentes</h3><div class="lista">${nots.map(p => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(p.nombre)}</b><span>${esc(C.DATA.cargos[p.cargo.tipo].nombre)} · ${E.partidos[p.partido] ? esc(E.partidos[p.partido].sigla) : 'sin partido'} · <b>${R.RASGOS[R.rasgo(p)]}</b> · relación contigo ${Math.round(p.relJ || 0)}</span></div>${UI.botonAccion('tejerAlianzaNPC', { pol: p.id }, 'Atender', 'chico')}</div>`).join('')}</div></div>
        <div class="col"><div class="tarjeta"><h3>🔗 Lazos vigentes</h3>${red.lazos.length ? `<div class="lista">${red.lazos.slice().reverse().slice(0, 14).map(l => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${ICO[l.tipo]} ${esc(nom(l.a))} y ${esc(nom(l.b))}</b><span>${l.tipo} · desde ${U.fmtT(l.t)}</span></div></div>`).join('')}</div>` : '<div class="tenue">Aún no se han tejido lazos.</div>'}</div>
        ${red.hist.length ? `<div class="tarjeta"><h3>Crónica</h3><div class="lista">${red.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : ''}</div></div>`;
    }
  };
})(window.CURUL);
