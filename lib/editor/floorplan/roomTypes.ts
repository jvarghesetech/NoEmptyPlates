import type { BuildingSpecification } from '@/lib/editor/types/buildingSpec';

export type RoomTypeId =
  | 'storage_room'
  | 'cold_storage_room'
  | 'distribution_room'
  | 'intake_room'
  | 'delivery_van_bay';

export interface FurnitureTemplate {
  label: string;
  relativeX: number;
  relativeZ: number;
  width: number;
  depth: number;
  height: number;
  color: string;
}

export interface RoomTypeDefinition {
  id: RoomTypeId;
  label: string;
  shortLabel: string;
  description: string;
  unitWidth: number;
  unitDepth: number;
  floorColor: string;
  wallColor: string;
  priority: number;
  groundFloorOnly: boolean;
  furnitureVariants: FurnitureTemplate[][];
  getCount: (spec: BuildingSpecification) => number;
}

// ── Delivery Van Bay variants ───────────────────────────────────────────────
// Each variant has a special "Delivery Van" item rendered as a 3D model in FloorPlanView
const DELIVERY_VAN_VARIANTS: FurnitureTemplate[][] = [
  [
    { label: 'Delivery Van', relativeX: 1.25, relativeZ: 0.75, width: 2.5, depth: 3.5, height: 1.0, color: '#ffffff' },
    { label: 'Pallet Jack', relativeX: 0.15, relativeZ: 0.2, width: 0.55, depth: 0.35, height: 0.75, color: '#fbbf24' },
    { label: 'Cone', relativeX: 4.4, relativeZ: 0.25, width: 0.25, depth: 0.25, height: 0.35, color: '#fb923c' },
    { label: 'Cone', relativeX: 4.4, relativeZ: 4.4, width: 0.25, depth: 0.25, height: 0.35, color: '#fb923c' },
  ],
  [
    { label: 'Delivery Van', relativeX: 1.25, relativeZ: 0.75, width: 2.5, depth: 3.5, height: 1.0, color: '#ffffff' },
    { label: 'Hand Truck', relativeX: 0.15, relativeZ: 2.0, width: 0.35, depth: 0.3, height: 0.55, color: '#94a3b8' },
    { label: 'Crate Stack', relativeX: 4.5, relativeZ: 2.5, width: 0.4, depth: 0.4, height: 0.7, color: '#a16207' },
    { label: 'Loading Ramp', relativeX: 0.15, relativeZ: 4.2, width: 0.7, depth: 0.35, height: 0.2, color: '#9ca3af' },
  ],
  [
    { label: 'Delivery Van', relativeX: 1.25, relativeZ: 0.75, width: 2.5, depth: 3.5, height: 1.0, color: '#ffffff' },
    { label: 'Box Pallet', relativeX: 0.1, relativeZ: 0.3, width: 0.65, depth: 1.6, height: 0.45, color: '#b45309' },
    { label: 'Tool Box', relativeX: 4.2, relativeZ: 1.0, width: 0.5, depth: 0.4, height: 0.35, color: '#fcd34d' },
    { label: 'Clipboard Stand', relativeX: 4.3, relativeZ: 3.5, width: 0.35, depth: 0.25, height: 0.25, color: '#c4b5fd' },
  ],
  [
    { label: 'Delivery Van', relativeX: 1.25, relativeZ: 0.75, width: 2.5, depth: 3.5, height: 1.0, color: '#ffffff' },
    { label: 'Donation Cart', relativeX: 0.15, relativeZ: 1.5, width: 0.5, depth: 0.55, height: 0.75, color: '#c4b5fd' },
    { label: 'Fire Extinguisher', relativeX: 4.55, relativeZ: 0.2, width: 0.2, depth: 0.2, height: 0.55, color: '#ef4444' },
    { label: 'Cone', relativeX: 0.2, relativeZ: 4.4, width: 0.25, depth: 0.25, height: 0.35, color: '#fb923c' },
    { label: 'Cone', relativeX: 4.4, relativeZ: 4.4, width: 0.25, depth: 0.25, height: 0.35, color: '#fb923c' },
  ],
  [
    { label: 'Delivery Van', relativeX: 1.25, relativeZ: 0.75, width: 2.5, depth: 3.5, height: 1.0, color: '#ffffff' },
    { label: 'Equipment Locker', relativeX: 0.1, relativeZ: 3.5, width: 0.7, depth: 0.55, height: 1.1, color: '#94a3b8' },
    { label: 'Hand Cart', relativeX: 4.1, relativeZ: 2.0, width: 0.55, depth: 0.55, height: 0.65, color: '#9ca3af' },
    { label: 'Crate Stack', relativeX: 4.1, relativeZ: 4.0, width: 0.5, depth: 0.4, height: 0.45, color: '#a16207' },
  ],
];

// ── Distribution Room variants ──────────────────────────────────────────────
const DISTRIBUTION_VARIANTS: FurnitureTemplate[][] = [
  [
    { label: 'Service Counter', relativeX: 1.5, relativeZ: 1.0, width: 0.7, depth: 1.8, height: 0.9, color: '#a16207' },
    { label: 'Digital Scale', relativeX: 0.25, relativeZ: 0.25, width: 0.3, depth: 0.25, height: 0.3, color: '#6ee7b7' },
    { label: 'Food Box Stack', relativeX: 4.0, relativeZ: 4.0, width: 0.5, depth: 0.45, height: 0.8, color: '#b45309' },
    { label: 'Bag Dispenser', relativeX: 2.8, relativeZ: 0.8, width: 0.15, depth: 0.15, height: 1.3, color: '#d4d4d8' },
  ],
  [
    { label: 'Service Counter', relativeX: 1.5, relativeZ: 1.0, width: 0.7, depth: 1.8, height: 0.9, color: '#a16207' },
    { label: 'Sign-in Tablet', relativeX: 0.25, relativeZ: 0.25, width: 0.35, depth: 0.3, height: 1.1, color: '#6ee7b7' },
    { label: 'Shopping Cart', relativeX: 4.0, relativeZ: 1.5, width: 0.5, depth: 0.55, height: 0.8, color: '#9ca3af' },
    { label: 'Produce Crate', relativeX: 4.0, relativeZ: 3.5, width: 0.3, depth: 0.3, height: 0.4, color: '#65a30d' },
  ],
  [
    { label: 'Service Table', relativeX: 1.2, relativeZ: 1.0, width: 0.9, depth: 2.0, height: 0.85, color: '#a16207' },
    { label: 'Bag Dispenser', relativeX: 0.25, relativeZ: 0.3, width: 0.3, depth: 0.25, height: 1.3, color: '#d4d4d8' },
    { label: 'Produce Crate', relativeX: 0.25, relativeZ: 2.5, width: 0.3, depth: 0.3, height: 0.4, color: '#65a30d' },
    { label: 'Volunteer Cart', relativeX: 3.8, relativeZ: 2.0, width: 0.5, depth: 0.55, height: 0.75, color: '#c4b5fd' },
    { label: 'Chair', relativeX: 3.5, relativeZ: 4.0, width: 0.5, depth: 0.5, height: 0.45, color: '#fcd34d' },
  ],
  [
    { label: 'Service Counter', relativeX: 1.5, relativeZ: 1.2, width: 0.7, depth: 1.8, height: 0.9, color: '#a16207' },
    { label: 'Sign Board', relativeX: 1.8, relativeZ: 1.8, width: 0.55, depth: 0.55, height: 0.08, color: '#fef08a' },
    { label: 'Box Tray', relativeX: 3.5, relativeZ: 1.5, width: 0.5, depth: 0.7, height: 0.7, color: '#b45309' },
    { label: 'Digital Scale', relativeX: 0.25, relativeZ: 0.4, width: 0.3, depth: 0.25, height: 0.3, color: '#6ee7b7' },
    { label: 'Recycling Bin', relativeX: 4.3, relativeZ: 4.3, width: 0.25, depth: 0.2, height: 0.35, color: '#34d399' },
  ],
  [
    { label: 'Service Table', relativeX: 1.2, relativeZ: 1.2, width: 0.9, depth: 2.0, height: 0.85, color: '#a16207' },
    { label: 'Computer Desk', relativeX: 3.8, relativeZ: 0.25, width: 0.7, depth: 0.5, height: 0.7, color: '#a5b4fc' },
    { label: 'Supply Rack', relativeX: 0.15, relativeZ: 4.0, width: 0.55, depth: 0.4, height: 0.75, color: '#c4b5fd' },
    { label: 'Digital Scale', relativeX: 0.25, relativeZ: 0.3, width: 0.3, depth: 0.25, height: 0.3, color: '#6ee7b7' },
    { label: 'Stool', relativeX: 3.5, relativeZ: 2.2, width: 0.35, depth: 0.35, height: 0.4, color: '#d4d4d8' },
  ],
];

// ── Intake Room variants ────────────────────────────────────────────────────
const INTAKE_VARIANTS: FurnitureTemplate[][] = [
  [
    { label: 'Intake Desk', relativeX: 1.5, relativeZ: 1.0, width: 0.9, depth: 2.0, height: 0.75, color: '#a5b4fc' },
    { label: 'Filing Cabinet', relativeX: 0.2, relativeZ: 0.4, width: 0.5, depth: 0.55, height: 0.75, color: '#c4b5fd' },
    { label: 'Privacy Screen', relativeX: 1.3, relativeZ: 4.3, width: 0.8, depth: 0.25, height: 1.4, color: '#94a3b8' },
    { label: 'Sink', relativeX: 4.0, relativeZ: 4.1, width: 0.45, depth: 0.4, height: 0.8, color: '#a5f3fc' },
  ],
  [
    { label: 'Intake Desk', relativeX: 1.5, relativeZ: 1.0, width: 0.9, depth: 2.0, height: 0.75, color: '#a5b4fc' },
    { label: 'Computer Monitor', relativeX: 1.8, relativeZ: 1.8, width: 0.45, depth: 0.3, height: 0.45, color: '#475569' },
    { label: 'Waiting Chair', relativeX: 3.5, relativeZ: 1.5, width: 0.5, depth: 0.7, height: 0.45, color: '#fcd34d' },
    { label: 'Sign-in Clipboard', relativeX: 0.25, relativeZ: 0.35, width: 0.3, depth: 0.25, height: 0.9, color: '#6ee7b7' },
    { label: 'Filing Cabinet', relativeX: 3.8, relativeZ: 3.5, width: 0.5, depth: 0.55, height: 0.75, color: '#c4b5fd' },
  ],
  [
    { label: 'Intake Desk', relativeX: 1.5, relativeZ: 1.0, width: 0.9, depth: 2.0, height: 0.75, color: '#a5b4fc' },
    { label: 'Document Scanner', relativeX: 0.2, relativeZ: 3.0, width: 0.35, depth: 0.3, height: 0.35, color: '#94a3b8' },
    { label: 'Waiting Chair', relativeX: 2.8, relativeZ: 0.5, width: 0.5, depth: 0.7, height: 0.45, color: '#fcd34d' },
    { label: 'Storage Bin', relativeX: 3.8, relativeZ: 2.0, width: 0.4, depth: 0.4, height: 0.5, color: '#d4d4d8' },
    { label: 'Sign-in Clipboard', relativeX: 0.25, relativeZ: 0.3, width: 0.3, depth: 0.25, height: 0.9, color: '#6ee7b7' },
  ],
  [
    { label: 'Intake Desk', relativeX: 1.5, relativeZ: 1.0, width: 0.9, depth: 2.0, height: 0.75, color: '#a5b4fc' },
    { label: 'Info Poster', relativeX: 4.0, relativeZ: 0.2, width: 0.5, depth: 0.1, height: 0.6, color: '#e0e7ff' },
    { label: 'Resource Rack', relativeX: 0.15, relativeZ: 3.5, width: 0.4, depth: 0.3, height: 0.8, color: '#c4b5fd' },
    { label: 'Sign-in Clipboard', relativeX: 0.25, relativeZ: 0.35, width: 0.3, depth: 0.25, height: 0.9, color: '#6ee7b7' },
    { label: 'Sink', relativeX: 4.0, relativeZ: 4.1, width: 0.45, depth: 0.4, height: 0.8, color: '#a5f3fc' },
  ],
  [
    { label: 'Intake Desk', relativeX: 1.5, relativeZ: 1.0, width: 0.9, depth: 2.0, height: 0.75, color: '#a5b4fc' },
    { label: 'Privacy Screen', relativeX: 0.2, relativeZ: 2.5, width: 0.25, depth: 0.8, height: 1.4, color: '#94a3b8' },
    { label: 'Waiting Chair', relativeX: 3.3, relativeZ: 4.0, width: 0.5, depth: 0.7, height: 0.45, color: '#fcd34d' },
    { label: 'Filing Cabinet', relativeX: 3.8, relativeZ: 2.5, width: 0.5, depth: 0.5, height: 0.75, color: '#c4b5fd' },
    { label: 'Sink', relativeX: 4.0, relativeZ: 4.1, width: 0.45, depth: 0.4, height: 0.8, color: '#a5f3fc' },
  ],
];

// ── Cold Storage Room variants ──────────────────────────────────────────────
const COLD_STORAGE_VARIANTS: FurnitureTemplate[][] = [
  [
    { label: 'Walk-in Cooler', relativeX: 1.5, relativeZ: 1.2, width: 1.5, depth: 1.9, height: 1.8, color: '#bfdbfe' },
    { label: 'Pallet Jack', relativeX: 0.2, relativeZ: 0.4, width: 0.5, depth: 0.55, height: 0.75, color: '#fbbf24' },
    { label: 'Crate Stack', relativeX: 3.8, relativeZ: 2.0, width: 0.5, depth: 0.8, height: 0.75, color: '#a16207' },
    { label: 'Thermometer Display', relativeX: 0.2, relativeZ: 3.8, width: 0.3, depth: 0.2, height: 0.5, color: '#fdba74' },
  ],
  [
    { label: 'Walk-in Freezer', relativeX: 1.5, relativeZ: 1.2, width: 1.5, depth: 1.9, height: 1.8, color: '#dbeafe' },
    { label: 'Shelving Unit', relativeX: 0.2, relativeZ: 0.3, width: 0.4, depth: 0.4, height: 1.6, color: '#9ca3af' },
    { label: 'Crate Stack', relativeX: 3.8, relativeZ: 2.0, width: 0.5, depth: 0.8, height: 0.75, color: '#a16207' },
    { label: 'Insulated Door', relativeX: 0.2, relativeZ: 3.8, width: 0.55, depth: 0.5, height: 1.6, color: '#94a3b8' },
  ],
  [
    { label: 'Walk-in Cooler', relativeX: 1.5, relativeZ: 1.2, width: 1.5, depth: 1.9, height: 1.8, color: '#bfdbfe' },
    { label: 'Dairy Crate', relativeX: 0.15, relativeZ: 2.2, width: 0.5, depth: 0.5, height: 0.6, color: '#fef9c3' },
    { label: 'Produce Tray', relativeX: 3.8, relativeZ: 1.5, width: 0.5, depth: 0.7, height: 0.3, color: '#65a30d' },
    { label: 'Pallet Jack', relativeX: 0.2, relativeZ: 4.0, width: 0.5, depth: 0.55, height: 0.75, color: '#fbbf24' },
  ],
  [
    { label: 'Walk-in Freezer', relativeX: 1.5, relativeZ: 1.2, width: 1.5, depth: 1.9, height: 1.8, color: '#dbeafe' },
    { label: 'Meat Rack', relativeX: 3.5, relativeZ: 0.3, width: 0.5, depth: 0.5, height: 1.4, color: '#d4d4d8' },
    { label: 'Crate Stack', relativeX: 0.2, relativeZ: 3.0, width: 0.5, depth: 0.8, height: 0.75, color: '#a16207' },
    { label: 'Thermometer Display', relativeX: 4.0, relativeZ: 3.5, width: 0.3, depth: 0.2, height: 0.5, color: '#fdba74' },
  ],
  [
    { label: 'Walk-in Cooler', relativeX: 1.5, relativeZ: 1.2, width: 1.5, depth: 1.9, height: 1.8, color: '#bfdbfe' },
    { label: 'Produce Tray', relativeX: 3.5, relativeZ: 0.4, width: 0.5, depth: 0.7, height: 0.3, color: '#65a30d' },
    { label: 'Shelving Unit', relativeX: 0.2, relativeZ: 2.5, width: 0.4, depth: 0.4, height: 1.6, color: '#9ca3af' },
    { label: 'Insulated Door', relativeX: 0.2, relativeZ: 3.8, width: 0.55, depth: 0.5, height: 1.6, color: '#94a3b8' },
  ],
];

// ── Storage Room variants ───────────────────────────────────────────────────
const STORAGE_VARIANTS: FurnitureTemplate[][] = [
  [
    { label: 'Pallet Rack', relativeX: 1.0, relativeZ: 1.5, width: 0.9, depth: 2.0, height: 1.8, color: '#9ca3af' },
    { label: 'Cardboard Box Stack', relativeX: 0.15, relativeZ: 1.5, width: 0.5, depth: 0.45, height: 0.8, color: '#b45309' },
    { label: 'Inventory Cart', relativeX: 3.5, relativeZ: 4.0, width: 0.5, depth: 0.5, height: 0.45, color: '#fcd34d' },
    { label: 'Canned Goods Crate', relativeX: 0.2, relativeZ: 3.5, width: 0.3, depth: 0.25, height: 0.4, color: '#dc2626' },
  ],
  [
    { label: 'Pallet Rack', relativeX: 1.0, relativeZ: 1.5, width: 0.9, depth: 2.0, height: 1.8, color: '#9ca3af' },
    { label: 'Shelving Unit', relativeX: 2.4, relativeZ: 1.5, width: 0.4, depth: 0.35, height: 1.6, color: '#c4b5fd' },
    { label: 'Label Printer', relativeX: 4.0, relativeZ: 0.25, width: 0.3, depth: 0.25, height: 0.3, color: '#d4d4d8' },
    { label: 'Ladder', relativeX: 3.2, relativeZ: 3.5, width: 0.3, depth: 0.6, height: 1.5, color: '#fcd34d' },
    { label: 'Canned Goods Crate', relativeX: 0.2, relativeZ: 3.5, width: 0.3, depth: 0.25, height: 0.4, color: '#dc2626' },
  ],
  [
    { label: 'Pallet Rack', relativeX: 1.0, relativeZ: 1.5, width: 0.9, depth: 2.0, height: 1.8, color: '#9ca3af' },
    { label: 'Cardboard Box Stack', relativeX: 0.15, relativeZ: 1.5, width: 0.5, depth: 0.45, height: 0.8, color: '#b45309' },
    { label: 'Canned Goods Crate', relativeX: 0.2, relativeZ: 3.5, width: 0.3, depth: 0.25, height: 0.4, color: '#dc2626' },
    { label: 'Hand Truck', relativeX: 2.4, relativeZ: 1.0, width: 0.35, depth: 0.3, height: 0.6, color: '#94a3b8' },
    { label: 'Sorting Table', relativeX: 3.5, relativeZ: 2.5, width: 0.5, depth: 0.4, height: 0.6, color: '#a5b4fc' },
  ],
  [
    { label: 'Pallet Rack', relativeX: 1.0, relativeZ: 1.5, width: 0.9, depth: 2.0, height: 1.8, color: '#9ca3af' },
    { label: 'Sorting Table', relativeX: 3.5, relativeZ: 0.2, width: 0.7, depth: 0.5, height: 0.7, color: '#a5b4fc' },
    { label: 'Bulk Bin', relativeX: 4.0, relativeZ: 3.0, width: 0.6, depth: 0.45, height: 1.0, color: '#c4b5fd' },
    { label: 'Canned Goods Crate', relativeX: 0.2, relativeZ: 3.5, width: 0.3, depth: 0.25, height: 0.4, color: '#dc2626' },
    { label: 'Inventory Cart', relativeX: 3.5, relativeZ: 4.2, width: 0.5, depth: 0.5, height: 0.45, color: '#fcd34d' },
  ],
  [
    { label: 'Pallet Rack', relativeX: 1.0, relativeZ: 1.5, width: 0.9, depth: 2.0, height: 1.8, color: '#9ca3af' },
    { label: 'Produce Crate', relativeX: 3.0, relativeZ: 1.8, width: 0.45, depth: 0.7, height: 0.4, color: '#65a30d' },
    { label: 'Inventory Cart', relativeX: 3.5, relativeZ: 3.8, width: 0.5, depth: 0.5, height: 0.45, color: '#fcd34d' },
    { label: 'Cardboard Box Stack', relativeX: 0.15, relativeZ: 1.5, width: 0.5, depth: 0.45, height: 0.8, color: '#b45309' },
    { label: 'Canned Goods Crate', relativeX: 0.2, relativeZ: 3.5, width: 0.3, depth: 0.25, height: 0.4, color: '#dc2626' },
  ],
];

// ─────────────────────────────────────────────────────────────────────────────

export const ROOM_TYPES: RoomTypeDefinition[] = [
  {
    id: 'delivery_van_bay',
    label: 'Delivery Van Bays',
    shortLabel: 'Van',
    description: 'Ground-floor vehicle bays for food deliveries and restocking',
    unitWidth: 5,
    unitDepth: 5,
    floorColor: '#fafaf9',
    wallColor: '#d6d3d1',
    priority: 0,
    groundFloorOnly: true,
    furnitureVariants: DELIVERY_VAN_VARIANTS,
    getCount: (spec) => spec.foodBankDeliveryVans ?? 0,
  },
  {
    id: 'distribution_room',
    label: 'Distribution Counters',
    shortLabel: 'Dist',
    description: 'Client-facing counters for food pickup and distribution',
    unitWidth: 5,
    unitDepth: 5,
    floorColor: '#fff5f5',
    wallColor: '#d1d5db',
    priority: 1,
    groundFloorOnly: true,
    furnitureVariants: DISTRIBUTION_VARIANTS,
    getCount: (spec) => spec.foodBankDistributionCounters ?? 0,
  },
  {
    id: 'intake_room',
    label: 'Intake Rooms',
    shortLabel: 'Intake',
    description: 'Private rooms for client intake and registration',
    unitWidth: 5,
    unitDepth: 5,
    floorColor: '#fffbf0',
    wallColor: '#b8b2a8',
    priority: 2,
    groundFloorOnly: true,
    furnitureVariants: INTAKE_VARIANTS,
    getCount: (spec) => spec.foodBankIntakeRooms ?? 0,
  },
  {
    id: 'cold_storage_room',
    label: 'Cold Storage Units',
    shortLabel: 'Cold',
    description: 'Walk-in fridges and freezers for perishable donations',
    unitWidth: 5,
    unitDepth: 5,
    floorColor: '#f0fdf4',
    wallColor: '#9ca3af',
    priority: 3,
    groundFloorOnly: false,
    furnitureVariants: COLD_STORAGE_VARIANTS,
    getCount: (spec) => spec.foodBankColdStorageUnits ?? 0,
  },
  {
    id: 'storage_room',
    label: 'Storage Rooms',
    shortLabel: 'Storage',
    description: 'Dry storage rooms with pallet racking and shelving',
    unitWidth: 5,
    unitDepth: 5,
    floorColor: '#f5f8fc',
    wallColor: '#b0bec5',
    priority: 4,
    groundFloorOnly: false,
    furnitureVariants: STORAGE_VARIANTS,
    getCount: (spec) => spec.foodBankStorageRooms ?? 0,
  },
];
