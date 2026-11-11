/**
 * El modo visita: quien todavia no es cliente entra a mirar el app por dentro
 * sin crear una cuenta.
 *
 * No hay nada en el servidor: lo poco que elige (su avatar, el punto donde le
 * entregariamos) se guarda en el telefono y se le pasa a su cuenta cuando la
 * crea, para que no lo repita.
 */
const LLAVE = 'af_visita';
const LLAVE_AVATAR = 'af_visita_avatar';
const LLAVE_DIR = 'af_visita_dir';

const leer = (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
const poner = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento: sigue sin recordar */ } };
const quitar = (k) => { try { window.localStorage.removeItem(k); } catch (e) { /* nada */ } };

export const esVisita = () => leer(LLAVE) === '1';
export const entrarDeVisita = () => poner(LLAVE, '1');
/* Al entrar con una cuenta se apaga la visita, pero no lo que eligio: el
   avatar y la direccion todavia tienen que llegar a su cuenta. */
export const salirDeVisita = () => quitar(LLAVE);

export const avatarDeVisita = () => leer(LLAVE_AVATAR);
export const guardarAvatarDeVisita = (n) => poner(LLAVE_AVATAR, String(n));
export const olvidarAvatarDeVisita = () => quitar(LLAVE_AVATAR);

export const direccionDeVisita = () => {
  try { return JSON.parse(leer(LLAVE_DIR)); } catch (e) { return null; }
};
export const guardarDireccionDeVisita = (d) => poner(LLAVE_DIR, JSON.stringify(d));
export const olvidarDireccionDeVisita = () => quitar(LLAVE_DIR);
