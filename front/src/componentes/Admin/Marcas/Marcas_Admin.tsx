import { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Table, 
  message, 
  Popconfirm, 
  Modal, 
  Input, 
  Typography, 
  Card, 
  Row, 
  Col,
  Space 
} from 'antd';
import { 
  DeleteOutlined, 
  EditOutlined, 
  PlusOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Marca_Form from './Marcas_Form';
import axios from '../../../utils/axiosConfig';

const { Title } = Typography;

interface Marca {
  id_marca: number;
  descripcion: string;
}

const Marcas_Admin = () => {
  const [open, setOpen] = useState(false);
  const [editarMarca, setEditarMarca] = useState<Marca | null>(null);
  const [dataSource, setDataSource] = useState<Marca[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchMarcas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/marcas');
      setDataSource(response.data);
    } catch (error) {
      message.error('Error al cargar las marcas');
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarcas();
  }, [fetchMarcas]);

  const abrirEditar = (marca: Marca) => {
    setEditarMarca(marca);
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setEditarMarca(null);
  };

  const handleDelete = async (record: Marca) => {
    try {
      await axios.delete(`/marcas/${record.id_marca}`);
      message.success('Marca eliminada correctamente');
      fetchMarcas();
    } catch (error) {
      message.error('Error al eliminar la marca');
      console.error('Error deleting brand:', error);
    }
  };

  const handleSave = async (values: { nombre: string }) => {
    try {
      if (editarMarca) {
        await axios.put(`/marcas/${editarMarca.id_marca}`, {
          descripcion: values.nombre
        });
        message.success('Marca actualizada correctamente');
      } else {
        await axios.post('/marcas', {
          descripcion: values.nombre
        });
        message.success('Marca agregada correctamente');
      }
      fetchMarcas();
      cerrarModal();
    } catch (error) {
      message.error('Error al guardar la marca');
      console.error('Error saving brand:', error);
    }
  };

  const filteredData = dataSource.filter(marca =>
    marca.descripcion.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Marca> = [
    {
      title: 'Nombre de Marca',
      dataIndex: 'descripcion',
      key: 'descripcion',
      sorter: (a, b) => a.descripcion.localeCompare(b.descripcion),
      ellipsis: true,
      render: (text: string, record: Marca) => (
        <div>
          <div>{text}</div>
          {isMobile && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {record.id_marca}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: Marca) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => abrirEditar(record)}
            title="Editar marca"
            size="small"
          />
          <Popconfirm
            title="¿Eliminar marca?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(record)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              title="Eliminar marca"
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Row gutter={[16, 16]}>
      {filteredData.map((marca) => (
        <Col xs={24} sm={12} key={marca.id_marca}>
          <Card
            size="small"
            title={marca.descripcion}
            extra={
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => abrirEditar(marca)}
                  size="small"
                />
                <Popconfirm
                  title="¿Eliminar marca?"
                  description="Esta acción no se puede deshacer"
                  onConfirm={() => handleDelete(marca)}
                  okText="Sí"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    size="small"
                  />
                </Popconfirm>
              </Space>
            }
          >
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div><strong>ID:</strong> {marca.id_marca}</div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Gestión de Marcas
      </Title>

      {/* Barra de búsqueda y acciones */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Buscar marcas..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={16}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setEditarMarca(null);
                setOpen(true);
              }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Agregar' : 'Agregar Marca'}
            </Button>
          </div>
        </Col>
      </Row>

      {isMobile ? (
        // Vista móvil con cards
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              Cargando marcas...
            </div>
          ) : filteredData.length > 0 ? (
            renderMobileCards()
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <div style={{ marginTop: '16px' }}>
                  No se encontraron marcas
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        // Vista desktop con tabla
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id_marca"
          loading={loading}
          scroll={{ x: 500 }}
          locale={{
            emptyText: 'No hay marcas disponibles'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} marcas`,
            responsive: true,
          }}
        />
      )}

      <Modal
        open={open}
        onCancel={cerrarModal}
        footer={null}
        destroyOnClose
        title={editarMarca ? 'Editar Marca' : 'Agregar Marca'}
        width="90%"
        style={{ maxWidth: 500 }}
      >
        <Marca_Form
          onClose={cerrarModal}
          initialValues={editarMarca ? { 
            nombre: editarMarca.descripcion 
          } : undefined}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

export default Marcas_Admin;