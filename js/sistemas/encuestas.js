/* Encuestas: varias firmas con muestra, margen de error y sesgo de casa propios miden la aprobación
   del Presidente, el rumbo del país, los problemas que más preocupan, la intención de voto por
   partido y —cuando hay elecciones a la vista— por candidato presidencial, además de tu imagen por
   segmentos. Salen encuestas periódicas de las firmas y puedes encargar las tuyas: honestas o "a tu
   favor" (con riesgo de que se descubra). Las firmas ganan o pierden reputación según qué tan cerca
   quedaron de los resultados reales, y hay un promedio ponderado de todas ellas.

   Ningún cálculo de lectura (promedios, series) usa números aleatorios: sólo `realizar` los gasta. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const FIRMAS = () => C.DATA.encuestadoras;
  const PROBLEMAS = { seguridad: 'Seguridad', economia: 'Economía y costo de vida', empleo: 'Empleo', corrupcion: 'Corrupción', salud: 'Salud', educacion: 'Educación' };
  const MUESTRAS = [500, 1000, 2000];

  const En = {
    PROBLEMAS, MUESTRAS,
    firma(id) { return FIRMAS().find(f => f.id === id); },
    asegurar(E) {
      if (!E.encuestas) E.encuestas = { lista: [], firmas: {}, privadas: [] };
      const q = E.encuestas; q.privadas = q.privadas || [];
      for (const f of FIRMAS()) if (!q.firmas[f.id]) q.firmas[f.id] = { rep: Math.round(f.fiab * 100), errores: [], ultima: null };
      return q;
    },
    init(E) { E.encuestas = null; En.asegurar(E); },
    migrar(E) { En.asegurar(E); },
    rep(E, id) { return En.asegurar(E).firmas[id].rep; },
    /* Margen de error (± puntos) al 95 % con un efecto de diseño de 1,3. */
    margen(n) { return 1.96 * Math.sqrt(0.25 / n) * 100 * 1.3; },

    /* ── Verdades del mundo que las encuestas miden con error ── */
    problemas(E) {
      const Ev = E.economia, d = Object.values(E.deptos);
      const s = {
        seguridad: 100 - U.prom(d.map(x => x.seguridad)) + 8,
        economia: Math.max(0, Ev.inflacion - 3) * 5 + Math.max(0, 4 - Ev.crecimiento) * 4 + 12,
        empleo: Math.max(0, Ev.desempleo - 6) * 4 + 8,
        corrupcion: 14 + E.opinion.escandalos * 5 + (E.opinion.corrupcionAcum || 0) * 3,
        salud: 100 - U.prom(d.map(x => x.salud)) + 2,
        educacion: 100 - U.prom(d.map(x => x.educacion)) - 4
      };
      const tot = U.suma(Object.values(s).map(v => Math.max(1, v)));
      return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Math.max(1, v) / tot * 100]));
    },
    /* Campo de candidatos presidenciales sin efectos secundarios: el mejor de cada partido grande. */
    campoPresidencial(E) {
      const El = C.Elecciones, cam = E.elecciones.campana, J = E.jugador, out = [];
      const grandes = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.popularidad >= 3.5).sort((a, b) => b.popularidad - a.popularidad).slice(0, 6);
      for (const pa of grandes) {
        if (cam && cam.eleccion === 'presidencial' && cam.partido === pa.id) { out.push({ pol: 'J', partido: pa.id, nombre: J.nombre, f: El.fuerzaCandidatoPresidencial(E, { pol: 'J', partido: pa.id }, null) }); continue; }
        const pols = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.partido === pa.id && El.edadOK(p) && (!p.cargo || p.cargo.tipo !== 'presidente'));
        if (!pols.length) continue;
        const sc = p => p.r.car + p.r.amb + p.fuerza + (p.id === pa.lider ? 30 : 0);
        const p = pols.sort((a, b) => sc(b) - sc(a))[0];
        out.push({ pol: p.id, partido: pa.id, nombre: p.nombre, f: El.fuerzaCandidatoPresidencial(E, { pol: p.id, partido: pa.id, vice: null }, null) });
      }
      return out;
    },
    hayPresidencial(E) {
      const El = C.Elecciones, ev = El.proxima(E, 'presidencial');
      const cam = E.elecciones.campana;
      return !!(cam && cam.eleccion === 'presidencial') || (ev && El.semanasPara(E, ev) <= 104);
    },

    /* ── Realizar una encuesta ──
       o: { firma, muestra, cliente: 'medios' | 'J', empuje: 0..1 (a favor del cliente), publicar } */
    realizar(E, o) {
      const q = En.asegurar(E), f = En.firma(o.firma), fr = q.firmas[f.id], J = E.jugador;
      const n = o.muestra || f.muestra, margen = En.margen(n) * (1.25 - fr.rep / 200), sd = margen / 1.96;
      const empuje = o.empuje || 0;
      const eco = c => 1 + (f.sesgoEco / 100) * (c / 50);
      const noise = s => U.gauss(0, s);
      const gob = E.politicos[E.gobierno.presidente], oposJ = E.partidos[J.partido] && E.partidos[J.partido].postura === 'oposicion';

      // Aprobación del Presidente y rumbo
      const nsnr = U.clamp(7 + noise(1.2), 3, 14);
      let a = E.opinion.aprobacionPres * (1 - nsnr / 100) + f.sesgoGob + noise(sd);
      if (empuje && oposJ) a -= 3.5 * empuje; else if (empuje && E.gobierno.presidente === 'J') a += 3.5 * empuje;
      a = U.clamp(a, 2, 96 - nsnr);
      const aprob = { si: a, no: 100 - nsnr - a, nsnr };
      const rumbo = U.clamp(a * 0.75 + 4 + noise(sd * 1.2), 5, 90);

      // Problemas
      const pv = En.problemas(E), problemas = {};
      for (const k of Object.keys(PROBLEMAS)) problemas[k] = Math.max(0.5, pv[k] + noise(sd * 0.7));
      const tp = U.suma(Object.values(problemas)); for (const k of Object.keys(problemas)) problemas[k] = problemas[k] / tp * 100;

      // Temas
      const temas = Object.fromEntries(Object.keys(C.Opinion.TEMAS).map(t => [t, U.clamp(E.opinion.aprobTemas[t] + f.sesgoGob * 0.6 + noise(sd), 2, 97)]));

      // Intención de voto por partido (voto al Congreso), sobre decididos; indecisos aparte
      const indecisos = U.clamp(13 + noise(2), 6, 22), partidos = {};
      for (const p of Object.values(E.partidos)) {
        if (p.especial || p.futuro) continue;
        let v = p.popularidad * eco(p.eco) + noise(sd * Math.sqrt(Math.max(0.2, p.popularidad / 12)));
        if (empuje && p.id === J.partido) v *= 1 + 0.10 * empuje * (o.cliente === 'J' ? 1 : 0);
        partidos[p.id] = Math.max(0.2, v);
      }
      const tpp = U.suma(Object.values(partidos));
      for (const k of Object.keys(partidos)) partidos[k] = partidos[k] / tpp * (100 - indecisos);

      // Presidencial
      let pres = null;
      if (En.hayPresidencial(E)) {
        const campo = En.campoPresidencial(E), ind = U.clamp(indecisos + 6, 8, 30);
        const w = campo.map(c => Math.pow(c.f, 1.1) * eco(E.politicos[c.pol] ? E.politicos[c.pol].eco : J.ideologia.eco) * (c.pol === 'J' && empuje && o.cliente === 'J' ? 1 + 0.12 * empuje : 1) * Math.exp(noise(sd / 12)));
        const tw = U.suma(w) || 1;
        pres = campo.map((c, i) => ({ pol: c.pol, partido: c.partido, nombre: c.nombre, pct: w[i] / tw * (100 - ind) })).sort((x, y) => y.pct - x.pct);
        pres.indecisos = ind;
      }

      // Tu imagen
      const fav = U.clamp(J.popularidad + noise(sd) + (empuje && o.cliente === 'J' ? 4 * empuje : 0), 1, 98);
      const rec = U.clamp(J.reconocimiento + noise(sd), 1, 99);
      const segmentos = {};
      if (o.detalle) for (const dim of Object.values(C.Opinion.SEGMENTOS)) for (const s of dim) segmentos[s[0]] = U.clamp(C.Opinion.favSegmento(E, s[0]) + noise(sd * 1.6) + (empuje && o.cliente === 'J' ? 3 * empuje : 0), 1, 98);

      const e = { id: U.id('en'), t: E.fecha.t, firma: f.id, firmaNombre: f.nombre, cliente: o.cliente || 'medios', muestra: n, margen: +margen.toFixed(1),
        aprobacion: aprob.si, aprob, rumbo, problemas, temas, partidos, indecisos, pres, jugador: { fav, rec }, segmentos,
        empuje, expuesta: false, publicada: !!o.publicar };
      // Compatibilidad con el resumen antiguo
      e.firma = f.id; e.partidos = partidos;
      fr.ultima = E.fecha.t;
      return e;
    },
    publicar(E, e) {
      const q = En.asegurar(E); e.publicada = true;
      q.lista.push(e); if (q.lista.length > 240) q.lista.shift();
      E.opinion.ultimaEncuesta = Object.assign({ firma: e.firmaNombre }, e, { firma: e.firmaNombre, margen: e.margen });
      E.opinion.encuestas.push(E.opinion.ultimaEncuesta); if (E.opinion.encuestas.length > 60) E.opinion.encuestas.shift();
      C.Medios.noticia(E, { tipo: 'encuesta', titular: `Encuesta ${e.firmaNombre}: el Presidente tiene ${U.d1(e.aprobacion)} % de aprobación (± ${U.d1(e.margen)})${e.pres ? `; en la carrera presidencial lidera ${e.pres[0].nombre} con ${U.d1(e.pres[0].pct)} %` : ''}`, tono: e.aprobacion > 50 ? 1 : -1, jugador: e.cliente === 'J' });
      C.Bus.emit('encuesta', e);
    },

    /* Encuestas periódicas de las firmas: dos al mes, y una por semana en el último tramo previo a las elecciones. */
    turno(E) {
      En.asegurar(E);
      const hoy = U.hoy(), ev = C.Elecciones.proxima(E), cerca = ev && C.Elecciones.semanasPara(E, ev) <= 8;
      if (hoy.getUTCDate() <= 7 || cerca) {
        const k = hoy.getUTCDate() <= 7 ? 2 : 1;
        if (hoy.getUTCDate() > 7 && !U.chance(0.7)) return;
        const orden = U.barajar(FIRMAS().filter(f => f.id !== 'cifras' || U.chance(0.5)));
        for (const f of orden.slice(0, k)) En.publicar(E, En.realizar(E, { firma: f.id, cliente: 'medios', detalle: true }));
      }
    },
    mensual(E) { /* mantenido por compatibilidad: lo hace `turno` */ },

    /* ── Lectura sin azar ── */
    publicadas(E) { return En.asegurar(E).lista; },
    /* Promedio ponderado de un campo (extractor) sobre las encuestas de las últimas `sem` semanas. */
    promedio(E, ext, sem) {
      const lim = E.fecha.t - (sem || 10); let sw = 0, sv = 0, n = 0;
      for (const e of En.publicadas(E)) {
        if (e.t < lim || e.cliente === 'J' && e.empuje > 0) continue;
        const v = ext(e); if (v == null) continue;
        const w = e.muestra * (En.rep(E, e.firma) / 60) * Math.exp(-(E.fecha.t - e.t) / 6);
        sw += w; sv += w * v; n++;
      }
      return n ? { v: sv / sw, n, margen: En.margen(Math.max(500, sw / 0.9)) } : null;
    },
    serie(E, ext) { return En.publicadas(E).map(e => ({ t: e.t, v: ext(e), m: e.margen, firma: e.firmaNombre, propia: e.cliente === 'J' })).filter(x => x.v != null); },
    /* Media móvil ponderada para dibujar la tendencia. */
    tendencia(E, ext, ventana) {
      const s = En.serie(E, ext).filter(x => !x.propia), w = ventana || 8;
      return s.map(p => { let a = 0, b = 0; for (const q of s) { const d = Math.abs(q.t - p.t); if (d <= w) { const k = 1 / (1 + d); a += q.v * k; b += k; } } return { t: p.t, v: a / b }; });
    },

    /* ── Reputación: comparación con resultados reales ── */
    evaluarFirmas(E, res) {
      const q = En.asegurar(E);
      const ult = f => En.publicadas(E).filter(e => e.firma === f.id && e.cliente === 'medios' && E.fecha.t - e.t <= 12).pop();
      for (const f of FIRMAS()) {
        const e = ult(f); if (!e) continue;
        let err = null;
        if (res.tipo === 'congreso' && res.senado && res.senado.validos) {
          const dec = 100 - e.indecisos, ps = Object.keys(e.partidos).filter(k => res.senado.votos[k] != null);
          err = U.prom(ps.map(k => Math.abs(e.partidos[k] / dec * 100 - res.senado.votos[k] / res.senado.validos * 100)));
        } else if (res.tipo === 'presidencial' && res.vuelta === 1 && e.pres) {
          const dec = 100 - e.pres.indecisos, cs = e.pres.filter(c => res.candidatos.some(r => r.pol === c.pol));
          err = cs.length ? U.prom(cs.map(c => Math.abs(c.pct / dec * 100 - res.candidatos.find(r => r.pol === c.pol).pct))) : null;
        }
        if (err == null) continue;
        const fr = q.firmas[f.id]; fr.errores.push({ t: res.t, tipo: res.tipo, err: +err.toFixed(1) }); if (fr.errores.length > 8) fr.errores.shift();
        fr.rep = U.clamp(fr.rep + (3.5 - err) * 1.6, 15, 98);
      }
    },

    /* ── Acción: encargar una encuesta propia ── */
    registrarAcciones() {
      C.Acciones.registrar({ id: 'encargarEncuesta', nombre: 'Encargar encuesta', icono: '📊', grupo: 'medios', costo: 1,
        ejecutar(E, a) {
          const f = En.firma(a.firma), n = +a.muestra, J = E.jugador;
          if (!f) return { ok: false, msg: 'Elige la firma' };
          if (!MUESTRAS.includes(n)) return { ok: false, msg: 'Elige el tamaño de la muestra' };
          const modo = a.modo === 'favor' ? 'favor' : 'honesta', pub = a.publicar === 'si';
          const costo = Math.round(f.precio * n / 1000 * (modo === 'favor' ? 1.5 : 1));
          if (J.patrimonio < costo) return { ok: false, msg: `Necesitas ${U.cop(costo)} en efectivo` };
          J.patrimonio -= costo;
          const e = En.realizar(E, { firma: f.id, muestra: n, cliente: 'J', empuje: modo === 'favor' ? 1 : 0, publicar: pub, detalle: true });
          const q = En.asegurar(E);
          if (pub) {
            En.publicar(E, e);
            if (modo === 'favor') {
              C.Opinion.subirRec(E, 0.8); const pa = E.partidos[J.partido]; if (pa) pa.popularidad = Math.min(60, pa.popularidad + 0.08);
              const prob = U.clamp(0.1 + 0.28 * (1 - q.firmas[f.id].rep / 100) + (J.rep.transparencia < 40 ? 0.05 : 0), 0.06, 0.4);
              if (U.chance(prob)) En.desenmascarar(E, e, f);
            }
          } else { e.publicada = false; q.privadas.unshift(e); if (q.privadas.length > 12) q.privadas.pop(); }
          return { ok: true, msg: `Encuesta de ${f.nombre} (${U.cop(costo)}): ${pub ? 'publicada' : 'guardada, sólo para ti'}${modo === 'favor' ? ' — cocinada a tu favor' : ''}` };
        } });
    },
    desenmascarar(E, e, f) {
      const J = E.jugador; e.expuesta = true; e.publicada = true;
      E.encuestas.firmas[f.id].rep = Math.max(10, E.encuestas.firmas[f.id].rep - 12);
      J.credibilidad = U.clamp(J.credibilidad - U.rf(5, 9), 0, 100); J.rep.honestidad = U.clamp(J.rep.honestidad - 5, 0, 100);
      E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.5;
      J.escandalos.push({ t: E.fecha.t, titulo: 'Encuesta cocinada', respuesta: null });
      C.Medios.noticia(E, { tipo: 'encuesta', titular: `Denuncian que ${J.nombre} pagó una encuesta «cocinada» a ${f.nombre} para inflar su favorabilidad`, tono: -1, importante: true, jugador: true });
    }
  };

  C.Encuestas = En;
  C.Tiempo.registrar('encuestas', En, 22);
  C.Bus.on('eleccion', res => { const E = C.E; if (E && E.encuestas) En.evaluarFirmas(E, res); });
  En.registrarAcciones();
})(window.CURUL);
