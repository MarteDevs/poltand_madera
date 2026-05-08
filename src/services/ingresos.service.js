const pool = require('../config/db');

class IngresosService {
    /**
     * Genera un código de ingreso secuencial para la fecha dada
     * Formato: ENT-{YYYYMMDD}-{VIAJE}-{CORRELATIVO}
     */
    async generarCodigo(conexion, fecha, viaje) {
        const f = new Date(fecha);
        const ymd = `${f.getFullYear()}${(f.getMonth() + 1).toString().padStart(2, '0')}${f.getDate().toString().padStart(2, '0')}`;
        const v = viaje ? viaje.replace(/\s+/g, '-').toUpperCase() : 'SV';
        
        const [rows] = await conexion.query(
            `SELECT COUNT(*) AS total FROM ingresos WHERE DATE(fecha) = ?`,
            [fecha]
        );
        const correlativo = (rows[0].total + 1).toString().padStart(3, '0');
        return `ENT-${ymd}-${v}-${correlativo}`;
    }

    /**
     * Registra un nuevo ingreso (viaje) y actualiza estados de requerimientos
     */
    async crear(data) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();

            const { fecha, viaje, vale, observacion, detalles } = data;
            const codigo_ingreso = await this.generarCodigo(conexion, fecha, viaje);

            // 1. Insertar cabecera
            const [result] = await conexion.query(
                `INSERT INTO ingresos (codigo_ingreso, fecha, viaje, vale, observacion) 
                 VALUES (?, ?, ?, ?, ?)`,
                [codigo_ingreso, fecha, viaje, vale, observacion]
            );

            const ingreso_id = result.insertId;

            // 2. Insertar detalles y verificar estados
            const reqsAfectados = new Set();

            for (const d of detalles) {
                await conexion.query(
                    `INSERT INTO ingresos_detalle (ingreso_id, requerimiento_detalle_id, cantidad_entregada)
                     VALUES (?, ?, ?)`,
                    [ingreso_id, d.requerimiento_detalle_id, d.cantidad_entregada]
                );

                // Obtener el ID del requerimiento padre para verificar su estado luego
                const [reqInfo] = await conexion.query(
                    `SELECT requerimiento_id FROM requerimientos_detalle WHERE id = ?`,
                    [d.requerimiento_detalle_id]
                );
                if (reqInfo[0]) reqsAfectados.add(reqInfo[0].requerimiento_id);
            }

            // 3. Actualizar estados de requerimientos afectados
            for (const reqId of reqsAfectados) {
                const [faltantes] = await conexion.query(`
                    SELECT 
                        rd.cantidad as pedido,
                        COALESCE(SUM(id.cantidad_entregada), 0) as entregado
                    FROM requerimientos_detalle rd
                    LEFT JOIN ingresos_detalle id ON rd.id = id.requerimiento_detalle_id
                    WHERE rd.requerimiento_id = ?
                    GROUP BY rd.id
                `, [reqId]);

                const todoCompletado = faltantes.every(f => f.entregado >= f.pedido);

                if (todoCompletado) {
                    await conexion.query(
                        `UPDATE requerimientos SET estado = 'COMPLETADO' WHERE id = ?`,
                        [reqId]
                    );
                }
            }

            await conexion.commit();
            return { success: true, codigo: codigo_ingreso };
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    }
}

module.exports = new IngresosService();
