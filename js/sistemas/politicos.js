/* IA política: creación de políticos con personalidad y comportamiento autónomo semanal. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const P = {
    /* Crea un político. `o` puede fijar partido, depto, cargo, ideología, edad… */
    crear(E, o = {}) {
      const N = C.DATA.nombres;
      const genero = o.genero || (U.chance(0.36) ? 'f' : 'm');
      const partido = E.partidos[o.partido];
      const base = partido ? { eco: partido.eco, soc: partido.soc } : { eco: 0, soc: 0 };
      // Algunos políticos pertenecen a una facción concreta de su partido
      let faccion = null;
      if (partido && partido.facciones.length) {
        faccion = U.pesado(partido.facciones, f => f.peso);
        base.eco = faccion.eco; base.soc = faccion.soc;
      }
      const p = {
        id: o.id || U.id('p'),
        nombre: o.nombre || (U.pick(genero === 'f' ? N.m : N.h) + ' ' + U.pick(N.a) + (U.chance(0.55) ? ' ' + U.pick(N.a) : '')),
        genero,
        nac: o.nac || (U.anio() - (o.edad || U.ri(32, 68))),
        depto: o.depto || U.pesado(C.DATA.departamentos, d => d.poblacion).id,
        partido: o.partido || null,
        faccion: faccion ? faccion.id : null,
        eco: U.clamp(Math.round(o.eco != null ? o.eco : base.eco + U.gauss(0, 12)), -100, 100),
        soc: U.clamp(Math.round(o.soc != null ? o.soc : base.soc + U.gauss(0, 14)), -100, 100),
        r: {  // rasgos 0-100
          amb: U.ri(20, 95), dis: U.ri(25, 95), pra: U.ri(15, 95),
          car: U.ri(20, 95), int: U.ri(20, 95), exp: U.ri(10, 90)
        },
        profesion: U.pick(C.DATA.profesiones),
        intereses: U.barajar(Object.keys(C.DATA.sectores)).slice(0, 2),
        relJ: Math.round(U.gauss(0, 8)),          // relación con el jugador
        asistencia: U.rf(0.72, 0.98),
        fuerza: U.ri(25, 80),                      // arrastre electoral personal
        cargo: o.cargo || null,
        stats: { radicados: 0, aprobados: 0, votos: 0, ausencias: 0, intervenciones: 0, debates: 0 },
        tray: [],
        retrato: U.ri(1, 1e6),
        activo: true
      };
      if (o.r) Object.assign(p.r, o.r);
      E.politicos[p.id] = p;
      return p;
    },
    edad: (p) => U.anio() - p.nac,
    nombreCorto: p => { const s = p.nombre.split(' '); return s[0] + ' ' + (s[1] || ''); },
    anotar(p, txt) { p.tray.push({ t: C.E.fecha.t, txt }); if (p.tray.length > 12) p.tray.shift(); },
    /* Todos los congresistas activos de una cámara */
    deCamara(E, cam) { return E.congreso[cam].curules.map(c => E.politicos[c.pol]).filter(Boolean); },
    etiquetaCargo(E, p) {
      const c = p.cargo; if (!c) return 'Sin cargo';
      const def = C.DATA.cargos[c.tipo];
      let t = def ? def.nombre : c.tipo;
      if (c.tipo === 'representante' && c.circ) t += ' · ' + C.Congreso.nombreCirc(c.circ);
      if (c.tipo === 'ministro' && c.ministerio) t = 'Ministro de ' + C.Gobierno.todosMinisterios(E).find(m => m.id === c.ministerio).nombre;
      if ((c.tipo === 'gobernador' || c.tipo === 'alcalde') && c.depto) t += ' · ' + (c.tipo === 'alcalde' ? E.deptos[c.depto].capital : E.deptos[c.depto].nombre);
      return t;
    },

    /* ── Comportamiento autónomo semanal ── */
    turno(E) {
      const U_ = U;
      const pols = Object.values(E.politicos);
      const anio = U.anio();
      const hoy = U.hoy();
      const nuevoAnio = U.fechaDe(E.fecha.t - 1).getUTCFullYear() !== anio;

      for (const p of pols) {
        if (!p.activo || p.id === 'J') continue;
        // La relación con el jugador vuelve lentamente a neutral
        if (p.relJ) p.relJ = Math.round(p.relJ * 0.995 * 100) / 100;
        // Historial acumulado: qué cargos ha ocupado alguna vez y cuántos años en total, para
        // saber más adelante quién es "notable" (dinastías, Salón de la Fama).
        if (p.cargo) {
          p.honores = p.honores || {};
          p.honores[p.cargo.tipo] = true;
          if (nuevoAnio) p.aniosServicio = (p.aniosServicio || 0) + 1;
        }
        // Retiro por edad (evaluado una vez al año, si no ocupa un cargo)
        if (nuevoAnio && !p.cargo && P.edad(p) > 72 && U_.chance(0.3)) {
          p.activo = false; P.anotar(p, 'Se retira de la vida pública');
          P.posibleDinastia(E, p);
        }
      }

      // Congresistas presentan proyectos, hacen control político o declaraciones
      if (C.Congreso.enSesion(E)) {
        const congresistas = [...P.deCamara(E, 'senado'), ...P.deCamara(E, 'camara')].filter(p => p.id !== 'J');
        const nRad = U.ri(0, 2);
        for (let i = 0; i < nRad; i++) {
          const autor = U.pesado(congresistas, p => p.r.amb * (p.r.exp + 30));
          if (autor) C.Legislacion.radicarIA(E, autor);
        }
        // Debate de control político de la oposición
        if (U.chance(0.25)) {
          const opos = congresistas.filter(p => E.partidos[p.partido] && E.partidos[p.partido].postura === 'oposicion');
          const citante = U.pesado(opos, p => p.r.amb);
          if (citante) C.Gobierno.debateControl(E, citante, null);
        }
      }

      // Transfuguismo: sólo en la ventana previa a la inscripción de listas al Congreso
      const prox = C.Elecciones.proxima(E, 'congreso');
      if (prox) {
        const semanasFalta = U.turnoDe(prox.fecha) - E.fecha.t;
        if (semanasFalta > 16 && semanasFalta < 30 && U.chance(0.15)) P.transfuguismo(E);
      }
      if (hoy.getUTCMonth() === 0 && hoy.getUTCDate() <= 7) for (const p of pols) if (p.cargo && p.cargo.tipo === 'aspirante') p.fuerza = U.clamp(p.fuerza + U.ri(-3, 3), 10, 90);
      if (U.chance(0.05)) P.anuncioAmbicion(E);
      if (U.chance(0.035)) P.escandaloPropio(E);
    },
    /* Ambición propia: un político con cargo y mucha ambición anuncia que aspira a un cargo
       superior en el próximo ciclo. Si otro de su mismo partido ya anunció lo mismo, nace una
       rivalidad entre ambos (con su propio desgaste de relación). */
    ESCALON: { concejal: 'alcalde', diputado: 'gobernador', representante: 'senador', alcalde: 'gobernador', gobernador: 'presidencia', senador: 'presidencia', ministro: 'presidencia' },
    anuncioAmbicion(E) {
      const cands = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && P.ESCALON[p.cargo.tipo] && !p.aspiraAnuncio && p.r.amb > 68);
      const p = U.pesado(cands, x => x.r.amb * x.r.amb);
      if (!p) return;
      const destino = P.ESCALON[p.cargo.tipo];
      // El escalón a la presidencia se llama 'presidencia' aquí pero el cargo se llama 'presidente'.
      const nombreDestino = C.DATA.cargos[destino === 'presidencia' ? 'presidente' : destino].nombre;
      p.aspiraAnuncio = { destino, t: E.fecha.t };
      const rival = p.partido ? Object.values(E.politicos).find(o => o.activo && o.id !== p.id && o.partido === p.partido && o.aspiraAnuncio && o.aspiraAnuncio.destino === destino && !o.rivalCon && !p.rivalCon) : null;
      if (rival) {
        p.rivalCon = rival.id; rival.rivalCon = p.id;
        p.relJ = U.clamp((p.relJ || 0) - 3, -100, 100); rival.relJ = U.clamp((rival.relJ || 0) - 3, -100, 100);
        C.Medios.noticia(E, { tipo: 'partidos', titular: `${p.nombre} y ${rival.nombre} chocan por la candidatura del ${E.partidos[p.partido].sigla} a ${nombreDestino}`, tono: 0, importante: true });
        P.anotar(p, `Rivalidad con ${rival.nombre} por ${nombreDestino}`);
        P.anotar(rival, `Rivalidad con ${p.nombre} por ${nombreDestino}`);
      } else {
        C.Medios.noticia(E, { tipo: 'partidos', titular: `${p.nombre} deja ver su ambición: aspira a ${nombreDestino}`, tono: 0 });
        P.anotar(p, `Anuncia aspiraciones a ${nombreDestino}`);
      }
    },
    /* Escándalos propios de los políticos NPC (no sólo del jugador): más probable cuanto menos
       íntegro es el político (rasgo `r.int`, hasta ahora sin uso). Reutiliza Gobierno.vacante
       para la sucesión de curul si el escándalo le cuesta el cargo. */
    ESCANDALOS: ['un contrato cuestionado', 'presunto tráfico de influencias', 'gastos irregulares de campaña', 'nepotismo en su equipo', 'un viaje pagado por un contratista'],
    escandaloPropio(E) {
      const cands = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo);
      const p = U.pesado(cands, x => Math.max(1, 100 - x.r.int));
      if (!p) return;
      const grave = U.chance(0.22);
      const motivo = U.pick(P.ESCANDALOS);
      p.fuerza = U.clamp(p.fuerza - U.ri(3, 10), 5, 100);
      if (p.partido && E.partidos[p.partido]) E.partidos[p.partido].popularidad = U.clamp(E.partidos[p.partido].popularidad - U.rf(0.05, 0.25), 0.3, 45);
      E.opinion.escandalos += 0.1;
      C.Medios.noticia(E, { tipo: 'escandalo', titular: `Sale a la luz ${motivo} de ${p.nombre}${grave ? ': la Fiscalía anuncia que investigará' : ''}`, tono: -1, importante: grave });
      P.anotar(p, `Escándalo: ${motivo}`);
      if (grave && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante') && U.chance(0.3)) {
        C.Gobierno.vacante(E, p);
        p.activo = false; p.cargo = null;
        C.Medios.noticia(E, { tipo: 'escandalo', titular: `${p.nombre} renuncia a su curul en medio del escándalo`, tono: -1, importante: true });
        P.posibleDinastia(E, p);
      }
    },

    /* ── Dinastías políticas ──
       Cuando un político NPC notable (con honores de cargo alto o una carrera larga) sale de la
       vida pública, hay una posibilidad de que un hijo herede parte de su arrastre electoral y se
       estrene en política con el mismo apellido — un eco simplificado, sin diálogo propio, del
       sistema de Familia del jugador (Fase 6). */
    HONORES_ALTOS: ['presidente', 'expresidente', 'gobernador', 'senador', 'ministro'],
    notable(p) { const h = p.honores || {}; return P.HONORES_ALTOS.some(t => h[t]) || (p.aniosServicio || 0) >= 8; },
    posibleDinastia(E, p) {
      if (p.heredero || !P.notable(p) || !U.chance(0.35)) return;
      const N = C.DATA.nombres;
      const genero = U.chance(0.5) ? 'f' : 'm';
      const apellido = p.nombre.trim().split(' ').slice(-1)[0];
      const nombre = U.pick(genero === 'f' ? N.m : N.h) + ' ' + apellido;
      const heredero = P.crear(E, {
        nombre, genero, edad: U.ri(28, 40),
        partido: E.partidos[p.partido] && !E.partidos[p.partido].disuelto ? p.partido : null,
        depto: p.depto,
        eco: U.clamp(p.eco + U.gauss(0, 10), -100, 100),
        soc: U.clamp(p.soc + U.gauss(0, 10), -100, 100),
        cargo: { tipo: 'aspirante', aspira: 'camara' }
      });
      heredero.fuerza = U.clamp(Math.round(p.fuerza * 0.45 + U.ri(5, 15)), 15, 70);
      heredero.dinastia = { padre: p.id, padreNombre: p.nombre, apellido };
      p.heredero = heredero.id;
      C.Medios.noticia(E, { tipo: 'partidos', titular: `${nombre}, de la familia ${apellido}, se estrena en política tras la salida de ${p.nombre}`, tono: 1 });
      P.anotar(p, `Su hijo/a ${nombre} entra en política`);
    },

    transfuguismo(E) {
      const cands = [...P.deCamara(E, 'senado'), ...P.deCamara(E, 'camara')].filter(p => p.id !== 'J' && p.partido && p.partido !== 'IND' && E.partidos[p.partido] && !p.proximoPartido);
      const p = U.pesado(cands, p => {
        const pa = E.partidos[p.partido];
        return U.distIdeo(p, pa) * (100 - p.r.dis) * (p.r.amb / 50);
      });
      if (!p) return;
      const origen = E.partidos[p.partido];
      const destinos = Object.values(E.partidos).filter(x => x.id !== p.partido && !x.especial && !x.futuro);
      const dest = destinos.sort((a, b) => U.distIdeo(p, a) - U.distIdeo(p, b) - (b.popularidad - a.popularidad) * 0.01)[0];
      if (!dest || U.distIdeo(p, dest) > U.distIdeo(p, origen) - 0.05) return;
      if (p.proximoPartido) return;
      // Por la prohibición de doble militancia, el cambio se hace efectivo en la próxima inscripción de listas
      p.proximoPartido = dest.id;
      P.anotar(p, 'Anuncia que aspirará por el ' + dest.sigla + ' (deja el ' + origen.sigla + ')');
      C.Medios.noticia(E, { tipo: 'partidos', titular: `${p.nombre} anuncia que dejará el ${origen.sigla} y aspirará por el ${dest.nombre}`, tono: 0, ref: { pol: p.id } });
      C.Bus.emit('politico:transfuga', { pol: p.id, de: origen.id, a: dest.id });
    }
  };

  C.Politicos = P;
  C.Tiempo.registrar('politicos', P, 40);
})(window.CURUL);
