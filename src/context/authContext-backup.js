import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { API_URL } from '../config';
//import axios from 'axios';
export const AuthContext = createContext();

const storageToken = 'aftkn';
const storageInfo = 'inf';

export default function AuthContextProvider({children}) {

    const baseUrl= `${API_URL}`;
    
    const [token,setToken] = useState(() =>
        window.localStorage.getItem(storageToken)
    );

    const [planInfo,setPlanInfo] = useState(() =>
        window.localStorage.getItem(storageInfo)
    );

    const [cartItems,setCartItems] = useState(()=>{
        try {
            const productosEnLocalStorage = localStorage.getItem('cartProducts');
            return productosEnLocalStorage ? JSON.parse(productosEnLocalStorage) : [];
        } catch (error) {
            return [];
        }
    });

    const [cartAdicionales,setCartAdicionales] = useState(()=>{
        try {
            const productosEnLocalStorage = localStorage.getItem('cartAdicional');
            return productosEnLocalStorage ? JSON.parse(productosEnLocalStorage) : [];
        } catch (error) {
            return [];
        }
    });

    const [loadResp,setLoadResp] = useState(false);

    const handleUpdateToken = (code,data) =>{
        window.localStorage.setItem('aftkn',code);
        if(data){
            window.localStorage.setItem('inf',JSON.stringify(data));
            setPlanInfo(data)
        }
        setToken(code);
    }

    const addItemToCart = (product) => {
        const inCart = cartItems.find(
            (productInCart) => productInCart.id === product.id
        )
        
        if(inCart){
            setCartItems(
                cartItems.map((productInCart,index) =>{
                    if(product.id === productInCart.id){
                        return {...inCart,amount:inCart.amount + 1}
                    }else{
                        return {...productInCart,amount:productInCart.amount + 0}
                    }
                })
            );
        }else{
            setCartItems([...cartItems,{...product, amount:1}])
        }
    }

    const addItemAdToCart = (product) => {
        const inCart = cartAdicionales.find(
            (productInCart) => productInCart.id === product.id
        )
        
        if(inCart){
            setCartAdicionales(
                cartAdicionales.map((productInCart,index) =>{
                    if(product.id === productInCart.id){
                        return {...inCart,amount:inCart.amount + 1}
                    }else{
                        return {...productInCart,amount:productInCart.amount + 0}
                    }
                })
            );
        }else{
            setCartAdicionales([...cartAdicionales,{...product, amount:1}])
        }
    }

    const deleteItemToCart = (product) => {
        
        const inCart = cartItems.find(
            (productInCart) => productInCart.id === product.id
        );

        if(inCart.amount === 1){
            setCartItems(
                cartItems.filter((productInCart) => productInCart.id !== product.id)
                
            );
        }else{
            setCartItems(
                cartItems.map((productInCart)=>{
                    if(productInCart.id === product.id){
                        return {...inCart,amount:inCart.amount - 1};
                    }else{
                        return productInCart;
                    }
                })
            )
        }
    };

    const deleteItemAdToCart = (product) => {

        const inCart = cartAdicionales.find(
            (productInCart) => productInCart.id === product.id
        );

        if(inCart.amount === 1){
            setCartAdicionales(
                cartAdicionales.filter((productInCart) => productInCart.id !== product.id)
            );
        }else{
            setCartAdicionales(
                cartAdicionales.map((productInCart)=>{
                    if(productInCart.id === product.id){
                        return {...inCart,amount:inCart.amount - 1};
                    }else{
                        return productInCart;
                    }
                })
            )
        }
    };

    const expirationDuration = 1000 * 60 * 60 * 12; // 12 hours

    const emptyCart = () =>{
        localStorage.removeItem('cartProducts');
        localStorage.removeItem('cartAdicional');
        setCartItems([]);
        setCartAdicionales([]);
    }

    const removeLocalstorage = () =>{
        window.localStorage.removeItem('regfrm');
        window.localStorage.removeItem('registro_step_cache');
        window.localStorage.removeItem('valfact');
    }

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
            removeLocalstorage
        }),[
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
            removeLocalstorage
        ]
    );

    useEffect(()=>{
        localStorage.removeItem('cartProducts');
        localStorage.removeItem('cartAdicional');
        setTimeout(()=> {
            localStorage.removeItem('cartProducts');
            localStorage.removeItem('cartAdicional');
        }, expirationDuration);
    },[cartItems,cartAdicionales])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    return useContext(AuthContext);
}