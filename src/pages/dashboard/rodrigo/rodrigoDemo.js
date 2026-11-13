/* Conversacion de mentira para ver la pantalla al programar. Imita al
   servidor: responde enseguida y despues va soltando pasos y mensajes. */
let n = 0;
const id = () => String(++n);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export const crearDemo = () => {
  let mensajes = [
    { id: id(), de: 'rodrigo', texto: 'Hola, Diana. Soy Rodrigo, de Allpa Food. Cuéntame qué necesitas y lo vemos.' },
  ];
  let estado = { trabajando: false, pasos: [] };
  const paso = (clave, texto) => ({ clave, texto, hecho: false });

  const trabajar = async (guion, respuestas) => {
    estado = { trabajando: true, titulo: 'Revisando tu caso…', pasos: [] };
    for (const p of guion) {
      estado = { ...estado, pasos: [...estado.pasos, p] };
      await espera(1300);
      estado = { ...estado, pasos: estado.pasos.map((x) => (x.clave === p.clave ? { ...x, hecho: true } : x)) };
      await espera(250);
    }
    for (const r of respuestas) {
      mensajes = [...mensajes, { id: id(), de: 'rodrigo', ...r }];
      await espera(900);
    }
    estado = { trabajando: false, pasos: [] };
  };

  const responder = (texto, conFoto) => {
    const t = texto.toLowerCase();
    if (conFoto) {
      return trabajar([paso('foto', 'Mirando tu foto'), paso('pedido', 'Revisando tu pedido de hoy')], [
        { texto: 'Te pido disculpas. Eso no es lo que pediste y el error es nuestro.', tarjeta: { tipo: 'comparacion', datos: { pediste: 'Ensalada César con filete de pollo', seVe: 'Otro plato, no es una ensalada' } } },
        { texto: 'Ya le pasé tu foto a cocina para que revisen qué falló hoy. Nos comprometemos a que no te vuelva a pasar.' },
      ]);
    }
    if (/devuelv|devolver/.test(t)) {
      return trabajar([paso('plan', 'Mirando tu plan y tus entregas')], [
        { texto: 'Te entiendo, es justo. Te devuelvo esta entrega a tu saldo para que la uses otro día. ¿Lo confirmas?', acciones: [{ id: 'dev', texto: 'Sí, devolver mi entrega', principal: true }, { id: 'per', texto: 'Hablar con una persona' }] },
      ]);
    }
    if (/lleg|demora|tarde|almuerzo/.test(t)) {
      return trabajar([paso('lee', 'Leyendo tu mensaje'), paso('pedido', 'Revisando tu pedido de hoy'), paso('ruta', 'Consultando la ruta de tu motorizado')], [
        { texto: 'Tienes razón en molestarte. Ya revisé tu pedido:', tarjeta: { tipo: 'pedido', datos: { plato: 'Alverja partida con filete de pollo', etiqueta: 'Con retraso', total: 6, hechos: 4, nota: 'Tu motorizado entregó hace 4 minutos. Falta 1 entrega antes de la tuya.' } } },
        { texto: 'Debería llegarte entre la 1:50 y las 2:00.', acciones: [{ id: 'esp', texto: 'Lo espero', principal: true }, { id: 'per', texto: 'Hablar con una persona' }] },
      ]);
    }
    if (/chiste|tarea|código|codigo|poema|fútbol|futbol/.test(t)) {
      return trabajar([paso('lee', 'Leyendo tu mensaje')], [
        { texto: 'Eso se me escapa: yo solo veo lo de tu servicio en Allpa Food. Con tu menú, tu plan o tus entregas sí te ayudo al toque.' },
      ]);
    }
    return trabajar([paso('lee', 'Leyendo tu mensaje'), paso('menu', 'Buscando platos para tu meta')], [
      { texto: 'De tu menú de la semana, yo iría por estos:', tarjeta: { tipo: 'platos', datos: { items: [{ nombre: 'Lunes: Ensalada César con filete de pollo', detalle: '490 kcal · 32 g de proteína' }, { nombre: 'Martes: Ensalada de quinua con filete de pollo', detalle: 'Te llena por la quinua' }] } } },
      { texto: '¿Te los dejo elegidos?', acciones: [{ id: 'ele', texto: 'Sí, elígelos', principal: true }, { id: 'otr', texto: 'Muéstrame otros' }] },
    ]);
  };

  const foto = (desde) => ({ mensajes: mensajes.filter((m) => Number(m.id) > Number(desde || 0)), estado });
  return {
    conversacion: async () => ({ mensajes, estado, persona: { disponible: true, horario: 'hasta las 5 p.m.' } }),
    novedades: async (desde) => foto(desde),
    enviar: async (texto, fotoId) => {
      const m = { id: id(), de: 'cliente', texto, fotoUrl: fotoId || undefined };
      mensajes = [...mensajes, m];
      responder(texto || '', !!fotoId);
      return { id: m.id };
    },
    accion: async (accionId) => {
      const antes = n;
      mensajes = mensajes.map((m) => ({ ...m, acciones: undefined }));
      trabajar([paso('guarda', 'Guardando tu cambio')], [
        { texto: accionId === 'per' ? 'Listo, ya le dejé tu caso con el resumen a una persona del equipo. Te escribe por aquí.' : 'Listo, quedó hecho.' },
      ]);
      return foto(antes);
    },
    persona: async () => { const antes = n; trabajar([paso('per', 'Pasándote con una persona')], [{ texto: 'Ya le dejé tu caso a una persona del equipo. Te escribe por aquí.' }]); return foto(antes); },
    foto: async (archivo) => ({ fotoId: URL.createObjectURL(archivo), url: URL.createObjectURL(archivo) }),
  };
};
