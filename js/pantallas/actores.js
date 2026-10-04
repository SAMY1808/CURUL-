/* Actores sociales (Fase 50): pantalla propia con líderes, afinidad, alianzas, demandas, pactos y frentes. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 90}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || '#4C7FE0'}"></i></div><b class="num" style="min-width:28px">${Math.round(v)}</b></div>`;
  const btn = (id, args, txt, cl) => UI.botonAccion(id, args || {}, txt || null, cl || 'chico');
  const vacio = t => `<div class="tenue" style="font-size:13px">${t}</div>`;
  const etq = e => e === 'abierta' || e === 'vigente' ? 'amar' : e === 'cumplir' || e === 'cumplido' ? 'verde' : e === 'ignorada' || e === 'rechazar' || e === 'incumplido' ? 'rojo' : '';
  const card = (E, id, d) => {
    const A = C.Actores, a = A.asegurar(E), l = A.lider(E, id), af = A.afin(E, id), al = a.alianzas[id] || 0, ab = a.agendas.find(x => x.actor === id && x.estado === 'abierta'), pc = a.pactos.find(x => x.actor === id && x.estado === 'vigente');
    const col = af < 35 ? '#E0504A' : af < 55 ? '#E8A33D' : '#3FBF7A';
    return `<div class="tarjeta"><h3>${d.i} ${esc(d.n)}</h3><div class="tenue" style="font-size:12px">Líder: <b>${esc(l.nombre)}</b> (${l.perfil}) · desde ${U.fmtT(l.t0)}</div>
      <div class="fila" style="justify-content:space-between;margin:6px 0"><span>Afinidad</span>${barra(af, col)}</div>
      <div class="fila" style="justify-content:space-between;margin:6px 0"><span>Alianza</span>${barra(al, '#4C7FE0')}</div>
      ${ab ? `<div class="tenue" style="font-size:12px">📣 Pide ${esc(ab.txt)} <span class="etq amar">abierta</span></div>` : ''}${pc ? `<div class="tenue" style="font-size:12px">🤝 Pacto vigente hasta ${U.fmtT(pc.vence)}</div>` : ''}
      <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('reunirseActor', { actor: id }, 'Reunirte')}${btn('financiarActor', { actor: id }, 'Financiar')}${btn('aliarseActor', { actor: id }, 'Aliarse')}${btn('pactoActor', { actor: id }, 'Pacto (mesa)')}${al > 0 ? btn('romperAlianzaActor', { actor: id }, 'Romper') : ''}</div></div>`;
  };
  C.Pantallas.actores = {
    render(el) {
      const E = C.E, A = C.Actores, a = A.asegurar(E), ops = A.opositores(E);
      const grupo = p => Object.entries(A.ACT).filter(([, d]) => d.p === p).map(([id, d]) => card(E, id, d)).join('');
      const ag = a.agendas.slice(0, 10).map(x => `<div class="it"><div class="cuerpo"><b>${esc(A.ACT[x.actor].n)}</b> pide ${esc(x.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(x.t0)}</div></div><span class="etq ${etq(x.estado)}">${esc(x.estado)}</span></div>`).join('');
      const pa = a.pactos.slice(0, 8).map(x => `<div class="it"><div class="cuerpo"><b>${esc(A.ACT[x.actor].n)}</b><div class="tenue" style="font-size:11.5px">firmado ${U.fmtT(x.t0)} · vence ${U.fmtT(x.vence)}</div></div><span class="etq ${etq(x.estado)}">${esc(x.estado)}</span></div>`).join('');
      el.innerHTML = `<div class="cab"><div><h1>Actores sociales</h1><div class="sub">Sindicatos, Iglesia, gremios, estudiantes, indígenas, campesinos, militares, prensa, banca y ONG: cada uno con su líder, su agenda y sus alianzas.</div></div></div>
        <div class="tarjeta" style="margin-bottom:14px"><h3>✊ Frente social</h3>${ops.length >= 3 ? `<div class="tenue" style="font-size:13px"><span class="etq rojo">alerta</span> ${ops.length} actores están en contra y pueden coordinarse: ${ops.map(i => esc(A.ACT[i].n)).join(', ')}.</div>` : vacio('Si tres o más actores caen por debajo de 35 de afinidad, forman un frente contra el Gobierno. Estás a salvo por ahora.')}
        <div class="fila accion-form" style="margin-top:8px">${btn('convocarFrente', {}, 'Convocar frente social (oposición)', 'prim')}</div></div>
        <div class="grid g2"><div class="col"><h2 style="font-size:15px;margin:0 0 8px">Poderes fácticos</h2>${grupo('poderes')}</div><div class="col"><h2 style="font-size:15px;margin:0 0 8px">Movimientos sociales</h2>${grupo('mov')}</div></div>
        <div class="grid g2" style="margin-top:14px"><div class="col"><div class="tarjeta"><h3>Demandas recientes</h3>${ag ? `<div class="lista">${ag}</div>` : vacio('Cuando gobiernas, los actores te presentan demandas con plazo.')}</div></div><div class="col"><div class="tarjeta"><h3>Pactos firmados</h3>${pa ? `<div class="lista">${pa}</div>` : vacio('Negocia un pacto en mesa con un actor: si lo cumples, crece la alianza; si no, te lo cobran.')}</div></div></div>`;
    }
  };
})(window.CURUL);
