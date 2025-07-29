import React, { useRef, useState, useEffect } from 'react';
import { Input, Button, Form, InputNumber, Select, message } from 'antd';
import axios from '../../../utils/axiosConfig';
import { Producto, Marca, Categoria } from '../../../types/types';

interface InventarioFormProps {
  onClose: () => void;
  initialValues?: Producto | null;
  marcas: Marca[];
  categorias: Categoria[];
  onSuccess: () => void;
}

const Inventario_Form: React.FC<InventarioFormProps> = ({ 
  onClose, 
  initialValues, 
  marcas, 
  categorias,
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues) {
      console.log('Valores iniciales para edición:', initialValues);
      
      form.setFieldsValue({
        ...initialValues,
        marcaKey: initialValues.id_marca,
        categoriaKey: initialValues.id_categoria
      });
      
      // Manejar la imagen existente
      if (initialValues.imagen) {
        let imageUrl = initialValues.imagen;
        if (!imageUrl.startsWith('http')) {
          const baseUrl = 'http://127.0.0.1:8000';
          imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
        }
        setPreview(imageUrl);
      }
    } else {
      console.log('Formulario para nuevo producto');
      form.resetFields();
      setPreview(null);
      // Establecer valores por defecto para nuevo producto
      form.setFieldsValue({
        estado: 'activo',
        stock: 0
      });
    }
  }, [initialValues, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      console.log('Valores del formulario:', values);
      
      const formData = new FormData();
      
      // Agregar campos al FormData
      formData.append('nombre', values.nombre || '');
      formData.append('id_marca', values.marcaKey?.toString() || '');
      formData.append('id_categoria', values.categoriaKey?.toString() || '');
      formData.append('stock', (values.stock || 0).toString());
      formData.append('precio_mayorista', (values.precio_mayorista || 0).toString());
      formData.append('precio_minorista', (values.precio_minorista || 0).toString());
      formData.append('estado', values.estado || 'activo');

      // Manejar la imagen
      if (values.imagen && values.imagen instanceof File) {
        formData.append('imagen', values.imagen);
      }

      let response;
      if (initialValues) {
        console.log('Actualizando producto con ID:', initialValues.id_producto);
        response = await axios.put(`/productos/${initialValues.id_producto}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('Producto actualizado correctamente');
      } else {
        console.log('Creando nuevo producto');
        response = await axios.post('/productos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('Producto creado correctamente');
      }
      
      console.log('Respuesta del servidor:', response.data);
      
      onSuccess();
      onClose();
      form.resetFields();
      setPreview(null);
      
    } catch (error: unknown) {
      let errorMessage = 'Error al guardar el producto';
      
      console.error('Error completo:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        
        if (error.response?.status === 401) {
          errorMessage = 'Token de autenticación inválido o expirado';
        } else if (error.response?.status === 403) {
          errorMessage = 'No tienes permisos para realizar esta acción';
        } else if (error.response?.status === 400) {
          errorMessage = error.response?.data?.message || 'Datos inválidos';
        } else if (error.response?.status === 500) {
          errorMessage = 'Error interno del servidor';
        } else {
          errorMessage = error.response?.data?.message || error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name, file.size, file.type);
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        message.error('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        message.error('La imagen no debe superar los 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        form.setFieldsValue({ imagen: file });
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      form.setFieldsValue({ imagen: null });
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setPreview(null);
    onClose();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      style={{ marginTop: 8 }}
    >
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Form.Item
            label="Imagen del producto"
            name="imagen"
            valuePropName="file"
            style={{ width: '100%' }}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ width: '100%' }}
              onChange={handleImageChange}
            />
          </Form.Item>
          {preview && (
            <img
              src={preview}
              alt="Vista previa"
              style={{ 
                width: 160, 
                height: 160, 
                objectFit: 'cover', 
                borderRadius: 8, 
                marginTop: 8, 
                border: '1px solid #eee' 
              }}
            />
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <Form.Item
            label="Nombre del producto"
            name="nombre"
            rules={[
              { required: true, message: 'El nombre del producto es requerido' },
              { min: 2, message: 'El nombre debe tener al menos 2 caracteres' }
            ]}
          >
            <Input placeholder="Ingrese el nombre del producto" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="Marca"
            name="marcaKey"
            rules={[{ required: true, message: 'La marca es requerida' }]}
          >
            <Select
              placeholder="Seleccione una marca"
              options={marcas.map(m => ({ label: m.descripcion, value: m.id_marca }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="Categoría"
            name="categoriaKey"
            rules={[{ required: true, message: 'La categoría es requerida' }]}
          >
            <Select
              placeholder="Seleccione una categoría"
              options={categorias.map(c => ({ label: c.descripcion, value: c.id_categoria }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="Stock disponible"
            name="stock"
            rules={[
              { required: true, message: 'El stock es requerido' },
              { type: 'number', min: 0, message: 'El stock debe ser mayor o igual a 0' }
            ]}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }} 
              placeholder="Cantidad en stock"
            />
          </Form.Item>

          <Form.Item
            label="Estado del producto"
            name="estado"
            rules={[{ required: true, message: 'El estado es requerido' }]}
          >
            <Select
              placeholder="Seleccione el estado"
              options={[
                { label: 'Activo', value: 'activo' },
                { label: 'Inactivo', value: 'inactivo' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Precio minorista"
            name="precio_minorista"
            rules={[
              { required: true, message: 'El precio minorista es requerido' },
              { type: 'number', min: 0, message: 'El precio debe ser mayor a 0' }
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => (value ? `$ ${value}` : '')}
              parser={value => {
                if (!value) return 0 as 0;
                const parsed = value.replace(/\$\s?|(,*)/g, '');
                return (Number(parsed) || 0) as 0;
              }}
              step={0.01}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            label="Precio mayorista"
            name="precio_mayorista"
            rules={[
              { required: true, message: 'El precio mayorista es requerido' },
              { type: 'number', min: 0, message: 'El precio debe ser mayor a 0' }
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => (value ? `$ ${value}` : '')}
              parser={(value: string | undefined) => {
                if (!value) return 0 as 0;
                const parsed = value.replace(/\$\s?|(,*)/g, '');
                return Number(parsed) as unknown as 0;
              }}
              step={0.01}
              placeholder="0.00"
            />
          </Form.Item>
        </div>
      </div>
      
      <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 0, marginTop: 16 }}>
        <Button onClick={handleCancel} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
        >
          {loading ? 'Guardando...' : (initialValues ? 'Guardar Cambios' : 'Agregar Producto')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Inventario_Form;