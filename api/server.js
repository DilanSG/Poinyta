const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const nodemailer = require("nodemailer");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.POINYTA_API_KEY;
const PENDING_FILE = path.join(__dirname, "pending.json");
const PENDING_TMP = PENDING_FILE + ".tmp";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const REPORT_TO = process.env.REPORT_TO || "nalidess2002@gmail.com";

let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: true },
    lookup: (hostname, options, cb) => dns.lookup(hostname, { ...options, family: 4 }, cb),
  });
}

if (!API_KEY) {
  console.error("ERROR: Set the POINYTA_API_KEY environment variable before starting.");
  process.exit(1);
}

app.use(express.json());

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // crypto.timingSafeEqual requiere buffers del mismo length.
    // Comparamos contra un buffer de longitud igual para evitar
    // filtrar la longitud real via timing.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const prefix = "Bearer ";
  if (!header.startsWith(prefix) || !safeCompare(header.slice(prefix.length), API_KEY)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Escritura atomica: primero escribe a un archivo temporal en el mismo
// filesystem, luego hace rename (operacion atomica en POSIX). Si el
// proceso crashea durante writeFileSync, el archivo original queda intacto.
function writePending(data) {
  fs.writeFileSync(PENDING_TMP, JSON.stringify(data, null, 2));
  fs.renameSync(PENDING_TMP, PENDING_FILE);
}

function readPending() {
  if (!fs.existsSync(PENDING_FILE)) return [];
  return JSON.parse(fs.readFileSync(PENDING_FILE, "utf8"));
}

// n8n POST here — body: { amount, description, category, type }
app.post("/api/expense", auth, (req, res) => {
  const { amount, description, category, type } = req.body;
  if (!amount || !description) {
    return res.status(400).json({ error: "amount and description are required" });
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 999999999) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }
  const entry = {
    id: crypto.randomUUID(),
    amount: parsedAmount,
    description: String(description).slice(0, 500),
    category: String(category || "General").slice(0, 100),
    type: type === "income" ? "income" : "expense",
    date: new Date().toISOString(),
  };
  const pending = readPending();
  pending.push(entry);
  writePending(pending);
  res.json({ ok: true, id: entry.id });
});

// Poinyta app GETs pending transactions
app.get("/api/expense/pending", auth, (req, res) => {
  res.json(readPending());
});

// Poinyta app deletes after importing
app.delete("/api/expense/:id", auth, (req, res) => {
  const updated = readPending().filter((e) => e.id !== req.params.id);
  writePending(updated);
  res.json({ ok: true });
});

// Health check — sin auth, para uptime monitors (evita el sleep de Render free)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Reporte de feedback desde la app
app.post("/api/report", auth, async (req, res) => {
  const { description, config } = req.body;
  if (!transporter) {
    return res.status(500).json({ error: "SMTP no configurado — define SMTP_USER y SMTP_PASS" });
  }
  const body = description
    ? `Descripción:\n${description}\n\n---\n${JSON.stringify(config, null, 2)}`
    : JSON.stringify(config, null, 2);
  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to: REPORT_TO,
      subject: `Reporte Poinyta — ${config?.theme || "desconocido"}`,
      text: body,
    });
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error enviando reporte:", msg);
    res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Poinyta sync server running on port ${PORT}`);
  console.log(`SMTP ${transporter ? "configurado" : "NO CONFIGURADO"} — user=${SMTP_USER ? "✓" : "✗"} pass=${SMTP_PASS ? "✓" : "✗"}`);
  const relevantVars = ["SMTP_USER", "SMTP_PASS", "POINYTA_API_KEY", "REPORT_TO", "SMTP_HOST", "SMTP_PORT"];
  console.log("Env vars check:", relevantVars.map(v => `${v}=${process.env[v] ? "SET" : "MISSING"}`).join(", "));
});
