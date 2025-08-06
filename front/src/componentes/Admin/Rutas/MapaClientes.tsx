import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { UbicacionCliente } from "../../../types/types";

type Props = {
  sectorSeleccionado: string | null;
  ubicacionesReales?: UbicacionCliente[];
};

// Configurar iconos personalizados por sector
const getIconBySector = (sector: string) => {
  const sectorColors: Record<string, string> = {
    'Centro': '#1890ff',
    'Norte': '#52c41a',
    'Sur': '#faad14',
    'Este': '#f5222d',
    'Oeste': '#722ed1',
    'default': '#8c8c8c'
  };

  const color = sectorColors[sector] || sectorColors.default;
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const MapaClientes = ({ sectorSeleccionado, ubicacionesReales = [] }: Props) => {
  // Solo usar ubicaciones reales - eliminar datos simulados
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

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer 
        center={centroMapa} 
        zoom={clientesFiltrados.length > 1 ? 12 : 13} 
        style={{ height: "400px", width: "100%" }}
        key={`${sectorSeleccionado}-${clientesFiltrados.length}`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {clientesFiltrados.map((ubicacion: UbicacionCliente, idx: number) => (
          <Marker
            key={ubicacion.id_ubicacion || idx}
            position={[ubicacion.latitud, ubicacion.longitud]}
            icon={getIconBySector(ubicacion.sector)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h4 className="font-semibold mb-2 text-blue-600">
                  Cliente: {ubicacion.cod_cliente}
                </h4>
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
        ))}
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
        </div>
      </div>

      {/* Leyenda de sectores */}
      {!sectorSeleccionado && clientesFiltrados.length > 0 && (
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
    </div>
  );
};

export default MapaClientes;