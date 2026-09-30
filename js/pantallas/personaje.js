/* Mi carrera: perfil, reputación, imagen por segmentos, finanzas, familia, árbol de carrera e historial. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  /* Árbol de carrera: rutas electorales y no electorales */
  const NODOS = {
    ciudadano: [0, 2, 'Ciudadano'],
    lider: [1, 0, 'Líder comunitario'], activista: [1, 1, 'Activista'], academico: [1, 2, 'Académico'], periodista: [1, 3, 'Periodista'], asesor: [1, 4, 'Asesor'],
    empresario: [1, 5, 'Empresario'], sindicalista: [1, 6, 'Sindicalista'], ong: [1, 7, 'ONG'],
    concejal: [2, 1.5, 'Concejal'], diputado: [2, 3.5, 'Diputado'],
    alcalde: [3, 1, 'Alcalde'], representante: [3, 3, 'Representante'], ministro: [3, 5.5, 'Ministro'],
    gobernador: [4, 1.5, 'Gobernador'], senador: [4, 3.5, 'Senador'],
    presidente: [5, 3, 'Presidente']
  };
  const ARISTAS = [['ciudadano', 'lider'], ['ciudadano', 'activista'], ['ciudadano', 'academico'], ['ciudadano', 'periodista'], ['ciudadano', 'asesor'], ['ciudadano', 'empresario'], ['ciudadano', 'sindicalista'], ['ciudadano', 'ong'],
    ['lider', 'concejal'], ['activista', 'concejal'], ['activista', 'diputado'], ['sindicalista', 'representante'], ['periodista', 'representante'], ['periodista', 'senador'], ['academico', 'ministro'], ['asesor', 'ministro'], ['asesor', 'representante'], ['empresario', 'alcalde'], ['ong', 'diputado'], ['empresario', 'ministro'],
    ['concejal', 'alcalde'], ['concejal', 'representante'], ['diputado', 'representante'], ['diputado', 'gobernador'],
    ['alcalde', 'gobernador'], ['representante', 'senador'], ['representante', 'ministro'], ['ministro', 'presidente'], ['gobernador', 'presidente'], ['senador', 'presidente'], ['senador', 'ministro'], ['alcalde', 'presidente']];

  const arbol = (E) => {
    const J = E.jugador, oc = new Set(J.ocupados || [J.cargo]);
    const W = 760, H = 330, x = c => 60 + c * (W - 120) / 5, y = f => 26 + f * (H - 52) / 7;
    let s = `<svg class="graf arbol" viewBox="0 0 ${W} ${H}">`;
    for (const [a, b] of ARISTAS) { const A = NODOS[a], B = NODOS[b]; const act = oc.has(a) && oc.has(b); s += `<path d="M${x(A[0])},${y(A[1])} C${x(A[0]) + 50},${y(A[1])} ${x(B[0]) - 50},${y(B[1])} ${x(B[0])},${y(B[1])}" fill="none" stroke="${act ? '#D9B45A' : '#243452'}" stroke-width="${act ? 2.5 : 1.2}"/>`; }
    for (const [k, [c, f, n]] of Object.entries(NODOS)) {
      const act = J.cargo === k, fue = oc.has(k);
      s += `<g${UI.tt(esc(n) + (act ? ' · cargo actual' : fue ? ' · ya ocupado' : ''))}><rect x="${x(c) - 50}" y="${y(f) - 13}" width="100" height="26" rx="13" fill="${act ? '#D9B45A' : fue ? '#3b3320' : '#121D30'}" stroke="${act || fue ? '#D9B45A' : '#2c3e60'}"/><text x="${x(c)}" y="${y(f) + 4}" text-anchor="middle" style="fill:${act ? '#1A1405' : fue ? '#F0D48A' : '#8392AA'};font-size:11px;font-weight:${act ? 700 : 500}">${esc(n)}</text></g>`;
    }
    return s + '</svg>';
  };

  const escenarioHTML = E => {
    const sc = E.escenario, d = sc && C.Escenarios.def(sc.id); if (!d) return '';
    return `<div class="tarjeta" style="margin-top:14px;border-left:4px solid var(--oro)"><h3>${d.icono} Escenario · ${esc(d.nombre)}</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">${esc(d.desc)}</div>
      <div class="lista">${sc.objetivos.map((o, i) => `<div class="it"><span style="font-size:18px">${o.estado === 'cumplido' ? '✅' : o.estado === 'fallido' ? '❌' : '🎯'}</span><div class="cuerpo"><b style="white-space:normal">${esc(d.objetivos[i].txt)}</b><span>${o.estado === 'pendiente' ? 'plazo: ' + d.objetivos[i].hasta : o.estado === 'cumplido' ? 'cumplido ' + esc(U.fmtT(o.t)) : 'fallido'}</span></div></div>`).join('')}</div></div>`;
  };
  const saludLegadoHTML = E => {
    const J = E.jugador, Sa = C.Salud.asegurar(J), L = C.Legado, l = L.asegurar(J), pts = L.puntos(E);
    const col = v => v >= 60 ? 'var(--si)' : v >= 35 ? 'var(--alerta)' : 'var(--no)';
    return `<div class="grid g2" style="margin-top:14px">
      <div class="tarjeta"><h3>🩺 Salud y bienestar</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">El desgaste del cargo, las campañas y los escándalos pasa factura. Con poca salud o poco ánimo rindes menos puntos de agenda cada semana.</div>
        ${G.barrasH([{ etq: 'Salud', v: J.salud, color: col(J.salud) }, { etq: 'Bienestar', v: J.bienestar, color: col(J.bienestar) }], { max: 100, fmt: v => Math.round(v) + '', anchoEtq: '80px' })}
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px">${UI.botonAccion('descansarSalud', {}, null, 'chico')}${UI.botonAccion('chequeoMedico', {}, null, 'chico')}${UI.botonAccion('tomarVacaciones', {}, null, 'chico')}</div></div>
      <div class="tarjeta"><h3>🏛 Legado · ${esc(L.titulo(pts))}</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">${pts} puntos: suman leyes, cargos, elecciones, fundaciones, libros y aprobación como Presidente; restan los escándalos.</div>
        <div class="lista">${l.fundaciones.map(f => `<div class="it"><span>${L.CAUSAS[f.causa].icono}</span><div class="cuerpo"><b>Fundación · ${esc(L.CAUSAS[f.causa].n)}</b><span>nivel ${f.nivel}/5</span></div>${f.nivel < 5 ? UI.botonAccion('aportarFundacion', { causa: f.causa }, 'Aportar ' + U.cop(100 * f.nivel), 'chico') : ''}</div>`).join('')}
          ${l.libros.map(x => `<div class="it"><span>📖</span><div class="cuerpo"><b>${esc(L.LIBROS[x.tema])}</b><span>publicado ${esc(U.fmtT(x.t))}</span></div></div>`).join('')}
          ${l.enCurso ? `<div class="it"><span>✍</span><div class="cuerpo"><b>Escribiendo: ${esc(L.LIBROS[l.enCurso.tema])}</b><span>saldrá en ${Math.max(0, 12 - (E.fecha.t - l.enCurso.t0))} semanas</span></div></div>` : ''}</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:8px"><select data-arg="causa">${Object.entries(L.CAUSAS).map(([k, c]) => `<option value="${k}">${c.icono} ${esc(c.n)}</option>`).join('')}</select>${UI.botonAccion('crearFundacion', {}, 'Crear fundación ($250 M)', 'chico')}</div>
        <div class="fila accion-form" style="gap:6px;flex-wrap:wrap;margin-top:6px"><select data-arg="tema">${Object.entries(L.LIBROS).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>${UI.botonAccion('escribirLibro', {}, null, 'chico')}</div></div></div>`;
  };
  const familiaHTML = E => {
    const J = E.jugador, F = C.Familia; F.asegurarDatos(E);
    const par = F.pareja(E), din = F.dinastiaResumen(E), aspiraOpts = (lista) => lista.map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
    const cargoTxt = p => p.cargo ? (p.cargo.tipo === 'aspirante' ? 'Aspirante' : (C.Politicos.etiquetaCargo ? C.Politicos.etiquetaCargo(E, p) : p.cargo.tipo)) : '—';
    const parejaHTML = par ? `<div class="tarjeta" style="padding:10px"><div class="fila"><span style="font-size:22px">💞</span><div><b>${esc(par.nombre)}</b><div class="tenue" style="font-size:12px">Pareja · ${par.edad} años · ${esc(par.profesion)}${par.tipo && F.TIPOS_PAREJA[par.tipo] ? ' · ' + esc(F.TIPOS_PAREJA[par.tipo].n.toLowerCase()) : ''}</div></div></div>
        <div class="tt-f" style="margin-top:6px"><span class="tenue">Relación contigo</span><b>${Math.round(par.relacion)}/100</b></div><div class="tt-f"><span class="tenue">Papel</span><b>${esc(F.PAPELES[par.papel].n)}</b></div>
        ${par.politicoId && E.politicos[par.politicoId] ? `<div class="tt-f"><span class="tenue">En política</span><b>${esc(cargoTxt(E.politicos[par.politicoId]))}</b></div>` : ''}
        <div class="fila accion-form" style="margin-top:8px;gap:4px;flex-wrap:wrap"><select data-arg="papel">${Object.entries(F.PAPELES).map(([k, v]) => `<option value="${k}" ${k === par.papel ? 'selected' : ''}>${esc(v.n)}</option>`).join('')}</select><select data-arg="aspira" title="Si es carrera propia">${aspiraOpts([['concejo', 'Concejo'], ['asamblea', 'Asamblea'], ['camara', 'Cámara']])}</select>${UI.botonAccion('papelPareja', {}, 'Definir', 'chico')}${UI.botonAccion('divorciarse', {}, 'Terminar', 'chico peligro')}</div></div>`
      : `<div class="tarjeta" style="padding:10px"><div class="fila"><span style="font-size:22px">💍</span><div><b>Sin pareja</b><div class="tenue" style="font-size:12px">Formalizar una pareja da apoyos, patrimonio o bienestar, y abre la posibilidad de tener hijos.</div></div></div>
        <div class="fila accion-form" style="margin-top:8px;gap:4px"><select data-arg="tipo">${Object.entries(F.TIPOS_PAREJA).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join('')}</select>${UI.botonAccion('casarse', {}, 'Casarme', 'chico')}</div></div>`;
    const hijosHTML = J.familia.filter(f => f.rol !== 'Pareja').map(f => {
      const esHijo = f.rol === 'Hijo' || f.rol === 'Hija', icono = { Hijo: '👦', Hija: '👧', Madre: '👩‍🦳', Padre: '👨‍🦳' }[f.rol] || '👤';
      if (!esHijo) return `<div class="tarjeta" style="padding:10px"><div class="fila"><span style="font-size:22px">${icono}</span><div><b>${esc(f.nombre)}</b><div class="tenue" style="font-size:12px">${f.rol} · ${f.edad} años</div></div></div></div>`;
      const adulto = F.adulto(f), pol = f.politicoId && E.politicos[f.politicoId];
      return `<div class="tarjeta" style="padding:10px"><div class="fila"><span style="font-size:22px">${icono}</span><div><b>${esc(f.nombre)}</b><div class="tenue" style="font-size:12px">${f.rol} · ${f.edad} años · ${esc(f.educacion || 'Ninguna')}</div></div></div>
        <div class="tt-f" style="margin-top:6px"><span class="tenue">Relación contigo</span><b>${Math.round(f.relacion)}/100</b></div>
        ${adulto ? `<div class="tt-f"><span class="tenue">Potencial político</span><b>${F.potencial(f)}/100</b></div>` : ''}${pol ? `<div class="tt-f"><span class="tenue">En política</span><b>${esc(cargoTxt(pol))} · fuerza ${Math.round(pol.fuerza)}</b></div>` : ''}
        <div class="fila accion-form" style="margin-top:8px;gap:4px;flex-wrap:wrap">${UI.botonAccion('pasarTiempoHijo', { hijo: f.id }, 'Pasar tiempo', 'chico')}${UI.botonAccion('pagarEducacionHijo', { hijo: f.id }, 'Educación', 'chico')}
          ${pol ? UI.botonAccion('apadrinarHijo', { hijo: f.id }, 'Apadrinar', 'chico') : f.edad >= 21 ? `<select data-arg="aspira">${aspiraOpts([['concejo', 'Concejo'], ['asamblea', 'Asamblea'], ['camara', 'Cámara'], ['alcaldia', 'Alcaldía']])}</select>${UI.botonAccion('lanzarHijoPolitica', { hijo: f.id }, 'Lanzar a la política', 'chico')}` : ''}</div></div>`;
    }).join('');
    const dinHTML = din.miembros.length ? `<div class="tarjeta" style="margin-top:10px;padding:10px"><h4 class="sub-h" style="margin:0 0 6px">👑 Dinastía · ${din.puntos} puntos</h4><div class="lista">${din.miembros.map(x => `<div class="it"><div class="cuerpo"><b>${esc(x.p.nombre)}</b><span>${esc(x.f.rol)} · ${esc(cargoTxt(x.p))}${x.p.activo ? '' : ' · retirado'}</span></div></div>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:6px">Cada familiar con cargo suma puntos de dinastía: pesan en el legado y el heredero llega con más reconocimiento.</div></div>` : '';
    return `<div class="tarjeta" style="margin-top:14px"><div class="t-cab"><h3>Familia · bienestar ${Math.round(J.bienestar || 60)}%</h3>${UI.botonAccion('tenerHijo', {}, '👶 Tener un hijo', 'chico')}</div>
      <div class="grid g3">${parejaHTML}${hijosHTML}</div>${dinHTML}</div>`;
  };

  C.Pantallas.personaje = {
    render(el) {
      const E = C.E, J = E.jugador, S = E.series;
      const dim = E.ui.dimSeg || 'nivel';
      const segs = C.Opinion.SEGMENTOS[dim];
      const pa = E.partidos[J.partido];
      const topDep = Object.values(E.deptos).map(d => ({ d, v: C.Opinion.favDepto(E, d.id) })).sort((a, b) => b.v - a.v);
      C.Familia.asegurarDatos(E);
      el.innerHTML = `<div class="cab"><div><h1>Mi carrera</h1><div class="sub">${esc(C.DATA.cargos[J.cargo].nombre)} · ${U.anio() - J.nac} años · ${esc(J.profesion)} · ${esc(J.educacion)}</div></div>
        <div class="fila">${UI.botonAccion('descansar', {})}${UI.botonAccion('estudiar', {})}${UI.botonAccion('trabajar', {})}${UI.botonAccion('retirarseVida', {}, 'Retirarte', 'chico peligro')}</div></div>
      ${J.legado ? `<div class="tarjeta" style="margin-top:0;margin-bottom:14px;border-left:4px solid var(--oro)"><div class="fila" style="gap:10px"><span style="font-size:24px">👪</span><div><b>Continúas el legado de ${esc(J.legado.predecesor)}</b><div class="tenue" style="font-size:12px">Llegó a ser ${esc(J.legado.cargoMaximo || 'ciudadano')} y ganó ${J.legado.eleccionesGanadas} elecciones. Heredaste su apellido y algo de su reconocimiento.</div></div></div></div>` : ''}
      ${J.investigacion ? `<div class="tarjeta" style="margin-top:0;margin-bottom:14px;border-left:4px solid var(--mal)"><div class="fila" style="gap:10px;justify-content:space-between;flex-wrap:wrap"><div class="fila" style="gap:10px"><span style="font-size:24px">⚖</span><div><b>Investigación judicial en curso: ${esc(C.Judicial.TIPOS[J.investigacion.tipo])}</b><div class="tenue" style="font-size:12px">Etapa: ${esc(J.investigacion.etapa)} · avance ${Math.round(J.investigacion.avance)}%${J.defensaJudicial ? ' · defensa contratada' : ''}</div></div></div>${UI.botonAccion('defensaLegal', {}, 'Contratar defensa legal', 'chico')}</div></div>` : ''}
      <div class="grid g3">
        <div class="tarjeta perfil"><div class="fila" style="flex-wrap:nowrap">${Comp.avatar(E, E.politicos.J, 92)}<div><h2 style="font-size:23px">${esc(J.nombre)}</h2>
          <div class="tenue" style="font-size:12.5px">Nacido en ${esc(E.deptos[J.nacimiento].capital)} · vive en ${esc(E.deptos[J.residencia].capital)}</div>
          <div class="fila" style="margin-top:6px">${Comp.partido(E, J.partido, true)}${pa ? Comp.postura(pa.postura) : ''}</div></div></div>
          <div style="margin-top:10px">${Comp.ideoBarra(J.ideologia.eco, J.ideologia.soc)}<div class="tenue" style="font-size:11.5px;margin-top:3px">${Comp.etiquetaIdeo(J.ideologia.eco)} · ${J.ideologia.soc > 25 ? 'conservador' : J.ideologia.soc < -25 ? 'progresista' : 'moderado'} en lo social</div></div>
          <h3 style="margin-top:12px">Atributos</h3>${G.barrasH(Object.entries({ carisma: 'Carisma', oratoria: 'Oratoria', gestion: 'Gestión', negociacion: 'Negociación', integridad: 'Integridad' }).map(([k, n]) => ({ etq: n, v: J.atributos[k], color: '#6f86b3' })), { max: 100, fmt: v => U.n(v), anchoEtq: '84px' })}
          <div class="grid g3" style="margin-top:12px">${Comp.kpi('Favorabilidad', U.n(J.popularidad) + '%')}${Comp.kpi('Reconocimiento', U.n(J.reconocimiento) + '%')}${Comp.kpi('Credibilidad', U.n(J.credibilidad))}</div></div>
        <div class="tarjeta"><h3>Reputación</h3><div style="display:flex;justify-content:center">${G.radar(Object.entries({ honestidad: 'Honestidad', competencia: 'Competencia', liderazgo: 'Liderazgo', experiencia: 'Experiencia', cercania: 'Cercanía', transparencia: 'Transparencia' }).map(([k, n]) => ({ etq: n, v: J.rep[k] })), { tam: 260 })}</div>
          ${G.linea([{ nombre: 'Favorabilidad', color: '#D9B45A', datos: S['jug:favorabilidad'] || [] }, { nombre: 'Reconocimiento', color: '#6CC4F5', datos: S['jug:reconocimiento'] || [] }], { alto: 120, min: 0, max: 100, unidad: '%' })}</div>
        <div class="tarjeta"><div class="t-cab"><h3>Imagen por segmento</h3><select id="p-dim">${Object.entries(C.Opinion.DIM).map(([k, n]) => `<option value="${k}" ${k === dim ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          ${G.barrasH(segs.map(s => ({ etq: s[1], v: C.Opinion.favSegmento(E, s[0]), color: C.Opinion.favSegmento(E, s[0]) > 50 ? 'var(--bien)' : 'var(--alerta)', tt: `Peso en el electorado: ${Math.round(s[4] * 100)} %` })), { max: 100, marca: 50, fmt: v => U.n(v) + '%', anchoEtq: '110px' })}
          <h3 style="margin-top:14px">Dónde te quieren más</h3>${G.barrasH(topDep.slice(0, 5).map(x => ({ etq: esc(x.d.nombre), v: x.v, color: '#5DB85A' })), { max: 100, fmt: v => U.n(v) + '%', anchoEtq: '110px' })}
          <h3 style="margin-top:10px">Dónde te rechazan</h3>${G.barrasH(topDep.slice(-3).reverse().map(x => ({ etq: esc(x.d.nombre), v: x.v, color: '#E8812A' })), { max: 100, fmt: v => U.n(v) + '%', anchoEtq: '110px' })}</div>
      </div>
      <div class="tarjeta" style="margin-top:14px"><h3>Árbol de carrera</h3>${arbol(E)}<div class="tenue" style="font-size:12px">Dorado: cargos que has ocupado. Hay muchas rutas hacia la Casa de Nariño: por la vía territorial, la legislativa o la técnica.</div></div>
      <div class="grid g3" style="margin-top:14px">
        <div class="tarjeta"><h3>Patrimonio y finanzas</h3>${Comp.kpi('Efectivo', U.cop(J.patrimonio))}
          <div class="tt-f" style="margin-top:6px"><span class="tenue">Ingresos mensuales</span><b>${U.cop(J.ingresos)}</b></div><div class="tt-f"><span class="tenue">Gastos mensuales</span><b>${U.cop(J.gastos)}</b></div>
          <div class="tt-f"><span class="tenue">Patrimonio total (con bienes)</span><b>${U.cop(J.patrimonio + C.Propiedades.valorTotal(E))}</b></div>
          ${C.Propiedades.riesgoPatrimonial(E) > 0.1 ? `<div class="tt-f"><span class="tenue">Riesgo de escándalo patrimonial</span><b class="mal">${Math.round(C.Propiedades.riesgoPatrimonial(E) * 100)}%</b></div>` : ''}
          ${G.linea([{ nombre: 'Patrimonio', color: '#5DB85A', datos: S['jug:patrimonio'] || [] }], { alto: 100, fmt: v => U.n(v), unidad: ' M' })}
          <h3 style="margin-top:10px">Bienes</h3><div class="lista">${C.Propiedades.bienes(E).map(b => `<div class="it"><span>${C.Propiedades.TIPOS[b.tipo].icono}</span><div class="cuerpo"><b>${esc(b.nombre)}</b><span>${U.cop(b.valor)}</span></div>${UI.botonAccion('venderBien', { bien: b.id }, 'Vender', 'chico')}</div>`).join('') || '<div class="vacio">Sin bienes registrados.</div>'}</div>
          <div class="fila accion-form" style="margin-top:8px"><select data-arg="tipo">${Object.entries(C.Propiedades.TIPOS).map(([k, t]) => `<option value="${k}">${t.icono} ${esc(t.n)} (${U.cop(t.costoBase)})</option>`).join('')}</select>${UI.botonAccion('comprarBien', {}, 'Comprar')}</div></div>
        <div class="tarjeta"><h3>Trayectoria</h3><div class="timeline">${J.trayectoria.slice().reverse().map(t => `<div class="tl"><span class="tl-f">${U.fmtT(t.t)}</span><span class="tl-t">${esc(t.txt)}</span></div>`).join('')}</div></div>
        <div class="tarjeta"><h3>Historial electoral</h3><div class="lista">${J.historialElectoral.slice().reverse().map(h => `<div class="it"><span>${h.electo ? '✅' : '❌'}</span><div class="cuerpo"><b>${esc(C.Elecciones.CARGOS_CAMPANA[h.cargo] || h.cargo)} ${h.anio}</b><span>${U.n(h.votos)} votos${h.depto ? ' · ' + esc(E.deptos[h.depto].nombre) : ''}</span></div></div>`).join('') || '<div class="vacio">Aún no has sido candidato.</div>'}</div>
          <h3 style="margin-top:12px">Historial legislativo</h3><div class="lista">${J.historialLegislativo.slice().reverse().slice(0, 8).map(h => `<div class="it"><span>${h.resultado === 'ley' ? '📜' : '🗄'}</span><div class="cuerpo"><b style="white-space:normal">${esc(h.titulo)}</b><span>${h.rol} · ${h.resultado === 'ley' ? 'Ley ' + h.ley : esc(h.motivo || 'archivado')}</span></div></div>`).join('') || '<div class="vacio">Sin iniciativas concluidas.</div>'}</div>
          <h3 style="margin-top:12px">Escándalos y reconocimientos</h3><div class="lista">${[...J.escandalos.map(x => ({ ...x, i: '🔎', txt: x.titulo })), ...J.reconocimientos.map(x => ({ ...x, i: '🏅' }))].sort((a, b) => b.t - a.t).map(x => `<div class="it"><span>${x.i}</span><div class="cuerpo"><b style="white-space:normal">${esc(x.txt)}</b><span>${U.fmtT(x.t)}</span></div></div>`).join('') || '<div class="vacio">Hoja de vida limpia y sin distinciones aún.</div>'}</div></div>
      </div>
      ${escenarioHTML(E)}${saludLegadoHTML(E)}
      ${familiaHTML(E)}
      <div class="tarjeta" style="margin-top:14px"><h3>Cambiar de rumbo</h3><div class="fila accion-form"><select data-arg="oficio">${Object.entries(C.Personaje.ORIGENES).filter(([k, o]) => !o.electo && !o.oculto).map(([k, o]) => `<option value="${k}">${o.icono} ${o.n}</option>`).join('')}</select>${UI.botonAccion('cambiarOficio', {})}
        <select data-arg="partido">${Object.values(E.partidos).filter(p => !p.especial && !p.futuro).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>${UI.botonAccion('afiliarse', {})}</div>
        <p class="tenue" style="font-size:12px">La vida sigue fuera de los cargos: academia, periodismo, gremios u ONG te mantienen vigente para volver a la arena electoral.</p></div>`;
      UI.$('#p-dim', el).onchange = e => { E.ui.dimSeg = e.target.value; C.App.refrescar(); };
    },

    /* ── Fin de la vida pública del jugador: elegir sucesor o cerrar la partida ── */
    modalSucesion(datos) {
      const E = C.E;
      const candidatos = datos.candidatos.map(id => E.jugador.familia.find(f => f.id === id)).filter(Boolean);
      const motivoTxt = datos.motivo === 'fallecimiento' ? `${esc(datos.resumen.nombre)} falleció` : `${esc(datos.resumen.nombre)} se retira de la vida pública`;
      const cuerpo = `<p style="margin-top:0">${motivoTxt} después de ${datos.resumen.anios} años, ${datos.resumen.eleccionesGanadas} elecciones ganadas y ${datos.resumen.leyesAprobadas} leyes aprobadas como ${esc(datos.resumen.cargoFinal.toLowerCase())}.</p>
        <h3 class="sub-h">¿Quién continúa el legado de la familia?</h3>
        <div class="grid g2">${candidatos.map(f => `<div class="tarjeta"><div class="fila"><span style="font-size:26px">${f.rol === 'Hija' ? '👧' : '👦'}</span><div><b>${esc(f.nombre)}</b><div class="tenue" style="font-size:12px">${f.edad} años · ${esc(f.educacion || 'Ninguna')} · potencial ${C.Familia.potencial(f)}/100</div></div></div>
          <div style="margin-top:8px"><button class="btn chico prim" data-elegir="${f.id}">Continuar con ${esc(f.nombre.split(' ')[0])}</button></div></div>`).join('')}</div>
        <div class="fila" style="margin-top:14px;justify-content:flex-end"><button class="btn chico peligro" id="suc-terminar">Terminar la partida aquí</button></div>`;
      const m = UI.modal({ titulo: 'Fin de una carrera', icono: '👪', cuerpo, sinCerrar: true });
      m.cuerpo.addEventListener('click', e => {
        const b = e.target.closest('[data-elegir]');
        if (b) { C.Acciones.ejecutar('elegirSucesor', { hijo: b.dataset.elegir }); m.cerrar(); C.App.comenzar(); return; }
        if (e.target.closest('#suc-terminar')) { C.Acciones.ejecutar('terminarPartida', {}); m.cerrar(); C.App.revisarPendientes(); }
      });
    },
    modalFin(datos) {
      const r = datos.resumen;
      const motivoTxt = datos.motivo === 'fallecimiento' ? 'falleció' : 'se retiró de la vida pública';
      const cuerpo = r ? `<p style="margin-top:0">${esc(r.nombre)} ${motivoTxt} después de una carrera de ${r.anios} años.</p>
        <div class="grid g2">
          ${Comp.kpi('Cargo más alto', esc(r.cargoFinal))}${Comp.kpi('Elecciones ganadas', r.eleccionesGanadas)}
          ${Comp.kpi('Leyes aprobadas', r.leyesAprobadas)}${Comp.kpi('Patrimonio final', U.cop(r.patrimonio))}${r.veredicto ? Comp.kpi('Veredicto de la historia', esc(r.veredicto), `<span class="tenue">${r.legadoPuntos} puntos de legado</span>`) : ''}
        </div>
        <p class="tenue" style="font-size:12.5px;margin-top:10px">${r.cargosOcupados.length ? 'Ocupó: ' + r.cargosOcupados.join(', ') + '.' : ''} Sin herederos adultos que continúen la carrera política de la familia.</p>` : '<p>La carrera política de la familia llega a su fin.</p>';
      const cuerpoFinal = cuerpo + `<div class="fila" style="margin-top:14px;justify-content:flex-end"><button class="btn prim" id="fin-menu">Volver al menú</button></div>`;
      const m = UI.modal({ titulo: 'Fin de la partida', icono: '🏁', cuerpo: cuerpoFinal, sinCerrar: true });
      m.cuerpo.querySelector('#fin-menu').onclick = () => { m.cerrar(); C.E.ui.finPartida = null; C.Pantallas.inicio.render(document.getElementById('app')); };
    }
  };
})(window.CURUL);
