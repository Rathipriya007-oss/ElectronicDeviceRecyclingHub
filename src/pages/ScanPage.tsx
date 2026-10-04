import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  analyzeDeviceImage,
  SAMPLE_DEVICES,
  SamplePreset,
  getActiveGeminiApiKey
} from '../services/aiVisionService';
import { uploadDevicePhoto } from '../services/deviceService';
import { DeviceAssessment } from '../types';
import { DeviceCard } from '../components/DeviceCard';
import {
  Upload,
  Camera,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Key,
  Cpu,
  Zap,
  Activity,
  AlertCircle,
  Play,
  RefreshCw
} from 'lucide-react';

export const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { addDeviceScan, userId, setCurrentDevice, addToast } = useApp();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('Initializing Vision Neural Model...');
  const [assessmentResult, setAssessmentResult] = useState<DeviceAssessment | null>(null);
  const [diagnosticSource, setDiagnosticSource] = useState<'gemini' | 'mock' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('reloop_gemini_key') || '' : '')
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // Track the active blob: URL so we can revoke it when the page unmounts
  const blobUrlRef = useRef<string | null>(null);

  // Revoke the blob URL when ScanPage unmounts to free browser memory.
  // Other pages must never receive a blob: URL — we replace it before calling addDeviceScan.
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Validate and stage file for preview
  const handleFile = (file: File) => {
    setErrorMessage(null);
    setAssessmentResult(null);

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    // Size validation: 10MB maximum limit
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(`Image is too large (${sizeMb} MB). Maximum allowed size is 10 MB. Please select a smaller photo.`);
      return;
    }

    // Revoke previous blob URL before creating a new one
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    blobUrlRef.current = previewUrl;
    setImagePreview(previewUrl);
    setSelectedFile(file);
    setSelectedPresetId(undefined);
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setErrorMessage(null);
    setAssessmentResult(null);
    setImagePreview(preset.thumbnailUrl);
    setSelectedFile(null);
    setSelectedPresetId(preset.id);
  };

  const startDiagnostic = async (forcedFallback = false) => {
    if (!imagePreview && !selectedFile) return;

    setIsScanning(true);
    setErrorMessage(null);
    setAssessmentResult(null);

    // Dynamic scanning telemetry stages
    const messages = [
      'Segmenting component geometry & enclosure...',
      'Detecting structural fractures & digitizer fissures...',
      'Evaluating logic board & capacitor oxidation status...',
      'Calculating metallurgical yield (Gold, Copper, Rare Earth)...',
      'Cross-referencing Erode CPCB refiner pricing indices...'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < messages.length) {
        setScanStepMessage(messages[stepIndex]);
      }
    }, 400);

    try {
      const source = selectedFile || imagePreview!;
      const result = await analyzeDeviceImage(
        forcedFallback ? imagePreview! : source,
        selectedPresetId
      );

      clearInterval(interval);

      let finalAssessment = result.assessment;

      // If a real user file was uploaded (not a preset), persist it to Supabase
      // Storage so the image stays accessible after the blob URL is revoked.
      if (selectedFile && userId) {
        const storagePath = await uploadDevicePhoto(
          selectedFile,
          userId,
          finalAssessment.id
        );
        if (storagePath) {
          // Replace imageUrl with the durable storage path.
          // DeviceCard and other pages will resolve a signed URL from this path.
          finalAssessment = { ...finalAssessment, imageUrl: storagePath };
        } else {
          // Upload failed — fall back to a data-URL so the image never breaks.
          try {
            const dataUrl = await fileToDataUrl(selectedFile);
            finalAssessment = { ...finalAssessment, imageUrl: dataUrl };
          } catch {
            // keep blob: URL on scan page only; other pages may show placeholder
          }
        }
      }

      setAssessmentResult(finalAssessment);
      setDiagnosticSource(result.source);
      addDeviceScan(finalAssessment);
    } catch (err: any) {
      clearInterval(interval);
      console.error('Scan error:', err);
      setErrorMessage(
        err?.message || 'Vision model analysis failed. Please verify your connection or use our offline heuristic engine.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Convert a File to a base64 data-URL for use as a durable local fallback
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setSelectedPresetId(undefined);
    setAssessmentResult(null);
    setErrorMessage(null);
    setIsScanning(false);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('reloop_gemini_key', customApiKey.trim());
    setShowKeyModal(false);
  };

  const activeKey = getActiveGeminiApiKey();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 bg-[#07100D]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#EBD3A0] bg-[#EBD3A0]/10 px-3 py-1 rounded-full border border-[#EBD3A0]/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#EBD3A0]" />
            <span>Industrial Vision Engine v2.4</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#F3EFE6] tracking-tight">
            Device Diagnostic & Valuation
          </h1>
          <p className="text-[#8C9C94] text-sm mt-1 max-w-xl font-sans">
            Upload or photograph any smartphone, laptop, or circuit board. Our neural network assesses physical condition, calculates salvage yields, and guarantees verified refiner bids.
          </p>
        </div>

        {/* API Key Pill */}
        <button
          onClick={() => setShowKeyModal(true)}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-white/[0.07] hover:border-[#EBD3A0]/30 text-xs font-sans text-[#8C9C94] transition-colors"
        >
          <Key className="w-3.5 h-3.5 text-[#EBD3A0]" />
          <span>{activeKey ? 'Live Gemini Vision: Enabled' : 'Diagnostic Engine: Heuristic Fallback'}</span>
        </button>
      </div>

      {/* Main Grid: Upload Zone on Left, Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upload / Scanner */}
        <div className="lg:col-span-6 space-y-6">
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden p-6 sm:p-8 text-center min-h-[380px] flex flex-col items-center justify-center shadow-card ${
              dragActive
                ? 'border-[#EBD3A0] bg-[#13211B]'
                : 'border-white/[0.08] bg-surface hover:border-white/[0.15]'
            }`}
          >
            {/* If an image is selected / currently active */}
            {imagePreview ? (
              <div className="relative w-full h-full min-h-[300px] flex flex-col items-center justify-center">
                <div className="relative max-h-[300px] rounded-xl overflow-hidden shadow-card border border-white/10 bg-[#07100D]">
                  <img
                    src={imagePreview}
                    alt="Scanned Device"
                    className="max-h-[280px] w-auto object-contain"
                  />

                  {/* Gold Laser Scanning Animation Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-[#07100D]/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                      {/* Laser line sweeping up and down */}
                      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EBD3A0] to-transparent shadow-[0_0_15px_#EBD3A0] animate-laser" />

                      {/* Animated radar rings */}
                      <div className="relative mb-4">
                        <div className="w-14 h-14 rounded-full border border-[#EBD3A0]/40 flex items-center justify-center animate-spin">
                          <Activity className="w-5 h-5 text-[#EBD3A0]" />
                        </div>
                      </div>

                      <div className="text-gold-gradient font-serif font-medium text-base">
                        Neural Diagnostics in Progress
                      </div>
                      <div className="text-xs font-sans text-[#8C9C94] mt-2 max-w-xs transition-all">
                        {scanStepMessage}
                      </div>

                      <div className="w-48 bg-surface-hover h-1 rounded-full mt-4 overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-[#EBD3A0] to-[#C49A55] animate-shimmer" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Staged Image Preview Bar (before scanning) */}
                {!isScanning && !assessmentResult && (
                  <div className="mt-4 w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#13211B] border border-white/[0.08]">
                    <div className="text-left text-xs font-sans">
                      <span className="text-[#F3EFE6] font-medium block truncate max-w-[200px]">
                        {selectedFile ? selectedFile.name : selectedPresetId ? 'Sample Device Preset' : 'Photo Selected'}
                      </span>
                      {selectedFile && (
                        <span className="text-[#8C9C94] font-mono text-[11px]">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleReset}
                        className="flex-1 sm:flex-initial px-3 py-2 rounded-lg text-xs font-sans text-[#8C9C94] hover:text-[#F3EFE6] hover:bg-white/5 transition-colors"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => startDiagnostic(false)}
                        className="btn-gold flex-1 sm:flex-initial px-4 py-2 text-xs font-sans tracking-tight flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-[#1A1409]" />
                        <span>Inspect Now</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Reset button when completed */}
                {!isScanning && assessmentResult && (
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-2 rounded-xl bg-surface/90 hover:bg-surface text-[#F3EFE6] border border-white/15 backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-sans"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Upload Another</span>
                  </button>
                )}
              </div>
            ) : (
              /* Idle Upload Prompt */
              <div className="space-y-4 max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#13211B] border border-white/[0.08] flex items-center justify-center mx-auto text-[#EBD3A0] shadow-gold-sm">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-serif text-lg font-medium text-[#F3EFE6]">Upload device photo</h3>
                  <p className="text-xs text-[#8C9C94] mt-1 leading-relaxed font-sans">
                    Drag and drop your image here, or select from local files or camera.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl font-sans font-medium text-xs bg-white/[0.05] hover:bg-white/[0.1] text-[#F3EFE6] border border-white/[0.08] transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-[#EBD3A0]" />
                    <span>Choose File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl font-sans font-medium text-xs bg-[#EBD3A0]/10 hover:bg-[#EBD3A0]/20 text-[#EBD3A0] border border-[#EBD3A0]/30 transition-all flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                <div className="pt-2 text-[11px] font-mono text-[#8C9C94]">
                  Max file size: 10MB • JPG, PNG, WebP
                </div>
              </div>
            )}
          </div>

          {/* Friendly Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#D9776B]/10 border border-[#D9776B]/30 text-xs font-sans space-y-3">
              <div className="flex items-start gap-2.5 text-[#EAA198]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D9776B]" />
                <div>
                  <p className="font-medium text-[#F3EFE6]">Diagnostic Notice</p>
                  <p className="mt-0.5 leading-relaxed text-[#EAA198]/90">{errorMessage}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => startDiagnostic(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#D9776B]/20 hover:bg-[#D9776B]/30 text-[#EAA198] border border-[#D9776B]/30 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={() => startDiagnostic(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#3FA17C]/20 hover:bg-[#3FA17C]/30 text-[#67C7A2] border border-[#3FA17C]/30 transition-colors"
                >
                  Use Guaranteed Offline Engine
                </button>
              </div>
            </div>
          )}

          {/* Quick 1-Click Demo Presets */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/[0.07] shadow-card">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-sans uppercase tracking-widest text-[#F3EFE6] font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#EBD3A0]" />
                <span>Instant Test Samples</span>
              </span>
              <span className="text-[11px] font-sans text-[#8C9C94]">One-click valuation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_DEVICES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    handleSelectPreset(sample);
                    setTimeout(() => startDiagnostic(false), 50);
                  }}
                  disabled={isScanning}
                  className="text-left p-2.5 rounded-xl bg-[#07100D] hover:bg-[#13211B] border border-white/[0.06] hover:border-[#EBD3A0]/30 transition-all group flex flex-col"
                >
                  <div className="w-full h-16 rounded-lg overflow-hidden mb-2 bg-[#07100D] border border-white/[0.05]">
                    <img
                      src={sample.thumbnailUrl}
                      alt={sample.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-sans font-medium text-[#F3EFE6] line-clamp-1 group-hover:text-[#EBD3A0]">
                    {sample.brand}
                  </span>
                  <span className="text-[10px] text-[#8C9C94] line-clamp-1 font-sans">
                    {sample.model}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Result Card & Action */}
        <div className="lg:col-span-6 space-y-6">
          {assessmentResult ? (
            <div className="space-y-6">
              {/* Active Engine Badge */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface border border-white/[0.07] text-xs font-sans text-[#8C9C94]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA17C]" />
                  <span>
                    Diagnostic Source:{' '}
                    <strong className="text-[#F3EFE6]">
                      {diagnosticSource === 'gemini' ? 'Google Gemini Vision AI' : 'Heuristic Calibration Engine'}
                    </strong>
                  </span>
                </span>
                <span className="text-[#EBD3A0] font-sans font-medium">Verified Grade {assessmentResult.grade}</span>
              </div>

              {/* Detailed Result Certificate Card */}
              <DeviceCard device={assessmentResult} showActions={false} />

              {/* Next Action: Find Recyclers */}
              <div className="glass-panel p-6 rounded-2xl border border-[#EBD3A0]/30 bg-gradient-to-br from-[#13211B] to-[#0E1814] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#EBD3A0] font-sans block font-semibold">
                    Diagnosis Certified
                  </span>
                  <h4 className="font-serif text-lg font-medium text-[#F3EFE6] mt-0.5">
                    10 Recyclers in Erode ready to bid
                  </h4>
                  <p className="text-xs text-[#8C9C94] mt-1 font-sans">
                    Select an authorized facility for doorstep collection.
                  </p>
                </div>

                <button
                  onClick={() => {
                    try {
                      setCurrentDevice(assessmentResult);
                      navigate('/recyclers');
                    } catch (err: any) {
                      addToast({
                        type: 'error',
                        title: 'Navigation error',
                        description: err?.message ?? 'Could not open recyclers page.',
                      });
                    }
                  }}
                  className="btn-gold w-full sm:w-auto px-6 py-3.5 flex items-center justify-center gap-2 shrink-0 text-sm font-sans tracking-tight"
                >
                  <span>Find Recyclers in Erode</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="glass-panel p-8 rounded-2xl border border-white/[0.07] text-center min-h-[460px] flex flex-col items-center justify-center space-y-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-[#07100D] border border-white/[0.08] flex items-center justify-center text-[#8C9C94] mx-auto">
                <Cpu className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h3 className="font-serif text-xl font-medium text-[#F3EFE6]">Awaiting Device Photo</h3>
                <p className="text-xs text-[#8C9C94] mt-1.5 leading-relaxed font-sans">
                  Upload an image on the left or tap one of the instant sample devices to generate a certified valuation.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="pt-4 grid grid-cols-2 gap-3 text-left w-full max-w-sm font-sans text-xs text-[#8C9C94]">
                <div className="p-2.5 rounded-xl bg-surface border border-white/[0.05] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA17C] shrink-0" />
                  <span>Grade A–D Matrix</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-white/[0.05] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA17C] shrink-0" />
                  <span>Gold & Copper Yield</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-white/[0.05] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA17C] shrink-0" />
                  <span>Instant ₹ Valuation</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-white/[0.05] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA17C] shrink-0" />
                  <span>Carbon Offset Score</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/[0.1] max-w-md w-full space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#F3EFE6] font-serif font-medium text-lg">
                <Key className="w-4 h-4 text-[#EBD3A0]" />
                <span>AI Vision Engine Key</span>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-[#8C9C94] hover:text-[#F3EFE6] text-xs font-sans"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#8C9C94] leading-relaxed font-sans">
              ReLoop includes an offline heuristic diagnostic engine by default. To connect directly to Google Gemini 1.5/2.0 Vision, enter your API key below or set <code className="text-[#EBD3A0] font-mono">VITE_GEMINI_API_KEY</code> in <code className="text-[#EBD3A0] font-mono">.env</code>:
            </p>

            <div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#07100D] border border-white/10 text-[#F3EFE6] font-mono text-xs focus:border-[#EBD3A0] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomApiKey('');
                  localStorage.removeItem('reloop_gemini_key');
                  setShowKeyModal(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-sans text-[#8C9C94] hover:text-[#F3EFE6]"
              >
                Clear / Use Fallback
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="btn-gold px-4 py-2 text-xs font-sans font-semibold tracking-tight"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
