import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Crear un nuevo producto
router.post('/agregar', (req, res) => {
    const { nombre, ingredientes, precio } = req.body;

    // Validaciones iniciales
    if (!nombre || !ingredientes || precio == null) {
        return res.status(400).json({
            success: false,
            message: 'Nombre, ingredientes y precio son requeridos',
        });
    }

    // Iniciar transacción para manejar múltiples inserciones
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar transacción',
            });
        }

        // Primero, insertar en la tabla de inventario
        const inventarioQuery = `
            INSERT INTO inventario 
            (nombre, cantidad, fechaAdquisicion, fechaVencimiento, valorUnitario) 
            VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), ?)
        `;

        // Calcular cantidad total de ingredientes
        const cantidadTotal = ingredientes.reduce((sum, ing) => sum + parseInt(ing.gramos), 0);

        db.query(inventarioQuery, [nombre, cantidadTotal, precio], (err, inventarioResult) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: 'Error al crear inventario',
                        error: err
                    });
                });
            }

            const idInventario = inventarioResult.insertId;

            // Insertar en la tabla de producto
            const productoQuery = `
                INSERT INTO producto 
                (Nombre, idInventario, PrecioTotal) 
                VALUES (?, ?, ?)
            `;

            db.query(productoQuery, [nombre, idInventario, Math.round(precio * 100)], (err, productoResult) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: 'Error al crear producto',
                            error: err
                        });
                    });
                }

                // Procesar ingredientes (actualizar materia prima)
                const ingredientePromises = ingredientes.map(ingrediente => {
                    return new Promise((resolve, reject) => {
                        const updateIngredienteQuery = `
                            UPDATE materiaprima 
                            SET cantidad = cantidad - ? 
                            WHERE nombre = ?
                        `;

                        db.query(updateIngredienteQuery, [ingrediente.gramos, ingrediente.ingrediente], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                });

                Promise.all(ingredientePromises)
                    .then(() => {
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: 'Error al confirmar transacción',
                                        error: err
                                    });
                                });
                            }
                            res.status(201).json({
                                success: true,
                                message: 'Producto creado exitosamente',
                                id: productoResult.insertId,
                                nombre: nombre
                            });
                        });
                    })
                    .catch((err) => {
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: 'Error al procesar ingredientes',
                                error: err
                            });
                        });
                    });
            });
        });
    });
});

// Listar todos los productos
router.get('/listar', (req, res) => {
    const query = `
        SELECT p.idProducto, p.Nombre, p.PrecioTotal/100 as Precio, 
               i.cantidad as Cantidad, i.fechaAdquisicion, i.fechaVencimiento
        FROM producto p
        JOIN inventario i ON p.idInventario = i.Id
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener productos',
                error: err
            });
        }
        res.json({
            success: true,
            productos: results
        });
});
});

// Obtener un producto por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT p.idProducto, p.Nombre, p.PrecioTotal/100 as Precio, 
               i.cantidad as Cantidad, i.fechaAdquisicion, i.fechaVencimiento
        FROM producto p
        JOIN inventario i ON p.idInventario = i.Id
        WHERE p.idProducto = ?
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener producto',
                error: err
            });
        }
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        res.json({
            success: true,
            producto: results[0]
        });
    });
});

// Actualizar un producto
router.put('/actualizar/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, precio } = req.body;

    // Comenzar transacción
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar transacción'
            });
        }

        // Actualizar producto
        const updateProductoQuery = `
            UPDATE producto p
            JOIN inventario i ON p.idInventario = i.Id
            SET p.Nombre = ?, 
                p.PrecioTotal = ?,
                i.nombre = ?,
                i.valorUnitario = ?
            WHERE p.idProducto = ?
        `;

        db.query(updateProductoQuery, [
            nombre, 
            Math.round(precio * 100), 
            nombre, 
            precio, 
            id
        ], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: 'Error al actualizar producto',
                        error: err
                    });
                });
            }

            if (result.affectedRows === 0) {
                return db.rollback(() => {
                    res.status(404).json({
                        success: false,
                        message: 'Producto no encontrado'
                    });
                });
            }

            db.commit((err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: 'Error al confirmar transacción'
                        });
                    });
                }

                res.json({
                    success: true,
                    message: 'Producto actualizado exitosamente'
                });
            });
        });
    });
});

// Eliminar un producto
router.delete('/eliminar/:id', (req, res) => {
    const { id } = req.params;

    // Comenzar transacción
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar transacción'
            });
        }

        // Eliminar producto y su registro de inventario
        const deleteQuery = `
            DELETE p, i 
            FROM producto p
            JOIN inventario i ON p.idInventario = i.Id
            WHERE p.idProducto = ?
        `;

        db.query(deleteQuery, [id], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: 'Error al eliminar producto',
                        error: err
                    });
                });
            }

            if (result.affectedRows === 0) {
                return db.rollback(() => {
                    res.status(404).json({
                        success: false,
                        message: 'Producto no encontrado'
                    });
                });
            }

            db.commit((err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: 'Error al confirmar transacción'
                        });
                    });
                }

                res.json({
                    success: true,
                    message: 'Producto eliminado exitosamente'
                });
            });
        });
    });
});

export default router;