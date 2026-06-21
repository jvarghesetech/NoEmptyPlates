import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { BuildingSpecification } from '@/lib/editor/types/buildingSpec';
import { generateBuildingAllocation } from '@/lib/editor/floorplan/layoutAlgorithm';
import type { PlacedRoom, PlacedFurniture } from '@/lib/editor/floorplan/layoutAlgorithm';

const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.15;

function OuterWalls({ width, depth, wallColor, opacity = 1 }: { width: number; depth: number; wallColor: string; opacity?: number }) {
  const halfHeight = WALL_HEIGHT / 2;
  const isTransparent = opacity < 1;

  return (
    <group>
      {/* Front wall */}
      <mesh position={[width / 2, halfHeight, 0]}>
        <boxGeometry args={[width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={wallColor} transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
      </mesh>
      {/* Back wall */}
      <mesh position={[width / 2, halfHeight, depth]}>
        <boxGeometry args={[width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={wallColor} transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
      </mesh>
      {/* Left wall */}
      <mesh position={[0, halfHeight, depth / 2]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, depth]} />
        <meshStandardMaterial color={wallColor} transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width, halfHeight, depth / 2]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, depth]} />
        <meshStandardMaterial color={wallColor} transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
      </mesh>
    </group>
  );
}

/** Simple 3D delivery van model: box body + green stripe + cab + 4 wheels + roof vent */
function DeliveryVanModel({ f }: { f: PlacedFurniture }) {
  const cx = f.x + f.width / 2;
  const cz = f.z + f.depth / 2;

  const bodyW = 1.3;
  const bodyD = 2.8;
  const bodyH = 0.75;
  const wheelR = 0.14;
  const wheelW = 0.1;

  return (
    <group position={[cx, 0, cz]}>
      {/* Main body */}
      <mesh position={[0, bodyH / 2 + wheelR * 2, 0]}>
        <boxGeometry args={[bodyW, bodyH, bodyD]} />
        <meshStandardMaterial color="#f8f8f8" />
      </mesh>
      {/* Green stripe */}
      <mesh position={[0, bodyH * 0.35 + wheelR * 2, 0]}>
        <boxGeometry args={[bodyW + 0.01, bodyH * 0.18, bodyD + 0.01]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      {/* Cab (front section) */}
      <mesh position={[0, bodyH * 0.82 + wheelR * 2, -bodyD * 0.28]}>
        <boxGeometry args={[bodyW * 0.88, bodyH * 0.28, bodyD * 0.32]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, bodyH * 0.82 + wheelR * 2, -bodyD * 0.47]}>
        <boxGeometry args={[bodyW * 0.7, bodyH * 0.22, 0.04]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} />
      </mesh>
      {/* 4 Wheels */}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]).map(([xOff, zOff], i) => (
        <mesh
          key={i}
          position={[xOff * bodyW * 0.38, wheelR, zOff * bodyD * 0.32]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[wheelR, wheelR, wheelW, 12]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ))}
      {/* Roof vent */}
      <mesh position={[0, bodyH + wheelR * 2 + 0.04, -bodyD * 0.18]}>
        <boxGeometry args={[bodyW * 0.3, 0.06, 0.18]} />
        <meshStandardMaterial color="#d4d4d8" />
      </mesh>
      {/* Logo panel on side */}
      <mesh position={[bodyW / 2 + 0.005, bodyH * 0.6 + wheelR * 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[bodyD * 0.4, bodyH * 0.22, 0.01]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  );
}

function FurnitureItem({ f, opacity = 1 }: { f: PlacedFurniture; opacity?: number }) {
  const isTransparent = opacity < 1;

  // Render delivery van as special model (skip for ghost floors to keep it simple)
  if (f.label === 'Delivery Van' && !isTransparent) {
    return <DeliveryVanModel f={f} />;
  }

  return (
    <mesh position={[f.x + f.width / 2, f.height / 2, f.z + f.depth / 2]}>
      <boxGeometry args={[f.width, f.height, f.depth]} />
      <meshStandardMaterial color={f.color} transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
    </mesh>
  );
}

function RoomCell({ room, opacity = 1 }: { room: PlacedRoom; opacity?: number }) {
  const halfHeight = WALL_HEIGHT / 2;
  const isTransparent = opacity < 1;

  return (
    <group>
      {/* Room-specific floor patch */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[room.x + room.width / 2, 0.001, room.z + room.depth / 2]}
      >
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color={room.floorColor} transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
      </mesh>

      {/* Room divider walls (right and bottom edges) */}
      <mesh position={[room.x + room.width + WALL_THICKNESS / 2, halfHeight, room.z + room.depth / 2]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, room.depth]} />
        <meshStandardMaterial color={room.wallColor} transparent opacity={Math.min(0.7, opacity)} depthWrite={!isTransparent} />
      </mesh>
      <mesh position={[room.x + room.width / 2, halfHeight, room.z + room.depth + WALL_THICKNESS / 2]}>
        <boxGeometry args={[room.width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={room.wallColor} transparent opacity={Math.min(0.7, opacity)} depthWrite={!isTransparent} />
      </mesh>

      {/* Furniture */}
      {room.furniture.map((f, fi) => (
        <FurnitureItem key={fi} f={f} opacity={opacity} />
      ))}

      {/* Room label — hide on ghost floors */}
      {!isTransparent && (
        <Text
          position={[room.x + room.width / 2, 0.02, room.z + room.depth / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={Math.min(0.45, room.width / 7)}
          color="#6b7280"
          anchorX="center"
          anchorY="middle"
        >
          {room.roomLabel}
        </Text>
      )}
    </group>
  );
}

interface FloorPlanViewProps {
  floorIndex: number;
  spec: BuildingSpecification;
  opacity?: number;
}

export function FloorPlanView({ floorIndex, spec, opacity = 1 }: FloorPlanViewProps) {
  const allocation = useMemo(() => generateBuildingAllocation(spec), [spec]);

  const floor = allocation.floors[floorIndex];
  // Position the floor at its actual height
  const floorY = floorIndex * spec.floorHeight;
  const isTransparent = opacity < 1;

  if (!floor || floor.rooms.length === 0) {
    return (
      <group position={[-allocation.floorWidth / 2, floorY, -allocation.floorDepth / 2]}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[allocation.floorWidth / 2, -0.01, allocation.floorDepth / 2]}
        >
          <planeGeometry args={[allocation.floorWidth, allocation.floorDepth]} />
          <meshStandardMaterial color="#f9fafb" transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
        </mesh>
        <OuterWalls width={allocation.floorWidth} depth={allocation.floorDepth} wallColor="#b0bec5" opacity={opacity} />
        {!isTransparent && (
          <Text
            position={[allocation.floorWidth / 2, 0.02, allocation.floorDepth / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1}
            color="#d1d5db"
            anchorX="center"
            anchorY="middle"
          >
            Empty Floor
          </Text>
        )}
      </group>
    );
  }

  return (
    <group position={[-allocation.floorWidth / 2, floorY, -allocation.floorDepth / 2]}>
      {/* Base floor plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[allocation.floorWidth / 2, -0.01, allocation.floorDepth / 2]}
      >
        <planeGeometry args={[allocation.floorWidth, allocation.floorDepth]} />
        <meshStandardMaterial color="#f9fafb" transparent={isTransparent} opacity={opacity} depthWrite={!isTransparent} />
      </mesh>

      {/* Outer walls */}
      <OuterWalls width={allocation.floorWidth} depth={allocation.floorDepth} wallColor="#94a3b8" opacity={opacity} />

      {/* Rooms */}
      {floor.rooms.map((room, i) => (
        <RoomCell key={i} room={room} opacity={opacity} />
      ))}
    </group>
  );
}

// Export for use by sidebar to get allocation summary
export { generateBuildingAllocation };
