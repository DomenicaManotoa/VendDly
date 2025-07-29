import { useState, useEffect } from 'react';
import { Button, Table, message, Popconfirm, Modal, Input } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import Marca_Form from './Marcas_Form';
import axios from '../../../utils/axiosConfig';

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

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
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
  };

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

  const columns = [
    {
      title: 'Nombre de Marca',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right' as 'right',
      render: (_: any, record: Marca) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirEditar(record)} />
          <Popconfirm
            title="¿Estás seguro que quieres eliminar esta marca?"
            description={`Marca: ${record.descripcion}`}
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
        Marcas
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
            setEditarMarca(null);
            setOpen(true);
          }}
        >
          Agregar Marca
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
          placeholder="Buscar marca"
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
          rowKey="id_marca"
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