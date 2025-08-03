// import { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { Table, Typography } from 'antd';
// import axios from 'axios';

// const { Title } = Typography;

// export const FacturaDetalle = () => {
//   const { id } = useParams();
//   const [detalles, setDetalles] = useState([]);
//   const [factura, setFactura] = useState(null);

//   useEffect(() => {
//     axios.get(`http://127.0.0.1:8000/facturas/${id}`).then(res => setFactura(res.data));
//     axios.get(`http://127.0.0.1:8000/facturas/${id}/detalle`).then(res => setDetalles(res.data));
//   }, [id]);

//   const columns = [
//     { title: 'Producto', dataIndex: 'nombre' },
//     { title: 'Cantidad', dataIndex: 'cantidad' },
//     { title: 'Precio Unitario', dataIndex: 'precio_unitario' },
//     { title: 'IVA', dataIndex: 'iva_producto' },
//     { title: 'Subtotal', dataIndex: 'subtotal_lineal' }
//   ];

//   return (
//     <div>
//       <Title level={3}>Detalle Factura N° {factura?.numero_factura}</Title>
//       <p><strong>Cliente:</strong> {factura?.cod_cliente}</p>
//       <p><strong>Fecha:</strong> {factura?.fecha_emision}</p>
//       <Table
//         columns={columns}
//         rowKey="id_detalle_factura"
//         dataSource={detalles}
//         pagination={false}
//       />
//       <div style={{ textAlign: 'right', marginTop: 20 }}>
//         <p>Subtotal: ${factura?.subtotal}</p>
//         <p>IVA: ${factura?.iva}</p>
//         <p><strong>Total: ${factura?.total}</strong></p>
//       </div>
//     </div>
//   );
// };
