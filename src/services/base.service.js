const pool = require('../config/db');

/**
 * Servicio base para operaciones CRUD en catálogos (Articulos, Minas, etc)
 */
class BaseCatalogService {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async getAll() {
        const [rows] = await pool.query(
            `SELECT * FROM ${this.tableName} WHERE estado = 1 ORDER BY id DESC`
        );
        return rows;
    }

    async getById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM ${this.tableName} WHERE id = ? AND estado = 1`,
            [id]
        );
        return rows[0];
    }

    async create(data) {
        const [result] = await pool.query(
            `INSERT INTO ${this.tableName} SET ?`,
            [data]
        );
        return result.insertId;
    }

    async update(id, data) {
        await pool.query(
            `UPDATE ${this.tableName} SET ? WHERE id = ?`,
            [data, id]
        );
        return true;
    }

    async softDelete(id) {
        await pool.query(
            `UPDATE ${this.tableName} SET estado = 0 WHERE id = ?`,
            [id]
        );
        return true;
    }
}

module.exports = BaseCatalogService;
