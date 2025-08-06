import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { UbicacionCliente } from "../../../types/types";

type Props = {
  rutas: {
    latitud: number;
    longitud: number;
    nombre?: string;
    direccion?: string;
    sector?: string;
    tipo_ruta?: string;
    [key: string]: any;
  }[];
};

// Íconos llamativos por tipo
const iconoRuta = (tipo: string = "") =>
  L.icon({
    iconUrl:
      tipo === "venta"
        ? "https://cdn-icons-png.flaticon.com/512/3144/3144456.png" // carrito rojo
        : "https://cdn-icons-png.flaticon.com/512/10435/10435117.png", // paquete azul
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });


const MapaClientes = ({ rutas }: Props) => {
  const rutasValidas = rutas.filter(
    (r) => typeof r.latitud === "number" && typeof r.longitud === "number"
  );

  const posicionInicial: [number, number] =
    rutasValidas.length > 0
      ? [rutasValidas[0].latitud, rutasValidas[0].longitud]
      : [-0.22985, -78.52495]; // Centro de Quito

  return (
    <MapContainer center={posicionInicial} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {rutasValidas.map((ruta, idx) => (
        <Marker
          key={idx}
          position={[ruta.latitud, ruta.longitud]}
          icon={iconoRuta(ruta.tipo_ruta?.toLowerCase())}
        >
          <Popup>
            <div>
              <strong>{ruta.sector} - {ruta.tipo_ruta}</strong><br />
              <span>{ruta.direccion}</span>
            </div>
          </Popup>
          <Tooltip>{ruta.nombre ?? ruta.sector}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapaClientes;
