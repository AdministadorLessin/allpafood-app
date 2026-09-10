import React,{useState} from "react"

// Css
import './sidebar.scss';

import logoIsotipo from '../../assets/img/isotipo_allpafood.png';
import logoIsotipo2 from '../../assets/img/logo_allpafood.png';

import { Link,NavLink } from 'react-router-dom';

// Iconos - Menu
import icoHome from '../../assets/img/ico_home.png';
import icoMenu from '../../assets/img/ico_menu.png';
import icoSalud from '../../assets/img/ico_bienestar.png';
import icoEntregas from '../../assets/img/ico_marker.png';
import icoPayment from '../../assets/img/ico_payment.png';
import icoFaq from '../../assets/img/ico_support.png';

import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Sidebar = ({setOpenReprogramar,openReprogramar}) => {

    const planInfoT=  JSON.parse(window.localStorage.getItem('inf'))

    const sideReprogragamar = () =>{
        setOpenReprogramar(!openReprogramar);
    }

    const [menu,setMenu] = useState(false);
    const openMenu = () =>{
        setMenu(true);
    }
    const closeMenu = () =>{
        setMenu(false);
    }

    return (
        <div className="sideBar">
            <figure className="sideLogo">
                <img src={logoIsotipo} alt="" />
            </figure>

            <div className={menu ? 'sideMenu sideMenuAct':'sideMenu'}>
                <div className="sideClose" onClick={closeMenu}>
                    <CloseIcon />
                </div>
                <figure className="sideLogoResp">
                    <img src={logoIsotipo2} alt="" />
                </figure>
                <ul>
                    <li>
                        <NavLink activeClassName={'active'}  onClick={closeMenu} to="/">
                            <div className="iconSvg">
                                <img src={icoHome} alt="" />
                            </div>
                            <span>Home</span>
                        </NavLink>
                    </li>
                    <li>
                        <a onClick={()=>{sideReprogragamar();closeMenu();}}>
                            <div className="iconSvg">
                                <img src={icoMenu} alt="" />
                            </div>
                            <span>Menu Semanal</span>
                        </a>
                    </li>
                    <li>
                        {/* Allpa+ va arriba de Salud y bienestar a proposito: es
                            lo que diferencia al plan de la competencia y lo que
                            el cliente no sabia que tenia. */}
                        <NavLink activeClassName={'active'} onClick={closeMenu} to="/beneficios">
                            <div className="iconSvg">
                                <img src={icoSalud} alt="" />
                            </div>
                            <span>Allpa+ Beneficios</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink activeClassName={'active'}  onClick={closeMenu} to="/salud-y-bienestar">
                            <div className="iconSvg">
                                <img src={icoSalud} alt="" />
                            </div>
                            <span>Salud y bienestar</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink activeClassName={'active'}  onClick={closeMenu} to="/ubicaciones">
                            <div className="iconSvg">
                                <img src={icoEntregas} alt="" />
                            </div>
                            <span>Datos de entrega</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink activeClassName={'active'}  onClick={closeMenu} to="/facturacion">
                            <div className="iconSvg">
                                <img src={icoPayment} alt="" />
                            </div>
                            <span>Facturación</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink activeClassName={'active'}  onClick={closeMenu} to="/preguntas-frecuentes">
                            <div className="iconSvg">
                                <img src={icoFaq} alt="" />
                            </div>
                            <span>Soporte</span>
                        </NavLink>
                    </li>
                </ul>
            </div>

            <div className="sideProfile">
                <NavLink onClick={closeMenu} to="/perfil">
                    <figure>
                        {planInfoT && planInfoT.profile?.image ?
                            <img src={'assets/img/avatars/avatar_'+planInfoT.profile?.image+'.jpg' } />
                        : planInfoT && !planInfoT.profile?.image && planInfoT.profile?.information.gender === "M" ?
                            <img src={'assets/img/avatars/avatar_5.jpg' } />
                        : planInfoT && !planInfoT.profile?.image && planInfoT.profile?.information.gender === "F" ?
                            <img src={'assets/img/avatars/avatar_6.jpg' } />
                        :
                            <span className="imgLoad"></span>
                        }
                    </figure>
                </NavLink>
            </div>

            <div className="sideHamburger" onClick={openMenu}>
                <MenuIcon />
            </div>
        </div>
    )
};

export default Sidebar;
