/* Tutorial inicial: guía de siete pasos que se muestra la primera vez (se recuerda en el navegador) y puede
   reabrirse desde la pantalla de Partidas. */
window.CURUL = window.CURUL || {};
(function (C) {
  const LS = 'curul_tutorial_v1';
  const PASOS = [
    ['🧭', 'Bienvenido a CURUL', 'Eres un político colombiano. Empiezas desde abajo —o desde donde tu origen te lleve— y tu meta es construir una carrera: ganar elecciones, aprobar leyes, gobernar y dejar un legado. El tiempo corre por semanas.'],
    ['⏱', 'El tiempo y los puntos de agenda', 'Arriba están los botones «Semana» y «Mes». Cada semana recibes puntos de agenda (◆) que gastas en acciones: cabildear, radicar proyectos, hacer campaña. Si no los usas, se pierden. Las decisiones importantes detienen el reloj.'],
    ['🗺', 'El menú lateral', 'El menú agrupa todo: Poder legislativo (Congreso y Proyectos), Gobierno (Presidencia, decretos, empresas públicas, áreas metropolitanas, riesgo y sociedad, pensiones y salud), Justicia y control, Política y elecciones (debates y red de poder) y Mundo y economía.'],
    ['📜', 'Las leyes', 'Hay más de 250 iniciativas en 18 categorías. Radícalas desde «Proyectos» con el botón «Radicar»: filtra por categoría o busca por nombre. Cada ley pasa por comisiones y plenarias, puede ser objetada, demandada ante la Corte y, una vez sancionada, necesita reglamentación del Gobierno.'],
    ['🗳', 'Elecciones y campañas', 'Cuando se acercan las elecciones puedes inscribirte: organiza eventos, recauda fondos, arma equipo y, si eres candidato a la Presidencia, no faltes a los debates televisados. Tu imagen se mide en encuestas por región y por tema.'],
    ['🦅', 'Gobernar', 'Si llegas al poder, nombras un gabinete, manejas el presupuesto, respondes a crisis y desastres, decides sobre megaproyectos con consulta previa, combates el narcotráfico y, en una crisis grave, puedes declarar estados de excepción… bajo la mirada de la Corte.'],
    ['💾', 'Guardado y logros', 'El juego se guarda solo cada cuatro semanas; puedes exportar tu partida desde «Partidas». En «Logros y biografía» verás tus hitos, tus estadísticas entre partidas y la biografía que tu carrera va escribiendo. ¡Suerte, y que el pueblo te acompañe!']
  ];
  const T = {
    PASOS,
    visto() { try { return navigator.webdriver === true || localStorage.getItem(LS) === '1'; } catch (e) { return true; } },
    marcar() { try { localStorage.setItem(LS, '1'); } catch (e) {} },
    mostrar(i) {
      i = i || 0; const UI = C.UI, p = PASOS[i];
      UI.cerrarModales();
      const ultimo = i === PASOS.length - 1;
      const m = UI.modal({ titulo: p[1], icono: p[0], clase: 'tutorial', sinCerrar: false, alCerrar: () => T.marcar(), cuerpo: `<p style="line-height:1.6;font-size:15px;margin:0">${p[2]}</p><div class="tenue" style="margin-top:14px;font-size:12px">Paso ${i + 1} de ${PASOS.length}</div>`,
        pie: `<button class="btn" id="tu-saltar">Saltar tutorial</button>${i > 0 ? '<button class="btn" id="tu-ant">← Anterior</button>' : ''}<button class="btn prim" id="tu-sig">${ultimo ? '¡A jugar!' : 'Siguiente →'}</button>` });
      const q = id => m.el.querySelector(id);
      q('#tu-saltar').onclick = () => { T.marcar(); m.cerrar(); };
      if (q('#tu-ant')) q('#tu-ant').onclick = () => { T.mostrar(i - 1); };
      q('#tu-sig').onclick = () => { if (ultimo) { T.marcar(); m.cerrar(); } else T.mostrar(i + 1); };
    },
    primeraVez() { if (!T.visto()) setTimeout(() => T.mostrar(0), 400); }
  };
  C.Tutorial = T;
})(window.CURUL);
