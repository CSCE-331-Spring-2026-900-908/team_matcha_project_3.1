DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS orders_today;

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
    image_url VARCHAR(255)
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
    topping VARCHAR(50),
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