const express = require('express');
const router = express.Router();
const articulosController = require('../controllers/articulos.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const { validarCamposRequeridos, validarIdParam } = require('../middleware/validator.middleware');

const camposArticulo = ['nombre', 'precio_proveedor', 'precio_mina'];

// GET no requiere ser admin, solo estar logueado
router.get('/', verificarToken, articulosController.getArticulos);

// Precios diferenciados por proveedor (antes de /:id para evitar colisiones)
router.get('/precios-proveedores', verificarToken, articulosController.getPreciosProveedores);
router.post('/precios-proveedores', [verificarToken, esAdmin], articulosController.guardarPrecioProveedor);
router.post('/precios-proveedores/clonar', [verificarToken, esAdmin], articulosController.clonarPrecios);

// POST, PUT, DELETE requieren ser admin
router.post('/', [verificarToken, esAdmin, validarCamposRequeridos(camposArticulo)], articulosController.crearArticulo);
router.put('/:id', [verificarToken, esAdmin, validarIdParam, validarCamposRequeridos(camposArticulo)], articulosController.actualizarArticulo);
router.put('/:id/reactivar', [verificarToken, esAdmin, validarIdParam], articulosController.reactivarArticulo);
router.delete('/:id', [verificarToken, esAdmin, validarIdParam], articulosController.desactivarArticulo);

module.exports = router;