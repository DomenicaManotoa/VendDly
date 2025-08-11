import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Input, Button, Card, message, Space } from 'antd';
import { SearchOutlined, EnvironmentOutlined, CloseOutlined } from '@ant-design/icons';
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
    const timer = setTimeout(() => {
      map.setView(center, zoom, { animate: true });
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
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.22985, -78.52495]);
  const [mapZoom, setMapZoom] = useState(13);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!readonly) {
      setClickedLocation({ lat, lng });
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
        
        const searchResultData = {
          lat,
          lng,
          address: displayName
        };
        
        setSearchResult(searchResultData);
        setClickedLocation(null);
        setMapCenter([lat, lng]);
        setMapZoom(16);
        
        if (onLocationSelect) {
          onLocationSelect(lat, lng, displayName);
        }
        
        message.success('Ubicación encontrada');
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

  const clearSearch = () => {
    setSearchValue('');
    setSearchResult(null);
    setClickedLocation(null);
    message.info('Búsqueda limpiada');
  };

  // Agrupar ubicaciones por sector
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
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Barra de búsqueda para modo edición */}
      {!readonly && (
        <div className={`mb-3 ${isMobile ? 'px-1' : ''}`}>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Search
                placeholder={isMobile ? "Buscar dirección..." : "Buscar dirección en Quito..."}
                enterButton={
                  <Button type="primary" loading={searchLoading} size={isMobile ? "large" : "middle"}>
                    <SearchOutlined />
                  </Button>
                }
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onSearch={handleSearch}
                loading={searchLoading}
                allowClear
                onClear={clearSearch}
                size={isMobile ? "large" : "middle"}
              />
            </div>
          </div>
          
          {/* Resultados de búsqueda */}
          {searchResult && (
            <div className={`mt-2 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded text-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <strong className="text-blue-700">📍 Ubicación encontrada:</strong>
                  <div className="text-gray-700 mt-1 break-words text-xs sm:text-sm">
                    {searchResult.address}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    Lat: {searchResult.lat.toFixed(6)}, Lng: {searchResult.lng.toFixed(6)}
                  </div>
                </div>
                <Button 
                  size="small" 
                  type="text" 
                  onClick={clearSearch}
                  icon={<CloseOutlined />}
                  className="shrink-0"
                />
              </div>
              {clickedLocation && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="text-green-700 text-xs">
                    <strong>💡 Coexistencia:</strong> Tienes búsqueda y ubicación manual activas.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenedor del mapa */}
      <div className="relative" style={{ height: isMobile ? '300px' : '400px' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          attributionControl={!isMobile} // Ocultar atribución en móvil para ahorrar espacio
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution={!isMobile ? "&copy; OpenStreetMap contributors" : ""}
          />
          
          <MapUpdater center={mapCenter} zoom={mapZoom} />
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
                <Popup maxWidth={isMobile ? 250 : 300}>
                  <div className={`p-2 ${isMobile ? 'min-w-[200px]' : 'min-w-[250px]'}`}>
                    <h4 className={`font-semibold mb-2 ${isMobile ? 'text-sm' : ''}`}>
                      Cliente: {ubicacion.cod_cliente}
                    </h4>
                    <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <p><strong>Dirección:</strong> <span className="break-words">{ubicacion.direccion}</span></p>
                      <p><strong>Sector:</strong> 
                        <span 
                          className="ml-1 px-2 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: getSectorColor(ubicacion.sector) }}
                        >
                          {ubicacion.sector}
                        </span>
                      </p>
                      {ubicacion.referencia && (
                        <p><strong>Referencia:</strong> <span className="break-words">{ubicacion.referencia}</span></p>
                      )}
                      <p><strong>Coordenadas:</strong></p>
                      <p className="text-xs text-gray-600 font-mono">
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

          {/* Marcador de búsqueda */}
          {!readonly && searchResult && (
            <Marker
              position={[searchResult.lat, searchResult.lng]}
              icon={searchResultIcon}
            >
              <Popup maxWidth={isMobile ? 250 : 300}>
                <div className={`p-2 ${isMobile ? 'min-w-[200px]' : 'min-w-[250px]'}`}>
                  <h4 className={`font-semibold mb-2 text-blue-600 ${isMobile ? 'text-sm' : ''}`}>
                    📍 Resultado de Búsqueda
                  </h4>
                  <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <p><strong>Dirección:</strong> <span className="break-words">{searchResult.address}</span></p>
                    <p><strong>Coordenadas:</strong></p>
                    <p className="text-xs text-gray-600 font-mono">
                      Lat: {searchResult.lat.toFixed(6)}<br/>
                      Lng: {searchResult.lng.toFixed(6)}
                    </p>
                    <div className="mt-2 p-1 bg-blue-100 rounded text-xs">
                      <strong>🔒 Persistente:</strong> Se mantiene hasta eliminarla manualmente
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcador para ubicación manual */}
          {!readonly && clickedLocation && (
            <Marker
              position={[clickedLocation.lat, clickedLocation.lng]}
              icon={newLocationIcon}
              zIndexOffset={1000}
            >
              <Popup maxWidth={isMobile ? 200 : 250}>
                <div className="p-2">
                  <h4 className={`font-semibold mb-2 text-green-600 ${isMobile ? 'text-sm' : ''}`}>
                    📌 Ubicación Manual
                  </h4>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <strong>Coordenadas:</strong><br/>
                    <span className="font-mono">
                      Lat: {clickedLocation.lat.toFixed(6)}<br/>
                      Lng: {clickedLocation.lng.toFixed(6)}
                    </span>
                  </p>
                  <div className="mt-2 p-1 bg-green-100 rounded text-xs">
                    <strong>✨ Clic en mapa:</strong> Coexiste con tu búsqueda
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcador para ubicación preseleccionada */}
          {!readonly && selectedLocation && !clickedLocation && !searchResult && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={selectedIcon}
            >
              <Popup maxWidth={isMobile ? 200 : 250}>
                <div className="p-2">
                  <h4 className={`font-semibold mb-2 text-orange-600 ${isMobile ? 'text-sm' : ''}`}>
                    🎯 Ubicación Preseleccionada
                  </h4>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <strong>Coordenadas:</strong><br/>
                    <span className="font-mono">
                      Lat: {selectedLocation.lat.toFixed(6)}<br/>
                      Lng: {selectedLocation.lng.toFixed(6)}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Indicador de ubicaciones activas - adaptativo */}
        {!readonly && (clickedLocation || searchResult) && (
          <div className={`absolute ${isMobile ? 'bottom-1 left-1' : 'bottom-2 left-2'} bg-white p-2 rounded shadow-lg z-[1000] ${isMobile ? 'text-xs' : 'text-xs'} ${isMobile ? 'max-w-[200px]' : ''}`}>
            <div className="font-semibold mb-1">🎯 Ubicaciones Activas:</div>
            {searchResult && (
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 shrink-0"></div>
                <span className="truncate">🔍 {isMobile ? 'Búsqueda' : `Búsqueda: ${searchValue}`}</span>
              </div>
            )}
            {clickedLocation && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 shrink-0"></div>
                <span className="truncate">📌 Manual: ({clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)})</span>
              </div>
            )}
            {!isMobile && (
              <div className="mt-1 text-gray-500">
                💡 Ambas ubicaciones permanecen visibles
              </div>
            )}
          </div>
        )}

        {/* Leyenda de sectores - solo desktop y modo readonly */}
        {!isMobile && readonly && ubicaciones.length > 0 && (
          <div className="absolute top-2 right-2 bg-white p-3 rounded shadow-lg z-[1000] max-w-[200px]">
            <h5 className="font-semibold mb-2 text-sm">Sectores</h5>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Object.keys(ubicacionesPorSector).map((sector) => (
                <div key={sector} className="flex items-center text-xs">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 shrink-0"
                    style={{ backgroundColor: getSectorColor(sector) }}
                  />
                  <span className="truncate" title={sector}>
                    {sector} ({ubicacionesPorSector[sector].length})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leyenda simplificada para móvil */}
        {isMobile && readonly && ubicaciones.length > 0 && (
          <div className="absolute top-1 right-1 bg-white p-2 rounded shadow-lg z-[1000] text-xs max-w-[150px]">
            <div className="font-semibold mb-1">{Object.keys(ubicacionesPorSector).length} Sectores</div>
            <div className="text-gray-500">
              {ubicaciones.length} ubicaciones
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaUbicacionCliente;