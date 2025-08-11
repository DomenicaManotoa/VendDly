import { Typography } from 'antd';

const { Title } = Typography;

const Home = () => {
  return (
    <div
      style={{
        height: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Title level={1} style={{ color: 'green', marginBottom: '8px' }}>
        Inicio
      </Title>
      <Title level={4} style={{ color: '#555' }}>
        Bienvenido Administrador
      </Title>
    </div>
  );
};

export default Home;
