export function calculateHandicap(scores) {
  if (!scores || scores.length < 5) return null

  // User rule: avg of last 5
  const last5 = scores.slice(0, 5)
  const avg =
    last5.reduce((sum, s) => sum + s.score, 0) / last5.length

  return avg.toFixed(1)
}
