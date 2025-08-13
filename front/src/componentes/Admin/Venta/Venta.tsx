// Venta.tsx
import React, { useState, useEffect } from "react";
import { Table, Tag, Card, Select, message, Space, Button } from "antd";
import { EnvironmentOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import MapaClientes from "../Rutas/MapaClientes";
import { rutaService } from "../Rutas/rutaService";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { Ruta, UbicacionCliente } from "../../../types/types";
import { authService } from "../../../auth/auth";

const { Option } = Select;

export default function Venta() {
  const [rutasVenta, setRutasVenta] = useState<Ruta[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [ubicacionesClientes, setUbicacionesClientes] = useState<UbicacionCliente[]>([]);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Obtener información del usuario actual
  const currentUser = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();
  const isVendedor = authService.hasRole('Vendedor');

  useEffect(() => {
    cargarRutasVenta();
    cargarUbicacionesClientes();
  }, []);

const cargarRutasVenta = async () => {
  setLoadingRutas(true);
  try {
    let rutasDeVenta: Ruta[] = [];
    
    if (isAdmin) {
      // Los administradores ven todas las rutas de venta
      rutasDeVenta = await rutaService.getRutasVenta();
    } else if (isVendedor && currentUser) {
      // Los vendedores solo ven sus rutas asignadas
      rutasDeVenta = await rutaService.getRutasVentaUsuario(currentUser.identificacion);
    } else {
      // Otros roles pueden ver rutas según sea necesario
      rutasDeVenta = await rutaService.getRutasVenta();
    }

    setRutasVenta(rutasDeVenta);
  } catch (error) {
    console.error('Error al cargar rutas de venta:', error);
    message.error('Error al cargar las rutas de venta');
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

  // Obtener sectores únicos de las rutas de venta (filtradas por usuario si es vendedor)
  const sectoresDisponibles = Array.from(new Set(rutasVenta.map(r => r.sector)));

  // Descripción del componente según el rol
  const getDescripcionComponent = () => {
    if (isVendedor) {
      return `Rutas asignadas a ti: ${rutasVenta.length} • Sectores: ${sectoresDisponibles.length}`;
    } else if (isAdmin) {
      return `Total de rutas de venta: ${rutasVenta.length} • Sectores disponibles: ${sectoresDisponibles.length}`;
    } else {
      return `Rutas de venta disponibles: ${rutasVenta.length} • Sectores: ${sectoresDisponibles.length}`;
    }
  };

  // Filtrar ubicaciones según las rutas disponibles para el usuario
const ubicacionesFiltradas = rutaSeleccionada
  ? ubicacionesClientes.filter(u => {
      // Mostrar ubicaciones que están en las asignaciones de la ruta seleccionada
      return rutaSeleccionada.asignaciones?.some(asig => asig.id_ubicacion === u.id_ubicacion);
    })
  : sectorSeleccionado
    ? // Solo ubicaciones que están en rutas de venta del sector seleccionado
      ubicacionesClientes.filter(u => {
        return u.sector === sectorSeleccionado &&
          rutasVenta.some(ruta =>
            ruta.sector === sectorSeleccionado &&
            ruta.asignaciones?.some(asig => asig.id_ubicacion === u.id_ubicacion)
          );
      })
    : // Mostrar solo ubicaciones que están asignadas a alguna ruta de venta (del usuario actual)
      ubicacionesClientes.filter(u =>
        rutasVenta.some(ruta =>
          ruta.asignaciones?.some(asig => asig.id_ubicacion === u.id_ubicacion)
        )  // <- AQUÍ FALTABA EL PARÉNTESIS DE CIERRE
      );

  const handleVerEnMapa = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setSectorSeleccionado(null);
  };

  const handleFiltrarPorSector = (sector: string) => {
    setSectorSeleccionado(sector);
    setRutaSeleccionada(null);
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
        const rutasEnSector = rutasVenta.filter(r => r.sector === sector).length;
        const ubicacionesEnSector = ubicacionesClientes.filter(u => u.sector === sector).length;
        return (
          <div>
            <Tag color="green">{sector}</Tag>
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
      title: "Vendedor Asignado",
      key: "vendedor_asignado",
      render: (_: any, record: Ruta) => {
        const vendedor = record.asignaciones?.find(asig => asig.tipo_usuario === 'vendedor');

        if (!vendedor) {
          return <span className="text-gray-400">Sin asignar</span>;
        }

        // Resaltar si es el vendedor actual
        const isCurrentUser = isVendedor && vendedor.identificacion_usuario === currentUser?.identificacion;

        return (
          <div>
            <div className={`font-medium flex items-center gap-1 ${isCurrentUser ? 'text-blue-600' : ''}`}>
              <DollarOutlined className={`${isCurrentUser ? 'text-blue-500' : 'text-green-500'}`} />
              {vendedor.identificacion_usuario}
              {isCurrentUser && <Tag color="blue">TÚ</Tag>}
            </div>
            <div className="text-sm text-gray-500">
              {vendedor.usuario?.nombre || 'Nombre no disponible'}
            </div>
          </div>
        );
      }
    },
    {
      title: "Visitas Programadas",
      key: "visitas",
      align: 'center',
      render: (_: any, record: Ruta) => {
        const visitas = record.asignaciones?.filter(asig => asig.id_ubicacion).length || 0;
        return (
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{visitas}</div>
            <div className="text-xs text-gray-500">visitas</div>
          </div>
        );
      }
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 120,
      render: (_: any, record: Ruta) => (
        <Space>
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => handleVerEnMapa(record)}
            title="Ver Ruta en Mapa"
            className="text-green-500 hover:text-green-700"
          />
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
              <DollarOutlined className="text-green-500" />
              {isVendedor ? 'Mis Ventas' : 'Gestión de Ventas'}
            </h2>
            <p className="text-gray-600">
              {getDescripcionComponent()} • Total ubicaciones: {ubicacionesClientes.length}
            </p>
            {isVendedor && currentUser && (
              <div className="mt-2">
                <Tag color="blue">Vendedor: {currentUser.identificacion} - {currentUser.nombre}</Tag>
              </div>
            )}
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
              const rutasEnSector = rutasVenta.filter(r => r.sector === sector).length;
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
              {isVendedor ? 'Mostrar Todas Mis Rutas' : 'Mostrar Todas las Rutas'}
            </Button>
          )}
        </div>

        {/* Información de filtros aplicados */}
        {rutaSeleccionada && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2">
              <DollarOutlined className="text-green-500" />
              <span className="font-medium">Visualizando ruta: {rutaSeleccionada.nombre}</span>
              <Tag color="green">Venta</Tag>
              <Tag color="blue">{rutaSeleccionada.sector}</Tag>
              {isVendedor && (
                <Tag color="blue">Mi Ruta</Tag>
              )}
            </div>
          </div>
        )}

        <Table
          dataSource={rutasVenta}
          columns={columns}
          rowKey="id_ruta"
          loading={loadingRutas}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} ${isVendedor ? 'rutas asignadas' : 'rutas de venta'}`
          }}
          locale={{
            emptyText: (
              <div className="text-center py-8">
                <DollarOutlined className="text-6xl text-gray-300 mb-4" />
                <div className="text-gray-500">
                  {isVendedor
                    ? "No tienes rutas de venta asignadas."
                    : "No hay rutas de venta registradas."
                  }
                  <br />
                  {!isVendedor && "Las rutas de venta se crean desde la sección \"Rutas\"."}
                </div>
              </div>
            )
          }}
          rowClassName={(record) =>
            rutaSeleccionada?.id_ruta === record.id_ruta ? 'bg-green-50' : ''
          }
        />
      </Card>

      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <EnvironmentOutlined />
            {isVendedor ? 'Mapa de Mis Rutas de Venta' : 'Mapa de Rutas de Venta'}
            {rutaSeleccionada && ` - ${rutaSeleccionada.nombre}`}
            {sectorSeleccionado && ` - Sector: ${sectorSeleccionado}`}
          </h3>
        </div>

        {loadingUbicaciones ? (
          <div className="text-center py-8">
            Cargando ubicaciones de venta...
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              Mostrando {ubicacionesFiltradas.length} ubicaciones de venta
              {rutaSeleccionada && ` para la ruta "${rutaSeleccionada.nombre}"`}
              {sectorSeleccionado && !rutaSeleccionada && ` en ${isVendedor ? 'mis ' : ''}rutas de venta del sector ${sectorSeleccionado}`}
              {!rutaSeleccionada && !sectorSeleccionado && ` (solo ubicaciones asignadas a ${isVendedor ? 'mis ' : ''}rutas de venta)`}
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
    </div>
  );
}