const express = require('express');
const router = express.Router();
const axios = require('axios');

// URLs de los microservicios
const PACIENTE_SERVICE_URL = `http://pacientes:8000/pacientes`;
const DOCTOR_SERVICE_URL = `http://doctores:3000/doctors`;
const DISPONIBILIDAD_SERVICE_URL = `http://doctores:3000/disponibilidad`;
const CITA_SERVICE_URL = `http://historiamedica:8080/citas`;

// Ruta para agendar una cita
/**
 * @swagger
 * /agendar:
 *   post:
 *     summary: Agendar una cita
 *     description: Crea una cita para un paciente con un doctor en una fecha y hora específicas. Si el paciente no existe, se crea automáticamente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dniPaciente:
 *                 type: string
 *                 description: DNI del paciente
 *               nombres:
 *                 type: string
 *                 description: Nombres del paciente (si se va a crear un nuevo paciente)
 *               apellidos:
 *                 type: string
 *                 description: Apellidos del paciente (si se va a crear un nuevo paciente)
 *               fechaNacimiento:
 *                 type: string
 *                 format: date
 *                 description: Fecha de nacimiento del paciente (si se va a crear un nuevo paciente)
 *               dniDoctor:
 *                 type: string
 *                 description: DNI del doctor
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la cita
 *               hora:
 *                 type: string
 *                 format: time
 *                 description: Hora de la cita
 *               seguro:
 *                 type: object
 *                 properties:
 *                   tipo_seguro:
 *                     type: string
 *                     description: Tipo de seguro del paciente (opcional)
 *                   vencimiento:
 *                     type: string
 *                     format: date
 *                     description: Fecha de vencimiento del seguro (opcional)
 *     responses:
 *       201:
 *         description: Cita creada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Cita agendada con éxito"
 *       404:
 *         description: El doctor no fue encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Doctor no encontrado"
 *       400:
 *         description: El doctor no está disponible en la fecha y hora seleccionadas
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "El doctor no está disponible en la fecha y hora solicitadas"
 *       500:
 *         description: Error al agendar la cita
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Error al agendar la cita"
 */
const formatHora = (hora) => {
    return hora.length === 8 ? hora.slice(0, 5) : hora; // "09:00:00" => "09:00"
};
router.post('/agendar', async (req, res) => {
    const { dniPaciente, nombres, apellidos, fechaNacimiento, dniDoctor, fecha, hora, seguro } = req.body;

    try {
        // 1. Verificar si el paciente existe
        let pacienteResponse;
        try {
            pacienteResponse = await axios.get(`${PACIENTE_SERVICE_URL}/${dniPaciente}`);
            console.log(`Paciente con DNI ${dniPaciente} encontrado.`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // Si el paciente no existe, crearlo con o sin seguro
                const newPaciente = {
                    _id: dniPaciente,
                    nombres,
                    apellidos,
                    fecha_nacimiento: fechaNacimiento,
                    ...(seguro && { seguro }) // Añadir seguro si existe
                };
                pacienteResponse = await axios.post(PACIENTE_SERVICE_URL, newPaciente);
                console.log(`Paciente con DNI ${dniPaciente} no encontrado. Paciente creado:`, pacienteResponse.data);
            } else {
                console.error('Error al verificar el paciente:', error.message);
                throw new Error('Error al verificar el paciente');
            }
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

        if (!disponibilidad.some(d => d.dia === fecha && d.hora === hora)) {
            console.error(`El doctor con DNI ${dniDoctor} no está disponible en la fecha ${fecha} y hora ${hora}.`);
            return res.status(400).send('El doctor no está disponible en la fecha y hora solicitadas.');
        }
        console.log(`Doctor disponible en la fecha ${fecha} y hora ${hora}.`);

        // 4. Crear la cita
        const citaData = {
            dniPaciente,
            dniDoctor,
            fecha,
            hora: formatHora(hora)
        };

        const citaResponse = await axios.post(`${CITA_SERVICE_URL}/${dniPaciente}`, citaData);
        console.log(`Cita creada con éxito:`, citaResponse.data);

        res.status(201).send('Cita agendada con éxito');

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
 *                   fecha:
 *                     type: string
 *                     description: Fecha de la cita
 *                     example: "2023-11-01"
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
                    fecha: cita.fecha,
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

module.exports = router;

