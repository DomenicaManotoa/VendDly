import { DatePicker, Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FormClientesProps } from "types/types";

const FormClientes: React.FC<FormClientesProps> = ({ cliente, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (cliente !== undefined) {
      setIsModalVisible(true);
      if (cliente) {
        const formData = {
          ...cliente,
          fecha_registro: cliente.fecha_registro ? dayjs(cliente.fecha_registro) : dayjs()
        };
        form.setFieldsValue(formData);
      } else {
        form.resetFields();
        form.setFieldsValue({
          estado: 'Activo',
          fecha_registro: dayjs()
        });
      }
    } else {
      setIsModalVisible(false);
    }
  }, [cliente, form]);

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        const formattedValues = {
          ...values,
          fecha_registro: values.fecha_registro
            ? values.fecha_registro.format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD')
        };
        onSubmit(formattedValues);
        form.resetFields();
        setIsModalVisible(false);
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
    if (value !== 'empresa') {
      form.setFieldsValue({ razon_social: '' });
    }
  };

  return (
    <Modal
      title={cliente ? 'Editar Cliente' : 'Agregar Cliente'}
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Guardar"
      cancelText="Cancelar"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="cod_cliente"
          label="Código de Cliente"
          rules={[{ required: false, message: 'El código de cliente es opcional' }]}
        >
          <Input disabled placeholder="Código autogenerado" />
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
            <Select.Option value="individual">Natural</Select.Option>
            <Select.Option value="empresa">Empresa</Select.Option>
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
        >
          <DatePicker 
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            disabled={!!cliente}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FormClientes;
