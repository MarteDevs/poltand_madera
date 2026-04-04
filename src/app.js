const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Inicializar express
const app = express();

// Middlewares (Configuraciones base)
app.use(cors()); // Permite que Vue.js se conecte sin bloqueos
app.use(morgan('dev')); // Muestra en consola las peticiones (Ej: GET /api/test 200)
app.use(express.json()); // Permite recibir datos en formato JSON (como tu arreglo temporal de maderas)

// Importar la base de datos para probarla
const db = require('./config/db');

// Ruta de prueba para saber si el servidor responde
app.get('/api/test', (req, res) => {
    res.json({ mensaje: '¡El backend de Madera Poltand está funcionando a la perfección!' });
});

//CONEXION AND LOGIN
app.use('/api/auth', require('./routes/auth.routes'));



// Catálogos separados
app.use('/api/articulos', require('./routes/articulos.routes'));
app.use('/api/minas', require('./routes/minas.routes'));
app.use('/api/proveedores', require('./routes/proveedores.routes'));
app.use('/api/supervisores', require('./routes/supervisores.routes'));



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