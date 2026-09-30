/* Fuerzas armadas: incidentes en los frentes y decisión ante una guerra abierta. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const M = () => C.Militar, ap = (E, d) => { E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + d, 3, 95); };
  const fr = (E, ev) => M().frente(E, ev.ctx.frente);
  const rel = (E, id, d) => { const st = E.diplomacia.paises[id]; if (st) st.relacion = clamp(st.relacion + d, 3, 97); };
  C.DATA.eventos.push(
    { id: 'fronteraIncidente', sistema: true, forzar: true, tipo: 'seguridad', icono: '🚧', alcance: 'nacional', peso: 0,
      titulo: 'Incidente en el frente: {frente}', texto: 'Se reporta un incidente armado y protestas cruzadas con {pais}: una patrullera, una incursión, disparos en la frontera. La prensa pide una respuesta firme.',
      opciones: [
        { t: 'Nota de protesta y canales diplomáticos', fn(E, ev) { const f = fr(E, ev); f.tension = clamp(f.tension - 3, 3, 100); ap(E, -0.5); return 'Te critican por tibio, pero la tensión baja'; } },
        { t: 'Reforzar la presencia militar', fn(E, ev) { const f = fr(E, ev); f.tension = clamp(f.tension + 4, 3, 100); ap(E, 1.2); E.militar.moral = clamp(E.militar.moral + 2, 15, 95); return 'Muestras firmeza: sube la disuasión y la tensión'; } },
        { t: 'Responder con una acción limitada', fn(E, ev) { const f = fr(E, ev), fuerte = M().disuasion(E) > M().poderRival(E, ev.ctx.pais); if (fuerte) { f.tension = clamp(f.tension - 2, 3, 100); ap(E, 2); rel(E, ev.ctx.pais, -4); return 'La respuesta contundente funciona: el vecino retrocede'; } f.tension = clamp(f.tension + 12, 3, 100); ap(E, 0.5); rel(E, ev.ctx.pais, -8); return 'Responder sin ventaja escala la crisis'; } },
        { t: 'Denunciar ante la ONU y la OEA', fn(E, ev) { const f = fr(E, ev), p = clamp(0.3 + (E.diplomacia.organismos.onu && E.diplomacia.organismos.onu.miembro ? 0.15 : 0), 0.2, 0.7); if (C.U.chance(p)) { f.tension = clamp(f.tension - 8, 3, 100); f.mediacion = 20; return 'La comunidad internacional presiona a ambos lados'; } rel(E, ev.ctx.pais, -3); return 'La denuncia queda en comunicados'; } }
      ] },
    { id: 'guerraAbierta', sistema: true, forzar: true, tipo: 'seguridad', icono: '💥', alcance: 'nacional', peso: 0,
      titulo: 'Guerra con {pais}', texto: 'Estalla el conflicto armado con {pais}. El país espera una conducción clara: cada semana pesa el poder de las Fuerzas, las alianzas y la opinión.',
      opciones: [
        { t: 'Movilización general y economía de guerra', fn(E) { const m = E.militar; m.moral = clamp(m.moral + 6, 15, 95); m.guerra.avance += 6; C.Economia.programar(E, [{ v: 'deficit', d: 0.6, p: 'm' }, { v: 'crecimiento', d: -0.3, p: 'm' }], 'guerra'); ap(E, 2); return 'El país se pone en pie de guerra'; } },
        { t: 'Pedir apoyo a Estados Unidos y a los aliados', fn(E, ev) { const p = clamp(0.25 + (E.diplomacia.paises.USA ? E.diplomacia.paises.USA.relacion : 40) / 200, 0.2, 0.75); if (C.U.chance(p)) { E.militar.guerra.avance += 12; rel(E, 'USA', 3); return 'Llega apoyo de inteligencia y logística'; } rel(E, 'USA', -2); return 'Los aliados prefieren no involucrarse'; } },
        { t: 'Llevar el caso al Consejo de Seguridad', fn(E, ev) { const p = clamp(0.3 + (E.diplomacia.organismos.onu && E.diplomacia.organismos.onu.miembro ? 0.1 : 0) + (E.exterior && E.exterior.csnu.miembro ? 0.15 : 0), 0.2, 0.75); if (C.U.chance(p)) { E.militar.guerra.mediacion = 1; return 'La diplomacia se activa: el conflicto podría cerrarse antes'; } return 'El Consejo se divide y no actúa'; } },
        { t: 'Buscar un cese al fuego inmediato', fn(E, ev) { if (C.U.chance(0.4)) { M().terminarGuerra(E, E.militar, 'armisticio'); return 'Se logra un cese al fuego casi de inmediato'; } ap(E, -1); return 'El otro bando rechaza la propuesta'; } }
      ] }
  );
})(window.CURUL);
