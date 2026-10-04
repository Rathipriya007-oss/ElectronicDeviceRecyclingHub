import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Recycle, ShieldCheck, Heart, ExternalLink, Leaf, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  const { isDemoMode, toggleDemoMode } = useApp();
  return (
    <footer className="border-t border-white/[0.07] bg-[#07100D] text-[#8C9C94] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EBD3A0] to-[#C49A55] p-[1px]">
                <div className="w-full h-full bg-[#0E1814] rounded-[7px] flex items-center justify-center">
                  <Recycle className="w-4 h-4 text-[#EBD3A0]" />
                </div>
              </div>
              <span className="font-serif text-xl tracking-tight text-[#F3EFE6]">ReLoop</span>
            </Link>
            <p className="text-xs text-[#8C9C94] leading-relaxed">
              Industrial AI-driven platform transforming residential & corporate e-waste into verifiable environmental credits and certified recovery value.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#3FA17C] bg-[#3FA17C]/10 px-2.5 py-1 rounded-md border border-[#3FA17C]/25 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CPCB & TNPCB Compliant Hub</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-[#F3EFE6] uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/scan" className="hover:text-[#EBD3A0] transition-colors">AI Vision Diagnosis</Link>
              </li>
              <li>
                <Link to="/recyclers" className="hover:text-[#EBD3A0] transition-colors">Verified Erode Recyclers</Link>
              </li>
              <li>
                <Link to="/pickup" className="hover:text-[#EBD3A0] transition-colors">Smart Batched Pickup</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#EBD3A0] transition-colors">Environmental Ledger</Link>
              </li>
            </ul>
          </div>

          {/* Regional Hubs */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-[#F3EFE6] uppercase tracking-wider mb-3">Erode Cluster Nodes</h4>
            <ul className="space-y-1.5 text-xs text-[#8C9C94]">
              <li>• Brough Road Commercial Node</li>
              <li>• Surampatti Four Roads Aggregator</li>
              <li>• Chithode NH 544 Metallurgical Center</li>
              <li>• Perundurai SIPCOT Eco-Park</li>
              <li>• Bhavani Delta Recovery Station</li>
            </ul>
          </div>

          {/* Standards & Security */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-[#F3EFE6] uppercase tracking-wider mb-3">Compliance & Ethics</h4>
            <div className="space-y-2 text-xs text-[#8C9C94]">
              <p className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#3FA17C]" />
                Zero-Landfill Guarantee (R2v3)
              </p>
              <p className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#4FA3A5]" />
                DoD 5220.22-M Data Destruction
              </p>
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#EBD3A0]" />
                Form 6 Green Disposal Manifests
              </p>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C9C94]/70">
          <div>
            © {new Date().getFullYear()} ReLoop Technologies. Production deployment centered on Erode, TN.
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[#3FA17C]">Near-zero emissions routing</span>
            <span>•</span>
            
            {/* Hidden / Discrete Demo Mode Toggle */}
            <button
              type="button"
              onClick={toggleDemoMode}
              title="Toggle Offline Demo Mode for live presentations without internet"
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all ${
                isDemoMode
                  ? 'bg-[#E0A94F]/15 border-[#E0A94F]/40 text-[#E0A94F] shadow-[0_0_12px_rgba(224,169,79,0.3)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-[#8C9C94] hover:text-[#F3EFE6] hover:border-white/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#E0A94F] animate-pulse' : 'bg-[#8C9C94]/40'}`} />
              <span>Demo Mode: {isDemoMode ? 'ON (Offline Ready)' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
