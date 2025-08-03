import { DatePicker, Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FormClientesProps } from "types/types";

const FormClientes: React.FC<FormClientesProps> = ({ 
  cliente, 
  visible, 
  onCancel, 
  onSubmit 
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (cliente) {
        // Edición de cliente existente
        const formData = {
          ...cliente,
          fecha_registro: cliente.fecha_registro ? dayjs(cliente.fecha_registro) : dayjs()
        };
        form.setFieldsValue(formData);
      } else {
        // Nuevo cliente
        form.resetFields();
        form.setFieldsValue({
          tipo_cliente: 'Natural',
          fecha_registro: dayjs(),
          estado: 'Activo'
        });
      }
    }
  }, [cliente, visible, form]);

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        const formattedValues = {
          ...values,
          fecha_registro: dayjs().format('YYYY-MM-DD')
        };
        onSubmit(formattedValues);
        form.resetFields();
      })
      .catch(info => {
        console.log('Validation failed:', info);
      });
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    onCancel();
  };

  const handleTipoClienteChange = (value: string) => {
    if (value !== 'Jurídico') {
      form.setFieldsValue({ razon_social: '' });
    }
  };

  return (
    <Modal
      title={cliente ? 'Editar Cliente' : 'Agregar Cliente'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Guardar"
      cancelText="Cancelar"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
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
          />
        </Form.Item>
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
        
        <Form.Item 
          name="direccion" 
          label="Dirección" 
          rules={[{ required: true, message: 'La dirección es requerida' }]}
        >
          <Input placeholder="Ingrese la dirección" maxLength={100} />
        </Form.Item>
        
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

        <Form.Item
          name="razon_social"
          label="Razón Social"
          rules={[{ max: 100, message: 'Máximo 100 caracteres' }]}
        >
          <Input placeholder="Ingrese la razón social (opcional)" />
        </Form.Item>  

        <Form.Item 
          name="sector" 
          label="Sector"
          rules={[{ required: true, message: 'El sector es requerido' }]}
        >
          <Input placeholder="Ingrese el sector" maxLength={100} />
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
