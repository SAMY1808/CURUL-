/* CIDH, Corte IDH y CPI (Fase 43). Los abusos del Estado nacen ocultos: sólo salen a la luz por filtraciones de la prensa y las ONG
   o porque alguien investiga (tú, como congresista, periodista, fiscal o Presidente). Una vez denunciados recorren el trámite
   (admisibilidad → fondo → recomendaciones → Corte IDH → sentencia). Cuando se repiten de forma sistemática contra la población
   civil aparece la sombra de los crímenes de lesa humanidad y, desde 2002, de la Corte Penal Internacional. Si ordenaste tú la
   represión, la responsabilidad de mando es tuya. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, D = () => C.DATA.multi, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp, jug) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'escandalo', titular: txt, tono: tono || -1, importante: !!imp, jugador: jug == null ? esPres(E) : jug }); };
  const FASES = { oculto: 'Oculto', denunciado: 'Denunciado', admisibilidad: 'Admisibilidad', fondo: 'Estudio de fondo', recomendaciones: 'Recomendaciones de la CIDH', corte: 'Ante la Corte IDH', sentencia: 'Sentencia', cumplido: 'Cumplido', archivado: 'Archivado', amistoso: 'Solución amistosa' };
  const FIN = ['cumplido', 'archivado', 'amistoso'];
  const W = (o) => U.pesado(Object.entries(o), x => x[1])[0];
  const K = {
    FASES, FIN, clave: 'cidh',
    era: () => { const y = U.anio(); return { cidh: y >= 1959, corte: y >= 1985, cpi: y >= 2002 }; },
    asegurar(E) {
      if (E.cidh && E.cidh.casos) return E.cidh;
      E.cidh = { casos: [], lesa: [], cautelares: [], impun: 55, coop: 50, visita: null, ultVisita: -999, ultInv: -999, ultProc: -999, cpi: { fase: null, t0: 0 }, informes: [], amenazas: 0 };
      return E.cidh;
    },
    init(E) { E.cidh = null; },
    migrar(E) { K.asegurar(E); },
    visibles(E) { return K.asegurar(E).casos.filter(c => c.fase !== 'oculto'); },
    abiertos(E) { return K.asegurar(E).casos.filter(c => c.fase !== 'oculto' && !FIN.includes(c.fase)); },
    ocultos(E, inst) { return K.asegurar(E).casos.filter(c => c.fase === 'oculto' && (!inst || c.inst === inst)); },
    deptoRand(E) { const d = U.pesado(Object.values(E.deptos), x => x.poblacion / 1000 + 1); return d.id; },
    registrar(E, tipo, o = {}) {
      const k = K.asegurar(E), T = D().CIDH_TIPOS[tipo]; if (!T) return null;
      const c = { id: U.id('cd'), tipo, inst: o.inst || 'ejercito', t0: E.fecha.t, depto: o.depto || K.deptoRand(E), victimas: tipo === 'masacre' ? U.ri(6, 40) : U.ri(1, 6), evid: o.evid != null ? o.evid : U.ri(10, 40), fase: 'oculto', dur: 0, t1: E.fecha.t, resp: o.resp || null, sist: false, cumpl: 0, monto: 0 };
      k.casos.push(c); if (k.casos.length > 80) { const i = k.casos.findIndex(x => FIN.includes(x.fase)); k.casos.splice(i >= 0 ? i : 0, 1); }
      if (o.vis) K.revelar(E, c, 'denuncia pública');
      return c;
    },
    revelar(E, c, via) {
      if (c.fase !== 'oculto') return; c.fase = 'denunciado'; c.t1 = E.fecha.t; c.dur = U.ri(12, 30); c.tAnio = U.anio();
      const d = E.deptos[c.depto], T = D().CIDH_TIPOS[c.tipo];
      noti(E, `Denuncian ${T.n.toLowerCase()} en ${d ? d.nombre : 'el país'} (${c.victimas} víctima${c.victimas > 1 ? 's' : ''}) atribuida a: ${D().CIDH_INST[c.inst].toLowerCase()}`, -1, T.g >= 8);
      E.opinion.escandalos = (E.opinion.escandalos || 0) + (T.g >= 8 ? 0.5 : 0.2);
      K.patrones(E);
    },
    /* Patrón sistemático: tres casos del mismo tipo y la misma institución en cinco años */
    patrones(E) {
      const k = K.asegurar(E), g = {}, lim = E.fecha.t - 260;
      for (const c of k.casos) if (c.t0 >= lim) (g[c.inst + '|' + c.tipo] = g[c.inst + '|' + c.tipo] || []).push(c);
      for (const [key, arr] of Object.entries(g)) {
        if (arr.length < 3) continue; arr.forEach(c => c.sist = true);
        const vis = arr.filter(c => c.fase !== 'oculto');
        if (vis.length >= 3 && !k.lesa.some(l => l.key === key)) {
          const [inst, tipo] = key.split('|'), T = D().CIDH_TIPOS[tipo], resp = arr.some(c => c.resp === 'J');
          k.lesa.push({ key, inst, tipo, t: E.fecha.t, n: arr.length, resp });
          k.impun = cl(k.impun + 4, 0, 100); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - (esPres(E) ? 1.5 : 0), 3, 95);
          noti(E, `INDICIOS DE LESA HUMANIDAD: ${vis.length} casos de ${T.n.toLowerCase()} atribuidos a ${D().CIDH_INST[inst].toLowerCase()} apuntan a un patrón sistemático contra civiles${resp ? ' con responsabilidad de mando' : ''}`, -1, true);
          if (C.Poderes) C.Poderes.mover(E, 'ong', 3);
        }
      }
    },
    contexto(E) {
      const y = U.anio(), r = E.regimen, seg = U.prom(Object.values(E.deptos).map(d => d.seguridad));
      const era = y < 1950 ? 0.6 : y < 1965 ? 1.4 : y < 1985 ? 1.0 : y < 2003 ? 1.7 : y < 2016 ? 1.2 : 0.8;
      return era * (1 + (60 - seg) / 45) * (1 + (r && r.junta ? r.junta.repres / 45 : 0));
    },
    generar(E) {
      const y = U.anio(), r = E.regimen, de = r && r.junta && ['junta', 'autoritario'].includes(r.tipo);
      const inst = W(de ? { junta: 5, ejercito: 1.5, policia: 1.5, dni: 1 } : { ejercito: 3, policia: 2.5, dni: E.inteligencia ? 1.2 : 0.6, paramilitar: y >= 1985 && y <= 2012 ? 3.5 : 1, gobierno: 0.4 });
      const tipos = { ejercito: { ejecucion: 3, desaparicion: 2, masacre: 2, desplazamiento: 1.5, sexual: 1 }, policia: { protesta: 3, detencion: 2, tortura: 2, ejecucion: 1 }, dni: { persecucion: 3, prensa: 2, desaparicion: 1 }, paramilitar: { masacre: 3, lider: 3, desplazamiento: 2, desaparicion: 2 }, junta: { desaparicion: 3, tortura: 3, persecucion: 3, detencion: 2, prensa: 2 }, gobierno: { persecucion: 2, prensa: 2, protesta: 1 } };
      const resp = de && r.junta.lider === 'J' ? 'J' : null;
      K.registrar(E, W(tipos[inst]), { inst, resp });
    },
    efectoRespuesta(E, c, via) {
      const k = K.asegurar(E), sent = c.fase === 'sentencia'; let msg;
      const paga = m => C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(m), p: 'm' }], 'cidh');
      if (via === 'amistosa') { c.fase = 'amistoso'; c.cumpl = 100; paga(0.08); k.coop = cl(k.coop + 6, 0, 100); k.impun = cl(k.impun - 3, 0, 100); c.resp = null; msg = 'Aceptas responsabilidad, pides perdón a las víctimas y pagas una indemnización: la CIDH archiva el caso'; }
      else if (via === 'cumplir') { c.fase = 'cumplido'; c.cumpl = 100; paga(sent ? 0.2 : 0.1); k.coop = cl(k.coop + 8, 0, 100); k.impun = cl(k.impun - 5, 0, 100); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.3, 3, 95); C.Opinion.subirRec(E, 1); msg = 'Cumples íntegramente: reparaciones, disculpa pública e investigación de los responsables'; }
      else if (via === 'parcial') { c.cumpl = 50; paga(0.1); k.coop = cl(k.coop + 2, 0, 100); k.impun = cl(k.impun - 1, 0, 100); msg = 'Pagas la indemnización pero no avanzas en la investigación: la Corte exigirá el resto'; }
      else { c.desacato = true; k.coop = cl(k.coop - 10, 0, 100); k.impun = cl(k.impun + 6, 0, 100); for (const st of Object.values(E.diplomacia.paises).slice(0, 40)) st.relacion = cl(st.relacion - 0.4, 3, 97); if (C.Poderes) C.Poderes.mover(E, 'ong', -4); if (c.fase === 'recomendaciones') c.cumpl = -1; msg = 'Desconoces la decisión: la comunidad internacional lo registra como incumplimiento'; }
      return msg;
    },
    accion(E, cid, via) { const c = K.asegurar(E).casos.find(x => x.id === cid); if (!c) return 'El caso ya se resolvió'; return K.efectoRespuesta(E, c, via); },
    visita(E, aceptar) {
      const k = K.asegurar(E); k.ultVisita = E.fecha.t;
      if (aceptar) { const oc = K.ocultos(E).filter(c => c.evid > 18).slice(0, 6); oc.forEach(c => { c.evid += 15; K.revelar(E, c, 'visita in loco'); }); k.coop = cl(k.coop + 8, 0, 100); k.impun = cl(k.impun - 3, 0, 100); C.Opinion.subirRec(E, 1); return `La CIDH recorre el país: salen a la luz ${oc.length} casos y se reconoce tu apertura`; }
      k.coop = cl(k.coop - 8, 0, 100); k.impun = cl(k.impun + 4, 0, 100); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.5, 3, 95); noti(E, 'Colombia niega el ingreso de la CIDH: crece la preocupación internacional', -1, true); return 'Niegas el acceso: la CIDH lo anota en su informe anual';
    },
    cpi(E, via) {
      const k = K.asegurar(E), p = k.cpi;
      if (via === 'cooperar') { k.impun = cl(k.impun - 4, 0, 100); k.coop = cl(k.coop + 5, 0, 100); p.t0 += 52; return C.Pais.ef(E, { rec: 1 }); }
      if (via === 'atacar') { k.impun = cl(k.impun + 4, 0, 100); p.t0 -= 26; for (const st of Object.values(E.diplomacia.paises).slice(0, 40)) st.relacion = cl(st.relacion - 0.5, 3, 97); return C.Pais.ef(E, { rec: 1.5, honestidad: -2 }); }
      return 'La Fiscalía de la CPI toma nota del silencio';
    },
    turno(E) {
      const k = K.asegurar(E), t = E.fecha.t, ER = K.era(), y = U.anio();
      if (U.chance(0.03 * K.contexto(E))) K.generar(E);
      const pod = C.Poderes ? C.Poderes.asegurar(E).actores : null, r = E.regimen, cens = r && r.junta ? r.junta.censura : 0;
      for (const c of k.casos) {
        if (c.fase === 'oculto') {
          const p = (0.003 + (pod ? (pod.ong.poder + pod.prensa.poder) / 200 * 0.008 : 0.004) + c.evid / 100 * 0.003) * (cens > 40 ? 0.4 : 1);
          if (U.chance(p) && !(t - c.t0 < 4)) K.revelar(E, c, 'filtración');
          continue;
        }
        if (FIN.includes(c.fase)) continue;
        c.dur--; if (c.dur > 0 && !(c.fase === 'recomendaciones' && c.cumpl >= 100)) { if (c.fase === 'recomendaciones' && !esPres(E)) c.cumpl = Math.min(100, c.cumpl + k.coop / 20); if (c.fase === 'sentencia' && !esPres(E)) c.cumpl = Math.min(100, c.cumpl + k.coop / 40); continue; }
        if (!ER.cidh) { c.fase = 'archivado'; k.impun = cl(k.impun + 2, 0, 100); continue; }   // antes de 1959 no hay a quién acudir
        if (c.fase === 'denunciado') { if (c.evid < 15 && U.chance(0.3)) { c.fase = 'archivado'; k.impun = cl(k.impun + 1.5, 0, 100); } else { c.fase = 'admisibilidad'; c.dur = U.ri(20, 40); } }
        else if (c.fase === 'admisibilidad') { c.fase = 'fondo'; c.dur = U.ri(40, 80); }
        else if (c.fase === 'fondo') {
          c.fase = 'recomendaciones'; c.dur = 26; c.cumpl = 0;
          noti(E, `CIDH concluye que el Estado es responsable en el caso de ${D().CIDH_TIPOS[c.tipo].n.toLowerCase()} y emite recomendaciones`, -1, D().CIDH_TIPOS[c.tipo].g >= 8);
          if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_cidh_informe'), { forzar: true, vars: { caso: D().CIDH_TIPOS[c.tipo].n.toLowerCase(), cid: c.id } });
        }
        else if (c.fase === 'recomendaciones') {
          if (c.cumpl >= 100) { c.fase = 'cumplido'; k.impun = cl(k.impun - 3, 0, 100); }
          else if (ER.corte && !c.proc && U.chance(0.45 + k.impun / 250)) { c.fase = 'corte'; c.dur = U.ri(40, 70); }
          else { c.fase = 'archivado'; k.impun = cl(k.impun + 3, 0, 100); }
        }
        else if (c.fase === 'corte') {
          c.fase = 'sentencia'; c.dur = 60; c.cumpl = 0; c.monto = U.ri(8, 90) * 100;
          noti(E, `CORTE IDH condena a Colombia por ${D().CIDH_TIPOS[c.tipo].n.toLowerCase()}: ordena reparaciones por $${c.monto.toLocaleString('es-CO')} millones y justicia`, -1, true);
          E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - (esPres(E) ? 1 : 0.3), 3, 95); if (C.Poderes) C.Poderes.mover(E, 'ong', 1);
          if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_cidh_sentencia'), { forzar: true, vars: { caso: D().CIDH_TIPOS[c.tipo].n.toLowerCase(), tipo: D().CIDH_TIPOS[c.tipo].n.toLowerCase(), cid: c.id } });
        }
        else if (c.fase === 'sentencia') { if (c.cumpl >= 100) { c.fase = 'cumplido'; } else { c.desacato = true; c.dur = 60; k.coop = cl(k.coop - 2, 0, 100); k.impun = cl(k.impun + 2, 0, 100); if (!E.meta.presim) noti(E, 'La Corte IDH declara el incumplimiento del Estado colombiano y lo informa a la Asamblea General de la OEA', -1); } }
      }
      // medidas cautelares: líderes amenazados
      if (ER.cidh && k.cautelares.length < 6 && U.chance(0.012 * K.contexto(E))) { const N = C.DATA.nombres; k.cautelares.push({ id: U.id('mc'), nombre: `${U.pick(U.chance(0.5) ? N.h : N.m)} ${U.pick(N.a)}`, depto: K.deptoRand(E), riesgo: U.ri(40, 70), protegido: false, t0: t }); }
      for (const m of k.cautelares.slice()) {
        m.riesgo = cl(m.riesgo + (m.protegido ? -0.8 : 0.9), 0, 100);
        if (m.riesgo <= 12) { k.cautelares = k.cautelares.filter(x => x !== m); if (m.protegido) { noti(E, `Se levanta la medida cautelar de ${m.nombre}: ya no corre peligro`, 1, false); C.Opinion.subirRec(E, 0.3); } }
        else if (m.riesgo > 85 && !m.protegido && U.chance(0.04)) { k.cautelares = k.cautelares.filter(x => x !== m); const c = K.registrar(E, 'lider', { inst: 'paramilitar', depto: m.depto, evid: 55, vis: true }); noti(E, `Asesinan a ${m.nombre}, líder beneficiario de medidas cautelares de la CIDH`, -1, true); if (esPres(E)) E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 1.5, 3, 95); k.impun = cl(k.impun + 2, 0, 100); }
      }
      // visita in loco
      if (ER.cidh && !k.visita && t - k.ultVisita > 104 && K.abiertos(E).filter(c => D().CIDH_TIPOS[c.tipo].g >= 7).length >= 3 && U.chance(0.02)) {
        if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_cidh_visita'), { forzar: true, vars: { tipo: D().CIDH_TIPOS[U.pick(K.abiertos(E)).tipo].n.toLowerCase() } });
        else if (!esPres(E)) K.visita(E, U.chance(k.coop / 100));
      }
      // informe anual
      if (ER.cidh && t % 52 === 14 && !E.meta.presim) { const n = K.abiertos(E).length; if (n >= 3) { noti(E, `Informe anual de la CIDH: Colombia, entre los países con más casos abiertos (${n})`, -1, false); k.informes.unshift({ t, n }); } }
      // CPI
      const p = k.cpi;
      if (ER.cpi) {
        if (!p.fase && k.lesa.length && k.impun > 45 && U.chance(0.01)) { p.fase = 'examen'; p.t0 = t; noti(E, 'La Fiscalía de la Corte Penal Internacional abre un examen preliminar sobre Colombia', -1, true); if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_cpi'), { forzar: true }); }
        else if (p.fase === 'examen' && t - p.t0 > 104) { if (k.casos.some(c => c.proc) && k.impun < 60) { p.fase = 'cerrado'; noti(E, 'La CPI cierra el examen preliminar: la justicia colombiana investiga (complementariedad)', 1, true); } else { p.fase = 'investigacion'; p.t0 = t; noti(E, 'La CPI abre una investigación formal sobre crímenes de lesa humanidad en Colombia', -1, true); } }
        else if (p.fase === 'investigacion' && t - p.t0 > 104) {
          const j = k.lesa.some(l => l.resp);
          if (j) { p.fase = 'ordenes'; const J = E.jugador; J.riesgoJudicial = cl((J.riesgoJudicial || 0) + 35, 0, 100); C.Pais.ef(E, { escandalo: 'La CPI te señala por responsabilidad de mando', honestidad: -6, rec: -3 }); noti(E, `LA CPI EMITE ORDEN DE ARRESTO CONTRA ${E.jugador.nombre.toUpperCase()} POR RESPONSABILIDAD DE MANDO EN CRÍMENES DE LESA HUMANIDAD`, -1, true, true); }
          else { p.fase = 'cerrado'; noti(E, 'La CPI cierra la investigación sin órdenes de arresto contra altos mandos', 0, true); }
        }
      }
      k.coop = cl(k.coop + (50 - k.coop) * 0.002, 0, 100);
    },
    registrarAcciones() {
      const A = C.Acciones, caso = (E, a) => K.asegurar(E).casos.find(c => c.id === a.caso);
      A.registrar({ id: 'investigarAgentes', nombre: 'Investigar a una institución del Estado', icono: '🔎', grupo: 'derechos', costo: 2,
        disponible(E, a) { const k = K.asegurar(E); if (!D().CIDH_INST[a.inst]) return 'Elige la institución'; if (E.fecha.t - k.ultInv < 6) return 'Acabas de investigar: espera unas semanas'; return true; },
        ejecutar(E, a) {
          const k = K.asegurar(E), J = E.jugador, r = E.regimen; k.ultInv = E.fecha.t; const pool = K.ocultos(E, a.inst);
          if (!pool.length) return { ok: true, msg: `Revisas expedientes y entrevistas a testigos de ${D().CIDH_INST[a.inst].toLowerCase()}, pero no encuentras nada nuevo` };
          const role = (['senador', 'representante'].includes(J.cargo) ? 0.12 : 0) + (['Periodista', 'Abogado'].includes(J.profesion) ? 0.08 : 0) + (esPres(E) ? 0.2 : 0);
          const p = cl(0.38 + (J.reconocimiento || 0) / 250 + role - (a.inst === 'dni' ? 0.12 : 0) - (a.inst === 'gobierno' ? 0.18 : 0) - (r && r.junta ? 0.1 : 0), 0.12, 0.88);
          if (U.chance(p)) {
            const n = Math.min(pool.length, U.ri(1, 3)); pool.slice(0, n).forEach(c => { c.evid = Math.min(100, c.evid + 20); K.revelar(E, c, 'investigación'); });
            C.Opinion.subirRec(E, 1.5 + n); J.rep.honestidad = cl(J.rep.honestidad + 1, 0, 100);
            if (esPres(E)) { k.coop = cl(k.coop + 3, 0, 100); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - n * 0.6, 3, 95); }
            const lesa = k.lesa.filter(l => l.inst === a.inst && l.t === E.fecha.t).length;
            return { ok: true, msg: `Tu investigación saca a la luz ${n} caso${n > 1 ? 's' : ''} de ${D().CIDH_INST[a.inst].toLowerCase()}${lesa ? ' y destapa un patrón de LESA HUMANIDAD' : ''}` };
          }
          k.amenazas++; C.Pais.ef(E, { salud: -2, rec: 0.3 }); J.riesgoJudicial = cl((J.riesgoJudicial || 0) + 3, 0, 100);
          return { ok: true, exito: false, msg: 'Te cierran puertas, aparecen amenazas contra tu familia y los testigos se retractan: la investigación se estanca' };
        } });
      A.registrar({ id: 'denunciarCIDH', nombre: 'Llevar un caso ante la CIDH', icono: '📨', grupo: 'derechos', costo: 1,
        disponible(E, a) { const c = caso(E, a); if (!c) return 'Elige un caso'; if (!['denunciado', 'admisibilidad', 'fondo'].includes(c.fase)) return 'El caso no admite más impulso'; return c.denJ ? 'Ya impulsaste este caso' : true; },
        ejecutar(E, a) { const c = caso(E, a); c.denJ = true; c.evid = Math.min(100, c.evid + 12); c.dur = Math.max(2, c.dur - 4); C.Opinion.subirRec(E, 0.8); return { ok: true, msg: 'Presentas pruebas y testimonios ante la CIDH: el trámite avanza más rápido' }; } });
      A.registrar({ id: 'respuestaCaso', nombre: 'Responder a la CIDH o a la Corte IDH', icono: '⚖', grupo: 'derechos', costo: 2,
        disponible(E, a) { if (!esPres(E)) return 'Sólo el Gobierno responde por el Estado'; const c = caso(E, a); if (!c) return 'Elige un caso'; if (!['fondo', 'recomendaciones', 'corte', 'sentencia'].includes(c.fase)) return 'El caso todavía no está en esa etapa'; return true; },
        ejecutar(E, a) { return { ok: true, msg: K.efectoRespuesta(E, caso(E, a), a.via || 'cumplir') }; } });
      A.registrar({ id: 'cooperarCIDH', nombre: 'Invitar a la CIDH a una visita in loco', icono: '🧭', grupo: 'derechos', costo: 2,
        disponible(E) { const k = K.asegurar(E); return esPres(E) ? (!K.era().cidh ? 'No existe todavía la CIDH' : E.fecha.t - k.ultVisita < 104 ? 'Hubo una visita hace poco' : true) : 'Sólo el Presidente'; },
        ejecutar(E) { return { ok: true, msg: K.visita(E, true) }; } });
      A.registrar({ id: 'procesarInternamente', nombre: 'Ordenar a la Fiscalía procesar a los responsables', icono: '🏛', grupo: 'derechos', costo: 2,
        disponible(E, a) { if (!esPres(E)) return 'Sólo el Presidente'; const k = K.asegurar(E); if (E.fecha.t - k.ultProc < 8) return 'Ya diste esa orden hace poco'; return K.visibles(E).some(c => c.inst === a.inst && !FIN.includes(c.fase)) ? true : 'No hay casos abiertos de esa institución'; },
        ejecutar(E, a) { const k = K.asegurar(E); k.ultProc = E.fecha.t; let n = 0; for (const c of K.abiertos(E)) if (c.inst === a.inst) { c.proc = true; c.evid = Math.min(100, c.evid + 10); n++; } k.impun = cl(k.impun - 6, 0, 100); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - (U.chance(0.4) ? 1 : 0), 3, 95); if (C.Poderes) C.Poderes.mover(E, 'militares', ['ejercito', 'policia', 'dni'].includes(a.inst) ? -4 : 0); return { ok: true, msg: `La Fiscalía abre procesos por ${n} caso${n > 1 ? 's' : ''}: baja la impunidad y se fortalece la defensa ante la CPI` }; } });
      A.registrar({ id: 'protegerLider', nombre: 'Proteger a un líder con medidas cautelares', icono: '🛡', grupo: 'derechos', costo: 1,
        disponible(E, a) { const m = K.asegurar(E).cautelares.find(x => x.id === a.id); return m ? (m.protegido ? 'Ya está protegido' : true) : 'Elige a un líder amenazado'; },
        ejecutar(E, a) { const m = K.asegurar(E).cautelares.find(x => x.id === a.id); m.protegido = true; m.riesgo = Math.max(0, m.riesgo - 15); C.Opinion.subirRec(E, 0.4); return { ok: true, msg: `Asignas esquema de seguridad a ${m.nombre}` }; } });
    }
  };
  C.CIDH = K; C.Tiempo.registrar('cidh', K, 73); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('CIDH'); K.registrarAcciones();
  /* Cuando el Presidente reprime una protesta con la fuerza, queda registro: la responsabilidad de mando es suya */
  if (C.Movilizacion && C.Movilizacion.reprimir) { const orig = C.Movilizacion.reprimir; C.Movilizacion.reprimir = function (E, id) { const r = orig.apply(this, arguments); try { if (r && (r.grave || U.chance(0.25))) K.registrar(E, 'protesta', { inst: 'policia', resp: 'J', evid: r.grave ? 45 : 25, vis: !!r.grave }); } catch (e) { console.error('[CIDH] hook', e); } return r; }; }
})(window.CURUL);
