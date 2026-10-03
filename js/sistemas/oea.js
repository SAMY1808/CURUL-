/* OEA (Fase 43): Secretario General, Carta Democrática (Consejo Permanente y Asamblea General), suspensiones,
   Misiones de Observación Electoral y el caso en que la Carta se activa contra Colombia (golpe, autogolpe, democradura).
   El voto de cada país es estable (hash por caso) y se mueve con el cabildeo, la relación con Colombia y el Secretario General. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, D = () => C.DATA.multi, MV = () => C.MundoVivo;
  const esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: tono || 0, importante: !!imp, jugador: esPres(E) }); };
  const nom = id => id === 'COL' ? 'Colombia' : (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const O = {
    clave: 'oea',
    /* La OEA existe desde 1948 (Carta de Bogotá); su defensa de la democracia, desde la Resolución 1080 (1991) y la Carta Democrática (2001). */
    activa: () => U.anio() >= 1948, carta: () => U.anio() >= 1991,
    miembroCol(E) { const o = E.diplomacia && E.diplomacia.organismos.oea; return !!(o && o.miembro) && O.activa(); },
    asegurar(E) {
      if (E.oea && E.oea.paises) return E.oea;
      const paises = {}, y = U.anio(), mv = MV().asegurar(E);
      for (const id of D().OEA_MIEMBROS) {
        if (!C.Diplomacia.pais(id)) continue;
        const p = mv.paises[id], reg = p ? p.regimen : 'democracia';
        let ind = reg === 'democracia' ? U.ri(60, 85) : reg === 'hibrido' ? U.ri(35, 55) : U.ri(10, 30);
        let estado = 'miembro';
        if (id === 'CUB') { estado = 'inactivo'; ind = 8; }
        if (id === 'VEN' && y >= 2019) estado = 'retirado'; if (id === 'NIC' && y >= 2023) estado = 'retirado';
        paises[id] = { estado, ind, reg };
      }
      const sg = D().SG_OEA[0];
      E.oea = { sg: { nombre: sg[0], pais: sg[1], tend: sg[2], hasta: E.fecha.t + 5 * 52 }, paises, casos: [], hist: [], moe: [], col: { ind: 75, suspendida: false, caso: null } };
      return E.oea;
    },
    init(E) { E.oea = null; },
    migrar(E) { O.asegurar(E); },
    voluntarios(E) { return Object.keys(O.asegurar(E).paises).filter(id => O.asegurar(E).paises[id].estado === 'miembro'); },
    anotar(E, txt) { const o = O.asegurar(E); o.hist.unshift({ t: E.fecha.t, txt }); if (o.hist.length > 25) o.hist.length = 25; },
    /* Postura de cada miembro ante una suspensión: >0,5 = a favor. */
    voto(E, c, id) {
      const o = O.asegurar(E), mv = MV().asegurar(E), obj = c.pais, a = MV().alin(id), ao = obj === 'COL' ? (c.col || 'occidente') : MV().alin(obj);
      let s = 0.45 + (50 - (obj === 'COL' ? o.col.ind : o.paises[obj].ind)) / 220;
      if (a === 'occidente') s += ao === 'bolivariano' ? 0.22 : ao === 'multipolar' ? 0.08 : 0;
      if (a === 'bolivariano') s += ao === 'bolivariano' ? -0.32 : 0.08;
      if (a === 'multipolar') s -= 0.06;
      if (o.sg.tend === 'derecha') s += ao === 'bolivariano' ? 0.08 : -0.04; if (o.sg.tend === 'izquierda') s += ao === 'bolivariano' ? -0.08 : 0.04;
      s += ((E.diplomacia.paises[id] || { relacion: 50 }).relacion - 50) * (c.inicia === 'J' || obj === 'COL' ? 0.002 * (obj === 'COL' ? -1 : 1) : 0.001);
      s += (c.lobby[id] || 0) + (C.Corte.hash(c.id + id) - 0.5) * 0.35 + (/golpe/.test(c.motivo) ? 0.1 : 0);
      return s;
    },
    votos(E, c) {
      const o = O.asegurar(E), v = O.voluntarios(E).filter(id => id !== c.pais); let f = 0, n = 0;
      for (const id of v) { if (O.voto(E, c, id) > 0.55) f++; else n++; }
      if (c.pais !== 'COL' && O.miembroCol(E)) { const j = c.votoJ; if (j === 1) f++; else n++; }
      return { favor: f, contra: n, total: f + n, necesario: Math.ceil((f + n) * (c.fase === 'asamblea' ? 2 / 3 : 0.5 + 0.0001)) };
    },
    abrir(E, pais, inicia, motivo) {
      const o = O.asegurar(E); if (!O.carta() && pais !== 'COL') return null;
      if (o.casos.some(c => c.pais === pais && ['consejo', 'asamblea'].includes(c.fase))) return null;
      const c = { id: U.id('oea'), pais, inicia, motivo, fase: 'consejo', t0: E.fecha.t, dur: U.ri(5, 9), lobby: {}, votoJ: 0, resultado: null, col: pais === 'COL' ? (C.Regimen && E.regimen && E.regimen.tipo === 'democradura' ? 'occidente' : 'occidente') : null };
      o.casos.unshift(c); if (o.casos.length > 12) o.casos.length = 12;
      if (pais === 'COL') { o.col.caso = c.id; const r = E.regimen; if (r) o.col.ind = Math.min(o.col.ind, { democracia: 70, democradura: 40, autoritario: 22, junta: 14 }[r.tipo] || 40); }
      O.anotar(E, `Se activa la Carta Democrática: ${nom(pais)} (${motivo})`);
      noti(E, `OEA: el Consejo Permanente examina la situación de ${nom(pais)} bajo la Carta Democrática (${motivo})`, -1, true);
      if (esPres(E) && pais !== 'COL' && O.miembroCol(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_oea_voto'), { forzar: true, vars: { pais: nom(pais), cid: c.id } });
      else if (pais === 'COL' && !E.meta.presim && esPres(E) && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_oea_col'), { forzar: true });
      return c;
    },
    votoJ(E, cid, v) {
      const c = O.asegurar(E).casos.find(x => x.id === cid); if (!c) return 'La votación ya se resolvió';
      c.votoJ = v; const a = MV().alin(c.pais), P = MV().asegurar(E).presion;
      if (a && v !== 0) P[a] = cl(P[a] + (v === 1 ? -1.2 : 1.2), -40, 40);
      const st = E.diplomacia.paises[c.pais]; if (st && v === 1) st.relacion = cl(st.relacion - 5, 3, 97); if (st && v === -1) st.relacion = cl(st.relacion + 3, 3, 97);
      return C.Pais.ef(E, { rec: 0.4, poder: { ong: v === 1 ? 2 : v === -1 ? -2 : 0 } });
    },
    resolver(E, c) {
      const o = O.asegurar(E), p = o.paises[c.pais], t = O.votos(E, c);
      if (c.fase === 'consejo') {
        if (t.favor >= t.necesario) { c.fase = 'asamblea'; c.dur = U.ri(5, 9); c.t0 = E.fecha.t; noti(E, `OEA: el Consejo Permanente aprueba convocar una Asamblea General extraordinaria sobre ${nom(c.pais)}`, -1); }
        else { c.fase = 'cerrado'; c.resultado = 'sin mayoría'; noti(E, `OEA: no prospera el debate sobre ${nom(c.pais)} (${t.favor} votos a favor de ${t.total})`, 0); O.anotar(E, `La Carta Democrática no prospera contra ${nom(c.pais)}`); if (c.pais === 'COL') o.col.caso = null; }
      } else if (c.fase === 'asamblea') {
        if (t.favor >= t.necesario) {
          c.fase = 'suspendido'; c.resultado = `suspensión (${t.favor}/${t.total})`;
          if (c.pais === 'COL') { o.col.suspendida = true; if (E.regimen && E.regimen.junta) E.regimen.junta.aislamiento = cl(E.regimen.junta.aislamiento + 12, 0, 100); E.economia.confianza = cl(E.economia.confianza - 3, 5, 95); }
          else if (p) { p.estado = 'suspendido'; const mp = MV().pais(E, c.pais); if (mp) mp.estab = Math.max(3, mp.estab - 4); const st = E.diplomacia.paises[c.pais]; if (st) st.relacion = cl(st.relacion - (c.inicia === 'J' ? 8 : 3), 3, 97); }
          noti(E, `OEA SUSPENDE a ${nom(c.pais)} por la ruptura del orden democrático (${t.favor} votos de ${t.total})`, c.pais === 'COL' ? -1 : 0, true); O.anotar(E, `${nom(c.pais)} es suspendida de la OEA`);
        } else { c.fase = 'cerrado'; c.resultado = 'sin dos tercios'; noti(E, `OEA: no se alcanzan los dos tercios para suspender a ${nom(c.pais)} (${t.favor}/${t.total})`, c.pais === 'COL' ? 1 : 0, true); if (c.pais === 'COL') o.col.caso = null; }
      }
    },
    respuestaCol(E, via) {
      const o = O.asegurar(E), c = o.casos.find(x => x.id === o.col.caso), r = E.regimen;
      if (via === 'aceptar') { if (c) for (const id of O.voluntarios(E)) c.lobby[id] = (c.lobby[id] || 0) - 0.12; if (r && !r.transicion && C.Regimen && !C.Regimen.democratico(E)) C.Regimen.iniciarTransicion(E, 'la presión de la OEA', true); return C.Pais.ef(E, { rec: 1 }); }
      if (via === 'cabildeo') { if (c) for (const id of O.voluntarios(E)) if (MV().alin(id) !== 'occidente') c.lobby[id] = (c.lobby[id] || 0) - 0.15; return C.Pais.ef(E, { rec: 0.5 }); }
      O.retiro(E); return 'Colombia denuncia la Carta de la OEA: queda aislada del sistema interamericano';
    },
    retiro(E) {
      const o = O.asegurar(E), st = E.diplomacia.organismos.oea; if (st) st.miembro = false;
      for (const c of o.casos) if (c.pais === 'COL') { c.fase = 'cerrado'; c.resultado = 'Colombia denunció la Carta'; } o.col.caso = null;
      if (E.regimen && E.regimen.junta) E.regimen.junta.aislamiento = cl(E.regimen.junta.aislamiento + 10, 0, 100);
      E.economia.confianza = cl(E.economia.confianza - 2, 5, 95); noti(E, 'Colombia se retira de la OEA', -1, true); O.anotar(E, 'Colombia denuncia la Carta de la OEA');
    },
    /* Misión de observación electoral */
    moe(E, res) {
      if (E.meta.presim || U.anio() < 1962 || !O.miembroCol(E)) return;
      const r = E.regimen || {}, lim = r.transicion || (r.tipo && r.tipo !== 'democracia');
      let q = U.ri(70, 92) - (r.tipo === 'democradura' ? 30 : 0) - (lim ? 18 : 0);
      const txt = q >= 70 ? 'elecciones libres, con incidentes menores' : q >= 50 ? 'elecciones competitivas, pero con ventajas indebidas del oficialismo' : 'elecciones sin garantías suficientes de imparcialidad';
      const o = O.asegurar(E); o.moe.unshift({ t: E.fecha.t, q, txt }); if (o.moe.length > 8) o.moe.length = 8;
      o.col.ind = cl(o.col.ind + (q - 65) * 0.1, 0, 100);
      noti(E, `La misión de observación de la OEA califica las elecciones: ${txt}`, q >= 70 ? 1 : -1);
      if (esPres(E) && !E.eventos.pendientes.length && q < 70) C.Eventos.disparar(E, C.Eventos.plantilla('ml_moe'), { forzar: true, vars: { txt } });
    },
    turno(E) {
      const o = O.asegurar(E), t = E.fecha.t; if (!O.activa()) return;
      // Colombia: índice democrático según el régimen
      const r = E.regimen; if (r) { const base = { democracia: 78, democradura: 42, autoritario: 20, junta: 12 }[r.tipo] || 70; o.col.ind = cl(o.col.ind + (base - o.col.ind) * 0.02, 0, 100); }
      if (t % 4 === 0) for (const [id, p] of Object.entries(o.paises)) {
        const mp = MV().pais(E, id); if (!mp) continue;
        const prev = p.reg; p.reg = mp.regimen; const base = mp.regimen === 'democracia' ? 72 : mp.regimen === 'hibrido' ? 45 : 18;
        p.ind = cl(p.ind + (base - p.ind) * 0.03 + U.gauss(0, 1), 0, 100);
        if (mp.crisis && mp.crisis.tipo === 'golpe' && !p.golpeVisto) { p.golpeVisto = true; p.ind = Math.min(p.ind, 14); }
        if (!mp.crisis) p.golpeVisto = false;
        if (p.estado === 'miembro' && O.carta() && (p.ind < 28 && prev !== p.reg || (mp.crisis && mp.crisis.tipo === 'golpe' && p.golpeVisto && U.chance(0.25))) && U.chance(0.6)) O.abrir(E, id, 'npc', mp.crisis && mp.crisis.tipo === 'golpe' ? 'golpe de Estado' : 'deterioro democrático');
        if (p.estado === 'miembro' && O.carta() && p.ind < 30 && !o.casos.some(c => c.pais === id && ['consejo', 'asamblea'].includes(c.fase)) && t - (p.ult || -999) > 150 && U.chance(0.02)) { p.ult = t; O.abrir(E, id, 'npc', 'deterioro democrático'); }
        if (p.estado === 'suspendido' && p.ind >= 60) { p.estado = 'miembro'; noti(E, `OEA: ${nom(id)} es readmitida tras restablecer el orden democrático`, 1); O.anotar(E, `${nom(id)} es readmitida`); }
      }
      for (const c of o.casos) if (['consejo', 'asamblea'].includes(c.fase) && t - c.t0 >= c.dur) O.resolver(E, c);
      // Colombia rompe el orden democrático: golpe, autogolpe o democradura
      if (r && O.carta() && O.miembroCol(E) && !o.col.caso && !o.col.suspendida && (r.tipo === 'junta' || r.tipo === 'autoritario' || r.tipo === 'democradura') && t - (r.desde || 0) > 3 && t - (o.col.ult || -999) > 60 && U.chance(0.3)) { o.col.ult = t; O.abrir(E, 'COL', 'npc', r.tipo === 'democradura' ? 'captura de las instituciones' : 'golpe de Estado'); }
      // Colombia suspendida: aislamiento creciente hasta que regrese la democracia
      if (o.col.suspendida && r && r.junta) r.junta.aislamiento = cl(r.junta.aislamiento + 0.04, 0, 100);
      // Secretario General
      if (t >= o.sg.hasta) { const s = U.pick(D().SG_OEA); o.sg = { nombre: s[0], pais: s[1], tend: s[2], hasta: t + 5 * 52 }; noti(E, `La OEA elige a ${s[0]} como Secretario General`, 0); O.anotar(E, `Nuevo Secretario General: ${s[0]} (${s[2]})`); }
    },
    registrarAcciones() {
      const A = C.Acciones;
      const caso = (E, a) => O.asegurar(E).casos.find(c => c.id === a.caso);
      A.registrar({ id: 'invocarCarta', nombre: 'Invocar la Carta Democrática contra un país', icono: '📜', grupo: 'diplomacia', costo: 3,
        disponible(E, a) { if (!esPres(E)) return 'Sólo el Presidente'; if (!O.miembroCol(E)) return 'Colombia no está en la OEA'; if (!O.carta()) return 'El mecanismo de defensa de la democracia existe desde 1991'; const p = O.asegurar(E).paises[a.pais]; if (!p) return 'Elige el país'; if (p.estado !== 'miembro') return 'Ese país no participa en la OEA'; if (O.asegurar(E).casos.some(c => c.pais === a.pais && ['consejo', 'asamblea'].includes(c.fase))) return 'Ya hay un caso abierto'; return true; },
        ejecutar(E, a) { const c = O.abrir(E, a.pais, 'J', 'solicitud de Colombia'); const st = E.diplomacia.paises[a.pais]; if (st) st.relacion = cl(st.relacion - 6, 3, 97); return { ok: !!c, msg: c ? `Colombia solicita activar la Carta Democrática contra ${nom(a.pais)}` : 'No se pudo abrir el caso' }; } });
      A.registrar({ id: 'cabildearOEA', nombre: 'Cabildear votos en la OEA', icono: '🤝', grupo: 'diplomacia', costo: 1,
        disponible(E, a) { if (!esPres(E) && !(E.regimen && !C.Regimen.democratico(E) && E.regimen.junta && E.regimen.junta.lider === 'J')) return 'Sólo quien gobierna'; const c = caso(E, a); return c && ['consejo', 'asamblea'].includes(c.fase) ? true : 'Elige un caso en curso'; },
        ejecutar(E, a) { const c = caso(E, a), v = O.voluntarios(E).filter(id => id !== c.pais), sig = c.pais === 'COL' ? -1 : (a.lado === 'contra' ? -1 : 1);
          for (const id of v) if ((E.diplomacia.paises[id] || { relacion: 0 }).relacion >= 48) c.lobby[id] = (c.lobby[id] || 0) + 0.06 * sig;
          const t = O.votos(E, c); return { ok: true, msg: `Llamadas, cartas y viajes: ahora ${t.favor} de ${t.total} países apoyarían la suspensión` }; } });
      A.registrar({ id: 'pedirCartaDemocratica', nombre: 'Pedir a la OEA que active la Carta Democrática sobre Colombia', icono: '🆘', grupo: 'diplomacia', costo: 2,
        disponible(E) { if (esPres(E)) return 'Eres el Gobierno'; if (!O.carta()) return 'El mecanismo de defensa de la democracia existe desde 1991'; if (!O.miembroCol(E)) return 'Colombia no está en la OEA'; if (!E.regimen || C.Regimen.democratico(E)) return 'Colombia sigue siendo una democracia'; return O.asegurar(E).col.caso ? 'Ya hay un caso abierto' : true; },
        ejecutar(E) { const c = O.abrir(E, 'COL', 'oposicion', 'denuncia de la oposición'); C.Opinion.subirRec(E, 2); return { ok: !!c, msg: 'Presentas la denuncia ante la OEA: el Consejo Permanente examina la situación del país' }; } });
      A.registrar({ id: 'denunciarCartaOEA', nombre: 'Denunciar la Carta de la OEA (retirar a Colombia)', icono: '🚪', grupo: 'diplomacia', costo: 2,
        disponible(E) { return esPres(E) && O.miembroCol(E) ? true : 'Sólo el Presidente, si Colombia está en la OEA'; },
        ejecutar(E) { O.retiro(E); return { ok: true, msg: 'Colombia se retira de la OEA' }; } });
    }
  };
  C.OEA = O; C.Tiempo.registrar('oea', O, 71); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('OEA'); O.registrarAcciones();
  C.Bus.on('eleccion', res => { try { O.moe(C.E, res); } catch (e) { console.error('[OEA] moe', e); } });
  C.Bus.on('regimen:democracia', () => { const E = C.E, o = O.asegurar(E); if (o.col.suspendida) { o.col.suspendida = false; noti(E, 'La OEA levanta la suspensión de Colombia tras el regreso a la democracia', 1, true); O.anotar(E, 'Colombia es readmitida en la OEA'); } o.col.caso = null; });
})(window.CURUL);
