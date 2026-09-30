/* Firmas encuestadoras ficticias: cada una tiene su tamaño de muestra habitual, su sesgo de casa
   (sesgoGob: puntos a favor del Gobierno en la aprobación; sesgoEco: puntos a favor de la derecha,
   negativo a favor de la izquierda), su fiabilidad de partida y su precio por encuesta (millones). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};

CURUL.DATA.encuestadoras = [
  { id: 'invamer', nombre: 'Invamer Andino', muestra: 1200, sesgoGob: -0.5, sesgoEco: 0, fiab: 0.80, precio: 25, estilo: 'La más veterana: metódica y sin sesgo evidente.' },
  { id: 'cnc', nombre: 'Centro Nacional de Consultoría Pública', muestra: 1000, sesgoGob: 1.8, sesgoEco: 1, fiab: 0.72, precio: 20, estilo: 'Cercana a las instituciones: suele ser generosa con el Gobierno.' },
  { id: 'datexco', nombre: 'Datexco Sur', muestra: 900, sesgoGob: 0, sesgoEco: 4, fiab: 0.68, precio: 18, estilo: 'Su clientela empresarial se nota: favorece a la derecha.' },
  { id: 'gad', nombre: 'GAD Opinión', muestra: 1500, sesgoGob: -2.2, sesgoEco: -4, fiab: 0.82, precio: 30, estilo: 'Muestras grandes, pero con inclinación crítica hacia el Gobierno y a la izquierda.' },
  { id: 'cifras', nombre: 'Cifras y Conceptos Ltda.', muestra: 700, sesgoGob: 0.5, sesgoEco: 0, fiab: 0.52, precio: 8, estilo: 'Barata y rápida, pero de margen amplio y errática.' },
  { id: 'observatorio', nombre: 'Observatorio Universitario', muestra: 2200, sesgoGob: -0.3, sesgoEco: -1, fiab: 0.90, precio: 45, estilo: 'Rigor académico: la mejor, pero la más cara.' }
];
