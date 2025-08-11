import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Input, Select, Table, Tag, message, Card, Space, Popconfirm, DatePicker, Checkbox, Drawer, Typography } from "antd";
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined, UserOutlined, CarOutlined, MenuOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import MapaClientes from "./MapaClientes";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { rutaService } from "./rutaService";
import { UbicacionCliente, Ruta, AsignacionRuta, CrearRutaData, UsuarioConRol, PedidoRuta } from "../../../types/types";
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
  const [modalPedidoVisible, setModalPedidoVisible] = useState(false);
  const [pedidosDisponibles, setPedidosDisponibles] = useState<PedidoRuta[]>([]);
  const [rutaParaPedido, setRutaParaPedido] = useState<Ruta | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    cargarUbicacionesClientes();
    cargarRutas();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        const rutaActualizada = await rutaService.updateRuta(editingRuta.id_ruta, values);
        setRutas(prev => prev.map(ruta =>
          ruta.id_ruta === editingRuta.id_ruta ? rutaActualizada : ruta
        ));
        message.success('Ruta actualizada correctamente');
      } else {
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

      const hide = message.loading('Asignando pedido a la ruta...', 0);
      const resultado = await rutaService.asignarPedidoRuta(rutaParaPedido.id_ruta, idPedido);
      hide();

      console.log('Asignación exitosa:', resultado);
      message.success('Pedido asignado correctamente a la ruta');

      await cargarRutas();
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
      await cargarRutas();
    } catch (error: any) {
      console.error('Error al desasignar pedido:', error);
      message.error(`Error: ${error.message || 'Error desconocido'}`);
    }
  };

  const sectoresDisponibles = Array.from(new Set(ubicacionesClientes.map(u => u.sector)));
  const ubicacionesFiltradas = rutaSeleccionada
    ? ubicacionesClientes.filter(u => u.sector === rutaSeleccionada)
    : ubicacionesClientes;
  const ubicacionesParaAsignar = rutaParaAsignar
    ? ubicacionesClientes.filter(u => u.sector === rutaParaAsignar.sector)
    : [];

  // Columnas responsivas para la tabla
  const columns: ColumnsType<Ruta> = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      ellipsis: true,
      width: 150,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl']
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
      width: 120,
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (sector: string) => {
        const clientesEnSector = ubicacionesClientes.filter(u => u.sector === sector).length;
        return (
          <div>
            <Tag color="blue" className="text-xs">{sector}</Tag>
            {clientesEnSector > 0 && (
              <div className="text-xs text-gray-500 mt-1">
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
      ellipsis: true,
      width: 150,
      responsive: ['md', 'lg', 'xl']
    },
    {
      title: "Tipo",
      dataIndex: "tipo_ruta",
      key: "tipo_ruta",
      width: 100,
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (tipo: string) => (
        <Tag color={tipo === "venta" ? "green" : "orange"} className="text-xs">
          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
        </Tag>
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      responsive: ['lg', 'xl'],
      render: (estado: string) => (
        <Tag color={estado === "En ejecución" ? "green" : "blue"} className="text-xs">
          {estado}
        </Tag>
      )
    },
    {
      title: "Fecha",
      dataIndex: "fecha_ejecucion",
      key: "fecha_ejecucion",
      width: 100,
      responsive: ['lg', 'xl'],
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-'
    },
    {
      title: "Usuario",
      key: "usuario_asignado",
      width: 150,
      responsive: ['xl'],
      render: (_: any, record: Ruta) => {
        if (!record.asignaciones || record.asignaciones.length === 0) {
          return <span className="text-gray-400 text-xs">Sin asignar</span>;
        }
        const primeraAsignacion = record.asignaciones[0];
        return (
          <div className="text-xs">
            <div className="font-medium">{primeraAsignacion.identificacion_usuario}</div>
            <div className="text-gray-500">{primeraAsignacion.usuario?.nombre || 'N/D'}</div>
            <div className="text-blue-600">{primeraAsignacion.tipo_usuario}</div>
            {record.asignaciones.length > 1 && (
              <div className="text-gray-400">+{record.asignaciones.length - 1} más</div>
            )}
          </div>
        );
      }
    },
    {
      title: "Pedido",
      key: "pedido_asignado",
      width: 120,
      responsive: ['xl'],
      render: (_: any, record: Ruta) => {
        if (record.tipo_ruta !== 'entrega') {
          return <span className="text-gray-400 text-xs">-</span>;
        }
        if (!record.pedido_info) {
          return <span className="text-gray-400 text-xs">Sin pedido</span>;
        }
        return (
          <div className="text-xs text-center">
            <div className="font-medium text-blue-600">{record.pedido_info.numero_pedido}</div>
            <div className="text-green-600">${record.pedido_info.total.toFixed(2)}</div>
            <div className="text-gray-500">{record.pedido_info.cliente_info?.nombre}</div>
          </div>
        );
      }
    },
    {
      title: "Acciones",
      key: "acciones",
      width: isMobile ? 80 : 120, // Menor ancho en móvil
      fixed: isMobile ? undefined : 'right',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (_: any, record: Ruta) => (
        <Space wrap size="small">
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => setRutaSeleccionada(record.sector)}
            title="Ver en Mapa"
            size="small"
            className="p-0"
          />
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => handleAsignarUbicaciones(record)}
            title="Asignar Ubicaciones"
            size="small"
            className="p-0"
          />
          {record.tipo_ruta === 'entrega' && (
            !record.pedido_info ? (
              <Button
                type="link"
                icon={<ShoppingOutlined />}
                onClick={() => handleAsignarPedido(record)}
                title="Asignar Pedido"
                size="small"
                className="p-0"
              />
            ) : (
              <Popconfirm
                title={`¿Desasignar el pedido ${record.pedido_info.numero_pedido}?`}
                onConfirm={() => handleDesasignarPedido(record)}
                okText="Sí"
                cancelText="No"
              >
                <Button
                  type="link"
                  danger
                  icon={<ShoppingOutlined />}
                  title="Desasignar Pedido"
                  size="small"
                  className="p-0"
                />
              </Popconfirm>
            )
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar"
            size="small"
            className="p-0"
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
              className="p-0"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Render para móvil: Cards
  const renderCards = () => (
    <div className="flex flex-col gap-3">
      {rutas.map((ruta) => (
        <Card key={ruta.id_ruta} className="shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="font-bold text-base">{ruta.nombre}</span>
              <Tag color="blue" className="ml-2">{ruta.sector}</Tag>
            </div>
            <Space size="small">
              <Button
                type="link"
                icon={<EnvironmentOutlined />}
                onClick={() => setRutaSeleccionada(ruta.sector)}
                size="small"
              />
              <Button
                type="link"
                icon={<UserOutlined />}
                onClick={() => handleAsignarUbicaciones(ruta)}
                size="small"
              />
              {ruta.tipo_ruta === 'entrega' && (
                !ruta.pedido_info ? (
                  <Button
                    type="link"
                    icon={<ShoppingOutlined />}
                    onClick={() => handleAsignarPedido(ruta)}
                    size="small"
                  />
                ) : (
                  <Popconfirm
                    title={`¿Desasignar el pedido ${ruta.pedido_info.numero_pedido}?`}
                    onConfirm={() => handleDesasignarPedido(ruta)}
                    okText="Sí"
                    cancelText="No"
                  >
                    <Button
                      type="link"
                      danger
                      icon={<ShoppingOutlined />}
                      size="small"
                    />
                  </Popconfirm>
                )
              )}
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(ruta)}
                size="small"
              />
              <Popconfirm
                title="¿Estás seguro de eliminar esta ruta?"
                onConfirm={() => handleDelete(ruta.id_ruta)}
                okText="Sí"
                cancelText="No"
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            </Space>
          </div>
          <div className="text-xs text-gray-600 mb-1">
            <strong>Dirección:</strong> {ruta.direccion}
          </div>
          <div className="text-xs text-gray-600 mb-1">
            <strong>Tipo:</strong> {ruta.tipo_ruta}
          </div>
          <div className="text-xs text-gray-600 mb-1">
            <strong>Estado:</strong> {ruta.estado}
          </div>
          <div className="text-xs text-gray-600 mb-1">
            <strong>Fecha:</strong> {ruta.fecha_ejecucion ? new Date(ruta.fecha_ejecucion).toLocaleDateString('es-ES') : '-'}
          </div>
          {ruta.pedido_info && (
            <div className="text-xs text-green-600">
              <strong>Pedido:</strong> {ruta.pedido_info.numero_pedido} (${ruta.pedido_info.total.toFixed(2)})
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  const MapSection = () => (
    <Card className="mt-4 lg:mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
        <h3 className="text-base sm:text-lg font-semibold">
          Mapa de Ubicaciones
          {rutaSeleccionada && ` - Sector: ${rutaSeleccionada}`}
        </h3>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select
            placeholder="Filtrar por sector"
            allowClear
            className="w-full sm:w-48"
            onChange={setRutaSeleccionada}
            value={rutaSeleccionada}
            loading={loadingUbicaciones}
            size="small"
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
            size="small"
            className="w-full sm:w-auto"
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
          <div className="mb-2 text-xs sm:text-sm text-gray-600">
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
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <Typography.Title level={2}>Gestión de Rutas</Typography.Title>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Total de rutas: {rutas.length} • Ubicaciones: {ubicacionesClientes.length}
              {sectoresDisponibles.length > 0 && ` • Sectores: ${sectoresDisponibles.length}`}
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="small"
              className="flex-1 sm:flex-none"
            >
              <span className="hidden xs:inline">Crear Ruta</span>
              <span className="xs:hidden">Crear</span>
            </Button>
            
            <Button
              className="sm:hidden"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              size="small"
            >
              Mapa
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isMobile ? renderCards() : (
            <Table
              dataSource={rutas}
              columns={columns}
              rowKey="id_ruta"
              loading={loadingRutas}
              size="small"
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 10,
                size: 'small',
                showSizeChanger: true,
                showQuickJumper: !isMobile,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} de ${total} rutas`,
                responsive: true
              }}
              locale={{
                emptyText: 'No hay rutas registradas. Crea tu primera ruta usando el botón "Crear Ruta".'
              }}
            />
          )}
        </div>

        {/* Drawer para móvil */}
        <Drawer
          title="Mapa de Ubicaciones"
          placement="bottom"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          height="70%"
          className="sm:hidden"
        >
          <div className="flex flex-col gap-3 mb-4">
            <Select
              placeholder="Filtrar por sector"
              allowClear
              className="w-full"
              onChange={setRutaSeleccionada}
              value={rutaSeleccionada}
              loading={loadingUbicaciones}
              size="small"
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
              size="small"
              className="w-full"
            >
              Mostrar Todos
            </Button>
          </div>

          {loadingUbicaciones ? (
            <div className="text-center py-8">
              Cargando ubicaciones de clientes...
            </div>
          ) : (
            <>
              <div className="mb-2 text-xs text-gray-600">
                Mostrando {ubicacionesFiltradas.length} de {ubicacionesClientes.length} ubicaciones
              </div>

              <MapaClientes
                sectorSeleccionado={rutaSeleccionada}
                ubicacionesReales={ubicacionesFiltradas}
                rutaSeleccionada={rutas.find(r => r.sector === rutaSeleccionada) || null}
                mostrarRuta={!!rutaSeleccionada}
              />
            </>
          )}
        </Drawer>
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
          width="95%"
          style={{ maxWidth: 600 }}
          destroyOnClose
        >
          <Form form={form} layout="vertical" size="small">
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
                {sectoresDisponibles.map((sector) => {
                  const clientesEnSector = ubicacionesClientes.filter(u => u.sector === sector).length;
                  return (
                    <Option key={sector} value={sector}>
                      {sector} ({clientesEnSector} ubicación{clientesEnSector !== 1 ? 'es' : ''})
                    </Option>
                  );
                })}

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
          width="95%"
          style={{ maxWidth: 800 }}
          destroyOnClose
        >
          <Form form={formAsignacion} layout="vertical" size="small">
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
                      <div className="font-medium text-sm">{usuario.identificacion}</div>
                      <div className="text-xs text-gray-500">{usuario.nombre}</div>
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
            <h4 className="font-semibold mb-2 text-sm">
              Ubicaciones Disponibles en {rutaParaAsignar?.sector} ({ubicacionesParaAsignar.length})
            </h4>
            <div className="max-h-48 sm:max-h-60 overflow-y-auto">
              {ubicacionesParaAsignar.map((ubicacion) => (
                <div key={ubicacion.id_ubicacion} className="border rounded p-2 sm:p-3 mb-2">
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
                      <div className="font-medium text-sm">Cliente: {ubicacion.cod_cliente}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{ubicacion.direccion}</div>
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
                <div className="text-xs sm:text-sm text-blue-600">
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
          width="95%"
          style={{ maxWidth: 900 }}
          destroyOnClose
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs sm:text-sm text-blue-700">
                <strong>Ruta:</strong> {rutaParaPedido?.nombre} - {rutaParaPedido?.sector}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Seleccione un pedido para asignar a esta ruta de entrega.
                Solo se puede asignar un pedido por ruta.
              </p>
              {rutaParaPedido?.pedido_info && (
                <div className="mt-2 p-2 bg-orange-100 rounded border-l-4 border-orange-400">
                  <p className="text-xs sm:text-sm text-orange-800">
                    ⚠️ Esta ruta ya tiene el pedido <strong>{rutaParaPedido.pedido_info.numero_pedido}</strong> asignado.
                    Debe desasignarlo antes de asignar otro.
                  </p>
                </div>
              )}
            </div>

            {pedidosDisponibles.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-3xl sm:text-4xl mb-2">📦</div>
                <p className="text-sm sm:text-base text-gray-500">No hay pedidos disponibles</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Todos los pedidos ya están asignados a otras rutas o no están en estado válido
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-medium text-sm sm:text-base">
                    Pedidos Disponibles ({pedidosDisponibles.length})
                  </h4>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Haga clic en "Asignar" para seleccionar un pedido
                  </div>
                </div>

                <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-3">
                  {pedidosDisponibles.map((pedido) => (
                    <div
                      key={pedido.id_pedido}
                      className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                            <div className="font-semibold text-base sm:text-lg text-blue-600">
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
                            <div className="text-sm sm:text-base text-gray-600">
                              <strong>Cliente:</strong> {pedido.cod_cliente}
                            </div>
                            {pedido.cliente_info && (
                              <>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  <strong>Nombre:</strong> {pedido.cliente_info.nombre}
                                </div>
                                {pedido.cliente_info.sector && (
                                  <div className="text-xs text-gray-500">
                                    <strong>Sector:</strong> {pedido.cliente_info.sector}
                                    {pedido.cliente_info.sector === rutaParaPedido?.sector && (
                                      <span className="ml-2 text-green-600 text-xs">✓ Mismo sector</span>
                                    )}
                                  </div>
                                )}
                                {pedido.cliente_info.direccion && (
                                  <div className="text-xs text-gray-500 break-words">
                                    <strong>Dirección:</strong> {pedido.cliente_info.direccion}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-center sm:text-right w-full sm:w-auto sm:ml-4">
                          <div className="font-bold text-lg sm:text-xl text-green-600 mb-2">
                            ${pedido.total.toFixed(2)}
                          </div>

                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleConfirmarAsignacionPedido(pedido.id_pedido)}
                            className="mb-2 w-full sm:w-auto"
                          >
                            Asignar Pedido
                          </Button>

                          <div className="text-xs sm:text-sm text-gray-500 space-y-1">
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

                      {pedido.cliente_info?.sector === rutaParaPedido?.sector && (
                        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-green-700 flex items-start sm:items-center">
                            <span className="mr-1 flex-shrink-0">✅</span>
                            <span>
                              <strong>Recomendado:</strong> El cliente está en el mismo sector que la ruta
                            </span>
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
      </>
      <div className="hidden sm:block">
        <MapSection />
      </div>
    </div>
  );
}