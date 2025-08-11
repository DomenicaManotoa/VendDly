import React, { useState, useEffect } from "react";
import { Table, Tag, Card, Select, message, Space, Button, Modal, Descriptions, Divider } from "antd";
import { EnvironmentOutlined, UserOutlined, TruckOutlined, ShoppingOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import MapaClientes from "../Rutas/MapaClientes";
import { rutaService } from "../Rutas/rutaService";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { Ruta, UbicacionCliente } from "../../../types/types";

const { Option } = Select;

export default function Entregas() {
  const [rutasEntrega, setRutasEntrega] = useState<Ruta[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [ubicacionesClientes, setUbicacionesClientes] = useState<UbicacionCliente[]>([]);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any | null>(null);
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);

  useEffect(() => {
    cargarRutasEntrega();
    cargarUbicacionesClientes();
  }, []);

  const cargarRutasEntrega = async () => {
    setLoadingRutas(true);
    try {
      const todasLasRutas = await rutaService.getRutas();
      // Filtrar solo rutas de entrega
      const rutasDeEntrega = todasLasRutas.filter(ruta => ruta.tipo_ruta === 'entrega');
      setRutasEntrega(rutasDeEntrega);
    } catch (error) {
      console.error('Error al cargar rutas de entrega:', error);
      message.error('Error al cargar las rutas de entrega');
    } finally {
      setLoadingRutas(false);
    }
  };

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

  // Obtener sectores únicos de las rutas de entrega
  const sectoresDisponibles = Array.from(new Set(rutasEntrega.map(r => r.sector)));

  // Reemplazar la función ubicacionesFiltradas (línea aproximada 54-63)
  const ubicacionesFiltradas = rutaSeleccionada
    ? ubicacionesClientes.filter(u => {
      // Mostrar ubicaciones que están en las asignaciones de la ruta seleccionada
      return rutaSeleccionada.asignaciones?.some(asig => asig.id_ubicacion === u.id_ubicacion);
    })
    : sectorSeleccionado
      ? // Solo ubicaciones que están en rutas de entrega del sector seleccionado
      ubicacionesClientes.filter(u => {
        return u.sector === sectorSeleccionado &&
          rutasEntrega.some(ruta =>
            ruta.sector === sectorSeleccionado &&
            ruta.asignaciones?.some(asig => asig.id_ubicacion === u.id_ubicacion)
          );
      })
      : // Mostrar solo ubicaciones que están asignadas a alguna ruta de entrega
      ubicacionesClientes.filter(u =>
        rutasEntrega.some(ruta =>
          ruta.asignaciones?.some(asig => asig.id_ubicacion === u.id_ubicacion)
        )
      );

  const handleVerEnMapa = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setSectorSeleccionado(null);
  };

  const handleFiltrarPorSector = (sector: string) => {
    setSectorSeleccionado(sector);
    setRutaSeleccionada(null);
  };

  const handleVerDetallesPedido = async (ruta: Ruta) => {
    if (!ruta.pedido_info) {
      message.warning('Esta ruta no tiene pedido asignado');
      return;
    }

    try {
      const detallesPedido = await rutaService.getPedidoRuta(ruta.id_ruta);
      setPedidoSeleccionado({
        ...detallesPedido,
        ruta_info: {
          nombre: ruta.nombre,
          sector: ruta.sector,
          estado: ruta.estado
        }
      });
      setModalDetallesVisible(true);
    } catch (error) {
      console.error('Error al cargar detalles del pedido:', error);
      message.error('Error al cargar los detalles del pedido');
    }
  };

  const columns: ColumnsType<Ruta> = [
    {
      title: "Nombre de la Ruta",
      dataIndex: "nombre",
      key: "nombre",
      ellipsis: true,
      render: (text: string, record: Ruta) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">ID: {record.id_ruta}</div>
        </div>
      )
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
      render: (sector: string) => {
        const rutasEnSector = rutasEntrega.filter(r => r.sector === sector).length;
        const ubicacionesEnSector = ubicacionesClientes.filter(u => u.sector === sector).length;
        return (
          <div>
            <Tag color="orange">{sector}</Tag>
            <div className="text-xs text-gray-500">
              {rutasEnSector} ruta{rutasEnSector !== 1 ? 's' : ''} • {ubicacionesEnSector} ubicación{ubicacionesEnSector !== 1 ? 'es' : ''}
            </div>
          </div>
        );
      }
    },
    {
      title: "Dirección Principal",
      dataIndex: "direccion",
      key: "direccion",
      ellipsis: true
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: string) => {
        const getColor = () => {
          switch (estado) {
            case 'Planificada': return 'blue';
            case 'En ejecución': return 'green';
            case 'Completada': return 'success';
            case 'Cancelada': return 'error';
            default: return 'default';
          }
        };
        return <Tag color={getColor()}>{estado}</Tag>;
      }
    },
    {
      title: "Fecha de Ejecución",
      dataIndex: "fecha_ejecucion",
      key: "fecha_ejecucion",
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-'
    },
    {
      title: "Transportista Asignado",
      key: "transportista_asignado",
      render: (_: any, record: Ruta) => {
        const transportista = record.asignaciones?.find(asig => asig.tipo_usuario === 'transportista');

        if (!transportista) {
          return <span className="text-gray-400">Sin asignar</span>;
        }

        return (
          <div>
            <div className="font-medium flex items-center gap-1">
              <TruckOutlined className="text-orange-500" />
              {transportista.identificacion_usuario}
            </div>
            <div className="text-sm text-gray-500">
              {transportista.usuario?.nombre || 'Nombre no disponible'}
            </div>
          </div>
        );
      }
    },
    {
      title: "Paradas Programadas",
      key: "paradas",
      align: 'center',
      render: (_: any, record: Ruta) => {
        const paradas = record.asignaciones?.filter(asig => asig.id_ubicacion).length || 0;
        return (
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{paradas}</div>
            <div className="text-xs text-gray-500">ubicaciones</div>
          </div>
        );
      }
    },
    {
      title: "Pedido Asignado",
      key: "pedido_asignado",
      render: (_: any, record: Ruta) => {
        if (!record.pedido_info) {
          return <span className="text-gray-400">Sin pedido</span>;
        }

        return (
          <div>
            <div className="font-medium flex items-center gap-1">
              <ShoppingOutlined className="text-green-500" />
              {record.pedido_info.numero_pedido}
            </div>
            <div className="text-sm text-gray-500">
              Cliente: {record.pedido_info.cod_cliente}
            </div>
            <div className="text-sm text-green-600 font-medium">
              ${record.pedido_info.total.toFixed(2)}
            </div>
            <Tag
              color={
                record.pedido_info.estado === 'Facturado' ? 'blue' :
                  record.pedido_info.estado === 'Despachado' ? 'orange' :
                    record.pedido_info.estado === 'Enviado' ? 'purple' :
                      'default'
              }
            >
              {record.pedido_info.estado}
            </Tag>
          </div>
        );
      }
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 180,
      render: (_: any, record: Ruta) => (
        <Space direction="horizontal" size="small">
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => handleVerEnMapa(record)}
            title="Ver Ruta en Mapa"
            className="text-blue-500 hover:text-blue-700"
            size="small"
          >
          </Button>
          {record.pedido_info && (
            <Button
              type="link"
              icon={<ShoppingOutlined />}
              onClick={() => handleVerDetallesPedido(record)}
              title="Ver Detalles del Pedido"
              className="text-green-500 hover:text-green-700"
              size="small"
            >
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TruckOutlined className="text-orange-500" />
              Gestión de Entregas
            </h2>
            <p className="text-gray-600">
              Total de rutas de entrega: {rutasEntrega.length} •
              Sectores disponibles: {sectoresDisponibles.length} •
              Total ubicaciones: {ubicacionesClientes.length}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-4">
          <Select
            placeholder="Filtrar por sector"
            allowClear
            style={{ width: 200 }}
            onChange={handleFiltrarPorSector}
            value={sectorSeleccionado}
            disabled={!!rutaSeleccionada}
          >
            {sectoresDisponibles.map((sector) => {
              const rutasEnSector = rutasEntrega.filter(r => r.sector === sector).length;
              return (
                <Option key={sector} value={sector}>
                  {sector} ({rutasEnSector} ruta{rutasEnSector !== 1 ? 's' : ''})
                </Option>
              );
            })}
          </Select>

          {(rutaSeleccionada || sectorSeleccionado) && (
            <Button
              onClick={() => {
                setRutaSeleccionada(null);
                setSectorSeleccionado(null);
              }}
            >
              Mostrar Todas las Rutas
            </Button>
          )}
        </div>

        {/* Información de filtros aplicados */}
        {rutaSeleccionada && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="flex items-center gap-2">
              <TruckOutlined className="text-orange-500" />
              <span className="font-medium">Visualizando ruta: {rutaSeleccionada.nombre}</span>
              <Tag color="orange">Entrega</Tag>
              <Tag color="blue">{rutaSeleccionada.sector}</Tag>
            </div>
          </div>
        )}

        <Table
          dataSource={rutasEntrega}
          columns={columns}
          rowKey="id_ruta"
          loading={loadingRutas}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} rutas de entrega`
          }}
          locale={{
            emptyText: (
              <div className="text-center py-8">
                <TruckOutlined className="text-6xl text-gray-300 mb-4" />
                <div className="text-gray-500">
                  No hay rutas de entrega registradas.
                  <br />
                  Las rutas de entrega se crean desde la sección "Rutas".
                </div>
              </div>
            )
          }}
          rowClassName={(record) =>
            rutaSeleccionada?.id_ruta === record.id_ruta ? 'bg-orange-50' : ''
          }
        />
      </Card>

      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <EnvironmentOutlined />
            Mapa de Rutas de Entrega
            {rutaSeleccionada && ` - ${rutaSeleccionada.nombre}`}
            {sectorSeleccionado && ` - Sector: ${sectorSeleccionado}`}
          </h3>
        </div>

        {loadingUbicaciones ? (
          <div className="text-center py-8">
            Cargando ubicaciones de entrega...
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              Mostrando {ubicacionesFiltradas.length} ubicaciones de entrega
              {rutaSeleccionada && ` para la ruta "${rutaSeleccionada.nombre}"`}
              {sectorSeleccionado && !rutaSeleccionada && ` en rutas de entrega del sector ${sectorSeleccionado}`}
              {!rutaSeleccionada && !sectorSeleccionado && ` (solo ubicaciones asignadas a rutas de entrega)`}
            </div>

            <MapaClientes
              sectorSeleccionado={sectorSeleccionado}
              ubicacionesReales={ubicacionesFiltradas}
              rutaSeleccionada={rutaSeleccionada}
              mostrarRuta={!!rutaSeleccionada}
            />
          </>
        )}
      </Card>

      {/* Modal para detalles del pedido - MOVIDO AQUÍ AL FINAL */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ShoppingOutlined className="text-green-500" />
            Detalles del Pedido
            {pedidoSeleccionado?.ruta_info && (
              <Tag color="orange">Ruta: {pedidoSeleccionado.ruta_info.nombre}</Tag>
            )}
          </div>
        }
        open={modalDetallesVisible}
        onCancel={() => {
          setModalDetallesVisible(false);
          setPedidoSeleccionado(null);
        }}
        footer={[
          <Button key="cerrar" onClick={() => {
            setModalDetallesVisible(false);
            setPedidoSeleccionado(null);
          }}>
            Cerrar
          </Button>
        ]}
        width={800}
      >
        {pedidoSeleccionado && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Número de Pedido" span={1}>
                <strong>{pedidoSeleccionado.numero_pedido}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Estado" span={1}>
                <Tag
                  color={
                    pedidoSeleccionado.estado === 'Facturado' ? 'blue' :
                      pedidoSeleccionado.estado === 'Despachado' ? 'orange' :
                        pedidoSeleccionado.estado === 'Enviado' ? 'purple' :
                          'default'
                  }
                >
                  {pedidoSeleccionado.estado}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Fecha del Pedido">
                {new Date(pedidoSeleccionado.fecha_pedido).toLocaleDateString('es-ES')}
              </Descriptions.Item>
              <Descriptions.Item label="Cliente">
                <div>
                  <div><strong>{pedidoSeleccionado.cliente_info?.nombre || 'N/A'}</strong></div>
                  <div className="text-sm text-gray-500">Código: {pedidoSeleccionado.cod_cliente}</div>
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Información de Entrega</Divider>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Ruta de Entrega">
                {pedidoSeleccionado.ruta_info?.nombre}
              </Descriptions.Item>
              <Descriptions.Item label="Sector">
                {pedidoSeleccionado.ruta_info?.sector || pedidoSeleccionado.cliente_info?.sector}
              </Descriptions.Item>
              <Descriptions.Item label="Dirección de Entrega" span={2}>
                {pedidoSeleccionado.cliente_info?.direccion || 'No especificada'}
              </Descriptions.Item>
              <Descriptions.Item label="Estado de la Ruta">
                <Tag color={
                  pedidoSeleccionado.ruta_info?.estado === 'Planificada' ? 'blue' :
                    pedidoSeleccionado.ruta_info?.estado === 'En ejecución' ? 'green' :
                      pedidoSeleccionado.ruta_info?.estado === 'Completada' ? 'success' :
                        'default'
                }>
                  {pedidoSeleccionado.ruta_info?.estado}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Resumen Financiero</Divider>

            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="Subtotal">
                <span className="text-blue-600 font-medium">
                  ${pedidoSeleccionado.subtotal?.toFixed(2) || '0.00'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="IVA">
                <span className="text-orange-600 font-medium">
                  ${pedidoSeleccionado.iva?.toFixed(2) || '0.00'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <span className="text-green-600 font-bold text-lg">
                  ${pedidoSeleccionado.total?.toFixed(2) || '0.00'}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}