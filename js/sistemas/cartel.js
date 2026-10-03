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
      E.cartel = { poder: ca.base(U.anio()), amenaza: 10, guerra: 0, ext: U.anio() >= 1980 && U.anio() < 1991 || U.anio() >= 1997, escobar: null, favores: 0, ultOp: -999, terror: 0, ultMagni: -999 };
      return E.cartel;
    },
    init(E) { E.cartel = null; }, migrar(E) { ca.asegurar(E); },
    extradicion(E, on) { ca.asegurar(E).ext = !!on; if (C.Interv) C.Interv.ayuda(E, on ? 4 : -4); const st = E.diplomacia && E.diplomacia.paises.USA; if (st) st.relacion = cl(st.relacion + (on ? 4 : -4), 3, 97); },
    /* Asesinato de un político (NPC): candidatos, congresistas y dirigentes */
    magnicidio(E, motivo) {
      const c = Object.values(E.politicos).filter(p => p.activo && p.id !== 'J' && p.cargo && p.r && p.r.amb > 25 && !(p.cargo.tipo === 'presidente'));
      if (!c.length) return null;
      const p = U.pesado(c, x => 1 + x.fuerza / 30 + (x.cargo.tipo === 'aspirante' ? 2 : 0)); p.activo = false; const cargo = p.cargo.tipo; p.cargo = null; C.Politicos.anotar(p, `Es asesinado (${motivo})`);
      E.cartel && (E.cartel.ultMagni = E.fecha.t); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.3;
      for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad - 0.15, 1, 99);
      noti(E, `ASESINAN a ${p.nombre}, ${cargo === 'aspirante' ? 'aspirante político' : cargo}: ${motivo}`, -1, true); return p;
    },
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
  // tipo de mesa «cartel»
  if (C.Mesa) {
    C.Mesa.TIPOS.cartel = { n: 'Sometimiento a la justicia del cartel', icono: '💼',
      puede(E) { const k = ca.asegurar(E); return esPres(E) ? (k.poder < 15 ? 'El cartel ya es marginal' : true) : 'Sólo el Presidente'; },
      crear(E) { const k = ca.asegurar(E); return { titulo: 'Sometimiento a la justicia del cartel', contraparte: { n: 'Los jefes del cartel', icono: '💼', flex: U.clamp(60 - k.poder * 0.3 + U.ri(-8, 8), 15, 75), poder: k.poder }, leverage: U.clamp(55 - (k.poder - 50) * 0.4 + (E.opinion.aprobacionPres - 45) * 0.2, 15, 85),
        temas: [{ id: 'extradicion', n: 'No extradición', brecha: U.ri(55, 90), peso: 3, linea: true }, { id: 'carcel', n: 'Condiciones de la cárcel y rebaja de penas', brecha: U.ri(40, 80), peso: 2, linea: false }, { id: 'bienes', n: 'Entrega de bienes y rutas', brecha: U.ri(40, 80), peso: 2, linea: false }, { id: 'terror', n: 'Cese del terrorismo', brecha: U.ri(30, 70), peso: 3, linea: false }] }; },
      fin(E, m, r) { const k = ca.asegurar(E); if (r === 'acuerdo') { k.poder = cl(k.poder - 22, 0, 100); k.amenaza = cl(k.amenaza - 30, 0, 100); k.guerra = 0; ca.extradicion(E, false); E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - C.Mesa.costoTotal(m) * 0.03, 3, 95); noti(E, 'El cartel se somete a la justicia a cambio de beneficios: bajan las bombas, crecen las críticas', 0, true); } else if (r === 'ruptura') { k.amenaza = cl(k.amenaza + 20, 0, 100); k.guerra = 60; k.terror = cl(k.terror + 15, 0, 100); } } };
  }
})(window.CURUL);
