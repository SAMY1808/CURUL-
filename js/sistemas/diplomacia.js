/* Diplomacia: relaciones con los 193 países reales (los 192 miembros de la ONU distintos de
   Colombia, más Kosovo — ver data/paises.js) y con los organismos multilaterales reales de los
   que Colombia hace parte o no (ver data/organismos.js). Sólo jugable si eres presidente
   (Cancillería); además, si eres tú quien ocupa el Ministerio de Relaciones Exteriores, su mesa de
   trabajo (la misma acción genérica de cualquier ministerio) mejora la relación con los países
   destacados peor calificados en vez de un indicador departamental. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TRATADOS = { comercio: 'Tratado de libre comercio', cooperacion: 'Acuerdo de cooperación', defensa: 'Acuerdo de defensa y seguridad' };
  const BASE_REGION = { 'Suramérica': 55, 'Centroamérica y Caribe': 52, 'Norteamérica': 55, 'Europa': 50, 'Asia': 46, 'África': 45, 'Oceanía': 46 };

  const Dip = {
    TRATADOS,
    paises() { return C.DATA.paises; },
    organismos() { return C.DATA.organismos; },
    destacados() { return C.DATA.paises.filter(p => C.DATA.paisesDestacados[p.id]); },
    pais(id) { return C.DATA.paises.find(p => p.id === id); },
    organismo(id) { return C.DATA.organismos.find(o => o.id === id); },
    init(E) {
      const paises = {};
      for (const p of C.DATA.paises) {
        const dest = C.DATA.paisesDestacados[p.id];
        paises[p.id] = { relacion: dest ? dest.relacion : U.ri(Math.round(BASE_REGION[p.region] - 8), Math.round(BASE_REGION[p.region] + 8)), tratados: [] };
      }
      const organismos = {};
      for (const o of C.DATA.organismos) organismos[o.id] = { miembro: o.miembro, postulacion: null, ultimoIntento: null };
      E.diplomacia = { paises, organismos };
    },
    objetivoRelacion(E, pid) {
      const live = E.mundoVivo && E.mundoVivo.paises && E.mundoVivo.paises[pid], dest = live || C.DATA.paisesDestacados[pid]; if (!dest) return null;
      const gob = E.gobierno.presidente === 'J' ? E.jugador.ideologia : (E.politicos[E.gobierno.presidente] || { eco: 0, soc: 0 });
      return U.clamp(70 - U.distIdeo(gob, dest) * 90 + (C.MundoVivo ? C.MundoVivo.bonusRel(E, pid) : 0), 8, 92);
    },
    turno(E) {
      const D = E.diplomacia;
      for (const p of Dip.destacados()) {
        const st = D.paises[p.id], obj = Dip.objetivoRelacion(E, p.id);
        st.relacion = U.clamp(st.relacion + (obj - st.relacion) * 0.03 + U.gauss(0, 0.5), 3, 97);
        if (E.gobierno.presidente === 'J' && U.chance(0.006)) {
          const sube = U.chance(0.5);
          st.relacion = U.clamp(st.relacion + (sube ? 4 : -5), 3, 97);
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: sube ? `Gesto de acercamiento entre Colombia y ${p.nombre}` : `Roce diplomático entre Colombia y ${p.nombre}`, tono: sube ? 1 : -1 });
        }
      }
      // el resto de los países (sin ideología curada) sólo tiene una deriva suave hacia su
      // línea base regional, para que no queden completamente estáticos
      for (const p of C.DATA.paises) {
        if (C.DATA.paisesDestacados[p.id]) continue;
        const st = D.paises[p.id], obj = E.mundoVivo ? Dip.objetivoRelacion(E, p.id) : null;
        st.relacion = U.clamp(st.relacion + (obj != null ? (obj * 0.6 + BASE_REGION[p.region] * 0.4 - st.relacion) * 0.012 : (BASE_REGION[p.region] - st.relacion) * 0.01) + U.gauss(0, 0.25), 3, 97);
      }
      // organismos: postulaciones de ingreso en curso
      for (const o of C.DATA.organismos) {
        const st = D.organismos[o.id];
        if (!st.postulacion) continue;
        st.postulacion.avance = U.clamp(st.postulacion.avance + U.rf(3, 7), 0, 100);
        if (st.postulacion.avance >= 100) Dip.resolverPostulacion(E, o.id);
      }
    },
    resolverPostulacion(E, oid) {
      const o = Dip.organismo(oid), st = E.diplomacia.organismos[oid];
      const exito = U.chance(o.probIngreso || 0.3);
      st.postulacion = null;
      if (exito) {
        st.miembro = true;
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(1, 3), 3, 95);
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia ingresa oficialmente a ${o.sigla}`, tono: 1, importante: true, jugador: true });
      } else {
        C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Se cae la postulación de Colombia a ${o.sigla}`, tono: -1, jugador: true });
      }
    },
    cumbre(E, pid) {
      const p = Dip.pais(pid), st = E.diplomacia.paises[pid];
      st.relacion = U.clamp(st.relacion + U.rf(4, 9), 3, 97);
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(0.2, 0.8), 3, 95);
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Cumbre bilateral entre Colombia y ${p.nombre}: mejoran las relaciones`, tono: 1, importante: true, jugador: true });
      return { relacion: st.relacion };
    },
    firmarTratado(E, pid, tipo) {
      const st = E.diplomacia.paises[pid];
      st.tratados.push(tipo);
      if (tipo === 'cooperacion') for (const d of Object.values(E.deptos)) if (U.chance(0.4)) d.educacion = U.clamp(d.educacion + U.rf(0.3, 1), 1, 99);
      if (tipo === 'defensa') for (const d of Object.values(E.deptos)) d.seguridad = U.clamp(d.seguridad + U.rf(0.2, 0.6), 1, 99);
      st.relacion = U.clamp(st.relacion + U.rf(3, 6), 3, 97);
    },
    mesaExteriores(E) {
      const D = E.diplomacia;
      const candidatos = Dip.destacados().slice().sort((a, b) => D.paises[a.id].relacion - D.paises[b.id].relacion).slice(0, 2);
      for (const p of candidatos) D.paises[p.id].relacion = U.clamp(D.paises[p.id].relacion + U.rf(1, 3), 3, 97);
      E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia + 0.4, 0, 100);
      C.Opinion.subirRec(E, 0.3);
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'La Cancillería adelanta gestiones con el cuerpo diplomático acreditado', tono: 1, jugador: true });
      return { campo: null, txt: 'Gestiones con el cuerpo diplomático: mejora la relación con ' + candidatos.map(p => p.nombre).join(' y ') };
    },
    registrarAcciones() {
      const A = C.Acciones;
      const esPresidente = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente';
      A.registrar({ id: 'cumbreBilateral', nombre: 'Cumbre bilateral', icono: '🌎', grupo: 'diplomacia', costo: 1,
        disponible: esPresidente,
        ejecutar(E, a) {
          const p = Dip.pais(a.pais); if (!p) return { ok: false, msg: 'Elige un país' };
          const r = Dip.cumbre(E, a.pais); return { ok: true, msg: `Cumbre con ${p.nombre}: relación ahora en ${Math.round(r.relacion)}` };
        } });
      A.registrar({ id: 'firmarTratado', nombre: 'Firmar tratado internacional', icono: '📜', grupo: 'diplomacia', costo: 2,
        disponible: esPresidente,
        ejecutar(E, a) {
          const st = E.diplomacia.paises[a.pais]; if (!st) return { ok: false, msg: 'Elige un país' };
          if (!TRATADOS[a.tipo]) return { ok: false, msg: 'Elige un tipo de tratado' };
          if (a.tipo === 'comercio') return { ok: false, msg: 'Los tratados de libre comercio se negocian capítulo por capítulo en la pestaña Comercio' };
          if (st.tratados.includes(a.tipo)) return { ok: false, msg: 'Ya existe ese tratado con este país' };
          if (st.relacion < 45) return { ok: false, msg: 'La relación bilateral es demasiado baja para negociar un tratado' };
          const p = Dip.pais(a.pais); Dip.firmarTratado(E, a.pais, a.tipo);
          return { ok: true, msg: `Se firma ${TRATADOS[a.tipo].toLowerCase()} con ${p.nombre}` };
        } });
      A.registrar({ id: 'ingresarOrganismo', nombre: 'Solicitar ingreso a un organismo', icono: '🏳', grupo: 'diplomacia', costo: 2,
        disponible(E, a) {
          if (esPresidente(E) !== true) return esPresidente(E);
          const o = Dip.organismo(a.organismo); if (!o) return 'Elige un organismo';
          if (a.organismo === 'mercosur') return 'La adhesión al Mercosur se negocia con el bloque en la pestaña Comercio';
          const st = E.diplomacia.organismos[a.organismo];
          if (st.miembro) return 'Colombia ya es miembro';
          if (!o.puedeUnirse) return 'Colombia no es elegible para hacer parte de este organismo';
          if (st.postulacion) return 'Ya hay una postulación en curso';
          if (st.ultimoIntento != null && E.fecha.t - st.ultimoIntento < 20) return `Podrás volver a intentarlo en ${20 - (E.fecha.t - st.ultimoIntento)} semanas`;
          return true;
        },
        ejecutar(E, a) {
          const o = Dip.organismo(a.organismo), st = E.diplomacia.organismos[a.organismo];
          st.postulacion = { t: E.fecha.t, avance: 0 }; st.ultimoIntento = E.fecha.t;
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia solicita formalmente su ingreso a ${o.sigla}`, tono: 0, importante: true, jugador: true });
          return { ok: true, msg: `Se radica la postulación de ingreso a ${o.sigla}` };
        } });
      A.registrar({ id: 'retirarseOrganismo', nombre: 'Retirarse de un organismo', icono: '🚪', grupo: 'diplomacia', costo: 2,
        disponible(E, a) {
          if (esPresidente(E) !== true) return esPresidente(E);
          const o = Dip.organismo(a.organismo); if (!o) return 'Elige un organismo';
          if (a.organismo === 'mercosur') return 'La salida del Mercosur se decide en la pestaña Comercio';
          const st = E.diplomacia.organismos[a.organismo];
          if (!st.miembro) return 'Colombia no es miembro';
          if (!o.puedeRetirarse) return 'No es una decisión que el Gobierno pueda tomar por sí solo';
          return true;
        },
        ejecutar(E, a) {
          const o = Dip.organismo(a.organismo), st = E.diplomacia.organismos[a.organismo];
          st.miembro = false; st.postulacion = null;
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(0.5, 2), 3, 95);
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Colombia se retira de ${o.sigla}`, tono: -1, importante: true, jugador: true });
          return { ok: true, msg: `Colombia se retira de ${o.sigla}` };
        } });
    }
  };

  C.Diplomacia = Dip;
  C.Tiempo.registrar('diplomacia', Dip, 62);
  Dip.registrarAcciones();
})(window.CURUL);
