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
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Rol_Form from './Roles_Form';
import axios from '../../../utils/axiosConfig';

const { Title } = Typography;

interface Rol {
  id_rol: number;
  descripcion: string;
}

const Roles_Admin = () => {
  const [open, setOpen] = useState(false);
  const [editarRol, setEditarRol] = useState<Rol | null>(null);
  const [dataSource, setDataSource] = useState<Rol[]>([]);
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

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/roles');
      setDataSource(response.data);
    } catch (error) {
      message.error('Error al cargar los roles');
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const abrirEditar = (rol: Rol) => {
    setEditarRol(rol);
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setEditarRol(null);
  };

  const handleDelete = async (record: Rol) => {
    try {
      await axios.delete(`/roles/${record.id_rol}`);
      message.success('Rol eliminado correctamente');
      fetchRoles();
    } catch (error) {
      message.error('Error al eliminar el rol');
      console.error('Error deleting role:', error);
    }
  };

  const handleSave = async (values: { nombre: string }) => {
    try {
      const rolData = { descripcion: values.nombre };
      
      if (editarRol) {
        await axios.put(`/roles/${editarRol.id_rol}`, rolData);
        message.success('Rol actualizado correctamente');
      } else {
        await axios.post('/roles', rolData);
        message.success('Rol agregado correctamente');
      }
      fetchRoles();
      cerrarModal();
    } catch (error) {
      message.error('Error al guardar el rol');
      console.error('Error saving role:', error);
    }
  };

  const filteredData = dataSource.filter(rol =>
    rol.descripcion.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Rol> = [
    {
      title: 'Nombre del Rol',
      dataIndex: 'descripcion',
      key: 'descripcion',
      sorter: (a, b) => a.descripcion.localeCompare(b.descripcion),
      ellipsis: true,
      render: (text: string, record: Rol) => (
        <div>
          <div>{text}</div>
          {isMobile && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {record.id_rol}
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
      render: (_: any, record: Rol) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => abrirEditar(record)}
            title="Editar rol"
            size="small"
          />
          <Popconfirm
            title="¿Eliminar rol?"
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
              title="Eliminar rol"
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Row gutter={[16, 16]}>
      {filteredData.map((rol) => (
        <Col xs={24} sm={12} key={rol.id_rol}>
          <Card
            size="small"
            title={rol.descripcion}
            extra={
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => abrirEditar(rol)}
                  size="small"
                />
                <Popconfirm
                  title="¿Eliminar rol?"
                  description="Esta acción no se puede deshacer"
                  onConfirm={() => handleDelete(rol)}
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
              <div><strong>ID:</strong> {rol.id_rol}</div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Gestión de Roles
      </Title>

      {/* Barra de búsqueda y acciones */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Buscar roles..."
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
                setEditarRol(null);
                setOpen(true);
              }}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? 'Agregar' : 'Agregar Rol'}
            </Button>
          </div>
        </Col>
      </Row>

      {isMobile ? (
        // Vista móvil con cards
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              Cargando roles...
            </div>
          ) : filteredData.length > 0 ? (
            renderMobileCards()
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <div style={{ marginTop: '16px' }}>
                  No se encontraron roles
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
          rowKey="id_rol"
          loading={loading}
          scroll={{ x: 500 }}
          locale={{
            emptyText: 'No hay roles disponibles'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} roles`,
            responsive: true,
          }}
        />
      )}

      <Modal
        open={open}
        onCancel={cerrarModal}
        footer={null}
        destroyOnClose
        title={editarRol ? 'Editar Rol' : 'Agregar Rol'}
        width="90%"
        style={{ maxWidth: 500 }}
      >
        <Rol_Form
          onClose={cerrarModal}
          initialValues={editarRol ? { 
            key: editarRol.id_rol.toString(),
            nombre: editarRol.descripcion 
          } : undefined}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

export default Roles_Admin;