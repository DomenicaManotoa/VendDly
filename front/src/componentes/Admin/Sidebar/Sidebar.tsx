import type { MenuProps } from 'antd';
import React, { useState } from 'react';
import { Button, Menu, Layout, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
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
  { key: '/categorias', icon: <ShopOutlined />, label: 'Categorías' },      // Tienda, productos
  { key: '/marcas', icon: <TagsOutlined />, label: 'Marcas' },              // Etiquetas o tags para marcas
  { key: '/roles', icon: <UserSwitchOutlined />, label: 'Roles' },
];

const logoutItem: MenuItem[] = [
  { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión' },
];

const SidebarCustom: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = (e: any) => {
    if (e.key === 'logout') {
      // En vez de confirm directa, abrimos el modal
      setShowLogoutModal(true);
    } else if (e.key.startsWith('/')) {
      navigate(e.key);
    }
  };

  return (
    <>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={256}
        theme="light"
        style={{ backgroundColor: '#ABD904', position: 'relative', display: 'flex', flexDirection: 'column' }}
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
          items={mainItems}
          onClick={handleMenuClick}
          style={{ backgroundColor: '#ABD904', flexGrow: 1, borderRight: 'none' }}
        />

        <Menu
          mode="inline"
          theme="light"
          items={logoutItem}
          onClick={handleMenuClick}
          style={{
            backgroundColor: '#ABD904',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            marginBottom: 16,
          }}
        />
      </Sider>

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

export default SidebarCustom;
