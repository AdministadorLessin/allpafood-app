import axios from 'axios';
import { API_URL } from '../../../config';

/**
 * Lo que el app le pide al servidor para conversar con Rodrigo. Rodrigo vive
 * en el servidor: aqui solo se manda lo que el cliente escribe y se pinta lo
 * que vuelve (mensajes, sus pasos de trabajo y los botones para confirmar).
 */
const cuerpo = (r) => r.data?.data ?? r.data;

export const crearApi = (token) => {
  const cab = { headers: { Authorization: `Bearer ${token}` } };
  return {
    conversacion: () => axios.get(`${API_URL}rodrigo/conversacion`, cab).then(cuerpo),
    novedades: (desde) => axios.get(`${API_URL}rodrigo/novedades`, { ...cab, params: { desde } }).then(cuerpo),
    enviar: (texto, fotoId) => axios.post(`${API_URL}rodrigo/mensaje`, { texto, fotoId }, cab).then(cuerpo),
    accion: (accionId) => axios.post(`${API_URL}rodrigo/accion`, { accionId }, cab).then(cuerpo),
    persona: () => axios.post(`${API_URL}rodrigo/persona`, {}, cab).then(cuerpo),
    foto: (archivo) => {
      const f = new FormData();
      f.append('foto', archivo);
      return axios.post(`${API_URL}rodrigo/foto`, f, cab).then(cuerpo);
    },
  };
};

/* Solo al programar (npm start) y con ?demo en la direccion: una conversacion
   de mentira para ver la pantalla sin servidor. En el app publicado este
   codigo no existe. */
export const apiPara = (token) => {
  /* Al programar se usa la conversacion de mentira, salvo que se pida ?real. */
  if (process.env.NODE_ENV !== 'production' && !new URLSearchParams(window.location.search).has('real')) {
    // eslint-disable-next-line global-require
    return require('./rodrigoDemo').crearDemo();
  }
  return crearApi(token);
};
