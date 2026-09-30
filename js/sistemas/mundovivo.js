/* Mundo vivo: cada uno de los 193 países tiene su propia economía, régimen, gobierno, estabilidad y poder
   militar, y cambia solo: crece o se estanca según el ciclo mundial, celebra elecciones y cambia de
   ideología, sufre golpes, crisis y guerras civiles. Los bloques (OTAN, UE, BRICS, ALBA, Mercosur…) agrupan
   países y definen tres ejes de alineamiento —Occidente, multipolar y bolivariano— que miden con quién
   estás bien. Los conflictos entre países escalan, estallan en guerra y mueven el petróleo; como Presidente
   tomas posición, medias o sancionas. La ideología viva de cada gobierno alimenta la relación con Colombia. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const REG = { democracia: 'Democracia', hibrido: 'Régimen híbrido', autoritario: 'Autoritario', monarquia: 'Monarquía' };
  const EJES = { occidente: 'Occidente', multipolar: 'Multipolar', bolivariano: 'Bolivariano' };
  const H = id => C.Corte.hash(id + '#mv');
  const MICRO = 'AND LIE MCO SMR MLT ATG DMA GRD KNA VCT LCA BRB BHS SYC MDV CPV STP COM KIR MHL FSM NRU PLW WSM TON TUV VUT SLB FJI';

  const M = {
    REG, EJES,
    pais(E, id) { return E.mundoVivo.paises[id]; },
    regimenDe(id) { const r = C.DATA.regimenes; for (const [k, v] of Object.entries(r)) if (v.split(' ').includes(id)) return k; return 'democracia'; },
    bloquesDe(id) { return C.DATA.bloques.filter(b => b.m.includes(id)); },
    /* Eje geopolítico principal de un país. */
    alin(id) {
      const b = M.bloquesDe(id).find(x => x.alin); if (b) return b.alin;
      if (C.DATA.aliadosOccidente.includes(id)) return 'occidente'; if (C.DATA.aliadosMultipolar.includes(id)) return 'multipolar';
      return null;
    },
    ideoBase(id) {
      const d = C.DATA.paisesDestacados[id]; if (d) return { eco: d.eco, soc: d.soc };
      const reg = (C.DATA.paises.find(p => p.id === id) || {}).region, b = { 'Europa': [5, -25], 'Asia': [10, 20], 'África': [0, 25], 'Oceanía': [10, -10], 'Suramérica': [-10, 0], 'Centroamérica y Caribe': [-5, 10], 'Norteamérica': [15, -5] }[reg] || [0, 0];
      const arab = C.DATA.bloques.find(x => x.id === 'liga').m.includes(id);
      return { eco: U.clamp(b[0] + (H(id) - 0.5) * 60, -90, 90), soc: U.clamp(b[1] + (arab ? 30 : 0) + (H(id + 's') - 0.5) * 50, -90, 90) };
    },
    /* Cifras macro comparables (deuda %PIB, inflación, desempleo): se crean perezosamente para no romper partidas viejas */
    macro(id, p) {
      if (p.deuda != null) return p;
      const fijo = { VEN: [160, 180, 9], ARG: [85, 90, 7], TUR: [40, 55, 10], JPN: [255, 2, 2.6], USA: [123, 3.2, 4.1], CHN: [84, 0.5, 5], ZWE: [100, 150, 15], LBN: [280, 120, 30], SDN: [220, 100, 20], COL: [58, 5.1, 9.6], ITA: [140, 2, 7.5], GRC: [160, 3, 11] }[id];
      p.deuda = fijo ? fijo[0] : Math.round(25 + H(id + 'd') * 75); p.inflacion = fijo ? fijo[1] : +(1.5 + Math.pow(H(id + 'i'), 2) * 14).toFixed(1); p.desempleo = fijo ? fijo[2] : +(3 + H(id + 'u') * 13).toFixed(1);
      return p;
    },
    nombreLider() { const h = U.chance(0.7); return `${U.pick(h ? C.DATA.nombres.h : C.DATA.nombres.m)} ${U.pick(C.DATA.nombres.a)}`; },
    asegurar(E) {
      if (E.mundoVivo && E.mundoVivo.paises) return E.mundoVivo;
      const paises = {}, hoy = U.hoy();
      for (const p of C.DATA.paises.concat([{ id: 'COL', nombre: 'Colombia', region: 'Suramérica' }])) {
        const id = p.id, eco = C.DATA.economias[id], micro = MICRO.split(' ').includes(id), reg = p.region;
        const rango = { 'África': [4, 70], 'Asia': [8, 220], 'Europa': [12, 350], 'Suramérica': [8, 120], 'Centroamérica y Caribe': [3, 60], 'Oceanía': [1, 20], 'Norteamérica': [200, 2000] }[reg] || [5, 100];
        const pib = eco ? eco[0] : (micro ? 0.3 + H(id) * 8 : rango[0] + Math.pow(H(id), 2) * (rango[1] - rango[0]));
        const reg_ = M.regimenDe(id), ide = M.ideoBase(id);
        const mil = U.clamp(12 + Math.log10(Math.max(1, pib)) * 20 + (reg_ === 'autoritario' ? 8 : 0) + H(id + 'm') * 12 + ({ USA: 30, CHN: 22, RUS: 22, IND: 12, ISR: 14, PRK: 20, TUR: 8, IRN: 8 }[id] || 0), 3, 99);
        paises[id] = { pib, pob: eco ? eco[1] : Math.max(0.05, pib / (0.5 + H(id + 'p') * 12)), crec: 2.5, estab: reg_ === 'autoritario' ? 60 : reg_ === 'hibrido' ? 45 : 65, regimen: reg_, eco: ide.eco, soc: ide.soc, lider: M.nombreLider(), militar: Math.round(mil),
          proxElec: reg_ === 'democracia' || reg_ === 'hibrido' ? E.fecha.t + U.ri(10, 200) : null, crisis: null, migracion: 0 };
      }
      const conf = C.DATA.conflictos.map(c => ({ id: c.id, a: c.a, b: c.b, n: c.n, t: c.t, estado: 'latente', t0: null, mediacion: 0 }));
      E.mundoVivo = { paises, conflictos: conf, historial: [], presion: { occidente: 0, multipolar: 0, bolivariano: 0 }, sanciones: {}, hechos: {}, ultimaPresion: E.fecha.t };
      for (const c of E.mundoVivo.conflictos) { const d = C.DATA.conflictos.find(x => x.id === c.id); if (d.guerra && (hoy.getUTCFullYear() > d.guerra.y)) { c.estado = 'guerra'; c.t = 88; c.t0 = E.fecha.t; E.mundoVivo.hechos[c.id] = true; } }
      return E.mundoVivo;
    },
    init(E) { E.mundoVivo = null; M.asegurar(E); },
    migrar(E) { M.asegurar(E); },
    nombre(id) { const p = C.Diplomacia.pais(id); return p ? p.nombre : id === 'COL' ? 'Colombia' : id; },
    relevante(E, id) { const q = M.asegurar(E).paises[id]; return !!C.DATA.paisesDestacados[id] || q.pib > 600 || ['VEN', 'ECU', 'PER', 'PAN', 'BRA'].includes(id); },
    noticia(E, id, txt, tono, imp) { const v = M.asegurar(E), r = { t: E.fecha.t, id, txt }; v.historial.unshift(r); if (v.historial.length > 40) v.historial.pop(); if (E.meta.presim) return; C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: tono || 0, importante: imp != null ? imp : M.relevante(E, id) }); },

    /* ── Bonos que alimentan la relación bilateral (Diplomacia los suma al objetivo) ── */
    bonusRel(E, id) { const v = M.asegurar(E), a = M.alin(id); return (a ? v.presion[a] : 0) - (v.sanciones[id] ? 28 : 0) - (M.pais(E, id).crisis && M.pais(E, id).crisis.tipo === 'guerra civil' ? 0 : 0); },
    alineamiento(E) {
      const out = {}, ps = C.Diplomacia.paises();
      for (const k of Object.keys(EJES)) { const xs = ps.filter(p => M.alin(p.id) === k).map(p => E.diplomacia.paises[p.id].relacion); out[k] = xs.length ? U.prom(xs) : 50; }
      return out;
    },
    mover(E, ids, d) { for (const id of ids) { const st = E.diplomacia.paises[id]; if (st) st.relacion = U.clamp(st.relacion + d, 3, 97); } },
    moverAlin(E, k, d) { M.mover(E, C.Diplomacia.paises().filter(p => M.alin(p.id) === k).map(p => p.id), d); M.asegurar(E).presion[k] = U.clamp(M.asegurar(E).presion[k] + d * 0.6, -18, 18); },
    moverBloque(E, bid, d) { const b = C.DATA.bloques.find(x => x.id === bid); if (b) M.mover(E, b.m, d); },

    turno(E) {
      const v = M.asegurar(E), ciclo = E.mundoEco ? E.mundoEco.ciclo : 0.8;
      for (const k of Object.keys(v.presion)) v.presion[k] *= 0.996;
      for (const [id, p] of Object.entries(v.paises)) {
        p.crec = U.clamp(p.crec + (2.5 + (ciclo - 0.8) * 0.9 + (p.estab - 50) * 0.02 - p.crec) * 0.05 + U.gauss(0, 0.15) - (p.crisis ? 0.25 : 0), -12, 12);
        p.pib = Math.max(0.1, p.pib * (1 + p.crec / 100 / 52));
        const base = p.regimen === 'autoritario' ? 60 : p.regimen === 'hibrido' ? 45 : p.regimen === 'monarquia' ? 60 : 65;
        p.estab = U.clamp(p.estab + (base - p.estab) * 0.004 + U.gauss(0, 0.7) + (p.crec < 0 ? -0.3 : 0) - (p.crisis ? 0.3 : 0), 2, 98);
        M.macro(id, p);
        p.inflacion = U.clamp(p.inflacion + (3 + (p.estab < 30 ? 20 : 0) + (p.crisis ? 6 : 0) - p.inflacion) * 0.004 + U.gauss(0, 0.05), 0, 400);
        p.desempleo = U.clamp(p.desempleo + (4 + Math.max(0, 3 - p.crec) * 1.4 + (p.crisis ? 3 : 0) - p.desempleo) * 0.01, 1, 45);
        p.deuda = U.clamp(p.deuda + (p.crec < 1 ? 0.03 : -0.015) + (p.crisis ? 0.04 : 0), 5, 400);
        if (E.meta.presim) continue;
        if (p.crisis) { if (E.fecha.t >= p.crisis.hasta) M.terminarCrisis(E, id, p); continue; }
        if (p.proxElec != null && E.fecha.t >= p.proxElec && p.regimen !== 'autoritario') M.elecciones(E, id, p);
        else if (p.estab < 35 && U.chance(0.0012 * (p.regimen === 'democracia' ? 0.4 : 1))) M.golpe(E, id, p);
        else if (p.estab < 16 && U.chance(0.003)) M.guerraCivil(E, id, p);
        else if (p.crec < -1.5 && U.chance(0.01)) M.recesion(E, id, p);
      }
      M.turnoConflictos(E, v);
      if (E.gobierno.presidente === 'J' && !E.meta.presim && E.fecha.t - v.ultimaPresion > 52 && U.chance(0.01)) M.presion(E, v);
    },
    elecciones(E, id, p) {
      const antes = p.eco;
      p.eco = U.clamp(p.eco + (U.chance(0.6) ? -Math.sign(p.eco || 1) : 1) * U.rf(8, 34) + U.gauss(0, 8), -95, 95); p.soc = U.clamp(p.soc + U.gauss(0, 15), -95, 95);
      p.lider = M.nombreLider(); p.proxElec = E.fecha.t + U.ri(180, 240); p.estab = U.clamp(p.estab + 4, 2, 98);
      const giro = p.eco > antes + 12 ? 'gira a la derecha' : p.eco < antes - 12 ? 'gira a la izquierda' : 'se mantiene en el centro';
      M.noticia(E, id, `Elecciones en ${M.nombre(id)}: gana ${p.lider} y el país ${giro}`, 0);
    },
    golpe(E, id, p) {
      p.regimen = 'autoritario'; p.eco = U.clamp(p.eco + U.gauss(0, 30), -95, 95); p.soc = U.clamp(p.soc + U.rf(10, 35), -95, 95); p.lider = M.nombreLider(); p.proxElec = null; p.estab = 42; p.crisis = { tipo: 'golpe', hasta: E.fecha.t + U.ri(20, 50) };
      for (const s of M.vecinosDe(id)) M.pais(E, s).migracion += 1;
      M.noticia(E, id, `Golpe de Estado en ${M.nombre(id)}: los militares toman el poder`, -1, true);
    },
    guerraCivil(E, id, p) {
      p.crisis = { tipo: 'guerra civil', hasta: E.fecha.t + U.ri(50, 160) }; p.estab = Math.max(5, p.estab - 4);
      M.noticia(E, id, `Estalla una guerra civil en ${M.nombre(id)}`, -1, true);
      for (const s of M.vecinosDe(id)) M.pais(E, s).migracion += 3;
      if (['VEN', 'ECU', 'PER', 'PAN', 'BRA', 'NIC'].includes(id) && E.gobierno.presidente === 'J') C.Eventos.disparar(E, C.Eventos.plantilla('dipMigracion'), { vars: { pais: M.nombre(id) }, pais: id });
    },
    recesion(E, id, p) { p.crisis = { tipo: 'recesión', hasta: E.fecha.t + U.ri(26, 80) }; M.noticia(E, id, `${M.nombre(id)} entra en recesión`, -1); },
    terminarCrisis(E, id, p) { const t = p.crisis.tipo; p.crisis = null; p.estab = Math.max(p.estab, 35); if (t === 'guerra civil') p.regimen = p.regimen === 'autoritario' ? 'autoritario' : 'hibrido'; M.noticia(E, id, `${t === 'guerra civil' ? 'Termina la guerra civil' : t === 'golpe' ? 'La junta anuncia un calendario de transición' : 'Se supera la recesión'} en ${M.nombre(id)}`, 1); },
    vecinosDe(id) {
      const c = C.DATA.coords[id]; if (!c) return [];
      return Object.entries(C.DATA.coords).filter(([k, q]) => k !== id && Math.hypot(q[0] - c[0], (q[1] - c[1]) * 1.3) < 14).map(([k]) => k);
    },

    /* ── Conflictos entre países ── */
    turnoConflictos(E, v) {
      const hoy = U.hoy();
      for (const c of v.conflictos) {
        const d = C.DATA.conflictos.find(x => x.id === c.id);
        if (d.guerra && !v.hechos[c.id] && (hoy.getUTCFullYear() > d.guerra.y || (hoy.getUTCFullYear() === d.guerra.y && hoy.getUTCMonth() >= d.guerra.m))) { v.hechos[c.id] = true; c.t = 90; M.estallar(E, c); }
        c.t = U.clamp(c.t + U.gauss(0, 0.7) + (c.estado === 'guerra' ? -0.05 : 0) - c.mediacion * 0.02, 5, 100); c.mediacion = Math.max(0, c.mediacion - 0.05);
        if (E.meta.presim) continue;
        if (c.estado === 'latente' && c.t > 72) { c.estado = 'crisis'; M.noticia(E, c.a, `Se dispara la tensión en ${c.n}: movilizaciones y amenazas`, -1); }
        else if (c.estado === 'crisis' && c.t > 88 && U.chance(0.04)) M.estallar(E, c);
        else if (c.estado === 'crisis' && c.t < 55) { c.estado = 'latente'; M.noticia(E, c.a, `Se distiende ${c.n}`, 1); }
        else if (c.estado === 'guerra' && c.t < 60 && U.chance(0.03)) { c.estado = 'crisis'; M.noticia(E, c.a, `Cese al fuego en ${c.n}`, 1, true); M.mover(E, [], 0); }
      }
    },
    estallar(E, c) {
      c.estado = 'guerra'; c.t0 = E.fecha.t;
      const petro = ['RUS', 'IRN', 'SAU', 'ISR', 'IRQ'].some(x => x === c.a || x === c.b);
      if (E.mundoEco) { if (petro) E.mundoEco.regimen = { dir: 1.5, hasta: E.fecha.t + 30 }; E.mundoEco.ciclo = U.clamp(E.mundoEco.ciclo - 0.4, -6, 5); }
      for (const id of [c.a, c.b]) { const p = M.pais(E, id); if (p) { p.crisis = { tipo: 'guerra', hasta: E.fecha.t + 60 }; p.estab = Math.max(10, p.estab - 12); } }
      M.noticia(E, c.a, `Estalla la guerra: ${c.n}`, -1, true);
      if (E.gobierno.presidente === 'J') C.Eventos.disparar(E, C.Eventos.plantilla('conflictoPosicion'), { cid: c.id, aId: c.a, bId: c.b, vars: { conflicto: c.n, a: M.nombre(c.a), b: M.nombre(c.b) } });
    },
    presion(E, v) {
      v.ultimaPresion = E.fecha.t; const al = M.alineamiento(E);
      const id = al.occidente >= al.multipolar ? 'presionMultipolar' : 'presionOccidente';
      C.Eventos.disparar(E, C.Eventos.plantilla(id), {});
    },

    registrarAcciones() {
      const A = C.Acciones, pres = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente conduce la política exterior';
      A.registrar({ id: 'sancionarPais', nombre: 'Sancionar a un país', icono: '🚫', grupo: 'diplomacia', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const v = M.asegurar(E), p = M.pais(E, a.pais); if (!p || a.pais === 'COL') return { ok: false, msg: 'Elige un país' };
          if (v.sanciones[a.pais]) return { ok: false, msg: 'Ya lo estás sancionando' };
          v.sanciones[a.pais] = { t: E.fecha.t }; p.pib *= 0.998; M.mover(E, [a.pais], -14);
          const al = M.alin(a.pais); if (al) M.moverAlin(E, al, -2);
          M.noticia(E, a.pais, `Colombia sanciona a ${M.nombre(a.pais)}`, 0, true); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(-1, 1), 3, 95);
          return { ok: true, msg: `Impones sanciones a ${M.nombre(a.pais)}: se enfría la relación` };
        } });
      A.registrar({ id: 'levantarSanciones', nombre: 'Levantar sanciones', icono: '✅', grupo: 'diplomacia', costo: 1, disponible: pres,
        ejecutar(E, a) { const v = M.asegurar(E); if (!v.sanciones[a.pais]) return { ok: false, msg: 'No hay sanciones vigentes' }; delete v.sanciones[a.pais]; M.mover(E, [a.pais], 6); return { ok: true, msg: `Levantas las sanciones a ${M.nombre(a.pais)}` }; } });
      A.registrar({ id: 'mediarConflicto', nombre: 'Ofrecer mediación', icono: '🕊', grupo: 'diplomacia', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const v = M.asegurar(E), c = v.conflictos.find(x => x.id === a.conflicto); if (!c) return { ok: false, msg: 'Elige el conflicto' };
          if (c.estado === 'latente' && c.t < 40) return { ok: false, msg: 'Allí no hace falta mediar' };
          const ra = E.diplomacia.paises[c.a] ? E.diplomacia.paises[c.a].relacion : 50, rb = E.diplomacia.paises[c.b] ? E.diplomacia.paises[c.b].relacion : 50;
          const q = C.Exterior ? Math.max(C.Exterior.calidadEfectiva(E, c.a), C.Exterior.calidadEfectiva(E, c.b)) : 0;
          const prob = U.clamp(0.15 + (Math.min(ra, rb) - 40) / 200 + q / 300 + (E.exterior && E.exterior.misiones.onu && E.exterior.misiones.onu.jefe ? 0.06 : 0), 0.08, 0.7);
          if (U.chance(prob)) { c.mediacion += 25; c.t = Math.max(5, c.t - 14); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 1, 3, 95); M.mover(E, [c.a, c.b], 3); M.noticia(E, c.a, `La mediación de Colombia distiende ${c.n}`, 1, true); return { ok: true, msg: `Tu mediación funciona: baja la tensión en ${c.n}` }; }
          M.mover(E, [c.a, c.b], -1); return { ok: true, msg: 'Las partes rechazan tu mediación', exito: false };
        } });
      A.registrar({ id: 'ayudaHumanitaria', nombre: 'Enviar ayuda humanitaria', icono: '📦', grupo: 'diplomacia', costo: 1, disponible: pres,
        ejecutar(E, a) { const p = M.pais(E, a.pais); if (!p || a.pais === 'COL') return { ok: false, msg: 'Elige un país' }; M.mover(E, [a.pais], U.rf(3, 6)); C.Economia.aplicarDelta(E, 'deficit', 0.02); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.2, 3, 95); return { ok: true, msg: `Envías ayuda a ${M.nombre(a.pais)}: mejora la relación` }; } });
    }
  };
  C.MundoVivo = M;
  C.Tiempo.registrar('mundovivo', M, 61);
  M.registrarAcciones();
})(window.CURUL);
