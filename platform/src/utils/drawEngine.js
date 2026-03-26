/**
 * Weighted Draw Algorithm
 * Priortizes numbers based on their frequency in the user score pool.
 * @param {Array} userScores - All scores currently in the database
 * @returns {Array} 5 unique numbers for the draw
 */
export function weightedDraw(userScores = []) {
  if (userScores.length === 0) {
    return generateRandomDraw();
  }

  // Count frequency of each score (1-45)
  const frequencyMap = {};
  userScores.forEach(s => {
    const score = Number(s.score);
    frequencyMap[score] = (frequencyMap[score] || 0) + 1;
  });

  // Build a pool where higher frequency scores appear more often
  const pool = [];
  Object.keys(frequencyMap).forEach(score => {
    const weight = frequencyMap[score];
    // Add multiple entries to increase probability
    for (let i = 0; i < weight; i++) {
      pool.push(Number(score));
    }
  });

  const result = new Set();
  // We need 5 unique numbers
  while (result.size < 5) {
    if (pool.length > 5) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      result.add(pool[randomIndex]);
    } else {
      // Fallback to random if pool is too small
      result.add(Math.floor(Math.random() * 45) + 1);
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

export function generateRandomDraw() {
  const result = new Set();
  while (result.size < 5) {
    result.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Prize Pool Calculator
 * Tier 5: 40% (Rollover)
 * Tier 4: 35%
 * Tier 3: 25%
 */
export function calculatePrizePool(totalRevenue) {
  const prizeBucket = totalRevenue * 0.50; // Assuming 50% of revenue goes to prizes
  return {
    tier5: prizeBucket * 0.40,
    tier4: prizeBucket * 0.35,
    tier3: prizeBucket * 0.25
  };
}
