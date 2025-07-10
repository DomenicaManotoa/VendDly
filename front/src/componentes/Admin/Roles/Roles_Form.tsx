import { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';

const Rol_Form = ({
  onClose,
  initialValues,
  onSave,
}: {
  onClose: () => void;
  initialValues?: { key: string; nombre: string };
  onSave: (values: { key?: string; nombre: string }) => void;
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const onFinish = (values: { nombre: string }) => {
    if (!values.nombre.trim()) {
      message.error('El nombre del rol es obligatorio');
      return;
    }
    onSave({ key: initialValues?.key, nombre: values.nombre.trim() });
    onClose();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Nombre del Rol"
        name="nombre"
        rules={[{ required: true, message: 'Por favor ingresa el nombre del rol' }]}
      >
        <Input placeholder="Ejemplo: Administrador" autoFocus />
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

export default Rol_Form;
