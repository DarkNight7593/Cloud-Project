const express = require('express');
const router = express.Router();
const axios = require('axios');

// URLs de los microservicios
const PACIENTE_SERVICE_URL = `http://pacientes:8000/pacientes`;
const DOCTOR_SERVICE_URL = `http://doctores:3000/doctors`;
const DISPONIBILIDAD_SERVICE_URL = `http://doctores:3000/disponibilidad`;
const CITA_SERVICE_URL = `http://historiamedica:8080/citas`;

/**
 * @swagger
 * /agendar:
 *   post:
 *     summary: Agendar una cita médica
 *     description: >
 *       Agenda una cita entre un paciente y un doctor en una fecha y hora determinadas. 
 *       - Si el paciente no existe, se debe haber creado previamente.
 *       - Se valida la existencia del doctor.
 *       - Se comprueba la disponibilidad del doctor en la fecha y hora solicitadas.
 *       - Si todo es válido, se registra la cita y se elimina la disponibilidad correspondiente del doctor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dniPaciente
 *               - dniDoctor
 *               - dia
 *               - hora
 *             properties:
 *               dniPaciente:
 *                 type: string
 *                 description: DNI del paciente que agenda la cita
 *               nombres:
 *                 type: string
 *                 description: Nombres del paciente (usado solo si el paciente se crea externamente)
 *               apellidos:
 *                 type: string
 *                 description: Apellidos del paciente
 *               fechaNacimiento:
 *                 type: string
 *                 format: date
 *                 description: Fecha de nacimiento del paciente
 *               dniDoctor:
 *                 type: string
 *                 description: DNI del doctor con quien se agenda la cita
 *               dia:
 *                 type: string
 *                 example: "Lunes"
 *                 description: Día de la cita 
 *               hora:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *                 description: Hora de la cita en formato HH:MM:SS
 *               seguro:
 *                 type: object
 *                 description: Datos del seguro del paciente (opcional)
 *                 properties:
 *                   tipo_seguro:
 *                     type: string
 *                     example: "SIS"
 *                   vencimiento:
 *                     type: string
 *                     format: date
 *                     example: "2026-01-01"
 *     responses:
 *       201:
 *         description: Cita creada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Cita agendada con éxito"
 *       400:
 *         description: El doctor no está disponible en la fecha y hora seleccionadas
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "El doctor no está disponible en la fecha y hora solicitadas."
 *       404:
 *         description: Doctor o paciente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Doctor no encontrado"
 *       500:
 *         description: Error interno al procesar la solicitud de agendamiento
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Error al agendar la cita"
 */

router.post('/agendar', async (req, res) => {
    const { dniPaciente, dniDoctor, dia, hora} = req.body;

    try {
        // 1. Verificar si el paciente existe
        let pacienteResponse;
        try {
            pacienteResponse = await axios.get(`${PACIENTE_SERVICE_URL}/${dniPaciente}`);
            if (pacienteResponse?.data) {
                console.log(`Paciente con DNI ${dniPaciente} encontrado.`);
            } else {
                return res.status(404).send('Paciente no encontrado');
            }
        } catch (error) {
            const statusCode = error.response?.status || 500;
            const errorMessage = statusCode === 404 ? 'Paciente no encontrado' : 'Error al verificar el Paciente';
            console.error(errorMessage, error.message);
            return res.status(statusCode).send(errorMessage);
        }

        // 2. Verificar que el doctor existe
        try {
            const doctorResponse = await axios.get(`${DOCTOR_SERVICE_URL}/${dniDoctor}`);

            if (doctorResponse?.data) {
                console.log(`Doctor con DNI ${dniDoctor} encontrado.`);
            } else {
                return res.status(404).send('Doctor no encontrado');
            }
        } catch (error) {
            const statusCode = error.response?.status || 500;
            const errorMessage = statusCode === 404 ? 'Doctor no encontrado' : 'Error al verificar el doctor';
            console.error(errorMessage, error.message);
            return res.status(statusCode).send(errorMessage);
        }

        // 3. Verificar la disponibilidad del doctor
        const disponibilidadResponse = await axios.get(`${DISPONIBILIDAD_SERVICE_URL}/${dniDoctor}`);
        const disponibilidad = disponibilidadResponse.data;

        if (!disponibilidad.some(d => d.dia === dia && d.hora === hora)) {
            console.error(`El doctor con DNI ${dniDoctor} no está disponible en la fecha ${dia} y hora ${hora}.`);
            return res.status(400).send('El doctor no está disponible en la fecha y hora solicitadas.');
        }
        console.log(`Doctor disponible en la fecha ${dia} y hora ${hora}.`);

        // 4. Crear la cita
        const citaData = {
            dniPaciente,
            dniDoctor,
            dia,
            hora
        };

        const citaResponse = await axios.post(`${CITA_SERVICE_URL}/${dniPaciente}`, citaData);
        console.log(`Cita creada con éxito:`, citaResponse.data);

        res.status(201).send('Cita agendada con éxito');
        
        // 5. Eliminar la disponibilidad usada del doctor
        await axios.delete(`${DISPONIBILIDAD_SERVICE_URL}/${dniDoctor}`, {
            data: { dia, hora } // Especificamos qué disponibilidad eliminar
        });
        console.log(`Disponibilidad eliminada para el doctor ${dniDoctor} en ${dia} a las ${hora}`);

    } catch (error) {
        console.error('Error al agendar la cita:', error.message);
        res.status(500).send('Error al agendar la cita');
    }
});

/**
 * @swagger
 * /listar:
 *   get:
 *     summary: Listar todas las citas
 *     tags: [Citas]
 *     description: Retorna una lista de todas las citas agendadas para un paciente, incluyendo la información del doctor.
 *     parameters:
 *       - in: path
 *         name: dniPaciente
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del paciente
 *     responses:
 *       200:
 *         description: Lista de citas obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dia:
 *                     type: string
 *                     description: dia de la cita
 *                     example: "Lunes"
 *                   hora:
 *                     type: string
 *                     description: Hora de la cita
 *                     example: "10:00"
 *                   doctor:
 *                     type: object
 *                     properties:
 *                       nombres:
 *                         type: string
 *                         description: Nombres del doctor
 *                         example: "Luis"
 *                       apellidos:
 *                         type: string
 *                         description: Apellidos del doctor
 *                         example: "Pérez"
 *                       especialidad:
 *                         type: string
 *                         description: Especialidad del doctor
 *                         example: "Cardiología"
 *       404:
 *         description: No se encontraron citas para el paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "No se encontraron citas para el paciente con DNI {dniPaciente}"
 *       500:
 *         description: Error al obtener las citas
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Error al obtener las citas del paciente"
 */
// Obtener las citas del paciente con el DNI y los detalles del doctor
router.get('/:dniPaciente', async (req, res) => {
    const { dniPaciente } = req.params;

    try {
        // 1. Obtener las citas del paciente
        const citasResponse = await axios.get(`${CITA_SERVICE_URL}/paciente/${dniPaciente}`);
        const citas = citasResponse.data;

        if (!citas.length) {
            return res.status(404).send(`No se encontraron citas para el paciente con DNI ${dniPaciente}`);
        }

        // 2. Para cada cita, obtener los detalles del doctor (sin el contador de citas)
        const citasConDoctor = await Promise.all(citas.map(async (cita) => {
            try {
                const doctorResponse = await axios.get(`${DOCTOR_SERVICE_URL}/${cita.dniDoctor}`);
                const doctorData = doctorResponse.data;

                // Agregar los datos del doctor (sin el contador de citas)
                return {
                    fecha: cita.dia,
                    hora: cita.hora,
                    doctor: {
                        nombres: doctorData.nombres,
                        apellidos: doctorData.apellidos,
                        especialidad: doctorData.especialidad
                    }
                };
            } catch (error) {
                console.error(`Error al obtener los datos del doctor con DNI ${cita.dniDoctor}:`, error.message);
                return { ...cita, doctor: 'Error al obtener los datos del doctor' };
            }
        }));

        // 3. Devolver las citas con la información del doctor
        res.json(citasConDoctor);

    } catch (error) {
        console.error('Error al obtener las citas del paciente:', error.message);
        res.status(500).send('Error al obtener las citas del paciente');
    }
});

/**
 * @swagger
 * /cancelar/{idCita}:
 *   delete:
 *     summary: Cancelar una cita
 *     description: >
 *       Elimina una cita agendada por su ID y restaura la disponibilidad del doctor para la fecha y hora correspondientes.
 *     parameters:
 *       - in: path
 *         name: idCita
 *         required: true
 *         description: ID único de la cita a cancelar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: La cita fue cancelada y la disponibilidad del doctor restaurada exitosamente.
 *       404:
 *         description: La cita no fue encontrada.
 *       500:
 *         description: Error interno al cancelar la cita o restaurar disponibilidad.
 */

router.delete('/cancelar/:idCita', async (req, res) => {
    const { idCita } = req.params;

    try {
        // 1. Obtener la información de la cita (usamos el ID de la cita)
        const citaResponse = await axios.get(`${CITA_SERVICE_URL}/cita/${idCita}`);
        const cita = citaResponse.data;

        if (!cita) {
            return res.status(404).send('Cita no encontrada');
        }

        // 2. Eliminar la cita de la base de datos
        await axios.delete(`${CITA_SERVICE_URL}/cita/${idCita}`);
        console.log(`Cita con ID ${idCita} cancelada.`);

        // 3. Restaurar la disponibilidad del doctor
        const { dniDoctor, dia, hora } = cita;

        const disponibilidadData = { dia, hora };

        try {
            await axios.post(`${DISPONIBILIDAD_SERVICE_URL}/${dniDoctor}`, disponibilidadData);
            console.log(`Disponibilidad restaurada para el doctor ${dniDoctor} en ${dia} a las ${hora}`);
        } catch (err) {
            console.error('Error al restaurar la disponibilidad del doctor:', err.message);
            res.status(500).send(`Error restarurando la disponibilidad para el doctor ${dniDoctor} en ${dia} a las ${hora}`);
        }

        res.status(200).send('Cita cancelada y disponibilidad restaurada con éxito');
    } catch (error) {
        console.error('Error al cancelar la cita:', error.message);
        res.status(500).send('Error al cancelar la cita');
    }
});

module.exports = router;

