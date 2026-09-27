/* Constitución reformable: un catálogo curado de artículos clave (no texto libre) que se pueden
   cambiar por dos vías reales — un referendo puntual, o una asamblea nacional constituyente que
   puede empaquetar varios cambios a la vez a cambio de un proceso más largo y más arriesgado. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const ARTICULOS = {
    reeleccion: { nombre: 'Reelección presidencial inmediata', valores: ['prohibida', 'permitida'], defecto: null,
      etiqueta: v => v === 'permitida' ? 'Permitida (una vez)' : v === 'prohibida' ? 'Prohibida' : 'Según la época (regla histórica)' },
    umbralSenado: { nombre: 'Umbral electoral para el Senado', valores: [0.02, 0.03, 0.05], defecto: 0.03,
      etiqueta: v => U.d1(v * 100) + ' %' },
    edadMinimaPresidencia: { nombre: 'Edad mínima para ser presidente', valores: [25, 30, 35], defecto: 30,
      etiqueta: v => v + ' años' },
    autonomiaTerritorial: { nombre: 'Autonomía territorial', valores: ['unitaria', 'descentralizada', 'federal'], defecto: 'unitaria',
      etiqueta: v => v === 'federal' ? 'Estado federal' : v === 'descentralizada' ? 'Unitaria descentralizada' : 'Unitaria centralista' }
  };
  const SEM_REFERENDO = 16, SEM_ELECCION_CONST = 8, SEM_REDACCION_MAX = 14, SEM_RATIFICACION = 10;

  const K = {
    ARTICULOS,
    init(E) { E.constitucion = { articulos: {}, referendo: null, constituyente: null, historial: [] }; },
    valor(E, id) {
      const v = E.constitucion.articulos[id];
      return v !== undefined ? v : ARTICULOS[id].defecto;
    },
    /* La autonomía territorial sólo se mueve entre unitaria y descentralizada por la vía
       constitucional normal; llegar a "federal" exige el proceso dedicado de federalización
       (transferencia de competencias, ver js/sistemas/federalizacion.js), y una vez alcanzado es
       irreversible por un solo referendo o constituyente — no hay vuelta atrás fácil. */
    candadoAutonomia(E, articulo, valor) {
      if (articulo !== 'autonomiaTerritorial') return true;
      if (K.valor(E, 'autonomiaTerritorial') === 'federal') return 'Colombia ya es un Estado federal: revertirlo no cabe en un solo referendo o constituyente';
      if (valor === 'federal') return 'El paso a Estado federal exige el proceso de federalización (transferencia de competencias), no un solo referendo o constituyente';
      return true;
    },
    aplicar(E, id, valor, via) {
      E.constitucion.articulos[id] = valor;
      E.constitucion.historial.push({ t: E.fecha.t, articulo: id, valor, via });
    },
    apoyoObjetivo(E) {
      return U.clamp(50 + (E.opinion.aprobacionPres - 50) * 0.7, 5, 95);
    },
    turno(E) {
      const K_ = E.constitucion;
      if (K_.referendo) {
        const r = K_.referendo;
        r.apoyo = U.clamp(r.apoyo + (K.apoyoObjetivo(E) - r.apoyo) * 0.12 + U.gauss(0, 2), 2, 98);
        if (E.fecha.t - r.t >= SEM_REFERENDO) {
          const exito = U.chance(U.clamp(r.apoyo / 100, 0.05, 0.92));
          const art = ARTICULOS[r.articulo];
          if (exito) {
            K.aplicar(E, r.articulo, r.valor, 'referendo');
            E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(2, 6), 3, 95);
            C.Medios.noticia(E, { tipo: 'constitucion', titular: `El referendo pasa: ${art.nombre} queda en «${art.etiqueta(r.valor)}»`, tono: 1, importante: true, jugador: true });
          } else {
            E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(1, 3), 3, 95);
            C.Medios.noticia(E, { tipo: 'constitucion', titular: `El referendo sobre ${art.nombre.toLowerCase()} no pasa en las urnas`, tono: -1, importante: true, jugador: true });
          }
          K_.ultimoReferendo = K_.ultimoReferendo || {}; K_.ultimoReferendo[r.articulo] = E.fecha.t;
          K_.referendo = null;
        }
      }
      if (K_.constituyente) {
        const c = K_.constituyente;
        if (c.fase === 'eleccion' && E.fecha.t - c.t >= SEM_ELECCION_CONST) {
          c.fase = 'redaccion'; c.tRedaccion = E.fecha.t;
          C.Medios.noticia(E, { tipo: 'constitucion', titular: 'Instalada la Asamblea Nacional Constituyente', tono: 0, importante: true });
        } else if (c.fase === 'redaccion' && E.fecha.t - c.tRedaccion >= SEM_REDACCION_MAX) {
          c.fase = 'ratificacion'; c.tRatificacion = E.fecha.t; c.apoyo = K.apoyoObjetivo(E);
          C.Medios.noticia(E, { tipo: 'constitucion', titular: 'La Constituyente cierra su texto: se convoca a referendo de ratificación', tono: 0, importante: true });
        } else if (c.fase === 'ratificacion') {
          c.apoyo = U.clamp(c.apoyo + (K.apoyoObjetivo(E) - c.apoyo) * 0.12 + U.gauss(0, 2) - c.propuestas.length * 0.6, 2, 98);
          if (E.fecha.t - c.tRatificacion >= SEM_RATIFICACION) {
            const exito = U.chance(U.clamp(c.apoyo / 100, 0.05, 0.9));
            if (exito) {
              for (const p of c.propuestas) K.aplicar(E, p.articulo, p.valor, 'constituyente');
              E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(4, 10), 3, 95);
              C.Medios.noticia(E, { tipo: 'constitucion', titular: `Colombia estrena nueva Constitución: se ratifican ${c.propuestas.length} cambio(s)`, tono: 1, importante: true, jugador: true });
            } else {
              E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(3, 7), 3, 95);
              C.Medios.noticia(E, { tipo: 'constitucion', titular: 'El país rechaza en las urnas el texto de la nueva Constitución', tono: -1, importante: true, jugador: true });
            }
            K_.constituyente = null;
          }
        }
      }
    },
    registrarAcciones() {
      const A = C.Acciones;
      const esPresidente = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente';
      const procesoLibre = E => {
        if (E.constitucion.referendo) return 'Ya hay un referendo constitucional en curso';
        if (E.constitucion.constituyente) return 'Ya hay una Asamblea Constituyente en curso';
        return true;
      };
      A.registrar({ id: 'convocarReferendo', nombre: 'Convocar referendo constitucional', icono: '🗳', grupo: 'constitucion', costo: 3,
        disponible(E, a) {
          if (esPresidente(E) !== true) return esPresidente(E);
          const lib = procesoLibre(E); if (lib !== true) return lib;
          const art = ARTICULOS[a.articulo]; if (!art) return 'Elige un artículo';
          if (!art.valores.includes(a.valor)) return 'Elige un valor válido';
          if (K.valor(E, a.articulo) === a.valor) return 'Ese ya es el valor vigente';
          const candado = K.candadoAutonomia(E, a.articulo, a.valor); if (candado !== true) return candado;
          const ult = (E.constitucion.ultimoReferendo || {})[a.articulo];
          if (ult != null && E.fecha.t - ult < 30) return `El país acaba de votar esto: podrás insistir en ${30 - (E.fecha.t - ult)} semanas`;
          return true;
        },
        ejecutar(E, a) {
          E.constitucion.referendo = { t: E.fecha.t, articulo: a.articulo, valor: a.valor, apoyo: K.apoyoObjetivo(E) };
          C.Medios.noticia(E, { tipo: 'constitucion', titular: `El Gobierno convoca un referendo para reformar: ${ARTICULOS[a.articulo].nombre}`, tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se convoca el referendo; el país vota en unos meses' };
        } });
      A.registrar({ id: 'convocarConstituyente', nombre: 'Convocar Asamblea Constituyente', icono: '📜', grupo: 'constitucion', costo: 5,
        disponible(E, a) { if (esPresidente(E) !== true) return esPresidente(E); return procesoLibre(E); },
        ejecutar(E) {
          E.constitucion.constituyente = { t: E.fecha.t, fase: 'eleccion', propuestas: [] };
          C.Medios.noticia(E, { tipo: 'constitucion', titular: 'El Gobierno convoca una Asamblea Nacional Constituyente', tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se convoca la elección de constituyentes' };
        } });
      A.registrar({ id: 'proponerArticuloConstituyente', nombre: 'Proponer cambio en la Constituyente', icono: '✍', grupo: 'constitucion', costo: 1,
        disponible(E, a) {
          const c = E.constitucion.constituyente;
          if (!c || c.fase !== 'redaccion') return 'La Constituyente no está redactando un texto ahora mismo';
          const art = ARTICULOS[a.articulo]; if (!art) return 'Elige un artículo';
          if (!art.valores.includes(a.valor)) return 'Elige un valor válido';
          if (c.propuestas.some(p => p.articulo === a.articulo)) return 'Ya incluiste ese artículo en el paquete';
          if (c.propuestas.length >= 3) return 'El paquete ya tiene el máximo de 3 cambios';
          const candado = K.candadoAutonomia(E, a.articulo, a.valor); if (candado !== true) return candado;
          return true;
        },
        ejecutar(E, a) {
          E.constitucion.constituyente.propuestas.push({ articulo: a.articulo, valor: a.valor });
          return { ok: true, msg: `Se incluye en el paquete: ${ARTICULOS[a.articulo].nombre} → ${ARTICULOS[a.articulo].etiqueta(a.valor)}` };
        } });
    }
  };

  C.Constitucion = K;
  C.Tiempo.registrar('constitucion', K, 63);
  K.registrarAcciones();
})(window.CURUL);
