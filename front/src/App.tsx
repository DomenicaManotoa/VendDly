import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './auth/Login';
import { Button } from 'antd';

function Home() {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <h1>Bienvenido</h1>
      <Button type="primary" href="/login" style={{ marginRight: 8 }}>
        Login
      </Button>
      <Button href="/register">Register</Button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
