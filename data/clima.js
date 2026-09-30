/* Clima, alimentos, racionamiento y migración: decisiones del Presidente. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ap = (E, d) => { E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + d, 3, 95); };
  const ec = (E, ef, o) => C.Economia.programar(E, ef, o);
  C.DATA.eventos.push(
    { id: 'elNino', sistema: true, forzar: true, tipo: 'economía', icono: '☀', alcance: 'nacional', peso: 0,
      titulo: 'Llega El Niño', texto: 'El IDEAM confirma un fenómeno de El Niño: sequía en el campo, riesgo de incendios y embalses a la baja. Toca decidir cómo prepararse.',
      opciones: [
        { t: 'Plan de ahorro de agua y energía', fn(E) { const c = C.Clima.asegurar(E); c.embalses = clamp(c.embalses + 6, 5, 100); ec(E, [{ v: 'deficit', d: 0.1, p: 'm' }], 'elnino'); ap(E, -0.3); return 'La campaña ayuda a cuidar el agua y la energía'; } },
        { t: 'Subsidios y crédito para el campo', fn(E) { const c = C.Clima.asegurar(E); c.alimentos = clamp(c.alimentos - 6, 70, 220); ec(E, [{ v: 'deficit', d: 0.3, p: 'm' }], 'elnino'); ap(E, 1); return 'Los agricultores respiran, las cuentas sufren'; } },
        { t: 'Importar energía y contratar plantas térmicas', fn(E) { const c = C.Clima.asegurar(E); c.embalses = clamp(c.embalses + 10, 5, 100); ec(E, [{ v: 'inflacion', d: 0.2, p: 'm' }, { v: 'deficit', d: 0.2, p: 'm' }], 'elnino'); return 'Más seguridad energética a un costo mayor'; } },
        { t: 'Esperar y ver', fn(E) { ap(E, -0.6); return 'Te acusan de imprevisión'; } }
      ] },
    { id: 'laNina', sistema: true, forzar: true, tipo: 'economía', icono: '🌧', alcance: 'nacional', peso: 0,
      titulo: 'Llega La Niña', texto: 'Se anuncia una temporada de lluvias intensas: ríos crecidos, riesgo de inundaciones y deslizamientos en las regiones más vulnerables.',
      opciones: [
        { t: 'Declarar calamidad y adelantar obras de mitigación', fn(E) { ec(E, [{ v: 'deficit', d: 0.3, p: 'm' }], 'lanina'); for (const d of Object.values(E.deptos)) if (C.U.chance(0.3)) d.infraestructura = clamp(d.infraestructura + 0.6, 1, 99); ap(E, 0.6); return 'Las obras preventivas amortiguan el golpe'; } },
        { t: 'Reforzar la atención de emergencias', fn(E) { ec(E, [{ v: 'deficit', d: 0.1, p: 'm' }], 'lanina'); ap(E, 0.2); return 'Organismos de socorro listos para la temporada'; } },
        { t: 'No gastar antes de que haya daños', fn(E) { for (const d of Object.values(E.deptos)) if (C.U.chance(0.25)) d.infraestructura = clamp(d.infraestructura - 0.8, 1, 99); ap(E, -0.8); return 'Cuando llegan las lluvias, la falta de preparación se nota'; } }
      ] },
    { id: 'racionamiento', sistema: true, forzar: true, tipo: 'economía', icono: '💡', alcance: 'nacional', peso: 0,
      titulo: 'Riesgo de racionamiento eléctrico', texto: 'Los embalses están en niveles críticos. Los expertos advierten que sin medidas habrá apagones.',
      opciones: [
        { t: 'Campaña masiva de ahorro y horarios de consumo', fn(E) { const c = C.Clima.asegurar(E); c.embalses = clamp(c.embalses + 8, 5, 100); ap(E, -0.5); return 'Los colombianos ahorran y se evita lo peor'; } },
        { t: 'Racionamiento programado', fn(E) { ec(E, [{ v: 'crecimiento', d: -0.3, p: 'm' }], 'racion'); ap(E, -3); return 'Cortes programados: la molestia es grande, se protege el sistema'; } },
        { t: 'Comprar energía a vecinos y activar térmicas', fn(E) { const c = C.Clima.asegurar(E); c.embalses = clamp(c.embalses + 12, 5, 100); ec(E, [{ v: 'inflacion', d: 0.25, p: 'm' }, { v: 'deficit', d: 0.25, p: 'm' }], 'racion'); return 'El sistema aguanta, pero la factura sube'; } }
      ] },
    { id: 'crisisAlimentos', sistema: true, forzar: true, tipo: 'economía', icono: '🛒', alcance: 'nacional', peso: 0,
      titulo: 'Se disparan los precios de los alimentos', texto: 'El índice de precios de alimentos llega a {indice}. Las familias recortan la canasta y los gremios se dividen sobre qué hacer.',
      opciones: [
        { t: 'Importar alimentos y reducir aranceles', fn(E) { const c = C.Clima.asegurar(E); c.alimentos = clamp(c.alimentos - 12, 70, 220); ap(E, 0.4); E.movilizacion && C.Comercio && C.Comercio.tocarActor(E, 'agrario', 6); return 'Bajan los precios, pero el campo protesta'; } },
        { t: 'Subsidiar la canasta básica', fn(E) { const c = C.Clima.asegurar(E); c.alimentos = clamp(c.alimentos - 8, 70, 220); ec(E, [{ v: 'deficit', d: 0.35, p: 'm' }], 'alimentos'); ap(E, 1.2); return 'Alivias el bolsillo con costo fiscal'; } },
        { t: 'Control de precios', fn(E) { const c = C.Clima.asegurar(E); c.alimentos = clamp(c.alimentos - 10, 70, 220); ec(E, [{ v: 'inversion', d: -0.08, p: 'm' }], 'alimentos'); ap(E, 0.8); return 'Funciona a corto plazo; los productores se quejan'; } },
        { t: 'Dejar que el mercado ajuste', fn(E) { ap(E, -1.2); return 'Pagas el costo político de no hacer nada'; } }
      ] },
    { id: 'olaMigratoria', sistema: true, forzar: true, tipo: 'diplomacia', icono: '🚸', alcance: 'nacional', peso: 0,
      titulo: 'Nueva ola migratoria', texto: 'Miles de personas más cruzan la frontera huyendo de la crisis en el vecindario. Ya hay {migrantes} millones de migrantes en Colombia y los alcaldes fronterizos piden ayuda.',
      opciones: [
        { t: 'Ampliar el estatuto de regularización', fn(E) { const c = C.Clima.asegurar(E); c.integracion = clamp(c.integracion + 10, 0, 100); ap(E, -0.5); ec(E, [{ v: 'deficit', d: 0.1, p: 'm' }], 'migracion'); return 'Más migrantes integrados a la economía formal'; } },
        { t: 'Reforzar la frontera', fn(E) { const c = C.Clima.asegurar(E); c.flujo = clamp(c.flujo - 0.4, 0, 3); ap(E, 0.8); return 'Baja el flujo por los pasos formales'; } },
        { t: 'Llamar a la comunidad internacional', fn(E) { const ok = C.U.chance(0.5); if (ok) { C.Clima.asegurar(E).integracion = clamp(C.Clima.asegurar(E).integracion + 8, 0, 100); ec(E, [{ v: 'deficit', d: -0.12, p: 'm' }], 'ayudaint'); return 'Llega financiación de organismos internacionales'; } return 'La ayuda prometida no llega a tiempo'; } }
      ] }
  );
})(window.CURUL);
