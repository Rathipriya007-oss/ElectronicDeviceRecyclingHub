import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Recycler, PickupStop } from '../types';
import { ERODE_CENTER } from '../services/recyclersData';

interface LeafletMapProps {
  recyclers?: Recycler[];
  selectedRecyclerId?: string;
  onSelectRecycler?: (recycler: Recycler) => void;
  userCoordinates?: [number, number];
  routeStops?: PickupStop[];
  polylinePoints?: [number, number][];
  zoom?: number;
  center?: [number, number];
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  recyclers = [],
  selectedRecyclerId,
  onSelectRecycler,
  userCoordinates,
  routeStops,
  polylinePoints,
  zoom = 12,
  center = ERODE_CENTER,
  height = '500px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const bgGlowLayerRef = useRef<L.Polyline | null>(null);
  // Track the invalidateSize timer so we can cancel it on unmount
  const invalidateSizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Map initialisation (once per mount) ────────────────────────────────────
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Leaflet tags the container element with `_leaflet_id` after `L.map()`.
    // In React StrictMode the effect fires twice (mount → unmount → remount).
    // Our cleanup below calls `map.remove()` which deletes `_leaflet_id`, so
    // the second mount always starts clean. This guard handles any other edge
    // cases where the container already hosts a live Leaflet instance.
    if ((container as any)._leaflet_id) return;

    let map: L.Map;
    try {
      map = L.map(container, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: true,
      });
    } catch (e) {
      console.warn('[LeafletMap] Failed to initialise map:', e);
      return;
    }

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Delay invalidateSize so flex/grid containers have finished sizing.
    // Capture the map reference so the callback won't touch a different instance.
    const capturedMap = map;
    invalidateSizeTimerRef.current = setTimeout(() => {
      // Only act if this is still the active map instance
      if (mapInstanceRef.current === capturedMap) {
        try { capturedMap.invalidateSize(); } catch { /* ignore */ }
      }
    }, 250);

    const handleResize = () => {
      if (mapInstanceRef.current === capturedMap) {
        try { capturedMap.invalidateSize(); } catch { /* ignore */ }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      // Cancel the pending invalidateSize before removing the map
      if (invalidateSizeTimerRef.current !== null) {
        clearTimeout(invalidateSizeTimerRef.current);
        invalidateSizeTimerRef.current = null;
      }
      window.removeEventListener('resize', handleResize);

      // Clear all refs before calling map.remove() so the marker-update
      // effect's guard (`if (!map || !markersGroup) return`) fires correctly
      // during the StrictMode unmount/remount cycle.
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
      bgGlowLayerRef.current = null;

      try { capturedMap.remove(); } catch { /* ignore */ }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Marker / route updates whenever props change ──────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;

    // Guard: no map yet, or map has been torn down
    if (!map || !markersGroup) return;

    // Extra safety: make sure the container is still attached to the DOM
    // (guards against StrictMode timing edge cases)
    try {
      const container = map.getContainer();
      if (!container || !container.isConnected) return;
    } catch {
      return;
    }

    // Helper to run a map operation safely
    const safely = (fn: () => void) => {
      try { fn(); } catch (e) {
        console.warn('[LeafletMap] Suppressed map operation error:', e);
      }
    };

    safely(() => markersGroup.clearLayers());

    if (routeLayerRef.current) {
      safely(() => { routeLayerRef.current!.remove(); routeLayerRef.current = null; });
    }
    if (bgGlowLayerRef.current) {
      safely(() => { bgGlowLayerRef.current!.remove(); bgGlowLayerRef.current = null; });
    }

    const bounds: L.LatLngExpression[] = [];

    // 1. User pickup marker
    if (userCoordinates) {
      bounds.push(userCoordinates);
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-[#EBD3A0]/25 rounded-full animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#EBD3A0] to-[#C49A55] border border-white/40 flex items-center justify-center shadow-[0_0_15px_rgba(235,211,160,0.5)] text-[#1A1409] font-bold text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
        </div>
      `;
      const userIcon = L.divIcon({ html: userHtml, className: 'user-marker-icon', iconSize: [32, 32], iconAnchor: [16, 16] });
      const userMarker = L.marker(userCoordinates, { icon: userIcon });
      userMarker.bindPopup(`
        <div class="p-2.5 font-sans">
          <div class="text-[10px] font-mono uppercase tracking-widest text-[#EBD3A0] font-semibold">Pickup Origin</div>
          <div class="text-sm font-semibold text-[#F3EFE6] mt-1">Your Pickup Address</div>
          <div class="text-xs text-[#8C9C94] mt-0.5">Perundurai Road, Erode, Tamil Nadu</div>
        </div>
      `);
      safely(() => markersGroup.addLayer(userMarker));
    }

    // 2. Route stops
    if (routeStops && routeStops.length > 0) {
      routeStops.forEach((stop) => {
        bounds.push(stop.coordinates);
        const isUserStop = stop.type === 'pickup_user';
        const isFinalHub = stop.type === 'central_hub';
        const stopBorder = isUserStop
          ? 'from-[#EBD3A0] to-[#C49A55]'
          : isFinalHub
          ? 'from-[#3FA17C] to-[#2E8061]'
          : 'from-[#E0A94F] to-[#B37A24]';

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr ${stopBorder} p-[1.5px] shadow-[0_0_15px_rgba(235,211,160,0.3)]">
              <div class="w-full h-full bg-[#07100D] rounded-full flex items-center justify-center text-xs font-bold text-[#F3EFE6] font-mono">
                ${stop.stopNumber}
              </div>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-[#0E1814]/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-[#EBD3A0] border border-white/[0.08]">
              Stop ${stop.stopNumber} (${stop.etaMinutes}m)
            </div>
          </div>
        `;
        const stopIcon = L.divIcon({ html: iconHtml, className: 'route-stop-icon', iconSize: [32, 32], iconAnchor: [16, 16] });
        const stopMarker = L.marker(stop.coordinates, { icon: stopIcon });
        stopMarker.bindPopup(`
          <div class="p-2.5 font-sans">
            <div class="flex items-center gap-1.5 text-xs text-[#EBD3A0] font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-[#EBD3A0]"></span>
              <span>STOP ${stop.stopNumber} • ETA: +${stop.etaMinutes} MIN</span>
            </div>
            <div class="text-sm font-semibold text-[#F3EFE6] mt-1">${stop.name}</div>
            <div class="text-xs text-[#8C9C94] mt-0.5">${stop.address}</div>
            <div class="text-xs text-[#8C9C94] mt-1.5 font-mono">Leg distance: ${stop.distanceFromPreviousKm} km</div>
          </div>
        `);
        safely(() => markersGroup.addLayer(stopMarker));
      });
    }

    // 3. Polyline route
    if (polylinePoints && polylinePoints.length > 1) {
      safely(() => {
        const bgGlow = L.polyline(polylinePoints, { color: '#C49A55', weight: 6, opacity: 0.35, lineCap: 'round', lineJoin: 'round' });
        bgGlow.addTo(map);
        bgGlowLayerRef.current = bgGlow;

        const goldPolyline = L.polyline(polylinePoints, { color: '#EBD3A0', weight: 3.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' });
        goldPolyline.addTo(map);
        routeLayerRef.current = goldPolyline;
      });
    }

    // 4. Recycler markers (directory view)
    if (!routeStops || routeStops.length === 0) {
      recyclers.forEach((recycler) => {
        bounds.push(recycler.coordinates);
        const isSelected = recycler.id === selectedRecyclerId;

        const pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-300 ${isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-10'}">
            <div class="relative px-2.5 py-1 rounded-full ${
              isSelected
                ? 'bg-gradient-to-r from-[#EBD3A0] to-[#C49A55] text-[#1A1409] font-bold shadow-gold-md'
                : 'bg-[#0E1814] text-[#EBD3A0] border border-[#EBD3A0]/30 shadow-md hover:border-[#EBD3A0]/60'
            } flex items-center gap-1.5 text-xs font-sans">
              <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#1A1409]' : 'bg-[#3FA17C]'}"></span>
              <span class="tracking-tight">${recycler.locality}</span>
            </div>
          </div>
        `;
        const recyclerIcon = L.divIcon({ html: pinHtml, className: 'recycler-custom-icon', iconSize: [90, 28], iconAnchor: [45, 14] });
        const marker = L.marker(recycler.coordinates, { icon: recyclerIcon });

        marker.on('click', () => { if (onSelectRecycler) onSelectRecycler(recycler); });
        marker.bindPopup(`
          <div class="p-2.5 font-sans min-w-[210px]">
            <div class="flex items-center justify-between text-xs text-[#EBD3A0] font-mono">
              <span class="flex items-center gap-1">★ ${recycler.rating}</span>
              <span>${recycler.distanceKm} km away</span>
            </div>
            <div class="text-sm font-semibold text-[#F3EFE6] mt-1.5 leading-snug">${recycler.name}</div>
            <div class="text-xs text-[#8C9C94] mt-1">${recycler.address}</div>
            <div class="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs font-sans">
              <span class="text-[#8C9C94]">Payout Premium:</span>
              <span class="text-[#EBD3A0] font-semibold">+${Math.round((recycler.baseOfferMultiplier - 1) * 100)}%</span>
            </div>
          </div>
        `);
        safely(() => markersGroup.addLayer(marker));
      });
    }

    // Auto-fit bounds
    if (bounds.length > 1 && (routeStops?.length || selectedRecyclerId)) {
      safely(() => map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 }));
    }
  }, [recyclers, selectedRecyclerId, userCoordinates, routeStops, polylinePoints]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.07] shadow-card" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Best Route Badge Overlay */}
      {routeStops && routeStops.length > 0 && (
        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0E1814]/95 backdrop-blur-md border border-[#EBD3A0]/40 text-xs font-sans text-[#F3EFE6] shadow-gold-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EBD3A0]" />
            <span className="font-semibold text-gold-gradient tracking-wide">★ Best Route</span>
            <span className="text-white/20">•</span>
            <span className="text-[#8C9C94] text-[11px]">Nearest-Neighbor Batch (-42% CO₂)</span>
          </div>
        </div>
      )}

      {/* Map watermark */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0E1814]/90 backdrop-blur-md border border-white/[0.07] text-[11px] font-sans text-[#8C9C94]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3FA17C]"></span>
          <span>Erode Hub Active • OpenStreetMap</span>
        </div>
      </div>
    </div>
  );
};
