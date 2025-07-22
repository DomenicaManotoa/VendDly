// src/components/Pedidos.tsx
import { useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Modal,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import FormCrearPedido from "./Form";
import { SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface Pedido {
  id_pedido: number;
  numero_pedido: string;
  fecha_pedido: string;
  cliente: string;
  estado: string;
  subtotal: number;
  iva: number;
  total: number;
}

interface DetallePedido {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

const pedidosMock: Pedido[] = [
  {
    id_pedido: 1,
    numero_pedido: "PED-001",
    fecha_pedido: "2025-07-21",
    cliente: "Juan Pérez",
    estado: "Pendiente",
    subtotal: 100.0,
    iva: 12.0,
    total: 112.0,
  },
  {
    id_pedido: 2,
    numero_pedido: "PED-002",
    fecha_pedido: "2025-07-20",
    cliente: "Ana López",
    estado: "Enviado",
    subtotal: 200.0,
    iva: 24.0,
    total: 224.0,
  },
];

const detallesMock: Record<number, DetallePedido[]> = {
  1: [
    {
      id_producto: 101,
      nombre_producto: "Jabón líquido",
      cantidad: 2,
      precio_unitario: 25,
      subtotal: 50,
    },
    {
      id_producto: 102,
      nombre_producto: "Shampoo",
      cantidad: 2,
      precio_unitario: 25,
      subtotal: 50,
    },
  ],
  2: [
    {
      id_producto: 103,
      nombre_producto: "Papel higiénico",
      cantidad: 5,
      precio_unitario: 20,
      subtotal: 100,
    },
    {
      id_producto: 104,
      nombre_producto: "Detergente",
      cantidad: 5,
      precio_unitario: 20,
      subtotal: 100,
    },
  ],
};

const Pedidos = () => {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(false);
  const [abrirCrear, setAbrirCrear] = useState(false);
  const [detalleActual, setDetalleActual] = useState<DetallePedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);

  const filteredPedidos = pedidosMock.filter((pedido) =>
    pedido.cliente.toLowerCase().includes(search.toLowerCase()) ||
    pedido.numero_pedido.toLowerCase().includes(search.toLowerCase())
  );

  const abrirDetalle = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setDetalleActual(detallesMock[pedido.id_pedido] || []);
    setVisible(true);
  };

  const columnasDetalle: ColumnsType<DetallePedido> = [
    {
      title: "Producto",
      dataIndex: "nombre_producto",
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
    },
    {
      title: "Precio Unitario",
      dataIndex: "precio_unitario",
      render: (val) => `$${val.toFixed(2)}`,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      render: (val) => `$${val.toFixed(2)}`,
    },
  ];

  const columns: ColumnsType<Pedido> = [
    {
      title: "Número",
      dataIndex: "numero_pedido",
    },
    {
      title: "Fecha",
      dataIndex: "fecha_pedido",
    },
    {
      title: "Cliente",
      dataIndex: "cliente",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (estado) => {
        let color = "default";
        if (estado === "Pendiente") color = "orange";
        else if (estado === "Enviado") color = "blue";
        else if (estado === "Entregado") color = "green";
        return <Tag color={color}>{estado}</Tag>;
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      render: (val) => `$${val.toFixed(2)}`,
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <Button onClick={() => abrirDetalle(record)}>Ver detalle</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={1}>Gestión de Pedidos</Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Input
            placeholder="Buscar por cliente o número de pedido"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            />
            <Button 
            type="primary" onClick={() => setAbrirCrear(true)}>
              Crear pedido
            </Button>
        </div>


        <Table
          columns={columns}
          dataSource={filteredPedidos}
          rowKey="id_pedido"
          pagination={{ pageSize: 5 }}
        />

        <Modal
          open={visible}
          title={`Detalle del pedido ${pedidoSeleccionado?.numero_pedido}`}
          footer={null}
          onCancel={() => setVisible(false)}
          width={700}
        >
          <Table
            dataSource={detalleActual}
            columns={columnasDetalle}
            rowKey="id_producto"
            pagination={false}
          />
        </Modal>
        <Modal
          open={abrirCrear}
          title="Crear nuevo pedido"
          onCancel={() => setAbrirCrear(false)}
          footer={null}
          width={800}
        >
          <FormCrearPedido onClose={() => setAbrirCrear(false)} />
        </Modal>
      </Space>
    </div>
  );
};

export default Pedidos;


