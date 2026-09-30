/* Datos geográficos y geopolíticos para el mundo vivo: coordenadas aproximadas (para el mapa de casillas),
   PIB (miles de millones de USD) y población (millones) de los países grandes, régimen político y bloques.
   Lo que no está curado se genera con valores razonables por región (ver MundoVivo.init). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
(function (C) {
  const t = s => Object.fromEntries(s.trim().split(/\s+/).map(x => { const [id, a, b] = x.split(':'); return [id, [+a, +b]]; }));
  // id:lon:lat
  C.DATA.coords = t(`
ARG:-64:-34 BOL:-64:-17 BRA:-52:-10 CHL:-71:-33 ECU:-78:-1 GUY:-59:5 PRY:-58:-23 PER:-75:-10 SUR:-56:4 URY:-56:-33 VEN:-66:7
BLZ:-88:17 CRI:-84:10 SLV:-89:13.5 GTM:-90.5:15.5 HND:-87:15 MEX:-102:23 NIC:-85:13 PAN:-80:8.5 ATG:-61.8:17 BHS:-77:25 BRB:-59.5:13 CUB:-79:22
DMA:-61.3:15.4 GRD:-61.7:12.1 HTI:-72.5:19 JAM:-77:18 DOM:-70:19 KNA:-62.7:17.3 VCT:-61.2:13.2 LCA:-61:13.9 TTO:-61:10.5 USA:-98:39 CAN:-105:58
ALB:20:41 AND:1.5:42.5 AUT:14:47 BLR:28:53.5 BEL:4.5:50.5 BIH:18:44 BGR:25:42.7 HRV:16:45 CYP:33:35 CZE:15.5:49.8 DNK:10:56 EST:25:58.7 FIN:26:64 FRA:2:46.5 DEU:10:51 GRC:22:39
HUN:19:47 ISL:-19:65 IRL:-8:53 ITA:12.5:42.5 LVA:25:57 LIE:9.5:47.2 LTU:24:55.3 LUX:6:49.8 MLT:14.4:35.9 MDA:28.5:47 MCO:7.4:43.7 MNE:19.3:42.7 NLD:5.5:52.3 MKD:21.7:41.6 NOR:9:61
POL:19:52 PRT:-8:39.5 ROU:25:46 RUS:60:58 SMR:12.5:43.9 SRB:21:44 SVK:19.5:48.7 SVN:14.8:46.1 ESP:-3.7:40 SWE:15:62 CHE:8.2:46.8 UKR:31:49 GBR:-2:54 XKX:20.9:42.6
AFG:66:34 ARM:45:40 AZE:47.5:40.3 BHR:50.5:26 BGD:90:24 BTN:90.4:27.5 BRN:114.7:4.5 KHM:105:12.5 CHN:103:35 GEO:43.5:42 IND:79:22 IDN:114:-2 IRN:53:32 IRQ:44:33 ISR:35:31.5 JPN:138:36
JOR:36.5:31 KAZ:67:48 KWT:47.6:29.3 KGZ:74.6:41.2 LAO:103:18.5 LBN:35.8:33.9 MYS:102:4 MDV:73.5:3.2 MNG:104:46.8 MMR:96:21 NPL:84:28.4 PRK:127:40 OMN:57:21 PAK:69:30 PHL:122:12.5 QAT:51.2:25.3
SAU:45:24 SGP:103.8:1.4 KOR:127.8:36.5 LKA:80.7:7.8 SYR:38:35 TJK:71:38.8 THA:101:15 TLS:125.7:-8.8 TUR:35:39 TKM:59:39 ARE:54:24 UZB:64:41.5 VNM:106:16 YEM:47.6:15.5
DZA:2.6:28 AGO:17.5:-12 BEN:2.3:9.3 BWA:24:-22 BFA:-1.5:12.3 BDI:29.9:-3.4 CPV:-23.6:15.1 CMR:12.5:5.7 CAF:20.9:6.6 TCD:18.7:15.4 COM:43.3:-11.7 COG:15.2:-0.7 COD:23.6:-2.9 CIV:-5.5:7.5 DJI:42.6:11.8
EGY:30:26.5 GNQ:10.3:1.6 ERI:39:15.2 SWZ:31.5:-26.5 ETH:39.5:8.6 GAB:11.6:-0.8 GMB:-15.4:13.4 GHA:-1.2:7.9 GIN:-10.9:10.9 GNB:-15:12 KEN:38:0.5 LSO:28.2:-29.6 LBR:-9.4:6.4 LBY:17:27 MDG:46.8:-19
MWI:34.3:-13.3 MLI:-4:17.6 MRT:-10.9:20.3 MUS:57.5:-20.3 MAR:-6.8:31.8 MOZ:35.5:-18.7 NAM:17.1:-22.6 NER:8:16 NGA:8:9.5 RWA:29.9:-1.9 STP:6.6:0.3 SEN:-14.5:14.5 SYC:55.5:-4.7 SLE:-11.8:8.5 SOM:46:5.1
ZAF:25:-29 SSD:30.5:7.3 SDN:30:15.5 TZA:34.9:-6.4 TGO:1:8.6 TUN:9.5:34 UGA:32.3:1.4 ZMB:27.8:-13.5 ZWE:29.8:-19 COL:-73:4
AUS:134:-25 FJI:178:-17.7 KIR:-157:1.9 MHL:171:7.1 FSM:158:6.9 NRU:166.9:-0.5 NZL:172:-41 PLW:134.6:7.5 PNG:144:-6.3 WSM:-172:-13.8 SLB:160:-9.6 TON:-175:-21.2 TUV:179:-8.5 VUT:167:-16
`);
  // PIB (mil millones USD) y población (millones) de los países grandes o relevantes
  C.DATA.economias = {
    USA: [27000, 335], CHN: [18000, 1410], DEU: [4500, 84], JPN: [4200, 124], IND: [3700, 1430], GBR: [3300, 67], FRA: [3100, 68], ITA: [2300, 59], BRA: [2200, 216], CAN: [2100, 40], RUS: [2000, 144],
    MEX: [1800, 128], KOR: [1700, 52], AUS: [1700, 26], ESP: [1500, 48], IDN: [1400, 277], TUR: [1100, 85], NLD: [1100, 18], SAU: [1100, 36], CHE: [900, 9], POL: [800, 38], ARG: [640, 46], BEL: [600, 12],
    SWE: [590, 10], IRL: [550, 5], THA: [510, 72], ARE: [500, 10], AUT: [500, 9], NOR: [480, 5], ISR: [510, 10], SGP: [500, 6], VNM: [430, 99], MYS: [400, 34], ZAF: [380, 60], PHL: [430, 117], DNK: [400, 6],
    EGY: [400, 112], BGD: [440, 173], IRN: [400, 89], PAK: [340, 240], CHL: [340, 20], COL: [360, 52], FIN: [300, 6], PRT: [290, 10], CZE: [330, 11], ROU: [350, 19], PER: [270, 34], NGA: [360, 223], GRC: [240, 10],
    UKR: [160, 38], KAZ: [260, 20], IRQ: [270, 45], DZA: [240, 45], MAR: [140, 37], ETH: [160, 126], KEN: [110, 55], ECU: [120, 18], VEN: [90, 28], CUB: [110, 11], PAN: [80, 4.4], CRI: [85, 5], DOM: [120, 11],
    NZL: [250, 5], HUN: [200, 10], AGO: [90, 35], GHA: [75, 34], TZA: [80, 67], LKA: [75, 22], MMR: [65, 55], UZB: [90, 36], KWT: [160, 4.3], QAT: [220, 2.7], PRK: [30, 26], SYR: [15, 22], YEM: [20, 34], AFG: [15, 42]
  };
  C.DATA.regimenes = {
    autoritario: 'CHN RUS PRK IRN CUB VEN NIC BLR SYR TKM TJK UZB AZE ERI ETH SDN SSD EGY CAF TCD GNQ COG GAB CMR BDI RWA UGA DJI LAO VNM KHM MMR AFG',
    monarquia: 'SAU ARE QAT KWT BHR OMN JOR MAR SWZ BTN BRN GBR ESP NOR SWE DNK BEL NLD LUX LIE MCO AND JPN THA TON',
    hibrido: 'TUR PAK KAZ KGZ EGY HND GTM SLV HTI BGD LBY MLI BFA NER GIN TGO CIV DZA TUN IRQ LBN LKA'
  };
  /* Bloques: tipo, líder y miembros. `alin` es el eje del mapa geopolítico (occidente, multipolar, bolivariano). */
  const africa = 'DZA AGO BEN BWA BFA BDI CPV CMR CAF TCD COM COG COD CIV DJI EGY GNQ ERI SWZ ETH GAB GMB GHA GIN GNB KEN LSO LBR LBY MDG MWI MLI MRT MUS MAR MOZ NAM NER NGA RWA STP SEN SYC SLE SOM ZAF SSD SDN TZA TGO TUN UGA ZMB ZWE';
  const latam = 'ARG BOL BRA CHL COL ECU GUY PRY PER SUR URY VEN BLZ CRI SLV GTM HND MEX NIC PAN ATG BHS BRB CUB DMA GRD HTI JAM DOM KNA VCT LCA TTO';
  const L = s => s.trim().split(/\s+/);
  C.DATA.bloques = [
    { id: 'otan', n: 'OTAN', tipo: 'militar', alin: 'occidente', lider: 'USA', color: '#4C7FE0', m: L('ALB BEL BGR CAN HRV CZE DNK EST FIN FRA DEU GRC HUN ISL ITA LVA LTU LUX MNE NLD MKD NOR POL PRT ROU SVK SVN ESP SWE TUR GBR USA') },
    { id: 'ue', n: 'Unión Europea', tipo: 'economico', alin: 'occidente', lider: 'DEU', color: '#6CC4F5', m: L('AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE') },
    { id: 'g7', n: 'G7', tipo: 'politico', alin: 'occidente', lider: 'USA', color: '#8FB5E8', m: L('USA CAN GBR FRA DEU ITA JPN') },
    { id: 'brics', n: 'BRICS+', tipo: 'economico', alin: 'multipolar', lider: 'CHN', color: '#E0504A', m: L('BRA RUS IND CHN ZAF EGY ETH IRN ARE') },
    { id: 'ocs', n: 'Organización de Shanghái', tipo: 'militar', alin: 'multipolar', lider: 'CHN', color: '#E8A33D', m: L('CHN RUS IND PAK KAZ KGZ TJK UZB IRN BLR') },
    { id: 'alba', n: 'ALBA', tipo: 'politico', alin: 'bolivariano', lider: 'VEN', color: '#B58FE8', m: L('VEN CUB NIC BOL ATG DMA GRD VCT LCA') },
    { id: 'mercosur', n: 'Mercosur', tipo: 'economico', alin: null, lider: 'BRA', color: '#3FBF7A', m: L('ARG BRA PRY URY BOL') },
    { id: 'can', n: 'Comunidad Andina', tipo: 'economico', alin: null, lider: 'PER', color: '#2FA58A', m: L('ECU PER BOL') },
    { id: 'ap', n: 'Alianza del Pacífico', tipo: 'economico', alin: 'occidente', lider: 'MEX', color: '#5DB85A', m: L('CHL PER MEX') },
    { id: 'celac', n: 'CELAC', tipo: 'politico', alin: null, lider: 'MEX', color: '#9BD66C', m: L(latam) },
    { id: 'caricom', n: 'CARICOM', tipo: 'economico', alin: null, lider: 'JAM', color: '#E8C547', m: L('ATG BHS BRB BLZ DMA GRD GUY HTI JAM KNA LCA VCT SUR TTO') },
    { id: 'asean', n: 'ASEAN', tipo: 'economico', alin: null, lider: 'IDN', color: '#F08A5D', m: L('BRN KHM IDN LAO MYS MMR PHL SGP THA VNM TLS') },
    { id: 'ua', n: 'Unión Africana', tipo: 'politico', alin: null, lider: 'ZAF', color: '#C9A227', m: L(africa) },
    { id: 'liga', n: 'Liga Árabe', tipo: 'politico', alin: null, lider: 'SAU', color: '#D9B45A', m: L('DZA BHR COM DJI EGY IRQ JOR KWT LBN LBY MRT MAR OMN QAT SAU SOM SDN SYR TUN ARE YEM') },
    { id: 'opep', n: 'OPEP', tipo: 'economico', alin: null, lider: 'SAU', color: '#8C96A3', m: L('SAU IRN IRQ KWT ARE VEN LBY DZA NGA AGO GAB COG GNQ') }
  ];
  C.DATA.aliadosOccidente = L('JPN KOR AUS NZL ISR PHL SGP');
  C.DATA.aliadosMultipolar = L('SYR PRK MMR');
  C.DATA.conflictos = [
    { id: 'rus-ukr', a: 'RUS', b: 'UKR', n: 'Guerra Rusia–Ucrania', t: 55, guerra: { y: 2022, m: 1 } },
    { id: 'isr-irn', a: 'ISR', b: 'IRN', n: 'Israel–Irán', t: 60 },
    { id: 'ind-pak', a: 'IND', b: 'PAK', n: 'India–Pakistán (Cachemira)', t: 45 },
    { id: 'kor', a: 'KOR', b: 'PRK', n: 'Península de Corea', t: 50 },
    { id: 'arm-aze', a: 'ARM', b: 'AZE', n: 'Armenia–Azerbaiyán', t: 40 },
    { id: 'eth-egy', a: 'ETH', b: 'EGY', n: 'Presa del Nilo', t: 35 },
    { id: 'ven-guy', a: 'VEN', b: 'GUY', n: 'Esequibo', t: 40 },
    { id: 'sau-irn', a: 'SAU', b: 'IRN', n: 'Golfo Pérsico', t: 40 },
    { id: 'chn-jpn', a: 'CHN', b: 'JPN', n: 'Mar de China Oriental', t: 38 }
  ];
})(window.CURUL);
