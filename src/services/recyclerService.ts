/**
 * recyclerService.ts
 *
 * Provides `fetchNearbyRecyclers` which calls the Supabase `nearby_recyclers` RPC
 * and maps the snake_case DB row into the app's `Recycler` type.
 *
 * Falls back to the local RECYCLERS_SEED (already distance-stamped) whenever
 * Supabase is unavailable or the RPC fails, so the UI is always populated.
 */

import { supabase } from './supabaseClient';
import { RECYCLERS_SEED, calculateDistanceKm } from './recyclersData';
import { Recycler } from '../types';

// ── DB row shape returned by the nearby_recyclers RPC ─────────────────────────
interface NearbyRecyclerRow {
  id: string;
  name: string;
  organization: string;
  tagline: string;
  verified: boolean;
  cpcb_reg_number: string;
  r2_certified: boolean;
  iso_certified: boolean;
  rating: number;
  review_count: number;
  lat_out: number;
  lng_out: number;
  address: string;
  locality: string;
  distance_km: number;
  base_offer_multiplier: number;
  accepted_categories: string[];
  contact_phone: string;
  turnaround_time: string;
  data_destruction_guarantee: boolean;
  avatar_url: string;
}

/** Convert a DB row into the app's Recycler type */
function rowToRecycler(row: NearbyRecyclerRow): Recycler {
  return {
    id: row.id,
    name: row.name,
    organization: row.organization,
    tagline: row.tagline,
    verified: row.verified,
    cpcbRegNumber: row.cpcb_reg_number,
    r2Certified: row.r2_certified,
    isoCertified: row.iso_certified,
    rating: row.rating,
    reviewCount: row.review_count,
    coordinates: [row.lat_out, row.lng_out] as [number, number],
    address: row.address,
    locality: row.locality,
    distanceKm: Number(row.distance_km),
    baseOfferMultiplier: Number(row.base_offer_multiplier),
    acceptedCategories: row.accepted_categories,
    contactPhone: row.contact_phone,
    turnaroundTime: row.turnaround_time,
    dataDestructionGuarantee: row.data_destruction_guarantee,
    avatarUrl: row.avatar_url,
  };
}

/**
 * Fetch recyclers near `userCoords` within `radiusKm`.
 *
 * @returns Array of `Recycler` objects (from Supabase or mock fallback)
 *          plus a flag indicating the data source.
 */
export async function fetchNearbyRecyclers(
  userCoords: [number, number],
  radiusKm = 50
): Promise<{ recyclers: Recycler[]; source: 'supabase' | 'mock' }> {
  const [lat, lng] = userCoords;

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('nearby_recyclers', {
        lat,
        lng,
        radius_km: radiusKm,
      });

      if (error) {
        console.warn('[recyclerService] RPC error, falling back to mock:', error.message);
      } else if (data && (data as NearbyRecyclerRow[]).length > 0) {
        return {
          recyclers: (data as NearbyRecyclerRow[]).map(rowToRecycler),
          source: 'supabase',
        };
      }
    } catch (e) {
      console.warn('[recyclerService] Network error, falling back to mock:', e);
    }
  }

  // Mock fallback — stamp live distances from the user's coordinates
  const fallback = RECYCLERS_SEED.map((r) => ({
    ...r,
    distanceKm: calculateDistanceKm(userCoords, r.coordinates),
  }));

  return { recyclers: fallback, source: 'mock' };
}
