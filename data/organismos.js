/* Organismos multilaterales reales, de los que Colombia hace parte y de los que no, para el
   sistema de diplomacia. `miembro` es el estado real al día de hoy (punto de partida de la
   partida); `puedeUnirse`/`puedeRetirarse` acotan qué es jugable para mantenerlo creíble (nadie
   saca a Colombia de la ONU con una acción, y no va a entrar a la Unión Europea). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};

CURUL.DATA.organismos = [
  { id: 'onu', nombre: 'Organización de las Naciones Unidas', sigla: 'ONU', tipo: 'universal', miembro: true, puedeUnirse: false, puedeRetirarse: false },
  { id: 'oea', nombre: 'Organización de Estados Americanos', sigla: 'OEA', tipo: 'regional', miembro: true, puedeUnirse: false, puedeRetirarse: true, probIngreso: 0 },
  { id: 'can', nombre: 'Comunidad Andina', sigla: 'CAN', tipo: 'regional', miembro: true, puedeUnirse: false, puedeRetirarse: true, probIngreso: 0 },
  { id: 'ap', nombre: 'Alianza del Pacífico', sigla: 'AP', tipo: 'economico', miembro: true, puedeUnirse: false, puedeRetirarse: true, probIngreso: 0 },
  { id: 'celac', nombre: 'Comunidad de Estados Latinoamericanos y Caribeños', sigla: 'CELAC', tipo: 'regional', miembro: true, puedeUnirse: false, puedeRetirarse: true, probIngreso: 0 },
  { id: 'aladi', nombre: 'Asociación Latinoamericana de Integración', sigla: 'ALADI', tipo: 'economico', miembro: true, puedeUnirse: false, puedeRetirarse: true, probIngreso: 0 },
  { id: 'ocde', nombre: 'Organización para la Cooperación y el Desarrollo Económicos', sigla: 'OCDE', tipo: 'economico', miembro: true, puedeUnirse: false, puedeRetirarse: true, probIngreso: 0 },
  { id: 'mercosur', nombre: 'Mercado Común del Sur', sigla: 'MERCOSUR', tipo: 'economico', miembro: false, puedeUnirse: true, puedeRetirarse: true, probIngreso: 0.3, nota: 'Colombia es Estado Asociado, no miembro pleno' },
  { id: 'otan', nombre: 'Organización del Tratado del Atlántico Norte', sigla: 'OTAN', tipo: 'militar', miembro: false, puedeUnirse: false, puedeRetirarse: false, nota: 'Colombia es Socio Global desde 2018, no miembro' },
  { id: 'unasur', nombre: 'Unión de Naciones Suramericanas', sigla: 'UNASUR', tipo: 'regional', miembro: false, puedeUnirse: true, puedeRetirarse: true, probIngreso: 0.35, nota: 'Colombia se retiró en 2018' },
  { id: 'brics', nombre: 'BRICS', sigla: 'BRICS', tipo: 'economico', miembro: false, puedeUnirse: true, puedeRetirarse: true, probIngreso: 0.15 },
  { id: 'caricom', nombre: 'Comunidad del Caribe', sigla: 'CARICOM', tipo: 'regional', miembro: false, puedeUnirse: true, puedeRetirarse: true, probIngreso: 0.25 },
  { id: 'ue', nombre: 'Unión Europea', sigla: 'UE', tipo: 'economico', miembro: false, puedeUnirse: false, puedeRetirarse: false, nota: 'Colombia no es un país europeo: no es elegible' },
  { id: 'ligaarabe', nombre: 'Liga de Estados Árabes', sigla: 'Liga Árabe', tipo: 'regional', miembro: false, puedeUnirse: false, puedeRetirarse: false, nota: 'Sin elegibilidad geográfica' }
];
