const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedores.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const { validarCamposRequeridos, validarIdParam } = require('../middleware/validator.middleware');

router.get('/', verificarToken, proveedoresController.getProveedores);
router.post('/', [verificarToken, esAdmin, validarCamposRequeridos(['nombre'])], proveedoresController.crearProveedor);
router.put('/:id', [verificarToken, esAdmin, validarIdParam, validarCamposRequeridos(['nombre'])], proveedoresController.actualizarProveedor);
router.delete('/:id', [verificarToken, esAdmin, validarIdParam], proveedoresController.desactivarProveedor);

module.exports = router;