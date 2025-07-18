import React, { useRef, useState, useEffect } from 'react';
import { Input, Button, Form, InputNumber, Select } from 'antd';

interface Marca {
  key: string;
  nombre: string;
}

interface Categoria {
  key: string;
  nombre: string;
}

interface InventarioFormProps {
  onClose: () => void;
  initialValues?: any;
  marcas: Marca[];
  categorias: Categoria[];
}

const Inventario_Form: React.FC<InventarioFormProps> = ({ onClose, initialValues, marcas, categorias }) => {
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.imagen) {
        setPreview(initialValues.imagen);
      }
    } else {
      form.resetFields();
      setPreview(null);
    }
  }, [initialValues, form]);

  const handleFinish = (values: any) => {
    console.log('Formulario enviado:', values);
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
              style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '1px solid #eee' }}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item
            label="Nombre del producto"
            name="nombre"
            rules={[{ required: true, message: 'Ingrese el nombre del producto' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Marca"
            name="marcaKey"
            rules={[{ required: true, message: 'Seleccione la marca' }]}
          >
            <Select
              placeholder="Seleccione una marca"
              options={marcas.map(m => ({ label: m.nombre, value: m.key }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="Categoría"
            name="categoriaKey"
            rules={[{ required: true, message: 'Seleccione la categoría' }]}
          >
            <Select
              placeholder="Seleccione una categoría"
              options={categorias.map(c => ({ label: c.nombre, value: c.key }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="Descripción del producto"
            name="descripcion"
            rules={[{ required: true, message: 'Ingrese la descripción' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Precio minorista"
            name="precio_minorista"
            rules={[{ required: true, message: 'Ingrese el precio minorista' }]}
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
            />
          </Form.Item>

          <Form.Item
            label="Precio mayorista"
            name="precio_mayorista"
            rules={[{ required: true, message: 'Ingrese el precio mayorista' }]}
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
            />
          </Form.Item>
        </div>
      </div>
      <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 0 }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" style={{ background: '#2e7d32', borderColor: '#2e7d32' }}>
          {initialValues ? 'Guardar Cambios' : 'Agregar'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Inventario_Form;
