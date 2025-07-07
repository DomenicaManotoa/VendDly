from fastapi import FastAPI
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

import uvicorn
from fastapi.middleware.cors import CORSMiddleware


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O especifica ["http://localhost:3000"] si tu front corre ahí
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)