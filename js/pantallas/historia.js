/* Salón de la Fama / Archivo Histórico: expresidentes, políticos más destacados, dinastías
   políticas nacidas de la Fase 12 y el historial de partidos fundados y disueltos a lo largo
   de la partida. Es una pantalla puramente informativa, sin acciones. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};

  const Hist = {
    /* Puntaje simple para ordenar la relevancia histórica de un político NPC: años en cargos,
       leyes que sacó adelante como autor y el cargo más alto que llegó a ocupar. */
    NIVEL_HONOR: { presidente: 100, expresidente: 100, gobernador: 60, senador: 55, ministro: 55, alcalde: 40, representante: 35, diputado: 20, concejal: 15 },
    puntaje(p) {
      const h = p.honores || {};
      const maxHonor = Math.max(0, ...Object.keys(h).map(k => Hist.NIVEL_HONOR[k] || 0));
      return maxHonor + (p.aniosServicio || 0) * 3 + (p.stats.aprobados || 0) * 5;
    },
    cargoMasAlto(p) {
      const h = p.honores || {};
      const mejor = Object.keys(h).sort((a, b) => (Hist.NIVEL_HONOR[b] || 0) - (Hist.NIVEL_HONOR[a] || 0))[0];
      if (!mejor) return 'Sin cargo de elección';
      if (mejor === 'expresidente') return 'Presidente de la República';
      return (C.DATA.cargos[mejor] || { nombre: mejor }).nombre;
    },
    expresidentes(E) {
      const out = [];
      const J = E.jugador;
      if ((J.ocupados || []).includes('presidente')) out.push({ nombre: J.nombre, jugador: true, id: 'J' });
      for (const p of Object.values(E.politicos)) {
        if (p.id === 'J') continue;
        const h = p.honores || {};
        if (h.presidente || h.expresidente) out.push({ nombre: p.nombre, jugador: false, id: p.id, activo: p.activo });
      }
      return out;
    },
    render(el) {
      const E = C.E;
      const expres = Hist.expresidentes(E);
      const destacados = Object.values(E.politicos).filter(p => p.id !== 'J' && Hist.puntaje(p) > 0)
        .sort((a, b) => Hist.puntaje(b) - Hist.puntaje(a)).slice(0, 12);
      const dinastias = Object.values(E.politicos).filter(p => p.dinastia);
      const partidos = Object.values(E.partidos).filter(p => !p.especial && p.fundado)
        .sort((a, b) => (b.disueltoT || b.fundado * 100) - (a.disueltoT || a.fundado * 100));

      el.innerHTML = `<div class="cab"><div><h1>Salón de la Fama</h1><div class="sub">Expresidentes, políticos que dejaron huella, dinastías y el mapa de partidos a través del tiempo.</div></div></div>
      <div class="grid g-dash">
        <div class="col">
          <div class="tarjeta"><h3>🎖 Expresidentes de la República</h3>
            <div class="lista">${expres.length ? expres.map(e => `<div class="it"><span style="font-size:18px">🎖</span><div class="cuerpo"><b>${esc(e.nombre)}</b><span>${e.jugador ? 'Tú' : e.activo ? 'Sigue activo en política' : 'Retirado de la vida pública'}</span></div></div>`).join('') : '<div class="vacio">Todavía nadie ha llegado a la Presidencia.</div>'}</div></div>

          <div class="tarjeta"><h3>👪 Dinastías políticas</h3>
            <div class="lista">${dinastias.length ? dinastias.map(h => `<div class="it"><span style="font-size:18px">👪</span><div class="cuerpo"><b>${esc(h.nombre)}</b><span>Familia ${esc(h.dinastia.apellido)} · heredó el arrastre de ${esc(h.dinastia.padreNombre)}</span></div></div>`).join('') : '<div class="vacio">Ninguna dinastía política ha surgido todavía: hace falta que un político notable se retire para que un hijo herede su carrera.</div>'}
            ${E.jugador.legado ? `<div class="it"><span style="font-size:18px">👪</span><div class="cuerpo"><b>${esc(E.jugador.nombre)} (tú)</b><span>Continúa el legado de ${esc(E.jugador.legado.predecesor)}, familia ${esc(E.jugador.legado.apellido)}</span></div></div>` : ''}</div>
        </div>
        <div class="col">
          <div class="tarjeta"><h3>⭐ Políticos más destacados</h3>
            <div class="lista">${destacados.length ? destacados.map(p => `<div class="it"><span style="font-size:18px">⭐</span><div class="cuerpo"><b>${esc(p.nombre)}</b><span>${esc(Hist.cargoMasAlto(p))}${p.partido && E.partidos[p.partido] ? ' · ' + esc(E.partidos[p.partido].sigla) : ''} · ${p.aniosServicio || 0} año(s) en cargos · ${p.stats.aprobados || 0} ley(es) como autor${p.activo ? '' : ' · <span class="tenue">retirado</span>'}</span></div></div>`).join('') : '<div class="vacio">Todavía no hay trayectorias destacadas.</div>'}</div></div>

          <div class="tarjeta"><h3>🎗 Historial de partidos</h3>
            <div class="lista">${partidos.length ? partidos.map(p => `<div class="it"><span style="width:10px;height:10px;border-radius:50%;background:${p.color}"></span><div class="cuerpo"><b>${esc(p.nombre)}</b><span>Fundado en ${p.fundado}${p.disuelto ? ` · disuelto en ${U.fechaDe(p.disueltoT).getUTCFullYear()}` : ' · activo'}</span></div></div>`).join('') : '<div class="vacio">Sin partidos fundados durante la partida todavía.</div>'}</div></div>
        </div>
      </div>`;
    }
  };
  C.Pantallas.historia = Hist;
})(window.CURUL);
