import { Recycler } from '../types';

export const ERODE_CENTER: [number, number] = [11.3410, 77.7172]; // Erode Junction

export const DEFAULT_USER_ADDRESS = {
  label: "Home (Perundurai Road)",
  address: "Flat 4B, Kaveri Palms, Perundurai Road, Near District Collectorate, Erode, Tamil Nadu 638011",
  coordinates: [11.3345, 77.7015] as [number, number],
};

export const RECYCLERS_SEED: Recycler[] = [
  {
    id: "rec-erode-01",
    name: "EcoCircuits GreenTek Facility",
    organization: "EcoCircuits Sustainable Solutions Ltd.",
    tagline: "TNPCB & CPCB Authorized Tier-1 E-Waste Refiner",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2023/8812",
    r2Certified: true,
    isoCertified: true,
    rating: 4.9,
    reviewCount: 342,
    coordinates: [11.3458, 77.7245], // Brough Road
    address: "74/2, Brough Road, Near Clock Tower, Erode 638001",
    locality: "Brough Road",
    distanceKm: 1.4,
    baseOfferMultiplier: 1.12,
    acceptedCategories: ["smartphone", "laptop", "tablet", "pc_component", "audio"],
    contactPhone: "+91 94421 88392",
    turnaroundTime: "Same-day doorstep collection",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-02",
    name: "Surampatti CleanTech Recovery Hub",
    organization: "CleanTech Circular Economy India",
    tagline: "Specialized in battery neutralisation & rare-earth recovery",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2022/6104",
    r2Certified: true,
    isoCertified: true,
    rating: 4.8,
    reviewCount: 219,
    coordinates: [11.3282, 77.7105], // Surampatti
    address: "128, Surampatti Four Roads, Near Railway Colony, Erode 638009",
    locality: "Surampatti",
    distanceKm: 2.1,
    baseOfferMultiplier: 1.08,
    acceptedCategories: ["smartphone", "laptop", "tablet", "pc_component"],
    contactPhone: "+91 98430 45210",
    turnaroundTime: "Within 4 hours",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-03",
    name: "Kasipalayam Urban Miners & Scrap",
    organization: "Urban Mine Tech Consortium",
    tagline: "Zero-landfill certified electronics dismantling center",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2024/9021",
    r2Certified: false,
    isoCertified: true,
    rating: 4.7,
    reviewCount: 154,
    coordinates: [11.3215, 77.7352], // Kasipalayam
    address: "45, Industrial Estate Road, Kasipalayam, Erode 638002",
    locality: "Kasipalayam",
    distanceKm: 3.6,
    baseOfferMultiplier: 1.04,
    acceptedCategories: ["smartphone", "laptop", "pc_component"],
    contactPhone: "+91 97871 33499",
    turnaroundTime: "Next day scheduled pickup",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-04",
    name: "Chithode Mega E-Waste Processing Plant",
    organization: "Kongu EcoVenture Recyclers Pvt Ltd",
    tagline: "Automated PCB shredding & metallurgical extraction",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2021/4198",
    r2Certified: true,
    isoCertified: true,
    rating: 4.9,
    reviewCount: 489,
    coordinates: [11.4125, 77.6742], // Chithode
    address: "NH 544 Salem-Coimbatore Highway, Chithode Bypass, Erode 638102",
    locality: "Chithode",
    distanceKm: 9.8,
    baseOfferMultiplier: 1.15,
    acceptedCategories: ["smartphone", "laptop", "tablet", "pc_component", "audio", "other"],
    contactPhone: "+91 94432 99801",
    turnaroundTime: "Scheduled smart batch route",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-05",
    name: "Perundurai SIPCOT EcoRecycle Park",
    organization: "SIPCOT Industrial Resource Recovery Corp",
    tagline: "Largest heavy electronic & enterprise server recycling hub",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/PRD/2020/3012",
    r2Certified: true,
    isoCertified: true,
    rating: 4.8,
    reviewCount: 620,
    coordinates: [11.2755, 77.5855], // Perundurai SIPCOT
    address: "Plot B-14, SIPCOT Industrial Growth Estate, Perundurai 638052",
    locality: "Perundurai",
    distanceKm: 14.8,
    baseOfferMultiplier: 1.14,
    acceptedCategories: ["smartphone", "laptop", "pc_component", "audio", "other"],
    contactPhone: "+91 98427 11400",
    turnaroundTime: "Scheduled eco-shuttle",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-06",
    name: "Bhavani RiverGreen Circular Works",
    organization: "Cauvery Delta Clean Tech LLP",
    tagline: "High-yield gold & palladium recovery from logic boards",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/BHV/2023/7710",
    r2Certified: true,
    isoCertified: true,
    rating: 4.85,
    reviewCount: 290,
    coordinates: [11.4485, 77.6835], // Bhavani
    address: "18, Kalingarayan Canal Road, Near Sangameshwarar, Bhavani 638301",
    locality: "Bhavani",
    distanceKm: 12.3,
    baseOfferMultiplier: 1.10,
    acceptedCategories: ["smartphone", "laptop", "pc_component"],
    contactPhone: "+91 94441 55220",
    turnaroundTime: "Direct courier & pickup",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-07",
    name: "Veerappanchatram ChipRevive Tech",
    organization: "ChipRevive Circular Hardware Ltd",
    tagline: "Component salvage & certified military-grade wipe",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2024/9144",
    r2Certified: false,
    isoCertified: true,
    rating: 4.65,
    reviewCount: 98,
    coordinates: [11.3620, 77.7120], // Veerappanchatram
    address: "312, Sathy Main Road, Veerappanchatram, Erode 638004",
    locality: "Veerappanchatram",
    distanceKm: 2.8,
    baseOfferMultiplier: 1.05,
    acceptedCategories: ["smartphone", "laptop", "tablet"],
    contactPhone: "+91 98433 76211",
    turnaroundTime: "Same-day doorstep",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1597733336794-12d05021d510?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-08",
    name: "Solar Erode Metal Recovery Station",
    organization: "Solar Green Metals Co.",
    tagline: "Direct precious metal assay & instant UPI settlement",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2023/8230",
    r2Certified: true,
    isoCertified: true,
    rating: 4.75,
    reviewCount: 184,
    coordinates: [11.2980, 77.7420], // Solar area
    address: "88, Karur Bypass Road, Solar, Erode 638002",
    locality: "Solar",
    distanceKm: 5.4,
    baseOfferMultiplier: 1.09,
    acceptedCategories: ["smartphone", "laptop", "pc_component", "audio"],
    contactPhone: "+91 94420 88200",
    turnaroundTime: "Within 24 hours",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-09",
    name: "Thindal GreenSphere Electronics",
    organization: "GreenSphere Environmental Network",
    tagline: "Authorized campus and residential electronic collection",
    verified: true,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2022/5501",
    r2Certified: true,
    isoCertified: true,
    rating: 4.8,
    reviewCount: 312,
    coordinates: [11.3140, 77.6790], // Thindal
    address: "56, Thindal Hill Road, Near Velalar College, Erode 638012",
    locality: "Thindal",
    distanceKm: 4.9,
    baseOfferMultiplier: 1.07,
    acceptedCategories: ["smartphone", "laptop", "tablet", "audio"],
    contactPhone: "+91 97890 12345",
    turnaroundTime: "Within 3 hours",
    dataDestructionGuarantee: true,
    avatarUrl: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "rec-erode-10",
    name: "Railway Colony Eco-Depot",
    organization: "Southern Eco Logistics",
    tagline: "Express collection hub beside Erode Railway Junction",
    verified: false,
    cpcbRegNumber: "CPCB/EW-TN/ERD/2024/9910",
    r2Certified: false,
    isoCertified: true,
    rating: 4.5,
    reviewCount: 76,
    coordinates: [11.3385, 77.7210], // Railway Colony
    address: "12, Goods Shed Road, Railway Colony, Erode 638001",
    locality: "Railway Colony",
    distanceKm: 0.9,
    baseOfferMultiplier: 0.98,
    acceptedCategories: ["smartphone", "laptop", "pc_component"],
    contactPhone: "+91 93600 44102",
    turnaroundTime: "Immediate walk-in or pickup",
    dataDestructionGuarantee: false,
    avatarUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80"
  }
];

// Helper to calculate haversine distance in km
export function calculateDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
