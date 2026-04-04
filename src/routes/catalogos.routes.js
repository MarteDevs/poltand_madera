const express = require('express');
const router = express.Router();
const catalogosController = require('../controllers/catalogos.controller');

// Importamos el guardián de seguridad
const { verificarToken } = require('../middleware/auth.middleware')

// Todas estas rutas exigirán el Token JWT (verificarToken)
router.get('/minas', verificarToken, catalogosController.getMinas);
router.get('/proveedores', verificarToken, catalogosController.getProveedores);
router.get('/articulos', verificarToken, catalogosController.getArticulos);
router.get('/supervisores', verificarToken, catalogosController.getSupervisores);

module.exports = router;