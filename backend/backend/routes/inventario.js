import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Enhanced validation function
const validateInventoryInput = async (req, res, next) => {
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    // Trim and validate name
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre del insumo no puede estar vacío.',
        });
    }

    // Validate cantidad
    if (cantidad == null || cantidad < 0) {
        return res.status(400).json({
            success: false,
            message: 'La cantidad debe ser un número no negativo.',
        });
    }

    // Validate valor unitario
    if (valorUnitario == null || valorUnitario < 0) {
        return res.status(400).json({
            success: false,
            message: 'El valor unitario debe ser un número no negativo.',
        });
    }

    // Validate dates
    const fechaAdquisicionDate = new Date(fechaAdquisicion);
    const fechaVencimientoDate = new Date(fechaVencimiento);

    if (isNaN(fechaAdquisicionDate.getTime()) || isNaN(fechaVencimientoDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'Las fechas deben ser válidas.',
        });
    }

    // Ensure acquisition date is not in the future
    if (fechaAdquisicionDate > new Date()) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de adquisición no puede ser en el futuro.',
        });
    }

    // Ensure expiration date is after acquisition date
    if (fechaVencimientoDate <= fechaAdquisicionDate) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de vencimiento debe ser posterior a la fecha de adquisición.',
        });
    }

    // Validate provider existence
    try {
        const proveedorQuery = 'SELECT * FROM proveedor WHERE id = ?';
        const [proveedorResults] = await db.query(proveedorQuery, [idProveedor]);

        if (proveedorResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El proveedor especificado no existe.',
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar el proveedor.',
        });
    }

    // Validate unique name (case-insensitive)
    try {
        const nombreQuery = 'SELECT * FROM inventario WHERE LOWER(nombre) = LOWER(?)';
        const [nombreResults] = await db.query(nombreQuery, [nombre]);

        if (nombreResults.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del insumo ya existe en el inventario.',
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar el nombre del insumo.',
        });
    }

    next();
};

// Enhanced create endpoint with validation middleware
router.post('/crear', validateInventoryInput, async (req, res) => {
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    try {
        // Inserción del insumo
        const insertQuery = `
            INSERT INTO inventario (nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [results] = await db.query(insertQuery, [nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario]);

        res.status(201).json({
            success: true,
            message: 'Insumo creado exitosamente.',
            id: results.insertId,
        });
    } catch (err) {
        console.error('Error al crear el insumo:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al crear el insumo.',
        });
    }
});

// Similar validation for update endpoint
const validateInventoryUpdate = async (req, res, next) => {
    const { id } = req.params;
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    // Validate input (similar to create validation)
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre del insumo no puede estar vacío.',
        });
    }

    // Additional check to ensure the item exists before updating
    try {
        const existQuery = 'SELECT * FROM inventario WHERE Id = ?';
        const [existResults] = await db.query(existQuery, [id]);

        if (existResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Insumo no encontrado.',
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar la existencia del insumo.',
        });
    }

    // Validate name uniqueness (excluding current item)
    try {
        const nombreQuery = 'SELECT * FROM inventario WHERE LOWER(nombre) = LOWER(?) AND Id != ?';
        const [nombreResults] = await db.query(nombreQuery, [nombre, id]);

        if (nombreResults.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del insumo ya existe en el inventario.',
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar el nombre del insumo.',
        });
    }

    next();
};

// Updated update endpoint with validation middleware
router.put('/actualizar/:id', validateInventoryUpdate, async (req, res) => {
    const { id } = req.params;
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    const query = `
        UPDATE inventario
        SET nombre = ?, cantidad = ?, idProveedor = ?, fechaAdquisicion = ?, fechaVencimiento = ?, valorUnitario = ?
        WHERE Id = ?
    `;

    try {
        const [results] = await db.query(query, [nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario, id]);

        res.json({
            success: true,
            message: 'Insumo actualizado exitosamente.',
        });
    } catch (err) {
        console.error('Error al actualizar el insumo:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el insumo.',
        });
    }
});

export default router;