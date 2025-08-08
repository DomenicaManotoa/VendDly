import { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Row,
  Col,
  Tag,
  Typography,
  message,
} from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para íconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Ruta {
  key: string;
  cliente: string;
  direccion: string;
  dia: string;
  estado: 'pendiente' | 'completada';
  coordenadas: [number, number];
}

const rutasData: Ruta[] = [
  {
    key: '1',
    cliente: 'Panadería San Juan',
    direccion: 'Av. Quito y 10 de Agosto',
    dia: 'Lunes',
    estado: 'pendiente',
    coordenadas: [-0.2201, -78.5126],
  },
  {
    key: '2',
    cliente: 'Tienda La Económica',
    direccion: 'Calle Bolívar y Rocafuerte',
    dia: 'Lunes',
    estado: 'completada',
    coordenadas: [-0.2262, -78.5131],
  },
  {
    key: '3',
    cliente: 'Supermercado El Ahorro',
    direccion: 'Av. Amazonas y Patria',
    dia: 'Martes',
    estado: 'pendiente',
    coordenadas: [-0.1997, -78.5001],
  },
  {
    key: '4',
    cliente: 'Mini Market Todo',
    direccion: 'Calle Loja y Sucre',
    dia: 'Martes',
    estado: 'completada',
    coordenadas: [-0.2312, -78.5242],
  },
];

const RutasTransportista = () => {
  const [searchText, setSearchText] = useState('');

  const filteredData = rutasData.filter(item =>
    item.cliente.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalPendientes = rutasData.filter(r => r.estado === 'pendiente').length;
  const totalCompletadas = rutasData.filter(r => r.estado === 'completada').length;

  const columns = [
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      key: 'cliente',
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
    },
    {
      title: 'Día',
      dataIndex: 'dia',
      key: 'dia',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: string) =>
        estado === 'completada' ? (
          <Tag color="green">Completada</Tag>
        ) : (
          <Tag color="orange">Pendiente</Tag>
        ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title
        level={2}
        style={{ color: '#ABD904', textAlign: 'center', marginBottom: 32 }}
      >
        Rutas del Transportista
      </Typography.Title>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        {/* Mapa */}
        <div style={{ flex: 1, minWidth: 350 }}>
          <Typography.Title level={4} style={{ textAlign: 'center' }}>
            <EnvironmentOutlined /> Mapa Interactivo de Negocios
          </Typography.Title>
          <MapContainer
            center={[-0.22985, -78.52495]}
            zoom={13}
            style={{
              height: '600px',
              borderRadius: 8,
              flex: 1,
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {rutasData.map((ruta) => (
              <Marker key={ruta.key} position={ruta.coordenadas}>
                <Popup>
                  <b>{ruta.cliente}</b>
                  <br />
                  {ruta.direccion}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Tabla y filtros */}
        <div style={{ flex: 1, minWidth: 350, display: 'flex', flexDirection: 'column' }}>
          {/* Contadores */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <Tag color="orange" style={{ fontSize: 16 }}>
              Pendientes: {totalPendientes}
            </Tag>
            <Tag color="green" style={{ fontSize: 16 }}>
              Completadas: {totalCompletadas}
            </Tag>
          </div>

          {/* Buscador */}
          <div
            style={{
              padding: 16,
              backgroundColor: '#fafafa',
              borderRadius: 8,
              border: '1px solid #e8e8e8',
              marginBottom: 24,
            }}
          >
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Input
                  placeholder="Buscar cliente"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Button
                  icon={<SearchOutlined />}
                  style={{
                    width: '100%',
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    color: 'white',
                    fontWeight: 500,
                  }}
                  onClick={() =>
                    message.info('Los filtros se aplican automáticamente')
                  }
                >
                  Buscar
                </Button>
              </Col>
            </Row>
          </div>

          {/* Tabla */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Table
              dataSource={filteredData}
              columns={columns}
              pagination={{ pageSize: 5 }}
              rowKey="key"
              scroll={{ y: 320 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RutasTransportista;