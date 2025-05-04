const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
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

// Obtener todos los doctores
/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Obtener todos los doctores
 *     description: Recupera todos los doctores de la base de datos de PostgreSQL.
 *     responses:
 *       200:
 *         description: Lista de doctores obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dni:
 *                     type: string
 *                   nombres:
 *                     type: string
 *                   apellidos:
 *                     type: string
 *                   especialidad:
 *                     type: string
 *                   totalcitas:
 *                     type: integer
 *       500:
 *         description: Error al obtener los doctores.
 */
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Doctor');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Error al obtener los doctores');
    }
});

// Agregar un doctor
/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Agregar un nuevo doctor
 *     description: Agrega un nuevo doctor a la base de datos de PostgreSQL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dni:
 *                 type: string
 *               nombres:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               especialidad:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor agregado con éxito.
 *       500:
 *         description: Error al agregar el doctor.
 */

   router.post('/', async (req, res) => {
       const { dni, nombres, apellidos, especialidad } = req.body;
       try {
           await pool.query(
               'INSERT INTO Doctor (dni, nombres, apellidos, especialidad, totalcitas) VALUES ($1, $2, $3, $4, $5)',
               [dni, nombres, apellidos, especialidad, 0]  // Inicializamos totalcitas en 0
           );
           res.send('Doctor agregado con éxito');
       } catch (err) {
           console.error('Error al agregar el doctor:', err.stack);  // Agrega logs para detalles del error
           res.status(500).send('Error al agregar el doctor');
       }
   });


   // Actualizar el contador de total citas de un doctor
/**
 * @swagger
 * /doctors/{dni}/citas/{estado}:
 *   put:
 *     summary: Actualizar el total de citas de un doctor
 *     description: Actualiza el número total de citas de un doctor sumando el estado dado.
 *     parameters:
 *       - in: path
 *         name: dni
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del doctor.
 *       - in: path
 *         name: estado
 *         schema:
 *           type: integer
 *         required: true
 *         description: Estado de la cita.
 *     responses:
 *       200:
 *         description: Total de citas actualizado con éxito.
 *       400:
 *         description: El parámetro estado es inválido.
 *       500:
 *         description: Error al actualizar el total de citas.
 */
router.put('/:dni/citas/:estado', async (req, res) => {
    const { dni } = req.params;
    let estado = parseInt(req.params.estado, 10); // Convertir `estado` a número entero

    if (isNaN(estado)) {
        return res.status(400).send('El parámetro estado debe ser un número válido');
    }

    try {
        // Usamos la consulta SQL para actualizar el total de citas
        await pool.query(
            'UPDATE Doctor SET totalcitas = totalcitas + $2 WHERE dni = $1',
            [dni, estado]
        );
        res.send(`Total citas actualizadas con éxito para el doctor con DNI ${dni}`);
    } catch (err) {
        res.status(500).send('Error al actualizar el contador de citas');
    }
});

// Obtener un doctor por su DNI
/**
 * @swagger
 * /doctors/{dni}:
 *   get:
 *     summary: Obtener un doctor por DNI
 *     description: Recupera un doctor específico basado en su DNI.
 *     parameters:
 *       - in: path
 *         name: dni
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del doctor.
 *     responses:
 *       200:
 *         description: Doctor encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dni:
 *                   type: string
 *                 nombres:
 *                   type: string
 *                 apellidos:
 *                   type: string
 *                 especialidad:
 *                   type: string
 *       404:
 *         description: Doctor no encontrado.
 *       500:
 *         description: Error al obtener el doctor.
 */
router.get('/:dni', async (req, res) => {
    const { dni } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Doctor WHERE dni = $1', [dni]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Doctor no encontrado');
        }
    } catch (err) {
        console.error('Error al obtener el doctor:', err.stack);
        res.status(500).send('Error al obtener el doctor');
    }
});

// Eliminar un doctor por su DNI
/**
 * @swagger
 * /doctors/{dni}:
 *   delete:
 *     summary: Eliminar un doctor por DNI
 *     description: Elimina un doctor y todas sus disponibilidades basadas en su DNI.
 *     parameters:
 *       - in: path
 *         name: dni
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del doctor.
 *     responses:
 *       200:
 *         description: Doctor eliminado con éxito.
 *       404:
 *         description: Doctor no encontrado.
 *       500:
 *         description: Error al eliminar el doctor.
 */
router.delete('/:dni', async (req, res) => {
    const { dni } = req.params;
    try {
        // Primero, verificamos si el doctor existe
        const result = await pool.query('SELECT * FROM Doctor WHERE dni = $1', [dni]);

        if (result.rows.length > 0) {
            await pool.query('DELETE FROM Disponibilidad WHERE dni_doctor = $1', [dni]);
            await pool.query('DELETE FROM Doctor WHERE dni = $1', [dni]);
            res.send('Doctor con DNI ${dni} eliminado con éxito con sus disponibilidades');
        } else {
            res.status(404).send('Doctor no encontrado');
        }
    } catch (err) {
        console.error('Error al eliminar el doctor:', err.stack);
        res.status(500).send('Error al eliminar el doctor');
    }
});


module.exports = router;
