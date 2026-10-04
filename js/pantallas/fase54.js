/* Pantallas de la Fase 54: Regiones, Legado y Ayuda (guía y buscador de acciones). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 120}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || '#4C7FE0'}"></i></div><b class="num" style="min-width:28px">${Math.round(v)}</b></div>`;
  const col = v => v >= 62 ? '#3FBF7A' : v >= 40 ? '#E8A33D' : '#E0504A';
  const vacio = t => `<div class="tenue" style="font-size:13px">${t}</div>`;
  const btn = (id, a, t, c) => UI.botonAccion(id, a || {}, t || null, c || 'chico');

  C.Pantallas.regiones = {
    render(el) {
      const E = C.E, R = C.Regiones, s = R.asegurar(E), ci = C.CrisisInt.asegurar(E);
      const cards = R.nombres(E).map(r => { const ds = Object.values(E.deptos).filter(d => d.region === r), pob = U.suma(ds.map(d => d.poblacion)), p = s.paro[r];
        return `<div class="tarjeta"><h3>${esc(r)} ${p ? '<span class="etq rojo">paro cívico</span>' : ''}</h3><div class="tenue" style="font-size:12px">${ds.length} departamentos · ${U.d1 ? U.d1(pob / 1000) : Math.round(pob / 1000)} M de habitantes</div>
          <div class="fila" style="justify-content:space-between;margin:6px 0"><span>Satisfacción con el Gobierno</span>${barra(s.sat[r], col(s.sat[r]))}</div>
          <div class="tenue" style="font-size:12px">Reclama: ${esc((R.DEMANDAS[r] || [''])[0])}</div>
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('invertirRegion', { region: r }, 'Plan de inversión')}${btn('visitarRegion', { region: r }, 'Visitar')}</div></div>`; }).join('');
      const act = ci.activas.map(x => { const T = C.CrisisInt.TIPOS[x.tipo]; return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${T.ic} ${esc(T.n)} · ${esc((C.Diplomacia.pais(x.pais) || { nombre: x.pais }).nombre)}</b><div class="tenue" style="font-size:11.5px">${U.fmtT(x.t0)}</div>${x.estado === 'activa' ? barra(x.sev, '#E0504A', 100) : ''}</div><span class="etq ${x.estado === 'activa' ? 'rojo' : x.estado === 'resuelta' ? 'verde' : 'amar'}">${x.estado}</span>${x.estado === 'activa' ? `<div class="fila" style="gap:6px;flex-wrap:wrap">${btn('gestionarCrisisInt', { crisis: x.id, via: 'diplomacia' }, 'Diplomacia')}${btn('gestionarCrisisInt', { crisis: x.id, via: 'fuerza' }, 'Mano dura')}${btn('gestionarCrisisInt', { crisis: x.id, via: 'bloque' }, 'Bloque')}${btn('gestionarCrisisInt', { crisis: x.id, via: 'ayuda' }, 'Ayuda')}</div>` : ''}</div>`; }).join('');
      el.innerHTML = `<div class="cab"><div><h1>Regiones</h1><div class="sub">Cada región tiene su identidad, sus reclamos y su paciencia. Si la satisfacción cae demasiado, estalla un paro cívico.</div></div></div>
        <div class="grid g3">${cards}</div>
        <div class="grid g2" style="margin-top:14px"><div class="tarjeta"><h3>🌐 Crisis internacionales</h3>${act ? `<div class="lista">${act}</div>` : vacio('Sin crisis internacionales abiertas. Una frontera caliente, una oleada migratoria o unas sanciones pueden estallar en cualquier momento.')}</div>
        <div class="tarjeta"><h3>Crónica regional</h3>${s.hist.length ? `<div class="lista">${s.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo" style="font-size:13px">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(h.t)}</div></div></div>`).join('')}</div>` : vacio('Sin novedades regionales.')}</div></div>`;
    }
  };

  C.Pantallas.balance = {
    render(el) {
      const E = C.E, L = C.BalanceM, b = L.balance(E), h = L.asegurar(E).hist, es = E.gobierno.presidente === 'J';
      const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:6px 0"><span>${n}</span>${barra(v, col(v), 160)}</div>`;
      el.innerHTML = `<div class="cab"><div><h1>Balance del mandato</h1><div class="sub">Cómo te recordará la historia: popularidad, economía, seguridad, honestidad, instituciones y territorio.</div></div></div>
        <div class="grid g2"><div class="tarjeta"><h3>${es ? 'Balance provisional de tu mandato' : 'Estado actual del país'}</h3><div style="font-size:34px;font-family:var(--serif,serif);margin:4px 0">${b.total}<span class="tenue" style="font-size:14px"> / 100</span></div><div class="etq ${b.total >= 60 ? 'verde' : b.total >= 45 ? 'amar' : 'rojo'}" style="margin-bottom:10px">${esc(b.titulo)}</div>${Object.entries(b.c).map(([k, v]) => fila(k, v)).join('')}</div>
        <div class="tarjeta"><h3>Mandatos anteriores</h3>${h.length ? `<div class="lista">${h.map(x => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(x.titulo)}</b> · ${x.total}/100<div class="tenue" style="font-size:11.5px">${x.t0 != null ? U.fmtT(x.t0) + ' → ' : ''}${U.fmtT(x.t)}</div><div class="tenue" style="font-size:11.5px">${Object.entries(x.c).map(([k, v]) => k + ' ' + v).join(' · ')}</div></div></div>`).join('')}</div>` : '<div class="tenue" style="font-size:13px">Todavía no has cerrado un mandato presidencial.</div>'}</div></div>`;
    }
  };

  const GRUPOS = { local: 'Gobierno local', regimen: 'Régimen político', comercio: 'Comercio exterior y bloques', diplomacia: 'Diplomacia', ejecutivo: 'Ejecutivo', seguridad: 'Seguridad', partidos: 'Partidos', legislativo: 'Legislativo', personal: 'Vida personal', campana: 'Campaña', gobierno: 'Gobierno', economia: 'Economía', participacion: 'Democracia directa', familia: 'Familia', medios: 'Medios', negociacion: 'Negociación', derechos: 'Derechos humanos', carrera: 'Carrera', control: 'Control', constitucion: 'Constitución' };
  const GUIA = [
    ['🧭 Empezar', 'Cada semana tienes unos puntos de agenda (los círculos arriba a la derecha). Las acciones cuestan puntos; el botón «Semana» avanza el tiempo. Los eventos con decisiones te interrumpen: lee y elige.'],
    ['🗳 Política y elecciones', 'Elecciones, partidos, encuestas, medios y debates. Para ganar votos cuida tu reputación (honestidad, cercanía, liderazgo) y tu partido.'],
    ['🏛 Poder legislativo', 'Presenta proyectos, negocia votos y usa presiones para acelerarlos. Las comisiones y las mesas directivas controlan la agenda.'],
    ['🪑 Negociaciones', 'Antes de abrir una mesa define sede, compromisarios y garantías (Mesas de negociación). Cuestan, pero compran confianza y acuerdos duraderos.'],
    ['🌎 Mundo y economía', 'Diplomacia, embajadas, cumbres de bloque (CAN y Mercosur con su Consejo, Comisión y Parlamento), comercio y crisis internacionales.'],
    ['🤝 Actores y regiones', 'Sindicatos, Iglesia, gremios, estudiantes y regiones tienen agenda propia. Atiéndelos o te saldrán frentes sociales y paros cívicos.'],
    ['🏅 Balance del mandato', 'Al dejar el poder se calcula un balance de tu mandato. Revísalo en Balance del mandato (y tu legado familiar en Mi carrera).']
  ];
  C.Pantallas.ayuda = {
    render(el) {
      const E = C.E, acc = C.Acciones.lista().filter(a => a.nombre);
      const filas = acc.sort((a, b) => (a.grupo || '').localeCompare(b.grupo || '') || a.nombre.localeCompare(b.nombre)).map(a => `<div class="it" data-q="${esc((a.nombre + ' ' + (GRUPOS[a.grupo] || a.grupo || '')).toLowerCase())}"><div class="cuerpo"><b style="white-space:normal">${a.icono || ''} ${esc(a.nombre)}</b><div class="tenue" style="font-size:11.5px">${esc(GRUPOS[a.grupo] || a.grupo || '')} · costo ${typeof a.costo === 'function' ? 'variable' : (a.costo || 0)} punto(s)</div></div></div>`).join('');
      el.innerHTML = `<div class="cab"><div><h1>Ayuda y guía</h1><div class="sub">Cómo se juega y un buscador de las ${acc.length} acciones del juego.</div></div></div>
        <div class="grid g2"><div class="col"><div class="tarjeta"><h3>🎚 Ritmo de los eventos</h3><div class="tenue" style="font-size:12.5px;margin-bottom:6px">Actual: <b>${esc((C.RITMOS[(E.ajustes || {}).ritmo || 'normal'] || C.RITMOS.normal)[0])}</b>. En «Tranquilo» se espacian los eventos secundarios; los hitos históricos y electorales no se tocan.</div><div class="fila" style="gap:6px">${Object.keys(C.RITMOS).map(k => btn('fijarRitmo', { nivel: k }, C.RITMOS[k][0])).join('')}</div></div>${GUIA.map(([t, x]) => `<div class="tarjeta"><h3>${t}</h3><div style="font-size:13px;line-height:1.5">${x}</div></div>`).join('')}</div>
        <div class="col"><div class="tarjeta"><h3>🔎 Buscar una acción</h3><input id="ay-q" type="search" placeholder="Ej.: embajador, paro, referendo, cumbre…" style="width:100%;padding:8px;margin-bottom:8px;border-radius:8px"><div class="lista" id="ay-lista" style="max-height:70vh;overflow:auto">${filas}</div><div class="tenue" id="ay-n" style="font-size:12px;margin-top:6px"></div></div></div></div>`;
      const q = el.querySelector('#ay-q'), n = el.querySelector('#ay-n'), rows = [...el.querySelectorAll('#ay-lista .it')];
      const f = () => { const v = q.value.trim().toLowerCase(); let k = 0; for (const r of rows) { const ok = !v || r.dataset.q.includes(v); r.style.display = ok ? '' : 'none'; if (ok) k++; } n.textContent = v ? `${k} resultado(s)` : ''; };
      q.addEventListener('input', f);
    }
  };
})(window.CURUL);
