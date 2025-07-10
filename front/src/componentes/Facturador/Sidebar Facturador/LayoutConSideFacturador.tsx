import SidebarCustom from './Sidebar_Facturador';
import { Outlet } from "react-router-dom";

const LayoutConSidebarFacturador: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <SidebarCustom />
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default LayoutConSidebarFacturador;
