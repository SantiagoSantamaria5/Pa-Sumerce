import express from 'express';
import db from '../config/db.js';
const router = express.Router();

// Validation middleware for product creation
const validateProductInput = async (req, res, next) => {
    const { Nombre, PrecioTotal, ingredientes } = req.body;

    // Validate basic product information
    if (!Nombre || Nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre del producto es obligatorio.',
        });
    }

    if (PrecioTotal == null || PrecioTotal <= 0) {
        return res.status(400).json({
            success: false,
            message: 'El precio total debe ser un número positivo.',
        });
    }

    // Validate ingredients
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere al menos un ingrediente.',
        });
    }

    // Validate each ingredient
    const invalidIngredients = [];
    const ingredientIds = new Set();

    for (const ingrediente of ingredientes) {
        const { idInventario, cantidad } = ingrediente;

        // Check for duplicate ingredients
        if (ingredientIds.has(idInventario)) {
            invalidIngredients.push({
                idInventario,
                error: 'Ingrediente duplicado'
            });
            continue;
        }

        // Validate ingredient ID and quantity
        if (!idInventario || idInventario <= 0) {
            invalidIngredients.push({
                idInventario,
                error: 'ID de ingrediente inválido'
            });
            continue;
        }

        if (!cantidad || cantidad <= 0) {
            invalidIngredients.push({
                idInventario,
                error: 'Cantidad de ingrediente debe ser positiva'
            });
            continue;
        }

        // Verify ingredient existence in inventory
        try {
            const [inventario] = await db.query(
                'SELECT cantidad FROM inventario WHERE Id = ?',
                [idInventario]
            );

            if (inventario.length === 0) {
                invalidIngredients.push({
                    idInventario,
                    error: 'Ingrediente no encontrado en el inventario'
                });
                continue;
            }

            // Optional: Check if inventory has enough quantity
            if (inventario[0].cantidad < cantidad) {
                invalidIngredients.push({
                    idInventario,
                    error: 'Cantidad de ingrediente insuficiente en inventario'
                });
                continue;
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al validar ingredientes.',
            });
        }

        ingredientIds.add(idInventario);
    }

    // If any ingredients are invalid, return detailed error
    if (invalidIngredients.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Errores en los ingredientes',
            ingredientes: invalidIngredients
        });
    }

    next();
};

router.post('/agregar', validateProductInput, async (req, res) => {
    const { Nombre, PrecioTotal, ingredientes } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert product
        const [productoResult] = await connection.query(
            'INSERT INTO producto (Nombre, PrecioTotal) VALUES (?, ?)',
            [Nombre, PrecioTotal]
        );
        const productoId = productoResult.insertId;

        // 2. Add ingredients to product
        for (const ingrediente of ingredientes) {
            const { idInventario, cantidad } = ingrediente;
            await connection.query(
                'INSERT INTO producto_ingrediente (idProducto, idInventario, cantidad, PrecioU) VALUES (?, ?, ?, ?)',
                [productoId, idInventario, cantidad, PrecioTotal / cantidad]
            );
        }

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Producto creado con éxito',
            idProducto: productoId 
        });
    } catch (error) {
        await connection.rollback();
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