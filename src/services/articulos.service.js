const BaseCatalogService = require('./base.service');

class ArticulosService extends BaseCatalogService {
    constructor() {
        super('articulos');
    }

    async getAll() {
        const [rows] = await require('../config/db').query(
            `SELECT * FROM articulos WHERE estado = 1 ORDER BY nombre ASC`
        );
        return rows;
    }
}

module.exports = new ArticulosService();
