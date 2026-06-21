'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface FlowArcsProps {
  map: mapboxgl.Map | null;
  hospitals: any[];
  proposedLocations: Array<{ lat: number; lng: number }>;
  simulationResult: any;
}

const SOURCE_ID = 'flow-arcs';
const BG_LAYER_ID = 'flow-arc-lines';
const ANIM_LAYER_ID = 'flow-arc-lines-anim';

export default function FlowArcs({ map, hospitals, proposedLocations, simulationResult }: FlowArcsProps) {
  const animFrameRef = useRef<number>(0);
  const dashOffsetRef = useRef(0);

  useEffect(() => {
    if (!map || !simulationResult || hospitals.length === 0 || proposedLocations.length === 0) {
      // No active flow — remove any stale layers/animation from a previous run
      cancelAnimationFrame(animFrameRef.current);
      try {
        if (map?.getStyle()) {
          if (map.getLayer(ANIM_LAYER_ID)) map.removeLayer(ANIM_LAYER_ID);
          if (map.getLayer(BG_LAYER_ID)) map.removeLayer(BG_LAYER_ID);
          if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        }
      } catch { /* map already destroyed */ }
      return;
    }

    const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    const hospitalsWithNegativeDelta = hospitals.filter((h: any) => {
      const id = (h._id ?? h.id)?.toString();
      return simulationResult.delta && simulationResult.delta[id] < 0;
    });

    for (const h of hospitalsWithNegativeDelta) {
      const hId = (h._id ?? h.id)?.toString();
      const delta = simulationResult.delta?.[hId] ?? 0;
      for (const p of proposedLocations) {
        // Direction matters for the flowing-dash animation: from the
        // existing food bank toward the new one, since that's the
        // direction people are diverting.
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [h.longitude, h.latitude],
              [p.lng, p.lat],
            ],
          },
          properties: { delta, magnitude: Math.min(8, Math.abs(delta)), name: h.name },
        });
      }
    }

    const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = { type: 'FeatureCollection', features };

    if (map.getSource(SOURCE_ID)) {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

      // Faint static background line for context
      map.addLayer({
        id: BG_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#3b82f6',
          'line-width': ['interpolate', ['linear'], ['get', 'magnitude'], 0, 1.5, 8, 4],
          'line-opacity': 0.25,
        },
      });

      // Animated "marching dashes" overlay — reads like people/traffic
      // flowing from the existing food bank toward the new one.
      map.addLayer({
        id: ANIM_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': '#60a5fa',
          'line-width': ['interpolate', ['linear'], ['get', 'magnitude'], 0, 2.5, 8, 6],
          'line-opacity': 0.9,
          'line-dasharray': [0, 3, 1.4],
        },
      });
    }

    function animate() {
      const currentMap = map;
      if (!currentMap || !currentMap.getLayer(ANIM_LAYER_ID)) return;
      dashOffsetRef.current -= 0.18;
      const phase = ((dashOffsetRef.current % 4.4) + 4.4) % 4.4;
      try {
        currentMap.setPaintProperty(ANIM_LAYER_ID, 'line-dasharray', [phase, 3, 1.4]);
      } catch {
        return;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    }
    cancelAnimationFrame(animFrameRef.current);
    if (features.length > 0) {
      animFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [map, hospitals, proposedLocations, simulationResult]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      try {
        if (map?.getStyle()) {
          if (map.getLayer(ANIM_LAYER_ID)) map.removeLayer(ANIM_LAYER_ID);
          if (map.getLayer(BG_LAYER_ID)) map.removeLayer(BG_LAYER_ID);
          if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        }
      } catch { /* map already destroyed */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
