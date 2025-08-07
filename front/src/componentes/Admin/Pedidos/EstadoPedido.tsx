import axios from "axios";
import { useEffect, useState } from "react";
import { EditOutlined } from "@ant-design/icons";
import { Pedido, EstadoPedido } from "types/types";
import { Table, Select, Button, Tag, message, Modal, Typography, Space, Card } from "antd";

const { Option } = Select;
const { Title } = Typography;

// Estados disponibles para los pedidos
const ESTADOS_PEDIDO = ["Facturado", "Despachado", "Enviado", "Entregado"];

// Función para obtener color del estado
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

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Obtener todos los pedidos
      const responsePedidos = await axios.get("http://127.0.0.1:8000/pedidos", { headers });
      console.log("Pedidos obtenidos:", responsePedidos.data);

      if (!responsePedidos.data || !Array.isArray(responsePedidos.data)) {
        message.warning("No hay pedidos disponibles");
        setPedidos([]);
        return;
      }

      const responseEstados = await axios.get("http://127.0.0.1:8000/estados_pedido", { headers });
      const todosLosEstados = responseEstados.data || [];
      
      // Crear mapa de último estado por pedido
      const ultimoEstadoPorPedido: { [key: number]: string } = {};
      
      // Agrupar estados por pedido y encontrar el más reciente
      todosLosEstados.forEach((estado: EstadoPedido) => {
        if (!ultimoEstadoPorPedido[estado.id_estado_pedido] || 
            new Date(estado.fecha_actualizada) > new Date(ultimoEstadoPorPedido[estado.id_estado_pedido])) {
          ultimoEstadoPorPedido[estado.id_estado_pedido] = estado.descripcion;
        }
      });

      // Combinar pedidos con sus estados
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

      // Crear nuevo registro en estado_pedido
      await axios.post("http://127.0.0.1:8000/estados_pedido", {
        id_pedido: pedidoSeleccionado.id_pedido,
        descripcion: nuevoEstadoSeleccionado,
        fecha_actualizada: new Date().toISOString().split("T")[0]
      }, { headers });

      message.success(`Estado actualizado a: ${nuevoEstadoSeleccionado}`);
      
      // Actualizar el estado en la tabla local sin recargar todo
      setPedidos(prevPedidos => 
        prevPedidos.map(pedido => 
          pedido.id_pedido === pedidoSeleccionado.id_pedido 
            ? { ...pedido, estado_actual: nuevoEstadoSeleccionado }
            : pedido
        )
      );

      // Cerrar modal
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

  const verHistorialEstados = async (pedido: PedidoConEstado) => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Obtener todos los estados y filtrar por el pedido específico
      const response = await axios.get("http://127.0.0.1:8000/estados_pedido", { headers });
      const todosLosEstados = response.data || [];
      
      // Filtrar estados del pedido específico
      const estadosPedido = todosLosEstados.filter(
        (estado: EstadoPedido) => estado.id_estado_pedido === pedido.id_pedido
      );

      setPedidoSeleccionado(pedido);

    } catch (error: any) {
      console.error("Error al cargar historial:", error);
      message.error("Error al cargar el historial de estados");
    }
  };

  const columns = [
    {
      title: "N° Pedido",
      dataIndex: "numero_pedido",
      key: "numero_pedido",
      width: 120,
    },
    {
      title: "Cliente",
      key: "cliente",
      width: 200,
      render: (record: PedidoConEstado) => 
        record.cliente?.nombre || record.cod_cliente || "Sin cliente",
    },
    {
      title: "Fecha",
      dataIndex: "fecha_pedido",
      key: "fecha_pedido", 
      width: 120,
      render: (fecha: string) => 
        fecha ? new Date(fecha).toLocaleDateString() : "-",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 100,
      render: (total: number) => `${total?.toFixed(2) || '0.00'}`,
    },
    {
      title: "Estado Actual",
      dataIndex: "estado_actual",
      key: "estado_actual",
      width: 130,
      render: (estado: string) => (
        <Tag color={getColorEstado(estado)}>
          {estado || "Sin estado"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 120,
      render: (_: any, record: PedidoConEstado) => (
        <Button 
          icon={<EditOutlined />}
          size="small"
          onClick={() => abrirModalEditar(record)}
        >
          Editar Estado
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            Estados de Pedidos
          </Title>
          <span>Total: {pedidos.length} pedidos</span>
        </div>

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
      </Card>

      {/* Modal para editar estado */}
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
          <p><strong>Cliente:</strong> {pedidoSeleccionado?.cliente?.nombre || pedidoSeleccionado?.cod_cliente}</p>
          <p><strong>Total:</strong> ${pedidoSeleccionado?.total?.toFixed(2) || '0.00'}</p>
          <p><strong>Estado Actual:</strong> 
            <Tag color={getColorEstado(pedidoSeleccionado?.estado_actual || "")} style={{ marginLeft: 8 }}>
              {pedidoSeleccionado?.estado_actual || "Sin estado"}
            </Tag>
          </p>
        </div>

        <div>
          <p style={{ marginBottom: 8 }}><strong>Nuevo Estado:</strong></p>
          <Select
            placeholder="Seleccionar nuevo estado"
            style={{ width: '100%' }}
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