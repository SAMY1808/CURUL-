/* Sistema multilateral (Fase 43): catálogos y eventos de la ONU, la OEA (Carta Democrática, MOE), la CIDH/Corte IDH/CPI
   y la Comunidad Andina. Los sistemas viven en js/sistemas/{onu,oea,cidh,can}.js. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const D = C.DATA.multi = {};
  /* ── ONU: resoluciones de la Asamblea General sobre las que vota Colombia. `e` = reacción de cada eje si votas SÍ ── */
  D.RESOLUCIONES = [
    { id: 'cuba', n: 'Levantar el embargo a Cuba', y: 1992, e: { occidente: -1, multipolar: 1, bolivariano: 1 } },
    { id: 'ucrania', n: 'Condenar la invasión rusa de Ucrania', y: 2022, e: { occidente: 1, multipolar: -1, bolivariano: -1 } },
    { id: 'gaza', n: 'Cese al fuego humanitario en Oriente Medio', y: 1967, e: { occidente: -0.5, multipolar: 1, bolivariano: 1 } },
    { id: 'clima', n: 'Fondo de pérdidas y daños por el cambio climático', y: 1992, e: { occidente: 0.3, multipolar: 0.6, bolivariano: 0.6 } },
    { id: 'sanciones', n: 'Condenar las sanciones económicas unilaterales', y: 1990, e: { occidente: -1, multipolar: 1, bolivariano: 1 } },
    { id: 'droga', n: 'Corresponsabilidad mundial frente al narcotráfico', y: 1988, e: { occidente: 0.2, multipolar: 0.3, bolivariano: 0.3 } },
    { id: 'csnu', n: 'Reformar el Consejo de Seguridad y limitar el veto', y: 1990, e: { occidente: -0.3, multipolar: 0.8, bolivariano: 0.8 } },
    { id: 'dh', n: 'Investigar violaciones de derechos humanos en un país aliado', y: 1990, e: { occidente: -0.6, multipolar: 0.2, bolivariano: 0.2 } },
    { id: 'descol', n: 'Descolonización y autodeterminación de los pueblos', y: 1960, e: { occidente: -0.5, multipolar: 0.6, bolivariano: 0.8 } },
    { id: 'apartheid', n: 'Condenar el apartheid sudafricano', y: 1962, e: { occidente: -0.3, multipolar: 0.8, bolivariano: 0.8 } },
    { id: 'desarme', n: 'Moratoria de ensayos nucleares', y: 1955, e: { occidente: -0.2, multipolar: 0.5, bolivariano: 0.4 } },
    { id: 'palestina', n: 'Reconocer a Palestina como Estado observador', y: 2012, e: { occidente: -0.8, multipolar: 0.8, bolivariano: 1 } }
  ];
  D.EPU_RECS = [
    'Investigar y sancionar las ejecuciones extrajudiciales y las desapariciones forzadas',
    'Proteger a los líderes sociales y defensores de derechos humanos',
    'Garantizar la independencia de la justicia y limitar el fuero militar',
    'Avanzar en la reforma rural y la restitución de tierras a las víctimas',
    'Proteger la libertad de prensa y a los periodistas amenazados',
    'Garantizar la protesta pacífica y reformar la actuación de la fuerza pública',
    'Erradicar el reclutamiento de menores y la violencia sexual en el conflicto',
    'Reconocer plenamente la jurisdicción de los órganos internacionales de derechos humanos'
  ];
  D.RELATORES = ['ejecuciones extrajudiciales', 'defensores de derechos humanos', 'libertad de expresión', 'pueblos indígenas', 'desplazamiento interno', 'tortura y tratos crueles'];
  /* ── OEA ── */
  D.OEA_MIEMBROS = 'ARG ATG BHS BRB BLZ BOL BRA CAN CHL CRI CUB DMA DOM ECU SLV GRD GTM GUY HTI HND JAM MEX NIC PAN PRY PER KNA LCA VCT SUR TTO USA URY VEN'.split(' ');
  D.SG_OEA = [['Albert Ramdin', 'SUR', 'neutral'], ['Luis Almagro', 'URY', 'derecha'], ['José Miguel Insulza', 'CHL', 'izquierda'], ['Miguel Ángel Rodríguez', 'CRI', 'derecha'], ['César Gaviria', 'COL', 'neutral']];
  /* ── CIDH: tipos de violación, instituciones señaladas ── */
  D.CIDH_TIPOS = {
    desaparicion: { n: 'Desaparición forzada', g: 9 }, ejecucion: { n: 'Ejecución extrajudicial', g: 9 }, masacre: { n: 'Masacre', g: 10 },
    tortura: { n: 'Tortura y tratos crueles', g: 8 }, detencion: { n: 'Detención arbitraria', g: 5 }, persecucion: { n: 'Persecución política', g: 6 },
    protesta: { n: 'Uso excesivo de la fuerza en protestas', g: 6 }, prensa: { n: 'Ataques a periodistas y censura', g: 5 },
    desplazamiento: { n: 'Desplazamiento forzado', g: 6 }, sexual: { n: 'Violencia sexual', g: 8 }, lider: { n: 'Asesinato de líderes sociales', g: 7 }
  };
  D.CIDH_INST = { ejercito: 'Ejército', policia: 'Policía', dni: 'Inteligencia (DAS/DNI)', paramilitar: 'Paramilitares con aquiescencia estatal', junta: 'Junta o régimen de facto', gobierno: 'Alto Gobierno (orden superior)' };
  /* ── CAN: decisiones (y: año en que ya están vigentes; null = proponibles) ── */
  D.CAN_DEC = [
    { id: 'zlc', n: 'Zona de Libre Comercio Andina (arancel cero)', area: 'comercio', y: 1993, integ: 8 },
    { id: 'aec', n: 'Arancel Externo Común', area: 'comercio', y: 1995, integ: 5 },
    { id: 'pi', n: 'Régimen Común de Propiedad Intelectual (Decisión 486)', area: 'comercio', y: 2000, integ: 3 },
    { id: 'inv', n: 'Régimen común de inversión extranjera (Decisión 291)', area: 'inversion', y: 1991, integ: 3 },
    { id: 'pasaporte', n: 'Pasaporte andino y libre tránsito de personas', area: 'migracion', y: 2001, integ: 5 },
    { id: 'roaming', n: 'Eliminación del roaming andino', area: 'telecom', y: 2022, integ: 2, ef: E => { E.opinion.aprobacionPres = Math.min(95, E.opinion.aprobacionPres + 0.4); } },
    { id: 'energia', n: 'Interconexión eléctrica andina', area: 'energia', y: null, integ: 5, ef: E => { C.Economia.aplicarDelta(E, 'inflacion', -0.05); } },
    { id: 'salud', n: 'Organismo Andino de Salud y compras conjuntas de medicamentos', area: 'salud', y: null, integ: 4 },
    { id: 'amazonia', n: 'Agenda andina de protección de la Amazonía', area: 'ambiente', y: null, integ: 3 },
    { id: 'drogas', n: 'Estrategia andina contra las drogas y el crimen transnacional', area: 'seguridad', y: null, integ: 4, ef: E => { for (const d of Object.values(E.deptos)) d.seguridad = Math.min(99, d.seguridad + 0.2); } },
    { id: 'migracion', n: 'Estatuto migratorio andino (regularización)', area: 'migracion', y: null, integ: 4 },
    { id: 'titulos', n: 'Reconocimiento mutuo de títulos universitarios', area: 'educacion', y: null, integ: 3, ef: E => { for (const d of Object.values(E.deptos)) d.educacion = Math.min(99, d.educacion + 0.1); } },
    { id: 'servicios', n: 'Liberalización andina de servicios', area: 'comercio', y: null, integ: 4, ef: E => { C.Economia.aplicarDelta(E, 'exportaciones', 0.1); } },
    { id: 'transporte', n: 'Transporte internacional de carga por carretera sin barreras', area: 'comercio', y: null, integ: 4, ef: E => { C.Economia.aplicarDelta(E, 'exportaciones', 0.12); } }
  ];
  D.CAN_CONFLICTOS = [
    { id: 'salv', n: 'una salvaguardia a las importaciones colombianas', area: 'comercio' },
    { id: 'camiones', n: 'restricciones al paso de camiones de carga en la frontera', area: 'transporte' },
    { id: 'lic', n: 'licencias previas de importación contra productos andinos', area: 'comercio' },
    { id: 'sanit', n: 'barreras sanitarias a productos agrícolas colombianos', area: 'agro' },
    { id: 'subs', n: 'subsidios a las exportaciones de un socio', area: 'comercio' }
  ];
  D.CAN_ORDEN = ['BOL', 'COL', 'ECU', 'PER'];
  D.CAF = { infra: 'Infraestructura vial y logística', social: 'Agua, salud y educación', ambiente: 'Transición energética y ambiente' };

  /* ── Eventos con decisión del jugador ── */
  const ef = o => E => C.Pais.ef(E, o);
  const ev = (id, icono, titulo, texto, ops, extra) => Object.assign({ id, tipo: 'multilateral', icono, alcance: 'jugador', sistema: true, multilateral: true, peso: 1, titulo, texto, opciones: ops.map(([t, o]) => ({ t, fn: typeof o === 'function' ? o : ef(o) })) }, extra || {});
  const vars = e => (e && e.ctx && e.ctx.vars) || {};
  D.EVENTOS = [
    ev('ml_ag_voto', '🗳', 'Votación en la Asamblea General', 'La Asamblea General de la ONU vota: «{res}». Los bloques esperan tu posición.', [
      ['Votar a favor', (E, e) => C.ONU.votar(E, vars(e).rid, 1)], ['Abstenerte', (E, e) => C.ONU.votar(E, vars(e).rid, 0)], ['Votar en contra', (E, e) => C.ONU.votar(E, vars(e).rid, -1)]]),
    ev('ml_epu', '📋', 'Examen Periódico Universal', 'Colombia es examinada por el Consejo de Derechos Humanos de la ONU. Decenas de países hacen recomendaciones; entre ellas: «{rec}».', [
      ['Aceptar todas las recomendaciones', E => C.ONU.epu(E, 'todas')], ['Aceptar sólo algunas y «tomar nota» del resto', E => C.ONU.epu(E, 'parcial')], ['Rechazar el examen como «injerencia»', E => C.ONU.epu(E, 'rechazo')]]),
    ev('ml_relator', '🧑‍⚖️', 'Visita de un Relator Especial de la ONU', 'Un relator sobre {tema} pide visitar el país y reunirse con víctimas y organizaciones.', [
      ['Invitarlo y darle acceso total', E => C.ONU.relator(E, true)], ['Negar la visita «por razones de soberanía»', E => C.ONU.relator(E, false)]]),
    ev('ml_sg_onu', '🌐', 'Elección del Secretario General de la ONU', 'Se acerca el relevo en la Secretaría General. Hay candidatos de los tres bloques y piden el respaldo de Colombia.', [
      ['Apoyar a una candidata latinoamericana', E => { C.ONU.eje(E, { occidente: 0.5, multipolar: 0.5, bolivariano: 1 }); return C.Pais.ef(E, { rec: 1 }); }],
      ['Alinearse con la candidatura de Occidente', E => { C.ONU.eje(E, { occidente: 2, multipolar: -1, bolivariano: -1 }); return C.Pais.ef(E, { rec: 0.5 }); }],
      ['Mantenerse neutral hasta el final', { rec: 0 }]]),
    ev('ml_oea_voto', '🏛', 'Carta Democrática: ¿suspender a {pais}?', 'El Consejo Permanente de la OEA debate suspender a {pais} por la ruptura del orden democrático. Colombia tiene voto y los demás miran su posición.', [
      ['Votar a favor de la suspensión', (E, e) => C.OEA.votoJ(E, vars(e).cid, 1)], ['Abstenerte', (E, e) => C.OEA.votoJ(E, vars(e).cid, 0)], ['Votar en contra: «no intervención»', (E, e) => C.OEA.votoJ(E, vars(e).cid, -1)]]),
    ev('ml_oea_col', '🚨', 'La OEA activa la Carta Democrática contra Colombia', 'El Consejo Permanente de la OEA se reúne de urgencia: varios países afirman que en Colombia «se ha roto el orden democrático». Se discute una misión de alto nivel y, si no hay rectificación, la suspensión.', [
      ['Aceptar la misión y anunciar un camino de regreso a la democracia', E => C.OEA.respuestaCol(E, 'aceptar')], ['Hacer cabildeo intenso con los gobiernos amigos', E => C.OEA.respuestaCol(E, 'cabildeo')], ['Denunciar la Carta de la OEA: «no aceptamos tutelas»', E => C.OEA.respuestaCol(E, 'retiro')]], { forzar: true }),
    ev('ml_moe', '🗳', 'Informe de la Misión de Observación Electoral de la OEA', 'La misión de observación presenta su informe sobre las elecciones: «{txt}».', [
      ['Acoger las recomendaciones', { rec: 0.5, honestidad: 1 }], ['Descalificar a la misión', { rec: 0, honestidad: -1 }]]),
    ev('ml_cidh_visita', '🔎', 'La CIDH pide una visita in loco', 'La Comisión Interamericana de Derechos Humanos quiere visitar el país para verificar denuncias sobre {tipo}.', [
      ['Invitarla y garantizar libertad de movimiento', E => C.CIDH.visita(E, true)], ['Negar el acceso', E => C.CIDH.visita(E, false)]], { forzar: true }),
    ev('ml_cidh_informe', '📑', 'La CIDH publica su informe sobre el caso {caso}', 'La Comisión concluyó que el Estado es responsable y emite recomendaciones. Si no se cumplen en el plazo, el caso pasará a la Corte IDH.', [
      ['Aceptar responsabilidad y buscar una solución amistosa', (E, e) => C.CIDH.accion(E, vars(e).cid, 'amistosa')], ['Cumplir las recomendaciones', (E, e) => C.CIDH.accion(E, vars(e).cid, 'cumplir')], ['Desconocer el informe', (E, e) => C.CIDH.accion(E, vars(e).cid, 'desacatar')]]),
    ev('ml_cidh_sentencia', '⚖', 'Sentencia de la Corte IDH: caso {caso}', 'La Corte Interamericana condena al Estado colombiano por {tipo} y ordena reparaciones, una disculpa pública y la investigación de los responsables.', [
      ['Cumplir de inmediato con disculpa pública', (E, e) => C.CIDH.accion(E, vars(e).cid, 'cumplir')], ['Cumplir sólo la indemnización', (E, e) => C.CIDH.accion(E, vars(e).cid, 'parcial')], ['Atacar el fallo como «injerencia»', (E, e) => C.CIDH.accion(E, vars(e).cid, 'desacatar')]], { forzar: true }),
    ev('ml_cpi', '🏛', 'La Corte Penal Internacional pone la lupa sobre Colombia', 'La Fiscalía de la CPI anuncia un examen preliminar: hay indicios de crímenes de lesa humanidad cometidos de forma sistemática.', [
      ['Cooperar y reforzar la justicia interna (complementariedad)', E => C.CIDH.cpi(E, 'cooperar')], ['Ignorar la comunicación', E => C.CIDH.cpi(E, 'ignorar')], ['Atacar a la Corte y proteger a los uniformados', E => C.CIDH.cpi(E, 'atacar')]], { forzar: true }),
    ev('ml_can_decision', '🏔', 'Decisión andina: {dec}', 'El Consejo Andino de Ministros vota la decisión «{dec}». Es una propuesta de {pais}; se necesita mayoría de los países miembros.', [
      ['Apoyarla', (E, e) => C.CAN.votoJ(E, vars(e).did, 1)], ['Condicionar tu voto a ventajas para Colombia', (E, e) => C.CAN.votoJ(E, vars(e).did, 0)], ['Votar en contra', (E, e) => C.CAN.votoJ(E, vars(e).did, -1)]]),
    ev('ml_can_conflicto', '🚛', 'Conflicto comercial en la Comunidad Andina', '{pais} aplica {obj}. Los gremios colombianos piden reacción y la Secretaría General de la CAN ofrece mediar.', [
      ['Negociar y pedir el dictamen de la Secretaría General', (E, e) => C.CAN.respuesta(E, vars(e).kid, 'negociar')], ['Demandar el incumplimiento ante el Tribunal Andino', (E, e) => C.CAN.respuesta(E, vars(e).kid, 'demandar')], ['Responder con una medida equivalente', (E, e) => C.CAN.respuesta(E, vars(e).kid, 'retaliar')]]),
    ev('ml_can_demanda', '⚖', 'El Tribunal Andino te cita', '{pais} demandó a Colombia ante el Tribunal de Justicia de la Comunidad Andina por {obj}.', [
      ['Revocar la medida y acatar el fallo', (E, e) => C.CAN.respuesta(E, vars(e).kid, 'acatar')], ['Defender la medida ante el Tribunal', (E, e) => C.CAN.respuesta(E, vars(e).kid, 'defender')]])
  ];
  C.DATA.eventos = (C.DATA.eventos || []).concat(D.EVENTOS);
})(window.CURUL);
