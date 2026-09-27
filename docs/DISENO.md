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
| 9 | Cientos de políticos con carreras independientes, partidos que nacen y mueren, décadas | pendiente |

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
- **Diplomacia** (`js/sistemas/diplomacia.js`, nuevo): cinco países ficticios con una relación
  bilateral que deriva lentamente según la afinidad ideológica con el Gobierno. Sólo como
  presidente puedes convocar una cumbre bilateral o firmar un tratado (comercio, cooperación o
  defensa) con efectos reales y acotados (crecimiento económico, educación o seguridad
  departamental según el tipo). Si además ocupas tú mismo el Ministerio de Relaciones Exteriores,
  su mesa de trabajo (la misma acción genérica `convocarMesa` de cualquier ministerio) mejora la
  relación con los dos países peor calificados en vez de un indicador departamental.

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
