/* Inteligencia y guerra sucia. El Presidente dispone del servicio de inteligencia del Estado (el DAS
   hasta 2011, la DNI después; antes, un servicio menor); cualquiera puede contratar detectives
   privados. Interceptar a un político, un periodista o un magistrado produce expedientes con
   información comprometedora que se puede filtrar a la prensa (el blanco se hunde), usar para presionar
   (el blanco cede) o archivar. Todo deja rastro: cada operación suma riesgo de que estalle el
   escándalo de las «chuzadas», que cuesta aprobación, riesgo judicial y prestigio de la agencia.
   La guerra sucia incluye campañas negras contra un rival y ejércitos de bots en redes. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const TIPOS_EXP = {
    corrupcion: { n: 'Contratos y sobornos', txt: 'contratos amañados y pagos bajo la mesa' },
    personal: { n: 'Vida privada', txt: 'un escándalo de vida privada' },
    financiacion: { n: 'Financiación de campañas', txt: 'aportes ilegales a su campaña' },
    pactos: { n: 'Pactos secretos', txt: 'reuniones y pactos con quienes no debería' }
  };
  const USOS = { filtrar: 'Filtrar a la prensa', presionar: 'Presionar', archivar: 'Archivar' };

  const I = {
    TIPOS_EXP, USOS,
    init(E) { E.inteligencia = null; I.asegurar(E); },
    migrar(E) { I.asegurar(E); },
    asegurar(E) {
      if (!E.inteligencia) E.inteligencia = { capacidad: 55, expedientes: [], riesgo: 0, historial: [], bots: 0, chuzadoJ: null, escandalos: 0 };
      return E.inteligencia;
    },
    agencia() { const a = U.anio(); return a >= 2012 ? 'Dirección Nacional de Inteligencia (DNI)' : a >= 1960 ? 'Departamento Administrativo de Seguridad (DAS)' : 'Servicio de Inteligencia del Estado'; },
    siglaAgencia() { const a = U.anio(); return a >= 2012 ? 'DNI' : a >= 1960 ? 'DAS' : 'el servicio de inteligencia'; },
    esPres(E) { return E.gobierno.presidente === 'J'; },
    objetivo(E, id) { return E.politicos[id]; },
    /* Cuánto vale hoy un expediente (se enfría con el tiempo). */
    valor(E, x) { return x.sev * Math.max(0.3, 1 - (E.fecha.t - x.t) / 156); },

    turno(E) {
      const q = I.asegurar(E);
      q.riesgo = Math.max(0, q.riesgo * 0.992 - 0.05);
      q.bots = Math.max(0, q.bots - 1);
      q.expedientes = q.expedientes.filter(x => x.estado !== 'vigente' || E.fecha.t - x.t < 260);
      if (q.riesgo > 6 && U.chance(Math.min(0.05, q.riesgo / 100 * 0.05))) I.estalla(E);
      // Un gobierno NPC con la Corte enfrentada a veces cae en el escándalo de las chuzadas.
      if (E.gobierno.presidente !== 'J' && !E.meta.presim && U.chance(0.0006 + E.corte.tension / 100 * 0.0008)) I.chuzadasDelGobierno(E);
      if (E.gobierno.presidente !== 'J' && !q.chuzadoJ && !E.meta.presim && E.partidos[E.jugador.partido] && E.partidos[E.jugador.partido].postura === 'oposicion' && U.chance(0.0015)) {
        q.chuzadoJ = E.fecha.t;
        C.Medios.noticia(E, { tipo: 'escandalo', titular: `Se filtra que ${I.siglaAgencia()} habría seguido a ${E.jugador.nombre} y a otros líderes de oposición`, tono: -1, jugador: true, importante: true });
      }
    },
    /* Escándalo por las operaciones del propio jugador. */
    estalla(E) {
      const q = I.asegurar(E), J = E.jugador, pres = I.esPres(E);
      q.riesgo *= 0.35; q.escandalos++;
      q.historial.unshift({ t: E.fecha.t, txt: pres ? `Estalla el escándalo de las chuzadas de ${I.siglaAgencia()}` : 'Se descubre que contrataste seguimientos ilegales' }); q.historial.length = Math.min(q.historial.length, 20);
      E.opinion.escandalos = (E.opinion.escandalos || 0) + 1.5;
      J.riesgoJudicial = U.clamp((J.riesgoJudicial || 0) + U.rf(10, 20), 0, 100);
      J.rep.honestidad = U.clamp(J.rep.honestidad - 8, 0, 100); J.credibilidad = U.clamp(J.credibilidad - 8, 0, 100);
      if (pres) {
        E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(4, 8), 5, 95);
        E.corte.tension = U.clamp(E.corte.tension + 8, 0, 100);
        q.capacidad = U.clamp(q.capacidad - 10, 10, 100);
        C.Medios.noticia(E, { tipo: 'escandalo', titular: `Escándalo de las «chuzadas»: revelan que ${I.siglaAgencia()} interceptó ilegalmente a políticos y periodistas por orden de ${J.nombre}`, tono: -1, importante: true, jugador: true });
      } else C.Medios.noticia(E, { tipo: 'escandalo', titular: `Investigan a ${J.nombre} por contratar seguimientos e interceptaciones ilegales`, tono: -1, importante: true, jugador: true });
      C.Personaje.anotar(E, 'Estalla el escándalo de las interceptaciones ilegales');
    },
    chuzadasDelGobierno(E) {
      const pres = E.politicos[E.gobierno.presidente]; if (!pres) return;
      E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - U.rf(2, 5), 5, 95); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.8; E.corte.tension = U.clamp(E.corte.tension + 6, 0, 100);
      C.Medios.noticia(E, { tipo: 'escandalo', titular: `Escándalo de las «chuzadas»: acusan a ${I.siglaAgencia()} de espiar a opositores y magistrados durante el Gobierno de ${pres.nombre}`, tono: -1, importante: true });
    },

    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'fortalecerInteligencia', nombre: 'Fortalecer la inteligencia', icono: '🕶', grupo: 'gobierno', costo: 2,
        disponible: E => I.esPres(E) ? true : 'Sólo el Presidente dirige el servicio de inteligencia del Estado',
        ejecutar(E) { const q = I.asegurar(E); q.capacidad = U.clamp(q.capacidad + U.rf(4, 7), 10, 100); return { ok: true, msg: `${I.siglaAgencia()} gana capacidad (${Math.round(q.capacidad)}/100)` }; } });
      A.registrar({ id: 'interceptar', nombre: 'Ordenar una interceptación', icono: '🎧', grupo: 'gobierno', costo: 2,
        ejecutar(E, a) {
          const q = I.asegurar(E), J = E.jugador, p = E.politicos[a.objetivo];
          if (!p || p.id === 'J' || !p.activo) return { ok: false, msg: 'Elige el blanco' };
          const estado = a.canal !== 'privado';
          if (estado && !I.esPres(E)) return { ok: false, msg: 'Sólo el Presidente puede usar al servicio de inteligencia: contrata detectives privados' };
          const costo = estado ? 0 : 25;
          if (J.patrimonio < costo) return { ok: false, msg: `Necesitas ${U.cop(costo)} para pagar a los detectives` };
          J.patrimonio -= costo;
          const prob = U.clamp((estado ? q.capacidad / 100 * 0.75 + 0.1 : 0.42) + (p.r.dis - 50) * -0.002, 0.15, 0.9);
          q.riesgo = Math.min(100, q.riesgo + (estado ? U.rf(9, 15) : U.rf(5, 9)));
          if (!U.chance(prob)) return { ok: true, msg: 'La operación no consigue nada útil... y deja rastro', exito: false };
          const tipo = U.pick(Object.keys(TIPOS_EXP)), sev = U.ri(30, 92) * (p.cargo ? 1 : 0.7);
          const x = { id: U.id('ex'), objetivo: p.id, nombre: p.nombre, tipo, sev: Math.round(sev), t: E.fecha.t, estado: 'vigente', canal: estado ? 'estado' : 'privado' };
          q.expedientes.unshift(x); if (q.expedientes.length > 30) q.expedientes.pop();
          return { ok: true, msg: `Consigues un expediente sobre ${p.nombre}: ${TIPOS_EXP[tipo].txt} (gravedad ${x.sev})` };
        } });
      A.registrar({ id: 'usarExpediente', nombre: 'Usar expediente', icono: '📂', grupo: 'gobierno', costo: 1,
        ejecutar(E, a) {
          const q = I.asegurar(E), x = q.expedientes.find(e => e.id === a.id && e.estado === 'vigente'), J = E.jugador;
          if (!x) return { ok: false, msg: 'Ese expediente ya no está vigente' };
          if (!USOS[a.uso]) return { ok: false, msg: 'Elige qué hacer con él' };
          const p = E.politicos[x.objetivo], v = I.valor(E, x);
          if (a.uso === 'archivar') { x.estado = 'archivado'; q.riesgo = Math.max(0, q.riesgo - 4); return { ok: true, msg: 'Archivas el expediente: un rastro menos' }; }
          if (!p) { x.estado = 'archivado'; return { ok: false, msg: 'El blanco ya no está en política' }; }
          x.estado = a.uso === 'filtrar' ? 'filtrado' : 'presionado';
          if (a.uso === 'filtrar') {
            p.fuerza = U.clamp(p.fuerza - v / 6, 5, 100);
            if (p.partido && E.partidos[p.partido]) E.partidos[p.partido].popularidad = U.clamp(E.partidos[p.partido].popularidad - v / 220, 0.3, 45);
            p.relJ = U.clamp((p.relJ || 0) - 25, -100, 100);
            E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.15;
            C.Politicos.anotar(p, `Le filtran ${TIPOS_EXP[x.tipo].txt}`);
            C.Medios.noticia(E, { tipo: 'escandalo', titular: `Revelan ${TIPOS_EXP[x.tipo].txt} de ${p.nombre}`, tono: -1, importante: v > 55 });
            if (v > 65 && p.cargo && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante') && U.chance(0.25)) {
              C.Gobierno.vacante(E, p); p.activo = false; p.cargo = null;
              C.Medios.noticia(E, { tipo: 'escandalo', titular: `${p.nombre} renuncia a su curul tras las revelaciones`, tono: -1, importante: true });
            }
            q.riesgo = Math.min(100, q.riesgo + U.rf(3, 7) * (x.canal === 'estado' ? 1.3 : 1));
            return { ok: true, msg: `Filtras el expediente: ${p.nombre} se hunde en los medios` };
          }
          p.relJ = U.clamp((p.relJ || 0) + 30 + v / 4, -100, 100);
          p.presionadoPorJ = E.fecha.t;
          q.riesgo = Math.min(100, q.riesgo + U.rf(4, 9));
          const denuncia = U.chance(0.15 + p.r.dis / 500);
          if (denuncia) { J.credibilidad = U.clamp(J.credibilidad - 6, 0, 100); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.7; C.Medios.noticia(E, { tipo: 'escandalo', titular: `${p.nombre} denuncia que ${J.nombre} lo chantajea con información reservada`, tono: -1, importante: true, jugador: true }); }
          return { ok: true, msg: denuncia ? `${p.nombre} cede... pero te denuncia por chantaje` : `${p.nombre} entiende el mensaje y cede: su relación contigo sube a ${Math.round(p.relJ)}` };
        } });
      A.registrar({ id: 'campanaNegra', nombre: 'Campaña negra', icono: '🕳', grupo: 'medios', costo: 2,
        ejecutar(E, a) {
          const J = E.jugador, pa = E.partidos[a.partido];
          if (!pa || pa.especial || pa.futuro) return { ok: false, msg: 'Elige el partido rival' };
          if (pa.id === J.partido) return { ok: false, msg: 'No vas a atacar a tu propio partido' };
          if (J.patrimonio < 60) return { ok: false, msg: `Necesitas ${U.cop(60)} para pagar la pauta y los perfiles falsos` };
          J.patrimonio -= 60;
          const fuerza = U.rf(0.35, 0.9) * (1 + E.redes.viralidad / 150);
          pa.popularidad = Math.max(0.3, pa.popularidad - fuerza);
          const q = I.asegurar(E);
          const prob = U.clamp(0.16 + q.riesgo / 250 + E.redes.cancelaciones * 0.01, 0.1, 0.5);
          if (U.chance(prob)) {
            pa.popularidad += fuerza * 0.8; J.credibilidad = U.clamp(J.credibilidad - U.rf(6, 10), 0, 100); J.rep.honestidad = U.clamp(J.rep.honestidad - 5, 0, 100); E.opinion.escandalos = (E.opinion.escandalos || 0) + 0.5;
            C.Medios.noticia(E, { tipo: 'escandalo', titular: `Descubren que ${J.nombre} financió una campaña negra contra ${pa.nombre}`, tono: -1, importante: true, jugador: true });
            return { ok: true, msg: 'Te descubren: la campaña se te devuelve', exito: false };
          }
          return { ok: true, msg: `La campaña negra golpea a ${pa.sigla} (−${U.d1(fuerza)} pts de intención de voto)` };
        } });
      A.registrar({ id: 'ejercitoBots', nombre: 'Ejército de bots', icono: '🤖', grupo: 'medios', costo: 1,
        ejecutar(E) {
          const J = E.jugador, q = I.asegurar(E);
          if (J.patrimonio < 40) return { ok: false, msg: `Necesitas ${U.cop(40)} para contratar la bodega digital` };
          J.patrimonio -= 40; q.bots = 4; E.redes.viralidad = U.clamp(E.redes.viralidad + 25, 0, 100); C.Opinion.subirRec(E, 1.8);
          if (U.chance(0.2 + E.redes.cancelaciones * 0.01)) {
            J.credibilidad = U.clamp(J.credibilidad - 7, 0, 100); E.redes.cancelaciones++; C.Medios.noticia(E, { tipo: 'redes', titular: `Destapan la «bodega» de bots que amplificaba a ${J.nombre} en redes`, tono: -1, importante: true, jugador: true });
            return { ok: true, msg: 'Los bots son descubiertos: pierdes credibilidad', exito: false };
          }
          return { ok: true, msg: 'Tus bots inundan las redes: sube la viralidad y tu reconocimiento' };
        } });
      A.registrar({ id: 'denunciarChuzadas', nombre: 'Denunciar el espionaje', icono: '📣', grupo: 'medios', costo: 1,
        disponible: E => I.asegurar(E).chuzadoJ != null ? true : 'Nadie te ha espiado (que se sepa)',
        ejecutar(E) {
          const q = I.asegurar(E), J = E.jugador; q.chuzadoJ = null;
          J.credibilidad = U.clamp(J.credibilidad + 5, 0, 100); C.Opinion.subirRec(E, 1.2); E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres - 2, 5, 95); E.corte.tension = U.clamp(E.corte.tension + 4, 0, 100);
          C.Medios.noticia(E, { tipo: 'escandalo', titular: `${J.nombre} denuncia ante la Corte el espionaje del Gobierno a la oposición`, tono: 0, jugador: true, importante: true });
          return { ok: true, msg: 'Denuncias el espionaje: ganas credibilidad y el Gobierno se resiente' };
        } });
    }
  };
  C.Inteligencia = I;
  C.Tiempo.registrar('inteligencia', I, 72);
  I.registrarAcciones();
})(window.CURUL);
