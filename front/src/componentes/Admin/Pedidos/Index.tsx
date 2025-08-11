import axios from "axios";
import FormCrearPedido from "./Form";
import { authService } from "auth/auth";
import { useEffect, useState, useCallback } from "react";
import { Pedido, Cliente } from "types/types";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Table, Button, Space, Popconfirm, Input, message, Modal, Descriptions, Typography, Row, Col } from "antd";

const { Text, Title } = Typography;

const Pedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoEditar, setPedidoEditar] = useState<Pedido | null>(null);
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const getAxiosConfig = () => {
    const token = authService.getToken();
    if (!token) {
      message.error('No hay token de autenticación. Por favor, inicia sesión.');
      return null;
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

const obtenerPedidos = useCallback(async () => {
  setCargando(true);
  try {
    const config = getAxiosConfig();
    if (!config) return;
    
    const { data } = await axios.get("http://127.0.0.1:8000/pedidos", config);
    setPedidos(data);
  } catch (error: any) {
    console.error("Error al obtener pedidos:", error);
    if (error.response?.status === 401) {
      message.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      authService.logout();
      window.location.href = '/login';
    } else {
      message.error("Error al obtener pedidos");
    }
  }
  setCargando(false);
}, []);

const obtenerClientes = useCallback(async () => {
  try {
    const config = getAxiosConfig();
    if (!config) return;
    
    const { data } = await axios.get("http://127.0.0.1:8000/clientes", config);
    setClientes(data);
  } catch (error: any) {
    console.error("Error al cargar clientes:", error);
    if (error.response?.status === 401) {
      message.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      authService.logout();
      window.location.href = '/login';
    } else {
      message.error("Error al cargar clientes");
    }
  }
}, []);

  const eliminarPedido = async (id_pedido: number) => {
    try {
      const config = getAxiosConfig();
      if (!config) return;
      
      await axios.delete(`http://127.0.0.1:8000/pedidos/${id_pedido}`, config);
      message.success("Pedido eliminado correctamente");
      obtenerPedidos();
    } catch (error: any) {
      console.error("Error al eliminar pedido:", error);
      if (error.response?.status === 401) {
        message.error('No autorizado para realizar esta acción');
      } else {
        message.error("Error al eliminar el pedido");
      }
    }
  };

  const verDetallePedido = async (id_pedido: number) => {
    try {
      const config = getAxiosConfig();
      if (!config) return;
      
      const { data } = await axios.get(`http://127.0.0.1:8000/pedidos/${id_pedido}`, config);
      setPedidoDetalle(data);
      setMostrarDetalle(true);
    } catch (error: any) {
      console.error("Error al obtener detalle del pedido:", error);
      message.error("Error al cargar los detalles del pedido");
    }
  };

  const obtenerNombreCliente = (cod_cliente: string) => {
    const cliente = clientes.find(c => c.cod_cliente === cod_cliente);
    return cliente ? cliente.nombre : cod_cliente;
  };

  const pedidosFiltrados = pedidos.filter(p =>
    p.numero_pedido.toLowerCase().includes(busqueda.toLowerCase()) ||
    obtenerNombreCliente(p.cod_cliente).toLowerCase().includes(busqueda.toLowerCase())
  );

  const columns = [
    { 
      title: "Número", 
      dataIndex: "numero_pedido", 
      key: "numero_pedido",
      render: (numero: string) => <Text strong>{numero}</Text>
    },
    { 
      title: "Cliente", 
      dataIndex: "cod_cliente", 
      key: "cod_cliente",
      render: (cod_cliente: string) => (
        <div>
          <Text>{obtenerNombreCliente(cod_cliente)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>{cod_cliente}</Text>
        </div>
      )
    },
    {
      title: "Fecha",
      dataIndex: "fecha_pedido",
      key: "fecha_pedido",
      render: (fecha: string) => new Date(fecha).toLocaleDateString()
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          ${total.toFixed(2)}
        </Text>
      )
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, record: Pedido) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => verDetallePedido(record.id_pedido)}
            title="Ver detalles"
          />
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => {
              setPedidoEditar(record);
              setMostrarFormulario(true);
            }}
            title="Editar pedido"
          />
          <Popconfirm 
            title="¿Está seguro de eliminar este pedido?" 
            description="Esta acción no se puede deshacer"
            onConfirm={() => eliminarPedido(record.id_pedido)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              title="Eliminar pedido"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

useEffect(() => {
  if (!authService.isAuthenticated()) {
    message.error('No estás autenticado. Por favor, inicia sesión.');
    window.location.href = '/login';
    return;
  }

  obtenerPedidos();
  obtenerClientes();
}, [obtenerPedidos, obtenerClientes]);

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Gestión de Pedidos
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Buscar por número de pedido o cliente"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={16}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setPedidoEditar(null);
                setMostrarFormulario(true);
              }}
            >
              Crear Pedido
            </Button>
          </div>
        </Col>
      </Row>

      <Table
        dataSource={pedidosFiltrados}
        rowKey="id_pedido"
        loading={cargando}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} pedidos`
        }}
      />

      {/* Modal para crear/editar pedido */}
      <Modal
        title={pedidoEditar ? "Editar Pedido" : "Crear Nuevo Pedido"}
        open={mostrarFormulario}
        footer={null}
        onCancel={() => {
          setMostrarFormulario(false);
          setPedidoEditar(null);
        }}
        destroyOnClose
        width={1000}
      >
        <FormCrearPedido
          clientes={clientes}
          pedidoEditar={pedidoEditar}
          onCancel={() => {
            setMostrarFormulario(false);
            setPedidoEditar(null);
          }}
          onSubmit={async () => {
            await obtenerPedidos();
            setMostrarFormulario(false);
            setPedidoEditar(null);
          }}
        />
      </Modal>

      {/* Modal para ver detalles del pedido */}
      <Modal
        title={`Detalles del Pedido #${pedidoDetalle?.numero_pedido}`}
        open={mostrarDetalle}
        footer={[
          <Button key="close" onClick={() => setMostrarDetalle(false)}>
            Cerrar
          </Button>
        ]}
        onCancel={() => setMostrarDetalle(false)}
        width={800}
      >
        {pedidoDetalle && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Número de Pedido" span={1}>
                <Text strong>{pedidoDetalle.numero_pedido}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Fecha" span={1}>
                {new Date(pedidoDetalle.fecha_pedido).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Cliente" span={2}>
                {obtenerNombreCliente(pedidoDetalle.cod_cliente)} ({pedidoDetalle.cod_cliente})
              </Descriptions.Item>
              <Descriptions.Item label="Total" span={2}>
                <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                  ${pedidoDetalle.total.toFixed(2)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Title level={4}>Productos del Pedido</Title>
            <Table
              dataSource={pedidoDetalle.detalles || []}
              rowKey="id_detalle_pedido"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Producto",
                  dataIndex: "id_producto",
                  key: "id_producto",
                  render: (id_producto: number) => `Producto #${id_producto}`
                },
                {
                  title: "Cantidad",
                  dataIndex: "cantidad",
                  key: "cantidad",
                  align: "center"
                },
                {
                  title: "Precio Unit.",
                  dataIndex: "precio_unitario",
                  key: "precio_unitario",
                  render: (precio: number) => `$${precio.toFixed(2)}`,
                  align: "right"
                },
                {
                  title: "Descuento",
                  dataIndex: "descuento",
                  key: "descuento",
                  render: (descuento: number) => `$${descuento.toFixed(2)}`,
                  align: "right"
                },
                {
                  title: "Subtotal",
                  dataIndex: "subtotal",
                  key: "subtotal",
                  render: (subtotal: number) => (
                    <Text strong style={{ color: "#1890ff" }}>
                      ${subtotal.toFixed(2)}
                    </Text>
                  ),
                  align: "right"
                }
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Totales:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <div style={{ textAlign: "right" }}>
                      <div>Subtotal: <Text strong>${pedidoDetalle.subtotal.toFixed(2)}</Text></div>
                      <div>IVA (12%): <Text strong>${pedidoDetalle.iva.toFixed(2)}</Text></div>
                      <div>Total: <Text strong style={{ color: "#52c41a" }}>${pedidoDetalle.total.toFixed(2)}</Text></div>
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pedidos;