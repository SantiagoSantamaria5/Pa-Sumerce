import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Crear un insumo en inventario
router.post('/crear', async (req, res) => {
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || cantidad == null || !idProveedor || !fechaAdquisicion || !fechaVencimiento || valorUnitario == null) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son requeridos',
        });
    }

    // Validar si las fechas son válidas
    const fechaAdquisicionDate = new Date(fechaAdquisicion);
    const fechaVencimientoDate = new Date(fechaVencimiento);

    if (isNaN(fechaAdquisicionDate.getTime()) || isNaN(fechaVencimientoDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'Las fechas deben ser válidas.',
        });
    }

    try {
        // Validar que el proveedor exista
        const proveedorQuery = 'SELECT * FROM proveedor WHERE id = ?';
        const [proveedorResults] = await db.query(proveedorQuery, [idProveedor]);

        if (proveedorResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El proveedor especificado no existe.',
            });
        }

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

// Leer todos los insumos
router.get('/', async (req, res) => {
    const query = 'SELECT * FROM inventario';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error al obtener insumos:', err);
        return res.status(500).json({ message: 'Error al obtener los insumos.' });
    }
});

// Leer un insumo por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM inventario WHERE Id = ?';
    try {
        const [results] = await db.query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Insumo no encontrado.' });
        }

        res.json(results[0]);
    } catch (err) {
        console.error('Error al obtener el insumo:', err);
        return res.status(500).json({ message: 'Error al obtener el insumo.' });
    }
});

// Actualizar un insumo
router.put('/actualizar/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    const query = `
        UPDATE inventario
        SET nombre = ?, cantidad = ?, idProveedor = ?, fechaAdquisicion = ?, fechaVencimiento = ?, valorUnitario = ?
        WHERE Id = ?
    `;

    try {
        const [results] = await db.query(query, [nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario, id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Insumo no encontrado.',
            });
        }

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

// Endpoint para eliminar un insumo
router.delete('/eliminar/:id', async (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM inventario WHERE Id = ?';

    try {
        const [results] = await db.query(query, [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Insumo no encontrado.' });
        }

        res.json({ message: 'Insumo eliminado correctamente.' });
    } catch (err) {
        console.error('Error al eliminar el insumo:', err);
        return res.status(500).json({ message: 'Error al eliminar el insumo.' });
    }
});

export default router;
