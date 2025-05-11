const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
console.log("Conectando a PostgreSQL en:", process.env.HOST);  
const pool = new Pool({

    user: process.env.PG_USER,
    host: process.env.HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error al conectar a la base de datos:', err.stack);
    }
    console.log('Conexión exitosa con la base de datos PostgreSQL');
    release();
});

// Obtener la disponibilidad de un doctor específico
/**
 * @swagger
 * /disponibilidad/{dni}:
 *   get:
 *     summary: Obtener disponibilidad de un doctor
 *     description: Recupera la disponibilidad de un doctor basado en su DNI.
 *     parameters:
 *       - in: path
 *         name: dni
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del doctor.
 *     responses:
 *       200:
 *         description: Disponibilidad obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dia:
 *                     type: string
 *                   hora:
 *                     type: string
 *       500:
 *         description: Error al obtener la disponibilidad.
 */
router.get('/:dni', async (req, res) => {
    const { dni } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM Disponibilidad WHERE dni_doctor = $1',
            [dni]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Error al obtener la disponibilidad del doctor');
    }
});

// Agregar disponibilidad para un doctor
/**
 * @swagger
 * /disponibilidad/{dni}:
 *   post:
 *     summary: Agregar disponibilidad para un doctor
 *     description: Agrega disponibilidad para un doctor en un día y hora específicos.
 *     parameters:
 *       - in: path
 *         name: dni
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del doctor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dia:
 *                 type: string
 *               hora:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disponibilidad agregada con éxito.
 *       500:
 *         description: Error al agregar la disponibilidad.
 */
router.post('/:dni', async (req, res) => {
    const { dni } = req.params;  // Capturamos el dni del doctor desde los parámetros de la URL
    const { dia, hora } = req.body;  // El día y la hora vienen en el cuerpo de la solicitud
    try {
        await pool.query(
            'INSERT INTO Disponibilidad (dia, hora, dni_doctor) VALUES ($1, $2, $3)',
            [dia, hora, dni]
        );
        res.send('Disponibilidad agregada con éxito');
    } catch (err) {
        res.status(500).send('Error al agregar la disponibilidad');
    }
});

/**
 * @swagger
 * /disponibilidad/{dni}:
 *   delete:
 *     summary: Eliminar disponibilidad de un doctor
 *     description: Elimina una disponibilidad específica (día y hora) del doctor con el DNI proporcionado.
 *     parameters:
 *       - in: path
 *         name: dni
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del doctor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dia:
 *                 type: string
 *                 example: "Lunes"
 *               hora:
 *                 type: string
 *                 example: "10:00"
 *     responses:
 *       200:
 *         description: Disponibilidad eliminada con éxito.
 *       404:
 *         description: Disponibilidad no encontrada.
 *       500:
 *         description: Error al eliminar la disponibilidad.
 */

router.delete('/:dni', async (req, res) => {
    const { dni } = req.params;
    const { dia, hora } = req.body;

    try {
        const result = await pool.query(
            'DELETE FROM Disponibilidad WHERE dni_doctor = $1 AND dia = $2 AND hora = $3',
            [dni, dia, hora]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Disponibilidad no encontrada');
        }

        res.send('Disponibilidad eliminada con éxito');
    } catch (err) {
        console.error('Error al eliminar la disponibilidad:', err.stack);
        res.status(500).send('Error al eliminar la disponibilidad');
    }
});

module.exports = router;
