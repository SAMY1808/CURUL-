/* Pestaña «Órganos de control» de la pantalla de la Corte: Fiscal, Procurador y Contralor. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const etq = t => `${Comp.etiquetaIdeo(t.eco)} · ${t.soc > 25 ? 'conservador' : t.soc < -25 ? 'progresista' : 'moderado'}`;

  C.Pantallas.controlTab = E => {
    const K = C.Control, c = K.asegurar(E), J = E.jugador, esPres = E.gobierno.presidente === 'J';
    const tarjetas = Object.entries(K.ORGANOS).map(([id, x]) => {
      const o = c.organos[id], t = o.titular, v = o.vacante;
      let cuerpo;
      if (t) {
        const h = K.hostilJ(E, id);
        cuerpo = `<div class="fila" style="gap:10px;align-items:center">${Comp.avatar(E, t, 44)}<div><b>${esc(t.nombre)}</b><div class="tenue" style="font-size:12px">${esc(etq(t))} · terna de ${esc(K.PROP[t.proponente])}</div><div class="tenue" style="font-size:12px">Hasta ${esc(U.fmtT(t.hasta, false))}</div></div></div>
          <div class="grid g3" style="margin-top:10px">${Comp.kpi('Independencia', Math.round(t.indep))}${Comp.kpi('Agresividad', Math.round(t.agresiv))}${Comp.kpi('Hacia ti', '×' + U.d1(h), `<span class="${h > 1.25 ? 'mal' : h < 0.85 ? 'bien' : 'tenue'}">${h > 1.25 ? 'hostil' : h < 0.85 ? 'afín' : 'neutral'}</span>`)}</div>`;
      } else if (v) {
        if (v.estado === 'terna') cuerpo = `<div class="tenue" style="font-size:12.5px">Vacante: ${esc(K.PROP[v.proponente])} arma la terna. ${Math.max(0, v.limite - E.fecha.t)} semanas.</div>`;
        else cuerpo = `<div class="tenue" style="font-size:12px;margin-bottom:6px">Terna de ${esc(K.PROP[v.proponente])}; elige ${esc(x.elige)} en ${Math.max(0, v.vota - E.fecha.t)} semanas.</div><div class="lista">${v.terna.map(cd => `<div class="it"><div class="cuerpo"><b>${esc(cd.nombre)}</b><span>${esc(etq(cd))} · independencia ${Math.round(cd.indep)} · agresividad ${Math.round(cd.agresiv)} · apoyo esperado ${Math.min(99, Math.round(K.apoyo(E, id, cd, v) * 100))} %</span></div>${esPres ? UI.botonAccion('apoyarCandidatoControl', { organo: id, candidato: cd.id }, 'Lobby', 'chico') : ''}</div>`).join('')}</div>`;
      } else cuerpo = '<div class="tenue">Sin titular.</div>';
      return `<div class="tarjeta"><div class="t-cab"><h3>${x.icono} ${esc(x.n)}</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">${esc(x.desc)}</div>${cuerpo}</div>`;
    }).join('');
    const d = c.disciplinario;
    return `<div class="grid g3">${tarjetas}</div>
      ${d ? `<div class="resultado-jugador no" style="margin-top:14px"><div style="font-size:26px">📋</div><div style="flex:1"><b>Investigación disciplinaria abierta</b><div class="tenue">La Procuraduría decide en ${Math.max(0, 26 - (E.fecha.t - d.t))} semanas. Defensa contratada: ${d.defensa}.</div></div>${UI.botonAccion('defensaDisciplinaria', {})}</div>` : ''}
      <div class="tarjeta" style="margin-top:14px"><h3>Actuaciones recientes</h3>${c.historial.length ? `<div class="lista">${c.historial.slice(0, 10).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(h.txt)}</b><span>${esc(U.fmtT(h.t))}</span></div></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">Sin actuaciones todavía.</div>'}</div>`;
  };
})(window.CURUL);
