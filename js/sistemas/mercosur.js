/* Mercosur: una unión aduanera de verdad, no una casilla. Entrar exige negociar con el bloque por
   consenso (cualquier miembro puede vetar), aprobar el protocolo en el Congreso, pasar por la
   Corte Constitucional y esperar que los parlamentos de cada miembro lo ratifiquen. Una vez
   dentro, Colombia converge a un Arancel Externo Común (que sube los aranceles a terceros pero
   abre el comercio con los socios), pierde la libertad de fijar sus propios aranceles y de firmar
   TLC por su cuenta, y sus TLC previos con terceros (Estados Unidos, la Unión Europea…) chocan con
   las reglas del bloque: hay que conseguir excepciones o denunciarlos. Cada semestre hay cumbre,
   con presidencia pro tempore rotativa y decisiones que el Presidente puede respaldar o vetar. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const DAT = () => C.DATA.mercosur;
  const NOMBRE_MIEMBRO = { DIR: 'El Directorio', ARG: 'Argentina', BRA: 'Brasil', PRY: 'Paraguay', URY: 'Uruguay', VEN: 'Venezuela', BOL: 'Bolivia', COL: 'Colombia' };
  const CONVERGENCIAS = [4, 8, 12];

  const Mer = {
    CONVERGENCIAS,
    nombreMiembro: id => NOMBRE_MIEMBRO[id] || id,
    st(E) { return E.comercio.mercosur; },
    esMiembro(E) { const m = E.comercio && E.comercio.mercosur; return !!m && m.estado === 'miembro'; },
    existe(E) { return E.comercio.mercosur.existe; },
    unionAduanera(E) { return U.anio() >= DAT().unionAduanera; },
    /* Miembros de pleno derecho que votan en el consenso (no cuenta un miembro suspendido). */
    votantes(E) { return Object.entries(Mer.st(E).miembros).filter(([, m]) => !m.suspendido).map(([id]) => id).filter(id => id !== 'COL'); },
    fundadores: () => DAT().rotacion,

    init(E) {
      const anio = U.anio(), d = DAT(), miembros = {};
      for (const [id, desde] of Object.entries(d.miembrosDesde)) {
        if (desde > anio) continue;
        miembros[id] = { desde, suspendido: id === 'VEN' && anio >= 2017 };
      }
      const S = C.Comercio.sectores();
      const aec = {}; for (const s of S) aec[s.id] = s.aec;
      const semestres = (anio - d.fundacion) * 2 + (U.hoy().getUTCMonth() >= 6 ? 1 : 0);
      const rot = d.rotacion;
      E.comercio.mercosur = {
        existe: anio >= d.fundacion,
        estado: anio >= d.asociadoColombia ? 'asociado' : 'ninguno',
        miembros, ppt: rot[Math.max(0, semestres) % rot.length], proximaCumbre: E.fecha.t + 13,
        aec, aecFactor: 1, excepciones: [], excepcionesMax: 2, flexibilizado: false, autoriza: {},
        adhesion: null, adhesionFallida: null, convergencia: null,
        agenda: [], conflictos: {}, historial: []
      };
    },
    migrar(E) { if (E.comercio && !E.comercio.mercosur) Mer.init(E); },

    /* ── Adhesión ── */
    puedeSolicitar(E) {
      const m = Mer.st(E), Co = C.Comercio;
      if (!m.existe) return 'El Mercosur aún no existe en esta época';
      if (!Mer.unionAduanera(E)) return 'El Mercosur todavía no es una unión aduanera: la adhesión es posible desde 1995';
      if (m.estado === 'miembro') return 'Colombia ya es miembro pleno';
      if (m.adhesion) return 'Ya hay un proceso de adhesión en curso';
      if (m.adhesionFallida != null && E.fecha.t - m.adhesionFallida < 52) return `El bloque pide esperar: podrás volver a intentarlo en ${52 - (E.fecha.t - m.adhesionFallida)} semanas`;
      const prom = U.suma(Mer.fundadores().map(id => Co.relacion(E, id))) / Mer.fundadores().length;
      if (prom < 50) return 'La relación promedio con los fundadores del bloque es muy baja para abrir la adhesión';
      return true;
    },
    solicitar(E) {
      const m = Mer.st(E);
      m.adhesion = { t0: E.fecha.t, fase: 'negociacion', rondas: 0, paquete: { anios: 8, normativa: 0, focem: false, excepciones: [] }, ultimoVoto: null, unanimidad: false, proyecto: null, controlHasta: null, ratificaciones: null };
      m.estado = 'adhesion';
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'Colombia solicita formalmente su adhesión como miembro pleno del Mercosur', tono: 1, importante: true, jugador: true });
    },
    /* Cuánto le cuesta a cada miembro el paquete que ofrece Colombia (probabilidad de votar sí). */
    probVoto(E, id) {
      const Co = C.Comercio, adh = Mer.st(E).adhesion, pq = adh.paquete, pos = DAT().postura[id] || { dureza: 0.4, exige: null };
      const rel = Co.relacion(E, id), neg = E.jugador.atributos.negociacion;
      let p = 0.36 + rel / 250 + neg / 500 - pos.dureza * 0.25;
      p += (12 - pq.anios) / 8 * 0.10;
      p -= pq.excepciones.length * (id === 'ARG' ? 0.14 : 0.09);
      if (pos.exige && pq.excepciones.includes(pos.exige)) p -= 0.08;
      if (pq.normativa === 1) p += 0.07;
      if (pq.focem) p += (id === 'URY' || id === 'PRY') ? 0.12 : 0.03;
      return U.clamp(p, 0.05, 0.95);
    },
    rondaAdhesion(E) {
      const adh = Mer.st(E).adhesion; adh.rondas++;
      const votos = Mer.votantes(E).map(id => { const prob = Mer.probVoto(E, id); return { id, prob, si: U.chance(prob) }; });
      adh.ultimoVoto = { t: E.fecha.t, votos };
      adh.unanimidad = votos.every(v => v.si);
      if (adh.unanimidad) {
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'El Mercosur alcanza consenso para admitir a Colombia como miembro pleno: falta firmar el protocolo', tono: 1, importante: true, jugador: true });
      } else {
        for (const v of votos.filter(x => !x.si)) C.Comercio.moverRelacion(E, v.id, -1);
        if (adh.rondas >= 8) Mer.fracasarAdhesion(E, 'El bloque no logra consenso tras ocho rondas');
      }
      return adh.ultimoVoto;
    },
    fracasarAdhesion(E, motivo) {
      const m = Mer.st(E);
      m.adhesion = null; m.estado = 'asociado'; m.adhesionFallida = E.fecha.t;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Se cae la adhesión de Colombia al Mercosur: ${motivo}`, tono: -1, importante: true, jugador: true });
    },
    ecoDelProtocolo(adh) { return U.clamp(-20 + (adh.paquete.normativa === 1 ? 6 : 0) - adh.paquete.excepciones.length * 3, -55, 30); },
    firmarProtocolo(E) {
      const m = Mer.st(E), adh = m.adhesion, g = E.gobierno.gabinete;
      const bill = C.Legislacion.crear(E, { plantilla: 'ratificaciontratado', autor: g.exteriores || g.comercio || g.interior || null, gobierno: true, origen: 'senado',
        titulo: 'Aprobación del Protocolo de Adhesión de Colombia al Mercosur', eco: Mer.ecoDelProtocolo(adh), soc: 0, costo: adh.paquete.focem ? 0.35 : 0.1 });
      bill.ratifica = { tipo: 'mercosur' };
      adh.fase = 'congreso'; adh.proyecto = bill.id;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'El Gobierno firma el protocolo de adhesión al Mercosur y lo radica en el Senado', tono: 1, importante: true, jugador: true });
    },
    aprobadoPorCongreso(E) {
      const adh = Mer.st(E).adhesion; if (!adh) return;
      adh.fase = 'corte'; adh.controlHasta = E.fecha.t + U.ri(8, 14);
      C.Medios.noticia(E, { tipo: 'legislativo', titular: 'El Congreso aprueba el protocolo de adhesión al Mercosur: pasa a control de la Corte Constitucional', tono: 1, importante: true, jugador: true });
    },
    hundidoEnCongreso(E) {
      const adh = Mer.st(E).adhesion; if (!adh) return;
      adh.fase = 'negociacion'; adh.proyecto = null; adh.unanimidad = true;
      C.Medios.noticia(E, { tipo: 'legislativo', titular: 'Se hunde en el Congreso el protocolo de adhesión al Mercosur: el Gobierno puede volver a presentarlo', tono: -1, importante: true, jugador: true });
    },
    iniciarRatificaciones(E) {
      const Co = C.Comercio, adh = Mer.st(E).adhesion, r = {};
      for (const id of Mer.votantes(E)) r[id] = { hasta: E.fecha.t + U.ri(14, 48) + (Co.relacion(E, id) < 50 ? 26 : 0), listo: false, rebotado: false };
      adh.fase = 'ratificacion'; adh.ratificaciones = r;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'La adhesión de Colombia al Mercosur queda en manos de los parlamentos de los países miembros', tono: 0, jugador: true });
    },
    /* Colombia entra: los aranceles empiezan a converger al AEC, se abre el comercio con los
       socios y los TLC anteriores con terceros quedan en conflicto con las reglas del bloque. */
    ingresar(E) {
      const Co = C.Comercio, c = E.comercio, m = Mer.st(E), adh = m.adhesion, pq = adh.paquete;
      m.estado = 'miembro'; m.miembros.COL = { desde: E.fecha.t, suspendido: false };
      m.excepciones = pq.excepciones.slice(); m.adhesion = null;
      const inicio = {}; for (const s of Co.sectores()) inicio[s.id] = c.aranceles[s.id];
      m.convergencia = { desde: E.fecha.t, anios: pq.anios, inicio };
      for (const id of Mer.fundadores()) Co.crearAcuerdo(E, id, { tipo: 'mercosur', nombre: 'Mercosur (unión aduanera)', anios: pq.anios, red: { _: 1 }, acc: { _: 1 } });
      for (const a of Co.acuerdosVigentes(E)) {
        if (a.tipo === 'mercosur') continue;
        const socio = Co.socio(a.socio); if (a.tipo === 'can' && socio.tipo === 'can') { m.conflictos[a.socio] = { estado: 'pendiente', hasta: E.fecha.t + 104, acomodable: true }; continue; }
        m.conflictos[a.socio] = { estado: 'pendiente', hasta: E.fecha.t + 104, acomodable: false };
      }
      if (E.diplomacia && E.diplomacia.organismos.mercosur) E.diplomacia.organismos.mercosur.miembro = true;
      if (pq.focem) C.Economia.programar(E, [{ v: 'deficit', d: 0.05, p: 'm' }], 'mercosur:focem');
      C.Economia.programar(E, [{ v: 'inversion', d: 0.2, p: 'm' }, { v: 'confianza', d: 0.3, p: 'i' }], 'mercosur');
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 1.5, 3, 95);
      c.medidas.push({ t: E.fecha.t, txt: 'Colombia ingresa al Mercosur como miembro pleno' });
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia ingresa al Mercosur como miembro pleno: converge al Arancel Externo Común en ${pq.anios} años`, tono: 1, importante: true, jugador: true });
      Mer.actualizarRotacion(E);
    },
    salir(E) {
      const Co = C.Comercio, c = E.comercio, m = Mer.st(E);
      m.estado = 'retirado'; delete m.miembros.COL; m.convergencia = null; m.conflictos = {}; m.excepciones = [];
      for (const s of Co.sectores()) c.aranceles[s.id] = s.mfn;
      for (const a of Object.values(c.acuerdos)) if (a.tipo === 'mercosur' && a.estado === 'vigente') { a.estado = 'terminado'; a.hastaT = E.fecha.t; }
      for (const id of Mer.fundadores()) Co.moverRelacion(E, id, -9);
      if (E.diplomacia && E.diplomacia.organismos.mercosur) E.diplomacia.organismos.mercosur.miembro = false;
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1.5, 3, 95);
      c.medidas.push({ t: E.fecha.t, txt: 'Colombia se retira del Mercosur' });
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'Colombia se retira del Mercosur y recupera su autonomía arancelaria', tono: -1, importante: true, jugador: true });
      Mer.actualizarRotacion(E);
    },
    /* Mientras se converge, el arancel aplicado va del punto de partida al AEC, salvo en las
       excepciones nacionales. */
    turnoConvergencia(E) {
      const m = Mer.st(E), c = E.comercio; if (!Mer.esMiembro(E) || !m.convergencia) return;
      if (C.MercosurInst && !C.MercosurInst.st(E).aecActivo) return;
      const prog = U.clamp((E.fecha.t - m.convergencia.desde) / (52 * m.convergencia.anios), 0, 1);
      for (const s of C.Comercio.sectores()) {
        if (s.sinArancel || m.excepciones.includes(s.id)) continue;
        const ini = m.convergencia.inicio[s.id], meta = m.aec[s.id];
        c.aranceles[s.id] = ini + (meta - ini) * prog;
      }
    },
    /* Si el AEC cambia a mitad de camino, la convergencia se reinicia desde los aranceles de hoy
       con el tiempo que le quedaba. */
    reiniciarConvergencia(E) {
      const m = Mer.st(E), c = E.comercio; if (!Mer.esMiembro(E) || !m.convergencia) return;
      const now = {}; for (const s of C.Comercio.sectores()) now[s.id] = c.aranceles[s.id];
      const quedan = Math.max(0.5, m.convergencia.anios - (E.fecha.t - m.convergencia.desde) / 52);
      m.convergencia = { desde: E.fecha.t, anios: quedan, inicio: now };
    },
    puedeFijarArancel(E, sector) { return Mer.st(E).excepciones.includes(sector); },
    /* ¿El bloque impide negociar un TLC con ese socio? */
    bloqueaTLC(E, socioId) {
      const m = Mer.st(E), I = C.MercosurInst ? C.MercosurInst.st(E) : null;
      if (I && (I.niv.exterior === 0 || !I.aecActivo)) return false;
      return !m.flexibilizado && !(m.autoriza[socioId] && m.autoriza[socioId] > E.fecha.t);
    },
    pedirAutorizacion(E, socioId) {
      const m = Mer.st(E), Co = C.Comercio;
      const rel = U.suma(Mer.votantes(E).map(id => Co.relacion(E, id))) / Math.max(1, Mer.votantes(E).length);
      const prob = U.clamp(0.28 + rel / 250 + E.jugador.atributos.negociacion / 500, 0.1, 0.8);
      const ok = U.chance(prob);
      if (ok) m.autoriza[socioId] = E.fecha.t + 52;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: ok ? `El Mercosur autoriza a Colombia a negociar un TLC con ${Co.socio(socioId).nombre}` : `El Mercosur no autoriza a Colombia a negociar por separado con ${Co.socio(socioId).nombre}`, tono: ok ? 1 : -1, jugador: true });
      return { ok, prob };
    },
    /* Un miembro pide mantener su arancel nacional en un sector: requiere consenso. */
    pedirExcepcion(E, sector) {
      const m = Mer.st(E), Co = C.Comercio;
      const rel = U.suma(Mer.votantes(E).map(id => Co.relacion(E, id))) / Math.max(1, Mer.votantes(E).length);
      const prob = U.clamp(0.25 + rel / 300 + E.jugador.atributos.negociacion / 500 - m.excepciones.length * 0.08, 0.08, 0.75);
      const ok = U.chance(prob);
      if (ok) {
        m.excepciones.push(sector);
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El Mercosur concede a Colombia una excepción al Arancel Externo Común en ${Co.sector(sector).nombre.toLowerCase()}`, tono: 1, jugador: true });
      }
      return { ok, prob };
    },
    /* Conflicto entre el Mercosur y un TLC anterior con un tercero. */
    gestionarConflicto(E, socioId, camino) {
      const m = Mer.st(E), Co = C.Comercio, cf = m.conflictos[socioId];
      if (camino === 'denunciar') {
        C.TLC.denunciar(E, socioId, 'incompatible con el Mercosur'); cf.estado = 'resuelto';
        return { ok: true, msg: 'Se denuncia el acuerdo: se pierden sus preferencias, pero se cumple con el bloque' };
      }
      const rel = U.suma(Mer.votantes(E).map(id => Co.relacion(E, id))) / Math.max(1, Mer.votantes(E).length);
      const prob = U.clamp(0.3 + rel / 300 + (cf.acomodable ? 0.28 : 0) - (socioId === 'USA' ? 0.14 : 0) + E.jugador.atributos.negociacion / 500 + (m.flexibilizado ? 0.4 : 0), 0.08, 0.92);
      if (U.chance(prob)) {
        cf.estado = 'excepcion'; cf.hasta = cf.acomodable || m.flexibilizado ? null : E.fecha.t + 260;
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El Mercosur acepta que Colombia mantenga su acuerdo con ${Co.socio(socioId).nombre} bajo un régimen transitorio`, tono: 1, jugador: true });
        return { ok: true, msg: 'El bloque concede una excepción para mantener el acuerdo' };
      }
      Co.moverRelacion(E, 'BRA', -1); Co.moverRelacion(E, 'ARG', -1);
      return { ok: true, msg: `El bloque no acepta la excepción (${Math.round(prob * 100)} % de probabilidad)` };
    },

    /* ── Cumbres, presidencia pro tempore y decisiones ── */
    rotacion(E) {
      const m = Mer.st(E), r = DAT().rotacion.slice();
      if (m.miembros.COL) r.push('COL');
      return r.sort((a, b) => Mer.nombreMiembro(a).localeCompare(Mer.nombreMiembro(b), 'es'));
    },
    actualizarRotacion(E) { const m = Mer.st(E), r = Mer.rotacion(E); if (!r.includes(m.ppt)) m.ppt = r[0]; },
    colombiaPreside(E) { return Mer.esMiembro(E) && Mer.st(E).ppt === 'COL'; },
    proponerDecisiones(E, n, preferida) {
      const m = Mer.st(E), pend = m.agenda.filter(x => x.estado === 'pendiente').map(x => x.decision);
      const pool = DAT().decisiones.filter(d => !pend.includes(d.id) && !(d.id === 'flexibilizar' && m.flexibilizado));
      const out = [];
      if (preferida) { const d = DAT().decisiones.find(x => x.id === preferida); if (d) out.push(d); }
      while (out.length < n && pool.length) { const d = U.pick(pool); pool.splice(pool.indexOf(d), 1); if (!out.includes(d)) out.push(d); }
      return out;
    },
    cumbre(E) {
      const m = Mer.st(E), r = Mer.rotacion(E);
      const iAct = Math.max(0, r.indexOf(m.ppt)); m.ppt = r[(iAct + 1) % r.length];
      m.proximaCumbre = E.fecha.t + 26;
      const dirN = C.MercosurInst ? C.MercosurInst.nivel(E, 'directorio') : 0;
      const decs = Mer.proponerDecisiones(E, (U.chance(0.5) ? 2 : 1) + (dirN >= 2 ? 1 : 0));
      for (const d of decs) m.agenda.push({ id: U.id('dm'), decision: d.id, proponen: dirN >= 3 && U.chance(0.5) ? 'DIR' : U.pick(d.proponen), t: E.fecha.t, hasta: E.fecha.t + 8, estado: 'pendiente', respaldo: 0 });
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Cumbre del Mercosur: ${Mer.nombreMiembro(m.ppt)} asume la presidencia pro tempore${decs.length ? ' y se ponen sobre la mesa ' + decs.map(d => '«' + d.nombre.toLowerCase() + '»').join(' y ') : ''}`, tono: 0, importante: Mer.esMiembro(E) });
    },
    /* Decisión del bloque sobre un punto de la agenda. `respaldo`: -1 veto de Colombia, +1 respaldo. */
    resolverDecision(E, it) {
      const m = Mer.st(E), def = DAT().decisiones.find(d => d.id === it.decision), pos = DAT().postura[it.proponen] || { dureza: 0.4 };
      const I = C.MercosurInst ? C.MercosurInst.st(E) : null, regla = I ? I.niv.votacion : 0;
      const veto = it.respaldo < 0 && Mer.esMiembro(E) && (regla === 0 || U.chance(regla === 1 ? 0.45 : 0.75));
      let prob = (0.62 - pos.dureza * 0.1 + it.respaldo * 0.22) * (def.dificultad || 1);
      if (I) prob += (I.niv.directorio >= 2 ? 0.05 * I.niv.directorio : 0) + (I.comisionado ? 0.04 : 0) + (regla ? 0.06 * regla : 0) + (I.legit - 45) / 700;
      if (Mer.colombiaPreside(E)) prob += 0.08;
      const adopta = !veto && U.chance(U.clamp(prob, 0.05, 0.95));
      it.estado = adopta ? 'adoptada' : 'vetada';
      if (adopta) Mer.aplicarDecision(E, def);
      else C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El Mercosur no logra consenso sobre «${def.nombre.toLowerCase()}»${veto ? ': Colombia ejerce su veto' : ''}`, tono: 0 });
      if (it.respaldo !== 0) for (const id of [it.proponen]) C.Comercio.moverRelacion(E, id, it.respaldo > 0 ? 1.5 : -2.5);
    },
    aplicarDecision(E, def) {
      const m = Mer.st(E), c = E.comercio, e = def.efecto;
      if (e.aec) {
        for (const k of Object.keys(m.aec)) if (!C.Comercio.sector(k).sinArancel) m.aec[k] = +(m.aec[k] * (1 + e.aec)).toFixed(2);
        m.aecFactor = +(m.aecFactor * (1 + e.aec)).toFixed(3);
        Mer.reiniciarConvergencia(E);
      }
      if (e.aecIndustria) {
        for (const k of ['industria', 'textil']) m.aec[k] = +(m.aec[k] * (1 + e.aecIndustria)).toFixed(2);
        m.aecFactor = +(m.aecFactor * (1 + e.aecIndustria * 0.5)).toFixed(3);
        Mer.reiniciarConvergencia(E);
      }
      if (e.excepciones) m.excepcionesMax += e.excepciones;
      if (e.flexibilizar) m.flexibilizado = true;
      if (e.acuerdo && Mer.esMiembro(E)) { c.tension.agrosens = U.clamp(c.tension.agrosens + 8, 0, 100); C.Comercio.tocarActor(E, 'agrario', 5); }
      m.historial.push({ t: E.fecha.t, txt: def.nombre });
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El Mercosur adopta: ${def.nombre.toLowerCase()}`, tono: 0, importante: Mer.esMiembro(E) });
    },

    turno(E) {
      const m = E.comercio && E.comercio.mercosur; if (!m || !m.existe) return;
      Mer.turnoConvergencia(E);
      if (E.fecha.t >= m.proximaCumbre) Mer.cumbre(E);
      for (const it of m.agenda) if (it.estado === 'pendiente' && E.fecha.t >= it.hasta) Mer.resolverDecision(E, it);
      m.agenda = m.agenda.filter(it => it.estado === 'pendiente' || E.fecha.t - it.hasta < 60);
      const adh = m.adhesion;
      if (adh && adh.fase === 'corte' && E.fecha.t >= adh.controlHasta) {
        const tumba = U.chance(0.05 * (C.Corte ? C.Corte.factorEco(E, Mer.ecoDelProtocolo(adh)) : 1) * (E.participacion && E.participacion.refrendos && E.participacion.refrendos.apertura ? 0.6 : 1));
        if (C.Corte) C.Corte.registrarFallo(E, { tipo: 'tratado', titulo: 'Protocolo de adhesión al Mercosur', resultado: tumba ? 'inexequible' : 'exequible', gobierno: true });
        if (tumba) { Mer.fracasarAdhesion(E, 'la Corte Constitucional declara inexequible el protocolo'); }
        else Mer.iniciarRatificaciones(E);
      } else if (adh && adh.fase === 'ratificacion') {
        for (const [id, r] of Object.entries(adh.ratificaciones)) {
          if (r.listo || E.fecha.t < r.hasta) continue;
          if (!r.rebotado && C.Comercio.relacion(E, id) < 55 && U.chance(0.15)) { r.rebotado = true; r.hasta = E.fecha.t + 26; C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El parlamento de ${Mer.nombreMiembro(id)} aplaza la ratificación de la adhesión de Colombia al Mercosur`, tono: -1, jugador: true }); continue; }
          r.listo = true;
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: `El parlamento de ${Mer.nombreMiembro(id)} ratifica la adhesión de Colombia al Mercosur`, tono: 1, jugador: true });
        }
        if (Object.values(adh.ratificaciones).every(r => r.listo)) Mer.ingresar(E);
      }
      // Conflictos con TLC anteriores: al vencer el plazo sin resolver, se pierde el acuerdo
      for (const [socio, cf] of Object.entries(m.conflictos)) {
        if (cf.estado === 'pendiente' && E.fecha.t >= cf.hasta) {
          if (cf.acomodable || m.flexibilizado) { cf.estado = 'excepcion'; cf.hasta = null; }
          else { C.TLC.denunciar(E, socio, 'vence el plazo para conciliarlo con el Mercosur'); cf.estado = 'resuelto'; }
        } else if (cf.estado === 'excepcion' && cf.hasta && E.fecha.t >= cf.hasta && !m.flexibilizado) {
          cf.estado = 'pendiente'; cf.hasta = E.fecha.t + 52;
        }
      }
    },

    registrarAcciones() {
      const A = C.Acciones, Co = C.Comercio, pres = Co.esPresidente;
      const enAdhesion = (E, fase) => { const a = Mer.st(E).adhesion; return a && (!fase || a.fase === fase) ? a : null; };
      A.registrar({ id: 'solicitarAdhesionMercosur', nombre: 'Solicitar adhesión al Mercosur', icono: '🌐', grupo: 'comercio', costo: 2,
        disponible(E) { const ok = pres(E); if (ok !== true) return ok; return Mer.puedeSolicitar(E); },
        ejecutar(E) { Mer.solicitar(E); return { ok: true, msg: 'Se radica la solicitud de adhesión: empieza la negociación con el bloque' }; } });
      A.registrar({ id: 'armarPaqueteMercosur', nombre: 'Definir la oferta de Colombia', icono: '📋', grupo: 'comercio', costo: 0,
        disponible(E) { const ok = pres(E); if (ok !== true) return ok; return enAdhesion(E, 'negociacion') ? true : 'No hay una negociación de adhesión abierta'; },
        ejecutar(E, a) {
          const adh = enAdhesion(E, 'negociacion'); if (!adh) return { ok: false, msg: 'No hay una negociación de adhesión abierta' };
          const anios = +a.anios; if (!CONVERGENCIAS.includes(anios)) return { ok: false, msg: 'Elige un plazo de convergencia' };
          adh.paquete.anios = anios; adh.paquete.normativa = a.normativa === 'total' ? 1 : 0; adh.paquete.focem = a.focem === 'si';
          adh.unanimidad = false;
          return { ok: true, msg: `Oferta definida: convergencia en ${anios} años, ${adh.paquete.normativa ? 'normativa completa' : 'normativa parcial'}${adh.paquete.focem ? ', con aporte al FOCEM' : ''}` };
        } });
      A.registrar({ id: 'excepcionAdhesionMercosur', nombre: 'Alternar excepción', icono: '🚧', grupo: 'comercio', costo: 0,
        disponible(E, a) {
          const ok = pres(E); if (ok !== true) return ok;
          const adh = enAdhesion(E, 'negociacion'); if (!adh) return 'No hay una negociación de adhesión abierta';
          if (!adh.paquete.excepciones.includes(a.sector) && adh.paquete.excepciones.length >= 2) return 'El bloque acepta como máximo dos excepciones nacionales';
          return true;
        },
        ejecutar(E, a) {
          const adh = enAdhesion(E, 'negociacion'), ex = adh.paquete.excepciones, i = ex.indexOf(a.sector);
          if (i >= 0) ex.splice(i, 1); else ex.push(a.sector);
          adh.unanimidad = false;
          return { ok: true, msg: i >= 0 ? 'Se retira la excepción de la oferta' : 'Se incluye la excepción en la oferta: mejora tu margen interno pero el bloque la mirará con recelo' };
        } });
      A.registrar({ id: 'rondaAdhesionMercosur', nombre: 'Someter la oferta a consenso', icono: '🗳', grupo: 'comercio', costo: 2,
        disponible(E) { const ok = pres(E); if (ok !== true) return ok; const a = enAdhesion(E, 'negociacion'); if (!a) return 'No hay una negociación de adhesión abierta'; return a.unanimidad ? 'Ya hay consenso: firma el protocolo' : true; },
        ejecutar(E) { const r = Mer.rondaAdhesion(E); const no = r.votos.filter(v => !v.si).map(v => Mer.nombreMiembro(v.id)); return { ok: true, exito: no.length === 0, msg: no.length ? `Se oponen: ${no.join(', ')}` : 'Consenso: los cuatro miembros aprueban' }; } });
      A.registrar({ id: 'firmarProtocoloMercosur', nombre: 'Firmar protocolo y enviar al Congreso', icono: '✍', grupo: 'comercio', costo: 2,
        disponible(E) { const ok = pres(E); if (ok !== true) return ok; const a = enAdhesion(E, 'negociacion'); return a && a.unanimidad ? true : 'Primero necesitas el consenso del bloque'; },
        ejecutar(E) { Mer.firmarProtocolo(E); return { ok: true, msg: 'El protocolo queda radicado en el Senado' }; } });
      A.registrar({ id: 'retirarSolicitudMercosur', nombre: 'Retirar la solicitud', icono: '🚪', grupo: 'comercio', costo: 0,
        disponible(E) { const ok = pres(E); if (ok !== true) return ok; return enAdhesion(E) ? true : 'No hay un proceso de adhesión'; },
        ejecutar(E) { Mer.fracasarAdhesion(E, 'Colombia retira su solicitud'); return { ok: true, msg: 'Se retira la solicitud de adhesión' }; } });
      A.registrar({ id: 'salirMercosur', nombre: 'Retirarse del Mercosur', icono: '⛔', grupo: 'comercio', costo: 2,
        disponible(E) { const ok = pres(E); if (ok !== true) return ok; return Mer.esMiembro(E) ? true : 'Colombia no es miembro'; },
        ejecutar(E) { Mer.salir(E); return { ok: true, msg: 'Colombia se retira del Mercosur' }; } });
      A.registrar({ id: 'pedirAutorizacionTLC', nombre: 'Pedir autorización al bloque', icono: '🙏', grupo: 'comercio', costo: 1,
        disponible(E, a) { const ok = pres(E); if (ok !== true) return ok; return Mer.esMiembro(E) ? true : 'Sólo aplica a miembros del Mercosur'; },
        ejecutar(E, a) { const r = Mer.pedirAutorizacion(E, a.socio); return { ok: true, exito: r.ok, msg: r.ok ? 'El bloque autoriza la negociación por un año' : `El bloque no autoriza (${Math.round(r.prob * 100)} % de probabilidad)` }; } });
      A.registrar({ id: 'pedirExcepcionAEC', nombre: 'Pedir excepción al AEC', icono: '🚧', grupo: 'comercio', costo: 2,
        disponible(E, a) {
          const ok = pres(E); if (ok !== true) return ok;
          const m = Mer.st(E); if (!Mer.esMiembro(E)) return 'Sólo aplica a miembros del Mercosur';
          if (m.excepciones.includes(a.sector)) return 'Ya tienes esta excepción';
          return m.excepciones.length >= m.excepcionesMax ? 'Ya usaste todas las excepciones que permite el bloque' : true;
        },
        ejecutar(E, a) { const r = Mer.pedirExcepcion(E, a.sector); return { ok: true, exito: r.ok, msg: r.ok ? 'El bloque concede la excepción' : `El bloque niega la excepción (${Math.round(r.prob * 100)} % de probabilidad)` }; } });
      A.registrar({ id: 'conflictoMercosur', nombre: 'Resolver el conflicto', icono: '⚖', grupo: 'comercio', costo: 1,
        disponible(E, a) { const ok = pres(E); if (ok !== true) return ok; const cf = Mer.st(E).conflictos[a.socio]; return cf && cf.estado === 'pendiente' ? true : 'Este acuerdo no tiene un conflicto pendiente'; },
        ejecutar(E, a) { if (!['excepcion', 'denunciar'].includes(a.camino)) return { ok: false, msg: 'Elige cómo resolverlo' }; return Mer.gestionarConflicto(E, a.socio, a.camino); } });
      const enAgenda = (E, id) => Mer.st(E).agenda.find(x => x.id === id && x.estado === 'pendiente');
      for (const [id, nombre, icono, d] of [['respaldarDecisionMercosur', 'Respaldar', '👍', 1], ['vetarDecisionMercosur', 'Vetar', '✋', -1]]) {
        A.registrar({ id, nombre, icono, grupo: 'comercio', costo: 1,
          disponible(E, a) { const ok = pres(E); if (ok !== true) return ok; if (!Mer.esMiembro(E)) return 'Sólo los miembros votan en el bloque'; const it = enAgenda(E, a.item); return it && !it.respaldo ? true : 'Ya te pronunciaste sobre este punto'; },
          ejecutar(E, a) { const it = enAgenda(E, a.item); it.respaldo = d; return { ok: true, msg: d > 0 ? 'Colombia respalda la propuesta' : 'Colombia anuncia su veto' }; } });
      }
      A.registrar({ id: 'impulsarAgendaMercosur', nombre: 'Impulsar un punto en la agenda', icono: '📣', grupo: 'comercio', costo: 2,
        disponible(E) { const ok = pres(E); if (ok !== true) return ok; return Mer.colombiaPreside(E) ? true : 'Sólo quien ejerce la presidencia pro tempore puede fijar la agenda'; },
        ejecutar(E, a) {
          if (!DAT().decisiones.some(d => d.id === a.decision)) return { ok: false, msg: 'Elige una decisión' };
          const m = Mer.st(E); if (m.agenda.some(x => x.decision === a.decision && x.estado === 'pendiente')) return { ok: false, msg: 'Ese punto ya está en la agenda' };
          const def = DAT().decisiones.find(d => d.id === a.decision);
          m.agenda.push({ id: U.id('dm'), decision: a.decision, proponen: 'COL', t: E.fecha.t, hasta: E.fecha.t + 6, estado: 'pendiente', respaldo: 1 });
          E.jugador.rep.liderazgo = U.clamp(E.jugador.rep.liderazgo + 1, 0, 100);
          return { ok: true, msg: `Colombia pone en agenda: ${def.nombre.toLowerCase()}` };
        } });
    }
  };

  C.Mercosur = Mer;
  C.Tiempo.registrar('mercosur', Mer, 67);
  Mer.registrarAcciones();
  C.Bus.on('ley', p => { const E = C.E; if (E && E.comercio && p.ratifica && p.ratifica.tipo === 'mercosur') Mer.aprobadoPorCongreso(E); });
  C.Bus.on('proyecto:archivado', p => { const E = C.E; if (E && E.comercio && p.ratifica && p.ratifica.tipo === 'mercosur') Mer.hundidoEnCongreso(E); });
})(window.CURUL);
