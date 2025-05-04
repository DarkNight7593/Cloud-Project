# Usar una imagen base de Python
FROM python:3.10-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo de dependencias (requirements.txt) primero
COPY requirements.txt .

# Instalar las dependencias necesarias utilizando el archivo requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Comando para ejecutar el servidor de FastAPI con Uvicorn
CMD ["python3", "-m", "uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

