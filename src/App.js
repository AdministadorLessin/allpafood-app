
import '../src/assets/css/global.scss';
import React from 'react'

import { BrowserRouter, Route,Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import DashboadHome from './pages/dashboard/home/index.js';
import DashboardMotorizado from './pages/dashboard/motorizado/motorizado';
import PerfilPage from './pages/dashboard/perfil/perfil.js';
import FacturacionPage from './pages/dashboard/facturacion/facturacion';
import BeneficiosPage from './pages/dashboard/beneficios/beneficios';
import BlogPage from './pages/dashboard/blog/blog';
import DetallePage from './pages/dashboard/blog/detalle';
import PreguntasFrecuentesPage from './pages/dashboard/preguntas-frecuentes/preguntas-frecuentes';
import UbicacionesPage from './pages/dashboard/ubicaciones/ubicaciones';
import LoginPage from './pages/autenticacion/login/login';
import RegistroPage from './pages/autenticacion/registro/registro';
import PlanesPage from './pages/dashboard/planes/planes';
import CheckoutPage from './pages/dashboard/checkout/checkout';
import MenuPage from './pages/dashboard/menu/menu';
import MiPlanPage from './pages/dashboard/miplan/miplan';

import AuthContextProvider from './context/authContext';
import RegistroPageProfile from './pages/autenticacion/registro/profile';

import ProtectedRoutes from './components/ultil/ProtectedRoutes/ProtectedRoutes';

function App() {

 
  return (
      <AuthContextProvider>
        <HelmetProvider>
            <BrowserRouter >
                <Routes>
                  <Route path='' element={<ProtectedRoutes />}>
                    <Route path='/' element={<DashboadHome />} />
                    <Route path='/motorizado' element={<DashboardMotorizado />} />
                    <Route path='/perfil' element={<PerfilPage />} />
                    <Route path='/facturacion' element={ <FacturacionPage /> } />
                    <Route path='/beneficios' element={ <BeneficiosPage /> } />
                    <Route path='/salud-y-bienestar' element={ <BlogPage /> } />
                    <Route path='/salud-y-bienestar/detalle' element={ <DetallePage /> } />
                    <Route path='/preguntas-frecuentes' element={ <PreguntasFrecuentesPage /> } />
                    <Route path='/ubicaciones' element={ <UbicacionesPage /> } />
                    <Route path='/planes' element={ <PlanesPage /> } />
                    <Route path='/checkout' element={ <CheckoutPage /> } />
                    {/* Pantalla propia para elegir el menu, la tarea semanal del
                        cliente. Antes solo existia dentro del panel. */}
                    <Route path='/menu' element={ <MenuPage /> } />
                    {/* Pantalla propia del plan: envios restantes, vencimiento,
                        creditos y compras. Antes no existia en ningun lado. */}
                    <Route path='/mi-plan' element={ <MiPlanPage /> } />
                    <Route path='/registro/perfil' element={ <RegistroPageProfile /> } />
                  </Route>
                  { 
                    // Rutas Publicas
                  }
                  <Route path='/ingresar' element={ <LoginPage /> } />
                  <Route path='/registro' element={ <RegistroPage /> } />
                </Routes>
            </BrowserRouter>
          
        </HelmetProvider>
      </AuthContextProvider>
  );
}

export default App;
