/* Democracia directa: temas sobre los que se puede votar. `eco`/`soc` es la orientación de lo que
   pasa si gana el Sí (para que cada partido tome partido según su ideología); `popBase` es su
   popularidad de partida (-30…30); `sal` cuánto moviliza al electorado (participación extra).
   `si`/`no` son los efectos de cada resultado, en el mismo formato de las leyes (v, d, p). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};

CURUL.DATA.participacion = {
  plebiscito: [
    { id: 'paz', nombre: 'Refrendar el acuerdo de paz', eco: -10, soc: -25, popBase: -2, sal: 0.08,
      si: [{ v: 'seguridad', d: 2, p: 'm' }, { v: 'confianza', d: 0.6, p: 'i' }, { v: 'crecimiento', d: 0.1, p: 'l' }],
      no: [{ v: 'seguridad', d: -1.2, p: 'm' }, { v: 'confianza', d: -0.6, p: 'i' }],
      nota: 'Si gana el Sí se afianza la paz; si gana el No, el proceso queda en entredicho.' },
    { id: 'apertura', nombre: 'Respaldar la apertura comercial (TLC y Mercosur)', eco: 35, soc: 0, popBase: -6, sal: 0,
      si: [{ v: 'inversion', d: 0.2, p: 'm' }, { v: 'confianza', d: 0.5, p: 'i' }],
      no: [{ v: 'inversion', d: -0.15, p: 'm' }, { v: 'confianza', d: -0.4, p: 'i' }],
      nota: 'El Sí blinda los tratados ante la Corte; el No congela las negociaciones y la adhesión al Mercosur.' },
    { id: 'justicia', nombre: 'Reformar la justicia', eco: 0, soc: 5, popBase: 8, sal: 0.02,
      si: [{ v: 'confianza', d: 0.6, p: 'i' }, { v: 'seguridad', d: 1, p: 'm' }], no: [{ v: 'confianza', d: -0.3, p: 'i' }],
      nota: 'Una reforma popular pero que los jueces y las altas cortes miran con recelo.' },
    { id: 'tributaria', nombre: 'Aprobar una reforma tributaria progresiva', eco: -40, soc: -5, popBase: -8, sal: 0.03,
      si: [{ v: 'deficit', d: -0.4, p: 'm' }, { v: 'inversion', d: -0.1, p: 'm' }, { v: 'pobreza', d: -0.3, p: 'l' }], no: [{ v: 'deficit', d: 0.2, p: 'm' }],
      nota: 'Más recaudo y menos desigualdad a cambio de algo de inversión.' }
  ],
  consulta: [
    { id: 'fracking', nombre: 'Autorizar el fracturamiento hidráulico (fracking)', eco: 45, soc: 10, popBase: -10, sal: 0.04,
      si: [{ v: 'exportaciones', d: 0.6, p: 'l' }, { v: 'crecimiento', d: 0.15, p: 'm' }, { v: 'deficit', d: -0.1, p: 'm' }], no: [{ v: 'exportaciones', d: -0.1, p: 'l' }],
      nota: 'Más petróleo y divisas a cambio de riesgo ambiental.' },
    { id: 'drogas', nombre: 'Regular el consumo de drogas', eco: 0, soc: -45, popBase: -8, sal: 0.02,
      si: [{ v: 'seguridad', d: 0.8, p: 'm' }, { v: 'salud', d: 0.5, p: 'l' }], no: [], nota: 'Un tema que divide a la sociedad por valores.' },
    { id: 'perpetua', nombre: 'Cadena perpetua para delitos atroces', eco: 0, soc: 45, popBase: 22, sal: 0.05,
      si: [{ v: 'seguridad', d: 0.5, p: 'm' }, { v: 'confianza', d: -0.2, p: 'i' }], no: [], nota: 'Muy popular, pero choca con la Constitución y con la Corte.' },
    { id: 'jornada', nombre: 'Jornada laboral de 40 horas', eco: -35, soc: -10, popBase: 12, sal: 0.03,
      si: [{ v: 'desempleo', d: -0.2, p: 'm' }, { v: 'crecimiento', d: -0.08, p: 'm' }], no: [], nota: 'Los trabajadores la quieren; los gremios advierten sobre los costos.' },
    { id: 'riqueza', nombre: 'Impuesto al patrimonio de los más ricos', eco: -45, soc: -5, popBase: 6, sal: 0.03,
      si: [{ v: 'deficit', d: -0.35, p: 'm' }, { v: 'inversion', d: -0.12, p: 'm' }], no: [], nota: 'Recauda, pero ahuyenta algo de inversión.' }
  ],
  local: [
    { id: 'mineria', nombre: 'Permitir la minería a gran escala en el territorio', eco: 40, soc: 10, popBase: -14, sal: 0.05,
      nota: 'Si gana el Sí sube la economía local y el conflicto ambiental; si gana el No, se frena el proyecto.' },
    { id: 'megaobra', nombre: 'Aprobar el megaproyecto en el territorio', eco: 10, soc: 0, popBase: 6, sal: 0.02,
      nota: 'Si gana el Sí, tu obra bandera avanza más rápido; si gana el No, se cancela.' },
    { id: 'pot', nombre: 'Adoptar el nuevo plan de ordenamiento territorial', eco: 0, soc: 0, popBase: 3, sal: 0,
      nota: 'Si gana el Sí, mejora la infraestructura y el empleo; si gana el No, queda en el aire.' }
  ]
};
