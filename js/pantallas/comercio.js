/* Comercio exterior: panorama comercial, acuerdos y negociación de TLC, Mercosur, Comunidad Andina y aranceles. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const mil = v => U.d1(v) + ' mil MUSD';
  const pct = v => U.d1(v) + '%';
  const TIPO_ACUERDO = { tlc: 'TLC', can: 'Comunidad Andina', aap: 'Acuerdo parcial', mercosur: 'Mercosur' };
  const ESTADO_NEG = { abierta: 'En negociación', cerrada: 'Cerrada: falta firmar', ratificacion: 'En el Congreso', control: 'En la Corte Constitucional', fracasada: 'Fracasada', vigente: 'Vigente' };

  const panorama = E => {
    const Co = C.Comercio, f = Co.flujos(E), c = E.comercio, S = Co.sectores(), P = Co.socios();
    const kpis = `<div class="grid g4">
      ${Comp.kpi('Exportaciones', mil(f.exportaciones), Comp.delta(E.series['com:exp'], 8, false, v => U.d1(v)))}
      ${Comp.kpi('Importaciones', mil(f.importaciones), Comp.delta(E.series['com:imp'], 8, true, v => U.d1(v)))}
      ${Comp.kpi('Balanza comercial', (f.balanza >= 0 ? '+' : '') + U.d1(f.balanza) + ' mil MUSD', `<span class="tenue">${U.d1(f.balanzaPct)} % del PIB</span>`)}
      ${Comp.kpi('Dólar', '$' + U.n(Math.round(c.tc)), Comp.delta(E.series['com:tc'], 8, true, v => U.n(Math.round(v))))}
    </div>`;
    const porSector = S.map(s => ({ etq: s.icono + ' ' + s.nombre.split(' (')[0], v: f.expSector[s.id], color: 'var(--oro)', tt: `<b>${esc(s.nombre)}</b><br>Exporta ${mil(f.expSector[s.id])} · importa ${mil(f.impSector[s.id])}<br>Arancel aplicado: ${pct(c.aranceles[s.id])}` }));
    const porSocio = P.map(p => ({ etq: p.nombre, v: f.expSocio[p.id], color: (Co.acuerdoDe(E, p.id) && Co.acuerdoDe(E, p.id).estado === 'vigente') ? 'var(--bien)' : '#8C96A3', tt: `<b>${esc(p.nombre)}</b><br>Exporta ${mil(f.expSocio[p.id])} · importa ${mil(f.impSocio[p.id])}<br>${Co.acuerdoDe(E, p.id) && Co.acuerdoDe(E, p.id).estado === 'vigente' ? esc(Co.acuerdoDe(E, p.id).nombre) : 'Sin acuerdo vigente'}` })).sort((a, b) => b.v - a.v);
    const dom = S.filter(s => s.dom).map(s => ({ etq: s.icono + ' ' + s.nombre.split(' (')[0], v: c.tension[s.id], color: c.tension[s.id] > 70 ? 'var(--mal)' : c.tension[s.id] > 50 ? 'var(--alerta)' : 'var(--bien)', tt: `Presión de las importaciones sobre este sector: ${Math.round(c.tension[s.id])}/100` }));
    const actores = ['agrario', 'cut', 'gremios', 'indigena'].map(id => { const a = Co.actor(E, id); return a ? { etq: { agrario: 'Sector agrario', cut: 'CUT', gremios: 'Gremios', indigena: 'Mov. indígena' }[id], v: a.descontento, color: a.descontento > 70 ? 'var(--mal)' : a.descontento > 45 ? 'var(--alerta)' : 'var(--bien)' } : null; }).filter(Boolean);
    return `${kpis}
      <div class="grid g2" style="margin-top:14px">
        <div class="tarjeta"><h3>Qué vende Colombia</h3>${G.barrasH(porSector, { max: Math.max(...porSector.map(x => x.v)) * 1.05, fmt: v => U.d1(v), anchoEtq: '150px' })}<div class="tenue" style="font-size:11.5px;margin-top:6px">Mil millones de dólares al año. El petróleo y el carbón mandan: si caen sus precios, el dólar sube y entran menos divisas.</div></div>
        <div class="tarjeta"><h3>A quién le vende</h3>${G.barrasH(porSocio, { max: Math.max(...porSocio.map(x => x.v)) * 1.05, fmt: v => U.d1(v), anchoEtq: '130px' })}<div class="tenue" style="font-size:11.5px;margin-top:6px">En verde, los socios con acuerdo comercial vigente.</div></div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="tarjeta"><h3>Presión de las importaciones</h3>${G.barrasH(dom, { max: 100, marca: 50, fmt: v => Math.round(v), anchoEtq: '150px' })}<div class="tenue" style="font-size:11.5px;margin-top:6px">Sobre 55 los sectores empiezan a movilizarse; ahí se justifica una salvaguardia.</div></div>
        <div class="tarjeta"><h3>Ánimo de quienes se juegan la apertura</h3>${G.barrasH(actores, { max: 100, marca: 50, fmt: v => Math.round(v), anchoEtq: '130px' })}
          <div class="fila" style="margin-top:10px;gap:14px;font-size:12px"><span>Arancel promedio <b class="num">${U.d1(Co.tarifaPromedio(E))}%</b></span><span>Precio de la energía <b class="num">${Math.round(c.precioEnergia)}</b></span></div></div>
      </div>
      ${c.medidas.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Decisiones recientes</h3><div class="lista">${c.medidas.slice(-6).reverse().map(m => `<div class="it"><div class="cuerpo"><b>${esc(m.txt)}</b><span class="tenue">${U.fmtT(m.t)}</span></div></div>`).join('')}</div></div>` : ''}`;
  };

  const capitulosNegociacion = (E, n) => {
    const Tlc = C.TLC, dem = C.DATA.demandasTLC[n.socio] || C.DATA.demandasTLC.ROW, nombres = Tlc.posturas();
    const filas = Tlc.capitulos().map(cp => {
      const st = n.capitulos[cp.id], cerrado = st.estado === 'cerrado';
      const probs = [0, 1, 2].map(p => Math.round(Tlc.probCapitulo(E, n.socio, cp.id, p) * 100));
      const control = cerrado ? `<span class="etq verde">Cerrado · ${nombres[st.postura]}</span>`
        : `<div class="fila accion-form" style="gap:6px;flex-wrap:nowrap"><select data-arg="postura">${nombres.map((nm, i) => `<option value="${i}" ${i === dem[cp.id] ? 'selected' : ''}>${nm} (${probs[i]}%)</option>`).join('')}</select>${UI.botonAccion('rondaTLC', { socio: n.socio, capitulo: cp.id }, 'Negociar', 'chico')}</div>`;
      return `<tr><td>${cp.icono} <b>${esc(cp.nombre)}</b><div class="tenue" style="font-size:11.5px;max-width:420px">${esc(cp.nota)}</div></td><td class="tenue" style="white-space:nowrap">Espera: ${nombres[dem[cp.id]]}</td><td>${control}</td></tr>`;
    }).join('');
    return `<table class="tabla"><thead><tr><th>Capítulo</th><th>El socio espera</th><th>Colombia</th></tr></thead><tbody>${filas}</tbody></table>`;
  };

  const panelNegociacion = (E, n) => {
    const Co = C.Comercio, Tlc = C.TLC, p = Co.socio(n.socio);
    let cuerpo = '';
    if (n.estado === 'abierta') {
      const cerrados = Object.values(n.capitulos).filter(x => x.estado === 'cerrado').length;
      cuerpo = `<div class="tenue" style="font-size:12px;margin-bottom:8px">${cerrados}/6 capítulos cerrados · ${n.rondas} rondas. Entre paréntesis, la probabilidad de que el socio acepte esa postura hoy.</div>${capitulosNegociacion(E, n)}
        <div class="fila" style="margin-top:8px;gap:8px">${UI.botonAccion('consultaPreviaTLC', { socio: n.socio }, null, 'chico')}${UI.botonAccion('abandonarTLC', { socio: n.socio }, null, 'chico peligro')}</div>`;
    } else if (n.estado === 'cerrada') {
      const perfil = Tlc.perfil(E, n.socio, n), S = Co.sectores();
      cuerpo = `<div class="grid g2"><div><h4 class="sub-h" style="margin-top:0">Lo que baja Colombia</h4>${G.barrasH(S.map(s => ({ etq: s.icono + ' ' + s.nombre.split(' (')[0], v: (perfil.red[s.id] || 0) * 100, color: 'var(--oro)' })), { max: 100, fmt: v => Math.round(v) + '%', anchoEtq: '140px' })}</div>
        <div><h4 class="sub-h" style="margin-top:0">Lo que consigue a cambio</h4>${G.barrasH(S.map(s => ({ etq: s.icono + ' ' + s.nombre.split(' (')[0], v: (perfil.acc[s.id] || 0) * 100, color: 'var(--bien)' })), { max: 100, fmt: v => Math.round(v) + '%', anchoEtq: '140px' })}</div></div>
        <div class="tenue" style="font-size:12px;margin:8px 0">Se desgrava en ${perfil.anios} años. Riesgo de que la Corte lo tumbe: <b>${Math.round(Tlc.riesgoCorte(n, E) * 100)}%</b>${n.consulta ? ' (ya se hizo la consulta previa)' : ' — la consulta previa lo baja'}.${n.intentosCongreso ? ` Ya se hundió ${n.intentosCongreso} ${n.intentosCongreso === 1 ? 'vez' : 'veces'} en el Congreso.` : ''}</div>
        <div class="fila" style="gap:8px">${UI.botonAccion('consultaPreviaTLC', { socio: n.socio }, null, 'chico')}${UI.botonAccion('firmarTLC', { socio: n.socio }, null, 'chico prim')}${UI.botonAccion('abandonarTLC', { socio: n.socio }, null, 'chico peligro')}</div>`;
    } else if (n.estado === 'ratificacion') {
      const pl = E.proyectos[n.proyecto];
      cuerpo = `<div class="tenue" style="font-size:12px">El tratado está en el Senado${pl ? ` (${esc(pl.numero)}) · etapa ${pl.etapa + 1} de ${pl.etapas.length}` : ''}. Sigue su trámite en la pestaña Proyectos. ${n.consulta ? '' : 'Aún puedes adelantar la consulta previa:'}</div>
        ${n.consulta ? '' : `<div style="margin-top:6px">${UI.botonAccion('consultaPreviaTLC', { socio: n.socio }, null, 'chico')}</div>`}`;
    } else if (n.estado === 'control') {
      cuerpo = `<div class="tenue" style="font-size:12px">El Congreso lo aprobó. La Corte Constitucional decide en ${Math.max(0, n.controlHasta - E.fecha.t)} semanas · riesgo de inexequibilidad ${Math.round(Tlc.riesgoCorte(n, E) * 100)}%.</div>`;
    }
    return `<div class="tarjeta" style="margin-top:14px"><div class="t-cab"><h3>TLC con ${esc(p.nombre)}</h3><span class="etq ${n.estado === 'cerrada' ? 'oro' : ''}">${ESTADO_NEG[n.estado]}</span></div>${cuerpo}</div>`;
  };

  const acuerdos = E => {
    const Co = C.Comercio, Tlc = C.TLC, c = E.comercio;
    const filas = Co.socios().map(p => {
      const a = Co.acuerdoDe(E, p.id), n = Tlc.neg(E, p.id), rel = Math.round(Co.relacion(E, p.id));
      const vigente = a && a.estado === 'vigente';
      let estado = '<span class="tenue">Sin acuerdo</span>', accion = '';
      if (vigente) {
        estado = `<b>${esc(TIPO_ACUERDO[a.tipo] || a.tipo)}</b> <span class="tenue">· desgravado ${Math.round(Co.progreso(a, E.fecha.t) * 100)}%</span>`;
        accion = a.tipo === 'tlc' || a.tipo === 'aap' ? UI.botonAccion('denunciarAcuerdo', { socio: p.id }, 'Denunciar', 'chico peligro') : '';
      } else if (a) estado = `<span class="tenue">${a.estado === 'denunciado' ? 'Denunciado' : 'Terminado'}</span>`;
      if (n && C.TLC.activa(n)) { estado += ` <span class="etq oro">${ESTADO_NEG[n.estado]}</span>`; }
      else if (!vigente || a.tipo === 'aap') {
        if (p.mercosur) accion = '<span class="tenue" style="font-size:11.5px">Vía adhesión al Mercosur</span>';
        else {
          accion = UI.botonAccion('abrirTLC', { socio: p.id }, 'Abrir negociación', 'chico');
          if (C.Mercosur.esMiembro(E) && C.Mercosur.bloqueaTLC(E, p.id)) accion += UI.botonAccion('pedirAutorizacionTLC', { socio: p.id }, null, 'chico');
        }
      }
      return `<tr><td><b>${esc(p.nombre)}</b></td><td class="num">${rel}</td><td>${estado}</td><td style="text-align:right">${accion}</td></tr>`;
    }).join('');
    const activas = Object.values(c.negociaciones).filter(n => C.TLC.activa(n)).map(n => panelNegociacion(E, n)).join('');
    return `<div class="tarjeta"><h3>Mapa de acuerdos</h3>
      <div class="tenue" style="font-size:12px;margin-bottom:8px">Un TLC se negocia capítulo por capítulo, pasa por el Senado y por la Corte Constitucional, y se desgrava con los años. La relación bilateral pesa: debe estar por encima de 48 para abrir la mesa.</div>
      <table class="tabla"><thead><tr><th>Socio</th><th>Relación</th><th>Acuerdo</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>${activas}`;
  };

  const mercosurBase = E => {
    const Mer = C.Mercosur, Co = C.Comercio, m = Mer.st(E), c = E.comercio, S = Co.sectores();
    const DAT = C.DATA.mercosur;
    if (!m.existe) return `<div class="tarjeta vacio">El Mercosur se funda en ${DAT.fundacion}: aún no existe en esta época.</div>`;
    const chips = Object.entries(m.miembros).map(([id, x]) => `<span class="etq ${x.suspendido ? 'rojo' : id === 'COL' ? 'oro' : ''}">${esc(Mer.nombreMiembro(id))}${x.suspendido ? ' (suspendido)' : ''}</span>`).join(' ');
    const semCumbre = Math.max(0, m.proximaCumbre - E.fecha.t);
    const estados = { ninguno: 'Sin vínculo', asociado: 'Estado Asociado', adhesion: 'Adhesión en curso', miembro: 'Miembro pleno', retirado: 'Retirado' };
    let html = `<div class="grid g3">
      ${Comp.kpi('Estatus de Colombia', estados[m.estado])}
      ${Comp.kpi('Presidencia pro tempore', esc(Mer.nombreMiembro(m.ppt)), `<span class="tenue">próxima cumbre en ${semCumbre} sem.</span>`)}
      ${Comp.kpi('Miembros', Object.keys(m.miembros).length, `<span class="tenue">decisiones por consenso: cualquiera puede vetar</span>`)}</div>
      <div class="fila" style="margin:10px 0;gap:6px;flex-wrap:wrap">${chips}</div>`;
    const adh = m.adhesion;
    if (Mer.esMiembro(E)) html += miembro(E, m, S);
    else if (adh) html += adhesion(E, m, adh, S);
    else html += `<div class="tarjeta"><h3>Entrar al bloque</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Ser miembro pleno da libre comercio con Brasil, Argentina, Uruguay y Paraguay y acceso a un mercado de ~270 millones de personas, pero obliga a converger al Arancel Externo Común (que sube los aranceles a terceros), impide fijar aranceles y firmar TLC por cuenta propia, y choca con los TLC que Colombia ya tiene con Estados Unidos, la Unión Europea, México, Chile y otros. Cualquier miembro puede vetar la adhesión.</div>
      <div class="fila">${UI.botonAccion('solicitarAdhesionMercosur', {})}${m.estado === 'retirado' ? '<span class="tenue" style="font-size:12px">Colombia se retiró del bloque.</span>' : ''}</div></div>`;
    return html + agendaMercosur(E, m);
  };

  const adhesion = (E, m, adh, S) => {
    const Mer = C.Mercosur, pq = adh.paquete, Co = C.Comercio;
    const fases = { negociacion: 'Negociando con el bloque', congreso: 'En el Senado colombiano', corte: 'En la Corte Constitucional', ratificacion: 'Ratificación de los parlamentos del bloque' };
    let cuerpo = '';
    if (adh.fase === 'negociacion') {
      const votos = Mer.votantes(E).map(id => { const ult = adh.ultimoVoto && adh.ultimoVoto.votos.find(v => v.id === id); return { etq: Mer.nombreMiembro(id), v: Mer.probVoto(E, id) * 100, color: ult ? (ult.si ? 'var(--bien)' : 'var(--mal)') : 'var(--oro)', tt: `${esc((C.DATA.mercosur.postura[id] || {}).nota || '')}` }; });
      cuerpo = `<div class="grid g2"><div><h4 class="sub-h" style="margin-top:0">La oferta de Colombia</h4>
          <div class="accion-form"><div class="fila" style="gap:8px;flex-wrap:wrap">
            <label class="tenue" style="font-size:11.5px">Convergencia<br><select data-arg="anios">${Mer.CONVERGENCIAS.map(a => `<option value="${a}" ${a === pq.anios ? 'selected' : ''}>${a} años</option>`).join('')}</select></label>
            <label class="tenue" style="font-size:11.5px">Normativa del bloque<br><select data-arg="normativa"><option value="parcial" ${pq.normativa ? '' : 'selected'}>Parcial</option><option value="total" ${pq.normativa ? 'selected' : ''}>Completa</option></select></label>
            <label class="tenue" style="font-size:11.5px">Aporte al FOCEM<br><select data-arg="focem"><option value="no" ${pq.focem ? '' : 'selected'}>No</option><option value="si" ${pq.focem ? 'selected' : ''}>Sí</option></select></label></div>
            <div style="margin-top:8px">${UI.botonAccion('armarPaqueteMercosur', {}, 'Actualizar oferta', 'chico')}</div></div>
          <h4 class="sub-h">Excepciones al Arancel Externo Común</h4>
          <div class="tenue" style="font-size:11.5px;margin-bottom:6px">Máximo dos. Protegen a tu campo o industria, pero el bloque las mira con recelo.</div>
          <div class="lista">${S.filter(s => !s.sinArancel).map(s => `<div class="it"><div class="cuerpo"><b>${s.icono} ${esc(s.nombre.split(' (')[0])}</b><span class="tenue">Arancel nacional ${pct(s.mfn)} · AEC ${pct(m.aec[s.id])}</span></div>${UI.botonAccion('excepcionAdhesionMercosur', { sector: s.id }, pq.excepciones.includes(s.id) ? 'Quitar' : 'Pedir', 'chico')}</div>`).join('')}</div></div>
        <div><h4 class="sub-h" style="margin-top:0">Consenso del bloque</h4>${G.barrasH(votos, { max: 100, marca: 50, fmt: v => Math.round(v) + '%', anchoEtq: '110px' })}
          <div class="tenue" style="font-size:11.5px;margin:6px 0">Probabilidad de que cada miembro vote sí con tu oferta actual. ${adh.ultimoVoto ? 'En la última ronda, en verde votó sí y en rojo no.' : ''} Rondas: ${adh.rondas}/8.</div>
          <div class="fila" style="gap:8px;flex-wrap:wrap">${UI.botonAccion('rondaAdhesionMercosur', {}, null, 'chico')}${UI.botonAccion('firmarProtocoloMercosur', {}, null, 'chico prim')}${UI.botonAccion('retirarSolicitudMercosur', {}, null, 'chico peligro')}</div></div></div>`;
    } else if (adh.fase === 'ratificacion') {
      cuerpo = `<div class="lista">${Object.entries(adh.ratificaciones).map(([id, r]) => `<div class="it"><div class="cuerpo"><b>Parlamento de ${esc(Mer.nombreMiembro(id))}</b><span class="tenue">${r.listo ? 'Ratificó' : r.rebotado ? 'Aplazó la ratificación' : 'Estudiando el protocolo'}</span></div>${r.listo ? '<span class="etq verde">Listo</span>' : `<span class="etq">${Math.max(0, r.hasta - E.fecha.t)} sem.</span>`}</div>`).join('')}</div>`;
    } else cuerpo = `<div class="tenue" style="font-size:12px">${adh.fase === 'congreso' ? 'El protocolo está en el Senado: sigue su trámite en la pestaña Proyectos.' : `La Corte Constitucional decide en ${Math.max(0, adh.controlHasta - E.fecha.t)} semanas.`}</div>
      <div style="margin-top:8px">${UI.botonAccion('retirarSolicitudMercosur', {}, null, 'chico peligro')}</div>`;
    return `<div class="tarjeta"><div class="t-cab"><h3>Adhesión de Colombia</h3><span class="etq oro">${fases[adh.fase]}</span></div>${cuerpo}</div>`;
  };

  const miembro = (E, m, S) => {
    const Mer = C.Mercosur, c = E.comercio;
    const conv = m.convergencia, prog = conv ? U.clamp((E.fecha.t - conv.desde) / (52 * conv.anios), 0, 1) : 1;
    const filas = S.filter(s => !s.sinArancel).map(s => {
      const exc = m.excepciones.includes(s.id);
      return `<tr><td>${s.icono} ${esc(s.nombre.split(' (')[0])}</td><td class="num">${pct(s.mfn)}</td><td class="num">${pct(m.aec[s.id])}</td><td class="num"><b>${U.d1(c.aranceles[s.id])}%</b></td><td>${exc ? '<span class="etq oro">Excepción</span>' : ''}</td><td style="text-align:right">${exc ? '' : UI.botonAccion('pedirExcepcionAEC', { sector: s.id }, 'Pedir excepción', 'chico')}</td></tr>`;
    }).join('');
    const conflictos = Object.entries(m.conflictos).map(([id, cf]) => {
      const p = C.Comercio.socio(id), a = C.Comercio.acuerdoDe(E, id);
      const estado = cf.estado === 'pendiente' ? `<span class="etq rojo">Pendiente · ${Math.max(0, cf.hasta - E.fecha.t)} sem.</span>` : cf.estado === 'excepcion' ? '<span class="etq amar">Régimen transitorio</span>' : '<span class="etq">Resuelto</span>';
      const accion = cf.estado === 'pendiente' ? `<div class="fila accion-form" style="gap:6px;flex-wrap:nowrap"><select data-arg="camino"><option value="excepcion">Buscar excepción</option><option value="denunciar">Denunciar el acuerdo</option></select>${UI.botonAccion('conflictoMercosur', { socio: id }, 'Resolver', 'chico')}</div>` : '';
      return `<tr><td><b>${esc(p.nombre)}</b><div class="tenue" style="font-size:11.5px">${a ? esc(a.nombre) : ''}${cf.acomodable ? ' · más fácil de acomodar (Comunidad Andina)' : ''}</div></td><td>${estado}</td><td>${accion}</td></tr>`;
    }).join('');
    return `<div class="tarjeta"><h3>Convergencia al Arancel Externo Común</h3>
        <div class="barra-h" style="height:10px"><i style="width:${Math.round(prog * 100)}%;background:var(--oro)"></i></div>
        <div class="tenue" style="font-size:12px;margin:4px 0 8px">${Math.round(prog * 100)}% del camino${conv ? ` (plazo ${U.d1(conv.anios)} años)` : ''}. No puedes fijar estos aranceles por tu cuenta, salvo en las excepciones que el bloque conceda (${m.excepciones.length}/${m.excepcionesMax}).</div>
        <table class="tabla"><thead><tr><th>Sector</th><th>Antes</th><th>AEC</th><th>Aplicado hoy</th><th></th><th></th></tr></thead><tbody>${filas}</tbody></table></div>
      ${conflictos ? `<div class="tarjeta" style="margin-top:14px"><h3>Choque con tus TLC anteriores</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Un miembro del Mercosur no puede tener TLC por separado con terceros. Cada acuerdo necesita una excepción del bloque o se pierde al vencer el plazo.</div><table class="tabla"><tbody>${conflictos}</tbody></table></div>` : ''}
      <div class="fila" style="margin-top:12px">${UI.botonAccion('salirMercosur', {}, null, 'chico peligro')}</div>`;
  };

  const agendaMercosur = (E, m) => {
    const Mer = C.Mercosur, DAT = C.DATA.mercosur;
    const items = m.agenda.filter(x => x.estado === 'pendiente');
    const cerradas = m.agenda.filter(x => x.estado !== 'pendiente').slice(-3);
    const fila = it => {
      const def = DAT.decisiones.find(d => d.id === it.decision);
      const botones = Mer.esMiembro(E) ? `<div class="fila" style="gap:6px">${UI.botonAccion('respaldarDecisionMercosur', { item: it.id }, null, 'chico')}${UI.botonAccion('vetarDecisionMercosur', { item: it.id }, null, 'chico peligro')}</div>` : '';
      return `<div class="it" style="align-items:flex-start"><div class="cuerpo"><b>${esc(def.nombre)}</b><span class="tenue">Propone ${esc(Mer.nombreMiembro(it.proponen))} · gana: ${esc(def.quienGana)} · pierde: ${esc(def.quienPierde)}</span><span class="tenue">Se decide en ${Math.max(0, it.hasta - E.fecha.t)} sem.${it.respaldo ? (it.respaldo > 0 ? ' · Colombia respalda' : ' · Colombia vetará') : ''}</span></div>${botones}</div>`;
    };
    const impulsar = Mer.colombiaPreside(E) ? `<div class="fila accion-form" style="margin-top:8px;gap:6px"><select data-arg="decision">${DAT.decisiones.map(d => `<option value="${d.id}">${esc(d.nombre)}</option>`).join('')}</select>${UI.botonAccion('impulsarAgendaMercosur', {}, null, 'chico')}</div>` : '';
    return `<div class="tarjeta" style="margin-top:14px"><h3>Cumbres y decisiones del bloque</h3>
      ${items.length ? `<div class="lista">${items.map(fila).join('')}</div>` : '<div class="tenue" style="font-size:12px">No hay decisiones pendientes: llegan con cada cumbre semestral.</div>'}
      ${cerradas.length ? `<div class="tenue" style="font-size:11.5px;margin-top:8px">Últimas: ${cerradas.map(it => `${esc(DAT.decisiones.find(d => d.id === it.decision).nombre)} (${it.estado})`).join(' · ')}</div>` : ''}${impulsar}</div>`;
  };

  const institucional = E => {
    const Ins = C.MercosurInst, Mer = C.Mercosur, i = Ins.st(E), m = Mer.st(E), miembro = Mer.esMiembro(E), pr = i.prop, par = Ins.parecido(E);
    const pres = E.gobierno.presidente === 'J' && miembro;
    const nivelNom = (eje, n) => Ins.EJES[eje].niveles[n];
    const filas = Object.entries(Ins.EJES).map(([k, e]) => {
      const ops = e.niveles.map((n, j) => j === i.niv[k] ? '' : `<option value="${k}|${j}">${j > i.niv[k] ? '▲' : '▼'} ${esc(n)}</option>`).join('');
      return `<tr><td style="width:24%"><b>${e.icono} ${esc(e.n)}</b><div class="tenue" style="font-size:11px">${esc(e.txt)}</div></td><td><div class="barra-h" style="width:90px;margin-bottom:3px"><i style="width:${Math.round(i.niv[k] / (e.niveles.length - 1) * 100)}%;background:var(--oro)"></i></div><span style="font-size:12.5px">${esc(nivelNom(k, i.niv[k]))}</span></td>
        <td>${pres && !pr ? `<div class="fila accion-form" style="gap:6px;flex-wrap:nowrap"><select data-arg="cambio" style="max-width:260px">${ops}</select>${UI.botonAccion('proponerReformaMercosur', {}, 'Proponer', 'chico')}</div>` : ''}</td></tr>`;
    }).join('');
    const modelos = Object.entries(Ins.MODELOS).map(([k, mo]) => `<div class="tarjeta" style="padding:10px 12px"><div class="t-cab"><h4 class="sub-h" style="margin:0">${mo.icono} ${esc(mo.n)}</h4><span class="etq ${par[k] >= 70 ? 'verde' : ''}">${par[k]}% parecido</span></div><div class="tenue" style="font-size:11.5px;margin:6px 0">${esc(mo.txt)}</div>${pres && !pr ? UI.botonAccion('proponerModeloMercosur', { modelo: k }, 'Proponer este modelo', 'chico') : ''}</div>`).join('');
    const j = Ins.jug(E), eleP = Ins.elegible(E, 'parlamentario'), eleD = Ins.elegible(E, 'comisionado');
    const papel = `<div class="tarjeta" style="margin-bottom:14px"><h3>🎖 Tu papel en el bloque</h3>
      ${j.rol ? `<div class="resultado-jugador ok" style="margin-bottom:8px"><div style="font-size:24px">${j.rol === 'comisionado' ? '🎩' : '🏟'}</div><div><b>${j.rol === 'comisionado' ? (i.niv.directorio >= 3 ? 'Presidente del Directorio' : 'Comisionado del Directorio') : 'Parlamentario del Mercosur'}</b><div class="tenue">Hasta ${U.fmtT(j.hasta)}</div></div></div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${j.rol === 'parlamentario' ? UI.botonAccion('enmendarReformaMercosur', {}, null, 'chico') + UI.botonAccion('mocionCensuraMercosur', {}, null, 'chico peligro') : `<select data-arg="decision">${C.DATA.mercosur.decisiones.map(d => `<option value="${d.id}">${esc(d.nombre)}</option>`).join('')}</select>${UI.botonAccion('proponerAgendaDirectorio', {}, null, 'chico')}`}${UI.botonAccion('renunciarRolMercosur', {}, null, 'chico peligro')}</div>`
      : `<div class="grid g2"><div><h4 class="sub-h" style="margin:0 0 4px">🏟 Parlamento del Mercosur</h4><div class="tenue" style="font-size:12px;margin-bottom:6px">${i.niv.parlamento >= 2 ? `Elecciones cada cuatro años${i.parlProx ? ' · próxima: ' + U.fmtT(i.parlProx) : ''}. ${j.candidato ? '<b>Estás inscrito en la lista.</b>' : ''}` : 'Necesita un parlamento con elección directa.'}</div>${UI.botonAccion('postularParlamentoMercosur', {}, null, 'chico')}${eleP !== true ? `<div class="tenue" style="font-size:11.5px;margin-top:4px">${esc(eleP)}</div>` : ''}</div>
        <div><h4 class="sub-h" style="margin:0 0 4px">🎩 Directorio</h4><div class="tenue" style="font-size:12px;margin-bottom:6px">Lo eligen los jefes de Estado del bloque. Se exige haber dejado los cargos públicos y contar con trayectoria de Estado.</div>${UI.botonAccion('postularDirectorioMercosur', {}, null, 'chico')}${eleD !== true ? `<div class="tenue" style="font-size:11.5px;margin-top:4px">${esc(eleD)}</div>` : ''}</div></div>`}
      ${j.hist.length ? `<div class="tenue" style="font-size:11.5px;margin-top:8px">Trayectoria: ${j.hist.slice(0, 3).map(h => esc(h.txt) + ' (' + U.fmtT(h.t) + ')').join(' · ')}</div>` : ''}</div>`;
    let tramite = '';
    if (pr) {
      const fases = { negociacion: 'Negociación con los socios', aprobada: 'Aprobada', congreso: 'En el Congreso colombiano', corte: 'Control de la Corte Constitucional', ratificacion: 'Ratificación por los parlamentos de los socios' };
      const votos = pr.fase === 'negociacion' ? Mer.votantes(E).map(id => { const ult = pr.votos && pr.votos.votos.find(v => v.id === id); return { etq: Mer.nombreMiembro(id), v: Math.round(Ins.probVoto(E, id) * 100), color: ult ? (ult.si ? 'var(--si)' : 'var(--no)') : 'var(--oro)' }; }) : [];
      tramite = `<div class="tarjeta" style="border-left:4px solid var(--oro);margin-bottom:14px"><div class="t-cab"><h3>📨 Reforma en trámite</h3><span class="etq oro">${esc(fases[pr.fase])}</span></div>
        <div style="font-size:13px;margin-bottom:6px"><b>${esc(pr.etiqueta)}</b></div><div class="tenue" style="font-size:12px;margin-bottom:8px">${pr.cambios.map(c => `${Ins.EJES[c.eje].icono} ${esc(Ins.EJES[c.eje].n)} → ${esc(nivelNom(c.eje, c.nivel))}`).join(' · ')}</div>
        ${votos.length ? `${G.barrasH(votos, { max: 100, marca: 50, fmt: v => v + ' % de apoyo', anchoEtq: '80px' })}<div class="tenue" style="font-size:11.5px;margin:6px 0">Regla de votación vigente: <b>${esc(nivelNom('votacion', i.niv.votacion))}</b>. Cada ronda es un intento; tras seis fracasa.</div>` : ''}
        ${pr.ratif ? `<div class="tenue" style="font-size:12px">Ratificaciones: ${Object.entries(pr.ratif).map(([id, r]) => `${esc(Mer.nombreMiembro(id))} ${r.listo ? '✔' : '…'}`).join(' · ')}</div>` : ''}
        ${pres ? `<div class="fila" style="gap:6px;margin-top:8px">${pr.fase === 'negociacion' ? UI.botonAccion('rondaReformaMercosur', {}, null, 'chico') : ''}${UI.botonAccion('retirarReformaMercosur', {}, null, 'chico peligro')}</div>` : ''}</div>`;
    }
    const inst = `<div class="grid g3" style="margin-bottom:14px">
      <div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">🏛 Directorio ${i.niv.directorio >= 2 ? `<span class="tenue" style="font-weight:400">· comisionado: ${i.comisionado && E.politicos[i.comisionado] ? esc(E.politicos[i.comisionado].nombre) : 'sin nombrar'}${E.fecha.t < (i.censuraHasta || 0) ? ' · 🛑 censurado' : ''}</span>` : ''}</h4><div class="tenue" style="font-size:12px">${esc(nivelNom('directorio', i.niv.directorio))}.${i.niv.directorio >= 2 ? ' Propone más decisiones en cada cumbre y les da más opciones de pasar.' : ' Sin un órgano propio, todo depende de la presidencia rotativa.'}</div>
        ${pres && i.niv.directorio >= 2 ? `<div class="fila accion-form" style="gap:6px;margin-top:6px"><select data-arg="pol">${C.Exterior.candidatos(E).slice(0, 12).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>${UI.botonAccion('nombrarComisionado', {}, null, 'chico')}</div>` : ''}</div>
      <div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">🏟 Parlamento</h4><div class="tenue" style="font-size:12px">${esc(nivelNom('parlamento', i.niv.parlamento))}. Legitimidad del bloque: <b>${Math.round(i.legit)}%</b>.</div>${i.parlSeats && i.niv.parlamento >= 2 ? `<div class="fila" style="gap:4px;flex-wrap:wrap;margin-top:6px">${i.parlSeats.map(x => `<span class="etq">${esc(x.sigla)} ${x.esc}</span>`).join('')}</div><div class="tenue" style="font-size:11px;margin-top:4px">Escaños de Colombia (18)</div>` : ''}</div>
      <div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">⚖ Tribunal</h4><div class="tenue" style="font-size:12px">${esc(nivelNom('tribunal', i.niv.tribunal))}. Probabilidad de que un socio cumpla un fallo: <b>${[35, 55, 80, 95][i.niv.tribunal]}%</b>.</div></div></div>`;
    return `${miembro ? '' : '<div class="tenue" style="font-size:12px;margin-bottom:10px">Sólo los miembros plenos proponen reformas; aquí ves cómo está diseñado el bloque.</div>'}
      <div class="grid g4">${Comp.kpi('Modelo del bloque', esc(Ins.modelo(E)), `<span class="tenue">integración ${Ins.indice(E)}%</span>`)}${Comp.kpi('Parecido a la UE', par.ue + '%', `<span class="tenue">ASEAN ${par.asean}% · vacío ${par.vacio}%</span>`)}${Comp.kpi('Legitimidad', Math.round(i.legit) + '%', '<span class="tenue">la sube el parlamento</span>')}${Comp.kpi('Bono al comercio', (Ins.bonoComercio(E) >= 1 ? '+' : '') + U.d1((Ins.bonoComercio(E) - 1) * 100) + '%', '<span class="tenue">con los socios del bloque</span>')}</div>
      <div style="margin-top:14px">${tramite}${inst}${papel}</div>
      <div class="tarjeta"><h3>🧩 Modelos de bloque</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Un paquete completo de reformas para parecerse a la Unión Europea, a la ASEAN o volver a un tratado casi vacío. Los socios votan cada eje según su interés, y los cambios profundos pasan por el Congreso, la Corte y los parlamentos de los demás miembros.</div><div class="grid g3">${modelos}</div></div>
      <div class="tarjeta" style="margin-top:14px"><h3>🎛 Reformas eje por eje</h3><table class="tabla"><thead><tr><th>Eje</th><th>Hoy</th><th>Proponer</th></tr></thead><tbody>${filas}</tbody></table></div>
      ${i.hist.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Historial de reformas</h3><div class="lista">${i.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div><span class="etq ${h.ok ? 'verde' : 'rojo'}">${h.ok ? 'En vigor' : 'Cayó'}</span></div>`).join('')}</div></div>` : ''}`;
  };
  const mercosur = E => {
    const sub = E.ui.merTab || 'bloque', m = C.Mercosur.st(E);
    if (!m.existe || !C.MercosurInst) return mercosurBase(E);
    const tabs = `<div class="tabs" style="margin-bottom:12px"><button data-mer="bloque" class="${sub === 'bloque' ? 'activo' : ''}">Membresía y cumbres</button><button data-mer="estr" class="${sub === 'estr' ? 'activo' : ''}">Instituciones</button><button data-mer="inst" class="${sub === 'inst' ? 'activo' : ''}">Reforma institucional</button></div>`;
    return tabs + (sub === 'inst' ? institucional(E) : sub === 'estr' ? estructura(E, 'mercosur') : mercosurBase(E));
  };


  /* ── Comunidad Andina (misma lógica que el Mercosur: membresía y cumbres + reforma institucional) ── */
  const nomP = id => id === 'COL' ? 'Colombia' : (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const barraC = (v, c) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:110px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${c || '#2FA58A'}"></i></div><b class="num" style="min-width:28px">${Math.round(v)}</b></div>`;
  const filaC = (n, v) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${v}</div>`;
  const selC = (arg, opts) => `<select data-arg="${arg}">${opts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>`;
  const canBase = E => {
    const N = C.CAN, c = N.asegurar(E), en = N.enCAN(E), y = U.anio(), D = C.DATA.multi;
    if (!N.activa()) return `<div class="tarjeta vacio">El Acuerdo de Cartagena (Pacto Andino) se firma en 1969: aún no existe en esta época.</div>`;
    const m = N.miembrosEn(y), disp = N.disponibles(E), semProx = Math.max(0, c.prox - E.fecha.t);
    const decs = D.CAN_DEC.filter(d => c.dec[d.id].estado === 'vigente').map(d => `<div class="it"><div class="cuerpo" style="font-size:13px">${esc(d.n)}</div><span class="etq verde">vigente</span></div>`).join('');
    const ctr = c.controv.slice(0, 6).map(k => `<div class="it"><div class="cuerpo"><b>${esc(nomP(k.pais))}</b> · ${esc(k.obj)}<div class="tenue" style="font-size:12px">${k.fase === 'cerrado' ? esc(k.resultado || '') : k.fase === 'secretaria' ? 'Secretaría General (Lima)' : 'Tribunal de Justicia (Quito)'}</div></div><span class="etq ${k.fase === 'cerrado' ? '' : 'amar'}">${k.fase === 'cerrado' ? 'cerrado' : 'en trámite'}</span></div>`).join('');
    const herr = en && E.gobierno.presidente === 'J' ? `<div class="tarjeta"><h3>Tus herramientas</h3>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${selC('dec', disp.map(d => [d.id, d.n]))}${UI.botonAccion('proponerDecisionCAN', { dec: disp[0] ? disp[0].id : '' }, 'Proponer decisión', 'chico prim')}</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${selC('pais', N.socios(E).map(id => [id, nomP(id)]))}${UI.botonAccion('cabildearCAN', { pais: N.socios(E)[0] }, 'Cabildear', 'chico')}${UI.botonAccion('demandarIncumplimiento', { pais: N.socios(E)[0] }, 'Demandar ante el Tribunal', 'chico')}</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${selC('tema', [['comercio', 'Comercio'], ['seguridad', 'Seguridad'], ['migracion', 'Migración'], ['energia', 'Energía']])}${UI.botonAccion('convocarCumbreAndina', { tema: 'comercio' }, 'Convocar cumbre andina', 'chico')}</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap">${selC('tipo', Object.entries(D.CAF))}${UI.botonAccion('solicitarCAF', { tipo: 'infra' }, 'Crédito de la CAF', 'chico')}</div></div>` : '';
    return `<div class="grid g3">${Comp.kpi('Colombia', en ? 'Miembro' : 'Fuera de la CAN')}${Comp.kpi('Presidencia pro tempore', esc(nomP(c.ppt.pais)), `<span class="tenue">${c.ppt.anio} · rota cada año</span>`)}${Comp.kpi('Integración', Math.round(c.integ), `<span class="tenue">próxima propuesta en ~${semProx} sem.</span>`)}</div>
      <div class="fila" style="margin:10px 0;gap:6px;flex-wrap:wrap">${m.map(id => `<span class="etq ${id === 'COL' ? 'oro' : ''}">${esc(nomP(id))}</span>`).join(' ')}</div>
      <div class="tenue" style="font-size:12px;margin-bottom:10px">Órganos: Consejo Presidencial, Consejo de Cancilleres, Comisión (aprueba Decisiones por mayoría), Secretaría General (Lima), Tribunal de Justicia (Quito), Parlamento Andino (Bogotá) y la CAF como banco de desarrollo. A diferencia del Mercosur, las Decisiones andinas tienen efecto directo y no requieren ratificación de los parlamentos.</div>
      <div class="grid g2"><div class="col">${herr}<div class="tarjeta"><h3>Controversias y Tribunal Andino</h3>${ctr ? `<div class="lista">${ctr}</div>` : '<div class="tenue" style="font-size:13px">Sin controversias abiertas.</div>'}</div></div>
      <div class="col"><div class="tarjeta"><h3>Decisiones vigentes</h3>${decs ? `<div class="lista">${decs}</div>` : '<div class="tenue" style="font-size:13px">Aún no hay decisiones vigentes.</div>'}</div>${c.hist.length ? `<div class="tarjeta"><h3>Crónica de la CAN</h3><div class="lista">${c.hist.slice(0, 6).map(h => `<div class="it"><div class="cuerpo">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(h.t)}</div></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };
  const canInst = E => {
    const N = C.CAN, i = N.inst(E), esP = E.gobierno.presidente === 'J' && N.enCAN(E);
    if (!N.activa()) return canBase(E);
    const filas = Object.entries(N.EJES).map(([k, e]) => { const prop = (i.niv[k] + 1) % e.niveles.length; return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="min-width:60%"><b>${e.icono} ${esc(e.n)}</b><div class="tenue" style="font-size:12px">${esc(e.txt)}</div><div style="margin-top:4px"><span class="etq oro">${esc(e.niveles[i.niv[k]])}</span></div></div>${esP ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap;width:100%;margin-top:6px"><select data-arg="nivel" style="max-width:260px">${e.niveles.map((n, j) => `<option value="${j}" ${j === prop ? 'selected' : ''}>${esc(n)}${j === i.niv[k] ? ' · actual' : ''}</option>`).join('')}</select>${UI.botonAccion('reformarCAN', { eje: k, nivel: prop }, 'Proponer', 'chico')}</div>` : ''}</div>`; }).join('');
    const mods = Object.entries(N.MODELOS).map(([k, m]) => `<div class="it"><div class="cuerpo"><b>${m.icono} ${esc(m.n)}</b><div class="tenue" style="font-size:12px">${esc(m.txt)}</div></div>${esP ? UI.botonAccion('paqueteCAN', { modelo: k }, 'Proponer', 'chico') : ''}</div>`).join('');
    return `<div class="grid g3">${Comp.kpi('Profundidad institucional', N.indiceInst(E) + ' / 100')}${Comp.kpi('Integración', Math.round(N.asegurar(E).integ))}${Comp.kpi('Reglas de aprobación', 'Mayoría absoluta', '<span class="tenue">las reformas fuertes exigen tres cuartas partes</span>')}</div>
      <div class="tenue" style="font-size:12px;margin:10px 0">Cada reforma se vota entre los países miembros según su interés: Perú empuja la apertura y los servicios, Bolivia y Ecuador cuidan su soberanía comercial y piden fondos. No hay Congreso, Corte ni parlamentos de por medio: las Decisiones entran en vigor de inmediato.</div>
      <div class="grid g2"><div class="col"><div class="tarjeta"><h3>Ejes de la integración</h3><div class="lista">${filas}</div></div></div>
      <div class="col"><div class="tarjeta"><h3>Modelos de integración</h3><div class="lista">${mods}</div></div><div class="tarjeta"><h3>Puente con el Mercosur</h3><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Un acuerdo de convergencia ampliaría el libre comercio con Brasil, Argentina, Uruguay y Paraguay.</div>${esP ? UI.botonAccion('convergenciaMercosur', {}, 'Impulsar la convergencia', 'chico prim') : ''}</div></div></div>`;
  };
  const can = E => {
    const sub = E.ui.canTab || 'bloque';
    if (!C.CAN.activa()) return canBase(E);
    const tabs = `<div class="tabs" style="margin-bottom:12px"><button data-can="bloque" class="${sub === 'bloque' ? 'activo' : ''}">Membresía y cumbres</button><button data-can="estr" class="${sub === 'estr' ? 'activo' : ''}">Instituciones</button><button data-can="inst" class="${sub === 'inst' ? 'activo' : ''}">Reforma institucional</button></div>`;
    return tabs + (sub === 'inst' ? canInst(E) : sub === 'estr' ? estructura(E, 'can') : canBase(E));
  };


  /* ── Estructura política de los bloques (CAN y Mercosur): Consejo, Comisión, Parlamento y Tribunal ── */
  const hemi = par => {
    const G = C.Bloques.GRUPOS, N = par.total; if (!N) return '';
    const R = N > 80 ? 6 : N > 40 ? 4 : 3, pos = []; const r0 = 55, dr = 22;
    const tot = U.suma(Array.from({ length: R }, (_, k) => r0 + k * dr));
    for (let k = 0; k < R; k++) { const r = r0 + k * dr, n = Math.round(N * r / tot); for (let i = 0; i < n; i++) pos.push({ a: Math.PI - (n === 1 ? Math.PI / 2 : i * Math.PI / (n - 1)), r }); }
    while (pos.length > N) pos.pop(); while (pos.length < N) pos.push({ a: Math.PI / 2, r: r0 });
    pos.sort((x, y) => y.a - x.a || x.r - y.r);
    const seq = []; for (const g of G) for (let i = 0; i < (par.tot[g[0]] || 0); i++) seq.push(g);
    const rr = N > 80 ? 4.2 : N > 40 ? 5.5 : 7;
    const circ = pos.map((q, i) => { const g = seq[i] || G[2]; return `<circle cx="${(150 + q.r * Math.cos(q.a)).toFixed(1)}" cy="${(150 - q.r * Math.sin(q.a)).toFixed(1)}" r="${rr}" fill="${g[2]}"/>`; }).join('');
    return `<svg viewBox="0 0 300 165" style="width:100%;max-width:480px">${circ}<text x="150" y="146" text-anchor="middle" fill="currentColor" style="font-size:20px;font-weight:700">${N}</text><text x="150" y="160" text-anchor="middle" fill="currentColor" style="font-size:9px;opacity:.7">ESCAÑOS</text></svg>`;
  };
  const estructura = (E, id) => {
    const Bl = C.Bloques, nv = Bl.niveles(E, id), s = Bl.st(E, id), nom = Bl.nombre(id), esP = E.gobierno.presidente === 'J' && Bl.colMiembro(E, id), rol = Bl.rolJ(E, id), cat = Bl.catalogo(E, id).filter(n => !s.prop.some(p => p.norma === n.id && !['aprobada', 'rechazada'].includes(p.fase)) && !(id === 'can' && C.CAN.asegurar(E).dec[n.id].estado === 'vigente'));
    if (!Bl.existe(E, id)) return `<div class="tarjeta vacio">La ${nom} aún no existe en esta época.</div>`;
    const ms = Bl.miembros(E, id), com = Bl.comision(E, id), par = Bl.parlamento(E, id), jue = Bl.jueces(E, id);
    const REGLA = { unanimidad: 'Unanimidad (cualquiera puede vetar)', mayoria: 'Mayoría absoluta', calificada: 'Mayoría calificada (dos tercios)', ponderada: 'Mayoría ponderada por población y PIB' };
    const ppt = id === 'can' ? C.CAN.asegurar(E).ppt.pais : C.Mercosur.st(E).ppt;
    const abiertas = s.prop.filter(p => !['aprobada', 'rechazada'].includes(p.fase)), cerradas = s.prop.filter(p => ['aprobada', 'rechazada'].includes(p.fase)).slice(0, 5);
    const consejo = `<div class="tarjeta"><h3>🏛 Consejo (jefes de Estado y cancilleres)</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Un voto por país. Regla vigente: <b>${esc(REGLA[nv.regla])}</b>.</div>
      <div class="fila" style="gap:6px;flex-wrap:wrap">${ms.map(p => `<span class="etq ${p === 'COL' ? 'oro' : ''}">${esc(nomP(p))}${p === ppt ? ' · presidencia' : ''}</span>`).join('')}</div></div>`;
    const sugs = s.sug.filter(x => x.estado === 'abierta');
    const candCom = nv.comision >= 3 ? (id === 'can' ? `<div style="margin-top:8px">${UI.botonAccion('postularComisionBloque', { bloque: 'can' }, null, 'chico')}</div>` : `<div style="margin-top:8px">${UI.botonAccion('postularDirectorioMercosur', {}, null, 'chico')}</div>`) : '';
    const comisionCard = nv.comision === 0 ? `<div class="tarjeta"><h3>🎩 Comisión</h3><div class="tenue" style="font-size:12.5px">El ${nom} no tiene una comisión ejecutiva: sólo una Presidencia Pro Tempore rotativa y una secretaría técnica. Una reforma del Directorio crearía comisionados.</div></div>`
      : `<div class="tarjeta"><h3>🎩 ${nv.comision === 3 ? (nv.iniciativa ? 'Comisión (un comisionado por país)' : 'Representantes permanentes') : nv.comision === 2 ? 'Secretaría con iniciativa' : 'Secretaría técnica'}</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">${nv.iniciativa ? 'Tiene iniciativa: propone las normas al Parlamento y al Consejo.' : 'Sin iniciativa: ejecuta y asesora a los gobiernos.'} Sede: ${esc(nv.sedes[0])}.</div>
        <div class="lista">${com.map(c => `<div class="it" style="${c.jug ? 'border-left:3px solid var(--oro);padding-left:6px' : ''}"><div class="cuerpo"><b>${esc(c.nombre)}</b>${c.jug ? ' <span class="etq oro">tú</span>' : ''}<div class="tenue" style="font-size:12px">${esc(c.cargo)} · ${esc(c.cartera)} · ${esc(nomP(c.pais))}</div></div></div>`).join('')}</div>
        ${rol && rol.rol === 'comisionado' ? `<h4 class="sub-h" style="margin:12px 0 6px">📬 Sugerencias recibidas</h4>${sugs.length ? `<div class="lista">${sugs.map(g => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(g.titulo)}</b><div class="tenue" style="font-size:12px">La envía ${esc(g.de)}</div></div><div class="fila" style="gap:6px">${UI.botonAccion('atenderSugerencia', { bloque: id, sug: g.id, via: 'adoptar' }, 'Adoptar', 'chico')}${UI.botonAccion('atenderSugerencia', { bloque: id, sug: g.id, via: 'devolver' }, 'Devolver', 'chico')}${UI.botonAccion('atenderSugerencia', { bloque: id, sug: g.id, via: 'archivar' }, 'Archivar', 'chico')}</div></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12.5px">No hay sugerencias pendientes: llegan de gobiernos, gremios y ONG.</div>'}
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:8px"><select data-arg="norma" style="max-width:260px">${cat.map(n => `<option value="${n.id}">${esc(n.n)}</option>`).join('')}</select>${UI.botonAccion('proponerNormaComisionado', { bloque: id, norma: (cat[0] || {}).id }, 'Presentar una norma', 'chico prim')}</div>`
          : `<div class="tenue" style="font-size:12px;margin:10px 0 6px">No eres parte de la Comisión: puedes presentar una sugerencia o aspirar a una silla.</div>
          <div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="norma" style="max-width:260px">${cat.map(n => `<option value="${n.id}">${esc(n.n)}</option>`).join('')}</select>${UI.botonAccion('sugerirComision', { bloque: id, norma: (cat[0] || {}).id }, 'Presentar sugerencia', 'chico')}</div>${candCom}`}</div>`;
    const grupos = Bl.GRUPOS.filter(g => par.tot[g[0]]).map(g => `<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px"><i style="width:10px;height:10px;border-radius:50%;background:${g[2]};display:inline-block"></i>${esc(g[1])} <b>${par.tot[g[0]]}</b></span>`).join(' ');
    const porPais = par.paises.map(p => `<tr><td>${esc(nomP(p.id))}</td><td class="num">${p.esc}</td><td>${Bl.GRUPOS.map(g => p.grupos[g[0]] ? `<span style="color:${g[2]}">●</span>${p.grupos[g[0]]}` : '').join(' ')}</td></tr>`).join('');
    const colPar = id === 'mercosur' && C.MercosurInst ? (rol && rol.rol === 'parlamentario' ? '' : `<div style="margin-top:8px">${UI.botonAccion('postularParlamentoMercosur', {}, null, 'chico')}</div>`) : (rol && rol.rol === 'parlamentario' ? '' : `<div style="margin-top:8px">${UI.botonAccion('postularParlamentoBloque', { bloque: 'can' }, null, 'chico')}</div>`);
    const parCard = `<div class="tarjeta"><h3>🏟 Parlamento ${id === 'can' ? 'Andino' : 'del Mercosur'}</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">${esc(par.txt)}. Sede: ${esc(nv.sedes[1])}.</div>${par.nivel ? `<div style="text-align:center">${hemi(par)}</div><div class="fila" style="gap:10px;flex-wrap:wrap;margin:6px 0">${grupos}</div><table class="tabla"><thead><tr><th>País</th><th>Escaños</th><th>Grupos</th></tr></thead><tbody>${porPais}</tbody></table>` : '<div class="tenue" style="font-size:12.5px">Aún no hay parlamento. Una reforma institucional lo crearía.</div>'}${rol && rol.rol === 'parlamentario' ? '<div class="etq oro" style="margin-top:8px">Eres parlamentario/a: votas las normas de abajo</div>' : par.nivel ? colPar : ''}</div>`;
    const tribunal = `<div class="tarjeta"><h3>⚖ Tribunal de Justicia</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">${nv.tribunal >= 2 ? 'Jurisdicción obligatoria' : nv.tribunal === 1 ? 'Opiniones y arbitraje permanente' : 'Arbitraje ad hoc'}. Sede: ${esc(nv.sedes[2])}.</div><div class="fila" style="gap:6px;flex-wrap:wrap">${jue.map(j => `<span class="etq">${esc(j.nombre)} (${esc(nomP(j.pais))})</span>`).join('')}</div></div>`;
    const FASES = { comision: 'En la Comisión', dictamen: 'Dictamen del foro parlamentario', parlamento: 'En el Parlamento', consejo: 'En el Consejo', aprobada: 'Aprobada', rechazada: 'Rechazada' };
    const filaProp = p => {
      let acc = '', info = '';
      if (p.parl) info += `Parlamento: ${p.parl.f} a favor, ${p.parl.c} en contra. `;
      if (p.cons) info += `Consejo: ${p.cons.f} de ${p.cons.n} países. `;
      if (rol && rol.rol === 'parlamentario' && ['parlamento', 'dictamen'].includes(p.fase)) acc = `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:6px"><select data-arg="voto"><option value="si">Votar a favor</option><option value="no">Votar en contra</option></select>${UI.botonAccion('votarParlamentoBloque', { bloque: id, prop: p.id, voto: 'si' }, 'Votar', 'chico prim')}<select data-arg="grupo">${Bl.GRUPOS.map(g => `<option value="${g[0]}">${esc(g[1])}</option>`).join('')}</select>${UI.botonAccion('cabildearGrupoBloque', { bloque: id, prop: p.id, grupo: 'cen' }, 'Cabildear al grupo', 'chico')}</div>${p.votoJ ? `<div class="tenue" style="font-size:11.5px">Tu voto: ${p.votoJ === 'si' ? 'a favor' : 'en contra'}</div>` : ''}`;
      else if (esP && p.fase === 'consejo') acc = `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:6px"><select data-arg="pais">${ms.filter(x => x !== 'COL').map(x => `<option value="${x}">${esc(nomP(x))}</option>`).join('')}</select>${UI.botonAccion('cabildearPaisBloque', { bloque: id, prop: p.id, pais: ms.filter(x => x !== 'COL')[0] }, 'Cabildear su voto', 'chico')}</div>`;
      return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo"><b>${esc(p.titulo)}</b> <span class="etq ${p.fase === 'aprobada' ? 'verde' : p.fase === 'rechazada' ? 'rojo' : 'amar'}">${esc(FASES[p.fase])}</span><div class="tenue" style="font-size:12px">${p.autor === 'Comisión' ? 'Propone la Comisión' : 'Propone ' + esc(nomP(p.autor))} · ${esc(info)}</div>${acc}</div></div>`;
    };
    const props = `<div class="tarjeta"><h3>📜 Normas comunitarias en trámite</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Recorren ${nv.comision >= 2 && nv.iniciativa ? 'Comisión → ' : ''}${nv.parlamento >= 2 ? 'Parlamento → ' : nv.parlamento === 1 ? 'dictamen del foro (no vinculante) → ' : ''}Consejo.</div>${abiertas.length ? `<div class="lista">${abiertas.map(filaProp).join('')}</div>` : '<div class="tenue" style="font-size:13px">No hay normas en trámite.</div>'}${cerradas.length ? `<h4 class="sub-h" style="margin:12px 0 6px">Resueltas</h4><div class="lista">${cerradas.map(filaProp).join('')}</div>` : ''}
      ${esP ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:10px"><select data-arg="norma" style="max-width:280px">${cat.map(n => `<option value="${n.id}">${esc(n.n)}</option>`).join('')}</select>${UI.botonAccion('proponerNormaBloque', { bloque: id, norma: (cat[0] || {}).id }, 'Proponer una norma', 'chico prim')}</div>` : ''}</div>`;
    return `<div class="grid g4">${Comp.kpi('Regla del Consejo', esc(REGLA[nv.regla].split(' (')[0]))}${Comp.kpi('Comisión', nv.comision === 0 ? 'Sólo secretaría' : nv.comision === 3 ? (nv.iniciativa ? 'Con iniciativa' : 'Representantes') : 'Secretaría')}${Comp.kpi('Parlamento', ['Ninguno', 'Foro', 'Elegido', 'Colegislador'][nv.parlamento])}${Comp.kpi('Tribunal', ['Ad hoc', 'Permanente', 'Obligatorio'][nv.tribunal] || '')}</div>
      <div class="grid g2" style="margin-top:12px"><div class="col">${consejo}${comisionCard}${tribunal}</div><div class="col">${parCard}${props}${s.hist.length ? `<div class="tarjeta"><h3>Crónica</h3><div class="lista">${s.hist.slice(0, 6).map(h => `<div class="it"><div class="cuerpo" style="font-size:13px">${esc(h.txt)}<div class="tenue" style="font-size:11.5px">${U.fmtT(h.t)}</div></div></div>`).join('')}</div></div>` : ''}</div></div>`;
  };

  const aranceles = E => {
    const Co = C.Comercio, c = E.comercio, M = C.Mercosur, f = Co.flujos(E);
    const filas = Co.sectores().map(s => {
      if (s.sinArancel) return `<tr><td>${s.icono} ${esc(s.nombre)}</td><td class="num">${U.d1(f.expSector[s.id])} / ${U.d1(f.impSector[s.id])}</td><td colspan="3" class="tenue">Barreras regulatorias (${pct(s.mfn)} equivalente): sólo bajan con un acuerdo comercial.</td></tr>`;
      const bloqueado = M.esMiembro(E) && !M.puedeFijarArancel(E, s.id);
      const control = bloqueado ? '<span class="tenue" style="font-size:11.5px">Fijado por el AEC</span>'
        : `<div class="fila accion-form" style="gap:6px;flex-wrap:nowrap"><select data-arg="nivel">${Co.NIVELES_ARANCEL.map(n => `<option value="${n}" ${n === Math.round(c.aranceles[s.id]) ? 'selected' : ''}>${n}%</option>`).join('')}</select>${UI.botonAccion('fijarArancel', { sector: s.id }, 'Fijar', 'chico')}</div>`;
      const tens = s.dom ? `<div class="barra-h" style="width:90px"><i style="width:${Math.round(c.tension[s.id])}%;background:${c.tension[s.id] > 70 ? 'var(--mal)' : c.tension[s.id] > 50 ? 'var(--alerta)' : 'var(--bien)'}"></i></div>` : '<span class="tenue">—</span>';
      const sg = s.dom ? (c.salvaguardias[s.id] ? `<span class="etq amar">Salvaguardia ${Math.max(0, c.salvaguardias[s.id].hasta - E.fecha.t)} sem.</span>` : UI.botonAccion('salvaguardia', { sector: s.id }, 'Salvaguardia', 'chico')) : '';
      return `<tr><td>${s.icono} ${esc(s.nombre)}</td><td class="num">${U.d1(f.expSector[s.id])} / ${U.d1(f.impSector[s.id])}</td><td class="num"><b>${U.d1(c.aranceles[s.id])}%</b>${c.recargos[s.id] ? `<span class="tenue"> +${c.recargos[s.id]}</span>` : ''}</td><td>${tens}</td><td>${control} ${sg}</td></tr>`;
    }).join('');
    return `<div class="tarjeta"><h3>Aranceles por sector</h3>
      <div class="tenue" style="font-size:12px;margin-bottom:8px">Subir un arancel protege al productor local y calma al sector, pero encarece los productos (inflación) y molesta a los socios sin acuerdo. Bajarlo abarata y abre, pero las importaciones presionan al empleo y al campo. Los socios con TLC pagan menos que este arancel general. La salvaguardia es un recargo temporal cuando las importaciones se disparan.</div>
      <table class="tabla"><thead><tr><th>Sector</th><th>Exporta / importa (mil MUSD)</th><th>Arancel general</th><th>Presión</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`;
  };

  C.Pantallas.comercio = {
    render(el, params) {
      const E = C.E, tab = (params && params.tab) || E.ui.comercioTab || 'panorama';
      E.ui.comercioTab = tab;
      const esPres = E.gobierno.presidente === 'J';
      const tabs = [['panorama', 'Panorama'], ['acuerdos', 'Acuerdos y TLC'], ['mercosur', 'Mercosur'], ['can', 'Comunidad Andina'], ['aranceles', 'Aranceles']];
      const cuerpo = { panorama, acuerdos, mercosur, can, aranceles }[tab](E);
      el.innerHTML = `<div class="cab"><div><h1>Comercio exterior</h1><div class="sub">Balanza, aranceles, acuerdos de libre comercio, Mercosur y Comunidad Andina.${esPres ? '' : ' Sólo el Presidente negocia y decide; aquí ves cómo te afecta.'}</div></div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div style="margin-top:14px">${cuerpo}</div>`;
      el.onclick = e => { const cc = e.target.closest('[data-can]'); if (cc) { E.ui.canTab = cc.dataset.can; return C.App.refrescar(); } const mm = e.target.closest('[data-mer]'); if (mm) { E.ui.merTab = mm.dataset.mer; return C.App.refrescar(); } const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('comercio', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
