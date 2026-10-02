/* Áreas metropolitanas: las grandes conurbaciones del país (Valle de Aburrá, Bogotá-Región, Cali, Barranquilla, Manizales,
   Pereira, Bucaramanga, Cartagena y Cúcuta). Pueden existir de hecho —varios municipios que funcionan como una sola ciudad
   sin quien la gobierne— o estar constituidas como entidad, con junta metropolitana (los alcaldes), director, sobretasa y
   fondo propios. Constituirlas exige el concepto de los concejos y una consulta popular (democracia directa). Una vez en
   marcha, el área lanza proyectos de movilidad, ambiente, vivienda, seguridad y servicios, anexa municipios vecinos, crea
   empresas metropolitanas (como el Metro) y mueve los indicadores de los departamentos donde está. Sin gobierno, la
   conurbación se degrada: trancones, aire sucio y ciudades dormitorio sin servicios. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const PROYECTOS = {
    metro: { n: 'Sistema de metro o tren metropolitano', icono: '🚇', costo: 3.0, sem: 104, ef: { movilidad: 18, ambiente: 8, integracion: 6 }, conpes: true, txt: 'La gran obra: cambia la movilidad del área. Necesita CONPES y cofinanciación de la Nación.' },
    cable: { n: 'Cables y buses de alta capacidad', icono: '🚠', costo: 0.5, sem: 40, ef: { movilidad: 8, integracion: 3, seguridad: 3 }, txt: 'Conecta las laderas y los municipios periféricos.' },
    ciclo: { n: 'Red de ciclorrutas metropolitana', icono: '🚲', costo: 0.12, sem: 20, ef: { movilidad: 3, ambiente: 3 }, txt: 'Barata y rápida; mejora un poco el aire y la movilidad.' },
    aire: { n: 'Plan de calidad del aire', icono: '🌬', costo: 0.2, sem: 30, ef: { ambiente: 10 }, txt: 'Controles a fuentes móviles y fijas, y vigilancia continua.' },
    vivienda: { n: 'Vivienda social metropolitana', icono: '🏘', costo: 0.6, sem: 52, ef: { vivienda: 12, tension: -4 }, txt: 'Suelo y subsidios para frenar las ciudades dormitorio.' },
    seguridad: { n: 'Seguridad y justicia metropolitanas', icono: '🛡', costo: 0.3, sem: 30, ef: { seguridad: 8, integracion: 2 }, txt: 'Una sola estrategia contra el crimen que cruza los límites municipales.' },
    residuos: { n: 'Relleno y gestión regional de residuos', icono: '♻', costo: 0.4, sem: 40, ef: { servicios: 9, ambiente: 3 }, txt: 'Un solo sistema de aseo y disposición para toda el área.' },
    ordenamiento: { n: 'Plan de ordenamiento metropolitano', icono: '🗺', costo: 0.05, sem: 26, ef: { integracion: 7, movilidad: 2, vivienda: 2 }, txt: 'Coordina el uso del suelo de todos los municipios.' }
  };
  const IND = { integracion: 'Integración', movilidad: 'Movilidad', ambiente: 'Ambiente', seguridad: 'Seguridad', vivienda: 'Vivienda', servicios: 'Servicios', tension: 'Tensión núcleo–periferia', legit: 'Legitimidad' };
  const M = () => C.DATA.municipios;
  const NOMBRES = () => C.DATA.nombres;

  const Me = {
    PROYECTOS, IND,
    defs: () => C.DATA.metropolis,
    def: id => C.DATA.metropolis.find(d => d.id === id),
    nombreMuni: code => (M()[code] ? M()[code].n : code),
    pob(code) { const m = M()[code]; return m ? Math.round(m.pob * Math.pow(1 + C.DATA.metropolisCrecimiento, U.anio() - 2026)) : 0; },
    poblacion(a) { return U.suma(a.miembros.map(Me.pob)); },
    poblacionTotal(a) { return U.suma(a.miembros.concat(a.aspirantes).map(Me.pob)); },
    nucleoDepto(a) { return M()[Me.def(a.id).nucleo].dp; },
    deptos(a) { return [...new Set(a.miembros.map(c => M()[c].dp))]; },
    asegurar(E) {
      if (E.metro && E.metro.areas) { for (const d of Me.defs()) if (!E.metro.areas[d.id]) E.metro.areas[d.id] = Me.nueva(E, d); return E.metro; }
      E.metro = { areas: {}, hist: [] };
      for (const d of Me.defs()) E.metro.areas[d.id] = Me.nueva(E, d);
      return E.metro;
    },
    init(E) { E.metro = null; Me.asegurar(E); Me.sembrarEmpresas(E); },
    migrar(E) { Me.asegurar(E); Me.sembrarEmpresas(E); },
    area(E, id) { return Me.asegurar(E).areas[id]; },
    todas(E) { return Me.defs().map(d => Me.area(E, d.id)); },
    director(E, perfil) { const N = NOMBRES(), h = U.chance(0.5); return { nombre: `${U.pick(h ? N.h : N.m)} ${U.pick(N.a)}`, calidad: Math.round(perfil === 'politico' ? U.ri(40, 70) : U.ri(60, 90)), perfil: perfil || 'tecnico', desde: E.fecha.t, hasta: E.fecha.t + 208 }; },
    nueva(E, d) {
      const y = U.anio(), real = !!d.fundada && y >= d.fundada;
      const a = { id: d.id, estado: real ? 'constituida' : 'conurbacion', desde: real ? E.fecha.t : null, miembros: d.miembros.slice(), aspirantes: d.aspirantes.slice(), bonos: {}, proyectos: [], sobretasa: real ? 1 : 0, caja: { fondoRegalias: real ? 0.3 : 0 }, hist: [], consulta: null, empresa: null, falla: -999, alcaldes: {}, ultEvento: -999, tramiteNPC: null, director: real ? Me.director(E) : null };
      const pobM = Me.poblacion(a) / 1e6;
      a.indic = { integracion: real ? 40 : 12, movilidad: U.clamp(72 - pobM * 4.5 - (real ? 0 : 9), 20, 85), ambiente: U.clamp(70 - pobM * 2.2 - (d.id === 'ABURRA' ? 7 : 0), 25, 85), seguridad: 55, vivienda: U.clamp(64 - pobM * 3, 20, 80), servicios: U.clamp(66 - pobM * 1.5, 30, 85), tension: 28, legit: 50 };
      return a;
    },
    /* Ingresos semanales del área: recaudo propio (sobretasa), participación de los municipios, dividendos de su empresa, menos servicio de la deuda */
    ingresos(E, a) {
      const pobM = Me.poblacion(a) / 1e6, emp = a.empresa ? C.Empresas.asegurar(E).lista.find(x => x.id === a.empresa) : null;
      const propio = pobM * 0.004 * (1 + 0.8 * a.sobretasa), municipios = pobM * 0.0015, div = emp ? Math.max(0, emp.capital * (emp.rentabilidad || 0) / 100 / 52 * 0.5) : 0, servicio = (a.caja.deuda || 0) * 0.0035;
      return { propio, municipios, dividendos: div, servicio, total: propio + municipios + div };
    },
    sembrarEmpresas(E) {
      const a = Me.area(E, 'ABURRA'), q = C.Empresas.asegurar(E);
      if (a.estado === 'constituida' && U.anio() >= 1995 && !a.empresa && !q.lista.some(e => e.nombre === 'Metro de Medellín')) {
        const e = C.Empresas.crear(E, { depto: 'ANT', organo: 'metro', metro: 'ABURRA', nombre: 'Metro de Medellín', sector: 'transporte', capital: 3.5, cobertura: 62, calidad: 84, gestion: 80, integridad: 76, deuda: 1.2, sindicato: 35 });
        q.lista.push(e); a.empresa = e.id;
      }
    },
    esGestor(E, id) {
      const a = Me.area(E, id), J = E.jugador; if (!a) return false;
      return E.gobierno.presidente === 'J' || (J.cargo === 'alcalde' && J.cargoInfo.depto === Me.nucleoDepto(a)) || (J.cargo === 'gobernador' && Me.deptos(a).includes(J.cargoInfo.depto));
    },
    gestorTxt: 'Sólo el alcalde del núcleo, un gobernador del área o el Presidente gestionan el área metropolitana',
    municipios(a) {
      const d = Me.def(a.id);
      return a.miembros.map(c => ({ code: c, n: Me.nombreMuni(c), pob: Me.pob(c), rol: c === d.nucleo ? 'nucleo' : 'miembro' })).concat(a.aspirantes.map(c => ({ code: c, n: Me.nombreMuni(c), pob: Me.pob(c), rol: 'aspirante' })));
    },
    /* Alcaldes de los municipios (sintéticos salvo el del núcleo) para la junta metropolitana */
    alcalde(E, a, code) {
      const d = Me.def(a.id);
      if (code === d.nucleo) { const dp = E.deptos[M()[code].dp], id = dp ? dp.alcalde : null; if (id === 'J') return { nombre: E.jugador.nombre, partido: E.jugador.partido, afin: 100, mio: true }; const p = E.politicos[id]; if (p) return { nombre: p.nombre, partido: p.partido, afin: 40, mio: false }; }
      if (!a.alcaldes[code]) { const N = NOMBRES(), h = U.chance(0.7), ps = Object.values(E.partidos).filter(p => !p.especial && !p.futuro); a.alcaldes[code] = { nombre: `${U.pick(h ? N.h : N.m)} ${U.pick(N.a)}`, partido: U.pesado(ps, p => p.popularidad).id, afin: U.ri(-35, 55), mio: false }; }
      return a.alcaldes[code];
    },
    /* Votación de la junta metropolitana, ponderada por población (ningún municipio pesa más del 40 %) */
    votarJunta(E, a, base, extra) {
      const tot = U.suma(a.miembros.map(Me.pob)) || 1; let si = 0, w = 0; const det = [];
      for (const c of a.miembros) {
        const al = Me.alcalde(E, a, c), peso = Math.min(0.4, Me.pob(c) / tot);
        const p = al.mio ? 1 : U.clamp((base != null ? base : 0.5) + al.afin / 240 + (extra || 0) - Math.max(0, a.indic.tension - 55) / 300, 0.05, 0.95);
        const voto = al.mio || U.chance(p); if (voto) si += peso; w += peso; det.push({ code: c, n: Me.nombreMuni(c), voto, alcalde: al.nombre });
      }
      return { aprobado: si / w > 0.5, si: Math.round(si / w * 100), detalle: det };
    },
    anotar(E, a, txt) { a.hist.unshift({ t: E.fecha.t, txt }); if (a.hist.length > 16) a.hist.pop(); },
    noticia(E, a, txt, tono, imp) { if (E.meta.presim) return; C.Medios.noticia(E, { tipo: 'regional', titular: txt, tono: tono || 0, importante: !!imp, jugador: Me.esGestor(E, a.id) }); },

    constituir(E, a, via) {
      const d = Me.def(a.id);
      a.estado = 'constituida'; a.desde = E.fecha.t; a.consulta = null; a.tramiteNPC = null;
      a.director = Me.director(E); a.indic.integracion = Math.max(a.indic.integracion, 30); a.indic.legit = Math.max(a.indic.legit, 48);
      a.sobretasa = 1; a.caja.fondoRegalias += 0.1;
      Me.anotar(E, a, `Se constituye el ${d.n}`);
      Me.noticia(E, a, `Nace el ${d.n}: ${a.miembros.length} municipios bajo una misma junta`, 1, true);
    },
    /* La consulta popular terminó (la llama Participacion al votar) */
    aplicarConsulta(E, m, r, ef, opin) {
      const a = Me.area(E, m.metro), d = Me.def(m.metro); if (!a) return;
      if (r.pasa) { Me.constituir(E, a, 'consulta'); ef(`Gana el Sí: nace el ${d.n}`); if (Me.esGestor(E, a.id)) opin(U.rf(1, 3), 'El país aplaude la nueva área metropolitana', ''); }
      else { a.estado = 'conurbacion'; a.consulta = null; a.falla = E.fecha.t; ef(r.valido ? 'Gana el No: la conurbación sigue sin gobierno propio' : 'No se alcanza el umbral de participación'); Me.noticia(E, a, `La consulta rechaza el ${d.n}`, -1, true); if (Me.esGestor(E, a.id)) opin(-U.rf(0.5, 1.5), '', 'Pierdes la consulta metropolitana'); }
    },

    turno(E) {
      const a0 = Me.asegurar(E), pres = E.meta.presim;
      for (const a of Me.todas(E)) {
        const d = Me.def(a.id), cons = a.estado === 'constituida', I = a.indic, pobM = Me.poblacion(a) / 1e6, dir = a.director, gestor = Me.esGestor(E, a.id);
        const b = a.bonos; for (const k of Object.keys(b)) b[k] *= 0.9996;
        const deptos = Me.deptos(a), seg = U.prom(deptos.map(x => E.deptos[x].seguridad));
        const meta = {
          movilidad: 72 - pobM * 4.5 - (cons ? 0 : 9) + I.integracion * 0.12 + (b.movilidad || 0),
          ambiente: 70 - pobM * 2.2 - (a.id === 'ABURRA' ? 7 : 0) - (cons ? 0 : 5) + I.integracion * 0.08 + (b.ambiente || 0),
          seguridad: seg * 0.7 + (55 + (b.seguridad || 0)) * 0.3,
          vivienda: 64 - pobM * 3 + (b.vivienda || 0) - (cons ? 0 : 3),
          servicios: 66 - pobM * 1.5 + I.integracion * 0.1 + (b.servicios || 0) + (a.empresa ? ((C.Empresas.asegurar(E).lista.find(x => x.id === a.empresa) || { calidad: 60 }).calidad - 60) * 0.15 : 0)
        };
        for (const k of Object.keys(meta)) I[k] = U.clamp(I[k] + (meta[k] - I[k]) * 0.012 + U.gauss(0, 0.12), 5, 98);
        if (cons) {
          I.integracion = U.clamp(I.integracion + 0.035 * (0.6 + (dir ? dir.calidad : 50) / 100) - (I.tension > 65 ? 0.05 : 0) + a.proyectos.length * 0.004 + (b.integracion || 0) * 0.0006, 0, 100);
          I.tension = U.clamp(I.tension + (24 + a.sobretasa * 5 - I.integracion * 0.18 + (b.tension || 0) - I.tension) * 0.012 + U.gauss(0, 0.25), 0, 100);
          I.legit = U.clamp(I.legit + (38 + I.integracion * 0.4 - I.tension * 0.2 - I.legit) * 0.01, 5, 95);
          const ing = Me.ingresos(E, a); a.caja.fondoRegalias += ing.total - ing.servicio; a.caja.deuda = Math.max(0, (a.caja.deuda || 0) - ing.servicio * 0.65);
          // proyectos
          for (const p of a.proyectos) {
            p.resta--; if (p.resta > 0) continue;
            const P = PROYECTOS[p.tipo]; for (const [k, v] of Object.entries(P.ef)) { if (k === 'tension') I.tension = U.clamp(I.tension + v, 0, 100); else b[k] = (b[k] || 0) + v; }
            Me.anotar(E, a, `Termina: ${P.n}`); Me.noticia(E, a, `${d.corto}: termina ${P.n.toLowerCase()}`, 1, gestor);
          }
          a.proyectos = a.proyectos.filter(p => p.resta > 0);
          if (dir && E.fecha.t >= dir.hasta) a.director = Me.director(E, dir.perfil);
          if (a.sobretasa > 0 && gestor) for (const dp of [Me.nucleoDepto(a)]) E.deptos[dp].ajusteAprob = U.clamp((E.deptos[dp].ajusteAprob || 0) - 0.0008 * a.sobretasa, -30, 30);
        } else {
          I.integracion = Math.max(5, I.integracion - 0.01); I.tension = U.clamp(I.tension + (30 - I.tension) * 0.01, 0, 100);
          if (a.estado === 'conurbacion' && !pres && U.anio() >= 1991 && E.fecha.t - a.falla > 104 && !gestor && U.chance(0.0005)) { a.estado = 'tramite'; a.tramiteNPC = { hasta: E.fecha.t + 24 }; Me.noticia(E, a, `Los alcaldes de ${d.corto} impulsan una consulta para crear su área metropolitana`, 0); }
        }
        // consulta del jugador o trámite de los NPC
        if (a.estado === 'tramite') {
          if (a.tramiteNPC && E.fecha.t >= a.tramiteNPC.hasta) { if (U.chance(0.55)) Me.constituir(E, a, 'npc'); else { a.estado = 'conurbacion'; a.falla = E.fecha.t; a.tramiteNPC = null; Me.noticia(E, a, `Naufraga la iniciativa del área metropolitana de ${d.corto}`, -1); } }
          else if (a.consulta) { const m = E.participacion.activos.find(x => x.id === a.consulta); if (!m) { if (a.estado === 'tramite') { a.estado = 'conurbacion'; a.consulta = null; a.falla = E.fecha.t; } } else if (m.estado === 'cerrado' && !m.resultado) { a.estado = 'conurbacion'; a.consulta = null; a.falla = E.fecha.t; } }
        }
        // efecto en los departamentos
        const popMiles = U.suma(a.miembros.map(Me.pob)) / 1000;
        for (const dp of deptos) {
          const D = E.deptos[dp], share = U.clamp(U.suma(a.miembros.filter(c => M()[c].dp === dp).map(Me.pob)) / 1000 / Math.max(1, D.poblacion), 0, 1);
          D.infraestructura = U.clamp(D.infraestructura + (I.movilidad - 60) / 60 * 0.004 * share, 1, 99);
          D.salud = U.clamp(D.salud + (I.ambiente - 60) / 60 * 0.003 * share, 1, 99);
          D.ajusteAprob = U.clamp((D.ajusteAprob || 0) + ((I.movilidad + I.ambiente + I.servicios) / 3 - 60) / 60 * 0.0006 * share, -30, 30);
        }
        // crisis para quien gestiona
        if (!pres && gestor && E.fecha.t - a.ultEvento > 52 && E.gobierno.presidente !== undefined) {
          const ev = I.ambiente < 42 ? 'metroContaminacion' : I.movilidad < 38 ? 'metroMovilidad' : cons && I.tension > 68 ? 'metroTension' : null;
          if (ev && U.chance(0.03)) { a.ultEvento = E.fecha.t; C.Eventos.disparar(E, C.Eventos.plantilla(ev), { vars: { area: d.corto }, area: a.id }); }
        }
      }
    },

    registrarAcciones() {
      const A = C.Acciones, gest = E => true;
      const area = (E, a) => Me.area(E, a.area);
      const gestor = (E, a) => { const x = area(E, a); if (!x) return 'Elige el área'; return Me.esGestor(E, x.id) ? true : Me.gestorTxt; };
      const cons = (E, a) => { const g = gestor(E, a); if (g !== true) return g; return area(E, a).estado === 'constituida' ? true : 'El área aún no está constituida'; };
      A.registrar({ id: 'promoverAreaMetropolitana', nombre: 'Promover el área metropolitana', icono: '🏙', grupo: 'local', costo: 3,
        disponible(E, a) { const g = gestor(E, a); if (g !== true) return g; const x = area(E, a); if (x.estado === 'constituida') return 'El área ya está constituida'; if (x.estado === 'tramite') return 'Ya hay un trámite en curso'; if (U.anio() < 1991) return 'Antes de 1991 no existían las consultas populares para crearla'; return E.fecha.t - x.falla < 104 ? 'La última consulta fracasó: debes esperar' : true; },
        ejecutar(E, a) {
          const x = area(E, a), d = Me.def(x.id);
          const v = Me.votarJunta(E, x, 0.5, 0.05);
          if (!v.aprobado) return { ok: true, exito: false, msg: `Los concejos no dan su concepto favorable (${v.si} % de apoyo ponderado). Cabildea a los alcaldes de ${v.detalle.filter(z => !z.voto).map(z => z.n).slice(0, 3).join(', ')}` };
          const nuc = Me.nucleoDepto(x);
          const m = C.Participacion.crear(E, { tipo: 'metropolitana', clave: 'metro:' + x.id, metro: x.id, titulo: `Crear el ${d.n}`, promotor: 'J', nivel: 'municipal', depto: nuc, cargo: 'alcalde' });
          x.estado = 'tramite'; x.promoJ = true; x.consulta = m.id; Me.anotar(E, x, 'Se abre la consulta popular');
          Me.noticia(E, x, `Arranca el trámite del ${d.n}: los concejos dieron su aval y se convoca a consulta popular`, 1, true);
          return { ok: true, msg: 'Los concejos avalan: se abre la consulta popular (revísala en Democracia directa)' };
        } });
      A.registrar({ id: 'cabildearAlcaldeMetropolitano', nombre: 'Cabildear a un alcalde del área', icono: '🤝', grupo: 'local', costo: 1, disponible: gestor,
        ejecutar(E, a) { const x = area(E, a), al = Me.alcalde(E, x, a.code); if (!al || al.mio) return { ok: false, msg: 'Elige otro alcalde' }; if (E.jugador.patrimonio < 5) return { ok: false, msg: 'Necesitas $5 millones' }; E.jugador.patrimonio -= 5; al.afin = U.clamp(al.afin + U.ri(10, 20), -100, 100); return { ok: true, msg: `${al.nombre}, alcalde de ${Me.nombreMuni(a.code)}, se acerca a tu propuesta` }; } });
      A.registrar({ id: 'anexarMunicipio', nombre: 'Anexar un municipio al área', icono: '➕', grupo: 'local', costo: 2, disponible: cons,
        ejecutar(E, a) {
          const x = area(E, a); if (!x.aspirantes.includes(a.code)) return { ok: false, msg: 'Elige un municipio aspirante' };
          const v = Me.votarJunta(E, x, 0.55, 0.05), al = Me.alcalde(E, x, a.code), p = U.clamp(0.5 + x.indic.integracion / 250 - x.indic.tension / 300 + (al.afin || 0) / 300, 0.1, 0.92);
          if (!v.aprobado) return { ok: true, exito: false, msg: `La junta metropolitana no aprueba la anexión (${v.si} %)` };
          if (!U.chance(p)) return { ok: true, exito: false, msg: `El concejo de ${Me.nombreMuni(a.code)} rechaza sumarse (${Math.round(p * 100)} % de probabilidad)` };
          x.aspirantes = x.aspirantes.filter(c => c !== a.code); x.miembros.push(a.code); x.indic.integracion = Math.max(0, x.indic.integracion - 2);
          Me.anotar(E, x, `Se anexa ${Me.nombreMuni(a.code)}`); Me.noticia(E, x, `${Me.nombreMuni(a.code)} se suma al ${Me.def(x.id).corto}`, 1, true);
          return { ok: true, msg: `${Me.nombreMuni(a.code)} es ya parte del área: suma ${Me.pob(a.code).toLocaleString('es-CO')} habitantes` };
        } });
      A.registrar({ id: 'fijarSobretasaMetropolitana', nombre: 'Fijar la sobretasa metropolitana', icono: '💵', grupo: 'local', costo: 1, disponible: cons,
        ejecutar(E, a) { const x = area(E, a), n = +a.nivel; if (!(n >= 0 && n <= 3)) return { ok: false, msg: 'Elige entre 0 y 3 puntos' }; if (n === x.sobretasa) return { ok: false, msg: 'Ya está en ese nivel' }; const v = n > x.sobretasa ? Me.votarJunta(E, x, 0.4) : { aprobado: true, si: 100 }; if (!v.aprobado) return { ok: true, exito: false, msg: `La junta rechaza subir la sobretasa (${v.si} %)` }; x.sobretasa = n; return { ok: true, msg: `Sobretasa en ${n} punto${n === 1 ? '' : 's'}: ${n > 0 ? 'más recaudo y más tensión' : 'sin recaudo propio'}` }; } });
      A.registrar({ id: 'lanzarProyectoMetropolitano', nombre: 'Lanzar un proyecto metropolitano', icono: '🏗', grupo: 'local', costo: 2, disponible: cons,
        ejecutar(E, a) {
          const x = area(E, a), P = PROYECTOS[a.proyecto]; if (!P) return { ok: false, msg: 'Elige el proyecto' };
          if (x.proyectos.length >= 3) return { ok: false, msg: 'Ya hay tres proyectos en marcha' }; if (x.proyectos.some(p => p.tipo === a.proyecto)) return { ok: false, msg: 'Ese proyecto ya está en marcha' };
          const local = +(P.costo * 0.4).toFixed(2); if (x.caja.fondoRegalias < local) return { ok: false, msg: `El fondo no alcanza: se necesitan ${local.toFixed(2)} billones (el 40 % del costo) y hay ${x.caja.fondoRegalias.toFixed(2)}. Sube la sobretasa, gestiona cofinanciación de la Nación, cobra valorización o contrata un crédito` };
          const v = Me.votarJunta(E, x, 0.55, 0.05); if (!v.aprobado) return { ok: true, exito: false, msg: `La junta metropolitana no lo aprueba (${v.si} %)` };
          if (P.conpes) { const pr = E.gobierno.presidente === 'J' ? 0.95 : U.clamp(0.45 + x.indic.legit / 250 + (E.opinion.aprobacionPres - 45) / 400, 0.2, 0.85); if (!U.chance(pr)) return { ok: true, exito: false, msg: `El CONPES no declara la importancia estratégica del proyecto (${Math.round(pr * 100)} % de probabilidad)` }; }
          x.caja.fondoRegalias -= local; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(P.costo * 0.6) * 0.3, p: 'm' }], 'metropolitano');
          x.proyectos.push({ tipo: a.proyecto, resta: P.sem, t: E.fecha.t }); Me.anotar(E, x, `Arranca: ${P.n}`);
          Me.noticia(E, x, `${Me.def(x.id).corto} arranca ${P.n.toLowerCase()}`, 1, true);
          return { ok: true, msg: `${P.n}: ${P.sem} semanas, ${P.costo} billones (40 % del fondo, 60 % cofinanciado por la Nación)` };
        } });
      A.registrar({ id: 'contratarCreditoMetropolitano', nombre: 'Contratar un crédito para el área', icono: '🏦', grupo: 'local', costo: 2, disponible: cons,
        ejecutar(E, a) {
          const x = area(E, a), m = +a.monto; if (!(m > 0)) return { ok: false, msg: 'Elige el monto' };
          const ing = Me.ingresos(E, x), tope = +(ing.total * 52 * 6).toFixed(2), deuda = x.caja.deuda || 0;
          if (deuda + m > tope) return { ok: false, msg: `El área no tiene capacidad de endeudamiento: tope ${tope.toFixed(2)} billones (6 años de ingresos) y debe ${deuda.toFixed(2)}` };
          const v = Me.votarJunta(E, x, 0.5); if (!v.aprobado) return { ok: true, exito: false, msg: `La junta rechaza endeudar al área (${v.si} %)` };
          x.caja.deuda = deuda + m; x.caja.fondoRegalias += m; x.indic.tension = Math.min(100, x.indic.tension + 1);
          return { ok: true, msg: `Crédito de ${m} billones: entra al fondo hoy y se paga con ~0,35 % semanal del saldo` };
        } });
      A.registrar({ id: 'gestionarCofinanciacion', nombre: 'Gestionar cofinanciación de la Nación', icono: '🏛', grupo: 'local', costo: 3, disponible: cons,
        ejecutar(E, a) {
          const x = area(E, a); if (E.fecha.t - (x.caja.ultCof || -999) < 52) return { ok: false, msg: 'Sólo puedes gestionar una cofinanciación al año' };
          x.caja.ultCof = E.fecha.t; const pobM = Me.poblacion(x) / 1e6;
          const p = E.gobierno.presidente === 'J' ? 0.95 : U.clamp(0.35 + x.indic.legit / 250 + (E.opinion.aprobacionPres - 45) / 400 + (x.director ? x.director.calidad / 500 : 0), 0.2, 0.85);
          if (!U.chance(p)) return { ok: true, exito: false, msg: `La Nación no cofinancia este año (${Math.round(p * 100)} % de probabilidad)` };
          const monto = +Math.min(0.7, 0.1 + 0.12 * pobM).toFixed(2); x.caja.fondoRegalias += monto; C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(monto), p: 'm' }], 'metropolitano');
          return { ok: true, msg: `La Nación cofinancia al área con ${monto} billones` };
        } });
      A.registrar({ id: 'cobrarValorizacion', nombre: 'Cobrar contribución de valorización', icono: '🏘', grupo: 'local', costo: 3, disponible: cons,
        ejecutar(E, a) {
          const x = area(E, a); if (E.fecha.t - (x.caja.ultVal || -999) < 104) return { ok: false, msg: 'La valorización sólo puede cobrarse cada dos años' };
          const v = Me.votarJunta(E, x, 0.6, 0.05); if (!v.aprobado) return { ok: true, exito: false, msg: `La junta rechaza la valorización (${v.si} %)` };
          x.caja.ultVal = E.fecha.t; const monto = +(Me.poblacion(x) / 1e6 * 0.12).toFixed(2); x.caja.fondoRegalias += monto; x.indic.tension = Math.min(100, x.indic.tension + 8); x.indic.legit = Math.max(0, x.indic.legit - 6);
          return { ok: true, msg: `La valorización recauda ${monto} billones, pero crece la tensión y baja la legitimidad` };
        } });
      A.registrar({ id: 'nombrarDirectorMetropolitano', nombre: 'Nombrar al director del área', icono: '🎩', grupo: 'local', costo: 2, disponible: cons,
        ejecutar(E, a) { const x = area(E, a), perfil = a.perfil === 'politico' ? 'politico' : 'tecnico'; const v = Me.votarJunta(E, x, 0.5); if (!v.aprobado) return { ok: true, exito: false, msg: `La junta no acepta tu candidato (${v.si} %)` }; x.director = Me.director(E, perfil); if (perfil === 'politico') x.indic.integracion = Math.max(0, x.indic.integracion - 1); Me.anotar(E, x, `Nuevo director: ${x.director.nombre}`); return { ok: true, msg: `${x.director.nombre} (${perfil === 'tecnico' ? 'técnico' : 'político'}, capacidad ${x.director.calidad}) dirige el área` }; } });
      A.registrar({ id: 'crearEmpresaMetropolitana', nombre: 'Crear la empresa metropolitana', icono: '🏭', grupo: 'local', costo: 3, disponible: cons,
        ejecutar(E, a) {
          const x = area(E, a), d = Me.def(x.id); if (x.empresa) return { ok: false, msg: 'El área ya tiene su empresa' };
          const capital = +Math.max(0.3, Me.poblacion(x) / 1e6 * 0.35).toFixed(2); if (x.caja.fondoRegalias < capital) return { ok: false, msg: `El fondo no alcanza: se necesitan ${capital} billones de capital` };
          const v = Me.votarJunta(E, x, 0.5, 0.05); if (!v.aprobado) return { ok: true, exito: false, msg: `La junta metropolitana no la aprueba (${v.si} %)` };
          x.caja.fondoRegalias -= capital;
          const e = C.Empresas.crear(E, { depto: Me.nucleoDepto(x), organo: 'metro', metro: x.id, nombre: d.empresa.nombre, sector: d.empresa.sector, capital, cobertura: 30, calidad: 58, gestion: 62, integridad: 62, deuda: 0, sindicato: 25 });
          C.Empresas.asegurar(E).lista.push(e); x.empresa = e.id; Me.anotar(E, x, `Nace ${e.nombre}`); Me.noticia(E, x, `Nace ${e.nombre}, la empresa del ${d.corto}`, 1, true);
          return { ok: true, msg: `Nace ${e.nombre} con ${capital} billones de capital` };
        } });
    }
  };
  C.Metro = Me;
  C.Tiempo.registrar('metro', Me, 55);
  Me.registrarAcciones();
})(window.CURUL);
