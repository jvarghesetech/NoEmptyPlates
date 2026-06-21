import { NextRequest, NextResponse } from 'next/server';
import { searchNearbyFoodBanks } from '@/lib/clearpath/mapboxFoodBankSearch';
import { getCityById } from '@/lib/map-3d/cities';

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city');
  const cityConfig = city ? getCityById(city.toLowerCase()) : undefined;

  if (!cityConfig) {
    return NextResponse.json([]);
  }

  try {
    const [lng, lat] = cityConfig.center;
    const foodBanks = await searchNearbyFoodBanks(lat, lng, { limit: 20 });
    return NextResponse.json(foodBanks);
  } catch (e) {
    console.warn('Hospitals API: food bank search failed', e);
    return NextResponse.json([]);
  }
}
