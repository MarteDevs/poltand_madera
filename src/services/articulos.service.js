const BaseCatalogService = require('./base.service');
const pool = require('../config/db');

class ArticulosService extends BaseCatalogService {
    constructor() {
        super('articulos');
    }

    async getAll(proveedor_id = null, estado = 1) {
        const estadoNum = (estado !== undefined && estado !== null && estado !== '') ? Number(estado) : 1;
        if (proveedor_id !== null && proveedor_id !== undefined && proveedor_id !== '') {
            const [rows] = await pool.query(
                `SELECT a.id, a.codigo, a.nombre, a.estado, a.created_at, COALESCE(ap.precio_proveedor, a.precio_proveedor) AS precio_proveedor, COALESCE(ap.precio_mina, a.precio_mina) AS precio_mina FROM articulos a LEFT JOIN articulo_proveedores ap ON ap.articulo_id = a.id AND ap.proveedor_id = ? WHERE a.estado = ? ORDER BY CASE WHEN a.codigo IS NULL OR a.codigo = '' THEN 1 ELSE 0 END ASC, CAST(a.codigo AS UNSIGNED) ASC, a.nombre ASC`,
                [proveedor_id, estadoNum]
            );
            return rows;
        }

        const [rows] = await pool.query(
            `SELECT * FROM articulos WHERE estado = ? ORDER BY CASE WHEN codigo IS NULL OR codigo = '' THEN 1 ELSE 0 END ASC, CAST(codigo AS UNSIGNED) ASC, nombre ASC`,
            [estadoNum]
        );
        return rows;
    }

    async getPreciosProveedores(proveedor_id = null) {
        let sql = `SELECT ap.id, ap.articulo_id, ap.proveedor_id, ap.precio_proveedor, ap.precio_mina, a.nombre AS articulo_nombre, a.codigo AS articulo_codigo, p.nombre AS proveedor_nombre FROM articulo_proveedores ap JOIN articulos a ON a.id = ap.articulo_id JOIN proveedores p ON p.id = ap.proveedor_id`;
        const params = [];

        if (proveedor_id !== null && proveedor_id !== undefined && proveedor_id !== '') {
            sql += ` WHERE ap.proveedor_id = ?`;
            params.push(proveedor_id);
        }

        sql += ` ORDER BY p.nombre ASC, CASE WHEN a.codigo IS NULL OR a.codigo = '' THEN 1 ELSE 0 END ASC, CAST(a.codigo AS UNSIGNED) ASC, a.nombre ASC`;

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async guardarPrecioProveedor({ articulo_id, proveedor_id, precio_proveedor, precio_mina }) {
        const [result] = await pool.query(
            `INSERT INTO articulo_proveedores (articulo_id, proveedor_id, precio_proveedor, precio_mina) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE precio_proveedor = VALUES(precio_proveedor), precio_mina = VALUES(precio_mina)`,
            [articulo_id, proveedor_id, precio_proveedor, precio_mina]
        );
        return result;
    }

    async clonarPrecios({ origen_proveedor_id, destino_proveedor_id }) {
        const [result] = await pool.query(
            `INSERT INTO articulo_proveedores (articulo_id, proveedor_id, precio_proveedor, precio_mina) SELECT articulo_id, ?, precio_proveedor, precio_mina FROM articulo_proveedores WHERE proveedor_id = ? ON DUPLICATE KEY UPDATE precio_proveedor = VALUES(precio_proveedor), precio_mina = VALUES(precio_mina)`,
            [destino_proveedor_id, origen_proveedor_id]
        );
        return result;
    }

    async create({ codigo, nombre, precio_proveedor, precio_mina }) {
        if (codigo) {
            // Verificar si ya existe un artículo con ese código
            const [existente] = await pool.query(
                `SELECT id, estado FROM articulos WHERE codigo = ?`,
                [codigo]
            );

            if (existente.length > 0) {
                if (existente[0].estado === 1) {
                    const err = new Error('El código de artículo ya existe');
                    err.code = 'ER_DUP_ENTRY';
                    throw err;
                } else {
                    // Si estaba desactivado, reactivar y actualizar sus datos
                    await pool.query(
                        `UPDATE articulos SET nombre = ?, precio_proveedor = ?, precio_mina = ?, estado = 1 WHERE id = ?`,
                        [nombre, precio_proveedor, precio_mina, existente[0].id]
                    );
                    return existente[0].id;
                }
            }
        }

        const [result] = await pool.query(
            `INSERT INTO articulos (codigo, nombre, precio_proveedor, precio_mina, estado) VALUES (?, ?, ?, ?, 1)`,
            [codigo, nombre, precio_proveedor, precio_mina]
        );
        return result.insertId;
    }

    async delete(id) {
        // Verificar si el artículo tiene registros en requerimientos o ingresos
        const [enReq] = await pool.query(
            `SELECT COUNT(*) as count FROM requerimientos_detalle WHERE articulo_id = ?`,
            [id]
        );
        const [enIng] = await pool.query(
            `SELECT COUNT(*) as count FROM ingresos_detalle WHERE articulo_id = ?`,
            [id]
        );

        if (enReq[0].count > 0 || enIng[0].count > 0) {
            // Tiene historial transaccional: desactivar lógicamente para preservar historial
            await pool.query(`UPDATE articulos SET estado = 0 WHERE id = ?`, [id]);
            return { deleted: false, message: 'desactivado' };
        } else {
            // Sin historial: borrado físico completo para liberar el código
            await pool.query(`DELETE FROM articulo_proveedores WHERE articulo_id = ?`, [id]);
            await pool.query(`DELETE FROM articulos WHERE id = ?`, [id]);
            return { deleted: true, message: 'eliminado' };
        }
    }

    async reactivar(id) {
        const [art] = await pool.query('SELECT id, codigo FROM articulos WHERE id = ?', [id]);
        if (!art || art.length === 0) {
            const err = new Error('Artículo no encontrado');
            err.status = 404;
            throw err;
        }
        if (art[0].codigo) {
            const [dup] = await pool.query(
                'SELECT id FROM articulos WHERE codigo = ? AND estado = 1 AND id != ?',
                [art[0].codigo, id]
            );
            if (dup.length > 0) {
                const err = new Error('El código ya está en uso por otro artículo activo.');
                err.status = 400;
                throw err;
            }
        }
        await pool.query('UPDATE articulos SET estado = 1 WHERE id = ?', [id]);
        return true;
    }
}

module.exports = new ArticulosService();

