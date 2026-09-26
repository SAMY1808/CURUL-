/* Asamblea o Concejo del jugador: cuando eres diputado o concejal, aquí radicas ordenanzas o
   acuerdos y ves tu propio hemiciclo, con curul y voto incluidos. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp, Co = C.Corporaciones;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.corporacion = {
    render(el) {
      const E = C.E, J = E.jugador;
      const organo = Co.corpDe(J);
      if (!organo) {
        el.innerHTML = `<div class="cab"><div><h1>Corporación pública</h1><div class="sub">Sólo disponible si eres diputado o concejal.</div></div></div>
          <div class="tarjeta vacio">Cuando salgas elegido diputado a una Asamblea Departamental o concejal de un Concejo Municipal, aquí radicarás ordenanzas o acuerdos y verás el hemiciclo con tu propia curul.</div>`;
        return;
      }
      const depto = J.cargoInfo.depto || J.residencia, d = E.deptos[depto];
      const { corp } = Co.asegurarJugador(E);
      const info = organo === 'gobernacion' ? { corp: 'Asamblea Departamental', acto: 'Ordenanza', titulo: 'Asamblea de ' + d.nombre } : { corp: 'Concejo Municipal', acto: 'Acuerdo', titulo: 'Concejo de ' + d.capital };
      el.innerHTML = `<div class="cab"><div><h1>${esc(info.titulo)}</h1><div class="sub">${esc(d.nombre)} · ${corp.miembros.length} ${organo === 'gobernacion' ? 'diputados' : 'concejales'}</div></div></div>
        <div class="grid g4">
          ${Comp.kpi('Seguridad', U.n(d.seguridad) + '/100')}
          ${Comp.kpi('Educación', U.n(d.educacion) + '/100')}
          ${Comp.kpi('Salud', U.n(d.salud) + '/100')}
          ${Comp.kpi('Infraestructura', U.n(d.infraestructura) + '/100')}
        </div>
        <div class="tarjeta" style="margin-top:14px"><h3>${esc(info.corp)}</h3>
          <div style="max-width:520px;margin:0 auto">${Co.hemiciclo(E, depto, organo, { altoMax: 300 })}</div>
          ${C.Hemiciclo.leyenda(E, 'local', corp.ultimoVoto ? 'voto' : 'partido', Co.miembros(E, depto, organo))}
          ${corp.ultimoVoto ? `<div class="tenue" style="font-size:12px;margin-top:6px">Última votación: <b>${esc(corp.ultimoVoto.asunto)}</b> · ${corp.ultimoVoto.si}-${corp.ultimoVoto.no} (${corp.ultimoVoto.aus} ausentes) · ${corp.ultimoVoto.aprobado ? 'aprobada' : 'negada'}</div>` : ''}
        </div>
        <div class="grid g2" style="margin-top:14px">
          <div class="tarjeta"><h3>Radicar ${info.acto.toLowerCase()}</h3>
            <div class="tenue" style="font-size:12px;margin-bottom:8px">Se somete a votación nominal real en la ${esc(info.corp)}: tu voto cuenta como sí, el resto de los ${corp.miembros.length - 1} miembros vota según su afinidad contigo.</div>
            <div class="fila accion-form" style="flex-wrap:nowrap"><input data-arg="titulo" placeholder="Título de tu ${info.acto.toLowerCase()}" style="flex:1;min-width:0;background:var(--panel);border:1px solid var(--borde2);border-radius:8px;padding:6px 8px;color:var(--texto)">
              <select data-arg="sector">${Object.entries(C.DATA.sectores).map(([k, s]) => `<option value="${k}">${s.icono} ${esc(s.nombre)}</option>`).join('')}</select>
              ${UI.botonAccion('proponerOrdenanza', {}, 'Radicar', 'prim')}</div>
            <p class="tenue" style="font-size:11.5px;margin-top:8px">Salud, educación, infraestructura y gobierno (seguridad) mejoran el indicador del departamento si se aprueba.</p></div>
          <div class="tarjeta"><h3>Historial de votaciones</h3><div class="lista">${corp.historial.slice(0, 10).map(h => `<div class="it"><span class="tenue num" style="font-size:11px;width:70px">${U.fmtT(h.t)}</span><div class="cuerpo" style="font-size:12.5px"><b>${esc(h.asunto)}</b><span>${h.si}-${h.no} (${h.aus} ausentes) · ${h.aprobado ? 'aprobada' : 'negada'}</span></div></div>`).join('') || '<div class="vacio">Aún no has radicado nada.</div>'}</div></div>
        </div>`;
      el.onclick = e => {
        const pol = e.target.closest('[data-pol]'); if (pol) return Comp.fichaPolitico(E, pol.dataset.pol);
      };
    }
  };
})(window.CURUL);
