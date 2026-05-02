'use client';
import { useEffect, useRef } from 'react';

interface Props {
  geojson: object;
  height?: number;
}

export default function CourseMap({ geojson, height = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let map: import('leaflet').Map | null = null;

    (async () => {
      const L = (await import('leaflet')).default;

      if (!container) return;
      map = L.map(container, { zoomControl: true, scrollWheelZoom: false });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const layer = L.geoJSON(geojson as Parameters<typeof L.geoJSON>[0], {
        style: { color: '#ff5a1f', weight: 4, opacity: 0.85 },
      }).addTo(map);

      try {
        map.fitBounds(layer.getBounds().pad(0.12));
      } catch {
        map.setView([37.5665, 126.978], 12);
      }

      // Mark start and end
      const coords = (geojson as { geometry?: { coordinates?: number[][] } })?.geometry
        ?.coordinates;
      if (coords && coords.length > 0) {
        const startIcon = L.divIcon({
          html: '<div class="map-marker map-marker--start">S</div>',
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const endIcon = L.divIcon({
          html: '<div class="map-marker map-marker--end">F</div>',
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const first = coords[0];
        const last = coords[coords.length - 1];
        L.marker([first[1], first[0]], { icon: startIcon }).addTo(map);
        L.marker([last[1], last[0]], { icon: endIcon }).addTo(map);
      }
    })();

    return () => {
      map?.remove();
    };
  }, [geojson]);

  return <div ref={containerRef} style={{ height, borderRadius: 12, overflow: 'hidden' }} />;
}
