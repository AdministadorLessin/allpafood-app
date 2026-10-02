import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { olvidarCelular } from '../avisos';

export const AuthContext = createContext();

const STORAGE_KEYS = {
  TOKEN: 'aftkn',
  INFO: 'inf',
  CART_PRODUCTS: 'cartProducts',
  CART_ADICIONAL: 'cartAdicional',
  EMPRESA: 'af_empresa',
};

// Custom Hook auxiliar para manejar estados sincronizados con LocalStorage
function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error al guardar en localStorage [${key}]:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default function AuthContextProvider({ children }) {
  const baseUrl = `${API_URL}`;

  // Estados sincronizados automáticamente con LocalStorage
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN) || null);
  const [planInfo, setPlanInfo] = useState(() => {
    try {
      const info = localStorage.getItem(STORAGE_KEYS.INFO);
      return info ? JSON.parse(info) : null;
    } catch {
      return null;
    }
  });

  /* La empresa que le paga el almuerzo, si es que hay una.
     Se guarda para que la franja de la empresa aparezca en el primer pintado
     y no un segundo despues, que se ve como un parpadeo. */
  const [empresa, setEmpresa] = useState(() => {
    try {
      const e = localStorage.getItem(STORAGE_KEYS.EMPRESA);
      return e ? JSON.parse(e) : null;
    } catch {
      return null;
    }
  });

  const [cartItems, setCartItems] = useLocalStorageState(STORAGE_KEYS.CART_PRODUCTS, []);
  const [cartAdicionales, setCartAdicionales] = useLocalStorageState(STORAGE_KEYS.CART_ADICIONAL, []);
  const [loadResp, setLoadResp] = useState(false);

  /* Un cliente normal recibe {corporativo:false} y todo sigue igual. Si falla
     la consulta no se toca lo guardado: es mejor pintar la franja de ayer que
     dejar al colaborador viendo precios que no le corresponden. */
  useEffect(() => {
    if (!token) {
      setEmpresa(null);
      localStorage.removeItem(STORAGE_KEYS.EMPRESA);
      return;
    }
    axios.get(`${baseUrl}user/empresa`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const e = r.data?.data ?? r.data ?? null;
        setEmpresa(e);
        try { localStorage.setItem(STORAGE_KEYS.EMPRESA, JSON.stringify(e)); } catch { /* sin espacio */ }
      })
      .catch(() => {});
  }, [token, baseUrl]);

  // Manejadores encapsulados con useCallback para evitar re-renderizados inútiles
  const handleUpdateToken = useCallback((code, data) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, code);
    setToken(code);
    if (data) {
      localStorage.setItem(STORAGE_KEYS.INFO, JSON.stringify(data));
      setPlanInfo(data);
    }
  }, []);

  // Función genérica para manipular cualquier carrito
  const updateCartProduct = useCallback((setCart, productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newAmount = item.amount + delta;
            return newAmount > 0 ? { ...item, amount: newAmount } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  /* Una compra lleva UN plan. Elegir otro lo reemplaza.
     Antes se anadia al carrito: quien tocaba "Elegir Nutrivital", volvia y
     tocaba "Elegir Fitfuel" terminaba con los dos dentro. El total del
     checkout suma todos los cartItems, pero al cobrar solo viaja
     cartItems[0].id —tanto en tarjeta como en Yape—, asi que el cliente
     pagaba los dos planes y recibia uno. */
  const addItemToCart = useCallback((product) => {
    setCartItems([{ ...product, amount: 1 }]);
  }, [setCartItems]);

  const deleteItemToCart = useCallback((product) => {
    updateCartProduct(setCartItems, product.id, -1);
  }, [updateCartProduct, setCartItems]);

  /* Los adicionales son un si/no, no una cantidad.
     Sumar amount era enganoso en las dos direcciones: el total del checkout
     hace reduce sobre current.price sin mirar amount, y al backend solo le
     viaja cartAdicionales.map(item => item.type) —una lista de tipos, donde
     un duplicado no significa nada—. Asi que agregar "Desayunos" tres veces
     mostraba 3 en el carrito, cobraba 1, y despues obligaba a pulsar quitar
     tres veces para sacarlo. Agregar dos veces ahora no cambia nada. */
  const addItemAdToCart = useCallback((product) => {
    setCartAdicionales((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      return exists ? prev : [...prev, { ...product, amount: 1 }];
    });
  }, [setCartAdicionales]);

  /* Quitar saca el adicional entero. Antes restaba uno a amount, asi que un
     item que hubiera llegado a 3 necesitaba tres toques para desaparecer. */
  const deleteItemAdToCart = useCallback((product) => {
    setCartAdicionales((prev) => prev.filter((item) => item.id !== product.id));
  }, [setCartAdicionales]);

  const emptyCart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CART_PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CART_ADICIONAL);
    
    setCartItems([]);
    setCartAdicionales([]);
  }, [setCartItems, setCartAdicionales]);

  const removeLocalstorage = useCallback(() => {
    ['regfrm', 'registro_step_cache', 'valfact','registro_data_cache'].forEach((key) => localStorage.removeItem(key));
  }, []);

  /**
   * Cerrar sesion. No existia en toda la app: quien entraba no podia salir, y
   * en un telefono prestado la siguiente persona veia su direccion, su
   * telefono y sus compras.
   *
   * Se borra TODO lo del cliente, no solo el token: los datos del perfil viven
   * en 'inf' y sobrevivian a cualquier limpieza parcial.
   */
  const logout = useCallback(() => {
    // Ese celular deja de recibir los avisos de esta cuenta (solo en el app).
    olvidarCelular(localStorage.getItem(STORAGE_KEYS.TOKEN));
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    ['needBrm', 'regfrm', 'registro_step_cache', 'valfact', 'registro_data_cache']
      .forEach((key) => localStorage.removeItem(key));

    setToken(null);
    setPlanInfo(null);
    setEmpresa(null);
    setCartItems([]);
    setCartAdicionales([]);
  }, [setCartItems, setCartAdicionales]);

  const coverCities = ([
    /* Zona de reparto. El borde este se abre para cubrir La Molina —que
       figuraba en la lista de distritos pero caia fuera de este poligono, asi
       que esa direccion no se podia guardar— y el sur baja hasta el limite de
       Chorrillos. Cada punto sale de la caja real del distrito, no a ojo:
       los 16 distritos de la lista quedan dentro, comprobados uno por uno. */
    {lat: -12.071775, lng: -77.127376},
    {lat: -12.050166, lng: -77.123215},
    {lat: -12.038534, lng: -77.043075},
    {lat: -12.042156, lng: -77.032632},
    {lat: -12.044691, lng: -77.018601},
    {lat: -12.040069, lng: -77.014401},
    {lat: -12.036135, lng: -77.007495},
    {lat: -12.042319, lng: -76.986942},
    {lat: -12.056884, lng: -76.969101},
    {lat: -12.050901, lng: -76.945000},
    {lat: -12.050901, lng: -76.877585},
    {lat: -12.128915, lng: -76.877585},
    {lat: -12.130000, lng: -76.955000},
    {lat: -12.149492, lng: -76.985267},
    {lat: -12.237816, lng: -76.966441},
    {lat: -12.237816, lng: -77.046373},
    {lat: -12.160000, lng: -77.046373},
    {lat: -12.134337, lng: -77.029721},
    {lat: -12.109753, lng: -77.055195},
    {lat: -12.099267, lng: -77.072022},
  ]);

  const value = useMemo(
    () => ({
      loadResp,
      setLoadResp,
      baseUrl,
      token,
      planInfo,
      empresa,
      esCorporativo: !!empresa?.corporativo,
      cartItems,
      cartAdicionales,
      handleUpdateToken,
      addItemToCart,
      deleteItemToCart,
      addItemAdToCart,
      deleteItemAdToCart,
      emptyCart,
      removeLocalstorage,
      logout,
      coverCities
    }),
    [
      loadResp,
      baseUrl,
      token,
      planInfo,
      empresa,
      cartItems,
      cartAdicionales,
      handleUpdateToken,
      addItemToCart,
      deleteItemToCart,
      addItemAdToCart,
      deleteItemAdToCart,
      emptyCart,
      removeLocalstorage,
      logout,
      coverCities
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de un AuthContextProvider');
  }
  return context;
}