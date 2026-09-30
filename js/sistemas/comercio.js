/* Comercio exterior: qué vende y qué compra Colombia, a quién, con qué aranceles y bajo qué
   acuerdos. Cada decisión (un arancel, un TLC, entrar al Mercosur) mueve exportaciones,
   importaciones, dólar, recaudo, empleo y el ánimo de los gremios, la CUT y el campo.

   El modelo es deliberadamente estilizado pero conserva la lógica real: el efecto de un acuerdo
   se mide contra la situación de la que se parte (un multiplicador de 1 = nada cambia), se
   desgrava de forma gradual según su cronograma, y los sectores que compiten con las
   importaciones (agro sensible, industria, confecciones) acumulan tensión cuando estas suben.
   Los TLC se negocian en tlc.js y el Mercosur está en mercosur.js; ambos sólo escriben acuerdos
   y aranceles en `E.comercio`, que este módulo convierte en flujos cada semana. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const FACTOR_SOCIO = { cafe: .5, energia: .3, agroexp: 1.6, agrosens: 2.0, industria: 1, textil: 1.8, servicios: 1.5 };
  const NIVELES_ARANCEL = [0, 2, 5, 8, 10, 12, 15, 18, 20, 25, 30];
  const ACTOR_NOMBRE = { cut: 'la CUT', gremios: 'los gremios', agrario: 'el sector agrario', indigena: 'el movimiento indígena', estudiantil: 'los estudiantes' };
  let PESOS = null;

  const S = () => C.DATA.sectoresComercio, P = () => C.DATA.sociosComercio;

  const Co = {
    NIVELES_ARANCEL, FACTOR_SOCIO,
    sectores: () => S(), socios: () => P(),
    sector: id => S().find(s => s.id === id), socio: id => P().find(s => s.id === id),
    esPresidente: E => E.gobierno.presidente === 'J' || 'Sólo el Presidente',

    /* Participación de cada socio en las exportaciones/importaciones de cada sector (suman el
       peso del sector). "Resto del mundo" recibe lo que no cubren los demás socios. */
    pesos() {
      if (PESOS) return PESOS;
      const sumE = U.suma(P().filter(p => p.expShare != null).map(p => p.expShare));
      const sumI = U.suma(P().filter(p => p.impShare != null).map(p => p.impShare));
      const shE = {}, shI = {};
      for (const p of P()) { shE[p.id] = p.expShare != null ? p.expShare : 1 - sumE; shI[p.id] = p.impShare != null ? p.impShare : 1 - sumI; }
      const exp = {}, imp = {};
      for (const s of S()) {
        exp[s.id] = {}; imp[s.id] = {};
        let te = 0, ti = 0;
        for (const p of P()) {
          exp[s.id][p.id] = shE[p.id] * (C.DATA.afinidadExp[s.id][p.tipo] || 0); te += exp[s.id][p.id];
          imp[s.id][p.id] = shI[p.id] * (C.DATA.afinidadImp[s.id][p.tipo] || 0); ti += imp[s.id][p.id];
        }
        for (const p of P()) { exp[s.id][p.id] = te ? exp[s.id][p.id] / te * s.expPeso : 0; imp[s.id][p.id] = ti ? imp[s.id][p.id] / ti * s.impPeso : 0; }
      }
      PESOS = { exp, imp }; return PESOS;
    },
    /* Relación bilateral con un socio: promedio de los países que lo representan. */
    relacion(E, socioId) {
      const p = Co.socio(socioId); if (!p || !E.diplomacia) return 50;
      const v = p.paises.map(id => E.diplomacia.paises[id] && E.diplomacia.paises[id].relacion).filter(x => x != null);
      return v.length ? U.suma(v) / v.length : 50;
    },
    moverRelacion(E, socioId, d) {
      const p = Co.socio(socioId); if (!p || !E.diplomacia) return;
      for (const id of p.paises) { const st = E.diplomacia.paises[id]; if (st) st.relacion = U.clamp(st.relacion + d, 3, 97); }
    },
    actor(E, id) { return E.movilizacion && E.movilizacion.actores && E.movilizacion.actores[id]; },
    tocarActor(E, id, d) { const a = Co.actor(E, id); if (a) a.descontento = U.clamp(a.descontento + d, 0, 100); },
    relActor(E, id, d) { const a = Co.actor(E, id); if (a) a.relJ = U.clamp((a.relJ || 0) + d, -100, 100); },

    /* ── Acuerdos y aranceles ── */
    progreso(a, t) { return U.clamp((t - a.desde) / (52 * Math.max(0.5, a.anios || 1)), 0, 1); },
    /* Fracción (0-1) que ya se ha desgravado del lado `lado` ('red': lo que baja Colombia; 'acc':
       lo que baja el socio) para un sector, según el cronograma del acuerdo. */
    reduccion(E, socioId, sector, lado) {
      const a = E.comercio.acuerdos[socioId]; if (!a || a.estado !== 'vigente') return 0;
      const m = a[lado] || {}, fin = m[sector] != null ? m[sector] : (m._ != null ? m._ : 0);
      return fin * Co.progreso(a, E.fecha.t);
    },
    tarifaImp(E, sector, socioId) {
      const c = E.comercio;
      return c.aranceles[sector] * (1 - Co.reduccion(E, socioId, sector, 'red')) + (c.recargos[sector] || 0);
    },
    tarifaExp(E, sector, socioId) {
      const c = E.comercio, p = Co.socio(socioId), r = c.retorsion[socioId];
      const aec = p.mercosur && c.mercosur ? c.mercosur.aecFactor : 1;
      return p.arancel * aec * FACTOR_SOCIO[sector] * (1 - Co.reduccion(E, socioId, sector, 'acc')) + (r ? r.pp : 0);
    },
    /* Tarifa promedio ponderada (%) que paga hoy lo que Colombia importa. */
    tarifaPromedio(E) {
      const W = Co.pesos(); let t = 0, w = 0;
      for (const s of S()) for (const p of P()) { const x = W.imp[s.id][p.id]; t += x * Co.tarifaImp(E, s.id, p.id); w += x; }
      return w ? t / w : 0;
    },
    /* Instantánea de las tarifas de partida: la referencia contra la que se mide todo cambio. */
    fotoBase(E) {
      const b = { imp: {}, exp: {}, tc: E.comercio.tc };
      for (const s of S()) { b.imp[s.id] = {}; b.exp[s.id] = {}; for (const p of P()) { b.imp[s.id][p.id] = Co.tarifaImp(E, s.id, p.id); b.exp[s.id][p.id] = Co.tarifaExp(E, s.id, p.id); } }
      E.comercio.base = b;
    },
    /* Multiplicadores de volumen (1 = igual que en la partida base) por sector y socio, y sus
       efectos agregados sobre exportaciones e importaciones. */
    mult(E) {
      const c = E.comercio, W = Co.pesos(), b = c.base;
      const tcEf = c.tc / b.tc - 1, expTc = 1 + 0.35 * tcEf, impTc = 1 - 0.55 * tcEf;
      const out = { exp: {}, imp: {}, expEf: 0, impEf: 0, dom: {} };
      for (const s of S()) {
        out.exp[s.id] = {}; out.imp[s.id] = {}; out.dom[s.id] = 0;
        for (const p of P()) {
          const ti = Co.tarifaImp(E, s.id, p.id), ti0 = b.imp[s.id][p.id];
          const te = Co.tarifaExp(E, s.id, p.id), te0 = b.exp[s.id][p.id];
          const ib = p.mercosur && C.MercosurInst && C.Mercosur.esMiembro(E) ? C.MercosurInst.bonoComercio(E) : 1;
          const im = U.clamp(1 + s.elasImp * (ti0 - ti) / (100 + ti0), 0.2, 3) * impTc * ib;
          const ex = U.clamp(1 + s.elasExp * (te0 - te) / (100 + te0), 0.2, 3) * expTc * ib;
          out.imp[s.id][p.id] = im; out.exp[s.id][p.id] = ex;
          out.impEf += W.imp[s.id][p.id] * (im - 1); out.expEf += W.exp[s.id][p.id] * (ex - 1);
          if (s.impPeso) out.dom[s.id] += W.imp[s.id][p.id] * (im - 1) / s.impPeso;
        }
      }
      return out;
    },
    /* Flujos anuales (mil MUSD) por sector y socio, repartidos según los multiplicadores pero
       que suman exactamente el total macro de exportaciones e importaciones. */
    flujos(E) {
      const c = E.comercio, W = Co.pesos(), m = Co.mult(E);
      const out = { exp: {}, imp: {}, expSector: {}, impSector: {}, expSocio: {}, impSocio: {} };
      let re = 0, ri = 0;
      for (const s of S()) for (const p of P()) { re += W.exp[s.id][p.id] * m.exp[s.id][p.id]; ri += W.imp[s.id][p.id] * m.imp[s.id][p.id]; }
      const totE = E.economia.exportaciones, totI = c.impTot;
      for (const p of P()) { out.expSocio[p.id] = 0; out.impSocio[p.id] = 0; }
      for (const s of S()) {
        out.exp[s.id] = {}; out.imp[s.id] = {}; out.expSector[s.id] = 0; out.impSector[s.id] = 0;
        for (const p of P()) {
          const e = re ? W.exp[s.id][p.id] * m.exp[s.id][p.id] / re * totE : 0, i = ri ? W.imp[s.id][p.id] * m.imp[s.id][p.id] / ri * totI : 0;
          out.exp[s.id][p.id] = e; out.imp[s.id][p.id] = i;
          out.expSector[s.id] += e; out.impSector[s.id] += i; out.expSocio[p.id] += e; out.impSocio[p.id] += i;
        }
      }
      out.exportaciones = totE; out.importaciones = totI; out.balanza = totE - totI;
      out.pibMUSD = E.economia.pib * 1000 / c.tc;
      out.balanzaPct = out.balanza / out.pibMUSD * 100;
      return out;
    },
    acuerdoDe(E, socioId) { return E.comercio.acuerdos[socioId] || null; },
    acuerdosVigentes(E) { return Object.values(E.comercio.acuerdos).filter(a => a.estado === 'vigente'); },
    /* Da de alta (o reemplaza) un acuerdo. `cfg`: { tipo, nombre, anios, red, acc } */
    crearAcuerdo(E, socioId, cfg) {
      E.comercio.acuerdos[socioId] = Object.assign({ socio: socioId, estado: 'vigente', desde: E.fecha.t, anios: 10, red: { _: 0 }, acc: { _: 0 } }, cfg);
      return E.comercio.acuerdos[socioId];
    },
    /* Copia del estado de acuerdos para que quien lo cambie (un TLC, el Mercosur) pueda medir
       después cuánto movió el promedio arancelario. */
    resumenEfecto(E) {
      const m = Co.mult(E);
      return { expEf: m.expEf, impEf: m.impEf, tarifa: Co.tarifaPromedio(E) };
    },

    init(E) {
      const anio = U.anio();
      E.comercio = {
        tc: 4000, impTot: E.economia.exportaciones * 1.12, precioEnergia: 100,
        aranceles: {}, recargos: {}, retorsion: {}, arancelT: {}, salvaguardias: {},
        acuerdos: {}, negociaciones: {}, tension: {}, expEfPrev: 0, impEfPrev: 0, arancelIngresoPrev: 0,
        medidas: [], base: null
      };
      for (const s of S()) { E.comercio.aranceles[s.id] = s.mfn; if (s.dom) E.comercio.tension[s.id] = 30; }
      for (const d of C.DATA.acuerdosHistoricos) {
        if (d.desde > anio || (d.hasta && d.hasta < anio)) continue;
        Co.crearAcuerdo(E, d.socio, { tipo: d.tipo, nombre: d.nombre, anios: d.anios, red: d.red, acc: d.acc, desde: E.fecha.t - Math.round(52 * (anio - d.desde)), hastaAnio: d.hasta || null });
      }
      Co.migrarTratadosViejos(E);
      if (C.Mercosur) C.Mercosur.init(E);
      Co.fotoBase(E);
      E.comercio.arancelIngresoPrev = Co.ingresoArancel(E);
    },
    /* Partidas anteriores tenían un "tratado de libre comercio" genérico con un país: se traduce
       en un acuerdo comercial moderado con el socio que lo contiene. */
    migrarTratadosViejos(E) {
      if (!E.diplomacia) return;
      for (const pa of C.DATA.paises) {
        const st = E.diplomacia.paises[pa.id];
        if (!st || !st.tratados.includes('comercio')) continue;
        const socio = P().find(x => x.paises.includes(pa.id)) || Co.socio('ROW');
        if (E.comercio.acuerdos[socio.id]) continue;
        Co.crearAcuerdo(E, socio.id, { tipo: 'tlc', nombre: `TLC Colombia–${socio.nombre}`, anios: 10, red: { _: .7, agrosens: .4 }, acc: { _: .8, agrosens: .4 } });
      }
    },
    migrar(E) {
      if (!E.comercio || !E.comercio.acuerdos) Co.init(E);
      else if (C.Mercosur) C.Mercosur.migrar(E);
    },

    /* % del PIB que recauda Colombia por aranceles con las tarifas de hoy (aprox.). */
    ingresoArancel(E) {
      const pib = E.economia.pib * 1000 / E.comercio.tc;
      return E.comercio.impTot / pib * Co.tarifaPromedio(E);
    },

    /* ── Turno semanal ── */
    turno(E) {
      const c = E.comercio, Ev = E.economia;
      if (!c) return;
      // Precio de la energía (Colombia depende del petróleo y el carbón) y dólar
      const peAntes = c.precioEnergia;
      c.precioEnergia = U.clamp(c.precioEnergia + (100 - c.precioEnergia) * 0.01 + U.gauss(0, 1.7), 45, 190);
      const energiaPeso = S().find(s => s.id === 'energia').expPeso;
      Ev.exportaciones *= 1 + energiaPeso * (c.precioEnergia / peAntes - 1);
      const f = Co.flujos(E);
      const tcObj = c.base.tc * (1 + U.clamp(-(f.balanzaPct + 3) * 0.03, -0.25, 0.25) + (Ev.inflacion - 3) * 0.01 + (Ev.deficit - 4) * 0.008
        - (Ev.confianza - 40) * 0.002 - (Ev.tasa - 7) * 0.01 - (c.precioEnergia - 100) * 0.0015);
      const tcAntes = c.tc;
      c.tc = U.clamp(c.tc + (tcObj - c.tc) * 0.03 + U.gauss(0, 8), 2500, 7500);
      Ev.inflacion += (c.tc / tcAntes - 1) * 0.25;
      // Vencimiento de recargos y represalias
      for (const k of Object.keys(c.recargos)) if (c.salvaguardias[k] && E.fecha.t > c.salvaguardias[k].hasta) { delete c.recargos[k]; delete c.salvaguardias[k]; }
      for (const k of Object.keys(c.retorsion)) if (E.fecha.t > c.retorsion[k].hasta) delete c.retorsion[k];
      for (const a of Object.values(c.acuerdos)) if (a.estado === 'vigente' && a.hastaAnio && U.anio() > a.hastaAnio) {
        a.estado = 'terminado';
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Termina el acuerdo comercial: ${a.nombre}`, tono: -1 });
      }
      // Efecto de las políticas comerciales sobre los agregados: sólo se aplica el cambio
      const m = Co.mult(E);
      Ev.exportaciones *= (1 + m.expEf) / (1 + c.expEfPrev);
      c.impTot *= (1 + m.impEf) / (1 + c.impEfPrev);
      c.impTot *= 1 + ((Ev.crecimiento - 2) * 0.008 + 0.012) / 52 + U.gauss(0, 0.0015);
      c.expEfPrev = m.expEf; c.impEfPrev = m.impEf;
      Ev.crecimiento += (m.expEf - m.impEf * 0.5) * 0.02;
      const ing = Co.ingresoArancel(E);
      Ev.recaudo += ing - c.arancelIngresoPrev; c.arancelIngresoPrev = ing;
      // Sectores que compiten con las importaciones: acumulan tensión si estas suben
      for (const s of S().filter(x => x.dom)) {
        const objetivo = U.clamp(30 + m.dom[s.id] * 140, 0, 100);
        c.tension[s.id] += (objetivo - c.tension[s.id]) * 0.03;
      }
      const t = c.tension;
      Co.tocarActor(E, 'agrario', Math.max(0, t.agrosens - 55) * 0.012 - Math.max(0, m.expEf) * 0.05);
      Co.tocarActor(E, 'cut', Math.max(0, (t.textil + t.industria) / 2 - 55) * 0.01);
      Co.tocarActor(E, 'gremios', Math.max(0, t.industria - 55) * 0.008 - Math.max(0, m.expEf) * 0.12);
      const desempleo = (Math.max(0, (t.textil * 0.35 + t.industria * 0.65) - 45) * 0.0004) - Math.max(0, m.expEf) * 0.002;
      if (desempleo) C.Economia.aplicarDelta(E, 'desempleo', desempleo);
      // Aviso de choques de precios que mueven al país
      if (Math.abs(c.precioEnergia - 100) > 40 && U.chance(0.04)) C.Medios.noticia(E, { tipo: 'economia', titular: c.precioEnergia > 100 ? 'Se disparan los precios del petróleo y el carbón: entran más dólares al país' : 'Se desploman los precios del petróleo: preocupa el ingreso de divisas', tono: c.precioEnergia > 100 ? 1 : -1 });
      U.serie('com:exp', Ev.exportaciones); U.serie('com:imp', c.impTot); U.serie('com:tc', c.tc);
      U.serie('com:bal', Ev.exportaciones - c.impTot);
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'fijarArancel', nombre: 'Fijar arancel', icono: '🛃', grupo: 'comercio', costo: 1,
        disponible: Co.esPresidente,
        ejecutar(E, a) {
          const s = Co.sector(a.sector); if (!s || s.sinArancel) return { ok: false, msg: 'Elige un sector con arancel' };
          const nivel = +a.nivel; if (!isFinite(nivel) || nivel < 0 || nivel > 35) return { ok: false, msg: 'Elige un nivel de arancel' };
          const c = E.comercio, M = C.Mercosur;
          if (M && M.esMiembro(E) && !M.puedeFijarArancel(E, s.id)) return { ok: false, msg: 'Como miembro del Mercosur, este arancel lo fija el Arancel Externo Común: sólo puedes moverlo con una decisión del bloque o una excepción' };
          if (c.arancelT[s.id] != null && E.fecha.t - c.arancelT[s.id] < 6) return { ok: false, msg: 'Acabas de tocar este arancel: espera unas semanas' };
          const antes = c.aranceles[s.id];
          if (Math.abs(nivel - antes) < 0.5) return { ok: false, msg: 'Ya está en ese nivel' };
          const d = nivel - antes;
          c.aranceles[s.id] = nivel; c.arancelT[s.id] = E.fecha.t;
          E.economia.inflacion = U.clamp(E.economia.inflacion + d * s.impPeso * 0.05, -1, 25);
          const sube = d > 0;
          if (s.actor) { Co.relActor(E, s.actor, sube ? 2 : -2); if (s.dom) Co.tocarActor(E, s.actor, sube ? -5 : 4); }
          for (const p of P()) { const a = c.acuerdos[p.id]; if (!(a && a.estado === 'vigente') && sube) Co.moverRelacion(E, p.id, -Math.min(3, d / 5) * (p.mercosur ? 1 : 0.6)); }
          c.medidas.push({ t: E.fecha.t, txt: `Arancel de ${s.nombre.toLowerCase()}: ${antes}% → ${nivel}%` });
          C.Medios.noticia(E, { tipo: 'economia', titular: `El Gobierno ${sube ? 'sube' : 'baja'} el arancel a ${s.nombre.toLowerCase()} del ${antes} % al ${nivel} %`, tono: sube ? 0 : 0, jugador: true });
          return { ok: true, msg: `Arancel de ${s.nombre.toLowerCase()} fijado en ${nivel} %` };
        } });
      A.registrar({ id: 'salvaguardia', nombre: 'Aplicar salvaguardia', icono: '🛡', grupo: 'comercio', costo: 1,
        disponible(E, a) {
          const ok = Co.esPresidente(E); if (ok !== true) return ok;
          const s = Co.sector(a.sector); if (!s || !s.dom) return 'Sólo se aplica a sectores que compiten con las importaciones';
          const c = E.comercio;
          if (c.salvaguardias[s.id]) return 'Ya hay una salvaguardia vigente en este sector';
          if (c.arancelT['sg:' + s.id] != null && E.fecha.t - c.arancelT['sg:' + s.id] < 52) return 'Usaste una salvaguardia en este sector hace menos de un año';
          if (c.tension[s.id] < 55) return 'No hay un aumento de importaciones que la justifique: los socios protestarían';
          return true;
        },
        ejecutar(E, a) {
          const s = Co.sector(a.sector), c = E.comercio;
          c.recargos[s.id] = 8; c.salvaguardias[s.id] = { t: E.fecha.t, hasta: E.fecha.t + 26 };
          c.arancelT['sg:' + s.id] = E.fecha.t;
          c.tension[s.id] = Math.max(20, c.tension[s.id] - 14);
          if (s.actor) { Co.relActor(E, s.actor, 4); Co.tocarActor(E, s.actor, -6); }
          const conAcuerdo = Object.values(c.acuerdos).filter(x => x.estado === 'vigente' && x.tipo !== 'can');
          if (conAcuerdo.length && U.chance(0.2)) {
            const a2 = U.pick(conAcuerdo), p = Co.socio(a2.socio);
            Co.moverRelacion(E, a2.socio, -6); c.retorsion[a2.socio] = { pp: 3, hasta: E.fecha.t + 26 };
            C.Medios.noticia(E, { tipo: 'diplomacia', titular: `${p.nombre} responde a la salvaguardia colombiana con aranceles a productos del país`, tono: -1, jugador: true });
          }
          C.Medios.noticia(E, { tipo: 'economia', titular: `El Gobierno aplica una salvaguardia de 26 semanas a ${s.nombre.toLowerCase()} por el aumento de importaciones`, tono: 0, jugador: true });
          return { ok: true, msg: `Salvaguardia en ${s.nombre.toLowerCase()}: +8 puntos de arancel por 26 semanas` };
        } });
    }
  };

  C.Comercio = Co;
  C.Tiempo.registrar('comercio', Co, 64);
  Co.registrarAcciones();
})(window.CURUL);
