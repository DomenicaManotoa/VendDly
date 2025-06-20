import { Button, Form, Input, Card } from 'antd';
import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';

interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

export const AuthForm = ({ isLogin, onSubmit, loading }: AuthFormProps) => {
  return (
    <Card className='text-align-center' title={isLogin ? 'Iniciar Sesión' : 'Registrarse'} style={{ width: 400 }}>
      <Form onFinish={onSubmit}>
        {!isLogin && (
          <Form.Item name="name" rules={[{ required: true, message: 'Nombre requerido' }]}>
            <Input prefix={<UserOutlined />} placeholder="Nombre completo" />
          </Form.Item>
        )}

        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email inválido' }]}>
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
        </Form.Item>

        {!isLogin && (
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Las contraseñas no coinciden');
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirmar contraseña" />
          </Form.Item>
        )}

        <Form.Item>
          <Button color="green" variant="solid" htmlType="submit" loading={loading} block>
            {isLogin ? 'Ingresar' : 'Registrar'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};