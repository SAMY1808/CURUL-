/* Narcotráfico y violencia política (Fase 44): poder del cartel según la época, «plata o plomo», terrorismo, extradición,
   sometimiento a la justicia (mesa de negociación) y atentados contra el jugador y contra rivales políticos (magnicidios). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'general', titular: txt, tono: tono == null ? -1 : tono, importante: !!imp, jugador: esPres(E) }); };
  const ca = {
    clave: 'cartel',
    base(y) { return y < 1976 ? 5 : y < 1984 ? 30 : y < 1993 ? 75 : y < 1996 ? 50 : y < 2008 ? 36 : y < 2016 ? 28 : 32; },
    asegurar(E) {
      if (E.cartel && E.cartel.poder != null) return E.cartel;
      E.cartel = { poder: ca.base(U.anio()), amenaza: 10, guerra: 0, ext: U.anio() >= 1980 && U.anio() < 1991 || U.anio() >= 1997, escobar: null, favores: 0, ultOp: -999, terror: 0, ultMagni: -999, crimenes: [], conmocion: 0 };
      return E.cartel;
    },
    crim(E) { const k = ca.asegurar(E); if (!k.crimenes) { k.crimenes = []; k.conmocion = 0; } return k; },
    init(E) { E.cartel = null; }, migrar(E) { ca.asegurar(E); },
    extradicion(E, on) { ca.asegurar(E).ext = !!on; if (C.Interv) C.Interv.ayuda(E, on ? 4 : -4); const st = E.diplomacia && E.diplomacia.paises.USA; if (st) st.relacion = cl(st.relacion + (on ? 4 : -4), 3, 97); },
    /* Asesinato de un político (NPC): candidatos, congresistas y dirigentes */
    magnicidio(E, motivo) {
      const c = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && p.r && p.r.amb > 25 && !['presidente', 'senador', 'representante'].includes(p.cargo.tipo));
      if (!c.length) return null;
      const p = U.pesado(c, x => 1 + x.fuerza / 30 + (x.cargo.tipo === 'aspirante' ? 2 : 0)), k = ca.crim(E);
      if (p.escolta > 45 && U.chance(p.escolta / 120)) { noti(E, `Frustran un atentado contra ${p.nombre}: su esquema de protección neutraliza a los sicarios`, 1, true); p.escolta = Math.min(95, p.escolta + 10); return null; }
      p.activo = false; const cargo = p.cargo.tipo; p.cargo = null; C.Politicos.anotar(p, `Es asesinado (${motivo})`);
      k.ultMagni = E.fecha.t; E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.3; k.conmocion = cl((k.conmocion || 0) + (cargo === 'aspirante' ? 60 : 35), 0, 100);
      for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad - 0.15, 1, 99);
      const c0 = { id: U.id('cr'), victima: p.nombre, partido: p.partido, cargo, motivo, t: E.fecha.t, estado: 'abierto', avance: 0, material: false, intelectual: false, recompensa: 0, estatal: U.chance(0.12 + (k.favores || 0) * 0.04) };
      k.crimenes.unshift(c0); if (k.crimenes.length > 12) k.crimenes.length = 12;
      noti(E, `ASESINAN a ${p.nombre}, ${cargo === 'aspirante' ? 'aspirante político' : cargo}: ${motivo}`, -1, true);
      if (!E.meta.presim && !E.eventos.pendientes.length && (cargo === 'aspirante' || cargo === 'gobernador')) C.Eventos.disparar(E, C.Eventos.plantilla('nc_funeral'), { forzar: true, vars: { victima: p.nombre, cid: c0.id } });
      return p;
    },
    /* Investigación de crímenes políticos */
    investigar(E, cid, fuerte) {
      const c = ca.crim(E).crimenes.find(x => x.id === cid); if (!c || c.estado !== 'abierto') return 'El caso ya no está abierto';
      c.avance = cl(c.avance + (fuerte ? 28 : 15) + c.recompensa * 0.08, 0, 100); return '';
    },
    cerrar(E, c, txt, tono) { c.estado = 'resuelto'; noti(E, txt, tono, true); },
    atentadoJ(E, quien) {
      const J = E.jugador, esc = J.escolta || 15, p = cl(0.9 - esc / 130, 0.1, 0.95), dmg = U.ri(8, 38);
      if (U.chance(p)) { C.Salud && C.Salud.asegurar && C.Salud.asegurar(J); J.salud = Math.max(8, (J.salud == null ? 85 : J.salud) - dmg); C.Opinion.subirRec(E, 3); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + (esPres(E) ? 3 : 0), 3, 95); noti(E, `ATENTADO CONTRA ${J.nombre.toUpperCase()}: sobrevive herido; la autoría se atribuye a ${quien}`, -1, true); }
      else { C.Opinion.subirRec(E, 1); noti(E, `Frustran un atentado contra ${J.nombre}: los escoltas neutralizan a los sicarios`, 1, true); }
      J.escolta = Math.min(95, esc + 8); ca.asegurar(E).amenaza = cl(ca.asegurar(E).amenaza - 25, 0, 100);
    },
    turno(E) {
      const k = ca.asegurar(E), t = E.fecha.t, y = U.anio(), J = E.jugador, b = ca.base(y);
      k.poder = cl(k.poder + (b - k.poder) * 0.004 + U.gauss(0, 0.25), 0, 100);
      k.amenaza = cl(k.amenaza - 0.05, 0, 100); k.terror = cl(k.terror - 0.1, 0, 100);
      if (k.crimenes) { k.conmocion = cl((k.conmocion || 0) - 0.8, 0, 100);
        for (const c of k.crimenes) if (c.estado === 'abierto') {
          c.avance = cl(c.avance + 0.35 + c.recompensa * 0.004 - (c.estatal ? 0.2 : 0), 0, 100);
          if (!c.material && c.avance >= 45 && !E.meta.presim) { c.material = true; noti(E, `Capturan a los autores materiales del asesinato de ${c.victima}`, 1, true); }
          if (c.material && !c.intelectual && c.avance >= 85 && !E.meta.presim) { c.intelectual = true; if (c.estatal) { if (C.CIDH) { try { C.CIDH.registrar(E, 'ejecucion', { inst: 'dni', evid: 70, vis: true }); } catch (e) { } } ca.cerrar(E, c, `Se revela la participación de agentes estatales en el asesinato de ${c.victima}: escándalo nacional`, -1); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.5; }
            else ca.cerrar(E, c, `Condenan al determinador del crimen de ${c.victima}: «el país conoce por fin la verdad»`, 1); }
          if (E.fecha.t - c.t > 260 && c.estado === 'abierto') { c.estado = 'impunidad'; if (!E.meta.presim) noti(E, `El crimen de ${c.victima} queda en la impunidad`, -1, false); }
        } }
      if (E.meta.presim) return;
      const guerra = k.guerra > 0 ? 1 : 0.2;
      // terrorismo
      if (k.poder > 35 && U.chance(k.poder / 100 * 0.012 * guerra)) { const d = E.deptos[U.pesado(Object.values(E.deptos), x => x.poblacion / 1000 + 1).id]; k.terror = cl(k.terror + 15, 0, 100); for (const x of Object.values(E.deptos)) x.seguridad = cl(x.seguridad - 0.2, 1, 99); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - (esPres(E) ? 1.2 : 0), 3, 95); noti(E, `Carro bomba en ${d.capital || d.nombre}: el narcoterrorismo golpea a la población civil`, -1, true); }
      // magnicidios políticos
      if (U.chance(0.002 * (k.poder / 40) * (k.guerra > 0 ? 3 : 1)) && t - k.ultMagni > 20) ca.magnicidio(E, 'atribuido a las mafias');
      // plata o plomo
      if (k.poder > 30 && J.cargo && C.DATA.cargos[J.cargo] && C.DATA.cargos[J.cargo].nivel >= 1 && U.chance(0.004 * k.poder / 50) && !E.eventos.pendientes.length) C.Eventos.disparar(E, C.Eventos.plantilla('nc_plata'), { forzar: true });
      // atentados contra el jugador
      if (J.cargo && C.DATA.cargos[J.cargo] && C.DATA.cargos[J.cargo].nivel >= 2 && U.chance(k.amenaza / 100 * k.poder / 100 * 0.04)) ca.atentadoJ(E, 'el narcotráfico');
      // cacería de Escobar (guion histórico): el fugitivo cae por las operaciones del Bloque de Búsqueda
      if (k.escobar === 'fugitivo' && U.anio() >= 1993 && U.chance(0.01)) { k.escobar = 'muerto'; k.poder = cl(k.poder - 30, 0, 100); }
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'combatirCartel', nombre: 'Ofensiva contra el cartel (Bloque de Búsqueda)', icono: '🎯', grupo: 'seguridad', costo: 3,
        disponible(E) { const k = ca.asegurar(E); return esPres(E) ? (E.fecha.t - k.ultOp < 6 ? 'Espera unas semanas entre operaciones' : k.poder < 8 ? 'El cartel ya es marginal' : true) : 'Sólo el Presidente'; },
        ejecutar(E) { const k = ca.asegurar(E); k.ultOp = E.fecha.t; const d = U.ri(4, 10); k.poder = cl(k.poder - d, 0, 100); k.amenaza = cl(k.amenaza + 12, 0, 100); k.guerra = Math.max(k.guerra, 40); k.terror = cl(k.terror + 6, 0, 100); if (C.Poderes) C.Poderes.mover(E, 'militares', 3);
          let extra = ''; if (k.escobar === 'fugitivo' && U.chance(0.1)) { k.escobar = 'muerto'; k.poder = cl(k.poder - 25, 0, 100); extra = ' ¡Cae el máximo jefe del cartel!'; noti(E, 'Abatido el jefe del cartel en una operación del Bloque de Búsqueda', 1, true); }
          if (C.CIDH && U.chance(0.18)) C.CIDH.registrar(E, 'ejecucion', { inst: 'ejercito', resp: 'J', evid: 30 });
          return { ok: true, msg: `La ofensiva debilita al cartel en ${d} puntos; sube el riesgo de retaliación.${extra}` }; } });
      A.registrar({ id: 'negociarSometimiento', nombre: 'Abrir una mesa de sometimiento a la justicia del cartel', icono: '🪑', grupo: 'seguridad', costo: 2,
        disponible(E) { return C.Mesa && C.Mesa.TIPOS.cartel.puede(E) === true ? true : (C.Mesa ? C.Mesa.TIPOS.cartel.puede(E) : 'No disponible'); },
        ejecutar(E) { const m = C.Mesa.crear(E, 'cartel', 'cartel'); return { ok: true, msg: `Se abre la mesa: ${m.titulo}`, mesa: m.id }; } });
      A.registrar({ id: 'decretarExtradicion', nombre: 'Política de extradición', icono: '✈', grupo: 'seguridad', costo: 2,
        disponible(E, a) { return esPres(E) ? (a.modo === 'aplicar' || a.modo === 'suspender' ? true : 'Elige la política') : 'Sólo el Presidente'; },
        ejecutar(E, a) { const on = a.modo === 'aplicar'; ca.extradicion(E, on); const k = ca.asegurar(E); k.amenaza = cl(k.amenaza + (on ? 20 : -15), 0, 100); return { ok: true, msg: on ? 'Reactivas la extradición: Washington aplaude y el cartel responde con amenazas' : 'Suspendes la extradición: baja la violencia, pero Estados Unidos protesta' }; } });
      const abierto = (E, a) => { const c = ca.crim(E).crimenes.find(x => x.id === a.cid); return c && c.estado === 'abierto' ? c : null; };
      A.registrar({ id: 'investigarMagnicidio', nombre: 'Impulsar la investigación de un magnicidio', icono: '🔎', grupo: 'seguridad', costo: 2,
        disponible(E, a) { return abierto(E, a) ? true : 'Elige un caso abierto'; },
        ejecutar(E, a) { const c = abierto(E, a); ca.investigar(E, a.cid, true); C.Opinion.subirRec(E, 0.5); C.Pais.ef(E, { honestidad: 1 }); return { ok: true, msg: `Presionas a la Fiscalía por el caso de ${c.victima} (avance ${Math.round(c.avance)}%)` }; } });
      A.registrar({ id: 'ofrecerRecompensa', nombre: 'Ofrecer recompensa por los autores de un crimen', icono: '💵', grupo: 'seguridad', costo: 1,
        disponible(E, a) { const c = abierto(E, a); return !c ? 'Elige un caso abierto' : c.recompensa >= 100 ? 'Ya hay una recompensa máxima' : true; },
        ejecutar(E, a) { const c = abierto(E, a); c.recompensa = Math.min(100, c.recompensa + 50); if (esPres(E)) C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.1), p: 'm' }], 'recompensa'); else E.jugador.patrimonio -= 15; return { ok: true, msg: `Ofreces una recompensa por los responsables del crimen de ${c.victima}` }; } });
      A.registrar({ id: 'escoltarCandidato', nombre: 'Asignar protección a un candidato o dirigente', icono: '🧑‍✈️', grupo: 'seguridad', costo: 1,
        disponible(E, a) { const p = E.politicos[a.pid]; return p && p.activo ? ((p.escolta || 0) >= 80 ? 'Ya tiene esquema máximo' : true) : 'Elige a quién proteger'; },
        ejecutar(E, a) { const p = E.politicos[a.pid]; p.escolta = Math.min(95, (p.escolta || 10) + 35); if (esPres(E)) C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.05), p: 'm' }], 'escolta'); else E.jugador.patrimonio -= 8; if (p.r) p.r.afin = cl((p.r.afin || 0) + 4, -100, 100); return { ok: true, msg: `${p.nombre} recibe un esquema de protección (${p.escolta}/100)` }; } });
      A.registrar({ id: 'reforzarEscolta', nombre: 'Reforzar tu esquema de seguridad', icono: '🛡', grupo: 'seguridad', costo: 1,
        disponible(E) { return (E.jugador.escolta || 15) >= 90 ? 'Ya tienes el máximo esquema' : true; },
        ejecutar(E) { const J = E.jugador; J.escolta = Math.min(95, (J.escolta || 15) + 20); J.patrimonio -= 8; return { ok: true, msg: `Contratas más escoltas y blindas tus vehículos (esquema ${J.escolta}/100)` }; } });
    }
  };
  C.Cartel = ca; C.Tiempo.registrar('cartel', ca, 68); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Cartel'); ca.registrarAcciones();
  // evento «plata o plomo»
  const ef = o => E => C.Pais.ef(E, o);
  C.DATA.eventos = (C.DATA.eventos || []).concat([{ id: 'nc_plata', tipo: 'historia', icono: '💼', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Plata o plomo', texto: 'Un emisario del cartel te ofrece un maletín: «Con nosotros, plata; contra nosotros, plomo». Sabe dónde estudian tus hijos.',
    opciones: [
      { t: 'Aceptar el maletín', fn: E => { const J = E.jugador, k = ca.asegurar(E); k.favores++; k.poder = cl(k.poder + 3, 0, 100); J.patrimonio += U.ri(60, 260); J.riesgoJudicial = cl((J.riesgoJudicial || 0) + 12, 0, 100); return C.Pais.ef(E, { honestidad: -9, escandalo: 'Dineros del narcotráfico' }); } },
      { t: 'Rechazarlo y afrontar las amenazas', fn: E => { ca.asegurar(E).amenaza = cl(ca.asegurar(E).amenaza + 18, 0, 100); return C.Pais.ef(E, { honestidad: 3, rec: 2 }); } },
      { t: 'Denunciarlo públicamente y pedir protección', fn: E => { ca.asegurar(E).amenaza = cl(ca.asegurar(E).amenaza + 10, 0, 100); E.jugador.escolta = Math.min(95, (E.jugador.escolta || 15) + 12); return C.Pais.ef(E, { honestidad: 4, rec: 3 }); } }] }]);
  C.DATA.eventos = (C.DATA.eventos || []).concat([{ id: 'nc_funeral', tipo: 'historia', icono: '🕯', alcance: 'jugador', sistema: true, peso: 1, titulo: 'El país despide a {victima}', texto: 'El asesinato de {victima} conmociona a Colombia. Miles marchan en silencio y la familia espera una respuesta del Estado.', opciones: [
    { t: 'Asistir al funeral y exigir justicia', fn: (E, e) => { ca.investigar(E, e.ctx.vars.cid, false); return C.Pais.ef(E, { rec: 2.5, honestidad: 2 }); } },
    { t: 'Decretar duelo nacional y recompensa', fn: (E, e) => { const c = ca.crim(E).crimenes.find(x => x.id === e.ctx.vars.cid); if (c) c.recompensa = 50; E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + (esPres(E) ? 2 : 0), 3, 95); return C.Pais.ef(E, { rec: 1.5 }); } },
    { t: 'Aprovechar políticamente la tragedia', fn: E => C.Pais.ef(E, { rec: 3, honestidad: -4, escandalo: 'Oportunismo ante un magnicidio' }) },
    { t: 'Mantener distancia', fn: E => C.Pais.ef(E, { rec: 0 }) }] }]);
  // tipo de mesa «cartel»
  if (C.Mesa) {
    C.Mesa.TIPOS.cartel = { n: 'Sometimiento a la justicia del cartel', icono: '💼',
      puede(E) { const k = ca.asegurar(E); return esPres(E) ? (k.poder < 15 ? 'El cartel ya es marginal' : true) : 'Sólo el Presidente'; },
      crear(E) { const k = ca.asegurar(E); return { titulo: 'Sometimiento a la justicia del cartel', contraparte: { n: 'Los jefes del cartel', icono: '💼', flex: U.clamp(60 - k.poder * 0.3 + U.ri(-8, 8), 15, 75), poder: k.poder }, leverage: U.clamp(55 - (k.poder - 50) * 0.4 + (E.opinion.aprobacionPres - 45) * 0.2, 15, 85),
        temas: [{ id: 'extradicion', n: 'No extradición', brecha: U.ri(55, 90), peso: 3, linea: true }, { id: 'carcel', n: 'Condiciones de la cárcel y rebaja de penas', brecha: U.ri(40, 80), peso: 2, linea: false }, { id: 'bienes', n: 'Entrega de bienes y rutas', brecha: U.ri(40, 80), peso: 2, linea: false }, { id: 'terror', n: 'Cese del terrorismo', brecha: U.ri(30, 70), peso: 3, linea: false }] }; },
      fin(E, m, r) { const k = ca.asegurar(E); if (r === 'acuerdo') { k.poder = cl(k.poder - 22, 0, 100); k.amenaza = cl(k.amenaza - 30, 0, 100); k.guerra = 0; ca.extradicion(E, false); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - C.Mesa.costoTotal(m) * 0.03, 3, 95); noti(E, 'El cartel se somete a la justicia a cambio de beneficios: bajan las bombas, crecen las críticas', 0, true); } else if (r === 'ruptura') { k.amenaza = cl(k.amenaza + 20, 0, 100); k.guerra = 60; k.terror = cl(k.terror + 15, 0, 100); } } };
  }
})(window.CURUL);
