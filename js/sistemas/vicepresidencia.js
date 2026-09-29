/* Vicepresidencia: la fórmula se escoge en la campaña (un copartidario, un aliado de otro partido o
   una figura independiente), pesa en los votos y decide quién entra al Gobierno. Ya en el poder,
   el vicepresidente recibe un encargo que rinde según su gestión, tiene una lealtad que sube o baja
   con su ambición y su encargo —y puede romper con el Presidente y lanzarse por su cuenta— y es quien
   asume si falta el Presidente: por muerte, renuncia, pérdida de investidura, fin de la carrera del
   jugador o revocatoria. Si la vicepresidencia queda vacante, el Congreso elige reemplazo. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const ENCARGOS = {
    ninguno: 'Sin encargo', paz: 'Paz y seguridad', anticorrupcion: 'Lucha anticorrupción',
    diplomacia: 'Diplomacia y relaciones exteriores', coordinacion: 'Coordinación del gabinete'
  };
  const EXTRAS = {
    regional: { n: 'Líder regional', desc: 'Arrastre fuerte en su departamento.' },
    mediatica: { n: 'Figura mediática', desc: 'Suma votos por su nombre; poco recorrido.' },
    tecnico: { n: 'Técnico con trayectoria', desc: 'Credibilidad; suma pocos votos.' }
  };

  const V = {
    ENCARGOS, EXTRAS,
    aporte: p => Math.round(p.fuerza * 0.6 + p.r.car * 0.25 + p.r.exp * 0.15),
    actual(E) { return E.politicos[E.gobierno.vice] || null; },
    asegurar(p) { if (!p.vp) p.vp = { encargo: 'ninguno', lealtad: 60, gestion: Math.round(35 + p.r.exp * 0.3 + p.r.int * 0.2), ruptura: false }; return p.vp; },

    /* ── Fórmula del jugador ── */
    camPres(E) { const cam = E.elecciones.campana; return cam && cam.cargo === 'presidencia' ? cam : null; },
    extras(E, cam) {
      if (cam.formulaExtras) return cam.formulaExtras.map(id => E.politicos[id]).filter(Boolean);
      const mk = (tipo) => {
        const depto = U.pesado(C.DATA.departamentos, d => d.poblacion).id;
        const p = C.Politicos.crear(E, { partido: null, depto, cargo: null });
        if (tipo === 'regional') { p.fuerza = U.ri(58, 74); p.r.car = U.ri(45, 70); p.r.exp = U.ri(30, 55); p.profesion = 'Líder regional'; }
        if (tipo === 'mediatica') { p.fuerza = U.ri(62, 80); p.r.car = U.ri(70, 92); p.r.exp = U.ri(10, 30); p.r.int = U.ri(25, 55); p.profesion = 'Figura mediática'; }
        if (tipo === 'tecnico') { p.fuerza = U.ri(42, 58); p.r.car = U.ri(40, 60); p.r.exp = U.ri(65, 90); p.r.int = U.ri(70, 95); p.profesion = 'Técnico'; }
        p.extraFormula = tipo; return p;
      };
      const ps = Object.keys(EXTRAS).map(mk); cam.formulaExtras = ps.map(p => p.id); return ps;
    },
    opciones(E) {
      const cam = V.camPres(E), J = E.jugador; if (!cam) return [];
      const uno = (p, tipo) => ({ p, tipo, aporte: V.aporte(p) });
      const propios = J.partido ? C.Partidos.miembros(E, J.partido).filter(p => p.id !== 'J' && C.Elecciones.edadOK(p)).map(p => uno(p, 'copartidario')).sort((a, b) => b.aporte - a.aporte).slice(0, 5) : [];
      const aliados = [];
      for (const al of cam.coalicion || []) {
        if (!al.partido || al.partido === J.partido) continue;
        const m = C.Partidos.miembros(E, al.partido).filter(p => C.Elecciones.edadOK(p)).map(p => uno(p, 'aliado')).sort((a, b) => b.aporte - a.aporte).slice(0, 2);
        aliados.push(...m);
      }
      return [...propios, ...aliados.slice(0, 4), ...V.extras(E, cam).map(p => uno(p, 'independiente'))];
    },
    elegirFormula(E, polId) {
      const cam = V.camPres(E), p = E.politicos[polId], prev = cam.formula && E.politicos[cam.formula.vice];
      if (prev && prev.id !== polId) prev.relJ = U.clamp((prev.relJ || 0) - 8, -100, 100);
      cam.formula = { vice: polId, t: E.fecha.t, aliado: p.partido && p.partido !== E.jugador.partido ? p.partido : null };
      p.relJ = U.clamp((p.relJ || 0) + 10, -100, 100);
      if (cam.formula.aliado && E.partidos[cam.formula.aliado]) E.partidos[cam.formula.aliado].relJ = U.clamp((E.partidos[cam.formula.aliado].relJ || 0) + 8, -100, 100);
      C.Medios.noticia(E, { tipo: 'campana', titular: `${E.jugador.nombre} anuncia a ${p.nombre} como su fórmula vicepresidencial`, tono: 1, importante: true, jugador: true });
      return p;
    },
    /* Bono a la fuerza electoral del jugador por su fórmula. */
    bonusFormula(E, dId) {
      const cam = E.elecciones.campana; if (!cam || cam.cargo !== 'presidencia' || !cam.formula) return 0;
      const v = E.politicos[cam.formula.vice]; if (!v) return 0;
      let b = (V.aporte(v) - 55) * 0.1;
      if (dId && v.depto === dId) b += 4;
      if (cam.formula.aliado && E.partidos[cam.formula.aliado]) b += E.partidos[cam.formula.aliado].popularidad * 0.25;
      return b;
    },
    /* La fórmula que corre con el jugador: la que eligió o, si no eligió, la mejor de su partido. */
    formulaDeJ(E) {
      const cam = V.camPres(E), J = E.jugador; if (!cam) return null;
      if (cam.formula && E.politicos[cam.formula.vice] && E.politicos[cam.formula.vice].activo) return cam.formula.vice;
      const ops = V.opciones(E).filter(o => o.tipo === 'copartidario');
      const p = ops.length ? ops[0].p : V.extras(E, cam)[0];
      V.elegirFormula(E, p.id);
      C.Medios.noticia(E, { tipo: 'campana', titular: `${J.nombre} completa su fórmula con ${p.nombre} al vencerse el plazo de inscripción`, tono: 0, jugador: true });
      return p.id;
    },
    /* Fórmula de un candidato que no es el jugador. */
    formulaNPC(E, cand, usados) {
      const propio = E.politicos[cand.pol]; if (!propio) return null;
      const libres = p => p.activo && p.id !== cand.pol && !usados.includes(p.id) && p.id !== 'J' && C.Elecciones.edadOK(p);
      const mejor = ps => ps.filter(libres).sort((a, b) => V.aporte(b) - V.aporte(a))[0];
      let v = null; const r = U.r();
      if (r < 0.6) v = mejor(C.Partidos.miembros(E, cand.partido));
      else if (r < 0.9) {
        const aliado = Object.values(E.partidos).filter(x => !x.especial && !x.futuro && x.id !== cand.partido && U.distIdeo(x, propio) < 0.35).sort((a, b) => U.distIdeo(a, propio) - U.distIdeo(b, propio))[0];
        if (aliado) v = mejor(C.Partidos.miembros(E, aliado.id));
      }
      if (!v) { v = C.Politicos.crear(E, { partido: U.chance(0.5) ? cand.partido : null, depto: U.pesado(C.DATA.departamentos, d => d.poblacion).id, cargo: null }); v.profesion = 'Técnico'; v.r.exp = U.ri(50, 85); }
      usados.push(v.id); return v.id;
    },
    bonusNPC(E, c) { const v = c.vice && E.politicos[c.vice]; return v ? (V.aporte(v) - 55) * 0.02 : 0; },

    /* ── Instalación y gobierno ── */
    instalar(E, electo, partido) {
      const G = C.Gobierno;
      let vice = electo.vice && E.politicos[electo.vice] ? E.politicos[electo.vice] : null;
      if (!vice) vice = C.Politicos.crear(E, { partido, depto: U.pick(Object.keys(E.deptos)), cargo: null });
      if (vice.cargo && (vice.cargo.tipo === 'senador' || vice.cargo.tipo === 'representante')) G.vacante(E, vice);
      vice.cargo = { tipo: 'vicepresidente' }; vice.activo = true;
      delete vice.vp; V.asegurar(vice);
      vice.vp.lealtad = U.clamp(60 + (vice.partido === partido ? 8 : 0) + (electo.vice ? 6 : 0) + U.gauss(0, 5), 30, 90);
      C.Politicos.anotar(vice, 'Se posesiona como Vicepresidente de la República');
      return vice;
    },
    /* El partido del vicepresidente que ganó con la fórmula entra a la coalición de gobierno. */
    integrarCoalicion(E) {
      const g = E.gobierno, v = V.actual(E);
      if (v && v.partido && E.partidos[v.partido] && !g.coalicion.includes(v.partido)) { g.coalicion.push(v.partido); E.partidos[v.partido].postura = 'gobierno'; }
    },
    turno(E) {
      const g = E.gobierno; if (!g || !g.presidente || E.meta.presim) return;
      if (g.presidente !== 'J' && U.chance(0.00012)) V.faltaAbsoluta(E, U.chance(0.5) ? 'fallecimiento' : 'renuncia');
      const vp = V.actual(E);
      if (!vp) {
        if (g.viceVacante != null && E.fecha.t >= g.viceVacante + 8) V.elegirEnCongreso(E);
        return;
      }
      const s = V.asegurar(vp), gest = s.gestion / 100, aprob = E.opinion.aprobacionPres;
      const obj = 55 + (aprob - 50) * 0.5 + (s.encargo !== 'ninguno' ? 10 : (vp.r.amb > 60 ? -8 : -2)) + (vp.partido === g.partido ? 8 : 0) - (vp.r.amb - 50) * 0.25;
      s.lealtad = U.clamp(s.lealtad + (obj - s.lealtad) * 0.02, 0, 100);
      s.gestion = U.clamp(s.gestion + (s.encargo !== 'ninguno' ? (85 - s.gestion) * 0.004 : -0.01), 20, 95);
      if (s.encargo === 'paz') E.opinion.aprobTemas.seguridad = U.clamp(E.opinion.aprobTemas.seguridad + 0.03 * gest, 3, 95);
      else if (s.encargo === 'anticorrupcion') { E.opinion.aprobTemas.corrupcion = U.clamp(E.opinion.aprobTemas.corrupcion + 0.03 * gest, 3, 95); E.opinion.escandalos = Math.max(0, E.opinion.escandalos - 0.004 * gest); }
      else if (s.encargo === 'diplomacia' && E.diplomacia) { const p = U.pick(C.Diplomacia.destacados()); if (p) E.diplomacia.paises[p.id].relacion = U.clamp(E.diplomacia.paises[p.id].relacion + 0.06 * gest, 3, 97); }
      else if (s.encargo === 'coordinacion') for (const id of Object.values(g.gabinete)) { const m = E.politicos[id]; if (m && m.gestion != null) m.gestion = U.clamp(m.gestion + 0.012 * gest, 0, 100); }
      if (!s.ruptura && s.lealtad < 28 && vp.r.amb > 60 && U.chance(0.03)) {
        s.ruptura = true; vp.aspiraAnuncio = { destino: 'presidencia', t: E.fecha.t };
        E.opinion.aprobacionPres = U.clamp(aprob - 1.2, 3, 95);
        C.Politicos.anotar(vp, 'Marca distancia del Presidente y deja ver su aspiración presidencial');
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `El vicepresidente ${vp.nombre} marca distancia del Presidente y deja ver su aspiración presidencial`, tono: -1, importante: true, jugador: g.presidente === 'J' });
      } else if (s.ruptura && s.lealtad > 55) {
        s.ruptura = false;
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `${vp.nombre} y el Presidente cierran filas de nuevo`, tono: 1, jugador: g.presidente === 'J' });
      }
    },
    elegirEnCongreso(E) {
      const g = E.gobierno, partido = g.partido;
      const v = C.Politicos.crear(E, { partido, depto: U.pick(Object.keys(E.deptos)), cargo: { tipo: 'vicepresidente' } });
      V.asegurar(v); g.vice = v.id; g.viceVacante = null;
      C.Politicos.anotar(v, 'Elegido/a por el Congreso para completar el periodo vicepresidencial');
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Congreso elige a ${v.nombre} como vicepresidente para completar el periodo`, tono: 0, jugador: g.presidente === 'J' });
    },
    /* Falta absoluta del Presidente: asume el vicepresidente (o, si no hay, uno del partido de gobierno). */
    faltaAbsoluta(E, motivo) {
      const g = E.gobierno, ex = g.presidente, J = E.jugador;
      if (!ex) return null;
      let nuevo = V.actual(E);
      if (!nuevo) nuevo = C.Politicos.crear(E, { partido: g.partido, depto: U.pick(Object.keys(E.deptos)), cargo: null });
      if (ex === 'J' && J.cargo === 'presidente') C.Personaje.dejarCargo(E, motivo === 'revocatoria' ? 'Es revocado del mandato' : 'Falta absoluta del Presidente');
      const exPol = E.politicos[ex];
      if (ex !== 'J' && exPol) {
        if (motivo === 'fallecimiento') { exPol.activo = false; exPol.cargo = null; } else exPol.cargo = { tipo: 'expresidente' };
        C.Politicos.anotar(exPol, motivo === 'fallecimiento' ? 'Fallece en ejercicio del cargo' : 'Deja la Presidencia antes de terminar su periodo');
      }
      if (nuevo.cargo && (nuevo.cargo.tipo === 'senador' || nuevo.cargo.tipo === 'representante')) C.Gobierno.vacante(E, nuevo);
      nuevo.cargo = { tipo: 'presidente' }; nuevo.aspiraOtro = null; nuevo.activo = true; delete nuevo.vp;
      g.presidente = nuevo.id; g.vice = null; g.viceVacante = E.fecha.t; g.sucesion = { t: E.fecha.t, motivo, de: ex };
      if (nuevo.partido && nuevo.partido !== g.partido && E.partidos[nuevo.partido]) { g.partido = nuevo.partido; C.Gobierno.formarCoalicion(E); }
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres * 0.6 + 20, 10, 80);
      C.Politicos.anotar(nuevo, 'Asume la Presidencia por falta absoluta del titular');
      const nomEx = ex === 'J' ? J.nombre : (exPol ? exPol.nombre : 'el Presidente');
      const causa = { fallecimiento: 'muere', renuncia: 'renuncia', investidura: 'pierde la investidura', revocatoria: 'es revocado del mandato', retiro: 'deja la vida pública', condena: 'es condenado', fallecimientoJ: 'muere' }[motivo] || 'deja el cargo';
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `${nomEx} ${causa}: ${nuevo.nombre} asume la Presidencia de la República`, tono: -1, importante: true, jugador: ex === 'J' });
      C.Congreso.log(E, 'gobierno', `${nuevo.nombre} asume la Presidencia por falta absoluta de ${nomEx}`);
      C.Bus.emit('gobierno:sucesion', { de: ex, a: nuevo.id, motivo });
      return nuevo;
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'elegirFormula', nombre: 'Escoger como fórmula', icono: '🤝', grupo: 'campana', costo: 1,
        disponible(E, a) {
          const cam = V.camPres(E); if (!cam) return 'Sólo si eres candidato a la Presidencia';
          if (cam.formula && cam.formula.vice === a.pol) return 'Ya es tu fórmula';
          return V.opciones(E).some(o => o.p.id === a.pol) ? true : 'Ese nombre ya no está disponible';
        },
        ejecutar(E, a) { const p = V.elegirFormula(E, a.pol); return { ok: true, msg: `${p.nombre} será tu fórmula vicepresidencial` }; } });
      A.registrar({ id: 'asignarEncargoVice', nombre: 'Asignar encargo', icono: '📌', grupo: 'gobierno', costo: 1,
        disponible(E) { if (E.gobierno.presidente !== 'J') return 'Sólo el Presidente'; return V.actual(E) ? true : 'No hay vicepresidente en ejercicio'; },
        ejecutar(E, a) {
          if (!ENCARGOS[a.encargo]) return { ok: false, msg: 'Elige un encargo' };
          const vp = V.actual(E), s = V.asegurar(vp);
          if (s.encargo === a.encargo) return { ok: false, msg: 'Ya tiene ese encargo' };
          s.encargo = a.encargo; s.lealtad = U.clamp(s.lealtad + (a.encargo === 'ninguno' ? -6 : 5), 0, 100);
          return { ok: true, msg: a.encargo === 'ninguno' ? `${vp.nombre} queda sin encargo` : `${vp.nombre} asume: ${ENCARGOS[a.encargo].toLowerCase()}` };
        } });
      A.registrar({ id: 'reunirConVice', nombre: 'Reunirte con el vicepresidente', icono: '☕', grupo: 'gobierno', costo: 1,
        disponible(E) { if (E.gobierno.presidente !== 'J') return 'Sólo el Presidente'; return V.actual(E) ? true : 'No hay vicepresidente en ejercicio'; },
        ejecutar(E) { const vp = V.actual(E), s = V.asegurar(vp); s.lealtad = U.clamp(s.lealtad + 8, 0, 100); vp.relJ = U.clamp((vp.relJ || 0) + 4, -100, 100); return { ok: true, msg: `Te reúnes con ${vp.nombre}: sube su lealtad` }; } });
    }
  };

  C.Vice = V;
  C.Tiempo.registrar('vicepresidencia', V, 52);
  V.registrarAcciones();
})(window.CURUL);
