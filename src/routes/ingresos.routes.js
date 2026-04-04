const express = require('express');
const router = express.Router();
const ingresosController = require('../controllers/ingresos.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');

// GET: Obtener lista de todo lo que falta por entregar
router.get('/pendientes', verificarToken, ingresosController.getRequerimientosPendientes);

// POST: Registrar un camión/viaje con sus entregas
router.post('/', [verificarToken, esAdmin], ingresosController.crearIngreso);

module.exports = router;