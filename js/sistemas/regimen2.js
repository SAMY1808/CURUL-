/* Régimen político II (Fase 42): dictaduras históricas con guion (Rojas Pinilla), época de golpes, partidos que
   presionan por un golpe, manifestaciones, proscripción de partidos, exilio de opositores y más herramientas
   de las juntas. Extiende C.Regimen. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, Rg = C.Regimen, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const juntaJ = E => { const r = Rg.asegurar(E); return r.junta && esPres(E) && r.junta.lider === 'J' ? r.junta : null; };
  const noti = (E, txt, tono, jug) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'gobierno', titular: txt, tono: tono || 0, importante: true, jugador: !!jug }); };
  const elegibles = E => Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.id !== 'IND' && p.id !== 'MOV');
  const MARCHAS = {
    contra: ['Marcha contra el Gobierno', '📣', 2], democracia: ['Marcha por la democracia', '🕊', 2], apoyo: ['Marcha de apoyo al Gobierno', '🇨🇴', 2],
    cacerolazo: ['Cacerolazo nacional', '🥁', 1], estudiantil: ['Marcha estudiantil', '🎓', 2], huelga: ['Huelga general (paro cívico)', '✊', 3]
  };
  Object.assign(Rg, {
    MARCHAS,
    /* En 1900-1957 los golpes eran más frecuentes que hoy; en las décadas de la Guerra Fría, algo más. */
    eraFactor(E) { const a = U.anio(); return a < 1958 ? 1.8 : a < 1991 ? 1.3 : 0.8; },
    /* ── Dictaduras históricas con guion ── */
    histTurno(E) {
      const r = Rg.asegurar(E), T = C.DATA.dictaduraT; r.hs = r.hs || {};
      for (const D of C.DATA.dictaduras || []) {
        const st = r.hs[D.id] || (r.hs[D.id] = { estado: 'espera', hechos: {} });
        if (st.estado === 'cancelada' || st.estado === 'fin') continue;
        const ti = T(...D.inicio), tf = T(...D.fin), t = E.fecha.t;
        if (t < ti) continue;
        if (st.estado === 'espera') {
          if (t >= tf || !Rg.democratico(E)) { st.estado = t >= tf ? 'fin' : 'cancelada'; continue; }
          st.estado = 'activa'; st.catchup = t - ti > 4;
          if (st.catchup) Rg.golpe(E, null, 'cuartelazo', D.id, true); else Rg.golpeHistorico(E, D);
          if (!r.dictadura && !r.golpeHist) { st.estado = 'cancelada'; continue; }
        }
        if (r.golpeHist === D.id) continue;                       // el jugador (presidente) todavía decide si resiste
        if (!r.dictadura || r.dictadura.id !== D.id) { st.estado = 'fin'; continue; }
        D.guion.forEach((g, i) => {
          const tg = T(...g.f); if (st.hechos[i] || t < tg) return; st.hechos[i] = true;
          try { if (g.est) g.est(E); if (g.fn && t - tg <= 3 && !E.meta.presim) g.fn(E); } catch (e) { console.error('[Regimen] guion', D.id, i, e); }
        });
        if (t >= tf && !r.dictadura) st.estado = 'fin';
      }
    },
    golpeHistorico(E, D) {
      const r = Rg.asegurar(E);
      if (esPres(E)) { r.golpeHist = D.id; r.pendienteGolpe = D.prob / 100; C.Eventos.disparar(E, C.Eventos.plantilla('rg_golpe_presidente'), { forzar: true, vars: { prob: D.prob } }); }
      else Rg.golpe(E, null, 'cuartelazo', D.id);
    },
    /* ── Vida del régimen y de la oposición ── */
    turnoExtra(E) {
      const r = Rg.asegurar(E), t = E.fecha.t;
      Rg.histTurno(E);
      r.golpistas = (r.golpistas || []).filter(g => t - g.t < 80 && E.partidos[g.pid]);
      if (Rg.democratico(E)) {
        const R = r.riesgo || 0;
        if (R > 32 && r.golpistas.length < 2 && U.chance(0.004 * Math.pow(R / 40, 2) * Rg.eraFactor(E))) {
          const c = elegibles(E).filter(p => p.id !== E.gobierno.partido && !r.golpistas.some(g => g.pid === p.id));
          if (c.length) {
            const pa = U.pesado(c, p => Math.abs(p.eco) / 40 + Math.abs(p.soc) / 40 + (p.postura === 'oposicion' ? 1.5 : 0.3) + 0.3);
            r.golpistas.push({ pid: pa.id, t }); Rg.anotar(E, `${pa.nombre} presiona a los cuarteles por un golpe`);
            noti(E, `Escándalo: dirigentes del ${pa.nombre} tocan a las puertas de los cuarteles pidiendo «una salida de fuerza»`, -1, esPres(E));
            if (pa.id === E.jugador.partido && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('rg_partido_golpista'), { forzar: true });
          }
        }
        return;
      }
      const j = r.junta; if (!j) return;
      const jefe = juntaJ(E);
      if (!jefe && j.repres >= 40 && elegibles(E).length >= 3 && U.chance(0.006)) {
        const c = elegibles(E).filter(p => !p.proscrito && p.popularidad >= 1.5);
        if (c.length) { const pa = U.pesado(c, p => Math.abs(p.eco - 40) / 30 + (p.postura === 'oposicion' ? 1.5 : 0.4) + 0.2); Rg.proscribir(E, pa.id, 'régimen'); if (pa.id === E.jugador.partido && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('rg_proscrito_j'), { forzar: true }); }
      }
      if (!E.meta.presim && U.chance(0.03 * (0.4 + j.resistencia / 60)) && !E.eventos.pendientes.length && !r.dictadura) Rg.marchaNPC(E);
      if (!r.dictadura && !r.transicion && !jefe && j.resistencia >= 88 && j.legit <= 30 && U.chance(0.05)) Rg.iniciarTransicion(E, 'la presión de las calles y el derrumbe de la junta');
    },
    marchaNPC(E) {
      const r = Rg.asegurar(E), j = r.junta; if (!j) return;
      const tam = U.ri(20, 80), rep = U.chance(j.repres / 130);
      j.resistencia = cl(j.resistencia + tam * 0.03 + (rep ? tam * 0.04 : 0), 0, 100); if (rep) { j.legit = cl(j.legit - tam * 0.03, 0, 100); }
      noti(E, rep ? `La policía disuelve a bala una marcha contra la junta: hay heridos y detenidos` : `Multitudinaria marcha contra la junta: miles piden elecciones`, rep ? -1 : 1);
    },
    /* ── Proscripción de partidos ── */
    puedeProscribir(E) { const r = Rg.asegurar(E); return esPres(E) && r.tipo !== 'democracia' && Rg.poderDecreto(E) ? true : 'Sólo un régimen no democrático puede proscribir partidos'; },
    proscribir(E, pid, quien) {
      const r = Rg.asegurar(E), pa = E.partidos[pid]; if (!pa || pa.proscrito) return false;
      pa.proscrito = true; pa.proscritoDesde = E.fecha.t; r.proscritos = (r.proscritos || []).concat([pid]);
      if (r.junta) { r.junta.resistencia = cl(r.junta.resistencia + 5, 0, 100); r.junta.aislamiento = cl(r.junta.aislamiento + 3, 0, 100); }
      if (C.Poderes) C.Poderes.mover(E, 'ong', -8);
      r.libertad = Math.max(5, r.libertad - 6);
      Rg.anotar(E, `Proscriben al ${pa.nombre}`);
      noti(E, `PROSCRITO: el régimen ilegaliza al ${pa.nombre} y le prohíbe presentar candidatos`, -1, pid === E.jugador.partido);
      return true;
    },
    levantarProscripcion(E, pid, silencioso) {
      const r = Rg.asegurar(E), pa = E.partidos[pid]; if (!pa || !pa.proscrito) return false;
      pa.proscrito = false; r.proscritos = (r.proscritos || []).filter(x => x !== pid);
      if (!silencioso) noti(E, `El ${pa.nombre} recupera su personería jurídica`, 1);
      return true;
    },
    levantarTodas(E, silencioso) { const r = Rg.asegurar(E); const l = (r.proscritos || []).slice(); l.forEach(p => Rg.levantarProscripcion(E, p, true)); if (l.length && !silencioso) noti(E, 'Se levantan todas las proscripciones de partidos', 1); if (l.length && silencioso) Rg.anotar(E, 'Se levantan las proscripciones y los partidos vuelven a la legalidad'); },
    /* ── Exilio de opositores ── */
    exiliarOpositores(E, n) {
      const r = Rg.asegurar(E), P = C.Politicos, gp = E.gobierno.partido;
      const c = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.partido !== gp && !(p.cargo && ['presidente', 'senador', 'representante', 'ministro'].includes(p.cargo.tipo)) && p.r && p.r.amb > 20);
      const out = []; r.exiliados = r.exiliados || [];
      for (let i = 0; i < n && c.length; i++) { const p = U.pesado(c, x => 1 + x.fuerza / 40 + ((E.partidos[x.partido] || {}).proscrito ? 3 : 0)); c.splice(c.indexOf(p), 1); p.activo = false; p.exiliado = true; P.anotar(p, 'Es perseguido y se exilia'); r.exiliados.push(p.id); out.push(p.nombre); }
      return out;
    },
    regresarExiliados(E) { const r = Rg.asegurar(E); for (const id of r.exiliados || []) { const p = E.politicos[id]; if (p) { p.activo = true; p.exiliado = false; C.Politicos.anotar(p, 'Regresa del exilio'); } } r.exiliados = []; },
    /* ── Manifestaciones ── */
    fuerzaMarcha(E, tipo) {
      const J = E.jugador, pa = E.partidos[J.partido], M = C.Movilizacion;
      let f = (J.reconocimiento || 0) * 0.55 + (J.redes || 0) * 0.3 + (pa ? pa.popularidad * 1.2 : 0);
      if (tipo === 'estudiantil' && M) f += M.actor(E, 'estudiantil').descontento * 0.3;
      if (tipo === 'huelga' && M) f += M.actor(E, 'cut').descontento * 0.35;
      if (tipo === 'contra' || tipo === 'democracia' || tipo === 'huelga') f += (50 - E.opinion.aprobacionPres) * 0.25;
      return f;
    },
    marcha(E, tipo) {
      const r = Rg.asegurar(E), J = E.jugador, j = r.junta, dem = Rg.democratico(E), M = MARCHAS[tipo], jefe = juntaJ(E);
      const tam = cl(Rg.fuerzaMarcha(E, tipo) + U.gauss(0, 7), 4, 100); r.ultMarcha = E.fecha.t;
      const personas = Math.round(tam * U.ri(900, 1500) / 10) * 10, nombre = M[0].toLowerCase();
      const k = tipo === 'huelga' ? 1.5 : tipo === 'estudiantil' ? 1.25 : tipo === 'cacerolazo' ? 0.7 : 1;
      let msg = `${M[1]} Tu ${nombre} reúne a unas ${personas.toLocaleString('es-CO')} personas`;
      C.Opinion.subirRec(E, tam * 0.03);
      if (tipo === 'apoyo') { if (jefe) { jefe.legit = cl(jefe.legit + tam * 0.06, 0, 100); } else E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + tam * 0.05, 3, 95); return msg + ': el Gobierno sale fortalecido'; }
      if (!j || dem) {
        // régimen democrático (o democradura sin junta): presión sobre la aprobación
        if (tipo === 'democracia') { r.blindaje = Math.min(40, r.blindaje + tam * 0.04); msg += ': la ciudadanía arropa a las instituciones y se aleja el fantasma del golpe'; }
        else { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - tam * 0.05 * k, 3, 95); if (tipo === 'huelga') E.economia.confianza = cl(E.economia.confianza - 1.5, 5, 95); msg += `: el Gobierno pierde ${U.d1(tam * 0.05 * k)} puntos de aprobación`; }
        if (r.tipo === 'democradura' && U.chance(0.3)) { J.riesgoJudicial = cl((J.riesgoJudicial || 0) + 6, 0, 100); msg += ' · la Fiscalía abre una investigación contra los convocantes'; }
        if (C.Movilizacion && (tipo === 'estudiantil' || tipo === 'huelga')) { const a = C.Movilizacion.actor(E, tipo === 'huelga' ? 'cut' : 'estudiantil'); a.descontento = cl(a.descontento + tam * 0.1, 0, 100); }
        return msg;
      }
      // bajo una junta o régimen autoritario
      const pRep = cl(j.repres / 100 * 0.9 + (100 - r.libertad) / 300, 0.05, 0.9) * (tipo === 'cacerolazo' ? 0.4 : 1);
      j.resistencia = cl(j.resistencia + tam * 0.16 * k, 0, 100); j.legit = cl(j.legit - tam * 0.05 * k, 0, 100);
      if (U.chance(pRep)) {
        j.resistencia = cl(j.resistencia + tam * 0.08, 0, 100); j.legit = cl(j.legit - tam * 0.06, 0, 100); j.aislamiento = cl(j.aislamiento + 3, 0, 100);
        J.riesgoJudicial = cl((J.riesgoJudicial || 0) + 8, 0, 100); if (C.Poderes) C.Poderes.mover(E, 'ong', 3);
        msg += ': la fuerza pública la reprime a bala; hay muertos y detenidos, y la indignación crece';
        noti(E, `Represión sangrienta de una ${nombre} contra la junta`, -1, true);
      } else msg += ': la junta no se atreve a reprimirla y su legitimidad se resiente';
      if (!r.dictadura && !r.transicion && j.resistencia >= 88 && j.legit <= 30 && tipo === 'huelga') { Rg.iniciarTransicion(E, 'una huelga general que paraliza el país'); msg += ' · LA JUNTA CEDE y abre la transición'; }
      return msg;
    },
    registrarAcciones2() {
      const A = C.Acciones;
      A.registrar({ id: 'convocarManifestacion', nombre: 'Convocar una manifestación', icono: '📣', grupo: 'regimen', costo: (E, a) => (MARCHAS[a && a.tipo] || [0, 0, 2])[2],
        disponible(E, a) {
          const M = MARCHAS[a.tipo]; if (!M) return 'Elige el tipo de manifestación'; const r = Rg.asegurar(E);
          if (E.fecha.t - (r.ultMarcha == null ? -99 : r.ultMarcha) < 3) return 'Acabas de convocar otra: espera unas semanas';
          if (esPres(E)) return a.tipo === 'apoyo' ? true : 'Desde el Gobierno sólo convocas marchas de apoyo';
          if (a.tipo === 'apoyo') return E.jugador.partido && E.jugador.partido === E.gobierno.partido ? true : 'Sólo el Gobierno y su partido convocan marchas de apoyo';
          if (a.tipo === 'democracia' && Rg.democratico(E) && r.tipo !== 'democradura' && (r.riesgo || 0) < 35) return 'La democracia no está amenazada por ahora';
          return true;
        },
        ejecutar(E, a) { return { ok: true, msg: Rg.marcha(E, a.tipo) }; } });
      A.registrar({ id: 'presionarGolpe', nombre: 'Pedir a tu partido que presione por un golpe', icono: '🕯', grupo: 'regimen', costo: 3,
        disponible(E) { const r = Rg.asegurar(E), J = E.jugador; if (!Rg.democratico(E)) return 'Ya no hay democracia que derrocar'; if (esPres(E)) return 'Eres el Presidente: usa el autogolpe'; if (!J.partido || J.partido === 'MOV' || !E.partidos[J.partido]) return 'Necesitas un partido'; return (r.golpistas || []).some(g => g.pid === J.partido) ? 'Tu partido ya presiona a los cuarteles' : true; },
        ejecutar(E) { const r = Rg.asegurar(E), J = E.jugador; r.golpistas = (r.golpistas || []).concat([{ pid: J.partido, t: E.fecha.t, jugador: true }]); if (C.Poderes) C.Poderes.mover(E, 'militares', 5); J.rep.honestidad = cl(J.rep.honestidad - 4, 0, 100); let extra = ''; if (U.chance(0.35)) { C.Pais.ef(E, { escandalo: 'Tu partido toca a las puertas de los cuarteles' }); extra = ' (pero la noticia se filtra: escándalo)'; } return { ok: true, msg: `Tu partido empieza a tocar las puertas de los cuarteles: el riesgo de golpe sube${extra}` }; } });
      const selP = (E, a) => E.partidos[a.partido];
      A.registrar({ id: 'proscribirPartido', nombre: 'Proscribir un partido', icono: '🚫', grupo: 'regimen', costo: 3,
        disponible(E, a) { const ok = Rg.puedeProscribir(E); if (ok !== true) return ok; const pa = selP(E, a); if (!pa) return 'Elige el partido'; if (pa.proscrito) return 'Ya está proscrito'; if (pa.id === E.jugador.partido) return 'No puedes proscribir a tu propio partido'; return true; },
        ejecutar(E, a) { Rg.proscribir(E, a.partido, 'jefe'); const r = Rg.asegurar(E); if (r.junta) { r.junta.repres = cl(r.junta.repres + 4, 0, 100); } return { ok: true, msg: `Proscribes al ${E.partidos[a.partido].nombre}: no podrá presentar candidatos` }; } });
      A.registrar({ id: 'levantarProscripcion', nombre: 'Levantar la proscripción de un partido', icono: '🔓', grupo: 'regimen', costo: 1,
        disponible(E, a) { if (!esPres(E)) return 'Sólo quien gobierna'; const pa = selP(E, a); return pa && pa.proscrito ? true : 'Elige un partido proscrito'; },
        ejecutar(E, a) { Rg.levantarProscripcion(E, a.partido); const j = Rg.asegurar(E).junta; if (j) { j.resistencia = cl(j.resistencia - 4, 0, 100); j.legit = cl(j.legit + 2, 0, 100); } return { ok: true, msg: 'Se restituye la personería del partido' }; } });
      A.registrar({ id: 'perseguirOpositores', nombre: 'Perseguir y desterrar a los opositores', icono: '⛓', grupo: 'regimen', costo: 2,
        disponible(E) { return juntaJ(E) ? true : 'Sólo el jefe de la junta'; },
        ejecutar(E) { const j = juntaJ(E), n = Rg.exiliarOpositores(E, U.ri(3, 6)); j.repres = cl(j.repres + 7, 0, 100); j.resistencia = cl(j.resistencia - 4, 0, 100); j.aislamiento = cl(j.aislamiento + 3, 0, 100); if (C.Poderes) C.Poderes.mover(E, 'ong', -6); return { ok: true, msg: n.length ? `Destierras o encarcelas a ${n.length} dirigentes (${n.slice(0, 2).join(', ')}…): la oposición se descabeza, pero crece el rechazo internacional` : 'No quedan opositores a quienes perseguir' }; } });
      A.registrar({ id: 'propagandaJunta', nombre: 'Propaganda oficial: culto al jefe', icono: '📺', grupo: 'regimen', costo: 1,
        disponible(E) { const r = Rg.asegurar(E); return juntaJ(E) ? (E.fecha.t - (r.ultProp == null ? -99 : r.ultProp) < 4 ? 'Ya hiciste propaganda esta semana' : true) : 'Sólo el jefe de la junta'; },
        ejecutar(E) { const j = juntaJ(E), r = Rg.asegurar(E); r.ultProp = E.fecha.t; j.legit = cl(j.legit + 3 + j.censura / 40, 0, 100); j.aislamiento = cl(j.aislamiento + 1, 0, 100); return { ok: true, msg: 'Cadena nacional, himnos y retratos oficiales: la legitimidad sube un poco' }; } });
      A.registrar({ id: 'obraPopulista', nombre: 'Obra faraónica y subsidios populares', icono: '🏗', grupo: 'regimen', costo: 2,
        disponible(E) { return juntaJ(E) ? true : 'Sólo el jefe de la junta'; },
        ejecutar(E) { const j = juntaJ(E); j.legit = cl(j.legit + 6, 0, 100); j.resistencia = cl(j.resistencia - 3, 0, 100); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.8), p: 'm' }], 'regimen'); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 3, 3, 95); return { ok: true, msg: 'Inauguras obras y repartes subsidios: el pueblo aplaude, pero el déficit sube' }; } });
      A.registrar({ id: 'constituyenteJunta', nombre: 'Convocar una Constituyente a tu medida', icono: '📜', grupo: 'regimen', costo: 3,
        disponible(E) { const r = Rg.asegurar(E); return juntaJ(E) ? (r.constituyente ? 'Ya tienes tu Constituyente' : true) : 'Sólo el jefe de la junta'; },
        ejecutar(E) { const r = Rg.asegurar(E), j = juntaJ(E), p = cl(0.35 + j.legit / 150, 0.2, 0.85);
          if (U.chance(p)) { r.constituyente = true; E.constitucion.articulos.reeleccion = 'permitida'; r.reeleccionLibre = true; j.legit = cl(j.legit - 3, 0, 100); r.libertad = Math.max(5, r.libertad - 5); if (r.tipo === 'junta') r.tipo = 'autoritario'; Rg.anotar(E, 'Una Asamblea Constituyente nombrada a dedo institucionaliza el régimen'); noti(E, 'Una Constituyente nombrada por la junta redacta una nueva carta a su medida y permite la reelección indefinida', -1, true); return { ok: true, msg: `La Constituyente (${Math.round(p * 100)} %) institucionaliza tu régimen y habilita tu reelección` }; }
          j.resistencia = cl(j.resistencia + 8, 0, 100); return { ok: true, exito: false, msg: `La maniobra (${Math.round(p * 100)} %) provoca un rechazo masivo: sube la resistencia` }; } });
    }
  });
  Rg.registrarAcciones2();
})(window.CURUL);
