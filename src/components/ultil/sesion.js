// Que pasa cuando la sesion vence.
//
// El token dura 10 horas. Hasta ahora, al vencer, el app no se enteraba:
// /auth/validate-token responde 200 con {isValid:false}, asi que el guardia de
// rutas lo tomaba por buena y dejaba al cliente dentro con una sesion muerta.
// Cada pantalla pedia sus datos, el servidor contestaba 401 y el cliente veia
// el panel vacio o la pantalla de error: "no me funciona la plataforma".
//
// Ahora cualquier 401/403 cierra la sesion y lleva al ingreso con un aviso,
// que es lo unico que el cliente puede hacer al respecto.

import axios from 'axios';

const LLAVES = ['aftkn', 'inf'];

export function cerrarSesionPorVencimiento() {
  try { LLAVES.forEach((k) => window.localStorage.removeItem(k)); } catch (e) { /* modo privado */ }
  if (!window.location.pathname.startsWith('/ingresar')) {
    window.location.replace('/ingresar?sesion=vencida');
  }
}

export function vigilarSesion() {
  axios.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
      const estado = error?.response?.status;
      const url = String(error?.config?.url || '');
      /* Los endpoints de autenticacion contestan 401 por otras razones —clave
         equivocada, codigo vencido— y ahi el cliente ya esta en su pantalla. */
      const esAuth = url.includes('/auth/') || url.includes('/register');
      let habiaSesion = false;
      try { habiaSesion = !!window.localStorage.getItem('aftkn'); } catch (e) { /* modo privado */ }

      if ((estado === 401 || estado === 403) && habiaSesion && !esAuth) {
        cerrarSesionPorVencimiento();
      }
      return Promise.reject(error);
    }
  );
}
