import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Table, 
  Image, 
  message, 
  Popconfirm, 
  Modal, 
  Input, 
  Space, 
  Typography, 
  Tag 
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import Inventario_Form from './Inventario_Form';
import axios from "axios";
import { authService } from "../../../auth/auth"; // Ajusta la ruta según tu estructura
import { Producto, Marca, Categoria } from '../../../types/types';

const { Column } = Table;

const Inventario_Index: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editarProducto, setEditarProducto] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);

    const getAxiosConfig = useCallback(() => {
    const token = authService.getToken();
    
    if (!token) {
      console.error('No se encontró token de autenticación');
      message.error('No hay token de autenticación. Por favor, inicia sesión.');
      return null;
    }

    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, []);

  useEffect(() => {
    fetchData();
    fetchMarcas();
    fetchCategorias();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/productos');
      console.log('Productos cargados:', response.data);
      setProductos(response.data || []);
      
      if (response.data?.length === 0) {
        message.info('No se encontraron productos en la base de datos');
      } else {
        message.success(`Se cargaron ${response.data?.length || 0} productos correctamente`);
      }
    } catch (error: any) {
      console.error('Error al obtener productos:', error);
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido o expirado');
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para ver los productos');
      } else if (error.response?.status === 500) {
        message.error('Error interno del servidor');
      } else {
        message.error('Error al cargar los productos');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMarcas = async () => {
    try {
      const response = await axios.get('/marcas');
      console.log('Marcas obtenidas:', response.data);
      setMarcas(response.data || []);
    } catch (error: any) {
      console.error('Error al obtener marcas:', error);
      message.error('Error al obtener marcas');
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await axios.get('/categorias');
      console.log('Categorías obtenidas:', response.data);
      setCategorias(response.data || []);
    } catch (error: any) {
      console.error('Error al obtener categorías:', error);
      message.error('Error al obtener categorías');
    }
  };

  const handleAdd = () => {
    setEditarProducto(null);
    setOpen(true);
  };

  const handleEdit = (producto: Producto) => {
    console.log('Editando producto:', producto);
    setEditarProducto(producto);
    setOpen(true);
  };

  const handleDelete = async (id_producto: number) => {
    try {
      console.log("Eliminando producto con ID:", id_producto);
      await axios.delete(`/productos/${id_producto}`);
      message.success('Producto eliminado correctamente');
      fetchData(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido');
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para eliminar productos');
      } else if (error.response?.status === 404) {
        message.error('Producto no encontrado');
      } else {
        message.error('Error al eliminar producto');
      }
    }
  };

  const handleSubmit = async (producto: any) => {
    try {
      console.log('Enviando datos del producto:', producto);
      
      if (editarProducto) {
        await axios.put(`/productos/${editarProducto.id_producto}`, producto);
        message.success('Producto actualizado correctamente');
      } else {
        await axios.post('/productos', producto);
        message.success('Producto agregado correctamente');
      }
      setOpen(false);
      fetchData(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido');
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para realizar esta acción');
      } else {
        message.error('Error al guardar producto');
      }
    }
  };

const handleExportExcel = async () => {
  setExportingExcel(true);
  try {
    console.log('Iniciando exportación a Excel...');
    const config = getAxiosConfig();
    if (!config) {
      setExportingExcel(false);
      return;
    }

    const response = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/productos/exportar-excel',
      headers: config.headers,
      responseType: 'blob',
    });

    console.log('Respuesta recibida:', response);

    if (!response.data || response.data.size === 0) {
      throw new Error('El archivo recibido está vacío');
    }

    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    console.log('Blob creado:', blob.size, 'bytes');

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generar nombre del archivo con fecha actual (formato consistente con clientes)
    const now = new Date();
    const fecha = now.toISOString().slice(0, 10).replace(/-/g, '');
    const hora = now.toTimeString().slice(0, 8).replace(/:/g, '');
    link.download = `inventario_${fecha}_${hora}.xlsx`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    message.success('¡Archivo Excel descargado exitosamente!');
    console.log('Descarga completada');
    
  } catch (error: any) {
    console.error('Error detallado al exportar Excel:', error);
    
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        message.error('Token de autenticación inválido o expirado');
        authService.logout();
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        message.error('No tienes permisos para exportar datos');
      } else if (error.response.status === 404) {
        message.error('No hay productos para exportar');
      } else if (error.response.status === 500) {
        message.error('Error interno del servidor al generar el archivo');
      } else {
        message.error(`Error del servidor: ${error.response.status}`);
      }
    } else if (error.request) {
      console.error('Error request:', error.request);
      message.error('Error de conexión al servidor');
    } else {
      console.error('Error message:', error.message);
      message.error(`Error inesperado: ${error.message}`);
    }
  } finally {
    setExportingExcel(false);
  }
};

  const cerrarModal = () => {
    setOpen(false);
    setEditarProducto(null);
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return 'https://via.placeholder.com/60?text=Sin+Imagen';
    
    if (imagePath.startsWith('http')) return imagePath;
    
    const baseUrl = 'http://127.0.0.1:8000';
    return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
  };

  const filteredProductos = productos.filter(producto => {
    const search = searchTerm.toLowerCase();
    return (
      producto.nombre?.toLowerCase().includes(search) ||
      producto.marca?.descripcion?.toLowerCase().includes(search) ||
      producto.categoria?.descripcion?.toLowerCase().includes(search) ||
      producto.precio_minorista?.toString().includes(search) ||
      producto.precio_mayorista?.toString().includes(search) ||
      producto.stock?.toString().includes(search) ||
      producto.estado?.toLowerCase().includes(search)
    );
  });

  console.log('Productos filtrados para renderizar:', filteredProductos);

  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={1}>Inventario de Productos</Typography.Title>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Input
          placeholder="Buscar por nombre, marca, categoría, precio, stock o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 400 }}
        />
        <Space>
          <Button 
            icon={<FileExcelOutlined />} 
            style={{ backgroundColor: 'green', color: 'white' }}
            onClick={handleExportExcel}
            loading={exportingExcel}
            disabled={productos.length === 0}
          >
            {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
          </Button>
          <Button type="primary" onClick={handleAdd}>
            + Agregar Producto
          </Button>
        </Space>
      </div>

      <Table 
        dataSource={filteredProductos} 
        rowKey="id_producto" 
        loading={loading}
        locale={{
          emptyText: loading ? 'Cargando...' : 'No hay datos disponibles'
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} productos`
        }}
      >
        <Column 
          title="Imagen" 
          dataIndex="imagen" 
          render={(img: string | null) => (
            <Image 
              width={60} 
              height={60}
              src={getImageUrl(img)} 
              alt="producto"
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="https://via.placeholder.com/60?text=Error"
            />
          )}
        />
        <Column title="Nombre" dataIndex="nombre" sorter />
        <Column 
          title="Marca" 
          render={(record: Producto) => record.marca?.descripcion || 'N/A'} 
        />
        <Column 
          title="Categoría" 
          render={(record: Producto) => record.categoria?.descripcion || 'N/A'} 
        />
        <Column 
          title="Estado" 
          dataIndex="estado" 
          render={(estado: string) => (
            <Tag color={estado === 'activo' ? 'green' : 'red'}>
              {estado === 'activo' ? 'Activo' : 'Inactivo'}
            </Tag>
          )}
        />
        <Column 
          title="Stock" 
          dataIndex="stock" 
          sorter
          render={(stock: number) => (
            <span style={{ 
              color: stock <= 10 ? 'red' : stock <= 20 ? 'orange' : 'green',
              fontWeight: 'bold'
            }}>
              {stock}
            </span>
          )}
        />
        <Column 
          title="Precio Minorista" 
          dataIndex="precio_minorista" 
          sorter
          render={(precio: number) => `$${precio?.toFixed(2) || '0.00'}`}
        />
        <Column 
          title="Precio Mayorista" 
          dataIndex="precio_mayorista" 
          sorter
          render={(precio: number) => `$${precio?.toFixed(2) || '0.00'}`}
        />
        <Column
          title="Acciones"
          render={(_, record: Producto) => (
            <Space>
              <EditOutlined 
                onClick={() => handleEdit(record)} 
                style={{ color: '#1890ff', cursor: 'pointer', fontSize: '16px' }} 
                title="Editar producto"
              />
              <Popconfirm
                title="¿Estás seguro de eliminar este producto?"
                description={`Producto: ${record.nombre}`}
                onConfirm={() => handleDelete(record.id_producto)}
                okText="Sí, eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <DeleteOutlined 
                  style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }} 
                  title="Eliminar producto"
                />
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

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
          onSuccess={fetchData}
        />
      </Modal>
    </div>
  );
};

export default Inventario_Index;