import React from 'react';

/**
 * La foto de un plato, o un marcador digno cuando todavia no hay foto.
 *
 * De 160 platos del catalogo, 11 tienen imagen. Antes el hueco se pintaba
 * vacio: en la pantalla donde el cliente elige su almuerzo aparecian tres
 * cuadros en blanco, que no se lee como "falta la foto" sino como que la app
 * esta rota. Y esa es justo la pantalla que tiene que convencerlo.
 *
 * El marcador usa los tres degradados que ya estaban definidos en global.scss
 * —y que ningun sitio llegaba a aplicar— mas un cubierto tenue. La variante se
 * elige a partir del nombre del plato, no al azar: asi el mismo plato se ve
 * siempre igual, y tres opciones seguidas salen distintas entre si en vez de
 * parecer un error repetido.
 *
 * Cuando se carguen las fotos desde el admin, esto desaparece solo. No hay que
 * volver a tocar nada.
 */

/** Suma de los codigos del nombre: mismo plato, misma variante, siempre. */
function varianteDe(nombre) {
  const texto = String(nombre || '');
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma += texto.charCodeAt(i);
  return suma % 3; // 0 = verde, 1 = ambar, 2 = arcilla
}

const FotoPlato = ({ menu, className = 'afPlato__img' }) => {
  const url = menu?.imageUrl;

  if (url) {
    return (
      <span
        className={className}
        style={{ backgroundImage: `url(${url})` }}
      />
    );
  }

  const v = varianteDe(menu?.name);
  const clases = [className, v ? `${className}--${v}` : '', 'afSinFoto']
    .filter(Boolean)
    .join(' ');

  return <span className={clases} aria-hidden="true" />;
};

export default FotoPlato;
