function parsePoint(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/POINT\s*\(\s*(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s*\)/i);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[3]) };
}

module.exports = { parsePoint };
