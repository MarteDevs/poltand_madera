const db = require('../config/db');

const getSupervisores = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM supervisor WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener supervisores:', error);
        res.status(500).json({ mensaje: 'Error al obtener los supervisores' });
    }
};

const crearSupervisor = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });

        const [resultado] = await db.query(
            `INSERT INTO supervisor (nombre) VALUES (?)`,
            [nombre]
        );
        res.status(201).json({ mensaje: 'Supervisor creado', id: resultado.insertId });
    } catch (error) {
        console.error('Error al crear supervisor:', error);
        res.status(500).json({ mensaje: 'Error al crear el supervisor' });
    }
};

const actualizarSupervisor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });

        const [resultado] = await db.query(
            `UPDATE supervisor SET nombre = ? WHERE id = ?`,
            [nombre, id]
        );
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Supervisor no encontrado' });
        res.json({ mensaje: 'Supervisor actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar supervisor:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el supervisor' });
    }
};

const desactivarSupervisor = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query(`UPDATE supervisor SET estado = 0 WHERE id = ?`, [id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Supervisor no encontrado' });
        res.json({ mensaje: 'Supervisor desactivado correctamente' });
    } catch (error) {
        console.error('Error al desactivar supervisor:', error);
        res.status(500).json({ mensaje: 'Error al desactivar el supervisor' });
    }
};

module.exports = { getSupervisores, crearSupervisor, actualizarSupervisor, desactivarSupervisor };