/* Periódico de la semana: cada medio arma su portada con lo que pasa en el planeta y en el país, y la enmarca
   según su línea editorial frente al gobierno de turno (aplaude, critica o informa sin adjetivos). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const P = {
    asegurar(E) { if (!E.periodico) E.periodico = { snap: null, t: -99 }; return E.periodico; },
    init(E) { E.periodico = null; P.asegurar(E); },
    migrar(E) { P.asegurar(E); },
    turno(E) {
      const s = P.asegurar(E);
      if (!s.snap || E.fecha.t - s.t >= 4) { const e = E.economia; s.snap = { crec: e.crecimiento, inf: e.inflacion, des: e.desempleo, apro: E.opinion.aprobacionPres, def: e.deficit }; s.t = E.fecha.t; }
    },
    /* Cómo ve el medio al gobierno: −1 hostil … +1 afín */
    afinidad(E, m) {
      const pres = E.politicos[E.gobierno.presidente], eco = pres ? pres.eco : 0;
      return U.clamp(1 - Math.abs(m.linea - eco) / 55, -1, 1);
    },
    historias(E, m) {
      const e = E.economia, s = P.asegurar(E).snap || { crec: e.crecimiento, inf: e.inflacion, des: e.desempleo, apro: E.opinion.aprobacionPres, def: e.deficit }, af = P.afinidad(E, m), out = [];
      const gob = E.politicos[E.gobierno.presidente], nom = gob ? gob.nombre : 'El Gobierno';
      const tono = base => U.clamp(base + af * 0.6, -1, 1);
      const pick = (bueno, malo, neutro, x) => af > 0.35 ? (x >= 0 ? bueno : neutro) : af < -0.2 ? (x >= 0 ? neutro : malo) : (x >= 0 ? bueno : malo);
      if (E.militar && E.militar.guerra) out.push({ k: 'guerra', peso: 100, tipo: 'Seguridad', tono: -1, txt: `Guerra con ${C.Militar.nombre(E.militar.guerra.pais)}: semana ${E.militar.guerra.semanas} del conflicto`, sub: pick(`El comando de ${nom} conduce la campaña con firmeza`, `Crece la cuenta de bajas y la incertidumbre sobre el rumbo del conflicto`, `Las Fuerzas Militares mantienen operaciones en el frente`, E.militar.guerra.avance) });
      const mv = E.mundoVivo;
      if (mv) {
        for (const c of mv.conflictos) if (c.estado === 'guerra') out.push({ k: 'mundoGuerra', peso: 55, tipo: 'Mundo', tono: -1, txt: `Sigue la guerra: ${c.n}`, sub: `La tensión se mantiene en ${Math.round(c.t)} sobre 100` });
        for (const h of mv.historial.slice(0, 8)) if (E.fecha.t - h.t <= 2) out.push({ k: 'mundo', peso: /Golpe|guerra civil/i.test(h.txt) ? 72 : /sanciona|Elecciones/i.test(h.txt) ? 36 : 44, tipo: 'Mundo', tono: /Golpe|guerra/i.test(h.txt) ? -1 : 0, txt: h.txt });
        if (mv.presion) { const k = Object.entries(mv.presion).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]; if (Math.abs(k[1]) > 8) out.push({ k: 'presion', peso: 42, tipo: 'Mundo', tono: 0, txt: `Aumenta la presión del eje ${C.MundoVivo.EJES[k[0]].toLowerCase()} sobre Colombia`, sub: 'Analistas ven una política exterior bajo tensión' }); }
      }
      const dc = e.crecimiento - s.crec;
      out.push({ k: 'eco', peso: 40 + Math.abs(e.crecimiento - 2.5) * 6, tipo: 'Economía', tono: tono(dc >= 0 ? 0.2 : -0.2), txt: pick(`La economía crece ${U.d1(e.crecimiento)}%: ${nom} exhibe resultados`, `La economía se frena: crece apenas ${U.d1(e.crecimiento)}% y crecen las dudas`, `El PIB avanza ${U.d1(e.crecimiento)}% en el último dato`, e.crecimiento - 2.5), sub: `Desempleo ${U.d1(e.desempleo)}% · inflación ${U.d1(e.inflacion)}% · déficit ${U.d1(e.deficit)}% del PIB` });
      if (e.inflacion > 6) out.push({ k: 'inf', peso: 48 + (e.inflacion - 6) * 4, tipo: 'Economía', tono: -1, txt: pick(`La inflación cede`, `La inflación de ${U.d1(e.inflacion)}% golpea el bolsillo de los colombianos`, `Inflación de ${U.d1(e.inflacion)}%: el Banco de la República mantiene la tasa`, s.inf - e.inflacion), sub: 'Los precios de los alimentos lideran las alzas' });
      const ap = E.opinion.aprobacionPres, dap = ap - s.apro;
      out.push({ k: 'apro', peso: 38 + Math.abs(ap - 45) * 0.7, tipo: 'Política', tono: tono(dap >= 0 ? 0.2 : -0.2), txt: pick(`Repunta la aprobación de ${nom}: ${Math.round(ap)}%`, `Cae la aprobación de ${nom}: ${Math.round(ap)}%`, `La aprobación presidencial está en ${Math.round(ap)}%`, dap), sub: dap >= 0 ? 'Los analistas atribuyen la mejora a la agenda del gobierno' : 'La oposición pide corregir el rumbo' });
      for (const n of E.medios.noticias.slice(0, 40)) if (E.fecha.t - n.t <= 2) out.push({ k: 'nota', peso: (n.importante ? 46 : 26) + (n.jugador ? 6 : 0), tipo: n.tipo === 'escandalo' ? 'Escándalo' : n.tipo === 'diplomacia' ? 'Diplomacia' : n.tipo === 'seguridad' ? 'Seguridad' : 'País', tono: n.tono, txt: n.titular });
      if (C.Clima && C.Clima.historias) for (const h of C.Clima.historias(E)) out.push(h);
      // dedupe por texto y ordena por peso (con leve sesgo del medio)
      const vistos = new Set();
      return out.filter(x => !vistos.has(x.txt) && vistos.add(x.txt)).sort((a, b) => b.peso - a.peso);
    },
    edicion(E, medioId) {
      const m = E.medios.lista.find(x => x.id === medioId) || E.medios.lista[0], h = P.historias(E, m), af = P.afinidad(E, m);
      const pres = E.politicos[E.gobierno.presidente];
      const editorial = af > 0.35 ? `Un gobierno que, con sus tropiezos, marca un rumbo: ${m.nombre} le concede el beneficio de la duda.` : af < -0.2 ? `El rumbo del gobierno de ${pres ? pres.nombre : 'turno'} exige rectificaciones que la coyuntura ya no admite aplazar.` : 'Un país entre la prudencia y la urgencia: lo que decida esta semana marcará el ánimo del próximo trimestre.';
      const mundo = h.filter(x => x.tipo === 'Mundo' || x.tipo === 'Diplomacia').slice(0, 5), pais = h.filter(x => x !== h[0] && x.tipo !== 'Mundo' && x.tipo !== 'Diplomacia').slice(0, 6);
      return { medio: m, portada: h[0], mundo, pais, editorial, afin: af, t: E.fecha.t };
    }
  };
  C.Periodico = P;
  C.Tiempo.registrar('periodico', P, 91);
})(window.CURUL);
