import express from 'express';
import db from '../config/db.js';
const router = express.Router();

// Ruta para agregar un proveedor
router.post('/crear', async (req, res) => {
    const { nombre, apellido, empresa, telefono, horarios } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !apellido || !empresa || !telefono || !horarios) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son requeridos',
        });
    }

    const query = `
        INSERT INTO proveedor (nombre, apellido, empresa, telefono, horarios)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const [results] = await db.query(query, [nombre, apellido, empresa, telefono, horarios]);
        res.status(201).json({
            success: true,
            message: 'Proveedor creado con éxito',
            data: results
        });
    } catch (err) {
        console.error('Error en la consulta de inserción:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al guardar el proveedor: ' + err.message,
        });
    }
});

// Ruta para obtener todos los proveedores
router.get('/ver', async (req, res) => {
    const query = 'SELECT * FROM proveedor';

    try {
        const [results] = await db.query(query);
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error al obtener los proveedores:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
    }
});

// Ruta para actualizar un proveedor
router.put('/actualizar/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, empresa, numero, horarios } = req.body;

    const query = `
        UPDATE proveedor
        SET nombre = ?, apellido = ?, empresa = ?, telefono = ?, horarios = ?
        WHERE id = ?
    `;

    try {
        const [result] = await db.query(query, [nombre, apellido, empresa, numero, horarios, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }
        res.json({ success: true, message: 'Proveedor actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar proveedor:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar proveedor' });
    }
});

// Ruta para eliminar un proveedor
router.delete('/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM proveedor WHERE id = ?';

    try {
        const [results] = await db.query(query, [id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado',
            });
        }

        res.json({
            success: true,
            message: 'Proveedor eliminado con éxito',
        });
    } catch (err) {
        console.error('Error al eliminar el proveedor:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el proveedor: ' + err.message,
        });
    }
});

export default router;
