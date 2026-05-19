const pool = require('../config/db');

class RequerimientosService {
    /**
     * Genera un código de requerimiento secuencial para el mes actual
     * Formato: REQ-{mes}-{correlativo}
     */
    async generarCodigo(conexion, fechaInput) {
        const fechaObj = new Date(fechaInput || Date.now());
        const mesActual = fechaObj.getMonth() + 1;

        const prefix = `REQ-${mesActual}-`;

        const [rows] = await conexion.query(
            `SELECT codigo_req FROM requerimientos 
             WHERE codigo_req LIKE ?
             ORDER BY LENGTH(codigo_req) DESC, codigo_req DESC LIMIT 1`,
            [`${prefix}%`]
        );
        
        let siguienteCorrelativo = 1;
        if (rows.length > 0) {
            const ultimoCodigo = rows[0].codigo_req;
            const partes = ultimoCodigo.split('-');
            if (partes.length === 3) {
                const ultimoNumero = parseInt(partes[2], 10);
                if (!isNaN(ultimoNumero)) {
                    siguienteCorrelativo = ultimoNumero + 1;
                }
            }
        }
        
        const correlativo = siguienteCorrelativo.toString().padStart(3, '0');
        return `${prefix}${correlativo}`;
    }

    /**
     * Crea un nuevo requerimiento con sus detalles en una transacción
     */
    async crear(data) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();

            const { fecha, mina_id, supervisor_id, detalles } = data;
            const codigo_req = await this.generarCodigo(conexion, fecha);

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
                r.id, r.codigo_req, DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha, 
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

    async delete(id) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();

            // Verificar si tiene ingresos
            const [ingresos] = await conexion.query(
                `SELECT COUNT(*) as total FROM ingresos_detalle id 
                 JOIN requerimientos_detalle rd ON id.requerimiento_detalle_id = rd.id 
                 WHERE rd.requerimiento_id = ?`,
                [id]
            );

            if (ingresos[0].total > 0) {
                throw new Error('No se puede eliminar un requerimiento que ya tiene ingresos registrados.');
            }

            await conexion.query('DELETE FROM requerimientos WHERE id = ?', [id]);
            
            await conexion.commit();
            return { success: true };
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    }

    async update(id, data) {
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();

            const { fecha, mina_id, supervisor_id, detalles } = data;

            // 1. Obtener detalles actuales con lo entregado para validar
            const [detallesActuales] = await conexion.query(`
                SELECT rd.id, rd.articulo_id, rd.cantidad as pedido, 
                       COALESCE(SUM(ind.cantidad_entregada), 0) as entregado
                FROM requerimientos_detalle rd
                LEFT JOIN ingresos_detalle ind ON rd.id = ind.requerimiento_detalle_id
                WHERE rd.requerimiento_id = ?
                GROUP BY rd.id
            `, [id]);

            // 2. Validar que no se eliminen items con entregas o se reduzca cantidad bajo lo entregado
            const idsEnData = detalles.filter(d => d.id).map(d => d.id);
            
            for (const actual of detallesActuales) {
                const itemData = detalles.find(d => d.id === actual.id);
                
                // Si el item ya no está en el nuevo set y tiene entregas -> Error
                if (!itemData && actual.entregado > 0) {
                    throw new Error(`No se puede eliminar el artículo ID ${actual.articulo_id} porque ya tiene entregas registradas.`);
                }
                
                // Si el item está pero la nueva cantidad es menor a lo entregado -> Error
                if (itemData && itemData.cantidad < actual.entregado) {
                    throw new Error(`La nueva cantidad para el artículo ID ${actual.articulo_id} no puede ser menor a lo ya entregado (${actual.entregado}).`);
                }
            }

            // 3. Actualizar cabecera
            await conexion.query(
                `UPDATE requerimientos SET fecha = ?, mina_id = ?, supervisor_id = ? WHERE id = ?`,
                [fecha, mina_id, supervisor_id, id]
            );

            // 4. Procesar detalles
            // a. Eliminar detalles que ya no vienen (y que pasaron la validación de entregado=0)
            if (idsEnData.length > 0) {
                await conexion.query(
                    `DELETE FROM requerimientos_detalle WHERE requerimiento_id = ? AND id NOT IN (?)`,
                    [id, idsEnData]
                );
            } else {
                // Si mandan lista vacía (validación previa en controller debería evitar esto, pero por si acaso)
                await conexion.query(`DELETE FROM requerimientos_detalle WHERE requerimiento_id = ?`, [id]);
            }

            // b. Actualizar o Insertar
            for (const d of detalles) {
                if (d.id) {
                    // Update
                    await conexion.query(
                        `UPDATE requerimientos_detalle SET 
                         articulo_id = ?, proveedor_id = ?, cantidad = ?, precio_proveedor = ?, precio_mina = ?
                         WHERE id = ? AND requerimiento_id = ?`,
                        [d.articulo_id, d.proveedor_id, d.cantidad, d.precio_proveedor, d.precio_mina, d.id, id]
                    );
                } else {
                    // Insert (Nuevo item extra)
                    await conexion.query(
                        `INSERT INTO requerimientos_detalle 
                         (requerimiento_id, articulo_id, proveedor_id, cantidad, precio_proveedor, precio_mina)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [id, d.articulo_id, d.proveedor_id, d.cantidad, d.precio_proveedor, d.precio_mina]
                    );
                }
            }

            // 5. Recalcular estado final del requerimiento
            const [finalStats] = await conexion.query(`
                SELECT 
                    rd.cantidad as pedido,
                    COALESCE(SUM(id.cantidad_entregada), 0) as entregado
                FROM requerimientos_detalle rd
                LEFT JOIN ingresos_detalle id ON rd.id = id.requerimiento_detalle_id
                WHERE rd.requerimiento_id = ?
                GROUP BY rd.id
            `, [id]);

            let nuevoEstado = 'PENDIENTE';
            const totalEntregado = finalStats.reduce((acc, curr) => acc + parseFloat(curr.entregado), 0);
            
            if (totalEntregado > 0) {
                const todoCompletado = finalStats.every(f => parseFloat(f.entregado) >= parseFloat(f.pedido));
                nuevoEstado = todoCompletado ? 'COMPLETADO' : 'PARCIAL';
            }

            await conexion.query(`UPDATE requerimientos SET estado = ? WHERE id = ?`, [nuevoEstado, id]);

            await conexion.commit();
            return { success: true };
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    }
    
    async forzarCierre(id) {
        const [result] = await pool.query(
            `UPDATE requerimientos SET is_cerrado = 1, estado = 'COMPLETADO' WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Requerimiento no encontrado');
        }
        return { success: true };
    }
}

module.exports = new RequerimientosService();
