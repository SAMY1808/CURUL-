# CURUL — Simulador político de Colombia

Simulador de estrategia política ambientado en una Colombia ficticia pero institucionalmente
inspirada en la real. Construyes una carrera desde lo local hasta la Presidencia y ves el sistema
funcionando: mapa por capas, hemiciclos con cada curul, votaciones nominales animadas, trámite
legislativo por etapas, noche electoral, partidos con facciones, gobierno, oposición y economía.

**Jugar:** abre `index.html` (funciona desde el disco, en GitHub Pages o con cualquier servidor estático).
En línea: **https://samy1808.github.io/CURUL-/** (activar GitHub Pages) o de inmediato vía
**https://cdn.jsdelivr.net/gh/SAMY1808/CURUL-/index.html**.

## Qué hay en esta versión (Fases 1 a 8 completas)

- **Personaje**: identidad, formación, atributos, ideología en dos ejes, 12 trayectorias iniciales
  (líder comunitario, activista, académico, periodista, asesor, empresario, sindicalista, ONG,
  concejal, diputado, representante, senador), familia, patrimonio, reputación y árbol de carrera.
- **Mundo procedural con semilla**: 12 partidos ficticios con facciones, ~650 políticos con
  personalidad, 33 departamentos con indicadores reales aproximados, gobernadores, alcaldes, medios.
- **Elecciones**: Congreso (Senado nacional con umbral del 3 %, Cámara por departamentos con
  umbral del 50 %/30 % del cociente, cifra repartidora, voto preferente, circunscripciones
  especiales y CITREP), Presidencia a dos vueltas, regionales. Campaña con aval o firmas, tope de
  gastos, equipo, eventos, pauta, debates, encuestas. **Noche electoral** animada por boletines.
- **Congreso visual**: Senado (semicírculo) y Cámara (herradura y mapa de circunscripciones),
  tarjeta de cada congresista al pasar el cursor, mesas directivas, bancadas, 7 comisiones
  constitucionales, composición gobierno/independientes/oposición, simulador de coaliciones,
  estabilidad de la coalición, orden del día y bitácora de actividad.
- **Legislación**: expediente de cada proyecto, trámite de 4 debates (8 para actos legislativos),
  ponencias, conciliación, sanción u objeción presidencial, archivo por tránsito de legislatura.
  Cabildeo, acuerdos con bancadas, enmiendas, presión mediática, **distancia de mayoría** y
  votaciones con **“¿Qué pasó?”** (quién cambió de posición y por qué).
- **Gobierno y oposición**: presidente IA, gabinete de 19 ministerios, agenda legislativa,
  debates de control político, mociones de censura, Consejo de Ministros, Centro de Oposición.
- **Presupuesto General de la Nación**: si eres presidente, formulas tú mismo el gasto público
  total y la participación de cada ministerio (con vista previa de déficit e indicadores); si no,
  lo formula el Gobierno según su ideología. Se radica cada 20 de julio como un proyecto de ley
  más (mismas herramientas de cabildeo y trámite); si el Congreso no lo aprueba a tiempo, rige la
  propuesta del Gobierno (art. 348 C.P.). Crisis sectoriales por subfinanciación con decisiones
  de emergencia (recortar otro sector o pedir crédito).
- **Economía y opinión**: indicadores macro con efectos rezagados (inmediatos, mediano y largo
  plazo), aprobación presidencial, imagen del jugador por región y segmento, encuestas.
- **Medios y eventos**: 14 medios ficticios, noticias, entrevistas; eventos procedurales con decisiones.
- **Guardado**: múltiples partidas (IndexedDB), autoguardado, exportar/importar `.json`,
  esquema versionado con migraciones.
- **Fecha de inicio libre (1900-2026)**: elige el año en que empieza tu carrera. Antes de 1991
  Colombia es bipartidista (sólo liberales y conservadores); entre 1958 y 1970 rige el Frente
  Nacional, con alternancia presidencial obligatoria y el Congreso repartido en partes iguales
  entre los dos partidos; gobernadores y alcaldes son designados, no elegidos, hasta 1991.
- **Ley para crear ministerios**: como presidente puedes proponer un proyecto de ley para crear un
  ministerio nuevo (nombre, sector y tamaño a tu elección); sigue el trámite legislativo normal y,
  al sancionarse, entra en funciones con su propio puesto en el presupuesto.
- **Gobierno local**: si ganas una gobernación o una alcaldía, manejas tu propio gabinete de
  secretarías, tu presupuesto regional y firmas decretos con efecto inmediato; crear una secretaría
  nueva necesita el visto bueno de la Asamblea o el Concejo.
- **Asambleas y Concejos con voto real**: la Asamblea Departamental o el Concejo Municipal de tu
  región tiene diputados o concejales elegidos de verdad (misma cifra repartidora que el Congreso,
  sobre el voto real del departamento); crear una secretaría se somete a una votación nominal real
  de cada uno de sus miembros, visible en su propio hemiciclo.
- **Mapa de municipios**: capa opcional con el contorno real de los 1122 municipios de Colombia
  (nombre, departamento y población al pasar el cursor), sobre el mismo mapa departamental.
- **Peso interno de partido y consultas internas**: tu peso frente a la dirección nacional y a la
  departamental (según el cargo que ocupes, tu experiencia y tu relación con el partido) decide
  qué tan buen renglón te da la dirección al armar una lista cerrada. Si prefieres no dejarlo en
  sus manos, puedes exigir una consulta interna: te mides contra otros aspirantes de tu propio
  partido en una noche de resultados aparte. Ganarla te hace cabeza de lista en Senado o Cámara,
  o el único candidato de tu partido en Gobernación, Alcaldía o Presidencia; perderla cierra esa
  puerta por un tiempo, igual que un aval negado.
- **Diputados y concejales con agenda propia**: si eres diputado de una Asamblea o concejal de un
  Concejo, tienes tu propia curul (real, dentro del hemiciclo) y una pestaña para radicar
  ordenanzas o acuerdos sobre salud, educación, infraestructura o seguridad, con una votación
  nominal real de tus colegas.
- **Dirección del partido y cuota burocrática**: puedes disputar la dirección nacional de tu
  partido en un congreso interno real; si la ganas y tu partido hace parte de la coalición de
  gobierno, puedes presionar por un ministerio para ti mismo. Consiguiéndolo te conviertes en
  ministro (por primera vez jugable, no sólo un cargo de político NPC) y desbloqueas tu propia
  **mesa de trabajo** del ministerio para avanzar la agenda del sector.
- **Familia y legado político**: tus hijos crecen con su propia educación, atributos y relación
  contigo (puedes pasar tiempo con ellos o pagarles estudios). Cuando te retiras o falleces (hay
  una probabilidad creciente de fallecer pasados los 68 años), si tienes un hijo mayor de edad
  puedes continuar la partida con él —hereda el apellido, algo de tu reconocimiento y parte del
  patrimonio— o cerrar la carrera ahí con un resumen de todo lo que lograste.
- **Propiedades y riesgo patrimonial**: compra apartamentos, fincas, locales o acciones que rentan
  cada semana y suben o bajan de valor con la economía; puedes venderlos de vuelta al precio de
  mercado. Un patrimonio que crece mucho más rápido de lo que explica tu sueldo declarado puede
  disparar un escándalo mediático por "¿de dónde sacó eso?".
- **Gabinete local mejorado**: como gobernador o alcalde eliges personalmente a cada secretario de
  despacho (de tu partido o de tus aliados), lanzas programas de política pública concretos por
  secretaría (seguridad, salud, educación, infraestructura, hacienda, planeación) con un efecto
  medible sobre el departamento o municipio, y puedes convocar un Consejo de gobierno local que
  sube tu favorabilidad y la aprobación de tus secretarios, igual que el Consejo de Ministros a
  nivel nacional.
- **Fundar un partido nuevo**: si tienes el patrimonio y el reconocimiento suficientes, puedes
  iniciar la recolección de firmas para fundar tu propio partido; cada semana avanza según tus
  redes y tu reconocimiento (o puedes impulsarla tú mismo), y al completar la meta nace el partido
  con vida propia y tú como su líder.
- **Coaliciones preelectorales y consulta interpartidista**: antes de una elección puedes proponerle
  a otros partidos una coalición a cambio de un ministerio, una secretaría o sólo respaldo político;
  si aceptan y ganas, se organiza una consulta interpartidista (como una consulta interna, pero entre
  varios partidos) para escoger un candidato único de la coalición a Presidencia, Gobernación,
  Alcaldía o Congreso. Ganar la consulta te vuelve el candidato de todos los aliados; ganar la
  elección después cumple lo pactado —tus aliados reciben el ministerio o la secretaría prometida—.
- **Reelección presidencial histórica**: la reelección inmediata está prohibida salvo entre 2005 y
  2015 (como ocurrió realmente en Colombia), y sólo se permite una vez.
- **Aprobación por tema**: además de la aprobación general, cada encuesta mide qué tan bien te ven
  en seguridad, economía, salud y lucha contra la corrupción.
- **Corrupción**: financia tu campaña por fuera del tope legal o reparte cupos burocráticos y obras
  a una bancada a cambio de apoyo (mermelada) — más barato y más rápido que negociar de buena fe,
  pero deja un rastro.
- **Sistema judicial**: ese rastro puede convertirse en una investigación real de la Fiscalía, con
  sus propias etapas; puedes contratar defensa legal para ralentizarla. Una condena hace perder la
  investidura o, en los casos más graves, termina la carrera política por completo.
- **Orden público**: tres grupos armados ficticios controlan territorio de fondo y atacan de vez en
  cuando. Como presidente puedes ordenar ofensivas militares para debilitarlos o abrir una mesa de
  negociación y ceder concesiones hasta lograr un acuerdo de paz real.
- **Diplomacia**: cinco países ficticios con relaciones bilaterales propias; como presidente puedes
  convocar cumbres o firmar tratados de comercio, cooperación o defensa. Si ocupas el Ministerio de
  Relaciones Exteriores, su mesa de trabajo mejora la relación con los países peor calificados.

## Arquitectura

Ver [`docs/DISENO.md`](docs/DISENO.md) (arquitectura, modelo de datos, sistemas y roadmap).

```
├── index.html          shell + orden de carga
├── css/                base · layout · componentes · pantallas
├── data/               datos estáticos (mapa, departamentos, partidos, instituciones…)
├── js/core/            utilidades, bus de eventos, estado, motor de turnos, acciones
├── js/sistemas/        simulación (un módulo por sistema, registrado en el motor de turnos)
├── js/ui/              gráficos SVG, hemiciclo, mapa, componentes
├── js/pantallas/       una pantalla por módulo
└── js/app.js           navegación y control del tiempo
```

Créditos: geometría de departamentos derivada de `@john-guerra/geo-colombia` (MIT), ver `data/LICENCIA-mapa.txt`.
