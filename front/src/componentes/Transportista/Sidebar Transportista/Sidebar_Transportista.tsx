import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Modal } from 'antd';
import {
  EnvironmentOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const SidebarTransportista: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    console.log('Click en:', key);

    if (key === 'logout') {
      setShowLogoutModal(true); // Mostrar el modal personalizado
    } else {
      navigate(key);
    }
  };

  const menuItems = [
    { key: '/transportista/home', icon: <HomeOutlined />, label: 'Home' },
     {
    key: '/transportista/clientes',
    icon: <TeamOutlined />,
    label: 'Clientes',
  },
  {
    key: '/transportista/pedidos',
    icon: <ShoppingCartOutlined />,
    label: 'Pedidos',
  },
  {
    key: '/transportista/rutas',
    icon: <EnvironmentOutlined />,
    label: 'Rutas',
  },
  ];

  return (
    <>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={256}
        theme="light"
        style={{
          backgroundColor: '#ABD904',
          position: 'relative',
        }}
      >
        <Button
          onClick={toggleCollapsed}
          style={{
            margin: 16,
            backgroundColor: '#ABD904',
            borderColor: '#ABD904',
            color: '#000',
            fontWeight: 'bold',
          }}
          type="primary"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>

        <Menu
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            backgroundColor: '#ABD904',
            borderRight: 'none',
          }}
        />

        <Menu
          mode="inline"
          theme="light"
          onClick={handleMenuClick}
          style={{
            backgroundColor: '#ABD904',
            borderRight: 'none',
            position: 'absolute',
            bottom: 0,
            width: '100%',
          }}
        >
          <Menu.Item
            key="logout"
            icon={<LogoutOutlined />}
            className="logout-item"
          >
            Cerrar Sesión
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Modal personalizado en lugar de Modal.confirm */}
      <Modal
        title="¿Cerrar sesión?"
        open={showLogoutModal}
        onOk={() => {
          setShowLogoutModal(false);
          navigate('/');
        }}
        onCancel={() => setShowLogoutModal(false)}
        okText="Sí"
        cancelText="No"
        okType="danger"
        centered
      >
        <p>¿Estás seguro de que deseas cerrar sesión?</p>
      </Modal>
    </>
  );
};

export default SidebarTransportista;
