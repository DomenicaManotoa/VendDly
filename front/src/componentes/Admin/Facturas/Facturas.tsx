// import { useEffect, useState } from 'react';
// import { Table, Typography, Button } from 'antd';
// import axios from 'axios';

// const { Title } = Typography;

// export const Facturas = () => {
//   const [facturas, setFacturas] = useState([]);

//   useEffect(() => {
//     axios.get('http://127.0.0.1:8000/facturas')
//       .then(res => setFacturas(res.data))
//       .catch(err => console.error(err));
//   }, []);

//   const columns = [
//     { title: 'N° Factura', dataIndex: 'numero_factura' },
//     { title: 'Cliente', dataIndex: 'cod_cliente' },
//     { title: 'Fecha', dataIndex: 'fecha_emision' },
//     { title: 'Subtotal', dataIndex: 'subtotal' },
//     { title: 'IVA', dataIndex: 'iva' },
//     { title: 'Total', dataIndex: 'total' },
//     {
//       title: 'Acciones',
//       render: (_, factura) => (
//         <Button type="link" onClick={() => verDetalle(factura.id_factura)}>Ver detalle</Button>
//       )
//     }
//   ];

//   const verDetalle = (idFactura) => {
//     console.log("Ver detalle factura", idFactura);
//   };

//   return (
//     <div>
//       <Title level={3}>Facturas Emitidas</Title>
//       <Table
//         rowKey="id_factura"
//         columns={columns}
//         dataSource={facturas}
//         pagination={{ pageSize: 10 }}
//       />
//     </div>
//   );
// };

