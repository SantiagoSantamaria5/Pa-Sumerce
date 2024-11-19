import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Crear un insumo en inventario
router.post('/crear', (req, res) => {
    const { nombre, cantidad, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    if (!nombre || cantidad == null || !fechaAdquisicion || !fechaVencimiento || valorUnitario == null) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Validar si las fechas son válidas
    const fechaAdquisicionDate = new Date(fechaAdquisicion);
    const fechaVencimientoDate = new Date(fechaVencimiento);

    if (isNaN(fechaAdquisicionDate.getTime()) || isNaN(fechaVencimientoDate.getTime())) {
        return res.status(400).json({ message: 'Las fechas deben ser válidas.' });
    }

    const query = `
        INSERT INTO inventario (nombre, cantidad, fechaAdquisicion, fechaVencimiento, valorUnitario)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [nombre, cantidad, fechaAdquisicion, fechaVencimiento, valorUnitario], (err, results) => {
        if (err) {
            console.error('Error al crear el insumo:', err);
            return res.status(500).json({ message: 'Error al crear el insumo.' });
        }
        res.status(201).json({ message: 'Insumo creado exitosamente.', id: results.insertId });
    });
});

// Leer todos los insumos
router.get('/', (req, res) => {
    const query = 'SELECT * FROM inventario';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener insumos:', err);
            return res.status(500).json({ message: 'Error al obtener los insumos.' });
        }
        res.json(results);
    });
});

// Leer un insumo por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM inventario WHERE Id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener el insumo:', err);
            return res.status(500).json({ message: 'Error al obtener el insumo.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Insumo no encontrado.' });
        }
        res.json(results[0]);
    });
});

// Actualizar un insumo
router.put('/actualizar/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, cantidad, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    const query = `
        UPDATE inventario 
        SET nombre = ?, cantidad = ?, fechaAdquisicion = ?, fechaVencimiento = ?, valorUnitario = ?
        WHERE Id = ?
    `;
    db.query(query, [nombre, cantidad, fechaAdquisicion, fechaVencimiento, valorUnitario, id], (err, results) => {
        if (err) {
            console.error('Error al actualizar el insumo:', err);
            return res.status(500).json({ message: 'Error al actualizar el insumo.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Insumo no encontrado.' });
        }
        res.json({ message: 'Insumo actualizado exitosamente.' });
    });
});


// Endpoint para eliminar un insumo
app.delete('/inventario/eliminar/:id', async (req, res) => {
    const insumoId = req.params.id;

    try {
        // Eliminar el insumo de la base de datos
        const result = await eliminarInsumoDeBaseDeDatos(insumoId);

        if (result) {
            res.json({ success: true, message: 'Insumo eliminado' });
        } else {
            res.status(404).json({ success: false, message: 'No se encontró el insumo' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar el insumo' });
    }
});


export default router;
