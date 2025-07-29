from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from routes.roles_routes import router as roles_router
from routes.usuarios_routes import router as usuarios_router
from routes.auth_routes import router as auth_router
from routes.clientes_routes import router as clientes_router
from routes.categoria_routes import router as categoria_router
from routes.marca_routes import router as marca_router
from routes.producto_routes import router as producto_router
from routes.pedido_routes import router as pedido_router
from routes.estado_pedido_routes import router as estado_pedido_router
from routes.detalle_pedido_routes import router as detalle_pedido_router
from routes.factura_routes import router as factura_router
from routes.detalle_factura_routes import router as detalle_factura_router
from routes.catalogo_pdf_routes import router as catalogo_pdf_router
from routes.ubicacion_cliente_routes import router as ubicacion_cliente_router
from routes.ruta_routes import router as ruta_router
from routes.ruta_cliente_routes import router as ruta_cliente_router
from routes.ruta_pedido_routes import router as ruta_pedido_router
from routes.tracking_data_routes import router as tracking_data_router
from routes.historial_tracking_routes import router as historial_tracking_router



import uvicorn
from fastapi.middleware.cors import CORSMiddleware

3
app = FastAPI()

app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(auth_router)
app.include_router(clientes_router)
app.include_router(categoria_router)
app.include_router(marca_router)
app.include_router(producto_router)
app.include_router(pedido_router)
app.include_router(estado_pedido_router)
app.include_router(detalle_pedido_router)
app.include_router(factura_router)
app.include_router(detalle_factura_router)
app.include_router(catalogo_pdf_router, prefix="/api", tags=["Catálogo PDF"])
app.include_router(ubicacion_cliente_router)
app.include_router(ruta_router)
app.include_router(ruta_cliente_router)
app.include_router(ruta_pedido_router)
app.include_router(tracking_data_router)
app.include_router(historial_tracking_router)




app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O especifica ["http://localhost:3000"] si tu front corre ahí
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorio de uploads si no existe
os.makedirs("uploads/productos", exist_ok=True)

# Montar archivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


if __name__ == "__main__":

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)