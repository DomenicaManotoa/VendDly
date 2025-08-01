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

const MapaClientes = ({ sectorSeleccionado }: Props) => {
  const clientesFiltrados = sectorSeleccionado
    ? clientes.filter(c => c.sector === sectorSeleccionado)
    : [];

const posicionInicial: [number, number] = clientesFiltrados.length > 0
  ? [clientesFiltrados[0].latitud, clientesFiltrados[0].longitud]
  : [-0.22985, -78.52495];

  return (
    <MapContainer center={posicionInicial} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {clientesFiltrados.map((cliente, idx) => (
        <Marker
          key={idx}
          position={[cliente.latitud, cliente.longitud]}
          icon={L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [30, 30] })}
        >
          <Popup>{cliente.nombre}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapaClientes;