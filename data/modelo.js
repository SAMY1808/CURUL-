/* Modelo económico (Fase 41): sectores con propiedad estatal, medidas radicales y los eventos que desencadenan. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function () {
  /* estatal0: % de propiedad pública inicial · valor: billones que vale el sector · K: peso en la economía · sens: sensibilidad de los inversionistas */
  CURUL.DATA.modelo = {
    SECTORES: {
      banca: { n: 'Banca y sistema financiero', icono: '🏦', estatal0: 10, valor: 6, K: 2.2, sens: 1.2, actor: ['Banqueros y grupo financiero', '🏦', 76], pod: 'banca' },
      energia: { n: 'Energía y servicios públicos', icono: '⚡', estatal0: 45, valor: 8, K: 1.8, sens: 0.8, actor: ['Sindicatos y empresas de energía', '⚡', 56], pod: null },
      petroleo: { n: 'Petróleo y gas', icono: '🛢', estatal0: 88, valor: 10, K: 2.0, sens: 1.0, actor: ['Petroleras y sindicato del sector', '🛢', 62], pod: null },
      telecom: { n: 'Telecomunicaciones', icono: '📡', estatal0: 12, valor: 3, K: 1.0, sens: 0.5, actor: ['Operadores de telecomunicaciones', '📡', 58], pod: null },
      salud: { n: 'Salud (EPS y clínicas)', icono: '🏥', estatal0: 25, valor: 4, K: 1.4, sens: 0.5, actor: ['EPS y gremio médico', '🏥', 55], pod: null },
      pensiones: { n: 'Fondos de pensiones', icono: '👴', estatal0: 30, valor: 5, K: 1.2, sens: 0.9, actor: ['Administradoras de fondos', '👴', 64], pod: 'banca' },
      mineria: { n: 'Minería', icono: '⛏', estatal0: 15, valor: 3, K: 1.2, sens: 0.7, actor: ['Gremio minero', '⛏', 60], pod: null },
      tierras: { n: 'Tierras y agroindustria', icono: '🌾', estatal0: 5, valor: 4, K: 1.5, sens: 0.9, actor: ['Gremios del campo y terratenientes', '🌾', 66], pod: 'maquinas' },
      transporte: { n: 'Transporte y logística', icono: '🚛', estatal0: 25, valor: 3, K: 0.9, sens: 0.4, actor: ['Concesionarios y transportadores', '🚛', 55], pod: null },
      comercioExt: { n: 'Comercio exterior', icono: '🚢', estatal0: 5, valor: 2, K: 1.0, sens: 0.6, actor: ['Importadores y exportadores', '🚢', 55], pod: null }
    },
    ESPECIALES: {
      controlCambio: { n: 'Control cambiario (dólar oficial)', icono: '💱', tipo: 'control', actor: ['Exportadores y banca', '💱', 70], txt: 'Fija el dólar y restringe su compra. Frena la fuga… y crea un mercado paralelo.', eco: -50 },
      liberarCambio: { n: 'Liberar el mercado cambiario', icono: '🔓', tipo: 'control', actor: ['Exportadores y banca', '💱', 70], txt: 'Elimina los controles: el dólar paralelo desaparece y vuelve la confianza.', eco: 50 },
      controlPrecios: { n: 'Control de precios', icono: '🏷', tipo: 'control', actor: ['Comerciantes y productores', '🏷', 60], txt: 'Congela los precios de la canasta. Frena la inflación hoy y genera escasez mañana.', eco: -55 },
      liberarPrecios: { n: 'Liberar los precios', icono: '📈', tipo: 'control', actor: ['Comerciantes y productores', '🏷', 60], txt: 'Suelta los precios: sube la inflación al inicio, vuelve el abastecimiento.', eco: 55 },
      dolarizar: { n: 'Dolarizar la economía', icono: '💵', tipo: 'especial', actor: ['Banca y Banco de la República', '💵', 74], txt: 'Mata la inflación y el riesgo cambiario… a cambio de la política monetaria. Casi irreversible.', eco: 60 },
      moratoria: { n: 'Declarar una moratoria de la deuda', icono: '🧨', tipo: 'especial', actor: ['Acreedores y banca', '🧨', 72], txt: 'Alivia la deuda de golpe, pero te cierra los mercados y atrae sanciones.', eco: -65 },
      terapia: { n: 'Terapia de choque neoliberal', icono: '💊', tipo: 'especial', actor: ['Sindicatos y gremios', '💊', 62], txt: 'Austeridad y apertura inmediatas: dolor hoy (empleo, pobreza), estabilidad mañana.', eco: 75 },
      privatizarTodo: { n: 'Privatizar todo lo posible', icono: '🏷', tipo: 'masiva', meta: 8, actor: ['Sindicatos y trabajadores públicos', '✊', 62], txt: 'Vende empresas y servicios públicos en todos los sectores, gradualmente.', eco: 80 },
      nacionalizarClave: { n: 'Nacionalizar los sectores estratégicos', icono: '🏴', tipo: 'masiva', meta: 85, sectores: ['banca', 'energia', 'petroleo', 'mineria', 'telecom'], actor: ['Gremios y banca', '🏴', 78], txt: 'Banca, energía, petróleo, minería y telecomunicaciones al Estado, gradualmente: la revolución.', eco: -80 }
    },
    EVENTOS: []
  };
  const ef = o => E => CURUL.Pais.ef(E, o);
  const ev = (id, icono, titulo, texto, ops, extra) => Object.assign({ id, tipo: 'modelo', icono, alcance: 'jugador', sistema: true, modelo: true, peso: 1, titulo, texto, opciones: ops.map(([t, o]) => ({ t, fn: typeof o === 'function' ? o : ef(o) })) }, extra || {});
  CURUL.DATA.modelo.EVENTOS = [
    ev('mo_fuga', '✈', 'Fuga de capitales', 'Empresarios sacan su plata del país a toda prisa. Los bancos reportan retiros récord.', [['Imponer controles de capital', { confianza: -1, aprob: 0.3, rec: 0.5 }], ['Ofrecer garantías a los inversionistas', { confianza: 2, rec: 0 }], ['Culpar a «los traidores a la patria»', { rec: 2, confianza: -2, seg: { bajos: 2 } }]]),
    ev('mo_escasez', '🛒', 'Colas y estantes vacíos', 'Los supermercados no tienen leche, aceite ni arroz. Las fotos de las colas dan la vuelta al país.', [['Importar de emergencia con dólares de reserva', { confianza: -0.5, aprob: 0.5, rec: 1 }], ['Perseguir a los «acaparadores»', { rec: 1.5, confianza: -1.5, seg: { bajos: 1 } }], ['Liberar los precios', { aprob: -1, confianza: 2, rec: 0 }]]),
    ev('mo_paralelo', '💱', 'Se dispara el dólar paralelo', 'El dólar «de la calle» cuesta el doble del oficial. Los cambistas hacen su agosto.', [['Perseguir el mercado negro', { rec: 1, confianza: -1 }], ['Subir la tasa oficial', { confianza: 1.5, aprob: -0.8 }], ['Ignorarlo: «es un fenómeno marginal»', { confianza: -1.5, rec: -0.5 }]]),
    ev('mo_protesta_priv', '✊', 'Protestas contra las privatizaciones', 'Trabajadores de las empresas en venta salen a las calles y bloquean las sedes.', [['Dialogar y garantizar la estabilidad laboral', { aprob: 0.3, rec: 1, confianza: -0.5 }], ['Seguir adelante sin ceder', { rec: 0.5, confianza: 1.5, seg: { formales: -3, bajos: -2 } }], ['Frenar las ventas por unas semanas', { aprob: 0.8, confianza: -1.5 }]]),
    ev('mo_tarifas', '💡', 'Se disparan las tarifas de servicios', 'Tras la privatización, el agua y la energía suben de precio. Los barrios populares se quejan.', [['Subsidiar a los estratos bajos', { aprob: 0.8, rec: 1, confianza: -0.5 }], ['Regular las tarifas con mano dura', { aprob: 0.5, confianza: -1, rec: 1 }], ['Dejar que el mercado ajuste', { seg: { bajos: -3 }, aprob: -0.8, confianza: 0.5 }]]),
    ev('mo_calificadoras', '📉', 'Las calificadoras rebajan al país', 'Una agencia de riesgo degrada la deuda colombiana por el rumbo económico.', [['Contraatacar: «no necesitamos su aprobación»', { rec: 2, confianza: -2 }], ['Anunciar un plan de ajuste', { confianza: 2, aprob: -0.8 }], ['Pedir tiempo y diálogo con los mercados', { confianza: 0.5 }]]),
    ev('mo_sanciones', '🚫', 'Estados Unidos anuncia sanciones', 'Washington sanciona a funcionarios y empresas ligadas a tus medidas económicas.', [['Denunciar un «bloqueo imperialista»', { rec: 2.5, confianza: -2, seg: { jovenes: 1 } }], ['Negociar un levantamiento gradual', { confianza: 1, rec: 0.5 }], ['Revisar las medidas', { confianza: 2.5, rec: -1, aprob: -0.5 }]]),
    ev('mo_banco', '🏦', 'Quiebra un banco nacionalizado', 'Un banco bajo control estatal pierde la mitad de sus depósitos por mala gestión y corrupción.', [['Rescatarlo con recursos del Estado', { confianza: -0.5, aprob: -1, rec: 0 }], ['Liquidarlo y devolver los depósitos', { confianza: 1, aprob: -0.8, rec: -0.5 }], ['Culpar a la «guerra económica» de la oposición', { rec: 1, honestidad: -1 }]])
  ];
  CURUL.DATA.eventos = (CURUL.DATA.eventos || []).concat(CURUL.DATA.modelo.EVENTOS);
  CURUL.DATA.plantillasProyectos = (CURUL.DATA.plantillasProyectos || []).concat([{ id: 'mod_medida', titulo: 'Medida de política económica', sector: 'hacienda', tipo: 'ordinaria', eco: 0, soc: 0, costo: 0, pop: 0, apoyan: [], opuestos: [], efectos: [], interno: true, gobierno: true }]);
})();
