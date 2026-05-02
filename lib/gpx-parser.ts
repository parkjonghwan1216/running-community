export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface GpxData {
  name: string | null;
  distanceKm: number;
  elevationGainM: number;
  geojson: object;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseGpx(xml: string): GpxData {
  const nameMatch = xml.match(/<name>([^<]*)<\/name>/);
  const name = nameMatch ? nameMatch[1].trim() : null;

  const points: GpxPoint[] = [];
  // lat/lon order varies — handle both attribute orderings
  const trkptRegex = /<trkpt\b[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let m: RegExpExecArray | null;
  while ((m = trkptRegex.exec(xml)) !== null) {
    const eleMatch = m[3].match(/<ele>([^<]*)<\/ele>/);
    points.push({
      lat: parseFloat(m[1]),
      lon: parseFloat(m[2]),
      ele: eleMatch ? parseFloat(eleMatch[1]) : undefined,
    });
  }

  // Fallback: try lon-first attribute ordering
  if (points.length === 0) {
    const altRegex = /<trkpt\b[^>]*lon="([^"]+)"[^>]*lat="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
    while ((m = altRegex.exec(xml)) !== null) {
      const eleMatch = m[3].match(/<ele>([^<]*)<\/ele>/);
      points.push({
        lat: parseFloat(m[2]),
        lon: parseFloat(m[1]),
        ele: eleMatch ? parseFloat(eleMatch[1]) : undefined,
      });
    }
  }

  let distanceKm = 0;
  let elevationGainM = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon,
    );
    const prev = points[i - 1].ele;
    const curr = points[i].ele;
    if (prev !== undefined && curr !== undefined && curr > prev) {
      elevationGainM += curr - prev;
    }
  }

  const coordinates = points.map((p) =>
    p.ele !== undefined ? [p.lon, p.lat, p.ele] : [p.lon, p.lat],
  );

  const geojson = {
    type: 'Feature' as const,
    properties: { name },
    geometry: { type: 'LineString' as const, coordinates },
  };

  return {
    name,
    distanceKm: Math.round(distanceKm * 10) / 10,
    elevationGainM: Math.round(elevationGainM),
    geojson,
  };
}
