DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS orders_today;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    userID SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'admin', 'employee', 'customer'
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed users for testing (Password is same as email for placeholder simplicity)
INSERT INTO users (name, email, password, role) VALUES 
('Manager User', 'admin@matcha.com', 'admin123', 'admin'),
('Employee User', 'staff@matcha.com', 'staff123', 'employee'),
('Test Customer', 'customer@test.com', 'customer123', 'customer');

CREATE TABLE inventory (
    inventoryID SERIAL PRIMARY KEY, 
    name VARCHAR(100), 
    cost DECIMAL(10,2), 
    inventoryNum INT, 
    useAverage INT
);

CREATE TABLE menu (
    menuID SERIAL PRIMARY KEY, 
    name VARCHAR(100), 
    cost DECIMAL(10,2), 
    salesNum INT,
    image_url TEXT
);

CREATE TABLE employees (
    employeeID SERIAL PRIMARY KEY, 
    name VARCHAR(100), 
    pay DECIMAL(10,2), 
    job VARCHAR(50), 
    orderNum INT
);

CREATE TABLE orders (
    orderID SERIAL PRIMARY KEY, 
    customerName VARCHAR(100), 
    costTotal DECIMAL(10,2), 
    employeeID INT, 
    orderDateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    ID SERIAL PRIMARY KEY,
    menuID INT,
    orderID INT,
    quantity INT,
    iceLevel VARCHAR(20),
    sugarLevel VARCHAR(20),
    topping TEXT,
    cost DECIMAL(10,2)
);

CREATE TABLE menu_items (
    ID SERIAL PRIMARY KEY,
    inventoryID INT,
    menuID INT,
    itemQuantity INT
);

CREATE TABLE orders_today (
    id SERIAL PRIMARY KEY,
    sales DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
