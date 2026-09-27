/* Federalización: el paso de Estado unitario descentralizado a Estado federal no cabe en un solo
   referendo — exige transferir, una por una, las competencias de seis sectores del Gobierno
   nacional a gobernaciones y alcaldías (mismas secretarías que ya existen en GobiernoLocal). Una
   vez transferidas las seis, el país queda constituido como Estado federal (artículo
   `autonomiaTerritorial` de la Constitución) y no hay vuelta atrás por una vía simple. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const COMPETENCIAS = {
    gobierno: 'Seguridad y orden público', hacienda: 'Recaudo y tributos propios',
    salud: 'Salud', educacion: 'Educación', infraestructura: 'Infraestructura y transporte',
    planeacion: 'Planeación y ordenamiento territorial'
  };
  const MULTIPLICADOR = 1.6;

  const F = {
    COMPETENCIAS,
    multiplicador(E, secId) {
      const f = E.federalizacion;
      return (f && f.competencias && f.competencias[secId] && f.competencias[secId].transferida) ? MULTIPLICADOR : 1;
    },
    enCurso(E) { return !!E.federalizacion; },
    registrarAcciones() {
      const A = C.Acciones;
      const esPresidente = E => E.gobierno.presidente === 'J' || 'Sólo el Presidente';
      A.registrar({ id: 'iniciarFederalizacion', nombre: 'Iniciar la federalización', icono: '🗺', grupo: 'constitucion', costo: 5,
        disponible(E) {
          if (esPresidente(E) !== true) return esPresidente(E);
          if (C.Constitucion.valor(E, 'autonomiaTerritorial') !== 'descentralizada') return 'Primero necesitas que el país sea una unitaria descentralizada (reforma o constituyente)';
          if (E.federalizacion) return 'El proceso de federalización ya está en curso';
          return true;
        },
        ejecutar(E) {
          const competencias = {}; for (const id of Object.keys(COMPETENCIAS)) competencias[id] = { transferida: false };
          E.federalizacion = { t: E.fecha.t, competencias };
          C.Medios.noticia(E, { tipo: 'constitucion', titular: 'El Gobierno inicia el proceso de federalización: transferirá competencias a las regiones', tono: 0, importante: true, jugador: true });
          return { ok: true, msg: 'Arranca el proceso de federalización' };
        } });
      A.registrar({ id: 'transferirCompetencia', nombre: 'Transferir competencia a las regiones', icono: '🤝', grupo: 'constitucion', costo: 3,
        disponible(E, a) {
          if (esPresidente(E) !== true) return esPresidente(E);
          if (!E.federalizacion) return 'Primero debes iniciar el proceso de federalización';
          const c = E.federalizacion.competencias[a.competencia]; if (!c) return 'Elige una competencia';
          if (c.transferida) return 'Esa competencia ya está transferida';
          return true;
        },
        ejecutar(E, a) {
          const c = E.federalizacion.competencias[a.competencia];
          c.transferida = true; c.t = E.fecha.t;
          for (const d of Object.values(E.deptos)) {
            const campo = { gobierno: 'seguridad', salud: 'salud', educacion: 'educacion', infraestructura: 'infraestructura' }[a.competencia];
            if (campo) d[campo] = U.clamp(d[campo] + U.rf(0.5, 1.5), 1, 99);
          }
          C.Medios.noticia(E, { tipo: 'constitucion', titular: `Se transfiere a gobernaciones y alcaldías la competencia de ${COMPETENCIAS[a.competencia].toLowerCase()}`, tono: 1, importante: true, jugador: true });
          const faltan = Object.values(E.federalizacion.competencias).filter(x => !x.transferida).length;
          if (!faltan) {
            C.Constitucion.aplicar(E, 'autonomiaTerritorial', 'federal', 'federalizacion');
            E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + U.rf(3, 8), 3, 95);
            C.Medios.noticia(E, { tipo: 'constitucion', titular: 'Colombia queda constituida como Estado federal', tono: 1, importante: true, jugador: true });
          }
          return { ok: true, msg: faltan ? `Competencia transferida. Faltan ${faltan}.` : 'Última competencia transferida: Colombia es ahora un Estado federal' };
        } });
    }
  };

  C.Federalizacion = F;
  F.registrarAcciones();
})(window.CURUL);
