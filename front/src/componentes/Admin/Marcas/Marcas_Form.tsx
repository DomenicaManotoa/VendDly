import { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';

type MarcaFormProps = {
  onClose: () => void;
  onSave: (values: { nombre: string }) => void;
  initialValues?: { nombre: string };
};

const Marca_Form = ({ onClose, onSave, initialValues }: MarcaFormProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({ nombre: initialValues.nombre });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const onFinish = (values: { nombre: string }) => {
    if (!values.nombre.trim()) {
      message.error('El nombre es obligatorio');
      return;
    }
    onSave({ nombre: values.nombre.trim() });
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

export default Marca_Form;
