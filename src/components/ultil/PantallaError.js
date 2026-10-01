import React from 'react';
import { API_URL } from '../../config';

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
class PantallaError extends React.Component {

    constructor(props) {
        super(props);
        this.state = { fallo: null };
    }

    static getDerivedStateFromError(error) {
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

        return (
            <main style={{
                minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '28px', background: '#F3F6F3', fontFamily: 'inherit', color: '#16211B',
            }}>
                <div style={{ maxWidth: 360, textAlign: 'center' }}>
                    <h1 style={{ fontSize: 22, margin: '0 0 10px', lineHeight: 1.25 }}>
                        Algo se nos rompió
                    </h1>
                    <p style={{ fontSize: 14, lineHeight: 1.5, color: '#61706A', margin: '0 0 22px' }}>
                        No es tu internet. Vuelve a intentarlo y, si sigue igual,
                        escríbenos y lo resolvemos contigo.
                    </p>

                    <button type="button"
                        onClick={() => window.location.replace('/')}
                        style={{
                            width: '100%', minHeight: 50, border: 0, borderRadius: 999,
                            background: '#3CFB9F', color: '#08301D', fontFamily: 'inherit',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
                        }}>
                        Volver a intentar
                    </button>

                    <a href={`https://wa.me/${OFICINA}`}
                        style={{
                            display: 'block', minHeight: 48, lineHeight: '48px',
                            borderRadius: 999, border: '1.5px solid #E3E9DF',
                            color: '#16211B', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                        }}>
                        Escribirnos por WhatsApp
                    </a>
                </div>
            </main>
        );
    }
}

export default PantallaError;
