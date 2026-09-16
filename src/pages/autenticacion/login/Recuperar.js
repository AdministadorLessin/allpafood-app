import { useState } from 'react';
import axios from 'axios';
import TextField from '@mui/material/TextField';
import { motion } from 'framer-motion';



const API_URL = process.env.REACT_APP_API_URL;

/** Deja el celular como esta guardado en la base, con el 51 adelante. */
const soloDigitos = (valor) => (valor || '').replace(/\D/g, '');

/**
 * Recuperar la contrasena desde el propio celular.
 *
 * Antes esto no existia: el enlace abria un chat de WhatsApp y alguien tenia
 * que ir a la base a cambiar la clave a mano. Son tres pasos en la misma
 * pantalla, sin cambiar de ruta, para que quien ya escribio su numero no
 * tenga que volver a escribirlo.
 */
export default function Recuperar({ volver, telefonoInicial = '' }) {

  const [paso, setPaso] = useState(1);
  const [telefono, setTelefono] = useState(soloDigitos(telefonoInicial).slice(-9));
  const [codigo, setCodigo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const mensajeDe = (e) =>
    e?.response?.data?.data?.message ||
    e?.response?.data?.message ||
    'No pudimos completar el paso. Intenta de nuevo.';

  const pedirCodigo = () => {
    const numero = soloDigitos(telefono);
    if (numero.length !== 9) {
      setError('Escribe tu celular de 9 dígitos.');
      return;
    }
    setEnviando(true);
    setError('');
    axios.post(`${API_URL}auth/password/forgot`, { phoneNumber: numero })
      .then(() => {
        setAviso('Te enviamos un código por WhatsApp. Vence en 10 minutos.');
        setPaso(2);
      })
      .catch((e) => setError(mensajeDe(e)))
      .finally(() => setEnviando(false));
  };

  const cambiarClave = () => {
    if (clave.trim().length < 8) {
      setError('Tu nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setEnviando(true);
    setError('');
    axios.post(`${API_URL}auth/password/reset`, {
      phoneNumber: soloDigitos(telefono),
      code: codigo.trim(),
      password: clave.trim(),
    })
      .then(() => setPaso(3))
      .catch((e) => setError(mensajeDe(e)))
      .finally(() => setEnviando(false));
  };

  if (paso === 3) {
    return (
      <div className="afRecuperar">
        <p className="afAuth__bajada">
          Listo, tu contraseña quedó cambiada. Ya puedes entrar con ella.
        </p>
        <motion.button type="button" className="afBtn afBtn--mint" onClick={volver}>
          Ir a ingresar
        </motion.button>
      </div>
    );
  }

  return (
    <div className="afRecuperar">
      <p className="afAuth__bajada">
        {paso === 1
          ? 'Escribe tu celular y te mandamos un código por WhatsApp.'
          : 'Escribe el código que te llegó y tu nueva contraseña.'}
      </p>

      {paso === 1 && (
        <div className="afCampo">
          <TextField
            label="Celular"
            variant="filled"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
      )}

      {paso === 2 && (
        <>
          <div className="afCampo">
            <TextField
              label="Código de 6 dígitos"
              variant="filled"
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          <div className="afCampo">
            <TextField
              label="Nueva contraseña"
              variant="filled"
              type="password"
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </div>
        </>
      )}

      {aviso && !error && <p className="afRecuperar__aviso">{aviso}</p>}

      {error && (
        <div className="afAuth__error">
          {/* Sin icono a proposito: el bloque ya se distingue por su estilo y
              asi esta pantalla no depende de un recurso mas. */}
          {error}
        </div>
      )}

      <motion.button
        type="button"
        className="afBtn afBtn--mint"
        disabled={enviando}
        onClick={paso === 1 ? pedirCodigo : cambiarClave}
      >
        {enviando
          ? 'Un momento…'
          : paso === 1 ? 'Enviarme el código' : 'Cambiar mi contraseña'}
      </motion.button>

      <p className="afAuth__pie">
        <button type="button" className="afEnlace" onClick={paso === 1 ? volver : () => setPaso(1)}>
          {paso === 1 ? 'Volver a ingresar' : 'Usar otro celular'}
        </button>
      </p>
    </div>
  );
}
