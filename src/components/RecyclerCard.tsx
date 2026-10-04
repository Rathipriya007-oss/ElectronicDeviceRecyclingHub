import React from 'react';
import { Recycler, DeviceAssessment } from '../types';
import { ShieldCheck, Star, MapPin, Clock, ArrowRight, Lock } from 'lucide-react';

interface RecyclerCardProps {
  recycler: Recycler;
  currentDevice?: DeviceAssessment | null;
  isSelected?: boolean;
  onSelect: () => void;
  onSchedulePickup: (recycler: Recycler) => void;
  onViewDetails?: (recycler: Recycler) => void;
}

export const RecyclerCard: React.FC<RecyclerCardProps> = ({
  recycler,
  currentDevice,
  isSelected = false,
  onSelect,
  onSchedulePickup,
  onViewDetails
}) => {
  // Calculate dynamic payout offer if a device is currently assessed
  const baseDeviceValue = currentDevice ? currentDevice.estimatedValueMax : 4800;
  const calculatedPayout = Math.round(baseDeviceValue * recycler.baseOfferMultiplier);
  const bonusPercent = Math.round((recycler.baseOfferMultiplier - 1) * 100);

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-card ${
        isSelected
          ? 'border-[#EBD3A0]/60 bg-[#13211B] shadow-gold-sm'
          : 'border-white/[0.07] bg-surface hover:border-[#EBD3A0]/30 hover:bg-[#13211B]/60'
      }`}
    >
      {/* Active Selection Ribbon */}
      {isSelected && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-[#EBD3A0] to-[#C49A55] text-[#1A1409] font-sans font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
          Active Facility
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Recycler Photo */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/[0.1] bg-[#07100D] shrink-0">
          <img
            src={recycler.avatarUrl}
            alt={recycler.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {recycler.verified && (
            <div className="absolute bottom-0 right-0 p-1 bg-[#3FA17C] text-white rounded-tl-md" title="CPCB Verified Facility">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-12">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base sm:text-lg font-medium text-[#F3EFE6] group-hover:text-[#EBD3A0] transition-colors truncate">
              {recycler.name}
            </h3>
            {recycler.r2Certified && (
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#3FA17C]/10 text-[#67C7A2] border border-[#3FA17C]/25">
                R2v3 Certified
              </span>
            )}
          </div>

          <p className="text-xs text-[#8C9C94] mt-0.5 truncate">{recycler.tagline}</p>

          {/* Ratings & Distance */}
          <div className="flex items-center gap-3 mt-2.5 text-xs text-[#8C9C94] font-sans flex-wrap">
            <span className="flex items-center gap-1 text-[#EBD3A0] font-medium bg-[#EBD3A0]/10 px-2 py-0.5 rounded border border-[#EBD3A0]/20">
              <Star className="w-3 h-3 fill-[#EBD3A0]" />
              <span className="font-mono">{recycler.rating}</span>
              <span className="text-[#8C9C94] text-[10px]">({recycler.reviewCount})</span>
            </span>

            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#EBD3A0]" />
              <span>{recycler.locality}</span>
              <span className="text-[#F3EFE6] font-mono text-[11px]">({recycler.distanceKm} km)</span>
            </span>

            <span className="hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#4FA3A5]" />
              <span>{recycler.turnaroundTime}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Offer Calculation Bar */}
      <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-sans uppercase tracking-wider text-[#8C9C94] block">
            {currentDevice ? `Offer for ${currentDevice.name}` : 'Estimated Payout'}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-xl sm:text-2xl font-medium text-[#F3EFE6]">
              ₹{calculatedPayout.toLocaleString('en-IN')}
            </span>
            {bonusPercent > 0 && (
              <span className="text-xs font-sans font-medium text-[#67C7A2] bg-[#3FA17C]/10 px-2 py-0.5 rounded border border-[#3FA17C]/20">
                +{bonusPercent}% Premium
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(recycler);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-sans text-[#8C9C94] hover:text-[#F3EFE6] hover:bg-white/[0.05] transition-colors border border-white/[0.07]"
            >
              Audits
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSchedulePickup(recycler);
            }}
            className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-semibold tracking-tight"
          >
            <span>Schedule Pickup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trust Micro-tags */}
      <div className="mt-3 flex items-center gap-3 text-[11px] font-sans text-[#8C9C94]">
        <span className="flex items-center gap-1 text-[#8C9C94]">
          <Lock className="w-3 h-3 text-[#4FA3A5]" />
          <span>DoD Data Destruction</span>
        </span>
        <span>•</span>
        <span className="truncate font-mono text-[10px]">Lic: {recycler.cpcbRegNumber}</span>
      </div>
    </div>
  );
};
