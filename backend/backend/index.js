const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'inventario_pasumerce',
    password: '' // Asegúrate de agregar tu contraseña si tienes una
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const query = `
        SELECT u.*, p.nombre, p.apellido, e.permisos, e.area
        FROM usuario u
        LEFT JOIN persona p ON u.idPersona = p.id
        LEFT JOIN empleado e ON p.idEmpleado = e.id
        WHERE u.username = ? AND u.password = ?
    `;

    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error en el servidor',
                error: err.message 
            });
        }
        
        if (results.length > 0) {
            const user = results[0];
            res.json({ 
                success: true, 
                message: 'Inicio de sesión exitoso',
                user: {
                    id: user.id,
                    username: user.username,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    permisos: user.permisos,
                    area: user.area
                }
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }
    });
});

// Ruta para verificar si el servidor está funcionando
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running' });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});