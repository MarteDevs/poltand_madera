const pool = require('../config/db');

class RequerimientosService {
    /**
     * Genera un código de requerimiento secuencial para el mes actual
     * Formato: REQ-{mes}-{correlativo}
     */
    async generarCodigo(conexion) {
        const ahora = new Date();
        const mesActual = ahora.getMonth() + 1;
        const anioActual = ahora.getFullYear();

        const [rows] = await conexion.query(
            `SELECT COUNT(*) as total FROM requerimientos 
             WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?`,
            [mesActual, anioActual]
        );
        
        const correlativo = (rows[0].total + 1).toString().padStart(3, '0');
        return `REQ-${mesActual}-${correlativo}`;
    }

    /**
     * Crea un nuevo requerimiento con sus detalles en una transacción
     */
    async crear(data) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();

            const { fecha, mina_id, supervisor_id, detalles } = data;
            const codigo_req = await this.generarCodigo(conexion);

            // 1. Insertar cabecera
            const [result] = await conexion.query(
                `INSERT INTO requerimientos (codigo_req, fecha, mina_id, supervisor_id, estado) 
                 VALUES (?, ?, ?, ?, 'PENDIENTE')`,
                [codigo_req, fecha, mina_id, supervisor_id]
            );

            const requerimiento_id = result.insertId;

            // 2. Insertar detalles
            for (const d of detalles) {
                await conexion.query(
                    `INSERT INTO requerimientos_detalle 
                     (requerimiento_id, articulo_id, proveedor_id, cantidad, precio_proveedor, precio_mina)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [requerimiento_id, d.articulo_id, d.proveedor_id, d.cantidad, d.precio_proveedor, d.precio_mina]
                );
            }

            await conexion.commit();
            return { success: true, codigo: codigo_req };
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    }

    async getHistorial() {
        const [rows] = await pool.query(`
            SELECT 
                r.id, r.codigo_req, DATE_FORMAT(r.fecha, '%d/%m/%Y') as fecha, 
                m.nombre as mina, s.nombre as supervisor, r.estado,
                SUM(rd.cantidad * rd.precio_proveedor) as total_proveedor,
                SUM(rd.cantidad * rd.precio_mina) as total_mina
            FROM requerimientos r
            JOIN minas m ON r.mina_id = m.id
            LEFT JOIN supervisor s ON r.supervisor_id = s.id
            JOIN requerimientos_detalle rd ON r.id = rd.requerimiento_id
            GROUP BY r.id
            ORDER BY r.id DESC
        `);
        return rows;
    }
}

module.exports = new RequerimientosService();
