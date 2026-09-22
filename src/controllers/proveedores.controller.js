const db = require('../config/db');

const getProveedores = async (req, res) => {
    try {
        const estado = req.query.estado !== undefined ? parseInt(req.query.estado) : 1;
        const [rows] = await db.query('SELECT * FROM proveedores WHERE estado = ? ORDER BY nombre ASC', [estado]);
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
        const nombreTrim = nombre.trim();

        // Verificar si existe proveedor con el mismo nombre
        const [existentes] = await db.query(
            'SELECT * FROM proveedores WHERE LOWER(nombre) = LOWER(?)',
            [nombreTrim]
        );

        if (existentes.length > 0) {
            const provExistente = existentes[0];
            if (provExistente.estado === 0) {
                await db.query('UPDATE proveedores SET estado = 1 WHERE id = ?', [provExistente.id]);
                return res.status(200).json({
                    mensaje: 'El proveedor existía como desactivado y ha sido reactivado automáticamente',
                    id: provExistente.id,
                    reactivado: true
                });
            }
            return res.status(400).json({ mensaje: 'Ya existe un proveedor activo con ese nombre' });
        }
        
        const [resultado] = await db.query(
            `INSERT INTO proveedores (nombre) VALUES (?)`,
            [nombreTrim]
        );
        res.status(201).json({ mensaje: 'Proveedor creado exitosamente', id: resultado.insertId });
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
            [nombre.trim(), id]
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
        const [prov] = await db.query('SELECT * FROM proveedores WHERE id = ?', [id]);
        if (prov.length === 0) return res.status(404).json({ mensaje: 'Proveedor no encontrado' });

        // Verificar referencias en requerimientos_detalle y articulo_proveedores
        const [[{ countReq }]] = await db.query(
            'SELECT COUNT(*) as countReq FROM requerimientos_detalle WHERE proveedor_id = ?',
            [id]
        );
        const [[{ countArt }]] = await db.query(
            'SELECT COUNT(*) as countArt FROM articulo_proveedores WHERE proveedor_id = ?',
            [id]
        );

        if (countReq > 0 || countArt > 0) {
            await db.query('UPDATE proveedores SET estado = 0 WHERE id = ?', [id]);
            return res.json({
                mensaje: 'Proveedor desactivado (conservado en el historial por tener registros asociados)',
                borrado_fisico: false
            });
        } else {
            await db.query('DELETE FROM proveedores WHERE id = ?', [id]);
            return res.json({
                mensaje: 'Proveedor eliminado permanentemente (no tenía registros asociados)',
                borrado_fisico: true
            });
        }
    } catch (error) {
        console.error('Error al desactivar proveedor:', error);
        res.status(500).json({ mensaje: 'Error al procesar la eliminación del proveedor' });
    }
};

const reactivarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await db.query('UPDATE proveedores SET estado = 1 WHERE id = ?', [id]);
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
        res.json({ mensaje: 'Proveedor reactivado correctamente' });
    } catch (error) {
        console.error('Error al reactivar proveedor:', error);
        res.status(500).json({ mensaje: 'Error al reactivar el proveedor' });
    }
};

module.exports = {
    getProveedores,
    crearProveedor,
    actualizarProveedor,
    desactivarProveedor,
    reactivarProveedor
};