const Groq = require("groq-sdk");
console.log("Groq key exists:", !!process.env.GROQ_API_KEY);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports = async function generateAIRecommendations(data) {
  const { room, status, co2, pm25, temperature, humidity } = data;

  const prompt = `
  You are an indoor air quality expert.

  Analyze the following data and return ONLY a list of concise action items.
  Do NOT include introductions, explanations, or titles.
  Each item must be a short action phrase.

  Room: ${room}
  Status: ${status}
  Temperature: ${temperature} °C
  Humidity: ${humidity} %
  CO2: ${co2} ppm
  PM2.5: ${pm25} µg/m³
  `;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4
  });

  const text = completion.choices[0].message.content;

  // 🔑 Convert AI text → array (frontend expects array)
  const actions = text
    .split("\n")
    .map(line =>
      line
        .replace(/^[-•*]\s*/, "")       // remove bullets *, -, •
        .replace(/^Based on.*?:/i, "")  // remove intro sentence
        .trim()
    )
    .filter(line =>
      line.length > 5 &&
      !line.toLowerCase().includes("recommendation")
    )

  return {
    status,
    actions
  };
};