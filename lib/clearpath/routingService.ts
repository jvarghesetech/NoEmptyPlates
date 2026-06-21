import { ScoredHospital } from './types';
import { getBatchDirections } from './mapboxDirections';
import { getAdjustedDrivingTime, getAdjustedWaitTime, getTemporalContext } from './temporalPatterns';

// Single weight profile: balance drive time against wait time, with a mild
// penalty for busier locations. No severity tiers — every food bank request
// is ranked the same way (nearest + shortest wait).
const WEIGHTS = { drive: 2.0, wait: 2.0, occ: 1.0 };

export async function scoreAndRankHospitals(
  userLat: number,
  userLng: number,
  hospitals: any[],
  snapshots: any[]
): Promise<{ recommended: ScoredHospital; alternatives: ScoredHospital[] } | null> {
  if (!hospitals.length) return null;

  const now = new Date();
  const context = getTemporalContext(now);

  // Build congestion lookup
  const congestionMap: Record<string, { occupancyPct: number; waitMinutes: number }> = {};
  for (const s of snapshots) {
    congestionMap[s.hospitalId] = { occupancyPct: s.occupancyPct, waitMinutes: s.waitMinutes };
  }

  // Get real driving times from Mapbox Directions API (parallel)
  const destinations = hospitals.map((h: any) => ({
    lng: h.longitude,
    lat: h.latitude,
    id: h._id?.toString() ?? h.id,
  }));

  const directionsMap = await getBatchDirections(userLng, userLat, destinations);

  // Score each food bank
  const scored: ScoredHospital[] = hospitals.map((h: any) => {
    const hId = h._id?.toString() ?? h.id;
    const congestion = congestionMap[hId] ?? { occupancyPct: 50, waitMinutes: 20 };
    const directions = directionsMap.get(hId);

    const rawDriveTime = directions?.drivingTimeMinutes ?? 15;
    const distanceKm = directions?.distanceKm ?? 10;
    const routeGeometry = directions?.routeGeometry ?? null;
    const congestionSegments = directions?.congestionSegments;

    // Apply temporal adjustments
    const drivingTimeMinutes = getAdjustedDrivingTime(rawDriveTime, distanceKm, now);
    const adjustedWaitMinutes = getAdjustedWaitTime(congestion.waitMinutes, now);

    // Busy-ness penalty: 0 if < 70%, scales up to 100
    const occupancyPenalty = Math.max(0, ((congestion.occupancyPct - 70) / 30) * 100);

    // Compute weighted score (lower = better)
    const score =
      WEIGHTS.drive * drivingTimeMinutes +
      WEIGHTS.wait * adjustedWaitMinutes +
      WEIGHTS.occ * occupancyPenalty;

    const totalEstimatedMinutes = Math.round(drivingTimeMinutes + adjustedWaitMinutes);

    return {
      hospital: h,
      score: Math.round(score * 10) / 10,
      drivingTimeMinutes: Math.round(drivingTimeMinutes),
      waitMinutes: congestion.waitMinutes,
      adjustedWaitMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
      occupancyPct: congestion.occupancyPct,
      routeGeometry,
      congestionSegments,
      totalEstimatedMinutes,
      reason: '',
    };
  });

  // Sort by score (ascending = best first)
  scored.sort((a, b) => a.score - b.score);

  // Generate reasons
  scored[0].reason = generateReason(scored[0], context);
  for (let i = 1; i < scored.length; i++) {
    scored[i].reason = generateAlternativeReason(scored[i], scored[0]);
  }

  return {
    recommended: scored[0],
    alternatives: scored.slice(1, 3),
  };
}

function generateReason(h: ScoredHospital, context: string): string {
  return `Lowest total wait: ~${h.totalEstimatedMinutes} min total (${h.drivingTimeMinutes} drive + ${h.adjustedWaitMinutes} wait, ${context}). ${h.occupancyPct}% busy.`;
}

function generateAlternativeReason(alt: ScoredHospital, best: ScoredHospital): string {
  const timeDiff = alt.totalEstimatedMinutes - best.totalEstimatedMinutes;
  if (timeDiff > 0) {
    return `~${timeDiff} min longer total, but ${alt.occupancyPct}% busy.`;
  }
  return `${alt.distanceKm} km away, ${alt.occupancyPct}% busy.`;
}
