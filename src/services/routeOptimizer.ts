import { PickupStop, Recycler } from '../types';
import { calculateDistanceKm, DEFAULT_USER_ADDRESS, RECYCLERS_SEED } from './recyclersData';

export interface RouteOptimizationResult {
  orderedStops: PickupStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  co2BatchSavingsKg: number;
  polylinePoints: [number, number][];
}

/**
 * Generates an optimized 3-stop route using nearest-neighbor logic
 * Stop 1: Demo User Pickup Location (Erode city center / Perundurai Rd)
 * Stop 2: Optimized Nearest Regional Transit & Sorting Node (e.g. Surampatti / Brough Rd)
 * Stop 3: Destination Processing Facility (The user's chosen recycler)
 */
export function buildOptimizedPickupRoute(
  userCoordinates: [number, number] = DEFAULT_USER_ADDRESS.coordinates,
  userAddress: string = DEFAULT_USER_ADDRESS.address,
  destinationRecycler: Recycler = RECYCLERS_SEED[0]
): RouteOptimizationResult {
  // Find the intermediate consolidation node:
  // Pick a realistic secondary node that is distinct from user and destination
  const candidateNodes = RECYCLERS_SEED.filter(
    (r) => r.id !== destinationRecycler.id
  );

  // Use nearest-neighbor from user coordinate
  let bestMidNode = candidateNodes[0];
  let minMidDist = Infinity;

  for (const node of candidateNodes) {
    const dist = calculateDistanceKm(userCoordinates, node.coordinates);
    if (dist >= 1.5 && dist < minMidDist) {
      minMidDist = dist;
      bestMidNode = node;
    }
  }

  // Calculate distance legs
  const leg1Dist = calculateDistanceKm(userCoordinates, bestMidNode.coordinates);
  const leg2Dist = calculateDistanceKm(bestMidNode.coordinates, destinationRecycler.coordinates);
  const totalDistanceKm = Number((leg1Dist + leg2Dist).toFixed(1));

  // Average speed in urban/suburban Erode: ~30 km/h (2 mins per km + 10 mins loading/inspection per stop)
  const leg1Eta = Math.round(leg1Dist * 2.1) + 8;
  const leg2Eta = Math.round(leg2Dist * 2.1) + 12;
  const totalDurationMinutes = leg1Eta + leg2Eta;

  // Batching route saves ~42% fuel and CO2 vs individual dedicated diesel van runs
  const co2BatchSavingsKg = Number((totalDistanceKm * 0.28 * 1.8).toFixed(1));

  const stop1: PickupStop = {
    id: 'stop-user-doorstep',
    stopNumber: 1,
    name: 'Doorstep Pickup (Your Location)',
    address: userAddress,
    coordinates: userCoordinates,
    type: 'pickup_user',
    etaMinutes: 0,
    distanceFromPreviousKm: 0
  };

  const stop2: PickupStop = {
    id: `stop-mid-${bestMidNode.id}`,
    stopNumber: 2,
    name: `${bestMidNode.locality} Sorting & Consolidation Node`,
    address: bestMidNode.address,
    coordinates: bestMidNode.coordinates,
    type: 'dropoff_node',
    etaMinutes: leg1Eta,
    distanceFromPreviousKm: leg1Dist
  };

  const stop3: PickupStop = {
    id: `stop-dest-${destinationRecycler.id}`,
    stopNumber: 3,
    name: `${destinationRecycler.name} (Final Processing Facility)`,
    address: destinationRecycler.address,
    coordinates: destinationRecycler.coordinates,
    type: 'central_hub',
    etaMinutes: totalDurationMinutes,
    distanceFromPreviousKm: leg2Dist
  };

  // Generate intermediate waypoint route path for smooth map rendering
  const polylinePoints = generateRealisticWaypoints([
    userCoordinates,
    bestMidNode.coordinates,
    destinationRecycler.coordinates
  ]);

  return {
    orderedStops: [stop1, stop2, stop3],
    totalDistanceKm,
    totalDurationMinutes,
    co2BatchSavingsKg,
    polylinePoints
  };
}

/**
 * Creates subtle curved waypoint jitter between stops so the polyline looks like realistic road navigation
 */
function generateRealisticWaypoints(anchors: [number, number][]): [number, number][] {
  const points: [number, number][] = [];

  for (let i = 0; i < anchors.length - 1; i++) {
    const start = anchors[i];
    const end = anchors[i + 1];
    points.push(start);

    // 2 intermediate pseudo-road interpolation points
    const latDiff = end[0] - start[0];
    const lngDiff = end[1] - start[1];

    points.push([
      start[0] + latDiff * 0.35 + (Math.sin(i * 3 + 1) * 0.0018),
      start[1] + lngDiff * 0.35 - (Math.cos(i * 2 + 1) * 0.0018)
    ]);

    points.push([
      start[0] + latDiff * 0.72 - (Math.cos(i * 3 + 2) * 0.0016),
      start[1] + lngDiff * 0.72 + (Math.sin(i * 2 + 2) * 0.0016)
    ]);
  }

  points.push(anchors[anchors.length - 1]);
  return points;
}
