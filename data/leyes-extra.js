/* Fase 31 — Catálogo ampliado de leyes (≈200) organizadas por categoría, estilo «lawgivers».
   Formato compacto por fila:  id|título|tipo|eco|soc|costo|pop|apoyan|opuestos|efectos
   tipo: o=ordinaria g=orgánica e=estatutaria a=acto legislativo · efectos: var:delta:plazo(i/m/l)
   Variables: cr=crecimiento inf=inflacion des=desempleo pob=pobreza def=deficit deu=deuda inv=inversion
   exp=exportaciones edu=educacion sal=salud seg=seguridad inf2=infraestructura conf=confianza apr=aprobacion */
(function () {
  const TIPO = { o: 'ordinaria', g: 'organica', e: 'estatutaria', a: 'acto' };
  const VAR = { cr: 'crecimiento', inf: 'inflacion', des: 'desempleo', pob: 'pobreza', def: 'deficit', deu: 'deuda', inv: 'inversion',
    exp: 'exportaciones', edu: 'educacion', sal: 'salud', seg: 'seguridad', inf2: 'infraestructura', conf: 'confianza', apr: 'aprobacion' };
  const SECCIONES = {
educacion: `
becaexcelencia|Becas de excelencia para los mejores bachilleres|o|-20|0|0.8|10|Estudiantes,Rectores|Hacienda|edu:1.5:m,apr:0.6:i
pae|Reforma del Programa de Alimentación Escolar con compra local|o|-30|-5|1.1|14|Maestros,Campesinos|Hacienda|edu:1.2:m,pob:-0.2:l,apr:0.8:i
jornadaunica|Jornada única con infraestructura escolar|o|-15|5|2.2|8|Maestros,Padres|Hacienda|edu:3:l,seg:0.4:l,apr:0.5:i
formaciondocente|Carrera docente y formación posgradual de maestros|o|-30|-5|1.3|10|Maestros|Hacienda|edu:2.4:l,apr:0.4:i
bilinguismo|Plan nacional de bilingüismo|o|10|-5|0.6|6|Gremios,Estudiantes|Maestros|edu:1.2:l,exp:0.2:l
icetexalivio|Alivio y refinanciación de deudas del ICETEX|o|-40|-10|1.6|20|Estudiantes|Hacienda,Banca|edu:0.8:m,apr:1.4:i,def:0.1:i
ciclopropedeutico|Formación técnica y tecnológica gratuita (SENA ampliado)|o|-25|0|1.5|13|Sindicatos,Industria|Hacienda|des:-0.4:m,edu:1.8:l,cr:0.1:l
colegiosprivados|Libertad de tarifas y subsidios a colegios privados|o|45|10|0.4|-4|Gremios,Iglesias|Maestros,Estudiantes|edu:0.4:l,apr:-0.5:i
educacionrural|Escuela rural: transporte, internet y docentes en zonas apartadas|o|-30|-5|1.4|11|Campesinos,Indígenas|Hacienda|edu:2.2:l,pob:-0.2:l
educacioninicial|Atención integral a la primera infancia|e|-35|-10|2.0|16|Mujeres,Maestros|Hacienda|edu:2.5:l,pob:-0.3:l,apr:1:i
autonomiauniversitaria|Estatuto de autonomía y financiación universitaria|e|-35|-15|2.8|12|Estudiantes,Rectores|Hacienda|edu:2.5:m,apr:1:i,def:0.1:m
pruebasestado|Reforma de las pruebas de Estado y el ICFES|o|5|0|0.2|0|Maestros|Estudiantes|edu:0.6:l
`,
salud: `
sal_publico|Reforma a la salud: EPS gestoras y red pública fortalecida|g|-50|-5|0|6|Médicos,Hospitales,Pacientes|EPS,Banca|sal:0.6:l,apr:0.4:i
sal_mixto|Reforma a la salud: modelo mixto con atención primaria|g|-10|0|0|4|Médicos,Pacientes|EPS|sal:0.8:l
sal_privado|Reforma a la salud: competencia y libre elección de aseguradora|g|50|5|0|-5|EPS,Gremios|Médicos,Hospitales|sal:0.2:m
sal_giro|Giro directo a hospitales y clínicas|o|-10|0|0.6|9|Hospitales,Médicos|EPS|sal:0.5:m
atencionprimaria|Modelo de atención primaria preventiva|o|-30|-5|2.5|12|Médicos,Mujeres|EPS|sal:3:l,pob:-0.1:l,apr:0.8:i
liquidacioneps|Liquidación y reorganización de EPS deficitarias|o|-20|0|1.8|9|Médicos,Pacientes|EPS|sal:1.5:m,conf:-0.2:i,apr:0.6:i
tarifaspiso|Tarifas mínimas y pago oportuno a hospitales públicos|o|-25|0|1.4|7|Médicos,Hospitales|EPS|sal:2:m,def:0.1:m
saludmental|Ley de salud mental y prevención del suicidio|e|-20|-20|0.7|9|Mujeres,Jóvenes,Médicos|Iglesias|sal:1.4:m,seg:0.2:l,apr:0.6:i
medicamentoscontrol|Control de precios de medicamentos|o|-50|-5|0.3|15|Pacientes,Pensionados|Industria,Gremios|sal:1.5:m,inf:-0.1:m,inv:-0.1:l
genericos|Fomento a la industria nacional de genéricos y vacunas|o|-10|0|1.0|8|Industria,Médicos|Gremios|sal:1.2:l,exp:0.2:l
saludrural|Equipos básicos de salud rural y telemedicina|o|-25|-5|1.2|10|Campesinos,Indígenas|Hacienda|sal:2:m,pob:-0.1:l
cannabismedicinal|Cannabis medicinal: producción, exportación y regulación|o|30|-35|0.2|3|Campesinos,Industria|Iglesias|exp:0.3:l,cr:0.1:l,apr:-0.2:i
eutanasia|Regulación de la muerte digna|e|10|-60|0.1|-2|Médicos,Jóvenes|Iglesias|apr:-0.5:i,sal:0.2:l
reformapensional_salud|Aporte solidario a la salud de altos ingresos|o|-45|-5|-1.2|-1|Sindicatos,Pensionados|Gremios,Banca|sal:1.3:m,def:-0.1:m,inv:-0.1:l
trabajadoressalud|Formalización laboral del talento humano en salud|o|-35|0|1.1|9|Médicos,Sindicatos|EPS,Hacienda|sal:1.5:m,des:-0.1:m
saludpublicavacunas|Plan ampliado de inmunización y vigilancia epidemiológica|o|-10|0|0.9|8|Médicos|Iglesias|sal:2:m,apr:0.4:i
tabaco|Impuestos saludables a cigarrillos, licores y comida chatarra|o|-20|10|-1.3|-4|Médicos|Industria,Gremios|sal:0.9:l,def:-0.1:m,apr:-0.6:i
`,
empleo: `
saludlaboral|Salario mínimo diferencial regional|o|40|5|0|-3|Gremios|Sindicatos|des:-0.3:m,pob:0.1:m,apr:-0.6:i
trabajoplataformas|Estatuto de trabajadores de plataformas digitales|o|-20|-10|0.3|12|Jóvenes,Sindicatos|Tecnológicas|des:-0.1:m,pob:-0.1:m,apr:0.9:i,inv:-0.1:l
primerempleo|Incentivo al primer empleo juvenil|o|15|0|0.9|13|Jóvenes,Gremios|Sindicatos|des:-0.5:m,apr:0.8:i
teletrabajo|Régimen moderno de teletrabajo y desconexión laboral|o|5|-10|0.1|8|Jóvenes,Gremios|Hacienda|cr:0.1:l,apr:0.5:i
tercerizacion|Límites a la tercerización e intermediación laboral|o|-45|-5|0.1|7|Sindicatos|Gremios,Industria|pob:-0.2:m,inv:-0.1:l,apr:0.6:i
licenciamaternidad|Ampliación de licencia de maternidad y paternidad|o|-30|-35|0.3|12|Mujeres,Sindicatos|Gremios|pob:-0.1:l,apr:0.9:i,inv:-0.05:l
jornada42|Reducción gradual de la jornada laboral a 42 horas|o|-40|-10|0.2|11|Sindicatos,Jóvenes|Gremios,Industria|inv:-0.2:m,des:-0.1:m,apr:0.8:i
economiapopular|Estatuto de la economía popular y vendedores informales|o|-35|-10|0.8|9|Sindicatos|Gremios|des:-0.2:m,pob:-0.3:m
cooperativas|Fomento del cooperativismo y la economía solidaria|o|-45|0|0.5|6|Campesinos,Sindicatos|Banca|des:-0.2:l,pob:-0.2:l
inspeccionlaboral|Fortalecimiento de la inspección del trabajo|o|-25|0|0.4|4|Sindicatos|Gremios|des:-0.05:l,apr:0.2:i
despidosmasivos|Fuero de estabilidad y control de despidos colectivos|o|-40|0|0.1|6|Sindicatos|Gremios|inv:-0.15:m,des:-0.1:m
pensionjoven|Subsidio a la cotización pensional de jóvenes y campesinos|o|-30|0|1.4|8|Campesinos,Jóvenes|Hacienda|pob:-0.3:l,def:0.1:m
`,
seguridad: `
policiacomunitaria|Policía comunitaria y cuadrantes ampliados|o|5|10|1.2|9|Fuerza Pública,Alcaldes|Ambientalistas|seg:2:m,apr:0.6:i
carcelescapacidad|Plan de infraestructura carcelaria|o|15|20|1.8|4|Fuerza Pública,Jueces|Hacienda|seg:1:l,def:0.1:m
reincidencia|Endurecimiento de penas por reincidencia|e|20|45|0.6|10|Fuerza Pública,Iglesias|Defensores de DDHH|seg:1.2:m,apr:0.8:i,conf:-0.2:l
armasregulacion|Restricción al porte y tenencia de armas|o|-10|-25|0.2|3|Mujeres,Alcaldes|Gremios|seg:1:m,apr:0.2:i
ciberseguridad|Estrategia nacional de ciberseguridad y delitos informáticos|o|15|5|0.7|4|Tecnológicas,Banca|Libertades|seg:0.8:m,conf:0.3:l
extorsion|Ley contra la extorsión y el secuestro|o|20|35|0.5|12|Gremios,Fuerza Pública|Defensores de DDHH|seg:1.5:m,inv:0.2:l,apr:0.8:i
pandillas|Intervención integral de pandillas y juventud en riesgo|o|-15|-5|1.1|7|Alcaldes,Jóvenes|Hacienda|seg:1.3:m,des:-0.05:l
seguridadprivada|Reforma a la vigilancia y seguridad privada|o|30|15|0.1|0|Gremios|Sindicatos|seg:0.4:m
violenciaintrafamiliar|Ley integral contra la violencia de género y feminicidio|e|-20|-30|0.9|13|Mujeres,Jóvenes|Iglesias|seg:1:m,apr:1:i
videovigilancia|Red nacional de videovigilancia y reconocimiento facial|o|25|20|1.0|6|Fuerza Pública,Alcaldes|Libertades|seg:1.4:m,conf:-0.2:l
drogascomunes|Regulación del consumo y microtráfico (enfoque de salud pública)|o|-5|-50|0.3|-2|Jóvenes,Médicos|Iglesias,Fuerza Pública|seg:0.4:l,sal:0.5:m,apr:-0.5:i
policiaprofesion|Carrera policial, bienestar y control disciplinario|o|0|5|0.9|6|Fuerza Pública|Libertades|seg:1:l,conf:0.3:l
`,
justicia: `
descongestion|Plan de descongestión judicial y oralidad|o|0|0|1.2|5|Jueces,Abogados|Hacienda|conf:0.6:l,inv:0.2:l
justiciarural|Casas de justicia y jueces itinerantes rurales|o|-15|-5|0.7|6|Campesinos,Indígenas|Hacienda|conf:0.4:m,seg:0.4:m
tutela|Reglamentación de la acción de tutela|e|20|10|0.1|-3|Jueces|Defensores de DDHH,Abogados|conf:-0.3:m
anticorrupcion|Estatuto anticorrupción: inhabilidad perpetua para corruptos|e|0|10|0.3|18|Medios,Jóvenes|Políticos|conf:1.2:l,apr:1.3:i
extincion|Reforma a la extinción de dominio|o|10|20|0.2|12|Fuerza Pública,Medios|Abogados|seg:0.8:m,conf:0.6:m,apr:0.7:i
carreraJudicial|Reforma a la carrera judicial y a la Rama|g|0|0|0.9|2|Jueces|Políticos|conf:0.8:l
colaboracion|Reglas de colaboración eficaz y principio de oportunidad|o|5|5|0.1|2|Jueces|Defensores de DDHH|conf:0.4:l,seg:0.4:m
conciliacion|Justicia restaurativa y mecanismos alternativos de conflictos|o|0|-10|0.3|4|Abogados|Jueces|conf:0.3:m
fiscaliareforma|Reforma al sistema de investigación criminal|g|10|10|0.8|4|Fuerza Pública,Medios|Abogados|seg:0.8:l,conf:0.4:l
cortesaltas|Reforma a la composición y periodos de las altas cortes|a|10|10|0.1|5|Medios|Jueces|conf:-0.4:i,conf:0.8:l
accesojusticia|Acceso a la justicia y defensoría pública gratuita|o|-25|-10|0.7|7|Defensores de DDHH,Pobres|Abogados|conf:0.5:m,pob:-0.1:l
indultoprotesta|Beneficios penales para manifestantes y líderes sociales|o|-30|-35|0.1|2|Jóvenes,Defensores de DDHH|Fuerza Pública,Gremios|seg:-0.3:i,conf:0.2:m
`,
politica: `
financiaciondecampañas|Financiación estatal exclusiva de campañas|e|-15|0|0.9|10|Medios,Jóvenes|Políticos,Gremios|conf:0.9:l,apr:0.8:i
listasabiertas|Listas abiertas en todas las corporaciones|e|0|0|0.1|4|Medios|Partidos|conf:0.4:l
voto16|Voto a los 16 años|a|-10|-35|0.2|3|Jóvenes|Iglesias|conf:0.2:l,apr:-0.2:i
reeleccion|Reelección presidencial inmediata|a|10|10|0.1|-8|Gobierno|Oposición,Medios|conf:-0.8:m,apr:-1:i
periodopresidencial|Periodo presidencial único de seis años|a|0|0|0.1|6|Medios|Gobierno|conf:0.6:l
circunscripcionesindigenas|Circunscripciones especiales para víctimas y regiones|a|-25|-25|0.3|8|Víctimas,Indígenas|Partidos|conf:0.5:l,apr:0.4:i
transparenciavoto|Voto electrónico y escrutinio digital|e|10|0|0.8|5|Tecnológicas,Medios|Partidos|conf:0.8:l
oposicionestatuto|Reforma al estatuto de oposición|e|-10|-10|0.1|3|Oposición|Gobierno|conf:0.3:l
silla_vacia|Sanciones por transfuguismo y silla vacía|a|0|10|0.1|7|Medios|Políticos|conf:0.5:l,apr:0.5:i
lobby|Regulación del cabildeo y registro de lobistas|o|0|0|0.1|6|Medios|Gremios|conf:0.7:l
bancadas|Disciplina de bancadas y financiación de partidos|e|0|5|0.2|2|Partidos|Medios|conf:0.2:l
revocatoria|Reforma a la revocatoria y a la iniciativa popular|e|-25|-10|0.2|5|Jóvenes,Medios|Políticos|conf:0.3:l,apr:0.3:i
`,
paz: `
restitucion|Aceleración de la restitución de tierras|o|-40|-10|2.1|9|Víctimas,Campesinos|Gremios|pob:-0.2:l,seg:0.6:m,apr:0.6:i
reparacionvictimas|Fondo ampliado de reparación a víctimas|o|-30|-15|1.9|9|Víctimas|Hacienda|seg:0.5:m,conf:0.4:l
reincorporacion|Programa de reincorporación productiva de excombatientes|o|-25|-10|1.0|3|Víctimas,Alcaldes|Oposición|seg:0.6:m,des:-0.05:l
pdet|Obras PDET con financiación garantizada|o|-30|-5|2.2|8|Campesinos,Alcaldes|Hacienda|seg:0.8:m,pob:-0.2:l,inf2:0.4:l
sustitucion|Sustitución voluntaria de cultivos de uso ilícito|o|-20|-10|1.4|8|Campesinos|Fuerza Pública|seg:0.4:m,pob:-0.2:l
pazurbana|Mesas de sometimiento y paz urbana|o|-10|-5|0.5|5|Alcaldes|Fuerza Pública|seg:0.6:m,conf:-0.1:i
desminado|Plan nacional de desminado humanitario|o|0|-5|0.6|6|Víctimas,Fuerza Pública|-|seg:0.5:m
busqueda|Unidad de búsqueda de desaparecidos reforzada|o|-10|-10|0.5|6|Víctimas|-|conf:0.4:l
verdadmemoria|Centro nacional de memoria histórica y educación para la paz|o|-20|-20|0.3|3|Víctimas,Estudiantes|Oposición|conf:0.3:l,apr:-0.1:i
proteccionlideres|Protección colectiva de líderes sociales y defensores|o|-15|-15|0.6|7|Defensores de DDHH,Indígenas|Hacienda|seg:0.6:m,conf:0.3:l
zonasreserva|Zonas de reserva campesina y desarrollo rural|o|-35|-10|0.8|6|Campesinos|Gremios|pob:-0.2:l,cr:0.05:l
`,
hacienda: `
pen_publico|Reforma pensional: pilar público (Colpensiones) para ingresos bajos y medios|g|-45|-5|0|5|Sindicatos,Pensionados|Banca,Gremios|apr:0.4:i
pen_mixto|Reforma pensional: sistema mixto de pilares|g|0|0|0|3|Hacienda,Pensionados|Sindicatos,Banca|conf:0.3:m
pen_privado|Reforma pensional: ahorro individual y fortalecimiento de los fondos privados|g|55|5|0|-6|Banca,Gremios|Sindicatos,Pensionados|conf:0.3:m
pen_edad|Aumento gradual de la edad de pensión|g|40|10|0|-14|Hacienda,Banca|Sindicatos,Pensionados|def:-0.2:l,apr:-0.8:i
pen_solidario|Pilar solidario universal para adultos mayores|g|-35|-5|0|13|Pensionados,Pobres|Hacienda|pob:-0.2:l,apr:0.8:i
banrep_reforma|Reforma a la junta y a la independencia del Banco de la República|a|-25|0|0|-3|Sindicatos|Banca,Hacienda|conf:-0.3:m
fogafin|Fortalecimiento de Fogafín y del seguro de depósitos|o|20|0|0.4|2|Banca,Hacienda|-|conf:0.4:l
reformatributaria|Reforma tributaria estructural progresiva|o|-30|0|-3.5|-6|Sindicatos,Hacienda|Gremios,Banca|def:-0.5:m,deu:-0.8:l,inv:-0.3:m,apr:-1:i
iva|Ampliación de la base del IVA con devolución a hogares pobres|o|10|0|-2.2|-9|Hacienda|Sindicatos,Pobres|def:-0.3:m,inf:0.3:m,pob:0.1:m,apr:-1.4:i
patrimonio|Impuesto al patrimonio de grandes fortunas|o|-55|0|-1.6|4|Sindicatos|Banca,Gremios|def:-0.2:m,inv:-0.2:m
renta_personas|Renta de personas naturales con tarifas más progresivas|o|-35|0|-1.4|-2|Sindicatos|Gremios|def:-0.2:m,inv:-0.1:m
zonasfrancas|Beneficios tributarios para zonas francas y exportadoras|o|50|0|0.8|2|Gremios,Industria|Sindicatos|exp:0.4:m,inv:0.4:m,def:0.1:m
regladegasto|Regla fiscal reforzada con techo de deuda|g|55|5|-0.3|-3|Hacienda,Banca|Sindicatos|deu:-0.6:l,conf:0.8:m,inv:0.2:l,apr:-0.3:i
banrep|Reforma al Banco de la República y su junta|a|25|0|0.1|-4|Banca|Sindicatos|inf:-0.2:l,conf:-0.3:i
dian|Modernización de la DIAN y lucha contra la evasión|o|10|0|0.6|3|Hacienda|Gremios|def:-0.3:m,conf:0.3:l
impuestocarbono|Impuesto al carbono y a emisiones|o|-5|-15|-1.2|-3|Ambientalistas,Hacienda|Industria,Minero-energético|def:-0.15:m,cr:-0.05:m
gmf|Eliminación gradual del gravamen a los movimientos financieros|o|50|5|1.8|5|Gremios,Banca|Hacienda|inv:0.3:m,def:0.2:m
privatizacionactivos|Venta de participaciones estatales en empresas|o|60|5|-2.5|-4|Hacienda,Gremios|Sindicatos|deu:-0.5:l,def:-0.2:m,apr:-0.7:i
amnistiatributaria|Normalización tributaria y repatriación de capitales|o|45|0|-0.9|-2|Gremios|Sindicatos|def:-0.1:m,inv:0.2:m
tobinbanca|Sobretasa a utilidades del sistema financiero|o|-45|0|-1.1|7|Sindicatos|Banca|def:-0.1:m,inv:-0.1:m,apr:0.8:i
`,
presupuesto: `
presupuestoplurianual|Marco fiscal de mediano plazo con metas plurianuales|g|30|0|0.1|0|Hacienda|-|conf:0.4:l,deu:-0.2:l
regalias|Reforma al Sistema General de Regalías|o|-10|0|0.8|6|Alcaldes,Gobernadores|Hacienda|inf2:0.5:l,pob:-0.1:l
sgp|Transferencias territoriales (SGP) con más recursos|a|-30|0|2.5|8|Gobernadores,Alcaldes|Hacienda|pob:-0.2:l,edu:0.5:l,sal:0.5:l,def:0.2:m
trasparenciagasto|Presupuesto abierto y rendición de cuentas digital|o|5|0|0.2|5|Medios|Políticos|conf:0.6:l
contratacion|Reforma a la contratación pública (pliegos tipo y SECOP)|o|10|0|0.2|5|Medios,Gremios|Políticos|conf:0.6:l,inf2:0.1:l
austeridad|Plan de austeridad del gasto de funcionamiento|o|45|5|-1.1|7|Hacienda,Medios|Sindicatos|def:-0.2:m,apr:0.7:i
cuentasterritoriales|Control fiscal y saneamiento de deudas territoriales|o|20|0|0.5|3|Hacienda|Alcaldes|conf:0.3:l,deu:-0.1:l
vigenciasfuturas|Régimen de vigencias futuras para grandes obras|g|25|0|0.1|1|Constructores|-|inf2:0.4:l,deu:0.1:l
ahorrofuturo|Fondo soberano de ahorro y estabilización|o|30|0|0.8|2|Hacienda,Banca|-|deu:-0.3:l,conf:0.4:l
focalizacion|Reforma al Sisbén y focalización del gasto social|o|20|0|0.3|3|Hacienda|Pobres|def:-0.1:m,pob:0.05:m
`,
agricultura: `
reformaagraria|Reforma agraria integral y fondo de tierras|o|-50|-10|2.6|7|Campesinos,Víctimas|Gremios|pob:-0.4:l,cr:0.1:l,apr:0.4:i
creditoagro|Crédito agropecuario con tasas preferenciales|o|-10|0|1.4|8|Campesinos,Gremios|Banca|cr:0.2:m,exp:0.2:m,pob:-0.1:l
seguroagro|Seguro agropecuario y gestión de riesgo climático|o|0|0|0.8|5|Campesinos|Hacienda|cr:0.1:m,pob:-0.1:l
tlcagro|Protección arancelaria y salvaguardias agrícolas|o|-20|5|0.5|8|Campesinos|Gremios,Comercio|pob:-0.15:m,inf:0.15:m,exp:-0.1:m
viasterciarias|Plan de vías terciarias y centros de acopio|o|-10|0|2.0|9|Campesinos,Alcaldes|Hacienda|inf2:1:l,pob:-0.2:l,cr:0.15:l
cafetero|Fondo de estabilización del café y los cacaoteros|o|-5|0|0.7|6|Campesinos|Hacienda|exp:0.2:m,pob:-0.1:m
catastromulti|Catastro multipropósito y formalización de la propiedad|o|5|-5|1.2|5|Campesinos,Alcaldes|Gremios|cr:0.15:l,pob:-0.1:l,conf:0.3:l
agroindustria|Zonas de desarrollo agroindustrial y encadenamientos|o|40|0|0.9|4|Gremios,Industria|Campesinos|exp:0.5:m,cr:0.2:m
pescaacuicultura|Fomento a la pesca artesanal y acuicultura|o|-5|0|0.4|4|Campesinos|-|exp:0.1:m,pob:-0.05:l
agroecologia|Transición a la agroecología y semillas nativas|o|-20|-15|0.5|4|Ambientalistas,Campesinos|Industria|pob:-0.1:l,exp:-0.05:m
transgenicos|Liberación de cultivos mejorados genéticamente|o|40|10|0.1|-2|Industria,Gremios|Ambientalistas,Campesinos|cr:0.15:m,exp:0.2:m,apr:-0.3:i
contrabandoagro|Control al contrabando de productos agrícolas|o|10|10|0.3|5|Campesinos,Gremios|-|exp:0.1:m,seg:0.2:m
`,
ambiente: `
deforestacion|Pacto contra la deforestación amazónica|o|-10|-10|0.9|6|Ambientalistas,Indígenas|Gremios|seg:0.3:m,conf:0.3:l,cr:-0.05:m
fracking|Prohibición del fracturamiento hidráulico|o|-25|-15|0.2|5|Ambientalistas|Minero-energético|exp:-0.2:m,apr:0.6:i
paramos|Delimitación y protección de páramos y humedales|o|-15|-10|0.6|5|Ambientalistas|Minero-energético|cr:-0.05:m,conf:0.2:l
aguas|Gestión integral del recurso hídrico|o|-5|0|1.0|5|Ambientalistas,Alcaldes|Industria|sal:0.5:l,cr:0.05:l
residuos|Economía circular y responsabilidad extendida del productor|o|10|-5|0.5|4|Ambientalistas,Jóvenes|Industria|cr:0.05:l,sal:0.2:l
plasticos|Prohibición progresiva de plásticos de un solo uso|o|0|-10|0.1|6|Ambientalistas,Jóvenes|Industria|sal:0.1:l,inv:-0.05:m,apr:0.4:i
mineriailegal|Ley contra la minería ilegal y la deforestación ligada|o|10|15|0.8|8|Fuerza Pública,Ambientalistas|Mineros informales|seg:0.6:m,conf:0.3:l
bonoscarbono|Mercado nacional de bonos de carbono y servicios ambientales|o|35|0|0.3|3|Ambientalistas,Gremios|-|inv:0.2:m,exp:0.1:m
cambioclimatico|Ley de acción climática y adaptación territorial|o|-10|-10|1.1|5|Ambientalistas,Alcaldes|Industria|cr:0.05:l,conf:0.3:l
animales|Estatuto de protección y bienestar animal|o|-5|-25|0.2|12|Jóvenes,Ambientalistas|Gremios|apr:0.8:i
corridastoros|Prohibición de las corridas de toros|o|-5|-35|0.1|7|Jóvenes,Ambientalistas|Gremios|apr:0.1:i
licenciaambiental|Licencia ambiental exprés|o|50|5|0.1|-2|Gremios,Minero-energético|Ambientalistas|inv:0.4:m,cr:0.15:m,conf:-0.2:l
bosquescomunitarios|Manejo forestal comunitario y pago por servicios ambientales|o|-20|-10|0.5|4|Indígenas,Campesinos|-|pob:-0.1:l,conf:0.2:l
`,
energia: `
transicionenergetica|Transición energética justa: renovables y desmonte gradual|o|-10|-5|2.0|6|Ambientalistas,Jóvenes|Minero-energético|inv:0.3:m,cr:0.1:l,exp:-0.15:m
solarcomunidades|Comunidades energéticas y autogeneración solar|o|-10|-5|0.9|8|Alcaldes,Ambientalistas|-|inv:0.2:m,pob:-0.05:l,inf2:0.2:l
tarifasenergia|Reducción de tarifas de energía y opción tarifaria|o|-40|0|1.3|12|Pobres,Alcaldes|Industria|inf:-0.2:m,pob:-0.15:m,def:0.1:m
exploracion|Reactivación de la exploración de petróleo y gas|o|50|5|-0.8|3|Minero-energético,Gremios|Ambientalistas|exp:0.6:m,inv:0.4:m,cr:0.2:m,def:-0.1:m
hidrogeno|Estrategia del hidrógeno verde|o|20|-5|0.8|3|Industria,Ambientalistas|-|inv:0.2:l,exp:0.2:l
nuclear|Marco para energía nuclear civil|o|35|10|0.3|-3|Industria|Ambientalistas|inv:0.1:l
interconexion|Interconexión eléctrica regional y exportación de energía|o|30|0|1.2|3|Industria,Gremios|-|exp:0.3:l,inv:0.2:l
subsidiosgas|Subsidios al gas domiciliario|o|-35|0|1.0|9|Pobres|Hacienda|inf:-0.1:m,pob:-0.1:m
reformaecopetrol|Reorganización de Ecopetrol y su gobierno corporativo|o|20|0|0.2|0|Gremios|Sindicatos|inv:0.1:m,conf:0.2:m
vehiculoselectricos|Incentivos a vehículos eléctricos y estaciones de carga|o|10|-5|0.7|5|Ambientalistas,Industria|-|inv:0.15:m,exp:0.05:l
mineriagrande|Fomento a la gran minería formal responsable|o|45|5|-0.5|1|Minero-energético|Ambientalistas|exp:0.4:m,cr:0.15:m
apagones|Plan de confiabilidad y prevención de apagones|o|-5|0|1.2|4|Industria|-|cr:0.1:m,conf:0.3:m
`,
infraestructura: `
cuartagen|Cuarta y quinta generación de concesiones (APP)|o|40|0|-0.3|5|Constructores,Gremios|Sindicatos|inf2:1.2:l,cr:0.2:m,def:0.1:m
trenes|Red nacional de trenes de pasajeros y carga|o|-5|0|3.5|8|Constructores,Alcaldes|Hacienda|inf2:2:l,exp:0.3:l,cr:0.2:l,def:0.3:m
puertos|Modernización de puertos y canal del Dique|o|20|0|1.8|4|Gremios,Constructores|-|exp:0.5:l,inf2:0.8:l
aeropuertos|Plan de aeropuertos regionales|o|20|0|1.2|5|Alcaldes,Gremios|-|inf2:0.7:l,cr:0.1:m
metroscolombia|Cofinanciación de metros y sistemas masivos urbanos|o|-5|0|2.8|10|Alcaldes|Hacienda|inf2:1.2:l,seg:0.1:l,apr:0.6:i,def:0.2:m
rios|Navegabilidad del río Magdalena|o|10|0|1.6|4|Constructores|Ambientalistas|exp:0.3:l,inf2:0.6:l
peajes|Reducción y congelamiento de peajes|o|-30|0|0.9|12|Transportadores|Constructores|inf:-0.05:m,apr:0.9:i,inf2:-0.1:l
bicicletas|Movilidad activa: ciclorrutas y transporte limpio urbano|o|-10|-10|0.6|6|Jóvenes,Ambientalistas|-|sal:0.2:l,inf2:0.2:l
ruralvias|Placa huella y vías rurales por obras comunitarias|o|-20|0|1.0|8|Campesinos,Alcaldes|-|inf2:0.7:l,des:-0.05:m
acueducto|Agua potable y saneamiento básico para todos|o|-20|0|2.2|11|Alcaldes,Indígenas|Hacienda|sal:1.5:l,pob:-0.2:l,inf2:0.5:l
fibraoptica|Conectividad universal: fibra óptica y satélite|o|10|0|1.5|8|Tecnológicas,Alcaldes|-|cr:0.2:l,edu:0.6:l,inf2:0.5:l
logistica|Política nacional de logística y transporte multimodal|o|30|0|0.7|3|Transportadores,Gremios|-|exp:0.3:l,inf:-0.05:l
transportepublico|Subsidio al transporte público y tarifa diferencial|o|-35|-5|1.1|11|Pobres,Alcaldes|Hacienda|pob:-0.15:m,apr:0.7:i
`,
tecnologia: `
iaregulacion|Marco regulatorio de la inteligencia artificial|e|5|0|0.3|3|Tecnológicas,Jóvenes|Gremios|inv:0.1:l,conf:0.3:l
datospersonales|Ley de protección de datos y derechos digitales|e|-5|-10|0.2|7|Jóvenes,Medios|Tecnológicas|conf:0.4:l,inv:-0.05:m
gobiernodigital|Gobierno digital y carpeta ciudadana única|o|10|0|0.9|7|Tecnológicas,Jóvenes|-|conf:0.4:l,cr:0.1:l
emprendimiento|Ley de emprendimiento, capital semilla y startups|o|30|-5|0.5|8|Jóvenes,Tecnológicas|-|cr:0.2:m,des:-0.15:m
cienciatecnologia|Ley de ciencia, tecnología e innovación con 1% del PIB|o|-10|-5|2.0|7|Rectores,Estudiantes|Hacienda|edu:1.5:l,cr:0.2:l
semiconductores|Parques tecnológicos y manufactura avanzada|o|35|0|1.0|4|Industria,Tecnológicas|-|exp:0.3:l,inv:0.3:m
criptoactivos|Regulación de criptoactivos y pagos digitales|e|35|-10|0.1|2|Tecnológicas,Banca|Hacienda|inv:0.1:m,conf:0.1:l
brechadigital|Internet gratuito en escuelas y zonas rurales|o|-20|0|1.2|10|Maestros,Campesinos|Hacienda|edu:1:l,pob:-0.1:l
desinformacion|Ley contra la desinformación y la manipulación digital|e|10|10|0.2|2|Medios|Libertades|conf:0.3:l,apr:-0.2:i
tvpublica|Reforma de los medios públicos y la TV regional|o|-25|-10|0.5|2|Medios,Cultura|Gremios|conf:0.2:l
5g|Espectro y despliegue de 5G|o|30|0|0.2|5|Tecnológicas,Gremios|-|cr:0.2:m,inv:0.2:m
teletrabajoestado|Transformación digital de pequeñas empresas|o|20|0|0.7|5|Gremios|-|cr:0.15:l,des:-0.05:m
`,
vivienda: `
subsidiovivienda|Subsidio a la compra de vivienda social (VIS/VIP)|o|-10|0|2.0|13|Constructores,Pobres|Hacienda|pob:-0.2:m,cr:0.2:m,des:-0.1:m
arrendamiento|Límite a incrementos de arriendos y protección al arrendatario|o|-40|-5|0.2|10|Jóvenes,Sindicatos|Constructores|inf:-0.1:m,inv:-0.1:l,apr:0.8:i
mejoramientobarrios|Mejoramiento integral de barrios y titulación|o|-25|-5|1.4|10|Alcaldes,Pobres|-|pob:-0.2:l,seg:0.2:l
leasing|Leasing habitacional y crédito hipotecario con tasa fija|o|35|0|0.7|8|Banca,Constructores|-|cr:0.2:m,inf2:0.1:l
vivienda_rural|Vivienda rural y mejoramiento de fincas|o|-20|0|1.0|8|Campesinos|Hacienda|pob:-0.15:l
suelo|Banco de tierras urbanas y suelo para vivienda|o|-15|0|0.6|4|Alcaldes|Constructores|cr:0.1:l
reasentamiento|Reasentamiento por riesgo y gestión del riesgo de desastres|o|-10|0|1.2|7|Alcaldes|-|sal:0.3:l,seg:0.2:m
energiavivienda|Código de construcción sostenible|o|0|-5|0.4|3|Ambientalistas,Constructores|-|cr:0.05:l
cooperativasvivienda|Vivienda cooperativa y autogestión|o|-45|-5|0.7|4|Sindicatos|Constructores|pob:-0.1:l
cesantiasvivienda|Uso de cesantías y pensiones para vivienda|o|20|0|0.1|7|Jóvenes|Banca|cr:0.1:m,apr:0.6:i
espaciopublico|Estatuto del espacio público y ciudad compacta|o|5|-5|0.4|3|Alcaldes|Constructores|seg:0.2:l
`,
comercio: `
aranceles|Reducción unilateral de aranceles|o|60|5|-0.6|2|Gremios,Industria|Campesinos,Sindicatos|inf:-0.2:m,exp:0.2:m,des:0.1:m
exportacionespyme|Programa de exportación para pymes|o|25|0|0.7|5|Gremios|-|exp:0.4:m,cr:0.1:m
tlc|Aprobación de nuevos TLC con Asia y Europa|o|55|5|0.1|-1|Gremios,Comercio|Sindicatos,Campesinos|exp:0.5:m,inv:0.3:m,des:0.05:m
competencia|Ley de competencia y límites a posiciones dominantes|o|-10|0|0.2|6|Jóvenes,Medios|Gremios|inf:-0.15:m,cr:0.05:l
protecciondeconsumo|Estatuto reforzado del consumidor|o|-15|0|0.2|9|Pobres,Medios|Gremios|inf:-0.05:m,apr:0.5:i
desarrolloindustrial|Política de reindustrialización nacional|o|-20|0|1.8|8|Industria,Sindicatos|Hacienda|cr:0.3:l,des:-0.2:m,exp:0.2:l,def:0.2:m
turismo|Ley de turismo sostenible y destinos regionales|o|20|0|0.5|6|Gremios,Alcaldes|-|exp:0.2:m,des:-0.1:m,cr:0.1:m
microcredito|Microcrédito y bancarización de pequeños negocios|o|10|0|0.6|9|Gremios,Pobres|Banca|des:-0.15:m,pob:-0.1:m
usura|Reducción del tope de usura y tarjetas de crédito|o|-30|0|0.1|11|Pobres,Jóvenes|Banca|inf:-0.05:m,inv:-0.1:m,apr:0.9:i
quiebras|Ley de insolvencia y salvamento de empresas|o|15|0|0.4|3|Gremios|-|des:-0.1:m,cr:0.1:m
ventanilla|Ventanilla única empresarial y simplificación de trámites|o|35|0|0.2|5|Gremios,Jóvenes|-|cr:0.15:m,inv:0.2:m,conf:0.2:l
sellocolombia|Marca país y promoción de productos con denominación de origen|o|10|0|0.2|3|Campesinos,Cultura|-|exp:0.15:m
`,
exteriores: `
migracionvenezolana|Estatuto de integración de migrantes y refugiados|e|-10|-20|1.0|-2|Defensores de DDHH,Alcaldes|Oposición|des:0.05:m,cr:0.1:m,apr:-0.5:i
diasporas|Voto, representación y servicios para colombianos en el exterior|o|0|-5|0.3|5|Cancillería|-|conf:0.2:l
servicioexterior|Reforma a la carrera diplomática|o|0|0|0.3|0|Cancillería|-|conf:0.3:l
fronteras|Política de desarrollo y seguridad de fronteras|o|5|10|1.1|5|Fuerza Pública,Alcaldes|-|seg:0.8:m,exp:0.2:l
ratificacioncorte|Adhesión a tratados de derechos humanos y justicia penal|o|-10|-20|0.1|1|Defensores de DDHH|Oposición|conf:0.3:l
mercosur|Profundización de la integración con el Mercosur|o|-15|-5|0.4|3|Industria,Campesinos|Gremios|exp:0.3:m,conf:0.2:l
pacifico|Diplomacia económica hacia la Alianza del Pacífico y APEC|o|30|0|0.3|2|Gremios,Comercio|-|exp:0.4:m
cooperacion|Agencia de cooperación internacional y ayuda humanitaria|o|-10|-10|0.5|2|Cancillería|Hacienda|conf:0.3:l
visasturismo|Política de visas y atracción de inversión extranjera|o|30|5|0.2|3|Gremios|-|inv:0.3:m,exp:0.1:m
antartida|Programa antártico y presencia en el Caribe|o|0|0|0.4|2|Cancillería|-|conf:0.1:l
cambioclimaticointer|Liderazgo climático internacional y financiamiento verde|o|-10|-10|0.5|4|Ambientalistas|-|conf:0.3:l,inv:0.2:l
extradicion|Reforma al régimen de extradición|o|20|20|0.1|3|Fuerza Pública|Defensores de DDHH|seg:0.3:m
`,
cultura: `
cinematografia|Fomento al cine y la industria audiovisual|o|-5|-10|0.5|5|Cultura,Jóvenes|-|exp:0.1:l,apr:0.3:i
patrimonio|Protección del patrimonio cultural y arqueológico|o|-10|0|0.4|3|Cultura,Indígenas|Constructores|conf:0.1:l
bibliotecas|Red nacional de bibliotecas y fomento a la lectura|o|-20|0|0.5|6|Maestros,Cultura|-|edu:0.7:l,apr:0.3:i
deportes|Ley del deporte y escuelas deportivas en barrios|o|-10|0|1.0|10|Jóvenes,Alcaldes|-|seg:0.3:m,sal:0.4:l,apr:0.8:i
lenguasnativas|Protección y enseñanza de lenguas nativas|o|-20|-15|0.3|3|Indígenas,Cultura|-|edu:0.2:l
artistas|Seguridad social para artistas y gestores culturales|o|-30|-15|0.4|6|Cultura|Hacienda|pob:-0.05:l,apr:0.3:i
concursosfutbol|Reforma al fútbol profesional y control a clubes|o|10|0|0.2|8|Jóvenes|Gremios|conf:0.2:l
festivales|Ferias, festivales y economía naranja|o|15|-5|0.5|6|Cultura,Alcaldes|-|exp:0.1:l,des:-0.05:m
diversidad|Ley de igualdad y reconocimiento a la diversidad sexual|e|-10|-55|0.2|2|Jóvenes,Defensores de DDHH|Iglesias|apr:-0.4:i,conf:0.2:l
libertadreligiosa|Estatuto de libertad religiosa y de cultos|e|20|45|0.1|3|Iglesias|Jóvenes|apr:0.2:i
afrodescendientes|Medidas contra el racismo y por la población afrocolombiana|o|-25|-30|0.6|5|Defensores de DDHH,Indígenas|-|pob:-0.1:l,conf:0.2:l
memoriaoral|Archivo digital de la memoria y las tradiciones|o|-5|-5|0.2|2|Cultura|-|conf:0.1:l
`
  };
  const out = [];
  const usados = new Set((CURUL.DATA.plantillasProyectos || []).map(x => x.id));
  for (const [sector, bloque] of Object.entries(SECCIONES)) {
    for (const linea of bloque.trim().split('\n')) {
      const f = linea.split('|');
      if (f.length < 10) { console.warn('Ley mal formada', linea); continue; }
      let id = f[0];
      if (usados.has(id)) id = id + '_x';
      usados.add(id);
      const lista = s => (s === '-' ? [] : s.split(',').map(x => x.trim()));
      out.push({
        id, titulo: f[1], sector, tipo: TIPO[f[2]], eco: +f[3], soc: +f[4], costo: +f[5], pop: +f[6],
        apoyan: lista(f[7]), opuestos: lista(f[8]),
        efectos: f[9].split(',').map(t => { const [v, d, p] = t.split(':'); return { v: VAR[v] || (v === 'inf2' ? 'infraestructura' : v), d: +d, p }; }),
        extra: true
      });
    }
  }
  CURUL.DATA.plantillasProyectos.push(...out);
})();
