import express from 'express';
import db from '../config/db.js';

const router = express.Router();

/// Crear un nuevo producto
// Ruta para agregar un producto
router.post('/agregar', (req, res) => {
    const { nombre, precio, ingredientes } = req.body;

    // Validaciones iniciales
    if (!nombre || !ingredientes || precio == null) {
        return res.status(400).json({
            success: false,
            message: 'Nombre, precio y ingredientes son requeridos',
        });
    }

    // Iniciar transacción para manejar múltiples operaciones
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar la transacción',
            });
        }

        // Insertar el producto en la tabla producto
        const insertProductoQuery = `
            INSERT INTO producto (Nombre, PrecioTotal)
            VALUES (?, ?)
        `;

        db.query(insertProductoQuery, [nombre, Math.round(precio * 100)], (err, productoResult) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: 'Error al crear el producto',
                        error: err
                    });
                });
            }

            const idProducto = productoResult.insertId;

            // Procesar los ingredientes
            const ingredientePromises = ingredientes.map(ingrediente => {
                return new Promise((resolve, reject) => {
                    // Verificar que el inventario tenga suficiente cantidad de gramos
                    const verificarInventarioQuery = `
                        SELECT gramos FROM inventario
                        WHERE idIngrediente = ?
                    `;

                    db.query(verificarInventarioQuery, [ingrediente.idIngrediente], (err, inventario) => {
                        if (err) {
                            return reject(err);
                        }

                        const gramosDisponibles = inventario[0]?.gramos || 0;

                        if (gramosDisponibles < ingrediente.gramos) {
                            return reject(`No hay suficiente cantidad de ${ingrediente.nombre}`);
                        }

                        // Descontar los gramos en el inventario
                        const actualizarInventarioQuery = `
                            UPDATE inventario
                            SET gramos = gramos - ?
                            WHERE idIngrediente = ?
                        `;

                        db.query(actualizarInventarioQuery, [ingrediente.gramos, ingrediente.idIngrediente], (err) => {
                            if (err) {
                                return reject(err);
                            }

                            // Insertar la relación entre el producto y el ingrediente
                            const insertarProductoIngredienteQuery = `
                                INSERT INTO producto_ingrediente (idProducto, idIngrediente, gramos)
                                VALUES (?, ?, ?)
                            `;

                            db.query(insertarProductoIngredienteQuery, [idProducto, ingrediente.idIngrediente, ingrediente.gramos], (err) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve();
                            });
                        });
                    });
                });
            });

            // Esperar que todos los ingredientes se procesen
            Promise.all(ingredientePromises)
                .then(() => {
                    // Confirmar transacción
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    success: false,
                                    message: 'Error al confirmar la transacción',
                                });
                            });
                        }

                        // Responder con éxito
                        res.status(201).json({
                            success: true,
                            message: 'Producto creado exitosamente',
                            idProducto,
                        });
                    });
                })
                .catch((err) => {
                    // Revertir en caso de error
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: 'Error al procesar los ingredientes o actualizar inventario',
                            error: err
                        });
                    });
                });
        });
    });
});


export default router;