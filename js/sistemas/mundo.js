/* Generación procedural del mundo político a partir de una semilla y de un año de inicio libre
   (1900-2026). El Congreso y la Presidencia sólo cambian de manos en años de ciclo (cada 4 años,
   sincronizados con el calendario moderno hacia atrás y hacia adelante); si el año elegido no es
   uno de ellos, se simula la instalación del ciclo anterior y se avanza en silencio hasta la fecha
   pedida, así que el mundo que el jugador encuentra ya tiene una historia real detrás, no un
   estado fabricado a mano. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const ANIO_MIN = 1900, ANIO_MAX = 2026;
  /* Año de ciclo (instalación del Congreso) más reciente en o antes de `anio`. */
  const cicloDe = anio => anio - (((anio - 2026) % 4) + 4) % 4;

  const Mundo = {
    ANIO_MIN, ANIO_MAX, cicloDe,
    /* Nota histórica breve para la pantalla de creación, según la época elegida. */
    notaEpoca(anio) {
      if (anio < 1958) return 'República bipartidista: sólo liberales y conservadores compiten por el poder. Gobernadores y alcaldes son designados, no elegidos.';
      if (anio < 1974) return 'Frente Nacional: el pacto obliga a alternar la presidencia entre liberales y conservadores, y reparte el Congreso en partes iguales entre los dos partidos.';
      if (anio < 1991) return 'Bipartidismo tras el Frente Nacional: la competencia entre liberales y conservadores se abre un poco, pero siguen siendo los únicos partidos. Gobernadores y alcaldes siguen siendo designados.';
      return 'Colombia de la Constitución de 1991: sistema multipartidista, Senado por circunscripción nacional, gobernadores y alcaldes elegidos por voto popular.';
    },
    generar(cfg) {
      const anioInicio = U.clamp(Math.round(cfg.anioInicio || 2026), ANIO_MIN, ANIO_MAX);
      const ciclo = cicloDe(anioInicio);
      const inicioISO = ciclo + '-07-20T00:00:00Z';
      const presim = Math.max(3, Math.round((Date.UTC(anioInicio, 6, 20) - Date.UTC(ciclo, 6, 20)) / (7 * 864e5)));
      const semilla = cfg.semilla || Math.floor(Math.random() * 2 ** 31);
      const E = C.Estado.vacio(semilla, inicioISO);
      C.E = E;
      E.meta.nombrePartida = cfg.jugador.nombre;
      E.meta.anioInicio = anioInicio;
      E.meta.presim = true;

      // 1. Territorio
      for (const d of C.DATA.departamentos) E.deptos[d.id] = Object.assign({}, d, { gobernador: null, alcalde: null, ajusteAprob: 0 });
      // 2. Instituciones y sistemas base
      C.Partidos.init(E); C.Economia.init(E); C.Opinion.init(E); C.Medios.init(E); C.Redes.init(E); C.OrdenPublico.init(E); C.Diplomacia.init(E); C.Constitucion.init(E); C.Movilizacion.init(E); C.Comercio.init(E); C.Corte.init(E); C.Participacion.init(E); C.Encuestas.init(E); C.Inteligencia.init(E); C.Control.init(E); C.Exterior.init(E); C.Territorio.init(E); C.MundoEco.init(E); C.Empresas.init(E);
      // 3. Jugador
      C.Personaje.crear(E, cfg.jugador);
      const J = E.jugador;
      // 4. Gobernadores y alcaldes de capitales (designados o elegidos según la época, vía cuotas())
      for (const d of Object.values(E.deptos)) {
        for (const tipo of ['gobernador', 'alcalde']) {
          const cuo = C.Elecciones.cuotas(E, d.id, true);
          const pid = U.pesado(Object.entries(cuo).filter(([p]) => p !== 'BLANCO'), x => x[1] * x[1])[0];
          const p = C.Politicos.crear(E, { partido: pid, depto: d.id, cargo: { tipo, depto: d.id } });
          d[tipo] = p.id;
        }
      }
      if (J.cargo === 'concejal' || J.cargo === 'diputado') { J.cargoInfo = { depto: J.residencia }; C.Corporaciones.asegurarJugador(E); }
      // 5. Elecciones del ciclo de instalación (historia inicial)
      const forzar = J.cargo === 'senador' ? 'senado' : J.cargo === 'representante' ? 'camara' : null;
      const resC = C.Elecciones.congreso(E, { anio: ciclo, forzarJugador: forzar });
      let resP = C.Elecciones.presidencial(E, 1, C.Elecciones.candidatosPresidencia(E));
      const hist = [resC, resP];
      if (!resP.ganador) { const r2 = C.Elecciones.presidencial(E, 2, resP.segunda); r2.anterior = null; hist.push(r2); resP = r2; }
      hist.forEach(h => { h.t = 0; h.anterior = null; h.inicial = true; });
      E.elecciones.historico.push(...hist);
      E.gobierno.electo = { pol: resP.ganador, partido: resP.candidatos[0].partido, vice: resP.candidatos[0].vice || null, segundo: resP.candidatos[1] };
      // 6. Instalación del Congreso y posesión presidencial
      C.Congreso.instalar(E, resC);
      C.Gobierno.posesionar(E, E.gobierno.electo, true);
      C.Congreso.elegirMesas(E);
      E.congreso.legislatura = 1; E.congreso.sesionAnterior = true;
      C.Partidos.asignarLideres(E);
      if (forzar) J.historialElectoral.push({ anio: ciclo, cargo: forzar === 'senado' ? 'senado' : 'camara', depto: forzar === 'camara' ? J.residencia : null, partido: J.partido, votos: (resC.senado.electos.concat(...Object.values(resC.camara.porDepto).map(x => x.electos)).find(e => e.pol === 'J') || {}).votos || 0, electo: true });
      // 7. Agenda inicial: presupuesto del año siguiente y proyectos de bandera del Gobierno
      C.Presupuesto.init(E);
      C.Presupuesto.radicar(E);
      const pres = E.politicos[E.gobierno.presidente];
      const pls = C.DATA.plantillasProyectos.filter(x => !x.gobierno).sort((a, b) => U.distIdeo(pres, a) - U.distIdeo(pres, b)).slice(0, 3);
      for (const pl of pls) { const m = C.Gobierno.ministroDe(E, pl.sector); E.gobierno.agenda.push(C.Legislacion.crear(E, { plantilla: pl.id, autor: m && m.id, gobierno: true, eco: pl.eco * 0.6 + pres.eco * 0.4, soc: pl.soc * 0.6 + pres.soc * 0.4 }).id); }
      const congresistas = [...C.Congreso.miembros(E, 'senado'), ...C.Congreso.miembros(E, 'camara')].filter(p => p.id !== 'J');
      for (let i = 0; i < 10; i++) C.Legislacion.radicarIA(E, U.pick(congresistas));
      // 8. Presimulación silenciosa hasta el año pedido (el mundo ya tiene una historia real detrás)
      for (let i = 0; i < presim; i++) { C.Tiempo.avanzar(); E.eventos.pendientes = []; E.elecciones.nochePendiente = null; E.participacion.resultadosPendientes = []; if ((E.ui.sancionesPendientes || []).length) { for (const id of E.ui.sancionesPendientes) if (E.proyectos[id] && E.proyectos[id].sub === 'decisionPresidente') C.Legislacion.convertirEnLey(E, E.proyectos[id]); E.ui.sancionesPendientes = []; } }
      E.meta.presim = false;
      if (cfg.escenario && C.Escenarios) C.Escenarios.iniciar(E, cfg.escenario);
      E.series = {};
      C.Economia.series(E); U.serie('aprobacion', E.opinion.aprobacionPres);
      for (const f of ['invamer', 'gad']) C.Encuestas.publicar(E, C.Encuestas.realizar(E, { firma: f, cliente: 'medios', detalle: true }));
      E.eventos.pendientes = [];
      E.medios.noticias = E.medios.noticias.filter(n => !n.jugador);
      C.Medios.noticia(E, { tipo: 'general', titular: `Bienvenido a la política: ${J.nombre} empieza una nueva etapa como ${C.DATA.cargos[J.cargo].nombre.toLowerCase()}`, tono: 1, jugador: true, importante: true });
      C.Legislacion.calcularOrdenDelDia(E);
      E.jugador.agenda.puntos = C.Personaje.puntosMax(E);
      return E;
    }
  };
  C.Mundo = Mundo;
})(window.CURUL);
