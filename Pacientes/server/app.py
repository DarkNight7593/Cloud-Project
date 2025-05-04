from fastapi import FastAPI
from .routes.routerPaciente import router as pacientes_router
app = FastAPI()


app.include_router(pacientes_router, tags=["Pacientes"], prefix="/pacientes")

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Echo test Ok"}

