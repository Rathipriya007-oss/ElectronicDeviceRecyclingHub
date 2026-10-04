import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { buildOptimizedPickupRoute } from '../services/routeOptimizer';
import { getOptimizedRoute, ExtendedRouteResult } from '../services/routingService';
import { PickupStatus } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Route,
  CheckCircle2,
  Truck,
  DollarSign,
  ShieldCheck,
  Download,
  Sparkles,
  ArrowRight,
  Zap,
  Building,
  Navigation,
  FileCheck,
  QrCode,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PickupPlannerPage: React.FC = () => {
  const {
    devices,
    currentDevice,
    setCurrentDevice,
    recyclers,
    selectedRecycler,
    setSelectedRecycler,
    userAddress,
    setUserAddress,
    pickups,
    currentPickup,
    schedulePickup,
    updatePickupStatus,
    addToast
  } = useApp();

  // Latest active pickup for tracking
  const activeOrder = currentPickup || (pickups.length > 0 ? pickups[0] : null);

  // Filter verified recyclers for scheduling dropdown
  const verifiedRecyclers = useMemo(() => recyclers.filter((r) => r.verified), [recyclers]);

  // Selected device & recycler for scheduling - initialize from activeOrder if present
  const [activeDeviceId, setActiveDeviceId] = useState(
    activeOrder?.deviceId || activeOrder?.device?.id || currentDevice?.id || (devices.length > 0 ? devices[0].id : '')
  );
  const [activeRecyclerId, setActiveRecyclerId] = useState(
    activeOrder?.recyclerId || activeOrder?.recycler?.id || selectedRecycler?.id || (verifiedRecyclers.length > 0 ? verifiedRecyclers[0].id : (recyclers[0]?.id ?? ''))
  );

  // Keep state synchronized whenever context / activeOrder updates
  useEffect(() => {
    if (activeOrder?.recyclerId || activeOrder?.recycler?.id) {
      const rId = activeOrder.recyclerId || activeOrder.recycler.id;
      setActiveRecyclerId(rId);
      const rec = recyclers.find((r) => r.id === rId);
      if (rec) setSelectedRecycler(rec);
    }
  }, [activeOrder?.id, activeOrder?.recyclerId]);

  useEffect(() => {
    if (currentDevice?.id) {
      setActiveDeviceId(currentDevice.id);
    }
  }, [currentDevice]);

  useEffect(() => {
    if (selectedRecycler?.id) {
      setActiveRecyclerId(selectedRecycler.id);
    }
  }, [selectedRecycler]);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];
  const activeRecycler = recyclers.find((r) => r.id === activeRecyclerId) || recyclers[0];

  // ── Dynamic date options (never hardcoded) ────────────────────────────────
  // Each option has a human label for display and an ISO date for the DB.
  const dateOptions = useMemo(() => {
    const toIso = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Next pickup day: skip Sunday (0) and Saturday (6) after tomorrow
    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 1);
    while (afterTomorrow.getDay() === 0 || afterTomorrow.getDay() === 6) {
      afterTomorrow.setDate(afterTomorrow.getDate() + 1);
    }

    return [
      { displayLabel: `Today Express · ${fmt(today)}`,   isoDate: toIso(today) },
      { displayLabel: `Tomorrow · ${fmt(tomorrow)}`,     isoDate: toIso(tomorrow) },
      { displayLabel: fmt(afterTomorrow),                 isoDate: toIso(afterTomorrow) },
    ];
  }, []);

  // Store the ISO date so Supabase receives YYYY-MM-DD; display the label separately
  const [selectedDate, setSelectedDate] = useState(dateOptions[1].isoDate);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM - 01:00 PM');
  const [customAddress, setCustomAddress] = useState(userAddress.address);

  // Initialize routeData with saved route if activeOrder already exists, or fallback
  const [routeData, setRouteData] = useState<ExtendedRouteResult>(() => {
    if (
      activeOrder &&
      activeOrder.routeStops &&
      activeOrder.routeStops.length > 0 &&
      activeOrder.routeGeometry &&
      activeOrder.routeGeometry.length > 1
    ) {
      return {
        orderedStops: activeOrder.routeStops,
        totalDistanceKm: activeOrder.totalDistanceKm || 0,
        totalDurationMinutes:
          activeOrder.routeStops[activeOrder.routeStops.length - 1]?.etaMinutes || 25,
        co2BatchSavingsKg:
          activeOrder.batchCarbonSavingKg ||
          Number(((activeOrder.totalDistanceKm || 0) * 0.28 * 1.8).toFixed(1)),
        polylinePoints: activeOrder.routeGeometry,
        isEstimated: false,
        source: 'cached',
      };
    }
    const fallback = buildOptimizedPickupRoute(
      userAddress.coordinates,
      customAddress,
      activeRecycler
    );
    return {
      ...fallback,
      isEstimated: true,
      source: 'fallback-estimated',
    };
  });

  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Fetch real OSRM road route whenever user location, customAddress or activeRecycler changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingRoute(true);

    getOptimizedRoute(userAddress.coordinates, customAddress, activeRecycler)
      .then((res) => {
        if (!isCancelled) {
          setRouteData(res);
          setIsLoadingRoute(false);
        }
      })
      .catch((err) => {
        console.warn('[PickupPlannerPage] routing fallback:', err);
        if (!isCancelled) {
          const fallback = buildOptimizedPickupRoute(
            userAddress.coordinates,
            customAddress,
            activeRecycler
          );
          setRouteData({
            ...fallback,
            isEstimated: true,
            source: 'fallback-estimated',
          });
          setIsLoadingRoute(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userAddress.coordinates, customAddress, activeRecycler]);

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDevice || !activeRecycler) return;

    if (!activeRecycler.verified) {
      addToast({
        type: 'warning',
        title: 'Unverified Recycler',
        description: 'Only verified recyclers can schedule pickups. Please select a verified facility.',
      });
      return;
    }

    schedulePickup({
      deviceId: activeDevice.id,
      recyclerId: activeRecycler.id,
      pickupDate: selectedDate,
      timeSlot: selectedSlot,
      pickupAddress: customAddress,
      routeData: routeData,
    });
  };

  const statusSteps: { key: PickupStatus; label: string; desc: string; icon: any }[] = [
    { key: 'scheduled', label: 'Scheduled', desc: 'Pickup confirmed & dispatched to route queue', icon: Calendar },
    { key: 'on_the_way', label: 'On the Way', desc: 'Agent en route via optimized Erode loop', icon: Truck },
    { key: 'collected', label: 'Collected', desc: 'Hardware weighed, verified & sealed', icon: CheckCircle2 },
    { key: 'paid', label: 'Paid', desc: 'Instant UPI credit & Form 6 issued', icon: DollarSign }
  ];

  const currentStatusIndex = activeOrder
    ? statusSteps.findIndex((s) => s.key === activeOrder.status)
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[#EBD3A0] bg-[#C49A55]/10 px-3 py-1 rounded-full border border-[#C49A55]/25 mb-2.5">
            <Route className="w-3.5 h-3.5" />
            <span>Smart Nearest-Neighbor Logistics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#F3EFE6] tracking-tight">
            Doorstep Pickup & Multi-Stop Route Planner
          </h1>
          <p className="text-[#8C9C94] text-sm mt-1.5 leading-relaxed max-w-2xl">
            Intelligent batching connects your doorstep with intermediate consolidation depots and certified Erode refineries with zero-emission routing.
          </p>
        </div>

        {activeOrder && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#0E1814] border border-white/[0.07] text-xs font-mono flex items-center gap-3">
              <span className="text-[#8C9C94]">Tracking Ref:</span>
              <span className="text-[#EBD3A0] font-bold">{activeOrder.trackingNumber}</span>
            </div>
            <Link
              to="/dashboard"
              className="px-3.5 py-2 rounded-xl bg-[#0E1814] hover:bg-[#13211B] border border-white/[0.08] text-xs font-mono text-[#F3EFE6] transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#EBD3A0]" />
              <span>View in Dashboard</span>
            </Link>
          </div>
        )}
      </div>

      {/* Interactive Status Stepper Bar */}
      {activeOrder && (
        <div className="glass-panel p-6 rounded-2xl border border-[#C49A55]/20 mb-8 bg-[#0E1814]/90 shadow-inner-highlight">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono uppercase text-[#EBD3A0] font-semibold tracking-wider">
                Live Status Tracker
              </span>
              <h3 className="text-lg font-serif text-[#F3EFE6] mt-0.5">
                Batch Route #{activeOrder.trackingNumber}
              </h3>
              <p className="text-xs text-[#8C9C94] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Assigned Recycler:</span>
                <span className="text-[#F3EFE6] font-semibold">{activeRecycler?.name || activeOrder?.recycler?.name}</span>
                {activeRecycler && !activeRecycler.verified && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D9776B]/20 text-[#EAA198] border border-[#D9776B]/30 font-semibold font-sans">
                    Unverified
                  </span>
                )}
              </p>
            </div>

            {/* Simulation controls to test steps */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const nextMap: Record<PickupStatus, PickupStatus> = {
                    scheduled: 'on_the_way',
                    on_the_way: 'collected',
                    collected: 'paid',
                    paid: 'scheduled',
                  };
                  const nextStatus = nextMap[activeOrder.status] || 'scheduled';
                  updatePickupStatus(activeOrder.id, nextStatus);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-[#EBD3A0] to-[#C49A55] text-[#1A1409] hover:brightness-110 shadow-gold-sm transition-all cursor-pointer"
                title="Advance pickup status in Supabase (demo)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate next status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs font-mono text-[#8C9C94] ml-1">or jump to:</span>
              {statusSteps.map((step) => (
                <button
                  key={step.key}
                  onClick={() => updatePickupStatus(activeOrder.id, step.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    activeOrder.status === step.key
                      ? 'bg-white/[0.12] text-[#EBD3A0] font-bold border border-[#C49A55]/40 shadow-sm'
                      : 'bg-white/[0.04] text-[#8C9C94] hover:text-[#F3EFE6] border border-white/[0.06]'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Visual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {statusSteps.map((step, idx) => {
              const isPast = idx < currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#C49A55]/10 border-[#C49A55]/50 shadow-[0_0_20px_rgba(196,154,85,0.15)]'
                      : isPast
                      ? 'bg-[#3FA17C]/10 border-[#3FA17C]/30 text-[#F3EFE6]'
                      : 'bg-[#0E1814]/60 border-white/[0.05] text-[#8C9C94]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                        isCurrent
                          ? 'bg-gradient-to-br from-[#EBD3A0] to-[#C49A55] text-[#1A1409]'
                          : isPast
                          ? 'bg-[#3FA17C]/20 text-[#3FA17C]'
                          : 'bg-white/[0.05] text-[#8C9C94]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold font-mono ${isCurrent ? 'text-[#EBD3A0]' : isPast ? 'text-[#3FA17C]' : 'text-[#8C9C94]'}`}>
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C9C94] leading-tight">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Scheduler Form (Left) vs Map & Stops (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Manifest */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Scheduling Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.07] shadow-inner-highlight">
            <h3 className="text-base font-serif text-[#F3EFE6] mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#EBD3A0]" />
              <span>Configure Pickup Slot</span>
            </h3>

            <form onSubmit={handleConfirmSchedule} className="space-y-4 text-xs font-mono">
              
              {/* Select Device */}
              <div>
                <label className="text-[#8C9C94] block mb-1.5 uppercase tracking-wider text-[11px]">
                  Device to Recycle:
                </label>
                <select
                  value={activeDeviceId}
                  onChange={(e) => {
                    setActiveDeviceId(e.target.value);
                    const dev = devices.find((d) => d.id === e.target.value);
                    if (dev) setCurrentDevice(dev);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] focus:border-[#C49A55] focus:ring-1 focus:ring-[#C49A55] outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0E1814] text-[#F3EFE6]">
                      {d.name} ({d.grade ? `Grade ${d.grade}` : 'Scanned'} • Est. ₹{d.estimatedValueMax.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Recycler */}
              <div>
                <label className="text-[#8C9C94] block mb-1.5 uppercase tracking-wider text-[11px]">
                  Assigned Recycler Facility:
                </label>
                <select
                  value={activeRecyclerId}
                  onChange={(e) => {
                    setActiveRecyclerId(e.target.value);
                    const rec = recyclers.find((r) => r.id === e.target.value);
                    if (rec) setSelectedRecycler(rec);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] focus:border-[#C49A55] focus:ring-1 focus:ring-[#C49A55] outline-none"
                >
                  {verifiedRecyclers.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0E1814] text-[#F3EFE6]">
                      {r.name} ({r.locality} • {r.distanceKm} km • ★ {r.rating})
                    </option>
                  ))}
                  {activeRecycler && !activeRecycler.verified && (
                    <option key={activeRecycler.id} value={activeRecycler.id} disabled className="bg-[#0E1814] text-[#8C9C94]">
                      {activeRecycler.name} (Unverified Facility)
                    </option>
                  )}
                </select>
              </div>

              {/* Pickup Address */}
              <div>
                <label className="text-[#8C9C94] block mb-1.5 uppercase tracking-wider text-[11px]">
                  Pickup Address (Erode):
                </label>
                <textarea
                  rows={2}
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] focus:border-[#C49A55] focus:ring-1 focus:ring-[#C49A55] outline-none text-xs"
                />
              </div>

              {/* Date Options */}
              <div>
                <label className="text-[#8C9C94] block mb-1.5 uppercase tracking-wider text-[11px]">
                  Select Date:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {dateOptions.map(({ displayLabel, isoDate }) => (
                    <button
                      type="button"
                      key={isoDate}
                      onClick={() => setSelectedDate(isoDate)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedDate === isoDate
                          ? 'border-[#C49A55] bg-[#C49A55]/15 text-[#EBD3A0] font-bold shadow-gold-sm'
                          : 'border-white/10 bg-[#07100D]/60 text-[#8C9C94] hover:text-[#F3EFE6]'
                      }`}
                    >
                      {displayLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Options */}
              <div>
                <label className="text-[#8C9C94] block mb-1.5 uppercase tracking-wider text-[11px]">
                  Time Slot:
                </label>
                <div className="space-y-1.5">
                  {[
                    '09:00 AM – 12:00 PM (Morning)',
                    '01:00 PM – 04:00 PM (Afternoon)',
                    '05:00 PM – 08:00 PM (Evening)'
                  ].map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedSlot === slot
                          ? 'border-[#C49A55] bg-[#C49A55]/15 text-[#EBD3A0] font-bold shadow-gold-sm'
                          : 'border-white/10 bg-[#07100D]/60 text-[#8C9C94] hover:text-[#F3EFE6]'
                      }`}
                    >
                      <span>{slot}</span>
                      <Clock className="w-3.5 h-3.5 text-[#EBD3A0]" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Payout Summary */}
              <div className="p-3.5 rounded-xl bg-[#07100D] border border-[#C49A55]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8C9C94] block">Instant Doorstep UPI Payout</span>
                  <span className="text-xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#EBD3A0] to-[#C49A55]">
                    ₹{Math.round((activeDevice?.estimatedValueMax || 5000) * (activeRecycler?.baseOfferMultiplier || 1.1)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right text-[10px] text-[#3FA17C] font-mono">
                  <span>Zero Deduction</span>
                  <span className="block text-[#8C9C94]">Doorstep Verification</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-gold w-full py-3.5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-[#1A1409]" />
                <span>Confirm Smart Pickup Route</span>
              </button>
            </form>
          </div>

          {/* Form 6 Digital Manifest Receipt Preview */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.07] shadow-inner-highlight space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#F3EFE6] font-serif text-sm">
                <FileCheck className="w-4 h-4 text-[#EBD3A0]" />
                <span>CPCB Form 6 Green Manifest</span>
              </div>
              <span className="text-[10px] text-[#8C9C94]">Legal E-Waste Receipt</span>
            </div>

            <div className="p-3 rounded-xl bg-[#07100D] border border-white/[0.06] space-y-2 text-[11px] text-[#F3EFE6]">
              <div className="flex justify-between">
                <span className="text-[#8C9C94]">Manifest ID:</span>
                <span className="text-[#EBD3A0] font-bold">{activeOrder?.certificateId || 'CPCB-TN-DISP-09418'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C9C94]">Carrier Node:</span>
                <span className="flex items-center gap-1.5">
                  <span>{activeRecycler?.name}</span>
                  {activeRecycler && !activeRecycler.verified && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D9776B]/20 text-[#EAA198] border border-[#D9776B]/30 font-semibold font-sans">
                      Unverified
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C9C94]">CO₂ Abatement Credit:</span>
                <span className="text-[#3FA17C] font-bold">+{routeData.co2BatchSavingsKg} kg saved</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C9C94]">Data Sanitization:</span>
                <span className="text-[#4FA3A5]">DoD 5220.22-M Validated</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(`Downloaded Green Disposal Certificate ${activeOrder?.certificateId || 'CPCB-TN-DISP-09418'} (PDF with cryptographic SHA-256 seal)`)}
              className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#F3EFE6] border border-white/[0.08] hover:border-[#C49A55]/30 transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#EBD3A0]" />
              <span>Download Digital Certificate (PDF)</span>
            </button>
          </div>

        </div>

        {/* Right Column: Multi-Stop Route Map & Route Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Map with Polyline and Stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#8C9C94] px-1">
              <span className="flex items-center gap-1.5 flex-wrap">
                <Navigation className="w-3.5 h-3.5 text-[#EBD3A0]" />
                <span>{routeData.isEstimated ? 'Estimated route' : 'Road route (OpenStreetMap)'}</span>
              </span>
              {isLoadingRoute ? (
                <span className="w-32 h-4 rounded bg-white/10 animate-pulse inline-block" />
              ) : (
                <span className="text-[#EBD3A0] font-bold">
                  {routeData.totalDistanceKm} km total • ~{routeData.totalDurationMinutes} mins
                </span>
              )}
            </div>

            <LeafletMap
              routeStops={routeData.orderedStops}
              polylinePoints={routeData.polylinePoints}
              isEstimated={routeData.isEstimated}
              userCoordinates={userAddress.coordinates}
              height="440px"
            />
          </div>

          {/* Route Optimization Badge & Metrics */}
          <div className="p-4 rounded-2xl bg-[#0E1814] border border-[#C49A55]/20 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-inner-highlight">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C49A55]/10 border border-[#C49A55]/30 flex items-center justify-center text-[#EBD3A0]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[#F3EFE6] font-bold block">Smart Consolidation Batching Active</span>
                <span className="text-[#8C9C94] text-[11px]">
                  Batching intermediate nodes saves 42% road transit emissions.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[#8C9C94] text-[10px] block uppercase">Batch Savings</span>
                <span className="text-[#3FA17C] font-bold">-{routeData.co2BatchSavingsKg} kg CO₂</span>
              </div>
            </div>
          </div>

          {/* Numbered Stops Timeline Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.07] shadow-inner-highlight space-y-4">
            <h3 className="text-sm font-serif text-[#F3EFE6] uppercase tracking-wider flex items-center gap-2">
              <Route className="w-4 h-4 text-[#EBD3A0]" />
              <span>Multi-Stop Waypoints Timeline</span>
            </h3>

            <div className="space-y-4 relative">
              {/* Connecting line */}
              <div className="absolute top-4 bottom-4 left-4 w-[2px] bg-gradient-to-b from-[#EBD3A0]/60 via-[#C49A55]/40 to-[#3FA17C]/60 -z-0" />

              {isLoadingRoute ? (
                [1, 2, 3].map((num) => (
                  <div key={num} className="flex items-start gap-4 relative z-10 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-mono font-extrabold text-xs shrink-0 text-[#8C9C94]">
                      {num}
                    </div>
                    <div className="flex-1 p-3.5 rounded-xl bg-[#07100D] border border-white/[0.06] space-y-2">
                      <div className="h-4 bg-white/10 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-2/3" />
                    </div>
                  </div>
                ))
              ) : (
                routeData.orderedStops.map((stop) => {
                  const isUser = stop.type === 'pickup_user';
                  const isDest = stop.type === 'central_hub';

                  return (
                    <div key={stop.id} className="flex items-start gap-4 relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-extrabold text-xs shrink-0 shadow-gold-sm ${
                          isUser
                            ? 'bg-[#EBD3A0] text-[#1A1409]'
                            : isDest
                            ? 'bg-[#3FA17C] text-[#1A1409]'
                            : 'bg-[#C49A55] text-[#1A1409]'
                        }`}
                      >
                        {stop.stopNumber}
                      </div>

                      <div className="flex-1 p-3.5 rounded-xl bg-[#07100D] border border-white/[0.06]">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-[#F3EFE6]">{stop.name}</span>
                          <span className={isUser ? 'text-[#3FA17C]' : 'text-[#EBD3A0]'}>
                            {stop.etaMinutes === 0 ? 'Origin (Pickup)' : `ETA: +${stop.etaMinutes}m`}
                          </span>
                        </div>
                        <p className="text-xs text-[#8C9C94] mt-0.5">{stop.address}</p>
                        {stop.distanceFromPreviousKm > 0 && (
                          <div className="mt-2 text-[10px] font-mono text-[#8C9C94]/80">
                            Leg distance: {stop.distanceFromPreviousKm} km
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
