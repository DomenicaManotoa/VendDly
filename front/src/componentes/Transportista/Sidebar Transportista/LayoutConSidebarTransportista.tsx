import SidebarCustom from "componentes/Transportista/Sidebar Transportista/Sidebar_Transportista";
import { Outlet } from "react-router-dom";


const LayoutConSidebarTransportista: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <SidebarCustom />
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default LayoutConSidebarTransportista;
