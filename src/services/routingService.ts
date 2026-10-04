import { PickupStop, Recycler } from '../types';
import { calculateDistanceKm, DEFAULT_USER_ADDRESS, RECYCLERS_SEED } from './recyclersData';
import { buildOptimizedPickupRoute, RouteOptimizationResult } from './routeOptimizer';

export interface ExtendedRouteResult extends RouteOptimizationResult {
  isEstimated: boolean;
  source: 'osrm-trip' | 'osrm-route' | 'cached' | 'fallback-estimated';
}

// In-memory cache keyed by serialized stop coordinates
const routeMemoryCache = new Map<string, ExtendedRouteResult>();

/**
 * Generate a cache key from coordinates rounded to 5 decimal places (~1m precision)
 */
function createCacheKey(coordinates: [number, number][]): string {
  return coordinates
    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join(';');
}

/**
 * Safe fetch with AbortController timeout (defaults to 6 seconds)
 */
async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Builds candidate stops:
 * Stop 1: User doorstep pickup address
 * Stop 2: Intermediate consolidation & sorting node (nearest neighbor)
 * Stop 3: Destination recycler facility
 */
export function buildCandidateStops(
  userCoordinates: [number, number],
  userAddress: string,
  destinationRecycler: Recycler
): PickupStop[] {
  const candidateNodes = RECYCLERS_SEED.filter((r) => r.id !== destinationRecycler.id);

  let bestMidNode = candidateNodes[0];
  let minMidDist = Infinity;

  for (const node of candidateNodes) {
    const dist = calculateDistanceKm(userCoordinates, node.coordinates);
    if (dist >= 1.5 && dist < minMidDist) {
      minMidDist = dist;
      bestMidNode = node;
    }
  }

  const stop1: PickupStop = {
    id: 'stop-user-doorstep',
    stopNumber: 1,
    name: 'Doorstep Pickup (Your Location)',
    address: userAddress,
    coordinates: userCoordinates,
    type: 'pickup_user',
    etaMinutes: 0,
    distanceFromPreviousKm: 0,
  };

  const stop2: PickupStop = {
    id: `stop-mid-${bestMidNode.id}`,
    stopNumber: 2,
    name: `${bestMidNode.locality} Sorting & Consolidation Node`,
    address: bestMidNode.address,
    coordinates: bestMidNode.coordinates,
    type: 'dropoff_node',
    etaMinutes: 0,
    distanceFromPreviousKm: 0,
  };

  const stop3: PickupStop = {
    id: `stop-dest-${destinationRecycler.id}`,
    stopNumber: 3,
    name: `${destinationRecycler.name} (Final Processing Facility)`,
    address: destinationRecycler.address,
    coordinates: destinationRecycler.coordinates,
    type: 'central_hub',
    etaMinutes: 0,
    distanceFromPreviousKm: 0,
  };

  return [stop1, stop2, stop3];
}

/**
 * Converts OSRM GeoJSON LineString coordinates ([lng, lat]) to Leaflet polyline format ([lat, lng])
 */
function convertGeoJsonToLeafletCoords(geoJsonCoords: [number, number][]): [number, number][] {
  return geoJsonCoords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Main routing service:
 * 1. Checks in-memory cache
 * 2. Tries OSRM Trip API (TSP optimization starting from user address)
 * 3. Falls back to OSRM Route API if Trip fails
 * 4. Falls back to straight-line nearest neighbor with "Estimated route" note if both fail
 * 5. Uses a 6s timeout and avoids red console errors
 */
export async function getOptimizedRoute(
  userCoordinates: [number, number] = DEFAULT_USER_ADDRESS.coordinates,
  userAddress: string = DEFAULT_USER_ADDRESS.address,
  destinationRecycler: Recycler = RECYCLERS_SEED[0]
): Promise<ExtendedRouteResult> {
  const candidateStops = buildCandidateStops(userCoordinates, userAddress, destinationRecycler);
  const cacheKey = createCacheKey(candidateStops.map((s) => s.coordinates));

  // 1. Check in-memory cache
  if (routeMemoryCache.has(cacheKey)) {
    const cached = routeMemoryCache.get(cacheKey)!;
    return { ...cached, source: 'cached' };
  }

  // OSRM coordinates are in lng,lat order
  const coordString = candidateStops
    .map((s) => `${s.coordinates[1]},${s.coordinates[0]}`)
    .join(';');

  // 2. Try OSRM Trip API:
  // First stop is the user's pickup address; the recycler is the last.
  try {
    const tripUrl = `https://router.project-osrm.org/trip/v1/driving/${coordString}?source=first&roundtrip=false&overview=full&geometries=geojson&steps=false`;
    const tripRes = await fetchWithTimeout(tripUrl, 6000);

    if (tripRes.ok) {
      const tripData = await tripRes.json();
      if (tripData.code === 'Ok' && Array.isArray(tripData.trips) && tripData.trips.length > 0) {
        const trip = tripData.trips[0];
        const waypoints = tripData.waypoints || [];

        // Reorder stops according to trip waypoints
        const orderedStops: PickupStop[] = new Array(candidateStops.length);
        waypoints.forEach((wp: { waypoint_index: number }, inputIdx: number) => {
          const tripIdx = wp.waypoint_index;
          if (tripIdx >= 0 && tripIdx < orderedStops.length) {
            orderedStops[tripIdx] = {
              ...candidateStops[inputIdx],
              stopNumber: tripIdx + 1,
            };
          }
        });

        // Fill any gaps if ever present
        for (let i = 0; i < candidateStops.length; i++) {
          if (!orderedStops[i]) {
            orderedStops[i] = { ...candidateStops[i], stopNumber: i + 1 };
          }
        }

        // Calculate per-leg distances and cumulative ETAs
        const legs = trip.legs || [];
        let cumulativeDurationSeconds = 0;
        orderedStops[0].distanceFromPreviousKm = 0;
        orderedStops[0].etaMinutes = 0;

        for (let i = 1; i < orderedStops.length; i++) {
          const leg = legs[i - 1];
          if (leg) {
            cumulativeDurationSeconds += leg.duration || 0;
            orderedStops[i].distanceFromPreviousKm = Number(((leg.distance || 0) / 1000).toFixed(1));
            orderedStops[i].etaMinutes = Math.max(1, Math.round(cumulativeDurationSeconds / 60));
          }
        }

        const totalDistanceKm = Number(((trip.distance || 0) / 1000).toFixed(1));
        const totalDurationMinutes = Math.max(1, Math.round((trip.duration || 0) / 60));
        const co2BatchSavingsKg = Number((totalDistanceKm * 0.28 * 1.8).toFixed(1));
        const polylinePoints = convertGeoJsonToLeafletCoords(trip.geometry.coordinates || []);

        const result: ExtendedRouteResult = {
          orderedStops,
          totalDistanceKm,
          totalDurationMinutes,
          co2BatchSavingsKg,
          polylinePoints,
          isEstimated: false,
          source: 'osrm-trip',
        };

        routeMemoryCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (tripError) {
    // Non-fatal: log warning and proceed to route fallback without throwing console errors
    console.warn('[routingService] OSRM trip call fallback:', tripError);
  }

  // 3. Fallback to OSRM Route API if Trip fails
  try {
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=false`;
    const routeRes = await fetchWithTimeout(routeUrl, 6000);

    if (routeRes.ok) {
      const routeData = await routeRes.json();
      if (routeData.code === 'Ok' && Array.isArray(routeData.routes) && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        const legs = route.legs || [];

        const orderedStops = candidateStops.map((stop, idx) => ({
          ...stop,
          stopNumber: idx + 1,
        }));

        let cumulativeDurationSeconds = 0;
        orderedStops[0].distanceFromPreviousKm = 0;
        orderedStops[0].etaMinutes = 0;

        for (let i = 1; i < orderedStops.length; i++) {
          const leg = legs[i - 1];
          if (leg) {
            cumulativeDurationSeconds += leg.duration || 0;
            orderedStops[i].distanceFromPreviousKm = Number(((leg.distance || 0) / 1000).toFixed(1));
            orderedStops[i].etaMinutes = Math.max(1, Math.round(cumulativeDurationSeconds / 60));
          }
        }

        const totalDistanceKm = Number(((route.distance || 0) / 1000).toFixed(1));
        const totalDurationMinutes = Math.max(1, Math.round((route.duration || 0) / 60));
        const co2BatchSavingsKg = Number((totalDistanceKm * 0.28 * 1.8).toFixed(1));
        const polylinePoints = convertGeoJsonToLeafletCoords(route.geometry.coordinates || []);

        const result: ExtendedRouteResult = {
          orderedStops,
          totalDistanceKm,
          totalDurationMinutes,
          co2BatchSavingsKg,
          polylinePoints,
          isEstimated: false,
          source: 'osrm-route',
        };

        routeMemoryCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (routeError) {
    console.warn('[routingService] OSRM route call fallback:', routeError);
  }

  // 4. Final Fallback: straight-line nearest-neighbor route with "Estimated route" flag
  const fallback = buildOptimizedPickupRoute(userCoordinates, userAddress, destinationRecycler);
  return {
    ...fallback,
    isEstimated: true,
    source: 'fallback-estimated',
  };
}

// Named alias for convenience
export const fetchOptimizedRoute = getOptimizedRoute;
