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

const getIconBySector = (sector: string, tipoRuta?: string, orden?: number) => {
  const sectorColors: Record<string, string> = {
    Centro: "#1890ff",
    Norte: "#52c41a",
    Sur: "#faad14",
    Este: "#f5222d",
    Oeste: "#722ed1",
    default: "#8c8c8c",
  };

  let color = sectorColors[sector] || sectorColors.default;
  let icon = "📍";

  if (tipoRuta) {
    if (tipoRuta === "venta") {
      color = "#52c41a";
      icon = "💰";
    } else {
      color = "#fa8c16";
      icon = "🚚";
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
        ${
          orden
            ? `<div style="
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
        ">${orden}</div>`
            : ""
        }
      </div>
    `,
    className: "custom-div-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const MapaClientes = ({
  sectorSeleccionado,
  ubicacionesReales = [],
  rutaSeleccionada = null,
  mostrarRuta = false,
}: Props) => {
  const ubicacionesParaUsar: UbicacionCliente[] = ubicacionesReales;

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
              : "No hay ubicaciones de clientes registradas"}
          </p>
        </div>
      </div>
    );
  }

  const clientesFiltrados: UbicacionCliente[] = sectorSeleccionado
    ? ubicacionesParaUsar.filter((u) => u.sector === sectorSeleccionado)
    : ubicacionesParaUsar;

  const posicionInicial: [number, number] = [-0.22985, -78.52495];

  const calcularCentro = (): [number, number] => {
    if (clientesFiltrados.length === 0) return posicionInicial;
    const latSum = clientesFiltrados.reduce((sum, c) => sum + c.latitud, 0);
    const lngSum = clientesFiltrados.reduce((sum, c) => sum + c.longitud, 0);
    return [latSum / clientesFiltrados.length, lngSum / clientesFiltrados.length];
  };

  const centroMapa = calcularCentro();

  const getSectorColor = (sector: string): string => {
    const sectorColors: Record<string, string> = {
      Centro: "#1890ff",
      Norte: "#52c41a",
      Sur: "#faad14",
      Este: "#f5222d",
      Oeste: "#722ed1",
    };
    return sectorColors[sector] || "#8c8c8c";
  };

  const ubicacionesRuta =
    rutaSeleccionada?.asignaciones
      ?.filter((a) => a.id_ubicacion && a.ubicacion_info)
      .sort((a, b) => (a.orden_visita || 0) - (b.orden_visita || 0))
      .map((a) => ({
        lat: a.ubicacion_info!.latitud,
        lng: a.ubicacion_info!.longitud,
        orden: a.orden_visita,
        cliente: a.cod_cliente,
        direccion: a.ubicacion_info!.direccion,
      })) || [];

  const lineasRuta =
    mostrarRuta && ubicacionesRuta.length > 1
      ? ubicacionesRuta.map((ub) => [ub.lat, ub.lng] as [number, number])
      : [];

  return (
    <div className="relative w-full">
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

        {clientesFiltrados.map((ubicacion, idx) => {
          const ubicacionEnRuta = rutaSeleccionada?.asignaciones?.find(
            (a) => a.id_ubicacion === ubicacion.id_ubicacion
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
                        Tipo: {rutaSeleccionada.tipo_ruta === "venta" ? "Venta" : "Entrega"}
                      </div>
                      {ubicacionEnRuta.identificacion_usuario && (
                        <div className="text-xs text-green-600">
                          Asignado a: {ubicacionEnRuta.identificacion_usuario}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>📍 Dirección:</strong>
                      <br />
                      <span className="text-gray-700">{ubicacion.direccion}</span>
                    </p>
                    <p>
                      <strong>🏘️ Sector:</strong>
                      <span
                        className="ml-1 px-2 py-1 rounded text-white text-xs"
                        style={{ backgroundColor: getSectorColor(ubicacion.sector) }}
                      >
                        {ubicacion.sector}
                      </span>
                    </p>
                    {ubicacion.referencia && (
                      <p>
                        <strong>📝 Referencia:</strong>
                        <br />
                        <span className="text-gray-600">{ubicacion.referencia}</span>
                      </p>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <strong>Coordenadas:</strong>
                        <br />
                        Lat: {ubicacion.latitud.toFixed(6)}
                        <br />
                        Lng: {ubicacion.longitud.toFixed(6)}
                      </p>
                      {ubicacion.fecha_registro && (
                        <p className="text-xs text-gray-400 mt-1">
                          Registrado:{" "}
                          {new Date(ubicacion.fecha_registro).toLocaleDateString("es-ES")}
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
              color: rutaSeleccionada?.tipo_ruta === "venta" ? "#52c41a" : "#fa8c16",
              weight: 4,
              opacity: 0.8,
              dashArray: "10, 5",
            }}
          />
        )}
      </MapContainer>

      {/* 📊 Panel resumen */}
      <div className="absolute top-2 right-2 bg-white p-3 rounded-lg shadow-md border z-[1000] w-[90%] max-w-[250px] md:w-auto">
        <h5 className="font-semibold mb-2 text-sm">📊 Resumen</h5>
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
              <p className="font-medium text-green-700">🚗 {rutaSeleccionada.nombre}</p>
              <p>
                <strong>Tipo:</strong>{" "}
                {rutaSeleccionada.tipo_ruta === "venta" ? "Venta" : "Entrega"}
              </p>
              <p>
                <strong>Paradas:</strong> {rutaSeleccionada.asignaciones?.length || 0}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🎨 Leyenda sectores */}
      {!sectorSeleccionado && clientesFiltrados.length > 0 && !rutaSeleccionada && (
        <div className="absolute bottom-2 left-2 bg-white p-3 rounded-lg shadow-md border z-[1000] w-[90%] max-w-[200px] md:w-auto">
          <h5 className="font-semibold mb-2 text-sm">🎨 Sectores</h5>
          <div className="space-y-1">
            {Array.from(new Set(clientesFiltrados.map((c) => c.sector))).map((sector) => {
              const clientesEnSector = clientesFiltrados.filter((c) => c.sector === sector).length;
              const color = getSectorColor(sector);
              return (
                <div key={sector} className="flex items-center text-xs">
                  <div
                    className="w-3 h-3 rounded-full mr-2 border border-white"
                    style={{ backgroundColor: color }}
                  />
                  <span>
                    {sector} ({clientesEnSector})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🗺️ Detalle ruta */}
      {rutaSeleccionada && (
        <div className="absolute bottom-2 left-2 bg-white p-3 rounded-lg shadow-md border z-[1000] w-[90%] max-w-[250px] md:w-auto">
          <h5 className="font-semibold mb-2 text-sm">🚗 Ruta: {rutaSeleccionada.nombre}</h5>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2 border border-white"
                style={{
                  backgroundColor:
                    rutaSeleccionada.tipo_ruta === "venta" ? "#52c41a" : "#fa8c16",
                }}
              />
              <span>{rutaSeleccionada.tipo_ruta === "venta" ? "Venta" : "Entrega"}</span>
            </div>
            <p>
              <strong>Sector:</strong> {rutaSeleccionada.sector}
            </p>
            <p>
              <strong>Estado:</strong> {rutaSeleccionada.estado}
            </p>
            {rutaSeleccionada.fecha_ejecucion && (
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(rutaSeleccionada.fecha_ejecucion).toLocaleDateString("es-ES")}
              </p>
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
