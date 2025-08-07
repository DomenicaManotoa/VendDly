import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { UbicacionCliente, Ruta } from "../../../types/types";

type Props = {
  sectorSeleccionado: string | null;
  ubicacionesReales?: UbicacionCliente[];
  rutaSeleccionada?: Ruta | null; // Nueva prop para mostrar ruta específica
  mostrarRuta?: boolean; // Nueva prop para controlar si mostrar líneas de ruta
};

// Actualiza la función getIconBySector:
const getIconBySector = (sector: string, tipoRuta?: string, orden?: number) => {
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
      color = '#52c41a'; // Verde para ventas
      icon = '💰';
    } else {
      color = '#fa8c16'; // Naranja para entregas
      icon = '🚚';
    }
  }
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        font-size: 14px;
      ">
        ${icon}
        ${orden ? `<div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ff4d4f;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        ">${orden}</div>` : ''}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const MapaClientes = ({ 
  sectorSeleccionado, 
  ubicacionesReales = [], 
  rutaSeleccionada = null,
  mostrarRuta = false 
}: Props) => {
  // Solo usar ubicaciones reales
  const ubicacionesParaUsar: UbicacionCliente[] = ubicacionesReales;

  // Mostrar mensaje si no hay datos
  if (!ubicacionesParaUsar || ubicacionesParaUsar.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay ubicaciones disponibles
          </h3>
          <p className="text-gray-500">
            {sectorSeleccionado 
              ? `No se encontraron clientes en el sector "${sectorSeleccionado}"`
              : "No hay ubicaciones de clientes registradas"
            }
          </p>
        </div>
      </div>
    );
  }

  // Filtrar por sector si está seleccionado
  const clientesFiltrados: UbicacionCliente[] = sectorSeleccionado
    ? ubicacionesParaUsar.filter((ubicacion: UbicacionCliente) => ubicacion.sector === sectorSeleccionado)
    : ubicacionesParaUsar;

  // Posición inicial del mapa (Quito, Ecuador por defecto)
  const posicionInicial: [number, number] = [-0.22985, -78.52495];

  // Calcular el centro del mapa basado en todas las ubicaciones filtradas
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

  // Función para obtener color por sector
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

  // Preparar datos para la ruta si se está mostrando una ruta específica
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

  // Crear líneas de la ruta
  const lineasRuta = mostrarRuta && ubicacionesRuta.length > 1 
    ? ubicacionesRuta.map(ub => [ub.lat, ub.lng] as [number, number])
    : [];

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer 
        center={centroMapa} 
        zoom={clientesFiltrados.length > 1 ? 12 : 13} 
        style={{ height: "400px", width: "100%" }}
        key={`${sectorSeleccionado}-${clientesFiltrados.length}-${rutaSeleccionada?.id_ruta}`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {/* Mostrar todas las ubicaciones filtradas */}
        {clientesFiltrados.map((ubicacion: UbicacionCliente, idx: number) => {
          // Verificar si esta ubicación es parte de la ruta seleccionada
          const ubicacionEnRuta = rutaSeleccionada?.asignaciones?.find(
            asig => asig.id_ubicacion === ubicacion.id_ubicacion
          );
          
          return (
            <Marker
              key={ubicacion.id_ubicacion || idx}
              position={[ubicacion.latitud, ubicacion.longitud]}
              icon={getIconBySector(
                ubicacion.sector, 
                rutaSeleccionada?.tipo_ruta, 
                ubicacionEnRuta?.orden_visita
              )}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-semibold mb-2 text-blue-600">
                    Cliente: {ubicacion.cod_cliente}
                  </h4>
                  {rutaSeleccionada && ubicacionEnRuta && (
                    <div className="mb-2 p-2 bg-green-50 rounded">
                      <div className="text-sm font-medium text-green-700">
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
                    </div>
                  )}
                  <div className="space-y-1 text-sm">
                    <p><strong>📍 Dirección:</strong><br/>
                       <span className="text-gray-700">{ubicacion.direccion}</span>
                    </p>
                    <p><strong>🏘️ Sector:</strong> 
                      <span 
                        className="ml-1 px-2 py-1 rounded text-white text-xs"
                        style={{ backgroundColor: getSectorColor(ubicacion.sector) }}
                      >
                        {ubicacion.sector}
                      </span>
                    </p>
                    {ubicacion.referencia && (
                      <p><strong>📝 Referencia:</strong><br/>
                         <span className="text-gray-600">{ubicacion.referencia}</span>
                      </p>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <strong>Coordenadas:</strong><br/>
                        Lat: {ubicacion.latitud.toFixed(6)}<br/>
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

        {/* Mostrar líneas de ruta si está habilitado */}
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

      {/* Estadísticas en el mapa */}
      <div className="absolute top-2 right-2 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-[250px]">
        <h5 className="font-semibold mb-2 text-sm">
          📊 Resumen
        </h5>
        <div className="space-y-1 text-xs">
          <p>
            <strong>Total clientes:</strong> {clientesFiltrados.length}
          </p>
          {sectorSeleccionado && (
            <p>
              <strong>Sector:</strong> {sectorSeleccionado}
            </p>
          )}
          {rutaSeleccionada && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="font-medium text-green-700">
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

      {/* Leyenda de sectores */}
      {!sectorSeleccionado && clientesFiltrados.length > 0 && !rutaSeleccionada && (
        <div className="absolute bottom-2 left-2 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-[200px]">
          <h5 className="font-semibold mb-2 text-sm">🎨 Sectores</h5>
          <div className="space-y-1">
            {Array.from(new Set(clientesFiltrados.map((c: UbicacionCliente) => c.sector))).map((sector: string) => {
              const clientesEnSector = clientesFiltrados.filter((c: UbicacionCliente) => c.sector === sector).length;
              const color = getSectorColor(sector);
              
              return (
                <div key={sector} className="flex items-center text-xs">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 border border-white"
                    style={{ backgroundColor: color }}
                  />
                  <span>{sector} ({clientesEnSector})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leyenda de ruta si se está mostrando una */}
      {rutaSeleccionada && (
        <div className="absolute bottom-2 left-2 bg-white p-3 rounded-lg shadow-lg z-[1000] max-w-[250px]">
          <h5 className="font-semibold mb-2 text-sm">
            🚗 Ruta: {rutaSeleccionada.nombre}
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2 border border-white"
                style={{ backgroundColor: rutaSeleccionada.tipo_ruta === 'venta' ? '#52c41a' : '#fa8c16' }}
              />
              <span>{rutaSeleccionada.tipo_ruta === 'venta' ? 'Venta' : 'Entrega'}</span>
            </div>
            <p><strong>Sector:</strong> {rutaSeleccionada.sector}</p>
            <p><strong>Estado:</strong> {rutaSeleccionada.estado}</p>
            {rutaSeleccionada.fecha_ejecucion && (
              <p><strong>Fecha:</strong> {new Date(rutaSeleccionada.fecha_ejecucion).toLocaleDateString('es-ES')}</p>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="font-medium">Orden de visitas:</p>
              {ubicacionesRuta.map((ub, idx) => (
                <div key={idx} className="text-xs mt-1">
                  <span className="font-medium">#{ub.orden}:</span> {ub.cliente}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaClientes;