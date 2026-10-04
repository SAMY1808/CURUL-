/* Escenarios históricos: una fecha de inicio real, un contexto, objetivos con plazo y un guion de hitos que
   ocurren en su fecha (noticias, choques o consultas). Los objetivos se evalúan solos cada semana. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const tuvo = (E, cargo) => (E.jugador.ocupados || []).includes(cargo);
  const leyes = E => (E.jugador.historialLegislativo || []).filter(h => h.resultado === 'ley').length;
  const U_anio = () => C.U.anio();
  const noti = (E, txt, tono, imp) => C.Medios.noticia(E, { tipo: 'general', titular: txt, tono: tono || 0, importante: imp !== false });

  C.DATA.escenarios = [
    { id: 'gaitan', nombre: 'El Bogotazo y la Violencia', anio: 1948, icono: '🔥',
      desc: 'Abril de 1948: el asesinato de Jorge Eliécer Gaitán incendia Bogotá y abre una década de violencia entre liberales y conservadores. Tu carrera empieza en el país más polarizado del siglo.',
      objetivos: [
        { id: 'cong', txt: 'Ser elegido congresista antes de 1958', hasta: 1958, check: E => tuvo(E, 'senador') || tuvo(E, 'representante') },
        { id: 'trans', txt: 'Llegar a 1957 con una reputación de honestidad de al menos 55', hasta: 1957, check: E => E.jugador.rep.honestidad >= 55, alFinal: true }
      ],
      guion: [
        { y: 1953, m: 5, fn: E => noti(E, 'Golpe de opinión: el general Rojas Pinilla asume el poder para «pacificar» el país', 0) },
        { y: 1957, m: 11, fn: E => noti(E, 'Plebiscito del 1.º de diciembre: se aprueba el Frente Nacional y el voto femenino', 1) }
      ] },
    { id: 'frente', nombre: 'El Frente Nacional', anio: 1958, icono: '🤝',
      desc: 'Liberales y conservadores pactan alternarse la presidencia durante 16 años y repartirse el Congreso en partes iguales. Abrirse camino sin ser de ninguno de los dos partidos es casi imposible.',
      objetivos: [
        { id: 'sen', txt: 'Llegar al Senado antes de 1970', hasta: 1970, check: E => tuvo(E, 'senador') },
        { id: 'ley', txt: 'Sacar adelante al menos 3 leyes antes de 1974', hasta: 1974, check: E => leyes(E) >= 3 }
      ],
      guion: [{ y: 1966, m: 7, fn: E => noti(E, 'Carlos Lleras Restrepo llega a la Presidencia y reforma el Estado', 0) }, { y: 1970, m: 3, fn: E => noti(E, 'Elecciones de 1970: la denuncia de fraude sacude al Frente Nacional', -1) }] },
    { id: 'm19', nombre: 'El M-19: de la guerra a la Constituyente', anio: 1984, icono: '🕊',
      desc: 'Corinto, el Palacio de Justicia, la desmovilización del M-19 y la Asamblea Constituyente: vive la década que cambió la Constitución de Colombia y toma las decisiones sobre la extradición, la Corte y la tutela.',
      objetivos: [
        { id: 'cons', txt: 'Ser elegido miembro de la Asamblea Constituyente de 1991 o apoyar su elección', hasta: 1991, check: E => (E.jugador.reconocimientos || []).some(r => /Constituyente/.test(r.txt)) },
        { id: 'paz', txt: 'Llegar a 1992 con la violencia política contenida (seguridad media sobre 40)', hasta: 1992, check: E => { const d = Object.values(E.deptos); return d.reduce((a, x) => a + x.seguridad, 0) / d.length >= 40; }, alFinal: true },
        { id: 'car', txt: 'Ocupar un cargo de elección popular antes de 1994', hasta: 1994, check: E => ['senador', 'representante', 'gobernador', 'alcalde', 'diputado', 'concejal'].some(c => tuvo(E, c)) }
      ],
      guion: [] },
    { id: 'constituyente', nombre: 'La Constituyente de 1991', anio: 1990, icono: '📜',
      desc: 'Un país cansado de la violencia pide una nueva Constitución. Están por nacer los partidos nuevos, la tutela, la Corte Constitucional y la elección popular de gobernadores.',
      objetivos: [
        { id: 'pres', txt: 'Ocupar un cargo de elección popular antes de 1995', hasta: 1995, check: E => ['senador', 'representante', 'gobernador', 'alcalde', 'diputado', 'concejal'].some(c => tuvo(E, c)) },
        { id: 'ref', txt: 'Ver una reforma constitucional en tu época', hasta: 2005, check: E => (E.constitucion.historial || []).length > 0 }
      ],
      guion: [{ y: 1991, m: 6, fn: E => noti(E, 'Se promulga la Constitución de 1991: nacen la Corte Constitucional, la tutela y la elección popular de alcaldes y gobernadores', 1) }] },
    { id: 'proceso8000', nombre: 'La apertura y el Proceso 8000', anio: 1994, icono: '💼',
      desc: 'Apertura económica, auge del narcotráfico y un escándalo de financiación de campañas que sacude al Presidente. La política se llena de sospechas.',
      objetivos: [
        { id: 'limpio', txt: 'Terminar 1999 con transparencia de al menos 55', hasta: 1999, check: E => E.jugador.rep.transparencia >= 55, alFinal: true },
        { id: 'sen', txt: 'Llegar al Senado antes de 2002', hasta: 2002, check: E => tuvo(E, 'senador') }
      ],
      guion: [{ y: 1995, m: 5, fn: E => { noti(E, 'Estalla el Proceso 8000: la Fiscalía investiga los dineros del narcotráfico en la campaña presidencial', -1); E.opinion.escandalos = (E.opinion.escandalos || 0) + 2; E.opinion.aprobacionPres = Math.max(5, E.opinion.aprobacionPres - 6); } }] },
    { id: 'paz2012', nombre: 'El proceso de paz', anio: 2012, icono: '🕊',
      desc: 'Se anuncian los diálogos de La Habana. El país se divide entre quienes quieren la paz negociada y quienes la rechazan. Tu voz pesará en el plebiscito y en la implementación.',
      objetivos: [
        { id: 'acuerdo', txt: 'Ver firmado un acuerdo de paz con al menos un grupo armado', hasta: 2020, check: E => Object.values(E.ordenPublico.grupos).some(g => g.acuerdoPaz) },
        { id: 'car', txt: 'Llegar a un cargo nacional (Senado o Gobierno) antes de 2018', hasta: 2018, check: E => tuvo(E, 'senador') || tuvo(E, 'ministro') || tuvo(E, 'presidente') }
      ],
      guion: [{ y: 2016, m: 5, fn: E => { if (C.Participacion && !C.Participacion.activo(E, 'ple:paz')) { C.Participacion.crear(E, { tipo: 'plebiscito', clave: 'ple:paz', tema: 'paz', titulo: 'Refrendar el acuerdo de paz', promotor: 'gobierno' }); noti(E, 'El Gobierno convoca un plebiscito para refrendar el acuerdo de paz', 0); } } }] },
    { id: 'pandemia', nombre: 'La pandemia de 2020', anio: 2019, icono: '🦠',
      desc: 'A finales de 2019 nadie imagina lo que viene. Una pandemia va a poner a prueba a todos los gobiernos, con cuarentenas, crisis económica y descontento social.',
      objetivos: [
        { id: 'cargo', txt: 'Ocupar un cargo de gobierno (alcalde, gobernador, ministro o Presidente) en 2022', hasta: 2022, check: E => ['alcalde', 'gobernador', 'ministro', 'presidente'].includes(E.jugador.cargo) },
        { id: 'apro', txt: 'Mantener una favorabilidad de al menos 55 a mediados de 2022', hasta: 2022, check: E => E.jugador.popularidad >= 55, alFinal: true }
      ],
      guion: [] }
,
    { id: 'reto_golpe', nombre: 'Reto: sobrevive cuatro años sin golpe', anio: 2026, icono: '🛡', reto: true,
      desc: 'País polarizado, aprobación baja y militares inquietos. Tu misión: llegar a 2030 sin que la democracia se rompa (ni por golpe ni por autogolpe).',
      objetivos: [{ id: 'dem', txt: 'Llegar a 2030 con la democracia intacta', hasta: 2030, check: E => !E.regimen || (E.regimen.tipo === 'democracia' && E.regimen.golpes === 0), alFinal: true }],
      guion: [{ y: 2026, m: 8, fn: E => { E.opinion.aprobacionPres = Math.min(E.opinion.aprobacionPres, 30); noti(E, 'Reto: la aprobación del Gobierno cae y los cuarteles empiezan a murmurar', -1); } }] },
    { id: 'reto_narco', nombre: 'Reto: sobrevive a Escobar (1989)', anio: 1989, icono: '💣', reto: true,
      desc: 'Galán ha sido asesinado y el cartel de Medellín declara la guerra al Estado. Hazte un nombre, sobrevive a los atentados y llega a 1994 con el cartel debilitado.',
      objetivos: [{ id: 'cartel', txt: 'Terminar 1994 con el poder del cartel por debajo de 30', hasta: 1994, check: E => C.Cartel && C.Cartel.asegurar(E).poder < 30, alFinal: true }, { id: 'vivo', txt: 'Llegar a 1994 con buena salud (más de 50)', hasta: 1994, check: E => (E.jugador.salud == null ? 85 : E.jugador.salud) > 50, alFinal: true }],
      guion: [] },
    { id: 'reto_deuda', nombre: 'Reto: evita la crisis de deuda', anio: 2024, icono: '📉', reto: true,
      desc: 'La deuda sube, el déficit se dispara y los mercados desconfían. Evita una crisis de deuda y el rescate del FMI antes de 2028.',
      objetivos: [{ id: 'sin', txt: 'Llegar a 2028 sin acuerdo con el FMI ni crisis de deuda', hasta: 2028, check: E => !C.Deuda || (C.Deuda.asegurar(E).programas === 0 && !C.Deuda.asegurar(E).crisis), alFinal: true }],
      guion: [{ y: 2024, m: 8, fn: E => { E.economia.deuda = Math.max(E.economia.deuda, 72); E.economia.deficit = Math.max(E.economia.deficit, 7); noti(E, 'Reto: la deuda pública llega a máximos y el déficit se dispara', -1); } }] },
    { id: 'reto_transicion', nombre: 'Reto: del régimen a la democracia (1954)', anio: 1954, icono: '🕊', reto: true,
      desc: 'Rojas Pinilla gobierna por decreto. Tu misión es contribuir a que el país regrese a la democracia antes de 1960: marchas, mesas y resistencia.',
      objetivos: [{ id: 'dem', txt: 'Ver restablecida la democracia antes de 1960', hasta: 1960, check: E => E.regimen && E.regimen.tipo === 'democracia' && U_anio() > 1957 }],
      guion: [] },
    { id: 'reto_lesa', nombre: 'Reto: que no te condene la justicia internacional (2002)', anio: 2002, icono: '⚖', reto: true,
      desc: 'Una política de resultados militares y la presión de la CPI. Gobierna sin que la sombra de la lesa humanidad te alcance antes de 2012.',
      objetivos: [{ id: 'cpi', txt: 'Llegar a 2012 sin orden de arresto de la CPI', hasta: 2012, check: E => !E.cidh || E.cidh.cpi.fase !== 'ordenes', alFinal: true }],
      guion: [] }
  ];
})(window.CURUL);
