/* Finanzas del partido: la caja (`pa.finanzas`, millones de COP) recibe la financiación estatal y los
   aportes de la militancia, paga la operación, y ahora también aportes propios del jugador y grandes
   recaudos. Un partido con caja fuerte tiene mejor maquinaria (`estructuraEf`) y puede pasarle plata
   a la campaña de su candidato; uno quebrado pierde terreno. Los recaudos grandes dejan compromisos
   con los donantes que luego cobran, y el dinero irregular deja un rastro que puede estallar. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TIPOS = {
    cena: { n: 'Cena de gala', icono: '🍽', costo: 1, enfria: 6, desc: 'Un evento con tus contactos: poca plata, cero riesgo.',
      base: (J, peso) => 20 + J.redes * 3 + J.reconocimiento * 0.9 },
    aportes: { n: 'Campaña de aportes ciudadanos', icono: '📱', costo: 1, enfria: 8, desc: 'Muchos aportes pequeños por redes: poca plata, pero suma militantes.',
      base: (J, peso) => 10 + J.redes * 4 + J.reconocimiento * 0.5, militantes: [150, 600] },
    donantes: { n: 'Gran ronda de donantes', icono: '🤝', costo: 2, enfria: 16, desc: 'Empresarios y simpatizantes con billetera: buena plata, y quedan esperando algo.',
      base: (J, peso) => 80 + J.redes * 8 + J.reconocimiento * 2 + peso * 1.5, compromisos: 1 },
    gremios: { n: 'Fondos de los gremios', icono: '🏭', costo: 2, enfria: 26, desc: 'El gran recaudo: mucha plata, pero los gremios cobran con leyes y decisiones.',
      base: (J, peso) => 220 + J.reconocimiento * 3 + peso * 4, compromisos: 2, minPeso: 30 },
    irregular: { n: 'Dinero por fuera de la ley', icono: '🕵', costo: 1, enfria: 12, desc: 'Contratistas y testaferros: mucha plata rápido, con riesgo judicial y de escándalo.',
      base: (J, peso) => 150 + J.redes * 10 + peso * 2, irregular: true }
  };
  const DONACIONES = [10, 50, 100, 250, 500, 1000];
  const TOPE_ANUAL = 1000;   // tope legal de aportes de una persona natural por año

  const F = {
    TIPOS, DONACIONES, TOPE_ANUAL,
    asegurar(pa) { if (!pa.fondos) pa.fondos = { ult: {}, compromisos: 0, irregular: 0, irregularJ: false, donado: { anio: 0, monto: 0 }, aportesJ: 0 }; return pa.fondos; },
    /* Bonus (o castigo) a la maquinaria por caja: ±3-6 puntos de estructura frente a lo que le corresponde por su tamaño. */
    estructuraEf(pa) { return pa.estructura + U.clamp(((pa.finanzas || 0) / Math.max(300, pa.popularidad * 1200) - 1) * 0.05, -0.03, 0.06); },
    pesoJ(E) { return C.Partidos.peso(E, E.politicos.J).nac; },
    factorEstado(E) { const v = E.constitucion ? C.Constitucion.valor(E, 'financiacionCampanas') : 'privada'; return v === 'publica' ? 1.8 : v === 'mixta' ? 1.3 : 1; },
    esMiembro(E) { const pa = E.partidos[E.jugador.partido]; return pa && !pa.especial ? pa : null; },
    donadoEsteAnio(pa) { const f = F.asegurar(pa); return f.donado.anio === U.anio() ? f.donado.monto : 0; },
    tope(E, pa, tipo) { return F.TIPOS[tipo]; },

    turno(E) {
      for (const pa of Object.values(E.partidos)) {
        if (pa.especial || pa.futuro || pa.finanzas == null) continue;
        const f = F.asegurar(pa);
        // Financiación estatal y aportes de la militancia frente a la operación del partido.
        pa.finanzas = Math.max(0, pa.finanzas + 6 * F.factorEstado(E) * pa.popularidad + 0.00002 * (pa.militantes || 0) - 5 - pa.finanzas * 0.006);
        if (f.compromisos > 0 && U.chance(0.02 * f.compromisos)) F.cobranDonantes(E, pa);
        if (f.irregular > 0) {
          if (U.chance(Math.min(0.02, 0.00004 * f.irregular))) F.escandalo(E, pa);
          f.irregular = f.irregular < 5 ? 0 : f.irregular * 0.985;
        }
      }
    },
    cobranDonantes(E, pa) {
      const f = F.asegurar(pa); f.compromisos--;
      const esJ = pa.lider === 'J' || E.jugador.partido === pa.id;
      C.Medios.noticia(E, { tipo: 'politica', titular: `Los donantes cobran: ${pa.sigla} bajo presión por el favor a sus aportantes`, tono: -1, importante: esJ, jugador: esJ });
      pa.cohesion = U.clamp(pa.cohesion - 1.5, 0, 100);
      if (esJ) { E.jugador.rep.honestidad = U.clamp(E.jugador.rep.honestidad - 2, 0, 100); E.jugador.rep.transparencia = U.clamp(E.jugador.rep.transparencia - 1, 0, 100); }
    },
    escandalo(E, pa) {
      const f = F.asegurar(pa), esJ = f.irregularJ && E.jugador.partido === pa.id;
      pa.popularidad = Math.max(0.5, pa.popularidad - U.rf(0.5, 1.5)); pa.finanzas *= 0.85; F.asegurar(pa).irregular *= 0.5;
      E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.6;
      C.Medios.noticia(E, { tipo: 'politica', titular: `Escándalo de financiación en ${pa.nombre}: se investigan aportes por fuera de los topes legales`, tono: -1, importante: true, jugador: esJ });
      if (esJ) { E.jugador.riesgoJudicial = U.clamp((E.jugador.riesgoJudicial || 0) + U.rf(6, 12), 0, 100); E.jugador.rep.honestidad = U.clamp(E.jugador.rep.honestidad - 6, 0, 100); f.irregularJ = false; }
    },

    registrarAcciones() {
      const A = C.Acciones;
      const miembro = E => F.esMiembro(E) ? true : 'Necesitas pertenecer a un partido';
      A.registrar({ id: 'donarAlPartido', nombre: 'Donar al partido', icono: '🎁', grupo: 'partidos', costo: 1, disponible: miembro,
        ejecutar(E, a) {
          const pa = F.esMiembro(E), J = E.jugador, m = +a.monto;
          if (!DONACIONES.includes(m)) return { ok: false, msg: 'Elige el monto' };
          if (J.patrimonio < m) return { ok: false, msg: `No tienes ${U.cop(m)} en efectivo` };
          const resta = TOPE_ANUAL - F.donadoEsteAnio(pa);
          if (m > resta) return { ok: false, msg: `La ley limita tus aportes a ${U.cop(TOPE_ANUAL)} por año: te quedan ${U.cop(Math.max(0, resta))}` };
          const f = F.asegurar(pa);
          J.patrimonio -= m; pa.finanzas += m; f.aportesJ += m; f.donado = { anio: U.anio(), monto: F.donadoEsteAnio(pa) + m };
          pa.relJ = U.clamp((pa.relJ || 0) + Math.min(8, m / 40), -100, 100);
          return { ok: true, msg: `Donas ${U.cop(m)} a ${pa.sigla}: la dirección lo agradece (relación +${Math.round(Math.min(8, m / 40))})` };
        } });
      A.registrar({ id: 'recaudarParaPartido', nombre: 'Recaudar para el partido', icono: '💰', grupo: 'partidos', costo: 2, disponible: miembro,
        ejecutar(E, a) {
          const t = TIPOS[a.tipo]; if (!t) return { ok: false, msg: 'Elige el tipo de recaudo' };
          const pa = F.esMiembro(E), J = E.jugador, f = F.asegurar(pa), peso = F.pesoJ(E);
          if (t.minPeso && peso < t.minPeso) return { ok: false, msg: 'Los gremios sólo le abren la billetera a alguien con más peso en el partido' };
          const u = f.ult[a.tipo]; if (u != null && E.fecha.t - u < t.enfria) return { ok: false, msg: `Debes esperar ${t.enfria - (E.fecha.t - u)} semanas para repetir este recaudo` };
          const dir = pa.lider === 'J';
          const monto = Math.round(t.base(J, peso) * U.rf(0.75, 1.3) * (dir ? 1.25 : 1) * (1 + pa.popularidad / 10));
          pa.finanzas += monto; f.ult[a.tipo] = E.fecha.t;
          if (t.militantes) pa.militantes = (pa.militantes || 0) + U.ri(t.militantes[0], t.militantes[1]);
          if (t.compromisos) f.compromisos += t.compromisos;
          if (t.irregular) { f.irregular += monto; f.irregularJ = true; J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + U.rf(3, 6), 0, 100); E.opinion.corrupcionAcum = (E.opinion.corrupcionAcum || 0) + 0.4; J.rep.transparencia = U.clamp(J.rep.transparencia - U.rf(1, 3), 0, 100); }
          C.Opinion.subirRec(E, 0.3);
          pa.relJ = U.clamp((pa.relJ || 0) + Math.min(6, monto / 60), -100, 100);
          return { ok: true, msg: `${t.n}: ${U.cop(monto)} para la caja de ${pa.sigla}${t.compromisos ? ' (quedan compromisos con los donantes)' : t.irregular ? ' (sin factura: deja rastro)' : ''}` };
        } });
      A.registrar({ id: 'girarACampana', nombre: 'Girar a mi campaña', icono: '➡', grupo: 'partidos', costo: 1,
        disponible(E) {
          const pa = F.esMiembro(E); if (!pa) return 'Necesitas pertenecer a un partido';
          if (!E.elecciones.campana) return 'No tienes una campaña en marcha';
          return pa.lider === 'J' || pa.relJ >= 40 ? true : 'La dirección sólo gira a campañas de quien tiene su confianza (relación ≥ 40) o de su director';
        },
        ejecutar(E, a) {
          const pa = F.esMiembro(E), cam = E.elecciones.campana, m = +a.monto;
          if (!cam || cam.partido !== pa.id && cam.partido !== E.jugador.partido) return { ok: false, msg: 'Tu campaña no es por este partido' };
          if (!DONACIONES.includes(m)) return { ok: false, msg: 'Elige el monto' };
          if (pa.finanzas < m) return { ok: false, msg: `La caja del partido sólo tiene ${U.cop(pa.finanzas)}` };
          const cabe = Math.max(0, cam.tope - cam.recaudado); const real = Math.min(m, cabe);
          if (real <= 0) return { ok: false, msg: 'Tu campaña ya alcanzó el tope legal de gastos' };
          pa.finanzas -= real; cam.recaudado += real; cam.caja += real;
          return { ok: true, msg: `El partido gira ${U.cop(real)} a tu campaña${real < m ? ' (hasta el tope legal)' : ''}` };
        } });
    }
  };
  C.FinPartido = F;
  C.Tiempo.registrar('finanzaspartido', F, 71);
  F.registrarAcciones();
})(window.CURUL);
