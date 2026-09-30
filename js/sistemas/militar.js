/* Fuerzas armadas y guerra: Ejército, Armada y Fuerza Aérea con su nivel de capacidad, el esfuerzo de gasto
   militar, la compra de armas a distintos proveedores (llegan meses después y tienen costo diplomático) y la
   disuasión que resulta de todo eso. Los frentes —la frontera con Venezuela, el diferendo marítimo con
   Nicaragua— acumulan tensión según la relación bilateral y la balanza de fuerzas: hay incidentes, movilización,
   escalada y, si nadie la frena, guerra abierta, que se resuelve en semanas según el poder relativo, las
   alianzas y la mediación internacional. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const RAMAS = { ejercito: { n: 'Ejército', icono: '🪖' }, armada: { n: 'Armada', icono: '⚓' }, aerea: { n: 'Fuerza Aérea', icono: '✈' } };
  const ESFUERZO = { bajo: { n: 'Austero', k: -0.05, fisc: -0.3 }, medio: { n: 'Normal', k: 0.02, fisc: 0 }, alto: { n: 'Reforzado', k: 0.12, fisc: 0.5 } };
  const SISTEMAS = {
    cazas: { n: 'Cazas multipropósito', rama: 'aerea', icono: '🛩', costo: 5.5, mejora: 14, sem: 40 },
    helicopteros: { n: 'Helicópteros de combate', rama: 'ejercito', icono: '🚁', costo: 2.2, mejora: 8, sem: 24 },
    blindados: { n: 'Blindados y artillería', rama: 'ejercito', icono: '🛡', costo: 3.0, mejora: 12, sem: 30 },
    fragatas: { n: 'Fragatas', rama: 'armada', icono: '🚢', costo: 4.5, mejora: 12, sem: 44 },
    submarinos: { n: 'Submarinos', rama: 'armada', icono: '🌊', costo: 6.0, mejora: 15, sem: 52 },
    antiaerea: { n: 'Defensa antiaérea', rama: 'aerea', icono: '📡', costo: 3.5, mejora: 11, sem: 30 },
    ciber: { n: 'Comando cibernético', rama: 'ejercito', icono: '💻', costo: 1.0, mejora: 5, sem: 16 }
  };
  const PROVEEDORES = {
    USA: { n: 'Estados Unidos', precio: 1.0, cal: 1.1, rel: { USA: 3 }, ofende: ['RUS', 'CHN', 'VEN', 'CUB'] },
    ISR: { n: 'Israel', precio: 0.9, cal: 1.05, rel: { ISR: 3 }, ofende: ['IRN'] },
    KOR: { n: 'Corea del Sur', precio: 0.75, cal: 0.95, rel: { KOR: 3 }, ofende: [] },
    FRA: { n: 'Francia', precio: 1.15, cal: 1.05, rel: { FRA: 3 }, ofende: [] },
    SWE: { n: 'Suecia', precio: 1.1, cal: 1.0, rel: { SWE: 3 }, ofende: [] },
    RUS: { n: 'Rusia', precio: 0.6, cal: 0.85, rel: { RUS: 4 }, ofende: ['USA', 'GBR', 'DEU'] },
    CHN: { n: 'China', precio: 0.55, cal: 0.85, rel: { CHN: 4 }, ofende: ['USA'] }
  };
  const FRENTES_BASE = [
    { id: 'VEN', n: 'Frontera con Venezuela', pais: 'VEN', t: 32, nota: '2.219 km de frontera, grupos armados, migración y disputa por el Golfo de Venezuela' },
    { id: 'NIC', n: 'Diferendo marítimo con Nicaragua', pais: 'NIC', t: 26, nota: 'San Andrés y Providencia: el fallo de La Haya y la pesca en el Caribe' }
  ];
  const ETAPAS = [[85, 'Escalada'], [65, 'Movilización'], [40, 'Tensión'], [0, 'Calma']];

  const Mi = {
    RAMAS, ESFUERZO, SISTEMAS, PROVEEDORES,
    asegurar(E) {
      if (E.militar && E.militar.ramas) return E.militar;
      const anio = U.anio(), base = anio >= 2000 ? 62 : anio >= 1960 ? 50 : 40;
      E.militar = { ramas: { ejercito: base + 6, armada: base - 6, aerea: base - 8 }, esfuerzo: 'medio', moral: 65, compras: [], frentes: FRENTES_BASE.map(f => ({ id: f.id, n: f.n, pais: f.pais, nota: f.nota, tension: f.t, historial: [], ultimoIncidente: -99, mediacion: 0 })), guerra: null, historial: [], ultimaAccion: -99, total: { guerras: 0, victorias: 0 } };
      return E.militar;
    },
    init(E) { E.militar = null; Mi.asegurar(E); },
    migrar(E) { Mi.asegurar(E); },
    nombre(id) { return C.Diplomacia.pais(id) ? C.Diplomacia.pais(id).nombre : id; },
    esPres(E) { return E.gobierno.presidente === 'J'; },
    poder(E) { const m = Mi.asegurar(E); return (m.ramas.ejercito * 0.45 + m.ramas.armada * 0.25 + m.ramas.aerea * 0.3) * (0.75 + m.moral / 400); },
    aliados(E, pid) {
      let b = 0; const dp = E.diplomacia.paises;
      if (dp.USA && dp.USA.tratados.includes('defensa')) b += 6;
      for (const [id, st] of Object.entries(dp)) if (id !== 'USA' && st.tratados.includes('defensa') && st.relacion > 55) b += 1.5;
      const rv = C.MundoVivo.pais(E, pid); if (rv) b -= (C.MundoVivo.bloquesDe(pid).some(x => x.tipo === 'militar') ? 5 : 0);
      return Math.min(14, b);
    },
    disuasion(E) { return U.clamp(Mi.poder(E) * 0.85 + Mi.aliados(E, 'VEN'), 0, 100); },
    poderRival(E, pid) { const p = C.MundoVivo.pais(E, pid); return p ? p.militar * (0.55 + 0.45 * Math.min(1, Math.log10(Math.max(1, p.pib)) / 2.5)) * (p.crisis ? 0.8 : 1) * (p.estab < 30 ? 0.85 : 1) : 40; },
    etapa(f) { return ETAPAS.find(e => f.tension >= e[0])[1]; },
    frente(E, id) { return Mi.asegurar(E).frentes.find(f => f.id === id); },
    anotar(E, txt) { const h = Mi.asegurar(E).historial; h.unshift({ t: E.fecha.t, txt }); if (h.length > 30) h.pop(); },
    noticia(E, txt, tono, imp) { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'seguridad', titular: txt, tono, importante: !!imp, jugador: Mi.esPres(E) }); },

    turno(E) {
      const m = Mi.asegurar(E), ef = ESFUERZO[m.esfuerzo], pres = Mi.esPres(E);
      const pib = E.economia.pib;
      // desgaste y entrenamiento
      for (const k of Object.keys(m.ramas)) m.ramas[k] = U.clamp(m.ramas[k] + ef.k * 0.3 - 0.004 + (m.ramas[k] > 85 ? -0.05 : 0), 15, 98);
      m.moral = U.clamp(m.moral + (E.opinion.aprobacionPres - 45) * 0.0015 + (m.esfuerzo === 'bajo' ? -0.05 : 0.01) - (m.guerra ? 0.06 : 0) + (m.moral > 70 ? -0.02 : 0.01), 15, 95);
      // compras que llegan
      for (const c of m.compras) if (!c.llego && E.fecha.t >= c.llega) {
        c.llego = true; m.ramas[SISTEMAS[c.sistema].rama] = U.clamp(m.ramas[SISTEMAS[c.sistema].rama] + SISTEMAS[c.sistema].mejora * PROVEEDORES[c.prov].cal, 15, 98);
        Mi.anotar(E, `Llegan ${SISTEMAS[c.sistema].n} de ${PROVEEDORES[c.prov].n}`); Mi.noticia(E, `Llegan a Colombia ${SISTEMAS[c.sistema].n.toLowerCase()} adquiridos a ${PROVEEDORES[c.prov].n}`, 1);
      }
      m.compras = m.compras.filter(c => !c.llego || E.fecha.t - c.llega < 26);
      const dis = Mi.disuasion(E);
      for (const f of m.frentes) Mi.turnoFrente(E, m, f, dis, pres);
      if (m.guerra) Mi.turnoGuerra(E, m);
    },

    turnoFrente(E, m, f, dis, pres) {
      const st = E.diplomacia.paises[f.pais], rel = st ? st.relacion : 40, rival = Mi.poderRival(E, f.pais), pv = C.MundoVivo.pais(E, f.pais);
      const cal = pv && pv.crisis ? 0.5 : 0;
      const empuje = (50 - rel) / 500 + (pv && pv.regimen === 'autoritario' ? 0.03 : 0) + (rival > dis ? 0.03 : -0.02) + cal * 0.05 - (f.mediacion > 0 ? 0.08 : 0);
      if (f.mediacion > 0) f.mediacion--;
      if (m.guerra && m.guerra.pais === f.pais) return;
      const base = f.id === 'VEN' ? 30 : 24;
      f.tension = U.clamp(f.tension + empuje + (base - f.tension) * 0.006 + U.gauss(0, 0.5), 3, 100);
      if (E.meta.presim) return;
      // incidentes y escaladas
      const etapa = Mi.etapa(f);
      if (E.fecha.t - f.ultimoIncidente > 14 && U.chance(f.tension / 100 * 0.014)) {
        f.ultimoIncidente = E.fecha.t;
        if (pres) C.Eventos.disparar(E, C.Eventos.plantilla('fronteraIncidente'), { vars: { frente: f.n, pais: Mi.nombre(f.pais) }, frente: f.id, pais: f.pais });
        else { f.tension = Math.min(100, f.tension + U.rf(1, 5)); Mi.noticia(E, `Nuevo incidente en el frente «${f.n}»`, -1); }
      }
      if (f.tension >= 92 && !m.guerra && U.chance(0.012 * (rival > dis ? 1.5 : 0.6))) Mi.abrirGuerra(E, m, f, 'rival');
    },

    abrirGuerra(E, m, f, quien) {
      const pid = f.pais, nom = Mi.nombre(pid);
      m.guerra = { frente: f.id, pais: pid, t0: E.fecha.t, avance: 0, bajas: 0, mediacion: 0, quien, semanas: 0 };
      m.total.guerras++; f.tension = 100;
      C.Economia.programar(E, [{ v: 'crecimiento', d: -0.5, p: 'm' }, { v: 'confianza', d: -2, p: 'm' }, { v: 'deficit', d: 0.6, p: 'm' }], 'guerra');
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + (quien === 'rival' ? U.rf(3, 7) : U.rf(-2, 4)), 3, 95);
      const st = E.diplomacia.paises[pid]; if (st) st.relacion = U.clamp(st.relacion - 25, 3, 97);
      Mi.anotar(E, `Estalla la guerra con ${nom}`);
      Mi.noticia(E, quien === 'rival' ? `${nom} ataca a Colombia: comienza la guerra` : `Colombia y ${nom} entran en guerra abierta`, -1, true);
      if (Mi.esPres(E) && !E.meta.presim) C.Eventos.disparar(E, C.Eventos.plantilla('guerraAbierta'), { vars: { pais: nom }, pais: pid });
    },
    turnoGuerra(E, m) {
      const g = m.guerra, pid = g.pais; g.semanas++;
      const yo = Mi.poder(E) * 0.9 + Mi.aliados(E, pid) * 1.2, el = Mi.poderRival(E, pid) * 0.95 + (C.MundoVivo.bloquesDe(pid).length ? 3 : 0);
      g.avance = U.clamp(g.avance + (yo - el) * 0.12 + U.gauss(0, 1.6), -100, 100);
      g.bajas += Math.round(U.rf(20, 90) * (1 + g.semanas / 30));
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + (g.semanas < 8 ? 0.05 : -0.12), 3, 95);
      m.moral = U.clamp(m.moral - (g.avance < 0 ? 0.25 : 0.05), 15, 95);
      for (const k of Object.keys(m.ramas)) m.ramas[k] = U.clamp(m.ramas[k] - 0.05, 15, 98);
      if (g.semanas % 6 === 0) C.Economia.programar(E, [{ v: 'deficit', d: 0.2, p: 'm' }, { v: 'crecimiento', d: -0.12, p: 'm' }], 'guerra');
      if (g.avance >= 70) Mi.terminarGuerra(E, m, 'victoria');
      else if (g.avance <= -70) Mi.terminarGuerra(E, m, 'derrota');
      else if (g.semanas > 80) Mi.terminarGuerra(E, m, 'tablas');
    },
    terminarGuerra(E, m, res) {
      const g = m.guerra, f = Mi.frente(E, g.frente), nom = Mi.nombre(g.pais), st = E.diplomacia.paises[g.pais];
      if (res === 'victoria') { m.total.victorias++; E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 8, 3, 95); m.moral = Math.min(95, m.moral + 12); if (f) f.tension = 25; Mi.noticia(E, `Colombia se impone a ${nom}: termina la guerra`, 1, true); }
      else if (res === 'derrota') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 12, 3, 95); m.moral = Math.max(15, m.moral - 15); E.jugador.credibilidad = U.clamp(E.jugador.credibilidad - 6, 0, 100); C.Economia.programar(E, [{ v: 'confianza', d: -4, p: 'm' }], 'guerra'); if (f) f.tension = 45; Mi.noticia(E, `Colombia pierde la guerra con ${nom} y acepta un armisticio humillante`, -1, true); }
      else if (res === 'armisticio') { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 2, 3, 95); if (f) f.tension = 40; Mi.noticia(E, `Armisticio con ${nom} bajo mediación internacional`, 1, true); }
      else { if (f) f.tension = 50; Mi.noticia(E, `La guerra con ${nom} se estanca y se firma un cese al fuego`, 0, true); }
      if (st) st.relacion = U.clamp(st.relacion + (res === 'victoria' ? 4 : 10), 3, 97);
      Mi.anotar(E, `Fin de la guerra con ${nom}: ${res} (${g.semanas} semanas, ${g.bajas} bajas)`);
      m.historialGuerras = (m.historialGuerras || []).concat([{ t: E.fecha.t, pais: g.pais, res, semanas: g.semanas, bajas: g.bajas }]);
      m.guerra = null;
    },

    registrarAcciones() {
      const A = C.Acciones, pres = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente comanda las Fuerzas Militares';
      A.registrar({ id: 'fijarEsfuerzoMilitar', nombre: 'Fijar el esfuerzo de gasto militar', icono: '🎖', grupo: 'seguridad', costo: 1, disponible: pres,
        ejecutar(E, a) {
          const m = Mi.asegurar(E), n = ESFUERZO[a.nivel]; if (!n) return { ok: false, msg: 'Elige el esfuerzo de gasto' };
          if (m.esfuerzo === a.nivel) return { ok: false, msg: 'Ya está en ese nivel' };
          const d = n.fisc - ESFUERZO[m.esfuerzo].fisc; C.Economia.programar(E, [{ v: 'deficit', d, p: 'm' }], 'gastomilitar'); m.esfuerzo = a.nivel;
          return { ok: true, msg: `Gasto militar: ${n.n}` };
        } });
      A.registrar({ id: 'comprarArmas', nombre: 'Comprar armamento', icono: '🛒', grupo: 'seguridad', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const m = Mi.asegurar(E), s = SISTEMAS[a.sistema], pv = PROVEEDORES[a.prov]; if (!s) return { ok: false, msg: 'Elige el sistema de armas' }; if (!pv) return { ok: false, msg: 'Elige el proveedor' };
          if (m.compras.filter(c => !c.llego).length >= 4) return { ok: false, msg: 'Ya hay cuatro compras en curso' };
          if (m.compras.some(c => !c.llego && c.sistema === a.sistema)) return { ok: false, msg: 'Ya hay una compra de ese sistema en curso' };
          const costo = +(s.costo * pv.precio).toFixed(2); C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(costo) * 0.5, p: 'm' }], 'armas');
          m.compras.push({ sistema: a.sistema, prov: a.prov, costo, t: E.fecha.t, llega: E.fecha.t + s.sem });
          const dp = E.diplomacia.paises; for (const [id, d] of Object.entries(pv.rel)) if (dp[id]) dp[id].relacion = U.clamp(dp[id].relacion + d, 3, 97);
          for (const id of pv.ofende) if (dp[id]) dp[id].relacion = U.clamp(dp[id].relacion - 3, 3, 97);
          Mi.anotar(E, `Compra: ${s.n} a ${pv.n} por ${costo} billones`);
          return { ok: true, msg: `Ordenas ${s.n.toLowerCase()} a ${pv.n} (${costo} billones): llegan en ${s.sem} semanas` };
        } });
      A.registrar({ id: 'reformaFuerzas', nombre: 'Profesionalizar las Fuerzas', icono: '🎓', grupo: 'seguridad', costo: 2, disponible: pres,
        ejecutar(E) {
          const m = Mi.asegurar(E); if (E.fecha.t - m.ultimaAccion < 26) return { ok: false, msg: 'Acabas de hacer un plan de este tipo: espera unas semanas' };
          m.ultimaAccion = E.fecha.t; m.moral = U.clamp(m.moral + 6, 15, 95); for (const k of Object.keys(m.ramas)) m.ramas[k] = U.clamp(m.ramas[k] + 3, 15, 98);
          C.Economia.programar(E, [{ v: 'deficit', d: 0.15, p: 'm' }], 'reformafuerzas'); return { ok: true, msg: 'Programa de formación y bienestar para la tropa: sube la moral y la capacidad' };
        } });
      A.registrar({ id: 'ejercicioMilitar', nombre: 'Ejercicios militares en el frente', icono: '🎯', grupo: 'seguridad', costo: 1, disponible: pres,
        ejecutar(E, a) {
          const m = Mi.asegurar(E), f = Mi.frente(E, a.frente); if (!f) return { ok: false, msg: 'Elige el frente' }; if (m.guerra) return { ok: false, msg: 'Ya hay una guerra en curso' };
          m.moral = U.clamp(m.moral + 1.5, 15, 95); const st = E.diplomacia.paises[f.pais]; if (st) st.relacion = U.clamp(st.relacion - 2, 3, 97);
          if (Mi.disuasion(E) > Mi.poderRival(E, f.pais)) { f.tension = U.clamp(f.tension - 3, 3, 100); return { ok: true, msg: 'Exhibes fuerza: el vecino lo piensa dos veces' }; }
          f.tension = U.clamp(f.tension + 4, 3, 100); return { ok: true, msg: 'La demostración se lee como provocación: sube la tensión' };
        } });
      A.registrar({ id: 'movilizarTropas', nombre: 'Movilizar tropas al frente', icono: '🪖', grupo: 'seguridad', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const m = Mi.asegurar(E), f = Mi.frente(E, a.frente); if (!f) return { ok: false, msg: 'Elige el frente' }; if (m.guerra) return { ok: false, msg: 'Ya hay una guerra en curso' };
          f.tension = U.clamp(f.tension + 6, 3, 100); m.moral = U.clamp(m.moral + 2, 15, 95); C.Economia.programar(E, [{ v: 'deficit', d: 0.1, p: 'm' }], 'movilizacion');
          E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.5, 3, 95); return { ok: true, msg: `Movilizas tropas en «${f.n}»: sube la disuasión y la tensión` };
        } });
      A.registrar({ id: 'desescalarFrente', nombre: 'Desescalar: diálogo directo', icono: '🤝', grupo: 'seguridad', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const m = Mi.asegurar(E), f = Mi.frente(E, a.frente); if (!f) return { ok: false, msg: 'Elige el frente' }; if (m.guerra && m.guerra.pais === f.pais) return { ok: false, msg: 'Ya están en guerra: pide mediación o negocia el armisticio' };
          const st = E.diplomacia.paises[f.pais], p = U.clamp(0.35 + ((st ? st.relacion : 40) - 40) / 200, 0.15, 0.8);
          if (U.chance(p)) { f.tension = U.clamp(f.tension - U.rf(8, 16), 3, 100); if (st) st.relacion = U.clamp(st.relacion + 4, 3, 97); return { ok: true, msg: 'El diálogo baja la tensión' }; }
          f.tension = U.clamp(f.tension + 2, 3, 100); return { ok: true, msg: 'El vecino se cierra: nada cambia' };
        } });
      A.registrar({ id: 'mediacionFrente', nombre: 'Pedir mediación internacional', icono: '🕊', grupo: 'seguridad', costo: 2, disponible: pres,
        ejecutar(E, a) {
          const m = Mi.asegurar(E), f = Mi.frente(E, a.frente); if (!f) return { ok: false, msg: 'Elige el frente' };
          const q = C.Exterior ? C.Exterior.calidadEfectiva(E, 'USA') : 0, org = (E.diplomacia.organismos.onu && E.diplomacia.organismos.onu.miembro ? 0.1 : 0) + (E.diplomacia.organismos.oea && E.diplomacia.organismos.oea.miembro ? 0.08 : 0);
          const p = U.clamp(0.3 + org + q / 500 + (m.guerra ? -0.05 : 0.1), 0.12, 0.8);
          if (U.chance(p)) {
            if (m.guerra && m.guerra.pais === f.pais) { Mi.terminarGuerra(E, m, 'armisticio'); return { ok: true, msg: 'La mediación logra un armisticio' }; }
            f.tension = U.clamp(f.tension - U.rf(12, 22), 3, 100); f.mediacion = 26; return { ok: true, msg: 'Un mediador reúne a las partes: baja la tensión por varios meses' };
          }
          return { ok: true, msg: 'La mediación no prospera esta vez' };
        } });
      A.registrar({ id: 'ordenarOfensiva', nombre: 'Ordenar la ofensiva (guerra)', icono: '💥', grupo: 'seguridad', costo: 3, disponible: pres,
        ejecutar(E, a) {
          const m = Mi.asegurar(E), f = Mi.frente(E, a.frente); if (!f) return { ok: false, msg: 'Elige el frente' }; if (m.guerra) return { ok: false, msg: 'Ya hay una guerra en curso' };
          if (f.tension < 60) return { ok: false, msg: 'Sin una crisis abierta nadie apoyaría una guerra: la tensión debe superar 60' };
          Mi.abrirGuerra(E, m, f, 'yo'); return { ok: true, msg: `Ordenas la ofensiva contra ${Mi.nombre(f.pais)}` };
        } });
    }
  };
  C.Militar = Mi;
  C.Tiempo.registrar('militar', Mi, 64);
  Mi.registrarAcciones();
})(window.CURUL);
