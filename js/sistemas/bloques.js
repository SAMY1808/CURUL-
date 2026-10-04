/* Estructura política de los bloques (Fase 49): la CAN y el Mercosur con sus instituciones visibles y vivas —Consejo (un voto por país),
   Comisión/Directorio (comisionados con cartera que reciben sugerencias), Parlamento (escaños por país y grupo ideológico que vota las normas
   como un congreso) y Tribunal—, y una tubería de normas comunitarias que recorre Comisión → Parlamento → Consejo según el nivel institucional
   que tenga el bloque. Si eres comisionado recibes sugerencias; si no, puedes presentar una o aspirar a un cargo; si eres parlamentario, votas. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, cl = U.clamp, H = s => C.Corte.hash(s), esPres = E => E.gobierno.presidente === 'J';
  const noti = (E, txt, tono, imp) => { if (!E.meta.presim) C.Medios.noticia(E, { tipo: 'diplomacia', titular: txt, tono: tono || 0, importante: !!imp, jugador: esPres(E) }); };
  const nomP = id => id === 'COL' ? 'Colombia' : (C.Diplomacia.pais(id) || { nombre: id }).nombre;
  const GRUPOS = [['izq', 'Izquierda', '#E0504A', -75], ['cizq', 'Centroizquierda', '#E8812A', -35], ['cen', 'Centro', '#D1A824', 0], ['cder', 'Centroderecha', '#4C7FE0', 35], ['der', 'Derecha', '#2B4F9E', 75]];
  const NORMAS_MER = [
    { id: 'comelec', n: 'Comercio electrónico y protección del consumidor', area: 'comercio', tilt: 0.3, integ: 3 }, { id: 'compras', n: 'Compras públicas regionales', area: 'comercio', tilt: 0.2, integ: 4, ef: E => C.Economia.aplicarDelta(E, 'inversion', 0.1) },
    { id: 'origen', n: 'Régimen de origen flexible', area: 'comercio', tilt: 0.5, integ: 3, ef: E => C.Economia.aplicarDelta(E, 'exportaciones', 0.12) }, { id: 'hidrovia', n: 'Hidrovía y corredores logísticos', area: 'infraestructura', tilt: 0, integ: 4, ef: E => C.Economia.aplicarDelta(E, 'exportaciones', 0.1) },
    { id: 'energia', n: 'Interconexión de gas y electricidad', area: 'energia', tilt: 0, integ: 4, ef: E => C.Economia.aplicarDelta(E, 'inflacion', -0.05) }, { id: 'clausula', n: 'Cláusula democrática reforzada', area: 'derechos', tilt: -0.2, integ: 3 },
    { id: 'ciudadania', n: 'Estatuto de la ciudadanía del Mercosur', area: 'migracion', tilt: -0.3, integ: 4 }, { id: 'vacunas', n: 'Compra conjunta de medicamentos y vacunas', area: 'salud', tilt: -0.4, integ: 3 },
    { id: 'titulos', n: 'Reconocimiento de títulos y estudios', area: 'educacion', tilt: -0.2, integ: 3, ef: E => { for (const d of Object.values(E.deptos)) d.educacion = cl(d.educacion + 0.1, 1, 99); } },
    { id: 'clima', n: 'Protocolo ambiental y de cambio climático', area: 'ambiente', tilt: -0.4, integ: 2 }, { id: 'frontera', n: 'Cooperación judicial y seguridad fronteriza', area: 'seguridad', tilt: 0.3, integ: 3, ef: E => { for (const d of Object.values(E.deptos)) d.seguridad = cl(d.seguridad + 0.15, 1, 99); } },
    { id: 'focem', n: 'Ampliación del fondo de convergencia (FOCEM)', area: 'fondos', tilt: -0.5, integ: 3 }
  ];
  const TILT_AREA = { comercio: 0.5, inversion: 0.6, migracion: -0.3, telecom: 0.2, energia: 0, salud: -0.4, ambiente: -0.4, seguridad: 0.3, educacion: -0.2, fondos: -0.5, derechos: -0.2, infraestructura: 0 };
  const B = {
    GRUPOS, NORMAS_MER, clave: 'bloques',
    asegurar(E) { if (E.bloques && E.bloques.can) return E.bloques; E.bloques = { can: { prop: [], sug: [], com: null, comNiv: null, hist: [], ult: -999, parlProx: 0 }, mercosur: { prop: [], sug: [], com: null, comNiv: null, hist: [], ult: -999, parlProx: 0 } }; return E.bloques; },
    init(E) { E.bloques = null; }, migrar(E) { B.asegurar(E); },
    st(E, id) { return B.asegurar(E)[id]; },
    anotar(E, id, txt) { const s = B.st(E, id); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 20) s.hist.length = 20; },
    /* ── Definición por bloque ── */
    nombre: id => id === 'can' ? 'Comunidad Andina' : 'Mercosur',
    existe(E, id) { return id === 'can' ? C.CAN.activa() : !!(C.Mercosur && C.Mercosur.st(E).existe); },
    colMiembro(E, id) { return id === 'can' ? C.CAN.enCAN(E) : !!(C.Mercosur && C.Mercosur.esMiembro(E)); },
    miembros(E, id) { if (id === 'can') return C.CAN.miembrosEn(U.anio()).filter(x => x !== 'COL' || C.CAN.enCAN(E)); const m = C.Mercosur.st(E).miembros; return Object.keys(m).filter(x => !m[x].suspendido); },
    niveles(E, id) {
      if (id === 'can') { const n = C.CAN.inst(E).niv; return { regla: ['unanimidad', 'mayoria', 'calificada'][n.decisiones], comision: n.secretaria === 0 ? 1 : n.secretaria === 1 ? 2 : 3, iniciativa: n.secretaria >= 1, parlamento: n.parlamento, tribunal: n.tribunal, sedes: ['Lima', 'Bogotá', 'Quito'] }; }
      const n = C.MercosurInst ? C.MercosurInst.st(E).niv : { votacion: 0, directorio: 0, parlamento: 0, tribunal: 0 };
      return { regla: ['unanimidad', 'calificada', 'ponderada'][n.votacion], comision: n.directorio === 0 ? 0 : n.directorio === 1 ? 1 : n.directorio === 2 ? 3 : 3, iniciativa: n.directorio >= 3, parlamento: n.parlamento, tribunal: n.tribunal, sedes: ['Montevideo', 'Montevideo', 'Asunción'] };
    },
    ideo(E, id) { if (id === 'COL') return E.gobierno.presidente === 'J' ? E.jugador.ideologia.eco : ((E.politicos[E.gobierno.presidente] || {}).eco || 0); const p = C.MundoVivo.pais(E, id); return p ? p.eco : 0; },
    catalogo(E, id) { return id === 'can' ? C.DATA.multi.CAN_DEC.map(d => Object.assign({ tilt: TILT_AREA[d.area] || 0 }, d)) : NORMAS_MER; },
    norma(E, id, nid) { return B.catalogo(E, id).find(x => x.id === nid); },
    /* ── Parlamento: escaños por país y grupo ── */
    escanosPais(id, pais) { const can = 8, mer = { BRA: 37, ARG: 26, URY: 18, PRY: 18, BOL: 18, COL: 18, VEN: 23 }; return id === 'can' ? can : (mer[pais] || 12); },
    gruposPais(E, id, pais, n) {
      if (pais === 'COL') {
        const ps = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.id !== 'IND').sort((a, b) => b.popularidad - a.popularidad).slice(0, 7), tot = U.suma(ps.map(p => p.popularidad)) || 1, out = { izq: 0, cizq: 0, cen: 0, cder: 0, der: 0 };
        const partes = ps.map(p => ({ p, esc: p.popularidad / tot * n, g: GRUPOS.reduce((b, g) => Math.abs(g[3] - p.eco * 1.0) < Math.abs(b[3] - p.eco) ? g : b, GRUPOS[2])[0] })); let asig = 0;
        for (const x of partes) { const k = Math.floor(x.esc); out[x.g] += k; asig += k; x.r = x.esc - k; }
        for (const x of partes.sort((a, b) => b.r - a.r)) if (asig < n) { out[x.g]++; asig++; }
        return out;
      }
      const eco = B.ideo(E, pais), w = GRUPOS.map(g => Math.exp(-Math.pow((eco - g[3]) / 45, 2)) * (0.7 + H(id + pais + g[0]) * 0.6)), sw = U.suma(w), out = {}; let asig = 0;
      const r = GRUPOS.map((g, i) => { const e = w[i] / sw * n, k = Math.floor(e); out[g[0]] = k; asig += k; return { g: g[0], r: e - k }; });
      for (const x of r.sort((a, b) => b.r - a.r)) if (asig < n) { out[x.g]++; asig++; }
      return out;
    },
    parlamento(E, id) {
      const ms = B.miembros(E, id), nv = B.niveles(E, id), paises = ms.map(p => { const n = B.escanosPais(id, p); return { id: p, esc: n, grupos: B.gruposPais(E, id, p, n) }; });
      const tot = {}; for (const g of GRUPOS) tot[g[0]] = U.suma(paises.map(p => p.grupos[g[0]]));
      return { paises, tot, total: U.suma(paises.map(p => p.esc)), nivel: nv.parlamento, txt: ['Sin parlamento', 'Foro deliberante: opina, no decide', 'Elegido directamente, con control político: aprueba o rechaza', 'Colegislador junto al Consejo'][nv.parlamento] || '' };
    },
    /* ── Comisión: comisionados con cartera ── */
    carteras(id) { return id === 'can' ? ['Comercio e Integración', 'Asuntos Sociales y Migración', 'Energía y Medio Ambiente', 'Seguridad y Justicia', 'Educación y Salud'] : ['Comercio y Aranceles', 'Asuntos Sociales y Ciudadanía', 'Infraestructura y Energía', 'Seguridad y Fronteras', 'Cohesión y Fondos']; },
    nuevoNombre(id, pais, k) { const N = C.DATA.nombres, m = H(id + pais + k) < 0.64; return `${N[m ? 'h' : 'm'][Math.floor(H(id + pais + k + 'n') * N[m ? 'h' : 'm'].length)]} ${N.a[Math.floor(H(id + pais + k + 'a') * N.a.length)]}`; },
    rolJ(E, id) {
      if (id === 'mercosur' && C.MercosurInst) { const j = C.MercosurInst.jug(E); return j.rol ? { rol: j.rol, hasta: j.hasta } : null; }
      const r = E.jugador.bloqueCAN; return r && r.rol ? r : null;
    },
    comision(E, id) {
      const s = B.st(E, id), nv = B.niveles(E, id), t = E.fecha.t, key = nv.comision + (nv.iniciativa ? 'i' : '') + B.miembros(E, id).join('');
      if (s.com && s.comNiv === key) { for (const c of s.com) if (c.hasta && t >= c.hasta && !c.jug) { c.nombre = B.nuevoNombre(id, c.pais, t); c.hasta = t + 260; } return s.com; }
      const prev = s.com || [], ms = B.miembros(E, id), cart = B.carteras(id), com = []; const rol = B.rolJ(E, id);
      const sec = ms.filter(x => x !== 'COL')[0] || ms[0];
      if (nv.comision >= 1) com.push({ cargo: id === 'can' ? 'Secretario/a General' : 'Director/a de la Secretaría', pais: sec, nombre: (prev.find(c => c.cargo && c.cargo.startsWith(id === 'can' ? 'Secretario' : 'Director')) || {}).nombre || B.nuevoNombre(id, sec, 'sec'), cartera: 'Dirección', hasta: t + 260 });
      if (nv.comision === 1 || nv.comision === 2) cart.slice(0, 3).forEach((c, i) => com.push({ cargo: 'Director/a', pais: ms[i % ms.length], nombre: B.nuevoNombre(id, ms[i % ms.length], c), cartera: c, hasta: t + 260 }));
      if (nv.comision === 3) ms.forEach((p, i) => { const jugSeat = p === 'COL' && rol && rol.rol === 'comisionado'; com.push({ cargo: nv.iniciativa ? 'Comisionado/a' : 'Representante permanente', pais: p, nombre: jugSeat ? E.jugador.nombre : B.nuevoNombre(id, p, 'c' + i), cartera: rol && p === 'COL' && rol.cartera ? rol.cartera : cart[i % cart.length], hasta: jugSeat ? rol.hasta : t + 260, jug: !!jugSeat }); });
      s.com = com; s.comNiv = key; return com;
    },
    /* ── Tribunal ── */
    jueces(E, id) { return B.miembros(E, id).map((p, i) => ({ pais: p, nombre: B.nuevoNombre(id, p, 'j' + i) })); },
    /* ── Propuestas: Comisión → Parlamento → Consejo ── */
    probPais(E, id, pais, pr) {
      const norma = B.norma(E, id, pr.norma), tilt = pr.tilt;
      const rel = pais === 'COL' ? 50 : ((E.diplomacia.paises[pais] || { relacion: 50 }).relacion);
      const afin = pr.autor === pais ? 0.25 : 0;
      return cl(0.72 - Math.abs(B.ideo(E, pais) / 100 - tilt) * 0.34 + (rel - 50) * 0.002 + afin + (pr.bonus || 0) + (pr.parlRes === 'favor' ? 0.06 : pr.parlRes === 'contra' ? -0.08 : 0) + (pr.lobbyC && pr.lobbyC[pais] || 0), 0.05, 0.95);
    },
    /* ── Mesa redonda de representantes permanentes (Consejo) ── */
    EXIGE: ['una salvaguardia para sus sectores sensibles', 'compensación con recursos del fondo de convergencia', 'un plazo de transición más largo', 'voz y voto en la ejecución de la norma', 'garantías sobre el origen de las mercancías', 'que se respete su política interna'],
    TACTICAS: { argumentar: 'Argumentar (técnico)', compensar: 'Ofrecer compensación', presionar: 'Presionar (diplomático)', aliado: 'Pedir apoyo a un aliado', sondear: 'Sondear su posición' },
    puedeMesa(E, id) { if (!B.colMiembro(E, id)) return `Colombia no es miembro de la ${B.nombre(id)}`; const rol = B.rolJ(E, id); return esPres(E) || (rol && rol.rol === 'comisionado') ? true : 'Sólo el Presidente o tu representante permanente'; },
    mesa(E, id, pr) {
      if (pr.mesa) return pr.mesa;
      const ms = B.miembros(E, id).filter(x => x !== 'COL'), pos = {};
      for (const p of ms) { const ini = B.probPais(E, id, p, pr); pos[p] = { inclin: ini, ini, firmeza: cl(0.25 + H(pr.id + p + 'f') * 0.6, 0.1, 0.9), exige: B.EXIGE[Math.floor(H(pr.id + p + 'x') * B.EXIGE.length)], ult: -1, satisf: false, hist: [] }; }
      pr.mesa = { ronda: 1, pos, log: [], enm: 0 }; return pr.mesa;
    },
    postura(x) { return x.inclin >= 0.62 ? 'favor' : x.inclin <= 0.38 ? 'contra' : 'duda'; },
    mesaMov(E, pr, pais, d, motivo) {
      const x = pr.mesa.pos[pais], antes = B.postura(x); x.inclin = cl(x.inclin + d, 0.02, 0.98); const des = B.postura(x);
      if (antes !== des) { const T = { favor: 'a favor', contra: 'en contra', duda: 'indeciso' }; pr.mesa.log.unshift(`Ronda ${pr.mesa.ronda}: ${nomP(pais)} pasa de ${T[antes]} a ${T[des]} (${motivo})`); if (pr.mesa.log.length > 10) pr.mesa.log.length = 10; }
      return antes !== des ? des : null;
    },
    negociar(E, id, pr, pais, tac) {
      const m = B.mesa(E, id, pr), x = m.pos[pais]; if (!x) return { ok: false, msg: 'Elige una delegación' };
      if (x.ult === m.ronda) return { ok: false, msg: `Ya conversaste con la delegación de ${nomP(pais)} en esta ronda` };
      x.ult = m.ronda; const rel = (E.diplomacia.paises[pais] || { relacion: 50 }).relacion, J = E.jugador, mov = (d, txt) => B.mesaMov(E, pr, pais, d, txt);
      const fuerza = 1 - x.firmeza * 0.7, r = () => 0.7 + Math.random() * 0.6, sentido = pr.sentido || 1; let msg = '', cambio = null;
      if (tac === 'sondear') { x.sondeo = true; msg = `Sondeas a ${nomP(pais)}: pide ${x.exige}; firmeza ${x.firmeza > 0.6 ? 'alta' : x.firmeza > 0.35 ? 'media' : 'baja'}`; }
      else if (tac === 'argumentar') { const d = (0.09 + (J.atributos ? (J.atributos.negociacion || 50) / 1000 : 0.05) + (rel - 50) * 0.001) * fuerza * r(); cambio = mov(d, 'argumentos técnicos'); msg = `Defiendes la norma ante ${nomP(pais)}: ${d > 0.07 ? 'toma nota con interés' : 'escucha sin comprometerse'}`; }
      else if (tac === 'compensar') { C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(0.15), p: 'm' }], 'bloque'); const d = (x.satisf ? 0.05 : 0.2) * (0.6 + fuerza * 0.6) * r(); x.satisf = true; x.firmeza = cl(x.firmeza - 0.1, 0.05, 0.95); cambio = mov(d, 'compensación acordada'); msg = `Ofreces a ${nomP(pais)} ${x.exige.startsWith('que') ? 'respetar' : 'atender'} lo que pide (${x.exige}): a cambio, mejora su disposición`; }
      else if (tac === 'presionar') { const d = 0.16 * fuerza * r() * (rel > 40 ? 1 : 0.6); const reb = U.chance(0.15 + x.firmeza * 0.2 - (rel - 50) * 0.002); if (reb) { x.firmeza = cl(x.firmeza + 0.15, 0.05, 0.95); cambio = mov(-0.1, 'rechaza la presión'); msg = `La presión sobre ${nomP(pais)} sale mal: se atrinchera`; } else { cambio = mov(d, 'presión diplomática'); msg = `Presionas a ${nomP(pais)}: cede terreno`; } const st = E.diplomacia.paises[pais]; if (st) st.relacion = cl(st.relacion - 2, 3, 97); }
      else if (tac === 'aliado') { const al = Object.entries(m.pos).filter(([k, v]) => k !== pais && B.postura(v) === 'favor').sort((a, b) => ((E.diplomacia.paises[b[0]] || { relacion: 50 }).relacion) - ((E.diplomacia.paises[a[0]] || { relacion: 50 }).relacion))[0]; if (!al) { x.ult = -1; return { ok: false, msg: 'Ninguna delegación a favor puede interceder todavía' }; } const d = 0.12 * fuerza * r(); cambio = mov(d, `intercede ${nomP(al[0])}`); msg = `${nomP(al[0])} habla con ${nomP(pais)} a tu favor`; }
      const x2 = B.postura(x); return { ok: true, msg: `${msg}${cambio ? `. ¡Cambia de postura: ahora está ${cambio === 'favor' ? 'a favor' : cambio === 'contra' ? 'en contra' : 'indecisa'}!` : ''}`, exito: !!cambio };
    },
    enmendar(E, id, pr) { const m = B.mesa(E, id, pr); if (m.enm >= 2) return 'La norma ya fue enmendada dos veces'; m.enm++; for (const p of Object.keys(m.pos)) B.mesaMov(E, pr, p, 0.05, 'texto enmendado'); m.log.unshift(`Ronda ${m.ronda}: se enmienda el texto con salvaguardias; baja su alcance integrador`); return ''; },
    /* cada semana la mesa avanza: las delegaciones se coordinan entre sí */
    rondaMesa(E, id, pr) {
      const m = B.mesa(E, id, pr); m.ronda++; const ks = Object.keys(m.pos);
      for (const p of ks) { const x = m.pos[p]; x.inclin = cl(x.inclin + (x.ini - x.inclin) * 0.08 + U.gauss(0, 0.02), 0.02, 0.98); }
      if (ks.length >= 3 && U.chance(0.5)) { const a = U.pick(ks), b = ks.filter(k => k !== a).sort((u, v) => Math.abs(B.ideo(E, u) - B.ideo(E, a)) - Math.abs(B.ideo(E, v) - B.ideo(E, a)))[0], mu = (m.pos[a].inclin + m.pos[b].inclin) / 2; m.pos[a].inclin = cl(m.pos[a].inclin + (mu - m.pos[a].inclin) * 0.5, 0.02, 0.98); m.pos[b].inclin = cl(m.pos[b].inclin + (mu - m.pos[b].inclin) * 0.5, 0.02, 0.98); m.log.unshift(`Ronda ${m.ronda}: ${nomP(a)} y ${nomP(b)} coordinan su posición`); if (m.log.length > 10) m.log.length = 10; }
    },
    votoConsejo(E, id, pr) {
      const nv = B.niveles(E, id), ms = B.miembros(E, id), mesa = pr.mesa, votos = ms.map(p => { const mx = mesa && mesa.pos[p], pp = mx ? mx.inclin : B.probPais(E, id, p, pr); const si = p === 'COL' && pr.votoCol != null ? pr.votoCol >= 0 : mx ? (pp >= 0.62 ? true : pp <= 0.38 ? false : H(pr.id + p) < pp) : H(pr.id + p) < pp; const veto = !si && (mx ? pp < 0.22 && mx.firmeza > 0.55 : H(pr.id + p + 'v') > pp + 0.3); return { id: p, si, veto, p: pp }; });
      const f = votos.filter(v => v.si).length; let ok;
      if (nv.regla === 'unanimidad') ok = !votos.some(v => v.veto) && f >= Math.ceil(ms.length / 2);
      else if (nv.regla === 'mayoria') ok = f > ms.length / 2; else if (nv.regla === 'calificada') ok = f >= Math.ceil(ms.length * 2 / 3);
      else { const w = { BRA: 0.45, ARG: 0.2, COL: 0.12, VEN: 0.08, URY: 0.05, PRY: 0.05, BOL: 0.05 }; ok = U.suma(votos.filter(v => v.si).map(v => w[v.id] || 0.05)) > U.suma(votos.map(v => w[v.id] || 0.05)) / 2; }
      return { votos, f, n: ms.length, ok, regla: nv.regla };
    },
    votoParlamento(E, id, pr) {
      const par = B.parlamento(E, id); const rol = B.rolJ(E, id); let f = 0, c = 0; const porGrupo = {};
      for (const g of GRUPOS) {
        const seats = par.tot[g[0]]; if (!seats) continue; const stance = 0.63 - Math.abs(g[3] / 100 - pr.tilt) * 0.3 + (pr.bonus || 0) * 0.6 + (pr.lobbyG && pr.lobbyG[g[0]] || 0) + (H(pr.id + g[0]) - 0.5) * 0.22 + (pr.autor === 'Comisión' ? 0.05 : 0);
        const si = stance > 0.5; porGrupo[g[0]] = { si, seats, p: cl(stance, 0.05, 0.95) }; if (si) f += seats; else c += seats;
      }
      if (rol && rol.rol === 'parlamentario' && pr.votoJ) { const colG = Object.keys(par.paises.find(p => p.id === 'COL') ? par.paises.find(p => p.id === 'COL').grupos : {}).sort((a, b) => par.paises.find(p => p.id === 'COL').grupos[b] - par.paises.find(p => p.id === 'COL').grupos[a])[0]; if (colG && porGrupo[colG]) { const grupoSi = porGrupo[colG].si; if (pr.votoJ === 'si' && !grupoSi) { f++; c--; } if (pr.votoJ === 'no' && grupoSi) { f--; c++; } } }
      return { f, c, total: par.total, ok: f > c, porGrupo };
    },
    proponer(E, id, nid, autor, extra) {
      const s = B.st(E, id), n = B.norma(E, id, nid); if (!n) return null; if (s.prop.some(p => p.norma === nid && !['aprobada', 'rechazada'].includes(p.fase))) return null;
      const nv = B.niveles(E, id), pr = Object.assign({ id: U.id('np'), bloque: id, norma: nid, titulo: n.n, area: n.area, tilt: n.tilt != null ? n.tilt : (TILT_AREA[n.area] || 0), autor, t0: E.fecha.t, fase: 'comision', dur: U.ri(3, 7), bonus: 0, lobbyG: {}, lobbyC: {}, votoJ: null, votoCol: null, parlRes: null, hist: [] }, extra || {});
      if (id === 'can') { const cd = C.CAN.asegurar(E).dec[nid]; if (cd) { cd.estado = 'propuesta'; cd.por = autor; } }
      if (nv.comision < 2 || autor === 'Comisión' || !nv.iniciativa) { pr.fase = nv.parlamento >= 2 ? 'parlamento' : nv.parlamento === 1 ? 'dictamen' : 'consejo'; pr.dur = pr.fase === 'consejo' ? U.ri(2, 4) : U.ri(3, 6); }
      s.prop.unshift(pr); if (s.prop.length > 24) s.prop.length = 24; B.anotar(E, id, `Se presenta: ${n.n} (${autor === 'COL' ? 'Colombia' : autor === 'Comisión' ? 'la Comisión' : nomP(autor)})`);
      return pr;
    },
    avanzar(E, id, pr) {
      const nv = B.niveles(E, id), n = B.norma(E, id, pr.norma);
      const cerrar = (res, txt) => { pr.fase = res; pr.t1 = E.fecha.t; B.anotar(E, id, txt); if (id === 'can') { const cd = C.CAN.asegurar(E).dec[pr.norma]; if (cd) cd.estado = res === 'aprobada' ? 'vigente' : 'disponible'; } };
      if (pr.fase === 'comision') {
        if (U.chance(0.82)) { pr.fase = nv.parlamento >= 2 ? 'parlamento' : nv.parlamento === 1 ? 'dictamen' : 'consejo'; pr.dur = U.ri(3, 6); pr.hist.push('La Comisión la hace suya'); }
        else { cerrar('rechazada', `La Comisión archiva la propuesta «${pr.titulo}»`); noti(E, `La Comisión de la ${B.nombre(id)} archiva la propuesta «${pr.titulo}»`, 0); }
      } else if (pr.fase === 'dictamen' || pr.fase === 'parlamento') {
        const v = B.votoParlamento(E, id, pr); pr.parl = { f: v.f, c: v.c, total: v.total }; pr.parlRes = v.ok ? 'favor' : 'contra';
        if (pr.fase === 'dictamen') { pr.hist.push(`El foro parlamentario opina ${v.ok ? 'a favor' : 'en contra'} (no vinculante)`); pr.fase = 'consejo'; pr.dur = U.ri(2, 4); }
        else if (v.ok) { pr.fase = 'consejo'; pr.dur = U.ri(2, 4); pr.hist.push(`El Parlamento la aprueba (${v.f} de ${v.total})`); noti(E, `El Parlamento de la ${B.nombre(id)} aprueba «${pr.titulo}» (${v.f} de ${v.total} escaños)`, 1); }
        else { cerrar('rechazada', `El Parlamento rechaza «${pr.titulo}» (${v.f} de ${v.total})`); noti(E, `El Parlamento de la ${B.nombre(id)} rechaza «${pr.titulo}» (${v.f} de ${v.total} escaños)`, -1, true); }
      } else if (pr.fase === 'consejo') {
        if (esPres(E) && B.colMiembro(E, id) && pr.votoCol == null && !E.meta.presim && !pr.evento && !E.eventos.pendientes.length) { pr.evento = true; C.Eventos.disparar(E, C.Eventos.plantilla('bl_consejo'), { forzar: true, vars: { bid: id, pid: pr.id, bloque: B.nombre(id), titulo: pr.titulo, autor: pr.autor === 'Comisión' ? 'la Comisión' : nomP(pr.autor) } }); pr.dur = 1; return; }
        const r = B.votoConsejo(E, id, pr); pr.cons = { f: r.f, n: r.n, regla: r.regla, votos: r.votos.map(v => ({ id: v.id, si: v.si })) };
        if (r.ok) { cerrar('aprobada', `El Consejo aprueba «${pr.titulo}» (${r.f} de ${r.n})`); B.aplicar(E, id, n, pr); noti(E, `El Consejo de la ${B.nombre(id)} aprueba «${pr.titulo}» (${r.f} de ${r.n} países)`, 1, true); }
        else { cerrar('rechazada', `El Consejo rechaza «${pr.titulo}» (${r.f} de ${r.n}, regla: ${r.regla})`); noti(E, `El Consejo de la ${B.nombre(id)} no aprueba «${pr.titulo}»: ${r.f} de ${r.n} países`, -1); }
      }
    },
    aplicar(E, id, n, pr) {
      if (n.ef) try { n.ef(E); } catch (e) {}
      if (id === 'can') { const c = C.CAN.asegurar(E); c.integ = cl(c.integ + (n.integ || 2) * (pr.mesa && pr.mesa.enm ? 1 - 0.25 * pr.mesa.enm : 1), 0, 100); } else if (C.MercosurInst) { const i = C.MercosurInst.st(E); i.legit = cl(i.legit + 1, 0, 100); C.Economia.aplicarDelta(E, 'exportaciones', 0.04 * (n.integ || 2)); }
      if (pr.autor === 'COL' || pr.autoriaJ) C.Opinion.subirRec(E, 1.5);
    },
    votoJ(E, pid, v) {
      for (const id of ['can', 'mercosur']) { const pr = B.st(E, id).prop.find(x => x.id === pid); if (pr) { pr.votoCol = v; if (v === -1) { const st = E.diplomacia.paises[pr.autor]; if (st) st.relacion = cl(st.relacion - 2, 3, 97); } if (v === 0) pr.bonus += 0.03; pr.dur = 1; return C.Pais.ef(E, { rec: 0.3 }); } }
      return 'La votación ya se resolvió';
    },
    /* Sugerencias a la Comisión */
    nuevaSugerencia(E, id) {
      const s = B.st(E, id), cat = B.catalogo(E, id).filter(n => !s.prop.some(p => p.norma === n.id && !['aprobada', 'rechazada'].includes(p.fase)) && !(id === 'can' && C.CAN.asegurar(E).dec[n.id].estado === 'vigente'));
      if (!cat.length) return null; const n = U.pick(cat), de = U.pick(['el Gobierno de ' + nomP(U.pick(B.miembros(E, id).filter(x => x !== 'COL') .concat(['COL']))), 'los gremios empresariales', 'las ONG y la sociedad civil', 'un grupo parlamentario', 'las centrales sindicales']);
      const g = { id: U.id('sg'), norma: n.id, titulo: n.n, de, t: E.fecha.t, estado: 'abierta' }; s.sug.unshift(g); if (s.sug.length > 10) s.sug.length = 10; return g;
    },
    atender(E, id, sid, via) {
      const s = B.st(E, id), g = s.sug.find(x => x.id === sid); if (!g || g.estado !== 'abierta') return 'La sugerencia ya se atendió';
      if (via === 'adoptar') { g.estado = 'adoptada'; B.proponer(E, id, g.norma, 'Comisión', { bonus: 0.08, autoriaJ: true }); C.Opinion.subirRec(E, 1); return `Adoptas la sugerencia de ${g.de}: la Comisión presenta «${g.titulo}»`; }
      if (via === 'devolver') { g.estado = 'devuelta'; C.Opinion.subirRec(E, 0.3); return 'La devuelves con observaciones para que se afine'; }
      g.estado = 'archivada'; return 'Archivas la sugerencia';
    },
    turno(E) {
      B.asegurar(E); if (E.meta.presim) return; const t = E.fecha.t;
      for (const id of ['can', 'mercosur']) {
        if (!B.existe(E, id)) continue; const s = B.st(E, id), rol = B.rolJ(E, id), member = B.colMiembro(E, id);
        if (rol && t >= (rol.hasta || 0)) { if (id === 'can') E.jugador.bloqueCAN = null; }
        for (const pr of s.prop) { if (['aprobada', 'rechazada'].includes(pr.fase)) continue; if (pr.fase === 'consejo') { if (!pr.mesa) { B.mesa(E, id, pr); if (pr.dur < 3) pr.dur = 3; } else B.rondaMesa(E, id, pr); } pr.dur--; if (pr.dur <= 0) B.avanzar(E, id, pr); }
        if (!member) continue;
        // propuestas espontáneas del bloque
        if (U.chance(0.018)) { const nv = B.niveles(E, id), cat = B.catalogo(E, id).filter(n => !s.prop.some(p => p.norma === n.id && !['aprobada', 'rechazada'].includes(p.fase)) && (id !== 'can' || (C.CAN.asegurar(E).dec[n.id].estado === 'disponible' && (n.y !== null || U.anio() >= 1995)))); if (cat.length) { const ms = B.miembros(E, id), autor = nv.iniciativa && nv.comision >= 2 && U.chance(0.6) ? 'Comisión' : U.pick(ms); B.proponer(E, id, U.pick(cat).id, autor); } }
        // sugerencias para el comisionado (si lo eres) o procesadas solas por el comisionado de Colombia
        if (U.chance(0.03)) { const g = B.nuevaSugerencia(E, id); if (g && (!rol || rol.rol !== 'comisionado')) { g.estado = U.chance(0.4) ? 'adoptada' : 'archivada'; if (g.estado === 'adoptada') B.proponer(E, id, g.norma, 'Comisión'); } }
      }
    },
    registrarAcciones() {
      const A = C.Acciones;
      const bid = a => (a.bloque === 'mercosur' ? 'mercosur' : 'can');
      const pres = (E, a) => esPres(E) ? (B.colMiembro(E, bid(a)) ? true : `Colombia no es miembro de la ${B.nombre(bid(a))}`) : 'Sólo el Presidente';
      A.registrar({ id: 'proponerNormaBloque', nombre: 'Proponer una norma comunitaria', icono: '📜', grupo: 'comercio', costo: 2,
        disponible(E, a) { const id = bid(a); const p = pres(E, a); if (p !== true) return p; const n = B.norma(E, id, a.norma); if (!n) return 'Elige la norma'; if (B.st(E, id).prop.some(x => x.norma === n.id && !['aprobada', 'rechazada'].includes(x.fase))) return 'Ya está en trámite'; if (id === 'can' && C.CAN.asegurar(E).dec[n.id].estado === 'vigente') return 'Ya está vigente'; return true; },
        ejecutar(E, a) { const id = bid(a), pr = B.proponer(E, id, a.norma, 'COL', { autoriaJ: true }); C.Opinion.subirRec(E, 0.8); return { ok: !!pr, msg: pr ? `Presentas la norma: «${pr.titulo}» entra a trámite (${pr.fase === 'comision' ? 'la Comisión la estudia' : pr.fase === 'consejo' ? 'va directo al Consejo' : 'pasa al Parlamento'})` : 'No se pudo presentar' }; } });
      A.registrar({ id: 'sugerirComision', nombre: 'Presentar una sugerencia a la Comisión', icono: '💡', grupo: 'comercio', costo: 1,
        disponible(E, a) { const id = bid(a); if (!B.existe(E, id)) return 'El bloque no existe todavía'; const rol = B.rolJ(E, id); if (rol && rol.rol === 'comisionado') return 'Eres comisionado: presenta la norma directamente'; const n = B.norma(E, id, a.norma); if (!n) return 'Elige la norma'; return E.fecha.t - (B.st(E, id).ult) < 6 ? 'Espera unas semanas entre sugerencias' : true; },
        ejecutar(E, a) { const id = bid(a), s = B.st(E, id), J = E.jugador, n = B.norma(E, id, a.norma); s.ult = E.fecha.t; const q = cl(0.18 + (J.reconocimiento || 0) / 220 + (J.partido ? 0.05 : 0) + (E.gobierno.presidente === 'J' ? 0.25 : 0) + (C.DATA.cargos[J.cargo] ? C.DATA.cargos[J.cargo].nivel * 0.05 : 0), 0.1, 0.8); C.Opinion.subirRec(E, 0.4);
          if (U.chance(q)) { B.proponer(E, id, a.norma, 'Comisión', { bonus: 0.04, autoriaJ: true }); return { ok: true, msg: `La Comisión acoge tu sugerencia y presenta «${n.n}»` }; } return { ok: true, exito: false, msg: `La Comisión la recibe, pero la archiva (${Math.round(q * 100)} % de probabilidad)` }; } });
      A.registrar({ id: 'atenderSugerencia', nombre: 'Atender una sugerencia como comisionado', icono: '📬', grupo: 'comercio', costo: 1,
        disponible(E, a) { const id = bid(a), rol = B.rolJ(E, id); if (!rol || rol.rol !== 'comisionado') return 'Sólo el comisionado recibe sugerencias'; const g = B.st(E, id).sug.find(x => x.id === a.sug); return g && g.estado === 'abierta' ? true : 'Elige una sugerencia abierta'; },
        ejecutar(E, a) { return { ok: true, msg: B.atender(E, bid(a), a.sug, a.via || 'adoptar') }; } });
      A.registrar({ id: 'postularComisionBloque', nombre: 'Aspirar a una silla en la Comisión andina', icono: '🎩', grupo: 'comercio', costo: 3,
        disponible(E, a) { const id = bid(a); if (id !== 'can') return 'En el Mercosur usa «Aspirar al Directorio»'; const J = E.jugador, nv = B.niveles(E, id); if (!B.colMiembro(E, id)) return 'Colombia no está en la CAN'; if (B.rolJ(E, id)) return 'Ya ocupas un cargo en el bloque'; if (nv.comision < 3) return 'La Comisión andina no tiene todavía comisionados por país'; if ((C.DATA.cargos[J.cargo] || { nivel: 0 }).nivel > 1) return 'Debes dejar tu cargo público primero'; return (J.ocupados || []).some(o => ['presidente', 'ministro', 'senador', 'gobernador'].includes(o)) || J.reconocimiento >= 55 ? true : 'Se exige trayectoria de Estado o gran reconocimiento'; },
        ejecutar(E, a) { const J = E.jugador, ms = C.CAN.socios(E), rel = U.suma(ms.map(x => (E.diplomacia.paises[x] || { relacion: 50 }).relacion)) / Math.max(1, ms.length), p = cl(0.12 + rel / 300 + (J.reconocimiento || 0) / 300 + ((J.ocupados || []).includes('presidente') ? 0.15 : 0.05), 0.05, 0.8);
          if (!U.chance(p)) return { ok: true, exito: false, msg: `El Consejo elige a otra persona (${Math.round(p * 100)} % de probabilidad)` };
          const cart = B.carteras('can'); E.jugador.bloqueCAN = { rol: 'comisionado', hasta: E.fecha.t + 260, cartera: a.cartera || cart[0] }; B.st(E, 'can').com = null; J.reconocimiento = cl((J.reconocimiento || 0) + 5, 0, 100); noti(E, `${J.nombre} es elegido/a comisionado/a de la Comunidad Andina`, 1, true); return { ok: true, msg: `Eres comisionado/a de ${E.jugador.bloqueCAN.cartera}: recibirás sugerencias y podrás presentar normas` }; } });
      A.registrar({ id: 'postularParlamentoBloque', nombre: 'Aspirar al Parlamento Andino', icono: '🏟', grupo: 'comercio', costo: 2,
        disponible(E, a) { const id = bid(a); if (id !== 'can') return 'En el Mercosur usa «Inscribirte en la lista al Parlamento»'; const J = E.jugador, nv = B.niveles(E, id); if (!B.colMiembro(E, id)) return 'Colombia no está en la CAN'; if (B.rolJ(E, id)) return 'Ya ocupas un cargo en el bloque'; if (nv.parlamento < 1) return 'La CAN no tiene parlamento'; if (!J.partido) return 'Necesitas un partido'; if ((C.DATA.cargos[J.cargo] || { nivel: 0 }).nivel > 2 && (nv.parlamento >= 2 || !['senador', 'representante'].includes(J.cargo))) return 'Un cargo ejecutivo es incompatible'; return true; },
        ejecutar(E) { const J = E.jugador, nv = B.niveles(E, 'can'), pa = E.partidos[J.partido], p = cl(0.2 + (J.reconocimiento || 0) / 200 + (pa && pa.lider === 'J' ? 0.2 : 0) + (['senador', 'representante'].includes(J.cargo) ? 0.2 : 0) + (nv.parlamento >= 2 ? 0 : 0.1), 0.08, 0.85);
          if (nv.parlamento >= 2) J.patrimonio -= 20; if (!U.chance(p)) return { ok: true, exito: false, msg: `No alcanzas curul en el Parlamento Andino (${Math.round(p * 100)} % de probabilidad)` };
          E.jugador.bloqueCAN = { rol: 'parlamentario', hasta: E.fecha.t + 208 }; J.reconocimiento = cl((J.reconocimiento || 0) + 3, 0, 100); noti(E, `${J.nombre} obtiene una curul en el Parlamento Andino`, 1, true); return { ok: true, msg: 'Eres parlamentario/a andino/a: votas las normas del bloque' }; } });
      A.registrar({ id: 'votarParlamentoBloque', nombre: 'Votar una norma en el Parlamento', icono: '🗳', grupo: 'comercio', costo: 0,
        disponible(E, a) { const id = bid(a), rol = B.rolJ(E, id); if (!rol || rol.rol !== 'parlamentario') return 'Sólo los parlamentarios del bloque'; const pr = B.st(E, id).prop.find(x => x.id === a.prop); return pr && ['parlamento', 'dictamen'].includes(pr.fase) ? true : 'La norma no está en el Parlamento'; },
        ejecutar(E, a) { const pr = B.st(E, bid(a)).prop.find(x => x.id === a.prop); pr.votoJ = a.voto || 'si'; C.Opinion.subirRec(E, 0.3); return { ok: true, msg: `Votas ${pr.votoJ === 'si' ? 'a favor' : 'en contra'} de «${pr.titulo}»` }; } });
      A.registrar({ id: 'cabildearGrupoBloque', nombre: 'Cabildear a un grupo del Parlamento', icono: '🤝', grupo: 'comercio', costo: 1,
        disponible(E, a) { const id = bid(a), rol = B.rolJ(E, id); if (!rol || rol.rol !== 'parlamentario') return 'Sólo los parlamentarios del bloque'; const pr = B.st(E, id).prop.find(x => x.id === a.prop); return pr && pr.fase === 'parlamento' ? true : 'La norma no está en el Parlamento'; },
        ejecutar(E, a) { const pr = B.st(E, bid(a)).prop.find(x => x.id === a.prop); pr.lobbyG[a.grupo] = (pr.lobbyG[a.grupo] || 0) + 0.12 * (a.sentido === 'no' ? -1 : 1); return { ok: true, msg: `Conversas con el grupo ${(GRUPOS.find(g => g[0] === a.grupo) || [0, a.grupo])[1].toLowerCase()}: cambia su inclinación` }; } });
      const prC = (E, a) => B.st(E, bid(a)).prop.find(x => x.id === a.prop);
      A.registrar({ id: 'negociarMesaBloque', nombre: 'Intentar cambiar el voto de una delegación (mesa redonda)', icono: '🪑', grupo: 'comercio', costo: 1,
        disponible(E, a) { const id = bid(a), p = B.puedeMesa(E, id); if (p !== true) return p; const pr = prC(E, a); if (!pr || pr.fase !== 'consejo') return 'La norma no está en la mesa del Consejo'; if (!a.pais || a.pais === 'COL') return 'Elige una delegación'; if (!B.TACTICAS[a.tactica || 'argumentar']) return 'Elige la táctica'; const m = pr.mesa; return m && m.pos[a.pais] && m.pos[a.pais].ult === m.ronda ? 'Ya conversaste con esta delegación en la ronda' : true; },
        ejecutar(E, a) { const pr = prC(E, a), r = B.negociar(E, bid(a), pr, a.pais, a.tactica || 'argumentar'); if (r.ok) C.Opinion.subirRec(E, 0.2); return r; } });
      A.registrar({ id: 'enmendarNormaMesa', nombre: 'Enmendar la norma para destrabar la mesa', icono: '✏', grupo: 'comercio', costo: 1,
        disponible(E, a) { const id = bid(a), p = B.puedeMesa(E, id); if (p !== true) return p; const pr = prC(E, a); return pr && pr.fase === 'consejo' ? (pr.mesa && pr.mesa.enm >= 2 ? 'Ya fue enmendada dos veces' : true) : 'La norma no está en la mesa del Consejo'; },
        ejecutar(E, a) { const m = B.enmendar(E, bid(a), prC(E, a)); return { ok: !m, msg: m || 'Aceptas enmiendas al texto: todas las delegaciones se ablandan un poco, pero la norma pierde alcance' }; } });
      A.registrar({ id: 'proponerNormaComisionado', nombre: 'Presentar una norma desde la Comisión', icono: '📨', grupo: 'comercio', costo: 2,
        disponible(E, a) { const id = bid(a), rol = B.rolJ(E, id); if (!rol || rol.rol !== 'comisionado') return 'Sólo el comisionado'; const n = B.norma(E, id, a.norma); if (!n) return 'Elige la norma'; return B.st(E, id).prop.some(x => x.norma === n.id && !['aprobada', 'rechazada'].includes(x.fase)) ? 'Ya está en trámite' : true; },
        ejecutar(E, a) { const pr = B.proponer(E, bid(a), a.norma, 'Comisión', { bonus: 0.1, autoriaJ: true }); return { ok: !!pr, msg: `La Comisión presenta tu propuesta: «${pr ? pr.titulo : ''}»` }; } });
    }
  };
  C.Bloques = B; C.Tiempo.registrar('bloques', B, 67); (C.MODULOS_NUEVOS = C.MODULOS_NUEVOS || []).push('Bloques'); B.registrarAcciones();
  C.DATA.eventos = (C.DATA.eventos || []).concat([{ id: 'bl_consejo', tipo: 'bloques', icono: '🏛', alcance: 'jugador', sistema: true, peso: 1, titulo: 'Consejo de la {bloque}: {titulo}', texto: 'El Consejo vota la norma «{titulo}», propuesta por {autor}. Colombia tiene un voto, igual que cada país miembro.', opciones: [
    { t: 'Apoyarla', fn: (E, e) => B.votoJ(E, e.ctx.vars.pid, 1) }, { t: 'Condicionar tu voto a ventajas para Colombia', fn: (E, e) => B.votoJ(E, e.ctx.vars.pid, 0) }, { t: 'Votar en contra', fn: (E, e) => B.votoJ(E, e.ctx.vars.pid, -1) }] }]);
})(window.CURUL);
