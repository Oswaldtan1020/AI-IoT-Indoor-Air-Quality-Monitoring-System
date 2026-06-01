require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require("groq-sdk");

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());

// ================================
// Basic Root Route
// ================================
app.get('/', (req, res) => res.json({ message: 'IAQ API running' }));

// ================================
// AI ROUTES (place BEFORE /api routes)
// ================================
app.get("/test-ai", async (req, res) => {
  try {
    const result = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "user", content: "Say exactly: AI OK" }
      ]
    });

    res.json({ reply: result.choices[0].message.content.trim() });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/iaq/suggest", async (req, res) => {
  try {
    const { temperature, humidity, co2 } = req.body;

    const prompt = `
      You are an Indoor Air Quality (IAQ) assistant for a building management system.

      Sensor data:
      - Temperature: ${temperature}°C
      - Humidity: ${humidity}%
      - CO2: ${co2} ppm

      Rules:
      - If CO2 <= 1000 → air quality is GOOD
      - If CO2 > 1000 and <= 2000 → air quality is WARNING
      - If CO2 > 2000 → air quality is DANGEROUS

      Instructions:
      - DO NOT write a paragraph
      - DO NOT explain theory
      - ONLY give practical actions
      - MAX 3 bullet points

      Reply format EXACTLY like this:

      Status: <GOOD | WARNING | DANGEROUS>
      • Action 1
      • Action 2
      • Action 3 (if needed)
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.choices[0].message.content.trim();

    // --- Simple parser: first line = status, others = bullets ---
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    let status = "";
    const actions = [];

    lines.forEach(line => {
      if (line.toLowerCase().startsWith("status:")) {
        status = line.split(":")[1].trim();
      } else {
        // remove leading "•" or "-" if present
        actions.push(line.replace(/^[-•]\s*/, "").trim());
      }
    });

    return res.json({ status, actions, raw: text });

  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// IMPORT API ROUTES (AFTER AI ROUTES)
// ================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require("./routes/user");
const iaqRoutes = require("./routes/iaq");

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api", iaqRoutes);

// ================================
// SERVER START
// ================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
