/* Redes sociales: un canal propio, separado de los medios tradicionales — más riesgo (una
   publicación puede desatar una ola de críticas, "cancelación") y más beneficio (alcance directo,
   sin pasar por la línea editorial de nadie) que la pauta o la entrevista de siempre. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const R = {
    init(E) { E.redes = { viralidad: 25, publicaciones: 0, cancelaciones: 0 }; },
    turno(E) {
      E.redes.viralidad = U.clamp(E.redes.viralidad - 1.2, 0, 100);
    },
    publicar(E) {
      const J = E.jugador, R_ = E.redes;
      const habilidad = (J.redes + J.atributos.carisma) / 2;
      const p = U.clamp(0.35 + (habilidad - 50) / 180 + R_.viralidad / 500 - R_.cancelaciones * 0.02, 0.08, 0.85);
      const exito = U.chance(p);
      R_.publicaciones++;
      if (exito) {
        const magnitud = U.rf(2, 3.2) * (1 + R_.viralidad / 120);
        C.Opinion.subirRec(E, magnitud);
        R_.viralidad = U.clamp(R_.viralidad + U.rf(15, 30), 0, 100);
        J.rep.cercania = U.clamp(J.rep.cercania + U.rf(0.5, 1.5), 0, 100);
        C.Medios.noticia(E, { tipo: 'redes', titular: `Se vuelve viral una publicación de ${J.nombre} en redes sociales`, tono: 1, jugador: true });
      } else {
        R_.viralidad = U.clamp(R_.viralidad - U.rf(10, 20), 0, 100);
        R_.cancelaciones++;
        J.credibilidad = U.clamp(J.credibilidad - U.rf(3, 7), 0, 100);
        C.Opinion.subirRec(E, -U.rf(1, 3));
        J.escandalos.push({ t: E.fecha.t, titulo: 'Polémica en redes sociales', respuesta: null });
        C.Medios.noticia(E, { tipo: 'redes', titular: `${J.nombre} enfrenta una ola de críticas ("cancelación") en redes sociales`, tono: -1, importante: true, jugador: true });
      }
      return { exito };
    },
    registrarAcciones() {
      C.Acciones.registrar({ id: 'publicarRedes', nombre: 'Publicar en redes sociales', icono: '📱', grupo: 'medios', costo: 1,
        ejecutar(E) {
          const r = R.publicar(E);
          return { ok: true, msg: r.exito ? 'La publicación se viraliza: sube tu reconocimiento' : 'La publicación te sale mal: una ola de críticas te pasa factura', exito: r.exito };
        } });
    }
  };

  C.Redes = R;
  C.Tiempo.registrar('redes', R, 21);
  R.registrarAcciones();
})(window.CURUL);
