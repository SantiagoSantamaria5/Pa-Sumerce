import express from 'express';
import db from '../config/db.js';
const router = express.Router();

// Validation middleware for provider creation and update
const validateProviderInput = async (req, res, next) => {
    const { nombre, apellido, empresa, telefono, horarios } = req.body;

    // Validate name fields
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre es obligatorio.',
        });
    }

    if (!apellido || apellido.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El apellido es obligatorio.',
        });
    }

    // Validate empresa
    if (!empresa || empresa.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre de la empresa es obligatorio.',
        });
    }

    // Validate phone number (basic validation)
    const telefonoRegex = /^[+]?[\d\s()-]{10,15}$/;
    if (!telefono || !telefonoRegex.test(telefono)) {
        return res.status(400).json({
            success: false,
            message: 'Número de teléfono inválido.',
        });
    }

    // Validate horarios
    if (!horarios || horarios.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Los horarios son obligatorios.',
        });
    }

    // Check for duplicate provider (based on empresa and telefono)
    try {
        const [existingProvider] = await db.query(
            'SELECT * FROM proveedor WHERE empresa = ? OR telefono = ?',
            [empresa, telefono]
        );

        if (existingProvider.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un proveedor con esta empresa o número de teléfono.',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar proveedor existente.',
        });
    }

    next();
};

// Create provider endpoint
router.post('/crear', validateProviderInput, async (req, res) => {
    const { nombre, apellido, empresa, telefono, horarios } = req.body;

    const query = `
        INSERT INTO proveedor (nombre, apellido, empresa, telefono, horarios)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const [results] = await db.query(query, [nombre, apellido, empresa, telefono, horarios]);
        res.status(201).json({
            success: true,
            message: 'Proveedor creado con éxito',
            id: results.insertId
        });
    } catch (err) {
        console.error('Error en la consulta de inserción:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al guardar el proveedor: ' + err.message,
        });
    }
});

// Validation middleware for provider update
const validateProviderUpdate = async (req, res, next) => {
    const { id } = req.params;
    const { nombre, apellido, empresa, numero, horarios } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
        return res.status(400).json({
            success: false,
            message: 'ID de proveedor inválido.',
        });
    }

    // Check if provider exists
    try {
        const [existingProvider] = await db.query(
            'SELECT * FROM proveedor WHERE id = ?',
            [id]
        );

        if (existingProvider.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado.',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar proveedor existente.',
        });
    }

    // Additional input validations similar to create endpoint
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre es obligatorio.',
        });
    }

    if (!apellido || apellido.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El apellido es obligatorio.',
        });
    }

    const telefonoRegex = /^[+]?[\d\s()-]{10,15}$/;
    if (!numero || !telefonoRegex.test(numero)) {
        return res.status(400).json({
            success: false,
            message: 'Número de teléfono inválido.',
        });
    }

    next();
};

// Update provider endpoint
router.put('/actualizar/:id', validateProviderUpdate, async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, empresa, numero, horarios } = req.body;

    const query = `
        UPDATE proveedor
        SET nombre = ?, apellido = ?, empresa = ?, telefono = ?, horarios = ?
        WHERE id = ?
    `;

    try {
        const [result] = await db.query(query, [nombre, apellido, empresa, numero, horarios, id]);
        res.json({ 
            success: true, 
            message: 'Proveedor actualizado con éxito' 
        });
    } catch (err) {
        console.error('Error al actualizar proveedor:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar proveedor' 
        });
    }
});

export default router;