// api/generalReply.js

async function generateGeneralReply(message) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  // If GROQ API key not present, return a safe fallback reply to avoid function errors during local dev
  if (!apiKey) {
    try {
      const text = String(message || '')
      if (/\bhi\b|\bhello\b|\bhey\b/i.test(text)) {
        return "Hi — I can help with property info like WiFi, parking, and amenities. Try asking about a unit number or property name."
      }
      return "I couldn't reach the AI service right now. I can still help with property-specific questions — try asking about a unit number or property name."
    } catch (err) {
      return "Sorry, I couldn't generate a response at the moment."
    }
  }

  const systemPrompt = `
You are "Property AI", a friendly, casually professional assistant for Dream State properties.

Guidelines:
- Answer the guest's question in a warm, concise, professional tone.
- You ONLY know about Dream State properties, bookings, and stay-related topics.
- NEVER make up or invent property names, addresses, or specific details that you don't have access to.
- If the user asks about specific properties or data you don't have access to, politely say:
  "I don't have that specific information in my records. Could you try asking about a specific unit number or property name? I can help you find information about WiFi, parking, amenities, and more for our properties."
- If the user asks about anything not related to Dream State properties or their stay,
  politely say that you only have information about Dream State properties and try to
  guide them back to property-related questions.
- Keep replies short and conversational (2–5 sentences max).
- Always encourage users to ask about specific properties by unit number or name.
`.trim();

  const payload = {
    model,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Groq general reply error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const reply =
    data?.choices?.[0]?.message?.content ||
    "Sorry, I couldn't generate a response right now.";

  return reply;
}

module.exports = { generateGeneralReply };
