import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Cliente, Pedido, DetallePedido, Producto } from "types/types";
import { Button, Form, InputNumber, Select, DatePicker, message, Space, Typography } from "antd";

const { Text } = Typography;

interface FormCrearPedidoProps {
  onCancel: () => void;
  onSubmit: () => void;
  clientes: Cliente[];
  pedidoEditar?: Pedido | null;
}

const FormCrearPedido = ({ onCancel, onSubmit, clientes, pedidoEditar }: FormCrearPedidoProps) => {
  const [form] = Form.useForm();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [tipoCliente, setTipoCliente] = useState<"natural" | "juridico" | null>(null);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/productos").then(res => setProductos(res.data));
  }, []);

  useEffect(() => {
    if (pedidoEditar) {
      form.setFieldsValue({
        ...pedidoEditar,
        fecha_pedido: dayjs(pedidoEditar.fecha_pedido),
        cod_cliente: pedidoEditar.cod_cliente,
      });
      const cliente = clientes.find(c => c.cod_cliente === pedidoEditar.cod_cliente);
      setTipoCliente(cliente?.tipo_cliente === "juridico" ? "juridico" : "natural");
      setDetalles(pedidoEditar.detalles || []);
    } else {
      form.resetFields();
      setDetalles([]);
      setTipoCliente(null);
    }
  }, [pedidoEditar, clientes, form]);

  const onClienteChange = (cod_cliente: string) => {
    form.setFieldsValue({ cod_cliente });
    const cliente = clientes.find(c => c.cod_cliente === cod_cliente);
    const nuevoTipo = cliente?.tipo_cliente === "juridico" ? "juridico" : "natural";
    setTipoCliente(nuevoTipo);

    // actualizar precios segun tipo cliente
    const nuevosDetalles = detalles.map(d => {
      const producto = productos.find(p => p.id_producto === d.id_producto);
      if (!producto) return d;
      const precioUnitario = nuevoTipo === "juridico" ? producto.precio_mayorista : producto.precio_minorista;
      const subtotal_lineal = d.cantidad * precioUnitario;
      const subtotal = subtotal_lineal - d.descuento;
      return { ...d, precio_unitario: precioUnitario, subtotal_lineal, subtotal };
    });
    setDetalles(nuevosDetalles);
  };

  const agregarDetalle = () => {
    if (productos.length === 0) return;
    const precioInicial = tipoCliente === "juridico" ? productos[0].precio_mayorista : productos[0].precio_minorista;
    setDetalles([...detalles, {
      id_detalle_pedido: Date.now(),
      id_pedido: 0,
      id_producto: productos[0].id_producto,
      cantidad: 1,
      descuento: 0,
      precio_unitario: precioInicial,
      subtotal_lineal: precioInicial * 1,
      subtotal: precioInicial * 1,
    }]);
  };

  const actualizarDetalle = (index: number, campo: string, valor: any) => {
    const nuevos = [...detalles];
    if (campo === "id_producto") {
      const producto = productos.find(p => p.id_producto === valor);
      if (producto) {
        const precioUnitario = tipoCliente === "juridico" ? producto.precio_mayorista : producto.precio_minorista;
        nuevos[index].precio_unitario = precioUnitario;
        nuevos[index].id_producto = valor;
      }
    } else {
      nuevos[index][campo as keyof DetallePedido] = valor;
    }
    nuevos[index].subtotal_lineal = nuevos[index].cantidad * nuevos[index].precio_unitario;
    nuevos[index].subtotal = nuevos[index].subtotal_lineal - nuevos[index].descuento;
    setDetalles(nuevos);
  };

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const subtotalGeneral = detalles.reduce((acc, d) => acc + d.subtotal, 0);
  const ivaGeneral = detalles.reduce((acc, d) => acc + d.subtotal * 0.12, 0);
  const totalGeneral = subtotalGeneral + ivaGeneral;

  const handleFinish = async (values: any) => {
    const data: Pedido = {
      ...values,
      fecha_pedido: values.fecha_pedido.format("YYYY-MM-DD"),
      numero_pedido: values.numero_pedido || `PED-${Date.now()}`,
      estado: pedidoEditar ? values.estado : "Nuevo",
      estado_entrega: "Pendiente",
      subtotal: subtotalGeneral,
      iva: ivaGeneral,
      total: totalGeneral,
    };

    try {
      if (pedidoEditar) {
        await axios.put(`http://127.0.0.1:8000/pedidos/${pedidoEditar.id_pedido}`, { ...data, detalles });
        message.success("Pedido actualizado");
      } else {
        await axios.post("http://127.0.0.1:8000/pedidos", { ...data, detalle_pedido: detalles });
        message.success("Pedido creado");
      }
      onSubmit();
    } catch (error) {
      console.error(error);
      message.error("Error al guardar pedido");
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={handleFinish} style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <Form.Item name="cod_cliente" label="Cliente" rules={[{ required: true }]}>
        <Select
          options={clientes.map(c => ({ value: c.cod_cliente, label: c.nombre }))}
          onChange={onClienteChange}
          placeholder="Seleccione un cliente"
        />
      </Form.Item>

      <Form.Item name="fecha_pedido" label="Fecha" rules={[{ required: true }]}>
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="estado" label="Estado" initialValue="Nuevo">
        <Select
          options={[
            { value: "Nuevo", label: "Nuevo" },
            { value: "Procesado", label: "Procesado" },
            { value: "Enviado", label: "Enviado" },
          ]}
        />
      </Form.Item>
      {/* <Form.Item name="id_ruta_venta" label="Ruta de Venta" rules={[{ required: true }]}>
        <InputNumber min={1} style={{ width: "100%" }} placeholder="ID de ruta de venta" />
      </Form.Item>

      <Form.Item name="id_ruta_entrega" label="Ruta de Entrega" rules={[{ required: true }]}>
        <InputNumber min={1} style={{ width: "100%" }} placeholder="ID de ruta de entrega" />
      </Form.Item> */}

      <h4>Detalles</h4>
      <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12, paddingRight: 8 }}>
        {detalles.map((detalle, index) => (
          <Space
            key={detalle.id_detalle_pedido}
            style={{ display: "flex", marginBottom: 8, flexWrap: "wrap", gap: 8 }}
            align="center"
          >
            <Select
              value={detalle.id_producto}
              onChange={value => actualizarDetalle(index, "id_producto", value)}
              options={productos.map(p => ({ value: p.id_producto, label: p.nombre }))}
              style={{ width: 200, minWidth: 150 }}
              placeholder="Producto"
            />
            <InputNumber
              placeholder="Cantidad"
              value={detalle.cantidad}
              min={1}
              onChange={value => actualizarDetalle(index, "cantidad", value)}
              style={{ width: 100, minWidth: 80 }}
            />
            <InputNumber
              placeholder="Precio Unitario"
              value={detalle.precio_unitario}
              min={0}
              onChange={value => actualizarDetalle(index, "precio_unitario", value)}
              style={{ width: 120, minWidth: 100 }}
            />
            <InputNumber
              placeholder="Descuento"
              value={detalle.descuento}
              min={0}
              onChange={value => actualizarDetalle(index, "descuento", value)}
              style={{ width: 120, minWidth: 100 }}
            />
            <Text style={{ minWidth: 100 }}>
              Total: ${detalle.subtotal.toFixed(2)}
            </Text>
            <Text style={{ minWidth: 100 }}>
              IVA: ${(detalle.subtotal * 0.12).toFixed(2)}
            </Text>
            <Button danger onClick={() => eliminarDetalle(index)}>
              X
            </Button>
          </Space>
        ))}
      </div>
      <Button type="dashed" onClick={agregarDetalle} style={{ marginBottom: 16 }}>
        Agregar Producto
      </Button>

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Text strong>Subtotal: ${subtotalGeneral.toFixed(2)}</Text>
        <br />
        <Text strong>IVA (12%): ${ivaGeneral.toFixed(2)}</Text>
        <br />
        <Text strong>Total: ${totalGeneral.toFixed(2)}</Text>
      </div>

      <Form.Item style={{ marginTop: 16 }}>
        <Space>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button type="primary" htmlType="submit">
            {pedidoEditar ? "Actualizar" : "Guardar"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FormCrearPedido;
