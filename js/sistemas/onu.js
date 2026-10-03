/* ONU (Fase 43): Asamblea General (votos que mueven a los tres bloques), Examen Periódico Universal del Consejo de Derechos Humanos,
   relatores especiales, Misión de Verificación del acuerdo de paz (renovada cada octubre por el Consejo de Seguridad), cascos azules y ODS.
   Complementa a Exterior (que lleva la candidatura de Colombia al Consejo de Seguridad). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, D = () => C.DATA.multi, MV = () => C.MundoVivo, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: tono || 0, importante: !!imp, jugador: esPres(E) }); };
  const T = (y, m, d) => U.turnoDe(new Date(Date.UTC(y, m, d)));
  const EPU = [[2008, 11, 10], [2013, 3, 10], [2018, 4, 10], [2024, 0, 20], [2028, 6, 10], [2033, 0, 10], [2037, 6, 10], [2042, 0, 10], [2046, 6, 10]];
  const O = {
    clave: 'onu',
    asegurar(E) {
      if (E.onu && E.onu.ag) return E.onu;
      const t = E.fecha.t, y = U.anio();
      const epu = EPU.map(d => T(...d)).find(x => x > t) || t + 300;
      E.onu = { sg: { nombre: 'António Guterres', hasta: T(2026, 11, 31) }, ag: { prox: t + U.ri(6, 14), hist: [] }, epu: { prox: epu, recs: [], ult: null, resp: null }, relator: { prox: t + U.ri(60, 140), ult: null },
        mision: null, cascos: { n: 0, desde: null, bajas: 0 }, ods: { score: 0, rank: null, hist: [] }, lobbyMision: 0, hist: [], sgOnuVisto: false };
      return E.onu;
    },
    init(E) { E.onu = null; }, migrar(E) { O.asegurar(E); },
    miembro(E) { return true; },
    anotar(E, txt) { const o = O.asegurar(E); o.hist.unshift({ t: E.fecha.t, txt }); if (o.hist.length > 25) o.hist.length = 25; },
    eje(E, d) { const P = MV().asegurar(E).presion; for (const [k, v] of Object.entries(d)) P[k] = cl((P[k] || 0) + v, -40, 40); },
    votar(E, rid, v) {
      const r = D().RESOLUCIONES.find(x => x.id === rid); if (!r) return '';
      const d = {}; for (const [k, x] of Object.entries(r.e)) d[k] = x * v * 1.6; O.eje(E, d);
      const o = O.asegurar(E); o.ag.hist.unshift({ t: E.fecha.t, n: r.n, voto: v }); if (o.ag.hist.length > 10) o.ag.hist.length = 10;
      for (const [id, st] of Object.entries(E.diplomacia.paises)) { const a = MV().alin(id); if (a && r.e[a] && v !== 0) st.relacion = cl(st.relacion + r.e[a] * v * 0.5, 3, 97); }
      return C.Pais.ef(E, { rec: v === 0 ? 0 : 0.4 });
    },
    epu(E, via) {
      const o = O.asegurar(E), k = C.CIDH ? C.CIDH.asegurar(E) : null; o.epu.resp = via; o.epu.ult = E.fecha.t;
      if (k) k.coop = cl(k.coop + (via === 'todas' ? 10 : via === 'parcial' ? 3 : -6), 0, 100);
      if (via === 'rechazo') for (const st of Object.values(E.diplomacia.paises).slice(0, 50)) st.relacion = cl(st.relacion - 0.6, 3, 97);
      if (via === 'todas') for (const r of o.epu.recs) r.estado = 'aceptada'; else if (via === 'parcial') o.epu.recs.forEach((r, i) => r.estado = i % 2 ? 'aceptada' : 'tomo nota'); else o.epu.recs.forEach(r => r.estado = 'rechazada');
      O.anotar(E, `EPU: ${via === 'todas' ? 'aceptas todas las recomendaciones' : via === 'parcial' ? 'aceptas algunas recomendaciones' : 'rechazas el examen'}`);
      return C.Pais.ef(E, { rec: via === 'todas' ? 1.5 : via === 'rechazo' ? 0.5 : 0.8, honestidad: via === 'rechazo' ? -2 : 1 });
    },
    relator(E, invita) {
      const o = O.asegurar(E), k = C.CIDH ? C.CIDH.asegurar(E) : null, tema = o.relator.tema || 'derechos humanos';
      if (invita) { let n = 0; if (C.CIDH) { const oc = C.CIDH.ocultos(E).filter(c => c.evid > 25).slice(0, 3); oc.forEach(c => C.CIDH.revelar(E, c, 'relator')); n = oc.length; } if (k) k.coop = cl(k.coop + 4, 0, 100); noti(E, `El relator especial sobre ${tema} concluye su visita: elogia la apertura del Gobierno y documenta ${n} casos`, 0, true); return C.Pais.ef(E, { rec: 1 }); }
      if (k) { k.coop = cl(k.coop - 4, 0, 100); k.impun = cl(k.impun + 2, 0, 100); } noti(E, `Colombia niega la visita del relator sobre ${tema}: la ONU expresa su preocupación`, -1, true); return C.Pais.ef(E, { rec: 0.3, honestidad: -1 });
    },
    crearMision(E) {
      const o = O.asegurar(E); if (o.mision || U.anio() < 1995) return;
      const y = U.anio(), oct = T(y, 9, 25), hasta = oct > E.fecha.t ? oct : T(y + 1, 9, 25);
      o.mision = { nombre: 'Misión de Verificación de la ONU en Colombia', desde: E.fecha.t, hasta }; O.anotar(E, 'El Consejo de Seguridad crea una Misión de Verificación del acuerdo de paz');
      noti(E, 'El Consejo de Seguridad crea una misión política de la ONU para verificar el acuerdo de paz en Colombia', 1, true);
    },
    renovar(E) {
      const o = O.asegurar(E), m = o.mision; if (!m) return;
      const rel = id => (E.diplomacia.paises[id] || { relacion: 50 }).relacion;
      const avg = (rel('USA') + rel('GBR') + rel('FRA') + rel('RUS') + rel('CHN')) / 5, veto = Math.min(rel('USA'), rel('RUS'), rel('CHN')) < 22 && U.chance(0.5);
      const p = cl(0.55 + (avg - 45) / 120 + o.lobbyMision, 0.25, 0.97); o.lobbyMision = 0;
      if (!veto && U.chance(p)) { const y = U.anio(); m.hasta = T(y + 1, 9, 25); noti(E, 'El Consejo de Seguridad renueva por un año la Misión de Verificación en Colombia', 1); O.anotar(E, 'Se renueva la Misión de Verificación'); }
      else { o.mision = null; noti(E, 'El Consejo de Seguridad no renueva la misión de la ONU en Colombia: el acuerdo queda sin verificación internacional', -1, true); O.anotar(E, 'Termina la Misión de Verificación'); if (C.CIDH) C.CIDH.asegurar(E).impun = cl(C.CIDH.asegurar(E).impun + 5, 0, 100); }
    },
    ods(E) {
      const Ec = E.economia, o = O.asegurar(E), edu = U.prom(Object.values(E.deptos).map(d => d.educacion)), seg = U.prom(Object.values(E.deptos).map(d => d.seguridad));
      const s = cl(100 - Ec.pobreza * 1.1 - Math.max(0, Ec.desempleo - 5) * 1.6 + (edu - 50) * 0.5 + (seg - 50) * 0.4 + 12, 5, 98);
      o.ods.score = s; o.ods.rank = Math.round(166 * (1 - s / 100) + 4); o.ods.hist.push([E.fecha.t, +s.toFixed(1)]); if (o.ods.hist.length > 25) o.ods.hist.shift();
      noti(E, `Informe de los Objetivos de Desarrollo Sostenible: Colombia ocupa el puesto ${o.ods.rank} de 166`, s >= 60 ? 1 : -1);
    },
    turno(E) {
      const o = O.asegurar(E), t = E.fecha.t, y = U.anio();
      // Asamblea General
      if (t >= o.ag.prox) {
        o.ag.prox = t + U.ri(10, 18);
        const l = D().RESOLUCIONES.filter(r => r.y <= y && !(o.ag.hist[0] && o.ag.hist[0].n === r.n));
        if (l.length) { const r = U.pick(l); if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_ag_voto'), { forzar: true, vars: { res: r.n, rid: r.id } }); else { o.ag.hist.unshift({ t, n: r.n, voto: U.pick([1, 1, 0, -1]) }); if (o.ag.hist.length > 10) o.ag.hist.length = 10; } }
      }
      // EPU
      if (y >= 2008 && t >= o.epu.prox) {
        const recs = []; const pool = D().EPU_RECS.slice(); while (recs.length < 5 && pool.length) recs.push({ n: pool.splice(U.ri(0, pool.length - 1), 1)[0], estado: 'pendiente' });
        o.epu.recs = recs; o.epu.prox = EPU.map(d => T(...d)).find(x => x > t + 20) || t + 234;
        if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_epu'), { forzar: true, vars: { rec: recs[0].n } }); else O.epu(E, U.pick(['parcial', 'parcial', 'todas']));
      }
      // Relatores
      if (y >= 1990 && t >= o.relator.prox) {
        o.relator.prox = t + U.ri(80, 150); o.relator.tema = U.pick(D().RELATORES);
        if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_relator'), { forzar: true, vars: { tema: o.relator.tema } }); else { const k = C.CIDH ? C.CIDH.asegurar(E) : { impun: 50 }; if (k.impun > 55) noti(E, `El relator de la ONU sobre ${o.relator.tema} critica la impunidad en Colombia`, -1); }
      }
      // Misión de Verificación
      if (o.mision) { if (t >= o.mision.hasta) O.renovar(E); if (C.CIDH && t % 4 === 0) { const k = C.CIDH.asegurar(E); k.impun = cl(k.impun - 0.05, 0, 100); } }
      // SG de la ONU (2026) y ODS
      if (y === 2026 && !o.sgOnuVisto && t >= T(2026, 2, 1)) { o.sgOnuVisto = true; if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_sg_onu'), { forzar: true }); }
      if (t % 52 === 20 && !E.meta.presim) O.ods(E);
      // cascos azules
      if (o.cascos.n > 0 && U.chance(0.0015 * o.cascos.n / 100)) { o.cascos.bajas++; noti(E, 'Muere un soldado colombiano en una misión de paz de la ONU', -1); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.3, 3, 95); }
      if (o.cascos.n > 0 && t % 52 === 5) for (const id of ['USA', 'FRA', 'GBR']) { const st = E.diplomacia.paises[id]; if (st) st.relacion = cl(st.relacion + 0.6, 3, 97); }
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'desplegarCascos', nombre: 'Enviar cascos azules a una misión de paz de la ONU', icono: '🪖', grupo: 'diplomacia', costo: 2,
        disponible(E) { const o = O.asegurar(E); return esPres(E) ? (U.anio() < 1950 ? 'La ONU no tiene misiones todavía' : o.cascos.n >= 600 ? 'Ya aportas el máximo de tropas' : true) : 'Sólo el Presidente'; },
        ejecutar(E) { const o = O.asegurar(E); o.cascos.n += 200; o.cascos.desde = o.cascos.desde || E.fecha.t; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.15), p: 'm' }], 'onu'); C.Opinion.subirRec(E, 1); return { ok: true, msg: `Colombia aporta ${o.cascos.n} soldados a misiones de paz: prestigio internacional, a un costo fiscal y de riesgo` }; } });
      A.registrar({ id: 'retirarCascos', nombre: 'Retirar los cascos azules', icono: '↩', grupo: 'diplomacia', costo: 1,
        disponible(E) { return esPres(E) ? (O.asegurar(E).cascos.n > 0 ? true : 'No hay tropas desplegadas') : 'Sólo el Presidente'; },
        ejecutar(E) { O.asegurar(E).cascos.n = 0; return { ok: true, msg: 'Repatrias a los soldados de las misiones de la ONU' }; } });
      A.registrar({ id: 'cabildearMision', nombre: 'Cabildear la renovación de la Misión de Verificación', icono: '🗳', grupo: 'diplomacia', costo: 1,
        disponible(E) { return esPres(E) ? (O.asegurar(E).mision ? true : 'No hay una misión de la ONU en el país') : 'Sólo el Presidente'; },
        ejecutar(E) { const o = O.asegurar(E); o.lobbyMision = Math.min(0.2, o.lobbyMision + 0.07); return { ok: true, msg: 'Gestionas con los miembros del Consejo de Seguridad: sube la probabilidad de renovación' }; } });
      A.registrar({ id: 'invitarRelator', nombre: 'Invitar a un relator especial de la ONU', icono: '🧑‍⚖️', grupo: 'derechos', costo: 2,
        disponible(E) { return esPres(E) ? (U.anio() < 1990 ? 'Aún no existen esos mecanismos' : true) : 'Sólo el Presidente'; },
        ejecutar(E) { O.asegurar(E).relator.tema = U.pick(D().RELATORES); return { ok: true, msg: O.relator(E, true) || 'Visita del relator' }; } });
    }
  };
  C.ONU = O; C.Tiempo.registrar('onu', O, 72); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('ONU'); O.registrarAcciones();
  if (C.OrdenPublico && C.OrdenPublico.firmarPaz) { const orig = C.OrdenPublico.firmarPaz; C.OrdenPublico.firmarPaz = function (E) { const r = orig.apply(this, arguments); try { O.crearMision(E); } catch (e) { console.error('[ONU] mision', e); } return r; }; }
})(window.CURUL);
