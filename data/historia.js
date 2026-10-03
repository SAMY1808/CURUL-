/* Episodios históricos con guion (Fase 44): la Violencia y el Bogotazo, el narcoterrorismo, el Proceso 8000, el Plan Colombia,
   los «falsos positivos», el plebiscito de 2016 y el estallido social de 2021. Como la dictadura de Rojas, ocurren en su fecha en
   cualquier partida que los cruce; `est` cambia el estado (siempre se aplica, incluso si la partida empieza después) y `fn` cuenta la
   historia con noticias y decisiones (sólo «en vivo»). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const T = (y, m, d) => C.U.turnoDe(new Date(Date.UTC(y, m, d)));
  const esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono) => C.Medios.noticia(E, { tipo: 'general', titular: txt, tono: tono || 0, importante: true, jugador: esPres(E) });
  const H = E => C.Historia.asegurar(E);
  const ev = (E, id, vars) => { if (!E.eventos.pendientes.length && !E.meta.presim) C.Eventos.disparar(E, C.Eventos.plantilla(id), { forzar: true, vars: vars || {} }); };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const viol = (E, d) => { const v = H(E).violencia; v.nivel = cl(v.nivel + d, 0, 100); };
  const seg = (E, d) => { for (const x of Object.values(E.deptos)) x.seguridad = cl(x.seguridad + d, 1, 99); };
  const cartel = (E, k, d) => { const c = C.Cartel.asegurar(E); c[k] = cl((c[k] || 0) + d, 0, 100); };
  const ef = o => E => C.Pais.ef(E, o);
  const evt = (id, icono, titulo, texto, ops, extra) => Object.assign({ id, tipo: 'historia', icono, alcance: 'jugador', sistema: true, historia: true, peso: 1, titulo, texto, opciones: ops.map(([t, o]) => ({ t, fn: typeof o === 'function' ? o : ef(o) })) }, extra || {});
  const exc = (E, motivo) => { try { if (esPres(E) && !C.Decretos.asegurar(E).exc) C.Decretos.declarar(E, 'conmocion', motivo || 'orden', true); } catch (e) {} };

  C.DATA.historiaEventos = [
    evt('hs_bogotazo', '🔥', 'El Bogotazo: asesinan a Gaitán', 'El líder liberal Jorge Eliécer Gaitán cae asesinado en pleno centro de Bogotá. La multitud incendia tranvías, iglesias y edificios; hay saqueos y muertos. El país entero se desborda.', [
      ['Llamar a la calma y a un gobierno de unión nacional', E => { viol(E, -6); return C.Pais.ef(E, { rec: 1.5, honestidad: 1 }); }],
      ['Decretar el estado de sitio y sacar al Ejército', E => { exc(E); viol(E, 4); if (esPres(E) && C.CIDH) C.CIDH.registrar(E, 'protesta', { inst: 'ejercito', resp: 'J', evid: 35, vis: true }); return C.Pais.ef(E, { rec: 0.8, seg: { medios: -1 } }); }],
      ['Culpar a los comunistas y endurecer la persecución', E => { viol(E, 8); return C.Pais.ef(E, { rec: 0.8, honestidad: -3 }); }]]),
    evt('hn_palacio', '🏛', 'La toma del Palacio de Justicia', 'El M-19 se toma el Palacio de Justicia con las Cortes dentro. El Ejército responde con tanques. Decenas de magistrados, empleados y guerrilleros quedan atrapados en las llamas.', [
      ['Ordenar la recuperación inmediata del Palacio', E => { if (esPres(E) && C.CIDH) { C.CIDH.registrar(E, 'desaparicion', { inst: 'ejercito', resp: 'J', evid: 45 }); C.CIDH.registrar(E, 'tortura', { inst: 'ejercito', resp: 'J', evid: 40 }); } E.corte && (E.corte.tension = Math.min(100, E.corte.tension + 25)); return C.Pais.ef(E, { rec: 1, honestidad: -2 }); }],
      ['Intentar una salida negociada', E => { E.corte && (E.corte.tension = Math.min(100, E.corte.tension + 15)); return C.Pais.ef(E, { rec: 1, honestidad: 1 }); }],
      ['Dejar que los militares manejen la crisis', E => { if (C.Poderes) C.Poderes.mover(E, 'militares', 6); return C.Pais.ef(E, { honestidad: -3 }); }]]),
    evt('hn_galan', '🕯', 'Asesinan a Luis Carlos Galán', 'El candidato presidencial que prometía combatir a la mafia cae acribillado en plena plaza pública. El país exige una respuesta contundente contra los narcotraficantes.', [
      ['Reactivar la extradición por decreto y declarar la guerra al cartel', E => { C.Cartel.extradicion(E, true); cartel(E, 'amenaza', 25); viol(E, 6); return C.Pais.ef(E, { rec: 2, aprob: 4 }); }],
      ['Buscar una salida negociada con el cartel', E => { cartel(E, 'amenaza', -10); return C.Pais.ef(E, { rec: 0.5, honestidad: -3 }); }],
      ['Pedir calma y reforzar los esquemas de seguridad', E => { const J = E.jugador; J.escolta = Math.min(95, (J.escolta || 20) + 15); return C.Pais.ef(E, { rec: 0.8 }); }]]),
    evt('hn_catedral', '⛓', 'Escobar se entrega y se construye «La Catedral»', 'Pablo Escobar acepta entregarse a cambio de no ser extraditado y de pasar su condena en una cárcel que él mismo diseñó. Los críticos hablan de una burla a la justicia.', [
      ['Aceptar el sometimiento y la cárcel especial', E => { cartel(E, 'poder', -10); return C.Pais.ef(E, { rec: 1, honestidad: -3 }); }],
      ['Rechazar la fórmula y mantener la persecución', E => { cartel(E, 'amenaza', 15); return C.Pais.ef(E, { rec: 1.5, honestidad: 2 }); }]]),
    evt('hp_8000', '🎙', 'Proceso 8000: los narcodólares en la campaña', 'Una cinta revela que dineros del cartel de Cali financiaron la campaña presidencial. La Fiscalía investiga a congresistas y ministros; Estados Unidos mira con lupa.', [
      ['Colaborar con la Fiscalía aunque caigan aliados', E => { if (C.Corrupcion) C.Corrupcion.efectoEscandalo(E, -2); return C.Pais.ef(E, { honestidad: 4, rec: 1.5, aprob: -2 }); }],
      ['Defender la inocencia y atacar a la prensa', E => { if (C.Corrupcion) C.Corrupcion.efectoEscandalo(E, 2); return C.Pais.ef(E, { honestidad: -4, rec: 0.5, aprob: 1 }); }],
      ['Sacrificar al tesorero y a dos ministros', E => C.Pais.ef(E, { honestidad: -1, aprob: -1 })]]),
    evt('hpc_plan', '🇺🇸', 'Plan Colombia: Estados Unidos ofrece más de mil millones de dólares', 'Washington propone un paquete de ayuda militar y antinarcóticos. Hay quienes temen una guerra más intensa y quienes lo ven como una oportunidad para recuperar el Estado.', [
      ['Aceptarlo con fumigación aérea y asesoría militar', E => { if (C.Interv) C.Interv.ayuda(E, 25); if (C.Poderes) C.Poderes.mover(E, 'militares', 6); seg(E, 0.8); return C.Pais.ef(E, { rec: 1 }); }],
      ['Aceptarlo con componente social y sustitución de cultivos', E => { if (C.Interv) C.Interv.ayuda(E, 15); seg(E, 0.4); return C.Pais.ef(E, { rec: 1, honestidad: 1 }); }],
      ['Rechazarlo: «la guerra no es nuestra»', E => { if (C.Interv) C.Interv.ayuda(E, -15); return C.Pais.ef(E, { rec: 1.5, honestidad: 1, aprob: -1 }); }]]),
    evt('hfp_politica', '🎖', 'Cómo premiar los resultados militares', 'La cúpula pide una política de resultados para golpear a las guerrillas. Se propone ligar permisos y ascensos a las bajas en combate.', [
      ['Incentivos por bajas, bonos y permisos', E => { H(E).fp.incentivos = true; return C.Pais.ef(E, { aprob: 2, rec: 1, honestidad: -3 }); }],
      ['Metas de resultados con verificación civil y de la Fiscalía', E => { H(E).fp.incentivos = false; return C.Pais.ef(E, { honestidad: 2 }); }],
      ['No cambiar la política', { rec: 0 }]]),
    evt('hfp_soacha', '⚰', 'Soacha: los jóvenes que aparecieron como «guerrilleros muertos en combate»', 'Madres de Soacha denuncian que sus hijos desaparecieron y luego aparecieron presentados como bajas en combate. La Fiscalía abre cientos de investigaciones por ejecuciones extrajudiciales.', [
      ['Destituir a los oficiales y abrir las investigaciones', E => { if (C.CIDH) C.CIDH.accion && 0; const k = C.CIDH.asegurar(E); k.impun = cl(k.impun - 5, 0, 100); k.coop = cl(k.coop + 6, 0, 100); if (C.Poderes) C.Poderes.mover(E, 'militares', -6); return C.Pais.ef(E, { honestidad: 4, rec: 2, aprob: -3 }); }],
      ['Defender a las Fuerzas: «manzanas podridas»', E => { const k = C.CIDH.asegurar(E); k.impun = cl(k.impun + 6, 0, 100); return C.Pais.ef(E, { honestidad: -4, aprob: 1 }); }],
      ['Aceptar la visita de la CIDH y acelerar los procesos', E => C.CIDH.visita(E, true)]]),
    evt('hpl_plebiscito', '🗳', 'El plebiscito por la paz', 'Se ha firmado un acuerdo final con la guerrilla y hay que refrendarlo. El país está dividido entre el Sí y el No.', [
      ['Convocar un plebiscito', E => { const p = cl(0.5 + (E.opinion.aprobacionPres - 40) / 200, 0.3, 0.7); if (C.U.chance(p)) { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres + 3, 3, 95); noti(E, 'Gana el Sí en el plebiscito: el país refrenda el acuerdo de paz', 1); return C.Pais.ef(E, { rec: 3 }); } E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 5, 3, 95); noti(E, 'Sorpresa: gana el No en el plebiscito por una diferencia mínima', -1); return C.Pais.ef(E, { rec: 1, honestidad: 0 }); }],
      ['Refrendarlo en el Congreso', E => { E.opinion.aprobacionPres = cl(E.opinion.aprobacionPres - 1.5, 3, 95); return C.Pais.ef(E, { rec: 1.5 }); }],
      ['Renegociar con los voceros del No', E => C.Pais.ef(E, { rec: 1, honestidad: 1 })]]),
    evt('he_paro', '✊', 'Estallido social: paro nacional y bloqueos', 'Una reforma tributaria desata un paro nacional. Hay bloqueos de vías, ollas comunitarias y cacerolazos; la protesta se radicaliza y se reportan muertos en Cali y Bogotá.', [
      ['Retirar la reforma y abrir una mesa de diálogo', E => { if (C.Movilizacion) for (const a of ['cut', 'estudiantil']) { const x = C.Movilizacion.actor(E, a); if (x.paro) C.Movilizacion.terminarParo(E, a, 'El Gobierno retira la reforma y dialoga'); } return C.Pais.ef(E, { rec: 1.5, aprob: 1 }); }],
      ['Mantener la reforma y despejar los bloqueos con el ESMAD', E => { if (esPres(E) && C.CIDH) { C.CIDH.registrar(E, 'protesta', { inst: 'policia', resp: 'J', evid: 55, vis: true }); C.CIDH.registrar(E, 'ejecucion', { inst: 'policia', resp: 'J', evid: 45 }); } return C.Pais.ef(E, { rec: 0.5, aprob: -4, honestidad: -2 }); }],
      ['Declarar la conmoción interior y militarizar', E => { exc(E); if (esPres(E) && C.CIDH) C.CIDH.registrar(E, 'protesta', { inst: 'ejercito', resp: 'J', evid: 50, vis: true }); return C.Pais.ef(E, { aprob: -3, honestidad: -3 }); }]])
  ];
  C.DATA.eventos = (C.DATA.eventos || []).concat(C.DATA.historiaEventos);

  C.DATA.historia = [
    { id: 'violencia', nombre: 'La Violencia y el Bogotazo (1948-1958)', icono: '🔥', inicio: [1948, 3, 9], fin: [1958, 7, 7],
      desc: 'El asesinato de Gaitán desata una década de violencia entre liberales y conservadores: chulavitas, pájaros y guerrillas liberales, con cientos de miles de muertos. Termina (en parte) con el Frente Nacional.',
      guion: [
        { f: [1948, 3, 9], est: E => { viol(E, 55); seg(E, -5); }, fn: E => { noti(E, 'ASESINAN A JORGE ELIÉCER GAITÁN: Bogotá arde y la violencia se extiende por el país', -1); ev(E, 'hs_bogotazo'); } },
        { f: [1949, 10, 9], est: E => viol(E, 8), fn: E => noti(E, 'El Presidente cierra el Congreso y gobierna con estado de sitio en medio de la violencia partidista', -1) },
        { f: [1951, 5, 1], est: E => { if (C.ONU && C.ONU.asegurar(E)) C.ONU.asegurar(E).cascos.n = 1000; }, fn: E => noti(E, 'El Batallón Colombia parte a la guerra de Corea: único país latinoamericano en el conflicto', 0) },
        { f: [1953, 5, 20], est: E => viol(E, -22), fn: E => noti(E, 'La amnistía de Rojas Pinilla desmoviliza a miles de guerrilleros liberales', 1) },
        { f: [1954, 6, 20], est: E => { if (C.ONU && C.ONU.asegurar(E)) C.ONU.asegurar(E).cascos.n = 0; } },
        { f: [1955, 2, 1], est: E => viol(E, 12), fn: E => noti(E, 'Guerra de Villarrica: el Ejército bombardea a campesinos y rebrota la violencia', -1) },
        { f: [1958, 7, 7], est: E => viol(E, -25), fn: E => noti(E, 'Comienza el Frente Nacional: liberales y conservadores pactan la paz entre partidos', 1) },
        { f: [1964, 4, 27], est: E => viol(E, 10), fn: E => noti(E, 'Operación Marquetalia: del asedio a una «república independiente» campesina nace la guerrilla de las FARC', -1) }
      ] },
    { id: 'narco', nombre: 'Narcoterrorismo y la guerra contra los carteles (1984-1995)', icono: '💣', inicio: [1984, 3, 30], fin: [1995, 5, 30],
      desc: 'Pablo Escobar y el cartel de Medellín declaran la guerra al Estado con bombas, secuestros y asesinatos; el cartel de Cali infiltra la política. Extradición, Constituyente de 1991 y cacería de Escobar.',
      guion: [
        { f: [1984, 3, 30], est: E => { cartel(E, 'poder', 20); cartel(E, 'amenaza', 15); }, fn: E => noti(E, 'Asesinan al ministro de Justicia Rodrigo Lara Bonilla: el narcotráfico declara su poder', -1) },
        { f: [1985, 10, 6], est: E => { if (E.corte) E.corte.tension = Math.min(100, E.corte.tension + 25); }, fn: E => { noti(E, 'TOMA DEL PALACIO DE JUSTICIA: el M-19 asalta las Cortes y el Ejército responde con tanques', -1); ev(E, 'hn_palacio'); } },
        { f: [1986, 11, 17], est: E => { if (C.Poderes) C.Poderes.mover(E, 'prensa', -4); }, fn: E => noti(E, 'Asesinan al director de El Espectador, Guillermo Cano, por denunciar a los narcos', -1) },
        { f: [1989, 7, 18], est: E => { cartel(E, 'amenaza', 25); cartel(E, 'guerra', 100); C.Cartel.extradicion(E, true); viol(E, 10); }, fn: E => { noti(E, 'ASESINAN A LUIS CARLOS GALÁN: el país exige una guerra frontal contra la mafia', -1); ev(E, 'hn_galan'); } },
        { f: [1989, 10, 27], est: E => seg(E, -2), fn: E => noti(E, 'Una bomba derriba el vuelo 203 de Avianca: 107 muertos', -1) },
        { f: [1990, 3, 26], est: E => viol(E, 5), fn: E => noti(E, 'Asesinan a los candidatos presidenciales Bernardo Jaramillo y Carlos Pizarro con semanas de diferencia', -1) },
        { f: [1991, 5, 19], est: E => { C.Cartel.asegurar(E).escobar = 'catedral'; cartel(E, 'poder', -8); C.Cartel.extradicion(E, false); }, fn: E => { noti(E, 'Pablo Escobar se entrega y se instala en «La Catedral», su propia cárcel', 0); ev(E, 'hn_catedral'); } },
        { f: [1992, 6, 22], est: E => { C.Cartel.asegurar(E).escobar = 'fugitivo'; cartel(E, 'poder', 8); cartel(E, 'amenaza', 10); }, fn: E => noti(E, 'Escobar se fuga de La Catedral: comienza la cacería', -1) },
        { f: [1993, 11, 2], est: E => { C.Cartel.asegurar(E).escobar = 'muerto'; cartel(E, 'poder', -35); cartel(E, 'amenaza', -30); cartel(E, 'guerra', -100); viol(E, -8); }, fn: E => noti(E, 'MUERE PABLO ESCOBAR en un tejado de Medellín: se desmorona el cartel', 1) },
        { f: [1995, 5, 9], est: E => cartel(E, 'poder', -14), fn: E => noti(E, 'Caen los capos del cartel de Cali: el narcotráfico se fragmenta', 1) }
      ] },
    { id: 'p8000', nombre: 'Proceso 8000 (1994-1996)', icono: '🎙', inicio: [1994, 5, 21], fin: [1997, 7, 1],
      desc: 'La financiación del cartel de Cali a la campaña presidencial destapa el mayor escándalo de corrupción política del siglo; Estados Unidos descertifica a Colombia.',
      guion: [
        { f: [1994, 5, 21], est: E => { E.opinion.escandalos = (E.opinion.escandalos || 0) + 2; if (C.Corrupcion) C.Corrupcion.asegurar(E).indice = Math.min(100, C.Corrupcion.asegurar(E).indice + 12); }, fn: E => { noti(E, 'Estalla el Proceso 8000: narcodólares en la campaña presidencial', -1); ev(E, 'hp_8000'); } },
        { f: [1996, 2, 1], est: E => { if (C.Interv) C.Interv.ayuda(E, -22); }, fn: E => noti(E, 'Estados Unidos descertifica a Colombia en la lucha antidrogas: sanciones y quita la visa a dirigentes', -1) }
      ] },
    { id: 'plancolombia', nombre: 'Plan Colombia (1999-2006)', icono: '🇺🇸', inicio: [1999, 8, 1], fin: [2006, 7, 1],
      desc: 'Un gran paquete de ayuda de Estados Unidos redefine la guerra contra las guerrillas y el narcotráfico: fumigación, helicópteros y tropas profesionalizadas.',
      guion: [
        { f: [1999, 8, 1], est: E => { if (C.Interv) C.Interv.ayuda(E, 25); }, fn: E => { noti(E, 'Se anuncia el Plan Colombia: Washington ofrece más de mil millones de dólares', 0); ev(E, 'hpc_plan'); } },
        { f: [2002, 1, 20], est: E => viol(E, 5), fn: E => noti(E, 'Se rompe el proceso del Caguán: el Ejército retoma la zona de distensión', -1) }
      ] },
    { id: 'falsospositivos', nombre: '«Falsos positivos» (2002-2010)', icono: '⚰', inicio: [2002, 7, 7], fin: [2010, 7, 7],
      desc: 'La política de resultados militares degenera en miles de ejecuciones extrajudiciales de civiles presentados como bajas en combate; en 2008 estalla el escándalo de Soacha.',
      guion: [
        { f: [2002, 7, 7], fn: E => ev(E, 'hfp_politica') },
        { f: [2008, 9, 15], est: E => { const fp = H(E).fp; fp.soacha = true; if (fp.incentivos && C.CIDH) { for (const c of C.CIDH.ocultos(E, 'ejercito').filter(x => x.tipo === 'ejecucion')) { c.evid += 25; if (!E.meta.presim) C.CIDH.revelar(E, c, 'Soacha'); } } }, fn: E => { noti(E, 'ESCÁNDALO DE SOACHA: jóvenes desaparecidos aparecen como guerrilleros muertos en combate', -1); ev(E, 'hfp_soacha'); } }
      ] },
    { id: 'plebiscito', nombre: 'Plebiscito por la paz (2016)', icono: '🗳', inicio: [2016, 7, 24], fin: [2016, 10, 24],
      desc: 'Se firma el acuerdo final con las FARC y el presidente convoca un plebiscito que pierde por un margen mínimo; se renegocia y se refrenda en el Congreso.',
      guion: [{ f: [2016, 7, 24], fn: E => { noti(E, 'Se conoce el acuerdo final de paz: el país se prepara para refrendarlo', 1); ev(E, 'hpl_plebiscito'); } }] },
    { id: 'estallido', nombre: 'Estallido social (2021)', icono: '✊', inicio: [2021, 3, 28], fin: [2021, 6, 20],
      desc: 'Una reforma tributaria detona semanas de paro nacional, bloqueos, ESMAD y cientos de denuncias de violaciones de derechos humanos; la CIDH visita el país.',
      guion: [
        { f: [2021, 3, 28], est: E => { if (C.Movilizacion) for (const a of ['cut', 'estudiantil']) { const x = C.Movilizacion.actor(E, a); x.descontento = 96; } }, fn: E => { noti(E, 'PARO NACIONAL: marchas, bloqueos y cacerolazos contra la reforma tributaria', -1); if (C.Movilizacion) for (const a of ['cut', 'estudiantil']) { const x = C.Movilizacion.actor(E, a); if (!x.paro) C.Movilizacion.iniciarParo(E, a); } ev(E, 'he_paro'); } },
        { f: [2021, 5, 8], fn: E => { noti(E, 'La CIDH llega a Colombia para investigar la represión de la protesta', -1); if (C.CIDH && !esPres(E)) C.CIDH.visita(E, true); } }
      ] }
  ];
  C.DATA.historiaT = T;
})(window.CURUL);
