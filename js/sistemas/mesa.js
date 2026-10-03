/* Mesas de negociación (Fase 41). Un motor de negociación por rondas, con altos y bajos: cada mesa tiene temas con una
   brecha por cerrar, confianza mutua, un impulso (momentum) que oscila, presión pública y una contraparte con su propia
   flexibilidad y líneas rojas. El jugador elige tácticas (proponer, ceder, presionar, gestos, filtrar, mediador, pausa,
   ultimátum, paquetes), la contraparte responde y estallan incidentes que obligan a decidir. Termina en acuerdo, ruptura
   o congelamiento, con consecuencias según el tipo de mesa: paz con un grupo armado, transición a la democracia, paro,
   pacto social o negociación sectorial de una medida económica. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const PUNTOS_PAZ = [['tierra', 'Reforma rural integral'], ['participacion', 'Participación política'], ['fin', 'Fin del conflicto'], ['drogas', 'Solución a las drogas ilícitas'], ['victimas', 'Víctimas y justicia transicional']];
  const TACT = {
    proponer: { n: 'Proponer una fórmula', icono: '📝', costo: 1, tema: 1, txt: 'Avance sólido y moderado; cuesta poco, se apoya en la confianza.' },
    ceder: { n: 'Hacer una gran concesión', icono: '🤲', costo: 1, tema: 1, txt: 'Cierra mucha brecha de golpe y da impulso, pero cuesta políticamente.' },
    presionar: { n: 'Presionar a la contraparte', icono: '💪', costo: 1, tema: 1, txt: 'Funciona si tienes la sartén por el mango; si no, enfría la mesa.' },
    gesto: { n: 'Gesto de buena fe', icono: '🕊', costo: 1, tema: 0, txt: 'Sube la confianza y el impulso, a un costo simbólico.' },
    filtrar: { n: 'Filtrar a la prensa', icono: '📣', costo: 1, tema: 0, txt: 'Presiona a la contraparte con la opinión; si se descubre, rompe la confianza.' },
    mediador: { n: 'Traer un mediador', icono: '🧑‍⚖️', costo: 2, tema: 0, txt: 'Una sola vez: da impulso, confianza y amortigua los incidentes.' },
    pausa: { n: 'Pedir un receso', icono: '⏸', costo: 0, tema: 0, txt: 'Enfría los ánimos y recupera algo de confianza; el tiempo juega en contra.' },
    ultimatum: { n: 'Lanzar un ultimátum', icono: '⏳', costo: 1, tema: 0, txt: 'Apuesta alta: puede cerrar brechas de golpe… o romper la mesa.' },
    paquete: { n: 'Negociar un paquete', icono: '🧩', costo: 2, tema: 2, txt: 'Mueve dos temas a la vez, con algo de azar.' }
  };
  /* Incidentes: tipos = null (todos) o lista de tipos de mesa */
  const INC = [
    { id: 'ataque', n: 'Un ataque pone a prueba la mesa', txt: 'Un sector duro de la contraparte comete un atentado en plena negociación. La opinión exige romper el diálogo.', ops: [['Suspender la mesa unos días', { momentum: -6, confianza: -5, rec: 1 }], ['Mantener la mesa y condenar el hecho', { momentum: 4, confianza: 3, aprob: -0.8 }], ['Aprovechar para endurecer posiciones', { brecha: -6, confianza: -12, momentum: -4 }]] },
    { id: 'filtracion', n: 'Se filtran documentos reservados', txt: 'Un medio publica el borrador del acuerdo. Ambos lados acusan al otro de la filtración.', ops: [['Culpar a la contraparte', { confianza: -10, momentum: -3, rec: 1 }], ['Pedir calma y reafirmar el proceso', { confianza: 2, momentum: 2 }], ['Aceptar la responsabilidad y abrir una investigación', { confianza: 7, momentum: 4, aprob: -0.4 }]] },
    { id: 'presionExterna', n: 'La comunidad internacional presiona', txt: 'Gobiernos amigos y organismos multilaterales piden un acuerdo cuanto antes y ofrecen respaldo.', ops: [['Aceptar la veeduría internacional', { momentum: 10, confianza: 6 }], ['Pedirles que no se metan', { momentum: -4, rec: 1 }], ['Usar el respaldo para presionar a la contraparte', { brecha: -8, confianza: -5, momentum: 3 }]] },
    { id: 'pliegoNuevo', n: 'La contraparte agrega una exigencia', txt: 'En pleno avance, la contraparte pone un tema nuevo sobre la mesa.', ops: [['Aceptar discutirlo', { nuevoTema: 1, momentum: 3, confianza: 3 }], ['Rechazarlo de plano', { momentum: -8, confianza: -6 }], ['Condicionarlo a cerrar los demás temas', { momentum: 2, confianza: 0 }]] },
    { id: 'division', n: 'La contraparte se divide', txt: 'Una facción de la contraparte se rebela contra su dirección: hay una oportunidad… o un riesgo.', ops: [['Apoyar a los moderados', { brecha: -10, confianza: 5, momentum: 6 }], ['Esperar y ver quién gana', { momentum: -2 }], ['Aprovechar para negociar con los duros', { brecha: -4, confianza: -8, momentum: -3 }]] },
    { id: 'oportunidad', n: 'Se abre una ventana de oportunidad', txt: 'Un cambio de circunstancias hace posible un gran avance si ambos lados se arriesgan.', ops: [['Dar el salto: gran gesto y concesión', { brecha: -14, costoJ: 6, momentum: 14, confianza: 8 }], ['Avanzar con cautela', { brecha: -5, momentum: 5 }], ['Dejar pasar la oportunidad', { momentum: -5 }]] },
    { id: 'elecciones', n: 'Se acercan las elecciones', txt: 'La campaña electoral polariza el ambiente. Los candidatos se pronuncian contra la mesa.', ops: [['Blindar la mesa de la política', { momentum: 3, confianza: 4, rec: -0.5 }], ['Usar la mesa como bandera electoral', { rec: 2, confianza: -6, momentum: -3 }], ['Aplazar los temas más difíciles', { momentum: 1, brecha: 3 }]] },
    { id: 'crisisEco', n: 'Una crisis económica pesa sobre la mesa', txt: 'Los mercados se agitan y ambos bandos sienten el costo de no llegar a un acuerdo.', ops: [['Proponer un paquete de emergencia', { brecha: -7, costoJ: 3, momentum: 6 }], ['Ignorar el contexto', { momentum: -3 }], ['Culpar a la contraparte', { confianza: -7, rec: 1 }]] },
    { id: 'cumbreSecreta', n: 'Una reunión secreta entre los jefes', txt: 'Los jefes de cada lado se citan a puerta cerrada, lejos de los negociadores.', ops: [['Ir a la reunión y negociar sin intermediarios', { brecha: -9, costoJ: 3, confianza: 6, momentum: 8 }], ['Enviar a un delegado de confianza', { brecha: -3, confianza: 3 }], ['Rechazar los acuerdos «bajo cuerda»', { confianza: -3, rec: 1, momentum: -2 }]] },
    { id: 'bloqueoInterno', n: 'Tu propio bando se divide', txt: 'Aliados y partidos de tu lado critican las concesiones y amenazan con retirarte su apoyo.', ops: [['Reafirmar la línea y pagar el costo político', { aprob: -1, momentum: 4 }], ['Endurecer la posición', { brecha: 5, confianza: -5, momentum: -2 }], ['Explicarle a la opinión por qué vale la pena', { rec: 1.5, momentum: 2, aprob: -0.3 }]] }
  ];

  /* Tipos de mesa */
  const gOP = (E, gid) => E.ordenPublico.grupos[gid];
  const TIPOS = {
    paz: { n: 'Mesa de paz', icono: '🕊',
      puede(E, ref) { if (E.gobierno.presidente !== 'J') return 'Sólo el Presidente abre mesas de paz'; const st = ref && E.ordenPublico && gOP(E, ref); if (!st) return 'Elige un grupo armado'; if (!st.activo) return 'Ese grupo no está activo'; if (st.negociacion) return 'Ya hay un diálogo en curso por la vía anterior'; return true; },
      crear(E, ref) { const gp = C.OrdenPublico.activos(E).find(x => x.id === ref), st = gOP(E, ref), pol = C.OrdenPublico.fuerzaInstitucional(E); return { titulo: `Mesa de paz con las ${gp.sigla}`, contraparte: { n: gp.nombre, icono: '🪖', flex: U.clamp(55 - st.fuerza * 0.2 + U.ri(-8, 8), 15, 80), poder: st.fuerza }, leverage: U.clamp(50 + (pol - st.fuerza) * 0.5, 15, 85), temas: PUNTOS_PAZ.map(([id, n]) => ({ id, n, brecha: U.ri(45, 85), peso: id === 'fin' ? 3 : 2, linea: id === 'victimas' || id === 'fin' })) }; },
      fin(E, m, r) { const st = gOP(E, m.ref), gp = C.OrdenPublico.activos(E).find(x => x.id === m.ref) || { sigla: m.ref }; if (r === 'acuerdo') { C.OrdenPublico.firmarPaz(E, m.ref); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - Mesa.costoTotal(m) * 0.02, 3, 95); } else if (r === 'ruptura') { st.fuerza = U.clamp(st.fuerza + 5, 5, 100); for (const d of st.control) E.deptos[d].seguridad = U.clamp(E.deptos[d].seguridad - 3, 1, 99); C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Se rompe la mesa de paz con las ${gp.sigla}: vuelve la violencia`, tono: -1, importante: true, jugador: true }); } } },
    paro: { n: 'Mesa con un movimiento en paro', icono: '📢',
      puede(E, ref) { const a = C.Movilizacion.actor(E, ref); if (!a) return 'Elige un movimiento'; return a.paro ? true : 'Ese movimiento no está en paro'; },
      crear(E, ref) { const A = C.Movilizacion.ACTORES.find(x => x.id === ref), a = C.Movilizacion.actor(E, ref); return { titulo: `Mesa con ${A.nombre}`, contraparte: { n: A.nombre, icono: '📢', flex: U.clamp(60 - a.descontento * 0.25 + U.ri(-8, 8), 15, 80), poder: a.descontento }, leverage: U.clamp(50 + (E.opinion.aprobacionPres - 45) * 0.4 - a.descontento * 0.2, 15, 85), temas: [{ id: 'pliego', n: `Pliego sobre ${A.causa}`, brecha: U.ri(50, 80), peso: 3, linea: false }, { id: 'garantias', n: 'Garantías para la protesta', brecha: U.ri(30, 60), peso: 1, linea: false }, { id: 'recursos', n: 'Recursos y compromisos fiscales', brecha: U.ri(40, 75), peso: 2, linea: true }] }; },
      fin(E, m, r) { if (r === 'acuerdo') { C.Movilizacion.terminarParo(E, m.ref, 'Acuerdo en la mesa de negociación'); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(Mesa.costoTotal(m) * 0.03), p: 'm' }], 'mesa'); } else if (r === 'ruptura') { const a = C.Movilizacion.actor(E, m.ref); a.descontento = Math.min(100, a.descontento + 8); } } },
    pacto: { n: 'Pacto social y fiscal', icono: '🤝',
      puede(E) { return E.gobierno.presidente === 'J' || (E.jugador.cargo === 'ministro' && ['hacienda', 'trabajo'].includes(E.jugador.cargoInfo && E.jugador.cargoInfo.ministerio)) ? true : 'Sólo el Presidente o el ministro de Hacienda/Trabajo'; },
      crear(E) { return { titulo: 'Gran pacto social y fiscal', contraparte: { n: 'Gremios y sindicatos', icono: '🏭', flex: U.ri(35, 65), poder: 60 }, leverage: U.clamp(50 + (E.opinion.aprobacionPres - 45) * 0.35, 20, 80), temas: [{ id: 'tributaria', n: 'Reforma tributaria', brecha: U.ri(50, 80), peso: 3, linea: false }, { id: 'salario', n: 'Salario mínimo y empleo', brecha: U.ri(40, 75), peso: 2, linea: false }, { id: 'pensiones', n: 'Pensiones', brecha: U.ri(50, 85), peso: 2, linea: true }, { id: 'informalidad', n: 'Formalización laboral', brecha: U.ri(30, 65), peso: 1, linea: false }] }; },
      fin(E, m, r) { if (r === 'acuerdo') { const q = 1 - Mesa.brechaProm(m) / 100; C.Economia.programar(E, [{ v: 'deficit', d: -0.35 * q, p: 'm' }, { v: 'confianza', d: 1.2 * q, p: 'm' }, { v: 'pobreza', d: -0.25 * q, p: 'l' }, { v: 'inversion', d: 0.3 * q, p: 'l' }], 'mesa'); C.Opinion.subirRec(E, 3); if (C.Poderes) { C.Poderes.mover(E, 'banca', 6); } } else if (r === 'ruptura') { E.economia.confianza = U.clamp(E.economia.confianza - 1, 5, 95); } } },
    sector: { n: 'Negociar una medida económica', icono: '🏦',
      puede(E, ref) { return C.Modelo && C.Modelo.def(ref) ? true : 'Elige la medida'; },
      crear(E, ref) { const d = C.Modelo.def(ref), a = C.Modelo.actorDe(E, ref); return { titulo: `Negociar: ${d.n}`, contraparte: { n: a.n, icono: a.icono, flex: U.ri(25, 60), poder: a.poder }, leverage: U.clamp(50 + (E.opinion.aprobacionPres - 45) * 0.4 - (a.poder - 60) * 0.3, 15, 85), temas: [{ id: 'indemnizacion', n: 'Indemnización y plazos', brecha: U.ri(45, 80), peso: 2, linea: false }, { id: 'garantias', n: 'Garantías para trabajadores y usuarios', brecha: U.ri(35, 70), peso: 2, linea: false }, { id: 'gradualidad', n: 'Gradualidad de la medida', brecha: U.ri(40, 80), peso: 3, linea: true }] }; },
      fin(E, m, r) { if (r === 'acuerdo') C.Modelo.aplicar(E, m.ref, { negociada: true, via: m.viaMedida || 'mesa' }); else { C.Medios.noticia(E, { tipo: 'gobierno', titular: `Fracasa la negociación sobre «${C.Modelo.def(m.ref).n}»: el Gobierno la aplaza`, tono: -1 }); } } },
    transicion: { n: 'Mesa de transición a la democracia', icono: '🗳',
      puede(E) { return C.Regimen && C.Regimen.puedeMesa(E) === true ? true : (C.Regimen ? C.Regimen.puedeMesa(E) : 'No disponible'); },
      crear(E) { return C.Regimen.crearMesa(E); },
      fin(E, m, r) { C.Regimen.mesaTerminada(E, m, r); } }
  };

  const Mesa = {
    TACT, TIPOS, INC,
    clave: 'mesas',
    asegurar(E) { if (E.mesas && E.mesas.activas) return E.mesas; E.mesas = { activas: [], hist: [] }; return E.mesas; },
    init(E) { E.mesas = null; },
    get(E, id) { return Mesa.asegurar(E).activas.find(x => x.id === id); },
    brechaProm(m) { const a = m.temas; return U.suma(a.map(t => t.brecha * t.peso)) / Math.max(1, U.suma(a.map(t => t.peso))); },
    costoTotal(m) { return U.suma(m.temas.map(t => t.costoJ || 0)); },
    peso(m, est) { return U.suma(m.temas.filter(t => t.estado === est).map(t => t.peso)); },
    crear(E, tipo, ref, extra) {
      const T = TIPOS[tipo], d = T.crear(E, ref), M = Mesa.asegurar(E);
      const m = Object.assign({ id: U.id('mesa'), tipo, ref, t0: E.fecha.t, ronda: 0, max: 18, confianza: U.ri(35, 50), momentum: 0, presion: 0, mediador: null, log: [], pendiente: null, idle: 0, estado: 'abierta', npc: false, ultimo: E.fecha.t }, d);
      m.temas.forEach(t => { t.estado = 'abierto'; t.costoJ = 0; t.brecha0 = t.brecha; });
      M.activas.push(m); Mesa.log(m, `Se instala la ${T.n.toLowerCase()}: «${m.titulo}»`, 0); return m;
    },
    log(m, txt, t) { m.log.unshift({ t: t != null ? t : C.E.fecha.t, txt }); if (m.log.length > 30) m.log.length = 30; },
    ambiente(m) { const k = m.momentum; return k > 30 ? ['Euforia', 'verde'] : k > 10 ? ['Optimismo', 'verde'] : k > -10 ? ['Tensa calma', 'amar'] : k > -30 ? ['Tensión', 'rojo'] : ['Crisis', 'rojo']; },
    fx(E, m, fx) {
      if (fx.momentum) m.momentum = U.clamp(m.momentum + fx.momentum, -70, 70);
      if (fx.confianza) m.confianza = U.clamp(m.confianza + fx.confianza, 0, 100);
      if (fx.presion) m.presion = U.clamp(m.presion + fx.presion, 0, 100);
      if (fx.brecha) for (const t of m.temas) if (t.estado === 'abierto') t.brecha = U.clamp(t.brecha + fx.brecha * (0.6 + 0.4 * (t.peso / 3)), 0, 100);
      if (fx.costoJ) { const ab = m.temas.filter(t => t.estado === 'abierto'); if (ab.length) U.pick(ab).costoJ += fx.costoJ; }
      if (fx.aprob) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + fx.aprob, 3, 95);
      if (fx.rec) C.Opinion.subirRec(E, fx.rec);
      if (fx.nuevoTema) m.temas.push({ id: U.id('nt'), n: U.pick(['Una exigencia adicional', 'Garantías de seguridad', 'Un nuevo punto de la agenda', 'Compromisos de implementación']), brecha: U.ri(40, 75), peso: 1, linea: false, estado: 'abierto', costoJ: 0, brecha0: 60 });
    },
    cerrarTemas(E, m) { for (const t of m.temas) if (t.estado === 'abierto' && t.brecha <= 10) { t.estado = 'acordado'; t.brecha = 0; Mesa.log(m, `Se acuerda el tema «${t.n}»`); m.momentum = U.clamp(m.momentum + 6, -70, 70); m.confianza = U.clamp(m.confianza + 3, 0, 100); } },
    evaluar(E, m) {
      Mesa.cerrarTemas(E, m);
      if (m.temas.every(t => t.estado === 'acordado')) return Mesa.cerrar(E, m, 'acuerdo');
      if (m.ronda >= 3 && (m.confianza <= 0 || m.momentum <= -55)) { m.crisis = (m.crisis || 0) + 1; if (m.crisis >= 2 || m.confianza <= 0) return Mesa.cerrar(E, m, 'ruptura'); } else m.crisis = 0;
      if (m.ronda >= m.max) return Mesa.cerrar(E, m, 'congelada');
    },
    cerrar(E, m, r) {
      m.estado = r; m.t1 = E.fecha.t; const M = Mesa.asegurar(E);
      M.activas = M.activas.filter(x => x !== m); M.hist.unshift(m); if (M.hist.length > 12) M.hist.length = 12;
      const T = TIPOS[m.tipo];
      Mesa.log(m, r === 'acuerdo' ? '¡Se firma el acuerdo!' : r === 'ruptura' ? 'La mesa se rompe' : 'La mesa queda congelada');
      if (r === 'acuerdo') C.Opinion.subirRec(E, 2 + Math.min(4, m.temas.length));
      C.Medios.noticia(E, { tipo: 'gobierno', titular: r === 'acuerdo' ? `Acuerdo en «${m.titulo}»` : r === 'ruptura' ? `Se rompe la negociación: «${m.titulo}»` : `Congelada la negociación: «${m.titulo}»`, tono: r === 'acuerdo' ? 1 : -1, importante: true, jugador: true });
      try { T.fin(E, m, r); } catch (e) { console.error('[Mesa] fin', e); }
      C.Bus.emit('mesa:fin', { mesa: m, resultado: r });
    },
    /* Efecto de una táctica del jugador */
    tactica(E, m, id, tema, tema2) {
      const T = TACT[id], M = m, J = E.jugador, flex = M.contraparte.flex, lev = M.leverage;
      const abre = x => M.temas.find(t => t.id === x && t.estado === 'abierto');
      const t1 = abre(tema), t2 = abre(tema2);
      let msg = '';
      const aplicar = (t, d, cj) => { t.brecha = U.clamp(t.brecha - d, 0, 100); t.costoJ += cj; };
      const ruido = U.gauss(0, 0.18);
      if (id === 'proponer') { const d = U.rf(7, 15) * (0.6 + M.confianza / 100) * (0.7 + flex / 100) * (1 + M.momentum / 150) * (1 + ruido) * (t1.linea && t1.brecha < 30 ? 0.5 : 1); aplicar(t1, d, d * 0.4); M.confianza += 1; M.momentum += 2; msg = `Tu fórmula sobre «${t1.n}» avanza ${Math.round(d)} puntos`; }
      else if (id === 'ceder') { const d = U.rf(18, 30) * (1 + ruido); aplicar(t1, d, d * 0.9); M.momentum += 8; M.confianza += 4; msg = `Concedes en «${t1.n}»: la brecha cae ${Math.round(d)} puntos, pero ${C.E.gobierno.presidente === 'J' ? 'tu base lo notará' : 'te costará políticamente'}`; }
      else if (id === 'presionar') { const p = U.clamp(0.35 + (lev - 50) / 150 - (t1.linea ? 0.15 : 0) + M.presion / 400, 0.1, 0.85); if (U.chance(p)) { const d = U.rf(10, 20); aplicar(t1, d, 0); M.confianza -= 6; M.momentum += 3; msg = `La presión funciona: «${t1.n}» cede ${Math.round(d)} puntos (${Math.round(p * 100)} % de probabilidad)`; } else { M.confianza -= 12; M.momentum -= 8; msg = `La presión sale mal: la contraparte se atrinchera (${Math.round(p * 100)} % de probabilidad)`; } }
      else if (id === 'gesto') { const d = U.rf(8, 16); M.confianza += d; M.momentum += 4; C.Opinion.subirRec(E, 0.3); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.2, 3, 95); msg = `Un gesto de buena fe sube la confianza (+${Math.round(d)})`; }
      else if (id === 'filtrar') { M.presion = U.clamp(M.presion + 15, 0, 100); if (U.chance(0.35)) { M.confianza -= 15; M.momentum -= 10; J.rep.honestidad = U.clamp(J.rep.honestidad - 1, 0, 100); msg = 'La filtración se descubre: la contraparte se siente traicionada'; } else { for (const t of M.temas) if (t.estado === 'abierto') t.brecha = U.clamp(t.brecha - 3, 0, 100); msg = 'La filtración presiona a la contraparte ante la opinión pública'; } }
      else if (id === 'mediador') { M.mediador = { n: U.pick(['un exembajador', 'la Iglesia', 'un organismo multilateral', 'un expresidente', 'la ONU']) }; M.momentum += 10; M.confianza += 6; msg = `Entra como mediador ${M.mediador.n}: más impulso y confianza`; }
      else if (id === 'pausa') { M.momentum = Math.round(M.momentum * 0.5); M.confianza += 3; M.idle = 2; msg = 'Receso: se enfrían los ánimos y se recupera algo de confianza'; }
      else if (id === 'ultimatum') { const p = U.clamp(0.25 + (lev - 50) / 120 + M.presion / 400, 0.1, 0.75); if (U.chance(p)) { for (const t of M.temas) if (t.estado === 'abierto') t.brecha = U.clamp(t.brecha - U.rf(12, 22), 0, 100); M.momentum += 10; msg = `El ultimátum funciona (${Math.round(p * 100)} %): la contraparte cede en varios temas`; } else { M.confianza -= 20; M.momentum -= 20; msg = `El ultimátum fracasa (${Math.round(p * 100)} %): se enrarece la mesa`; if (U.chance(0.4)) M.confianza = Math.min(M.confianza, 0); } }
      else if (id === 'paquete') { const d1 = U.rf(9, 18) * (1 + ruido), d2 = U.rf(9, 18) * (1 + ruido); aplicar(t1, d1, d1 * 0.4); aplicar(t2, d2, d2 * 0.4); M.momentum += 5; msg = `Paquete sobre «${t1.n}» y «${t2.n}»: avances de ${Math.round(d1)} y ${Math.round(d2)} puntos`; }
      M.confianza = U.clamp(M.confianza, 0, 100); M.momentum = U.clamp(M.momentum, -70, 70);
      return msg;
    },
    /* Cierra el turno de la ronda: la contraparte responde, fluctúa el impulso y quizá estalla un incidente */
    ronda(E, m) {
      m.ronda++; m.idle = 0; m.ultimo = E.fecha.t;
      m.momentum = U.clamp(m.momentum * 0.88 + U.gauss(0, 5), -70, 70);
      // la contraparte hace su jugada
      const r = U.rf(0, 1), hostil = m.confianza < 25 || m.momentum < -25;
      if (hostil && r < 0.4) { const ab = m.temas.filter(t => t.estado === 'abierto'); if (ab.length) { const t = U.pick(ab); t.brecha = U.clamp(t.brecha + U.rf(4, 10), 0, 100); Mesa.log(m, `La contraparte endurece su posición en «${t.n}»`); } m.confianza = U.clamp(m.confianza - 2, 0, 100); }
      else if (!hostil && r < 0.3) { const ab = m.temas.filter(t => t.estado === 'abierto'); if (ab.length) { const t = U.pick(ab); t.brecha = U.clamp(t.brecha - U.rf(3, 8), 0, 100); Mesa.log(m, `La contraparte flexibiliza su postura en «${t.n}»`); } }
      const p = 0.18 + (m.momentum < 0 ? 0.1 : 0) - (m.mediador ? 0.06 : 0);
      if (!m.pendiente && U.chance(p)) {
        const pool = INC.filter(i => !i.tipos || i.tipos.includes(m.tipo)); const inc = U.pick(pool);
        m.pendiente = { id: inc.id, n: inc.n, txt: inc.txt, ops: inc.ops.map(o => ({ t: o[0], fx: o[1] })) }; Mesa.log(m, `Incidente: ${inc.n}`);
      }
      Mesa.evaluar(E, m);
    },
    turno(E) {
      const M = Mesa.asegurar(E);
      for (const m of M.activas.slice()) {
        m.idle++; m.momentum = U.clamp(m.momentum * 0.97, -70, 70);
        if (m.idle > 8) { m.confianza = U.clamp(m.confianza - 1.5, 0, 100); m.momentum -= 1.5; if (m.idle === 9) Mesa.log(m, 'La mesa lleva semanas sin moverse: se enfría'); }
        if (m.idle > 24) { Mesa.cerrar(E, m, 'congelada'); continue; }
        if (m.npc && E.fecha.t % 3 === 0) Mesa.npcAvance(E, m);
      }
    },
    /* Mesas que llevan sin jugador (p. ej. una transición entre NPC) avanzan solas */
    npcAvance(E, m) {
      const p = U.clamp(0.4 + (m.leverage - 50) / 200 + m.confianza / 300, 0.15, 0.8);
      for (const t of m.temas) if (t.estado === 'abierto' && U.chance(p)) t.brecha = U.clamp(t.brecha - U.rf(5, 14), 0, 100);
      m.confianza = U.clamp(m.confianza + U.gauss(0, 4), 0, 100); m.momentum = U.clamp(m.momentum + U.gauss(0, 7), -70, 70); m.ronda++; m.idle = 0;
      Mesa.evaluar(E, m);
    },
    registrarAcciones() {
      const A = C.Acciones, mesa = (E, a) => Mesa.get(E, a.mesa);
      const abierta = (E, a) => { const m = mesa(E, a); return m ? true : 'No hay una mesa abierta con ese código'; };
      A.registrar({ id: 'abrirMesa', nombre: 'Abrir una mesa de negociación', icono: '🪑', grupo: 'negociacion', costo: 2,
        disponible(E, a) { const T = TIPOS[a.tipo]; if (!T) return 'Elige el tipo de mesa'; if (Mesa.asegurar(E).activas.some(m => m.tipo === a.tipo && String(m.ref) === String(a.ref))) return 'Ya hay una mesa igual abierta'; if (Mesa.asegurar(E).activas.length >= 4) return 'Tienes demasiadas mesas abiertas'; return T.puede(E, a.ref); },
        ejecutar(E, a) { const m = Mesa.crear(E, a.tipo, a.ref, a.viaMedida ? { viaMedida: a.viaMedida } : null); return { ok: true, msg: `Se abre la mesa: ${m.titulo}`, mesa: m.id }; } });
      A.registrar({ id: 'mesaTactica', nombre: 'Jugar una táctica en la mesa', icono: '♟', grupo: 'negociacion', costo: (E, a) => (TACT[a && a.tactica] || { costo: 1 }).costo,
        disponible(E, a) {
          const m = mesa(E, a); if (!m) return 'No hay una mesa abierta con ese código'; const T = TACT[a.tactica]; if (!T) return 'Elige una táctica';
          if (m.pendiente) return 'Antes debes resolver el incidente en la mesa';
          const ab = m.temas.filter(t => t.estado === 'abierto');
          if (T.tema >= 1 && !ab.find(t => t.id === a.tema)) return 'Elige un tema abierto';
          if (T.tema === 2 && (!ab.find(t => t.id === a.tema2) || a.tema2 === a.tema)) return 'Elige dos temas abiertos distintos';
          if (a.tactica === 'mediador' && m.mediador) return 'Ya hay un mediador';
          return true;
        },
        ejecutar(E, a) { const m = mesa(E, a); const msg = Mesa.tactica(E, m, a.tactica, a.tema, a.tema2); Mesa.log(m, msg); Mesa.ronda(E, m); return { ok: true, msg }; } });
      A.registrar({ id: 'resolverIncidenteMesa', nombre: 'Resolver un incidente en la mesa', icono: '⚡', grupo: 'negociacion', costo: 0,
        disponible(E, a) { const m = mesa(E, a); return m && m.pendiente && m.pendiente.ops[a.op] ? true : 'No hay incidente que resolver'; },
        ejecutar(E, a) { const m = mesa(E, a), op = m.pendiente.ops[a.op]; Mesa.fx(E, m, op.fx); Mesa.log(m, `Decisión: ${op.t}`); m.pendiente = null; Mesa.evaluar(E, m); return { ok: true, msg: `Decides: ${op.t}` }; } });
      A.registrar({ id: 'firmarAcuerdoMesa', nombre: 'Firmar un acuerdo parcial', icono: '✍', grupo: 'negociacion', costo: 1,
        disponible(E, a) { const m = mesa(E, a); if (!m) return 'No hay mesa'; const tot = U.suma(m.temas.map(t => t.peso)), ok = Mesa.peso(m, 'acordado') + U.suma(m.temas.filter(t => t.estado === 'abierto' && t.brecha <= 30).map(t => t.peso)); return ok / tot >= 0.75 ? true : 'Todavía no hay consenso suficiente (se necesita cerrar o casi cerrar el 75 % de los temas)'; },
        ejecutar(E, a) { const m = mesa(E, a); for (const t of m.temas) if (t.estado === 'abierto') { t.costoJ += t.brecha * 0.4; t.estado = 'acordado'; } Mesa.cerrar(E, m, 'acuerdo'); return { ok: true, msg: 'Firmas un acuerdo parcial: los temas pendientes se aplazan con concesiones' }; } });
      A.registrar({ id: 'abandonarMesa', nombre: 'Levantarse de la mesa', icono: '🚪', grupo: 'negociacion', costo: 0, disponible: abierta,
        ejecutar(E, a) { const m = mesa(E, a); Mesa.cerrar(E, m, 'ruptura'); return { ok: true, msg: 'Te levantas de la mesa: ruptura' }; } });
    }
  };
  C.Mesa = Mesa; Mesa.migrar = Mesa.init;
  C.Tiempo.registrar('mesas', Mesa, 72); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Mesa'); Mesa.registrarAcciones();
})(window.CURUL);
