/* País y poderes: poderes fácticos, prensa de investigación, crisis de partido, actualidad nacional, vida personal, retos y gráficos. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  const col = v => v >= 62 ? '#3FBF7A' : v >= 40 ? '#E8A33D' : '#E0504A';
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || col(v)}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const btn = (id, args, txt) => UI.botonAccion(id, args || {}, txt || null, 'chico');
  const bit = (arr, t) => arr.length ? `<div class="tarjeta"><h3>${t || 'Bitácora'}</h3><div class="lista">${arr.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : '';

  const tabPoderes = E => {
    const P = C.Poderes, st = P.asegurar(E);
    return `<div class="tenue" style="font-size:12.5px;margin-bottom:10px">Los poderes que no se eligen pero deciden. Cada uno tiene afinidad contigo, poder propio y favores en juego. Te piden cosas cuando tienes mando; si los desafías, te pasan la cuenta.</div>
      <div class="grid g2">${P.DEF.map(d => { const s = st.actores[d.id]; return `<div class="tarjeta"><h3>${d.icono} ${esc(d.n)}</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">${esc(d.nota)}</div>
        ${fila('Afinidad contigo', barra(s.afin))}${fila('Poder', barra(s.poder, '#4C7FE0'))}${fila('Favores', `<b class="num">${s.favor > 0 ? 'te deben ' + s.favor : s.favor < 0 ? 'les debes ' + (-s.favor) : '—'}</b>`)}
        ${s.apoyo ? '<div class="etq verde" style="margin:4px 0">Te respaldan abiertamente</div>' : ''}${s.sab ? '<div class="etq rojo" style="margin:4px 0">Te están pasando la cuenta</div>' : ''}
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('reunirsePoder', { actor: d.id }, 'Reunirte')}${btn('pedirApoyoPoder', { actor: d.id }, 'Pedir respaldo')}${btn('cobrarFavorPoder', { actor: d.id }, 'Cobrar favor')}${btn('aceptarFinanciacion', { actor: d.id }, 'Financiación')}${btn('denunciarPoder', { actor: d.id }, 'Denunciar')}</div></div>`; }).join('')}</div>${bit(st.hist, 'Crónica de los poderes')}`;
  };

  const tabPrensa = E => {
    const P = C.Prensa.asegurar(E), mias = P.invs.filter(i => i.mina && i.estado === 'abierta'), otras = P.invs.filter(i => !i.mina && i.estado === 'abierta');
    const nots = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && (C.DATA.cargos[p.cargo.tipo] || { nivel: 0 }).nivel >= 3).sort((a, b) => (b.fuerza || 0) - (a.fuerza || 0)).slice(0, 25);
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🕵 Investigaciones abiertas contra ti</h3>${mias.length ? `<div class="lista">${mias.map(i => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">${esc(C.Prensa.medio(E, i.medio).nombre)}: ${esc(i.tema)}</b><span>Gravedad ${'●'.repeat(i.grav)}${'○'.repeat(3 - i.grav)}</span></div>${barra(i.avance, '#E0504A', 90)}<div class="fila" style="gap:6px;width:100%;margin-top:6px">${btn('colaborarPrensa', { inv: i.id }, 'Colaborar')}${btn('adelantarseNota', { inv: i.id }, 'Adelantarte')}${btn('comprarSilencio', { inv: i.id }, 'Comprar silencio')}${btn('demandarMedio', { inv: i.id }, 'Demandar')}</div></div>`).join('')}</div>` : '<div class="tenue">Ninguna por ahora. Cuanto más escándalos, patrimonio y poder, más te buscan los periodistas.</div>'}</div>
        ${P.hist.length ? bit(P.hist, 'Notas publicadas') : ''}</div>
      <div class="col"><div class="tarjeta"><h3>📰 Investigaciones sobre otros políticos</h3>${otras.length ? `<div class="lista">${otras.map(i => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(C.Prensa.nombreSujeto(E, i))}</b><span>${esc(C.Prensa.medio(E, i.medio).nombre)} · ${esc(i.tema)}</span></div>${barra(i.avance, '#E8A33D', 80)}</div>`).join('')}</div>` : '<div class="tenue">No hay investigaciones abiertas contra otros políticos.</div>'}</div>
        <div class="tarjeta"><h3>🕶 Filtrar información sobre un rival</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Cuesta $40 M y puede saberse que la filtración salió de ti.</div><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="pol" style="max-width:100%">${nots.map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(C.DATA.cargos[p.cargo.tipo].nombre)}</option>`).join('')}</select>${UI.botonAccion('investigarRival', { pol: nots[0] ? nots[0].id : '' }, 'Filtrar', 'chico')}</div></div></div></div>`;
  };

  const tabPartido = E => {
    const J = E.jugador, pa = E.partidos[J.partido];
    const lista = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.facciones && p.facciones.length >= 1).sort((a, b) => a.cohesion - b.cohesion).slice(0, 10);
    return `<div class="grid g2"><div class="col">${pa ? `<div class="tarjeta"><h3>🧩 Facciones de tu partido (${esc(pa.sigla)})</h3>${fila('Cohesión', barra(pa.cohesion))}<div class="lista" style="margin-top:8px">${pa.facciones.map(f => `<div class="it"><div class="cuerpo"><b>${esc(f.nombre)}</b><span>Peso ${Math.round(f.peso)} % · relación contigo ${Math.round(f.relJ)}</span></div></div>`).join('')}</div><div class="tenue" style="font-size:12px;margin-top:8px">Con la cohesión por debajo de 40, una facción puede irse y fundar otro partido. Tus decisiones y cuotas la mueven.</div></div>` : '<div class="tarjeta"><div class="tenue">No perteneces a un partido.</div></div>'}</div>
      <div class="col"><div class="tarjeta"><h3>📉 Partidos más divididos</h3><div class="lista">${lista.map(p => `<div class="it"><div class="cuerpo"><b>${esc(p.sigla)} · ${esc(p.nombre)}</b><span>${p.facciones.length} facciones</span></div>${barra(p.cohesion, null, 90)}</div>`).join('')}</div><div class="tenue" style="font-size:12px;margin-top:8px">Los partidos con baja cohesión se escinden; los pequeños y parecidos pueden fusionarse.</div></div></div></div>`;
  };

  const tabActualidad = E => {
    const n = C.Nacional.asegurar(E), m = n.mundial;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🇨🇴 Ánimo nacional</h3>${fila('Cómo está el país', barra(n.animo))}<div class="tenue" style="font-size:12px;margin-top:6px">El ánimo sube con la economía, la seguridad y las alegrías colectivas (la Selección, el Tour, los premios) y baja con las tragedias. Un país contento perdona más al Gobierno.</div></div>
        <div class="tarjeta"><h3>⚽ Mundial y deporte</h3>${m ? (m.vivo ? `<div class="etq verde">Colombia sigue en el Mundial ${m.anio}: ${esc(C.Nacional.FASE_N[m.fase])}</div>` : m.campeon ? `<div class="etq verde">🏆 Colombia campeona del Mundial ${m.anio}</div>` : m.ganados || m.fase ? `<div class="etq rojo">Colombia eliminada en el Mundial ${m.anio}</div>` : `<div class="etq rojo">Colombia no clasificó al Mundial ${m.anio}</div>`) : '<div class="tenue">Mundial cada cuatro años (2026, 2030…), Copa América y Tour de Francia.</div>'}</div></div>
      <div class="col">${bit(n.hist, 'Memoria de los últimos sucesos')}</div></div>`;
  };

  const tabVida = E => {
    const J = E.jugador, am = C.Vida.todos(E), p = C.Familia.pareja(E);
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🫂 Tus amigos</h3><div class="lista">${am.map(a => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${C.Vida.ROLES[a.rol][1]} ${esc(a.nombre)}</b><span>${esc(C.Vida.ROLES[a.rol][0])} · desde ${U.fmtT(a.desde)}</span></div>${barra(a.lealtad, null, 90)}<div class="fila" style="gap:6px;width:100%;margin-top:6px">${btn('cenaAmigo', { amigo: a.id }, 'Cenar')}${btn('ayudarAmigo', { amigo: a.id }, 'Ayudar')}${btn('consejoAmigo', { amigo: a.id }, 'Pedir consejo')}</div></div>`).join('')}</div><div class="tenue" style="font-size:12px;margin-top:8px">Un amigo desatendido se enfría… y si la lealtad se acaba, puede filtrarte a la prensa.</div></div></div>
      <div class="col"><div class="tarjeta"><h3>💚 Tú</h3>${fila('Bienestar', barra(J.bienestar || 60))}${fila('Salud', barra(J.salud || 85))}${fila('Pareja', `<b>${p ? esc(p.nombre) : 'sin pareja'}</b>`)}<div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('descansarSalud')}${btn('tomarVacaciones')}${btn('chequeoMedico')}</div></div></div></div>`;
  };

  const tabRetos = E => {
    const R = C.Retos, st = R.asegurar(E), a = st.activo, sem = R.semanal(E);
    const card = d => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b style="white-space:normal">${d.icono} ${esc(d.n)}</b><span>${esc(d.d)}</span></div>${a ? '' : btn('aceptarReto', { reto: d.id }, 'Aceptar')}</div>`;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🎯 Reto activo</h3>${a ? `<div class="it"><div class="cuerpo"><b style="white-space:normal">${R.def(a.id).icono} ${esc(R.def(a.id).n)}</b><span>${esc(R.def(a.id).d)} · desde ${U.fmtT(a.t0)}</span></div>${btn('abandonarReto')}</div>` : '<div class="tenue">Sin reto. Elige uno de la lista: cumplirlo da fama, un logro y un cierre épico.</div>'}</div>
        <div class="tarjeta"><h3>🗓 Reto de la semana</h3><div class="lista">${card(sem)}</div></div>
        ${st.hist.length ? `<div class="tarjeta"><h3>Historial de retos</h3><div class="lista">${st.hist.map(h => `<div class="it"><div class="cuerpo"><b>${R.def(h.id).icono} ${esc(R.def(h.id).n)}</b></div><span class="etq ${h.estado === 'cumplido' ? 'verde' : 'rojo'}">${h.estado}</span></div>`).join('')}</div></div>` : ''}</div>
      <div class="col"><div class="tarjeta"><h3>Todos los retos</h3><div class="lista">${R.RETOS.map(card).join('')}</div></div>
        <div class="tarjeta"><h3>🌱 Semilla del mundo</h3><div class="tenue" style="font-size:12px">Comparte esta semilla con alguien y empiecen mundos idénticos para comparar carreras.</div><div class="mono" style="margin-top:6px;font-size:16px">${E.meta.semilla}</div></div></div></div>`;
  };

  const tabGraficos = E => {
    const S = E.series, linea = (items, o) => G.linea(items, Object.assign({ alto: 160, min: 0, max: 100, area: false }, o));
    return `<div class="grid g2"><div class="tarjeta"><h3>Tu reconocimiento y favorabilidad</h3>${linea([{ nombre: 'Reconocimiento', color: '#D9B45A', datos: S['jug:reconocimiento'] || [] }, { nombre: 'Favorabilidad', color: '#6CC4F5', datos: S['jug:favorabilidad'] || [] }])}</div>
      <div class="tarjeta"><h3>Aprobación del Gobierno</h3>${linea([{ nombre: 'Aprobación', color: '#3FBF7A', datos: S.aprobacion || [] }], { ref: 50, unidad: '%' })}</div>
      <div class="tarjeta"><h3>Ánimo nacional</h3>${linea([{ nombre: 'Ánimo', color: '#E8A33D', datos: S['nacional:animo'] || [] }], { ref: 55 })}</div>
      <div class="tarjeta"><h3>Afinidad media de los poderes contigo</h3>${linea([{ nombre: 'Afinidad', color: '#9b7ad6', datos: S['poderes:afin'] || [] }], { ref: 50 })}</div></div>`;
  };

  const TABS = [['poderes', 'Poderes fácticos', tabPoderes], ['prensa', 'Prensa', tabPrensa], ['partido', 'Mi partido', tabPartido], ['actualidad', 'Actualidad', tabActualidad], ['vida', 'Vida personal', tabVida], ['retos', 'Retos', tabRetos], ['graficos', 'Gráficos', tabGraficos]];
  C.Pantallas.pais = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.paisTab || 'poderes'; E.ui.paisTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>País y poderes</h1><div class="sub">Los poderes que no se eligen, la prensa que investiga, tu partido, el ánimo del país y tu vida.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('pais', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
