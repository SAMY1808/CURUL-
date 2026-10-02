/* Sectores estratégicos (Fase 34): (1) pensiones —Colpensiones frente a los fondos privados, edad de retiro, pilar solidario y
   su costo fiscal—; (2) salud con EPS —solvencia, intervención, liquidación, deudas con hospitales, UPC y modelo (mixto,
   público o privado)—; y (3) banca y Banco de la República —tasa de cambio, reservas, sesgo de la junta, presión del
   Gobierno y crisis bancarias con rescate—. Las grandes reformas llegan por el Congreso (leyes pen_*, sal_*, banrep_reforma). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const esPres = E => E.gobierno.presidente === 'J';
  const minDe = (E, ids) => { const J = E.jugador; return J.cargo === 'ministro' && ids.includes(J.cargoInfo && J.cargoInfo.ministerio); };

  /* ═══════════ Pensiones ═══════════ */
  const Pn = {
    clave: 'pensiones',
    asegurar(E) { if (E.pensiones && E.pensiones.rpm != null) return E.pensiones; E.pensiones = { rpm: 0.3, edadM: 62, edadF: 57, solid: 1, cob: 27, costo: 3.2, informal: 56, hist: [] }; return E.pensiones; },
    init(E) { E.pensiones = null; Pn.asegurar(E); },
    objCosto: p => 1.6 + p.rpm * 3.6 + p.solid * 0.45 - (p.edadM - 62) * 0.09 - (p.edadF - 57) * 0.05,
    objCob: p => 14 + p.rpm * 14 + p.solid * 9 - (p.edadM - 62) * 1.2,
    anotar(E, txt) { const p = Pn.asegurar(E); p.hist.unshift({ t: E.fecha.t, txt }); if (p.hist.length > 10) p.hist.length = 10; },
    turno(E) {
      const p = Pn.asegurar(E), oc = Pn.objCosto(p), ob = Pn.objCob(p);
      const dc = (oc - p.costo) * 0.01; p.costo += dc; E.economia.deficit += dc * 0.5;
      const dcb = (ob - p.cob) * 0.01; p.cob += dcb; for (const d of Object.values(E.deptos)) d.pobreza = U.clamp(d.pobreza - dcb * 0.012, 3, 90);
      p.informal = U.clamp(p.informal + (E.economia.desempleo - 10) * 0.002 - 0.003, 35, 75);
    },
    leyes: {
      pen_publico: (E, p) => { p.rpm = Math.min(0.8, p.rpm + 0.2); return 'Más afiliados al régimen público (Colpensiones): sube la cobertura y el costo fiscal'; },
      pen_mixto: (E, p) => { p.rpm = Math.min(0.8, p.rpm + 0.1); p.solid = Math.min(3, p.solid + 1); return 'Sistema de pilares: más régimen público y pilar solidario'; },
      pen_privado: (E, p) => { p.rpm = Math.max(0.05, p.rpm - 0.15); return 'Más ahorro individual: baja el costo fiscal, baja la cobertura'; },
      pen_edad: (E, p) => { p.edadM = Math.min(66, p.edadM + 2); p.edadF = Math.min(62, p.edadF + 2); return 'Sube la edad de pensión'; },
      pen_solidario: (E, p) => { p.solid = Math.min(3, p.solid + 1); return 'Se amplía el pilar solidario'; }
    }
  };

  /* ═══════════ Salud / EPS ═══════════ */
  const EPS_NOMBRES = ['SaludAndina EPS', 'Nueva Vida EPS', 'Sanar Colombia EPS', 'EPS del Caribe', 'Mutual Salud', 'Cooperativa Cuidar', 'Familiar Salud', 'Pacífico Salud EPS'];
  const Sa = {
    clave: 'eps',
    asegurar(E) {
      if (E.eps && E.eps.lista) return E.eps;
      const rep = [24, 18, 14, 12, 10, 8, 8, 6];
      E.eps = { modelo: 'mixto', giro: false, upc: 100, calidad: 56, hosp: { liquidez: 48, deuda: 9 }, hist: [], ultAj: -99,
        lista: EPS_NOMBRES.map((n, i) => ({ id: 'eps' + i, nombre: n, share: rep[i], solvencia: U.ri(32, 78), estado: 'activa', tInt: null })) };
      return E.eps;
    },
    init(E) { E.eps = null; Sa.asegurar(E); },
    anotar(E, txt) { const s = Sa.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 12) s.hist.length = 12; },
    activas: E => Sa.asegurar(E).lista.filter(x => x.estado !== 'liquidada'),
    redistribuir(E, eps) {
      const v = Sa.activas(E).filter(x => x !== eps); if (!v.length) return;
      const tot = U.suma(v.map(x => x.share)) || 1; for (const x of v) x.share += eps.share * x.share / tot; eps.share = 0;
    },
    gestor: E => esPres(E) || minDe(E, ['salud']) ? true : 'Sólo el Presidente o el ministro de Salud',
    turno(E) {
      const s = Sa.asegurar(E), mod = s.modelo;
      for (const x of Sa.activas(E)) {
        x.solvencia = U.clamp(x.solvencia + (s.upc - 100) * 0.018 + (mod === 'publico' ? 0.05 : mod === 'privado' ? -0.01 : 0) - 0.03 + (52 - x.solvencia) * 0.0025 + U.gauss(0, 0.45) + (x.estado === 'intervenida' ? 0.08 : 0), 0, 100);
        if (x.estado === 'activa' && x.solvencia < 18) { x.estado = 'intervenida'; x.tInt = E.fecha.t; Sa.anotar(E, `La Supersalud interviene ${x.nombre}`); C.Medios.noticia(E, { tipo: 'evento', titular: `La Supersalud interviene ${x.nombre} (${x.share.toFixed(0)} % de los afiliados)`, tono: -1, importante: x.share >= 12 }); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - x.share / 40, 3, 95); }
        else if (x.estado === 'intervenida' && E.fecha.t - x.tInt > 52) {
          if (x.solvencia < 26) { x.estado = 'liquidada'; Sa.redistribuir(E, x); s.calidad = U.clamp(s.calidad - 2.5, 20, 95); Sa.anotar(E, `Se liquida ${x.nombre}`); C.Medios.noticia(E, { tipo: 'evento', titular: `Se liquida ${x.nombre}: sus afiliados pasan a otras EPS`, tono: -1 }); }
          else { x.estado = 'activa'; Sa.anotar(E, `${x.nombre} sale de la intervención`); }
        }
      }
      const malas = U.suma(Sa.activas(E).filter(x => x.solvencia < 45).map(x => x.share));
      s.hosp.deuda = Math.max(0, s.hosp.deuda + malas * 0.003 - (s.giro ? 0.005 : 0) - 0.0015); s.hosp.liquidez = U.clamp(70 - s.hosp.deuda * 2.6, 5, 95);
      const calObj = 38 + s.hosp.liquidez * 0.25 + (s.upc - 100) * 0.3 + (mod === 'mixto' ? 6 : mod === 'publico' ? 3 : 4) - Sa.activas(E).filter(x => x.estado === 'intervenida').length * 2;
      s.calidad += (calObj - s.calidad) * 0.01;
      for (const d of Object.values(E.deptos)) d.salud = U.clamp(d.salud + (s.calidad - 55) * 0.0005, 5, 98);
      if (!esPres(E)) {
        if (E.fecha.t - s.ultAj > 26) { const prom = U.prom(Sa.activas(E).map(y => y.solvencia)); s.upc = U.clamp(s.upc + (prom < 40 ? 5 : prom > 62 ? -5 : 0), 90, 115); s.ultAj = E.fecha.t; }
        if (U.chance(0.012)) { const x = U.pick(Sa.activas(E).filter(y => y.estado === 'activa' && y.solvencia < 40)); if (x) x.solvencia += 8; }
      }
      if (Sa.activas(E).length < 5 && U.chance(0.01)) {
        const lib = EPS_NOMBRES.filter(n => !s.lista.some(y => y.nombre === n && y.estado !== 'liquidada')), n = U.pick(lib.length ? lib : EPS_NOMBRES) + ' II';
        const v = Sa.activas(E); for (const y of v) y.share *= 0.9; s.lista = s.lista.filter(y => y.estado !== 'liquidada' || s.lista.indexOf(y) > 9); s.lista.push({ id: 'eps' + U.id('n'), nombre: n, share: 10 * v.length / Math.max(1, v.length) , solvencia: U.ri(45, 70), estado: 'activa', tInt: null });
      }
      if (s.hosp.deuda > 14 && U.chance(0.004)) { C.Medios.noticia(E, { tipo: 'evento', titular: 'Crisis hospitalaria: clínicas y hospitales cierran servicios por deudas de las EPS', tono: -1, importante: true }); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 0.7, 3, 95); }
    },
    leyes: {
      sal_publico: (E, s) => { s.modelo = 'publico'; for (const x of s.lista) x.solvencia = Math.min(100, x.solvencia + 6); return 'Las EPS pasan a ser gestoras y se fortalece la red pública'; },
      sal_mixto: (E, s) => { s.modelo = 'mixto'; s.calidad += 2; return 'Modelo mixto con atención primaria'; },
      sal_privado: (E, s) => { s.modelo = 'privado'; return 'Libre elección y competencia entre aseguradoras'; },
      sal_giro: (E, s) => { s.giro = true; return 'Giro directo a hospitales: baja la deuda hospitalaria'; }
    }
  };

  /* ═══════════ Banca y Banco de la República ═══════════ */
  const Bn = {
    clave: 'banca',
    asegurar(E) { if (E.banca && E.banca.tc != null) return E.banca; E.banca = { tc: 3950, reservas: 58, sesgo: 0, indep: 70, solidez: 72, crisis: null, presion: null, ultCod: -99, fogafin: false, hist: [] }; return E.banca; },
    init(E) { E.banca = null; Bn.asegurar(E); },
    anotar(E, txt) { const b = Bn.asegurar(E); b.hist.unshift({ t: E.fecha.t, txt }); if (b.hist.length > 12) b.hist.length = 12; },
    gestor: E => esPres(E) || minDe(E, ['hacienda']) ? true : 'Sólo el Presidente o el ministro de Hacienda',
    turno(E) {
      const b = Bn.asegurar(E), Ev = E.economia;
      const tcObj = 3500 + (Ev.deficit - 4) * 70 + (45 - Ev.confianza) * 16;
      b.tc = U.clamp(b.tc + (tcObj - b.tc) * 0.02 + U.gauss(0, 16), 2200, 7000);
      const rel = (b.tc - 3900) / 3900;
      Ev.inflacion += rel * 0.012; Ev.exportaciones += rel * 0.02; Ev.deuda += rel * 0.03;
      b.reservas = U.clamp(b.reservas + 0.01, 10, 120);
      Ev.tasa = U.clamp(Ev.tasa + b.sesgo * 0.004, 1.75, 16);
      if (b.presion) { if (E.fecha.t >= b.presion.hasta) b.presion = null; else Ev.tasa = U.clamp(Ev.tasa + (b.presion.dir === 'bajar' ? -0.012 : 0.012) * (1 - b.indep / 120), 1.75, 16); }
      b.indep = U.clamp(b.indep + 0.01, 10, 95);
      const sObj = 80 - Math.max(0, Ev.tasa - 9) * 3 - Math.max(0, -Ev.crecimiento) * 5 - (Ev.desempleo - 10) * 1 + (b.fogafin ? 6 : 0);
      b.solidez = U.clamp(b.solidez + (sObj - b.solidez) * 0.01 + U.gauss(0, 0.2), 0, 100);
      if (!b.crisis && b.solidez < 38 && U.chance(0.035 * (b.fogafin ? 0.5 : 1))) {
        b.crisis = { t: E.fecha.t, grav: Math.round(U.clamp(60 - b.solidez + U.ri(5, 25), 15, 90)) };
        Bn.anotar(E, 'Estalla una crisis bancaria'); C.Medios.noticia(E, { tipo: 'economia', titular: 'Crisis bancaria: se congelan los créditos y crece el temor de una corrida', tono: -1, importante: true });
      }
      if (b.crisis) {
        const g = b.crisis.grav / 100; Ev.crecimiento -= g * 0.012; Ev.desempleo += g * 0.01; Ev.confianza -= g * 0.04;
        if (!esPres(E) && U.chance(0.07)) Bn.rescatar(E, false);
        else if (E.fecha.t - b.crisis.t > 52) { b.solidez = Math.min(100, b.solidez + 15); b.crisis = null; Bn.anotar(E, 'La crisis bancaria se supera a un alto costo'); Ev.crecimiento -= 0.3; }
      }
    },
    rescatar(E, jugador) {
      const b = Bn.asegurar(E), c = b.crisis ? +(b.crisis.grav * 0.035).toFixed(1) : 0.5;
      C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(c), p: 'm' }], 'banca'); b.solidez = Math.min(100, b.solidez + 25); b.crisis = null; E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 2, 3, 95);
      Bn.anotar(E, `Rescate bancario por ${c} billones`); C.Medios.noticia(E, { tipo: 'economia', titular: `El Gobierno rescata el sistema financiero con ${c} billones`, tono: 0, jugador: !!jugador });
      return c;
    },
    leyes: {
      banrep_reforma: (E, b) => { b.indep = Math.max(10, b.indep - 15); b.sesgo = U.clamp(b.sesgo - 1, -3, 3); return 'La junta del Banco queda más cerca del Gobierno: pierde independencia'; },
      fogafin: (E, b) => { b.fogafin = true; b.solidez = Math.min(100, b.solidez + 6); return 'Seguro de depósitos fortalecido: las crisis son menos probables'; }
    }
  };

  // Las leyes estructurales aplican sus cambios al sancionarse.
  C.Bus.on('ley', p => {
    const E = C.E; if (!E || !p) return;
    let msg = null;
    if (Pn.leyes[p.plantilla]) msg = Pn.leyes[p.plantilla](E, Pn.asegurar(E)), Pn.anotar(E, msg);
    else if (Sa.leyes[p.plantilla]) msg = Sa.leyes[p.plantilla](E, Sa.asegurar(E)), Sa.anotar(E, msg);
    else if (Bn.leyes[p.plantilla]) msg = Bn.leyes[p.plantilla](E, Bn.asegurar(E)), Bn.anotar(E, msg);
    if (msg) C.Medios.noticia(E, { tipo: 'legislativo', titular: msg, tono: 0 });
  });

  const A = C.Acciones;
  A.registrar({ id: 'ajustarUPC', nombre: 'Ajustar la UPC (pago por afiliado)', icono: '💊', grupo: 'ejecutivo', costo: 2,
    disponible(E, a) { const g = Sa.gestor(E); if (g !== true) return g; const s = Sa.asegurar(E); if (E.fecha.t - s.ultAj < 13) return 'Sólo un ajuste por trimestre'; return (a.delta > 0 && s.upc >= 115) || (a.delta < 0 && s.upc <= 90) ? 'Fuera de rango' : true; },
    ejecutar(E, a) { const s = Sa.asegurar(E), d = a.delta > 0 ? 5 : -5; s.upc += d; s.ultAj = E.fecha.t; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(d * 0.35), p: 'm' }], 'eps'); return { ok: true, msg: `UPC en ${s.upc} % de lo adecuado: ${d > 0 ? 'más solvencia para las EPS y más gasto' : 'ahorro fiscal a costa de la solvencia'}` }; } });
  A.registrar({ id: 'intervenirEPS', nombre: 'Intervenir una EPS', icono: '🛑', grupo: 'ejecutivo', costo: 2,
    disponible(E, a) { const g = Sa.gestor(E); if (g !== true) return g; const x = Sa.asegurar(E).lista.find(y => y.id === a.eps); return x && x.estado === 'activa' ? true : 'Elige una EPS activa'; },
    ejecutar(E, a) { const x = Sa.asegurar(E).lista.find(y => y.id === a.eps); x.estado = 'intervenida'; x.tInt = E.fecha.t; x.solvencia = Math.min(100, x.solvencia + 8); Sa.anotar(E, `Intervienes ${x.nombre}`); return { ok: true, msg: `${x.nombre} queda intervenida con gerente de la Supersalud` }; } });
  A.registrar({ id: 'liquidarEPS', nombre: 'Liquidar una EPS', icono: '🧨', grupo: 'ejecutivo', costo: 3,
    disponible(E, a) { const g = Sa.gestor(E); if (g !== true) return g; const x = Sa.asegurar(E).lista.find(y => y.id === a.eps); return x && x.estado !== 'liquidada' && Sa.activas(E).length > 3 ? true : 'No se puede liquidar'; },
    ejecutar(E, a) { const s = Sa.asegurar(E), x = s.lista.find(y => y.id === a.eps); x.estado = 'liquidada'; Sa.redistribuir(E, x); s.calidad = Math.max(20, s.calidad - 2); E.opinion.aprobacionPres -= 0.8; Sa.anotar(E, `Liquidas ${x.nombre}`); return { ok: true, msg: `${x.nombre} se liquida: sus afiliados pasan a otras EPS` }; } });
  A.registrar({ id: 'capitalizarHospitales', nombre: 'Capitalizar y pagar deudas a hospitales', icono: '🏥', grupo: 'ejecutivo', costo: 3,
    disponible(E) { const g = Sa.gestor(E); return g !== true ? g : (Sa.asegurar(E).hosp.deuda < 2 ? 'Los hospitales están al día' : true); },
    ejecutar(E) { const s = Sa.asegurar(E); s.hosp.deuda = Math.max(0, s.hosp.deuda - 3); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(1.0), p: 'm' }], 'eps'); E.opinion.aprobacionPres += 0.6; return { ok: true, msg: 'Se giran 1,0 billones: la deuda con hospitales baja en 3' }; } });
  A.registrar({ id: 'presionarBanrep', nombre: 'Presionar a la junta del Banco de la República', icono: '🏦', grupo: 'ejecutivo', costo: 2,
    disponible(E) { const g = Bn.gestor(E); return g !== true ? g : (Bn.asegurar(E).presion ? 'Ya hay una presión en curso' : true); },
    ejecutar(E, a) { const b = Bn.asegurar(E), dir = a.dir === 'subir' ? 'subir' : 'bajar'; b.presion = { dir, hasta: E.fecha.t + 12 }; b.indep = Math.max(10, b.indep - 3); E.economia.confianza -= 0.6; if (dir === 'bajar') E.opinion.aprobacionPres += 0.5; return { ok: true, msg: `Presionas para ${dir} las tasas durante doce semanas: pierde independencia el Banco y cae la confianza de los inversionistas` }; } });
  A.registrar({ id: 'nombrarCodirectorBanrep', nombre: 'Nombrar codirector del Banco de la República', icono: '🎩', grupo: 'ejecutivo', costo: 2,
    disponible(E) { const g = Bn.gestor(E); return g !== true ? g : (E.fecha.t - Bn.asegurar(E).ultCod < 52 ? 'Sólo un nombramiento al año' : true); },
    ejecutar(E, a) { const b = Bn.asegurar(E), h = a.perfil === 'heterodoxo'; b.sesgo = U.clamp(b.sesgo + (h ? -1 : 1), -3, 3); b.ultCod = E.fecha.t; return { ok: true, msg: h ? 'Un economista heterodoxo llega a la junta: la política monetaria se inclina a bajar tasas' : 'Un ortodoxo llega a la junta: la política monetaria se endurece' }; } });
  A.registrar({ id: 'intervenirCambio', nombre: 'Intervenir el mercado cambiario', icono: '💱', grupo: 'ejecutivo', costo: 2,
    disponible(E, a) { const g = Bn.gestor(E); if (g !== true) return g; const b = Bn.asegurar(E); return a.dir === 'comprar' ? (b.reservas > 100 ? 'Reservas altas' : true) : (b.reservas < 15 ? 'Reservas bajas' : true); },
    ejecutar(E, a) { const b = Bn.asegurar(E), v = a.dir === 'vender'; b.reservas += v ? -2 : 2; b.tc *= v ? 0.975 : 1.02; return { ok: true, msg: v ? 'El Banco vende 2.000 millones de dólares: el dólar baja' : 'El Banco compra 2.000 millones de dólares: sube el dólar y las reservas' }; } });
  A.registrar({ id: 'rescateBancario', nombre: 'Rescatar el sistema financiero (Fogafín)', icono: '🆘', grupo: 'ejecutivo', costo: 3,
    disponible(E) { const g = Bn.gestor(E); return g !== true ? g : (Bn.asegurar(E).crisis ? true : 'No hay crisis bancaria'); },
    ejecutar(E) { const c = Bn.rescatar(E, true); return { ok: true, msg: `Rescate de ${c} billones: se contiene la crisis, pero el costo político es alto` }; } });

  C.Pensiones = Pn; C.EPS = Sa; C.Banca = Bn;
  for (const [n, o, pr] of [['Pensiones', Pn, 60], ['EPS', Sa, 61], ['Banca', Bn, 62]]) { o.migrar = o.init; C.Tiempo.registrar(n.toLowerCase(), o, pr); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push(n); }
})(window.CURUL);
