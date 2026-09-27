/* Orden público: grupos armados ficticios con control territorial de fondo (ataques que erosionan
   la seguridad de sus departamentos, avances y retrocesos lentos según su fuerza). Como
   presidente, el jugador tiene un rol activo: ofensivas militares para debilitarlos y recuperar
   territorio, o mesas de negociación de paz que —si se sostienen y se ceden concesiones— terminan
   en un acuerdo con seguimiento propio. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const GRUPOS = [
    { id: 'fin', nombre: 'Frente Insurgente Nacional', sigla: 'FIN', tipo: 'guerrilla' },
    { id: 'aun', nombre: 'Autodefensas Unidas del Norte', sigla: 'AUN', tipo: 'paramilitar' },
    { id: 'cds', nombre: 'Clan del Sur', sigla: 'CDS', tipo: 'narcotráfico' }
  ];

  const OP = {
    GRUPOS,
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
        grupos[g.id] = { fuerza: U.ri(35, 70), activo: control.length > 0, control, negociacion: null, acuerdoPaz: null };
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
        if (!st.activo) continue;
        if (st.negociacion) {
          st.negociacion.avance = U.clamp(st.negociacion.avance + U.rf(2, 5) + (st.negociacion.concesion || 0), 0, 100);
          st.negociacion.concesion = 0;
          if (st.negociacion.avance >= 100) { OP.firmarPaz(E, g.id); continue; }
          if (U.chance(0.04)) { st.negociacion = null; C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Se rompen los diálogos de paz con las ${g.sigla}`, tono: -1, importante: true }); }
          continue;
        }
        if (st.control.length && U.chance(0.05 + st.fuerza / 1500)) {
          const dId = U.pick(st.control), d = E.deptos[dId];
          d.seguridad = U.clamp(d.seguridad - U.rf(1, 4), 1, 99);
          E.opinion.escandalos += 0.15;
          C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Las ${g.sigla} atacan en ${d.nombre}`, tono: -1, importante: U.chance(0.25) });
        }
        if (E.fecha.t % 8 === 0) {
          if (st.control.length && st.fuerza < 28 && U.chance(0.3)) {
            const salida = U.pick(st.control);
            st.control = st.control.filter(x => x !== salida);
            E.deptos[salida].seguridad = U.clamp(E.deptos[salida].seguridad + 6, 1, 99);
            C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `La Fuerza Pública recupera el control en ${E.deptos[salida].nombre}, antes en poder de las ${g.sigla}`, tono: 1 });
            if (!st.control.length && !U.chance(0.5)) st.activo = false;
          } else if (st.fuerza > 62 && U.chance(0.15)) {
            const ocupados = new Set(GRUPOS.flatMap(x => OP_.grupos[x.id].control));
            const cand = Object.values(E.deptos).filter(d => d.seguridad < 55 && !ocupados.has(d.id));
            if (cand.length) { const nuevo = U.pick(cand).id; st.control.push(nuevo); C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `Las ${g.sigla} amplían su presencia hacia ${E.deptos[nuevo].nombre}`, tono: -1 }); }
          }
        }
      }
    },
    firmarPaz(E, gid) {
      const g = GRUPOS.find(x => x.id === gid), st = E.ordenPublico.grupos[gid];
      for (const dId of st.control) E.deptos[dId].seguridad = U.clamp(E.deptos[dId].seguridad + 12, 1, 99);
      st.activo = false; st.control = []; st.negociacion = null; st.acuerdoPaz = { t: E.fecha.t };
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
    negociar(E, gid) { E.ordenPublico.grupos[gid].negociacion = { t: E.fecha.t, avance: 0, concesion: 0 }; },
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
          OP.negociar(E, a.grupo);
          const g = GRUPOS.find(x => x.id === a.grupo);
          C.Medios.noticia(E, { tipo: 'ordenpublico', titular: `El Gobierno instala una mesa de negociación de paz con las ${g.sigla}`, tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se instala la mesa de negociación' };
        } });
      A.registrar({ id: 'concesionPaz', nombre: 'Ceder en la mesa de paz', icono: '🤝', grupo: 'ordenpublico', costo: 1,
        disponible(E, a) { const st = E.ordenPublico.grupos[a.grupo]; return (esPresidente(E) === true && st && st.negociacion) ? true : 'No hay una mesa de negociación abierta con ese grupo'; },
        ejecutar(E, a) {
          const st = E.ordenPublico.grupos[a.grupo];
          st.negociacion.concesion = (st.negociacion.concesion || 0) + U.rf(3, 6);
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(0.3, 1), 3, 95);
          return { ok: true, msg: 'El Gobierno cede en la mesa: los diálogos avanzan más rápido, a cambio de críticas de la oposición' };
        } });
    }
  };

  C.OrdenPublico = OP;
  C.Tiempo.registrar('ordenpublico', OP, 60);
  OP.registrarAcciones();
})(window.CURUL);
