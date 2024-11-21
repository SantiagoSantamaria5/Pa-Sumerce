import express from 'express';
import cors from 'cors';
import proveedorRoutes from './routes/proveedor.js';
import inventarioRoutes from './routes/inventario.js';
import authRoutes from './routes/auth.js';
import productoRoutes from './routes/producto.js';
import db from './config/db.js';  // Importamos el pool de conexiones

const app = express();

// Configuración de CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
}));

// Middleware para parsear JSON
app.use(express.json());

// Pre-flight requests
app.options('*', cors());

// Middleware para logging de solicitudes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Verificación de la conexión con la base de datos
async function checkDbConnection() {
    try {
        // Realizamos una simple consulta para verificar que la base de datos está conectada
        const [rows] = await db.query('SELECT 1'); // Query simple para comprobar conexión
        console.log('Conexión exitosa a la base de datos MySQL');
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err.message);
        process.exit(1); // Si no se puede conectar, detenemos el servidor
    }
}

// Verificar la conexión a la base de datos antes de iniciar el servidor
checkDbConnection();

// Rutas
app.use('/api/proveedor', proveedorRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/producto', productoRoutes);
app.use('/api', authRoutes);

app.get('/', (req, res) => {
    console.log('Root endpoint hit!');
    res.send('Servidor en funcionamiento');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
