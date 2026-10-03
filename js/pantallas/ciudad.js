/* Mi ciudad: el pulso de la alcaldía —ánimo, indicadores, caja, concejo, acciones, fiestas y ranking de alcaldes. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const col = v => v >= 62 ? '#3FBF7A' : v >= 42 ? '#E8A33D' : '#E0504A';
  const barra = (v, w) => `<div style="display:flex;align-items:center;gap:6px"><div class="barra-h" style="width:${w || 130}px;height:8px"><i style="width:${U.clamp(v, 0, 100)}%;background:${col(v)}"></i></div><span class="num" style="font-size:12px">${Math.round(v)}</span></div>`;
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  C.Pantallas.ciudad = {
    render(el) {
      const E = C.E, Al = C.Alcaldia;
      if (!Al.esAlcalde(E)) { el.innerHTML = `<div class="cab"><div><h1>Mi ciudad</h1></div></div><div class="tarjeta vacio">Sólo disponible si eres alcalde.</div>`; return; }
      const v = Al.vida(E), d = Al.depto(E), fiesta = Al.fiestaDeMes(E);
      const mem = Math.round(v.caja * 1000);
      const fila = (n, val) => `<div class="fila" style="justify-content:space-between;margin:5px 0"><span>${n}</span>${barra(val)}</div>`;
      const btn = (id, args, txt) => UI.botonAccion(id, args || {}, txt || null, 'chico');
      const festOpts = Object.entries(Al.FESTIVALES).map(([k, f]) => `<option value="${k}">${f.icono} ${f.n} · ${(Al.fr(E, f.frac) * 1000).toFixed(0)} M</option>`).join('');
      const rk = v.rank;
      el.innerHTML = `<div class="cab"><div><h1>Mi ciudad: ${esc(d.capital)}</h1><div class="sub">El pulso de la alcaldía: lo que la gente siente, lo que se mueve y lo que te puede explotar en la cara.</div></div></div>
        <div class="grid g4">
          <div class="kpi"><span class="l">Ánimo ciudadano</span><span class="v" style="color:${col(v.animo)}">${Math.round(v.animo)}</span><span class="d">${v.racha >= 26 ? '🔥 ciudad contenta' : v.racha <= -20 ? '⚠ ciudad inconforme' : 'racha ' + v.racha}</span></div>
          <div class="kpi"><span class="l">Caja de libre disposición</span><span class="v">$${U.n(mem)} M</span><span class="d">se recarga cada semana</span></div>
          <div class="kpi"><span class="l">Relación con el concejo</span><span class="v" style="color:${col(v.concejo)}">${Math.round(v.concejo)}</span><span class="d">${v.concejo < 35 ? 'hostil' : v.concejo > 65 ? 'aliado' : 'tibia'}</span></div>
          <div class="kpi"><span class="l">Próxima fiesta</span><span class="v" style="font-size:16px">${esc(fiesta[0])}</span><span class="d">${MESES[fiesta[1]]}</span></div>
        </div>
        <div class="grid g2" style="margin-top:14px"><div class="col">
          <div class="tarjeta"><h3>📊 Cómo está la ciudad</h3>${fila('😀 Ánimo ciudadano', v.animo)}${fila('🚦 Movilidad', v.movilidad)}${fila('🧹 Aseo y limpieza', v.aseo)}${fila('🌳 Espacio público', v.espacio)}${fila('🎭 Cultura y vida social', v.cultura)}${fila('🧳 Turismo y comercio', v.turismo)}${fila('🛡 Seguridad', d.seguridad)}
            <div class="tenue" style="font-size:12px;margin-top:8px">Si no la atiendes, la ciudad se degrada sola. Con el ánimo alto sube tu aprobación local; con el ánimo bajo durante meses, aparecen las firmas para revocarte.</div></div>
          ${rk ? `<div class="tarjeta"><h3>🏆 Ranking de alcaldes ${rk.anio}</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Quedaste en el puesto <b>${rk.puesto}</b> de ${rk.total}.</div><div class="lista">${rk.lista.map((x, i) => `<div class="it" ${x.yo ? 'style="background:rgba(217,180,90,.12)"' : ''}><div class="cuerpo"><b>${i + 1}. ${esc(x.nombre)}</b></div><span class="num">${Math.round(x.p)}</span></div>`).join('')}</div></div>` : `<div class="tarjeta"><h3>🏆 Ranking de alcaldes</h3><div class="tenue">Cada diciembre se publica el ranking de los mejores alcaldes del país. Los tres primeros ganan fama nacional.</div></div>`}
          ${v.hist.length ? `<div class="tarjeta"><h3>Bitácora</h3><div class="lista">${v.hist.slice(0, 8).map(h => `<div class="it"><div class="cuerpo"><b style="white-space:normal;font-weight:400">${esc(h.txt)}</b><span>${U.fmtT(h.t)}</span></div></div>`).join('')}</div></div>` : ''}</div>
        <div class="col">
          <div class="tarjeta"><h3>🚧 Orden y movilidad</h3><div class="fila" style="gap:6px;flex-wrap:wrap">${btn('operativoEspacio')}${btn('picoPlaca')}${btn('ciclovia')}${btn('planChoque')}${btn('campanaAseo')}</div></div>
          <div class="tarjeta"><h3>🎉 Fiestas y cultura</h3><div class="fila accion-form" style="gap:6px;flex-wrap:wrap"><select data-arg="tipo">${festOpts}</select>${UI.botonAccion('festivalCiudad', { tipo: 'feria' }, 'Organizar festival', 'chico')}</div>
            <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${btn('alumbradoNavideno')}${btn('mercadoCampesino')}</div></div>
          <div class="tarjeta"><h3>📣 Política y presencia</h3><div class="fila" style="gap:6px;flex-wrap:wrap">${btn('cabildoAbierto')}${btn('recorridoNocturno')}${btn('campanaRedes')}${btn('negociarConcejo')}${btn('actualizarPredial')}${btn('reclamarGobierno')}</div>
            <div class="tenue" style="font-size:12px;margin-top:8px">Cada acción gasta caja y puntos de agenda; algunas son una apuesta: pueden salirte geniales… o viralizarse para mal.</div></div></div></div>`;
    }
  };
})(window.CURUL);
