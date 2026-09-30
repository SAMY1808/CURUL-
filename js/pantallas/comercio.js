/* Comercio exterior: panorama comercial, acuerdos y negociación de TLC, Mercosur y aranceles. */
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
      <div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">🏛 Directorio ${i.niv.directorio >= 2 ? `<span class="tenue" style="font-weight:400">· comisionado: ${i.comisionado && E.politicos[i.comisionado] ? esc(E.politicos[i.comisionado].nombre) : 'sin nombrar'}</span>` : ''}</h4><div class="tenue" style="font-size:12px">${esc(nivelNom('directorio', i.niv.directorio))}.${i.niv.directorio >= 2 ? ' Propone más decisiones en cada cumbre y les da más opciones de pasar.' : ' Sin un órgano propio, todo depende de la presidencia rotativa.'}</div>
        ${pres && i.niv.directorio >= 2 ? `<div class="fila accion-form" style="gap:6px;margin-top:6px"><select data-arg="pol">${C.Exterior.candidatos(E).slice(0, 12).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>${UI.botonAccion('nombrarComisionado', {}, null, 'chico')}</div>` : ''}</div>
      <div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">🏟 Parlamento</h4><div class="tenue" style="font-size:12px">${esc(nivelNom('parlamento', i.niv.parlamento))}. Legitimidad del bloque: <b>${Math.round(i.legit)}%</b>.</div>${i.parlSeats && i.niv.parlamento >= 2 ? `<div class="fila" style="gap:4px;flex-wrap:wrap;margin-top:6px">${i.parlSeats.map(x => `<span class="etq">${esc(x.sigla)} ${x.esc}</span>`).join('')}</div><div class="tenue" style="font-size:11px;margin-top:4px">Escaños de Colombia (18)</div>` : ''}</div>
      <div class="tarjeta"><h4 class="sub-h" style="margin:0 0 6px">⚖ Tribunal</h4><div class="tenue" style="font-size:12px">${esc(nivelNom('tribunal', i.niv.tribunal))}. Probabilidad de que un socio cumpla un fallo: <b>${[35, 55, 80, 95][i.niv.tribunal]}%</b>.</div></div></div>`;
    return `${miembro ? '' : '<div class="tenue" style="font-size:12px;margin-bottom:10px">Sólo los miembros plenos proponen reformas; aquí ves cómo está diseñado el bloque.</div>'}
      <div class="grid g4">${Comp.kpi('Modelo del bloque', esc(Ins.modelo(E)), `<span class="tenue">integración ${Ins.indice(E)}%</span>`)}${Comp.kpi('Parecido a la UE', par.ue + '%', `<span class="tenue">ASEAN ${par.asean}% · vacío ${par.vacio}%</span>`)}${Comp.kpi('Legitimidad', Math.round(i.legit) + '%', '<span class="tenue">la sube el parlamento</span>')}${Comp.kpi('Bono al comercio', (Ins.bonoComercio(E) >= 1 ? '+' : '') + U.d1((Ins.bonoComercio(E) - 1) * 100) + '%', '<span class="tenue">con los socios del bloque</span>')}</div>
      <div style="margin-top:14px">${tramite}${inst}</div>
      <div class="tarjeta"><h3>🧩 Modelos de bloque</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Un paquete completo de reformas para parecerse a la Unión Europea, a la ASEAN o volver a un tratado casi vacío. Los socios votan cada eje según su interés, y los cambios profundos pasan por el Congreso, la Corte y los parlamentos de los demás miembros.</div><div class="grid g3">${modelos}</div></div>
      <div class="tarjeta" style="margin-top:14px"><h3>🎛 Reformas eje por eje</h3><table class="tabla"><thead><tr><th>Eje</th><th>Hoy</th><th>Proponer</th></tr></thead><tbody>${filas}</tbody></table></div>
      ${i.hist.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Historial de reformas</h3><div class="lista">${i.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div><span class="etq ${h.ok ? 'verde' : 'rojo'}">${h.ok ? 'En vigor' : 'Cayó'}</span></div>`).join('')}</div></div>` : ''}`;
  };
  const mercosur = E => {
    const sub = E.ui.merTab || 'bloque', m = C.Mercosur.st(E);
    if (!m.existe || !C.MercosurInst) return mercosurBase(E);
    const tabs = `<div class="tabs" style="margin-bottom:12px"><button data-mer="bloque" class="${sub === 'bloque' ? 'activo' : ''}">Membresía y cumbres</button><button data-mer="inst" class="${sub === 'inst' ? 'activo' : ''}">Reforma institucional</button></div>`;
    return tabs + (sub === 'inst' ? institucional(E) : mercosurBase(E));
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
      const tabs = [['panorama', 'Panorama'], ['acuerdos', 'Acuerdos y TLC'], ['mercosur', 'Mercosur'], ['aranceles', 'Aranceles']];
      const cuerpo = { panorama, acuerdos, mercosur, aranceles }[tab](E);
      el.innerHTML = `<div class="cab"><div><h1>Comercio exterior</h1><div class="sub">Balanza, aranceles, acuerdos de libre comercio y Mercosur.${esPres ? '' : ' Sólo el Presidente negocia y decide; aquí ves cómo te afecta.'}</div></div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div style="margin-top:14px">${cuerpo}</div>`;
      el.onclick = e => { const mm = e.target.closest('[data-mer]'); if (mm) { E.ui.merTab = mm.dataset.mer; return C.App.refrescar(); } const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('comercio', { tab: t.dataset.tab }); };
    }
  };
})(window.CURUL);
