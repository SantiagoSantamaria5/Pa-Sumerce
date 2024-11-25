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
    const fechaActual = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    if (!idProducto || !cantidad || cantidad <= 0) {
        return res.status(400).json({ success: false, message: 'Datos inválidos' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener el precio total del producto
        const [producto] = await connection.query(
            `SELECT PrecioTotal FROM producto WHERE idProducto = ?`,
            [idProducto]
        );

        if (!producto.length) {
            throw new Error('Producto no encontrado.');
        }

        const precioProducto = producto[0].PrecioTotal; // Precio por unidad de producto
        const valorTotalProduccion = precioProducto * cantidad; // Cálculo del valor total

        // Obtener los ingredientes necesarios para el producto
        const [ingredientes] = await connection.query(
            `SELECT pi.idInventario, pi.cantidad AS cantidadNecesaria
             FROM producto_ingrediente pi
             WHERE pi.idProducto = ?`,
            [idProducto]
        );

        if (!ingredientes.length) {
            throw new Error('No se encontraron ingredientes para el producto seleccionado.');
        }

        // Validar que haya suficiente inventario para cada ingrediente
        for (const ingrediente of ingredientes) {
            const cantidadTotalUsada = ingrediente.cantidadNecesaria * cantidad; // Total necesario para la producción
            const [inventario] = await connection.query(
                'SELECT cantidad FROM inventario WHERE Id = ?',
                [ingrediente.idInventario]
            );

            if (!inventario.length || inventario[0].cantidad < cantidadTotalUsada) {
                throw new Error(
                    `No hay suficiente inventario para el ingrediente con ID ${ingrediente.idInventario}. 
                     Requiere: ${cantidadTotalUsada}, Disponible: ${inventario.length ? inventario[0].cantidad : 0}`
                );
            }

            // Restar la cantidad usada del inventario
            await connection.query(
                'UPDATE inventario SET cantidad = cantidad - ? WHERE Id = ?',
                [cantidadTotalUsada, ingrediente.idInventario]
            );
        }

        // Registrar la producción en la tabla `produccion`
        await connection.query(
            `INSERT INTO produccion (idProducto, Cantidad, fecha, valorTotal) 
             VALUES (?, ?, ?, ?)`,
            [idProducto, cantidad, fechaActual, valorTotalProduccion]
        );

        await connection.commit();
        res.json({ success: true, message: 'Producción registrada con éxito.', valorTotal: valorTotalProduccion });
    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar producción:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});





export default router;
