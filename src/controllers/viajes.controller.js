const db = require('../config/db');

const getViajes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre, estado, created_at FROM viajes WHERE estado = 1 ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener viajes:', error);
        res.status(500).json({ mensaje: 'Error al obtener los viajes' });
    }
};

const crearViaje = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
        const [resultado] = await db.query(`INSERT INTO viajes (nombre) VALUES (?)`, [nombre]);
        res.status(201).json({ mensaje: 'Viaje creado', id: resultado.insertId });
    } catch (error) {
        console.error('Error al crear viaje:', error);
        res.status(500).json({ mensaje: 'Error al crear el viaje' });
    }
};

const actualizarViaje = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
        const [resultado] = await db.query(`UPDATE viajes SET nombre = ? WHERE id = ?`, [nombre, id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Viaje no encontrado' });
        res.json({ mensaje: 'Viaje actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar viaje:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el viaje' });
    }
};

const desactivarViaje = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query(`UPDATE viajes SET estado = 0 WHERE id = ?`, [id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Viaje no encontrado' });
        res.json({ mensaje: 'Viaje desactivado correctamente' });
    } catch (error) {
        console.error('Error al desactivar viaje:', error);
        res.status(500).json({ mensaje: 'Error al desactivar el viaje' });
    }
};

module.exports = { getViajes, crearViaje, actualizarViaje, desactivarViaje };
