const db = require('../config/db');

const getSupervisores = async (req, res) => {
    try {
        const estado = req.query.estado !== undefined ? parseInt(req.query.estado) : 1;
        const [rows] = await db.query('SELECT * FROM supervisor WHERE estado = ? ORDER BY nombre ASC', [estado]);
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
        const nombreTrim = nombre.trim();

        // Verificar si existe supervisor con el mismo nombre
        const [existentes] = await db.query(
            'SELECT * FROM supervisor WHERE LOWER(nombre) = LOWER(?)',
            [nombreTrim]
        );

        if (existentes.length > 0) {
            const supExistente = existentes[0];
            if (supExistente.estado === 0) {
                await db.query('UPDATE supervisor SET estado = 1 WHERE id = ?', [supExistente.id]);
                return res.status(200).json({
                    mensaje: 'El supervisor existía como desactivado y ha sido reactivado automáticamente',
                    id: supExistente.id,
                    reactivado: true
                });
            }
            return res.status(400).json({ mensaje: 'Ya existe un supervisor activo con ese nombre' });
        }

        const [resultado] = await db.query(
            `INSERT INTO supervisor (nombre) VALUES (?)`,
            [nombreTrim]
        );
        res.status(201).json({ mensaje: 'Supervisor creado exitosamente', id: resultado.insertId });
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
            [nombre.trim(), id]
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
        const [sup] = await db.query('SELECT * FROM supervisor WHERE id = ?', [id]);
        if (sup.length === 0) return res.status(404).json({ mensaje: 'Supervisor no encontrado' });

        // Verificar si tiene requerimientos asociados
        const [[{ countReq }]] = await db.query(
            'SELECT COUNT(*) as countReq FROM requerimientos WHERE supervisor_id = ?',
            [id]
        );

        if (countReq > 0) {
            await db.query(`UPDATE supervisor SET estado = 0 WHERE id = ?`, [id]);
            return res.json({
                mensaje: 'Supervisor desactivado (conservado en el historial por tener requerimientos asociados)',
                borrado_fisico: false
            });
        } else {
            await db.query(`DELETE FROM supervisor WHERE id = ?`, [id]);
            return res.json({
                mensaje: 'Supervisor eliminado permanentemente (no tenía registros asociados)',
                borrado_fisico: true
            });
        }
    } catch (error) {
        console.error('Error al desactivar supervisor:', error);
        res.status(500).json({ mensaje: 'Error al procesar la eliminación del supervisor' });
    }
};

const reactivarSupervisor = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query('UPDATE supervisor SET estado = 1 WHERE id = ?', [id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Supervisor no encontrado' });
        res.json({ mensaje: 'Supervisor reactivado correctamente' });
    } catch (error) {
        console.error('Error al reactivar supervisor:', error);
        res.status(500).json({ mensaje: 'Error al reactivar el supervisor' });
    }
};

module.exports = {
    getSupervisores,
    crearSupervisor,
    actualizarSupervisor,
    desactivarSupervisor,
    reactivarSupervisor
};