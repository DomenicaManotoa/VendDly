import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, Card, message } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { FormUbicacionClienteProps, UbicacionCliente } from '../../../types/types';
import { clienteService } from '../Clientes/clienteService';
import MapaUbicacionCliente from './MapaUbicacionCliente';

const { Option } = Select;
const { TextArea } = Input;

const FormUbicacionCliente: React.FC<FormUbicacionClienteProps> = ({
  visible,
  ubicacion,
  clientes,
  onCancel,
  onSubmit
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>();
  
  // NUEVO: Estado para mantener información de la última búsqueda
  const [lastSearchInfo, setLastSearchInfo] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      if (ubicacion) {
        // Editar ubicación existente
        form.setFieldsValue({
          cod_cliente: ubicacion.cod_cliente,
          direccion: ubicacion.direccion,
          sector: ubicacion.sector,
          referencia: ubicacion.referencia,
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud
        });
        setSelectedLocation({
          lat: ubicacion.latitud,
          lng: ubicacion.longitud
        });
        // Limpiar información de búsqueda anterior al editar
        setLastSearchInfo(null);
      } else {
        // Nueva ubicación
        form.resetFields();
        setSelectedLocation(undefined);
        // Mantener la información de búsqueda anterior si existe
      }
    } else {
      // Solo limpiar cuando se cierre el modal completamente
      setLastSearchInfo(null);
      setSelectedLocation(undefined);
    }
  }, [visible, ubicacion, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const ubicacionData: UbicacionCliente = {
        cod_cliente: values.cod_cliente,
        direccion: values.direccion,
        sector: values.sector,
        referencia: values.referencia || '',
        latitud: parseFloat(values.latitud),
        longitud: parseFloat(values.longitud)
      };

      // Llamar al onSubmit original
      await onSubmit(ubicacionData);
      
      // Si es una nueva ubicación (no edición), el backend ya manejará la lógica
      // de establecer la ubicación como principal si el cliente no tiene una
      
      form.resetFields();
      setSelectedLocation(undefined);
      // MANTENER la información de búsqueda para uso futuro
      // setLastSearchInfo(null); // NO limpiar aquí
      
      message.success(ubicacion ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente');
      
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      message.error('Error al procesar la ubicación');
    } finally {
      setLoading(false);
    }
  };

  // ACTUALIZADO: Manejar selección de ubicación desde el mapa
  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    console.log('📍 Ubicación seleccionada:', { lat, lng, address });
    
    setSelectedLocation({ lat, lng });
    form.setFieldsValue({
      latitud: lat.toFixed(8),
      longitud: lng.toFixed(8)
    });
    
    // NUEVO: Si viene de una búsqueda (tiene address), guardar la información
    if (address) {
      setLastSearchInfo({
        address,
        lat,
        lng
      });
      
      // Solo actualizar dirección si está vacía o si viene de búsqueda
      if (!form.getFieldValue('direccion') || form.getFieldValue('direccion').trim() === '') {
        form.setFieldsValue({ direccion: address });
      }
    }
    
    // NO limpiar lastSearchInfo cuando se selecciona manualmente
  };

  // Función para obtener el nombre del cliente por código
  const getClienteNombre = (codCliente: string) => {
    const cliente = clientes.find(c => c.cod_cliente === codCliente);
    return cliente ? cliente.nombre : `Cliente ${codCliente}`;
  };

  // NUEVO: Función para limpiar la búsqueda manualmente
  const clearSearchInfo = () => {
    setLastSearchInfo(null);
    message.info('Información de búsqueda limpiada');
  };

  // NUEVO: Función para aplicar la búsqueda guardada a los campos del formulario
  const applySearchToForm = () => {
    if (lastSearchInfo) {
      form.setFieldsValue({
        direccion: lastSearchInfo.address,
        latitud: lastSearchInfo.lat.toFixed(8),
        longitud: lastSearchInfo.lng.toFixed(8)
      });
      setSelectedLocation({
        lat: lastSearchInfo.lat,
        lng: lastSearchInfo.lng
      });
      message.success('Información de búsqueda aplicada al formulario');
    }
  };

  return (
    <Modal
      title={ubicacion ? 'Editar Ubicación de Cliente' : 'Nueva Ubicación de Cliente'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="cod_cliente"
              label="Cliente"
              rules={[{ required: true, message: 'Por favor seleccione un cliente' }]}
            >
              <Select
                placeholder="Seleccione un cliente"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const label = option?.label?.toString().toLowerCase() || '';
                  return label.includes(input.toLowerCase());
                }}
                style={{ width: '100%' }}
                options={clientes.map(cliente => ({
                  value: cliente.cod_cliente,
                  label: cliente.nombre,
                  key: cliente.cod_cliente
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="direccion"
              label="Dirección"
              rules={[{ required: true, message: 'Por favor ingrese la dirección' }]}
            >
              <TextArea 
                rows={2} 
                placeholder="Ingrese la dirección completa del cliente"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="sector"
              label="Sector"
              rules={[{ required: true, message: 'Por favor ingrese el sector' }]}
            >
              <Input 
                placeholder="Escriba el sector (ej: Centro Norte, La Mariscal, etc.)"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="latitud"
              label="Latitud"
              rules={[
                { required: true, message: 'Por favor ingrese la latitud' },
                { pattern: /^-?\d+\.?\d*$/, message: 'Formato de latitud inválido' }
              ]}
            >
              <Input 
                placeholder="-0.2298500"
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="longitud"
              label="Longitud"
              rules={[
                { required: true, message: 'Por favor ingrese la longitud' },
                { pattern: /^-?\d+\.?\d*$/, message: 'Formato de longitud inválido' }
              ]}
            >
              <Input 
                placeholder="-78.5249500"
                readOnly
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="referencia"
          label="Referencia (Opcional)"
        >
          <TextArea 
            rows={2} 
            placeholder="Puntos de referencia adicionales (ej: frente al parque, esquina con...)"
          />
        </Form.Item>

        {/* NUEVO: Mostrar información de búsqueda persistente */}
        {lastSearchInfo && (
          <Card size="small" className="mb-4" style={{ backgroundColor: '#f0f8ff', borderColor: '#1890ff' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm">
                  <strong className="text-blue-700">🔍 Última búsqueda:</strong>
                  <div className="text-gray-700 mt-1">{lastSearchInfo.address}</div>
                  <div className="text-gray-500 text-xs">
                    Lat: {lastSearchInfo.lat.toFixed(6)}, Lng: {lastSearchInfo.lng.toFixed(6)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={applySearchToForm}
                  title="Aplicar esta búsqueda al formulario"
                >
                  Usar
                </Button>
                <Button 
                  size="small" 
                  type="text" 
                  onClick={clearSearchInfo}
                  title="Limpiar búsqueda"
                >
                  ×
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Botón para mostrar/ocultar mapa */}
        <div className="mb-4">
          <Button 
            type="dashed" 
            icon={<EnvironmentOutlined />}
            onClick={() => setShowMap(!showMap)}
            block
          >
            {showMap ? 'Ocultar Mapa' : 'Seleccionar en Mapa'}
          </Button>
        </div>

        {/* Mapa para seleccionar ubicación */}
        {showMap && (
          <Card className="mb-4">
            <div style={{ height: '400px' }}>
              <MapaUbicacionCliente
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                readonly={false}
              />
            </div>
          </Card>
        )}

        {/* Información del cliente seleccionado */}
        {form.getFieldValue('cod_cliente') && (
          <Card className="mb-4" size="small">
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>Cliente seleccionado:</strong> {getClienteNombre(form.getFieldValue('cod_cliente'))}
              <br />
              <em>Nota: Si este cliente no tiene ubicación principal, esta ubicación se establecerá automáticamente como principal.</em>
            </div>
          </Card>
        )}

        {/* NUEVO: Información sobre el estado actual de ubicaciones */}
        {(selectedLocation || lastSearchInfo) && (
          <Card size="small" className="mb-4" style={{ backgroundColor: '#f6ffed', borderColor: '#52c41a' }}>
            <div style={{ fontSize: '12px' }}>
              <strong className="text-green-700">📍 Estado de Ubicaciones:</strong>
              <div className="mt-2 space-y-1">
                {selectedLocation && (
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2 inline-block"></span>
                    <span>Ubicación en formulario: ({selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)})</span>
                  </div>
                )}
                {lastSearchInfo && (
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2 inline-block"></span>
                    <span>Búsqueda guardada: {lastSearchInfo.address}</span>
                  </div>
                )}
                <div className="text-gray-500 text-xs mt-1">
                  💡 La búsqueda se mantiene disponible independientemente de la ubicación seleccionada
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Botones del formulario */}
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
          >
            {ubicacion ? 'Actualizar' : 'Crear'} Ubicación
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default FormUbicacionCliente;