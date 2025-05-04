import motor.motor_asyncio
import os, logging
import pytz
from datetime import datetime
import httpx
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder

from server.models.patientModel import PacienteModel, PacienteUpdate, SeguroModel

MONGO_HOST = os.getenv('MONGO_HOST')
MONGO_PORT = os.getenv('MONGO_PORT')
MONGO_DB = os.getenv('MONGO_DB')
MONGO_USER = os.getenv('MONGO_USER')
MONGO_PASSWORD = os.getenv('MONGO_PASSWORD')
MONGO_COLLECTION_PACIENTES = os.getenv('MONGO_COLLECTION_PACIENTES')

MONGO_URI = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/"
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
database = client[MONGO_DB]
collection = database.get_collection(MONGO_COLLECTION_PACIENTES)

SERVICE_HOST = os.getenv('SERVICE_HOST')


# GET ALL
async def retrieve_pacientes():
    pacientes = []
    async for paciente in collection.find():
        pacientes.append(paciente)
    return pacientes


# POST (INSERT)
async def insert_paciente(data: PacienteModel):
    try:
        # Insertar el paciente en MongoDB
        paciente = jsonable_encoder(data)
        result = await collection.insert_one(paciente) 
        new_paciente = await collection.find_one({"_id": result.inserted_id})

        # Crear la nueva historia clínica
        async with httpx.AsyncClient() as client:
            historia_clinica_data = {
                "fechaCreacion": datetime.now().strftime("%Y-%m-%d"),
                "dniPaciente": new_paciente["_id"]
            }

            response = await client.post(f"http://{SERVICE_HOST}:8080/historias-clinicas", json=historia_clinica_data)

            if response.status_code not in [200, 201]:
                logging.error(f"Error al crear historia clínica, código de estado: {response.status_code}, detalles: {response.text}")
                raise HTTPException(status_code=500, detail="Error al crear la historia clínica en Spring Boot")

            logging.info(f"Historia clínica creada con éxito: {response.json()}")

        return new_paciente

    except Exception as e:
        logging.error(f"Error insertando paciente o creando historia clínica: {e}")
        raise HTTPException(status_code=500, detail=f"Error insertando paciente o creando historia clínica: {e}")


# GET BY ID
async def retrieve_paciente_by_id(id: str):
    paciente = await collection.find_one({"_id": id})
    if paciente:
        return PacienteModel(**paciente)  # Convertir el dict de MongoDB a modelo de Pydantic
    else:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")


# UPDATE
async def modify_paciente(id: str, data: PacienteUpdate):
    paciente = await collection.find_one({"_id": id})
    if paciente:
        updated_data = data.dict(exclude_unset=True)  # Excluir los valores no establecidos (None)
        if 'seguro' in updated_data:
            updated_data['seguro'] = {**paciente['seguro'], **updated_data['seguro']}  # Fusionar datos del seguro

        updated_paciente = await collection.update_one({"_id": id}, {"$set": updated_data})
        if updated_paciente.modified_count > 0:
            return True
    return False


# DELETE
async def remove_paciente(id: str):
    try:
        paciente = await collection.find_one({"_id": id})
        if paciente:
            # Eliminar la historia clínica
            async with httpx.AsyncClient() as client:
                response = await client.delete(f"http://{SERVICE_HOST}:8080/historias-clinicas/{id}")

                if response.status_code not in [200, 204]:
                    logging.error(f"Error al eliminar la historia clínica, código de estado: {response.status_code}, detalles: {response.text}")
                    raise HTTPException(status_code=500, detail="Error al eliminar la historia clínica en Spring Boot")

            # Eliminar el paciente de MongoDB
            await collection.delete_one({"_id": id})
            return True
        return False
    except Exception as e:
        logging.error(f"Error eliminando paciente o historia clínica: {e}")
        raise HTTPException(status_code=500, detail=f"Error eliminando paciente o historia clínica: {e}")
