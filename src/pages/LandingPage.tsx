import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  Scan,
  ShieldCheck,
  Recycle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Lock,
  Leaf,
  Zap,
  Star
} from 'lucide-react';
import { GradeBadge } from '../components/GradeBadge';

export const LandingPage: React.FC = () => {
  const { impactStats } = useApp();
  const [calculatorCategory, setCalculatorCategory] = useState<'smartphone' | 'laptop' | 'motherboard'>('smartphone');

  const calculatorData = {
    smartphone: {
      title: 'Flagship Smartphone',
      estValue: '₹3,500 – ₹7,200',
      gold: '32 mg',
      copper: '16 g',
      co2: '19.4 kg'
    },
    laptop: {
      title: 'Workstation Laptop',
      estValue: '₹8,500 – ₹16,000',
      gold: '180 mg',
      copper: '95 g',
      co2: '44.8 kg'
    },
    motherboard: {
      title: 'High-Density Logic Board',
      estValue: '₹1,200 – ₹2,800',
      gold: '340 mg',
      copper: '142 g',
      co2: '28.5 kg'
    }
  }[calculatorCategory];

  return (
    <div className="relative overflow-hidden bg-[#07100D]">
      {/* Refined radial gold-tinted glow behind hero (no neon blobs) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-radial-gold pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill announcement */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-white/[0.08] text-xs font-sans text-[#8C9C94]">
              <Sparkles className="w-3.5 h-3.5 text-[#EBD3A0]" />
              <span className="text-[#F3EFE6] font-medium">Circular Hardware Recovery</span>
              <span className="text-white/20">•</span>
              <span>Erode Central Cluster</span>
            </div>

            {/* Bold Elegant Serif Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-[#F3EFE6] leading-[1.12]">
              Turn old devices into{' '}
              <span className="text-gold-gradient italic font-normal">
                trusted value
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#8C9C94] max-w-2xl leading-relaxed mx-auto lg:mx-0 font-sans">
              Don’t let obsolete electronics languish in drawers or leak toxins in informal scrapyards. ReLoop uses precision computer vision to inspect hardware condition, connects with vetted Erode refiners, and schedules zero-emission doorstep collections.
            </p>

            {/* CTA Group */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/scan"
                className="btn-gold w-full sm:w-auto px-7 py-3.5 flex items-center justify-center gap-2.5 text-base font-sans tracking-tight"
              >
                <Scan className="w-4 h-4 text-[#1A1409]" />
                <span>Scan your device</span>
                <ArrowRight className="w-4 h-4 text-[#1A1409]" />
              </Link>

              <Link
                to="/recyclers"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-sans text-sm font-medium text-[#F3EFE6] bg-surface hover:bg-[#13211B] border border-white/[0.08] hover:border-[#EBD3A0]/30 transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#EBD3A0]" />
                <span>Browse 10 Erode Recyclers</span>
              </Link>
            </div>

            {/* Trust Micro-Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-sans text-[#8C9C94]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#3FA17C]" />
                <span>CPCB & TNPCB Authorized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#EBD3A0]" />
                <span>DoD 5220.22-M Data Wipe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#4FA3A5]" />
                <span>Instant Doorstep UPI</span>
              </div>
            </div>
          </div>

          {/* Right Hero: Product Valuation Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              {/* Refined Gold Halo */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#EBD3A0]/20 to-[#C49A55]/10 rounded-3xl opacity-50 blur-xl" />

              {/* Mockup Card */}
              <div className="relative glass-panel rounded-2xl border border-white/[0.09] p-5 sm:p-6 shadow-card overflow-hidden bg-surface">
                {/* Simulated Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-sans text-[#8C9C94]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3FA17C] animate-pulse" />
                    <span className="text-[#F3EFE6] font-medium text-[11px] tracking-wide uppercase">AI Diagnostic Scanner</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8C9C94]">NODE: ERD-CENTRAL</span>
                </div>

                {/* Device Inspection Visual */}
                <div className="relative my-4 rounded-xl overflow-hidden border border-white/[0.08] bg-[#07100D] aspect-[4/3] flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&auto=format&fit=crop&q=80"
                    alt="Inspected Device"
                    className="w-full h-full object-cover opacity-85"
                  />

                  {/* Neural bounding boxes */}
                  <div className="absolute top-5 right-6 px-2 py-1 border border-[#EBD3A0]/70 bg-black/60 rounded font-mono text-[9px] text-[#EBD3A0] shadow-sm">
                    OLED Matrix: 98%
                  </div>

                  <div className="absolute bottom-6 left-6 px-2 py-1 border border-[#E0A94F]/70 bg-black/60 rounded font-mono text-[9px] text-[#F2C274] shadow-sm">
                    Hairline Fissure (Grade C)
                  </div>

                  {/* Animated Gold Laser Scanning Line */}
                  <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EBD3A0] to-transparent shadow-[0_0_12px_#EBD3A0] animate-laser" />
                </div>

                {/* Diagnostic readout card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-base font-medium text-[#F3EFE6]">Apple iPhone 11 (64GB)</h4>
                      <p className="text-xs text-[#8C9C94] font-sans">Logic Board Pristine • Casing Intact</p>
                    </div>
                    <GradeBadge grade="C" size="sm" />
                  </div>

                  {/* Value readout bar */}
                  <div className="p-3.5 rounded-xl bg-[#13211B] border border-[#EBD3A0]/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#8C9C94] font-sans block">Estimated Offer Range</span>
                      <div className="text-xl font-serif text-gold-gradient font-medium">₹4,200 – ₹5,800</div>
                    </div>
                    <Link
                      to="/scan"
                      className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium text-[#EBD3A0] bg-[#EBD3A0]/10 hover:bg-[#EBD3A0]/20 border border-[#EBD3A0]/30 transition-all flex items-center gap-1"
                    >
                      <span>Scan Live</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Live Impact Counters Section */}
      <section className="py-12 border-y border-white/[0.06] bg-[#07100D] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.07] hover:border-[#EBD3A0]/30 transition-all">
              <div className="flex items-center justify-between text-xs font-sans text-[#8C9C94] mb-2 uppercase tracking-wider">
                <span>Devices Recycled</span>
                <Recycle className="w-4 h-4 text-[#EBD3A0]" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-medium text-[#F3EFE6] tracking-tight">
                <AnimatedCounter value={impactStats.devicesCount} durationMs={1200} />
                <span className="text-[#EBD3A0] text-lg font-sans ml-0.5">+</span>
              </div>
              <p className="text-xs text-[#8C9C94] mt-1 font-sans">Smartphones, laptops & enterprise servers</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/[0.07] hover:border-[#EBD3A0]/30 transition-all">
              <div className="flex items-center justify-between text-xs font-sans text-[#8C9C94] mb-2 uppercase tracking-wider">
                <span>E-Waste Diverted</span>
                <ShieldCheck className="w-4 h-4 text-[#3FA17C]" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-medium text-[#F3EFE6] tracking-tight">
                <AnimatedCounter value={impactStats.kgDiverted} durationMs={1400} />
                <span className="text-[#3FA17C] text-lg font-sans ml-0.5"> kg</span>
              </div>
              <p className="text-xs text-[#8C9C94] mt-1 font-sans">Heavy metals diverted from Erode soil</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/[0.07] hover:border-[#EBD3A0]/30 transition-all">
              <div className="flex items-center justify-between text-xs font-sans text-[#8C9C94] mb-2 uppercase tracking-wider">
                <span>CO₂ Emissions Saved</span>
                <Leaf className="w-4 h-4 text-[#4FA3A5]" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-medium text-[#F3EFE6] tracking-tight">
                <AnimatedCounter value={impactStats.co2SavedKg / 1000} decimals={1} durationMs={1500} />
                <span className="text-[#4FA3A5] text-lg font-sans ml-0.5"> Tonnes</span>
              </div>
              <p className="text-xs text-[#8C9C94] mt-1 font-sans">Avoided metallurgical mining footprint</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/[0.07] hover:border-[#EBD3A0]/30 transition-all">
              <div className="flex items-center justify-between text-xs font-sans text-[#8C9C94] mb-2 uppercase tracking-wider">
                <span>Direct Settlements</span>
                <TrendingUp className="w-4 h-4 text-[#EBD3A0]" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-medium text-[#F3EFE6] tracking-tight">
                ₹<AnimatedCounter value={impactStats.totalEarningsInr / 100000} decimals={2} durationMs={1600} />
                <span className="text-[#EBD3A0] text-lg font-sans ml-0.5"> Lakh</span>
              </div>
              <p className="text-xs text-[#8C9C94] mt-1 font-sans">Disbursed instantly via verified UPI</p>
            </div>

          </div>
        </div>
      </section>

      {/* 3-Step How-It-Works */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-sans uppercase tracking-widest text-[#EBD3A0] bg-[#EBD3A0]/10 px-3 py-1 rounded-full border border-[#EBD3A0]/20">
            Frictionless Circular Workflow
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6] mt-4 tracking-tight">
            How ReLoop Powers Responsible Hardware Recovery
          </h2>
          <p className="text-[#8C9C94] mt-3 text-sm sm:text-base font-sans">
            From an old device sitting in your drawer to an instant bank settlement and certified material recovery in three calm steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.07] relative group hover:border-[#EBD3A0]/30 transition-all shadow-card">
            <div className="font-serif font-normal text-3xl text-gold-gradient mb-6">
              01
            </div>
            <h3 className="font-serif text-xl font-medium text-[#F3EFE6] mb-2">AI Visual Diagnosis</h3>
            <p className="text-sm text-[#8C9C94] leading-relaxed font-sans">
              Snap a photo or upload an image. Our neural diagnostic model inspects chassis fractures, motherboard health, battery cycle degradation, and metallurgical recovery yield in under two seconds.
            </p>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-sans text-[#EBD3A0]">
              <Scan className="w-4 h-4" />
              <span>Multi-layer physical grading (A–D)</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.07] relative group hover:border-[#EBD3A0]/30 transition-all shadow-card">
            <div className="font-serif font-normal text-3xl text-gold-gradient mb-6">
              02
            </div>
            <h3 className="font-serif text-xl font-medium text-[#F3EFE6] mb-2">Verified Recycler Match</h3>
            <p className="text-sm text-[#8C9C94] leading-relaxed font-sans">
              Compare transparent bids from 10 vetted, CPCB-registered recycling facilities across Erode. Filter by distance, rating, and highest payout multipliers with data-wipe guarantees.
            </p>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-sans text-[#3FA17C]">
              <ShieldCheck className="w-4 h-4" />
              <span>100% CPCB / TNPCB compliant refiners</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.07] relative group hover:border-[#EBD3A0]/30 transition-all shadow-card">
            <div className="font-serif font-normal text-3xl text-gold-gradient mb-6">
              03
            </div>
            <h3 className="font-serif text-xl font-medium text-[#F3EFE6] mb-2">Smart Batched Pickup</h3>
            <p className="text-sm text-[#8C9C94] leading-relaxed font-sans">
              Select your preferred date & time slot. Our nearest-neighbor route planner aggregates neighbor stops to slash transit emissions by 42%. Get paid instantly via UPI at your doorstep.
            </p>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-sans text-[#4FA3A5]">
              <Zap className="w-4 h-4" />
              <span>Form 6 Green Disposal Receipt issued</span>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Value Estimator */}
      <section className="py-16 bg-[#0B1411] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-sans uppercase tracking-widest text-[#EBD3A0]">Hardware Estimator</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#F3EFE6] tracking-tight">
                Curious what your idle electronics are worth?
              </h2>
              <p className="text-sm text-[#8C9C94] leading-relaxed font-sans">
                Even non-functional devices contain gold plating, refined copper circuitry, and salvageable logic chips. Select a category to see current metallurgical recovery value in Erode.
              </p>

              {/* Selector buttons */}
              <div className="flex gap-2 pt-2">
                {(['smartphone', 'laptop', 'motherboard'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCalculatorCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-sans capitalize transition-all ${
                      calculatorCategory === cat
                        ? 'bg-[#EBD3A0] text-[#1A1409] font-medium shadow-sm'
                        : 'bg-surface text-[#8C9C94] hover:text-[#F3EFE6] border border-white/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#EBD3A0]/20 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#F3EFE6]">{calculatorData.title}</h3>
                    <p className="text-xs font-sans text-[#8C9C94]">Average Erode Refiner Valuation</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-sans text-[#EBD3A0] uppercase tracking-wider block">Estimated Payout</span>
                    <div className="font-serif text-2xl sm:text-3xl font-medium text-gold-gradient">{calculatorData.estValue}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06] text-center font-sans">
                  <div className="p-3 rounded-xl bg-surface border border-white/[0.05]">
                    <span className="text-[11px] text-[#8C9C94] block uppercase tracking-wider">Gold Content</span>
                    <span className="text-base font-serif font-medium text-[#EBD3A0]">{calculatorData.gold}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-white/[0.05]">
                    <span className="text-[11px] text-[#8C9C94] block uppercase tracking-wider">Copper Yield</span>
                    <span className="text-base font-serif font-medium text-[#3FA17C]">{calculatorData.copper}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-white/[0.05]">
                    <span className="text-[11px] text-[#8C9C94] block uppercase tracking-wider">CO₂ Abated</span>
                    <span className="text-base font-serif font-medium text-[#4FA3A5]">{calculatorData.co2}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
                    to="/scan"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-sans font-medium text-[#EBD3A0] bg-[#EBD3A0]/10 hover:bg-[#EBD3A0]/20 border border-[#EBD3A0]/30 transition-all"
                  >
                    <span>Run Diagnostic on Your Device</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust & Testimonials */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-sans uppercase tracking-widest text-[#EBD3A0] bg-[#EBD3A0]/10 px-3 py-1 rounded-full border border-[#EBD3A0]/20">
            Verified Community Feedback
          </span>
          <h2 className="font-serif text-3xl font-medium text-[#F3EFE6] mt-4">
            Trusted by Citizens & IT Facilities in Erode
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/[0.07] shadow-card">
            <div className="flex items-center gap-1 text-[#EBD3A0] mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#EBD3A0]" />
              ))}
            </div>
            <p className="font-serif text-sm text-[#F3EFE6] leading-relaxed italic">
              "Had 3 broken laptops and old motherboards taking up shelf space for 4 years. Scanned them on ReLoop, picked EcoCircuits at Brough Road, and had ₹14,200 deposited into my account within 3 hours."
            </p>
            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans">
              <span className="text-[#F3EFE6] font-medium">Kavitha Rajan</span>
              <span className="text-[#8C9C94]">Surampatti, Erode</span>
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/[0.07] shadow-card">
            <div className="flex items-center gap-1 text-[#EBD3A0] mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#EBD3A0]" />
              ))}
            </div>
            <p className="font-serif text-sm text-[#F3EFE6] leading-relaxed italic">
              "As an engineering lab coordinator, we needed verified Form 6 disposal manifests and audited military-grade data wiping. ReLoop connected us with Chithode Mega Plant effortlessly."
            </p>
            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans">
              <span className="text-[#F3EFE6] font-medium">Dr. S. Karthikeyan</span>
              <span className="text-[#8C9C94]">Thindal Campus</span>
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/[0.07] shadow-card">
            <div className="flex items-center gap-1 text-[#EBD3A0] mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#EBD3A0]" />
              ))}
            </div>
            <p className="font-serif text-sm text-[#F3EFE6] leading-relaxed italic">
              "The AI scanning accurately caught the intact logic board despite my cracked glass and gave me Grade C. Informal scrap dealers offered ₹800; ReLoop refiners gave me ₹4,400."
            </p>
            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans">
              <span className="text-[#F3EFE6] font-medium">P. Naveen Kumar</span>
              <span className="text-[#8C9C94]">Perundurai Road</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative glass-panel rounded-3xl p-8 sm:p-12 border border-[#EBD3A0]/30 overflow-hidden text-center shadow-card bg-surface">
          <div className="absolute inset-0 bg-radial-gold pointer-events-none" />
          
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6] tracking-tight relative z-10">
            Ready to recycle responsibly and get paid?
          </h2>
          <p className="text-[#8C9C94] text-sm sm:text-base max-w-xl mx-auto mt-3 relative z-10 font-sans">
            Snap a photo of your unused electronics right now. Computer vision diagnostics take two seconds, with zero obligations.
          </p>

          <div className="mt-8 flex justify-center relative z-10">
            <Link
              to="/scan"
              className="btn-gold px-8 py-4 text-base font-sans tracking-tight flex items-center gap-2"
            >
              <Scan className="w-4 h-4 text-[#1A1409]" />
              <span>Launch Device Diagnostic</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
