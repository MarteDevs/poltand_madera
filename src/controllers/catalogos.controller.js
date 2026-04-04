const db = require('../config/db');

// Obtener todas las minas activas
const getMinas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre, razon_social, ruc FROM minas WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener minas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las minas' });
    }
};

// Obtener todos los proveedores activos
const getProveedores = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre FROM proveedores WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ mensaje: 'Error al obtener los proveedores' });
    }
};

// Obtener todos los artículos activos (con sus precios por defecto)
const getArticulos = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, codigo, nombre, precio_proveedor, precio_mina FROM articulos WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener artículos:', error);
        res.status(500).json({ mensaje: 'Error al obtener los artículos' });
    }
};

// Obtener todos los supervisores activos
const getSupervisores = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre FROM supervisor WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener supervisores:', error);
        res.status(500).json({ mensaje: 'Error al obtener los supervisores' });
    }
};

module.exports = {
    getMinas,
    getProveedores,
    getArticulos,
    getSupervisores
};