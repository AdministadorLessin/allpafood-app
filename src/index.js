import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import moment from 'moment';
import 'moment/locale/es';
import App from './App';
import reportWebVitals from './reportWebVitals';

// El idioma se fijaba dentro de cada componente, despues de que moment ya
// hubiera creado sus fechas: los dias salian en ingles ("Wednesday 2 de
// Septiembre"). Aqui se fija una sola vez, antes de que arranque la app.
moment.locale('es');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  
    <App />
  
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
