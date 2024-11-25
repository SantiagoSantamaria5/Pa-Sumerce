import express from 'express';
import db from '../config/db.js';

const router = express.Router();


// Endpoint para obtener los registros diarios de producción
router.get('/registros/:fecha', async (req, res) => {
    const { fecha } = req.params;

    if (!fecha) {
        return res.status(400).json({ success: false, message: 'Fecha es requerida' });
    }

    const connection = await db.getConnection();
    try {
        // Obtener los registros de producción según la fecha
        const [registros] = await connection.query(
            `SELECT p.fecha, pr.nombre AS nombreProducto, pi.cantidad, pi.PrecioU
             FROM produccion p
             JOIN producto pr ON p.idProducto = pr.id
             JOIN producto_ingrediente pi ON pr.id = pi.idProducto
             WHERE p.fecha = ?`,
            [fecha]
        );

        if (!registros.length) {
            return res.status(404).json({ success: false, message: 'No se encontraron registros para esa fecha' });
        }

        res.json({ success: true, registros });
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});


export default router;