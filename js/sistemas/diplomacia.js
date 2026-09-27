/* Diplomacia: relaciones con países ficticios, cumbres bilaterales y tratados internacionales.
   Sólo jugable si eres presidente (Cancillería); además, si eres tú quien ocupa el Ministerio de
   Relaciones Exteriores, su mesa de trabajo (la misma acción genérica de cualquier ministerio)
   mejora la relación con los países peor calificados en vez de un indicador departamental. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const PAISES = [
    { id: 'vga', nombre: 'Vecindia', eco: -20, soc: 10 },
    { id: 'nte', nombre: 'Estados del Norte', eco: 55, soc: -10 },
    { id: 'aus', nombre: 'Unión Australina', eco: -10, soc: -30 },
    { id: 'est', nombre: 'República del Este', eco: -60, soc: -40 },
    { id: 'lus', nombre: 'Reino de Lusitania', eco: 20, soc: 20 }
  ];
  const TRATADOS = { comercio: 'Tratado de libre comercio', cooperacion: 'Acuerdo de cooperación', defensa: 'Acuerdo de defensa y seguridad' };

  const Dip = {
    PAISES, TRATADOS,
    init(E) {
      const paises = {};
      for (const p of PAISES) paises[p.id] = { relacion: U.ri(40, 65), tratados: [] };
      E.diplomacia = { paises };
    },
    objetivoRelacion(E, pid) {
      const p = PAISES.find(x => x.id === pid);
      const gob = E.gobierno.presidente === 'J' ? E.jugador.ideologia : (E.politicos[E.gobierno.presidente] || { eco: 0, soc: 0 });
      return U.clamp(70 - U.distIdeo(gob, p) * 90, 10, 90);
    },
    turno(E) {
      const D = E.diplomacia;
      for (const p of PAISES) {
        const st = D.paises[p.id], obj = Dip.objetivoRelacion(E, p.id);
        st.relacion = U.clamp(st.relacion + (obj - st.relacion) * 0.03 + U.gauss(0, 0.5), 3, 97);
        if (E.gobierno.presidente === 'J' && U.chance(0.006)) {
          const sube = U.chance(0.5);
          st.relacion = U.clamp(st.relacion + (sube ? 4 : -5), 3, 97);
          C.Medios.noticia(E, { tipo: 'diplomacia', titular: sube ? `Gesto de acercamiento entre Colombia y ${p.nombre}` : `Roce diplomático entre Colombia y ${p.nombre}`, tono: sube ? 1 : -1 });
        }
      }
      let comercios = 0;
      for (const p of PAISES) if (D.paises[p.id].tratados.includes('comercio')) comercios++;
      if (comercios) C.Economia.aplicarDelta(E, 'crecimiento', comercios * 0.0025);
    },
    cumbre(E, pid) {
      const p = PAISES.find(x => x.id === pid), st = E.diplomacia.paises[pid];
      st.relacion = U.clamp(st.relacion + U.rf(4, 9), 3, 97);
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(0.2, 0.8), 3, 95);
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: `Cumbre bilateral entre Colombia y ${p.nombre}: mejoran las relaciones`, tono: 1, importante: true, jugador: true });
      return { relacion: st.relacion };
    },
    firmarTratado(E, pid, tipo) {
      const st = E.diplomacia.paises[pid];
      st.tratados.push(tipo);
      if (tipo === 'comercio') C.Economia.aplicarDelta(E, 'crecimiento', 0.15);
      if (tipo === 'cooperacion') for (const d of Object.values(E.deptos)) if (U.chance(0.4)) d.educacion = U.clamp(d.educacion + U.rf(0.3, 1), 1, 99);
      if (tipo === 'defensa') for (const d of Object.values(E.deptos)) d.seguridad = U.clamp(d.seguridad + U.rf(0.2, 0.6), 1, 99);
      st.relacion = U.clamp(st.relacion + U.rf(3, 6), 3, 97);
    },
    mesaExteriores(E) {
      const D = E.diplomacia;
      const candidatos = PAISES.slice().sort((a, b) => D.paises[a.id].relacion - D.paises[b.id].relacion).slice(0, 2);
      for (const p of candidatos) D.paises[p.id].relacion = U.clamp(D.paises[p.id].relacion + U.rf(1, 3), 3, 97);
      E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia + 0.4, 0, 100);
      C.Opinion.subirRec(E, 0.3);
      C.Medios.noticia(E, { tipo: 'diplomacia', titular: 'La Cancillería adelanta gestiones con el cuerpo diplomático acreditado', tono: 1, jugador: true });
      return { campo: null };
    },
    registrarAcciones() {
      const A = C.Acciones;
      const esPresidente = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente';
      A.registrar({ id: 'cumbreBilateral', nombre: 'Cumbre bilateral', icono: '🌎', grupo: 'diplomacia', costo: 1,
        disponible: (E, a) => esPresidente(E) !== true ? esPresidente(E) : (E.diplomacia.paises[a.pais] ? true : 'Elige un país'),
        ejecutar(E, a) { const p = PAISES.find(x => x.id === a.pais); const r = Dip.cumbre(E, a.pais); return { ok: true, msg: `Cumbre con ${p.nombre}: relación ahora en ${Math.round(r.relacion)}` }; } });
      A.registrar({ id: 'firmarTratado', nombre: 'Firmar tratado internacional', icono: '📜', grupo: 'diplomacia', costo: 2,
        disponible(E, a) {
          if (esPresidente(E) !== true) return esPresidente(E);
          const st = E.diplomacia.paises[a.pais]; if (!st) return 'Elige un país';
          if (!TRATADOS[a.tipo]) return 'Elige un tipo de tratado';
          if (st.tratados.includes(a.tipo)) return 'Ya existe ese tratado con este país';
          if (st.relacion < 45) return 'La relación bilateral es demasiado baja para negociar un tratado';
          return true;
        },
        ejecutar(E, a) { const p = PAISES.find(x => x.id === a.pais); Dip.firmarTratado(E, a.pais, a.tipo); return { ok: true, msg: `Se firma ${TRATADOS[a.tipo].toLowerCase()} con ${p.nombre}` }; } });
    }
  };

  C.Diplomacia = Dip;
  C.Tiempo.registrar('diplomacia', Dip, 62);
  Dip.registrarAcciones();
})(window.CURUL);
