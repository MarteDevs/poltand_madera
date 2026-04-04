const db = require('../config/db');

// Obtener todas las minas activas
const getMinas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM minas WHERE estado = 1 ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener minas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las minas' });
    }
};

// Crear una nueva mina
const crearMina = async (req, res) => {
    try {
        const { nombre, razon_social, ruc } = req.body;
        
        const [resultado] = await db.query(
            `INSERT INTO minas (nombre, razon_social, ruc) VALUES (?, ?, ?)`,
            [nombre, razon_social, ruc]
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
        
        const [resultado] = await db.query(
            `UPDATE minas SET nombre = ?, razon_social = ?, ruc = ? WHERE id = ?`,
            [nombre, razon_social, ruc, id]
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

// Borrado lógico (Desactivar)
const desactivarMina = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [resultado] = await db.query(
            `UPDATE minas SET estado = 0 WHERE id = ?`, 
            [id]
        );
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Mina no encontrada' });
        }
        
        res.json({ mensaje: 'Mina desactivada correctamente' });
    } catch (error) {
        console.error('Error al desactivar mina:', error);
        res.status(500).json({ mensaje: 'Error al desactivar la mina' });
    }
};

module.exports = { 
    getMinas, 
    crearMina, 
    actualizarMina, 
    desactivarMina 
};