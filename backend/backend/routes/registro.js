import express from 'express';
import db from '../config/db.js';
const router = express.Router();

// Middleware de logging específico para estas rutas
router.use((req, res, next) => {
    console.log(`[Registro Route] ${req.method} ${req.path}`);
    next();
});

// 1. Ruta para obtener registros del mes actual
router.get('/registros/mes', async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        console.log(`Consultando registros para: Mes=${month}, Año=${year}`);

        const query = `
            SELECT p.fecha, 
                   pr.Nombre AS nombreProducto,
                   SUM(p.Cantidad) AS cantidadTotal
            FROM produccion p
            JOIN producto pr ON p.idProducto = pr.idProducto
            WHERE MONTH(p.fecha) = ? AND YEAR(p.fecha) = ?
            GROUP BY p.fecha, pr.Nombre
            ORDER BY p.fecha
        `;

        const [registros] = await db.query(query, [month, year]);

        console.log(`Registros encontrados: ${registros.length}`);

        if (!registros.length) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron registros para este mes.',
                debug: {
                    month,
                    year,
                    queryParams: [month, year],
                    timestamp: new Date().toISOString()
                }
            });
        }

        res.json({
            success: true,
            registros,
            debug: {
                month,
                year,
                count: registros.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error en /registros/mes:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener registros mensuales.',
            error: {
                message: error.message,
                sql: error.sql,
                code: error.code
            }
        });
    }
});
router.get('/registros/anual', async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();

        console.log(`Consultando registros anuales para: Año=${year}`);

        const query = `
            SELECT 
                YEAR(p.fecha) as año,
                pr.Nombre AS nombreProducto,
                SUM(p.Cantidad) as cantidadTotal,
                SUM(p.valorTotal) as valorTotalAnual
            FROM produccion p
            JOIN producto pr ON p.idProducto = pr.idProducto
            WHERE YEAR(p.fecha) = ?
            GROUP BY pr.idProducto, pr.Nombre
            ORDER BY cantidadTotal DESC
        `;

        const [registros] = await db.query(query, [year]);

        console.log(`Registros anuales encontrados: ${registros.length}`);

        if (!registros.length) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron registros para este año.',
                debug: {
                    year,
                    timestamp: new Date().toISOString()
                }
            });
        }

        res.json({
            success: true,
            registros,
            debug: {
                year,
                count: registros.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error en /registros/anual:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener registros anuales.',
            error: {
                message: error.message,
                sql: error.sql,
                code: error.code
            }
        });
    }
});

// 2. Ruta para obtener registros por fecha específica
router.get('/registros/:fecha', async (req, res) => {
    const { fecha } = req.params;
    
    console.log(`Consultando registros para fecha específica: ${fecha}`);

    if (!fecha) {
        return res.status(400).json({
            success: false,
            message: 'Fecha requerida.'
        });
    }

    try {
        const query = `
            SELECT p.fecha, 
                   pr.Nombre AS nombreProducto, 
                   p.Cantidad
            FROM produccion p
            JOIN producto pr ON p.idProducto = pr.idProducto
            WHERE p.fecha = ?
        `;

        const [registros] = await db.query(query, [fecha]);

        console.log(`Registros encontrados para ${fecha}: ${registros.length}`);

        if (!registros.length) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron registros para esta fecha.',
                debug: {
                    fecha,
                    timestamp: new Date().toISOString()
                }
            });
        }

        res.json({
            success: true,
            registros,
            debug: {
                fecha,
                count: registros.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error en /registros/:fecha:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener registros por fecha.',
            error: {
                message: error.message,
                sql: error.sql,
                code: error.code
            }
        });
    }
});

// 3. Nueva ruta para obtener registros anuales


// 4. Ruta para obtener detalles de un registro específico
export default router;