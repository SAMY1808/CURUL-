/* País y vida (Fase 40). (1) Actualidad nacional: el Mundial, la Copa América, el Tour, los reinados y los premios mueven
   el ánimo del país y te obligan a posicionarte; también tragedias, crímenes que conmocionan y virales. (2) Vida
   personal con drama: amigos que te cuidan o te traicionan, romances, burnout, familia. (3) Retos: objetivos de carrera
   para jugar con una meta (y un reto semanal) que dan fama y logros. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  /* ═══════════ 1. Actualidad nacional ═══════════ */
  const FASES = ['grupos', 'octavos', 'cuartos', 'semifinal', 'final'];
  const FASE_N = { grupos: 'fase de grupos', octavos: 'octavos de final', cuartos: 'cuartos de final', semifinal: 'semifinal', final: 'la final' };
  const PWIN = { grupos: 0.62, octavos: 0.55, cuartos: 0.5, semifinal: 0.46, final: 0.45 };
  const Na = {
    clave: 'nacional', FASE_N,
    asegurar(E) { if (E.nacional && E.nacional.animo != null) return E.nacional; E.nacional = { animo: 55, mundial: null, copa: null, flags: {}, hist: [] }; return E.nacional; },
    init(E) { E.nacional = null; Na.asegurar(E); },
    anotar(E, txt) { const n = Na.asegurar(E); n.hist.unshift({ t: E.fecha.t, txt }); if (n.hist.length > 16) n.hist.length = 16; },
    flag(E, k, v) { const n = Na.asegurar(E); if (v === undefined) return n.flags[k]; n.flags[k] = v; },
    mood(E, d, txt) { const n = Na.asegurar(E); n.animo = U.clamp(n.animo + d, 0, 100); if (txt) Na.anotar(E, txt); },
    turno(E) {
      const n = Na.asegurar(E), t = E.fecha.t, hoy = U.hoy(), y = hoy.getUTCFullYear(), m = hoy.getUTCMonth(), dia = hoy.getUTCDate();
      const ec = E.economia, seg = U.prom(Object.values(E.deptos).map(d => d.seguridad));
      const obj = 50 + (ec.crecimiento - 2.5) * 3 - (ec.desempleo - 10) * 1.2 + (seg - 50) * 0.2;
      n.animo = U.clamp(n.animo + (obj - n.animo) * 0.012 + U.gauss(0, 0.2), 0, 100);
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + (n.animo - 55) * 0.0015, 3, 95);
      U.serie('nacional:animo', n.animo); if (C.Poderes && t % 4 === 0) U.serie('poderes:afin', U.prom(Object.values(C.Poderes.asegurar(E).actores).map(a => a.afin)));
      // Mundial (años 2026 + 4k): clasificación y fases
      if ((y - 2026) % 4 === 0 && y >= 1930) {
        if (m === 5 && dia >= 11 && dia < 18 && !Na.flag(E, 'mundial' + y)) {
          Na.flag(E, 'mundial' + y, true); const clasifica = U.chance(y >= 2014 ? 0.62 : y >= 1990 ? 0.35 : 0.15);
          n.mundial = clasifica ? { anio: y, fase: 'grupos', t0: t, vivo: true, ganados: 0 } : { anio: y, vivo: false, ganados: 0 };
          Na.mood(E, clasifica ? 5 : -3, clasifica ? `Colombia juega el Mundial ${y}` : `Colombia no clasifica al Mundial ${y}`);
          C.Medios.noticia(E, { tipo: 'evento', titular: clasifica ? `Arranca el Mundial ${y}: Colombia sueña en grande` : `Colombia se queda por fuera del Mundial ${y}: duelo nacional`, tono: clasifica ? 1 : -1, importante: true });
        }
        const w = n.mundial;
        if (w && w.vivo && t - w.t0 >= 1 && (t - w.t0) % 1 === 0 && t > (w.ult || 0) + 1) {
          w.ult = t; const gana = U.chance(PWIN[w.fase]);
          if (gana) {
            w.ganados++; const i = FASES.indexOf(w.fase);
            if (w.fase === 'final') { w.vivo = false; w.campeon = true; Na.mood(E, 25, `¡Colombia campeona del Mundial ${y}!`); C.Medios.noticia(E, { tipo: 'evento', titular: `¡COLOMBIA CAMPEONA DEL MUNDO! El país entero está en las calles`, tono: 1, importante: true }); C.Eventos.disparar(E, C.Eventos.plantilla('na_mundial_final'), { vars: { resultado: 'campeona' } }); }
            else { w.fase = FASES[i + 1]; Na.mood(E, 3, `Colombia avanza a ${FASE_N[w.fase]}`); C.Medios.noticia(E, { tipo: 'evento', titular: `Colombia avanza a ${FASE_N[w.fase]} del Mundial`, tono: 1 }); if (w.fase === 'semifinal') C.Eventos.disparar(E, C.Eventos.plantilla('na_mundial_semi'), {}); }
          } else { w.vivo = false; const nombre = FASE_N[w.fase]; Na.mood(E, w.fase === 'final' ? -4 : -7, `Colombia cae en ${nombre} del Mundial ${y}`); C.Medios.noticia(E, { tipo: 'evento', titular: `Colombia queda eliminada en ${nombre}: tristeza nacional`, tono: -1, importante: w.fase !== 'grupos' }); if (w.fase === 'semifinal' || w.fase === 'final') C.Eventos.disparar(E, C.Eventos.plantilla('na_mundial_final'), { vars: { resultado: 'subcampeona' } }); }
        }
      }
      // Copa América (años 2024 + 4k)
      if ((y - 2024) % 4 === 0 && m === 6 && dia >= 8 && dia < 15 && !Na.flag(E, 'copa' + y)) { Na.flag(E, 'copa' + y, true); const res = U.chance(0.25) ? 'campeón' : U.chance(0.5) ? 'finalista' : 'eliminado'; Na.mood(E, res === 'campeón' ? 14 : res === 'finalista' ? 5 : -3, `Copa América ${y}: Colombia ${res}`); C.Medios.noticia(E, { tipo: 'evento', titular: `Copa América ${y}: Colombia queda ${res}`, tono: res === 'eliminado' ? -1 : 1, importante: res === 'campeón' }); }
      // Tour de Francia (julio) y reinado (noviembre) y premios (octubre)
      if (m === 6 && dia >= 20 && dia < 27 && !Na.flag(E, 'tour' + y) && y >= 2000) { Na.flag(E, 'tour' + y, true); if (U.chance(0.14)) C.Eventos.disparar(E, C.Eventos.plantilla('na_tour'), {}); }
      if (m === 10 && dia >= 8 && dia < 15 && !Na.flag(E, 'reinado' + y)) { Na.flag(E, 'reinado' + y, true); C.Eventos.disparar(E, C.Eventos.plantilla('na_reinado'), {}); }
      if (m === 9 && dia >= 12 && dia < 19 && !Na.flag(E, 'premio' + y) && y >= 1990) { Na.flag(E, 'premio' + y, true); if (U.chance(0.4)) C.Eventos.disparar(E, C.Eventos.plantilla('na_premio'), {}); }
      // sucesos aleatorios
      if (!E.eventos.pendientes.length && U.chance(0.018)) { const pool = C.DATA.eventos.filter(e => e.nacional && (!e.req || e.req(E)) && !E.eventos.historial.slice(0, 8).some(h => h.plantilla === e.id)); const pl = U.pesado(pool, e => e.peso || 1); if (pl) C.Eventos.disparar(E, pl, {}); }
    }
  };

  /* ═══════════ 2. Vida personal: amigos y drama ═══════════ */
  const ROLES = { compadre: ['Compadre de toda la vida', '🍻'], financista: ['Amigo empresario', '💼'], asesor: ['Asesor de confianza', '🧭'], colega: ['Colega de la política', '🏛'] };
  const Vi = {
    ROLES, clave: null,
    todos(E) { const J = E.jugador; if (!J.amigos) { const N = C.DATA.nombres; J.amigos = ['compadre', 'financista', 'asesor'].map(r => { const h = U.chance(0.55); return { id: U.id('am'), nombre: `${U.pick(h ? N.h : N.m)} ${U.pick(N.a)}`, rol: r, lealtad: U.ri(55, 85), desde: E.fecha.t, cena: -99 }; }); } return J.amigos; },
    turno(E) {
      const J = E.jugador, am = Vi.todos(E);
      for (const a of am.slice()) {
        a.lealtad = U.clamp(a.lealtad - 0.025 + (J.reconocimiento > 50 ? -0.01 : 0), 0, 100);
        if (a.lealtad < 20 && U.chance(0.01) && !E.eventos.pendientes.length) { C.Eventos.disparar(E, C.Eventos.plantilla('vi_traicion'), { forzar: true, amigo: a.id, vars: { amigo: a.nombre } }); }
      }
      if (U.chance(0.02) && !E.eventos.pendientes.length) {
        const pool = C.DATA.eventos.filter(e => e.vida && (!e.req || e.req(E)) && !E.eventos.historial.slice(0, 10).some(h => h.plantilla === e.id));
        const pl = U.pesado(pool, e => (e.peso || 1) * (e.sit ? e.sit(E) : 1)); if (pl) C.Eventos.disparar(E, pl, { forzar: true, vars: { amigo: U.pick(am).nombre } });
      }
    },
    registrarAcciones() {
      const A = C.Acciones, am = (E, a) => Vi.todos(E).find(x => x.id === a.amigo);
      A.registrar({ id: 'cenaAmigo', nombre: 'Cenar con un amigo', icono: '🍷', grupo: 'personal', costo: 1,
        disponible(E, a) { const x = am(E, a); if (!x) return 'Elige un amigo'; return E.fecha.t - x.cena < 6 ? 'Cenaron hace poco' : E.jugador.patrimonio >= 5 ? true : 'Necesitas $5 millones'; },
        ejecutar(E, a) { const x = am(E, a); x.cena = E.fecha.t; E.jugador.patrimonio -= 5; x.lealtad = U.clamp(x.lealtad + 12, 0, 100); E.jugador.bienestar = U.clamp((E.jugador.bienestar || 60) + 4, 0, 100); return { ok: true, msg: `Cena larga con ${x.nombre}: la amistad se renueva (lealtad ${Math.round(x.lealtad)})` }; } });
      A.registrar({ id: 'ayudarAmigo', nombre: 'Ayudar a un amigo en apuros', icono: '🤲', grupo: 'personal', costo: 1,
        disponible(E, a) { const x = am(E, a); if (!x) return 'Elige un amigo'; return E.jugador.patrimonio >= 30 ? true : 'Necesitas $30 millones'; },
        ejecutar(E, a) { const x = am(E, a); E.jugador.patrimonio -= 30; x.lealtad = U.clamp(x.lealtad + 22, 0, 100); return { ok: true, msg: `Le echas una mano a ${x.nombre}: te la va a deber toda la vida` }; } });
      A.registrar({ id: 'consejoAmigo', nombre: 'Pedirle consejo a un amigo', icono: '💬', grupo: 'personal', costo: 1,
        disponible(E, a) { const x = am(E, a); return x ? (E.fecha.t - (x.consejo || -99) < 13 ? 'Ya te aconsejó hace poco' : true) : 'Elige un amigo'; },
        ejecutar(E, a) { const x = am(E, a); x.consejo = E.fecha.t; const ef = { compadre: { bienestar: 6, rec: 0.5 }, financista: { patrimonio: Math.round(20 + x.lealtad / 2), cred: 0.5 }, asesor: { cred: 2, rec: 1 }, colega: { rec: 1.5, partido: 2 } }[x.rol]; return { ok: true, msg: `${x.nombre} te da un consejo: ` + C.Pais.ef(E, ef) }; } });
    }
  };

  /* ═══════════ 3. Retos de carrera ═══════════ */
  const cargo = (E, c) => (E.jugador.ocupados || []).includes(c);
  const leyes = E => (E.jugador.historialLegislativo || []).filter(h => h.resultado === 'ley').length;
  const RETOS = [
    { id: 'presi20', icono: '🦅', n: 'Presidente en veinte años', d: 'Llegar a la Presidencia antes de cumplir veinte años de carrera.', ok: E => cargo(E, 'presidente'), falla: () => false },
    { id: 'limpio', icono: '🕊', n: 'Manos limpias', d: 'Llegar al Senado sin ningún escándalo en tu historial.', ok: E => cargo(E, 'senador') && !(E.jugador.escandalos || []).length, falla: E => (E.jugador.escandalos || []).length > 0 },
    { id: 'bogota', icono: '🏙', n: 'Alcalde de Bogotá sin partido', d: 'Gobernar Bogotá habiendo llegado como independiente.', ok: E => E.jugador.cargo === 'alcalde' && E.jugador.cargoInfo && E.jugador.cargoInfo.depto === 'BOG' },
    { id: 'leyes20', icono: '📚', n: 'Veinte leyes', d: 'Que veinte leyes de tu autoría se aprueben.', ok: E => leyes(E) >= 20 },
    { id: 'gobernador', icono: '🗺', n: 'Gobernador del año', d: 'Quedar primero en el ranking de gobernadores.', ok: E => !!(E.jugador.cargoInfo && E.jugador.cargo === 'gobernador' && C.Gobernacion && C.Gobernacion.vida(E).rank && C.Gobernacion.vida(E).rank.puesto === 1) },
    { id: 'alcalde', icono: '🎪', n: 'El mejor alcalde del país', d: 'Quedar primero en el ranking de alcaldes.', ok: E => !!(E.jugador.cargo === 'alcalde' && C.Alcaldia && C.Alcaldia.esAlcalde(E) && C.Alcaldia.vida(E).rank && C.Alcaldia.vida(E).rank.puesto === 1) },
    { id: 'ricos', icono: '💎', n: 'Fortuna honrada', d: 'Superar $5.000 millones de patrimonio con honestidad de 60 o más.', ok: E => E.jugador.patrimonio >= 5000 && E.jugador.rep.honestidad >= 60 },
    { id: 'aprobado', icono: '🌟', n: 'Presidente querido', d: 'Ser Presidente con 65 % de aprobación o más.', ok: E => E.gobierno.presidente === 'J' && E.opinion.aprobacionPres >= 65 },
    { id: 'paz', icono: '🤝', n: 'La paz total', d: 'Firmar la paz con un grupo armado siendo Presidente.', ok: E => E.gobierno.presidente === 'J' && Object.values(E.ordenPublico.grupos).some(g => g.acuerdoPaz) },
    { id: 'reforma', icono: '🏛', n: 'Constitucionalista', d: 'Ver aprobada una reforma constitucional en tu carrera.', ok: E => (E.constitucion.historial || []).length >= 1 },
    { id: 'dinastia', icono: '👪', n: 'Dinastía', d: 'Ver a un hijo tuyo elegido a un cargo.', ok: E => (E.jugador.familia || []).some(f => f.carreraPolitica && (f.cargo || f.electo)) },
    { id: 'fundador', icono: '🎗', n: 'Fundador', d: 'Fundar un partido y llevarlo a ganar una curul.', ok: E => !!(E.partidos[E.jugador.partido] && E.partidos[E.jugador.partido].fundado >= 2000 && cargo(E, 'senador')) },
    { id: 'poderosos', icono: '🕸', n: 'Todos conmigo', d: 'Tener a cuatro poderes fácticos con afinidad de 65 o más.', ok: E => E.poderes && Object.values(E.poderes.actores).filter(a => a.afin >= 65).length >= 4 },
    { id: 'debate', icono: '🎙', n: 'Rey del debate', d: 'Ganar un debate presidencial.', ok: E => (E.debates && E.debates.hist || []).some(d => d.puesto === 1) }
  ];
  const Re = {
    RETOS, clave: 'retos',
    asegurar(E) { if (E.retos && E.retos.hist) return E.retos; E.retos = { activo: null, hist: [] }; return E.retos; },
    init(E) { E.retos = null; Re.asegurar(E); },
    def: id => RETOS.find(r => r.id === id),
    semanal(E) { const f = U.hoy(), sem = Math.floor((f - new Date(Date.UTC(f.getUTCFullYear(), 0, 1))) / (7 * 864e5)); return RETOS[(sem + f.getUTCFullYear()) % RETOS.length]; },
    turno(E) {
      const R = Re.asegurar(E), a = R.activo; if (!a || a.estado !== 'activo' || E.fecha.t % 4 !== 0) return;
      const d = Re.def(a.id); let ok = false, falla = false;
      try { ok = !!d.ok(E); falla = d.falla ? (a.id === 'presi20' ? E.fecha.t - a.t0 > 1040 : !!d.falla(E)) : false; } catch (e) {}
      if (ok) { a.estado = 'cumplido'; a.t1 = E.fecha.t; R.hist.unshift(a); C.Opinion.subirRec(E, 6); E.jugador.reconocimientos.push({ t: E.fecha.t, txt: `Reto cumplido: ${d.n}` }); if (C.Logros) C.Logros.desbloquear(E, 'reto_' + d.id, 'Reto: ' + d.n); C.Medios.noticia(E, { tipo: 'jugador', titular: `${E.jugador.nombre} cumple su reto: ${d.n}`, tono: 1, jugador: true, importante: true }); R.activo = null; }
      else if (falla) { a.estado = 'fallido'; a.t1 = E.fecha.t; R.hist.unshift(a); C.Medios.noticia(E, { tipo: 'jugador', titular: `${E.jugador.nombre} fracasa en su reto: ${d.n}`, tono: -1, jugador: true }); R.activo = null; }
      if (R.hist.length > 12) R.hist.length = 12;
    },
    registrarAcciones() {
      C.Acciones.registrar({ id: 'aceptarReto', nombre: 'Aceptar un reto de carrera', icono: '🎯', grupo: 'personal', costo: 0,
        disponible(E, a) { const R = Re.asegurar(E); return Re.def(a.reto) ? (R.activo ? 'Ya tienes un reto activo' : true) : 'Elige un reto'; },
        ejecutar(E, a) { const d = Re.def(a.reto); Re.asegurar(E).activo = { id: d.id, t0: E.fecha.t, estado: 'activo' }; return { ok: true, msg: `Reto aceptado: ${d.n}. ${d.d}` }; } });
      C.Acciones.registrar({ id: 'abandonarReto', nombre: 'Abandonar el reto', icono: '🏳', grupo: 'personal', costo: 0,
        disponible(E) { return Re.asegurar(E).activo ? true : 'No hay reto activo'; },
        ejecutar(E) { Re.asegurar(E).activo = null; return { ok: true, msg: 'Abandonas el reto' }; } });
    }
  };

  C.Nacional = Na; C.Vida = Vi; C.Retos = Re;
  for (const [n, o, pr] of [['Nacional', Na, 69], ['Vida', Vi, 70], ['Retos', Re, 71]]) { o.migrar = o.init; C.Tiempo.registrar(n.toLowerCase(), o, pr); if (o.clave) (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push(n); if (o.registrarAcciones) o.registrarAcciones(); }
})(window.CURUL);
