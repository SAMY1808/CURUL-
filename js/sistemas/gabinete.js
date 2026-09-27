/* Gabinete 2.0: cada ministro tiene su propia gestión (que sube o baja con sus aciertos y
   errores), propone iniciativas concretas de su sector que el presidente respalda o rechaza, y
   puede protagonizar una crisis propia (no genérica del país) que hay que resolver: respaldarlo o
   destituirlo. Reutiliza los `programas` ya definidos por ministerio (data/instituciones.js) como
   catálogo de iniciativas, en vez de inventar uno nuevo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const Gab = {
    /* Estado de gabinete de un ministro: se inicializa perezosamente la primera vez que se usa
       (partidas guardadas antes de esta entrega no tienen estos campos). */
    asegurar(m) {
      if (m.gestion == null) m.gestion = U.clamp(Math.round((m.r.exp + m.r.pra) / 2 + U.gauss(0, 6)), 15, 90);
      if (m.logros == null) m.logros = 0;
      return m;
    },
    ministro(E, minId) { return E.politicos[E.gobierno.gabinete[minId]]; },
    campoDe(min) { return C.Gobierno.EFECTO_SECTOR[min.sector] || null; },
    /* Probabilidad de que una iniciativa salga bien: depende de la gestión del ministro y de qué
       tan respaldado se siente por el presidente (relJ hace también de "lealtad/cercanía" aquí). */
    probExito(m) { return U.clamp(0.28 + Gab.asegurar(m).gestion / 160 + (m.relJ || 0) / 400, 0.12, 0.85); },

    proponer(E, minId) {
      const g = E.gobierno, m = Gab.ministro(E, minId);
      if (!m || m.iniciativa || m.crisisActiva) return;
      const min = C.Gobierno.todosMinisterios(E).find(x => x.id === minId);
      if (!min || !min.programas || !min.programas.length) return;
      const programa = U.pick(min.programas);
      m.iniciativa = { programa, estado: 'propuesta', t: E.fecha.t, semanas: U.ri(5, 9) };
      C.Politicos.anotar(m, `Propone impulsar «${programa}»`);
    },
    resolverIniciativa(E, minId) {
      const m = Gab.ministro(E, minId); if (!m || !m.iniciativa) return;
      const min = C.Gobierno.todosMinisterios(E).find(x => x.id === minId);
      const programa = m.iniciativa.programa;
      const exito = U.chance(Gab.probExito(m));
      const campo = Gab.campoDe(min);
      if (exito) {
        m.gestion = U.clamp(m.gestion + U.ri(3, 8), 0, 100);
        m.logros++;
        m.aprob = U.clamp((m.aprob || 50) + U.rf(2, 5), 0, 100);
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(0.2, 0.8), 0, 100);
        if (campo) for (const d of Object.values(E.deptos)) d[campo] = U.clamp(d[campo] + (min.sector === 'empleo' ? -1 : 1) * U.rf(0.8, 1.8), 1, 99);
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `«${programa}» sale adelante: el Ministerio de ${min.nombre} cumple lo prometido`, tono: 1, importante: true });
        C.Politicos.anotar(m, `Saca adelante «${programa}»`);
      } else {
        m.gestion = U.clamp(m.gestion - U.ri(4, 10), 0, 100);
        m.aprob = U.clamp((m.aprob || 50) - U.rf(2, 6), 0, 100);
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `«${programa}» se queda corto: el Ministerio de ${min.nombre} no logra los resultados esperados`, tono: -1 });
        C.Politicos.anotar(m, `«${programa}» no sale adelante`);
        if (U.chance(0.3)) Gab.crisis(E, minId);
      }
      m.iniciativa = null;
    },
    CRISIS: ['un contrato cuestionado en una obra del sector', 'una denuncia de negligencia en su gestión',
      'un escándalo de nepotismo en su equipo', 'un manejo cuestionado de recursos públicos', 'una filtración sobre decisiones internas del ministerio'],
    crisis(E, minId) {
      const m = Gab.ministro(E, minId); if (!m || m.crisisActiva) return;
      const min = C.Gobierno.todosMinisterios(E).find(x => x.id === minId);
      const motivo = U.pick(Gab.CRISIS);
      const grave = U.chance(0.3);
      m.crisisActiva = { motivo, grave, t: E.fecha.t };
      m.aprob = U.clamp((m.aprob || 50) - U.ri(4, 10), 0, 100);
      C.Medios.noticia(E, { tipo: 'escandalo', titular: `Sale a la luz ${motivo} del ministro de ${min.nombre}`, tono: -1, importante: grave });
      C.Politicos.anotar(m, `Crisis: ${motivo}`);
    },
    respaldar(E, minId) {
      const m = Gab.ministro(E, minId); if (!m || !m.crisisActiva) return { ok: false, msg: 'No hay una crisis activa en ese ministerio' };
      const min = C.Gobierno.todosMinisterios(E).find(x => x.id === minId);
      m.relJ = U.clamp((m.relJ || 0) + 6, -100, 100);
      if (m.crisisActiva.grave) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(0.5, 1.5), 0, 100);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno respalda al ministro de ${min.nombre} pese a la polémica`, tono: 0, jugador: true });
      C.Politicos.anotar(m, 'Recibe el respaldo del presidente');
      m.crisisActiva = null;
      return { ok: true, msg: `Respaldas al ministro de ${min.nombre}` };
    },
    destituir(E, minId) {
      const m = Gab.ministro(E, minId); if (!m) return { ok: false, msg: 'No hay ministro en esa cartera' };
      const min = C.Gobierno.todosMinisterios(E).find(x => x.id === minId);
      const nombre = m.nombre;
      C.Gobierno.designar(E, minId, E.gobierno.partido);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `${nombre} sale del Ministerio de ${min.nombre} en medio de la polémica`, tono: 0, importante: true, jugador: true });
      return { ok: true, msg: `Destituyes al ministro de ${min.nombre}` };
    },
    aceptarIniciativa(E, minId) {
      const m = Gab.ministro(E, minId); if (!m || !m.iniciativa || m.iniciativa.estado !== 'propuesta') return { ok: false, msg: 'No hay una propuesta pendiente en esa cartera' };
      const min = C.Gobierno.todosMinisterios(E).find(x => x.id === minId);
      m.iniciativa.estado = 'en_curso'; m.iniciativa.semanasTot = m.iniciativa.semanas;
      m.relJ = U.clamp((m.relJ || 0) + 3, -100, 100);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno respalda «${m.iniciativa.programa}» del Ministerio de ${min.nombre}`, tono: 1 });
      return { ok: true, msg: 'Respaldas la iniciativa' };
    },
    rechazarIniciativa(E, minId) {
      const m = Gab.ministro(E, minId); if (!m || !m.iniciativa || m.iniciativa.estado !== 'propuesta') return { ok: false, msg: 'No hay una propuesta pendiente en esa cartera' };
      m.relJ = U.clamp((m.relJ || 0) - 3, -100, 100);
      C.Politicos.anotar(m, `El presidente no respalda «${m.iniciativa.programa}»`);
      m.iniciativa = null;
      return { ok: true, msg: 'Rechazas la propuesta' };
    },

    turno(E) {
      const g = E.gobierno; if (!g.presidente) return;
      for (const minId of Object.keys(g.gabinete)) {
        const m = E.politicos[g.gabinete[minId]]; if (!m) continue;
        Gab.asegurar(m);
        if (!m.iniciativa && !m.crisisActiva && U.chance(0.05)) Gab.proponer(E, minId);
        if (m.iniciativa && m.iniciativa.estado === 'en_curso') {
          m.iniciativa.semanas--;
          if (m.iniciativa.semanas <= 0) Gab.resolverIniciativa(E, minId);
        }
        if (!m.crisisActiva && U.chance(0.012 * (1 + (70 - m.gestion) / 70) * (1 + (60 - m.r.int) / 100))) Gab.crisis(E, minId);
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'aceptarIniciativaMinistro', nombre: 'Respaldar iniciativa', icono: '✅', grupo: 'gabinete', costo: 1,
        disponible(E, a) { const m = Gab.ministro(E, a.ministerio); return m && m.iniciativa && m.iniciativa.estado === 'propuesta' ? true : 'No hay una propuesta pendiente'; },
        ejecutar(E, a) { return Gab.aceptarIniciativa(E, a.ministerio); } });
      A.registrar({ id: 'rechazarIniciativaMinistro', nombre: 'Rechazar', icono: '✖', grupo: 'gabinete', costo: 0,
        disponible(E, a) { const m = Gab.ministro(E, a.ministerio); return m && m.iniciativa && m.iniciativa.estado === 'propuesta' ? true : 'No hay una propuesta pendiente'; },
        ejecutar(E, a) { return Gab.rechazarIniciativa(E, a.ministerio); } });
      A.registrar({ id: 'respaldarMinistroCrisis', nombre: 'Respaldar al ministro', icono: '🛡', grupo: 'gabinete', costo: 1,
        disponible(E, a) { const m = Gab.ministro(E, a.ministerio); return m && m.crisisActiva ? true : 'No hay una crisis activa'; },
        ejecutar(E, a) { return Gab.respaldar(E, a.ministerio); } });
      A.registrar({ id: 'destituirMinistroCrisis', nombre: 'Destituir', icono: '🚪', grupo: 'gabinete', costo: 1,
        disponible(E, a) { const m = Gab.ministro(E, a.ministerio); return m && m.crisisActiva ? true : 'No hay una crisis activa'; },
        ejecutar(E, a) { return Gab.destituir(E, a.ministerio); } });
    }
  };

  C.Gabinete = Gab;
  Gab.registrarAcciones();
  C.Tiempo.registrar('gabinete', Gab, 51);
})(window.CURUL);
