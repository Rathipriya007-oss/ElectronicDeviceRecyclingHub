import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DeviceAssessment } from '../types';
import { GradeBadge } from '../components/GradeBadge';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  Recycle,
  Leaf,
  ShieldCheck,
  TrendingUp,
  Scan,
  Route,
  ArrowRight,
  Download,
  Calendar,
  Layers,
  Cpu,
  Sparkles,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { devices, pickups, impactStats, userAddress } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredDevices = devices.filter((d) => {
    if (filterCategory === 'all') return true;
    return d.category === filterCategory;
  });

  // Calculate user personal metrics strictly from loaded rows
  const paidPickups = pickups.filter((p) => p.status === 'paid');
  const totalUserEarnings = paidPickups.reduce((sum, p) => sum + (p.finalPayout || 0), 0);
  const totalPersonalCo2 = devices.reduce((sum, d) => sum + (d.co2SavedKg || 0), 0);
  const totalPersonalWaste = devices.reduce((sum, d) => sum + (d.toxicWasteDivertedKg || 0), 0);
  const totalCopperGrams = devices.reduce((sum, d) => sum + (d.materials?.copperGrams || 0), 0);
  const totalGoldMg = devices.reduce((sum, d) => sum + (d.materials?.goldMilligrams || 0), 0);

  // Monthly trend chart data for visualization
  const monthlyImpactTrend = [
    { month: 'Jun', co2: Math.min(12.4, totalPersonalCo2 * 0.2), devices: Math.max(0, Math.floor(devices.length * 0.2)), payout: Math.floor(totalUserEarnings * 0.2) },
    { month: 'Jul', co2: Math.min(24.1, totalPersonalCo2 * 0.4), devices: Math.max(0, Math.floor(devices.length * 0.4)), payout: Math.floor(totalUserEarnings * 0.4) },
    { month: 'Aug', co2: Math.min(18.2, totalPersonalCo2 * 0.3), devices: Math.max(0, Math.floor(devices.length * 0.3)), payout: Math.floor(totalUserEarnings * 0.3) },
    { month: 'Sep', co2: Math.min(42.6, totalPersonalCo2 * 0.7), devices: Math.max(0, Math.floor(devices.length * 0.7)), payout: Math.floor(totalUserEarnings * 0.7) },
    { month: 'Oct (Current)', co2: totalPersonalCo2, devices: devices.length, payout: totalUserEarnings }
  ];

  const maxCo2 = Math.max(1, ...monthlyImpactTrend.map((m) => m.co2));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[#EBD3A0] bg-[#C49A55]/10 px-3 py-1 rounded-full border border-[#C49A55]/25 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Circular Ledger</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#F3EFE6] tracking-tight">
            Impact & Devices Dashboard
          </h1>
          <p className="text-[#8C9C94] text-sm mt-1.5 leading-relaxed max-w-2xl">
            Track your environmental footprint abatement, hardware condition diagnostics, and direct UPI settlements.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/scan"
            className="btn-gold flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider"
          >
            <Scan className="w-4 h-4 text-[#1A1409]" />
            <span>Scan New Device</span>
          </Link>

          <Link
            to="/pickup"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium font-mono text-xs bg-[#0E1814] hover:bg-[#13211B] text-[#F3EFE6] border border-white/[0.08] transition-colors"
          >
            <Route className="w-4 h-4 text-[#EBD3A0]" />
            <span>Active Pickups</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.07] relative overflow-hidden bg-[#0E1814] shadow-inner-highlight">
          <div className="flex items-center justify-between text-xs font-mono text-[#8C9C94] mb-2">
            <span>TOTAL UPI EARNINGS</span>
            <DollarSign className="w-4 h-4 text-[#EBD3A0]" />
          </div>
          <div className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#EBD3A0] to-[#C49A55]">
            ₹<AnimatedCounter value={totalUserEarnings} durationMs={1200} />
          </div>
          <p className="text-xs text-[#8C9C94] mt-1.5 font-mono">
            {paidPickups.length} {paidPickups.length === 1 ? 'payout' : 'payouts'} processed
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.07] relative overflow-hidden bg-[#0E1814] shadow-inner-highlight">
          <div className="flex items-center justify-between text-xs font-mono text-[#8C9C94] mb-2">
            <span>CO₂ SAVINGS</span>
            <Leaf className="w-4 h-4 text-[#3FA17C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F3EFE6]">
            <AnimatedCounter value={totalPersonalCo2} decimals={1} durationMs={1400} /> <span className="text-[#3FA17C] text-sm font-mono">kg CO₂</span>
          </div>
          <p className="text-xs text-[#8C9C94] mt-1.5 font-mono">
            ≈ {Math.round(totalPersonalCo2 * 2.8)} days LED lighting
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.07] relative overflow-hidden bg-[#0E1814] shadow-inner-highlight">
          <div className="flex items-center justify-between text-xs font-mono text-[#8C9C94] mb-2">
            <span>TOXIC WASTE DIVERTED</span>
            <ShieldCheck className="w-4 h-4 text-[#4FA3A5]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F3EFE6]">
            <AnimatedCounter value={totalPersonalWaste} decimals={2} durationMs={1400} /> <span className="text-[#4FA3A5] text-sm font-mono">kg</span>
          </div>
          <p className="text-xs text-[#8C9C94] mt-1.5 font-mono">
            Heavy metals kept from soil
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.07] relative overflow-hidden bg-[#0E1814] shadow-inner-highlight">
          <div className="flex items-center justify-between text-xs font-mono text-[#8C9C94] mb-2">
            <span>PRECIOUS METALS</span>
            <Cpu className="w-4 h-4 text-[#EBD3A0]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F3EFE6]">
            <AnimatedCounter value={totalGoldMg} decimals={0} durationMs={1500} /> <span className="text-[#EBD3A0] text-sm font-mono">mg Gold</span>
          </div>
          <p className="text-xs text-[#8C9C94] mt-1.5 font-mono">
            +{totalCopperGrams.toFixed(0)}g Copper refined
          </p>
        </div>

      </div>

      {/* Impact Summary Section with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-white/[0.07] shadow-inner-highlight space-y-4 bg-[#0E1814]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-serif text-[#F3EFE6] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#EBD3A0]" />
                <span>Monthly Environmental Abatement (kg CO₂)</span>
              </h3>
              <p className="text-xs text-[#8C9C94] mt-0.5">
                Calculated based on lifecycle metallurgical recovery and avoided diesel logistics.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#EBD3A0] bg-[#C49A55]/10 px-2.5 py-1 rounded-md border border-[#C49A55]/25">
              <span>+38% vs prev quarter</span>
            </div>
          </div>

          {/* Sleek SVG / CSS Bar Chart */}
          <div className="pt-6 pb-2">
            <div className="h-48 flex items-end justify-between gap-4 px-2 border-b border-white/[0.08]">
              {monthlyImpactTrend.map((item, idx) => {
                const heightPercent = Math.max(15, Math.round((item.co2 / maxCo2) * 100));
                const isCurrent = idx === monthlyImpactTrend.length - 1;

                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#0E1814] border border-[#C49A55]/30 text-[10px] font-mono px-2.5 py-1 rounded-md text-[#F3EFE6] whitespace-nowrap shadow-xl">
                      {item.co2.toFixed(1)} kg CO₂ • ₹{item.payout.toLocaleString()}
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[48px] bg-[#07100D] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-700 ${
                          isCurrent
                            ? 'bg-gradient-to-t from-[#C49A55] to-[#EBD3A0] shadow-[0_0_15px_rgba(196,154,85,0.35)]'
                            : 'bg-gradient-to-t from-[#13211B] to-[#C49A55]/40 group-hover:to-[#EBD3A0]/80'
                        }`}
                      />
                    </div>

                    <span className={`text-[11px] font-mono mt-1 ${isCurrent ? 'text-[#EBD3A0] font-bold' : 'text-[#8C9C94]'}`}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#8C9C94] pt-2">
            <span>Certified R2v3 Metallurgical Emission Factors</span>
            <span className="text-[#EBD3A0]">Total Abated: {totalPersonalCo2.toFixed(1)} kg</span>
          </div>
        </div>

        {/* Material Recovery Breakdown */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-white/[0.07] shadow-inner-highlight space-y-4 bg-[#0E1814]">
          <h3 className="text-base font-serif text-[#F3EFE6] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#EBD3A0]" />
            <span>Material Yield Composition</span>
          </h3>
          <p className="text-xs text-[#8C9C94] leading-relaxed">
            Consolidated yields across all registered devices ready for metallurgical smelter refinement:
          </p>

          <div className="space-y-3.5 font-mono text-xs pt-1">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#F3EFE6]">Copper (Cu 99.9%)</span>
                <span className="text-[#3FA17C] font-bold">{totalCopperGrams.toFixed(1)}g (48%)</span>
              </div>
              <div className="w-full bg-[#07100D] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                <div className="bg-[#3FA17C] h-full rounded-full" style={{ width: '48%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#F3EFE6]">Structural Aluminum</span>
                <span className="text-[#8C9C94] font-bold">{(totalPersonalWaste * 0.4).toFixed(1)}kg (36%)</span>
              </div>
              <div className="w-full bg-[#07100D] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                <div className="bg-[#8C9C94] h-full rounded-full" style={{ width: '36%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#F3EFE6]">Gold Contacts (Au)</span>
                <span className="text-[#EBD3A0] font-bold">{totalGoldMg.toFixed(0)}mg (11%)</span>
              </div>
              <div className="w-full bg-[#07100D] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                <div className="bg-gradient-to-r from-[#EBD3A0] to-[#C49A55] h-full rounded-full" style={{ width: '11%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#F3EFE6]">Rare Earth Elements (Nd)</span>
                <span className="text-[#4FA3A5] font-bold">37.8g (5%)</span>
              </div>
              <div className="w-full bg-[#07100D] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                <div className="bg-[#4FA3A5] h-full rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#8C9C94]">
            <span>Destination: </span>
            <span className="text-[#F3EFE6]">Bhavani & Chithode Industrial Recovery Units</span>
          </div>
        </div>

      </div>

      {/* "My Pickups" Section */}
      <div className="space-y-4 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif text-[#F3EFE6] tracking-tight">
              My Scheduled Pickups ({pickups.length})
            </h2>
            <p className="text-xs text-[#8C9C94] mt-0.5 font-mono">
              Doorstep collection routes, live transit status, and settlement tracking
            </p>
          </div>

          <Link
            to="/pickup"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs bg-[#0E1814] hover:bg-[#13211B] text-[#EBD3A0] border border-[#C49A55]/30 transition-colors w-fit"
          >
            <Route className="w-3.5 h-3.5" />
            <span>Book New Pickup</span>
          </Link>
        </div>

        {pickups.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.07] text-center bg-[#0E1814] space-y-3">
            <Route className="w-8 h-8 text-[#C49A55] mx-auto opacity-70" />
            <h4 className="text-base font-serif text-[#F3EFE6]">No Pickups Scheduled Yet</h4>
            <p className="text-xs text-[#8C9C94] max-w-md mx-auto">
              Schedule a doorstep collection for your evaluated hardware to initiate batch collection with verified recyclers.
            </p>
            <Link
              to="/pickup"
              className="btn-gold inline-flex items-center gap-2 px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider mt-1"
            >
              <Route className="w-3.5 h-3.5 text-[#1A1409]" />
              <span>Book Doorstep Pickup</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pickups.map((pickup) => {
              const statusBadgeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
                scheduled: { label: 'Scheduled', bg: 'bg-[#E0A94F]/10', text: 'text-[#E0A94F]', border: 'border-[#E0A94F]/30' },
                on_the_way: { label: 'On the Way', bg: 'bg-[#38BDF8]/10', text: 'text-[#38BDF8]', border: 'border-[#38BDF8]/30' },
                collected: { label: 'Collected', bg: 'bg-[#3FA17C]/10', text: 'text-[#3FA17C]', border: 'border-[#3FA17C]/30' },
                paid: { label: 'Paid & Settled', bg: 'bg-[#A3E635]/10', text: 'text-[#A3E635]', border: 'border-[#A3E635]/30' }
              };
              const badge = statusBadgeConfig[pickup.status] || statusBadgeConfig.scheduled;

              return (
                <div
                  key={pickup.id}
                  className="glass-panel p-5 rounded-2xl border border-white/[0.07] hover:border-[#C49A55]/30 transition-all space-y-3.5 bg-[#0E1814]"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8C9C94]">#{pickup.trackingNumber}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-serif text-[#F3EFE6] font-medium truncate">
                      {pickup.device?.name || 'Assessed Hardware'}
                    </h4>
                    <p className="text-xs text-[#8C9C94] mt-0.5 truncate">
                      Partner: <span className="text-[#EBD3A0]">{pickup.recycler?.name || 'Certified Recycler'}</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#07100D] border border-white/[0.05] text-[11px] font-mono space-y-1 text-[#8C9C94]">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="text-[#F3EFE6]">{pickup.pickupDate} ({pickup.timeSlot?.split('-')[0]?.trim() || pickup.timeSlot})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payout:</span>
                      <span className="text-[#EBD3A0] font-bold">₹{pickup.finalPayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8C9C94] text-[11px] truncate max-w-[160px]">
                      {pickup.pickupAddress}
                    </span>
                    <Link
                      to="/pickup"
                      className="text-[#EBD3A0] hover:text-[#F3EFE6] font-bold flex items-center gap-1 transition-colors text-xs"
                    >
                      <span>Track Route</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* "My Devices" Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif text-[#F3EFE6] tracking-tight">
              My Registered Devices ({filteredDevices.length})
            </h2>
            <p className="text-xs text-[#8C9C94] mt-0.5 font-mono">
              Diagnostic ratings, issues, and payout lifecycles
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Devices' },
              { id: 'smartphone', label: 'Smartphones' },
              { id: 'laptop', label: 'Laptops' },
              { id: 'pc_component', label: 'PC Components' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                  filterCategory === cat.id
                    ? 'bg-gradient-to-r from-[#EBD3A0] to-[#C49A55] text-[#1A1409] font-bold shadow-gold-sm'
                    : 'bg-[#0E1814] text-[#8C9C94] hover:text-[#F3EFE6] border border-white/[0.06]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Devices Cards Grid or Empty State */}
        {filteredDevices.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl border border-white/[0.07] text-center bg-[#0E1814] space-y-3">
            <Scan className="w-10 h-10 text-[#C49A55] mx-auto opacity-70" />
            <h3 className="text-lg font-serif text-[#F3EFE6]">No Registered Devices Found</h3>
            <p className="text-xs text-[#8C9C94] max-w-md mx-auto">
              {filterCategory === 'all'
                ? 'No e-waste devices recorded yet. Scan a device with our AI diagnostic tool to calculate recovery yields and market value.'
                : `No devices found in the "${filterCategory}" category.`}
            </p>
            <Link
              to="/scan"
              className="btn-gold inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider mt-2"
            >
              <Scan className="w-4 h-4 text-[#1A1409]" />
              <span>Scan Device Now</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDevices.map((device) => {
              const isRecycled = device.status === 'payout_completed';

              return (
                <div
                  key={device.id}
                  className="glass-panel p-5 rounded-2xl border border-white/[0.07] hover:border-[#C49A55]/30 transition-all space-y-4 relative shadow-inner-highlight bg-[#0E1814]"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={device.imageUrl}
                      alt={device.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&auto=format&fit=crop&q=80';
                      }}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <GradeBadge grade={device.grade} size="sm" />
                        <span className="text-[10px] font-mono uppercase text-[#8C9C94]">
                          {device.category}
                        </span>
                      </div>
                      <h3 className="text-base font-serif text-[#F3EFE6] mt-1 truncate">
                        {device.name}
                      </h3>
                      <p className="text-xs text-[#8C9C94] line-clamp-1">{device.gradeDescription}</p>
                    </div>
                  </div>

                  {/* Valuation & Status */}
                  <div className="p-3 rounded-xl bg-[#07100D] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[#8C9C94] text-[10px] block">RECOVERY VALUE</span>
                      <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#EBD3A0] to-[#C49A55]">
                        ₹{device.estimatedValueMin.toLocaleString()} – ₹{device.estimatedValueMax.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[#8C9C94] text-[10px] block">LIFECYCLE STATUS</span>
                      <span className={`px-2 py-0.5 rounded font-bold capitalize ${
                        isRecycled
                          ? 'bg-[#3FA17C]/15 text-[#3FA17C] border border-[#3FA17C]/25'
                          : 'bg-[#E0A94F]/15 text-[#E0A94F] border border-[#E0A94F]/25'
                      }`}>
                        {device.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Issue Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {device.detectedIssues.map((issue) => (
                      <span
                        key={issue.id}
                        className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-[#8C9C94]"
                      >
                        {issue.label}
                      </span>
                    ))}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8C9C94] text-[11px]">
                      Saved: {device.co2SavedKg} kg CO₂
                    </span>
                    
                    {isRecycled ? (
                      <span className="text-[#3FA17C] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>UPI Paid</span>
                      </span>
                    ) : (
                      <Link
                        to="/pickup"
                        className="text-[#EBD3A0] hover:text-[#F3EFE6] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Track Pickup</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
