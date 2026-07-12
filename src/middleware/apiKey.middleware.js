const validarApiKey = (req, res, next) => {
    // La clave esperada puede configurarse en el archivo .env, 
    // pero por si acaso, dejamos una por defecto si no está.
    const API_KEY_ESPERADA = process.env.REPORT_API_KEY || 'madera-reportes-123456';
    
    // Buscar la clave en la cabecera 'x-api-key'
    const apiKeyEnviada = req.header('x-api-key');

    if (!apiKeyEnviada) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Se requiere API Key.' });
    }

    if (apiKeyEnviada !== API_KEY_ESPERADA) {
        return res.status(403).json({ mensaje: 'API Key inválida.' });
    }

    // Si la clave es correcta, permitir que pase al controlador
    next();
};

module.exports = { validarApiKey };
