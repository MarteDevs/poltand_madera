const db = require('../config/db');

const crearRequerimiento = async (req, res) => {
    // Obtenemos una conexión individual del Pool para la transacción
    const conexion = await db.getConnection();

    try {
        const { fecha, mina_id, supervisor_id, detalles } = req.body;

        // Validaciones básicas
        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'El requerimiento debe tener al menos un artículo.' });
        }

        // 1. INICIAR TRANSACCIÓN (Si algo falla de aquí en adelante, nada se guarda)
        await conexion.beginTransaction();

        // 2. Generar el CODIGO_REQ (Ejemplo: REQ-20260403-0001)
        // Buscamos el último ID insertado para crear el correlativo
        const [ultimoReq] = await conexion.query('SELECT id FROM requerimientos ORDER BY id DESC LIMIT 1');
        const nextId = ultimoReq.length > 0 ? ultimoReq[0].id + 1 : 1;

        const fechaActual = new Date();
        const anioMesDia = `${fechaActual.getFullYear()}${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}`;
        const correlativo = nextId.toString().padStart(4, '0');
        const codigo_req = `REQ-${anioMesDia}-${correlativo}`;

        // 3. Insertar la CABECERA
        const [resultadoCabecera] = await conexion.query(
            `INSERT INTO requerimientos (codigo_req, fecha, mina_id, supervisor_id, estado) 
             VALUES (?, ?, ?, ?, 'PENDIENTE')`,
            [codigo_req, fecha, mina_id, supervisor_id]
        );

        const requerimiento_id = resultadoCabecera.insertId; // Obtenemos el ID recién creado

        // 4. Insertar los DETALLES (Bucle)
        // Usamos un bucle for...of porque respeta el async/await en Node.js
        for (const item of detalles) {
            await conexion.query(
                `INSERT INTO requerimientos_detalle 
                 (requerimiento_id, articulo_id, proveedor_id, cantidad, precio_proveedor, precio_mina) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    requerimiento_id,
                    item.articulo_id,
                    item.proveedor_id,
                    item.cantidad,
                    item.precio_proveedor,
                    item.precio_mina
                ]
            );
        }

        // 5. CONFIRMAR TRANSACCIÓN (Todo salió perfecto, guardamos en la DB)
        await conexion.commit();

        res.status(201).json({
            mensaje: 'Requerimiento creado con éxito',
            codigo_req: codigo_req
        });

    } catch (error) {
        // 6. REVERTIR TRANSACCIÓN EN CASO DE ERROR (Rollback)
        await conexion.rollback();
        console.error('Error al crear requerimiento:', error);
        res.status(500).json({ mensaje: 'Error al crear el requerimiento. Se han revertido los cambios.' });
    } finally {
        // 7. Liberar la conexión para que otro usuario la pueda usar
        conexion.release();
    }
};

// ==========================================
// OBTENER HISTORIAL (Lista general de pedidos)
// ==========================================
const getHistorial = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id, 
                r.codigo_req, 
                DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha, 
                m.nombre AS mina, 
                COALESCE(s.nombre, 'Sin asignar') AS supervisor, 
                r.estado
            FROM requerimientos r
            JOIN minas m ON r.mina_id = m.id
            LEFT JOIN supervisor s ON r.supervisor_id = s.id
            ORDER BY r.fecha DESC, r.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ mensaje: 'Error al obtener el historial' });
    }
};

// ==========================================
// OBTENER DETALLES DE UN REQUERIMIENTO (Con cálculo de faltante)
// ==========================================
const getDetalles = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                rd.id, 
                a.nombre AS articulo, 
                p.nombre AS proveedor, 
                rd.cantidad AS pedido, 
                COALESCE(SUM(ind.cantidad_entregada), 0) AS entregado,
                (rd.cantidad - COALESCE(SUM(ind.cantidad_entregada), 0)) AS faltante
            FROM requerimientos_detalle rd
            JOIN articulos a ON rd.articulo_id = a.id
            JOIN proveedores p ON rd.proveedor_id = p.id
            LEFT JOIN ingresos_detalle ind ON ind.requerimiento_detalle_id = rd.id
            WHERE rd.requerimiento_id = ?
            GROUP BY rd.id, a.nombre, p.nombre, rd.cantidad
        `;
        const [rows] = await db.query(query, [id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        res.status(500).json({ mensaje: 'Error al obtener los detalles' });
    }
};

// Asegúrate de exportar estas nuevas funciones al final del archivo:
// module.exports = { getHistorial, getDetalles, crearRequerimiento };

module.exports = {
    crearRequerimiento,
    getHistorial,
    getDetalles
};