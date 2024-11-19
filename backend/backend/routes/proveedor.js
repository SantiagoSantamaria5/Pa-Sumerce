import express from 'express';
import db from '../config/db.js';
const router = express.Router();

// Ruta para agregar un proveedor
router.post('/crear', (req, res) => {
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

    db.query(query, [nombre, apellido, empresa, telefono, horarios], (err, results) => {
        if (err) {
            console.error('Error en la consulta de inserción:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al guardar el proveedor: ' + err.message,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Proveedor creado con éxito',
            data: results
        });
    });
});
// Ruta para obtener todos los proveedores
router.get('/ver', (req, res) => {
    const query = 'SELECT * FROM proveedor';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los proveedores:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
        }

        res.json({ success: true, data: results });
    });
});

router.put('/api/proveedor/actualizar/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, empresa, numero, horarios } = req.body;

    const query = `
        UPDATE proveedor
        SET nombre = ?, apellido = ?, empresa = ?, telefono = ?, horarios = ?
        WHERE id = ?
    `;

    db.query(query, [nombre, apellido, empresa, numero, horarios, id], (err) => {
        if (err) {
            console.error('Error al actualizar proveedor:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar proveedor' });
        }

        res.json({ success: true, message: 'Proveedor actualizado con éxito' });
    });
});

// Ruta para eliminar un proveedor

router.delete('/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM proveedor WHERE id = ?';

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al eliminar el proveedor:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar el proveedor: ' + err.message,
            });
        }

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
    });
});




export default router;