/* Sistema electoral: calendario, modelo de voto territorial, cifra repartidora (D'Hondt),
   umbrales, voto preferente, presidencial a dos vueltas, regionales y campaña del jugador. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const El = {
    /* Épocas institucionales simplificadas: el sistema electoral moderno (Constitución de 1991)
       es el único simulado con fidelidad; antes de 1991 el país fue bipartidista (liberales y
       conservadores) y entre 1958 y 1970 el Frente Nacional obligó a alternar la presidencia y
       repartir el Congreso en partes iguales entre los dos partidos. */
    FN_ANIOS: [1958, 1962, 1966, 1970],
    era(anio) { return anio >= 1991 ? 'moderna' : El.FN_ANIOS.includes(anio) ? 'frenteNacional' : 'bipartidista'; },
    /* Reparte curules en partes exactamente iguales entre PLR y PCN (paridad del Frente Nacional),
       usando los votos ya calculados sólo para decidir quién se lleva la curul impar. */
    paridadFN(cur, votos) {
      const tot = Object.values(cur).reduce((a, b) => a + b, 0);
      const mitad = Math.floor(tot / 2);
      const impar = (votos.PLR || 0) >= (votos.PCN || 0) ? 'PLR' : 'PCN';
      const otro = impar === 'PLR' ? 'PCN' : 'PLR';
      for (const k of Object.keys(cur)) delete cur[k];
      if (tot > 0) { cur[impar] = mitad + (tot % 2); cur[otro] = mitad; }
      return cur;
    },
    /* ── Calendario ─────────────────────────────────────────── */
    calendario(E, anios = 5) {
      const out = [], a0 = U.anio();
      for (let a = a0; a <= a0 + anios; a++) {
        if ((a - 2026) % 4 === 0) {
          out.push({ tipo: 'congreso', nombre: 'Elecciones al Congreso', fecha: U.domingo(a, 2, 2), anio: a });
          const p1 = U.domingo(a, 4, 5).getUTCMonth() === 4 ? U.domingo(a, 4, 5) : U.domingo(a, 4, 4);
          out.push({ tipo: 'presidencial', vuelta: 1, nombre: 'Presidencial · 1ª vuelta', fecha: p1, anio: a });
          const p2 = new Date(p1); p2.setUTCDate(p2.getUTCDate() + 21);
          out.push({ tipo: 'presidencial', vuelta: 2, nombre: 'Presidencial · 2ª vuelta', fecha: p2, anio: a });
        }
        if ((a - 2027) % 4 === 0) out.push({ tipo: 'regional', nombre: 'Elecciones regionales', fecha: U.domingo(a, 9, 5).getUTCMonth() === 9 ? U.domingo(a, 9, 5) : U.domingo(a, 9, 4), anio: a });
      }
      const hoy = U.hoy();
      return out.filter(e => e.fecha > hoy).sort((a, b) => a.fecha - b.fecha);
    },
    proxima(E, tipo) { return El.calendario(E).find(e => !tipo || e.tipo === tipo); },
    semanasPara(E, ev) { return U.turnoDe(ev.fecha) - E.fecha.t; },

    /* ── Utilidades de reparto ─────────────────────────────── */
    dhondt(votos, curules, umbral = 0) {
      const res = {}, cand = Object.entries(votos).filter(([p, v]) => p !== 'BLANCO' && v >= umbral && v > 0);
      // Si ninguna lista supera el umbral (circunscripciones pequeñas y fragmentadas), se reparte sin umbral
      if (!cand.length && umbral > 0) return El.dhondt(votos, curules, 0);
      cand.forEach(([p]) => res[p] = 0);
      if (!cand.length) return res;
      for (let i = 0; i < curules; i++) {
        let mejor = null, mv = -1;
        for (const [p, v] of cand) { const q = v / (res[p] + 1); if (q > mv) { mv = q; mejor = p; } }
        res[mejor]++;
      }
      for (const k of Object.keys(res)) if (!res[k]) delete res[k];
      return res;
    },
    /* Listas conjuntas reales de coalición: cuando el jugador hace campaña como cabeza de una
       coalición preelectoral para Senado o Cámara, su partido y los de sus aliados comparten una
       sola lista frente a cifra repartidora (compiten como un solo bloque contra el resto de
       partidos), y luego los escaños que gana ese bloque se reparten entre los miembros con una
       segunda cifra repartidora sobre sus votos propios — el mismo mecanismo, aplicado dos veces. */
    poolCoalicion(E, cargo, depto) {
      const cam = E.elecciones.campana;
      if (!cam || cam.eleccion !== 'congreso' || cam.cargo !== cargo || !cam.coalicion || !cam.coalicion.length) return null;
      if (cargo === 'camara' && cam.depto !== depto) return null;
      return { poolPid: E.jugador.partido, miembros: [E.jugador.partido, ...cam.coalicion.map(c => c.partido)] };
    },
    votosConPool(votos, pool) {
      if (!pool) return votos;
      const out = Object.assign({}, votos);
      let suma = 0;
      for (const pid of pool.miembros) { suma += out[pid] || 0; if (pid !== pool.poolPid) delete out[pid]; }
      out[pool.poolPid] = suma;
      return out;
    },
    subApportionCoalicion(cur, votosOriginal, pool) {
      if (!pool || !cur[pool.poolPid]) return;
      const n = cur[pool.poolPid];
      delete cur[pool.poolPid];
      const subVotos = {}; for (const pid of pool.miembros) subVotos[pid] = votosOriginal[pid] || 0;
      const subCur = El.dhondt(subVotos, n, 0);
      for (const [pid, k] of Object.entries(subCur)) cur[pid] = (cur[pid] || 0) + k;
    },
    afinidad(d, ideo) {   // afinidad de un departamento con una posición económica
      const x = (d.incl * 70 - ideo.eco) / 75;
      return 0.5 + Math.exp(-x * x);
    },
    /* La población y el PIB de data/departamentos.js son de referencia moderna; para no inventar
       una demografía histórica completa por departamento, sólo el número de electores se escala
       hacia atrás con una tasa de crecimiento poblacional media (~1.9 %/año), sólo para que las
       cifras de una elección de 1930 no muestren millones de votos que no pudieron existir. */
    factorPoblacion(anio) { return anio >= 2018 ? 1 : Math.pow(1.019, anio - 2018); },
    electores(d) { return Math.round(d.poblacion * 1000 * 0.74 * El.factorPoblacion(U.anio())); },
    participacionBase(E, d, tipo) {
      const base = tipo === 'presidencial' ? 0.55 : tipo === 'regional' ? 0.58 : 0.47;
      const reg = { Caribe: -0.02, Andina: 0.03, Pacífico: -0.05, Amazonía: -0.03, Orinoquía: -0.02, Insular: -0.08 }[d.region] || 0;
      const obl = E.constitucion && C.Constitucion.valor(E, 'votoObligatorio') === 'si' ? 0.14 : 0;
      return U.clamp(base + reg + obl + U.gauss(0, 0.02), 0.25, 0.9);
    },

    /* Cuotas de voto por partido en un departamento para listas (Congreso, asambleas…) */
    cuotas(E, dId, conRuido = true, extra) {
      const d = E.deptos[dId], out = {};
      let tot = 0;
      for (const pa of Object.values(E.partidos)) {
        if (pa.especial || pa.futuro) continue;
        let s = pa.popularidad * (pa.fuertes[dId] || 1) * El.afinidad(d, pa) * (1 + d.maq * (C.FinPartido.estructuraEf(pa) - 0.5));
        if (d.gobernador && E.politicos[d.gobernador] && E.politicos[d.gobernador].partido === pa.id) s *= 1.12;
        if (pa.id === 'MIS' && !(pa.fuertes[dId] > 1.5)) s *= 0.25;
        if (conRuido) s *= Math.exp(U.gauss(0, 0.12));
        out[pa.id] = s; tot += s;
      }
      if (extra) for (const [k, v] of Object.entries(extra)) { out[k] = v * tot; tot += out[k]; }
      const blanco = U.rf(0.025, 0.05);
      for (const k of Object.keys(out)) out[k] = out[k] / tot * (1 - blanco);
      out.BLANCO = blanco;
      return out;
    },

    /* ── Candidaturas ──────────────────────────────────────── */
    /* Fuerza personal de un candidato en una lista (voto preferente) */
    /* Con listas cerradas el orden lo fija la dirección del partido: los votos caen por posición. */
    pesoLista(E, p, dId, i) {
      if (E.constitucion && C.Constitucion.valor(E, 'sistemaListas') === 'cerrada') return Math.pow(0.86, i) * 100;
      return El.pesoPreferente(E, p, dId);
    },
    pesoPreferente(E, p, dId) {
      if (p.id === 'J') {
        const cam = E.elecciones.campana;
        return Math.pow(El.fuerzaJugador(E, dId), 1.6) * (cam && cam.cabezaLista ? 2.2 : 1);
      }
      const inc = (p.cargo && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante')) ? 15 : 0;
      return Math.pow(p.fuerza + p.r.car * 0.3 + p.r.exp * 0.1 + inc, 1.6) * Math.exp(U.gauss(0, 0.25));
    },
    /* Fuerza electoral del jugador en un departamento (o nacional si dId es null) */
    fuerzaJugador(E, dId) {
      const J = E.jugador, cam = E.elecciones.campana;
      const deps = dId ? [dId] : Object.keys(E.deptos);
      const pesos = deps.map(x => E.deptos[x].poblacion);
      const rec = U.suma(deps.map((x, i) => C.Opinion.recDepto(E, x) * pesos[i])) / U.suma(pesos);
      const fav = U.suma(deps.map((x, i) => C.Opinion.favDepto(E, x) * pesos[i])) / U.suma(pesos);
      const est = cam ? cam.estructura : 10;
      const gasto = cam ? Math.min(30, Math.sqrt(cam.gastado / 10)) : 0;
      const inc = (J.cargo === 'senador' || J.cargo === 'representante') ? 15 : 0;
      const coal = cam && cam.coalicion ? U.suma(cam.coalicion.map(c => (E.partidos[c.partido] ? E.partidos[c.partido].popularidad : 0) * 0.45)) : 0;
      return 10 + rec * 0.55 + fav * 0.35 + est * 0.3 + gasto + inc + (J.atributos.carisma - 50) * 0.15 + coal + (C.Vice ? C.Vice.bonusFormula(E, dId) : 0);
    },
    /* Candidatos de un partido para una lista. Los incumbentes van primero (buscan reelección);
       los aspirantes se ordenan por su peso interno en el partido, porque cuando la dirección
       arma una lista cerrada prioriza a quien más pesa a la hora de completar los renglones
       disponibles (quien gana una consulta interna ya llega aparte, como cabeza de lista). */
    formarLista(E, pid, camara, dId, cupo, electosPrevios) {
      const lista = [];
      const es = p => p.activo && p.id !== 'J' && (p.proximoPartido || p.partido) === pid && El.edadOK(p);
      // Incumbentes que buscan reelección
      for (const p of Object.values(E.politicos)) {
        if (!es(p) || !p.cargo) continue;
        if (camara === 'senado' && p.cargo.tipo === 'senador' && !p.aspiraOtro) lista.push(p);
        if (camara === 'camara' && p.cargo.tipo === 'representante' && p.cargo.circ === dId && !p.aspiraOtro) lista.push(p);
      }
      // Aspirantes del partido, ordenados por peso interno (nacional para Senado, departamental para Cámara)
      const nivel = camara === 'senado' ? 'nac' : 'dep';
      const aspirantes = [];
      for (const p of Object.values(E.politicos)) {
        if (!es(p) || !p.cargo) continue;
        if (p.cargo.tipo === 'aspirante') {
          if (camara === 'senado' && p.cargo.aspira === 'senado') aspirantes.push(p);
          if (camara === 'camara' && p.cargo.aspira === 'camara' && p.depto === dId) aspirantes.push(p);
        } else if (camara === 'senado' && p.cargo.tipo === 'representante' && !p.aspiraOtro
          && p.aspiraAnuncio && p.aspiraAnuncio.destino === 'senador') {
          // Un representante que ya anunció ambición al Senado se lanza de verdad: deja su curul
          // de Cámara y compite como aspirante nacional, en vez de generar uno sintético aparte.
          p.aspiraOtro = 'senado';
          aspirantes.push(p);
        }
      }
      const ambSenado = p => p.aspiraAnuncio && p.aspiraAnuncio.destino === 'senador' ? 20 : 0;
      aspirantes.sort((a, b) => (C.Partidos.peso(E, b)[nivel] + ambSenado(b)) - (C.Partidos.peso(E, a)[nivel] + ambSenado(a)));
      // Si el jugador dirige el partido, arma la lista él: sus inscritos van primero y sus vetados quedan por fuera.
      const cfg = C.Director ? C.Director.configLista(E, pid, camara, dId) : null;
      if (cfg) {
        const fuera = new Set(cfg.vetados);
        const dentro = cfg.inscritos.map(id => E.politicos[id]).filter(p => p && p.activo && p.id !== 'J' && (p.proximoPartido || p.partido) === pid && !fuera.has(p.id));
        const quitar = (arr, pred) => { for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) arr.splice(i, 1); };
        quitar(lista, p => fuera.has(p.id) || dentro.includes(p)); quitar(aspirantes, p => fuera.has(p.id) || dentro.includes(p));
        lista.unshift(...dentro);
      }
      for (const p of aspirantes) { if (lista.length >= cupo) break; lista.push(p); }
      while (lista.length < cupo) lista.push(C.Politicos.crear(E, { partido: pid, depto: dId || undefined, cargo: { tipo: 'aspirante', aspira: camara } }));
      for (const p of lista) if (p.proximoPartido) { p.partido = p.proximoPartido; delete p.proximoPartido; }
      return lista.slice(0, Math.max(cupo, lista.length));
    },
    edadOK: p => (U.anio() - p.nac) < 78,

    /* ── Elección del Congreso ─────────────────────────────── */
    congreso(E, opts = {}) {
      const anio = opts.anio || U.anio();
      const J = E.jugador, cam = E.elecciones.campana;
      const jugCamara = cam && cam.eleccion === 'congreso' ? cam.cargo : null;   // 'senado' | 'camara'
      const res = { id: U.id('el'), tipo: 'congreso', anio, t: E.fecha.t, porDepto: {}, senado: {}, camara: { porDepto: {}, curules: {} }, jugador: null };
      const partidos = Object.values(E.partidos).filter(p => !p.especial && !p.futuro);
      const movJ = jugCamara && cam.partido === 'MOV';

      // 1. Votación por departamento (Senado: circunscripción nacional; Cámara: departamental)
      const votosSen = {}; let validosSen = 0, electoresTot = 0, votantesTot = 0;
      for (const d of Object.values(E.deptos)) {
        const el = El.electores(d), part = El.participacionBase(E, d, 'congreso') + (cam && cam.eleccion === 'congreso' && cam.depto === d.id ? cam.voluntarios / 40000 : 0);
        const votantes = Math.round(el * part), validos = Math.round(votantes * U.rf(0.9, 0.95));
        const extra = {};
        if (movJ) extra.MOV = Math.min(0.25, El.fuerzaJugador(E, jugCamara === 'camara' ? cam.depto : null) / 900 * (jugCamara === 'camara' && d.id !== cam.depto ? 0 : 1));
        const cuo = El.cuotas(E, d.id, true, movJ ? extra : null);
        const votos = {}; for (const [p, s] of Object.entries(cuo)) votos[p] = Math.round(validos * s);
        res.porDepto[d.id] = { votos, validos, votantes, electores: el, participacion: part };
        electoresTot += el; votantesTot += votantes;
        for (const [p, v] of Object.entries(votos)) {
          if (movJ && jugCamara === 'camara' && p === 'MOV') continue;
          votosSen[p] = (votosSen[p] || 0) + v;
        }
        validosSen += validos;
      }
      res.participacion = votantesTot / electoresTot;

      // 2. Senado: cifra repartidora sobre 100 curules nacionales. El umbral del 3 % es una
      // reforma de 2003 (Acto Legislativo 01); antes no existía piso alguno.
      const era = El.era(anio);
      const umbralSenPct = E.constitucion ? C.Constitucion.valor(E, 'umbralSenado') : C.DATA.camaras.senado.umbral;
      const umbralSen = anio >= 2003 ? validosSen * umbralSenPct : 0;
      if (C.Director) for (const pid of Object.keys(votosSen)) { const m = C.Director.multLista(E, pid, 'senado', null); if (m !== 1) votosSen[pid] = Math.round(votosSen[pid] * m); }
      const poolSen = El.poolCoalicion(E, 'senado', null);
      const curSen = El.dhondt(El.votosConPool(votosSen, poolSen), 100, umbralSen);
      El.subApportionCoalicion(curSen, votosSen, poolSen);
      if (era === 'frenteNacional') El.paridadFN(curSen, votosSen);
      if (opts.forzarJugador === 'senado' && !curSen[J.partido]) {
        const mayor = Object.entries(curSen).sort((a, b) => b[1] - a[1])[0];
        curSen[mayor[0]]--; curSen[J.partido] = 1;
      }
      res.senado = { votos: votosSen, validos: validosSen, umbral: umbralSen, curules: curSen, electos: [] };
      for (const [pid, n] of Object.entries(curSen)) {
        if (pid === 'MOV') { res.senado.electos.push({ pol: 'J', partido: 'MOV', circ: 'NAC', votos: votosSen.MOV }); continue; }
        const lista = El.formarLista(E, pid, 'senado', null, Math.min(100, Math.ceil(n * 1.4) + 3));
        const forzado = opts.forzarJugador === 'senado' && J.partido === pid;
        if ((jugCamara === 'senado' && cam.partido === pid) || forzado) lista.push(E.politicos.J);
        const pesos = lista.map((p, i) => El.pesoLista(E, p, null, i)), tp = U.suma(pesos);
        const ranking = lista.map((p, i) => ({ pol: p.id, partido: pid, circ: 'NAC', votos: Math.round(votosSen[pid] * 0.7 * pesos[i] / tp) }))
          .sort((a, b) => b.votos - a.votos);
        if (forzado) { const iJ = ranking.findIndex(r => r.pol === 'J'); const [rJ] = ranking.splice(iJ, 1); rJ.votos = Math.max(rJ.votos, ranking[0] ? ranking[0].votos + 1500 : rJ.votos); ranking.unshift(rJ); }
        ranking.forEach((c, i) => { c.puesto = i + 1; c.electo = i < n; });
        res.senado.electos.push(...ranking.slice(0, n));
        res.senado.listas = res.senado.listas || {}; res.senado.listas[pid] = ranking;
      }
      // Circunscripción indígena del Senado (creada por la Constitución de 1991)
      if (anio >= 1991) for (let i = 0; i < 2; i++) {
        const p = El.candidatoEspecial(E, 'MIS', U.pick(['CAU', 'NAR', 'LAG', 'VAU', 'GUA']), 'senado');
        res.senado.electos.push({ pol: p.id, partido: p.partido, circ: 'IND-SEN', votos: U.ri(30000, 90000) });
      }

      // 3. Cámara: circunscripciones departamentales con umbral del 50 % (o 30 %) del cociente
      for (const d of Object.values(E.deptos)) {
        const pd = res.porDepto[d.id];
        const votos = Object.assign({}, pd.votos);
        if (C.Director) for (const pid of Object.keys(votos)) { const m = C.Director.multLista(E, pid, 'camara', d.id); if (m !== 1) votos[pid] = Math.round(votos[pid] * m); }
        if (movJ && jugCamara === 'senado') delete votos.MOV;
        const cociente = pd.validos / d.camara;
        const umbral = anio >= 1991 ? cociente * (d.camara > 2 ? C.DATA.camaras.camara.umbralMayor : C.DATA.camaras.camara.umbralMenor) : 0;
        const poolCam = El.poolCoalicion(E, 'camara', d.id);
        const cur = El.dhondt(El.votosConPool(votos, poolCam), d.camara, umbral);
        El.subApportionCoalicion(cur, votos, poolCam);
        if (era === 'frenteNacional') El.paridadFN(cur, votos);
        const electos = [];
        // El jugador que empieza como representante tiene garantizada su curul en la generación del mundo
        if (opts.forzarJugador === 'camara' && d.id === J.residencia && !cur[J.partido]) {
          const mayor = Object.entries(cur).sort((a, b) => b[1] - a[1])[0];
          cur[mayor[0]]--; if (!cur[mayor[0]]) delete cur[mayor[0]]; cur[J.partido] = 1;
        }
        const listas = {};
        for (const [pid, n] of Object.entries(cur)) {
          if (pid === 'MOV') { electos.push({ pol: 'J', partido: 'MOV', circ: d.id, votos: votos.MOV, puesto: 1, electo: true }); continue; }
          const lista = El.formarLista(E, pid, 'camara', d.id, Math.min(d.camara + 1, n + 2));
          const conJ = (jugCamara === 'camara' && cam.partido === pid && cam.depto === d.id) || (opts.forzarJugador === 'camara' && J.partido === pid && J.residencia === d.id);
          if (conJ) lista.push(E.politicos.J);
          const pesos = lista.map((p, i) => El.pesoLista(E, p, d.id, i)), tp = U.suma(pesos);
          const ranking = lista.map((p, i) => ({ pol: p.id, partido: pid, circ: d.id, votos: Math.round(votos[pid] * 0.75 * pesos[i] / tp) })).sort((a, b) => b.votos - a.votos);
          if (opts.forzarJugador === 'camara' && conJ) { const iJ = ranking.findIndex(r => r.pol === 'J'); const [rJ] = ranking.splice(iJ, 1); ranking.unshift(rJ); }
          ranking.forEach((c, i) => { c.puesto = i + 1; c.electo = i < n; });
          electos.push(...ranking.slice(0, n)); listas[pid] = ranking;
        }
        // Lista del jugador que no alcanzó curul: se registra para el resultado personal
        if (jugCamara === 'camara' && cam.depto === d.id && !listas[cam.partido] && cam.partido !== 'MOV') listas[cam.partido] = [{ pol: 'J', partido: cam.partido, votos: Math.round((votos[cam.partido] || 0) * 0.3), puesto: 1, electo: false }];
        res.camara.porDepto[d.id] = { votos, cociente, umbral, curules: cur, electos, listas };
        for (const [p, n] of Object.entries(cur)) res.camara.curules[p] = (res.camara.curules[p] || 0) + n;
      }
      // Circunscripciones especiales de la Cámara (creadas por la Constitución de 1991 en adelante)
      res.camara.especiales = [];
      for (const esp of (anio >= 1991 ? C.DATA.camaras.camara.especiales : [])) {
        if (esp.oposicion) continue;
        if (esp.vigencia && anio > esp.vigencia) continue;
        for (let i = 0; i < esp.curules; i++) {
          const partido = esp.partidos ? U.pick(esp.partidos) : U.pesado(partidos, p => p.popularidad).id;
          const depto = esp.id === 'CITREP' ? U.pick(['CAU', 'NAR', 'CHO', 'ANT', 'CAQ', 'MET', 'PUT', 'BOL', 'CES', 'COR', 'SUC', 'ARA', 'GUV', 'NSA', 'TOL', 'VAL'])
                      : esp.id === 'RAIZ' ? 'SAP' : esp.id === 'AFRO' ? U.pick(['CHO', 'VAL', 'CAU', 'NAR', 'BOL']) : esp.id === 'INDG' ? U.pick(['CAU', 'LAG', 'NAR']) : 'BOG';
          const p = El.candidatoEspecial(E, partido, depto, 'camara');
          res.camara.especiales.push({ pol: p.id, partido: p.partido, circ: esp.id, votos: U.ri(8000, 60000) });
          res.camara.curules[p.partido] = (res.camara.curules[p.partido] || 0) + 1;
        }
      }
      res.senado.curulesTot = {}; for (const e of res.senado.electos) res.senado.curulesTot[e.partido] = (res.senado.curulesTot[e.partido] || 0) + 1;

      // 4. Resultado del jugador
      if (jugCamara) {
        let fila = null;
        if (jugCamara === 'senado') { fila = res.senado.electos.find(e => e.pol === 'J') || (res.senado.listas && res.senado.listas[cam.partido] || []).find(e => e.pol === 'J'); }
        else { const pd = res.camara.porDepto[cam.depto]; fila = pd.electos.find(e => e.pol === 'J') || (pd.listas[cam.partido] || []).find(e => e.pol === 'J'); }
        res.jugador = { cargo: jugCamara, electo: !!(fila && fila.electo !== false && (jugCamara === 'senado' ? res.senado.electos : res.camara.porDepto[cam.depto].electos).some(e => e.pol === 'J')), votos: fila ? fila.votos : 0, puesto: fila ? fila.puesto : null, depto: cam.depto, partido: cam.partido };
      }
      return res;
    },
    candidatoEspecial(E, partido, depto, camara) {
      const p = C.Politicos.crear(E, { partido, depto, cargo: { tipo: 'aspirante', aspira: camara } });
      return p;
    },

    /* ── Elección presidencial ─────────────────────────────── */
    candidatosPresidencia(E) {
      const cands = [], usados = new Set(), viceUsados = [];
      const J = E.jugador, cam = E.elecciones.campana;
      const grandes = Object.values(E.partidos).filter(p => !p.especial && !p.futuro && p.popularidad >= 3.5).sort((a, b) => b.popularidad - a.popularidad);
      for (const pa of grandes) {
        if (cands.length >= 6) break;
        if (cam && cam.eleccion === 'presidencial' && cam.partido === pa.id) { cands.push({ pol: 'J', partido: pa.id, vice: C.Vice ? C.Vice.formulaDeJ(E) : null }); usados.add(pa.id); continue; }
        // Partidos pequeños pueden adherir a un candidato afín en lugar de postular
        if (pa.popularidad < 6 && cands.some(c => U.distIdeo(E.partidos[c.partido] || J.ideologia, pa) < 0.18) && U.chance(0.7)) continue;
        const aspirantes = Object.values(E.politicos).filter(p => p.activo && p.partido === pa.id && p.id !== 'J' && El.edadOK(p) && (!p.cargo || p.cargo.tipo !== 'presidente'));
        const ambPres = p => p.aspiraAnuncio && p.aspiraAnuncio.destino === 'presidencia' ? 20 : 0;
        const avalado = C.Director ? C.Director.avalUni(E, pa.id, 'presidencia', null) : null;
        const cand = avalado && aspirantes.includes(avalado) ? avalado : aspirantes.sort((a, b) => (b.r.car + b.r.amb + b.fuerza + (b.id === pa.lider ? 30 : 0) + ambPres(b)) - (a.r.car + a.r.amb + a.fuerza + (a.id === pa.lider ? 30 : 0) + ambPres(a)))[0];
        if (!cand) continue;
        cand.aspiraOtro = 'presidencia';
        cands.push({ pol: cand.id, partido: pa.id, vice: C.Vice ? C.Vice.formulaNPC(E, { pol: cand.id, partido: pa.id }, viceUsados) : null }); usados.add(pa.id);
      }
      if (cam && cam.eleccion === 'presidencial' && cam.partido === 'MOV') cands.push({ pol: 'J', partido: 'MOV', vice: C.Vice ? C.Vice.formulaDeJ(E) : null });
      return cands;
    },
    /* Fuerza de un candidato presidencial (jugador o NPC), reutilizada tanto por la elección real
       como por la proyección de encuestas en tiempo real durante campaña. */
    fnGanaAnio(anioEl) { return El.FN_ANIOS.includes(anioEl) ? (El.FN_ANIOS.indexOf(anioEl) % 2 === 0 ? 'PLR' : 'PCN') : null; },
    ideoCandidato(E, c) { return c.pol === 'J' ? E.jugador.ideologia : { eco: E.politicos[c.pol].eco, soc: E.politicos[c.pol].soc }; },
    fuerzaCandidatoPresidencial(E, c, fnGana) {
      const gob = E.gobierno, aprob = E.opinion.aprobacionPres;
      if (c.pol === 'J') return 6 + El.fuerzaJugador(E, null) * 0.35;
      const p = E.politicos[c.pol], pa = E.partidos[c.partido];
      let s = (pa ? pa.popularidad : 3) + p.r.car * 0.12 + p.fuerza * 0.05;
      if (c.partido === gob.partido) s *= U.clamp(aprob / 42, 0.4, 1.6);
      for (const o of Object.values(E.partidos)) if (!o.especial && !o.futuro && o.id !== c.partido && U.distIdeo(o, p) < 0.14) s += o.popularidad * 0.35;
      if (C.Vice) s += C.Vice.bonusNPC(E, c);
      if (fnGana) s *= c.partido === fnGana ? 2.4 : 0.55;
      return s;
    },
    presidencial(E, vuelta, candidatos, previo) {
      const gob = E.gobierno, aprob = E.opinion.aprobacionPres, anioEl = U.anio();
      const res = { id: U.id('el'), tipo: 'presidencial', vuelta, anio: anioEl, t: E.fecha.t, candidatos: [], porDepto: {}, jugador: null };
      // Frente Nacional (1958-1970): el pacto obliga a alternar la presidencia entre liberales y
      // conservadores; ningún otro partido tiene opción real de gobernar en esos comicios.
      const fnGana = El.fnGanaAnio(anioEl);
      const ideoDe = c => El.ideoCandidato(E, c);
      const fuerza = c => El.fuerzaCandidatoPresidencial(E, c, fnGana);
      const base = candidatos.map(c => ({ ...c, f: fuerza(c), ideo: ideoDe(c) }));
      let el = 0, vt = 0;
      const tot = {};
      for (const d of Object.values(E.deptos)) {
        const electores = El.electores(d), part = El.participacionBase(E, d, 'presidencial') + (vuelta === 2 ? 0.02 : 0);
        const votantes = Math.round(electores * part), validos = Math.round(votantes * 0.97);
        const cuo = {}; let st = 0;
        for (const c of base) {
          let s = Math.pow(c.f, 1.2) * Math.pow(El.afinidad(d, c.ideo), 1.6);
          if (c.pol === 'J') s *= 1 + (C.Opinion.recDepto(E, d.id) - 30) / 150;
          else if (E.politicos[c.pol].depto === d.id) s *= 1.25;
          s *= Math.exp(U.gauss(0, 0.08));
          cuo[c.pol] = s; st += s;
        }
        const blanco = vuelta === 2 ? U.rf(0.03, 0.05) : U.rf(0.015, 0.03);
        const votos = {}; for (const c of base) { votos[c.pol] = Math.round(validos * (1 - blanco) * cuo[c.pol] / st); tot[c.pol] = (tot[c.pol] || 0) + votos[c.pol]; }
        votos.BLANCO = Math.round(validos * blanco);
        res.porDepto[d.id] = { votos, validos, votantes, electores, participacion: part };
        el += electores; vt += votantes;
      }
      const validosTot = U.suma(Object.values(res.porDepto).map(x => x.validos));
      res.participacion = vt / el;
      res.candidatos = base.map(c => ({ pol: c.pol, partido: c.partido, vice: c.vice || null, votos: tot[c.pol], pct: tot[c.pol] / validosTot * 100 })).sort((a, b) => b.votos - a.votos);
      res.ganador = res.candidatos[0].pct > 50 || vuelta === 2 ? res.candidatos[0].pol : null;
      res.segunda = !res.ganador ? res.candidatos.slice(0, 2).map(c => ({ pol: c.pol, partido: c.partido, vice: c.vice })) : null;
      const iJ = res.candidatos.findIndex(c => c.pol === 'J');
      if (iJ >= 0) res.jugador = { cargo: 'presidencia', electo: res.ganador === 'J', votos: res.candidatos[iJ].votos, puesto: iJ + 1, pct: res.candidatos[iJ].pct, pasa: !!(res.segunda && res.segunda.some(c => c.pol === 'J')) };
      return res;
    },

    /* ── Elecciones regionales (gobernaciones y alcaldías de capitales) ──
       Antes de 1991 el presidente nombraba a los gobernadores y éstos, a su vez, a los alcaldes:
       no había voto popular para estos cargos (así fue en Colombia hasta la Constitución de 1991). */
    regional(E) {
      const anio = U.anio();
      const res = { id: U.id('el'), tipo: 'regional', anio, t: E.fecha.t, porDepto: {}, alcaldias: {}, jugador: null };
      const cam = E.elecciones.campana;
      if (anio < 1991) return El.regionalDesignado(E, res);
      for (const d of Object.values(E.deptos)) {
        for (const tipo of ['gobernacion', 'alcaldia']) {
          const cuo = El.cuotas(E, d.id, true);
          const top = Object.entries(cuo).filter(([p]) => p !== 'BLANCO').sort((a, b) => b[1] - a[1]).slice(0, U.ri(3, 4));
          // Si un diputado/concejal de la colectividad ya anunció ambición a este cargo, se lanza
          // de verdad con ese nombre (y una prima de fuerza) en vez de fabricar un aspirante nuevo.
          const destinoAmb = tipo === 'gobernacion' ? 'gobernador' : 'alcalde';
          const origenAmb = tipo === 'gobernacion' ? 'diputado' : 'concejal';
          const cands = top.map(([pid, s]) => {
            const named = Object.values(E.politicos).find(p => p.activo && p.id !== 'J' && p.partido === pid && p.depto === d.id
              && p.cargo && p.cargo.tipo === origenAmb && !p.aspiraOtro && p.aspiraAnuncio && p.aspiraAnuncio.destino === destinoAmb);
            if (named) { named.aspiraOtro = tipo; return { pol: named.id, partido: pid, s: s * 1.25 }; }
            return { pol: C.Politicos.crear(E, { partido: pid, depto: d.id, cargo: { tipo: 'aspirante', aspira: tipo } }).id, partido: pid, s };
          });
          // El partido que dirige el jugador presenta a quien él avaló; los aspirantes a quienes negó el aval
          // pueden ir por firmas y le quitan votos al candidato oficial.
          for (const c of cands) {
            const av = C.Director ? C.Director.avalUni(E, c.partido, tipo, d.id) : null;
            if (av && av.id !== c.pol) { if (E.politicos[c.pol]) E.politicos[c.pol].aspiraOtro = null; av.aspiraOtro = tipo; c.pol = av.id; c.s *= 1.2; }
          }
          for (const p of Object.values(E.politicos)) {
            if (p.activo && p.disidente && p.disidente.cargo === tipo && p.disidente.depto === d.id && !cands.some(c => c.pol === p.id)) {
              cands.push({ pol: p.id, partido: 'IND', s: (top[0] ? top[0][1] : 0.1) * 0.5 });
            }
            if (p.disidente && p.disidente.cargo === tipo && p.disidente.depto === d.id) p.disidente = null;
          }
          if (cam && cam.eleccion === 'regional' && cam.cargo === tipo && cam.depto === d.id) {
            // Si el jugador ganó la consulta interna de su partido, es el único candidato de esa
            // colectividad (no compite consigo mismo contra otro nombre de su propio partido).
            if (cam.primariaGanada) { const iOld = cands.findIndex(c => c.partido === cam.partido); if (iOld >= 0) cands.splice(iOld, 1); }
            cands.push({ pol: 'J', partido: cam.partido, s: El.fuerzaJugador(E, d.id) / 250 * (cam.primariaGanada ? 1.15 : 1) });
          }
          const electores = El.electores(d) * (tipo === 'alcaldia' ? 0.45 : 1), part = El.participacionBase(E, d, 'regional');
          const validos = Math.round(electores * part * 0.95);
          let st = 0; cands.forEach(c => { c.s *= Math.exp(U.gauss(0, 0.2)) * (c.pol === 'J' ? 1 : (0.6 + E.politicos[c.pol].r.car / 100)); st += c.s; });
          cands.forEach(c => c.votos = Math.round(validos * 0.96 * c.s / st));
          cands.sort((a, b) => b.votos - a.votos);
          const r = { candidatos: cands.map(c => ({ pol: c.pol, partido: c.partido, votos: c.votos, pct: c.votos / validos * 100 })), validos, participacion: part, ganador: cands[0].pol };
          if (tipo === 'gobernacion') res.porDepto[d.id] = r; else res.alcaldias[d.id] = r;
          if (cands.some(c => c.pol === 'J')) {
            const i = cands.findIndex(c => c.pol === 'J');
            res.jugador = { cargo: tipo, electo: i === 0, votos: cands[i].votos, puesto: i + 1, depto: d.id, pct: cands[i].votos / validos * 100 };
          }
        }
      }
      // Corporaciones locales del jugador (asamblea o concejo): lista con candidatos sintéticos
      if (cam && cam.eleccion === 'regional' && (cam.cargo === 'asamblea' || cam.cargo === 'concejo')) res.jugador = El.corporacionLocal(E, cam);
      return res;
    },
    /* Antes de 1991: el presidente designa gobernador; el gobernador designa alcalde. Sin voto
       popular, así que se fabrica un resultado con la misma forma que una elección para que el
       resto de la interfaz (mapa, noche electoral) funcione sin cambios. */
    regionalDesignado(E, res) {
      const gob = E.gobierno;
      for (const d of Object.values(E.deptos)) {
        const pidGob = U.pesado(Object.values(E.partidos).filter(p => !p.especial && !p.futuro),
          p => (p.id === gob.partido ? 3 : 1) * (1 - U.distIdeo(p, E.partidos[gob.partido] || p)) + 0.3).id;
        const polGob = C.Politicos.crear(E, { partido: pidGob, depto: d.id, cargo: { tipo: 'aspirante', aspira: 'gobernacion' } });
        res.porDepto[d.id] = { candidatos: [{ pol: polGob.id, partido: pidGob, votos: 0, pct: 100 }], validos: 0, participacion: 0, ganador: polGob.id, designado: true };
        const pidAlc = U.pesado(Object.values(E.partidos).filter(p => !p.especial && !p.futuro), p => p.id === pidGob ? 3 : 1).id;
        const polAlc = C.Politicos.crear(E, { partido: pidAlc, depto: d.id, cargo: { tipo: 'aspirante', aspira: 'alcaldia' } });
        res.alcaldias[d.id] = { candidatos: [{ pol: polAlc.id, partido: pidAlc, votos: 0, pct: 100 }], validos: 0, participacion: 0, ganador: polAlc.id, designado: true };
      }
      return res;
    },
    /* Elección de Asamblea o Concejo cuando el jugador es candidato: igual que en el Congreso, se
       arma una lista con nombre y apellido (voto preferente) para poder mostrar, boletín a
       boletín, cuántos votos saca cada candidato y quién pasa y quién no — no sólo el puesto del
       jugador. */
    corporacionLocal(E, cam) {
      const d = E.deptos[cam.depto];
      const curules = cam.cargo === 'asamblea' ? U.clamp(Math.round(d.poblacion / 150) + 10, 11, 31) : U.clamp(Math.round(d.poblacion / 250) + 13, 13, 45);
      const cuo = El.cuotas(E, d.id, true, cam.partido === 'MOV' ? { MOV: El.fuerzaJugador(E, d.id) / 700 } : null);
      const validos = Math.round(El.electores(d) * (cam.cargo === 'concejo' ? 0.45 : 1) * 0.55);
      const votos = {}; for (const [p, s] of Object.entries(cuo)) votos[p] = Math.round(validos * s);
      const cur = El.dhondt(votos, curules, validos / curules * 0.5);
      const n = cur[cam.partido] || 0;
      let lista;
      if (cam.partido === 'MOV') {
        // Un movimiento propio no tiene lista: el jugador compite solo por esa cuota.
        lista = [{ pol: 'J', votos: votos.MOV || 0, puesto: 1, electo: n >= 1 }];
      } else {
        const nCands = Math.max(6, Math.min(curules + 4, n + 5));
        const rivales = Array.from({ length: nCands - 1 }, () => C.Politicos.crear(E, { partido: cam.partido, depto: d.id, cargo: { tipo: 'aspirante', aspira: cam.cargo } }));
        const cands = [{ pol: 'J', peso: Math.pow(El.fuerzaJugador(E, d.id), 1.6) }]
          .concat(rivales.map(p => ({ pol: p.id, peso: Math.pow(p.fuerza + p.r.car * 0.3 + p.r.exp * 0.1, 1.6) * Math.exp(U.gauss(0, 0.3)) })));
        const tp = U.suma(cands.map(c => c.peso)), totPartido = Math.round((votos[cam.partido] || 0) * 0.85);
        lista = cands.map(c => ({ pol: c.pol, votos: Math.round(totPartido * c.peso / tp) })).sort((a, b) => b.votos - a.votos);
        lista.forEach((c, i) => { c.puesto = i + 1; c.electo = i < n; });
      }
      const mio = lista.find(c => c.pol === 'J');
      return { cargo: cam.cargo, electo: mio.electo, votos: mio.votos, puesto: mio.puesto, depto: d.id, partido: cam.partido, curulesPartido: n, curules, reparto: cur, lista };
    },

    /* ── Turno: ejecuta elecciones que caen esta semana ────── */
    turno(E) {
      const hoy = U.hoy(), antes = U.fechaDe(E.fecha.t - 1);
      const anio = hoy.getUTCFullYear();
      const cal = [];
      for (let a = anio - 1; a <= anio; a++) {
        if ((a - 2026) % 4 === 0) {
          cal.push({ tipo: 'congreso', fecha: U.domingo(a, 2, 2) });
          const p1 = U.domingo(a, 4, 5).getUTCMonth() === 4 ? U.domingo(a, 4, 5) : U.domingo(a, 4, 4);
          const p2 = new Date(p1); p2.setUTCDate(p2.getUTCDate() + 21);
          cal.push({ tipo: 'presidencial', vuelta: 1, fecha: p1 }, { tipo: 'presidencial', vuelta: 2, fecha: p2 });
        }
        if ((a - 2027) % 4 === 0) cal.push({ tipo: 'regional', fecha: U.domingo(a, 9, 5).getUTCMonth() === 9 ? U.domingo(a, 9, 5) : U.domingo(a, 9, 4) });
      }
      for (const ev of cal) if (ev.fecha > antes && ev.fecha <= hoy) El.ejecutar(E, ev);
      // Posesión de gobernadores y alcaldes: 1 de enero
      if (E.elecciones.regionalPendiente && hoy.getUTCMonth() === 0 && hoy.getUTCDate() <= 7) El.posesionRegional(E, E.elecciones.regionalPendiente);
      // Semanas de campaña: métricas y encuestas propias
      if (E.elecciones.campana) El.turnoCampana(E);
    },
    ejecutar(E, ev) {
      let res;
      const Hist = E.elecciones.historico;
      if (ev.tipo === 'congreso') {
        res = El.congreso(E);
        E.congreso.electos = res;           // se instalan el 20 de julio
      } else if (ev.tipo === 'presidencial' && ev.vuelta === 1) {
        const cands = El.candidatosPresidencia(E);
        res = El.presidencial(E, 1, cands);
        if (res.ganador) E.gobierno.electo = { pol: res.ganador, partido: res.candidatos[0].partido, vice: res.candidatos[0].vice || null, segundo: res.candidatos[1] };
        else E.elecciones.segundaVuelta = res.segunda;
      } else if (ev.tipo === 'presidencial' && ev.vuelta === 2) {
        if (!E.elecciones.segundaVuelta) return;
        res = El.presidencial(E, 2, E.elecciones.segundaVuelta);
        E.gobierno.electo = { pol: res.ganador, partido: res.candidatos[0].partido, vice: res.candidatos[0].vice || null, segundo: res.candidatos[1] };
        E.elecciones.segundaVuelta = null;
      } else if (ev.tipo === 'regional') {
        res = El.regional(E);
        E.elecciones.regionalPendiente = res;   // posesión 1 de enero
      }
      if (!res) return;
      const ant = Hist.slice().reverse().find(h => h.tipo === res.tipo && (h.vuelta || 1) === (res.vuelta || 1));
      res.anterior = ant ? ant.id : null;
      Hist.push(res);
      El.compactarHistorico(E);
      // Resultado personal del jugador
      const cam = E.elecciones.campana;
      if (cam && res.jugador) El.cerrarCampana(E, res);
      else if (cam && cam.eleccion === res.tipo && res.tipo !== 'presidencial') El.cerrarCampana(E, res);
      E.elecciones.nochePendiente = res.id;
      C.Medios.noticia(E, { tipo: 'elecciones', titular: El.titular(E, res), tono: 0, importante: true });
      C.Bus.emit('eleccion', res);
    },
    titular(E, res) {
      if (res.tipo === 'congreso') {
        const top = Object.entries(res.senado.curulesTot).sort((a, b) => b[1] - a[1])[0];
        return `Elecciones al Congreso: el ${E.partidos[top[0]] ? E.partidos[top[0]].nombre : 'movimiento'} obtiene la mayor bancada del Senado (${top[1]} curules)`;
      }
      if (res.tipo === 'presidencial') {
        const nom = c => c.pol === 'J' ? E.jugador.nombre : E.politicos[c.pol].nombre;
        if (res.ganador) return `${nom(res.candidatos[0])} es elegido presidente con el ${U.d1(res.candidatos[0].pct)} %`;
        return `Habrá segunda vuelta: ${nom(res.candidatos[0])} vs. ${nom(res.candidatos[1])}`;
      }
      return 'Elecciones regionales: el país elige gobernadores y alcaldes';
    },
    /* Para no inflar las partidas, sólo las últimas elecciones guardan listas completas */
    compactarHistorico(E) {
      const H = E.elecciones.historico;
      H.forEach((h, i) => {
        if (i < H.length - 6) {
          if (h.senado) delete h.senado.listas;
          if (h.camara) for (const pd of Object.values(h.camara.porDepto)) delete pd.listas;
        }
      });
    },

    /* Vacancia de gobernación o alcaldía a mitad de periodo (ej. pérdida de investidura): a
       diferencia del fin normal del periodo (posesionRegional), aquí nadie ganó una elección — el
       Gobierno designa a un sucesor interino del mismo partido, igual que Gobierno.vacante hace con
       una curul del Congreso, para no dejar el departamento o el municipio sin gobernante hasta la
       próxima elección regional. */
    vacanteRegional(E, depto, tipo, opts) {
      const d = E.deptos[depto], clave = tipo, atipica = !!(opts && opts.atipica);
      const saliente = E.politicos[d[clave]];
      let partido = saliente ? saliente.partido : null;
      if (atipica) {
        // Elección atípica: nadie hereda el cargo; gana quien el electorado prefiera hoy, y el partido
        // del funcionario revocado llega debilitado.
        const cuo = El.cuotas(E, depto, true); delete cuo.BLANCO;
        if (partido) cuo[partido] = (cuo[partido] || 0) * 0.45;
        partido = U.pesado(Object.keys(cuo), k => cuo[k]) || partido;
      }
      const sucesor = C.Politicos.crear(E, { partido, depto, cargo: { tipo, depto } });
      d[clave] = sucesor.id;
      const lugar = tipo === 'alcalde' ? d.capital : d.nombre;
      if (atipica) {
        C.Politicos.anotar(sucesor, `Gana la elección atípica como ${tipo} tras la revocatoria de ${saliente ? saliente.nombre : 'su antecesor'}`);
        C.Medios.noticia(E, { tipo: 'regional', titular: `${sucesor.nombre} gana la elección atípica y es el nuevo ${tipo === 'alcalde' ? 'alcalde' : 'gobernador'} de ${lugar}`, tono: 0, importante: true });
      } else {
        C.Politicos.anotar(sucesor, `Asume como ${tipo} encargado/a tras la vacancia de ${saliente ? saliente.nombre : 'su antecesor'}`);
        C.Medios.noticia(E, { tipo: 'regional', titular: `${sucesor.nombre} asume como ${tipo} encargado/a de ${lugar} tras la vacancia`, tono: 0 });
      }
      return sucesor;
    },
    posesionRegional(E, res) {
      E.elecciones.regionalPendiente = null;
      for (const d of Object.values(E.deptos)) {
        for (const [tipo, clave, datos] of [['gobernador', 'gobernador', res.porDepto[d.id]], ['alcalde', 'alcalde', res.alcaldias[d.id]]]) {
          if (!datos) continue;
          const ant = E.politicos[d[clave]];
          if (ant && ant.id !== 'J') { ant.cargo = { tipo: 'aspirante', aspira: tipo === 'gobernador' ? 'gobernacion' : 'alcaldia' }; C.Politicos.anotar(ant, 'Termina su periodo como ' + tipo); }
          if (d[clave] === 'J') C.Personaje.dejarCargo(E, 'Termina su periodo como ' + tipo);
          d[clave] = datos.ganador;
          if (datos.ganador === 'J') {
            if (E.jugador.camara) C.Gobierno.vacante(E, E.politicos.J);
            C.Personaje.asumirCargo(E, tipo, { depto: d.id });
          } else {
            const p = E.politicos[datos.ganador];
            if (p) { p.cargo = { tipo, depto: d.id }; C.Politicos.anotar(p, 'Se posesiona como ' + tipo + (tipo === 'alcalde' ? ' de ' + d.capital : ' de ' + d.nombre)); }
          }
        }
      }
      C.Medios.noticia(E, { tipo: 'regional', titular: res.porDepto[Object.keys(res.porDepto)[0]].designado ? 'El Gobierno designa a los nuevos gobernadores, que a su vez nombran a los alcaldes' : 'Se posesionan los gobernadores y alcaldes elegidos por voto popular', tono: 0 });
    },

    /* ── Campaña del jugador ───────────────────────────────── */
    factorTope(E) { const v = E.constitucion ? C.Constitucion.valor(E, 'financiacionCampanas') : 'privada'; return v === 'publica' ? 0.75 : v === 'mixta' ? 0.9 : 1; },
    TOPES: { concejo: 250, asamblea: 450, alcaldia: 1500, camara: 900, gobernacion: 4000, senado: 3500, presidencia: 30000 }, // millones COP
    tipoEleccion: cargo => ({ senado: 'congreso', camara: 'congreso', presidencia: 'presidencial', gobernacion: 'regional', alcaldia: 'regional', asamblea: 'regional', concejo: 'regional' }[cargo]),
    CARGOS_CAMPANA: {
      concejo: 'Concejo de la capital', asamblea: 'Asamblea departamental', alcaldia: 'Alcaldía de la capital',
      gobernacion: 'Gobernación', camara: 'Cámara de Representantes', senado: 'Senado de la República', presidencia: 'Presidencia de la República'
    },
    EQUIPO: {
      gerente:        { n: 'Gerente de campaña', costo: 18, desc: '+1 punto de agenda por semana' },
      estratega:      { n: 'Estratega', costo: 22, desc: 'Las actividades rinden un 30 % más' },
      comunicaciones: { n: 'Jefe de comunicaciones', costo: 14, desc: '+reconocimiento semanal' },
      digital:        { n: 'Equipo digital', costo: 10, desc: '+favorabilidad en jóvenes' },
      territorial:    { n: 'Coordinador territorial', costo: 12, desc: '+estructura semanal' },
      encuestador:    { n: 'Firma encuestadora', costo: 16, desc: 'Encuestas propias con margen bajo' }
    },
    inscribir(E, cargo, depto, via) {
      const J = E.jugador, ev = El.proxima(E, El.tipoEleccion(cargo));
      if (!ev) return { ok: false, msg: 'No hay elecciones próximas para ese cargo' };
      let partido = J.partido;
      if (via === 'firmas') partido = 'MOV';
      E.elecciones.campana = {
        cargo, depto: cargo === 'senado' || cargo === 'presidencia' ? null : (depto || J.residencia),
        eleccion: ev.tipo, fecha: ev.fecha.getTime(), anio: ev.anio, partido, via,
        recaudado: 0, gastado: 0, caja: Math.round(Math.min(J.patrimonio * 0.1, 200)), tope: Math.round(El.TOPES[cargo] * El.factorTope(E)),
        equipo: {}, voluntarios: 20 + Math.round(J.redes * 3), estructura: 8 + (J.cargo === 'representante' || J.cargo === 'senador' ? 12 : 0),
        actividades: [], encuestas: [], inicio: E.fecha.t, firmas: via === 'firmas' ? 0 : null
      };
      C.Medios.noticia(E, { tipo: 'campana', titular: `${J.nombre} inscribe su candidatura a ${El.CARGOS_CAMPANA[cargo]}${partido === 'MOV' ? ' por firmas' : via === 'primaria' ? ' tras ganar la consulta interna del ' + E.partidos[partido].sigla : via === 'coalicion' ? ' como candidato único de una coalición de partidos' : ' con aval del ' + E.partidos[partido].sigla}`, tono: 1, jugador: true });
      return { ok: true, msg: 'Candidatura inscrita' };
    },
    turnoCampana(E) {
      const cam = E.elecciones.campana, J = E.jugador;
      let costo = 0;
      for (const k of Object.keys(cam.equipo)) if (cam.equipo[k]) costo += El.EQUIPO[k].costo;
      if (costo > cam.caja) { for (const k of Object.keys(cam.equipo)) cam.equipo[k] = false; C.Medios.noticia(E, { tipo: 'campana', titular: 'Tu campaña se queda sin caja: el equipo renuncia', tono: -1, jugador: true }); }
      else { cam.caja -= costo; cam.gastado += costo; }
      if (cam.equipo.comunicaciones) C.Opinion.subirRec(E, 0.6);
      if (cam.equipo.territorial) cam.estructura = U.clamp(cam.estructura + 1, 0, 100);
      if (cam.equipo.digital) C.Opinion.moverImagen(E, { seg: { jovenes: 0.4, estudiantes: 0.4 } });
      if (cam.firmas != null && cam.firmas < 100) cam.firmas = Math.min(100, cam.firmas + 6 + cam.voluntarios / 60);
      cam.voluntarios = Math.round(cam.voluntarios * 1.01 + cam.estructura * 0.2);
      // Encuesta de seguimiento cada 4 semanas
      if ((E.fecha.t - cam.inicio) % 4 === 0) {
        cam.encuestas.push({ t: E.fecha.t, ...El.proyeccion(E, !cam.equipo.encuestador) });
        if (cam.cargo === 'presidencia') {
          cam.carrera = cam.carrera || [];
          cam.carrera.push({ t: E.fecha.t, candidatos: El.carreraPresidencial(E) });
          if (cam.carrera.length > 30) cam.carrera.shift();
        }
      }
    },
    /* "Carrera de caballos": intención de voto estimada de cada candidato presidencial real de
       la elección en curso, actualizada junto con las encuestas de seguimiento de la campaña. */
    carreraPresidencial(E) {
      const anioEl = U.anio(), fnGana = El.fnGanaAnio(anioEl);
      const cands = El.candidatosPresidencia(E).map(c => ({
        pol: c.pol, partido: c.partido,
        nombre: c.pol === 'J' ? E.jugador.nombre : E.politicos[c.pol].nombre,
        f: El.fuerzaCandidatoPresidencial(E, c, fnGana) * Math.exp(U.gauss(0, 0.15))
      }));
      const tot = U.suma(cands.map(c => c.f)) || 1;
      cands.forEach(c => { c.pct = c.f / tot * 100; delete c.f; });
      cands.sort((a, b) => b.pct - a.pct);
      return cands;
    },
    /* Proyección de la campaña del jugador: intención de voto, probabilidad de ganar */
    proyeccion(E, conRuido = true) {
      const cam = E.elecciones.campana; if (!cam) return null;
      const f = El.fuerzaJugador(E, cam.depto);
      const ruido = conRuido ? U.gauss(0, 3) : U.gauss(0, 1);
      let intencion, prob;
      if (cam.cargo === 'presidencia') {
        intencion = U.clamp(f * 0.45 - 6 + ruido, 0.5, 70);
        prob = U.sig((intencion - 30) / 6);
      } else if (cam.cargo === 'gobernacion' || cam.cargo === 'alcaldia') {
        intencion = U.clamp(f * 0.5 - 4 + ruido, 1, 75);
        prob = U.sig((intencion - 32) / 6);
      } else {
        intencion = U.clamp(f * 0.35 + ruido, 1, 60);
        const exigencia = { senado: 34, camara: 30, asamblea: 26, concejo: 22 }[cam.cargo];
        prob = U.sig((f - exigencia) / 6) * (cam.firmas != null && cam.firmas < 100 ? 0.3 : 1);
      }
      return { intencion, prob: U.clamp(prob, 0.01, 0.99), fuerza: f };
    },
    cerrarCampana(E, res) {
      const J = E.jugador, cam = E.elecciones.campana;
      const r = res.jugador;
      if (!r && res.tipo === 'presidencial') return;
      if (res.tipo === 'presidencial' && res.vuelta === 1 && r && r.pasa) { C.Medios.noticia(E, { tipo: 'elecciones', titular: `${J.nombre} pasa a segunda vuelta`, tono: 1, jugador: true }); return; }
      J.historialElectoral.push({ anio: U.anio(), cargo: cam.cargo, depto: cam.depto, partido: cam.partido, votos: r ? r.votos : 0, electo: !!(r && r.electo), puesto: r ? r.puesto : null, gasto: cam.gastado });
      J.patrimonio -= Math.max(0, cam.gastado - cam.recaudado) * 0.5;
      if (r && r.electo) {
        const mapa = { senado: 'senador', camara: 'representante', presidencia: 'presidente', gobernacion: 'gobernador', alcaldia: 'alcalde', asamblea: 'diputado', concejo: 'concejal' };
        J.cargoElecto = { tipo: mapa[cam.cargo], depto: cam.depto, desde: res.tipo };
        C.Opinion.subirRec(E, 12);
        // Cargos locales se asumen de inmediato en la simulación (posesión nominal)
        if (cam.cargo === 'asamblea' || cam.cargo === 'concejo') C.Personaje.asumirCargo(E, mapa[cam.cargo], { depto: cam.depto });
      } else {
        C.Opinion.subirRec(E, 3);
      }
      E.elecciones.ultimaCampana = Object.assign({}, cam, { resultado: r });
      E.elecciones.campana = null;
    }
  };

  C.Elecciones = El;
  C.Tiempo.registrar('elecciones', El, 70);
})(window.CURUL);
