const express = require('express');
const router = express.Router();
const articulosController = require('../controllers/articulos.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const { validarCamposRequeridos, validarIdParam } = require('../middleware/validator.middleware');

const camposArticulo = ['nombre', 'precio_proveedor', 'precio_mina'];

// GET no requiere ser admin, solo estar logueado
router.get('/', verificarToken, articulosController.getArticulos);

// POST, PUT, DELETE requieren ser admin
router.post('/', [verificarToken, esAdmin, validarCamposRequeridos(camposArticulo)], articulosController.crearArticulo);
router.put('/:id', [verificarToken, esAdmin, validarIdParam, validarCamposRequeridos(camposArticulo)], articulosController.actualizarArticulo);
router.delete('/:id', [verificarToken, esAdmin, validarIdParam], articulosController.desactivarArticulo);

module.exports = router;