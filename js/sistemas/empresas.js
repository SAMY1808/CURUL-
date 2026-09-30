/* Empresas públicas: las que ya existen en el país (EPM, Emcali, el Acueducto de Bogotá, la empresa
   petrolera nacional…) y las que un alcalde o gobernador puede crear. Cada una tiene un gerente —técnico,
   político, aliado o headhunter— que marca su eficiencia y su integridad; una política de tarifas; un
   sindicato que puede irse a paro; una deuda; y metas específicas o amplias con plazo. Rinden dividendos a
   su dueño (el fondo del municipio o departamento, o las cuentas nacionales), mueven la cobertura de servicios
   y el descontento de la gente, y pueden capitalizarse, endeudarse o venderse (privatizarse). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const SECTORES = {
    energia: { n: 'Energía y servicios públicos', icono: '⚡', costo: 0.6, indice: 'infraestructura' },
    agua: { n: 'Acueducto y alcantarillado', icono: '💧', costo: 0.35, indice: 'salud' },
    aseo: { n: 'Aseo y residuos', icono: '♻', costo: 0.15, indice: 'salud' },
    telecom: { n: 'Telecomunicaciones', icono: '📡', costo: 0.4, indice: 'infraestructura' },
    transporte: { n: 'Transporte masivo', icono: '🚇', costo: 0.5, indice: 'infraestructura' },
    salud: { n: 'Red hospitalaria pública', icono: '🏥', costo: 0.3, indice: 'salud' },
    petroleo: { n: 'Petróleo y gas', icono: '🛢', costo: 2, indice: null }
  };
  const TARIFAS = { subsidiada: { n: 'Subsidiada (tarifas bajas)', idx: 85 }, tecnica: { n: 'Técnica (costos reales)', idx: 100 }, alta: { n: 'Alta (maximiza ingresos)', idx: 118 } };
  const GERENTES = {
    tecnico: { n: 'Técnico de carrera', gestion: [62, 86], integridad: [65, 90], pol: -0.08 },
    politico: { n: 'Político de confianza', gestion: [30, 62], integridad: [30, 60], pol: 0.1 },
    aliado: { n: 'Aliado de un donante', gestion: [35, 65], integridad: [20, 50], pol: 0.14 },
    externo: { n: 'Gerente externo (headhunter)', gestion: [72, 92], integridad: [60, 85], pol: -0.05 }
  };
  const METAS = {
    cobertura: { n: 'Cobertura ≥ 95 %', check: e => e.cobertura >= 95, txt: 'ampliar la cobertura a casi todos' },
    rentabilidad: { n: 'Rentabilidad ≥ 8 %', check: e => e.rentabilidad >= 8, txt: 'dar utilidades altas al dueño' },
    calidad: { n: 'Calidad del servicio ≥ 80', check: e => e.calidad >= 80, txt: 'mejorar la calidad' },
    deuda: { n: 'Deuda por debajo del 15 % del capital', check: e => e.deuda / e.capital <= 0.15, txt: 'sanear las finanzas' },
    tarifas: { n: 'Congelar las tarifas', check: (e, m) => !e.subioTarifa, txt: 'no subir tarifas en el periodo' },
    expansion: { n: 'Duplicar el capital', check: (e, m) => e.capital >= m.ini * 2, txt: 'crecer y expandirse', amplia: true }
  };
  const INICIALES = [
    { d: 'ANT', o: 'alcaldia', n: 'Empresas Públicas de Medellín (EPM)', s: 'energia', cap: 9, cob: 97, cal: 80, gest: 78, integ: 70, deuda: 1.1, sind: 40 },
    { d: 'VAL', o: 'alcaldia', n: 'Emcali', s: 'energia', cap: 2.4, cob: 91, cal: 55, gest: 48, integ: 45, deuda: 1.4, sind: 70 },
    { d: 'BOG', o: 'alcaldia', n: 'Empresa de Acueducto de Bogotá', s: 'agua', cap: 3.2, cob: 96, cal: 74, gest: 66, integ: 62, deuda: 0.6, sind: 45 },
    { d: 'BOG', o: 'alcaldia', n: 'Empresa de Energía de Bogotá', s: 'energia', cap: 5.5, cob: 95, cal: 76, gest: 74, integ: 68, deuda: 1.0, sind: 35 },
    { d: 'BOG', o: 'alcaldia', n: 'Empresa de Telecomunicaciones de Bogotá', s: 'telecom', cap: 1.6, cob: 70, cal: 60, gest: 55, integ: 55, deuda: 0.8, sind: 55 },
    { d: 'ATL', o: 'alcaldia', n: 'Acueducto y Aseo de Barranquilla', s: 'agua', cap: 1.3, cob: 93, cal: 66, gest: 62, integ: 55, deuda: 0.3, sind: 40 },
    { d: 'BOL', o: 'alcaldia', n: 'Aguas de Cartagena', s: 'agua', cap: 0.9, cob: 88, cal: 58, gest: 55, integ: 50, deuda: 0.25, sind: 45 },
    { d: 'SAN', o: 'alcaldia', n: 'Empresa de Acueducto de Bucaramanga', s: 'agua', cap: 0.8, cob: 95, cal: 72, gest: 68, integ: 65, deuda: 0.1, sind: 30 },
    { d: 'RIS', o: 'alcaldia', n: 'Aguas y Aguas de Pereira', s: 'agua', cap: 0.5, cob: 94, cal: 76, gest: 70, integ: 70, deuda: 0.05, sind: 30 },
    { d: 'NAC', o: 'nacion', n: 'Empresa Nacional de Petróleos', s: 'petroleo', cap: 60, cob: 100, cal: 72, gest: 66, integ: 55, deuda: 12, sind: 50 },
    { d: 'NAC', o: 'nacion', n: 'Interconexión Eléctrica Nacional', s: 'energia', cap: 14, cob: 98, cal: 78, gest: 72, integ: 66, deuda: 2.5, sind: 35 }
  ];
  const NOMBRES_NUEVAS = { energia: 'Empresa de Energía', agua: 'Empresa de Acueducto', aseo: 'Empresa de Aseo', telecom: 'Empresa de Telecomunicaciones', transporte: 'Empresa de Transporte Masivo', salud: 'Red de Hospitales', petroleo: 'Empresa de Hidrocarburos' };

  const Em = {
    SECTORES, TARIFAS, GERENTES, METAS,
    asegurar(E) {
      if (E.empresas && E.empresas.lista) return E.empresas;
      E.empresas = { lista: [], historial: [] };
      for (const x of INICIALES) if (x.d === 'NAC' || E.deptos[x.d]) E.empresas.lista.push(Em.crear(E, { depto: x.d, organo: x.o, nombre: x.n, sector: x.s, capital: x.cap, cobertura: x.cob, calidad: x.cal, gestion: x.gest, integridad: x.integ, deuda: x.deuda, sindicato: x.sind }));
      return E.empresas;
    },
    init(E) { E.empresas = null; Em.asegurar(E); },
    migrar(E) { Em.asegurar(E); },
    crear(E, o) {
      const g = Em.gerente(E, o.tecnico === false ? 'politico' : 'tecnico', o.gestion, o.integridad);
      return { id: U.id('emp'), nombre: o.nombre, sector: o.sector, depto: o.depto, organo: o.organo, nivel: o.organo === 'nacion' ? 'nacional' : o.organo === 'gobernacion' ? 'departamental' : 'municipal',
        capital: o.capital, cobertura: o.cobertura, calidad: o.calidad, eficiencia: o.gestion || 60, rentabilidad: 5, deuda: o.deuda, sindicato: o.sindicato, politizacion: 25, tarifa: 'tecnica', subioTarifa: false,
        gerente: g, meta: null, dividendos: 0, vendido: 0, hist: [], estado: 'operando', fundada: E.fecha.t, paro: null };
    },
    gerente(E, tipo, gestion, integridad) {
      const t = GERENTES[tipo] || GERENTES.tecnico, h = U.chance(0.5);
      return { tipo, nombre: `${U.pick(h ? C.DATA.nombres.h : C.DATA.nombres.m)} ${U.pick(C.DATA.nombres.a)} ${U.pick(C.DATA.nombres.a)}`, gestion: Math.round(gestion || U.ri(t.gestion[0], t.gestion[1])), integridad: Math.round(integridad || U.ri(t.integridad[0], t.integridad[1])), desde: E.fecha.t };
    },
    ownerLabel(E, e) { if (e.nivel === 'nacional') return 'Nación'; const d = E.deptos[e.depto]; return e.nivel === 'departamental' ? 'Gobernación de ' + d.nombre : 'Alcaldía de ' + d.capital; },
    esMia(E, e) { const J = E.jugador; return e.nivel === 'nacional' ? E.gobierno.presidente === 'J' : e.nivel === 'municipal' ? J.cargo === 'alcalde' && J.cargoInfo.depto === e.depto : J.cargo === 'gobernador' && J.cargoInfo.depto === e.depto; },
    gobLocal(E, e) { const d = E.deptos[e.depto]; return d && d.gobLocal && d.gobLocal[e.organo]; },

    turno(E) {
      const q = Em.asegurar(E), petro = E.mundoEco ? E.mundoEco.petroleo : 100;
      for (const e of q.lista) {
        if (e.estado === 'liquidada') continue;
        const g = e.gerente, t = GERENTES[g.tipo] || GERENTES.tecnico;
        e.politizacion = U.clamp(e.politizacion + t.pol * 0.4 - (g.tipo === 'tecnico' || g.tipo === 'externo' ? 0.02 : 0), 0, 100);
        const efObj = U.clamp(35 + g.gestion * 0.55 - e.politizacion * 0.25 - Math.max(0, e.sindicato - 60) * 0.2 + (1 - e.deuda / Math.max(0.1, e.capital)) * 5, 15, 95);
        e.eficiencia += (efObj - e.eficiencia) * 0.02;
        e.cobertura = U.clamp(e.cobertura + (55 + e.eficiencia * 0.45 - e.cobertura) * 0.006, 20, 100);
        e.calidad = U.clamp(e.calidad + (30 + e.eficiencia * 0.7 - e.calidad) * 0.01, 15, 98);
        const ti = TARIFAS[e.tarifa].idx;
        e.rentabilidad = U.clamp(4 + (ti - 100) * 0.16 + (e.eficiencia - 55) * 0.14 - (e.deuda / Math.max(0.1, e.capital)) * 4 - e.politizacion * 0.03 + (e.sector === 'petroleo' ? (petro - 100) * 0.09 : 0) + U.gauss(0, 0.2), -12, 30);
        e.sindicato = U.clamp(e.sindicato + (50 - e.sindicato) * 0.004 + (ti > 105 ? 0.02 : 0) + U.gauss(0, 0.3), 0, 100);
        e.deuda = Math.max(0, e.deuda * (e.rentabilidad < 0 ? 1.0008 : 0.9995));
        // Efecto en la gente del dueño
        const d = E.deptos[e.depto], idx = SECTORES[e.sector].indice;
        if (d && idx) d[idx] = U.clamp(d[idx] + (e.cobertura - 75) / 75 * 0.004 + (e.calidad - 60) / 60 * 0.003, 1, 99);
        if (d) { d.ajusteAprob = U.clamp((d.ajusteAprob || 0) + (e.calidad - 60) * 0.0004 - (ti - 100) * 0.0009, -30, 30); const gl = Em.gobLocal(E, e); if (gl && gl.civico) gl.civico.descontento = U.clamp(gl.civico.descontento + (ti - 100) * 0.006 - (e.calidad - 60) * 0.002, 0, 100); }
        if (E.fecha.t % 13 === 0) { e.hist.push([E.fecha.t, e.rentabilidad, e.cobertura, e.calidad]); if (e.hist.length > 40) e.hist.shift(); }
        if (E.fecha.t % 26 === 0) Em.dividendo(E, e);
        if (!E.meta.presim) {
          if (U.chance(0.0012 * (100 - g.integridad) / 50 * (e.politizacion / 50 + 0.3))) Em.escandalo(E, e);
          if (e.sindicato > 78 && !e.paro && U.chance(0.02)) Em.paroSindical(E, e);
          if (e.paro) { e.paro.sem--; e.calidad = U.clamp(e.calidad - 0.4, 15, 98); if (e.paro.sem <= 0) { e.paro = null; e.sindicato = Math.max(30, e.sindicato - 18); C.Medios.noticia(E, { tipo: 'regional', titular: `Termina el paro en ${e.nombre}`, tono: 1 }); } }
          Em.evaluarMeta(E, e);
          if (!Em.esMia(E, e) && E.fecha.t % 52 === 0 && U.chance(0.12)) Em.rotarGerente(E, e);
          if (!Em.esMia(E, e) && E.fecha.t % 104 === 0 && U.chance(0.3)) Em.noticiaResultados(E, e);
        }
      }
    },
    dividendo(E, e) {
      const div = Math.max(0, e.rentabilidad) / 100 * e.capital * 0.5 * (1 - e.vendido / 100) * (e.paro ? 0.5 : 1); if (div <= 0) return;
      e.dividendos += div;
      if (e.nivel === 'nacional') C.Economia.aplicarDelta(E, 'deficit', -div * 0.05);
      else { const gl = Em.gobLocal(E, e); if (gl) gl.fondoRegalias = (gl.fondoRegalias || 0) + div; }
    },
    escandalo(E, e) {
      const g = e.gerente, mia = Em.esMia(E, e);
      e.politizacion = Math.min(100, e.politizacion + 6); e.calidad = U.clamp(e.calidad - 2, 15, 98);
      C.Medios.noticia(E, { tipo: 'escandalo', titular: `Escándalo en ${e.nombre}: investigan a su gerente ${g.nombre} por contratos irregulares`, tono: -1, importante: mia, jugador: mia });
      E.opinion.escandalos = (E.opinion.escandalos || 0) + (e.nivel === 'nacional' ? 0.6 : 0.2);
      if (mia) { C.Crisis.escandalo(E, { titulo: `Escándalo en ${e.nombre}`, texto: `La Fiscalía investiga contratos de la empresa que tú controlas. El gerente, ${g.nombre}, fue tu nombramiento.`, grav: g.tipo === 'aliado' ? 3 : 2 }); E.jugador.riesgoJudicial = U.clamp((E.jugador.riesgoJudicial || 0) + 4, 0, 100); }
    },
    paroSindical(E, e) {
      e.paro = { sem: U.ri(4, 10) }; const mia = Em.esMia(E, e);
      C.Medios.noticia(E, { tipo: 'regional', titular: `Paro sindical en ${e.nombre}: el servicio se afecta`, tono: -1, importante: mia, jugador: mia });
      if (mia) C.Eventos.disparar(E, C.Eventos.plantilla('paroEmpresa'), { emp: e.id, vars: { empresa: e.nombre } });
    },
    rotarGerente(E, e) { const t = U.pick(['tecnico', 'politico', 'politico', 'externo']); e.gerente = Em.gerente(E, t); C.Medios.noticia(E, { tipo: 'regional', titular: `${e.gerente.nombre} es el nuevo gerente de ${e.nombre}`, tono: 0 }); },
    noticiaResultados(E, e) { C.Medios.noticia(E, { tipo: 'regional', titular: `${e.nombre} ${e.rentabilidad > 6 ? 'reporta utilidades récord' : e.rentabilidad < 0 ? 'cierra el año en pérdidas' : 'presenta sus resultados'}`, tono: e.rentabilidad > 6 ? 1 : e.rentabilidad < 0 ? -1 : 0 }); },
    evaluarMeta(E, e) {
      const m = e.meta; if (!m) return;
      const def = METAS[m.tipo], ok = def.check(e, m);
      if (ok || E.fecha.t >= m.hasta) {
        const mia = Em.esMia(E, e); e.meta = null;
        C.Medios.noticia(E, { tipo: 'regional', titular: `${e.nombre} ${ok ? 'cumple' : 'no cumple'} la meta: ${def.n.toLowerCase()}`, tono: ok ? 1 : -1, importante: mia, jugador: mia });
        if (ok) { e.gerente.gestion = Math.min(98, e.gerente.gestion + 2); if (mia) { C.Opinion.subirRec(E, 1); E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia + 2, 0, 100); } }
        else if (mia && E.jugador.rep) E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia - 1, 0, 100);
        e.metaHist = (e.metaHist || []); e.metaHist.unshift({ t: E.fecha.t, tipo: m.tipo, ok }); if (e.metaHist.length > 6) e.metaHist.pop();
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      const emp = (E, a) => Em.asegurar(E).lista.find(x => x.id === a.emp);
      const gest = (E, a) => { const e = emp(E, a); if (!e) return 'Elige la empresa'; return Em.esMia(E, e) ? true : 'No diriges al dueño de esta empresa (' + Em.ownerLabel(E, e) + ')'; };
      A.registrar({ id: 'crearEmpresaPublica', nombre: 'Crear una empresa pública', icono: '🏭', grupo: 'local', costo: 3,
        disponible(E) { const c = E.jugador.cargo; return c === 'alcalde' || c === 'gobernador' ? true : 'Sólo alcaldes y gobernadores crean empresas públicas locales'; },
        ejecutar(E, a) {
          const J = E.jugador, s = SECTORES[a.sector]; if (!s || a.sector === 'petroleo') return { ok: false, msg: 'Elige el sector' };
          const organo = J.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia', depto = J.cargoInfo.depto, q = Em.asegurar(E);
          if (q.lista.some(x => x.sector === a.sector && x.depto === depto && x.organo === organo && x.estado !== 'liquidada')) return { ok: false, msg: 'Ya existe una empresa pública de ese sector' };
          const gl = C.GobiernoLocal.asegurar(E, depto, organo), cap = +(s.costo * C.GobiernoLocal.presupuestoTotal(E, depto, organo) / 20).toFixed(2), capital = Math.max(0.1, cap);
          if ((gl.fondoRegalias || 0) < capital) return { ok: false, msg: `El fondo no alcanza: se necesitan ${U.d1(capital)} billones de capital inicial` };
          const v = C.Corporaciones.votar(E, depto, organo, 'Crear la ' + NOMBRES_NUEVAS[a.sector].toLowerCase(), 'J');
          if (!v.aprobado) return { ok: false, msg: `La ${organo === 'gobernacion' ? 'Asamblea' : 'Concejo'} la niega (${v.si}-${v.no})`, exito: false };
          gl.fondoRegalias -= capital;
          const lugar = organo === 'gobernacion' ? E.deptos[depto].nombre : E.deptos[depto].capital;
          const nueva = Em.crear(E, { depto, organo, nombre: `${NOMBRES_NUEVAS[a.sector]} de ${lugar}`, sector: a.sector, capital, cobertura: 35, calidad: 55, gestion: 60, integridad: 60, deuda: 0, sindicato: 25 });
          q.lista.push(nueva); C.Medios.noticia(E, { tipo: 'regional', titular: `Nace ${nueva.nombre}: ${J.nombre} cumple su promesa de una empresa pública`, tono: 1, jugador: true, importante: true });
          return { ok: true, msg: `Nace ${nueva.nombre} con ${U.d1(capital)} billones de capital (${v.si}-${v.no} en la corporación)` };
        } });
      A.registrar({ id: 'nombrarGerente', nombre: 'Nombrar gerente', icono: '👔', grupo: 'local', costo: 1, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), t = GERENTES[a.tipo]; if (!t) return { ok: false, msg: 'Elige el tipo de gerente' };
          const J = E.jugador;
          if (a.tipo === 'externo') { if (J.patrimonio < 20) return { ok: false, msg: `El headhunter cuesta ${U.cop(20)}` }; J.patrimonio -= 20; }
          const g = Em.gerente(E, a.tipo); e.gerente = g; e.sindicato = U.clamp(e.sindicato + (a.tipo === 'politico' || a.tipo === 'aliado' ? 3 : 0), 0, 100);
          if (a.tipo === 'politico') { const pa = E.partidos[J.partido]; if (pa) pa.relJ = U.clamp(pa.relJ + 5, -100, 100); }
          if (a.tipo === 'aliado' && C.Licitacion) C.Licitacion.registrarDonante(E, 60, false);
          C.Medios.noticia(E, { tipo: 'regional', titular: `${g.nombre} es el nuevo gerente de ${e.nombre}${a.tipo === 'politico' || a.tipo === 'aliado' ? ': críticas por el nombramiento' : ''}`, tono: a.tipo === 'politico' || a.tipo === 'aliado' ? -1 : 0, jugador: true });
          return { ok: true, msg: `${g.nombre} (${t.n.toLowerCase()}, gestión ${g.gestion}, integridad ${g.integridad}) asume la gerencia` };
        } });
      A.registrar({ id: 'fijarMetaEmpresa', nombre: 'Fijar una meta', icono: '🎯', grupo: 'local', costo: 1, disponible: gest,
        ejecutar(E, a) { const e = emp(E, a), m = METAS[a.meta]; if (!m) return { ok: false, msg: 'Elige la meta' }; e.subioTarifa = false; e.meta = { tipo: a.meta, hasta: E.fecha.t + 104, ini: e.capital }; return { ok: true, msg: `Meta para ${e.nombre}: ${m.n.toLowerCase()} en dos años` }; } });
      A.registrar({ id: 'fijarTarifas', nombre: 'Fijar tarifas', icono: '🏷', grupo: 'local', costo: 1, disponible: gest,
        ejecutar(E, a) { const e = emp(E, a), t = TARIFAS[a.nivel]; if (!t) return { ok: false, msg: 'Elige la política de tarifas' }; if (t.idx > TARIFAS[e.tarifa].idx) e.subioTarifa = true; e.tarifa = a.nivel; return { ok: true, msg: `Tarifas ${t.n.toLowerCase()} en ${e.nombre}` }; } });
      A.registrar({ id: 'capitalizarEmpresa', nombre: 'Capitalizar la empresa', icono: '💉', grupo: 'local', costo: 1, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), monto = +(e.capital * 0.1).toFixed(2), gl = Em.gobLocal(E, e);
          if (e.nivel === 'nacional') { C.Economia.aplicarDelta(E, 'deficit', monto * 0.05); } else { if (!gl || (gl.fondoRegalias || 0) < monto) return { ok: false, msg: `El fondo no alcanza: se necesitan ${U.d1(monto)} billones` }; gl.fondoRegalias -= monto; }
          e.capital += monto; e.calidad = U.clamp(e.calidad + 4, 15, 98); e.cobertura = U.clamp(e.cobertura + 2, 20, 100); e.deuda = Math.max(0, e.deuda - monto * 0.3);
          return { ok: true, msg: `Capitalizas ${e.nombre} con ${U.d1(monto)} billones: mejora la calidad y la cobertura` };
        } });
      A.registrar({ id: 'venderParticipacion', nombre: 'Vender participación', icono: '💸', grupo: 'local', costo: 2, disponible: gest,
        ejecutar(E, a) {
          const e = emp(E, a), pct = +a.pct; if (![25, 49, 100].includes(pct)) return { ok: false, msg: 'Elige cuánto vendes' };
          if (e.vendido + pct > 100) return { ok: false, msg: 'No queda tanto por vender' };
          if (e.nivel !== 'nacional' && pct > 49 || e.nivel === 'nacional') { const v = e.nivel === 'nacional' ? { aprobado: U.chance(0.45), si: 0, no: 0 } : C.Corporaciones.votar(E, e.depto, e.organo, 'Vender ' + pct + ' % de ' + e.nombre, 'J'); if (!v.aprobado) return { ok: false, msg: e.nivel === 'nacional' ? 'El Congreso no autoriza la venta' : `La corporación niega la venta (${v.si}-${v.no})`, exito: false }; }
          const monto = +(e.capital * pct / 100 * U.rf(0.85, 1.25)).toFixed(2); e.vendido += pct;
          if (e.nivel === 'nacional') C.Economia.aplicarDelta(E, 'deficit', -monto * 0.08); else { const gl = Em.gobLocal(E, e); if (gl) gl.fondoRegalias = (gl.fondoRegalias || 0) + monto; }
          e.sindicato = U.clamp(e.sindicato + pct * 0.35, 0, 100); e.eficiencia = U.clamp(e.eficiencia + pct * 0.05, 0, 100);
          C.Medios.noticia(E, { tipo: 'regional', titular: `${E.jugador.nombre} vende ${pct} % de ${e.nombre} por ${U.d1(monto)} billones`, tono: pct === 100 ? -1 : 0, jugador: true, importante: true });
          if (e.vendido >= 100) e.estado = 'liquidada';
          return { ok: true, msg: `Vendes ${pct} % de ${e.nombre}: entran ${U.d1(monto)} billones, pero el sindicato se enfurece` };
        } });
      A.registrar({ id: 'atenderParoEmpresa', nombre: 'Atender el paro de la empresa', icono: '🤝', grupo: 'local', costo: 1, disponible: gest,
        ejecutar(E, a) { const e = emp(E, a); if (!e.paro) return { ok: false, msg: 'No hay paro' }; e.paro = null; e.sindicato = Math.max(25, e.sindicato - 22); e.rentabilidad -= 0.8; return { ok: true, msg: 'Negocias con el sindicato: se levanta el paro y sube el costo laboral' }; } });
    }
  };
  C.Empresas = Em;
  C.Tiempo.registrar('empresas', Em, 53);
  Em.registrarAcciones();
})(window.CURUL);
