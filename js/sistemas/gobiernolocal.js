/* Gobierno local: gabinete, presupuesto y decretos para el jugador cuando es gobernador o alcalde.
   Para no disparar el tamaño de la partida ni simular 33 asambleas y cientos de concejos, sólo se
   modela en profundidad el departamento donde el JUGADOR ejerce; el resto de gobernadores y
   alcaldes del país siguen existiendo como cargos, tal como en la Fase 1-2.
   Las secretarías se financian y reasignan por decreto (potestad ejecutiva normal); crear una
   secretaría nueva sí necesita el visto bueno de la Asamblea (ordenanza) o el Concejo (acuerdo),
   simulado aquí como una votación rápida según la composición política de la región, sin llegar a
   recrear un hemiciclo local completo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const SECRETARIAS = [
    ['gobierno', 'Secretaría de Gobierno', 'politica', 20],
    ['hacienda', 'Secretaría de Hacienda', 'hacienda', 12],
    ['salud', 'Secretaría de Salud', 'salud', 20],
    ['educacion', 'Secretaría de Educación', 'educacion', 22],
    ['infraestructura', 'Secretaría de Infraestructura', 'infraestructura', 18],
    ['planeacion', 'Secretaría de Planeación', 'tecnologia', 8]
  ];
  const EFECTO = { salud: 'salud', educacion: 'educacion', infraestructura: 'infraestructura', gobierno: 'seguridad' };
  const ORGANOS = { gobernacion: { cargo: 'gobernador', corp: 'Asamblea Departamental', acto: 'Ordenanza' }, alcaldia: { cargo: 'alcalde', corp: 'Concejo Municipal', acto: 'Acuerdo' } };

  const GL = {
    SECRETARIAS, ORGANOS,
    /* Población aproximada de la capital (no hay dato municipal propio: se estima del departamento). */
    poblacionCapital: d => Math.max(120, Math.round(d.poblacion * (d.id === 'BOG' || d.id === 'SAP' ? 1 : 0.38))),
    presupuestoTotal(E, depto, organo) {
      const d = E.deptos[depto];
      const pob = organo === 'alcaldia' ? GL.poblacionCapital(d) : d.poblacion;   // miles de habitantes
      const k = organo === 'alcaldia' ? 0.0075 : 0.011;                          // billones por cada mil habitantes/año
      return Math.max(0.3, pob * k);
    },
    /* Crea (si no existe) el gabinete local del jugador al asumir gobernación o alcaldía. */
    asegurar(E, depto, organo) {
      const d = E.deptos[depto];
      d.gobLocal = d.gobLocal || {};
      if (d.gobLocal[organo]) return d.gobLocal[organo];
      const pesoBase = {}; let tot = 0; for (const s of SECRETARIAS) tot += s[3];
      for (const s of SECRETARIAS) pesoBase[s[0]] = s[3] / tot * 100;
      const shares = Object.assign({}, pesoBase);
      const secretarios = {};
      for (const s of SECRETARIAS) secretarios[s[0]] = C.Politicos.crear(E, { partido: E.jugador.partido, depto, r: { exp: U.ri(40, 85) } }).id;
      const g = { extra: [], pesoBase, shares, secretarios, decretos: 0, historial: [] };
      d.gobLocal[organo] = g;
      return g;
    },
    secretariasDe(g) { return SECRETARIAS.map(s => ({ id: s[0], nombre: s[1], sector: s[2] })).concat(g.extra || []); },
    asignado(E, depto, organo) {
      const g = E.deptos[depto].gobLocal[organo], tot = GL.presupuestoTotal(E, depto, organo);
      const out = {}; for (const k of Object.keys(g.shares)) out[k] = tot * g.shares[k] / 100;
      return out;
    },
    setShare(E, depto, organo, secId, pct) {
      const g = E.deptos[depto].gobLocal[organo]; if (!g) return;
      pct = U.clamp(pct, 1, 55);
      const otros = Object.keys(g.shares).filter(k => k !== secId);
      const sumOtros = U.suma(otros.map(k => g.shares[k])), restante = 100 - pct;
      if (sumOtros <= 0.01) otros.forEach(k => g.shares[k] = restante / otros.length);
      else otros.forEach(k => g.shares[k] = Math.max(0.5, g.shares[k] / sumOtros * restante));
      g.shares[secId] = pct;
      const tot = U.suma(Object.values(g.shares)); for (const k of Object.keys(g.shares)) g.shares[k] = g.shares[k] / tot * 100;
    },
    subfinanciada(E, depto, organo, secId) {
      const g = E.deptos[depto].gobLocal[organo]; if (!g) return false;
      return g.shares[secId] < g.pesoBase[secId] * 0.7;
    },

    /* ── Decretos: potestad ejecutiva directa, sin necesidad de aprobación de la corporación ── */
    decretar(E, depto, organo, secId, sentido) {
      const g = GL.asegurar(E, depto, organo), d = E.deptos[depto];
      g.decretos++;
      const ef = EFECTO[secId];
      const magnitud = (sentido === 'no' ? -1 : 1) * U.rf(1, 2.2);
      if (ef && d[ef] != null) d[ef] = U.clamp(d[ef] + magnitud, 1, 99);
      const J = E.jugador;
      J.rep.liderazgo = U.clamp(J.rep.liderazgo + 0.4, 0, 100);
      C.Opinion.moverImagen(E, { dep: { [depto]: 1.2 } });
      const numero = `${ORGANOS[organo].acto === 'Ordenanza' ? 'Ordenanza' : 'Decreto'} municipal`;
      const nombreSec = GL.secretariasDe(g).find(s => s.id === secId).nombre;
      const titulo = `${J.nombre} firma el Decreto ${g.decretos} de ${U.anio()} (${organo === 'gobernacion' ? 'Gobernación de ' + d.nombre : 'Alcaldía de ' + d.capital}): ${nombreSec.toLowerCase()}`;
      C.Politicos.anotar(E.politicos.J, 'Firma el Decreto ' + g.decretos + ' (' + nombreSec + ')');
      g.historial.unshift({ t: E.fecha.t, txt: `Decreto ${g.decretos}: intervención en ${nombreSec.toLowerCase()}${ef ? ' (' + U.signo(magnitud, 1) + ' ' + ef + ')' : ''}` });
      C.Medios.noticia(E, { tipo: 'regional', titular: titulo, tono: sentido === 'no' ? -1 : 1, jugador: true });
      return { ef, magnitud };
    },

    /* ── Crear una secretaría nueva: necesita el visto bueno de la corporación local ── */
    probabilidadCorp(E, depto, organo) {
      const J = E.jugador;
      const cuo = C.Elecciones.cuotas(E, depto, false);
      const propio = cuo[J.partido] || 0.1;
      return U.clamp(0.35 + propio * 0.9 + J.atributos.negociacion / 300, 0.05, 0.92);
    },
    proponerCreacion(E, depto, organo, nombre, sector) {
      const g = GL.asegurar(E, depto, organo);
      const prob = GL.probabilidadCorp(E, depto, organo);
      const aprueba = U.chance(prob);
      const corp = ORGANOS[organo].corp, acto = ORGANOS[organo].acto;
      if (aprueba) {
        const id = U.id('sec');
        g.extra.push({ id, nombre, sector });
        const pct = 3, factor = (100 - pct) / 100;
        for (const k of Object.keys(g.shares)) g.shares[k] *= factor;
        g.shares[id] = pct;
        for (const k of Object.keys(g.pesoBase)) g.pesoBase[k] *= factor;
        g.pesoBase[id] = pct;
        g.secretarios[id] = C.Politicos.crear(E, { partido: E.jugador.partido, depto, r: { exp: U.ri(40, 80) } }).id;
        C.Medios.noticia(E, { tipo: 'regional', titular: `${corp} aprueba el ${acto.toLowerCase()} que crea la Secretaría de ${nombre}`, tono: 1, jugador: true });
      } else {
        C.Medios.noticia(E, { tipo: 'regional', titular: `${corp} niega el ${acto.toLowerCase()} para crear la Secretaría de ${nombre}`, tono: -1, jugador: true });
      }
      return { aprobado: aprueba, prob };
    },

    turno(E) {
      const J = E.jugador;
      if (J.cargo !== 'gobernador' && J.cargo !== 'alcalde') return;
      const depto = J.cargoInfo.depto, organo = J.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia';
      const g = E.deptos[depto] && E.deptos[depto].gobLocal && E.deptos[depto].gobLocal[organo];
      if (!g) return;
      for (const s of GL.secretariasDe(g)) {
        const pol = E.politicos[g.secretarios[s.id]]; if (!pol) continue;
        const adecuacion = U.clamp((g.shares[s.id] - g.pesoBase[s.id]) / g.pesoBase[s.id], -0.5, 0.5);
        pol.aprob = U.clamp((pol.aprob || 50) + adecuacion * 0.12 + U.gauss(0, 0.2), 5, 95);
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      const propio = (E, depto, organo) => E.jugador.cargo === ORGANOS[organo].cargo && E.jugador.cargoInfo.depto === depto;
      A.registrar({ id: 'decretoLocal', nombre: 'Firmar decreto', icono: '📝', grupo: 'local', costo: 1,
        disponible: (E, a) => propio(E, a.depto, a.organo) ? true : 'No ejerces ese cargo',
        ejecutar(E, a) { const r = GL.decretar(E, a.depto, a.organo, a.secretaria, a.sentido); return { ok: true, msg: r.ef ? `Decreto firmado: ${U.signo(r.magnitud, 1)} en ${r.ef}` : 'Decreto firmado' }; } });
      A.registrar({ id: 'ajustarSecretariaLocal', nombre: 'Reasignar presupuesto local', icono: '💰', grupo: 'local', costo: 0,
        disponible: (E, a) => propio(E, a.depto, a.organo) ? true : 'No ejerces ese cargo',
        ejecutar(E, a) { GL.setShare(E, a.depto, a.organo, a.secretaria, +a.pct); return { ok: true, msg: 'Presupuesto local ajustado' }; } });
      A.registrar({ id: 'crearSecretaria', nombre: 'Proponer crear una secretaría', icono: '🏛', grupo: 'local', costo: 2,
        disponible(E, a) {
          if (!propio(E, a.depto, a.organo)) return 'No ejerces ese cargo';
          const nombre = (a.nombre || '').trim(); if (!nombre) return true;
          const g = E.deptos[a.depto].gobLocal[a.organo];
          if (g && GL.secretariasDe(g).some(s => s.nombre.toLowerCase() === ('secretaría de ' + nombre).toLowerCase())) return 'Ya existe esa secretaría';
          return true;
        },
        ejecutar(E, a) {
          const nombre = (a.nombre || '').trim(); if (!nombre) return { ok: false, msg: 'Dale un nombre a la secretaría' };
          const sector = C.DATA.sectores[a.sector] ? a.sector : 'politica';
          const r = GL.proponerCreacion(E, a.depto, a.organo, 'Secretaría de ' + nombre, sector);
          return { ok: true, msg: r.aprobado ? `${ORGANOS[a.organo].corp} aprueba la nueva secretaría` : `${ORGANOS[a.organo].corp} la rechaza (probabilidad estimada ${Math.round(r.prob * 100)}%)` };
        } });
    }
  };

  C.GobiernoLocal = GL;
  C.Tiempo.registrar('gobiernolocal', GL, 55);
  GL.registrarAcciones();
  C.Bus.on('jugador:cargo', tipo => {
    const E = C.E; if (!E || (tipo !== 'gobernador' && tipo !== 'alcalde')) return;
    GL.asegurar(E, E.jugador.cargoInfo.depto, tipo === 'gobernador' ? 'gobernacion' : 'alcaldia');
  });
})(window.CURUL);
