import axios from "axios";
import { useEffect, useState } from "react";
import { EditOutlined } from "@ant-design/icons";
import { Pedido, EstadoPedido } from "types/types";
import { Table, Select, Button, Tag, message, Modal, Typography, Card, Row, Col, Grid } from "antd";

const { Option } = Select;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ESTADOS_PEDIDO = ["Facturado", "Despachado", "Enviado", "Entregado"];

const getColorEstado = (estado: string) => {
  const colores: { [key: string]: string } = {
    "Facturado": "orange",
    "Despachado": "blue",
    "Enviado": "purple",
    "Entregado": "green",
    "Sin estado": "default"
  };
  return colores[estado] || "default";
};

interface PedidoConEstado extends Pedido {
  cliente?: {
    nombre: string;
    razon_social?: string;
  };
  estado_actual?: string;
}

const EstadoPedidos = () => {
  const [pedidos, setPedidos] = useState<PedidoConEstado[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConEstado | null>(null);
  const [nuevoEstadoSeleccionado, setNuevoEstadoSeleccionado] = useState<string>("");
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  const screens = useBreakpoint();

  const esMovil = !screens.md; 
  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const responsePedidos = await axios.get("http://127.0.0.1:8000/pedidos", { headers });
      if (!responsePedidos.data || !Array.isArray(responsePedidos.data)) {
        message.warning("No hay pedidos disponibles");
        setPedidos([]);
        return;
      }

      const responseEstados = await axios.get("http://127.0.0.1:8000/estados_pedido", { headers });
      const todosLosEstados = responseEstados.data || [];

      const ultimoEstadoPorPedido: { [key: number]: string } = {};
      todosLosEstados.forEach((estado: EstadoPedido) => {
        if (
          !ultimoEstadoPorPedido[estado.id_estado_pedido] || 
          new Date(estado.fecha_actualizada) > new Date(ultimoEstadoPorPedido[estado.id_estado_pedido])
        ) {
          ultimoEstadoPorPedido[estado.id_estado_pedido] = estado.descripcion;
        }
      });

      const pedidosConEstado = responsePedidos.data.map((pedido: Pedido) => ({
        ...pedido,
        estado_actual: ultimoEstadoPorPedido[pedido.id_pedido] || "Sin estado"
      }));

      setPedidos(pedidosConEstado);
      message.success(`${pedidosConEstado.length} pedidos cargados`);

    } catch (error: any) {
      console.error("Error al cargar pedidos:", error);
      message.error("Error al cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEditar = (pedido: PedidoConEstado) => {
    setPedidoSeleccionado(pedido);
    setNuevoEstadoSeleccionado("");
    setModalEditarVisible(true);
  };

  const actualizarEstadoPedido = async () => {
    if (!pedidoSeleccionado || !nuevoEstadoSeleccionado) {
      message.warning("Debe seleccionar un estado");
      return;
    }
    setActualizandoEstado(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post("http://127.0.0.1:8000/estados_pedido", {
        id_pedido: pedidoSeleccionado.id_pedido,
        descripcion: nuevoEstadoSeleccionado,
        fecha_actualizada: new Date().toISOString().split("T")[0]
      }, { headers });

      message.success(`Estado actualizado a: ${nuevoEstadoSeleccionado}`);

      setPedidos(prev =>
        prev.map(p => p.id_pedido === pedidoSeleccionado.id_pedido
          ? { ...p, estado_actual: nuevoEstadoSeleccionado }
          : p
        )
      );

      setModalEditarVisible(false);
      setNuevoEstadoSeleccionado("");
      setPedidoSeleccionado(null);

    } catch (error: any) {
      console.error("Error al actualizar estado:", error);
      message.error("Error al actualizar el estado del pedido");
    } finally {
      setActualizandoEstado(false);
    }
  };

  const columns = [
    { title: "N° Pedido", dataIndex: "numero_pedido", key: "numero_pedido", width: 120 },
    { 
      title: "Cliente", key: "cliente", width: 200,
      render: (record: PedidoConEstado) => record.cliente?.nombre || record.cod_cliente || "Sin cliente",
    },
    { 
      title: "Fecha", dataIndex: "fecha_pedido", key: "fecha_pedido", width: 120,
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString() : "-"
    },
    {
      title: "Total", dataIndex: "total", key: "total", width: 100,
      render: (total: number) => `${total?.toFixed(2) || '0.00'}`
    },
    {
      title: "Estado Actual", dataIndex: "estado_actual", key: "estado_actual", width: 130,
      render: (estado: string) => (
        <Tag color={getColorEstado(estado)}>
          {estado || "Sin estado"}
        </Tag>
      )
    },
    {
      title: "Acciones", key: "acciones", width: 120,
      render: (_: any, record: PedidoConEstado) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => abrirModalEditar(record)}>
          Editar Estado
        </Button>
      )
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>Estados de Pedidos</Title>
          </Col>
          <Col>
            <Text>Total: {pedidos.length} pedidos</Text>
          </Col>
        </Row>

        {esMovil ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pedidos.map(pedido => (
              <Card
                key={pedido.id_pedido}
                size="small"
                title={`Pedido #${pedido.numero_pedido}`}
                extra={
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => abrirModalEditar(pedido)}
                  >
                    Editar
                  </Button>
                }
              >
                <p><b>Cliente:</b> {pedido.cliente?.nombre || pedido.cod_cliente || "Sin cliente"}</p>
                <p><b>Fecha:</b> {pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString() : "-"}</p>
                <p><b>Total:</b> ${pedido.total?.toFixed(2) || "0.00"}</p>
                <p>
                  <b>Estado Actual:</b>{" "}
                  <Tag color={getColorEstado(pedido.estado_actual || "")}>
                    {pedido.estado_actual || "Sin estado"}
                  </Tag>
                </p>
              </Card>
            ))}
          </div>
        ) : (
          // Si no es móvil, mostrar tabla
          <Table
            rowKey="id_pedido"
            columns={columns}
            dataSource={pedidos}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} pedidos`,
            }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}

      <Modal
        title={`Editar Estado - Pedido #${pedidoSeleccionado?.numero_pedido}`}
        visible={modalEditarVisible}
        onOk={actualizarEstadoPedido}
        onCancel={() => {
          setModalEditarVisible(false);
          setNuevoEstadoSeleccionado("");
          setPedidoSeleccionado(null);
        }}
        confirmLoading={actualizandoEstado}
        okText="Aceptar"
        cancelText="Cancelar"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p><b>Cliente:</b> {pedidoSeleccionado?.cliente?.nombre || pedidoSeleccionado?.cod_cliente}</p>
          <p><b>Total:</b> ${pedidoSeleccionado?.total?.toFixed(2) || "0.00"}</p>
          <p>
            <b>Estado Actual:</b>{" "}
            <Tag color={getColorEstado(pedidoSeleccionado?.estado_actual || "")} style={{ marginLeft: 8 }}>
              {pedidoSeleccionado?.estado_actual || "Sin estado"}
            </Tag>
          </p>
        </div>

        <div>
          <p style={{ marginBottom: 8 }}><b>Nuevo Estado:</b></p>
          <Select
            placeholder="Seleccionar nuevo estado"
            style={{ width: "100%" }}
            value={nuevoEstadoSeleccionado}
            onChange={setNuevoEstadoSeleccionado}
            size="large"
          >
            {ESTADOS_PEDIDO.map((estado) => (
              <Option key={estado} value={estado}>
                <Tag color={getColorEstado(estado)} style={{ marginRight: 8 }}>
                  {estado}
                </Tag>
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default EstadoPedidos;
