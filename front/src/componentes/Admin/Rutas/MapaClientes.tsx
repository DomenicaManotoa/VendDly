import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { UbicacionCliente, Ruta } from "../../../types/types";

type Props = {
  sectorSeleccionado: string | null;
  ubicacionesReales?: UbicacionCliente[];
  rutaSeleccionada?: Ruta | null;
  mostrarRuta?: boolean;
};

const getIconBySector = (sector: string, tipoRuta?: string, orden?: number, tienePedido?: boolean) => {
  const sectorColors: Record<string, string> = {
    'Centro': '#1890ff',
    'Norte': '#52c41a',
    'Sur': '#faad14',
    'Este': '#f5222d',
    'Oeste': '#722ed1',
    'default': '#8c8c8c'
  };

  let color = sectorColors[sector] || sectorColors.default;
  let icon = '📍';

  if (tipoRuta) {
    if (tipoRuta === 'venta') {
      color = '#52c41a';
      icon = '💰';
    } else {
      color = tienePedido ? '#fa8c16' : '#d9d9d9';
      icon = tienePedido ? '🚚📦' : '🚚';
    }
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        font-size: 12px;
      ">
        ${icon}
        ${orden ? `<div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ff4d4f;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        ">${orden}</div>` : ''}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const MapaClientes = ({
  sectorSeleccionado,
  ubicacionesReales = [],
  rutaSeleccionada = null,
  mostrarRuta = false
}: Props) => {
  const ubicacionesParaUsar: UbicacionCliente[] = ubicacionesReales;

  if (!ubicacionesParaUsar || ubicacionesParaUsar.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-80 md:h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center px-4">
          <div className="text-gray-400 text-4xl sm:text-5xl md:text-6xl mb-4">📍</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No hay ubicaciones disponibles
          </h3>
          <p className="text-sm sm:text-base text-gray-500 text-center">
            {sectorSeleccionado
              ? `No se encontraron clientes en el sector "${sectorSeleccionado}"`
              : "No hay ubicaciones de clientes registradas"
            }
          </p>
        </div>
      </div>
    );
  }

  const clientesFiltrados: UbicacionCliente[] = sectorSeleccionado
    ? ubicacionesParaUsar.filter((ubicacion: UbicacionCliente) => ubicacion.sector === sectorSeleccionado)
    : ubicacionesParaUsar;

  const posicionInicial: [number, number] = [-0.22985, -78.52495];

  const calcularCentro = (): [number, number] => {
    if (clientesFiltrados.length === 0) return posicionInicial;

    const latSum = clientesFiltrados.reduce((sum: number, cliente: UbicacionCliente) => sum + cliente.latitud, 0);
    const lngSum = clientesFiltrados.reduce((sum: number, cliente: UbicacionCliente) => sum + cliente.longitud, 0);

    return [
      latSum / clientesFiltrados.length,
      lngSum / clientesFiltrados.length
    ];
  };

  const centroMapa = calcularCentro();

  const getSectorColor = (sector: string): string => {
    const sectorColors: Record<string, string> = {
      'Centro': '#1890ff',
      'Norte': '#52c41a',
      'Sur': '#faad14',
      'Este': '#f5222d',
      'Oeste': '#722ed1'
    };
    return sectorColors[sector] || '#8c8c8c';
  };

  const ubicacionesRuta = rutaSeleccionada && rutaSeleccionada.asignaciones
    ? rutaSeleccionada.asignaciones
      .filter(asig => asig.id_ubicacion && asig.ubicacion_info)
      .sort((a, b) => (a.orden_visita || 0) - (b.orden_visita || 0))
      .map(asig => ({
        lat: asig.ubicacion_info!.latitud,
        lng: asig.ubicacion_info!.longitud,
        orden: asig.orden_visita,
        cliente: asig.cod_cliente,
        direccion: asig.ubicacion_info!.direccion
      }))
    : [];

  const lineasRuta = mostrarRuta && ubicacionesRuta.length > 1
    ? ubicacionesRuta.map(ub => [ub.lat, ub.lng] as [number, number])
    : [];

  return (
    <div className="relative">
      <MapContainer
        center={centroMapa}
        zoom={clientesFiltrados.length > 1 ? 12 : 13}
        style={{ height: "300px", width: "100%" }}
        className="sm:!h-80 md:!h-96 lg:!h-[500px]"
        key={`${sectorSeleccionado}-${clientesFiltrados.length}-${rutaSeleccionada?.id_ruta}`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {clientesFiltrados.map((ubicacion: UbicacionCliente, idx: number) => {
          const ubicacionEnRuta = rutaSeleccionada?.asignaciones?.find(
            asig => asig.id_ubicacion === ubicacion.id_ubicacion
          );

          const tienePedido = rutaSeleccionada?.tipo_ruta === 'entrega' && 
            rutaSeleccionada.pedido_info !== null && 
            rutaSeleccionada.pedido_info !== undefined;

          return (
            <Marker
              key={ubicacion.id_ubicacion || idx}
              position={[ubicacion.latitud, ubicacion.longitud]}
              icon={getIconBySector(
                ubicacion.sector,
                rutaSeleccionada?.tipo_ruta,
                ubicacionEnRuta?.orden_visita,
                rutaSeleccionada?.pedido_info !== null && rutaSeleccionada?.pedido_info !== undefined
              )}
            >
              <Popup>
                <div className="p-2 min-w-[180px] sm:min-w-[220px] md:min-w-[250px]">
                  <h4 className="font-semibold mb-2 text-blue-600 text-sm sm:text-base">
                    Cliente: {ubicacion.cod_cliente}
                  </h4>

                  {rutaSeleccionada && ubicacionEnRuta && (
                    <div className="mb-2 p-2 bg-green-50 rounded">
                      <div className="text-xs sm:text-sm font-medium text-green-700">
                        🚗 Ruta: {rutaSeleccionada.nombre}
                      </div>
                      <div className="text-xs text-green-600">
                        Orden de visita: #{ubicacionEnRuta.orden_visita}
                      </div>
                      <div className="text-xs text-green-600">
                        Tipo: {rutaSeleccionada.tipo_ruta === 'venta' ? 'Venta' : 'Entrega'}
                      </div>
                      {ubicacionEnRuta.identificacion_usuario && (
                        <div className="text-xs text-green-600">
                          Asignado a: {ubicacionEnRuta.identificacion_usuario}
                        </div>
                      )}

                      {rutaSeleccionada.tipo_ruta === 'entrega' && rutaSeleccionada.pedido_info && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <div className="text-xs sm:text-sm font-medium text-orange-700">
                            📦 Pedido de la ruta
                          </div>
                          <div className="text-xs mt-1 p-1 bg-orange-50 rounded">
                            <div className="font-medium">{rutaSeleccionada.pedido_info.numero_pedido}</div>
                            <div className="text-green-600">${rutaSeleccionada.pedido_info.total.toFixed(2)}</div>
                            <div className="text-gray-500">{rutaSeleccionada.pedido_info.estado}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1 text-xs sm:text-sm">
                    <p><strong>📍 Dirección:</strong><br />
                      <span className="text-gray-700">{ubicacion.direccion}</span>
                    </p>
                    <p className="flex flex-wrap items-center gap-1">
                      <strong>🏘️ Sector:</strong>
                      <span
                        className="px-2 py-1 rounded text-white text-xs"
                        style={{ backgroundColor: getSectorColor(ubicacion.sector) }}
                      >
                        {ubicacion.sector}
                      </span>
                    </p>
                    {ubicacion.referencia && (
                      <p><strong>📝 Referencia:</strong><br />
                        <span className="text-gray-600">{ubicacion.referencia}</span>
                      </p>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <strong>Coordenadas:</strong><br />
                        Lat: {ubicacion.latitud.toFixed(6)}<br />
                        Lng: {ubicacion.longitud.toFixed(6)}
                      </p>
                      {ubicacion.fecha_registro && (
                        <p className="text-xs text-gray-400 mt-1">
                          Registrado: {new Date(ubicacion.fecha_registro).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {mostrarRuta && lineasRuta.length > 1 && (
          <Polyline
            positions={lineasRuta}
            pathOptions={{
              color: rutaSeleccionada?.tipo_ruta === 'venta' ? '#52c41a' : '#fa8c16',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 5'
            }}
          />
        )}
      </MapContainer>

      {/* Panel de resumen - Responsive */}
      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-white p-2 sm:p-3 rounded-lg shadow-lg z-[1000] 
                    max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[250px]">
        <h5 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
          📊 Resumen
        </h5>
        <div className="space-y-0.5 sm:space-y-1 text-xs">
          <p>
            <strong>Clientes:</strong> {clientesFiltrados.length}
          </p>
          {sectorSeleccionado && (
            <p className="truncate">
              <strong>Sector:</strong> {sectorSeleccionado}
            </p>
          )}
          {rutaSeleccionada && (
            <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200">
              <p className="font-medium text-green-700 text-xs truncate">
                🚗 {rutaSeleccionada.nombre}
              </p>
              <p>
                <strong>Tipo:</strong> {rutaSeleccionada.tipo_ruta === 'venta' ? 'Venta' : 'Entrega'}
              </p>
              <p>
                <strong>Paradas:</strong> {rutaSeleccionada.asignaciones?.length || 0}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda de sectores - Responsive */}
      {!sectorSeleccionado && clientesFiltrados.length > 0 && !rutaSeleccionada && (
        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-white p-2 sm:p-3 rounded-lg shadow-lg z-[1000] 
                      max-w-[140px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[200px]">
          <h5 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">🎨 Sectores</h5>
          <div className="space-y-0.5 sm:space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
            {Array.from(new Set(clientesFiltrados.map((c: UbicacionCliente) => c.sector))).map((sector: string) => {
              const clientesEnSector = clientesFiltrados.filter((c: UbicacionCliente) => c.sector === sector).length;
              const color = getSectorColor(sector);

              return (
                <div key={sector} className="flex items-center text-xs">
                  <div
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 border border-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{sector} ({clientesEnSector})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leyenda de ruta - Responsive */}
      {rutaSeleccionada && (
        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-white p-2 sm:p-3 rounded-lg shadow-lg z-[1000] 
                      max-w-[160px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[250px]">
          <h5 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm truncate">
            🚗 {rutaSeleccionada.nombre}
          </h5>
          <div className="space-y-0.5 sm:space-y-1 text-xs">
            <div className="flex items-center">
              <div
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 border border-white flex-shrink-0"
                style={{ backgroundColor: rutaSeleccionada.tipo_ruta === 'venta' ? '#52c41a' : '#fa8c16' }}
              />
              <span>{rutaSeleccionada.tipo_ruta === 'venta' ? 'Venta' : 'Entrega'}</span>
            </div>
            <p className="truncate"><strong>Sector:</strong> {rutaSeleccionada.sector}</p>
            <p><strong>Estado:</strong> {rutaSeleccionada.estado}</p>
            {rutaSeleccionada.fecha_ejecucion && (
              <p className="text-xs"><strong>Fecha:</strong> {new Date(rutaSeleccionada.fecha_ejecucion).toLocaleDateString('es-ES')}</p>
            )}
            <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200 max-h-16 sm:max-h-20 overflow-y-auto">
              <p className="font-medium text-xs">Orden de visitas:</p>
              {ubicacionesRuta.slice(0, 3).map((ub, idx) => (
                <div key={idx} className="text-xs mt-0.5 truncate">
                  <span className="font-medium">#{ub.orden}:</span> {ub.cliente}
                </div>
              ))}
              {ubicacionesRuta.length > 3 && (
                <div className="text-xs text-gray-500 mt-0.5">
                  +{ubicacionesRuta.length - 3} más
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaClientes;