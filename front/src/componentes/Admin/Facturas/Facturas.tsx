import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Pedido, Factura, PedidoConFactura } from 'types/types';
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  message, 
  Input, 
  Card, 
  Tag, 
  Tooltip,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Divider
} from 'antd';
import { 
  EyeOutlined, 
  FileAddOutlined, 
  PrinterOutlined, 
  SearchOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const Facturas: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoConFactura[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConFactura | null>(null);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [fechaRango, setFechaRango] = useState<[Dayjs, Dayjs] | null>(null);
  const [vistaActual, setVistaActual] = useState<'pedidos' | 'facturas'>('pedidos');

  useEffect(() => {
    cargarDatos();
  }, [vistaActual]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (vistaActual === 'pedidos') {
        await cargarPedidos();
      } else {
        await cargarFacturas();
      }
    } catch (error) {
      message.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarPedidos = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/pedidos");
      // Cargar información del cliente para cada pedido
      const pedidosConCliente = await Promise.all(
        response.data.map(async (pedido: Pedido) => {
          try {
            const clienteResponse = await axios.get(`http://127.0.0.1:8000/clientes/${pedido.cod_cliente}`);
            return {
              ...pedido,
              cliente: clienteResponse.data
            };
          } catch {
            return pedido;
          }
        })
      );
      setPedidos(pedidosConCliente);
    } catch (error) {
      throw error;
    }
  };

  const cargarFacturas = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/facturas");
      // Cargar información del cliente para cada factura
      const facturasConCliente = await Promise.all(
        response.data.map(async (factura: Factura) => {
          try {
            const clienteResponse = await axios.get(`http://127.0.0.1:8000/clientes/${factura.cod_cliente}`);
            return {
              ...factura,
              cliente: clienteResponse.data
            };
          } catch {
            return factura;
          }
        })
      );
      setFacturas(facturasConCliente);
    } catch (error) {
      throw error;
    }
  };

  const crearDetallesFactura = async (facturaId: number, detalles: any[]) => {
    try {
      // Crear cada detalle de factura individualmente
      for (const detalle of detalles) {
        const detalleFacturaData = {
          id_factura: facturaId,
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          iva_producto: detalle.precio_unitario * 0.12, // IVA del 12%
          subtotal_lineal: detalle.subtotal_lineal
        };

        await axios.post("http://127.0.0.1:8000/detalles_factura", detalleFacturaData);
      }
    } catch (error) {
      console.error('Error al crear detalles de factura:', error);
      throw error;
    }
  };

  const facturarPedido = async (pedido: PedidoConFactura) => {
    try {
      // Paso 1: Crear la factura principal
      const facturaData = {
        cod_cliente: pedido.cod_cliente,
        fecha_emision: dayjs().format('YYYY-MM-DD'),
        estado: 'emitida',
        subtotal: pedido.subtotal,
        iva: pedido.iva,
        total: pedido.total
      };

      const facturaResponse = await axios.post("http://127.0.0.1:8000/facturas", facturaData);
      const nuevaFactura = facturaResponse.data;

      // Paso 2: Crear los detalles de la factura si existen detalles del pedido
      if (pedido.detalles && pedido.detalles.length > 0) {
        await crearDetallesFactura(nuevaFactura.id_factura, pedido.detalles);
      }

      message.success(`Factura #${nuevaFactura.numero_factura} creada exitosamente para el pedido #${pedido.numero_pedido}`);
      
      // Recargar los datos para reflejar los cambios
      await cargarDatos();
      
      return nuevaFactura;
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      
      // Mostrar mensaje de error más específico
      if (error.response?.data?.detail) {
        message.error(`Error al crear factura: ${error.response.data.detail}`);
      } else {
        message.error('Error al crear la factura. Por favor intente nuevamente.');
      }
      
      throw error;
    }
  };

  const facturarSeleccionados = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Por favor selecciona al menos un pedido');
      return;
    }

    const pedidosSeleccionados = pedidos.filter(p => 
      selectedRowKeys.includes(p.id_pedido.toString()) && !p.factura
    );

    if (pedidosSeleccionados.length === 0) {
      message.warning('No hay pedidos válidos para facturar (sin factura previa)');
      return;
    }

    // Mostrar modal de confirmación
    Modal.confirm({
      title: 'Confirmar Facturación',
      content: `¿Está seguro de que desea crear facturas para ${pedidosSeleccionados.length} pedido(s) seleccionado(s)?`,
      okText: 'Sí, Facturar',
      cancelText: 'Cancelar',
      onOk: async () => {
        const loadingMessage = message.loading('Creando facturas...', 0);
        
        try {
          let facturasCreadas = 0;
          let errores = 0;

          // Procesar cada pedido individualmente
          for (const pedido of pedidosSeleccionados) {
            try {
              await facturarPedido(pedido);
              facturasCreadas++;
            } catch (error) {
              errores++;
              console.error(`Error al facturar pedido ${pedido.numero_pedido}:`, error);
            }
          }

          loadingMessage();

          // Mostrar resultado
          if (facturasCreadas > 0) {
            message.success(`${facturasCreadas} factura(s) creada(s) exitosamente${errores > 0 ? ` (${errores} errores)` : ''}`);
          }
          
          if (errores > 0 && facturasCreadas === 0) {
            message.error(`Error al crear las facturas. ${errores} pedido(s) no pudieron ser facturados.`);
          }

          // Limpiar selección
          setSelectedRowKeys([]);
          
        } catch (error) {
          loadingMessage();
          message.error('Error general al procesar las facturas');
        }
      }
    });
  };

  const imprimirFactura = async (item: PedidoConFactura | Factura) => {
    try {
      let facturaId: number;
      
      if ('id_factura' in item) {
        facturaId = item.id_factura;
      } else if (item.factura) {
        facturaId = item.factura.id_factura;
      } else {
        message.error('No se encontró la factura para imprimir');
        return;
      }

      // Abrir el PDF en una nueva ventana
      window.open(`http://127.0.0.1:8000/facturas/${facturaId}/pdf`, '_blank');
    } catch (error) {
      message.error('Error al generar el PDF de la factura');
    }
  };

  const descargarFacturaPDF = async (factura: Factura) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/facturas/${factura.id_factura}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${factura.numero_factura}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Error al descargar el PDF');
    }
  };

  // Filtrar datos según búsqueda y filtros
  const pedidosFiltrados = React.useMemo(() => {
    let datos = pedidos;
    
    // Filtro por texto de búsqueda
    if (searchText) {
      datos = datos.filter(pedido => {
        const numeroRef = pedido.numero_pedido;
        const clienteNombre = pedido.cliente?.nombre || '';
        const clienteRazon = pedido.cliente?.razon_social || '';
        const codCliente = pedido.cod_cliente;
        
        return (
          numeroRef.toLowerCase().includes(searchText.toLowerCase()) ||
          clienteNombre.toLowerCase().includes(searchText.toLowerCase()) ||
          clienteRazon.toLowerCase().includes(searchText.toLowerCase()) ||
          codCliente.toLowerCase().includes(searchText.toLowerCase())
        );
      });
    }

    // Filtro por rango de fechas
    if (fechaRango) {
      datos = datos.filter(pedido => {
        const fechaPedido = dayjs(pedido.fecha_pedido);
        return fechaPedido.isAfter(fechaRango[0], 'day') && fechaPedido.isBefore(fechaRango[1], 'day');
      });
    }

    return datos;
  }, [pedidos, searchText, fechaRango]);

  const facturasFiltradas = React.useMemo(() => {
    let datos = facturas;
    
    // Filtro por texto de búsqueda
    if (searchText) {
      datos = datos.filter(factura => {
        const numeroRef = factura.numero_factura.toString();
        const clienteNombre = factura.cliente?.nombre || '';
        const clienteRazon = factura.cliente?.razon_social || '';
        const codCliente = factura.cod_cliente;
        
        return (
          numeroRef.toLowerCase().includes(searchText.toLowerCase()) ||
          clienteNombre.toLowerCase().includes(searchText.toLowerCase()) ||
          clienteRazon.toLowerCase().includes(searchText.toLowerCase()) ||
          codCliente.toLowerCase().includes(searchText.toLowerCase())
        );
      });
    }

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      datos = datos.filter(factura => factura.estado === filtroEstado);
    }

    // Filtro por rango de fechas
    if (fechaRango) {
      datos = datos.filter(factura => {
        const fechaFactura = dayjs(factura.fecha_emision);
        return fechaFactura.isAfter(fechaRango[0], 'day') && fechaFactura.isBefore(fechaRango[1], 'day');
      });
    }

    return datos;
  }, [facturas, searchText, filtroEstado, fechaRango]);

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setFechaRango([dates[0], dates[1]]);
    } else {
      setFechaRango(null);
    }
  };

  const columnasPedidos = [
    {
      title: 'Número de Pedido',
      dataIndex: 'numero_pedido',
      key: 'numero_pedido',
      sorter: (a: PedidoConFactura, b: PedidoConFactura) => 
        a.numero_pedido.localeCompare(b.numero_pedido),
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_pedido',
      key: 'fecha_pedido',
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
      sorter: (a: PedidoConFactura, b: PedidoConFactura) => 
        dayjs(a.fecha_pedido).unix() - dayjs(b.fecha_pedido).unix(),
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_: any, pedido: PedidoConFactura) => (
        <div>
          <div><strong>{pedido.cliente?.nombre || 'N/A'}</strong></div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {pedido.cod_cliente}
          </Text>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (valor: number) => `$${valor.toFixed(2)}`,
      sorter: (a: PedidoConFactura, b: PedidoConFactura) => a.total - b.total,
    },
    {
      title: 'Estado',
      key: 'estado_factura',
      render: (_: any, pedido: PedidoConFactura) => (
        pedido.factura ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Facturado
          </Tag>
        ) : (
          <Tag color="orange" icon={<ClockCircleOutlined />}>
            Pendiente
          </Tag>
        )
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, pedido: PedidoConFactura) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setPedidoSeleccionado(pedido);
                setVisibleModal(true);
              }}
            />
          </Tooltip>
          {!pedido.factura ? (
            <Tooltip title="Crear factura">
              <Button
                icon={<FileAddOutlined />}
                size="small"
                type="primary"
                onClick={() => facturarPedido(pedido)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Imprimir factura">
              <Button
                icon={<PrinterOutlined />}
                size="small"
                onClick={() => imprimirFactura(pedido)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const columnasFacturas = [
    {
      title: 'Número de Factura',
      dataIndex: 'numero_factura',
      key: 'numero_factura',
      sorter: (a: Factura, b: Factura) => a.numero_factura - b.numero_factura,
    },
    {
      title: 'Fecha Emisión',
      dataIndex: 'fecha_emision',
      key: 'fecha_emision',
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
      sorter: (a: Factura, b: Factura) => 
        dayjs(a.fecha_emision).unix() - dayjs(b.fecha_emision).unix(),
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_: any, factura: Factura) => (
        <div>
          <div><strong>{factura.cliente?.nombre || 'N/A'}</strong></div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {factura.cod_cliente}
          </Text>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (valor: number) => `$${valor.toFixed(2)}`,
      sorter: (a: Factura, b: Factura) => a.total - b.total,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: string) => {
        const color = estado === 'emitida' ? 'green' : estado === 'anulada' ? 'red' : 'orange';
        return <Tag color={color}>{estado.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, factura: Factura) => (
        <Space>
          <Tooltip title="Imprimir factura">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => imprimirFactura(factura)}
            />
          </Tooltip>
          <Tooltip title="Descargar PDF">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => descargarFacturaPDF(factura)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = vistaActual === 'pedidos' ? {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: PedidoConFactura) => ({
      disabled: !!record.factura, // Deshabilitar si ya tiene factura
    }),
  } : undefined;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {vistaActual === 'pedidos' ? 'Gestión de Facturas - Pedidos' : 'Facturas Emitidas'}
            </Title>
          </Col>
          <Col>
            <Space>
              <Select
                value={vistaActual}
                onChange={setVistaActual}
                style={{ width: 150 }}
              >
                <Option value="pedidos">Pedidos</Option>
                <Option value="facturas">Facturas</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={cargarDatos}
                loading={loading}
              >
                Actualizar
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* Filtros y búsqueda */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder={`Buscar por número, cliente o código`}
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          {vistaActual === 'facturas' && (
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Estado"
                style={{ width: '100%' }}
                value={filtroEstado}
                onChange={setFiltroEstado}
              >
                <Option value="todos">Todos</Option>
                <Option value="emitida">Emitida</Option>
                <Option value="pagada">Pagada</Option>
                <Option value="anulada">Anulada</Option>
              </Select>
            </Col>
          )}
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Fecha inicio', 'Fecha fin']}
              value={fechaRango}
              onChange={handleRangeChange}
            />
          </Col>
        </Row>

        {/* Acciones masivas solo para pedidos */}
        {vistaActual === 'pedidos' && (
          <Row style={{ marginBottom: 16 }}>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  icon={<FileAddOutlined />}
                  onClick={facturarSeleccionados}
                  disabled={selectedRowKeys.length === 0}
                >
                  Facturar Seleccionados ({selectedRowKeys.length})
                </Button>
                <Text type="secondary">
                  {pedidos.filter(p => !p.factura).length} pedidos sin facturar
                </Text>
              </Space>
            </Col>
          </Row>
        )}

        {/* Tabla de Pedidos */}
        {vistaActual === 'pedidos' && (
          <Table<PedidoConFactura>
            columns={columnasPedidos}
            dataSource={pedidosFiltrados}
            rowKey="id_pedido"
            loading={loading}
            rowSelection={rowSelection}
            scroll={{ x: 800 }}
            pagination={{
              total: pedidosFiltrados.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} pedidos`,
            }}
          />
        )}

        {/* Tabla de Facturas */}
        {vistaActual === 'facturas' && (
          <Table<Factura>
            columns={columnasFacturas}
            dataSource={facturasFiltradas}
            rowKey="id_factura"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              total: facturasFiltradas.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} facturas`,
            }}
          />
        )}

        {/* Modal de detalles */}
        <Modal
          open={visibleModal}
          title={`Detalles del pedido #${pedidoSeleccionado?.numero_pedido}`}
          onCancel={() => setVisibleModal(false)}
          footer={[
            <Button key="close" onClick={() => setVisibleModal(false)}>
              Cerrar
            </Button>,
            pedidoSeleccionado && !pedidoSeleccionado.factura && (
              <Button
                key="facturar"
                type="primary"
                icon={<FileAddOutlined />}
                onClick={() => {
                  if (pedidoSeleccionado) {
                    facturarPedido(pedidoSeleccionado);
                    setVisibleModal(false);
                  }
                }}
              >
                Crear Factura
              </Button>
            ),
          ]}
          width={800}
        >
          {pedidoSeleccionado && (
            <div>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <strong>Cliente:</strong> {pedidoSeleccionado.cliente?.nombre || 'N/A'}
                </Col>
                <Col span={12}>
                  <strong>Código:</strong> {pedidoSeleccionado.cod_cliente}
                </Col>
                <Col span={12}>
                  <strong>Fecha:</strong> {dayjs(pedidoSeleccionado.fecha_pedido).format('DD/MM/YYYY')}
                </Col>
                <Col span={12}>
                  <strong>Subtotal:</strong> ${pedidoSeleccionado.subtotal.toFixed(2)}
                </Col>
                <Col span={12}>
                  <strong>IVA:</strong> ${pedidoSeleccionado.iva.toFixed(2)}
                </Col>
                <Col span={12}>
                  <strong>Total:</strong> ${pedidoSeleccionado.total.toFixed(2)}
                </Col>
              </Row>

              <Divider>Detalles del Pedido</Divider>

              {pedidoSeleccionado.detalles?.length ? (
                <Table
                  dataSource={pedidoSeleccionado.detalles}
                  rowKey="id_detalle_pedido"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Producto',
                      dataIndex: 'id_producto',
                      key: 'id_producto',
                    },
                    {
                      title: 'Cantidad',
                      dataIndex: 'cantidad',
                      key: 'cantidad',
                    },
                    {
                      title: 'Precio Unit.',
                      dataIndex: 'precio_unitario',
                      key: 'precio_unitario',
                      render: (precio: number) => `$${precio.toFixed(2)}`,
                    },
                    {
                      title: 'Descuento',
                      dataIndex: 'descuento',
                      key: 'descuento',
                      render: (descuento: number) => `$${descuento.toFixed(2)}`,
                    },
                    {
                      title: 'Subtotal',
                      dataIndex: 'subtotal',
                      key: 'subtotal',
                      render: (subtotal: number) => `$${subtotal.toFixed(2)}`,
                    },
                  ]}
                />
              ) : (
                <Text>No hay detalles disponibles.</Text>
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default Facturas;