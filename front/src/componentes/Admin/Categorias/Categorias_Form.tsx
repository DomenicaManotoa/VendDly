import { useEffect } from 'react';
import { Form, Input, Button, message, Space, Grid } from 'antd';

const { useBreakpoint } = Grid;

const Categoria_Form = ({
  onClose,
  initialValues,
  onSave,
}: {
  onClose: () => void;
  initialValues?: { key: string; nombre: string };
  onSave: (values: { key?: string; nombre: string }) => void;
}) => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const onFinish = (values: { nombre: string }) => {
    if (!values.nombre.trim()) {
      message.error('El nombre de la categoría es obligatorio');
      return;
    }
    onSave({ key: initialValues?.key, nombre: values.nombre.trim() });
    onClose();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      style={{ width: '100%' }}
    >
      <Form.Item
        label="Nombre de la Categoría"
        name="nombre"
        rules={[
          { required: true, message: 'Por favor ingresa el nombre de la categoría' }
        ]}
      >
        <Input placeholder="Ejemplo: Categoría XYZ" autoFocus />
      </Form.Item>

      <Form.Item style={{ textAlign: isMobile ? 'center' : 'right' }}>
        <Space wrap size="middle">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit">
            Guardar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default Categoria_Form;
