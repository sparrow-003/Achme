const path = require("path");
const fs = require("fs");

require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  multipleStatements: true
});

const schemaPath = path.join(__dirname, "../schema.sql");

function runQuerySafe(sql, description, callback) {
  db.query(sql, (err) => {
    if (err) {
      if (err.message.includes("Duplicate column") || err.message.includes("already exists") || err.message.includes("Duplicate entry")) {
        console.log(`✅ ${description} (already exists)`);
      } else {
        console.error(`❌ ${description}:`, err.message);
      }
    } else {
      console.log(`✅ ${description}`);
    }
    if (callback) callback(err);
  });
}

function ensureColumn(table, column, definition, expectedType, callback) {
  db.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
    [process.env.DB_NAME, table, column],
    (err, rows) => {
      if (err) {
        console.error(`❌ Check column ${table}.${column}:`, err.message);
        return callback(err);
      }
      if (rows.length === 0) {
        runQuerySafe(`ALTER TABLE ${table} ADD COLUMN ${definition}`, `${table}.${column}`, callback);
      } else {
        const type = (rows[0].DATA_TYPE || rows[0].data_type || "").toLowerCase();
        if (expectedType && type !== expectedType.toLowerCase()) {
          runQuerySafe(`ALTER TABLE ${table} MODIFY COLUMN ${definition}`, `${table}.${column} type`, callback);
        } else {
          console.log(`✅ ${table}.${column} exists`);
          callback(null);
        }
      }
    }
  );
}

function ensureTablesAndColumns() {
  const tableStatements = [
    {
      name: "lead_reminders",
      sql: `CREATE TABLE IF NOT EXISTS lead_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        lead_type ENUM('telecall','walkin','field') DEFAULT 'telecall',
        reminder_date DATE,
        reminder_time TIME DEFAULT NULL,
        reminder_notes TEXT,
        status ENUM('Pending','Done','Missed') DEFAULT 'Pending',
        missed_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    },
    {
      name: "lead_activity",
      sql: `CREATE TABLE IF NOT EXISTS lead_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        lead_type ENUM('telecall','walkin','field') DEFAULT 'telecall',
        action VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    },
    {
      name: "lead_escalations",
      sql: `CREATE TABLE IF NOT EXISTS lead_escalations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        lead_type ENUM('telecall','walkin','field') DEFAULT 'telecall',
        customer_name VARCHAR(150),
        mobile_number VARCHAR(20),
        staff_name VARCHAR(150),
        last_followup_date DATE,
        missed_count INT DEFAULT 0,
        status ENUM('Open','Resolved') DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    },
    {
      name: "admin_notifications",
      sql: `CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) DEFAULT 'registration',
        user_id INT,
        message TEXT,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    }
  ];

  const columnChecks = [
    { table: "lead_reminders", column: "reminder_time", definition: "reminder_time TIME DEFAULT NULL", expectedType: "time" },
    { table: "lead_reminders", column: "missed_count", definition: "missed_count INT DEFAULT 0" },
    { table: "lead_escalations", column: "missed_count", definition: "missed_count INT DEFAULT 0" },
    { table: "users", column: "status", definition: "status ENUM('pending','active','rejected') DEFAULT 'pending'", expectedType: "enum" },
    { table: "Telecalls", column: "assigned_to", definition: "assigned_to INT DEFAULT NULL" },
    { table: "Telecalls", column: "created_by", definition: "created_by INT DEFAULT NULL" },
    { table: "Walkins", column: "assigned_to", definition: "assigned_to INT DEFAULT NULL" },
    { table: "Walkins", column: "created_by", definition: "created_by INT DEFAULT NULL" },
    { table: "fields", column: "assigned_to", definition: "assigned_to INT DEFAULT NULL" },
    { table: "fields", column: "created_by", definition: "created_by INT DEFAULT NULL" },
    { table: "quotations", column: "lead_id", definition: "lead_id INT DEFAULT NULL" },
    { table: "quotations", column: "lead_type", definition: "lead_type VARCHAR(20) DEFAULT NULL" }
  ];

  tableStatements.forEach(({ name, sql }) => runQuerySafe(sql, `Create table ${name}`));

  columnChecks.forEach(({ table, column, definition, expectedType }) => {
    ensureColumn(table, column, definition, expectedType, () => {});
  });
}

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }
  console.log("MySQL Connected");

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.query(schema, (err) => {
      if (err) {
        console.error("Database initialization failed:", err.message);
      } else {
        console.log("Database initialized successfully");
      }
      ensureTablesAndColumns();
    });
  } else {
    ensureTablesAndColumns();
  }
});

module.exports = db;
