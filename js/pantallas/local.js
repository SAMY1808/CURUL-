/* Gobernación o Alcaldía del jugador: gabinete local, presupuesto propio y decretos. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp, GL = C.GobiernoLocal;
  C.Pantallas = C.Pantallas || {};
  const bill = v => '$' + U.d1(v) + ' billones';

  C.Pantallas.local = {
    render(el) {
      const E = C.E, J = E.jugador;
      if (J.cargo !== 'gobernador' && J.cargo !== 'alcalde') {
        el.innerHTML = `<div class="cab"><div><h1>Gobierno local</h1><div class="sub">Sólo disponible si eres gobernador o alcalde.</div></div></div>
          <div class="tarjeta vacio">Cuando ganes una gobernación o una alcaldía, aquí manejarás tu propio gabinete, tu presupuesto regional y tus decretos.</div>`;
        return;
      }
      const organo = J.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia';
      const depto = J.cargoInfo.depto, d = E.deptos[depto];
      const g = GL.asegurar(E, depto, organo);
      const info = GL.ORGANOS[organo];
      const total = GL.presupuestoTotal(E, depto, organo);
      const asignado = GL.asignado(E, depto, organo);
      const secs = GL.secretariasDe(g);
      el.innerHTML = `<div class="cab"><div><h1>${organo === 'gobernacion' ? 'Gobernación de ' + esc(d.nombre) : 'Alcaldía de ' + esc(d.capital)}</h1>
          <div class="sub">${esc(d.nombre)} · ${info.corp} · presupuesto propio ${bill(total)}/año</div></div></div>
        <div class="grid g4">
          ${Comp.kpi('Presupuesto anual', bill(total))}
          ${Comp.kpi('Decretos firmados', g.decretos)}
          ${Comp.kpi('Seguridad', U.n(d.seguridad) + '/100')}
          ${Comp.kpi('Infraestructura', U.n(d.infraestructura) + '/100')}
        </div>
        <div class="tarjeta" style="margin-top:14px"><h3>Participación por secretaría</h3>
          ${G.barrasH(secs.map(s => ({ etq: s.nombre.replace('Secretaría de ', ''), v: g.shares[s.id] || 0, color: GL.subfinanciada(E, depto, organo, s.id) ? 'var(--mal)' : 'var(--oro)', tt: `<b>${esc(s.nombre)}</b>: ${U.d1(g.shares[s.id] || 0)} % · ${bill(asignado[s.id])}` })), { max: 30, fmt: v => U.d1(v) + '%', anchoEtq: '150px' })}</div>
        <div class="grid g3" style="margin-top:14px">${secs.map(s => {
          const pol = E.politicos[g.secretarios[s.id]]; const under = GL.subfinanciada(E, depto, organo, s.id);
          return `<div class="tarjeta ${under ? 'min-presu bajo' : ''}"><div class="t-cab"><h3>${esc(s.nombre)}</h3>${under ? '<span class="etq rojo">Ajustada</span>' : ''}</div>
            <div class="kpi-fila"><div class="kpi"><span class="v">${U.d1(g.shares[s.id] || 0)}%</span><span class="l">del presupuesto</span></div><div class="kpi" style="text-align:right"><span class="v" style="font-size:17px">${bill(asignado[s.id])}</span><span class="l">al año</span></div></div>
            <input type="range" min="1" max="55" step="1" value="${(g.shares[s.id] || 0).toFixed(0)}" data-secshare="${s.id}" style="margin-top:6px">
            ${pol ? `<div class="fila" style="margin-top:8px;align-items:center;gap:6px"><span data-ficha="${pol.id}" style="cursor:pointer">${Comp.avatar(E, pol, 26)}</span><span class="tenue" style="font-size:11.5px">${esc(C.Politicos.nombreCorto(pol))} · imagen <b class="num" style="color:var(--texto)">${Math.round(pol.aprob || 50)}%</b></span></div>` : ''}
            <div class="fila accion-form" style="margin-top:8px"><select data-arg="sentido"><option value="si">Reforzar</option><option value="no">Restringir</option></select>
              ${UI.botonAccion('decretoLocal', { depto, organo, secretaria: s.id }, 'Decretar', 'chico')}</div>
          </div>`;
        }).join('')}</div>
        <div class="grid g2" style="margin-top:14px">
          <div class="tarjeta"><h3>Crear una nueva secretaría (necesita ${info.acto.toLowerCase()} de ${info.corp})</h3>
            <div class="tenue" style="font-size:12px;margin-bottom:8px">Probabilidad estimada de aprobación: <b style="color:var(--oro2)">${Math.round(GL.probabilidadCorp(E, depto, organo) * 100)}%</b>, según tu fuerza política en la región.</div>
            <div class="fila accion-form" style="flex-wrap:nowrap"><input data-arg="nombre" placeholder="Nombre (sin «Secretaría de»)" style="flex:1;min-width:0;background:var(--panel);border:1px solid var(--borde2);border-radius:8px;padding:6px 8px;color:var(--texto)">
              <select data-arg="sector">${Object.entries(C.DATA.sectores).map(([k, s]) => `<option value="${k}">${s.icono} ${esc(s.nombre)}</option>`).join('')}</select>
              ${UI.botonAccion('crearSecretaria', { depto, organo })}</div></div>
          <div class="tarjeta"><h3>Historial de decretos</h3><div class="lista">${g.historial.slice(0, 10).map(h => `<div class="it"><span class="tenue num" style="font-size:11px;width:70px">${U.fmtT(h.t)}</span><div class="cuerpo" style="font-size:12.5px">${esc(h.txt)}</div></div>`).join('') || '<div class="vacio">Aún no has firmado decretos.</div>'}</div></div>
        </div>`;
      el.onclick = e => {
        const f = e.target.closest('[data-ficha]'); if (f) return Comp.fichaPolitico(E, f.dataset.ficha);
      };
      el.onchange = e => {
        if (e.target.dataset.secshare) { GL.setShare(E, depto, organo, e.target.dataset.secshare, +e.target.value); return C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
