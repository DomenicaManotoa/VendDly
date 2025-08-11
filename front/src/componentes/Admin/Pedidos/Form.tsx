import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Cliente, Pedido, DetallePedido, Producto } from "types/types";
import { Button, Form, InputNumber, Select, DatePicker, message, Space, Typography, Input } from "antd";

const { Text } = Typography;

interface FormCrearPedidoProps {
  onCancel: () => void;
  onSubmit: () => void;
  clientes: Cliente[];
  pedidoEditar?: Pedido | null;
}

const FormCrearPedido = ({ onCancel, onSubmit, clientes, pedidoEditar }: FormCrearPedidoProps) => {
  const [form] = Form.useForm();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [tipoCliente, setTipoCliente] = useState<"natural" | "juridico" | null>(null);
  // Estado para controlar el stock disponible por producto
  const [stockDisponible, setStockDisponible] = useState<{[key: number]: number}>({});
  // Estado para controlar errores de stock por detalle
  const [erroresStock, setErroresStock] = useState<{[key: number]: boolean}>({});

  // Función para obtener configuración de autenticación
  const getAxiosConfig = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      message.error('No hay token de autenticación. Por favor, inicia sesión.');
      return null;
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Función para validar stock de un detalle específico
  const validarStockDetalle = (idProducto: number, cantidad: number, indexDetalle: number) => {
    const stockDisponibleDetalle = getStockDisponibleParaDetalle(idProducto, indexDetalle);
    return cantidad <= stockDisponibleDetalle;
  };

  // Función para actualizar errores de stock
  const actualizarErroresStock = () => {
    const nuevosErrores: {[key: number]: boolean} = {};
    
    detalles.forEach((detalle, index) => {
      const cantidad = Number(detalle.cantidad) || 0;
      const stockValido = validarStockDetalle(detalle.id_producto, cantidad, index);
      nuevosErrores[index] = !stockValido;
    });
    
    setErroresStock(nuevosErrores);
  };
  const calcularStockDisponible = () => {
    const stockTemp: {[key: number]: number} = {};
    
    productos.forEach(producto => {
      // Stock inicial del producto
      let stockActual = Number(producto.stock) || 0;
      
      // Restar las cantidades ya seleccionadas en otros detalles
      detalles.forEach(detalle => {
        if (detalle.id_producto === producto.id_producto) {
          stockActual -= Number(detalle.cantidad) || 0;
        }
      });
      
      stockTemp[producto.id_producto] = Math.max(0, stockActual);
    });
    
    setStockDisponible(stockTemp);
  };

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const config = getAxiosConfig();
        if (!config) return;
        
        const response = await axios.get("http://127.0.0.1:8000/productos", config);
        setProductos(response.data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        message.error("Error al cargar productos");
      }
    };

    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalcular stock disponible cuando cambien los productos o detalles
  useEffect(() => {
    if (productos.length > 0) {
      calcularStockDisponible();
      actualizarErroresStock();
    }
  }, [productos, detalles]);

  useEffect(() => {
    if (pedidoEditar) {
      // Establecer valores del formulario para edición
      form.setFieldsValue({
        ...pedidoEditar,
        fecha_pedido: dayjs(pedidoEditar.fecha_pedido),
        cod_cliente: pedidoEditar.cod_cliente,
      });

      // Establecer tipo de cliente
      const cliente = clientes.find(c => c.cod_cliente === pedidoEditar.cod_cliente);
      setTipoCliente(cliente?.tipo_cliente === "juridico" ? "juridico" : "natural");
      
      // Establecer detalles existentes (sin descuento)
      const detallesSinDescuento = (pedidoEditar.detalles || []).map(detalle => ({
        ...detalle,
        descuento: 0, // Eliminamos el descuento
        subtotal: detalle.cantidad * detalle.precio_unitario, // Recalculamos sin descuento
        subtotal_lineal: detalle.cantidad * detalle.precio_unitario
      }));
      setDetalles(detallesSinDescuento);
    } else {
      // Resetear formulario para nuevo pedido
      form.resetFields();
      setDetalles([]);
      setTipoCliente(null);
    }
  }, [pedidoEditar, clientes, form]);

  const onClienteChange = (cod_cliente: string) => {
    form.setFieldsValue({ cod_cliente });
    const cliente = clientes.find(c => c.cod_cliente === cod_cliente);
    const nuevoTipo = cliente?.tipo_cliente === "juridico" ? "juridico" : "natural";
    setTipoCliente(nuevoTipo);

    // Actualizar precios según tipo de cliente
    const nuevosDetalles = detalles.map(d => {
      const producto = productos.find(p => p.id_producto === d.id_producto);
      if (!producto) return d;
      
      const precioUnitario = nuevoTipo === "juridico" ? producto.precio_mayorista : producto.precio_minorista;
      const subtotal = d.cantidad * precioUnitario;
      
      return { 
        ...d, 
        precio_unitario: precioUnitario, 
        subtotal_lineal: subtotal, 
        subtotal,
        descuento: 0 // Eliminamos el descuento
      };
    });
    setDetalles(nuevosDetalles);
  };

  const agregarDetalle = () => {
    if (productos.length === 0) {
      message.warning("No hay productos disponibles");
      return;
    }

    // Buscar el primer producto con stock disponible
    const productoConStock = productos.find(p => (stockDisponible[p.id_producto] || 0) > 0);
    
    if (!productoConStock) {
      message.warning("No hay productos con stock disponible");
      return;
    }

    const precioInicial = tipoCliente === "juridico" 
      ? productoConStock.precio_mayorista 
      : productoConStock.precio_minorista;
    
    const nuevoDetalle: DetallePedido = {
      id_detalle_pedido: Date.now(), // ID temporal para el frontend
      id_pedido: 0, // Se asignará al crear el pedido
      id_producto: productoConStock.id_producto,
      cantidad: 1,
      descuento: 0, // Eliminamos el descuento
      precio_unitario: precioInicial,
      subtotal_lineal: precioInicial * 1,
      subtotal: precioInicial * 1,
    };

    setDetalles([...detalles, nuevoDetalle]);
  };

  const actualizarDetalle = (index: number, campo: string, valor: any) => {
    const nuevos = [...detalles];
    const detalleAnterior = { ...nuevos[index] };
    
    if (campo === "id_producto") {
      const producto = productos.find(p => p.id_producto === valor);
      if (producto) {
        // Verificar si el nuevo producto tiene stock disponible
        const stockDisponibleProducto = stockDisponible[valor] || 0;
        if (stockDisponibleProducto <= 0) {
          message.warning(`El producto ${producto.nombre} no tiene stock disponible`);
          return;
        }
        
        const precioUnitario = tipoCliente === "juridico" 
          ? Number(producto.precio_mayorista) || 0
          : Number(producto.precio_minorista) || 0;
        
        nuevos[index].precio_unitario = precioUnitario;
        nuevos[index].id_producto = Number(valor) || 0;
        // Ajustar cantidad si excede el stock disponible
        nuevos[index].cantidad = Math.min(Number(nuevos[index].cantidad) || 0, stockDisponibleProducto);
      }
    } else if (campo === "cantidad") {
      const producto = productos.find(p => p.id_producto === nuevos[index].id_producto);
      if (producto) {
        // Calcular stock disponible para este producto (incluyendo la cantidad actual del detalle)
        let stockActual = Number(producto.stock) || 0;
        detalles.forEach((detalle, i) => {
          if (i !== index && detalle.id_producto === nuevos[index].id_producto) {
            stockActual -= Number(detalle.cantidad) || 0;
          }
        });
        
        const maxCantidad = Math.max(0, stockActual);
        const valorNumerico = Number(valor) || 0;
        
        if (valorNumerico > maxCantidad) {
          nuevos[index].cantidad = valorNumerico; // Permitir el valor pero marcarlo como error
        } else {
          nuevos[index].cantidad = valorNumerico;
        }
      }
    }
    
    // Recalcular subtotales (sin descuento)
    const cantidad = Number(nuevos[index].cantidad) || 0;
    const precioUnitario = Number(nuevos[index].precio_unitario) || 0;
    nuevos[index].subtotal_lineal = cantidad * precioUnitario;
    nuevos[index].subtotal = nuevos[index].subtotal_lineal;
    nuevos[index].descuento = 0; // Mantenemos descuento en 0
    
    setDetalles(nuevos);
  };

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  // Obtener stock disponible para un producto específico en un detalle específico
  const getStockDisponibleParaDetalle = (idProducto: number, indexDetalle: number) => {
    const producto = productos.find(p => p.id_producto === idProducto);
    if (!producto) return 0;
    
    let stockActual = Number(producto.stock) || 0;
    detalles.forEach((detalle, i) => {
      if (i !== indexDetalle && detalle.id_producto === idProducto) {
        stockActual -= Number(detalle.cantidad) || 0;
      }
    });
    
    return Math.max(0, stockActual);
  };

  // Verificar si hay errores de stock
  const hayErroresStock = Object.values(erroresStock).some(error => error);

  // Cálculos totales (sin descuento)
  const subtotalGeneral = detalles.reduce((acc, d) => acc + d.subtotal, 0);
  const ivaGeneral = detalles.reduce((acc, d) => acc + (d.subtotal * 0.12), 0);
  const totalGeneral = subtotalGeneral + ivaGeneral;

  const handleFinish = async (values: any) => {
    try {
      if (detalles.length === 0) {
        message.error("Debe agregar al menos un producto al pedido");
        return;
      }

      // Verificar errores de stock
      if (hayErroresStock) {
        message.error("Hay productos con stock excedido. Por favor, corrija las cantidades.");
        return;
      }

      const config = getAxiosConfig();
      if (!config) return;

      if (pedidoEditar) {
        // Actualizar pedido existente
        const datosActualizacion = {
          numero_pedido: values.numero_pedido || pedidoEditar.numero_pedido,
          fecha_pedido: values.fecha_pedido.format("YYYY-MM-DD"),
          cod_cliente: values.cod_cliente,
          subtotal: subtotalGeneral,
          iva: ivaGeneral,
          total: totalGeneral,
          detalles: detalles.map(d => ({
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: 0, // Sin descuento
            subtotal_lineal: d.subtotal_lineal,
            subtotal: d.subtotal
          }))
        };

        await axios.put(
          `http://127.0.0.1:8000/pedidos/${pedidoEditar.id_pedido}`, 
          datosActualizacion,
          config
        );
        message.success("Pedido actualizado correctamente");
      } else {
        // Crear nuevo pedido
        const datosCreacion = {
          numero_pedido: values.numero_pedido || `PED-${Date.now()}`,
          fecha_pedido: values.fecha_pedido.format("YYYY-MM-DD"),
          cod_cliente: values.cod_cliente,
          subtotal: subtotalGeneral,
          iva: ivaGeneral,
          total: totalGeneral,
          id_ubicacion_entrega: null,
          id_ruta_venta: null,
          id_ruta_entrega: null,
          detalle_pedido: detalles.map(d => ({
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: 0, // Sin descuento
            subtotal_lineal: d.subtotal_lineal,
            subtotal: d.subtotal
          }))
        };

        console.log("Datos a enviar:", datosCreacion);
        await axios.post("http://127.0.0.1:8000/pedidos", datosCreacion, config);
        message.success("Pedido creado correctamente");
      }

      onSubmit();
    } catch (error: any) {
      console.error("Error al guardar pedido:", error);
      
      if (error.response?.status === 401) {
        message.error("No autorizado. Por favor, inicia sesión nuevamente.");
        window.location.href = '/login';
      } else if (error.response?.status === 400) {
        message.error(error.response.data.detail || "Datos inválidos");
      } else {
        message.error("Error al guardar el pedido. Intente nuevamente.");
      }
    }
  };

  return (
    <Form 
      layout="vertical" 
      form={form} 
      onFinish={handleFinish} 
      style={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      <Form.Item 
        name="cod_cliente" 
        label="Cliente" 
        rules={[{ required: true, message: "Seleccione un cliente" }]}
      >
        <Select
          options={clientes.map(c => ({ 
            value: c.cod_cliente, 
            label: `${c.nombre} (${c.cod_cliente})` 
          }))}
          onChange={onClienteChange}
          placeholder="Seleccione un cliente"
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>

      <Form.Item 
        name="fecha_pedido" 
        label="Fecha del Pedido" 
        rules={[{ required: true, message: "Seleccione una fecha" }]}
      >
        <DatePicker 
          style={{ width: "100%" }} 
          format="YYYY-MM-DD"
          placeholder="Seleccione fecha"
        />
      </Form.Item>

      <Form.Item name="numero_pedido" label="Número de Pedido (Opcional)">
        <Input 
          placeholder="Se generará automáticamente si se deja vacío"
        />
      </Form.Item>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>Productos del Pedido</h4>
          <Button 
            type="dashed" 
            onClick={agregarDetalle}
            disabled={!tipoCliente}
          >
            Agregar Producto
          </Button>
        </div>

        {!tipoCliente && (
          <Text type="secondary" style={{ fontStyle: "italic" }}>
            Seleccione un cliente para agregar productos
          </Text>
        )}
      </div>

      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16, paddingRight: 8 }}>
        {detalles.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "20px", 
            border: "2px dashed #d9d9d9", 
            borderRadius: "6px",
            color: "#999"
          }}>
            No hay productos agregados al pedido
          </div>
        ) : (
          detalles.map((detalle, index) => {
            const producto = productos.find(p => p.id_producto === detalle.id_producto);
            const stockDisponibleDetalle = getStockDisponibleParaDetalle(detalle.id_producto, index);
            
            return (
              <div
                key={detalle.id_detalle_pedido}
                style={{ 
                  display: "flex", 
                  marginBottom: 12, 
                  padding: "12px",
                  border: "1px solid #f0f0f0",
                  borderRadius: "6px",
                  backgroundColor: "#fafafa",
                  flexWrap: "wrap", 
                  gap: 8,
                  alignItems: "center"
                }}
              >
                <Select
                  value={detalle.id_producto}
                  onChange={value => actualizarDetalle(index, "id_producto", value)}
                  options={productos
                    .filter(p => (stockDisponible[p.id_producto] || 0) > 0 || p.id_producto === detalle.id_producto)
                    .map(p => ({ 
                      value: p.id_producto, 
                      label: `${p.nombre} - ${Number(tipoCliente === "juridico" ? p.precio_mayorista : p.precio_minorista).toFixed(2)} (Stock: ${Number(p.stock) || 0})` 
                    }))}
                  style={{ width: 300, minWidth: 250 }}
                  placeholder="Seleccionar producto"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Text style={{ fontSize: "12px", marginBottom: 2 }}>Cantidad</Text>
                  <InputNumber
                    value={detalle.cantidad}
                    min={1}
                    onChange={value => actualizarDetalle(index, "cantidad", value || 1)}
                    style={{ 
                      width: 80,
                      borderColor: erroresStock[index] ? '#ff4d4f' : undefined
                    }}
                    status={erroresStock[index] ? 'error' : undefined}
                  />
                  {erroresStock[index] && (
                    <Text style={{ 
                      fontSize: "11px", 
                      color: "#ff4d4f", 
                      marginTop: 2,
                      textAlign: "center"
                    }}>
                      Stock excedido
                    </Text>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Text style={{ fontSize: "12px", marginBottom: 2 }}>Precio Unit.</Text>
                  <Text strong style={{ 
                    padding: "4px 8px", 
                    backgroundColor: "#e6f7ff", 
                    border: "1px solid #91d5ff",
                    borderRadius: "4px",
                    minWidth: "80px",
                    textAlign: "center"
                  }}>
                    ${Number(detalle.precio_unitario).toFixed(2)}
                  </Text>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Text style={{ fontSize: "12px", marginBottom: 2 }}>Subtotal</Text>
                  <Text strong style={{ color: "#1890ff" }}>
                    ${Number(detalle.subtotal).toFixed(2)}
                  </Text>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Text style={{ fontSize: "12px", marginBottom: 2 }}>IVA (12%)</Text>
                  <Text style={{ color: "#faad14" }}>
                    ${(Number(detalle.subtotal) * 0.12).toFixed(2)}
                  </Text>
                </div>

                <Button 
                  danger 
                  size="small"
                  onClick={() => eliminarDetalle(index)}
                  style={{ marginLeft: "auto" }}
                >
                  Eliminar
                </Button>
              </div>
            );
          })
        )}
      </div>

      {detalles.length > 0 && (
        <div style={{ 
          marginTop: 20, 
          padding: "16px", 
          backgroundColor: "#f6f8fa", 
          borderRadius: "6px",
          border: "1px solid #e1e4e8" 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Text>Subtotal:</Text>
            <Text strong>${subtotalGeneral.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Text>IVA (12%):</Text>
            <Text strong style={{ color: "#faad14" }}>${ivaGeneral.toFixed(2)}</Text>
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            paddingTop: 8, 
            borderTop: "2px solid #d9d9d9" 
          }}>
            <Text strong style={{ fontSize: "16px" }}>Total:</Text>
            <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
              ${totalGeneral.toFixed(2)}
            </Text>
          </div>
        </div>
      )}

      <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
        <Space>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            disabled={detalles.length === 0 || hayErroresStock}
            style={{
              backgroundColor: hayErroresStock ? '#d9d9d9' : undefined,
              borderColor: hayErroresStock ? '#d9d9d9' : undefined
            }}
          >
            {pedidoEditar ? "Actualizar Pedido" : "Crear Pedido"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FormCrearPedido;