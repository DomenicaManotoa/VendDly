import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

type Props = {
  sectorSeleccionado: string | null;
};

const clientes = [
  {
    cod_cliente: "CL001",
    nombre: "Tienda Juan",
    direccion: "Calle A y B",
    latitud: -0.22985,
    longitud: -78.52495,
    sector: "Centro",
  },
  {
    cod_cliente: "CL002",
    nombre: "Tienda María",
    direccion: "Calle C y D",
    latitud: -0.2291,
    longitud: -78.5268,
    sector: "Centro",
  },
  {
    cod_cliente: "CL003",
    nombre: "Tienda Pedro",
    direccion: "Calle E y F",
    latitud: -0.2285,
    longitud: -78.5252,
    sector: "Centro",
  },
];

// Puedes filtrar por sector si lo deseas
const MapaClientes = ({ sectorSeleccionado }: Props) => {
  const clientesFiltrados = sectorSeleccionado
    ? clientes.filter(c => c.sector === sectorSeleccionado)
    : clientes; // Mostrar todos si no hay filtro

  const posicionInicial: [number, number] = clientesFiltrados.length > 0
    ? [clientesFiltrados[0].latitud, clientesFiltrados[0].longitud]
    : [-0.22985, -78.52495];

  // Icono igual que en Rutas_Transportista
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  return (
    <MapContainer center={posicionInicial} zoom={13} style={{ height: "400px", width: "100%", borderRadius: 8 }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clientesFiltrados.map((cliente, idx) => (
        <Marker key={idx} position={[cliente.latitud, cliente.longitud]}>
          <Popup>
            <b>{cliente.nombre}</b>
            <br />
            {cliente.direccion}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapaClientes;