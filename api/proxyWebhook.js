// api/proxyWebhook.js

// Load local .env for local development so process.env is populated
try {
  require('dotenv').config()
} catch (e) {
  // ignore
}

const { extractIntentAndProperty } = require("./intentExtractor.js");
const { generateGeneralReply } = require("./generalReply.js");
const { resolveFieldType } = require("./fieldTypeResolver.js");
const { handlePropertyQuery, handleDatasetQuery } = require("./propertyHandler.js");

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Ensure we have a parsed body (Vercel may parse JSON already)
  let body = req.body;
  if (!body) {
    body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(data || "{}"));
        } catch (e) {
          resolve({ raw: data });
        }
      });
      req.on("error", () => resolve({}));
    });
  }

  const message = body?.message || body?.inputMessage || body?.text || "";
  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in request body" });
  }

  try {
    const extracted = await extractIntentAndProperty(message);

    const { fieldType, datasetHint } = resolveFieldType(
      extracted.informationToFind,
      extracted.inputMessage
    );

    // attach resolution hints for downstream handlers
    extracted.fieldType = fieldType;
    extracted.datasetHint = datasetHint;

    let reply;
    if (extracted.intent === "property_query") {
      reply = await handlePropertyQuery(extracted);
    } else if (extracted.intent === "dataset_query") {
      reply = await handleDatasetQuery(extracted);
    } else {
      reply = await generateGeneralReply(message);
    }

    // Handle both string and structured responses
    const isStructuredResponse = typeof reply === 'object' && reply !== null && reply.type;
    const replyText = isStructuredResponse ? reply.message : reply;

    return res.status(200).json({ 
      reply: replyText, 
      extracted,
      ...(isStructuredResponse && { structured: reply })
    });
  } catch (err) {
    // Log error with stack for local debugging but avoid leaking secrets in response
    console.error("proxyWebhook error:", err && err.stack ? err.stack : err);
    const msg = err && err.message ? err.message : 'Internal server error'
    return res.status(500).json({ error: msg });
  }
};
