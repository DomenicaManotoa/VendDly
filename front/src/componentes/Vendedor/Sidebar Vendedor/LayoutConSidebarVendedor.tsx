import SidebarCustom from "componentes/Vendedor/Sidebar Vendedor/Sidebar_Vendedor";
import { Outlet } from "react-router-dom";

const LayoutConSidebarVendedor: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <SidebarCustom />
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default LayoutConSidebarVendedor;
