import { Outlet } from "react-router-dom";
import SidebarCustom from "./Sidebar_Bodeguero";

const LayoutConSidebarBodega = () => {
  return (
    <div style={{ display: 'flex' }}>
      <SidebarCustom />
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default LayoutConSidebarBodega;
