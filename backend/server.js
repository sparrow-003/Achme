require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");

// ── Fail fast if required env vars are missing ──────────────────────────────
const REQUIRED_ENV = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("   Copy backend/.env.example to backend/.env and fill in the values.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// ── CORS ─────────────────────────────────────────────────────────────────────
// In production set ALLOWED_ORIGIN in your .env, e.g. https://yourdomain.com
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:3001";
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? allowedOrigin : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/Telecalls", require("./routes/telecallRoutes"));
app.use("/api/Walkins", require("./routes/walkinRoutes"));
app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/task", require("./routes/taskRoutes"));
app.use("/api/Fields", require("./routes/fieldRoutes"));
app.use("/api/client", require("./routes/newclient"));
app.use("/api/invoice", require("./routes/invoice"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/estimate-client", require("./routes/newestimates"));
app.use("/api/estimate", require("./routes/estimate"));
app.use("/api/contract", require("./routes/contract"));
app.use("/api/teammember", require("./routes/team"));
app.use("/api/performainvoice", require("./routes/performaInvoiceRoutes"));
app.use("/api/estimate-invoice", require("./routes/estimateInvoiceRoutes"));
app.use("/api/service-estimation", require("./routes/serviceEstimationRoutes"));
app.use("/api/call-reports", require("./routes/callReportRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/leads", require("./routes/leadManagementRoutes"));

// Start reminder escalation scheduler
require("./backendutil/reminderScheduler");
app.use("/uploads", express.static("uploads"));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Either stop the process currently listening on port ${PORT} or set a different PORT in backend/.env.`);
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`);
});
