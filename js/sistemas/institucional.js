/* Crisis institucionales (Fase 45): estado de sitio permanente, juicio político («golpe parlamentario»), Asamblea Constituyente de
   iniciativa ciudadana, guerra civil abierta con territorios en disputa, partido oficialista y elecciones controladas de las juntas,
   presos políticos y mártires, y exilio con vida propia (asilo, red de resistencia y regreso). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'gobierno', titular: txt, tono: tono == null ? -1 : tono, importante: !!imp, jugador: esPres(E) }); };
  const R = E => C.Regimen.asegurar(E);
  const jefe = E => { const r = R(E); return r.junta && esPres(E) && r.junta.lider === 'J' ? r.junta : null; };
  const nomDep = id => (C.E.deptos[id] || { nombre: id }).nombre;
  const I = {
    clave: 'ins',
    asegurar(E) {
      if (E.ins && E.ins.sitio) return E.ins;
      E.ins = { sitio: { activo: false, desde: 0, prorrogas: 0, corte: 0, perm: false, hist: 0 }, juicio: null, juicios: [], guerra: null, exilio: null, oficial: null, ult: {} };
      return E.ins;
    },
    init(E) { E.ins = null; }, migrar(E) { I.asegurar(E); },
    /* ── Estado de sitio permanente ── */
    declararSitio(E, jug) {
      const s = I.asegurar(E).sitio; if (s.activo) return false;
      s.activo = true; s.desde = E.fecha.t; s.prorrogas = 0; s.corte = 0; s.jug = !!jug;
      for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad + 2, 1, 99);
      noti(E, `El Gobierno declara el estado de sitio en todo el territorio${U.anio() >= 1991 ? ' (conmoción interior permanente)' : ''}`, -1, true); return true;
    },
    levantarSitio(E, motivo) { const s = I.asegurar(E).sitio; if (!s.activo) return; s.activo = false; s.hist = (s.hist || 0) + E.fecha.t - s.desde; noti(E, `Se levanta el estado de sitio${motivo ? ': ' + motivo : ''}`, 1, true); },
    turnoSitio(E) {
      const s = I.asegurar(E).sitio, t = E.fecha.t, y = U.anio(), r = R(E);
      if (!s.activo) {
        // antes de 1991 los gobiernos vivían en estado de sitio con frecuencia
        if (y < 1991 && !esPres(E) && U.chance(0.003 * (1 + (C.Historia ? C.Historia.asegurar(E).violencia.nivel / 40 : 0)))) I.declararSitio(E, false);
        return;
      }
      const dur = t - s.desde;
      r.libertad = Math.max(8, r.libertad - 0.025);
      if (t % 4 === 0) for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad + 0.12, 1, 99);
      if (E.corte) { E.corte.tension = cl(E.corte.tension + (y >= 1991 ? 0.45 : 0.1), 0, 100); s.corte = E.corte.tension; }
      if (C.Historia && !esPres(E) && y < 1991 && dur > 52 && U.chance(0.008)) I.levantarSitio(E, 'el Gobierno lo da por superado');
      // prórrogas: después de 1991 exigen el visto bueno del Senado, y la Corte lo revisa
      if (dur > 0 && dur % 13 === 0 && y >= 1991 && esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) { s.prorrogas++; C.Eventos.disparar(E, C.Eventos.plantilla('ins_prorroga'), { forzar: true, vars: { n: s.prorrogas } }); }
      if (y >= 1991 && E.corte && E.corte.tension > 65 && U.chance(0.035)) { I.levantarSitio(E, 'la Corte Constitucional declara inexequible la conmoción permanente'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + (esPres(E) ? -2 : 0), 3, 95); E.corte.tension = Math.max(20, E.corte.tension - 25); }
      if (dur > 104 && !s.perm) { s.perm = true; noti(E, 'Dos años de estado de sitio: la excepción se vuelve norma', -1); }
    },
    /* ── Juicio político ── */
    oposicion(E, cam) { const c = C.Congreso.composicion(E, cam); const t = Math.max(1, c.total); return (c.porPostura.oposicion + c.porPostura.independiente * 0.35) / t; },
    votosJuicio(E, j, cam) {
      const base = I.oposicion(E, cam) + (50 - E.opinion.aprobacionPres) / 200 + (E.opinion.escandalos || 0) * 0.02 + (j.lobby || 0) + (cam === 'senado' ? -0.1 : 0) + (C.Corrupcion ? C.Corrupcion.asegurar(E).indice / 800 : 0);
      return cl(base + (C.Corte.hash(j.id + cam) - 0.5) * 0.12, 0.03, 0.97);
    },
    abrirJuicio(E, motivo, quien) {
      const ins = I.asegurar(E); if (ins.juicio || !E.gobierno.presidente) return null;
      const j = { id: U.id('jp'), fase: 'acusacion', t0: E.fecha.t, dur: U.ri(8, 14), motivo, quien, lobby: 0, pretexto: E.opinion.aprobacionPres > 45 && (E.opinion.escandalos || 0) < 2 };
      ins.juicio = j; noti(E, `JUICIO POLÍTICO: ${quien === 'J' ? E.jugador.nombre + ' impulsa' : 'se abre'} la acusación contra el Presidente (${motivo})`, -1, true);
      if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ins_juicio'), { forzar: true, vars: { motivo } });
      return j;
    },
    resolverJuicio(E, j) {
      const ins = I.asegurar(E);
      if (j.fase === 'acusacion') {
        const f = I.votosJuicio(E, j, 'camara');
        if (f > 0.5) { j.fase = 'senado'; j.dur = U.ri(10, 20); j.t0 = E.fecha.t; noti(E, `La Cámara aprueba acusar al Presidente (${Math.round(f * 100)} % de votos): el proceso pasa al Senado`, -1, true); }
        else { noti(E, `La Cámara archiva la acusación contra el Presidente (${Math.round(f * 100)} % de votos)`, 0, true); I.cerrarJuicio(E, j, 'archivado'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + (esPres(E) ? 2 : 0), 3, 95); }
      } else if (j.fase === 'senado') {
        const f = I.votosJuicio(E, j, 'senado');
        if (f >= 2 / 3) {
          I.cerrarJuicio(E, j, 'destituido'); noti(E, `El Senado DESTITUYE al Presidente (${Math.round(f * 100)} % de votos)${j.pretexto ? ': críticos hablan de un golpe parlamentario' : ''}`, -1, true);
          const antes = E.gobierno.presidente; if (C.Vice) C.Vice.faltaAbsoluta(E, 'condena');
          if (j.quien === 'J') C.Opinion.subirRec(E, 4);
          if (j.pretexto && C.OEA && C.OEA.carta() && C.OEA.miembroCol(E) && U.chance(0.35)) C.OEA.abrir(E, 'COL', 'npc', 'golpe parlamentario');
        } else { noti(E, `El Senado absuelve al Presidente (${Math.round(f * 100)} % de votos)`, 1, true); I.cerrarJuicio(E, j, 'absuelto'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + (esPres(E) ? 4 : 0), 3, 95); }
      }
    },
    cerrarJuicio(E, j, res) { const ins = I.asegurar(E); j.res = res; j.fin = E.fecha.t; ins.juicios.unshift(j); if (ins.juicios.length > 6) ins.juicios.length = 6; ins.juicio = null; },
    turnoJuicio(E) {
      const ins = I.asegurar(E), j = ins.juicio, t = E.fecha.t;
      if (j) { if (t - j.t0 >= j.dur) I.resolverJuicio(E, j); return; }
      if (E.meta.presim || !E.gobierno.presidente) return;
      const est = (E.opinion.escandalos || 0), ap = E.opinion.aprobacionPres;
      const p = 0.0006 * Math.max(0, est - 1.5) * Math.max(0, (40 - ap) / 20) * (1 + I.oposicion(E, 'camara'));
      if (p > 0 && U.chance(p) && t - (ins.ult.juicio || -999) > 104) { ins.ult.juicio = t; I.abrirJuicio(E, est > 3 ? 'escándalos de corrupción' : 'extralimitación de funciones', 'npc'); }
    },
    /* ── Guerra civil ── */
    iniciarGuerra(E, motivo, quien) {
      const ins = I.asegurar(E); if (ins.guerra && ins.guerra.activa) return null;
      const deps = Object.values(E.deptos), reb = deps.slice().sort((a, b) => a.seguridad - b.seguridad).slice(0, Math.max(3, Math.round(deps.length * 0.25))).map(d => d.id), control = {};
      for (const d of deps) control[d.id] = reb.includes(d.id) ? 'reb' : 'gob';
      ins.guerra = { activa: true, t0: E.fecha.t, control, fGob: 55, fReb: 40, motivo, quien, apoyoExt: 0, hist: [] };
      noti(E, `GUERRA CIVIL: ${motivo}. Los rebeldes controlan ${reb.length} departamentos`, -1, true); if (C.Regimen) C.Regimen.anotar(E, `Estalla la guerra civil (${motivo})`);
      if (C.Historia) C.Historia.asegurar(E).violencia.nivel = Math.max(C.Historia.asegurar(E).violencia.nivel, 55); return ins.guerra;
    },
    cuentaGuerra(E) { const g = I.asegurar(E).guerra; if (!g) return { reb: 0, total: 0 }; const v = Object.values(g.control); return { reb: v.filter(x => x === 'reb').length, total: v.length }; },
    turnoGuerra(E) {
      const g = I.asegurar(E).guerra, r = R(E); if (!g || !g.activa) return;
      const mil = C.Poderes ? C.Poderes.asegurar(E).actores.militares.poder : 60, j = r.junta, ayudaUsa = C.Interv ? C.Interv.asegurar(E).ayuda : 50;
      g.fGob = cl(55 + (mil - 60) * 0.3 + (j ? (j.legit - 50) * 0.2 : (E.opinion.aprobacionPres - 40) * 0.2) + (ayudaUsa - 50) * 0.15, 15, 95);
      g.fReb = cl(35 + (j ? j.resistencia * 0.3 : 8) + g.apoyoExt * 0.25 + (g.quien === 'J' ? 6 : 0), 10, 95);
      const ids = Object.keys(g.control), id = U.pick(ids), cur = g.control[id], pReb = g.fReb / (g.fReb + g.fGob);
      if (U.chance(0.45)) { const tomaReb = U.chance(pReb); if (tomaReb && cur === 'gob' && U.chance(0.5)) { g.control[id] = 'reb'; g.hist.unshift(`Los rebeldes toman ${nomDep(id)}`); } else if (!tomaReb && cur === 'reb' && U.chance(0.5)) { g.control[id] = 'gob'; g.hist.unshift(`El Gobierno recupera ${nomDep(id)}`); } if (g.hist.length > 10) g.hist.length = 10; }
      const n = I.cuentaGuerra(E);
      for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad - (g.control[d.id] === 'reb' ? 0.08 : 0.03), 1, 99);
      E.economia.confianza = cl(E.economia.confianza - 0.04, 5, 95); if (C.CIDH && U.chance(0.04)) C.CIDH.registrar(E, U.pick(['masacre', 'desplazamiento', 'ejecucion']), { inst: j ? 'junta' : 'ejercito', resp: jefe(E) ? 'J' : null });
      if (E.fecha.t - g.t0 > 12 && n.reb >= n.total * 0.6) I.terminarGuerra(E, 'rebeldes');
      else if (E.fecha.t - g.t0 > 26 && n.reb <= 1) I.terminarGuerra(E, 'gobierno');
      else if (E.fecha.t - g.t0 > 260) I.terminarGuerra(E, 'cese');
    },
    terminarGuerra(E, res) {
      const g = I.asegurar(E).guerra, r = R(E); if (!g) return; g.activa = false; g.res = res; g.fin = E.fecha.t;
      if (res === 'rebeldes') { noti(E, 'VICTORIA REBELDE: cae el régimen y los alzados toman el poder', 1, true); if (!C.Regimen.democratico(E)) C.Regimen.iniciarTransicion(E, 'la victoria de la rebelión', true); if (r.junta) r.junta.legit = 5; }
      else if (res === 'gobierno') { noti(E, 'El Gobierno aplasta la rebelión: termina la guerra civil', 0, true); if (r.junta) { r.junta.resistencia = cl(r.junta.resistencia - 25, 0, 100); r.junta.repres = cl(r.junta.repres + 15, 0, 100); } }
      else noti(E, 'Cese al fuego: las partes aceptan una tregua y negocian', 1, true);
    },
    /* ── Partido oficialista y elecciones controladas ── */
    fundarOficial(E) {
      const ins = I.asegurar(E); if (ins.oficial) return E.partidos[ins.oficial];
      const j = R(E).junta, hist = R(E).dictadura && R(E).dictadura.id === 'rojas';
      const nombre = hist ? 'Movimiento de Acción Nacional' : 'Movimiento Nacional de Regeneración', sigla = hist ? 'MAN' : 'MNR';
      const id = C.Partidos.idDisponible ? C.Partidos.idDisponible(E, sigla) : sigla;
      E.partidos[id] = { id, nombre, sigla, color: '#7A8B3A', lema: 'Orden, paz y progreso', eco: j ? 30 : 30, soc: 50, popularidad: 6, popBase: 6, cohesion: 80, estructura: 0.8, fuertes: {}, especial: false, fundado: U.anio(), futuro: false, postura: 'gobierno', oficial: true,
        facciones: [{ id: id + '-f0', nombre: 'Oficialistas', eco: 30, soc: 50, peso: 100, lider: null, relJ: 0 }], lider: null, militantes: 30000, finanzas: 3000, relJ: 0, hist: [] };
      const pols = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && (!p.cargo || p.cargo.tipo === 'aspirante')).sort(() => U.rf(-1, 1)).slice(0, 25); for (const p of pols) p.partido = id;
      ins.oficial = id; noti(E, `La junta funda el ${nombre} como partido oficial`, -1, true); return E.partidos[id];
    },
    eleccionesControladas(E) {
      const r = R(E), ins = I.asegurar(E), pid = I.fundarOficial(E).id;
      for (const p of Object.values(E.partidos)) if (!p.especial && !p.futuro && p.id !== pid && !p.proscrito && p.id !== E.jugador.partido && (p.popularidad > 5 || (p.postura === 'oposicion'))) C.Regimen.proscribir(E, p.id, 'régimen');
      E.partidos[pid].popularidad = 14; E.partidos[pid].popBase = 14; E.partidos[pid].estructura = 0.9;
      r.tipo = 'democradura'; r.elecciones = true; r.congreso = true; r.decreto = true; r.captura = { corte: 1, control: 1, reeleccion: 1 }; r.reeleccionLibre = true; r.libertad = Math.max(r.libertad, 45); r.desde = E.fecha.t;
      noti(E, 'La junta convoca «elecciones» con partidos proscritos y un oficialismo omnipresente: nace una democradura', -1, true); C.Regimen.anotar(E, 'La junta se convierte en una democradura con elecciones controladas');
    },
    /* ── Presos políticos y mártires ── */
    encarcelar(E, motivo) {
      const J = E.jugador; if (J.preso) return; const r = R(E);
      J.preso = { desde: E.fecha.t, fase: 'detenido', dur: U.ri(8, 14), motivo: motivo || 'conspiración contra el régimen', huelga: false, mart: 0 };
      noti(E, `${J.nombre.toUpperCase()} es DETENIDO por el régimen`, -1, true); if (C.CIDH) C.CIDH.registrar(E, 'detencion', { inst: 'junta', evid: 55, vis: true, resp: null });
      if (r.junta) r.junta.resistencia = cl(r.junta.resistencia + 4, 0, 100);
      if (!E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ins_preso'), { forzar: true });
    },
    liberar(E, como) { const J = E.jugador, p = J.preso; if (!p) return; J.preso = null; if (p.mart >= 2) { J.martir = true; C.Opinion.subirRec(E, 10); } noti(E, `${J.nombre} recupera la libertad (${como})`, 1, true); },
    turnoPreso(E) {
      const J = E.jugador, p = J.preso, r = R(E); if (!p) return;
      J.agenda.puntos = Math.min(J.agenda.puntos, 1);
      if (Rg_dem(E)) { I.liberar(E, 'regresa la democracia'); return; }
      if (p.huelga) { J.salud = Math.max(10, (J.salud == null ? 85 : J.salud) - 1.5); p.mart += 0.05; if (r.junta) r.junta.resistencia = cl(r.junta.resistencia + 0.25, 0, 100); }
      p.dur--; if (p.dur > 0) return;
      if (p.fase === 'detenido') { p.fase = 'juicio'; p.dur = U.ri(10, 20); noti(E, `Comienza el juicio contra ${J.nombre} ante un tribunal militar`, -1); }
      else if (p.fase === 'juicio') {
        const j = r.junta, q = j ? cl(0.35 + (j.resistencia - 40) / 200 + (C.Poderes ? (C.Poderes.asegurar(E).actores.ong.afin - 50) / 400 : 0), 0.1, 0.8) : 0.5;
        if (U.chance(q)) { I.liberar(E, 'absuelto por la presión nacional e internacional'); return; }
        p.fase = 'condenado'; p.dur = U.ri(40, 90); p.mart += 1; noti(E, `${J.nombre} es CONDENADO a prisión: la oposición lo declara preso político`, -1, true); C.Opinion.subirRec(E, 3); if (r.junta) r.junta.resistencia = cl(r.junta.resistencia + 6, 0, 100);
      } else if (p.fase === 'condenado') I.liberar(E, 'indulto de la junta tras cumplir parte de la pena');
    },
    /* ── Exilio con vida propia ── */
    exiliar(E, pais) {
      const ins = I.asegurar(E); if (ins.exilio) return;
      const J = E.jugador; J.preso = null; const ps = ['USA', 'ESP', 'FRA', 'MEX', 'CRI', 'VEN', 'ARG'].filter(x => E.diplomacia.paises[x]);
      ins.exilio = { pais: pais || U.pick(ps), desde: E.fecha.t, red: 5, fondos: 0 }; J.riesgoJudicial = 0;
      noti(E, `${J.nombre} se exilia en ${(C.Diplomacia.pais(ins.exilio.pais) || { nombre: ins.exilio.pais }).nombre}`, -1, true);
    },
    regresar(E, via) {
      const ins = I.asegurar(E), ex = ins.exilio; if (!ex) return null; const J = E.jugador; ins.exilio = null; R(E).exilio = false;
      if (via === 'clandestino' && U.chance(0.3)) { I.encarcelar(E, 'ingreso clandestino al país'); return 'Te descubren al entrar: acabas detenido'; }
      C.Opinion.subirRec(E, Math.min(8, 1 + ex.red / 12)); noti(E, `${J.nombre} regresa del exilio`, 1, true); return `Regresas al país tras ${E.fecha.t - ex.desde} semanas de exilio`;
    },
    turnoExilio(E) { const ex = I.asegurar(E).exilio; if (!ex) return; const J = E.jugador; J.agenda.puntos = Math.min(J.agenda.puntos, 2); ex.red = cl(ex.red + 0.05, 0, 100); if (Rg_dem(E) && !E.meta.presim && !E.eventos.pendientes.length && E.fecha.t - (ex.ult || -99) > 26) { ex.ult = E.fecha.t; C.Eventos.disparar(E, C.Eventos.plantilla('ins_regreso'), { forzar: true }); } },
    turno(E) {
      I.turnoSitio(E); I.turnoJuicio(E); I.turnoGuerra(E); I.turnoPreso(E); I.turnoExilio(E);
      const r = R(E), ins = I.asegurar(E), J = E.jugador, t = E.fecha.t;
      // detención automática del jugador opositor bajo un régimen de facto
      if (!E.meta.presim && !J.preso && !ins.exilio && !Rg_dem(E) && !jefe(E) && (J.riesgoJudicial || 0) >= 40 && (J.reconocimiento || 0) >= 10 && U.chance(0.012 * (J.riesgoJudicial / 50))) I.encarcelar(E);
      // guerra civil: resistencia al límite o violencia desbordada
      if (!E.meta.presim && !(ins.guerra && ins.guerra.activa) && r.junta && r.junta.resistencia >= 85 && r.junta.legit <= 30 && U.chance(0.01) && !r.dictadura) I.iniciarGuerra(E, 'la resistencia se levanta en armas contra la junta', 'npc');
      // las juntas NPC pueden «normalizarse» con elecciones controladas
      if (!E.meta.presim && r.junta && !jefe(E) && ['junta', 'autoritario'].includes(r.tipo) && !r.transicion && !r.dictadura && r.junta.legit > 55 && r.junta.resistencia < 30 && U.chance(0.004)) I.eleccionesControladas(E);
    },
    registrarAcciones() {
      const A = C.Acciones, pres = E => esPres(E) ? true : 'Sólo el Presidente';
      A.registrar({ id: 'declararEstadoSitio', nombre: 'Declarar el estado de sitio permanente', icono: '🚨', grupo: 'regimen', costo: 3,
        disponible(E) { const p = pres(E); if (p !== true) return p; return I.asegurar(E).sitio.activo ? 'Ya está vigente' : true; },
        ejecutar(E) { I.declararSitio(E, true); return { ok: true, msg: 'Declaras el estado de sitio: más seguridad, menos libertades; la Corte y el Congreso vigilan' }; } });
      A.registrar({ id: 'levantarEstadoSitio', nombre: 'Levantar el estado de sitio', icono: '🕊', grupo: 'regimen', costo: 1,
        disponible(E) { const p = pres(E); if (p !== true) return p; return I.asegurar(E).sitio.activo ? true : 'No hay estado de sitio'; },
        ejecutar(E) { I.levantarSitio(E, 'decisión del Gobierno'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 1, 3, 95); R(E).libertad = Math.min(90, R(E).libertad + 6); return { ok: true, msg: 'Restableces las garantías ciudadanas' }; } });
      A.registrar({ id: 'impulsarJuicio', nombre: 'Promover un juicio político al Presidente', icono: '⚖', grupo: 'regimen', costo: 3,
        disponible(E) { if (esPres(E)) return 'Eres el Presidente'; const J = E.jugador; if (!['senador', 'representante'].includes(J.cargo)) return 'Sólo congresistas pueden acusar al Presidente'; if (I.asegurar(E).juicio) return 'Ya hay un juicio en curso'; if (!R(E).congreso) return 'No hay Congreso'; return true; },
        ejecutar(E) { const j = I.abrirJuicio(E, 'indignidad por mala conducta', 'J'); return { ok: !!j, msg: 'Presentas la acusación en la Cámara: el proceso arranca' }; } });
      A.registrar({ id: 'defenderseJuicio', nombre: 'Defenderte del juicio político (cabildeo y mermelada)', icono: '🛡', grupo: 'regimen', costo: 2,
        disponible(E) { const p = pres(E); if (p !== true) return p; return I.asegurar(E).juicio ? true : 'No hay juicio en curso'; },
        ejecutar(E) { const j = I.asegurar(E).juicio; j.lobby = (j.lobby || 0) - 0.05; if (C.Corrupcion) C.Corrupcion.efectoEscandalo(E, 1); E.jugador.riesgoJudicial = cl((E.jugador.riesgoJudicial || 0) + 4, 0, 100); return { ok: true, msg: 'Repartes contratos y puestos entre los congresistas: baja el apoyo a la acusación, pero crece la sospecha' }; } });
      A.registrar({ id: 'disolverCongreso', nombre: 'Responder disolviendo el Congreso (autogolpe)', icono: '🧨', grupo: 'regimen', costo: 4,
        disponible(E) { const p = pres(E); if (p !== true) return p; return I.asegurar(E).juicio ? true : 'Sólo cuando el Congreso te juzga'; },
        ejecutar(E) { const j = I.asegurar(E).juicio; I.cerrarJuicio(E, j, 'disuelto'); return C.Acciones.ejecutar('autogolpeCongreso', {}); } });
      A.registrar({ id: 'promoverConstituyente', nombre: 'Promover una Asamblea Constituyente de iniciativa ciudadana', icono: '📜', grupo: 'participacion', costo: 3,
        disponible(E) { const h = C.Participacion.habilitado('consulta'); if (h !== true) return h; if (esPres(E)) return 'Siendo Gobierno, usa la consulta presidencial'; if (C.Participacion.activo(E, 'const:ciudadana')) return 'Ya hay una iniciativa en curso'; const u = E.participacion.ultimo['const:ciudadana']; return u != null && E.fecha.t - u < 150 ? 'Ya se intentó hace poco' : true; },
        ejecutar(E) { const m = C.Participacion.crear(E, { tipo: 'constituyente', clave: 'const:ciudadana', titulo: 'Asamblea Constituyente de iniciativa ciudadana', promotor: 'ciudadania' }); E.participacion.ultimo['const:ciudadana'] = E.fecha.t; C.Opinion.subirRec(E, 2); noti(E, `${E.jugador.nombre} lidera la iniciativa ciudadana para convocar una Asamblea Constituyente`, 0, true); return { ok: true, msg: 'La iniciativa llega al Senado: si prospera, el pueblo decidirá en las urnas' }; } });
      A.registrar({ id: 'alzarseEnArmas', nombre: 'Alzarte en armas contra el régimen', icono: '🪖', grupo: 'regimen', costo: 4,
        disponible(E) { if (Rg_dem(E)) return 'Hay democracia'; if (jefe(E)) return 'Eres el jefe del régimen'; const g = I.asegurar(E).guerra; return g && g.activa ? 'Ya hay una guerra civil' : (R(E).junta && R(E).junta.resistencia >= 50 ? true : 'La resistencia todavía no está madura'); },
        ejecutar(E) { const g = I.iniciarGuerra(E, `${E.jugador.nombre} se levanta en armas`, 'J'); E.jugador.riesgoJudicial = 100; return { ok: !!g, msg: 'Te alzas en armas: la guerra civil ha comenzado' }; } });
      A.registrar({ id: 'ofensivaCivil', nombre: 'Lanzar una ofensiva en un departamento', icono: '🎯', grupo: 'regimen', costo: 3,
        disponible(E, a) { const g = I.asegurar(E).guerra; if (!g || !g.activa) return 'No hay guerra civil'; if (!(jefe(E) || g.quien === 'J' || esPres(E))) return 'Sólo los jefes de los bandos'; return g.control[a.depto] ? true : 'Elige un departamento'; },
        ejecutar(E, a) { const g = I.asegurar(E).guerra, soyReb = g.quien === 'J' && !esPres(E), obj = soyReb ? 'reb' : 'gob'; const q = cl((soyReb ? g.fReb / (g.fReb + g.fGob) : g.fGob / (g.fReb + g.fGob)) + 0.1, 0.15, 0.85); if (g.control[a.depto] === obj) return { ok: true, exito: false, msg: 'Ese departamento ya está bajo tu control' }; if (U.chance(q)) { g.control[a.depto] = obj; g.hist.unshift(`${soyReb ? 'Los rebeldes toman' : 'El Gobierno recupera'} ${nomDep(a.depto)}`); return { ok: true, msg: `Tu ofensiva triunfa: ${nomDep(a.depto)} cambia de manos` }; } if (C.CIDH) C.CIDH.registrar(E, 'masacre', { inst: soyReb ? 'ejercito' : 'junta', resp: jefe(E) ? 'J' : null, evid: 35 }); return { ok: true, exito: false, msg: 'La ofensiva fracasa con muchas bajas' }; } });
      A.registrar({ id: 'ceseFuegoCivil', nombre: 'Proponer un cese al fuego y una mesa de transición', icono: '🏳', grupo: 'regimen', costo: 2,
        disponible(E) { const g = I.asegurar(E).guerra; return g && g.activa ? true : 'No hay guerra civil'; },
        ejecutar(E) { const g = I.asegurar(E).guerra; if (U.chance(0.4 + (g.fReb / (g.fReb + g.fGob)) * 0.3)) { I.terminarGuerra(E, 'cese'); if (!Rg_dem(E) && !R(E).transicion) C.Regimen.iniciarTransicion(E, 'el cese al fuego', true); return { ok: true, msg: 'Las partes aceptan la tregua y se abre una mesa de transición' }; } return { ok: true, exito: false, msg: 'Tu oferta es rechazada: los combates continúan' }; } });
      A.registrar({ id: 'fundarPartidoOficial', nombre: 'Fundar el partido oficial del régimen', icono: '🏴', grupo: 'regimen', costo: 3,
        disponible(E) { return jefe(E) ? (I.asegurar(E).oficial ? 'Ya existe' : true) : 'Sólo el jefe de la junta'; },
        ejecutar(E) { const pa = I.fundarOficial(E); return { ok: true, msg: `Nace el ${pa.nombre}: el régimen ya tiene su maquinaria política` }; } });
      A.registrar({ id: 'eleccionesControladas', nombre: 'Convocar «elecciones» controladas (democradura)', icono: '🗳', grupo: 'regimen', costo: 3,
        disponible(E) { return jefe(E) && ['junta', 'autoritario'].includes(R(E).tipo) ? true : 'Sólo el jefe de un régimen de facto'; },
        ejecutar(E) { I.eleccionesControladas(E); return { ok: true, msg: 'Convocas elecciones con los opositores proscritos: tu partido arrasará, pero la OEA y la prensa lo notarán' }; } });
      A.registrar({ id: 'huelgaDeHambre', nombre: 'Declararte en huelga de hambre', icono: '🥣', grupo: 'regimen', costo: 1,
        disponible(E) { const p = E.jugador.preso; return p ? (p.huelga ? 'Ya estás en huelga' : true) : 'No estás preso'; },
        ejecutar(E) { const p = E.jugador.preso; p.huelga = true; p.mart += 0.5; C.Opinion.subirRec(E, 2); return { ok: true, msg: 'Tu huelga de hambre conmueve al país y desgasta al régimen, a costa de tu salud' }; } });
      A.registrar({ id: 'fugarsePrision', nombre: 'Intentar fugarte', icono: '🏃', grupo: 'regimen', costo: 2,
        disponible(E) { return E.jugador.preso ? true : 'No estás preso'; },
        ejecutar(E) { const j = R(E).junta, q = cl(0.18 + (j ? j.resistencia / 250 : 0), 0.1, 0.5); if (U.chance(q)) { E.jugador.preso = null; I.exiliar(E); return { ok: true, msg: 'Logras huir con ayuda de la resistencia: sales del país' }; } E.jugador.preso.dur += 20; E.jugador.riesgoJudicial = 100; return { ok: true, exito: false, msg: 'Frustran tu fuga: te trasladan a una celda de máxima seguridad' }; } });
      A.registrar({ id: 'pedirAsilo', nombre: 'Pedir asilo diplomático', icono: '🛂', grupo: 'regimen', costo: 2,
        disponible(E, a) { if (Rg_dem(E)) return 'Hay democracia'; if (I.asegurar(E).exilio) return 'Ya estás en el exilio'; return a.pais && E.diplomacia.paises[a.pais] ? true : 'Elige el país'; },
        ejecutar(E, a) { const st = E.diplomacia.paises[a.pais]; if (U.chance(cl(0.35 + (st.relacion - 40) / 120, 0.15, 0.9))) { I.exiliar(E, a.pais); return { ok: true, msg: `${(C.Diplomacia.pais(a.pais) || { nombre: a.pais }).nombre} te concede asilo` }; } return { ok: true, exito: false, msg: 'La embajada rechaza tu solicitud' }; } });
      A.registrar({ id: 'organizarDesdeExilio', nombre: 'Organizar la resistencia desde el exilio', icono: '📡', grupo: 'regimen', costo: 2,
        disponible(E) { return I.asegurar(E).exilio ? true : 'No estás en el exilio'; },
        ejecutar(E) { const ex = I.asegurar(E).exilio, j = R(E).junta; ex.red = cl(ex.red + 7, 0, 100); if (j) { j.resistencia = cl(j.resistencia + 3 + ex.red / 25, 0, 100); j.aislamiento = cl(j.aislamiento + 1.5, 0, 100); } C.Opinion.subirRec(E, 1); return { ok: true, msg: 'Conferencias, cartas a gobiernos y una red clandestina: la resistencia no está sola' }; } });
      A.registrar({ id: 'regresarDelExilio', nombre: 'Regresar al país', icono: '🛬', grupo: 'regimen', costo: 2,
        disponible(E) { return I.asegurar(E).exilio ? true : 'No estás en el exilio'; },
        ejecutar(E) { return { ok: true, msg: I.regresar(E, Rg_dem(E) ? 'legal' : 'clandestino') }; } });
    }
  };
  function Rg_dem(E) { return C.Regimen.democratico(E); }
  C.Ins = I; C.Tiempo.registrar('ins', I, 75); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Ins'); I.registrarAcciones();
  // al regresar la democracia se levantan el estado de sitio, la guerra y el exilio
  C.Bus.on('regimen:democracia', () => { const E = C.E, ins = I.asegurar(E); if (ins.sitio.activo) I.levantarSitio(E, 'regresa la democracia'); if (ins.guerra && ins.guerra.activa) I.terminarGuerra(E, 'cese'); ins.oficial = null; });
  C.Bus.on('accion', d => { if (d && d.id === 'exiliarse') { const E = C.E; I.exiliar(E); } });
  // el estado de sitio da poderes de decreto
  const pd = C.Regimen.poderDecreto; C.Regimen.poderDecreto = function (E) { return pd.call(C.Regimen, E) || !!(E.ins && E.ins.sitio && E.ins.sitio.activo); };
  // eventos
  const ef = o => E => C.Pais.ef(E, o);
  C.DATA.eventos = (C.DATA.eventos || []).concat([
    { id: 'ins_prorroga', tipo: 'institucional', icono: '🚨', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Prórroga del estado de sitio ({n})', texto: 'Se vence el plazo de la conmoción interior. La Corte vigila y el Senado debe autorizar la prórroga.', opciones: [
      { t: 'Pedir la prórroga al Senado', fn: E => { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.5, 3, 95); return C.Pais.ef(E, { rec: 0.3 }); } },
      { t: 'Prorrogarla por decreto y desafiar a la Corte', fn: E => { if (E.corte) E.corte.tension = cl(E.corte.tension + 15, 0, 100); R(E).libertad = Math.max(8, R(E).libertad - 4); return C.Pais.ef(E, { honestidad: -3 }); } },
      { t: 'Levantar el estado de sitio', fn: E => { I.levantarSitio(E, 'se vence el plazo'); return C.Pais.ef(E, { honestidad: 2, rec: 1 }); } }] },
    { id: 'ins_juicio', tipo: 'institucional', icono: '⚖', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Juicio político en tu contra', texto: 'La Cámara de Representantes abre un proceso para destituirte por {motivo}. Los votos están contados.', opciones: [
      { t: 'Dar la cara: defenderte ante el Senado', fn: E => { const j = I.asegurar(E).juicio; if (j) j.lobby -= 0.03; return C.Pais.ef(E, { honestidad: 2, rec: 1.5 }); } },
      { t: 'Negociar: contratos y puestos a cambio de votos', fn: E => { const j = I.asegurar(E).juicio; if (j) j.lobby -= 0.08; E.jugador.riesgoJudicial = cl((E.jugador.riesgoJudicial || 0) + 6, 0, 100); return C.Pais.ef(E, { honestidad: -4 }); } },
      { t: 'Denunciar un «golpe parlamentario» y movilizar a tus bases', fn: E => { const j = I.asegurar(E).juicio; if (j) j.lobby -= 0.04; E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 2, 3, 95); return C.Pais.ef(E, { rec: 2 }); } }] },
    { id: 'ins_preso', tipo: 'institucional', icono: '⛓', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Estás detenido', texto: 'Te llevan a un calabozo sin orden judicial. Te ofrecen un trato: firmar una carta de arrepentimiento y salir.', opciones: [
      { t: 'Negarte y resistir en prisión', fn: E => { if (E.jugador.preso) E.jugador.preso.mart += 1; return C.Pais.ef(E, { honestidad: 3, rec: 3 }); } },
      { t: 'Firmar la carta y salir', fn: E => { I.liberar(E, 'tras firmar una carta de arrepentimiento'); return C.Pais.ef(E, { honestidad: -8, rec: -2 }); } },
      { t: 'Pedir ayuda a organismos internacionales', fn: E => { if (C.CIDH) C.CIDH.registrar(E, 'persecucion', { inst: 'junta', evid: 60, vis: true }); const p = E.jugador.preso; if (p) p.dur += 4; return C.Pais.ef(E, { rec: 2 }); } }] },
    { id: 'ins_regreso', tipo: 'institucional', icono: '🛬', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Regresa la democracia: ¿vuelves?', texto: 'Cayó el régimen y se abre el país. Tus compañeros te esperan para reconstruir la política.', opciones: [
      { t: 'Regresar y encabezar la transición', fn: E => I.regresar(E, 'legal') || '' }, { t: 'Seguir fuera un tiempo', fn: E => C.Pais.ef(E, { rec: -1 }) }] }
  ]);
})(window.CURUL);
