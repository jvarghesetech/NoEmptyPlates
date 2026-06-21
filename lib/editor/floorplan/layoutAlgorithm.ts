import type { BuildingSpecification } from '@/lib/editor/types/buildingSpec';
import type { RoomTypeDefinition, RoomTypeId } from './roomTypes';
import { ROOM_TYPES } from './roomTypes';

export interface PlacedFurniture {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  label: string;
}

export interface PlacedRoom {
  x: number;
  z: number;
  width: number;
  depth: number;
  roomTypeId: RoomTypeId;
  roomLabel: string;       // e.g. "Patient #3"
  floorColor: string;
  wallColor: string;
  furniture: PlacedFurniture[];
}

export interface FloorLayout {
  floorIndex: number;
  rooms: PlacedRoom[];
}

export interface BuildingAllocation {
  floors: FloorLayout[];
  floorWidth: number;
  floorDepth: number;
  wallThickness: number;
}

const WALL_THICKNESS = 0.15;
const CORRIDOR_WIDTH = 2.0;
const ROOM_GAP = 0.8;  // passage width between rooms

interface RoomRequest {
  roomDef: RoomTypeDefinition;
  remaining: number;
  countersPlaced: number;
}

/**
 * Picks a deterministic variant index based on room counter and floor index.
 */
function pickVariant(countersPlaced: number, floorIndex: number, variantCount: number): number {
  return (countersPlaced + floorIndex * 3) % variantCount;
}

/**
 * Packs rooms into a single floor using row-based strip packing.
 * Places rooms in two zones (above and below a central corridor).
 * Returns placed rooms and mutates the request's remaining count.
 */
function packFloor(
  floorIndex: number,
  floorWidth: number,
  floorDepth: number,
  requests: RoomRequest[],
  isGroundFloor: boolean
): PlacedRoom[] {
  const placed: PlacedRoom[] = [];

  // Usable area: inside outer walls
  const usableWidth = floorWidth - 2 * WALL_THICKNESS;
  const usableDepth = floorDepth - 2 * WALL_THICKNESS;

  // Split into two zones with a central corridor
  const corridorZ = WALL_THICKNESS + (usableDepth - CORRIDOR_WIDTH) / 2;
  const zones = [
    { startZ: WALL_THICKNESS, maxDepth: (usableDepth - CORRIDOR_WIDTH) / 2 },
    { startZ: corridorZ + CORRIDOR_WIDTH, maxDepth: (usableDepth - CORRIDOR_WIDTH) / 2 },
  ];

  for (const zone of zones) {
    let cursorX = WALL_THICKNESS;
    let cursorZ = zone.startZ;
    let rowMaxDepth = 0;

    for (const req of requests) {
      if (req.roomDef.groundFloorOnly && !isGroundFloor) continue;

      while (req.remaining > 0) {
        const roomW = req.roomDef.unitWidth;
        const roomD = req.roomDef.unitDepth;

        // Check if room fits in current row
        if (cursorX + roomW > floorWidth - WALL_THICKNESS) {
          cursorX = WALL_THICKNESS;
          cursorZ += rowMaxDepth + ROOM_GAP;
          rowMaxDepth = 0;
        }

        // Check if room fits in this zone vertically
        if (cursorZ + roomD > zone.startZ + zone.maxDepth) {
          break;
        }

        // Check if room fits horizontally
        if (cursorX + roomW > floorWidth - WALL_THICKNESS) {
          break;
        }

        // Place the room
        const roomX = cursorX;
        const roomZ = cursorZ;

        req.countersPlaced++;
        const roomLabel = `${req.roomDef.shortLabel} #${req.countersPlaced}`;

        // Pick a furniture variant
        const variantCount = req.roomDef.furnitureVariants.length;
        const variantIdx = pickVariant(req.countersPlaced, floorIndex, variantCount);
        const selectedFurniture = req.roomDef.furnitureVariants[variantIdx] ?? req.roomDef.furnitureVariants[0];

        const furniture: PlacedFurniture[] = selectedFurniture.map((item) => ({
          x: roomX + item.relativeX,
          z: roomZ + item.relativeZ,
          width: item.width,
          depth: item.depth,
          height: item.height,
          color: item.color,
          label: item.label,
        }));

        placed.push({
          x: roomX,
          z: roomZ,
          width: roomW,
          depth: roomD,
          roomTypeId: req.roomDef.id,
          roomLabel,
          floorColor: req.roomDef.floorColor,
          wallColor: req.roomDef.wallColor,
          furniture,
        });

        req.remaining--;
        cursorX += roomW + ROOM_GAP;
        rowMaxDepth = Math.max(rowMaxDepth, roomD);
      }
    }
  }

  return placed;
}

/**
 * Generates a complete building allocation across all floors.
 * Fills each floor completely (bottom to top) before moving to the next.
 * Ground-floor-only rooms (delivery van, distribution, intake) are placed on floor 0 first,
 * then remaining space on floor 0 is filled with non-ground rooms before
 * moving up to floor 1, 2, etc.
 */
export function generateBuildingAllocation(
  spec: BuildingSpecification
): BuildingAllocation {
  const floorWidth = spec.width;
  const floorDepth = spec.depth;
  const numberOfFloors = spec.numberOfFloors;

  // Build all room requests sorted by priority
  const requests: RoomRequest[] = ROOM_TYPES
    .filter((rt) => rt.getCount(spec) > 0)
    .sort((a, b) => a.priority - b.priority)
    .map((rt) => ({
      roomDef: rt,
      remaining: rt.getCount(spec),
      countersPlaced: 0,
    }));

  // Initialize all floors
  const floors: FloorLayout[] = Array.from({ length: numberOfFloors }, (_, i) => ({
    floorIndex: i,
    rooms: [],
  }));

  // Fill floors bottom to top — each floor is fully packed before moving up
  for (let fi = 0; fi < numberOfFloors; fi++) {
    const isGroundFloor = fi === 0;
    floors[fi].rooms = packFloor(fi, floorWidth, floorDepth, requests, isGroundFloor);
  }

  return {
    floors,
    floorWidth,
    floorDepth,
    wallThickness: WALL_THICKNESS,
  };
}
