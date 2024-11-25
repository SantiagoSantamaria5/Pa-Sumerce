import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Ruta para obtener productos con ingredientes
router.get('/productos', async (req, res) => {
    try {
        const [productos] = await db.query(
            `SELECT p.idProducto, p.Nombre, p.PrecioTotal, pi.idInventario, pi.cantidad, pi.PrecioU
             FROM producto p
             JOIN producto_ingrediente pi ON p.idProducto = pi.idProducto`
        );

        const productosAgrupados = productos.reduce((acc, producto) => {
            if (!acc[producto.idProducto]) {
                acc[producto.idProducto] = {
                    idProducto: producto.idProducto,
                    Nombre: producto.Nombre,
                    PrecioTotal: producto.PrecioTotal,
                    ingredientes: [],
                };
            }

            acc[producto.idProducto].ingredientes.push({
                idInventario: producto.idInventario,
                cantidad: producto.cantidad,
                PrecioU: producto.PrecioU,
            });

            return acc;
        }, {});

        res.json(Object.values(productosAgrupados));
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los productos' });
    }
});


router.post('/guardar', async (req, res) => {
    const { idProducto, cantidad } = req.body;
    const fechaActual = new Date().toISOString().split('T')[0]; // Esto da solo la fecha en formato YYYY-MM-DD


    if (!idProducto || !cantidad || cantidad <= 0) {
        return res.status(400).json({ success: false, message: 'Datos inválidos' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener ingredientes del producto
        const [ingredientes] = await connection.query(
            `SELECT idInventario, cantidad, PrecioU 
             FROM producto_ingrediente 
             WHERE idProducto = ?`,
            [idProducto]
        );

        if (!ingredientes.length) {
            throw new Error('No se encontraron ingredientes para el producto seleccionado');
        }

        // Validar que haya suficientes ingredientes en el inventario
        for (const ingrediente of ingredientes) {
            const cantidadTotal = ingrediente.cantidad * cantidad; // Cantidad total requerida
            const [inventario] = await connection.query(
                'SELECT cantidad FROM inventario WHERE Id = ?',
                [ingrediente.idInventario]
            );

            if (!inventario.length || inventario[0].cantidad < cantidadTotal) {
                throw new Error(
                    `No hay suficiente inventario para el ingrediente con ID ${ingrediente.idInventario}. 
                    Requiere: ${cantidadTotal}, Disponible: ${inventario.length ? inventario[0].cantidad : 0}`
                );
            }
        }

        // Calcular el valor total y registrar la producción
        let valorTotal = 0;
        for (const ingrediente of ingredientes) {
            const cantidadTotal = ingrediente.cantidad * cantidad;

            // Actualizar inventario
            await connection.query(
                'UPDATE inventario SET cantidad = cantidad - ? WHERE Id = ?',
                [cantidadTotal, ingrediente.idInventario]
            );

            // Calcular el valor total
            valorTotal += ingrediente.PrecioU * cantidadTotal;

            // Insertar registro en la tabla de producción para cada ingrediente
            await connection.query(
                `INSERT INTO produccion (idInventario, Cantidad, fecha, valorTotal) VALUES (?, ?, ?, ?)`,
                [ingrediente.idInventario, cantidadTotal, fechaActual, ingrediente.PrecioU * cantidadTotal]
            );
            
        }

        await connection.commit();
        res.json({ success: true, message: 'Producción registrada con éxito', valorTotal });
    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar producción:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

router.get('/pdf/:fecha', async (req, res) => {
    const { fecha } = req.params;

    if (!fecha) {
        return res.status(400).json({ success: false, message: 'Fecha es requerida' });
    }

    const connection = await db.getConnection();
    try {
        // Aquí obtén los datos de la base de datos para la fecha proporcionada
        const [registros] = await connection.query(
            `SELECT p.fecha, pr.nombre AS nombreProducto, pi.cantidad, pi.PrecioU
             FROM produccion p
             JOIN producto pr ON p.idProducto = pr.id
             JOIN producto_ingrediente pi ON pr.id = pi.idProducto
             WHERE p.fecha = ?`,
            [fecha]
        );

        if (!registros.length) {
            return res.status(404).json({ success: false, message: 'No se encontraron registros para esa fecha' });
        }

        // Generar un PDF aquí (puedes usar bibliotecas como pdfkit o Puppeteer)
        res.json({ success: true, message: 'Generar PDF aquí.' });
    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});




export default router;
