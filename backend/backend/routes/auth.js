import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Ruta de login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validar que ambos campos estén presentes
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Usuario y contraseña son requeridos',
        });
    }

    // Consulta para buscar el usuario en la base de datos
    const query = `
        SELECT u.id, u.username, p.nombre, p.apellido, e.permisos, e.area, u.password AS storedPassword
        FROM usuario u
        LEFT JOIN persona p ON u.idPersona = p.id
        LEFT JOIN empleado e ON p.idEmpleado = e.id
        WHERE u.username = ?
    `;

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error en la consulta de login:', err);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor',
            });
        }

        // Validar si se encontró el usuario
        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas',
            });
        }

        const user = results[0];

        // Comparar la contraseña ingresada con la almacenada (sin hashing en este caso)
        // Se recomienda que la contraseña en la base de datos ya esté almacenada de forma segura (hashed)
        if (password !== user.storedPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas',
            });
        }

        // Generar un "token" de autenticación de forma sencilla (sin librerías externas)
        const token = `${user.id}-${username}-${new Date().getTime()}`; // Un token simple, con el ID, el nombre de usuario y la fecha actual

        // Retornar el "token" junto con los datos del usuario
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token, // Este es el "token" sencillo que generamos
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                apellido: user.apellido,
                permisos: user.permisos,
                area: user.area,
            },
        });
    });
});

export default router;
