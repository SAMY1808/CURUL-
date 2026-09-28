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
      const Co = C.Corporaciones, corp = Co.asegurar(E, depto, organo);
      const info = GL.ORGANOS[organo];
      const total = GL.presupuestoTotal(E, depto, organo);
      const asignado = GL.asignado(E, depto, organo);
      const secs = GL.secretariasDe(g);
      el.innerHTML = `<div class="cab"><div><h1>${organo === 'gobernacion' ? 'Gobernación de ' + esc(d.nombre) : 'Alcaldía de ' + esc(d.capital)}</h1>
          <div class="sub">${esc(d.nombre)} · ${info.corp} · presupuesto propio ${bill(total)}/año</div></div>
          <div class="fila">${UI.botonAccion('consejoGobLocal', { depto, organo }, 'Consejo de gobierno')}</div></div>
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
          if (pol) GL.asegurarSecretario(pol);
          let cuerpoGestion = '';
          if (pol && pol.crisisActiva) {
            cuerpoGestion = `<div class="mal" style="font-size:12px;margin-top:8px">⚠ ${esc(pol.crisisActiva.motivo)}${pol.crisisActiva.grave ? ' · <b>caso grave</b>' : ''}</div>
              <div class="fila" style="margin-top:6px;gap:6px">${UI.botonAccion('respaldarSecretarioCrisis', { depto, organo, secretaria: s.id }, 'Respaldar', 'chico')}${UI.botonAccion('destituirSecretarioCrisis', { depto, organo, secretaria: s.id }, 'Destituir', 'chico peligro')}</div>`;
          } else if (pol && pol.iniciativa && pol.iniciativa.estado === 'propuesta') {
            cuerpoGestion = `<div class="tenue" style="font-size:12px;margin-top:8px">Propone impulsar: <b style="color:var(--texto)">${esc(pol.iniciativa.programa)}</b></div>
              <div class="fila" style="margin-top:6px;gap:6px">${UI.botonAccion('aceptarIniciativaLocal', { depto, organo, secretaria: s.id }, 'Respaldar', 'chico')}${UI.botonAccion('rechazarIniciativaLocal', { depto, organo, secretaria: s.id }, 'Rechazar', 'chico')}</div>`;
          } else if (pol && pol.iniciativa && pol.iniciativa.estado === 'en_curso') {
            const pct = Math.round((1 - pol.iniciativa.semanas / pol.iniciativa.semanasTot) * 100);
            cuerpoGestion = `<div class="tenue" style="font-size:12px;margin-top:8px">En marcha: <b style="color:var(--texto)">${esc(pol.iniciativa.programa)}</b> · ${pol.iniciativa.semanas} sem. restantes</div>
              <div class="barra-h" style="margin-top:5px"><i style="width:${pct}%;background:var(--oro)"></i></div>`;
          }
          return `<div class="tarjeta ${under ? 'min-presu bajo' : ''}"><div class="t-cab"><h3>${esc(s.nombre)}</h3>${under ? '<span class="etq rojo">Ajustada</span>' : ''}</div>
            <div class="kpi-fila"><div class="kpi"><span class="v">${U.d1(g.shares[s.id] || 0)}%</span><span class="l">del presupuesto</span></div><div class="kpi" style="text-align:right"><span class="v" style="font-size:17px">${bill(asignado[s.id])}</span><span class="l">al año</span></div></div>
            <input type="range" min="1" max="55" step="1" value="${(g.shares[s.id] || 0).toFixed(0)}" data-secshare="${s.id}" style="margin-top:6px">
            ${pol ? `<div class="fila" style="margin-top:8px;align-items:center;gap:6px"><span data-ficha="${pol.id}" style="cursor:pointer">${Comp.avatar(E, pol, 26)}</span><span class="tenue" style="font-size:11.5px">${esc(C.Politicos.nombreCorto(pol))}${pol.partido ? ' · ' + esc(E.partidos[pol.partido].sigla) : ' · técnico'} · gestión <b class="num" style="color:var(--texto)">${Math.round(pol.gestion)}</b> · imagen <b class="num" style="color:var(--texto)">${Math.round(pol.aprob || 50)}%</b></span></div>` : ''}
            ${cuerpoGestion}
            <div class="fila accion-form" style="margin-top:8px"><select data-arg="sentido"><option value="si">Reforzar</option><option value="no">Restringir</option></select>
              ${UI.botonAccion('decretoLocal', { depto, organo, secretaria: s.id }, 'Decretar', 'chico')}</div>
            <div class="fila accion-form" style="margin-top:6px;flex-wrap:nowrap"><select data-arg="partido"><option value="">Técnico</option>${Object.values(E.partidos).filter(p => !p.especial && !p.futuro).map(p => `<option value="${p.id}">${esc(p.sigla)}</option>`).join('')}</select>${UI.botonAccion('designarSecretario', { depto, organo, secretaria: s.id }, 'Nombrar', 'chico')}</div>
            ${GL.programasDe(s.id).length ? `<div class="fila accion-form" style="margin-top:6px;flex-wrap:nowrap"><select data-arg="idx">${GL.programasDe(s.id).map((p, i) => `<option value="${i}">${esc(p[0])}</option>`).join('')}</select>${UI.botonAccion('lanzarPrograma', { depto, organo, secretaria: s.id }, 'Lanzar', 'chico')}</div>` : ''}
          </div>`;
        }).join('')}</div>
        <div class="grid g3" style="margin-top:14px">
          <div class="tarjeta"><h3>💵 Regalías</h3>
            <div class="tenue" style="font-size:12px;margin-bottom:8px">Pídele al Gobierno Nacional un giro adicional. Si tu partido está en su coalición, te va mejor que si estás en la oposición.</div>
            <div class="kpi"><span class="v">${bill(g.fondoRegalias || 0)}</span><span class="l">fondo disponible</span></div>
            <div class="fila" style="margin-top:8px">${UI.botonAccion('pedirRegalias', { depto, organo })}</div></div>
          <div class="tarjeta"><h3>🏗 Obra bandera</h3>
            ${g.obraBandera ? (() => { const ob = GL.nombreObra(g.obraBandera); return `<div class="tenue" style="font-size:12px;margin-bottom:6px">En obra: <b style="color:var(--texto)">${ob.icono} ${esc(ob.nombre)}</b> · ${g.obraBandera.semanas} sem. restantes${g.obraBandera.acelerada ? ' · <span class="mal">acelerada</span>' : ''}</div>
              <div class="barra-h" style="margin-bottom:8px"><i style="width:${Math.round((1 - g.obraBandera.semanas / g.obraBandera.semanasTot) * 100)}%;background:var(--oro)"></i></div>
              ${!g.obraBandera.acelerada ? UI.botonAccion('acelerarObraBandera', { depto, organo }, null, 'chico') : ''}`; })()
            : `<div class="tenue" style="font-size:12px;margin-bottom:8px">Un megaproyecto visible, uno a la vez: si sale bien deja un legado real; si lo aprietas, hay riesgo de sobrecostos.</div>
              <div class="fila accion-form" style="flex-wrap:nowrap"><select data-arg="obra">${GL.obrasDisponibles(E, depto, organo).map(o => `<option value="${o.id}">${o.icono} ${esc(o.nombre)}</option>`).join('')}</select>${UI.botonAccion('iniciarObraBandera', { depto, organo })}</div>`}
            <div class="tenue" style="font-size:11px;margin-top:8px">${(g.obras || []).length} obra(s) entregada(s) hasta ahora · ${(g.obras || []).filter(o => o.exito).length} exitosa(s)</div></div>
          <div class="tarjeta"><h3>📢 Paro cívico</h3>
            <div class="tenue" style="font-size:12px;margin-bottom:6px">El descontento local sube si tu gestión se queda corta frente al resto del país.</div>
            <div class="fila" style="gap:14px;font-size:11.5px;margin-bottom:6px"><span>Descontento <b class="num" style="color:${g.civico.descontento > 70 ? 'var(--mal)' : g.civico.descontento > 40 ? 'var(--alerta)' : 'var(--bien)'}">${Math.round(g.civico.descontento)}</b></span><span>Relación <b class="num">${Comp.relacion(g.civico.relJ)}</b></span></div>
            <div class="barra-h"><i style="width:${Math.round(g.civico.descontento)}%;background:${g.civico.descontento > 70 ? 'var(--mal)' : g.civico.descontento > 40 ? 'var(--alerta)' : 'var(--bien)'}"></i></div>
            ${g.civico.paro ? `<div class="mal" style="font-size:12px;margin-top:8px">⚠ Paro activo (intensidad ${g.civico.paro.intensidad.toFixed(1)})</div>
              <div class="fila" style="margin-top:6px;gap:6px;flex-wrap:wrap">${UI.botonAccion('dialogarParoCivico', { depto, organo }, 'Dialogar', 'chico')}${UI.botonAccion('atenderPliegoCivico', { depto, organo }, 'Atender pliego', 'chico')}${UI.botonAccion('reprimirParoCivico', { depto, organo }, 'Dispersar', 'chico peligro')}</div>`
            : '<div class="tenue" style="font-size:11.5px;margin-top:8px">En calma por ahora.</div>'}</div>
        </div>
        <div class="tarjeta" style="margin-top:14px"><h3>${esc(info.corp)}</h3>
          <div class="tenue" style="font-size:12px;margin-bottom:8px">${corp.miembros.length} ${organo === 'gobernacion' ? 'diputados' : 'concejales'} elegidos por cifra repartidora sobre el voto real del ${organo === 'gobernacion' ? 'departamento' : 'municipio'}. Apoyo estimado a tu gestión: <b style="color:var(--oro2)">${Math.round(Co.apoyoEsperado(E, depto, organo) * 100)}%</b>.</div>
          <div style="max-width:520px;margin:0 auto">${Co.hemiciclo(E, depto, organo, { altoMax: 300 })}</div>
          ${C.Hemiciclo.leyenda(E, 'local', corp.ultimoVoto ? 'voto' : 'partido', Co.miembros(E, depto, organo))}
          ${corp.ultimoVoto ? `<div class="tenue" style="font-size:12px;margin-top:6px">Última votación: <b>${esc(corp.ultimoVoto.asunto)}</b> · ${corp.ultimoVoto.si}-${corp.ultimoVoto.no} (${corp.ultimoVoto.aus} ausentes) · ${corp.ultimoVoto.aprobado ? 'aprobada' : 'negada'}</div>` : ''}
        </div>
        <div class="grid g2" style="margin-top:14px">
          <div class="tarjeta"><h3>Crear una nueva secretaría (necesita ${info.acto.toLowerCase()} de ${info.corp})</h3>
            <div class="tenue" style="font-size:12px;margin-bottom:8px">Se somete a votación nominal real en la ${esc(info.corp)}: cada uno de los ${corp.miembros.length} miembros vota según su afinidad con tu gobierno.</div>
            <div class="fila accion-form" style="flex-wrap:nowrap"><input data-arg="nombre" placeholder="Nombre (sin «Secretaría de»)" style="flex:1;min-width:0;background:var(--panel);border:1px solid var(--borde2);border-radius:8px;padding:6px 8px;color:var(--texto)">
              <select data-arg="sector">${Object.entries(C.DATA.sectores).map(([k, s]) => `<option value="${k}">${s.icono} ${esc(s.nombre)}</option>`).join('')}</select>
              ${UI.botonAccion('crearSecretaria', { depto, organo })}</div></div>
          <div class="tarjeta"><h3>Historial de decretos</h3><div class="lista">${g.historial.slice(0, 10).map(h => `<div class="it"><span class="tenue num" style="font-size:11px;width:70px">${U.fmtT(h.t)}</span><div class="cuerpo" style="font-size:12.5px">${esc(h.txt)}</div></div>`).join('') || '<div class="vacio">Aún no has firmado decretos.</div>'}</div></div>
        </div>`;
      el.onclick = e => {
        const f = e.target.closest('[data-ficha]'); if (f) return Comp.fichaPolitico(E, f.dataset.ficha);
        const pol = e.target.closest('[data-pol]'); if (pol) return Comp.fichaPolitico(E, pol.dataset.pol);
      };
      el.onchange = e => {
        if (e.target.dataset.secshare) { GL.setShare(E, depto, organo, e.target.dataset.secshare, +e.target.value); return C.App.refrescar(); }
      };
    }
  };
})(window.CURUL);
