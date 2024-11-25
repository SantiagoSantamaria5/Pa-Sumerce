import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Middleware for input validation
const validateProductionInput = async (req, res, next) => {
    const { idProducto, cantidad } = req.body;

    // Validate input presence and type
    if (!idProducto || typeof idProducto !== 'number' || idProducto <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de producto inválido. Debe ser un número positivo.' 
        });
    }

    if (!cantidad || typeof cantidad !== 'number' || cantidad <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Cantidad inválida. Debe ser un número positivo.' 
        });
    }

    // Validate product existence
    try {
        const [productoExiste] = await db.query(
            'SELECT idProducto FROM producto WHERE idProducto = ?',
            [idProducto]
        );

        if (productoExiste.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Producto no encontrado.' 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Error al validar el producto.' 
        });
    }

    next();
};

router.post('/guardar', validateProductionInput, async (req, res) => {
    const { idProducto, cantidad } = req.body;
    const fechaActual = new Date().toISOString().split('T')[0];

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener el precio total del producto
        const [producto] = await connection.query(
            `SELECT PrecioTotal FROM producto WHERE idProducto = ?`,
            [idProducto]
        );

        const precioProducto = producto[0].PrecioTotal;
        const valorTotalProduccion = precioProducto * cantidad;

        // Obtener los ingredientes necesarios para el producto
        const [ingredientes] = await connection.query(
            `SELECT pi.idInventario, pi.cantidad AS cantidadNecesaria, i.nombre AS nombreIngrediente
             FROM producto_ingrediente pi
             JOIN inventario i ON pi.idInventario = i.Id
             WHERE pi.idProducto = ?`,
            [idProducto]
        );

        if (!ingredientes.length) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'No se encontraron ingredientes para el producto seleccionado.' 
            });
        }

        // Validar y gestionar inventario con más detalles
        const insuficientesIngredientes = [];
        
        for (const ingrediente of ingredientes) {
            const cantidadTotalUsada = ingrediente.cantidadNecesaria * cantidad;
            
            const [inventario] = await connection.query(
                'SELECT cantidad FROM inventario WHERE Id = ?',
                [ingrediente.idInventario]
            );

            if (!inventario.length || inventario[0].cantidad < cantidadTotalUsada) {
                insuficientesIngredientes.push({
                    nombreIngrediente: ingrediente.nombreIngrediente,
                    cantidadRequerida: cantidadTotalUsada,
                    cantidadDisponible: inventario.length ? inventario[0].cantidad : 0
                });
            }
        }

        // Detener si hay ingredientes insuficientes
        if (insuficientesIngredientes.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Ingredientes insuficientes para la producción',
                ingredientes: insuficientesIngredientes
            });
        }

        // Actualizar inventario y registrar producción
        for (const ingrediente of ingredientes) {
            const cantidadTotalUsada = ingrediente.cantidadNecesaria * cantidad;
            
            await connection.query(
                'UPDATE inventario SET cantidad = cantidad - ? WHERE Id = ?',
                [cantidadTotalUsada, ingrediente.idInventario]
            );
        }

        // Registrar la producción
        const [resultado] = await connection.query(
            `INSERT INTO produccion (idProducto, Cantidad, fecha, valorTotal) 
             VALUES (?, ?, ?, ?)`,
            [idProducto, cantidad, fechaActual, valorTotalProduccion]
        );

        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Producción registrada con éxito.', 
            valorTotal: valorTotalProduccion,
            idProduccion: resultado.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar producción:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al procesar la producción' 
        });
    } finally {
        connection.release();
    }
});

export default router;