const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Buscar al usuario en la base de datos
        const [rows] = await db.query(
            'SELECT * FROM usuarios WHERE username = ? AND estado = 1',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado o inactivo' });
        }

        const usuario = rows[0];

        // 2. Verificar la contraseña con bcrypt
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        // 3. Generar el Token JWT (El "Pase VIP")
        // Guardamos el id y el rol dentro del token para no consultar la BD en cada clic
        const payload = {
            id: usuario.id,
            rol_id: usuario.rol_id,
            username: usuario.username
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        // 4. Enviar respuesta exitosa al Frontend (Vue)
        res.json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol_id: usuario.rol_id
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = {
    login
};