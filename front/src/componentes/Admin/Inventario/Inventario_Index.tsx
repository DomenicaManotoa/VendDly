import { useState } from 'react';
import { Button, Table, Image, Modal } from 'antd';
import { DeleteOutlined, EditOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons';
import Inventario_Form from './Inventario_Form';

const dataSource = [
  {
    key: '1',
    nombre: 'Producto 1',
    imagen: 'https://images.cdn1.buscalibre.com/fit-in/360x360/90/4e/904e5872343371ff8e1a1cad6a0abe18.jpg',
    precio_minorista: 12.5,
    precio_mayorista: 10.5,
    stock: 20,
  },
  {
    key: '2',
    nombre: 'Producto 2',
    imagen: 'https://images.cdn1.buscalibre.com/fit-in/360x360/e8/21/e8214454dbb970e28fea330dd88a5e20.jpg',
    precio_minorista: 28.0,
    precio_mayorista: 25.0,
    stock: 5,
  },
  {
    key: '3',
    nombre: 'Producto 3',
    imagen: 'https://images.cdn1.buscalibre.com/fit-in/360x360/2c/0b/2c0b5c1e2e7c7b2e3e1e2e1e2e1e2e1e.jpg',
    precio_minorista: 15.0,
    precio_mayorista: 12.0,
    stock: 12,
  },
  {
    key: '4',
    nombre: 'Producto 4',
    imagen: 'https://images.cdn1.buscalibre.com/fit-in/360x360/3a/7b/3a7b5c1e2e7c7b2e3e1e2e1e2e1e2e1e.jpg',
    precio_minorista: 9.99,
    precio_mayorista: 8.5,
    stock: 30,
  },
  {
    key: '5',
    nombre: 'Producto 5',
    imagen: 'https://images.cdn1.buscalibre.com/fit-in/360x360/4b/8c/4b8c5c1e2e7c7b2e3e1e2e1e2e1e2e1e.jpg',
    precio_minorista: 22.0,
    precio_mayorista: 19.5,
    stock: 8,
  },
];

const columns = [
  {
    title: 'Imagen',
    dataIndex: 'imagen',
    key: 'imagen',
    render: (img: string) => <Image width={60} src={img} alt="producto" />,
  },
  {
    title: 'Nombre',
    dataIndex: 'nombre',
    key: 'nombre',
  },
  {
    title: 'Precio Minorista',
    dataIndex: 'precio_minorista',
    key: 'precio_minorista',
    render: (precio: number) => `$${precio.toFixed(2)}`,
  },
  {
    title: 'Precio Mayorista',
    dataIndex: 'precio_mayorista',
    key: 'precio_mayorista',
    render: (precio: number) => `$${precio.toFixed(2)}`,
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
  },
  {
    title: 'Acciones',
    key: 'acciones',
    render: (_: any, record: any) => (
      <span>
        <Button
          icon={<EditOutlined />}
          style={{ marginRight: 8 }}
          size="small"
        />
        <Button
          icon={<DeleteOutlined />}
          danger
          size="small"
        />
      </span>
    ),
  },
];

const Inventario_Index = () => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '16px'
      }}
    >
      <h1
        style={{
          color: '#ABD904',
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          margin: '48px 0 32px 0',
          textAlign: 'center',
          width: '100%',
          wordBreak: 'break-word'
        }}
      >
        Inventario
      </h1>
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px',
          gap: '16px'
        }}
      >
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          style={{
            background: '#F12525',
            borderColor: '#F12525',
            width: 'clamp(100px, 30vw, 180px)',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'normal',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: 'inherit' }}>Exportar PDF</span>
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{
            background: '#04A0D9',
            borderColor: '#04A0D9',
            width: 'clamp(100px, 30vw, 220px)',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'normal',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: 'inherit' }}>Agregar Producto</span>
        </Button>
      </div>
      <div style={{ width: '100%', maxWidth: 900, marginTop: 40 }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={{ pageSize: 5 }}
          rowKey="key"
          scroll={{ y: 320 }}
        />
      </div>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        title="Agregar Producto"
      >
        <Inventario_Form onClose={() => setOpen(false)} />
      </Modal>
    </div>
  );
};
export default Inventario_Index;