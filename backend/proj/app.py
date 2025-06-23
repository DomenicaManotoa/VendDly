from fastapi import FastAPI
from routes.roles_routes import router as roles_router
from routes.usuarios_routes import router as usuarios_router
from routes.auth_routes import router as auth_router
import uvicorn

app = FastAPI()

app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(auth_router)

if __name__ == "__main__":

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)