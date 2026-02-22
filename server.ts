import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("mars_loader.db");

// Initialize Database
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    telegram_id TEXT NOT NULL,
    service_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    utr TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );
`);

// Migration: Ensure user_id column exists in orders table
const tableInfo = db.pragma("table_info(orders)") as any[];
const hasUserId = tableInfo.some(col => col.name === 'user_id');
if (!hasUserId) {
  console.log('Migrating database: Adding user_id to orders table...');
  db.exec("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)");
}

// Seed initial services if empty
const serviceCount = db.prepare("SELECT COUNT(*) as count FROM services").get() as { count: number };
if (serviceCount.count === 0) {
  console.log('Seeding default services...');
  const insert = db.prepare("INSERT INTO services (name, price, duration) VALUES (?, ?, ?)");
  insert.run("1 Day Pack", 100, "1 Day");
  insert.run("7 Day Pack", 400, "7 Days");
  insert.run("15 Day Pack", 500, "15 Days");
  insert.run("30 Day Pack", 800, "30 Days");
  insert.run("Full Season", 1500, "Full Season");
  console.log('Seeding complete.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    try {
      db.prepare("SELECT 1").get();
      res.json({ status: "ok", database: "connected" });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(500).json({ status: "error", database: "disconnected" });
    }
  });

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { email, password } = req.body;
    try {
      const insert = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
      const result = insert.run(email, password);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: "Email already registered" });
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
      if (user) {
        res.json({ success: true, user: { id: user.id, email: user.email } });
      } else {
        res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Internal server error during login" });
    }
  });

  // API Routes
  app.get("/api/services", (req, res) => {
    try {
      const services = db.prepare("SELECT * FROM services").all();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.post("/api/orders", (req, res) => {
    const { telegramId, serviceId, amount, userId } = req.body;
    const orderId = "MARS-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    
    try {
      console.log('Attempting to create order:', { orderId, telegramId, serviceId, amount, userId });
      
      if (!telegramId || !serviceId || !amount) {
        return res.status(400).json({ error: "Missing required fields: telegramId, serviceId, or amount" });
      }

      const sId = Number(serviceId);
      const amt = Number(amount);

      if (isNaN(sId) || isNaN(amt)) {
        return res.status(400).json({ error: "Invalid numeric values for serviceId or amount" });
      }

      // Verify service exists
      const service = db.prepare("SELECT id FROM services WHERE id = ?").get(sId);
      if (!service) {
        return res.status(400).json({ error: "Invalid service selected. Please refresh the page." });
      }

      // Verify user exists if userId is provided
      if (userId) {
        const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
        if (!user) {
          return res.status(400).json({ error: "User session invalid. Please logout and login again." });
        }
      }

      const insert = db.prepare("INSERT INTO orders (id, telegram_id, service_id, amount, user_id) VALUES (?, ?, ?, ?, ?)");
      insert.run(orderId, telegramId, sId, amt, userId || null);
      res.json({ orderId });
    } catch (error) {
      console.error('Order creation database error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: "Database error: " + errorMessage });
    }
  });

  app.get("/api/user/orders/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const uId = Number(userId);
      if (isNaN(uId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const orders = db.prepare(`
        SELECT orders.*, services.name as service_name 
        FROM orders 
        LEFT JOIN services ON orders.service_id = services.id
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(uId);
      res.json(orders);
    } catch (error) {
      console.error('Fetch user orders error:', error);
      res.status(500).json({ error: "Failed to fetch your orders" });
    }
  });

  app.post("/api/orders/confirm", (req, res) => {
    const { orderId, utr, status } = req.body;
    try {
      if (status) {
        const update = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
        update.run(status, orderId);
      } else {
        const update = db.prepare("UPDATE orders SET utr = ?, status = 'processing' WHERE id = ?");
        update.run(utr, orderId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Admin Routes
  app.post("/api/admin/login", (req, res) => {
    const { adminId, password } = req.body;
    if (adminId === "MARSDEMON" && password === "MARSSURAJ") {
      res.json({ success: true, token: "mock-admin-token" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/admin/orders/update", (req, res) => {
    const { orderId, telegramId, amount, utr, status } = req.body;
    try {
      if (!orderId) return res.status(400).json({ error: "Order ID is required" });
      
      const update = db.prepare(`
        UPDATE orders 
        SET telegram_id = COALESCE(?, telegram_id),
            amount = COALESCE(?, amount),
            utr = COALESCE(?, utr),
            status = COALESCE(?, status)
        WHERE id = ?
      `);
      update.run(telegramId, amount, utr, status, orderId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin update order error:', error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.get("/api/admin/orders", (req, res) => {
    try {
      // In a real app, verify token here
      const orders = db.prepare(`
        SELECT orders.*, services.name as service_name, users.email as user_email
        FROM orders 
        LEFT JOIN services ON orders.service_id = services.id
        LEFT JOIN users ON orders.user_id = users.id
        ORDER BY created_at DESC
      `).all();
      res.json(orders);
    } catch (error) {
      console.error('Admin fetch orders error:', error);
      res.status(500).json({ error: "Failed to fetch admin orders" });
    }
  });

  app.delete("/api/admin/orders/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM orders WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete order error:', error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  app.post("/api/admin/services", (req, res) => {
    const { name, price, duration } = req.body;
    try {
      if (!name || !price || !duration) {
        return res.status(400).json({ error: "All fields are required" });
      }
      db.prepare("INSERT INTO services (name, price, duration) VALUES (?, ?, ?)").run(name, Number(price), duration);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin create service error:', error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  app.put("/api/admin/services/:id", (req, res) => {
    const { id } = req.params;
    const { name, price, duration } = req.body;
    try {
      const sId = Number(id);
      if (isNaN(sId)) return res.status(400).json({ error: "Invalid service ID" });
      
      db.prepare("UPDATE services SET name = ?, price = ?, duration = ? WHERE id = ?").run(name, Number(price), duration, sId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin update service error:', error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", (req, res) => {
    const { id } = req.params;
    try {
      const sId = Number(id);
      if (isNaN(sId)) return res.status(400).json({ error: "Invalid service ID" });
      
      db.prepare("DELETE FROM services WHERE id = ?").run(sId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete service error:', error);
      res.status(500).json({ error: "Failed to delete service. It might be linked to existing orders." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
