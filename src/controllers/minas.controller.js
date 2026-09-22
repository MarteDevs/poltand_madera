const db = require('../config/db');

// Obtener todas las minas (activas o inactivas según query)
const getMinas = async (req, res) => {
    try {
        const estado = (req.query.estado !== undefined && req.query.estado !== null && req.query.estado !== '') ? Number(req.query.estado) : 1;
        const [rows] = await db.query('SELECT * FROM minas WHERE estado = ? ORDER BY nombre ASC', [estado]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener minas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las minas' });
    }
};

// Crear una nueva mina (o reactivar si ya existía inactiva)
const crearMina = async (req, res) => {
    try {
        const { nombre, razon_social, ruc } = req.body;
        
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ mensaje: 'El nombre de la mina es obligatorio.' });
        }

        const nombreLimpio = nombre.trim();
        const [existente] = await db.query('SELECT id, estado FROM minas WHERE nombre = ?', [nombreLimpio]);

        if (existente.length > 0) {
            if (existente[0].estado === 1) {
                return res.status(400).json({ mensaje: 'Ya existe una mina activa con ese nombre.' });
            } else {
                // Reactivar la mina inactiva y actualizar sus datos
                await db.query(
                    `UPDATE minas SET razon_social = ?, ruc = ?, estado = 1 WHERE id = ?`,
                    [razon_social, ruc, existente[0].id]
                );
                return res.status(201).json({ mensaje: 'Mina reactivada exitosamente', id: existente[0].id });
            }
        }
        
        const [resultado] = await db.query(
            `INSERT INTO minas (nombre, razon_social, ruc, estado) VALUES (?, ?, ?, 1)`,
            [nombreLimpio, razon_social, ruc]
        );
        
        res.status(201).json({ 
            mensaje: 'Mina creada exitosamente', 
            id: resultado.insertId 
        });
    } catch (error) {
        console.error('Error al crear mina:', error);
        res.status(500).json({ mensaje: 'Error al crear la mina' });
    }
};

// Actualizar una mina existente
const actualizarMina = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, razon_social, ruc } = req.body;
        
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ mensaje: 'El nombre de la mina es obligatorio.' });
        }
        
        const [resultado] = await db.query(
            `UPDATE minas SET nombre = ?, razon_social = ?, ruc = ? WHERE id = ?`,
            [nombre.trim(), razon_social, ruc, id]
        );
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Mina no encontrada' });
        }
        
        res.json({ mensaje: 'Mina actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar mina:', error);
        res.status(500).json({ mensaje: 'Error al actualizar la mina' });
    }
};

// Borrado inteligente (Físico si no tiene historial, Lógico si tiene transacciones)
const desactivarMina = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [enReq] = await db.query('SELECT COUNT(*) as count FROM requerimientos WHERE mina_id = ?', [id]);
        const [enIng] = await db.query('SELECT COUNT(*) as count FROM ingresos_detalle WHERE mina_id = ?', [id]);

        if (enReq[0].count > 0 || enIng[0].count > 0) {
            const [resultado] = await db.query(`UPDATE minas SET estado = 0 WHERE id = ?`, [id]);
            if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Mina no encontrada' });
            return res.json({ mensaje: 'Mina desactivada (conservada en histórico)', deleted: false });
        } else {
            const [resultado] = await db.query(`DELETE FROM minas WHERE id = ?`, [id]);
            if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Mina no encontrada' });
            return res.json({ mensaje: 'Mina eliminada definitivamente', deleted: true });
        }
    } catch (error) {
        console.error('Error al desactivar mina:', error);
        res.status(500).json({ mensaje: 'Error al desactivar la mina' });
    }
};

// Reactivar una mina desactivada
const reactivarMina = async (req, res) => {
    try {
        const { id } = req.params;
        const [mina] = await db.query('SELECT id, nombre FROM minas WHERE id = ?', [id]);
        if (!mina || mina.length === 0) return res.status(404).json({ mensaje: 'Mina no encontrada' });

        const [dup] = await db.query('SELECT id FROM minas WHERE nombre = ? AND estado = 1 AND id != ?', [mina[0].nombre, id]);
        if (dup.length > 0) {
            return res.status(400).json({ mensaje: 'Ya existe otra mina activa con el mismo nombre' });
        }

        await db.query('UPDATE minas SET estado = 1 WHERE id = ?', [id]);
        res.json({ mensaje: 'Mina reactivada correctamente' });
    } catch (error) {
        console.error('Error al reactivar mina:', error);
        res.status(500).json({ mensaje: 'Error al reactivar la mina' });
    }
};

module.exports = { 
    getMinas, 
    crearMina, 
    actualizarMina, 
    desactivarMina,
    reactivarMina
};