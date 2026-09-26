/* Mesa de trabajo del ministerio: si eres ministro, aquí convocas al sector y avanzas su agenda. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.ministerio = {
    render(el) {
      const E = C.E, J = E.jugador;
      if (J.cargo !== 'ministro') {
        el.innerHTML = `<div class="cab"><div><h1>Mesa de trabajo</h1><div class="sub">Sólo disponible si eres ministro.</div></div></div>
          <div class="tarjeta vacio">Si diriges tu partido y éste hace parte de la coalición de gobierno, puedes presionar por un ministerio desde el Centro de Gobierno. Cuando lo consigas, aquí convocarás su mesa de trabajo.</div>`;
        return;
      }
      const minId = J.cargoInfo.ministerio, min = C.Gobierno.todosMinisterios(E).find(m => m.id === minId);
      const campo = C.Gobierno.EFECTO_SECTOR[min.sector];
      const nat = k => U.prom(Object.values(E.deptos).map(d => d[k]));
      const g = E.gobierno, hist = (g.mesasMinisterio || {})[minId] || [];
      const sector = C.DATA.sectores[min.sector];
      const asignado = C.Presupuesto ? C.Presupuesto.vigente && C.Presupuesto.vigente(E, minId) : null;
      el.innerHTML = `<div class="cab"><div><h1>Ministerio de ${esc(min.nombre)}</h1><div class="sub">${sector ? sector.icono + ' ' + esc(sector.nombre) : ''} · tu imagen como ministro: ${Math.round(E.politicos.J.aprob || 50)}%</div></div></div>
        <div class="grid g4">
          ${Comp.kpi('Imagen del Gobierno', Math.round(E.opinion.aprobacionPres) + '%')}
          ${campo ? Comp.kpi('Promedio nacional · ' + campo, U.d1(nat(campo)) + '/100') : Comp.kpi('Programas insignia', (min.programas || []).length)}
          ${Comp.kpi('Reconocimiento', Math.round(J.reconocimiento) + '%')}
          ${Comp.kpi('Competencia', Math.round(J.rep.competencia) + '/100')}
        </div>
        <div class="tarjeta" style="margin-top:14px"><h3>Programas insignia</h3><div class="fila" style="gap:6px">${(min.programas || []).map(p => `<span class="etq">${esc(p)}</span>`).join('') || '<span class="tenue">Sin programas registrados.</span>'}</div></div>
        <div class="grid g2" style="margin-top:14px">
          <div class="tarjeta"><h3>Convocar mesa de trabajo</h3>
            <p class="tenue" style="font-size:12.5px">Reúnes a gremios, expertos y sociedad civil del sector para avanzar la agenda del ministerio.${campo ? ' Mejora un poco el promedio nacional de ' + campo + '.' : ''}</p>
            ${UI.botonAccion('convocarMesa', {}, 'Convocar mesa de trabajo', 'prim')}</div>
          <div class="tarjeta"><h3>Historial de mesas de trabajo</h3><div class="lista">${hist.slice(0, 10).map(h => `<div class="it"><span class="tenue num" style="font-size:11px;width:70px">${U.fmtT(h.t)}</span><div class="cuerpo" style="font-size:12.5px">${h.campo ? `${U.signo(h.magnitud, 1)} en ${esc(h.campo)} (promedio nacional)` : 'Mesa de trabajo sectorial'}</div></div>`).join('') || '<div class="vacio">Aún no has convocado ninguna mesa.</div>'}</div></div>
        </div>`;
    }
  };
})(window.CURUL);
