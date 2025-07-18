   import React from 'react';
   import { Layout, Button, Card, Col, Row, Typography } from 'antd';
   import { SearchOutlined } from '@ant-design/icons';

   const { Header, Content } = Layout;
   const { Title } = Typography;

   const products = [
       {
           id: 1,
           title: "Hummingbird Printed T-Shirt",
           price: "19,12 €",
           originalPrice: "23,90 €",
           discount: "-20%",
           image: "link_to_image_1",
       },
       {
           id: 2,
           title: "Hummingbird Printed Sweater",
           price: "28,72 €",
           originalPrice: "36,90 €",
           discount: "-20%",
           image: "link_to_image_2",
       },
       // Agregar más productos aquí
   ];

   const Catalogo = () => {
       return (
               <div>
                   <Header style={{ background: '#fff', padding: '0' }}>
                       <Title level={2} style={{ textAlign: 'center', margin: '16px 0' }}>Catálogo</Title>
                       <Button type="primary" style={{ float: 'right', margin: '16px' }}>Exportar PDF</Button>
                       <Button icon={<SearchOutlined />} style={{ margin: '16px' }} />
                   </Header>
                   <Content style={{ margin: '0 16px' }}>
                       <Title level={4}>Productos Destacados</Title>
                       <Row gutter={16}>
                           {products.map(product => (
                               <Col span={8} key={product.id}>
                                   <Card
                                       title={product.title}
                                       extra={product.discount}
                                       style={{ marginTop: '16px' }}
                                   >
                                       <img src={product.image} alt={product.title} style={{ width: '100%' }} />
                                       <p>{product.originalPrice} <strong>{product.price}</strong></p>
                                   </Card>
                               </Col>
                           ))}
                       </Row>
                       <Button type="link">Todos los productos </Button>
                   </Content>
              </div>
       );
   };

   export default Catalogo;
   
