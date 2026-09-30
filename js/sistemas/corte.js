/* Corte Constitucional: nueve magistrados con ideología, activismo y periodo propios, elegidos por el
   Senado de ternas del Presidente, la Corte Suprema y el Consejo de Estado (tres cada una). Es un
   poder activo sobre todo lo que hace el Estado, no un trámite de los tratados:

   · Leyes: cada ley sancionada puede ser demandada (por ciudadanos, la oposición, un gremio o por ti);
     la Corte falla exequible, exequible condicionada o inexequible, y un fallo adverso revierte los
     efectos de la ley y golpea al Gobierno si era su bandera. Hay un semáforo de riesgo antes de firmar
     y el Presidente puede objetar por inconstitucional.
   · Tratados y reformas constitucionales: su control pasa por la composición real de la Corte (una
     Corte de derecha frena menos un TLC y más un giro estatista), y una reforma que sustituya pilares de
     la Constitución puede caerse.
   · Estado de cosas inconstitucional: ante un sector crónicamente abandonado (salud, educación,
     cárceles) la Corte le da un plazo al Gobierno; incumplirlo es desacato.
   Lo pesan la ideología del texto frente a la mediana de la Corte, el activismo de sus magistrados, el
   tipo de vicio (fondo o trámite) y la tensión acumulada entre la Corte y el Ejecutivo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const SEMANAS_PERIODO = 8 * 52;
  const PROPONENTES = { presidente: 'el Presidente', suprema: 'la Corte Suprema', estado: 'el Consejo de Estado' };
  const EXCLUIDAS = ['presupuesto', 'nuevoministerio', 'ratificaciontratado'];
  const ECI = {
    salud: { nombre: 'Salud', icono: '⚕', ministerio: 'salud', indice: 'salud' },
    educacion: { nombre: 'Educación', icono: '🎓', ministerio: 'educacion', indice: 'educacion' },
    carceles: { nombre: 'Sistema carcelario y de justicia', icono: '⛓', ministerio: 'justicia', indice: 'seguridad' }
  };
  const DEMANDANTES = { ciudadano: 'un ciudadano', oposicion: 'la oposición', gremio: 'un gremio', jugador: 'tú' };
  const RESULTADOS = { exequible: 'Exequible', condicionada: 'Exequible condicionada', inexequible: 'Inexequible', inhibida: 'Inhibida' };

  const K = {
    PROPONENTES, ECI, DEMANDANTES, RESULTADOS,
    hash(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return (h % 1000) / 1000; },
    nuevoMagistrado(E, o = {}) {
      const N = C.DATA.nombres, genero = o.genero || (U.chance(0.4) ? 'f' : 'm');
      const sesgo = o.sesgo || { eco: 0, soc: 0 };
      return {
        id: o.id || U.id('mag'), genero,
        nombre: o.nombre || (U.pick(genero === 'f' ? N.m : N.h) + ' ' + U.pick(N.a) + ' ' + U.pick(N.a)),
        nac: U.anio() - U.ri(46, 68), retrato: U.ri(1, 1e6), partido: null,
        eco: U.clamp(Math.round(sesgo.eco + U.gauss(0, o.dispersion || 30)), -90, 90), soc: U.clamp(Math.round(sesgo.soc + U.gauss(0, o.dispersion || 30)), -90, 90),
        activismo: o.activismo != null ? o.activismo : U.ri(25, 85), prestigio: o.prestigio != null ? o.prestigio : U.ri(40, 95),
        desde: o.desde != null ? o.desde : E.fecha.t, hasta: o.hasta != null ? o.hasta : E.fecha.t + SEMANAS_PERIODO, proponente: o.proponente || 'suprema'
      };
    },
    init(E) {
      const orden = ['presidente', 'suprema', 'estado'], mags = [];
      for (let i = 0; i < 9; i++) {
        const antig = U.ri(0, SEMANAS_PERIODO - 30);
        mags.push(K.nuevoMagistrado(E, { desde: E.fecha.t - antig, hasta: E.fecha.t - antig + SEMANAS_PERIODO, proponente: orden[i % 3] }));
      }
      E.corte = { magistrados: mags, vacantes: [], demandas: [], fallos: [], mandatos: [], recientes: [], tension: 15 };
      for (const p of Object.values(E.proyectos || {})) if (p.estado === 'ley' && E.fecha.t - (p.sancionada || 0) < 104 && !EXCLUIDAS.includes(p.plantilla)) E.corte.recientes.push(p.id);
    },
    migrar(E) { if (!E.corte || !E.corte.magistrados) K.init(E); },
    mediana(E) {
      const m = E.corte.magistrados; if (!m.length) return { eco: 0, soc: 0 };
      return { eco: U.prom(m.map(x => x.eco)), soc: U.prom(m.map(x => x.soc)) };
    },
    activismoMedio(E) { const m = E.corte.magistrados; return m.length ? U.prom(m.map(x => x.activismo)) : 50; },
    /* Cuánto más (o menos) probable es que la Corte tumbe un texto con esa orientación económica. */
    factorEco(E, eco) { return 1 + U.clamp((Math.abs(eco - K.mediana(E).eco) - 30) / 200, -0.3, 0.5); },
    registrarFallo(E, f) {
      const c = E.corte; c.fallos.push(Object.assign({ id: U.id('fa'), t: E.fecha.t }, f));
      if (c.fallos.length > 60) c.fallos.shift();
      return c.fallos[c.fallos.length - 1];
    },

    /* ── Magistrados: vacantes, ternas y elección en el Senado ── */
    apoyoSenado(E, cand) {
      const comp = C.Congreso.composicion(E, 'senado').porPartido; let tot = 0, s = 0;
      for (const [pid, n] of Object.entries(comp)) { const pa = E.partidos[pid]; if (!pa || pa.especial) continue; tot += n; s += n * (1 - U.distIdeo(cand, pa)); }
      return tot ? s / tot : 0.5;
    },
    generarCandidatos(E, proponente, n) {
      let sesgo = K.mediana(E);
      if (proponente === 'presidente') { const pr = E.gobierno.presidente === 'J' ? E.jugador.ideologia : E.politicos[E.gobierno.presidente]; if (pr) sesgo = { eco: pr.eco * 0.7, soc: pr.soc * 0.7 }; }
      return Array.from({ length: n }, () => K.nuevoMagistrado(E, { sesgo, dispersion: 22, proponente }));
    },
    vacante(E, id) { return E.corte.vacantes.find(v => v.id === id); },
    abrirVacante(E, saliente) {
      const v = { id: U.id('vac'), t: E.fecha.t, proponente: saliente.proponente, estado: 'terna', limite: E.fecha.t + 8, saliente: saliente.nombre };
      if (v.proponente === 'presidente' && E.gobierno.presidente === 'J') v.opciones = K.generarCandidatos(E, 'presidente', 6);
      E.corte.vacantes.push(v);
      C.Medios.noticia(E, { tipo: 'judicial', titular: `Termina el periodo del magistrado ${saliente.nombre}: se abre la vacante en la Corte Constitucional (terna de ${PROPONENTES[v.proponente]})`, tono: 0, importante: v.proponente === 'presidente' && E.gobierno.presidente === 'J' });
    },
    armarTernaAutomatica(E, v) {
      const cands = K.generarCandidatos(E, v.proponente, 5);
      return cands.sort((a, b) => b.prestigio - a.prestigio).slice(0, 3);
    },
    elegirEnSenado(E, v) {
      const puntajes = v.terna.map(c => ({ c, s: K.apoyoSenado(E, c) + c.prestigio / 300 + U.gauss(0, 0.05) })).sort((a, b) => b.s - a.s);
      const gana = puntajes[0].c;
      const mag = K.nuevoMagistrado(E, Object.assign({}, gana, { desde: E.fecha.t, hasta: E.fecha.t + SEMANAS_PERIODO, proponente: v.proponente }));
      E.corte.magistrados.push(mag);
      E.corte.vacantes = E.corte.vacantes.filter(x => x.id !== v.id);
      const deElPresidente = v.proponente === 'presidente' && E.gobierno.presidente === 'J';
      C.Medios.noticia(E, { tipo: 'judicial', titular: `El Senado elige a ${mag.nombre} como magistrado/a de la Corte Constitucional (terna de ${PROPONENTES[v.proponente]})`, tono: 0, importante: deElPresidente, jugador: deElPresidente });
      if (deElPresidente) E.corte.tension = U.clamp(E.corte.tension - 4, 0, 100);
    },

    /* ── Control de constitucionalidad de las leyes ── */
    riesgoLey(E, p) {
      const c = E.corte, med = K.mediana(E), dist = U.distIdeo(p, med);
      const r = 0.05 + dist * 0.5 + (K.activismoMedio(E) - 50) * 0.002 + (p.urgencia ? 0.04 : 0) + (p.gobierno ? c.tension * 0.0012 : 0)
        + (p.pop < 0 ? 0.03 : 0) + (K.hash(p.id) - 0.5) * 0.12;
      // Un plebiscito ganado sobre la apertura comercial blinda los tratados durante cuatro años.
      const ref = p.ratifica && E.participacion && E.participacion.refrendos.apertura;
      return U.clamp(ref && ref.si && E.fecha.t - ref.t < 208 ? r * 0.6 : r, 0.02, 0.85);
    },
    semaforo(E, p) {
      const r = K.riesgoLey(E, p);
      return { riesgo: r, nivel: r < 0.15 ? 'bajo' : r < 0.3 ? 'medio' : 'alto', clase: r < 0.15 ? 'verde' : r < 0.3 ? 'amar' : 'rojo' };
    },
    demandaDe(E, proyectoId) { return E.corte.demandas.find(d => d.proyecto === proyectoId); },
    crearDemanda(E, p, demandante) {
      const c = E.corte, tramite = (p.urgencia && U.chance(0.5)) || U.chance(0.2);
      const d = { id: U.id('dem'), proyecto: p.id, titulo: p.titulo, demandante, t: E.fecha.t, resolverEn: E.fecha.t + U.ri(16, 36),
        vicio: tramite ? 'tramite' : 'fondo', riesgo: K.riesgoLey(E, p) + (tramite ? 0.06 : 0), estado: 'admitida' };
      c.demandas.push(d);
      if (p.gobierno || demandante === 'jugador') C.Medios.noticia(E, { tipo: 'judicial', titular: `${demandante === 'jugador' ? 'Presentas' : U.pick(['Presentan', 'Radican'])} una demanda de inconstitucionalidad contra «${p.titulo}»`, tono: 0, jugador: demandante === 'jugador' });
      return d;
    },
    posibleDemanda(E, p) {
      if (!p || EXCLUIDAS.includes(p.plantilla) || K.demandaDe(E, p.id)) return;
      const dist = U.distIdeo(p, K.mediana(E));
      const prob = U.clamp(0.08 + dist * 0.5 + (p.gobierno ? 0.06 : 0) + (p.pop < 0 ? 0.1 : 0) + (p.urgencia ? 0.06 : 0) + (p.costo > 2 ? 0.04 : 0), 0.06, 0.6);
      if (!U.chance(prob)) return;
      K.crearDemanda(E, p, p.gobierno && U.chance(0.55) ? 'oposicion' : U.pick(['ciudadano', 'ciudadano', 'gremio']));
    },
    /* Revierte lo que una ley ya movió y cancela lo pendiente. `factor` 1 = todo; 0,5 = la mitad. */
    anularEfectos(E, p, factor) {
      const Ec = C.Economia;
      E.economia.pendientes = E.economia.pendientes.filter(pe => {
        if (pe.origen !== p.id) return true;
        if (factor >= 1) return false;
        pe.d *= (1 - factor); return true;
      });
      const dt = E.fecha.t - (p.sancionada != null ? p.sancionada : E.fecha.t), inv = [];
      const parte = (plazo, d, v) => { const [a, b] = Ec.PLAZOS[plazo || 'i']; const frac = U.clamp((dt - a) / Math.max(1, b - a), 0, 1); if (frac > 0.02 && d) inv.push({ v, d: -d * frac * factor, p: 'i' }); };
      for (const ef of p.efectos || []) parte(ef.p, ef.d, ef.v);
      if (p.costo) parte('m', Ec.impactoFiscal(p.costo), 'deficit');
      if (inv.length) Ec.programar(E, inv, 'anula:' + p.id);
    },
    fallar(E, d) {
      const p = E.proyectos[d.proyecto], c = E.corte; d.estado = 'resuelta';
      if (!p) return;
      let resultado;
      if (!U.chance(0.94)) resultado = 'inhibida';
      else if (U.chance(d.riesgo)) resultado = U.chance(0.6) ? 'inexequible' : 'condicionada';
      else resultado = 'exequible';
      d.resultado = resultado;
      const fallo = K.registrarFallo(E, { tipo: 'ley', proyecto: p.id, titulo: p.titulo, resultado, gobierno: !!p.gobierno, demandante: d.demandante, vicio: d.vicio });
      const propia = p.autor === 'J' || (p.coautores || []).includes('J');
      if (resultado === 'inexequible' || resultado === 'condicionada') {
        const total = resultado === 'inexequible';
        K.anularEfectos(E, p, total ? 1 : 0.5);
        p.corte = { resultado, t: E.fecha.t };
        if (total) p.estado = 'inexequible';
        C.Legislacion.hist(E, p, total ? 'La Corte Constitucional declara INEXEQUIBLE la ley' : 'La Corte declara la ley exequible de forma condicionada: pierde la mitad de sus efectos', 'negado');
        if (p.gobierno) { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - (total ? U.rf(1, 2.2) : U.rf(0.3, 0.9)), 3, 95); c.tension = U.clamp(c.tension + (total ? 12 : 5), 0, 100); }
        if (propia) { E.jugador.historialLegislativo.push({ t: E.fecha.t, titulo: p.titulo, rol: p.autor === 'J' ? 'autor' : 'coautor', resultado: total ? 'inexequible' : 'condicionada' }); E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia - (total ? 3 : 1), 0, 100); }
        C.Medios.noticia(E, { tipo: 'judicial', titular: total ? `La Corte Constitucional tumba la ley «${p.titulo}»${p.gobierno ? ' y le propina un revés al Gobierno' : ''}` : `La Corte Constitucional deja en pie «${p.titulo}» pero le recorta el alcance`, tono: -1, importante: p.gobierno || propia, jugador: propia, ref: { proyecto: p.id } });
      } else if (resultado === 'exequible') {
        p.corte = { resultado, t: E.fecha.t };
        if (p.gobierno) E.corte.tension = U.clamp(E.corte.tension - 2, 0, 100);
        if (p.gobierno || propia) C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte Constitucional avala la ley «${p.titulo}»: es exequible`, tono: 1, importante: p.gobierno, jugador: propia, ref: { proyecto: p.id } });
      }
      return fallo;
    },
    /* Objeción presidencial por inconstitucional: la Corte decide de inmediato. */
    objecionInconstitucional(E, p) {
      const prob = U.clamp(K.riesgoLey(E, p) * 1.3 + 0.05, 0.05, 0.9), acepta = U.chance(prob);
      const fallo = K.registrarFallo(E, { tipo: 'objecion', proyecto: p.id, titulo: p.titulo, resultado: acepta ? 'inexequible' : 'exequible', gobierno: false });
      if (acepta) {
        C.Legislacion.archivar(E, p, 'La Corte declara fundada la objeción presidencial por inconstitucionalidad');
        E.corte.tension = U.clamp(E.corte.tension - 3, 0, 100);
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.3, 3, 95);
      } else {
        C.Legislacion.convertirEnLey(E, p);
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1.5, 3, 95);
        E.corte.tension = U.clamp(E.corte.tension + 4, 0, 100);
        C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte rechaza la objeción del Presidente a «${p.titulo}»: debe sancionarla`, tono: -1, jugador: true });
      }
      return { acepta, prob, fallo };
    },

    /* ── Control de reformas constitucionales (sustitución de la Constitución) ── */
    tumbaReforma(E, articulo, via) {
      const extra = { reeleccion: 0.10, autonomiaTerritorial: 0.08, revocatoriaPresidencial: 0.10, umbralSenado: 0.03, edadMinimaPresidencia: 0.02, votoObligatorio: 0.05, financiacionCampanas: 0.05, sistemaListas: 0.05 }[articulo] || 0.03;
      const p = U.clamp(((via === 'constituyente' ? 0.03 : 0.04) + extra) * (0.6 + K.activismoMedio(E) / 100), 0.02, 0.4);
      const art = C.Constitucion.ARTICULOS[articulo];
      const tumba = U.chance(p);
      K.registrarFallo(E, { tipo: 'reforma', titulo: `Reforma: ${art ? art.nombre : articulo}`, resultado: tumba ? 'inexequible' : 'exequible', gobierno: true });
      if (tumba) {
        E.corte.tension = U.clamp(E.corte.tension + 10, 0, 100);
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(1, 2.5), 3, 95);
        C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte Constitucional tumba la reforma sobre ${art ? art.nombre.toLowerCase() : articulo}: sustituía un pilar de la Constitución`, tono: -1, importante: true, jugador: true });
      }
      return tumba;
    },

    /* ── Estado de cosas inconstitucional ── */
    promedioIndice(E, idx) { return U.prom(Object.values(E.deptos).map(d => d[idx])); },
    cumplimiento(E, m) {
      const cfg = ECI[m.sector], Pr = E.presupuesto;
      const share = Pr && Pr.vigente && Pr.vigente.shares ? Pr.vigente.shares[cfg.ministerio] : null, base = Pr && Pr.pesoBase ? Pr.pesoBase[cfg.ministerio] : null;
      const presupuesto = share != null && base != null && share >= base * 1.05;
      const indicador = K.promedioIndice(E, cfg.indice) >= m.base + 2;
      return { presupuesto, indicador, ok: presupuesto || indicador };
    },
    turnoECI(E) {
      const c = E.corte, vivos = c.mandatos.filter(m => m.estado === 'vigente');
      if (vivos.length < 2 && U.chance(0.006)) {
        const cand = Object.keys(ECI).filter(s => !vivos.some(m => m.sector === s)).map(s => ({ s, idx: K.promedioIndice(E, ECI[s].indice) })).filter(x => x.idx < 60).sort((a, b) => a.idx - b.idx)[0];
        if (cand) {
          c.mandatos.push({ id: U.id('eci'), sector: cand.s, t: E.fecha.t, plazo: 52, base: cand.idx, estado: 'vigente' });
          C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte declara un estado de cosas inconstitucional en ${ECI[cand.s].nombre.toLowerCase()} y le da 52 semanas al Gobierno para corregirlo`, tono: -1, importante: true, jugador: E.gobierno.presidente === 'J' });
        }
      }
      for (const m of vivos) {
        if (E.fecha.t < m.t + m.plazo) continue;
        const r = K.cumplimiento(E, m), nom = ECI[m.sector].nombre.toLowerCase();
        if (r.ok) {
          m.estado = 'cumplido';
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.6, 3, 95); c.tension = U.clamp(c.tension - 4, 0, 100);
          C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte da por cumplida la orden sobre ${nom}: el Gobierno atendió el mandato`, tono: 1, jugador: E.gobierno.presidente === 'J' });
        } else {
          m.estado = 'desacato';
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1.5, 3, 95); c.tension = U.clamp(c.tension + 8, 0, 100);
          if (E.gobierno.presidente === 'J') E.jugador.riesgoJudicial = U.clamp((E.jugador.riesgoJudicial || 0) + 8, 0, 100);
          C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte abre incidente de desacato: el Gobierno no cumplió la orden sobre ${nom}`, tono: -1, importante: true, jugador: E.gobierno.presidente === 'J' });
        }
      }
    },

    turno(E) {
      const c = E.corte; if (!c) return;
      c.tension = Math.max(0, c.tension - 0.05);
      for (const m of c.magistrados.filter(x => E.fecha.t >= x.hasta)) { c.magistrados = c.magistrados.filter(x => x.id !== m.id); K.abrirVacante(E, m); }
      for (const v of c.vacantes.slice()) {
        if (v.estado === 'terna') {
          if (v.proponente === 'presidente' && E.gobierno.presidente === 'J' && E.fecha.t < v.limite) continue;
          v.terna = v.terna || K.armarTernaAutomatica(E, v);
          v.estado = 'senado'; v.votaSenado = E.fecha.t + U.ri(4, 8);
        } else if (v.estado === 'senado' && E.fecha.t >= v.votaSenado) K.elegirEnSenado(E, v);
      }
      c.recientes = c.recientes.filter(id => { const p = E.proyectos[id]; return p && E.fecha.t - (p.sancionada || 0) < 104; });
      for (const id of c.recientes) { const p = E.proyectos[id]; if (p && E.fecha.t - (p.sancionada || 0) < 40 && U.chance(0.0015)) K.posibleDemanda(E, p); }
      for (const d of c.demandas.filter(x => x.estado === 'admitida' && E.fecha.t >= x.resolverEn)) K.fallar(E, d);
      if (c.demandas.length > 80) c.demandas = c.demandas.filter(d => d.estado === 'admitida' || E.fecha.t - d.resolverEn < 120);
      K.turnoECI(E);
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'proponerTerna', nombre: 'Enviar la terna al Senado', icono: '📨', grupo: 'corte', costo: 1,
        disponible(E, a) {
          if (E.gobierno.presidente !== 'J') return 'Sólo el Presidente propone la terna';
          const v = K.vacante(E, a.vacante); return v && v.estado === 'terna' && v.proponente === 'presidente' && v.opciones ? true : 'No hay una terna pendiente de tu parte';
        },
        ejecutar(E, a) {
          const v = K.vacante(E, a.vacante), ids = [a.a, a.b, a.c];
          if (new Set(ids).size !== 3) return { ok: false, msg: 'Elige tres candidatos distintos' };
          const terna = ids.map(id => v.opciones.find(o => o.id === id)); if (terna.some(x => !x)) return { ok: false, msg: 'Elige tres candidatos de la lista' };
          v.terna = terna; v.estado = 'senado'; v.votaSenado = E.fecha.t + U.ri(4, 8);
          C.Medios.noticia(E, { tipo: 'judicial', titular: `El Presidente envía al Senado su terna para la Corte Constitucional: ${terna.map(x => x.nombre).join(', ')}`, tono: 0, jugador: true });
          return { ok: true, msg: 'La terna queda en manos del Senado' };
        } });
      A.registrar({ id: 'demandarLey', nombre: 'Demandar la ley', icono: '⚖', grupo: 'corte', costo: 2,
        disponible(E, a) {
          const p = E.proyectos[a.proyecto]; if (!p || p.estado !== 'ley') return 'Sólo se demandan leyes vigentes';
          if (EXCLUIDAS.includes(p.plantilla)) return 'Esta norma no es demandable por esta vía';
          if (E.gobierno.presidente === 'J' && p.gobierno) return 'No puedes demandar una ley de tu propio Gobierno';
          return K.demandaDe(E, p.id) ? 'Ya hay una demanda contra esta ley' : true;
        },
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto]; const d = K.crearDemanda(E, p, 'jugador');
          d.riesgo = U.clamp(d.riesgo + 0.04, 0.02, 0.9);
          C.Opinion.subirRec(E, 0.4);
          if (p.gobierno && E.jugador.partido && E.partidos[E.jugador.partido] && E.partidos[E.jugador.partido].postura === 'oposicion') E.jugador.rep.liderazgo = U.clamp(E.jugador.rep.liderazgo + 0.5, 0, 100);
          return { ok: true, msg: `Demanda radicada: la Corte fallará en unas ${d.resolverEn - E.fecha.t} semanas` };
        } });
      A.registrar({ id: 'criticarFallo', nombre: 'Criticar el fallo', icono: '📢', grupo: 'corte', costo: 1,
        disponible(E, a) { const f = E.corte.fallos.find(x => x.id === a.fallo); return f && !f.criticado && (f.resultado === 'inexequible' || f.resultado === 'condicionada') ? true : 'No hay un fallo adverso que criticar'; },
        ejecutar(E, a) {
          const f = E.corte.fallos.find(x => x.id === a.fallo); f.criticado = true;
          E.corte.tension = U.clamp(E.corte.tension + 6, 0, 100);
          if (E.gobierno.presidente === 'J' && f.gobierno) { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.6, 3, 95); E.economia.confianza = U.clamp(E.economia.confianza - 0.3, 5, 95); }
          else C.Opinion.subirRec(E, 0.5);
          C.Medios.noticia(E, { tipo: 'judicial', titular: `${E.jugador.nombre} critica el fallo de la Corte sobre «${f.titulo}»`, tono: 0, jugador: true });
          return { ok: true, msg: 'Criticas públicamente el fallo: sube la tensión con la Corte' };
        } });
    }
  };

  C.Corte = K;
  C.Tiempo.registrar('corte', K, 68);
  K.registrarAcciones();
  C.Bus.on('ley', p => {
    const E = C.E; if (!E || !E.corte || E.meta.presim) return;
    if (EXCLUIDAS.includes(p.plantilla)) return;
    E.corte.recientes.push(p.id); if (E.corte.recientes.length > 60) E.corte.recientes.shift();
    K.posibleDemanda(E, p);
  });
})(window.CURUL);
