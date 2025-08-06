import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Input, Select, Table, Tag, message, Card, Space, Popconfirm } from "antd";
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import MapaClientes from "./MapaClientes";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { UbicacionCliente, Ruta } from "../../../types/types";

const { Option } = Select;

export default function Rutas() {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);
  const [ubicacionesClientes, setUbicacionesClientes] = useState<UbicacionCliente[]>([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | null>(null);

  useEffect(() => {
    cargarUbicacionesClientes();
    cargarRutas();
  }, []);

  const cargarUbicacionesClientes = async () => {
    setLoadingUbicaciones(true);
    try {
      const ubicaciones = await ubicacionClienteService.getUbicaciones();
      setUbicacionesClientes(ubicaciones);
    } catch (error) {
      console.error('Error al cargar ubicaciones de clientes:', error);
      message.error('Error al cargar las ubicaciones de clientes');
    } finally {
      setLoadingUbicaciones(false);
    }
  };

  const cargarRutas = async () => {
    setLoadingRutas(true);
    try {
      // Aquí deberías implementar el servicio de rutas
      // const rutasData = await rutaService.getRutas();
      // setRutas(rutasData);
      
      // Por ahora iniciamos con array vacío hasta que implementes el servicio
      setRutas([]);
      
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      message.error('Error al cargar las rutas');
    } finally {
      setLoadingRutas(false);
    }
  };

  const handleCreateEdit = () => {
    form.validateFields().then((values: any) => {
      if (editingRuta) {
        // Actualizar ruta existente
        const rutasActualizadas = rutas.map(ruta => 
          ruta.id_ruta === editingRuta.id_ruta 
            ? { ...ruta, ...values }
            : ruta
        );
        setRutas(rutasActualizadas);
        message.success('Ruta actualizada correctamente');
      } else {
        // Crear nueva ruta
        const nuevaRuta: Ruta = {
          id_ruta: Date.now(), // ID temporal hasta que tengas el servicio
          sector: values.sector,
          direccion: values.direccion,
          tipo_ruta: values.tipo_ruta,
          estado: "Planificada",
          fecha_creacion: new Date().toISOString().slice(0, 10),
        };
        setRutas(prev => [...prev, nuevaRuta]);
        message.success('Ruta creada correctamente');
      }
      
      form.resetFields();
      setModalVisible(false);
      setEditingRuta(null);
    }).catch(error => {
      console.error('Error de validación:', error);
    });
  };

  const handleEdit = (ruta: Ruta) => {
    setEditingRuta(ruta);
    form.setFieldsValue({
      sector: ruta.sector,
      direccion: ruta.direccion,
      tipo_ruta: ruta.tipo_ruta
    });
    setModalVisible(true);
  };

  const handleDelete = (rutaId: number) => {
    setRutas(prev => prev.filter(ruta => ruta.id_ruta !== rutaId));
    message.success('Ruta eliminada correctamente');
  };

  const handleCreate = () => {
    setEditingRuta(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Obtener sectores únicos de las ubicaciones reales de clientes
  const sectoresDisponibles = Array.from(new Set(ubicacionesClientes.map(u => u.sector)));

  // Filtrar ubicaciones por sector seleccionado
  const ubicacionesFiltradas = rutaSeleccionada
    ? ubicacionesClientes.filter(u => u.sector === rutaSeleccionada)
    : ubicacionesClientes;

  const columns: ColumnsType<Ruta> = [
    { 
      title: "Sector", 
      dataIndex: "sector", 
      key: "sector",
      render: (sector: string) => {
        const clientesEnSector = ubicacionesClientes.filter(u => u.sector === sector).length;
        return (
          <div>
            <Tag color="blue">{sector}</Tag>
            {clientesEnSector > 0 && (
              <div className="text-xs text-gray-500">
                {clientesEnSector} cliente{clientesEnSector !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      }
    },
    { 
      title: "Dirección", 
      dataIndex: "direccion", 
      key: "direccion",
      ellipsis: true
    },
    { 
      title: "Tipo de Ruta", 
      dataIndex: "tipo_ruta", 
      key: "tipo_ruta",
      render: (tipo: string) => (
        <Tag color={tipo === "venta" ? "green" : "orange"}>
          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
        </Tag>
      )
    },
    { 
      title: "Estado", 
      dataIndex: "estado", 
      key: "estado", 
      render: (estado: string) => (
        <Tag color={estado === "En ejecución" ? "green" : "blue"}>
          {estado}
        </Tag>
      )
    },
    { 
      title: "Fecha de creación", 
      dataIndex: "fecha_creacion", 
      key: "fecha_creacion",
      render: (fecha: string) => new Date(fecha).toLocaleDateString('es-ES')
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, record: Ruta) => (
        <Space>
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => setRutaSeleccionada(record.sector)}
            title="Ver en Mapa"
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar"
          />
          <Popconfirm
            title="¿Estás seguro de eliminar esta ruta?"
            onConfirm={() => handleDelete(record.id_ruta)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Gestión de Rutas</h2>
            <p className="text-gray-600">
              Total de ubicaciones de clientes: {ubicacionesClientes.length}
              {sectoresDisponibles.length > 0 && ` • Sectores disponibles: ${sectoresDisponibles.length}`}
            </p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            Crear Ruta
          </Button>
        </div>

        <Table 
          dataSource={rutas} 
          columns={columns} 
          rowKey="id_ruta"
          loading={loadingRutas}
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
          title={editingRuta ? "Editar Ruta" : "Crear Nueva Ruta"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingRuta(null);
            form.resetFields();
          }}
          onOk={handleCreateEdit}
          okText={editingRuta ? "Actualizar" : "Crear"}
          cancelText="Cancelar"
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              name="sector" 
              label="Sector" 
              rules={[{ required: true, message: 'Por favor seleccione un sector' }]}
            >
              <Select 
                placeholder="Seleccione un sector"
                showSearch
                filterOption={(input, option) => {
                  if (!option?.children) return false;
                  return option.children.toString().toLowerCase().includes(input.toLowerCase());
                }}
              >
                {/* Sectores con clientes registrados */}
                {sectoresDisponibles.map((sector) => {
                  const clientesEnSector = ubicacionesClientes.filter(u => u.sector === sector).length;
                  return (
                    <Option key={sector} value={sector}>
                      {sector} ({clientesEnSector} cliente{clientesEnSector !== 1 ? 's' : ''})
                    </Option>
                  );
                })}
                
                {/* Sectores adicionales predefinidos */}
                {['Este', 'Oeste', 'Centro Norte', 'Centro Sur', 'Periferia', 'Industrial', 'Comercial'].map(sector => 
                  !sectoresDisponibles.includes(sector) && (
                    <Option key={sector} value={sector}>
                      {sector}
                    </Option>
                  )
                )}
              </Select>
            </Form.Item>
            
            <Form.Item 
              name="direccion" 
              label="Dirección Principal" 
              rules={[{ required: true, message: 'Por favor ingrese la dirección' }]}
            >
              <Input placeholder="Dirección principal de la ruta" />
            </Form.Item>
            
            <Form.Item 
              name="tipo_ruta" 
              label="Tipo de Ruta" 
              rules={[{ required: true, message: 'Por favor seleccione el tipo de ruta' }]}
            >
              <Select placeholder="Seleccione tipo de ruta">
                <Option value="venta">Venta</Option>
                <Option value="entrega">Entrega</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>

      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Mapa de Clientes
            {rutaSeleccionada && ` - Sector: ${rutaSeleccionada}`}
          </h3>
          
          <div className="flex gap-2">
            <Select
              placeholder="Filtrar por sector"
              allowClear
              style={{ width: 200 }}
              onChange={setRutaSeleccionada}
              value={rutaSeleccionada}
              loading={loadingUbicaciones}
            >
              {sectoresDisponibles.map((sector) => (
                <Option key={sector} value={sector}>
                  {sector}
                </Option>
              ))}
            </Select>
            
            <Button 
              onClick={() => setRutaSeleccionada(null)}
              disabled={!rutaSeleccionada}
            >
              Mostrar Todos
            </Button>
          </div>
        </div>

        {loadingUbicaciones ? (
          <div className="text-center py-8">
            Cargando ubicaciones de clientes...
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              Mostrando {ubicacionesFiltradas.length} de {ubicacionesClientes.length} ubicaciones
              {rutaSeleccionada && ` en el sector ${rutaSeleccionada}`}
            </div>
            
            <MapaClientes 
              sectorSeleccionado={rutaSeleccionada}
              ubicacionesReales={ubicacionesFiltradas}
            />
          </>
        )}
      </Card>
    </div>
  );
}