-- ==============================================================================
-- SCRIPT DE MIGRACIÓN: PRECIOS DIFERENCIADOS POR PROVEEDOR
-- Base de Datos: db_madera_poltand
-- Descripción: Crea la tabla articulo_proveedores y migra las tarifas actuales a CARBAJAL (id = 1)
-- ==============================================================================

USE db_madera_poltand;

-- 1. Crear tabla articulo_proveedores
CREATE TABLE IF NOT EXISTS articulo_proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    articulo_id INT NOT NULL,
    proveedor_id INT NOT NULL,
    precio_proveedor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_mina DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_articulo_proveedor (articulo_id, proveedor_id),
    CONSTRAINT fk_artprov_articulo FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE,
    CONSTRAINT fk_artprov_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
);

-- 2. Migrar tarifas actuales de todos los artículos asignándolos a CARBAJAL (proveedor_id = 1)
INSERT INTO articulo_proveedores (articulo_id, proveedor_id, precio_proveedor, precio_mina)
SELECT id, 1, precio_proveedor, precio_mina
FROM articulos
ON DUPLICATE KEY UPDATE 
    precio_proveedor = VALUES(precio_proveedor),
    precio_mina = VALUES(precio_mina);

-- 3. Verificación
SELECT COUNT(*) AS total_tarifas_carvajal FROM articulo_proveedores WHERE proveedor_id = 1;
