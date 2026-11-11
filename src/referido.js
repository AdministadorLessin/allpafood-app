/**
 * El codigo de invitacion de quien todavia no compra.
 *
 * Puede escribirlo mientras mira el app de visita o en la pantalla de pago.
 * Se guarda en el telefono hasta que paga; el servidor es quien decide si le
 * vale y quien entrega el regalo.
 */
const LLAVE = 'af_codigo_ref';        // lo que escribio
const LLAVE_OK = 'af_codigo_ref_ok';  // el mismo codigo, ya aceptado por el servidor
const LLAVE_DE = 'af_codigo_ref_de';  // el nombre de quien lo invito

const leer = (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
const poner = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* nada */ } };
const quitar = (k) => { try { window.localStorage.removeItem(k); } catch (e) { /* nada */ } };

export const limpiarCodigo = (c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export const codigoGuardado = () => leer(LLAVE) || '';
export const invitadoPor = () => leer(LLAVE_DE) || '';
export const guardarCodigo = (codigo, nombre) => {
  poner(LLAVE, limpiarCodigo(codigo));
  if (nombre) poner(LLAVE_DE, nombre); else quitar(LLAVE_DE);
  quitar(LLAVE_OK);
};
/** El servidor dijo que a esta cuenta le vale. Solo entonces viaja con el pago. */
export const aceptarCodigo = (codigo, nombre) => {
  guardarCodigo(codigo, nombre);
  poner(LLAVE_OK, limpiarCodigo(codigo));
};
export const codigoAplicado = () => {
  const c = leer(LLAVE);
  return c && leer(LLAVE_OK) === c ? c : null;
};
export const olvidarCodigo = () => { quitar(LLAVE); quitar(LLAVE_OK); quitar(LLAVE_DE); };
