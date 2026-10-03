/* Eventos del régimen político (Fase 41): ruido de sables, golpes de Estado, vida bajo una junta y aperturas. */
(function () {
  const C = CURUL;
  const ef = o => E => C.Pais.ef(E, o);
  const R = E => C.Regimen.asegurar(E);
  const ev = (id, icono, titulo, texto, ops, extra) => Object.assign({ id, tipo: 'regimen', icono, alcance: 'jugador', sistema: true, regimen: true, peso: 1, titulo, texto, opciones: ops.map(([t, o]) => ({ t, fn: typeof o === 'function' ? o : ef(o) })) }, extra || {});
  C.DATA.regimenEventos = [
    ev('rg_ruido', '🎖', 'Ruido de sables', 'Se filtra que un grupo de generales se reúne en secreto. Los corrillos hablan de «un cambio de mando». Tu seguridad personal pide órdenes.', [
      ['Blindar a las Fuerzas: ascensos y presupuesto', E => { R(E).blindaje = Math.min(40, R(E).blindaje + 8); C.Poderes && C.Poderes.mover(E, 'militares', 6); return C.Pais.ef(E, { rec: 0.5, confianza: -0.3 }); }],
      ['Llamar a los generales a calificar servicios', E => { R(E).blindaje = Math.min(40, R(E).blindaje + 10); C.Poderes && C.Poderes.mover(E, 'militares', -10); return C.Pais.ef(E, { rec: 1 }); }],
      ['Negar todo: «hay plena institucionalidad»', { aprob: -0.3 }]
    ]),
    ev('rg_golpe_presidente', '🚨', '¡Golpe de Estado en marcha!', 'Tropas rodean el Palacio de Nariño y la radio militar anuncia que «las Fuerzas toman el control para salvar a la patria». Los comandantes te exigen la renuncia. Probabilidad de que el golpe triunfe si resistes: {prob} %.', [
      ['Resistir: llamar al pueblo, a la Corte y a Washington', E => C.Regimen.resolverGolpeJ(E, 'resistir')],
      ['Negociar tu salida sin derramamiento de sangre', E => C.Regimen.resolverGolpeJ(E, 'negociar')],
      ['Huir del país', E => C.Regimen.resolverGolpeJ(E, 'huir')]
    ], { forzar: true }),
    ev('rg_golpe_otro', '🎖', '¡Golpe de Estado!', 'Un general toma el poder: disuelve el Congreso, suspende las elecciones y detiene al Presidente. El país contiene el aliento.', [
      ['Condenar el golpe y exigir la restauración', E => { const j = R(E).junta; if (j) { j.resistencia = Math.min(100, j.resistencia + 5); } C.Opinion.subirRec(E, 2); return C.Pais.ef(E, { rec: 1.5 }); }],
      ['Guardar silencio y esperar', { rec: 0 }],
      ['Aplaudir a la junta: «el orden ante todo»', E => { const j = R(E).junta; if (j) j.legit = Math.min(100, j.legit + 4); return C.Pais.ef(E, { rec: 0.5, honestidad: -2 }); }]
    ], { forzar: true }),
    ev('rg_junta_protesta', '✊', 'Cacerolazo contra la junta', 'Barrios enteros salen a golpear ollas pese al toque de queda. La policía responde con gases.', [
      ['Dejar que protesten', E => { const j = R(E).junta; if (j) { j.legit -= 2; j.resistencia += 3; j.repres -= 4; } return 'La junta afloja la mano; las calles se animan'; }],
      ['Reprimir con dureza', E => { const j = R(E).junta; if (j) { j.repres += 8; j.resistencia += 5; j.legit -= 3; j.aislamiento += 3; } return 'Hay heridos y detenidos; la condena internacional crece'; }],
      ['Anunciar un cronograma «de normalización»', E => { const j = R(E).junta; if (j) { j.legit += 3; j.resistencia -= 4; } return 'Ganas tiempo con promesas'; }]
    ]),
    ev('rg_junta_eeuu', '🇺🇸', 'Washington presiona a la junta', 'El Departamento de Estado condiciona la ayuda militar al regreso a la democracia.', [
      ['Aceptar abrir un diálogo', E => { const r = R(E); if (r.junta) r.junta.aislamiento = Math.max(0, r.junta.aislamiento - 8); if (!r.transicion && !C.Regimen.democratico(E)) C.Regimen.iniciarTransicion(E, 'la presión de Estados Unidos'); return 'Se abre una rendija hacia la transición'; }],
      ['Desafiar: «Colombia no tiene tutores»', E => { const j = R(E).junta; if (j) { j.aislamiento += 10; j.legit += 2; } return 'Subes el tono; los puentes se queman'; }],
      ['Buscar apoyo de otros regímenes', E => { const j = R(E).junta; if (j) { j.aislamiento += 4; } C.Economia.aplicarDelta && C.Economia.aplicarDelta(E, 'inversion', -0.2); return 'Consigues socios incómodos'; }]
    ]),
    ev('rg_junta_desaparecidos', '🕯', 'Denuncian desapariciones', 'Organizaciones de derechos humanos entregan listas de desaparecidos y exigen una comisión internacional.', [
      ['Permitir la comisión internacional', E => { const j = R(E).junta; if (j) { j.legit += 2; j.repres -= 6; j.aislamiento -= 5; } return 'La junta cede un poco de opacidad'; }],
      ['Desacreditar a las ONG', E => { const j = R(E).junta; if (j) { j.resistencia += 4; j.aislamiento += 4; } C.Poderes && C.Poderes.mover(E, 'ong', -6); return 'Las ONG se radicalizan'; }],
      ['Ocultarlo con censura', E => { const j = R(E).junta; if (j) { j.censura += 10; j.legit -= 1; } C.Poderes && C.Poderes.mover(E, 'prensa', -6); return 'La prensa calla, pero la rumorología crece'; }]
    ]),
    ev('rg_partido_golpista', '🕯', 'Tu partido toca la puerta de los cuarteles', 'Los sectores duros de tu partido se reúnen con altos oficiales: «el país no aguanta más a este Gobierno». Te piden que te sumes.', [
      ['Frenarlos públicamente: «la democracia no se negocia»', E => { const r = R(E); r.golpistas = (r.golpistas || []).filter(g => g.pid !== E.jugador.partido); return C.Pais.ef(E, { rec: 1.5, honestidad: 2, partido: -3 }); }],
      ['Mirar para otro lado', { rec: 0, honestidad: -1 }],
      ['Apoyar el movimiento y ofrecerte como el rostro civil', E => { const r = R(E); const g = (r.golpistas || []).find(x => x.pid === E.jugador.partido); if (g) g.jugador = true; if (C.Poderes) C.Poderes.mover(E, 'militares', 4); return C.Pais.ef(E, { partido: 4, honestidad: -4, rec: 0.5 }); }]
    ]),
    ev('rg_proscrito_j', '🚫', 'Proscriben a tu partido', 'El régimen declara ilegal a tu partido y prohíbe presentar candidatos en su nombre. Sedes clausuradas, militantes vigilados.', [
      ['Pasar a la clandestinidad y resistir', E => { const j = R(E).junta; if (j) j.resistencia = Math.min(100, j.resistencia + 4); return C.Pais.ef(E, { rec: 1.5, partido: 3, seg: { jovenes: 1 } }); }],
      ['Denunciar ante la comunidad internacional', E => { const j = R(E).junta; if (j) j.aislamiento = Math.min(100, j.aislamiento + 4); return C.Pais.ef(E, { rec: 1, poder: { ong: 4 } }); }],
      ['Pactar con la junta a cambio de seguridad', E => C.Pais.ef(E, { honestidad: -5, partido: -4, patrimonio: 15 })]
    ]),
    ev('rg_h_estudiantes', '🎓', 'Masacre de estudiantes', 'El Ejército dispara contra una marcha universitaria en Bogotá. Los muertos son jóvenes de familias conocidas. La opinión se estremece.', [
      ['Exigir una investigación independiente', { rec: 2, honestidad: 2, seg: { jovenes: 2 } }],
      ['Guardar silencio por prudencia', { honestidad: -2 }],
      ['Justificar la «defensa del orden»', { rec: 0.5, honestidad: -4, seg: { jovenes: -2 } }]
    ]),
    ev('rg_h_prensa', '📰', 'La dictadura cierra un diario', 'La dictadura clausura un diario liberal y ordena a los demás medios «moderar el tono». Periodistas son citados a declarar.', [
      ['Solidarizarte y publicar el editorial prohibido', E => { if (C.Poderes) C.Poderes.mover(E, 'prensa', 5); return C.Pais.ef(E, { rec: 2, honestidad: 2 }); }],
      ['Pedir moderación a ambas partes', { rec: 0 }],
      ['Aplaudir el «orden informativo»', E => { if (C.Poderes) C.Poderes.mover(E, 'prensa', -5); return C.Pais.ef(E, { honestidad: -4 }); }]
    ]),
    ev('rg_transicion_ruido', '🕊', 'La calle exige elecciones', 'Gremios, iglesias y universidades piden un calendario electoral. Hasta algunos oficiales hablan de «volver a los cuarteles».', [
      ['Respaldar la apertura', E => { const r = R(E); if (!r.transicion && !C.Regimen.democratico(E)) C.Regimen.iniciarTransicion(E, 'el clamor social'); return C.Pais.ef(E, { rec: 1.5 }); }],
      ['Pedir prudencia a los militares', { rec: 0.3 }],
      ['Oponerse: «aún no es el momento»', E => { const j = R(E).junta; if (j) j.resistencia += 3; return C.Pais.ef(E, { rec: -0.5 }); }]
    ])
  ];
  C.DATA.eventos = (C.DATA.eventos || []).concat(C.DATA.regimenEventos);
})();
