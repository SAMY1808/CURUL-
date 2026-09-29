# CURUL — Simulador político de Colombia
## Documento de diseño (v0.1 · Fase 1)

> Colombia ficticia, institucionalmente inspirada en la real (Constitución de 1991, Ley 5ª de 1992,
> Estatuto de la Oposición — Ley 1909 de 2018, cifra repartidora, voto preferente).
> Los partidos, políticos y medios son inventados.

---

## A. Arquitectura general

```
┌──────────────────────────── index.html (shell) ─────────────────────────────┐
│  data/*.js      →  CURUL.DATA   (datos estáticos: mapa, deptos, partidos…)   │
│  js/core/*      →  CURUL.U (utilidades, RNG con semilla), CURUL.Bus (eventos)│
│                    CURUL.Estado (esquema + migraciones), CURUL.Tiempo (turno)│
│  js/sistemas/*  →  motor de simulación. Cada sistema es un módulo con:      │
│                    · init(estado)      – crea su parte del mundo             │
│                    · turno(estado)     – avanza una semana                   │
│                    · acciones públicas – lo que el jugador/IA puede hacer    │
│  js/ui/*        →  componentes visuales reutilizables (gráficos SVG,         │
│                    hemiciclo, mapa, tarjetas, modales, tooltip)             │
│  js/pantallas/* →  una pantalla = un módulo  render(contenedor, estado)      │
│  js/app.js      →  router, barra superior, control de tiempo                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

Principios:

1. **Estado único serializable.** Todo el mundo vive en un objeto `estado` plano (sin clases, sin
   funciones, sin referencias circulares: se usan `id`). Guardar = `JSON.stringify(estado)`.
2. **Sistemas desacoplados.** Los sistemas no se llaman entre sí para dibujar; se comunican por el
   `estado` y por el bus (`CURUL.Bus.emit('ley:sancionada', …)`). La UI escucha el bus.
3. **Registro de sistemas.** `CURUL.Tiempo.registrar(sistema, prioridad)`: el orden del turno es
   explícito (economía → opinión → IA política → Congreso → elecciones → eventos → medios).
   Añadir un sistema nuevo (p. ej. diplomacia) no toca los existentes.
4. **Sin compilación, sin servidor.** Scripts clásicos con espacio de nombres `window.CURUL`,
   para que el juego funcione abriendo `index.html` desde el disco, en GitHub Pages o como PWA.
   Los datos están en `.js` (no `.json`) por la misma razón (`fetch` no funciona en `file://`).
5. **Gráficos propios en SVG** (`js/ui/graficos.js`): líneas, barras, donas, hemiciclos,
   pirámides. Sin dependencias externas → funciona sin conexión.
6. **Aleatoriedad reproducible**: RNG con semilla guardada en el estado.
7. **Versión de esquema** (`estado.meta.esquema`) + `CURUL.Estado.migrar()` para mantener
   compatibilidad con partidas antiguas.

## B. Sistemas principales

| Sistema | Archivo | Responsabilidad |
|---|---|---|
| Personaje | `sistemas/personaje.js` | Creación, atributos, reputación, patrimonio, carrera, agenda (puntos de acción) |
| Mundo | `sistemas/mundo.js` | Generación procedural: políticos, gobierno, gobernadores, historia electoral |
| Partidos | `sistemas/partidos.js` | Popularidad, facciones, disciplina, avales, postura (gobierno/independiente/oposición) |
| IA política | `sistemas/politicos.js` | Personalidades, ambiciones, relaciones, decisiones autónomas |
| Elecciones | `sistemas/elecciones.js` | Calendario, modelo de voto, cifra repartidora, umbrales, 2ª vuelta, campaña |
| Congreso | `sistemas/congreso.js` | Senado, Cámara, curules, bancadas, mesas directivas, comisiones, sesiones |
| Legislación | `sistemas/legislacion.js` | Proyectos, trámite por etapas, ponencias, enmiendas, votaciones, “¿qué pasó?” |
| Economía | `sistemas/economia.js` | Indicadores macro, efectos rezagados (inmediato/mediano/largo plazo) |
| Opinión | `sistemas/opinion.js` | Aprobación presidencial, imagen del jugador por región y segmento, encuestas |
| Medios | `sistemas/medios.js` | Ecosistema de medios, noticias, entrevistas, tono |
| Gobierno | `sistemas/gobierno.js` | Presidente IA, gabinete, agenda legislativa, coalición |
| Eventos | `sistemas/eventos.js` | Eventos procedurales con decisiones y consecuencias |
| Guardado | `sistemas/guardado.js` | Ranuras múltiples, autoguardado, exportar/importar |

## C. Estructura de archivos

```
curul/
├── index.html
├── css/        base.css · layout.css · componentes.css · pantallas.css
├── data/       mapa-colombia.js · departamentos.js · partidos.js · instituciones.js
│               nombres.js · plantillas-proyectos.js · eventos.js · medios.js
├── js/
│   ├── core/       util.js · bus.js · estado.js · tiempo.js
│   ├── sistemas/   personaje · mundo · partidos · politicos · elecciones · congreso ·
│   │               legislacion · economia · opinion · medios · gobierno · eventos · guardado
│   ├── ui/         dom.js · graficos.js · hemiciclo.js · mapa.js · componentes.js
│   ├── pantallas/  inicio · creacion · dashboard · mapa · congreso · proyecto · votacion ·
│   │               partidos · campana · noche-electoral · personaje · medios · oposicion · partidas
│   └── app.js
├── assets/
└── docs/DISENO.md
```

## D. Modelo de datos (resumen)

```js
estado = {
  meta:     { esquema, version, semilla, rng, creado, nombrePartida },
  fecha:    { semana, anio, mes, dia, turno },        // 1 turno = 1 semana
  jugador:  { id, nombre, genero, edad, nacimiento, residencia, educacion, profesion,
              ideologia:{eco,soc}, atributos:{carisma,oratoria,gestion,negociacion,integridad},
              reputacion:{honestidad,competencia,liderazgo,experiencia,cercania,transparencia},
              popularidad, reconocimiento, credibilidad, patrimonio, ingresos, gastos,
              familia:[], cargo, partido, trayectoria:[], historialElectoral:[],
              historialLegislativo:[], escandalos:[], reconocimientos:[], agenda:{puntos,max} },
  politicos: { [id]: { id, nombre, genero, edad, depto, partido, ideologia:{eco,soc},
              rasgos:{ambicion,disciplina,pragmatismo,carisma,integridad,experiencia},
              intereses:[sector], relJugador, cargo:{tipo,camara,circ,comision,rol},
              stats:{asistencia,proyectos,aprobados,votos}, ambicionCargo, historial:[] } },
  partidos: { [id]: { id, nombre, sigla, color, ideologia, popularidad, postura, cohesion,
              facciones:[{id,nombre,peso,ideologia,lider,relJugador}], lider, finanzas,
              militantes, fuerzaRegional:{[depto]:factor} } },
  deptos:   { [id]: { id, nombre, capital, poblacion, electores, pib, pobreza, desempleo,
              educacion, salud, seguridad, infraestructura, inclinacion, gobernador,
              alcalde, aprobacionPres, curulesCamara } },
  congreso: { senado:{curules:[{id,politico,circ}], mesa:{}, comisiones:{}},
              camara:{…}, legislatura:{numero,periodo,enSesion} },
  proyectos: { [id]: { id, titulo, sector, tipo, autor, origen, etapa, etapas:[],
              ideologia, costoFiscal, efectos:[], popularidad, apoyos, opositores,
              enmiendas:[], historial:[], votaciones:[], vence } },
  votaciones: [ { id, proyecto, camara, instancia, fecha, votos:{[pol]:'si'|'no'|'abs'|'aus'},
              factores:{[pol]:{…}}, resultado } ],
  gobierno: { presidente, vice, partido, coalicion:[partido], gabinete:{[min]:pol},
              aprobacion, agenda:[proyecto] },
  economia: { pib, crecimiento, inflacion, desempleo, pobreza, deuda, deficit, tasa, …,
              efectosPendientes:[{turno,var,delta}] },
  opinion:  { historial:{aprobacionPres:[], jugador:[]}, segmentos:{…} },
  elecciones: { calendario:[], campana:null|{…}, historico:[] },
  medios:   { lista:[], noticias:[] },
  eventos:  { activos:[], historial:[] },
  series:   { [indicador]: [[turno, valor]] }       // alimenta todos los gráficos
}
```

## E. Flujo de una partida

```
Nueva partida → Crear personaje (origen, región, formación, ideología, cargo inicial)
      → Generación del mundo (semilla): 11 partidos, ~330 políticos, Congreso elegido en 2026
        con el modelo electoral real, presidente y coalición, gobernadores, medios, economía
      → Centro de mando (dashboard)
      ┌─ Turno (semana) ───────────────────────────────────────────────┐
      │ El jugador gasta PUNTOS DE AGENDA en acciones (proyectos,      │
      │ cabildeo, control político, medios, recorridos, campaña…)      │
      │ ► Avanzar: economía → opinión → IA política → Congreso         │
      │   (comisiones y plenarias votan) → gobierno → elecciones →     │
      │   eventos (decisiones) → medios (noticias) → series/guardado   │
      └────────────────────────────────────────────────────────────────┘
      → Elecciones periódicas (Congreso+Presidencia cada 4 años en marzo/mayo,
        regionales en octubre) → Noche electoral → nuevos cargos → …
```

## F. Sistema electoral

- **Calendario real**: Congreso (2º domingo de marzo), Presidencia (1ª vuelta mayo, 2ª junio),
  instalación del Congreso 20 de julio, posesión presidencial 7 de agosto, regionales en octubre.
- **Modelo de voto**: cada departamento tiene una inclinación ideológica y un peso de cada partido
  (`fuerzaRegional`). Votos de un partido en un depto = electores × participación × cuota,
  donde la cuota combina: base regional × popularidad nacional × afinidad ideológica ×
  maquinaria (gobernador/alcaldes del partido) × ruido.
- **Senado**: circunscripción nacional de 100 curules, **umbral 3 %**, **cifra repartidora
  (D'Hondt)**; + 2 indígenas, + 5 Comunes (Acuerdo de Paz, hasta 2026 en la realidad; aquí
  configurable), + 1 para el 2º en la presidencial (Estatuto de Oposición) = 108.
- **Cámara**: circunscripciones departamentales (161 curules, umbral 50 % del cociente, o 30 % en
  circunscripciones de ≤2 curules) + especiales (afro 2, indígena 1, raizal 1, exterior 1),
  CITREP 16, Comunes 5, fórmula vicepresidencial perdedora 1 = 188.
- **Voto preferente**: dentro de cada lista, las curules se asignan por votos personales. El
  jugador compite contra sus propios compañeros de lista.
- **Presidencia**: dos vueltas (50 %+1), mapa por departamento.
- **Campaña**: aval (partido o firmas), equipo, recaudo con **tope de gastos**, publicidad,
  eventos, recorridos, debates, encuestas; métricas visibles: reconocimiento, favorabilidad,
  intención de voto por departamento, estructura territorial, voluntarios.
- **Noche electoral**: boletines de la Registraduría (mesas informadas 0→100 %), mapa que se
  colorea, barras, curules en hemiciclo, participación y comparación con la elección anterior.

## G. Sistema parlamentario

- **Curules visibles**: hemiciclo SVG (Senado en semicírculo clásico; Cámara en herradura con
  vista alternativa de **mapa de circunscripciones**). Cada curul es un objeto con político.
- **Mesas directivas** anuales (20 de julio), **7 comisiones constitucionales permanentes**
  (1ª Constitucional … 7ª Salud y Trabajo), con presidente y vicepresidente.
- **Bancadas** con vocero, disciplina y postura (gobierno / independiente / oposición, según
  la declaración del Estatuto de Oposición).
- **Trámite** (ley ordinaria, 4 debates; acto legislativo, 8 debates en dos vueltas):
  Radicación → Comisión (ponencia, 1er debate) → Plenaria (2º) → otra cámara: Comisión (3º) →
  Plenaria (4º) → Conciliación → Presidencia (sanción u objeción). Un proyecto que no concluye en
  dos legislaturas se **archiva** (art. 162).
- **Votación**: cada congresista calcula una utilidad con factores trazables (ideología,
  disciplina de bancada, gobierno/oposición, relación con el autor/jugador, presión regional,
  opinión pública, cercanía de elecciones, negociaciones). El resultado se guarda con sus
  factores → pantalla **“¿Qué pasó?”** con quién cambió de posición respecto al conteo previo y por qué.
- **Distancia de mayoría**: votos a favor proyectados vs. mayoría requerida (simple, absoluta
  o calificada según el tipo de proyecto).
- **Acciones del congresista**: radicar, adherir, pedir ponencia, enmendar, cabildear
  (congresista, bancada, facción), citar a debate de control político, intervenir, votar.

## H. Sistema de partidos

- 11 partidos ficticios con ideología (económica y social), color, sigla, dirección y facciones
  (moderados, progresistas, conservadores, tecnócratas, regionalistas…).
- Popularidad nacional dinámica, fuerza regional, cohesión (→ disciplina de bancada),
  finanzas, militancia, postura frente al gobierno.
- **Mapa interno del partido**: facciones como burbujas proporcionales a su peso, posición
  ideológica y relación con el jugador. El aval depende de la facción dominante.
- Transfuguismo sólo en ventana preelectoral (prohibición de doble militancia).

## I. Sistema económico (base en F1, profundidad en F2)

Variables: PIB, crecimiento, inflación, desempleo, pobreza, deuda/PIB, déficit, recaudo, gasto,
inversión, exportaciones, importaciones, tasa de interés. Cada ley sancionada o decisión encola
**efectos rezagados** (`{enTurnos, variable, delta}`) en tres horizontes: inmediato (0-4
semanas), mediano (6-12 meses), largo (2-4 años). Un gasto no financiado sube el déficit →
deuda → tasa → crecimiento. Choques exógenos vía eventos.

## J. Sistema de gobierno

Presidente IA (o jugador en F2) con coalición, gabinete de 19 ministerios con ministros que
tienen partido, ideología y ambición; agenda legislativa (proyectos del gobierno con mensaje de
urgencia), relación con bancadas, aprobación mensual. Crisis ministeriales, remociones y
reorganización de prioridades presupuestales (F2).

## K. Sistema de eventos

Plantillas con condiciones (`requiere`), peso, alcance (nacional / regional / jugador),
opciones con consecuencias diferidas y texto variable. Tipos: económico, desastre, orden público,
escándalo (del gobierno o de otros; al jugador sólo ocasionalmente), éxito deportivo,
diplomático, movilización social, interna partidista, reconocimientos. Los eventos del mundo
ocurren sin el jugador; los que lo afectan abren un modal de decisión.

## L. Diseño de interfaz

Estética “sala de situación”: fondo azul noche, papel oficial marfil para expedientes,
acentos tricolor discretos. Barra superior con fecha, cargo, puntos de agenda y controles de
tiempo (▶ 1 semana, ▶▶ 4 semanas). Navegación lateral por iconos. Tarjetas con KPIs y
mini-gráficos, hemiciclos interactivos con tooltip, mapa por capas, modales de votación
animados, ticker de noticias. Adaptado a móvil (navegación inferior).

## M. Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| **1** | Personaje, mapa, elecciones (Congreso + Presidencia + noche electoral), partidos, Congreso visual (Senado, Cámara, curules, comisiones), proyectos y votaciones con “¿qué pasó?”, dashboard, guardado múltiple | **completa** |
| **2** | Ministerios con presupuesto propio y programas, **Presupuesto General de la Nación** por sectores (el jugador-presidente lo formula y ajusta; si no aprueba a tiempo, rige el del Gobierno por defecto constitucional), crisis por subfinanciación, Consejo de Ministros, gabinete, coaliciones con estabilidad, Centro de Oposición, economía con efectos rezagados, opinión segmentada, medios con entrevistas | **completa** |
| **3** | Fecha de inicio libre (1900-2026) con bipartidismo pre-1991 y Frente Nacional; gobierno local del jugador (gabinete, presupuesto y decretos como gobernador o alcalde); ley para crear nuevos ministerios; Asambleas Departamentales y Concejos Municipales con miembros elegidos y voto nominal real; capa de los 1122 municipios reales en el mapa | **completa** |
| **4** | Peso interno de partido (nacional y departamental) que decide cómo arma listas la dirección; consultas internas (primarias) para disputar cabeza de lista o candidatura única, con su propia noche de resultados; diputados y concejales con curul propia y ordenanzas/acuerdos; noche electoral candidato a candidato en Senado, Cámara, Asamblea y Concejo | **completa** |
| **5** | Disputar la dirección nacional del partido (congreso interno real); presionar por un ministerio como director de un partido de la coalición de gobierno (cuota burocrática); mesa de trabajo del ministerio | **completa** |
| **6** | Hijos con vida propia (educación, relación, potencial político); retiro o fallecimiento del jugador con sucesión (heredar la carrera en un hijo adulto) o fin de partida con resumen; propiedades que rentan y suben o bajan de valor; riesgo de escándalo por patrimonio no explicado | **completa** |
| **7** | Gabinete local con secretarios nombrados a dedo, programas de política pública y Consejo de gobierno; fundar un partido nuevo (firmas y costo); coaliciones preelectorales que negocian puestos, con consulta interpartidista para Presidencia, Congreso, Gobernación y Alcaldía | **completa** |
| **8** | Reelección presidencial histórica; encuestas de aprobación por tema; corrupción (financiación irregular de campañas y mermelada parlamentaria); sistema judicial con investigaciones que pueden costar la investidura o terminar la carrera; orden público con grupos armados, ofensivas y mesas de paz; diplomacia con países ficticios, cumbres y tratados | **completa (esta entrega)** |
| **9** | Diplomacia con los 193 países reales (192 miembros de la ONU distintos de Colombia, más Kosovo) en vez de países ficticios, y organismos multilaterales reales (los que Colombia integra y los que no) | **completa** |
| **10** | Constitución reformable por referendo o Asamblea Constituyente; federalización gradual e irreversible por transferencia de competencias; protocolo de paz con agenda de puntos, verificación e implementación post-acuerdo con riesgo de disidencias | **completa** |
| **11** | Balance del orden público; listas conjuntas reales para coaliciones en el Congreso; redes sociales como canal propio; encuestas de campaña presidencial en tiempo real ("carrera de caballos"); políticos NPC con ambición, rivalidades y escándalos propios; partidos que nacen y mueren orgánicamente | **completa** |
| **12** | Progresión de carrera real para NPC ambiciosos (la ambición anunciada en la Fase 11 ahora decide de verdad candidaturas al Senado, Cámara, gobernaciones y alcaldías); dinastías políticas NPC (un hijo puede heredar el arrastre electoral de un político notable al retirarse); Salón de la Fama / Archivo Histórico (expresidentes, políticos más destacados, dinastías y el historial de partidos fundados y disueltos) | **completa** |
| **13** | Gabinete 2.0: cada ministro gestiona su cartera con iniciativas propias, gestión que sube o baja con sus aciertos, crisis personales y ambición presidencial propia; pestaña Consejo de Ministros; comparación histórica de gobiernos (aprobación promedio, leyes, mejor ministro) en el Salón de la Fama; Centro de Gobierno reorganizado alrededor de una bandeja de pendientes del día | **completa** |
| **14** | Elección real de la mesa directiva del Senado y la Cámara cuando el jugador pertenece a esa cámara: pedir el aval del partido o postularse de forma autónoma, compitiendo contra rivales reales en una lotería ponderada; presidir una cámara suma peso interno de partido | **completa** |
| **15** | La misma elección real de mesa directiva (aval o autónoma) extendida a la Asamblea Departamental y el Concejo Municipal del jugador, con peso interno departamental en vez de nacional | **completa** |
| **16** | Poder real de la mesa directiva sobre el orden del día: adelantar o aplazar cualquier proyecto en trámite en la cámara que se preside; presidir la cámara donde tramita un proyecto del Gobierno da una prima al negociar cambios con su propia bancada | **completa** |
| **17** | Movilización social: cinco actores sociales permanentes (CUT, gremios, movimiento estudiantil, indígena y agrario) con descontento propio ligado a indicadores reales del país; si nadie los atiende convocan un paro con un pliego concreto, resuelto dialogando, cediendo por completo o dispersándolo por la fuerza (con riesgo judicial real si se va la mano) | **completa** |
| **18** | Gabinete local 2.0 (secretarías con gestión, iniciativas y crisis propias, como los ministros de la Fase 13); regalías del Gobierno Nacional con tensión centro-región; obra bandera (megaproyecto con riesgo de sobrecostos si se acelera); paro cívico local ligado a la gestión propia; rendición de cuentas periódica | **completa** |
| **19** | Padrinazgo político: usar el peso interno de partido para apadrinar a copartidarios más pequeños, que se vuelven protegidos con una lealtad propia; pedirles luego un cupo real (una plaza que sólo alguien con cargo o la dirección del partido puede repartir) para un copartidario sin puesto o para un hijo adulto, con riesgo de que se cuestione por nepotismo | **completa** |
| **20** | Comercio exterior sofisticado: flujos por sector y socio, aranceles, dólar, balanza y recaudo; negociación de TLC capítulo por capítulo con ratificación en el Congreso y control de la Corte; Mercosur como unión aduanera real (adhesión por consenso, Arancel Externo Común, choque con TLC previos, cumbres y presidencia pro tempore); y, si diriges tu partido, armar las listas al Congreso y otorgar o negar avales para cualquier cargo | **completa (esta entrega)** |

### Notas de la Fase 18

- **Gabinete local 2.0** (`js/sistemas/gobiernolocal.js`): exactamente el mismo mecanismo del
  Gabinete nacional (Fase 13), aplicado a cada secretario. Reutiliza el catálogo `PROGRAMAS` que ya
  existía (Fase 3c) como fuente de iniciativas en vez de inventar uno nuevo: el secretario propone
  una, el gobernador/alcalde la respalda (`aceptarIniciativaLocal`) o la rechaza
  (`rechazarIniciativaLocal`), y el resultado depende de su `gestion` (mismo campo y misma fórmula
  que los ministros). Un fracaso puede detonar una crisis propia (`crisisSecretario`), resuelta con
  `respaldarSecretarioCrisis` o `destituirSecretarioCrisis`. Los ids de acción son distintos a los
  nacionales (`...Local` en vez de `...Ministro`) para no pisar el registro de `C.Acciones`, que
  sobrescribe silenciosamente por id — la misma lección de la Fase 15.
- **Regalías y tensión centro-región** (`GL.pedirRegalias`): la probabilidad de que el Gobierno
  Nacional gire recursos adicionales depende de si el partido del jugador está en la coalición de
  gobierno (+35 puntos) o en la oposición (−15) — la misma tensión real que ya existía para pedir un
  ministerio (Fase 5) o buscar el aval de la mesa directiva (Fase 14), llevada a la relación
  fiscal entre el centro y la región. El fondo resultante (`g.fondoRegalias`) sólo se usa como
  bonus de probabilidad al resolver la obra bandera, no como dinero libre para gastar en cualquier
  cosa.
- **Obra bandera** (`GL.iniciarObraBandera`/`resolverObra`): un megaproyecto concreto y nombrado
  (metro, aeropuerto, hospital de tercer nivel, terminal, megacolegio, etc. — catálogo
  `OBRAS_BANDERA`), uno a la vez, de 16 a 24 semanas. Cada obra queda ligada a una secretaría (para
  el indicador que mueve y el secretario cuya gestión influye en el éxito) y algunas se filtran por
  población (`GL.obrasDisponibles`, ej. el metro sólo aparece en alcaldías de ciudades grandes).
  Puede acelerarse (`acelerarObra`, -5 semanas) a cambio de una penalización real a la probabilidad
  de éxito y, si falla estando acelerada, una probabilidad de escándalo por sobrecostos que suma
  `riesgoJudicial` (mismo campo del sistema judicial de la Fase 8). Un éxito da un salto grande al
  indicador del sector (mucho mayor que un programa normal de secretaría) y sube el reconocimiento
  del jugador de forma notoria.
- **Paro cívico local** (`GL.turnoCivico`/`iniciarParoCivico`): un actor social propio del
  departamento o municipio del jugador, distinto de los cinco actores nacionales de la Fase 17 — su
  señal de descontento no depende de indicadores nacionales sino de qué tan por debajo del promedio
  del país está la propia gestión local (indicadores del departamento y secretarías subfinanciadas).
  Mismo protocolo de tres caminos que el paro nacional (dialogar, atender el pliego, reprimir), con
  las mismas consecuencias de riesgo judicial si la represión se va de las manos.
- **Rendición de cuentas** (`GL.turnoRendicion`): cada 26 semanas, un balance automático de la
  gestión acumulada (promedio de indicadores del departamento, gestión promedio de las secretarías,
  obras bandera entregadas con éxito) mueve la imagen local del jugador hacia arriba o hacia abajo
  — le da a la partida un ritmo de evaluación periódica en vez de una acción continua sin
  puntuación intermedia.

### Corrección posterior a la Fase 18: pantalla en blanco por partidas guardadas antes de esta fase

Un jugador reportó `TypeError: Cannot read properties of undefined (reading 'descontento')` al
abrir la pantalla de Gobierno local. La causa: `GL.asegurar(E, depto, organo)` sólo rellenaba los
campos nuevos de esta fase (`fondoRegalias`, `obraBandera`, `civico`, `ultimaRendicion`) cuando
**creaba** el gabinete local desde cero; si ya existía (una partida guardada antes de la Fase 18,
donde `d.gobLocal[organo]` ya estaba en el archivo de guardado sin esos campos), el `if
(d.gobLocal[organo]) return d.gobLocal[organo];` de la primera línea lo devolvía tal cual, sin
completarlo — y la pantalla intentaba leer `g.civico.descontento` de un `civico` que no existía.
Corregido rellenando los campos que falten también en ese camino de retorno temprano, con los
mismos valores por defecto que usa la creación desde cero. Es la misma clase de descuido que ya
había pasado antes con partidas guardadas de fases anteriores (ver el patrón `asegurarDatos` de
`Familia`, Fase 6): cualquier sistema que agregue campos a un objeto que ya podía existir en
partidas viejas necesita rellenarlos también al recuperarlo, no sólo al crearlo.

### Mejora posterior a la Fase 18: obras bandera con nombre propio

La primera versión de la obra bandera sólo dejaba elegir "en qué secretaría" (ej. "Secretaría de
Educación"), sin decir qué se construía — un jugador esperaba ver proyectos concretos como
aeropuerto, metro, hospital o terminal, al estilo de *The Political Process*. Se agregó el catálogo
`OBRAS_BANDERA` con megaproyectos nombrados e iconografía propia (metro, aeropuerto, terminal,
malla vial, hospital, red de salud rural, megacolegio, universidad, ciudadela de seguridad, parque
metropolitano, centro de convenciones), cada uno ligado a la secretaría que ya determinaba el
indicador afectado y el secretario responsable, y filtrado por población con
`GL.obrasDisponibles` (el metro, por ejemplo, sólo aparece en alcaldías de ciudades grandes). Las
obras en curso o ya guardadas con la forma anterior (sólo `sector`, sin `obraId`) se siguen
mostrando correctamente gracias a `GL.nombreObra`, que si no encuentra el `obraId` cae de vuelta a
buscar por `sector`.

### Notas de la Fase 20

- **Comercio exterior** (`data/comercio.js`, `js/sistemas/comercio.js`): siete sectores (café, petróleo y
  minería, flores y agroexportación, agro sensible, industria, confecciones, servicios) y trece socios
  (Estados Unidos, China, Unión Europea, los cuatro del Mercosur, México, Chile, Perú, Ecuador,
  Venezuela y "resto del mundo") con afinidades sectoriales propias. Todo cambio se mide **contra la
  partida base** (`E.comercio.base`, una foto de las tarifas al empezar): un multiplicador de 1 significa
  que nada cambió, así una partida arranca neutra sin importar cuántos acuerdos históricos traiga.
  Las tarifas efectivas salen del arancel general, las recargas de salvaguardia y la desgravación
  gradual de cada acuerdo (`Comercio.reduccion`); el volumen reacciona con la elasticidad de cada
  sector. Los totales macro (`E.economia.exportaciones`, `E.comercio.impTot`) sólo reciben el *cambio*
  que producen las políticas (método del delta), para no pisar la dinámica que ya tenía la economía.
  Además: precio de la energía y dólar (que reacciona a la balanza, la inflación, el déficit y la
  confianza), recaudo por aranceles, y una *tensión* por sector que compite con importaciones que
  alimenta el ánimo del campo, la CUT y los gremios (Movilización) y el desempleo.
- **Acuerdos históricos**: una partida arranca con los acuerdos reales que ya existían ese año (CAN,
  México, Chile, ACE 59 con el Mercosur, Canadá/EFTA/Corea, Estados Unidos, Unión Europea).
  `Diplomacia` ya no suma crecimiento por firmar un "TLC" genérico: esos tratados viejos se traducen a
  acuerdos comerciales moderados en `Comercio.migrarTratadosViejos`.
- **TLC** (`js/sistemas/tlc.js`): seis capítulos (industria, agro, servicios, propiedad intelectual,
  laboral/ambiental, origen y solución de controversias). Cada uno se negocia con una postura
  defensiva, moderada o ambiciosa frente a lo que espera el socio (`demandasTLC`); la probabilidad de
  cerrarlo suma la relación bilateral, tu capacidad de negociación y qué tanto igualas la demanda
  del socio. Cada concesión tiene su costo político inmediato (`COSTO`). Cerrado el último capítulo se
  firma y se radica en el Senado como proyecto real (plantilla `ratificaciontratado`, `interno` para
  que no salga en el menú de radicar), con un `eco` que depende de cuánto se abrió: la izquierda tiende
  a oponerse. Al aprobarse pasa a control de la Corte, con riesgo que sube por arbitraje inversionista-
  Estado ambicioso, propiedad intelectual ambiciosa o laboral defensiva y baja con la consulta previa.
  Al entrar en vigor se crea el acuerdo con el cronograma de desgravación que salió de la negociación.
- **Mercosur** (`js/sistemas/mercosur.js`): estados ninguno / asociado / adhesión / miembro / retirado
  según la época (existe desde 1991, unión aduanera desde 1995, Colombia asociada desde 2004). La
  adhesión exige **consenso**: cada miembro vota según su relación con Colombia, su dureza y el
  paquete ofrecido (años de convergencia, normativa completa, aporte al FOCEM, hasta dos excepciones);
  luego protocolo, Senado, Corte y ratificación de los parlamentos del bloque. Miembro: converge al
  Arancel Externo Común (`turnoConvergencia`), abre el comercio con los cuatro socios, pierde la
  libertad de fijar aranceles (`puedeFijarArancel`) y de negociar TLC solo (`bloqueaTLC`, con
  autorización del bloque), y **sus TLC anteriores chocan con las reglas** (`conflictos`): excepción
  del bloque o denuncia al vencer el plazo, con trato más fácil para los socios andinos. Cada semestre hay
  cumbre con presidencia pro tempore rotativa y decisiones (rebajar o subir el AEC, cerrar el acuerdo con
  la UE, más excepciones, flexibilizar el bloque) que el Presidente puede respaldar o vetar; si no se
  pronuncia, se decide con una probabilidad base afectada por la dificultad de cada punto.
- **Director del partido** (`js/sistemas/directorpartido.js`): sólo si `pa.lider === 'J'`. *Listas*:
  `Elecciones.formarLista` respeta a quien inscribió y a quien vetó, y `multLista` sube o baja los
  votos de la lista completa según la fuerza de los inscritos; se puede fichar a un líder regional, una
  figura mediática o un técnico pagando con las finanzas del partido. Vetar a un congresista ambicioso
  puede llevarlo a otro partido. *Avales*: `avalUni` fija a quién presenta el partido a la Presidencia,
  cada gobernación y cada alcaldía (`candidatosPresidencia` y `regional` lo consultan); negar el aval a un
  aspirante ambicioso puede volverlo disidente que corre como `IND` y le quita votos al oficial.
  `probAval` para el propio jugador pasa a 97 % cuando dirige el partido.
- **Migración y errores de partidas anteriores**: `Comercio.migrar` (vía `Estado.migrar`) crea todo el
  comercio en partidas guardadas antes de esta fase, con los acuerdos que existían en su fecha actual.
  Al probarlo aparecieron dos fallos que ya estaban: `Politicos.anuncioAmbicion` fallaba con el escalón
  hacia la presidencia (`'presidencia'` no es una clave de `DATA.cargos`, es `'presidente'`) y
  `Politicos.transfuguismo` fallaba si el congresista pertenecía a un partido inexistente; ambos
  abortaban el turno de políticos ese día.

### Notas de la Fase 19

- **Padrinazgo** (`js/sistemas/padrinazgo.js`, nuevo): no crea una moneda nueva de "capital
  político" — reutiliza el peso interno de partido que ya existía desde la Fase 4
  (`C.Partidos.peso`) como la vara con la que se decide a quién puede apadrinar el jugador: sólo a
  copartidarios activos con un margen claro de menos peso (`MARGEN_PESO`). Apadrinar sube el
  `fuerza` del político (el mismo campo que ya deciden las listas y las noches electorales) y crea
  o refuerza la entrada en `E.jugador.protegidos[id]`, con su propia `relJ` (lealtad hacia el
  jugador, independiente de la `relJ` del político hacia el jugador que ya existía).
- **Cupos** (`Pad.pedirCupo`): sólo se le puede pedir un cupo a un
  protegido que reparte algo real — ejerce un cargo que no sea de aspirante o dirige el partido
  (`Pad.puedeRepartir`) —, con una lealtad mínima y un enfriamiento entre peticiones, igual que las
  regalías locales de la Fase 18. El beneficiario puede ser un copartidario sin puesto propio (gana
  `fuerza` y relación con el jugador, el mismo lenguaje que ya usan el transfuguismo y los anuncios
  de ambición de la Fase 11) o un hijo adulto del jugador (gana relación y algo de patrimonio para
  la familia, con una probabilidad menor de que se cuestione por nepotismo — el mismo campo
  `riesgoJudicial` del sistema judicial de la Fase 8). Antes de tocar a un hijo hay que llamar
  `C.Familia.asegurarDatos(E)`: un hijo recién creado no tiene `atributos` hasta que ese método lo
  rellena, la misma clase de descuido que ya se documentó para el Gobierno local de la Fase 18.
- **Interfaz** (`js/pantallas/partidos.js`): la tarjeta de Padrinazgo sólo se muestra viendo la
  ficha del propio partido del jugador (no la de un partido cualquiera), con dos columnas — a quién
  apadrinar y la lista de protegidos con su lealtad y el selector de a quién beneficiar con un cupo
  (hijos adultos y copartidarios sin puesto, agrupados en el mismo `<select>`). El botón "Pedir
  cupo" valida en `disponible()` sólo el protegido (llega fijo desde `UI.botonAccion`), nunca el
  destino elegido en el `<select>` — la regla de esta sesión desde la primera corrección de esta
  fase (Fase 18a): un valor que sólo existe en un `<select>` hermano debe validarse en `ejecutar()`,
  no en `disponible()`, o el botón queda deshabilitado sin importar qué se seleccione después.

### Corrección posterior a la Fase 19: pantalla en blanco en Gobierno con partidas de antes de la Fase 17

Un jugador con una partida muy antigua (empezada en 2010, antes de que existiera la Movilización
social de la Fase 17) reportó `TypeError: Cannot read properties of undefined (reading 'actores')`
al abrir "Gobierno y oposición". La causa no estaba en el Padrinazgo de esta entrega, sino en un
descuido de la Fase 17 que nadie había disparado hasta ahora: `Movilizacion.init(E)` sólo se llama
al **generar una partida nueva** (`Mundo.generar`), nunca al cargar una ya existente — a diferencia
de Orden Público, Diplomacia, Constitución o Redes, que sí tienen su línea correspondiente en
`C.Estado.migrar(E)` (`js/core/estado.js`) para rellenarse en partidas guardadas antes de que esos
sistemas existieran. Cualquier partida guardada antes de la Fase 17 se queda sin `E.movilizacion`
por completo, y la pantalla de Gobierno lo asume siempre presente. Corregido agregando la misma
línea de migración que ya tienen los demás sistemas: `if (!E.movilizacion || !E.movilizacion.actores)
Movilizacion.init(E)`. Verificado con Playwright borrando `E.movilizacion` de una partida en
memoria, migrando y confirmando que la pantalla de Gobierno renderiza sin error. Queda como
recordatorio para toda fase futura que agregue un `E.<sistema>` nuevo: además de inicializarlo en
`Mundo.generar`, hay que darle su línea en `C.Estado.migrar`, o cualquier partida guardada antes de
esa fase quedará rota en cuanto la pantalla correspondiente intente leerlo.

### Corrección posterior a la Fase 19: gobernación/alcaldía que se queda "congelada" tras perder la investidura

Un jugador reportó que, tras ganar una gobernación, el mapa lo seguía mostrando como gobernador de
Caldas para siempre — pero su chip de cargo decía "Empresario" y la pestaña de Gobernación había
desaparecido. La partida mostraba en el ticker que había perdido la investidura por una condena
judicial poco después de posesionarse. La causa: `Judicial.resolver` (Fase 8d), al condenar al
jugador, llama a `C.Personaje.dejarCargo`, que sólo actualiza los campos del propio jugador
(`J.cargo`, `J.cargoInfo`…) — nunca toca `E.deptos[depto].gobernador` o `.alcalde`, que es donde el
mapa y el resto del juego leen quién ejerce ese cargo. Para un congresista sí existía este cuidado
(`Gobierno.vacante` reasigna la curul a un sucesor antes de `dejarCargo`), pero nunca se replicó
para gobernaciones y alcaldías porque hasta ahora nadie había perdido la investidura ejerciendo uno
de esos dos cargos. Se agregó `Elecciones.vacanteRegional(E, depto, tipo)` — el mismo patrón que
`Gobierno.vacante`, pero para el departamento o municipio: crea un sucesor interino del mismo
partido y lo deja en `E.deptos[depto][tipo]` — y `Judicial.resolver` ahora la llama (guardando el
cargo y el departamento del jugador *antes* de `dejarCargo`, que ya los borra) cuando la investidura
perdida era de gobernador o alcalde. Verificado con Playwright forzando una condena repetidas veces
hasta caer en la rama de pérdida de investidura: el departamento queda con un sucesor real (no con
el id del jugador) y ni el mapa ni la barra de navegación quedan inconsistentes.

### Notas de la Fase 17

- **Actores sociales permanentes** (`js/sistemas/movilizacion.js`, nuevo): cinco actores fijos —
  Central de Trabajadores (CUT, sector empleo), Gremios Empresariales (ANDI, comercio), Movimiento
  Estudiantil (MOES, educación), Movimiento Indígena (ONIC, paz/territorio) y Movimiento Agrario
  (FENSA, agricultura)—, cada uno con un líder propio (un político NPC creado al iniciar la
  partida), un `descontento` (0-100) y una `relJ` con el jugador. El descontento no es aleatorio:
  sube o baja cada semana según una señal ligada al sector real de cada actor (el desempleo para la
  CUT, el déficit fiscal para los gremios, el promedio de educación departamental para el
  estudiantil, una negociación de paz estancada más de 40 semanas para el indígena, la pobreza para
  el agrario), con una decadencia natural hacia la calma si nadie lo empeora.
- **Paros con pliego concreto**: cuando el descontento de un actor supera 72, hay una probabilidad
  semanal pequeña y creciente de que convoque un paro nacional con un pliego de peticiones propio
  (`Movilizacion.PLIEGOS`, ligado a la causa del actor, no genérico). Mientras el paro sigue sin
  resolverse, escala (`intensidad` sube hasta 4×) y erosiona la seguridad de los departamentos más
  poblados y la aprobación presidencial cada semana — la inacción tiene un costo real y creciente.
- **Tres caminos para el presidente** (`js/sistemas/movilizacion.js`, acciones): **dialogar**
  (`dialogarMovimiento`, probabilidad de éxito según la negociación del jugador y la relación con el
  actor — éxito reduce mucho el descontento y sube la relación; fracaso deja el paro activo),
  **atender el pliego por completo** (`atenderPliegoMovimiento`, siempre funciona, sube mucho la
  relación y el reconocimiento, pero tiene un costo fiscal real —sube el déficit— y baja la
  aprobación en el tema económico), o **dispersar por la fuerza** (`reprimirMovimiento`, siempre
  termina el paro, pero con una probabilidad de que se vuelva un "caso grave" —mayor cuanto más
  intensa esté la protesta— que suma `riesgoJudicial` real (el mismo campo que ya usa
  `js/sistemas/judicial.js` desde la Fase 8) y golpea fuerte la aprobación presidencial). No hay una
  opción gratis: cada camino cede algo distinto.
- **Nueva pestaña Movilización social** (`js/pantallas/gobierno.js`): una tarjeta por actor con su
  descontento, causa y relación, y —si hay un paro activo— los tres botones de respuesta. Un paro
  activo también aparece en la bandeja "Pendientes de hoy" del Centro de Gobierno (Fase 13d), con
  enlace directo a la pestaña.
- **Alcance de esta entrega**: por ahora sólo el presidente puede responder a un paro (no
  gobernadores/alcaldes); y un movimiento muy desatendido no funda un partido propio ni un líder se
  lanza a la política todavía, aunque el patrón ya existe (`Partidos.fundacionNPC`, Fase 11e) y sería
  una extensión natural si se quiere profundizar más adelante.

### Notas de la Fase 16

- **Poder de agenda de la mesa directiva** (`js/sistemas/legislacion.js`, `L.adelantar`/`L.aplazar`):
  antes, ser presidente del Senado o la Cámara (Fase 14) o de una Asamblea/Concejo (Fase 15) era un
  título con peso interno pero sin ninguna palanca legislativa real. Ahora, sobre cualquier proyecto
  en trámite en la cámara que se preside —no sólo los propios—, el jugador puede **adelantarlo**
  (`adelantarProyectoMesa`: pone `p.esperaHasta = E.fecha.t`, listo para entrar al orden del día la
  próxima semana) o **aplazarlo** (`aplazarProyectoMesa`: empuja `p.esperaHasta` tres semanas hacia
  adelante). Ambas manipulan directamente el mismo campo que ya usaba `calcularOrdenDelDia` (la cola
  real de proyectos listos para votarse, `p.sub === 'agenda'`), así que no es un sistema paralelo:
  es el mismo motor de agenda que existía desde antes, con una palanca nueva encima. La disponibilidad
  se valida con el nuevo `Congreso.esMesaDe(E, cam)`, que sólo es cierto si `E.congreso[cam].mesa.
  presidente === 'J'`.
- **Palanca de negociación con el Ejecutivo** (`negociarBancada`): cuando el proyecto es del Gobierno
  (`p.gobierno`) y el jugador preside la cámara donde tramita, negociar con una bancada suma +15
  puntos de probabilidad de éxito — presidir la cámara donde el Gobierno necesita que su propio
  proyecto avance es una posición real de fuerza para pedirle cambios a cambio del apoyo. Es un
  ajuste de una línea sobre la fórmula de probabilidad ya existente, no una mecánica nueva de
  negociación: se mantiene todo lo demás (afinidad ideológica, relación con la bancada, negociación
  del jugador) exactamente igual.
- Este poder aplica igual sobre proyectos de una Asamblea/Concejo? No: el sistema de ordenanzas y
  acuerdos locales (`Corporaciones.proponer`) es una votación de un solo turno, sin orden del día ni
  cola de espera — no hay nada que adelantar o aplazar ahí. El poder de agenda de esta fase es
  exclusivo del Congreso, donde sí existe un trámite por etapas con semanas de espera entre ellas.

### Notas de la Fase 15

- **Mesa directiva en Asambleas y Concejos** (`js/sistemas/corporaciones.js`): exactamente el mismo
  mecanismo de la Fase 14, llevado a la Asamblea Departamental y el Concejo Municipal. Como estas
  corporaciones no tenían ningún concepto de mesa directiva antes de esta fase (se creaban una sola
  vez, de forma perezosa, sin presidente ni vicepresidentes), se agregó `corp.mesa`/`mesaPendiente`
  desde cero: al crearse la corporación se resuelve una mesa automática (`resolverMesaSinJugador`,
  el mismo perfil determinista que ya se usaba para el Congreso antes de la Fase 14); en el momento
  en que el jugador entra como diputado o concejal (`asegurarJugador`, la "primera sesión" real para
  él), se reabre la elección con `abrirPostulacionMesa` para que compita de verdad. Mismos tres
  caminos que en el Congreso —pedir el aval del partido (`postularMesaAvalLocal`), postularse de
  forma autónoma (`postularMesaAutonomaLocal`) o no postularse (`noPostularseMesaLocal`)—, mismo
  timeout de 3 semanas si no decide, mismos ids de acción distintos a los nacionales (para no
  pisar el registro de `C.Acciones`, que sobrescribe silenciosamente por id).
- **Peso interno departamental, no nacional**: a diferencia del Congreso (que usa
  `Partidos.peso().nac`), aquí la probabilidad de aval y la fuerza electoral del jugador usan
  `Partidos.peso().dep` — tiene sentido, porque esto se juega dentro de su propio departamento o
  municipio, no a nivel país. Ganar da una recompensa más modesta que la nacional (+5 de
  reconocimiento en vez de +8) y también suma `J.rep.liderazgo`, el mismo atributo que ya premiaba
  sacar adelante una ordenanza o un acuerdo.
- **Etiquetas de rol** (`js/ui/componentes.js`, `Comp.rolesDe`): "Presidente Asamblea de
  &lt;departamento&gt;" / "Presidente Concejo de &lt;capital&gt;" aparecen ahora en la ficha de
  cualquier político (jugador o NPC) que presida una corporación local, igual que ya pasaba con la
  presidencia del Senado o la Cámara desde antes.

### Notas de la Fase 14

- **Postulación a la mesa directiva** (`js/sistemas/congreso.js`): antes, `Co.elegirMesas` resolvía
  la presidencia del Senado y la Cámara solo (cada 20 de julio, en la instalación de un nuevo
  Congreso y en cada renovación anual), excluyendo siempre al jugador de la competencia
  (`Co.miembros(...).filter(p => p.id !== 'J')`) sin darle ninguna opción. Ahora, si el jugador
  pertenece a la cámara que renueva mesa (`E.jugador.cargo === 'senador'`/`'representante'`), en vez
  de resolverla de una se abre una ventana de postulación (`K.mesaPendiente`) con tres caminos:
  **pedir el aval del partido** (`postularMesaAval`, probabilidad según el peso interno del jugador
  y su relación con la dirección — `Co.probAval`, mismo espíritu que `Coaliciones.probAceptar`; si
  el partido no avala, el jugador igual se postula, solo que sin esa prima), **postularse de forma
  autónoma** (`postularMesaAutonoma`, sin pedirle nada al partido) o **no postularse**
  (`noPostularseMesa`, resuelve la mesa exactamente como antes, sin el jugador). Postularse con aval
  da una prima del 25% a la fuerza del jugador en la lotería final; ir de forma autónoma resta un
  25% — siempre es posible, pero compite en desventaja frente a quien sí consiguió el respaldo de su
  colectividad. La cámara donde el jugador NO tiene curul sigue resolviéndose exactamente igual que
  siempre (`Co.resolverMesaSinJugador`, la misma lógica determinista de antes, sin cambios). Si el
  jugador deja pasar 3 semanas sin decidir, la mesa se resuelve sola (asume que no le interesó
  competir esta vez).
- **Elección real, no una moneda al aire**: `Co.resolverMesaConJugador` arma dos rivales (el mejor
  perfil de la coalición de gobierno y el mejor de la oposición, igual que el reparto automático
  de siempre) y compite contra el jugador en una lotería ponderada por fuerza con ruido aleatorio
  (mismo patrón que `Coaliciones.consulta` y las consultas internas de partido), así que el
  resultado no es determinista ni para el jugador ni para los rivales. Ganar da +8 de reconocimiento
  y sube la relación con el partido si fue con su aval (o la resiente un poco si fue en su contra de
  su respaldo); perder simplemente dejar constancia en la bitácora del Congreso y en Medios.
- **Peso interno por presidir una cámara** (`Partidos.peso`): presidir el Senado o la Cámara ahora
  suma +15 al peso interno nacional de quien la preside (jugador o NPC), sin importar si llegó ahí
  con el aval de su partido o de forma autónoma — un efecto mecánico real, no solo la etiqueta
  "Presidente del Senado/Cámara" que ya mostraban el hemiciclo y la ficha de cada político desde
  antes de esta fase.

### Notas de la Fase 13

- **Gabinete 2.0** (`js/sistemas/gabinete.js`, nuevo): cada ministro deja de ser un número de
  imagen y un botón genérico (`mesaTrabajo`) y pasa a tener una **gestión** propia (0-100, sube o
  baja según sus aciertos y errores, inicializada de su experiencia y pragmatismo) que decide en
  buena parte si sus **iniciativas** salen adelante. Cada iniciativa reutiliza uno de los dos
  `programas` ya definidos por ministerio en `data/instituciones.js` (no un catálogo nuevo): el
  ministro la propone solo (probabilidad semanal del 5 % si no tiene ya una en curso ni una crisis
  abierta), el presidente la respalda (`aceptarIniciativaMinistro`, cuesta un punto de agenda) o la
  rechaza (`rechazarIniciativaMinistro`, gratis pero resta lealtad); si se respalda, tarda 5-9
  semanas en resolverse con una probabilidad de éxito ligada a la gestión del ministro y a su
  relación con el presidente (`relJ`, reutilizado también como lealtad/cercanía). Un éxito sube la
  gestión, cuenta como un logro (`m.logros`, alimenta el Salón de la Fama) y aplica un efecto más
  grande que el de la vieja `mesaTrabajo` sobre el indicador departamental de su sector; un fracaso
  baja la gestión y puede detonar una **crisis propia** del ministro (contrato cuestionado,
  negligencia, nepotismo…), resuelta con `respaldarMinistroCrisis` (cuesta lealtad y, si es grave,
  algo de aprobación presidencial) o `destituirMinistroCrisis` (lo saca del cargo de inmediato,
  reutilizando `Gobierno.designar`). Las crisis también pueden surgir solas (una probabilidad
  semanal pequeña, mayor cuanto más baja la gestión y la integridad del ministro). Además, `ministro`
  se agregó al escalafón de ambición de NPC (`Politicos.ESCALON`, Fase 11e/12a): un ministro puede
  anunciar que aspira a la Presidencia y, si su partido es uno de los grandes, terminar siendo el
  candidato presidencial de ese partido en la siguiente elección — tu propio gabinete puede darte un
  rival.
- **Comparación histórica de gobiernos** (`Gobierno.posesionar` + Salón de la Fama): al posesionarse
  un nuevo presidente, el gobierno saliente se archiva en `E.historiaGobiernos` con su aprobación
  promedio durante el mandato (calculada sobre la serie `E.series.aprobacion`, ya existente desde la
  Fase 8), leyes aprobadas y hundidas, y su mejor ministro por logros. El Salón de la Fama agrega una
  tabla "Gobiernos comparados" que junta esos gobiernos archivados con el actual (calculado en vivo,
  marcado "en curso"), y el ranking de "Políticos más destacados" ahora también suma los logros de
  gabinete de cada político al puntaje que ya usaba (cargo más alto, años de servicio, leyes como
  autor).
- **Pestaña Consejo de Ministros** (`js/pantallas/gobierno.js`): nueva sub-pestaña dedicada, con una
  tarjeta por ministro mostrando su gestión, imagen, logros y —si aplica— la iniciativa que propone o
  tiene en marcha, o la crisis que necesita respuesta, con los botones correspondientes. Antes esa
  información vivía apretada dentro de una cuadrícula de avatares en el Centro de Gobierno, sin poder
  hacer nada con ella salvo cambiar de ministro.
- **Centro de Gobierno más cotidiano**: se agregó una tarjeta "Pendientes de hoy" al principio de la
  pestaña que resume, en un vistazo, lo que necesita una decisión (ministros con crisis o iniciativas
  pendientes, un referendo o una Asamblea Constituyente en curso, una mesa de paz con agenda por
  acordar) con enlace directo a la pestaña correspondiente; la cuadrícula de gabinete se redujo a un
  resumen agregado (gestión promedio, cuántos ministros tienen una crisis o una iniciativa en marcha)
  con un botón a la nueva pestaña Consejo de Ministros, en vez de repetir el detalle completo en dos
  lugares. El gobierno local (gobernación/alcaldía) no recibió el mismo tratamiento de gestión e
  iniciativas por secretaría en esta entrega — queda anotado como candidato natural para una próxima.

### Notas de la Fase 8

- **Reelección presidencial histórica** (`Gobierno.puedeReelegirseInmediato`): la reelección
  inmediata está prohibida por defecto (Constitución de 1886 y texto original de la de 1991), salvo
  entre 2005 y 2015 (Acto Legislativo 02 de 2004, derogado por el Acto Legislativo 02 de 2015), y
  sólo una vez (`E.gobierno.reeleccionUsada`). El bloqueo se aplica únicamente al jugador: un
  presidente NPC nunca vuelve a aparecer entre los candidatos de `candidatosPresidencia` porque ya
  se filtra a quien ocupa el cargo, así que la IA nunca intenta reelegirse.
- **Encuestas segmentadas por tema** (`Opinion.TEMAS`/`objetivoTema`/`aprobTemas`): además de la
  aprobación general, cada semana converge una aprobación en seguridad, economía, salud y lucha
  contra la corrupción, cada una hacia un objetivo calculado a partir de indicadores reales del
  juego (seguridad y salud por departamento, desempleo/inflación/crecimiento, y un acumulado de
  corrupción). Se muestran como barras en el Centro de Gobierno y viajan también en cada encuesta
  (`Opinion.encuesta`).
- **Corrupción interna** (`campana.js` acción `financiacionIrregular`, `gobierno.js` acción
  `mermelada`): financiar una campaña por fuera del tope legal da caja sin límite, y repartir cupos
  burocráticos y obras a una bancada sube su relación más barato que negociar de buena fe — ambas
  sin necesidad de coalición formal. Las dos suben `J.riesgoJudicial` y `E.opinion.corrupcionAcum`,
  que alimentan el nuevo sistema judicial y la aprobación temática de corrupción respectivamente.
- **Sistema judicial** (`js/sistemas/judicial.js`, nuevo): con suficiente `riesgoJudicial`
  acumulado (financiación irregular, mermelada, escándalos de patrimonio…), la Fiscalía puede abrir
  una investigación que avanza semana a semana por tres etapas (indagación preliminar, imputación,
  juicio) — puedes contratar defensa legal (acción `defensaLegal`) para ralentizarla. Al resolverse,
  una condena no grave hace perder la investidura (`Personaje.dejarCargo`, igual que cualquier
  cambio de cargo) y una condena grave termina la carrera política por completo, reutilizando
  exactamente el mismo mecanismo de fin de partida que el retiro o el fallecimiento
  (`Familia.finDeCarrera`).
- **Orden público** (`js/sistemas/ordenpublico.js`, nuevo): tres grupos armados ficticios (una
  guerrilla, un grupo paramilitar y una organización narcotraficante) controlan de fondo un puñado
  de departamentos con baja seguridad, atacan ocasionalmente bajando el indicador local, y ganan o
  pierden territorio despacio según su fuerza. Como presidente tienes un rol activo: ordenar una
  ofensiva militar (probabilidad según la fuerza institucional del país frente a la del grupo) o
  abrir una mesa de negociación de paz y ceder concesiones para acelerarla — sostenida el tiempo
  suficiente, termina en un acuerdo de paz con efecto real sobre la seguridad de esos departamentos.
- **Diplomacia** (`js/sistemas/diplomacia.js`): al día siguiente de esta entrega, los países dejaron
  de ser ficticios — ver "Notas de la Fase 9" para el reemplazo por los 193 países reales y los
  organismos multilaterales. Sólo como presidente puedes convocar una cumbre bilateral o firmar un
  tratado (comercio, cooperación o defensa) con efectos reales y acotados (crecimiento económico,
  educación o seguridad departamental según el tipo). Si además ocupas tú mismo el Ministerio de
  Relaciones Exteriores, su mesa de trabajo (la misma acción genérica `convocarMesa` de cualquier
  ministerio) mejora la relación con los países destacados peor calificados en vez de un indicador
  departamental.

### Notas de la Fase 12

- **Progresión de carrera real** (`elecciones.js`): la ambición que un político NPC anuncia
  (`Politicos.anuncioAmbicion`, Fase 11e) ya sólo tenía efecto electoral real en la Presidencia
  (`candidatosPresidencia`). Ahora también decide de verdad candidaturas más abajo en el escalafón:
  en `formarLista`, un representante con `aspiraAnuncio.destino === 'senador'` entra al pool de
  aspirantes al Senado de su partido (con una prima de peso interno análoga a `ambPres`) en vez de
  competir sólo contra aspirantes sintéticos, y deja su curul de Cámara (`aspiraOtro = 'senado'`);
  en `regional`, si un diputado o concejal de la colectividad ya anunció ambición a gobernación o
  alcaldía (`destino === 'gobernador'`/`'alcalde'`) en ese mismo departamento, se lanza con su
  propio nombre y una prima de fuerza (`s * 1.25`) en vez de fabricarse un aspirante nuevo sin
  historia. El efecto es narrativo tanto como mecánico: "Fulano, que venía aspirando a la
  gobernación, finalmente se lanza" en vez de un candidato genérico sin trayectoria previa.
- **Dinastías políticas NPC** (`politicos.js`, funciones `notable`/`posibleDinastia`): cada político
  activo acumula un historial permanente de los cargos que ha ocupado alguna vez (`p.honores`) y los
  años totales en cargo (`p.aniosServicio`), independiente de qué cargo tenga hoy. Cuando un
  político "notable" (llegó a la Presidencia, una gobernación, el Senado, un ministerio, o acumuló
  8+ años en cargos) sale de la vida pública —por retiro de edad o por una renuncia forzada por
  escándalo— hay un 35% de probabilidad de que un hijo herede parte de su arrastre electoral
  (`fuerza * 0.45` más un extra aleatorio) y se estrene en política con el mismo apellido, anotado
  en `heredero.dinastia = { padre, padreNombre, apellido }`. Es un eco simplificado, sin diálogo
  propio, del sistema de Familia del jugador (Fase 6): no hay elección de sucesor ni resumen de fin
  de partida, sólo un nuevo aspirante que aparece en el ecosistema político con una prima de fuerza
  y una nota de prensa.
- **Salón de la Fama / Archivo Histórico** (`js/pantallas/historia.js`, nueva pantalla): reúne en
  una sola vista, sin ninguna acción jugable, los expresidentes de la partida (jugador incluido, vía
  `J.ocupados`, y NPC vía `p.honores.presidente`/`expresidente`), un ranking de los políticos NPC
  más destacados (por el cargo más alto que llegaron a ocupar, años de servicio y leyes aprobadas
  como autor — `stats.aprobados`, ya existente desde antes de esta fase), las dinastías políticas
  nacidas de `posibleDinastia` (más el propio legado del jugador si heredó la carrera de un
  personaje anterior, `J.legado`), y el historial completo de partidos fundados y disueltos
  (reutiliza `pa.fundado`/`pa.disuelto`/`pa.disueltoT` de la Fase 11e, sin datos nuevos).

### Corrección posterior a la Fase 11: botones deshabilitados por depender de un `<select>`

Un jugador reportó que en Safari (iOS/iPadOS) ningún desplegable "dejaba seleccionar nada". La
causa real no tenía nada que ver con el navegador ni con el toque: `UI.botonAccion(id, args, …)`
calcula si el botón se deshabilita (`C.Acciones.puede(id, args)`) **en el momento de dibujar la
pantalla**, con los `args` que se le pasan ahí mismo — casi siempre `{}` cuando el valor real vive
en un `<select data-arg="…">` hermano dentro del mismo `.accion-form` (esos valores sólo se leen al
hacer clic, vía delegación en `UI.initAcciones`). Si la función `disponible(E, a)` de una acción
revisaba `a.<campo>` para decidir si mostrarse habilitada, encontraba `undefined` en cada render y
el botón nacía con el atributo `disabled` para siempre — sin importar qué se eligiera después en el
desplegable, porque un botón `disabled` nunca llega a disparar el clic delegado. Confirmado con una
selección y un clic reales por Playwright (`page.select_option` + `page.click`, no llamando la
acción directamente): antes del fix no pasaba nada; después, comprar un bien funcionó de punta a
punta. La regla correcta —ya documentada antes en este archivo, pero violada varias veces al
construir las Fases 8-11— es que la validación de un campo que depende de un `<select>` en vivo
debe vivir en `ejecutar(E, a)`, devolviendo `{ ok: false, msg }`, nunca en `disponible`. Se corrigió
en: `comprarBien`, `mermelada`, `cumbreBilateral`, `firmarTratado`, `convocarReferendo`,
`proponerArticuloConstituyente`, `transferirCompetencia`, `negociarPunto`, `presionarMinisterio`,
`proponerCoalicion` — y dos bugs preexistentes de antes de la Fase 7 que nadie había detectado:
`cambiarOficio` y `afiliarse` en `personaje.js`, ambos con el mismo defecto desde su creación. Se
hizo un barrido automatizado con Playwright por todas las pantallas principales (con el jugador en
varios estados: presidente, con partido propio, con procesos de federalización/paz abiertos) que
lista cada botón deshabilitado y su motivo, para confirmar que los únicos que quedan deshabilitados
lo están por una razón real del juego, no por este defecto.

**Un tercer caso se coló después, sin que ese barrido lo cubriera**: `lanzarPrograma`
(`gobiernolocal.js`, Fase 3c) revisaba `a.idx` —el programa elegido en el `<select data-arg="idx">`
de cada secretaría— dentro de `disponible(E, a)`, exactamente el mismo defecto. Como el barrido
automatizado de la Fase 11 sólo probó las pantallas listadas en ese momento y `local.js` (Gobierno
local del jugador) no estaba entre ellas, pasó cinco fases sin detectarse hasta que un jugador
reportó que el botón "Lanzar" de sus secretarías nunca se habilitaba. Corregido con la misma regla:
la validación de `a.idx` se movió a `ejecutar`. Lección para el futuro: el barrido de botones
deshabilitados debe cubrir **todas** las pantallas con formularios de `<select>`, incluidas las que
sólo aparecen bajo un cargo concreto (gobernador/alcalde, diputado/concejal), no sólo las que se
prueban con el jugador de presidente.

### Notas de la Fase 11

- **Balance de orden público** (`ordenpublico.js`): la recuperación territorial de la Fuerza
  Pública ya no dependía sólo de que el jugador debilitara a un grupo por debajo de `fuerza < 28`
  — ahora su probabilidad depende de `fuerzaInstitucional(E)` frente a la del grupo, así que
  incluso sin ofensivas del jugador el Estado empuja hacia atrás con más frecuencia cuanto más
  fuerte es en seguridad promedio nacional. Además hay un tope duro de 6 departamentos por grupo y
  la expansión se satura a medida que se acerca a él. Probado en 4 semillas distintas sin ninguna
  intervención del jugador durante 504 semanas: el total combinado de departamentos bajo control
  armado se mantuvo entre 6 y 11, muy lejos del descontrol de hasta ~20 que se observaba antes.
- **Listas conjuntas reales** (`Elecciones.poolCoalicion`/`votosConPool`/`subApportionCoalicion`):
  cuando el jugador hace campaña como cabeza de una coalición para Senado o Cámara, su partido y
  los de sus aliados compiten como un solo bloque frente a cifra repartidora nacional (o
  departamental, para Cámara) contra el resto de partidos, y los escaños que gana ese bloque se
  reparten entre los miembros con una segunda cifra repartidora sobre sus votos propios — el mismo
  algoritmo `dhondt`, aplicado dos veces. Verificado con un caso extremo (un partido sin ninguna
  curul propia aliado con el más grande): el total combinado del bloque subió de 16 a 18 curules
  frente a competir por separado, el efecto real que se buscaba.
- **Redes sociales** (`js/sistemas/redes.js`, nuevo): un canal propio con un medidor de
  "viralidad" que decae solo con el tiempo. Publicar es una apuesta: si sale bien, sube el
  reconocimiento en proporción a la viralidad acumulada; si sale mal, cae la viralidad, la
  credibilidad y queda registrada como un escándalo más del jugador — más riesgo y más alcance
  directo que la pauta o la entrevista tradicional.
- **Carrera de caballos** (`Elecciones.carreraPresidencial`): durante una campaña presidencial, la
  encuesta de seguimiento que ya existía (cada 4 semanas) ahora también calcula la intención de
  voto de los candidatos reales de esa elección (los mismos que arma `candidatosPresidencia`),
  reutilizando la fórmula de fuerza de la elección real (`fuerzaCandidatoPresidencial`, extraída
  del cálculo que antes vivía sólo dentro de `presidencial()`). Se grafica como una línea por
  candidato en la pantalla de campaña.
- **Políticos NPC con ambición y rivalidades** (`Politicos.anuncioAmbicion`): un político con
  cargo y mucha ambición (`r.amb`) puede anunciar aspiraciones a un cargo superior; si otro de su
  mismo partido ya aspiraba a lo mismo, nace una rivalidad mutua (con su propio desgaste de
  relación) en vez de una simple coincidencia. La aspiración a la presidencia además pesa de
  verdad en `candidatosPresidencia`: un aspirante que ya lo anunció tiene ventaja real sobre uno
  que no.
- **Escándalos propios** (`Politicos.escandaloPropio`): antes sólo el jugador podía protagonizar un
  escándalo; ahora cualquier político con cargo puede, con una probabilidad que depende del rasgo
  `r.int` (definido desde el inicio del proyecto pero nunca antes usado en ningún cálculo). Un
  escándalo grave puede costarle la curul a un congresista, reutilizando `Gobierno.vacante` para la
  sucesión — el mismo mecanismo que cuando un congresista asume otro cargo.
- **Partidos que nacen y mueren** (`Partidos.disolver`/`fundacionNPC`): un partido chiquito y
  sostenido en las últimas por más de un año se disuelve (`pa.disuelto = true`, reutilizando el
  campo `futuro` que ya filtran elecciones, coaliciones, gobierno y diplomacia en todo el motor,
  así que desaparece de la vida política sin tocar ese código en ningún otro archivo); nunca se
  disuelve el partido del jugador ni el de gobierno. Un político NPC muy ambicioso, con mala
  relación con su partido y peso propio puede fundar uno nuevo de la nada, con un catálogo curado
  de ocho nombres/lemas genéricos — el mismo mecanismo que `Partidos.nacer` para el jugador, pero
  de una sola vez (un NPC no lleva una campaña de firmas visible). Se encontró y corrigió un bug
  real durante las pruebas: el chequeo que funda automáticamente un partido `futuro` programado
  (`pa.fundado <= año`) revivía por accidente un partido recién disuelto en el turno siguiente,
  porque su `fundado` original ya estaba en el pasado; el chequeo ahora exige además `!pa.disuelto`.

### Notas de la Fase 10

- **Constitución reformable** (`js/sistemas/constitucion.js`, nuevo): un catálogo curado de cuatro
  artículos con hooks reales en el motor —no texto libre—: `reeleccion` (consultada por
  `Gobierno.puedeReelegirseInmediato` antes de la regla histórica 2005-2015), `umbralSenado`
  (consultado por `Elecciones.congreso` en vez de la constante fija de `DATA.camaras.senado`),
  `edadMinimaPresidencia` (consultada por la acción `inscribir` de campaña) y `autonomiaTerritorial`
  (unitaria/descentralizada/federal, la base de la federalización). Dos vías de reforma: un
  **referendo** puntual (`convocarReferendo`, campaña de 16 semanas donde el apoyo deriva con la
  aprobación presidencial y se resuelve con esa probabilidad) o una **Asamblea Constituyente**
  (`convocarConstituyente`, tres fases —elección, redacción, ratificación— que permite empaquetar
  hasta 3 cambios a la vez con `proponerArticuloConstituyente`, más lenta pero capaz de reformar
  varias cosas de un golpe). Pasar a "federal" por cualquiera de las dos vías está bloqueado a
  propósito (`Constitucion.candadoAutonomia`): exige el proceso dedicado de federalización, y una
  vez alcanzado, revertirlo tampoco cabe en un solo referendo o constituyente.
- **Federalización** (`js/sistemas/federalizacion.js`, nuevo): con el país ya descentralizado,
  `iniciarFederalizacion` abre un proceso de transferencia de seis competencias (seguridad,
  hacienda, salud, educación, infraestructura, planeación —las mismas seis secretarías que ya
  existían en `GobiernoLocal`— transferidas una por una con `transferirCompetencia`). Cada
  transferencia deja un efecto inmediato sobre los departamentos y, sobre todo, activa un
  multiplicador (`Federalizacion.multiplicador`, ×1.6) que `GobiernoLocal.lanzarPrograma` aplica de
  ahí en adelante a los programas de esa secretaría en cualquier departamento — gobernadores y
  alcaldes literalmente gobiernan con más peso real. Al transferirse la sexta, el artículo
  constitucional pasa a "federal" automáticamente, con su propia noticia de alcance nacional.
- **Protocolo de paz con agenda y post-acuerdo** (`js/sistemas/ordenpublico.js`, reescrito): la
  vieja mesa de negociación de un solo paso se reemplaza por un protocolo de cuatro fases, con la
  agenda de La Habana (2012-2016) como referencia directa. `mesaPaz` abre una mesa exploratoria;
  `pactarCese` la mueve a un cese al fuego bilateral; en la fase de agenda, `negociarPunto` avanza
  uno de los cinco puntos reales (reforma rural, participación política, fin del conflicto, drogas
  ilícitas, víctimas) a la vez, y sólo cuando los cinco quedan acordados se entra a una fase de
  verificación internacional pasiva de 6 semanas antes de la firma. Firmar ya no es el final: abre
  una **implementación** con un `cumplimiento` que decae solo si el Gobierno no sigue invirtiendo
  (`invertirImplementacion`) y que, si cae por debajo de 25 %, tiene una probabilidad semanal de que
  surjan disidencias que reactivan parte del conflicto (recuperan uno o dos departamentos con una
  fuerza menor, bajo la misma sigla) — el mismo patrón de "la paz se puede perder si no se cumple"
  del proceso real. Sostener el cumplimiento sobre 70 % durante 30 semanas consolida la paz de forma
  permanente. Simplificación explícita: la disidencia reutiliza el mismo grupo (misma sigla, nueva
  `fuerza` y `control`) en vez de crear una facción disidente aparte con su propia identidad — evita
  tener que extender el catálogo fijo de `GRUPOS` en tiempo de ejecución por un beneficio narrativo
  menor.

### Notas de la Fase 9

- **Países reales** (`data/paises.js`): los cinco países ficticios de la Fase 8 se reemplazaron por
  los 193 reales — los 192 miembros de la ONU distintos de Colombia, más Kosovo (que Colombia
  reconoce). `CURUL.DATA.paisesDestacados` cura una relación inicial e inclinación ideológica
  realistas sólo para los vecinos (Venezuela, Ecuador, Perú, Panamá, Brasil), las potencias
  (Estados Unidos, China, Rusia) y algunos socios relevantes (España, México, Cuba, Nicaragua,
  Alemania, Francia, Reino Unido, Corea del Sur, Israel); el resto arranca en un valor genérico por
  región (`BASE_REGION` en `diplomacia.js`) y sólo deriva con una tendencia suave hacia esa línea
  base, sin ideología propia que lo mueva — cuidar la relación con los 193 uno por uno habría sido
  desproporcionado frente al valor de juego. La interfaz muestra siempre las relaciones destacadas
  como barras, y añade un selector agrupado por región (con `<optgroup>`, que además filtra al
  escribir en cualquier navegador) para llegar a cualquiera de los 193 con una cumbre o un tratado.
- **Organismos multilaterales reales** (`data/organismos.js`, nuevo): la lista incluye tanto los que
  Colombia integra hoy (ONU, OEA, CAN, Alianza del Pacífico, CELAC, ALADI, OCDE) como algunos de los
  que no hace parte (Mercosur —donde sí es Estado Asociado—, UNASUR —de donde se retiró en 2018—,
  BRICS, CARICOM) y dos deliberadamente inalcanzables para que quede claro que no todo es jugable
  (la Unión Europea y la Liga Árabe, sin elegibilidad geográfica) o irreversible por una sola acción
  (la ONU, de la que no se puede salir con un clic; la OTAN, de la que Colombia es Socio Global sin
  ser miembro pleno y sin ruta de ingreso). Acciones nuevas `ingresarOrganismo` (abre una
  postulación que avanza semana a semana y se resuelve con una probabilidad propia de cada
  organismo, mismo patrón de "postulación pendiente" que las coaliciones o las investigaciones
  judiciales) y `retirarseOrganismo` (inmediata, con su propio costo de aprobación y de imagen).

### Notas de la Fase 7

- **Gabinete local mejorado** (`GobiernoLocal.designarSecretario`/`lanzarPrograma`/`consejoLocal`):
  como el presidente con `cambiarMinistro`, ahora puedes elegir el partido (o un técnico sin
  partido) de cada secretario, en vez de que salga siempre al azar. Cada secretaría tiene además
  dos programas de política pública concretos (`PROGRAMAS` en `gobiernolocal.js`) que se pueden
  lanzar como una acción con efecto acotado sobre el indicador del departamento asociado, y un
  Consejo de gobierno local que sube algo tu imagen en la región y la aprobación de tu gabinete —
  el mismo patrón que el Consejo de Ministros nacional, a escala departamental o municipal.
- **Fundar un partido nuevo** (`Partidos.iniciarFundacion`/`nacer`, acciones `iniciarFundacion` y
  `impulsarFundacion`): cuesta $150 millones y algo de reconocimiento; a partir de ahí recoges
  firmas semana a semana (más rápido si impulsas la recolección) hasta alcanzar la meta, que es más
  baja cuanto más reconocido seas. Al nacer, el partido entra a `E.partidos` como cualquier otro
  (con su propia facción, militantes, popularidad inicial y color), tú quedas de director y tu
  militancia anterior se resiente.
- **Coaliciones preelectorales y consulta interpartidista** (`js/sistemas/coaliciones.js`): antes
  de inscribirte, puedes proponerle a otro partido que respalde tu aspiración a cambio de un puesto
  concreto si ganas (un ministerio para Presidencia, una secretaría para Gobernación/Alcaldía, o
  apoyo en comisión para Senado/Cámara) — la probabilidad de que acepte depende de la afinidad
  ideológica, la generosidad de la oferta y su relación contigo. Con uno o más partidos ya aliados,
  la vía de inscripción "coalición" resuelve con una **consulta interpartidista** quién de todos
  ellos —tú incluido— es el candidato único, reutilizando el mismo motor que las consultas internas
  pero con un representante de cada partido aliado compitiendo (no sólo rivales de tu propio
  partido). Si ganas, `cam.coalicion` viaja con la campaña real (con bonus de fuerza electoral
  proporcional a la popularidad de tus aliados) y, al asumir el cargo, `Coaliciones.cumplirPresidencia`
  o `Coaliciones.cumplirLocal` reparten automáticamente los puestos pactados. Para el Congreso, sin
  cargos ejecutivos que repartir, el "apoyo en comisión" queda como un gesto de buena relación
  (sube `relJ`) más que un puesto concreto — una simplificación deliberada frente al costo de
  rehacer el reparto de curules como listas conjuntas multipartidistas.

### Notas de la Fase 6

- **Hijos con vida propia** (`js/sistemas/familia.js`, `Familia.hijos`/`turnoAnual`): cada hijo tiene
  educación, atributos propios, ideología (heredada de la del jugador con ruido) y una relación
  contigo que decae si no le dedicas tiempo. Dos acciones nuevas: "Pasar tiempo con un hijo"
  (sube la relación) y "Pagar sus estudios" (sube un nivel educativo, cuesta dinero). Se corrigió de
  paso un bug de la Fase 1: el rol (Hijo/Hija) y el nombre elegido al crear personaje se sorteaban
  por separado, así que podían no coincidir en género; ahora se sortea una sola vez y el género
  queda guardado en el propio hijo (necesario para heredarlo más adelante).
- **Retiro, fallecimiento y sucesión** (`Familia.finDeCarrera`/`heredar`, acción `retirarseVida`,
  cargo `heredero` oculto en `Personaje.ORIGENES`): a partir de los 68 años hay una probabilidad
  creciente de fallecer cada cumpleaños (`Personaje.turno`); retirarse es siempre voluntario. En
  cualquiera de los dos casos, si hay un hijo mayor de edad, se ofrece continuar la partida con él
  (reutiliza `Personaje.crear` con el origen `heredero` para no dejar el objeto del jugador a
  medias, y le superpone sus propios atributos, ideología y una fracción del patrimonio y el
  reconocimiento de su predecesor); si no hay heredero, o el jugador prefiere no continuar, se
  muestra un resumen de la carrera (cargo más alto, elecciones ganadas, leyes aprobadas, patrimonio)
  y la partida termina ahí. Estos dos estados (`E.ui.sucesionPendiente`/`E.ui.finPartida`) bloquean
  el avance del tiempo igual que un evento o una noche electoral (`Tiempo.bloqueo`).
- **Propiedades** (`js/sistemas/propiedades.js`): el patrimonio deja de ser sólo un número que
  crece solo — el jugador compra bienes concretos (apartamento, finca, local, acciones), cada uno
  con su propia renta semanal y una volatilidad (`beta`) ligada al crecimiento económico nacional;
  se pueden vender de vuelta a precio de mercado. `Propiedades.riesgoPatrimonial` compara el
  patrimonio total (líquido + bienes) contra el salario anual declarado: una fortuna que crece
  mucho más rápido de lo que el sueldo explica alimenta la probabilidad del nuevo evento
  `patrimonioSospechoso` (`data/eventos.js`, reutilizando el motor de eventos ya existente desde la
  Fase 1) — un reportaje que cuestiona de dónde salió esa plata, con distintas formas de responder.

### Notas de la Fase 5

- **Dirección del partido** (`Partidos.disputarDireccion`/`Partidos.rivalesDireccion`): el jugador
  puede disputar la dirección nacional de su partido (el `pa.lider` que antes sólo asignaba la IA
  al generar el mundo) en un congreso interno contra el director actual y un par de rivales de
  peso, con el mismo espíritu que una consulta interna — no es un volado, pesa el peso interno y el
  arrastre de cada uno, con su parte de azar. Perder tiene un enfriamiento de 10 semanas antes de
  poder insistir. Ganar no cambia nada más por sí solo: abre la puerta a negociar con el Gobierno.
- **Presionar por un ministerio** (`Gobierno.presionarMinisterio`, botón en el Centro de Gobierno):
  sólo disponible si el jugador dirige un partido que hace parte de la coalición de gobierno y no
  es el propio Presidente. La probabilidad de éxito depende de la cuota de curules del partido
  dentro de la coalición y del peso interno del jugador. Si tiene éxito, el jugador mismo se
  convierte en **ministro** de la cartera elegida — algo que hasta esta entrega nunca era posible:
  «ministro» existía como cargo en `C.DATA.cargos` y se comprobaba en varios sitios (`E.jugador.cargo
  === 'ministro'`), pero ninguna acción llegaba a asignárselo al jugador; `Gobierno.designar` sólo
  sabía crear un ministro NPC nuevo. `Gobierno.designarJugador` cubre ese hueco (deja vacante su
  curul si venía del Congreso, como cualquier congresista que asume otro cargo) y tanto
  `Gobierno.designar` como la posesión de un nuevo presidente devuelven correctamente al jugador a
  la vida civil si deja de ser ministro, para que no quede un estado a medias.
- **Mesa de trabajo del ministerio** (`Gobierno.mesaTrabajo`, pantalla `js/pantallas/ministerio.js`,
  pestaña «Mi ministerio»): sólo visible si el jugador es ministro. Convocar la mesa mejora un poco
  el promedio nacional del indicador de departamento asociado al sector del ministerio
  (`Gobierno.EFECTO_SECTOR`: educación, salud, seguridad/paz, infraestructura/vivienda/tecnología,
  empleo) cuando existe uno, y siempre fortalece algo la imagen del jugador y del Gobierno — un
  efecto acotado y con azar, pensado para usarse con cierta frecuencia, no para resolver el sector
  de un plumazo.

### Notas de la Fase 4

- **Peso interno de partido** (`Partidos.peso(E, pol)` en `js/sistemas/partidos.js`): no es un
  campo guardado aparte, se deriva del cargo que la persona ocupa (o el más alto que ocupó),
  su carisma y experiencia y, sólo para el jugador —de quien sí se seguía ya la relación con la
  dirección vía `partido.relJ`—, esa relación. Dos números, 0-100: peso frente a la dirección
  **nacional** y frente a la **departamental**. Cuando la dirección arma una lista cerrada
  (`Elecciones.formarLista`), los aspirantes del partido se ordenan por este peso antes de
  completar los renglones disponibles: quien más pesa entra primero a la lista, aunque el orden
  final de elección lo sigue decidiendo el voto preferente de la noche electoral (no se cambia
  ese sistema, que ya existía desde la Fase 1).
- **Consultas internas (primarias)** (`Partidos.primaria`/`Partidos.rivalesPrimaria` y la vía
  `primaria` de la acción `inscribir` en `js/sistemas/campana.js`): en vez de esperar el aval de
  la dirección (una probabilidad), el jugador puede medirse contra un puñado de compañeros de su
  propio partido por el mismo cupo. Cada candidato pesa según su peso interno y su fuerza
  electoral personal, con su dosis de azar; el resultado se ve en una noche de resultados propia
  (`Pantallas.elecciones.nochePrimaria`), más ligera que la noche electoral general pero con la
  misma idea: barras de apoyo por candidato y un veredicto claro de paso/no paso. Ganar tiene
  efecto real: en Senado o Cámara, el jugador sale de **cabeza de lista** (bonus de arrastre en
  `Elecciones.pesoPreferente` durante la elección general); en Gobernación, Alcaldía o
  Presidencia, el jugador queda como el único candidato de su partido en esa contienda (se retira
  cualquier otro nombre generado automáticamente para esa colectividad). Perder tiene las mismas
  consecuencias que un aval negado: la campaña no se inscribe y hay que esperar antes de insistir.
- **Diputados y concejales con algo que hacer** (`Corporaciones.asegurarJugador`/`Corporaciones.proponer`
  en `js/sistemas/corporaciones.js`, pantalla `js/pantallas/corporacion.js`): hasta esta entrega, si
  el jugador ejercía como diputado o concejal (sea desde el origen inicial o por haber ganado una
  elección regional) no tenía ninguna pantalla ni acción propias — la Asamblea o el Concejo sólo
  existían para cuando el jugador era gobernador o alcalde y necesitaba su visto bueno. Ahora, al
  asumir el cargo (`jugador:cargo`, o al generar el mundo si es el origen inicial), el jugador
  reemplaza a un miembro de su mismo partido dentro de `corp.miembros` y aparece como una curul más
  del hemiciclo (`Corporaciones.hemiciclo`), con su propia pestaña de navegación («Asamblea» o
  «Concejo»). Desde ahí puede radicar una ordenanza o un acuerdo sobre salud, educación,
  infraestructura o seguridad: se somete a una votación nominal real igual que la de crear una
  secretaría (su propio voto cuenta como sí, por ser el autor) y, si se aprueba, mejora de verdad
  el indicador del departamento. Partidas guardadas antes de esta entrega se migran igual que las
  de gobernadores/alcaldes (`Estado.migrar`).
- **Noche electoral candidato a candidato** (`Elecciones.corporacionLocal` reescrita, tabla
  `tablaLista` en `js/pantallas/elecciones.js`): al presentarte al Senado, la Cámara, una Asamblea
  o un Concejo, la noche electoral ya no se queda en "no alcanzaste la victoria" — muestra la lista
  completa de tu partido (o de tu movimiento propio) puesto por puesto, con el nombre y los votos
  de cada rival, y una etiqueta «Pasa»/«No pasa» junto a cada uno. Para Senado y Cámara reutiliza
  el ranking por voto preferente que ya existía (`res.senado.listas`/`res.camara.porDepto[].listas`,
  desde la Fase 1); para Asamblea y Concejo, `corporacionLocal` ahora genera rivales con nombre
  propio (antes eran sólo pesos anónimos) para poder mostrar la misma tabla. El modal abre
  directamente en la pestaña (Senado/Cámara) donde compitió el jugador.

### Notas de la Fase 3

- **Fecha de inicio libre** (`js/sistemas/mundo.js`): el jugador elige cualquier año entre 1900 y
  2026; el mundo se genera en el ciclo de instalación del Congreso más reciente (cada 4 años,
  extendido con aritmética modular hacia atrás y hacia adelante) y se presimula en silencio hasta
  la fecha pedida, así que la historia que el jugador encuentra es la que realmente ocurrió en la
  partida, no un estado fabricado a mano. Simplificaciones deliberadas: los ciclos de 4 años se
  mantienen constantes en toda la línea de tiempo; sólo el número de electores se escala hacia
  atrás con una tasa de crecimiento poblacional media (`Elecciones.factorPoblacion`), no la
  población ni el PIB de cada departamento, que siguen siendo de referencia moderna.
- **Bipartidismo y Frente Nacional** (`Partidos.futuro`, `Elecciones.era`): antes de 1991 sólo
  compiten el PLR y el PCN (los demás partidos declaran su año de fundación en
  `data/partidos.js`); el umbral del 3 % del Senado y las circunscripciones especiales, ambos
  posteriores a 1991, se desactivan; entre 1958 y 1970 la presidencia alterna por ley entre los dos
  partidos y el Congreso se reparte en partes exactamente iguales (`Elecciones.paridadFN`).
  Gobernadores y alcaldes son designados (no elegidos) antes de 1991.
- **Ley para crear ministerios** (acción `proponerLeyMinisterio` en `gobierno.js`): reutiliza
  íntegramente el trámite legislativo existente; al sancionarse, `Presupuesto.crearMinisterio` le
  abre un puesto en el presupuesto y se nombra ministro. `E.ministeriosExtra` guarda los creados en
  la partida; `Gobierno.todosMinisterios(E)` es el catálogo completo que usa el resto del juego.
- **Gobierno local** (`js/sistemas/gobiernolocal.js`): sólo se simula en profundidad el
  departamento donde el jugador es gobernador o alcalde (el resto del país sigue teniendo
  gobernadores y alcaldes NPC, como en las fases anteriores). Reasignar el presupuesto entre
  secretarías existentes y firmar decretos son potestad ejecutiva directa (sin voto); crear una
  secretaría nueva necesita el visto bueno de la Asamblea o el Concejo, resuelto con una votación
  nominal real (ver más abajo), no con una probabilidad.
- **Asambleas Departamentales y Concejos Municipales** (`js/sistemas/corporaciones.js`): igual que
  el resto del gobierno local, sólo se genera (de forma perezosa, al asumir el cargo) la corporación
  del departamento o municipio donde ejerce el jugador. Sus diputados o concejales se eligen con la
  misma cifra repartidora (D'Hondt) que el Congreso, sobre las cuotas de voto reales del
  departamento (`Elecciones.cuotas`/`Elecciones.dhondt`); el número de curules se aproxima a los
  rangos reales según población (11-31 en asambleas, 7-21 en concejos). Cada miembro vota en una
  votación nominal real según su afinidad de partido con el gobierno del jugador, su relación
  personal (`relJ`) y la capacidad de negociación del jugador — no una probabilidad agregada — y el
  resultado se puede ver en un hemiciclo propio (reutilizando `Hemiciclo.svg`) en la pantalla de
  Gobierno local, coloreado por partido o por voto (a favor/en contra/ausente) tras la última
  votación. `GobiernoLocal.proponerCreacion` llama a `Corporaciones.votar` en vez de tirar un dado.
- **Municipios en el mapa** (`data/municipios-colombia.js`): capa opcional (activable con una
  casilla en la pantalla de Mapa) con el contorno real de los 1122 municipios de Colombia,
  derivados de la misma fuente DANE que el mapa departamental (`@john-guerra/geo-colombia`), con
  nombre, departamento y población real al pasar el cursor. Es una capa visual e informativa: el
  juego sigue simulando la economía y política a nivel departamental (y de la capital, para
  alcaldías), no una economía independiente por cada uno de los 1122 municipios — eso excede el
  alcance de esta fase.

### Notas de la Fase 2

- El presupuesto vive en `js/sistemas/presupuesto.js`: `formular()` genera la propuesta del
  Gobierno según la ideología presidencial (más gasto social con presidentes de izquierda, más
  disciplina fiscal y defensa con presidentes de derecha); `radicar()` la convierte en un proyecto
  de ley normal (Comisión Cuarta) que sigue el mismo trámite, cabildeo y votación que cualquier
  otro; `commit()` la deja vigente al sancionarse o, si el Congreso no la aprueba a tiempo, por el
  mandato del art. 348 de la Constitución (que el juego aplica literalmente).
- `Presupuesto.underfunded(minId)` alimenta dos eventos (`crisissectorial`, reacción ciudadana
  genérica; `crisispresupuestal`, decisión del jugador-presidente entre recortar otro sector o
  pedir crédito de emergencia). Un ministerio cae en subfinanciación si su participación vigente
  baja de 75 % de su peso de referencia — alcanzable de forma orgánica con presidentes
  ideológicamente extremos, y siempre alcanzable si el jugador-presidente decide deliberadamente
  recortar un sector con los controles de la pestaña Presupuesto.
- Pendiente natural de la Fase 3: dar a gobernadores y alcaldes un presupuesto y agenda propios
  (hoy sólo existen como cargos electorales), reutilizando el mismo patrón de `presupuesto.js`.
