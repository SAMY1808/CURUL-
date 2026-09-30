/* Fuerzas armadas: capacidad por rama, esfuerzo de gasto, compras de armas, frentes (Venezuela, Nicaragua) y guerra. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const Mi = () => C.Militar;
  const aviso = E => Mi().esPres(E) ? '' : '<div class="tenue" style="font-size:12px;margin-bottom:10px">Sólo el Presidente comanda a las Fuerzas Militares: aquí puedes ver su estado.</div>';
  const colT = t => t >= 85 ? '#E0504A' : t >= 65 ? '#E8A33D' : t >= 40 ? '#E8C547' : '#3FBF7A';

  const fuerzas = E => {
    const m = Mi().asegurar(E), R = Mi().RAMAS, dis = Mi().disuasion(E), pres = Mi().esPres(E);
    const cap = (E.ui.milArg || {});
    const opSis = Object.entries(Mi().SISTEMAS).map(([k, s]) => `<option value="${k}">${s.icono} ${esc(s.n)} · ${s.costo} bill. · ${s.sem} sem.</option>`).join('');
    const opProv = Object.entries(Mi().PROVEEDORES).map(([k, p]) => `<option value="${k}">${esc(p.n)} (precio ×${p.precio}, calidad ×${p.cal})</option>`).join('');
    return `${aviso(E)}<div class="grid g4">${Comp.kpi('Disuasión', Math.round(dis) + '<small class="tenue" style="font-size:15px">/100</small>', '<span class="tenue">poder + alianzas</span>')}${Comp.kpi('Moral de la tropa', Math.round(m.moral) + '%', '<span class="tenue">sube con buen trato y éxitos</span>')}${Comp.kpi('Esfuerzo de gasto', Mi().ESFUERZO[m.esfuerzo].n, '<span class="tenue">afecta el déficit</span>')}${Comp.kpi('Compras en curso', m.compras.filter(c => !c.llego).length, '<span class="tenue">llegan meses después</span>')}</div>
      <div class="grid g2" style="margin-top:14px"><div class="col"><div class="tarjeta"><h3>Capacidad por rama</h3>${G.barrasH(Object.entries(R).map(([k, r]) => ({ etq: r.icono + ' ' + r.n, v: Math.round(m.ramas[k]), color: '#7fa8e8' })), { max: 100 })}
        <div class="tenue" style="font-size:12px;margin-top:8px">Sin inversión las Fuerzas se desgastan lentamente. Con un esfuerzo reforzado y buenas compras suben, y la disuasión con ellas.</div></div>
        <div class="tarjeta"><h3>Esfuerzo de gasto militar</h3><div class="fila" style="gap:6px;flex-wrap:wrap">${Object.entries(Mi().ESFUERZO).map(([k, n]) => UI.botonAccion('fijarEsfuerzoMilitar', { nivel: k }, (m.esfuerzo === k ? '● ' : '') + n.n, m.esfuerzo === k ? 'prim' : '')).join('')}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${UI.botonAccion('reformaFuerzas', {}, 'Profesionalizar las Fuerzas')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>🛒 Comprar armamento</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Cada proveedor tiene precio, calidad y costo diplomático: comprarle a Rusia o China molesta a Washington; a Estados Unidos, a Moscú y Caracas.</div>
        <div class="col accion-form" style="gap:6px"><select data-arg="sistema">${opSis}</select><select data-arg="prov">${opProv}</select>${UI.botonAccion('comprarArmas', {}, 'Ordenar compra', 'prim')}</div></div>
        <div class="tarjeta"><h3>Compras</h3>${m.compras.length ? `<div class="lista">${m.compras.slice().reverse().map(c => { const s = Mi().SISTEMAS[c.sistema]; return `<div class="it"><div class="cuerpo"><b>${s.icono} ${esc(s.n)}</b><span>${esc(Mi().PROVEEDORES[c.prov].n)} · ${c.costo} billones</span></div><div class="tenue" style="font-size:12px">${c.llego ? 'Entregado' : 'Llega en ' + Math.max(0, c.llega - E.fecha.t) + ' sem.'}</div></div>`; }).join('')}</div>` : '<div class="tenue">Sin compras registradas.</div>'}</div></div></div>`;
  };

  const frentes = E => {
    const m = Mi().asegurar(E), dis = Mi().disuasion(E), g = m.guerra;
    const guerra = g ? `<div class="tarjeta" style="border-left:4px solid #E0504A;margin-bottom:14px"><h3>💥 Guerra con ${esc(Mi().nombre(g.pais))}</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Semana ${g.semanas} · ${U.n(g.bajas)} bajas. La balanza se define por poder relativo, moral y alianzas; a ±70 termina.</div>${G.barrasH([{ etq: 'Avance (izq. pierdes · der. ganas)', v: Math.round(g.avance + 100) / 2, color: g.avance >= 0 ? '#3FBF7A' : '#E0504A' }], { max: 100, marca: 50, fmt: () => (g.avance >= 0 ? '+' : '') + Math.round(g.avance) })}
      <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px">${UI.botonAccion('mediacionFrente', { frente: g.frente }, 'Pedir mediación / armisticio')}</div></div>` : '';
    return `${aviso(E)}${guerra}<div class="grid g2">${m.frentes.map(f => {
      const riv = Math.round(Mi().poderRival(E, f.pais)), st = E.diplomacia.paises[f.pais], et = Mi().etapa(f);
      return `<div class="tarjeta" style="border-top:3px solid ${colT(f.tension)}"><div class="t-cab"><h3>${esc(f.n)}</h3><span class="etq" style="background:${colT(f.tension)}33;color:${colT(f.tension)}">${et}</span></div><div class="tenue" style="font-size:12px;margin-bottom:8px">${esc(f.nota)}</div>
        ${G.barrasH([{ etq: 'Tensión', v: Math.round(f.tension), color: colT(f.tension) }, { etq: 'Tu disuasión', v: Math.round(dis), color: '#7fa8e8' }, { etq: 'Rival', v: riv, color: '#c97b7b' }], { max: 100 })}
        <div class="tenue" style="font-size:12px;margin-top:6px">Relación con ${esc(Mi().nombre(f.pais))}: ${st ? Math.round(st.relacion) + '%' : '—'}${f.mediacion > 0 ? ' · 🕊 mediación en marcha' : ''}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px">${UI.botonAccion('desescalarFrente', { frente: f.id }, 'Diálogo directo')}${UI.botonAccion('mediacionFrente', { frente: f.id }, 'Mediación')}${UI.botonAccion('ejercicioMilitar', { frente: f.id }, 'Ejercicios')}${UI.botonAccion('movilizarTropas', { frente: f.id }, 'Movilizar')}${UI.botonAccion('ordenarOfensiva', { frente: f.id }, 'Ofensiva', 'peligro')}</div></div>`;
    }).join('')}</div>`;
  };

  const historial = E => {
    const m = Mi().asegurar(E), hg = m.historialGuerras || [];
    return `<div class="grid g2"><div class="tarjeta"><h3>Bitácora</h3>${m.historial.length ? `<div class="lista">${m.historial.map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div>` : '<div class="tenue">Sin novedades.</div>'}</div>
      <div class="tarjeta"><h3>Guerras (${m.total.guerras} · victorias ${m.total.victorias})</h3>${hg.length ? `<div class="lista">${hg.map(h => `<div class="it"><div class="cuerpo"><b>${esc(Mi().nombre(h.pais))}</b><span>${U.fmtT(h.t)} · ${h.semanas} semanas · ${U.n(h.bajas)} bajas</span></div><span class="etq ${h.res === 'victoria' ? 'verde' : h.res === 'derrota' ? 'rojo' : ''}">${h.res}</span></div>`).join('')}</div>` : '<div class="tenue">Colombia no ha estado en guerra en esta partida.</div>'}</div></div>`;
  };

  const TABS = [['fuerzas', 'Fuerzas y compras', fuerzas], ['frentes', 'Frentes y guerra', frentes], ['historial', 'Historial', historial]];
  C.Pantallas.militar = {
    render(el, params) {
      const E = C.E; Mi().asegurar(E);
      const tab = (params && params.tab) || E.ui.milTab || 'fuerzas'; E.ui.milTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Fuerzas armadas</h1><div class="sub">Ejército, Armada y Fuerza Aérea; compra de armas, disuasión y los frentes con Venezuela y Nicaragua.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}${k === 'frentes' && E.militar.guerra ? ' 💥' : ''}</button>`).join('')}</div>
        <div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('militar', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
