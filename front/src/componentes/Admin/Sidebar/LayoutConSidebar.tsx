import SidebarCustom from 'componentes/Admin/Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';

const LayoutConSidebar = () => {
  return (
    <div style={{ display: 'flex' }}>
      <SidebarCustom />
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default LayoutConSidebar;
