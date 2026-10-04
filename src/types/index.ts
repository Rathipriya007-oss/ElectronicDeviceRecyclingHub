export type ConditionGrade = 'A' | 'B' | 'C' | 'D';

export interface DetectedIssue {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'positive';
  description: string;
}

export interface MaterialYield {
  copperGrams: number;
  goldMilligrams: number;
  aluminumGrams: number;
  rareEarthGrams: number;
  hazardousPlasticGrams: number;
}

export interface DeviceAssessment {
  id: string;
  name: string;
  category: 'smartphone' | 'laptop' | 'tablet' | 'pc_component' | 'audio' | 'other';
  brand: string;
  model: string;
  imageUrl: string;
  grade: ConditionGrade;
  gradeDescription: string;
  confidence: number; // e.g. 96 (%)
  estimatedValueMin: number; // in INR ₹
  estimatedValueMax: number; // in INR ₹
  detectedIssues: DetectedIssue[];
  materials: MaterialYield;
  co2SavedKg: number;
  toxicWasteDivertedKg: number;
  timestamp: string;
  status: 'scanned' | 'scheduled_pickup' | 'in_transit' | 'recycled' | 'payout_completed';
  selectedRecyclerId?: string;
}

export interface Recycler {
  id: string;
  name: string;
  organization: string;
  tagline: string;
  verified: boolean;
  cpcbRegNumber: string; // Central Pollution Control Board Reg No
  r2Certified: boolean;
  isoCertified: boolean;
  rating: number; // e.g. 4.9
  reviewCount: number;
  coordinates: [number, number]; // [lat, lng]
  address: string;
  locality: string;
  distanceKm: number;
  baseOfferMultiplier: number; // 0.95 to 1.15 multiplier on base device value
  acceptedCategories: string[];
  contactPhone: string;
  turnaroundTime: string;
  dataDestructionGuarantee: boolean;
  avatarUrl: string;
}

export interface PickupStop {
  id: string;
  stopNumber: number;
  name: string;
  address: string;
  coordinates: [number, number];
  type: 'pickup_user' | 'dropoff_node' | 'central_hub';
  etaMinutes: number;
  distanceFromPreviousKm: number;
}

export type PickupStatus = 'scheduled' | 'on_the_way' | 'collected' | 'paid';

export interface PickupOrder {
  id: string;
  deviceId: string;
  device: DeviceAssessment;
  recyclerId: string;
  recycler: Recycler;
  pickupDate: string;
  timeSlot: string;
  pickupAddress: string;
  status: PickupStatus;
  finalPayout: number;
  routeStops: PickupStop[];
  totalDistanceKm: number;
  batchCarbonSavingKg: number;
  trackingNumber: string;
  certificateId: string;
  createdAt: string;
}
