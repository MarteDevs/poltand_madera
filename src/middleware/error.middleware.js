/**
 * Middleware centralizado de manejo de errores
 */
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
        ip: req.ip,
        stack: err.stack
    });
    // Si ya se envió una respuesta, pasar al siguiente middleware
    if (res.headersSent) {
        return next(err);
    }

    // Errores específicos de CORS
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({ 
            mensaje: 'Bloqueado por CORS: Acceso denegado desde este dominio.' 
        });
    }

    // Error de límite de peticiones (express-rate-limit)
    if (err.statusCode === 429) {
        return res.status(429).json({
            mensaje: err.message || 'Demasiadas peticiones, intente más tarde.'
        });
    }

    // Error por defecto (500)
    const statusCode = err.statusCode || 500;
    const mensaje = statusCode === 500 ? 'Error interno del servidor' : err.message;

    res.status(statusCode).json({
        mensaje: mensaje,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = {
    errorHandler
};
