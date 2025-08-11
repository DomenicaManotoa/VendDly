import React, { useState, useEffect } from 'react';
import {
  Layout,
  Button,
  Card,
  Col,
  Row,
  Typography,
  Input,
  Select,
  message,
  Spin,
  Image,
  Tag,
  Space,
  Divider,
  Modal
} from 'antd';
import {
  SearchOutlined,
  FilePdfOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from '../../../utils/axiosConfig';
import { Producto, Marca, Categoria } from '../../../types/types';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const Catalogo = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMarca, setSelectedMarca] = useState<number | undefined>(undefined);
  const [selectedCategoria, setSelectedCategoria] = useState<number | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchProductos();
    fetchMarcas();
    fetchCategorias();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/productos');
      // Filtrar solo productos activos
      const productosActivos = response.data.filter((producto: Producto) =>
        producto.estado === 'activo'
      );
      setProductos(productosActivos);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      message.error('Error al cargar el catálogo de productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarcas = async () => {
    try {
      const response = await axios.get('/marcas');
      setMarcas(response.data);
    } catch (error) {
      console.error('Error al obtener marcas:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await axios.get('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  // Función para construir la URL de la imagen
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return 'https://via.placeholder.com/300x200?text=Sin+Imagen';

    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = 'http://127.0.0.1:8000'; // Usando la misma URL que tu axiosConfig
    return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
  };

  // Filtrar productos basado en los criterios de búsqueda
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = searchText === '' ||
      producto.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      (producto.marca?.descripcion.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
      (producto.categoria?.descripcion.toLowerCase().includes(searchText.toLowerCase()) ?? false);

    const matchesMarca = selectedMarca === undefined || producto.id_marca === selectedMarca;

    const matchesCategoria = selectedCategoria === undefined || producto.id_categoria === selectedCategoria;

    const matchesPriceRange = (() => {
      if (priceRange === 'all') return true;
      const price = producto.precio_minorista;
      switch (priceRange) {
        case 'low': return price < 50;
        case 'medium': return price >= 50 && price < 200;
        case 'high': return price >= 200;
        default: return true;
      }
    })();

    return matchesSearch && matchesMarca && matchesCategoria && matchesPriceRange;
  });

  const clearFilters = () => {
    setSearchText('');
    setSelectedMarca(undefined);
    setSelectedCategoria(undefined);
    setPriceRange('all');
  };

  const exportToPDF = async () => {
    try {
      message.loading({ content: 'Generando PDF...', key: 'pdf' });

      // Preparar parámetros de filtro
      const params = new URLSearchParams();

      if (searchText) params.append('search', searchText);
      if (selectedMarca) params.append('marca_id', selectedMarca.toString());
      if (selectedCategoria) params.append('categoria_id', selectedCategoria.toString());
      if (priceRange !== 'all') params.append('price_range', priceRange);

      // Construir URL con filtros
      const baseUrl = 'http://127.0.0.1:8000';
      const url = `${baseUrl}/api/catalogo/export/pdf${params.toString() ? '?' + params.toString() : ''}`;

      // Obtener token de autenticación
      const token = localStorage.getItem('token'); // Ajusta según tu implementación de auth

      // Realizar petición
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Obtener el blob del PDF
      const blob = await response.blob();

      // Crear URL temporal para descargar
      const downloadUrl = window.URL.createObjectURL(blob);

      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Generar nombre del archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `catalogo_productos_${timestamp}.pdf`;

      // Trigger descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL temporal
      window.URL.revokeObjectURL(downloadUrl);

      message.success({
        content: 'PDF descargado exitosamente',
        key: 'pdf',
        duration: 3
      });

    } catch (error) {
      console.error('Error al exportar PDF:', error);
      message.error({
        content: 'Error al generar el PDF. Inténtalo de nuevo.',
        key: 'pdf',
        duration: 5
      });
    }
  };

  const handleViewDetails = (producto: Producto) => {
    setSelectedProduct(producto);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Row
          gutter={[16, 16]}
          align="middle"
          justify="space-between"
          style={{ marginBottom: 24 }}
        >
          <Col xs={24} sm={16}>
            <Typography.Title level={2}>
              Catálogo de Productos
            </Typography.Title>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={exportToPDF}
              style={{
                background: '#F12525',
                borderColor: '#F12525',
                width: '100%',
                maxWidth: 180
              }}
            >
              Exportar PDF
            </Button>
          </Col>
        </Row>

        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Search
                placeholder="Buscar productos..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onSearch={value => setSearchText(value)}
                enterButton={<SearchOutlined />}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Filtrar por marca"
                style={{ width: '100%' }}
                value={selectedMarca}
                onChange={setSelectedMarca}
                allowClear
              >
                {marcas.map(marca => (
                  <Option key={marca.id_marca} value={marca.id_marca}>
                    {marca.descripcion}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Filtrar por categoría"
                style={{ width: '100%' }}
                value={selectedCategoria}
                onChange={setSelectedCategoria}
                allowClear
              >
                {categorias.map(categoria => (
                  <Option key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.descripcion}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Rango de precio"
                style={{ width: '100%' }}
                value={priceRange}
                onChange={setPriceRange}
              >
                <Option value="all">Todos los precios</Option>
                <Option value="low">Menos de $50</Option>
                <Option value="medium">$50 - $200</Option>
                <Option value="high">Más de $200</Option>
              </Select>
            </Col>

            <Col xs={24} sm={24} md={4}>
              <Button onClick={clearFilters} style={{ width: '100%' }}>
                Limpiar Filtros
              </Button>
            </Col>
          </Row>
        </Card>

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Mostrando {filteredProductos.length} de {productos.length} productos
          </Text>
          {(searchText || selectedMarca || selectedCategoria || priceRange !== 'all') && (
            <Tag
              color="blue"
              style={{ marginLeft: 8 }}
              closable
              onClose={clearFilters}
            >
              Filtros aplicados
            </Tag>
          )}
        </div>

        {/* Grid de productos */}
        <Spin spinning={loading}>
          {filteredProductos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              background: '#fff',
              borderRadius: 8
            }}>
              <Title level={4} type="secondary">
                {loading ? 'Cargando productos...' : 'No se encontraron productos'}
              </Title>
              {!loading && (searchText || selectedMarca || selectedCategoria || priceRange !== 'all') && (
                <Button type="link" onClick={clearFilters}>
                  Limpiar filtros y ver todos los productos
                </Button>
              )}
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredProductos.map(producto => (
                <Col xs={24} sm={12} md={8} lg={6} key={producto.id_producto}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    cover={
                      <div style={{
                        height: 200,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8f8f8'
                      }}>
                        <Image
                          src={getImageUrl(producto.imagen)}
                          alt={producto.nombre}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          fallback="https://via.placeholder.com/300x200?text=Error+al+cargar"
                        />
                      </div>
                    }
                    actions={[
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(producto)}
                        style={{ color: '#1890ff' }}
                      >
                        Ver Detalles
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div style={{ height: 48, overflow: 'hidden' }}>
                          <Text strong style={{ fontSize: 14 }}>
                            {producto.nombre}
                          </Text>
                        </div>
                      }
                      description={
                        <div>
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {producto.marca?.descripcion} • {producto.categoria?.descripcion}
                              </Text>
                            </div>

                            <Divider style={{ margin: '8px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <Text strong style={{ color: '#f5222d', fontSize: 16 }}>
                                  ${producto.precio_minorista.toFixed(2)}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Mayorista: ${producto.precio_mayorista.toFixed(2)}
                                </Text>
                              </div>
                              <Tag color={Number(producto.stock) > 10 ? 'green' : Number(producto.stock) > 0 ? 'orange' : 'red'}>
                                Stock: {producto.stock}
                              </Tag>
                            </div>
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>

        {filteredProductos.length > 0 && filteredProductos.length < productos.length && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button type="primary" size="large" onClick={clearFilters}>
              Ver todos los productos ({productos.length})
            </Button>
          </div>
        )}

        <Modal
          title={selectedProduct?.nombre}
          visible={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              Cerrar
            </Button>
          ]}
          width={600}
        >
          {selectedProduct && (
            <div>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Image
                    src={getImageUrl(selectedProduct.imagen)}
                    alt={selectedProduct.nombre}
                    style={{
                      width: '100%',
                      height: 250,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                    fallback="https://via.placeholder.com/300x250?text=Error+al+cargar"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {selectedProduct.nombre}
                      </Title>
                    </div>

                    <div>
                      <Text strong>Marca: </Text>
                      <Text>{selectedProduct.marca?.descripcion}</Text>
                    </div>

                    <div>
                      <Text strong>Categoría: </Text>
                      <Text>{selectedProduct.categoria?.descripcion}</Text>
                    </div>

                    <div>
                      <Text strong>Stock disponible: </Text>
                      <Tag color={Number(selectedProduct.stock) > 10 ? 'green' : Number(selectedProduct.stock) > 0 ? 'orange' : 'red'}>
                        {selectedProduct.stock} unidades
                      </Tag>
                    </div>

                    <Divider />

                    <div>
                      <Text strong style={{ fontSize: 16 }}>Precio Minorista: </Text>
                      <Text strong style={{ color: '#f5222d', fontSize: 18 }}>
                        ${selectedProduct.precio_minorista.toFixed(2)}
                      </Text>
                    </div>

                    <div>
                      <Text strong>Precio Mayorista: </Text>
                      <Text style={{ color: '#52c41a', fontSize: 16 }}>
                        ${selectedProduct.precio_mayorista.toFixed(2)}
                      </Text>
                    </div>

                    <div>
                      <Text strong>IVA: </Text>
                      <Text>{(selectedProduct.iva * 100).toFixed(0)}%</Text>
                    </div>

                    <div>
                      <Text strong>Estado: </Text>
                      <Tag color={selectedProduct.estado === 'activo' ? 'green' : 'red'}>
                        {selectedProduct.estado.toUpperCase()}
                      </Tag>
                    </div>
                  </Space>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
    </div>
  );
};

export default Catalogo;