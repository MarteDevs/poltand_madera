const db = require('../config/db');

const getProveedores = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM proveedores WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ mensaje: 'Error al obtener los proveedores' });
    }
};

const crearProveedor = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
        
        const [resultado] = await db.query(
            `INSERT INTO proveedores (nombre) VALUES (?)`,
            [nombre]
        );
        res.status(201).json({ mensaje: 'Proveedor creado', id: resultado.insertId });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ mensaje: 'Error al crear el proveedor' });
    }
};

const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });

        const [resultado] = await db.query(
            `UPDATE proveedores SET nombre = ? WHERE id = ?`,
            [nombre, id]
        );
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
        res.json({ mensaje: 'Proveedor actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el proveedor' });
    }
};

const desactivarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query(`UPDATE proveedores SET estado = 0 WHERE id = ?`, [id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
        res.json({ mensaje: 'Proveedor desactivado correctamente' });
    } catch (error) {
        console.error('Error al desactivar proveedor:', error);
        res.status(500).json({ mensaje: 'Error al desactivar el proveedor' });
    }
};

module.exports = { getProveedores, crearProveedor, actualizarProveedor, desactivarProveedor };