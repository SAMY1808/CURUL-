/* Negociación de tratados de libre comercio, capítulo por capítulo.

   Un TLC no es un botón: se abre con un socio (si la relación lo permite), se negocia en seis
   capítulos con la postura que elijas (defensiva, moderada o ambiciosa) frente a lo que espera el
   socio, y cada concesión tiene su costo en la calle (el agro, la CUT, los gremios, el movimiento
   indígena). Cuando se cierra el último capítulo, el Presidente firma y el tratado pasa por el
   Senado como cualquier ley —la izquierda tiende a oponerse y la derecha a apoyar, según cuánto
   abriste— y luego por control de la Corte Constitucional, que puede tumbarlo si se descuidó la
   consulta previa o se cedió demasiado en arbitraje y propiedad intelectual. Al entrar en vigor,
   las tarifas bajan de forma gradual según el cronograma que salió de la negociación. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const NIVEL = { bienes: [0.5, 0.8, 1.0], agro: [0.3, 0.6, 0.95], servicios: [0.3, 0.6, 0.9] };
  /* Costo político inmediato de cerrar un capítulo con cierta postura: [actor, descontento, relación]. */
  const COSTO = {
    bienes:   [[['gremios', -4, 2], ['cut', -2, 1]], [['gremios', 3, 0], ['cut', 3, -1]], [['gremios', 9, -3], ['cut', 8, -3]]],
    agro:     [[['agrario', -5, 3]], [['agrario', 8, -3]], [['agrario', 20, -9]]],
    servicios: [[], [], [['cut', 3, -1]]],
    pi:       [[], [], []],
    laboral:  [[['cut', 6, -4], ['indigena', 3, -1]], [], [['cut', -6, 4], ['indigena', -4, 2]]],
    solucion: [[['indigena', -3, 2]], [['indigena', 3, -1]], [['indigena', 10, -5], ['cut', 4, -2]]]
  };

  const Tlc = {
    capitulos: () => C.DATA.capitulosTLC,
    posturas: () => C.DATA.posturasTLC,
    cap: id => C.DATA.capitulosTLC.find(c => c.id === id),
    neg(E, socio) { return E.comercio.negociaciones[socio] || null; },
    nombreAcuerdo: socio => `TLC Colombia–${C.Comercio.socio(socio).nombre}`,
    activa: n => n && (n.estado === 'abierta' || n.estado === 'cerrada' || n.estado === 'ratificacion' || n.estado === 'control'),

    puedeAbrir(E, socioId) {
      const Co = C.Comercio, p = Co.socio(socioId); if (!p) return 'Elige un socio';
      const c = E.comercio, M = C.Mercosur;
      if (p.mercosur) return 'Con los miembros del Mercosur no se negocia un TLC aparte: es el proceso de adhesión al bloque';
      const a = Co.acuerdoDe(E, socioId);
      if (a && a.estado === 'vigente' && (a.tipo === 'tlc' || a.tipo === 'can')) return 'Ya existe un acuerdo comercial vigente con este socio';
      const n = Tlc.neg(E, socioId);
      if (Tlc.activa(n)) return 'Ya hay una negociación en curso con este socio';
      if (n && n.enfriaHasta && E.fecha.t < n.enfriaHasta) return `La mesa está fría: podrás volver a sentarte en ${n.enfriaHasta - E.fecha.t} semanas`;
      if (Co.relacion(E, socioId) < 48) return 'La relación bilateral es demasiado baja para abrir una negociación';
      if (M && M.esMiembro(E) && M.bloqueaTLC(E, socioId)) return 'Como miembro del Mercosur, un TLC con terceros necesita el consenso del bloque, que hoy no lo autoriza';
      return true;
    },
    abrir(E, socioId) {
      const Co = C.Comercio, p = Co.socio(socioId);
      const capitulos = {};
      for (const cp of Tlc.capitulos()) capitulos[cp.id] = { estado: 'abierto', postura: null, intentos: 0 };
      E.comercio.negociaciones[socioId] = { socio: socioId, estado: 'abierta', t0: E.fecha.t, ultima: E.fecha.t, rondas: 0, capitulos, consulta: false, proyecto: null, controlHasta: null, intentosCongreso: 0 };
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia y ${p.nombre} abren negociaciones para un tratado de libre comercio`, tono: 1, importante: true, jugador: true });
    },
    /* Probabilidad de cerrar un capítulo con esa postura. */
    probCapitulo(E, socioId, capId, postura) {
      const dem = C.DATA.demandasTLC[socioId] || C.DATA.demandasTLC.ROW;
      const rel = C.Comercio.relacion(E, socioId), neg = E.jugador.atributos.negociacion;
      const gap = postura - dem[capId];
      const p = 0.32 + rel / 300 + neg / 400 + (gap >= 0 ? 0.22 + 0.05 * gap : 0.13 * gap) - dem.dureza * 0.2;
      return U.clamp(p, 0.08, 0.92);
    },
    ronda(E, socioId, capId, postura) {
      const Co = C.Comercio, n = Tlc.neg(E, socioId), cp = n.capitulos[capId], p = Co.socio(socioId);
      n.rondas++; n.ultima = E.fecha.t;
      const prob = Tlc.probCapitulo(E, socioId, capId, postura);
      if (!U.chance(prob)) {
        cp.intentos++;
        Co.moverRelacion(E, socioId, -1);
        return { cierra: false, prob };
      }
      cp.estado = 'cerrado'; cp.postura = postura;
      for (const [actor, desc, rel] of COSTO[capId][postura]) { Co.tocarActor(E, actor, desc); Co.relActor(E, actor, rel); }
      if (capId === 'pi' && postura === 2) E.opinion.aprobTemas.salud = U.clamp(E.opinion.aprobTemas.salud - 1.5, 3, 95);
      if (capId === 'pi' && postura === 0) E.opinion.aprobTemas.salud = U.clamp(E.opinion.aprobTemas.salud + 0.5, 3, 95);
      if (Object.values(n.capitulos).every(x => x.estado === 'cerrado')) {
        n.estado = 'cerrada';
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia y ${p.nombre} cierran la negociación del TLC: falta la firma y el trámite en el Congreso`, tono: 1, importante: true, jugador: true });
      }
      return { cierra: true, prob };
    },
    /* Tarifas y efectos que saldrían de la negociación cerrada (o de la que ya está en curso). */
    perfil(E, socioId, neg) {
      const dem = C.DATA.demandasTLC[socioId] || C.DATA.demandasTLC.ROW, st = id => (neg.capitulos[id].postura == null ? 1 : neg.capitulos[id].postura);
      const b = st('bienes'), ag = st('agro'), sv = st('servicios');
      const red = { industria: NIVEL.bienes[b], textil: NIVEL.bienes[b] * 0.9, agrosens: NIVEL.agro[ag], agroexp: NIVEL.agro[ag], energia: 1, cafe: 1, servicios: NIVEL.servicios[sv] };
      const acc = {
        industria: dem.acc * (0.4 + 0.6 * b / 2), textil: dem.acc * (0.4 + 0.6 * b / 2),
        agroexp: dem.acc * (0.5 + 0.5 * ag / 2), cafe: dem.acc * (0.6 + 0.4 * ag / 2), agrosens: dem.acc * (0.3 + 0.7 * ag / 2) * 0.6,
        energia: 1, servicios: dem.acc * (0.3 + 0.7 * sv / 2)
      };
      return { red, acc, anios: 8 + b * 2 + ag * 2 };
    },
    /* Posición ideológica del texto para el Congreso: más apertura, más a la derecha. */
    ecoDelTexto(neg) {
      const st = id => (neg.capitulos[id].postura == null ? 1 : neg.capitulos[id].postura);
      const apertura = (st('bienes') + st('agro') + st('servicios') + st('solucion') + st('pi')) / 5 - 1;
      return Math.round(U.clamp(30 + apertura * 30 - (st('laboral') - 1) * 10, -55, 75));
    },
    firmar(E, socioId) {
      const Co = C.Comercio, n = Tlc.neg(E, socioId), p = Co.socio(socioId);
      const g = E.gobierno.gabinete, autorId = g.comercio || g.exteriores || g.interior;
      const bill = C.Legislacion.crear(E, { plantilla: 'ratificaciontratado', autor: autorId || null, gobierno: true, origen: 'senado',
        titulo: `Aprobación del ${Tlc.nombreAcuerdo(socioId)}`, eco: Tlc.ecoDelTexto(n), soc: 0, costo: 0.1 });
      bill.ratifica = { tipo: 'tlc', socio: socioId };
      n.estado = 'ratificacion'; n.proyecto = bill.id; n.ultima = E.fecha.t;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El Gobierno firma el TLC con ${p.nombre} y lo radica en el Senado`, tono: 1, importante: true, jugador: true });
      return bill;
    },
    consultaPrevia(E, socioId) {
      const n = Tlc.neg(E, socioId); n.consulta = true;
      C.Comercio.tocarActor(E, 'indigena', -9); C.Comercio.relActor(E, 'indigena', 6);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno adelanta la consulta previa con los pueblos étnicos sobre el TLC con ${C.Comercio.socio(socioId).nombre}`, tono: 1, jugador: true });
    },
    abandonar(E, socioId) {
      const n = Tlc.neg(E, socioId), p = C.Comercio.socio(socioId);
      n.estado = 'fracasada'; n.enfriaHasta = E.fecha.t + 26;
      C.Comercio.moverRelacion(E, socioId, -2);
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia se levanta de la mesa del TLC con ${p.nombre}`, tono: -1, jugador: true });
    },
    /* El Senado aprobó el tratado: pasa a control de la Corte Constitucional. */
    aprobadoPorCongreso(E, socioId) {
      const n = Tlc.neg(E, socioId); if (!n) return;
      n.estado = 'control'; n.controlHasta = E.fecha.t + U.ri(10, 18);
      C.Medios.noticia(E, { tipo: 'legislativo', titular: `El Congreso aprueba el TLC con ${C.Comercio.socio(socioId).nombre}: pasa a control de la Corte Constitucional`, tono: 1, importante: true, jugador: true });
    },
    hundidoEnCongreso(E, socioId) {
      const n = Tlc.neg(E, socioId); if (!n) return;
      n.estado = 'cerrada'; n.proyecto = null; n.intentosCongreso++;
      C.Medios.noticia(E, { tipo: 'legislativo', titular: `Se hunde en el Congreso el TLC con ${C.Comercio.socio(socioId).nombre}: el Gobierno puede volver a presentarlo`, tono: -1, importante: true, jugador: true });
    },
    riesgoCorte(neg) {
      const st = id => (neg.capitulos[id].postura == null ? 1 : neg.capitulos[id].postura);
      return U.clamp(0.04 + (st('solucion') === 2 ? 0.06 : 0) + (st('pi') === 2 ? 0.04 : 0) + (st('laboral') === 0 ? 0.03 : 0) + (neg.consulta ? -0.03 : 0.08), 0.01, 0.35);
    },
    resolverControl(E, socioId) {
      const Co = C.Comercio, n = Tlc.neg(E, socioId), p = Co.socio(socioId);
      if (U.chance(Tlc.riesgoCorte(n))) {
        n.estado = 'fracasada'; n.enfriaHasta = E.fecha.t + 40;
        E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia - 2, 0, 100);
        C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte Constitucional declara inexequible el TLC con ${p.nombre}`, tono: -1, importante: true, jugador: true });
        return false;
      }
      Tlc.entrarEnVigor(E, socioId);
      return true;
    },
    entrarEnVigor(E, socioId) {
      const Co = C.Comercio, n = Tlc.neg(E, socioId), p = Co.socio(socioId);
      const st = id => (n.capitulos[id].postura == null ? 1 : n.capitulos[id].postura);
      const perfil = Tlc.perfil(E, socioId, n);
      Co.crearAcuerdo(E, socioId, { tipo: 'tlc', nombre: Tlc.nombreAcuerdo(socioId), anios: perfil.anios, red: perfil.red, acc: perfil.acc, arbitraje: st('solucion'), pi: st('pi'), laboral: st('laboral') });
      n.estado = 'vigente';
      C.Economia.programar(E, [
        { v: 'inversion', d: st('servicios') * 0.15 + st('solucion') * 0.25 + st('pi') * 0.1, p: 'm' },
        { v: 'confianza', d: 0.3 + st('solucion') * 0.2, p: 'i' },
        { v: 'deficit', d: st('pi') * 0.06, p: 'm' }
      ], 'tlc:' + socioId);
      Co.moverRelacion(E, socioId, 6);
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 1, 3, 95);
      E.comercio.medidas.push({ t: E.fecha.t, txt: `Entra en vigor el ${Tlc.nombreAcuerdo(socioId)}` });
      C.Medios.noticia(E, { tipo: 'economia', titular: `Entra en vigor el TLC entre Colombia y ${p.nombre}: los aranceles bajan de forma gradual`, tono: 1, importante: true, jugador: true });
    },
    /* Sale de un acuerdo vigente (denuncia unilateral o incompatibilidad con el Mercosur). */
    denunciar(E, socioId, motivo) {
      const Co = C.Comercio, a = Co.acuerdoDe(E, socioId), p = Co.socio(socioId);
      if (!a || a.estado !== 'vigente') return false;
      a.estado = 'denunciado'; a.hastaT = E.fecha.t;
      Co.moverRelacion(E, socioId, -12);
      Co.tocarActor(E, 'gremios', 8); Co.relActor(E, 'gremios', -6);
      Co.tocarActor(E, 'agrario', -4);
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1.5, 3, 95);
      E.comercio.medidas.push({ t: E.fecha.t, txt: `Se denuncia ${a.nombre}${motivo ? ' (' + motivo + ')' : ''}` });
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia denuncia su acuerdo comercial con ${p.nombre}${motivo ? ': ' + motivo : ''}`, tono: -1, importante: true, jugador: true });
      return true;
    },

    turno(E) {
      const c = E.comercio; if (!c) return;
      for (const n of Object.values(c.negociaciones)) {
        if (n.estado === 'abierta' && E.fecha.t - n.ultima > 52) {
          n.estado = 'fracasada'; n.enfriaHasta = E.fecha.t + 26;
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Se enfría la negociación del TLC con ${C.Comercio.socio(n.socio).nombre} por falta de avances`, tono: -1 });
        }
        if (n.estado === 'control' && E.fecha.t >= n.controlHasta) Tlc.resolverControl(E, n.socio);
      }
      // Arbitraje inversionista-Estado: los TLC con cláusulas amplias exponen a demandas
      for (const a of Object.values(c.acuerdos)) {
        if (a.estado !== 'vigente' || !a.arbitraje) continue;
        if (U.chance(0.0015 * a.arbitraje)) {
          E.economia.deficit += U.rf(0.08, 0.3);
          C.Medios.noticia(E, { tipo: 'economia', titular: `Un inversionista de ${C.Comercio.socio(a.socio).nombre} demanda a Colombia ante un tribunal de arbitraje por el TLC`, tono: -1, importante: true });
        }
      }
    },

    registrarAcciones() {
      const A = C.Acciones, Co = C.Comercio;
      A.registrar({ id: 'abrirTLC', nombre: 'Abrir negociación de TLC', icono: '🤝', grupo: 'comercio', costo: 2,
        disponible(E, a) { const ok = Co.esPresidente(E); if (ok !== true) return ok; return a.socio ? Tlc.puedeAbrir(E, a.socio) : true; },
        ejecutar(E, a) {
          const r = Tlc.puedeAbrir(E, a.socio); if (r !== true) return { ok: false, msg: r };
          Tlc.abrir(E, a.socio); return { ok: true, msg: `Se abre la negociación con ${Co.socio(a.socio).nombre}` };
        } });
      A.registrar({ id: 'rondaTLC', nombre: 'Negociar capítulo', icono: '🗣', grupo: 'comercio', costo: 1,
        disponible(E, a) {
          const ok = Co.esPresidente(E); if (ok !== true) return ok;
          const n = Tlc.neg(E, a.socio); if (!n || n.estado !== 'abierta') return 'No hay una negociación abierta con este socio';
          if (!n.capitulos[a.capitulo] || n.capitulos[a.capitulo].estado === 'cerrado') return 'Este capítulo ya está cerrado';
          return true;
        },
        ejecutar(E, a) {
          const postura = +a.postura; if (![0, 1, 2].includes(postura)) return { ok: false, msg: 'Elige la postura de Colombia' };
          const r = Tlc.ronda(E, a.socio, a.capitulo, postura);
          const cp = Tlc.cap(a.capitulo);
          return { ok: true, exito: r.cierra, msg: r.cierra ? `Se cierra «${cp.nombre}» con postura ${Tlc.posturas()[postura]}` : `${Co.socio(a.socio).nombre} no acepta esa propuesta en «${cp.nombre}» (${Math.round(r.prob * 100)} % de probabilidad)` };
        } });
      A.registrar({ id: 'firmarTLC', nombre: 'Firmar y enviar al Congreso', icono: '✍', grupo: 'comercio', costo: 2,
        disponible(E, a) {
          const ok = Co.esPresidente(E); if (ok !== true) return ok;
          const n = Tlc.neg(E, a.socio); return n && n.estado === 'cerrada' ? true : 'La negociación aún no está cerrada';
        },
        ejecutar(E, a) { Tlc.firmar(E, a.socio); return { ok: true, msg: 'El tratado queda radicado en el Senado' }; } });
      A.registrar({ id: 'consultaPreviaTLC', nombre: 'Adelantar consulta previa', icono: '🪶', grupo: 'comercio', costo: 1,
        disponible(E, a) {
          const ok = Co.esPresidente(E); if (ok !== true) return ok;
          const n = Tlc.neg(E, a.socio); if (!Tlc.activa(n) || n.estado === 'control') return 'No aplica en esta etapa';
          return n.consulta ? 'La consulta previa ya se adelantó' : true;
        },
        ejecutar(E, a) { Tlc.consultaPrevia(E, a.socio); return { ok: true, msg: 'Consulta previa adelantada: baja el riesgo ante la Corte y calma al movimiento indígena' }; } });
      A.registrar({ id: 'abandonarTLC', nombre: 'Levantarse de la mesa', icono: '🚪', grupo: 'comercio', costo: 0,
        disponible(E, a) {
          const ok = Co.esPresidente(E); if (ok !== true) return ok;
          const n = Tlc.neg(E, a.socio); return n && (n.estado === 'abierta' || n.estado === 'cerrada') ? true : 'No hay una negociación que abandonar';
        },
        ejecutar(E, a) { Tlc.abandonar(E, a.socio); return { ok: true, msg: 'Colombia se levanta de la mesa' }; } });
      A.registrar({ id: 'denunciarAcuerdo', nombre: 'Denunciar acuerdo', icono: '⛔', grupo: 'comercio', costo: 2,
        disponible(E, a) {
          const ok = Co.esPresidente(E); if (ok !== true) return ok;
          const ac = Co.acuerdoDe(E, a.socio); return ac && ac.estado === 'vigente' && ac.tipo !== 'mercosur' ? true : 'No hay un acuerdo que denunciar';
        },
        ejecutar(E, a) { Tlc.denunciar(E, a.socio, ''); return { ok: true, msg: 'Colombia denuncia el acuerdo: se pierden sus preferencias' }; } });
    }
  };

  C.TLC = Tlc;
  C.Tiempo.registrar('tlc', Tlc, 66);
  Tlc.registrarAcciones();
  C.Bus.on('ley', p => { const E = C.E; if (E && E.comercio && p.ratifica && p.ratifica.tipo === 'tlc') Tlc.aprobadoPorCongreso(E, p.ratifica.socio); });
  C.Bus.on('proyecto:archivado', p => { const E = C.E; if (E && E.comercio && p.ratifica && p.ratifica.tipo === 'tlc') Tlc.hundidoEnCongreso(E, p.ratifica.socio); });
})(window.CURUL);
