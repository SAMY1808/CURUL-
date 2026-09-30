/* Salud y bienestar del político. El bienestar (`J.bienestar`, que ya movían los eventos) cae con la
   carga del cargo, las campañas, los escándalos y los procesos judiciales; la salud física (`J.salud`)
   se resiente con la edad y con el agotamiento. Con poca salud o poco bienestar el jugador rinde menos
   puntos de agenda, y si la salud se desploma pueden venir crisis y, en el extremo, la muerte. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const S = {
    asegurar(J) { if (J.salud == null) J.salud = 85; if (J.bienestar == null) J.bienestar = 60; return J; },
    carga(E) {
      const J = E.jugador, cam = E.elecciones.campana ? 1 : 0, nivel = C.DATA.cargos[J.cargo].nivel || 1;
      return 0.1 * nivel + 0.5 * cam + 0.12 * (E.opinion.escandalos || 0) + (J.investigacion ? 0.4 : 0);
    },
    turno(E) {
      const J = S.asegurar(E.jugador); if (E.meta.presim) return;
      const edad = U.anio() - J.nac, nivel = C.DATA.cargos[J.cargo].nivel || 1, cam = E.elecciones.campana ? 1 : 0;
      const objetivo = U.clamp(78 - 6 * nivel - 15 * cam - 4 * (E.opinion.escandalos || 0) - (J.investigacion ? 8 : 0), 15, 85);
      J.bienestar = U.clamp(J.bienestar + (objetivo - J.bienestar) * 0.04, 0, 100);
      J.salud = U.clamp(J.salud - Math.max(0, edad - 50) * 0.004 - Math.max(0, 50 - J.bienestar) * 0.008 + (J.bienestar > 50 ? 0.03 : 0), 0, 100);
      if (J.salud < 40 && (J.chequeoT == null || E.fecha.t - J.chequeoT > 26) && U.chance(0.004 * (40 - J.salud) / 10)) C.Eventos.disparar(E, C.Eventos.plantilla('saludCrisis'), {});
      if (J.salud < 8 && U.chance(0.01)) C.Familia.finDeCarrera(E, 'fallecimiento');
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'descansarSalud', nombre: 'Descansar unos días', icono: '🛌', grupo: 'personal', costo: 2,
        ejecutar(E) { const J = S.asegurar(E.jugador); J.bienestar = U.clamp(J.bienestar + 14, 0, 100); J.salud = U.clamp(J.salud + 2, 0, 100); C.Opinion.subirRec(E, -0.2); return { ok: true, msg: 'Bajas el ritmo: recuperas energía' }; } });
      A.registrar({ id: 'chequeoMedico', nombre: 'Chequeo médico', icono: '🩺', grupo: 'personal', costo: 1,
        ejecutar(E) {
          const J = S.asegurar(E.jugador); if (J.patrimonio < 20) return { ok: false, msg: `Necesitas ${U.cop(20)}` };
          if (J.chequeoT != null && E.fecha.t - J.chequeoT < 26) return { ok: false, msg: 'Te hiciste un chequeo hace poco' };
          J.patrimonio -= 20; J.chequeoT = E.fecha.t; J.salud = U.clamp(J.salud + 3, 0, 100);
          return { ok: true, msg: `Chequeo completo: salud ${Math.round(J.salud)}/100, bienestar ${Math.round(J.bienestar)}/100` };
        } });
      A.registrar({ id: 'tomarVacaciones', nombre: 'Tomar vacaciones', icono: '🏖', grupo: 'personal', costo: 3,
        ejecutar(E) {
          const J = S.asegurar(E.jugador); if (J.vacacionesT != null && E.fecha.t - J.vacacionesT < 26) return { ok: false, msg: 'Ya te tomaste un descanso largo hace poco' };
          J.vacacionesT = E.fecha.t; J.bienestar = U.clamp(J.bienestar + 30, 0, 100); J.salud = U.clamp(J.salud + 5, 0, 100); C.Opinion.subirRec(E, -0.6);
          return { ok: true, msg: 'Unas vacaciones de verdad: vuelves renovado' };
        } });
    }
  };
  C.Salud = S;
  C.Tiempo.registrar('salud', S, 78);
  S.registrarAcciones();
})(window.CURUL);
