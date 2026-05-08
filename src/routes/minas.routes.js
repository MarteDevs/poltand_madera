const express = require('express');
const router = express.Router();
const minasController = require('../controllers/minas.controller');
const { verificarToken, esAdmin } = require('../middleware/auth.middleware');
const { validarCamposRequeridos, validarIdParam } = require('../middleware/validator.middleware');

// GET: Listar minas (Cualquier usuario logueado)
router.get('/', verificarToken, minasController.getMinas);

// POST: Crear mina (Solo Administradores)
router.post('/', [verificarToken, esAdmin, validarCamposRequeridos(['nombre'])], minasController.crearMina);

// PUT: Editar mina (Solo Administradores)
router.put('/:id', [verificarToken, esAdmin, validarIdParam, validarCamposRequeridos(['nombre'])], minasController.actualizarMina);

// DELETE: Desactivar mina (Solo Administradores)
router.delete('/:id', [verificarToken, esAdmin, validarIdParam], minasController.desactivarMina);

module.exports = router;