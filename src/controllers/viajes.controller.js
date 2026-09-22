const db = require('../config/db');

const getViajes = async (req, res) => {
    try {
        const estado = req.query.estado !== undefined ? parseInt(req.query.estado) : 1;
        const [rows] = await db.query('SELECT id, nombre, estado, created_at FROM viajes WHERE estado = ? ORDER BY id ASC', [estado]);
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
        const nombreTrim = nombre.trim();

        // Verificar si existe viaje con el mismo nombre
        const [existentes] = await db.query(
            'SELECT * FROM viajes WHERE LOWER(nombre) = LOWER(?)',
            [nombreTrim]
        );

        if (existentes.length > 0) {
            const viajeExistente = existentes[0];
            if (viajeExistente.estado === 0) {
                await db.query('UPDATE viajes SET estado = 1 WHERE id = ?', [viajeExistente.id]);
                return res.status(200).json({
                    mensaje: 'El viaje existía como desactivado y ha sido reactivado automáticamente',
                    id: viajeExistente.id,
                    reactivado: true
                });
            }
            return res.status(400).json({ mensaje: 'Ya existe un viaje activo con ese nombre' });
        }

        const [resultado] = await db.query(`INSERT INTO viajes (nombre) VALUES (?)`, [nombreTrim]);
        res.status(201).json({ mensaje: 'Viaje creado exitosamente', id: resultado.insertId });
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

        const [resultado] = await db.query(`UPDATE viajes SET nombre = ? WHERE id = ?`, [nombre.trim(), id]);
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
        const [viaje] = await db.query('SELECT * FROM viajes WHERE id = ?', [id]);
        if (viaje.length === 0) return res.status(404).json({ mensaje: 'Viaje no encontrado' });

        // Verificar si tiene ingresos asociados
        const [[{ countIng }]] = await db.query(
            'SELECT COUNT(*) as countIng FROM ingresos WHERE viaje_id = ?',
            [id]
        );

        if (countIng > 0) {
            await db.query(`UPDATE viajes SET estado = 0 WHERE id = ?`, [id]);
            return res.json({
                mensaje: 'Viaje desactivado (conservado en el historial por tener ingresos asociados)',
                borrado_fisico: false
            });
        } else {
            await db.query(`DELETE FROM viajes WHERE id = ?`, [id]);
            return res.json({
                mensaje: 'Viaje eliminado permanentemente (no tenía registros asociados)',
                borrado_fisico: true
            });
        }
    } catch (error) {
        console.error('Error al desactivar viaje:', error);
        res.status(500).json({ mensaje: 'Error al procesar la eliminación del viaje' });
    }
};

const reactivarViaje = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query('UPDATE viajes SET estado = 1 WHERE id = ?', [id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Viaje no encontrado' });
        res.json({ mensaje: 'Viaje reactivado correctamente' });
    } catch (error) {
        console.error('Error al reactivar viaje:', error);
        res.status(500).json({ mensaje: 'Error al reactivar el viaje' });
    }
};

module.exports = {
    getViajes,
    crearViaje,
    actualizarViaje,
    desactivarViaje,
    reactivarViaje
};
