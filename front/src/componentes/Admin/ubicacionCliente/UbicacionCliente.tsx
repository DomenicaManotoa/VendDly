import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Card, Input, Select, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { UbicacionCliente, Cliente } from '../../../types/types';
import { ubicacionClienteService } from '../../Admin/ubicacionCliente/ubicacionClienteService';
import { clienteService } from '../Clientes/clienteService';
import FormUbicacionCliente from './FormUbicacionCliente';
import MapaUbicacionCliente from './MapaUbicacionCliente';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const UbicacionClientePage: React.FC = () => {
  const [ubicaciones, setUbicaciones] = useState<UbicacionCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<UbicacionCliente | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string | undefined>();
  const [clienteFilter, setClienteFilter] = useState<string | undefined>();
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    cargarUbicaciones();
    cargarClientes();
  }, []);

  const cargarUbicaciones = async () => {
    setLoading(true);
    try {
      const data = await ubicacionClienteService.getUbicaciones();
      setUbicaciones(data);
      message.success('Ubicaciones cargadas correctamente');
    } catch (error) {
      message.error('Error al cargar las ubicaciones');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const data = await clienteService.getClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      message.error('Error al cargar la lista de clientes');
      setClientes([]);
    }
  };

  const handleCreateEdit = async (ubicacionData: UbicacionCliente) => {
    try {
      let resultado;
      
      if (editingUbicacion?.id_ubicacion) {
        // Actualizar ubicación existente
        resultado = await ubicacionClienteService.updateUbicacion(editingUbicacion.id_ubicacion, ubicacionData);
        message.success('Ubicación actualizada correctamente');
      } else {
        // Crear nueva ubicación
        resultado = await ubicacionClienteService.createUbicacion(ubicacionData);
        message.success('Ubicación creada correctamente');
        
        // Recargar clientes para actualizar la información de ubicación principal
        await cargarClientes();
        
        // Verificar si esta es la primera ubicación del cliente y mostrar mensaje informativo
        const ubicacionesCliente = ubicaciones.filter(u => u.cod_cliente === ubicacionData.cod_cliente);
        if (ubicacionesCliente.length === 0) { // Era la primera ubicación
          message.info(`Esta ubicación se ha establecido automáticamente como ubicación principal para el cliente ${ubicacionData.cod_cliente}`);
        }
      }
      
      setModalVisible(false);
      setEditingUbicacion(null);
      await cargarUbicaciones();
      
    } catch (error: any) {
      console.error('Error al procesar ubicación:', error);
      
      // Mostrar mensaje de error más específico
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error(editingUbicacion ? 'Error al actualizar ubicación' : 'Error al crear ubicación');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // Encontrar la ubicación que se va a eliminar
      const ubicacionAEliminar = ubicaciones.find(u => u.id_ubicacion === id);
      
      if (ubicacionAEliminar) {
        // Verificar si es la ubicación principal del cliente
        const cliente = clientes.find(c => c.cod_cliente === ubicacionAEliminar.cod_cliente);
        const esUbicacionPrincipal = cliente?.id_ubicacion_principal === id;
        
        await ubicacionClienteService.deleteUbicacion(id);
        
        if (esUbicacionPrincipal) {
          message.success('Ubicación eliminada correctamente. Se ha actualizado la ubicación principal del cliente.');
          // Recargar clientes para reflejar el cambio en la ubicación principal
          await cargarClientes();
        } else {
          message.success('Ubicación eliminada correctamente');
        }
      } else {
        await ubicacionClienteService.deleteUbicacion(id);
        message.success('Ubicación eliminada correctamente');
      }
      
      cargarUbicaciones();
    } catch (error: any) {
      console.error('Error al eliminar ubicación:', error);
      
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Error al eliminar ubicación');
      }
    }
  };

  const handleEdit = (ubicacion: UbicacionCliente) => {
    setEditingUbicacion(ubicacion);
    setModalVisible(true);
  };

  const handleCreate = () => {
    setEditingUbicacion(null);
    setModalVisible(true);
  };

  // Función para obtener el nombre del cliente
  const getClienteNombre = (codCliente: string) => {
    const cliente = clientes.find(c => c.cod_cliente === codCliente);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  // Función para verificar si una ubicación es la principal del cliente
  const esUbicacionPrincipal = (ubicacion: UbicacionCliente): boolean => {
    const cliente = clientes.find(c => c.cod_cliente === ubicacion.cod_cliente);
    return cliente?.id_ubicacion_principal === ubicacion.id_ubicacion;
  };

  // Filtrar ubicaciones
  const ubicacionesFiltradas = ubicaciones.filter(ubicacion => {
    const clienteNombre = getClienteNombre(ubicacion.cod_cliente);
    
    const matchesSearch = searchText === '' || 
      ubicacion.direccion.toLowerCase().includes(searchText.toLowerCase()) ||
      ubicacion.sector.toLowerCase().includes(searchText.toLowerCase()) ||
      ubicacion.cod_cliente.toLowerCase().includes(searchText.toLowerCase()) ||
      clienteNombre.toLowerCase().includes(searchText.toLowerCase()) ||
      (ubicacion.referencia && ubicacion.referencia.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesSector = !sectorFilter || ubicacion.sector === sectorFilter;
    const matchesCliente = !clienteFilter || ubicacion.cod_cliente === clienteFilter;
    
    return matchesSearch && matchesSector && matchesCliente;
  });

  // Obtener sectores únicos para el filtro
  const sectoresUnicos = Array.from(new Set(ubicaciones.map(u => u.sector))).sort();

  const columns: ColumnsType<UbicacionCliente> = [
    {
      title: 'Cliente',
      dataIndex: 'cod_cliente',
      key: 'cod_cliente',
      width: 200,
      render: (codCliente: string, record: UbicacionCliente) => {
        const clienteNombre = getClienteNombre(codCliente);
        const esPrincipal = esUbicacionPrincipal(record);
        
        return (
          <div>
            <div className="font-medium">{clienteNombre}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {codCliente}
            </Text>
            {esPrincipal && (
              <div>
                <Tag color="gold" style={{ fontSize: '11px' }}>
                  <EnvironmentOutlined /> Principal
                </Tag>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
      ellipsis: true,
      width: 250
    },
    {
      title: 'Sector',
      dataIndex: 'sector',
      key: 'sector',
      width: 120,
      render: (sector: string) => <Tag color="blue">{sector}</Tag>
    },
    {
      title: 'Coordenadas',
      key: 'coordenadas',
      width: 150,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>
            <EnvironmentOutlined style={{ color: '#1890ff', marginRight: 4 }} />
            {record.latitud.toFixed(6)}
          </div>
          <div style={{ marginLeft: 16 }}>
            {record.longitud.toFixed(6)}
          </div>
        </div>
      )
    },
    {
      title: 'Referencia',
      dataIndex: 'referencia',
      key: 'referencia',
      ellipsis: true,
      width: 200,
      render: (text) => text || <Text type="secondary">Sin referencia</Text>
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'fecha_registro',
      key: 'fecha_registro',
      width: 120,
      render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : '-'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar ubicación"
          />
          <Popconfirm
            title="¿Eliminar ubicación?"
            description={
              esUbicacionPrincipal(record) 
                ? "Esta es la ubicación principal del cliente. Al eliminarla, se asignará automáticamente otra ubicación como principal (si existe)."
                : "Esta acción no se puede deshacer"
            }
            onConfirm={() => record.id_ubicacion && handleDelete(record.id_ubicacion)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar ubicación"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Gestión de Ubicaciones de Clientes
            </Title>
            <Text type="secondary">
              Administra las ubicaciones geográficas de tus clientes. La primera ubicación de cada cliente se establece automáticamente como principal.
            </Text>
          </div>
          <Space>
            <Button
              type="default"
              icon={<EnvironmentOutlined />}
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nueva Ubicación
            </Button>
          </Space>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{ubicaciones.length}</div>
              <div className="text-gray-500">Total Ubicaciones</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sectoresUnicos.length}</div>
              <div className="text-gray-500">Sectores</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Array.from(new Set(ubicaciones.map(u => u.cod_cliente))).length}
              </div>
              <div className="text-gray-500">Clientes con Ubicación</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {ubicaciones.filter(u => esUbicacionPrincipal(u)).length}
              </div>
              <div className="text-gray-500">Ubicaciones Principales</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{ubicacionesFiltradas.length}</div>
              <div className="text-gray-500">Resultados Filtrados</div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Search
            placeholder="Buscar por cliente, dirección, sector o referencia..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%' }}
          />
          <Select
            placeholder="Filtrar por cliente"
            allowClear
            showSearch
            style={{ width: '100%' }}
            onChange={setClienteFilter}
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label?.toString().toLowerCase() || '';
              return label.includes(input.toLowerCase());
            }}
            options={clientes.map(cliente => ({
              value: cliente.cod_cliente,
              label: `${cliente.nombre} (${cliente.cod_cliente})`,
              key: cliente.cod_cliente
            }))}
          />
          <Select
            placeholder="Filtrar por sector"
            allowClear
            style={{ width: '100%' }}
            onChange={setSectorFilter}
          >
            {sectoresUnicos.map(sector => (
              <Option key={sector} value={sector}>{sector}</Option>
            ))}
          </Select>
        </div>

        {/* Mapa */}
        {showMap && (
          <div className="mb-6">
            <Card 
              title={
                <div className="flex items-center">
                  <EnvironmentOutlined className="mr-2" />
                  Mapa de Ubicaciones
                  <Tag color="blue" className="ml-2">
                    {ubicacionesFiltradas.length} ubicaciones
                  </Tag>
                </div>
              }
            >
              <MapaUbicacionCliente 
                ubicaciones={ubicacionesFiltradas}
                readonly={true}
              />
            </Card>
          </div>
        )}

        {/* Tabla */}
        <Table
          columns={columns}
          dataSource={ubicacionesFiltradas}
          rowKey="id_ubicacion"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} ubicaciones`,
            pageSizeOptions: ['5', '10', '20', '50']
          }}
          size="small"
          rowClassName={(record) => esUbicacionPrincipal(record) ? 'bg-yellow-50' : ''}
        />

        {/* Modal del formulario */}
        <FormUbicacionCliente
          visible={modalVisible}
          ubicacion={editingUbicacion}
          clientes={clientes}
          onCancel={() => {
            setModalVisible(false);
            setEditingUbicacion(null);
          }}
          onSubmit={handleCreateEdit}
        />
      </Card>
    </div>
  );
};

export default UbicacionClientePage;