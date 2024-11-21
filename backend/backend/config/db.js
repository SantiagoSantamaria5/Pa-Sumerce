import mysql from 'mysql2/promise';

// Crear un pool de conexiones
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'inventario_pasumerce',
    password: '', // Si tienes una contraseña, agrégala
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default db;
