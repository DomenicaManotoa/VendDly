import { useState } from 'react';
import { Button, Table, message, Popconfirm, Modal, Input } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import Categoria_Form from './Categorias_Form';

const initialCategorias = [
  { key: '1', nombre: 'Categoría 1' },
  { key: '2', nombre: 'Categoría 2' },
  { key: '3', nombre: 'Categoría 3' },
];

const Categorias_Admin = () => {
  const [open, setOpen] = useState(false);
  const [editarCategoria, setEditarCategoria] = useState<{ key: string; nombre: string } | null>(null);
  const [dataSource, setDataSource] = useState(initialCategorias);
  const [searchText, setSearchText] = useState('');

  const abrirEditar = (categoria: { key: string; nombre: string }) => {
    setEditarCategoria(categoria);
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setEditarCategoria(null);
  };

  const handleDelete = (record: { key: string }) => {
    setDataSource(prev => prev.filter(item => item.key !== record.key));
    message.success('Categoría eliminada correctamente');
  };

  const handleSave = (values: { key?: string; nombre: string }) => {
    if (values.key) {
      setDataSource(prev =>
        prev.map(item => (item.key === values.key ? { ...item, nombre: values.nombre } : item))
      );
      message.success('Categoría actualizada correctamente');
    } else {
      const newKey = (Math.max(0, ...dataSource.map(c => Number(c.key))) + 1).toString();
      setDataSource(prev => [...prev, { key: newKey, nombre: values.nombre }]);
      message.success('Categoría agregada correctamente');
    }
  };

  const filteredData = dataSource.filter(categoria =>
    categoria.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Nombre de Categoría',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right' as 'right',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirEditar(record)} />
          <Popconfirm
            title="¿Estás seguro que quieres eliminar esta categoría?"
            description={`Categoría: ${record.nombre}`}
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
        Categorías
      </h1>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#04A0D9', borderColor: '#04A0D9' }}
          onClick={() => {
            setEditarCategoria(null);
            setOpen(true);
          }}
        >
          Agregar Categoría
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
          placeholder="Buscar categoría"
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
        title={editarCategoria ? 'Editar Categoría' : 'Agregar Categoría'}
        width="90%"
        style={{ maxWidth: 500 }}
      >
        <Categoria_Form
          onClose={cerrarModal}
          initialValues={editarCategoria || undefined}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

export default Categorias_Admin;
