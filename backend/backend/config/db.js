import mysql from 'mysql2';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'inventario_pasumerce',
    password: '' // Asegúrate de agregar tu contraseña si tienes una
});

export default db;
