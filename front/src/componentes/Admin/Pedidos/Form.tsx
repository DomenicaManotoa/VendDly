import { useState } from "react";
import {
  Button,
  InputNumber,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;
const { Title } = Typography;

interface Producto {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
}

interface ItemPedido {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

const productosMock: Producto[] = [
  { id_producto: 1, nombre: "Jabón", precio_unitario: 5 },
  { id_producto: 2, nombre: "Shampoo", precio_unitario: 8 },
  { id_producto: 3, nombre: "Detergente", precio_unitario: 10 },
];

const clientesMock = [
  { cod_cliente: "CL001", nombre: "Juan Pérez" },
  { cod_cliente: "CL002", nombre: "Ana López" },
];

const FormCrearPedido = ({ onClose }: { onClose: () => void }) => {
  const [cliente, setCliente] = useState<string | undefined>();
  const [producto, setProducto] = useState<number>();
  const [cantidad, setCantidad] = useState<number>(1);
  const [items, setItems] = useState<ItemPedido[]>([]);

  const agregarItem = () => {
    const prod = productosMock.find((p) => p.id_producto === producto);
    if (!prod || cantidad <= 0) return;

    const nuevoItem: ItemPedido = {
      id_producto: prod.id_producto,
      nombre: prod.nombre,
      cantidad,
      precio_unitario: prod.precio_unitario,
      subtotal: cantidad * prod.precio_unitario,
    };

    setItems((prev) => [...prev, nuevoItem]);
    setCantidad(1);
  };

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const iva = subtotal * 0.12;
  const total = subtotal + iva;

  const guardarPedido = () => {
    if (!cliente || items.length === 0) {
      message.error("Seleccione un cliente y al menos un producto");
      return;
    }

    // Aquí podrías enviar con axios los datos del pedido
    message.success("Pedido creado con éxito");
    onClose();
  };

  const columns: ColumnsType<ItemPedido> = [
    { title: "Producto", dataIndex: "nombre" },
    { title: "Cantidad", dataIndex: "cantidad" },
    {
      title: "Precio",
      dataIndex: "precio_unitario",
      render: (val) => `$${val.toFixed(2)}`,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      render: (val) => `$${val.toFixed(2)}`,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Title level={5}>Datos del pedido</Title>

      <Select
        placeholder="Seleccionar cliente"
        onChange={(value) => setCliente(value)}
        value={cliente}
        style={{ width: "100%" }}
      >
        {clientesMock.map((c) => (
          <Option key={c.cod_cliente} value={c.cod_cliente}>
            {c.nombre}
          </Option>
        ))}
      </Select>

      <Space>
        <Select
          placeholder="Seleccionar producto"
          onChange={(value) => setProducto(value)}
          value={producto}
          style={{ width: 200 }}
        >
          {productosMock.map((p) => (
            <Option key={p.id_producto} value={p.id_producto}>
              {p.nombre}
            </Option>
          ))}
        </Select>
        <InputNumber
          min={1}
          value={cantidad}
          onChange={(val) => setCantidad(val || 1)}
        />
        <Button onClick={agregarItem}>Agregar</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={items}
        rowKey="id_producto"
        pagination={false}
      />

      <Space style={{ justifyContent: "flex-end", width: "100%" }}>
        <div>Subtotal: ${subtotal.toFixed(2)}</div>
        <div>IVA (12%): ${iva.toFixed(2)}</div>
        <div><strong>Total: ${total.toFixed(2)}</strong></div>
      </Space>

      <Button type="primary" onClick={guardarPedido}>
        Guardar pedido
      </Button>
    </Space>
  );
};

export default FormCrearPedido;
