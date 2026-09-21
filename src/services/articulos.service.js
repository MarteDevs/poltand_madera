const BaseCatalogService = require('./base.service');
const pool = require('../config/db');

class ArticulosService extends BaseCatalogService {
    constructor() {
        super('articulos');
    }

    async getAll(proveedor_id = null) {
        if (proveedor_id !== null && proveedor_id !== undefined && proveedor_id !== '') {
            const [rows] = await pool.query(
                `SELECT a.id, a.codigo, a.nombre, a.estado, a.created_at, COALESCE(ap.precio_proveedor, a.precio_proveedor) AS precio_proveedor, COALESCE(ap.precio_mina, a.precio_mina) AS precio_mina FROM articulos a LEFT JOIN articulo_proveedores ap ON ap.articulo_id = a.id AND ap.proveedor_id = ? WHERE a.estado = 1 ORDER BY a.nombre ASC`,
                [proveedor_id]
            );
            return rows;
        }

        const [rows] = await pool.query(
            `SELECT * FROM articulos WHERE estado = 1 ORDER BY nombre ASC`
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

        sql += ` ORDER BY p.nombre ASC, a.nombre ASC`;

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
}

module.exports = new ArticulosService();

