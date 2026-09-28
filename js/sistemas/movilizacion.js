/* Movilización social: actores sociales permanentes (sindicatos, gremios, movimiento estudiantil,
   indígena y agrario) que acumulan descontento según indicadores reales del juego y, si nadie los
   atiende, convocan un paro con un pliego de peticiones concreto. Como presidente puedes dialogar
   (ceder algo a cambio de calma), atender el pliego por completo, o reprimir — con el riesgo real
   de que se te vaya la mano. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const ACTORES = [
    { id: 'cut', nombre: 'Central de Trabajadores', sigla: 'CUT', sector: 'empleo', causa: 'el desempleo y las condiciones laborales' },
    { id: 'gremios', nombre: 'Gremios Empresariales', sigla: 'ANDI', sector: 'comercio', causa: 'la carga tributaria y la seguridad jurídica' },
    { id: 'estudiantil', nombre: 'Movimiento Estudiantil', sigla: 'MOES', sector: 'educacion', causa: 'la financiación de la educación pública' },
    { id: 'indigena', nombre: 'Movimiento Indígena', sigla: 'ONIC', sector: 'paz', causa: 'el cumplimiento de acuerdos y la protección territorial' },
    { id: 'agrario', nombre: 'Movimiento Agrario', sigla: 'FENSA', sector: 'agricultura', causa: 'los precios del campo y la reforma rural' }
  ];
  /* Señal 0 = neutral; positiva empeora el malestar del sector, negativa lo calma. */
  const SENAL = {
    cut: E => (E.economia.desempleo - 9) * 1.2,
    gremios: E => (E.economia.deficit - 3) * 1.5,
    estudiantil: E => 50 - U.prom(Object.values(E.deptos).map(d => d.educacion)),
    indigena: E => Object.values(E.ordenPublico.grupos).some(g => g.negociacion && g.negociacion.fase === 'agenda' && E.fecha.t - g.negociacion.t > 40) ? 15 : -6,
    agrario: E => (E.economia.pobreza - 28) * 0.9
  };

  const Mov = {
    ACTORES,
    init(E) {
      const actores = {};
      for (const a of ACTORES) {
        const lider = C.Politicos.crear(E, { partido: null, depto: U.pesado(C.DATA.departamentos, d => d.poblacion).id, r: { amb: U.ri(50, 90) } });
        actores[a.id] = { descontento: U.ri(15, 35), relJ: 0, lider: lider.id, paro: null };
      }
      E.movilizacion = { actores };
    },
    actor(E, id) { return E.movilizacion.actores[id]; },
    /* Pliego de peticiones: concreto y ligado a la causa del actor, no genérico. */
    PLIEGOS: {
      cut: 'un aumento real del salario mínimo y freno a la tercerización laboral',
      gremios: 'bajar la carga tributaria y dar garantías a la inversión',
      estudiantil: 'más presupuesto para matrícula y bienestar universitario',
      indigena: 'cumplir los acuerdos pendientes y proteger los territorios colectivos',
      agrario: 'precios de sustentación para las cosechas y avanzar la reforma rural'
    },
    iniciarParo(E, id) {
      const a = Mov.actor(E, id), def = ACTORES.find(x => x.id === id);
      a.paro = { t: E.fecha.t, intensidad: 1 };
      C.Medios.noticia(E, { tipo: 'evento', titular: `${def.nombre} (${def.sigla}) convoca un paro nacional: exige ${Mov.PLIEGOS[id]}`, tono: -1, importante: true });
    },
    /* Mientras el paro sigue sin resolverse, escala: más golpe a la seguridad y a la aprobación. */
    turnoParo(E, id) {
      const a = Mov.actor(E, id);
      const p = a.paro; if (!p) return;
      p.intensidad = U.clamp(p.intensidad + 0.06, 1, 4);
      const deptos = Object.values(E.deptos).sort((x, y) => y.poblacion - x.poblacion).slice(0, 4);
      for (const d of deptos) d.seguridad = U.clamp(d.seguridad - U.rf(0.1, 0.3) * p.intensidad, 1, 99);
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(0.05, 0.2) * p.intensidad, 0, 100);
    },
    terminarParo(E, id, motivo) {
      const a = Mov.actor(E, id);
      a.paro = null;
      C.Politicos.anotar(E.politicos[a.lider], motivo);
    },
    resolverDialogo(E, id) {
      const J = E.jugador, a = Mov.actor(E, id), def = ACTORES.find(x => x.id === id);
      const prob = U.clamp(0.3 + J.atributos.negociacion / 200 + (a.relJ || 0) / 250, 0.1, 0.85);
      const exito = U.chance(prob);
      if (exito) {
        a.descontento = U.clamp(a.descontento - U.ri(30, 45), 0, 100);
        a.relJ = U.clamp(a.relJ + 8, -100, 100);
        Mov.terminarParo(E, id, 'Acepta una salida negociada con el Gobierno');
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno llega a un acuerdo parcial con ${def.sigla} y levanta el paro`, tono: 1, importante: true, jugador: true });
      } else {
        a.relJ = U.clamp((a.relJ || 0) - 3, -100, 100);
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `${def.sigla} rechaza la propuesta del Gobierno y mantiene el paro`, tono: -1, jugador: true });
      }
      return { exito };
    },
    atenderPliego(E, id) {
      const J = E.jugador, a = Mov.actor(E, id), def = ACTORES.find(x => x.id === id);
      a.descontento = 8;
      a.relJ = U.clamp((a.relJ || 0) + 20, -100, 100);
      Mov.terminarParo(E, id, 'El Gobierno atiende el pliego por completo');
      E.economia.deficit = U.clamp(E.economia.deficit + U.rf(0.1, 0.4), 0, 15);
      E.opinion.aprobTemas.economia = U.clamp(E.opinion.aprobTemas.economia - U.rf(0.5, 1.5), 3, 95);
      J.rep.liderazgo = U.clamp(J.rep.liderazgo + 1, 0, 100);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno cede al pliego de ${def.sigla} por completo: ${Mov.PLIEGOS[id]}`, tono: 0, importante: true, jugador: true });
    },
    reprimir(E, id) {
      const J = E.jugador, a = Mov.actor(E, id), def = ACTORES.find(x => x.id === id);
      const grave = U.chance(U.clamp(0.15 + (a.paro ? a.paro.intensidad * 0.08 : 0), 0.1, 0.55));
      a.descontento = U.clamp(a.descontento - U.ri(10, 20), 0, 100);
      a.relJ = U.clamp((a.relJ || 0) - (grave ? 25 : 12), -100, 100);
      Mov.terminarParo(E, id, grave ? 'El Gobierno dispersa la protesta por la fuerza: hay heridos' : 'El Gobierno dispersa la protesta');
      if (grave) {
        J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + U.ri(8, 16), 0, 100);
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(1.5, 3.5), 0, 100);
        C.Medios.noticia(E, { tipo: 'escandalo', titular: `Denuncian uso excesivo de la fuerza contra ${def.sigla}: hay heridos y un llamado de atención internacional`, tono: -1, importante: true, jugador: true });
      } else {
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(0.3, 0.9), 0, 100);
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno dispersa el paro de ${def.sigla}`, tono: -1, jugador: true });
      }
      return { grave };
    },

    turno(E) {
      for (const a of ACTORES) {
        const st = Mov.actor(E, a.id);
        const senal = (SENAL[a.id] || (() => 0))(E);
        st.descontento = U.clamp(st.descontento + U.clamp(senal * 0.06, -2.5, 2.5) - 0.4 + U.gauss(0, 0.5), 0, 100);
        if (st.paro) { Mov.turnoParo(E, a.id); continue; }
        if (st.descontento > 72 && U.chance(U.clamp((st.descontento - 68) / 900, 0, 0.05))) Mov.iniciarParo(E, a.id);
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      const esPres = E => E.gobierno.presidente === 'J';
      const hayParo = (E, a) => {
        if (!esPres(E)) return 'Sólo el presidente puede responder a un paro nacional';
        const st = Mov.actor(E, a.actor); if (!st) return 'Actor social no disponible';
        return st.paro ? true : 'No hay un paro activo con ese actor';
      };
      A.registrar({ id: 'dialogarMovimiento', nombre: 'Abrir mesa de diálogo', icono: '🤝', grupo: 'social', costo: 1,
        disponible: hayParo,
        ejecutar(E, a) { const r = Mov.resolverDialogo(E, a.actor); return { ok: true, msg: r.exito ? 'Llegan a un acuerdo: el paro se levanta' : 'No hay acuerdo: el paro continúa', exito: r.exito }; } });
      A.registrar({ id: 'atenderPliegoMovimiento', nombre: 'Atender el pliego por completo', icono: '📋', grupo: 'social', costo: 2,
        disponible: hayParo,
        ejecutar(E, a) { Mov.atenderPliego(E, a.actor); return { ok: true, msg: 'Cedes al pliego completo: el paro se levanta' }; } });
      A.registrar({ id: 'reprimirMovimiento', nombre: 'Dispersar por la fuerza', icono: '🛡', grupo: 'social', costo: 1,
        disponible: hayParo,
        ejecutar(E, a) { const r = Mov.reprimir(E, a.actor); return { ok: true, msg: r.grave ? 'Dispersas el paro, pero con un costo alto' : 'Dispersas el paro', grave: r.grave }; } });
    }
  };

  C.Movilizacion = Mov;
  Mov.registrarAcciones();
  C.Tiempo.registrar('movilizacion', Mov, 45);
})(window.CURUL);
