/* Datos estilizados de comercio exterior. No son cifras oficiales: son órdenes de magnitud
   realistas para que cada decisión (arancel, TLC, Mercosur) tenga ganadores y perdedores creíbles. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};

/* Sectores del comercio. expPeso/impPeso: participación en exportaciones e importaciones
   · mfn: arancel promedio que Colombia aplica a terceros (%) · aec: Arancel Externo Común del
   Mercosur (%) · elasImp/elasExp: cuánto reacciona el volumen al precio (aranceles) · actor:
   quién sufre o gana en la calle (ver Movilización) · dom: sector doméstico que compite con importaciones. */
CURUL.DATA.sectoresComercio = [
  { id: 'cafe',      nombre: 'Café',                         icono: '☕', expPeso: 0.07, impPeso: 0.00, mfn: 5,  aec: 8,  elasImp: 1.0, elasExp: 0.8, actor: 'agrario', dom: false },
  { id: 'energia',   nombre: 'Petróleo, carbón y minería',   icono: '🛢', expPeso: 0.52, impPeso: 0.06, mfn: 3,  aec: 4,  elasImp: 1.0, elasExp: 0.3, actor: null,      dom: false },
  { id: 'agroexp',   nombre: 'Flores, banano y palma',       icono: '🌺', expPeso: 0.10, impPeso: 0.02, mfn: 8,  aec: 10, elasImp: 1.2, elasExp: 1.6, actor: 'agrario', dom: false },
  { id: 'agrosens',  nombre: 'Agro sensible (arroz, lácteos, carne, maíz)', icono: '🌾', expPeso: 0.03, impPeso: 0.12, mfn: 15, aec: 14, elasImp: 2.6, elasExp: 1.0, actor: 'agrario', dom: true },
  { id: 'industria', nombre: 'Industria y manufactura',      icono: '🏭', expPeso: 0.17, impPeso: 0.58, mfn: 8,  aec: 14, elasImp: 2.2, elasExp: 1.8, actor: 'gremios', dom: true },
  { id: 'textil',    nombre: 'Textiles y confecciones',      icono: '🧵', expPeso: 0.03, impPeso: 0.09, mfn: 15, aec: 18, elasImp: 2.8, elasExp: 1.6, actor: 'cut',     dom: true },
  /* En servicios no hay arancel: `mfn` son las barreras regulatorias equivalentes (%), que sólo se
     reducen por acuerdo comercial (no se fijan a mano ni las cambia el Mercosur). */
  { id: 'servicios', nombre: 'Servicios (BPO, turismo, TIC)', icono: '💼', expPeso: 0.08, impPeso: 0.13, mfn: 12, aec: 12, elasImp: 1.2, elasExp: 1.4, actor: null,      dom: false, sinArancel: true }
];

/* Socios comerciales. tipo agrupa las afinidades sectoriales · expShare/impShare: participación en
   las exportaciones/importaciones de Colombia (el resto va al bloque "Resto del mundo") · paises:
   países de la Diplomacia que representan al socio · arancel: arancel promedio que ese socio le
   aplica a Colombia sin acuerdo (%) · mercosur: si es miembro del Mercosur. */
CURUL.DATA.sociosComercio = [
  { id: 'USA', nombre: 'Estados Unidos',  tipo: 'desarrollado', expShare: 0.28, impShare: 0.25, paises: ['USA'], arancel: 4 },
  { id: 'CHN', nombre: 'China',           tipo: 'asia',         expShare: 0.10, impShare: 0.23, paises: ['CHN'], arancel: 9 },
  { id: 'UE',  nombre: 'Unión Europea',   tipo: 'desarrollado', expShare: 0.13, impShare: 0.11, paises: ['DEU', 'FRA', 'ESP'], arancel: 6 },
  { id: 'BRA', nombre: 'Brasil',          tipo: 'mercosur',     expShare: 0.040, impShare: 0.070, paises: ['BRA'], arancel: 14, mercosur: true },
  { id: 'ARG', nombre: 'Argentina',       tipo: 'mercosur',     expShare: 0.008, impShare: 0.030, paises: ['ARG'], arancel: 14, mercosur: true },
  { id: 'URY', nombre: 'Uruguay',         tipo: 'mercosur',     expShare: 0.004, impShare: 0.008, paises: ['URY'], arancel: 12, mercosur: true },
  { id: 'PRY', nombre: 'Paraguay',        tipo: 'mercosur',     expShare: 0.002, impShare: 0.003, paises: ['PRY'], arancel: 12, mercosur: true },
  { id: 'MEX', nombre: 'México',          tipo: 'ap',           expShare: 0.050, impShare: 0.090, paises: ['MEX'], arancel: 7 },
  { id: 'CHL', nombre: 'Chile',           tipo: 'ap',           expShare: 0.040, impShare: 0.030, paises: ['CHL'], arancel: 6 },
  { id: 'PER', nombre: 'Perú',            tipo: 'can',          expShare: 0.050, impShare: 0.025, paises: ['PER'], arancel: 8 },
  { id: 'ECU', nombre: 'Ecuador',         tipo: 'can',          expShare: 0.070, impShare: 0.020, paises: ['ECU'], arancel: 10 },
  { id: 'VEN', nombre: 'Venezuela',       tipo: 'vecino',       expShare: 0.010, impShare: 0.001, paises: ['VEN'], arancel: 12 },
  { id: 'ROW', nombre: 'Resto del mundo', tipo: 'resto',        expShare: null,  impShare: null,  paises: ['KOR', 'CAN', 'ISR'], arancel: 8 }
];

/* Cuánto le sirve a cada sector vender/comprar a cada tipo de socio (peso relativo). */
CURUL.DATA.afinidadExp = {
  cafe:      { desarrollado: 1.5, asia: .8,  mercosur: .3, ap: .2, can: .1, vecino: .2, resto: 1.2 },
  energia:   { desarrollado: 1.4, asia: 1.5, mercosur: .4, ap: .7, can: .6, vecino: .5, resto: 1.2 },
  agroexp:   { desarrollado: 1.7, asia: .4,  mercosur: .2, ap: .4, can: .6, vecino: .3, resto: 1.0 },
  agrosens:  { desarrollado: .3,  asia: .2,  mercosur: .2, ap: .8, can: 2.0, vecino: 1.5, resto: .5 },
  industria: { desarrollado: .6,  asia: .3,  mercosur: 1.4, ap: 1.2, can: 1.8, vecino: 1.4, resto: .5 },
  textil:    { desarrollado: 1.6, asia: .2,  mercosur: .6, ap: 1.0, can: 1.2, vecino: .8, resto: .6 },
  servicios: { desarrollado: 1.5, asia: .3,  mercosur: .5, ap: 1.0, can: .8, vecino: .5, resto: .8 }
};
CURUL.DATA.afinidadImp = {
  cafe:      { desarrollado: 1, asia: 1, mercosur: 1, ap: 1, can: 1, vecino: 1, resto: 1 },
  energia:   { desarrollado: 1.6, asia: .2, mercosur: .3, ap: .6, can: .4, vecino: 1.0, resto: .5 },
  agroexp:   { desarrollado: 1.0, asia: .5, mercosur: 1.2, ap: 1.0, can: 1.0, vecino: .5, resto: .8 },
  agrosens:  { desarrollado: 2.0, asia: .3, mercosur: 2.6, ap: .4, can: .6, vecino: .2, resto: .6 },
  industria: { desarrollado: 1.3, asia: 2.2, mercosur: 1.5, ap: 1.2, can: .5, vecino: .2, resto: 1.4 },
  textil:    { desarrollado: .4,  asia: 3.0, mercosur: .4, ap: .8, can: .6, vecino: .1, resto: .8 },
  servicios: { desarrollado: 1.4, asia: .3, mercosur: .4, ap: .8, can: .3, vecino: .1, resto: .9 }
};

/* Acuerdos comerciales reales de Colombia, con su año de entrada en vigor, para arrancar una partida
   con el mapa comercial que ya existía en esa fecha. red: cuánto baja Colombia sus aranceles a ese
   socio · acc: cuánto baja el socio los suyos a los productos colombianos (0-1 por sector, al
   completar el cronograma de desgravación de `anios`). */
CURUL.DATA.acuerdosHistoricos = [
  { socio: 'PER', desde: 1993, tipo: 'can',  anios: 5,  red: { _: 1 }, acc: { _: 1 }, nombre: 'Comunidad Andina (zona de libre comercio)' },
  { socio: 'ECU', desde: 1993, tipo: 'can',  anios: 5,  red: { _: 1 }, acc: { _: 1 }, nombre: 'Comunidad Andina (zona de libre comercio)' },
  { socio: 'VEN', desde: 1993, hasta: 2006, tipo: 'can', anios: 5, red: { _: 1 }, acc: { _: 1 }, nombre: 'Comunidad Andina (zona de libre comercio)' },
  { socio: 'MEX', desde: 1995, tipo: 'tlc',  anios: 10, red: { industria: 1, textil: .8, agroexp: .8, agrosens: .3, energia: 1, cafe: 1, servicios: .4 }, acc: { industria: 1, textil: .9, agroexp: 1, agrosens: .4, energia: 1, cafe: 1, servicios: .4 }, nombre: 'TLC G3 / Alianza del Pacífico' },
  { socio: 'CHL', desde: 2009, tipo: 'tlc',  anios: 10, red: { industria: 1, textil: 1, agroexp: 1, agrosens: .6, energia: 1, cafe: 1, servicios: .6 }, acc: { industria: 1, textil: 1, agroexp: 1, agrosens: .6, energia: 1, cafe: 1, servicios: .6 }, nombre: 'TLC Colombia–Chile' },
  { socio: 'ARG', desde: 2005, tipo: 'aap',  anios: 12, red: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, acc: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, nombre: 'ACE 59 Comunidad Andina–Mercosur' },
  { socio: 'BRA', desde: 2005, tipo: 'aap',  anios: 12, red: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, acc: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, nombre: 'ACE 59 Comunidad Andina–Mercosur' },
  { socio: 'URY', desde: 2005, tipo: 'aap',  anios: 12, red: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, acc: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, nombre: 'ACE 59 Comunidad Andina–Mercosur' },
  { socio: 'PRY', desde: 2005, tipo: 'aap',  anios: 12, red: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, acc: { industria: .4, textil: .3, agroexp: .3, agrosens: .1, energia: .5, cafe: .5, servicios: 0 }, nombre: 'ACE 59 Comunidad Andina–Mercosur' },
  { socio: 'ROW', desde: 2011, tipo: 'tlc',  anios: 10, red: { industria: .7, textil: .6, agroexp: .6, agrosens: .3, energia: 1, cafe: 1, servicios: .4 }, acc: { industria: .8, textil: .8, agroexp: .8, agrosens: .3, energia: 1, cafe: 1, servicios: .5 }, nombre: 'TLC con Canadá, EFTA y Corea' },
  { socio: 'USA', desde: 2012, tipo: 'tlc',  anios: 15, red: { industria: 1, textil: .8, agroexp: .8, agrosens: .7, energia: 1, cafe: 1, servicios: .6 }, acc: { industria: 1, textil: 1, agroexp: 1, agrosens: .5, energia: 1, cafe: 1, servicios: .6 }, nombre: 'TLC Colombia–Estados Unidos' },
  { socio: 'UE',  desde: 2013, tipo: 'tlc',  anios: 10, red: { industria: 1, textil: .8, agroexp: .8, agrosens: .6, energia: 1, cafe: 1, servicios: .6 }, acc: { industria: 1, textil: 1, agroexp: .95, agrosens: .5, energia: 1, cafe: 1, servicios: .6 }, nombre: 'Acuerdo comercial Colombia–Unión Europea' }
];

/* Capítulos de una negociación de TLC. La postura (0 defensiva · 1 moderada · 2 ambiciosa) fija
   cuánto abre Colombia y qué consigue a cambio. cuesta: quién se enoja si se abre más. */
CURUL.DATA.capitulosTLC = [
  { id: 'bienes',    nombre: 'Acceso a mercados: industria y confecciones', icono: '🏭', tocaA: ['gremios', 'cut'],
    nota: 'Desgravación arancelaria industrial. Abrir más atrae inversión y baja precios, pero presiona a la industria y al empleo formal.' },
  { id: 'agro',      nombre: 'Agricultura y productos sensibles', icono: '🌾', tocaA: ['agrario'],
    nota: 'Aranceles, contingentes y salvaguardias del campo. Es el capítulo que más incendia el agro.' },
  { id: 'servicios', nombre: 'Servicios e inversión', icono: '💼', tocaA: [],
    nota: 'Apertura de servicios y protección al inversionista. Suma inversión y empleo calificado.' },
  { id: 'pi',        nombre: 'Propiedad intelectual y medicamentos', icono: '💊', tocaA: [],
    nota: 'Patentes y datos de prueba. Los socios ricos piden más; encarece los medicamentos y golpea la aprobación en salud.' },
  { id: 'laboral',   nombre: 'Laboral y ambiental', icono: '🌳', tocaA: ['cut', 'indigena'],
    nota: 'Estándares laborales y ambientales. Calma a la CUT y al movimiento indígena; lo piden sobre todo la UE y Estados Unidos.' },
  { id: 'solucion',  nombre: 'Origen y solución de controversias', icono: '⚖', tocaA: ['indigena', 'cut'],
    nota: 'Reglas de origen y arbitraje inversionista-Estado. Más protección al inversionista, menos soberanía y más riesgo de demandas.' }
];
CURUL.DATA.posturasTLC = ['defensiva', 'moderada', 'ambiciosa'];

/* Lo que espera cada socio en cada capítulo (0 defensiva · 1 moderada · 2 ambiciosa), su dureza al
   negociar (0-1) y cuánto le abre a Colombia según lo que Colombia abra (acc). */
CURUL.DATA.demandasTLC = {
  USA: { dureza: 0.8, acc: 0.85, bienes: 2, agro: 2, servicios: 2, pi: 2, laboral: 1, solucion: 2 },
  UE:  { dureza: 0.7, acc: 0.8,  bienes: 2, agro: 1, servicios: 2, pi: 2, laboral: 2, solucion: 1 },
  CHN: { dureza: 0.6, acc: 0.6,  bienes: 2, agro: 1, servicios: 1, pi: 1, laboral: 0, solucion: 1 },
  MEX: { dureza: 0.4, acc: 0.9,  bienes: 1, agro: 1, servicios: 1, pi: 1, laboral: 1, solucion: 1 },
  CHL: { dureza: 0.3, acc: 0.95, bienes: 1, agro: 1, servicios: 1, pi: 1, laboral: 1, solucion: 1 },
  PER: { dureza: 0.3, acc: 0.95, bienes: 1, agro: 1, servicios: 1, pi: 1, laboral: 1, solucion: 1 },
  ECU: { dureza: 0.3, acc: 0.95, bienes: 1, agro: 1, servicios: 1, pi: 0, laboral: 1, solucion: 0 },
  VEN: { dureza: 0.5, acc: 0.7,  bienes: 1, agro: 1, servicios: 0, pi: 0, laboral: 0, solucion: 0 },
  ROW: { dureza: 0.5, acc: 0.8,  bienes: 1, agro: 1, servicios: 1, pi: 1, laboral: 1, solucion: 1 }
};

/* Mercosur: miembros plenos por época, Arancel Externo Común (por sector, en sectoresComercio.aec)
   y el orden rotativo de la presidencia pro tempore (alfabético, cada semestre). */
CURUL.DATA.mercosur = {
  fundacion: 1991, unionAduanera: 1995, asociadoColombia: 2004,
  miembrosDesde: { ARG: 1991, BRA: 1991, PRY: 1991, URY: 1991, VEN: 2012, BOL: 2024 },
  rotacion: ['ARG', 'BRA', 'PRY', 'URY'],
  /* Postura de cada miembro ante la adhesión de Colombia: cuánto pesa su interés propio. */
  postura: {
    BRA: { nombre: 'Brasil', exige: 'industria', teme: null, dureza: 0.35, nota: 'Quiere el mercado colombiano para su industria' },
    ARG: { nombre: 'Argentina', exige: 'agrosens', teme: 'industria', dureza: 0.55, nota: 'Protege a su industria y es la más proteccionista del bloque' },
    URY: { nombre: 'Uruguay', exige: 'agrosens', teme: null, dureza: 0.35, nota: 'Quiere abrir más el bloque al mundo; teme el peso de los grandes' },
    PRY: { nombre: 'Paraguay', exige: 'agrosens', teme: null, dureza: 0.4, nota: 'Vota con Brasil en lo comercial, pero exige compensaciones' }
  },
  /* Decisiones que el Consejo del Mercado Común puede poner sobre la mesa en cada cumbre. */
  decisiones: [
    { id: 'rebajaAEC', nombre: 'Rebajar el Arancel Externo Común un 10 %', proponen: ['URY', 'PRY'], efecto: { aec: -0.10 }, dificultad: 0.7, quienGana: 'Consumidores e importadores', quienPierde: 'Industria protegida' },
    { id: 'subeAEC', nombre: 'Subir el Arancel Externo Común en bienes industriales', proponen: ['ARG'], efecto: { aecIndustria: 0.08 }, dificultad: 0.6, quienGana: 'Industria de la región', quienPierde: 'Consumidores' },
    { id: 'acuerdoUE', nombre: 'Cerrar el acuerdo Mercosur–Unión Europea', proponen: ['BRA', 'URY'], efecto: { acuerdo: 'UE' }, dificultad: 0.6, quienGana: 'Exportadores agro y de servicios', quienPierde: 'Industria y agro sensible frente a Europa' },
    { id: 'excepcionesAEC', nombre: 'Ampliar la lista nacional de excepciones al AEC', proponen: ['ARG', 'PRY'], efecto: { excepciones: 2 }, dificultad: 0.6, quienGana: 'Sectores sensibles de cada país', quienPierde: 'La coherencia de la unión aduanera' },
    { id: 'flexibilizar', nombre: 'Flexibilizar el bloque para negociar TLC por separado', proponen: ['URY'], efecto: { flexibilizar: true }, dificultad: 0.35, quienGana: 'Los socios que quieren abrirse más', quienPierde: 'Los más proteccionistas' }
  ]
};
