# Usamos una imagen base de Maven para construir la aplicación
FROM maven:3.8.8-eclipse-temurin-17 AS build

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos el archivo pom.xml y descargamos las dependencias
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiamos el resto del código fuente y construimos la aplicación
COPY src ./src
RUN mvn clean package -DskipTests

# Usamos una imagen base de JDK para ejecutar la aplicación
FROM openjdk:17-jdk-slim

# Establecemos el directorio de trabajo en el contenedor
WORKDIR /app

# Copiamos el archivo JAR generado desde la etapa de construcción
COPY --from=build /app/target/*.jar app.jar

# Comando para ejecutar la aplicación
CMD ["java", "-jar", "app.jar"]
