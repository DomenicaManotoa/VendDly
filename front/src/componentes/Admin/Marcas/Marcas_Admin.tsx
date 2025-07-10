import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  message,
  Popconfirm,
  Modal,
  Input,
  Form,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const Marca_Form = ({
  onClose,
  initialValues,
  onSave,
}: {
  onClose: () => void;
  initialValues?: { key: string; nombre: string };
  onSave: (values: { key?: string; nombre: string }) => void;
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const onFinish = (values: { nombre: string }) => {
    if (!values.nombre.trim()) {
      message.error('El nombre de la marca es obligatorio');
      return;
    }
    onSave({ key: initialValues?.key, nombre: values.nombre.trim() });
    onClose();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Nombre de la Marca"
        name="nombre"
        rules={[{ required: true, message: 'Por favor ingresa el nombre de la marca' }]}
      >
        <Input placeholder="Ejemplo: Marca XYZ" autoFocus />
      </Form.Item>

      <Form.Item style={{ textAlign: 'right' }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
};

const initialMarcas = [
  { key: '1', nombre: 'Marca A' },
  { key: '2', nombre: 'Marca B' },
  { key: '3', nombre: 'Marca C' },
  { key: '4', nombre: 'Marca D' },
];

const Marcas_Admin = () => {
  const [open, setOpen] = useState(false);
  const [editarMarca, setEditarMarca] = useState<{ key: string; nombre: string } | null>(null);
  const [dataSource, setDataSource] = useState(initialMarcas);
  const [searchText, setSearchText] = useState('');

  const abrirEditar = (marca: { key: string; nombre: string }) => {
    setEditarMarca(marca);
    setOpen(true);
  };

  const cerrarModal = () => {
    setOpen(false);
    setEditarMarca(null);
  };

  const handleDelete = (record: { key: string }) => {
    setDataSource(prev => prev.filter(item => item.key !== record.key));
    message.success('Marca eliminada correctamente');
  };

  const handleSave = (values: { key?: string; nombre: string }) => {
    if (values.key) {
      setDataSource(prev =>
        prev.map(item => (item.key === values.key ? { ...item, nombre: values.nombre } : item))
      );
      message.success('Marca actualizada correctamente');
    } else {
      const newKey = (Math.max(0, ...dataSource.map(m => Number(m.key))) + 1).toString();
      setDataSource(prev => [...prev, { key: newKey, nombre: values.nombre }]);
      message.success('Marca agregada correctamente');
    }
  };

  const filteredData = dataSource.filter(marca =>
    marca.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Nombre de Marca',
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
            title="¿Estás seguro que quieres eliminar esta marca?"
            description={`Marca: ${record.nombre}`}
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
        title={editarMarca ? 'Editar Marca' : 'Agregar Marca'}
        width="90%"
        style={{ maxWidth: 500 }}
      >
        <Marca_Form
          onClose={cerrarModal}
          initialValues={editarMarca || undefined}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
};

export default Marcas_Admin;
