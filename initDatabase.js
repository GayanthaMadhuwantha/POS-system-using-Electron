const sqlite3 = require('sqlite3').verbose();

// Create a new database file or open the existing one
let db = new sqlite3.Database('./restaurant.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the restaurant database.');
});

// Create a table for food items
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    cash REAL NOT NULL,
    balance REAL NOT NULL,
    order_time TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_details (
    id INTEGER,
    item_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_name TEXT NOT NULL,
    mobile_number INTEGER NOT NULL,
    address TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_name TEXT NOT NULL,
    category_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    retail_price REAL NOT NULL,
    wholesale_price REAL NOT NULL,
    discount REAL NOT NULL,
    custom_id TEXT
  )`);

  // Insert sample data
  db.run(`INSERT INTO food_items(name, price) VALUES('Burger', 5.99)`);
  db.run(`INSERT INTO food_items(name, price) VALUES('Pizza', 8.99)`);
  db.run(`INSERT INTO food_items(name, price) VALUES('Salad', 4.99)`);
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Close the database connection.');
});
