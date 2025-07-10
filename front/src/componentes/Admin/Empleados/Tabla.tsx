import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import { Props } from 'types/types';
import dayjs from 'dayjs';

export const UsuarioModal: React.FC<Props> = ({ visible, onCancel, onSubmit, userToEdit, roles }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (userToEdit) {
      // Mapear los datos del usuario para el formulario
      const formData = {
        ...userToEdit,
        id_rol: typeof userToEdit.rol === 'object' && userToEdit.rol ? userToEdit.rol.id_rol : userToEdit.id_rol,
        fecha_actualizacion: userToEdit.fecha_actualizacion ? dayjs(userToEdit.fecha_actualizacion) : dayjs()
      };
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
      // Establecer valores por defecto para nuevo usuario
      form.setFieldsValue({
        estado: 'Activo',
        fecha_actualizacion: dayjs()
      });
    }
  }, [userToEdit, form]);

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        // Formatear los datos antes de enviar
        const formattedValues = {
          ...values,
          fecha_actualizacion: values.fecha_actualizacion ? values.fecha_actualizacion.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
        };
        
        // Si es edición, no enviar la contraseña vacía
        if (userToEdit && !values.contrasena) {
          delete formattedValues.contrasena;
        }
        
        onSubmit(formattedValues);
        form.resetFields();
      })
      .catch(info => {
        console.log('Validation failed:', info);
      });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={userToEdit ? 'Editar Usuario' : 'Agregar Usuario'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Guardar"
      cancelText="Cancelar"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="identificacion" 
          label="Identificación" 
          rules={[
            { required: true, message: 'La identificación es requerida' },
            { min: 10, message: 'La identificación debe tener al menos 10 caracteres' }
          ]}
        >
          <Input 
            disabled={!!userToEdit} 
            placeholder="Ingrese la identificación"
            maxLength={50}
          />
        </Form.Item>
        
        <Form.Item 
          name="rucempresarial" 
          label="RUC Empresarial"
          rules={[
            { min: 10, message: 'El RUC debe tener al menos 10 caracteres' }
          ]}
        >
          <Input placeholder="Ingrese el RUC empresarial" maxLength={50} />
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
          label="Correo" 
          rules={[
            { required: true, message: 'El correo es requerido' },
            { type: 'email', message: 'Ingrese un correo válido' }
          ]}
        >
          <Input placeholder="correo@ejemplo.com" maxLength={100} />
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
          name="contrasena" 
          label={userToEdit ? "Nueva Contraseña (opcional)" : "Contraseña"} 
          rules={userToEdit ? [] : [
            { required: true, message: 'La contraseña es requerida' },
            { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
          ]}
        >
          <Input.Password 
            placeholder={userToEdit ? "Dejar vacío para mantener la actual" : "Ingrese la contraseña"} 
            maxLength={100}
          />
        </Form.Item>
        
        <Form.Item 
          name="estado" 
          label="Estado" 
          rules={[{ required: true, message: 'El estado es requerido' }]}
        >
          <Select 
            placeholder="Seleccione el estado"
            options={[
              { value: 'activo', label: 'activo' },
              { value: 'inactivo', label: 'inactivo' }
            ]} 
          />
        </Form.Item>
        
        <Form.Item 
          name="id_rol" 
          label="Rol" 
          rules={[{ required: true, message: 'El rol es requerido' }]}
        >
          <Select
            placeholder="Seleccione un rol"
            options={roles.map((rol: any) => ({
              value: rol.id_rol,
              label: rol.descripcion
            }))}
          />
        </Form.Item>
        
        <Form.Item 
          name="fecha_actualizacion" 
          label="Fecha de Actualización"
        >
          <DatePicker 
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            disabled
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UsuarioModal;