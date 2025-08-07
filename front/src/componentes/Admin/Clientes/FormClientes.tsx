import { DatePicker, Form, Input, Modal, Select, Button, Space, message } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FormClientesProps, UbicacionCliente } from "types/types";
import { ubicacionClienteService } from "../../Admin/ubicacionCliente/ubicacionClienteService";
import { EnvironmentOutlined } from "@ant-design/icons";
import SelectorUbicacionPrincipal from "./SelectorUbicacionPrincipal";

const FormClientes: React.FC<FormClientesProps> = ({ 
  cliente, 
  visible, 
  onCancel, 
  onSubmit 
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [ubicacionesCliente, setUbicacionesCliente] = useState<UbicacionCliente[]>([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);
  const [currentCodCliente, setCurrentCodCliente] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (cliente) {
        // Edición de cliente existente
        const formData = {
          ...cliente,
          fecha_registro: cliente.fecha_registro ? dayjs(cliente.fecha_registro) : dayjs()
        };
        form.setFieldsValue(formData);
        setCurrentCodCliente(cliente.cod_cliente);
        
        // Cargar ubicaciones del cliente si existe
        if (cliente.cod_cliente) {
          cargarUbicacionesCliente(cliente.cod_cliente);
        }
      } else {
        // Nuevo cliente
        form.resetFields();
        form.setFieldsValue({
          tipo_cliente: 'Natural',
          fecha_registro: dayjs(),
          estado: 'Activo'
        });
        setUbicacionesCliente([]);
        setCurrentCodCliente('');
      }
    }
  }, [cliente, visible, form]);

  const cargarUbicacionesCliente = async (codCliente: string) => {
    try {
      setLoadingUbicaciones(true);
      const ubicaciones = await ubicacionClienteService.getUbicacionesPorCliente(codCliente);
      setUbicacionesCliente(ubicaciones);
    } catch (error) {
      console.error('Error al cargar ubicaciones del cliente:', error);
      setUbicacionesCliente([]);
    } finally {
      setLoadingUbicaciones(false);
    }
  };

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        const formattedValues = {
          ...values,
          fecha_registro: dayjs().format('YYYY-MM-DD'),
          // Asegurar que id_ubicacion_principal sea un número o null
          id_ubicacion_principal: values.id_ubicacion_principal ? 
            parseInt(values.id_ubicacion_principal) : null
        };
        onSubmit(formattedValues);
        form.resetFields();
        setUbicacionesCliente([]);
        setCurrentCodCliente('');
      })
      .catch(info => {
        console.log('Validation failed:', info);
      });
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setUbicacionesCliente([]);
    setCurrentCodCliente('');
    onCancel();
  };

  const handleTipoClienteChange = (value: string) => {
    if (value !== 'Jurídico') {
      form.setFieldsValue({ razon_social: '' });
    }
  };

  const handleClienteCodeChange = (value: string) => {
    // Si cambia el código del cliente, limpiar las ubicaciones
    if (value !== cliente?.cod_cliente) {
      setUbicacionesCliente([]);
      form.setFieldsValue({ id_ubicacion_principal: undefined });
      setCurrentCodCliente(value);
    }
  };

  const handleUbicacionPrincipalChange = (idUbicacion?: number) => {
    form.setFieldsValue({ id_ubicacion_principal: idUbicacion });
  };

  return (
    <Modal
      title={cliente ? 'Editar Cliente' : 'Agregar Cliente'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Guardar"
      cancelText="Cancelar"
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Form.Item 
              name="cod_cliente" 
              label="Código de Cliente" 
              rules={[
                { required: true, message: 'El código de cliente es requerido' },
                { min: 3, message: 'El código debe tener al menos 3 caracteres' },
                { max: 50, message: 'El código no puede exceder los 50 caracteres' }
              ]}
            >
              <Input 
                placeholder="Ingrese el código del cliente" 
                maxLength={50}
                disabled={!!cliente?.cod_cliente}
                onChange={(e) => handleClienteCodeChange(e.target.value)}
              />
            </Form.Item>
          </div>
          
          <div style={{ flex: 1 }}>
            <Form.Item 
              name="identificacion" 
              label="Identificación" 
              rules={[
                { required: true, message: 'La identificación es requerida' },
                { min: 10, message: 'La identificación debe tener al menos 10 caracteres' }
              ]}
            >
              <Input 
                disabled={!!cliente} 
                placeholder="Ingrese la identificación"
                maxLength={50}
              />
            </Form.Item>
          </div>
        </div>
        
        <Form.Item 
          name="nombre" 
          label="Nombre" 
          rules={[
            { required: true, message: 'El nombre es requerido' },
            { min: 2, message: 'El nombre debe tener al menos 2 caracteres' }
          ]}
        >
          <Input placeholder="Ingrese el nombre completo" maxLength={100} />
        </Form.Item>

        <Form.Item 
          name="correo" 
          label="Correo Electrónico"
          rules={[
            { required: true, message: 'El correo es requerido' },
            { type: 'email', message: 'Ingrese un correo válido' }
          ]}
        >
          <Input placeholder="Ingrese el correo electrónico" maxLength={100} />
        </Form.Item>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Form.Item 
              name="direccion" 
              label="Dirección" 
              rules={[{ required: true, message: 'La dirección es requerida' }]}
            >
              <Input placeholder="Ingrese la dirección" maxLength={100} />
            </Form.Item>
          </div>
          
          <div style={{ flex: 1 }}>
            <Form.Item 
              name="celular" 
              label="Celular" 
              rules={[
                { required: true, message: 'El celular es requerido' },
                { min: 10, message: 'El celular debe tener al menos 10 dígitos' }
              ]}
            >
              <Input placeholder="Ingrese el número de celular" maxLength={20} />
            </Form.Item>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Form.Item 
              name="tipo_cliente" 
              label="Tipo de Cliente"
              rules={[{ required: true, message: 'El tipo de cliente es requerido' }]}
            >
              <Select 
                placeholder="Seleccione el tipo de cliente"
                onChange={handleTipoClienteChange}
              >
                <Select.Option value="Natural">Natural</Select.Option>
                <Select.Option value="Jurídico">Jurídico</Select.Option>
              </Select>
            </Form.Item>
          </div>
          
          <div style={{ flex: 1 }}>
            <Form.Item 
              name="sector" 
              label="Sector"
              rules={[{ required: true, message: 'El sector es requerido' }]}
            >
              <Input placeholder="Ingrese el sector" maxLength={100} />
            </Form.Item>
          </div>
        </div>

        <Form.Item
          name="razon_social"
          label="Razón Social"
          rules={[{ max: 100, message: 'Máximo 100 caracteres' }]}
        >
          <Input placeholder="Ingrese la razón social (opcional)" />
        </Form.Item>

        {/* Selector de ubicación principal simplificado */}
        <Form.Item
          name="id_ubicacion_principal"
          label="Ubicación Principal"
          help="Seleccione la ubicación principal del cliente. Esta será la ubicación predeterminada para pedidos y facturación."
        >
          <SelectorUbicacionPrincipal
            codCliente={currentCodCliente || form.getFieldValue('cod_cliente')}
            valorSeleccionado={form.getFieldValue('id_ubicacion_principal')}
            onChange={handleUbicacionPrincipalChange}
            disabled={!currentCodCliente && !form.getFieldValue('cod_cliente')}
          />
        </Form.Item>

        <Form.Item 
          name="fecha_registro" 
          label="Fecha de Registro"
          hidden // Ocultamos el campo pero sigue enviando el valor
          initialValue={dayjs()}
        >
          <Input type="hidden" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FormClientes;