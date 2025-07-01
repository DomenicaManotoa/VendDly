import { Button, Form, Input, Card, Typography, Row, Col, Layout } from 'antd';
import { LockOutlined, MailOutlined, BankOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { AuthFormProps } from 'types/types';
import { FooterCustom } from './Footer';
import SidebarCustom from './Sidebar';

const { Content, Sider } = Layout;

export const AuthForm = ({ isLogin, onSubmit, loading }: AuthFormProps) => {
  return (
    <Layout style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <Layout style={{ flex: 1 }}>
        <Sider width={200} style={{ background: '#fff' }}>
          <SidebarCustom />
        </Sider>
        <Content style={{ padding: '24px', flex: 1 }}>
          <Row justify="center" align="middle" style={{ height: '100%' }}>
            <Col xs={24} md={12} lg={12} style={{ padding: '0 24px' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Typography.Title level={1} style={{ marginBottom: '24px', color: '#A1BC3F', textAlign: 'center', fontSize: '60px' }}>
                  <ShoppingCartOutlined />
                  Vendly
                </Typography.Title>
                <picture>
                  <source srcSet='/front/public/assets/logovenddly.jpg' />
                </picture>
                <Typography.Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
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
                  <Form onFinish={onSubmit}>
                    <Form.Item
                      name="rucempresarial"
                      rules={[{ required: true, message: 'Ingrese su RUC empresarial' }]}
                    >
                      <Input prefix={<BankOutlined />} placeholder="RUC Empresarial" />
                    </Form.Item>
                    <Form.Item
                      name="email"
                      rules={[{ required: true, type: 'email', message: 'Email inválido' }]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading} 
                        block
                        style={{ backgroundColor: '#389e0d', borderColor: '#389e0d' }}
                      >
                        Ingresar
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            </Col>
          </Row>
        </Content>
      </Layout>
      <FooterCustom />
    </Layout>
  );
};