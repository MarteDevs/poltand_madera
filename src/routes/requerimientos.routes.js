const express = require('express');
const router = express.Router();
const requerimientosController = require('../controllers/requerimientos.controller');

const { verificarToken, esAdmin } = require('../middleware/auth.middleware')

// POST: Crear un nuevo requerimiento
// Protegido: Solo usuarios logueados que además sean Admin/Superadmin
router.post('/', [verificarToken, esAdmin], requerimientosController.crearRequerimiento);

module.exports = router;