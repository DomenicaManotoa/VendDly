import "leaflet/dist/leaflet.css";
import { Login } from './Controllers/Login';
import Home from 'componentes/Admin/Home/Home';
import Pedidos from 'componentes/Admin/Pedidos/Index';
import Catalogo from 'componentes/Admin/Catalogo/Catalogo';
import Facturas from 'componentes/Admin/Facturas/Facturas';
import Entregas from 'componentes/Admin/Entregas/Entregas';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Clientes from 'componentes/Admin/Clientes/IndexClientes';
import Inventario from 'componentes/Admin/Inventario/Inventario_Index';
import LayoutConSidebar from 'componentes/Admin/Sidebar/LayoutConSidebar';
import HomeVendedor from 'componentes/Vendedor/Home Vendedor/Home_Vendedor';
import HomeBodeguero from 'componentes/Bodeguero/Home Bodeguero/HomeBodeguero';
import HomeFacturador from 'componentes/Facturador/Home Facturador/HomeFacturador';
import HomeTransportista from 'componentes/Transportista/Home Transportista/Home_Transportiste';
import LayoutConSidebarBodega from 'componentes/Bodeguero/Sidebar Bodeguero/LayoutConSidebarBodega';
import LayoutConSidebarFacturador from 'componentes/Facturador/Sidebar Facturador/LayoutConSideFacturador';
import LayoutConSidebarTransportista from 'componentes/Transportista/Sidebar Transportista/LayoutConSidebarTransportista';
import LayoutConSidebarVendedor from 'componentes/Vendedor/Sidebar Vendedor/LayoutConSidebarVendedor';
import Usuarios from 'componentes/Admin/Empleados/Index_usuarios';
import Categorias_Admin from 'componentes/Admin/Categorias/Categorias_Admin';
import Roles_Admin from 'componentes/Admin/Roles/Roles_Admin';
import Marcas_Admin from 'componentes/Admin/Marcas/Marcas_Admin';
import CatalogoBodeguero from 'componentes/Bodeguero/Catalogo Bodeguero/Catalogo_Bodeguero';
import InventarioBodeguero from 'componentes/Bodeguero/Inventario Bodeguero/Inventario_Bodeguero';
import ClientesFacturador from 'componentes/Facturador/Clientes Facturador/Clientes_Facturador';
import FacturarFacturador from 'componentes/Facturador/Facturar Facturador/Facturar_Facturador';
import PedidosFacturador from 'componentes/Facturador/Pedidos Facturador/Pedidos_Facturador';
import VendedorFacturador from 'componentes/Facturador/Vendedor Facturador/Vendedor_Facturador';
import ClientesTransportista from 'componentes/Transportista/Clientes Transportista/Clientes_Transportista';
import PedidosTransportista from 'componentes/Transportista/Pedidos Transportista/Pedidos_Transportista';
import RutasTransportista from 'componentes/Transportista/Rutas Transportista/Rutas_Transportista';
import CajaVendedor from 'componentes/Vendedor/Caja Vendedor/Caja_Vendedor';
import CatalogoVendedor from 'componentes/Vendedor/Catalogo Vendedor/Catalogo_Vendedor';
import ClientesVendedor from 'componentes/Vendedor/Clientes Vendedor/Clientes_Vendedor';
import InventarioVendedor from 'componentes/Vendedor/Inventario Vendedor/Inventario_Vendedor';
import PedidosVendedor from 'componentes/Vendedor/Pedidos Vendedor/Pedidos_Vendedor';
import RutasVendedor from 'componentes/Vendedor/Rutas Vendedor/Rutas_Vendedor';
import Rutas from 'componentes/Admin/Rutas/Rutas';

// ✅ IMPORTAR PROTECTEDROUTE - AGREGAR ESTA LÍNEA
import { ProtectedRoute } from 'componentes/ProtectedRoute';
import CategoriaBodeguero from "componentes/Bodeguero/Categoria Bodeguero/CategoriaBodeguero";
import MarcaBodeguero from "componentes/Bodeguero/Marca Bodeguero/MarcaBodeguero";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} /> 
        
        {/* ✅ CAMBIO: Envolver LayoutConSidebar con ProtectedRoute */}
        <Route element={
          <ProtectedRoute>
            <LayoutConSidebar />
          </ProtectedRoute>
        }>
          <Route path="/home" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/clientes" element={<Clientes/>} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/empleados" element={<Usuarios />} />
          <Route path="/entregas" element={<Entregas />} />
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/categorias" element={<Categorias_Admin />} />
          <Route path="/marcas" element={<Marcas_Admin />} />
          <Route path="/roles" element={<Roles_Admin />} />
          <Route path="/rutas" element={<Rutas />} />
        </Route>

        {/* ✅ CAMBIO: Envolver LayoutConSidebarBodega con ProtectedRoute */}
        <Route element={
          <ProtectedRoute>
            <LayoutConSidebarBodega />
          </ProtectedRoute>
        }>
          <Route path="/bodega/home" element={<HomeBodeguero />} />
          <Route path ="/bodega/inventario" element={<InventarioBodeguero />} />
          <Route path ="/bodega/catalogo" element={<CatalogoBodeguero />} />
          <Route path="/bodega/categoria" element={<CategoriaBodeguero />} />
          <Route path="/bodega/marca" element={<MarcaBodeguero />} />
        </Route>

        {/* ✅ CAMBIO: Envolver LayoutConSidebarFacturador con ProtectedRoute */}
        <Route element={
          <ProtectedRoute>
            <LayoutConSidebarFacturador />
          </ProtectedRoute>
        }>
          <Route path="/facturador/home" element={<HomeFacturador />} />
          <Route path="/facturador/clientes" element={<ClientesFacturador />} />
          <Route path="/facturador/vendedor" element={<VendedorFacturador />} />
          <Route path="/facturador/pedidos" element={<PedidosFacturador />} />
          <Route path="/facturador/facturar" element={<FacturarFacturador />} />
        </Route>

        {/* ✅ CAMBIO: Envolver LayoutConSidebarTransportista con ProtectedRoute */}
        <Route element={
          <ProtectedRoute>
            <LayoutConSidebarTransportista />
          </ProtectedRoute>
        }>
          <Route path="/transportista/home" element={<HomeTransportista />} />
          <Route path="/transportista/clientes" element={<ClientesTransportista />} />
          <Route path="/transportista/pedidos" element={<PedidosTransportista />} />
          <Route path="/transportista/rutas" element={<RutasTransportista />} />

        </Route>
        
        {/* ✅ CAMBIO: Envolver LayoutConSidebarVendedor con ProtectedRoute */}
        <Route element={
          <ProtectedRoute>
            <LayoutConSidebarVendedor />
          </ProtectedRoute>
        }>
          <Route path="/vendedor/home" element={<HomeVendedor />} />
          <Route path="/vendedor/inventario" element={<InventarioVendedor />} />
          <Route path="/vendedor/catalogo" element={<CatalogoVendedor />} />
          <Route path="/vendedor/clientes" element={<ClientesVendedor />} />
          <Route path="/vendedor/rutas" element={<RutasVendedor />} />
          <Route path="/vendedor/pedidos" element={<PedidosVendedor />} />
          <Route path="/vendedor/caja" element={<CajaVendedor />} />
        </Route>

      </Routes>
    </BrowserRouter>
    
  );
}