import { useEffect, useState } from "react";
import MapaClientes from "componentes/Admin/Rutas/MapaClientes";

const RutasTransportista = () => {
  const [rutas, setRutas] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/rutas")
      .then(res => res.json())
      .then(data => setRutas(data.filter((ruta: any) => ruta.tipo_ruta === "entrega")));
  }, []);

  return (
    <div>
      <h2>Rutas de Entrega</h2>
      <MapaClientes rutas={rutas} />
    </div>
  );
};

export default RutasTransportista;