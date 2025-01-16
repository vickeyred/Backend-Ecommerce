const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.DB_PATH || './E_commerce.db';

function createDbConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to the database:', err.message);
        return reject(err);
      }

      console.log(`Connected to SQLite database at ${dbPath}`);

      // Enable foreign key constraints
      db.run('PRAGMA foreign_keys = ON');

      db.serialize(() => {
        // Create Users Table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
          )
        `, (err) => {
          if (err) {
            console.error('Error creating users table:', err.message);
            return reject(err);
          } else {
            console.log('Users table created or already exists.');
          }
        });

        // Create Categories Table
        db.run(`
          CREATE TABLE IF NOT EXISTS categories (
            C_id INTEGER PRIMARY KEY AUTOINCREMENT,
            C_name TEXT NOT NULL,
            date_created TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating categories table:', err.message);
            return reject(err);
          } else {
            console.log('Categories table created or already exists.');
          }
        });

        // Create Products Table
        db.run(`
          CREATE TABLE IF NOT EXISTS products (
            P_id INTEGER PRIMARY KEY AUTOINCREMENT,
            P_name TEXT NOT NULL,
            C_id INTEGER,  -- Foreign Key referencing categories
            no_of_items INTEGER,
            MRP REAL,
            discount_price REAL,
            FOREIGN KEY (C_id) REFERENCES categories(C_id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('Error creating products table:', err.message);
            return reject(err);
          } else {
            console.log('Products table created or already exists.');
          }
        });

        // Resolve after successful setup
        console.log('All tables created successfully.');
        resolve(db);
      });
    });
  });
}

module.exports = createDbConnection;
