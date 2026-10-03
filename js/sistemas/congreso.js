/* Congreso: Senado y Cámara, curules, bancadas, mesas directivas, comisiones y calendario de sesiones. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const CAMARAS = ['senado', 'camara'];

  const Co = {
    CAMARAS,
    nombreCamara: c => c === 'senado' ? 'Senado' : 'Cámara',
    delCamara: c => c === 'senado' ? 'del Senado' : 'de la Cámara',
    /* ¿El jugador preside esa cámara? Base de los poderes reales de la mesa directiva sobre el
       orden del día (adelantar/aplazar proyectos) y la negociación con el Ejecutivo. */
    esMesaDe(E, cam) { const K = E.congreso[cam]; return !!(K && K.mesa && K.mesa.presidente === 'J'); },
    nombreCirc(circ) {
      if (circ === 'NAC') return 'Nacional';
      const d = C.E.deptos[circ]; if (d) return d.nombre;
      const esp = [...C.DATA.camaras.senado.especiales, ...C.DATA.camaras.camara.especiales].find(e => e.id === circ);
      return esp ? esp.nombre : circ;
    },
    /* Periodos de sesiones ordinarias: 20 jul – 16 dic y 16 mar – 20 jun */
    enSesion(E) {
      if (C.Regimen && E.regimen && E.regimen.congreso === false) return false;
      if (E.presionLeg && E.presionLeg.extra && E.fecha.t < E.presionLeg.extra.hasta) return true;   // sesiones extraordinarias
      const d = U.hoy(), m = d.getUTCMonth(), dia = d.getUTCDate();
      if (m === 6) return dia >= 20;
      if (m >= 7 && m <= 10) return true;
      if (m === 11) return dia <= 16;
      if (m === 2) return dia >= 16;
      if (m === 3 || m === 4) return true;
      if (m === 5) return dia <= 20;
      return false;
    },
    periodo(E) {
      const d = U.hoy(), a = d.getUTCFullYear();
      const ini = d.getUTCMonth() > 6 || (d.getUTCMonth() === 6 && d.getUTCDate() >= 20) ? a : a - 1;
      return { legislatura: ini + '-' + (ini + 1), cuatrienio: E.congreso.cuatrienio };
    },
    miembros(E, cam) { return E.congreso[cam].curules.map(c => E.politicos[c.pol]).filter(Boolean); },
    mayoria(E, cam) { return Math.floor(E.congreso[cam].curules.length / 2) + 1; },
    log(E, tipo, txt, ref) {
      E.agendaMundo.unshift({ t: E.fecha.t, tipo, txt, ref: ref || null });
      if (E.agendaMundo.length > 250) E.agendaMundo.length = 250;
    },

    /* ── Instalación de un nuevo Congreso a partir de resultados electorales ── */
    instalar(E, res) {
      const cuatrienio = res.anio + '-' + (res.anio + 4);
      // Los congresistas salientes vuelven a ser aspirantes (o se retiran)
      for (const cam of CAMARAS) for (const c of (E.congreso[cam] ? E.congreso[cam].curules : [])) {
        const p = E.politicos[c.pol]; if (!p) continue;
        if (p.id === 'J') continue;
        C.Politicos.anotar(p, 'Termina su periodo como ' + (cam === 'senado' ? 'senador' : 'representante'));
        p.cargo = { tipo: 'aspirante', aspira: cam };
      }
      const J = E.jugador;
      const eraJ = J.cargo === 'senador' || J.cargo === 'representante';
      if (eraJ) C.Personaje.dejarCargo(E, 'Termina el periodo legislativo');
      const armar = (cam, lista) => lista.map((e, i) => ({ id: (cam === 'senado' ? 'S' : 'C') + (i + 1), pol: e.pol, circ: e.circ, partido: e.partido, votos: e.votos }));
      const sen = [...res.senado.electos];
      const camL = [];
      for (const pd of Object.values(res.camara.porDepto)) camL.push(...pd.electos);
      camL.push(...res.camara.especiales);
      // Estatuto de Oposición: 2º en la presidencial y su fórmula
      const segundo = E.gobierno.electo && E.gobierno.electo.segundo;
      if (segundo) {
        sen.push({ pol: segundo.pol, circ: 'OPO-SEN', partido: segundo.partido, votos: segundo.votos });
        const formula = C.Politicos.crear(E, { partido: segundo.partido === 'MOV' ? (J.partido || 'IND') : segundo.partido, depto: 'BOG' });
        camL.push({ pol: formula.id, circ: 'OPO-CAM', partido: formula.partido, votos: segundo.votos });
      }
      E.congreso = Object.assign(E.congreso, {
        cuatrienio, electos: null,
        senado: { curules: armar('senado', sen), mesa: {}, comisiones: {}, bancadas: {} },
        camara: { curules: armar('camara', camL), mesa: {}, comisiones: {}, bancadas: {} }
      });
      for (const cam of CAMARAS) for (const c of E.congreso[cam].curules) {
        const p = E.politicos[c.pol]; if (!p) continue;
        if (p.id === 'J') { C.Personaje.asumirCargo(E, cam === 'senado' ? 'senador' : 'representante', { circ: c.circ, curul: c.id }); continue; }
        if (c.partido && c.partido !== 'MOV') p.partido = c.partido;
        const antes = p.cargo && p.cargo.tipo;
        p.cargo = { tipo: cam === 'senado' ? 'senador' : 'representante', camara: cam, circ: c.circ, curul: c.id };
        p.aspiraOtro = null;
        C.Politicos.anotar(p, 'Elegido ' + (cam === 'senado' ? 'senador' : 'representante') + ' ' + cuatrienio + (antes === p.cargo.tipo ? ' (reelegido)' : ''));
      }
      for (const cam of CAMARAS) { Co.organizarComisiones(E, cam); Co.bancadas(E, cam); }
      Co.elegirMesas(E);
      Co.log(E, 'instalacion', 'Se instala el Congreso ' + cuatrienio);
      C.Bus.emit('congreso:instalado', cuatrienio);
    },

    /* Reparte a los congresistas en las siete comisiones constitucionales */
    organizarComisiones(E, cam) {
      const K = E.congreso[cam];
      const cupos = {}; C.DATA.comisiones.forEach(c => cupos[c.n] = c[cam]);
      const totalCupos = U.suma(Object.values(cupos)), n = K.curules.length;
      // Ajusta los cupos al tamaño real de la cámara
      const factor = n / totalCupos;
      let asignados = 0; for (const k of Object.keys(cupos)) { cupos[k] = Math.max(3, Math.round(cupos[k] * factor)); asignados += cupos[k]; }
      cupos[1] += n - asignados;
      K.comisiones = {}; C.DATA.comisiones.forEach(c => K.comisiones[c.n] = { n: c.n, miembros: [], presidente: null, vice: null });
      const pols = U.barajar(Co.miembros(E, cam));
      const pref = p => {
        if (p.id === 'J' && E.jugador.comisionPreferida) return [E.jugador.comisionPreferida];
        return p.intereses.map(s => C.DATA.sectores[s].comision);
      };
      // Primero los de mayor experiencia eligen
      pols.sort((a, b) => b.r.exp - a.r.exp);
      const sin = [];
      for (const p of pols) {
        const opc = pref(p).find(n => K.comisiones[n].miembros.length < cupos[n]);
        if (opc) K.comisiones[opc].miembros.push(p.id); else sin.push(p);
      }
      for (const p of sin) {
        const n = Object.keys(cupos).find(k => K.comisiones[k].miembros.length < cupos[k]) || 1;
        K.comisiones[n].miembros.push(p.id);
      }
      for (const com of Object.values(K.comisiones)) for (const id of com.miembros) {
        const p = E.politicos[id];
        if (id === 'J') E.jugador.comision = com.n; else p.cargo.comision = com.n;
      }
    },
    /* Voceros de bancada */
    bancadas(E, cam) {
      const K = E.congreso[cam]; K.bancadas = {};
      const grupos = U.agrupar(Co.miembros(E, cam), p => p.partido || 'IND');
      for (const [pid, ms] of Object.entries(grupos)) {
        const vocero = ms.filter(p => p.id !== 'J').sort((a, b) => (b.r.exp + b.r.car) - (a.r.exp + a.r.car))[0];
        K.bancadas[pid] = { vocero: vocero ? vocero.id : null, n: ms.length };
      }
    },
    /* Mesas directivas (cada 20 de julio): si el jugador pertenece a esa cámara, se abre una
       ventana de postulación (aval del partido o de forma autónoma) en vez de resolverla sola;
       si no, sigue el reparto automático de siempre. Las mesas de comisión no dependen del
       jugador y se resuelven siempre igual. */
    elegirMesas(E) {
      const coal = E.gobierno.coalicion || [];
      for (const cam of CAMARAS) {
        const jEnCamara = (cam === 'senado' && E.jugador.cargo === 'senador') || (cam === 'camara' && E.jugador.cargo === 'representante');
        if (jEnCamara) Co.abrirPostulacionMesa(E, cam); else Co.resolverMesaSinJugador(E, cam, coal);
        Co.elegirMesaComision(E, cam, coal);
      }
    },
    abrirPostulacionMesa(E, cam) {
      E.congreso[cam].mesaPendiente = { t: E.fecha.t };
      Co.log(E, 'mesa', `Se abre la elección de mesa directiva ${Co.delCamara(cam)}: puedes pedir el aval de tu partido o postularte de forma autónoma`);
    },
    /* Reparto automático de la mesa cuando el jugador no compite (no pertenece a esa cámara, o
       decidió no postularse): igual que siempre, el mejor perfil de la coalición de gobierno. */
    resolverMesaSinJugador(E, cam, coal) {
      coal = coal || E.gobierno.coalicion || [];
      const K = E.congreso[cam];
      const ms = Co.miembros(E, cam).filter(p => p.id !== 'J');
      const gob = ms.filter(p => coal.includes(p.partido));
      const opo = ms.filter(p => E.partidos[p.partido] && E.partidos[p.partido].postura === 'oposicion');
      const mejor = arr => arr.slice().sort((a, b) => (b.r.exp + b.r.amb + U.ri(0, 40)) - (a.r.exp + a.r.amb + U.ri(0, 40)))[0];
      const pres = mejor(gob.length ? gob : ms);
      const vice1 = mejor(ms.filter(p => p !== pres && p.partido !== pres.partido));
      const vice2 = mejor(opo.length ? opo : ms.filter(p => p !== pres && p !== vice1));
      K.mesa = { presidente: pres && pres.id, vice1: vice1 && vice1.id, vice2: vice2 && vice2.id, desde: E.fecha.t };
      K.mesaPendiente = null;
      if (pres) Co.log(E, 'mesa', `${pres.nombre} (${E.partidos[pres.partido] ? E.partidos[pres.partido].sigla : ''}) es elegido presidente ${Co.delCamara(cam)}`);
    },
    /* Probabilidad de que el partido avale al jugador para la mesa directiva: pesa su peso interno
       y su relación con la dirección, igual que otras negociaciones internas de partido. */
    probAval(E) {
      const J = E.jugador, pa = E.partidos[J.partido]; if (!pa) return 0.1;
      const peso = C.Partidos.peso(E, E.politicos.J).nac;
      return U.clamp(0.15 + peso / 140 + (pa.relJ || 0) / 220, 0.05, 0.85);
    },
    /* Elección de la mesa con el jugador como candidato: dos rivales (el mejor perfil de la
       coalición de gobierno y el mejor de la oposición) compiten contra él en una lotería
       ponderada por fuerza — pedir el aval del partido da una prima real; ir de forma autónoma
       siempre es posible, pero compite en desventaja. */
    resolverMesaConJugador(E, cam, via) {
      const K = E.congreso[cam], coal = E.gobierno.coalicion || [], J = E.jugador;
      const ms = Co.miembros(E, cam).filter(p => p.id !== 'J');
      const gob = ms.filter(p => coal.includes(p.partido));
      const opo = ms.filter(p => E.partidos[p.partido] && E.partidos[p.partido].postura === 'oposicion');
      const mejor = arr => arr.slice().sort((a, b) => (b.r.exp + b.r.amb + U.ri(0, 40)) - (a.r.exp + a.r.amb + U.ri(0, 40)))[0];
      const rival1 = mejor(gob.length ? gob : ms);
      const rival2 = mejor((opo.length ? opo : ms).filter(p => p !== rival1));
      const pesoJ = C.Partidos.peso(E, E.politicos.J).nac;
      const fuerzaJ = (pesoJ * 0.5 + J.reconocimiento * 0.3 + J.atributos.carisma * 0.2) * (via === 'aval' ? 1.25 : 0.75);
      const cand = [{ id: 'J', fuerza: fuerzaJ }];
      if (rival1) cand.push({ id: rival1.id, fuerza: rival1.r.exp * 0.6 + rival1.r.amb * 0.3 + rival1.r.car * 0.1 });
      if (rival2 && rival2 !== rival1) cand.push({ id: rival2.id, fuerza: rival2.r.exp * 0.6 + rival2.r.amb * 0.3 + rival2.r.car * 0.1 });
      const pesos = cand.map(c => Math.pow(c.fuerza + 5, 1.4) * Math.exp(U.gauss(0, 0.25)));
      const tot = U.suma(pesos);
      cand.forEach((c, i) => c.pct = pesos[i] / tot * 100);
      cand.sort((a, b) => b.pct - a.pct);
      const ganador = cand[0].id;
      const vice1 = mejor(ms.filter(p => p.id !== ganador && p.partido !== (ganador === 'J' ? J.partido : E.politicos[ganador].partido)));
      const vice2 = mejor((opo.length ? opo : ms).filter(p => p.id !== ganador && p !== vice1));
      K.mesa = { presidente: ganador, vice1: vice1 && vice1.id, vice2: vice2 && vice2.id, desde: E.fecha.t };
      K.mesaPendiente = null;
      const pa = E.partidos[J.partido];
      if (ganador === 'J') {
        J.reconocimiento = U.clamp(J.reconocimiento + 8, 0, 100);
        if (pa) pa.relJ = U.clamp((pa.relJ || 0) + (via === 'aval' ? 6 : -2), -100, 100);
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `${J.nombre} es elegido presidente ${Co.delCamara(cam)}${via === 'autonoma' ? ', sin el respaldo de su partido' : ''}`, tono: 1, importante: true, jugador: true });
        Co.log(E, 'mesa', `${J.nombre} es elegido presidente ${Co.delCamara(cam)}`);
      } else {
        const ganadorPol = E.politicos[ganador];
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `${ganadorPol.nombre} es elegido presidente ${Co.delCamara(cam)}, no ${J.nombre}`, tono: 0, jugador: true });
        Co.log(E, 'mesa', `${ganadorPol.nombre} (${E.partidos[ganadorPol.partido] ? E.partidos[ganadorPol.partido].sigla : ''}) es elegido presidente ${Co.delCamara(cam)}`);
      }
      return { ganador };
    },
    elegirMesaComision(E, cam, coal) {
      const K = E.congreso[cam];
      const mejor = arr => arr.slice().sort((a, b) => (b.r.exp + b.r.amb + U.ri(0, 40)) - (a.r.exp + a.r.amb + U.ri(0, 40)))[0];
      for (const com of Object.values(K.comisiones)) {
        const mm = com.miembros.map(id => E.politicos[id]).filter(p => p && p.id !== 'J');
        const g = mm.filter(p => coal.includes(p.partido));
        com.presidente = (mejor(g.length ? g : mm) || {}).id || null;
        const resto = mm.filter(p => p.id !== com.presidente);
        const o = resto.filter(p => E.partidos[p.partido] && E.partidos[p.partido].postura !== 'gobierno');
        com.vice = (mejor(o.length ? o : resto) || {}).id || null;
      }
    },
    /* Composición agregada por partido y por postura */
    composicion(E, cam) {
      const porPartido = {}, porPostura = { gobierno: 0, independiente: 0, oposicion: 0 };
      for (const p of Co.miembros(E, cam)) {
        const pid = p.id === 'J' ? (E.jugador.partido || 'IND') : (p.partido || 'IND');
        porPartido[pid] = (porPartido[pid] || 0) + 1;
        const pa = E.partidos[pid];
        const post = p.id === 'J' ? E.jugador.postura || (pa ? pa.postura : 'independiente') : (pa ? pa.postura : 'independiente');
        porPostura[post] = (porPostura[post] || 0) + 1;
      }
      return { porPartido, porPostura, total: E.congreso[cam].curules.length, mayoria: Co.mayoria(E, cam) };
    },
    /* Orden ideológico de los partidos (izquierda→derecha) para el hemiciclo */
    ordenPartidos(E) {
      return Object.values(E.partidos).slice().sort((a, b) => (a.eco + a.soc * 0.3) - (b.eco + b.soc * 0.3)).map(p => p.id);
    },

    turno(E) {
      const d = U.hoy();
      const esJul20 = d.getUTCMonth() === 6 && d.getUTCDate() >= 20 && d.getUTCDate() < 27;
      if (esJul20) {
        if (E.congreso.electos) Co.instalar(E, E.congreso.electos);
        else Co.elegirMesas(E);
        E.congreso.legislatura = (E.congreso.legislatura || 0) + 1;
        Co.log(E, 'sesion', 'Se instala la legislatura ' + Co.periodo(E).legislatura);
        C.Bus.emit('congreso:legislatura');
      }
      const sesion = Co.enSesion(E);
      if (sesion !== E.congreso.sesionAnterior) {
        Co.log(E, 'sesion', sesion ? 'Inicia el periodo de sesiones ordinarias' : 'El Congreso entra en receso');
        E.congreso.sesionAnterior = sesion;
      }
      // Ausentismo semanal para las estadísticas
      if (sesion) for (const cam of CAMARAS) for (const p of Co.miembros(E, cam)) if (p.id !== 'J' && !U.chance(p.asistencia)) p.stats.ausencias++;
      // Si el jugador deja pasar demasiado tiempo sin decidir, la mesa se resuelve sin él
      for (const cam of CAMARAS) {
        const K = E.congreso[cam];
        if (K.mesaPendiente && E.fecha.t - K.mesaPendiente.t >= 3) Co.resolverMesaSinJugador(E, cam);
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      const enCamara = (E, camara) => (camara === 'senado' && E.jugador.cargo === 'senador') || (camara === 'camara' && E.jugador.cargo === 'representante');
      const hayPostulacion = (E, camara) => enCamara(E, camara) ? (E.congreso[camara].mesaPendiente ? true : 'No hay una elección de mesa directiva abierta') : 'No perteneces a esa cámara';
      A.registrar({ id: 'postularMesaAval', nombre: 'Pedir aval del partido', icono: '🎗', grupo: 'congreso', costo: 1,
        disponible(E, a) { return hayPostulacion(E, a.camara); },
        ejecutar(E, a) {
          const K = E.congreso[a.camara]; if (!K.mesaPendiente) return { ok: false, msg: 'No hay una elección de mesa directiva abierta' };
          const J = E.jugador, pa = E.partidos[J.partido];
          const exito = U.chance(Co.probAval(E));
          if (pa) pa.relJ = U.clamp((pa.relJ || 0) + (exito ? 4 : -2), -100, 100);
          C.Medios.noticia(E, { tipo: 'partidos', titular: exito ? `El ${pa ? pa.sigla : ''} respalda a ${J.nombre} para presidir ${Co.delCamara(a.camara)}` : `El ${pa ? pa.sigla : ''} no respalda a ${J.nombre} para la mesa directiva`, tono: exito ? 1 : -1, jugador: true });
          Co.resolverMesaConJugador(E, a.camara, exito ? 'aval' : 'autonoma');
          return { ok: true, msg: exito ? 'Tu partido te avala: te postulas con su respaldo' : 'Tu partido no te avala, pero igual te postulas de forma autónoma', exito };
        } });
      A.registrar({ id: 'postularMesaAutonoma', nombre: 'Postularme de forma autónoma', icono: '🚩', grupo: 'congreso', costo: 1,
        disponible(E, a) { return hayPostulacion(E, a.camara); },
        ejecutar(E, a) {
          if (!E.congreso[a.camara].mesaPendiente) return { ok: false, msg: 'No hay una elección de mesa directiva abierta' };
          Co.resolverMesaConJugador(E, a.camara, 'autonoma');
          return { ok: true, msg: 'Te postulas de forma autónoma, sin pedirle nada a tu partido' };
        } });
      A.registrar({ id: 'noPostularseMesa', nombre: 'No postularme', icono: '➖', grupo: 'congreso', costo: 0,
        disponible(E, a) { return hayPostulacion(E, a.camara); },
        ejecutar(E, a) {
          if (!E.congreso[a.camara].mesaPendiente) return { ok: false, msg: 'No hay una elección de mesa directiva abierta' };
          Co.resolverMesaSinJugador(E, a.camara);
          return { ok: true, msg: 'No te postulas a la mesa directiva esta vez' };
        } });
    }
  };

  C.Congreso = Co;
  Co.registrarAcciones();
  C.Tiempo.registrar('congreso', Co, 60);
})(window.CURUL);
