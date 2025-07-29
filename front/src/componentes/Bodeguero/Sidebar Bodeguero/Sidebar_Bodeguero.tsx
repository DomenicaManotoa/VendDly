import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Modal } from 'antd';
import {
  AppstoreOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingOutlined,
  TagsOutlined,
  TrademarkOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const SidebarBodega: React.FC = () => {
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
    { key: '/bodega/home', icon: <HomeOutlined />, label: 'Home Bodega' },
    { key: '/bodega/inventario', icon: <ShoppingOutlined />, label: 'Inventario Bodega' },
    { key: '/bodega/catalogo', icon: <AppstoreOutlined />, label: 'Catálogo Bodega' },
    { key: '/bodega/categoria', icon: <TagsOutlined />, label: 'Categoría Bodega' },
    { key: '/bodega/marca', icon: <TrademarkOutlined />, label: 'Marca Bodega' },
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

export default SidebarBodega;
