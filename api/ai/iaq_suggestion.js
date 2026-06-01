import { text } from "body-parser";
import express from "express";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.post("/iaq-suggestion", async (req, res) => {
    try {
        const { room, temperature, humidity, co2, pm25, voc } = req.body;

        function getIAQStatus(co2) {
            if (co2 <= 1000) return "GOOD";
            if (co2 <= 2000) return "WARNING";
            return "DANGEROUS";
        }

        const status = getIAQStatus(co2);

        const prompt = `
        Indoor Air Quality Report

        Room: ${room}
        Temperature: ${temperature} °C
        Humidity: ${humidity} %
        CO₂: ${co2} ppm
        PM2.5: ${pm25} µg/m³

        Current IAQ Status (already determined): ${status}

        TASK:
        - DO NOT change the status
        - ONLY give recommendations suitable for this status
        - Max 3 bullet points
        `;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini", 
            messages: [
                { role: "system", content: "You are an IAQ analysis assistant." },
                { role: "user", content: prompt }
            ]
        });

        res.json({ 
            status,
            actions,
            raw: text
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
