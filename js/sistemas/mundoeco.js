/* Economía global: el mundo que Colombia no controla. Precios del petróleo y el café, ciclo de la economía
   mundial, tasa de interés de la Reserva Federal y pandemias. Sus cambios se trasladan a la economía
   nacional (exportaciones, crecimiento, déficit, inversión y el descontento del campo). Hay choques
   históricos anclados a su fecha —la crisis del 29, el choque petrolero del 73, la crisis financiera de
   2008, el desplome del crudo de 2014, la pandemia de 2020— y choques aleatorios en el resto. Como
   Presidente decides cómo responder; con un fondo de estabilización, una cobertura petrolera y una
   postura contracíclica puedes prepararte. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const HISTORICOS = [
    { k: 'crisis29', y: 1929, m: 9, n: 'Gran Depresión' }, { k: 'petroleo73', y: 1973, m: 9, n: 'Choque petrolero' },
    { k: 'asia98', y: 1998, m: 7, n: 'Crisis asiática' }, { k: 'crisis08', y: 2008, m: 8, n: 'Crisis financiera global' },
    { k: 'crudo14', y: 2014, m: 6, n: 'Desplome del crudo' }, { k: 'covid20', y: 2020, m: 2, n: 'Pandemia' }
  ];
  const MODOS = { neutra: 'Neutra', estimulo: 'Expansiva (gasta y estimula)', austeridad: 'Austera (ahorra y recorta)' };

  const M = {
    HISTORICOS, MODOS,
    asegurar(E) {
      if (E.mundoEco && E.mundoEco.petroleo) return E.mundoEco;
      const h = {}, hoy = U.hoy();
      for (const x of HISTORICOS) if (x.y < hoy.getUTCFullYear() || (x.y === hoy.getUTCFullYear() && x.m < hoy.getUTCMonth())) h[x.k] = true;
      E.mundoEco = { petroleo: 100, cafe: 100, ciclo: 0.8, fed: 3, regimen: null, pandemia: null, fondo: 0, cobertura: 0, modo: 'neutra', hechos: h, choques: [] };
      return E.mundoEco;
    },
    init(E) { E.mundoEco = null; M.asegurar(E); },
    migrar(E) { M.asegurar(E); },
    presidente(E) { return E.gobierno.presidente === 'J'; },
    aviso(E, k, o) { const m = M.asegurar(E); m.choques.unshift({ t: E.fecha.t, k, txt: o.txt }); if (m.choques.length > 20) m.choques.pop(); },

    turno(E) {
      const m = M.asegurar(E), Ec = C.Economia;
      const p0 = m.petroleo, c0 = m.cafe, f0 = m.fed;
      if (m.regimen && E.fecha.t >= m.regimen.hasta) m.regimen = null;
      m.petroleo = U.clamp(m.petroleo + (100 - m.petroleo) * 0.004 + U.gauss(0, 2.2) + (m.regimen ? m.regimen.dir : 0), 25, 260);
      m.cafe = U.clamp(m.cafe + (100 - m.cafe) * 0.005 + U.gauss(0, 1.6), 30, 220);
      m.ciclo = U.clamp(m.ciclo + (0.8 - m.ciclo) * 0.01 + U.gauss(0, 0.06), -6, 5);
      m.fed = U.clamp(m.fed + U.gauss(0, 0.03) + (m.fed < 1 ? 0.01 : 0), 0, 8);
      // Traslado a la economía nacional (sólo el cambio de la semana)
      let dp = m.petroleo - p0; if (dp < 0 && E.fecha.t < m.cobertura) dp *= 0.4;
      Ec.aplicarDelta(E, 'exportaciones', dp * 0.04 + (m.cafe - c0) * 0.012);
      Ec.aplicarDelta(E, 'crecimiento', dp * 0.003 + (m.ciclo - 0.8) * 0.003);
      Ec.aplicarDelta(E, 'deficit', -dp * 0.004);
      Ec.aplicarDelta(E, 'inversion', -(m.fed - f0) * 0.05);
      if (m.cafe < 80) C.Comercio.tocarActor(E, 'agrario', (80 - m.cafe) * 0.004);
      if (m.modo === 'estimulo') { Ec.aplicarDelta(E, 'crecimiento', 0.004); Ec.aplicarDelta(E, 'deficit', 0.004); }
      else if (m.modo === 'austeridad') { Ec.aplicarDelta(E, 'crecimiento', -0.003); Ec.aplicarDelta(E, 'deficit', -0.004); }
      U.serie('mundo:petroleo', m.petroleo); U.serie('mundo:cafe', m.cafe); U.serie('mundo:ciclo', m.ciclo); U.serie('mundo:fed', m.fed);
      M.turnoPandemia(E, m);
      if (E.meta.presim) return;
      M.historicos(E, m);
      if (U.chance(0.0012)) M.choqueAleatorio(E, m);
      if (!m.pandemia && U.chance(0.0004)) M.pandemia(E, m);
    },
    historicos(E, m) {
      const hoy = U.hoy(), y = hoy.getUTCFullYear(), mes = hoy.getUTCMonth();
      for (const x of HISTORICOS) {
        if (m.hechos[x.k] || y < x.y || (y === x.y && mes < x.m)) continue;
        m.hechos[x.k] = true;
        if (x.k === 'crisis29') { m.cafe = 45; m.ciclo = -4; M.recesion(E, 'La Gran Depresión llega a Colombia', 'El crac de Wall Street hunde el precio del café y cierra los mercados: la crisis mundial golpea al país.'); }
        else if (x.k === 'petroleo73') { m.regimen = { dir: 1.6, hasta: E.fecha.t + 20 }; M.petroleoAlza(E); }
        else if (x.k === 'asia98') { m.ciclo = -1.5; M.recesion(E, 'Crisis financiera asiática', 'La turbulencia asiática se contagia a los emergentes: huyen los capitales y el dólar se dispara.'); }
        else if (x.k === 'crisis08') { m.ciclo = -3; M.recesion(E, 'Crisis financiera global', 'La quiebra de grandes bancos en Estados Unidos paraliza el crédito y arrastra a la economía mundial.'); }
        else if (x.k === 'crudo14') { m.regimen = { dir: -1.8, hasta: E.fecha.t + 30 }; M.petroleoBaja(E); }
        else if (x.k === 'covid20' && U.chance(0.85)) M.pandemia(E, m);
      }
    },
    choqueAleatorio(E, m) {
      const t = U.pick(['alza', 'baja', 'recesion']);
      if (t === 'alza') { m.regimen = { dir: 1.4, hasta: E.fecha.t + U.ri(14, 30) }; M.petroleoAlza(E); }
      else if (t === 'baja') { m.regimen = { dir: -1.4, hasta: E.fecha.t + U.ri(14, 30) }; M.petroleoBaja(E); }
      else { m.ciclo = -2.2; M.recesion(E, 'Recesión en la economía mundial', 'Las grandes economías se frenan y la demanda por nuestras exportaciones se enfría.'); }
    },
    dispara(E, id, ctx, auto) {
      if (M.presidente(E)) return C.Eventos.disparar(E, C.Eventos.plantilla(id), ctx || {});
      // Gobierno NPC: decide solo (opción aleatoria)
      const pl = C.Eventos.plantilla(id), ev = { id: U.id('ev'), plantilla: id, t: E.fecha.t, ctx: ctx || {}, titulo: '', texto: '' };
      E.eventos.pendientes.push(ev); const r = C.Eventos.resolver(E, ev.id, U.ri(0, pl.opciones.length - 1)); return r && r.ev;
    },
    recesion(E, titulo, texto) { M.aviso(E, 'recesion', { txt: titulo }); C.Medios.noticia(E, { tipo: 'economia', titular: titulo, tono: -1, importante: true }); M.dispara(E, 'recesionGlobal', { vars: { titulo, texto } }); },
    petroleoBaja(E) { M.aviso(E, 'baja', { txt: 'Se desploma el petróleo' }); C.Medios.noticia(E, { tipo: 'economia', titular: 'Se desploma el precio del petróleo', tono: -1, importante: true }); M.dispara(E, 'petroleoBaja'); },
    petroleoAlza(E) { M.aviso(E, 'alza', { txt: 'Bonanza petrolera' }); C.Medios.noticia(E, { tipo: 'economia', titular: 'Se dispara el precio del petróleo', tono: 1, importante: true }); M.dispara(E, 'petroleoAlza'); },
    pandemia(E, m) {
      m.pandemia = { t0: E.fecha.t, dur: U.ri(40, 64), grav: U.rf(0.7, 1.4), medida: 'focalizada' };
      M.aviso(E, 'pandemia', { txt: 'Estalla una pandemia' }); C.Medios.noticia(E, { tipo: 'economia', titular: 'La OMS declara una pandemia mundial', tono: -1, importante: true });
      M.dispara(E, 'pandemia');
    },
    turnoPandemia(E, m) {
      const p = m.pandemia; if (!p) return;
      const k = { estricta: [0.05, 0.005, 0], abierta: [0.005, 0.03, -0.03], focalizada: [0.025, 0.012, 0] }[p.medida] || [0.025, 0.012, 0];
      C.Economia.aplicarDelta(E, 'crecimiento', -k[0] * p.grav); C.Economia.aplicarDelta(E, 'salud', -k[1] * p.grav); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + k[2], 3, 95);
      if (E.fecha.t - p.t0 >= p.dur) { m.pandemia = null; C.Economia.programar(E, [{ v: 'crecimiento', d: 0.5, p: 'm' }], 'rebote'); C.Medios.noticia(E, { tipo: 'economia', titular: 'Termina la emergencia sanitaria: la economía comienza a rebotar', tono: 1, importante: true }); }
    },

    registrarAcciones() {
      const A = C.Acciones, pres = E => M.presidente(E) || 'Sólo el Presidente maneja la política macroeconómica';
      A.registrar({ id: 'fondoEstabilizacion', nombre: 'Fondo de estabilización', icono: '🏦', grupo: 'economia', costo: 1, disponible: pres,
        ejecutar(E, a) {
          const m = M.asegurar(E);
          if (a.op === 'usar') { if (m.fondo < 100) return { ok: false, msg: 'El fondo no tiene suficiente' }; m.fondo -= 100; C.Economia.programar(E, [{ v: 'crecimiento', d: 0.15, p: 'm' }, { v: 'deficit', d: 0.05, p: 'm' }], 'fondo'); return { ok: true, msg: 'Usas 100 del fondo para amortiguar la economía' }; }
          m.fondo += 100; C.Economia.programar(E, [{ v: 'deficit', d: -0.05, p: 'm' }], 'ahorro'); return { ok: true, msg: `Ahorras 100 en el fondo (saldo ${Math.round(m.fondo)})` };
        } });
      A.registrar({ id: 'coberturaPetrolera', nombre: 'Cobertura petrolera', icono: '🛡', grupo: 'economia', costo: 2, disponible: pres,
        ejecutar(E) { const m = M.asegurar(E); if (E.fecha.t < m.cobertura) return { ok: false, msg: 'Ya tienes una cobertura vigente' }; m.cobertura = E.fecha.t + 52; C.Economia.aplicarDelta(E, 'deficit', 0.05); return { ok: true, msg: 'Aseguras un piso para el crudo durante un año' }; } });
      A.registrar({ id: 'posturaFiscal', nombre: 'Postura macroeconómica', icono: '⚖', grupo: 'economia', costo: 1, disponible: pres,
        ejecutar(E, a) { if (!MODOS[a.modo]) return { ok: false, msg: 'Elige la postura' }; M.asegurar(E).modo = a.modo; return { ok: true, msg: `Tu política fiscal pasa a ser ${MODOS[a.modo].toLowerCase()}` }; } });
    }
  };
  C.MundoEco = M;
  C.Tiempo.registrar('mundoeco', M, 18);
  M.registrarAcciones();
})(window.CURUL);
