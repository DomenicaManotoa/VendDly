import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Modal, Spin } from 'antd';
import {
  EnvironmentOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useLogout } from '../../../hooks/useLogout';

const { Sider } = Layout;

type SidebarCustomProps = {
  onCollapseChange?: (collapsed: boolean) => void;
};

const SidebarTransportista: React.FC<SidebarCustomProps> = ({ onCollapseChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const { showLogoutModal, isLoggingOut, handleLogout, showLogoutConfirmation, hideLogoutModal } = useLogout();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const siderWidth = windowWidth < 768 ? (collapsed ? 0 : 200) : 256;

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onCollapseChange?.(newState);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    console.log('Click en:', key);

    if (key === 'logout') {
      showLogoutConfirmation();
    } else if (key.startsWith('/')) {
      navigate(key);
      if (windowWidth < 768) {
        setCollapsed(true);
        onCollapseChange?.(true);
      }
    }
  };

  const onCollapseHandler = (value: boolean) => {
    setCollapsed(value);
    onCollapseChange?.(value);
  };

  const onBreakpointHandler = (broken: boolean) => {
    setCollapsed(broken);
    onCollapseChange?.(broken);
  };

  const menuItems = [
    { key: '/transportista/home', icon: <HomeOutlined />, label: 'Home' },
    { key: '/transportista/clientes', icon: <TeamOutlined />, label: 'Clientes' },
    { key: '/transportista/pedidos', icon: <ShoppingCartOutlined />, label: 'Pedidos' },
    { key: '/transportista/rutas', icon: <EnvironmentOutlined />, label: 'Rutas' },
  ];

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
      {/* Botón toggle fijo, visible siempre */}
      {collapsed && (
        <Button
          onClick={toggleCollapsed}
          type="primary"
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 3000,
            backgroundColor: '#ABD904',
            borderColor: '#ABD904',
            color: '#000',
            fontWeight: 'bold',
          }}
          icon={<MenuUnfoldOutlined />}
        />
      )}

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapseHandler}
        collapsedWidth={0}
        breakpoint="md"
        onBreakpoint={onBreakpointHandler}
        width={siderWidth}
        theme="light"
        style={{
          backgroundColor: '#ABD904',
          position: 'fixed',
          height: '100vh',
          zIndex: 2000,
          left: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          display: collapsed ? 'none' : 'block',
        }}
      >
        {/* Botón toggle dentro del sidebar para cerrarlo */}
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
            width: '90%',
          }}
          type="primary"
          block
          icon={<MenuFoldOutlined />}
        />

        <Menu
          mode="inline"
          theme="light"
          inlineCollapsed={false}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            backgroundColor: '#ABD904',
            flexGrow: 1,
            borderRight: 'none',
            opacity: isLoggingOut ? 0.5 : 1,
            maxWidth: '100%',
            overflowX: 'hidden',
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
          <div
            style={{
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
              fontWeight: 'bold',
            }}
          >
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Cerrando Sesión...</div>
          </div>
        )}
      </Sider>

      {/* Modal de confirmación */}
      <Modal
        title="🔐 ¿Cerrar sesión?"
        open={showLogoutModal}
        onOk={handleLogout}
        onCancel={hideLogoutModal}
        okText={isLoggingOut ? 'Cerrando...' : 'Sí, cerrar sesión'}
        cancelText="Cancelar"
        okType="danger"
        centered
        confirmLoading={isLoggingOut}
        closable={!isLoggingOut}
        maskClosable={!isLoggingOut}
        keyboard={!isLoggingOut}
        okButtonProps={{
          loading: isLoggingOut,
          icon: isLoggingOut ? <LoadingOutlined /> : <LogoutOutlined />,
        }}
      >
        <p>
          {isLoggingOut
            ? '🔄 Cerrando tu sesión de forma segura...'
            : '¿Estás seguro de que deseas cerrar sesión? Serás redirigido a la página de inicio de sesión.'}
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

export default SidebarTransportista;