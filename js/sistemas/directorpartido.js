/* Director de partido: cuando el jugador ganó la dirección nacional (Fase 5) deja de pedirle el
   aval a otro y pasa a repartirlo él.

   · Listas al Congreso: decide quién va en la lista del partido al Senado y a la Cámara de cada
     departamento. Inscribir a gente que suma votos (o fichar a una figura regional, mediática o
     técnica pagando con las finanzas del partido) sube la votación de la lista; llenarla de nombres
     flojos la baja. Vetar a un congresista en ejercicio le cuesta la relación y, si es ambicioso,
     puede irse a otro partido.
   · Avales uninominales: elige a quién respalda el partido para la Presidencia, cada gobernación y
     cada alcaldía. Negar el aval a un aspirante ambicioso puede convertirlo en disidente que corre
     por firmas y le quita votos al candidato oficial.
   Nada de esto le cambia el juego a un partido que dirige otro: sólo aplica si `pa.lider === 'J'`. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const FICHAJES = {
    regional: { n: 'Líder regional con arrastre', costo: 400, desc: 'Gran fuerza en su departamento, poca fama nacional.' },
    mediatica: { n: 'Figura mediática', costo: 1200, desc: 'Muchos votos por su nombre, pero poco recorrido y más riesgo de escándalo.' },
    tecnico: { n: 'Técnico con trayectoria', costo: 700, desc: 'Credibilidad y experiencia; suma menos votos de entrada.' }
  };
  const LIMITE_LISTA = 30;

  const Dir = {
    FICHAJES,
    esDirector(E) { const pa = E.partidos[E.jugador.partido]; return !!pa && pa.lider === 'J'; },
    partido(E) { const pa = E.partidos[E.jugador.partido]; if (pa) Dir.asegurar(pa); return pa; },
    asegurar(pa) { pa.dirListas = pa.dirListas || {}; pa.avalUni = pa.avalUni || {}; pa.avalesNegados = pa.avalesNegados || []; return pa; },
    claveLista: (camara, dId) => camara === 'senado' ? 'senado' : 'camara:' + dId,
    lista(pa, camara, dId) { Dir.asegurar(pa); const k = Dir.claveLista(camara, dId); return pa.dirListas[k] = pa.dirListas[k] || { inscritos: [], vetados: [] }; },
    /* Fuerza electoral estimada de un candidato en lista (la misma base del voto preferente, sin azar). */
    est(p) {
      const inc = p.cargo && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante') ? 15 : 0;
      return Math.round(p.fuerza + p.r.car * 0.3 + p.r.exp * 0.1 + inc);
    },
    /* Lo que necesita formarLista: los inscritos y vetados de la dirección, sólo si el jugador dirige el partido. */
    configLista(E, pid, camara, dId) {
      const pa = E.partidos[pid]; if (!pa || pa.lider !== 'J' || !pa.dirListas) return null;
      const l = pa.dirListas[Dir.claveLista(camara, dId)]; return l && (l.inscritos.length || l.vetados.length) ? l : null;
    },
    /* Multiplicador de los votos de la lista según la calidad de quienes inscribió el director. */
    multLista(E, pid, camara, dId) {
      const l = Dir.configLista(E, pid, camara, dId); if (!l) return 1;
      const top = l.inscritos.map(id => E.politicos[id]).filter(p => p && p.activo).map(Dir.est).sort((a, b) => b - a).slice(0, 6);
      return 1 + U.clamp(U.suma(top.map(e => (e - 55) / 55 * 0.018)), -0.06, 0.14);
    },
    /* Candidatos posibles para una lista, con su aporte estimado de votos y su estado actual. */
    pool(E, camara, dId) {
      const pa = Dir.partido(E), l = Dir.lista(pa, camara, dId), El = C.Elecciones;
      const cargosOk = camara === 'senado' ? ['senador', 'representante', 'gobernador', 'alcalde', 'ministro'] : ['representante', 'diputado', 'alcalde', 'concejal'];
      const propio = camara === 'senado' ? 'senador' : 'representante';
      const filas = C.Partidos.miembros(E, pa.id).filter(p => {
        if (p.id === 'J' || !El.edadOK(p) || !p.cargo) return false;
        if (camara === 'camara' && p.depto !== dId) return false;
        if (p.cargo.tipo === 'aspirante') return p.cargo.aspira === camara;
        return cargosOk.includes(p.cargo.tipo);
      }).map(p => ({ p, est: Dir.est(p), estado: l.inscritos.includes(p.id) ? 'inscrito' : l.vetados.includes(p.id) ? 'vetado' : 'libre', incumbente: p.cargo.tipo === propio }));
      return filas.sort((a, b) => b.est - a.est).slice(0, 22);
    },
    curulesEsperadas(E, camara, dId) {
      const pa = Dir.partido(E);
      if (camara === 'senado') return Math.round(pa.popularidad);
      return Math.max(0, Math.round(C.Elecciones.cuotas(E, dId, false)[pa.id] * E.deptos[dId].camara * 10) / 10);
    },
    inscribir(E, polId, camara, dId) {
      const pa = Dir.partido(E), p = E.politicos[polId], l = Dir.lista(pa, camara, dId);
      l.vetados = l.vetados.filter(x => x !== polId);
      if (!l.inscritos.includes(polId)) l.inscritos.push(polId);
      if (camara === 'senado' && p.cargo && p.cargo.tipo === 'representante') p.aspiraOtro = 'senado';
      p.relJ = U.clamp((p.relJ || 0) + 4, -100, 100);
      return { ok: true, msg: `${p.nombre} queda inscrito/a en la lista (aporte estimado ${Dir.est(p)})` };
    },
    vetar(E, polId, camara, dId) {
      const pa = Dir.partido(E), p = E.politicos[polId], l = Dir.lista(pa, camara, dId);
      l.inscritos = l.inscritos.filter(x => x !== polId);
      if (!l.vetados.includes(polId)) l.vetados.push(polId);
      const incumbente = p.cargo && p.cargo.tipo === (camara === 'senado' ? 'senador' : 'representante');
      p.relJ = U.clamp((p.relJ || 0) - (incumbente ? 14 : 6), -100, 100);
      let msg = `${p.nombre} queda por fuera de la lista`;
      if (incumbente && p.r.amb > 55 && !p.proximoPartido && U.chance(0.5)) {
        const otros = Object.values(E.partidos).filter(x => !x.especial && !x.futuro && x.id !== pa.id);
        const dest = otros.sort((a, b) => U.distIdeo(p, a) - U.distIdeo(p, b))[0];
        if (dest) {
          p.proximoPartido = dest.id; pa.cohesion = U.clamp(pa.cohesion - 1.5, 0, 100);
          C.Politicos.anotar(p, `Queda por fuera de la lista del ${pa.sigla} y se va al ${dest.sigla}`);
          C.Medios.noticia(E, { tipo: 'partidos', titular: `${p.nombre} se va al ${dest.sigla} tras quedar por fuera de la lista del ${pa.sigla}`, tono: -1, importante: true, jugador: true });
          msg += ` y se va al ${dest.sigla}`;
        }
      }
      return { ok: true, msg };
    },
    fichar(E, tipo, camara, dId) {
      const pa = Dir.partido(E), f = FICHAJES[tipo];
      pa.finanzas -= f.costo;
      const depto = camara === 'senado' ? U.pesado(C.DATA.departamentos, d => d.poblacion).id : dId;
      const p = C.Politicos.crear(E, { partido: pa.id, depto, cargo: { tipo: 'aspirante', aspira: camara } });
      if (tipo === 'regional') { p.fuerza = U.ri(58, 74); p.r.car = U.ri(45, 70); p.r.exp = U.ri(30, 55); }
      if (tipo === 'mediatica') { p.fuerza = U.ri(64, 82); p.r.car = U.ri(70, 92); p.r.exp = U.ri(10, 30); p.r.int = U.ri(20, 55); p.profesion = 'Figura mediática'; }
      if (tipo === 'tecnico') { p.fuerza = U.ri(48, 62); p.r.car = U.ri(40, 60); p.r.exp = U.ri(65, 90); p.r.int = U.ri(65, 95); p.profesion = 'Técnico'; }
      p.fichaje = { por: 'J', t: E.fecha.t, tipo };
      const l = Dir.lista(pa, camara, dId); l.inscritos.push(p.id);
      C.Politicos.anotar(p, `Fichado/a por ${E.jugador.nombre} para la lista del ${pa.sigla}`);
      C.Medios.noticia(E, { tipo: 'partidos', titular: `El ${pa.sigla} ficha a ${p.nombre} (${f.n.toLowerCase()}) para su lista`, tono: 1, jugador: true });
      return { ok: true, msg: `Fichas a ${p.nombre}: aporte estimado ${Dir.est(p)} (costo $${U.n(f.costo)} millones)`, pol: p.id };
    },

    /* ── Avales uninominales ── */
    claveAval: (cargo, depto) => cargo + ':' + (depto || 'NAC'),
    avalUni(E, pid, cargo, depto) {
      const pa = E.partidos[pid]; if (!pa || pa.lider !== 'J' || !pa.avalUni) return null;
      const av = pa.avalUni[Dir.claveAval(cargo, depto)]; const p = av && E.politicos[av.pol];
      return p && p.activo ? p : null;
    },
    aspirantes(E, cargo, depto) {
      const pa = Dir.partido(E), destino = { presidencia: 'presidencia', gobernacion: 'gobernador', alcaldia: 'alcalde' }[cargo];
      const tipos = { presidencia: ['ministro', 'senador', 'gobernador', 'aspirante', 'representante'], gobernacion: ['diputado', 'alcalde', 'representante', 'aspirante', 'senador'], alcaldia: ['concejal', 'aspirante', 'diputado', 'representante'] }[cargo];
      const av = Dir.avalUni(E, pa.id, cargo, depto);
      return C.Partidos.miembros(E, pa.id).filter(p => p.id !== 'J' && C.Elecciones.edadOK(p) && p.cargo && tipos.includes(p.cargo.tipo)
        && (cargo === 'presidencia' || p.depto === depto)
        && (p.cargo.tipo !== 'aspirante' || p.cargo.aspira === (cargo === 'presidencia' ? 'presidencia' : cargo)))
        .map(p => ({ p, est: Dir.est(p), ambicion: !!(p.aspiraAnuncio && p.aspiraAnuncio.destino === destino), avalado: !!(av && av.id === p.id),
          negado: pa.avalesNegados.some(n => n.pol === p.id && n.cargo === cargo && n.depto === (depto || null)) }))
        .sort((a, b) => (b.ambicion - a.ambicion) || (b.est - a.est)).slice(0, 8);
    },
    otorgarAval(E, polId, cargo, depto) {
      const pa = Dir.asegurar(Dir.partido(E)), p = E.politicos[polId], k = Dir.claveAval(cargo, depto);
      const previo = pa.avalUni[k] && E.politicos[pa.avalUni[k].pol];
      if (previo && previo.id !== polId) {
        previo.relJ = U.clamp((previo.relJ || 0) - 12, -100, 100);
        if (previo.r.amb > 55 && U.chance(0.45)) Dir.volverDisidente(E, previo, cargo, depto);
      }
      pa.avalUni[k] = { pol: polId, t: E.fecha.t };
      pa.avalesNegados = pa.avalesNegados.filter(n => !(n.pol === polId && n.cargo === cargo && n.depto === (depto || null)));
      p.disidente = null; p.fuerza = U.clamp(p.fuerza + 5, 5, 100); p.relJ = U.clamp((p.relJ || 0) + 12, -100, 100);
      C.Politicos.anotar(p, `Recibe el aval del ${pa.sigla} para ${Dir.nombreCargo(E, cargo, depto)}`);
      C.Medios.noticia(E, { tipo: 'partidos', titular: `El ${pa.sigla} avala a ${p.nombre} para ${Dir.nombreCargo(E, cargo, depto)}`, tono: 1, importante: cargo === 'presidencia', jugador: true });
      return { ok: true, msg: `${p.nombre} recibe el aval del partido` };
    },
    negarAval(E, polId, cargo, depto) {
      const pa = Dir.asegurar(Dir.partido(E)), p = E.politicos[polId], k = Dir.claveAval(cargo, depto);
      if (pa.avalUni[k] && pa.avalUni[k].pol === polId) delete pa.avalUni[k];
      if (!pa.avalesNegados.some(n => n.pol === polId && n.cargo === cargo && n.depto === (depto || null))) pa.avalesNegados.push({ pol: polId, cargo, depto: depto || null, t: E.fecha.t });
      p.relJ = U.clamp((p.relJ || 0) - 15, -100, 100);
      let msg = `${p.nombre} se queda sin el aval del partido`;
      if (p.r.amb > 60 && U.chance(0.45)) { Dir.volverDisidente(E, p, cargo, depto); msg += ' y anuncia que irá por firmas'; }
      return { ok: true, msg };
    },
    volverDisidente(E, p, cargo, depto) {
      p.disidente = { cargo, depto: depto || null, t: E.fecha.t };
      C.Politicos.anotar(p, `Rompe con la dirección del partido y va por firmas a ${Dir.nombreCargo(E, cargo, depto)}`);
      C.Medios.noticia(E, { tipo: 'partidos', titular: `${p.nombre} rompe con la dirección de su partido y aspira por firmas a ${Dir.nombreCargo(E, cargo, depto)}`, tono: -1, importante: true, jugador: true });
      const pa = E.partidos[p.partido]; if (pa) pa.cohesion = U.clamp(pa.cohesion - 1, 0, 100);
    },
    nombreCargo(E, cargo, depto) {
      if (cargo === 'presidencia') return 'la Presidencia';
      const d = E.deptos[depto]; return cargo === 'gobernacion' ? `la Gobernación de ${d.nombre}` : `la Alcaldía de ${d.capital}`;
    },

    registrarAcciones() {
      const A = C.Acciones;
      const dirige = E => Dir.esDirector(E) || 'Debes dirigir tu partido';
      const cam = a => a.camara === 'senado' || a.camara === 'camara';
      const polMiembro = (E, id) => { const p = E.politicos[id], pa = Dir.partido(E); return p && p.activo && p.partido === pa.id ? p : null; };
      A.registrar({ id: 'inscribirEnLista', nombre: 'Inscribir', icono: '➕', grupo: 'partidos', costo: 1,
        disponible(E, a) {
          const ok = dirige(E); if (ok !== true) return ok;
          if (!cam(a) || !polMiembro(E, a.pol)) return 'Ese político ya no está en tu partido';
          const l = Dir.lista(Dir.partido(E), a.camara, a.depto);
          if (l.inscritos.includes(a.pol)) return 'Ya está inscrito';
          return l.inscritos.length >= LIMITE_LISTA ? 'La lista ya está llena' : true;
        },
        ejecutar(E, a) { return Dir.inscribir(E, a.pol, a.camara, a.depto); } });
      A.registrar({ id: 'vetarEnLista', nombre: 'Vetar', icono: '🚫', grupo: 'partidos', costo: 1,
        disponible(E, a) {
          const ok = dirige(E); if (ok !== true) return ok;
          if (!cam(a) || !polMiembro(E, a.pol)) return 'Ese político ya no está en tu partido';
          return Dir.lista(Dir.partido(E), a.camara, a.depto).vetados.includes(a.pol) ? 'Ya está vetado' : true;
        },
        ejecutar(E, a) { return Dir.vetar(E, a.pol, a.camara, a.depto); } });
      A.registrar({ id: 'ficharCandidato', nombre: 'Fichar candidato', icono: '🧲', grupo: 'partidos', costo: 2,
        disponible(E, a) { const ok = dirige(E); if (ok !== true) return ok; return cam(a) ? true : 'Elige una lista'; },
        ejecutar(E, a) {
          const f = FICHAJES[a.tipo]; if (!f) return { ok: false, msg: 'Elige qué perfil quieres fichar' };
          const pa = Dir.partido(E);
          if (pa.finanzas < f.costo) return { ok: false, msg: `Las finanzas del partido no alcanzan: cuesta $${U.n(f.costo)} millones` };
          if (Dir.lista(pa, a.camara, a.depto).inscritos.length >= LIMITE_LISTA) return { ok: false, msg: 'La lista ya está llena' };
          return Dir.fichar(E, a.tipo, a.camara, a.depto);
        } });
      const avalOk = (E, a) => {
        const ok = dirige(E); if (ok !== true) return ok;
        if (!['presidencia', 'gobernacion', 'alcaldia'].includes(a.cargo)) return 'Elige un cargo';
        return polMiembro(E, a.pol) ? true : 'Ese político ya no está en tu partido';
      };
      A.registrar({ id: 'otorgarAval', nombre: 'Otorgar aval', icono: '✅', grupo: 'partidos', costo: 1,
        disponible(E, a) { const ok = avalOk(E, a); if (ok !== true) return ok; const av = Dir.avalUni(E, Dir.partido(E).id, a.cargo, a.depto); return av && av.id === a.pol ? 'Ya tiene el aval' : true; },
        ejecutar(E, a) { return Dir.otorgarAval(E, a.pol, a.cargo, a.depto); } });
      A.registrar({ id: 'negarAval', nombre: 'Negar aval', icono: '⛔', grupo: 'partidos', costo: 1,
        disponible(E, a) {
          const ok = avalOk(E, a); if (ok !== true) return ok;
          return Dir.partido(E).avalesNegados.some(n => n.pol === a.pol && n.cargo === a.cargo && n.depto === (a.depto || null)) ? 'Ya le negaste el aval' : true;
        },
        ejecutar(E, a) { return Dir.negarAval(E, a.pol, a.cargo, a.depto); } });
    }
  };

  C.Director = Dir;
  Dir.registrarAcciones();
})(window.CURUL);
