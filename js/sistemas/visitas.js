/* Visitas de Estado: el Presidente planea un viaje a otro país con una agenda propia (hasta tres temas) y una
   delegación. Los embajadores preparan el terreno —cuanto mejor el embajador y más tiempo de preparación, más
   se logra—, el viaje ocurre en la fecha fijada, cada punto de la agenda sale bien, a medias o mal, y los
   resultados no terminan ahí: se convierten en seguimientos que rinden durante meses (contratos, cooperación
   en seguridad, inversión, buena imagen), mucho más si hay embajada abierta que les dé continuidad. También
   llegan jefes de Estado extranjeros a Colombia, y los viajes tienen incidentes de protocolo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const AGENDA = {
    comercial: { n: 'Comercio e inversión', icono: '📦', base: 0.38, r: 'Contratos para exportadores y nuevas inversiones' },
    seguridad: { n: 'Seguridad y defensa', icono: '🛡', base: 0.36, r: 'Cooperación militar y de inteligencia contra el crimen' },
    energia: { n: 'Energía y minería', icono: '⚡', base: 0.34, r: 'Inversión en el sector y transición energética' },
    cultural: { n: 'Cultura, turismo y educación', icono: '🎭', base: 0.56, r: 'Becas, turismo y buena imagen' },
    migracion: { n: 'Migración y diáspora', icono: '🛂', base: 0.42, r: 'Protección a connacionales y remesas' },
    derechos: { n: 'Derechos humanos y democracia', icono: '⚖', base: 0.36, r: 'Prestigio moral; incomoda a los regímenes cerrados' },
    cooperacion: { n: 'Ciencia y cooperación técnica', icono: '🔬', base: 0.46, r: 'Proyectos conjuntos de educación e infraestructura' }
  };
  const DELEGACIONES = {
    mixta: { n: 'Mixta (ministros y empresarios)', b: {} , g: 0.03 },
    empresarial: { n: 'Empresarial (gremios y exportadores)', b: { comercial: 0.1, energia: 0.08 }, g: 0 },
    oficial: { n: 'Oficial (ministros, militares y juristas)', b: { seguridad: 0.09, derechos: 0.08, migracion: 0.08, cooperacion: 0.06 }, g: 0 }
  };
  const M = () => C.MundoVivo, X = () => C.Exterior;

  const V = {
    AGENDA, DELEGACIONES,
    asegurar(E) {
      if (E.visitas && E.visitas.historial) return E.visitas;
      E.visitas = { plan: null, seg: [], historial: [], ultima: -99, ultimaEntrante: E.fecha.t, total: 0 };
      return E.visitas;
    },
    init(E) { E.visitas = null; V.asegurar(E); },
    migrar(E) { V.asegurar(E); },
    puede(E) { return E.gobierno.presidente === 'J' || 'Sólo el Presidente viaja en visita de Estado'; },
    nombre(id) { return C.Diplomacia.pais(id) ? C.Diplomacia.pais(id).nombre : id; },
    embajador(E, pid) { const e = E.exterior && E.exterior.embajadas[pid]; return e && e.abierta ? e : null; },
    /* Cuánto adelanta el equipo de la embajada cada semana de preparación */
    ritmoPrep(E, pid) {
      const e = V.embajador(E, pid); if (!e) return 3;
      return 6 + (e.embajador ? e.embajador.calidad : 30) / 12 + (E.exterior.agregadurias[pid] ? 3 : 0);
    },
    semanasPrep(E, pid) { return V.embajador(E, pid) ? 3 : 6; },
    afinidad(E, pid) {
      const shared = M().bloquesDe(pid).filter(b => b.m.includes('COL')).length;
      return U.clamp(shared * 0.03, 0, 0.09) + M().bonusRel(E, pid) / 300;
    },
    prob(E, pid, key, plan) {
      const a = AGENDA[key], st = E.diplomacia.paises[pid], p = M().pais(E, pid), emb = V.embajador(E, pid);
      let pr = a.base + ((st ? st.relacion : 50) - 50) / 250 + (emb ? (emb.embajador ? emb.embajador.calidad : 30) : 0) / 400 + (plan ? plan.preparado : 40) / 380 + V.afinidad(E, pid);
      const dl = DELEGACIONES[plan ? plan.delegacion : 'mixta']; pr += (dl.b[key] || 0) + dl.g;
      if (key === 'comercial') pr += U.clamp(Math.log10(Math.max(1, p.pib)) - 1.5, 0, 2) * 0.03 + (E.diplomacia.paises[pid] && E.diplomacia.paises[pid].tratados.includes('comercio') ? 0.05 : 0);
      if (key === 'seguridad') pr += p.militar / 400 + (st && st.tratados.includes('defensa') ? 0.06 : 0);
      if (key === 'energia') pr += ['SAU', 'ARE', 'QAT', 'NOR', 'USA', 'BRA', 'CAN'].includes(pid) || (C.DATA.bloques.find(b => b.id === 'opep') || { m: [] }).m.includes(pid) ? 0.1 : 0;
      if (key === 'migracion') pr += (C.DATA.diaspora[pid] || 0) > 100 ? 0.08 : 0;
      if (key === 'derechos') pr -= p.regimen === 'autoritario' ? 0.18 : p.regimen === 'monarquia' ? 0.1 : p.regimen === 'hibrido' ? 0.05 : -0.04;
      if (key === 'cooperacion') pr += 0.02;
      if (M().asegurar(E).sanciones[pid]) pr -= 0.22;
      if (p.crisis) pr -= 0.08;
      pr -= 0.08;
      return U.clamp(pr, 0.05, 0.85);
    },
    /* ¿Con qué probabilidad sale bien el viaje en conjunto? (para mostrarla en la interfaz) */
    resumenProb(E, pid, agenda, plan) { return agenda.map(k => ({ k, p: V.prob(E, pid, k, plan || { preparado: 40, delegacion: 'mixta' }) })); },

    planear(E, pid, agenda, delegacion) {
      const v = V.asegurar(E), sem = V.semanasPrep(E, pid);
      v.plan = { pais: pid, agenda, delegacion, t0: E.fecha.t, salida: E.fecha.t + sem, preparado: 15 + (V.embajador(E, pid) ? 10 : 0), refuerzos: 0 };
      return v.plan;
    },

    turno(E) {
      const v = V.asegurar(E), pres = E.gobierno.presidente === 'J';
      const pl = v.plan;
      if (pl) {
        if (!pres) { V.cancelarPorCambio(E, v); }
        else {
          pl.preparado = Math.min(100, pl.preparado + V.ritmoPrep(E, pl.pais));
          if (E.fecha.t >= pl.salida) V.viajar(E, v, pl);
        }
      }
      V.seguimientos(E, v);
      if (pres && !E.meta.presim && !v.plan && E.fecha.t - v.ultimaEntrante > 30 && U.chance(0.025)) V.entrante(E, v);
    },
    cancelarPorCambio(E, v) { v.plan = null; },

    viajar(E, v, pl) {
      const pid = pl.pais, nom = V.nombre(pid), st = E.diplomacia.paises[pid], emb = V.embajador(E, pid);
      const res = [];
      let ok = 0, mal = 0;
      for (const k of pl.agenda) {
        const pr = V.prob(E, pid, k, pl), r = U.rf(0, 1), nivel = r < pr * 0.7 ? 2 : r < pr ? 1 : 0;
        res.push({ k, nivel, p: Math.round(pr * 100) });
        if (nivel === 2) ok++; else if (nivel === 0) mal++;
        if (nivel > 0) V.abrirSeguimiento(E, v, pid, k, nivel, !!emb);
        if (k === 'derechos') V.reaccionDerechos(E, pid, nivel);
      }
      const bal = ok * 2 + res.filter(x => x.nivel === 1).length - mal;
      if (st) st.relacion = U.clamp(st.relacion + U.clamp(bal * 1.6 + 2, -6, 12), 3, 97);
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + (bal >= 3 ? U.rf(0.6, 1.6) : bal <= 0 ? U.rf(-1.6, -0.5) : U.rf(-0.1, 0.5)), 3, 95);
      E.jugador.agenda.puntos = Math.max(0, E.jugador.agenda.puntos - 1);
      const titulo = bal >= 3 ? `Éxito de la visita de Estado a ${nom}` : bal <= 0 ? `Visita de Estado a ${nom}: pocos resultados` : `Visita de Estado a ${nom}: balance mixto`;
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: titulo, tono: bal >= 3 ? 1 : bal <= 0 ? -1 : 0, importante: true, jugador: true });
      if (C.Exterior && C.Exterior.anotar) C.Exterior.anotar(E, `Visita de Estado a ${nom}: ${res.map(x => AGENDA[x.k].n + (x.nivel === 2 ? ' ✔' : x.nivel === 1 ? ' ≈' : ' ✘')).join(', ')}`);
      v.historial.unshift({ t: E.fecha.t, sentido: 'salida', pais: pid, res, bal, prep: Math.round(pl.preparado), delegacion: pl.delegacion, embajada: !!emb, titulo });
      if (v.historial.length > 30) v.historial.pop();
      v.total++; v.ultima = E.fecha.t; v.plan = null;
      if (U.chance(pl.preparado < 45 ? 0.3 : 0.1) && !E.meta.presim) C.Eventos.disparar(E, C.Eventos.plantilla('visitaIncidente'), { vars: { pais: nom }, pais: pid });
    },

    reaccionDerechos(E, pid, nivel) {
      const p = M().pais(E, pid);
      if (nivel === 2) { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(0.2, 0.8), 3, 95); }
      if (nivel === 0 && (p.regimen === 'autoritario' || p.regimen === 'monarquia')) { const st = E.diplomacia.paises[pid]; if (st) st.relacion = U.clamp(st.relacion - 4, 3, 97); }
    },

    /* Cada punto de la agenda logrado deja un seguimiento: rinde por semanas si la embajada lo sostiene */
    abrirSeguimiento(E, v, pid, k, nivel, conEmbajada) {
      const e = V.embajador(E, pid), cal = e && e.embajador ? e.embajador.calidad : 0;
      v.seg.push({ pais: pid, k, fuerza: (nivel === 2 ? 1 : 0.5) * (conEmbajada ? 0.7 + cal / 200 : 0.45), desde: E.fecha.t, resta: 26, cada: k === 'cultural' || k === 'migracion' ? 4 : 8, sig: E.fecha.t + 4, hechos: 0 });
    },
    seguimientos(E, v) {
      for (const s of v.seg) {
        if (E.fecha.t < s.sig) continue;
        s.sig = E.fecha.t + s.cada; s.resta -= s.cada; s.hechos++;
        const emb = V.embajador(E, s.pais);
        const f = s.fuerza * (emb ? 1 : 0.5) * (M().asegurar(E).sanciones[s.pais] ? 0.3 : 1);
        const st = E.diplomacia.paises[s.pais], nom = V.nombre(s.pais);
        if (st) st.relacion = U.clamp(st.relacion + 0.5 * f, 3, 97);
        const nota = txt => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: 1, importante: false, jugador: E.gobierno.presidente === 'J' }); };
        if (s.k === 'comercial') { C.Economia.programar(E, [{ v: 'exportaciones', d: 0.22 * f, p: 'm' }, { v: 'inversion', d: 0.03 * f, p: 'l' }], 'visita'); if (s.hechos === 1) nota(`Empresarios colombianos cierran contratos con ${nom} tras la visita de Estado`); }
        else if (s.k === 'seguridad') { for (const d of Object.values(E.deptos)) d.seguridad = U.clamp(d.seguridad + 0.12 * f, 1, 99); if (s.hechos === 1) nota(`Arranca la cooperación de seguridad con ${nom}`); }
        else if (s.k === 'energia') { C.Economia.programar(E, [{ v: 'inversion', d: 0.06 * f, p: 'l' }, { v: 'exportaciones', d: 0.1 * f, p: 'm' }], 'visita'); if (s.hechos === 1) nota(`Inversión energética de ${nom} llega a Colombia`); }
        else if (s.k === 'cultural') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.15 * f, 3, 95); for (const d of Object.values(E.deptos)) if (U.chance(0.2)) d.educacion = U.clamp(d.educacion + 0.15 * f, 1, 99); }
        else if (s.k === 'migracion') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.15 * f, 3, 95); if (C.Exterior && emb && E.exterior.consulados[s.pais] != null) E.exterior.consulados[s.pais] = Math.min(3, Math.max(E.exterior.consulados[s.pais], 1)); }
        else if (s.k === 'derechos') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.2 * f, 3, 95); }
        else if (s.k === 'cooperacion') { for (const d of Object.values(E.deptos)) if (U.chance(0.25)) d.educacion = U.clamp(d.educacion + 0.2 * f, 1, 99); C.Economia.programar(E, [{ v: 'inversion', d: 0.03 * f, p: 'm' }], 'visita'); }
      }
      v.seg = v.seg.filter(s => s.resta > 0);
    },

    /* Un jefe de Estado extranjero pide visitar Colombia */
    entrante(E, v) {
      const cand = Object.entries(E.diplomacia.paises).filter(([id, s]) => s.relacion > 42 && !M().asegurar(E).sanciones[id] && (V.embajador(E, id) || C.DATA.paisesDestacados[id]));
      if (!cand.length) return;
      const [pid] = U.pickW ? U.pickW(cand, c => c[1].relacion - 30) : U.pick(cand);
      const claves = Object.keys(AGENDA), tema = U.pick(claves);
      v.ultimaEntrante = E.fecha.t;
      C.Eventos.disparar(E, C.Eventos.plantilla('visitaEntrante'), { vars: { pais: V.nombre(pid), tema: AGENDA[tema].n.toLowerCase() }, pais: pid, tema });
    },

    registrarAcciones() {
      const A = C.Acciones;
      const pres = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente viaja en visita de Estado';
      A.registrar({ id: 'planearVisita', nombre: 'Planear visita de Estado', icono: '🛫', grupo: 'diplomacia', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const v = V.asegurar(E);
          if (v.plan) return { ok: false, msg: 'Ya tienes un viaje en preparación' };
          const pid = a.pais; if (!pid || pid === 'COL' || !E.diplomacia.paises[pid]) return { ok: false, msg: 'Elige el país que vas a visitar' };
          if (M().asegurar(E).sanciones[pid]) return { ok: false, msg: 'No puedes viajar a un país que estás sancionando' };
          if (E.fecha.t - v.ultima < 6) return { ok: false, msg: 'Acabas de volver de un viaje: espera unas semanas' };
          const agenda = []; for (const k of [a.a1, a.a2, a.a3]) if (k && AGENDA[k] && !agenda.includes(k)) agenda.push(k);
          if (!agenda.length) return { ok: false, msg: 'Elige al menos un punto de la agenda' };
          const dl = DELEGACIONES[a.delegacion] ? a.delegacion : 'mixta';
          const pl = V.planear(E, pid, agenda, dl);
          return { ok: true, msg: `Planeas visitar ${V.nombre(pid)} en ${pl.salida - E.fecha.t} semanas con ${agenda.length} punto${agenda.length > 1 ? 's' : ''} de agenda` };
        } });
      A.registrar({ id: 'reforzarPreparacion', nombre: 'Reforzar la preparación', icono: '📋', grupo: 'diplomacia', costo: 1, disponible: pres,
        ejecutar(E) {
          const pl = V.asegurar(E).plan; if (!pl) return { ok: false, msg: 'No hay ningún viaje en preparación' };
          if (pl.refuerzos >= 2) return { ok: false, msg: 'Ya reforzaste dos veces la preparación' };
          pl.refuerzos++; pl.preparado = Math.min(100, pl.preparado + 18);
          return { ok: true, msg: `Instruyes a la cancillería y a la embajada: preparación al ${Math.round(pl.preparado)}%` };
        } });
      A.registrar({ id: 'adelantarVisita', nombre: 'Adelantar el viaje', icono: '⏩', grupo: 'diplomacia', costo: 1, disponible: pres,
        ejecutar(E) {
          const pl = V.asegurar(E).plan; if (!pl) return { ok: false, msg: 'No hay ningún viaje en preparación' };
          if (pl.salida - E.fecha.t <= 1) return { ok: false, msg: 'El viaje sale la próxima semana' };
          pl.salida = E.fecha.t + 1; return { ok: true, msg: 'Adelantas la salida: viajas la próxima semana con la preparación que tengas' };
        } });
      A.registrar({ id: 'cancelarVisita', nombre: 'Cancelar el viaje', icono: '✖', grupo: 'diplomacia', costo: 0, disponible: pres,
        ejecutar(E) {
          const v = V.asegurar(E), pl = v.plan; if (!pl) return { ok: false, msg: 'No hay ningún viaje en preparación' };
          const st = E.diplomacia.paises[pl.pais]; if (st) st.relacion = U.clamp(st.relacion - 3, 3, 97);
          v.plan = null; return { ok: true, msg: `Cancelas la visita a ${V.nombre(pl.pais)}: el anfitrión lo nota` };
        } });
    }
  };
  C.Visitas = V;
  C.Tiempo.registrar('visitas', V, 62);
  V.registrarAcciones();
})(window.CURUL);
