const express = require('express');
const router = express.Router();
const viajesController = require('../controllers/viajes.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const { validarCamposRequeridos, validarIdParam } = require('../middleware/validator.middleware');

router.get('/', verificarToken, viajesController.getViajes);
router.post('/', [verificarToken, esAdmin, validarCamposRequeridos(['nombre'])], viajesController.crearViaje);
router.put('/:id/reactivar', [verificarToken, esAdmin, validarIdParam], viajesController.reactivarViaje);
router.put('/:id', [verificarToken, esAdmin, validarIdParam, validarCamposRequeridos(['nombre'])], viajesController.actualizarViaje);
router.delete('/:id', [verificarToken, esAdmin, validarIdParam], viajesController.desactivarViaje);

module.exports = router;
