from fastapi import APIRouter, Body, HTTPException
from fastapi.encoders import jsonable_encoder

from ..database import (
    insert_paciente,
    remove_paciente,
    modify_paciente,
    retrieve_pacientes,
    retrieve_paciente_by_id,
)

from ..models.patientModel import (
    error_response_model,
    response_model,
    PacienteModel,
    PacienteUpdate
)

router = APIRouter()
@router.post("/", response_description="registrar paciente")
async def create_paciente(paciente_data: PacienteModel = Body(...)):
    paciente = jsonable_encoder(paciente_data)
    new_paciente = await insert_paciente(paciente)
    return response_model(new_paciente, "Paciente añadido.")

@router.get("/{id}", response_description="Paciente")
async def get_paciente_id(id: str):
    paciente = await retrieve_paciente_by_id(id)
    if paciente:
        return response_model(paciente, "Paciente encontrado.")
    raise HTTPException(status_code=404, detail="El paciente no existe.")

@router.get("/", response_description="Pacientes")
async def get_all_pacientes():
    pacientes = await retrieve_pacientes()
    if pacientes:
        return response_model(pacientes, "Pacientes encontrados.")
    return response_model(pacientes, "Lista vacía retornada.")



@router.put("/{id}", response_description="Paciente")
async def put_paciente(id:str, req: PacienteUpdate = Body(...)):
    req = {k: v for k, v in req.model_dump().items() if v is not None}
    print(f"Datos procesados para actualizar: {req}")  # Para depuración
    updated_paciente = await modify_paciente(id, req)
    if updated_paciente:
        return response_model(updated_paciente, "Paciente modificado.")
    return error_response_model(
        "Un error ha ocurrido.",
        404, "Ha ocurrido un error actualizando los datos del paciente.",
    )

@router.delete("/{id}", response_description="Paciente")
async def delete_paciente_route(id:str):
    deleted_paciente = await remove_paciente(id)
    if deleted_paciente:
        return response_model("Paciente con el DNI: {} removido".format(id), "Paciente eliminado.")
    return error_response_model(
        "Un error ha ocurrido.", 404, "Paciente con el DNI: {} no encontrado.".format(id)
    )
