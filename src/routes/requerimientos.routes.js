const express = require('express');
const router = express.Router();
const requerimientosController = require('../controllers/requerimientos.controller');

const { verificarToken, esAdmin } = require('../middleware/auth.middleware');

// POST: Crear un nuevo requerimiento
router.post('/', [verificarToken, esAdmin], requerimientosController.crearRequerimiento);

// GET: Obtener historial de requerimientos
router.get('/historial', verificarToken, requerimientosController.getHistorial);

// GET: Obtener historial detallado de todos los requerimientos
router.get('/historial/detallado', verificarToken, requerimientosController.getHistorialDetallado);

// GET: Obtener detalles de un requerimiento específico
router.get('/:id/detalles', verificarToken, requerimientosController.getDetalles);

// PUT: Actualizar un requerimiento existente
router.put('/:id', [verificarToken, esAdmin], requerimientosController.actualizarRequerimiento);

// DELETE: Eliminar un requerimiento
router.delete('/:id', [verificarToken, esAdmin], requerimientosController.eliminarRequerimiento);

module.exports = router;