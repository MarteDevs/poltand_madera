const express = require('express');
const router = express.Router();
const ingresosController = require('../controllers/ingresos.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');

// GET: Historial de todos los ingresos registrados
router.get('/', verificarToken, ingresosController.getHistorialIngresos);

// GET: Historial completo y detallado para exportación a Excel
router.get('/exportar/detallado', verificarToken, ingresosController.getHistorialIngresosDetallado);

// GET: Obtener lista de todo lo que falta por entregar
router.get('/pendientes', verificarToken, ingresosController.getRequerimientosPendientes);

// GET: Detalle de un ingreso específico (qué artículos llegaron en ese viaje)
router.get('/:id/detalle', verificarToken, ingresosController.getDetalleIngreso);

// POST: Registrar un camión/viaje con sus entregas
router.post('/', [verificarToken, esAdmin], ingresosController.crearIngreso);

// PUT: Actualizar/Editar un ingreso existente
router.put('/:id', [verificarToken, esAdmin], ingresosController.actualizarIngreso);

// DELETE: Eliminar un ingreso
router.delete('/:id', [verificarToken, esAdmin], ingresosController.eliminarIngreso);

module.exports = router;