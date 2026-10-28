// Lo que el cliente pregunta de verdad.
//
// Las preguntas que ya tenia el app salen del WordPress de la web y estan
// escritas para quien todavia no compro: "por que elegir Allpa Food", "que
// tipo de comida ofrecen". Un cliente que ya pago entra buscando hasta que
// hora puede elegir y se encuentra con un argumento de venta; por eso termina
// escribiendo al WhatsApp de ventas.
//
// Estas viven aqui y no en el WordPress a proposito: son nueve respuestas que
// cambian una vez al año, y mantener dos listas que ya no se parecen en nada
// cuesta mas de lo que ahorra.

export const WHATSAPP_ATENCION = '51955797697';

/* "fuerte" es la frase que resuelve la duda. Va primero y resaltada: quien
   solo lee la primera linea ya se lleva la respuesta. */
export const TEMAS = [
  {
    id: 'plan',
    titulo: 'Cómo funciona mi plan',
    bajada: 'Los envíos, el corte, el relleno',
    icono: 'lista',
    preguntas: [
      {
        q: '¿Cómo funciona Allpa Food?',
        a: [
          'Cada mañana cocinamos para las personas que ya sabemos que van a comer ese día. La noche anterior cerramos la lista, y con esa lista se compra temprano y se cocina desde la madrugada.',
          { fuerte: 'Por eso tu almuerzo llega hecho ese mismo día.' },
          'Para que eso funcione necesitamos saber con tiempo quién come. De ahí el plan: compras por adelantado tus días de comida y tú eliges cuáles usar. No es para amarrarte: es lo que nos permite comprar justo lo del día y que te salga bastante menos que pedir comida suelta.',
        ],
      },
      {
        q: '¿Qué es un envío? ¿Es un plato o un día?',
        a: [
          { fuerte: 'Un envío es un día de comida, no un plato.' },
          'Si tu plan es Nutrivital, un envío es tu almuerzo de ese día. Si es Fitfuel, ese mismo envío trae tu almuerzo y tu cena: llegan juntos y cuentan como uno solo.',
          'Tu plan trae 20 envíos, o sea 20 días, que repartes como quieras dentro de los 45 días que dura.',
        ],
      },
      {
        q: '¿Qué pasa si no elijo nada?',
        a: [
          { fuerte: 'Te armamos el lunes, el martes y el miércoles.' },
          'Lo hacemos para que no se te pasen los días y termines con envíos sin usar cuando el plan está por vencer. Son esos tres, no la semana completa, y puedes cambiarlos o cancelarlos hasta las 10 de la noche anterior.',
          'Si eliges aunque sea un día de esa semana, no te armamos nada: entendemos que ya decidiste.',
        ],
      },
      {
        q: 'Se me acaban los envíos, ¿cómo renuevo?',
        a: [
          'Desde "Mi plan", o escríbenos y lo hacemos contigo.',
          { fuerte: 'Si renuevas antes de que venza, los envíos que te sobran se suman a los nuevos.' },
          'No pierdes nada por renovar antes. Al contrario: es la única forma de no perder lo que te quedó.',
        ],
      },
    ],
  },
  {
    id: 'app',
    titulo: 'Cómo uso el app',
    bajada: 'Elegir, cambiar, pausar, tu dirección',
    icono: 'telefono',
    preguntas: [
      {
        q: '¿Hasta qué hora elijo o cambio el menú de mañana?',
        a: [
          { fuerte: 'Hasta las 10 de la noche del día anterior.' },
          'A esa hora cerramos la cuenta del día siguiente y la mandamos a cocina. Con ese número se compra de madrugada y se cocina temprano, así que después ya no se puede cambiar: tu porción ya está contada y comprada.',
          'Si se te pasó la hora, el primer día que puedes elegir es pasado mañana.',
        ],
      },
      {
        q: 'No quiero recibir un día, ¿pierdo ese envío?',
        a: [
          { fuerte: 'No. El envío vuelve a tu saldo y lo usas otro día.' },
          'En "Mi menú" marcas el día que no quieres y listo. Mientras lo hagas antes de las 10 de la noche anterior, no se te descuenta nada.',
        ],
      },
      {
        q: 'Me voy de viaje, ¿qué hago con mi plan?',
        a: [
          'Pausa los días que no vas a estar, desde el app.',
          'Durante la pausa no te armamos ningún día ni te descontamos envíos. Cuando vuelvas, tu saldo está intacto.',
          { fuerte: 'No hace falta que nos escribas: con pausarlo basta.' },
        ],
      },
      {
        q: '¿Cómo cambio mi dirección?',
        a: [
          'En tus ubicaciones. Marca el punto exacto en el mapa para que el motorizado llegue a la puerta y no a media cuadra.',
          { fuerte: 'Si lo cambias antes de las 10 de la noche, al día siguiente ya se entrega ahí.' },
          'Si lo cambias después, el pedido de mañana sale a la dirección anterior porque la ruta ya está armada.',
        ],
      },
    ],
  },
  {
    id: 'hoy',
    titulo: 'Mi pedido de hoy',
    bajada: 'A qué hora llega y qué hacer si no llegó',
    icono: 'reloj',
    preguntas: [
      {
        q: '¿A qué hora llega mi pedido?',
        a: [
          { fuerte: 'Entre las 10:30 de la mañana y la 1:30 de la tarde.' },
          'Las motos salen a las 10:00 y la hora exacta depende de tu distrito y del orden de la ruta. No necesitas estar pendiente: si algún día vamos a llegar más tarde, te avisamos por aquí.',
        ],
      },
      {
        q: 'Ya es la 1:30 y no me ha llegado',
        a: [
          'Escríbenos y lo revisamos al momento: podemos ver dónde va tu moto.',
          { fuerte: 'Si no llegamos a entregarte, el envío vuelve a tu saldo. No se pierde.' },
        ],
      },
    ],
  },
];
