/* Apoyos en la segunda vuelta presidencial: cuando los partidos eliminados en la primera vuelta declaran su respaldo a uno de
   los dos finalistas, y cuando el jugador —cuyo candidato quedó fuera, o cuyo partido no presentó candidatura— decide a quién
   apoyar: por acuerdo (pide ministerios y cambios al programa a cambio de sus votos) o de forma desinteresada. El apoyo suma
   fuerza al finalista en las urnas, y el acuerdo se cumple —o no— cuando el candidato asume el Gobierno. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const Ap = {
    asegurar(E) { const e = E.elecciones; e.apoyos = e.apoyos || null; return e; },
    /* Peso (en la misma escala que la fuerza presidencial) del respaldo de un partido o del jugador */
    pesoJugador(E) {
      const J = E.jugador, pa = E.partidos[J.partido], r1 = E.elecciones.r1;
      let w = J.reconocimiento / 100 * 1.4;
      if (pa) { const share = pa.lider === 'J' ? 1 : U.clamp(0.2 + (C.Partidos.peso(E, E.politicos.J).nac || 0) / 150, 0.2, 0.9); w += pa.popularidad * 0.5 * share; }
      const propio = r1 && r1.candidatos.find(c => c.pol === 'J'); if (propio) w += propio.pct * 0.5;
      return +w.toFixed(2);
    },
    /* Los partidos eliminados en primera vuelta declaran su apoyo al finalista más cercano */
    generar(E, res) {
      if (!res.segunda) return;
      E.elecciones.r1 = { candidatos: res.candidatos.map(c => ({ pol: c.pol, partido: c.partido, pct: c.pct })) };
      const fin = res.segunda, apoyos = {}; for (const f of fin) apoyos[f.pol] = [];
      for (const c of res.candidatos.slice(2)) {
        if (c.pol === 'J' || c.pct < 2) continue;
        const ideo = E.politicos[c.pol] ? { eco: E.politicos[c.pol].eco, soc: E.politicos[c.pol].soc } : E.partidos[c.partido];
        const cerca = fin.slice().sort((a, b) => U.distIdeo(ideo, E.politicos[a.pol] || E.partidos[a.partido]) - U.distIdeo(ideo, E.politicos[b.pol] || E.partidos[b.partido]))[0];
        const pa = E.partidos[c.partido]; if (!pa) continue;
        if (U.chance(0.25)) continue; // libertad de voto
        const w = +(c.pct * 0.35 * U.rf(0.8, 1.2)).toFixed(2);
        apoyos[cerca.pol].push({ fuente: c.partido, sigla: pa.sigla, peso: w, tipo: 'partido' });
        C.Medios.noticia(E, { tipo: 'elecciones', titular: `El ${pa.sigla} anuncia su apoyo a ${Ap.nombre(E, cerca.pol)} en la segunda vuelta`, tono: 0 });
      }
      E.elecciones.apoyos = apoyos; E.elecciones.apoyoJ = null; E.elecciones.pactoVigente = null;
      if (Ap.elegible(E) === true) C.Medios.noticia(E, { tipo: 'elecciones', titular: `${E.jugador.nombre} queda fuera de la segunda vuelta: ¿a quién apoyará?`, tono: 0, jugador: true });
    },
    nombre(E, pol) { return pol === 'J' ? E.jugador.nombre : E.politicos[pol] ? E.politicos[pol].nombre : pol; },
    bonus(E, pol) { const a = E.elecciones.apoyos && E.elecciones.apoyos[pol]; return a ? U.suma(a.map(x => x.peso)) : 0; },
    /* ¿Puede el jugador definir un apoyo? Sólo con segunda vuelta pendiente y sin su partido en ella */
    elegible(E) {
      const sv = E.elecciones.segundaVuelta; if (!sv || !E.elecciones.apoyos) return 'No hay segunda vuelta pendiente';
      if (sv.some(c => c.pol === 'J')) return 'Estás en la segunda vuelta';
      const J = E.jugador; if (J.partido && sv.some(c => c.partido === J.partido)) return 'Tu partido está en la segunda vuelta: ya lo respalda su candidato';
      if (E.elecciones.apoyoJ) return 'Ya definiste tu apoyo';
      return true;
    },
    probAcuerdo(E, pol, ministerios, programa) {
      const sv = E.elecciones.segundaVuelta, r1 = E.elecciones.r1, c = r1 && r1.candidatos.find(x => x.pol === pol), otro = r1 && r1.candidatos.find(x => x.pol !== pol && sv.some(s => s.pol === x.pol));
      const atras = c && otro ? U.clamp((otro.pct - c.pct) / 20, -0.2, 0.3) : 0;
      const p = E.politicos[pol], rel = p ? (p.relJ || 0) / 300 : 0;
      return U.clamp(0.8 - ministerios * 0.15 - (programa ? 0.1 : 0) + atras + rel, 0.08, 0.95);
    },
    apoyar(E, pol, modo, ministerios, programa) {
      const ok = Ap.elegible(E); if (ok !== true) return { ok: false, msg: ok };
      const sv = E.elecciones.segundaVuelta, f = sv.find(c => c.pol === pol); if (!f) return { ok: false, msg: 'Elige a uno de los dos finalistas' };
      const J = E.jugador, nom = Ap.nombre(E, pol), p = E.politicos[pol]; let w = Ap.pesoJugador(E);
      const reg = { cand: pol, partido: f.partido, modo, t: E.fecha.t, ministerios: 0, programa: false, aceptado: false };
      if (modo === 'acuerdo') {
        const prob = Ap.probAcuerdo(E, pol, ministerios, programa);
        if (!U.chance(prob)) { if (p) p.relJ = U.clamp((p.relJ || 0) - 3, -100, 100); return { ok: true, exito: false, msg: `${nom} rechaza tus condiciones (${Math.round(prob * 100)} % de probabilidad de aceptarlas). Puedes ofrecerle otro acuerdo o apoyarlo sin condiciones` }; }
        reg.ministerios = ministerios; reg.programa = programa; reg.aceptado = true; w *= 1.5;
        if (programa && p) { p.eco += (J.ideologia.eco - p.eco) * 0.2; p.soc += (J.ideologia.soc - p.soc) * 0.2; }
        E.elecciones.pactoVigente = { cand: pol, partido: J.partido || null, ministerios, programa, honrar: false, t: E.fecha.t };
        C.Medios.noticia(E, { tipo: 'elecciones', titular: `${J.nombre} sella un acuerdo de segunda vuelta con ${nom}${ministerios ? ` a cambio de ${ministerios} ministerio${ministerios > 1 ? 's' : ''}` : ''}${programa ? ' y cambios en el programa' : ''}`, tono: 1, importante: true, jugador: true });
      } else {
        w *= 0.85; if (p) p.relJ = U.clamp((p.relJ || 0) + 12, -100, 100);
        J.rep.honestidad = U.clamp(J.rep.honestidad + 1, 0, 100);
        C.Medios.noticia(E, { tipo: 'elecciones', titular: `${J.nombre} anuncia su apoyo desinteresado a ${nom} en la segunda vuelta`, tono: 1, jugador: true });
      }
      E.elecciones.apoyos[pol].push({ fuente: 'J', sigla: J.partido && E.partidos[J.partido] ? E.partidos[J.partido].sigla : J.nombre, peso: +w.toFixed(2), tipo: modo });
      E.elecciones.apoyoJ = reg;
      const pa = E.partidos[J.partido]; if (pa && pa.lider === 'J') pa.cohesion = U.clamp(pa.cohesion + 0.5, 0, 100);
      return { ok: true, exito: true, msg: modo === 'acuerdo' ? `${nom} acepta el acuerdo: tu apoyo pesa ${w.toFixed(1)} puntos de fuerza` : `Apoyas a ${nom} sin condiciones: suma ${w.toFixed(1)} puntos de fuerza` };
    },
    /* Resultado de la segunda vuelta: el pacto se activa si ganó el candidato apoyado */
    alResultado(E, res) {
      const ap = E.elecciones.apoyoJ, pv = E.elecciones.pactoVigente;
      if (ap && res.ganador === ap.cand) {
        const p = E.politicos[ap.cand]; if (p) p.relJ = U.clamp((p.relJ || 0) + 6, -100, 100);
        E.jugador.reconocimiento = U.clamp(E.jugador.reconocimiento + 1.5, 0, 100);
        if (pv) pv.honrar = U.chance(0.82 + ((p ? p.relJ : 0) / 500));
      } else { E.elecciones.pactoVigente = null; if (ap) E.jugador.reconocimiento = U.clamp(E.jugador.reconocimiento - 0.5, 0, 100); }
      E.elecciones.apoyos = null;
    },
    /* Al formar el Gobierno: coalición y cuota de ministerios prometidos */
    alFormarCoalicion(E) {
      const pv = E.elecciones.pactoVigente, g = E.gobierno; if (!pv || pv.cand !== g.presidente) return;
      const pa = E.partidos[pv.partido]; if (!pv.honrar) return;
      if (pa) { if (!g.coalicion.includes(pa.id)) g.coalicion.push(pa.id); pa.postura = 'gobierno'; }
    },
    alNombrarGabinete(E) {
      const pv = E.elecciones.pactoVigente, g = E.gobierno; if (!pv || pv.cand !== g.presidente) return;
      const pa = E.partidos[pv.partido], nom = E.jugador.nombre;
      if (!pv.honrar) { if (pa) pa.relJ = U.clamp((pa.relJ || 0) - 8, -100, 100); const p = E.politicos[pv.cand]; if (p) p.relJ = U.clamp((p.relJ || 0) - 15, -100, 100); C.Medios.noticia(E, { tipo: 'gobierno', titular: `El nuevo Gobierno incumple el acuerdo de segunda vuelta con ${nom}`, tono: -1, importante: true, jugador: true }); E.elecciones.pactoVigente = null; return; }
      if (pa && pv.ministerios > 0) {
        const minis = C.Gobierno.todosMinisterios(E); let ya = minis.filter(m => E.politicos[g.gabinete[m.id]] && E.politicos[g.gabinete[m.id]].partido === pa.id).length;
        const libres = minis.filter(m => !(E.politicos[g.gabinete[m.id]] && E.politicos[g.gabinete[m.id]].partido === pa.id));
        while (ya < pv.ministerios && libres.length) { const m = libres.splice(U.ri(0, libres.length - 1), 1)[0]; C.Gobierno.designar(E, m.id, pa.id, true); ya++; }
      }
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El nuevo Gobierno cumple el acuerdo de segunda vuelta con ${nom}${pv.ministerios ? ` y le entrega ${pv.ministerios} ministerio${pv.ministerios > 1 ? 's' : ''}` : ''}`, tono: 1, importante: true, jugador: true });
      E.elecciones.pactoVigente = null;
    },
    registrarAcciones() {
      C.Acciones.registrar({ id: 'apoyarSegundaVuelta', nombre: 'Apoyar a un candidato en segunda vuelta', icono: '🤝', grupo: 'elecciones', costo: 1,
        disponible: () => Ap.elegible(C.E),
        ejecutar(E, a) { const modo = a.modo === 'acuerdo' ? 'acuerdo' : 'gratuito'; return Ap.apoyar(E, a.cand, modo, U.clamp(+a.ministerios || 0, 0, 3), a.programa === 'si'); } });
    }
  };
  C.Apoyos = Ap;
  Ap.registrarAcciones();
  C.Bus.on('eleccion', res => { const E = C.E; if (!E || res.tipo !== 'presidencial') return; if (res.vuelta === 1 || !res.vuelta) Ap.generar(E, res); else if (res.vuelta === 2) Ap.alResultado(E, res); });
})(window.CURUL);
