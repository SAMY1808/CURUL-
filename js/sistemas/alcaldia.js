/* Alcaldía dinámica (Fase 38). Ser alcalde deja de ser sólo administrar secretarías: la ciudad tiene pulso propio
   —ánimo ciudadano, movilidad, aseo, espacio público, cultura y turismo—, una caja de libre disposición, un concejo que
   chantajea o castiga, fiestas locales, eventos con decisión (trancones, vendedores, paros de taxis, hurtos, basuras,
   derrumbes, influencers…) y un ranking anual de los mejores alcaldes del país. El jugador puede mover la ciudad con
   operativos, ciclovías, pico y placa, festivales, alumbrado navideño, cabildos abiertos, recorridos nocturnos, planes
   de choque, predial, redes sociales y negociación con el concejo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const IND = { animo: ['Ánimo ciudadano', '😀'], movilidad: ['Movilidad', '🚦'], aseo: ['Aseo y limpieza', '🧹'], espacio: ['Espacio público', '🌳'], cultura: ['Cultura y vida social', '🎭'], turismo: ['Turismo y comercio', '🧳'] };
  /* Fiestas locales: [nombre, mes (0-11)] */
  const FIESTAS = { ANT: ['Feria de las Flores', 7], ATL: ['Carnaval de Barranquilla', 1], NAR: ['Carnaval de Negros y Blancos', 0], VAL: ['Feria de Cali', 11], BOL: ['Fiestas de la Independencia', 10], CAL: ['Feria de Manizales', 0], TOL: ['Festival Folclórico', 5], HUI: ['Festival del Bambuco', 5], MAG: ['Fiestas del Mar', 6], COR: ['Fiestas del Río', 5], BOG: ['Festival de Verano', 7], RIS: ['Fiestas de la Cosecha', 6], QUI: ['Fiesta Nacional de la Cosecha', 5], CES: ['Festival de la Leyenda Vallenata', 3], MET: ['Torneo Internacional del Joropo', 5], CHO: ['Fiestas de San Pacho', 8], SAN: ['Feria Bonita', 8], NSA: ['Feria Internacional de Cúcuta', 5], SUC: ['Fiestas del 20 de Enero', 0], BOY: ['Festival de la Cultura Boyacense', 7], CAU: ['Semana Santa de Popayán', 3], LAG: ['Festival de la Cultura Wayuu', 4], CAQ: ['Festival de San Pedro', 5], CAS: ['Festival de la Orinoquía', 8], CUN: ['Fiestas del Sol y de la Luna', 5] };
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const FESTIVALES = {
    feria: { n: 'Feria y fiestas con carrozas', icono: '🎪', frac: 0.012, ef: { animo: 7, cultura: 8, turismo: 9, espacio: -2 }, riesgo: 0.08 },
    concierto: { n: 'Concierto masivo gratuito', icono: '🎤', frac: 0.018, ef: { animo: 9, cultura: 5, turismo: 6, aseo: -4 }, riesgo: 0.14 },
    cine: { n: 'Festival de cine y literatura', icono: '🎬', frac: 0.007, ef: { animo: 3, cultura: 11, turismo: 3 }, riesgo: 0.02 },
    gastronomico: { n: 'Festival gastronómico', icono: '🍲', frac: 0.006, ef: { animo: 5, cultura: 4, turismo: 8 }, riesgo: 0.04 }
  };
  const RANK_NOMBRES = ['Cartagena', 'Medellín', 'Bucaramanga', 'Manizales', 'Pereira', 'Barranquilla', 'Cali', 'Montería', 'Ibagué', 'Neiva', 'Valledupar', 'Santa Marta', 'Tunja', 'Armenia', 'Pasto', 'Popayán'];

  const Al = {
    IND, FIESTAS, FESTIVALES, clave: null,
    esAlcalde: E => E.jugador.cargo === 'alcalde' && E.jugador.cargoInfo && E.jugador.cargoInfo.depto,
    depto: E => E.deptos[E.jugador.cargoInfo.depto],
    gl(E) { return C.GobiernoLocal.asegurar(E, E.jugador.cargoInfo.depto, 'alcaldia'); },
    presupuesto(E) { return C.GobiernoLocal.presupuestoTotal(E, E.jugador.cargoInfo.depto, 'alcaldia'); },
    fr(E, f) { return +(Al.presupuesto(E) * f).toFixed(3); },
    /* Estado de la ciudad del jugador (se crea perezosamente dentro del gobierno local) */
    vida(E) {
      const g = Al.gl(E), d = Al.depto(E);
      if (g.vida) return g.vida;
      const pobM = C.GobiernoLocal.poblacionCapital(d) / 1000;
      return g.vida = { animo: 55, movilidad: U.clamp(72 - pobM * 7, 22, 80), aseo: 58, espacio: 52, cultura: 42, turismo: U.clamp(30 + (FIESTAS[d.id] ? 10 : 0), 15, 60),
        caja: Al.fr(E, 0.02), concejo: 50, ultEvento: -99, cool: {}, fiestaAnio: 0, racha: 0, rank: null, rankAnio: 0, hist: [] };
    },
    anotar(E, txt) { const v = Al.vida(E); v.hist.unshift({ t: E.fecha.t, txt }); if (v.hist.length > 14) v.hist.length = 14; },
    /* Aplica un paquete de efectos y devuelve un resumen legible */
    ef(E, o) {
      if (!Al.esAlcalde(E)) return '';   // el evento pudo resolverse tras dejar el cargo
      const v = Al.vida(E), d = Al.depto(E), J = E.jugador, out = [];
      for (const k of Object.keys(IND)) if (o[k]) { v[k] = U.clamp(v[k] + o[k], 0, 100); out.push(`${IND[k][1]} ${o[k] > 0 ? '+' : ''}${o[k]}`); }
      if (o.seg) { d.seguridad = U.clamp(d.seguridad + o.seg, 1, 99); out.push(`🛡 ${o.seg > 0 ? '+' : ''}${o.seg}`); }
      if (o.caja) { v.caja += Al.fr(E, o.caja); out.push(`💵 ${o.caja > 0 ? '+' : '−'}${Math.abs(o.caja * 100).toFixed(1)} % del presupuesto`); }
      if (o.concejo) { v.concejo = U.clamp(v.concejo + o.concejo, 0, 100); out.push(`🏛 concejo ${o.concejo > 0 ? '+' : ''}${o.concejo}`); }
      if (o.rec) C.Opinion.subirRec(E, o.rec), out.push(`📣 reconocimiento ${o.rec > 0 ? '+' : ''}${o.rec}`);
      if (o.aprob) { d.ajusteAprob = U.clamp((d.ajusteAprob || 0) + o.aprob, -30, 30); out.push(`👍 aprobación local ${o.aprob > 0 ? '+' : ''}${o.aprob}`); }
      if (o.honestidad) { J.rep.honestidad = U.clamp(J.rep.honestidad + o.honestidad, 0, 100); out.push(`⚖ honestidad ${o.honestidad > 0 ? '+' : ''}${o.honestidad}`); }
      if (o.gob) { const pr = E.politicos[E.gobierno.presidente]; if (pr && E.gobierno.presidente !== 'J') pr.relJ = U.clamp((pr.relJ || 0) + o.gob, -100, 100); out.push(`🦅 Gobierno ${o.gob > 0 ? '+' : ''}${o.gob}`); }
      if (o.patrimonio) { J.patrimonio += o.patrimonio; out.push(`💰 ${o.patrimonio > 0 ? '+' : ''}$${o.patrimonio} M`); }
      return out.join(' · ');
    },
    animoObjetivo(E) {
      const v = Al.vida(E), d = Al.depto(E);
      return 0.22 * v.movilidad + 0.2 * v.aseo + 0.14 * v.espacio + 0.1 * v.cultura + 0.1 * v.turismo + 0.24 * d.seguridad;
    },
    fiestaDeMes(E) { const d = Al.depto(E), f = FIESTAS[d.id] || ['Fiestas patronales', 8]; return f; },
    enfriamiento(E, id, sem) { const v = Al.vida(E); return E.fecha.t - (v.cool[id] || -999) < sem ? `Disponible en ${sem - (E.fecha.t - (v.cool[id] || -999))} semanas` : true; },
    marcar(E, id) { Al.vida(E).cool[id] = E.fecha.t; },
    eventoCiudad(E) {
      const v = Al.vida(E), d = Al.depto(E), mes = U.hoy().getUTCMonth();
      const pool = C.DATA.eventos.filter(e => e.alcalde && !/^al_(fiesta|navidad)$/.test(e.id) && (!e.req || e.req(E, v)) && !E.eventos.historial.slice(0, 8).some(h => h.plantilla === e.id));
      const pl = U.pesado(pool, e => (e.peso || 1) * (e.sit ? e.sit(v, d, E) : 1));
      if (pl) C.Eventos.disparar(E, pl, { forzar: true, vars: { ciudad: d.capital } });
    },
    turno(E) {
      if (!Al.esAlcalde(E)) return;
      const v = Al.vida(E), d = Al.depto(E), t = E.fecha.t;
      const pobM = C.GobiernoLocal.poblacionCapital(d) / 1000, inf = d.infraestructura;
      // deriva hacia la base: la ciudad se degrada sola si no la atiendes
      const base = { movilidad: U.clamp(70 - pobM * 7 + (inf - 55) * 0.25, 18, 80), aseo: 52 + (d.infraestructura - 55) * 0.2, espacio: 50, cultura: 38, turismo: 32 + (FIESTAS[d.id] ? 8 : 0) };
      for (const k of Object.keys(base)) v[k] = U.clamp(v[k] + (base[k] - v[k]) * 0.008 + U.gauss(0, 0.2), 0, 100);
      v.animo = U.clamp(v.animo + (Al.animoObjetivo(E) - v.animo) * 0.05, 0, 100);
      v.caja = Math.min(Al.fr(E, 0.15), v.caja + Al.fr(E, 0.1) / 52);
      d.ajusteAprob = U.clamp((d.ajusteAprob || 0) + (v.animo - 55) * 0.0012, -30, 30);
      v.concejo = U.clamp(v.concejo + (50 - v.concejo) * 0.004 + (v.animo > 60 ? 0.03 : v.animo < 40 ? -0.05 : 0), 0, 100);
      v.racha = v.animo >= 65 ? v.racha + 1 : v.animo < 45 ? Math.min(0, v.racha - 1) : Math.floor(v.racha * 0.9);
      if (v.racha === 26) { Al.anotar(E, 'Medio año de ciudad contenta: te llaman «el alcalde del pueblo»'); C.Opinion.subirRec(E, 2); }
      // fiestas locales: una vez al año en su mes
      const mes = U.hoy().getUTCMonth(), f = Al.fiestaDeMes(E), anio = U.anio();
      if (mes === f[1] && v.fiestaAnio !== anio && !E.eventos.pendientes.length) { v.fiestaAnio = anio; C.Eventos.disparar(E, C.Eventos.plantilla('al_fiesta'), { forzar: true, vars: { fiesta: f[0], ciudad: d.capital } }); }
      else if (mes === 10 && v.navidadAnio !== anio && !E.eventos.pendientes.length) { v.navidadAnio = anio; C.Eventos.disparar(E, C.Eventos.plantilla('al_navidad'), { forzar: true, vars: { ciudad: d.capital } }); }
      // eventos de la ciudad
      else if (t - v.ultEvento > 3 && !E.eventos.pendientes.length && U.chance(0.1)) { v.ultEvento = t; Al.eventoCiudad(E); }
      // ranking anual de alcaldes (semana de diciembre)
      const dm = U.hoy(); if (dm.getUTCMonth() === 11 && dm.getUTCDate() >= 8 && dm.getUTCDate() < 15 && v.rankAnio !== anio) Al.rankingAnual(E);
      // las revocatorias asoman cuando el ánimo cae por meses
      if (v.racha <= -30 && U.chance(0.01)) { v.racha = -10; Al.anotar(E, 'Colectivos ciudadanos amenazan con recoger firmas para revocarte'); C.Medios.noticia(E, { tipo: 'regional', titular: `Colectivos de ${d.capital} anuncian recolección de firmas para revocar a ${E.jugador.nombre}`, tono: -1, jugador: true, importante: true }); C.Opinion.subirRec(E, -2); }
    },
    puntaje(E) { const v = Al.vida(E), d = Al.depto(E); return 0.35 * v.animo + 0.15 * v.movilidad + 0.15 * v.aseo + 0.1 * v.espacio + 0.1 * v.cultura + 0.15 * d.seguridad; },
    rankingAnual(E) {
      const v = Al.vida(E), anio = U.anio(); v.rankAnio = anio;
      const pares = Object.values(E.deptos).filter(x => x.id !== E.jugador.cargoInfo.depto && x.id !== 'CUN' && x.capital !== Al.depto(E).capital).map(x => ({ nombre: 'Alcaldía de ' + x.capital, depto: x.id, p: 0.3 * 55 + 0.45 * (x.seguridad * 0.5 + x.infraestructura * 0.5) + 0.25 * (50 + U.gauss(0, 12)) + U.gauss(0, 4) })).sort((a, b) => b.p - a.p);
      const mio = { nombre: 'Alcaldía de ' + Al.depto(E).capital + ' (tú)', depto: Al.depto(E).id, p: Al.puntaje(E), yo: true };
      const todos = pares.concat([mio]).sort((a, b) => b.p - a.p);
      const puesto = todos.findIndex(x => x.yo) + 1;
      v.rank = { anio, puesto, total: todos.length, lista: todos.slice(0, 10) };
      const premio = puesto === 1 ? 'Mejor alcalde del país' : puesto <= 3 ? 'Entre los tres mejores alcaldes' : puesto <= 5 ? 'Entre los cinco mejores' : null;
      if (premio) { C.Opinion.subirRec(E, puesto === 1 ? 6 : puesto <= 3 ? 3.5 : 2); Al.ef(E, { aprob: puesto === 1 ? 3 : 1.5, animo: 3 }); E.jugador.reconocimientos.push({ t: E.fecha.t, txt: `${premio} (${anio})` }); }
      Al.anotar(E, `Ranking de alcaldes ${anio}: puesto ${puesto} de ${todos.length}`);
      C.Medios.noticia(E, { tipo: 'regional', titular: puesto === 1 ? `${E.jugador.nombre} es elegido el mejor alcalde del país` : `Ranking de alcaldes ${anio}: ${E.jugador.nombre} queda en el puesto ${puesto}`, tono: puesto <= 5 ? 1 : puesto > 10 ? -1 : 0, jugador: true, importante: puesto <= 3 });
    },
    registrarAcciones() {
      const A = C.Acciones;
      const alc = E => Al.esAlcalde(E) ? true : 'Sólo el alcalde actúa sobre su ciudad';
      const paga = (E, f) => { const v = Al.vida(E), c = Al.fr(E, f); return v.caja >= c ? true : `La caja de libre disposición no alcanza (${(v.caja * 1000).toFixed(0)} de ${(c * 1000).toFixed(0)} millones de pesos)`; };
      const cobra = (E, f) => { Al.vida(E).caja -= Al.fr(E, f); };
      const def = (id, nombre, icono, costo, f, cool, ejecutar) => A.registrar({ id, nombre, icono, grupo: 'ciudad', costo,
        disponible(E, a) { const x = alc(E); if (x !== true) return x; if (cool) { const c = Al.enfriamiento(E, id, cool); if (c !== true) return c; } return f ? paga(E, f) : true; },
        ejecutar(E, a) { if (f) cobra(E, f); if (cool) Al.marcar(E, id); return ejecutar(E, a); } });
      def('operativoEspacio', 'Operativo de recuperación del espacio público', '🚧', 2, 0.004, 13, E => {
        const dura = U.chance(0.35);
        if (dura) { Al.ef(E, { espacio: 11, animo: -3, rec: 0.5 }); return { ok: true, msg: 'Recuperas andenes y plazas, pero los vendedores se organizan y hay forcejeos: ' + Al.ef(E, { aprob: -1 }) }; }
        return { ok: true, msg: 'Operativo ordenado y concertado: ' + Al.ef(E, { espacio: 9, animo: 1, rec: 0.5 }) };
      });
      def('ciclovia', 'Ciclovía dominical y calles peatonales', '🚲', 1, 0.003, 26, E => ({ ok: true, msg: 'Domingos para la gente: ' + Al.ef(E, { animo: 4, cultura: 4, movilidad: -2, aseo: 1, rec: 1 }) }));
      def('picoPlaca', 'Pico y placa', '🚗', 2, 0, 39, E => ({ ok: true, msg: 'El pico y placa descongestiona pero cabrea a los conductores: ' + Al.ef(E, { movilidad: 9, animo: -4, aprob: -0.5 }) }));
      def('planChoque', 'Plan de choque contra los hurtos', '🛡', 2, 0.01, 13, E => ({ ok: true, msg: 'Más policía, cámaras y patrullajes: ' + Al.ef(E, { seg: 3, animo: 2, rec: 1 }) }));
      def('campanaAseo', 'Jornada de limpieza y recolección', '🧹', 1, 0.005, 13, E => ({ ok: true, msg: 'La ciudad amanece reluciente: ' + Al.ef(E, { aseo: 12, animo: 2 }) }));
      def('mercadoCampesino', 'Mercado campesino en el parque', '🥕', 1, 0.003, 13, E => ({ ok: true, msg: 'Productores y compradores sin intermediarios: ' + Al.ef(E, { cultura: 3, espacio: 3, turismo: 2, animo: 2, rec: 0.5 }) }));
      def('cabildoAbierto', 'Cabildo abierto en el barrio', '🗣', 2, 0.001, 8, E => {
        const J = E.jugador, ok = U.chance(U.clamp(0.45 + J.atributos.oratoria / 250 + Al.vida(E).animo / 400, 0.2, 0.85));
        return ok ? { ok: true, msg: 'La comunidad te escucha y se lleva compromisos: ' + Al.ef(E, { animo: 4, concejo: 1, rec: 1.5, aprob: 1 }) } : { ok: true, exito: false, msg: 'Se te sale de las manos: gritos, pancartas y un video viral nada favorable. ' + Al.ef(E, { animo: -2, rec: 0.5 }) };
      });
      def('recorridoNocturno', 'Recorrido nocturno sorpresa', '🌙', 1, 0, 6, E => {
        const r = U.rf(0, 1);
        if (r > 0.75) return { ok: true, msg: 'Sorprendes a un contratista dormido: ' + Al.ef(E, { aseo: 4, rec: 2, aprob: 1 }) };
        if (r < 0.2) return { ok: true, exito: false, msg: 'Un tiktokero te graba con cara de sueño y se hace viral: ' + Al.ef(E, { rec: 1, animo: -1 }) };
        return { ok: true, msg: 'La ciudad nocturna te muestra sus problemas de primera mano: ' + Al.ef(E, { seg: 1, rec: 1.2, animo: 1 }) };
      });
      def('campanaRedes', 'Campaña de TikTok del alcalde', '📱', 1, 0, 6, E => {
        const J = E.jugador, gana = U.chance(U.clamp(0.35 + J.atributos.carisma / 200 + (J.redes || 0) / 400, 0.2, 0.85));
        return gana ? { ok: true, msg: '¡Viral! La ciudad te ama: ' + Al.ef(E, { rec: 3, animo: 2, turismo: 1 }) } : { ok: true, exito: false, msg: 'Baile con coreografía… y te hacen memes: ' + Al.ef(E, { rec: 1, animo: -1, honestidad: -0.5 }) };
      });
      def('actualizarPredial', 'Actualizar el catastro y el predial', '🏘', 3, 0, 52, E => {
        const v = Al.vida(E), ok = U.chance(U.clamp(0.4 + v.concejo / 200, 0.2, 0.85));
        if (!ok) return { ok: true, exito: false, msg: 'El concejo hunde tu proyecto de predial: ' + Al.ef(E, { concejo: -4, rec: 0.5 }) };
        v.caja += Al.fr(E, 0.1); return { ok: true, msg: 'Más recaudo para la ciudad, menos amigos entre los propietarios: ' + Al.ef(E, { animo: -7, aprob: -2, concejo: 2 }) };
      });
      def('negociarConcejo', 'Invitar a los concejales a «desayunar»', '☕', 2, 0.002, 13, E => {
        const turbio = U.chance(0.35); const t = Al.ef(E, { concejo: 12, honestidad: turbio ? -2 : 0 });
        return { ok: true, msg: (turbio ? 'Entre café y empanadas salen los cupos y los contratos: ' : 'Desayuno de trabajo productivo con los concejales: ') + t };
      });
      def('reclamarGobierno', 'Reclamarle al Gobierno Nacional en medios', '📣', 1, 0, 13, E => {
        const pres = E.gobierno.presidente === 'J';
        if (pres) return { ok: false, msg: 'Eres el Presidente: ¿contra quién?' };
        return { ok: true, msg: 'Subes el tono contra Bogotá y la plaza te aplaude: ' + Al.ef(E, { rec: 2.5, animo: 2, gob: -6 }) };
      });
      A.registrar({ id: 'festivalCiudad', nombre: 'Organizar un festival', icono: '🎪', grupo: 'ciudad', costo: 2,
        disponible(E, a) { const x = alc(E); if (x !== true) return x; const F = FESTIVALES[a.tipo]; if (!F) return 'Elige el festival'; const c = Al.enfriamiento(E, 'festival', 20); if (c !== true) return c; return paga(E, F.frac); },
        ejecutar(E, a) {
          const F = FESTIVALES[a.tipo]; cobra(E, F.frac); Al.marcar(E, 'festival');
          if (U.chance(F.riesgo)) { Al.ef(E, { animo: -3, rec: -1, seg: -1 }); C.Medios.noticia(E, { tipo: 'regional', titular: `Incidentes en el ${F.n.toLowerCase()} de ${Al.depto(E).capital}: heridos y críticas al alcalde`, tono: -1, jugador: true }); return { ok: true, exito: false, msg: `${F.n}: se desborda la multitud y hay incidentes. ` + Al.ef(E, F.ef) }; }
          const t = Al.ef(E, Object.assign({ rec: 1.5, aprob: 1 }, F.ef)); return { ok: true, msg: `${F.n} con gran acogida: ${t}` };
        } });
      A.registrar({ id: 'alumbradoNavideno', nombre: 'Alumbrado navideño', icono: '🎄', grupo: 'ciudad', costo: 2,
        disponible(E) { const x = alc(E); if (x !== true) return x; const c = Al.enfriamiento(E, 'alumbrado', 40); if (c !== true) return c; return paga(E, 0.02); },
        ejecutar(E) { cobra(E, 0.02); Al.marcar(E, 'alumbrado'); const turbio = U.chance(0.2); if (turbio) { E.opinion.escandalos = (E.opinion.escandalos || 0) + 1; C.Medios.noticia(E, { tipo: 'control', titular: `Veeduría cuestiona el contrato del alumbrado navideño de ${Al.depto(E).capital}`, tono: -1, jugador: true }); } return { ok: true, msg: 'La ciudad se enciende: ' + Al.ef(E, { animo: 8, turismo: 9, cultura: 3, rec: 1.5, honestidad: turbio ? -2 : 0 }) + (turbio ? ' (pero la veeduría huele sobrecostos)' : '') }; } });
    }
  };
  C.Alcaldia = Al;
  C.Tiempo.registrar('alcaldia', Al, 52);
  Al.registrarAcciones();
})(window.CURUL);
