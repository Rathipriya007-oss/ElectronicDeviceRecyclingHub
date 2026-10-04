import React, { useState, useEffect } from 'react';
import { DeviceAssessment } from '../types';
import { GradeBadge } from './GradeBadge';
import { ShieldCheck, Leaf, ArrowRight, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDeviceImageUrl } from '../services/deviceService';

interface DeviceCardProps {
  device: DeviceAssessment;
  showActions?: boolean;
  onSelect?: () => void;
}

// Placeholder shown while the signed URL is resolving or if the image fails
const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzBFMTgxNCIvPjxwYXRoIGQ9Ik0yMCA0NGwyNC0yNE00NCA0NEwyMCAyMCIgc3Ryb2tlPSIjM0ZBMTdDIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==';

// Simple in-memory cache so we don't re-sign the same path repeatedly
const signedUrlCache = new Map<string, string>();

function useDeviceImage(rawImageUrl: string): string {
  const isStoragePath =
    rawImageUrl &&
    !rawImageUrl.startsWith('blob:') &&
    !rawImageUrl.startsWith('http') &&
    !rawImageUrl.startsWith('data:');

  const [resolvedUrl, setResolvedUrl] = useState<string>(
    isStoragePath ? (signedUrlCache.get(rawImageUrl) ?? PLACEHOLDER) : rawImageUrl
  );

  useEffect(() => {
    if (!isStoragePath) {
      setResolvedUrl(rawImageUrl);
      return;
    }

    // Use cached signed URL if available
    const cached = signedUrlCache.get(rawImageUrl);
    if (cached) {
      setResolvedUrl(cached);
      return;
    }

    let cancelled = false;
    getDeviceImageUrl(rawImageUrl).then((url) => {
      if (cancelled) return;
      if (url) {
        signedUrlCache.set(rawImageUrl, url);
        setResolvedUrl(url);
      }
      // On failure keep the placeholder — no broken image icon
    });

    return () => { cancelled = true; };
  }, [rawImageUrl, isStoragePath]);

  return resolvedUrl;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  showActions = true,
  onSelect
}) => {
  const imageUrl = useDeviceImage(device.imageUrl || '');

  return (
    <div
      onClick={onSelect}
      className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/[0.07] hover:border-[#EBD3A0]/30 transition-all duration-300 relative overflow-hidden group shadow-card"
    >
      {/* Certificate watermark / top header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06] text-xs font-sans text-[#8C9C94]">
        <div className="flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-[#EBD3A0]" />
          <span className="tracking-wide uppercase text-[10px] text-[#EBD3A0] font-medium">ReLoop Valuation Certificate</span>
        </div>
        <span className="font-mono text-[11px] text-[#8C9C94]">ID: {device.id.slice(0, 14)}</span>
      </div>

      {/* Main Device Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/[0.1] bg-[#07100D] shrink-0">
            <img
              src={imageUrl}
              alt={device.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8C9C94] font-sans">
              <span className="uppercase tracking-wider text-[11px] text-[#EBD3A0] font-medium">{device.brand}</span>
              <span>•</span>
              <span className="capitalize">{device.category.replace('_', ' ')}</span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-medium text-[#F3EFE6] group-hover:text-[#EBD3A0] transition-colors mt-0.5">
              {device.name}
            </h3>
            <p className="text-xs text-[#8C9C94] mt-1 line-clamp-1">{device.gradeDescription}</p>
          </div>
        </div>

        <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
          <GradeBadge grade={device.grade} size="md" />
          <div className="text-xs font-mono text-[#8C9C94]">
            Confidence <span className="text-[#F3EFE6] font-semibold">{device.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Gold-Rimmed Valuation Box */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#13211B] to-[#0E1814] border border-[#EBD3A0]/25 shadow-inner mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] tracking-wide uppercase text-[#8C9C94] font-sans block">
            Guaranteed Recovery Payout
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-medium text-gold-gradient tracking-tight mt-0.5">
            ₹{device.estimatedValueMin.toLocaleString('en-IN')} – ₹{device.estimatedValueMax.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-sans text-[#8C9C94]">
          <div className="flex items-center gap-1.5 text-[#3FA17C]">
            <Leaf className="w-3.5 h-3.5" />
            <span className="font-mono">-{device.co2SavedKg}kg CO₂</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#4FA3A5]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-mono">{device.toxicWasteDivertedKg}kg Diverted</span>
          </div>
        </div>
      </div>

      {/* Detected Issues Chips */}
      <div className="mb-5">
        <span className="text-[11px] font-sans uppercase tracking-wider text-[#8C9C94] block mb-2 font-medium">
          Physical Inspection Findings
        </span>
        <div className="flex flex-wrap gap-2">
          {device.detectedIssues.map((issue) => {
            const isPos = issue.severity === 'positive';
            const isHigh = issue.severity === 'high';
            const chipClass = isPos
              ? 'bg-[#3FA17C]/10 text-[#67C7A2] border-[#3FA17C]/25'
              : isHigh
              ? 'bg-[#D9776B]/10 text-[#EAA198] border-[#D9776B]/25'
              : 'bg-white/[0.03] text-[#F3EFE6] border-white/[0.07]';

            return (
              <span
                key={issue.id}
                title={issue.description}
                className={`text-xs px-2.5 py-1 rounded-lg border font-sans flex items-center gap-1.5 ${chipClass}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isPos ? '#3FA17C' : isHigh ? '#D9776B' : '#E0A94F'
                  }}
                />
                <span>{issue.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Metallurgical Yields Strip */}
      <div className="pt-4 border-t border-white/[0.06] grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs font-sans mb-5">
        <div className="p-2.5 rounded-xl bg-surface border border-white/[0.05]">
          <span className="text-[10px] text-[#8C9C94] block uppercase tracking-wider">Copper Yield</span>
          <span className="text-[#3FA17C] font-mono font-semibold text-sm">{device.materials.copperGrams}g</span>
        </div>
        <div className="p-2.5 rounded-xl bg-surface border border-white/[0.05]">
          <span className="text-[10px] text-[#8C9C94] block uppercase tracking-wider">Gold Contact</span>
          <span className="text-[#EBD3A0] font-mono font-semibold text-sm">{device.materials.goldMilligrams}mg</span>
        </div>
        <div className="p-2.5 rounded-xl bg-surface border border-white/[0.05]">
          <span className="text-[10px] text-[#8C9C94] block uppercase tracking-wider">Aluminum</span>
          <span className="text-[#F3EFE6] font-mono font-semibold text-sm">{device.materials.aluminumGrams}g</span>
        </div>
        <div className="hidden sm:block p-2.5 rounded-xl bg-surface border border-white/[0.05]">
          <span className="text-[10px] text-[#8C9C94] block uppercase tracking-wider">Rare Earth</span>
          <span className="text-[#4FA3A5] font-mono font-semibold text-sm">{device.materials.rareEarthGrams}g</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-[#8C9C94] font-sans">
            Status: <span className="text-[#F3EFE6] capitalize">{device.status.replace('_', ' ')}</span>
          </span>
          <Link
            to="/recyclers"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-sans font-medium text-[#EBD3A0] bg-[#EBD3A0]/10 hover:bg-[#EBD3A0]/20 border border-[#EBD3A0]/30 transition-all hover:gap-2"
          >
            <span>Compare Recyclers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
