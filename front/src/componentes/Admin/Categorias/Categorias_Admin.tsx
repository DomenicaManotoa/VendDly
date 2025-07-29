import { useState, useEffect } from 'react';
import { Button, Table, message, Popconfirm, Modal, Input } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import Categoria_Form from './Categorias_Form';
import axios from '../../../utils/axiosConfig';

interface Categoria {
  id_categoria: number;
  descripcion: string;
}

const Categorias_Admin = () => {
  const [open, setOpen] = useState(false);
  const [editarCategoria, setEditarCategoria] = useState<Categoria | null>(null);
  const [dataSource, setDataSource] = useState<Categoria[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
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
  };

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

  const columns = [
    {
      title: 'Nombre de Categoría',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right' as 'right',
      render: (_: any, record: Categoria) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirEditar(record)} />
          <Popconfirm
            title="¿Estás seguro que quieres eliminar esta categoría?"
            description={`Categoría: ${record.descripcion}`}
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
          rowKey="id_categoria"
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
        title={editarCategoria ? 'Editar Categoría' : 'Agregar Categoría'}
        width="90%"
        style={{ maxWidth: 500 }}
      >
        <Categoria_Form
          onClose={cerrarModal}
          initialValues={editarCategoria ? { 
            key: editarCategoria.id_categoria.toString(), 
            nombre: editarCategoria.descripcion 
          } : undefined}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

export default Categorias_Admin;