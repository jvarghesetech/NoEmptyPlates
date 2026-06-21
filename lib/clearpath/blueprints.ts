export interface ProposedBuilding {
  id: string;
  lat: number;
  lng: number;
  rotation: number;
  blueprint: Blueprint;
}

export interface BlueprintMetadata {
  distributionCounters: number;
  coldStorageUnits: number;
  intakeRooms: number;
  deliveryVans: number;
  storageRooms: number;
  coordinators: number;
  volunteers: number;
  numberOfFloors: number;
  totalFloorArea: number;
  groundFloorArea: number;
}

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  glbPath: string;
  beds: number;
  /** Minimum parcel area in m² for this blueprint to fit */
  minAreaM2: number;
  /** Detailed food bank metadata from the editor */
  metadata?: BlueprintMetadata;
}

export const PRESET_BLUEPRINTS: Blueprint[] = [];

/** Build a Blueprint from an exported building returned by the editor API. */
export function createBlueprintFromBuilding(building: {
  id: string;
  name: string;
  beds: number;
  publicPath: string;
  metadata?: {
    groundFloorArea?: number;
    distributionCounters?: number;
    coldStorageUnits?: number;
    intakeRooms?: number;
    deliveryVans?: number;
    storageRooms?: number;
    coordinators?: number;
    volunteers?: number;
    numberOfFloors?: number;
    totalFloorArea?: number;
    totalPallets?: number;
  } | null;
}): Blueprint {
  const m = building.metadata;
  return {
    id: `custom-${building.id}`,
    name: building.name || 'Custom Building',
    description: `${building.beds}-pallet custom design`,
    glbPath: building.publicPath,
    beds: building.beds,
    minAreaM2: m?.groundFloorArea ?? 100,
    metadata: m ? {
      distributionCounters: m.distributionCounters ?? 0,
      coldStorageUnits: m.coldStorageUnits ?? 0,
      intakeRooms: m.intakeRooms ?? 0,
      deliveryVans: m.deliveryVans ?? 0,
      storageRooms: m.storageRooms ?? 0,
      coordinators: m.coordinators ?? 0,
      volunteers: m.volunteers ?? 0,
      numberOfFloors: m.numberOfFloors ?? 1,
      totalFloorArea: m.totalFloorArea ?? 0,
      groundFloorArea: m.groundFloorArea ?? 0,
    } : undefined,
  };
}
