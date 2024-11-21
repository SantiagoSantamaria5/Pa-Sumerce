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

        // 2. Insertar los ingredientes relacionados y validar el inventario
        for (const ingrediente of ingredientes) {
            const { idInventario, cantidad } = ingrediente;

            // Validar cada ingrediente
            if (!idInventario || !cantidad || cantidad <= 0) {
                throw new Error('Ingrediente inválido: debe incluir idInventario y una cantidad válida.');
            }

            // Consultar el inventario para verificar que haya suficiente cantidad
            const [inventario] = await connection.query(
                'SELECT cantidad FROM inventario WHERE Id = ?',
                [idInventario]
            );

            if (!inventario || inventario.length === 0) {
                throw new Error('Ingrediente no encontrado en el inventario.');
            }

            // Verificar si hay suficiente cantidad en el inventario
            if (inventario[0].cantidad < cantidad) {
                throw new Error(`No hay suficiente cantidad de ${ingrediente.nombre} en el inventario.`);
            }

            // Si hay suficiente cantidad, insertar el ingrediente
            await connection.query(
                'INSERT INTO producto_ingrediente (idProducto, idInventario, cantidad) VALUES (?, ?, ?)',
                [productoId, idInventario, cantidad]
            );

            // Restar la cantidad utilizada del inventario
            await connection.query(
                'UPDATE inventario SET cantidad = cantidad - ? WHERE Id = ?',
                [cantidad, idInventario]
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
