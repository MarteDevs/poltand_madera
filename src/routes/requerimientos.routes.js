const express = require('express');
const router = express.Router();
const requerimientosController = require('../controllers/requerimientos.controller');

const { verificarToken, esAdmin } = require('../middleware/auth.middleware')

// POST: Crear un nuevo requerimiento
// Protegido: Solo usuarios logueados que además sean Admin/Superadmin
router.post('/', [verificarToken, esAdmin], requerimientosController.crearRequerimiento);

// GET: Obtener historial de requerimientos
router.get('/historial', verificarToken, requerimientosController.getHistorial);

// GET: Obtener historial detallado de todos los requerimientos
router.get('/historial/detallado', verificarToken, requerimientosController.getHistorialDetallado);

// GET: Obtener detalles de un requerimiento específico
router.get('/:id/detalles', verificarToken, requerimientosController.getDetalles);

module.exports = router;