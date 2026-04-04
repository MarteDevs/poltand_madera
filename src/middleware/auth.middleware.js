const jwt = require('jsonwebtoken');

// Middleware para verificar que el usuario tenga un token válido
const verificarToken = (req, res, next) => {
    // Vue enviará el token en la cabecera: "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ mensaje: 'Se requiere un token de autenticación' });
    }

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado; // Guardamos los datos del usuario para usarlos en la ruta
        next(); // ¡Puede pasar!
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

// Middleware para verificar si es SUPERADMIN (rol_id = 1) o ADMIN (rol_id = 2)
const esAdmin = (req, res, next) => {
    if (req.usuario.rol_id === 1 || req.usuario.rol_id === 2) {
        next();
    } else {
        return res.status(403).json({ mensaje: 'Acceso denegado: Se requieren permisos de Administrador' });
    }
};

module.exports = {
    verificarToken,
    esAdmin
};