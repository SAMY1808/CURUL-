/* Constitución reformable: un catálogo curado de artículos clave (no texto libre) que se pueden
   cambiar por dos vías reales — un referendo puntual, o una asamblea nacional constituyente que
   puede empaquetar varios cambios a la vez a cambio de un proceso más largo y más arriesgado. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const ARTICULOS = {
    reeleccion: { pop: { permitida: 3, prohibida: -3 }, nombre: 'Reelección presidencial inmediata', valores: ['prohibida', 'permitida'], defecto: null,
      etiqueta: v => v === 'permitida' ? 'Permitida (una vez)' : v === 'prohibida' ? 'Prohibida' : 'Según la época (regla histórica)' },
    umbralSenado: { pop: { 0.02: 5, 0.03: 0, 0.05: -8 }, nombre: 'Umbral electoral para el Senado', valores: [0.02, 0.03, 0.05], defecto: 0.03,
      etiqueta: v => U.d1(v * 100) + ' %' },
    edadMinimaPresidencia: { pop: { 25: 4, 30: 0, 35: -4 }, nombre: 'Edad mínima para ser presidente', valores: [25, 30, 35], defecto: 30,
      etiqueta: v => v + ' años' },
    autonomiaTerritorial: { pop: { unitaria: -3, descentralizada: 4, federal: 2 }, nombre: 'Autonomía territorial', valores: ['unitaria', 'descentralizada', 'federal'], defecto: 'unitaria',
      etiqueta: v => v === 'federal' ? 'Estado federal' : v === 'descentralizada' ? 'Unitaria descentralizada' : 'Unitaria centralista' },
    votoObligatorio: { pop: { no: 3, si: -9 }, nombre: 'Voto obligatorio', valores: ['no', 'si'], defecto: 'no',
      etiqueta: v => v === 'si' ? 'Obligatorio (multa a quien no vota)' : 'Voluntario' },
    financiacionCampanas: { pop: { privada: -4, mixta: 3, publica: 6 }, nombre: 'Financiación de las campañas', valores: ['privada', 'mixta', 'publica'], defecto: 'privada',
      etiqueta: v => v === 'publica' ? 'Pública (topes bajos, dinero del Estado)' : v === 'mixta' ? 'Mixta (aportes privados y reposición estatal)' : 'Predominantemente privada' },
    sistemaListas: { pop: { preferente: 4, cerrada: -10 }, nombre: 'Listas al Congreso', valores: ['preferente', 'cerrada'], defecto: 'preferente',
      etiqueta: v => v === 'cerrada' ? 'Cerradas y bloqueadas (manda la dirección del partido)' : 'Voto preferente (manda el voto por persona)' },
    revocatoriaPresidencial: { pop: { no: -4, si: 12 }, nombre: 'Revocatoria del mandato presidencial', valores: ['no', 'si'], defecto: 'no',
      etiqueta: v => v === 'si' ? 'Habilitada' : 'No existe (sólo alcaldes y gobernadores)' }
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
    /* Apoyo inicial de una reforma o de un paquete en un proceso de democracia directa. */
    apoyoReforma(E, m, ruido = 0) {
      const base = K.apoyoObjetivo(E);
      if (m.tipo === 'constituyente') return U.clamp(44 + (E.opinion.aprobacionPres - 50) * 0.3 + ruido, 5, 95);
      const cambios = m.tipo === 'ratificacion' ? m.propuestas : [{ articulo: m.articulo, valor: m.valor }];
      const d = U.suma(cambios.map(c => { const a = ARTICULOS[c.articulo]; return a && a.pop ? (a.pop[c.valor] || 0) - (a.pop[K.valor(E, c.articulo)] || 0) : 0; })) / Math.max(1, cambios.length);
      return U.clamp(base + d - (m.tipo === 'ratificacion' ? cambios.length * 1.5 : 0) + (m.promotor === 'gobierno' && E.gobierno.presidente !== 'J' ? 0 : 0) + ruido, 4, 96);
    },
    posturaPartido(E, m, pid) {
      const pa = E.partidos[pid]; if (!pa) return 0;
      const enGob = E.gobierno.coalicion.includes(pid), impulsa = m.promotor === 'gobierno' || m.promotor === 'J' && E.gobierno.presidente === 'J';
      let v = impulsa ? (enGob ? 0.55 : -0.3) : (enGob ? -0.3 : 0.3);
      const arts = m.tipo === 'ratificacion' ? m.propuestas.map(c => c.articulo) : [m.articulo];
      if (arts.includes('sistemaListas') || arts.includes('umbralSenado')) v += pa.popularidad > 9 ? 0.35 : -0.25;
      if (arts.includes('financiacionCampanas')) v += pa.popularidad > 9 ? -0.15 : 0.25;
      if (arts.includes('reeleccion') && enGob) v += 0.2;
      return U.clamp(v, -1, 1);
    },
    /* Resultado de un proceso constitucional: aplica la reforma, arranca la constituyente o ratifica el paquete. */
    aplicarResultado(E, m, r, ef, opin) {
      const K_ = E.constitucion;
      if (m.tipo === 'constituyente') {
        if (r.pasa) { K_.constituyente = { t: E.fecha.t, fase: 'eleccion', propuestas: [] }; ef('Gana el Sí: se convoca la elección de constituyentes'); opin(U.rf(1, 3), 'El país respalda la Constituyente', ''); }
        else { ef('El país no autoriza una Asamblea Constituyente'); opin(-U.rf(1, 3), '', 'Pierdes la consulta sobre la Constituyente'); }
        return;
      }
      const cambios = m.tipo === 'ratificacion' ? m.propuestas : [{ articulo: m.articulo, valor: m.valor }];
      const via = m.tipo === 'ratificacion' ? 'constituyente' : 'referendo';
      if (r.pasa) {
        let n = 0;
        for (const c of cambios) {
          if (C.Corte && C.Corte.tumbaReforma(E, c.articulo, via)) { ef(`La Corte tumba la reforma sobre ${ARTICULOS[c.articulo].nombre.toLowerCase()}`); K_.historial.push({ t: E.fecha.t, articulo: c.articulo, valor: c.valor, via: via + ' (tumbada por la Corte)' }); continue; }
          K.aplicar(E, c.articulo, c.valor, via); n++; ef(`${ARTICULOS[c.articulo].nombre}: ${ARTICULOS[c.articulo].etiqueta(c.valor)}`);
        }
        if (m.tipo === 'ratificacion') { K_.constituyente = null; if (n) C.Medios.noticia(E, { tipo: 'constitucion', titular: `Colombia estrena nueva Constitución: se ratifican ${n} cambio(s)`, tono: 1, importante: true, jugador: true }); }
        if (n && (m.promotor === 'gobierno' || m.promotor === 'J')) opin(U.rf(2, 6), 'Sube la aprobación por la reforma', '');
      } else {
        ef(r.valido ? 'Gana el No: la Constitución no cambia' : 'No se alcanza el umbral de participación: la Constitución no cambia');
        if (m.tipo === 'ratificacion') K_.constituyente = null;
        if (m.promotor === 'gobierno' || m.promotor === 'J') opin(-U.rf(1.5, 4), '', 'Baja la aprobación por perder en las urnas');
      }
      K_.ultimoReferendo = K_.ultimoReferendo || {}; for (const c of cambios) K_.ultimoReferendo[c.articulo] = E.fecha.t;
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
          if (exito && C.Corte && C.Corte.tumbaReforma(E, r.articulo, 'referendo')) {
            E.constitucion.historial.push({ t: E.fecha.t, articulo: r.articulo, valor: r.valor, via: 'referendo (tumbada por la Corte)' });
          } else if (exito) {
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
          if (C.Participacion && c.propuestas.length) { const m = C.Participacion.crear(E, { tipo: 'ratificacion', clave: 'ratif', titulo: 'Ratificación del texto de la Constituyente', propuestas: c.propuestas.slice(), promotor: 'gobierno' }); c.pm = m.id; }
          else if (C.Participacion) { c.fase = null; K_.constituyente = null; C.Medios.noticia(E, { tipo: 'constitucion', titular: 'La Constituyente se disuelve sin proponer cambios', tono: 0, importante: true }); return; }
          C.Medios.noticia(E, { tipo: 'constitucion', titular: 'La Constituyente cierra su texto: se convoca a referendo de ratificación', tono: 0, importante: true });
        } else if (c.fase === 'ratificacion' && c.pm) {
          const m = E.participacion.activos.find(x => x.id === c.pm);
          if (!m || m.estado === 'cerrado') K_.constituyente = null;
        } else if (c.fase === 'ratificacion') {
          c.apoyo = U.clamp(c.apoyo + (K.apoyoObjetivo(E) - c.apoyo) * 0.12 + U.gauss(0, 2) - c.propuestas.length * 0.6, 2, 98);
          if (E.fecha.t - c.tRatificacion >= SEM_RATIFICACION) {
            const exito = U.chance(U.clamp(c.apoyo / 100, 0.05, 0.9));
            if (exito) {
              for (const p of c.propuestas) { if (C.Corte && C.Corte.tumbaReforma(E, p.articulo, 'constituyente')) continue; K.aplicar(E, p.articulo, p.valor, 'constituyente'); }
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
      const desglosar = a => { if (a.cambio && !a.articulo) { const [ar, ...v] = String(a.cambio).split('|'); a.articulo = ar; const vs = v.join('|'), art = ARTICULOS[ar]; a.valor = art ? art.valores.find(x => String(x) === vs) : vs; } return a; };
      const iniciar = (E, a, tipo, promotor) => {
        desglosar(a); const art = ARTICULOS[a.articulo]; if (!art) return { ok: false, msg: 'Elige un cambio' };
        if (!art.valores.includes(a.valor)) return { ok: false, msg: 'Elige un valor válido' };
        if (K.valor(E, a.articulo) === a.valor) return { ok: false, msg: 'Ese ya es el valor vigente' };
        const candado = K.candadoAutonomia(E, a.articulo, a.valor); if (candado !== true) return { ok: false, msg: candado };
        const ult = (E.constitucion.ultimoReferendo || {})[a.articulo];
        if (ult != null && E.fecha.t - ult < 30) return { ok: false, msg: `El país acaba de votar esto: podrás insistir en ${30 - (E.fecha.t - ult)} semanas` };
        if (E.participacion.activos.some(x => x.estado !== 'cerrado' && C.Participacion.esConst(x.tipo) && x.articulo === a.articulo)) return { ok: false, msg: 'Ya hay un proceso en curso sobre ese artículo' };
        const m = C.Participacion.crear(E, { tipo, clave: 'const:' + a.articulo, articulo: a.articulo, valor: a.valor, titulo: `${art.nombre} → ${art.etiqueta(a.valor)}`, promotor });
        C.Medios.noticia(E, { tipo: 'constitucion', titular: promotor === 'gobierno' ? `El Gobierno propone reformar la Constitución: ${art.nombre}` : `Arranca una iniciativa popular para reformar: ${art.nombre}`, tono: 0, importante: true, jugador: true });
        return { ok: true, msg: promotor === 'gobierno' ? 'Se presenta la reforma: aval del Senado, control de la Corte y referendo' : 'Se inscribe el comité: a reunir firmas' };
      };
      A.registrar({ id: 'promoverReformaPopular', nombre: 'Promover reforma constitucional por firmas', icono: '✍', grupo: 'constitucion', costo: 2,
        disponible(E) { return C.Participacion.habilitado('constitucional'); },
        ejecutar(E, a) { return iniciar(E, a, 'constitucionalPopular', 'J'); } });
      A.registrar({ id: 'convocarReferendo', nombre: 'Convocar referendo constitucional', icono: '🗳', grupo: 'constitucion', costo: 3,
        disponible(E) {
          if (esPresidente(E) !== true) return esPresidente(E);
          return E.constitucion.constituyente ? 'Hay una Asamblea Constituyente en curso' : true;
        },
        ejecutar(E, a) { return iniciar(E, a, 'constitucional', 'gobierno'); } });
      A.registrar({ id: 'convocarConstituyente', nombre: 'Convocar consulta para una Constituyente', icono: '📜', grupo: 'constitucion', costo: 5,
        disponible(E, a) { if (esPresidente(E) !== true) return esPresidente(E); if (E.constitucion.constituyente) return 'Ya hay una Asamblea Constituyente en curso'; return E.participacion.activos.some(x => x.tipo === 'constituyente' && x.estado !== 'cerrado') ? 'Ya hay una consulta en curso' : C.Participacion.habilitado('constitucional'); },
        ejecutar(E) {
          C.Participacion.crear(E, { tipo: 'constituyente', clave: 'constituyente', titulo: '¿Convoca el pueblo una Asamblea Nacional Constituyente?', promotor: 'gobierno' });
          C.Medios.noticia(E, { tipo: 'constitucion', titular: 'El Gobierno propone consultar al país sobre una Asamblea Nacional Constituyente', tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se abre el trámite: aval del Senado, control de la Corte y consulta popular (33 % del censo)' };
        } });
      A.registrar({ id: 'proponerArticuloConstituyente', nombre: 'Proponer cambio en la Constituyente', icono: '✍', grupo: 'constitucion', costo: 1,
        disponible(E) {
          const c = E.constitucion.constituyente;
          if (!c || c.fase !== 'redaccion') return 'La Constituyente no está redactando un texto ahora mismo';
          if (c.propuestas.length >= 3) return 'El paquete ya tiene el máximo de 3 cambios';
          return true;
        },
        ejecutar(E, a) {
          const c = E.constitucion.constituyente; desglosar(a);
          const art = ARTICULOS[a.articulo]; if (!art) return { ok: false, msg: 'Elige un artículo' };
          if (!art.valores.includes(a.valor)) return { ok: false, msg: 'Elige un valor válido' };
          if (c.propuestas.some(p => p.articulo === a.articulo)) return { ok: false, msg: 'Ya incluiste ese artículo en el paquete' };
          const candado = K.candadoAutonomia(E, a.articulo, a.valor); if (candado !== true) return { ok: false, msg: candado };
          c.propuestas.push({ articulo: a.articulo, valor: a.valor });
          return { ok: true, msg: `Se incluye en el paquete: ${art.nombre} → ${art.etiqueta(a.valor)}` };
        } });
    }
  };

  C.Constitucion = K;
  C.Tiempo.registrar('constitucion', K, 63);
  K.registrarAcciones();
})(window.CURUL);
