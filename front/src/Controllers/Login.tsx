import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { authService } from '../auth/auth';
import { AuthForm } from 'componentes/Form';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const { email, password } = values;
    const { success, error } = await authService.login(email, password);
    
    if (success) {
      notification.success({ message: 'Bienvenido' });
      navigate('/dashboard');
    } else {
      notification.error({ message: error });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <AuthForm isLogin onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};