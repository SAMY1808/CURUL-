/* Eventos de la Fase 40: demandas de los poderes fácticos, prensa de investigación, crisis de partido, actualidad nacional
   y vida personal. Efectos con CURUL.Pais.ef. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function () {
  const ef = o => E => CURUL.Pais.ef(E, o);
  const ev = (id, tipo, icono, titulo, texto, ops, extra) => Object.assign({ id, tipo, icono, alcance: 'jugador', sistema: true, peso: 1, titulo, texto, opciones: ops.map(([t, o]) => ({ t, fn: typeof o === 'function' ? o : ef(o) })) }, extra || {});
  const P = (poder, id, icono, titulo, texto, ops) => ev(id, 'poder', icono, titulo, texto, ops, { poder });
  const resp = via => (E, e) => { const a = CURUL.Acciones.get(via); const r = a.ejecutar(E, { inv: e.ctx.inv }); return r && r.msg; };
  CURUL.DATA.eventos = (CURUL.DATA.eventos || []).concat([
    // ── Poderes fácticos ──
    P('iglesia', 'po_iglesia_ley', '⛪', 'La Iglesia pide frenar una reforma', 'La Conferencia Episcopal y las iglesias cristianas piden que no avances en una reforma que consideran contraria a «los valores de la familia».', [
      ['Escucharlos y congelar la reforma', { poder: { iglesia: 12 }, favor: { iglesia: -1 }, seg: { mayores: 3, rural: 2 }, rec: 0.5 }], ['Recibirlos pero seguir adelante', { poder: { iglesia: 2 }, seg: { jovenes: 1 } }], ['Defender el Estado laico', { poder: { iglesia: -14 }, seg: { jovenes: 3, universitarios: 3, mayores: -3 }, rec: 1.5 }]]),
    P('iglesia', 'po_iglesia_social', '⛪', 'Las iglesias piden recursos para su obra social', 'Una red de iglesias que atiende comedores y colegios pide que el Estado les contrate servicios.', [
      ['Firmar convenios con las iglesias', { poder: { iglesia: 10 }, favor: { iglesia: 1 }, seg: { rural: 2, bajos: 2 }, patrimonio: 0, rec: 0.5 }], ['Abrir licitación pública para todos', { poder: { iglesia: -3 }, honestidad: 1 }], ['Negarte: «aquí no se mezcla religión y plata»', { poder: { iglesia: -10 }, honestidad: 1.5, rec: 1 }]]),
    P('militares', 'po_mil_presupuesto', '🎖', 'La cúpula militar exige más presupuesto', 'El comandante de las Fuerzas Militares advierte que sin más plata «no responde por la seguridad del país».', [
      ['Aumentar el presupuesto de defensa', { poder: { militares: 12 }, favor: { militares: 1 }, aprob: 0.5, confianza: -0.5 }], ['Negociar un incremento gradual', { poder: { militares: 3 } }], ['Responder que el presupuesto es el que hay', { poder: { militares: -12 }, confianza: 0.5, honestidad: 0 }]]),
    P('militares', 'po_mil_fuero', '🎖', 'Piden ampliar el fuero militar', 'Altos mandos piden que los soldados sean juzgados sólo por la justicia penal militar.', [
      ['Respaldar el fuero militar', { poder: { militares: 12 }, favor: { militares: 1 }, seg: { jovenes: -2, universitarios: -2 }, poder2: 0 }], ['Mantener los fueros actuales', { poder: { militares: -2 } }], ['Rechazar y pedir controles civiles', { poder: { militares: -14 }, seg: { universitarios: 3, jovenes: 2 }, rec: 1 }]]),
    P('usa', 'po_usa_fumigacion', '🇺🇸', 'Washington pide retomar la fumigación aérea', 'El embajador te recuerda que la «certificación» antidrogas depende de las hectáreas erradicadas.', [
      ['Aceptar y reanudar la erradicación', { poder: { usa: 12 }, favor: { usa: 1 }, seg: { rural: -4 }, confianza: 1 }], ['Proponer sustitución concertada con el campo', { poder: { usa: 2 }, seg: { rural: 2 } }], ['Rechazar: «la soberanía no se negocia»', { poder: { usa: -14 }, seg: { rural: 3, jovenes: 2 }, rec: 1.5, confianza: -1 }]]),
    P('usa', 'po_usa_extradicion', '🇺🇸', 'Estados Unidos solicita una extradición', 'La DEA pide entregar a un capo capturado, justo cuando negocias con otros grupos.', [
      ['Extraditarlo ya', { poder: { usa: 10 }, favor: { usa: 1 }, aprob: 0.5 }], ['Juzgarlo primero en Colombia', { poder: { usa: -3 }, rec: 0.5 }], ['Negarte', { poder: { usa: -13 }, confianza: -1, rec: 1 }]]),
    P('prensa', 'po_prensa_pauta', '📰', 'Los barones de la prensa piden pauta oficial', 'Los dueños de los grandes medios sugieren que la pauta del Estado «ayudaría a la cobertura».', [
      ['Girar pauta generosa', { poder: { prensa: 14 }, favor: { prensa: 1 }, honestidad: -1.5, rec: 1 }], ['Repartir la pauta por criterios técnicos', { poder: { prensa: 1 }, honestidad: 1 }], ['Cerrar la pauta oficial', { poder: { prensa: -14 }, honestidad: 2, rec: 1 }]]),
    P('prensa', 'po_prensa_entrevista', '📰', 'Te ofrecen una portada a cambio de una entrevista complaciente', 'Un editor propone una portada favorable si aceptas condiciones sobre las preguntas.', [
      ['Aceptar el trato', { poder: { prensa: 10 }, rec: 3, honestidad: -1 }], ['Dar la entrevista sin condiciones', { poder: { prensa: 3 }, rec: 1.5 }], ['Rechazar la oferta', { poder: { prensa: -6 }, honestidad: 1.5 }]]),
    P('banca', 'po_banca_usura', '🏦', 'La banca pide liberar la tasa de usura', 'Los bancos piden eliminar el tope a las tasas de interés para «llegar a más gente».', [
      ['Liberar la tasa de usura', { poder: { banca: 14 }, favor: { banca: 1 }, seg: { bajos: -4, informales: -3 }, confianza: 1 }], ['Subir el tope pero mantenerlo', { poder: { banca: 3 } }], ['Rechazar y regular a la banca', { poder: { banca: -14 }, seg: { bajos: 3, informales: 3 }, confianza: -1, rec: 1.5 }]]),
    P('banca', 'po_banca_impuesto', '🏦', 'El grupo financiero pide una rebaja tributaria', 'Un gran grupo económico dice que sólo invertirá si le rebajas los impuestos.', [
      ['Concederla', { poder: { banca: 12 }, favor: { banca: 1 }, confianza: 1.5, seg: { bajos: -2 } }], ['Ofrecer incentivos ligados a empleo', { poder: { banca: 3 }, confianza: 0.5 }], ['Negarte', { poder: { banca: -12 }, confianza: -1.5, seg: { bajos: 2 } }]]),
    P('maquinas', 'po_maq_contratos', '🧩', 'Los caciques piden contratos para su región', 'Un poderoso cacique regional insinúa que sus votos «cuestan» contratos de obra.', [
      ['Darles los contratos', { poder: { maquinas: 14 }, favor: { maquinas: 1 }, honestidad: -3, seg: { rural: 3 } }], ['Contratos con licitación abierta', { poder: { maquinas: -4 }, honestidad: 1 }], ['Rechazarlos públicamente', { poder: { maquinas: -14 }, honestidad: 3, rec: 2, seg: { rural: -2 } }]]),
    P('maquinas', 'po_maq_aval', '🧩', 'Piden tu aval para sus candidatos', 'Las maquinarias regionales quieren que respaldes a sus candidatos locales.', [
      ['Darles el aval', { poder: { maquinas: 12 }, favor: { maquinas: 1 }, partido: -2, honestidad: -1 }], ['Avalarlos sólo si cumplen requisitos', { poder: { maquinas: 1 } }], ['Negarles el aval', { poder: { maquinas: -12 }, honestidad: 1.5 }]]),
    P('ong', 'po_ong_proteccion', '🌍', 'Las ONG piden protección para líderes sociales', 'Organizaciones de derechos humanos exigen medidas de protección tras nuevos asesinatos.', [
      ['Crear un programa de protección con recursos', { poder: { ong: 12 }, favor: { ong: 1 }, seg: { jovenes: 2, universitarios: 2 }, rec: 1 }], ['Reforzar las medidas actuales', { poder: { ong: 3 } }], ['Responder que no hay recursos', { poder: { ong: -12 }, rec: -0.5 }]]),
    P('ong', 'po_ong_ambiente', '🌍', 'Las ONG piden detener un proyecto extractivo', 'Una coalición ambiental pide frenar un megaproyecto que afecta un páramo.', [
      ['Suspender el proyecto', { poder: { ong: 12 }, favor: { ong: 1 }, seg: { jovenes: 3, universitarios: 3 }, confianza: -1 }], ['Exigir ajustes ambientales', { poder: { ong: 2 } }], ['Seguir adelante', { poder: { ong: -14 }, confianza: 1, seg: { jovenes: -2 } }]]),
    // ── Prensa y partido ──
    ev('pr_contacto', 'escándalo', '🕵', 'Un periodista de {medio} te hace preguntas incómodas', 'Un equipo de investigación de {medio} prepara una nota sobre «{tema}» y te pide una entrevista.', [
      ['Colaborar y dar tu versión con documentos', resp('colaborarPrensa')], ['Adelantarte con tu propia versión', resp('adelantarseNota')], ['Intentar comprar el silencio', resp('comprarSilencio')], ['Demandar al medio para frenar la nota', resp('demandarMedio')], ['Ignorarlo', { honestidad: 0 }]], { peso: 0 }),
    ev('pa_escision', 'partido', '🧩', 'Crisis en tu partido: una facción amenaza con irse', 'Una facción del {partido} exige más cuota de poder y amenaza con fundar su propio movimiento.', [
      ['Negociar con los disidentes', (E) => CURUL.Faccion.resolver(E, 'negociar')], ['Expulsarlos y mostrar autoridad', (E) => CURUL.Faccion.resolver(E, 'expulsar')], ['Dejar que se arreglen solos', (E) => CURUL.Faccion.resolver(E, 'nada')]], { peso: 0 }),
    // ── Actualidad nacional ──
    ev('na_mundial_semi', 'nacional', '⚽', 'Colombia está en semifinales del Mundial', 'El país entero está pegado al televisor. Los políticos buscan su foto con la Selección.', [
      ['Viajar a alentar al equipo', { animo: 2, rec: 2.5, aprob: 0.5, honestidad: -0.5 }], ['Ver el partido con la gente en una plaza', { animo: 3, rec: 2, seg: { bajos: 2, informales: 2 } }], ['Evitar instrumentalizar el fútbol', { rec: 0.5, honestidad: 1 }]], { alcance: 'nacional', nacional: false }),
    ev('na_mundial_final', 'nacional', '🏆', 'Colombia es {resultado} del Mundial', 'La Selección terminó su camino. Tras la final, el país espera una palabra de sus líderes.', [
      ['Declarar un día de fiesta nacional', { animo: 4, rec: 2, aprob: 1, confianza: -0.5 }], ['Organizar un recibimiento en la plaza', { animo: 3, rec: 2.5 }], ['Pedir moderación y trabajar', { honestidad: 0.5, rec: 0.5 }]], { alcance: 'nacional' }),
    ev('na_tour', 'nacional', '🚴', 'Un colombiano gana el Tour de Francia', 'Un ciclista colombiano levanta el trofeo en París y el país estalla de orgullo.', [
      ['Recibirlo con honores en la plaza', { animo: 7, rec: 2.5, seg: { rural: 2 } }], ['Felicitarlo en redes', { animo: 5, rec: 1 }], ['Ignorar el tema', { animo: 3 }]], { alcance: 'nacional' }),
    ev('na_reinado', 'nacional', '👑', 'El Reinado Nacional de Belleza', 'El reinado vuelve a ser tema de conversación nacional: quién ganó, quién se robó el show, qué dijo cada candidata sobre política.', [
      ['Asistir a la coronación', { animo: 2, rec: 1.5, honestidad: -0.3 }], ['Criticar el concurso como anacrónico', { rec: 1.5, seg: { jovenes: 2, universitarios: 2, mayores: -2 } }], ['Mantenerte al margen', { animo: 0 }]], { alcance: 'nacional' }),
    ev('na_premio', 'nacional', '🎤', 'Una colombiana arrasa en los premios internacionales', 'Una artista colombiana gana varios premios y dedica el discurso a «los que se quedaron en el país».', [
      ['Condecorarla con la Orden de la Democracia', { animo: 5, rec: 2 }], ['Felicitarla públicamente', { animo: 4, rec: 1 }], ['No decir nada', { animo: 3 }]], { alcance: 'nacional' }),
    ev('na_crimen', 'nacional', '🕯', 'Un crimen conmociona al país', 'El asesinato de una joven en circunstancias brutales indigna al país y enciende las redes. Piden «penas ejemplares».', [
      ['Proponer endurecer las penas', { animo: -1, rec: 2.5, seg: { mayores: 3, rural: 2, jovenes: -2 } }], ['Pedir justicia y no politizar el dolor', { animo: 1, rec: 1.5, honestidad: 1 }], ['Impulsar un plan de prevención de violencias', { rec: 2, seg: { jovenes: 3, universitarios: 2 } }]], { nacional: true, peso: 2, alcance: 'nacional' }),
    ev('na_aereo', 'nacional', '✈', 'Tragedia aérea con decenas de víctimas', 'Un avión con pasajeros colombianos se estrella. El país está de luto.', [
      ['Declarar duelo nacional y viajar a acompañar a las familias', { animo: 2, rec: 3 }], ['Exigir una investigación independiente', { rec: 2, honestidad: 1 }], ['Enviar condolencias por redes', { rec: 0.5 }]], { nacional: true, alcance: 'nacional' }),
    ev('na_viral', 'nacional', '📱', 'Un video viral sacude la política', 'Un video donde un político nacional parece insultar a un policía se vuelve tendencia. Te piden opinar.', [
      ['Condenar el hecho', { rec: 1.5, honestidad: 1 }], ['Defender al político por «sacado de contexto»', { rec: 0.5, partido: 2, honestidad: -1 }], ['Hacer un meme del asunto', { rec: 2, animo: 1, honestidad: -0.5 }]], { nacional: true, peso: 2, alcance: 'nacional' }),
    ev('na_calor', 'nacional', '🌡', 'Ola de calor récord', 'Las temperaturas rompen récords: apagones, incendios y críticas por el racionamiento.', [
      ['Pedir un plan de ahorro de agua y energía', { rec: 1.5, animo: -1 }], ['Culpar a la falta de inversión del Gobierno', { rec: 2, aprob: -0.5 }], ['Visitar los barrios sin agua', { rec: 2.5, seg: { bajos: 2 } }]], { nacional: true, alcance: 'nacional' }),
    ev('na_galeon', 'nacional', '⚓', 'Hallan un tesoro del galeón San José', 'Buzos recuperan monedas y cañones del galeón hundido. ¿De quién es el tesoro?', [
      ['Defender que es patrimonio de los colombianos', { rec: 2, animo: 2 }], ['Proponer una alianza público-privada para extraerlo', { rec: 1, confianza: 0.5 }], ['Dejar que se pelee en tribunales', { rec: 0 }]], { nacional: true, alcance: 'nacional' }),
    ev('na_farandula', 'nacional', '📺', 'Un escándalo de farándula le roba el titular a la política', 'Una pelea entre famosos acapara los noticieros: es la mejor semana para pasar desapercibido… o para opinar.', [
      ['Aprovechar para anunciar algo importante', { rec: 1, honestidad: -0.5 }], ['Opinar en redes del chisme', { rec: 1.5, animo: 1 }], ['Seguir trabajando', { honestidad: 0.5 }]], { nacional: true, alcance: 'nacional' }),
    ev('na_icono', 'nacional', '🕊', 'Muere un ícono nacional', 'Fallece un querido artista colombiano. Todo el país lo recuerda.', [
      ['Asistir al velorio y dar el pésame a la familia', { animo: 1, rec: 2 }], ['Decretar honores de Estado', { animo: 2, rec: 2 }], ['Enviar un mensaje de condolencia', { rec: 0.5 }]], { nacional: true, alcance: 'nacional' }),
    ev('na_huelga_fut', 'nacional', '⚽', 'Jugadores de fútbol amenazan con paro', 'La asociación de futbolistas amenaza con un paro por pagos atrasados, a días del clásico.', [
      ['Ofrecer tu mediación', { rec: 1.5, animo: 1 }], ['Culpar a los dueños de clubes', { rec: 1, seg: { bajos: 1 } }], ['No meterte', { rec: 0 }]], { nacional: true, alcance: 'nacional' }),
    // ── Vida personal ──
    ev('vi_romance', 'personal', '💞', 'Alguien especial aparece en tu vida', 'Conoces a una persona que te mueve el piso en medio de una agenda imposible. La prensa rosa ya husmea.', [
      ['Darte la oportunidad y mostrar la relación', { bienestar: 12, rec: 1, honestidad: 0 }], ['Mantenerlo en reserva', { bienestar: 7 }], ['No tienes tiempo para romances', { bienestar: -3, rec: 0.3 }]], { vida: true, req: E => !CURUL.Familia.pareja(E) && E.jugador.nac < U_anio() - 22 }),
    ev('vi_infidelidad', 'personal', '💔', 'Rumores de infidelidad', 'Una revista rosa publica fotos que dan para pensar. Tu pareja pide explicaciones.', [
      ['Reconocer el error y pedir perdón', { bienestar: -6, rec: -0.5, honestidad: 1 }], ['Negar todo y demandar a la revista', { honestidad: -2, rec: -1, bienestar: -3 }], ['Hacer silencio', { bienestar: -5, rec: -1 }]], { vida: true, req: E => !!CURUL.Familia.pareja(E) && E.jugador.reconocimiento > 20 }),
    ev('vi_burnout', 'personal', '🪫', 'Estás agotado', 'Llevas meses sin descansar. Empiezas a olvidar nombres, te irritas con todos y duermes mal.', [
      ['Tomarte una semana completa', { bienestar: 20, salud: 4, rec: -0.5 }], ['Delegar y bajar el ritmo', { bienestar: 10, salud: 2 }], ['Seguir a mil: «ya descansaré»', { bienestar: -10, salud: -4, honestidad: 0 }]], { vida: true, peso: 2, sit: E => 1 + Math.max(0, 55 - (E.jugador.bienestar || 60)) / 12, req: E => (E.jugador.bienestar || 60) < 55 }),
    ev('vi_amigo_dinero', 'personal', '💸', 'Un amigo te pide plata prestada', '{amigo} está en problemas y te pide un préstamo «hasta que se acomode».', [
      ['Prestarle sin preguntar', { patrimonio: -40, amigos: 6 }], ['Prestarle una parte', { patrimonio: -15, amigos: 2 }], ['Decirle que no', { amigos: -8 }]], { vida: true }),
    ev('vi_amigo_video', 'personal', '🍾', 'Tu amigo {amigo} queda en un video borracho', 'Un video donde tu amigo habla mal de políticos y te menciona se vuelve viral.', [
      ['Defenderlo públicamente', { amigos: 5, rec: -0.5 }], ['Tomar distancia', { amigos: -8, rec: 0.5 }], ['Reírte del asunto', { amigos: 1, rec: 1 }]], { vida: true }),
    ev('vi_familia', 'personal', '👪', 'Tu familia te reclama presencia', 'Tus hermanos y tu mamá te piden más tiempo; la política «te está comiendo».', [
      ['Organizar un asado familiar el fin de semana', { bienestar: 10, rec: -0.2 }], ['Prometer que luego los compensas', { bienestar: -2 }], ['Disculparte: el deber llama', { bienestar: -6 }]], { vida: true }),
    ev('vi_hijo', 'personal', '🧒', 'Tu hijo tiene un problema en el colegio', 'Tu hijo se metió en una pelea y la coordinadora te cita… cuando estás en plena sesión.', [
      ['Dejar todo y atenderlo', { bienestar: 8, rec: -0.5 }], ['Mandar a tu pareja', { bienestar: 2 }], ['Pedir que te llamen después', { bienestar: -6 }]], { vida: true, req: E => (E.jugador.familia || []).some(f => f.rol === 'Hijo' || f.rol === 'Hija') }),
    ev('vi_mentor', 'personal', '🕯', 'Muere tu mentor político', 'El viejo político que te abrió las puertas falleció. Sus herederos políticos te miran.', [
      ['Dar el discurso en el funeral', { rec: 2, bienestar: -3, partido: 2 }], ['Asistir discretamente', { bienestar: -3 }], ['No ir por la agenda', { honestidad: -1, partido: -2 }]], { vida: true }),
    ev('vi_homenaje', 'personal', '🏅', 'Te rinden un homenaje', 'Tu pueblo natal quiere ponerle tu nombre a una calle y hacerte un homenaje.', [
      ['Aceptar y viajar a la ceremonia', { rec: 2, bienestar: 6, seg: { rural: 2 } }], ['Aceptar sin ceremonia', { rec: 0.8, bienestar: 2 }], ['Declinar con modestia', { honestidad: 1, rec: 0.5 }]], { vida: true, req: E => E.jugador.reconocimiento > 30 }),
    ev('vi_chisme', 'personal', '🗣', 'Circula un chisme sobre ti', 'Un rumor falso sobre tu vida privada circula en grupos de WhatsApp.', [
      ['Desmentirlo con humor', { rec: 1, honestidad: 0 }], ['Ignorarlo', { rec: -0.3 }], ['Investigar quién lo regó', { rec: 0.5, honestidad: 0 }]], { vida: true }),
    ev('vi_traicion', 'personal', '🗡', 'Tu amigo {amigo} te traiciona', 'Alguien de tu círculo íntimo filtra a la prensa conversaciones privadas tuyas. Era {amigo}.', [
      ['Romper la amistad y denunciar la filtración', (E, e) => { const J = E.jugador; J.amigos = (J.amigos || []).filter(a => a.id !== e.ctx.amigo); CURUL.Prensa.abrir(E, 'J', 1); return CURUL.Pais.ef(E, { honestidad: 0.5, bienestar: -6 }) + ' · pierdes a ese amigo'; }], ['Perdonarlo y hablar con él', (E, e) => { const a = (E.jugador.amigos || []).find(x => x.id === e.ctx.amigo); if (a) a.lealtad = 55; return CURUL.Pais.ef(E, { bienestar: -3, rec: -0.5 }); }], ['Fingir que no pasó nada', (E, e) => { const a = (E.jugador.amigos || []).find(x => x.id === e.ctx.amigo); if (a) a.lealtad = 35; return CURUL.Pais.ef(E, { bienestar: -5 }); }]], { peso: 0 })
  ]);
  function U_anio() { return CURUL.U.anio(); }
})();
