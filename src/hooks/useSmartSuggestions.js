import { useMemo } from 'react'

const CONTEXT_SUGGESTIONS = {
  property_query: [
    "What's the parking situation?",
    "Does it have a pool?",
    "What's the WiFi speed?",
    "Tell me about the amenities",
  ],
  dataset_query: [
    "Show me more properties",
    "What's the price range?",
    "Which properties have the best ratings?",
    "Filter by number of bedrooms",
  ],
  pool: [
    "Which properties have hot tubs?",
    "Properties with pool access?",
    "What's the pool temperature?",
  ],
  wifi: [
    "What's the WiFi provider?",
    "Properties with fast WiFi?",
    "WiFi login information",
  ],
  parking: [
    "Properties with free parking?",
    "Parking availability",
    "Garage parking options",
  ],
  default: [
    "Which properties have pools?",
    "Show me properties under $200",
    "What's the highest-rated property?",
  ],
}

export default function useSmartSuggestions(messages, currentIntent) {
  const suggestions = useMemo(() => {
    if (!messages.length) {
      return CONTEXT_SUGGESTIONS.default
    }

    const lastMessage = messages[messages.length - 1]
    const lastText = lastMessage?.text?.toLowerCase() || ''

    // Check for keywords
    if (lastText.includes('pool') || lastText.includes('hot tub')) {
      return CONTEXT_SUGGESTIONS.pool
    }
    if (lastText.includes('wifi') || lastText.includes('internet')) {
      return CONTEXT_SUGGESTIONS.wifi
    }
    if (lastText.includes('parking')) {
      return CONTEXT_SUGGESTIONS.parking
    }

    // Use intent-based suggestions
    if (currentIntent === 'property_query') {
      return CONTEXT_SUGGESTIONS.property_query
    }
    if (currentIntent === 'dataset_query') {
      return CONTEXT_SUGGESTIONS.dataset_query
    }

    return CONTEXT_SUGGESTIONS.default
  }, [messages, currentIntent])

  return suggestions
}

