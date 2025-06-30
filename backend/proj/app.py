from fastapi import FastAPI
from routes.roles_routes import router as roles_router
from routes.usuarios_routes import router as usuarios_router
from routes.auth_routes import router as auth_router
from routes.clientes_routes import router as clientes_router

import uvicorn
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(auth_router)
app.include_router(clientes_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O especifica ["http://localhost:3000"] si tu front corre ahí
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)