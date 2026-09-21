const articulosService = require('../services/articulos.service');

const getArticulos = async (req, res, next) => {
    try {
        const { proveedor_id } = req.query;
        const rows = await articulosService.getAll(proveedor_id);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const getPreciosProveedores = async (req, res, next) => {
    try {
        const { proveedor_id } = req.query;
        const rows = await articulosService.getPreciosProveedores(proveedor_id);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const guardarPrecioProveedor = async (req, res, next) => {
    try {
        const { articulo_id, proveedor_id, precio_proveedor, precio_mina } = req.body;

        if (!articulo_id || !proveedor_id) {
            return res.status(400).json({ mensaje: 'articulo_id y proveedor_id son obligatorios' });
        }
        if (precio_proveedor === undefined || precio_proveedor === null || precio_mina === undefined || precio_mina === null) {
            return res.status(400).json({ mensaje: 'precio_proveedor y precio_mina son obligatorios' });
        }

        await articulosService.guardarPrecioProveedor({
            articulo_id,
            proveedor_id,
            precio_proveedor,
            precio_mina
        });

        res.json({ mensaje: 'Precio por proveedor guardado correctamente' });
    } catch (error) {
        next(error);
    }
};

const clonarPrecios = async (req, res, next) => {
    try {
        const { origen_proveedor_id, destino_proveedor_id } = req.body;

        if (!origen_proveedor_id || !destino_proveedor_id) {
            return res.status(400).json({ mensaje: 'origen_proveedor_id y destino_proveedor_id son obligatorios' });
        }

        if (Number(origen_proveedor_id) === Number(destino_proveedor_id)) {
            return res.status(400).json({ mensaje: 'El proveedor origen y destino no pueden ser el mismo' });
        }

        await articulosService.clonarPrecios({
            origen_proveedor_id,
            destino_proveedor_id
        });

        res.json({ mensaje: 'Precios clonados exitosamente' });
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

module.exports = {
    getArticulos,
    getPreciosProveedores,
    guardarPrecioProveedor,
    clonarPrecios,
    crearArticulo,
    actualizarArticulo,
    desactivarArticulo
};