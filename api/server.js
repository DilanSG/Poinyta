const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.POINYTA_API_KEY;
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const REPORT_TO = process.env.REPORT_TO || "nalidess2002@gmail.com";
const PENDING_FILE = path.join(__dirname, "pending.json");
const PENDING_TMP = PENDING_FILE + ".tmp";

if (!API_KEY) {
  console.error("ERROR: Set the POINYTA_API_KEY environment variable before starting.");
  process.exit(1);
}

console.log(`SendGrid ${SENDGRID_KEY ? "configurado" : "NO CONFIGURADO"} — destino=${REPORT_TO}`);

app.use(express.json());

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
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

function writePending(data) {
  fs.writeFileSync(PENDING_TMP, JSON.stringify(data, null, 2));
  fs.renameSync(PENDING_TMP, PENDING_FILE);
}

function readPending() {
  if (!fs.existsSync(PENDING_FILE)) return [];
  return JSON.parse(fs.readFileSync(PENDING_FILE, "utf8"));
}

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

app.get("/api/expense/pending", auth, (req, res) => {
  res.json(readPending());
});

app.delete("/api/expense/:id", auth, (req, res) => {
  const updated = readPending().filter((e) => e.id !== req.params.id);
  writePending(updated);
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.post("/api/report", auth, async (req, res) => {
  const { description, config } = req.body;
  if (!SENDGRID_KEY) {
    return res.status(500).json({ error: "SendGrid no configurado — define SENDGRID_API_KEY" });
  }
  const body = description
    ? `Descripción:\n${description}\n\n---\n${JSON.stringify(config, null, 2)}`
    : JSON.stringify(config, null, 2);
  try {
    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: REPORT_TO }] }],
        from: { email: REPORT_TO },
        subject: `Reporte Poinyta — ${config?.theme || "desconocido"}`,
        content: [{ type: "text/plain", value: body }],
      }),
    });
    if (!sgRes.ok) {
      const errBody = await sgRes.text().catch(() => "");
      throw new Error(`SendGrid ${sgRes.status}: ${errBody}`);
    }
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error enviando reporte:", msg);
    res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Poinyta sync server running on port ${PORT}`);
});
