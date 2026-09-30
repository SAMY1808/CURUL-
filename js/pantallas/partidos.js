/* Partidos: panorama del sistema, fuerza parlamentaria y mapa interno de facciones. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  const mapaInterno = (E, pa) => {
    const J = E.jugador;
    const puntos = pa.facciones.map(f => ({ x: f.eco, y: f.soc, r: 10 + Math.sqrt(f.peso) * 3.2, color: pa.color, op: .55, borde: '#fff', bw: 1.5, etq: f.nombre,
      tt: `<b>${esc(f.nombre)}</b><br>Peso interno: ${U.n(f.peso)}<br>Líder: ${esc(Comp.nombrePol(E, f.lider))}<br>Relación contigo: ${Math.round(f.relJ)}` }));
    puntos.push({ x: J.ideologia.eco, y: J.ideologia.soc, r: 7, color: '#FFF3C4', borde: '#D9B45A', bw: 3, tt: 'Tu posición' });
    // Zoom al entorno del partido
    return G.plano(puntos, { tam: 340 });
  };

  /* Padrinazgo: a quién puedes apadrinar y tu red de protegidos, con la opción de pedirles un
     cupo para un copartidario sin puesto o para un hijo adulto. Sólo tiene sentido viendo tu
     propio partido, así que el llamador la muestra sólo en ese caso. */
  /* Caja del partido: aportes propios, grandes recaudos y giro a la campaña. */
  const finanzasHTML = E => {
    const J = E.jugador, F = C.FinPartido, pa = E.partidos[J.partido]; if (!pa) return '';
    const f = F.asegurar(pa), peso = F.pesoJ(E), restante = Math.max(0, F.TOPE_ANUAL - F.donadoEsteAnio(pa));
    const bono = Math.round((F.estructuraEf(pa) - pa.estructura) * 100);
    const montos = F.DONACIONES.map(m => `<option value="${m}">${U.cop(m)}</option>`).join('');
    return `<div class="tarjeta" style="margin-top:14px"><h3>💰 Finanzas del partido</h3>
      <div class="grid g4">${Comp.kpi('Caja', U.cop(pa.finanzas))}${Comp.kpi('Maquinaria por caja', (bono >= 0 ? '+' : '') + bono, '<span class="tenue">puntos de estructura</span>')}${Comp.kpi('Tus aportes', U.cop(f.aportesJ), `<span class="tenue">te quedan ${U.cop(restante)} este año</span>`)}${Comp.kpi('Compromisos con donantes', f.compromisos, `<span class="${f.compromisos ? 'mal' : 'tenue'}">${f.irregular > 0 ? 'y dinero irregular en el rastro' : 'los donantes cobran tarde o temprano'}</span>`)}</div>
      <div class="grid g2" style="margin-top:12px">
        <div><h4 class="sub-h" style="margin-top:0">Donar de tu bolsillo</h4><div class="tenue" style="font-size:12px;margin-bottom:6px">Sales de tu efectivo (${U.cop(J.patrimonio)}); mejora tu relación con la dirección y, con ella, tu peso interno. La ley limita tus aportes a ${U.cop(F.TOPE_ANUAL)} por año.</div>
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="monto">${montos}</select>${UI.botonAccion('donarAlPartido', {})}</div>
          <h4 class="sub-h">Girar a mi campaña</h4><div class="tenue" style="font-size:12px;margin-bottom:6px">${pa.lider === 'J' ? 'Como director, dispones de la caja.' : 'Sólo si tienes la confianza de la dirección (relación ≥ 40).'} Respeta el tope legal de gastos.</div>
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="monto">${montos}</select>${UI.botonAccion('girarACampana', {})}</div></div>
        <div><h4 class="sub-h" style="margin-top:0">Grandes recaudos</h4><div class="lista">${Object.entries(F.TIPOS).map(([k, t]) => { const u = f.ult[k], esp = u != null ? Math.max(0, t.enfria - (E.fecha.t - u)) : 0;
          return `<div class="it"><span style="font-size:20px">${t.icono}</span><div class="cuerpo"><b>${esc(t.n)}</b><span style="white-space:normal">${esc(t.desc)}${t.minPeso && peso < t.minPeso ? ' Requiere más peso interno.' : ''}${esp ? ' · disponible en ' + esp + ' sem.' : ''}</span></div>${UI.botonAccion('recaudarParaPartido', { tipo: k }, null, 'chico')}</div>`; }).join('')}</div></div>
      </div></div>`;
  };
  const padrinazgoHTML = (E) => {
    const J = E.jugador, Pad = C.Padrinazgo;
    const candidatos = Pad.candidatosApadrinar(E);
    const protegidos = Pad.misProtegidos(E);
    const { copartidarios, hijos } = Pad.beneficiariosCupo(E);
    const opcionesDestino = `${hijos.length ? `<optgroup label="Familia">${hijos.map(h => `<option value="familia:${h.id}">${esc(h.nombre)} (${esc(h.rol)})</option>`).join('')}</optgroup>` : ''}${copartidarios.length ? `<optgroup label="Copartidarios sin puesto">${copartidarios.map(p => `<option value="partido:${p.id}">${esc(p.nombre)}</option>`).join('')}</optgroup>` : ''}`;
    return `<div class="tarjeta" style="margin-top:14px"><h3>🤝 Padrinazgo</h3>
      <div class="tenue" style="font-size:12px;margin-bottom:10px">Usa tu peso interno para respaldar a compañeros de partido más pequeños que tú: se convierten en tus protegidos y, más adelante, les puedes pedir un cupo para un copartidario sin puesto o para un hijo adulto.</div>
      <div class="grid g2">
        <div><h4 class="sub-h" style="margin-top:0">A quién puedes apadrinar</h4>
          ${candidatos.length ? `<div class="lista">${candidatos.map(p => `<div class="it" data-ficha="${p.id}" style="cursor:pointer">${Comp.avatar(E, p, 32)}<div class="cuerpo"><b>${esc(p.nombre)}</b><span class="tenue">${esc(C.Politicos.etiquetaCargo(E, p))} · peso ${Math.round(C.Partidos.peso(E, p).nac)}</span></div><div>${UI.botonAccion('apadrinar', { pol: p.id }, 'Apadrinar', 'chico')}</div></div>`).join('')}</div>`
            : '<div class="tenue" style="font-size:12px">Nadie en tu partido tiene hoy menos peso interno que tú por un margen claro.</div>'}</div>
        <div><h4 class="sub-h" style="margin-top:0">Tus protegidos</h4>
          ${protegidos.length ? `<div class="lista">${protegidos.map(({ id, r, pol }) => {
            const puede = Pad.puedeCupo(E, id);
            return `<div class="it" style="align-items:flex-start"><span data-ficha="${id}" style="cursor:pointer">${Comp.avatar(E, pol, 32)}</span>
              <div class="cuerpo"><b>${esc(pol.nombre)}</b><span class="tenue">${esc(C.Politicos.etiquetaCargo(E, pol))} · lealtad <b class="num">${Math.round(r.relJ)}</b>${r.cupos ? ` · ${r.cupos} cupo(s) conseguido(s)` : ''}</span>
                ${opcionesDestino ? `<div class="accion-form" style="margin-top:6px;flex-wrap:nowrap"><select data-arg="destino">${opcionesDestino}</select>${UI.botonAccion('pedirCupo', { prot: id }, 'Pedir cupo', 'chico')}</div>`
                  : '<div class="tenue" style="font-size:11px;margin-top:4px">No tienes a quién beneficiar con un cupo todavía.</div>'}
                ${puede !== true ? `<div class="tenue" style="font-size:11px;margin-top:2px">${esc(puede)}</div>` : ''}</div></div>`;
          }).join('')}</div>` : '<div class="tenue" style="font-size:12px">Aún no tienes protegidos: apadrina a alguien primero.</div>'}</div>
      </div></div>`;
  };

  /* Herramientas del director del partido: listas al Congreso y avales uninominales. Sólo se
     muestran si el jugador dirige el partido que está viendo. */
  const direccionHTML = E => {
    const Dir = C.Director, pa = Dir.partido(E);
    if (!Dir.esDirector(E)) return '';
    Dir.asegurar(pa);
    const tab = E.ui.dirTab || 'senado', depto = E.ui.dirDepto || E.jugador.residencia, d = E.deptos[depto];
    const selDepto = `<select data-dirdepto>${Object.values(E.deptos).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(x => `<option value="${x.id}" ${x.id === depto ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>`;
    const tabs = [['senado', 'Lista al Senado'], ['camara', 'Lista a la Cámara'], ['asamblea', 'Asamblea departamental'], ['concejo', 'Concejo municipal'], ['avales', 'Avales'], ['organica', 'Estructura orgánica']];
    let cuerpo;
    if (tab === 'senado' || tab === 'camara' || tab === 'asamblea' || tab === 'concejo') {
      const camara = tab, dId = camara === 'senado' ? null : depto, l = Dir.lista(pa, camara, dId), mult = Dir.multLista(E, pa.id, camara, dId);
      const filas = Dir.pool(E, camara, dId);
      const efecto = mult === 1 ? '<span class="tenue">sin efecto todavía: inscribe candidatos</span>' : `<b class="${mult > 1 ? 'bien' : 'mal'}">${mult > 1 ? '+' : ''}${U.d1((mult - 1) * 100)} % de votos</b> por la calidad de tu lista`;
      cuerpo = `<div class="fila" style="justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px"><div class="tenue" style="font-size:12px">Curules esperadas: <b class="num" style="color:var(--texto)">${U.d1(Dir.curulesEsperadas(E, camara, dId))}</b> · Inscritos: <b class="num" style="color:var(--texto)">${l.inscritos.length}</b> · Efecto: ${efecto}</div>${camara !== 'senado' ? selDepto : ''}</div>
        <div class="tenue" style="font-size:11.5px;margin-bottom:8px">«Aporte» estima cuántos votos suma cada nombre. Sin tu intervención el partido completa la lista con quienes más pesan; con ella, tus inscritos van primero, tus vetados quedan por fuera y los nombres fuertes empujan la votación de todo el partido.</div>
        <div class="lista">${filas.length ? filas.map(f => `<div class="it" data-ficha="${f.p.id}" style="cursor:pointer">${Comp.avatar(E, f.p, 30)}<div class="cuerpo"><b>${esc(f.p.nombre)}</b><span class="tenue">${esc(C.Politicos.etiquetaCargo(E, f.p))} · aporte <b class="num" style="color:var(--texto)">${f.est}</b>${f.incumbente ? ' · busca reelección' : ''}${f.p.fichaje ? ' · fichaje' : ''}</span></div>
            <div class="fila" style="gap:6px">${f.estado === 'inscrito' ? '<span class="etq verde">Inscrito</span>' : f.estado === 'vetado' ? '<span class="etq rojo">Vetado</span>' : ''}${UI.botonAccion('inscribirEnLista', { pol: f.p.id, camara, depto: dId }, null, 'chico')}${UI.botonAccion('vetarEnLista', { pol: f.p.id, camara, depto: dId }, null, 'chico peligro')}</div></div>`).join('') : '<div class="tenue" style="font-size:12px">No hay candidatos disponibles en esta lista: ficha a alguien.</div>'}</div>
        <h4 class="sub-h" style="margin-top:12px">Fichar a alguien que sume votos</h4>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="tipo">${Object.entries(Dir.FICHAJES).map(([k, f]) => `<option value="${k}">${esc(f.n)} · $${U.n(f.costo)} M</option>`).join('')}</select>${UI.botonAccion('ficharCandidato', { camara, depto: dId }, null, 'chico')}<span class="tenue" style="font-size:11.5px">Finanzas del partido: ${U.cop(pa.finanzas)}</span></div>`;
    } else if (tab === 'organica') {
      const Or = C.Organica, o = Or.asegurar(pa), cargos = Object.entries(Or.CARGOS);
      const opts = (dep) => Or.candidatos(E, pa, dep).map(p => `<option value="${p.id}">${esc(p.nombre)} · capacidad ${Math.round(Or.calidad(p))}</option>`).join('');
      const filas = Object.values(E.deptos).map(x => ({ d: x, pr: Or.presencia(pa, x.id), c: Or.coordinador(E, pa, x.id) })).sort((a, b) => b.d.poblacion - a.d.poblacion);
      cuerpo = `<div class="grid g4" style="margin-bottom:12px">${Comp.kpi('Costo semanal', '$' + U.d1(Or.coste(E, pa)) + ' M', '<span class="tenue">salarios y sedes</span>')}${Comp.kpi('Caja del partido', U.cop(pa.finanzas), '<span class="tenue">sin caja los cargos rinden 30%</span>')}${Comp.kpi('Cohesión', Math.round(pa.cohesion) + '%', '<span class="tenue">la sostiene la Secretaría</span>')}${Comp.kpi('Presencia media', Math.round(U.prom(filas.map(f => f.pr))) + '%', '<span class="tenue">despliegue territorial</span>')}</div>
        <div class="grid g2"><div class="col">${cargos.map(([k, c]) => { const t = Or.titular(E, pa, k); return `<div class="tarjeta" style="padding:10px 12px"><div class="t-cab"><h4 class="sub-h" style="margin:0">${c.icono} ${esc(c.n)}</h4>${t ? `<span class="etq verde">${esc(t.nombre)} · ${Math.round(Or.eficacia(E, pa, k) * 100)}%</span>` : '<span class="etq">Vacante</span>'}</div><div class="tenue" style="font-size:11.5px;margin:4px 0 6px">${esc(c.txt)} · cuesta $${c.costo} M/sem.</div>
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="pol" style="max-width:100%">${opts()}</select>${UI.botonAccion('nombrarCargoPartido', { cargo: k }, 'Nombrar', 'chico')}${t ? UI.botonAccion('destituirCargoPartido', { cargo: k }, 'Retirar', 'chico peligro') : ''}</div></div>`; }).join('')}
          <div class="tarjeta" style="padding:10px 12px"><h4 class="sub-h" style="margin:0 0 4px">🏛 Convención nacional</h4><div class="tenue" style="font-size:11.5px;margin-bottom:6px">Una vez al año: sube la cohesión, la popularidad y la presencia en todo el país. Cuesta $250 M.</div>${UI.botonAccion('convocarConvencion', {}, 'Convocar', 'chico')}</div></div>
        <div class="col"><div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">📍 Directorios departamentales</h4><div class="tenue" style="font-size:11.5px;margin-bottom:8px">La presencia multiplica la cuota de votos del partido en el departamento. Un coordinador la hace crecer sola; abrir sedes cuesta $60 M y suma 12 puntos.</div>
          <div style="max-height:620px;overflow:auto"><table class="tabla"><thead><tr><th>Depto.</th><th>Presencia</th><th>Coordinador</th><th></th></tr></thead><tbody>${filas.map(f => `<tr><td><b>${esc(f.d.nombre)}</b></td><td class="num">${Math.round(f.pr)}%</td><td style="font-size:12px">${f.c ? esc(f.c.nombre) : '<span class="tenue">—</span>'}</td><td><div class="fila accion-form" style="gap:4px"><select data-arg="pol" style="max-width:130px">${opts(f.d.id) || '<option value="">sin cuadros</option>'}</select>${UI.botonAccion('nombrarCoordinador', { depto: f.d.id }, '📍', 'chico')}${UI.botonAccion('invertirPresencia', { depto: f.d.id }, '🏢', 'chico')}</div></td></tr>`).join('')}</tbody></table></div></div>
          ${o.hist.length ? `<div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">Bitácora</h4><div class="lista">${o.hist.slice(0, 6).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : ''}</div></div>`;
    } else {
      const seccion = (cargo, dId, titulo) => {
        const av = Dir.avalUni(E, pa.id, cargo, dId), filas = Dir.aspirantes(E, cargo, dId);
        return `<h4 class="sub-h" style="margin-top:12px">${titulo} <span class="tenue" style="font-weight:400">· aval hoy: ${av ? '<b style="color:var(--oro2)">' + esc(av.nombre) + '</b>' : 'ninguno (el partido decide solo)'}</span></h4>
          <div class="lista">${filas.length ? filas.map(f => `<div class="it" data-ficha="${f.p.id}" style="cursor:pointer">${Comp.avatar(E, f.p, 30)}<div class="cuerpo"><b>${esc(f.p.nombre)}</b><span class="tenue">${esc(C.Politicos.etiquetaCargo(E, f.p))} · aporte <b class="num" style="color:var(--texto)">${f.est}</b>${f.ambicion ? ' · ha anunciado su ambición' : ''}${f.p.disidente ? ' · disidente' : ''}</span></div>
              <div class="fila" style="gap:6px">${f.avalado ? '<span class="etq verde">Avalado</span>' : f.negado ? '<span class="etq rojo">Aval negado</span>' : ''}${UI.botonAccion('otorgarAval', { pol: f.p.id, cargo, depto: dId }, null, 'chico')}${UI.botonAccion('negarAval', { pol: f.p.id, cargo, depto: dId }, null, 'chico peligro')}</div></div>`).join('') : '<div class="tenue" style="font-size:12px">No hay aspirantes de tu partido para este cargo.</div>'}</div>`;
      };
      cuerpo = `<div class="fila" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><div class="tenue" style="font-size:12px;max-width:640px">Otorgar el aval te gana lealtad y da arrastre al candidato. Negárselo a un aspirante ambicioso puede volverlo disidente: irá por firmas y le quitará votos al candidato oficial. Elige el departamento para ver la gobernación y la alcaldía de su capital.</div>${selDepto}</div>
        ${seccion('presidencia', null, 'Presidencia de la República')}${seccion('gobernacion', depto, 'Gobernación de ' + esc(d.nombre))}${seccion('alcaldia', depto, 'Alcaldía de ' + esc(d.capital))}`;
    }
    return `<div class="tarjeta" style="margin-top:14px"><h3>🎖 Dirección del partido</h3>
      <div class="tenue" style="font-size:12px;margin-bottom:10px">Diriges el ${esc(pa.sigla)}: tú armas las listas y repartes los avales.</div>
      <div class="tabs">${tabs.map(([k, n]) => `<button data-dirtab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>
      <div style="margin-top:12px">${cuerpo}</div></div>`;
  };

  C.Pantallas.partidos = {
    render(el, params) {
      const E = C.E, J = E.jugador;
      const sel = params.partido || E.ui.partidoSel || J.partido || C.Congreso.ordenPartidos(E).find(p => !E.partidos[p].especial);
      E.ui.partidoSel = sel;
      const cs = C.Congreso.composicion(E, 'senado').porPartido, cc = C.Congreso.composicion(E, 'camara').porPartido;
      const lista = Object.values(E.partidos).filter(p => !p.especial && !p.futuro).sort((a, b) => b.popularidad - a.popularidad);
      const pa = E.partidos[sel];
      const miembros = C.Partidos.miembros(E, pa.id);
      const cong = miembros.filter(p => p.cargo && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante'));
      const gobs = Object.values(E.deptos).filter(d => E.politicos[d.gobernador] && E.politicos[d.gobernador].partido === pa.id);
      const lider = E.politicos[pa.lider];
      const probAval = C.Partidos.probAval(E, pa.id, 'camara');
      // Fuerza territorial: cuota esperada por departamento
      const data = C.DATA.mapa;
      const cuotas = {}; for (const d of Object.values(E.deptos)) cuotas[d.id] = C.Elecciones.cuotas(E, d.id, false)[pa.id] * 100;
      const maxC = Math.max(...Object.values(cuotas));
      const mapa = `<svg class="mapa-col" viewBox="${data.viewBox}" style="max-height:300px">${Object.entries(data.deptos).map(([id, g]) => `<path d="${g.d}" class="depto" fill="${pa.color}" fill-opacity="${U.clamp(0.08 + cuotas[id] / maxC * 0.92, 0.08, 1)}"${UI.tt(`${esc(E.deptos[id].nombre)}: ${U.d1(cuotas[id])} % esperado`)}/>`).join('')}</svg>`;

      el.innerHTML = `<div class="cab"><div><h1>Partidos políticos</h1><div class="sub">Intención de voto, fuerza parlamentaria, facciones y relaciones.</div></div></div>
        <div class="grid g2">
          <div class="tarjeta"><h3>Sistema de partidos</h3>
            <table class="tabla clic-filas"><thead><tr><th>Partido</th><th>Intención</th><th>Tendencia</th><th>Senado</th><th>Cámara</th><th>Postura</th></tr></thead><tbody>
            ${lista.map(p => `<tr data-part="${p.id}" class="${p.id === sel ? 'sel' : ''}"><td><span class="sigla"><i class="pto" style="background:${p.color}"></i>${esc(p.nombre)}</span>${p.id === J.partido ? ' <span class="etq oro">Tu partido</span>' : ''}</td><td class="num">${U.d1(p.popularidad)}%</td><td>${G.sparkline((E.series['pop:' + p.id] || []).slice(-26), p.color, 70, 22)}</td><td class="num">${cs[p.id] || 0}</td><td class="num">${cc[p.id] || 0}</td><td>${Comp.postura(p.postura)}</td></tr>`).join('')}</tbody></table></div>
          <div class="tarjeta"><h3>Mapa ideológico</h3>
            <div style="display:flex;justify-content:center">${G.plano([...lista.map(p => ({ x: p.eco, y: p.soc, r: 5 + Math.sqrt((cs[p.id] || 0) + (cc[p.id] || 0)) * 1.6, color: p.color, op: .8, etq: p.sigla, tt: `<b>${esc(p.nombre)}</b><br>${(cs[p.id] || 0) + (cc[p.id] || 0)} congresistas · ${U.d1(p.popularidad)} %`, attr: `data-part="${p.id}" style="cursor:pointer"` })), { x: J.ideologia.eco, y: J.ideologia.soc, r: 7, color: '#FFF3C4', borde: '#D9B45A', bw: 3, tt: 'Tú' }], { tam: 380 })}</div>
            <div class="tenue" style="font-size:12px;text-align:center">Tamaño = congresistas. El punto dorado eres tú.</div></div>
        </div>

        <div class="tarjeta" style="margin-top:14px"><h3>${J.fundacion ? 'Fundando ' + esc(J.fundacion.nombre) : 'Fundar un partido nuevo'}</h3>
          ${J.fundacion ? `<div class="tenue" style="font-size:12px;margin-bottom:6px">«${esc(J.fundacion.lema)}» · ${Comp.etiquetaIdeo(J.fundacion.eco)}</div>
            <div class="barra-h" style="height:10px"><i style="width:${U.clamp(J.fundacion.firmas / J.fundacion.meta * 100, 0, 100)}%;background:${esc(J.fundacion.color)}"></i></div>
            <div class="tenue" style="font-size:12px;margin-top:4px">${Math.round(J.fundacion.firmas)} / ${Math.round(J.fundacion.meta)} firmas</div>
            <div style="margin-top:8px">${UI.botonAccion('impulsarFundacion', {}, 'Impulsar recolección', 'chico')}</div>`
            : `<p class="tenue" style="font-size:12px;margin-top:0">Cuesta $150 millones y necesitas algo de reconocimiento. Vas a recoger firmas semana a semana hasta fundarlo de verdad, con militantes propios.</p>
            <div class="accion-form">
              <div class="grid g2">
                <input data-arg="nombre" placeholder="Nombre del partido" style="background:var(--panel);border:1px solid var(--borde2);border-radius:8px;padding:6px 8px;color:var(--texto)">
                <input data-arg="sigla" placeholder="Sigla (máx. 8)" maxlength="8" style="background:var(--panel);border:1px solid var(--borde2);border-radius:8px;padding:6px 8px;color:var(--texto)">
                <input data-arg="lema" placeholder="Lema" style="background:var(--panel);border:1px solid var(--borde2);border-radius:8px;padding:6px 8px;color:var(--texto)">
                <input data-arg="color" type="color" value="#8C96A3" style="background:var(--panel);border:1px solid var(--borde2);border-radius:8px;height:34px">
                <div><label class="tenue" style="font-size:11px">Económico: izquierda ↔ derecha</label><input data-arg="eco" type="range" min="-100" max="100" value="${J.ideologia.eco}"></div>
                <div><label class="tenue" style="font-size:11px">Social: progresista ↔ conservador</label><input data-arg="soc" type="range" min="-100" max="100" value="${J.ideologia.soc}"></div>
              </div>
              <div style="margin-top:8px">${UI.botonAccion('iniciarFundacion', {}, 'Fundar partido', 'chico prim')}</div>
            </div>`}</div>

        <div class="tarjeta partido-ficha" style="margin-top:14px;border-top:4px solid ${pa.color}">
          <div class="fila" style="justify-content:space-between;align-items:flex-start">
            <div class="fila"><div class="logo-partido" style="background:${pa.color}">${esc(pa.sigla)}</div><div><h2 style="font-size:24px">${esc(pa.nombre)}</h2><div class="tenue">«${esc(pa.lema)}» · ${Comp.etiquetaIdeo(pa.eco)} · ${pa.soc > 25 ? 'conservador' : pa.soc < -25 ? 'progresista' : 'moderado'}</div></div></div>
            <div class="fila">${J.partido === pa.id ? '<span class="etq oro">Militas aquí</span>' : UI.botonAccion('afiliarse', { partido: pa.id }, 'Afiliarme')}</div></div>
          <div class="grid g4" style="margin-top:12px">${Comp.kpi('Intención de voto', U.d1(pa.popularidad) + '%', Comp.delta(E.series['pop:' + pa.id], 3))}${Comp.kpi('Congresistas', cong.length, `${cs[pa.id] || 0} senadores · ${cc[pa.id] || 0} representantes`)}${Comp.kpi('Gobernaciones', gobs.length)}${Comp.kpi('Militantes', U.n(pa.militantes))}</div>
          ${J.partido === pa.id ? (() => { const peso = C.Partidos.peso(E, E.politicos.J); return `<div class="grid g2" style="margin-top:8px">${Comp.kpi('Tu peso · dirección nacional', Math.round(peso.nac) + '/100')}${Comp.kpi('Tu peso · dirección departamental', Math.round(peso.dep) + '/100')}</div>`; })() : ''}
          <div class="grid g3" style="margin-top:14px">
            <div><h3 class="sub-h">Mapa interno del partido</h3>${mapaInterno(E, pa)}</div>
            <div><h3 class="sub-h">Facciones</h3><div class="lista">${pa.facciones.map(f => `<div class="it accion-form"><div class="cuerpo"><b>${esc(f.nombre)}</b><span>Peso ${U.n(f.peso)} · líder ${esc(Comp.nombrePol(E, f.lider))}</span><div class="barra-h" style="margin-top:4px"><i style="width:${f.peso / U.suma(pa.facciones.map(x => x.peso)) * 100}%;background:${pa.color}"></i></div></div><div style="text-align:right">${Comp.relacion(f.relJ)}${J.partido === pa.id ? '<br>' + UI.botonAccion('reunionPartido', { faccion: f.id }, 'Reunión', 'chico') : ''}</div></div>`).join('')}</div>
              <h3 class="sub-h" style="margin-top:12px">Dirección</h3>${lider ? `<div class="lista"><div class="it clic" data-ficha="${lider.id}">${Comp.avatar(E, lider, 36)}<div class="cuerpo"><b>${esc(lider.nombre)}${pa.lider === 'J' ? ' (tú)' : ''}</b><span>Director nacional · ${esc(C.Politicos.etiquetaCargo(E, lider))}</span></div></div></div>` : ''}
              ${J.partido === pa.id && pa.lider !== 'J' ? `<div style="margin-top:8px">${UI.botonAccion('disputarDireccion', {}, 'Disputar la dirección', 'chico')}</div>` : ''}
              <div class="tt-f" style="margin-top:8px"><span class="tenue">Cohesión de bancada</span><b>${pa.cohesion}/100</b></div>
              <div class="tt-f"><span class="tenue">Maquinaria territorial</span><b>${Math.round(pa.estructura * 100)}/100</b></div>
              <div class="tt-f"><span class="tenue">Finanzas</span><b>${U.cop(pa.finanzas)}</b></div>
              <div class="tt-f"><span class="tenue">Relación contigo</span>${Comp.relacion(pa.relJ)}</div>
              <div class="tt-f"><span class="tenue">Probabilidad de aval (Cámara)</span><b>${Math.round(probAval * 100)}%</b></div></div>
            <div><h3 class="sub-h">Fuerza territorial</h3>${mapa}<div class="tenue" style="font-size:12px">Intensidad = votación esperada al Congreso por departamento.</div></div>
          </div>
          <h3 class="sub-h" style="margin-top:14px">Bancada en el Congreso</h3>
          <div class="curules-mini grande">${C.Hemiciclo.ordenar(E, cong).map(p => `<span class="curul-mini" data-pol="${p.id}" style="background:${pa.color};${p.cargo.tipo === 'senador' ? 'border-radius:3px' : ''}${p.id === 'J' ? ';outline:2px solid #FFF3C4' : ''}"></span>`).join('')}</div>
          <div class="tenue" style="font-size:11.5px">Cuadrados: senadores · círculos: representantes</div>
        </div>
        ${J.partido === pa.id ? direccionHTML(E) + finanzasHTML(E) + padrinazgoHTML(E) : ''}`;
      el.onchange = e => { const sel = e.target.closest('[data-dirdepto]'); if (sel) { E.ui.dirDepto = sel.value; C.App.refrescar(); } };
      el.onclick = e => {
        if (e.target.closest('[data-accion], select, input')) return;   // los botones de acción tienen su propio manejador
        const dt = e.target.closest('[data-dirtab]'); if (dt) { E.ui.dirTab = dt.dataset.dirtab; return C.App.refrescar(); }
        const r = e.target.closest('[data-part]'); if (r) return C.App.ir('partidos', { partido: r.dataset.part });
        const f = e.target.closest('[data-ficha],.curul-mini'); if (f) return Comp.fichaPolitico(E, f.dataset.ficha || f.dataset.pol);
      };
    },

    /* Resultado de un congreso interno por la dirección del partido: mismo espíritu que la noche
       de una consulta interna, pero por la dirección completa, no por una candidatura. */
    congresoInterno(r) {
      const E = C.E, pa = E.partidos[r.partido];
      const cuerpo = `<p class="tenue" style="margin-top:0">Congreso interno del ${esc(pa.sigla)} por la dirección nacional.</p>
        ${G.barrasH(r.candidatos.map(c => ({ etq: c.id === 'J' ? c.nombre + ' (tú)' : c.nombre, v: c.pct, color: c.id === 'J' ? 'var(--oro)' : '#8C96A3' })), { max: 100, fmt: v => U.d1(v) + '%', anchoEtq: '150px' })}
        <div class="resultado-jugador ${r.gana ? 'ok' : 'no'}" style="margin-top:14px"><div style="font-size:30px">${r.gana ? '🎉' : '📉'}</div><div><b>${r.gana ? '¡Ganas la dirección del partido!' : 'No ganas la dirección'}</b><div class="tenue">${U.d1(r.candidatos.find(c => c.id === 'J').pct)} % de apoyo interno${r.gana ? ' · ya puedes negociar cuota burocrática con el Gobierno' : ''}</div></div></div>
        <div class="fila" style="margin-top:14px;justify-content:flex-end"><button class="btn prim" id="ci-cerrar">Continuar</button></div>`;
      const m = UI.modal({ titulo: 'Congreso interno · ' + esc(pa.sigla), icono: '🎖', cuerpo, sinCerrar: true });
      m.cuerpo.querySelector('#ci-cerrar').onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    }
  };
})(window.CURUL);
