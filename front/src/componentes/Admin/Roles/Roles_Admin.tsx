import { useState } from 'react';
import {
  Button,
  Table,
  message,
  Popconfirm,
  Modal,
  Input,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import Rol_Form from './Roles_Form';

const initialRoles = [
  { key: '1', nombre: 'Administrador', grupo: 'Admin' },
  { key: '2', nombre: 'Usuario', grupo: 'Usuario' },
  { key: '3', nombre: 'Vendedor', grupo: 'Usuario' },
];

const Roles_Admin = () => {
  const [open, setOpen] = useState(false);
  const [editarRol, setEditarRol] = useState<{ key: string; nombre: string; grupo?: string } | null>(null);
  const [dataSource, setDataSource] = useState(initialRoles);
  const [searchText, setSearchText] = useState('');

  const abrirEditar = (rol: { key: string; nombre: string; grupo?: string }) => {
    setEditarRol(rol);
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setEditarRol(null);
  };

  const handleDelete = (record: { key: string }) => {
    setDataSource(prev => prev.filter(item => item.key !== record.key));
    message.success('Rol eliminado correctamente');
  };

  const handleSave = (values: { key?: string; nombre: string; grupo?: string }) => {
    if (values.key) {
      setDataSource(prev =>
        prev.map(item =>
          item.key === values.key
            ? { ...item, nombre: values.nombre, grupo: values.grupo || item.grupo }
            : item
        )
      );
      message.success('Rol actualizado correctamente');
    } else {
      const newKey = (Math.max(0, ...dataSource.map(r => Number(r.key))) + 1).toString();
      setDataSource(prev => [
        ...prev,
        { key: newKey, nombre: values.nombre, grupo: values.grupo || 'Usuario' },
      ]);
      message.success('Rol agregado correctamente');
    }
  };

  const filteredData = dataSource.filter(rol => {
    const search = searchText.toLowerCase();
    return (
      rol.nombre.toLowerCase().includes(search) ||
      (rol.grupo || '').toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: 'Nombre del Rol',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Grupo',
      dataIndex: 'grupo',
      key: 'grupo',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right' as 'right',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirEditar(record)} />
          <Popconfirm
            title="¿Estás seguro que quieres eliminar este rol?"
            description={`Rol: ${record.nombre}`}
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

      {/* Buscador único */}
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
          placeholder="Buscar rol por nombre o grupo"
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
          rowKey="key"
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
          initialValues={editarRol || undefined}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

export default Roles_Admin;
