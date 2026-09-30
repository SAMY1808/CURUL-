/* Espionaje y operaciones encubiertas entre países: con los servicios de inteligencia del Estado el Presidente
   puede infiltrar redes en otro país, lanzar ciberataques, sabotear, apoyar a la oposición o incluso a un golpe.
   Cada operación puede ser descubierta —y entonces hay incidente diplomático—, y los demás países también
   espían a Colombia: la contrainteligencia decide cuántos ataques se detienen a tiempo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const OPS = {
    infiltrar: { n: 'Infiltrar una red', icono: '🕵', costo: 2, red: 0, riesgo: 0.16, txt: 'Crea o refuerza una red de informantes: da información y facilita otras operaciones.' },
    ciber: { n: 'Ciberataque', icono: '💻', costo: 2, red: 20, riesgo: 0.28, txt: 'Golpea la economía y la capacidad militar del blanco sin disparar un tiro.' },
    sabotaje: { n: 'Sabotaje', icono: '💣', costo: 3, red: 35, riesgo: 0.34, txt: 'Daña infraestructura militar o económica; en un frente o una guerra, inclina la balanza.' },
    oposicion: { n: 'Apoyar a la oposición', icono: '📢', costo: 2, red: 25, riesgo: 0.22, txt: 'Financia y asesora a la oposición: acerca al país a tus ideas y erosiona al gobierno.' },
    golpe: { n: 'Apoyar un golpe', icono: '🪖', costo: 3, red: 50, riesgo: 0.5, txt: 'Sólo en países inestables. Si sale bien, cambia el gobierno; si sale mal, es un escándalo mayúsculo.' }
  };
  const HOSTILES = ['USA', 'RUS', 'CHN', 'VEN', 'ISR', 'IRN', 'CUB', 'NIC', 'GBR', 'FRA', 'PRK'];
  const TIPOS_EXT = { ciber: 'ciberataque contra el Estado colombiano', infiltracion: 'una red de infiltración en nuestras instituciones', sabotaje: 'sabotaje a infraestructura crítica' };

  const Es = {
    OPS, TIPOS_EXT,
    asegurar(E) {
      if (E.espionaje && E.espionaje.redes) return E.espionaje;
      E.espionaje = { redes: {}, contra: 40, historial: [], expuestas: 0, exitos: 0, ataquesRecibidos: 0, detenidos: 0, ultima: {} };
      return E.espionaje;
    },
    init(E) { E.espionaje = null; Es.asegurar(E); },
    migrar(E) { Es.asegurar(E); },
    puede(E) { return E.gobierno.presidente === 'J' || 'Sólo el Presidente ordena operaciones en el exterior'; },
    nombre(id) { return C.Diplomacia.pais(id) ? C.Diplomacia.pais(id).nombre : id; },
    capacidad(E) { return C.Inteligencia ? C.Inteligencia.asegurar(E).capacidad : 50; },
    anotar(E, txt) { const h = Es.asegurar(E).historial; h.unshift({ t: E.fecha.t, txt }); if (h.length > 30) h.pop(); },
    /* Probabilidad de que la operación sea descubierta */
    riesgo(E, pid, op) {
      const e = Es.asegurar(E), p = C.MundoVivo.pais(E, pid), red = e.redes[pid] || 0;
      return U.clamp(OPS[op].riesgo - red / 550 - Es.capacidad(E) / 900 + p.militar / 500 + (p.regimen === 'autoritario' ? 0.05 : 0), 0.06, 0.8);
    },
    turno(E) {
      const e = Es.asegurar(E);
      for (const k of Object.keys(e.redes)) { e.redes[k] = Math.max(0, e.redes[k] - 0.15); if (e.redes[k] <= 0) delete e.redes[k]; }
      e.contra = U.clamp(e.contra + (Es.capacidad(E) - 50) * 0.0015 - 0.02, 10, 95);
      if (E.meta.presim) return;
      // Otros países espían a Colombia
      if (U.chance(0.006)) {
        const cand = HOSTILES.filter(id => E.diplomacia.paises[id] && E.diplomacia.paises[id].relacion < 65);
        if (!cand.length) return;
        const pid = U.pick(cand), tipo = U.pick(Object.keys(TIPOS_EXT)); e.ataquesRecibidos++;
        const detenido = U.chance(U.clamp(e.contra / 130 + Es.capacidad(E) / 500, 0.15, 0.8));
        if (detenido) { e.detenidos++; Es.anotar(E, `Contrainteligencia detiene ${TIPOS_EXT[tipo]} de ${Es.nombre(pid)}`); if (E.gobierno.presidente === 'J') C.Medios.noticia(E, { tipo: 'seguridad', titular: `Inteligencia frustra ${TIPOS_EXT[tipo]} atribuido a ${Es.nombre(pid)}`, tono: 1, jugador: true }); return; }
        if (tipo === 'ciber') C.Economia.programar(E, [{ v: 'confianza', d: -1.5, p: 'i' }], 'ciber'); else if (tipo === 'sabotaje') C.Economia.programar(E, [{ v: 'crecimiento', d: -0.1, p: 'm' }], 'sabotaje'); else E.jugador.credibilidad = U.clamp(E.jugador.credibilidad - 2, 0, 100);
        Es.anotar(E, `Se descubre ${TIPOS_EXT[tipo]} de ${Es.nombre(pid)}`);
        if (E.gobierno.presidente === 'J') C.Eventos.disparar(E, C.Eventos.plantilla('espionajeExtranjero'), { vars: { pais: Es.nombre(pid), tipo: TIPOS_EXT[tipo] }, pais: pid, tipo });
        else C.Medios.noticia(E, { tipo: 'seguridad', titular: `Denuncian ${TIPOS_EXT[tipo]} de ${Es.nombre(pid)}`, tono: -1 });
      }
    },
    ejecutar(E, pid, op) {
      const e = Es.asegurar(E), p = C.MundoVivo.pais(E, pid), o = OPS[op], nom = Es.nombre(pid), st = E.diplomacia.paises[pid];
      const red = e.redes[pid] || 0, descubierta = U.chance(Es.riesgo(E, pid, op)); let ok = false, msg = '';
      e.ultima[pid] = E.fecha.t;
      const q = C.Inteligencia ? C.Inteligencia.asegurar(E) : null;
      if (op === 'infiltrar') { e.redes[pid] = Math.min(100, red + 22 + Es.capacidad(E) / 12); ok = !descubierta; msg = `Tu red en ${nom} crece a ${Math.round(e.redes[pid])}%`; }
      else if (descubierta && op !== 'golpe') { msg = `La operación en ${nom} fue descubierta`; }
      else if (op === 'ciber') { p.pib *= 0.9985; p.militar = Math.max(3, p.militar - 2); ok = true; msg = `Ciberataque a ${nom}: golpe a su economía y a sus sistemas militares`; if (E.militar && E.militar.guerra && E.militar.guerra.pais === pid) E.militar.guerra.avance += 6; }
      else if (op === 'sabotaje') { p.militar = Math.max(3, p.militar - 3); p.crec = U.clamp(p.crec - 0.4, -12, 12); ok = true; msg = `Sabotaje en ${nom}: instalaciones dañadas`; if (E.militar) { if (E.militar.guerra && E.militar.guerra.pais === pid) E.militar.guerra.avance += 9; const f = E.militar.frentes.find(x => x.pais === pid); if (f && !E.militar.guerra) f.tension = U.clamp(f.tension + 3, 3, 100); } }
      else if (op === 'oposicion') { p.eco += (E.jugador.ideologia.eco - p.eco) * 0.12; p.soc += (E.jugador.ideologia.soc - p.soc) * 0.12; p.estab = Math.max(3, p.estab - 4); ok = true; msg = `Apoyas a la oposición en ${nom}: el gobierno se debilita y el país se acerca a tus ideas`; if (p.regimen === 'autoritario' && p.estab < 22 && U.chance(0.08)) { p.regimen = 'hibrido'; p.proxElec = E.fecha.t + U.ri(30, 80); C.MundoVivo.noticia(E, pid, `Apertura política en ${nom} tras las protestas`, 1, true); } }
      else if (op === 'golpe') {
        if (p.estab >= 50) return { ok: false, msg: `${nom} es demasiado estable para un golpe` };
        const pr = U.clamp(0.22 + red / 300 + (50 - p.estab) / 220, 0.1, 0.7);
        if (U.chance(pr)) { C.MundoVivo.golpe(E, pid, p); if (st) st.relacion = U.clamp(st.relacion + 14, 3, 97); ok = true; msg = `Cae el gobierno de ${nom}: los nuevos gobernantes te deben el favor`; }
        else { msg = `El golpe en ${nom} fracasa`; if (!descubierta) { if (U.chance(0.6)) { e.redes[pid] = Math.max(0, red - 30); } } }
        if (!ok) { Es.expuesta(E, pid, op, 2); return { ok: true, msg }; }
      }
      if (!ok || (descubierta && op !== 'infiltrar')) { if (descubierta) Es.expuesta(E, pid, op, 1); }
      else if (descubierta) Es.expuesta(E, pid, op, 0.6);
      if (ok) e.exitos++;
      Es.anotar(E, `${o.n} en ${nom}: ${descubierta ? 'descubierta' : ok ? 'éxito' : 'sin resultado'}`);
      return { ok: true, msg: msg + (descubierta ? ' (te descubrieron)' : '') };
    },
    expuesta(E, pid, op, grav) {
      const e = Es.asegurar(E), st = E.diplomacia.paises[pid]; e.expuestas++;
      if (st) st.relacion = U.clamp(st.relacion - 7 * grav, 3, 97);
      e.redes[pid] = Math.max(0, (e.redes[pid] || 0) - 25);
      E.jugador.credibilidad = U.clamp(E.jugador.credibilidad - 3 * grav, 0, 100);
      if (E.meta.presim) return;
      C.Eventos.disparar(E, C.Eventos.plantilla('espionajeExpuesto'), { vars: { pais: Es.nombre(pid), op: OPS[op].n.toLowerCase() }, pais: pid, grav });
    },

    registrarAcciones() {
      const A = C.Acciones, pres = Es.puede;
      for (const [op, o] of Object.entries(OPS)) {
        A.registrar({ id: 'op_' + op, nombre: o.n, icono: o.icono, grupo: 'inteligencia', costo: o.costo, disponible: pres,
          ejecutar(E, a) {
            const pid = a.pais; if (!pid || pid === 'COL' || !E.diplomacia.paises[pid]) return { ok: false, msg: 'Elige el país blanco' };
            const e = Es.asegurar(E); if ((e.redes[pid] || 0) < o.red) return { ok: false, msg: `Necesitas una red de al menos ${o.red}% en ese país (infiltra primero)` };
            if (E.fecha.t - (e.ultima[pid] || -99) < 4) return { ok: false, msg: 'Deja enfriar las cosas unas semanas' };
            return Es.ejecutar(E, pid, op);
          } });
      }
      A.registrar({ id: 'reforzarContrainteligencia', nombre: 'Reforzar la contrainteligencia', icono: '🛡', grupo: 'inteligencia', costo: 2, disponible: pres,
        ejecutar(E) { const e = Es.asegurar(E); if (e.contra >= 90) return { ok: false, msg: 'Ya es máxima' }; e.contra = Math.min(95, e.contra + 14); C.Economia.programar(E, [{ v: 'deficit', d: 0.05, p: 'm' }], 'contrainteligencia'); return { ok: true, msg: `Contrainteligencia al ${Math.round(e.contra)}%: más ataques se detienen a tiempo` }; } });
    }
  };
  C.Espionaje = Es;
  C.Tiempo.registrar('espionaje', Es, 65);
  Es.registrarAcciones();
})(window.CURUL);
