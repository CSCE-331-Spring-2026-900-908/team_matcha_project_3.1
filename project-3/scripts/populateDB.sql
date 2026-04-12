\copy inventory FROM 'inventory.csv' DELIMITER ',' CSV HEADER
\copy menu FROM 'menu.csv' DELIMITER ',' CSV HEADER
\copy employees FROM 'employee.csv' DELIMITER ',' CSV HEADER
\copy orders FROM 'order.csv' DELIMITER ',' CSV HEADER
\copy order_items FROM 'order_history.csv' DELIMITER ',' CSV HEADER
\copy menu_items FROM 'menu_item.csv' DELIMITER ',' CSV HEADER