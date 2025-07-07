import type { MenuProps } from 'antd';
import React, { useState } from 'react';
import { Button, Menu, Layout } from 'antd';
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
  TeamOutlined,
  TruckOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  { key: '/home', icon: <HomeOutlined />, label: 'Dashboard' },
  { key: '/catalogo', icon: <ReadOutlined />, label: 'Catálogo' },
  { key: '/inventario', icon: <ShopOutlined />, label: 'Inventario' },
  { key: '/clientes', icon: <TeamOutlined />, label: 'Clientes' },
  { key: '/empleados', icon: <IdcardOutlined />, label: 'Empleados' },
  { key: '/pedidos', icon: <SnippetsOutlined />, label: 'Pedidos' },
  { key: '/facturas', icon: <ContainerOutlined />, label: 'Facturas' },
  { key: '/entregas', icon: <TruckOutlined />, label: 'Entregas' },
  { key: '/logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión' },
];

const SidebarCustom: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  const handleMenuClick = (e: any) => {
    if (e.key.startsWith('/')) {
      navigate(e.key);
    }
  };
  return (
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={256} theme="dark" style={{ backgroundColor: '#ABD904' }}>
      <Button onClick={toggleCollapsed} style={{ margin: 16,backgroundColor: '#ABD904', borderColor: '#ABD904' }} type="primary">
        {collapsed ? <MenuUnfoldOutlined  /> : <MenuFoldOutlined />}
      </Button>
      <Menu
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1']}
        mode="inline"
        theme="dark"
        inlineCollapsed={collapsed}
        items={items}
        style={{ backgroundColor: '#ABD904', height: '100%' }}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default SidebarCustom;