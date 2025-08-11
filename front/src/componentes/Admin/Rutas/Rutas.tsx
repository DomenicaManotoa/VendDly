import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Input, Select, Table, Tag, message, Card, Space, Popconfirm, DatePicker, Checkbox, Row, Col, Drawer } from "antd";
import { PlusOutlined, EnvironmentOutlined, EditOutlined, DeleteOutlined, UserOutlined, CarOutlined, MenuOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import MapaClientes from "./MapaClientes";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { rutaService } from "./rutaService";
import { UbicacionCliente, Ruta, AsignacionRuta, CrearRutaData, UsuarioConRol } from "../../../types/types";
import { usuarioService } from "./usuarioService";
import dayjs from 'dayjs';
import axios from 'axios';

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
  const [isMobile, setIsMobile] = useState(false);

  // Detectar el tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
        const rutaActualizada = await rutaService.updateRuta(rutaParaAsignar.id_ruta, {
          asignaciones
        });
        
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

  // Componente Card para vista móvil
  const RutaCard = ({ ruta }: { ruta: Ruta }) => {
    const clientesEnSector = ubicacionesClientes.filter(u => u.sector === ruta.sector).length;
    
    return (
      <Card 
        className="mb-4"
        size="small"
        title={
          <div className="flex justify-between items-center">
            <span className="text-base font-medium truncate pr-2">{ruta.nombre}</span>
            <Tag color={ruta.tipo_ruta === "venta" ? "green" : "orange"} className="shrink-0">
              {ruta.tipo_ruta.charAt(0).toUpperCase() + ruta.tipo_ruta.slice(1)}
            </Tag>
          </div>
        }
        extra={
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EnvironmentOutlined />}
              onClick={() => setRutaSeleccionada(ruta.sector)}
            />
            <Button
              type="text"
              size="small"
              icon={<UserOutlined />}
              onClick={() => handleAsignarUbicaciones(ruta)}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(ruta)}
            />
            <Popconfirm
              title="¿Eliminar ruta?"
              onConfirm={() => handleDelete(ruta.id_ruta)}
              okText="Sí"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        }
      >
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Tag color="blue">{ruta.sector}</Tag>
            <span className="text-xs text-gray-500">
              {clientesEnSector} ubicación{clientesEnSector !== 1 ? 'es' : ''}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 break-words">
            <strong>Dirección:</strong> {ruta.direccion}
          </div>
          
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Tag color={ruta.estado === "En ejecución" ? "green" : "blue"}>
              {ruta.estado}
            </Tag>
            <span className="text-xs text-gray-500">
              {ruta.fecha_ejecucion ? new Date(ruta.fecha_ejecucion).toLocaleDateString('es-ES') : 'Sin fecha'}
            </span>
          </div>
          
          {ruta.asignaciones && ruta.asignaciones.length > 0 ? (
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-sm font-medium">
                {ruta.asignaciones[0].identificacion_usuario}
              </div>
              <div className="text-xs text-gray-500">
                {ruta.asignaciones[0].usuario?.nombre || 'Nombre no disponible'}
              </div>
              <div className="text-xs text-blue-600">
                {ruta.asignaciones[0].tipo_usuario}
              </div>
              {ruta.asignaciones.length > 1 && (
                <div className="text-xs text-gray-400">
                  +{ruta.asignaciones.length - 1} más
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">Sin asignar</div>
          )}
          
          <div className="text-center text-sm text-gray-600">
            <strong>Asignaciones:</strong> {ruta.asignaciones?.length || 0}
          </div>
        </div>
      </Card>
    );
  };

  const columns: ColumnsType<Ruta> = [
    { 
      title: "Nombre", 
      dataIndex: "nombre", 
      key: "nombre",
      ellipsis: true,
      width: 150
    },
    { 
      title: "Sector", 
      dataIndex: "sector", 
      key: "sector",
      width: 120,
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
      ellipsis: true,
      responsive: ['lg']
    },
    { 
      title: "Tipo", 
      dataIndex: "tipo_ruta", 
      key: "tipo_ruta",
      width: 100,
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
      width: 110,
      responsive: ['md'],
      render: (estado: string) => (
        <Tag color={estado === "En ejecución" ? "green" : "blue"}>
          {estado}
        </Tag>
      )
    },
    { 
      title: "Usuario", 
      key: "usuario_asignado",
      width: 150,
      responsive: ['lg'],
      render: (_: any, record: Ruta) => {
        if (!record.asignaciones || record.asignaciones.length === 0) {
          return <span className="text-gray-400">Sin asignar</span>;
        }
        
        const primeraAsignacion = record.asignaciones[0];
        return (
          <div>
            <div className="font-medium text-sm">
              {primeraAsignacion.identificacion_usuario}
            </div>
            <div className="text-xs text-gray-500">
              {primeraAsignacion.usuario?.nombre || 'N/A'}
            </div>
          </div>
        );
      }
    },
    { 
      title: "Asign.", 
      key: "asignaciones",
      width: 70,
      render: (_: any, record: Ruta) => (
        <div className="text-center">
          {record.asignaciones?.length || 0}
        </div>
      )
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      render: (_: any, record: Ruta) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EnvironmentOutlined />}
            onClick={() => setRutaSeleccionada(record.sector)}
            title="Ver en Mapa"
          />
          <Button
            type="text"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleAsignarUbicaciones(record)}
            title="Asignar"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar"
          />
          <Popconfirm
            title="¿Eliminar?"
            onConfirm={() => handleDelete(record.id_ruta)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
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
    <div className="p-2 sm:p-4 lg:p-6">
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Gestión de Rutas</h2>
            <p className="text-sm text-gray-600">
              Total: {rutas.length} rutas • {ubicacionesClientes.length} ubicaciones
              {sectoresDisponibles.length > 0 && (
                <span className="hidden sm:inline"> • {sectoresDisponibles.length} sectores</span>
              )}
            </p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            size={isMobile ? "middle" : "middle"}
            className="w-full sm:w-auto"
          >
            Crear Ruta
          </Button>
        </div>

        {/* Vista de tabla para desktop y tablet */}
        {!isMobile ? (
          <Table 
            dataSource={rutas} 
            columns={columns} 
            rowKey="id_ruta"
            loading={loadingRutas}
            scroll={{ x: 'max-content' }}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} rutas`,
              responsive: true,
              size: 'small'
            }}
            locale={{
              emptyText: 'No hay rutas registradas. Crea tu primera ruta usando el botón "Crear Ruta".'
            }}
            size="small"
          />
        ) : (
          /* Vista de cards para móvil */
          <div className="space-y-3">
            {loadingRutas ? (
              <div className="text-center py-8">Cargando rutas...</div>
            ) : rutas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay rutas registradas. Crea tu primera ruta usando el botón "Crear Ruta".
              </div>
            ) : (
              rutas.map((ruta) => (
                <RutaCard key={ruta.id_ruta} ruta={ruta} />
              ))
            )}
          </div>
        )}

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
          width={isMobile ? '95%' : 600}
          centered={isMobile}
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              name="nombre" 
              label="Nombre de la Ruta" 
              rules={[{ required: true, message: 'Por favor ingrese el nombre de la ruta' }]}
            >
              <Input placeholder="Ej: Ruta Centro Mañana" />
            </Form.Item>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
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
                          {sector} ({clientesEnSector})
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
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item 
                  name="tipo_ruta" 
                  label="Tipo de Ruta" 
                  rules={[{ required: true, message: 'Por favor seleccione el tipo de ruta' }]}
                >
                  <Select placeholder="Seleccione tipo">
                    <Option value="venta">Venta</Option>
                    <Option value="entrega">Entrega</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item 
              name="direccion" 
              label="Dirección Principal" 
              rules={[{ required: true, message: 'Por favor ingrese la dirección' }]}
            >
              <Input placeholder="Dirección principal de la ruta" />
            </Form.Item>

            <Form.Item 
              name="fecha_ejecucion" 
              label="Fecha de Ejecución (Opcional)"
            >
              <DatePicker 
                style={{ width: '100%' }}
                placeholder="Seleccione fecha"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal para asignar ubicaciones */}
        <Modal
          title={`Asignar - ${rutaParaAsignar?.nombre}`}
          open={modalAsignacionVisible}
          onCancel={() => {
            setModalAsignacionVisible(false);
            setRutaParaAsignar(null);
            setUbicacionesSeleccionadas([]);
            formAsignacion.resetFields();
          }}
          onOk={handleConfirmarAsignacion}
          okText="Asignar"
          cancelText="Cancelar"
          width={isMobile ? '95%' : 800}
          centered={isMobile}
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
                placeholder="Seleccione tipo"
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
                  <UserOutlined /> Vendedor
                </Option>
                <Option 
                  value="transportista"
                  disabled={rutaParaAsignar?.tipo_ruta !== 'entrega'}
                >
                  <CarOutlined /> Transportista
                </Option>
              </Select>
            </Form.Item>
          </Form>

          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">
              Ubicaciones en {rutaParaAsignar?.sector} ({ubicacionesParaAsignar.length})
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
                      <div className="font-medium text-sm">Cliente: {ubicacion.cod_cliente}</div>
                      <div className="text-xs text-gray-600">{ubicacion.direccion}</div>
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
                  Seleccionadas: {ubicacionesSeleccionadas.length}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </Card>

      <Card className="mt-4 lg:mt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-semibold">
            Mapa de Ubicaciones
            {rutaSeleccionada && (
              <span className="block sm:inline text-sm font-normal text-gray-600">
                {isMobile ? '' : ' - '}Sector: {rutaSeleccionada}
              </span>
            )}
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              placeholder="Filtrar sector"
              allowClear
              style={{ width: isMobile ? '100%' : 200 }}
              onChange={setRutaSeleccionada}
              value={rutaSeleccionada}
              loading={loadingUbicaciones}
              size={isMobile ? "middle" : "middle"}
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
              size={isMobile ? "middle" : "middle"}
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
              {rutaSeleccionada && ` en ${rutaSeleccionada}`}
            </div>
            
            <div className="h-64 sm:h-80 lg:h-96">
              <MapaClientes 
                sectorSeleccionado={rutaSeleccionada}
                ubicacionesReales={ubicacionesFiltradas}
                rutaSeleccionada={rutas.find(r => r.sector === rutaSeleccionada) || null}
                mostrarRuta={!!rutaSeleccionada}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}