const express = require('express');
const router = express.Router();
const supervisoresController = require('../controllers/supervisores.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const { validarCamposRequeridos, validarIdParam } = require('../middleware/validator.middleware');

router.get('/', verificarToken, supervisoresController.getSupervisores);
router.post('/', [verificarToken, esAdmin, validarCamposRequeridos(['nombre'])], supervisoresController.crearSupervisor);
router.put('/:id', [verificarToken, esAdmin, validarIdParam, validarCamposRequeridos(['nombre'])], supervisoresController.actualizarSupervisor);
router.delete('/:id', [verificarToken, esAdmin, validarIdParam], supervisoresController.desactivarSupervisor);

module.exports = router;