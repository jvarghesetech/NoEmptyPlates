import { BuildingInstance } from '@/lib/editor/types/buildingSpec';

// Staffing ratio constants (same as FoodBankForm)
const VOLUNTEER_PER_PALLET = 4.5;
const COORDINATOR_PER_PALLET = 18;
const VOLUNTEERS_PER_COLD_STORAGE = 2.5;
const VOLUNTEER_PER_DISTRIBUTION = 3;
const COORDINATOR_PER_DISTRIBUTION = 10;

export interface FoodBankMetadata {
  // Raw capacity
  totalPallets: number;
  distributionCounters: number;
  coldStorageUnits: number;
  intakeRooms: number;
  deliveryVans: number;
  storageRooms: number;

  // Staffing
  coordinators: number;
  volunteers: number;

  // Computed effective capacity
  usablePallets: number;
  usableDistributionCounters: number;
  usableColdStorageUnits: number;

  // Physical
  totalFloorArea: number;
  groundFloorArea: number;
  numberOfFloors: number;

  createdAt: string;
}

/**
 * Extract food bank metadata from all buildings in the editor.
 * Aggregates capacity across all buildings in the design.
 */
export function extractFoodBankMetadata(buildings: BuildingInstance[]): FoodBankMetadata {
  let totalPallets = 0;
  let distributionCounters = 0;
  let coldStorageUnits = 0;
  let intakeRooms = 0;
  let deliveryVans = 0;
  let storageRooms = 0;
  let coordinators = 0;
  let volunteers = 0;
  let totalFloorArea = 0;
  let groundFloorArea = 0;
  let maxFloors = 0;

  for (const building of buildings) {
    const spec = building.spec;

    totalPallets += spec.foodBankPalletCapacity ?? 0;
    distributionCounters += spec.foodBankDistributionCounters ?? 0;
    coldStorageUnits += spec.foodBankColdStorageUnits ?? 0;
    intakeRooms += spec.foodBankIntakeRooms ?? 0;
    deliveryVans += spec.foodBankDeliveryVans ?? 0;
    storageRooms += spec.foodBankStorageRooms ?? 0;
    coordinators += spec.foodBankCoordinators ?? 0;
    volunteers += spec.foodBankVolunteers ?? 0;

    const bFloorArea = spec.width * spec.depth * spec.numberOfFloors;
    const bGroundArea = spec.width * spec.depth;
    totalFloorArea += bFloorArea;
    groundFloorArea += bGroundArea;
    maxFloors = Math.max(maxFloors, spec.numberOfFloors);
  }

  // Volunteer allocation: cold storage -> intake -> distribution -> storage (same priority as FoodBankForm)
  const volunteersNeededForColdStorage = coldStorageUnits * VOLUNTEERS_PER_COLD_STORAGE;
  const volunteersNeededForIntake = intakeRooms * 1; // 1:1 ratio
  const volunteersNeededForDistribution = Math.ceil(distributionCounters / VOLUNTEER_PER_DISTRIBUTION);
  const volunteersAfterColdStorage = Math.max(0, volunteers - volunteersNeededForColdStorage);
  const volunteersForIntake = Math.min(volunteersAfterColdStorage, volunteersNeededForIntake);
  const volunteersAfterIntake = Math.max(0, volunteersAfterColdStorage - volunteersForIntake);
  const volunteersForDistribution = Math.min(volunteersAfterIntake, volunteersNeededForDistribution);
  const volunteersForStorage = Math.max(0, volunteersAfterIntake - volunteersForDistribution);

  // Coordinator allocation: distribution first, then storage
  const coordinatorsNeededForDistribution = Math.ceil(distributionCounters / COORDINATOR_PER_DISTRIBUTION);
  const coordinatorsForDistribution = Math.min(coordinators, coordinatorsNeededForDistribution);
  const coordinatorsForStorage = Math.max(0, coordinators - coordinatorsForDistribution);

  const usablePallets = Math.min(
    totalPallets,
    Math.floor(volunteersForStorage * VOLUNTEER_PER_PALLET),
    Math.floor(coordinatorsForStorage * COORDINATOR_PER_PALLET)
  );
  const usableColdStorageUnits = Math.min(coldStorageUnits, Math.floor(volunteers / VOLUNTEERS_PER_COLD_STORAGE));
  const usableDistributionCounters = Math.min(
    distributionCounters,
    Math.floor(volunteersForDistribution * VOLUNTEER_PER_DISTRIBUTION),
    Math.floor(coordinatorsForDistribution * COORDINATOR_PER_DISTRIBUTION)
  );

  return {
    totalPallets,
    distributionCounters,
    coldStorageUnits,
    intakeRooms,
    deliveryVans,
    storageRooms,
    coordinators,
    volunteers,
    usablePallets,
    usableDistributionCounters,
    usableColdStorageUnits,
    totalFloorArea,
    groundFloorArea,
    numberOfFloors: maxFloors,
    createdAt: new Date().toISOString(),
  };
}
