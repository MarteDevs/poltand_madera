const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedores.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, proveedoresController.getProveedores);
router.post('/', [verificarToken, esAdmin], proveedoresController.crearProveedor);
router.put('/:id', [verificarToken, esAdmin], proveedoresController.actualizarProveedor);
router.delete('/:id', [verificarToken, esAdmin], proveedoresController.desactivarProveedor);

module.exports = router;