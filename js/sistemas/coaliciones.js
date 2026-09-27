/* Coaliciones preelectorales: antes de inscribirte, puedes negociar el respaldo de otros
   partidos a cambio de un puesto concreto si ganas (un ministerio, una secretaría, apoyo en
   comisión). Cuando dos o más partidos ya se aliaron, en vez de que tú decidas solo quién es el
   candidato, se resuelve con una consulta interpartidista — una noche de resultados más, con un
   representante de cada partido aliado compitiendo por la candidatura única de la coalición. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const OFRECIMIENTOS = {
    ninguno: { n: 'Sólo respaldo político', nivel: 0, cargos: ['presidencia', 'gobernacion', 'alcaldia', 'senado', 'camara'] },
    ministerio: { n: 'Un ministerio', nivel: 0.22, cargos: ['presidencia'] },
    secretaria: { n: 'Una secretaría', nivel: 0.16, cargos: ['gobernacion', 'alcaldia'] },
    comite: { n: 'Apoyo en comisión', nivel: 0.08, cargos: ['senado', 'camara'] }
  };

  const Coal = {
    OFRECIMIENTOS,
    clave: (cargo, depto) => cargo + ':' + (depto || 'NAC'),
    mapa(E) { return E.elecciones.coaliciones || (E.elecciones.coaliciones = {}); },
    pre(E, cargo, depto) {
      const m = Coal.mapa(E), k = Coal.clave(cargo, depto);
      return m[k] || (m[k] = { cargo, depto: depto || null, partidos: [] });
    },
    limpiar(E, cargo, depto) { delete Coal.mapa(E)[Coal.clave(cargo, depto)]; },
    aliados(E, cargo, depto) { return Coal.pre(E, cargo, depto).partidos.filter(p => p.aceptado); },
    ofrecimientosValidos(cargo) { return Object.entries(OFRECIMIENTOS).filter(([, o]) => o.cargos.includes(cargo)).map(([k]) => k); },
    probAceptar(E, partido, cargo, ofrecimiento) {
      const J = E.jugador, pa = E.partidos[partido]; if (!pa) return 0;
      const afin = 1 - U.distIdeo(pa, J.ideologia);
      const nivel = (OFRECIMIENTOS[ofrecimiento] || { nivel: 0 }).nivel;
      return U.clamp(0.1 + afin * 0.42 + nivel + (pa.relJ || 0) / 300, 0.03, 0.85);
    },
    proponer(E, cargo, depto, partido, ofrecimiento) {
      const pre = Coal.pre(E, cargo, depto);
      if (partido === E.jugador.partido) return { ok: false, msg: 'Ya es tu propio partido' };
      if (pre.partidos.some(p => p.partido === partido)) return { ok: false, msg: 'Ya negociaste con ese partido para esta elección' };
      const prob = Coal.probAceptar(E, partido, cargo, ofrecimiento);
      const acepta = U.chance(prob);
      pre.partidos.push({ partido, ofrecimiento, aceptado: acepta, t: E.fecha.t });
      const pa = E.partidos[partido];
      if (acepta) { pa.relJ = U.clamp((pa.relJ || 0) + 4, -100, 100); C.Medios.noticia(E, { tipo: 'partidos', titular: `El ${pa.sigla} respalda la aspiración de ${E.jugador.nombre}`, tono: 1, jugador: true }); }
      else { pa.relJ = U.clamp((pa.relJ || 0) - 2, -100, 100); C.Medios.noticia(E, { tipo: 'partidos', titular: `El ${pa.sigla} declina respaldar a ${E.jugador.nombre} por ahora`, tono: -1, jugador: true }); }
      return { ok: true, acepta, prob };
    },

    /* Un representante por cada partido aliado, para competir en la consulta interpartidista. */
    rivales(E, cargo, depto, aliados) {
      const El = C.Elecciones, out = [];
      for (const al of aliados) {
        if (cargo === 'senado') { const l = El.formarLista(E, al.partido, 'senado', null, 3).filter(p => p.id !== 'J'); if (l[0]) out.push(l[0]); }
        else if (cargo === 'camara') { const l = El.formarLista(E, al.partido, 'camara', depto, 3).filter(p => p.id !== 'J'); if (l[0]) out.push(l[0]); }
        else {
          const pool = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.partido === al.partido && (cargo === 'presidencia' || p.depto === depto));
          out.push(pool.length ? pool.sort((a, b) => (b.fuerza + b.r.car) - (a.fuerza + a.r.car))[0]
            : C.Politicos.crear(E, { partido: al.partido, depto: cargo === 'presidencia' ? U.pesado(C.DATA.departamentos, d => d.poblacion).id : depto, cargo: { tipo: 'aspirante', aspira: cargo } }));
        }
      }
      return out;
    },
    /* Consulta interpartidista: mismo espíritu que una consulta interna, pero el pool de rivales
       sale de cada partido aliado, no sólo del propio. */
    consulta(E, cargo, depto) {
      const aliados = Coal.aliados(E, cargo, depto);
      const nivel = (cargo === 'senado' || cargo === 'presidencia') ? 'nac' : 'dep';
      const rivales = Coal.rivales(E, cargo, depto, aliados);
      const El = C.Elecciones, Pa = C.Partidos;
      const cand = [{ id: 'J', nombre: E.jugador.nombre, partido: E.jugador.partido, fuerza: El.fuerzaJugador(E, cargo === 'senado' || cargo === 'presidencia' ? null : depto) }]
        .concat(rivales.map(r => ({ id: r.id, nombre: r.nombre, partido: r.partido, fuerza: r.fuerza })));
      cand.forEach(c => c.peso = Pa.peso(E, c.id === 'J' ? E.politicos.J : E.politicos[c.id])[nivel]);
      const pesos = cand.map(c => Math.pow(c.peso * 0.6 + c.fuerza * 0.4 + 5, 1.5) * Math.exp(U.gauss(0, 0.28)));
      const tot = U.suma(pesos);
      cand.forEach((c, i) => c.pct = pesos[i] / tot * 100);
      cand.sort((a, b) => b.pct - a.pct);
      return { cargo, depto, candidatos: cand, gana: cand[0].id === 'J', aliados };
    },

    /* ── Cumplir lo pactado al asumir el cargo ── */
    cumplirPresidencia(E) {
      const cam = E.elecciones.ultimaCampana;
      if (!cam || !cam.coalicion || !cam.coalicion.length) return;
      const libres = C.Gobierno.todosMinisterios(E).map(m => m.id);
      let i = 0;
      for (const c of cam.coalicion) {
        if (c.ofrecimiento !== 'ministerio') continue;
        const minId = libres[i++]; if (!minId) break;
        C.Gobierno.designar(E, minId, c.partido, true);
        if (!E.gobierno.coalicion.includes(c.partido)) E.gobierno.coalicion.push(c.partido);
        E.partidos[c.partido].postura = 'gobierno';
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `El ${E.partidos[c.partido].sigla} recibe el Ministerio de ${C.Gobierno.todosMinisterios(E).find(m => m.id === minId).nombre}, tal como se pactó en campaña`, tono: 1, importante: true });
      }
    },
    cumplirLocal(E, depto, organo) {
      const cam = E.elecciones.ultimaCampana;
      if (!cam || !cam.coalicion || !cam.coalicion.length) return;
      const GL = C.GobiernoLocal, g = GL.asegurar(E, depto, organo);
      const secs = GL.secretariasDe(g).map(s => s.id);
      let i = 0;
      for (const c of cam.coalicion) {
        if (c.ofrecimiento !== 'secretaria') continue;
        const secId = secs[i++]; if (!secId) break;
        GL.designarSecretario(E, depto, organo, secId, c.partido);
        C.Medios.noticia(E, { tipo: 'regional', titular: `El ${E.partidos[c.partido].sigla} recibe una secretaría, tal como se pactó en campaña`, tono: 1 });
      }
    },

    registrarAcciones() {
      C.Acciones.registrar({ id: 'proponerCoalicion', nombre: 'Negociar coalición', icono: '🤝', grupo: 'campana', costo: 1,
        disponible(E) {
          return E.elecciones.campana ? 'Ya tienes una campaña inscrita: negocia antes de inscribirte' : true;
        },
        ejecutar(E, a) {
          if (!a.cargo) return { ok: false, msg: 'Elige un cargo' };
          if (!a.partido || !E.partidos[a.partido] || E.partidos[a.partido].especial) return { ok: false, msg: 'Elige un partido' };
          if (!Coal.ofrecimientosValidos(a.cargo).includes(a.ofrecimiento)) return { ok: false, msg: 'Elige qué ofreces' };
          const r = Coal.proponer(E, a.cargo, a.depto || null, a.partido, a.ofrecimiento);
          if (!r.ok) return r;
          const pa = E.partidos[a.partido];
          return { ok: true, msg: r.acepta ? `El ${pa.sigla} se suma a tu coalición` : `El ${pa.sigla} no acepta (probabilidad era ${Math.round(r.prob * 100)}%)`, exito: r.acepta };
        } });
    }
  };
  C.Coaliciones = Coal;
  Coal.registrarAcciones();
  C.Bus.on('gobierno:posesion', g => { const E = C.E; if (E && g.presidente === 'J') Coal.cumplirPresidencia(E); });
  C.Bus.on('jugador:cargo', tipo => {
    const E = C.E; if (!E || (tipo !== 'gobernador' && tipo !== 'alcalde')) return;
    Coal.cumplirLocal(E, E.jugador.cargoInfo.depto, tipo === 'gobernador' ? 'gobernacion' : 'alcaldia');
  });
})(window.CURUL);
