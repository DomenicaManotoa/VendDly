import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Input, Select, Table, Tag, message, Card, Space, Popconfirm, DatePicker, Checkbox } from "antd";
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined, UserOutlined, CarOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import MapaClientes from "./MapaClientes";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { rutaService } from "./rutaService";
import { UbicacionCliente, Ruta, AsignacionRuta, CrearRutaData, UsuarioConRol } from "../../../types/types";
import { usuarioService } from "./usuarioService"; // Ajustar ruta según donde lo pongas
import dayjs from 'dayjs';
import axios from 'axios';

const { Option } = Select;

export default function Rutas() {
  const [rutas, setRutas] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAsignacionVisible, setModalAsignacionVisible] = useState(false);
  const [form] = Form.useForm();
  const [formAsignacion] = Form.useForm();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);
  const [rutaParaAsignar, setRutaParaAsignar] = useState<Ruta | null>(null);
  const [ubicacionesClientes, setUbicacionesClientes] = useState<UbicacionCliente[]>([]);
  const [ubicacionesSeleccionadas, setUbicacionesSeleccionadas] = useState<number[]>([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | null>(null);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<UsuarioConRol[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);


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
      const rutasData = await rutaService.getRutas();
      setRutas(rutasData);
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      message.error('Error al cargar las rutas');
    } finally {
      setLoadingRutas(false);
    }
  };

  const handleCreateEdit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRuta) {
        // Actualizar ruta existente
        const rutaActualizada = await rutaService.updateRuta(editingRuta.id_ruta, values);
        setRutas(prev => prev.map(ruta => 
          ruta.id_ruta === editingRuta.id_ruta ? rutaActualizada : ruta
        ));
        message.success('Ruta actualizada correctamente');
      } else {
        // Crear nueva ruta
        const nuevaRutaData: CrearRutaData = {
          nombre: values.nombre,
          tipo_ruta: values.tipo_ruta,
          sector: values.sector,
          direccion: values.direccion,
          fecha_ejecucion: values.fecha_ejecucion ? values.fecha_ejecucion.format('YYYY-MM-DD') : undefined
        };
        
        const nuevaRuta = await rutaService.createRuta(nuevaRutaData);
        setRutas(prev => [...prev, nuevaRuta]);
        message.success('Ruta creada correctamente');
      }
      
      form.resetFields();
      setModalVisible(false);
      setEditingRuta(null);
    } catch (error) {
      console.error('Error al crear/actualizar ruta:', error);
      message.error('Error al procesar la ruta');
    }
  };

  const handleEdit = (ruta: Ruta) => {
    setEditingRuta(ruta);
    form.setFieldsValue({
      nombre: ruta.nombre,
      sector: ruta.sector,
      direccion: ruta.direccion,
      tipo_ruta: ruta.tipo_ruta,
      fecha_ejecucion: ruta.fecha_ejecucion ? dayjs(ruta.fecha_ejecucion) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (rutaId: number) => {
    try {
      await rutaService.deleteRuta(rutaId);
      setRutas(prev => prev.filter(ruta => ruta.id_ruta !== rutaId));
      message.success('Ruta eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar ruta:', error);
      message.error('Error al eliminar la ruta');
    }
  };

  const handleCreate = () => {
    setEditingRuta(null);
    form.resetFields();
    setModalVisible(true);
  };

// Modificar la función handleAsignarUbicaciones
const handleAsignarUbicaciones = async (ruta: Ruta) => {
  setRutaParaAsignar(ruta);
  setUbicacionesSeleccionadas([]);
  formAsignacion.resetFields();
  
  // Cargar usuarios según el tipo de ruta - USAR rutaService
  setLoadingUsuarios(true);
  try {
    const rolRequerido = ruta.tipo_ruta === 'venta' ? 'Vendedor' : 'Transportista';
    const usuarios = await rutaService.getUsuariosPorRol(rolRequerido); // Cambio aquí
    setUsuariosDisponibles(usuarios);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    message.error('Error al cargar usuarios disponibles');
    setUsuariosDisponibles([]);
  } finally {
    setLoadingUsuarios(false);
  }
  
  setModalAsignacionVisible(true);
};

  const handleConfirmarAsignacion = async () => {
    try {
      const values = await formAsignacion.validateFields();
      
      if (ubicacionesSeleccionadas.length === 0) {
        message.warning('Debe seleccionar al menos una ubicación');
        return;
      }

      const asignaciones: Omit<AsignacionRuta, 'id_asignacion' | 'ubicacion_info'>[] = 
        ubicacionesSeleccionadas.map((idUbicacion, index) => {
          const ubicacion = ubicacionesClientes.find(u => u.id_ubicacion === idUbicacion);
          return {
            identificacion_usuario: values.identificacion_usuario,
            tipo_usuario: values.tipo_usuario,
            cod_cliente: ubicacion?.cod_cliente || '',
            id_ubicacion: idUbicacion,
            orden_visita: index + 1
          };
        });

      if (rutaParaAsignar) {
        const rutaActualizada = await rutaService.updateRuta(rutaParaAsignar.id_ruta, {
          asignaciones
        });
        
        // CAMBIO CLAVE: Recargar todas las rutas para actualizar la tabla
        await cargarRutas();
        
        message.success(`Ruta asignada correctamente a ${values.identificacion_usuario}`);
        setModalAsignacionVisible(false);
        setRutaParaAsignar(null);
        setUbicacionesSeleccionadas([]);
        setUsuariosDisponibles([]);
        formAsignacion.resetFields();
      }
    } catch (error: any) {
      console.error('Error al asignar ubicaciones:', error);
      const errorMessage = error.response?.data?.detail || 'Error al asignar ubicaciones a la ruta';
      message.error(errorMessage);
    }
  };

  // Obtener sectores únicos de las ubicaciones reales de clientes
  const sectoresDisponibles = Array.from(new Set(ubicacionesClientes.map(u => u.sector)));

  // Filtrar ubicaciones por sector seleccionado
  const ubicacionesFiltradas = rutaSeleccionada
    ? ubicacionesClientes.filter(u => u.sector === rutaSeleccionada)
    : ubicacionesClientes;

  // Obtener ubicaciones del sector de la ruta para asignar
  const ubicacionesParaAsignar = rutaParaAsignar
    ? ubicacionesClientes.filter(u => u.sector === rutaParaAsignar.sector)
    : [];

  const columns: ColumnsType<Ruta> = [
    { 
      title: "Nombre", 
      dataIndex: "nombre", 
      key: "nombre",
      ellipsis: true
    },
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
                {clientesEnSector} ubicación{clientesEnSector !== 1 ? 'es' : ''}
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
        <Tag color={estado === "En ejecución" ? "green" : "blue"}>{estado}</Tag>
      ),
    },
    { 
      title: "Fecha de ejecución", 
      dataIndex: "fecha_ejecucion", 
      key: "fecha_ejecucion",
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-'
    },
    { 
      title: "Usuario Asignado", 
      key: "usuario_asignado",
      render: (_: any, record: Ruta) => {
        if (!record.asignaciones || record.asignaciones.length === 0) {
          return <span className="text-gray-400">Sin asignar</span>;
        }
        
        // Obtener el primer usuario asignado (puede haber múltiples)
        const primeraAsignacion = record.asignaciones[0];
        return (
          <div>
            <div className="font-medium">
              {primeraAsignacion.identificacion_usuario}
            </div>
            <div className="text-sm text-gray-500">
              {primeraAsignacion.usuario?.nombre || 'Nombre no disponible'}
            </div>
            <div className="text-xs text-blue-600">
              {primeraAsignacion.tipo_usuario}
            </div>
            {record.asignaciones.length > 1 && (
              <div className="text-xs text-gray-400">
                +{record.asignaciones.length - 1} más
              </div>
            )}
          </div>
        );
      }
    },
    
    { 
      title: "Asignaciones", 
      key: "asignaciones",
      render: (_: any, record: Ruta) => (
        <div className="text-center">
          {record.asignaciones?.length || 0}
        </div>
      )
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 200,
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
            icon={<UserOutlined />}
            onClick={() => handleAsignarUbicaciones(record)}
            title="Asignar Ubicaciones"
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
                Total de rutas: {rutas.length} • Total de ubicaciones: {ubicacionesClientes.length}
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

        {/* Modal para crear/editar ruta */}
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
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              name="nombre" 
              label="Nombre de la Ruta" 
              rules={[{ required: true, message: 'Por favor ingrese el nombre de la ruta' }]}
            >
              <Input placeholder="Ej: Ruta Centro Mañana" />
            </Form.Item>

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
                      {sector} ({clientesEnSector} ubicación{clientesEnSector !== 1 ? 'es' : ''})
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

            <Form.Item 
              name="fecha_ejecucion" 
              label="Fecha de Ejecución (Opcional)"
            >
              <DatePicker 
                style={{ width: '100%' }}
                placeholder="Seleccione fecha de ejecución"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal para asignar ubicaciones */}
        <Modal
          title={`Asignar Ubicaciones - ${rutaParaAsignar?.nombre}`}
          open={modalAsignacionVisible}
          onCancel={() => {
            setModalAsignacionVisible(false);
            setRutaParaAsignar(null);
            setUbicacionesSeleccionadas([]);
            formAsignacion.resetFields();
          }}
          onOk={handleConfirmarAsignacion}
          okText="Asignar Ubicaciones"
          cancelText="Cancelar"
          width={800}
        >
          <Form form={formAsignacion} layout="vertical">
            <Form.Item 
              name="identificacion_usuario" 
              label="Usuario" 
              rules={[{ required: true, message: 'Por favor seleccione un usuario' }]}
            >
              <Select 
                placeholder="Seleccione un usuario"
                loading={loadingUsuarios}
                showSearch
                filterOption={(input, option) => {
                  if (!option?.children) return false;
                  return option.children.toString().toLowerCase().includes(input.toLowerCase());
                }}
                onChange={(value) => {
                  const usuarioSeleccionado = usuariosDisponibles.find(u => u.identificacion === value);
                  if (usuarioSeleccionado) {
                    const tipoUsuario = rutaParaAsignar?.tipo_ruta === 'venta' ? 'vendedor' : 'transportista';
                    formAsignacion.setFieldsValue({
                      tipo_usuario: tipoUsuario
                    });
                  }
                }}
              >
                {usuariosDisponibles.map((usuario) => (
                  <Option key={usuario.identificacion} value={usuario.identificacion}>
                    <div>
                      <div className="font-medium">{usuario.identificacion}</div>
                      <div className="text-sm text-gray-500">{usuario.nombre}</div>
                      <div className="text-xs text-blue-600">
                        {typeof usuario.rol === 'object' ? usuario.rol.descripcion : usuario.rol}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              name="tipo_usuario" 
              label="Tipo de Usuario" 
              rules={[{ required: true, message: 'Por favor seleccione el tipo de usuario' }]}
            >
              <Select 
                placeholder="Seleccione tipo de usuario"
                onChange={(value) => {
                  // Validar que el tipo coincida con el tipo de ruta
                  const tipoEsperado = rutaParaAsignar?.tipo_ruta === 'venta' ? 'vendedor' : 'transportista';
                  if (value !== tipoEsperado) {
                    message.warning(`Para rutas de ${rutaParaAsignar?.tipo_ruta} debe seleccionar "${tipoEsperado}"`);
                  }
                }}
              >
                <Option 
                  value="vendedor" 
                  disabled={rutaParaAsignar?.tipo_ruta !== 'venta'}
                >
                  <UserOutlined /> Vendedor {rutaParaAsignar?.tipo_ruta !== 'venta' && '(Solo para rutas de venta)'}
                </Option>
                <Option 
                  value="transportista"
                  disabled={rutaParaAsignar?.tipo_ruta !== 'entrega'}
                >
                  <CarOutlined /> Transportista {rutaParaAsignar?.tipo_ruta !== 'entrega' && '(Solo para rutas de entrega)'}
                </Option>
              </Select>
            </Form.Item>
          </Form>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">
              Ubicaciones Disponibles en {rutaParaAsignar?.sector} ({ubicacionesParaAsignar.length})
            </h4>
            <div className="max-h-60 overflow-y-auto">
              {ubicacionesParaAsignar.map((ubicacion) => (
                <div key={ubicacion.id_ubicacion} className="border rounded p-3 mb-2">
                  <Checkbox
                    checked={ubicacionesSeleccionadas.includes(ubicacion.id_ubicacion!)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setUbicacionesSeleccionadas(prev => [...prev, ubicacion.id_ubicacion!]);
                      } else {
                        setUbicacionesSeleccionadas(prev => 
                          prev.filter(id => id !== ubicacion.id_ubicacion)
                        );
                      }
                    }}
                  >
                    <div className="ml-2">
                      <div className="font-medium">Cliente: {ubicacion.cod_cliente}</div>
                      <div className="text-sm text-gray-600">{ubicacion.direccion}</div>
                      {ubicacion.referencia && (
                        <div className="text-xs text-gray-500">{ubicacion.referencia}</div>
                      )}
                    </div>
                  </Checkbox>
                </div>
              ))}
            </div>
            
            {ubicacionesSeleccionadas.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <div className="text-sm text-blue-600">
                  Seleccionadas: {ubicacionesSeleccionadas.length} ubicación{ubicacionesSeleccionadas.length !== 1 ? 'es' : ''}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </Card>

      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Mapa de Ubicaciones
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
              rutaSeleccionada={rutas.find(r => r.sector === rutaSeleccionada) || null}
              mostrarRuta={!!rutaSeleccionada}
            />
          </>
        )}
      </Card>
    </div>
  );
}
