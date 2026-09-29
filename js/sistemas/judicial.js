/* Sistema judicial: la Fiscalía o la Procuraduría pueden abrir una investigación contra el
   jugador cuando acumula suficiente riesgo (financiación irregular de campañas, mermelada,
   escándalos de patrimonio). Una condena tiene consecuencias reales: pérdida de investidura o,
   en los casos más graves, el fin de la carrera política (reutiliza Familia.finDeCarrera, el
   mismo mecanismo del retiro o el fallecimiento). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const TIPOS = {
    financiacion: 'financiación ilegal de campañas',
    enriquecimiento: 'enriquecimiento ilícito',
    cohecho: 'cohecho y tráfico de influencias'
  };
  const ETAPAS = ['indagación preliminar', 'imputación de cargos', 'juicio'];

  const Jud = {
    TIPOS, ETAPAS,
    turno(E) {
      const J = E.jugador;
      if (J.investigacion) { Jud.avanzar(E); return; }
      const riesgo = J.riesgoJudicial || 0;
      if (riesgo < 12 || !U.chance(U.clamp((riesgo - 10) / 900, 0, 0.05))) return;
      Jud.abrir(E);
    },
    abrir(E) {
      const J = E.jugador, tipo = U.pick(Object.keys(TIPOS));
      J.investigacion = { t: E.fecha.t, tipo, etapa: ETAPAS[0], avance: 0 };
      C.Personaje.anotar(E, `La Fiscalía abre indagación preliminar por ${TIPOS[tipo]}`);
      C.Medios.noticia(E, { tipo: 'judicial', titular: `La Fiscalía abre indagación preliminar contra ${J.nombre} por ${TIPOS[tipo]}`, tono: -1, importante: true, jugador: true });
    },
    avanzar(E) {
      const J = E.jugador, inv = J.investigacion;
      const ritmo = Math.max(0.5, U.rf(2, 5) - (J.defensaJudicial || 0) * 0.3);
      inv.avance = U.clamp(inv.avance + ritmo, 0, 100);
      const idx = Math.min(ETAPAS.length - 1, Math.floor(inv.avance / 34));
      if (ETAPAS[idx] !== inv.etapa) {
        inv.etapa = ETAPAS[idx];
        C.Medios.noticia(E, { tipo: 'judicial', titular: `El caso contra ${J.nombre} por ${TIPOS[inv.tipo]} pasa a ${inv.etapa}`, tono: -1, jugador: true });
      }
      if (inv.avance >= 100) Jud.resolver(E);
    },
    resolver(E) {
      const J = E.jugador, inv = J.investigacion, riesgo = J.riesgoJudicial || 0;
      const probCondena = U.clamp(0.15 + riesgo / 160 - (J.rep.transparencia - 50) / 220, 0.05, 0.85);
      J.investigacion = null; J.defensaJudicial = 0;
      if (!U.chance(probCondena)) {
        J.riesgoJudicial = U.clamp(riesgo * 0.3, 0, 100);
        C.Medios.noticia(E, { tipo: 'judicial', titular: `${J.nombre} resulta absuelto/a en el caso por ${TIPOS[inv.tipo]}`, tono: 1, importante: true, jugador: true });
        C.Opinion.subirRec(E, 1.5);
        return;
      }
      const grave = riesgo > 55 && U.chance(0.4);
      J.riesgoJudicial = 0;
      J.rep.honestidad = U.clamp(J.rep.honestidad - 15, 0, 100);
      J.escandalos.push({ t: E.fecha.t, titulo: `Condena por ${TIPOS[inv.tipo]}`, respuesta: null });
      E.opinion.escandalos += 1.5;
      if (grave) {
        C.Medios.noticia(E, { tipo: 'judicial', titular: `${J.nombre} es condenado/a a prisión por ${TIPOS[inv.tipo]}`, tono: -1, importante: true, jugador: true });
        C.Familia.finDeCarrera(E, 'condena');
      } else {
        C.Medios.noticia(E, { tipo: 'judicial', titular: `${J.nombre} pierde la investidura tras ser condenado/a por ${TIPOS[inv.tipo]}`, tono: -1, importante: true, jugador: true });
        if (C.DATA.cargos[J.cargo].electo) {
          const cargoAntes = J.cargo, depto = J.cargoInfo.depto;
          if (cargoAntes === 'senador' || cargoAntes === 'representante') C.Gobierno.vacante(E, E.politicos.J);
          C.Personaje.dejarCargo(E, 'Pierde la investidura por condena judicial');
          if (cargoAntes === 'presidente') C.Vice.faltaAbsoluta(E, 'investidura');
          if (cargoAntes === 'gobernador' || cargoAntes === 'alcalde') C.Elecciones.vacanteRegional(E, depto, cargoAntes);
        }
      }
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'defensaLegal', nombre: 'Contratar defensa legal', icono: '⚖', grupo: 'personal', costo: 1,
        disponible: E => E.jugador.investigacion ? true : 'No tienes ningún proceso judicial activo',
        ejecutar(E) {
          const J = E.jugador, costo = Math.round(15 + J.patrimonio * 0.01);
          if (J.patrimonio < costo) return { ok: false, msg: `Necesitas al menos ${U.cop(costo)} de patrimonio` };
          J.patrimonio -= costo; J.defensaJudicial = (J.defensaJudicial || 0) + 1;
          return { ok: true, msg: `Contratas un equipo de abogados por ${U.cop(costo)}: el proceso avanzará más lento` };
        } });
    }
  };

  C.Judicial = Jud;
  C.Tiempo.registrar('judicial', Jud, 85);
  Jud.registrarAcciones();
})(window.CURUL);
