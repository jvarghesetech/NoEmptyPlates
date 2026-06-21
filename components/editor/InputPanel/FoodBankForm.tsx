import { useMemo } from 'react';
import { BuildingSpecification } from '@/lib/editor/types/buildingSpec';
import { useBuildingSound } from '@/lib/editor/hooks/useBuildingSound';

interface FoodBankFormProps {
  spec: BuildingSpecification;
  onUpdate: (updates: Partial<BuildingSpecification>) => void;
}

const SLIDER_CLASS =
  'flex-4 h-4 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-12 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-400 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing';

const INPUT_CLASS =
  'flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-center focus:border-blue-400 focus:outline-none transition-colors duration-200';

// Staffing ratio constants (modeled on food bank operations guidance)
const VOLUNTEER_PER_PALLET = 4.5;        // 1 volunteer per 4-5 pallet positions to keep stock rotated
const COORDINATOR_PER_PALLET = 18;       // 1 coordinator per ~18 pallet positions for oversight
const VOLUNTEERS_PER_COLD_STORAGE = 2.5; // ~2.5 volunteers per walk-in fridge/freezer (loading + rotation)
const VOLUNTEER_PER_DISTRIBUTION = 3;    // 1 volunteer per 3 clients at a distribution counter
const COORDINATOR_PER_DISTRIBUTION = 10; // 1 coordinator per 10 clients keeps lines moving
const PALLET_OCCUPANCY_WARNING = 0.85;   // above 85% shelving use, restocking flow problems likely
const STAGING_BAYS_PER_COLD_STORAGE = 2; // ~2 staging bays per cold storage unit for incoming/outgoing
const VOLUNTEER_PER_INTAKE_ROOM = 1;     // 1:1 ratio for private intake/registration rooms
const DELIVERY_VAN_BAY_AREA = 27;        // ~3.6m x 7.6m per van bay (loading dock guidelines)

export function FoodBankForm({ spec, onUpdate }: FoodBankFormProps) {
  const { play: playSound } = useBuildingSound();

  // Calculate building size metrics
  const totalFloorArea = spec.width * spec.depth * spec.numberOfFloors;
  const groundFloorArea = spec.width * spec.depth;

  // Current values
  const pallets = spec.foodBankPalletCapacity ?? 0;
  const storageRooms = spec.foodBankStorageRooms ?? 0;
  const coordinators = spec.foodBankCoordinators ?? 0;
  const volunteers = spec.foodBankVolunteers ?? 0;
  const coldStorageUnits = spec.foodBankColdStorageUnits ?? 0;
  const distributionCounters = spec.foodBankDistributionCounters ?? 0;
  const deliveryVans = spec.foodBankDeliveryVans ?? 0;
  const intakeRooms = spec.foodBankIntakeRooms ?? 0;

  // Physical maximums based on building size
  const limits = useMemo(() => {
    // Storage rooms: ~46 sq m per room (500 sq ft standard room + circulation)
    const maxStorageRooms = Math.max(1, Math.floor(totalFloorArea / 46));
    // Pallet positions: ~19 sq m per position (rack footprint + aisle access)
    const maxPallets = Math.max(1, Math.floor(totalFloorArea / 19));
    // Cold storage units: ~56 sq m each + support, ~1 per 2,000 sq m total
    const maxColdStorageUnits = Math.max(1, Math.floor(totalFloorArea / 2000));
    // Distribution counters: ground floor only, ~1 per 30 sq m
    const maxDistributionCounters = Math.max(1, Math.floor(groundFloorArea / 30));
    // Delivery vans: ground-floor bay space (~27 sq m each), also ~1 per 5 distribution counters
    const maxDeliveryVansBySpace = Math.max(1, Math.floor(groundFloorArea / (DELIVERY_VAN_BAY_AREA * 4)));
    const maxDeliveryVans = maxDeliveryVansBySpace;
    // Intake rooms: ground floor, ~1 per 15 distribution counters, ~40-50 sq m each
    const maxIntakeRooms = Math.max(1, Math.min(
      Math.floor(groundFloorArea / 200),  // space constraint
      Math.max(1, Math.floor(maxDistributionCounters / 8))  // ratio to distribution size
    ));
    // Volunteer pool: ~1 person per 40 sq m
    const maxTotalStaff = Math.max(2, Math.floor(totalFloorArea / 40));

    return { maxStorageRooms, maxPallets, maxColdStorageUnits, maxDistributionCounters, maxDeliveryVans, maxIntakeRooms, maxTotalStaff };
  }, [totalFloorArea, groundFloorArea]);

  // Staff limits: coordinators and volunteers share a pool, complementary not interchangeable
  const staffUsed = coordinators + volunteers;
  const maxCoordinators = Math.max(0, limits.maxTotalStaff - volunteers);
  const maxVolunteers = Math.max(0, limits.maxTotalStaff - coordinators);

  // --- Capacity analysis (the core interdependency model) ---

  // Volunteer allocation: split across cold storage, intake, distribution, and general storage
  // Priority: cold storage (hard req) → intake (1:1 critical) → distribution → general storage
  const volunteersNeededForColdStorage = coldStorageUnits * VOLUNTEERS_PER_COLD_STORAGE;
  const volunteersNeededForIntake = intakeRooms * VOLUNTEER_PER_INTAKE_ROOM;
  const volunteersNeededForDistribution = Math.ceil(distributionCounters / VOLUNTEER_PER_DISTRIBUTION);
  const volunteersAfterColdStorage = Math.max(0, volunteers - volunteersNeededForColdStorage);
  const volunteersForIntake = Math.min(volunteersAfterColdStorage, volunteersNeededForIntake);
  const volunteersAfterIntake = Math.max(0, volunteersAfterColdStorage - volunteersForIntake);
  const volunteersForDistribution = Math.min(volunteersAfterIntake, volunteersNeededForDistribution);
  const volunteersForStorage = Math.max(0, volunteersAfterIntake - volunteersForDistribution);

  // Coordinator allocation: distribution coordinators first, then general storage
  const coordinatorsNeededForDistribution = Math.ceil(distributionCounters / COORDINATOR_PER_DISTRIBUTION);
  const coordinatorsForDistribution = Math.min(coordinators, coordinatorsNeededForDistribution);
  const coordinatorsForStorage = Math.max(0, coordinators - coordinatorsForDistribution);

  // Usable capacity formulas
  const usablePallets = Math.min(
    pallets,
    Math.floor(volunteersForStorage * VOLUNTEER_PER_PALLET),
    Math.floor(coordinatorsForStorage * COORDINATOR_PER_PALLET)
  );
  const usableColdStorageUnits = Math.min(coldStorageUnits, Math.floor(volunteers / VOLUNTEERS_PER_COLD_STORAGE));
  const usableDistributionCounters = Math.min(
    distributionCounters,
    Math.floor(volunteersForDistribution * VOLUNTEER_PER_DISTRIBUTION),
    Math.floor(coordinatorsForDistribution * COORDINATOR_PER_DISTRIBUTION)
  );

  // Occupancy and warnings
  const palletOccupancyRate = pallets > 0 ? usablePallets / pallets : 0;
  const stagingBaysNeeded = coldStorageUnits * STAGING_BAYS_PER_COLD_STORAGE;

  // Warning flags
  const volunteerShortage = volunteers < volunteersNeededForColdStorage + volunteersNeededForIntake + volunteersNeededForDistribution;
  const palletBottleneck = pallets > 0 && usablePallets < pallets;
  const coldStorageUnderstaffed = coldStorageUnits > 0 && usableColdStorageUnits < coldStorageUnits;
  const distributionUnderstaffed = distributionCounters > 0 && usableDistributionCounters < distributionCounters;
  const palletsExceedRooms = pallets > storageRooms * 4; // more than 4 pallet positions/room is unrealistic
  const intakeUnderstaffed = intakeRooms > 0 && volunteersForIntake < volunteersNeededForIntake;
  const vansExceedDistribution = deliveryVans > 0 && distributionCounters === 0;

  const clampedUpdate = (key: keyof BuildingSpecification, value: number, max: number) => {
    onUpdate({ [key]: Math.min(Math.max(0, value), max) });
    playSound('resize_object');
  };

  const fields: {
    label: string;
    key: keyof BuildingSpecification;
    max: number;
    value: number;
    description: string;
    warning?: string;
  }[] = [
    {
      label: 'Storage Rooms',
      key: 'foodBankStorageRooms',
      max: limits.maxStorageRooms,
      value: Math.min(storageRooms, limits.maxStorageRooms),
      description: 'Layout constraint for shelving placement and stock organization',
      warning: palletsExceedRooms ? 'Too many pallet positions for this room count (max ~4 per room)' : undefined,
    },
    {
      label: 'Pallet Storage Capacity',
      key: 'foodBankPalletCapacity',
      max: limits.maxPallets,
      value: Math.min(pallets, limits.maxPallets),
      description: 'Primary staffing driver — pallet capacity determines volunteer and coordinator demand',
      warning: palletBottleneck ? `Only ${usablePallets} of ${pallets} pallet positions safely stocked` : undefined,
    },
    {
      label: 'Coordinators',
      key: 'foodBankCoordinators',
      max: maxCoordinators,
      value: Math.min(coordinators, maxCoordinators),
      description: 'Complementary to volunteers — improve throughput, not a substitute',
    },
    {
      label: 'Volunteers',
      key: 'foodBankVolunteers',
      max: maxVolunteers,
      value: Math.min(volunteers, maxVolunteers),
      description: 'Primary capacity unlock — required for storage, cold storage, and distribution',
      warning: volunteerShortage ? `Need ${Math.ceil(volunteersNeededForColdStorage + volunteersNeededForIntake + volunteersNeededForDistribution)} just for cold storage + intake + distribution coverage` : undefined,
    },
    {
      label: 'Cold Storage Units',
      key: 'foodBankColdStorageUnits',
      max: limits.maxColdStorageUnits,
      value: Math.min(coldStorageUnits, limits.maxColdStorageUnits),
      description: `Each unit needs ~${VOLUNTEERS_PER_COLD_STORAGE} volunteers + ${STAGING_BAYS_PER_COLD_STORAGE} staging bays`,
      warning: coldStorageUnderstaffed ? `Only ${usableColdStorageUnits} of ${coldStorageUnits} cold storage units have volunteer coverage` : undefined,
    },
    {
      label: 'Distribution Counters',
      key: 'foodBankDistributionCounters',
      max: limits.maxDistributionCounters,
      value: Math.min(distributionCounters, limits.maxDistributionCounters),
      description: 'Ground-floor only — 1 volunteer per 3 clients, 1 coordinator per 10',
      warning: distributionUnderstaffed ? `Only ${usableDistributionCounters} of ${distributionCounters} counters safely staffed` : undefined,
    },
    {
      label: 'Intake / Registration Rooms',
      key: 'foodBankIntakeRooms',
      max: limits.maxIntakeRooms,
      value: Math.min(intakeRooms, limits.maxIntakeRooms),
      description: 'Private rooms for client intake — 1:1 volunteer ratio required',
      warning: intakeUnderstaffed ? `Only ${volunteersForIntake} of ${volunteersNeededForIntake} intake volunteers covered` : undefined,
    },
    {
      label: 'Delivery Vans',
      key: 'foodBankDeliveryVans',
      max: limits.maxDeliveryVans,
      value: Math.min(deliveryVans, limits.maxDeliveryVans),
      description: `Ground-floor bay parking (~${DELIVERY_VAN_BAY_AREA} sq m each) — feeds distribution`,
      warning: vansExceedDistribution ? 'Delivery vans have no distribution counters to restock' : undefined,
    },
  ];

  const hasActivity = pallets > 0 || coldStorageUnits > 0 || distributionCounters > 0 || intakeRooms > 0 || deliveryVans > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">Food Bank Parameters</h3>

      {/* Building size summary */}
      <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 space-y-1">
        <p className="text-sm text-gray-700">
          Building Size: <span className="font-bold text-blue-700">{spec.width}m x {spec.depth}m</span>
        </p>
        <p className="text-sm text-gray-700">
          Floors: <span className="font-bold text-blue-700">{spec.numberOfFloors}</span>
        </p>
        <p className="text-sm text-gray-700">
          Total Floor Area: <span className="font-bold text-blue-700">{totalFloorArea.toLocaleString()} sq m</span>
          <span className="text-gray-400 text-xs ml-1">({Math.round(totalFloorArea * 10.764).toLocaleString()} sq ft)</span>
        </p>
        <p className="text-sm text-gray-700">
          Staff: <span className="font-bold text-blue-700">{staffUsed}</span>
          <span className="text-gray-500"> / {limits.maxTotalStaff} capacity</span>
        </p>
      </div>

      {/* Sliders */}
      {fields.map(({ label, key, max, value, description, warning }) => (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {label}: <span className="text-blue-600">{value}</span>
            <span className="text-gray-400 text-xs ml-2">(max: {max})</span>
          </label>
          <p className="text-xs text-gray-500 -mt-1">{description}</p>
          {warning && (
            <p className="text-xs text-orange-600 font-medium -mt-0.5">{warning}</p>
          )}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max={max}
              step="1"
              value={value}
              onChange={(e) => clampedUpdate(key, parseInt(e.target.value), max)}
              className={SLIDER_CLASS}
            />
            <input
              type="number"
              min="0"
              max={max}
              step="1"
              value={value}
              onChange={(e) => clampedUpdate(key, parseInt(e.target.value) || 0, max)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      ))}

      {/* Capacity Analysis Dashboard */}
      {hasActivity && (
        <div className="pt-4 mt-2 border-t-2 border-gray-200 space-y-3">
          <h4 className="text-sm font-bold text-gray-800">Capacity Analysis</h4>

          {/* Usable capacity bars */}
          <div className="space-y-2">
            {pallets > 0 && (
              <CapacityBar
                label="Pallet Storage"
                usable={usablePallets}
                total={pallets}
                color={usablePallets >= pallets ? 'green' : usablePallets >= pallets * 0.5 ? 'yellow' : 'red'}
              />
            )}
            {coldStorageUnits > 0 && (
              <CapacityBar
                label="Cold Storage Units"
                usable={usableColdStorageUnits}
                total={coldStorageUnits}
                color={usableColdStorageUnits >= coldStorageUnits ? 'green' : 'red'}
              />
            )}
            {distributionCounters > 0 && (
              <CapacityBar
                label="Distribution Counters"
                usable={usableDistributionCounters}
                total={distributionCounters}
                color={usableDistributionCounters >= distributionCounters ? 'green' : usableDistributionCounters >= distributionCounters * 0.5 ? 'yellow' : 'red'}
              />
            )}
            {intakeRooms > 0 && (
              <CapacityBar
                label="Intake Rooms"
                usable={Math.min(intakeRooms, volunteersForIntake)}
                total={intakeRooms}
                color={volunteersForIntake >= volunteersNeededForIntake ? 'green' : 'red'}
              />
            )}
          </div>

          {/* Volunteer allocation breakdown */}
          {volunteers > 0 && (
            <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Volunteer Allocation</p>
              <div className="grid grid-cols-4 gap-1 text-xs">
                <div>
                  <span className="text-gray-500">Cold Storage</span>
                  <p className="font-bold text-gray-800">{Math.min(Math.ceil(volunteersNeededForColdStorage), volunteers)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Intake</span>
                  <p className="font-bold text-gray-800">{volunteersForIntake}</p>
                </div>
                <div>
                  <span className="text-gray-500">Distribution</span>
                  <p className="font-bold text-gray-800">{volunteersForDistribution}</p>
                </div>
                <div>
                  <span className="text-gray-500">Storage</span>
                  <p className="font-bold text-gray-800">{volunteersForStorage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {pallets > 0 && (
              <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <span className="text-gray-500">Total Pallet Positions</span>
                <p className="font-bold text-blue-700">{pallets}</p>
              </div>
            )}
            {pallets > 0 && storageRooms > 0 && (
              <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <span className="text-gray-500">Pallets / Room</span>
                <p className="font-bold text-gray-800">{(pallets / storageRooms).toFixed(1)}</p>
              </div>
            )}
            {pallets > 0 && (
              <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <span className="text-gray-500">Staffed Capacity</span>
                <p className={`font-bold ${palletOccupancyRate >= PALLET_OCCUPANCY_WARNING ? 'text-green-700' : 'text-orange-600'}`}>
                  {(palletOccupancyRate * 100).toFixed(0)}%
                </p>
              </div>
            )}
            {pallets > 0 && (
              <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <span className="text-gray-500">Sq m / Pallet</span>
                <p className="font-bold text-gray-800">{(totalFloorArea / pallets).toFixed(0)}</p>
              </div>
            )}
            {coldStorageUnits > 0 && (
              <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <span className="text-gray-500">Staging Bays Needed</span>
                <p className="font-bold text-gray-800">{stagingBaysNeeded}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CapacityBar({ label, usable, total, color }: {
  label: string;
  usable: number;
  total: number;
  color: 'green' | 'yellow' | 'red';
}) {
  const pct = total > 0 ? Math.min((usable / total) * 100, 100) : 0;
  const barColor = color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
  const textColor = color === 'green' ? 'text-green-700' : color === 'yellow' ? 'text-yellow-700' : 'text-red-700';

  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className={`font-bold ${textColor}`}>{usable} / {total} usable</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
