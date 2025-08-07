import { useEffect, useState } from "react";
import { Button, Modal, Form, Input, Select, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MapaClientes from "./MapaClientes";
const { Option } = Select;

export default function Rutas() {
  const [rutas, setRutas] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8000/rutas", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Rutas desde backend:", data);
        setRutas(Array.isArray(data) ? data : []);
      });
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const nuevaRuta = {
        ...values,
        estado: "Planificada",
        fecha_creacion: new Date().toISOString().slice(0, 10),
        latitud: Number(values.latitud),  // Si pones inputs para lat y lon
        longitud: Number(values.longitud),
      };
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/rutas", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevaRuta),
      });
      if (!response.ok) throw new Error();
      // Recarga rutas
      fetch("http://localhost:8000/rutas", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => setRutas(Array.isArray(data) ? data : []));
      form.resetFields();
      setModalVisible(false);
      message.success("Ruta creada correctamente");
    } catch (error) {
      message.error("No se pudo crear la ruta");
    }
  };

  const columns = [
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "Dirección", dataIndex: "direccion", key: "direccion" },
    { title: "Tipo de Ruta", dataIndex: "tipo_ruta", key: "tipo_ruta" },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: string) => (
        <Tag color={estado === "En ejecución" ? "green" : "blue"}>{estado}</Tag>
      ),
    },
    { title: "Fecha de creación", dataIndex: "fecha_creacion", key: "fecha_creacion" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gestión de Rutas</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Crear Ruta
        </Button>
      </div>

        <Table 
          dataSource={rutas} 
          columns={columns} 
          rowKey="id_ruta"
          loading={!rutas.length}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} rutas`
          }}
          locale={{
            emptyText: 'No hay rutas registradas. Crea tu primera ruta usando el botón "Crear Ruta".'
          }}
        />

      <Modal
        title="Crear Nueva Ruta"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleCreate}
        okText="Crear"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sector"
            label="Sector"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ej. Sur, Centro, Norte" />
          </Form.Item>
          <Form.Item
            name="direccion"
            label="Dirección"
            rules={[{ required: true }]}
          >
            <Input placeholder="Dirección principal" />
          </Form.Item>
          <Form.Item
            name="tipo_ruta"
            label="Tipo de Ruta"
            rules={[{ required: true }]}
          >
            <Select placeholder="Seleccione tipo de ruta">
              <Option value="Venta">Venta</Option>
              <Option value="Entrega">Entrega</Option>
            </Select>
          </Form.Item>
          {/* Opcional: campos para latitud y longitud */}
          <Form.Item
            name="latitud"
            label="Latitud"
            rules={[{ required: true, message: "Ingrese latitud" }]}
          >
            <Input type="number" step="any" placeholder="-0.22985" />
          </Form.Item>
          <Form.Item
            name="longitud"
            label="Longitud"
            rules={[{ required: true, message: "Ingrese longitud" }]}
          >
            <Input type="number" step="any" placeholder="-78.52495" />
          </Form.Item>
        </Form>
      </Modal>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Clientes en el Mapa</h3>
        <Select
          placeholder="Filtrar por sector"
          onChange={(value) => setRutaSeleccionada(value)}
          allowClear
          style={{ width: 300, marginBottom: 16 }}
        >
          {rutas.map((ruta) => (
            <Option key={ruta.id_ruta} value={ruta.sector}>
              {ruta.sector} - {ruta.tipo_ruta}
            </Option>
          ))}
        </Select>

        <MapaClientes
          rutas={rutas.filter(
            (r) => !rutaSeleccionada || r.sector === rutaSeleccionada
          )}
        />
      </div>
    </div>
  );
}
