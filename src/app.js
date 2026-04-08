const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
require('dotenv').config();

// Inicializar express
const app = express();

// =====================================
// 🛡️ SEGURIDAD BASE (Producción)
// =====================================

// 1. Helmet (Configura cabeceras seguras)
app.use(helmet());

// 2. Configuración Estricta de CORS
const dominiosPermitidos = [
    process.env.FRONTEND_URL, // Ej: https://poltand.duckdns.org
    'http://localhost:5173',  // Local de Vite (Desarrollo)
    'http://localhost:5174',  // Local de Vite (Desarrollo) alterno
    'http://127.0.0.1:5173'
].filter(Boolean); // filtra los undefined si front_url no existe

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origin (ej. postman o mobile apps locales) solo en desarrollo o para el mismo servidor
        if (!origin || dominiosPermitidos.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS: Acceso denegado a este dominio.'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true // Si vas a manejar cookies (opcional pero seguro)
}));

// 3. Limitador de peticiones Global (Anti-DDoS)
const limitadorGlobal = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite de 1000 peticiones por IP en 15 mins
    message: { mensaje: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.' }
});
app.use('/api/', limitadorGlobal); // Aplicarlo solo a nuestras rutas API

// Middlewares (Configuraciones base)
app.use(morgan('dev')); // Muestra en consola las peticiones
app.use(express.json()); // Permite recibir datos en formato JSON

// 4. Prevenir HTTP Parameter Pollution (Debe ir después del body-parser/express.json)
app.use(hpp());

// Importar la base de datos para probarla
const db = require('./config/db');

// Ruta de prueba para saber si el servidor responde
app.get('/api/test', (req, res) => {
    res.json({ mensaje: '¡El backend de Madera Poltand está funcionando a la perfección!' });
});

// =====================================
// 🛡️ SEGURIDAD EN AUTENTICACIÓN
// =====================================
// Limitador estricto para rutas de auth (Anti Fuerza-Bruta de Login)
const limitadorLogin = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos de bloqueo
    max: 10, // Bloquear después de 10 intentos fallidos/exitosos
    message: { mensaje: 'Demasiados intentos de inicio de sesión. Espere 15 minutos antes de volver a intentarlo.' }
});

//CONEXION AND LOGIN
app.use('/api/auth/login', limitadorLogin); // Protegemos específicamente el endpoint de login y registro
app.use('/api/auth', require('./routes/auth.routes'));

// Catálogos separados
app.use('/api/articulos', require('./routes/articulos.routes'));
app.use('/api/minas', require('./routes/minas.routes'));
app.use('/api/proveedores', require('./routes/proveedores.routes'));
app.use('/api/supervisores', require('./routes/supervisores.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));



// OPERACIONES
// RUTAS DE REQUERIMIENTOS (Protegidas)
app.use('/api/requerimientos', require('./routes/requerimientos.routes'));

// RUTAS DE INGRESOS (Protegidas)
app.use('/api/ingresos', require('./routes/ingresos.routes'));
// ...
// Encender el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});