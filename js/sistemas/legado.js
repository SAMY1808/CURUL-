/* Legado: lo que dejas atrás. Fundaciones que trabajan una causa y suben con tus aportes, libros que
   toman semanas de escritura, y un veredicto de la historia que suma leyes, cargos, elecciones,
   fundaciones, libros, aprobación como Presidente y hasta lo que restan los escándalos. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const CAUSAS = {
    educacion: { n: 'Educación', icono: '🎓', seg: { universitarios: 1, jovenes: 1 } },
    salud: { n: 'Salud', icono: '⚕', seg: { bajos: 1, mayores: 1 } },
    ambiente: { n: 'Medio ambiente', icono: '🌱', seg: { jovenes: 1, urbano: 0.5 } },
    paz: { n: 'Paz y reconciliación', icono: '🕊', seg: { rural: 1, bajos: 0.5 } },
    cultura: { n: 'Cultura y arte', icono: '🎭', seg: { medios: 1, universitarios: 0.5 } },
    campo: { n: 'Desarrollo rural', icono: '🌾', seg: { rural: 1.5, informales: 0.5 } }
  };
  const LIBROS = { memorias: 'Memorias políticas', ideas: 'Ensayo de ideas', historia: 'Historia del país', propuesta: 'Programa de gobierno' };
  const TITULOS = [[220, 'Estadista de la nación'], [140, 'Figura histórica'], [80, 'Líder de referencia'], [40, 'Político respetado'], [10, 'Político de paso'], [-1e9, 'Una nota al pie']];

  const L = {
    CAUSAS, LIBROS,
    asegurar(J) { if (!J.legado) J.legado = { fundaciones: [], libros: [], enCurso: null }; return J.legado; },
    puntos(E) {
      const J = E.jugador, l = L.asegurar(J), nivel = c => (C.DATA.cargos[c] || { nivel: 0 }).nivel || 0;
      const leyes = (J.historialLegislativo || []).filter(h => h.resultado === 'ley').length;
      const ap = (E.series.aprobacion || []).map(x => x[1]);
      let p = leyes * 3 + U.suma((J.ocupados || []).map(c => nivel(c) * 4)) + (J.historialElectoral || []).filter(h => h.electo).length * 2
        + U.suma(l.fundaciones.map(f => f.nivel * 3)) + l.libros.length * 4 - J.escandalos.length * 4 + (J.reconocimientos || []).length * 2;
      if (E.gobierno.presidente === 'J' && ap.length) p += (U.prom(ap.slice(-260)) - 40) * 0.6;
      return Math.round(p);
    },
    titulo(p) { return TITULOS.find(t => p >= t[0])[1]; },
    turno(E) {
      const J = E.jugador, l = L.asegurar(J);
      for (const f of l.fundaciones) {
        C.Opinion.subirRec(E, 0.01 * f.nivel);
        if (U.chance(0.05)) C.Opinion.moverImagen(E, { seg: Object.fromEntries(Object.entries(CAUSAS[f.causa].seg).map(([k, v]) => [k, 0.15 * v * f.nivel])) });
      }
      const b = l.enCurso;
      if (b && E.fecha.t - b.t0 >= 12) {
        l.enCurso = null; l.libros.push({ tema: b.tema, t: E.fecha.t });
        const exito = U.chance(0.35 + J.atributos.oratoria / 250 + J.rep.competencia / 500);
        C.Opinion.subirRec(E, exito ? U.rf(3, 6) : U.rf(1, 2)); J.credibilidad = U.clamp(J.credibilidad + (exito ? 3 : 1), 0, 100);
        if (exito) J.patrimonio += U.ri(15, 80);
        C.Medios.noticia(E, { tipo: 'general', titular: `${J.nombre} publica «${LIBROS[b.tema]}»${exito ? ' y es un éxito de ventas' : ''}`, tono: 1, jugador: true, importante: exito });
        J.reconocimientos.push({ t: E.fecha.t, txt: `Publica un libro: ${LIBROS[b.tema]}` });
      }
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'crearFundacion', nombre: 'Crear una fundación', icono: '🏛', grupo: 'personal', costo: 2,
        ejecutar(E, a) {
          const J = E.jugador, l = L.asegurar(J), c = CAUSAS[a.causa]; if (!c) return { ok: false, msg: 'Elige la causa' };
          if (l.fundaciones.some(f => f.causa === a.causa)) return { ok: false, msg: 'Ya tienes una fundación para esa causa' };
          if (l.fundaciones.length >= 3) return { ok: false, msg: 'Tres fundaciones ya son mucho que administrar' };
          if (J.patrimonio < 250) return { ok: false, msg: `Necesitas ${U.cop(250)}` };
          J.patrimonio -= 250; l.fundaciones.push({ causa: a.causa, t: E.fecha.t, nivel: 1 });
          return { ok: true, msg: `Nace tu fundación de ${c.n.toLowerCase()}` };
        } });
      A.registrar({ id: 'aportarFundacion', nombre: 'Aportar a la fundación', icono: '💝', grupo: 'personal', costo: 1,
        ejecutar(E, a) {
          const J = E.jugador, f = L.asegurar(J).fundaciones.find(x => x.causa === a.causa); if (!f) return { ok: false, msg: 'Elige la fundación' };
          if (f.nivel >= 5) return { ok: false, msg: 'La fundación ya alcanzó su máximo' };
          const costo = 100 * f.nivel; if (J.patrimonio < costo) return { ok: false, msg: `Necesitas ${U.cop(costo)}` };
          J.patrimonio -= costo; f.nivel++; return { ok: true, msg: `La fundación crece: nivel ${f.nivel}` };
        } });
      A.registrar({ id: 'escribirLibro', nombre: 'Escribir un libro', icono: '📖', grupo: 'personal', costo: 2,
        ejecutar(E, a) {
          const J = E.jugador, l = L.asegurar(J); if (!LIBROS[a.tema]) return { ok: false, msg: 'Elige el tema' };
          if (l.enCurso) return { ok: false, msg: 'Ya estás escribiendo un libro' };
          if (J.patrimonio < 30) return { ok: false, msg: `Necesitas ${U.cop(30)}` };
          J.patrimonio -= 30; l.enCurso = { tema: a.tema, t0: E.fecha.t };
          return { ok: true, msg: 'Te pones a escribir: saldrá en 12 semanas' };
        } });
    }
  };
  C.Legado = L;
  C.Tiempo.registrar('legado', L, 77);
  L.registrarAcciones();
})(window.CURUL);
