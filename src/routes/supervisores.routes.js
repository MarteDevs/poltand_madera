const express = require('express');
const router = express.Router();
const supervisoresController = require('../controllers/supervisores.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, supervisoresController.getSupervisores);
router.post('/', [verificarToken, esAdmin], supervisoresController.crearSupervisor);
router.put('/:id', [verificarToken, esAdmin], supervisoresController.actualizarSupervisor);
router.delete('/:id', [verificarToken, esAdmin], supervisoresController.desactivarSupervisor);

module.exports = router;