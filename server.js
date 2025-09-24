import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import multer from "multer";

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:8081"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // or higher if needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// ✅ Import backup route here
app.post("/api/backup/import", upload.single("backup"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const dbPath = path.join(process.cwd(), "database.sqlite");
    fs.copyFileSync(req.file.path, dbPath);
    fs.unlinkSync(req.file.path);

    res.json({ message: "Backup imported successfully. Please restart the server." });
  } catch (err) {
    console.error("❌ Backup import error:", err);
    res.status(500).json({ message: "Failed to import backup" });
  }
});


let db;

// Helper to add missing columns safely
async function ensureColumn(table, name, ddl, fallbackValue = null) {
  try {
    const cols = await db.all(`PRAGMA table_info(${table});`);
    const found = cols.some((c) => c.name === name);
    if (!found) {
      console.log(`⏳ Adding missing column '${name}' to table '${table}'...`);
      await db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${ddl};`);
      if (fallbackValue !== null) {
        await db.run(`UPDATE ${table} SET ${name} = ?`, [fallbackValue]);
      }
      console.log(`✅ Column '${name}' added successfully.`);
    }
  } catch (err) {
    console.error(`❌ Failed to add column '${name}' to table '${table}':`, err);
  }
}

// Function to initialize the database and tables
async function initDb() {
  try {



   // Orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_email TEXT,
      client_phone TEXT,
      wilaya TEXT,
      address TEXT,
      notes TEXT,
      payment_method TEXT DEFAULT 'cod',
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Order items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      quantity INTEGER DEFAULT 1,
      price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
  `);

    // Website settings table
await db.exec(`
  CREATE TABLE IF NOT EXISTS website_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name_fr TEXT DEFAULT 'Mon Site',
    site_name_ar TEXT DEFAULT 'موقعي',
    description_fr TEXT DEFAULT 'Description du site web',
    description_ar TEXT DEFAULT 'وصف الموقع الإلكتروني',
    logo_url TEXT,
    favicon_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert default settings if not exists
const settingsExist = await db.get('SELECT * FROM website_settings WHERE id = 1');
if (!settingsExist) {
  await db.run(`
    INSERT INTO website_settings (site_name_fr, site_name_ar, description_fr, description_ar)
    VALUES ('Mon Site', 'موقعي', 'Description du site web', 'وصف الموقع الإلكتروني')
  `);
}

    // Add the new contacts table
await db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    facebook TEXT,
    instagram TEXT,
    tiktok TEXT,
    viber TEXT,
    mapUrl TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

    // Category Products table (for products within specific categories)
await db.exec(`
  CREATE TABLE IF NOT EXISTS category_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    product_id INTEGER,
    name TEXT NOT NULL,
    nameFr TEXT,
    nameAr TEXT,
    description TEXT,
    descriptionFr TEXT,
    descriptionAr TEXT,
    selling_price REAL DEFAULT 0,
    quality INTEGER DEFAULT 5,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);
    // create categories table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nameFr TEXT UNIQUE NOT NULL,
        nameAr TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await ensureColumn('categories', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await ensureColumn('categories', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    // Products table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        barcode TEXT UNIQUE,
        brand TEXT,
        category TEXT,
        buying_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        margin_percent REAL DEFAULT 0,
        initial_quantity INTEGER DEFAULT 0,
        current_quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        supplier INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(supplier) REFERENCES suppliers(id)
      )
    `);
    // add category_id column to products if missing (keeps compatibility with existing `category` TEXT)
    await ensureColumn('products', 'category_id', 'INTEGER', null);

   // Add this after your existing table creation code
await db.exec(`
  CREATE TABLE IF NOT EXISTS special_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    nameFr TEXT,
    nameAr TEXT,
    description TEXT,
    descriptionFr TEXT,
    descriptionAr TEXT,
    end_time TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    products_count INTEGER DEFAULT 0,
    quality INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Update the special_offer_products table to match frontend expectations
await db.exec(`
  CREATE TABLE IF NOT EXISTS special_offer_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    offer_price REAL DEFAULT 0,
    descriptionFr TEXT,
    descriptionAr TEXT,
    quality INTEGER DEFAULT 5,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(offer_id) REFERENCES special_offers(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

// Ensure all columns exist
await ensureColumn('special_offers', 'name', 'TEXT');
await ensureColumn('special_offers', 'nameFr', 'TEXT');
await ensureColumn('special_offers', 'nameAr', 'TEXT');
await ensureColumn('special_offers', 'description', 'TEXT');
await ensureColumn('special_offers', 'descriptionFr', 'TEXT');
await ensureColumn('special_offers', 'descriptionAr', 'TEXT');
await ensureColumn('special_offers', 'end_time', 'TEXT');
await ensureColumn('special_offers', 'is_active', 'BOOLEAN DEFAULT TRUE');
await ensureColumn('special_offers', 'products_count', 'INTEGER DEFAULT 0');
await ensureColumn('special_offers', 'quality', 'INTEGER DEFAULT 5');
await ensureColumn('special_offers', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
await ensureColumn('special_offers', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
await ensureColumn('special_offer_products', 'offer_price', 'REAL DEFAULT 0');
await ensureColumn('special_offer_products', 'image', 'TEXT');
await ensureColumn('special_offer_products', 'descriptionFr', 'TEXT');
await ensureColumn('special_offer_products', 'descriptionAr', 'TEXT');
await ensureColumn('special_offer_products', 'quality', 'INTEGER DEFAULT 5');
    // Users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);
    await ensureColumn("users", "username", "TEXT", "admin");

    // Insert default admin
    const admin = await db.get(
      'SELECT * FROM users WHERE email = ?',
      'admin@Nasser.com'
    );
    if (!admin) {
      await db.run(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        ['admin@Nasser.com', 'admin123', 'admin']
      );
      console.log('✅ Admin user created: admin@Nasser.com / admin123');
    }

    // Employees table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL,
        salary REAL DEFAULT 0,
        hireDate TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        address TEXT,
        username TEXT UNIQUE,
        password TEXT,
        hasAccount BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employee Payments table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS employee_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Suppliers table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table (New)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoices table (for purchase orders and sales)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'purchase' or 'sale'
        supplierId INTEGER, -- For purchase invoices
        clientId INTEGER, 
        client_name TEXT,
        total REAL NOT NULL,
        amount_paid REAL DEFAULT 0,
        status TEXT DEFAULT 'pending', -- New column: 'paid', 'pending', 'partial'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdBy INTEGER,
        FOREIGN KEY(supplierId) REFERENCES suppliers(id),
        FOREIGN KEY(clientId) REFERENCES customers(id),
        FOREIGN KEY(createdBy) REFERENCES users(id)
      )
    `);
    await ensureColumn('invoices', 'client_name', 'TEXT');
    await ensureColumn("invoices", "createdByType", "TEXT", "admin"); 

    // Invoice items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        barcode TEXT,
        purchase_price REAL DEFAULT 0,
        margin_percent REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        total REAL DEFAULT 0,
        FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )
    `);

    // Reports table (New)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        period_start TEXT,
        period_end TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL, -- 'completed', 'processing', 'error'
        size TEXT,
        creator TEXT
      )
    `);

    // Events table (New)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        allDay BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Database initialized and tables checked.");

  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    process.exit(1);
  }
}

// Init database and start the server
(async () => {
  try {
    const dbDir = process.cwd();
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir);
    }
    const dbPath = path.join(dbDir, 'database.sqlite');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    
    await initDb();
    
    // Add other routes here...
    
  } catch (err) {
    console.error('❌ Failed to open database or initialize:', err);
  }
})();

// allow frontend to load uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Login (Admin by email, Worker by username)
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    let user;

    if (!login || !password) {
      return res.status(400).json({ message: "Login and password are required" });
    }

    if (login.includes("@")) {
      // 🔑 Admin login via email
      user = await db.get(
        "SELECT id, username, email, role FROM users WHERE email = ? AND password = ?",
        [login, password]
      );

      if (!user) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      return res.json({
  message: "Admin login successful",
  user: {
    id: user.id,
    username: user.username || "admin",
    email: user.email,
    role: "admin"
  }
});

    } else {
      // 👷 Worker login via username
      user = await db.get(
        "SELECT id, username, role FROM employees WHERE username = ? AND password = ?",
        [login, password]
      );

      if (!user) {
        return res.status(401).json({ message: "Invalid worker credentials" });
      }

     return res.json({
  message: "Worker login successful",
  user: {
    id: user.id,
    username: user.username,
    role: "employee"
  }
});

    }
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// 🗑️ Delete an invoice
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First delete related invoice items (if you have a linked table)
    await db.run(`DELETE FROM invoice_items WHERE invoice_id = ?`, [id]);

    // Then delete the invoice itself
    const result = await db.run(`DELETE FROM invoices WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
});

// Dashboard Stats Route (NEW)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // 1. Fetch general statistics
    const [
      totalProducts,
      lowStockCount,
      totalEmployees,
      totalSuppliers,
      totalCustomers
    ] = await Promise.all([
      db.get('SELECT COUNT(*) AS count FROM products'),
      db.get('SELECT COUNT(*) AS count FROM products WHERE current_quantity <= min_quantity'),
      db.get('SELECT COUNT(*) AS count FROM employees'),
      db.get('SELECT COUNT(*) AS count FROM suppliers'),
      db.get('SELECT COUNT(*) AS count FROM customers'),
    ]);

    // 2. Fetch sales and purchases for the current month
    const [
      totalSalesMonth,
      salesCountMonth,
      totalPurchasesMonth,
      purchasesCountMonth,
      profitMonth
    ] = await Promise.all([
      db.get(`SELECT COALESCE(SUM(total), 0) AS sum FROM invoices WHERE type = 'sale' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`),
      db.get(`SELECT COUNT(*) AS count FROM invoices WHERE type = 'sale' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`),
      db.get(`SELECT COALESCE(SUM(total), 0) AS sum FROM invoices WHERE type = 'purchase' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`),
      db.get(`SELECT COUNT(*) AS count FROM invoices WHERE type = 'purchase' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`),
      db.get(`
        SELECT (
          (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE type = 'sale' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) -
          (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE type = 'purchase' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now'))
        ) AS profit
      `),
    ]);
    
    // 3. Fetch recent activity (last 5 sales and 5 purchases)
    const recentActivity = await db.all(`
      SELECT 
        id, 
        type, 
        total, 
        createdBy,
        created_at,
        CASE
          WHEN type = 'sale' THEN 'Vente #' || id
          WHEN type = 'purchase' THEN 'Achat #' || id
        END AS description
      FROM invoices
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      generalStats: {
        totalProducts: totalProducts.count,
        lowStockCount: lowStockCount.count,
        totalEmployees: totalEmployees.count,
        totalSuppliers: totalSuppliers.count,
        totalCustomers: totalCustomers.count,
      },
      todayStats: {
        totalSales: totalSalesMonth.sum,
        salesCount: salesCountMonth.count,
        totalPurchases: totalPurchasesMonth.sum,
        purchasesCount: purchasesCountMonth.count,
        profit: profitMonth.profit,
      },
      recentActivity: recentActivity,
    });
  } catch (err) {
    console.error('❌ Fetch dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db.all(`
      SELECT 
        e.*,
        p.amount AS lastPaymentAmount,
        p.date AS lastPaymentDate,
        p.type AS lastPaymentType
      FROM employees e
      LEFT JOIN (
        SELECT 
          employee_id, 
          amount, 
          date, 
          type,
          ROW_NUMBER() OVER(PARTITION BY employee_id ORDER BY date DESC) as rn
        FROM employee_payments
      ) p ON p.employee_id = e.id AND p.rn = 1
      ORDER BY e.created_at DESC
    `);
    
    const formattedEmployees = employees.map(emp => {
      const formattedEmp = { ...emp };
      if (emp.lastPaymentAmount !== null) {
        formattedEmp.lastPayment = {
          amount: emp.lastPaymentAmount,
          date: emp.lastPaymentDate,
          type: emp.lastPaymentType,
        };
      } else {
        formattedEmp.lastPayment = null;
      }
      delete formattedEmp.lastPaymentAmount;
      delete formattedEmp.lastPaymentDate;
      delete formattedEmp.lastPaymentType;
      return formattedEmp;
    });

    res.json(formattedEmployees);
  } catch (err) {
    console.error('❌ Fetch employees error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/employees', async (req, res) => {
  const { name, phone, role, salary, address, username, password, hasAccount } = req.body;
  if (!name || !role || !salary) {
    return res.status(400).json({ message: 'Name, role, and salary are required' });
  }
  try {
    const result = await db.run(
      `INSERT INTO employees (name, phone, role, salary, address, username, password, hireDate, hasAccount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone || null, role, salary, address || null, username || null, password || null, new Date().toISOString().split('T')[0], hasAccount || false]
    );
    const newEmployee = await db.get('SELECT * FROM employees WHERE id = ?', result.lastID);
    res.status(201).json(newEmployee);
  } catch (err) {
    console.error('❌ Add employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, salary, address, username, password, hasAccount } = req.body;
  if (!name || !role || !salary) {
    return res.status(400).json({ message: 'Name, role, and salary are required' });
  }
  try {
    await db.run(
      `UPDATE employees SET name = ?, phone = ?, role = ?, salary = ?, address = ?, username = ?, password = ?, hasAccount = ?, updated_at = ? WHERE id = ?`,
      [name, phone || null, role, salary, address || null, username || null, password || null, hasAccount || false, new Date().toISOString(), id]
    );
    const updatedEmployee = await db.get('SELECT * FROM employees WHERE id = ?', id);
    res.json(updatedEmployee);
  } catch (err) {
    console.error('❌ Update employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM employee_payments WHERE employee_id = ?', id);
    await db.run('DELETE FROM employees WHERE id = ?', id);
    await db.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.run('ROLLBACK');
    console.error('❌ Delete employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/employees/:id/pay', async (req, res) => {
  const { id } = req.params;
  const { amount, date, type } = req.body;
  if (!amount || !date || !type) {
    return res.status(400).json({ message: 'Amount, date, and type are required' });
  }
  try {
    const result = await db.run(
      `INSERT INTO employee_payments (employee_id, amount, date, type) VALUES (?, ?, ?, ?)`,
      [id, amount, date, type]
    );
    const newPayment = await db.get('SELECT * FROM employee_payments WHERE id = ?', result.lastID);
    res.status(201).json(newPayment);
  } catch (err) {
    console.error('❌ Create payment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/employees/:id/payments', async (req, res) => {
  const { id } = req.params;
  try {
    const payments = await db.all(
      'SELECT * FROM employee_payments WHERE employee_id = ? ORDER BY date DESC, id DESC',
      [id]
    );
    res.json(payments);
  } catch (err) {
    console.error('❌ Fetch employee payments history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const { search, forCategory } = req.query;

    if (search) {
      let query = `
        SELECT p.*, s.name AS supplierName
        FROM products p
        LEFT JOIN suppliers s ON p.supplier = s.id
        WHERE p.name LIKE ? OR p.barcode LIKE ?
      `;
      
      let params = [`%${search}%`, `%${search}%`];
      
      // If searching for category products, exclude products already in the category
      if (forCategory) {
        query += ` AND p.id NOT IN (
          SELECT product_id FROM category_products 
          WHERE category_id = ? AND product_id IS NOT NULL
        )`;
        params.push(forCategory);
      }
      
      query += ` ORDER BY p.created_at DESC`;
      
      const products = await db.all(query, params);
      return res.json(products);
    }

    // Default: return all products
    const products = await db.all(`
      SELECT p.*, s.name AS supplierName
      FROM products p
      LEFT JOIN suppliers s ON p.supplier = s.id
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (err) {
    console.error("❌ Fetch products error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post('/api/products', async (req, res) => {
  const { name, barcode, brand, category, buying_price = 0, selling_price = 0, margin_percent = 0,
          initial_quantity = 0, current_quantity = 0, min_quantity = 0, supplier = null } = req.body;

  if (!name || !barcode || !brand || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await db.run(
      `INSERT INTO products 
        (name, barcode, brand, category, buying_price, selling_price, margin_percent, initial_quantity, current_quantity, min_quantity, supplier) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, barcode, brand, category, buying_price, selling_price, margin_percent, initial_quantity, current_quantity, min_quantity, supplier]
    );

    const product = await db.get(`
      SELECT p.*, s.name AS supplierName
      FROM products p
      LEFT JOIN suppliers s ON p.supplier = s.id
      WHERE p.id = ?`,
      result.lastID
    );

    res.status(201).json(product);
  } catch (err) {
    console.error('❌ Add product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const fields = { ...req.body };

  // ❌ Remove supplierName because it's not in DB
  delete fields.supplierName;

  const keys = Object.keys(fields);
  if (!keys.length) return res.status(400).json({ message: 'No fields to update' });

  try {
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(fields), new Date().toISOString(), id];

    await db.run(
      `UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?`,
      values
    );

    // ✅ Return product with supplierName again
    const updated = await db.get(`
      SELECT p.*, s.name AS supplierName
      FROM products p
      LEFT JOIN suppliers s ON p.supplier = s.id
      WHERE p.id = ?`,
      [id]
    );

    res.json(updated);
  } catch (err) {
    console.error('❌ Update product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM products WHERE id = ?', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await db.all(
      'SELECT * FROM suppliers ORDER BY created_at DESC'
    );
    res.json(suppliers);
  } catch (err) {
    console.error('❌ Fetch suppliers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/suppliers/stats', async (req, res) => {
  try {
    const totalSuppliers = await db.get('SELECT COUNT(*) AS count FROM suppliers');
    const totalPurchaseOrders = await db.get('SELECT COUNT(*) AS count FROM invoices WHERE type = "purchase"');
    const totalPurchaseAmount = await db.get('SELECT SUM(total) AS sum FROM invoices WHERE type = "purchase"');
    const totalProducts = await db.get('SELECT COUNT(*) AS count FROM products');
    const supplierStats = await db.all(`
      SELECT
        s.id,
        s.name,
        s.phone,
        s.address,
        COUNT(DISTINCT p.id) AS productCount,
        COUNT(DISTINCT i.id) AS totalOrders,
        COALESCE(SUM(i.total), 0) AS totalSpent
      FROM suppliers s
      LEFT JOIN products p ON p.supplier = s.id      LEFT JOIN invoices i ON i.supplierId = s.id AND i.type = 'purchase'
      GROUP BY s.id
      ORDER BY totalSpent DESC
    `);
    res.json({
      totalSuppliers: totalSuppliers.count,
      totalPurchaseOrders: totalPurchaseOrders.count,
      totalPurchaseAmount: totalPurchaseAmount.sum || 0,
      totalProducts: totalProducts.count,
      supplierStats,
    });
  } catch (err) {
    console.error('❌ Fetch suppliers stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { name, phone, address } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Supplier name is required' });
  }
  try {
    const result = await db.run(
      `INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)`,
      [name, phone, address]
    );
    const supplier = await db.get(
      'SELECT * FROM suppliers WHERE id = ?',
      result.lastID
    );
    res.status(201).json(supplier);
  } catch (err) {
    console.error('❌ Add supplier error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Supplier name is required' });
  }
  try {
    await db.run(
      'UPDATE suppliers SET name = ?, phone = ?, address = ?, updated_at = ? WHERE id = ?',
      [name, phone, address, new Date().toISOString(), id]
    );
    const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', id);
    res.json(supplier);
  } catch (err) {
    console.error('❌ Update supplier error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM suppliers WHERE id = ?', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete supplier error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await db.all(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    res.json(customers);
  } catch (err) {
    console.error('❌ Fetch customers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, phone, address } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Customer name is required' });
  }
  try {
    const result = await db.run(
      `INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)`,
      [name, phone, address]
    );
    const customer = await db.get(
      'SELECT * FROM customers WHERE id = ?',
      result.lastID
    );
    res.status(201).json(customer);
  } catch (err) {
    console.error('❌ Add customer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Customer name is required' });
  }
  try {
    await db.run(
      'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, id]
    );
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', id);
    res.json(customer);
  } catch (err) {
    console.error('❌ Update customer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM customers WHERE id = ?', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete customer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/invoices
app.get('/api/invoices', async (req, res) => {
  const { type, search, status, createdByType, createdBy } = req.query;

  const where = [];
  const params = [];

  if (type) { where.push('i.type = ?'); params.push(type); }
  if (search) {
    where.push('(i.id LIKE ? OR i.client_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status === 'debts') { where.push('i.amount_paid < i.total'); }

if (createdByType && createdBy) {
  where.push('i.createdByType = ? AND i.createdBy = ?');
  params.push(createdByType, createdBy);
}

const sql = `
  SELECT
    i.*,
    COALESCE(u.username, e.username, u.email) AS created_by_display,
    i.createdByType
  FROM invoices i
  LEFT JOIN users u
    ON i.createdByType = 'admin' AND i.createdBy = u.id
  LEFT JOIN employees e
    ON i.createdByType = 'employee' AND i.createdBy = e.id
  ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
  ORDER BY i.created_at DESC
`;


  const rows = await db.all(sql, params); // adapt to your DB helper
  res.json(rows);
});

// Get worker by ID
app.get('/api/workers/:id', async (req, res) => {
  const { id } = req.params;
  try {
   const worker = await db.get(
  'SELECT id, username, "name" as name, phone, "role" as role, address FROM employees WHERE id = ?',
  [id]
);

    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    console.error("❌ Fetch worker error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update worker profile (username, name, phone, etc.)
app.put('/api/workers/:id', async (req, res) => {
  const { id } = req.params;
  const { username, name, phone, role, address } = req.body;

  try {
    // Get existing worker first
    const worker = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    // Update all fields, keep old values if not provided
    await db.run(
      `UPDATE employees 
       SET username = ?, "name" = ?, phone = ?, "role" = ?, address = ?
       WHERE id = ?`,
      [
        username || worker.username,
        name     || worker.name,
        phone    || worker.phone,
        role     || worker.role,
        address  || worker.address,
        id
      ]
    );

    res.json({ message: 'Worker updated successfully' });
  } catch (err) {
    console.error("❌ Update worker profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change worker password
// Change worker password
app.put('/api/workers/:id/password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    const worker = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    if (!worker.password) {
      return res.status(400).json({ message: 'Worker does not have an account yet' });
    }

    if (worker.password !== currentPassword) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    await db.run('UPDATE employees SET password = ? WHERE id = ?', [newPassword, id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("❌ Update worker password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




app.post('/api/invoices', async (req, res) => {
  const { type, supplierId, clientId, client_name, total, amount_paid = 0, items } = req.body;

  if (!type || !total || !items || items.length === 0) {
    return res.status(400).json({ message: 'Missing required fields or items' });
  }

  try {
    await db.run('BEGIN TRANSACTION');

    const result = await db.run(
  `INSERT INTO invoices (type, clientId, client_name, supplierId, total, amount_paid, createdBy, createdByType) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    type,
    clientId,
    client_name,
    supplierId,
    total,
    amount_paid,
   req.body.createdBy,
req.body.createdByType

  ]
);



    const invoiceId = result.lastID;

    // Insert invoice items + update products
    for (const raw of items) {
      // ✅ Normalize incoming fields
      const item = {
        productId:   raw.product_id   ?? raw.productId   ?? raw.id,
        productName: raw.product_name ?? raw.productName ?? raw.name,
        barcode:     raw.barcode ?? null,
        buyingPrice: raw.buying_price ?? raw.purchase_price ?? raw.purchasePrice ?? 0,
        marginPct:   raw.margin_percent ?? raw.marginPercent ?? 0,
        sellingPrice:raw.selling_price ?? raw.sellingPrice ?? 0,
        quantity:    Number(raw.quantity ?? 0),
        minQty:      raw.min_quantity ?? raw.minQuantity ?? 0,
        total:       Number(raw.total ?? 0),
      };

      if (!item.productId || !item.productName) {
        throw new Error("Invoice item missing productId/productName");
      }

      // ✅ Insert into invoice_items
      await db.run(
        `INSERT INTO invoice_items (
            invoice_id,
            product_id,
            product_name,
            barcode,
            purchase_price,
            margin_percent,
            selling_price,
            quantity,
            min_quantity,
            total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.productId,
          item.productName,
          item.barcode,
          item.buyingPrice,
          item.marginPct,
          item.sellingPrice,
          item.quantity,
          item.minQty,
          item.total,
        ]
      );

      // ✅ Update product stock/prices
      const existingProduct = await db.get(`SELECT * FROM products WHERE id = ?`, [item.productId]);

      if (existingProduct) {
        if (type === "purchase") {
          // Increase stock on purchase
          const newInitialQty =
            (existingProduct.initial_quantity || 0) === 0
              ? item.quantity
              : (existingProduct.initial_quantity || 0) + item.quantity;

          const newCurrentQty =
            (existingProduct.current_quantity || 0) === 0
              ? newInitialQty
              : (existingProduct.current_quantity || 0) + item.quantity;

          await db.run(
            `UPDATE products
             SET supplier = COALESCE(?, supplier),
                 buying_price = ?,
                 selling_price = ?,
                 margin_percent = ?,
                 initial_quantity = ?,
                 current_quantity = ?,
                 min_quantity = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
              supplierId || existingProduct.supplier,
              item.buyingPrice,
              item.sellingPrice,
              item.marginPct,
              newInitialQty,
              newCurrentQty,
              item.minQty,
              item.productId,
            ]
          );
        } else if (type === "sale") {
          // Decrease stock on sale
          const available = existingProduct.current_quantity || 0;
          const newCurrentQty = Math.max(0, available - item.quantity);

          await db.run(
            `UPDATE products
             SET current_quantity = ?,
                 selling_price = COALESCE(?, selling_price),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newCurrentQty, item.sellingPrice, item.productId]
          );
        }
      }
    }

    // If it's a sale with no client, create placeholder client
    if (type === "sale" && !clientId) {
      const placeholderName = `client_${invoiceId}`;
      const cust = await db.run(`INSERT INTO customers (name) VALUES (?)`, [placeholderName]);
      await db.run(`UPDATE invoices SET clientId = ? WHERE id = ?`, [cust.lastID, invoiceId]);
    }

    await db.run('COMMIT');

    const newInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', invoiceId);
    res.status(201).json(newInvoice);
  } catch (err) {
    await db.run('ROLLBACK');
    console.error('❌ Add invoice error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Get single invoice with client name + items
app.get("/api/invoices/:id", async (req, res) => {
  try {
    const invoice = await db.get(`
      SELECT i.*, c.name AS clientName
      FROM invoices i
LEFT JOIN customers c ON i.clientId = c.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const items = await db.all(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [req.params.id]);
    res.json({ ...invoice, items });
  } catch (err) {
    console.error("❌ Error fetching invoice:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Update invoice payment (increment instead of overwrite)
// Update invoice payment (increment instead of overwrite)
app.put("/api/invoices/:id/pay", async (req, res) => {
  const { id } = req.params;
  const { amount_paid } = req.body;

  try {
    await db.run(
      `UPDATE invoices SET amount_paid = amount_paid + ? WHERE id = ?`,
      [amount_paid, id]
    );

    const updatedInvoice = await db.get(`SELECT * FROM invoices WHERE id = ?`, [id]);
    res.json(updatedInvoice);
  } catch (error) {
    console.error("❌ Error updating invoice payment:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});


// --- Reports API Endpoints (NEW) ---
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await db.all('SELECT * FROM reports ORDER BY generated_at DESC');
    res.json(reports);
  } catch (err) {
    console.error('❌ Fetch reports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/reports', async (req, res) => {
  const { name, type, period_start, period_end, creator } = req.body;
  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required' });
  }
  try {
    const result = await db.run(
      `INSERT INTO reports (name, type, period_start, period_end, status, creator) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, period_start, period_end, 'processing', creator || 'unknown']
    );
    const newReport = await db.get('SELECT * FROM reports WHERE id = ?', result.lastID);
    res.status(201).json(newReport);
  } catch (err) {
    console.error('❌ Add report error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get today's transactions for the 'today' tab
app.get('/api/reports/today_transactions', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const transactions = await db.all(
      `SELECT
        i.id,
        i.type,
        i.total,
        i.amount_paid,
        i.status,
        i.created_at,
        CASE
          WHEN i.type = 'sale' THEN c.name
          WHEN i.type = 'purchase' THEN s.name
        END AS entityName
      FROM invoices i
      LEFT JOIN customers c ON i.clientId = c.id
      LEFT JOIN suppliers s ON i.supplierId = s.id
      WHERE DATE(i.created_at) = ?
      ORDER BY i.created_at DESC`,
      [today]
    );
    res.json(transactions);
  } catch (err) {
    console.error('❌ Fetch today\'s transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get all stats for both 'today' and 'analytics' tabs
app.get('/api/reports/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    // Today's stats
    const todaySales = await db.get(`SELECT COALESCE(SUM(total), 0) AS total FROM invoices WHERE type = 'sale' AND DATE(created_at) = ?`, [today]);
    const todayPurchases = await db.get(`SELECT COALESCE(SUM(total), 0) AS total FROM invoices WHERE type = 'purchase' AND DATE(created_at) = ?`, [today]);
    const todaySalesCount = await db.get(`SELECT COUNT(*) AS count FROM invoices WHERE type = 'sale' AND DATE(created_at) = ?`, [today]);
    const todayPurchasesCount = await db.get(`SELECT COUNT(*) AS count FROM invoices WHERE type = 'purchase' AND DATE(created_at) = ?`, [today]);
    const todayProfit = (todaySales.total || 0) - (todayPurchases.total || 0);

    // General stats (all-time)
    const totalRevenue = await db.get(`SELECT COALESCE(SUM(total), 0) AS total FROM invoices WHERE type = 'sale'`);
    const totalExpenses = await db.get(`SELECT COALESCE(SUM(total), 0) AS total FROM invoices WHERE type = 'purchase'`);
    const netProfit = (totalRevenue.total || 0) - (totalExpenses.total || 0);

    const totalProducts = await db.get(`SELECT COUNT(*) AS count FROM products`);
    const lowStockCount = await db.get(`SELECT COUNT(*) AS count FROM products WHERE current_quantity <= min_quantity`);
    const totalCustomers = await db.get(`SELECT COUNT(*) AS count FROM customers`);
    const totalSuppliers = await db.get(`SELECT COUNT(*) AS count FROM suppliers`);

    res.json({
      todayStats: {
        totalSales: todaySales.total,
        totalPurchases: todayPurchases.total,
        salesCount: todaySalesCount.count,
        purchasesCount: todayPurchasesCount.count,
        profit: todayProfit,
      },
      generalStats: {
        totalRevenue: totalRevenue.total,
        totalExpenses: totalExpenses.total,
        netProfit: netProfit,
        totalProducts: totalProducts.count,
        lowStockCount: lowStockCount.count,
        totalCustomers: totalCustomers.count,
        totalSuppliers: totalSuppliers.count,
      }
    });
  } catch (err) {
    console.error('❌ Fetch report stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// --- Events API Endpoints ---
app.get('/api/events', async (req, res) => {
  try {
    const events = await db.all('SELECT * FROM events ORDER BY start ASC');
    res.json(events);
  } catch (err) {
    console.error('❌ Fetch events error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/events', async (req, res) => {
  const { title, start, end, allDay } = req.body;
  if (!title || !start || !end) {
    return res.status(400).json({ message: 'Title, start, and end dates are required' });
  }
  try {
    const result = await db.run(
      `INSERT INTO events (title, start, end, allDay) VALUES (?, ?, ?, ?)`,
      [title, start, end, allDay || false]
    );
    const newEvent = await db.get('SELECT * FROM events WHERE id = ?', result.lastID);
    res.status(201).json(newEvent);
  } catch (err) {
    console.error('❌ Add event error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM events WHERE id = ?', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete event error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// --- User Management API Routes ---

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, currentPassword, newPassword } = req.body;

  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Build dynamic update
    let updates = [];
    let params = [];

    if (username) {
      updates.push("username = ?");
      params.push(username);
    }

    if (email) {
      updates.push("email = ?");
      params.push(email);
    }

    if (newPassword) {
      if (user.password !== currentPassword) {
        return res.status(401).json({ message: 'Invalid current password' });
      }
      updates.push("password = ?");
      params.push(newPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    params.push(id);
    await db.run(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

    res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error("❌ Update user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/system-info', async (req, res) => {
  try {
    const dbSize = fs.statSync(path.join(process.cwd(), 'database.sqlite')).size;
    const uptime = process.uptime(); // Uptime in seconds
    // You could also fetch the last backup time from a dedicated table if you implement a more robust backup system.
    
    res.json({
      database: 'SQLite',
      dbSize: dbSize,
      uptime: uptime,
      networkStatus: 'connected', // This is a static value for now, but could be dynamic
      version: '1.0.0' // Matches the frontend version
    });
  } catch (err) {
    console.error('❌ Fetch system info error:', err);
    res.status(500).json({ message: 'Failed to get system info' });
  }
});

// --- Backup & Restore API Routes ---

// ✅ Export/Backup Route
app.get("/api/backup/export", async (req, res) => {
  try {
    const dbPath = path.join(process.cwd(), "database.sqlite");
    const backupDir = path.join(process.cwd(), "backups");
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `database-backup-${timestamp}.sqlite`;
    const backupPath = path.join(backupDir, backupFileName);
    
    fs.copyFileSync(dbPath, backupPath);
    
    // Send the file to the client
    res.download(backupPath, backupFileName, (err) => {
      if (err) {
        console.error("❌ Backup export error:", err);
        res.status(500).json({ message: "Failed to download backup" });
      }
      // Optional: clean up the temporary backup file on the server after download
      // fs.unlinkSync(backupPath);
    });
    
  } catch (err) {
    console.error("❌ Backup export error:", err);
    res.status(500).json({ message: "Failed to create backup" });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.get('SELECT id, username, email, role FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("❌ Fetch user error:", err);
    res.status(500).json({ message: "Server error" });
  }
}); 

// ensure categories upload dir exists
const categoriesUploadDir = path.join(process.cwd(), 'uploads', 'categories');
if (!fs.existsSync(categoriesUploadDir)) fs.mkdirSync(categoriesUploadDir, { recursive: true });

/**
 * GET /api/categories
 * returns categories with productsCount
 */
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.all(`
      SELECT 
        c.*,
        COALESCE(COUNT(cp.id), 0) AS productsCount
      FROM categories c
      LEFT JOIN category_products cp ON cp.category_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(categories);
  } catch (err) {
    console.error('❌ Fetch categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allow frontend to load uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
/**
 * GET /api/categories/:id
 * returns a single category and its products
 */
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const products = await db.all(
      `SELECT * FROM products WHERE category_id = ? OR category = ? ORDER BY created_at DESC`,
      [id, category.nameFr]
    );

    res.json({ ...category, products });
  } catch (err) {
    console.error('❌ Fetch category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/categories
 * multipart/form-data: fields nameFr, nameAr and file field 'image'
 */
app.post('/api/categories', upload.single('image'), async (req, res) => {
  try {
    const { nameFr, nameAr } = req.body;
    if (!nameFr) return res.status(400).json({ message: 'nameFr is required' });

    let imagePath = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '';
      const destName = `${Date.now()}${ext}`;
      const dest = path.join(categoriesUploadDir, destName);
      fs.renameSync(req.file.path, dest); // move from multer tmp to categories dir
      imagePath = `/uploads/categories/${destName}`;
    }

    const result = await db.run(
      `INSERT INTO categories (nameFr, nameAr, image) VALUES (?, ?, ?)`,
      [nameFr, nameAr || null, imagePath]
    );

    const newCat = await db.get('SELECT * FROM categories WHERE id = ?', [result.lastID]);
    res.status(201).json(newCat);
  } catch (err) {
    console.error('❌ Add category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/categories/:id
 * supports updating fields and replacing the image (multipart/form-data)
 */
app.put('/api/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nameFr, nameAr } = req.body;

    const existing = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Category not found' });

    let imagePath = existing.image;
    if (req.file) {
      // delete old file if it exists
      if (existing.image) {
        try { fs.unlinkSync(path.join(process.cwd(), existing.image.replace(/^\//, ""))); } catch(e) { /* ignore */ }
      }
      const ext = path.extname(req.file.originalname) || '';
      const destName = `${Date.now()}${ext}`;
      const dest = path.join(categoriesUploadDir, destName);
      fs.renameSync(req.file.path, dest);
      imagePath = `/uploads/categories/${destName}`;
    }

    await db.run(
      `UPDATE categories SET nameFr = ?, nameAr = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nameFr || existing.nameFr, nameAr || existing.nameAr, imagePath, id]
    );

    const updated = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    console.error('❌ Update category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/categories/:id
 * removes the category and clears category references on products
 */
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    // delete database row
    await db.run('DELETE FROM categories WHERE id = ?', [id]);

    // clear category link on products (keep text in 'category' if you want, here we null the relation)
    await db.run('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);

    // optionally clear textual category values that equal this category name:
    await db.run('UPDATE products SET category = NULL WHERE category = ?', [cat.nameFr]);

    // delete image file
    if (cat.image) {
      try { fs.unlinkSync(path.join(process.cwd(), cat.image)); } catch (e) { /* ignore */ }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products for a specific category
app.get('/api/categories/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const products = await db.all(
      `SELECT * FROM category_products WHERE category_id = ? ORDER BY created_at DESC`,
      [categoryId]
    );
    
    res.json(products);
  } catch (err) {
    console.error('❌ Fetch category products error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a product to a category
app.post('/api/category-products', upload.single('image'), async (req, res) => {
  try {
   const {
  categoryId,
  productId,
  name,
  nameFr,
  nameAr,
  description,
  descriptionFr,
  descriptionAr,
  sellingPrice,
  quality
} = req.body;

// Parse numeric values
const sellingPriceNum = parseFloat(sellingPrice) || 0;
const qualityNum = parseInt(quality) || 5;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    let imagePath = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '';
      const destName = `${Date.now()}${ext}`;
      const dest = path.join(process.cwd(), 'uploads', 'category-products', destName);
      
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
      }
      
      fs.renameSync(req.file.path, dest);
      imagePath = `/uploads/category-products/${destName}`;
    }

    const result = await db.run(
      `INSERT INTO category_products 
        (category_id, product_id, name, nameFr, nameAr, description, descriptionFr, descriptionAr, selling_price, quality, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoryId,
        productId || null,
        name || '',
        nameFr || '',
        nameAr || '',
        description || '',
        descriptionFr || '',
        descriptionAr || '',
        sellingPrice || 0,
        quality || 5,
        imagePath
      ]
    );

    const newProduct = await db.get(
      'SELECT * FROM category_products WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('❌ Add category product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a category product
app.put('/api/category-products/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      nameFr,
      nameAr,
      description,
      descriptionFr,
      descriptionAr,
      sellingPrice,
      quality
    } = req.body;

    const existing = await db.get(
      'SELECT * FROM category_products WHERE id = ?',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let imagePath = existing.image;
    if (req.file) {
      // Delete old image if exists
      if (existing.image) {
        try {
          fs.unlinkSync(path.join(process.cwd(), existing.image.replace(/^\//, '')));
        } catch (e) { /* ignore */ }
      }
      
      const ext = path.extname(req.file.originalname) || '';
      const destName = `${Date.now()}${ext}`;
      const dest = path.join(process.cwd(), 'uploads', 'category-products', destName);
      
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
      }
      
      fs.renameSync(req.file.path, dest);
      imagePath = `/uploads/category-products/${destName}`;
    }

    await db.run(
      `UPDATE category_products 
       SET name = ?, nameFr = ?, nameAr = ?, 
           description = ?, descriptionFr = ?, descriptionAr = ?,
           selling_price = ?, quality = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        name || existing.name,
        nameFr || existing.nameFr,
        nameAr || existing.nameAr,
        description || existing.description,
        descriptionFr || existing.descriptionFr,
        descriptionAr || existing.descriptionAr,
        sellingPrice || existing.selling_price,
        quality || existing.quality,
        imagePath,
        id
      ]
    );

    const updated = await db.get(
      'SELECT * FROM category_products WHERE id = ?',
      [id]
    );
    
    res.json(updated);
  } catch (err) {
    console.error('❌ Update category product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a category product
app.delete('/api/category-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await db.get(
      'SELECT * FROM category_products WHERE id = ?',
      [id]
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image file if exists
    if (product.image) {
      try {
        fs.unlinkSync(path.join(process.cwd(), product.image.replace(/^\//, '')));
      } catch (e) { /* ignore */ }
    }

    await db.run('DELETE FROM category_products WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete category product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single category product
app.get('/api/category-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await db.get(
      'SELECT * FROM category_products WHERE id = ?',
      [id]
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('❌ Fetch category product error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Special Offers API Endpoints ---
// GET /api/special-offers - Get all special offers
app.get('/api/special-offers', async (req, res) => {
  try {
    const offers = await db.all(`
      SELECT * FROM special_offers ORDER BY created_at DESC
    `);
    res.json(offers);
  } catch (err) {
    console.error('❌ Fetch special offers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/special-offers - Create special offer
app.post('/api/special-offers', async (req, res) => {
  const { nameFr, nameAr, descriptionFr, descriptionAr, end_time, is_active = true } = req.body;
  
  if (!nameFr || !end_time) {
    return res.status(400).json({ message: 'French name and end time are required' });
  }
  
  try {
    const result = await db.run(
      `INSERT INTO special_offers (name, nameFr, nameAr, description, descriptionFr, descriptionAr, end_time, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nameFr, nameFr, nameAr || null, descriptionFr || null, descriptionFr || null, descriptionAr || null, end_time, is_active]
    );
    
    const newOffer = await db.get('SELECT * FROM special_offers WHERE id = ?', result.lastID);
    res.status(201).json(newOffer);
  } catch (err) {
    console.error('❌ Add special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/special-offers/:id - Update special offer
app.put('/api/special-offers/:id', async (req, res) => {
  const { id } = req.params;
  const { nameFr, nameAr, descriptionFr, descriptionAr, end_time } = req.body;
  
  try {
    await db.run(
      `UPDATE special_offers 
       SET name = ?, nameFr = ?, nameAr = ?, description = ?, descriptionFr = ?, descriptionAr = ?, 
           end_time = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [nameFr, nameFr, nameAr, descriptionFr, descriptionFr, descriptionAr, end_time, id]
    );
    
    const updatedOffer = await db.get('SELECT * FROM special_offers WHERE id = ?', id);
    res.json(updatedOffer);
  } catch (err) {
    console.error('❌ Update special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ensure special offers upload directory exists
const specialOffersUploadDir = path.join(process.cwd(), 'uploads', 'special-offers');
if (!fs.existsSync(specialOffersUploadDir)) {
  fs.mkdirSync(specialOffersUploadDir, { recursive: true });
}

// PUT /api/special-offers/:id
app.put('/api/special-offers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, nameFr, nameAr, description, descriptionFr, descriptionAr, end_time, is_active } = req.body;
  
  try {
    await db.run(
      `UPDATE special_offers 
       SET name = ?, nameFr = ?, nameAr = ?, description = ?, descriptionFr = ?, descriptionAr = ?, 
           end_time = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, nameFr, nameAr, description, descriptionFr, descriptionAr, end_time, is_active, id]
    );
    
    const updatedOffer = await db.get('SELECT * FROM special_offers WHERE id = ?', id);
    res.json(updatedOffer);
  } catch (err) {
    console.error('❌ Update special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/special-offers/:id
app.delete('/api/special-offers/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.run('DELETE FROM special_offers WHERE id = ?', id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/special-offers/:id/products', async (req, res) => {
  const { id } = req.params;
  
  try {
    const products = await db.all(`
      SELECT 
        p.*,
        sop.offer_price,
        sop.descriptionFr,
        sop.descriptionAr,
        sop.quality,
        sop.image,
        sop.created_at as added_date
      FROM special_offer_products sop
      INNER JOIN products p ON p.id = sop.product_id
      WHERE sop.offer_id = ?
      ORDER BY sop.created_at DESC
    `, [id]);
    
    res.json(products);
  } catch (err) {
    console.error('❌ Fetch special offer products error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/special-offers/:id/products', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { product_id, offer_price, descriptionFr, descriptionAr, quality } = req.body;
  
  if (!product_id) {
    return res.status(400).json({ message: 'Product ID is required' });
  }
  
  try {
    // Check if product already exists in offer
    const existing = await db.get(
      'SELECT * FROM special_offer_products WHERE offer_id = ? AND product_id = ?',
      [id, product_id]
    );
    
    if (existing) {
      return res.status(400).json({ message: 'Product already in this offer' });
    }
    
    let imagePath = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '';
      const destName = `${Date.now()}${ext}`;
      const dest = path.join(process.cwd(), 'uploads', 'special-offers', destName);
      
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
      }
      
      fs.renameSync(req.file.path, dest);
      imagePath = `/uploads/special-offers/${destName}`;
    }
    
    await db.run(
      `INSERT INTO special_offer_products 
       (offer_id, product_id, offer_price, descriptionFr, descriptionAr, quality, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, product_id, offer_price || 0, descriptionFr || '', descriptionAr || '', quality || 5, imagePath]
    );
    
    // Update products count
    const countResult = await db.get(
      'SELECT COUNT(*) as count FROM special_offer_products WHERE offer_id = ?',
      [id]
    );
    
    await db.run(
      'UPDATE special_offers SET products_count = ? WHERE id = ?',
      [countResult.count, id]
    );
    
    // Get the newly added product with full details
    const newProduct = await db.get(`
      SELECT 
        p.*,
        sop.offer_price,
        sop.descriptionFr,
        sop.descriptionAr,
        sop.quality,
        sop.image,
        sop.created_at as added_date
      FROM special_offer_products sop
      INNER JOIN products p ON p.id = sop.product_id
      WHERE sop.offer_id = ? AND sop.product_id = ?
    `, [id, product_id]);
    
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('❌ Add product to special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/special-offers/:id/products/:productId
app.put('/api/special-offers/:id/products/:productId', upload.single('image'), async (req, res) => {
  const { id, productId } = req.params;
  const { offer_price, descriptionFr, descriptionAr, quality } = req.body;
  
  try {
    const existing = await db.get(
      'SELECT * FROM special_offer_products WHERE offer_id = ? AND product_id = ?',
      [id, productId]
    );
    
    if (!existing) {
      return res.status(404).json({ message: 'Product not found in this offer' });
    }
    
    let imagePath = existing.image;
    if (req.file) {
      // Delete old image if exists
      if (existing.image) {
        try {
          fs.unlinkSync(path.join(process.cwd(), existing.image.replace(/^\//, '')));
        } catch (e) { /* ignore */ }
      }
      
      const ext = path.extname(req.file.originalname) || '';
      const destName = `${Date.now()}${ext}`;
      const dest = path.join(process.cwd(), 'uploads', 'special-offers', destName);
      
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
      }
      
      fs.renameSync(req.file.path, dest);
      imagePath = `/uploads/special-offers/${destName}`;
    }
    
    await db.run(
      `UPDATE special_offer_products 
       SET offer_price = ?, descriptionFr = ?, descriptionAr = ?, quality = ?, image = ?
       WHERE offer_id = ? AND product_id = ?`,
      [offer_price || 0, descriptionFr || '', descriptionAr || '', quality || 5, imagePath, id, productId]
    );
    
    // Get the updated product with full details
    const updatedProduct = await db.get(`
      SELECT 
        p.*,
        sop.offer_price,
        sop.descriptionFr,
        sop.descriptionAr,
        sop.quality,
        sop.image,
        sop.created_at as added_date
      FROM special_offer_products sop
      INNER JOIN products p ON p.id = sop.product_id
      WHERE sop.offer_id = ? AND sop.product_id = ?
    `, [id, productId]);
    
    res.json(updatedProduct);
  } catch (err) {
    console.error('❌ Update product in special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/special-offers/:id/toggle-status
app.patch('/api/special-offers/:id/toggle-status', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.run(
      'UPDATE special_offers SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    const updatedOffer = await db.get('SELECT * FROM special_offers WHERE id = ?', id);
    res.json(updatedOffer);
  } catch (err) {
    console.error('❌ Toggle special offer status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this validation function at the top of your server file
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Add this to your server.js after database initialization
app.get('/api/debug', async (req, res) => {
  try {
    const offers = await db.all('SELECT * FROM special_offers');
    const products = await db.all('SELECT * FROM products');
    res.json({ 
      offers: offers.length, 
      products: products.length,
      status: 'Database connected successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/special-offers/:id/products - Get products with offer-specific data
app.get('/api/special-offers/:id/products', async (req, res) => {
  const { id } = req.params;
  
  try {
    const products = await db.all(`
      SELECT 
        p.*,
        sop.offer_price,
        sop.descriptionFr,
        sop.descriptionAr,
        sop.quality,
        sop.image as offer_image,
        sop.created_at as added_date
      FROM products p
      INNER JOIN special_offer_products sop ON p.id = sop.product_id
      WHERE sop.offer_id = ?
      ORDER BY sop.created_at DESC
    `, [id]);
    
    res.json(products);
  } catch (err) {
    console.error('❌ Fetch special offer products error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/special-offers/:id/products/:productId', upload.single('image'), async (req, res) => {
  const { id, productId } = req.params;
  const { offer_price, descriptionFr, descriptionAr, quality } = req.body;
  
  try {
    const existing = await db.get(
      'SELECT * FROM special_offer_products WHERE offer_id = ? AND product_id = ?',
      [id, productId]
    );
    
    if (!existing) {
      return res.status(404).json({ message: 'Product not found in this offer' });
    }
    
    let imagePath = existing.image;
    if (req.file) {
      // Delete old image if exists
      if (existing.image) {
        try {
          fs.unlinkSync(path.join(process.cwd(), existing.image.replace(/^\//, '')));
        } catch (e) { /* ignore */ }
      }
      
      const ext = path.extname(req.file.originalname) || '';
      const destName = `${Date.now()}${ext}`;
      const dest = path.join(process.cwd(), 'uploads', 'special-offers', destName);
      
      // Ensure directory exists
      if (!fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
      }
      
      fs.renameSync(req.file.path, dest);
      imagePath = `/uploads/special-offers/${destName}`;
    }
    
    await db.run(
      `UPDATE special_offer_products 
       SET offer_price = ?, descriptionFr = ?, descriptionAr = ?, quality = ?, image = ?
       WHERE offer_id = ? AND product_id = ?`,
      [offer_price || 0, descriptionFr || '', descriptionAr || '', quality || 5, imagePath, id, productId]
    );
    
    // Get the updated product with full details
    const updatedProduct = await db.get(`
      SELECT 
        p.*,
        sop.offer_price,
        sop.descriptionFr,
        sop.descriptionAr,
        sop.quality,
        sop.image,
        sop.created_at as added_date
      FROM products p
      INNER JOIN special_offer_products sop ON p.id = sop.product_id
      WHERE sop.offer_id = ? AND sop.product_id = ?
    `, [id, productId]);
    
    res.json(updatedProduct);
  } catch (err) {
    console.error('❌ Update product in special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
app.delete('/api/special-offers/:id/products/:productId', async (req, res) => {
  const { id, productId } = req.params;
  
  try {
    // Get product to delete image if exists
    const product = await db.get(
      'SELECT * FROM special_offer_products WHERE offer_id = ? AND product_id = ?',
      [id, productId]
    );
    
    if (product && product.image) {
      try {
        fs.unlinkSync(path.join(process.cwd(), product.image.replace(/^\//, '')));
      } catch (e) { /* ignore */ }
    }
    
    await db.run(
      'DELETE FROM special_offer_products WHERE offer_id = ? AND product_id = ?',
      [id, productId]
    );
    
    // Update products count
    const countResult = await db.get(
      'SELECT COUNT(*) as count FROM special_offer_products WHERE offer_id = ?',
      [id]
    );
    
    await db.run(
      'UPDATE special_offers SET products_count = ? WHERE id = ?',
      [countResult.count, id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Remove product from special offer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/special-offers/active - Get active special offers
app.get('/api/special-offers/active', async (req, res) => {
  try {
    const currentTime = new Date().toISOString();
    const offers = await db.all(`
      SELECT * FROM special_offers 
      WHERE is_active = TRUE AND (end_time IS NULL OR end_time > ?)
      ORDER BY created_at DESC
    `, [currentTime]);
    
    res.json(offers);
  } catch (err) {
    console.error('❌ Fetch active special offers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/contacts - Get company contact information
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await db.get('SELECT * FROM contacts WHERE id = 1');
    res.json(contacts || {});
  } catch (err) {
    console.error('❌ Fetch contacts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/contacts - Create or update company contact information
app.post('/api/contacts', async (req, res) => {
  const { phone, whatsapp, email, facebook, instagram, tiktok, viber, mapUrl } = req.body;
  
  try {
    const existingContact = await db.get('SELECT * FROM contacts WHERE id = 1');

    if (existingContact) {
      // If contact exists, update it
      await db.run(
        `UPDATE contacts SET 
          phone = ?, whatsapp = ?, email = ?, facebook = ?, 
          instagram = ?, tiktok = ?, viber = ?, mapUrl = ?, updated_at = ?
        WHERE id = 1`,
        [phone, whatsapp, email, facebook, instagram, tiktok, viber, mapUrl, new Date().toISOString()]
      );
    } else {
      // If no contact exists, insert a new one
      await db.run(
        `INSERT INTO contacts 
          (phone, whatsapp, email, facebook, instagram, tiktok, viber, mapUrl) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [phone, whatsapp, email, facebook, instagram, tiktok, viber, mapUrl]
      );
    }

    const updatedContact = await db.get('SELECT * FROM contacts WHERE id = 1');
    res.json(updatedContact);
  } catch (err) {
    console.error('❌ Save contacts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get website settings
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await db.get("SELECT * FROM website_settings WHERE id = 1");
    res.json(settings);
  } catch (err) {
    console.error("❌ Fetch settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update website settings
app.put("/api/settings", upload.fields([{ name: "logo" }, { name: "favicon" }]), async (req, res) => {
  try {
    const { site_name_fr, site_name_ar, description_fr, description_ar } = req.body;

    let logoUrl = null;
    let faviconUrl = null;

    if (req.files?.logo) {
      logoUrl = `/uploads/${req.files.logo[0].filename}`;
      fs.renameSync(req.files.logo[0].path, path.join("uploads", req.files.logo[0].filename));
    }

    if (req.files?.favicon) {
      faviconUrl = `/uploads/${req.files.favicon[0].filename}`;
      fs.renameSync(req.files.favicon[0].path, path.join("uploads", req.files.favicon[0].filename));
    }

    await db.run(
      `UPDATE website_settings 
       SET site_name_fr = ?, site_name_ar = ?, description_fr = ?, description_ar = ?, 
           logo_url = COALESCE(?, logo_url), favicon_url = COALESCE(?, favicon_url), 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [site_name_fr, site_name_ar, description_fr, description_ar, logoUrl, faviconUrl]
    );

    const updated = await db.get("SELECT * FROM website_settings WHERE id = 1");
    res.json(updated);
  } catch (err) {
    console.error("❌ Update settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Website settings API
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await db.get("SELECT * FROM website_settings WHERE id = 1");
    res.json(settings);
  } catch (err) {
    console.error("❌ Fetch settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/settings", upload.fields([{ name: "logo" }, { name: "favicon" }]), async (req, res) => {
  try {
    const { site_name_fr, site_name_ar, description_fr, description_ar } = req.body;

    let logoUrl = null;
    let faviconUrl = null;

    if (req.files?.logo) {
      const file = req.files.logo[0];
      logoUrl = `/uploads/${file.filename}`;
      fs.renameSync(file.path, path.join("uploads", file.filename));
    }

    if (req.files?.favicon) {
      const file = req.files.favicon[0];
      faviconUrl = `/uploads/${file.filename}`;
      fs.renameSync(file.path, path.join("uploads", file.filename));
    }

    await db.run(
      `UPDATE website_settings 
       SET site_name_fr = ?, site_name_ar = ?, description_fr = ?, description_ar = ?, 
           logo_url = COALESCE(?, logo_url), favicon_url = COALESCE(?, favicon_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [site_name_fr, site_name_ar, description_fr, description_ar, logoUrl, faviconUrl]
    );

    const updated = await db.get("SELECT * FROM website_settings WHERE id = 1");
    res.json(updated);
  } catch (err) {
    console.error("❌ Update settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.all(`
      SELECT * FROM orders ORDER BY created_at DESC
    `);

    // Include order items for each order
    for (let order of orders) {
      order.items = await db.all(`SELECT * FROM order_items WHERE order_id = ?`, [order.id]);
    }

    res.json(orders);
  } catch (err) {
    console.error('❌ Fetch orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new order
app.post('/api/orders', async (req, res) => {
  const { client_name, client_email, client_phone, wilaya, address, notes, payment_method, items } = req.body;

  if (!client_name || !items || !items.length || !address || !wilaya) {
    return res.status(400).json({ message: 'Client name, wilaya, address, and items are required' });
  }

  try {
    // 1️⃣ Compute total
const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

    // 2️⃣ Insert order
    const result = await db.run(
      `INSERT INTO orders 
        (client_name, client_email, client_phone, wilaya, address, notes, payment_method, total, status, payment_status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?)`,
      [
        client_name,
        client_email || null,
        client_phone || null,
        wilaya,
        address,
        notes || null,
        payment_method || 'cod',
        total,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const orderId = result.lastID;

    // 3️⃣ Insert order items
    const stmt = await db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (let item of items) {
      await stmt.run(orderId, item.product_id, item.product_name, item.quantity, item.price, item.total);
    }

    await stmt.finalize();

    // 4️⃣ Return the newly created order with items
    const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    newOrder.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('❌ Create order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: 'Status is required' });

  try {
    await db.run(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
      [status, new Date().toISOString(), id]
    );

    // If status is completed, update product quantities
    if (status === 'completed') {
      const orderItems = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);
      
      for (const item of orderItems) {
        // Get current product quantity
        const product = await db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
        
        if (product) {
          const newQuantity = Math.max(0, (product.current_quantity || 0) - item.quantity);
          
          await db.run(
            'UPDATE products SET current_quantity = ?, updated_at = ? WHERE id = ?',
            [newQuantity, new Date().toISOString(), item.product_id]
          );
        }
      }
    }

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    updatedOrder.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);

    res.json(updatedOrder);
  } catch (err) {
    console.error('❌ Update order status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Delete order items first to maintain foreign key integrity
    await db.run('DELETE FROM order_items WHERE order_id = ?', [id]);
    await db.run('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
