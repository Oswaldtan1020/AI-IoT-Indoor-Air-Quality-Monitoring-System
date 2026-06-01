app.get("/test-openai", async (req, res) => {
  try {
    const OpenAI = require("openai");
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say hello if the API is working." }
      ]
    });

    res.send({
      success: true,
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.send({
      success: false,
      error: err.message
    });
  }
});
