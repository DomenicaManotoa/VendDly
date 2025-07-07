import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { Props } from 'types/types';

export const UsuarioModal: React.FC<Props> = ({ visible, onCancel, onSubmit, userToEdit, roles }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (userToEdit) {
      form.setFieldsValue(userToEdit);
    } else {
      form.resetFields();
    }
  }, [userToEdit, form]);

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        onSubmit(values);
        form.resetFields();
      });
  };

  return (
    <Modal
      title={userToEdit ? 'Editar Usuario' : 'Agregar Usuario'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Guardar"
      cancelText="Cancelar"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="identificacion" label="Identificación" rules={[{ required: true }]}>
          <Input disabled={!!userToEdit} />
        </Form.Item>
        <Form.Item name="rucempresarial" label="RUC Empresarial">
          <Input />
        </Form.Item>
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="correo" label="Correo" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="celular" label="Celular" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="contrasena" label="Contraseña" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="estado" label="Estado" rules={[{ required: true }]}>
          <Select options={[
            { value: 'Activo', label: 'Activo' },
            { value: 'Inactivo', label: 'Inactivo' }
          ]} />
        </Form.Item>
        <Form.Item name="id_rol" label="Rol" rules={[{ required: true }]}>
          <Select
            options={roles.map(rol => ({
              value: rol.id_rol,
              label: rol.descripcion
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default UsuarioModal;