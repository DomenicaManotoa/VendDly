import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Cliente, Pedido, DetallePedido, Producto, Categoria, Marca } from "types/types";
import { Button, Form, InputNumber, Select, DatePicker, message, Space, Typography, Input, Divider } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option, OptGroup } = Select;

interface FormCrearPedidoProps {
  onCancel: () => void;
  onSubmit: () => void;
  clientes: Cliente[];
  pedidoEditar?: Pedido | null;
}

const FormCrearPedido = ({ onCancel, onSubmit, clientes, pedidoEditar }: FormCrearPedidoProps) => {
  const [form] = Form.useForm();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [tipoCliente, setTipoCliente] = useState<"natural" | "juridico" | null>(null);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | undefined>(undefined);

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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const config = getAxiosConfig();
        if (!config) return;
        
        // Cargar productos, categorías y marcas en paralelo
        const [productosRes, categoriasRes, marcasRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/productos", config),
          axios.get("http://127.0.0.1:8000/categorias", config).catch(() => ({ data: [] })),
          axios.get("http://127.0.0.1:8000/marcas", config).catch(() => ({ data: [] }))
        ]);

        setProductos(productosRes.data);
        setCategorias(categoriasRes.data);
        setMarcas(marcasRes.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        message.error("Error al cargar los datos necesarios");
      }
    };

    cargarDatos();
  }, []);

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
      
      // Establecer detalles existentes
      setDetalles(pedidoEditar.detalles || []);
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
      const subtotal_lineal = d.cantidad * precioUnitario;
      const subtotal = subtotal_lineal - d.descuento;
      
      return { 
        ...d, 
        precio_unitario: precioUnitario, 
        subtotal_lineal, 
        subtotal 
      };
    });
    setDetalles(nuevosDetalles);
  };

  // Filtrar productos según búsqueda y categoría
  const productosFiltrados = productos.filter(producto => {
    const coincideNombre = producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase());
    const coincideCategoria = categoriaFiltro ? producto.id_categoria === categoriaFiltro : true;
    const coincideMarca = producto.marca?.descripcion?.toLowerCase().includes(busquedaProducto.toLowerCase()) || false;
    
    return (coincideNombre || coincideMarca) && coincideCategoria;
  });

  // Agrupar productos por categoría para el select
  const productosAgrupados = () => {
    const grupos: { [key: string]: Producto[] } = {};
    
    productosFiltrados.forEach(producto => {
      const nombreCategoria = producto.categoria?.descripcion || 'Sin categoría';
      if (!grupos[nombreCategoria]) {
        grupos[nombreCategoria] = [];
      }
      grupos[nombreCategoria].push(producto);
    });

    return grupos;
  };

  const obtenerNombreProducto = (id_producto: number) => {
    const producto = productos.find(p => p.id_producto === id_producto);
    return producto ? producto.nombre : `Producto #${id_producto}`;
  };

  const agregarDetalle = () => {
    if (productos.length === 0) {
      message.warning("No hay productos disponibles");
      return;
    }

    const productosDisponibles = productosFiltrados.length > 0 ? productosFiltrados : productos;
    const precioInicial = tipoCliente === "juridico" 
      ? productosDisponibles[0].precio_mayorista 
      : productosDisponibles[0].precio_minorista;
    
    const nuevoDetalle: DetallePedido = {
      id_detalle_pedido: Date.now(), // ID temporal para el frontend
      id_pedido: 0, // Se asignará al crear el pedido
      id_producto: productosDisponibles[0].id_producto,
      cantidad: 1,
      descuento: 0,
      precio_unitario: precioInicial,
      subtotal_lineal: precioInicial * 1,
      subtotal: precioInicial * 1,
    };

    setDetalles([...detalles, nuevoDetalle]);
  };

  const actualizarDetalle = (index: number, campo: string, valor: any) => {
    const nuevos = [...detalles];
    
    if (campo === "id_producto") {
      const producto = productos.find(p => p.id_producto === valor);
      if (producto) {
        const precioUnitario = tipoCliente === "juridico" 
          ? producto.precio_mayorista 
          : producto.precio_minorista;
        nuevos[index].precio_unitario = precioUnitario;
        nuevos[index].id_producto = valor;
      }
    } else {
      nuevos[index][campo as keyof DetallePedido] = valor;
    }
    
    // Recalcular subtotales
    nuevos[index].subtotal_lineal = nuevos[index].cantidad * nuevos[index].precio_unitario;
    nuevos[index].subtotal = nuevos[index].subtotal_lineal - nuevos[index].descuento;
    
    setDetalles(nuevos);
  };

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  // Cálculos totales
  const subtotalGeneral = detalles.reduce((acc, d) => acc + d.subtotal, 0);
  const ivaGeneral = detalles.reduce((acc, d) => acc + (d.subtotal * 0.12), 0);
  const totalGeneral = subtotalGeneral + ivaGeneral;

  const handleFinish = async (values: any) => {
    try {
      if (detalles.length === 0) {
        message.error("Debe agregar al menos un producto al pedido");
        return;
      }

      const config = getAxiosConfig();
      if (!config) return;

      // Preparar datos del pedido
      const pedidoData = {
        numero_pedido: values.numero_pedido || `PED-${Date.now()}`,
        fecha_pedido: values.fecha_pedido.format("YYYY-MM-DD"),
        cod_cliente: values.cod_cliente,
        subtotal: subtotalGeneral,
        iva: ivaGeneral,
        total: totalGeneral,
        // Campos opcionales que pueden ser null
        id_ubicacion_entrega: null,
        id_ruta_venta: null,
        id_ruta_entrega: null
      };

      if (pedidoEditar) {
        // Actualizar pedido existente
        const datosActualizacion = {
          ...pedidoData,
          detalles: detalles.map(d => ({
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
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
          ...pedidoData,
          detalle_pedido: detalles.map(d => ({
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
            subtotal_lineal: d.subtotal_lineal,
            subtotal: d.subtotal
          }))
        };

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

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>Productos del Pedido</h4>
          <Button 
            type="dashed" 
            icon={<PlusOutlined />}
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

        {/* Filtros para productos */}
        {tipoCliente && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 6 }}>
            <Text strong style={{ marginBottom: 8, display: "block" }}>Filtros de productos:</Text>
            <Space wrap>
              <Input
                placeholder="Buscar producto o marca..."
                prefix={<SearchOutlined />}
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="Filtrar por categoría"
                value={categoriaFiltro}
                onChange={setCategoriaFiltro}
                style={{ width: 200 }}
                allowClear
              >
                {categorias.map(cat => (
                  <Option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.descripcion}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
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
          detalles.map((detalle, index) => (
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
              <div style={{ minWidth: 250, maxWidth: 300 }}>
                <Text style={{ fontSize: "12px", marginBottom: 4, display: "block" }}>Producto</Text>
                <Select
                  value={detalle.id_producto}
                  onChange={value => actualizarDetalle(index, "id_producto", value)}
                  style={{ width: "100%" }}
                  placeholder="Seleccionar producto"
                  showSearch
                  filterOption={false}
                  onSearch={setBusquedaProducto}
                  dropdownRender={menu => (
                    <div>
                      <div style={{ padding: 8 }}>
                        <Input
                          placeholder="Buscar productos..."
                          prefix={<SearchOutlined />}
                          value={busquedaProducto}
                          onChange={(e) => setBusquedaProducto(e.target.value)}
                        />
                      </div>
                      <Divider style={{ margin: 0 }} />
                      {menu}
                    </div>
                  )}
                >
                  {Object.entries(productosAgrupados()).map(([categoria, productosGrupo]) => (
                    <OptGroup key={categoria} label={categoria}>
                      {productosGrupo.map(producto => (
                        <Option key={producto.id_producto} value={producto.id_producto}>
                          <div>
                            <div>{producto.nombre}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {producto.marca?.descripcion} - Stock: {producto.stock}
                            </div>
                            <div style={{ fontSize: "12px", color: "#1890ff" }}>
                              ${tipoCliente === "juridico" ? producto.precio_mayorista : producto.precio_minorista}
                            </div>
                          </div>
                        </Option>
                      ))}
                    </OptGroup>
                  ))}
                </Select>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Text style={{ fontSize: "12px", marginBottom: 2 }}>Cantidad</Text>
                <InputNumber
                  value={detalle.cantidad}
                  min={1}
                  max={999}
                  onChange={value => actualizarDetalle(index, "cantidad", value || 1)}
                  style={{ width: 80 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Text style={{ fontSize: "12px", marginBottom: 2 }}>Precio Unit.</Text>
                <InputNumber
                  value={detalle.precio_unitario}
                  min={0}
                  step={0.01}
                  precision={2}
                  onChange={value => actualizarDetalle(index, "precio_unitario", value || 0)}
                  style={{ width: 100 }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Text style={{ fontSize: "12px", marginBottom: 2 }}>Descuento</Text>
                <InputNumber
                  value={detalle.descuento}
                  min={0}
                  step={0.01}
                  precision={2}
                  onChange={value => actualizarDetalle(index, "descuento", value || 0)}
                  style={{ width: 100 }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Text style={{ fontSize: "12px", marginBottom: 2 }}>Subtotal</Text>
                <Text strong style={{ color: "#1890ff" }}>
                  ${detalle.subtotal.toFixed(2)}
                </Text>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Text style={{ fontSize: "12px", marginBottom: 2 }}>IVA (12%)</Text>
                <Text style={{ color: "#faad14" }}>
                  ${(detalle.subtotal * 0.12).toFixed(2)}
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
          ))
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
            disabled={detalles.length === 0}
          >
            {pedidoEditar ? "Actualizar Pedido" : "Crear Pedido"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FormCrearPedido;
