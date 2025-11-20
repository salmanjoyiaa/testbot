// api/propertyHandler.js

const { google } = require("googleapis");

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = "Info";

let cache = {
  timestamp: 0,
  rows: null,
  headers: null,
};

const FIELD_TO_COLUMNS = {
  wifi_login: ["Wifi Login", "WIFI INFO", "WIFI INFO ", "WIFI INFORMATION/ LOGIN"],
  wifi_details: ["Wifi Login", "WIFI INFO", "WIFI INFO ", "WIFI INFORMATION/ LOGIN"],
  wifi_speed: ["Wifi Speed (Mbps) on Listing"],
  wifi_provider: ["Wifi Provider Routerr"],
  door_lock_code: ["Lock Codes\nand Info", "Lock Codes and Info", "Door Lock"],
  owners_closet_code: ["Owners closet code"],
  storage_room_password: ["Storage Room password."],
  trash_info: ["Trash  Info", "Trash Info", "Trash Can info."],
  trash_process: ["Trash Process"],
  trash_day_reminder: ["Trash Day Reminder"],
  parking: ["Parking"],
  quiet_hours: ["Quite Hours"],
  pool_info: ["Pool and Hot tube"],
  pool_temperature: ["Temperature of Pool"],
  pool_fence_gate: ["Pool Fence / Gate"],
  owner_name: ["Property Owner name"],
  handyman_number: ["Handyman Number"],
  property_manager: ["Property Manger"],
  checkin_checkout: ["Check-ins/Check-out"],
  early_late_fee_link: ["Fee link for Early check-in/ Late check-out"],
  bbq_grill: ["BBQ Grill"],
  events_policy: ["Events"],
  pet_party_smoking_policy: ["Pet/Party/smoking"],
  camera_location: ["Camera Location"],
  additional_amenities: ["Additonal Amenities"],
  air_mattress: ["Air Matress"],
  supplies_provided: ["Supplies provided"],
  first_aid_fire_extinguisher: ["First Aid Kit & Fire Extinguisher"],
  washer_dryer: ["Washer & Dryer"],
  extra_pillows_bedding: ["Extra Pillows/Bedding"],
  additional_notes: ["Additional Notes"],
  price: ["Price"],
  property_type: ["Type"],
  floor: ["Floor"],
  style: ["Style"],
  bed_bath: ["Bed x Bath"],
  max_guests: ["Max Guests"],
  airbnb_link: ["Airbnb Listing Link"],
  cover_photo: ["Cover Photo"],
  guest_fav: ["Guest Fav?"],
  airbnb_rating: ["Airbnb Rating"],
  address: ["Address"],
  area: ["Property By Area", "Area", "Location Area"],
};

async function loadSheet() {
  const now = Date.now();
  if (cache.rows && now - cache.timestamp < 10 * 60 * 1000) {
    return cache;
  }

  if (!SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID environment variable.");
  }

  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const normalizedPrivateKey = rawKey.includes("\\n")
    ? rawKey.replace(/\\n/g, "\n")
    : rawKey;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GCLOUD_PROJECT_ID,
      private_key: normalizedPrivateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_TAB,
  });

  const rows = result.data.values || [];
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);

  cache = {
    timestamp: now,
    rows: dataRows,
    headers,
  };

  return cache;
}

function normalize(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeHeader(str) {
  return String(str || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function findColumnIndex(headers, desiredName) {
  const target = normalizeHeader(desiredName);
  for (let i = 0; i < headers.length; i++) {
    if (normalizeHeader(headers[i]) === target) {
      return i;
    }
  }
  return -1;
}

function fuzzyMatch(query, target) {
  if (!query || !target) return 0;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (q === t) return 1.0;
  if (t.includes(q) || q.includes(t)) return 0.9;
  
  // Simple Levenshtein distance
  const distance = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  return maxLen === 0 ? 0 : 1 - (distance / maxLen);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function matchProperty(propertyName, rows, headers) {
  if (!propertyName) return { match: null, suggestions: [] };
  const target = normalize(propertyName);
  const unitIndex = findColumnIndex(headers, "Unit #");
  const titleIndex = findColumnIndex(headers, "Address");
  
  let bestMatch = null;
  let bestScore = 0;
  const suggestions = [];
  
  for (const row of rows) {
    const unit = normalize(row[unitIndex] || "");
    const title = normalize(row[titleIndex] || "");
    const unitRaw = row[unitIndex] || "";
    const titleRaw = row[titleIndex] || "";
    
    // Priority 1: Exact unit match (most important)
    if (unit === target) {
      return { match: row, suggestions: [] };
    }
    
    // Priority 2: Check if target is just a unit number that matches
    if (target.match(/^\d+$/) && unit === target) {
      return { match: row, suggestions: [] };
    }
    
    // Priority 3: Check if target is digits and matches beginning of unit
    if (target.match(/^\d+$/) && unit.startsWith(target)) {
      if (bestScore < 0.95) {
        bestScore = 0.95;
        bestMatch = row;
      }
      continue;
    }
    
    // Priority 4: Fuzzy matching on unit first, then title
    const unitScore = fuzzyMatch(target, unit);
    
    // Only consider title match if unit score is very low
    let score = unitScore;
    if (unitScore < 0.3) {
      const titleScore = fuzzyMatch(target, title);
      score = titleScore;
    } else {
      score = unitScore;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = row;
    }
    
    // Collect suggestions (similar matches)
    if (score > 0.5 && score < 0.9) {
      suggestions.push({
        unit: unitRaw,
        title: titleRaw,
        score: score
      });
    }
  }
  
  // Return match if score is good enough (>= 0.6)
  if (bestScore >= 0.6) {
    return { 
      match: bestMatch, 
      suggestions: suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(s => s.unit || s.title)
    };
  }
  
  // Return top suggestions if no good match
  return { 
    match: null, 
    suggestions: suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.unit || s.title)
  };
}

function makeRecords(rows, headers) {
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    return obj;
  });
}

function extractPropertyDetails(record, headers) {
  const unit = record["Unit #"] || "";
  const address = record["Address"] || "";
  // Use the marketing title from the sheet (do not fall back to the address)
  // This keeps the sheet Address separate and allows the UI to render the
  // marketing title under the Unit badge and the Address as a secondary line.
  const title = record["Title on Listing's Site"] || "";
  const priceCol = findColumnIndex(headers, "Price");
  const price = priceCol !== -1 ? record[headers[priceCol]] : "";
  const typeCol = findColumnIndex(headers, "Type");
  const type = typeCol !== -1 ? record[headers[typeCol]] : "";
  const bedBathCol = findColumnIndex(headers, "Bed x Bath");
  const bedBath = bedBathCol !== -1 ? record[headers[bedBathCol]] : "";
  const maxGuestsCol = findColumnIndex(headers, "Max Guests");
  const maxGuests = maxGuestsCol !== -1 ? record[headers[maxGuestsCol]] : "";
  const ratingCol = findColumnIndex(headers, "Airbnb Rating");
  const rating = ratingCol !== -1 ? record[headers[ratingCol]] : "";
  const areaCol = findColumnIndex(headers, "Property By Area");
  const area = areaCol !== -1 ? record[headers[areaCol]] : "";
  
  const poolCol = findColumnIndex(headers, "Pool and Hot tube");
  const cameraCol = findColumnIndex(headers, "Camera Location");
  const wifiCol = findColumnIndex(headers, "Wifi Login");
  
  const hasPool = poolCol !== -1 && record[headers[poolCol]] && String(record[headers[poolCol]]).trim() !== "";
  const hasCamera = cameraCol !== -1 && record[headers[cameraCol]] && String(record[headers[cameraCol]]).trim() !== "";
  const hasWifi = wifiCol !== -1 && record[headers[wifiCol]] && String(record[headers[wifiCol]]).trim() !== "";

  return {
    unit: String(unit).trim(),
    address: String(address).trim(),
    title: String(title).trim(),
    price: String(price).replace(/[^\d.]/g, "").trim() || "0",
    type: String(type).toLowerCase().trim(),
    bedBath: String(bedBath).trim(),
    maxGuests: String(maxGuests).trim(),
    rating: String(rating).trim(),
    area: String(area).trim(),
    hasPool: !!hasPool,
    hasCamera: !!hasCamera,
    hasWifi: !!hasWifi,
  };
}

// Convert rows/records into structured property details used by the UI
function toStructuredProperties(records, headers) {
  return records.map(rec => extractPropertyDetails(rec, headers));
}

function propertyResultsResponse(message, properties, viewType = 'dataset_results', extra = {}) {
  return {
    type: 'property_results',
    message,
    properties,
    viewType,
    ...extra
  }
}

async function handlePropertyQuery(extracted) {
  const { propertyName, fieldType, informationToFind } = extracted;

  if (!propertyName) {
    return "I couldn't identify the property. Can you confirm the name or unit?";
  }

  if (!fieldType) {
    return `I know this is a property question, but I'm not sure what information you're asking: "${informationToFind}".`;
  }

  const { rows, headers } = await loadSheet();
  
  // Validate sheet structure
  if (!rows || rows.length === 0) {
    return "I'm sorry, but I couldn't access the property database. Please try again later.";
  }
  
  const { match: matchedRow, suggestions } = matchProperty(propertyName, rows, headers);

  if (!matchedRow) {
    let response = `I couldn't find any property matching "${propertyName}".`;
    if (suggestions && suggestions.length > 0) {
      response += `\n\nDid you mean one of these?\n${suggestions.map(s => `• ${s}`).join('\n')}`;
    } else {
      response += `\n\nCan you please double-check the property name or unit number?`;
    }
    return response;
  }

  const possibleColumns = FIELD_TO_COLUMNS[fieldType];
  if (!possibleColumns) {
    return `I recognize your question, but I don’t have a column mapped for this type of information ("${fieldType}").`;
  }

  for (const col of possibleColumns) {
    const columnIndex = findColumnIndex(headers, col);
    if (columnIndex === -1) continue;

    const cellValue = matchedRow[columnIndex];
    if (cellValue && String(cellValue).trim() !== "") {
      return formatResponse(propertyName, fieldType, cellValue);
    }
  }

  return `I looked for "${informationToFind}" for **${propertyName}**, but it’s not listed in our records.`;
}

function normalizeOwnerName(owner) {
  return String(owner || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function ownerWithMostProperties(records) {
  const countByOwner = {};
  const displayNameByOwner = {};
  for (const rec of records) {
    const ownerRaw = rec["Property Owner name"];
    if (!ownerRaw) continue;
    const key = normalizeOwnerName(ownerRaw);
    if (!key) continue;
    countByOwner[key] = (countByOwner[key] || 0) + 1;
    displayNameByOwner[key] = ownerRaw;
  }
  let bestKey = null;
  let bestCount = 0;
  for (const [key, count] of Object.entries(countByOwner)) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }
  if (!bestKey) return null;
  return {
    ownerName: displayNameByOwner[bestKey],
    count: bestCount,
  };
}

function filterRecordsByOwner(records, ownerQuery) {
  if (!ownerQuery) return [];
  const target = normalizeOwnerName(ownerQuery);
  return records.filter((rec) => {
    const ownerRaw = rec["Property Owner name"];
    if (!ownerRaw) return false;
    const key = normalizeOwnerName(ownerRaw);
    return key.includes(target) || target.includes(key);
  });
}

function countPropertiesByOwner(records, ownerQuery) {
  const filtered = filterRecordsByOwner(records, ownerQuery);
  if (filtered.length === 0) return null;
  const nameCount = {};
  for (const rec of filtered) {
    const ownerRaw = rec["Property Owner name"];
    nameCount[ownerRaw] = (nameCount[ownerRaw] || 0) + 1;
  }
  let bestName = ownerQuery;
  let bestCount = 0;
  for (const [name, count] of Object.entries(nameCount)) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }
  return {
    ownerName: bestName,
    count: filtered.length,
  };
}

function listPropertiesByOwner(records, ownerQuery) {
  const filtered = filterRecordsByOwner(records, ownerQuery);
  if (filtered.length === 0) return null;
  const results = filtered.map((rec) => {
    const unit = rec["Unit #"] || "";
    const title = rec["Address"] || "";
    if (unit && title) return `Unit ${unit} – ${title}`;
    if (unit) return `Unit ${unit}`;
    if (title) return title;
    return "(Unnamed property)";
  });
  const nameCount = {};
  for (const rec of filtered) {
    const ownerRaw = rec["Property Owner name"];
    nameCount[ownerRaw] = (nameCount[ownerRaw] || 0) + 1;
  }
  let bestName = ownerQuery;
  let bestCount = 0;
  for (const [name, count] of Object.entries(nameCount)) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }
  return {
    ownerName: bestName,
    properties: results,
  };
}

async function handleDatasetQuery(extracted) {
  const { datasetIntentType, datasetOwnerName } = extracted;

  if (!datasetIntentType) {
    return "I’m not completely sure what you’d like to know about our properties. Could you rephrase your question?";
  }

  const { rows, headers } = await loadSheet();
  const records = makeRecords(rows, headers);

  switch (datasetIntentType) {
    case "owner_with_most_properties": {
      const result = ownerWithMostProperties(records);
      if (!result) {
        return "I couldn’t find any owner information in the sheet.";
      }
      return `Right now, **${result.ownerName}** has the most Dream State properties in my records, with **${result.count}** units.`;
    }

    case "count_properties_by_owner": {
      if (!datasetOwnerName) {
        return "Sure, I can check that — which owner would you like me to look up?";
      }
      const result = countPropertiesByOwner(records, datasetOwnerName);
      if (!result) {
        return `I couldn't find any properties for an owner like "${datasetOwnerName}".`;
      }
      return `**${result.ownerName}** currently has **${result.count}** properties in my data.`;
    }

    case "list_properties_by_owner": {
      if (!datasetOwnerName) {
        return "I can list properties by owner — which owner would you like to see?";
      }
      const result = listPropertiesByOwner(records, datasetOwnerName);
      if (!result) {
        return `I couldn't find any properties for an owner like "${datasetOwnerName}".`;
      }
      // Return structured property results so UI can present them consistently
      const filtered = filterRecordsByOwner(records, datasetOwnerName);
      const props = filtered.map(rec => extractPropertyDetails(rec, headers));
      const message = `Here are the properties I have for **${result.ownerName}**`;
      return propertyResultsResponse(message, props, 'owner_specific', { ownerName: result.ownerName });
    }

    case "properties_with_pool": {
      const poolCol = findColumnIndex(headers, "Pool and Hot tube");
      if (poolCol === -1) {
        return "I don't have pool information in my records.";
      }
      const properties = records
        .filter((rec) => rec[headers[poolCol]] && String(rec[headers[poolCol]]).trim())
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          if (unit && title) return `Unit ${unit} – ${title}`;
          if (unit) return `Unit ${unit}`;
          if (title) return title;
          return "(Unnamed)";
        });
      if (properties.length === 0) {
        return "I don't have any properties with pool information listed.";
      }
      const poolProperties = records
        .filter((rec) => rec[headers[poolCol]] && String(rec[headers[poolCol]]).trim())
        .map(rec => extractPropertyDetails(rec, headers));
      return propertyResultsResponse("Here are the properties with pool/hot tub availability", poolProperties, 'pool_specific');
    }

    case "properties_without_cameras": {
      const cameraCol = findColumnIndex(headers, "Camera Location");
      if (cameraCol === -1) {
        return "I don't have camera information in my records.";
      }
      const properties = records
        .filter((rec) => !rec[headers[cameraCol]] || !String(rec[headers[cameraCol]]).trim())
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          if (unit && title) return `Unit ${unit} – ${title}`;
          if (unit) return `Unit ${unit}`;
          if (title) return title;
          return "(Unnamed)";
        });
      if (properties.length === 0) {
        return "All properties in my records have camera locations listed.";
      }
      const cameraProperties = records
        .filter((rec) => !rec[headers[cameraCol]] || !String(rec[headers[cameraCol]]).trim())
        .map(rec => extractPropertyDetails(rec, headers));
      return propertyResultsResponse("Here are the properties without camera locations", cameraProperties, 'camera_filtered');
    }

    case "highest_rated_property": {
      const ratingCol = findColumnIndex(headers, "Airbnb Rating");
      if (ratingCol === -1) {
        return "I don't have Airbnb rating information in my records.";
      }
      let maxRating = -1;
      let topProperty = null;
      for (const rec of records) {
        const rating = parseFloat(rec[headers[ratingCol]]);
        if (!isNaN(rating) && rating > maxRating) {
          maxRating = rating;
          topProperty = rec;
        }
      }
      if (!topProperty) {
        return "I couldn't find any ratings in my records.";
      }
      const unit = topProperty["Unit #"] || "";
      const title = topProperty["Address"] || "";
      const propertyName = unit && title ? `Unit ${unit} – ${title}` : (unit || title || "(Unnamed)");
      return `**${propertyName}** is the highest-rated property with a **${maxRating}** Airbnb rating.`;
    }

    case "lowest_rated_property": {
      const ratingCol = findColumnIndex(headers, "Airbnb Rating");
      if (ratingCol === -1) {
        return "I don't have Airbnb rating information in my records.";
      }
      let minRating = Infinity;
      let bottomProperty = null;
      for (const rec of records) {
        const rating = parseFloat(rec[headers[ratingCol]]);
        if (!isNaN(rating) && rating < minRating) {
          minRating = rating;
          bottomProperty = rec;
        }
      }
      if (!bottomProperty) {
        return "I couldn't find any ratings in my records.";
      }
      const unit = bottomProperty["Unit #"] || "";
      const title = bottomProperty["Address"] || "";
      const propertyName = unit && title ? `Unit ${unit} – ${title}` : (unit || title || "(Unnamed)");
      return `**${propertyName}** is the lowest-rated property with a **${minRating}** Airbnb rating.`;
    }

    case "properties_above_price": {
      if (!extracted.datasetValue) {
        return "What price threshold would you like me to check? (e.g., 'above $200 per night')";
      }
      const priceCol = findColumnIndex(headers, "Price");
      if (priceCol === -1) {
        return "I don't have price information in my records.";
      }
      const threshold = parseFloat(extracted.datasetValue);
      if (isNaN(threshold)) {
        return `I couldn't parse the price "${extracted.datasetValue}".`;
      }
      const properties = records
        .filter((rec) => {
          const price = parseFloat(rec[headers[priceCol]]);
          return !isNaN(price) && price >= threshold;
        })
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          const price = rec[headers[priceCol]] || "";
          const display = unit && title ? `Unit ${unit} – ${title}` : (unit || title || "(Unnamed)");
          return `${display} – $${price}`;
        });
      if (properties.length === 0) {
        return `I don't have any properties listed at $${threshold} or above.`;
      }
      const filteredProps = records
        .filter((rec) => {
          const price = parseFloat(rec[headers[priceCol]]);
          return !isNaN(price) && price >= threshold;
        })
        .map(rec => extractPropertyDetails(rec, headers));
      return propertyResultsResponse(`Here are properties at **$${threshold}** or above`, filteredProps, 'price_filtered');
    }

    case "properties_by_beds": {
      if (!extracted.datasetValue) {
        return "How many bedrooms are you looking for?";
      }
      const bedCol = findColumnIndex(headers, "Bed x Bath");
      if (bedCol === -1) {
        return "I don't have bedroom information in my records.";
      }
      const searchBeds = String(extracted.datasetValue).toLowerCase();
      const properties = records
        .filter((rec) => String(rec[headers[bedCol]] || "").toLowerCase().includes(searchBeds))
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          const beds = rec[headers[bedCol]] || "";
          const display = unit && title ? `Unit ${unit} – ${title}` : (unit || title || "(Unnamed)");
          return `${display} – ${beds}`;
        });
      if (properties.length === 0) {
        return `I don't have any properties with "${extracted.datasetValue}" bedrooms listed.`;
      }
        const props = properties
          .map(p => matchProperty(p, rows, headers).match)
          .filter(Boolean)
          .map(rec => extractPropertyDetails(rec, headers));
        return propertyResultsResponse(`Here are properties with **${extracted.datasetValue}** bedrooms`, props, 'beds_filtered');
    }

    case "properties_by_max_guests": {
      if (!extracted.datasetValue) {
        return "How many guests do you need to accommodate?";
      }
      const guestCol = findColumnIndex(headers, "Max Guests");
      if (guestCol === -1) {
        return "I don't have guest capacity information in my records.";
      }
      const guestNum = parseInt(extracted.datasetValue);
      if (isNaN(guestNum)) {
        return `I couldn't parse the guest count "${extracted.datasetValue}".`;
      }
      const properties = records
        .filter((rec) => {
          const max = parseInt(rec[headers[guestCol]]);
          return !isNaN(max) && max >= guestNum;
        })
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          const guests = rec[headers[guestCol]] || "";
          const display = unit && title ? `Unit ${unit} – ${title}` : (unit || title || "(Unnamed)");
          return `${display} – sleeps **${guests}**`;
        });
      if (properties.length === 0) {
        return `I don't have any properties that sleep **${guestNum}** or more guests.`;
      }
        const props = properties
          .map(p => matchProperty(p, rows, headers).match)
          .filter(Boolean)
          .map(rec => extractPropertyDetails(rec, headers));
        return propertyResultsResponse(`Here are properties that accommodate **${guestNum}** or more guests`, props, 'guest_filtered');
    }

    case "properties_with_wifi_speed_above": {
      if (!extracted.datasetValue) {
        return "What WiFi speed threshold are you looking for? (e.g., '50 Mbps')";
      }
      const wifiSpeedCol = findColumnIndex(headers, "Wifi Speed (Mbps) on Listing");
      if (wifiSpeedCol === -1) {
        return "I don't have WiFi speed information in my records.";
      }
      const threshold = parseFloat(extracted.datasetValue);
      if (isNaN(threshold)) {
        return `I couldn't parse the WiFi speed "${extracted.datasetValue}".`;
      }
      const properties = records
        .filter((rec) => {
          const speed = parseFloat(rec[headers[wifiSpeedCol]]);
          return !isNaN(speed) && speed >= threshold;
        })
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          const speed = rec[headers[wifiSpeedCol]] || "";
          const display = unit && title ? `Unit ${unit} – ${title}` : (unit || title || "(Unnamed)");
          return `${display} – **${speed} Mbps**`;
        });
      if (properties.length === 0) {
        return `I don't have any properties with WiFi speed of **${threshold} Mbps** or above.`;
      }
        const props = properties
          .map(p => matchProperty(p, rows, headers).match)
          .filter(Boolean)
          .map(rec => extractPropertyDetails(rec, headers));
        return propertyResultsResponse(`Here are properties with **${threshold} Mbps** WiFi or faster`, props, 'wifi_speed_filtered');
    }

    case "properties_by_style": {
      if (!extracted.datasetValue) {
        return "What style are you looking for? (e.g., mansion, villa, apartment, etc.)";
      }
      const styleCol = findColumnIndex(headers, "Style");
      if (styleCol === -1) {
        return "I don't have style information in my records.";
      }
      const searchStyle = String(extracted.datasetValue).toLowerCase().trim();
      const properties = records
        .filter((rec) => {
          const style = String(rec[headers[styleCol]] || "").toLowerCase();
          return style.includes(searchStyle) || searchStyle.includes(style);
        })
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          const style = rec[headers[styleCol]] || "";
          if (unit && title) return `Unit ${unit} – ${title} (${style})`;
          if (unit) return `Unit ${unit} (${style})`;
          if (title) return `${title} (${style})`;
          return `(Unnamed) (${style})`;
        });
      if (properties.length === 0) {
        return `I don't have any properties with "${extracted.datasetValue}" style in my records.`;
      }
        const props = properties
          .map(p => matchProperty(p, rows, headers).match)
          .filter(Boolean)
          .map(rec => extractPropertyDetails(rec, headers));
        return propertyResultsResponse(`Here are the properties with **${extracted.datasetValue}** style`, props, 'style_filtered');
    }

    case "properties_by_type": {
      if (!extracted.datasetValue) {
        return "What type of property are you looking for? (e.g., house, apartment, condo, etc.)";
      }
      const typeCol = findColumnIndex(headers, "Type");
      if (typeCol === -1) {
        return "I don't have property type information in my records.";
      }
      const searchType = String(extracted.datasetValue).toLowerCase().trim();
      const properties = records
        .filter((rec) => {
          const type = String(rec[headers[typeCol]] || "").toLowerCase();
          return type.includes(searchType) || searchType.includes(type);
        })
        .map((rec) => {
          const unit = rec["Unit #"] || "";
          const title = rec["Address"] || "";
          const type = rec[headers[typeCol]] || "";
          if (unit && title) return `Unit ${unit} – ${title} (${type})`;
          if (unit) return `Unit ${unit} (${type})`;
          if (title) return `${title} (${type})`;
          return `(Unnamed) (${type})`;
        });
      if (properties.length === 0) {
        return `I don't have any properties of type "${extracted.datasetValue}" in my records.`;
      }
        const props = properties
          .map(p => matchProperty(p, rows, headers).match)
          .filter(Boolean)
          .map(rec => extractPropertyDetails(rec, headers));
        return propertyResultsResponse(`Here are the **${extracted.datasetValue}** properties`, props, 'type_filtered');
    }

    case "list_all_areas": {
      const areaCol = findColumnIndex(headers, "Property By Area");
      if (areaCol === -1) {
        return "I don't have area information in my records.";
      }
      const propertiesByArea = {};
      for (const rec of records) {
        const area = rec[headers[areaCol]];
        if (!area || !String(area).trim()) continue;
        const areaKey = String(area).trim();
        if (!propertiesByArea[areaKey]) {
          propertiesByArea[areaKey] = [];
        }
        const details = extractPropertyDetails(rec, headers);
        propertiesByArea[areaKey].push({ ...details, area: areaKey });
      }

      if (Object.keys(propertiesByArea).length === 0) {
        return "I don't have any area information listed in my records.";
      }

      // Return structured response with area data
      return {
        type: "property_results",
        message: "Here are all the areas where we have properties",
        areas: propertiesByArea,
        viewType: "all_properties"
      };
    }

    case "properties_in_area": {
      if (!extracted.datasetValue) {
        return "Which area would you like to explore? (e.g., Casa Grande, Arizona or Las Vegas, Nevada)";
      }
      const areaCol = findColumnIndex(headers, "Property By Area");
      if (areaCol === -1) {
        return "I don't have area information in my records.";
      }
      const searchArea = String(extracted.datasetValue).toLowerCase().trim();
      const matchedProperties = records
        .filter((rec) => {
          const area = String(rec[headers[areaCol]] || "").toLowerCase();
          return area.includes(searchArea) || searchArea.includes(area);
        })
        .map((rec) => {
          const area = String(rec[headers[areaCol]] || "").trim();
          const details = extractPropertyDetails(rec, headers);
          return { area, ...details };
        });

      if (matchedProperties.length === 0) {
        return `I don't have any properties in "${extracted.datasetValue}". Would you like to see all available areas?`;
      }

      // Get the actual area name from first result
      const areaName = matchedProperties[0].area;
      
      return {
        type: "property_results",
        message: `Here are the properties in **${areaName}**`,
        properties: matchedProperties,
        area: areaName,
        viewType: "area_specific"
      };
    }

    case "properties_near_each_other": {
      const areaCol = findColumnIndex(headers, "Property By Area");
      if (areaCol === -1) {
        return "I don't have area information in my records.";
      }
      const propertiesByArea = {};
      for (const rec of records) {
        const area = rec[headers[areaCol]];
        if (!area || !String(area).trim()) continue;
        const areaKey = String(area).trim();
        if (!propertiesByArea[areaKey]) {
          propertiesByArea[areaKey] = [];
        }
        const unit = rec["Unit #"] || "";
        const title = rec["Address"] || "";
        const display = unit && title ? `Unit ${unit} – ${title}` : (unit || title || "(Unnamed)");
        propertiesByArea[areaKey].push(display);
      }
      
      // Filter to areas with multiple properties (properties near each other)
      const nearbyAreas = Object.entries(propertiesByArea)
        .filter(([_, props]) => props.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

      if (nearbyAreas.length === 0) {
        return "I don't have any properties that are near each other (same area) in my records.";
      }

      let response = "Here are properties grouped by area (properties near each other):\n\n";
      for (const [area, props] of nearbyAreas) {
        response += `**${area}** (${props.length} properties):\n`;
        response += props.map((p) => `• ${p}`).join("\n");
        response += "\n\n";
      }
      return response.trim();
    }

    default:
      return "I understand you're asking about our property data, but I haven't been trained to answer that specific type of question yet.";
  }
}

function formatResponse(propertyName, fieldType, value) {
  const friendly = {
    wifi_login: "Here is the Wi-Fi login",
    wifi_details: "Here are the Wi-Fi details",
    wifi_speed: "Here is the Wi-Fi speed",
    wifi_provider: "Here is the Wi-Fi provider",
    door_lock_code: "Here is the door lock code",
    owners_closet_code: "Here is the owners closet code",
    storage_room_password: "Here is the storage room password",
    trash_info: "Trash information",
    trash_process: "Here is the trash process",
    trash_day_reminder: "Trash day reminder",
    parking: "Parking details",
    quiet_hours: "Quiet hours",
    pool_info: "Pool and hot tub information",
    pool_temperature: "Pool temperature",
    pool_fence_gate: "Pool fence / gate information",
    owner_name: "Property owner",
    handyman_number: "Handyman contact",
    property_manager: "Property manager",
    checkin_checkout: "Check-in / Check-out information",
    early_late_fee_link: "Early check-in / late check-out fee link",
    bbq_grill: "BBQ grill information",
    events_policy: "Events policy",
    pet_party_smoking_policy: "Pet / party / smoking policy",
    camera_location: "Camera location",
    additional_amenities: "Additional amenities",
    air_mattress: "Air mattress information",
    supplies_provided: "Supplies provided",
    first_aid_fire_extinguisher: "First aid kit & fire extinguisher information",
    washer_dryer: "Washer & dryer details",
    extra_pillows_bedding: "Extra pillows and bedding",
    additional_notes: "Additional notes",
    price: "Price",
    property_type: "Property type",
    floor: "Floor",
    style: "Style",
    bed_bath: "Bedrooms and bathrooms",
    max_guests: "Maximum guest capacity",
    airbnb_link: "Airbnb listing link",
    cover_photo: "Cover photo",
    guest_fav: "Guest-favorite status",
    airbnb_rating: "Airbnb rating",
    address: "The address is",
    area: "Area location",
  };

  const phrase = friendly[fieldType] || "Here is the information you asked for";

  return `${phrase} for **${propertyName}**:\n\n${value}`;
}

module.exports = {
  handlePropertyQuery,
  handleDatasetQuery,
};
