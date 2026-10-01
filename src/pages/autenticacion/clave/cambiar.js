import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import TextField from '@mui/material/TextField';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import MarcoAuth from './../../../components/auth/Marco/MarcoAuth';
import { useAuthContext } from '../../../context/authContext';
import { API_URL } from '../../../config';

import './../registro/registro.scss';
import { useVerClave } from '../../../components/ultil/VerClave';

/**
 * Cambio de la clave temporal, la primera vez que entra un cliente migrado.
 *
 * A quien subimos desde el Excel le pusimos nosotros la contrasena: la conoce
 * quien armo el archivo y suele repetirse entre varios clientes. Esta pantalla
 * sale una sola vez y no se puede saltar; en cuanto elige la suya, la marca se
 * apaga en el servidor y no vuelve a aparecer.
 */
const CambiarClavePage = () => {
    const verClave = useVerClave();

    const navigate = useNavigate();
    const { token, planInfo, handleUpdateToken } = useAuthContext();

    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [repetida, setRepetida] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    /* Las reglas siempre a la vista, marcandose solas. Mostrar una por vez
       obliga a adivinar la siguiente.

       Antes eran cuatro y pedian ademas una mayuscula y un simbolo. Esa
       exigencia dejo gente encerrada en esta pantalla: entraban con la clave
       que les dimos, escribian una suya, el boton no pasaba y no volvian a
       intentar. En el servidor nunca llegaba una sola peticion. Tres reglas
       que se leen de un vistazo cumplen lo mismo aqui: la cuenta no guarda
       mas que el plan de almuerzos, y son las mismas que ya pide recuperar
       la clave por WhatsApp. */
    const reglas = [
        { ok: nueva.length >= 8, txt: 'Al menos 8 caracteres' },
        { ok: /[a-zA-Z]/.test(nueva), txt: 'Una letra' },
        { ok: /[0-9]/.test(nueva), txt: 'Un número' },
    ];
    const claveValida = reglas.every((r) => r.ok);

    const guardar = (e) => {
        e.preventDefault();

        if (!actual) return setError('Escribe la contraseña con la que acabas de entrar.');
        if (!claveValida) return setError('Tu nueva contraseña todavía no cumple las tres reglas de abajo.');
        if (nueva !== repetida) return setError('Las dos contraseñas no coinciden.');
        if (nueva === actual) return setError('Elige una distinta de la que te dimos.');

        setError('');
        setGuardando(true);

        axios.put(`${API_URL}profile/data/authentication`,
            { password: actual, newPassword: nueva },
            { headers: { "Authorization": `Bearer ${token}` } }
        ).then(() => {
            /* La sesion guardada todavia dice que debe cambiarla; si no se
               actualiza, el panel la manda de vuelta aqui. */
            if (planInfo) {
                handleUpdateToken(token, { ...planInfo, mustChangePassword: false });
            }
            navigate('/', { replace: true });
        }).catch((err) => {
            setGuardando(false);
            setError(
                err?.response?.data?.data?.message ||
                err?.response?.data?.message ||
                'No pudimos cambiar tu contraseña. Revisa la actual e inténtalo de nuevo.'
            );
        });
    };

    return (
        <MarcoAuth>

            <h1 className="afAuth__titular">
                <span className="t1">Antes de entrar,</span>
                elige tu contraseña
            </h1>
            <p className="afAuth__bajada">
                La que usaste te la dimos nosotros. Cambia a una tuya y no vuelves a ver esta pantalla.
            </p>

            <form className={guardando ? 'regStepResp disableForms' : 'regStepResp'} onSubmit={guardar}>

                <div className="afCampo">
                    <TextField
                        id="claveActual"
                        name="claveActual"
                        variant="filled"
                        type={verClave.type}
                        InputProps={verClave.InputProps}
                        label={'Contraseña actual'}
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                    />
                </div>

                <div className="afCampo">
                    <TextField
                        id="claveNueva"
                        name="claveNueva"
                        variant="filled"
                        type={verClave.type}
                        InputProps={verClave.InputProps}
                        label={'Nueva contraseña'}
                        value={nueva}
                        onChange={(e) => setNueva(e.target.value)}
                    />
                </div>

                <ul className="afClave">
                    {reglas.map((r) => (
                        <li className={r.ok ? 'afClave--ok' : undefined} key={r.txt}>
                            <span />{r.txt}
                        </li>
                    ))}
                </ul>

                <div className="afCampo">
                    <TextField
                        id="claveRepetida"
                        name="claveRepetida"
                        variant="filled"
                        type={verClave.type}
                        InputProps={verClave.InputProps}
                        label={'Repite la nueva contraseña'}
                        value={repetida}
                        onChange={(e) => setRepetida(e.target.value)}
                    />
                </div>

                {error &&
                    <div className="regErrorField">
                        <p><ErrorOutlineIcon /> {error}</p>
                    </div>
                }

                <div className="btnBox">
                    <button type="submit" className="btnPrimary btnIcon btnIconRight">
                        <span>{guardando ? 'Guardando…' : 'Guardar y entrar'}</span>
                    </button>
                </div>

            </form>
        </MarcoAuth>
    );
};

export default CambiarClavePage;
