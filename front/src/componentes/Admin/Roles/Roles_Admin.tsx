import { useState, useEffect } from 'react';
import { Button, Table, message, Popconfirm, Modal, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import Rol_Form from './Roles_Form';
import axios from '../../../utils/axiosConfig';

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

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
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
  };

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

  const columns = [
    {
      title: 'Nombre del Rol',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right' as 'right',
      render: (_: any, record: Rol) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirEditar(record)} />
          <Popconfirm
            title="¿Estás seguro que quieres eliminar este rol?"
            description={`Rol: ${record.descripcion}`}
            onConfirm={() => handleDelete(record)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, background: '#fff', minHeight: '100vh', maxWidth: 900, margin: '0 auto' }}>
      <h1
        style={{
          color: '#ABD904',
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          margin: '48px 0 32px',
          textAlign: 'center',
        }}
      >
        Roles
      </h1>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
          alignItems: 'center',
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#04A0D9', borderColor: '#04A0D9' }}
          onClick={() => {
            setEditarRol(null);
            setOpen(true);
          }}
        >
          Agregar Rol
        </Button>
      </div>

      <div
        style={{
          padding: 16,
          backgroundColor: '#fafafa',
          borderRadius: 8,
          border: '1px solid #e8e8e8',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 24,
        }}
      >
        <Input
          placeholder="Buscar rol por nombre"
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: '100%', fontSize: '1rem', maxWidth: '100%' }}
        />
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table
          dataSource={filteredData}
          columns={columns}
          pagination={{ pageSize: 5 }}
          rowKey="id_rol"
          loading={loading}
          scroll={{ y: 320 }}
          style={{ minWidth: 300 }}
        />
      </div>

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