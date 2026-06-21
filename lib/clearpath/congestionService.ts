import { searchNearbyFoodBanks, simulateFoodBankWait } from './mapboxFoodBankSearch';
import { getCityById } from '@/lib/map-3d/cities';

export const congestionService = {
  async getCongestion(city?: string) {
    const cityConfig = city ? getCityById(city.toLowerCase()) : undefined;
    if (!cityConfig) return [];

    const [lng, lat] = cityConfig.center;
    const foodBanks = await searchNearbyFoodBanks(lat, lng, { limit: 20 });

    return foodBanks.map((h) => ({
      hospitalId: h.id,
      ...simulateFoodBankWait(h.id),
      recordedAt: new Date().toISOString(),
    }));
  }
};
