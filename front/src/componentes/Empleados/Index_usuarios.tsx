import React, { useEffect, useState } from 'react';
import { Space, Table, Typography, Button, Input, message, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, SearchOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Usuario } from 'types/types';
import UsuarioModal from './Tabla';

const { Column } = Table;

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState([]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      message.error('Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/roles');
      setRoles(res.data);
    } catch {
      message.error('Error al obtener roles');
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const handleAdd = () => {
    setUserToEdit(null);
    setModalVisible(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setUserToEdit(usuario);
    setModalVisible(true);
  };

  const handleDelete = async (identificacion: string) => {
  try {
    console.log("Eliminando usuario con ID:", identificacion);
    await axios.delete(`http://127.0.0.1:8000/usuarios/${identificacion}`);
    message.success('Usuario eliminado');
    fetchUsuarios();
  } catch (error) {
    console.error(error);
    message.error('Error al eliminar');
  }
};

  const handleSubmit = async (usuario: Usuario) => {
    try {
      if (userToEdit) {
        await axios.put(`http://127.0.0.1:8000/usuarios/${usuario.identificacion}`, usuario);
        message.success('Usuario actualizado');
      } else {
        await axios.post('http://127.0.0.1:8000/usuarios', usuario);
        message.success('Usuario agregado');
      }
      setModalVisible(false);
      fetchUsuarios();
    } catch {
      message.error('Error al guardar usuario');
    }
  };

  const filteredUsuarios = usuarios.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.identificacion.includes(searchTerm)
  );

  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={1}>Lista de empleados</Typography.Title>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Space>
          <Button icon={<FilePdfOutlined />} style={{ backgroundColor: 'red', color: 'white' }}>
            Exportar PDF
          </Button>
          <Button type="primary" onClick={handleAdd}>
            + Agregar Usuario
          </Button>
        </Space>
      </div>

      <Table dataSource={filteredUsuarios} rowKey="identificacion" loading={loading}>
        <Column title="Identificación" dataIndex="identificacion" />
        <Column title="Nombre" dataIndex="nombre" />
        <Column title="Correo" dataIndex="correo" />
        <Column title="Celular" dataIndex="celular" />
        <Column title="Estado" dataIndex="estado" />
        <Column title="Rol" dataIndex="rol" />
        <Column
          title="Acciones"
          render={(_, record: Usuario) => (
            <Space>
              <EditOutlined onClick={() => handleEdit(record)} style={{ color: '#1890ff', cursor: 'pointer' }} />
              <Popconfirm
                title="¿Estás seguro de eliminar este usuario?"
                onConfirm={() => handleDelete(record.identificacion)}
                okText="Sí"
                cancelText="No"
              >
                <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

      <UsuarioModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        userToEdit={userToEdit}
        roles={roles}
      />
    </div>
  );
};

export default Usuarios;



