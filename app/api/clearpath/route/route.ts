import { NextRequest, NextResponse } from 'next/server';
import { scoreAndRankHospitals } from '@/lib/clearpath/routingService';
import { geocodePostalCode } from '@/lib/clearpath/mapboxDirections';
import { searchNearbyFoodBanks, simulateFoodBankWait } from '@/lib/clearpath/mapboxFoodBankSearch';
import { RouteRequest } from '@/lib/clearpath/types';

export async function POST(req: NextRequest) {
  try {
    const body: RouteRequest = await req.json();

    // Resolve user location from coordinates or postal code
    let userLat = body.userLat;
    let userLng = body.userLng;

    if ((!userLat || !userLng) && body.postalCode) {
      const geo = await geocodePostalCode(body.postalCode);
      userLat = geo.lat;
      userLng = geo.lng;
    }

    if (!userLat || !userLng) {
      return NextResponse.json(
        { error: 'Please provide location (coordinates or postal code).' },
        { status: 400 }
      );
    }

    // Use the same limit as /hospitals and /congestion so they share one
    // cache entry per location — otherwise each endpoint independently
    // queries Mapbox's non-deterministic text search and can return a
    // different subset of real food banks for the same spot.
    const foodBanks = await searchNearbyFoodBanks(userLat, userLng, { limit: 20 });

    if (!foodBanks.length) {
      return NextResponse.json(
        { error: 'No food banks found near your location.' },
        { status: 404 }
      );
    }

    // Wait time/capacity aren't available from any live source, so they're
    // simulated deterministically per food bank — everything else (name,
    // address, phone, coordinates, route) is real.
    const snapshots = foodBanks.map((h) => ({
      hospitalId: h.id,
      ...simulateFoodBankWait(h.id),
    }));

    const result = await scoreAndRankHospitals(userLat, userLng, foodBanks, snapshots);

    if (!result) {
      return NextResponse.json(
        { error: 'No food banks found for the specified city.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      userLocation: { lat: userLat, lng: userLng },
    });
  } catch (err: any) {
    console.error('Route API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to compute route.' },
      { status: 500 }
    );
  }
}
