import { useState } from 'react';
import {
  Button,
  Table,
  Image,
  message,
  Popconfirm,
  Modal,
  Input,
  Row,
  Col,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FilePdfOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import Inventario_Form from './Inventario_Form';

const marcas = [
  { key: 'm1', nombre: 'Marca A' },
  { key: 'm2', nombre: 'Marca B' },
  { key: 'm3', nombre: 'Marca C' },
];

const categorias = [
  { key: 'c1', nombre: 'Categoría X' },
  { key: 'c2', nombre: 'Categoría Y' },
  { key: 'c3', nombre: 'Categoría Z' },
];

const initialData = [
  {
    key: '1',
    nombre: 'Producto 1',
    imagen:
      'https://images.cdn1.buscalibre.com/fit-in/360x360/90/4e/904e5872343371ff8e1a1cad6a0abe18.jpg',
    precio_minorista: 12.5,
    precio_mayorista: 10.5,
    stock: 20,
    marca: 'Marca A',
    categoria: 'Categoría X',
  },
  {
    key: '2',
    nombre: 'Producto 2',
    imagen:
      'https://images.cdn1.buscalibre.com/fit-in/360x360/e8/21/e8214454dbb970e28fea330dd88a5e20.jpg',
    precio_minorista: 28.0,
    precio_mayorista: 25.0,
    stock: 5,
    marca: 'Marca B',
    categoria: 'Categoría Y',
  },
  {
    key: '3',
    nombre: 'Producto 3',
    imagen:
      'https://images.cdn1.buscalibre.com/fit-in/360x360/2c/0b/2c0b5c1e2e7c7b2e3e1e2e1e2e1e2e1e.jpg',
    precio_minorista: 15.0,
    precio_mayorista: 12.0,
    stock: 12,
    marca: 'Marca A',
    categoria: 'Categoría Z',
  },
  {
    key: '4',
    nombre: 'Producto 4',
    imagen:
      'https://images.cdn1.buscalibre.com/fit-in/360x360/3a/7b/3a7b5c1e2e7c7b2e3e1e2e1e2e1e2e1e.jpg',
    precio_minorista: 9.99,
    precio_mayorista: 8.5,
    stock: 30,
    marca: 'Marca C',
    categoria: 'Categoría X',
  },
  {
    key: '5',
    nombre: 'Producto 5',
    imagen:
      'https://images.cdn1.buscalibre.com/fit-in/360x360/4b/8c/4b8c5c1e2e7c7b2e3e1e2e1e2e1e2e1e.jpg',
    precio_minorista: 22.0,
    precio_mayorista: 19.5,
    stock: 8,
    marca: 'Marca B',
    categoria: 'Categoría Y',
  },
];

const Inventario_Index = () => {
  const [open, setOpen] = useState(false);
  const [editarProducto, setEditarProducto] = useState<any>(null);
  const [dataSource, setDataSource] = useState(initialData);
  const [searchText, setSearchText] = useState('');

  const abrirEditar = (producto: any) => {
    setEditarProducto(producto);
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setEditarProducto(null);
  };

  const handleDelete = (record: any) => {
    setDataSource(prev => prev.filter(item => item.key !== record.key));
    message.success('Producto eliminado correctamente');
  };

  const filteredData = dataSource.filter(producto => {
    const search = searchText.toLowerCase();
    return (
      producto.nombre.toLowerCase().includes(search) ||
      producto.marca.toLowerCase().includes(search) ||
      producto.categoria.toLowerCase().includes(search) ||
      producto.precio_minorista.toString().includes(search) ||
      producto.precio_mayorista.toString().includes(search) ||
      producto.stock.toString().includes(search)
    );
  });

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
      title: 'Marca',
      dataIndex: 'marca',
      key: 'marca',
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
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
            onClick={() => abrirEditar(record)}
          />
          <Popconfirm
            title="¿Estás seguro que quieres eliminar este producto?"
            description={`Producto: ${record.nombre}`}
            onConfirm={() => handleDelete(record)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, background: '#fff', minHeight: '100vh' }}>
      <h1
        style={{
          color: '#ABD904',
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          margin: '48px 0 32px',
          textAlign: 'center',
        }}
      >
        Inventario
      </h1>

      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          style={{ background: '#F12525', borderColor: '#F12525' }}
        >
          Exportar PDF
        </Button>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#04A0D9', borderColor: '#04A0D9' }}
          onClick={() => {
            setEditarProducto(null);
            setOpen(true);
          }}
        >
          Agregar Producto
        </Button>
      </div>

      {/* Filtro único */}
      <div
        style={{
          maxWidth: 600,
          margin: '24px auto 0',
          padding: 16,
          backgroundColor: '#fafafa',
          borderRadius: 8,
          border: '1px solid #e8e8e8',
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={20}>
            <Input
              placeholder="Buscar por nombre, marca, categoría, precio o stock"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Button
              icon={<SearchOutlined />}
              style={{
                width: '100%',
                backgroundColor: '#28a745',
                borderColor: '#28a745',
                color: 'white',
                fontWeight: 500,
              }}
              onClick={() =>
                message.info('Los filtros se aplican automáticamente')
              }
            >
              Buscar
            </Button>
          </Col>
        </Row>
      </div>

      <div style={{ maxWidth: 900, margin: '40px auto 0' }}>
        <Table
          dataSource={filteredData}
          columns={columns}
          pagination={{ pageSize: 5 }}
          rowKey="key"
          scroll={{ y: 320 }}
        />
      </div>

      <Modal
        open={open}
        onCancel={cerrarModal}
        footer={null}
        destroyOnClose
        title={editarProducto ? 'Editar Producto' : 'Agregar Producto'}
        width={700}
      >
        <Inventario_Form
          onClose={cerrarModal}
          initialValues={editarProducto}
          marcas={marcas}
          categorias={categorias}
        />
      </Modal>
    </div>
  );
};

export default Inventario_Index;
