import { useEffect, useState } from "react";
import MapaClientes from "componentes/Admin/Rutas/MapaClientes";

const RutasVendedor = () => {
  const [rutas, setRutas] = useState<any[]>([]);

  useEffect(() => {
  fetch("http://localhost:8000/rutas")
    .then(res => res.json())
    .then(data => {
      console.log("Respuesta del backend:", data);
      setRutas(Array.isArray(data) ? data.filter((ruta: any) => ruta.tipo_ruta === "venta") : []);
    });
}, []);

  return (
    <div>
      <h2>Rutas de Venta</h2>
      <MapaClientes rutas={rutas} />
    </div>
  );
};

export default RutasVendedor;
