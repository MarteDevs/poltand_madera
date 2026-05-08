const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const { validarCamposRequeridos, validarIdParam } = require('../middleware/validator.middleware');

const camposUsuario = ['nombre', 'username', 'rol_id'];

router.get('/', [verificarToken, esAdmin], usuariosController.getUsuarios);
router.post('/', [verificarToken, esAdmin, validarCamposRequeridos([...camposUsuario, 'password'])], usuariosController.crearUsuario);
router.put('/:id', [verificarToken, esAdmin, validarIdParam, validarCamposRequeridos(camposUsuario)], usuariosController.actualizarUsuario);
router.delete('/:id', [verificarToken, esAdmin, validarIdParam], usuariosController.eliminarUsuario);

module.exports = router;
