/* Seguridad y territorio: cultivos, presencia del Estado, sustitución, grupos armados y certificación. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const T = () => C.Territorio;
  const barra = (v, col) => G.barrasH([{ etq: '', v, color: col }], { max: 100, anchoEtq: '0px', anchoValor: '30px', fmt: x => Math.round(x) });

  const territorio = E => {
    const q = T().asegurar(E), gest = T().gestor(E) === true, filas = Object.entries(q.deptos).map(([id, s]) => ({ id, s, d: E.deptos[id], g: T().grupoEn(E, id) })).sort((a, b) => b.s.cultivos - a.s.cultivos);
    const ver = filas.slice(0, E.ui.segTodos ? filas.length : 14), pres = U.prom(filas.map(f => f.s.presencia));
    const serie = (E.series.cultivos || []).slice(-260);
    return `<div class="grid g4">${Comp.kpi('Cultivos de uso ilícito', U.n(Math.round(T().total(E))) + ' ha', `<span class="tenue">${filas.filter(f => f.s.cultivos > 500).length} departamentos con más de 500 ha</span>`)}${Comp.kpi('Erradicadas (acumulado)', U.n(Math.round(q.erradicadas)) + ' ha', '<span class="tenue">manual y aérea</span>')}${Comp.kpi('Presencia del Estado', Math.round(pres) + '/100', '<span class="tenue">promedio nacional</span>')}${Comp.kpi('Certificación de EE. UU.', `<span class="etq ${T().CERT[q.cert.estado].clase}" style="font-size:13px">${esc(T().CERT[q.cert.estado].n)}</span>`, '<span class="tenue">se decide cada septiembre</span>')}</div>
      <div class="grid g-dash" style="margin-top:14px"><div class="tarjeta"><h3>Cultivos en el tiempo</h3>${serie.length > 2 ? G.linea([{ nombre: 'Hectáreas', color: '#E8A33D', datos: serie }], { alto: 200, fmt: v => U.n(Math.round(v)), area: true }) : '<div class="vacio">Sin datos todavía</div>'}</div>
        <div class="tarjeta"><h3>Cómo funciona</h3><div class="tenue" style="font-size:12.5px;line-height:1.5"><b>Erradicar</b> baja los cultivos ya, pero enoja al campo (más la aspersión aérea) y exige presencia del Estado. <b>Sustituir</b> es lento y caro, pero apaga el descontento. <b>Desplegar</b> tropas sube la presencia y la seguridad. La <b>inversión social</b> ataca la raíz. Donde manda un grupo armado, los cultivos crecen y lo financian.</div></div></div>
      <div class="tarjeta" style="margin-top:14px"><h3>Departamentos</h3>${gest ? '' : '<div class="tenue" style="font-size:12px;margin-bottom:8px">Sólo el Presidente y el ministro de Defensa dan órdenes; aquí puedes ver la situación.</div>'}
        <table class="tabla"><thead><tr><th>Departamento</th><th>Cultivos</th><th>Grupo armado</th><th>Presencia</th><th>Sustitución</th><th>Seguridad</th>${gest ? '<th>Acciones</th>' : ''}</tr></thead><tbody>${ver.map(({ id, s, d, g }) => `<tr><td><b>${esc(d.nombre)}</b><div class="tenue" style="font-size:11px">${esc(d.region)}</div></td><td class="num">${U.n(Math.round(s.cultivos))} ha</td><td>${g ? `<span class="etq rojo">${esc(g.sigla)}</span>` : '<span class="tenue">—</span>'}</td><td style="width:110px">${barra(s.presencia, 'var(--azul,#2A5CC7)')}</td><td style="width:110px">${barra(s.sustitucion, 'var(--si)')}</td><td style="width:110px">${barra(d.seguridad, d.seguridad >= 55 ? 'var(--si)' : d.seguridad >= 38 ? 'var(--alerta)' : 'var(--no)')}</td>
          ${gest ? `<td><div class="fila" style="gap:3px;flex-wrap:nowrap">${UI.botonAccion('erradicarCultivos', { depto: id, modo: 'manual' }, '🌾', 'chico')}${UI.botonAccion('erradicarCultivos', { depto: id, modo: 'aerea' }, '✈', 'chico')}${UI.botonAccion('sustituirCultivos', { depto: id }, '🌱', 'chico')}${UI.botonAccion('desplegarPresencia', { depto: id }, '🪖', 'chico')}${UI.botonAccion('inversionSocialTerritorio', { depto: id }, '🏥', 'chico')}</div></td>` : ''}</tr>`).join('')}</tbody></table>
        <div class="tenue" style="font-size:11.5px;margin-top:8px">🌾 erradicación manual · ✈ aspersión aérea · 🌱 sustitución voluntaria · 🪖 desplegar presencia · 🏥 inversión social integral</div>
        ${filas.length > 14 ? `<div style="margin-top:8px"><button class="btn chico" data-seg-todos="1">${E.ui.segTodos ? 'Mostrar sólo los principales' : 'Mostrar todos (' + filas.length + ')'}</button></div>` : ''}</div>`;
  };

  const certificacion = E => {
    const q = T().asegurar(E).cert, usa = E.diplomacia.paises.USA;
    return `<div class="grid g2"><div class="tarjeta"><h3>Certificación antidrogas de Estados Unidos</h3><div class="tenue" style="font-size:12.5px;margin-bottom:10px">Cada septiembre Washington califica el esfuerzo de Colombia. Pesan la evolución de los cultivos en el último año, lo que se erradica y la relación bilateral. Una descertificación golpea la relación, la inversión y tu aprobación.</div>
        <div class="resultado-jugador ${q.estado === 'certificado' ? 'ok' : 'no'}"><div style="font-size:28px">${q.estado === 'certificado' ? '✅' : q.estado === 'condiciones' ? '⚠' : '⛔'}</div><div><b>${esc(T().CERT[q.estado].n)}</b><div class="tenue">Relación con Estados Unidos: ${usa ? Math.round(usa.relacion) : '—'} %</div></div></div></div>
      <div class="tarjeta"><h3>Historial</h3>${q.hist.length ? `<div class="lista">${q.hist.map(h => `<div class="it"><div class="cuerpo"><b>${h.anio}</b></div><span class="etq ${T().CERT[h.estado].clase}">${esc(T().CERT[h.estado].n)}</span></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">Aún no ha habido una calificación en esta partida.</div>'}</div></div>`;
  };

  const grupos = E => {
    const OP = C.OrdenPublico;
    return `<div class="tarjeta"><h3>Grupos armados</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Las ofensivas y el proceso de paz se manejan en Gobierno y oposición → Centro de Gobierno. Aquí ves cuánto pesa cada grupo en el territorio.</div>
      <div class="lista">${OP.GRUPOS.map(g => { const st = E.ordenPublico.grupos[g.id], cult = U.suma(st.control.map(id => (E.territorio && E.territorio.deptos[id] ? E.territorio.deptos[id].cultivos : 0)));
        return `<div class="it" style="align-items:flex-start"><div class="cuerpo"><b>${esc(g.nombre)} (${esc(g.sigla)})</b><span style="white-space:normal">${esc(g.tipo)} · ${st.activo ? 'controla ' + st.control.map(id => esc(E.deptos[id].nombre)).join(', ') : 'desmovilizado'}${st.negociacion ? ' · en negociación' : ''}${st.acuerdoPaz ? ' · acuerdo de paz' : ''}</span></div><span class="etq ${st.activo ? 'rojo' : 'verde'}">${st.activo ? 'Fuerza ' + Math.round(st.fuerza) : 'Inactivo'}</span><span class="tenue" style="font-size:12px;min-width:110px;text-align:right">${U.n(Math.round(cult))} ha bajo control</span></div>`; }).join('')}</div>
      <div style="margin-top:10px"><button class="btn chico prim" data-ir-gob="centro">Ir al Centro de Gobierno →</button></div></div>`;
  };

  const TABS = [['territorio', 'Territorio y cultivos', territorio], ['certificacion', 'Certificación', certificacion], ['grupos', 'Grupos armados', grupos]];
  C.Pantallas.seguridad = {
    render(el, params) {
      const E = C.E; T().asegurar(E);
      const tab = (params && params.tab) || E.ui.segTab || 'territorio'; E.ui.segTab = tab;
      const cur = TABS.find(t => t[0] === tab) || TABS[0];
      el.innerHTML = `<div class="cab"><div><h1>Seguridad y territorio</h1><div class="sub">Cultivos ilícitos, presencia del Estado y grupos armados: la política de seguridad y drogas, departamento por departamento.</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === cur[0] ? 'activo' : ''}">${n}</button>`).join('')}</div>
        <div style="margin-top:14px">${cur[2](E)}</div>`;
      el.onclick = e => {
        const t = e.target.closest('.tabs [data-tab]'); if (t) return C.App.ir('seguridad', { tab: t.dataset.tab });
        if (e.target.closest('[data-seg-todos]')) { E.ui.segTodos = !E.ui.segTodos; return C.App.refrescar(); }
        const g = e.target.closest('[data-ir-gob]'); if (g) return C.App.ir('gobierno', { tab: g.dataset.irGob });
      };
    }
  };
})(window.CURUL);
