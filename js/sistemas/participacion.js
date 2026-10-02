/* Democracia directa: referendos, plebiscitos, consultas populares y revocatoria del mandato, con un
   motor común. Cada mecanismo recorre etapas —recolección de firmas o aval del Senado o de la
   corporación local, control de la Corte Constitucional, campaña y votación— y se decide con umbrales
   de participación reales:

     referendo derogatorio   40 % del censo · deroga una ley vigente (el fallo revierte sus efectos)
     referendo aprobatorio   25 % del censo · aprueba un proyecto que el Congreso hundió
     plebiscito              13 % del censo a favor · el Presidente consulta una política
     consulta popular        33 % del censo · nacional (Presidente) o local (gobernador o alcalde)
     revocatoria             40 % del censo · alcaldes y gobernadores; el Presidente sólo si una reforma
                             constitucional la habilita, y entonces asume el vicepresidente

   El apoyo parte de qué tan lejos queda la medida del centro del electorado, de la popularidad de la
   ley o del funcionario y de la confianza en quien convoca, y se mueve con la campaña del jugador y la
   postura de cada partido (que el director del partido puede fijar). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TIPOS = {
    derogatorio: { nombre: 'Referendo derogatorio', icono: '🗳', umbral: 0.40, etapas: ['firmas', 'corte', 'campana'], camp: 12 },
    aprobatorio: { nombre: 'Referendo aprobatorio', icono: '📜', umbral: 0.25, etapas: ['firmas', 'corte', 'campana'], camp: 12 },
    plebiscito: { nombre: 'Plebiscito', icono: '📣', umbral: null, etapas: ['senado', 'corte', 'campana'], camp: 10 },
    consulta: { nombre: 'Consulta popular nacional', icono: '🗣', umbral: 0.33, etapas: ['senado', 'corte', 'campana'], camp: 10 },
    local: { nombre: 'Consulta popular local', icono: '🏘', umbral: 0.33, etapas: ['concepto', 'campana'], camp: 6 },
    metropolitana: { nombre: 'Consulta metropolitana', icono: '🏙', umbral: 0.33, etapas: ['concepto', 'campana'], camp: 8 },
    constitucional: { nombre: 'Referendo constitucional', icono: '🏛', umbral: 0.25, etapas: ['senado', 'corte', 'campana'], camp: 12 },
    constitucionalPopular: { nombre: 'Reforma constitucional por iniciativa popular', icono: '🏛', umbral: 0.25, etapas: ['firmas', 'corte', 'campana'], camp: 12 },
    constituyente: { nombre: 'Consulta para convocar una Constituyente', icono: '📜', umbral: 0.33, etapas: ['senado', 'corte', 'campana'], camp: 12 },
    ratificacion: { nombre: 'Referendo de ratificación constitucional', icono: '✅', umbral: 0.25, etapas: ['campana'], camp: 8 },
    revocatoria: { nombre: 'Revocatoria del mandato', icono: '🚪', umbral: 0.40, etapas: ['firmas', 'registraduria', 'campana'], camp: 8 }
  };
  const ETAPA = { firmas: 'Recolección de firmas', senado: 'Aval del Senado', corte: 'Control de la Corte Constitucional', concepto: 'Concepto de la corporación local', registraduria: 'Verificación de firmas', campana: 'Campaña', cerrado: 'Cerrado' };
  const TEMAS_LOCALES = () => C.DATA.participacion.local;

  const P = {
    TIPOS, ETAPA,
    init(E) { E.participacion = { activos: [], historial: [], hundidos: [], refrendos: {}, ultimo: {}, resultadosPendientes: [] }; },
    migrar(E) {
      if (!E.participacion || !E.participacion.activos) P.init(E);
      const pa = E.participacion; pa.hundidos = pa.hundidos || []; pa.resultadosPendientes = pa.resultadosPendientes || []; pa.refrendos = pa.refrendos || {}; pa.ultimo = pa.ultimo || {};
    },
    /* La Constitución de 1991 y la Ley 134 de 1994 crean los mecanismos de participación; el plebiscito
       existe desde el de 1957. Antes de eso sólo hay elecciones. */
    habilitado(tipo) { return tipo === 'plebiscito' || U.anio() >= 1991 ? true : 'Antes de la Constitución de 1991 no existía este mecanismo de participación'; },
    tema(clase, id) { return C.DATA.participacion[clase].find(t => t.id === id); },
    activo(E, clave) { return E.participacion.activos.find(m => m.clave === clave && m.estado !== 'cerrado'); },
    centro(E) {
      let s = 0, eco = 0, soc = 0;
      for (const p of Object.values(E.partidos)) { if (p.especial || p.futuro) continue; s += p.popularidad; eco += p.eco * p.popularidad; soc += p.soc * p.popularidad; }
      return s ? { eco: eco / s, soc: soc / s } : { eco: 0, soc: 0 };
    },
    aprobLocal(E, depto, tipo) {
      const d = E.deptos[depto], id = d[tipo], J = E.jugador;
      if (id === 'J') { const g = C.GobiernoLocal.asegurar(E, depto, tipo === 'gobernador' ? 'gobernacion' : 'alcaldia'); return U.clamp(0.6 * J.popularidad + 0.4 * (100 - g.civico.descontento), 8, 92); }
      const idx = (d.educacion + d.salud + d.seguridad + d.infraestructura) / 4, pol = E.politicos[id];
      let a = 50 + (idx - 55) * 0.6 + (C.Corte.hash(String(id) + tipo) - 0.5) * 24 + (d.ajusteAprob || 0);
      if (pol && pol.partido && E.partidos[pol.partido]) a += (E.partidos[pol.partido].popularidad - 8) * 0.3;
      return U.clamp(a, 8, 92);
    },
    /* ¿Se puede revocar hoy a este funcionario? Devuelve true o el motivo. */
    puedeRevocar(E, depto, tipo) {
      if (U.anio() < 1992) return 'Antes de 1991 no había elección popular de gobernadores y alcaldes: no hay a quién revocar';
      const d = E.deptos[depto]; if (!d || !d[tipo]) return 'No hay funcionario';
      const hoy = U.hoy(), y = hoy.getUTCFullYear(), inicioY = y - (((y - 2028) % 4) + 4) % 4, sem = (hoy - Date.UTC(inicioY, 0, 1)) / (7 * 864e5);
      if (sem < 52) return 'Sólo se puede pedir después del primer año de mandato';
      if (sem > 156) return 'No procede en el último año del periodo';
      if (P.activo(E, 'rev:' + depto + ':' + tipo)) return 'Ya hay un proceso de revocatoria en curso';
      const ult = E.participacion.ultimo['rev:' + depto + ':' + tipo];
      if (ult != null && E.fecha.t - ult < 104) return 'Ya hubo un intento contra este funcionario en este periodo';
      return true;
    },
    puedeRevocarPresidente(E) {
      if (C.Constitucion.valor(E, 'revocatoriaPresidencial') !== 'si') return 'La Constitución no contempla la revocatoria del Presidente: hay que reformarla primero';
      if (!E.gobierno.presidente) return 'No hay Presidente';
      const sem = E.fecha.t - E.gobierno.desde;
      if (sem < 52) return 'Sólo se puede pedir después del primer año de mandato';
      if (sem > 156) return 'No procede en el último año del periodo';
      if (P.activo(E, 'rev:presidente')) return 'Ya hay un proceso de revocatoria en curso';
      const ult = E.participacion.ultimo['rev:presidente'];
      if (ult != null && E.fecha.t - ult < 104) return 'Ya hubo un intento en este periodo';
      return true;
    },

    /* ── Creación ── */
    crear(E, cfg) {
      const t = TIPOS[cfg.tipo];
      const m = Object.assign({ id: U.id('pm'), estado: t.etapas[0], t0: E.fecha.t, sem: 0, semEtapa: 0, durCorte: null,
        firmas: t.etapas[0] === 'firmas' ? 0 : null, campSi: 0, campNo: 0, posturas: {}, apoyo: 50, nivel: 'nacional', depto: null }, cfg);
      m.apoyo = P.apoyoInicial(E, m); m.apoyoBase = m.apoyo;
      m.ideoSi = P.ideoSi(E, m);
      E.participacion.activos.push(m);
      return m;
    },
    esConst: tipo => tipo === 'constitucional' || tipo === 'constitucionalPopular' || tipo === 'constituyente' || tipo === 'ratificacion',
    ideoSi(E, m) {
      if (P.esConst(m.tipo)) return { eco: 0, soc: 0 };
      if (m.tipo === 'derogatorio') { const p = E.proyectos[m.proyecto]; return p ? { eco: -p.eco * 0.6, soc: -p.soc * 0.6 } : { eco: 0, soc: 0 }; }
      if (m.tipo === 'aprobatorio') { const p = E.proyectos[m.proyecto]; return p ? { eco: p.eco, soc: p.soc } : { eco: 0, soc: 0 }; }
      if (m.tipo === 'revocatoria') return { eco: 0, soc: 0 };
      const t = P.tema(m.tipo === 'local' ? 'local' : m.tipo === 'plebiscito' ? 'plebiscito' : 'consulta', m.tema); return t ? { eco: t.eco, soc: t.soc } : { eco: 0, soc: 0 };
    },
    /* `sinRuido` permite mostrar una estimación en pantalla sin gastar números aleatorios. */
    apoyoInicial(E, m, sinRuido) {
      const centro = P.centro(E), ruido = sinRuido ? 0 : U.gauss(0, 2);
      if (P.esConst(m.tipo)) return C.Constitucion.apoyoReforma(E, m, ruido);
      if (m.tipo === 'metropolitana' && C.Metro) { const a = C.Metro.area(E, m.metro); return U.clamp(40 + (P.aprobLocal(E, m.depto, 'alcalde') - 50) * 0.25 + (60 - a.indic.movilidad) * 0.3 + (60 - a.indic.ambiente) * 0.15 + ruido, 8, 90); }
      if (m.tipo === 'derogatorio' || m.tipo === 'aprobatorio') {
        const p = E.proyectos[m.proyecto]; if (!p) return 50;
        const lejos = U.distIdeo(p, centro);
        if (m.tipo === 'derogatorio') return U.clamp(50 - p.pop * 0.9 + (p.gobierno ? (50 - E.opinion.aprobacionPres) * 0.3 : 0) + lejos * 20 - 6 + ruido, 5, 95);
        return U.clamp(48 + p.pop * 0.9 - lejos * 15 + ruido, 5, 95);
      }
      if (m.tipo === 'revocatoria') {
        const aprob = m.cargo === 'presidente' ? E.opinion.aprobacionPres : P.aprobLocal(E, m.depto, m.cargo);
        return U.clamp(25 + (55 - aprob) * 1.1 + ruido, 4, 90);
      }
      const t = P.tema(m.tipo === 'local' ? 'local' : m.tipo === 'plebiscito' ? 'plebiscito' : 'consulta', m.tema); if (!t) return 50;
      let a = 50 + t.popBase + (0.5 - U.distIdeo(t, centro)) * 30 + ruido;
      if (m.tipo === 'plebiscito') a += (E.opinion.aprobacionPres - 50) * 0.4;
      if (m.tipo === 'local') a += ((m.cargo ? P.aprobLocal(E, m.depto, m.cargo) : 50) - 50) * 0.3;
      return U.clamp(a, 5, 95);
    },
    /* Postura de un partido frente a la medida: -1 en contra … +1 a favor (la del director pesa más). */
    posturaPartido(E, m, pid) {
      if (m.posturas[pid] != null) return m.posturas[pid];
      const pa = E.partidos[pid]; if (!pa) return 0;
      if (P.esConst(m.tipo)) return C.Constitucion.posturaPartido(E, m, pid);
      if (m.tipo === 'revocatoria') {
        const of = m.cargo === 'presidente' ? E.politicos[E.gobierno.presidente] : E.politicos[E.deptos[m.depto][m.cargo]];
        const partOf = of && (of.id === 'J' ? E.jugador.partido : of.partido);
        if (pid === partOf) return -1;
        if (m.cargo === 'presidente' && E.gobierno.coalicion.includes(pid)) return -0.7;
        return 0.35;
      }
      return U.clamp((0.32 - U.distIdeo(m.ideoSi, pa)) * 3, -1, 1);
    },
    /* Ideología del texto contra el electorado y los partidos, más la campaña. */
    objetivoApoyo(E, m) {
      let stance = 0;
      for (const p of Object.values(E.partidos)) { if (p.especial || p.futuro) continue; stance += (p.popularidad / 100) * P.posturaPartido(E, m, p.id); }
      return U.clamp(m.apoyoBase + stance * 12 + (m.campSi - m.campNo) * 0.5, 2, 98);
    },

    /* ── Turno ── */
    turno(E) {
      const pa = E.participacion; if (!pa) return;
      for (const m of pa.activos.slice()) if (m.estado !== 'cerrado') P.avanzar(E, m);
      pa.activos = pa.activos.filter(m => m.estado !== 'cerrado' || E.fecha.t - m.tCierre < 1);
      if (pa.activos.length > 40) pa.activos = pa.activos.filter(m => m.estado !== 'cerrado');
      if (!E.meta.presim) P.iniciativasNPC(E);
    },
    avanzar(E, m) {
      const t = TIPOS[m.tipo]; m.sem++;
      if (m.estado === 'firmas') {
        // Cuanto más respaldo tiene la causa, más rápido se reúnen las firmas.
        const veloc = (m.promotor === 'J' ? 0.6 : m.promotor === 'oposicion' ? 3 : 2.2) * (0.6 + m.apoyo / 100);
        m.firmas = Math.min(100, m.firmas + veloc * U.rf(0.6, 1.4));
        if (m.firmas >= 100) return P.siguienteEtapa(E, m);
        if (m.sem > 60) return P.cerrar(E, m, 'se agota el plazo sin reunir las firmas');
        return;
      }
      m.semEtapa++;
      if (m.estado === 'campana') {
        m.apoyo = U.clamp(m.apoyo + (P.objetivoApoyo(E, m) - m.apoyo) * 0.15 + U.gauss(0, 0.6), 2, 98);
        m.campSi *= 0.985; m.campNo *= 0.985;
        if (m.semEtapa >= t.camp) return P.votar(E, m);
      } else if (m.estado === 'senado' && m.semEtapa >= 3) return P.resolverSenado(E, m);
      else if (m.estado === 'concepto' && m.semEtapa >= 3) return P.resolverConcepto(E, m);
      else if (m.estado === 'corte' && m.semEtapa >= m.durCorte) return P.resolverCorte(E, m);
      else if (m.estado === 'registraduria' && m.semEtapa >= 4) return P.resolverRegistraduria(E, m);
    },
    siguienteEtapa(E, m) {
      const et = TIPOS[m.tipo].etapas, i = et.indexOf(m.estado); m.estado = et[i + 1]; m.semEtapa = 0;
      if (m.estado === 'corte') m.durCorte = U.ri(6, 10);
      if (m.estado === 'campana') {
        C.Medios.noticia(E, { tipo: 'campana', titular: `Arranca la campaña del ${TIPOS[m.tipo].nombre.toLowerCase()}: ${m.titulo}`, tono: 0, importante: m.promotor === 'J' || m.alcance === 'jugador' });
      }
    },
    cerrar(E, m, motivo) {
      m.estado = 'cerrado'; m.tCierre = E.fecha.t; m.motivoCierre = motivo;
      E.participacion.historial.push({ id: m.id, t: E.fecha.t, tipo: m.tipo, titulo: m.titulo, sinVotacion: true, motivo });
      C.Medios.noticia(E, { tipo: 'campana', titular: `Se cae el ${TIPOS[m.tipo].nombre.toLowerCase()} «${m.titulo}»: ${motivo}`, tono: -1, importante: m.promotor === 'J' });
    },
    resolverSenado(E, m) {
      const comp = C.Congreso.composicion(E, 'senado').porPartido; let tot = 0, gob = 0;
      for (const [pid, n] of Object.entries(comp)) { tot += n; if (E.gobierno.coalicion.includes(pid)) gob += n; }
      const prob = U.clamp(0.35 + (tot ? gob / tot : 0.5) * 0.8 + (m.tipo === 'plebiscito' ? 0.1 : 0), 0.2, 0.95);
      if (!U.chance(prob)) return P.cerrar(E, m, 'el Senado no aprueba la convocatoria');
      P.siguienteEtapa(E, m);
    },
    resolverConcepto(E, m) {
      const organo = m.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia';
      const apoyo = C.Corporaciones.apoyoEsperado(E, m.depto, organo);
      if (!U.chance(U.clamp(apoyo * 1.1, 0.2, 0.95))) return P.cerrar(E, m, `${m.cargo === 'gobernador' ? 'la Asamblea' : 'el Concejo'} niega el concepto favorable`);
      P.siguienteEtapa(E, m);
    },
    resolverCorte(E, m) {
      const ideo = m.ideoSi, riesgoBase = m.tipo === 'derogatorio' ? 0.07 : m.tipo === 'aprobatorio' ? 0.1 : P.esConst(m.tipo) ? 0.05 : 0.08;
      const tumba = U.chance(riesgoBase * C.Corte.factorEco(E, ideo.eco));
      C.Corte.registrarFallo(E, { tipo: 'consulta', titulo: `${TIPOS[m.tipo].nombre}: ${m.titulo}`, resultado: tumba ? 'inexequible' : 'exequible', gobierno: m.promotor === 'gobierno' });
      if (tumba) return P.cerrar(E, m, 'la Corte Constitucional tumba la pregunta');
      P.siguienteEtapa(E, m);
    },
    resolverRegistraduria(E, m) {
      if (!U.chance(0.9)) { m.firmas = 88; m.estado = 'firmas'; m.semEtapa = 0; C.Medios.noticia(E, { tipo: 'campana', titular: `La Registraduría anula firmas de la revocatoria «${m.titulo}»: hay que completar el aval`, tono: -1 }); return; }
      P.siguienteEtapa(E, m);
    },

    /* ── Votación ── */
    censo(E, m) {
      if (m.nivel === 'nacional') return Object.values(E.deptos).reduce((s, d) => s + C.Elecciones.electores(d), 0);
      const d = E.deptos[m.depto]; return C.Elecciones.electores(d) * (m.cargo === 'alcalde' ? 0.45 : 1);
    },
    turnout(E, m) {
      const deptos = m.nivel === 'nacional' ? Object.values(E.deptos) : [E.deptos[m.depto]];
      let el = 0, vt = 0;
      for (const d of deptos) { const e = C.Elecciones.electores(d); el += e; vt += e * C.Elecciones.participacionBase(E, d, 'regional'); }
      const pr = E.proyectos[m.proyecto], tema = m.tipo === 'revocatoria' ? { sal: 0.03 } : pr ? { sal: 0.01 + Math.abs(pr.pop || 0) / 1000 } : (P.tema(m.tipo === 'local' ? 'local' : m.tipo === 'plebiscito' ? 'plebiscito' : 'consulta', m.tema) || { sal: 0 });
      return U.clamp(vt / el * 0.66 + (tema.sal || 0) + (m.campSi + m.campNo) * 0.003 + U.gauss(0, 0.015), 0.08, 0.8);
    },
    votar(E, m) {
      const t = TIPOS[m.tipo], turnout = P.turnout(E, m), yes = U.clamp(m.apoyo + U.gauss(0, 2.5), 1, 99);
      const valido = m.tipo === 'plebiscito' ? turnout * yes / 100 >= 0.13 : turnout >= t.umbral;
      const pasa = valido && yes > 50;
      const contraJ = m.tipo === 'revocatoria' && (m.cargo === 'presidente' ? E.gobierno.presidente === 'J' : E.deptos[m.depto][m.cargo] === 'J');
      const r = { id: m.id, t: E.fecha.t, tipo: m.tipo, titulo: m.titulo, yes, no: 100 - yes, turnout, umbral: t.umbral, valido, pasa, nivel: m.nivel, depto: m.depto, contraJ, efectos: [] };
      m.resultado = r; m.estado = 'cerrado'; m.tCierre = E.fecha.t;
      P.aplicar(E, m, r);
      E.participacion.historial.push(r);
      if (E.participacion.historial.length > 60) E.participacion.historial.shift();
      E.participacion.resultadosPendientes.push(r);
      C.Medios.noticia(E, { tipo: 'campana', titular: `${t.nombre}: «${m.titulo}» ${pasa ? 'gana el Sí' : valido ? 'gana el No' : 'no alcanza el umbral de participación'} (${U.d1(yes)} % Sí, participación ${U.d1(turnout * 100)} %)`, tono: 0, importante: true, jugador: m.promotor === 'J' });
      return r;
    },
    aplicar(E, m, r) {
      const Ec = C.Economia, ef = txt => r.efectos.push(txt);
      const opin = (d, txtPos, txtNeg) => { E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + d, 3, 95); ef(d >= 0 ? txtPos : txtNeg); };
      if (m.tipo === 'derogatorio') {
        const p = E.proyectos[m.proyecto]; if (!p) return;
        if (r.pasa) {
          C.Corte.anularEfectos(E, p, 1); p.estado = 'derogada'; p.derogada = E.fecha.t;
          C.Legislacion.hist(E, p, 'Derogada por referendo', 'negado'); ef(`La ley «${p.titulo}» queda derogada y se revierten sus efectos`);
          if (p.gobierno) opin(-U.rf(1.5, 3), '', 'El Gobierno pierde su ley: golpe a la aprobación');
        } else if (r.valido) { if (p.gobierno) opin(U.rf(0.8, 1.8), 'La ley se ratifica en las urnas', ''); ef('La ley se mantiene'); }
        else ef('No se alcanza la participación mínima: la ley se mantiene');
      } else if (m.tipo === 'aprobatorio') {
        const p = E.proyectos[m.proyecto]; if (!p) return;
        if (r.pasa) { C.Legislacion.convertirEnLey(E, p); ef(`«${p.titulo}» se convierte en ley por decisión popular`); }
        else ef('El proyecto sigue archivado');
      } else if (m.tipo === 'plebiscito' || m.tipo === 'consulta') {
        const t = P.tema(m.tipo === 'plebiscito' ? 'plebiscito' : 'consulta', m.tema);
        const lista = r.pasa ? t.si : t.no;
        if (lista.length) Ec.programar(E, lista, 'consulta:' + m.tema);
        ef(r.pasa ? `Gana el Sí: se aplica «${t.nombre}»` : 'Gana el No (o no se alcanza el umbral): no se aplica');
        if (m.tipo === 'plebiscito') {
          E.participacion.refrendos[m.tema] = { t: E.fecha.t, si: r.pasa };
          if (m.tema === 'apertura' && r.valido) {
            if (r.pasa) ef('Los tratados quedan blindados: baja el riesgo de la Corte y del Congreso');
            else {
              for (const n of Object.values(E.comercio.negociaciones)) if (n.estado === 'abierta' || n.estado === 'cerrada') { n.estado = 'fracasada'; n.enfriaHasta = E.fecha.t + 52; }
              if (E.comercio.mercosur.adhesion) C.Mercosur.fracasarAdhesion(E, 'el plebiscito rechazó la apertura comercial');
              ef('Se congelan las negociaciones de TLC y la adhesión al Mercosur');
            }
          }
          opin(r.pasa ? U.rf(2, 5) : -U.rf(3, 6), 'El Presidente sale fortalecido', 'El Presidente pierde el plebiscito: golpe político');
        } else if (E.gobierno.presidente === 'J' && m.promotor === 'J') opin(r.pasa ? U.rf(1, 3) : -U.rf(1, 3), 'Sube la aprobación por ganar la consulta', 'Baja la aprobación por perder la consulta');
      } else if (P.esConst(m.tipo)) C.Constitucion.aplicarResultado(E, m, r, ef, opin);
      else if (m.tipo === 'metropolitana') C.Metro.aplicarConsulta(E, m, r, ef, opin);
      else if (m.tipo === 'local') P.aplicarLocal(E, m, r, ef);
      else if (m.tipo === 'revocatoria') P.aplicarRevocatoria(E, m, r, ef);
    },
    aplicarLocal(E, m, r, ef) {
      const d = E.deptos[m.depto], organo = m.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia', esJ = E.jugador.cargo === m.cargo && E.jugador.cargoInfo && E.jugador.cargoInfo.depto === m.depto;
      const g = esJ ? C.GobiernoLocal.asegurar(E, m.depto, organo) : null;
      if (m.tema === 'mineria') {
        if (r.pasa) { d.pibPc = +(d.pibPc * 1.02).toFixed(2); d.desempleo = U.clamp(d.desempleo - 0.5, 2, 40); d.pobreza = U.clamp(d.pobreza - 0.4, 3, 90); if (g) g.civico.descontento = U.clamp(g.civico.descontento + 6, 0, 100); C.Comercio.tocarActor(E, 'indigena', 4); ef('Gana el Sí: sube la economía local y el conflicto ambiental'); }
        else { d.pibPc = +(d.pibPc * 0.995).toFixed(2); if (g) g.civico.descontento = U.clamp(g.civico.descontento - 5, 0, 100); C.Comercio.tocarActor(E, 'indigena', -2); ef('Gana el No: se frena el proyecto minero'); }
      } else if (m.tema === 'megaobra') {
        if (r.pasa) { d.infraestructura = U.clamp(d.infraestructura + 1.5, 1, 99); if (g && g.obraBandera) { g.obraBandera.semanas = Math.max(1, g.obraBandera.semanas - 4); g.obraBandera.consulta = true; } ef('Gana el Sí: la obra avanza con respaldo popular'); }
        else { d.infraestructura = U.clamp(d.infraestructura - 0.5, 1, 99); if (g && g.obraBandera) { g.obraBandera = null; g.civico.descontento = U.clamp(g.civico.descontento + 4, 0, 100); } ef('Gana el No: se cancela el megaproyecto'); }
      } else if (m.tema === 'pot') {
        if (r.pasa) { d.infraestructura = U.clamp(d.infraestructura + 1.2, 1, 99); d.desempleo = U.clamp(d.desempleo - 0.2, 2, 40); ef('Gana el Sí: se adopta el plan de ordenamiento'); } else ef('Gana el No: el plan queda en el aire');
      }
      if (esJ) { E.jugador.popularidad = U.clamp(E.jugador.popularidad + (r.pasa ? U.rf(1, 3) : -U.rf(1, 3)), 0, 100); ef(r.pasa ? 'Ganas la consulta: sube tu imagen' : 'Pierdes la consulta: baja tu imagen'); }
    },
    aplicarRevocatoria(E, m, r, ef) {
      E.participacion.ultimo[m.clave] = E.fecha.t;
      const nombre = m.cargo === 'presidente' ? 'el Presidente' : `${m.cargo === 'gobernador' ? 'el gobernador' : 'el alcalde'} de ${m.cargo === 'gobernador' ? E.deptos[m.depto].nombre : E.deptos[m.depto].capital}`;
      if (!r.pasa) { ef(`${nombre[0].toUpperCase() + nombre.slice(1)} conserva el cargo`); if (m.cargo === 'presidente') E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + 2, 3, 95); else if (E.deptos[m.depto][m.cargo] === 'J') E.jugador.popularidad = U.clamp(E.jugador.popularidad + 4, 0, 100); return; }
      if (m.cargo === 'presidente') { C.Vice.faltaAbsoluta(E, 'revocatoria'); ef('El Presidente es revocado: asume el vicepresidente'); return; }
      const d = E.deptos[m.depto], id = d[m.cargo], J = E.jugador;
      if (id === 'J') { C.Personaje.dejarCargo(E, 'Es revocado del mandato'); }
      else if (E.politicos[id]) { const p = E.politicos[id]; p.cargo = null; C.Politicos.anotar(p, 'Es revocado del cargo'); }
      const suc = C.Elecciones.vacanteRegional(E, m.depto, m.cargo, { atipica: true });
      ef(`${nombre[0].toUpperCase() + nombre.slice(1)} es revocado: la elección atípica lleva a ${suc.nombre}`);
    },

    /* ── Iniciativas de los demás actores ── */
    iniciativasNPC(E) {
      const pa = E.participacion;
      P.iniciativaGobierno(E);
      if (P.habilitado('derogatorio') !== true) return;
      if (U.chance(0.004)) {
        const cands = [];
        for (const d of Object.values(E.deptos)) for (const tipo of ['gobernador', 'alcalde']) {
          if (P.puedeRevocar(E, d.id, tipo) !== true) continue;
          const aprob = P.aprobLocal(E, d.id, tipo); if (aprob < 46) cands.push({ d, tipo, w: 50 - aprob });
        }
        const c = U.pesado(cands, x => x.w);
        if (c) P.iniciarRevocatoria(E, c.d.id, c.tipo, 'ciudadania');
      }
      if (U.chance(0.003)) {
        const leyes = E.corte.recientes.map(id => E.proyectos[id]).filter(p => p && p.estado === 'ley' && (p.pop < 0 || (p.gobierno && E.opinion.aprobacionPres < 42)) && !P.activo(E, 'ref:' + p.id) && (pa.ultimo['ref:' + p.id] == null || E.fecha.t - pa.ultimo['ref:' + p.id] > 78));
        const p = U.pick(leyes);
        if (p) P.iniciarReferendo(E, 'derogatorio', p, 'oposicion');
      }
      if (U.chance(0.002)) {
        const hund = pa.hundidos.map(id => E.proyectos[id]).filter(p => p && p.estado === 'archivado' && p.pop > 8 && !P.activo(E, 'ref:' + p.id) && (pa.ultimo['ref:' + p.id] == null || E.fecha.t - pa.ultimo['ref:' + p.id] > 78));
        const p = U.pick(hund);
        if (p) P.iniciarReferendo(E, 'aprobatorio', p, 'ciudadania');
      }
    },
    /* Un presidente NPC que va bien en las encuestas a veces convoca un plebiscito o una consulta
       sobre un tema que le conviene ideológicamente. */
    iniciativaGobierno(E) {
      const pid = E.gobierno.presidente, pres = E.politicos[pid], pa = E.participacion;
      if (!pid || pid === 'J' || !pres || E.opinion.aprobacionPres < 42 || !U.chance(0.0015)) return;
      if (pa.activos.some(x => (x.tipo === 'plebiscito' || x.tipo === 'consulta') && x.estado !== 'cerrado')) return;
      const tipo = U.chance(0.55) ? 'plebiscito' : 'consulta', pref = tipo === 'plebiscito' ? 'ple:' : 'con:';
      if (P.habilitado(tipo) !== true) return;
      const temas = C.DATA.participacion[tipo].filter(t => { const u = pa.ultimo[pref + t.id]; return u == null || E.fecha.t - u > 104; });
      const t = U.pesado(temas, x => 0.1 + (1 - U.distIdeo(x, pres)) * 2 + Math.max(0, x.popBase) / 20);
      if (!t) return;
      P.crear(E, { tipo, clave: pref + t.id, tema: t.id, titulo: t.nombre, promotor: 'gobierno' });
      pa.ultimo[pref + t.id] = E.fecha.t;
      C.Medios.noticia(E, { tipo: 'campana', titular: `El Presidente ${pres.nombre} convoca ${tipo === 'plebiscito' ? 'un plebiscito' : 'una consulta popular'}: ${t.nombre.toLowerCase()}`, tono: 0, importante: true });
    },
    iniciarReferendo(E, tipo, p, promotor) {
      const m = P.crear(E, { tipo, clave: 'ref:' + p.id, proyecto: p.id, titulo: p.titulo, promotor });
      E.participacion.ultimo['ref:' + p.id] = E.fecha.t;
      C.Medios.noticia(E, { tipo: 'campana', titular: `${{ oposicion: 'La oposición', ciudadania: 'Un comité ciudadano', J: E.jugador.nombre }[promotor]} inicia la recolección de firmas para ${tipo === 'derogatorio' ? 'derogar por referendo' : 'aprobar por referendo'} «${p.titulo}»`, tono: 0, importante: promotor === 'J' || (p.gobierno && tipo === 'derogatorio'), jugador: promotor === 'J' });
      return m;
    },
    iniciarRevocatoria(E, depto, tipo, promotor) {
      const d = E.deptos[depto], id = d[tipo], pol = id === 'J' ? E.jugador : E.politicos[id];
      const nombre = pol ? pol.nombre : 'el funcionario', lugar = tipo === 'gobernador' ? `la Gobernación de ${d.nombre}` : `la Alcaldía de ${d.capital}`;
      const m = P.crear(E, { tipo: 'revocatoria', clave: 'rev:' + depto + ':' + tipo, titulo: `Revocar a ${nombre}`, nivel: tipo === 'gobernador' ? 'departamental' : 'municipal', depto, cargo: tipo, promotor });
      C.Medios.noticia(E, { tipo: 'campana', titular: `Arranca la recolección de firmas para revocar el mandato de ${nombre} en ${lugar}`, tono: -1, importante: id === 'J' || promotor === 'J', jugador: id === 'J' || promotor === 'J' });
      return m;
    },
    iniciarRevocatoriaPresidente(E, promotor) {
      const pres = E.gobierno.presidente === 'J' ? E.jugador : E.politicos[E.gobierno.presidente];
      const m = P.crear(E, { tipo: 'revocatoria', clave: 'rev:presidente', titulo: `Revocar a ${pres.nombre}`, cargo: 'presidente', promotor });
      C.Medios.noticia(E, { tipo: 'campana', titular: `Arranca la recolección de firmas para revocar el mandato del Presidente ${pres.nombre}`, tono: -1, importante: true, jugador: E.gobierno.presidente === 'J' || promotor === 'J' });
      return m;
    },

    registrarAcciones() {
      const A = C.Acciones, esPres = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente';
      const esPresCon = E => E.gobierno.presidente !== 'J' ? 'Sólo el Presidente' : P.habilitado('consulta');
      const esLocal = E => (E.jugador.cargo === 'gobernador' || E.jugador.cargo === 'alcalde') ? P.habilitado('local') : 'Sólo gobernadores y alcaldes';
      const nuevaFirma = m => m && m.estado === 'firmas';
      A.registrar({ id: 'promoverReferendo', nombre: 'Promover referendo', icono: '🗳', grupo: 'participacion', costo: 2,
        disponible: () => P.habilitado('derogatorio'),
        ejecutar(E, a) {
          if (a.tipo !== 'derogatorio' && a.tipo !== 'aprobatorio') return { ok: false, msg: 'Elige el tipo de referendo' };
          const p = E.proyectos[a.proyecto]; if (!p) return { ok: false, msg: 'Elige una ley o un proyecto' };
          if (a.tipo === 'derogatorio' && p.estado !== 'ley') return { ok: false, msg: 'Sólo se derogan leyes vigentes' };
          if (a.tipo === 'aprobatorio' && p.estado !== 'archivado') return { ok: false, msg: 'Sólo se aprueban proyectos que el Congreso hundió' };
          if (['presupuesto', 'nuevoministerio', 'ratificaciontratado'].includes(p.plantilla)) return { ok: false, msg: 'Esta norma no puede someterse a referendo' };
          if (P.activo(E, 'ref:' + p.id)) return { ok: false, msg: 'Ya hay un referendo en curso sobre esto' };
          const ult = E.participacion.ultimo['ref:' + p.id]; if (ult != null && E.fecha.t - ult < 78) return { ok: false, msg: 'Ya se intentó hace poco' };
          P.iniciarReferendo(E, a.tipo, p, 'J');
          return { ok: true, msg: 'Se inscribe el comité promotor: a reunir las firmas' };
        } });
      A.registrar({ id: 'recolectarFirmas', nombre: 'Recolectar firmas', icono: '✍', grupo: 'participacion', costo: 1,
        disponible(E, a) { const m = E.participacion.activos.find(x => x.id === a.id); return nuevaFirma(m) ? true : 'Este proceso no está en recolección de firmas'; },
        ejecutar(E, a) {
          const m = E.participacion.activos.find(x => x.id === a.id), J = E.jugador;
          if (m.tipo === 'revocatoria' && (m.cargo === 'presidente' ? E.gobierno.presidente === 'J' : E.deptos[m.depto][m.cargo] === 'J')) return { ok: false, msg: 'No vas a recoger firmas para revocarte a ti mismo' };
          const d = 8 + U.rf(0, 6) * (0.5 + J.reconocimiento / 100 + J.redes / 20 + J.atributos.carisma / 200);
          m.firmas = Math.min(100, m.firmas + d);
          if (m.firmas >= 100) P.siguienteEtapa(E, m);
          return { ok: true, msg: `Suman ${U.d1(d)} puntos de firmas (${Math.round(m.firmas)} %)` };
        } });
      A.registrar({ id: 'convocarPlebiscito', nombre: 'Convocar plebiscito', icono: '📣', grupo: 'participacion', costo: 3, disponible: esPres,
        ejecutar(E, a) {
          const t = P.tema('plebiscito', a.tema); if (!t) return { ok: false, msg: 'Elige el tema' };
          if (P.activo(E, 'ple:' + a.tema) || E.participacion.activos.some(x => x.tipo === 'plebiscito' && x.estado !== 'cerrado')) return { ok: false, msg: 'Ya hay un plebiscito en curso' };
          const ult = E.participacion.ultimo['ple:' + a.tema]; if (ult != null && E.fecha.t - ult < 104) return { ok: false, msg: 'El país votó esto hace poco' };
          P.crear(E, { tipo: 'plebiscito', clave: 'ple:' + a.tema, tema: a.tema, titulo: t.nombre, promotor: 'J' });
          E.participacion.ultimo['ple:' + a.tema] = E.fecha.t;
          C.Medios.noticia(E, { tipo: 'campana', titular: `El Presidente convoca un plebiscito: ${t.nombre.toLowerCase()}`, tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se envía la convocatoria al Senado' };
        } });
      A.registrar({ id: 'convocarConsultaNacional', nombre: 'Convocar consulta popular', icono: '🗣', grupo: 'participacion', costo: 3, disponible: esPresCon,
        ejecutar(E, a) {
          const t = P.tema('consulta', a.tema); if (!t) return { ok: false, msg: 'Elige el tema' };
          if (E.participacion.activos.some(x => x.tipo === 'consulta' && x.estado !== 'cerrado')) return { ok: false, msg: 'Ya hay una consulta nacional en curso' };
          const ult = E.participacion.ultimo['con:' + a.tema]; if (ult != null && E.fecha.t - ult < 104) return { ok: false, msg: 'El país votó esto hace poco' };
          P.crear(E, { tipo: 'consulta', clave: 'con:' + a.tema, tema: a.tema, titulo: t.nombre, promotor: 'J' });
          E.participacion.ultimo['con:' + a.tema] = E.fecha.t;
          C.Medios.noticia(E, { tipo: 'campana', titular: `El Presidente convoca una consulta popular: ${t.nombre.toLowerCase()}`, tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se envía la convocatoria al Senado' };
        } });
      A.registrar({ id: 'convocarConsultaLocal', nombre: 'Convocar consulta local', icono: '🏘', grupo: 'participacion', costo: 2, disponible: esLocal,
        ejecutar(E, a) {
          const t = P.tema('local', a.tema); if (!t) return { ok: false, msg: 'Elige el tema' };
          const J = E.jugador, depto = J.cargoInfo.depto, cargo = J.cargo;
          if (E.participacion.activos.some(x => x.tipo === 'local' && x.depto === depto && x.cargo === cargo && x.estado !== 'cerrado')) return { ok: false, msg: 'Ya hay una consulta local en curso' };
          P.crear(E, { tipo: 'local', clave: 'loc:' + depto + ':' + a.tema, tema: a.tema, titulo: t.nombre, promotor: 'J', nivel: cargo === 'gobernador' ? 'departamental' : 'municipal', depto, cargo });
          C.Medios.noticia(E, { tipo: 'campana', titular: `${J.nombre} convoca una consulta popular local: ${t.nombre.toLowerCase()}`, tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Se pide el concepto favorable de la corporación local' };
        } });
      A.registrar({ id: 'cabildoAbierto', nombre: 'Convocar cabildo abierto', icono: '🏛', grupo: 'participacion', costo: 1, disponible: esLocal,
        ejecutar(E) {
          const J = E.jugador, g = C.GobiernoLocal.asegurar(E, J.cargoInfo.depto, J.cargo === 'gobernador' ? 'gobernacion' : 'alcaldia');
          g.civico.descontento = U.clamp(g.civico.descontento - 8, 0, 100); g.civico.relJ = U.clamp(g.civico.relJ + 4, -100, 100);
          J.popularidad = U.clamp(J.popularidad + 0.8, 0, 100);
          return { ok: true, msg: 'El cabildo abierto baja el descontento y mejora la relación con la ciudadanía' };
        } });
      A.registrar({ id: 'hacerCampanaRef', nombre: 'Hacer campaña', icono: '📢', grupo: 'participacion', costo: 1,
        disponible(E, a) { const m = E.participacion.activos.find(x => x.id === a.id); return m && m.estado === 'campana' ? true : 'La campaña aún no ha empezado'; },
        ejecutar(E, a) {
          if (a.lado !== 'si' && a.lado !== 'no') return { ok: false, msg: 'Elige un lado' };
          const m = E.participacion.activos.find(x => x.id === a.id), J = E.jugador;
          const f = U.rf(1.5, 3) * (0.6 + J.reconocimiento / 100 + J.atributos.carisma / 150);
          if (a.lado === 'si') m.campSi += f; else m.campNo += f;
          C.Opinion.subirRec(E, 0.3);
          return { ok: true, msg: `Tu campaña por el ${a.lado === 'si' ? 'Sí' : 'No'} mueve el apoyo` };
        } });
      A.registrar({ id: 'fijarPosturaPartido', nombre: 'Fijar la postura del partido', icono: '🎖', grupo: 'participacion', costo: 1,
        disponible(E, a) {
          const pa = E.partidos[E.jugador.partido]; if (!pa || pa.lider !== 'J') return 'Debes dirigir tu partido';
          const m = E.participacion.activos.find(x => x.id === a.id); return m && m.estado !== 'cerrado' ? true : 'Este proceso ya cerró';
        },
        ejecutar(E, a) {
          if (a.lado !== 'si' && a.lado !== 'no') return { ok: false, msg: 'Elige un lado' };
          const pa = E.partidos[E.jugador.partido], m = E.participacion.activos.find(x => x.id === a.id);
          const auto = P.posturaPartido(E, Object.assign({}, m, { posturas: {} }), pa.id);
          m.posturas[pa.id] = a.lado === 'si' ? 1 : -1;
          if (Math.sign(m.posturas[pa.id]) !== Math.sign(auto) && Math.abs(auto) > 0.4) { pa.cohesion = U.clamp(pa.cohesion - 1.5, 0, 100); return { ok: true, msg: `Tu partido se alinea con el ${a.lado === 'si' ? 'Sí' : 'No'}, aunque choca con su ideología: baja la cohesión` }; }
          return { ok: true, msg: `Tu partido se alinea con el ${a.lado === 'si' ? 'Sí' : 'No'}` };
        } });
      A.registrar({ id: 'impulsarRevocatoria', nombre: 'Impulsar revocatoria', icono: '🚪', grupo: 'participacion', costo: 2, disponible: () => P.habilitado('revocatoria'),
        ejecutar(E, a) {
          if (!['gobernador', 'alcalde'].includes(a.cargo) || !E.deptos[a.depto]) return { ok: false, msg: 'Elige el funcionario' };
          if (E.deptos[a.depto][a.cargo] === 'J') return { ok: false, msg: 'No puedes revocarte a ti mismo' };
          const ok = P.puedeRevocar(E, a.depto, a.cargo); if (ok !== true) return { ok: false, msg: ok };
          P.iniciarRevocatoria(E, a.depto, a.cargo, 'J');
          return { ok: true, msg: 'Se inscribe el comité: a reunir las firmas' };
        } });
      A.registrar({ id: 'impulsarRevocatoriaPresidente', nombre: 'Impulsar revocatoria del Presidente', icono: '🚪', grupo: 'participacion', costo: 3,
        disponible(E) { if (E.gobierno.presidente === 'J') return 'No puedes revocarte a ti mismo'; return P.puedeRevocarPresidente(E); },
        ejecutar(E) { P.iniciarRevocatoriaPresidente(E, 'J'); return { ok: true, msg: 'Se inscribe el comité promotor de la revocatoria' }; } });
    }
  };

  C.Participacion = P;
  C.Tiempo.registrar('participacion', P, 69);
  P.registrarAcciones();
  C.Bus.on('proyecto:archivado', p => { const E = C.E; if (E && E.participacion && p.plantilla && !['presupuesto', 'nuevoministerio', 'ratificaciontratado'].includes(p.plantilla)) { E.participacion.hundidos.push(p.id); if (E.participacion.hundidos.length > 40) E.participacion.hundidos.shift(); } });
})(window.CURUL);
