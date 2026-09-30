/* Servicio exterior: diáspora colombiana (miles de personas, aproximada) y los incidentes diplomáticos con
   decisiones. Los incidentes los dispara `Exterior.incidente` (sólo piden decisión si eres Presidente). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  C.DATA.diaspora = { USA: 2800, VEN: 2000, ESP: 800, ECU: 250, CHL: 200, PAN: 180, CAN: 160, MEX: 130, PER: 120, BRA: 90, ARG: 90, GBR: 90, ITA: 80, FRA: 70, DEU: 60, CRI: 60, AUS: 40, JPN: 20 };
  const emb = (E, ev) => (E.exterior && E.exterior.embajadas[ev.ctx.pais]) || null;
  const rel = (E, id, d) => { const st = E.diplomacia.paises[id]; if (st) st.relacion = clamp(st.relacion + d, 3, 97); };
  const ap = (E, d) => { E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + d, 3, 95); };
  const q = (E, ev) => { const e = emb(E, ev); return e && e.abierta && e.embajador ? e.embajador.calidad : 30; };

  C.DATA.eventos.push(
    { id: 'dipConnacionales', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🛂', alcance: 'nacional', peso: 0,
      titulo: 'Colombianos detenidos en {pais}', texto: 'Decenas de connacionales fueron detenidos en {pais}. Las familias llaman a los noticieros y la oposición pide que el Gobierno reaccione.',
      opciones: [
        { t: 'Activar la red consular y pedir su liberación', fn(E, ev) { const c = (E.exterior.consulados[ev.ctx.pais] || 0), p = clamp(0.3 + q(E, ev) / 150 + c * 0.08, 0.15, 0.9); if (C.U.chance(p)) { ap(E, 1.5); rel(E, ev.ctx.pais, 2); return 'Los liberan tras las gestiones consulares'; } ap(E, -1); return 'Las gestiones no logran resultados rápidos'; } },
        { t: 'Presionar públicamente al gobierno de ese país', fn(E, ev) { rel(E, ev.ctx.pais, -6); ap(E, 2); return 'El tono duro gusta en casa, pero enfría la relación'; } },
        { t: 'Dejar que sigan los canales judiciales', fn(E) { ap(E, -1); return 'Te critican por pasivo'; } }
      ] },
    { id: 'dipExpulsion', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🚫', alcance: 'nacional', peso: 0,
      titulo: '{pais} expulsa a nuestro embajador', texto: 'El gobierno de {pais} declara persona non grata a nuestro embajador tras un choque de declaraciones.',
      opciones: [
        { t: 'Responder expulsando a su embajador', fn(E, ev) { rel(E, ev.ctx.pais, -8); ap(E, 1.5); const e = emb(E, ev); if (e) { e.abierta = false; e.embajador = null; } return 'Se cierra la embajada; relación por el suelo'; } },
        { t: 'Buscar la reconciliación discreta', fn(E, ev) { const p = clamp(E.diplomacia.paises[ev.ctx.pais].relacion / 100, 0.15, 0.8); if (C.U.chance(p)) { rel(E, ev.ctx.pais, 6); return 'Se restablece el diálogo: el embajador vuelve'; } rel(E, ev.ctx.pais, -3); const e = emb(E, ev); if (e) { e.abierta = false; e.embajador = null; } return 'El intento fracasa y la embajada queda vacía'; } },
        { t: 'Suspender relaciones diplomáticas', fn(E, ev) { rel(E, ev.ctx.pais, -15); ap(E, C.U.chance(0.5) ? 1 : -2); const e = emb(E, ev); if (e) { e.abierta = false; e.embajador = null; } return 'Se rompen las relaciones'; } }
      ] },
    { id: 'dipMigracion', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🚸', alcance: 'nacional', peso: 0,
      titulo: 'Crisis migratoria en la frontera con {pais}', texto: 'Miles de personas cruzan la frontera desde {pais}. Los alcaldes fronterizos piden ayuda y los gremios piden orden.',
      opciones: [
        { t: 'Regularizar a los migrantes y acogerlos', fn(E, ev) { ap(E, -1.5); rel(E, ev.ctx.pais, 3); C.Economia.programar(E, [{ v: 'crecimiento', d: 0.05, p: 'm' }], 'migracion'); return 'Cuesta políticamente hoy, pero aporta a la economía mañana'; } },
        { t: 'Cerrar la frontera', fn(E, ev) { ap(E, 1); rel(E, ev.ctx.pais, -6); return 'Ganas el aplauso de los más duros y una relación tensa'; } },
        { t: 'Pedir ayuda internacional y organizar el flujo', fn(E, ev) { const p = clamp(0.3 + q(E, ev) / 200 + (E.diplomacia.organismos.onu && E.diplomacia.organismos.onu.miembro ? 0.15 : 0), 0.2, 0.85); if (C.U.chance(p)) { ap(E, 0.5); rel(E, 'USA', 3); return 'La cooperación internacional llega y alivia la presión'; } ap(E, -1); return 'La ayuda tarda y la crisis se siente'; } }
      ] },
    { id: 'dipCumbre', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🏳', alcance: 'nacional', peso: 0,
      titulo: 'Invitación a una cumbre regional', texto: 'Una cumbre de jefes de Estado reúne a la región. Tu presencia se notaría, pero la agenda interna aprieta.',
      opciones: [
        { t: 'Asistir personalmente', fn(E) { for (const p of C.Diplomacia.destacados()) rel(E, p.id, 1.2); ap(E, 0.5); E.jugador.agenda.puntos = Math.max(0, E.jugador.agenda.puntos - 2); return 'Ganas presencia regional'; } },
        { t: 'Enviar al canciller', fn(E) { for (const p of C.Diplomacia.destacados()) rel(E, p.id, 0.3); return 'Cumples con el protocolo sin gastar agenda'; } },
        { t: 'Declinar la invitación', fn(E) { for (const p of C.Diplomacia.destacados()) rel(E, p.id, -1); return 'Lo notan: la región te lee frío'; } }
      ] },
    { id: 'dipEmbajador', sistema: true, forzar: true, tipo: 'escándalo', icono: '🎩', alcance: 'nacional', peso: 0,
      titulo: 'Escándalo con nuestro embajador en {pais}', texto: 'La prensa revela un escándalo que involucra a nuestro embajador en {pais}: gastos suntuosos y declaraciones desafortunadas.',
      opciones: [
        { t: 'Destituirlo de inmediato', fn(E, ev) { const e = emb(E, ev); if (e) e.embajador = C.Exterior.generarCarrera(E); ap(E, 0.5); return 'Lo reemplazas por un diplomático de carrera'; } },
        { t: 'Respaldarlo públicamente', fn(E, ev) { ap(E, -1.5); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.3; return 'Cargas con el costo del escándalo'; } },
        { t: 'Trasladarlo discretamente', fn(E, ev) { rel(E, ev.ctx.pais, -1); const e = emb(E, ev); if (e) e.embajador = C.Exterior.generarCarrera(E); return 'El asunto se apaga sin ruido'; } }
      ] },
    { id: 'csnuVoto', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🗳', alcance: 'nacional', peso: 0,
      titulo: 'Voto clave en el Consejo de Seguridad', texto: 'Como miembro no permanente del Consejo de Seguridad de la ONU, Colombia debe votar una resolución que divide a las potencias.',
      opciones: [
        { t: 'Votar con Estados Unidos y Europa', fn(E) { rel(E, 'USA', 5); rel(E, 'DEU', 3); rel(E, 'FRA', 3); rel(E, 'RUS', -4); rel(E, 'CHN', -3); return 'Te alineas con Occidente'; } },
        { t: 'Votar con Rusia y China', fn(E) { rel(E, 'RUS', 5); rel(E, 'CHN', 5); rel(E, 'USA', -5); return 'Un giro que sorprende en Washington'; } },
        { t: 'Abstenerse', fn(E) { for (const p of C.Diplomacia.destacados()) rel(E, p.id, -0.4); ap(E, -0.5); return 'Nadie se enoja, nadie aplaude'; } }
      ] },
    { id: 'visitaIncidente', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🎩', alcance: 'nacional', peso: 0,
      titulo: 'Incidente de protocolo en {pais}', texto: 'En plena visita de Estado a {pais}, un desliz del protocolo —una declaración desafortunada, un desplante en la cena— se vuelve viral. La prensa de ambos países lo comenta.',
      opciones: [
        { t: 'Pedir disculpas públicas y con humor', fn(E, ev) { const p = clamp(0.4 + q(E, ev) / 200, 0.25, 0.9); if (C.U.chance(p)) { rel(E, ev.ctx.pais, 1); return 'El anfitrión sonríe y el asunto se disuelve'; } rel(E, ev.ctx.pais, -2); ap(E, -0.5); return 'Las disculpas se leen como forzadas'; } },
        { t: 'Quitarle importancia y seguir con la agenda', fn(E, ev) { const p = clamp(0.3 + q(E, ev) / 250, 0.2, 0.7); if (C.U.chance(p)) return 'Se olvida en dos días'; rel(E, ev.ctx.pais, -3); ap(E, -1); return 'La oposición y la prensa aprovechan el episodio'; } },
        { t: 'Culpar a la prensa de sacarlo de contexto', fn(E, ev) { ap(E, C.U.chance(0.5) ? 0.8 : -1.2); rel(E, ev.ctx.pais, -1.5); return 'Tus seguidores aplauden; el anfitrión frunce el ceño'; } }
      ] },
    { id: 'visitaEntrante', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🛬', alcance: 'nacional', peso: 0,
      titulo: '{pais} pide visitar Colombia', texto: 'El jefe de Estado de {pais} quiere hacer una visita oficial a Colombia y propone una agenda centrada en {tema}. La cancillería espera tu decisión.',
      opciones: [
        { t: 'Recibirlo con honores de Estado', fn(E, ev) { E.jugador.agenda.puntos = Math.max(0, E.jugador.agenda.puntos - 1); rel(E, ev.ctx.pais, 6); ap(E, 0.6); const k = ev.ctx.tema; if (k === 'comercial' || k === 'energia') C.Economia.programar(E, [{ v: 'inversion', d: 0.08, p: 'm' }, { v: 'exportaciones', d: 0.3, p: 'm' }], 'visita'); if (k === 'seguridad') for (const d of Object.values(E.deptos)) d.seguridad = clamp(d.seguridad + 0.3, 1, 99); return 'Una visita de gala que deja acuerdos y buena imagen'; } },
        { t: 'Reunión de trabajo sin ceremonia', fn(E, ev) { rel(E, ev.ctx.pais, 2.5); return 'Cumples sin gastar capital político'; } },
        { t: 'Excusarte: que lo reciba el canciller', fn(E, ev) { rel(E, ev.ctx.pais, -3); return 'Lo interpretan como desinterés'; } }
      ] }
  );
})(window.CURUL);
