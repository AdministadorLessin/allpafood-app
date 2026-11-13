import React from 'react';
import { API_URL } from '../../config';
import Isotipo from './Isotipo';

/* Numero de la oficina, el mismo que usa la pantalla del motorizado. */
const OFICINA = '51955797697';

/**
 * Red de seguridad: si algo revienta al dibujar, el cliente ve una salida.
 *
 * Sin esto, cualquier error en pantalla desmonta React entero y lo que queda
 * es una pagina en blanco. El cliente no sabe si es su internet, su telefono o
 * que la empresa se cayo, y lo unico que puede hacer es escribir por WhatsApp
 * —si se acuerda del numero—.
 *
 * Tambien deja el error en la consola con su pila: cuando alguien reporte una
 * pantalla en blanco, se puede pedir la captura de la consola en vez de
 * adivinar sobre los registros del servidor, que de un error del navegador no
 * saben nada.
 */
let delMapa = [];
const esDelMapaAlCerrar = (error) => {
    const pila = String(error?.stack || '');
    if (!pila.includes('maps.googleapis.com') || !/getRootNode|set map/.test(pila + String(error?.message || ''))) return false;
    const ahora = Date.now();
    delMapa = delMapa.filter((t) => ahora - t < 5000);
    delMapa.push(ahora);
    return delMapa.length <= 4;
};

class PantallaError extends React.Component {

    constructor(props) {
        super(props);
        this.state = { fallo: null };
    }

    static getDerivedStateFromError(error) {
        /* El mapa de Google a veces falla al cerrarse (su marcador intenta
           soltarse de un mapa que no llego a cargar). Eso pasa cuando la
           pantalla del mapa YA se esta yendo: no hay nada roto que mostrar,
           asi que no se tumba el app por eso. Con tope, por si se repitiera
           sin parar. */
        if (esDelMapaAlCerrar(error)) return null;
        return { fallo: error };
    }

    componentDidCatch(error, info) {
        console.error('[AllpaFood] La pantalla se cayo:', error, info?.componentStack);

        /* Y se avisa al servidor. Sin esto el error se queda en el telefono del
           cliente: el llama diciendo "no me funciona" y de este lado no hay ni
           la pantalla ni la linea que fallo. Se manda lo minimo para poder
           reproducirlo —donde estaba, quien es, que decia el error— y nada del
           contenido de su cuenta. */
        try {
            let usuario = '-';
            try {
                const inf = JSON.parse(window.localStorage.getItem('inf') || '{}');
                usuario = inf?.log || inf?.profile?.name || '-';
            } catch (e) { /* sin sesion */ }

            const cuerpo = JSON.stringify({
                ruta: window.location.pathname + window.location.search,
                usuario,
                version: document.querySelector('script[src*="/static/js/main."]')?.src?.split('/')?.pop() || '-',
                mensaje: String(error?.message || error),
                componente: String(info?.componentStack || '').split('\n').slice(0, 4).join(' > '),
                equipo: navigator.userAgent,
            });

            /* sendBeacon sobrevive a que el cliente cierre la pestana de una,
               que es justo lo que hace cuando ve la pantalla rota. */
            const url = `${API_URL}public/front-error`;
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, new Blob([cuerpo], { type: 'application/json' }));
            } else {
                fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                             body: cuerpo, keepalive: true }).catch(() => {});
            }
        } catch (e) { /* avisar nunca puede romper mas de lo que ya esta roto */ }
    }

    render() {
        if (!this.state.fallo) return this.props.children;

        /* Estilos en linea a proposito: si lo que se cayo fue la hoja de
           estilos o una pantalla a medio cargar, esta igual se ve bien. */
        const texto = "var(--n-texto, 'Figtree Variable', system-ui, -apple-system, sans-serif)";
        const titular = "var(--n-titular, 'Bricolage Grotesque Variable', system-ui, sans-serif)";

        return (
            <main style={{
                position: 'relative', minHeight: '100dvh', boxSizing: 'border-box', overflow: 'hidden',
                display: 'flex', justifyContent: 'center',
                padding: 'calc(env(safe-area-inset-top, 0px) + 72px) 22px calc(env(safe-area-inset-bottom, 0px) + 30px)',
                background: '#F6F6F1', fontFamily: texto, color: '#16211B',
                WebkitFontSmoothing: 'antialiased',
            }}>
                <span aria-hidden="true" style={{
                    position: 'absolute', left: 0, right: 0, top: 0, height: 380, pointerEvents: 'none',
                    background: 'linear-gradient(180deg, #3CFB9F 0%, #8CFCC4 46%, rgba(246,246,241,0) 100%)',
                }} />
                <div style={{ position: 'relative', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
                    <Isotipo size={44} />
                    <h1 style={{
                        margin: '22px 0 0', fontFamily: titular, fontWeight: 800,
                        fontSize: 42, lineHeight: 0.98, letterSpacing: '-0.035em',
                    }}>
                        Algo se nos rompió
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(22,33,27,.78)', margin: '14px 0 0' }}>
                        No es tu internet. Vuelve a intentarlo y, si sigue igual,
                        escríbenos y lo resolvemos contigo.
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: 32 }}>
                        <button type="button"
                            onClick={() => window.location.replace('/')}
                            style={{
                                width: '100%', height: 56, border: 0, borderRadius: 18,
                                background: '#16211B', color: '#fff', fontFamily: 'inherit',
                                fontSize: 16, fontWeight: 600, cursor: 'pointer',
                            }}>
                            Volver a intentar
                        </button>

                        <a href={`https://wa.me/${OFICINA}`}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48,
                                color: '#16211B', fontSize: 14.5, fontWeight: 600,
                                textDecoration: 'underline', textUnderlineOffset: 4,
                            }}>
                            Escribirnos por WhatsApp
                        </a>
                    </div>
                </div>
            </main>
        );
    }
}

export default PantallaError;
