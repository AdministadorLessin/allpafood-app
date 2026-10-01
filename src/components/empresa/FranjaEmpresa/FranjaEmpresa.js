import { motion } from './../../ultil/Motion/Motion';
import './FranjaEmpresa.scss';

/* Si el usuario pidio menos movimiento, entra todo quieto. Misma regla que el
   resto del app (ver components/ultil/Motion). */
const sinMovimiento =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const entra = (retraso) => ({
  initial: sinMovimiento ? { opacity: 1 } : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: sinMovimiento ? 0 : 0.5, delay: sinMovimiento ? 0 : retraso,
                ease: [0.16, 0.84, 0.44, 1] },
});

/**
 * La franja de la empresa que paga el almuerzo.
 *
 * Es lo primero que ve el colaborador al abrir su menu, y su unico trabajo es
 * que se acuerde de quien se lo esta pagando. Por eso el logo de la empresa
 * pesa mas que cualquier otra cosa en la pantalla y el texto es una sola
 * frase.
 *
 * Nada de lo que dice aqui promete un plato: el colaborador elige almuerzo, y
 * la entrada, la bebida y el snack van dentro sin anunciarse. Prometer en
 * pantalla algo que la cocina arma a su criterio es fabricar reclamos.
 *
 * Todo sale de la ficha de la empresa —logo, banner, color y mensaje—, asi
 * que la siguiente empresa que entre no necesita una linea de codigo.
 */
const FranjaEmpresa = ({ empresa }) => {
  if (!empresa?.nombreVisible) return null;

  const {
    nombreVisible,
    logoUrl,
    bannerUrl,
    color = '#3CFB9F',
    mensaje = `En ${nombreVisible} el almuerzo ya está resuelto`,
    detalle = 'Tú eliges, nosotros cocinamos y te lo llevamos a la oficina.',
  } = empresa;

  return (
    <section className="afEmpresa" style={{ '--emp-color': color }}>
      {bannerUrl &&
        <motion.img
          className="afEmpresa__fondo"
          src={bannerUrl}
          alt=""
          aria-hidden="true"
          /* Se asienta al entrar. Dura poco y no se repite: dice "esto acaba
             de llegar", no decora. */
          initial={sinMovimiento ? { scale: 1 } : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: sinMovimiento ? 0 : 1.1, ease: [0.16, 0.84, 0.44, 1] }}
        />
      }

      {/* El velo lo pinta el codigo, no la imagen: asi el texto se lee igual
          aunque manana cambien el banner por uno mas claro. */}
      <div className="afEmpresa__velo" />

      <div className="afEmpresa__texto">
        {logoUrl &&
          <motion.img className="afEmpresa__logo" src={logoUrl}
            alt={nombreVisible} {...entra(0.05)} />
        }
        <motion.p className="afEmpresa__titulo" {...entra(0.16)}>{mensaje}</motion.p>
        <motion.p className="afEmpresa__detalle" {...entra(0.26)}>{detalle}</motion.p>
      </div>
    </section>
  );
};

export default FranjaEmpresa;
