import SidebarCustom from 'componentes/Admin/Sidebar/Sidebar';
import { FooterCustom } from 'componentes/Footer';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

const LayoutConSidebar = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SidebarCustom />

      <Layout
        className="site-layout"
        style={{
          marginLeft: 0, // Sin margen, contenido ocupa todo el ancho
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: '80vh' }}>
            <Outlet />
          </div>
        </Content>

        <FooterCustom />
      </Layout>
    </Layout>
  );
};

export default LayoutConSidebar;
