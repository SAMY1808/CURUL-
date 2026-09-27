/* Países reales del mundo (los 192 miembros de la ONU distintos de Colombia, más Kosovo) para el
   sistema de diplomacia. `region` agrupa la lista en la interfaz. `paisesDestacados` cura una
   relación inicial e inclinación ideológica realistas para los vecinos, las potencias y algunos
   socios relevantes; el resto arranca en un valor genérico por región (ver Diplomacia.init). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};

CURUL.DATA.paises = [
  // Suramérica
  ['ARG', 'Argentina', 'Suramérica'], ['BOL', 'Bolivia', 'Suramérica'], ['BRA', 'Brasil', 'Suramérica'],
  ['CHL', 'Chile', 'Suramérica'], ['ECU', 'Ecuador', 'Suramérica'], ['GUY', 'Guyana', 'Suramérica'],
  ['PRY', 'Paraguay', 'Suramérica'], ['PER', 'Perú', 'Suramérica'], ['SUR', 'Surinam', 'Suramérica'],
  ['URY', 'Uruguay', 'Suramérica'], ['VEN', 'Venezuela', 'Suramérica'],
  // Centroamérica y Caribe
  ['BLZ', 'Belice', 'Centroamérica y Caribe'], ['CRI', 'Costa Rica', 'Centroamérica y Caribe'],
  ['SLV', 'El Salvador', 'Centroamérica y Caribe'], ['GTM', 'Guatemala', 'Centroamérica y Caribe'],
  ['HND', 'Honduras', 'Centroamérica y Caribe'], ['MEX', 'México', 'Centroamérica y Caribe'],
  ['NIC', 'Nicaragua', 'Centroamérica y Caribe'], ['PAN', 'Panamá', 'Centroamérica y Caribe'],
  ['ATG', 'Antigua y Barbuda', 'Centroamérica y Caribe'], ['BHS', 'Bahamas', 'Centroamérica y Caribe'],
  ['BRB', 'Barbados', 'Centroamérica y Caribe'], ['CUB', 'Cuba', 'Centroamérica y Caribe'],
  ['DMA', 'Dominica', 'Centroamérica y Caribe'], ['GRD', 'Granada', 'Centroamérica y Caribe'],
  ['HTI', 'Haití', 'Centroamérica y Caribe'], ['JAM', 'Jamaica', 'Centroamérica y Caribe'],
  ['DOM', 'República Dominicana', 'Centroamérica y Caribe'], ['KNA', 'San Cristóbal y Nieves', 'Centroamérica y Caribe'],
  ['VCT', 'San Vicente y las Granadinas', 'Centroamérica y Caribe'], ['LCA', 'Santa Lucía', 'Centroamérica y Caribe'],
  ['TTO', 'Trinidad y Tobago', 'Centroamérica y Caribe'],
  // Norteamérica
  ['USA', 'Estados Unidos', 'Norteamérica'], ['CAN', 'Canadá', 'Norteamérica'],
  // Europa
  ['ALB', 'Albania', 'Europa'], ['AND', 'Andorra', 'Europa'], ['AUT', 'Austria', 'Europa'],
  ['BLR', 'Bielorrusia', 'Europa'], ['BEL', 'Bélgica', 'Europa'], ['BIH', 'Bosnia y Herzegovina', 'Europa'],
  ['BGR', 'Bulgaria', 'Europa'], ['HRV', 'Croacia', 'Europa'], ['CYP', 'Chipre', 'Europa'],
  ['CZE', 'Chequia', 'Europa'], ['DNK', 'Dinamarca', 'Europa'], ['EST', 'Estonia', 'Europa'],
  ['FIN', 'Finlandia', 'Europa'], ['FRA', 'Francia', 'Europa'], ['DEU', 'Alemania', 'Europa'],
  ['GRC', 'Grecia', 'Europa'], ['HUN', 'Hungría', 'Europa'], ['ISL', 'Islandia', 'Europa'],
  ['IRL', 'Irlanda', 'Europa'], ['ITA', 'Italia', 'Europa'], ['LVA', 'Letonia', 'Europa'],
  ['LIE', 'Liechtenstein', 'Europa'], ['LTU', 'Lituania', 'Europa'], ['LUX', 'Luxemburgo', 'Europa'],
  ['MLT', 'Malta', 'Europa'], ['MDA', 'Moldavia', 'Europa'], ['MCO', 'Mónaco', 'Europa'],
  ['MNE', 'Montenegro', 'Europa'], ['NLD', 'Países Bajos', 'Europa'], ['MKD', 'Macedonia del Norte', 'Europa'],
  ['NOR', 'Noruega', 'Europa'], ['POL', 'Polonia', 'Europa'], ['PRT', 'Portugal', 'Europa'],
  ['ROU', 'Rumania', 'Europa'], ['RUS', 'Rusia', 'Europa'], ['SMR', 'San Marino', 'Europa'],
  ['SRB', 'Serbia', 'Europa'], ['SVK', 'Eslovaquia', 'Europa'], ['SVN', 'Eslovenia', 'Europa'],
  ['ESP', 'España', 'Europa'], ['SWE', 'Suecia', 'Europa'], ['CHE', 'Suiza', 'Europa'],
  ['UKR', 'Ucrania', 'Europa'], ['GBR', 'Reino Unido', 'Europa'], ['XKX', 'Kosovo', 'Europa'],
  // Asia
  ['AFG', 'Afganistán', 'Asia'], ['ARM', 'Armenia', 'Asia'], ['AZE', 'Azerbaiyán', 'Asia'],
  ['BHR', 'Baréin', 'Asia'], ['BGD', 'Bangladés', 'Asia'], ['BTN', 'Bután', 'Asia'],
  ['BRN', 'Brunéi', 'Asia'], ['KHM', 'Camboya', 'Asia'], ['CHN', 'China', 'Asia'],
  ['GEO', 'Georgia', 'Asia'], ['IND', 'India', 'Asia'], ['IDN', 'Indonesia', 'Asia'],
  ['IRN', 'Irán', 'Asia'], ['IRQ', 'Irak', 'Asia'], ['ISR', 'Israel', 'Asia'],
  ['JPN', 'Japón', 'Asia'], ['JOR', 'Jordania', 'Asia'], ['KAZ', 'Kazajistán', 'Asia'],
  ['KWT', 'Kuwait', 'Asia'], ['KGZ', 'Kirguistán', 'Asia'], ['LAO', 'Laos', 'Asia'],
  ['LBN', 'Líbano', 'Asia'], ['MYS', 'Malasia', 'Asia'], ['MDV', 'Maldivas', 'Asia'],
  ['MNG', 'Mongolia', 'Asia'], ['MMR', 'Myanmar', 'Asia'], ['NPL', 'Nepal', 'Asia'],
  ['PRK', 'Corea del Norte', 'Asia'], ['OMN', 'Omán', 'Asia'], ['PAK', 'Pakistán', 'Asia'],
  ['PHL', 'Filipinas', 'Asia'], ['QAT', 'Catar', 'Asia'], ['SAU', 'Arabia Saudita', 'Asia'],
  ['SGP', 'Singapur', 'Asia'], ['KOR', 'Corea del Sur', 'Asia'], ['LKA', 'Sri Lanka', 'Asia'],
  ['SYR', 'Siria', 'Asia'], ['TJK', 'Tayikistán', 'Asia'], ['THA', 'Tailandia', 'Asia'],
  ['TLS', 'Timor Oriental', 'Asia'], ['TUR', 'Turquía', 'Asia'], ['TKM', 'Turkmenistán', 'Asia'],
  ['ARE', 'Emiratos Árabes Unidos', 'Asia'], ['UZB', 'Uzbekistán', 'Asia'], ['VNM', 'Vietnam', 'Asia'],
  ['YEM', 'Yemen', 'Asia'],
  // África
  ['DZA', 'Argelia', 'África'], ['AGO', 'Angola', 'África'], ['BEN', 'Benín', 'África'],
  ['BWA', 'Botsuana', 'África'], ['BFA', 'Burkina Faso', 'África'], ['BDI', 'Burundi', 'África'],
  ['CPV', 'Cabo Verde', 'África'], ['CMR', 'Camerún', 'África'], ['CAF', 'República Centroafricana', 'África'],
  ['TCD', 'Chad', 'África'], ['COM', 'Comoras', 'África'], ['COG', 'Congo', 'África'],
  ['COD', 'República Democrática del Congo', 'África'], ['CIV', 'Costa de Marfil', 'África'],
  ['DJI', 'Yibuti', 'África'], ['EGY', 'Egipto', 'África'], ['GNQ', 'Guinea Ecuatorial', 'África'],
  ['ERI', 'Eritrea', 'África'], ['SWZ', 'Esuatini', 'África'], ['ETH', 'Etiopía', 'África'],
  ['GAB', 'Gabón', 'África'], ['GMB', 'Gambia', 'África'], ['GHA', 'Ghana', 'África'],
  ['GIN', 'Guinea', 'África'], ['GNB', 'Guinea-Bisáu', 'África'], ['KEN', 'Kenia', 'África'],
  ['LSO', 'Lesoto', 'África'], ['LBR', 'Liberia', 'África'], ['LBY', 'Libia', 'África'],
  ['MDG', 'Madagascar', 'África'], ['MWI', 'Malaui', 'África'], ['MLI', 'Malí', 'África'],
  ['MRT', 'Mauritania', 'África'], ['MUS', 'Mauricio', 'África'], ['MAR', 'Marruecos', 'África'],
  ['MOZ', 'Mozambique', 'África'], ['NAM', 'Namibia', 'África'], ['NER', 'Níger', 'África'],
  ['NGA', 'Nigeria', 'África'], ['RWA', 'Ruanda', 'África'], ['STP', 'Santo Tomé y Príncipe', 'África'],
  ['SEN', 'Senegal', 'África'], ['SYC', 'Seychelles', 'África'], ['SLE', 'Sierra Leona', 'África'],
  ['SOM', 'Somalia', 'África'], ['ZAF', 'Sudáfrica', 'África'], ['SSD', 'Sudán del Sur', 'África'],
  ['SDN', 'Sudán', 'África'], ['TZA', 'Tanzania', 'África'], ['TGO', 'Togo', 'África'],
  ['TUN', 'Túnez', 'África'], ['UGA', 'Uganda', 'África'], ['ZMB', 'Zambia', 'África'],
  ['ZWE', 'Zimbabue', 'África'],
  // Oceanía
  ['AUS', 'Australia', 'Oceanía'], ['FJI', 'Fiyi', 'Oceanía'], ['KIR', 'Kiribati', 'Oceanía'],
  ['MHL', 'Islas Marshall', 'Oceanía'], ['FSM', 'Micronesia', 'Oceanía'], ['NRU', 'Nauru', 'Oceanía'],
  ['NZL', 'Nueva Zelanda', 'Oceanía'], ['PLW', 'Palaos', 'Oceanía'], ['PNG', 'Papúa Nueva Guinea', 'Oceanía'],
  ['WSM', 'Samoa', 'Oceanía'], ['SLB', 'Islas Salomón', 'Oceanía'], ['TON', 'Tonga', 'Oceanía'],
  ['TUV', 'Tuvalu', 'Oceanía'], ['VUT', 'Vanuatu', 'Oceanía']
].map(p => ({ id: p[0], nombre: p[1], region: p[2] }));

/* Vecinos, potencias y socios relevantes: relación inicial (0-100) e inclinación ideológica
   aproximada (mismos ejes que el jugador), usada para que la relación derive con el tiempo según
   quién gobierne en Colombia. El resto de los 193 países no tiene entrada aquí y arranca en un
   valor genérico por región (ver `Diplomacia.init`), sin ideología que la haga derivar. */
CURUL.DATA.paisesDestacados = {
  VEN: { relacion: 38, eco: -60, soc: -30, nota: 'Vecino: frontera de 2.200 km, relación históricamente volátil' },
  ECU: { relacion: 62, eco: -10, soc: 10, nota: 'Vecino' },
  PER: { relacion: 65, eco: 20, soc: 15, nota: 'Vecino' },
  PAN: { relacion: 68, eco: 30, soc: 10, nota: 'Vecino' },
  BRA: { relacion: 60, eco: 0, soc: 0, nota: 'Vecino y mayor economía de la región' },
  MEX: { relacion: 60, eco: -10, soc: 5, nota: 'Socio histórico en la Alianza del Pacífico' },
  USA: { relacion: 70, eco: 55, soc: -10, nota: 'Aliado estratégico principal' },
  CHN: { relacion: 55, eco: 20, soc: -50, nota: 'Segundo socio comercial' },
  RUS: { relacion: 40, eco: 10, soc: -60, nota: '' },
  ESP: { relacion: 72, eco: 10, soc: 10, nota: 'Lazos históricos y culturales' },
  CUB: { relacion: 45, eco: -70, soc: -30, nota: '' },
  NIC: { relacion: 35, eco: -50, soc: -40, nota: 'Relación tensa por el diferendo limítrofe' },
  DEU: { relacion: 60, eco: 15, soc: 15, nota: '' },
  FRA: { relacion: 62, eco: 5, soc: 10, nota: '' },
  GBR: { relacion: 60, eco: 35, soc: 5, nota: '' },
  KOR: { relacion: 55, eco: 40, soc: 10, nota: '' },
  ISR: { relacion: 50, eco: 30, soc: -20, nota: '' }
};
