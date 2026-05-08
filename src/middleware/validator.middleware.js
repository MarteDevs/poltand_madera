/**
 * Middleware para validación de datos de entrada
 */

/**
 * Valida que los campos requeridos estén presentes en el body
 * @param {string[]} campos 
 */
const validarCamposRequeridos = (campos) => (req, res, next) => {
    const faltantes = campos.filter(c => req.body[c] === undefined || req.body[c] === null || req.body[c] === '');
    
    if (faltantes.length > 0) {
        return res.status(400).json({
            mensaje: `Faltan campos obligatorios: ${faltantes.join(', ')}`
        });
    }
    next();
};

/**
 * Valida que el parámetro ID sea un número entero positivo
 */
const validarIdParam = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ mensaje: 'ID de recurso no válido' });
    }
    req.params.id = id; // Guardar como número
    next();
};

module.exports = {
    validarCamposRequeridos,
    validarIdParam
};
