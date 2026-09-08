/**
 * Saca el mensaje de error que manda el servidor.
 *
 * El API devuelve DOS formas distintas segun de donde venga el error, y esa
 * es la trampa:
 *
 *   ErrorDTO (BusinessException, NotFound...)  -> { code, message, timeStamp }
 *   Cualquier otro cuerpo, envuelto por el AOP -> { code, message, data: { message } }
 *
 * En la segunda, el `message` de arriba es la etiqueta generica de HTTP
 * —"Conflict", "Bad Request"— y el mensaje util esta un nivel mas adentro.
 * Leer solo `data.message` hacia que al cliente le apareciera "Conflict" en
 * pantalla en vez de saber que le pasaba.
 *
 * Se prueba primero el nivel de adentro, porque en la forma envuelta el de
 * afuera SIEMPRE trae algo (la etiqueta) y ganaria por error.
 */
export function mensajeError(err, porDefecto = 'Algo salio mal. Intentalo de nuevo en un momento.') {
  if (!err?.response) return 'No pudimos conectarnos. Revisa tu internet e intentalo de nuevo.';

  const cuerpo = err.response.data;
  const texto = cuerpo?.data?.message ?? cuerpo?.message;

  // Las etiquetas de HTTP no le dicen nada a nadie: mejor el texto por defecto.
  const etiquetasHttp = ['Conflict', 'Bad Request', 'Not Found', 'Forbidden',
                         'Unauthorized', 'Internal Server Error'];
  if (!texto || etiquetasHttp.includes(texto)) return porDefecto;

  return texto;
}

export default mensajeError;
