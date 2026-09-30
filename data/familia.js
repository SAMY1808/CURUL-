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

/* Mercosur: controversias comerciales entre socios. */
(function (C) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const barrera = (E, s, pp, sem) => { E.comercio.retorsion[s] = { pp, hasta: E.fecha.t + sem }; };
  const trib = E => C.MercosurInst ? C.MercosurInst.nivel(E, 'tribunal') : 0;
  C.DATA.eventos.push(
    { id: 'controversiaMercosur', sistema: true, forzar: true, tipo: 'diplomacia', icono: '⚖', alcance: 'nacional', peso: 0,
      titulo: '{socio} restringe nuestras exportaciones', texto: '{socio} aplica {tema} a los productos colombianos, en contra de las reglas del bloque. Los exportadores piden una respuesta.',
      opciones: [
        { t: 'Demandar ante el mecanismo de solución de controversias', fn(E, ev) { const s = ev.ctx.socio, t = trib(E), rel = C.Comercio.relacion(E, s), p = clamp(0.3 + t * 0.14 + rel / 300, 0.15, 0.85); if (C.U.chance(p)) { const cumple = C.U.chance([0.35, 0.55, 0.8, 0.95][t]); if (cumple) { E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 1, 3, 95); return 'El fallo nos da la razón y el socio levanta la medida'; } barrera(E, s, 3, 26); return 'Ganas el fallo, pero el socio no lo cumple del todo (con un tribunal más fuerte sería obligatorio)'; } barrera(E, s, 3, 26); C.Comercio.moverRelacion(E, s, -1); return 'El fallo no te favorece: la medida sigue'; } },
        { t: 'Negociar directamente con su gobierno', fn(E, ev) { const s = ev.ctx.socio; if (C.U.chance(0.45)) return 'Se levanta la medida tras una reunión bilateral'; barrera(E, s, 3, 39); return 'La negociación se estanca: la medida continúa'; } },
        { t: 'Responder con una medida recíproca', fn(E, ev) { const s = ev.ctx.socio; barrera(E, s, 4, 26); C.Comercio.moverRelacion(E, s, -5); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 0.8, 3, 95); return 'Respondes en el mismo tono: aplauden en casa, se enfría el bloque'; } },
        { t: 'Aceptar la medida para no romper el bloque', fn(E, ev) { barrera(E, ev.ctx.socio, 3, 52); C.Comercio.moverRelacion(E, ev.ctx.socio, 2); return 'Cedes: los exportadores pagan la cuenta'; } }
      ] }
  );
})(window.CURUL);
