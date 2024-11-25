const validateInventoryInput = async (req, res, next) => {
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    // Validate name
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre del insumo no puede estar vacío.',
            debug: {
                input: nombre,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate quantity
    if (cantidad == null || cantidad < 0) {
        return res.status(400).json({
            success: false,
            message: 'La cantidad debe ser un número no negativo.',
            debug: {
                input: cantidad,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate unit value
    if (valorUnitario == null || valorUnitario < 0) {
        return res.status(400).json({
            success: false,
            message: 'El valor unitario debe ser un número no negativo.',
            debug: {
                input: valorUnitario,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate dates
    const fechaAdquisicionDate = new Date(fechaAdquisicion);
    const fechaVencimientoDate = new Date(fechaVencimiento);

    if (isNaN(fechaAdquisicionDate.getTime()) || isNaN(fechaVencimientoDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'Las fechas deben ser válidas.',
            debug: {
                adquisicion: fechaAdquisicion,
                vencimiento: fechaVencimiento,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate acquisition date
    if (fechaAdquisicionDate > new Date()) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de adquisición no puede ser en el futuro.',
            debug: {
                input: fechaAdquisicion,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate expiration date
    if (fechaVencimientoDate <= fechaAdquisicionDate) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de vencimiento debe ser posterior a la fecha de adquisición.',
            debug: {
                adquisicion: fechaAdquisicion,
                vencimiento: fechaVencimiento,
                timestamp: new Date().toISOString()
            }
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
                debug: {
                    providerId: idProveedor,
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar el proveedor.',
            error: {
                message: err.message,
                code: err.code,
                timestamp: new Date().toISOString()
            }
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
                debug: {
                    input: nombre,
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar el nombre del insumo.',
            error: {
                message: err.message,
                code: err.code,
                timestamp: new Date().toISOString()
            }
        });
    }

    next();
};

const validateInventoryUpdate = async (req, res, next) => {
    const { id } = req.params;
    const { nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario } = req.body;

    // Validate name
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre del insumo no puede estar vacío.',
            debug: {
                input: nombre,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Check item existence before update
    try {
        const existQuery = 'SELECT * FROM inventario WHERE Id = ?';
        const [existResults] = await db.query(existQuery, [id]);

        if (existResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Insumo no encontrado.',
                debug: {
                    id: id,
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar la existencia del insumo.',
            error: {
                message: err.message,
                code: err.code,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Validate unique name (excluding current item)
    try {
        const nombreQuery = 'SELECT * FROM inventario WHERE LOWER(nombre) = LOWER(?) AND Id != ?';
        const [nombreResults] = await db.query(nombreQuery, [nombre, id]);

        if (nombreResults.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del insumo ya existe en el inventario.',
                debug: {
                    input: nombre,
                    currentId: id,
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error al validar el nombre del insumo.',
            error: {
                message: err.message,
                code: err.code,
                timestamp: new Date().toISOString()
            }
        });
    }

    next();
};

export { validateInventoryInput, validateInventoryUpdate };