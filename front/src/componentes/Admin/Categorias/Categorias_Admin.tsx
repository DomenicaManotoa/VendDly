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
  Space,
  Grid
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Categoria_Form from './Categorias_Form';
import axios from '../../../utils/axiosConfig';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface Categoria {
  id_categoria: number;
  descripcion: string;
}

const Categorias_Admin = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [open, setOpen] = useState(false);
  const [editarCategoria, setEditarCategoria] = useState<Categoria | null>(null);
  const [dataSource, setDataSource] = useState<Categoria[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/categorias');
      setDataSource(response.data);
    } catch (error) {
      message.error('Error al cargar las categorías');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const abrirEditar = (categoria: Categoria) => {
    setEditarCategoria(categoria);
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setEditarCategoria(null);
  };

  const handleDelete = async (record: Categoria) => {
    try {
      await axios.delete(`/categorias/${record.id_categoria}`);
      message.success('Categoría eliminada correctamente');
      fetchCategorias();
    } catch (error) {
      message.error('Error al eliminar la categoría');
      console.error('Error deleting category:', error);
    }
  };

  const handleSave = async (values: { nombre: string }) => {
    try {
      if (editarCategoria) {
        await axios.put(`/categorias/${editarCategoria.id_categoria}`, {
          descripcion: values.nombre
        });
        message.success('Categoría actualizada correctamente');
      } else {
        await axios.post('/categorias', {
          descripcion: values.nombre
        });
        message.success('Categoría agregada correctamente');
      }
      fetchCategorias();
      cerrarModal();
    } catch (error) {
      message.error('Error al guardar la categoría');
      console.error('Error saving category:', error);
    }
  };

  const filteredData = dataSource.filter(categoria =>
    categoria.descripcion.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Categoria> = [
    {
      title: 'Nombre de Categoría',
      dataIndex: 'descripcion',
      key: 'descripcion',
      sorter: (a, b) => a.descripcion.localeCompare(b.descripcion),
      ellipsis: true,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: Categoria) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => abrirEditar(record)}
            title="Editar categoría"
            size="small"
          />
          <Popconfirm
            title="¿Eliminar categoría?"
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
              title="Eliminar categoría"
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Row gutter={[16, 16]}>
      {filteredData.map((categoria) => (
        <Col xs={24} sm={24} md={12} lg={8} key={categoria.id_categoria}>
          <Card
            size="small"
            title={<Text ellipsis>{categoria.descripcion}</Text>}
            extra={
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => abrirEditar(categoria)}
                  size="small"
                />
                <Popconfirm
                  title="¿Eliminar categoría?"
                  description="Esta acción no se puede deshacer"
                  onConfirm={() => handleDelete(categoria)}
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
          />
        </Col>
      ))}
    </Row>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <Title level={2}>
        Gestión de Categorías
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={24} md={8}>
          <Input
            placeholder="Buscar categorías..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} sm={24} md={16}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditarCategoria(null);
                setOpen(true);
              }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Agregar' : 'Agregar Categoría'}
            </Button>
          </div>
        </Col>
      </Row>

      {isMobile ? (
        loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            Cargando categorías...
          </div>
        ) : filteredData.length > 0 ? (
          renderMobileCards()
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div style={{ marginTop: '16px' }}>
                No se encontraron categorías
              </div>
            </div>
          </Card>
        )
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id_categoria"
          loading={loading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'No hay categorías disponibles'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} categorías`,
            responsive: true,
          }}
          style={{ width: '100%' }}
        />
      )}

      <Modal
        open={open}
        onCancel={cerrarModal}
        footer={null}
        destroyOnClose
        title={editarCategoria ? 'Editar Categoría' : 'Agregar Categoría'}
        width={isMobile ? '100%' : 500}
        style={{ maxWidth: isMobile ? '100%' : 500 }}
      >
        <Categoria_Form
          onClose={cerrarModal}
          initialValues={
            editarCategoria
              ? {
                  key: editarCategoria.id_categoria.toString(),
                  nombre: editarCategoria.descripcion,
                }
              : undefined
          }
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

export default Categorias_Admin;
