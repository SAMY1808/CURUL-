/* Partidos: popularidad dinámica, facciones internas, disciplina, postura frente al gobierno, avales. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const ESTRUCTURA = { PLR: .85, PUS: .8, CN: .8, PCN: .75, AR: .55, FAP: .45, AVC: .3, NC: .3, LCI: .2, MFF: .6, CPP: .35, MIS: .6, IND: .2 };

  const Pa = {
    init(E) {
      for (const d of C.DATA.partidos) {
        E.partidos[d.id] = {
          id: d.id, nombre: d.nombre, sigla: d.sigla, color: d.color, lema: d.lema,
          eco: d.eco, soc: d.soc, popularidad: d.pop, popBase: d.pop, cohesion: d.cohesion,
          estructura: ESTRUCTURA[d.id] || .4, fuertes: d.fuertes, especial: !!d.especial,
          fundado: d.fundado || 0, futuro: !!(d.fundado && d.fundado > U.anio()),
          postura: 'independiente',            // gobierno | independiente | oposicion (Estatuto de Oposición)
          facciones: d.facciones.map((f, i) => ({ id: d.id + '-f' + i, nombre: f[0], eco: f[1], soc: f[2], peso: f[3], lider: null, relJ: 0 })),
          lider: null,
          militantes: Math.round((d.pop || 0.5) * U.rf(38000, 52000)),
          finanzas: Math.round((d.pop || 0.5) * U.rf(1800, 2600)),   // millones COP
          relJ: 0,
          hist: []
        };
      }
    },
    /* Tras generar a los políticos: líderes de partido y de facción */
    asignarLideres(E) {
      const pols = Object.values(E.politicos);
      for (const pa of Object.values(E.partidos)) {
        const miembros = pols.filter(p => p.partido === pa.id && p.activo && p.id !== 'J');
        if (!miembros.length) continue;
        const lider = miembros.slice().sort((a, b) => (b.r.car + b.r.exp + b.fuerza) - (a.r.car + a.r.exp + a.fuerza))[0];
        pa.lider = lider.id;
        for (const f of pa.facciones) {
          const mf = miembros.filter(p => p.faccion === f.id && p.id !== lider.id);
          const l = mf.sort((a, b) => (b.r.amb + b.r.car) - (a.r.amb + a.r.car))[0];
          f.lider = l ? l.id : lider.id;
        }
      }
    },
    miembros(E, pid, soloCongreso) {
      return Object.values(E.politicos).filter(p => p.partido === pid && p.activo && (!soloCongreso || (p.cargo && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante'))));
    },
    /* Disciplina efectiva de un congresista frente a la línea de bancada (0..1) */
    disciplina(E, p) {
      const pa = E.partidos[p.partido]; if (!pa) return 0.2;
      return U.clamp((pa.cohesion / 100) * 0.6 + (p.r.dis / 100) * 0.5 - 0.1, 0.05, 1);
    },
    /* Facción dominante */
    dominante(pa) { return pa.facciones.slice().sort((a, b) => b.peso - a.peso)[0]; },
    /* Peso interno de un miembro dentro de su partido: cuánto pesa su palabra frente a la
       dirección nacional y frente a la departamental. No se guarda aparte: se deriva del cargo
       que ocupa (o del más alto que ocupó), su carisma y experiencia, y —sólo para el jugador,
       de quien sí se sigue el trato con su partido— la relación con la dirección nacional.
       Determina qué tan buen renglón le da la dirección al armar listas cerradas y sirve de base
       a la fuerza con la que compite en una consulta interna (primaria). */
    peso(E, pol) {
      const esJ = pol.id === 'J', J = E.jugador;
      const cargo = esJ ? J.cargo : (pol.cargo && pol.cargo.tipo);
      const NIVEL = { presidente: 95, senador: 78, ministro: 70, gobernador: 62, representante: 55,
        alcalde: 48, diputado: 34, concejal: 28, asesor: 20, empresario: 16, periodista: 16,
        academico: 14, sindicalista: 14, ong: 12, activista: 10, lider: 8 };
      const base = NIVEL[cargo] != null ? NIVEL[cargo] : 8;
      const carisma = esJ ? J.atributos.carisma : pol.r.car;
      const experiencia = esJ ? (J.rep.experiencia || 20) : pol.r.exp;
      const pid = esJ ? J.partido : pol.partido, pa = E.partidos[pid];
      const relDireccion = esJ ? (pa ? pa.relJ : 0) : 0;
      const nac = U.clamp(base * 0.6 + carisma * 0.14 + experiencia * 0.14 + relDireccion * 0.35, 1, 100);
      const local = ['gobernador', 'alcalde', 'diputado', 'concejal'].includes(cargo);
      const dep = U.clamp(nac * (local ? 1.2 : 0.8) + (esJ ? (C.Opinion.recDepto(E, pol.depto || J.residencia) - 30) * 0.15 : 0), 1, 100);
      return { nac, dep };
    },
    /* Rivales de una consulta interna: el puñado de compañeros de partido que compiten por el
       mismo cupo (cabeza de lista en Senado/Cámara, candidatura única en los demás cargos). */
    rivalesPrimaria(E, cargo, depto) {
      const pid = E.jugador.partido, El = C.Elecciones;
      if (cargo === 'senado') return El.formarLista(E, pid, 'senado', null, 6).filter(p => p.id !== 'J').slice(0, 4);
      if (cargo === 'camara') return El.formarLista(E, pid, 'camara', depto, 5).filter(p => p.id !== 'J').slice(0, 4);
      const mismoLugar = p => cargo === 'presidencia' || p.depto === depto;
      const pool = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.partido === pid && mismoLugar(p)
        && p.cargo && ['gobernador', 'alcalde', 'diputado', 'concejal', 'senador', 'representante', 'aspirante'].includes(p.cargo.tipo));
      while (pool.length < 2) pool.push(C.Politicos.crear(E, { partido: pid, depto: cargo === 'presidencia' ? U.pesado(C.DATA.departamentos, d => d.poblacion).id : depto, cargo: { tipo: 'aspirante', aspira: cargo } }));
      return pool.slice(0, 3);
    },
    /* Consulta interna (primaria): el jugador se mide contra rivales de su propio partido. Pesa
       más quien más peso interno y arrastre electoral reúna, con su dosis de azar — no es una
       moneda al aire como el aval, es una noche de resultados propia. */
    primaria(E, cargo, depto) {
      const El = C.Elecciones, nivel = (cargo === 'senado' || cargo === 'presidencia') ? 'nac' : 'dep';
      const rivales = Pa.rivalesPrimaria(E, cargo, depto);
      const cand = [{ id: 'J', nombre: E.jugador.nombre, fuerza: El.fuerzaJugador(E, cargo === 'senado' || cargo === 'presidencia' ? null : depto) }]
        .concat(rivales.map(r => ({ id: r.id, nombre: r.nombre, fuerza: r.fuerza })));
      cand.forEach(c => c.peso = Pa.peso(E, c.id === 'J' ? E.politicos.J : E.politicos[c.id])[nivel]);
      const pesos = cand.map(c => Math.pow(c.peso * 0.6 + c.fuerza * 0.4 + 5, 1.5) * Math.exp(U.gauss(0, 0.28)));
      const tot = U.suma(pesos);
      cand.forEach((c, i) => c.pct = pesos[i] / tot * 100);
      cand.sort((a, b) => b.pct - a.pct);
      return { cargo, depto, candidatos: cand, gana: cand[0].id === 'J' };
    },
    /* Probabilidad de que el partido otorgue aval al jugador para un cargo */
    probAval(E, pid, cargo) {
      const pa = E.partidos[pid], J = E.jugador; if (!pa) return 0;
      const dom = Pa.dominante(pa);
      const afin = 1 - U.distIdeo(J.ideologia, pa);
      const nivel = { concejo: 0, asamblea: 0.05, alcaldia: 0.15, camara: 0.1, gobernacion: 0.25, senado: 0.2, presidencia: 0.45 }[cargo] || 0.1;
      let p = 0.25 + afin * 0.35 + (J.reconocimiento / 100) * 0.3 + (pa.relJ + dom.relJ) / 400 - nivel;
      if (J.partido === pid) p += 0.2;
      return U.clamp(p, 0.02, 0.97);
    },

    turno(E) {
      const gob = E.gobierno;
      const aprob = E.opinion.aprobacionPres || 45;
      const anio = U.anio();
      for (const pa of Object.values(E.partidos)) {
        if (pa.futuro && pa.fundado && pa.fundado <= anio) {
          pa.futuro = false;
          C.Medios.noticia(E, { tipo: 'partidos', titular: `Se funda el ${pa.nombre} («${pa.lema}»)`, tono: 0 });
        }
        if (pa.especial || pa.futuro) continue;
        // Reversión a su base histórica + efecto gobierno/oposición según aprobación
        let objetivo = pa.popBase;
        if (pa.id === gob.partido) objetivo += (aprob - 45) * 0.15;
        else if (pa.postura === 'gobierno') objetivo += (aprob - 45) * 0.05;
        else if (pa.postura === 'oposicion') objetivo -= (aprob - 45) * 0.08;
        pa.popularidad += (objetivo - pa.popularidad) * 0.02 + U.gauss(0, 0.08);
        pa.popularidad = U.clamp(pa.popularidad, 0.3, 45);
        // Las facciones ganan o pierden peso lentamente
        for (const f of pa.facciones) f.peso = U.clamp(f.peso + U.gauss(0, 0.3), 5, 90);
        if (pa.relJ) pa.relJ *= 0.997;
      }
      if (E.fecha.t % 4 === 0) for (const pa of Object.values(E.partidos)) if (!pa.especial && !pa.futuro) U.serie('pop:' + pa.id, pa.popularidad);
    }
  };

  C.Partidos = Pa;
  C.Tiempo.registrar('partidos', Pa, 30);
})(window.CURUL);
