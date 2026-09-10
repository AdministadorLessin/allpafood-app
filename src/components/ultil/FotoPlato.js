import React from 'react';

/**
 * La foto de un plato, o un marcador digno cuando todavia no hay foto.
 *
 * De 160 platos del catalogo, 11 tienen imagen. Antes el hueco se pintaba
 * vacio: en la pantalla donde el cliente elige aparecian tres cuadros en
 * blanco, que no se lee como "falta la foto" sino como que la app esta rota.
 *
 * El marcador cambia segun lo que sea. Un plato de fondo, una bebida y un
 * snack no son la misma cosa y no deben verse igual: en la lista del dia el
 * cliente distingue de un vistazo que esta eligiendo y que ya viene incluido,
 * sin leer los titulos.
 *
 * Cuando se carguen las fotos desde el admin, esto desaparece solo, plato por
 * plato. No hay que volver a tocar nada.
 */

/* Cubierto para los platos de fondo, vaso para las bebidas, manzana para los
   snacks. Van como data URI y no como archivos para no sumar una descarga por
   cada tarjeta de la lista. */
const ICONOS = {
  comida: "%3Cpath d='M7 2v7a2 2 0 0 0 2 2v11'/%3E%3Cpath d='M7 2v6'/%3E%3Cpath d='M11 2v6'/%3E%3Cpath d='M17 2c-1.4 0-2.5 2-2.5 4.5S15.6 11 17 11s2.5-2 2.5-4.5S18.4 2 17 2z'/%3E%3Cpath d='M17 11v11'/%3E",
  bebida: "%3Cpath d='M6 3h12l-1.2 16.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 3z'/%3E%3Cpath d='M6.7 9h10.6'/%3E",
  snack:  "%3Cpath d='M12 8c-3.5-3-8 .5-6.5 5.5C6.7 18 10 21 12 21s5.3-3 6.5-7.5C20 8.5 15.5 5 12 8z'/%3E%3Cpath d='M12 8c0-2 1-3.5 3-4.5'/%3E",
};

/* Un tinte por familia. Verdes para lo que se elige, azul para la bebida y
   ambar para el snack: asi la seccion "incluido" se distingue sin leerla. */
const TINTES = {
  comida: ['#CFE9D8,#9FD1B4', '#EFE3C4,#D8C08A', '#E4D5CE,#C4A79C'],
  bebida: ['#CFE2F1,#9CC2E3'],
  snack:  ['#F6E3C7,#E8C48B'],
};

const TRAZO = { comida: '%23163A2A', bebida: '%231C3C58', snack: '%235A3E12' };

function familiaDe(tipo) {
  if (tipo === 'drinks') return 'bebida';
  if (tipo === 'snacks') return 'snack';
  return 'comida';
}

/** Suma de los codigos del nombre: mismo plato, mismo tinte, siempre. */
function varianteDe(nombre, cuantas) {
  const texto = String(nombre || '');
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma += texto.charCodeAt(i);
  return suma % cuantas;
}

const FotoPlato = ({ menu, tipo, className = 'afPlato__img' }) => {
  if (menu?.imageUrl) {
    return <span className={className} style={{ backgroundImage: `url(${menu.imageUrl})` }} />;
  }

  const familia = familiaDe(tipo);
  const tintes = TINTES[familia];
  const tinte = tintes[varianteDe(menu?.name, tintes.length)];
  const icono =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'` +
    ` fill='none' stroke='${TRAZO[familia]}' stroke-width='1.6' stroke-linecap='round'` +
    ` stroke-linejoin='round'%3E${ICONOS[familia]}%3C/svg%3E")`;

  return (
    <span
      className={`${className} afSinFoto`}
      aria-hidden="true"
      style={{
        background: `linear-gradient(140deg,${tinte})`,
        '--af-icono': icono,
      }}
    />
  );
};

export default FotoPlato;
