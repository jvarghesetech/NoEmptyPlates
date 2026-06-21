import { NextRequest, NextResponse } from 'next/server';
import { runSimulation } from '@/lib/clearpath/voronoiService';
import { searchNearbyFoodBanks, simulateFoodBankWait } from '@/lib/clearpath/mapboxFoodBankSearch';
import { getCityById } from '@/lib/map-3d/cities';
import { SimulateRequest } from '@/lib/clearpath/types';

export async function POST(req: NextRequest) {
  const body: SimulateRequest = await req.json();
  const cityConfig = getCityById(body.city?.toLowerCase());

  if (!cityConfig) {
    return NextResponse.json({ before: {}, after: {}, delta: {} });
  }

  const [lng, lat] = cityConfig.center;
  const foodBanks = await searchNearbyFoodBanks(lat, lng, { limit: 20 });
  const snapshots = foodBanks.map((h) => ({
    hospitalId: h.id,
    ...simulateFoodBankWait(h.id),
  }));

  const proposals = body.proposals ?? [];
  const result = runSimulation(foodBanks, snapshots, proposals);

  return NextResponse.json(result);
}
