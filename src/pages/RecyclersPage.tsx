import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Recycler } from '../types';
import { RecyclerCard } from '../components/RecyclerCard';
import { LeafletMap } from '../components/LeafletMap';
import {
  MapPin,
  Filter,
  ShieldCheck,
  Search,
  X,
  Phone
} from 'lucide-react';

export const RecyclersPage: React.FC = () => {
  const navigate = useNavigate();
  const { recyclers, selectedRecycler, setSelectedRecycler, currentDevice, userAddress } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'payout' | 'distance' | 'rating'>('payout');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const [auditModalRecycler, setAuditModalRecycler] = useState<Recycler | null>(null);

  // Filter and sort recyclers
  const filteredRecyclers = useMemo(() => {
    return recyclers
      .filter((r) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = r.name.toLowerCase().includes(q);
          const matchLocality = r.locality.toLowerCase().includes(q);
          if (!matchName && !matchLocality) return false;
        }
        if (r.distanceKm > maxDistance) return false;
        if (r.rating < minRating) return false;
        if (verifiedOnly && !r.verified) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'payout') {
          return b.baseOfferMultiplier - a.baseOfferMultiplier;
        }
        if (sortBy === 'distance') {
          return a.distanceKm - b.distanceKm;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        return 0;
      });
  }, [recyclers, searchQuery, maxDistance, minRating, verifiedOnly, sortBy]);

  const handleSelectRecycler = (recycler: Recycler) => {
    setSelectedRecycler(recycler);
  };

  const handleSchedulePickup = (recycler: Recycler) => {
    setSelectedRecycler(recycler);
    navigate('/pickup');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-[#07100D]">
      
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#EBD3A0] bg-[#EBD3A0]/10 px-3 py-1 rounded-full border border-[#EBD3A0]/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3FA17C]" />
            <span>Erode Cluster Directory • CPCB Authorized</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6] tracking-tight">
            Verified Electronics Recyclers
          </h1>
          <p className="text-[#8C9C94] text-sm mt-1 font-sans">
            Compare transparent recovery pricing, certified data sanitization protocols, and pickup turnaround times across Erode.
          </p>
        </div>

        {/* Current Device Banner */}
        {currentDevice && (
          <div className="px-4 py-2.5 rounded-xl bg-surface border border-[#EBD3A0]/20 flex items-center gap-3 shadow-card">
            <img
              src={currentDevice.imageUrl}
              alt={currentDevice.name}
              className="w-8 h-8 rounded-lg object-cover border border-white/10"
            />
            <div className="text-xs font-sans">
              <span className="text-[#8C9C94] block text-[10px] uppercase tracking-wider">Pricing Bids For:</span>
              <span className="text-[#F3EFE6] font-medium">{currentDevice.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tab Toggle (List vs Map) */}
      <div className="flex lg:hidden mb-4 p-1 rounded-xl bg-surface border border-white/[0.07]">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 text-xs font-sans transition-all rounded-lg ${
            mobileTab === 'list'
              ? 'bg-[#EBD3A0] text-[#1A1409] font-semibold shadow-sm'
              : 'text-[#8C9C94] hover:text-[#F3EFE6]'
          }`}
        >
          List View ({filteredRecyclers.length})
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 text-xs font-sans transition-all rounded-lg ${
            mobileTab === 'map'
              ? 'bg-[#EBD3A0] text-[#1A1409] font-semibold shadow-sm'
              : 'text-[#8C9C94] hover:text-[#F3EFE6]'
          }`}
        >
          Erode Map View
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/[0.07] mb-6 space-y-4 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-[#8C9C94] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by facility or locality (e.g. Brough Rd, Surampatti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] placeholder-[#8C9C94]/60 text-xs font-sans focus:border-[#EBD3A0] outline-none"
            />
          </div>

          {/* Distance Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="text-xs font-sans text-[#8C9C94] shrink-0">Radius:</span>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] text-xs font-sans focus:border-[#EBD3A0] outline-none"
            >
              <option value={5}>Within 5 km (City Center)</option>
              <option value={10}>Within 10 km (Outer Ring)</option>
              <option value={20}>All Erode Cluster (20 km)</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <span className="text-xs font-sans text-[#8C9C94] shrink-0">Rating:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] text-xs font-sans focus:border-[#EBD3A0] outline-none"
            >
              <option value={0}>Any Rating</option>
              <option value={4.6}>4.6+ Stars</option>
              <option value={4.8}>4.8+ Top Rated</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="text-xs font-sans text-[#8C9C94] shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] text-xs font-sans focus:border-[#EBD3A0] outline-none"
            >
              <option value="payout">Highest Payout Offer</option>
              <option value="distance">Closest Distance</option>
              <option value="rating">Highest User Rating</option>
            </select>
          </div>

        </div>

        {/* Secondary Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.05] text-xs font-sans">
          <label className="flex items-center gap-2 text-[#8C9C94] hover:text-[#F3EFE6] cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded accent-[#EBD3A0]"
            />
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3FA17C]" />
              <span>Show CPCB / R2v3 Certified Facilities Only</span>
            </span>
          </label>

          <div className="text-[#8C9C94]">
            Showing <span className="text-[#F3EFE6] font-mono">{filteredRecyclers.length}</span> of {recyclers.length} facilities
          </div>
        </div>
      </div>

      {/* Split View: Recyclers Cards List (Left) & Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Recyclers Cards Column */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}>
          {filteredRecyclers.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-white/[0.07] text-center space-y-3 shadow-card">
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto text-[#8C9C94]">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#F3EFE6]">No facilities matched your criteria</h3>
              <p className="text-xs text-[#8C9C94] max-w-sm mx-auto font-sans">
                Try widening your distance radius or clearing rating filters to view all 10 certified Erode cluster facilities.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setMaxDistance(20);
                  setMinRating(0);
                  setVerifiedOnly(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-sans text-[#EBD3A0] bg-[#EBD3A0]/10 border border-[#EBD3A0]/25 hover:bg-[#EBD3A0]/20 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredRecyclers.map((recycler) => (
              <RecyclerCard
                key={recycler.id}
                recycler={recycler}
                currentDevice={currentDevice}
                isSelected={selectedRecycler?.id === recycler.id}
                onSelect={() => handleSelectRecycler(recycler)}
                onSchedulePickup={() => handleSchedulePickup(recycler)}
                onViewDetails={() => setAuditModalRecycler(recycler)}
              />
            ))
          )}
        </div>

        {/* Map Column (Sticky on Desktop) */}
        <div className={`lg:col-span-5 lg:sticky lg:top-24 space-y-3 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between text-xs font-sans text-[#8C9C94] px-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#EBD3A0]" />
              <span>Interactive Erode Geographic Hub</span>
            </span>
            <span className="text-[11px] font-mono">Zoom 12 • Erode Junction</span>
          </div>

          <LeafletMap
            recyclers={filteredRecyclers}
            selectedRecyclerId={selectedRecycler?.id}
            onSelectRecycler={handleSelectRecycler}
            userCoordinates={userAddress.coordinates}
            height="560px"
          />

          {/* Selected Facility Summary Bar */}
          {selectedRecycler && (
            <div className="glass-panel p-4 rounded-xl border border-[#EBD3A0]/30 flex items-center justify-between gap-3 text-xs font-sans shadow-card">
              <div className="min-w-0">
                <span className="text-[#8C9C94] block truncate text-[10px] uppercase tracking-wider">Target Facility</span>
                <span className="text-[#F3EFE6] font-medium truncate block mt-0.5">{selectedRecycler.name}</span>
              </div>
              <button
                onClick={() => handleSchedulePickup(selectedRecycler)}
                className="btn-gold px-4 py-2 text-xs font-sans font-semibold tracking-tight shrink-0"
              >
                Schedule Now
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Recycler Audits & Compliance Modal */}
      {auditModalRecycler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.1] max-w-xl w-full space-y-5 bg-[#0E1814] max-h-[90vh] overflow-y-auto shadow-card">
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={auditModalRecycler.avatarUrl}
                  alt={auditModalRecycler.name}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#F3EFE6]">{auditModalRecycler.name}</h3>
                  <p className="text-xs text-[#8C9C94] font-sans">{auditModalRecycler.organization}</p>
                </div>
              </div>
              <button
                onClick={() => setAuditModalRecycler(null)}
                className="p-1.5 rounded-lg text-[#8C9C94] hover:text-[#F3EFE6] hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges strip */}
            <div className="flex flex-wrap gap-2 text-xs font-sans">
              <span className="px-2.5 py-1 rounded-lg bg-[#3FA17C]/10 text-[#67C7A2] border border-[#3FA17C]/25 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">CPCB: {auditModalRecycler.cpcbRegNumber}</span>
              </span>
              {auditModalRecycler.r2Certified && (
                <span className="px-2.5 py-1 rounded-lg bg-[#3FA17C]/10 text-[#67C7A2] border border-[#3FA17C]/25">
                  R2v3 Standard
                </span>
              )}
              {auditModalRecycler.isoCertified && (
                <span className="px-2.5 py-1 rounded-lg bg-[#4FA3A5]/10 text-[#71C5C7] border border-[#4FA3A5]/25">
                  ISO 14001:2015
                </span>
              )}
            </div>

            {/* Full Audit Checklist */}
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-surface border border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-[#F3EFE6] font-medium">
                  <span>Data Sanitization Protocol</span>
                  <span className="text-[#EBD3A0] font-mono text-[11px]">DoD 5220.22-M / NIST 800-88</span>
                </div>
                <p className="text-[#8C9C94] text-[11px] leading-relaxed">
                  All storage platters and flash memory chips are degaussed and shredded. Digitally cryptographically signed certificates are provided.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-[#F3EFE6] font-medium">
                  <span>Material Recovery Protocol</span>
                  <span className="text-[#3FA17C]">Zero-Landfill Guarantee</span>
                </div>
                <p className="text-[#8C9C94] text-[11px] leading-relaxed">
                  Non-ferrous precious metals (Gold, Silver, Palladium, Copper) are refined in closed-loop hydrometallurgical baths without open-air burning.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-[#F3EFE6] font-medium">
                  <span>Facility Location & Dispatch</span>
                  <span className="text-[#8C9C94]">{auditModalRecycler.locality}</span>
                </div>
                <p className="text-[#8C9C94] text-[11px]">
                  {auditModalRecycler.address} • Dispatch window: {auditModalRecycler.turnaroundTime}
                </p>
              </div>
            </div>

            {/* Direct Contact & Action */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <a
                href={`tel:${auditModalRecycler.contactPhone}`}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-sans text-[#8C9C94] hover:text-[#F3EFE6] flex items-center gap-2 hover:bg-white/5 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-[#EBD3A0]" />
                <span className="font-mono">{auditModalRecycler.contactPhone}</span>
              </a>

              <button
                onClick={() => {
                  handleSchedulePickup(auditModalRecycler);
                  setAuditModalRecycler(null);
                }}
                className="btn-gold px-6 py-2.5 text-xs font-sans font-semibold tracking-tight"
              >
                Select & Schedule Pickup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
