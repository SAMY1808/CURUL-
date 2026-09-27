/* Orden público: grupos armados ficticios con control territorial de fondo (ataques que erosionan
   la seguridad de sus departamentos, avances y retrocesos lentos según su fuerza). Como
   presidente, el jugador tiene un rol activo: ofensivas militares para debilitarlos, o un
   protocolo de negociación de paz con varias fases reales —cese al fuego, agenda de puntos
   negociados uno a uno, verificación internacional y firma— seguido de una implementación
   post-acuerdo con riesgo real de que surjan disidencias si el cumplimiento es flojo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const GRUPOS = [
    { id: 'fin', nombre: 'Frente Insurgente Nacional', sigla: 'FIN', tipo: 'guerrilla' },
    { id: 'aun', nombre: 'Autodefensas Unidas del Norte', sigla: 'AUN', tipo: 'paramilitar' },
    { id: 'cds', nombre: 'Clan del Sur', sigla: 'CDS', tipo: 'narcotráfico' }
  ];
  /* Agenda de paz, inspirada en la agenda real de La Habana (2012-2016). */
  const PUNTOS = [
    { id: 'tierra', nombre: 'Reforma rural integral' },
    { id: 'participacion', nombre: 'Participación política' },
    { id: 'fin', nombre: 'Fin del conflicto' },
    { id: 'drogas', nombre: 'Solución a las drogas ilícitas' },
    { id: 'victimas', nombre: 'Víctimas y justicia transicional' }
  ];
  const SEM_VERIFICACION = 6, RACHA_CONSOLIDACION = 30;

  const OP = {
    GRUPOS, PUNTOS,
    init(E) {
      const grupos = {}, ocupados = new Set();
      for (const g of GRUPOS) {
        const control = [];
        const n = U.ri(2, 4);
        for (let i = 0; i < n; i++) {
          const pool = Object.values(E.deptos).filter(d => d.seguridad < 62 && !ocupados.has(d.id));
          const d = pool.length ? U.pesado(pool, x => Math.max(1, 62 - x.seguridad)) : null;
          if (!d) break;
          control.push(d.id); ocupados.add(d.id);
        }
        grupos[g.id] = { fuerza: U.ri(35, 70), activo: control.length > 0, control, negociacion: null, acuerdoPaz: null, implementacion: null };
      }
      E.ordenPublico = { grupos };
    },
    activos(E) { return GRUPOS.filter(g => E.ordenPublico.grupos[g.id].activo); },
    fuerzaInstitucional(E) {
      return 38 + U.prom(Object.values(E.deptos).map(d => d.seguridad)) * 0.25;
    },
    turno(E) {
      const OP_ = E.ordenPublico;
      for (const g of GRUPOS) {
        const st = OP_.grupos[g.id];
        OP.turnoImplementacion(E, g, st);
        if (!st.activo) continue;
        if (st.negociacion) { OP.turnoNegociacion(E, g, st); continue; }
        if (st.control.length && U.chance(0.05 + st.fuerza / 1500)) {
          const dId = U.pick(st.control), d = E.deptos[dId];
          d.seguridad = U.clamp(d.seguridad - U.rf(1, 4), 1, 99);
          E.opinion.escandalos += 0.15;
          C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Las ${g.sigla} atacan en ${d.nombre}`, tono: -1, importante: U.chance(0.25) });
        }
        if (E.fecha.t % 8 === 0) {
          /* La respuesta institucional recupera territorio con más frecuencia cuanto más fuerte
             es el Estado frente al grupo (no sólo cuando el grupo ya está casi vencido), y el
             crecimiento territorial se satura a medida que controla más departamentos — así una
             partida larga sin ofensivas ni mesas de paz del jugador no deja que un grupo se coma
             el país entero. */
          const fi = OP.fuerzaInstitucional(E);
          const probRecuperar = U.clamp(0.04 + (fi - st.fuerza) / 220, 0.02, 0.35);
          const MAX_CONTROL = 6;
          if (st.control.length && U.chance(probRecuperar)) {
            const salida = U.pick(st.control);
            st.control = st.control.filter(x => x !== salida);
            E.deptos[salida].seguridad = U.clamp(E.deptos[salida].seguridad + 6, 1, 99);
            C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `La Fuerza Pública recupera el control en ${E.deptos[salida].nombre}, antes en poder de las ${g.sigla}`, tono: 1 });
            if (!st.control.length && !U.chance(0.5)) st.activo = false;
          } else if (st.fuerza > 62 && st.control.length < MAX_CONTROL && U.chance(0.15 * (1 - st.control.length / MAX_CONTROL))) {
            const ocupados = new Set(GRUPOS.flatMap(x => OP_.grupos[x.id].control));
            const cand = Object.values(E.deptos).filter(d => d.seguridad < 55 && !ocupados.has(d.id));
            if (cand.length) { const nuevo = U.pick(cand).id; st.control.push(nuevo); C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Las ${g.sigla} amplían su presencia hacia ${E.deptos[nuevo].nombre}`, tono: -1 }); }
          }
        }
      }
    },
    /* Fases del protocolo: 'cese' (cese al fuego bilateral) → 'agenda' (los 5 puntos, uno a uno)
       → 'verificacion' (acompañamiento internacional, pasiva) → firma (Op.firmarPaz). */
    turnoNegociacion(E, g, st) {
      const neg = st.negociacion;
      if (neg.fase === 'verificacion') {
        if (E.fecha.t - neg.tVerificacion >= SEM_VERIFICACION) OP.firmarPaz(E, g.id);
        return;
      }
      if (U.chance(0.025)) {
        st.negociacion = null;
        C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Se rompen los diálogos de paz con las ${g.sigla}`, tono: -1, importante: true });
      }
    },
    turnoImplementacion(E, g, st) {
      const im = st.implementacion; if (!im || im.consolidada) return;
      if (im.invertidoUlt !== E.fecha.t) im.cumplimiento = U.clamp(im.cumplimiento - 0.3 + U.gauss(0, 0.4), 0, 100);
      im.racha = im.cumplimiento >= 70 ? (im.racha || 0) + 1 : 0;
      if (im.racha >= RACHA_CONSOLIDACION) {
        im.consolidada = true;
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(2, 5), 3, 95);
        C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `La paz con las ${g.sigla} queda consolidada: el acuerdo se cumplió`, tono: 1, importante: true, jugador: true });
        return;
      }
      if (im.cumplimiento < 25 && U.chance(0.035)) {
        const ocupados = new Set(GRUPOS.flatMap(x => E.ordenPublico.grupos[x.id].control));
        const cand = Object.values(E.deptos).filter(d => d.seguridad < 60 && !ocupados.has(d.id));
        const control = [];
        for (let i = 0; i < U.ri(1, 2) && cand.length; i++) { const d = U.pesado(cand.filter(x => !control.includes(x.id)), x => 60 - x.seguridad); if (d) control.push(d.id); }
        st.activo = true; st.control = control; st.fuerza = U.ri(15, 30); st.implementacion = null;
        E.opinion.escandalos += 1;
        C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Disidencias de las ${g.sigla} reactivan la violencia: el proceso de paz no se cumplió`, tono: -1, importante: true, jugador: true });
      }
    },
    firmarPaz(E, gid) {
      const g = GRUPOS.find(x => x.id === gid), st = E.ordenPublico.grupos[gid];
      for (const dId of st.control) E.deptos[dId].seguridad = U.clamp(E.deptos[dId].seguridad + 12, 1, 99);
      st.activo = false; st.control = []; st.negociacion = null; st.acuerdoPaz = { t: E.fecha.t };
      st.implementacion = { cumplimiento: 55, racha: 0, consolidada: false };
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(3, 8), 3, 95);
      C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Firma histórica: el Gobierno y las ${g.sigla} sellan un acuerdo de paz`, tono: 1, importante: true, jugador: E.gobierno.presidente === 'J' });
      if (E.gobierno.presidente === 'J') E.jugador.reconocimientos.push({ t: E.fecha.t, txt: `Firma la paz con las ${g.sigla}` });
    },
    ofensiva(E, gid) {
      const g = GRUPOS.find(x => x.id === gid), st = E.ordenPublico.grupos[gid];
      const fuerzaPropia = OP.fuerzaInstitucional(E) + U.rf(-8, 8);
      const exito = U.chance(U.clamp(0.35 + (fuerzaPropia - st.fuerza) / 140, 0.1, 0.85));
      if (exito) {
        st.fuerza = U.clamp(st.fuerza - U.rf(8, 16), 5, 100);
        if (st.control.length && U.chance(0.5)) { const rec = U.pick(st.control); st.control = st.control.filter(x => x !== rec); E.deptos[rec].seguridad = U.clamp(E.deptos[rec].seguridad + 10, 1, 99); }
        if (st.fuerza < 10 && !st.control.length) st.activo = false;
        C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Golpe militar exitoso contra las ${g.sigla}`, tono: 1, importante: true, jugador: true });
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(1, 3), 3, 95);
      } else {
        C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `La ofensiva contra las ${g.sigla} no logra sus objetivos`, tono: -1, jugador: true });
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(0.5, 2), 3, 95);
      }
      return { exito };
    },
    registrarAcciones() {
      const A = C.Acciones;
      const esPresidente = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente';
      A.registrar({ id: 'ofensivaMilitar', nombre: 'Ordenar ofensiva militar', icono: '🪖', grupo: 'ordenpublico', costo: 3,
        disponible(E, a) {
          if (esPresidente(E) !== true) return esPresidente(E);
          const st = E.ordenPublico.grupos[a.grupo];
          if (!st || !st.activo) return 'Ese grupo no está activo';
          if (st.negociacion) return 'Hay una negociación de paz en curso: suspéndela primero';
          return true;
        },
        ejecutar(E, a) { const r = OP.ofensiva(E, a.grupo); return { ok: true, msg: r.exito ? 'La ofensiva logra debilitar al grupo armado' : 'La ofensiva fracasa: el grupo resiste', exito: r.exito }; } });
      A.registrar({ id: 'mesaPaz', nombre: 'Abrir mesa de negociación de paz', icono: '🕊', grupo: 'ordenpublico', costo: 2,
        disponible(E, a) {
          if (esPresidente(E) !== true) return esPresidente(E);
          const st = E.ordenPublico.grupos[a.grupo];
          if (!st || !st.activo) return 'Ese grupo no está activo';
          if (st.negociacion) return 'Ya hay una mesa de negociación abierta';
          return true;
        },
        ejecutar(E, a) {
          E.ordenPublico.grupos[a.grupo].negociacion = { t: E.fecha.t, fase: 'cese', puntos: null };
          const g = GRUPOS.find(x => x.id === a.grupo);
          C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `El Gobierno instala una mesa exploratoria con las ${g.sigla}`, tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se instala la mesa exploratoria: el primer paso es pactar un cese al fuego' };
        } });
      A.registrar({ id: 'pactarCese', nombre: 'Pactar cese al fuego bilateral', icono: '🏳', grupo: 'ordenpublico', costo: 2,
        disponible(E, a) {
          const st = E.ordenPublico.grupos[a.grupo];
          if (esPresidente(E) !== true) return esPresidente(E);
          if (!st || !st.negociacion || st.negociacion.fase !== 'cese') return 'No hay una mesa exploratoria esperando un cese al fuego';
          return true;
        },
        ejecutar(E, a) {
          const st = E.ordenPublico.grupos[a.grupo], g = GRUPOS.find(x => x.id === a.grupo);
          st.negociacion.fase = 'agenda';
          st.negociacion.puntos = Object.fromEntries(PUNTOS.map(p => [p.id, { avance: 0, acordado: false }]));
          C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Cese al fuego bilateral con las ${g.sigla}: arranca la negociación de la agenda`, tono: 1, importante: true, jugador: true });
          return { ok: true, msg: 'Cese al fuego pactado: ahora se negocia la agenda punto por punto' };
        } });
      A.registrar({ id: 'negociarPunto', nombre: 'Negociar punto de la agenda', icono: '📋', grupo: 'ordenpublico', costo: 1,
        disponible(E, a) {
          const st = E.ordenPublico.grupos[a.grupo];
          if (esPresidente(E) !== true) return esPresidente(E);
          if (!st || !st.negociacion || st.negociacion.fase !== 'agenda') return 'No hay una agenda de paz en negociación con ese grupo';
          const p = st.negociacion.puntos[a.punto]; if (!p) return 'Elige un punto de la agenda';
          if (p.acordado) return 'Ese punto ya quedó acordado';
          return true;
        },
        ejecutar(E, a) {
          const st = E.ordenPublico.grupos[a.grupo], g = GRUPOS.find(x => x.id === a.grupo);
          const pun = PUNTOS.find(x => x.id === a.punto), p = st.negociacion.puntos[a.punto];
          p.avance = U.clamp(p.avance + U.rf(18, 32), 0, 100);
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(0.2, 0.6), 3, 95);
          let msg = `Avanza el punto «${pun.nombre}» (${Math.round(p.avance)}%)`;
          if (p.avance >= 100 && !p.acordado) {
            p.acordado = true;
            C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Acuerdo parcial con las ${g.sigla} en «${pun.nombre}»`, tono: 1, importante: true, jugador: true });
            msg = `Se acuerda el punto «${pun.nombre}»`;
            if (Object.values(st.negociacion.puntos).every(x => x.acordado)) {
              st.negociacion.fase = 'verificacion'; st.negociacion.tVerificacion = E.fecha.t;
              C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Cerrada toda la agenda con las ${g.sigla}: empieza la verificación internacional`, tono: 1, importante: true, jugador: true });
              msg += '. Se cierra toda la agenda: empieza la verificación internacional';
            }
          }
          return { ok: true, msg };
        } });
      A.registrar({ id: 'invertirImplementacion', nombre: 'Invertir en la implementación de la paz', icono: '🏗', grupo: 'ordenpublico', costo: 1,
        disponible(E, a) {
          const st = E.ordenPublico.grupos[a.grupo];
          if (esPresidente(E) !== true) return esPresidente(E);
          if (!st || !st.implementacion || st.implementacion.consolidada) return 'Ese grupo no tiene un acuerdo de paz en implementación';
          return true;
        },
        ejecutar(E, a) {
          const im = E.ordenPublico.grupos[a.grupo].implementacion;
          im.cumplimiento = U.clamp(im.cumplimiento + U.rf(5, 10), 0, 100); im.invertidoUlt = E.fecha.t;
          return { ok: true, msg: `Cumplimiento del acuerdo ahora en ${Math.round(im.cumplimiento)}%` };
        } });
    }
  };

  C.OrdenPublico = OP;
  C.Tiempo.registrar('ordenpublico', OP, 60);
  OP.registrarAcciones();
})(window.CURUL);
