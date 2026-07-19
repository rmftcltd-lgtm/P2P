/** Public browse privacy: Suburb, City — not exact address (wireframe). */
export function suburbCity(address: string | null | undefined): string {
  if (!address?.trim()) return "Somewhere, NZ";
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    // Prefer last two meaningful segments (suburb, city / city, region)
    const a = parts[parts.length - 2]!;
    const b = parts[parts.length - 1]!;
    // Drop postcodes / NZ / New Zealand trailing noise
    const cleanB = b.replace(/\b\d{4}\b/g, "").replace(/\bNew Zealand\b/gi, "").replace(/\bNZ\b/gi, "").trim();
    if (cleanB) return `${a}, ${cleanB}`;
    return a;
  }
  return parts[0] ?? "Somewhere, NZ";
}
