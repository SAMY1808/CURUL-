/* Medios: ecosistema mediático, noticias y acciones de comunicación. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  const base = {
    render(el) {
      const E = C.E, J = E.jugador;
      const f = E.ui.filtroNot || 'todas';
      const ns = E.medios.noticias.filter(n => f === 'todas' || (f === 'mias' ? n.jugador : n.tipo === f));
      const tipos = { todas: 'Todas', mias: 'Sobre mí', legislativo: 'Legislativo', gobierno: 'Gobierno', evento: 'País', elecciones: 'Elecciones', encuesta: 'Encuestas', control: 'Control político' };
      const medios = E.medios.lista;
      el.innerHTML = `<div class="cab"><div><h1>Medios de comunicación</h1><div class="sub">Tu relación con la prensa define cómo te ve el país.</div></div>
        <div class="fila">${UI.botonAccion('ruedaPrensa', {})}<span class="accion-form fila"><select data-arg="segmento">${Object.values(C.Opinion.SEGMENTOS).flat().map(s => `<option value="${s[0]}">${esc(s[1])}</option>`).join('')}</select>${UI.botonAccion('campanaComunicacion', {})}</span></div></div>
      <div class="grid g-dash">
        <div class="tarjeta"><div class="t-cab"><h3>Noticias</h3><select id="m-f">${Object.entries(tipos).map(([k, n]) => `<option value="${k}" ${k === f ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="periodico">${ns.slice(0, 40).map((n, i) => { const m = C.Medios.medio(E, n.medio); return `<article class="nota ${i === 0 ? 'portada' : ''} ${n.importante ? 'imp' : ''}"><div class="nota-medio">${m.icono} ${esc(m.nombre)} · <span>${U.fmtT(n.t)}</span></div><h4>${esc(n.titular)}</h4>${n.tono ? `<span class="etq ${n.tono > 0 ? 'verde' : 'rojo'}">${n.tono > 0 ? 'Tono favorable' : 'Tono crítico'}</span>` : ''}${n.jugador ? ' <span class="etq oro">Sobre ti</span>' : ''}</article>`; }).join('') || '<div class="vacio">Sin noticias en esta categoría.</div>'}</div></div>
        <div class="col">
          <div class="tarjeta"><h3>Mapa de medios · línea editorial vs. audiencia</h3>
            ${(() => { const W = 420, H = 210; let s = `<svg class="graf" viewBox="0 0 ${W} ${H}"><line class="rejilla" x1="${W / 2}" x2="${W / 2}" y1="10" y2="${H - 22}"/><line class="eje" x1="10" x2="${W - 10}" y1="${H - 22}" y2="${H - 22}"/><text x="12" y="${H - 8}">Izquierda</text><text x="${W - 12}" y="${H - 8}" text-anchor="end">Derecha</text>`;
              s += `<line x1="${10 + (J.ideologia.eco + 100) / 200 * (W - 20)}" x2="${10 + (J.ideologia.eco + 100) / 200 * (W - 20)}" y1="10" y2="${H - 22}" stroke="#D9B45A" stroke-dasharray="3 3"/>`;
              for (const m of medios) { const x = 10 + (m.linea + 100) / 200 * (W - 20), y = H - 22 - m.audiencia / 50 * (H - 40); s += `<circle cx="${x}" cy="${y}" r="${4 + m.credibilidad / 12}" fill="${m.relJ > 10 ? '#26B59A' : m.relJ < -10 ? '#E8812A' : '#6f86b3'}" fill-opacity=".8" stroke="#0A111D" stroke-width="2"${UI.tt(`<b>${esc(m.nombre)}</b><br>${esc(m.tipo)} · audiencia ${m.audiencia}<br>Credibilidad ${m.credibilidad}<br>Relación contigo ${Math.round(m.relJ)}`)}/><text x="${x}" y="${y - 9 - m.credibilidad / 12}" text-anchor="middle" style="font-size:9.5px">${esc(m.nombre.split(' ').slice(-1)[0])}</text>`; }
              return s + '</svg>'; })()}
            <div class="tenue" style="font-size:12px">Altura = audiencia · tamaño = credibilidad · línea dorada = tu posición.</div></div>
          <div class="tarjeta"><div class="t-cab"><h3>Redes sociales</h3>${UI.botonAccion('publicarRedes', {}, 'Publicar')}</div>
            ${G.medidor(E.redes.viralidad, { tam: 90, etq: 'VIRALIDAD' })}
            <div class="tenue" style="font-size:12px;margin-top:6px">${E.redes.publicaciones} publicaciones · ${E.redes.cancelaciones} ola(s) de críticas</div></div>
          <div class="tarjeta"><h3>Conceder entrevista</h3><div class="lista">${medios.map(m => `<div class="it"><span style="font-size:18px">${m.icono}</span><div class="cuerpo"><b>${esc(m.nombre)}</b><span>${esc(m.tipo)}${m.region ? ' · ' + esc(m.region) : ''} · ${Math.abs(m.linea - J.ideologia.eco) > 60 ? '<span class="mal">hostil a tus ideas</span>' : Math.abs(m.linea - J.ideologia.eco) < 30 ? '<span class="bien">afín</span>' : 'neutral'}</span></div>${UI.botonAccion('entrevista', { medio: m.id }, 'Entrevista', 'chico')}</div>`).join('')}</div></div>
        </div></div>`;
      UI.$('#m-f', el).onchange = e => { E.ui.filtroNot = e.target.value; C.App.refrescar(); };
    }
  };

  const periodico = (E, medioId) => {
    const P = C.Periodico, ed = P.edicion(E, medioId), m = ed.medio, sesgo = ed.afin > 0.35 ? 'afín al gobierno' : ed.afin < -0.2 ? 'crítico del gobierno' : 'de línea independiente';
    const nota = (n, cls) => `<article class="nota ${cls || ''}"><div class="nota-medio">${esc(n.tipo)}</div><h4>${esc(n.txt)}</h4>${n.sub ? `<div style="font-size:12.5px;color:var(--tinta2)">${esc(n.sub)}</div>` : ''}</article>`;
    return `<div class="tarjeta"><div class="t-cab"><h3>${m.icono} ${esc(m.nombre)} · edición del ${U.fmtT(E.fecha.t, false)}</h3><select id="m-per">${E.medios.lista.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${x.icono} ${esc(x.nombre)}</option>`).join('')}</select></div>
      <div class="tenue" style="font-size:12px;margin-bottom:10px">Cada medio cuenta la semana a su manera: este es ${sesgo} (línea editorial ${m.linea > 0 ? '+' : ''}${m.linea}) y su credibilidad es ${m.credibilidad}%. Cambia de periódico para ver el mismo país con otra mirada.</div>
      <div class="periodico">${ed.portada ? nota(ed.portada, 'portada') : ''}${ed.pais.map(n => nota(n)).join('')}</div>
      <div class="grid g2" style="margin-top:14px"><div class="tarjeta"><h3>🌍 En el mundo</h3>${ed.mundo.length ? `<div class="lista">${ed.mundo.map(n => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(n.txt)}</b></div></div>`).join('')}</div>` : '<div class="tenue">Semana tranquila en el planeta.</div>'}</div>
        <div class="tarjeta"><h3>✒ Editorial</h3><p style="font-family:var(--display);font-size:15px;line-height:1.5;margin:0">${esc(ed.editorial)}</p></div></div></div>`;
  };

  C.Pantallas.medios = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.medTab || 'noticias'; E.ui.medTab = tab;
      if (tab === 'periodico' && C.Periodico) {
        el.innerHTML = `<div class="cab"><div><h1>Medios de comunicación</h1><div class="sub">La semana en el planeta y en el país, según el periódico que leas.</div></div></div>
          <div class="tabs"><button data-mtab="noticias">Noticias y prensa</button><button data-mtab="periodico" class="activo">Periódico de la semana</button></div><div style="margin-top:14px">${periodico(E, E.ui.periodicoMedio)}</div>`;
        const sel = el.querySelector('#m-per'); if (sel) sel.onchange = e => { E.ui.periodicoMedio = e.target.value; C.App.refrescar(); };
        el.onclick = e => { const t = e.target.closest('[data-mtab]'); if (t) C.App.ir('medios', { tab: t.dataset.mtab }); };
        return;
      }
      base.render(el);
      const cab = el.querySelector('.cab'); if (cab && C.Periodico) cab.insertAdjacentHTML('afterend', '<div class="tabs"><button data-mtab="noticias" class="activo">Noticias y prensa</button><button data-mtab="periodico">Periódico de la semana</button></div>');
      const prev = el.onclick; el.onclick = e => { const t = e.target.closest('[data-mtab]'); if (t) return C.App.ir('medios', { tab: t.dataset.mtab }); if (prev) prev(e); };
    }
  };
})(window.CURUL);
