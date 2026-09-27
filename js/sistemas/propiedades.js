/* Propiedades: el patrimonio deja de ser sólo un número — el jugador compra bienes concretos
   (finca, apartamento, local, acciones) que rentan cada semana y suben o bajan de valor con la
   economía. Un patrimonio que crece mucho más rápido de lo que explica el sueldo declarado
   alimenta el riesgo de un escándalo (ver el evento "patrimonioSospechoso" en data/eventos.js). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TIPOS = {
    apto: { n: 'Apartamento en arriendo', icono: '🏢', costoBase: 90, rentaSemanal: 0.0017, beta: 0.5 },
    finca: { n: 'Finca productiva', icono: '🌾', costoBase: 140, rentaSemanal: 0.0015, beta: 0.7 },
    local: { n: 'Local comercial', icono: '🏬', costoBase: 110, rentaSemanal: 0.0019, beta: 0.9 },
    acciones: { n: 'Acciones en bolsa', icono: '📈', costoBase: 40, rentaSemanal: 0.0009, beta: 1.6 }
  };

  const Prop = {
    TIPOS,
    bienes(E) { return E.jugador.bienes || (E.jugador.bienes = []); },
    valorTotal(E) { return U.suma(Prop.bienes(E).map(b => b.valor)); },
    /* Cuántas veces su salario anual declarado representa todo su patrimonio (líquido + bienes):
       una señal simple de que su fortuna creció más rápido de lo que su sueldo explica. */
    riesgoPatrimonial(E) {
      const J = E.jugador;
      const total = J.patrimonio + Prop.valorTotal(E);
      const ingresoAnual = Math.max(6, J.ingresos) * 12;
      const veces = total / ingresoAnual;
      return U.clamp((veces - 14) / 55, 0, 0.6);
    },
    comprar(E, tipo) {
      const t = TIPOS[tipo]; if (!t) return { ok: false, msg: 'Elige un tipo de bien' };
      const J = E.jugador;
      const valor = Math.round(t.costoBase * U.rf(0.85, 1.25));
      if (J.patrimonio < valor) return { ok: false, msg: 'No tienes suficiente patrimonio líquido' };
      J.patrimonio -= valor;
      const bien = { id: U.id('bien'), tipo, nombre: t.n, valor, comprado: E.fecha.t };
      Prop.bienes(E).push(bien);
      C.Politicos.anotar(E.politicos.J, `Adquiere ${t.n.toLowerCase()}`);
      return { ok: true, bien };
    },
    vender(E, bienId) {
      const bienes = Prop.bienes(E);
      const i = bienes.findIndex(b => b.id === bienId); if (i < 0) return { ok: false, msg: 'No tienes ese bien' };
      const b = bienes[i];
      const monto = Math.round(b.valor * U.rf(0.88, 1.05));
      E.jugador.patrimonio += monto;
      bienes.splice(i, 1);
      return { ok: true, monto, nombre: b.nombre };
    },
    /* Renta semanal + variación de valor con el ciclo económico (más volátil cuanto mayor su beta) */
    turno(E) {
      const J = E.jugador;
      const creci = ((E.economia && E.economia.crecimiento) || 0) / 100;
      for (const b of Prop.bienes(E)) {
        const t = TIPOS[b.tipo]; if (!t) continue;
        J.patrimonio += b.valor * t.rentaSemanal;
        b.valor = Math.max(5, Math.round(b.valor * (1 + (creci * t.beta) / 52 + U.gauss(0, 0.003 * t.beta))));
      }
    },
    registrarAcciones() {
      C.Acciones.registrar({ id: 'comprarBien', nombre: 'Comprar un bien', icono: '🏷', grupo: 'finanzas', costo: 1,
        disponible(E) { const masBarato = Math.min(...Object.values(TIPOS).map(t => t.costoBase)); return E.jugador.patrimonio >= masBarato * 0.8 ? true : `Necesitas al menos ${U.cop(masBarato)} de patrimonio`; },
        ejecutar(E, a) { const r = Prop.comprar(E, a.tipo); return r.ok ? { ok: true, msg: `Compras ${r.bien.nombre.toLowerCase()} por ${U.cop(r.bien.valor)}` } : r; } });
      C.Acciones.registrar({ id: 'venderBien', nombre: 'Vender', icono: '💵', grupo: 'finanzas', costo: 1,
        disponible(E, a) { return Prop.bienes(E).some(b => b.id === a.bien) ? true : 'Elige un bien'; },
        ejecutar(E, a) { const r = Prop.vender(E, a.bien); return r.ok ? { ok: true, msg: `Vendes ${r.nombre.toLowerCase()} por ${U.cop(r.monto)}` } : r; } });
    }
  };
  C.Propiedades = Prop;
  C.Tiempo.registrar('propiedades', Prop, 15);
  Prop.registrarAcciones();
})(window.CURUL);
