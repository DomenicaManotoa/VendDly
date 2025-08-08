import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import { Props } from 'types/types';
import dayjs from 'dayjs';

export const UsuarioModal: React.FC<Props> = ({ visible, onCancel, onSubmit, userToEdit, roles }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (userToEdit) {
      // CAMBIO 5: Mapear los datos del usuario para el formulario SIN incluir la contraseña
      const formData = {
        ...userToEdit,
        id_rol: typeof userToEdit.rol === 'object' && userToEdit.rol ? userToEdit.rol.id_rol : userToEdit.id_rol,
        fecha_actualizacion: userToEdit.fecha_actualizacion ? dayjs(userToEdit.fecha_actualizacion) : dayjs(),
        // CAMBIO 6: NO establecer la contraseña en el formulario para edición
        contrasena: undefined // Esto garantiza que el campo esté vacío
      };
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
      // Establecer valores por defecto para nuevo usuario
      form.setFieldsValue({
        estado: 'activo', // CAMBIO 7: Cambiar 'Activo' por 'activo' para consistencia
        fecha_actualizacion: dayjs()
      });
    }
  }, [userToEdit, form]);

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        console.log('Valores del formulario antes de procesar:', values);
        
        // CAMBIO 8: Mejorar el formateo de los datos antes de enviar
        const formattedValues = {
          ...values,
          fecha_actualizacion: values.fecha_actualizacion ? 
            values.fecha_actualizacion.format('YYYY-MM-DD') : 
            dayjs().format('YYYY-MM-DD')
        };
        
        // CAMBIO 9: Manejo más robusto de la contraseña para edición
        if (userToEdit) {
          // Si es edición y la contraseña está vacía o solo espacios, no enviarla
          if (!values.contrasena || values.contrasena.trim() === '') {
            delete formattedValues.contrasena;
            console.log('Edición: Contraseña vacía, manteniendo la actual');
          } else {
            console.log('Edición: Nueva contraseña proporcionada, será actualizada');
          }
        } else {
          // Para nuevo usuario, la contraseña es obligatoria
          console.log('Nuevo usuario: Contraseña será hasheada');
        }
        
        console.log('Datos formateados a enviar:', {
          ...formattedValues,
          contrasena: formattedValues.contrasena ? '***OCULTA***' : 'NO_ENVIADA'
        });
        
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
          // CAMBIO 10: Agregar ayuda visual para el usuario
          help={userToEdit ? "Dejar vacío para mantener la contraseña actual" : undefined}
        >
          <Input.Password 
            placeholder={userToEdit ? "Nueva contraseña (opcional)" : "Ingrese la contraseña"} 
            maxLength={100}
            // CAMBIO 11: Limpiar el valor por defecto para edición
            value={userToEdit ? undefined : undefined}
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
              { value: 'activo', label: 'Activo' },
              { value: 'inactivo', label: 'Inactivo' }
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