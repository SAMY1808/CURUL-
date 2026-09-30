/* Licitación de megaobras. La obra bandera de una gobernación o alcaldía ya no arranca sola: se abre un
   proceso con proponentes de todo tipo —constructoras reconocidas, consorcios internacionales, empresas
   locales, ofertas oportunistas y las empresas que financiaron tus campañas—. Una licitación pública
   adjudica por mérito (precio, calidad y plazo) salvo que ajustes los pliegos a la medida de alguien;
   la contratación restringida o directa te deja escoger, más rápido y más riesgoso. El contratista marca
   la calidad de la obra, los sobrecostos y los retrasos; los donantes cobran (y te dan caja para la próxima
   campaña), y todo eso deja un rastro que persiguen la Contraloría y la Fiscalía. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const FACTOR = { metro: 0.5, aeropuerto: 0.25, terminal: 0.1, malla_vial: 0.2, hospital: 0.15, centros_salud: 0.08, megacolegio: 0.08, universidad: 0.15, ciudadela: 0.1, parque: 0.06, convenciones: 0.1 };
  const MODALIDAD = { publica: 'Licitación pública', restringida: 'Concurso restringido', directa: 'Contratación directa' };
  const TIPOS = { reconocida: 'Constructora reconocida', internacional: 'Consorcio internacional', local: 'Empresa local', donante: 'Donante de campaña', oportunista: 'Oferta oportunista' };
  const NOMBRES = ['Constructora Andina', 'Consorcio Vías del Sur', 'Ingeniería y Obras del Caribe', 'Grupo Cimientos', 'Odeón Infraestructuras', 'Consorcio Puente Nuevo', 'Constructora Bolívar Hermanos', 'Ingenieros Asociados del Pacífico', 'Consorcio Metropolitano', 'Obras Civiles del Oriente', 'Concretos y Estructuras', 'Grupo Vial Colombiano', 'Ingeniería Total', 'Consorcio Horizonte', 'Constructora Sabana', 'Obras y Proyectos del Valle'];
  const INTERN = ['Consorcio Ibérico', 'Grupo Nórdico de Infraestructura', 'Sino-Andina Ingeniería', 'Constructora Atlántica Internacional', 'Consorcio Brasil-Colombia'];

  const L = {
    MODALIDAD, TIPOS,
    donantes(E) { const J = E.jugador; J.donantes = J.donantes || []; return J.donantes; },
    /* Cuando recaudas dinero de campaña, a veces quien aporta es una constructora que luego querrá contratos. */
    registrarDonante(E, monto, irregular) {
      const d = L.donantes(E); if (!irregular && !U.chance(0.55)) return;
      const nombre = U.pick(NOMBRES.filter(n => !d.some(x => x.nombre === n))) || U.pick(NOMBRES);
      const x = d.find(y => y.nombre === nombre) || (d.push({ nombre, aporte: 0, t: E.fecha.t, irregular: !!irregular, cobrado: 0 }), d[d.length - 1]);
      x.aporte += Math.max(5, Math.round(monto * (irregular ? 0.5 : 0.25))); x.t = E.fecha.t; if (irregular) x.irregular = true;
      if (d.length > 12) d.sort((a, b) => b.aporte - a.aporte).length = 12;
    },
    costoObra(E, depto, organo, obraId) { return +(C.GobiernoLocal.presupuestoTotal(E, depto, organo) * (FACTOR[obraId] || 0.1) * U.rf(0.9, 1.1)).toFixed(2); },
    proponentes(E, costo) {
      const dn = L.donantes(E).slice().sort((a, b) => b.aporte - a.aporte), ps = [];
      const p = (tipo, nombre, cal, precio, plazo, integ, extra) => ps.push(Object.assign({ id: U.id('pr'), tipo, nombre, calidad: Math.round(cal), precio: +(costo * precio).toFixed(2), plazo: Math.round(plazo), integridad: Math.round(integ), cumplimiento: Math.round(U.clamp(cal + U.gauss(0, 8), 10, 99)) }, extra || {}));
      const usados = new Set();
      const n = () => { const x = U.pick(NOMBRES.filter(m => !usados.has(m) && !dn.some(d => d.nombre === m))) || U.pick(NOMBRES); usados.add(x); return x; };
      p('reconocida', n(), U.rf(75, 92), U.rf(1.08, 1.2), U.rf(18, 24), U.rf(70, 92));
      p('internacional', U.pick(INTERN), U.rf(70, 90), U.rf(1.18, 1.35), U.rf(16, 22), U.rf(75, 95));
      p('local', n(), U.rf(50, 72), U.rf(0.93, 1.04), U.rf(20, 28), U.rf(45, 75));
      if (dn.length) p('donante', dn[0].nombre, U.rf(35, 68), U.rf(0.8, 0.92), U.rf(22, 32), U.rf(20, 45), { vinculo: 'donante' });
      else p('donante', n() + ' (cercana al partido)', U.rf(40, 66), U.rf(0.82, 0.94), U.rf(22, 30), U.rf(25, 50), { vinculo: 'partido' });
      p('oportunista', n(), U.rf(28, 50), U.rf(0.68, 0.8), U.rf(24, 36), U.rf(20, 40));
      return ps;
    },
    /* Puntaje de una oferta en la licitación pública (0-100). */
    puntaje(lic, pr) {
      const precio = 100 - (pr.precio / lic.costo - 0.6) * 90, plazo = 100 - (pr.plazo - 14) * 3;
      return 0.3 * U.clamp(precio, 0, 100) + 0.5 * pr.cumplimiento + 0.2 * U.clamp(plazo, 0, 100) + (lic.favorecido === pr.id ? 22 : 0);
    },

    abrir(E, depto, organo, obraId, modalidad) {
      const g = C.GobiernoLocal.asegurar(E, depto, organo), costo = L.costoObra(E, depto, organo, obraId);
      const mod = MODALIDAD[modalidad] ? modalidad : 'publica';
      g.licitacion = { obraId, modalidad: mod, t0: E.fecha.t, costo, proponentes: L.proponentes(E, costo), semanas: mod === 'publica' ? 3 : mod === 'restringida' ? 1 : 0, veeduria: false, favorecido: null, denunciada: false };
      const ob = C.GobiernoLocal.nombreObra({ obraId }), lugar = organo === 'gobernacion' ? E.deptos[depto].nombre : E.deptos[depto].capital;
      C.Medios.noticia(E, { tipo: 'regional', titular: `${mod === 'publica' ? 'Abren la licitación' : 'Convocan la contratación'} de ${ob.nombre.toLowerCase()} en ${lugar} por ${U.d1(costo)} billones`, tono: 0, jugador: true, importante: true });
      return g.licitacion;
    },
    turno(E) {
      const J = E.jugador; if (J.cargo !== 'gobernador' && J.cargo !== 'alcalde') return;
      L.avanzar(E, J.cargoInfo.depto, J.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia');
    },
    avanzar(E, depto, organo) {
      const g = C.GobiernoLocal.asegurar(E, depto, organo), lic = g.licitacion; if (!lic || lic.modalidad !== 'publica') return;
      if (E.fecha.t - lic.t0 >= lic.semanas + (lic.veeduria ? 1 : 0)) {
        const mejor = lic.proponentes.slice().sort((a, b) => L.puntaje(lic, b) - L.puntaje(lic, a))[0];
        L.adjudicar(E, depto, organo, mejor.id, true);
      }
    },
    adjudicar(E, depto, organo, prId, automatica) {
      const g = C.GobiernoLocal.asegurar(E, depto, organo), lic = g.licitacion, J = E.jugador; if (!lic) return null;
      const pr = lic.proponentes.find(x => x.id === prId); if (!pr) return null;
      const directa = lic.modalidad === 'directa', plazo = Math.max(8, Math.round(pr.plazo * (directa ? 0.8 : 1)));
      const def = C.GobiernoLocal.OBRAS_BANDERA.find(o => o[0] === lic.obraId) || C.GobiernoLocal.OBRAS_BANDERA[2];
      g.obraBandera = { obraId: def[0], sector: def[3], t: E.fecha.t, semanas: plazo, semanasTot: plazo, acelerada: false,
        contratista: { nombre: pr.nombre, tipo: pr.tipo, calidad: pr.calidad, integridad: pr.integridad, vinculo: pr.vinculo || null }, costo: pr.precio, costoBase: lic.costo, modalidad: lic.modalidad, sobrecostos: 0, favorecida: lic.favorecido === pr.id, comisionCobrada: false };
      // Se paga con el fondo de regalías y, lo que falte, con deuda
      const fondo = g.fondoRegalias || 0, usa = Math.min(fondo, pr.precio); g.fondoRegalias = fondo - usa; g.deudaObras = (g.deudaObras || 0) + (pr.precio - usa);
      g.licitacion = null;
      const lugar = organo === 'gobernacion' ? E.deptos[depto].nombre : E.deptos[depto].capital, ob = C.GobiernoLocal.nombreObra(g.obraBandera);
      C.Medios.noticia(E, { tipo: 'regional', titular: `${pr.nombre} se queda con ${ob.nombre.toLowerCase()} de ${lugar} por ${U.d1(pr.precio)} billones${pr.vinculo === 'donante' ? ': aportó a la campaña del alcalde' : ''}`, tono: pr.vinculo ? -1 : 1, jugador: true, importante: true });
      if (pr.vinculo === 'donante') { const d = L.donantes(E).find(x => x.nombre === pr.nombre); if (d) d.contratos = (d.contratos || 0) + 1; if (U.chance(0.2)) C.Crisis.escandalo(E, { titulo: `Cuestionan el contrato de ${pr.nombre}: financió tu campaña`, texto: 'Los medios revelan que la empresa ganadora aportó a tu campaña. La oposición pide que se investigue la adjudicación.', grav: 2 }); }
      return g.obraBandera;
    },
    /* Cada semana de obra: sobrecostos, retrasos y denuncias, según el contratista y cómo se contrató. */
    turnoObra(E, depto, organo) {
      const g = C.GobiernoLocal.asegurar(E, depto, organo), o = g.obraBandera; if (!o || !o.contratista || E.meta.presim) return;
      const c = o.contratista, J = E.jugador;
      if (U.chance(0.007 * (100 - c.calidad) / 50 * (o.acelerada ? 1.8 : 1))) {
        const f = U.rf(0.06, 0.16), extra = +(o.costoBase * f).toFixed(2); o.costo += extra; o.sobrecostos += extra; o.semanas += U.ri(2, 4); o.semanasTot += 3;
        g.deudaObras = (g.deudaObras || 0) + extra;
        C.Medios.noticia(E, { tipo: 'regional', titular: `${c.nombre} pide más plata: sobrecostos de ${U.d1(extra)} billones en la obra`, tono: -1, jugador: true, importante: true });
      }
      const hostil = C.Control ? C.Control.hostilJ(E, 'contralor') : 1;
      const riesgo = 0.0025 * hostil * ((c.vinculo === 'donante' ? 2.2 : c.vinculo === 'partido' ? 1.5 : 0.4) + (o.modalidad === 'directa' ? 1.2 : 0) + (o.favorecida ? 1.5 : 0) + (o.comisionCobrada ? 2 : 0)) * (100 - c.integridad) / 60;
      if (U.chance(riesgo)) {
        J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + U.ri(5, 12), 0, 100); E.opinion.corrupcionAcum = (E.opinion.corrupcionAcum || 0) + 0.5;
        C.Crisis.escandalo(E, { titulo: `La Contraloría abre un proceso por el contrato de ${c.nombre}`, texto: 'Un hallazgo fiscal señala irregularidades en la adjudicación y ejecución de la megaobra. El caso llega a la Fiscalía.', grav: o.comisionCobrada || o.favorecida ? 3 : 2 });
      }
    },
    /* Al entregar la obra los donantes «cobran»: dan más caja para la próxima campaña. */
    alCerrar(E, depto, organo, o, exito) {
      const c = o && o.contratista; if (!c) return;
      if (c.vinculo === 'donante') { const d = L.donantes(E).find(x => x.nombre === c.nombre); if (d) d.aporte += Math.round(o.costo * 60); }
      if (o.sobrecostos > o.costoBase * 0.2) E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia - 3, 0, 100);
    },
    /* Bonus de recaudo por tener donantes agradecidos. */
    bonusRecaudo(E) { const d = L.donantes(E).filter(x => x.contratos); return 1 + Math.min(0.6, d.length * 0.2); },

    registrarAcciones() {
      const A = C.Acciones;
      const propio = (E, a) => { const g = C.GobiernoLocal.ORGANOS[a.organo]; return g && E.jugador.cargo === g.cargo && E.jugador.cargoInfo.depto === a.depto; };
      A.registrar({ id: 'abrirLicitacion', nombre: 'Abrir licitación de la obra', icono: '📑', grupo: 'local', costo: 2,
        disponible(E, a) {
          if (!propio(E, a)) return 'No ejerces ese cargo';
          const g = E.deptos[a.depto].gobLocal && E.deptos[a.depto].gobLocal[a.organo];
          if (g && g.obraBandera) return 'Ya tienes una obra bandera en curso'; if (g && g.licitacion) return 'Ya hay una licitación abierta'; return true;
        },
        ejecutar(E, a) {
          const disp = C.GobiernoLocal.obrasDisponibles(E, a.depto, a.organo), obraId = disp.some(o => o.id === a.obra) ? a.obra : disp[0].id;
          L.abrir(E, a.depto, a.organo, obraId, a.modalidad);
          return { ok: true, msg: `Abres la contratación (${MODALIDAD[a.modalidad] ? MODALIDAD[a.modalidad].toLowerCase() : 'licitación pública'})` };
        } });
      const lic = (E, a) => { if (!propio(E, a)) return null; const g = E.deptos[a.depto].gobLocal && E.deptos[a.depto].gobLocal[a.organo]; return g && g.licitacion; };
      A.registrar({ id: 'adjudicarLicitacion', nombre: 'Adjudicar el contrato', icono: '✍', grupo: 'local', costo: 1,
        disponible(E, a) { const l = lic(E, a); if (!l) return 'No hay una licitación abierta'; return l.modalidad === 'publica' ? 'La licitación pública se adjudica por mérito' : true; },
        ejecutar(E, a) { const o = L.adjudicar(E, a.depto, a.organo, a.empresa); return o ? { ok: true, msg: `Adjudicas el contrato a ${o.contratista.nombre}` } : { ok: false, msg: 'Elige la empresa' }; } });
      A.registrar({ id: 'ajustarPliegos', nombre: 'Ajustar los pliegos a la medida', icono: '🧾', grupo: 'local', costo: 1,
        disponible(E, a) { const l = lic(E, a); if (!l) return 'No hay una licitación abierta'; if (l.modalidad !== 'publica') return 'Sólo aplica a la licitación pública'; if (l.veeduria) return 'La veeduría ciudadana vigila los pliegos'; return l.favorecido ? 'Ya ajustaste los pliegos' : true; },
        ejecutar(E, a) {
          const l = lic(E, a), pr = l.proponentes.find(x => x.id === a.empresa); if (!pr) return { ok: false, msg: 'Elige a quién favoreces' };
          l.favorecido = pr.id; E.jugador.riesgoJudicial = U.clamp((E.jugador.riesgoJudicial || 0) + 4, 0, 100); E.jugador.rep.transparencia = U.clamp(E.jugador.rep.transparencia - 4, 0, 100);
          if (U.chance(0.25)) { l.denunciada = true; C.Crisis.escandalo(E, { titulo: 'Denuncian pliegos «hechos a la medida» en la licitación', texto: `Un veedor asegura que los requisitos de la licitación favorecen a ${pr.nombre}.`, grav: 2 }); }
          return { ok: true, msg: `Los pliegos quedan a la medida de ${pr.nombre}: gana más puntos, pero el riesgo sube` };
        } });
      A.registrar({ id: 'activarVeeduria', nombre: 'Activar la veeduría ciudadana', icono: '👁', grupo: 'local', costo: 1,
        disponible(E, a) { const l = lic(E, a); if (!l) return 'No hay una licitación abierta'; if (l.modalidad !== 'publica') return 'Sólo aplica a la licitación pública'; return l.veeduria ? 'La veeduría ya está activa' : l.favorecido ? 'Ya ajustaste los pliegos' : true; },
        ejecutar(E, a) { const l = lic(E, a); l.veeduria = true; E.jugador.rep.transparencia = U.clamp(E.jugador.rep.transparencia + 5, 0, 100); E.jugador.rep.honestidad = U.clamp(E.jugador.rep.honestidad + 2, 0, 100); return { ok: true, msg: 'La veeduría vigila el proceso: más transparencia y una semana más de plazo' }; } });
      A.registrar({ id: 'cobrarComision', nombre: 'Cobrar una comisión', icono: '💼', grupo: 'local', costo: 1,
        disponible(E, a) { if (!propio(E, a)) return 'No ejerces ese cargo'; const g = E.deptos[a.depto].gobLocal[a.organo], o = g && g.obraBandera; if (!o || !o.contratista) return 'No hay una obra contratada'; return o.comisionCobrada ? 'Ya cobraste' : true; },
        ejecutar(E, a) {
          const g = E.deptos[a.depto].gobLocal[a.organo], o = g.obraBandera, J = E.jugador, monto = Math.round(o.costo * 1e6 * 0.0008 * (o.contratista.vinculo ? 1.4 : 1));
          o.comisionCobrada = true; J.patrimonio += monto; J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + 10, 0, 100); E.opinion.corrupcionAcum = (E.opinion.corrupcionAcum || 0) + 0.6; J.rep.honestidad = U.clamp(J.rep.honestidad - 8, 0, 100);
          if (U.chance(0.1)) { C.Crisis.escandalo(E, { titulo: `Denuncian que ${J.nombre} cobró una comisión por el contrato de la megaobra`, texto: 'Un exfuncionario entrega a la Fiscalía los soportes de un pago irregular ligado al contratista.', grav: 3 }); return { ok: true, msg: `Cobras ${U.cop(monto)}... y lo destapan`, exito: false }; }
          return { ok: true, msg: `Recibes ${U.cop(monto)} de comisión: el riesgo judicial sube` };
        } });
    }
  };
  C.Licitacion = L;
  C.Tiempo.registrar('licitaciones', L, 51);
  L.registrarAcciones();
})(window.CURUL);
