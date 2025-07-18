import React, { useEffect, useState } from 'react';
import { Space, Table, Typography, Button, Input, message, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, SearchOutlined, FileExcelOutlined  } from '@ant-design/icons';
import axios from 'axios';
import { Usuario } from 'types/types';
import { authService } from '../../../auth/auth';
import UsuarioModal from './Tabla';

const { Column } = Table;

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null);
  const [roles, setRoles] = useState([]);
  const [exportingExcel, setExportingExcel] = useState(false); // ← Nuevo estado para controlar el loading del botón Excel

  // Configurar axios con el token
  const getAxiosConfig = () => {
    const token = authService.getToken();
    console.log('Token obtenido para axios:', token ? 'Sí' : 'No');
    
    if (!token) {
      console.error('No se encontró token de autenticación');
      message.error('No hay token de autenticación. Por favor, inicia sesión.');
      return null;
    }

    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const config = getAxiosConfig();
      if (!config) {
        setLoading(false);
        return;
      }

      console.log('Enviando petición para obtener usuarios...');
      console.log('Configuración de axios:', config);
      
      const response = await axios.get('http://127.0.0.1:8000/usuarios', config);
      console.log('Respuesta del servidor:', response.status);
      console.log('Datos recibidos:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Los datos recibidos no son un array:', response.data);
        message.error('Formato de datos incorrecto del servidor');
        return;
      }
      
      // Mapear los datos para incluir la descripción del rol
      const usuariosConRol = response.data.map((usuario: any) => {
        console.log('Procesando usuario:', usuario);
        
        let rolDescripcion = 'Sin rol';
        if (usuario.rol) {
          if (typeof usuario.rol === 'string') {
            rolDescripcion = usuario.rol;
          } else if (typeof usuario.rol === 'object' && usuario.rol.descripcion) {
            rolDescripcion = usuario.rol.descripcion;
          }
        }
        
        return {
          ...usuario,
          rol: rolDescripcion
        };
      });
      
      console.log('Usuarios procesados:', usuariosConRol);
      setUsuarios(usuariosConRol);
      
      if (usuariosConRol.length === 0) {
        message.info('No se encontraron usuarios en la base de datos');
      } else {
        message.success(`Se cargaron ${usuariosConRol.length} usuarios correctamente`);
      }
      
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido o expirado');
        authService.logout();
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para ver los usuarios');
      } else if (error.response?.status === 500) {
        message.error('Error interno del servidor');
      } else if (error.code === 'ERR_NETWORK') {
        message.error('Error de conexión con el servidor');
      } else {
        message.error(`Error al obtener usuarios: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const config = getAxiosConfig();
      if (!config) return;
      
      console.log('Obteniendo roles...');
      const response = await axios.get('http://127.0.0.1:8000/roles', config);
      console.log('Roles obtenidos:', response.data);
      setRoles(response.data);
    } catch (error: any) {
      console.error('Error al obtener roles:', error);
      message.error('Error al obtener roles');
    }
  };

  // ← Nueva función para exportar a Excel
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const config = getAxiosConfig();
      if (!config) {
        setExportingExcel(false);
        return;
      }

      // Configurar axios para recibir un blob (archivo)
      const excelConfig = {
        ...config,
        responseType: 'blob' as const
      };

      console.log('Iniciando exportación a Excel...');
      const response = await axios.get('http://127.0.0.1:8000/usuarios/exportar-excel', excelConfig);
      
      // Crear un blob con el archivo Excel
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo con fecha actual
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      link.download = `usuarios_${fecha}.xlsx`;
      
      // Hacer clic automáticamente para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Archivo Excel exportado correctamente');
      
    } catch (error: any) {
      console.error('Error al exportar Excel:', error);
      
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido o expirado');
        authService.logout();
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para exportar datos');
      } else if (error.response?.status === 500) {
        message.error('Error interno del servidor al generar el archivo');
      } else {
        message.error('Error al exportar archivo Excel');
      }
    } finally {
      setExportingExcel(false);
    }
  };

  useEffect(() => {
    console.log('Componente Usuarios montado');
    
    // Verificar autenticación
    if (!authService.isAuthenticated()) {
      message.error('No estás autenticado. Por favor, inicia sesión.');
      window.location.href = '/login';
      return;
    }
    
    const token = authService.getToken();
    console.log('Token encontrado en useEffect:', token ? 'Sí' : 'No');
    
    if (!token) {
      message.error('No hay token de autenticación. Por favor, inicia sesión.');
      window.location.href = '/login';
      return;
    }
    
    console.log('Iniciando carga de datos...');
    fetchUsuarios();
    fetchRoles();
  }, []);

  const handleAdd = () => {
    setUserToEdit(null);
    setModalVisible(true);
  };

  const handleEdit = (usuario: Usuario) => {
    console.log('Editando usuario:', usuario);
    setUserToEdit(usuario);
    setModalVisible(true);
  };

  const handleDelete = async (identificacion: string) => {
    try {
      console.log("Eliminando usuario con ID:", identificacion);
      const config = getAxiosConfig();
      if (!config) return;
      
      await axios.delete(`http://127.0.0.1:8000/usuarios/${identificacion}`, config);
      message.success('Usuario eliminado correctamente');
      fetchUsuarios(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido');
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para eliminar usuarios');
      } else if (error.response?.status === 404) {
        message.error('Usuario no encontrado');
      } else {
        message.error('Error al eliminar usuario');
      }
    }
  };

  const handleSubmit = async (usuario: Usuario) => {
    try {
      const config = getAxiosConfig();
      if (!config) return;
      
      console.log('Enviando datos del usuario:', usuario);
      
      if (userToEdit) {
        await axios.put(`http://127.0.0.1:8000/usuarios/${usuario.identificacion}`, usuario, config);
        message.success('Usuario actualizado correctamente');
      } else {
        await axios.post('http://127.0.0.1:8000/usuarios', usuario, config);
        message.success('Usuario agregado correctamente');
      }
      setModalVisible(false);
      fetchUsuarios(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      if (error.response?.status === 401) {
        message.error('Token de autenticación inválido');
      } else if (error.response?.status === 403) {
        message.error('No tienes permisos para realizar esta acción');
      } else {
        message.error('Error al guardar usuario');
      }
    }
  };

  const filteredUsuarios = usuarios.filter(user =>
    user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.identificacion?.includes(searchTerm)
  );

  console.log('Usuarios filtrados para renderizar:', filteredUsuarios);

  // Mostrar información de debug
  const debugInfo = {
    token: authService.getToken() ? 'Presente' : 'Ausente',
    authenticated: authService.isAuthenticated(),
    usuariosLength: usuarios.length,
    loading: loading
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={1}>Lista de empleados</Typography.Title>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Input
          placeholder="Buscar por nombre o identificación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Space>
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
      </div>

      <Table 
        dataSource={filteredUsuarios} 
        rowKey="identificacion" 
        loading={loading}
        locale={{
          emptyText: loading ? 'Cargando...' : 'No hay datos disponibles'
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} usuarios`
        }}
      >
        <Column title="Identificación" dataIndex="identificacion" sorter />
        <Column title="Nombre" dataIndex="nombre" sorter />
        <Column title="Correo" dataIndex="correo" />
        <Column title="Celular" dataIndex="celular" />
        <Column title="Estado" dataIndex="estado" 
          render={(estado: string) => (
            <span style={{ 
              color: estado === 'activo' ? 'green' : 'red',
              fontWeight: 'bold'
            }}>
              {estado}
            </span>
          )}
        />
        <Column title="Rol" dataIndex="rol" />
        <Column
          title="Acciones"
          render={(_, record: Usuario) => (
            <Space>
              <EditOutlined 
                onClick={() => handleEdit(record)} 
                style={{ color: '#1890ff', cursor: 'pointer', fontSize: '16px' }} 
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
                  style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }} 
                  title="Eliminar usuario"
                />
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