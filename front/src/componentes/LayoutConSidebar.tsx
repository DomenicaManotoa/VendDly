import SidebarCustom from './Sidebar';
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
