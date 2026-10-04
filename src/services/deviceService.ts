/**
 * deviceService.ts
 *
 * Persists scanned devices and scheduled pickups to Supabase.
 * All writes are fire-and-forget from the UI's perspective:
 *  - On success → row exists in Supabase.
 *  - On failure → the in-memory / localStorage state still works as normal,
 *    and a warning is logged. The user experience is never degraded.
 */

import { supabase } from './supabaseClient';
import { DeviceAssessment, PickupOrder, PickupStatus, Recycler } from '../types';
import { RECYCLERS_SEED } from './recyclersData';

// ── Storage: upload device photo ───────────────────────────────────────────────
// Returns the storage PATH (not a URL) on success, or null on failure.
// The path format is: <userId>/<deviceId>.jpg
// Callers should save this path in devices.image_url and resolve it to a
// signed URL separately via getDeviceImageUrl().

export async function uploadDevicePhoto(
  file: File,
  userId: string,
  deviceId: string
): Promise<string | null> {
  if (!supabase) return null;

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${deviceId}.${ext}`;

  const { error } = await supabase.storage
    .from('device-photos')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.warn('[deviceService] uploadDevicePhoto error:', error.message);
    return null;
  }

  return path;
}

// In-memory cache for signed URLs so we don't re-fetch them on every re-render
const signedUrlCache = new Map<string, string>();

export async function getDeviceImageUrl(storagePath: string): Promise<string | null> {
  if (!supabase) return null;
  // If already a web URL or data/blob URI, return as-is
  if (storagePath.startsWith('blob:') || storagePath.startsWith('http') || storagePath.startsWith('data:')) {
    return storagePath;
  }

  if (signedUrlCache.has(storagePath)) {
    return signedUrlCache.get(storagePath)!;
  }

  const { data, error } = await supabase.storage
    .from('device-photos')
    .createSignedUrl(storagePath, 3600); // 1 hour TTL

  if (error || !data?.signedUrl) {
    console.warn('[deviceService] getDeviceImageUrl error:', error?.message);
    return null;
  }

  signedUrlCache.set(storagePath, data.signedUrl);
  return data.signedUrl;
}

// Valid enum values matching the DB CHECK constraints
const VALID_CATEGORIES = ['smartphone', 'laptop', 'tablet', 'pc_component', 'audio', 'other'] as const;
const VALID_GRADES     = ['A', 'B', 'C', 'D'] as const;
type DbCategory = typeof VALID_CATEGORIES[number];
type DbGrade    = typeof VALID_GRADES[number];
const coerceCategory = (raw: string): DbCategory =>
  VALID_CATEGORIES.includes(raw as DbCategory) ? (raw as DbCategory) : 'other';
const coerceGrade = (raw: string): DbGrade =>
  VALID_GRADES.includes(raw as DbGrade) ? (raw as DbGrade) : 'C';

// ── Save a scanned device ──────────────────────────────────────────────────────
export async function saveDevice(
  device: DeviceAssessment,
  userId: string
): Promise<{ error: { message: string; details?: string; hint?: string } | null }> {
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.from('devices').insert({
      id:                      device.id,
      user_id:                 userId,
      name:                    device.name,
      category:                coerceCategory(device.category),
      brand:                   device.brand,
      model:                   device.model,
      image_url:               device.imageUrl ?? null,
      grade:                   coerceGrade(device.grade),
      grade_description:       device.gradeDescription,
      confidence:              device.confidence,
      estimated_value_min:     device.estimatedValueMin,
      estimated_value_max:     device.estimatedValueMax,
      detected_issues:         device.detectedIssues,
      materials:               device.materials,
      co2_saved_kg:            device.co2SavedKg,
      toxic_waste_diverted_kg: device.toxicWasteDivertedKg,
      status:                  device.status,
      selected_recycler_id:    device.selectedRecyclerId ?? null,
    });

    if (error) {
      console.error(
        '[deviceService] saveDevice error:',
        error.message,
        (error as any).details ?? '',
        (error as any).hint   ?? ''
      );
      return {
        error: {
          message: error.message,
          details: (error as any).details,
          hint:    (error as any).hint,
        },
      };
    }

    return { error: null };
  } catch (e: any) {
    console.error('[deviceService] saveDevice exception:', e);
    return { error: { message: e?.message ?? 'Unknown error' } };
  }
}

// ── Update device status (e.g. after scheduling a pickup) ─────────────────────

export async function updateDeviceStatus(
  deviceId: string,
  status: DeviceAssessment['status'],
  selectedRecyclerId?: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('devices')
    .update({
      status,
      selected_recycler_id: selectedRecyclerId ?? null,
    })
    .eq('id', deviceId);

  if (error) {
    console.warn('[deviceService] updateDeviceStatus error:', error.message);
  }
}

// ── Create a pickup row ────────────────────────────────────────────────────────

export async function createPickup(
  pickup: PickupOrder,
  userId: string
): Promise<{ error: { message: string; details?: string } | null }> {
  if (!supabase) return { error: null };

  const { error } = await supabase.from('pickups').upsert(
    {
      id: pickup.id,
      user_id: userId,
      device_id: pickup.deviceId,
      recycler_id: pickup.recyclerId,
      pickup_date: pickup.pickupDate,
      time_slot: pickup.timeSlot,
      pickup_address: pickup.pickupAddress,
      status: pickup.status,
      final_payout: pickup.finalPayout,
      route_stops: pickup.routeStops,
      total_distance_km: pickup.totalDistanceKm,
      batch_carbon_saving_kg: pickup.batchCarbonSavingKg,
      tracking_number: pickup.trackingNumber,
      certificate_id: pickup.certificateId,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[deviceService] createPickup error:', error.message, (error as any).details ?? '');
    return { error: { message: error.message, details: (error as any).details } };
  }

  return { error: null };
}

// ── Update pickup status ───────────────────────────────────────────────────────

export async function updatePickupStatus(
  pickupId: string,
  status: PickupStatus,
  finalPayout?: number
): Promise<{ error: { message: string } | null }> {
  if (!supabase) return { error: null };

  const updateData: Record<string, any> = { status };
  if (status === 'paid' && finalPayout != null) {
    updateData.final_payout = finalPayout;
  }

  const { error } = await supabase
    .from('pickups')
    .update(updateData)
    .eq('id', pickupId);

  if (error) {
    console.error('[deviceService] updatePickupStatus error:', error.message, (error as any).details ?? '');
    return { error: { message: error.message } };
  }

  return { error: null };
}

// ── Fetch devices for a signed-in user from Supabase ─────────────────────────

export async function fetchUserDevices(
  userId: string
): Promise<{ devices: DeviceAssessment[] | null; error: any }> {
  if (!supabase) return { devices: null, error: new Error('Supabase not configured') };

  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[deviceService] fetchUserDevices error:', error.message);
      return { devices: null, error };
    }

    const fallbackImages: Record<string, string> = {
      smartphone: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&auto=format&fit=crop&q=80',
      laptop: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
      pc_component: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
      audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      other: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
    };

    const devices: DeviceAssessment[] = await Promise.all(
      (data || []).map(async (row) => {
        let imageUrl = row.image_url;
        const categoryKey = row.category || 'other';
        const defaultImg = fallbackImages[categoryKey] || fallbackImages.other;

        if (!imageUrl || imageUrl.startsWith('blob:')) {
          // Dead blob: or missing URL -> safe fallback to prevent broken images
          imageUrl = defaultImg;
        } else if (!imageUrl.startsWith('http')) {
          // Supabase storage path -> generate / get cached signed URL
          const signed = await getDeviceImageUrl(imageUrl);
          imageUrl = signed || defaultImg;
        }

        return {
          id: row.id,
          name: row.name || 'Electronic Device',
          category: coerceCategory(row.category),
          brand: row.brand || '',
          model: row.model || '',
          imageUrl,
          grade: coerceGrade(row.grade),
          gradeDescription: row.grade_description || `Grade ${row.grade || 'C'} hardware condition`,
          confidence: Number(row.confidence) || 95,
          estimatedValueMin: Number(row.estimated_value_min) || 0,
          estimatedValueMax: Number(row.estimated_value_max) || 0,
          detectedIssues: Array.isArray(row.detected_issues) ? row.detected_issues : [],
          materials:
            row.materials && typeof row.materials === 'object'
              ? row.materials
              : {
                  copperGrams: 0,
                  goldMilligrams: 0,
                  aluminumGrams: 0,
                  rareEarthGrams: 0,
                  hazardousPlasticGrams: 0,
                },
          co2SavedKg: Number(row.co2_saved_kg) || 0,
          toxicWasteDivertedKg: Number(row.toxic_waste_diverted_kg) || 0,
          timestamp: row.created_at || new Date().toISOString(),
          status: row.status || 'scanned',
          selectedRecyclerId: row.selected_recycler_id || undefined,
        };
      })
    );

    return { devices, error: null };
  } catch (err: any) {
    console.error('[deviceService] fetchUserDevices exception:', err);
    return { devices: null, error: err };
  }
}

// ── Fetch pickups for a signed-in user from Supabase ─────────────────────────

export async function fetchUserPickups(
  userId: string,
  loadedDevices: DeviceAssessment[],
  recyclers: Recycler[]
): Promise<{ pickups: PickupOrder[] | null; error: any }> {
  if (!supabase) return { pickups: null, error: new Error('Supabase not configured') };

  try {
    const { data, error } = await supabase
      .from('pickups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[deviceService] fetchUserPickups error:', error.message);
      return { pickups: null, error };
    }

    const pickups: PickupOrder[] = (data || []).map((row) => {
      const matchedDevice = loadedDevices.find((d) => d.id === row.device_id) || {
        id: row.device_id,
        name: 'Assessed E-Waste Device',
        category: 'smartphone' as const,
        brand: '',
        model: '',
        imageUrl: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&auto=format&fit=crop&q=80',
        grade: 'C' as const,
        gradeDescription: 'Grade C hardware condition',
        confidence: 95,
        estimatedValueMin: Number(row.final_payout) || 3000,
        estimatedValueMax: Number(row.final_payout) || 5000,
        detectedIssues: [],
        materials: {
          copperGrams: 15,
          goldMilligrams: 35,
          aluminumGrams: 45,
          rareEarthGrams: 8,
          hazardousPlasticGrams: 25,
        },
        co2SavedKg: Number(row.batch_carbon_saving_kg) || 15,
        toxicWasteDivertedKg: 0.8,
        timestamp: row.created_at,
        status: (row.status === 'paid'
          ? 'payout_completed'
          : row.status === 'collected'
          ? 'recycled'
          : row.status === 'on_the_way'
          ? 'in_transit'
          : 'scheduled_pickup') as DeviceAssessment['status'],
      };

      const matchedRecycler =
        recyclers.find((r) => r.id === row.recycler_id) ||
        RECYCLERS_SEED.find((r) => r.id === row.recycler_id) ||
        recyclers[0] ||
        RECYCLERS_SEED[0];

      return {
        id: row.id,
        deviceId: row.device_id,
        device: matchedDevice,
        recyclerId: row.recycler_id,
        recycler: matchedRecycler,
        pickupDate: row.pickup_date,
        timeSlot: row.time_slot,
        pickupAddress: row.pickup_address,
        status: row.status as PickupStatus,
        finalPayout: Number(row.final_payout) || 0,
        routeStops: Array.isArray(row.route_stops) ? row.route_stops : [],
        totalDistanceKm: Number(row.total_distance_km) || 0,
        batchCarbonSavingKg: Number(row.batch_carbon_saving_kg) || 0,
        trackingNumber: row.tracking_number || `RLP-ERD-${row.id.slice(0, 6).toUpperCase()}`,
        certificateId: row.certificate_id || `CPCB-TN-DISP-${row.id.slice(0, 5).toUpperCase()}`,
        createdAt: row.created_at || new Date().toISOString(),
      };
    });

    return { pickups, error: null };
  } catch (err: any) {
    console.error('[deviceService] fetchUserPickups exception:', err);
    return { pickups: null, error: err };
  }
}

