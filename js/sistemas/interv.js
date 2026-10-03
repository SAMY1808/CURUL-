/* Intervención extranjera (Fase 45): la ayuda y las sanciones de Estados Unidos, su reacción ante golpes según la época (Guerra Fría
   vs. después), el respaldo de Venezuela y Cuba a bandos en una guerra civil, la búsqueda de apoyo externo y el costo de las sanciones. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: tono == null ? 0 : tono, importante: !!imp, jugador: esPres(E) }); };
  const rel = (E, id) => (E.diplomacia.paises[id] || { relacion: 50 }).relacion;
  const iv = {
    clave: 'interv',
    guerraFria: () => { const y = U.anio(); return y >= 1947 && y < 1991; },
    asegurar(E) { if (E.interv && E.interv.ayuda != null) return E.interv; E.interv = { ayuda: 50, sanciones: false, desde: 0, ult: -999, hist: [], sostenes: {} }; return E.interv; },
    init(E) { E.interv = null; }, migrar(E) { iv.asegurar(E); },
    ayuda(E, d) { const v = iv.asegurar(E); v.ayuda = cl(v.ayuda + d, 0, 100); },
    anotar(E, txt) { const v = iv.asegurar(E); v.hist.unshift({ t: E.fecha.t, txt }); if (v.hist.length > 20) v.hist.length = 20; },
    /* Reacción de Washington a un golpe en Colombia */
    reaccionGolpe(E) {
      const r = E.regimen, v = iv.asegurar(E), j = r && r.junta, derecha = j ? (E.politicos[j.lider] ? E.politicos[j.lider].eco >= 0 : true) : true, st = E.diplomacia.paises.USA;
      if (iv.guerraFria() && derecha) { iv.ayuda(E, 12); if (st) st.relacion = cl(st.relacion + 6, 3, 97); noti(E, 'Washington reconoce de inmediato a la junta y elogia su «firmeza anticomunista»', -1, true); iv.anotar(E, 'EE. UU. respalda a la junta'); if (j) j.legit = cl(j.legit + 5, 0, 100); }
      else if (iv.guerraFria()) { iv.ayuda(E, -20); v.sanciones = true; v.desde = E.fecha.t; if (st) st.relacion = cl(st.relacion - 10, 3, 97); noti(E, 'Estados Unidos desconoce a la junta de izquierda y suspende la ayuda', -1, true); iv.anotar(E, 'EE. UU. suspende la ayuda'); }
      else { iv.ayuda(E, -18); v.sanciones = true; v.desde = E.fecha.t; if (st) st.relacion = cl(st.relacion - 8, 3, 97); if (j) j.aislamiento = cl(j.aislamiento + 8, 0, 100); noti(E, 'Estados Unidos condena el golpe, suspende la ayuda y estudia sanciones', -1, true); iv.anotar(E, 'EE. UU. sanciona a la junta'); }
    },
    apoyoRebeldes(E) {
      const y = U.anio(), r = E.regimen; let a = 0;
      if (y >= 1959 && E.diplomacia.paises.CUB && C.MundoVivo.alin('CUB') === 'bolivariano') a += rel(E, 'CUB') * 0.3;
      if (y >= 1999 && E.diplomacia.paises.VEN && C.MundoVivo.alin('VEN') === 'bolivariano') a += rel(E, 'VEN') * 0.3;
      if (r && r.junta && (E.politicos[r.junta.lider] ? E.politicos[r.junta.lider].eco >= 0 : true)) a += 10;
      return cl(a, 0, 60);
    },
    turno(E) {
      const v = iv.asegurar(E), st = E.diplomacia.paises.USA, g = E.ins && E.ins.guerra;
      v.ayuda = cl(v.ayuda + ((st ? st.relacion : 50) - v.ayuda) * 0.01, 0, 100);
      if (v.sanciones) {
        E.economia.confianza = cl(E.economia.confianza - 0.02, 5, 95); E.economia.exportaciones -= 0.004;
        if (C.Regimen && C.Regimen.democratico(E) && E.fecha.t - v.desde > 8) { v.sanciones = false; noti(E, 'Estados Unidos levanta las sanciones: regresa la ayuda', 1); iv.anotar(E, 'Se levantan las sanciones'); }
      }
      if (g && g.activa) g.apoyoExt = iv.apoyoRebeldes(E);
    },
    registrarAcciones() {
      const A = C.Acciones, jefe = E => E.regimen && E.regimen.junta && esPres(E) && E.regimen.junta.lider === 'J';
      A.registrar({ id: 'pedirAyudaExterior', nombre: 'Pedir ayuda a una potencia o a un régimen amigo', icono: '🛰', grupo: 'diplomacia', costo: 2,
        disponible(E, a) { const g = E.ins && E.ins.guerra, soyReb = g && g.activa && g.quien === 'J' && !esPres(E); if (!(esPres(E) || soyReb)) return 'Sólo quien gobierna o encabeza una rebelión'; return ['USA', 'VEN', 'CUB', 'RUS', 'CHN'].includes(a.pais) && E.diplomacia.paises[a.pais] ? true : 'Elige un país'; },
        ejecutar(E, a) { const v = iv.asegurar(E), g = E.ins && E.ins.guerra, soyReb = g && g.activa && g.quien === 'J' && !esPres(E), st = E.diplomacia.paises[a.pais];
          const afin = C.MundoVivo.alin(a.pais), mia = soyReb ? 'bolivariano' : 'occidente', q = cl(0.3 + (st.relacion - 40) / 150 + (afin === mia || a.pais === 'USA' && !soyReb ? 0.15 : -0.1), 0.08, 0.85);
          if (!U.chance(q)) return { ok: true, exito: false, msg: `${(C.Diplomacia.pais(a.pais) || { nombre: a.pais }).nombre} no se compromete` };
          if (soyReb && g) g.apoyoExt = cl((g.apoyoExt || 0) + 12, 0, 100); else iv.ayuda(E, 10);
          if (a.pais !== 'USA' && st) st.relacion = cl(st.relacion + 6, 3, 97); if (a.pais === 'USA') { const x = E.diplomacia.paises.VEN; if (x) x.relacion = cl(x.relacion - 4, 3, 97); }
          iv.anotar(E, `Ayuda de ${a.pais}`); return { ok: true, msg: `${(C.Diplomacia.pais(a.pais) || { nombre: a.pais }).nombre} se compromete a respaldarte con armas, asesores y dinero` }; } });
      A.registrar({ id: 'buscarApoyoEEUU', nombre: 'Buscar el visto bueno de Washington para un golpe', icono: '🕵', grupo: 'regimen', costo: 2,
        disponible(E) { const r = E.regimen; return r && r.consp && r.consp.lider === 'J' && C.Regimen.democratico(E) ? (U.anio() < 1991 ? true : 'Después de la Guerra Fría, Washington ya no apoya golpes') : 'Necesitas una conspiración en marcha'; },
        ejecutar(E) { const r = E.regimen, ok = U.chance(0.55 + (rel(E, 'USA') - 50) / 200); if (ok) { r.consp.avance = Math.min(100, r.consp.avance + 25); if (C.Poderes) C.Poderes.mover(E, 'militares', 5); if (U.chance(0.15)) C.Pais.ef(E, { escandalo: 'Contactos con agentes extranjeros', honestidad: -3 }); return { ok: true, msg: 'Agentes estadounidenses te dan su aprobación tácita y apoyo logístico a la conspiración' }; } E.jugador.rep.honestidad = cl(E.jugador.rep.honestidad - 2, 0, 100); return { ok: true, exito: false, msg: 'Washington prefiere no meterse: sigues solo' }; } });
    }
  };
  C.Interv = iv; C.Tiempo.registrar('interv', iv, 76); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Interv'); iv.registrarAcciones();
  C.Bus.on('regimen:golpe', () => { try { iv.reaccionGolpe(C.E); } catch (e) { console.error('[Interv]', e); } });
  C.Bus.on('regimen:democracia', () => { const E = C.E, v = iv.asegurar(E); if (v.sanciones) { v.sanciones = false; iv.ayuda(E, 15); } });
})(window.CURUL);
