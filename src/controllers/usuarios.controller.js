const db = require('../config/db');
const bcrypt = require('bcrypt');

const getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, nombre, username, rol_id, estado
            FROM usuarios 
            WHERE estado = 1 
            ORDER BY id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const { nombre, username, password, rol_id } = req.body;

        if (!nombre || !username || !password || !rol_id) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        // Verificar si el usuario ya existe
        const [existentes] = await db.query('SELECT id FROM usuarios WHERE username = ?', [username]);
        if (existentes.length > 0) {
            return res.status(400).json({ mensaje: 'El nombre de usuario (username) ya está en uso' });
        }

        // Encriptar la contraseña (saltrounds = 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [resultado] = await db.query(
            'INSERT INTO usuarios (nombre, username, password, rol_id, estado) VALUES (?, ?, ?, ?, 1)',
            [nombre, username, hashedPassword, rol_id]
        );

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            id: resultado.insertId
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ mensaje: 'Error al crear usuario' });
    }
};

const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, username, rol_id, password } = req.body;

        if (!nombre || !username || !rol_id) {
            return res.status(400).json({ mensaje: 'El nombre, username y rol son obligatorios' });
        }

        // Verificar si el nuevo username choca con el de otro usuario
        const [existentes] = await db.query('SELECT id FROM usuarios WHERE username = ? AND id != ?', [username, id]);
        if (existentes.length > 0) {
            return res.status(400).json({ mensaje: 'El nombre de usuario (username) ya está siendo usado por otra persona' });
        }

        let query = 'UPDATE usuarios SET nombre = ?, username = ?, rol_id = ?';
        let params = [nombre, username, rol_id];

        // Si mandaron contraseña, la encriptamos y la actualizamos también
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        const [resultado] = await db.query(query, params);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ mensaje: 'Error al actualizar usuario' });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que no se borre a sí mismo
        if (req.usuario.id == id) {
            return res.status(400).json({ mensaje: 'No puedes borrar tu propia cuenta' });
        }

        // Borrado lógico
        const [resultado] = await db.query('UPDATE usuarios SET estado = 0 WHERE id = ?', [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ mensaje: 'Error al eliminar usuario' });
    }
};

module.exports = {
    getUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};
