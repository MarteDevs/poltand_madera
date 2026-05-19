const requerimientosService = require('../services/requerimientos.service');
const pool = require('../config/db');

const crearRequerimiento = async (req, res, next) => {
    try {
        const { fecha, mina_id, supervisor_id, detalles } = req.body;
        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'El requerimiento debe tener al menos un artículo.' });
        }
        const result = await requerimientosService.crear({ fecha, mina_id, supervisor_id, detalles });
        res.status(201).json({
            mensaje: 'Requerimiento creado con éxito',
            codigo_req: result.codigo
        });
    } catch (error) {
        next(error);
    }
};

const getSiguienteCodigo = async (req, res, next) => {
    const conexion = await pool.getConnection();
    try {
        const { fecha } = req.query;
        const codigo = await requerimientosService.generarCodigo(conexion, fecha);
        res.json({ codigo });
    } catch (error) {
        next(error);
    } finally {
        conexion.release();
    }
};

const getHistorial = async (req, res, next) => {
    try {
        const rows = await requerimientosService.getHistorial();
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const getDetalles = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Mantenemos la query aquí o la movemos al service si es muy compleja. 
        // Para consistencia, usemos el service.
        const [rows] = await require('../config/db').query(`
            SELECT 
                rd.id, 
                a.nombre AS articulo, 
                p.nombre AS proveedor, 
                rd.cantidad AS pedido,
                rd.precio_proveedor,
                rd.precio_mina,
                rd.articulo_id,
                rd.proveedor_id,
                COALESCE(SUM(ind.cantidad_entregada), 0) AS entregado,
                (rd.cantidad - COALESCE(SUM(ind.cantidad_entregada), 0)) AS faltante
            FROM requerimientos_detalle rd
            JOIN articulos a ON rd.articulo_id = a.id
            JOIN proveedores p ON rd.proveedor_id = p.id
            LEFT JOIN ingresos_detalle ind ON ind.requerimiento_detalle_id = rd.id
            WHERE rd.requerimiento_id = ?
            GROUP BY rd.id, a.nombre, p.nombre, rd.cantidad, rd.precio_proveedor, rd.precio_mina
        `, [id]);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const getHistorialDetallado = async (req, res, next) => {
    try {
        const [rows] = await require('../config/db').query(`
            SELECT 
                r.codigo_req, 
                DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha, 
                m.nombre AS mina, 
                COALESCE(s.nombre, 'Sin asignar') AS supervisor, 
                r.estado,
                a.nombre AS articulo, 
                p.nombre AS proveedor, 
                rd.cantidad AS pedido,
                COALESCE(SUM(ind.cantidad_entregada), 0) AS entregado,
                (rd.cantidad - COALESCE(SUM(ind.cantidad_entregada), 0)) AS faltante,
                rd.precio_proveedor,
                rd.precio_mina,
                (rd.cantidad * rd.precio_proveedor) AS total_proveedor_linea,
                (rd.cantidad * rd.precio_mina) AS total_mina_linea
            FROM requerimientos r
            JOIN minas m ON r.mina_id = m.id
            LEFT JOIN supervisor s ON r.supervisor_id = s.id
            JOIN requerimientos_detalle rd ON rd.requerimiento_id = r.id
            JOIN articulos a ON rd.articulo_id = a.id
            JOIN proveedores p ON rd.proveedor_id = p.id
            LEFT JOIN ingresos_detalle ind ON ind.requerimiento_detalle_id = rd.id
            GROUP BY 
                r.id, r.codigo_req, r.fecha, m.nombre, s.nombre, r.estado,
                rd.id, a.nombre, p.nombre, rd.cantidad, rd.precio_proveedor, rd.precio_mina
            ORDER BY r.fecha DESC, r.codigo_req DESC, a.nombre ASC
        `);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const actualizarRequerimiento = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fecha, mina_id, supervisor_id, detalles } = req.body;
        
        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'El requerimiento debe tener al menos un artículo.' });
        }

        await requerimientosService.update(id, { fecha, mina_id, supervisor_id, detalles });
        res.json({ mensaje: 'Requerimiento actualizado con éxito' });
    } catch (error) {
        next(error);
    }
};

const eliminarRequerimiento = async (req, res, next) => {
    try {
        const { id } = req.params;
        await requerimientosService.delete(id);
        res.json({ mensaje: 'Requerimiento eliminado con éxito' });
    } catch (error) {
        next(error);
    }
};

const forzarCierreRequerimiento = async (req, res, next) => {
    try {
        const { id } = req.params;
        await requerimientosService.forzarCierre(id);
        res.json({ mensaje: 'Requerimiento cerrado exitosamente' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    crearRequerimiento,
    getHistorial,
    getDetalles,
    getHistorialDetallado,
    actualizarRequerimiento,
    eliminarRequerimiento,
    getSiguienteCodigo,
    forzarCierreRequerimiento
};