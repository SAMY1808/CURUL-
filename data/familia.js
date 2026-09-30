/* Familia: un hijo adulto quiere entrar a la política. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const hijo = (E, ev) => (E.jugador.familia || []).find(f => f.id === ev.ctx.hijo);
  C.DATA.eventos.push(
    { id: 'hijoPolitica', sistema: true, forzar: true, tipo: 'personal', icono: '👪', alcance: 'jugador', peso: 0,
      titulo: '{hijo} quiere entrar a la política', texto: '{hijo}, tu hijo, te dice que quiere dedicarse a la política. Los cuadros de tu partido ya comentan que el apellido pesa.',
      opciones: [
        { t: 'Apoyarlo: que arranque con el Concejo', fn(E, ev) { const h = hijo(E, ev); if (!h || h.politicoId) return 'Nada que hacer'; C.Familia.entrarEnPolitica(E, h, 'concejo'); h.relacion = Math.min(100, h.relacion + 6); return 'Arranca su carrera política bajo tu apellido'; } },
        { t: 'Aconsejarle que termine de formarse primero', fn(E, ev) { const h = hijo(E, ev); if (h) { h.relacion = Math.min(100, h.relacion + 2); h.atributos.gestion = Math.min(100, h.atributos.gestion + 4); } return 'Lo piensa y se prepara mejor'; } },
        { t: 'Disuadirlo: la política es un mal camino', fn(E, ev) { const h = hijo(E, ev); if (h) h.relacion = Math.max(0, h.relacion - 8); return 'Se aleja, aunque te hace caso por ahora'; } }
      ] }
  );
})(window.CURUL);
