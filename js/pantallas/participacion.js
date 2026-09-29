/* Democracia directa: referendos, plebiscitos, consultas populares, cabildos y revocatoria del mandato. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const EXCLUIDAS = ['presupuesto', 'nuevoministerio', 'ratificaciontratado'];
  const PROMOTOR = { J: 'Tú', oposicion: 'La oposición', ciudadania: 'Un comité ciudadano', gobierno: 'El Gobierno' };
  const UMBRAL = {
    derogatorio: 'Vota al menos el 40 % del censo y gana el Sí: la ley queda derogada y se revierten sus efectos.',
    aprobatorio: 'Vota al menos el 25 % del censo y gana el Sí: el proyecto hundido se convierte en ley.',
    plebiscito: 'Gana el Sí con al menos el 13 % del censo a favor: el Presidente aplica la política.',
    consulta: 'Vota al menos el 33 % del censo y gana el Sí: el Gobierno aplica la medida.',
    local: 'Vota al menos el 33 % del censo del territorio y gana el Sí.',
    revocatoria: 'Vota al menos el 40 % del censo y gana el Sí: el funcionario pierde el cargo.'
  };
  const lado = (m, l) => m.tipo === 'revocatoria' ? (l === 'si' ? 'Revocar' : 'Mantener') : (l === 'si' ? 'Sí' : 'No');
  const encuesta = (E, m) => U.clamp(m.apoyo + (C.Corte.hash(m.id + ':' + E.fecha.t) - 0.5) * 6, 1, 99);
  const semRest = (m) => {
    const t = C.Participacion.TIPOS[m.tipo];
    return Math.max(0, ({ senado: 3, concepto: 3, corte: m.durCorte || 8, registraduria: 4, campana: t.camp }[m.estado] || 0) - (m.semEtapa || 0));
  };

  const chipsEtapas = m => {
    const P = C.Participacion, et = P.TIPOS[m.tipo].etapas, idx = et.indexOf(m.estado);
    return et.map((e, i) => `<span class="etq ${i < idx ? 'verde' : i === idx ? 'oro' : ''}">${i < idx ? '✔ ' : ''}${esc(P.ETAPA[e])}</span>`).join('<span class="tenue">›</span>');
  };

  const posturas = (E, m) => {
    const P = C.Participacion;
    const ps = Object.values(E.partidos).filter(p => !p.especial && !p.futuro).sort((a, b) => b.popularidad - a.popularidad).slice(0, 7);
    return `<div class="fila" style="gap:10px;flex-wrap:wrap;margin-top:8px">${ps.map(p => {
      const s = P.posturaPartido(E, m, p.id), fijada = m.posturas[p.id] != null;
      const sim = s > 0.25 ? '▲' : s < -0.25 ? '▼' : '●', col = s > 0.25 ? 'var(--si)' : s < -0.25 ? 'var(--no)' : 'var(--tenue)';
      return `<span class="sigla"${UI.tt(`${esc(p.nombre)}: ${s > 0.25 ? 'apoya el ' + lado(m, 'si') : s < -0.25 ? 'apoya el ' + lado(m, 'no') : 'sin postura clara'}${fijada ? ' (fijada por su director)' : ''}`)}><span class="pto" style="background:${p.color}"></span>${esc(p.sigla)} <span style="color:${col}">${sim}</span></span>`;
    }).join('')}</div>`;
  };

  const tarjeta = (E, m) => {
    const P = C.Participacion, t = P.TIPOS[m.tipo];
    let detalle = '', acciones = '';
    if (m.estado === 'firmas') {
      detalle = `<div style="margin:8px 0">${G.barrasH([{ etq: 'Firmas', v: m.firmas, color: 'var(--oro)' }], { max: 100, fmt: v => Math.round(v) + ' %', anchoEtq: '70px' })}</div>
        <div class="tenue" style="font-size:12px">Promueve: ${esc(PROMOTOR[m.promotor] || m.promotor)}. Si no se reúnen a tiempo (${Math.max(0, 60 - m.sem)} semanas), la iniciativa se cae.</div>`;
      acciones = UI.botonAccion('recolectarFirmas', { id: m.id }, null, 'chico');
    } else if (m.estado === 'campana') {
      const si = encuesta(E, m);
      detalle = `<div style="margin:8px 0">${G.barrasH([{ etq: lado(m, 'si'), v: si, color: 'var(--si)' }, { etq: lado(m, 'no'), v: 100 - si, color: 'var(--no)' }], { max: 100, marca: 50, fmt: v => U.d1(v) + ' %', anchoEtq: '80px' })}</div>
        <div class="tenue" style="font-size:12px">Encuesta de la semana (margen ±3). Se vota en ${semRest(m)} semanas.${m.campSi > 1 || m.campNo > 1 ? ` Campañas: ${lado(m, 'si')} ${U.d1(m.campSi)} · ${lado(m, 'no')} ${U.d1(m.campNo)}.` : ''}</div>`;
      acciones = UI.botonAccion('hacerCampanaRef', { id: m.id, lado: 'si' }, 'Campaña por ' + lado(m, 'si'), 'chico') + UI.botonAccion('hacerCampanaRef', { id: m.id, lado: 'no' }, 'Campaña por ' + lado(m, 'no'), 'chico');
    } else {
      const quien = { senado: 'El Senado', concepto: m.cargo === 'gobernador' ? 'La Asamblea' : 'El Concejo', corte: 'La Corte Constitucional', registraduria: 'La Registraduría' }[m.estado];
      detalle = `<div class="tenue" style="font-size:12px;margin:8px 0">${esc(quien)} decide en ${semRest(m)} semanas.${m.estado === 'corte' ? ' Puede tumbar la pregunta si es inconstitucional o vulnera la sustitución de la Constitución.' : ''}</div>`;
    }
    const pa = E.partidos[E.jugador.partido];
    if (pa && pa.lider === 'J' && m.estado !== 'firmas') {
      const f = m.posturas[pa.id];
      acciones += `<span class="tenue" style="font-size:12px;margin-left:6px">Tu partido${f ? ': <b>' + lado(m, f > 0 ? 'si' : 'no') + '</b>' : ''}</span>` + UI.botonAccion('fijarPosturaPartido', { id: m.id, lado: 'si' }, lado(m, 'si'), 'chico') + UI.botonAccion('fijarPosturaPartido', { id: m.id, lado: 'no' }, lado(m, 'no'), 'chico');
    }
    return `<div class="tarjeta" style="margin-bottom:14px"><div class="t-cab"><h3>${t.icono} ${esc(m.titulo)}</h3><span class="etq oro">${esc(t.nombre)}</span></div>
      <div class="fila" style="gap:6px;flex-wrap:wrap">${chipsEtapas(m)}</div>${detalle}
      <div class="tenue" style="font-size:12px">${esc(UMBRAL[m.tipo])}</div>${m.estado === 'firmas' ? '' : posturas(E, m)}
      ${acciones ? `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px;align-items:center">${acciones}</div>` : ''}</div>`;
  };

  const enCurso = E => {
    const P = C.Participacion, act = E.participacion.activos.filter(m => m.estado !== 'cerrado');
    const ult = E.participacion.historial[E.participacion.historial.length - 1];
    const nombres = { true: 'Sí', false: 'No' };
    return `<div class="grid g4">
      ${Comp.kpi('Procesos en curso', act.length, '<span class="tenue">firmas, control y campañas</span>')}
      ${Comp.kpi('Votaciones realizadas', E.participacion.historial.filter(h => !h.sinVotacion).length, '<span class="tenue">en esta partida</span>')}
      ${Comp.kpi('Última votación', ult ? esc(ult.tipo === 'revocatoria' ? 'Revocatoria' : P.TIPOS[ult.tipo].nombre.split(' ')[0]) : '—', ult ? `<span class="tenue">${esc(ult.sinVotacion ? 'se cayó' : ult.pasa ? 'ganó el Sí' : ult.valido ? 'ganó el No' : 'sin umbral')}</span>` : '')}
      ${Comp.kpi('Mecanismos', P.habilitado('derogatorio') === true ? 'Vigentes' : 'Sin regular', `<span class="tenue">${P.habilitado('derogatorio') === true ? 'Constitución de 1991 · Ley 134 de 1994' : 'sólo el plebiscito, desde 1957'}</span>`)}
    </div>
    <div style="margin-top:14px">${act.length ? act.map(m => tarjeta(E, m)).join('') : `<div class="tarjeta"><h3>Nada en marcha</h3><div class="tenue" style="font-size:12.5px;max-width:720px">No hay ningún referendo, plebiscito, consulta ni revocatoria en curso. Puedes promover uno desde la pestaña <b>Convocar</b>; la oposición, los comités ciudadanos y un presidente con buena aprobación también pueden iniciar los suyos.</div></div>`}</div>`;
  };

  const selectTemas = (E, clase, tipo, arg) => {
    const P = C.Participacion, J = E.jugador;
    const ext = tipo === 'local' ? { cargo: J.cargo, depto: J.cargoInfo && J.cargoInfo.depto } : {};
    const puedePrev = tipo !== 'local' || (J.cargoInfo && E.deptos[J.cargoInfo.depto] && (J.cargo === 'gobernador' || J.cargo === 'alcalde'));
    return C.DATA.participacion[clase].map(t => ({ t, ap: puedePrev ? P.apoyoInicial(E, Object.assign({ tipo, tema: t.id }, ext), true) : null }));
  };

  const formTema = (E, clase, tipo, accion, titulo, intro) => {
    const items = selectTemas(E, clase, tipo);
    return `<div class="tarjeta"><h3>${titulo}</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">${intro}</div>
      <div class="lista" style="margin-bottom:10px">${items.map(({ t, ap }) => `<div class="it"><div class="cuerpo"><b>${esc(t.nombre)}</b><span style="white-space:normal">${esc(t.nota)}</span></div>${ap != null ? `<span class="etq ${ap >= 55 ? 'verde' : ap >= 45 ? 'amar' : 'rojo'}"${UI.tt('Apoyo estimado hoy, antes de la campaña')}>${Math.round(ap)} % Sí</span>` : ''}</div>`).join('')}</div>
      <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="tema">${items.map(({ t }) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select>${UI.botonAccion(accion, {})}</div></div>`;
  };

  const convocar = E => {
    const P = C.Participacion, pa = E.participacion;
    const leyes = Object.values(E.proyectos).filter(p => p.estado === 'ley' && !EXCLUIDAS.includes(p.plantilla) && !P.activo(E, 'ref:' + p.id)).sort((a, b) => (b.sancionada || 0) - (a.sancionada || 0)).slice(0, 30);
    const hund = pa.hundidos.map(id => E.proyectos[id]).filter(p => p && p.estado === 'archivado' && !P.activo(E, 'ref:' + p.id)).reverse().slice(0, 30);
    const J = E.jugador, local = J.cargo === 'gobernador' || J.cargo === 'alcalde';
    const opt = (ps, f) => ps.map(p => `<option value="${p.id}">${esc(f(p))}</option>`).join('');
    return `<div class="tenue" style="font-size:12.5px;max-width:820px;margin-bottom:12px">Cualquier ciudadano puede promover un referendo reuniendo firmas; el Presidente convoca plebiscitos y consultas con el visto bueno del Senado; gobernadores y alcaldes consultan a su territorio con el concepto favorable de su Asamblea o Concejo. La Corte Constitucional revisa cada pregunta antes de la votación.</div>
      <div class="grid g2">
        <div class="tarjeta"><h3>🗳 Referendo derogatorio</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Deroga una ley vigente. Exige el 40 % del censo. Si gana el Sí se revierten los efectos que la ley ya movió.</div>
          ${leyes.length ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="proyecto" style="max-width:100%">${opt(leyes, p => `Ley ${p.ley} · ${p.titulo}`)}</select>${UI.botonAccion('promoverReferendo', { tipo: 'derogatorio' }, 'Promover derogatoria')}</div>` : '<div class="tenue" style="font-size:12px">No hay leyes vigentes que se puedan someter a referendo.</div>'}</div>
        <div class="tarjeta"><h3>📜 Referendo aprobatorio</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Aprueba un proyecto que el Congreso hundió. Exige el 25 % del censo; los proyectos populares tienen más chances.</div>
          ${hund.length ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="proyecto" style="max-width:100%">${opt(hund, p => `${p.titulo} · apoyo ${p.pop > 0 ? '+' : ''}${Math.round(p.pop)}`)}</select>${UI.botonAccion('promoverReferendo', { tipo: 'aprobatorio' }, 'Promover aprobatorio')}</div>` : '<div class="tenue" style="font-size:12px">Aún no se ha hundido en el Congreso ningún proyecto que se pueda revivir.</div>'}</div>
      </div>
      <div class="grid g2" style="margin-top:14px">${formTema(E, 'plebiscito', 'plebiscito', 'convocarPlebiscito', '📣 Plebiscito', 'Sólo el Presidente lo convoca, sobre una política de su Gobierno. Basta con que el Sí reúna el 13 % del censo. Un fracaso golpea su aprobación.')}
        ${formTema(E, 'consulta', 'consulta', 'convocarConsultaNacional', '🗣 Consulta popular nacional', 'El Presidente pregunta al país sobre una medida concreta. Exige el 33 % del censo. Si gana el Sí, el Gobierno la aplica.')}</div>
      <div class="tarjeta" style="margin-top:14px"><h3>🏘 Consultas y cabildos del territorio</h3>
        ${local ? `<div class="grid g2"><div>${formTema(E, 'local', 'local', 'convocarConsultaLocal', 'Consulta popular local', 'Con el concepto favorable de tu ' + (J.cargo === 'gobernador' ? 'Asamblea' : 'Concejo') + '. Exige el 33 % del censo del territorio.').replace('<div class="tarjeta">', '<div>')}</div>
          <div><h3>Cabildo abierto</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Una sesión pública con la ciudadanía: baja el descontento, mejora tu relación con el territorio y sube un poco tu imagen.</div>${UI.botonAccion('cabildoAbierto', {})}</div></div>` : '<div class="tenue" style="font-size:12.5px">Las consultas populares locales y los cabildos abiertos son herramientas de gobernadores y alcaldes. Cuando ocupes una de esas sillas, aparecerán aquí.</div>'}</div>`;
  };

  const revocatoria = E => {
    const P = C.Participacion, Kc = C.Constitucion;
    const habil = Kc.valor(E, 'revocatoriaPresidencial') === 'si';
    const presPol = E.gobierno.presidente === 'J' ? E.jugador : E.politicos[E.gobierno.presidente];
    const okPres = P.puedeRevocarPresidente(E);
    const bloqueoAnio = P.habilitado('revocatoria');
    const filas = [];
    for (const d of Object.values(E.deptos)) for (const tipo of ['gobernador', 'alcalde']) {
      if (!d[tipo]) continue;
      const id = d[tipo], pol = id === 'J' ? E.jugador : E.politicos[id]; if (!pol) continue;
      filas.push({ d, tipo, id, pol, aprob: P.aprobLocal(E, d.id, tipo), act: P.activo(E, 'rev:' + d.id + ':' + tipo), puede: bloqueoAnio === true ? P.puedeRevocar(E, d.id, tipo) : bloqueoAnio });
    }
    const ver = filas.sort((a, b) => a.aprob - b.aprob).slice(0, E.ui.revTodos ? filas.length : 14);
    const tabla = ver.length ? `<table class="tabla"><thead><tr><th>Cargo</th><th>Funcionario</th><th>Partido</th><th>Aprobación</th><th>Estado</th><th></th></tr></thead><tbody>${ver.map(f => `<tr><td>${f.tipo === 'gobernador' ? 'Gobernación de ' + esc(f.d.nombre) : 'Alcaldía de ' + esc(f.d.capital)}</td><td><b>${esc(f.pol.nombre)}</b>${f.id === 'J' ? ' <span class="etq oro">tú</span>' : ''}</td><td>${f.id === 'J' ? Comp.partido(E, E.jugador.partido) : Comp.partido(E, f.pol.partido)}</td><td><span class="etq ${f.aprob >= 55 ? 'verde' : f.aprob >= 42 ? 'amar' : 'rojo'}">${Math.round(f.aprob)} %</span></td>
      <td>${f.act ? `<span class="etq oro">${esc(C.Participacion.ETAPA[f.act.estado])}</span>` : f.puede === true ? '<span class="tenue">Se puede pedir</span>' : `<span class="tenue" style="font-size:11.5px">${esc(f.puede)}</span>`}</td>
      <td>${!f.act && f.puede === true && f.id !== 'J' ? UI.botonAccion('impulsarRevocatoria', { depto: f.d.id, cargo: f.tipo }, 'Impulsar', 'chico') : ''}</td></tr>`).join('')}</tbody></table>
      ${filas.length > 14 ? `<div class="fila" style="margin-top:10px"><button class="btn chico" data-rev-todos="1">${E.ui.revTodos ? 'Mostrar sólo los más impopulares' : 'Mostrar todos (' + filas.length + ')'}</button></div>` : ''}` : '<div class="tenue" style="font-size:12px">Todavía no hay gobernadores ni alcaldes elegidos por voto popular.</div>';
    return `<div class="tarjeta"><div class="t-cab"><h3>🚪 Presidente ${presPol ? esc(presPol.nombre) : ''}</h3><span class="etq ${habil ? 'verde' : ''}">${habil ? 'Revocatoria habilitada' : 'No está en la Constitución'}</span></div>
        <div class="tenue" style="font-size:12.5px;max-width:780px;margin-bottom:10px">${habil ? 'La Constitución permite revocar al Presidente entre el primer y el tercer año de su mandato. Si el Sí reúne el 40 % del censo, asume el vicepresidente.' : 'En la Constitución vigente no se puede revocar al Presidente. Una reforma constitucional (Gobierno y oposición → Constitución → «Revocatoria del mandato presidencial») lo permitiría, y quedaría sujeta al control de la Corte.'}</div>
        ${UI.botonAccion('impulsarRevocatoriaPresidente', {})}${habil && okPres !== true && E.gobierno.presidente !== 'J' ? `<span class="tenue" style="font-size:12px;margin-left:8px">${esc(okPres)}</span>` : ''}</div>
      <div class="tarjeta" style="margin-top:14px"><h3>Gobernadores y alcaldes</h3><div class="tenue" style="font-size:12px;max-width:780px;margin-bottom:10px">Se puede pedir la revocatoria entre el primer y el tercer año de cada periodo. Reúne firmas, la Registraduría las verifica y, si el Sí llega al 40 % del censo, una elección atípica escoge al reemplazo (el partido del revocado llega debilitado). Los alcaldes y gobernadores muy impopulares son blanco natural.</div>${tabla}</div>`;
  };

  const historial = E => {
    const P = C.Participacion, h = E.participacion.historial.slice().reverse();
    return `<div class="tarjeta"><h3>Historial de votaciones</h3>${h.length ? `<div class="lista">${h.map(r => {
      const t = P.TIPOS[r.tipo];
      if (r.sinVotacion) return `<div class="it"><span style="font-size:20px">${t.icono}</span><div class="cuerpo"><b>${esc(r.titulo)}</b><span>${esc(t.nombre)} · ${esc(U.fmtT(r.t))} · ${esc(r.motivo)}</span></div><span class="etq">Se cayó</span></div>`;
      return `<div class="it"><span style="font-size:20px">${t.icono}</span><div class="cuerpo"><b>${esc(r.titulo)}</b><span>${esc(t.nombre)} · ${esc(U.fmtT(r.t))} · ${U.d1(r.yes)} % Sí · participación ${U.d1(r.turnout * 100)} %${r.efectos && r.efectos.length ? ' · ' + esc(r.efectos[0]) : ''}</span></div><span class="etq ${r.pasa ? 'verde' : r.valido ? 'rojo' : 'amar'}">${r.pasa ? 'Gana el Sí' : r.valido ? 'Gana el No' : 'Sin umbral'}</span></div>`;
    }).join('')}</div>` : '<div class="tenue" style="font-size:12px">Aún no se ha votado ninguna consulta en esta partida.</div>'}</div>`;
  };

  const TABS = [['curso', 'En curso'], ['convocar', 'Convocar'], ['revocatoria', 'Revocatoria'], ['historial', 'Historial']];
  C.Pantallas.participacion = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.partTab || 'curso';
      E.ui.partTab = tab;
      const n = E.participacion.activos.filter(m => m.estado !== 'cerrado').length;
      const cuerpo = { curso: enCurso, convocar, revocatoria, historial }[tab](E);
      el.innerHTML = `<div class="cab"><div><h1>Democracia directa</h1><div class="sub">Referendos, plebiscitos, consultas populares y revocatoria del mandato: el pueblo decide, con umbrales de participación reales y control de la Corte.</div></div></div>
        <div class="tabs">${TABS.map(([k, nm]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${nm}${k === 'curso' && n ? ` (${n})` : ''}</button>`).join('')}</div>
        <div style="margin-top:14px">${cuerpo}</div>`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('participacion', { tab: t.dataset.tab });
        const rt = e.target.closest('[data-rev-todos]'); if (rt) { E.ui.revTodos = !E.ui.revTodos; C.App.refrescar(); }
      };
    },

    /* Noche de votación: resultado de un referendo, plebiscito, consulta o revocatoria. */
    nocheVotacion(r) {
      const E = C.E, P = C.Participacion, t = P.TIPOS[r.tipo];
      const lugar = r.depto && E.deptos[r.depto] ? ' · ' + E.deptos[r.depto].nombre : '';
      const sl = r.tipo === 'revocatoria' ? ['Revocar', 'Mantener'] : ['Sí', 'No'];
      const titular = r.pasa ? (r.tipo === 'revocatoria' ? 'Gana la revocatoria' : 'Gana el Sí') : r.valido ? (r.tipo === 'revocatoria' ? 'El funcionario se salva' : 'Gana el No') : 'No se alcanza la participación mínima';
      const censoPct = r.turnout * r.yes;
      const umbralTxt = r.tipo === 'plebiscito' ? `El Sí necesitaba el 13 % del censo: obtuvo ${U.d1(censoPct)} %.` : `Umbral: ${Math.round(r.umbral * 100)} % del censo. Participaron ${U.d1(r.turnout * 100)} %.`;
      const cuerpo = `<p class="tenue" style="margin-top:0">${esc(t.nombre)}${esc(lugar)}: <b>${esc(r.titulo)}</b></p>
        ${G.barrasH([{ etq: sl[0], v: r.yes, color: 'var(--si)' }, { etq: sl[1], v: r.no, color: 'var(--no)' }], { max: 100, marca: 50, fmt: v => U.d1(v) + ' %', anchoEtq: '90px' })}
        <div style="margin-top:10px">${G.barrasH([{ etq: 'Participación', v: r.turnout * 100, color: '#8FB5E8' }], { max: 100, marca: r.umbral ? r.umbral * 100 : null, fmt: v => U.d1(v) + ' %', anchoEtq: '90px' })}</div>
        <div class="tenue" style="font-size:12px;margin:6px 0 12px">${esc(umbralTxt)}</div>
        <div class="resultado-jugador ${r.pasa !== !!r.contraJ ? 'ok' : 'no'}"><div style="font-size:30px">${r.pasa ? (r.contraJ ? '🚪' : '✅') : r.valido ? (r.contraJ ? '🛡' : '❌') : '🕳'}</div><div><b>${esc(titular)}</b><div class="tenue">${U.d1(r.yes)} % ${esc(sl[0])} · ${U.d1(r.no)} % ${esc(sl[1])}</div></div></div>
        ${r.efectos && r.efectos.length ? `<h3 style="margin:8px 0;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--tenue)">Consecuencias</h3><div class="lista">${r.efectos.map(x => `<div class="it"><div class="cuerpo"><span style="white-space:normal;color:var(--texto2)">${esc(x)}</span></div></div>`).join('')}</div>` : ''}
        <div class="fila" style="margin-top:14px;justify-content:flex-end"><button class="btn prim" id="nv-cerrar">Continuar</button></div>`;
      const m = UI.modal({ titulo: 'Noche de votación', icono: t.icono, cuerpo, sinCerrar: true });
      m.cuerpo.querySelector('#nv-cerrar').onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    }
  };
})(window.CURUL);
