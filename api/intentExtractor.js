// api/intentExtractor.js

async function extractIntentAndProperty(message) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  // If GROQ API key is not available, fall back to a simple deterministic extractor
  if (!apiKey) {
    try {
      const text = String(message || '').toLowerCase();
      // quick heuristics
      if (/\b(pool|hot tub)\b/.test(text)) {
        return {
          intent: 'dataset_query',
          propertyName: null,
          informationToFind: 'properties with pool',
          datasetIntentType: 'properties_with_pool',
          datasetOwnerName: null,
          datasetValue: null,
          inputMessage: message,
        }
      }
      if (/\bwifi|wi-?fi|internet\b/.test(text)) {
        // try to capture unit number like 'unit 5' or '#5'
        const m = text.match(/(?:unit\s*#?\s*|#)(\d+)/)
        const unit = m ? `Unit ${m[1]}` : null
        return {
          intent: unit ? 'property_query' : 'dataset_query',
          propertyName: unit,
          informationToFind: 'wifi',
          datasetIntentType: unit ? null : 'properties_with_wifi_speed_above',
          datasetOwnerName: null,
          datasetValue: null,
          inputMessage: message,
        }
      }
      if (/\bhi\b|\bhello\b|\bhey\b/.test(text)) {
        return { intent: 'greeting', propertyName: null, informationToFind: null, datasetIntentType: null, datasetOwnerName: null, datasetValue: null, inputMessage: message }
      }
      // fallback: try to detect price queries
      const priceMatch = text.match(/\$(\d+)/)
      if (priceMatch) {
        return { intent: 'dataset_query', propertyName: null, informationToFind: `properties above $${priceMatch[1]}`, datasetIntentType: 'properties_above_price', datasetOwnerName: null, datasetValue: priceMatch[1], inputMessage: message }
      }
      return { intent: 'other', propertyName: null, informationToFind: null, datasetIntentType: null, datasetOwnerName: null, datasetValue: null, inputMessage: message }
    } catch (err) {
      console.warn('Fallback extractor failed, defaulting to other intent', err)
      return { intent: 'other', propertyName: null, informationToFind: null, datasetIntentType: null, datasetOwnerName: null, datasetValue: null, inputMessage: message }
    }
  }

  const systemPrompt = `
You are an information extractor for a property AI assistant for Dream State.

Your job is to take a single guest message and return a JSON object with this EXACT shape:

{
  "intent": "property_query" | "dataset_query" | "greeting" | "other",
  "propertyName": string | null,
  "informationToFind": string | null,
  "datasetIntentType": string | null,
  "datasetOwnerName": string | null,
  "datasetValue": string | null,
  "inputMessage": string
}

INTENT CLASSIFICATION:
- "property_query": User asks about a SPECIFIC property (e.g., "What's the WiFi at Unit 5?")
- "dataset_query": User asks about MULTIPLE properties or global stats (e.g., "Which properties have pools?")
- "greeting": User greets the bot (e.g., "Hi", "Hello", "How are you?")
- "other": Everything else

PROPERTY QUERY FIELDS:
- Set "propertyName" to the unit number or property title the user mentions
- Set "informationToFind" to what they're asking about (e.g., "WiFi password", "check-in time", "parking")

DATASET QUERY TYPES (set datasetIntentType to one of these):
- "owner_with_most_properties": "Which owner has the most properties?"
- "count_properties_by_owner": "How many properties does [owner] have?"
- "list_properties_by_owner": "List all properties owned by [owner]"
- "properties_with_pool": "Which properties have a pool?" OR "Properties with hot tubs?"
- "properties_without_cameras": "Which properties don't have cameras?"
- "highest_rated_property": "What's the highest-rated property?"
- "lowest_rated_property": "What's the lowest-rated property?"
- "properties_above_price": "Show properties above \$X per night"
- "properties_by_beds": "Properties with X bedrooms?"
- "properties_by_max_guests": "Which properties sleep X guests?"
- "properties_with_wifi_speed_above": "Properties with WiFi faster than X Mbps?"
- "properties_by_style": "Which property is a mansion?" OR "Properties with mansion style?" OR "Which properties are [style]?"
- "properties_by_type": "Which properties are [type]?" OR "Show me [type] properties"
- "list_all_areas": "Show all areas where properties are located" OR "What areas do you have properties in?"
- "properties_in_area": "Which properties are in [area]?" OR "Properties in [city, state]?"
- "properties_near_each_other": "Which properties are near to each other?" OR "Properties close to each other?"

FOR DATASET QUERIES:
- Set "datasetOwnerName" if the user mentions an owner name
- Set "datasetValue" if the user provides a threshold (price, guest count, WiFi speed, bedrooms, etc.) OR a style/type (e.g., "mansion", "villa", "apartment")

EXAMPLES:
User: "What's the WiFi password at Unit 5?"
→ intent: "property_query", propertyName: "Unit 5", informationToFind: "WiFi password"

User: "Which properties have pools?"
→ intent: "dataset_query", datasetIntentType: "properties_with_pool"

User: "How many properties does John own?"
→ intent: "dataset_query", datasetIntentType: "count_properties_by_owner", datasetOwnerName: "John"

User: "Show me properties above \$150 per night"
→ intent: "dataset_query", datasetIntentType: "properties_above_price", datasetValue: "150"

User: "Which property is a mansion?"
→ intent: "dataset_query", datasetIntentType: "properties_by_style", datasetValue: "mansion"

User: "Which properties are mansion style?"
→ intent: "dataset_query", datasetIntentType: "properties_by_style", datasetValue: "mansion"

User: "Show all areas where properties are located"
→ intent: "dataset_query", datasetIntentType: "list_all_areas"

User: "Which properties are in Casa Grande, Arizona?"
→ intent: "dataset_query", datasetIntentType: "properties_in_area", datasetValue: "Casa Grande, Arizona"

User: "Properties in Las Vegas?"
→ intent: "dataset_query", datasetIntentType: "properties_in_area", datasetValue: "Las Vegas"

User: "Which properties are near each other?"
→ intent: "dataset_query", datasetIntentType: "properties_near_each_other"

User: "Hi there!"
→ intent: "greeting"

User: "What's your favorite color?"
→ intent: "other"

IMPORTANT:
- Always return valid JSON
- Never hallucinate datasetIntentType values—only use types from the list above
- If unsure of the exact match, set intent to "other"
`.trim();

  const payload = {
    model,
    temperature: 0,
    response_format: { type: "json_object" },
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
    throw new Error(`Groq extractor error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content =
    data?.choices?.[0]?.message?.content ||
    '{"intent":"other","propertyName":null,"informationToFind":null,"datasetIntentType":null,"datasetOwnerName":null,"datasetValue":null,"inputMessage":""}';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.warn("Failed to parse Groq JSON, content:", content);
    parsed = {
      intent: "other",
      propertyName: null,
      informationToFind: null,
      datasetIntentType: null,
      datasetOwnerName: null,
      datasetValue: null,
      inputMessage: message,
    };
  }

  return {
    intent: parsed.intent || "other",
    propertyName: parsed.propertyName ?? null,
    informationToFind: parsed.informationToFind ?? null,
    datasetIntentType: parsed.datasetIntentType ?? null,
    datasetOwnerName: parsed.datasetOwnerName ?? null,
    datasetValue: parsed.datasetValue ?? null,
    inputMessage: parsed.inputMessage || message,
  };
}

module.exports = { extractIntentAndProperty };
