import axios from "axios";
import { authService } from "auth/auth";
import FormClientes from "./FormClientes";
import { Cliente, Usuario } from "types/types";
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState, useCallback } from "react";
import { 
  Button, 
  Input, 
  message, 
  Popconfirm, 
  Space, 
  Table, 
  Typography, 
  Card,
  Row,
  Col
} from "antd";
import { 
  DeleteOutlined, 
  EditOutlined, 
  FileExcelOutlined,
  SearchOutlined,
  PlusOutlined,
  UserOutlined
} from "@ant-design/icons";


const { Title } = Typography;

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToEdit, setClientToEdit] = useState<Cliente | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Función para obtener la lista de clientes
  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const config = getAxiosConfig();
      
      if (!config) return;

      const response = await axios.get('http://127.0.0.1:8000/clientes', config);
      setClientes(response.data);
    } catch (error: any) {
      console.error('Error al obtener clientes:', error);
      
      if (error.response?.status === 401) {
        message.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        authService.logout();
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para ver los clientes');
      } else {
        message.error('Error al cargar clientes');
      }
    } finally {
      setLoading(false);
    }
  }, [getAxiosConfig]);

  useEffect(() => {
    // Verificar autenticación
    if (!authService.isAuthenticated()) {
      message.error('No estás autenticado. Por favor, inicia sesión.');
      window.location.href = '/login';
      return;
    }
    
    fetchClientes();
  }, [fetchClientes]);
  
  // Función mejorada para manejar la exportación
  const handleExportExcel = async () => {
    if (exportingExcel) return; // Prevenir múltiples clics
    
    setExportingExcel(true);
    
    try {
      const config = getAxiosConfig();
      if (!config) {
        setExportingExcel(false);
        return;
      }

      console.log('Iniciando descarga de Excel...');

      // Realizar la petición con axios
      const response = await axios({
        method: 'GET',
        url: 'http://127.0.0.1:8000/clientes/exportar-excel',
        headers: config.headers,
        responseType: 'blob', // Importante: especificar blob para archivos
      });

      console.log('Respuesta recibida:', response);

      // Verificar que la respuesta sea válida
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo recibido está vacío');
      }

      // Crear blob con el tipo correcto
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      console.log('Blob creado:', blob.size, 'bytes');

      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo con fecha actual
      const now = new Date();
      const fecha = now.toISOString().slice(0, 10).replace(/-/g, '');
      const hora = now.toTimeString().slice(0, 8).replace(/:/g, '');
      link.download = `clientes_${fecha}_${hora}.xlsx`;
      
      // Añadir al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar la URL del blob
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
          message.error('No hay clientes para exportar');
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

  
// Modifica las funciones
const handleAdd = () => {
  setClientToEdit(null);
  setIsFormVisible(true);
};

const handleEdit = (cliente: Cliente) => {
  setClientToEdit(cliente);
  setIsFormVisible(true);
};

const handleCancel = () => {
  setIsFormVisible(false);
  setClientToEdit(null);
};

  const handleDelete = async (cod_cliente: string) => {
    try {
      const config = getAxiosConfig();
      if (!config) return;

      await axios.delete(`http://127.0.0.1:8000/clientes/${cod_cliente}`, config);
      message.success('Cliente eliminado correctamente');
      fetchClientes();
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido');
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para eliminar clientes');
      } else if (error.response?.status === 404) {
        message.error('Cliente no encontrado');
      } else {
        message.error('Error al eliminar cliente');
      }
    }
  };

  const handleSubmit = async (cliente: Usuario) => {
    try {
      const config = getAxiosConfig();
      if (!config) return;

      if (clientToEdit) {
        await axios.put(`http://127.0.0.1:8000/clientes/${clientToEdit?.cod_cliente}`, cliente, config);
        message.success('Cliente actualizado correctamente');
      } else {
        await axios.post('http://127.0.0.1:8000/clientes', cliente, config);
        message.success('Cliente agregado correctamente');
      }
      
      fetchClientes();
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido');
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para realizar esta acción');
      } else if (error.response?.status === 409) {
        message.error('Ya existe un cliente con esta identificación');
      } else {
        message.error('Error al guardar cliente');
      }
    }
  };

  const filteredClientes = clientes
  .filter(cliente =>
    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.identificacion?.includes(searchTerm) ||
    cliente.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => a.sector.localeCompare(b.sector));


  // Columnas para la tabla
  const columns: ColumnsType<Cliente> = [
    {
      title: "Código Cliente",
      dataIndex: 'cod_cliente',
      key: 'cod_cliente',
      sorter: (a, b) => a.cod_cliente.localeCompare(b.cod_cliente), // Cambiar a comparación de strings
      responsive: ['md'],
    },
    {
      title: 'Identificación',
      dataIndex: 'identificacion',
      key: 'identificacion',
      sorter: (a, b) => a.identificacion.localeCompare(b.identificacion),
      responsive: ['md'],
      ellipsis: true,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {isMobile && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {record.identificacion}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
      responsive: ['lg'],
      ellipsis: true,
    },
    {
      title: 'Celular',
      dataIndex: 'celular',
      key: 'celular',
      responsive: ['md'],
    },
    {
      title: 'Tipo de cliente',
      dataIndex: 'tipo_cliente',
      key: 'tipo_cliente',
      responsive: ['lg'],
    },
    {
      title: 'Razón Social',
      dataIndex: 'razon_social',
      key: 'razon_social',
      responsive: ['xl'],
      ellipsis: true,
    },
    {
      title: 'Sector',
      dataIndex: 'sector',
      key: 'sector',
      responsive: ['xl'],
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'fecha_registro',
      key: 'fecha_registro',
      responsive: ['lg'],
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record: Cliente) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar cliente"
            size="small"
          />
          <Popconfirm
            title="¿Eliminar cliente?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(record.cod_cliente)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              title="Eliminar cliente"
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Renderizado para móviles (cards)
  const renderMobileCards = () => (
    <Row gutter={[16, 16]}>
      {filteredClientes.map((cliente) => (
        <Col xs={24} sm={12} key={cliente.cod_cliente}>
          <Card
            size="small"
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ marginRight: 8 }} />
                {cliente.nombre}
              </div>
            }
            extra={
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(cliente)}
                  size="small"
                />
                <Popconfirm
                  title="¿Eliminar cliente?"
                  description="Esta acción no se puede deshacer"
                  onConfirm={() => handleDelete(cliente.cod_cliente)}
                  okText="Sí"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    size="small"
                  />
                </Popconfirm>
              </Space>
            }
          >
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div><strong>ID:</strong> {cliente.identificacion}</div>
              <div><strong>Celular:</strong> {cliente.celular || 'N/A'}</div>
              <div><strong>Tipo:</strong> {cliente.tipo_cliente || 'N/A'}</div>
              {cliente.direccion && (
                <div><strong>Dirección:</strong> {cliente.direccion}</div>
              )}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Gestión de Clientes
      </Title>

      {/* Barra de búsqueda y acciones */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={16}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button 
              icon={<FileExcelOutlined />} 
              style={{ 
                backgroundColor: exportingExcel ? '#52c41a' : '#389e0d', 
                borderColor: exportingExcel ? '#52c41a' : '#389e0d',
                color: 'white' 
              }}
              onClick={handleExportExcel}
              loading={exportingExcel}
              disabled={clientes.length === 0}
              size={isMobile ? 'small' : 'middle'}
            >
              {exportingExcel 
                ? (isMobile ? 'Generando...' : 'Generando Excel...') 
                : (isMobile ? 'Excel' : 'Exportar Excel')
              }
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Agregar' : 'Agregar Cliente'}
            </Button>
          </div>
        </Col>
      </Row>

      {isMobile ? (
        // Vista móvil con cards
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              Cargando clientes...
            </div>
          ) : filteredClientes.length > 0 ? (
            renderMobileCards()
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                <div style={{ marginTop: '16px' }}>
                  No se encontraron clientes
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        // Vista desktop con tabla
        <Table
          columns={columns}
          dataSource={filteredClientes}
          rowKey="cod_cliente"
          loading={loading}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: 'No hay clientes disponibles'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} clientes`,
            responsive: true,
          }}
        />
      )}


        <FormClientes
          cliente={clientToEdit}
          visible={isFormVisible}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />

    </div>
  );
};

export default Clientes;
