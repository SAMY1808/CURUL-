/* Estado del mundo: creación vacía, versión de esquema y migraciones de partidas antiguas. */
window.CURUL = window.CURUL || {};
(function (C) {
  const ESQUEMA = 1;
  C.VERSION = '0.1.0';

  C.Estado = {
    ESQUEMA,
    vacio(semilla, inicioISO) {
      return {
        meta: { esquema: ESQUEMA, version: C.VERSION, semilla, rng: semilla >>> 0, sigId: 0,
                inicio: inicioISO, creado: Date.now(), nombrePartida: '', dificultad: 'normal' },
        fecha: { t: 0 },
        jugador: null,
        politicos: {},
        partidos: {},
        deptos: {},
        congreso: {},
        proyectos: {},
        votaciones: [],
        gobierno: {},
        economia: {},
        presupuesto: {},
        ministeriosExtra: [],
        opinion: {},
        ordenPublico: {},
        diplomacia: {},
        constitucion: {},
        redes: {},
        elecciones: { historico: [], campana: null, proxima: null, coaliciones: {} },
        medios: { lista: [], noticias: [] },
        eventos: { pendientes: [], historial: [] },
        agendaMundo: [],          // actividad del Congreso y del mundo (bitácora)
        series: {},
        ui: {}
      };
    },
    /* Añade campos que falten en partidas guardadas con esquemas anteriores. */
    migrar(E) {
      if (!E.meta) throw new Error('Partida inválida');
      const base = C.Estado.vacio(E.meta.semilla || 1, E.meta.inicio);
      for (const k of Object.keys(base)) if (E[k] === undefined) E[k] = base[k];
      // Partidas de la Fase 1 no traían presupuesto por sectores: se inicializa sobre la economía ya existente.
      if (C.Presupuesto && (!E.presupuesto || !E.presupuesto.vigente)) { const prev = C.E; C.E = E; C.Presupuesto.init(E); C.E = prev; }
      // Partidas previas a la Fase 3 (asambleas/concejos con voto real) no traen la corporación local.
      if (C.Corporaciones && (E.jugador.cargo === 'gobernador' || E.jugador.cargo === 'alcalde')) {
        const prev = C.E; C.E = E;
        C.Corporaciones.asegurar(E, E.jugador.cargoInfo.depto, E.jugador.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia');
        C.E = prev;
      }
      // Partidas previas a esta entrega: si el jugador es diputado o concejal, aún no tenía
      // ni curul propia en su Asamblea o Concejo ni forma de radicar ordenanzas/acuerdos.
      if (C.Corporaciones && (E.jugador.cargo === 'diputado' || E.jugador.cargo === 'concejal')) {
        const prev = C.E; C.E = E;
        C.Corporaciones.asegurarJugador(E);
        C.E = prev;
      }
      if (!E.opinion.aprobTemas) { E.opinion.aprobTemas = { seguridad: 50, economia: 50, salud: 50, corrupcion: 50 }; E.opinion.corrupcionAcum = 0; }
      if (E.jugador.riesgoJudicial == null) E.jugador.riesgoJudicial = 0;
      if (C.OrdenPublico && (!E.ordenPublico || !E.ordenPublico.grupos)) { const prev = C.E; C.E = E; C.OrdenPublico.init(E); C.E = prev; }
      if (C.Diplomacia && (!E.diplomacia || !E.diplomacia.organismos)) { const prev = C.E; C.E = E; C.Diplomacia.init(E); C.E = prev; }
      if (C.Constitucion && (!E.constitucion || !E.constitucion.articulos)) { const prev = C.E; C.E = E; C.Constitucion.init(E); C.E = prev; }
      if (C.Redes && (!E.redes || E.redes.viralidad == null)) { const prev = C.E; C.E = E; C.Redes.init(E); C.E = prev; }
      // Partidas previas a la Fase 17 no traen los actores sociales permanentes (Movilización).
      if (C.Movilizacion && (!E.movilizacion || !E.movilizacion.actores)) { const prev = C.E; C.E = E; C.Movilizacion.init(E); C.E = prev; }
      // Partidas previas a la Fase 19 no traen el comercio exterior (flujos, acuerdos, Mercosur).
      if (C.Comercio && (!E.comercio || !E.comercio.acuerdos || !E.comercio.mercosur)) { const prev = C.E; C.E = E; C.Comercio.migrar(E); C.E = prev; }
      // Partidas previas a la Fase 21 no traen la Corte Constitucional.
      if (C.Corte && (!E.corte || !E.corte.magistrados)) { const prev = C.E; C.E = E; C.Corte.migrar(E); C.E = prev; }
      // Partidas previas a la Fase 22 no traen la democracia directa (referendos, consultas, revocatoria).
      if (C.Participacion && (!E.participacion || !E.participacion.activos)) { const prev = C.E; C.E = E; C.Participacion.migrar(E); C.E = prev; }
      // Futuras migraciones: if (E.meta.esquema < 2) { … }
      E.meta.esquema = ESQUEMA;
      E.meta.version = C.VERSION;
      return E;
    }
  };
})(window.CURUL);
