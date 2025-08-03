import axios from "axios";
import FormCrearPedido from "./Form";
import { useEffect, useState } from "react";
import { Pedido, Cliente } from "types/types";
import { Table, Button, Space, Popconfirm, Input, message, Modal, Card, List, Typography, Row, Col } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { authService } from "auth/auth";
import Title from "antd/es/typography/Title";

const Pedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoEditar, setPedidoEditar] = useState<Pedido | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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

  const obtenerPedidos = async () => {
    setCargando(true);
    try {
      const config = getAxiosConfig();
      if (!config) return;
      const { data } = await axios.get("http://127.0.0.1:8000/pedidos", config);
      setPedidos(data);
    } catch {
      message.error("Error al obtener pedidos");
    }
    setCargando(false);
  };

  const obtenerClientes = async () => {
    try {
      const config = getAxiosConfig();
      if (!config) return;
      const { data } = await axios.get("http://127.0.0.1:8000/clientes", config);
      setClientes(data);
    } catch {
      message.error("Error al cargar clientes");
    }
  };

  const eliminarPedido = async (id_pedido: number) => {
    try {
      const config = getAxiosConfig();
      if (!config) return;
      await axios.delete(`http://127.0.0.1:8000/pedidos/${id_pedido}`, config);
      message.success("Pedido eliminado");
      obtenerPedidos();
    } catch {
      message.error("Error al eliminar");
    }
  };

  const pedidosFiltrados = pedidos.filter(p =>
    p.numero_pedido.toLowerCase().includes(busqueda.toLowerCase())
  );

  const columns = [
    { title: "Número", dataIndex: "numero_pedido", key: "numero_pedido" },
    { title: "Cliente", dataIndex: "cod_cliente", key: "cod_cliente" },
    { title: "Estado", dataIndex: "estado", key: "estado" },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `$${total.toFixed(2)}`
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, record: Pedido) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => {
            setPedidoEditar(record);
            setMostrarFormulario(true);
          }} />
          <Popconfirm title="¿Eliminar pedido?" onConfirm={() => eliminarPedido(record.id_pedido)}>
            <Button danger icon={<DeleteOutlined />} />
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

    const checkResponsive = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkResponsive();
    window.addEventListener("resize", checkResponsive);
    return () => window.removeEventListener("resize", checkResponsive);
  }, []);

  return (
    <div style={{ padding: isMobile ? "12px" : "24px" }}>
      <Typography.Title level={2} style={{ marginBottom: '24px' }}>
        Pedidos
      </Typography.Title>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Buscar pedido"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ minWidth: 200 }}
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
            <Button
              type="default"
              danger
              
            >
              Finalizar Ruta
            </Button>
          </div>
        </Col>
      </Row>
      {isMobile ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={pedidosFiltrados}
          loading={cargando}
          renderItem={item => (
            <List.Item>
              <Card
                title={`Pedido #${item.numero_pedido}`}
                extra={
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => {
                      setPedidoEditar(item);
                      setMostrarFormulario(true);
                    }} />
                    <Popconfirm title="¿Eliminar pedido?" onConfirm={() => eliminarPedido(item.id_pedido)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                <p><strong>Cliente:</strong> {item.cod_cliente}</p>
                <p><strong>Estado:</strong> {item.estado}</p>
                <p><strong>Total:</strong> ${item.total.toFixed(2)}</p>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          dataSource={pedidosFiltrados}
          rowKey="id_pedido"
          loading={cargando}
          columns={columns}
        />
      )}

      <Modal
        open={mostrarFormulario}
        footer={null}
        onCancel={() => setMostrarFormulario(false)}
        destroyOnClose
      >
        <FormCrearPedido
          clientes={clientes}
          pedidoEditar={pedidoEditar}
          onCancel={() => setMostrarFormulario(false)}
          onSubmit={async () => {
            await obtenerPedidos();
            setMostrarFormulario(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default Pedidos;

