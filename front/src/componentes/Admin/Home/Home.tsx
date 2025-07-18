import { Row, Col, Card, Typography } from 'antd';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const { Title } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#eb2f96'];

const inventarioData = [
  { name: 'Producto A', stock: 120 },
  { name: 'Producto B', stock: 90 },
  { name: 'Producto C', stock: 60 },
];

const clientesData = [
  { name: 'Activos', value: 80 },
  { name: 'Inactivos', value: 20 },
];

const empleadosData = [
  { mes: 'Ene', cantidad: 5 },
  { mes: 'Feb', cantidad: 8 },
  { mes: 'Mar', cantidad: 6 },
];

const pedidosData = [
  { name: 'Pendientes', value: 40 },
  { name: 'Entregados', value: 100 },
];

const productosData = [
  { name: 'Electrónica', value: 40 },
  { name: 'Ropa', value: 30 },
  { name: 'Alimentos', value: 30 },
];

const facturasData = [
  { mes: 'Ene', total: 500 },
  { mes: 'Feb', total: 700 },
  { mes: 'Mar', total: 600 },
];

const cardStyle: React.CSSProperties = {
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  padding: '12px',
  height: '100%',
};

const chartContainerStyle: React.CSSProperties = {
  width: '100%',
  height: 160,
};

const Home = () => {
  return (
    <div
      style={{
        height: '100vh',
        overflowY: 'auto',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <Title level={1} style={{ textAlign: 'center', color: 'green', marginBottom: '8px' }}>
        Inicio
      </Title>
      <Title level={4} style={{ textAlign: 'left', color: '#555', marginBottom: '16px' }}>
        Bienvenido Administrador
      </Title>

      <Row gutter={[16, 16]} wrap align="top" style={{ display: 'flex' }}>
        {/* Inventario */}
        <Col xs={24} sm={12} md={8} style={{ height: '260px' }}>
          <Card title="Inventario" style={cardStyle}>
            <div style={chartContainerStyle}>
              <ResponsiveContainer>
                <BarChart data={inventarioData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Clientes */}
        <Col xs={24} sm={12} md={8} style={{ height: '260px' }}>
          <Card title="Clientes" style={cardStyle}>
            <div style={chartContainerStyle}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={clientesData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    label
                  >
                    {clientesData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Empleados */}
        <Col xs={24} sm={12} md={8} style={{ height: '260px' }}>
          <Card title="Empleados" style={cardStyle}>
            <div style={chartContainerStyle}>
              <ResponsiveContainer>
                <LineChart data={empleadosData}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cantidad" stroke="#722ed1" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Pedidos */}
        <Col xs={24} sm={12} md={8} style={{ height: '260px' }}>
          <Card title="Pedidos" style={cardStyle}>
            <div style={chartContainerStyle}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pedidosData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    label
                  >
                    {pedidosData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Categorías de productos */}
        <Col xs={24} sm={12} md={8} style={{ height: '260px' }}>
          <Card title="Categorías de Productos" style={cardStyle}>
            <div style={chartContainerStyle}>
              <ResponsiveContainer>
                <BarChart data={productosData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#fa8c16" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Facturación mensual */}
        <Col xs={24} sm={12} md={8} style={{ height: '260px' }}>
          <Card title="Facturación Mensual" style={cardStyle}>
            <div style={chartContainerStyle}>
              <ResponsiveContainer>
                <LineChart data={facturasData}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#13c2c2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
