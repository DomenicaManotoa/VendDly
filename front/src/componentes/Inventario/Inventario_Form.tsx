import React, { useRef, useState } from 'react';
import { Input, Button, Form, InputNumber } from 'antd';

interface InventarioFormProps {
  onClose: () => void;
}

const Inventario_Form: React.FC<InventarioFormProps> = ({ onClose }) => {
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFinish = (values: any) => {
    // Aquí puedes manejar los datos del backend
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
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
        {/* Campos a la derecha */}
        <div style={{ flex: 1 }}>
          <Form.Item
            label="Nombre del producto"
            name="nombre"
            rules={[{ required: true, message: 'Ingrese el nombre del producto' }]}
          >
            <Input />
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
              prefix="$"
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
              prefix="$"
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
          Agregar
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Inventario_Form;