import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Card, Input, Select, Tag, Typography, Row, Col, Drawer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, UserOutlined, FilterOutlined } from '@ant-design/icons';
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
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // Detectar el tamaño de pantalla con breakpoints más específicos
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 576,
        isTablet: width >= 576 && width < 992,
        isDesktop: width >= 992
      });
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const { isMobile, isTablet, isDesktop } = screenSize;

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
        resultado = await ubicacionClienteService.updateUbicacion(editingUbicacion.id_ubicacion, ubicacionData);
        message.success('Ubicación actualizada correctamente');
      } else {
        resultado = await ubicacionClienteService.createUbicacion(ubicacionData);
        message.success('Ubicación creada correctamente');
        
        await cargarClientes();
        
        const ubicacionesCliente = ubicaciones.filter(u => u.cod_cliente === ubicacionData.cod_cliente);
        if (ubicacionesCliente.length === 0) {
          message.info(`Esta ubicación se ha establecido automáticamente como ubicación principal para el cliente ${ubicacionData.cod_cliente}`);
        }
      }
      
      setModalVisible(false);
      setEditingUbicacion(null);
      await cargarUbicaciones();
      
    } catch (error: any) {
      console.error('Error al procesar ubicación:', error);
      
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error(editingUbicacion ? 'Error al actualizar ubicación' : 'Error al crear ubicación');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const ubicacionAEliminar = ubicaciones.find(u => u.id_ubicacion === id);
      
      if (ubicacionAEliminar) {
        const cliente = clientes.find(c => c.cod_cliente === ubicacionAEliminar.cod_cliente);
        const esUbicacionPrincipal = cliente?.id_ubicacion_principal === id;
        
        await ubicacionClienteService.deleteUbicacion(id);
        
        if (esUbicacionPrincipal) {
          message.success('Ubicación eliminada correctamente. Se ha actualizado la ubicación principal del cliente.');
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

  const getClienteNombre = (codCliente: string) => {
    const cliente = clientes.find(c => c.cod_cliente === codCliente);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

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

  const sectoresUnicos = Array.from(new Set(ubicaciones.map(u => u.sector))).sort();

  // Componente Card optimizado para diferentes tamaños
  const UbicacionCard = ({ ubicacion }: { ubicacion: UbicacionCliente }) => {
    const clienteNombre = getClienteNombre(ubicacion.cod_cliente);
    const esPrincipal = esUbicacionPrincipal(ubicacion);
    
    return (
      <Card 
        className={`mb-3 ${isMobile ? 'mx-1' : 'mx-0'}`}
        size={isMobile ? "small" : "default"}
        bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
        title={
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
                {clienteNombre}
              </div>
              <div className="text-xs text-gray-500">{ubicacion.cod_cliente}</div>
              {esPrincipal && (
                <Tag color="gold" className="mt-1" style={{ fontSize: isMobile ? '10px' : '11px' }}>
                  <EnvironmentOutlined /> Principal
                </Tag>
              )}
            </div>
            <div className="flex flex-wrap gap-1 items-start">
              <Tag color="blue" style={{ fontSize: isMobile ? '10px' : '12px' }}>
                {ubicacion.sector}
              </Tag>
            </div>
          </div>
        }
        extra={
          <Space size={isMobile ? "small" : "middle"}>
            <Button
              type="text"
              size={isMobile ? "small" : "middle"}
              icon={<EditOutlined />}
              onClick={() => handleEdit(ubicacion)}
            />
            <Popconfirm
              title="¿Eliminar ubicación?"
              description={
                esPrincipal 
                  ? "Es la ubicación principal. Se asignará otra automáticamente."
                  : "Esta acción no se puede deshacer"
              }
              onConfirm={() => ubicacion.id_ubicacion && handleDelete(ubicacion.id_ubicacion)}
              okText="Sí"
              cancelText="No"
            >
              <Button
                type="text"
                size={isMobile ? "small" : "middle"}
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        }
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Dirección:</div>
            <div className={`break-words ${isMobile ? 'text-sm' : 'text-base'}`}>
              {ubicacion.direccion}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Coordenadas:</div>
              <div className="text-xs font-mono space-y-1">
                <div className="flex items-center">
                  <EnvironmentOutlined className="text-blue-500 mr-1 flex-shrink-0" />
                  <span className="truncate">{ubicacion.latitud.toFixed(6)}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 flex-shrink-0"></span>
                  <span className="truncate">{ubicacion.longitud.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {ubicacion.fecha_registro && (
              <div className="flex flex-col justify-end">
                <div className="text-xs text-gray-500 mb-1">Registro:</div>
                <div className="text-xs text-gray-400">
                  {new Date(ubicacion.fecha_registro).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {ubicacion.referencia && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Referencia:</div>
              <div className={`text-gray-600 break-words ${isMobile ? 'text-sm' : 'text-base'}`}>
                {ubicacion.referencia}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Columnas optimizadas para diferentes tamaños
  const getColumns = (): ColumnsType<UbicacionCliente> => {
    const baseColumns: ColumnsType<UbicacionCliente> = [
      {
        title: 'Cliente',
        dataIndex: 'cod_cliente',
        key: 'cod_cliente',
        width: isDesktop ? 200 : 160,
        render: (codCliente: string, record: UbicacionCliente) => {
          const clienteNombre = getClienteNombre(codCliente);
          const esPrincipal = esUbicacionPrincipal(record);
          
          return (
            <div>
              <div className={`font-medium ${isDesktop ? 'text-sm' : 'text-xs'} truncate`}>
                {clienteNombre}
              </div>
              <Text type="secondary" style={{ fontSize: isDesktop ? '12px' : '10px' }}>
                {codCliente}
              </Text>
              {esPrincipal && (
                <div className="mt-1">
                  <Tag color="gold" style={{ fontSize: '10px' }}>
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
        width: isDesktop ? 250 : 180,
        responsive: ['sm']
      },
      {
        title: 'Sector',
        dataIndex: 'sector',
        key: 'sector',
        width: isDesktop ? 120 : 100,
        render: (sector: string) => (
          <Tag color="blue" style={{ fontSize: isDesktop ? '12px' : '11px' }}>
            {sector}
          </Tag>
        )
      },
      {
        title: 'Coordenadas',
        key: 'coordenadas',
        width: isDesktop ? 150 : 130,
        responsive: isDesktop ? ['md'] : ['lg'],
        render: (_, record) => (
          <div style={{ fontSize: isDesktop ? '12px' : '10px' }}>
            <div className="flex items-center">
              <EnvironmentOutlined style={{ color: '#1890ff', marginRight: 4, flexShrink: 0 }} />
              <span className="truncate">{record.latitud.toFixed(4)}</span>
            </div>
            <div style={{ marginLeft: 16 }} className="truncate">
              {record.longitud.toFixed(4)}
            </div>
          </div>
        )
      },
      {
        title: 'Referencia',
        dataIndex: 'referencia',
        key: 'referencia',
        ellipsis: true,
        width: isDesktop ? 200 : 150,
        responsive: ['lg'],
        render: (text) => text || <Text type="secondary">Sin referencia</Text>
      },
      {
        title: 'Fecha',
        dataIndex: 'fecha_registro',
        key: 'fecha_registro',
        width: isDesktop ? 100 : 90,
        responsive: ['xl'],
        render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : '-'
      },
      {
        title: 'Acciones',
        key: 'acciones',
        width: isDesktop ? 100 : 80,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="text"
              size={isDesktop ? "middle" : "small"}
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="Editar"
            />
            <Popconfirm
              title="¿Eliminar?"
              description={
                esUbicacionPrincipal(record) 
                  ? "Es la principal del cliente"
                  : "No se puede deshacer"
              }
              onConfirm={() => record.id_ubicacion && handleDelete(record.id_ubicacion)}
              okText="Sí"
              cancelText="No"
            >
              <Button
                type="text"
                size={isDesktop ? "middle" : "small"}
                danger
                icon={<DeleteOutlined />}
                title="Eliminar"
              />
            </Popconfirm>
          </Space>
        )
      }
    ];

    return baseColumns;
  };

  // Componente de filtros
  const FiltersContent = () => (
    <div className="space-y-4">
      <Search
        placeholder="Buscar por cliente, dirección, sector..."
        allowClear
        onChange={(e) => setSearchText(e.target.value)}
        size={isMobile ? "large" : "middle"}
      />
      <Select
        placeholder="Filtrar por cliente"
        allowClear
        showSearch
        style={{ width: '100%' }}
        onChange={setClienteFilter}
        optionFilterProp="children"
        size={isMobile ? "large" : "middle"}
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
        size={isMobile ? "large" : "middle"}
      >
        {sectoresUnicos.map(sector => (
          <Option key={sector} value={sector}>{sector}</Option>
        ))}
      </Select>
    </div>
  );

  // Configuración del padding responsivo
  const getPadding = () => {
    if (isMobile) return "8px";
    if (isTablet) return "16px";
    return "24px";
  };

  return (
    <div style={{ padding: getPadding() }}>
      <Card>
        <div className="flex flex-col gap-4 mb-6">
          {/* Header responsivo */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1">
                <Title 
                  level={isMobile ? 4 : isTablet ? 3 : 2} 
                  style={{ margin: 0, fontSize: isMobile ? '18px' : isTablet ? '22px' : undefined }}
                >
                  {isMobile ? 'Ubicaciones' : 'Gestión de Ubicaciones de Clientes'}
                </Title>
                <Text type="secondary" className={isMobile ? "text-xs" : "text-sm"}>
                  {isMobile 
                    ? 'Administra ubicaciones de clientes'
                    : isTablet
                    ? 'Administra las ubicaciones geográficas de tus clientes'
                    : 'Administra las ubicaciones geográficas de tus clientes. La primera ubicación de cada cliente se establece automáticamente como principal.'
                  }
                </Text>
              </div>
              
              {/* Botones de acción responsivos */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="flex gap-2">
                  {(isMobile || isTablet) && (
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => setShowFilters(true)}
                      className="flex-1 sm:flex-none"
                    >
                      {isMobile ? 'Filtros' : 'Filtrar'}
                    </Button>
                  )}
                  <Button
                    type="default"
                    icon={<EnvironmentOutlined />}
                    onClick={() => setShowMap(!showMap)}
                    className="flex-1 sm:flex-none"
                  >
                    {isMobile ? 'Mapa' : (showMap ? 'Ocultar Mapa' : 'Ver Mapa')}
                  </Button>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  className="w-full sm:w-auto"
                >
                  {isMobile ? 'Nueva Ubicación' : 'Nueva Ubicación'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas responsivas */}
        <Row gutter={[8, 8]} className="mb-6">
          <Col xs={12} sm={8} md={6} lg={4} xl={4}>
            <Card size="small" className="text-center" bodyStyle={{ padding: isMobile ? '8px' : '12px' }}>
              <div className={`font-bold text-blue-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                {ubicaciones.length}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={4}>
            <Card size="small" className="text-center" bodyStyle={{ padding: isMobile ? '8px' : '12px' }}>
              <div className={`font-bold text-green-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                {sectoresUnicos.length}
              </div>
              <div className="text-xs text-gray-500">Sectores</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={4}>
            <Card size="small" className="text-center" bodyStyle={{ padding: isMobile ? '8px' : '12px' }}>
              <div className={`font-bold text-orange-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                {Array.from(new Set(ubicaciones.map(u => u.cod_cliente))).length}
              </div>
              <div className="text-xs text-gray-500">Clientes</div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={4} xl={4}>
            <Card size="small" className="text-center" bodyStyle={{ padding: isMobile ? '8px' : '12px' }}>
              <div className={`font-bold text-yellow-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                {ubicaciones.filter(u => esUbicacionPrincipal(u)).length}
              </div>
              <div className="text-xs text-gray-500">Principales</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={8} xl={8}>
            <Card size="small" className="text-center" bodyStyle={{ padding: isMobile ? '8px' : '12px' }}>
              <div className={`font-bold text-purple-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                {ubicacionesFiltradas.length}
              </div>
              <div className="text-xs text-gray-500">Mostrados</div>
            </Card>
          </Col>
        </Row>

        {/* Filtros para desktop */}
        {isDesktop && (
          <div className="mb-4 grid grid-cols-3 gap-4">
            <FiltersContent />
          </div>
        )}

        {/* Drawer de filtros para móvil y tablet */}
        <Drawer
          title="Filtros"
          placement="right"
          onClose={() => setShowFilters(false)}
          open={showFilters}
          width={isMobile ? "90%" : 300}
          bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
        >
          <FiltersContent />
        </Drawer>

        {/* Mapa responsivo */}
        {showMap && (
          <div className="mb-6">
            <Card 
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-wrap gap-2">
                    <EnvironmentOutlined />
                    <span className={isMobile ? "text-sm" : "text-base"}>
                      {isMobile ? 'Mapa' : 'Mapa de Ubicaciones'}
                    </span>
                    <Tag color="blue" style={{ fontSize: isMobile ? '10px' : '12px' }}>
                      {ubicacionesFiltradas.length}
                    </Tag>
                  </div>
                  {(isMobile || isTablet) && (
                    <Button 
                      type="text" 
                      size="small"
                      onClick={() => setShowMap(false)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              }
              size={isMobile ? "small" : "default"}
              bodyStyle={{ padding: isMobile ? '8px' : '16px' }}
            >
              <div className={`${
                isMobile ? 'h-48' : 
                isTablet ? 'h-64' : 
                'h-80'
              }`}>
                <MapaUbicacionCliente 
                  ubicaciones={ubicacionesFiltradas}
                  readonly={true}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Contenido principal: Tabla para desktop, Cards para móvil/tablet */}
        {isMobile || isTablet ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">
                {ubicacionesFiltradas.length} ubicación{ubicacionesFiltradas.length !== 1 ? 'es' : ''}
              </span>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className={isMobile ? 'text-sm' : 'text-base'}>Cargando ubicaciones...</div>
              </div>
            ) : ubicacionesFiltradas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <EnvironmentOutlined className={`${isMobile ? 'text-3xl' : 'text-4xl'} mb-4 text-gray-300`} />
                <div className={isMobile ? 'text-sm' : 'text-base'}>No se encontraron ubicaciones</div>
                <div className="text-xs mt-2">
                  Crea la primera ubicación usando el botón "Nueva Ubicación"
                </div>
              </div>
            ) : (
              <div className={`grid gap-3 ${
                isTablet ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
              }`}>
                {ubicacionesFiltradas.map((ubicacion) => (
                  <UbicacionCard key={ubicacion.id_ubicacion} ubicacion={ubicacion} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={ubicacionesFiltradas}
            rowKey="id_ubicacion"
            loading={loading}
            scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} ubicaciones`,
              pageSizeOptions: ['5', '10', '20', '50'],
              responsive: true,
              size: 'small',
              position: ['bottomCenter']
            }}
            size="small"
            rowClassName={(record) => esUbicacionPrincipal(record) ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
          />
        )}

        {/* Modal/Drawer del formulario */}
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