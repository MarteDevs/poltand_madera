const articulosService = require('../services/articulos.service');

const getArticulos = async (req, res, next) => {
    try {
        const rows = await articulosService.getAll();
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const crearArticulo = async (req, res, next) => {
    try {
        const { codigo, nombre, precio_proveedor, precio_mina } = req.body;
        const id = await articulosService.create({ codigo, nombre, precio_proveedor, precio_mina });
        res.status(201).json({ mensaje: 'Artículo creado', id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ mensaje: 'El código de artículo ya existe' });
        }
        next(error);
    }
};

const actualizarArticulo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { codigo, nombre, precio_proveedor, precio_mina } = req.body;
        await articulosService.update(id, { codigo, nombre, precio_proveedor, precio_mina });
        res.json({ mensaje: 'Artículo actualizado' });
    } catch (error) {
        next(error);
    }
};

const desactivarArticulo = async (req, res, next) => {
    try {
        const { id } = req.params;
        await articulosService.softDelete(id);
        res.json({ mensaje: 'Artículo desactivado' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getArticulos, crearArticulo, actualizarArticulo, desactivarArticulo };