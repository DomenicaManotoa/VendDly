import React, { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Input, Button, Card, message } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import L from 'leaflet';
import { MapaUbicacionProps, UbicacionCliente } from '../../../types/types';

const { Search } = Input;

// Configurar iconos personalizados
const defaultIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const selectedIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

const newLocationIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const searchResultIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45]
});

// Componente para manejar clics en el mapa
const MapClickHandler: React.FC<{
  onLocationSelect?: (lat: number, lng: number) => void;
  readonly: boolean;
}> = ({ onLocationSelect, readonly }) => {
  useMapEvents({
    click: (e) => {
      if (!readonly && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

// Componente para centrar el mapa en una ubicación específica
const MapUpdater: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom = 13 }) => {
  const map = useMap();
  
  React.useEffect(() => {
    // Usar setTimeout para evitar problemas de renderizado
    const timer = setTimeout(() => {
      map.setView(center, zoom, { animate: true });
      // Invalidar el tamaño para asegurar que se renderice correctamente
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map, center, zoom]);
  
  return null;
};

const MapaUbicacionCliente: React.FC<MapaUbicacionProps> = ({
  ubicaciones = [],
  onLocationSelect,
  selectedLocation,
  readonly = true
}) => {
  // Estado para mantener búsqueda completamente independiente de clics en mapa
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.22985, -78.52495]); // Centro de Quito
  const [mapZoom, setMapZoom] = useState(13);
  
  // AGREGADO: Estado para ubicación clickeada manualmente (separada de búsqueda)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // SIMPLIFICADO: Solo mantener el resultado de búsqueda actual
  const [searchPersistent, setSearchPersistent] = useState(true); // Flag para mantener búsqueda

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!readonly) {
      setClickedLocation({ lat, lng });
      // MANTENER el searchResult y searchValue intactos
      // NO llamar a ninguna función que los resetee
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
    }
  }, [readonly, onLocationSelect]);

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('Por favor ingrese una dirección para buscar');
      return;
    }

    setSearchLoading(true);
    try {
      // Agregar contexto de Ecuador para mejorar la búsqueda
      const searchQuery = `${value}, Quito, Ecuador`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=ec&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const displayName = result.display_name;
        
        // CORREGIDO: Crear el objeto searchResult correctamente
        const searchResultData = {
          lat,
          lng,
          address: displayName
        };
        
        // Actualizar estado - SIN afectar searchResult ni searchValue
        setSearchResult(searchResultData);
        setClickedLocation(null); // Solo limpiar clic manual, no búsqueda
        setMapCenter([lat, lng]);
        setMapZoom(16); // Zoom más cercano para búsquedas
        
        // Notificar al componente padre CON la dirección para que la identifique como búsqueda
        if (onLocationSelect) {
          onLocationSelect(lat, lng, displayName);
        }
        
        message.success(`Ubicación encontrada: ${displayName}`);
      } else {
        message.warning('No se encontró la ubicación. Intente con una dirección más específica.');
      }
    } catch (error) {
      console.error('Error al buscar ubicación:', error);
      message.error('Error al buscar la ubicación. Intente nuevamente.');
    } finally {
      setSearchLoading(false);
    }
  };

  // MODIFICADO: Función para limpiar SOLO cuando usuario lo solicite
  const clearSearch = () => {
    setSearchValue('');
    setSearchResult(null);
    setClickedLocation(null);
    message.info('Búsqueda limpiada');
  };

  // Agrupar ubicaciones por sector para mejor visualización
  const ubicacionesPorSector = ubicaciones.reduce((acc, ubicacion) => {
    const sector = ubicacion.sector;
    if (!acc[sector]) {
      acc[sector] = [];
    }
    acc[sector].push(ubicacion);
    return acc;
  }, {} as Record<string, UbicacionCliente[]>);

  const sectoresColores = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#096dd9'
  ];

  const getSectorColor = (sector: string) => {
    const index = Object.keys(ubicacionesPorSector).indexOf(sector);
    return sectoresColores[index % sectoresColores.length];
  };

  return (
    <div style={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Barra de búsqueda persistente fuera del mapa (solo en modo edición) */}
      {!readonly && (
        <div className="mb-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Search
                placeholder="Buscar dirección en Quito... (ej: Av. Amazonas y Naciones Unidas)"
                enterButton={
                  <Button type="primary" loading={searchLoading}>
                    <SearchOutlined />
                  </Button>
                }
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onSearch={handleSearch}
                loading={searchLoading}
                allowClear
                onClear={clearSearch}
                size="middle"
              />
            </div>
          </div>
          
          {/* MEJORADO: Resultados de búsqueda - SIEMPRE persistentes */}
          {searchResult && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-blue-700">📍 Ubicación de búsqueda:</strong>
                  <div className="text-gray-700 mt-1">{searchResult.address}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    Lat: {searchResult.lat.toFixed(6)}, Lng: {searchResult.lng.toFixed(6)}
                  </div>
                </div>
                <Button size="small" type="text" onClick={clearSearch}>×</Button>
              </div>
              {clickedLocation && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="text-green-700 text-xs">
                    <strong>💡 Coexistencia:</strong> Tienes tanto la ubicación de búsqueda como una ubicación manual. 
                    Ambas se mantienen visibles para tu referencia.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {/* Actualizar vista del mapa cuando cambie el centro */}
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* Handler para clics en el mapa */}
        <MapClickHandler 
          onLocationSelect={handleMapClick}
          readonly={readonly}
        />

        {/* Marcadores de ubicaciones existentes */}
        {ubicaciones.map((ubicacion) => {
          const isSelected = selectedLocation && 
            Math.abs(selectedLocation.lat - ubicacion.latitud) < 0.0001 &&
            Math.abs(selectedLocation.lng - ubicacion.longitud) < 0.0001;

          return (
            <Marker
              key={ubicacion.id_ubicacion || `${ubicacion.latitud}-${ubicacion.longitud}`}
              position={[ubicacion.latitud, ubicacion.longitud]}
              icon={isSelected ? selectedIcon : defaultIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-semibold mb-2">
                    Cliente: {ubicacion.cod_cliente}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Dirección:</strong> {ubicacion.direccion}</p>
                    <p><strong>Sector:</strong> 
                      <span 
                        className="ml-1 px-2 py-1 rounded text-white text-xs"
                        style={{ backgroundColor: getSectorColor(ubicacion.sector) }}
                      >
                        {ubicacion.sector}
                      </span>
                    </p>
                    {ubicacion.referencia && (
                      <p><strong>Referencia:</strong> {ubicacion.referencia}</p>
                    )}
                    <p><strong>Coordenadas:</strong></p>
                    <p className="text-xs text-gray-600">
                      Lat: {ubicacion.latitud.toFixed(6)}<br/>
                      Lng: {ubicacion.longitud.toFixed(6)}
                    </p>
                    {ubicacion.fecha_registro && (
                      <p className="text-xs text-gray-500">
                        Registrado: {new Date(ubicacion.fecha_registro).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* MARCADOR DE BÚSQUEDA - SIEMPRE visible si existe searchResult */}
        {!readonly && searchResult && (
          <Marker
            position={[searchResult.lat, searchResult.lng]}
            icon={searchResultIcon}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h4 className="font-semibold mb-2 text-blue-600">
                  📍 Resultado de Búsqueda
                </h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Dirección:</strong> {searchResult.address}</p>
                  <p><strong>Coordenadas:</strong></p>
                  <p className="text-xs text-gray-600">
                    Lat: {searchResult.lat.toFixed(6)}<br/>
                    Lng: {searchResult.lng.toFixed(6)}
                  </p>
                  <div className="mt-2 p-1 bg-blue-100 rounded text-xs">
                    <strong>🔒 Persistente:</strong> Esta ubicación se mantiene hasta que la elimines manualmente
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador para nueva ubicación seleccionada manualmente - NO interfiere con búsqueda */}
        {!readonly && clickedLocation && (
          <Marker
            position={[clickedLocation.lat, clickedLocation.lng]}
            icon={newLocationIcon}
            zIndexOffset={1000} // Asegurar que aparezca encima
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold mb-2 text-green-600">
                  📌 Ubicación Manual
                </h4>
                <p className="text-sm">
                  <strong>Coordenadas:</strong><br/>
                  Lat: {clickedLocation.lat.toFixed(6)}<br/>
                  Lng: {clickedLocation.lng.toFixed(6)}
                </p>
                <div className="mt-2 p-1 bg-green-100 rounded text-xs">
                  <strong>✨ Clic en mapa:</strong> Esta ubicación coexiste con tu búsqueda
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador para ubicación seleccionada (en modo edición) - solo si no hay otros marcadores */}
        {!readonly && selectedLocation && !clickedLocation && !searchResult && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={selectedIcon}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold mb-2 text-orange-600">
                  🎯 Ubicación Preseleccionada
                </h4>
                <p className="text-sm">
                  <strong>Coordenadas:</strong><br/>
                  Lat: {selectedLocation.lat.toFixed(6)}<br/>
                  Lng: {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* INDICADOR SIMPLIFICADO de ubicaciones activas */}
      {!readonly && (clickedLocation || searchResult) && (
        <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-lg z-[1000] text-xs">
          <div className="font-semibold mb-1">🎯 Ubicaciones Activas:</div>
          {searchResult && (
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>🔍 Búsqueda: {searchValue}</span>
            </div>
          )}
          {clickedLocation && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>📌 Manual: ({clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)})</span>
            </div>
          )}
          <div className="mt-1 text-gray-500">
            💡 Ambas ubicaciones permanecen visibles
          </div>
        </div>
      )}

      {/* Leyenda de sectores (solo si hay ubicaciones y en modo readonly) */}
      {readonly && ubicaciones.length > 0 && (
        <div className="absolute top-2 right-2 bg-white p-3 rounded shadow-lg z-[1000] max-w-[200px]">
          <h5 className="font-semibold mb-2 text-sm">Sectores</h5>
          <div className="space-y-1">
            {Object.keys(ubicacionesPorSector).map((sector) => (
              <div key={sector} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getSectorColor(sector) }}
                />
                <span>{sector} ({ubicacionesPorSector[sector].length})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaUbicacionCliente;