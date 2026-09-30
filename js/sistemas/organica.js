/* Estructura orgánica del partido: si el jugador dirige el partido puede armar un equipo —Secretaría General,
   Tesorería, jefatura electoral, comunicaciones, escuela de formación y dirección jurídica— y una red de
   directorios departamentales. Cada cargo lo ocupa un militante (su capacidad y lealtad cuentan), cuesta caja
   semana a semana y rinde: cohesión, mejor recaudo, cuadros nuevos, menos escándalos financieros y, sobre todo,
   un despliegue electoral más fuerte en cada departamento (multiplica la cuota de votos del partido allí). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const CARGOS = {
    secretaria: { n: 'Secretaría General', icono: '🗂', costo: 2.5, txt: 'Coordina el partido día a día: sube la cohesión y hace más eficaz al resto del equipo.' },
    tesoreria: { n: 'Tesorería', icono: '💰', costo: 2, txt: 'Ordena las finanzas: más recaudo de los militantes y menos riesgo de escándalo por la plata.' },
    electoral: { n: 'Jefatura electoral y logística', icono: '🗳', costo: 3, txt: 'Testigos, transporte y maquinaria el día de la elección: multiplica el rendimiento de las listas.' },
    comunicaciones: { n: 'Comunicaciones y redes', icono: '📣', costo: 2, txt: 'Mensaje y redes del partido: sube poco a poco su popularidad.' },
    formacion: { n: 'Escuela de formación política', icono: '🎓', costo: 2, txt: 'Forma cuadros: cada seis meses aparecen nuevos aspirantes preparados.' },
    juridica: { n: 'Dirección jurídica', icono: '⚖', costo: 2, txt: 'Blinda al partido: reduce la probabilidad y el costo de escándalos y sanciones.' }
  };
  const Org = {
    CARGOS,
    esDirector(E) { const pa = E.partidos[E.jugador.partido]; return !!pa && pa.lider === 'J'; },
    partido(E) { return E.partidos[E.jugador.partido]; },
    asegurar(pa) { if (!pa.organica) pa.organica = { cargos: {}, presencia: {}, coord: {}, hist: [], ultConvencion: -999 }; return pa.organica; },
    init() {}, migrar() {},
    calidad(p) { return p ? U.clamp(p.r.int * 0.35 + p.r.exp * 0.35 + p.r.car * 0.15 + (50 + (p.relJ || 0) / 2) * 0.15, 5, 100) : 0; },
    titular(E, pa, k) { const o = Org.asegurar(pa), id = o.cargos[k], p = id && E.politicos[id]; return p && p.activo && p.partido === pa.id ? p : null; },
    /* Eficacia del cargo (0-1): capacidad del titular, ajustada por la Secretaría General y por la caja */
    eficacia(E, pa, k) {
      const p = Org.titular(E, pa, k); if (!p) return 0;
      const sec = k !== 'secretaria' ? 1 + Org.calidad(Org.titular(E, pa, 'secretaria')) / 700 : 1;
      return Org.calidad(p) / 100 * sec * ((pa.finanzas || 0) > 20 ? 1 : 0.3);
    },
    presencia(pa, dId) { const o = Org.asegurar(pa); return o.presencia[dId] == null ? 20 : o.presencia[dId]; },
    /* Multiplicador de la cuota de votos del partido en un departamento */
    factor(E, pa, dId) {
      if (!pa || !pa.organica) return 1;
      return 1 + U.clamp((Org.presencia(pa, dId) - 20) / 100 * 0.08 + Org.eficacia(E, pa, 'electoral') * 0.05, -0.02, 0.13);
    },
    coste(E, pa) { return U.suma(Object.keys(Org.asegurar(pa).cargos).filter(k => Org.titular(E, pa, k)).map(k => CARGOS[k].costo)) + Object.keys(pa.organica.coord).filter(d => pa.organica.coord[d] && Org.coordinador(E, pa, d)).length * 0.6; },
    coordinador(E, pa, dId) { const id = Org.asegurar(pa).coord[dId], p = id && E.politicos[id]; return p && p.activo && p.partido === pa.id ? p : null; },
    candidatos(E, pa, dId) {
      return C.Partidos.miembros(E, pa.id).filter(p => p.id !== 'J' && p.activo && (!dId || p.depto === dId)).sort((a, b) => Org.calidad(b) - Org.calidad(a)).slice(0, 14);
    },
    anotar(pa, E, txt) { const h = Org.asegurar(pa).hist; h.unshift({ t: E.fecha.t, txt }); if (h.length > 20) h.pop(); },

    turno(E) {
      for (const pa of Object.values(E.partidos)) {
        if (!pa.organica || pa.lider !== 'J') continue;
        const o = pa.organica, esJ = E.jugador.partido === pa.id;
        // salarios y funcionamiento
        const costo = Org.coste(E, pa); if (costo > 0) pa.finanzas = Math.max(0, (pa.finanzas || 0) - costo);
        // titulares que ya no sirven
        for (const k of Object.keys(o.cargos)) if (!Org.titular(E, pa, k)) delete o.cargos[k];
        const sec = Org.eficacia(E, pa, 'secretaria');
        if (sec) pa.cohesion = U.clamp(pa.cohesion + 0.03 * sec, 0, 100);
        if (Org.eficacia(E, pa, 'comunicaciones')) pa.popularidad = U.clamp(pa.popularidad + 0.0012 * Org.eficacia(E, pa, 'comunicaciones'), 0.5, 60);
        const tes = Org.eficacia(E, pa, 'tesoreria'); if (tes) pa.finanzas += 0.3 * tes * (1 + pa.popularidad / 20);
        if (Org.eficacia(E, pa, 'formacion') && E.fecha.t % 26 === 0) Org.nuevosCuadros(E, pa);
        // presencia territorial: crece donde hay coordinador con caja, decae donde no
        for (const d of Object.values(E.deptos)) {
          const c = Org.coordinador(E, pa, d.id), pr = Org.presencia(pa, d.id);
          if (c && pa.finanzas > 10) o.presencia[d.id] = U.clamp(pr + 0.12 * Org.calidad(c) / 50, 0, 100);
          else if (pr > 20) o.presencia[d.id] = Math.max(20, pr - 0.03);
        }
        // un titular ambicioso puede volverse un problema
        for (const k of Object.keys(o.cargos)) {
          const p = Org.titular(E, pa, k);
          if (p && p.r.amb > 70 && (p.relJ || 0) < 10 && !E.meta.presim && U.chance(0.0012)) {
            pa.cohesion = U.clamp(pa.cohesion - 3, 0, 100); p.relJ = U.clamp((p.relJ || 0) - 6, -100, 100); Org.anotar(pa, E, `${p.nombre} usa la ${CARGOS[k].n} para armar su propia base`);
            if (esJ) C.Medios.noticia(E, { tipo: 'partidos', titular: `Tensión en el ${pa.sigla}: ${p.nombre} arma su propia base desde la ${CARGOS[k].n}`, tono: -1, jugador: true });
          }
        }
      }
    },
    nuevosCuadros(E, pa) {
      const q = Org.eficacia(E, pa, 'formacion');
      for (let i = 0; i < 2; i++) {
        const d = U.pesado(Object.values(E.deptos), x => x.poblacion / 1000 + 1).id, p = C.Politicos.crear(E, { partido: pa.id, depto: d, cargo: { tipo: 'aspirante', aspira: U.pick(['concejo', 'asamblea', 'camara']) } });
        p.r.int = Math.round(U.clamp(p.r.int + 10 + q * 10, 0, 100)); p.r.exp = Math.round(U.clamp(p.r.exp + 5, 0, 100)); p.relJ = U.clamp((p.relJ || 0) + 15, -100, 100); p.fuerza = U.clamp(p.fuerza + 4, 5, 100);
      }
      Org.anotar(pa, E, 'La escuela de formación gradúa nuevos cuadros');
    },

    registrarAcciones() {
      const A = C.Acciones, dirige = E => Org.esDirector(E) || 'Debes dirigir tu partido';
      const miembro = (E, id) => { const p = E.politicos[id], pa = Org.partido(E); return p && id !== 'J' && p.activo && p.partido === pa.id ? p : null; };
      A.registrar({ id: 'nombrarCargoPartido', nombre: 'Nombrar en la estructura del partido', icono: '🎖', grupo: 'partidos', costo: 1,
        disponible: dirige,
        ejecutar(E, a) {
          const k = a.cargo, c = CARGOS[k], pa = Org.partido(E); if (!c) return { ok: false, msg: 'Elige el cargo' };
          const p = miembro(E, a.pol); if (!p) return { ok: false, msg: 'Elige a un militante de tu partido' };
          const o = Org.asegurar(pa);
          if (Object.entries(o.cargos).some(([kk, id]) => id === p.id && kk !== k)) return { ok: false, msg: 'Ya ocupa otro cargo en la estructura' };
          if (o.cargos[k] === p.id) return { ok: false, msg: 'Ya ocupa ese cargo' };
          const prev = Org.titular(E, pa, k); if (prev) prev.relJ = U.clamp((prev.relJ || 0) - 8, -100, 100);
          o.cargos[k] = p.id; p.relJ = U.clamp((p.relJ || 0) + 8, -100, 100);
          Org.anotar(pa, E, `${p.nombre} es nombrado/a en la ${c.n}`);
          return { ok: true, msg: `${p.nombre} asume la ${c.n} (capacidad ${Math.round(Org.calidad(p))})` };
        } });
      A.registrar({ id: 'destituirCargoPartido', nombre: 'Retirar de un cargo del partido', icono: '🚪', grupo: 'partidos', costo: 1, disponible: dirige,
        ejecutar(E, a) { const pa = Org.partido(E), p = Org.titular(E, pa, a.cargo); if (!p) return { ok: false, msg: 'Ese cargo está vacío' }; delete pa.organica.cargos[a.cargo]; p.relJ = U.clamp((p.relJ || 0) - 10, -100, 100); Org.anotar(pa, E, `${p.nombre} sale de la ${CARGOS[a.cargo].n}`); return { ok: true, msg: `${p.nombre} sale del cargo` }; } });
      A.registrar({ id: 'nombrarCoordinador', nombre: 'Nombrar coordinador departamental', icono: '📍', grupo: 'partidos', costo: 1, disponible: dirige,
        ejecutar(E, a) {
          const pa = Org.partido(E), d = E.deptos[a.depto]; if (!d) return { ok: false, msg: 'Elige el departamento' };
          const p = miembro(E, a.pol); if (!p) return { ok: false, msg: 'Elige a un militante de tu partido' };
          Org.asegurar(pa).coord[d.id] = p.id; p.relJ = U.clamp((p.relJ || 0) + 5, -100, 100); Org.anotar(pa, E, `${p.nombre} coordina el partido en ${d.nombre}`);
          return { ok: true, msg: `${p.nombre} dirige el directorio de ${d.nombre}` };
        } });
      A.registrar({ id: 'invertirPresencia', nombre: 'Abrir sedes y reforzar el directorio', icono: '🏢', grupo: 'partidos', costo: 1, disponible: dirige,
        ejecutar(E, a) {
          const pa = Org.partido(E), d = E.deptos[a.depto]; if (!d) return { ok: false, msg: 'Elige el departamento' };
          if ((pa.finanzas || 0) < 60) return { ok: false, msg: 'La caja del partido no alcanza: cuesta $60 millones' };
          pa.finanzas -= 60; const o = Org.asegurar(pa); o.presencia[d.id] = U.clamp(Org.presencia(pa, d.id) + 12, 0, 100);
          return { ok: true, msg: `Sedes y equipo nuevo en ${d.nombre}: presencia ${Math.round(o.presencia[d.id])}%` };
        } });
      A.registrar({ id: 'convocarConvencion', nombre: 'Convocar la convención del partido', icono: '🏛', grupo: 'partidos', costo: 2, disponible: dirige,
        ejecutar(E) {
          const pa = Org.partido(E), o = Org.asegurar(pa);
          if (E.fecha.t - o.ultConvencion < 52) return { ok: false, msg: 'Ya hubo una convención este año' };
          if ((pa.finanzas || 0) < 250) return { ok: false, msg: 'La caja no alcanza: cuesta $250 millones' };
          pa.finanzas -= 250; o.ultConvencion = E.fecha.t; pa.cohesion = U.clamp(pa.cohesion + 7, 0, 100); pa.popularidad = U.clamp(pa.popularidad + 0.15, 0.5, 60);
          for (const d of Object.keys(E.deptos)) o.presencia[d] = U.clamp(Org.presencia(pa, d) + 3, 0, 100);
          Org.anotar(pa, E, 'Convención nacional: se renueva el programa y la estructura');
          C.Medios.noticia(E, { tipo: 'partidos', titular: `El ${pa.sigla} reúne su convención nacional y ratifica su rumbo`, tono: 1, jugador: true });
          return { ok: true, msg: 'La convención unifica al partido y da impulso en todo el país' };
        } });
    }
  };
  C.Organica = Org;
  C.Tiempo.registrar('organica', Org, 66);
  Org.registrarAcciones();
})(window.CURUL);
