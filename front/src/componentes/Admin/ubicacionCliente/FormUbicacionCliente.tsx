import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, Card, message, Drawer } from 'antd';
import { EnvironmentOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
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
  const [isMobile, setIsMobile] = useState(false);
  
  // Estado para mantener información de la última búsqueda
  const [lastSearchInfo, setLastSearchInfo] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Detectar el tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
        setLastSearchInfo(null);
      } else {
        // Nueva ubicación
        form.resetFields();
        setSelectedLocation(undefined);
      }
    } else {
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

      await onSubmit(ubicacionData);
      
      form.resetFields();
      setSelectedLocation(undefined);
      
      message.success(ubicacion ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente');
      
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      message.error('Error al procesar la ubicación');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    console.log('📍 Ubicación seleccionada:', { lat, lng, address });
    
    setSelectedLocation({ lat, lng });
    form.setFieldsValue({
      latitud: lat.toFixed(8),
      longitud: lng.toFixed(8)
    });
    
    if (address) {
      setLastSearchInfo({
        address,
        lat,
        lng
      });
      
      if (!form.getFieldValue('direccion') || form.getFieldValue('direccion').trim() === '') {
        form.setFieldsValue({ direccion: address });
      }
    }
  };

  const getClienteNombre = (codCliente: string) => {
    const cliente = clientes.find(c => c.cod_cliente === codCliente);
    return cliente ? cliente.nombre : `Cliente ${codCliente}`;
  };

  const clearSearchInfo = () => {
    setLastSearchInfo(null);
    message.info('Información de búsqueda limpiada');
  };

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

  // Componente del formulario
  const FormContent = () => (
    <div className="space-y-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <Row gutter={isMobile ? [0, 16] : [16, 16]}>
          <Col xs={24}>
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
                size={isMobile ? "large" : "middle"}
                options={clientes.map(cliente => ({
                  value: cliente.cod_cliente,
                  label: cliente.nombre,
                  key: cliente.cod_cliente
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={isMobile ? [0, 16] : [16, 16]}>
          <Col xs={24}>
            <Form.Item
              name="direccion"
              label="Dirección"
              rules={[{ required: true, message: 'Por favor ingrese la dirección' }]}
            >
              <TextArea 
                rows={isMobile ? 3 : 2}
                placeholder="Ingrese la dirección completa del cliente"
                size={isMobile ? "large" : "middle"}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={isMobile ? [0, 16] : [16, 16]}>
          <Col xs={24}>
            <Form.Item
              name="sector"
              label="Sector"
              rules={[{ required: true, message: 'Por favor ingrese el sector' }]}
            >
              <Input 
                placeholder="Ej: Centro Norte, La Mariscal"
                size={isMobile ? "large" : "middle"}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={isMobile ? [0, 16] : [16, 16]}>
          <Col xs={24} sm={12}>
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
                size={isMobile ? "large" : "middle"}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
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
                size={isMobile ? "large" : "middle"}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="referencia"
          label="Referencia (Opcional)"
        >
          <TextArea 
            rows={isMobile ? 3 : 2}
            placeholder="Puntos de referencia adicionales"
            size={isMobile ? "large" : "middle"}
          />
        </Form.Item>

        {/* Información de búsqueda persistente */}
        {lastSearchInfo && (
          <Card 
            size="small" 
            className="bg-blue-50 border-blue-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <strong className="text-blue-700">🔍 Última búsqueda:</strong>
                  <div className="text-gray-700 mt-1 break-words">{lastSearchInfo.address}</div>
                  <div className="text-gray-500 text-xs">
                    Lat: {lastSearchInfo.lat.toFixed(6)}, Lng: {lastSearchInfo.lng.toFixed(6)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={applySearchToForm}
                  className="w-full sm:w-auto"
                >
                  Usar
                </Button>
                <Button 
                  size="small" 
                  type="text" 
                  onClick={clearSearchInfo}
                  icon={<CloseOutlined />}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Botón para mapa */}
        <div className="space-y-3">
          <Button 
            type="dashed" 
            icon={<EnvironmentOutlined />}
            onClick={() => setShowMap(!showMap)}
            block
            size={isMobile ? "large" : "middle"}
          >
            {showMap ? 'Ocultar Mapa' : 'Seleccionar en Mapa'}
          </Button>

          {/* Mapa para móvil - en drawer */}
          {isMobile && showMap && (
            <Drawer
              title="Seleccionar Ubicación"
              placement="bottom"
              onClose={() => setShowMap(false)}
              open={showMap}
              height="80vh"
            >
              <div style={{ height: '100%' }}>
                <MapaUbicacionCliente
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                  readonly={false}
                />
              </div>
            </Drawer>
          )}

          {/* Mapa para desktop - inline */}
          {!isMobile && showMap && (
            <Card>
              <div style={{ height: '400px' }}>
                <MapaUbicacionCliente
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                  readonly={false}
                />
              </div>
            </Card>
          )}
        </div>

        {/* Información del cliente */}
        {form.getFieldValue('cod_cliente') && (
          <Card 
            size="small"
            className="bg-gray-50"
          >
            <div className="text-xs sm:text-sm text-gray-600">
              <strong>Cliente seleccionado:</strong> {getClienteNombre(form.getFieldValue('cod_cliente'))}
              <br />
              <em>Nota: Si este cliente no tiene ubicación principal, esta ubicación se establecerá automáticamente como principal.</em>
            </div>
          </Card>
        )}

        {/* Estado de ubicaciones */}
        {(selectedLocation || lastSearchInfo) && (
          <Card 
            size="small" 
            className="bg-green-50 border-green-200"
          >
            <div className="text-xs sm:text-sm">
              <strong className="text-green-700">📍 Estado de Ubicaciones:</strong>
              <div className="mt-2 space-y-1">
                {selectedLocation && (
                  <div className="flex items-center text-xs sm:text-sm">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-2"></span>
                    <span>Formulario: ({selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)})</span>
                  </div>
                )}
                {lastSearchInfo && (
                  <div className="flex items-center text-xs sm:text-sm">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-2"></span>
                    <span className="truncate">Búsqueda: {lastSearchInfo.address}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Botones del formulario */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t">
          <Button 
            onClick={onCancel}
            size={isMobile ? "large" : "middle"}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size={isMobile ? "large" : "middle"}
            className="w-full sm:w-auto"
          >
            {ubicacion ? 'Actualizar' : 'Crear'} Ubicación
          </Button>
        </div>
      </Form>
    </div>
  );

  // Renderizado condicional: Modal para desktop, Drawer para móvil
  if (isMobile) {
    return (
      <Drawer
        title={ubicacion ? 'Editar Ubicación' : 'Nueva Ubicación'}
        placement="bottom"
        onClose={onCancel}
        open={visible}
        height="95vh"
        className="mobile-form-drawer"
      >
        <div className="p-4">
          <FormContent />
        </div>
      </Drawer>
    );
  }

  return (
    <Modal
      title={ubicacion ? 'Editar Ubicación de Cliente' : 'Nueva Ubicación de Cliente'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnClose
      className="desktop-form-modal"
    >
      <FormContent />
    </Modal>
  );
};

export default FormUbicacionCliente;