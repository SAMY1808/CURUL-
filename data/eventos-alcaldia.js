/* Eventos de la alcaldía (Fase 38): decisiones del alcalde con sabor local. Los dispara CURUL.Alcaldia.
   req(E, vida) y sit(vida, depto, E) sesgan cuándo aparecen; cada opción aplica sus efectos con Alcaldia.ef. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function () {
  const ef = o => E => CURUL.Alcaldia.ef(E, o);
  const ev = (id, icono, peso, titulo, texto, opciones, extra) => Object.assign({ id, tipo: 'alcaldía', icono, alcance: 'jugador', alcalde: true, sistema: true, peso, titulo, texto, opciones }, extra || {});
  const O = (t, o, g) => ({ t, fn: ef(o) });
  CURUL.DATA.eventos = (CURUL.DATA.eventos || []).concat([
    ev('al_fiesta', '🎉', 1, 'Llegan las {fiesta} a {ciudad}', 'La ciudad se alista para {fiesta}: hoteles llenos, comerciantes frotándose las manos y la gente esperando que el alcalde esté a la altura.', [
      O('Invertir a lo grande: carrozas, artistas y pólvora', { caja: -0.02, animo: 10, turismo: 12, cultura: 8, rec: 2, aseo: -5 }),
      O('Fiesta austera y bien organizada', { caja: -0.008, animo: 5, turismo: 6, cultura: 4, rec: 1 }),
      O('Recortar: hay prioridades más urgentes', { animo: -5, turismo: -6, cultura: -3, caja: 0.005, aprob: -1 })], { sistema: true }),
    ev('al_navidad', '🎄', 1, 'Se acerca la Navidad en {ciudad}', 'Los comerciantes piden alumbrado; los barrios, regalos para los niños; la Contraloría, que ni se te ocurra un sobrecosto.', [
      O('Alumbrado espectacular con empresa privada', { caja: -0.018, animo: 8, turismo: 9, cultura: 3, rec: 2, honestidad: -1 }),
      O('Alumbrado sobrio con la empresa de energía local', { caja: -0.008, animo: 5, turismo: 4, rec: 1 }),
      O('Sólo regalos y novenas en los barrios', { caja: -0.006, animo: 6, rec: 1.5, aprob: 1, turismo: -1 })]),
    ev('al_trancon', '🚧', 3, 'Megatrancón en {ciudad}', 'Una obra mal planificada cierra dos carriles de la avenida principal. Hay conductores furiosos, buses atascados y un video viral.', [
      O('Suspender la obra y reabrir la vía', { movilidad: 8, animo: 1, caja: -0.006, rec: 0.5 }),
      O('Aguantar: «el progreso duele»', { movilidad: -6, animo: -5, rec: -1 }),
      O('Culpar al contratista y exigir multas', { movilidad: -2, animo: -1, rec: 1.5, honestidad: 1 })], { sit: v => 1 + (60 - v.movilidad) / 40 }),
    ev('al_vendedores', '🛒', 2, 'Vendedores ambulantes se toman el centro', 'Cientos de vendedores informales ocuparon andenes y plazas. Los comerciantes formales exigen orden; los vendedores piden dónde trabajar.', [
      O('Reubicarlos con un plan de formalización', { espacio: 8, animo: 2, caja: -0.01, rec: 1, aprob: 1 }),
      O('Operativo de recuperación con la policía', { espacio: 10, animo: -4, rec: -0.5, aprob: -1 }),
      O('Dejarlos: son votos y también sustento', { espacio: -6, animo: 1, aprob: 1, concejo: 2 })], { sit: v => 1 + (55 - v.espacio) / 40 }),
    ev('al_taxistas', '🚕', 2, 'Paro de taxistas contra las plataformas', 'Los taxistas bloquean las avenidas pidiendo que prohíban las aplicaciones. Los usuarios, en cambio, defienden las plataformas.', [
      O('Mesa de diálogo con ambas partes', { movilidad: -2, animo: 1, rec: 1, caja: -0.004 }),
      O('Ponerte del lado de los taxistas', { movilidad: -3, animo: -2, rec: 0.5, concejo: 3, aprob: 1 }),
      O('Defender las plataformas y el derecho a elegir', { movilidad: -5, animo: 2, rec: 2, aprob: -1, concejo: -3 })]),
    ev('al_hurtos', '📱', 3, 'Ola de hurtos de celulares', 'Las denuncias se disparan en el sistema de transporte y la plaza principal. La prensa pregunta dónde está la seguridad.', [
      O('Plan de choque con policía y cámaras', { seg: 2.5, animo: 2, caja: -0.01, rec: 1 }),
      O('Pedirle más pie de fuerza al Gobierno Nacional', { seg: 1, animo: 0, rec: 1.5, gob: -3 }),
      O('Minimizar: «es la percepción»', { seg: -1.5, animo: -4, rec: -1.5 })], { sit: (v, d) => 1 + (55 - d.seguridad) / 30 }),
    ev('al_basuras', '🗑', 3, 'Huelga de recolectores de basura', 'Las bolsas se acumulan en las esquinas, el olor llega hasta el despacho y la empresa de aseo dice que no le han pagado.', [
      O('Pagar la deuda de inmediato', { aseo: 12, animo: 2, caja: -0.015 }),
      O('Contratar un operador de emergencia', { aseo: 8, animo: 0, caja: -0.01, honestidad: -1 }),
      O('Negociar sin pagar todavía', { aseo: -9, animo: -5, rec: -1 })], { sit: v => 1 + (55 - v.aseo) / 35 }),
    ev('al_derrumbe', '⛰', 2, 'Derrumbe en una ladera', 'Las lluvias desprenden un barrio entero de la ladera: familias evacuadas y los medios en directo.', [
      O('Declarar calamidad y reubicar a las familias', { seg: 0.5, animo: 3, caja: -0.02, rec: 2.5, aprob: 2 }),
      O('Pedir ayuda a la Unidad de Riesgo y al Gobierno', { animo: 0, caja: -0.006, rec: 1, gob: 2 }),
      O('Culpar a la invasión del terreno', { animo: -4, rec: -2, aprob: -2 })]),
    ev('al_apagon', '💡', 2, 'Apagón de doce horas', 'Media ciudad se queda sin luz: semáforos apagados, comercios cerrados y gente en las calles.', [
      O('Salir a la calle con linterna y coordinar la emergencia', { animo: 2, rec: 3, seg: 0.5 }),
      O('Exigirle cuentas a la empresa de energía', { animo: 1, rec: 1.5, concejo: 2 }),
      O('Esperar el comunicado oficial', { animo: -3, rec: -1 })]),
    ev('al_ratas', '🐀', 1, 'Plaga de ratas en la plaza de mercado', 'Un video de comerciantes persiguiendo ratas con escobas es tendencia nacional. Los chistes sobre la alcaldía no paran.', [
      O('Fumigación y plan sanitario completo', { aseo: 8, animo: 2, caja: -0.008, rec: 1 }),
      O('Convertirlo en campaña: «Ciudad limpia»', { aseo: 5, animo: 3, rec: 2, caja: -0.005 }),
      O('Ignorarlo: «ya se les olvida»', { aseo: -3, animo: -3, rec: -1.5 })]),
    ev('al_concejo_cupos', '🏛', 3, 'Concejales cobran sus cupos', 'Tres concejales de la coalición insinúan que el presupuesto no pasará si no les das contratos y cargos en tu gabinete.', [
      O('Ceder: cupos, contratos y una secretaría', { concejo: 18, honestidad: -4, caja: -0.01, rec: -1 }),
      O('Negociar sólo un par de cargos técnicos', { concejo: 6, honestidad: -1 }),
      O('Negarte públicamente: «aquí no hay mermelada»', { concejo: -14, rec: 3, honestidad: 3, aprob: 1.5 })], { sit: v => 1 + (55 - v.concejo) / 30 }),
    ev('al_concejo_debate', '🎤', 3, 'Debate de control en el concejo', 'La bancada de oposición cita a tu secretario de Obras por supuestos sobrecostos. Será un debate televisado.', [
      O('Ir tú mismo a defender la gestión', { concejo: 4, rec: 2, animo: 1, honestidad: 0 }),
      O('Dejar solo al secretario', { concejo: -2, rec: -1.5 }),
      O('Contraatacar con denuncias a la oposición', { concejo: -6, rec: 2.5, animo: -1 })]),
    ev('al_sobrecostos', '🔎', 2, 'Veeduría denuncia sobrecostos en un parque', 'Una veeduría ciudadana muestra que un parque costó el doble del precio de mercado. Todo apunta a un contrato amañado.', [
      O('Abrir investigación interna y suspender al contratista', { honestidad: 3, rec: 2, aprob: 1, caja: -0.004 }),
      O('Defender el contrato: «todo es legal»', { honestidad: -3, rec: -2, aprob: -1.5 }),
      O('Entregar el caso a la Contraloría y la Fiscalía', { honestidad: 4, rec: 1.5, concejo: -3 })]),
    ev('al_hallazgo', '🏺', 1, 'Hallazgo arqueológico frena una obra', 'Los obreros encontraron restos arqueológicos justo en el predio de una obra clave. El ICANH exige parar.', [
      O('Parar la obra y hacer un museo de sitio', { cultura: 10, turismo: 6, animo: 2, caja: -0.012, rec: 1.5 }),
      O('Presionar para que sigan, con supervisión mínima', { cultura: -6, rec: -2, honestidad: -2 }),
      O('Trasladar la obra a otro predio', { cultura: 4, caja: -0.01, animo: 0 })]),
    ev('al_invasion', '🏚', 2, 'Invasión de un predio público', 'Familias sin vivienda invaden un lote de la alcaldía. Hay niños, ollas comunitarias y cámaras de televisión.', [
      O('Mesa con las familias y plan de vivienda', { animo: 2, espacio: 3, caja: -0.01, rec: 1.5, aprob: 1 }),
      O('Desalojo con el Esmad', { espacio: 5, animo: -6, rec: -2, aprob: -2 }),
      O('Dejarlos mientras se resuelve en tribunales', { espacio: -3, animo: -1, aprob: 0.5 })]),
    ev('al_marcha', '🎓', 2, 'Marcha estudiantil termina en disturbios', 'Una marcha por la educación termina con vandalismo y gases lacrimógenos en el centro. Los comerciantes exigen respuestas.', [
      O('Diálogo con los líderes estudiantiles', { animo: 2, rec: 1.5, aprob: 1, seg: 0.5 }),
      O('Endurecer la respuesta policial', { seg: 1.5, animo: -4, rec: -1 }),
      O('Culpar a «infiltrados»', { animo: -2, rec: -0.5 })]),
    ev('al_clasico', '⚽', 2, 'Clásico de fútbol de alto riesgo', 'Juega tu equipo ante su eterno rival. La policía advierte que las barras bravas ya se organizaron.', [
      O('Operativo reforzado y partido sin hinchada visitante', { seg: 1, animo: 3, caja: -0.008, rec: 1 }),
      O('Fiesta ciudadana con pantalla gigante en el parque', { animo: 7, cultura: 3, caja: -0.01, rec: 1.5, seg: -0.5 }),
      O('No hacer nada especial', { animo: -1, seg: -1.5 })]),
    ev('al_concierto', '🎤', 2, 'Un artista internacional quiere cantar en tu ciudad', 'Un superestrella pide permiso para un estadio lleno. Traería turismo, pero también costos de seguridad y movilidad.', [
      O('Aprobar y cobrar contraprestaciones', { turismo: 10, animo: 7, cultura: 4, caja: 0.01, movilidad: -4, rec: 2 }),
      O('Aprobar sin cobrar para quedar bien', { turismo: 10, animo: 8, rec: 2.5, caja: -0.006, movilidad: -4 }),
      O('Negar por riesgos de seguridad', { turismo: -3, animo: -6, rec: -1.5 })], { req: (E, v) => v.cultura > 35 }),
    ev('al_visita', '🦅', 2, 'El Presidente visita tu ciudad', 'La Casa de Nariño anuncia una visita presidencial. Es tu oportunidad de pedir una obra… o de quedar mal en la foto.', [
      O('Pedirle una obra y exponerle tus proyectos', { rec: 2.5, caja: 0.02, gob: 3, animo: 2 }),
      O('Marcar distancia: «la ciudad no se vende»', { rec: 1.5, gob: -6, animo: 1 }),
      O('Sólo la foto y un abrazo', { rec: 1.5, gob: 3 })], { req: E => E.gobierno.presidente !== 'J' }),
    ev('al_influencer', '🤳', 2, 'Un influencer se burla de tu ciudad', 'Un youtuber con millones de seguidores dice que {ciudad} es «la ciudad más fea del país». El video suma millones de vistas.', [
      O('Invitarlo a conocer la ciudad con todo pago', { turismo: 5, animo: 3, rec: 2.5, caja: -0.004 }),
      O('Responder con humor y un video propio', { rec: 3, animo: 3, turismo: 2 }),
      O('Responderle con rabia por redes', { rec: -2, animo: -2 })]),
    ev('al_bloqueo', '🚛', 1, 'Bloqueo de campesinos y transportadores en la entrada', 'Camioneros y campesinos bloquean el acceso a la ciudad reclamando por precios y peajes. Los supermercados empiezan a desabastecerse.', [
      O('Mediar entre los bloqueadores y el Gobierno', { movilidad: -2, animo: 1, rec: 2.5, gob: -1 }),
      O('Pedir intervención de la fuerza pública', { movilidad: 5, animo: -3, rec: -1 }),
      O('Abastecer la ciudad con mercados campesinos', { movilidad: -4, animo: 2, rec: 1.5, cultura: 1, caja: -0.006 })]),
    ev('al_inundacion', '🌧', 3, 'Aguacero inunda varios barrios', 'En una hora cayó la lluvia de un mes. Alcantarillas colapsadas, carros flotando y gente en los techos.', [
      O('Bombas, carrotanques y albergues desde el primer minuto', { animo: 3, rec: 3, caja: -0.014, aseo: -3 }),
      O('Declarar calamidad pública y pedir ayuda', { animo: 1, rec: 1.5, caja: 0.01, gob: 2 }),
      O('Culpar a la lluvia atípica', { animo: -5, rec: -2 })], { sit: (v, d) => 1 + (60 - d.infraestructura) / 50 }),
    ev('al_incendio', '🔥', 1, 'Incendio en la plaza de mercado', 'Un incendio arrasa decenas de puestos de la plaza central. Los comerciantes lo perdieron todo.', [
      O('Subsidio y reubicación inmediata de comerciantes', { animo: 4, rec: 2.5, caja: -0.015, espacio: 2 }),
      O('Aprovechar para modernizar la plaza con un contratista', { espacio: 7, caja: -0.02, rec: 1, honestidad: -1.5 }),
      O('Esperar los peritajes antes de actuar', { animo: -3, rec: -1.5 })]),
    ev('al_gobernador', '🗺', 2, 'El gobernador te quita una obra', 'El gobernador anuncia que la vía que esperabas se hará en otro municipio… curiosamente del partido de su esposa.', [
      O('Denunciarlo públicamente', { rec: 3, gob: -2, animo: 2, aprob: 1 }),
      O('Negociar a puerta cerrada', { caja: 0.01, rec: 0.5 }),
      O('Resignarte', { animo: -2, rec: -1 })], { req: E => E.jugador.cargoInfo && E.deptos[E.jugador.cargoInfo.depto].gobernador !== 'J' }),
    ev('al_premio', '🏆', 1, '{ciudad} gana un premio nacional', 'Un ranking reconoce a {ciudad} por su calidad de vida. Los medios te buscan para entrevistas.', [
      O('Capitalizarlo en una gran campaña de ciudad', { rec: 3, turismo: 6, animo: 4 }),
      O('Atribuírselo al equipo de la alcaldía', { rec: 1.5, animo: 3, concejo: 3 }),
      O('Aprovechar para pedir regalías', { rec: 1, caja: 0.015 })], { req: (E, v) => v.animo > 60 }),
    ev('al_antecesor', '🗞', 2, 'Tu antecesor te ataca en los medios', 'El exalcalde dice que «la ciudad va hacia el abismo» y que tu administración desmontó sus obras.', [
      O('Responderle con cifras y datos', { rec: 2, honestidad: 0.5, animo: 1 }),
      O('Ignorarlo con elegancia', { rec: 0.5 }),
      O('Revelar irregularidades de su gobierno', { rec: 3, concejo: -4, honestidad: -0.5 })]),
    ev('al_animalistas', '🐴', 1, 'Protesta animalista contra los coches de caballos', 'Una campaña viral pide prohibir los coches turísticos tirados por caballos. Los cocheros viven de eso.', [
      O('Reemplazarlos por coches eléctricos con subsidio', { cultura: 3, turismo: 3, animo: 3, caja: -0.01, rec: 2 }),
      O('Prohibir de una vez', { cultura: 1, turismo: -3, animo: 1, rec: 1, aprob: -0.5 }),
      O('Mantener la tradición', { turismo: 1, animo: -2, rec: -1 })]),
    ev('al_crucero', '🚢', 1, 'Llegan miles de turistas de golpe', 'Un crucero y tres vuelos chárter descargan miles de visitantes el mismo fin de semana. La ciudad no da abasto.', [
      O('Plan de contingencia y guías turísticos', { turismo: 8, animo: 2, caja: -0.006, rec: 1.5 }),
      O('Dejar que se arreglen solos', { turismo: -2, aseo: -6, animo: -2, rec: -1 }),
      O('Cobrar una tasa turística', { turismo: 1, caja: 0.012, animo: -1 })], { req: (E, v) => v.turismo > 40 })
  ]);
})();
