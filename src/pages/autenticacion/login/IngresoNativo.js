import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

import './IngresoNativo.scss';
import plato from '../../../assets/img/ingreso-plato.jpg';
import platoBorroso from '../../../assets/img/ingreso-plato-blur.jpg';
import Isotipo from '../../../components/ultil/Isotipo';
import { resorte, cascada, sube } from '../../../movimiento';
import Recuperar from './Recuperar';

/*
 * La entrada al app instalado: la bienvenida y, encima, la hoja de ingreso.
 *
 * La foto llena la pantalla, nitida arriba y desenfocada hacia abajo, donde va
 * el texto. Al tocar "Ingresar" la foto entera queda desenfocada y oscurecida
 * y la hoja sube desde abajo. El isotipo vive en la esquina de arriba a la
 * izquierda: es justo donde lo deja la animacion de apertura (AperturaNativa).
 *
 * La logica de entrar —validar, llamar al servidor, mandar a cada rol a su
 * pantalla— sigue en login.js. Aqui solo vive lo que se ve; en el navegador
 * se sigue usando el ingreso de siempre.
 */

const Bandera = () => (
  <svg className="afIngreso__bandera" width="15" height="10" viewBox="0 0 3 2" aria-hidden="true">
    <rect width="1" height="2" x="0" fill="#D91023" />
    <rect width="1" height="2" x="1" fill="#FFFFFF" />
    <rect width="1" height="2" x="2" fill="#D91023" />
  </svg>
);

const Ico = ({ d, grosor = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((x) => <path key={x} d={x} />)}
  </svg>
);
const FLECHA = 'M5 12h14M13 6l6 6-6 6';
const RELOJ = ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'];

export default function IngresoNativo({
  campos, registrarCelular, registrarClave, verClave,
  alEnviar, enviando, errorTexto, intento,
  modo, setModo, vencida,
}) {
  const quieto = useReducedMotion();
  const [hoja, setHoja] = useState(vencida);

  /* Al abrir o cerrar el teclado, Android cambia el alto del app de un
     cuadro al otro y la hoja saltaba media pantalla de golpe. Aqui se la
     deja un instante donde estaba y se la desliza a su lugar nuevo, como si
     la empujara el teclado. */
  const refHoja = useRef(null);
  const hojaAbierta = useRef(hoja);
  hojaAbierta.current = hoja;
  /* Android cambia el alto en dos pasos: primero lo agranda un poco (se va
     la barra de navegacion) y enseguida lo achica (llega el teclado). Animar
     cada paso hacia que la hoja bajara y subiera: un rebote. Por eso la hoja
     se queda quieta mientras dure la rafaga de cambios y recien cuando el
     alto se asienta hace un solo recorrido hasta su lugar final. */
  useEffect(() => {
    let alto = window.innerHeight;
    let altoInicial = null;
    let asentar = null;
    let fin = null;
    const alCambiarAlto = () => {
      const el = refHoja.current;
      if (!el || !hojaAbierta.current) { alto = window.innerHeight; return; }
      if (altoInicial === null) altoInicial = alto;
      alto = window.innerHeight;
      clearTimeout(asentar);
      clearTimeout(fin);
      /* Mientras tanto se la deja donde estaba al empezar. */
      el.style.transition = 'none';
      el.style.transform = `translateY(${altoInicial - alto}px)`;
      asentar = setTimeout(() => {
        altoInicial = null;
        el.getBoundingClientRect();
        el.style.transition = 'transform .3s cubic-bezier(.2,.9,.2,1)';
        el.style.transform = '';
        fin = setTimeout(() => { el.style.transition = ''; }, 320);
      }, 90);
    };
    window.addEventListener('resize', alCambiarAlto);
    return () => {
      window.removeEventListener('resize', alCambiarAlto);
      clearTimeout(asentar); clearTimeout(fin);
    };
  }, []);

  /* El boton atras de Android cierra la hoja antes que salir del app. */
  useEffect(() => {
    if (!hoja) return undefined;
    const alAtras = (e) => { e.preventDefault(); if (!enviando) setHoja(false); };
    window.addEventListener('af-atras', alAtras);
    return () => window.removeEventListener('af-atras', alAtras);
  }, [hoja, enviando]);

  /* La foto se mide una sola vez. Antes ocupaba el alto de la pantalla en
     vivo, y al abrir el teclado (o al cambiar las barras de Android cuando
     sube la hoja) ese alto cambiaba: la foto se reacomodaba y daba un salto.
     Solo se vuelve a medir si cambia el ancho, o sea si se gira el celular. */
  const [altoFoto, setAltoFoto] = useState(() => window.innerHeight);
  useEffect(() => {
    let ancho = window.innerWidth;
    const alGirar = () => {
      if (window.innerWidth === ancho) return;
      ancho = window.innerWidth;
      setAltoFoto(window.innerHeight);
    };
    window.addEventListener('resize', alGirar);
    return () => window.removeEventListener('resize', alGirar);
  }, []);

  const cerrar = () => { if (!enviando) setHoja(false); };
  const toque = quieto ? {} : { whileTap: { scale: 0.97 }, transition: resorte.toque };
  const aparece = { duration: quieto ? 0 : 0.35, ease: 'easeOut' };
  /* La bienvenida entra en cascada y se retira entera cuando sube la hoja. */
  const PIE = {
    oculto: {},
    visible: { opacity: 1, y: 0, transition: cascada(0.06, 0.12).visible.transition },
    fuera: { opacity: 0, y: quieto ? 0 : 24, transition: { duration: 0.2 } },
  };

  return (
    <main className={`afIngreso${hoja ? ' afIngreso--hoja' : ''}`}>
      {/* ===== La foto ===== */}
      <div className="afIngreso__bienvenida" style={{ height: altoFoto }}>
        {/* El desenfoque es la misma foto ya desenfocada (una imagen fija, no
            un filtro en vivo): hacia abajo se funde con una mascara, y con la
            hoja abierta aparece entera. El celular la pinta una vez. */}
        <div className="afIngreso__foto">
          <img src={plato} alt="Bowl de Allpa Food con verduras, quinua y salsa verde" />
          <img src={platoBorroso} alt="" aria-hidden="true" className="afIngreso__borroso" />
          <motion.img src={platoBorroso} alt="" aria-hidden="true" initial={false}
            animate={{ opacity: hoja ? 1 : 0 }} transition={aparece} />
        </div>
        <div className="afIngreso__tinte" />
        <motion.div className="afIngreso__tinte afIngreso__tinte--hoja" initial={false}
          animate={{ opacity: hoja ? 1 : 0 }} transition={aparece} />
      </div>

      {/* ===== La marca, donde la deja la apertura ===== */}
      <header className="afIngreso__cab">
        <span className="afIngreso__marca">
          <Isotipo size={28} hojas="#3CFB9F" sonrisa="#FFFFFF" />
          <b>Allpa Food</b>
        </span>
        <AnimatePresence initial={false}>
          {!hoja &&
            <motion.span className="afIngreso__chip" key="chip"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Bandera />Hecho en Perú
            </motion.span>}
        </AnimatePresence>
      </header>

      {/* ===== Con la hoja abierta, la frase sube arriba ===== */}
      <AnimatePresence initial={false}>
        {hoja &&
          <motion.p className="afIngreso__frase" key="frase" aria-hidden="true"
            initial={{ opacity: 0, y: quieto ? 0 : 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: quieto ? 0 : 10 }} transition={quieto ? { duration: 0 } : resorte.entra}>
            Tu comida del día,<br /><em>resuelta.</em>
          </motion.p>}
      </AnimatePresence>

      {/* ===== Bienvenida ===== */}
      <motion.div className="afIngreso__pie" variants={PIE} initial={quieto ? false : 'oculto'}
        animate={hoja ? 'fuera' : 'visible'}
        style={{ pointerEvents: hoja ? 'none' : 'auto' }} aria-hidden={hoja}>
        <motion.h1 className="afIngreso__titulo" variants={sube}>
          Tu comida<br />del día,<br /><em>resuelta.</em>
        </motion.h1>
        <motion.p className="afIngreso__bajada" variants={sube}>
          Desayuno, almuerzo, cena, snacks y bebidas en una sola app.
        </motion.p>
        <div className="afIngreso__puertas">
          <motion.div variants={sube}>
            <motion.button type="button" className="afIngreso__btn afIngreso__btn--menta"
              tabIndex={hoja ? -1 : 0} onClick={() => setHoja(true)} {...toque}>
              Ingresar
            </motion.button>
          </motion.div>
          <motion.div variants={sube}>
            <Link to="/empezar" className="afIngreso__btn afIngreso__btn--vidrio" tabIndex={hoja ? -1 : 0}>
              Soy nuevo, ver planes
            </Link>
          </motion.div>
          {/* Mirar el app por dentro sin registrarse. */}
          <motion.div variants={sube}>
            <Link to="/visita" className="afIngreso__mirar" tabIndex={hoja ? -1 : 0}>
              Mirar el menú de la semana
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ===== Velo (cierra al tocar fuera) y hoja de ingreso ===== */}
      <button type="button" aria-label="Cerrar" className="afIngreso__velo"
              onClick={cerrar} tabIndex={hoja ? 0 : -1} />

      {/* La hoja sube con resorte; por dentro, el teclado la empuja (refHoja). */}
      <motion.div className="afIngreso__sube" initial={false}
        animate={{ y: hoja ? '0%' : '105%' }} transition={quieto ? { duration: 0 } : resorte.suave}>
        <section ref={refHoja} className="afIngreso__hoja" role="dialog" aria-label="Ingresar a tu plan" aria-hidden={!hoja}>
          <div className="afIngreso__agarre" aria-hidden="true" />

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

              {/* Con cada intento fallido los campos tiemblan. */}
              <motion.div key={intento} className="afIngreso__campos"
                animate={intento && !quieto ? { x: [0, -7, 7, -7, 7, -4, 4, 0] } : undefined}
                transition={{ duration: 0.42, ease: 'easeInOut' }}>
                <div>
                  <label htmlFor="afIngCelular" className="afIngreso__et">Celular</label>
                  <div className={`afIngreso__campo${errorTexto ? ' afIngreso__campo--error' : ''}`}>
                    <b>+51</b><i aria-hidden="true" />
                    <input id="afIngCelular" type="tel" inputMode="numeric" autoComplete="username" placeholder="987 654 321"
                           value={campos.lfcorreo} {...registrarCelular}
                           onChange={(e) => {
                             /* Solo numeros: lo que se pega desde WhatsApp trae
                                espacios, guiones o el +51 delante. */
                             e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                             registrarCelular.onChange(e);
                           }} />
                  </div>
                </div>
                <div>
                  <label htmlFor="afIngClave" className="afIngreso__et">Contraseña</label>
                  <div className={`afIngreso__campo${errorTexto ? ' afIngreso__campo--error' : ''}`}>
                    <input id="afIngClave" type={verClave.type} autoComplete="current-password" placeholder="Tu contraseña"
                           value={campos.lfpassword} {...registrarClave} />
                    {verClave.InputProps?.endAdornment}
                  </div>
                </div>
              </motion.div>

              {errorTexto && <p role="alert" className="afIngreso__error">{errorTexto}</p>}

              <div className="afIngreso__opciones">
                <span><Ico d={RELOJ} grosor={2.2} />Tu sesión dura 30 días</span>
                <button type="button" onClick={() => setModo('recuperar')}>Olvidé mi contraseña</button>
              </div>

              <motion.button type="submit" className="afIngreso__btn afIngreso__btn--tinta" disabled={enviando} {...toque}>
                {enviando && <span className="afIngreso__giro" />}
                {enviando ? 'Entrando…' : <>Ingresar <Ico d={FLECHA} grosor={2.4} /></>}
              </motion.button>

              <p className="afIngreso__primera">
                ¿Primera vez? <Link to="/empezar">Ver planes</Link>
              </p>
            </form>
          )}
        </section>
      </motion.div>
    </main>
  );
}
