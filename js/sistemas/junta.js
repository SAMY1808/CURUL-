/* Junta directiva de las empresas públicas: un órgano de siete (nueve en las nacionales) miembros con delegados del dueño, del
   sindicato, de los usuarios, independientes y, si hay socios privados, accionistas. Las decisiones grandes —cambiar al gerente,
   vender, endeudarse, asociarse con un privado, fusionar, invertir, subir tarifas, fijar la estrategia o expandirse a otra
   región— ya no las toma el dueño solo: se votan, y cada miembro vota según su interés. Un buen gobierno corporativo mejora la
   eficiencia y frena los escándalos; una junta capturada por el dueño hace lo contrario. La estrategia aprobada (servicio,
   rentabilidad, expansión o transición) cambia cómo rinde la empresa, y la expansión regional lleva su servicio —y su política—
   a otros departamentos. Además, las empresas grandes mueven la inflación, el crecimiento y el déficit del país. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TIPOS = {
    dueno: { n: 'Delegado del dueño', icono: '🏛' },
    socio: { n: 'Delegado de otro socio público', icono: '🤝' },
    sindicato: { n: 'Representante de los trabajadores', icono: '👷' },
    usuarios: { n: 'Veeduría de usuarios', icono: '🧾' },
    independiente: { n: 'Miembro independiente', icono: '🎓' },
    privado: { n: 'Accionista privado', icono: '💼' }
  };
  const ESTRATEGIAS = {
    servicio: { n: 'Servicio y cobertura', icono: '💧', txt: 'Tarifas bajas y más usuarios: sube cobertura y calidad, baja la rentabilidad.', rent: -1.2, cob: 0.03, cal: 0.015, infl: -0.0003 },
    rentable: { n: 'Rentabilidad', icono: '📈', txt: 'Exprimir el negocio: más utilidades hoy, menos servicio mañana.', rent: 1.5, cob: -0.01, cal: -0.006, infl: 0.0003 },
    expansion: { n: 'Expansión regional', icono: '🧭', txt: 'Crecer hacia otros departamentos: más escala, menos utilidades ahora.', rent: -0.4, cob: 0.015, cal: 0, infl: 0, region: 1.6 },
    transicion: { n: 'Transición energética', icono: '🌱', txt: 'Invertir en renovables y reducir la huella: sólo energía y petróleo.', rent: -0.6, cob: 0.005, cal: 0.005, infl: 0, trans: 0.04, sector: ['energia', 'petroleo'] }
  };
  /* Qué piensa cada tipo de miembro de cada asunto (−1 en contra … +1 a favor) */
  const INTERES = {
    gerente: { dueno: 0.5, socio: 0.2, sindicato: -0.1, usuarios: 0, independiente: 0.1, privado: 0.1 },
    venta: { dueno: 0.3, socio: -0.1, sindicato: -0.9, usuarios: -0.6, independiente: 0.1, privado: 0.9 },
    bonos: { dueno: 0.5, socio: 0.2, sindicato: 0.1, usuarios: -0.1, independiente: -0.1, privado: 0.3 },
    app: { dueno: 0.3, socio: 0, sindicato: -0.7, usuarios: -0.3, independiente: 0.2, privado: 0.9 },
    fusion: { dueno: 0.4, socio: 0.1, sindicato: -0.4, usuarios: 0, independiente: 0.3, privado: 0.4 },
    inversion: { dueno: 0.3, socio: 0.3, sindicato: 0.5, usuarios: 0.5, independiente: 0.1, privado: -0.2 },
    tarifa: { dueno: 0.4, socio: 0.2, sindicato: 0.1, usuarios: -0.9, independiente: 0.2, privado: 0.6 },
    dividendos: { dueno: 0.7, socio: 0.3, sindicato: -0.5, usuarios: -0.3, independiente: -0.2, privado: 0.7 },
    estrategia: { dueno: 0.3, socio: 0.2, sindicato: 0.2, usuarios: 0.2, independiente: 0.2, privado: 0.1 },
    expansion: { dueno: 0.3, socio: -0.2, sindicato: 0.3, usuarios: 0.3, independiente: 0.1, privado: 0.4 },
    metropolitana: { dueno: 0.4, socio: 0.2, sindicato: 0.2, usuarios: 0.3, independiente: 0.2, privado: 0 }
  };
  const QUORUM = { venta: 2 / 3, fusion: 0.6 };
  const NOMBRES = () => C.DATA.nombres;

  const Ju = {
    TIPOS, ESTRATEGIAS, INTERES,
    persona(tipo, calidad, afin) {
      const N = NOMBRES(), h = U.chance(0.5);
      return { id: U.id('jm'), tipo, nombre: `${U.pick(h ? N.h : N.m)} ${U.pick(N.a)}`, calidad: Math.round(calidad != null ? calidad : U.ri(40, 82)), afin: Math.round(afin != null ? afin : 0), indep: tipo === 'independiente' ? 0.75 : tipo === 'usuarios' ? 0.6 : tipo === 'sindicato' ? 0.5 : tipo === 'dueno' ? 0.15 : 0.35, desde: C.E ? C.E.fecha.t : 0, hasta: (C.E ? C.E.fecha.t : 0) + 208 };
    },
    asegurar(E, e) {
      if (e.junta) return e.junta;
      const nac = e.nivel === 'nacional', privados = (e.vendido || 0) > 0 || (e.appPct || 0) > 0;
      const tipos = ['dueno', 'dueno', 'dueno', 'sindicato', 'usuarios', 'independiente', 'independiente'];
      if (nac) tipos.push('independiente', 'usuarios');
      if (privados) tipos[6] = 'privado'; else if (e.nivel !== 'municipal') tipos[2] = 'socio';
      const q = (e.gerente ? e.gerente.integridad : 60);
      const miembros = tipos.map(t => Ju.persona(t, t === 'independiente' ? U.ri(60, 85) : t === 'dueno' ? U.ri(40, 75) : U.ri(45, 75), t === 'dueno' ? U.ri(35, 70) : t === 'privado' ? 25 : t === 'socio' ? 20 : U.ri(-15, 15)));
      const sec = { agua: 'servicio', aseo: 'servicio', salud: 'servicio', transporte: 'servicio', energia: 'rentable', telecom: 'rentable', petroleo: 'rentable' }[e.sector] || 'rentable';
      e.junta = { miembros, presidente: miembros[0].id, estrategia: sec, gobernanza: Math.round(U.clamp(35 + q * 0.2 + (e.politizacion != null ? -e.politizacion * 0.15 : 0), 25, 75)), reformas: 0, region: [], ultima: null, ult: E.fecha.t, hist: [], votos: [] };
      return e.junta;
    },
    init() {}, migrar() {},
    miembro(j, id) { return j.miembros.find(m => m.id === id); },
    /* Afinidad media de los delegados del dueño: cuánto controla el dueño la junta */
    control(e) { const j = e.junta; if (!j) return 0; const d = j.miembros.filter(m => m.tipo === 'dueno' || m.tipo === 'socio'); return d.length ? U.prom(d.map(m => m.afin)) * (d.length / j.miembros.length) * 1.8 : 0; },
    anotar(E, e, txt) { const j = Ju.asegurar(E, e); j.hist.unshift({ t: E.fecha.t, txt }); if (j.hist.length > 14) j.hist.pop(); },
    /* Votación de la junta sobre un asunto. Devuelve { aprobado, si, no, detalle[] } */
    votar(E, e, asunto, extra) {
      const j = Ju.asegurar(E, e), I = INTERES[asunto] || {}, q = QUORUM[asunto] || 0.5;
      const detalle = j.miembros.map(m => {
        const afinidad = (m.tipo === 'dueno' || m.tipo === 'socio') ? m.afin / 140 : m.afin / 330;
        let p = 0.5 + (I[m.tipo] || 0) * 0.34 + afinidad * (1 - m.indep * 0.6) + (m.calidad - 60) / 600 + (extra || 0);
        if (m.tipo === 'independiente' && (asunto === 'gerente' || asunto === 'dividendos')) p -= (j.gobernanza - 50) / 400;
        return { id: m.id, tipo: m.tipo, si: U.chance(U.clamp(p, 0.04, 0.96)) };
      });
      const si = detalle.filter(d => d.si).length, no = detalle.length - si;
      const aprobado = si / detalle.length > q || (q === 0.5 && si > no);
      j.votos.unshift({ t: E.fecha.t, asunto, si, no, aprobado }); if (j.votos.length > 10) j.votos.pop();
      return { aprobado, si, no, detalle };
    },
    ETQ: { gerente: 'el cambio de gerente', venta: 'la venta de participación', bonos: 'la emisión de bonos', app: 'la alianza público-privada', fusion: 'la fusión', inversion: 'el programa de inversión', tarifa: 'el alza de tarifas', dividendos: 'exprimir los dividendos', estrategia: 'el cambio de estrategia', expansion: 'la expansión regional', metropolitana: 'la decisión' },
    /* Para las acciones del dueño: true si la junta lo aprueba, o { ok:false, msg } si lo rechaza */
    exige(E, e, asunto, extra) {
      if (!e || e.estado === 'liquidada') return true;
      const v = Ju.votar(E, e, asunto, extra);
      if (v.aprobado) { Ju.anotar(E, e, `Aprueba ${Ju.ETQ[asunto]} (${v.si}-${v.no})`); return true; }
      Ju.anotar(E, e, `Rechaza ${Ju.ETQ[asunto]} (${v.si}-${v.no})`);
      if (Em().esMia(E, e)) { E.jugador.rep.liderazgo = U.clamp(E.jugador.rep.liderazgo - 0.5, 0, 100); }
      return { ok: false, exito: false, msg: `La junta directiva de ${e.nombre} rechaza ${Ju.ETQ[asunto]} (${v.si} a favor, ${v.no} en contra). Cabildea a sus miembros o reforma su composición.` };
    },
    mod(e) {
      const j = e.junta; if (!j) return { rent: 0, cob: 0, cal: 0, infl: 0, region: 1, trans: 0 };
      const s = ESTRATEGIAS[j.estrategia] || ESTRATEGIAS.rentable, reg = U.suma((j.region || []).map(r => r.pen)) / 100;
      return { rent: s.rent + reg * 0.7 + (j.gobernanza - 50) * 0.01, cob: s.cob, cal: s.cal, infl: s.infl, region: s.region || 1, trans: s.trans || 0 };
    },
    factorEscandalo(e) { const j = e.junta; if (!j) return 1; return U.clamp(1.6 - j.gobernanza / 100 * 1.1 + Math.max(0, Ju.control(e) - 40) / 120, 0.45, 1.8); },

    turno(E) {
      const q = Em().asegurar(E), Ec = C.Economia, clima = C.Clima ? C.Clima.asegurar(E) : null;
      let infl = 0, crec = 0, paros = 0, inv = 0;
      for (const e of q.lista) {
        if (e.estado === 'liquidada') continue;
        const j = Ju.asegurar(E, e), m = Ju.mod(e), S = ESTRATEGIAS[j.estrategia];
        if (S && S.sector && !S.sector.includes(e.sector)) j.estrategia = 'rentable';
        // efectos de la estrategia
        e.cobertura = U.clamp(e.cobertura + m.cob, 20, 100); e.calidad = U.clamp(e.calidad + m.cal, 15, 98);
        e.rentabilidad = U.clamp(e.rentabilidad + m.rent, -12, 32);
        if (m.trans && clima) clima.transicion = U.clamp(clima.transicion + m.trans * (e.nivel === 'nacional' ? 1 : 0.3), 0, 100);
        // gobierno corporativo
        const indep = j.miembros.filter(x => x.tipo === 'independiente'), cal = indep.length ? U.prom(indep.map(x => x.calidad)) : 40;
        const objetivo = U.clamp(28 + cal * 0.32 + indep.length * 4 + j.reformas * 7 - e.politizacion * 0.22 - Math.max(0, Ju.control(e) - 45) * 0.25, 5, 95);
        j.gobernanza += (objetivo - j.gobernanza) * 0.015;
        e.eficiencia = U.clamp(e.eficiencia + (j.gobernanza - 50) * 0.0007, 0, 100);
        // mandatos vencidos y afinidades que se enfrían
        for (const x of j.miembros) { x.afin += (-x.afin) * 0.002 * (x.tipo === 'dueno' ? 0.2 : 1); if (E.fecha.t >= x.hasta) Ju.renovar(E, e, x); }
        // región
        Ju.turnoRegion(E, e, j, m);
        if (E.fecha.t - j.ult >= 13 && !E.meta.presim) { j.ult = E.fecha.t; Ju.reunion(E, e, j); }
        // aporte al país (empresas grandes)
        const peso = Math.min(1.6, e.capital / 4) * (e.nivel === 'nacional' ? 1.3 : e.nivel === 'municipal' ? 0.4 : 0.6);
        const ti = Em().TARIFAS[e.tarifa].idx;
        if (['energia', 'petroleo', 'telecom'].includes(e.sector)) infl += peso * ((ti - 100) * 0.00002 + m.infl);
        if (e.programas && e.programas.length) inv += peso;
        if (e.paro) paros += peso;
        crec += peso * ((e.eficiencia - 60) * 0.000008);
      }
      if (!E.meta.presim) { Ec.aplicarDelta(E, 'inflacion', infl); Ec.aplicarDelta(E, 'crecimiento', crec + inv * 0.00012 - paros * 0.0004); }
    },
    renovar(E, e, m) {
      const j = Ju.asegurar(E, e), i = j.miembros.indexOf(m), n = Ju.persona(m.tipo, m.tipo === 'independiente' ? U.ri(55, 85) : null, m.tipo === 'dueno' ? U.ri(30, 70) : m.tipo === 'privado' ? 25 : U.ri(-15, 15));
      if (m.tipo === 'dueno') n.afin = Math.max(n.afin, 30);
      j.miembros[i] = n; if (j.presidente === m.id) j.presidente = n.id;
    },
    /* Reunión trimestral: balance, presión sobre el gerente y revisión de la estrategia */
    reunion(E, e, j) {
      const mia = Em().esMia(E, e), g = e.gerente;
      const malo = e.rentabilidad < 0 || (e.meta && E.fecha.t > e.meta.hasta - 20 && !Em().METAS[e.meta.tipo].check(e, e.meta)) || e.calidad < 40;
      j.malos = malo ? (j.malos || 0) + 1 : Math.max(0, (j.malos || 0) - 1);
      if (j.malos >= 2 && g.gestion < 62 && j.gobernanza > 55) {
        const v = Ju.votar(E, e, 'gerente', -0.1);
        if (v.aprobado) {
          const t = U.pick(['tecnico', 'externo']); e.gerente = Em().gerente(E, t); j.malos = 0; e.politizacion = Math.max(0, e.politizacion - 6);
          Ju.anotar(E, e, `Destituye al gerente ${g.nombre} por malos resultados`);
          C.Medios.noticia(E, { tipo: 'regional', titular: `La junta directiva de ${e.nombre} destituye a su gerente ${g.nombre} por los malos resultados`, tono: 0, importante: mia, jugador: mia });
          return;
        }
      }
      // una junta capturada se vuelve una fuente de politización
      if (Ju.control(e) > 55 && j.gobernanza < 45) { e.politizacion = Math.min(100, e.politizacion + 3); Ju.anotar(E, e, 'La junta, controlada por el dueño, avala nombramientos políticos'); }
      // la estrategia cambia sola si hay conflicto con la realidad
      if (!mia && U.chance(0.05)) { const op = Object.keys(ESTRATEGIAS).filter(k => !ESTRATEGIAS[k].sector || ESTRATEGIAS[k].sector.includes(e.sector)); j.estrategia = U.pick(op); Ju.anotar(E, e, `Adopta la estrategia de ${ESTRATEGIAS[j.estrategia].n.toLowerCase()}`); }
    },
    turnoRegion(E, e, j, m) {
      for (const r of j.region) {
        const d = E.deptos[r.depto]; if (!d) continue;
        r.pen = U.clamp(r.pen + (0.08 * m.region) * (1 - r.tens / 120) - (r.tens > 70 ? 0.15 : 0), 0, 100);
        const gob = d.gobernador && E.politicos[d.gobernador] ? E.politicos[d.gobernador] : null, owner = Ju.partidoDueno(E, e);
        const hostil = gob && owner && gob.partido && gob.partido !== owner && U.distIdeo(gob, E.partidos[owner]) > 0.3;
        r.tens = U.clamp(r.tens + (hostil ? 0.09 : -0.04) + (e.tarifa === 'alta' ? 0.04 : 0), 0, 100);
        const idx = Em().SECTORES[e.sector].indice;
        if (idx) d[idx] = U.clamp(d[idx] + (e.cobertura - 70) / 70 * 0.0025 * r.pen / 100 + (e.calidad - 60) / 60 * 0.002 * r.pen / 100, 1, 99);
        d.ajusteAprob = U.clamp((d.ajusteAprob || 0) + (e.calidad - 60) * 0.0001 * r.pen / 100, -30, 30);
        if (r.tens > 75 && !E.meta.presim && U.chance(0.012)) {
          r.pen = Math.max(0, r.pen - 8); r.tens -= 12;
          C.Medios.noticia(E, { tipo: 'regional', titular: `La Gobernación de ${d.nombre} frena la expansión de ${e.nombre} en su territorio`, tono: -1, importante: Em().esMia(E, e), jugador: Em().esMia(E, e) });
        }
      }
    },
    partidoDueno(E, e) {
      if (e.nivel === 'nacional') return E.gobierno.partido;
      const d = E.deptos[e.depto], id = e.nivel === 'departamental' ? d.gobernador : d.alcalde;
      return id === 'J' ? E.jugador.partido : E.politicos[id] ? E.politicos[id].partido : null;
    },
    /* Cuánto aporta el conjunto de empresas al país, para la pantalla */
    resumenPais(E) {
      const q = Em().asegurar(E).lista.filter(x => x.estado !== 'liquidada');
      const activas = q.filter(e => e.junta);
      let infl = 0, div = 0, paros = 0, prog = 0;
      for (const e of activas) {
        const m = Ju.mod(e), peso = Math.min(1.6, e.capital / 4) * (e.nivel === 'nacional' ? 1.3 : e.nivel === 'municipal' ? 0.4 : 0.6);
        if (['energia', 'petroleo', 'telecom'].includes(e.sector)) infl += peso * ((Em().TARIFAS[e.tarifa].idx - 100) * 0.00002 + m.infl) * 52;
        div += e.dividendos || 0; if (e.paro) paros++; prog += (e.programas || []).length;
      }
      const reg = U.suma(activas.map(e => (e.junta.region || []).length));
      return { infl: infl * 100, div, paros, prog, reg, gob: activas.length ? U.prom(activas.map(e => e.junta.gobernanza)) : 0 };
    },

    registrarAcciones() {
      const A = C.Acciones, emp = (E, a) => Em().asegurar(E).lista.find(x => x.id === a.emp);
      const gest = (E, a) => { const e = emp(E, a); if (!e) return 'Elige la empresa'; return Em().esMia(E, e) ? true : 'No diriges al dueño de esta empresa'; };
      // Las decisiones grandes pasan por la junta
      const envolver = (id, asunto, cond) => {
        const a = A.get(id); if (!a) return; const orig = a.ejecutar;
        a.ejecutar = function (E, args) { const e = emp(E, args || {}); if (e && (!cond || cond(args, e))) { const r = Ju.exige(E, e, asunto); if (r !== true) return r; } return orig.call(this, E, args); };
      };
      envolver('nombrarGerente', 'gerente'); envolver('venderParticipacion', 'venta'); envolver('emitirBonos', 'bonos'); envolver('alianzaPublicoPrivada', 'app');
      envolver('fusionarEmpresas', 'fusion'); envolver('programaInversion', 'inversion');
      envolver('fijarTarifas', 'tarifa', (a, e) => a.nivel === 'alta' && e.tarifa !== 'alta');
      envolver('politicaDividendos', 'dividendos', a => a.pol === 'maximo');
      A.registrar({ id: 'cabildearJunta', nombre: 'Cabildear a un miembro de la junta', icono: '🤝', grupo: 'local', costo: 1, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), j = Ju.asegurar(E, e), m = Ju.miembro(j, a.miembro); if (!m) return { ok: false, msg: 'Elige al miembro' };
          if (E.jugador.patrimonio < 8) return { ok: false, msg: 'Necesitas $8 millones para atenderlo' };
          E.jugador.patrimonio -= 8; m.afin = U.clamp(m.afin + U.ri(10, 20), -100, 100);
          if (m.tipo === 'independiente') m.indep = Math.max(0.3, m.indep - 0.08);
          const riesgo = m.tipo === 'independiente' ? 0.22 : 0.08;
          if (U.chance(riesgo)) { E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.3; e.politizacion = Math.min(100, e.politizacion + 3); C.Medios.noticia(E, { tipo: 'escandalo', titular: `Denuncian presiones del dueño sobre ${m.nombre}, de la junta de ${e.nombre}`, tono: -1, jugador: true }); }
          return { ok: true, msg: `${m.nombre} te escucha: su afinidad sube a ${Math.round(m.afin)}` };
        } });
      A.registrar({ id: 'reemplazarMiembroJunta', nombre: 'Reemplazar a un miembro de la junta', icono: '🔁', grupo: 'local', costo: 2, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), j = Ju.asegurar(E, e), m = Ju.miembro(j, a.miembro); if (!m) return { ok: false, msg: 'Elige al miembro' };
          if (m.tipo === 'sindicato' || m.tipo === 'usuarios' || m.tipo === 'privado') return { ok: false, msg: 'Ese puesto lo designa el propio gremio, la veeduría o los accionistas: no lo controlas' };
          const leal = a.perfil === 'leal', n = Ju.persona(m.tipo, leal ? U.ri(35, 60) : U.ri(65, 90), m.tipo === 'independiente' ? 0 : leal ? U.ri(60, 90) : U.ri(10, 45));
          if (m.tipo === 'independiente') { n.indep = leal ? 0.4 : 0.85; if (leal) { E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.2; } }
          j.miembros[j.miembros.indexOf(m)] = n; if (j.presidente === m.id) j.presidente = n.id;
          Ju.anotar(E, e, `${n.nombre} reemplaza a ${m.nombre} (${leal ? 'perfil de confianza' : 'perfil técnico'})`);
          return { ok: true, msg: `${n.nombre} entra a la junta (${TIPOS[n.tipo].n.toLowerCase()}, capacidad ${n.calidad})` };
        } });
      A.registrar({ id: 'fijarEstrategiaEmpresa', nombre: 'Proponer una estrategia a la junta', icono: '🎯', grupo: 'local', costo: 2, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), j = Ju.asegurar(E, e), s = ESTRATEGIAS[a.estrategia]; if (!s) return { ok: false, msg: 'Elige la estrategia' };
          if (s.sector && !s.sector.includes(e.sector)) return { ok: false, msg: 'Esa estrategia no aplica a este sector' };
          if (j.estrategia === a.estrategia) return { ok: false, msg: 'Ya es la estrategia vigente' };
          const r = Ju.exige(E, e, 'estrategia'); if (r !== true) return r;
          j.estrategia = a.estrategia; return { ok: true, msg: `La junta adopta la estrategia de ${s.n.toLowerCase()}` };
        } });
      A.registrar({ id: 'expandirRegionEmpresa', nombre: 'Expandir la empresa a otro departamento', icono: '🧭', grupo: 'local', costo: 3, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), j = Ju.asegurar(E, e), d = E.deptos[a.depto]; if (!d) return { ok: false, msg: 'Elige el departamento' };
          if (d.id === e.depto) return { ok: false, msg: 'Es el territorio de origen' };
          if (j.region.some(r => r.depto === d.id)) return { ok: false, msg: 'Ya opera allí' };
          if (j.region.length >= 6) return { ok: false, msg: 'Ya tiene seis regiones: consolida antes de expandirte más' };
          const costo = +(e.capital * 0.04).toFixed(2), r = Ju.exige(E, e, 'expansion'); if (r !== true) return r;
          e.deuda += costo; j.region.push({ depto: d.id, pen: 8, tens: 15, t: E.fecha.t });
          C.Medios.noticia(E, { tipo: 'regional', titular: `${e.nombre} extiende su servicio a ${d.nombre}`, tono: 1, jugador: true, importante: true });
          return { ok: true, msg: `${e.nombre} llega a ${d.nombre}: inversión de ${U.d1(costo)} billones financiada con deuda` };
        } });
      A.registrar({ id: 'reformaGobiernoCorporativo', nombre: 'Reformar el gobierno corporativo', icono: '📜', grupo: 'local', costo: 2, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), j = Ju.asegurar(E, e); if (j.reformas >= 3) return { ok: false, msg: 'La junta ya tiene el mejor diseño posible' };
          j.reformas++; for (const m of j.miembros) if (m.tipo === 'dueno') m.afin = Math.max(0, m.afin - 12);
          e.politizacion = Math.max(0, e.politizacion - 8); e.sindicato = U.clamp(e.sindicato - 5, 0, 100);
          Ju.anotar(E, e, `Reforma de gobierno corporativo (${j.reformas}/3): más independientes y reglas de transparencia`);
          C.Medios.noticia(E, { tipo: 'regional', titular: `${e.nombre} adopta un código de buen gobierno y fortalece su junta`, tono: 1, jugador: true });
          return { ok: true, msg: `Reforma ${j.reformas}/3: sube la gobernanza, baja tu control sobre la junta` };
        } });
      A.registrar({ id: 'convocarJuntaExtraordinaria', nombre: 'Convocar una junta extraordinaria', icono: '🚨', grupo: 'local', costo: 1, disponible: gest,
        ejecutar(E, a) { const e = emp(E, a), j = Ju.asegurar(E, e); if (E.fecha.t - j.ult < 6) return { ok: false, msg: 'La junta acaba de reunirse' }; j.ult = E.fecha.t; Ju.reunion(E, e, j); return { ok: true, msg: 'La junta se reúne de urgencia: revisa los resultados y la estrategia' }; } });
    }
  };
  const Em = () => C.Empresas;
  C.Junta = Ju;
  C.Tiempo.registrar('junta', Ju, 54);
  Ju.registrarAcciones();
})(window.CURUL);
