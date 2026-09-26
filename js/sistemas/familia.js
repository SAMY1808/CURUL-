/* Familia: los hijos del jugador crecen, estudian y tienen relación propia con él; cuando el
   jugador se retira o fallece, uno de sus hijos adultos puede continuar el legado político —
   o la partida termina ahí, con un resumen de la carrera. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const EDUCACION = ['Bachiller', 'Técnico', 'Profesional', 'Especialización', 'Maestría', 'Doctorado'];

  const Fam = {
    EDUCACION,
    hijos(E) { return (E.jugador.familia || []).filter(f => f.rol === 'Hijo' || f.rol === 'Hija'); },
    adulto: f => f.edad >= 18,
    /* Asegura que cada hijo tenga los campos nuevos (partidas guardadas antes de esta entrega). */
    asegurarDatos(E) {
      const J = E.jugador;
      for (const f of Fam.hijos(E)) {
        if (f.id == null) f.id = U.id('hij');
        if (!f.genero) f.genero = f.rol === 'Hija' ? 'f' : 'm';
        if (f.relacion == null) f.relacion = 60;
        if (!f.educacion) f.educacion = f.edad >= 22 ? 'Profesional' : f.edad >= 17 ? 'Bachiller' : 'Ninguna';
        if (!f.atributos) f.atributos = { carisma: U.ri(35, 70), oratoria: U.ri(35, 70), gestion: U.ri(35, 70), negociacion: U.ri(35, 70), integridad: U.ri(35, 70) };
        if (!f.ideologia) f.ideologia = { eco: U.clamp(J.ideologia.eco + U.gauss(0, 22), -100, 100), soc: U.clamp(J.ideologia.soc + U.gauss(0, 22), -100, 100) };
      }
    },
    /* Cumpleaños: hitos y desgaste natural de la relación si no le dedicas tiempo. */
    turnoAnual(E) {
      Fam.asegurarDatos(E);
      for (const f of Fam.hijos(E)) {
        if (f.edad === 22 && !f.graduado) {
          f.graduado = true;
          if (EDUCACION.indexOf(f.educacion) < 2) f.educacion = 'Profesional';
          C.Medios.noticia(E, { tipo: 'personal', titular: `${f.nombre}, hijo de ${E.jugador.nombre}, se gradúa como ${f.educacion.toLowerCase()}`, tono: 1 });
        }
        f.relacion = U.clamp(f.relacion - 0.8 + U.gauss(0, 0.4), 0, 100);
      }
    },
    /* Peso político de un hijo si heredara la carrera hoy: sólo para mostrarlo en la interfaz. */
    potencial(f) {
      return Math.round((f.atributos.carisma + f.atributos.negociacion + f.relacion) / 3);
    },
    /* ── Fin de la carrera del jugador (retiro voluntario o fallecimiento) ── */
    candidatosSucesion(E) {
      return Fam.hijos(E).filter(f => Fam.adulto(f) && !f.fallecido);
    },
    finDeCarrera(E, motivo) {
      Fam.asegurarDatos(E);
      const J = E.jugador;
      const resumen = {
        nombre: J.nombre, motivo,
        cargoFinal: C.DATA.cargos[J.cargo].nombre,
        anios: U.anio() - J.nac,
        cargosOcupados: (J.ocupados || []).map(o => C.DATA.cargos[o] ? C.DATA.cargos[o].nombre : o),
        eleccionesGanadas: (J.historialElectoral || []).filter(h => h.electo).length,
        leyesAprobadas: (J.historialLegislativo || []).filter(h => h.resultado === 'ley').length,
        patrimonio: J.patrimonio + (C.Propiedades ? C.Propiedades.valorTotal(E) : 0)
      };
      const candidatos = Fam.candidatosSucesion(E);
      if (candidatos.length) E.ui.sucesionPendiente = { motivo, resumen, candidatos: candidatos.map(f => f.id) };
      else E.ui.finPartida = { motivo, resumen };
    },
    /* El hijo elegido asume la vida pública de la familia. Reutiliza Personaje.crear (con un
       origen dedicado) para no dejar el objeto del jugador con campos a medias, y luego le
       superpone lo que sí trae de fábrica: sus propios atributos, ideología y relación con el
       apellido de la familia. */
    heredar(E, hijoId) {
      Fam.asegurarDatos(E);
      const J = E.jugador;
      const hijo = J.familia.find(f => f.id === hijoId); if (!hijo) return null;
      const apellido = J.nombre.trim().split(' ').slice(-1)[0];
      const heredado = Math.round(U.clamp(J.reconocimiento * 0.3, 4, 35));
      const inicioPatrimonio = Math.round(Math.max(25, J.patrimonio * 0.4));
      const hermanos = J.familia.filter(f => f.id !== hijoId && (f.rol === 'Hijo' || f.rol === 'Hija'));
      const legado = { predecesor: J.nombre, cargoMaximo: C.DATA.cargos[J.cargo] ? C.DATA.cargos[J.cargo].nombre : null, apellido, eleccionesGanadas: (J.historialElectoral || []).filter(h => h.electo).length };
      const cfg = {
        nombre: hijo.nombre, genero: hijo.genero, edad: Math.max(18, hijo.edad),
        eco: hijo.ideologia.eco, soc: hijo.ideologia.soc,
        origen: 'heredero', educacion: hijo.educacion === 'Ninguna' ? 'Profesional' : hijo.educacion, profesion: 'Heredero político',
        partido: J.partido, residencia: J.residencia, nacimiento: J.residencia
      };
      const nuevo = C.Personaje.crear(E, cfg);
      Object.assign(nuevo.atributos, hijo.atributos);
      nuevo.reconocimiento = U.clamp(nuevo.reconocimiento + heredado, 0, 100);
      nuevo.patrimonio = inicioPatrimonio;
      nuevo.bienes = [];
      nuevo.familia = [{ rol: J.genero === 'f' ? 'Madre' : 'Padre', nombre: J.nombre, edad: U.anio() - J.nac, id: U.id('fam') }, ...hermanos];
      nuevo.legado = legado;
      C.Personaje.sincronizar(E);
      C.Medios.noticia(E, { tipo: 'personal', titular: `${nuevo.nombre} asume el legado político de la familia ${apellido}`, tono: 1, importante: true, jugador: true });
      return nuevo;
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'pasarTiempoHijo', nombre: 'Pasar tiempo con un hijo', icono: '👨‍👧', grupo: 'familia', costo: 1,
        disponible(E, a) { return Fam.hijos(E).some(f => f.id === a.hijo) ? true : 'Elige un hijo'; },
        ejecutar(E, a) {
          const f = Fam.hijos(E).find(x => x.id === a.hijo);
          f.relacion = U.clamp(f.relacion + U.rf(4, 9), 0, 100);
          E.jugador.bienestar = U.clamp((E.jugador.bienestar || 60) + 4, 0, 100);
          return { ok: true, msg: `Te acercas más a ${f.nombre}` };
        } });
      A.registrar({ id: 'pagarEducacionHijo', nombre: 'Pagar sus estudios', icono: '🎓', grupo: 'familia', costo: 1,
        disponible(E, a) {
          const f = Fam.hijos(E).find(x => x.id === a.hijo); if (!f) return 'Elige un hijo';
          if (f.edad < 16) return 'Aún es muy joven para eso';
          const i = EDUCACION.indexOf(f.educacion === 'Ninguna' ? 'Bachiller' : f.educacion);
          if (i >= EDUCACION.length - 1) return 'Ya tiene el máximo nivel educativo';
          return E.jugador.patrimonio >= 35 ? true : 'Necesitas $35 millones';
        },
        ejecutar(E, a) {
          const f = Fam.hijos(E).find(x => x.id === a.hijo);
          E.jugador.patrimonio -= 35;
          const i = EDUCACION.indexOf(f.educacion === 'Ninguna' ? 'Bachiller' : f.educacion);
          f.educacion = EDUCACION[Math.min(EDUCACION.length - 1, i + 1)];
          f.atributos.gestion = U.clamp(f.atributos.gestion + 5, 0, 100);
          f.relacion = U.clamp(f.relacion + 3, 0, 100);
          return { ok: true, msg: `${f.nombre} avanza: ahora es ${f.educacion.toLowerCase()}` };
        } });
      A.registrar({ id: 'retirarseVida', nombre: 'Retirarte de la vida pública', icono: '🌅', grupo: 'carrera', costo: 0,
        ejecutar(E) { Fam.finDeCarrera(E, 'retiro'); return { ok: true, msg: 'Te retiras de la vida pública' }; } });
      A.registrar({ id: 'elegirSucesor', nombre: 'Continuar el legado', icono: '👪', grupo: 'familia', costo: 0,
        disponible: (E, a) => (E.ui.sucesionPendiente || {}).candidatos && E.ui.sucesionPendiente.candidatos.includes(a.hijo) ? true : 'No disponible',
        ejecutar(E, a) { Fam.heredar(E, a.hijo); E.ui.sucesionPendiente = null; return { ok: true, msg: 'La familia continúa en la vida pública' }; } });
      A.registrar({ id: 'terminarPartida', nombre: 'Terminar aquí', icono: '🏁', grupo: 'familia', costo: 0,
        ejecutar(E) { const p = E.ui.sucesionPendiente; E.ui.finPartida = { motivo: p ? p.motivo : 'retiro', resumen: p ? p.resumen : null }; E.ui.sucesionPendiente = null; return { ok: true, msg: 'Termina la carrera política de la familia' }; } });
    }
  };

  C.Familia = Fam;
  Fam.registrarAcciones();
})(window.CURUL);
