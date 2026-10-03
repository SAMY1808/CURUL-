/* Datos de las gobernaciones (Fase 39): vocaciones económicas por departamento, sectores, regiones, ordenanzas,
   metas del plan de desarrollo y los eventos del gobernador (sistema: los dispara CURUL.Gobernacion). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
CURUL.DATA.gobernacion = {
  SECTORES: {
    cafe: ['Café', '☕'], industria: ['Industria', '🏭'], mineria: ['Minería', '⛏'], flores: ['Flores', '🌷'], puertos: ['Puertos y logística', '🚢'], comercio: ['Comercio', '🛍'],
    turismo: ['Turismo', '🏖'], petroleo: ['Petróleo y gas', '🛢'], agro: ['Agro', '🌾'], ganaderia: ['Ganadería', '🐄'], banano: ['Banano', '🍌'], carbon: ['Carbón', '⚫'],
    pesca: ['Pesca', '🎣'], energia: ['Energía', '⚡'], servicios: ['Servicios', '💼'], azucar: ['Caña y azúcar', '🍬'], frontera: ['Comercio de frontera', '🛂']
  },
  VOCACION: {
    ANT: ['industria', 'cafe', 'mineria', 'flores'], ATL: ['puertos', 'industria', 'comercio'], BOG: ['servicios', 'industria', 'comercio'], BOL: ['puertos', 'turismo', 'industria'], BOY: ['agro', 'mineria', 'turismo'],
    CAL: ['cafe', 'servicios', 'turismo'], CAQ: ['ganaderia', 'petroleo', 'agro'], CAU: ['agro', 'mineria', 'cafe'], CES: ['carbon', 'ganaderia', 'agro'], COR: ['ganaderia', 'agro', 'mineria'],
    CUN: ['flores', 'agro', 'industria'], CHO: ['mineria', 'pesca', 'turismo'], HUI: ['cafe', 'petroleo', 'turismo'], LAG: ['carbon', 'energia', 'turismo'], MAG: ['banano', 'turismo', 'puertos'],
    MET: ['petroleo', 'agro', 'ganaderia'], NAR: ['agro', 'pesca', 'turismo'], NSA: ['frontera', 'comercio', 'carbon'], QUI: ['cafe', 'turismo', 'agro'], RIS: ['cafe', 'industria', 'turismo'],
    SAN: ['petroleo', 'agro', 'industria'], SUC: ['ganaderia', 'agro', 'comercio'], TOL: ['agro', 'turismo', 'energia'], VAL: ['azucar', 'puertos', 'industria'], ARA: ['petroleo', 'ganaderia', 'frontera'],
    CAS: ['petroleo', 'ganaderia', 'agro'], PUT: ['petroleo', 'agro', 'frontera'], SAP: ['turismo', 'pesca', 'comercio'], AMA: ['turismo', 'pesca', 'comercio'], GUA: ['agro', 'turismo', 'pesca'],
    GUV: ['agro', 'ganaderia', 'turismo'], VAU: ['agro', 'turismo', 'pesca'], VIC: ['ganaderia', 'agro', 'turismo']
  },
  REGIONES: { 'Caribe': 'RAP Caribe', 'Andina': 'RAP Eje Andino', 'Pacífico': 'RAP Pacífico', 'Orinoquía': 'RAP Orinoquía', 'Amazonía': 'RAP Amazonía' },
  ORDENANZAS: {
    universidad: { n: 'Universidad pública departamental', icono: '🎓', caja: 0.04, ef: { edu: 5, empleo: 2 }, ingreso: 0, cool: 156, txt: 'Una sede universitaria propia: más educación y empleo calificado.' },
    hospital: { n: 'Hospital regional de alta complejidad', icono: '🏥', caja: 0.05, ef: { salud: 6 }, ingreso: 0, cool: 156, txt: 'Menos remisiones a otras ciudades y mejor salud.' },
    estampilla: { n: 'Estampilla departamental', icono: '🧾', caja: 0, ef: { animo: -3 }, ingreso: 0.12, cool: 104, txt: 'Un recaudo adicional (≈12 % más de caja); no cae bien.' },
    licores: { n: 'Monopolio y fábrica de licores', icono: '🍾', caja: 0.02, ef: {}, ingreso: 0.18, cool: 156, txt: 'Una renta propia importante, con críticas por salud pública.' },
    turismo: { n: 'Tasa y plan de turismo regional', icono: '🧳', caja: 0.01, ef: { turismo: 8 }, ingreso: 0.05, cool: 78, txt: 'Promoción turística y una pequeña tasa a visitantes.' },
    seguridad: { n: 'Bono de seguridad y recompensas', icono: '🛡', caja: 0.01, ef: { amenaza: -6 }, ingreso: 0, cool: 78, txt: 'Fondo para investigación criminal y recompensas.' },
    reforma: { n: 'Reforma administrativa y modernización', icono: '🗂', caja: 0.005, ef: { ahorro: 0.08, honestidad: 1 }, ingreso: 0.04, cool: 156, txt: 'Una gobernación más eficiente y transparente.' },
    campo: { n: 'Fondo de fomento agropecuario', icono: '🚜', caja: 0.03, ef: { agro: 8, pobreza: -0.3 }, ingreso: 0, cool: 104, txt: 'Crédito y asistencia técnica para el campo.' }
  },
  METAS: {
    educacion: { n: 'Mejorar la educación', ind: 'educacion', meta: 6 }, salud: { n: 'Mejorar la salud', ind: 'salud', meta: 6 }, seguridad: { n: 'Mejorar la seguridad', ind: 'seguridad', meta: 7 },
    infraestructura: { n: 'Más y mejores vías', ind: 'infraestructura', meta: 7 }, pobreza: { n: 'Reducir la pobreza', ind: 'pobreza', meta: -3, inv: true }, desempleo: { n: 'Reducir el desempleo', ind: 'desempleo', meta: -1.5, inv: true }
  },
  /* Eventos del gobernador. Efectos con CURUL.Gobernacion.ef(E, {...}) */
  EVENTOS: []
};
(function () {
  const ef = o => E => CURUL.Gobernacion.ef(E, o);
  const ev = (id, icono, peso, titulo, texto, ops, extra) => Object.assign({ id, tipo: 'gobernación', icono, alcance: 'jugador', gobernacion: true, sistema: true, peso, titulo, texto, opciones: ops.map(([t, o]) => ({ t, fn: ef(o) })) }, extra || {});
  const voc = k => (E => (CURUL.DATA.gobernacion.VOCACION[E.jugador.cargoInfo.depto] || []).includes(k));
  const G = CURUL.DATA.gobernacion;
  G.EVENTOS = [
    ev('ga_feria', '🎉', 1, 'Llegan las ferias y fiestas del departamento', 'Todo {depto} espera su gran fiesta regional. Los alcaldes quieren protagonismo y los gremios, turistas.', [
      ['Gran feria con artistas y presencia en todas las subregiones', { caja: -0.02, animo: 8, turismo: 10, rec: 2, afin: 3 }], ['Fiesta austera y bien organizada', { caja: -0.008, animo: 4, turismo: 5, rec: 1 }], ['Recortar y destinar el dinero a obras', { animo: -4, turismo: -4, caja: 0.006, rec: -0.5 }]]),
    ev('ga_masacre', '🕯', 2, 'Masacre en una vereda', 'Un grupo armado asesina a varias personas en una vereda de {depto}. La comunidad exige presencia del Estado.', [
      ['Consejo de seguridad extraordinario en el territorio', { amenaza: -6, animo: 2, rec: 2.5, caja: -0.006 }], ['Pedirle al Ejército y al Gobierno Nacional refuerzo', { amenaza: -4, nacion: -2, rec: 1 }], ['Lamentar los hechos en un comunicado', { amenaza: 3, animo: -5, rec: -2 }]], { sit: v => 1 + v.amenazaMedia / 60 }),
    ev('ga_amenaza_alcalde', '☠', 2, 'Amenazan a un alcalde de tu departamento', 'Un alcalde denuncia amenazas de un grupo armado y amenaza con renunciar. Otros alcaldes miran para ver qué haces.', [
      ['Esquema de protección y consejo de seguridad en su municipio', { amenaza: -3, afin: 5, caja: -0.004, rec: 1 }], ['Pedir protección a la Unidad Nacional', { afin: 2, nacion: 1 }], ['Dejarlo a su suerte', { afin: -8, rec: -1.5 }]]),
    ev('ga_paro_agrario', '🚜', 2, 'Paro agrario bloquea las vías', 'Productores bloquean las principales carreteras de {depto} por los precios y los costos de los insumos.', [
      ['Mesa de negociación con subsidios y compras públicas', { agro: 6, animo: 1, caja: -0.015, rec: 2, nacion: 0 }], ['Pedirle al Gobierno Nacional una política de precios', { agro: 3, nacion: -2, rec: 1.5, animo: 1 }], ['Pedir desbloqueo por la fuerza', { agro: -4, animo: -5, amenaza: 2, rec: -1 }]], { req: voc('agro') }),
    ev('ga_plaga_cafe', '🐛', 1, 'Plaga de la roya amenaza la cosecha de café', 'La roya golpea los cafetales del departamento y el precio internacional no ayuda a los caficultores.', [
      ['Subsidio de renovación de cafetales y asistencia técnica', { cafe: 8, caja: -0.02, rec: 2, animo: 2 }], ['Gestionar apoyo de la Federación y de la Nación', { cafe: 4, nacion: 1, rec: 1.5 }], ['Esperar a que el mercado se ajuste', { cafe: -8, animo: -3, rec: -1.5 }]], { req: voc('cafe') }),
    ev('ga_petroleo_cae', '🛢', 2, 'Cae el precio del petróleo y se desploman las regalías', 'El barril se desploma y la economía de {depto} lo siente en regalías, contratos y empleo.', [
      ['Plan de diversificación económica y apoyo a pymes', { petroleo: -3, comercio: 4, agro: 3, caja: -0.02, rec: 1.5 }], ['Pedirle a la Nación un fondo de estabilización', { caja: 0.015, nacion: -1, rec: 1 }], ['Recortar el gasto social', { caja: 0.012, animo: -6, pobreza: 0.3 }]], { req: voc('petroleo') }),
    ev('ga_mina_tragedia', '⛏', 1, 'Tragedia en una mina', 'Un derrumbe atrapa mineros en un socavón en {depto}. El país está pendiente del rescate.', [
      ['Liderar el rescate en persona y declarar calamidad', { animo: 3, rec: 4, caja: -0.01, honestidad: 1 }], ['Pedir ayuda a la Agencia Nacional de Minería', { rec: 1, nacion: 1 }], ['Culpar a la informalidad minera', { animo: -3, rec: -2, mineria: -3 }]], { req: voc('mineria') }),
    ev('ga_cierre_frontera', '🛂', 2, 'Cierre de la frontera', 'Venezuela cierra el paso fronterizo; los comerciantes de {depto} quedan atrapados y el contrabando se dispara.', [
      ['Corredor humanitario y plan de apoyo al comercio', { frontera: -2, comercio: 3, animo: 2, caja: -0.01, rec: 2 }], ['Exigirle a la Cancillería una salida diplomática', { nacion: -1, rec: 1.5, animo: 1 }], ['Intensificar controles y operativos', { amenaza: -2, frontera: -4, animo: -2 }]], { req: voc('frontera') }),
    ev('ga_banano', '🍌', 1, 'Exportadores de banano piden ayuda por el invierno', 'Un invierno prolongado golpea las plantaciones de banano y los exportadores amenazan con despidos.', [
      ['Línea de crédito y adecuación de canales de riego', { banano: 7, caja: -0.015, rec: 1.5 }], ['Gestionar un alivio de la Nación', { banano: 3, nacion: 0 }], ['No intervenir', { banano: -7, animo: -3 }]], { req: voc('banano') }),
    ev('ga_flores', '🌷', 1, 'Fiebre de pedidos de flores para exportación', 'Un boom de demanda internacional exige más cuartos fríos, logística y transporte.', [
      ['Invertir en infraestructura aeroportuaria y de frío', { flores: 8, caja: -0.02, rec: 2, empleo: 2 }], ['Dejar que invierta el sector privado', { flores: 4 }], ['Cobrar más impuestos al sector', { caja: 0.02, flores: -4, animo: -1 }]], { req: voc('flores') }),
    ev('ga_ese', '🏥', 3, 'Quiebra la ESE departamental', 'El hospital público del departamento está al borde del cierre por las deudas de las EPS.', [
      ['Capitalizarlo con recursos propios', { salud: 3, caja: -0.03, rec: 2, animo: 3 }], ['Exigirles el pago a las EPS ante la Supersalud', { salud: 1.5, rec: 2, nacion: 0 }], ['Dejar que se liquide', { salud: -5, animo: -6, rec: -2 }]], { sit: (v, d) => 1 + (60 - d.salud) / 40 }),
    ev('ga_regalias', '💸', 2, 'Escándalo por regalías mal invertidas', 'La Contraloría revela que obras con regalías están abandonadas o con sobrecostos.', [
      ['Reconocer fallas, suspender contratos y colaborar con las autoridades', { honestidad: 4, rec: 1, animo: 1, caja: -0.005 }], ['Culpar a la administración anterior', { rec: 0.5, honestidad: -1, animo: -1 }], ['Negar todo y atacar a la Contraloría', { honestidad: -4, rec: -2.5, animo: -3 }]]),
    ev('ga_asamblea_cupos', '🏛', 3, 'La Asamblea cobra cupos para aprobar el presupuesto', 'Un grupo de diputados bloquea el presupuesto del próximo año hasta que negocien contratos y cargos.', [
      ['Ceder: contratos y cargos a cambio de aprobación', { asamblea: 18, honestidad: -4, rec: -1 }], ['Negociar proyectos regionales, sin cargos', { asamblea: 7, honestidad: 0 }], ['Hacerlo público y pelear en la plaza', { asamblea: -14, rec: 3, honestidad: 3, animo: 2 }]], { sit: v => 1 + (55 - v.asamblea) / 30 }),
    ev('ga_debate_asamblea', '🎤', 3, 'Debate de control en la Asamblea', 'La oposición cita a tu secretario de Infraestructura para que explique obras atrasadas. Será televisado.', [
      ['Asistir tú y defender la gestión', { asamblea: 4, rec: 2, animo: 1 }], ['Dejar solo al secretario', { asamblea: -3, rec: -1.5 }], ['Contraatacar a la oposición con denuncias', { asamblea: -7, rec: 2.5 }]]),
    ev('ga_rap', '🤝', 1, 'Invitan a la Región Administrativa y de Planificación', 'Tus colegas de la región proponen un pacto para gestionar obras conjuntas ante la Nación.', [
      ['Adherir y liderar la agenda regional', { nacion: 2, rec: 2, afin: 0, caja: -0.004 }], ['Participar sin comprometerte', { rec: 0.5 }], ['Rechazar: «cada quien en su casa»', { rec: -0.5, nacion: -1 }]]),
    ev('ga_nacion_transferencias', '📉', 2, 'La Nación se atrasa en las transferencias', 'Hacienda anuncia un ajuste y retrasa giros al departamento. Los alcaldes esperan plata de ti.', [
      ['Denunciar el incumplimiento ante los medios', { nacion: -4, rec: 3, animo: 2 }], ['Negociar un cronograma de pagos', { nacion: 1, caja: 0.008 }], ['Aguantar y recortar el gasto propio', { caja: -0.008, animo: -3, afin: -3 }]]),
    ev('ga_rival', '⚔', 2, 'Tu rival departamental te roba una inversión', 'El gobernador vecino anuncia que una gran empresa instalará su planta en su departamento, justo cuando tú la cortejabas.', [
      ['Contraofertar con incentivos tributarios', { caja: -0.015, comercio: 4, industria: 4, rec: 1.5 }], ['Hacerle una campaña mediática de «lo nuestro es mejor»', { rec: 2, animo: 2, nacion: 0 }], ['Reconocer la derrota y buscar otra empresa', { rec: -0.5, animo: -1 }]]),
    ev('ga_inundacion', '🌧', 3, 'Creciente del río deja miles de damnificados', 'Un río se sale de cauce y anega municipios enteros de {depto}.', [
      ['Declarar calamidad y liderar la respuesta', { animo: 3, rec: 4, caja: -0.02, afin: 3 }], ['Pedirle ayuda urgente a la UNGRD', { nacion: 1, rec: 1.5, caja: 0.01 }], ['Delegar en los alcaldes', { animo: -4, afin: -3, rec: -1.5 }]]),
    ev('ga_incendio', '🔥', 1, 'Incendio forestal en el departamento', 'Un incendio avanza sobre reservas naturales y varios municipios piden helicópteros.', [
      ['Contratar helicópteros y movilizar bomberos', { animo: 2, rec: 2.5, caja: -0.012, turismo: -1 }], ['Pedir apoyo a la Nación y a las Fuerzas Armadas', { nacion: 0, rec: 1.5 }], ['Esperar a que llueva', { animo: -3, turismo: -4, rec: -2 }]]),
    ev('ga_estudiantes', '🎓', 2, 'Paro de maestros y estudiantes', 'Los docentes se van a paro por los pagos atrasados y las condiciones de las escuelas rurales.', [
      ['Pagar los atrasados y abrir una mesa permanente', { edu: 3, caja: -0.02, rec: 2, animo: 2 }], ['Pedirle plata a la Nación', { nacion: -1, rec: 1 }], ['Descontar los días de paro', { edu: -3, animo: -4, rec: -1 }]]),
    ev('ga_obra_bloqueada', '🚧', 2, 'Una obra vial se frena por un conflicto con la comunidad', 'Comunidades de una subregión bloquean la maquinaria de la vía más importante del departamento.', [
      ['Subir a la zona y concertar con las comunidades', { infra: 2, afin: 3, rec: 2, caja: -0.006 }], ['Presionar con el contratista y la fuerza pública', { infra: 3, animo: -4, rec: -1 }], ['Suspender la obra hasta nuevo aviso', { infra: -2, rec: -1.5 }]]),
    ev('ga_reina', '👑', 1, 'Escándalo del reinado departamental', 'Una polémica en el reinado de belleza se vuelve tendencia nacional y te piden que tomes posición.', [
      ['Pedir reformas y mayor transparencia', { rec: 1.5, animo: 1 }], ['Dejar que lo resuelvan los organizadores', { rec: 0 }], ['Hacerte el chistoso en redes', { rec: 1, animo: 2, honestidad: -0.5 }]]),
    ev('ga_inversion', '🏭', 2, 'Una multinacional evalúa invertir en tu departamento', 'Una gran empresa estudia ubicar su planta en tu región y exige incentivos, seguridad jurídica y vías.', [
      ['Ofrecer exenciones y una zona industrial', { industria: 8, comercio: 3, empleo: 4, caja: -0.02, rec: 2.5 }], ['Ofrecer sólo seguridad jurídica y trámites rápidos', { industria: 4, rec: 1.5 }], ['Rechazar por impactos ambientales y sociales', { rec: 1, animo: 1, industria: -2 }]]),
    ev('ga_turismo', '🧳', 1, 'Un famoso destino turístico se llena', 'Un puente festivo desborda los hoteles y los servicios en tu destino turístico estrella.', [
      ['Reforzar servicios y control de precios', { turismo: 8, animo: 2, caja: -0.008, rec: 1.5 }], ['Cobrar una tasa temporal', { turismo: 2, caja: 0.015, animo: -2 }], ['Dejar que el mercado resuelva', { turismo: -2, animo: -2, rec: -1 }]], { req: voc('turismo') }),
    ev('ga_gira', '🚙', 2, 'Los alcaldes piden que visites el territorio', 'Alcaldes de varias subregiones se quejan de que sólo apareces en la capital.', [
      ['Gira por todas las subregiones con consejos comunitarios', { afin: 8, animo: 3, rec: 2, caja: -0.008 }], ['Mandar a tus secretarios', { afin: 2, rec: 0 }], ['Ignorar: «gobierno desde la oficina»', { afin: -7, rec: -1.5 }]]),
    ev('ga_apagon', '💡', 1, 'Apagón regional', 'Una falla deja sin energía a varias subregiones del departamento durante un día.', [
      ['Exigir a la empresa de energía y coordinar la emergencia', { animo: 2, rec: 2.5 }], ['Pedir ayuda a la Nación', { nacion: 0, rec: 0.5 }], ['Esperar el comunicado oficial', { animo: -3, rec: -1 }]]),
    ev('ga_candidato', '🗳', 1, 'Te mencionan como presidenciable', 'Un columnista nacional dice que «el próximo presidente podría salir de esta gobernación». Los rivales tiemblan.', [
      ['Aprovechar la ola y dar entrevistas nacionales', { rec: 4, animo: 2, nacion: -1 }], ['Negarlo con humildad: «mi trabajo es mi departamento»', { rec: 1.5, animo: 3, honestidad: 1 }], ['Insinuar que sí vas por la Presidencia', { rec: 3, nacion: -2, animo: -1 }]], { req: (E, v) => v.animo > 55 }),
    ev('ga_alcaldes_bloque', '🧱', 2, 'Un bloque de alcaldes te desafía', 'Una docena de alcaldes pide más recursos y amenaza con una carta pública contra tu gestión.', [
      ['Recibirlos y negociar un fondo compartido', { afin: 10, caja: -0.012, rec: 1.5 }], ['Dividirlos con convenios individuales', { afin: 2, caja: -0.006 }], ['Atacarlos en medios por politiqueros', { afin: -12, rec: 1 }]], { sit: v => 1 + (55 - v.afinMedia) / 30 }),
    ev('ga_premio', '🏆', 1, 'Un ranking destaca la gestión de tu departamento', 'Un ranking independiente reconoce los avances de {depto} en transparencia e inversión.', [
      ['Capitalizarlo con una campaña regional', { rec: 3, turismo: 3, animo: 4 }], ['Atribuirlo a tu equipo y a los alcaldes', { rec: 1.5, afin: 4 }], ['Usarlo para pedir más recursos a la Nación', { rec: 1, nacion: 2 }]], { req: (E, v) => v.animo > 60 })
  ];
})();
CURUL.DATA.eventos = (CURUL.DATA.eventos || []).concat(CURUL.DATA.gobernacion.EVENTOS);
