/* Presiones para votar antes de tiempo (Fase 48): desde el Ejecutivo (mensaje de urgencia, sesiones extraordinarias, pacto burocrático,
   ultimátum a la coalición) y desde el Legislativo (pedir a la mesa directiva, prioridad en la comisión, orden del partido, movilización de la
   opinión). Acelerar cuesta: el «desgaste» sube con cada presión, baja la probabilidad de éxito y, si se abusa, provoca reacciones (escándalo
   por atropello, rechazo del Congreso y mayor riesgo de que la Corte tumbe la ley por vicios de trámite). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, L = () => C.Legislacion, esPres = E => E.gobierno.presidente === 'J';
  const Pr = {
    clave: 'presionLeg',
    asegurar(E) { if (E.presionLeg && E.presionLeg.ult) return E.presionLeg; E.presionLeg = { desgaste: 0, ult: {}, extra: null, nUrg: 0 }; return E.presionLeg; },
    init(E) { E.presionLeg = null; }, migrar(E) { Pr.asegurar(E); },
    proy(E, a) { const p = E.proyectos[a.proyecto]; return p && p.estado === 'tramite' ? p : null; },
    /* ¿Está el proyecto esperando agenda o ponencia (es decir, se puede acelerar)? */
    acelerable(E, p) { if (!p) return 'Proyecto no disponible'; if (!['agenda', 'ponencia'].includes(p.sub)) return 'El proyecto no está a la espera de agenda'; return true; },
    exito(E, base) { return cl(base - Pr.asegurar(E).desgaste / 200, 0.1, 0.95); },
    acelerar(E, p, motivo) {
      const t = E.fecha.t;
      if (p.sub === 'agenda') p.esperaHasta = Math.min(p.esperaHasta || t, t);
      else if (p.sub === 'ponencia') p.ponenciaLista = Math.min(p.ponenciaLista || t + 9, t + 1);
      p.apresurado = true; p.presion += 6; L().hist(E, p, motivo, 'info');
    },
    desgastar(E, d) { const k = Pr.asegurar(E); k.desgaste = cl(k.desgaste + d, 0, 100); },
    irritarOposicion(E, d) { for (const pa of Object.values(E.partidos)) if (!pa.especial && !pa.futuro && pa.postura === 'oposicion') pa.relJ = cl((pa.relJ || 0) - d, -100, 100); },
    coalicionPodra(E) { return (E.gobierno.coalicion || []).length; },
    turno(E) {
      const k = Pr.asegurar(E), t = E.fecha.t;
      k.desgaste = Math.max(0, k.desgaste - 0.4);
      if (k.extra && t >= k.extra.hasta) k.extra = null;
      // las urgencias vencen: el Congreso tiene un plazo corto para decidir
      for (const p of Object.values(E.proyectos)) if (p.urgenciaPres && p.urgencia && t > p.urgenciaPres) { p.urgencia = false; p.urgenciaPres = null; if (p.estado === 'tramite' && !E.meta.presim) C.Medios.noticia(E, { tipo: 'legislativo', titular: `Se vence la urgencia de «${p.titulo}»: el Congreso no la tramitó a tiempo`, tono: -1 }); }
      // reacciones al abuso
      if (k.desgaste > 55 && !E.meta.presim && U.chance(0.02 + (k.desgaste - 55) / 1500)) {
        k.desgaste = Math.max(0, k.desgaste - 15); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.4;
        if (esPres(E)) { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 1, 3, 95); Pr.irritarOposicion(E, 3); }
        C.Medios.noticia(E, { tipo: 'legislativo', titular: 'Congresistas denuncian un «atropello» al trámite legislativo por las presiones para votar a pupitrazo', tono: -1, importante: true, jugador: esPres(E) });
      }
    },
    registrarAcciones() {
      const A = C.Acciones, gob = E => esPres(E) ? true : 'Sólo el Presidente';
      A.registrar({ id: 'mensajeUrgencia', nombre: 'Mensaje de urgencia del Gobierno', icono: '⚡', grupo: 'legislativo', costo: 2,
        disponible(E, a) { const g = gob(E); if (g !== true) return g; const p = Pr.proy(E, a), k = Pr.asegurar(E); if (!p) return 'Elige un proyecto en trámite'; if (p.urgencia) return 'Ya tiene urgencia'; if (E.fecha.t - (k.ult.urg || -99) < 4) return 'Espera unas semanas entre mensajes de urgencia'; return Pr.acelerable(E, p); },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto], k = Pr.asegurar(E); k.ult.urg = E.fecha.t; p.urgencia = true; p.urgenciaPres = E.fecha.t + 6; Pr.acelerar(E, p, 'El Presidente envía mensaje de urgencia: el Congreso debe decidir en seis semanas'); Pr.desgastar(E, 12); Pr.irritarOposicion(E, 2); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.3, 3, 95); return { ok: true, msg: 'Envías mensaje de urgencia: el proyecto pasa al frente de la fila y la oposición lo ve como atropello' }; } });
      A.registrar({ id: 'sesionesExtraordinarias', nombre: 'Convocar al Congreso a sesiones extraordinarias', icono: '🔔', grupo: 'legislativo', costo: 3,
        disponible(E) { const g = gob(E); if (g !== true) return g; const k = Pr.asegurar(E); if (C.Congreso.enSesion(E)) return 'El Congreso ya está en sesiones'; if (!E.regimen || E.regimen.congreso !== false) return k.extra ? 'Ya están convocadas' : true; return 'No hay Congreso'; },
        ejecutar(E) { const k = Pr.asegurar(E); k.extra = { hasta: E.fecha.t + 4 }; Pr.desgastar(E, 10); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 0.8, 3, 95); C.Medios.noticia(E, { tipo: 'legislativo', titular: 'El Presidente convoca al Congreso a sesiones extraordinarias en pleno receso', tono: 0, importante: true, jugador: true }); return { ok: true, msg: 'Convocas sesiones extraordinarias por cuatro semanas: los congresistas regresan molestos' }; } });
      A.registrar({ id: 'pactoBurocratico', nombre: 'Puestos y contratos a cambio de votar ya', icono: '🍯', grupo: 'legislativo', costo: 2,
        disponible(E, a) { const g = gob(E); if (g !== true) return g; return Pr.acelerable(E, Pr.proy(E, a)); },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto]; Pr.acelerar(E, p, 'El Gobierno reparte puestos y contratos para que se vote cuanto antes'); p.presion += 6; Pr.desgastar(E, 8); if (C.Corrupcion) C.Corrupcion.efectoEscandalo(E, 0.7); E.jugador.riesgoJudicial = cl((E.jugador.riesgoJudicial || 0) + 3, 0, 100); if (U.chance(0.18)) { C.Pais.ef(E, { escandalo: 'Mermelada a cambio de votos' }); return { ok: true, msg: 'El proyecto se acelera, pero se filtra el trueque de puestos por votos: escándalo' }; } return { ok: true, msg: 'Repartes puestos y contratos: el proyecto se acelera y su apoyo crece' }; } });
      A.registrar({ id: 'ultimatumCoalicion', nombre: 'Ultimátum a la coalición de Gobierno', icono: '⏳', grupo: 'legislativo', costo: 2,
        disponible(E, a) { const g = gob(E); if (g !== true) return g; if (!Pr.coalicionPodra(E)) return 'No tienes coalición'; return Pr.acelerable(E, Pr.proy(E, a)); },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto]; if (!U.chance(Pr.exito(E, 0.7))) { for (const pid of E.gobierno.coalicion || []) { const pa = E.partidos[pid]; if (pa) pa.relJ = cl((pa.relJ || 0) - 3, -100, 100); } Pr.desgastar(E, 6); return { ok: true, exito: false, msg: 'La coalición se ofende y no cede: pierdes confianza entre tus aliados' }; } Pr.acelerar(E, p, 'El Gobierno condiciona su respaldo en la coalición a que el proyecto se vote ya'); for (const pid of E.gobierno.coalicion || []) { const pa = E.partidos[pid]; if (pa) { pa.relJ = cl((pa.relJ || 0) - 1.5, -100, 100); pa.cohesion = cl(pa.cohesion - 1, 0, 100); } } Pr.desgastar(E, 7); return { ok: true, msg: 'Tus socios ceden a regañadientes: el proyecto sube en el orden del día' }; } });
      A.registrar({ id: 'pedirAlaMesa', nombre: 'Pedir a la mesa directiva que lo ponga ya en el orden del día', icono: '🙏', grupo: 'legislativo', costo: 1,
        disponible(E, a) { const p = Pr.proy(E, a); if (!p) return 'Elige un proyecto en trámite'; const cam = L().camaraDeEtapa(p); if (!cam) return 'No está en trámite en ninguna cámara'; if (C.Congreso.esMesaDe(E, cam)) return 'Eres de la mesa: usa «Adelantar en el orden del día»'; if (!['senador', 'representante'].includes(E.jugador.cargo)) return 'Sólo congresistas piden a la mesa'; return Pr.acelerable(E, p); },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto], cam = L().camaraDeEtapa(p), J = E.jugador, pres = E.congreso[cam].mesa && E.politicos[E.congreso[cam].mesa.presidente];
          const mismo = pres && pres.partido === J.partido, coal = pres && (E.gobierno.coalicion || []).includes(pres.partido) === (p.gobierno);
          const q = Pr.exito(E, 0.3 + (J.reconocimiento || 0) / 250 + (mismo ? 0.25 : 0) + (coal ? 0.1 : -0.05) + (p.autor === 'J' ? 0.1 : 0));
          if (U.chance(q)) { Pr.acelerar(E, p, `${J.nombre} le pide a la mesa directiva que programe el proyecto de inmediato`); Pr.desgastar(E, 4); return { ok: true, msg: 'La mesa directiva accede y programa el proyecto' }; }
          Pr.desgastar(E, 3); if (pres && E.partidos[pres.partido]) E.partidos[pres.partido].relJ = cl((E.partidos[pres.partido].relJ || 0) - 2, -100, 100); return { ok: true, exito: false, msg: 'La mesa directiva te hace esperar: el presidente de la cámara no se deja presionar' }; } });
      A.registrar({ id: 'pedirPrioridadComision', nombre: 'Pedir prioridad en la comisión', icono: '📌', grupo: 'legislativo', costo: 1,
        disponible(E, a) { const p = Pr.proy(E, a); if (!p) return 'Elige un proyecto en trámite'; if (!['senador', 'representante'].includes(E.jugador.cargo)) return 'Sólo congresistas'; return Pr.acelerable(E, p); },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto], J = E.jugador; const q = Pr.exito(E, 0.45 + (p.autor === 'J' ? 0.2 : 0) + ((p.ponentes || []).includes('J') ? 0.15 : 0)); if (U.chance(q)) { Pr.acelerar(E, p, `${J.nombre} pide prioridad y la comisión adelanta el proyecto`); Pr.desgastar(E, 3); return { ok: true, msg: 'La comisión adelanta la ponencia y el debate' }; } Pr.desgastar(E, 2); return { ok: true, exito: false, msg: 'La comisión tiene otros proyectos antes' }; } });
      A.registrar({ id: 'ordenDePartido', nombre: 'Orden de partido: votar el proyecto ya', icono: '🎗', grupo: 'legislativo', costo: 2,
        disponible(E, a) { if (!C.Director || !C.Director.esDirector(E)) return 'Debes dirigir tu partido'; return Pr.acelerable(E, Pr.proy(E, a)); },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto], pa = E.partidos[E.jugador.partido]; Pr.acelerar(E, p, `${pa.sigla} anuncia que sus congresistas exigirán votar el proyecto de inmediato`); pa.cohesion = cl(pa.cohesion - 3, 0, 100); p.presion += 4; Pr.desgastar(E, 5); return { ok: true, msg: 'Tu bancada presiona unida: el proyecto se acelera, pero algunos se sienten atropellados' }; } });
      A.registrar({ id: 'movilizarOpinion', nombre: 'Movilizar a la opinión para que se vote ya', icono: '📢', grupo: 'legislativo', costo: 2,
        disponible(E, a) { return Pr.proy(E, a) ? true : 'Elige un proyecto en trámite'; },
        ejecutar(E, a) { const p = E.proyectos[a.proyecto]; p.presion += 12; C.Opinion.subirRec(E, 1.2); Pr.desgastar(E, 5); let ex = ''; if (U.chance(0.25)) { p.pop = cl(p.pop - 3, -100, 100); ex = ' (pero la presión desborda y genera rechazo)'; } return { ok: true, msg: `Marchas, cartas y redes sociales empujan el proyecto: sube en el orden del día${ex}` }; } });
    }
  };
  C.PresionLeg = Pr; C.Tiempo.registrar('presionLeg', Pr, 64); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('PresionLeg'); Pr.registrarAcciones();
})(window.CURUL);
