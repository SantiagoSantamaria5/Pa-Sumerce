import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Ruta de login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validar que ambos campos estén presentes
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Usuario y contraseña son requeridos',
        });
    }

    try {
        // Consulta para buscar el usuario en la base de datos
        const query = `
            SELECT u.id, u.username, p.nombre, p.apellido, e.permisos, e.area, u.password AS storedPassword
            FROM usuario u
            LEFT JOIN persona p ON u.idPersona = p.id
            LEFT JOIN empleado e ON p.idEmpleado = e.id
            WHERE u.username = ?
        `;

        const [results] = await db.query(query, [username]);

        // Validar si se encontró el usuario
        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas',
            });
        }

        const user = results[0];

        // Comparar la contraseña ingresada con la almacenada (sin hashing en este caso)
        if (password !== user.storedPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas',
            });
        }

        // Generar un "token" de autenticación de forma sencilla
        const token = `${user.id}-${username}-${new Date().getTime()}`;

        // Retornar el "token" junto con los datos del usuario
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                apellido: user.apellido,
                permisos: user.permisos,
                area: user.area,
            },
        });
    } catch (err) {
        console.error('Error al procesar el login:', err);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
        });
    }
});

export default router;
