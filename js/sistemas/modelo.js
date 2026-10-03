/* Modelo económico radical (Fase 41). La propiedad pública de diez sectores (banca, energía, petróleo, telecomunicaciones,
   salud, pensiones, minería, tierras, transporte y comercio exterior) se puede estatizar o privatizar —por ley, por decreto
   o negociando con el sector—, y hay medidas de choque: controles de cambio y de precios, dolarización, moratoria de la
   deuda, terapia de choque, privatizar todo o nacionalizar lo estratégico. Todo con altos y bajos: la estatización tiene
   luna de miel y luego se desgasta con la ineficiencia; la privatización duele primero (curva en J) y rinde después; los
   inversionistas huyen, aparece el mercado paralelo, la escasez, las sanciones y los golpes de las demás potencias. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, D = () => C.DATA.modelo;
  const esPres = E => E.gobierno.presidente === 'J';
  const num = x => Number.isFinite(x) ? x : 0;

  const Mo = {
    clave: 'modelo',
    asegurar(E) {
      if (E.modelo && E.modelo.sec) return E.modelo;
      const sec = {}; for (const [k, s] of Object.entries(D().SECTORES)) sec[k] = { S: s.estatal0, meta: s.estatal0, ef: 62, efp: 58, paso: 1.5, neg: false, prev: s.estatal0 };
      E.modelo = { sec, ind: { confInv: 55, fuga: 10, escasez: 8, paralelo: 0, sanciones: 0 }, flags: { cc: false, cp: false, dol: false, mor: false, terapia: null }, decretos: [], hist: [], ult: -99 };
      return E.modelo;
    },
    init(E) { E.modelo = null; Mo.asegurar(E); },
    anotar(E, txt) { const m = Mo.asegurar(E); m.hist.unshift({ t: E.fecha.t, txt }); if (m.hist.length > 20) m.hist.length = 20; },
    /* ── Definiciones de medidas ── */
    def(id) {
      if (!id) return null; const [t, s] = String(id).split(':');
      if ((t === 'nacionalizar' || t === 'privatizar') && D().SECTORES[s]) { const S = D().SECTORES[s], nac = t === 'nacionalizar'; return { id, tipo: nac ? 'nac' : 'priv', sector: s, n: `${nac ? 'Nacionalizar' : 'Privatizar'}: ${S.n}`, icono: nac ? '🏴' : '🏷', actor: S.actor, eco: nac ? -70 : 70, txt: nac ? 'Pasa el sector a manos del Estado, con indemnización y gradualidad.' : 'Vende el sector a manos privadas, gradualmente.' }; }
      const e = D().ESPECIALES[id]; return e ? Object.assign({ id }, e) : null;
    },
    actorDe(E, id) { const d = Mo.def(id), a = d.actor, pod = d.sector && D().SECTORES[d.sector].pod; let poder = a[2]; if (pod && C.Poderes) poder = Math.round((poder + C.Poderes.st(E, pod).poder) / 2); return { n: a[0], icono: a[1], poder }; },
    listaMedidas(E) {
      const m = Mo.asegurar(E), out = [];
      for (const k of Object.keys(D().SECTORES)) { if (m.sec[k].meta < 80) out.push(Mo.def('nacionalizar:' + k)); if (m.sec[k].meta > 12) out.push(Mo.def('privatizar:' + k)); }
      for (const k of Object.keys(D().ESPECIALES)) { const f = m.flags; if ((k === 'controlCambio' && f.cc) || (k === 'liberarCambio' && !f.cc) || (k === 'controlPrecios' && f.cp) || (k === 'liberarPrecios' && !f.cp) || (k === 'dolarizar' && f.dol) || (k === 'moratoria' && f.mor)) continue; out.push(Mo.def(k)); }
      return out;
    },
    estatismo(E) { const m = Mo.asegurar(E), ks = Object.keys(m.sec); return U.suma(ks.map(k => m.sec[k].S - D().SECTORES[k].estatal0)) / ks.length; },
    etiqueta(E) { const e = Mo.estatismo(E), m = Mo.asegurar(E); const x = e > 25 ? 'Socialismo de Estado' : e > 10 ? 'Intervencionismo' : e > -8 ? 'Economía mixta' : e > -18 ? 'Liberalismo' : 'Ultraliberalismo'; return m.flags.dol && e < 0 ? x + ' dolarizado' : x; },
    puedeDecretar(E) { return esPres(E) && ((C.Regimen && C.Regimen.poderDecreto(E)) || (C.Decretos && C.Decretos.activa(E) && C.Decretos.activa(E).tipo === 'emergencia')); },
    /* ── Aplicar una medida (ya aprobada por ley, decreto o mesa) ── */
    aplicar(E, id, o) {
      o = o || {}; const m = Mo.asegurar(E), d = Mo.def(id), I = m.ind; if (!d) return '';
      const neg = !!o.negociada, mu = neg ? 0.6 : 1; let txt = '';
      const sector = (k, hacia) => {
        const s = m.sec[k], S = D().SECTORES[k], delta = Math.abs(hacia - s.meta); if (delta < 3) return;
        s.prev = s.S; s.meta = hacia; s.paso = neg ? 0.9 : 1.6; s.neg = neg; s.t0 = E.fecha.t;
        if (hacia > s.S) { I.confInv = U.clamp(I.confInv - delta * 0.35 * S.sens * mu, 0, 100); I.fuga = U.clamp(I.fuga + delta * 0.25 * S.sens * mu, 0, 100); if (S.pod && C.Poderes) C.Poderes.mover(E, S.pod, -delta * 0.45 * mu); if (C.Movilizacion) { const a = C.Movilizacion.actor(E, 'gremios'); if (a) a.descontento = U.clamp(a.descontento + delta * 0.12, 0, 100); const c = C.Movilizacion.actor(E, 'cut'); if (c) c.descontento = U.clamp(c.descontento - delta * 0.1, 0, 100); } }
        else { I.confInv = U.clamp(I.confInv + delta * 0.12 * S.sens, 0, 100); if (S.pod && C.Poderes) C.Poderes.mover(E, S.pod, delta * 0.15); if (C.Movilizacion) { const c = C.Movilizacion.actor(E, 'cut'); if (c) c.descontento = U.clamp(c.descontento + delta * 0.25, 0, 100); } }
      };
      if (d.tipo === 'nac') { sector(d.sector, 88); txt = `El Estado empieza a tomar el control de ${D().SECTORES[d.sector].n.toLowerCase()}`; }
      else if (d.tipo === 'priv') { sector(d.sector, 8); txt = `Arranca la venta de ${D().SECTORES[d.sector].n.toLowerCase()}`; }
      else if (d.tipo === 'masiva') { for (const k of (d.sectores || Object.keys(D().SECTORES))) sector(k, d.meta); txt = d.id === 'privatizarTodo' ? 'Arranca la gran privatización: todo lo que pueda venderse, se vende' : 'Arranca la estatización de los sectores estratégicos'; if (d.id === 'nacionalizarClave') { I.confInv = Math.max(0, I.confInv - 12 * mu); I.sanciones = Math.min(100, I.sanciones + 8); } }
      else if (id === 'controlCambio') { m.flags.cc = true; I.paralelo = Math.max(I.paralelo, 6); I.confInv = Math.max(0, I.confInv - 10 * mu); txt = 'Se fija el dólar oficial y se restringe su compra'; }
      else if (id === 'liberarCambio') { m.flags.cc = false; I.confInv = Math.min(100, I.confInv + 8); I.fuga = Math.min(100, I.fuga + 6); txt = 'Se libera el mercado cambiario'; }
      else if (id === 'controlPrecios') { m.flags.cp = true; E.economia.inflacion = Math.max(0, E.economia.inflacion - 1.0); I.confInv = Math.max(0, I.confInv - 6 * mu); txt = 'Se congelan los precios de la canasta básica'; }
      else if (id === 'liberarPrecios') { m.flags.cp = false; E.economia.inflacion += 1.6; I.escasez = Math.max(0, I.escasez - 5); txt = 'Se liberan los precios: salta la inflación'; }
      else if (id === 'dolarizar') { m.flags.dol = true; E.economia.inflacion = Math.max(2, E.economia.inflacion - 0.5); E.economia.crecimiento -= 0.4; I.confInv = Math.min(100, I.confInv + 8); txt = 'Colombia se dolariza: adiós al peso'; }
      else if (id === 'moratoria') { m.flags.mor = true; E.economia.deuda = Math.max(25, E.economia.deuda - 12); I.confInv = Math.max(0, I.confInv - 35 * mu); I.sanciones = Math.min(100, I.sanciones + 28); E.economia.tasa = Math.min(16, E.economia.tasa + 2.5); if (C.Banca) C.Banca.asegurar(E).solidez -= 8; txt = 'El país declara la moratoria de su deuda: respiro fiscal, portazo de los mercados'; }
      else if (id === 'terapia') { m.flags.terapia = E.fecha.t; I.confInv = Math.min(100, I.confInv + 15); C.Economia.programar(E, [{ v: 'deficit', d: -2.2, p: 'm' }, { v: 'inflacion', d: -1.5, p: 'l' }, { v: 'desempleo', d: 1.5, p: 'm' }, { v: 'pobreza', d: 1.6, p: 'l' }, { v: 'crecimiento', d: -0.8, p: 'm' }, { v: 'crecimiento', d: 1.0, p: 'l' }], 'modelo'); if (C.Movilizacion) { const c = C.Movilizacion.actor(E, 'cut'); if (c) c.descontento = Math.min(100, c.descontento + 18); } txt = 'Terapia de choque: austeridad y apertura inmediatas'; }
      Mo.anotar(E, txt + (neg ? ' (negociada)' : '') + (o.via ? ` · vía ${o.via}` : ''));
      C.Medios.noticia(E, { tipo: 'economia', titular: txt, tono: d.eco < 0 ? -1 : 0, importante: true, jugador: esPres(E) });
      return txt;
    },
    revertir(E, id) {
      const m = Mo.asegurar(E), d = Mo.def(id); if (!d) return;
      if (d.sector) m.sec[d.sector].meta = m.sec[d.sector].prev; else if (d.tipo === 'masiva') for (const k of (d.sectores || Object.keys(D().SECTORES))) m.sec[k].meta = m.sec[k].prev;
      else if (id === 'controlCambio') m.flags.cc = false; else if (id === 'controlPrecios') m.flags.cp = false;
    },
    /* ── Dinámica semanal ── */
    turno(E) {
      const m = Mo.asegurar(E), I = m.ind, Ec = E.economia, t = E.fecha.t;
      let eff = { cr: 0, pob: 0, des: 0, def: 0, inf: 0 };
      for (const [k, s] of Object.entries(m.sec)) {
        const S0 = D().SECTORES[k].estatal0, SS = D().SECTORES[k];
        if (Math.abs(s.meta - s.S) > 0.01) {
          const paso = U.clamp(s.meta - s.S, -s.paso, s.paso), old = s.S; s.S += paso;
          if (paso > 0) { const cost = paso / 100 * SS.valor * (s.neg ? 1.15 : 1); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(cost), p: 'm' }], 'modelo'); s.ef = (s.ef * old + (s.neg ? 70 : 64) * paso) / Math.max(1, s.S); I.confInv = U.clamp(I.confInv - paso * 0.1 * SS.sens, 0, 100); }
          else { const gana = -paso / 100 * SS.valor * 0.9; C.Economia.programar(E, [{ v: 'deficit', d: -C.Economia.impactoFiscal(gana), p: 'm' }], 'modelo'); s.efp = (s.efp * (100 - old) + (s.neg ? 46 : 36) * -paso) / Math.max(1, 100 - s.S); }
        }
        s.ef = U.clamp(s.ef + (30 - s.ef) * (s.neg ? 0.0009 : 0.0013) * (1 + (E.opinion.escandalos || 0) * 0.02), 20, 95);
        s.efp = U.clamp(s.efp + (74 - s.efp) * 0.0010, 20, 95);
        const e = SS.K * (s.S - S0) / 100 * (s.ef - s.efp) / 25;
        eff.cr += 0.0035 * e; eff.pob += -0.005 * e; eff.des += -0.003 * e; eff.def += -0.006 * e; eff.inf += -0.0015 * e;
      }
      C.Economia.aplicarDelta(E, 'crecimiento', num(eff.cr)); C.Economia.aplicarDelta(E, 'pobreza', num(eff.pob)); C.Economia.aplicarDelta(E, 'desempleo', num(eff.des)); Ec.deficit += num(eff.def); Ec.inflacion += num(eff.inf);
      // indicadores de confianza y distorsiones
      I.confInv = U.clamp(I.confInv + (55 - I.confInv) * 0.006, 0, 100); I.fuga = U.clamp(I.fuga + (10 - I.fuga) * 0.006 - (m.flags.cc ? I.fuga * 0.02 : 0), 0, 100);
      I.paralelo = U.clamp(I.paralelo + ((m.flags.cc ? 22 + I.escasez * 0.3 : 0) - I.paralelo) * 0.02, 0, 100);
      I.escasez = U.clamp(I.escasez + ((m.flags.cp ? 58 : Math.max(5, I.fuga * 0.3)) - I.escasez) * 0.015, 0, 100);
      I.sanciones = U.clamp(I.sanciones - 0.12, 0, 100);
      C.Economia.aplicarDelta(E, 'inversion', (I.confInv - 55) * 0.0006); C.Economia.aplicarDelta(E, 'crecimiento', -I.fuga * 0.00025 - I.escasez * 0.0001 + (I.confInv - 55) * 0.0001);
      Ec.inflacion += I.paralelo * 0.0012 + I.escasez * 0.0009 - (m.flags.cp ? 0.003 : 0); Ec.confianza = U.clamp(Ec.confianza + (I.confInv - 55) * 0.0015, 5, 95); Ec.exportaciones -= I.sanciones * 0.002; Ec.deficit += I.fuga * 0.0003;
      if (m.flags.dol) { Ec.inflacion += (3 - Ec.inflacion) * 0.03; Ec.tasa += (4 - Ec.tasa) * 0.05; if (C.Banca) C.Banca.asegurar(E).tc = 3900; }
      U.serie('modelo:confInv', I.confInv); if (t % 4 === 0) U.serie('modelo:estatismo', Mo.estatismo(E));
      // decretos sujetos a revisión de la Corte
      for (const dc of m.decretos) if (dc.estado === 'vigente' && t >= dc.revision) {
        if (C.Regimen && C.Regimen.poderDecreto(E)) { dc.estado = 'avalado'; continue; }
        const p = U.clamp(0.3 + (E.corte ? E.corte.tension * 0.003 : 0) + 0.12, 0.1, 0.8);
        if (U.chance(p)) { dc.estado = 'tumbado'; Mo.revertir(E, dc.medida); if (E.corte) E.corte.tension = U.clamp(E.corte.tension + 8, 0, 100); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 1.5, 3, 95); const d = Mo.def(dc.medida); Mo.anotar(E, `La Corte tumba el decreto: ${d.n}`); C.Medios.noticia(E, { tipo: 'judicial', titular: `La Corte Constitucional tumba el decreto «${d.n}»`, tono: -1, importante: true, jugador: esPres(E) }); }
        else { dc.estado = 'avalado'; }
      }
      for (const p of Object.values(E.proyectos)) if (p.medida && p.estado === 'inexequible' && !p.revertido) { p.revertido = true; Mo.revertir(E, p.medida); Mo.anotar(E, `La Corte tumba la ley: ${Mo.def(p.medida).n}`); }
      // eventos del modelo
      if (!E.eventos.pendientes.length && t - m.ult > 8 && U.chance(0.04)) { const pl = Mo.eventoDisponible(E); if (pl) { m.ult = t; if (esPres(E)) C.Eventos.disparar(E, pl, { forzar: true }); else C.Medios.noticia(E, { tipo: 'economia', titular: pl.titulo, tono: -1 }); } }
      // presidentes NPC radicales
      if (!esPres(E) && t % 13 === 0 && U.chance(0.12)) Mo.npc(E);
    },
    eventoDisponible(E) {
      const m = Mo.asegurar(E), I = m.ind, S = m.sec, ev = id => C.Eventos.plantilla(id), c = [];
      if (I.fuga > 40) c.push('mo_fuga'); if (I.escasez > 38) c.push('mo_escasez'); if (I.paralelo > 22) c.push('mo_paralelo'); if (Object.values(S).some(s => s.S > s.meta + 2)) c.push('mo_protesta_priv'); if (Object.values(S).some(s => s.S < D().SECTORES[Object.keys(S).find(k => S[k] === s)].estatal0 - 15 && s.efp < 50)) c.push('mo_tarifas'); if (I.confInv < 35) c.push('mo_calificadoras'); if (I.sanciones > 22) c.push('mo_sanciones'); if (S.banca.S > 55 && S.banca.ef < 48) c.push('mo_banco');
      return c.length ? ev(U.pick(c)) : null;
    },
    /* Un presidente NPC de ideología extrema puede lanzarse a nacionalizar o privatizar */
    npc(E) {
      const pr = E.politicos[E.gobierno.presidente]; if (!pr || E.opinion.aprobacionPres < 35) return; const m = Mo.asegurar(E);
      if (pr.eco <= -55 && U.chance(0.5)) { const k = U.pick(Object.keys(m.sec).filter(x => m.sec[x].meta < 70)); if (k) Mo.aplicar(E, 'nacionalizar:' + k, { via: 'ley' }); }
      else if (pr.eco >= 55 && U.chance(0.5)) { const k = U.pick(Object.keys(m.sec).filter(x => m.sec[x].meta > 20)); if (k) Mo.aplicar(E, 'privatizar:' + k, { via: 'ley' }); }
    },
    registrarAcciones() {
      const A = C.Acciones, def = (E, a) => Mo.def(a.medida);
      A.registrar({ id: 'ejecutarMedida', nombre: 'Ejecutar una medida económica', icono: '🏴', grupo: 'economia', costo: 3,
        disponible(E, a) {
          const d = def(E, a); if (!d) return 'Elige la medida'; const J = E.jugador;
          if (a.via === 'ley') return esPres(E) || J.camara || (J.cargo === 'ministro') ? true : 'Para proponer una ley debes ser Presidente, ministro o congresista';
          if (a.via === 'decreto') return !esPres(E) ? 'Sólo el Presidente decreta' : Mo.puedeDecretar(E) ? true : 'No tienes poderes de decreto: necesitas una emergencia económica vigente o un régimen de excepción';
          if (a.via === 'mesa') return esPres(E) ? true : 'Sólo el Presidente negocia con los sectores';
          return 'Elige la vía';
        },
        ejecutar(E, a) {
          const d = def(E, a), J = E.jugador;
          if (a.via === 'mesa') { const m = C.Mesa.crear(E, 'sector', d.id, { viaMedida: 'mesa' }); return { ok: true, msg: `Abres una mesa de negociación sobre «${d.n}»`, mesa: m.id }; }
          if (a.via === 'decreto') { const txt = Mo.aplicar(E, d.id, { via: 'decreto' }); Mo.asegurar(E).decretos.push({ id: U.id('mdc'), medida: d.id, t: E.fecha.t, revision: E.fecha.t + U.ri(4, 9), estado: 'vigente' }); return { ok: true, msg: `Decreto expedido: ${txt}. La Corte lo revisará.` }; }
          const gob = esPres(E) || J.cargo === 'ministro';
          const p = C.Legislacion.crear(E, { plantilla: 'mod_medida', autor: J.camara || gob ? 'J' : null, gobierno: gob, titulo: d.n, eco: d.eco, soc: 0, costo: 0, origen: J.camara || a.origen || 'senado', urgencia: gob && !!a.urgencia });
          p.medida = d.id; C.Opinion.subirRec(E, 1);
          return { ok: true, msg: `Proyecto radicado: ${p.numero} («${d.n}»)`, proyecto: p.id };
        } });
      A.registrar({ id: 'reorganizarSector', nombre: 'Reorganizar un sector estatal', icono: '🛠', grupo: 'economia', costo: 2,
        disponible(E, a) { const s = Mo.asegurar(E).sec[a.sector]; if (!s) return 'Elige el sector'; if (!esPres(E)) return 'Sólo el Presidente'; if (s.S < 25) return 'El sector es casi todo privado'; return s.ef >= 85 ? 'Ya funciona muy bien' : true; },
        ejecutar(E, a) { const s = Mo.asegurar(E).sec[a.sector]; s.ef = Math.min(85, s.ef + 12 + (E.jugador.atributos.gestion - 50) / 10); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.3), p: 'm' }], 'modelo'); return { ok: true, msg: `Reorganizas ${D().SECTORES[a.sector].n.toLowerCase()}: eficiencia ${Math.round(s.ef)}` }; } });
    }
  };
  C.Modelo = Mo; Mo.migrar = Mo.init;
  C.Bus.on('ley', p => { const E = C.E; if (E && p && p.medida) Mo.aplicar(E, p.medida, { via: 'ley' }); });
  C.Tiempo.registrar('modelo', Mo, 73); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Modelo'); Mo.registrarAcciones();
})(window.CURUL);
