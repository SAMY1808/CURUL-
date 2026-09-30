/* Órganos de control: la Fiscalía, la Procuraduría y la Contraloría. Cada titular tiene ideología,
   independencia y agresividad, un periodo de cuatro años y una elección propia: el Fiscal sale de una
   terna del Presidente que elige la Corte Suprema, el Procurador de ternas del Presidente y las altas
   cortes que elige el Senado, y el Contralor de las altas cortes ante el Congreso. Pesan así:
     · Fiscal: acelera o frena las investigaciones judiciales (la tuya incluida) y va tras los políticos
       lejanos a su orientación;
     · Procurador: abre procesos disciplinarios y destituye a alcaldes, gobernadores y congresistas;
     · Contralor: audita a gobernaciones y alcaldías y deja hallazgos fiscales.
   Si el Presidente propone la terna, puede hacer lobby por su candidato en el Senado. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const SEM = 4 * 52;
  const ORGANOS = {
    fiscal: { n: 'Fiscal General de la Nación', icono: '⚖', proponente: 'presidente', elige: 'la Corte Suprema', desc: 'Dirige las investigaciones penales. Un fiscal hostil acelera los casos contra ti; uno afín los frena.' },
    procurador: { n: 'Procurador General de la Nación', icono: '📋', proponente: 'estado', elige: 'el Senado', desc: 'Vigila a los funcionarios: puede destituir e inhabilitar a alcaldes, gobernadores y congresistas.' },
    contralor: { n: 'Contralor General de la República', icono: '🔎', proponente: 'suprema', elige: 'el Congreso en pleno', desc: 'Audita el gasto público: los hallazgos fiscales golpean a gobernaciones y alcaldías.' }
  };
  const PROP = { presidente: 'el Presidente', suprema: 'la Corte Suprema', estado: 'el Consejo de Estado' };

  const K = {
    ORGANOS, PROP,
    asegurar(E) { if (!E.control || !E.control.organos) K.init(E); return E.control; },
    init(E) {
      E.control = { organos: {}, historial: [] };
      let i = 0;
      for (const [id, o] of Object.entries(ORGANOS)) {
        const antig = U.ri(20, SEM - 30) + i++ * 20;
        E.control.organos[id] = { titular: K.nuevoTitular(E, o.proponente, E.fecha.t - antig, E.fecha.t - antig + SEM), vacante: null };
      }
    },
    migrar(E) { K.asegurar(E); },
    nuevoTitular(E, proponente, desde, hasta) {
      const m = C.Corte.generarCandidatos(E, proponente, 1)[0];
      return { id: m.id, nombre: m.nombre, eco: m.eco, soc: m.soc, indep: m.prestigio, agresiv: m.activismo, desde, hasta, proponente };
    },
    titular(E, id) { const o = K.asegurar(E).organos[id]; return o && o.titular; },

    /* Multiplicador de hostilidad del organo hacia una posición ideológica (1 = neutro). */
    hostilidad(E, id, ideo) {
      const t = K.titular(E, id); if (!t) return 1;
      const d = U.distIdeo(t, ideo);
      return U.clamp(1 + (d - 0.3) * 1.6 + (t.agresiv - 50) / 200 - (t.indep - 50) / 500, 0.5, 1.9);
    },
    hostilJ(E, id) { return K.hostilidad(E, id, E.jugador.ideologia); },

    turno(E) {
      const c = K.asegurar(E);
      for (const [id, o] of Object.entries(c.organos)) {
        if (o.titular && E.fecha.t >= o.titular.hasta) K.abrirVacante(E, id, o);
        const v = o.vacante;
        if (v) {
          if (v.estado === 'terna' && E.fecha.t >= v.limite) K.armarTerna(E, id, v);
          else if (v.estado === 'senado' && E.fecha.t >= v.vota) K.elegir(E, id, o, v);
        }
      }
      if (E.meta.presim) return;
      K.accionFiscal(E); K.accionProcurador(E); K.accionContralor(E); K.resolverDisciplinario(E);
    },
    abrirVacante(E, id, o) {
      const x = ORGANOS[id];
      o.vacante = { estado: 'terna', limite: E.fecha.t + 4, saliente: o.titular.nombre, proponente: x.proponente, terna: [], lobby: {} };
      o.titular = null;
      C.Medios.noticia(E, { tipo: 'judicial', titular: `Termina el periodo del ${x.n}: se abre la elección (terna de ${PROP[x.proponente]}, elige ${x.elige})`, tono: 0, importante: x.proponente === 'presidente' && E.gobierno.presidente === 'J', jugador: x.proponente === 'presidente' && E.gobierno.presidente === 'J' });
    },
    armarTerna(E, id, v) {
      const cs = C.Corte.generarCandidatos(E, v.proponente, 5).sort((a, b) => b.prestigio - a.prestigio).slice(0, 3);
      v.terna = cs.map(m => ({ id: m.id, nombre: m.nombre, eco: m.eco, soc: m.soc, indep: m.prestigio, agresiv: m.activismo }));
      v.estado = 'senado'; v.vota = E.fecha.t + 6;
    },
    apoyo(E, id, cand, v) {
      const base = id === 'fiscal' ? 1 - U.distIdeo(cand, C.Corte.mediana(E)) : C.Corte.apoyoSenado(E, cand);
      return base + (v.lobby[cand.id] || 0) + cand.indep / 400;
    },
    elegir(E, id, o, v) {
      const x = ORGANOS[id];
      const gana = v.terna.map(c => ({ c, s: K.apoyo(E, id, c, v) + U.gauss(0, 0.05) })).sort((a, b) => b.s - a.s)[0].c;
      o.titular = { id: gana.id, nombre: gana.nombre, eco: gana.eco, soc: gana.soc, indep: gana.indep, agresiv: gana.agresiv, desde: E.fecha.t, hasta: E.fecha.t + SEM, proponente: v.proponente };
      o.vacante = null;
      const esJ = v.proponente === 'presidente' && E.gobierno.presidente === 'J';
      C.Medios.noticia(E, { tipo: 'judicial', titular: `${x.elige[0].toUpperCase() + x.elige.slice(1)} elige a ${gana.nombre} como nuevo ${x.n}`, tono: 0, importante: esJ, jugador: esJ });
      K.anotar(E, `${gana.nombre} asume como ${x.n}`);
    },
    anotar(E, txt) { const c = K.asegurar(E); c.historial.unshift({ t: E.fecha.t, txt }); if (c.historial.length > 30) c.historial.pop(); },

    /* ── Lo que hacen los titulares ── */
    accionFiscal(E) {
      const f = K.titular(E, 'fiscal'); if (!f || !U.chance(0.0025 * (0.5 + f.agresiv / 100))) return;
      const cands = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && ['senador', 'representante', 'ministro', 'gobernador', 'alcalde'].includes(p.cargo.tipo));
      const p = U.pesado(cands, x => (U.distIdeo(x, f) + 0.1) * (110 - x.r.int) * (x.partido === E.gobierno.partido && f.proponente !== 'presidente' ? 1.3 : 1));
      if (!p) return;
      p.fuerza = U.clamp(p.fuerza - U.ri(4, 12), 5, 100);
      if (p.partido && E.partidos[p.partido]) E.partidos[p.partido].popularidad = U.clamp(E.partidos[p.partido].popularidad - U.rf(0.08, 0.3), 0.3, 45);
      E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.1;
      C.Politicos.anotar(p, 'La Fiscalía le imputa cargos');
      C.Medios.noticia(E, { tipo: 'judicial', titular: `La Fiscalía de ${f.nombre} imputa cargos a ${p.nombre}`, tono: -1, importante: p.cargo.tipo === 'ministro' });
      K.anotar(E, `La Fiscalía imputa cargos a ${p.nombre}`);
    },
    accionProcurador(E) {
      const pr = K.titular(E, 'procurador'); if (!pr || !U.chance(0.0016 * (0.5 + pr.agresiv / 100))) return;
      const J = E.jugador;
      // Puede ir contra el jugador si ocupa un cargo local, según la hostilidad que le tenga.
      if ((J.cargo === 'gobernador' || J.cargo === 'alcalde') && !E.control.disciplinario && U.chance(0.25 * K.hostilidad(E, 'procurador', J.ideologia) * (1 - J.rep.transparencia / 160))) {
        E.control.disciplinario = { t: E.fecha.t, cargo: J.cargo, depto: J.cargoInfo.depto, defensa: 0 };
        C.Medios.noticia(E, { tipo: 'judicial', titular: `La Procuraduría abre investigación disciplinaria contra ${J.nombre}, ${J.cargo === 'gobernador' ? 'gobernador' : 'alcalde'}`, tono: -1, importante: true, jugador: true });
        J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + 6, 0, 100); return;
      }
      const cands = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && ['senador', 'representante', 'gobernador', 'alcalde'].includes(p.cargo.tipo));
      const p = U.pesado(cands, x => (U.distIdeo(x, pr) + 0.1) * (110 - x.r.int));
      if (!p) return;
      const t = p.cargo.tipo, depto = p.cargo.depto;
      C.Politicos.anotar(p, 'Destituido e inhabilitado por la Procuraduría');
      if (t === 'senador' || t === 'representante') C.Gobierno.vacante(E, p);
      else if (depto && E.deptos[depto]) C.Elecciones.vacanteRegional(E, depto, t);
      p.cargo = null; p.activo = false;
      E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.15;
      C.Medios.noticia(E, { tipo: 'judicial', titular: `La Procuraduría de ${pr.nombre} destituye e inhabilita a ${p.nombre}${depto && E.deptos[depto] ? ' (' + (t === 'alcalde' ? E.deptos[depto].capital : E.deptos[depto].nombre) + ')' : ''}`, tono: -1, importante: true });
      K.anotar(E, `La Procuraduría destituye a ${p.nombre}`);
    },
    resolverDisciplinario(E) {
      const d = E.control.disciplinario, J = E.jugador; if (!d) return;
      if (J.cargo !== d.cargo) { E.control.disciplinario = null; return; }
      if (E.fecha.t - d.t < 26) return;
      E.control.disciplinario = null;
      const prob = U.clamp(0.14 * K.hostilidad(E, 'procurador', J.ideologia) + (1 - J.rep.transparencia / 100) * 0.2 - d.defensa * 0.1, 0.03, 0.7);
      if (U.chance(prob)) {
        C.Medios.noticia(E, { tipo: 'judicial', titular: `La Procuraduría destituye e inhabilita a ${J.nombre} por 10 años`, tono: -1, importante: true, jugador: true });
        C.Personaje.dejarCargo(E, 'Destituido por la Procuraduría'); C.Elecciones.vacanteRegional(E, d.depto, d.cargo);
        J.rep.honestidad = U.clamp(J.rep.honestidad - 10, 0, 100);
      } else {
        C.Medios.noticia(E, { tipo: 'judicial', titular: `La Procuraduría archiva la investigación disciplinaria contra ${J.nombre}`, tono: 1, importante: true, jugador: true });
        C.Opinion.subirRec(E, 1);
      }
    },
    accionContralor(E) {
      const c = K.titular(E, 'contralor'); if (!c || !U.chance(0.004 * (0.5 + c.agresiv / 100))) return;
      const J = E.jugador, ds = Object.values(E.deptos);
      const d = U.pesado(ds, x => 1 + Math.max(0, 60 - x.infraestructura) / 20);
      const gobJ = (J.cargo === 'gobernador' || J.cargo === 'alcalde') && J.cargoInfo.depto === d.id;
      d.ajusteAprob = U.clamp((d.ajusteAprob || 0) - U.rf(1, 2.5), -30, 30);
      const monto = U.ri(4, 90) * 10;
      C.Medios.noticia(E, { tipo: 'judicial', titular: `La Contraloría de ${c.nombre} encuentra un hallazgo fiscal de ${U.cop(monto)} en ${J.cargo === 'alcalde' && gobJ ? d.capital : d.nombre}`, tono: -1, importante: gobJ, jugador: gobJ });
      K.anotar(E, `Hallazgo fiscal en ${d.nombre}: ${U.cop(monto)}`);
      if (gobJ) {
        const g = C.GobiernoLocal.asegurar(E, d.id, J.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia');
        g.civico.descontento = U.clamp(g.civico.descontento + 7, 0, 100);
        J.rep.transparencia = U.clamp(J.rep.transparencia - 4, 0, 100); J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + 4 * K.hostilidad(E, 'contralor', J.ideologia), 0, 100);
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'apoyarCandidatoControl', nombre: 'Hacer lobby por el candidato', icono: '🗳', grupo: 'gobierno', costo: 1,
        disponible: E => E.gobierno.presidente === 'J' ? true : 'Sólo el Presidente hace lobby por las ternas',
        ejecutar(E, a) {
          const o = K.asegurar(E).organos[a.organo], v = o && o.vacante;
          if (!v || v.estado !== 'senado') return { ok: false, msg: 'Ese cargo no está en votación' };
          const c = v.terna.find(x => x.id === a.candidato); if (!c) return { ok: false, msg: 'Elige al candidato' };
          v.lobby[c.id] = (v.lobby[c.id] || 0) + 0.06;
          return { ok: true, msg: `Mueves votos por ${c.nombre} (apoyo ${Math.min(99, Math.round(K.apoyo(E, a.organo, c, v) * 100))} %)` };
        } });
      A.registrar({ id: 'defensaDisciplinaria', nombre: 'Contratar defensa disciplinaria', icono: '🛡', grupo: 'personal', costo: 1,
        disponible: E => E.control && E.control.disciplinario ? true : 'No tienes un proceso disciplinario abierto',
        ejecutar(E) { const d = E.control.disciplinario, J = E.jugador; if (J.patrimonio < 30) return { ok: false, msg: `Necesitas ${U.cop(30)}` }; J.patrimonio -= 30; d.defensa++; return { ok: true, msg: 'Contratas abogados especialistas: baja la probabilidad de destitución' }; } });
    }
  };
  C.Control = K;
  C.Tiempo.registrar('control', K, 68);
  K.registrarAcciones();
})(window.CURUL);
