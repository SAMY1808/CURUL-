/* Acciones de campaña electoral del jugador. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, El = C.Elecciones;
  const A = C.Acciones;
  const enCampana = E => E.elecciones.campana ? true : 'No tienes una campaña activa';
  const f = E => (E.elecciones.campana.equipo.estratega ? 1.3 : 1);

  A.registrar({ id: 'inscribir', nombre: 'Inscribir candidatura', icono: '🗳', grupo: 'campana', costo: 1,
    disponible(E, a) {
      const J = E.jugador;
      if (E.elecciones.campana) return 'Ya tienes una campaña en curso';
      const tipo = El.tipoEleccion(a.cargo); if (!tipo) return 'Cargo no válido';
      const ev = El.proxima(E, tipo); if (!ev) return 'No hay elecciones próximas';
      const sem = El.semanasPara(E, ev);
      if (sem > 52) return `Las inscripciones abren un año antes de la elección (faltan ${sem} semanas)`;
      if (sem < 6) return 'Las inscripciones ya cerraron';
      if ((a.cargo === 'gobernacion' || a.cargo === 'alcaldia') && ev.anio < 1991) return `Antes de 1991 no había voto popular para ese cargo: lo designaba ${a.cargo === 'gobernacion' ? 'el Presidente' : 'el gobernador'}`;
      const edadMinPres = E.constitucion ? C.Constitucion.valor(E, 'edadMinimaPresidencia') : 30;
      if (a.cargo === 'presidencia' && U.anio() - J.nac < edadMinPres) return `Se requieren ${edadMinPres} años para ser presidente`;
      if (a.cargo === 'senado' && U.anio() - J.nac < 30) return 'Se requieren 30 años para ser senador';
      if (a.cargo === 'presidencia' && J.reconocimiento < 30) return 'Necesitas al menos 30 de reconocimiento nacional';
      if (a.cargo === 'presidencia' && J.cargo === 'presidente' && !C.Gobierno.puedeReelegirseInmediato(E)) {
        return U.anio() >= 2005 && U.anio() < 2015 ? 'Ya usaste tu reelección inmediata: no puedes ir por un tercer período consecutivo' : 'La Constitución no permite la reelección presidencial inmediata en esta época';
      }
      if (a.via !== 'firmas' && !E.partidos[J.partido]) return 'Sin partido: inscríbete por firmas';
      if (a.via !== 'firmas' && J.avalNegado && J.avalNegado.partido === J.partido && E.fecha.t - J.avalNegado.t < 8) return `Tu partido te negó el aval hace poco: podrás insistir en ${8 - (E.fecha.t - J.avalNegado.t)} semanas (o ve por firmas)`;
      if (a.via === 'coalicion' && !C.Coaliciones.aliados(E, a.cargo, a.depto || null).length) return 'Ningún partido se ha aliado todavía para esta elección';
      return true;
    },
    ejecutar(E, a) {
      const J = E.jugador;
      if (a.via === 'coalicion') {
        const r = C.Coaliciones.consulta(E, a.cargo, a.depto || null);
        E.elecciones.consultaPendiente = r;
        if (!r.gana) {
          C.Coaliciones.limpiar(E, a.cargo, a.depto || null);
          J.avalNegado = { partido: J.partido, t: E.fecha.t };
          return { ok: true, msg: 'Pierdes la consulta interpartidista: otro nombre de la coalición será el candidato', exito: false };
        }
        const res = El.inscribir(E, a.cargo, a.depto, 'coalicion');
        const cam = E.elecciones.campana;
        cam.coalicion = r.aliados;
        if (a.cargo === 'senado' || a.cargo === 'camara') {
          cam.cabezaLista = true;
          // Los aliados de una lista conjunta ya ganan curules propias por su cuota real de
          // votos (ver Elecciones.poolCoalicion); "apoyo en comisión" es además un gesto de
          // buena relación por ir en la misma lista.
          for (const c of cam.coalicion) if (c.ofrecimiento === 'comite' && E.partidos[c.partido]) E.partidos[c.partido].relJ = U.clamp((E.partidos[c.partido].relJ || 0) + 6, -100, 100);
        }
        C.Coaliciones.limpiar(E, a.cargo, a.depto || null);
        return res;
      }
      if (a.via === 'primaria') {
        const r = C.Partidos.primaria(E, a.cargo, a.depto || J.residencia);
        E.elecciones.primariaPendiente = r;
        if (!r.gana) {
          E.partidos[J.partido].relJ -= 2;
          J.avalNegado = { partido: J.partido, t: E.fecha.t };
          return { ok: true, msg: `Pierdes la consulta interna del ${E.partidos[J.partido].sigla}`, exito: false };
        }
        const res = El.inscribir(E, a.cargo, a.depto, 'primaria');
        const cam = E.elecciones.campana;
        cam.primariaGanada = true;
        if (a.cargo === 'senado' || a.cargo === 'camara') cam.cabezaLista = true;
        return res;
      }
      if (a.via !== 'firmas') {
        const p = C.Partidos.probAval(E, J.partido, a.cargo);
        if (!U.chance(p)) {
          E.partidos[J.partido].relJ -= 3;
          J.avalNegado = { partido: J.partido, t: E.fecha.t };
          return { ok: true, msg: `El ${E.partidos[J.partido].sigla} te niega el aval (probabilidad ${Math.round(p * 100)} %). Puedes intentar por firmas.`, exito: false };
        }
      }
      return El.inscribir(E, a.cargo, a.depto, a.via);
    } });

  A.registrar({ id: 'recaudar', nombre: 'Recaudar fondos', icono: '💰', grupo: 'campana', costo: 1, disponible: enCampana,
    ejecutar(E) {
      const cam = E.elecciones.campana, J = E.jugador;
      const monto = Math.round((10 + J.redes * 6 + J.reconocimiento * 1.2) * f(E) * (cam.cargo === 'presidencia' ? 8 : cam.cargo === 'senado' || cam.cargo === 'gobernacion' ? 2.5 : 1) * U.rf(0.7, 1.3));
      const cabe = Math.max(0, cam.tope - cam.recaudado);
      const real = Math.min(monto, cabe);
      cam.recaudado += real; cam.caja += real;
      return { ok: true, msg: real < monto ? `Recaudas ${U.cop(real)}: alcanzaste el tope legal de gastos` : `Recaudas ${U.cop(real)} entre donantes` };
    } });

  /* Financiación irregular: dinero por fuera del tope legal (contratistas, testaferros, dineros
     no declarados). Da caja sin límite del tope, pero deja un rastro que alimenta el riesgo de
     una investigación de la Fiscalía o la Procuraduría más adelante (ver sistema judicial). */
  A.registrar({ id: 'financiacionIrregular', nombre: 'Financiación irregular', icono: '🕵', grupo: 'campana', costo: 1, disponible: enCampana,
    ejecutar(E) {
      const cam = E.elecciones.campana, J = E.jugador;
      const monto = Math.round((25 + J.redes * 10) * f(E) * (cam.cargo === 'presidencia' ? 8 : cam.cargo === 'senado' || cam.cargo === 'gobernacion' ? 2.5 : 1) * U.rf(0.8, 1.4));
      cam.caja += monto; cam.irregular = (cam.irregular || 0) + monto;
      J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + U.rf(3, 6) * (C.Constitucion.valor(E, 'financiacionCampanas') === 'publica' ? 1.6 : 1), 0, 100);
      E.opinion.corrupcionAcum = (E.opinion.corrupcionAcum || 0) + 0.4;
      J.rep.transparencia = U.clamp(J.rep.transparencia - U.rf(1, 3), 0, 100);
      return { ok: true, msg: `Consigues ${U.cop(monto)} por fuera del tope legal, sin dejar factura` };
    } });

  A.registrar({ id: 'contratar', nombre: 'Contratar equipo', icono: '👔', grupo: 'campana', costo: 0, disponible: enCampana,
    ejecutar(E, a) {
      const cam = E.elecciones.campana;
      if (!El.EQUIPO[a.rol]) return { ok: false, msg: 'Rol inválido' };
      cam.equipo[a.rol] = !cam.equipo[a.rol];
      return { ok: true, msg: (cam.equipo[a.rol] ? 'Contratas: ' : 'Prescindes de: ') + El.EQUIPO[a.rol].n };
    } });

  A.registrar({ id: 'mitin', nombre: 'Organizar evento público', icono: '🎪', grupo: 'campana', costo: 1,
    disponible: (E, a) => enCampana(E) === true ? (E.elecciones.campana.caja >= 8 ? (E.deptos[a.depto] ? true : 'Elige dónde') : 'Sin caja: necesitas $8 millones') : enCampana(E),
    ejecutar(E, a) {
      const cam = E.elecciones.campana, J = E.jugador;
      cam.caja -= 8; cam.gastado += 8;
      const exito = U.gauss(J.atributos.carisma / 20, 1.3);
      C.Opinion.moverImagen(E, { rec: { [a.depto]: 5 * f(E) }, dep: { [a.depto]: U.clamp(exito, -1, 4) * f(E) } });
      cam.voluntarios += Math.round(40 * f(E)); cam.estructura = U.clamp(cam.estructura + 1, 0, 100);
      cam.actividades.push({ t: E.fecha.t, tipo: 'evento', depto: a.depto });
      return { ok: true, msg: exito > 3 ? 'Plaza llena: el evento es un éxito' : exito > 1.5 ? 'Buena asistencia' : 'Asistencia discreta' };
    } });

  A.registrar({ id: 'publicidad', nombre: 'Pauta publicitaria', icono: '📺', grupo: 'campana', costo: 1,
    disponible(E, a) {
      if (enCampana(E) !== true) return enCampana(E);
      const costo = { tv: 60, radio: 20, digital: 12 }[a.canal];
      if (!costo) return 'Elige un canal';
      return E.elecciones.campana.caja >= costo ? true : 'Sin caja suficiente (' + U.cop(costo) + ')';
    },
    ejecutar(E, a) {
      const cam = E.elecciones.campana, J = E.jugador;
      const c = { tv: [60, 4, null], radio: [20, 1.8, { rural: 2, mayores: 1 }], digital: [12, 1.2, { jovenes: 2.5, estudiantes: 2 }] }[a.canal];
      cam.caja -= c[0]; cam.gastado += c[0];
      C.Opinion.subirRec(E, c[1] * f(E));
      if (c[2]) C.Opinion.moverImagen(E, { seg: c[2] });
      cam.actividades.push({ t: E.fecha.t, tipo: 'publicidad', canal: a.canal });
      return { ok: true, msg: 'Pauta al aire: tu reconocimiento crece' };
    } });

  A.registrar({ id: 'debate', nombre: 'Participar en debate', icono: '⚔', grupo: 'campana', costo: 1,
    disponible(E) {
      const cam = E.elecciones.campana; if (!cam) return 'No tienes campaña activa';
      if (!['presidencia', 'gobernacion', 'alcaldia'].includes(cam.cargo)) return 'Los debates televisados son para cargos uninominales';
      const ult = cam.actividades.filter(x => x.tipo === 'debate').pop();
      if (ult && E.fecha.t - ult.t < 4) return 'El próximo debate es en ' + (4 - (E.fecha.t - ult.t)) + ' semanas';
      return true;
    },
    ejecutar(E) {
      const cam = E.elecciones.campana, J = E.jugador;
      const d = U.gauss((J.atributos.oratoria - 55) / 10 + (cam.equipo.estratega ? 1 : 0), 1.6);
      C.Opinion.subirRec(E, 3);
      C.Opinion.moverImagen(E, { seg: Object.fromEntries(Object.values(C.Opinion.SEGMENTOS).flat().map(s => [s[0], U.clamp(d, -3, 4)])) });
      cam.actividades.push({ t: E.fecha.t, tipo: 'debate', resultado: d });
      C.Medios.noticia(E, { tipo: 'campana', titular: d > 1 ? `Debate: ${J.nombre} gana el cara a cara según los analistas` : d < -1 ? `Debate: ${J.nombre} tropieza ante sus rivales` : `Debate sin ganador claro`, tono: d > 1 ? 1 : d < -1 ? -1 : 0, jugador: true });
      return { ok: true, msg: d > 1 ? 'Ganas el debate' : d < -1 ? 'Pierdes el debate' : 'Empate técnico en el debate' };
    } });

  A.registrar({ id: 'voluntarios', nombre: 'Movilizar voluntarios', icono: '🙋', grupo: 'campana', costo: 1, disponible: enCampana,
    ejecutar(E) {
      const cam = E.elecciones.campana;
      cam.voluntarios = Math.round(cam.voluntarios * 1.12 + 30);
      cam.estructura = U.clamp(cam.estructura + 2, 0, 100);
      if (cam.firmas != null && cam.firmas < 100) cam.firmas = Math.min(100, cam.firmas + 12);
      return { ok: true, msg: 'Tus voluntarios salen a las calles' + (cam.firmas != null && cam.firmas < 100 ? ' a recoger firmas' : '') };
    } });

  A.registrar({ id: 'encuestaPropia', nombre: 'Contratar encuesta', icono: '📊', grupo: 'campana', costo: 1,
    disponible: E => enCampana(E) === true ? (E.elecciones.campana.caja >= 15 ? true : 'Necesitas $15 millones') : enCampana(E),
    ejecutar(E) {
      const cam = E.elecciones.campana; cam.caja -= 15; cam.gastado += 15;
      const p = El.proyeccion(E, false);
      cam.encuestas.push({ t: E.fecha.t, ...p, propia: true });
      return { ok: true, msg: `Encuesta: intención ${U.d1(p.intencion)} % · probabilidad de ganar ${Math.round(p.prob * 100)} %` };
    } });

  A.registrar({ id: 'retirarCandidatura', nombre: 'Retirar candidatura', icono: '🏳', grupo: 'campana', costo: 0, disponible: enCampana,
    ejecutar(E) {
      const J = E.jugador, cam = E.elecciones.campana;
      C.Medios.noticia(E, { tipo: 'campana', titular: `${J.nombre} declina su aspiración a ${El.CARGOS_CAMPANA[cam.cargo]}`, tono: -1, jugador: true });
      J.patrimonio -= Math.max(0, cam.gastado - cam.recaudado) * 0.5;
      E.elecciones.campana = null;
      return { ok: true, msg: 'Campaña retirada' };
    } });
})(window.CURUL);
