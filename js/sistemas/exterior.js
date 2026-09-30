/* Servicio exterior: embajadas, consulados, agregadurías, misiones ante organismos y el Consejo de
   Seguridad de la ONU. Complementa a Diplomacia (relaciones, tratados y organismos): una embajada con
   buen embajador mejora la relación con ese país semana a semana —y con ella los TLC y la adhesión al
   Mercosur, que dependen de ella—; los consulados atienden a la diáspora y traen remesas; las
   misiones ante organismos sostienen la candidatura al Consejo de Seguridad; y los incidentes
   diplomáticos (connacionales detenidos, expulsiones, migración, cumbres) exigen decisiones. Los
   embajadores políticos renuncian cuando cambia el gobierno. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TIPOS = { carrera: 'Diplomático de carrera', politico: 'Político de confianza' };
  const CUPO = 60;

  const X = {
    TIPOS, CUPO,
    asegurar(E) {
      if (E.exterior && E.exterior.embajadas) return E.exterior;
      E.exterior = { embajadas: {}, consulados: {}, agregadurias: {}, misiones: {}, csnu: { miembro: false, hasta: null, candidatura: null, ultimoVoto: 0, veces: 0 }, historial: [], gobId: E.gobierno.desde, incidentes: 0 };
      const dest = C.DATA.paisesDestacados, dia = C.DATA.diaspora;
      for (const p of C.Diplomacia.paises()) if (dest[p.id] || (dia[p.id] || 0) >= 100) E.exterior.embajadas[p.id] = { abierta: true, embajador: X.generarCarrera(E), desde: E.fecha.t };
      for (const [id, n] of Object.entries(dia)) E.exterior.consulados[id] = n >= 500 ? 2 : n >= 100 ? 1 : 0;
      for (const [oid, st] of Object.entries(E.diplomacia.organismos)) if (st.miembro && ['onu', 'oea'].includes(oid)) E.exterior.misiones[oid] = { jefe: X.generarCarrera(E) };
      return E.exterior;
    },
    init(E) { E.exterior = null; X.asegurar(E); },
    migrar(E) { X.asegurar(E); },
    generarCarrera(E) {
      const g = U.chance(0.5);
      return { tipo: 'carrera', nombre: `${U.pick(g ? C.DATA.nombres.h : C.DATA.nombres.m)} ${U.pick(C.DATA.nombres.a)} ${U.pick(C.DATA.nombres.a)}`, calidad: U.ri(45, 85), eco: U.ri(-15, 15), soc: U.ri(-15, 15), desde: E.fecha.t };
    },
    desdePolitico(E, p) {
      return { tipo: 'politico', pol: p.id, nombre: p.nombre, calidad: Math.round(U.clamp(35 + p.r.int * 0.25 + p.r.car * 0.2 + p.r.exp * 0.15, 25, 92)), eco: p.eco, soc: p.soc, desde: E.fecha.t };
    },
    candidatos(E) { return Object.values(E.politicos).filter(p => p.activo && !p.cargo && !p.embajadorEn && p.id !== 'J' && p.nombre).sort((a, b) => (b.r.int + b.r.car + b.r.exp) - (a.r.int + a.r.car + a.r.exp)).slice(0, 25); },
    nombre(pid) { const p = C.Diplomacia.pais(pid); return p ? p.nombre : pid; },
    abiertas(E) { return Object.entries(X.asegurar(E).embajadas).filter(([, e]) => e.abierta); },
    esGestor(E) { return E.gobierno.presidente === 'J' || (E.jugador.cargo === 'ministro' && E.jugador.cargoInfo && E.jugador.cargoInfo.ministerio === 'exteriores'); },
    /* Afinidad 0-1 entre un embajador y el gobierno del país anfitrión (si hay ideología curada). */
    afinidad(pid, emb) { const d = C.DATA.paisesDestacados[pid]; return d ? U.clamp(1 - U.distIdeo(emb, d) * 2, 0, 1) : 0.5; },
    calidadEfectiva(E, pid) { const e = X.asegurar(E).embajadas[pid]; return e && e.abierta ? (e.embajador ? e.embajador.calidad : 30) : 0; },
    diasporaAtendida(E) {
      const d = C.DATA.diaspora, x = X.asegurar(E); let tot = 0, at = 0;
      for (const [id, n] of Object.entries(d)) { tot += n; at += n * Math.min(1, (x.consulados[id] || 0) / 3) * (x.embajadas[id] && x.embajadas[id].abierta ? 1 : 0.5); }
      return tot ? at / tot * 100 : 0;
    },

    turno(E) {
      const x = X.asegurar(E), D = E.diplomacia;
      // Cambio de gobierno: renuncian los embajadores políticos
      if (x.gobId !== E.gobierno.desde) {
        x.gobId = E.gobierno.desde; let n = 0;
        const libera = em => { if (em && em.pol && E.politicos[em.pol]) E.politicos[em.pol].embajadorEn = null; };
        for (const e of Object.values(x.embajadas)) if (e.embajador && e.embajador.tipo === 'politico') { libera(e.embajador); e.embajador = null; n++; }
        for (const m of Object.values(x.misiones)) if (m.jefe && m.jefe.tipo === 'politico') { libera(m.jefe); m.jefe = null; n++; }
        if (n && !E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Con el nuevo Gobierno renuncian ${n} embajadores políticos`, tono: 0, importante: E.gobierno.presidente === 'J' });
      }
      const nuevoJ = E.gobierno.presidente === 'J';
      for (const [pid, e] of Object.entries(x.embajadas)) {
        if (!e.abierta) continue;
        if (!e.embajador && !nuevoJ && U.chance(0.1)) e.embajador = X.generarCarrera(E);
        const st = D.paises[pid]; if (!st) continue;
        const q = e.embajador ? e.embajador.calidad : 30, afin = e.embajador ? X.afinidad(pid, e.embajador) : 0.5;
        st.relacion = U.clamp(st.relacion + 0.05 * (q - 40) / 50 + 0.05 * (afin - 0.5) + (x.agregadurias[pid] ? 0.05 : 0), 3, 97);
      }
      for (const [oid, m] of Object.entries(x.misiones)) {
        if (!m.jefe) { if (!nuevoJ && U.chance(0.1)) m.jefe = X.generarCarrera(E); continue; }
        const b = 0.01 * (m.jefe.calidad - 40) / 40; for (const st of Object.values(D.paises)) st.relacion = U.clamp(st.relacion + b, 3, 97);
      }
      X.turnoCSNU(E);
      if (!E.meta.presim && U.chance(0.006)) X.incidente(E);
    },

    /* ── Consejo de Seguridad ── */
    relMedia(E) { const v = Object.values(E.diplomacia.paises); return U.prom(v.map(s => s.relacion)); },
    turnoCSNU(E) {
      const s = X.asegurar(E).csnu, hoy = U.hoy();
      if (s.miembro) {
        if (E.fecha.t >= s.hasta) { s.miembro = false; C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'Termina el periodo de Colombia en el Consejo de Seguridad de la ONU', tono: 0, importante: X.esGestor(E) }); }
        else if (E.gobierno.presidente === 'J' && !E.meta.presim && E.fecha.t - s.ultimoVoto > 24 && U.chance(0.05)) { s.ultimoVoto = E.fecha.t; C.Eventos.disparar(E, C.Eventos.plantilla('csnuVoto'), {}); }
        return;
      }
      const c = s.candidatura; if (!c) return;
      const m = X.asegurar(E).misiones.onu, q = m && m.jefe ? m.jefe.calidad : 30;
      c.avance = U.clamp(c.avance + 0.4 + q / 200 + (X.relMedia(E) - 50) / 100, 0, 100);
      if (hoy.getUTCFullYear() % 2 === 0 && hoy.getUTCMonth() === 5 && hoy.getUTCDate() <= 7 && E.fecha.t - c.t0 >= 20) {
        s.candidatura = null;
        const gana = U.chance(U.clamp(c.avance / 100 * 0.75 + 0.1, 0.05, 0.92));
        if (gana) {
          s.miembro = true; s.hasta = E.fecha.t + 104; s.veces++; s.ultimoVoto = E.fecha.t;
          for (const st of Object.values(E.diplomacia.paises)) st.relacion = U.clamp(st.relacion + 1.5, 3, 97);
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 2, 3, 95);
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'Colombia es elegida miembro no permanente del Consejo de Seguridad de la ONU', tono: 1, importante: true, jugador: X.esGestor(E) });
        } else C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'Colombia pierde la elección al Consejo de Seguridad de la ONU', tono: -1, importante: X.esGestor(E), jugador: X.esGestor(E) });
      }
    },

    /* ── Incidentes ── */
    incidente(E) {
      const x = X.asegurar(E), dia = C.DATA.diaspora, pres = E.gobierno.presidente === 'J';
      const opts = [];
      const wDia = U.pesado(Object.keys(dia), k => dia[k]); if (wDia) opts.push({ id: 'dipConnacionales', pais: wDia, w: 4 });
      const mal = X.abiertas(E).filter(([id]) => E.diplomacia.paises[id].relacion < 40).map(([id]) => id);
      if (mal.length) opts.push({ id: 'dipExpulsion', pais: U.pick(mal), w: 2 });
      opts.push({ id: 'dipMigracion', pais: 'VEN', w: 2 });
      opts.push({ id: 'dipCumbre', pais: null, w: 2 });
      const pol = X.abiertas(E).filter(([, e]) => e.embajador && e.embajador.tipo === 'politico').map(([id]) => id);
      if (pol.length) opts.push({ id: 'dipEmbajador', pais: U.pick(pol), w: 2 });
      const o = U.pesado(opts, y => y.w); if (!o) return;
      x.incidentes++;
      const nom = o.pais ? X.nombre(o.pais) : '';
      if (pres) { C.Eventos.disparar(E, C.Eventos.plantilla(o.id), { vars: { pais: nom }, pais: o.pais }); return; }
      const st = o.pais && E.diplomacia.paises[o.pais];
      if (st) st.relacion = U.clamp(st.relacion + U.rf(-2, 1), 3, 97);
      const txt = { dipConnacionales: `Detienen a colombianos en ${nom}: el Gobierno pide garantías`, dipExpulsion: `${nom} expulsa al embajador de Colombia`, dipMigracion: `Nueva oleada migratoria desde ${nom} presiona la frontera`, dipCumbre: 'Cumbre regional de jefes de Estado con presencia colombiana', dipEmbajador: `Escándalo por un embajador colombiano en ${nom}` }[o.id];
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: -1 });
    },
    anotar(E, txt) { const h = X.asegurar(E).historial; h.unshift({ t: E.fecha.t, txt }); if (h.length > 25) h.pop(); },

    registrarAcciones() {
      const A = C.Acciones, gestor = E => X.esGestor(E) || 'Sólo el Presidente o el Canciller dirigen el servicio exterior';
      const pais = a => C.Diplomacia.pais(a.pais);
      A.registrar({ id: 'abrirEmbajada', nombre: 'Abrir embajada', icono: '🏛', grupo: 'diplomacia', costo: 2, disponible: gestor,
        ejecutar(E, a) {
          const p = pais(a), x = X.asegurar(E); if (!p) return { ok: false, msg: 'Elige un país' };
          if (x.embajadas[p.id] && x.embajadas[p.id].abierta) return { ok: false, msg: 'Ya hay embajada en ese país' };
          if (X.abiertas(E).length >= CUPO) return { ok: false, msg: `La Cancillería sólo alcanza para ${CUPO} embajadas` };
          if (E.diplomacia.paises[p.id].relacion < 30) return { ok: false, msg: 'La relación es demasiado baja para que acepten una embajada' };
          x.embajadas[p.id] = { abierta: true, embajador: null, desde: E.fecha.t }; E.diplomacia.paises[p.id].relacion = U.clamp(E.diplomacia.paises[p.id].relacion + 2, 3, 97);
          X.anotar(E, `Se abre la embajada en ${p.nombre}`); return { ok: true, msg: `Se abre la embajada en ${p.nombre}: falta nombrar embajador` };
        } });
      A.registrar({ id: 'cerrarEmbajada', nombre: 'Cerrar embajada', icono: '🔒', grupo: 'diplomacia', costo: 1, disponible: gestor,
        ejecutar(E, a) {
          const p = pais(a), e = p && X.asegurar(E).embajadas[p.id]; if (!e || !e.abierta) return { ok: false, msg: 'No hay embajada abierta allí' };
          e.abierta = false; e.embajador = null; E.diplomacia.paises[p.id].relacion = U.clamp(E.diplomacia.paises[p.id].relacion - U.rf(4, 8), 3, 97);
          X.anotar(E, `Se cierra la embajada en ${p.nombre}`); return { ok: true, msg: `Cierras la embajada en ${p.nombre}: se resiente la relación` };
        } });
      A.registrar({ id: 'nombrarEmbajador', nombre: 'Nombrar embajador', icono: '🎩', grupo: 'diplomacia', costo: 1, disponible: gestor,
        ejecutar(E, a) {
          const p = pais(a), e = p && X.asegurar(E).embajadas[p.id]; if (!e || !e.abierta) return { ok: false, msg: 'Primero hay que abrir la embajada' };
          let emb;
          if (a.tipo === 'politico') { const pol = E.politicos[a.pol]; if (!pol || pol.cargo || pol.embajadorEn || !pol.activo) return { ok: false, msg: 'Elige a un político sin cargo' }; emb = X.desdePolitico(E, pol); pol.embajadorEn = p.id; C.Politicos.anotar(pol, `Nombrado embajador en ${p.nombre}`); }
          else if (a.tipo === 'carrera') emb = X.generarCarrera(E); else return { ok: false, msg: 'Elige el tipo de embajador' };
          if (e.embajador && e.embajador.pol && E.politicos[e.embajador.pol]) E.politicos[e.embajador.pol].embajadorEn = null;
          e.embajador = emb; X.anotar(E, `${emb.nombre} es nombrado embajador en ${p.nombre}`);
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: `${emb.nombre} será el nuevo embajador de Colombia en ${p.nombre}`, tono: 0 });
          return { ok: true, msg: `${emb.nombre} (${TIPOS[emb.tipo].toLowerCase()}, calidad ${emb.calidad}) es tu embajador en ${p.nombre}` };
        } });
      A.registrar({ id: 'abrirConsulado', nombre: 'Reforzar la red consular', icono: '🛂', grupo: 'diplomacia', costo: 1, disponible: gestor,
        ejecutar(E, a) {
          const x = X.asegurar(E), n = C.DATA.diaspora[a.pais]; if (!n) return { ok: false, msg: 'Elige un país con diáspora colombiana' };
          const nivel = x.consulados[a.pais] || 0; if (nivel >= 3) return { ok: false, msg: 'La red consular allí ya está al máximo' };
          x.consulados[a.pais] = nivel + 1; C.Economia.programar(E, [{ v: 'crecimiento', d: U.clamp(n / 2000 * 0.03, 0.005, 0.05), p: 'm' }], 'consulado');
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.2, 3, 95);
          X.anotar(E, `Consulados reforzados en ${X.nombre(a.pais)} (nivel ${nivel + 1})`); return { ok: true, msg: `La red consular en ${X.nombre(a.pais)} sube a nivel ${nivel + 1}: más servicios y más remesas` };
        } });
      A.registrar({ id: 'abrirAgregaduria', nombre: 'Agregaduría comercial', icono: '📦', grupo: 'diplomacia', costo: 1, disponible: gestor,
        ejecutar(E, a) {
          const x = X.asegurar(E), p = pais(a), e = p && x.embajadas[p.id]; if (!e || !e.abierta) return { ok: false, msg: 'Necesitas una embajada abierta allí' };
          if (x.agregadurias[p.id]) return { ok: false, msg: 'Ya tienes agregaduría comercial en ese país' };
          x.agregadurias[p.id] = true; X.anotar(E, `Agregaduría comercial en ${p.nombre}`); return { ok: true, msg: `La agregaduría en ${p.nombre} mejora poco a poco la relación y facilita los acuerdos` };
        } });
      A.registrar({ id: 'nombrarJefeMision', nombre: 'Nombrar jefe de misión', icono: '🏳', grupo: 'diplomacia', costo: 1, disponible: gestor,
        ejecutar(E, a) {
          const st = E.diplomacia.organismos[a.organismo]; if (!st || !st.miembro) return { ok: false, msg: 'Colombia sólo tiene misión ante organismos de los que es miembro' };
          const x = X.asegurar(E); let emb;
          if (a.tipo === 'politico') { const pol = E.politicos[a.pol]; if (!pol || pol.cargo || pol.embajadorEn || !pol.activo) return { ok: false, msg: 'Elige a un político sin cargo' }; emb = X.desdePolitico(E, pol); pol.embajadorEn = a.organismo; }
          else emb = X.generarCarrera(E);
          x.misiones[a.organismo] = { jefe: emb }; X.anotar(E, `${emb.nombre} encabeza la misión ante ${C.Diplomacia.organismo(a.organismo).sigla}`);
          return { ok: true, msg: `${emb.nombre} (calidad ${emb.calidad}) encabeza la misión ante ${C.Diplomacia.organismo(a.organismo).sigla}` };
        } });
      A.registrar({ id: 'candidatearCSNU', nombre: 'Candidatura al Consejo de Seguridad', icono: '🌐', grupo: 'diplomacia', costo: 2,
        disponible(E) { const g = gestor(E); if (g !== true) return g; const s = X.asegurar(E).csnu; if (s.miembro) return 'Colombia ya es miembro del Consejo'; if (s.candidatura) return 'La candidatura ya está en marcha'; return E.diplomacia.organismos.onu.miembro ? true : 'Necesitas ser miembro de la ONU'; },
        ejecutar(E) { const x = X.asegurar(E); if (!x.misiones.onu || !x.misiones.onu.jefe) return { ok: false, msg: 'Nombra primero un jefe de misión ante la ONU' }; x.csnu.candidatura = { t0: E.fecha.t, avance: 10 }; X.anotar(E, 'Colombia lanza su candidatura al Consejo de Seguridad'); return { ok: true, msg: 'Lanzas la candidatura: la votación es en junio de un año par' }; } });
      A.registrar({ id: 'lobbyCSNU', nombre: 'Hacer lobby por la candidatura', icono: '🤝', grupo: 'diplomacia', costo: 2,
        disponible(E) { const g = gestor(E); if (g !== true) return g; return X.asegurar(E).csnu.candidatura ? true : 'No hay candidatura en marcha'; },
        ejecutar(E) { const c = X.asegurar(E).csnu.candidatura; c.avance = U.clamp(c.avance + U.rf(6, 10), 0, 100); return { ok: true, msg: `La candidatura avanza (${Math.round(c.avance)} %)` }; } });
      A.registrar({ id: 'cenaDiplomatica', nombre: 'Cena con el cuerpo diplomático', icono: '🥂', grupo: 'diplomacia', costo: 1, disponible: gestor,
        ejecutar(E) {
          const D = E.diplomacia, ab = X.abiertas(E).map(([id]) => id).sort((a, b) => D.paises[a].relacion - D.paises[b].relacion).slice(0, 4);
          for (const id of ab) D.paises[id].relacion = U.clamp(D.paises[id].relacion + U.rf(1, 2.5), 3, 97);
          C.Opinion.subirRec(E, 0.2); return { ok: true, msg: 'La cena mejora la relación con los países más fríos' };
        } });
    }
  };
  C.Exterior = X;
  C.Tiempo.registrar('exterior', X, 63);
  X.registrarAcciones();
})(window.CURUL);
