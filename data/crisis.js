/* Eventos de sistema con decisiones (los dispara el código, no el azar general): escándalos del jugador,
   crisis de salud y —más abajo, en otros bloques— incidentes diplomáticos, crisis de coalición y choques
   globales. Cada opción trae `fn(E, ev)`, que aplica sus consecuencias y devuelve un texto opcional. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const U = () => C.U;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const g = ev => (ev.ctx && ev.ctx.grav) || 1;

  C.DATA.eventos.push(
    { id: 'escandaloJ', sistema: true, forzar: true, tipo: 'escándalo', icono: '🔥', alcance: 'jugador', peso: 0,
      titulo: '{titulo}', texto: '{texto}',
      opciones: [
        { t: 'Negarlo todo', fn(E, ev) {
          const J = E.jugador, u = U(), p = clamp(0.35 + (J.rep.honestidad - 50) / 150 - g(ev) * 0.08, 0.1, 0.8);
          if (u.chance(p)) { J.credibilidad = clamp(J.credibilidad + 2, 0, 100); E.opinion.escandalos = Math.max(0, E.opinion.escandalos - 0.3 * g(ev)); return 'La versión se sostiene y el escándalo se enfría'; }
          J.credibilidad = clamp(J.credibilidad - (5 + 3 * g(ev)), 0, 100); E.opinion.escandalos += 0.5 * g(ev); J.riesgoJudicial = clamp((J.riesgoJudicial || 0) + 3, 0, 100);
          return 'Te desmienten con pruebas: el escándalo crece'; } },
        { t: 'Culpar a un colaborador', fn(E, ev) {
          const J = E.jugador; E.opinion.escandalos = Math.max(0, E.opinion.escandalos - 0.5 * g(ev)); J.rep.honestidad = clamp(J.rep.honestidad - 4, 0, 100);
          const pa = E.partidos[J.partido]; if (pa) pa.relJ = clamp(pa.relJ - 4, -100, 100);
          return 'Un colaborador cae en tu lugar: baja la presión, pero pierdes lealtades'; } },
        { t: 'Pedir perdón y asumir las consecuencias', fn(E, ev) {
          const J = E.jugador; J.rep.honestidad = clamp(J.rep.honestidad + 3, 0, 100); J.credibilidad = clamp(J.credibilidad + 2, 0, 100); J.riesgoJudicial = clamp((J.riesgoJudicial || 0) - 3, 0, 100);
          C.Opinion.moverImagen(E, { seg: { bajos: -g(ev), medios: -g(ev), altos: -g(ev) } });
          return 'Asumes el error: pierdes algo de imagen, ganas credibilidad'; } },
        { t: 'Contraatacar en los medios', fn(E, ev) {
          const J = E.jugador, u = U(), p = clamp(0.3 + J.atributos.carisma / 300 + J.redes / 400, 0.15, 0.7);
          if (u.chance(p)) { C.Opinion.subirRec(E, 2); E.opinion.escandalos = Math.max(0, E.opinion.escandalos - 0.3 * g(ev)); return 'Cambias la conversación y salvas la semana'; }
          J.credibilidad = clamp(J.credibilidad - 4, 0, 100); E.opinion.escandalos += 0.3 * g(ev); return 'El contraataque parece desesperado y se te devuelve'; } },
        { t: 'Guardar silencio y esperar', fn(E) { E.opinion.escandalos = Math.max(0, E.opinion.escandalos - 0.1); return 'No dices nada: el escándalo se apaga lento'; } }
      ] },
    { id: 'saludCrisis', sistema: true, forzar: true, tipo: 'personal', icono: '🩺', alcance: 'jugador', peso: 0,
      titulo: 'Tu cuerpo te pasa la cuenta', texto: 'Semanas sin descanso terminan en un mareo y una visita de urgencias. El médico es claro: hay que parar.',
      opciones: [
        { t: 'Hospitalizarme y descansar', fn(E) { const J = E.jugador; J.salud = clamp((J.salud || 60) + 18, 0, 100); J.bienestar = clamp((J.bienestar || 60) + 18, 0, 100); J.agenda.puntos = Math.max(0, J.agenda.puntos - 3); C.Opinion.subirRec(E, -0.5); return 'Te recuperas, aunque pierdes visibilidad'; } },
        { t: 'Seguir trabajando como si nada', fn(E) { const J = E.jugador, u = U(); J.salud = clamp((J.salud || 60) - 8, 0, 100); if (u.chance(0.18)) { J.salud = clamp(J.salud - 12, 0, 100); return 'Te desplomas en público: la salud queda muy resentida'; } return 'Aguantas... por ahora'; } },
        { t: 'Delegar y bajar el ritmo', fn(E) { const J = E.jugador; J.salud = clamp((J.salud || 60) + 8, 0, 100); J.bienestar = clamp((J.bienestar || 60) + 10, 0, 100); J.agenda.puntos = Math.max(0, J.agenda.puntos - 1); return 'Delegas lo urgente y recuperas el aliento'; } }
      ] }
  );
})(window.CURUL);
