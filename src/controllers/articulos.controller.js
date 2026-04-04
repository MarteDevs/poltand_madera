const db = require('../config/db');

const getArticulos = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM articulos WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los artículos' });
    }
};

const crearArticulo = async (req, res) => {
    try {
        const { codigo, nombre, precio_proveedor, precio_mina } = req.body;
        const [resultado] = await db.query(
            `INSERT INTO articulos (codigo, nombre, precio_proveedor, precio_mina) VALUES (?, ?, ?, ?)`,
            [codigo, nombre, precio_proveedor, precio_mina]
        );
        res.status(201).json({ mensaje: 'Artículo creado', id: resultado.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensaje: 'El código ya existe' });
        res.status(500).json({ mensaje: 'Error al crear el artículo' });
    }
};

const actualizarArticulo = async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, nombre, precio_proveedor, precio_mina } = req.body;
        const [resultado] = await db.query(
            `UPDATE articulos SET codigo = ?, nombre = ?, precio_proveedor = ?, precio_mina = ? WHERE id = ?`,
            [codigo, nombre, precio_proveedor, precio_mina, id]
        );
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'No encontrado' });
        res.json({ mensaje: 'Artículo actualizado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar' });
    }
};

const desactivarArticulo = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query(`UPDATE articulos SET estado = 0 WHERE id = ?`, [id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'No encontrado' });
        res.json({ mensaje: 'Artículo desactivado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al desactivar' });
    }
};

module.exports = { getArticulos, crearArticulo, actualizarArticulo, desactivarArticulo };