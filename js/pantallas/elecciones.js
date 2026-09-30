/* Elecciones: calendario, campaña del jugador, resultados históricos y Noche Electoral animada. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp, El = C.Elecciones;
  C.Pantallas = C.Pantallas || {};
  const colorP = (E, pid) => E.partidos[pid] ? E.partidos[pid].color : pid === 'MOV' ? '#F0D48A' : '#8C96A3';
  const siglaP = (E, pid) => E.partidos[pid] ? E.partidos[pid].sigla : pid === 'MOV' ? 'Mov. propio' : pid === 'BLANCO' ? 'Voto en blanco' : pid;
  const nombreTipo = r => r.tipo === 'congreso' ? `Congreso ${r.anio}` : r.tipo === 'presidencial' ? `Presidencial ${r.anio} · ${r.vuelta === 2 ? '2ª' : '1ª'} vuelta` : `Regionales ${r.anio}`;
  /* Tabla candidato a candidato de una lista (voto preferente): cuántos votos saca cada uno y
     quién pasa y quién no, no sólo el puesto del jugador. */
  const tablaLista = (E, lista, tot) => `<div class="lista">${lista.map(c => `<div class="it ${c.pol === 'J' ? 'sel' : ''}" style="padding:4px 6px">
      <span class="tenue num" style="width:24px">${c.puesto}</span>
      <div class="cuerpo"><b style="font-size:12.5px">${esc(Comp.nombrePol(E, c.pol))}${c.pol === 'J' ? ' (tú)' : ''}</b></div>
      <b class="num" style="width:64px;text-align:right">${U.n(c.votos)}</b>
      <span class="tenue num" style="width:48px;text-align:right">${tot ? U.d1(c.votos / tot * 100) + '%' : ''}</span>
      <span class="etq ${c.electo ? 'verde' : 'rojo'}" style="margin-left:8px">${c.electo ? 'Pasa' : 'No pasa'}</span>
    </div>`).join('')}</div>`;

  const formulaCard = (E, cam) => {
    const V = C.Vice, ops = V.opciones(E), sel = cam.formula && E.politicos[cam.formula.vice];
    const tipo = { copartidario: 'Copartidario', aliado: 'Aliado', independiente: 'Independiente' };
    return `<div class="tarjeta" style="margin-top:14px"><div class="t-cab"><h3>Fórmula vicepresidencial</h3>${sel ? `<span class="etq verde">Tu fórmula: ${esc(sel.nombre)}</span>` : '<span class="etq amar">Sin elegir: se completará sola al inscribirse</span>'}</div>
      <div class="tenue" style="font-size:12px;margin-bottom:8px">El nombre que te acompaña suma votos (más si es de una región fuerte o de un partido aliado, que además entra a tu Gobierno) y será quien asuma si faltas como Presidente.</div>
      <div class="lista">${ops.map(o => `<div class="it">${Comp.avatar(E, o.p, 32)}<div class="cuerpo"><b>${esc(o.p.nombre)}</b><span class="tenue">${tipo[o.tipo]}${o.p.partido ? ' · ' + esc(E.partidos[o.p.partido].sigla) : ''} · ${esc(E.deptos[o.p.depto].nombre)} · aporte ${o.aporte} · ambición ${o.p.r.amb}${o.p.extraFormula ? ' · ' + esc(V.EXTRAS[o.p.extraFormula].n) : ''}</span></div>${cam.formula && cam.formula.vice === o.p.id ? '<span class="etq verde">Elegido</span>' : UI.botonAccion('elegirFormula', { pol: o.p.id }, null, 'chico')}</div>`).join('')}</div></div>`;
  };

  const campanaActiva = (E) => {
    const cam = E.elecciones.campana, J = E.jugador;
    const p = El.proyeccion(E, false);
    const sem = El.semanasPara(E, { fecha: new Date(cam.fecha) });
    const capa = E.ui.capaCamp || 'favorabilidad';
    const mapa = C.Mapa.svg(E, { capa, altoMax: 420, marcador: cam.depto || J.residencia });
    const enc = cam.encuestas.map(x => [x.t, x.intencion]);
    return `<div class="grid g4">
      <div class="tarjeta">${Comp.kpi('Faltan', sem + ' semanas', esc(U.fmtFecha(new Date(cam.fecha))))}</div>
      <div class="tarjeta">${Comp.kpi('Intención de voto (est.)', U.d1(p.intencion) + '%', cam.encuestas.length ? 'Última encuesta: ' + U.d1(cam.encuestas[cam.encuestas.length - 1].intencion) + '%' : '')}</div>
      <div class="tarjeta">${G.medidor(p.prob * 100, { tam: 120, etq: 'PROB. DE GANAR', texto: Math.round(p.prob * 100) + '%' })}</div>
      <div class="tarjeta">${Comp.kpi('Caja de campaña', U.cop(cam.caja), `Gastado ${U.cop(cam.gastado)} de ${U.cop(cam.tope)} (tope legal)`)}<div class="barra-h" style="margin-top:6px"><i style="width:${Math.min(100, cam.gastado / cam.tope * 100)}%;background:var(--oro)"></i></div></div>
    </div>
    ${cam.cargo === 'presidencia' ? formulaCard(E, cam) : ''}
    <div class="grid g-dash" style="margin-top:14px">
      <div class="tarjeta"><div class="t-cab"><h3>Mapa de campaña</h3><div class="seg" id="camp-capa">${[['favorabilidad', 'Favorabilidad'], ['reconocimiento', 'Reconocimiento'], ['senado', 'Voto por partidos']].map(([k, n]) => `<button data-c="${k}" class="${k === capa ? 'activo' : ''}">${n}</button>`).join('')}</div></div>
        <div id="camp-mapa">${mapa.svg}</div>${mapa.leyenda}<div class="tenue" style="font-size:12px">Haz clic en un departamento para recorrerlo o hacer un evento allí.</div></div>
      <div class="col">
        <div class="tarjeta"><h3>Estructura</h3>
          ${G.barrasH([{ etq: 'Reconocimiento', v: J.reconocimiento }, { etq: 'Favorabilidad', v: J.popularidad }, { etq: 'Estructura', v: cam.estructura }, { etq: 'Fuerza electoral', v: p.fuerza }].map(x => ({ ...x, color: '#D9B45A' })), { max: 100, fmt: v => U.n(v) })}
          <div class="fila" style="margin-top:8px;gap:16px;font-size:12.5px"><span>🙋 <b>${U.n(cam.voluntarios)}</b> voluntarios</span>${cam.firmas != null ? `<span>✍ Firmas <b>${Math.round(cam.firmas)}%</b></span>` : `<span>Aval: ${Comp.partido(E, cam.partido)}</span>`}</div>
          ${cam.firmas != null && cam.firmas < 100 ? `<div class="barra-h" style="margin-top:6px"${UI.tt('Firmas necesarias para validar la inscripción')}><i style="width:${cam.firmas}%;background:var(--alerta)"></i></div>` : ''}</div>
        <div class="tarjeta"><h3>Equipo de campaña</h3><div class="lista">${Object.entries(El.EQUIPO).map(([k, x]) => `<div class="it"><div class="cuerpo"><b>${x.n}</b><span>${x.desc} · ${U.cop(x.costo)}/semana</span></div>${UI.botonAccion('contratar', { rol: k }, cam.equipo[k] ? '✔ Contratado' : 'Contratar', cam.equipo[k] ? 'chico prim' : 'chico')}</div>`).join('')}</div></div>
      </div></div>
    <div class="grid g2" style="margin-top:14px">
      <div class="tarjeta"><h3>Actividades de campaña</h3>
        <div class="fila">${UI.botonAccion('recaudar', {})}${UI.botonAccion('financiacionIrregular', {}, 'Financiación irregular', 'chico riesgo')}${UI.botonAccion('voluntarios', {})}${UI.botonAccion('encuestaPropia', {})}${UI.botonAccion('debate', {})}</div>
        <div class="fila accion-form" style="margin-top:8px"><select data-arg="canal"><option value="tv">Televisión ($60 M)</option><option value="radio">Radio ($20 M)</option><option value="digital">Digital ($12 M)</option></select>${UI.botonAccion('publicidad', { canal: 'tv' })}</div>
        <div class="fila accion-form" style="margin-top:8px"><select data-arg="depto">${Object.values(E.deptos).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(d => `<option value="${d.id}" ${d.id === (cam.depto || J.residencia) ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select>${UI.botonAccion('mitin', { depto: cam.depto || J.residencia })}${UI.botonAccion('recorrer', { depto: cam.depto || J.residencia })}${UI.botonAccion('reunionLideres', { depto: cam.depto || J.residencia }, 'Líderes')}</div>
        <div style="margin-top:12px">${UI.botonAccion('retirarCandidatura', {}, 'Retirar candidatura', 'chico peligro')}</div></div>
      <div class="tarjeta"><h3>Encuestas de seguimiento</h3>${enc.length ? G.linea([{ nombre: 'Intención de voto', color: '#D9B45A', datos: enc }], { alto: 170, min: 0, unidad: '%', area: true }) : '<div class="vacio">La primera encuesta llegará en unas semanas (o contrata una).</div>'}
        ${cam.cargo === 'presidencia' && cam.carrera && cam.carrera.length ? (() => {
          const ultima = cam.carrera[cam.carrera.length - 1].candidatos;
          const colores = ['#D9B45A', '#6CC4F5', '#E0559A', '#5DB85A', '#E8812A', '#A15BD1'];
          const series = ultima.map((c, i) => ({ nombre: (c.pol === 'J' ? '★ ' : '') + esc(siglaP(E, c.partido)), color: c.pol === 'J' ? '#D9B45A' : colores[(i + 1) % colores.length], datos: cam.carrera.map(snap => { const x = snap.candidatos.find(x => x.pol === c.pol); return [snap.t, x ? x.pct : 0]; }) }));
          return `<h3 style="margin-top:14px">Carrera de caballos</h3>${G.linea(series, { alto: 190, min: 0, unidad: '%' })}
            <div class="lista" style="margin-top:6px">${ultima.map(c => `<div class="it" style="padding:3px 4px"><span class="pto" style="background:${colorP(E, c.partido)}"></span><div class="cuerpo" style="font-size:12.5px">${c.pol === 'J' ? '<b>' + esc(c.nombre) + ' (tú)</b>' : esc(c.nombre)} · ${esc(siglaP(E, c.partido))}</div><b class="num">${U.d1(c.pct)}%</b></div>`).join('')}</div>`;
        })() : ''}
        <div class="lista" style="margin-top:8px">${cam.actividades.slice(-6).reverse().map(a => `<div class="it"><span class="tenue num" style="font-size:11px;width:70px">${U.fmtT(a.t)}</span><div class="cuerpo" style="font-size:12.5px">${{ recorrido: '🚌 Recorrido', evento: '🎪 Evento', lideres: '🗣 Reunión con líderes', publicidad: '📺 Pauta', debate: '⚔ Debate' }[a.tipo] || a.tipo}${a.depto ? ' en ' + esc(E.deptos[a.depto].nombre) : ''}${a.canal ? ' ' + a.canal : ''}</div></div>`).join('')}</div></div>
    </div>`;
  };

  const formularioInscripcion = (E) => {
    const J = E.jugador;
    const cargo = E.ui.cargoInsc || (J.cargo === 'representante' ? 'camara' : J.cargo === 'senador' ? 'senado' : 'camara');
    const tipo = El.tipoEleccion(cargo), ev = El.proxima(E, tipo);
    const pAval = J.partido && E.partidos[J.partido] ? C.Partidos.probAval(E, J.partido, cargo) : 0;
    const peso = J.partido && E.partidos[J.partido] ? C.Partidos.peso(E, E.politicos.J) : null;
    const nivelPeso = (cargo === 'senado' || cargo === 'presidencia') ? 'nac' : 'dep';
    const local = !['senado', 'presidencia'].includes(cargo);
    const deptoCoal = local ? (E.ui.deptoInsc || J.residencia) : null;
    const pre = C.Coaliciones.pre(E, cargo, deptoCoal);
    const aliados = pre.partidos.filter(p => p.aceptado);
    return `<div class="grid g2">
      <div class="tarjeta"><h3>Inscribir una candidatura</h3>
        <div class="cargos-elec">${Object.entries(El.CARGOS_CAMPANA).map(([k, n]) => { const e2 = El.proxima(E, El.tipoEleccion(k)); return `<button class="tarjeta clic ${k === cargo ? 'sel' : ''}" data-cargo="${k}"><b>${n}</b><span class="tenue">${e2 ? U.fmtFecha(e2.fecha, true) + ' · en ' + El.semanasPara(E, e2) + ' sem.' : '—'}</span></button>`; }).join('')}</div>
        <div class="accion-form" style="margin-top:12px">
          <input type="hidden" data-arg="cargo" value="${cargo}">
          ${local ? `<div class="campo"><label>Circunscripción</label><select data-arg="depto" id="insc-depto">${Object.values(E.deptos).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(d => `<option value="${d.id}" ${d.id === deptoCoal ? 'selected' : ''}>${esc(d.nombre)}${cargo === 'alcaldia' || cargo === 'concejo' ? ' (' + esc(d.capital) + ')' : ''}</option>`).join('')}</select></div>` : ''}
          <div class="campo"><label>Vía de inscripción</label><select data-arg="via">${J.partido && E.partidos[J.partido] ? `<option value="aval">Aval de la dirección del ${esc(E.partidos[J.partido].sigla)} (probabilidad ${Math.round(pAval * 100)}%)</option><option value="primaria">Consulta interna del ${esc(E.partidos[J.partido].sigla)}: mídete contra otros aspirantes</option>` : ''}${aliados.length ? `<option value="coalicion">Consulta interpartidista de tu coalición (${aliados.length} ${aliados.length === 1 ? 'aliado' : 'aliados'})</option>` : ''}<option value="firmas">Grupo significativo de ciudadanos (firmas)</option></select></div>
          ${UI.botonAccion('inscribir', { cargo }, 'Inscribir candidatura', 'prim')}
        </div>
        <p class="tenue" style="font-size:12px">Las inscripciones abren 52 semanas antes y cierran 6 semanas antes de la elección. Por firmas no dependes de un partido, pero necesitas voluntarios y sin maquinaria cuesta más. En una consulta interna compites de verdad por el cupo: si ganas, en Senado o Cámara sales de cabeza de lista (más arrastre en la noche electoral); en los demás cargos, tu partido no lleva otro candidato aparte de ti.</p></div>
      <div class="tarjeta"><h3>Coalición preelectoral${local ? ' · ' + esc(E.deptos[deptoCoal].nombre) : ''}</h3>
        <p class="tenue" style="font-size:12px;margin-top:0">Negocia el respaldo de otros partidos antes de inscribirte, a cambio de un puesto si ganas. Con dos o más partidos aliados, una consulta interpartidista decide quién de todos ellos es el candidato único.</p>
        <div class="lista">${pre.partidos.map(p => `<div class="it"><i class="pto" style="background:${E.partidos[p.partido] ? E.partidos[p.partido].color : '#8C96A3'}"></i><div class="cuerpo"><b>${esc(E.partidos[p.partido] ? E.partidos[p.partido].sigla : p.partido)}</b><span>${esc((C.Coaliciones.OFRECIMIENTOS[p.ofrecimiento] || {}).n || p.ofrecimiento)}</span></div><span class="etq ${p.aceptado ? 'verde' : 'rojo'}">${p.aceptado ? 'Aliado' : 'Rechazó'}</span></div>`).join('') || '<div class="vacio">Aún no has negociado con nadie.</div>'}</div>
        <div class="accion-form" style="margin-top:10px;flex-wrap:nowrap" id="coal-form">
          <input type="hidden" data-arg="cargo" value="${cargo}">
          <input type="hidden" data-arg="depto" value="${deptoCoal || ''}">
          <select data-arg="partido">${Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.id !== J.partido && !pre.partidos.some(x => x.partido === p.id)).map(p => `<option value="${p.id}">${esc(p.sigla)}</option>`).join('')}</select>
          <select data-arg="ofrecimiento">${C.Coaliciones.ofrecimientosValidos(cargo).map(k => `<option value="${k}">${esc(C.Coaliciones.OFRECIMIENTOS[k].n)}</option>`).join('')}</select>
          ${UI.botonAccion('proponerCoalicion', {}, 'Proponer')}
        </div></div>
      <div class="tarjeta"><h3>Tu posición de partida</h3>
        ${peso ? `<div class="tenue" style="font-size:12px;margin-bottom:6px">Tu peso en el ${esc(E.partidos[J.partido].sigla)} (${nivelPeso === 'nac' ? 'dirección nacional' : 'dirección departamental'}): <b style="color:var(--oro2)">${Math.round(peso[nivelPeso])}/100</b></div>` : ''}
        ${G.barrasH([{ etq: 'Reconocimiento', v: J.reconocimiento }, { etq: 'Favorabilidad', v: J.popularidad }, { etq: 'Credibilidad', v: J.credibilidad }, { etq: 'Red de apoyo', v: J.redes * 10 }].map(x => ({ ...x, color: '#D9B45A' })), { max: 100, fmt: v => U.n(v) })}
        <div class="tenue" style="font-size:12px;margin-top:10px">${ev ? `Próxima elección: <b>${esc(ev.nombre)}</b> el ${U.fmtFecha(ev.fecha)}.` : ''}</div>
        ${E.elecciones.ultimaCampana ? `<div class="tarjeta" style="margin-top:10px"><h3>Tu última campaña</h3>${esc(El.CARGOS_CAMPANA[E.elecciones.ultimaCampana.cargo])}: ${E.elecciones.ultimaCampana.resultado && E.elecciones.ultimaCampana.resultado.electo ? '<b class="bien">Elegido</b>' : '<b class="mal">Derrota</b>'} ${E.elecciones.ultimaCampana.resultado ? '· ' + U.n(E.elecciones.ultimaCampana.resultado.votos) + ' votos' : ''}</div>` : ''}</div>
    </div>`;
  };

  const calendario = (E) => {
    const cal = El.calendario(E, 8);
    const desc = { congreso: '108 senadores y 188 representantes (según circunscripciones vigentes). Cifra repartidora, umbral del 3 % en Senado.', presidencial: 'Presidente y vicepresidente para cuatro años. Si nadie supera el 50 %, segunda vuelta a las tres semanas.', regional: 'Gobernadores, alcaldes, asambleas departamentales y concejos municipales.' };
    return `<div class="timeline-elec">${cal.map(ev => `<div class="te"><div class="te-f"><b>${U.fmtFecha(ev.fecha, true)}</b><span>en ${El.semanasPara(E, ev)} semanas</span></div><div class="te-p ${ev.tipo}"></div><div class="te-c"><b>${esc(ev.nombre)}</b><span class="tenue">${desc[ev.tipo]}</span></div></div>`).join('')}</div>`;
  };

  const historico = (E) => `<div class="lista">${E.elecciones.historico.slice().reverse().map(r => `<div class="it clic tarjeta" style="margin-bottom:8px" data-res="${r.id}"><span style="font-size:22px">${r.tipo === 'congreso' ? '🏛' : r.tipo === 'presidencial' ? '🦅' : '🗺'}</span><div class="cuerpo"><b>${nombreTipo(r)}</b><span>${esc(El.titular(E, r))} · participación ${U.d1(r.participacion * 100 || 0)} %</span></div>${r.jugador ? `<span class="etq ${r.jugador.electo ? 'verde' : 'rojo'}">${r.jugador.electo ? 'Elegido' : 'No elegido'}</span>` : ''}</div>`).join('')}</div>`;

  /* Segunda vuelta: el jugador decide a quién apoyar cuando su candidato o su partido quedan fuera */
  const segundaVuelta = E => {
    const sv = E.elecciones.segundaVuelta, Ap = C.Apoyos; if (!sv || !E.elecciones.apoyos || !Ap) return '';
    const el = Ap.elegible(E), aj = E.elecciones.apoyoJ, r1 = E.elecciones.r1;
    const pctDe = pol => { const c = r1 && r1.candidatos.find(x => x.pol === pol); return c ? c.pct : null; };
    const cols = sv.map(f => {
      const pol = f.pol === 'J' ? E.politicos.J : E.politicos[f.pol], ap = E.elecciones.apoyos[f.pol] || [];
      return `<div class="tarjeta" style="padding:12px"><div class="fila" style="gap:8px"><i class="pto" style="background:${colorP(E, f.partido)}"></i><b>${esc(Comp.nombrePol(E, f.pol))}</b><span class="etq">${esc(siglaP(E, f.partido))}</span>${pctDe(f.pol) != null ? `<span class="tenue" style="font-size:12px">${U.d1(pctDe(f.pol))} % en primera vuelta</span>` : ''}</div>
        <div class="tenue" style="font-size:12px;margin:6px 0">${Comp.etiquetaIdeo ? esc(Comp.etiquetaIdeo(pol ? pol.eco : 0)) : ''}${ap.length ? ' · Apoyos: ' + ap.map(x => `${esc(x.sigla)}${x.fuente === 'J' ? ' (tú)' : ''} +${U.d1(x.peso)}`).join(', ') : ' · Sin apoyos declarados aún'}</div>
        ${el === true ? `<div class="accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="ministerios" title="Ministerios que pides"><option value="0">Sin ministerios</option><option value="1">1 ministerio</option><option value="2">2 ministerios</option><option value="3">3 ministerios</option></select><select data-arg="programa"><option value="no">Sin cambios al programa</option><option value="si">Exijo cambios al programa</option></select>${UI.botonAccion('apoyarSegundaVuelta', { cand: f.pol, modo: 'acuerdo' }, 'Negociar un acuerdo', 'chico')}</div>
          <div style="margin-top:6px">${UI.botonAccion('apoyarSegundaVuelta', { cand: f.pol, modo: 'gratuito', ministerios: 0, programa: 'no' }, 'Apoyarlo sin condiciones', 'chico')}</div>` : ''}</div>`;
    }).join('');
    const estado = el === true ? '<div class="tenue" style="font-size:12.5px;margin-bottom:8px">Tu candidato o tu partido no está en la segunda vuelta. Puedes apoyar a un finalista <b>por acuerdo</b> (a cambio de ministerios o cambios en su programa, si acepta) o <b>sin condiciones</b>, ganando su gratitud. Tu respaldo pesa según tu partido, tu reconocimiento y los votos que sacaste.</div>'
      : aj ? `<div class="resultado-jugador ok" style="margin-bottom:8px"><div style="font-size:24px">🤝</div><div><b>Apoyas a ${esc(Comp.nombrePol(E, aj.cand))}</b><div class="tenue">${aj.modo === 'acuerdo' ? 'Por acuerdo' + (aj.ministerios ? ` · ${aj.ministerios} ministerio${aj.ministerios > 1 ? 's' : ''}` : '') + (aj.programa ? ' · cambios al programa' : '') : 'Sin condiciones'}</div></div></div>` : `<div class="tenue" style="font-size:12px;margin-bottom:8px">${esc(el)}</div>`;
    return `<div class="tarjeta" style="margin-bottom:14px;border-left:4px solid var(--oro)"><h3>🗳 Segunda vuelta presidencial</h3>${estado}<div class="grid g2">${cols}</div></div>`;
  };

  const P = {
    render(el, params) {
      const E = C.E;
      const tab = params.tab || E.ui.tabElec || 'campana';
      E.ui.tabElec = tab;
      const tabs = [['campana', E.elecciones.campana ? '● Mi campaña' : 'Candidatura'], ['calendario', 'Calendario'], ['historico', 'Resultados']];
      el.innerHTML = `<div class="cab"><div><h1>Elecciones</h1><div class="sub">${E.elecciones.campana ? `Candidatura a ${esc(El.CARGOS_CAMPANA[E.elecciones.campana.cargo])}${E.elecciones.campana.depto ? ' · ' + esc(E.deptos[E.elecciones.campana.depto].nombre) : ''}` : 'Registraduría Nacional del Estado Civil'}</div></div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>
        ${tab === 'campana' ? segundaVuelta(E) : ''}${tab === 'campana' ? (E.elecciones.campana ? campanaActiva(E) : formularioInscripcion(E)) : tab === 'calendario' ? calendario(E) : historico(E)}`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('elecciones', { tab: t.dataset.tab });
        const c = e.target.closest('[data-cargo]'); if (c) { E.ui.cargoInsc = c.dataset.cargo; return C.App.refrescar(); }
        const r = e.target.closest('[data-res]'); if (r) return P.noche(r.dataset.res, true);
        const cc = e.target.closest('#camp-capa [data-c]'); if (cc) { E.ui.capaCamp = cc.dataset.c; return C.App.refrescar(); }
        const d = e.target.closest('#camp-mapa [data-depto]'); if (d) return C.App.ir('mapa', { depto: d.dataset.depto, capa: 'favorabilidad' });
      };
      el.onchange = e => {
        if (e.target.id === 'insc-depto') { E.ui.deptoInsc = e.target.value; return C.App.refrescar(); }
        if (e.target.matches('.accion-form select[data-arg="depto"]')) UI.$$('.accion-form [data-accion]', e.target.closest('.accion-form')).forEach(b => { try { const a = JSON.parse(b.dataset.args); a.depto = e.target.value; b.dataset.args = JSON.stringify(a); } catch (x) {} });
      };
    },

    /* ── Noche electoral ── */
    noche(id, sinAnimar) {
      const E = C.E, r = E.elecciones.historico.find(h => h.id === id); if (!r) return;
      const ant = r.anterior ? E.elecciones.historico.find(h => h.id === r.anterior) : null;
      const deps = Object.keys(E.deptos);
      // Orden de llegada de boletines: las ciudades grandes informan primero
      const retraso = {}; deps.forEach(d => retraso[d] = U.clamp(Math.random() * 6 + (E.deptos[d].poblacion > 1500 ? 0 : 3) + (E.deptos[d].region === 'Amazonía' ? 4 : 0), 0, 12));
      const PASOS = 22;
      let paso = sinAnimar ? PASOS : 0, vista = r.tipo === 'congreso' ? (r.jugador && r.jugador.cargo === 'camara' ? 'camara' : 'senado') : 'principal', timer = null;
      const frac = d => U.clamp((paso - retraso[d]) / 9, 0, 1);
      const m = UI.modal({ titulo: (sinAnimar ? 'Resultados · ' : 'Noche electoral · ') + nombreTipo(r), icono: '🗳', clase: 'ancho noche', cuerpo: '', alCerrar: () => clearTimeout(timer) });

      const votosNac = () => {
        const out = {};
        for (const d of deps) {
          const pd = r.porDepto[d]; if (!pd) continue; const f = frac(d);
          for (const [k, v] of Object.entries(pd.votos)) out[k] = (out[k] || 0) + v * f;
        }
        return out;
      };
      const mesas = () => U.suma(deps.map(d => frac(d) * E.deptos[d].poblacion)) / U.suma(deps.map(d => E.deptos[d].poblacion)) * 100;
      const colorCand = pol => { const c = (r.candidatos || []).find(x => x.pol === pol); return colorP(E, c ? c.partido : null); };

      const mapaParcial = () => {
        const data = C.DATA.mapa;
        let s = `<svg class="mapa-col" viewBox="${data.viewBox}" style="max-height:470px">`;
        for (const [d, g] of Object.entries(data.deptos)) {
          const f = frac(d); let fill = '#1b2840', txt = 'Sin boletines', op = 1;
          let fuente = r.tipo === 'regional' ? null : r.porDepto[d].votos;
          if (r.tipo === 'regional') { const x = r.porDepto[d]; if (f > 0) { fill = colorP(E, x.candidatos[0].partido); txt = Comp.nombrePol(E, x.ganador) + ' (' + siglaP(E, x.candidatos[0].partido) + ')'; } }
          else if (f > 0) {
            const g2 = Object.entries(fuente).filter(([k]) => k !== 'BLANCO').sort((a, b) => b[1] - a[1]);
            const tot = U.suma(g2.map(x => x[1]));
            fill = r.tipo === 'presidencial' ? colorCand(g2[0][0]) : colorP(E, g2[0][0]);
            op = 0.45 + g2[0][1] / tot * 1.2;
            txt = (r.tipo === 'presidencial' ? Comp.nombrePol(E, g2[0][0]) : siglaP(E, g2[0][0])) + ' ' + U.d1(g2[0][1] / tot * 100) + ' %';
          }
          s += `<path class="depto ${f > 0 && f < 1 ? 'contando' : ''}" d="${g.d}" fill="${fill}" fill-opacity="${U.clamp(op, 0.35, 1)}"${UI.tt(`<div class="tt-t">${esc(E.deptos[d].nombre)}</div><div class="tt-f"><span>Mesas informadas</span><b>${Math.round(f * 100)} %</b></div><div class="tt-f"><span>Lidera</span><b>${esc(txt)}</b></div>`)}/>`;
        }
        return s + '</svg>';
      };

      const pintar = () => {
        const J = E.jugador, fin = paso >= PASOS, pm = mesas();
        let izq = mapaParcial(), der = '';
        if (r.tipo === 'congreso') {
          const nac = votosNac(), tot = U.suma(Object.values(nac)) || 1;
          const orden = Object.entries(nac).sort((a, b) => b[1] - a[1]);
          const curFinal = vista === 'senado' ? r.senado.curulesTot : r.camara.curules;
          const curAnt = ant ? (vista === 'senado' ? ant.senado.curulesTot : ant.camara.curules) : null;
          const jr = r.jugador;
          const miLista = fin && jr && jr.cargo === vista ? (vista === 'senado' ? (r.senado.listas || {})[jr.partido] : ((r.camara.porDepto[jr.depto] || {}).listas || {})[jr.partido]) : null;
          const totLista = miLista ? U.suma(miLista.map(c => c.votos)) : 0;
          der = `<div class="seg" id="n-vista"><button data-v="senado" class="${vista === 'senado' ? 'activo' : ''}">Senado</button><button data-v="camara" class="${vista === 'camara' ? 'activo' : ''}">Cámara</button></div>
            <h3 class="sub-h">Votación al Senado ${fin ? '' : '(parcial)'} · umbral 3 %</h3>
            ${G.barrasH(orden.slice(0, 11).map(([p, v]) => ({ etq: siglaP(E, p), v: v / tot * 100, color: p === 'BLANCO' ? '#5d6c85' : colorP(E, p) })), { fmt: v => U.d1(v) + '%', marca: 3, anchoEtq: '84px', max: Math.max(25, orden[0] ? orden[0][1] / tot * 100 : 25) })}
            ${miLista ? `<h3 class="sub-h" style="margin-top:12px">Tu lista · ${esc(siglaP(E, jr.partido))} ${vista === 'senado' ? '(nacional)' : 'en ' + esc(E.deptos[jr.depto].nombre)}</h3>${tablaLista(E, miLista, totLista)}` : ''}
            ${fin ? `<h3 class="sub-h" style="margin-top:12px">Curules ${vista === 'senado' ? 'del Senado' : 'de la Cámara'}</h3>
              ${C.Hemiciclo.svg(E, vista, { miembros: (vista === 'senado' ? r.senado.electos : [...Object.values(r.camara.porDepto).flatMap(x => x.electos), ...(r.camara.especiales || [])]).map(e => E.politicos[e.pol]).filter(Boolean), altoMax: 250 })}
              <div class="lista">${Object.entries(curFinal).sort((a, b) => b[1] - a[1]).map(([p, n]) => `<div class="it" style="padding:3px 4px"><i class="pto" style="background:${colorP(E, p)}"></i><div class="cuerpo"><b style="font-size:12.5px">${esc(siglaP(E, p))}</b></div><b class="num">${n}</b>${curAnt ? `<span class="num ${n - (curAnt[p] || 0) > 0 ? 'bien' : n - (curAnt[p] || 0) < 0 ? 'mal' : 'tenue'}" style="width:40px;text-align:right">${U.signo(n - (curAnt[p] || 0), 0)}</span>` : ''}</div>`).join('')}</div>` : ''}`;
        } else if (r.tipo === 'presidencial') {
          const nac = votosNac(), tot = U.suma(Object.values(nac)) || 1;
          der = `<h3 class="sub-h">Resultados ${fin ? 'finales' : 'parciales'}</h3>
            <div class="col">${r.candidatos.map(c => { const pol = c.pol === 'J' ? E.politicos.J : E.politicos[c.pol]; const pct = (nac[c.pol] || 0) / tot * 100; return `<div class="cand"><div class="fila" style="flex-wrap:nowrap">${Comp.avatar(E, pol, 44)}<div style="flex:1;min-width:0"><b>${esc(Comp.nombrePol(E, c.pol))}${c.pol === 'J' ? ' (tú)' : ''}</b><div class="tenue" style="font-size:12px">${Comp.partido(E, c.partido)}</div></div><div class="kpi" style="text-align:right"><span class="v" style="font-size:24px">${U.d1(pct)}%</span><span class="l">${U.n(nac[c.pol] || 0)} votos</span></div></div><div class="barra-h" style="height:10px;margin-top:6px"><i style="width:${pct}%;background:${colorP(E, c.partido)}"></i><b style="position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:#fff;opacity:.6"></b></div></div>`; }).join('')}</div>
            ${fin ? `<div class="tarjeta" style="margin-top:12px;text-align:center">${r.ganador ? `<div class="tenue">PRESIDENTE ELECTO</div><h2>${esc(Comp.nombrePol(E, r.ganador))}</h2>` : `<div class="tenue">NINGÚN CANDIDATO SUPERA EL 50 %</div><h2>Segunda vuelta: ${esc(Comp.nombrePol(E, r.segunda[0].pol))} vs. ${esc(Comp.nombrePol(E, r.segunda[1].pol))}</h2>`}</div>` : ''}`;
        } else if (r.jugador && (r.jugador.cargo === 'asamblea' || r.jugador.cargo === 'concejo') && r.jugador.lista) {
          const jr = r.jugador, totLista = U.suma(jr.lista.map(c => c.votos));
          der = `<h3 class="sub-h">Tu lista · ${esc(siglaP(E, jr.partido))} a ${jr.cargo === 'asamblea' ? 'la Asamblea de ' + esc(E.deptos[jr.depto].nombre) : 'el Concejo de ' + esc(E.deptos[jr.depto].capital)}</h3>
            ${fin ? tablaLista(E, jr.lista, totLista) : `<div class="tenue" style="font-size:12.5px">Resultado disponible al cierre del escrutinio.</div>`}`;
        } else {
          const ganados = U.contar(Object.values(r.porDepto), x => x.candidatos[0].partido);
          const desig = Object.values(r.porDepto).some(x => x.designado);
          const tablaReg = (fuente, cargo) => {
            const filas = Object.keys(fuente).sort((a, b) => E.deptos[a].nombre.localeCompare(E.deptos[b].nombre, 'es')).map(d => {
              const x = fuente[d], f = frac(d), nom = cargo === 'gob' ? E.deptos[d].nombre : E.deptos[d].capital;
              if (f <= 0) return `<tr><td><b>${esc(nom)}</b></td><td colspan="4" class="tenue">Sin boletines</td></tr>`;
              return x.candidatos.map((c, k) => `<tr class="${k === 0 ? 'sel' : ''}">${k === 0 ? `<td rowspan="${x.candidatos.length}" style="vertical-align:top"><b>${esc(nom)}</b><div class="tenue" style="font-size:10.5px">${U.n(Math.round(x.validos * f))} votos válidos</div></td>` : ''}<td>${k === 0 ? '🏆 ' : ''}${esc(Comp.nombrePol(E, c.pol))}${c.pol === 'J' ? ' (tú)' : ''}</td><td><i class="pto" style="background:${colorP(E, c.partido)}"></i> ${esc(siglaP(E, c.partido))}</td><td class="num">${U.n(Math.round(c.votos * f))}</td><td class="num">${U.d1(c.pct)}%</td></tr>`).join('');
            }).join('');
            return `<div style="max-height:460px;overflow:auto"><table class="tabla"><thead><tr><th>${cargo === 'gob' ? 'Departamento' : 'Capital'}</th><th>Candidato</th><th>Partido</th><th>Votos</th><th>%</th></tr></thead><tbody>${filas}</tbody></table></div>`;
          };
          const sub = vista === 'gob' || vista === 'alc' ? vista : 'res';
          const segReg = desig ? '' : `<div class="seg" id="n-vista"><button data-v="res" class="${sub === 'res' ? 'activo' : ''}">Resumen</button><button data-v="gob" class="${sub === 'gob' ? 'activo' : ''}">Todas las gobernaciones</button><button data-v="alc" class="${sub === 'alc' ? 'activo' : ''}">Todas las alcaldías</button></div>`;
          if (!desig && sub === 'gob') der = `${segReg}<h3 class="sub-h">Candidatos y votos por gobernación ${fin ? '' : '(parcial)'}</h3>${tablaReg(r.porDepto, 'gob')}`;
          else if (!desig && sub === 'alc') der = `${segReg}<h3 class="sub-h">Candidatos y votos por alcaldía de capital ${fin ? '' : '(parcial)'}</h3>${tablaReg(r.alcaldias, 'alc')}`;
          else
          der = `${segReg}<h3 class="sub-h">Gobernaciones ganadas</h3>${G.barrasH(Object.entries(ganados).sort((a, b) => b[1] - a[1]).map(([p, n]) => ({ etq: siglaP(E, p), v: n, color: colorP(E, p) })), { fmt: v => U.n(v), anchoEtq: '84px' })}
            <h3 class="sub-h" style="margin-top:12px">Alcaldías de capitales</h3>${G.barrasH(Object.entries(U.contar(Object.values(r.alcaldias), x => x.candidatos[0].partido)).sort((a, b) => b[1] - a[1]).map(([p, n]) => ({ etq: siglaP(E, p), v: n, color: colorP(E, p) })), { fmt: v => U.n(v), anchoEtq: '84px' })}`;
        }
        const jr = r.jugador;
        const tarjJ = fin && jr ? `<div class="resultado-jugador ${jr.electo ? 'ok' : 'no'}"><div style="font-size:30px">${jr.electo ? '🎉' : '📉'}</div><div><b>${jr.electo ? '¡Has sido elegido!' : jr.pasa ? '¡Pasas a segunda vuelta!' : 'No alcanzaste la victoria'}</b><div class="tenue">${U.n(jr.votos)} votos${jr.puesto ? ' · puesto ' + jr.puesto + (jr.cargo === 'senado' || jr.cargo === 'camara' || jr.cargo === 'asamblea' || jr.cargo === 'concejo' ? ' en tu lista' : '') : ''}${jr.pct ? ' · ' + U.d1(jr.pct) + ' %' : ''}</div></div></div>` : '';
        m.cuerpo.innerHTML = `<div class="noche-cab"><div class="registraduria">REGISTRADURÍA NACIONAL · BOLETÍN N.º ${Math.max(1, Math.round(paso / PASOS * 24))}</div>
            <div class="fila" style="gap:18px"><div class="kpi"><span class="l">Mesas informadas</span><span class="v">${U.d1(pm)}%</span></div><div class="kpi"><span class="l">Participación</span><span class="v">${U.d1((r.participacion || 0) * 100 * (0.6 + pm / 250))}%</span>${ant && fin ? `<span class="d tenue">anterior ${U.d1((ant.participacion || 0) * 100)} %</span>` : ''}</div>
            ${fin ? '' : '<button class="btn chico" id="n-saltar">⏭ Resultado final</button>'}</div></div>
          <div class="barra-h" style="height:4px;margin:10px 0 14px"><i style="width:${pm}%;background:var(--oro)"></i></div>
          ${tarjJ}
          <div class="grid g2 noche-grid"><div class="tarjeta">${izq}</div><div>${der}</div></div>`;
      };
      m.cuerpo.addEventListener('click', e => {
        if (e.target.closest('#n-saltar')) { paso = PASOS; clearTimeout(timer); pintar(); }
        const v = e.target.closest('#n-vista [data-v]'); if (v) { vista = v.dataset.v; pintar(); }
      });
      const tick = () => { if (!document.body.contains(m.el)) return; paso++; pintar(); if (paso < PASOS) timer = setTimeout(tick, 420); };
      pintar();
      if (!sinAnimar) timer = setTimeout(tick, 600);
    },

    /* ── Noche de la consulta interna: mucho más ligera que la noche electoral general, pero con
       la misma idea de tensión — barras de apoyo por candidato y un veredicto claro de paso/no
       paso para el jugador. ── */
    nochePrimaria(r) {
      const E = C.E;
      const nombre = { senado: 'Senado', camara: 'Cámara', gobernacion: 'Gobernación', alcaldia: 'Alcaldía', presidencia: 'Presidencia' }[r.cargo] || r.cargo;
      const pa = E.partidos[E.jugador.partido];
      const cuerpo = `<p class="tenue" style="margin-top:0">Consulta interna del ${esc(pa.sigla)} por la candidatura a ${esc(nombre)}${r.depto && E.deptos[r.depto] ? ' · ' + esc(E.deptos[r.depto].nombre) : ''}.</p>
        ${G.barrasH(r.candidatos.map(c => ({ etq: c.id === 'J' ? c.nombre + ' (tú)' : c.nombre, v: c.pct, color: c.id === 'J' ? 'var(--oro)' : '#8C96A3' })), { max: 100, fmt: v => U.d1(v) + '%', anchoEtq: '150px' })}
        <div class="resultado-jugador ${r.gana ? 'ok' : 'no'}" style="margin-top:14px"><div style="font-size:30px">${r.gana ? '🎉' : '📉'}</div><div><b>${r.gana ? '¡Ganas la consulta interna!' : 'No ganas la consulta interna'}</b><div class="tenue">${U.d1(r.candidatos.find(c => c.id === 'J').pct)} % de apoyo interno · ${r.gana ? (r.cargo === 'senado' || r.cargo === 'camara' ? 'sales de cabeza de lista' : 'eres el único candidato de tu partido') : 'tu partido no te avala esta vez'}</div></div></div>
        <div class="fila" style="margin-top:14px;justify-content:flex-end"><button class="btn prim" id="np-cerrar">Continuar</button></div>`;
      const m = UI.modal({ titulo: 'Consulta interna · ' + esc(pa.sigla), icono: '🗳', cuerpo, sinCerrar: true });
      m.cuerpo.querySelector('#np-cerrar').onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    },

    /* Consulta interpartidista: la coalición ya negociada elige a su candidato único. */
    nocheConsultaInterpartidista(r) {
      const E = C.E;
      const nombre = { senado: 'Senado', camara: 'Cámara', gobernacion: 'Gobernación', alcaldia: 'Alcaldía', presidencia: 'Presidencia' }[r.cargo] || r.cargo;
      const siglas = [E.jugador.partido, ...r.aliados.map(a => a.partido)].map(p => E.partidos[p] ? E.partidos[p].sigla : p).join(' + ');
      const cuerpo = `<p class="tenue" style="margin-top:0">Consulta interpartidista (${esc(siglas)}) por la candidatura única a ${esc(nombre)}${r.depto && E.deptos[r.depto] ? ' · ' + esc(E.deptos[r.depto].nombre) : ''}.</p>
        ${G.barrasH(r.candidatos.map(c => ({ etq: (c.id === 'J' ? c.nombre + ' (tú)' : c.nombre) + ' · ' + (E.partidos[c.partido] ? E.partidos[c.partido].sigla : ''), v: c.pct, color: c.id === 'J' ? 'var(--oro)' : (E.partidos[c.partido] ? E.partidos[c.partido].color : '#8C96A3') })), { max: 100, fmt: v => U.d1(v) + '%', anchoEtq: '170px' })}
        <div class="resultado-jugador ${r.gana ? 'ok' : 'no'}" style="margin-top:14px"><div style="font-size:30px">${r.gana ? '🎉' : '📉'}</div><div><b>${r.gana ? '¡Eres el candidato único de la coalición!' : 'No ganas la consulta interpartidista'}</b><div class="tenue">${U.d1(r.candidatos.find(c => c.id === 'J').pct)} % de apoyo · ${r.gana ? 'la coalición completa respalda tu candidatura' : 'otro nombre de la coalición será el candidato'}</div></div></div>
        <div class="fila" style="margin-top:14px;justify-content:flex-end"><button class="btn prim" id="nci-cerrar">Continuar</button></div>`;
      const m = UI.modal({ titulo: 'Consulta interpartidista', icono: '🤝', cuerpo, sinCerrar: true });
      m.cuerpo.querySelector('#nci-cerrar').onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    }
  };
  C.Pantallas.elecciones = P;
})(window.CURUL);
