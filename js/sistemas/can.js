/* Comunidad Andina (Fase 43), como lo que es: un bloque de integración (Acuerdo de Cartagena, 1969) con Presidencia Pro Tempore anual,
   Consejo Presidencial y de Cancilleres, Comisión que aprueba Decisiones por mayoría, Secretaría General (Lima), Tribunal de Justicia
   (Quito) que juzga los incumplimientos, zona de libre comercio, arancel externo común, pasaporte andino y la CAF como banco de desarrollo.
   Miembros según la época: Bolivia, Colombia, Ecuador, Perú; Chile (hasta 1976) y Venezuela (1973-2006). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, D = () => C.DATA.multi, MV = () => C.MundoVivo, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: tono || 0, importante: !!imp, jugador: esPres(E) }); };
  const nom = id => id === 'COL' ? 'Colombia' : (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const N = {
    clave: 'can',
    activa: () => U.anio() >= 1969,
    miembrosEn(y) { const l = ['BOL', 'COL', 'ECU', 'PER']; if (y < 1976) l.push('CHL'); if (y >= 1973 && y < 2006) l.push('VEN'); return l.sort((a, b) => nom(a).localeCompare(nom(b))); },
    enCAN(E) { const o = E.diplomacia && E.diplomacia.organismos.can; return N.activa() && !!(o && o.miembro); },
    socios(E) { return N.enCAN(E) ? N.miembrosEn(U.anio()).filter(x => x !== 'COL') : []; },
    pptDe(y) { const m = N.miembrosEn(y); return m[((y - 1970) % m.length + m.length) % m.length]; },
    asegurar(E) {
      if (E.can && E.can.dec) return E.can;
      const y = U.anio(), dec = {};
      for (const d of D().CAN_DEC) dec[d.id] = { estado: d.y && d.y <= y ? 'vigente' : 'disponible', t: 0, por: null };
      E.can = { ppt: { pais: N.pptDe(y), anio: y }, integ: 55, dec, controv: [], caf: { ult: -999 }, cumbre: { ult: -999 }, hist: [], prox: E.fecha.t + U.ri(10, 30) };
      return E.can;
    },
    init(E) { E.can = null; }, migrar(E) { N.asegurar(E); },
    anotar(E, txt) { const c = N.asegurar(E); c.hist.unshift({ t: E.fecha.t, txt }); if (c.hist.length > 25) c.hist.length = 25; },
    disponibles(E) { const y = U.anio(); return D().CAN_DEC.filter(d => N.asegurar(E).dec[d.id].estado === 'disponible' && (d.y !== null || y >= 1995)); },
    /* Voto de cada socio sobre una decisión: afinidad ideológica con el proponente y relación con Colombia */
    votoSocio(E, d, id, prop) {
      const a = MV().pais(E, id), b = MV().pais(E, prop); const dist = a && b ? U.distIdeo(a, b) : 0.4;
      return 0.62 - dist * 0.7 + ((E.diplomacia.paises[id] || { relacion: 50 }).relacion - 50) * 0.003 + (C.Corte.hash(d.id + id) - 0.5) * 0.5 + (d.area === 'comercio' && a && a.regimen === 'autoritario' ? -0.12 : 0);
    },
    tally(E, d, prop, votoCol) {
      const m = N.miembrosEn(U.anio()); let f = 0;
      for (const id of m) { if (id === 'COL') { if (votoCol === 1 || (votoCol == null && prop === 'COL')) f++; else if (votoCol === 0 && U.chance(0.5)) f++; continue; } if (id === prop) { f++; continue; } if (N.votoSocio(E, d, id, prop) > 0.5) f++; }
      return { f, n: m.length, ok: f > m.length / 2 };
    },
    aprobar(E, d, por) {
      const c = N.asegurar(E), s = c.dec[d.id]; s.estado = 'vigente'; s.t = E.fecha.t; s.por = por; c.integ = cl(c.integ + d.integ, 0, 100);
      if (d.ef) d.ef(E); noti(E, `La Comunidad Andina aprueba la decisión «${d.n}»`, 1, por === 'COL'); N.anotar(E, `Se aprueba la decisión «${d.n}»`);
    },
    votoJ(E, did, v) {
      const d = D().CAN_DEC.find(x => x.id === did), c = N.asegurar(E); if (!d || c.dec[did].estado !== 'propuesta') return 'La votación ya pasó';
      const prop = c.dec[did].por, t = N.tally(E, d, prop, v);
      if (v === 0 && t.ok) for (const id of N.socios(E)) { const st = E.diplomacia.paises[id]; if (st) st.relacion = cl(st.relacion + 1, 3, 97); }
      if (t.ok) N.aprobar(E, d, prop); else { c.dec[did].estado = 'disponible'; noti(E, `La Comunidad Andina no logra la mayoría para «${d.n}»`, 0); }
      if (v === -1 && prop !== 'COL') { const st = E.diplomacia.paises[prop]; if (st) st.relacion = cl(st.relacion - 3, 3, 97); }
      return C.Pais.ef(E, { rec: 0.3 });
    },
    nuevaControversia(E, quien, pais, obj, soyDemandante) {
      const c = N.asegurar(E), k = { id: U.id('can'), pais, obj: obj.n, area: obj.area, quien, fase: 'secretaria', dur: 12, t0: E.fecha.t, soyDemandante: !!soyDemandante, resultado: null };
      c.controv.unshift(k); if (c.controv.length > 10) c.controv.length = 10;
      C.Economia.aplicarDelta(E, 'exportaciones', -0.06); return k;
    },
    respuesta(E, kid, via) {
      const c = N.asegurar(E), k = c.controv.find(x => x.id === kid); if (!k) return 'El caso ya se resolvió';
      const st = E.diplomacia.paises[k.pais];
      if (via === 'negociar') { k.fase = 'secretaria'; k.dur = 8; k.neg = true; if (st) st.relacion = cl(st.relacion + 2, 3, 97); return C.Pais.ef(E, { rec: 0.5 }); }
      if (via === 'demandar') { k.fase = 'tribunal'; k.dur = U.ri(30, 50); k.soyDemandante = true; return C.Pais.ef(E, { rec: 0.8 }); }
      if (via === 'retaliar') { if (st) st.relacion = cl(st.relacion - 6, 3, 97); c.integ = cl(c.integ - 3, 0, 100); k.retal = true; C.Economia.aplicarDelta(E, 'exportaciones', -0.05); k.dur = 12; return C.Pais.ef(E, { rec: 1.2, seg: { medios: 0 } }); }
      if (via === 'acatar') { k.fase = 'cerrado'; k.resultado = 'Colombia revoca la medida'; c.integ = cl(c.integ + 2, 0, 100); if (st) st.relacion = cl(st.relacion + 3, 3, 97); return C.Pais.ef(E, { rec: 0.3, honestidad: 1 }); }
      k.fase = 'tribunal'; k.dur = U.ri(30, 50); return C.Pais.ef(E, { rec: 0.6 });
    },
    turno(E) {
      const c = N.asegurar(E), t = E.fecha.t, y = U.anio(); if (!N.activa()) return;
      if (c.ppt.anio !== y) { c.ppt = { pais: N.pptDe(y), anio: y }; if (N.enCAN(E)) noti(E, `${nom(c.ppt.pais)} asume la Presidencia Pro Tempore de la Comunidad Andina`, 0); }
      if (!N.enCAN(E)) return;
      if (y === 2006 && E.diplomacia.paises.VEN && !c.vzla) { c.vzla = true; noti(E, 'Venezuela anuncia su salida de la Comunidad Andina', -1, true); N.anotar(E, 'Venezuela se retira de la CAN'); }
      c.integ = cl(c.integ + ((35 + N.indiceInst(E) * 0.5) - c.integ) * 0.004 - c.controv.filter(k => k.fase !== 'cerrado').length * 0.02, 0, 100);
      C.Economia.aplicarDelta(E, 'exportaciones', (c.integ - 55) * 0.0002);
      // propuestas de decisiones
      if (t >= c.prox) {
        c.prox = t + U.ri(20, 45); const l = N.disponibles(E), socios = N.socios(E);
        if (l.length && socios.length) {
          const d = U.pick(l), prop = U.pick(socios.concat(['COL', 'COL']));
          if (prop === 'COL' && esPres(E)) {} else if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) { c.dec[d.id].estado = 'propuesta'; c.dec[d.id].por = prop; C.Eventos.disparar(E, C.Eventos.plantilla('ml_can_decision'), { forzar: true, vars: { dec: d.n, did: d.id, pais: nom(prop) } }); }
          else { const tt = N.tally(E, d, prop, U.chance(0.6) ? 1 : -1); if (tt.ok) N.aprobar(E, d, prop); }
        }
      }
      // conflictos comerciales
      const socios = N.socios(E);
      if (socios.length && U.chance(0.01)) {
        const pais = U.pick(socios), obj = U.pick(D().CAN_CONFLICTOS), k = N.nuevaControversia(E, 'ellos', pais, obj, false);
        noti(E, `${nom(pais)} aplica ${obj.n}: la Comunidad Andina abre un proceso`, -1);
        if (esPres(E) && !E.meta.presim && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('ml_can_conflicto'), { forzar: true, vars: { pais: nom(pais), obj: obj.n, kid: k.id } });
      }
      if (socios.length && esPres(E) && U.chance(0.004) && !E.meta.presim && !E.eventos.pendientes.length) { const pais = U.pick(socios), obj = U.pick(D().CAN_CONFLICTOS), k = N.nuevaControversia(E, 'nosotros', pais, obj, false); k.fase = 'tribunal'; k.dur = 40; C.Eventos.disparar(E, C.Eventos.plantilla('ml_can_demanda'), { forzar: true, vars: { pais: nom(pais), obj: 'una medida colombiana contraria a la normativa andina', kid: k.id } }); }
      for (const k of c.controv) {
        if (k.fase === 'cerrado') continue;
        k.dur--; if (k.dur > 0) continue;
        if (k.fase === 'secretaria') { if (k.neg || U.chance(0.45)) { k.fase = 'cerrado'; k.resultado = 'Se resuelve por la vía diplomática'; noti(E, `CAN: se resuelve el conflicto con ${nom(k.pais)}`, 1); c.integ = cl(c.integ + 1, 0, 100); } else { k.fase = 'tribunal'; k.dur = U.ri(30, 50); } }
        else if (k.fase === 'tribunal') {
          const gano = U.chance(k.quien === 'ellos' ? (k.soyDemandante ? 0.62 : 0.5) : 0.4);
          k.fase = 'cerrado'; k.resultado = gano ? 'El Tribunal Andino da la razón a Colombia' : 'El Tribunal Andino da la razón a ' + nom(k.pais);
          noti(E, `Tribunal Andino: ${k.resultado}`, gano ? 1 : -1, true); c.integ = cl(c.integ + 1, 0, 100);
          if (gano) { C.Economia.aplicarDelta(E, 'exportaciones', 0.06); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + (esPres(E) ? 0.4 : 0), 3, 95); } else if (esPres(E)) { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.3, 3, 95); }
        }
      }
    },
    /* ── Reforma institucional andina: ejes con niveles, como en el Mercosur, pero con otra herencia: la CAN nació con una Secretaría General,
       un Tribunal y Decisiones de efecto directo (sin ratificación de los parlamentos), aunque cada socio las cumple a su manera. ── */
    EJES: {
      decisiones: { n: 'Regla de decisión', icono: '🗳', niveles: ['Consenso: cualquiera veta', 'Mayoría absoluta de la Comisión (vigente)', 'Mayoría calificada con obligatoriedad inmediata'], txt: 'Cómo se aprueban las Decisiones en el Consejo y la Comisión.' },
      secretaria: { n: 'Secretaría General', icono: '🏛', niveles: ['Apoyo técnico', 'Órgano ejecutivo con iniciativa (vigente)', 'Comisión supranacional con poder sancionador'], txt: 'El equivalente del directorio ejecutivo: propone, vigila y dictamina incumplimientos.' },
      parlamento: { n: 'Parlamento Andino', icono: '🏟', niveles: ['Sin parlamento', 'Foro deliberante (vigente)', 'Elección directa con control político', 'Parlamento colegislador'], txt: 'Da legitimidad democrática al bloque.' },
      tribunal: { n: 'Tribunal de Justicia (Quito)', icono: '⚖', niveles: ['Arbitraje ad hoc', 'Jurisdicción y efecto directo (vigente)', 'Sanciones automáticas y acceso de particulares'], txt: 'Juzga incumplimientos y fija la interpretación obligatoria de la norma andina.' },
      aduanera: { n: 'Unión aduanera (AEC)', icono: '🛃', niveles: ['Zona de libre comercio', 'Arancel externo común con excepciones (vigente)', 'Unión aduanera plena'], txt: 'Un mismo arancel frente al resto del mundo; Bolivia y Ecuador han tenido trato especial.' },
      mercado: { n: 'Mercado común', icono: '🏬', niveles: ['Sólo bienes', 'Bienes y servicios (vigente)', 'Servicios, capitales y compras públicas'], txt: 'Más allá de los bienes: servicios, inversión y contratación pública.' },
      circulacion: { n: 'Circulación de personas', icono: '🛂', niveles: ['Visas y permisos', 'Pasaporte andino y tránsito sin visa (vigente)', 'Libre residencia, trabajo y seguridad social'], txt: 'Ciudadanía andina.' },
      exterior: { n: 'Política comercial exterior', icono: '🌐', niveles: ['Cada país negocia por su cuenta', 'Coordinación de posiciones', 'Negociación conjunta con terceros'], txt: 'Hoy cada socio firma sus TLC; la CAN apenas coordina.' },
      fondos: { n: 'Fondos y banca de desarrollo', icono: '🏦', niveles: ['Sin fondos comunes', 'CAF y Fondo de Reservas (vigente)', 'Fondo de cohesión andino'], txt: 'La CAF financia infraestructura; un fondo de cohesión sería nuevo.' }
    },
    MODELOS: {
      aduana: { n: 'Hacia una unión aduanera plena', icono: '🛃', niv: { aduanera: 2, mercado: 2, exterior: 1 }, txt: 'Un solo arancel y servicios abiertos: más comercio, menos soberanía comercial.' },
      mercosur: { n: 'Parecerse al Mercosur (intergubernamental)', icono: '🤝', niv: { decisiones: 0, secretaria: 0, tribunal: 0, parlamento: 1 }, txt: 'Más consenso y menos poder supranacional: lo contrario a la herencia andina.' },
      ue: { n: 'Mini Unión Europea andina', icono: '🇪🇺', niv: { decisiones: 2, secretaria: 2, tribunal: 2, parlamento: 2 }, txt: 'Instituciones fuertes y parlamento electo: difícil de aceptar para los socios soberanistas.' },
      flexible: { n: 'CAN flexible (libre comercio y poco más)', icono: '📄', niv: { aduanera: 0, mercado: 0, circulacion: 0, exterior: 0, fondos: 0 }, txt: 'Zona de libre comercio sin arancel común: cada uno por su lado.' }
    },
    INTERES: { BOL: { decisiones: -0.3, secretaria: -0.2, tribunal: -0.3, aduanera: 0.2, mercado: -0.3, circulacion: 0.3, exterior: 0.1, fondos: 0.4, parlamento: 0.1 }, ECU: { decisiones: -0.1, secretaria: 0, tribunal: -0.1, aduanera: 0.2, mercado: -0.1, circulacion: 0.3, exterior: 0, fondos: 0.3, parlamento: 0.2 }, PER: { decisiones: 0.1, secretaria: 0.1, tribunal: 0.2, aduanera: -0.4, mercado: 0.4, circulacion: 0.1, exterior: -0.5, fondos: 0, parlamento: 0.1 }, VEN: { decisiones: -0.3, secretaria: -0.3, tribunal: -0.3, aduanera: -0.2, mercado: -0.4, circulacion: 0.2, exterior: -0.2, fondos: 0.2, parlamento: 0.1 }, CHL: { decisiones: 0, secretaria: 0, tribunal: 0, aduanera: -0.5, mercado: 0.4, circulacion: 0, exterior: -0.5, fondos: 0, parlamento: 0 } },
    nivelesIniciales(y) { const n = { decisiones: 1, secretaria: 1, parlamento: y >= 1979 ? 1 : 0, tribunal: y >= 1983 ? 1 : 0, aduanera: y >= 1995 ? 1 : 0, mercado: y >= 1998 ? 1 : 0, circulacion: y >= 2001 ? 1 : 0, exterior: 0, fondos: y >= 1970 ? 1 : 0 }; if (y < 1987) n.secretaria = 1; return n; },
    inst(E) { const c = N.asegurar(E); if (!c.inst) c.inst = { niv: N.nivelesIniciales(U.anio()), hist: [], ult: -999, conv: -999 }; return c.inst; },
    indiceInst(E) { const i = N.inst(E), ks = Object.keys(N.EJES); return Math.round(U.suma(ks.map(k => i.niv[k] / (N.EJES[k].niveles.length - 1))) / ks.length * 100); },
    probVotoReforma(E, id, cambios) {
      let a = 0; for (const x of cambios) a += ((N.INTERES[id] || {})[x.eje] || 0) * (x.nivel > N.inst(E).niv[x.eje] ? 1 : -1);
      return cl(0.5 + a / cambios.length * 0.7 + ((E.diplomacia.paises[id] || { relacion: 50 }).relacion - 50) * 0.003, 0.05, 0.95);
    },
    reformar(E, cambios, etiqueta) {
      const i = N.inst(E), socios = N.socios(E), m = N.miembrosEn(U.anio());
      const sube = cambios.some(c => c.nivel > i.niv[c.eje] && (c.eje === 'decisiones' || c.eje === 'secretaria' || c.eje === 'tribunal' || c.eje === 'aduanera'));
      let f = 1; const votos = socios.map(id => { const si = C.Corte.hash(etiqueta + id + i.ult) < N.probVotoReforma(E, id, cambios); if (si) f++; return { id, si }; });
      const exig = sube ? Math.ceil(m.length * 0.75) : Math.floor(m.length / 2) + 1;
      i.ult = E.fecha.t;
      if (f >= exig) { for (const c of cambios) i.niv[c.eje] = c.nivel; N.asegurar(E).integ = cl(N.asegurar(E).integ + 3, 0, 100); N.anotar(E, `Reforma andina aprobada: ${etiqueta}`); noti(E, `La Comunidad Andina aprueba una reforma: ${etiqueta} (entra en vigor de inmediato, sin ratificaciones)`, 1, true); return { ok: true, f, n: m.length, exig, votos }; }
      for (const v of votos) if (!v.si) { const st = E.diplomacia.paises[v.id]; if (st) st.relacion = cl(st.relacion - 1.5, 3, 97); }
      noti(E, `Se cae la reforma andina «${etiqueta}»: sólo ${f} de ${m.length} países la apoyan`, -1); return { ok: false, f, n: m.length, exig, votos };
    },
    registrarAcciones2() {
      const A = C.Acciones, pres = E => esPres(E) ? (N.enCAN(E) ? true : 'Colombia no está en la Comunidad Andina') : 'Sólo el Presidente';
      A.registrar({ id: 'reformarCAN', nombre: 'Proponer una reforma institucional andina', icono: '🏔', grupo: 'comercio', costo: 3,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; const e = N.EJES[a.eje]; if (!e) return 'Elige el eje'; const n = +a.nivel; if (!(n >= 0 && n < e.niveles.length)) return 'Elige el nivel'; if (n === N.inst(E).niv[a.eje]) return 'Ya está en ese nivel'; return E.fecha.t - N.inst(E).ult < 13 ? 'Los socios necesitan unas semanas entre propuestas' : true; },
        ejecutar(E, a) { const r = N.reformar(E, [{ eje: a.eje, nivel: +a.nivel }], `${N.EJES[a.eje].n}: ${N.EJES[a.eje].niveles[+a.nivel]}`); return { ok: true, exito: r.ok, msg: r.ok ? `Aprobada por ${r.f} de ${r.n} países: la reforma entra en vigor` : `Sólo ${r.f} de ${r.n} apoyan (se necesitaban ${r.exig}): la reforma se cae` }; } });
      A.registrar({ id: 'paqueteCAN', nombre: 'Proponer un modelo de integración andina', icono: '🧩', grupo: 'comercio', costo: 3,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; return N.MODELOS[a.modelo] ? (E.fecha.t - N.inst(E).ult < 13 ? 'Los socios necesitan unas semanas entre propuestas' : true) : 'Elige el modelo'; },
        ejecutar(E, a) { const M = N.MODELOS[a.modelo], cambios = Object.entries(M.niv).map(([eje, nivel]) => ({ eje, nivel })).filter(c => c.nivel !== N.inst(E).niv[c.eje]); if (!cambios.length) return { ok: false, msg: 'La CAN ya funciona así' }; const r = N.reformar(E, cambios, M.n); return { ok: true, exito: r.ok, msg: r.ok ? `${M.n}: aprobado (${r.f} de ${r.n})` : `${M.n}: no alcanza (${r.f} de ${r.n}, se necesitaban ${r.exig})` }; } });
      A.registrar({ id: 'convergenciaMercosur', nombre: 'Impulsar la convergencia CAN-Mercosur', icono: '🌉', grupo: 'comercio', costo: 3,
        disponible(E) { const p = pres(E); if (p !== true) return p; if (!C.Mercosur || !C.Mercosur.st(E).existe) return 'El Mercosur todavía no existe'; return E.fecha.t - N.inst(E).conv < 104 ? 'Ya se impulsó hace poco' : true; },
        ejecutar(E) { N.inst(E).conv = E.fecha.t; N.asegurar(E).integ = cl(N.asegurar(E).integ + 4, 0, 100); C.Economia.aplicarDelta(E, 'exportaciones', 0.25); for (const id of ['BRA', 'ARG', 'URY', 'PRY']) { const st = E.diplomacia.paises[id]; if (st) st.relacion = cl(st.relacion + 3, 3, 97); } N.anotar(E, 'Acuerdo de convergencia entre la CAN y el Mercosur'); noti(E, 'La CAN y el Mercosur avanzan en un acuerdo de libre comercio y convergencia', 1, true); C.Opinion.subirRec(E, 1.5); return { ok: true, msg: 'Impulsas la convergencia entre los dos bloques: libre comercio ampliado y mejores relaciones con el Cono Sur' }; } });
    },
    registrarAcciones() {
      const A = C.Acciones, pres = E => esPres(E) ? (N.enCAN(E) ? true : 'Colombia no está en la Comunidad Andina') : 'Sólo el Presidente';
      A.registrar({ id: 'proponerDecisionCAN', nombre: 'Proponer una Decisión andina', icono: '🏔', grupo: 'diplomacia', costo: 2,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; const d = D().CAN_DEC.find(x => x.id === a.dec); if (!d) return 'Elige la decisión'; return N.asegurar(E).dec[d.id].estado === 'disponible' && N.disponibles(E).includes(d) ? true : 'Esa decisión no está disponible'; },
        ejecutar(E, a) { const d = D().CAN_DEC.find(x => x.id === a.dec), t = N.tally(E, d, 'COL', 1); if (t.ok) { N.aprobar(E, d, 'COL'); C.Opinion.subirRec(E, 1.5); return { ok: true, msg: `Aprobada por ${t.f} de ${t.n} países: «${d.n}» queda vigente` }; } return { ok: true, exito: false, msg: `Sólo ${t.f} de ${t.n} países la apoyan: no alcanza la mayoría` }; } });
      A.registrar({ id: 'cabildearCAN', nombre: 'Cabildear con un socio andino', icono: '🤝', grupo: 'diplomacia', costo: 1,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; return N.socios(E).includes(a.pais) ? true : 'Elige un socio andino'; },
        ejecutar(E, a) { const st = E.diplomacia.paises[a.pais]; st.relacion = cl(st.relacion + 3, 3, 97); return { ok: true, msg: `Tu visita mejora la relación con ${nom(a.pais)}` }; } });
      A.registrar({ id: 'convocarCumbreAndina', nombre: 'Convocar el Consejo Presidencial Andino', icono: '🏔', grupo: 'diplomacia', costo: 3,
        disponible(E) { const p = pres(E); if (p !== true) return p; const c = N.asegurar(E); if (c.ppt.pais !== 'COL') return `La Presidencia Pro Tempore la ejerce ${nom(c.ppt.pais)}`; return E.fecha.t - c.cumbre.ult < 52 ? 'Ya hubo cumbre este año' : true; },
        ejecutar(E, a) { const c = N.asegurar(E); c.cumbre.ult = E.fecha.t; c.integ = cl(c.integ + 5, 0, 100); for (const id of N.socios(E)) { const st = E.diplomacia.paises[id]; if (st) st.relacion = cl(st.relacion + 4, 3, 97); }
          const tema = a.tema || 'comercio'; if (tema === 'comercio') C.Economia.aplicarDelta(E, 'exportaciones', 0.12); if (tema === 'seguridad') for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad + 0.2, 1, 99); if (tema === 'migracion') E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 0.4, 3, 95); if (tema === 'energia') C.Economia.aplicarDelta(E, 'inflacion', -0.05);
          C.Opinion.subirRec(E, 2); noti(E, `Cumbre andina en Colombia: los presidentes de la CAN acuerdan avanzar en ${tema}`, 1, true); N.anotar(E, `Cumbre presidencial en Colombia (${tema})`); return { ok: true, msg: 'La cumbre es un éxito: la integración andina se fortalece' }; } });
      A.registrar({ id: 'demandarIncumplimiento', nombre: 'Demandar a un socio ante el Tribunal Andino', icono: '⚖', grupo: 'diplomacia', costo: 2,
        disponible(E, a) { const p = pres(E); if (p !== true) return p; return N.socios(E).includes(a.pais) ? true : 'Elige un socio andino'; },
        ejecutar(E, a) { const k = N.nuevaControversia(E, 'ellos', a.pais, U.pick(D().CAN_CONFLICTOS), true); k.fase = 'tribunal'; k.dur = U.ri(30, 50); const st = E.diplomacia.paises[a.pais]; st.relacion = cl(st.relacion - 3, 3, 97); return { ok: true, msg: `Demandas a ${nom(a.pais)} ante el Tribunal Andino por incumplir la normativa comunitaria` }; } });
      A.registrar({ id: 'solicitarCAF', nombre: 'Solicitar un crédito a la CAF', icono: '🏦', grupo: 'diplomacia', costo: 1,
        disponible(E) { const p = pres(E); if (p !== true) return p; return E.fecha.t - N.asegurar(E).caf.ult < 26 ? 'La CAF acaba de desembolsar un crédito' : (U.anio() < 1970 ? 'La CAF aún no existe' : true); },
        ejecutar(E, a) { const c = N.asegurar(E); c.caf.ult = E.fecha.t; const t = a.tipo || 'infra';
          if (t === 'infra') C.Economia.aplicarDelta(E, 'crecimiento', 0.15); if (t === 'social') C.Economia.aplicarDelta(E, 'pobreza', -0.15); if (t === 'ambiente') E.economia.confianza = cl(E.economia.confianza + 0.4, 5, 95);
          C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.1), p: 'm' }], 'caf'); return { ok: true, msg: `La CAF aprueba un crédito para ${D().CAF[t].toLowerCase()}` }; } });
    }
  };
  C.CAN = N; C.Tiempo.registrar('can', N, 74); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('CAN'); N.registrarAcciones(); N.registrarAcciones2();
})(window.CURUL);
