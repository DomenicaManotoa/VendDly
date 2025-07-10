import Home from 'componentes/Admin/Home/Home';
import { Login } from './Controllers/Login';
import Catalogo from 'componentes/Admin/Catalogo/Catalogo';
import LayoutConSidebar from 'componentes/Admin/Sidebar/LayoutConSidebar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Clientes from 'componentes/Admin/Clientes/IndexClientes';
import Inventario from 'componentes/Admin/Inventario/Inventario_Index';
import Entregas from 'componentes/Admin/Entregas/Entregas';
import Facturas from 'componentes/Admin/Facturas/Facturas';
import Pedidos from 'componentes/Admin/Pedidos/Pedidos';
import LayoutConSidebarBodega from 'componentes/Bodeguero/Sidebar Bodeguero/LayoutConSidebarBodega';
import HomeBodeguero from 'componentes/Bodeguero/Home Bodeguero/HomeBodeguero';
import LayoutConSidebarFacturador from 'componentes/Facturador/Sidebar Facturador/LayoutConSideFacturador';
import HomeFacturador from 'componentes/Facturador/Home Facturador/HomeFacturador';
import HomeTransportista from 'componentes/Transportista/Home Transportista/Home_Transportiste';
import LayoutConSidebarTransportista from 'componentes/Transportista/Sidebar Transportista/LayoutConSidebarTransportista';
import LayoutConSidebarVendedor from 'componentes/Vendedor/Sidebar Vendedor/LayoutConSidebarVendedor';
import HomeVendedor from 'componentes/Vendedor/Home Vendedor/Home_Vendedor';
import Usuarios from 'componentes/Admin/Empleados/Index_usuarios';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} /> 
        {/* Rutas que van dentro del menu */}
        <Route element={<LayoutConSidebar />}>
          <Route path="/home" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/clientes" element={<Clientes/>} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/empleados" element={<Usuarios />} />
          <Route path="/entregas" element={<Entregas />} />
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/pedidos" element={<Pedidos />} />
        </Route>
        <Route element={<LayoutConSidebarBodega />}>
          <Route path="/bodega/home" element={<HomeBodeguero />} />

        </Route>
        <Route element={<LayoutConSidebarFacturador />}>
          <Route path="/facturador/home" element={<HomeFacturador />} />
        </Route>

        <Route element={<LayoutConSidebarTransportista />}>
          <Route path="/transportista/home" element={<HomeTransportista />} />
        </Route>
        
        <Route element={<LayoutConSidebarVendedor />}>
          <Route path="/vendedor/home" element={<HomeVendedor />} />
        </Route>

      </Routes>
    </BrowserRouter>
    
  );
}
