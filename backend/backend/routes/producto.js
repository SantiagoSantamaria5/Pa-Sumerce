import express from 'express';
import db from '../config/db.js';  // Aquí importamos el pool de conexiones

const router = express.Router();

// Ruta para agregar un producto
router.post('/agregar', async (req, res) => {
    const { Nombre, PrecioTotal, ingredientes } = req.body;

    // Validar los datos básicos
    if (!Nombre || !PrecioTotal || !Array.isArray(ingredientes) || ingredientes.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos incompletos: se requiere nombre, precio y al menos un ingrediente.',
        });
    }

    const connection = await db.getConnection(); // Obtener una conexión para la transacción
    try {
        await connection.beginTransaction();

        // 1. Insertar el producto
        const [productoResult] = await connection.query(
            'INSERT INTO producto (Nombre, PrecioTotal) VALUES (?, ?)',
            [Nombre, PrecioTotal]
        );

        const productoId = productoResult.insertId; // Obtener el ID del producto recién creado

        // 2. Insertar los ingredientes relacionados
        for (const ingrediente of ingredientes) {
            const { idInventario, cantidad } = ingrediente;

            // Validar cada ingrediente
            if (!idInventario || !cantidad || cantidad <= 0) {
                throw new Error('Ingrediente inválido: debe incluir idInventario y una cantidad válida.');
            }

            await connection.query(
                'INSERT INTO producto_ingrediente (idProducto, idInventario, cantidad) VALUES (?, ?, ?)',
                [productoId, idInventario, cantidad]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Producto creado con éxito' });
    } catch (error) {
        await connection.rollback(); // Revertir la transacción en caso de error
        console.error('Error al guardar el producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar el producto: ' + error.message,
        });
    } finally {
        connection.release();
    }
});



export default router;
