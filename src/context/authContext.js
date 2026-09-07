import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

export const AuthContext = createContext();

const STORAGE_KEYS = {
  TOKEN: 'aftkn',
  INFO: 'inf',
  CART_PRODUCTS: 'cartProducts',
  CART_ADICIONAL: 'cartAdicional',
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

  const [cartItems, setCartItems] = useLocalStorageState(STORAGE_KEYS.CART_PRODUCTS, []);
  const [cartAdicionales, setCartAdicionales] = useLocalStorageState(STORAGE_KEYS.CART_ADICIONAL, []);
  const [loadResp, setLoadResp] = useState(false);

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

  const addItemToCart = useCallback((product) => {
    setCartItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      return exists
        ? prev.map((item) => (item.id === product.id ? { ...item, amount: item.amount + 1 } : item))
        : [...prev, { ...product, amount: 1 }];
    });
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
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    ['needBrm', 'regfrm', 'registro_step_cache', 'valfact', 'registro_data_cache']
      .forEach((key) => localStorage.removeItem(key));

    setToken(null);
    setPlanInfo(null);
    setCartItems([]);
    setCartAdicionales([]);
  }, [setCartItems, setCartAdicionales]);

  const coverCities = ([
    {lat: -12.071775, lng: -77.127376},
    {lat: -12.050166012430507, lng: -77.12321506194232},
    {lat: -12.038534368978064, lng: -77.04307515149316},
    {lat: -12.042156223443866, lng: -77.03263247775908},
    {lat: -12.044691206072324, lng: -77.01860092752652},
    {lat: -12.040068979242449, lng: -77.01440146938337},
    {lat: -12.036134638578853, lng: -77.00749458554263},
    {lat: -12.042318909975238, lng: -76.9869421953882},
    {lat: -12.056883818600367, lng: -76.96910095272972},
    {lat: -12.063516949630726, lng: -76.9406387898395},
    {lat: -12.082228713133365, lng: -76.93482507680285},
    {lat: -12.117424586830495, lng: -76.93835277213725},
    {lat: -12.106948284912896, lng: -76.96659496993122},
    {lat: -12.149492339619586, lng: -76.98526687489377},
    {lat: -12.151039653870129, lng: -77.02450049768188},
    {lat: -12.144791188231787, lng: -77.02546162670896},
    {lat: -12.134336752232585, lng: -77.02972141600992},
    {lat: -12.109753098397164, lng: -77.05519476345135},
    {lat: -12.099267229821463, lng: -77.07202239891171},
  ]);

  const value = useMemo(
    () => ({
      loadResp,
      setLoadResp,
      baseUrl,
      token,
      planInfo,
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