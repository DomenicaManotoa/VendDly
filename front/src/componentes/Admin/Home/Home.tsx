import { Row, Col, Button } from 'antd';
import {
  FilePdfOutlined,
  AppstoreAddOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const buttonStyle = {
  height: '120px',
  width: '100%',
  fontSize: '16px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  color: 'white',
};

const iconStyle = {
  fontSize: '28px',
  marginBottom: '8px',
};

const Home = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '40px', color: 'green', marginBottom: '8px' }}>
        Inicio
      </h1>
      <h2 style={{ textAlign: 'left', fontWeight: 'normal', color: '#555', marginBottom: '40px' }}>
        Bienvenido Administrador
      </h2>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Button
            style={{ ...buttonStyle, backgroundColor: '#d32f2f' }}
            icon={<FilePdfOutlined style={iconStyle} />}
          >
            Catálogo PDF
          </Button>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Button
            style={{ ...buttonStyle, backgroundColor: '#1976d2' }}
            icon={<AppstoreAddOutlined style={iconStyle} />}
          >
            CRUD Inventario
          </Button>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Button
            style={{ ...buttonStyle, backgroundColor: '#388e3c' }}
            icon={<UserOutlined style={iconStyle} />}
          >
            CRUD Clientes
          </Button>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Button
            style={{ ...buttonStyle, backgroundColor: '#7b1fa2' }}
            icon={<TeamOutlined style={iconStyle} />}
          >
            CRUD Empleados
          </Button>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Button
            style={{ ...buttonStyle, backgroundColor: '#f57c00' }}
            icon={<AppstoreAddOutlined style={iconStyle} />}
          >
            Agregar Productos
          </Button>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Button
            style={{ ...buttonStyle, backgroundColor: '#c2185b' }}
            icon={<ShoppingCartOutlined style={iconStyle} />}
          >
            CRUD Pedidos
          </Button>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Button
            style={{ ...buttonStyle, backgroundColor: '#455a64' }}
            icon={<FileTextOutlined style={iconStyle} />}
          >
            Ver Facturas
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
