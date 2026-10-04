/* Crisis e instituciones (Fases 44-45): estado de sitio, juicio político, guerra civil, prisión y exilio, intervención extranjera,
   actores con agenda y narcotráfico/atentados. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const barra = (v, c, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 110}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || '#4C7FE0'}"></i></div><b class="num" style="min-width:28px">${Math.round(v)}</b></div>`;
  const fila = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const btn = (id, args, txt, cl) => UI.botonAccion(id, args || {}, txt || null, cl || 'chico');
  const sel = (arg, opts) => `<select data-arg="${arg}">${opts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>`;
  const vacio = t => `<div class="tenue" style="font-size:13px">${t}</div>`;
  const nom = id => (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const lista = (arr, fn) => arr.length ? `<div class="lista">${arr.map(fn).join('')}</div>` : '';

  const tabSitio = E => {
    const I = C.Ins, s = I.asegurar(E).sitio, K = E.corte;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🚨 Estado de sitio</h3>
      ${fila('Estado', s.activo ? '<span class="etq rojo">vigente</span>' : '<span class="etq verde">no hay</span>')}${s.activo ? fila('Duración', `<b>${E.fecha.t - s.desde} semanas</b>`) : ''}${s.perm ? '<div class="etq rojo" style="margin:6px 0">La excepción se volvió norma</div>' : ''}
      ${fila('Presión de la Corte Constitucional', barra(K ? K.tension : 0, '#E8A33D'))}${fila('Libertades civiles', barra(C.Regimen.asegurar(E).libertad, '#3FBF7A'))}
      <div class="tenue" style="font-size:12.5px;margin:6px 0">${U.anio() < 1991 ? 'Antes de 1991 el estado de sitio era el recurso habitual para gobernar la turbulencia.' : 'Desde 1991 la conmoción interior tiene límites: la Corte la revisa y el Senado debe autorizar las prórrogas.'}</div>
      <div class="fila" style="gap:6px;flex-wrap:wrap">${btn('declararEstadoSitio', {}, 'Declarar estado de sitio')}${btn('levantarEstadoSitio', {}, 'Levantarlo')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>📜 Reforma de las reglas</h3><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Desde la oposición o la ciudadanía puedes promover una Asamblea Constituyente. El Senado y la Corte la revisan y el pueblo decide en las urnas.</div>${btn('promoverConstituyente', {}, 'Promover una Constituyente ciudadana', 'prim')}</div></div></div>`;
  };
  const tabJuicio = E => {
    const I = C.Ins, ins = I.asegurar(E), j = ins.juicio;
    const est = j ? `<div class="resultado-jugador ${j.fase === 'senado' ? 'mal' : 'ok'}"><div style="font-size:24px">⚖</div><div><b>${j.fase === 'acusacion' ? 'Acusación en la Cámara' : 'Juicio en el Senado'}</b><div class="tenue" style="font-size:12.5px">Motivo: ${esc(j.motivo)}. ${j.pretexto ? 'Los críticos hablan de un golpe parlamentario.' : ''}</div><div class="tenue" style="font-size:12.5px">Votos estimados: Cámara ${Math.round(I.votosJuicio(E, j, 'camara') * 100)} % (50 % para acusar) · Senado ${Math.round(I.votosJuicio(E, j, 'senado') * 100)} % (66 % para destituir)</div></div></div>` : vacio('No hay ningún juicio político en curso.');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>⚖ Juicio político</h3>${est}
      <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('impulsarJuicio', {}, 'Promover juicio al Presidente')}${btn('defenderseJuicio', {}, 'Defenderte (mermelada y cabildeo)')}${btn('disolverCongreso', {}, 'Disolver el Congreso')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>Juicios anteriores</h3>${lista(ins.juicios, x => `<div class="it"><div class="cuerpo">${esc(x.motivo)}<div class="tenue" style="font-size:12px">${U.fmtT(x.t0)}</div></div><span class="etq ${x.res === 'destituido' ? 'rojo' : ''}">${esc(x.res)}</span></div>`) || vacio('Ninguno.')}</div></div></div>`;
  };
  const tabGuerra = E => {
    const I = C.Ins, g = I.asegurar(E).guerra, n = I.cuentaGuerra(E);
    if (!g) return `<div class="tarjeta">${vacio('No hay guerra civil. Puede estallar si la resistencia contra un régimen se levanta en armas.')}<div style="margin-top:8px">${btn('alzarseEnArmas', {}, 'Alzarte en armas')}</div></div>`;
    const dep = Object.keys(g.control).map(id => `<div class="it"><div class="cuerpo">${esc(E.deptos[id].nombre)}</div><span class="etq ${g.control[id] === 'reb' ? 'rojo' : 'verde'}">${g.control[id] === 'reb' ? 'rebeldes' : 'gobierno'}</span></div>`).join('');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🪖 Guerra civil ${g.activa ? '' : '(terminada: ' + esc(g.res) + ')'}</h3>${fila('Motivo', esc(g.motivo))}${fila('Fuerza del Gobierno', barra(g.fGob, '#4C7FE0'))}${fila('Fuerza rebelde', barra(g.fReb, '#E0504A'))}${fila('Apoyo exterior a los rebeldes', barra(g.apoyoExt || 0, '#9b7ad6'))}${fila('Territorio rebelde', `<b>${n.reb} de ${n.total} departamentos</b>`)}
      ${g.activa ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:8px">${sel('depto', Object.keys(g.control).map(id => [id, E.deptos[id].nombre]))}${btn('ofensivaCivil', { depto: Object.keys(g.control)[0] }, 'Ofensiva', 'prim')}${btn('ceseFuegoCivil', {}, 'Proponer cese al fuego')}</div>` : ''}${g.hist.length ? `<h4 class="sub-h" style="margin:10px 0 6px">Frentes</h4>${lista(g.hist.slice(0, 6), h => `<div class="it"><div class="cuerpo" style="font-size:13px">${esc(h)}</div></div>`)}` : ''}</div></div>
      <div class="col"><div class="tarjeta"><h3>Mapa de control</h3><div class="lista" style="max-height:420px;overflow:auto">${dep}</div></div></div></div>`;
  };
  const tabPreso = E => {
    const J = E.jugador, I = C.Ins, ins = I.asegurar(E), ex = ins.exilio, p = J.preso, r = C.Regimen.asegurar(E);
    const estado = p ? `<div class="resultado-jugador mal"><div style="font-size:24px">⛓</div><div><b>Estás ${p.fase === 'detenido' ? 'detenido' : p.fase === 'juicio' ? 'en juicio' : 'condenado'}</b><div class="tenue" style="font-size:12.5px">Motivo: ${esc(p.motivo)}${p.huelga ? ' · en huelga de hambre' : ''}${J.martir ? ' · mártir de la causa' : ''}</div></div></div><div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('huelgaDeHambre', {}, 'Huelga de hambre')}${btn('fugarsePrision', {}, 'Intentar fugarte')}</div>`
      : ex ? `<div class="resultado-jugador ok"><div style="font-size:24px">✈</div><div><b>En el exilio: ${esc(nom(ex.pais))}</b><div class="tenue" style="font-size:12.5px">${E.fecha.t - ex.desde} semanas fuera · red de resistencia ${Math.round(ex.red)}</div></div></div><div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('organizarDesdeExilio', {}, 'Organizar la resistencia')}${btn('regresarDelExilio', {}, 'Regresar al país')}</div>`
      : vacio('Eres libre y estás en el país. Bajo un régimen de facto, tu riesgo judicial y tu fama determinan si te detienen.');
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>⛓ Prisión y exilio</h3>${estado}${fila('Riesgo judicial', barra(J.riesgoJudicial || 0, '#E0504A'))}</div>
      <div class="tarjeta"><h3>🛂 Asilo</h3><div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${sel('pais', ['USA', 'ESP', 'FRA', 'MEX', 'CRI', 'ARG'].filter(x => E.diplomacia.paises[x]).map(x => [x, nom(x)]))}${btn('pedirAsilo', { pais: 'MEX' }, 'Pedir asilo')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>🏴 Herramientas de un régimen</h3><div class="fila" style="gap:6px;flex-wrap:wrap">${btn('fundarPartidoOficial', {}, 'Fundar partido oficial')}${btn('eleccionesControladas', {}, 'Convocar «elecciones» controladas')}</div>${ins.oficial ? `<div class="tenue" style="margin-top:8px">Partido oficial: <b>${esc(E.partidos[ins.oficial].nombre)}</b></div>` : ''}</div>
      ${(r.exiliados || []).length ? `<div class="tarjeta"><h3>Opositores desterrados</h3><div class="tenue">${r.exiliados.length} dirigentes fuera de la política.</div></div>` : ''}</div></div>`;
  };
  const tabInterv = E => {
    const v = C.Interv.asegurar(E), mv = C.MundoVivo.asegurar(E).presion, g = E.ins && E.ins.guerra;
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>🇺🇸 Estados Unidos y el mundo</h3>${fila('Ayuda y respaldo de EE. UU.', barra(v.ayuda, '#4C7FE0'))}${fila('Sanciones', v.sanciones ? '<span class="etq rojo">vigentes</span>' : '<span class="etq verde">ninguna</span>')}${fila('Relación con EE. UU.', barra((E.diplomacia.paises.USA || { relacion: 50 }).relacion, '#4C7FE0'))}${fila('Apoyo externo a rebeldes', barra(C.Interv.apoyoRebeldes(E), '#9b7ad6'))}
        <div class="tenue" style="font-size:12.5px;margin:8px 0">${C.Interv.guerraFria() ? 'En plena Guerra Fría, Washington tolera (y a veces promueve) golpes anticomunistas.' : 'Tras la Guerra Fría, un golpe suele traer condena y sanciones.'}</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${sel('pais', [['USA', 'Estados Unidos'], ['VEN', 'Venezuela'], ['CUB', 'Cuba'], ['RUS', 'Rusia'], ['CHN', 'China']])}${btn('pedirAyudaExterior', { pais: 'USA' }, 'Pedir ayuda exterior')}${btn('buscarApoyoEEUU', {}, 'Buscar visto bueno para un golpe')}</div></div></div>
      <div class="col">${v.hist.length ? `<div class="tarjeta"><h3>Crónica</h3>${lista(v.hist.slice(0, 8), h => `<div class="it"><div class="cuerpo">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(h.t)}</div></div></div>`)}</div>` : ''}${g && g.activa ? `<div class="tarjeta"><h3>Guerra civil en curso</h3><div class="tenue">El apoyo exterior inclina la balanza de los frentes.</div></div>` : ''}</div></div>`;
  };
  const tabNarco = E => {
    const k = C.Cartel.crim(E), J = E.jugador;
    const cr = k.crimenes.map(c => `<div class="it"><div class="cuerpo"><b>${esc(c.victima)}</b> · ${esc(c.cargo)}${c.partido ? ' · ' + esc(c.partido) : ''}<div class="tenue" style="font-size:11.5px">${U.fmtT(c.t)} · ${esc(c.motivo)}${c.recompensa ? ' · recompensa ' + c.recompensa : ''}</div><div class="tenue" style="font-size:11.5px">${c.material ? 'autores materiales capturados' : 'sin capturas'}${c.intelectual ? ' · determinador identificado' : ''}${c.estatal && c.intelectual ? ' · implicación estatal' : ''}</div>${c.estado === 'abierto' ? barra(c.avance, '#6CC4F5', 90) : ''}</div><span class="etq ${c.estado === 'abierto' ? 'amar' : c.estado === 'resuelto' ? 'verde' : 'rojo'}">${c.estado}</span>${c.estado === 'abierto' ? btn('investigarMagnicidio', { cid: c.id }, 'Investigar') + btn('ofrecerRecompensa', { cid: c.id }, 'Recompensa') : ''}</div>`).join('');
    const cands = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && p.r && (p.cargo.tipo === 'aspirante' || p.fuerza > 55)).sort((a, b) => b.fuerza - a.fuerza).slice(0, 8);
    return `<div class="grid g2"><div class="col"><div class="tarjeta"><h3>💼 Narcotráfico</h3>${fila('Poder del cartel', barra(k.poder, '#E0504A'))}${fila('Amenaza contra ti', barra(k.amenaza, '#E8A33D'))}${fila('Terrorismo', barra(k.terror, '#9b7ad6'))}${fila('Extradición', k.ext ? '<span class="etq verde">aplicada</span>' : '<span class="etq amar">suspendida</span>')}${k.escobar ? fila('El jefe del cartel', `<b>${esc({ catedral: 'preso en La Catedral', fugitivo: 'fugitivo', muerto: 'muerto' }[k.escobar])}</b>`) : ''}
      <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('combatirCartel', {}, 'Ofensiva (Bloque de Búsqueda)', 'prim')}${btn('negociarSometimiento', {}, 'Mesa de sometimiento')}${sel('modo', [['aplicar', 'Aplicar extradición'], ['suspender', 'Suspender extradición']])}${btn('decretarExtradicion', { modo: 'aplicar' }, 'Política de extradición')}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>🛡 Tu seguridad</h3>${fila('Esquema de seguridad', barra(J.escolta || 15, '#3FBF7A'))}${fila('Salud', barra(J.salud == null ? 85 : J.salud, '#3FBF7A'))}<div style="margin-top:8px">${btn('reforzarEscolta', {}, 'Reforzar el esquema')}</div><div class="tenue" style="font-size:12px;margin-top:8px">Los carteles, las mafias y los extremistas atentan contra políticos y candidatos. Un buen esquema salva vidas.</div></div>
      <div class="tarjeta"><h3>🕯 Crímenes políticos</h3>${fila('Conmoción nacional', barra(k.conmocion || 0, '#9b7ad6'))}${cr ? `<div class="lista">${cr}</div>` : vacio('Sin magnicidios recientes. Cuando asesinan a un político, se abre un caso que puedes impulsar.')}</div>
      <div class="tarjeta"><h3>🧑‍✈️ Proteger candidatos y dirigentes</h3>${cands.length ? `<div class="lista">${cands.map(p => `<div class="it"><div class="cuerpo"><b>${esc(p.nombre)}</b><div class="tenue" style="font-size:11.5px">${esc(p.cargo.tipo)} · esquema ${p.escolta || 0}</div></div>${btn('escoltarCandidato', { pid: p.id }, 'Proteger')}</div>`).join('')}</div>` : vacio('No hay candidatos destacados.')}</div></div></div>`;
  };
  const TABS = [['sitio', '🚨 Estado de sitio', tabSitio], ['juicio', '⚖ Juicio político', tabJuicio], ['guerra', '🪖 Guerra civil', tabGuerra], ['preso', '⛓ Prisión y exilio', tabPreso], ['interv', '🇺🇸 Intervención', tabInterv], ['narco', '💼 Narco y atentados', tabNarco]];
  C.Pantallas.crisis = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.crTab || 'sitio'; E.ui.crTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Crisis e instituciones</h1><div class="sub">Estado de sitio, juicio político, guerra civil, presos y exiliados, intervención extranjera, actores sociales y narcotráfico.</div></div></div><div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div><div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => { const t = e.target.closest('.tabs [data-tab]'); if (t) C.App.ir('crisis', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
