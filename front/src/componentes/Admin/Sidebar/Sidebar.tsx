import type { MenuProps } from 'antd';
import React, { useState } from 'react';
import { Button, Menu, Layout, Modal, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../../hooks/useLogout'; //  IMPORTAR EL HOOK
import {
  ContainerOutlined,
  HomeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  ShopOutlined,
  SnippetsOutlined,
  TagsOutlined,
  TeamOutlined,
  TruckOutlined,
  UserSwitchOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const mainItems: MenuItem[] = [
  { key: '/home', icon: <HomeOutlined />, label: 'Dashboard' },
  { key: '/catalogo', icon: <ReadOutlined />, label: 'Catálogo' },
  { key: '/inventario', icon: <ShopOutlined />, label: 'Inventario' },
  { key: '/clientes', icon: <TeamOutlined />, label: 'Clientes' },
  { key: '/empleados', icon: <IdcardOutlined />, label: 'Empleados' },
  { key: '/pedidos', icon: <SnippetsOutlined />, label: 'Pedidos' },
  { key: '/facturas', icon: <ContainerOutlined />, label: 'Facturas' },
  { key: '/entregas', icon: <TruckOutlined />, label: 'Entregas' },
  { key: '/categorias', icon: <ShopOutlined />, label: 'Categorías' },
  { key: '/marcas', icon: <TagsOutlined />, label: 'Marcas' },
  { key: '/roles', icon: <UserSwitchOutlined />, label: 'Roles' },
];

const SidebarCustom: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  
  //  USAR EL HOOK DE LOGOUT
  const { showLogoutModal, isLoggingOut, handleLogout, showLogoutConfirmation, hideLogoutModal } = useLogout();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = (e: any) => {
    if (e.key === 'logout') {
      showLogoutConfirmation(); //  USAR LA FUNCIÓN DEL HOOK
    } else if (e.key.startsWith('/')) {
      navigate(e.key);
    }
  };

  // Crear el item de logout dinámicamente según el estado
  const logoutItem: MenuItem[] = [
    { 
      key: 'logout', 
      icon: isLoggingOut ? <LoadingOutlined spin /> : <LogoutOutlined />, 
      label: isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión',
      disabled: isLoggingOut
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
          display: 'flex', 
          flexDirection: 'column',
          // Overlay para mostrar loading durante logout
          ...(isLoggingOut && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(171, 217, 4, 0.7)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }
          })
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
            opacity: isLoggingOut ? 0.5 : 1
          }}
          type="primary"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>

        <Menu
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          items={mainItems}
          onClick={handleMenuClick}
          style={{ 
            backgroundColor: '#ABD904', 
            flexGrow: 1, 
            borderRight: 'none',
            opacity: isLoggingOut ? 0.5 : 1
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

      {/*  MODAL MEJORADO */}
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

export default SidebarCustom;