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

  C.DATA.eventos.push(
    { id: 'coalicionCobra', sistema: true, forzar: true, tipo: 'política', icono: '🤝', alcance: 'nacional', peso: 0,
      titulo: '{partido} amenaza con irse de la coalición', texto: 'La bancada de {partido} dice que no se siente representada en el Gobierno: reclama ministerios y obras para sus regiones, o votará por su cuenta.',
      opciones: [
        { t: 'Entregarles un ministerio', fn(E, ev) {
          const g = E.gobierno, pid = ev.ctx.pid, pa = E.partidos[pid]; if (!pa) return 'El partido ya no existe';
          const mins = C.Gobierno.todosMinisterios(E).filter(m => { const x = E.politicos[g.gabinete[m.id]]; return !x || x.partido !== pid; });
          const m = mins.find(m => { const x = E.politicos[g.gabinete[m.id]]; return !x || !x.partido; }) || mins[0];
          if (m) C.Gobierno.designar(E, m.id, pid);
          pa.satisfaccion = (pa.satisfaccion || 0) + 12; pa.relJ = clamp(pa.relJ + 8, -100, 100);
          return 'Les entregas una cartera: el partido se aplaca'; } },
        { t: 'Comprometer obras y regalías para sus regiones', fn(E, ev) {
          const pa = E.partidos[ev.ctx.pid]; if (!pa) return ''; pa.satisfaccion = (pa.satisfaccion || 0) + 7; pa.relJ = clamp(pa.relJ + 10, -100, 100); C.Economia.aplicarDelta(E, 'deficit', 0.1);
          return 'Prometes obras: se calman, pero sube el gasto'; } },
        { t: 'Dejarlos ir', fn(E, ev) {
          const g = E.gobierno, pa = E.partidos[ev.ctx.pid]; if (!pa) return '';
          g.coalicion = g.coalicion.filter(x => x !== pa.id); pa.postura = 'oposicion'; E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres - 0.5, 3, 95);
          C.Medios.noticia(E, { tipo: 'politica', titular: `${pa.nombre} rompe con el Gobierno y pasa a la oposición`, tono: -1, importante: true });
          return 'La coalición pierde una bancada'; } }
      ] }
  );

  /* Choques de la economía mundial (los dispara MundoEco, con decisiones sólo si eres Presidente). */
  const ec = (E, ef, o) => C.Economia.programar(E, ef, o || 'choque');
  C.DATA.eventos.push(
    { id: 'recesionGlobal', sistema: true, forzar: true, tipo: 'economía', icono: '🌐', alcance: 'nacional', peso: 0,
      titulo: '{titulo}', texto: '{texto}',
      opciones: [
        { t: 'Estímulo fiscal: gastar para amortiguar', fn(E) { ec(E, [{ v: 'crecimiento', d: 0.5, p: 'm' }, { v: 'desempleo', d: -0.3, p: 'm' }, { v: 'deficit', d: 0.6, p: 'm' }], 'estimulo'); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 1, 3, 95); return 'Amortiguas el golpe, a cambio de más déficit'; } },
        { t: 'Austeridad: proteger las cuentas', fn(E) { ec(E, [{ v: 'crecimiento', d: -0.4, p: 'm' }, { v: 'desempleo', d: 0.4, p: 'm' }, { v: 'deficit', d: -0.4, p: 'm' }], 'austeridad'); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres - 1.5, 3, 95); return 'Cuidas el déficit, pero la calle lo siente'; } },
        { t: 'Pedir una línea de crédito al FMI', fn(E) { ec(E, [{ v: 'crecimiento', d: 0.25, p: 'm' }, { v: 'deuda', d: 1.2, p: 'm' }], 'fmi'); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres - 0.5, 3, 95); return 'Consigues liquidez con condicionalidades'; } }
      ] },
    { id: 'petroleoBaja', sistema: true, forzar: true, tipo: 'economía', icono: '🛢', alcance: 'nacional', peso: 0,
      titulo: 'Se desploma el precio del petróleo', texto: 'El barril cae con fuerza. Se achican las exportaciones, las regalías y el recaudo, y el dólar se dispara.',
      opciones: [
        { t: 'Recortar el gasto y ajustar el presupuesto', fn(E) { ec(E, [{ v: 'deficit', d: -0.5, p: 'm' }, { v: 'crecimiento', d: -0.3, p: 'm' }], 'ajuste'); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres - 1.5, 3, 95); return 'Ajustas: se contiene el hueco fiscal'; } },
        { t: 'Usar el fondo de estabilización', fn(E) { const m = E.mundoEco; if (m.fondo >= 100) { m.fondo -= 100; ec(E, [{ v: 'crecimiento', d: 0.25, p: 'm' }], 'fondo'); return 'El fondo amortigua el golpe'; } ec(E, [{ v: 'deficit', d: 0.5, p: 'm' }], 'sinfondo'); return 'No hay fondo suficiente: el déficit se dispara'; } },
        { t: 'Endeudarte para mantener el gasto', fn(E) { ec(E, [{ v: 'deuda', d: 1.5, p: 'm' }, { v: 'deficit', d: 0.4, p: 'm' }], 'deuda'); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 0.5, 3, 95); return 'Sostienes el gasto hoy y pagas mañana'; } }
      ] },
    { id: 'petroleoAlza', sistema: true, forzar: true, tipo: 'economía', icono: '🛢', alcance: 'nacional', peso: 0,
      titulo: 'Bonanza petrolera', texto: 'El barril se dispara: entran regalías, dólares y recaudo extra. Todos quieren su parte.',
      opciones: [
        { t: 'Ahorrar en el fondo de estabilización', fn(E) { E.mundoEco.fondo += 200; ec(E, [{ v: 'deficit', d: -0.3, p: 'm' }], 'ahorro'); return 'Guardas para los años flacos'; } },
        { t: 'Aumentar el gasto social e inversión', fn(E) { ec(E, [{ v: 'crecimiento', d: 0.4, p: 'm' }, { v: 'deficit', d: 0.3, p: 'm' }, { v: 'pobreza', d: -0.3, p: 'l' }], 'bonanza'); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 2, 3, 95); return 'La bonanza se siente en las calles'; } },
        { t: 'Bajar impuestos', fn(E) { ec(E, [{ v: 'inversion', d: 0.4, p: 'm' }, { v: 'deficit', d: 0.4, p: 'm' }], 'impuestos'); E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 1, 3, 95); return 'Los inversionistas aplauden'; } }
      ] },
    { id: 'pandemia', sistema: true, forzar: true, tipo: 'salud', icono: '🦠', alcance: 'nacional', peso: 0,
      titulo: 'Llega una pandemia', texto: 'Un virus desconocido se expande por el mundo y ya hay casos en el país. Hay que decidir cómo responder.',
      opciones: [
        { t: 'Cuarentena estricta', fn(E) { E.mundoEco.pandemia.medida = 'estricta'; E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 4, 3, 95); return 'Encierras al país: se salvan vidas, cae la economía'; } },
        { t: 'Cuarentena focalizada y pruebas', fn(E) { E.mundoEco.pandemia.medida = 'focalizada'; E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + 1, 3, 95); return 'Buscas un punto medio entre vidas y empleo'; } },
        { t: 'No cerrar la economía', fn(E) { E.mundoEco.pandemia.medida = 'abierta'; E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres - 1, 3, 95); return 'La economía sigue, los hospitales se llenan'; } }
      ] }
  );

  C.DATA.eventos.push(
    { id: 'paroEmpresa', sistema: true, forzar: true, tipo: 'regional', icono: '✊', alcance: 'jugador', peso: 0,
      titulo: 'Paro sindical en {empresa}', texto: 'El sindicato paraliza {empresa} exigiendo mejores salarios y garantías. El servicio se resiente y la ciudadanía te mira.',
      opciones: [
        { t: 'Negociar y ceder en lo salarial', fn(E, ev) { const e = E.empresas.lista.find(x => x.id === ev.ctx.emp); if (e) { e.paro = null; e.sindicato = Math.max(25, e.sindicato - 22); e.rentabilidad -= 0.8; } return 'Se levanta el paro; sube el costo laboral'; } },
        { t: 'Mantener la línea dura', fn(E, ev) { const e = E.empresas.lista.find(x => x.id === ev.ctx.emp); if (e) { e.sindicato = clamp(e.sindicato + 6, 0, 100); e.calidad = clamp(e.calidad - 3, 15, 98); } E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.2; return 'El paro se prolonga y el servicio se deteriora'; } },
        { t: 'Recurrir a la fuerza pública y contratar reemplazos', fn(E, ev) { const e = E.empresas.lista.find(x => x.id === ev.ctx.emp); if (e) { e.paro = null; e.sindicato = clamp(e.sindicato + 10, 0, 100); } C.Opinion.moverImagen(E, { seg: { bajos: -2, formales: -2 } }); return 'Rompes el paro, pero pierdes apoyo entre los trabajadores'; } }
      ] }
  );
})(window.CURUL);
