import React from 'react';
import ReactDOM from 'react-dom/client';
// La tipografia viaja dentro de la app. Antes se pedia a Google Fonts y, en el
// app nativo, esa descarga no llegaba: todo salia en una letra con serifa.
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/poppins/900.css';
import './index.css';
import moment from 'moment';
import 'moment/locale/es';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { vigilarSesion } from './components/ultil/sesion';
import { iniciarNativo } from './nativo';

// El idioma se fijaba dentro de cada componente, despues de que moment ya
// hubiera creado sus fechas: los dias salian en ingles ("Wednesday 2 de
// Septiembre"). Aqui se fija una sola vez, antes de que arranque la app.
moment.locale('es');

// Una sesion vencida saca al cliente al ingreso en vez de dejarlo con pantallas vacias.
vigilarSesion();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  
    <App />
  
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// Dentro del app instalado: colores de las franjas del telefono y boton atras.
iniciarNativo();

reportWebVitals();
