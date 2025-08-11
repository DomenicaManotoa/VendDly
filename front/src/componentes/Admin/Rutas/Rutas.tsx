import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Input, Select, Table, Tag, message, Card, Space, Popconfirm, DatePicker, Checkbox } from "antd";
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined, UserOutlined, CarOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import MapaClientes from "./MapaClientes";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { rutaService } from "./rutaService";
import { UbicacionCliente, Ruta, AsignacionRuta, CrearRutaData, UsuarioConRol, PedidoRuta } from "../../../types/types";
import { usuarioService } from "./usuarioService";
import dayjs from 'dayjs';
import { ShoppingOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function Rutas() {
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
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<{ [key: string]: number[] }>({});
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [pedidosPorUbicacion, setPedidosPorUbicacion] = useState<{ [key: number]: PedidoRuta[] }>({});
  const [modalPedidoVisible, setModalPedidoVisible] = useState(false);
  const [pedidosDisponibles, setPedidosDisponibles] = useState<PedidoRuta[]>([]);
  const [rutaParaPedido, setRutaParaPedido] = useState<Ruta | null>(null);

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

  const handleAsignarUbicaciones = async (ruta: Ruta) => {
    setRutaParaAsignar(ruta);
    setUbicacionesSeleccionadas([]);
    formAsignacion.resetFields();

    // Cargar usuarios según el tipo de ruta
    setLoadingUsuarios(true);
    try {
      const rolRequerido = ruta.tipo_ruta === 'venta' ? 'Vendedor' : 'Transportista';
      const usuarios = await rutaService.getUsuariosPorRol(rolRequerido);
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
        await rutaService.updateRuta(rutaParaAsignar.id_ruta, {
          asignaciones
        });

        message.success('Ubicaciones asignadas correctamente');
        await cargarRutas();
        setModalAsignacionVisible(false);
        setRutaParaAsignar(null);
        setUbicacionesSeleccionadas([]);
        setUsuariosDisponibles([]);
        formAsignacion.resetFields();
      }
    } catch (error: any) {
      console.error('Error al asignar:', error);
      const errorMessage = error.response?.data?.detail || 'Error al asignar ubicaciones a la ruta';
      message.error(errorMessage);
    }
  };

  // NUEVA función para manejar asignación de pedido:
  const handleAsignarPedido = async (ruta: Ruta) => {
    if (ruta.tipo_ruta !== 'entrega') {
      message.warning('Solo se pueden asignar pedidos a rutas de entrega');
      return;
    }

    setRutaParaPedido(ruta);

    try {
      const pedidos = await rutaService.getPedidosDisponibles();
      setPedidosDisponibles(pedidos);
      setModalPedidoVisible(true);
    } catch (error) {
      message.error('Error al cargar pedidos disponibles');
    }
  };

  const handleConfirmarAsignacionPedido = async (idPedido: number) => {
    if (!rutaParaPedido) {
      message.error('No hay ruta seleccionada');
      return;
    }

    // Verificar si la ruta ya tiene un pedido asignado
    if (rutaParaPedido.pedido_info) {
      message.warning(`La ruta ya tiene el pedido ${rutaParaPedido.pedido_info.numero_pedido} asignado. Primero debe desasignarlo.`);
      return;
    }

    try {
      console.log('Iniciando asignación de pedido:', {
        idPedido,
        rutaId: rutaParaPedido.id_ruta,
        rutaNombre: rutaParaPedido.nombre,
        rutaTipo: rutaParaPedido.tipo_ruta
      });

      // Mostrar loading
      const hide = message.loading('Asignando pedido a la ruta...', 0);

      const resultado = await rutaService.asignarPedidoRuta(rutaParaPedido.id_ruta, idPedido);

      // Ocultar loading
      hide();

      console.log('Asignación exitosa:', resultado);

      message.success('Pedido asignado correctamente a la ruta');

      // Recargar rutas para mostrar cambios
      await cargarRutas();

      // Cerrar modal y limpiar estado
      setModalPedidoVisible(false);
      setRutaParaPedido(null);
      setPedidosDisponibles([]);

    } catch (error: any) {
      console.error('Error completo en asignación:', error);

      let errorMessage = 'Error desconocido al asignar pedido';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      message.error(`Error: ${errorMessage}`);
    }
  };


    const handleDesasignarPedido = async (ruta: Ruta) => {
    if (!ruta.pedido_info) {
      message.warning('Esta ruta no tiene pedido asignado');
      return;
    }

    try {
      const hide = message.loading('Desasignando pedido...', 0);
      
      await rutaService.desasignarPedidoRuta(ruta.id_ruta);
      
      hide();
      message.success('Pedido desasignado correctamente');
      
      // Recargar rutas
      await cargarRutas();
      
    } catch (error: any) {
      console.error('Error al desasignar pedido:', error);
      message.error(`Error: ${error.message || 'Error desconocido'}`);
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
        <Tag color={estado === "En ejecución" ? "green" : "blue"}>
          {estado}
        </Tag>
      )
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
      title: "Pedido Asignado",
      key: "pedido_asignado",
      render: (_: any, record: Ruta) => {
        if (record.tipo_ruta !== 'entrega') {
          return <span className="text-gray-400">-</span>;
        }

        if (!record.pedido_info) {
          return <span className="text-gray-400">Sin pedido</span>;
        }

        return (
          <div className="text-center">
            <div className="font-medium text-blue-600">
              {record.pedido_info.numero_pedido}
            </div>
            <div className="text-sm text-green-600">
              ${record.pedido_info.total.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {record.pedido_info.cliente_info?.nombre}
            </div>
          </div>
        );
      }
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 300,
      render: (_: any, record: Ruta) => (
        <Space wrap>
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => setRutaSeleccionada(record.sector)}
            title="Ver en Mapa"
            size="small"
          />
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => handleAsignarUbicaciones(record)}
            title="Asignar Ubicaciones"
            size="small"
          />
          {record.tipo_ruta === 'entrega' && (
            <>
              {!record.pedido_info ? (
                <Button
                  type="link"
                  icon={<ShoppingOutlined />}
                  onClick={() => handleAsignarPedido(record)}
                  title="Asignar Pedido"
                  size="small"
                >
                </Button>
              ) : (
                <Popconfirm
                  title={`¿Desasignar el pedido ${record.pedido_info.numero_pedido}?`}
                  description="El pedido volverá a estar disponible para otras rutas"
                  onConfirm={() => handleDesasignarPedido(record)}
                  okText="Sí, desasignar"
                  cancelText="Cancelar"
                >
                  <Button
                    type="link"
                    danger
                    icon={<ShoppingOutlined />}
                    title="Desasignar Pedido"
                    size="small"
                  >
                  </Button>
                </Popconfirm>
              )}
            </>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar"
            size="small"
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
              size="small"
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

        <Modal
          title={`Asignar Pedido - ${rutaParaPedido?.nombre}`}
          open={modalPedidoVisible}
          onCancel={() => {
            setModalPedidoVisible(false);
            setRutaParaPedido(null);
            setPedidosDisponibles([]);
          }}
          footer={null}
          width={900}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-700">
                <strong>Ruta:</strong> {rutaParaPedido?.nombre} - {rutaParaPedido?.sector}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Seleccione un pedido para asignar a esta ruta de entrega.
                Solo se puede asignar un pedido por ruta.
              </p>
              {rutaParaPedido?.pedido_info && (
                <div className="mt-2 p-2 bg-orange-100 rounded border-l-4 border-orange-400">
                  <p className="text-sm text-orange-800">
                    ⚠️ Esta ruta ya tiene el pedido <strong>{rutaParaPedido.pedido_info.numero_pedido}</strong> asignado.
                    Debe desasignarlo antes de asignar otro.
                  </p>
                </div>
              )}
            </div>

            {pedidosDisponibles.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📦</div>
                <p className="text-gray-500">No hay pedidos disponibles</p>
                <p className="text-sm text-gray-400 mt-1">
                  Todos los pedidos ya están asignados a otras rutas o no están en estado válido
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Pedidos Disponibles ({pedidosDisponibles.length})</h4>
                  <div className="text-sm text-gray-500">
                    Haga clic en "Asignar" para seleccionar un pedido
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {pedidosDisponibles.map((pedido) => (
                    <div
                      key={pedido.id_pedido}
                      className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="font-semibold text-lg text-blue-600">
                              {pedido.numero_pedido}
                            </div>
                            <Tag color={
                              pedido.estado === 'Confirmado' ? 'green' :
                                pedido.estado === 'Pendiente' ? 'orange' : 'blue'
                            }>
                              {pedido.estado}
                            </Tag>
                          </div>

                          <div className="space-y-1">
                            <div className="text-gray-600">
                              <strong>Cliente:</strong> {pedido.cod_cliente}
                            </div>
                            {pedido.cliente_info && (
                              <>
                                <div className="text-sm text-gray-600">
                                  <strong>Nombre:</strong> {pedido.cliente_info.nombre}
                                </div>
                                {pedido.cliente_info.sector && (
                                  <div className="text-xs text-gray-500">
                                    <strong>Sector:</strong> {pedido.cliente_info.sector}
                                    {pedido.cliente_info.sector === rutaParaPedido?.sector && (
                                      <span className="ml-2 text-green-600">✓ Mismo sector de la ruta</span>
                                    )}
                                  </div>
                                )}
                                {pedido.cliente_info.direccion && (
                                  <div className="text-xs text-gray-500">
                                    <strong>Dirección:</strong> {pedido.cliente_info.direccion}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="font-bold text-xl text-green-600 mb-2">
                            ${pedido.total.toFixed(2)}
                          </div>

                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleConfirmarAsignacionPedido(pedido.id_pedido)}
                            className="mb-2"
                          >
                            Asignar Pedido
                          </Button>

                          <div className="text-sm text-gray-500 space-y-1">
                            <div>📅 {new Date(pedido.fecha_pedido).toLocaleDateString('es-ES')}</div>
                            {pedido.subtotal && (
                              <div>💰 Subtotal: ${pedido.subtotal.toFixed(2)}</div>
                            )}
                            {pedido.iva && (
                              <div>🏛️ IVA: ${pedido.iva.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Indicador visual si el sector coincide */}
                      {pedido.cliente_info?.sector === rutaParaPedido?.sector && (
                        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-green-700 flex items-center">
                            ✅ <strong className="ml-1">Recomendado:</strong> El cliente está en el mismo sector que la ruta
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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