import { useState } from "react";
import { Button, Modal, Form, Input, Select, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MapaClientes from "./MapaClientes";

const { Option } = Select;

const rutasSimuladas = [
  {
    id_ruta: 1,
    sector: "Centro",
    direccion: "Av. Bolívar y Sucre",
    tipo_ruta: "Venta",
    estado: "Planificada",
    fecha_creacion: "2025-07-25",
  },
  {
    id_ruta: 2,
    sector: "Norte",
    direccion: "Av. Amazonas y Colón",
    tipo_ruta: "Entrega",
    estado: "En ejecución",
    fecha_creacion: "2025-07-26",
  },
];

export default function Rutas() {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [rutas, setRutas] = useState(rutasSimuladas);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);


  const handleCreate = () => {
    form.validateFields().then(values => {
      const nuevaRuta = {
        id_ruta: rutas.length + 1,
        ...values,
        estado: "Planificada",
        fecha_creacion: new Date().toISOString().slice(0, 10),
      };
      setRutas(prev => [...prev, nuevaRuta]);
      form.resetFields();
      setModalVisible(false);
    });
  };

  const columns = [
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "Dirección", dataIndex: "direccion", key: "direccion" },
    { title: "Tipo de Ruta", dataIndex: "tipo_ruta", key: "tipo_ruta" },
    { title: "Estado", dataIndex: "estado", key: "estado", render: (estado: string) => (
      <Tag color={estado === "En ejecución" ? "green" : "blue"}>{estado}</Tag>
    )},
    { title: "Fecha de creación", dataIndex: "fecha_creacion", key: "fecha_creacion" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gestión de Rutas</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Crear Ruta
        </Button>
      </div>

      <Table dataSource={rutas} columns={columns} rowKey="id_ruta" />

      <Modal
        title="Crear Nueva Ruta"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleCreate}
        okText="Crear"
>
        <Form form={form} layout="vertical">
          <Form.Item label="Ruta">
            <Select
              placeholder="Seleccione una ruta"
              onChange={(value) => setRutaSeleccionada(value)}
              allowClear
              style={{ minWidth: 200 }}
            >
              {rutas.map((ruta) => (
            <Select.Option key={ruta.id_ruta} value={ruta.sector}>
              {ruta.sector} - {ruta.tipo_ruta}
            </Select.Option>
            ))}
            </Select>
          </Form.Item>
          <Form.Item name="sector" label="Sector" rules={[{ required: true }]}>
            <Input placeholder="Ej. Sur, Centro, Norte" />
          </Form.Item>
          <Form.Item name="direccion" label="Dirección" rules={[{ required: true }]}>
            <Input placeholder="Dirección principal" />
          </Form.Item>
          <Form.Item name="tipo_ruta" label="Tipo de Ruta" rules={[{ required: true }]}>
            <Select placeholder="Seleccione tipo de ruta">
              <Option value="Venta">Venta</Option>
              <Option value="Entrega">Entrega</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <div className="mt-8">
  <h3 className="text-lg font-semibold mb-2">Clientes en el Mapa</h3>
  <MapaClientes sectorSeleccionado={rutaSeleccionada} />
</div>
    </div>
  );
}

