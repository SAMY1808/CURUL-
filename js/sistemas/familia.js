/* Familia: los hijos del jugador crecen, estudian y tienen relación propia con él; cuando el
   jugador se retira o fallece, uno de sus hijos adultos puede continuar el legado político —
   o la partida termina ahí, con un resumen de la carrera. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const EDUCACION = ['Bachiller', 'Técnico', 'Profesional', 'Especialización', 'Maestría', 'Doctorado'];

  const Fam = {
    EDUCACION,
    hijos(E) { return (E.jugador.familia || []).filter(f => f.rol === 'Hijo' || f.rol === 'Hija'); },
    adulto: f => f.edad >= 18,
    /* Asegura que cada hijo tenga los campos nuevos (partidas guardadas antes de esta entrega). */
    asegurarDatos(E) {
      const J = E.jugador; if (Fam.asegurarPareja) Fam.asegurarPareja(E);
      for (const f of Fam.hijos(E)) {
        if (f.id == null) f.id = U.id('hij');
        if (!f.genero) f.genero = f.rol === 'Hija' ? 'f' : 'm';
        if (f.relacion == null) f.relacion = 60;
        if (!f.educacion) f.educacion = f.edad >= 22 ? 'Profesional' : f.edad >= 17 ? 'Bachiller' : 'Ninguna';
        if (!f.atributos) f.atributos = { carisma: U.ri(35, 70), oratoria: U.ri(35, 70), gestion: U.ri(35, 70), negociacion: U.ri(35, 70), integridad: U.ri(35, 70) };
        if (!f.ideologia) f.ideologia = { eco: U.clamp(J.ideologia.eco + U.gauss(0, 22), -100, 100), soc: U.clamp(J.ideologia.soc + U.gauss(0, 22), -100, 100) };
      }
    },
    /* Cumpleaños: hitos y desgaste natural de la relación si no le dedicas tiempo. */
    turnoAnual(E) {
      Fam.asegurarDatos(E);
      for (const f of Fam.hijos(E)) {
        if (f.edad === 22 && !f.graduado) {
          f.graduado = true;
          if (EDUCACION.indexOf(f.educacion) < 2) f.educacion = 'Profesional';
          C.Medios.noticia(E, { tipo: 'personal', titular: `${f.nombre}, hijo de ${E.jugador.nombre}, se gradúa como ${f.educacion.toLowerCase()}`, tono: 1 });
        }
        f.relacion = U.clamp(f.relacion - 0.8 + U.gauss(0, 0.4), 0, 100);
      }
    },
    /* Peso político de un hijo si heredara la carrera hoy: sólo para mostrarlo en la interfaz. */
    potencial(f) {
      return Math.round((f.atributos.carisma + f.atributos.negociacion + f.relacion) / 3);
    },
    /* ── Fin de la carrera del jugador (retiro voluntario o fallecimiento) ── */
    candidatosSucesion(E) {
      return Fam.hijos(E).filter(f => Fam.adulto(f) && !f.fallecido);
    },
    finDeCarrera(E, motivo) {
      Fam.asegurarDatos(E);
      const J = E.jugador;
      const resumen = {
        nombre: J.nombre, motivo,
        cargoFinal: C.DATA.cargos[J.cargo].nombre,
        anios: U.anio() - J.nac,
        cargosOcupados: (J.ocupados || []).map(o => C.DATA.cargos[o] ? C.DATA.cargos[o].nombre : o),
        eleccionesGanadas: (J.historialElectoral || []).filter(h => h.electo).length,
        leyesAprobadas: (J.historialLegislativo || []).filter(h => h.resultado === 'ley').length,
        patrimonio: J.patrimonio + (C.Propiedades ? C.Propiedades.valorTotal(E) : 0)
      };
      if (C.Legado) { const lp = C.Legado.puntos(E); resumen.legadoPuntos = lp; resumen.veredicto = C.Legado.titulo(lp); }
      // Si eres Presidente, la Presidencia pasa al vicepresidente: la familia sólo hereda el apellido.
      if (E.gobierno.presidente === 'J' && C.Vice) C.Vice.faltaAbsoluta(E, motivo === 'condena' ? 'condena' : motivo === 'retiro' ? 'retiro' : 'fallecimiento');
      const candidatos = Fam.candidatosSucesion(E);
      if (candidatos.length) E.ui.sucesionPendiente = { motivo, resumen, candidatos: candidatos.map(f => f.id) };
      else E.ui.finPartida = { motivo, resumen };
    },
    /* El hijo elegido asume la vida pública de la familia. Reutiliza Personaje.crear (con un
       origen dedicado) para no dejar el objeto del jugador con campos a medias, y luego le
       superpone lo que sí trae de fábrica: sus propios atributos, ideología y relación con el
       apellido de la familia. */
    heredar(E, hijoId) {
      Fam.asegurarDatos(E);
      const J = E.jugador;
      const hijo = J.familia.find(f => f.id === hijoId); if (!hijo) return null;
      const apellido = J.nombre.trim().split(' ').slice(-1)[0];
      const heredado = Math.round(U.clamp(J.reconocimiento * 0.3, 4, 35));
      const inicioPatrimonio = Math.round(Math.max(25, J.patrimonio * 0.4));
      const hermanos = J.familia.filter(f => f.id !== hijoId && (f.rol === 'Hijo' || f.rol === 'Hija'));
      const pendiente = E.ui.sucesionPendiente; const legado = { predecesor: J.nombre, cargoMaximo: pendiente && pendiente.resumen ? pendiente.resumen.cargoFinal : (C.DATA.cargos[J.cargo] ? C.DATA.cargos[J.cargo].nombre : null), apellido, eleccionesGanadas: (J.historialElectoral || []).filter(h => h.electo).length };
      const cfg = {
        nombre: hijo.nombre, genero: hijo.genero, edad: Math.max(18, hijo.edad),
        eco: hijo.ideologia.eco, soc: hijo.ideologia.soc,
        origen: 'heredero', educacion: hijo.educacion === 'Ninguna' ? 'Profesional' : hijo.educacion, profesion: 'Heredero político',
        partido: J.partido, residencia: J.residencia, nacimiento: J.residencia
      };
      const polHijo = hijo.politicoId && E.politicos[hijo.politicoId];
      const nuevo = C.Personaje.crear(E, cfg);
      Object.assign(nuevo.atributos, hijo.atributos);
      nuevo.reconocimiento = U.clamp(nuevo.reconocimiento + heredado + (polHijo ? Math.round(polHijo.fuerza * 0.2) : 0), 0, 100);
      if (polHijo) { if (polHijo.cargo && polHijo.cargo.tipo !== 'aspirante') nuevo.legadoCargoPropio = polHijo.cargo.tipo; polHijo.activo = false; C.Politicos.anotar(polHijo, 'Asume el legado político de la familia'); }
      nuevo.patrimonio = inicioPatrimonio;
      nuevo.bienes = [];
      nuevo.familia = [{ rol: J.genero === 'f' ? 'Madre' : 'Padre', nombre: J.nombre, edad: U.anio() - J.nac, id: U.id('fam') }, ...hermanos];
      nuevo.legado = legado;
      C.Personaje.sincronizar(E);
      C.Medios.noticia(E, { tipo: 'personal', titular: `${nuevo.nombre} asume el legado político de la familia ${apellido}`, tono: 1, importante: true, jugador: true });
      return nuevo;
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'pasarTiempoHijo', nombre: 'Pasar tiempo con un hijo', icono: '👨‍👧', grupo: 'familia', costo: 1,
        disponible(E, a) { return Fam.hijos(E).some(f => f.id === a.hijo) ? true : 'Elige un hijo'; },
        ejecutar(E, a) {
          const f = Fam.hijos(E).find(x => x.id === a.hijo);
          f.relacion = U.clamp(f.relacion + U.rf(4, 9), 0, 100);
          E.jugador.bienestar = U.clamp((E.jugador.bienestar || 60) + 4, 0, 100);
          return { ok: true, msg: `Te acercas más a ${f.nombre}` };
        } });
      A.registrar({ id: 'pagarEducacionHijo', nombre: 'Pagar sus estudios', icono: '🎓', grupo: 'familia', costo: 1,
        disponible(E, a) {
          const f = Fam.hijos(E).find(x => x.id === a.hijo); if (!f) return 'Elige un hijo';
          if (f.edad < 16) return 'Aún es muy joven para eso';
          const i = EDUCACION.indexOf(f.educacion === 'Ninguna' ? 'Bachiller' : f.educacion);
          if (i >= EDUCACION.length - 1) return 'Ya tiene el máximo nivel educativo';
          return E.jugador.patrimonio >= 35 ? true : 'Necesitas $35 millones';
        },
        ejecutar(E, a) {
          const f = Fam.hijos(E).find(x => x.id === a.hijo);
          E.jugador.patrimonio -= 35;
          const i = EDUCACION.indexOf(f.educacion === 'Ninguna' ? 'Bachiller' : f.educacion);
          f.educacion = EDUCACION[Math.min(EDUCACION.length - 1, i + 1)];
          f.atributos.gestion = U.clamp(f.atributos.gestion + 5, 0, 100);
          f.relacion = U.clamp(f.relacion + 3, 0, 100);
          return { ok: true, msg: `${f.nombre} avanza: ahora es ${f.educacion.toLowerCase()}` };
        } });
      A.registrar({ id: 'retirarseVida', nombre: 'Retirarte de la vida pública', icono: '🌅', grupo: 'carrera', costo: 0,
        ejecutar(E) { Fam.finDeCarrera(E, 'retiro'); return { ok: true, msg: 'Te retiras de la vida pública' }; } });
      A.registrar({ id: 'elegirSucesor', nombre: 'Continuar el legado', icono: '👪', grupo: 'familia', costo: 0,
        disponible: (E, a) => (E.ui.sucesionPendiente || {}).candidatos && E.ui.sucesionPendiente.candidatos.includes(a.hijo) ? true : 'No disponible',
        ejecutar(E, a) { Fam.heredar(E, a.hijo); E.ui.sucesionPendiente = null; return { ok: true, msg: 'La familia continúa en la vida pública' }; } });
      A.registrar({ id: 'terminarPartida', nombre: 'Terminar aquí', icono: '🏁', grupo: 'familia', costo: 0,
        ejecutar(E) { const p = E.ui.sucesionPendiente; E.ui.finPartida = { motivo: p ? p.motivo : 'retiro', resumen: p ? p.resumen : null }; E.ui.sucesionPendiente = null; return { ok: true, msg: 'Termina la carrera política de la familia' }; } });
    }
  };

  /* ── Fase 28: pareja con vida propia, más hijos, y una dinastía que empieza antes del retiro ── */
  const PAPELES = {
    hogar: { n: 'Vida privada', txt: 'Se mantiene al margen: cero riesgo, cero aporte público.' },
    campana: { n: 'Estratega de campaña', txt: 'Acompaña giras y campañas: suma reconocimiento y cercanía, pero también desgasta.' },
    social: { n: 'Gestora social', txt: 'Lidera programas sociales de tu despacho: suma aprobación si tienes cargo ejecutivo.' },
    propia: { n: 'Carrera política propia', txt: 'Se lanza a la vida pública con tu partido y tu apellido.' }
  };
  const TIPOS_PAREJA = {
    politica: { n: 'De familia política', txt: 'Trae contactos y apoyos: sube el reconocimiento y la relación con los partidos.' },
    empresaria: { n: 'Empresaria', txt: 'Aporta patrimonio e ingresos, y algún riesgo de conflicto de intereses.' },
    civil: { n: 'De la sociedad civil', txt: 'Más bienestar y credibilidad; poco aporte político.' }
  };
  Fam.PAPELES = PAPELES; Fam.TIPOS_PAREJA = TIPOS_PAREJA;
  Fam.pareja = E => (E.jugador.familia || []).find(f => f.rol === 'Pareja') || null;
  Fam.asegurarPareja = E => {
    const J = E.jugador, f = Fam.pareja(E); if (!f) return null;
    if (f.id == null) f.id = U.id('par');
    if (!f.genero) f.genero = J.genero === 'f' ? 'm' : 'f';
    if (f.relacion == null) f.relacion = 65;
    if (!f.papel) f.papel = 'hogar';
    if (!f.profesion) f.profesion = U.pick(['Abogada', 'Economista', 'Médica', 'Docente', 'Empresaria', 'Periodista']);
    if (!f.atributos) f.atributos = { carisma: U.ri(35, 75), oratoria: U.ri(35, 75), gestion: U.ri(35, 75), negociacion: U.ri(35, 75), integridad: U.ri(35, 75) };
    if (!f.ideologia) f.ideologia = { eco: U.clamp(J.ideologia.eco + U.gauss(0, 18), -100, 100), soc: U.clamp(J.ideologia.soc + U.gauss(0, 18), -100, 100) };
    return f;
  };
  Fam.familiaPolitica = E => {
    const out = [];
    for (const f of E.jugador.familia || []) if (f.politicoId && E.politicos[f.politicoId]) out.push({ f, p: E.politicos[f.politicoId] });
    return out;
  };
  Fam.puntosDinastia = E => {
    const nivel = { concejal: 1, diputado: 2, alcalde: 3, representante: 3, senador: 5, gobernador: 5, ministro: 5, presidente: 10 };
    return Fam.familiaPolitica(E).reduce((a, x) => a + (x.p.cargo ? nivel[x.p.cargo.tipo] || 0.5 : 0), 0);
  };
  Fam.entrarEnPolitica = (E, f, aspira) => {
    const J = E.jugador, apellido = J.nombre.trim().split(' ').slice(-1)[0];
    const nombre = f.rol === 'Pareja' ? f.nombre : f.nombre.includes(apellido) ? f.nombre : f.nombre + ' ' + apellido;
    const p = C.Politicos.crear(E, { nombre, genero: f.genero, edad: Math.max(21, f.edad), partido: E.partidos[J.partido] && !E.partidos[J.partido].disuelto ? J.partido : null, depto: J.residencia, eco: f.ideologia.eco, soc: f.ideologia.soc, cargo: { tipo: 'aspirante', aspira } });
    p.fuerza = U.clamp(Math.round(10 + J.reconocimiento * 0.35 + (f.relacion || 50) * 0.1 + (f.atributos.carisma - 50) * 0.2), 12, 75);
    p.dinastia = { padre: 'J', padreNombre: J.nombre, apellido }; p.relJ = 60; p.familiaDeJ = f.rol;
    f.politicoId = p.id;
    C.Politicos.anotar(p, `Entra en política de la mano de ${J.nombre}`);
    C.Medios.noticia(E, { tipo: 'partidos', titular: `${nombre}, ${f.rol === 'Pareja' ? (f.genero === 'f' ? 'esposa' : 'esposo') : (f.genero === 'f' ? 'hija' : 'hijo')} de ${J.nombre}, aspira ${{ concejo: 'al Concejo', asamblea: 'a la Asamblea', camara: 'a la Cámara', senado: 'al Senado', alcaldia: 'a la Alcaldía', gobernacion: 'a la Gobernación' }[aspira] || 'a un cargo'}`, tono: 1, importante: true, jugador: true });
    return p;
  };
  Fam.turno = E => {
    const J = E.jugador, f = Fam.asegurarPareja(E); if (!f || E.meta.presim) return;
    const ejec = ['presidente', 'gobernador', 'alcalde'].includes(J.cargo);
    f.relacion = U.clamp(f.relacion + (J.bienestar > 60 ? 0.012 : -0.02) - 0.006 + (f.papel === 'campana' ? -0.004 : 0), 0, 100);
    if (f.papel === 'campana') { J.rep.cercania = U.clamp(J.rep.cercania + 0.004, 0, 100); J.reconocimiento = U.clamp(J.reconocimiento + 0.004, 0, 100); }
    if (f.papel === 'social') { if (ejec && E.gobierno.presidente === 'J') E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 0.003, 3, 95); J.reconocimiento = U.clamp(J.reconocimiento + 0.002, 0, 100); }
    if (f.relacion < 30 && U.chance(0.002)) {
      J.rep.honestidad = U.clamp(J.rep.honestidad - 3, 0, 100); J.bienestar = U.clamp((J.bienestar || 60) - 6, 0, 100);
      C.Medios.noticia(E, { tipo: 'personal', titular: `Se filtra una crisis matrimonial de ${J.nombre} y ${f.nombre}`, tono: -1, jugador: true });
      f.relacion = U.clamp(f.relacion + 4, 0, 100);
    }
    // un hijo adulto con ambición pide entrar a la política
    if (U.chance(0.0015)) {
      const cand = Fam.hijos(E).filter(h => h.edad >= 24 && !h.politicoId && !h.fallecido && (h.atributos.carisma > 55 || h.relacion > 60));
      if (cand.length && !E.eventos.pendientes.some(e => e.plantilla === 'hijoPolitica')) { const h = U.pick(cand); C.Eventos.disparar(E, C.Eventos.plantilla('hijoPolitica'), { vars: { hijo: h.nombre }, hijo: h.id }); }
    }
  };
  Fam.dinastiaResumen = E => ({ puntos: Fam.puntosDinastia(E), miembros: Fam.familiaPolitica(E) });

  (function () {
    const A = C.Acciones, J = () => C.E.jugador;
    A.registrar({ id: 'casarse', nombre: 'Formalizar una pareja', icono: '💍', grupo: 'familia', costo: 1,
      disponible(E) { return Fam.pareja(E) ? 'Ya tienes pareja' : E.jugador.edad >= 18 || true; },
      ejecutar(E, a) {
        const t = TIPOS_PAREJA[a.tipo]; if (!t) return { ok: false, msg: 'Elige qué tipo de pareja' };
        const Jx = E.jugador, g = Jx.genero === 'f' ? 'm' : 'f', N = C.DATA.nombres, apellido = U.pick(N.a);
        const nombre = `${U.pick(g === 'f' ? N.m : N.h)} ${apellido}`;
        Jx.familia.push({ rol: 'Pareja', nombre, genero: g, edad: Math.max(20, C.Personaje.edad(E) + U.ri(-4, 4)) });
        const f = Fam.asegurarPareja(E); f.tipo = a.tipo; f.relacion = 75;
        if (a.tipo === 'politica') { Jx.reconocimiento = U.clamp(Jx.reconocimiento + 3, 0, 100); Jx.rep.cercania = U.clamp(Jx.rep.cercania + 1, 0, 100); }
        else if (a.tipo === 'empresaria') { Jx.patrimonio += 120; Jx.ingresos = (Jx.ingresos || 0) + 4; }
        else { Jx.credibilidad = U.clamp(Jx.credibilidad + 3, 0, 100); Jx.bienestar = U.clamp((Jx.bienestar || 60) + 8, 0, 100); }
        C.Medios.noticia(E, { tipo: 'personal', titular: `${Jx.nombre} se casa con ${nombre}`, tono: 1, jugador: true });
        return { ok: true, msg: `Te casas con ${nombre} (${t.n.toLowerCase()})` };
      } });
    A.registrar({ id: 'papelPareja', nombre: 'Definir el papel de tu pareja', icono: '👫', grupo: 'familia', costo: 1,
      disponible(E) { return Fam.pareja(E) ? true : 'No tienes pareja'; },
      ejecutar(E, a) {
        const f = Fam.asegurarPareja(E), p = PAPELES[a.papel]; if (!p) return { ok: false, msg: 'Elige el papel' };
        if (f.papel === a.papel) return { ok: false, msg: 'Ya cumple ese papel' };
        if (a.papel === 'propia') {
          if (f.politicoId) return { ok: false, msg: 'Ya está en la política' };
          const aspira = ['concejo', 'asamblea', 'camara'].includes(a.aspira) ? a.aspira : 'concejo';
          Fam.entrarEnPolitica(E, f, aspira); f.papel = 'propia'; f.relacion = U.clamp(f.relacion + 3, 0, 100);
          return { ok: true, msg: `${f.nombre} se lanza a la vida pública` };
        }
        f.papel = a.papel; f.relacion = U.clamp(f.relacion + (a.papel === 'hogar' ? 2 : 0), 0, 100);
        return { ok: true, msg: `${f.nombre}: ${p.n.toLowerCase()}` };
      } });
    A.registrar({ id: 'tenerHijo', nombre: 'Tener o adoptar un hijo', icono: '👶', grupo: 'familia', costo: 1,
      disponible(E) {
        const f = Fam.pareja(E); if (!f) return 'Necesitas una pareja';
        return Fam.hijos(E).length >= 6 ? 'Ya tienes seis hijos' : true;
      },
      ejecutar(E) {
        const Jx = E.jugador, N = C.DATA.nombres, g = U.chance(0.5) ? 'f' : 'm', apellido = Jx.nombre.trim().split(' ').slice(-1)[0];
        const madre = Fam.pareja(E).genero === 'f' ? Fam.pareja(E).edad : C.Personaje.edad(E), adopta = madre > 45;
        const h = { rol: g === 'f' ? 'Hija' : 'Hijo', genero: g, nombre: U.pick(g === 'f' ? N.m : N.h) + ' ' + apellido, edad: adopta ? U.ri(2, 9) : 0 };
        Jx.familia.push(h); Fam.asegurarDatos(E); h.relacion = 85; Jx.bienestar = U.clamp((Jx.bienestar || 60) + 6, 0, 100);
        const par = Fam.asegurarPareja(E); par.relacion = U.clamp(par.relacion + 4, 0, 100);
        C.Medios.noticia(E, { tipo: 'personal', titular: adopta ? `${Jx.nombre} y su pareja adoptan a ${h.nombre}` : `Nace ${h.nombre}, ${g === 'f' ? 'hija' : 'hijo'} de ${Jx.nombre}`, tono: 1, jugador: true });
        return { ok: true, msg: adopta ? `Adoptan a ${h.nombre}` : `Nace ${h.nombre}` };
      } });
    A.registrar({ id: 'divorciarse', nombre: 'Terminar la relación', icono: '💔', grupo: 'familia', costo: 1,
      disponible(E) { return Fam.pareja(E) ? true : 'No tienes pareja'; },
      ejecutar(E) {
        const Jx = E.jugador, f = Fam.pareja(E); Jx.familia = Jx.familia.filter(x => x !== f);
        if (f.politicoId && E.politicos[f.politicoId]) { E.politicos[f.politicoId].relJ = -20; }
        Jx.patrimonio = Math.max(0, Jx.patrimonio * 0.75); Jx.bienestar = U.clamp((Jx.bienestar || 60) - 10, 0, 100); Jx.rep.honestidad = U.clamp(Jx.rep.honestidad - 1, 0, 100);
        C.Medios.noticia(E, { tipo: 'personal', titular: `${Jx.nombre} y ${f.nombre} ponen fin a su relación`, tono: -1, jugador: true });
        return { ok: true, msg: 'Terminas la relación: pierdes una cuarta parte del patrimonio' };
      } });
    A.registrar({ id: 'lanzarHijoPolitica', nombre: 'Lanzar a un hijo a la política', icono: '🚀', grupo: 'familia', costo: 2,
      disponible(E, a) { const h = Fam.hijos(E).find(x => x.id === a.hijo); if (!h) return 'Elige un hijo'; if (h.edad < 21) return 'Debe tener al menos 21 años'; return h.politicoId ? 'Ya está en la política' : true; },
      ejecutar(E, a) {
        const h = Fam.hijos(E).find(x => x.id === a.hijo), aspira = ['concejo', 'asamblea', 'camara', 'alcaldia'].includes(a.aspira) ? a.aspira : 'concejo';
        Fam.asegurarDatos(E); const p = Fam.entrarEnPolitica(E, h, aspira); h.relacion = U.clamp(h.relacion + 4, 0, 100);
        return { ok: true, msg: `${p.nombre} se lanza: fuerza inicial ${p.fuerza}` };
      } });
    A.registrar({ id: 'apadrinarHijo', nombre: 'Apadrinar la carrera de un familiar', icono: '🤝', grupo: 'familia', costo: 1,
      disponible(E, a) { const x = (E.jugador.familia || []).find(f => f.id === a.hijo); if (!x || !x.politicoId || !E.politicos[x.politicoId]) return 'Ese familiar no está en la política'; return E.jugador.patrimonio >= 40 ? true : 'Necesitas $40 millones'; },
      ejecutar(E, a) {
        const x = E.jugador.familia.find(f => f.id === a.hijo), p = E.politicos[x.politicoId];
        E.jugador.patrimonio -= 40; p.fuerza = U.clamp(p.fuerza + U.ri(3, 6), 5, 95); p.relJ = U.clamp((p.relJ || 0) + 5, -100, 100);
        if (U.chance(0.12)) { E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.3; C.Medios.noticia(E, { tipo: 'escandalo', titular: `Críticas por el nepotismo: ${E.jugador.nombre} impulsa la carrera de ${p.nombre}`, tono: -1, jugador: true }); }
        return { ok: true, msg: `${p.nombre} gana fuerza (${Math.round(p.fuerza)})` };
      } });
  })();

  C.Familia = Fam;
  C.Tiempo.registrar('familia', Fam, 92);
  Fam.registrarAcciones();
})(window.CURUL);
