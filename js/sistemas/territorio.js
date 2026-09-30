/* Seguridad y territorio: cultivos de uso ilícito, presencia del Estado y programas de sustitución por
   departamento, ligados a los grupos armados que controlan el territorio y a la relación con Estados
   Unidos (la «certificación» antidrogas de septiembre). Los cultivos financian a los grupos y erosionan la
   seguridad; erradicar (manual o aérea), sustituir, desplegar presencia e invertir en lo social tienen
   costos políticos distintos: el campesinado, el medio ambiente, la Fuerza Pública y las cuentas fiscales. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const REG = { 'Pacífico': 1.6, 'Amazonía': 1.3, 'Orinoquía': 1.1, 'Caribe': 0.7, 'Andina': 0.5, 'Insular': 0 };
  const CERT = { certificado: { n: 'Certificado', clase: 'verde' }, condiciones: { n: 'Certificado con condiciones', clase: 'amar' }, descertificado: { n: 'Descertificado', clase: 'rojo' } };

  const T = {
    CERT,
    asegurar(E) {
      if (E.territorio && E.territorio.deptos) return E.territorio;
      E.territorio = { deptos: {}, cert: { estado: 'certificado', t: E.fecha.t, hist: [] }, erradicadas: 0, hist: [] };
      for (const d of Object.values(E.deptos)) {
        const base = Math.max(0, 62 - d.seguridad) * U.rf(70, 490) * (REG[d.region] != null ? REG[d.region] : 0.6);
        E.territorio.deptos[d.id] = { cultivos: Math.round(base), presencia: Math.round(U.clamp(d.seguridad * 0.6 + U.ri(0, 20), 5, 95)), sustitucion: 0, erradicado: 0 };
      }
      return E.territorio;
    },
    init(E) { E.territorio = null; T.asegurar(E); },
    migrar(E) { T.asegurar(E); },
    total(E) { return U.suma(Object.values(T.asegurar(E).deptos).map(s => s.cultivos)); },
    grupoEn(E, dId) { return C.OrdenPublico.activos(E).find(g => E.ordenPublico.grupos[g.id].control.includes(dId)) || null; },
    gestor(E) { const J = E.jugador; return E.gobierno.presidente === 'J' || (J.cargo === 'ministro' && ['defensa', 'interior'].includes(J.cargoInfo && J.cargoInfo.ministerio)) ? true : 'Sólo el Presidente o el ministro de Defensa dirigen la política de seguridad y drogas'; },

    turno(E) {
      const q = T.asegurar(E);
      let tot = 0;
      for (const [id, st] of Object.entries(q.deptos)) {
        const d = E.deptos[id], g = T.grupoEn(E, id);
        const crec = st.cultivos * (0.0007 + (g ? 0.0011 : 0)) + (g ? 10 : 1) * U.rf(0, 1);
        st.cultivos = Math.max(0, st.cultivos + crec - st.cultivos * 0.003 * st.sustitucion / 100 - (st.cultivos > 0 ? 1.4 : 0));
        st.sustitucion = Math.max(0, st.sustitucion - 0.15);
        st.presencia = U.clamp(st.presencia + (d.seguridad * 0.7 - st.presencia) * 0.01, 3, 98);
        d.seguridad = U.clamp(d.seguridad - st.cultivos / 1.4e6 + (st.presencia - 50) / 8e3, 1, 99);
        if (g) { const gs = E.ordenPublico.grupos[g.id]; gs.fuerza = U.clamp(gs.fuerza + st.cultivos / 1.5e6, 5, 100); }
        st.erradicado = Math.max(0, st.erradicado - 0.5);
        tot += st.cultivos;
      }
      U.serie('cultivos', tot);
      const hoy = U.hoy();
      if (hoy.getUTCMonth() === 8 && hoy.getUTCDate() >= 10 && hoy.getUTCDate() <= 16) T.certificar(E);
      if (E.gobierno.presidente !== 'J' && !E.meta.presim && E.fecha.t % 26 === 0 && U.chance(0.6)) T.erradicacionNPC(E);
    },
    erradicacionNPC(E) {
      const q = T.asegurar(E), ids = Object.keys(q.deptos).sort((a, b) => q.deptos[b].cultivos - q.deptos[a].cultivos);
      const id = ids[0], st = q.deptos[id]; if (!st || st.presencia < 30) return;
      const f = U.rf(0.08, 0.2); q.erradicadas += st.cultivos * f; st.cultivos *= 1 - f; st.erradicado += 10;
      C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `El Gobierno adelanta una campaña de erradicación en ${E.deptos[id].nombre}`, tono: 0 });
    },
    certificar(E) {
      const q = T.asegurar(E), c = q.cert; if (c.t === E.fecha.t) return;
      const anio = U.anio(); if (c.hist.length && c.hist[0].anio === anio) return;
      const usa = E.diplomacia.paises.USA ? E.diplomacia.paises.USA.relacion : 60;
      const serie = (E.series.cultivos || []).map(x => x[1]), ref = serie.length > 52 ? serie[serie.length - 52] : T.total(E);
      const cambio = ref ? (T.total(E) - ref) / ref : 0;
      const score = 55 + usa * 0.3 - cambio * 120 + (q.erradicadas > 0 ? 6 : 0) + U.gauss(0, 6);
      const estado = score >= 62 ? 'certificado' : score >= 44 ? 'condiciones' : 'descertificado';
      c.estado = estado; c.t = E.fecha.t; c.hist.unshift({ anio, estado, t: E.fecha.t }); if (c.hist.length > 12) c.hist.pop();
      const st = E.diplomacia.paises.USA;
      if (st) st.relacion = U.clamp(st.relacion + (estado === 'certificado' ? 2 : estado === 'condiciones' ? -2 : -9), 3, 97);
      const esJ = E.gobierno.presidente === 'J';
      if (estado === 'descertificado') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1.5, 3, 95); C.Economia.aplicarDelta(E, 'inversion', -0.05); }
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Estados Unidos ${estado === 'certificado' ? 'certifica' : estado === 'condiciones' ? 'certifica con condiciones' : 'descertifica'} a Colombia en la lucha antidrogas`, tono: estado === 'certificado' ? 1 : -1, importante: true, jugador: esJ });
    },

    registrarAcciones() {
      const A = C.Acciones, gestor = E => T.gestor(E);
      const st = (E, a) => { const q = T.asegurar(E); return q.deptos[a.depto] ? { q, s: q.deptos[a.depto], d: E.deptos[a.depto] } : null; };
      A.registrar({ id: 'erradicarCultivos', nombre: 'Erradicar cultivos', icono: '🌾', grupo: 'seguridad', costo: 2, disponible: gestor,
        ejecutar(E, a) {
          const x = st(E, a); if (!x) return { ok: false, msg: 'Elige el departamento' };
          const aerea = a.modo === 'aerea'; if (x.s.cultivos < 150) return { ok: false, msg: 'Allí casi no quedan cultivos' };
          if (x.s.presencia < 30) return { ok: false, msg: 'Sin presencia del Estado no se puede erradicar: primero hay que desplegar' };
          const f = aerea ? U.rf(0.25, 0.38) : U.rf(0.08, 0.16), quitado = x.s.cultivos * f;
          x.s.cultivos -= quitado; x.q.erradicadas += quitado; x.s.erradicado += 15;
          C.Comercio.tocarActor(E, 'agrario', aerea ? 9 : 5); if (aerea) { C.Comercio.tocarActor(E, 'indigena', 4); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.2; }
          x.d.seguridad = U.clamp(x.d.seguridad - 0.6, 1, 99);
          if (E.diplomacia.paises.USA) E.diplomacia.paises.USA.relacion = U.clamp(E.diplomacia.paises.USA.relacion + (aerea ? 1.5 : 0.8), 3, 97);
          const g = T.grupoEn(E, a.depto); if (g) E.ordenPublico.grupos[g.id].fuerza = U.clamp(E.ordenPublico.grupos[g.id].fuerza - 1.5, 5, 100);
          if (!aerea && U.chance(0.2)) { C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Soldados mueren en una operación de erradicación manual en ${x.d.nombre}`, tono: -1, importante: true }); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.7, 3, 95); }
          return { ok: true, msg: `Erradicas ${U.n(Math.round(quitado))} ha en ${x.d.nombre} (${aerea ? 'aspersión aérea' : 'manual'})` };
        } });
      A.registrar({ id: 'sustituirCultivos', nombre: 'Sustitución voluntaria', icono: '🌱', grupo: 'seguridad', costo: 2, disponible: gestor,
        ejecutar(E, a) {
          const x = st(E, a); if (!x) return { ok: false, msg: 'Elige el departamento' };
          if (x.s.sustitucion >= 90) return { ok: false, msg: 'El programa ya cubre casi todo el departamento' };
          x.s.sustitucion = Math.min(100, x.s.sustitucion + 25); C.Economia.aplicarDelta(E, 'deficit', 0.05);
          C.Comercio.tocarActor(E, 'agrario', -6); x.d.pobreza = U.clamp(x.d.pobreza - 0.2, 1, 99);
          return { ok: true, msg: `Los campesinos de ${x.d.nombre} se acogen al programa (cobertura ${Math.round(x.s.sustitucion)} %)` };
        } });
      A.registrar({ id: 'desplegarPresencia', nombre: 'Desplegar presencia del Estado', icono: '🪖', grupo: 'seguridad', costo: 2, disponible: gestor,
        ejecutar(E, a) {
          const x = st(E, a); if (!x) return { ok: false, msg: 'Elige el departamento' };
          x.s.presencia = Math.min(100, x.s.presencia + 15); x.d.seguridad = U.clamp(x.d.seguridad + 1.5, 1, 99); C.Economia.aplicarDelta(E, 'deficit', 0.03);
          if (x.s.presencia > 70 && U.chance(0.12)) { E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.3; C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Denuncian abusos de la Fuerza Pública en ${x.d.nombre}`, tono: -1 }); }
          return { ok: true, msg: `Llegan más tropas y policías a ${x.d.nombre} (presencia ${Math.round(x.s.presencia)})` };
        } });
      A.registrar({ id: 'inversionSocialTerritorio', nombre: 'Inversión social integral', icono: '🏥', grupo: 'seguridad', costo: 2, disponible: gestor,
        ejecutar(E, a) {
          const x = st(E, a); if (!x) return { ok: false, msg: 'Elige el departamento' };
          x.d.infraestructura = U.clamp(x.d.infraestructura + 1, 1, 99); x.d.pobreza = U.clamp(x.d.pobreza - 0.3, 1, 99); x.d.salud = U.clamp(x.d.salud + 0.5, 1, 99); x.s.presencia = Math.min(100, x.s.presencia + 5); C.Economia.aplicarDelta(E, 'deficit', 0.04);
          return { ok: true, msg: `Vías, escuelas y puestos de salud llegan a ${x.d.nombre}` };
        } });
    }
  };
  C.Territorio = T;
  C.Tiempo.registrar('territorio', T, 52);
  T.registrarAcciones();
})(window.CURUL);
