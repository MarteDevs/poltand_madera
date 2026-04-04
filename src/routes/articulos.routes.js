const express = require('express');
const router = express.Router();
const articulosController = require('../controllers/articulos.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

// GET no requiere ser admin, solo estar logueado
router.get('/', verificarToken, articulosController.getArticulos);

// POST, PUT, DELETE requieren ser admin
router.post('/', [verificarToken, esAdmin], articulosController.crearArticulo);
router.put('/:id', [verificarToken, esAdmin], articulosController.actualizarArticulo);
router.delete('/:id', [verificarToken, esAdmin], articulosController.desactivarArticulo);

module.exports = router;