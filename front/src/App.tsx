import Home from 'componentes/Home';
import { Login } from './Controllers/Login';
import Catalogo from 'componentes/Catalogo';
import LayoutConSidebar from 'componentes/LayoutConSidebar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Clientes from 'componentes/Clientes';
import { FooterCustom } from 'componentes/Footer';
import Usuarios from 'componentes/Empleados/Index_usuarios';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Login />} /> 
            {/* Rutas que van dentro del menu */}
            <Route element={<LayoutConSidebar />}>
              <Route path="/home" element={<Home />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path='/clientes' element={<Clientes />} />
              <Route path='/empleados' element={<Usuarios />} />
            </Route>
            {/* Rutas que van dentro del footer */}
          </Routes>
        </div>
        <div>
          <FooterCustom />
        </div>
      </div>
    </BrowserRouter>
  );
}
