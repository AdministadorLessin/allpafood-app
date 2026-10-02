import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import './IngresoNativo.scss';
import plato from '../../../assets/img/ingreso-plato.jpg';
import Recuperar from './Recuperar';

/*
 * El ingreso dentro del app instalado.
 *
 * Tres momentos: la marca se dibuja (solo la primera vez, o despues de 6
 * horas sin abrir el app: a la quinta vez seguida ya molesta), la
 * bienvenida con la foto, y la hoja de ingreso que sube desde abajo.
 *
 * La logica de entrar —validar, llamar al servidor, mandar a cada rol a su
 * pantalla— sigue en login.js. Aqui solo vive lo que se ve; en el navegador
 * se sigue usando el ingreso de siempre.
 */

const HOJAS = 'M47.1079 34.4313C47.9669 32.1255 48.7516 29.8069 49.6849 27.5431C52.0164 21.8821 55.2264 16.783 59.5989 12.4492C65.4634 6.63641 72.4452 2.90331 80.5024 1.13687C84.0256 0.365055 87.5876 -0.00631499 91.1947 0.00983168C91.579 0.00983168 91.7534 0.103478 91.7599 0.510374C91.8535 5.74512 91.4595 10.9218 89.8998 15.9563C88.3335 21.0199 85.7242 25.5216 82.3689 29.5905C77.4152 35.6003 71.4603 40.3119 64.2298 43.3281C59.1242 45.4595 53.8055 46.5251 48.2704 46.5413C45.167 46.551 42.0733 46.4896 39.0055 45.9439C32.1916 44.7329 26.03 42.0267 20.5208 37.8608C14.6078 33.385 9.83166 27.9339 6.50221 21.2685C4.45481 17.1705 3.23413 12.8303 2.8563 8.2737C2.64639 5.73221 2.6367 3.1778 2.51722 0.626626C2.49461 0.126079 2.67223 0.000134214 3.15663 0.000134214C10.3516 -0.0160125 17.2236 1.42428 23.7049 4.56965C28.1129 6.7107 31.972 9.62679 35.3725 13.1532C40.5749 18.5462 43.9302 25.0081 46.3005 32.0416C46.5653 32.8296 46.8237 33.6207 47.0885 34.4119C47.0917 34.4216 47.1176 34.4248 47.1079 34.4216V34.4313Z';
const SONRISA = 'M20.6435 52.4639C22.9557 59.6201 26.9181 65.4749 33.4413 69.3178C37.8364 71.9045 42.5933 73.2446 47.7602 73.1025C53.883 72.9346 59.3051 70.8872 64.0296 67.0927C68.7573 63.295 71.8058 58.3187 73.5981 52.4897C73.766 52.5575 73.921 52.6092 74.0663 52.677C80.5961 55.7416 87.1258 58.8031 93.6523 61.8709C94.353 62.2003 94.3659 62.2068 94.1044 62.9753C92.015 69.1143 88.8276 74.6268 84.5068 79.4579C81.3711 82.9617 77.8414 86.0134 73.8468 88.5291C67.6884 92.4107 61.0198 94.8715 53.7958 95.7466C43.6234 96.9802 33.8644 95.5626 24.6543 90.9349C20.9244 89.0619 17.4916 86.74 14.3463 83.9886C9.38601 79.6549 5.38164 74.5848 2.52691 68.6396C1.63884 66.7892 0.925158 64.8516 0.166265 62.9398C-0.121146 62.2165 -0.0791675 62.1971 0.637745 61.858C6.07271 59.3068 11.5109 56.7589 16.9459 54.2077C18.1601 53.6361 19.3743 53.0645 20.6435 52.4671V52.4639Z';

const LLAVE_MARCA = 'af_marca_vista';
const SEIS_HORAS = 6 * 60 * 60 * 1000;

const tocaVerMarca = () => {
  try {
    const ultima = Number(window.localStorage.getItem(LLAVE_MARCA)) || 0;
    return Date.now() - ultima > SEIS_HORAS;
  } catch (e) {
    return false;
  }
};

const Bandera = ({ ancho = 22 }) => (
  <svg className="afIngreso__bandera" width={ancho} height={Math.round(ancho * 2 / 3)}
       viewBox="0 0 3 2" aria-hidden="true">
    <rect width="1" height="2" x="0" fill="#D91023" />
    <rect width="1" height="2" x="1" fill="#FFFFFF" />
    <rect width="1" height="2" x="2" fill="#D91023" />
  </svg>
);

const Nombre = ({ texto, desde }) => (
  <span>
    {texto.split('').map((letra, i) => (
      <span key={i} className="afIngreso__letra"
            style={{ animationDelay: `${(desde + i * 0.06).toFixed(2)}s` }}>{letra}</span>
    ))}
  </span>
);

export default function IngresoNativo({
  campos, registrarCelular, registrarClave, verClave,
  alEnviar, enviando, errorTexto, intento,
  modo, setModo, vencida,
}) {
  const [fase, setFase] = useState(() => (tocaVerMarca() ? 'marca' : 'lista'));
  const [hoja, setHoja] = useState(vencida);

  useEffect(() => {
    if (fase !== 'marca') return undefined;
    try { window.localStorage.setItem(LLAVE_MARCA, String(Date.now())); } catch (e) { /* sin espacio */ }
    const vuela = setTimeout(() => setFase('vuela'), 3000);
    const lista = setTimeout(() => setFase('lista'), 3800);
    return () => { clearTimeout(vuela); clearTimeout(lista); };
    // Solo al entrar: la marca no se repite mientras se usa la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* El boton atras de Android cierra la hoja antes que salir del app. */
  useEffect(() => {
    if (!hoja) return undefined;
    const alAtras = (e) => { e.preventDefault(); if (!enviando) setHoja(false); };
    window.addEventListener('af-atras', alAtras);
    return () => window.removeEventListener('af-atras', alAtras);
  }, [hoja, enviando]);

  const clases = ['afIngreso', `afIngreso--${fase}`];
  if (hoja) clases.push('afIngreso--hoja');

  return (
    <main className={clases.join(' ')}>
      {/* ===== Bienvenida ===== */}
      <div className="afIngreso__bienvenida">
        <div className="afIngreso__foto">
          <img src={plato} alt="Bowl de Allpa Food con verduras, quinua y salsa verde" />
        </div>
        <div className="afIngreso__blur afIngreso__blur--1" />
        <div className="afIngreso__blur afIngreso__blur--2" />
        <div className="afIngreso__blur afIngreso__blur--3" />
        <div className="afIngreso__tinte" />

        <div className="afIngreso__pie">
          <div className="afIngreso__entra afIngreso__chip afIngreso__vidrio" style={{ animationDelay: '.1s' }}>
            <Bandera />
            <span>Hecho en Perú</span>
          </div>
          <h1 className="afIngreso__entra afIngreso__titulo" style={{ animationDelay: '.18s' }}>
            Tu almuerzo,<br /><em>resuelto.</em>
          </h1>
          <p className="afIngreso__entra afIngreso__bajada" style={{ animationDelay: '.26s' }}>
            Almuerzos saludables hechos esta mañana, en tu puerta antes de la 1:30.
          </p>
          <button type="button" className="afIngreso__entra afIngreso__btn afIngreso__btn--menta"
                  style={{ animationDelay: '.34s' }} onClick={() => setHoja(true)}>
            Ingresar
          </button>
          <Link to="/empezar" className="afIngreso__entra afIngreso__btn afIngreso__btn--vidrio afIngreso__vidrio"
                style={{ animationDelay: '.4s' }}>
            Soy nuevo, ver planes
          </Link>
        </div>
      </div>

      {/* ===== Velo y hoja de ingreso ===== */}
      <button type="button" aria-label="Cerrar" className="afIngreso__velo"
              onClick={() => { if (!enviando) setHoja(false); }} tabIndex={hoja ? 0 : -1} />

      <section className="afIngreso__hoja" role="dialog" aria-label="Ingresar a tu plan" aria-hidden={!hoja}>
        <div className="afIngreso__agarre" />

        {modo === 'recuperar' ? (
          <div className="afIngreso__recuperar">
            <div className="afIngreso__hojaCab">
              <h2>Recupera tu contraseña</h2>
            </div>
            <Recuperar volver={() => setModo('entrar')} telefonoInicial={campos.lfcorreo} />
          </div>
        ) : (
          <form onSubmit={alEnviar} noValidate>
            <div className="afIngreso__hojaCab">
              <h2>Hola de nuevo</h2>
              <p>Entra con tu celular y tu contraseña.</p>
            </div>

            {vencida &&
              <p className="afIngreso__aviso">
                Por seguridad cerramos tu sesión. Vuelve a entrar con tu celular y tu contraseña.
              </p>
            }

            <div key={intento} className={`afIngreso__campos${intento ? ' afIngreso__campos--tiembla' : ''}`}>
              <label className={`afIngreso__campo${errorTexto ? ' afIngreso__campo--error' : ''}`}>
                <span className="afIngreso__prefijo"><Bandera ancho={20} />+51</span>
                <input type="tel" inputMode="numeric" autoComplete="username" placeholder="Celular"
                       aria-label="Celular" value={campos.lfcorreo} {...registrarCelular}
                       onChange={(e) => {
                         /* Solo numeros: lo que se pega desde WhatsApp trae
                            espacios, guiones o el +51 delante. */
                         e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                         registrarCelular.onChange(e);
                       }} />
              </label>
              <label className={`afIngreso__campo${errorTexto ? ' afIngreso__campo--error' : ''}`}>
                <input type={verClave.type} autoComplete="current-password" placeholder="Contraseña"
                       aria-label="Contraseña" value={campos.lfpassword} {...registrarClave} />
                {verClave.InputProps?.endAdornment}
              </label>
            </div>

            {errorTexto && <p role="alert" className="afIngreso__error">{errorTexto}</p>}

            <div className="afIngreso__opciones">
              <span>Tu sesión dura 30 días</span>
              <button type="button" onClick={() => setModo('recuperar')}>Olvidé mi contraseña</button>
            </div>

            <button type="submit" className="afIngreso__btn afIngreso__btn--tinta" disabled={enviando}>
              {enviando && <span className="afIngreso__giro" />}
              {enviando ? 'Entrando…' : 'Ingresar'}
            </button>

            <p className="afIngreso__primera">
              ¿Primera vez? <Link to="/empezar">Ver planes</Link>
            </p>
          </form>
        )}
      </section>

      {/* ===== La marca: su logo termina siendo el de la cabecera ===== */}
      <div className="afIngreso__marca" aria-hidden="true">
        <div className="afIngreso__marcaFondo" />
        <div className="afIngreso__aura" />
        <svg className="afIngreso__iso" viewBox="0 0 94 97">
          <path className="afIngreso__traza afIngreso__traza--b" pathLength="1" d={SONRISA} />
          <path className="afIngreso__traza afIngreso__traza--a" pathLength="1" d={HOJAS} />
        </svg>
        <div className="afIngreso__nombre">
          <Nombre texto="Allpa" desde={1.5} />
          <Nombre texto="Food" desde={1.84} />
        </div>
      </div>
    </main>
  );
}
