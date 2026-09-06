import moment from 'moment';
import 'moment/locale/es';

// Los modulos importados se evaluan antes que el cuerpo de index.js, asi que
// aqui el idioma global todavia no esta puesto: las fechas de ejemplo nacian
// en ingles y sus clones heredaban ese idioma.
moment.locale('es');

/**
 * SOLO DESARROLLO. Datos de ejemplo para /preview-ux.
 *
 * Reproducen la forma exacta que devuelven los endpoints reales, para que las
 * pantallas se revisen con la misma estructura de datos que en produccion.
 */

/* Miercoles a media manana: es el momento en que el panel tiene algo que
   decir. Con la fecha real la previsualizacion caeria en fin de semana y todos
   los escenarios se verian iguales. */
export const AHORA = moment().startOf('isoWeek').add(2, 'days').hour(10).minute(0);
const hoy = AHORA;
export const dia = (n) => hoy.clone().startOf('isoWeek').add(n, 'days').format('YYYY-MM-DD');

export const plato = (nombre, kcal, carb, gr, prot, desc) => ({
  id: Math.round(Math.random() * 1000),
  menu: {
    name: nombre,
    description: desc || 'Acompañado de ensalada fresca del día.',
    imageUrl: null,
    properties: [
      { name: 'calorias', value: kcal }, { name: 'carbo', value: carb },
      { name: 'grasas', value: gr }, { name: 'proteinas', value: prot },
    ],
  },
});

export const PLATOS = [
  plato('Lomo saltado', 612, 54, 22, 38, 'Con arroz graneado y papas al horno.'),
  plato('Ají de gallina', 580, 61, 19, 34, 'Con arroz y aceituna de botija.'),
  plato('Trucha a la plancha', 495, 38, 16, 42, 'Con quinua y verduras salteadas.'),
];

export const planBase = {
  id: 2,
  planName: 'Nutrivital Plus',
  initDate: hoy.clone().subtract(3, 'days').format('YYYY-MM-DD'),
  expirationDate: hoy.clone().add(27, 'days').format('YYYY-MM-DD'),
  consumption: { orders: { total: 20, consumed: 3 }, extraBenefits: ['snacks', 'drinks'], principalBenefits: ['lunch'] },
  credits: null,
};

export const objetivo = { bmr: 1542.58, macros: { protein: 57, carbs: 212, fat: 51 } };

export const DIRECCIONES = [
  { id: 7, description: 'Oficina', address: 'Av. Arequipa 1234, Lince' },
  { id: 9, description: 'Casa', address: 'Av. Pardo 480, Miraflores' },
];

export const ESCENARIOS_PANEL = [
  {
    nombre: 'Le faltan días por elegir',
    plan: planBase,
    ordenes: [
      { id: 1, date: dia(0), items: [PLATOS[0]] },
      { id: 2, date: dia(1), items: [PLATOS[1]] },
    ],
    metricas: { calorias: 612, carbo: 54, grasas: 22, proteinas: 38 },
  },
  {
    nombre: 'Semana completa + créditos',
    plan: {
      ...planBase,
      consumption: { ...planBase.consumption, orders: { total: 20, consumed: 5 } },
      credits: { orders: { total: 20, consumed: 0 }, additional: ['breakfast'] },
    },
    ordenes: [0, 1, 2, 3, 4].map((n) => ({ id: n, date: dia(n), items: [PLATOS[2]] })),
    metricas: { calorias: 495, carbo: 38, grasas: 16, proteinas: 42 },
  },
  {
    nombre: 'Plan por acabarse',
    plan: {
      ...planBase,
      expirationDate: hoy.clone().add(4, 'days').format('YYYY-MM-DD'),
      consumption: { ...planBase.consumption, orders: { total: 20, consumed: 17 } },
    },
    ordenes: [{ id: 9, date: dia(0), items: [PLATOS[0]] }],
    metricas: { calorias: 0 },
  },
  {
    nombre: 'Sin plan activo',
    plan: null,
    ordenes: [],
    metricas: { calorias: 0 },
  },
];

/* Facturas de ejemplo: el ahorro del panel sale de las lineas negativas. */
export const FACTURAS_EJEMPLO = [
  { id: 1327, emissionDate: hoy.clone().subtract(3, 'days').format('YYYY-MM-DD'), totalPrice: 669,
    detailsEntity: [
      { id: '2', name: 'Plan - Nutrivital Plus', value: 475 },
      { id: '2', name: 'Descuento de plan', value: -56 },
      { id: 'breakfast', name: 'breakfast', value: 250 },
    ] },
  { id: 1326, emissionDate: hoy.clone().subtract(34, 'days').format('YYYY-MM-DD'), totalPrice: 419,
    detailsEntity: [
      { id: '2', name: 'Plan - Nutrivital Plus', value: 475 },
      { id: '2', name: 'Descuento de plan', value: -56 },
    ] },
];
