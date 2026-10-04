import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DeviceAssessment, Recycler, PickupOrder, PickupStatus, PickupStop } from '../types';
import { RECYCLERS_SEED, DEFAULT_USER_ADDRESS, calculateDistanceKm } from '../services/recyclersData';
import { buildOptimizedPickupRoute } from '../services/routeOptimizer';
import { fetchNearbyRecyclers } from '../services/recyclerService';
import {
  saveDevice,
  updateDeviceStatus,
  createPickup,
  updatePickupStatus as dbUpdatePickupStatus,
  fetchUserDevices,
  fetchUserPickups,
} from '../services/deviceService';
import { supabase } from '../services/supabaseClient';
import confetti from 'canvas-confetti';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface AppContextType {
  devices: DeviceAssessment[];
  currentDevice: DeviceAssessment | null;
  setCurrentDevice: (device: DeviceAssessment | null) => void;
  addDeviceScan: (device: DeviceAssessment) => void;
  
  recyclers: Recycler[];
  selectedRecycler: Recycler | null;
  setSelectedRecycler: (recycler: Recycler | null) => void;
  
  userAddress: { label: string; address: string; coordinates: [number, number] };
  setUserAddress: (addr: { label: string; address: string; coordinates: [number, number] }) => void;
  
  pickups: PickupOrder[];
  currentPickup: PickupOrder | null;
  setCurrentPickup: (pickup: PickupOrder | null) => void;
  schedulePickup: (options: {
    deviceId: string;
    recyclerId: string;
    pickupDate: string;
    timeSlot: string;
    pickupAddress: string;
    routeData?: {
      orderedStops: PickupStop[];
      totalDistanceKm: number;
      totalDurationMinutes: number;
      co2BatchSavingsKg: number;
      polylinePoints: [number, number][];
    };
  }) => PickupOrder;
  updatePickupStatus: (pickupId: string, status: PickupStatus) => void;

  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  isDemoMode: boolean;
  toggleDemoMode: () => void;

  /** The UUID of the currently signed-in Supabase user, or null before auth resolves. */
  userId: string | null;

  // Global and personal impact metrics
  impactStats: {
    devicesCount: number;
    kgDiverted: number;
    co2SavedKg: number;
    totalEarningsInr: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial seed devices for a rich realistic dashboard
const INITIAL_SAVED_DEVICES: DeviceAssessment[] = [
  {
    id: 'dev-demo-01',
    name: 'Apple iPhone 11 (64GB, Space Black)',
    category: 'smartphone',
    brand: 'Apple',
    model: 'A2221',
    imageUrl: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&auto=format&fit=crop&q=80',
    grade: 'C',
    gradeDescription: 'Grade C: Hairline front glass fissure; functional logic board & TrueDepth array.',
    confidence: 95.8,
    estimatedValueMin: 4200,
    estimatedValueMax: 5800,
    detectedIssues: [
      { id: 'i1', label: 'Screen Hairline Crack', severity: 'medium', description: 'Touch sensors 100% responsive' },
      { id: 'i2', label: 'Original Battery @ 76%', severity: 'medium', description: 'Cobalt chemistry reusable' }
    ],
    materials: {
      copperGrams: 15.4,
      goldMilligrams: 34.2,
      aluminumGrams: 48.0,
      rareEarthGrams: 9.8,
      hazardousPlasticGrams: 28.0
    },
    co2SavedKg: 21.4,
    toxicWasteDivertedKg: 0.92,
    timestamp: '2026-10-02T10:15:00.000Z',
    status: 'scheduled_pickup',
    selectedRecyclerId: 'rec-erode-01'
  },
  {
    id: 'dev-demo-02',
    name: 'Lenovo ThinkPad T480 (Core i5, 16GB)',
    category: 'laptop',
    brand: 'Lenovo',
    model: '20L5',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    grade: 'B',
    gradeDescription: 'Grade B: Light cosmetic scuffs; motherboard, dual battery & display pristine.',
    confidence: 96.4,
    estimatedValueMin: 9800,
    estimatedValueMax: 13500,
    detectedIssues: [
      { id: 'i3', label: 'Surface Scratches', severity: 'low', description: 'Cosmetic lid marks' },
      { id: 'i4', label: 'Healthy Logic Board', severity: 'positive', description: 'Zero water ingress' }
    ],
    materials: {
      copperGrams: 95.0,
      goldMilligrams: 180.0,
      aluminumGrams: 320.0,
      rareEarthGrams: 28.0,
      hazardousPlasticGrams: 410.0
    },
    co2SavedKg: 42.6,
    toxicWasteDivertedKg: 2.1,
    timestamp: '2026-09-28T14:30:00.000Z',
    status: 'payout_completed',
    selectedRecyclerId: 'rec-erode-04'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<DeviceAssessment[]>(() => {
    const saved = localStorage.getItem('reloop_devices');
    return saved ? JSON.parse(saved) : INITIAL_SAVED_DEVICES;
  });

  const [currentDevice, setCurrentDevice] = useState<DeviceAssessment | null>(devices[0] || null);

  const [userAddress, setUserAddress] = useState<{
    label: string;
    address: string;
    coordinates: [number, number];
  }>(() => {
    const saved = localStorage.getItem('reloop_address');
    return saved ? JSON.parse(saved) : DEFAULT_USER_ADDRESS;
  });

  // Recyclers — seeded immediately, then refreshed from Supabase
  const [recyclers, setRecyclers] = useState<Recycler[]>(() =>
    RECYCLERS_SEED.map((r) => ({
      ...r,
      distanceKm: calculateDistanceKm(DEFAULT_USER_ADDRESS.coordinates, r.coordinates),
    }))
  );
  const [recyclersSource, setRecyclersSource] = useState<'supabase' | 'mock' | null>(null);
  // Ref to avoid showing the source toast more than once per address change
  const recyclerFetchCount = useRef(0);
  // Holds the signed-in Supabase user id (UUID). Stored in a ref so save
  // functions always see the latest value without re-subscribing effects.
  const userIdRef = useRef<string | null>(null);

  const [selectedRecycler, setSelectedRecycler] = useState<Recycler | null>(RECYCLERS_SEED[0]);

  // Initial demo pickup order
  const [pickups, setPickups] = useState<PickupOrder[]>(() => {
    const saved = localStorage.getItem('reloop_pickups');
    if (saved) return JSON.parse(saved);

    const demoRecycler = RECYCLERS_SEED[0];
    const demoDevice = INITIAL_SAVED_DEVICES[0];
    const routeInfo = buildOptimizedPickupRoute(
      DEFAULT_USER_ADDRESS.coordinates,
      DEFAULT_USER_ADDRESS.address,
      demoRecycler
    );

    const initialPickup: PickupOrder = {
      id: 'pickup-erd-8891',
      deviceId: demoDevice.id,
      device: demoDevice,
      recyclerId: demoRecycler.id,
      recycler: demoRecycler,
      pickupDate: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(),
      timeSlot: '10:00 AM - 01:00 PM',
      pickupAddress: DEFAULT_USER_ADDRESS.address,
      status: 'on_the_way',
      finalPayout: Math.round(demoDevice.estimatedValueMax * demoRecycler.baseOfferMultiplier),
      routeStops: routeInfo.orderedStops,
      routeGeometry: routeInfo.polylinePoints,
      totalDistanceKm: routeInfo.totalDistanceKm,
      batchCarbonSavingKg: routeInfo.co2BatchSavingsKg,
      trackingNumber: 'RLP-ERD-2026-992',
      certificateId: 'CPCB-TN-DISP-09418',
      createdAt: '2026-10-03T09:00:00.000Z'
    };

    return [initialPickup];
  });

  const [currentPickup, setCurrentPickup] = useState<PickupOrder | null>(pickups[0] || null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('reloop_demo_mode') === 'true';
  });

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem('reloop_demo_mode', String(next));
      if (next) {
        // Pre-fill demo device and demo pickup
        setCurrentDevice(INITIAL_SAVED_DEVICES[0]);
        setSelectedRecycler(RECYCLERS_SEED[0]);
        addToast({
          type: 'info',
          title: '⚡ Demo Mode Activated',
          description: 'Offline presentation data pre-filled: iPhone 11 (Grade C) & Brough Road Route ready.'
        });
      } else {
        addToast({
          type: 'info',
          title: 'Demo Mode Deactivated',
          description: 'Standard operational mode restored.'
        });
      }
      return next;
    });
  };

  // Keep local storage in sync
  useEffect(() => {
    localStorage.setItem('reloop_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('reloop_pickups', JSON.stringify(pickups));
  }, [pickups]);

  useEffect(() => {
    localStorage.setItem('reloop_address', JSON.stringify(userAddress));
  }, [userAddress]);

  // ── Supabase Auth: sign in with the seeded demo account so RLS writes succeed ──
  useEffect(() => {
    if (!supabase) return; // Supabase not configured — skip silently

    const loadUserData = async (uid: string) => {
      try {
        const { devices: userDevices, error: devErr } = await fetchUserDevices(uid);
        let loadedDevs: DeviceAssessment[] = [];
        if (!devErr && userDevices !== null) {
          loadedDevs = userDevices;
          setDevices(userDevices);
          if (userDevices.length > 0) {
            setCurrentDevice(userDevices[0]);
          } else {
            setCurrentDevice(null);
          }
        }

        const { pickups: userPickups, error: pickErr } = await fetchUserPickups(
          uid,
          loadedDevs.length > 0 ? loadedDevs : devices,
          recyclers
        );
        if (!pickErr && userPickups !== null) {
          setPickups(userPickups);
          if (userPickups.length > 0) {
            setCurrentPickup(userPickups[0]);
          } else {
            setCurrentPickup(null);
          }
        }
      } catch (e) {
        console.warn('[AppContext] loadUserData exception:', e);
      }
    };

    // Keep userIdRef in sync with the live session (token refresh, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      userIdRef.current = uid;
      if (uid) {
        loadUserData(uid);
      }
    });

    // Capture existing session or sign in with the demo account on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        userIdRef.current = session.user.id;
        loadUserData(session.user.id);
        return;
      }

      const email    = (import.meta.env.VITE_DEMO_EMAIL    as string | undefined)?.trim();
      const password = (import.meta.env.VITE_DEMO_PASSWORD as string | undefined)?.trim();

      if (!email || !password) {
        console.warn('[auth] VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD not set — DB writes will be skipped.');
        return;
      }

      supabase!.auth
        .signInWithPassword({ email, password })
        .then(({ error, data }) => {
          if (error) {
            console.warn('[auth] Demo sign-in failed:', error.message);
          } else if (data?.user?.id) {
            userIdRef.current = data.user.id;
            loadUserData(data.user.id);
          }
        });
    });

    return () => { subscription.unsubscribe(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch recyclers from Supabase (or fall back to seed) whenever the user location changes
  useEffect(() => {
    let cancelled = false;
    const currentFetch = ++recyclerFetchCount.current;

    // Optimistically show seed distances while the RPC is in-flight
    setRecyclers(
      RECYCLERS_SEED.map((r) => ({
        ...r,
        distanceKm: calculateDistanceKm(userAddress.coordinates, r.coordinates),
      }))
    );

    fetchNearbyRecyclers(userAddress.coordinates, 50).then(({ recyclers: fetched, source }) => {
      if (cancelled || currentFetch !== recyclerFetchCount.current) return;
      setRecyclers(fetched);
      setRecyclersSource(source);
      if (source === 'supabase') {
        addToast({
          type: 'success',
          title: 'Live Recycler Data Loaded',
          description: `${fetched.length} facilities fetched from Supabase within 50 km.`,
        });
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress.coordinates[0], userAddress.coordinates[1]]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addDeviceScan = (newDevice: DeviceAssessment) => {
    setDevices((prev) => [newDevice, ...prev]);
    setCurrentDevice(newDevice);

    // Persist to Supabase; show a warning toast if the DB insert fails
    if (userIdRef.current) {
      saveDevice(newDevice, userIdRef.current).then(({ error }) => {
        if (error) {
          addToast({
            type: 'warning',
            title: 'Device saved locally only',
            description: `DB error: ${error.message}${error.hint ? ' — ' + error.hint : ''}`,
          });
        }
      }).catch(() => {/* network failure — local state is still correct */});
    }

    addToast({
      type: 'success',
      title: 'Device Analysis Complete',
      description: `${newDevice.name} graded as Grade ${newDevice.grade} (Est: ₹${newDevice.estimatedValueMin.toLocaleString('en-IN')} - ₹${newDevice.estimatedValueMax.toLocaleString('en-IN')})`,
    });
  };

  const schedulePickup = (options: {
    deviceId: string;
    recyclerId: string;
    pickupDate: string;
    timeSlot: string;
    pickupAddress: string;
    routeData?: {
      orderedStops: PickupStop[];
      totalDistanceKm: number;
      totalDurationMinutes: number;
      co2BatchSavingsKg: number;
      polylinePoints: [number, number][];
    };
  }): PickupOrder => {
    const device = devices.find((d) => d.id === options.deviceId) || currentDevice || devices[0];
    const recycler = recyclers.find((r) => r.id === options.recyclerId) || selectedRecycler || recyclers[0];

    if (recycler && !recycler.verified) {
      addToast({
        type: 'warning',
        title: 'Unverified Recycler',
        description: 'Only verified recyclers can schedule pickups.',
      });
      return null as any;
    }

    const routeInfo = options.routeData || buildOptimizedPickupRoute(
      userAddress.coordinates,
      options.pickupAddress,
      recycler
    );

    const calculatedPayout = Math.round(
      device.estimatedValueMax * (recycler.baseOfferMultiplier || 1.05)
    );

    const newPickup: PickupOrder = {
      id: crypto.randomUUID(),
      deviceId: device.id,
      device: { ...device, status: 'scheduled_pickup', selectedRecyclerId: recycler.id },
      recyclerId: recycler.id,
      recycler,
      pickupDate: options.pickupDate,
      timeSlot: options.timeSlot,
      pickupAddress: options.pickupAddress,
      status: 'scheduled',
      finalPayout: calculatedPayout,
      routeStops: routeInfo.orderedStops,
      routeGeometry: routeInfo.polylinePoints,
      totalDistanceKm: routeInfo.totalDistanceKm,
      batchCarbonSavingKg: routeInfo.co2BatchSavingsKg,
      trackingNumber: `RLP-ERD-${Math.floor(100000 + Math.random() * 900000)}`,
      certificateId: `CPCB-TN-DISP-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString()
    };

    // Update device status in state
    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id
          ? { ...d, status: 'scheduled_pickup', selectedRecyclerId: recycler.id }
          : d
      )
    );

    setPickups((prev) => [newPickup, ...prev]);
    setCurrentPickup(newPickup);

    // Persist to Supabase and show result toast
    if (userIdRef.current) {
      updateDeviceStatus(device.id, 'scheduled_pickup', recycler.id).catch(() => {/* silent */});

      createPickup(newPickup, userIdRef.current).then(({ error }) => {
        if (error) {
          console.error(
            '[schedulePickup] DB insert failed:',
            error.message,
            error.details ?? ''
          );
          addToast({
            type: 'warning',
            title: 'Pickup saved locally only',
            description: `DB error: ${error.message}`,
          });
        } else {
          addToast({
            type: 'success',
            title: `Pickup Saved — Tracking: ${newPickup.trackingNumber}`,
            description: `Route confirmed with ${recycler.name} — ${options.pickupDate}`,
          });
        }
      }).catch(() => {/* network failure — ignore, local state is correct */});
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#34D399', '#A3E635', '#38BDF8', '#FFFFFF']
      });
    } catch {
      // ignore
    }

    // Base confirmation toast (always shown regardless of DB result)
    addToast({
      type: 'success',
      title: 'Smart Pickup Confirmed!',
      description: `Collection route scheduled with ${recycler.name} for ${options.pickupDate} (${options.timeSlot})`
    });

    return newPickup;
  };

  const updatePickupStatus = (pickupId: string, newStatus: PickupStatus) => {
    // Map pickup status to matching devices.status
    const STATUS_MAP: Record<PickupStatus, DeviceAssessment['status']> = {
      scheduled: 'scheduled_pickup',
      on_the_way: 'in_transit',
      collected: 'recycled',
      paid: 'payout_completed',
    };
    const targetDeviceStatus = STATUS_MAP[newStatus];

    const targetPickup = pickups.find((p) => p.id === pickupId);
    const payoutAmount = targetPickup?.finalPayout || 5500;

    // Persist status change (and final_payout if status becomes paid) to Supabase
    dbUpdatePickupStatus(pickupId, newStatus, newStatus === 'paid' ? payoutAmount : undefined).catch(() => {/* silent */});

    // Also update devices.status in Supabase to match
    if (targetPickup?.deviceId) {
      updateDeviceStatus(targetPickup.deviceId, targetDeviceStatus).catch(() => {/* silent */});
    }

    setPickups((prev) =>
      prev.map((p) => {
        if (p.id === pickupId) {
          const updated = {
            ...p,
            status: newStatus,
            finalPayout: newStatus === 'paid' ? payoutAmount : p.finalPayout,
          };
          return updated;
        }
        return p;
      })
    );

    // Also update devices state
    if (targetPickup?.deviceId) {
      setDevices((devs) =>
        devs.map((d) =>
          d.id === targetPickup.deviceId
            ? { ...d, status: targetDeviceStatus }
            : d
        )
      );
    }

    setCurrentPickup((prev) =>
      prev && prev.id === pickupId
        ? { ...prev, status: newStatus, finalPayout: newStatus === 'paid' ? payoutAmount : prev.finalPayout }
        : prev
    );

    if (newStatus === 'paid') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A3E635', '#34D399', '#FBBF24'],
      });
      addToast({
        type: 'success',
        title: `Instant UPI Payout Credited!`,
        description: `₹${payoutAmount.toLocaleString('en-IN')} sent directly to your verified account.`,
      });
    } else {
      addToast({
        type: 'info',
        title: `Pickup Status: ${newStatus.replace('_', ' ').toUpperCase()}`,
        description: `Batch route updated for ${targetPickup?.trackingNumber || pickupId}`,
      });
    }
  };

  // Compute aggregated user impact metrics strictly from rows
  const totalUserEarnings = pickups
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.finalPayout || 0), 0);

  const totalUserCo2 = devices.reduce((sum, d) => sum + (d.co2SavedKg || 0), 0);
  const totalUserWasteKg = devices.reduce((sum, d) => sum + (d.toxicWasteDivertedKg || 0), 0);

  const impactStats = {
    devicesCount: devices.length,
    kgDiverted: Number(totalUserWasteKg.toFixed(2)),
    co2SavedKg: Number(totalUserCo2.toFixed(1)),
    totalEarningsInr: totalUserEarnings
  };

  // Expose recyclersSource on context so components can optionally badge live data
  void recyclersSource; // used only for the toast side-effect above

  return (
    <AppContext.Provider
      value={{
        devices,
        currentDevice,
        setCurrentDevice,
        addDeviceScan,
        recyclers,
        selectedRecycler,
        setSelectedRecycler,
        userAddress,
        setUserAddress,
        pickups,
        currentPickup,
        setCurrentPickup,
        schedulePickup,
        updatePickupStatus,
        toasts,
        addToast,
        removeToast,
        isDemoMode,
        toggleDemoMode,
        userId: userIdRef.current,
        impactStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
