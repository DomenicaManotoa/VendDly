import React, { useEffect, useState } from 'react';
import {
  Space,
  Table,
  Typography,
  Button,
  Input,
  message,
  Popconfirm,
  Row,
  Col
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { Usuario, Rol } from 'types/types';
import { authService } from '../../../auth/auth';
import UsuarioModal from './Tabla';

const { Column } = Table;

interface UsuarioConRolString extends Omit<Usuario, 'rol'> {
  rol: string;
}

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioConRolString[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Detectar si es pantalla móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup al desmontar
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAxiosConfig = () => {
    const token = authService.getToken();
    if (!token) {
      message.error('No hay token de autenticación. Por favor, inicia sesión.');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const config = getAxiosConfig();
      if (!config) return;
      const response = await axios.get('http://127.0.0.1:8000/usuarios', config);
      // Convertir rol a string
      const usuariosConRol: UsuarioConRolString[] = response.data.map((usuario: any) => {
        let rolDescripcion = 'Sin rol';
        if (usuario.rol) {
          if (typeof usuario.rol === 'string') rolDescripcion = usuario.rol;
          else if (typeof usuario.rol === 'object' && usuario.rol.descripcion)
            rolDescripcion = usuario.rol.descripcion;
        }
        return { ...usuario, rol: rolDescripcion };
      });
      setUsuarios(usuariosConRol);
    } catch (error: any) {
      message.error('Error al obtener usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const config = getAxiosConfig();
      if (!config) return;
      const response = await axios.get('http://127.0.0.1:8000/roles', config);
      setRoles(response.data);
    } catch (error: any) {
      message.error('Error al obtener roles');
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const config = getAxiosConfig();
      if (!config) return;
      const excelConfig = { ...config, responseType: 'blob' as const };
      const response = await axios.get(
        'http://127.0.0.1:8000/usuarios/exportar-excel',
        excelConfig
      );
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      link.href = url;
      link.download = `usuarios_${fecha}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Archivo Excel exportado correctamente');
    } catch (error) {
      message.error('Error al exportar Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      message.error('No estás autenticado. Por favor, inicia sesión.');
      window.location.href = '/login';
      return;
    }
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
      const config = getAxiosConfig();
      if (!config) return;
      await axios.delete(
        `http://127.0.0.1:8000/usuarios/${identificacion}`,
        config
      );
      message.success('Usuario eliminado correctamente');
      fetchUsuarios();
    } catch (error: any) {
      message.error('Error al eliminar usuario');
    }
  };

  const handleSubmit = async (usuario: Usuario) => {
    try {
      const config = getAxiosConfig();
      if (!config) return;

      if (userToEdit) {
        await axios.put(
          `http://127.0.0.1:8000/usuarios/${usuario.identificacion}`,
          usuario,
          config
        );
        message.success('Usuario actualizado correctamente');
      } else {
        await axios.post('http://127.0.0.1:8000/usuarios', usuario, config);
        message.success('Usuario agregado correctamente');
      }
      setModalVisible(false);
      fetchUsuarios();
    } catch (error: any) {
      message.error('Error al guardar usuario');
    }
  };

  const filteredUsuarios = usuarios.filter(
    (user) =>
      user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.identificacion?.includes(searchTerm)
  );

  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={2}>Lista de empleados</Typography.Title>

      <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12}>
          <Input
            placeholder="Buscar por nombre o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Space style={{ width: '100%', justifyContent: 'end', flexWrap: 'wrap' }}>
            <Button
              icon={<FileExcelOutlined />}
              style={{ backgroundColor: 'green', color: 'white' }}
              onClick={handleExportExcel}
              loading={exportingExcel}
              disabled={usuarios.length === 0}
            >
              {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
            </Button>
            <Button type="primary" onClick={handleAdd}>
              + Agregar Usuario
            </Button>
          </Space>
        </Col>
      </Row>

      {isMobile ? (
        // Vista cards para celular
        <Space direction="vertical" style={{ width: '100%' }}>
          {filteredUsuarios.length === 0 && !loading && (
            <Typography.Text>No hay datos disponibles</Typography.Text>
          )}
          {filteredUsuarios.map((usuario) => (
            <div
              key={usuario.identificacion}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)',
                backgroundColor: '#fff',
              }}
            >
              <Typography.Title level={5}>{usuario.nombre}</Typography.Title>
              <Typography.Text>
                <b>Identificación:</b> {usuario.identificacion}
              </Typography.Text>
              <br />
              <Typography.Text>
                <b>Correo:</b> {usuario.correo || '-'}
              </Typography.Text>
              <br />
              <Typography.Text>
                <b>Celular:</b> {usuario.celular || '-'}
              </Typography.Text>
              <br />
              <Typography.Text>
                <b>Estado:</b>{' '}
                <span style={{ color: usuario.estado === 'activo' ? 'green' : 'red', fontWeight: 'bold' }}>
                  {usuario.estado}
                </span>
              </Typography.Text>
              <br />
              <Typography.Text>
                <b>Rol:</b> {usuario.rol || 'Sin rol'}
              </Typography.Text>
              <br />
              <Space style={{ marginTop: 8 }}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(usuario)}
                  size="small"
                >
                  Editar
                </Button>
                <Popconfirm
                  title="¿Estás seguro de eliminar este usuario?"
                  onConfirm={() => handleDelete(usuario.identificacion)}
                  okText="Sí"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button icon={<DeleteOutlined />} danger size="small">
                    Eliminar
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          ))}
          {loading && <Typography.Text>Cargando...</Typography.Text>}
        </Space>
      ) : (
        // Vista tabla para desktop
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={filteredUsuarios}
            rowKey="identificacion"
            loading={loading}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: loading ? 'Cargando...' : 'No hay datos disponibles'
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} usuarios`
            }}
          >
            <Column title="Identificación" dataIndex="identificacion" sorter />
            <Column title="Nombre" dataIndex="nombre" sorter />
            <Column title="Correo" dataIndex="correo" />
            <Column title="Celular" dataIndex="celular" />
            <Column
              title="Estado"
              dataIndex="estado"
              render={(estado: string) => (
                <span
                  style={{
                    color: estado === 'activo' ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}
                >
                  {estado}
                </span>
              )}
            />
            <Column title="Rol" dataIndex="rol" />
            <Column
              title="Acciones"
              render={(_, record: UsuarioConRolString) => (
                <Space>
                  <EditOutlined
                    onClick={() => handleEdit(record)}
                    style={{
                      color: '#1890ff',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    title="Editar usuario"
                  />
                  <Popconfirm
                    title="¿Estás seguro de eliminar este usuario?"
                    description="Esta acción no se puede deshacer"
                    onConfirm={() => handleDelete(record.identificacion)}
                    okText="Sí, eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                  >
                    <DeleteOutlined
                      style={{
                        color: '#ff4d4f',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                      title="Eliminar usuario"
                    />
                  </Popconfirm>
                </Space>
              )}
            />
          </Table>
        </div>
      )}

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
