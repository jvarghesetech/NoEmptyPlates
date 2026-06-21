'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getFirstSymbolLayerId } from '@/lib/mapbox/createMap';

const SOURCE_ID = 'landmarks';
const LAYER_ID = 'landmarks-extrusion';

const CITY_IDS = ['toronto', 'waterloo', 'mississauga'];

interface LandmarksLayerProps {
  map: mapboxgl.Map | null;
}

export default function LandmarksLayer({ map }: LandmarksLayerProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Don't gate on isStyleLoaded() — with [map] as the only dependency,
    // a false reading here means this effect never runs again for the
    // lifetime of this map instance, so the layer silently never appears.
    if (!map) return;

    const beforeLayerId = getFirstSymbolLayerId(map);
    if (!beforeLayerId) return;

    async function addLayer() {
      if (!map) return;
      try {
        const allFeatures: GeoJSON.Feature[] = [];
        for (const cid of CITY_IDS) {
          try {
            const res = await fetch(`/map-data/landmarks-${cid}.geojson`);
            if (!res.ok) continue;
            const data = await res.json();
            if (data.features) allFeatures.push(...data.features);
          } catch {
            // File may not exist for this city
          }
        }

        const merged: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: allFeatures,
        };

        if (map.getSource(SOURCE_ID)) {
          (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(merged);
          setLoaded(true);
          return;
        }

        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: merged,
        });

        map.addLayer(
          {
            id: LAYER_ID,
            type: 'fill-extrusion',
            source: SOURCE_ID,
            paint: {
              'fill-extrusion-color': '#8b7355',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.8,
            },
          },
          beforeLayerId
        );
      } catch {
        // Files may not exist yet
      }
      setLoaded(true);
    }

    addLayer();

    return () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  return null;
}
