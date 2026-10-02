/* Áreas metropolitanas y regiones de conurbación de Colombia. Cada una lista los municipios (código DANE) que ya
   forman parte, los que podrían sumarse (aspirantes) y el año en que se constituyó la entidad real, si ya existe. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
CURUL.DATA.metropolis = [
  { id: 'ABURRA', n: 'Área Metropolitana del Valle de Aburrá', corto: 'Valle de Aburrá', icono: '🏔', nucleo: '05001', fundada: 1980, tipo: 'area',
    miembros: ['05001', '05088', '05266', '05360', '05631', '05380', '05129', '05212', '05308', '05079'], aspirantes: [],
    nota: 'Diez municipios en un cañón: el metro, el cable y la contaminación del aire son sus grandes temas.', foco: ['movilidad', 'ambiente'], empresa: { nombre: 'Metro Metropolitano', sector: 'transporte' } },
  { id: 'BOGOTA', n: 'Región Metropolitana Bogotá–Cundinamarca', corto: 'Bogotá-Región', icono: '🏙', nucleo: '11001', fundada: 2022, tipo: 'region',
    miembros: ['11001', '25754', '25175', '25126', '25899', '25286', '25473', '25430', '25269', '25214', '25758', '25817', '25377', '25295', '25785', '25799', '25740', '25099', '25200', '25486', '25769', '25260', '25322'], aspirantes: [],
    nota: 'La mayor conurbación del país: más de nueve millones de personas, Soacha como ciudad dormitorio y la sabana como despensa.', foco: ['movilidad', 'vivienda'], empresa: { nombre: 'Tren de la Sabana', sector: 'transporte' } },
  { id: 'CALI', n: 'Área Metropolitana de Cali', corto: 'Cali', icono: '💃', nucleo: '76001', fundada: null, tipo: 'area',
    miembros: ['76001', '76892', '76364', '76130', '76520'], aspirantes: ['76869', '76275', '76563'],
    nota: 'Cali, Yumbo, Jamundí, Candelaria y Palmira funcionan como una sola ciudad sin institución que la gobierne.', foco: ['movilidad', 'seguridad'], empresa: { nombre: 'Movilidad Metropolitana', sector: 'transporte' } },
  { id: 'BARRANQUILLA', n: 'Área Metropolitana de Barranquilla', corto: 'Barranquilla', icono: '🌊', nucleo: '08001', fundada: 1981, tipo: 'area',
    miembros: ['08001', '08758', '08433', '08296', '08573'], aspirantes: ['08634', '08685', '08520', '08078', '08638'],
    nota: 'Puerto, río y mar; Soledad y Malambo crecen más rápido que el núcleo.', foco: ['servicios', 'seguridad'], empresa: { nombre: 'Aguas del Atlántico', sector: 'agua' } },
  { id: 'MANIZALES', n: 'Área Metropolitana de Manizales', corto: 'Manizales', icono: '⛰', nucleo: '17001', fundada: null, tipo: 'area',
    miembros: ['17001', '17873'], aspirantes: ['17174', '17486', '17524'],
    nota: 'Manizales y Villamaría ya son una mancha continua; Chinchiná y Neira miran si se suman.', foco: ['ambiente', 'movilidad'], empresa: { nombre: 'Aguas del Eje', sector: 'agua' } },
  { id: 'PEREIRA', n: 'Área Metropolitana Centro Occidente', corto: 'Pereira', icono: '☕', nucleo: '66001', fundada: 1981, tipo: 'area',
    miembros: ['66001', '66170', '66400'], aspirantes: ['66682', '66440', '76147'],
    nota: 'Pereira, Dosquebradas y La Virginia: el corazón del Eje Cafetero; Cartago, en el Valle, es un aspirante interdepartamental.', foco: ['movilidad', 'servicios'], empresa: { nombre: 'Megabús Metropolitano', sector: 'transporte' } },
  { id: 'BUCARAMANGA', n: 'Área Metropolitana de Bucaramanga', corto: 'Bucaramanga', icono: '🌳', nucleo: '68001', fundada: 1981, tipo: 'area',
    miembros: ['68001', '68276', '68307', '68547'], aspirantes: ['68406'],
    nota: 'Cuatro municipios sobre una meseta: movilidad y relleno sanitario compartido.', foco: ['servicios', 'movilidad'], empresa: { nombre: 'Aseo Metropolitano', sector: 'aseo' } },
  { id: 'CARTAGENA', n: 'Área Metropolitana de Cartagena', corto: 'Cartagena', icono: '🏰', nucleo: '13001', fundada: null, tipo: 'area',
    miembros: ['13001', '13836'], aspirantes: ['13052', '13838', '13222', '13673'],
    nota: 'Turismo, puerto e industria; Turbaco absorbe el crecimiento y el sur de Bolívar depende de la ciudad.', foco: ['servicios', 'vivienda'], empresa: { nombre: 'Transcaribe Metropolitano', sector: 'transporte' } },
  { id: 'CUCUTA', n: 'Área Metropolitana de Cúcuta', corto: 'Cúcuta', icono: '🌉', nucleo: '54001', fundada: 1991, tipo: 'area',
    miembros: ['54001', '54874', '54405', '54261'], aspirantes: ['54673', '54553'],
    nota: 'Conurbación binacional: la frontera con Venezuela y su dinámica migratoria marcan todo.', foco: ['seguridad', 'vivienda'], empresa: { nombre: 'Aguas de la Frontera', sector: 'agua' } }
];
/* Crecimiento anual de población supuesto para estimar cada época (los datos son de la década de 2020). */
CURUL.DATA.metropolisCrecimiento = 0.014;

/* Eventos de las áreas metropolitanas (los dispara C.Metro sólo si el jugador gestiona el área) */
(function (C) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const A = (E, ev) => C.Metro.area(E, ev.ctx.area);
  const ap = (E, d) => { E.opinion.aprobacionPres = clamp(E.opinion.aprobacionPres + d, 3, 95); };
  const aprobLocal = (E, a, d) => { for (const dp of C.Metro.deptos(a)) E.deptos[dp].ajusteAprob = clamp((E.deptos[dp].ajusteAprob || 0) + d, -30, 30); };
  C.DATA.eventos.push(
    { id: 'metroContaminacion', sistema: true, forzar: true, tipo: 'regional', icono: '😷', alcance: 'nacional', peso: 0,
      titulo: 'Alerta roja por la calidad del aire en {area}', texto: 'La contaminación supera los límites en toda la conurbación de {area}. Los hospitales se llenan de casos respiratorios y los alcaldes del área discuten qué hacer.',
      opciones: [
        { t: 'Pico y placa ambiental y restricción a vehículos viejos', fn(E, ev) { const a = A(E, ev); a.indic.ambiente = clamp(a.indic.ambiente + 6, 0, 100); a.indic.integracion = clamp(a.indic.integracion + 1, 0, 100); aprobLocal(E, a, -0.8); return 'El aire mejora, pero los conductores protestan'; } },
        { t: 'Plan de choque con inversión metropolitana', fn(E, ev) { const a = A(E, ev), c = Math.min(0.15, Math.max(0, a.caja.fondoRegalias)); a.caja.fondoRegalias -= c; a.indic.ambiente = clamp(a.indic.ambiente + 8, 0, 100); aprobLocal(E, a, 0.4); return `Gastas ${c.toFixed(2)} billones del fondo: baja la contaminación`; } },
        { t: 'Pedir al Gobierno nacional declarar la emergencia ambiental', fn(E, ev) { const a = A(E, ev); a.indic.ambiente = clamp(a.indic.ambiente + 4, 0, 100); C.Economia.programar(E, [{ v: 'deficit', d: 0.05, p: 'm' }], 'metroambiental'); return 'La Nación ayuda con recursos y asistencia técnica'; } },
        { t: 'Esperar a que el clima ayude', fn(E, ev) { const a = A(E, ev); a.indic.ambiente = clamp(a.indic.ambiente - 3, 0, 100); aprobLocal(E, a, -1.2); return 'La inacción se paga en las encuestas'; } }
      ] },
    { id: 'metroMovilidad', sistema: true, forzar: true, tipo: 'regional', icono: '🚦', alcance: 'nacional', peso: 0,
      titulo: 'Colapso de la movilidad en {area}', texto: 'Los trancones paralizan {area} y los municipios vecinos culpan al núcleo; el transporte entre ciudades del área es un caos.',
      opciones: [
        { t: 'Integrar tarifas y rutas de todo el área', fn(E, ev) { const a = A(E, ev); a.indic.movilidad = clamp(a.indic.movilidad + 7, 0, 100); a.indic.integracion = clamp(a.indic.integracion + 3, 0, 100); return 'Un solo pasaje para toda el área: mejora el flujo'; } },
        { t: 'Obra de choque en los corredores críticos', fn(E, ev) { const a = A(E, ev), c = Math.min(0.2, Math.max(0, a.caja.fondoRegalias)); a.caja.fondoRegalias -= c; a.indic.movilidad = clamp(a.indic.movilidad + 6, 0, 100); return `Gastas ${c.toFixed(2)} billones en obras rápidas`; } },
        { t: 'Culpar a los municipios vecinos', fn(E, ev) { const a = A(E, ev); a.indic.tension = clamp(a.indic.tension + 8, 0, 100); aprobLocal(E, a, 0.3); return 'Aplauden en casa, se calienta la tensión con la periferia'; } }
      ] },
    { id: 'metroTension', sistema: true, forzar: true, tipo: 'regional', icono: '⚖', alcance: 'nacional', peso: 0,
      titulo: 'Los municipios del área reclaman más peso en {area}', texto: 'Los alcaldes de los municipios periféricos acusan al núcleo de quedarse con la plata de la sobretasa y amenazan con retirarse del área.',
      opciones: [
        { t: 'Repartir proyectos y poder en la junta', fn(E, ev) { const a = A(E, ev); a.indic.tension = clamp(a.indic.tension - 14, 0, 100); a.indic.integracion = clamp(a.indic.integracion + 2, 0, 100); return 'Los alcaldes se sienten escuchados'; } },
        { t: 'Bajar la sobretasa un punto', fn(E, ev) { const a = A(E, ev); a.sobretasa = Math.max(0, a.sobretasa - 1); a.indic.tension = clamp(a.indic.tension - 8, 0, 100); return 'Baja la presión, también el recaudo'; } },
        { t: 'Mantener la línea: el núcleo paga la mayor parte', fn(E, ev) { const a = A(E, ev); a.indic.tension = clamp(a.indic.tension + 6, 0, 100); a.indic.legit = clamp(a.indic.legit - 4, 0, 100); return 'Mantienes el control, pero la legitimidad del área se resiente'; } }
      ] }
  );
})(window.CURUL);
