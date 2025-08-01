import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Modal, Spin } from 'antd';
import {
  AppstoreOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useLogout } from '../../../hooks/useLogout'; // Importa el hook

const { Sider } = Layout;

const SidebarBodega: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Usa el hook de logout
  const { showLogoutModal, isLoggingOut, handleLogout, showLogoutConfirmation, hideLogoutModal } = useLogout();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      showLogoutConfirmation();
    } else {
      navigate(key);
    }
  };

  const menuItems = [
    { key: '/bodega/home', icon: <HomeOutlined />, label: 'Home Bodega' },
    { key: '/bodega/inventario', icon: <ShoppingOutlined />, label: 'Inventario Bodega' },
    { key: '/bodega/catalogo', icon: <AppstoreOutlined />, label: 'Catálogo Bodega' },
  ];

  // Item de logout con loading
  const logoutItem = [
    {
      key: 'logout',
      icon: isLoggingOut ? <LoadingOutlined spin /> : <LogoutOutlined />,
      label: isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión',
      disabled: isLoggingOut,
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
          disabled={isLoggingOut}
          style={{
            margin: 16,
            backgroundColor: '#ABD904',
            borderColor: '#ABD904',
            color: '#000',
            fontWeight: 'bold',
            opacity: isLoggingOut ? 0.5 : 1,
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
            opacity: isLoggingOut ? 0.5 : 1,
          }}
          disabled={isLoggingOut}
        />

        <Menu
          mode="inline"
          theme="light"
          items={logoutItem}
          onClick={handleMenuClick}
          style={{
            backgroundColor: isLoggingOut ? '#90a832' : '#ABD904',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            marginBottom: 16,
          }}
        />

        {/* Indicador de loading superpuesto */}
        {isLoggingOut && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(171, 217, 4, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            color: '#000',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              Cerrando Sesión...
            </div>
          </div>
        )}
      </Sider>

      {/* Modal de confirmación */}
      <Modal
        title="🔐 ¿Cerrar sesión?"
        open={showLogoutModal}
        onOk={handleLogout}
        onCancel={hideLogoutModal}
        okText={isLoggingOut ? "Cerrando..." : "Sí, cerrar sesión"}
        cancelText="Cancelar"
        okType="danger"
        centered
        confirmLoading={isLoggingOut}
        closable={!isLoggingOut}
        maskClosable={!isLoggingOut}
        keyboard={!isLoggingOut}
        okButtonProps={{
          loading: isLoggingOut,
          icon: isLoggingOut ? <LoadingOutlined /> : <LogoutOutlined />
        }}
      >
        <p>
          {isLoggingOut
            ? "🔄 Cerrando tu sesión de forma segura..."
            : "¿Estás seguro de que deseas cerrar sesión? Serás redirigido a la página de inicio de sesión."
          }
        </p>
        {isLoggingOut && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin />
          </div>
        )}
      </Modal>
    </>
  );
};

export default SidebarBodega;