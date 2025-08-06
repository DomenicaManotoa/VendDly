import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, Card, Row, Col, Tag, message, Spin, Space } from 'antd';
import { EnvironmentOutlined, PlusOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { UbicacionCliente } from '../../../types/types';
import { ubicacionClienteService } from '../../Admin/ubicacionCliente/ubicacionClienteService';
import MapaUbicacionCliente from '../ubicacionCliente/MapaUbicacionCliente';
import FormUbicacionCliente from '../ubicacionCliente/FormUbicacionCliente';
import { clienteService } from '../Clientes/clienteService';

const { Option } = Select;

interface SelectorUbicacionPrincipalProps {
  codCliente: string;
  valorSeleccionado?: number;
  onChange: (idUbicacion?: number) => void;
  disabled?: boolean;
}

const SelectorUbicacionPrincipal: React.FC<SelectorUbicacionPrincipalProps> = ({
  codCliente,
  valorSeleccionado,
  onChange,
  disabled = false
}) => {
  const [ubicaciones, setUbicaciones] = useState<UbicacionCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'create' | 'edit'>('view');
  const [ubicacionParaEditar, setUbicacionParaEditar] = useState<UbicacionCliente | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    if (codCliente) {
      cargarUbicaciones();
      cargarClientes();
    } else {
      setUbicaciones([]);
    }
  }, [codCliente]);

  const cargarUbicaciones = async () => {
    if (!codCliente) return;
    
    try {
      setLoading(true);
      const ubicacionesData = await ubicacionClienteService.getUbicacionesPorCliente(codCliente);
      setUbicaciones(ubicacionesData);
      
      // Si el cliente no tiene ubicación seleccionada pero sí tiene ubicaciones,
      // sugerir la primera como principal
      if (!valorSeleccionado && ubicacionesData.length > 0) {
        message.info('Se sugiere establecer una ubicación como principal');
      }
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      message.error('Error al cargar las ubicaciones del cliente');
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const clientesData = await clienteService.getClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const handleSelectionChange = (value?: number) => {
    onChange(value);
  };

  const abrirModalUbicaciones = (tipo: 'view' | 'create' | 'edit', ubicacion?: UbicacionCliente) => {
    setModalType(tipo);
    setUbicacionParaEditar(ubicacion || null);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setUbicacionParaEditar(null);
  };

  const handleCreateEditUbicacion = async (ubicacionData: UbicacionCliente) => {
    try {
      if (modalType === 'edit' && ubicacionParaEditar?.id_ubicacion) {
        await ubicacionClienteService.updateUbicacion(ubicacionParaEditar.id_ubicacion, ubicacionData);
        message.success('Ubicación actualizada correctamente');
      } else {
        const nuevaUbicacion = await ubicacionClienteService.createUbicacion(ubicacionData);
        message.success('Ubicación creada correctamente');
        
        // Si es la primera ubicación del cliente, establecerla como principal automáticamente
        if (ubicaciones.length === 0) {
          setTimeout(() => {
            onChange(nuevaUbicacion.id_ubicacion);
            message.info('Esta ubicación se ha establecido como principal automáticamente');
          }, 500);
        }
      }
      
      cerrarModal();
      cargarUbicaciones(); // Recargar ubicaciones
    } catch (error) {
      console.error('Error al procesar ubicación:', error);
      message.error(modalType === 'edit' ? 'Error al actualizar ubicación' : 'Error al crear ubicación');
    }
  };

  const handleDeleteUbicacion = async (idUbicacion: number) => {
    try {
      await ubicacionClienteService.deleteUbicacion(idUbicacion);
      message.success('Ubicación eliminada correctamente');
      
      // Si la ubicación eliminada era la principal, limpiar la selección
      if (valorSeleccionado === idUbicacion) {
        onChange(undefined);
      }
      
      cargarUbicaciones();
    } catch (error) {
      console.error('Error al eliminar ubicación:', error);
      message.error('Error al eliminar ubicación');
    }
  };

  const establecerComoPrincipal = async (idUbicacion: number) => {
    try {
      await ubicacionClienteService.setUbicacionPrincipal?.(codCliente, idUbicacion);
      onChange(idUbicacion);
      message.success('Ubicación principal actualizada');
    } catch (error) {
      console.error('Error al establecer ubicación principal:', error);
      // Fallback: establecer localmente
      onChange(idUbicacion);
      message.success('Ubicación principal establecida');
    }
  };

  const getUbicacionSeleccionada = (): UbicacionCliente | undefined => {
    return ubicaciones.find(u => u.id_ubicacion === valorSeleccionado);
  };

  const renderUbicacionCard = (ubicacion: UbicacionCliente, esSeleccionada: boolean = false) => (
    <Card
      key={ubicacion.id_ubicacion}
      size="small"
      className={`mb-2 ${esSeleccionada ? 'border-blue-500 bg-blue-50' : ''}`}
      title={
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <EnvironmentOutlined className="mr-2" />
            {ubicacion.sector}
            {esSeleccionada && <Tag color="blue" className="ml-2">Principal</Tag>}
          </span>
          <Space>
            {!esSeleccionada && (
              <Button
                type="text"
                size="small"
                onClick={() => establecerComoPrincipal(ubicacion.id_ubicacion!)}
              >
                Establecer como Principal
              </Button>
            )}
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => abrirModalUbicaciones('edit', ubicacion)}
            />
          </Space>
        </div>
      }
    >
      <div className="space-y-1 text-sm">
        <p><strong>Dirección:</strong> {ubicacion.direccion}</p>
        {ubicacion.referencia && (
          <p><strong>Referencia:</strong> {ubicacion.referencia}</p>
        )}
        <p><strong>Coordenadas:</strong> {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}</p>
        {ubicacion.fecha_registro && (
          <p><strong>Registrada:</strong> {new Date(ubicacion.fecha_registro).toLocaleDateString()}</p>
        )}
      </div>
    </Card>
  );

  if (!codCliente) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded border-dashed border-2">
        <EnvironmentOutlined className="text-2xl text-gray-400 mb-2" />
        <p className="text-gray-500">Primero debe especificar un código de cliente</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Select
          placeholder={ubicaciones.length === 0 ? "No hay ubicaciones disponibles" : "Seleccione la ubicación principal"}
          loading={loading}
          disabled={disabled || ubicaciones.length === 0}
          allowClear
          value={valorSeleccionado}
          onChange={handleSelectionChange}
          className="flex-1"
          showSearch
          filterOption={(input, option) => {
            if (!option?.children) return false;
            return option.children.toString().toLowerCase().includes(input.toLowerCase());
          }}
        >
          {ubicaciones.map(ubicacion => (
            <Option key={ubicacion.id_ubicacion} value={ubicacion.id_ubicacion}>
              <div>
                <div className="font-semibold">
                  {ubicacion.sector} - {ubicacion.direccion}
                </div>
                {ubicacion.referencia && (
                  <div className="text-xs text-gray-500">
                    Ref: {ubicacion.referencia}
                  </div>
                )}
              </div>
            </Option>
          ))}
        </Select>

        <Button
          type="default"
          icon={<ReloadOutlined />}
          onClick={cargarUbicaciones}
          title="Actualizar ubicaciones"
          loading={loading}
        />

        <Button
          type="dashed"
          icon={<EnvironmentOutlined />}
          onClick={() => abrirModalUbicaciones('view')}
          title="Ver todas las ubicaciones"
          disabled={ubicaciones.length === 0}
        >
          Ver ({ubicaciones.length})
        </Button>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => abrirModalUbicaciones('create')}
          title="Crear nueva ubicación"
        >
          Nueva
        </Button>
      </div>

      {/* Información de la ubicación seleccionada */}
      {valorSeleccionado && getUbicacionSeleccionada() && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center mb-2">
            <EnvironmentOutlined className="text-blue-600 mr-2" />
            <span className="font-semibold text-blue-800">Ubicación Principal Seleccionada</span>
          </div>
          <div className="text-sm text-blue-700">
            <p><strong>Sector:</strong> {getUbicacionSeleccionada()?.sector}</p>
            <p><strong>Dirección:</strong> {getUbicacionSeleccionada()?.direccion}</p>
          </div>
        </div>
      )}

      {/* Alerta cuando no hay ubicaciones */}
      {ubicaciones.length === 0 && !loading && (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded">
          <div className="flex items-center">
            <EnvironmentOutlined className="text-orange-600 mr-2" />
            <span className="text-orange-800">
              Este cliente no tiene ubicaciones registradas.
              <Button 
                type="link" 
                className="p-0 ml-1 h-auto"
                onClick={() => abrirModalUbicaciones('create')}
              >
                Crear la primera ubicación
              </Button>
            </span>
          </div>
        </div>
      )}

      {/* Modal para gestionar ubicaciones */}
      <Modal
        title={
          modalType === 'view' ? `Ubicaciones de Cliente ${codCliente}` : 
          modalType === 'create' ? 'Crear Nueva Ubicación' : 
          'Editar Ubicación'
        }
        open={modalVisible}
        onCancel={cerrarModal}
        footer={null}
        width={900}
        destroyOnClose
      >
        {modalType === 'view' ? (
          <div>
            {loading ? (
              <div className="text-center py-8">
                <Spin size="large" />
                <p className="mt-2">Cargando ubicaciones...</p>
              </div>
            ) : ubicaciones.length > 0 ? (
              <>
                <div className="mb-4">
                  <p className="text-gray-600">
                    Total de ubicaciones: <strong>{ubicaciones.length}</strong>
                  </p>
                </div>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <h4 className="font-semibold mb-3">Lista de Ubicaciones</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {ubicaciones.map(ubicacion => 
                        renderUbicacionCard(
                          ubicacion, 
                          ubicacion.id_ubicacion === valorSeleccionado
                        )
                      )}
                    </div>
                  </Col>
                  <Col span={12}>
                    <h4 className="font-semibold mb-3">Mapa de Ubicaciones</h4>
                    <div style={{ height: '400px' }}>
                      <MapaUbicacionCliente
                        ubicaciones={ubicaciones}
                        readonly={true}
                      />
                    </div>
                  </Col>
                </Row>

                <div className="mt-4 text-center">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setModalType('create');
                    }}
                  >
                    Agregar Nueva Ubicación
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <EnvironmentOutlined className="text-4xl text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay ubicaciones registradas</h3>
                <p className="text-gray-600 mb-4">
                  Este cliente aún no tiene ubicaciones registradas en el sistema.
                </p>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setModalType('create')}
                >
                  Crear Primera Ubicación
                </Button>
              </div>
            )}
          </div>
        ) : (
          <FormUbicacionCliente
            visible={true}
            ubicacion={ubicacionParaEditar}
            clientes={clientes}
            onCancel={cerrarModal}
            onSubmit={handleCreateEditUbicacion}
          />
        )}
      </Modal>
    </div>
  );
};

export default SelectorUbicacionPrincipal;