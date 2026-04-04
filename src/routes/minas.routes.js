const express = require('express');
const router = express.Router();
const minasController = require('../controllers/minas.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

// GET: Listar minas (Cualquier usuario logueado)
router.get('/', verificarToken, minasController.getMinas);

// POST: Crear mina (Solo Administradores)
router.post('/', [verificarToken, esAdmin], minasController.crearMina);

// PUT: Editar mina (Solo Administradores)
router.put('/:id', [verificarToken, esAdmin], minasController.actualizarMina);

// DELETE: Desactivar mina (Solo Administradores)
router.delete('/:id', [verificarToken, esAdmin], minasController.desactivarMina);

module.exports = router;