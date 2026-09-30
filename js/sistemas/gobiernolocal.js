/* Gobierno local: gabinete, presupuesto y decretos para el jugador cuando es gobernador o alcalde.
   Para no disparar el tamaño de la partida ni simular 33 asambleas y cientos de concejos, sólo se
   modela en profundidad el departamento donde el JUGADOR ejerce; el resto de gobernadores y
   alcaldes del país siguen existiendo como cargos, tal como en la Fase 1-2.
   Las secretarías se financian y reasignan por decreto (potestad ejecutiva normal); crear una
   secretaría nueva sí necesita el visto bueno de la Asamblea (ordenanza) o el Concejo (acuerdo),
   simulado aquí como una votación rápida según la composición política de la región, sin llegar a
   recrear un hemiciclo local completo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const SECRETARIAS = [
    ['gobierno', 'Secretaría de Gobierno', 'politica', 20],
    ['hacienda', 'Secretaría de Hacienda', 'hacienda', 12],
    ['salud', 'Secretaría de Salud', 'salud', 20],
    ['educacion', 'Secretaría de Educación', 'educacion', 22],
    ['infraestructura', 'Secretaría de Infraestructura', 'infraestructura', 18],
    ['planeacion', 'Secretaría de Planeación', 'tecnologia', 8]
  ];
  const EFECTO = { salud: 'salud', educacion: 'educacion', infraestructura: 'infraestructura', gobierno: 'seguridad' };
  /* Megaproyectos concretos para la obra bandera: cada uno queda ligado a una secretaría (para el
     efecto sobre el indicador y el gestor a cargo) pero se nombra y se filtra como una obra real,
     no como "la secretaría de X". minPob filtra por población (miles) de la entidad que ejecuta
     (capital si es alcaldía, departamento si es gobernación); soloAlcaldia reserva el metro a las
     grandes ciudades, que es donde tiene sentido. */
  const OBRAS_BANDERA = [
    ['metro', 'Sistema de metro', '🚇', 'infraestructura', { soloAlcaldia: true, minPob: 1400 }],
    ['aeropuerto', 'Aeropuerto regional', '✈️', 'infraestructura', { minPob: 350 }],
    ['terminal', 'Terminal de transporte', '🚌', 'infraestructura', {}],
    ['malla_vial', 'Malla vial y puentes', '🛣️', 'infraestructura', {}],
    ['hospital', 'Hospital de tercer nivel', '🏥', 'salud', { minPob: 300 }],
    ['centros_salud', 'Red de centros de salud rural', '⚕️', 'salud', {}],
    ['megacolegio', 'Megacolegio', '🏫', 'educacion', {}],
    ['universidad', 'Universidad pública', '🎓', 'educacion', { minPob: 500 }],
    ['ciudadela', 'Ciudadela de seguridad y justicia', '🚔', 'gobierno', {}],
    ['parque', 'Parque metropolitano', '🌳', 'planeacion', {}],
    ['convenciones', 'Centro de convenciones', '🏛', 'hacienda', {}]
  ];
  const ORGANOS = { gobernacion: { cargo: 'gobernador', corp: 'Asamblea Departamental', acto: 'Ordenanza' }, alcaldia: { cargo: 'alcalde', corp: 'Concejo Municipal', acto: 'Acuerdo' } };
  /* Programas de política pública por secretaría: cada uno se puede "lanzar" como una acción
     concreta (no sólo mover el presupuesto), con un efecto acotado sobre el indicador asociado. */
  const PROGRAMAS = {
    gobierno: [['Frentes de seguridad barrial', 'seguridad'], ['Casas de justicia', 'seguridad']],
    hacienda: [['Modernización catastral', null], ['Fiscalización tributaria', null]],
    salud: [['Brigadas de salud rural', 'salud'], ['Ampliación de cobertura', 'salud']],
    educacion: [['Jornada única regional', 'educacion'], ['Transporte escolar', 'educacion']],
    infraestructura: [['Placa-huella en vías terciarias', 'infraestructura'], ['Alumbrado público', 'infraestructura']],
    planeacion: [['Banco de proyectos', null], ['Actualización del POT', null]]
  };

  const GL = {
    SECRETARIAS, ORGANOS, OBRAS_BANDERA,
    obrasDisponibles(E, depto, organo) {
      const d = E.deptos[depto];
      const pob = organo === 'alcaldia' ? GL.poblacionCapital(d) : d.poblacion;
      return OBRAS_BANDERA.filter(o => (!o[4].soloAlcaldia || organo === 'alcaldia') && pob >= (o[4].minPob || 0))
        .map(o => ({ id: o[0], nombre: o[1], icono: o[2], sector: o[3] }));
    },
    /* Población aproximada de la capital (no hay dato municipal propio: se estima del departamento). */
    poblacionCapital: d => Math.max(120, Math.round(d.poblacion * (d.id === 'BOG' || d.id === 'SAP' ? 1 : 0.38))),
    presupuestoTotal(E, depto, organo) {
      const d = E.deptos[depto];
      const pob = organo === 'alcaldia' ? GL.poblacionCapital(d) : d.poblacion;   // miles de habitantes
      const k = organo === 'alcaldia' ? 0.0075 : 0.011;                          // billones por cada mil habitantes/año
      return Math.max(0.3, pob * k);
    },
    /* Crea (si no existe) el gabinete local del jugador al asumir gobernación o alcaldía. */
    asegurar(E, depto, organo) {
      const d = E.deptos[depto];
      d.gobLocal = d.gobLocal || {};
      if (d.gobLocal[organo]) {
        // Partidas guardadas antes de la Fase 18 no tienen estos campos: se rellenan solos.
        const g = d.gobLocal[organo];
        if (g.fondoRegalias == null) g.fondoRegalias = 0;
        if (g.regaliasUlt === undefined) g.regaliasUlt = null;
        if (g.obraBandera === undefined) g.obraBandera = null;
        if (!g.obras) g.obras = [];
        if (!g.civico) g.civico = { descontento: U.ri(10, 25), relJ: 0, paro: null };
        if (g.ultimaRendicion == null) g.ultimaRendicion = E.fecha.t;
        return g;
      }
      const pesoBase = {}; let tot = 0; for (const s of SECRETARIAS) tot += s[3];
      for (const s of SECRETARIAS) pesoBase[s[0]] = s[3] / tot * 100;
      const shares = Object.assign({}, pesoBase);
      const secretarios = {};
      for (const s of SECRETARIAS) secretarios[s[0]] = C.Politicos.crear(E, { partido: E.jugador.partido, depto, r: { exp: U.ri(40, 85) } }).id;
      const g = { extra: [], pesoBase, shares, secretarios, decretos: 0, historial: [],
        fondoRegalias: 0, regaliasUlt: null, obraBandera: null, obras: [],
        civico: { descontento: U.ri(10, 25), relJ: 0, paro: null }, ultimaRendicion: E.fecha.t };
      d.gobLocal[organo] = g;
      return g;
    },
    /* Gestión local de un secretario: mismo espíritu que Gabinete.asegurar para los ministros
       nacionales, inicializada perezosamente para no romper partidas guardadas antes de esta fase. */
    asegurarSecretario(pol) {
      if (pol.gestion == null) pol.gestion = U.clamp(Math.round((pol.r.exp + (pol.r.pra || 50)) / 2 + U.gauss(0, 6)), 15, 90);
      if (pol.logros == null) pol.logros = 0;
      return pol;
    },
    secretariasDe(g) { return SECRETARIAS.map(s => ({ id: s[0], nombre: s[1], sector: s[2] })).concat(g.extra || []); },
    asignado(E, depto, organo) {
      const g = E.deptos[depto].gobLocal[organo], tot = GL.presupuestoTotal(E, depto, organo);
      const out = {}; for (const k of Object.keys(g.shares)) out[k] = tot * g.shares[k] / 100;
      return out;
    },
    setShare(E, depto, organo, secId, pct) {
      const g = E.deptos[depto].gobLocal[organo]; if (!g) return;
      pct = U.clamp(pct, 1, 55);
      const otros = Object.keys(g.shares).filter(k => k !== secId);
      const sumOtros = U.suma(otros.map(k => g.shares[k])), restante = 100 - pct;
      if (sumOtros <= 0.01) otros.forEach(k => g.shares[k] = restante / otros.length);
      else otros.forEach(k => g.shares[k] = Math.max(0.5, g.shares[k] / sumOtros * restante));
      g.shares[secId] = pct;
      const tot = U.suma(Object.values(g.shares)); for (const k of Object.keys(g.shares)) g.shares[k] = g.shares[k] / tot * 100;
    },
    subfinanciada(E, depto, organo, secId) {
      const g = E.deptos[depto].gobLocal[organo]; if (!g) return false;
      return g.shares[secId] < g.pesoBase[secId] * 0.7;
    },
    /* Nombrar personalmente a un secretario: igual que el presidente con un ministro, eliges el
       partido (o técnico sin partido) y se designa a alguien nuevo en su lugar. */
    designarSecretario(E, depto, organo, secId, partido) {
      const g = GL.asegurar(E, depto, organo);
      const ant = E.politicos[g.secretarios[secId]]; if (ant) C.Politicos.anotar(ant, 'Sale de la secretaría');
      const pid = partido && E.partidos[partido] ? partido : null;
      const nuevo = C.Politicos.crear(E, { partido: pid, depto, r: { exp: U.ri(40, 85) } });
      if (!pid) nuevo.profesion = 'Técnico de carrera';
      g.secretarios[secId] = nuevo.id;
      nuevo.aprob = U.ri(40, 60);
      C.Politicos.anotar(nuevo, 'Designado secretario');
      const nombreSec = GL.secretariasDe(g).find(s => s.id === secId).nombre;
      C.Medios.noticia(E, { tipo: 'regional', titular: `${nuevo.nombre} es el nuevo encargado de la ${nombreSec}`, tono: 0, jugador: true });
      return nuevo;
    },
    programasDe(secId) { return PROGRAMAS[secId] || []; },
    /* Lanza un programa de política pública concreto: efecto acotado y con algo de azar sobre el
       indicador asociado (si lo tiene) y sobre la imagen del secretario y del jugador. */
    lanzarPrograma(E, depto, organo, secId, idx) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto];
      const prog = PROGRAMAS[secId] && PROGRAMAS[secId][idx]; if (!prog) return null;
      const [nombre, campo] = prog;
      const mult = C.Federalizacion ? C.Federalizacion.multiplicador(E, secId) : 1;
      const magnitud = campo ? U.rf(1, 2.4) * mult : 0;
      if (campo && d[campo] != null) d[campo] = U.clamp(d[campo] + magnitud, 1, 99);
      const sec = E.politicos[g.secretarios[secId]]; if (sec) sec.aprob = U.clamp((sec.aprob || 50) + U.rf(0.5, 1.8), 0, 100);
      C.Opinion.moverImagen(E, { dep: { [depto]: 0.8 } });
      const nombreSec = GL.secretariasDe(g).find(s => s.id === secId).nombre;
      g.historial.unshift({ t: E.fecha.t, txt: `Lanza el programa «${nombre}» (${nombreSec})${campo ? ' · ' + U.signo(magnitud, 1) + ' ' + campo : ''}` });
      C.Medios.noticia(E, { tipo: 'regional', titular: `${organo === 'gobernacion' ? 'La Gobernación de ' + d.nombre : 'La Alcaldía de ' + d.capital} lanza «${nombre}»`, tono: 1, jugador: true });
      return { nombre, campo, magnitud };
    },

    /* ── Gabinete local 2.0: cada secretario propone sus propias iniciativas (de los mismos
       PROGRAMAS de arriba) y puede protagonizar una crisis propia — mismo mecanismo que el
       Gabinete 2.0 nacional (Fase 13), a escala departamental/municipal. */
    proponerIniciativaLocal(E, depto, organo, secId) {
      const g = GL.asegurar(E, depto, organo);
      const pol = E.politicos[g.secretarios[secId]]; if (!pol || pol.iniciativa || pol.crisisActiva) return;
      const progs = PROGRAMAS[secId]; if (!progs || !progs.length) return;
      const [nombre, campo] = U.pick(progs);
      pol.iniciativa = { programa: nombre, campo, estado: 'propuesta', t: E.fecha.t, semanas: U.ri(4, 8) };
    },
    resolverIniciativaLocal(E, depto, organo, secId) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto];
      const pol = E.politicos[g.secretarios[secId]]; if (!pol || !pol.iniciativa) return;
      GL.asegurarSecretario(pol);
      const { programa, campo } = pol.iniciativa;
      const nombreSec = GL.secretariasDe(g).find(s => s.id === secId).nombre;
      const exito = U.chance(U.clamp(0.28 + pol.gestion / 160 + (pol.relJ || 0) / 400, 0.12, 0.85));
      if (exito) {
        pol.gestion = U.clamp(pol.gestion + U.ri(3, 8), 0, 100);
        pol.logros++;
        pol.aprob = U.clamp((pol.aprob || 50) + U.rf(2, 5), 0, 100);
        if (campo && d[campo] != null) {
          const mult = C.Federalizacion ? C.Federalizacion.multiplicador(E, secId) : 1;
          d[campo] = U.clamp(d[campo] + U.rf(1.5, 3) * mult, 1, 99);
        }
        C.Medios.noticia(E, { tipo: 'regional', titular: `«${programa}» sale adelante en la ${nombreSec}`, tono: 1, jugador: true });
      } else {
        pol.gestion = U.clamp(pol.gestion - U.ri(4, 10), 0, 100);
        pol.aprob = U.clamp((pol.aprob || 50) - U.rf(2, 6), 0, 100);
        C.Medios.noticia(E, { tipo: 'regional', titular: `«${programa}» no logra los resultados esperados en la ${nombreSec}`, tono: -1, jugador: true });
        if (U.chance(0.3)) GL.crisisSecretario(E, depto, organo, secId);
      }
      pol.iniciativa = null;
    },
    aceptarIniciativaLocal(E, depto, organo, secId) {
      const g = GL.asegurar(E, depto, organo);
      const pol = E.politicos[g.secretarios[secId]]; if (!pol || !pol.iniciativa || pol.iniciativa.estado !== 'propuesta') return { ok: false, msg: 'No hay una propuesta pendiente en esa secretaría' };
      pol.iniciativa.estado = 'en_curso'; pol.iniciativa.semanasTot = pol.iniciativa.semanas;
      pol.relJ = U.clamp((pol.relJ || 0) + 3, -100, 100);
      return { ok: true, msg: 'Respaldas la iniciativa' };
    },
    rechazarIniciativaLocal(E, depto, organo, secId) {
      const g = GL.asegurar(E, depto, organo);
      const pol = E.politicos[g.secretarios[secId]]; if (!pol || !pol.iniciativa || pol.iniciativa.estado !== 'propuesta') return { ok: false, msg: 'No hay una propuesta pendiente en esa secretaría' };
      pol.relJ = U.clamp((pol.relJ || 0) - 3, -100, 100);
      pol.iniciativa = null;
      return { ok: true, msg: 'Rechazas la propuesta' };
    },
    CRISIS_LOCAL: ['un contrato cuestionado en una obra de la secretaría', 'una denuncia de negligencia en su gestión',
      'un escándalo de nepotismo en su equipo', 'un manejo cuestionado de recursos públicos'],
    crisisSecretario(E, depto, organo, secId) {
      const g = GL.asegurar(E, depto, organo);
      const pol = E.politicos[g.secretarios[secId]]; if (!pol || pol.crisisActiva) return;
      const motivo = U.pick(GL.CRISIS_LOCAL), grave = U.chance(0.3);
      pol.crisisActiva = { motivo, grave, t: E.fecha.t };
      pol.aprob = U.clamp((pol.aprob || 50) - U.ri(4, 10), 0, 100);
      const nombreSec = GL.secretariasDe(g).find(s => s.id === secId).nombre;
      C.Medios.noticia(E, { tipo: 'escandalo', titular: `Sale a la luz ${motivo} del secretario de ${nombreSec}`, tono: -1, importante: grave, jugador: true });
    },
    respaldarSecretario(E, depto, organo, secId) {
      const g = GL.asegurar(E, depto, organo);
      const pol = E.politicos[g.secretarios[secId]]; if (!pol || !pol.crisisActiva) return { ok: false, msg: 'No hay una crisis activa en esa secretaría' };
      pol.relJ = U.clamp((pol.relJ || 0) + 6, -100, 100);
      if (pol.crisisActiva.grave) C.Opinion.moverImagen(E, { dep: { [depto]: -0.5 } });
      pol.crisisActiva = null;
      return { ok: true, msg: 'Respaldas al secretario pese a la polémica' };
    },
    destituirSecretario(E, depto, organo, secId) {
      const g = GL.asegurar(E, depto, organo);
      if (!E.politicos[g.secretarios[secId]]) return { ok: false, msg: 'No hay secretario en esa cartera' };
      GL.designarSecretario(E, depto, organo, secId, null);
      return { ok: true, msg: 'Destituyes al secretario' };
    },
    /* Consejo de gobierno local: reúne al gabinete, sube algo la imagen del jugador en la región
       y la aprobación de sus secretarios — igual que el Consejo de Ministros nacional. */
    consejoLocal(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo);
      C.Opinion.moverImagen(E, { dep: { [depto]: 1.2 } });
      for (const s of GL.secretariasDe(g)) { const pol = E.politicos[g.secretarios[s.id]]; if (pol) pol.aprob = U.clamp((pol.aprob || 50) + U.rf(0.3, 1.2), 0, 100); }
      E.jugador.rep.liderazgo = U.clamp(E.jugador.rep.liderazgo + 0.5, 0, 100);
      g.historial.unshift({ t: E.fecha.t, txt: 'Reúne su gabinete y alinea la agenda de gobierno' });
    },

    /* ── Decretos: potestad ejecutiva directa, sin necesidad de aprobación de la corporación ── */
    decretar(E, depto, organo, secId, sentido) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto];
      g.decretos++;
      const ef = EFECTO[secId];
      const magnitud = (sentido === 'no' ? -1 : 1) * U.rf(1, 2.2);
      if (ef && d[ef] != null) d[ef] = U.clamp(d[ef] + magnitud, 1, 99);
      const J = E.jugador;
      J.rep.liderazgo = U.clamp(J.rep.liderazgo + 0.4, 0, 100);
      C.Opinion.moverImagen(E, { dep: { [depto]: 1.2 } });
      const numero = `${ORGANOS[organo].acto === 'Ordenanza' ? 'Ordenanza' : 'Decreto'} municipal`;
      const nombreSec = GL.secretariasDe(g).find(s => s.id === secId).nombre;
      const titulo = `${J.nombre} firma el Decreto ${g.decretos} de ${U.anio()} (${organo === 'gobernacion' ? 'Gobernación de ' + d.nombre : 'Alcaldía de ' + d.capital}): ${nombreSec.toLowerCase()}`;
      C.Politicos.anotar(E.politicos.J, 'Firma el Decreto ' + g.decretos + ' (' + nombreSec + ')');
      g.historial.unshift({ t: E.fecha.t, txt: `Decreto ${g.decretos}: intervención en ${nombreSec.toLowerCase()}${ef ? ' (' + U.signo(magnitud, 1) + ' ' + ef + ')' : ''}` });
      C.Medios.noticia(E, { tipo: 'regional', titular: titulo, tono: sentido === 'no' ? -1 : 1, jugador: true });
      return { ef, magnitud };
    },

    /* ── Crear una secretaría nueva: necesita el visto bueno de la corporación local, con una
       votación nominal real de sus diputados o concejales (no un simple lanzamiento de moneda). ── */
    probabilidadCorp(E, depto, organo) { return C.Corporaciones.apoyoEsperado(E, depto, organo); },
    proponerCreacion(E, depto, organo, nombre, sector) {
      const g = GL.asegurar(E, depto, organo);
      const voto = C.Corporaciones.votar(E, depto, organo, `Crear la ${nombre}`);
      const aprueba = voto.aprobado, marcador = `${voto.si}-${voto.no}`;
      const corp = ORGANOS[organo].corp, acto = ORGANOS[organo].acto;
      if (aprueba) {
        const id = U.id('sec');
        g.extra.push({ id, nombre, sector });
        const pct = 3, factor = (100 - pct) / 100;
        for (const k of Object.keys(g.shares)) g.shares[k] *= factor;
        g.shares[id] = pct;
        for (const k of Object.keys(g.pesoBase)) g.pesoBase[k] *= factor;
        g.pesoBase[id] = pct;
        g.secretarios[id] = C.Politicos.crear(E, { partido: E.jugador.partido, depto, r: { exp: U.ri(40, 80) } }).id;
        C.Medios.noticia(E, { tipo: 'regional', titular: `${corp} aprueba (${marcador}) el ${acto.toLowerCase()} que crea la ${nombre}`, tono: 1, jugador: true });
      } else {
        C.Medios.noticia(E, { tipo: 'regional', titular: `${corp} niega (${marcador}) el ${acto.toLowerCase()} para crear la ${nombre}`, tono: -1, jugador: true });
      }
      return { aprobado: aprueba, voto };
    },

    /* ── Regalías: pedirle al Gobierno Nacional un giro adicional. Le va mejor a quien está en la
       coalición de gobierno que a quien está en la oposición — la misma tensión centro-región real
       de la política colombiana. El fondo resultante se puede usar en la obra bandera. */
    probRegalias(E, depto, organo) {
      const J = E.jugador, coal = E.gobierno.coalicion || [];
      const pa = J.partido ? E.partidos[J.partido] : null;
      const enCoalicion = J.partido && coal.includes(J.partido);
      const enOposicion = pa && pa.postura === 'oposicion';
      const peso = C.Partidos.peso(E, E.politicos.J).dep;
      return U.clamp(0.25 + (enCoalicion ? 0.35 : enOposicion ? -0.15 : 0) + peso / 300, 0.05, 0.85);
    },
    pedirRegalias(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto];
      const exito = U.chance(GL.probRegalias(E, depto, organo));
      g.regaliasUlt = E.fecha.t;
      const nombreLugar = organo === 'gobernacion' ? d.nombre : d.capital;
      if (exito) {
        const monto = U.rf(0.15, 0.35) * GL.presupuestoTotal(E, depto, organo);
        g.fondoRegalias = (g.fondoRegalias || 0) + monto;
        C.Medios.noticia(E, { tipo: 'regional', titular: `El Gobierno Nacional gira regalías adicionales a ${nombreLugar}`, tono: 1, jugador: true });
        return { exito: true, monto };
      }
      C.Medios.noticia(E, { tipo: 'regional', titular: `El Gobierno Nacional niega un giro adicional de regalías a ${nombreLugar}`, tono: -1, jugador: true });
      return { exito: false };
    },

    /* ── Obra bandera: un megaproyecto de infraestructura visible, uno a la vez. Acelerarla la
       adelanta pero sube el riesgo de sobrecostos y, en el peor caso, un escándalo real. */
    iniciarObraBandera(E, depto, organo, obraId) {
      const g = GL.asegurar(E, depto, organo);
      const def = OBRAS_BANDERA.find(o => o[0] === obraId) || OBRAS_BANDERA[2];
      const semanas = U.ri(16, 24);
      g.obraBandera = { obraId: def[0], sector: def[3], t: E.fecha.t, semanas, semanasTot: semanas, acelerada: false };
    },
    acelerarObra(E, depto, organo) {
      const o = GL.asegurar(E, depto, organo).obraBandera; if (!o || o.acelerada) return;
      o.semanas = Math.max(1, o.semanas - 5); o.acelerada = true;
    },
    turnoObra(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo), o = g.obraBandera; if (!o) return;
      if (C.Licitacion) C.Licitacion.turnoObra(E, depto, organo);
      o.semanas--;
      if (o.semanas <= 0) GL.resolverObra(E, depto, organo);
    },
    nombreObra(o) {
      const def = OBRAS_BANDERA.find(x => x[0] === o.obraId) || OBRAS_BANDERA.find(x => x[3] === o.sector);
      return def ? { nombre: def[1], icono: def[2] } : { nombre: 'Obra de infraestructura', icono: '🏗' };
    },
    resolverObra(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto], o = g.obraBandera;
      const nombreObra = GL.nombreObra(o).nombre;
      const campo = EFECTO[o.sector] || null;
      const secPol = E.politicos[g.secretarios[o.sector]];
      const gestionSec = secPol ? GL.asegurarSecretario(secPol).gestion : 50;
      const tot = GL.presupuestoTotal(E, depto, organo);
      const fondoBonus = tot > 0 ? Math.min(0.25, (g.fondoRegalias || 0) / tot * 0.5) : 0;
      const prob = U.clamp(0.35 + gestionSec / 200 + fondoBonus - (o.acelerada ? 0.2 : 0) + (o.contratista ? (o.contratista.calidad - 60) / 250 : 0), 0.12, 0.9);
      const exito = U.chance(prob);
      const nombreLugar = organo === 'gobernacion' ? d.nombre : d.capital;
      g.obras = g.obras || [];
      if (exito) {
        if (campo && d[campo] != null) d[campo] = U.clamp(d[campo] + U.rf(5, 9), 1, 99);
        E.jugador.reconocimiento = U.clamp(E.jugador.reconocimiento + 10, 0, 100);
        E.jugador.rep.liderazgo = U.clamp(E.jugador.rep.liderazgo + 4, 0, 100);
        if (g.fondoRegalias) g.fondoRegalias = Math.max(0, g.fondoRegalias - tot * 0.15);
        g.obras.push({ t: E.fecha.t, obraId: o.obraId, sector: o.sector, exito: true });
        C.Medios.noticia(E, { tipo: 'regional', titular: `Se entrega ${nombreObra.toLowerCase()} en ${nombreLugar}: un antes y un después${campo ? ' en ' + campo : ''}`, tono: 1, importante: true, jugador: true });
      } else {
        const grave = o.acelerada && U.chance(0.4);
        C.Opinion.moverImagen(E, { dep: { [depto]: -2 } });
        if (grave) E.jugador.riesgoJudicial = U.clamp((E.jugador.riesgoJudicial || 0) + U.ri(6, 14), 0, 100);
        g.obras.push({ t: E.fecha.t, obraId: o.obraId, sector: o.sector, exito: false, grave });
        C.Medios.noticia(E, { tipo: 'escandalo', titular: grave ? `Escándalo por sobrecostos en ${nombreObra.toLowerCase()} de ${nombreLugar}` : `${nombreObra} de ${nombreLugar} se entrega tarde y por debajo de lo prometido`, tono: -1, importante: true, jugador: true });
      }
      if (C.Licitacion) C.Licitacion.alCerrar(E, depto, organo, o, exito);
      g.obraBandera = null;
    },

    /* ── Paro cívico local: un actor propio del departamento/municipio, ligado a la gestión local
       (no a los indicadores nacionales de Movilizacion) — mismo protocolo de tres caminos. */
    senalCivico(E, depto, organo) {
      const d = E.deptos[depto], g = GL.asegurar(E, depto, organo);
      const promPais = U.prom(Object.values(E.deptos).map(x => (x.seguridad + x.educacion + x.salud + x.infraestructura) / 4));
      const propio = (d.seguridad + d.educacion + d.salud + d.infraestructura) / 4;
      const subfin = GL.secretariasDe(g).filter(s => GL.subfinanciada(E, depto, organo, s.id)).length;
      return (promPais - propio) * 0.8 + subfin * 4;
    },
    turnoCivico(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo), civ = g.civico;
      const senal = GL.senalCivico(E, depto, organo);
      civ.descontento = U.clamp(civ.descontento + U.clamp(senal * 0.08, -2, 2.5) - 0.35 + U.gauss(0, 0.4), 0, 100);
      if (civ.paro) { GL.turnoParoCivico(E, depto, organo); return; }
      if (civ.descontento > 70 && U.chance(U.clamp((civ.descontento - 66) / 850, 0, 0.05))) GL.iniciarParoCivico(E, depto, organo);
    },
    iniciarParoCivico(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto];
      g.civico.paro = { t: E.fecha.t, intensidad: 1 };
      const nombreLugar = organo === 'gobernacion' ? d.nombre : d.capital;
      C.Medios.noticia(E, { tipo: 'evento', titular: `Un paro cívico paraliza ${nombreLugar}: exigen mejor gestión de ${organo === 'gobernacion' ? 'la Gobernación' : 'la Alcaldía'}`, tono: -1, importante: true, jugador: true });
    },
    turnoParoCivico(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto], p = g.civico.paro;
      p.intensidad = U.clamp(p.intensidad + 0.08, 1, 4);
      d.seguridad = U.clamp(d.seguridad - U.rf(0.15, 0.4) * p.intensidad, 1, 99);
      C.Opinion.moverImagen(E, { dep: { [depto]: -U.rf(0.2, 0.5) * p.intensidad } });
    },
    resolverDialogoCivico(E, depto, organo) {
      const J = E.jugador, civ = GL.asegurar(E, depto, organo).civico;
      const exito = U.chance(U.clamp(0.3 + J.atributos.negociacion / 200 + (civ.relJ || 0) / 250, 0.1, 0.85));
      if (exito) {
        civ.descontento = U.clamp(civ.descontento - U.ri(30, 45), 0, 100);
        civ.relJ = U.clamp((civ.relJ || 0) + 8, -100, 100); civ.paro = null;
        C.Medios.noticia(E, { tipo: 'regional', titular: 'Se levanta el paro cívico tras una mesa de diálogo', tono: 1, importante: true, jugador: true });
      } else {
        civ.relJ = U.clamp((civ.relJ || 0) - 3, -100, 100);
        C.Medios.noticia(E, { tipo: 'regional', titular: 'La mesa de diálogo fracasa: el paro cívico continúa', tono: -1, jugador: true });
      }
      return { exito };
    },
    atenderPliegoCivico(E, depto, organo) {
      const civ = GL.asegurar(E, depto, organo).civico;
      civ.descontento = 8; civ.relJ = U.clamp((civ.relJ || 0) + 18, -100, 100); civ.paro = null;
      E.jugador.rep.liderazgo = U.clamp(E.jugador.rep.liderazgo + 1, 0, 100);
      C.Medios.noticia(E, { tipo: 'regional', titular: 'Se atienden las peticiones del paro cívico por completo', tono: 1, importante: true, jugador: true });
    },
    reprimirCivico(E, depto, organo) {
      const civ = GL.asegurar(E, depto, organo).civico, J = E.jugador;
      const grave = U.chance(U.clamp(0.15 + (civ.paro ? civ.paro.intensidad * 0.08 : 0), 0.1, 0.5));
      civ.descontento = U.clamp(civ.descontento - U.ri(10, 20), 0, 100);
      civ.relJ = U.clamp((civ.relJ || 0) - (grave ? 25 : 12), -100, 100);
      civ.paro = null;
      if (grave) {
        J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + U.ri(8, 16), 0, 100);
        C.Opinion.moverImagen(E, { dep: { [depto]: -3 } });
        C.Medios.noticia(E, { tipo: 'escandalo', titular: 'Denuncian uso excesivo de la fuerza contra el paro cívico', tono: -1, importante: true, jugador: true });
      } else {
        C.Opinion.moverImagen(E, { dep: { [depto]: -1 } });
        C.Medios.noticia(E, { tipo: 'regional', titular: 'Se dispersa el paro cívico', tono: -1, jugador: true });
      }
      return { grave };
    },

    /* ── Rendición de cuentas: cada ~26 semanas, un balance de la gestión acumulada (indicadores,
       gestión de secretarías, obras entregadas) mueve la imagen local del jugador. */
    turnoRendicion(E, depto, organo) {
      const g = GL.asegurar(E, depto, organo);
      if (E.fecha.t - (g.ultimaRendicion || 0) < 26) return;
      g.ultimaRendicion = E.fecha.t;
      const d = E.deptos[depto];
      const indicador = (d.seguridad + d.educacion + d.salud + d.infraestructura) / 4;
      const gestiones = GL.secretariasDe(g).map(s => { const pol = E.politicos[g.secretarios[s.id]]; return pol ? GL.asegurarSecretario(pol).gestion : 50; });
      const gestionProm = gestiones.length ? U.prom(gestiones) : 50;
      const obrasExitosas = (g.obras || []).filter(o => o.exito).length;
      const efecto = U.clamp(((indicador - 50) * 0.3 + (gestionProm - 50) * 0.3 + obrasExitosas * 3) * 0.15, -4, 4);
      C.Opinion.moverImagen(E, { dep: { [depto]: efecto } });
      const nombreLugar = organo === 'gobernacion' ? d.nombre : d.capital;
      C.Medios.noticia(E, { tipo: 'regional', titular: `Balance de gestión en ${nombreLugar}: ${efecto >= 0 ? 'evaluación positiva' : 'evaluación negativa'} de tu administración`, tono: efecto >= 0 ? 1 : -1, importante: true, jugador: true });
    },

    turno(E) {
      const J = E.jugador;
      if (J.cargo !== 'gobernador' && J.cargo !== 'alcalde') return;
      const depto = J.cargoInfo.depto, organo = J.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia';
      const g = E.deptos[depto] && E.deptos[depto].gobLocal && E.deptos[depto].gobLocal[organo];
      if (!g) return;
      for (const s of GL.secretariasDe(g)) {
        const pol = E.politicos[g.secretarios[s.id]]; if (!pol) continue;
        GL.asegurarSecretario(pol);
        const adecuacion = U.clamp((g.shares[s.id] - g.pesoBase[s.id]) / g.pesoBase[s.id], -0.5, 0.5);
        pol.aprob = U.clamp((pol.aprob || 50) + adecuacion * 0.12 + U.gauss(0, 0.2), 5, 95);
        if (!pol.iniciativa && !pol.crisisActiva && U.chance(0.05)) GL.proponerIniciativaLocal(E, depto, organo, s.id);
        if (pol.iniciativa && pol.iniciativa.estado === 'en_curso') {
          pol.iniciativa.semanas--;
          if (pol.iniciativa.semanas <= 0) GL.resolverIniciativaLocal(E, depto, organo, s.id);
        }
        if (!pol.crisisActiva && U.chance(0.012 * (1 + (70 - pol.gestion) / 70))) GL.crisisSecretario(E, depto, organo, s.id);
      }
      GL.turnoObra(E, depto, organo);
      GL.turnoCivico(E, depto, organo);
      GL.turnoRendicion(E, depto, organo);
    },

    registrarAcciones() {
      const A = C.Acciones;
      const propio = (E, depto, organo) => E.jugador.cargo === ORGANOS[organo].cargo && E.jugador.cargoInfo.depto === depto;
      A.registrar({ id: 'decretoLocal', nombre: 'Firmar decreto', icono: '📝', grupo: 'local', costo: 1,
        disponible: (E, a) => propio(E, a.depto, a.organo) ? true : 'No ejerces ese cargo',
        ejecutar(E, a) { const r = GL.decretar(E, a.depto, a.organo, a.secretaria, a.sentido); return { ok: true, msg: r.ef ? `Decreto firmado: ${U.signo(r.magnitud, 1)} en ${r.ef}` : 'Decreto firmado' }; } });
      A.registrar({ id: 'ajustarSecretariaLocal', nombre: 'Reasignar presupuesto local', icono: '💰', grupo: 'local', costo: 0,
        disponible: (E, a) => propio(E, a.depto, a.organo) ? true : 'No ejerces ese cargo',
        ejecutar(E, a) { GL.setShare(E, a.depto, a.organo, a.secretaria, +a.pct); return { ok: true, msg: 'Presupuesto local ajustado' }; } });
      A.registrar({ id: 'crearSecretaria', nombre: 'Proponer crear una secretaría', icono: '🏛', grupo: 'local', costo: 2,
        disponible(E, a) {
          if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo';
          let nombre = (a.nombre || '').trim(); if (!nombre) return true;
          nombre = nombre.replace(/^secretar[íi]a\s+(de\s+|del\s+)?/i, '').trim();
          const g = E.deptos[a.depto].gobLocal[a.organo];
          if (g && GL.secretariasDe(g).some(s => s.nombre.toLowerCase() === ('secretaría de ' + nombre).toLowerCase())) return 'Ya existe esa secretaría';
          return true;
        },
        ejecutar(E, a) {
          let nombre = (a.nombre || '').trim(); if (!nombre) return { ok: false, msg: 'Dale un nombre a la secretaría' };
          nombre = nombre.replace(/^secretar[íi]a\s+(de\s+|del\s+)?/i, '').trim();
          const sector = C.DATA.sectores[a.sector] ? a.sector : 'politica';
          const r = GL.proponerCreacion(E, a.depto, a.organo, 'Secretaría de ' + nombre, sector);
          return { ok: true, msg: r.aprobado ? `${ORGANOS[a.organo].corp} aprueba la nueva secretaría (${r.voto.si}-${r.voto.no})` : `${ORGANOS[a.organo].corp} la rechaza (${r.voto.si}-${r.voto.no})` };
        } });
      A.registrar({ id: 'designarSecretario', nombre: 'Nombrar secretario', icono: '🧑‍💼', grupo: 'local', costo: 1,
        disponible: (E, a) => propio(E, a.depto, a.organo) ? true : 'No ejerces ese cargo',
        ejecutar(E, a) {
          const s = GL.designarSecretario(E, a.depto, a.organo, a.secretaria, a.partido || null);
          return { ok: true, msg: `${s.nombre} asume la secretaría` };
        } });
      A.registrar({ id: 'lanzarPrograma', nombre: 'Lanzar programa', icono: '📋', grupo: 'local', costo: 2,
        disponible(E, a) { return propio(E, a.depto, a.organo) ? true : 'No ejerces ese cargo'; },
        ejecutar(E, a) {
          if (!GL.programasDe(a.secretaria)[a.idx]) return { ok: false, msg: 'Elige un programa' };
          const r = GL.lanzarPrograma(E, a.depto, a.organo, a.secretaria, +a.idx);
          return { ok: true, msg: `Lanzas «${r.nombre}»${r.campo ? ': ' + U.signo(r.magnitud, 1) + ' en ' + r.campo : ''}` };
        } });
      A.registrar({ id: 'consejoGobLocal', nombre: 'Consejo de gobierno', icono: '🗂', grupo: 'local', costo: 1,
        disponible: (E, a) => propio(E, a.depto, a.organo) ? true : 'No ejerces ese cargo',
        ejecutar(E, a) { GL.consejoLocal(E, a.depto, a.organo); return { ok: true, msg: 'El gabinete se reúne y alinea la agenda local' }; } });

      /* ── Gabinete local 2.0: iniciativas y crisis de secretarías ── */
      A.registrar({ id: 'aceptarIniciativaLocal', nombre: 'Respaldar iniciativa', icono: '✅', grupo: 'local', costo: 1,
        disponible(E, a) { if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo'; const pol = E.politicos[E.deptos[a.depto].gobLocal[a.organo].secretarios[a.secretaria]]; return pol && pol.iniciativa && pol.iniciativa.estado === 'propuesta' ? true : 'No hay una propuesta pendiente'; },
        ejecutar(E, a) { return GL.aceptarIniciativaLocal(E, a.depto, a.organo, a.secretaria); } });
      A.registrar({ id: 'rechazarIniciativaLocal', nombre: 'Rechazar', icono: '✖', grupo: 'local', costo: 0,
        disponible(E, a) { if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo'; const pol = E.politicos[E.deptos[a.depto].gobLocal[a.organo].secretarios[a.secretaria]]; return pol && pol.iniciativa && pol.iniciativa.estado === 'propuesta' ? true : 'No hay una propuesta pendiente'; },
        ejecutar(E, a) { return GL.rechazarIniciativaLocal(E, a.depto, a.organo, a.secretaria); } });
      A.registrar({ id: 'respaldarSecretarioCrisis', nombre: 'Respaldar al secretario', icono: '🛡', grupo: 'local', costo: 1,
        disponible(E, a) { if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo'; const pol = E.politicos[E.deptos[a.depto].gobLocal[a.organo].secretarios[a.secretaria]]; return pol && pol.crisisActiva ? true : 'No hay una crisis activa'; },
        ejecutar(E, a) { return GL.respaldarSecretario(E, a.depto, a.organo, a.secretaria); } });
      A.registrar({ id: 'destituirSecretarioCrisis', nombre: 'Destituir', icono: '🚪', grupo: 'local', costo: 1,
        disponible(E, a) { if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo'; const pol = E.politicos[E.deptos[a.depto].gobLocal[a.organo].secretarios[a.secretaria]]; return pol && pol.crisisActiva ? true : 'No hay una crisis activa'; },
        ejecutar(E, a) { return GL.destituirSecretario(E, a.depto, a.organo, a.secretaria); } });

      /* ── Regalías ── */
      A.registrar({ id: 'pedirRegalias', nombre: 'Pedir regalías al Gobierno Nacional', icono: '💵', grupo: 'local', costo: 1,
        disponible(E, a) {
          if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo';
          const g = E.deptos[a.depto].gobLocal[a.organo];
          if (g && g.regaliasUlt != null && E.fecha.t - g.regaliasUlt < 8) return 'Ya pediste regalías hace poco: espera unas semanas';
          return true;
        },
        ejecutar(E, a) { const r = GL.pedirRegalias(E, a.depto, a.organo); return { ok: true, msg: r.exito ? `Recibes ${U.d1(r.monto)} billones adicionales en regalías` : 'El Gobierno Nacional no gira recursos adicionales', exito: r.exito }; } });

      /* ── Obra bandera ── */
      A.registrar({ id: 'iniciarObraBandera', nombre: 'Iniciar obra bandera', icono: '🏗', grupo: 'local', costo: 2,
        disponible(E, a) {
          if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo';
          const g = E.deptos[a.depto].gobLocal[a.organo];
          return g && g.obraBandera ? 'Ya tienes una obra bandera en curso' : g && g.licitacion ? 'Ya hay una licitación abierta' : true;
        },
        ejecutar(E, a) {
          const g = E.deptos[a.depto].gobLocal[a.organo];
          if (g.obraBandera) return { ok: false, msg: 'Ya tienes una obra bandera en curso' };
          const disponibles = GL.obrasDisponibles(E, a.depto, a.organo);
          const obraId = disponibles.some(o => o.id === a.obra) ? a.obra : disponibles[0].id;
          if (g.licitacion) return { ok: false, msg: 'Ya hay una licitación abierta' };
          if (C.Licitacion) { C.Licitacion.abrir(E, a.depto, a.organo, obraId, a.modalidad); return { ok: true, msg: 'Abres la contratación de la megaobra: mira los proponentes en la pestaña Obras' }; }
          GL.iniciarObraBandera(E, a.depto, a.organo, obraId);
          return { ok: true, msg: 'Inicias la obra bandera: tardará varias semanas en completarse' };
        } });
      A.registrar({ id: 'acelerarObraBandera', nombre: 'Acelerar la obra', icono: '⏱', grupo: 'local', costo: 1,
        disponible(E, a) {
          if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo';
          const g = E.deptos[a.depto].gobLocal[a.organo];
          return g && g.obraBandera && !g.obraBandera.acelerada ? true : 'No hay una obra que acelerar';
        },
        ejecutar(E, a) { GL.acelerarObra(E, a.depto, a.organo); return { ok: true, msg: 'Aprietas el cronograma: llega antes, pero con más riesgo de sobrecostos' }; } });

      /* ── Paro cívico local ── */
      const hayParoCivico = (E, a) => {
        if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo';
        const g = E.deptos[a.depto].gobLocal[a.organo];
        return g && g.civico.paro ? true : 'No hay un paro cívico activo';
      };
      A.registrar({ id: 'dialogarParoCivico', nombre: 'Abrir mesa de diálogo', icono: '🤝', grupo: 'local', costo: 1,
        disponible: hayParoCivico,
        ejecutar(E, a) { const r = GL.resolverDialogoCivico(E, a.depto, a.organo); return { ok: true, msg: r.exito ? 'Llegan a un acuerdo: el paro se levanta' : 'No hay acuerdo: el paro continúa', exito: r.exito }; } });
      A.registrar({ id: 'atenderPliegoCivico', nombre: 'Atender el pliego por completo', icono: '📋', grupo: 'local', costo: 2,
        disponible: hayParoCivico,
        ejecutar(E, a) { GL.atenderPliegoCivico(E, a.depto, a.organo); return { ok: true, msg: 'Cedes al pliego completo: el paro se levanta' }; } });
      A.registrar({ id: 'reprimirParoCivico', nombre: 'Dispersar por la fuerza', icono: '🛡', grupo: 'local', costo: 1,
        disponible: hayParoCivico,
        ejecutar(E, a) { const r = GL.reprimirCivico(E, a.depto, a.organo); return { ok: true, msg: r.grave ? 'Dispersas el paro, pero con un costo alto' : 'Dispersas el paro', grave: r.grave }; } });
    }
  };

  C.GobiernoLocal = GL;
  C.Tiempo.registrar('gobiernolocal', GL, 55);
  GL.registrarAcciones();
  C.Bus.on('jugador:cargo', tipo => {
    const E = C.E; if (!E || (tipo !== 'gobernador' && tipo !== 'alcalde')) return;
    const depto = E.jugador.cargoInfo.depto, organo = tipo === 'gobernador' ? 'gobernacion' : 'alcaldia';
    GL.asegurar(E, depto, organo);
    C.Corporaciones.asegurar(E, depto, organo);
  });
})(window.CURUL);
