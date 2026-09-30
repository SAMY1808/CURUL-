/* Reforma institucional del Mercosur: el bloque no es una casilla fija sino diez ejes que se pueden mover —regla de
   votación, directorio ejecutivo (el equivalente de la Comisión Europea), parlamento, tribunal de solución de
   controversias, unión aduanera, mercado común, libre circulación, moneda, política exterior común y fondos de
   cohesión—. Cada eje tiene niveles; los miembros votan según su propio interés (Brasil y Argentina cuidan su
   soberanía, Uruguay quiere flexibilidad y tribunal, Paraguay quiere fondos), los cambios profundos pasan por el
   Congreso, la Corte y los parlamentos de los socios, y una vez en vigor tienen efectos reales: comercio
   intrabloque, legitimidad, controversias con los socios, aranceles y hasta cómo se toman las decisiones.
   Se pueden armar paquetes: parecerse a la Unión Europea, a la ASEAN («consenso y no injerencia») o volver
   a un tratado casi vacío. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const EJES = {
    votacion: { n: 'Regla de votación', icono: '🗳', niveles: ['Unanimidad: cualquiera veta', 'Mayoría calificada (dos tercios)', 'Mayoría ponderada por población y PIB'], sup: [0, 0.6, 1], txt: 'Cómo se decide en el bloque. Sin unanimidad, un veto solo ya no basta.' },
    directorio: { n: 'Directorio ejecutivo', icono: '🏛', niveles: ['Sólo presidencia pro tempore', 'Secretaría técnica reforzada', 'Comisión de representantes permanentes', 'Directorio con iniciativa propia (tipo Comisión Europea)'], sup: [0, 0.2, 0.6, 1], txt: 'Un órgano propio que propone, ejecuta y vigila, en lugar de depender de la presidencia rotativa.' },
    parlamento: { n: 'Parlamento', icono: '🏟', niveles: ['Sin parlamento', 'Parlasur consultivo', 'Parlamento electo directamente con control político', 'Parlamento colegislador'], sup: [0, 0.15, 0.6, 1], txt: 'Da legitimidad democrática al bloque y controla a su directorio.' },
    tribunal: { n: 'Tribunal de controversias', icono: '⚖', niveles: ['Arbitraje ad hoc', 'Tribunal Permanente de Revisión (opiniones)', 'Tribunal con jurisdicción obligatoria y sanciones', 'Tribunal supranacional con efecto directo'], sup: [0, 0.2, 0.65, 1], txt: 'Resuelve los choques comerciales entre socios y decide si se cumplen los fallos.' },
    aduanera: { n: 'Unión aduanera', icono: '🛃', niveles: ['Zona de libre comercio (sin arancel común)', 'Unión aduanera con excepciones', 'Unión aduanera plena (sin excepciones)'], sup: [0, 0.4, 0.8], txt: 'Con arancel externo común se pierde autonomía arancelaria; sin él cada país vuelve a fijar el suyo.' },
    mercado: { n: 'Mercado común', icono: '🏬', niveles: ['Sólo bienes', 'Bienes y servicios', 'Servicios, capitales y compras públicas'], sup: [0, 0.3, 0.6], txt: 'Más allá de los bienes: servicios, inversión y contratación pública abiertas.' },
    circulacion: { n: 'Circulación de personas', icono: '🛂', niveles: ['Visas y permisos', 'Residencia y reconocimiento de títulos', 'Libre circulación de trabajadores'], sup: [0, 0.2, 0.5], txt: 'Migración y trabajo dentro del bloque.' },
    moneda: { n: 'Moneda y macroeconomía', icono: '💱', niveles: ['Monedas nacionales', 'Coordinación macro y criterios de convergencia', 'Unidad de cuenta y pagos en monedas locales', 'Moneda común'], sup: [0, 0.2, 0.5, 1], txt: 'Cuanto más profunda, menos margen para la política monetaria propia.' },
    exterior: { n: 'Política comercial exterior', icono: '🌐', niveles: ['Cada país negocia por su cuenta', 'Coordinación de posiciones', 'Negociación conjunta con terceros'], sup: [0, 0.3, 0.7], txt: 'Si el bloque negocia como uno solo, los TLC bilaterales chocan con él.' },
    fondos: { n: 'Fondos de cohesión', icono: '💠', niveles: ['Sin fondos comunes', 'FOCEM reforzado', 'Fondo de cohesión y convergencia estructural'], sup: [0, 0.2, 0.4], txt: 'Los grandes financian el desarrollo de las regiones más rezagadas.' }
  };
  const MODELOS = {
    ue: { n: 'Modelo Unión Europea', icono: '🇪🇺', niv: { votacion: 1, directorio: 3, parlamento: 3, tribunal: 3, aduanera: 2, mercado: 2, circulacion: 2, moneda: 3, exterior: 2, fondos: 2 }, txt: 'Integración profunda y supranacional: directorio, parlamento colegislador, tribunal con efecto directo, mercado común, libre circulación y moneda común.' },
    asean: { n: 'Modelo ASEAN («consenso y no injerencia»)', icono: '🌏', niv: { votacion: 0, directorio: 1, parlamento: 0, tribunal: 0, aduanera: 0, mercado: 1, circulacion: 1, moneda: 0, exterior: 0, fondos: 0 }, txt: 'Cooperación flexible: consenso, secretaría liviana, sin tribunal ni parlamento, y cada país libre de firmar sus propios TLC.' },
    vacio: { n: 'Tratado casi vacío', icono: '📄', niv: { votacion: 0, directorio: 0, parlamento: 0, tribunal: 0, aduanera: 0, mercado: 0, circulacion: 0, moneda: 0, exterior: 0, fondos: 0 }, txt: 'Poco más que una declaración: sin instituciones ni arancel común, y con preferencias comerciales que se erosionan.' }
  };
  /* Cuánto le gusta a cada miembro subir cada eje (−1 lo rechaza, +1 lo impulsa) */
  const APRECIO = {
    BRA: { votacion: 0.1, directorio: -0.35, parlamento: -0.15, tribunal: -0.5, aduanera: 0.3, mercado: 0.25, circulacion: 0.2, moneda: 0.1, exterior: 0.3, fondos: -0.25 },
    ARG: { votacion: -0.35, directorio: -0.3, parlamento: -0.1, tribunal: -0.6, aduanera: 0.2, mercado: -0.15, circulacion: 0.2, moneda: -0.25, exterior: 0, fondos: -0.3 },
    URY: { votacion: 0.25, directorio: 0.2, parlamento: 0.3, tribunal: 0.55, aduanera: -0.4, mercado: 0.45, circulacion: 0.4, moneda: 0, exterior: -0.5, fondos: 0.6 },
    PRY: { votacion: 0.3, directorio: 0.2, parlamento: 0.2, tribunal: 0.3, aduanera: 0.1, mercado: 0.1, circulacion: 0.2, moneda: 0, exterior: 0.1, fondos: 0.8 },
    BOL: { votacion: 0.1, directorio: 0.1, parlamento: 0.2, tribunal: -0.3, aduanera: 0, mercado: 0, circulacion: 0.3, moneda: 0, exterior: 0.1, fondos: 0.4 },
    VEN: { votacion: -0.2, directorio: -0.3, parlamento: 0, tribunal: -0.5, aduanera: 0, mercado: 0, circulacion: 0, moneda: 0, exterior: 0.2, fondos: 0.2 }
  };
  const PESO_VOTO = { BRA: 0.55, ARG: 0.2, URY: 0.08, PRY: 0.08, BOL: 0.05, VEN: 0.04 };
  const PROFUNDOS = { votacion: 1, directorio: 2, parlamento: 2, tribunal: 2, mercado: 2, circulacion: 2, moneda: 2 };

  const Ins = {
    EJES, MODELOS,
    st(E) {
      const m = E.comercio.mercosur; if (m.inst) return m.inst;
      const y = U.anio();
      m.inst = { niv: { votacion: 0, directorio: 0, parlamento: y >= 2006 ? 1 : 0, tribunal: y >= 2004 ? 1 : y >= 1991 ? 0 : 0, aduanera: y >= 1995 ? 1 : 0, mercado: 0, circulacion: y >= 2002 ? 1 : 0, moneda: 0, exterior: y >= 1995 ? 1 : 0, fondos: y >= 2004 ? 1 : 0 },
        aecActivo: y >= 1995, prop: null, hist: [], legit: 45, comisionado: null, parlSeats: null, ultExterior: 0, disputas: [] };
      return m.inst;
    },
    nivel(E, eje) { return Ins.st(E).niv[eje]; },
    supranacionalidad(E) { const i = Ins.st(E); return U.suma(Object.entries(EJES).map(([k, e]) => e.sup[i.niv[k]])) / Object.keys(EJES).length * (Object.keys(EJES).length / 6); },
    indice(E) { const i = Ins.st(E); return Math.round(U.suma(Object.entries(EJES).map(([k, e]) => i.niv[k] / (e.niveles.length - 1))) / Object.keys(EJES).length * 100); },
    /* Parecido (0-100) con cada modelo de referencia */
    parecido(E) {
      const i = Ins.st(E), out = {};
      for (const [k, mo] of Object.entries(MODELOS)) out[k] = Math.round(100 - U.suma(Object.entries(EJES).map(([e, d]) => Math.abs(i.niv[e] - mo.niv[e]) / (d.niveles.length - 1))) / Object.keys(EJES).length * 100);
      return out;
    },
    modelo(E) {
      const p = Ins.parecido(E), idx = Ins.indice(E), i = Ins.st(E);
      if (idx <= 12) return 'Tratado casi vacío';
      if (p.ue >= 70) return 'Casi una Unión Europea';
      if (p.asean >= 80 && idx < 35) return 'Tipo ASEAN';
      if (i.niv.mercado >= 2 && i.niv.aduanera >= 1) return 'Mercado común';
      if (i.niv.aduanera >= 1) return 'Unión aduanera';
      return 'Zona de libre comercio';
    },
    /* Multiplicador del comercio con los socios del bloque (lo lee Comercio.mult) */
    bonoComercio(E) {
      const i = Ins.st(E), n = i.niv;
      const b = 1 + n.mercado * 0.04 + (n.aduanera - 1) * 0.03 + n.circulacion * 0.015 + n.moneda * 0.03 + n.fondos * 0.008 + n.tribunal * 0.01 + (i.legit - 45) / 1000;
      return U.clamp(b, 0.92, 1.28);
    },
    regla(E) { return Ins.st(E).niv.votacion; },
    /* ¿Con estos votos pasa según la regla de votación actual? */
    pasa(E, votos) {
      const r = Ins.regla(E);
      if (r === 0) return votos.every(v => v.si);
      if (r === 1) return votos.filter(v => v.si).length >= Math.ceil(votos.length * 2 / 3);
      return U.suma(votos.filter(v => v.si).map(v => PESO_VOTO[v.id] || 0.05)) >= 0.66 * U.suma(votos.map(v => PESO_VOTO[v.id] || 0.05));
    },
    etiquetaNivel: (eje, n) => EJES[eje].niveles[n],
    resumenCambios(cambios) { return cambios.map(c => `${EJES[c.eje].n}: ${EJES[c.eje].niveles[c.nivel]}`).join(' · '); },
    puede(E) { return E.gobierno.presidente === 'J' ? (C.Mercosur.esMiembro(E) ? true : 'Sólo los miembros plenos proponen reformas al bloque') : 'Sólo el Presidente representa a Colombia en el bloque'; },

    proponer(E, cambios, etiqueta) {
      const i = Ins.st(E); const cs = cambios.filter(c => EJES[c.eje] && c.nivel >= 0 && c.nivel < EJES[c.eje].niveles.length && i.niv[c.eje] !== c.nivel);
      if (!cs.length) return { ok: false, msg: 'No hay cambios respecto de lo vigente' };
      if (i.prop) return { ok: false, msg: 'Ya hay una reforma en trámite' };
      if (cs.some(c => c.eje === 'aduanera' && c.nivel === 2) && C.Mercosur.st(E).conflictos && Object.values(C.Mercosur.st(E).conflictos).some(x => x.estado === 'excepcion')) { /* permitido: los choques se reabren */ }
      i.prop = { t: E.fecha.t, cambios: cs, etiqueta: etiqueta || Ins.resumenCambios(cs).slice(0, 90), fase: 'negociacion', rondas: 0, votos: null, ratif: null, proyecto: null, controlHasta: null };
      const sup = U.suma(cs.map(c => EJES[c.eje].sup[c.nivel] - EJES[c.eje].sup[i.niv[c.eje]]));
      if (sup > 0.5) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - Math.min(2, sup), 3, 95);
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia propone reformar el Mercosur: ${i.prop.etiqueta}`, tono: 0, importante: true, jugador: true });
      return { ok: true, msg: 'Se presenta la propuesta a los socios: negocia hasta lograr la mayoría que exige la regla de votación' };
    },
    probVoto(E, id) {
      const i = Ins.st(E), pr = i.prop, pos = C.DATA.mercosur.postura[id] || { dureza: 0.4 }, ap = APRECIO[id] || {};
      const score = U.suma(pr.cambios.map(c => (ap[c.eje] || 0) * (c.nivel - i.niv[c.eje]) / Math.max(1, EJES[c.eje].niveles.length - 1))) / Math.max(1, Math.sqrt(pr.cambios.length));
      const rel = C.Comercio.relacion(E, id), neg = E.jugador.atributos.negociacion;
      return U.clamp(0.42 + score * 0.65 + rel / 260 + neg / 600 - pos.dureza * 0.08 - (pr.cambios.length > 3 ? 0.05 : 0), 0.05, 0.95);
    },
    ronda(E) {
      const i = Ins.st(E), pr = i.prop; pr.rondas++;
      const votos = C.Mercosur.votantes(E).map(id => { const p = Ins.probVoto(E, id); return { id, prob: p, si: U.chance(p) }; });
      pr.votos = { t: E.fecha.t, votos };
      if (Ins.pasa(E, votos)) {
        pr.fase = 'aprobada'; C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El Mercosur aprueba la reforma: ${pr.etiqueta}${Ins.regla(E) ? ' (por mayoría)' : ' (por consenso)'}`, tono: 1, importante: true, jugador: true });
        Ins.tramitar(E);
      } else {
        for (const v of votos.filter(x => !x.si)) C.Comercio.moverRelacion(E, v.id, -1);
        if (pr.rondas >= 6) Ins.fracasar(E, 'los socios no logran acuerdo tras seis rondas');
      }
      return pr.votos;
    },
    fracasar(E, motivo) { const i = Ins.st(E); C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Se cae la reforma del Mercosur (${i.prop ? i.prop.etiqueta : ''}): ${motivo}`, tono: -1, importante: true, jugador: true }); i.hist.unshift({ t: E.fecha.t, txt: `Fracasa: ${i.prop ? i.prop.etiqueta : ''}`, ok: false }); if (i.hist.length > 20) i.hist.pop(); i.prop = null; },
    /* Tras la aprobación por el bloque: Congreso (si es profunda), Corte y parlamentos de los socios */
    tramitar(E) {
      const i = Ins.st(E), pr = i.prop;
      const profunda = pr.cambios.some(c => c.nivel > i.niv[c.eje] && (PROFUNDOS[c.eje] != null && c.nivel >= PROFUNDOS[c.eje] || (c.eje === 'aduanera' && c.nivel === 2)));
      if (profunda && C.Legislacion) {
        const g = E.gobierno.gabinete, sup = U.suma(pr.cambios.map(c => EJES[c.eje].sup[c.nivel] - EJES[c.eje].sup[i.niv[c.eje]]));
        const bill = C.Legislacion.crear(E, { plantilla: 'ratificaciontratado', autor: g.exteriores || g.comercio || g.interior || null, gobierno: true, origen: 'senado', titulo: `Protocolo de reforma institucional del Mercosur: ${pr.etiqueta}`, eco: U.clamp(-8 - sup * 25, -50, 10), soc: 0, costo: 0.15 });
        bill.ratifica = { tipo: 'mercosurReforma' }; pr.proyecto = bill.id; pr.fase = 'congreso';
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'El Gobierno radica en el Senado el protocolo de reforma del Mercosur', tono: 0, importante: true, jugador: true });
      } else Ins.ratificaciones(E);
    },
    aprobadoPorCongreso(E) { const pr = Ins.st(E).prop; if (!pr) return; pr.fase = 'corte'; pr.controlHasta = E.fecha.t + U.ri(8, 14); C.Medios.noticia(E, { tipo: 'legislativo', titular: 'El Congreso aprueba la reforma del Mercosur: pasa a control de la Corte Constitucional', tono: 1, importante: true, jugador: true }); },
    hundidoEnCongreso(E) { if (Ins.st(E).prop) Ins.fracasar(E, 'el Congreso colombiano la hunde'); },
    ratificaciones(E) {
      const pr = Ins.st(E).prop, r = {};
      for (const id of C.Mercosur.votantes(E)) r[id] = { hasta: E.fecha.t + U.ri(10, 40) + (C.Comercio.relacion(E, id) < 50 ? 16 : 0), listo: false };
      pr.fase = 'ratificacion'; pr.ratif = r;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'La reforma del Mercosur queda en manos de los parlamentos de los socios', tono: 0, jugador: true });
    },
    aplicar(E) {
      const i = Ins.st(E), pr = i.prop, m = C.Mercosur.st(E);
      for (const c of pr.cambios) Ins.aplicarCambio(E, c.eje, c.nivel);
      i.hist.unshift({ t: E.fecha.t, txt: `En vigor: ${pr.etiqueta}`, ok: true }); if (i.hist.length > 20) i.hist.pop();
      m.historial.push({ t: E.fecha.t, txt: 'Reforma institucional: ' + pr.etiqueta });
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Entra en vigor la reforma del Mercosur: ${pr.etiqueta}. Ahora es un bloque ${Ins.modelo(E).toLowerCase()}`, tono: 1, importante: true, jugador: true });
      i.prop = null;
    },
    aplicarCambio(E, eje, nivel) {
      const i = Ins.st(E), m = C.Mercosur.st(E), c = E.comercio, Co = C.Comercio, ant = i.niv[eje];
      i.niv[eje] = nivel;
      if (eje === 'aduanera') {
        if (nivel === 0) { i.aecActivo = false; m.excepciones = []; m.convergencia = null; if (C.Mercosur.esMiembro(E)) for (const s of Co.sectores()) if (!s.sinArancel) c.aranceles[s.id] = s.mfn; }
        else {
          const veniaCero = !i.aecActivo; i.aecActivo = true;
          if (nivel === 2) { m.excepcionesMax = 0; m.excepciones = []; }
          else if (ant === 2) m.excepcionesMax = Math.max(m.excepcionesMax, 2);
          if (veniaCero && C.Mercosur.esMiembro(E)) { const inicio = {}; for (const s of Co.sectores()) inicio[s.id] = c.aranceles[s.id]; m.convergencia = { desde: E.fecha.t, anios: 4, inicio }; }
          else C.Mercosur.reiniciarConvergencia(E);
        }
      }
      if (eje === 'exterior' && nivel === 0) m.flexibilizado = true; else if (eje === 'exterior' && nivel > 0 && ant === 0) m.flexibilizado = false;
      if (eje === 'directorio' && nivel === 0) i.comisionado = null;
      if (eje === 'parlamento' && nivel >= 2 && !i.parlSeats) Ins.elegirParlamento(E);
    },
    elegirParlamento(E) {
      const i = Ins.st(E), ps = Object.values(E.partidos).filter(p => !p.especial && !p.futuro).sort((a, b) => b.popularidad - a.popularidad).slice(0, 6), tot = U.suma(ps.map(p => p.popularidad)) || 1;
      i.parlSeats = ps.map(p => ({ pid: p.id, sigla: p.sigla, esc: Math.max(1, Math.round(p.popularidad / tot * 18)) })); i.parlT = E.fecha.t;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'Colombia elige a sus representantes al Parlamento del Mercosur', tono: 0, importante: false, jugador: true });
    },

    turno(E) {
      const m = E.comercio && E.comercio.mercosur; if (!m || !m.existe) return;
      const i = Ins.st(E), miembro = C.Mercosur.esMiembro(E), Ec = C.Economia, n = i.niv;
      // legitimidad: el parlamento la sube; un directorio sin parlamento la erosiona
      const objetivo = U.clamp(35 + n.parlamento * 13 + n.tribunal * 4 - Math.max(0, n.directorio - n.parlamento) * 10 - Math.max(0, n.moneda - 1) * 4, 5, 95);
      i.legit += (objetivo - i.legit) * 0.02;
      if (miembro && !E.meta.presim) {
        const sup = Ins.supranacionalidad(E);
        if (sup > 0.35) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.002 * (sup - 0.35) * (1.4 - i.legit / 100) * 10, 3, 95);
        if (n.fondos) { Ec.aplicarDelta(E, 'deficit', 0.0004 * n.fondos); for (const d of Object.values(E.deptos)) if (d.pobreza > 45) d.infraestructura = U.clamp(d.infraestructura + 0.002 * n.fondos, 1, 99); }
        if (n.moneda >= 3) Ec.aplicarDelta(E, 'inflacion', (4 - E.economia.inflacion) * 0.004);
        if (n.circulacion >= 2) Ec.aplicarDelta(E, 'crecimiento', 0.0003);
        if (n.mercado >= 2) Ec.aplicarDelta(E, 'inversion', 0.0004);
        // controversias comerciales con los socios
        if (U.chance(0.005 * (n.tribunal >= 2 ? 0.7 : 1))) {
          const socios = C.Mercosur.votantes(E).filter(id => ['BRA', 'ARG', 'URY', 'PRY'].includes(id)), s = U.pick(socios), tema = U.pick(['licencias no automáticas', 'un nuevo impuesto a las importaciones', 'controles sanitarios en la frontera', 'cupos a productos colombianos']);
          if (E.gobierno.presidente === 'J') C.Eventos.disparar(E, C.Eventos.plantilla('controversiaMercosur'), { vars: { socio: C.Mercosur.nombreMiembro(s), tema }, socio: s, tema });
          else E.comercio.retorsion[s] = { pp: 3, hasta: E.fecha.t + 26 };
        }
        // política exterior conjunta: el bloque cierra acuerdos con terceros
        if (n.exterior >= 2 && E.fecha.t - i.ultExterior > 104 && U.chance(0.01)) {
          const cand = C.DATA.sociosComercio.filter(so => !so.mercosur && so.id !== 'USA' && !E.comercio.acuerdos[so.id]);
          if (cand.length) { const so = U.pick(cand); C.Comercio.crearAcuerdo(E, so.id, { tipo: 'tlc', nombre: `TLC Mercosur–${so.nombre}`, anios: 10, red: { _: 0.5 }, acc: { _: 0.5 } }); i.ultExterior = E.fecha.t; C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El Mercosur cierra como bloque un acuerdo de libre comercio con ${so.nombre}`, tono: 1, importante: true, jugador: true }); }
        }
        if (n.parlamento >= 2 && (!i.parlT || E.fecha.t - i.parlT > 208)) Ins.elegirParlamento(E);
      }
      // trámite de una reforma
      const pr = i.prop; if (!pr) return;
      if (pr.fase === 'corte' && E.fecha.t >= pr.controlHasta) {
        const sup = U.suma(pr.cambios.map(c => EJES[c.eje].sup[c.nivel]));
        const tumba = U.chance(U.clamp(0.04 + sup * 0.05, 0, 0.3) * (C.Corte ? C.Corte.factorEco(E, -sup * 20) : 1));
        if (C.Corte) C.Corte.registrarFallo(E, { tipo: 'tratado', titulo: 'Reforma institucional del Mercosur', resultado: tumba ? 'inexequible' : 'exequible', gobierno: true });
        if (tumba) Ins.fracasar(E, 'la Corte Constitucional la declara inexequible por afectar la soberanía'); else Ins.ratificaciones(E);
      } else if (pr.fase === 'ratificacion') {
        for (const [id, r] of Object.entries(pr.ratif)) if (!r.listo && E.fecha.t >= r.hasta) { r.listo = true; C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El parlamento de ${C.Mercosur.nombreMiembro(id)} ratifica la reforma del Mercosur`, tono: 1, jugador: true }); }
        if (Object.values(pr.ratif).every(r => r.listo)) Ins.aplicar(E);
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'proponerReformaMercosur', nombre: 'Proponer una reforma del Mercosur', icono: '🏛', grupo: 'comercio', costo: 3, disponible: Ins.puede,
        ejecutar(E, a) { const [eje, n] = String(a.cambio || '').split('|'); if (!EJES[eje]) return { ok: false, msg: 'Elige un cambio' }; return Ins.proponer(E, [{ eje, nivel: +n }]); } });
      A.registrar({ id: 'proponerModeloMercosur', nombre: 'Proponer un modelo de bloque', icono: '🧩', grupo: 'comercio', costo: 4, disponible: Ins.puede,
        ejecutar(E, a) { const mo = MODELOS[a.modelo]; if (!mo) return { ok: false, msg: 'Elige el modelo' }; return Ins.proponer(E, Object.entries(mo.niv).map(([eje, nivel]) => ({ eje, nivel })), mo.n); } });
      A.registrar({ id: 'rondaReformaMercosur', nombre: 'Someter la reforma a votación', icono: '🗳', grupo: 'comercio', costo: 2,
        disponible(E) { const ok = Ins.puede(E); if (ok !== true) return ok; const p = Ins.st(E).prop; return p && p.fase === 'negociacion' ? true : 'No hay una reforma en negociación'; },
        ejecutar(E) { const v = Ins.ronda(E), no = v.votos.filter(x => !x.si).map(x => C.Mercosur.nombreMiembro(x.id)); return { ok: true, exito: Ins.st(E).prop == null || Ins.st(E).prop.fase !== 'negociacion', msg: no.length ? `Se oponen: ${no.join(', ')}` : 'Todos los socios respaldan la reforma' }; } });
      A.registrar({ id: 'retirarReformaMercosur', nombre: 'Retirar la reforma', icono: '🚪', grupo: 'comercio', costo: 0,
        disponible(E) { const ok = Ins.puede(E); if (ok !== true) return ok; return Ins.st(E).prop ? true : 'No hay una reforma en trámite'; },
        ejecutar(E) { Ins.fracasar(E, 'Colombia la retira'); return { ok: true, msg: 'Retiras la propuesta' }; } });
      A.registrar({ id: 'nombrarComisionado', nombre: 'Nombrar comisionado en el Directorio', icono: '🎩', grupo: 'comercio', costo: 2,
        disponible(E) { const ok = Ins.puede(E); if (ok !== true) return ok; return Ins.st(E).niv.directorio >= 2 ? true : 'El bloque no tiene un directorio con sillas para los socios'; },
        ejecutar(E, a) {
          const p = E.politicos[a.pol]; if (!p || !p.activo || p.cargo && p.cargo.tipo !== 'aspirante') return { ok: false, msg: 'Elige a alguien disponible' };
          const i = Ins.st(E); const prev = i.comisionado && E.politicos[i.comisionado]; if (prev) prev.embajadorEn = null;
          i.comisionado = p.id; p.embajadorEn = 'MERCOSUR'; p.relJ = U.clamp((p.relJ || 0) + 6, -100, 100);
          return { ok: true, msg: `${p.nombre} es el comisionado de Colombia: da influencia en las decisiones del bloque` };
        } });
    }
  };
  C.MercosurInst = Ins;
  C.Tiempo.registrar('mercosurinst', Ins, 68);
  Ins.registrarAcciones();
  C.Bus.on('ley', p => { const E = C.E; if (E && E.comercio && E.comercio.mercosur && p.ratifica && p.ratifica.tipo === 'mercosurReforma') Ins.aprobadoPorCongreso(E); });
  C.Bus.on('proyecto:archivado', p => { const E = C.E; if (E && E.comercio && E.comercio.mercosur && p.ratifica && p.ratifica.tipo === 'mercosurReforma') Ins.hundidoEnCongreso(E); });
})(window.CURUL);
