import SidebarCustom from 'componentes/Admin/Sidebar/Sidebar';
import { FooterCustom } from 'componentes/Footer';
import { Outlet } from 'react-router-dom';

const LayoutConSidebar = () => {
  return (
    <div>
    <div style={{ display: 'flex' }}>
      <SidebarCustom />
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
      { <FooterCustom />}
      </div>
  );
};

export default LayoutConSidebar;
