-- Esquema de base de datos para el sistema de inventario de ferretería
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS ferreteria_inventario;
USE ferreteria_inventario;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de artículos
CREATE TABLE IF NOT EXISTS articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    proveedor_id INT,
    precio_compra DECIMAL(10,2) NOT NULL CHECK (precio_compra > 0),
    precio_venta DECIMAL(10,2) NOT NULL CHECK (precio_venta > 0),
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    
    -- Validación: precio de venta debe ser mayor al precio de compra
    CONSTRAINT chk_precio_coherencia CHECK (precio_venta > precio_compra),
    
    -- Índices para mejorar rendimiento
    INDEX idx_codigo (codigo),
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria_id),
    INDEX idx_proveedor (proveedor_id),
    INDEX idx_stock_minimo (stock_actual, stock_minimo)
);

-- Tabla de movimientos de inventario (para auditoría)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    articulo_id INT NOT NULL,
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    motivo VARCHAR(255),
    usuario VARCHAR(100),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE,
    INDEX idx_articulo_fecha (articulo_id, fecha_movimiento)
);

-- Insertar datos de prueba
INSERT INTO categorias (nombre, descripcion) VALUES 
('Herramientas Manuales', 'Martillos, destornilladores, llaves, etc.'),
('Ferretería General', 'Tornillos, tuercas, clavos, etc.'),
('Electricidad', 'Cables, interruptores, enchufes, etc.'),
('Plomería', 'Tuberías, llaves, accesorios de baño, etc.'),
('Pintura', 'Pinturas, brochas, rodillos, etc.');

INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES 
('Distribuidora Central', 'Juan Pérez', '555-0101', 'ventas@distcentral.com', 'Av. Industrial 123'),
('Ferretería Mayorista', 'María García', '555-0102', 'pedidos@ferremayorista.com', 'Calle Comercio 456'),
('Suministros Técnicos', 'Carlos López', '555-0103', 'info@sumtecnicos.com', 'Zona Industrial Norte');

INSERT INTO articulos (codigo, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock_actual, stock_minimo) VALUES 
('MART001', 'Martillo de Carpintero 16oz', 'Martillo con mango de madera, cabeza de acero', 1, 1, 15.50, 25.00, 50, 10),
('TORN001', 'Tornillo Autorroscante 1/4"', 'Tornillo autorroscante galvanizado', 2, 2, 0.15, 0.30, 1000, 100),
('CABL001', 'Cable Eléctrico 12 AWG', 'Cable de cobre para instalaciones eléctricas', 3, 3, 2.50, 4.00, 200, 50),
('TUBE001', 'Tubería PVC 1/2"', 'Tubería de PVC para agua fría', 4, 1, 3.20, 5.50, 80, 20),
('PINT001', 'Pintura Látex Blanco 1 Galón', 'Pintura látex para interiores', 5, 2, 18.00, 32.00, 25, 5);
