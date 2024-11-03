// backend/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Habilita CORS para permitir que React se conecte desde otro dominio
app.use(cors());
app.use(express.json()); // Para procesar datos JSON

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',          // Cambia si usas un servidor diferente
  user: 'root',               // Usuario de MySQL
  password: '',               // Contraseña de MySQL (vacío en XAMPP por defecto)
  database: 'inventario_pasumerce' // Nombre de tu base de datos en MySQL
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Ruta para manejar el login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Ajusta los nombres de la tabla y campos según la estructura de tu base de datos
  const query = 'SELECT * FROM usuario WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    
    if (results.length > 0) {
      res.json({ success: true, message: 'Inicio de sesión exitoso' });
    } else {
      res.json({ success: false, message: 'Credenciales incorrectas' });
    }
  });
});

// Inicia el servidor en el puerto 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
