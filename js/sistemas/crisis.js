/* Crisis y escándalos con decisiones. Cuando el jugador se ve envuelto en un escándalo —porque se abre
   una investigación, estalla un caso de financiación, lo descubren en una operación sucia o su
   patrimonio no cuadra— se dispara un evento con opciones (negar, culpar a un colaborador, pedir
   perdón, contraatacar o callar) cuyo resultado depende de su honestidad, carisma y redes. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TEMAS = [
    { t: 'Aparecen cuentas y pagos que no cuadran', x: 'Una filtración muestra pagos a tu nombre y a empresas de tu círculo cercano que nadie te había preguntado.' },
    { t: 'Sale a la luz un audio comprometedor', x: 'Circula una grabación tuya que, sacada de contexto, suena a acuerdo bajo la mesa.' },
    { t: 'Un exsocio te acusa en público', x: 'Un antiguo socio da una entrevista incendiaria sobre tus negocios y tus campañas.' },
    { t: 'Investigación periodística sobre tu patrimonio', x: 'Un medio publica un reportaje de tres páginas sobre cómo creció tu patrimonio.' },
    { t: 'Polémica por un familiar cercano', x: 'Un familiar tuyo aparece contratado por una entidad que depende de tu cargo.' }
  ];

  const K = {
    escandalo(E, o) {
      const J = E.jugador; if (E.meta.presim) return null;
      const pl = C.Eventos.plantilla('escandaloJ'), tema = o && o.titulo ? o : U.pick(TEMAS);
      const ctx = { vars: { titulo: tema.titulo || tema.t, texto: tema.texto || tema.x }, grav: o && o.grav || 1 };
      J.escandalos.push({ t: E.fecha.t, titulo: ctx.vars.titulo, respuesta: null });
      E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.4 * ctx.grav;
      return C.Eventos.disparar(E, pl, ctx);
    },
    turno(E) {
      const J = E.jugador; if (E.meta.presim) return;
      const riesgo = (J.riesgoJudicial || 0) + Math.max(0, C.Propiedades ? C.Propiedades.riesgoPatrimonial(E) * 60 : 0);
      if (riesgo > 18 && (E.eventos.historial || []).slice(0, 10).every(h => h.plantilla !== 'escandaloJ') && U.chance(Math.min(0.02, riesgo / 6000))) {
        K.escandalo(E, { grav: riesgo > 60 ? 3 : riesgo > 35 ? 2 : 1 });
      }
    }
  };
  C.Crisis = K;
  C.Tiempo.registrar('crisis', K, 79);
})(window.CURUL);
