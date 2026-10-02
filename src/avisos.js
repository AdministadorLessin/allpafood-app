import axios from 'axios';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_URL } from './config';

const esNativo = Capacitor.isNativePlatform();

/**
 * Los avisos push del app instalado.
 *
 * El flujo: el cliente acepta los avisos, Android le da al celular un codigo
 * unico (token) a traves de Firebase, y ese codigo se le deja al servidor en
 * /devices junto con la sesion. Con eso el servidor ya sabe a que celular
 * mandarle "tu almuerzo salio".
 *
 * En el navegador nada de esto existe: todo devuelve sin hacer nada.
 */

const LLAVE_TOKEN = 'af_push_token';
const VERSION_APP = '1.0.0';

const sesion = () => {
  try { return window.localStorage.getItem('aftkn'); } catch (e) { return null; }
};

const enviarToken = (token) => {
  const auth = sesion();
  if (!auth || !token) return;
  try { window.localStorage.setItem(LLAVE_TOKEN, token); } catch (e) { /* sin espacio */ }
  axios.post(`${API_URL}devices`,
    { token, platform: Capacitor.getPlatform(), appVersion: VERSION_APP },
    { headers: { Authorization: `Bearer ${auth}` } })
    /* Si el servidor todavia no tiene /devices (o no hay red), no pasa nada:
       se vuelve a intentar la proxima vez que abra el app. */
    .catch(() => {});
};

let escuchando = false;

/** Una sola vez al arrancar el app: que hacer cuando llega el token o se toca un aviso. */
export const iniciarAvisos = () => {
  if (!esNativo || escuchando) return;
  escuchando = true;

  PushNotifications.addListener('registration', ({ value }) => enviarToken(value));
  PushNotifications.addListener('registrationError', (e) => console.warn('[avisos] sin token', e));

  /* Tocar el aviso abre la pantalla que corresponde (el servidor manda la
     ruta: "/" para el pedido de hoy, "/menu" para elegir, "/mi-plan" para
     renovar). */
  PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const ruta = notification?.data?.ruta;
    if (ruta && ruta.startsWith('/') && ruta !== window.location.pathname) {
      window.history.pushState({}, '', ruta);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });
};

/** 'granted', 'denied' o 'prompt' (todavia no se le pregunto). */
export const estadoAvisos = async () => {
  if (!esNativo) return 'denied';
  try {
    const { receive } = await PushNotifications.checkPermissions();
    return receive === 'prompt-with-rationale' ? 'prompt' : receive;
  } catch (e) {
    return 'denied';
  }
};

/** Pide el permiso (la ventana de Android) y, si acepta, registra el celular. */
export const activarAvisos = async () => {
  if (!esNativo) return 'denied';
  try {
    const { receive } = await PushNotifications.requestPermissions();
    if (receive === 'granted') await PushNotifications.register();
    return receive;
  } catch (e) {
    return 'denied';
  }
};

/** Ya acepto antes: se vuelve a registrar para refrescar el token y la fecha. */
export const refrescarAvisos = async () => {
  if ((await estadoAvisos()) === 'granted') {
    try { await PushNotifications.register(); } catch (e) { /* sin Firebase */ }
  }
};

/** Al cerrar sesion: ese celular deja de recibir los avisos de esa cuenta. */
export const olvidarCelular = (auth) => {
  if (!esNativo || !auth) return;
  let token = null;
  try { token = window.localStorage.getItem(LLAVE_TOKEN); } catch (e) { /* nada */ }
  if (!token) return;
  axios.delete(`${API_URL}devices`, {
    data: { token },
    headers: { Authorization: `Bearer ${auth}` },
  }).catch(() => {});
};
