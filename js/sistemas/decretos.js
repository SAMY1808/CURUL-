/* Decretos del Ejecutivo: (1) reglamentación de las leyes —una ley sancionada no produce efectos hasta que el Gobierno
   la reglamenta; si no lo hace en un año queda en «letra muerta» y sólo rinde una fracción— y (2) estados de excepción
   (conmoción interior y emergencia económica, social y ecológica): poderes extraordinarios por decreto con límite de
   tiempo, prórrogas, y revisión automática de la Corte Constitucional, que puede tumbar la declaratoria o cada decreto. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const SIN_REGLAM = ['presupuesto', 'nuevoministerio', 'ratificaciontratado'];
  const TIPOS = {
    conmocion: { n: 'Conmoción interior', icono: '🚨', dur: 13, max: 2, motivo: 'orden', txt: 'Hasta 90 días, prorrogable dos veces (la segunda con visto bueno del Senado). Para graves perturbaciones del orden público.' },
    emergencia: { n: 'Emergencia económica, social y ecológica', icono: '⚡', dur: 4, max: 1, motivo: 'econ', txt: 'Hasta 30 días, una prórroga. Para crisis económicas, sociales o desastres que desbordan lo ordinario. Máximo 90 días al año.' }
  };
  const DECRETOS = {
    toqueQueda: { t: 'conmocion', n: 'Toque de queda y restricciones de movilidad', icono: '🌙', ef: [{ v: 'seguridad', d: 2.2, p: 'i' }, { v: 'aprobacion', d: -0.6, p: 'i' }], riesgo: 0.08 },
    militarizar: { t: 'conmocion', n: 'Militarizar zonas críticas', icono: '🎖', ef: [{ v: 'seguridad', d: 3, p: 'm' }, { v: 'confianza', d: -0.4, p: 'm' }], riesgo: 0.16 },
    recompensas: { t: 'conmocion', n: 'Recompensas y red de cooperantes', icono: '💰', costo: 0.2, ef: [{ v: 'seguridad', d: 1.4, p: 'm' }], riesgo: 0.05 },
    impuestoGuerra: { t: 'conmocion', n: 'Impuesto de guerra temporal', icono: '🧾', costo: -1.6, ef: [{ v: 'aprobacion', d: -1.4, p: 'i' }, { v: 'inversion', d: -0.2, p: 'm' }], riesgo: 0.3 },
    suspenderDerechos: { t: 'conmocion', n: 'Suspender garantías de reunión y protesta', icono: '✋', ef: [{ v: 'seguridad', d: 1.8, p: 'i' }, { v: 'aprobacion', d: -1.2, p: 'm' }], riesgo: 0.42 },
    alivioDeudores: { t: 'emergencia', n: 'Alivio a deudores y congelación de cuotas', icono: '🪙', costo: 0.9, ef: [{ v: 'pobreza', d: -0.4, p: 'm' }, { v: 'aprobacion', d: 0.9, p: 'i' }], riesgo: 0.1 },
    recorteEmergencia: { t: 'emergencia', n: 'Recorte inmediato del gasto de funcionamiento', icono: '✂', costo: -1.2, ef: [{ v: 'confianza', d: 0.6, p: 'm' }, { v: 'aprobacion', d: -0.5, p: 'i' }], riesgo: 0.08 },
    impuestoPatrimonio: { t: 'emergencia', n: 'Impuesto extraordinario al patrimonio', icono: '🏦', costo: -2.2, ef: [{ v: 'inversion', d: -0.35, p: 'm' }, { v: 'aprobacion', d: -0.4, p: 'i' }], riesgo: 0.34 },
    subsidioEmergencia: { t: 'emergencia', n: 'Ingreso solidario de emergencia', icono: '🤲', costo: 2.0, ef: [{ v: 'pobreza', d: -0.7, p: 'm' }, { v: 'aprobacion', d: 1.8, p: 'i' }, { v: 'deficit', d: 0.2, p: 'm' }], riesgo: 0.12 },
    reformaLaboralDecreto: { t: 'emergencia', n: 'Modificar normas laborales por decreto', icono: '👷', ef: [{ v: 'desempleo', d: -0.4, p: 'm' }, { v: 'aprobacion', d: -1.0, p: 'm' }], riesgo: 0.48 }
  };
  const MOTIVOS = { orden: 'Orden público', econ: 'Crisis económica', desastre: 'Desastre natural', salud: 'Emergencia sanitaria' };
  const PLAZOS_MAX_ANIO = 13;

  const D = {
    TIPOS, DECRETOS, MOTIVOS,
    asegurar(E) {
      if (!E.decretos) E.decretos = { exc: null, hist: [], semanasAnio: { anio: U.anio(), n: 0 }, ultimaDeclaratoria: -999 };
      return E.decretos;
    },
    init(E) { E.decretos = null; D.asegurar(E); for (const p of Object.values(E.proyectos || {})) if (p.estado === 'ley' && !p.reglam) p.reglam = { estado: 'vigente', t0: E.fecha.t }; },
    migrar(E) { D.init(E); },
    esPres: E => E.gobierno.presidente === 'J',

    /* ── Reglamentación ───────────────────────────────────── */
    requiere: p => p.tipo !== 'acto' && !SIN_REGLAM.includes(p.plantilla) && !p.interno && (p.efectos && p.efectos.length || p.costo),
    /* Llamado al sancionar: devuelve true si retiene los efectos hasta reglamentar. */
    retener(E, p) {
      D.asegurar(E);
      if (!D.requiere(p)) { p.reglam = { estado: 'vigente', t0: E.fecha.t }; return false; }
      p.reglam = { estado: 'pendiente', t0: E.fecha.t, limite: E.fecha.t + 52, presion: 0, orden: null };
      if (p.gobierno || p.autor === 'J' || (p.coautores || []).includes('J')) C.Medios.noticia(E, { tipo: 'gobierno', titular: `La ley «${p.titulo}» espera su reglamentación por decreto`, tono: 0, ref: { proyecto: p.id }, jugador: p.autor === 'J' });
      return true;
    },
    pendientes: E => Object.values(E.proyectos).filter(p => p.estado === 'ley' && p.reglam && p.reglam.estado === 'pendiente'),
    aplicar(E, p, escala, modo) {
      const r = p.reglam; r.estado = escala >= 0.99 ? 'reglamentada' : 'restrictiva'; r.t1 = E.fecha.t; r.escala = escala; p.vigencia = E.fecha.t;
      C.Economia.programar(E, p.efectos, p.id, escala);
      if (p.costo) C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(p.costo), p: 'm' }], p.id, escala);
      C.Legislacion.hist(E, p, `El Gobierno reglamenta la ley${escala < 0.99 ? ' de forma restrictiva (' + Math.round(escala * 100) + ' % de sus alcances)' : ''}`, 'info');
      if (p.gobierno || p.autor === 'J') C.Medios.noticia(E, { tipo: 'gobierno', titular: `Se reglamenta la ley «${p.titulo}»`, tono: 1, ref: { proyecto: p.id }, jugador: p.autor === 'J' });
    },
    letraMuerta(E, p) {
      const r = p.reglam; r.estado = 'letraMuerta'; r.t1 = E.fecha.t; r.escala = 0.35; p.vigencia = E.fecha.t;
      C.Economia.programar(E, p.efectos, p.id, 0.35);
      C.Legislacion.hist(E, p, 'Pasa un año sin reglamentar: la ley queda en letra muerta (35 % de sus efectos)', 'negado');
      if (p.autor === 'J' || (p.coautores || []).includes('J')) { C.Opinion.subirRec(E, -2); C.Medios.noticia(E, { tipo: 'legislativo', titular: `«${p.titulo}», ley sin reglamentar: letra muerta`, tono: -1, ref: { proyecto: p.id }, jugador: true }); }
    },
    probNPC(E, p) {
      const pres = E.politicos[E.gobierno.presidente], r = p.reglam;
      const afin = pres ? 1 - U.distIdeo(pres, p) : 0.5;
      return U.clamp(0.025 + afin * 0.06 + (p.gobierno ? 0.08 : 0) + r.presion * 0.025 + (r.orden != null ? 1 : 0), 0.01, 0.45);
    },
    turnoReglam(E) {
      for (const p of D.pendientes(E)) {
        const r = p.reglam;
        if (r.orden != null && E.fecha.t >= r.orden) { D.aplicar(E, p, 1); continue; }
        if (E.fecha.t >= r.limite) { D.letraMuerta(E, p); continue; }
        if (!D.esPres(E) && U.chance(D.probNPC(E, p))) {
          const pres = E.politicos[E.gobierno.presidente], dist = pres ? U.distIdeo(pres, p) : 0.2;
          D.aplicar(E, p, dist > 0.42 && U.chance(0.55) ? 0.65 : 1);
        }
      }
    },

    /* ── Estados de excepción ─────────────────────────────── */
    gravedad(E) {
      const ds = Object.values(E.deptos), pob = U.suma(ds.map(d => d.poblacion)) || 1;
      const seg = U.suma(ds.map(d => d.seguridad * d.poblacion)) / pob, ec = E.economia;
      return {
        orden: U.clamp((62 - seg) * 2.4, 0, 100),
        econ: U.clamp((2 - ec.crecimiento) * 18 + (ec.desempleo - 9) * 5 + (ec.inflacion - 5) * 6 + (ec.deficit - 6) * 4, 0, 100),
        desastre: C.Riesgo && C.Riesgo.gravedad ? C.Riesgo.gravedad(E) : 0,
        salud: E.mundoeco && E.mundoeco.pandemia && E.mundoeco.pandemia.activa ? 70 : 0
      };
    },
    semanasUsadas(E) { const s = D.asegurar(E).semanasAnio; return s.anio === U.anio() ? s.n : 0; },
    activa: E => D.asegurar(E).exc,
    declarar(E, tipo, motivo, jugador) {
      const d = D.asegurar(E), T = TIPOS[tipo], g = D.gravedad(E)[motivo] || 0;
      const exc = { id: U.id('exc'), tipo, motivo, t0: E.fecha.t, fin: E.fecha.t + T.dur, prorrogas: 0, gravedad: Math.round(g), decretos: [], jugador: !!jugador, revision: E.fecha.t + U.ri(4, 8), estado: 'vigente' };
      d.exc = exc; d.ultimaDeclaratoria = E.fecha.t;
      const ra = U.clamp((g - 35) / 14, -3, 4); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + ra * (tipo === 'conmocion' ? 0.9 : 0.5), 3, 95);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno declara ${T.n.toLowerCase()} por ${MOTIVOS[motivo].toLowerCase()}`, tono: -1, importante: true, jugador: !!jugador });
      return exc;
    },
    riesgoDeclaratoria(E, exc) {
      const K = E.corte; if (!K) return 0.2;
      const base = 0.08 + (1 - U.clamp(exc.gravedad / 100, 0, 1)) * 0.55 + K.tension * 0.0025 + (C.Corte.activismoMedio(E) - 50) * 0.003 + (exc.demandado ? 0.12 : 0);
      return U.clamp(base - (exc.prorrogas ? 0 : 0), 0.03, 0.85);
    },
    decretar(E, id, jugador) {
      const exc = D.activa(E), def = DECRETOS[id]; if (!exc || !def || def.t !== exc.tipo) return null;
      const dec = { id: U.id('dc'), clave: id, t: E.fecha.t, estado: 'vigente', revision: E.fecha.t + U.ri(3, 9), jugador: !!jugador };
      exc.decretos.push(dec);
      C.Economia.programar(E, def.ef, 'exc:' + exc.id + ':' + dec.id);
      if (def.costo) C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(def.costo), p: 'm' }], 'exc:' + exc.id + ':' + dec.id);
      return dec;
    },
    anularDecreto(E, exc, dec) {
      E.economia.pendientes = E.economia.pendientes.filter(pe => pe.origen !== 'exc:' + exc.id + ':' + dec.id); dec.estado = 'inexequible';
    },
    terminar(E, motivo, caida) {
      const d = D.asegurar(E), exc = d.exc; if (!exc) return;
      exc.estado = caida ? 'inexequible' : 'terminada'; exc.t1 = E.fecha.t; exc.cierre = motivo;
      d.hist.unshift(exc); if (d.hist.length > 12) d.hist.length = 12; d.exc = null;
    },
    turno(E) {
      const d = D.asegurar(E), exc = d.exc;
      D.turnoReglam(E);
      if (d.semanasAnio.anio !== U.anio()) d.semanasAnio = { anio: U.anio(), n: 0 };
      if (exc) {
        d.semanasAnio.n++;
        const T = TIPOS[exc.tipo];
        if (exc.tipo === 'conmocion') for (const dep of Object.values(E.deptos)) dep.seguridad = U.clamp(dep.seguridad + 0.05, 1, 99);
        // Revisión automática de la Corte
        if (!exc.revisada && E.fecha.t >= exc.revision) {
          exc.revisada = true;
          const r = D.riesgoDeclaratoria(E, exc), cae = U.chance(r);
          C.Corte.registrarFallo(E, { tipo: 'excepcion', titulo: T.n, resultado: cae ? 'inexequible' : 'exequible', gobierno: true });
          if (cae) {
            for (const dec of exc.decretos) if (dec.estado === 'vigente') D.anularDecreto(E, exc, dec);
            E.corte.tension = U.clamp(E.corte.tension + 14, 0, 100); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 2.5, 3, 95);
            C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte Constitucional tumba la declaratoria de ${T.n.toLowerCase()} y cae todo lo decretado`, tono: -1, importante: true, jugador: exc.jugador });
            D.terminar(E, 'Declarada inexequible por la Corte', true); return;
          }
          E.corte.tension = U.clamp(E.corte.tension - 3, 0, 100);
          C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte avala la declaratoria de ${T.n.toLowerCase()}`, tono: 1, jugador: exc.jugador });
        }
        // Revisión de decretos legislativos
        for (const dec of exc.decretos) if (dec.estado === 'vigente' && E.fecha.t >= dec.revision) {
          const def = DECRETOS[dec.clave], p = U.clamp(def.riesgo + E.corte.tension * 0.002 + (C.Corte.activismoMedio(E) - 50) * 0.002, 0.02, 0.85);
          if (U.chance(p)) {
            D.anularDecreto(E, exc, dec); E.corte.tension = U.clamp(E.corte.tension + 6, 0, 100);
            C.Corte.registrarFallo(E, { tipo: 'decreto', titulo: def.n, resultado: 'inexequible', gobierno: true });
            C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte tumba el decreto «${def.n}»`, tono: -1, jugador: dec.jugador });
          } else dec.estado = 'avalado';
        }
        // IA: el presidente NPC decreta de vez en cuando
        if (!D.esPres(E) && U.chance(0.18)) { const op = Object.keys(DECRETOS).filter(k => DECRETOS[k].t === exc.tipo && !exc.decretos.some(x => x.clave === k)); if (op.length) D.decretar(E, U.pick(op)); }
        if (E.fecha.t >= exc.fin) D.terminar(E, 'Vence el plazo');
        else if (d.semanasAnio.n >= PLAZOS_MAX_ANIO + 13 * 1 && exc.tipo === 'emergencia') D.terminar(E, 'Se agota el límite anual');
        return;
      }
      // IA: un presidente NPC declara si la crisis es profunda
      if (!D.esPres(E) && E.fecha.t - d.ultimaDeclaratoria > 78 && D.semanasUsadas(E) < PLAZOS_MAX_ANIO) {
        const g = D.gravedad(E);
        const mejor = Object.entries(g).sort((a, b) => b[1] - a[1])[0];
        if (mejor[1] > 72 && U.chance(0.025 + (mejor[1] - 72) / 400)) {
          const tipo = mejor[0] === 'orden' ? 'conmocion' : 'emergencia';
          D.declarar(E, tipo, mejor[0] === 'salud' ? 'salud' : mejor[0]);
        }
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'declararExcepcion', nombre: 'Declarar estado de excepción', icono: '🚨', grupo: 'ejecutivo', costo: 4,
        disponible(E, a) {
          if (!D.esPres(E)) return 'Sólo el Presidente declara estados de excepción';
          if (D.activa(E)) return 'Ya hay un estado de excepción vigente';
          if (!TIPOS[a.tipo]) return 'Elige el tipo';
          if (D.semanasUsadas(E) + TIPOS[a.tipo].dur > PLAZOS_MAX_ANIO + 4) return 'Agotarías el límite anual de 90 días';
          if (E.fecha.t - D.asegurar(E).ultimaDeclaratoria < 26) return 'Acabas de terminar uno: deja pasar seis meses';
          return true;
        },
        ejecutar(E, a) {
          const g = D.gravedad(E)[a.motivo] || 0;
          const exc = D.declarar(E, a.tipo, a.motivo, true);
          return { ok: true, msg: `${TIPOS[a.tipo].n} declarada (${Math.round(g)}/100 de gravedad real). La Corte la revisará en pocas semanas${g < 35 ? ' — y la crisis no parece tan grave: riesgo alto de que la tumbe' : ''}`, datos: exc };
        } });
      A.registrar({ id: 'decretarExcepcion', nombre: 'Expedir decreto legislativo', icono: '📜', grupo: 'ejecutivo', costo: 2,
        disponible(E, a) { if (!D.esPres(E)) return 'Sólo el Presidente'; const x = D.activa(E); if (!x) return 'No hay estado de excepción'; const def = DECRETOS[a.decreto]; if (!def || def.t !== x.tipo) return 'Elige un decreto de este estado'; if (x.decretos.some(z => z.clave === a.decreto)) return 'Ya lo expediste'; return true; },
        ejecutar(E, a) { const dec = D.decretar(E, a.decreto, true); return dec ? { ok: true, msg: `Decreto «${DECRETOS[a.decreto].n}» expedido; la Corte lo revisará (riesgo ${Math.round(DECRETOS[a.decreto].riesgo * 100)} % base)` } : { ok: false, msg: 'No se pudo expedir' }; } });
      A.registrar({ id: 'prorrogarExcepcion', nombre: 'Prorrogar el estado de excepción', icono: '⏳', grupo: 'ejecutivo', costo: 3,
        disponible(E) { if (!D.esPres(E)) return 'Sólo el Presidente'; const x = D.activa(E); if (!x) return 'No hay estado de excepción'; const T = TIPOS[x.tipo]; if (x.prorrogas >= T.max) return 'Ya agotaste las prórrogas'; if (x.fin - E.fecha.t > 4) return 'Sólo puedes prorrogarlo en el último mes'; if (D.semanasUsadas(E) + T.dur > PLAZOS_MAX_ANIO + 4 && x.tipo === 'emergencia') return 'Límite anual agotado'; return true; },
        ejecutar(E) {
          const x = D.activa(E), T = TIPOS[x.tipo];
          if (x.tipo === 'conmocion' && x.prorrogas === 1) {
            const S = C.Congreso.miembros(E, 'senado'); let si = 0; for (const p of S) { if (p.id === 'J') { si++; continue; } const pa = E.partidos[p.partido]; if (U.chance(U.sig(((pa && pa.postura === 'gobierno' ? 20 : pa && pa.postura === 'oposicion' ? -22 : 0) + (E.opinion.aprobacionPres - 45) * 0.4) / 8))) si++; }
            if (si < C.Congreso.mayoria(E, 'senado')) return { ok: true, exito: false, msg: `El Senado no da su visto bueno a la segunda prórroga (${si} votos)` };
          }
          x.prorrogas++; x.fin += T.dur; E.opinion.aprobacionPres -= 0.8; return { ok: true, msg: `Prorrogada ${T.dur} semanas más` };
        } });
      A.registrar({ id: 'levantarExcepcion', nombre: 'Levantar el estado de excepción', icono: '🕊', grupo: 'ejecutivo', costo: 1,
        disponible(E) { return D.esPres(E) ? (D.activa(E) ? true : 'No hay estado de excepción') : 'Sólo el Presidente'; },
        ejecutar(E) { D.terminar(E, 'Levantado por el Presidente'); E.opinion.aprobacionPres += 0.5; return { ok: true, msg: 'Estado de excepción levantado' }; } });
      A.registrar({ id: 'demandarExcepcion', nombre: 'Demandar la declaratoria ante la Corte', icono: '⚖', grupo: 'control', costo: 3,
        disponible(E) { if (D.esPres(E)) return 'Eres el Presidente'; const x = D.activa(E); if (!x) return 'No hay estado de excepción'; return x.demandado ? 'Ya hay una demanda' : x.revisada ? 'La Corte ya la revisó' : true; },
        ejecutar(E) { const x = D.activa(E); x.demandado = true; C.Opinion.subirRec(E, 2); return { ok: true, msg: 'Tu demanda aumenta el riesgo de que la Corte tumbe la declaratoria' }; } });
      A.registrar({ id: 'reglamentarLey', nombre: 'Reglamentar una ley por decreto', icono: '🖋', grupo: 'ejecutivo', costo: 1,
        disponible(E, a) { if (!D.esPres(E)) return 'Sólo el Presidente reglamenta'; const p = E.proyectos[a.proyecto]; return p && p.reglam && p.reglam.estado === 'pendiente' ? true : 'La ley no espera reglamentación'; },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto], restr = a.modo === 'restrictivo'; D.aplicar(E, p, restr ? 0.65 : 1); if (restr && p.costo > 0) C.Economia.programar(E, [{ v: 'deficit', d: -C.Economia.impactoFiscal(p.costo) * 0.35, p: 'm' }], p.id); return { ok: true, msg: restr ? 'Reglamentación restrictiva: 65 % de efectos y 35 % menos costo' : 'Reglamentación fiel: la ley rinde todos sus efectos' }; } });
      A.registrar({ id: 'exigirReglamentacion', nombre: 'Exigir la reglamentación (control político)', icono: '📣', grupo: 'control', costo: 2,
        disponible(E, a) { if (D.esPres(E)) return 'Eres el Gobierno'; const p = E.proyectos[a.proyecto]; return p && p.reglam && p.reglam.estado === 'pendiente' ? true : 'La ley no espera reglamentación'; },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto]; p.reglam.presion++; C.Opinion.subirRec(E, 1.2); return { ok: true, msg: 'Presionas al Gobierno: sube la probabilidad semanal de que reglamente' }; } });
      A.registrar({ id: 'accionCumplimiento', nombre: 'Acción de cumplimiento ante el Consejo de Estado', icono: '⚖', grupo: 'control', costo: 3,
        disponible(E, a) { const p = E.proyectos[a.proyecto]; if (!p || !p.reglam || p.reglam.estado !== 'pendiente') return 'La ley no espera reglamentación'; if (E.fecha.t - p.reglam.t0 < 26) return 'Espera seis meses de mora'; return p.reglam.orden != null ? 'Ya hay una orden vigente' : (p.reglam.accion ? 'Ya la intentaste' : true); },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto]; p.reglam.accion = true; if (U.chance(0.6)) { p.reglam.orden = E.fecha.t + 8; return { ok: true, msg: 'El juez ordena reglamentar en ocho semanas' }; } return { ok: true, exito: false, msg: 'El Consejo de Estado niega la acción' }; } });
    }
  };
  C.Decretos = D; D.clave = 'decretos';
  (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Decretos');
  C.Tiempo.registrar('decretos', D, 56);
  D.registrarAcciones();
})(window.CURUL);
