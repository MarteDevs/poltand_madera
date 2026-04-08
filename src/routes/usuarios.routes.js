const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');

// Todas las rutas de usuarios requieren ser Admin o SuperAdmin
router.use(verificarToken, esAdmin);

router.get('/', usuariosController.getUsuarios);
router.post('/', usuariosController.crearUsuario);
router.put('/:id', usuariosController.actualizarUsuario);
router.delete('/:id', usuariosController.eliminarUsuario);

module.exports = router;
