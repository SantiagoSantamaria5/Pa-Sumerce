import express from 'express';
import cors from 'cors';
import proveedorRoutes from './routes/proveedor.js';
import inventarioRoutes from './routes/inventario.js';
import authRoutes from './routes/auth.js';
import productoRoutes from './routes/producto.js';
import db from './config/db.js';

const app = express();

// Configuración de CORS mejorada y más permisiva para desarrollo
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Incluye todos los orígenes de desarrollo
    credentials: false, // Cambiado a false para pruebas iniciales
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

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1);
    }
    console.log('Conectado a la base de datos MySQL');
});

// Rutas
app.use('/api/proveedor', proveedorRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/producto', productoRoutes);
app.use('/api', authRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});