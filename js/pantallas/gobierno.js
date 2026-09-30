/* Gobierno y oposición: Centro de Gobierno, tablero económico y Centro de Oposición. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  /* Bandeja de pendientes: lo que necesita una decisión tuya hoy, en un solo vistazo, en vez de
     tener que revisar cada tarjeta del Centro de Gobierno una por una. */
  const pendientesHoy = (E) => {
    const g = E.gobierno, out = [];
    if (g.presidente !== 'J') return out;
    const ministros = Object.values(g.gabinete).map(id => E.politicos[id]).filter(Boolean);
    const conCrisis = ministros.filter(m => m.crisisActiva).length;
    const conPropuesta = ministros.filter(m => m.iniciativa && m.iniciativa.estado === 'propuesta').length;
    if (conCrisis) out.push(['⚠', `${conCrisis} ministro(s) con una crisis propia sin resolver`, 'consejo']);
    if (conPropuesta) out.push(['🗂', `${conPropuesta} ministro(s) esperan tu respaldo para una iniciativa`, 'consejo']);
    const K_ = E.constitucion;
    if (K_.referendo) out.push(['📜', `Referendo en curso: apoyo ${Math.round(K_.referendo.apoyo)}%`, 'centro']);
    if (K_.constituyente) out.push(['📜', 'Asamblea Nacional Constituyente en marcha', 'centro']);
    const conParo = C.Movilizacion.ACTORES.filter(a => C.Movilizacion.actor(E, a.id).paro).length;
    if (conParo) out.push(['📢', `${conParo} paro(s) activo(s) sin resolver`, 'social']);
    for (const gr of C.OrdenPublico.GRUPOS) {
      const st = E.ordenPublico.grupos[gr.id];
      if (st.negociacion && st.negociacion.fase === 'agenda') out.push(['🕊', `Mesa de paz con ${gr.sigla}: agenda pendiente de acordar`, 'centro']);
    }
    return out;
  };

  const viceCard = (E) => {
    const g = E.gobierno, V = C.Vice, vp = V.actual(E);
    if (!vp) return `<div class="tarjeta"><h3>Vicepresidencia</h3><div class="tenue" style="font-size:12px">Vacante: el Congreso elegirá reemplazo${g.viceVacante != null ? ' en ' + Math.max(0, g.viceVacante + 8 - E.fecha.t) + ' semanas' : ''}.</div></div>`;
    const s = V.asegurar(vp), esJ = g.presidente === 'J';
    const barras = [{ etq: 'Lealtad', v: s.lealtad, color: s.lealtad < 35 ? 'var(--mal)' : s.lealtad < 55 ? 'var(--alerta)' : 'var(--bien)' }, { etq: 'Gestión', v: s.gestion, color: 'var(--oro)' }, { etq: 'Ambición', v: vp.r.amb, color: vp.r.amb > 70 ? 'var(--alerta)' : '#8C96A3' }];
    return `<div class="tarjeta"><div class="t-cab"><h3>Vicepresidencia</h3>${s.ruptura ? '<span class="etq rojo">Ha roto con el Presidente</span>' : ''}</div>
      <div class="fila" style="flex-wrap:nowrap;cursor:pointer" data-ficha="${vp.id}">${Comp.avatar(E, vp, 52)}<div style="flex:1;min-width:0"><b>${esc(vp.nombre)}</b><div class="fila" style="gap:6px;margin-top:2px">${vp.partido ? Comp.partido(E, vp.partido, true) : '<span class="etq">Independiente</span>'}<span class="tenue" style="font-size:12px">${esc(C.DATA.departamentos.find(d => d.id === vp.depto).nombre)}</span></div></div></div>
      <div style="margin-top:8px">${G.barrasH(barras, { max: 100, fmt: v => Math.round(v), anchoEtq: '70px' })}</div>
      <div class="tenue" style="font-size:12px;margin:6px 0">Encargo: <b style="color:var(--texto)">${esc(V.ENCARGOS[s.encargo])}</b>. Si el Presidente falta, asume; con poca lealtad y mucha ambición puede romper y lanzarse por su cuenta.</div>
      ${esJ ? `<div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="encargo">${Object.entries(V.ENCARGOS).map(([k, n]) => `<option value="${k}" ${k === s.encargo ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>${UI.botonAccion('asignarEncargoVice', {}, 'Asignar', 'chico')}${UI.botonAccion('reunirConVice', {}, null, 'chico')}</div>` : ''}</div>`;
  };

  const centroGobierno = (E) => {
    const g = E.gobierno, J = E.jugador;
    const pres = g.presidente === 'J' ? E.politicos.J : E.politicos[g.presidente];
    const vice = E.politicos[g.vice];
    const est = C.Gobierno.estabilidad(E);
    const agenda = g.agenda.map(id => E.proyectos[id]).filter(Boolean).slice(-8).reverse();
    const pend = pendientesHoy(E);
    const ministros = Object.values(g.gabinete).map(id => E.politicos[id]).filter(Boolean);
    ministros.forEach(m => C.Gabinete.asegurar(m));
    const gestionProm = ministros.length ? Math.round(U.prom(ministros.map(m => m.gestion))) : 0;
    return `<div class="grid g-dash">
      <div class="col">
        ${pend.length ? `<div class="tarjeta"><h3>📋 Pendientes de hoy</h3><div class="lista">${pend.map(([i, t, tab]) => `<div class="it clic" data-ir-tab="${tab}"><span style="font-size:18px">${i}</span><div class="cuerpo" style="font-size:12.5px">${esc(t)}</div></div>`).join('')}</div></div>` : ''}
        <div class="tarjeta presidente"><div class="fila" style="flex-wrap:nowrap">${Comp.avatar(E, pres, 86)}<div style="flex:1;min-width:0"><div class="tenue" style="font-size:11px;letter-spacing:.14em">PRESIDENTE DE LA REPÚBLICA</div><h2 style="font-size:26px">${esc(pres.nombre)}</h2>
          <div class="fila">${Comp.partido(E, g.partido, true)}<span class="tenue">desde ${U.fmtT(g.desde, false)}</span></div>${vice ? `<div class="tenue" style="font-size:12px;margin-top:4px">Vicepresidencia: ${esc(vice.nombre)}</div>` : ''}</div>
          ${G.medidor(E.opinion.aprobacionPres, { tam: 130, etq: 'APROBACIÓN' })}</div>
          ${G.linea([{ nombre: 'Aprobación', color: '#D9B45A', datos: E.series.aprobacion || [] }], { alto: 130, min: 0, max: 100, ref: 50, unidad: '%', area: true })}
          <h3 style="margin-top:10px">Aprobación por tema</h3>
          ${G.barrasH(Object.entries(C.Opinion.TEMAS).map(([id, n]) => ({ etq: n, v: Math.round(E.opinion.aprobTemas[id]), color: E.opinion.aprobTemas[id] > 50 ? 'var(--bien)' : E.opinion.aprobTemas[id] > 35 ? 'var(--alerta)' : 'var(--mal)' })), { marca: 50, max: 100, fmt: v => v + '%' })}</div>
        <div class="tarjeta"><div class="t-cab"><h3>Gabinete</h3><button class="btn chico" data-ir-tab="consejo">Ver Consejo de Ministros →</button></div>
          <div class="fila" style="gap:14px;font-size:12.5px;margin-bottom:8px"><span>Gestión promedio <b class="num">${gestionProm}</b></span><span>Con crisis abierta <b class="num ${ministros.some(m => m.crisisActiva) ? 'mal' : ''}">${ministros.filter(m => m.crisisActiva).length}</b></span><span>Con iniciativa en marcha <b class="num">${ministros.filter(m => m.iniciativa && m.iniciativa.estado === 'en_curso').length}</b></span></div>
          ${g.presidente === 'J' ? `<div class="fila accion-form" style="margin-top:6px"><select data-arg="ministerio">${C.Gobierno.todosMinisterios(E).map(m => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('')}</select><select data-arg="partido"><option value="">Tecnócrata</option>${g.coalicion.map(p => `<option value="${p}">${esc(E.partidos[p].sigla)}</option>`).join('')}</select>${UI.botonAccion('cambiarMinistro', {})}${UI.botonAccion('consejoMinistros', {})}</div>
          <div class="fila accion-form" style="margin-top:8px;flex-wrap:nowrap"><input data-arg="nombre" placeholder="Nombre del nuevo ministerio (sin «Ministerio de»)" style="flex:1;min-width:0;background:var(--panel);border:1px solid var(--borde2);border-radius:8px;padding:6px 8px;color:var(--texto)">
            <select data-arg="sector">${Object.entries(C.DATA.sectores).map(([k, s]) => `<option value="${k}">${s.icono} ${esc(s.nombre)}</option>`).join('')}</select>
            <select data-arg="tamano"><option value="pequeno">Pequeño</option><option value="mediano" selected>Mediano</option><option value="grande">Grande</option></select>
            ${UI.botonAccion('proponerLeyMinisterio', {})}</div>` : ''}
          ${J.partido && E.partidos[J.partido] && E.partidos[J.partido].lider === 'J' && g.presidente !== 'J' && g.coalicion.includes(J.partido) ? `<div class="fila accion-form" style="margin-top:10px;flex-wrap:nowrap"><span class="tenue" style="font-size:12px">Como director del ${esc(E.partidos[J.partido].sigla)}, puedes exigir un ministerio para ti:</span></div>
            <div class="fila accion-form" style="margin-top:6px"><select data-arg="ministerio">${C.Gobierno.todosMinisterios(E).map(m => `<option value="${m.id}">${esc(m.nombre)}${E.politicos[g.gabinete[m.id]] && E.politicos[g.gabinete[m.id]].partido === J.partido ? ' (ya es tuyo)' : ''}</option>`).join('')}</select>${UI.botonAccion('presionarMinisterio', {})}</div>` : ''}</div>
      </div>
      <div class="col">
        ${viceCard(E)}
        <div class="tarjeta"><div class="t-cab"><h3>Coalición de gobierno</h3><span class="etq ${est.total > 60 ? 'verde' : est.total > 40 ? 'amar' : 'rojo'}">Estabilidad ${Math.round(est.total)}%</span></div>
          <div class="fila">${g.coalicion.map(p => `<span class="etq" style="background:${E.partidos[p].color}33;color:#e8edf5"><i class="pto" style="background:${E.partidos[p].color}"></i> ${esc(E.partidos[p].sigla)}</span>`).join('')}</div>
          ${est.factores.map(f => `<div class="factor"><span>${esc(f.n)}</span><div class="eje-div"><i style="${f.v >= 0 ? 'left:50%' : 'right:50%'};width:${Math.min(50, Math.abs(f.v) * 2)}%;background:${f.v >= 0 ? 'var(--bien)' : 'var(--mal)'}"></i></div><b class="num">${U.signo(f.v)}</b></div>`).join('')}
          ${g.presidente === 'J' ? `<div class="fila accion-form" style="margin-top:8px"><select data-arg="partido">${Object.values(E.partidos).filter(p => !p.especial && !g.coalicion.includes(p.id)).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>${UI.botonAccion('invitarCoalicion', {})}</div>
          <div class="fila accion-form" style="margin-top:6px"><select data-arg="partido">${Object.values(E.partidos).filter(p => !p.especial && !p.futuro).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>${UI.botonAccion('mermelada', {})}</div>` : ''}</div>
        <div class="tarjeta"><h3>Agenda legislativa del Gobierno</h3><div class="lista">${agenda.map(p => `<div class="it clic" data-proy="${p.id}"><span>${C.DATA.sectores[p.sector].icono}</span><div class="cuerpo"><b>${esc(p.titulo)}</b>${Comp.tramite(E, p, true)}</div>${Comp.estadoProyecto(p)}</div>`).join('') || '<div class="vacio">Sin proyectos radicados.</div>'}</div>
          <div class="fila" style="margin-top:8px;gap:14px;font-size:12.5px"><span>Leyes aprobadas <b class="bien">${g.leyesAprobadas || 0}</b></span><span>Proyectos hundidos <b class="mal">${g.leyesHundidas || 0}</b></span></div></div>
        <div class="tarjeta"><h3>Gobernadores por partido</h3>${G.barrasH(Object.entries(U.contar(Object.values(E.deptos), d => E.politicos[d.gobernador] ? E.politicos[d.gobernador].partido : '—')).sort((a, b) => b[1] - a[1]).map(([p, n]) => ({ etq: E.partidos[p] ? E.partidos[p].sigla : p, v: n, color: E.partidos[p] ? E.partidos[p].color : '#8C96A3', tt: g.coalicion.includes(p) ? 'Partido de gobierno' : '' })), { fmt: v => U.n(v), anchoEtq: '60px' })}</div>
        <div class="tarjeta"><h3>Orden público</h3><div class="lista">${C.OrdenPublico.GRUPOS.map(gr => {
          const st = E.ordenPublico.grupos[gr.id];
          if (!st.activo) {
            if (st.implementacion && !st.implementacion.consolidada) {
              const im = st.implementacion;
              return `<div class="it" style="display:block"><div class="cuerpo"><b>${esc(gr.sigla)}</b><span class="tenue">Paz firmada · implementación: cumplimiento ${Math.round(im.cumplimiento)}%</span></div>
                <div style="margin-top:6px">${g.presidente === 'J' ? UI.botonAccion('invertirImplementacion', { grupo: gr.id }, 'Invertir en la implementación', 'chico') : ''}</div></div>`;
            }
            return st.acuerdoPaz ? `<div class="it"><div class="cuerpo"><b>${esc(gr.sigla)}</b><span class="tenue">Paz consolidada · ${esc(gr.nombre)}</span></div><span class="etq verde">En paz</span></div>` : '';
          }
          const neg = st.negociacion;
          let negoHtml = '';
          if (neg) {
            if (neg.fase === 'cese') negoHtml = `<span class="tenue">Mesa exploratoria: falta pactar el cese al fuego</span></div>${g.presidente === 'J' ? UI.botonAccion('pactarCese', { grupo: gr.id }, 'Pactar cese al fuego', 'chico') : ''}`;
            else if (neg.fase === 'agenda') {
              const pend = C.OrdenPublico.PUNTOS.filter(p => !neg.puntos[p.id].acordado);
              negoHtml = `<span class="tenue">Agenda: ${C.OrdenPublico.PUNTOS.length - pend.length}/${C.OrdenPublico.PUNTOS.length} puntos acordados</span></div>
                ${g.presidente === 'J' && pend.length ? `<div class="fila accion-form" style="margin-top:6px"><select data-arg="punto">${pend.map(p => `<option value="${p.id}">${esc(p.nombre)} (${Math.round(neg.puntos[p.id].avance)}%)</option>`).join('')}</select>${UI.botonAccion('negociarPunto', { grupo: gr.id })}</div>` : ''}`;
            } else if (neg.fase === 'verificacion') negoHtml = `<span class="tenue">En verificación internacional del acuerdo</span></div>`;
          } else {
            negoHtml = `<span class="tenue">${esc(gr.nombre)} · presencia en ${st.control.length} departamento(s) · fuerza ${Math.round(st.fuerza)}</span></div>
              ${g.presidente === 'J' ? `${UI.botonAccion('ofensivaMilitar', { grupo: gr.id }, 'Ofensiva', 'chico peligro')}${UI.botonAccion('mesaPaz', { grupo: gr.id }, 'Abrir diálogo', 'chico')}` : ''}`;
          }
          return `<div class="it" style="display:block"><div class="cuerpo"><b>${esc(gr.sigla)}</b>${negoHtml}</div></div>`;
        }).join('') || '<div class="vacio">Sin grupos armados activos.</div>'}</div></div>
        <div class="tarjeta"><h3>Diplomacia</h3>
          <div class="tenue" style="font-size:11px;letter-spacing:.1em;margin-bottom:4px">RELACIONES DESTACADAS</div>
          ${G.barrasH(C.Diplomacia.destacados().slice(0, 8).map(p => ({ etq: p.nombre, v: Math.round(E.diplomacia.paises[p.id].relacion), color: E.diplomacia.paises[p.id].relacion > 55 ? 'var(--bien)' : E.diplomacia.paises[p.id].relacion > 35 ? 'var(--alerta)' : 'var(--mal)' })), { marca: 50, max: 100, fmt: v => v + '%', anchoEtq: '150px' })}
          <div class="tenue" style="font-size:12px;margin:8px 0">${C.Exterior.abiertas(E).length} embajadas abiertas · relación media ${Math.round(C.Exterior.relMedia(E))}%</div>
          <button class="btn chico prim" data-ir="diplomacia">🌎 Abrir Diplomacia</button></div>
        <div class="tarjeta"><h3>Constitución</h3><div class="lista">${Object.entries(C.Constitucion.ARTICULOS).map(([id, art]) => `<div class="it"><div class="cuerpo"><b>${esc(art.nombre)}</b><span class="tenue">Vigente: ${esc(art.etiqueta(C.Constitucion.valor(E, id)))}</span></div></div>`).join('')}</div>
          ${(() => {
            const K_ = E.constitucion;
            if (K_.referendo && K_.referendo.apoyo != null) {
              const art = C.Constitucion.ARTICULOS[K_.referendo.articulo];
              return `<div class="tenue" style="margin-top:8px">Referendo en curso: ${esc(art.nombre)} → ${esc(art.etiqueta(K_.referendo.valor))} · apoyo ${Math.round(K_.referendo.apoyo)}%</div>`;
            }
            if (K_.constituyente) {
              const c = K_.constituyente;
              const fases = { eleccion: 'Elección de constituyentes', redaccion: 'Redacción del texto', ratificacion: 'Referendo de ratificación' };
              return `<div class="tenue" style="margin-top:8px">Asamblea Constituyente: ${esc(fases[c.fase])}${c.fase === 'ratificacion' ? ` · apoyo ${Math.round(c.apoyo)}%` : ''}${c.propuestas.length ? ' · paquete: ' + c.propuestas.map(p => esc(C.Constitucion.ARTICULOS[p.articulo].nombre)).join(', ') : ''}</div>
                ${g.presidente === 'J' && c.fase === 'redaccion' ? `<div class="fila accion-form" style="margin-top:6px"><select data-arg="articulo">${Object.entries(C.Constitucion.ARTICULOS).map(([id, a]) => `<option value="${id}">${esc(a.nombre)}</option>`).join('')}</select><select data-arg="valor">${Object.values(C.Constitucion.ARTICULOS).flatMap(a => a.valores).filter((v, i, arr) => arr.indexOf(v) === i).map(v => `<option value="${v}">${esc(String(v))}</option>`).join('')}</select>${UI.botonAccion('proponerArticuloConstituyente', {})}</div>` : ''}`;
            }
            return `<div class="tenue" style="margin-top:8px;font-size:12px">Las reformas se tramitan por democracia directa: referendo constitucional, iniciativa popular o Constituyente.</div><div class="fila" style="margin-top:6px"><button class="btn chico prim" data-ir="participacion">🗳 Ir a Democracia directa</button></div>`;
          })()}</div>
          ${(() => {
            const auto = C.Constitucion.valor(E, 'autonomiaTerritorial');
            if (auto === 'federal') return `<div class="tenue" style="margin-top:10px">Colombia es un Estado federal: las seis competencias regionales ya fueron transferidas.</div>`;
            if (auto !== 'descentralizada') return '';
            const f = E.federalizacion;
            if (!f) return g.presidente === 'J' ? `<div style="margin-top:10px">${UI.botonAccion('iniciarFederalizacion', {}, 'Iniciar la federalización')}</div>` : '';
            const pend = Object.entries(f.competencias).filter(([, c]) => !c.transferida);
            return `<div class="tenue" style="margin-top:10px">Federalización en curso: ${Object.keys(f.competencias).length - pend.length}/${Object.keys(f.competencias).length} competencias transferidas</div>
              ${g.presidente === 'J' && pend.length ? `<div class="fila accion-form" style="margin-top:6px"><select data-arg="competencia">${pend.map(([id]) => `<option value="${id}">${esc(C.Federalizacion.COMPETENCIAS[id])}</option>`).join('')}</select>${UI.botonAccion('transferirCompetencia', {})}</div>` : ''}`;
          })()}</div>
      </div></div>`;
  };

  const economia = (E) => {
    const Ev = E.economia, S = E.series, V = C.Economia.VARS;
    const tarjeta = (k, color, ref) => `<div class="tarjeta"><div class="t-cab"><h3>${esc(V[k].n)}</h3>${Comp.delta(S['eco:' + k], 12, V[k].bueno < 0)}</div><div class="kpi"><span class="v">${U.d1(Ev[k])}<small style="font-size:14px" class="tenue"> ${V[k].u}</small></span></div>${G.linea([{ nombre: V[k].n, color, datos: S['eco:' + k] || [] }], { alto: 110, ref, unidad: ' ' + V[k].u })}</div>`;
    const pend = Ev.pendientes.filter(p => p.t1 > E.fecha.t);
    const porVar = U.agrupar(pend, p => p.v);
    return `<div class="grid g4">
        ${tarjeta('crecimiento', '#6CC4F5', 0)}${tarjeta('inflacion', '#E8812A', 3)}${tarjeta('desempleo', '#E0559A')}${tarjeta('pobreza', '#A15BD1')}
        ${tarjeta('deficit', '#C0504D')}${tarjeta('deuda', '#B07A45')}${tarjeta('tasa', '#D1A824')}${tarjeta('inversion', '#5DB85A')}</div>
      <div class="grid g2" style="margin-top:14px">
        <div class="tarjeta"><h3>Efectos de política en camino</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Leyes sancionadas cuyos efectos aún no se sienten del todo (inmediatos, de mediano y de largo plazo).</div>
          ${Object.keys(porVar).length ? G.barrasV(Object.entries(porVar).map(([v, arr]) => { const tot = U.suma(arr.map(p => p.d * U.clamp((p.t1 - Math.max(E.fecha.t, p.t0)) / (p.t1 - p.t0 + 1), 0, 1))); return { etq: (V[v] || { n: v }).n.split(' ')[0], v: tot, color: tot > 0 === ((V[v] || {}).bueno !== -1) ? 'var(--bien)' : 'var(--mal)', tt: `<b>${esc((V[v] || { n: v }).n)}</b>: ${U.signo(tot, 2)} pendiente · ${arr.length} medidas` }; }), { alto: 170, valores: true, fmt: v => U.signo(v, 1) }) : '<div class="vacio">No hay efectos pendientes.</div>'}</div>
        <div class="tarjeta"><h3>Cuentas nacionales</h3>
          <div class="tt-f"><span class="tenue">PIB nominal</span><b>$${U.n(Ev.pib)} billones</b></div>
          <div class="tt-f"><span class="tenue">Exportaciones</span><b>US$${U.d1(Ev.exportaciones)} mil millones</b></div>
          <div class="tt-f"><span class="tenue">Confianza institucional</span><b>${U.d1(Ev.confianza)}/100</b></div>
          <div class="tt-f"><span class="tenue">Recaudo tributario</span><b>${U.d1(Ev.recaudo)} % del PIB</b></div>
          <div class="tt-f"><span class="tenue">Gasto público</span><b>${U.d1(Ev.gasto)} % del PIB</b></div>
          ${G.linea([{ nombre: 'Déficit', color: '#C0504D', datos: S['eco:deficit'] || [] }, { nombre: 'Crecimiento', color: '#6CC4F5', datos: S['eco:crecimiento'] || [] }], { alto: 140, unidad: ' %' })}
          <p class="tenue" style="font-size:12px">El Banco de la República ajusta la tasa según la inflación (meta del 3 %). La regla fiscal presiona el déficit hacia su nivel estructural.</p></div>
      </div>`;
  };

  const oposicion = (E) => {
    const g = E.gobierno, J = E.jugador;
    const opos = Object.values(E.partidos).filter(p => p.postura === 'oposicion');
    const cs = C.Congreso.composicion(E, 'senado'), cc = C.Congreso.composicion(E, 'camara');
    const escandalos = E.eventos.historial.filter(e => ['escándalo', 'gobierno'].includes(e.tipo)).slice(0, 6);
    const ministros = C.Gobierno.todosMinisterios(E).map(mi => ({ mi, m: E.politicos[g.gabinete[mi.id]] })).filter(x => x.m).sort((a, b) => (a.m.aprob || 50) - (b.m.aprob || 50));
    const gobProy = g.agenda.map(id => E.proyectos[id]).filter(p => p && p.estado === 'tramite');
    const esCong = !!J.camara;
    const oportunidades = [];
    if (E.opinion.aprobacionPres < 45) oportunidades.push(['📉', 'La aprobación del Gobierno está por debajo del 45 %: los ataques tienen eco.']);
    if (ministros[0] && (ministros[0].m.aprob || 50) < 40) oportunidades.push(['🎯', `El ministro de ${ministros[0].mi.nombre} es el eslabón débil del gabinete.`]);
    if (E.economia.inflacion > 5) oportunidades.push(['🛒', 'La inflación golpea el bolsillo: tema ideal para control político a Hacienda.']);
    if (Object.values(E.deptos).some(d => d.seguridad < 35)) oportunidades.push(['🚨', 'Hay departamentos en crisis de seguridad: cita al ministro de Defensa.']);
    if (gobProy.some(p => { const pr = C.Legislacion.camaraDeEtapa(p) ? C.Legislacion.proyectar(E, p) : null; return pr && pr.distancia > 0; })) oportunidades.push(['🧱', 'Algunos proyectos del Gobierno no tienen los votos: puedes hundirlos.']);
    return `<div class="grid g4">
        <div class="tarjeta">${Comp.kpi('Desaprobación del Gobierno', U.n(100 - E.opinion.aprobacionPres) + '%', Comp.delta(E.series.aprobacion, 4, true))}</div>
        <div class="tarjeta">${Comp.kpi('Oposición en Senado', cs.porPostura.oposicion + '/' + cs.total, `Con independientes: ${cs.porPostura.oposicion + cs.porPostura.independiente}`)}</div>
        <div class="tarjeta">${Comp.kpi('Oposición en Cámara', cc.porPostura.oposicion + '/' + cc.total, `Con independientes: ${cc.porPostura.oposicion + cc.porPostura.independiente}`)}</div>
        <div class="tarjeta">${Comp.kpi('Estabilidad coalición', Math.round(C.Gobierno.estabilidad(E).total) + '%', 'Más baja = más oportunidades')}</div></div>
      <div class="grid g3" style="margin-top:14px">
        <div class="tarjeta"><h3>Control político ${esCong ? '' : '<span class="etq">sólo congresistas</span>'}</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Ministros ordenados de más débil a más fuerte.</div>
          <div class="lista">${ministros.slice(0, 8).map(({ mi, m }) => `<div class="it"><span data-ficha="${m.id}" style="cursor:pointer">${Comp.avatar(E, m, 30)}</span><div class="cuerpo"><b>${esc(mi.nombre)}</b><span>${esc(m.nombre)} · imagen ${Math.round(m.aprob || 50)} %</span></div><div class="fila" style="gap:4px">${UI.botonAccion('controlPolitico', { ministerio: mi.id }, 'Citar', 'chico')}${UI.botonAccion('mocionCensura', { ministerio: mi.id }, 'Censura', 'chico')}</div></div>`).join('')}</div></div>
        <div class="tarjeta"><h3>Oportunidades políticas</h3><div class="lista">${oportunidades.map(([i, t]) => `<div class="it"><span style="font-size:18px">${i}</span><div class="cuerpo" style="font-size:12.5px">${esc(t)}</div></div>`).join('') || '<div class="vacio">El Gobierno atraviesa un buen momento.</div>'}</div>
          <h3 style="margin-top:12px">Escándalos y crisis recientes</h3><div class="lista">${escandalos.map(e => `<div class="it"><span>${e.icono}</span><div class="cuerpo"><b style="white-space:normal;font-size:12.5px">${esc(e.titulo)}</b><span>${U.fmtT(e.t)}</span></div></div>`).join('') || '<div class="vacio">Sin escándalos recientes.</div>'}</div></div>
        <div class="tarjeta"><h3>Proyectos del Gobierno en discusión</h3><div class="lista">${gobProy.map(p => { const pr = C.Legislacion.camaraDeEtapa(p) && (C.Legislacion.infoEtapa(p) || {}).instancia ? C.Legislacion.proyectar(E, p) : null; return `<div class="it clic" data-proy="${p.id}"><div class="cuerpo"><b style="font-size:12.5px">${esc(p.titulo)}</b><span>${esc((C.Legislacion.infoEtapa(p) || {}).nombre || '')}</span></div>${pr ? `<span class="etq ${pr.distancia > 0 ? 'verde' : 'rojo'}"${UI.tt('Si faltan votos, la oposición puede hundirlo')}>${pr.distancia > 0 ? 'Vulnerable (−' + pr.distancia + ')' : 'Tiene votos'}</span>` : ''}</div>`; }).join('') || '<div class="vacio">Sin proyectos en trámite.</div>'}</div>
          <h3 style="margin-top:12px">Aliados en la oposición</h3><div class="fila">${opos.map(p => `<span class="etq"><i class="pto" style="background:${p.color}"></i> ${esc(p.sigla)} · ${Comp.relacion(p.relJ)}</span>`).join('') || '<span class="tenue">Nadie se declara en oposición.</span>'}</div>
          <div class="fila" style="margin-top:10px">${UI.botonAccion('ruedaPrensa', {}, 'Denunciar en rueda de prensa')}</div></div>
      </div>`;
  };

  /* ── Presupuesto General de la Nación ── */
  const bill = v => '$' + U.d1(v) + ' billones';
  const presupuesto = (E) => {
    const Pr = E.presupuesto, g = E.gobierno;
    const editable = g.presidente === 'J' && !Pr.enTramite;
    const pib = E.economia.pib, vig = Pr.vigente;
    const shares = editable ? Pr.propuesta : vig.shares;
    const gastoPct = editable ? Pr.gastoPct : vig.gastoPct;
    const gastoBill = pib * gastoPct / 100, ingresosBill = pib * E.economia.recaudo / 100;
    const deficitPct = gastoPct - E.economia.recaudo;
    const tramiteProy = Pr.proyectoId ? E.proyectos[Pr.proyectoId] : null;
    const nombreCorto = n => n.split(',')[0].split(' y ')[0];
    const asignado = m => pib * gastoPct / 100 * (shares[m.id] || 0) / 100;
    return `<div class="grid g4">
        ${Comp.kpi('Gasto público', U.d1(gastoPct) + '% del PIB', bill(gastoBill))}
        ${Comp.kpi('Ingresos (recaudo)', U.d1(E.economia.recaudo) + '% del PIB', bill(ingresosBill))}
        ${Comp.kpi('Déficit resultante', U.signo(deficitPct, 1) + ' pp', deficitPct > 4 ? '<span class="mal">requiere financiación</span>' : '<span class="bien">manejable</span>')}
        ${Comp.kpi('Estado', tramiteProy ? 'En trámite' : `Formulando ${Pr.anio}`, tramiteProy ? esc(tramiteProy.numero) : (editable ? 'puedes ajustarlo abajo' : 'lo define el Gobierno'))}</div>
      ${editable ? `<div class="tarjeta" style="margin-top:14px"><div class="t-cab"><h3>Gasto público total</h3><button class="btn chico" id="pres-reset">↺ Restablecer al vigente</button></div>
          <input type="range" id="pres-gasto" min="15" max="29" step="0.1" value="${gastoPct.toFixed(1)}">
          <div class="fila" style="justify-content:space-between;font-size:12px;color:var(--tenue)"><span>15 % · austero</span><span><b style="color:var(--oro2);font-size:14px">${U.d1(gastoPct)} %</b> del PIB</span><span>29 % · expansivo</span></div>
          <p class="tenue" style="font-size:12px;margin-bottom:0">Más gasto social reduce pobreza y desempleo, pero si supera el recaudo dispara el déficit. Se radica como proyecto de ley el 20 de julio y sigue el trámite normal en el Congreso; si no se aprueba a tiempo, rige igual por mandato constitucional.</p></div>`
        : `<div class="tarjeta" style="margin-top:14px">${tramiteProy ? `<p style="margin:0">El Presupuesto ${Pr.anio > tramiteProy ? Pr.anio : vig.anio + 1} está en trámite (<b>${esc(tramiteProy.numero)}</b>) con la propuesta del Gobierno.</p><button class="btn chico" data-proy="${tramiteProy.id}" style="margin-top:8px">📜 Ver expediente</button>` : `<p class="tenue" style="margin:0">Sólo el Presidente formula el presupuesto. Esta es la propuesta que el Gobierno prepara según su ideología, lista para radicarse en julio.</p>`}</div>`}
      <div class="tarjeta" style="margin-top:14px"><h3>Participación por ministerio${editable ? ' (tu propuesta)' : ' (vigente)'}</h3>
        ${G.barrasH(C.Gobierno.todosMinisterios(E).map(m => ({ etq: nombreCorto(m.nombre), v: shares[m.id] || 0, color: C.Presupuesto.underfunded(E, m.id) ? 'var(--mal)' : 'var(--oro)', tt: `<b>${esc(m.nombre)}</b>: ${U.d1(shares[m.id] || 0)} % · ${bill(asignado(m))}` })).sort((a, b) => b.v - a.v), { max: 22, fmt: v => U.d1(v) + '%', anchoEtq: '150px' })}</div>
      <div class="grid g3" style="margin-top:14px">${C.Gobierno.todosMinisterios(E).map(m => {
        const under = C.Presupuesto.underfunded(E, m.id); const pol = E.politicos[g.gabinete[m.id]];
        const pct = shares[m.id] || 0, base = Pr.pesoBase[m.id];
        return `<div class="tarjeta min-presu ${under ? 'bajo' : ''}"><div class="t-cab"><h3>${esc(m.nombre)}</h3>${under ? '<span class="etq rojo">Subfinanciado</span>' : ''}</div>
          <div class="kpi-fila"><div class="kpi"><span class="v">${U.d1(pct)}%</span><span class="l">del presupuesto</span></div><div class="kpi" style="text-align:right"><span class="v" style="font-size:18px">${bill(asignado(m))}</span><span class="l">al año</span></div></div>
          ${editable ? `<input type="range" min="0.4" max="${Math.min(38, Math.max(8, base * 3))}" step="0.2" value="${pct.toFixed(1)}" data-share="${m.id}" style="margin-top:6px">` : `<div class="barra-h" style="margin-top:8px"><i style="width:${Math.min(100, pct / (base * 2) * 100)}%;background:${under ? 'var(--mal)' : 'var(--oro)'}"></i></div>`}
          <div class="fila" style="gap:5px;margin-top:8px">${(m.programas || []).map(p => `<span class="etq">${esc(p)}</span>`).join('')}</div>
          ${pol ? `<div class="fila" style="margin-top:8px;align-items:center;gap:6px"><span data-ficha="${pol.id}" style="cursor:pointer">${Comp.avatar(E, pol, 26)}</span><span class="tenue" style="font-size:11.5px">${esc(C.Politicos.nombreCorto(pol))} · imagen <b class="num" style="color:var(--texto)">${Math.round(pol.aprob || 50)}%</b></span></div>` : ''}
        </div>`;
      }).join('')}</div>
      <div class="tarjeta" style="margin-top:14px"><h3>Historia del presupuesto</h3>${Pr.historial.length ? `<table class="tabla"><thead><tr><th>Año</th><th>Gasto</th><th>Ingresos</th><th>Déficit resultante</th></tr></thead><tbody>${Pr.historial.slice().reverse().map(h => `<tr><td>${h.anio}</td><td class="num">${U.d1(h.gastoPct)}%</td><td class="num">${U.d1(h.ingresosPct)}%</td><td class="num ${h.gastoPct - h.ingresosPct > 4 ? 'mal' : 'bien'}">${U.signo(h.gastoPct - h.ingresosPct, 1)} pp</td></tr>`).join('')}</tbody></table>` : '<div class="vacio">Aún no se ha cerrado un ciclo presupuestal completo.</div>'}</div>`;
  };

  /* Consejo de ministros: gestión, iniciativas propuestas o en marcha (basadas en los programas
     propios de cada ministerio) y crisis personales de cada ministro — el detalle que antes vivía
     apretado dentro del Centro de Gobierno. */
  const consejoMinistros = (E) => {
    const g = E.gobierno, esPres = g.presidente === 'J';
    return `<div class="sub" style="margin:-4px 0 12px">Cada ministro gestiona su cartera por su cuenta: propone iniciativas de su sector, las saca adelante o no según su gestión, y puede protagonizar sus propias crisis.</div>
      <div class="grid g3">${C.Gobierno.todosMinisterios(E).map(mi => {
        const m = E.politicos[g.gabinete[mi.id]]; if (!m) return '';
        C.Gabinete.asegurar(m);
        const gestionColor = m.gestion > 65 ? 'var(--bien)' : m.gestion > 40 ? 'var(--alerta)' : 'var(--mal)';
        let cuerpo;
        if (m.crisisActiva) {
          cuerpo = `<div style="font-size:12px;margin-top:8px" class="mal">⚠ ${esc(m.crisisActiva.motivo)}${m.crisisActiva.grave ? ' · <b>caso grave</b>' : ''}</div>
            ${esPres ? `<div class="fila" style="margin-top:6px;gap:6px">${UI.botonAccion('respaldarMinistroCrisis', { ministerio: mi.id }, 'Respaldar', 'chico')}${UI.botonAccion('destituirMinistroCrisis', { ministerio: mi.id }, 'Destituir', 'chico peligro')}</div>` : ''}`;
        } else if (m.iniciativa && m.iniciativa.estado === 'propuesta') {
          cuerpo = `<div class="tenue" style="font-size:12px;margin-top:8px">Propone impulsar: <b style="color:var(--texto)">${esc(m.iniciativa.programa)}</b></div>
            ${esPres ? `<div class="fila" style="margin-top:6px;gap:6px">${UI.botonAccion('aceptarIniciativaMinistro', { ministerio: mi.id }, 'Respaldar', 'chico')}${UI.botonAccion('rechazarIniciativaMinistro', { ministerio: mi.id }, 'Rechazar', 'chico')}</div>` : ''}`;
        } else if (m.iniciativa && m.iniciativa.estado === 'en_curso') {
          const pct = Math.round((1 - m.iniciativa.semanas / m.iniciativa.semanasTot) * 100);
          cuerpo = `<div class="tenue" style="font-size:12px;margin-top:8px">En marcha: <b style="color:var(--texto)">${esc(m.iniciativa.programa)}</b> · ${m.iniciativa.semanas} sem. restantes</div>
            <div class="barra-h" style="margin-top:5px"><i style="width:${pct}%;background:var(--oro)"></i></div>`;
        } else {
          cuerpo = `<div class="tenue" style="font-size:12px;margin-top:8px">Sin iniciativas en marcha por ahora.</div>`;
        }
        return `<div class="tarjeta"><div class="fila" style="flex-wrap:nowrap;align-items:center;gap:8px">${Comp.avatar(E, m, 40)}<div style="flex:1;min-width:0" data-ficha="${m.id}" class="clic"><b>${esc(m.nombre)}</b><div class="tenue" style="font-size:11.5px">${esc(mi.nombre)}${m.partido && E.partidos[m.partido] ? ' · ' + esc(E.partidos[m.partido].sigla) : ' · Tecnócrata'}</div></div></div>
          <div class="fila" style="margin-top:8px;gap:14px;font-size:11.5px">
            <span>Gestión <b class="num" style="color:${gestionColor}">${Math.round(m.gestion)}</b></span>
            <span>Imagen <b class="num">${Math.round(m.aprob || 50)}%</b></span>
            <span>Logros <b class="num">${m.logros || 0}</b></span>
          </div>
          ${cuerpo}</div>`;
      }).join('')}</div>`;
  };

  /* Movilización social: actores sociales permanentes con su propio descontento; si estalla un
     paro, el presidente puede dialogar, atender el pliego por completo o dispersarlo por la
     fuerza (con riesgo real de que se le vaya la mano). */
  const movilizacionSocial = (E) => {
    const M = C.Movilizacion, esPres = E.gobierno.presidente === 'J';
    return `<div class="sub" style="margin:-4px 0 12px">Cada actor social acumula descontento según indicadores reales del país; si nadie lo atiende, puede convocar un paro con un pliego concreto.</div>
      <div class="grid g3">${M.ACTORES.map(a => {
        const st = M.actor(E, a.id);
        const color = st.descontento > 70 ? 'var(--mal)' : st.descontento > 40 ? 'var(--alerta)' : 'var(--bien)';
        return `<div class="tarjeta"><h3>${esc(a.nombre)} <span class="tenue" style="font-size:12px">${esc(a.sigla)}</span></h3>
          <div class="tenue" style="font-size:12px;margin-bottom:6px">Le preocupa ${esc(a.causa)}.</div>
          <div class="fila" style="gap:14px;font-size:11.5px;margin-bottom:6px"><span>Descontento <b class="num" style="color:${color}">${Math.round(st.descontento)}</b></span><span>Relación <b class="num">${Comp.relacion(st.relJ)}</b></span></div>
          <div class="barra-h"><i style="width:${Math.round(st.descontento)}%;background:${color}"></i></div>
          ${st.paro ? `<div class="mal" style="font-size:12px;margin-top:8px">⚠ Paro activo: exige ${esc(M.PLIEGOS[a.id])} (intensidad ${st.paro.intensidad.toFixed(1)})</div>
            ${esPres ? `<div class="fila" style="margin-top:6px;gap:6px;flex-wrap:wrap">${UI.botonAccion('dialogarMovimiento', { actor: a.id }, 'Dialogar', 'chico')}${UI.botonAccion('atenderPliegoMovimiento', { actor: a.id }, 'Atender pliego', 'chico')}${UI.botonAccion('reprimirMovimiento', { actor: a.id }, 'Dispersar', 'chico peligro')}</div>` : '<div class="tenue" style="font-size:11.5px;margin-top:6px">Sólo el presidente puede responder.</div>'}`
          : '<div class="tenue" style="font-size:11.5px;margin-top:8px">En calma por ahora.</div>'}</div>`;
      }).join('')}</div>`;
  };

  C.Pantallas.gobierno = {
    render(el, params) {
      const E = C.E;
      const tab = params.tab || E.ui.tabGob || 'centro';
      E.ui.tabGob = tab;
      const tabs = [['centro', '🦅 Centro de Gobierno'], ['consejo', '🪑 Consejo de Ministros'], ['social', '📢 Movilización social'], ['presupuesto', '💰 Presupuesto'], ['economia', '📈 Economía'], ['oposicion', '⚔ Centro de Oposición']];
      const titulos = { oposicion: 'Centro de Oposición', economia: 'Economía nacional', presupuesto: 'Presupuesto General de la Nación', centro: 'Centro de Gobierno', consejo: 'Consejo de Ministros', social: 'Movilización social' };
      el.innerHTML = `<div class="cab"><div><h1>${titulos[tab]}</h1><div class="sub">Casa de Nariño · ${esc(E.partidos[E.gobierno.partido] ? E.partidos[E.gobierno.partido].nombre : '')}</div></div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>
        ${tab === 'centro' ? centroGobierno(E) : tab === 'consejo' ? consejoMinistros(E) : tab === 'social' ? movilizacionSocial(E) : tab === 'presupuesto' ? presupuesto(E) : tab === 'economia' ? economia(E) : oposicion(E)}`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('gobierno', { tab: t.dataset.tab });
        const irP = e.target.closest('[data-ir]'); if (irP) return C.App.ir(irP.dataset.ir);
        const irTab = e.target.closest('[data-ir-tab]'); if (irTab) return C.App.ir('gobierno', { tab: irTab.dataset.irTab });
        const f = e.target.closest('[data-ficha]'); if (f) return Comp.fichaPolitico(E, f.dataset.ficha);
        const p = e.target.closest('[data-proy]'); if (p) return C.Pantallas.proyectos.expediente(p.dataset.proy);
        if (e.target.closest('#pres-reset')) { C.Presupuesto.restablecer(E); return C.App.refrescar(); }
      };
      el.onchange = e => {
        if (e.target.id === 'pres-gasto') { C.Presupuesto.setGastoPct(E, +e.target.value); return C.App.refrescar(); }
        if (e.target.dataset.share) { C.Presupuesto.setShare(E, e.target.dataset.share, +e.target.value); return C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
