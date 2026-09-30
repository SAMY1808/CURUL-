/* Clima, migración y recursos: el ciclo de El Niño y La Niña (sequía y racionamiento, o inundaciones), los precios
   de los alimentos, los embalses que sostienen la energía, la transición energética que el Gobierno impulsa o
   frena, y la migración masiva desde los países vecinos en crisis. Todo alimenta la economía, el campo y las
   ciudades, y el periódico de la semana. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const FRONTERA = ['LAG', 'CES', 'NSA', 'ARA', 'VIC', 'GUA', 'VAU', 'AMA'];
  const POLITICAS = {
    regularizar: { n: 'Regularizar y dar permiso de trabajo', txt: 'Integra a los migrantes: más economía formal en el tiempo, más fricción social al inicio.' },
    cerrar: { n: 'Cerrar la frontera', txt: 'Frena el flujo; enfría la relación y no elimina el paso por trochas.' },
    ayuda: { n: 'Pedir ayuda y fondos internacionales', txt: 'ONU y donantes financian la atención; funciona mejor con buenas relaciones.' }
  };
  const Cl = {
    POLITICAS,
    asegurar(E) {
      if (E.clima && E.clima.enso != null) return E.clima;
      E.clima = { enso: 0, fase: 'neutro', hasta: 0, embalses: 72, alimentos: 100, transicion: 12, ptransicion: 0, migrantes: 0.2, flujo: 0, politica: null, integracion: 35, hist: [], ultimaOla: -99, eventos: {} };
      return E.clima;
    },
    init(E) { E.clima = null; Cl.asegurar(E); },
    migrar(E) { Cl.asegurar(E); },
    puede(E) { return E.gobierno.presidente === 'J' || 'Sólo el Presidente define estas políticas'; },
    anotar(E, txt) { const c = Cl.asegurar(E); c.hist.unshift({ t: E.fecha.t, txt }); if (c.hist.length > 25) c.hist.pop(); },
    fase(c) { return c.enso >= 1.0 ? 'nino' : c.enso <= -1.0 ? 'nina' : 'neutro'; },
    nombreFase: { nino: 'El Niño', nina: 'La Niña', neutro: 'Neutro' },
    noticia(E, txt, tono, imp) { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'evento', titular: txt, tono, importante: !!imp, jugador: E.gobierno.presidente === 'J' }); },

    turno(E) {
      const c = Cl.asegurar(E), Ec = C.Economia, pres = E.gobierno.presidente === 'J', me = E.mundoEco;
      // ENSO: proceso mean-reverting con episodios largos
      c.enso = U.clamp(c.enso * 0.992 + U.gauss(0, 0.125), -3, 3);
      const f = Cl.fase(c);
      if (f !== c.fase) { c.fase = f; if (f !== 'neutro') Cl.inicioFase(E, c, f, pres); else Cl.anotar(E, 'Termina el fenómeno climático: vuelve la normalidad'); }
      // embalses
      c.embalses = U.clamp(c.embalses + (c.fase === 'nino' ? -0.55 : c.fase === 'nina' ? 0.45 : (70 - c.embalses) * 0.02) - (c.transicion / 100) * 0.03 * 0 + U.gauss(0, 0.25), 5, 100);
      if (c.embalses < 28 && !E.meta.presim && E.fecha.t - (c.eventos.racion || -99) > 40) { c.eventos.racion = E.fecha.t; Cl.racionamiento(E, pres); }
      // alimentos
      const petro = me ? me.petroleo : 100;
      c.alimentos = U.clamp(c.alimentos + (100 - c.alimentos) * 0.012 + (c.fase === 'nino' ? 0.55 : c.fase === 'nina' ? 0.25 : 0) + (petro - 100) * 0.0015 + U.gauss(0, 0.5), 70, 220);
      const dA = (c.alimentos - 100) / 100;
      if (Math.abs(dA) > 0.05) Ec.aplicarDelta(E, 'inflacion', dA * 0.012);
      if (c.alimentos > 135 && !E.meta.presim && E.fecha.t - (c.eventos.alim || -99) > 60) { c.eventos.alim = E.fecha.t; if (pres) C.Eventos.disparar(E, C.Eventos.plantilla('crisisAlimentos'), { vars: { indice: Math.round(c.alimentos) } }); else Cl.noticia(E, `Se disparan los precios de los alimentos: el índice sube a ${Math.round(c.alimentos)}`, -1, true); }
      // impactos físicos
      if (c.fase === 'nino') { if (U.chance(0.25)) Ec.aplicarDelta(E, 'crecimiento', -0.004); for (const d of Object.values(E.deptos)) if (U.chance(0.01)) d.pobreza = U.clamp(d.pobreza + 0.05, 1, 95); }
      if (c.fase === 'nina') { for (const d of Object.values(E.deptos)) if (U.chance(0.012)) d.infraestructura = U.clamp(d.infraestructura - 0.12, 1, 99); if (U.chance(0.2)) Ec.aplicarDelta(E, 'crecimiento', -0.002); }
      // transición: costo de oportunidad y blindaje frente al petróleo
      c.transicion = U.clamp(c.transicion + c.ptransicion * 0.03, 0, 100); c.ptransicion = Math.max(0, c.ptransicion - 0.4);
      if (me && c.transicion > 30) { const d = (c.petroPrev == null ? 0 : me.petroleo - c.petroPrev); if (d < 0) Ec.aplicarDelta(E, 'crecimiento', -d * 0.003 * c.transicion / 160); }
      c.petroPrev = me ? me.petroleo : null;
      Cl.migracion(E, c, pres);
      U.serie('clima:alimentos', c.alimentos); U.serie('clima:embalses', c.embalses); U.serie('clima:enso', c.enso); U.serie('clima:migrantes', c.migrantes);
    },
    inicioFase(E, c, f, pres) {
      const ni = f === 'nino'; Cl.anotar(E, `Comienza ${Cl.nombreFase[f]}`);
      Cl.noticia(E, ni ? 'Alerta por El Niño: se esperan sequías, incendios y menor generación hidroeléctrica' : 'Alerta por La Niña: lluvias intensas y riesgo de inundaciones', -1, true);
      if (pres && !E.meta.presim) C.Eventos.disparar(E, C.Eventos.plantilla(ni ? 'elNino' : 'laNina'), {});
    },
    racionamiento(E, pres) {
      Cl.anotar(E, 'Embalses en nivel crítico: riesgo de racionamiento eléctrico');
      if (pres) C.Eventos.disparar(E, C.Eventos.plantilla('racionamiento'), {});
      else { Cl.noticia(E, 'Racionamiento eléctrico por el bajo nivel de los embalses', -1, true); C.Economia.programar(E, [{ v: 'crecimiento', d: -0.3, p: 'm' }], 'racionamiento'); }
    },
    /* Flujo desde países vecinos en crisis (VEN, NIC, HTI…) */
    migracion(E, c, pres) {
      const mv = C.MundoVivo; if (!mv) return;
      let presion = 0; for (const id of ['VEN', 'NIC', 'HTI', 'CUB']) { const p = mv.pais(E, id); if (!p) continue; presion += Math.max(0, 55 - p.estab) / 55 * (id === 'VEN' ? 1.4 : 0.6) + (p.crisis ? 0.5 : 0) + Math.max(0, p.inflacion == null ? 0 : Math.min(40, p.inflacion) / 60); }
      if (c.politica === 'cerrar') presion *= 0.45; else if (c.politica === 'regularizar') presion *= 1.2;
      c.flujo = U.clamp(c.flujo * 0.9 + presion * 0.02, 0, 3);
      c.migrantes = U.clamp(c.migrantes + c.flujo * 0.002 - 0.0003 * (c.migrantes > 3 ? 1 : 0.2), 0, 8);
      if (c.politica === 'regularizar') c.integracion = U.clamp(c.integracion + 0.05, 0, 100); else if (c.politica === 'cerrar') c.integracion = U.clamp(c.integracion - 0.02, 0, 100);
      // consecuencias: presión en la frontera y beneficio económico si están integrados
      const sat = c.migrantes * (1 - c.integracion / 160);
      for (const id of FRONTERA) { const d = E.deptos[id]; if (d && sat > 0.4) { d.salud = U.clamp(d.salud - 0.004 * sat, 1, 99); d.educacion = U.clamp(d.educacion - 0.002 * sat, 1, 99); } }
      if (c.integracion > 55 && c.migrantes > 0.6) C.Economia.aplicarDelta(E, 'crecimiento', 0.0004 * c.migrantes);
      if (!E.meta.presim && sat > 1.2) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.004 * sat, 3, 95);
      if (!E.meta.presim && c.flujo > 1.4 && E.fecha.t - c.ultimaOla > 60) { c.ultimaOla = E.fecha.t; Cl.anotar(E, 'Nueva ola migratoria desde los países vecinos'); if (pres) C.Eventos.disparar(E, C.Eventos.plantilla('olaMigratoria'), { vars: { migrantes: (c.migrantes).toFixed(1) } }); else Cl.noticia(E, 'Nueva ola de migrantes cruza la frontera', -1, true); }
    },
    /* Historias para el periódico */
    historias(E) {
      const c = Cl.asegurar(E), out = [];
      if (c.fase !== 'neutro') out.push({ k: 'clima', peso: c.fase === 'nino' ? 62 : 56, tipo: 'Clima', tono: -1, txt: c.fase === 'nino' ? `El Niño reduce los embalses al ${Math.round(c.embalses)}%` : `La Niña deja lluvias e inundaciones en varias regiones`, sub: `Índice de alimentos: ${Math.round(c.alimentos)}` });
      if (c.alimentos > 125) out.push({ k: 'alim', peso: 58, tipo: 'Economía', tono: -1, txt: `Alimentos por las nubes: el índice de precios llega a ${Math.round(c.alimentos)}`, sub: 'Los hogares recortan gastos en la canasta básica' });
      if (c.migrantes > 1) out.push({ k: 'migra', peso: 44, tipo: 'País', tono: 0, txt: `Colombia acoge a ${c.migrantes.toFixed(1)} millones de migrantes`, sub: c.integracion > 55 ? 'La integración avanza pero exige servicios' : 'Alcaldías fronterizas piden más ayuda' });
      if (c.transicion > 45) out.push({ k: 'trans', peso: 30, tipo: 'Economía', tono: 1, txt: `Transición energética: ${Math.round(c.transicion)}% de avance`, sub: 'Renovables ganan espacio en la matriz' });
      return out;
    },

    registrarAcciones() {
      const A = C.Acciones, pres = Cl.puede;
      A.registrar({ id: 'impulsarTransicion', nombre: 'Impulsar la transición energética', icono: '🌱', grupo: 'economia', costo: 2, disponible: pres,
        ejecutar(E) { const c = Cl.asegurar(E); if (c.ptransicion > 5) return { ok: false, msg: 'Ya hay un programa en marcha' }; c.ptransicion = 30; C.Economia.programar(E, [{ v: 'deficit', d: 0.3, p: 'm' }, { v: 'inversion', d: 0.1, p: 'l' }], 'transicion'); if (E.mundoEco && E.mundoEco.petroleo > 90) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.4, 3, 95); return { ok: true, msg: 'Lanzas un plan de energías renovables: avanza durante meses (cuesta déficit hoy)' }; } });
      A.registrar({ id: 'politicaMigratoria', nombre: 'Definir la política migratoria', icono: '🛂', grupo: 'diplomacia', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const c = Cl.asegurar(E), p = POLITICAS[a.politica]; if (!p) return { ok: false, msg: 'Elige la política' }; if (c.politica === a.politica) return { ok: false, msg: 'Esa ya es la política vigente' };
          const dp = E.diplomacia.paises;
          if (a.politica === 'cerrar') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.8, 3, 95); for (const id of ['VEN', 'NIC']) if (dp[id]) dp[id].relacion = U.clamp(dp[id].relacion - 4, 3, 97); }
          else if (a.politica === 'regularizar') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.6, 3, 95); if (dp.VEN) dp.VEN.relacion = U.clamp(dp.VEN.relacion + 3, 3, 97); C.Economia.programar(E, [{ v: 'deficit', d: 0.15, p: 'm' }], 'migracion'); }
          else { const ok = U.chance(U.clamp(0.35 + (C.Exterior ? C.Exterior.calidadEfectiva(E, 'USA') : 0) / 300 + (E.diplomacia.organismos.onu && E.diplomacia.organismos.onu.miembro ? 0.15 : 0), 0.2, 0.85)); if (ok) { c.integracion = U.clamp(c.integracion + 8, 0, 100); C.Economia.programar(E, [{ v: 'deficit', d: -0.1, p: 'm' }], 'ayudaint'); Cl.anotar(E, 'Ayuda internacional para atender la migración'); return { ok: true, msg: 'Llegan fondos y asistencia técnica para atender a los migrantes' }; } return { ok: true, msg: 'Los donantes ofrecen poco esta vez' }; }
          c.politica = a.politica; Cl.anotar(E, `Política migratoria: ${p.n}`); return { ok: true, msg: `Política migratoria: ${p.n}` };
        } });
    }
  };
  C.Clima = Cl;
  C.Tiempo.registrar('clima', Cl, 59);
  Cl.registrarAcciones();
})(window.CURUL);
