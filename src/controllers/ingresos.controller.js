const db = require('../config/db');

// ==============================================================================
// 1. OBTENER FALTANTES (Para mostrar en la pantalla de "Registrar Ingreso" en Vue)
// ==============================================================================
const getRequerimientosPendientes = async (req, res) => {
    try {
        // Esta consulta es magia pura: Suma todo lo entregado y resta el total del pedido
        const query = `
            SELECT 
                rd.id AS requerimiento_detalle_id,
                r.codigo_req,
                m.nombre AS mina,
                a.nombre AS articulo,
                p.nombre AS proveedor,
                rd.cantidad AS pedido,
                COALESCE(SUM(ind.cantidad_entregada), 0) AS entregado,
                (rd.cantidad - COALESCE(SUM(ind.cantidad_entregada), 0)) AS faltante
            FROM requerimientos_detalle rd
            JOIN requerimientos r ON rd.requerimiento_id = r.id
            JOIN minas m ON r.mina_id = m.id
            JOIN articulos a ON rd.articulo_id = a.id
            JOIN proveedores p ON rd.proveedor_id = p.id
            LEFT JOIN ingresos_detalle ind ON ind.requerimiento_detalle_id = rd.id
            WHERE r.estado = 'PENDIENTE'
            GROUP BY 
                rd.id, 
                r.codigo_req, 
                m.nombre,
                a.nombre, 
                p.nombre, 
                rd.cantidad
            HAVING faltante > 0
            ORDER BY r.codigo_req DESC, rd.id ASC;
        `;
        
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error calculando faltantes:', error);
        res.status(500).json({ mensaje: 'Error al calcular los faltantes' });
    }
};

// ==============================================================================
// 2. CREAR EL INGRESO (Y actualizar estado automáticamente)
// ==============================================================================
const crearIngreso = async (req, res) => {
    const conexion = await db.getConnection();

    try {
        const { fecha, viaje, vale, observacion, detalles } = req.body;

        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'El ingreso debe tener al menos un artículo entregado.' });
        }

        await conexion.beginTransaction(); // 🛡️ Iniciamos transacción

        // 1. Generar Código de Ingreso (Ej: ENT-20260403-V123)
        const fechaActual = new Date(fecha);
        const anioMesDia = `${fechaActual.getFullYear()}${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}`;
        const viajeLimpio = viaje ? viaje.replace(/\s+/g, '-').toUpperCase() : 'SV'; // SV = Sin Viaje
        
        // Agregamos un correlativo aleatorio o timestamp para asegurar que sea único si hay varios viajes iguales al día
        const correlativo = Math.floor(1000 + Math.random() * 9000); 
        const codigo_ingreso = `ENT-${anioMesDia}-${viajeLimpio}-${correlativo}`;

        // 2. Insertar CABECERA del ingreso
        const [resCabecera] = await conexion.query(
            `INSERT INTO ingresos (codigo_ingreso, fecha, viaje, vale, observacion) 
             VALUES (?, ?, ?, ?, ?)`,
            [codigo_ingreso, fecha, viaje, vale, observacion]
        );
        const ingreso_id = resCabecera.insertId;

        // 3. Insertar DETALLES de la entrega
        for (const item of detalles) {
            await conexion.query(
                `INSERT INTO ingresos_detalle (ingreso_id, requerimiento_detalle_id, cantidad_entregada) 
                 VALUES (?, ?, ?)`,
                [ingreso_id, item.requerimiento_detalle_id, item.cantidad_entregada]
            );
        }

        // ======================================================================
        // 4. MAGIA: ACTUALIZAR ESTADO DEL REQUERIMIENTO (¿Ya se completó?)
        // ======================================================================
        
        // A. Extraemos todos los IDs de los detalles de requerimiento afectados
        const reqDetIds = detalles.map(d => d.requerimiento_detalle_id);
        
        // B. Buscamos a qué "Cabeceras de Requerimiento" pertenecen esos detalles
        const [reqsAfectados] = await conexion.query(
            `SELECT DISTINCT requerimiento_id FROM requerimientos_detalle WHERE id IN (?)`, 
            [reqDetIds]
        );

        // C. Por cada requerimiento afectado, verificamos si aún tiene faltantes
        for (const r of reqsAfectados) {
            const [verificacion] = await conexion.query(`
                SELECT (rd.cantidad - COALESCE(SUM(ind.cantidad_entregada), 0)) AS faltante
                FROM requerimientos_detalle rd
                LEFT JOIN ingresos_detalle ind ON ind.requerimiento_detalle_id = rd.id
                WHERE rd.requerimiento_id = ?
                GROUP BY rd.id, rd.cantidad
                HAVING faltante > 0
            `, [r.requerimiento_id]);

            // Si el resultado viene vacío (length === 0), significa que no hay NINGÚN faltante en NINGUNA línea.
            if (verificacion.length === 0) {
                // ¡Se completó el pedido! Lo actualizamos a COMPLETADO
                await conexion.query(
                    `UPDATE requerimientos SET estado = 'COMPLETADO' WHERE id = ?`, 
                    [r.requerimiento_id]
                );
            }
        }

        await conexion.commit(); // ✅ Confirmamos transacción

        res.status(201).json({
            mensaje: 'Ingreso registrado correctamente. Faltantes y estados actualizados.',
            codigo_ingreso: codigo_ingreso
        });

    } catch (error) {
        await conexion.rollback(); // ❌ Revertimos si hay error
        console.error('Error al crear ingreso:', error);
        res.status(500).json({ mensaje: 'Error al registrar el ingreso' });
    } finally {
        conexion.release();
    }
};

// ==============================================================================
// 3. HISTORIAL DE INGRESOS (Lista de todos los viajes registrados)
// ==============================================================================
const getHistorialIngresos = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.id,
                i.codigo_ingreso,
                DATE_FORMAT(i.fecha, '%Y-%m-%d') AS fecha,
                i.viaje,
                i.vale,
                i.observacion,
                COUNT(ind.id) AS total_items,
                COALESCE(SUM(ind.cantidad_entregada), 0) AS total_entregado
            FROM ingresos i
            LEFT JOIN ingresos_detalle ind ON ind.ingreso_id = i.id
            GROUP BY i.id, i.codigo_ingreso, i.fecha, i.viaje, i.vale, i.observacion
            ORDER BY i.fecha DESC, i.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial de ingresos:', error);
        res.status(500).json({ mensaje: 'Error al obtener el historial de ingresos' });
    }
};

// ==============================================================================
// 4. DETALLE DE UN INGRESO ESPECÍFICO (Qué artículos llegaron en ese viaje)
// ==============================================================================
const getDetalleIngreso = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT
                ind.id,
                r.codigo_req,
                a.nombre AS articulo,
                p.nombre AS proveedor,
                ind.cantidad_entregada,
                rd.cantidad AS pedido,
                rd.precio_proveedor,
                rd.precio_mina,
                (SELECT COALESCE(SUM(cantidad_entregada), 0) FROM ingresos_detalle WHERE requerimiento_detalle_id = rd.id) AS entregado_total
            FROM ingresos_detalle ind
            JOIN requerimientos_detalle rd ON rd.id = ind.requerimiento_detalle_id
            JOIN requerimientos r ON r.id = rd.requerimiento_id
            JOIN articulos a ON a.id = rd.articulo_id
            JOIN proveedores p ON p.id = rd.proveedor_id
            WHERE ind.ingreso_id = ?
            ORDER BY r.codigo_req ASC
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Ingreso no encontrado o sin detalles' });
        }
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener detalle de ingreso:', error);
        res.status(500).json({ mensaje: 'Error al obtener el detalle del ingreso' });
    }
};

module.exports = {
    getRequerimientosPendientes,
    crearIngreso,
    getHistorialIngresos,
    getDetalleIngreso
};