import { AuthFormProps } from 'types/types';
import { Button, Form, Input, Card, Typography, Row, Col, Layout, message, Alert } from 'antd';
import { BankOutlined, LockOutlined, MailOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const { Content } = Layout;

export const AuthForm = forwardRef<any, AuthFormProps>(({ onSubmit, loading }, ref) => {
  const [form] = Form.useForm();
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    incrementFailedAttempts: () => {
      setSubmitAttempts(prev => prev + 1);
    },
    resetAttempts: () => {
      setSubmitAttempts(0);
    }
  }));

  // Bloqueo temporal después de múltiples intentos fallidos
  useEffect(() => {
    if (submitAttempts >= 5) {
      setIsBlocked(true);
      setBlockTimeLeft(300); // 5 minutos

      const interval = setInterval(() => {
        setBlockTimeLeft((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setSubmitAttempts(0);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [submitAttempts]);

  const handleLogin = async (values: any) => {
    if (isBlocked) {
      message.warning('Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente.');
      return;
    }

    try {
      console.log('Formulario enviado con valores:', {
        ...values,
        password: '****'
      });

      // Validaciones adicionales en el frontend
      if (!values.rucempresarial?.trim()) {
        message.error('El RUC empresarial es requerido');
        return;
      }

      if (!values.email?.trim()) {
        message.error('El correo electrónico es requerido');
        return;
      }

      if (!values.password?.trim()) {
        message.error('La contraseña es requerida');
        return;
      }

      // Limpiar espacios en blanco
      const cleanValues = {
        rucempresarial: values.rucempresarial.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password
      };

      // Llamar a la función onSubmit que viene del componente padre (Login)
      await onSubmit(cleanValues);
      
    } catch (error) {
      console.error('Error en handleLogin:', error);
      
      message.error('Error inesperado durante el inicio de sesión');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Layout style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <Layout style={{ flex: 1 }}>
        <Content style={{ padding: '24px', flex: 1 }}>
          <Row justify="center" align="middle" style={{ height: '100%' }}>
            <Col xs={24} md={12} lg={12} style={{ padding: '0 24px' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Typography.Title level={1} style={{ marginBottom: '24px', color: '#071340', textAlign: 'center', fontSize: '60px' }}>
                  <ShoppingCartOutlined style={{color:'#A1BC3F'}} />
                  Vendly
                </Typography.Title>
                <picture>
                  <source srcSet='/front/public/assets/logovenddly.jpg' />
                </picture>
                <Typography.Paragraph style={{ fontSize: '16px', lineHeight: '1.6', color: '#071340' }}>
                  Vendly está diseñada para vendedores móviles que se desplazan a distintos negocios o puntos de venta para ofrecer productos. El sistema les permite llevar un control completo de su inventario, registrar pedidos realizados por clientes, generar facturas y visualizar en un mapa la ubicación de los negocios visitados o por visitar.
                </Typography.Paragraph>
              </div>
            </Col>
            <Col md={12} lg={12} style={{ padding: '0 24px', height: '100%', backgroundColor: '#A1BC3F' }}>
              <div style={{ display: 'flex', alignItems: 'center', height: '100vh', justifyContent: 'center' }}>
                <Card
                  title='Iniciar Sesión'
                  style={{ width: 400 }}
                  headStyle={{ textAlign: 'center' }}
                >
                  {/* Alerta de bloqueo temporal */}
                  {isBlocked && (
                    <Alert
                      message="Cuenta temporalmente bloqueada"
                      description={`Demasiados intentos fallidos. Intenta nuevamente en ${formatTime(blockTimeLeft)}`}
                      type="warning"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                  )}

                  {/* Alerta de advertencia por intentos fallidos */}
                  {submitAttempts >= 3 && !isBlocked && (
                    <Alert
                      message="Advertencia"
                      description={`${5 - submitAttempts} intentos restantes antes del bloqueo temporal`}
                      type="warning"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                  )}

                  <Form 
                    form={form}
                    onFinish={handleLogin} 
                    layout="vertical"
                    disabled={isBlocked}
                    autoComplete="off"
                  >
                    <Form.Item 
                      name="rucempresarial" 
                      label="RUC Empresarial"
                      rules={[
                        { required: true, message: 'El RUC es requerido' },
                        { 
                          pattern: /^\d{10,13}$/, 
                          message: 'El RUC debe contener entre 10 y 13 dígitos' 
                        }
                      ]}
                    >
                      <Input 
                        prefix={<BankOutlined />} 
                        placeholder="Ingresa tu RUC empresarial" 
                        maxLength={13}
                        autoComplete="organization"
                      />
                    </Form.Item>
                    
                    <Form.Item 
                      name="email" 
                      label="Correo Electrónico"
                      rules={[
                        { required: true, message: 'El email es requerido' },
                        { 
                          type: 'email', 
                          message: 'Ingresa un email válido (ejemplo@dominio.com)' 
                        },
                        {
                          max: 100,
                          message: 'El email no puede exceder 100 caracteres'
                        }
                      ]}
                    >
                      <Input 
                        prefix={<MailOutlined />} 
                        placeholder="Ingresa tu correo electrónico" 
                        autoComplete="email"
                        type="email"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      name="password"
                      label="Contraseña"
                      rules={[
                        { required: true, message: 'La contraseña es requerida' },
                        { 
                          min: 8, 
                          message: 'La contraseña debe tener al menos 8 caracteres' 
                        },
                        {
                          max: 50,
                          message: 'La contraseña no puede exceder 50 caracteres'
                        }
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined />} 
                        placeholder="Ingresa tu contraseña" 
                        autoComplete="current-password"
                      />
                    </Form.Item>

                    {/* Información adicional de seguridad */}
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}>
                      {submitAttempts > 0 && (
                        <span style={{ color: '#ff4d4f' }}>
                          Intentos fallidos: {submitAttempts}/5
                        </span>
                      )}
                    </div>
                    
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading} 
                        disabled={isBlocked}
                        block
                        size="large"
                        style={{ 
                          backgroundColor: isBlocked ? '#d9d9d9' : '#389e0d', 
                          borderColor: isBlocked ? '#d9d9d9' : '#389e0d',
                          height: '45px',
                          fontSize: '16px',
                          fontWeight: '500'
                        }}
                      >
                        {isBlocked ? `Bloqueado (${formatTime(blockTimeLeft)})` : 
                         loading ? 'Iniciando sesión...' : 'Ingresar'}
                      </Button>
                    </Form.Item>

                    {/* Información de ayuda */}
                    <div style={{ 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      color: '#999',
                      marginTop: '16px' 
                    }}>
                      ¿Problemas para iniciar sesión?<br />
                      Contacta al administrador del sistema
                    </div>
                  </Form>
                </Card>
              </div>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
});