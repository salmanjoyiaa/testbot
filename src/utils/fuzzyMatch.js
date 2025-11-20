// Fuzzy matching utility for property names
export function fuzzyMatch(query, target, threshold = 0.6) {
  if (!query || !target) return 0
  
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase().trim()
  
  // Exact match
  if (q === t) return 1.0
  
  // Contains match
  if (t.includes(q) || q.includes(t)) return 0.9
  
  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(q, t)
  const maxLen = Math.max(q.length, t.length)
  const similarity = 1 - (distance / maxLen)
  
  return similarity >= threshold ? similarity : 0
}

function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

export function findBestMatches(query, candidates, limit = 3) {
  const matches = candidates.map(candidate => ({
    candidate,
    score: fuzzyMatch(query, candidate)
  }))
  
  return matches
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.candidate)
}

