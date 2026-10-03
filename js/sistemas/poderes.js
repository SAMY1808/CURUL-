/* Poderes y prensa (Fase 40). (1) Poderes fácticos —Iglesia, cúpula militar, Embajada de EE. UU., barones de la prensa, banca,
   maquinarias regionales y ONG— con afinidad contigo, poder propio, demandas que te hacen, favores que se deben y
   retaliaciones cuando los desafías; reaccionan a las leyes que apruebas. (2) Prensa de investigación: periodistas que
   abren expedientes contra ti o contra tus rivales, con respuestas posibles (colaborar, adelantarte, comprar silencio,
   demandar). (3) Crisis internas de los partidos: facciones que se pelean, escisiones y fusiones. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const num = x => Number.isFinite(x) ? x : 0;

  /* ── Efectos genéricos para eventos y acciones de esta fase ── */
  C.Pais = {
    ef(E, o) {
      const J = E.jugador, out = [], f = (ic, v, suf) => out.push(`${ic} ${v > 0 ? '+' : ''}${v}${suf || ''}`);
      if (o.rec) { C.Opinion.subirRec(E, o.rec); f('📣', o.rec, ' reconocimiento'); }
      if (o.honestidad) { J.rep.honestidad = U.clamp(J.rep.honestidad + o.honestidad, 0, 100); f('⚖', o.honestidad, ' honestidad'); }
      if (o.cred) { J.rep.competencia = U.clamp((J.rep.competencia || 50) + o.cred, 0, 100); f('🧠', o.cred, ' competencia'); }
      if (o.patrimonio) { J.patrimonio += o.patrimonio; f('💰', o.patrimonio, ' M'); }
      if (o.aprob) { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + o.aprob, 3, 95); f('👍', o.aprob, ' aprobación del Gobierno'); }
      if (o.bienestar) { J.bienestar = U.clamp((J.bienestar || 60) + o.bienestar, 0, 100); f('💚', o.bienestar, ' bienestar'); }
      if (o.salud) { J.salud = U.clamp((J.salud || 85) + o.salud, 0, 100); f('🩺', o.salud, ' salud'); }
      if (o.animo && E.nacional) { E.nacional.animo = U.clamp(E.nacional.animo + o.animo, 0, 100); f('🇨🇴', o.animo, ' ánimo nacional'); }
      if (o.seg) { C.Opinion.moverImagen(E, { seg: o.seg }); out.push('🗳 imagen: ' + Object.entries(o.seg).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ')); }
      if (o.confianza) { E.economia.confianza = U.clamp(E.economia.confianza + o.confianza, 5, 95); f('📊', o.confianza, ' confianza económica'); }
      if (o.escandalo) { J.escandalos.push({ t: E.fecha.t, titulo: o.escandalo, respuesta: null }); J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + 3, 0, 100); out.push('📰 escándalo'); }
      if (o.partido && E.partidos[J.partido]) { E.partidos[J.partido].relJ = U.clamp((E.partidos[J.partido].relJ || 0) + o.partido, -100, 100); f('🎗', o.partido, ' relación con tu partido'); }
      if (o.cohesion && E.partidos[J.partido]) { const pa = E.partidos[J.partido]; pa.cohesion = U.clamp(pa.cohesion + o.cohesion, 0, 100); f('🧩', o.cohesion, ' cohesión del partido'); }
      for (const [id, v] of Object.entries(o.poder || {})) if (C.Poderes) { C.Poderes.mover(E, id, v); out.push(`${C.Poderes.def(id).icono} ${v > 0 ? '+' : ''}${v} ${C.Poderes.def(id).corto}`); }
      for (const [id, v] of Object.entries(o.favor || {})) if (C.Poderes) { C.Poderes.st(E, id).favor += v; out.push(`🤝 favor ${C.Poderes.def(id).corto} ${v > 0 ? '+' : ''}${v}`); }
      if (o.amigos && C.Vida) { C.Vida.todos(E).forEach(a => a.lealtad = U.clamp(a.lealtad + o.amigos, 0, 100)); f('🫂', o.amigos, ' amigos'); }
      return out.join(' · ');
    }
  };

  /* ═══════════ 1. Poderes fácticos ═══════════ */
  const DEF = [
    { id: 'iglesia', n: 'Conferencia Episcopal e Iglesias', corto: 'Iglesia', icono: '⛪', eco: 20, soc: 70, poder: 62, segs: { mayores: 1, rural: 1, basica: 1 }, nota: 'Mueve a los mayores, al campo y a los votantes de valores.' },
    { id: 'militares', n: 'Cúpula militar', corto: 'Militares', icono: '🎖', eco: 35, soc: 55, poder: 66, segs: { rural: 0.6, formales: 0.6 }, nota: 'Garantiza (o amenaza) el orden; pesa en seguridad.' },
    { id: 'usa', n: 'Embajada de Estados Unidos', corto: 'EE. UU.', icono: '🇺🇸', eco: 40, soc: 10, poder: 72, segs: { altos: 1, formales: 0.5 }, nota: 'Ayuda, certificación y presión sobre el rumbo del país.' },
    { id: 'prensa', n: 'Barones de la prensa', corto: 'Prensa', icono: '📰', eco: 25, soc: 0, poder: 70, segs: { medios: 1, universitarios: 1, altos: 0.6 }, nota: 'Dueños de los grandes medios: hacen y deshacen reputaciones.' },
    { id: 'banca', n: 'Grupo financiero y banca', corto: 'Banca', icono: '🏦', eco: 60, soc: 10, poder: 76, segs: { altos: 1, formales: 0.6 }, nota: 'Pone la plata: campañas, crédito y confianza.' },
    { id: 'maquinas', n: 'Maquinarias y caciques regionales', corto: 'Maquinarias', icono: '🧩', eco: 10, soc: 10, poder: 56, segs: { rural: 1, informales: 0.6, bajos: 0.5 }, nota: 'Los votos de las regiones se cuentan con ellos.' },
    { id: 'ong', n: 'ONG y cooperación internacional', corto: 'ONG', icono: '🌍', eco: -45, soc: -45, poder: 42, segs: { jovenes: 1, universitarios: 0.8, estudiantes: 0.8 }, nota: 'Derechos humanos, ambiente y paz: jóvenes y universitarios.' }
  ];
  const MAPA_LEY = { Gremios: 'banca', Industria: 'banca', Banca: 'banca', Hacienda: 'banca', Comercio: 'banca', Iglesias: 'iglesia', 'Fuerza Pública': 'militares', Defensa: 'militares', Cancillería: 'usa', Medios: 'prensa', Alcaldes: 'maquinas', Gobernadores: 'maquinas', Políticos: 'maquinas', Partidos: 'maquinas', 'Defensores de DDHH': 'ong', Ambientalistas: 'ong', Libertades: 'ong', Víctimas: 'ong', Mujeres: 'ong' };
  const Po = {
    DEF, clave: 'poderes',
    def: id => DEF.find(d => d.id === id),
    asegurar(E) {
      if (E.poderes && E.poderes.actores) return E.poderes;
      const J = E.jugador, actores = {};
      for (const d of DEF) actores[d.id] = { afin: Math.round(U.clamp(50 - U.distIdeo(J.ideologia, { eco: d.eco, soc: d.soc }) * 40 + U.gauss(0, 7), 8, 92)), poder: d.poder + U.ri(-6, 6), favor: 0, apoyo: null, exig: -99, sab: null, ult: -99 };
      E.poderes = { actores, hist: [], seg: 0 };
      return E.poderes;
    },
    init(E) { E.poderes = null; },   // se crea al primer uso: el jugador aún no existe al generar el mundo
    st: (E, id) => Po.asegurar(E).actores[id],
    mover(E, id, v) { const s = Po.st(E, id); s.afin = U.clamp(s.afin + v, 0, 100); },
    anotar(E, txt) { const p = Po.asegurar(E); p.hist.unshift({ t: E.fecha.t, txt }); if (p.hist.length > 14) p.hist.length = 14; },
    nivel: E => (C.DATA.cargos[E.jugador.cargo] || { nivel: 0 }).nivel,
    /* Retaliación por agravios: cada poder golpea a su manera */
    sabotaje(E, id) {
      const d = Po.def(id), s = Po.st(E, id), J = E.jugador; s.sab = E.fecha.t; Po.anotar(E, `${d.corto} te pasa la cuenta`);
      const m = { iglesia: () => { C.Pais.ef(E, { aprob: -1.2, seg: { mayores: -4, rural: -3 }, rec: -1 }); return 'La Iglesia te pasa la cuenta desde el púlpito'; },
        militares: () => { C.Pais.ef(E, { aprob: -1.5, confianza: -1, rec: -1 }); return 'Ruido de sables: la cúpula militar filtra su incomodidad'; },
        usa: () => { if (C.Territorio) { const c = C.Territorio.asegurar(E).cert; if (c.estado === 'certificado') c.estado = 'condiciones'; } C.Pais.ef(E, { confianza: -1.5 }); return 'Washington endurece su tono: pide «condiciones» y revisa la ayuda'; },
        prensa: () => { Pr.abrir(E, 'J', 2); return 'Los barones de la prensa ordenan «apretarte»: arrancan investigaciones'; },
        banca: () => { C.Pais.ef(E, { confianza: -2.5 }); E.economia.tasa = Math.min(16, E.economia.tasa + 0.2); return 'La banca cierra el crédito y los mercados se ponen nerviosos'; },
        maquinas: () => { C.Pais.ef(E, { seg: { rural: -4, informales: -3 }, partido: -3 }); return 'Los caciques regionales dejan de «mover la gente»'; },
        ong: () => { C.Pais.ef(E, { seg: { jovenes: -3, universitarios: -3 }, rec: -1 }); return 'Las ONG te señalan en informes internacionales'; } }[id];
      const txt = m(); C.Medios.noticia(E, { tipo: 'jugador', titular: txt, tono: -1, jugador: true, importante: true });
    },
    turno(E) {
      const P = Po.asegurar(E), J = E.jugador, t = E.fecha.t, nivel = Po.nivel(E);
      for (const d of DEF) {
        const s = P.actores[d.id];
        s.afin = U.clamp(s.afin + (50 - U.distIdeo(J.ideologia, { eco: d.eco, soc: d.soc }) * 40 - s.afin) * 0.004 + U.gauss(0, 0.25), 0, 100);
        s.poder = U.clamp(s.poder + (d.poder - s.poder) * 0.004 + U.gauss(0, 0.3) + (d.id === 'prensa' ? 0 : 0), 10, 98);
        if (s.apoyo && t >= s.apoyo) s.apoyo = null;
        if (s.sab && t - s.sab > 52) s.sab = null;
        // demanda de un poder a quien tiene mando
        if (nivel >= 3 && t - s.exig > 26 && !E.eventos.pendientes.length && U.chance(0.006 * (s.poder / 60) * (nivel >= 5 ? 1.8 : 1))) {
          const pl = C.DATA.eventos.filter(e => e.poder === d.id); if (pl.length) { s.exig = t; C.Eventos.disparar(E, U.pick(pl), { forzar: true }); }
        }
        // retaliación por agravio sostenido
        if (!s.sab && s.afin < 28 && s.poder > 55 && nivel >= 3 && U.chance(0.003 * (s.poder / 60))) Po.sabotaje(E, d.id);
      }
      // el apoyo y el rechazo de los poderes mueven tu imagen
      if (t % 13 === 0) for (const d of DEF) { const s = P.actores[d.id], k = (s.afin - 50) * 0.025 * (s.poder / 70) * (s.apoyo ? 2 : 1); if (Math.abs(k) > 0.25) { const seg = {}; for (const [sg, w] of Object.entries(d.segs)) seg[sg] = k * w; C.Opinion.moverImagen(E, { seg }); } }
    },
    registrarAcciones() {
      const A = C.Acciones;
      const ok = (E, a) => Po.def(a.actor) ? true : 'Elige un poder';
      A.registrar({ id: 'reunirsePoder', nombre: 'Reunirte con un poder', icono: '☕', grupo: 'poderes', costo: 1, disponible: ok,
        ejecutar(E, a) { const d = Po.def(a.actor), s = Po.st(E, a.actor); if (E.fecha.t - s.ult < 6) return { ok: false, msg: 'Acabas de reunirte con ellos' }; s.ult = E.fecha.t; s.afin = U.clamp(s.afin + U.rf(3, 7), 0, 100); C.Opinion.subirRec(E, 0.3); return { ok: true, msg: `Reunión con ${d.corto}: afinidad ${Math.round(s.afin)}` }; } });
      A.registrar({ id: 'pedirApoyoPoder', nombre: 'Pedir el respaldo de un poder', icono: '🙏', grupo: 'poderes', costo: 2,
        disponible(E, a) { const x = ok(E, a); if (x !== true) return x; const s = Po.st(E, a.actor); return s.apoyo ? 'Ya te respaldan' : s.afin >= 52 || s.favor > 0 ? true : 'No tienen suficiente afinidad contigo ni te deben favores'; },
        ejecutar(E, a) { const d = Po.def(a.actor), s = Po.st(E, a.actor), p = U.clamp(0.25 + s.afin / 180 + s.favor * 0.1, 0.15, 0.9); if (!U.chance(p)) { s.afin -= 2; return { ok: true, exito: false, msg: `${d.corto} se hace el de la vista gorda (${Math.round(p * 100)} % de probabilidad)` }; } s.apoyo = E.fecha.t + 52; s.favor -= s.favor > 0 ? 1 : 0; const seg = {}; for (const [k, w] of Object.entries(d.segs)) seg[k] = 4 * w; C.Opinion.moverImagen(E, { seg }); C.Opinion.subirRec(E, 2); return { ok: true, msg: `${d.n} te respalda abiertamente durante un año` }; } });
      A.registrar({ id: 'cobrarFavorPoder', nombre: 'Cobrar un favor', icono: '🧾', grupo: 'poderes', costo: 1,
        disponible(E, a) { const x = ok(E, a); if (x !== true) return x; return Po.st(E, a.actor).favor > 0 ? true : 'No te deben ningún favor'; },
        ejecutar(E, a) { const d = Po.def(a.actor), s = Po.st(E, a.actor); s.favor--; const eff = { iglesia: { seg: { mayores: 5, rural: 4 }, rec: 2 }, militares: { aprob: 2, rec: 2 }, usa: { confianza: 3, rec: 1.5 }, prensa: { rec: 5 }, banca: { patrimonio: 120, confianza: 2 }, maquinas: { seg: { rural: 6, informales: 4 } }, ong: { seg: { jovenes: 5, universitarios: 4 }, rec: 2 } }[a.actor]; return { ok: true, msg: `${d.corto} salda su deuda contigo: ` + C.Pais.ef(E, eff) }; } });
      A.registrar({ id: 'aceptarFinanciacion', nombre: 'Aceptar financiación de un poder', icono: '💵', grupo: 'poderes', costo: 1, disponible: ok,
        ejecutar(E, a) { const d = Po.def(a.actor), s = Po.st(E, a.actor), J = E.jugador; if (E.fecha.t - (s.fin || -99) < 26) return { ok: false, msg: 'Ya te financiaron hace poco' }; s.fin = E.fecha.t; const monto = Math.round(40 + s.poder * 2.5); J.patrimonio += monto; s.favor -= 1; s.afin = U.clamp(s.afin + 5, 0, 100); const turbio = U.chance(0.18); if (turbio) { C.Pais.ef(E, { escandalo: `Financiación de ${d.corto} a ${J.nombre}`, honestidad: -3, rec: -1 }); C.Medios.noticia(E, { tipo: 'control', titular: `Revelan que ${d.n.toLowerCase()} financió a ${J.nombre}`, tono: -1, jugador: true }); } return { ok: true, msg: `${d.corto} te financia con $${monto} M: les quedas debiendo un favor${turbio ? ' (y se filtra a la prensa)' : ''}` }; } });
      A.registrar({ id: 'denunciarPoder', nombre: 'Denunciar públicamente a un poder', icono: '📢', grupo: 'poderes', costo: 2, disponible: ok,
        ejecutar(E, a) { const d = Po.def(a.actor), s = Po.st(E, a.actor); s.afin = U.clamp(s.afin - 16, 0, 100); const J = E.jugador; const txt = C.Pais.ef(E, { rec: 3, honestidad: 1, seg: { jovenes: 2, informales: 1.5 } }); if (s.poder > 60 && U.chance(0.4)) Po.sabotaje(E, a.actor); return { ok: true, msg: `Denuncias a ${d.corto}: ` + txt }; } });
    }
  };

  /* ═══════════ 2. Prensa de investigación ═══════════ */
  const TEMAS = ['contratos y adjudicaciones', 'patrimonio y propiedades', 'financiación de campañas', 'nepotismo en nóminas', 'viajes pagados por terceros', 'vínculos con empresarios', 'tierras y notarías', 'sobrecostos en obras'];
  const Pr = {
    clave: 'prensa',
    asegurar(E) { if (E.prensa && E.prensa.invs) return E.prensa; E.prensa = { invs: [], hist: [], ult: -99 }; return E.prensa; },
    init(E) { E.prensa = null; Pr.asegurar(E); },
    medio(E, id) { return E.medios.lista.find(m => m.id === id) || E.medios.lista[0]; },
    abrir(E, sujeto, grav, quien) {
      const P = Pr.asegurar(E), m = quien ? Pr.medio(E, quien) : U.pesado(E.medios.lista, x => 1 + (x.credibilidad || 50) / 40);
      const inv = { id: U.id('inv'), sujeto, medio: m.id, tema: U.pick(TEMAS), avance: U.ri(5, 25), grav: U.clamp(grav || U.ri(1, 3), 1, 3), estado: 'abierta', t0: E.fecha.t, mina: sujeto === 'J' };
      P.invs.push(inv);
      if (sujeto === 'J') C.Eventos.disparar(E, C.Eventos.plantilla('pr_contacto'), { forzar: true, inv: inv.id, vars: { medio: m.nombre, tema: inv.tema } });
      return inv;
    },
    nombreSujeto: (E, inv) => inv.sujeto === 'J' ? E.jugador.nombre : (E.politicos[inv.sujeto] ? E.politicos[inv.sujeto].nombre : 'un político'),
    publicar(E, inv) {
      inv.estado = 'publicada'; inv.t1 = E.fecha.t; const m = Pr.medio(E, inv.medio), g = inv.grav, nombre = Pr.nombreSujeto(E, inv);
      const pot = (m.credibilidad || 60) / 70, titular = `${m.nombre} revela irregularidades de ${nombre} en ${inv.tema}`;
      if (inv.sujeto === 'J') { const J = E.jugador; C.Pais.ef(E, { escandalo: `Investigación de ${m.nombre} sobre ${inv.tema}`, honestidad: -g * 1.5 * pot, rec: -g * 1.3 * pot }); E.opinion.escandalos = (E.opinion.escandalos || 0) + 1; J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + g * 2, 0, 100); }
      else { const p = E.politicos[inv.sujeto]; if (p) { p.fuerza = Math.max(0, (p.fuerza || 50) - g * 3); p.relJ = (p.relJ || 0); if (E.partidos[p.partido]) E.partidos[p.partido].popularidad = Math.max(0, E.partidos[p.partido].popularidad - g * 0.12); } }
      C.Medios.noticia(E, { tipo: 'control', titular, tono: inv.sujeto === 'J' ? -1 : 0, jugador: inv.sujeto === 'J', importante: g >= 2 });
      Pr.asegurar(E).hist.unshift({ t: E.fecha.t, txt: titular }); if (E.prensa.hist.length > 12) E.prensa.hist.length = 12;
    },
    turno(E) {
      const P = Pr.asegurar(E), J = E.jugador, t = E.fecha.t, ps = Po.asegurar(E).actores.prensa;
      for (const inv of P.invs) if (inv.estado === 'abierta') { inv.avance += U.rf(1.2, 3.2) * (inv.mina && ps.afin < 35 ? 1.4 : 1); if (inv.avance >= 100) Pr.publicar(E, inv); }
      P.invs = P.invs.filter(i => i.estado === 'abierta' || t - (i.t1 || t) < 26);
      if (!P.invs.some(i => i.mina && i.estado === 'abierta') && t - P.ult > 40) {
        const pr = (0.004 + (J.riesgoJudicial || 0) / 5000 + (J.escandalos.length * 0.0007) + (J.patrimonio > 1500 ? 0.0015 : 0)) * (J.reconocimiento > 20 ? 1 : 0.3) * (ps.afin < 40 ? 1.6 : 1);
        if (U.chance(pr)) { P.ult = t; Pr.abrir(E, 'J'); }
      }
      if (U.chance(0.01)) { const cand = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && (C.DATA.cargos[p.cargo.tipo] || { nivel: 0 }).nivel >= 3); if (cand.length) Pr.abrir(E, U.pick(cand).id); }
    },
    registrarAcciones() {
      const A = C.Acciones, inv = (E, a) => Pr.asegurar(E).invs.find(x => x.id === a.inv && x.estado === 'abierta');
      const mia = (E, a) => { const i = inv(E, a); return i && i.mina ? true : 'No hay una investigación abierta contra ti con ese código'; };
      A.registrar({ id: 'colaborarPrensa', nombre: 'Colaborar con el periodista', icono: '🤝', grupo: 'prensa', costo: 1, disponible: mia,
        ejecutar(E, a) { const i = inv(E, a); i.grav = Math.max(1, i.grav - 1); i.avance = Math.min(99, i.avance + 30); return { ok: true, msg: 'Entregas documentos y das tu versión: la historia saldrá pronto, pero menos dura' }; } });
      A.registrar({ id: 'adelantarseNota', nombre: 'Adelantarte con tu propia versión', icono: '🎤', grupo: 'prensa', costo: 2, disponible: mia,
        ejecutar(E, a) { const i = inv(E, a); i.estado = 'archivada'; C.Pais.ef(E, { honestidad: -0.5, rec: -0.8, seg: { medios: 1 } }); C.Medios.noticia(E, { tipo: 'jugador', titular: `${E.jugador.nombre} se adelanta y explica sus movimientos en ${i.tema}`, tono: 0, jugador: true }); return { ok: true, msg: 'Cuentas tu versión antes que nadie: el daño es menor y el tema se enfría' }; } });
      A.registrar({ id: 'comprarSilencio', nombre: 'Comprar el silencio', icono: '💰', grupo: 'prensa', costo: 2,
        disponible(E, a) { const x = mia(E, a); if (x !== true) return x; return E.jugador.patrimonio >= 80 ? true : 'Necesitas $80 millones'; },
        ejecutar(E, a) { const i = inv(E, a), J = E.jugador; J.patrimonio -= 80; if (U.chance(0.5)) { i.estado = 'archivada'; C.Pais.ef(E, { honestidad: -2 }); return { ok: true, msg: 'El expediente «se pierde»… por ahora. Tu conciencia pesa un poco más' }; } i.grav = Math.min(3, i.grav + 1); i.avance = Math.min(99, i.avance + 25); C.Pais.ef(E, { honestidad: -3, rec: -1 }); return { ok: true, exito: false, msg: 'El soborno se filtra y la historia sale más grave que antes' }; } });
      A.registrar({ id: 'demandarMedio', nombre: 'Demandar al medio', icono: '⚖', grupo: 'prensa', costo: 1,
        disponible(E, a) { const x = mia(E, a); if (x !== true) return x; return E.jugador.patrimonio >= 30 ? true : 'Necesitas $30 millones para los abogados'; },
        ejecutar(E, a) { const i = inv(E, a); E.jugador.patrimonio -= 30; if (U.chance(0.35)) { i.estado = 'archivada'; C.Pais.ef(E, { rec: 1 }); return { ok: true, msg: 'Un juez ordena suspender la publicación: ganaste tiempo' }; } i.avance = Math.min(99, i.avance + 20); C.Pais.ef(E, { rec: -0.5 }); return { ok: true, exito: false, msg: 'Efecto Streisand: la demanda llama más la atención sobre el tema' }; } });
      A.registrar({ id: 'investigarRival', nombre: 'Filtrar información sobre un rival', icono: '🕵', grupo: 'prensa', costo: 2,
        disponible(E, a) { const p = E.politicos[a.pol]; if (!p || !p.activo || p.id === 'J') return 'Elige un rival'; return E.jugador.patrimonio >= 40 ? true : 'Necesitas $40 millones'; },
        ejecutar(E, a) { const p = E.politicos[a.pol]; E.jugador.patrimonio -= 40; Pr.abrir(E, p.id, U.ri(1, 3)); const turbio = U.chance(0.25); if (turbio) { C.Pais.ef(E, { honestidad: -2 }); return { ok: true, msg: `Un periodista abre expediente contra ${p.nombre}… pero se sabe que la filtración vino de ti` }; } return { ok: true, msg: `Un periodista abre expediente contra ${p.nombre}` }; } });
    }
  };

  /* ═══════════ 3. Crisis internas de partidos ═══════════ */
  const Fa = {
    clave: null,
    turno(E) {
      const J = E.jugador, t = E.fecha.t; if (t % 4 !== 0) return;
      for (const pa of Object.values(E.partidos)) {
        if (pa.especial || pa.futuro || !pa.facciones || pa.facciones.length < 2) continue;
        const mio = pa.id === J.partido;
        pa.cohesion = U.clamp(pa.cohesion + (60 - pa.cohesion) * 0.01 + U.gauss(0, 0.6), 0, 100);
        if (pa.cohesion < 40 && t - (pa.crisisT || -99) > 52) {
          const p = (40 - pa.cohesion) / 800 + 0.003;
          if (!U.chance(p * 4)) continue; pa.crisisT = t;
          if (mio && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('pa_escision'), { forzar: true, vars: { partido: pa.nombre } });
          else if (!mio && pa.cohesion < 32 && U.chance(0.4)) { pa.cohesion += 18; C.Partidos.fundacionNPC(E); }
        }
      }
      // fusión de partidos pequeños y parecidos
      if (t % 52 === 0 && U.chance(0.35)) {
        const ps = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.popularidad < 3 && p.id !== J.partido && p.id !== (E.partidos[J.partido] || {}).id);
        for (let i = 0; i < ps.length; i++) for (let k = i + 1; k < ps.length; k++) if (U.distIdeo(ps[i], ps[k]) < 0.22) {
          const A = ps[i].popularidad >= ps[k].popularidad ? ps[i] : ps[k], B = A === ps[i] ? ps[k] : ps[i];
          A.popularidad += B.popularidad * 0.75; A.popBase += B.popBase * 0.6; A.militantes += Math.round(B.militantes * 0.6);
          C.Partidos.disolver(E, B); B.disuelto = false; C.Medios.noticia(E, { tipo: 'partidos', titular: `Se fusionan el ${A.sigla} y el ${B.sigla}: nace una bancada más fuerte`, tono: 0, importante: true }); return;
        }
      }
    },
    /* Decisión del jugador ante una escisión en su propio partido */
    resolver(E, via) {
      const J = E.jugador, pa = E.partidos[J.partido]; if (!pa) return '';
      if (via === 'negociar') { pa.cohesion = U.clamp(pa.cohesion + 22, 0, 100); return 'Negocias con la facción disidente: se calman las aguas'; }
      if (via === 'expulsar') { pa.cohesion = U.clamp(pa.cohesion + 12, 0, 100); pa.popularidad = Math.max(0, pa.popularidad - 0.5); pa.militantes = Math.round(pa.militantes * 0.93); C.Partidos.fundacionNPC(E); return 'Expulsas a los disidentes: ellos fundan otro partido y tu bancada se achica'; }
      pa.cohesion = U.clamp(pa.cohesion - 8, 0, 100); return 'Dejas que la crisis siga su curso';
    }
  };

  C.Poderes = Po; C.Prensa = Pr; C.Faccion = Fa;
  // Las leyes que sancionas mueven a los poderes según sus apoyos y opositores
  C.Bus.on('ley', p => {
    const E = C.E; if (!E || !p || !(p.autor === 'J' || (p.coautores || []).includes('J') || p.gobierno && E.gobierno.presidente === 'J')) return;
    Po.asegurar(E); const vistos = {};
    for (const n of p.apoyan || []) { const id = MAPA_LEY[n]; if (id && !vistos[id]) { vistos[id] = 1; Po.mover(E, id, 2.5); } }
    for (const n of p.opuestos || []) { const id = MAPA_LEY[n]; if (id && !vistos[id]) { vistos[id] = 1; Po.mover(E, id, -2.5); } }
  });
  for (const [n, o, pr] of [['Poderes', Po, 66], ['Prensa', Pr, 67], ['Faccion', Fa, 68]]) { o.migrar = o.init; C.Tiempo.registrar(n.toLowerCase(), o, pr); if (o.clave) (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push(n); if (o.registrarAcciones) o.registrarAcciones(); }
})(window.CURUL);
