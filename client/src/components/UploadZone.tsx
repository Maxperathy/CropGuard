import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Camera, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { diagnosePhoto, DiagnosisResult } from '../services/api';

interface UploadZoneProps {
  userId: string;
  onDiagnosisComplete: (result: DiagnosisResult) => void;
  onFileSelected?: (url: string) => void;
}

const SCAN_STEPS = [
  'Scanning crop leaves...',
  'Detecting anomaly patterns...',
  'Comparing with agricultural databases...',
  'Generating treatment recommendations...',
  'Finalizing diagnosis report...'
];

export function UploadZone({ userId, onDiagnosisComplete, onFileSelected }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag handlers
  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }

  async function processFile(file: File) {
    setError(null);
    setLoading(true);
    setScanStepIndex(0);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setPreview(res);
      if (onFileSelected) onFileSelected(res);
    };
    reader.readAsDataURL(file);

    // Scan steps tick animation
    const interval = setInterval(() => {
      setScanStepIndex((prev) => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    try {
      const result = await diagnosePhoto(userId, file);
      // Wait a tiny bit to let the user see the final step transition
      setTimeout(() => {
        clearInterval(interval);
        setLoading(false);
        setPreview(null);
        onDiagnosisComplete(result);
      }, 1000);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setPreview(null);
      setError(err instanceof Error ? err.message : 'Diagnosis failed');
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-zinc-900 mb-1">Diagnose Your Crop</h3>
      <p className="text-xs text-zinc-500 mb-4">Upload a clear photo of leaves, stems or fruits for AI-assisted diagnostic analysis.</p>

      {/* Error Notice */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Main Drag & Drop / Scanning Area */}
      {!loading ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary/50 hover:bg-zinc-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-800 mb-1">Drag & Drop image here</p>
          <p className="text-xs text-zinc-400 mb-4">PNG, JPG or JPEG up to 10MB</p>
          <button 
            type="button" 
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-light flex items-center gap-1.5 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Image
          </button>
        </div>
      ) : (
        /* Animated Scanning State */
        <div className="border border-zinc-100 bg-zinc-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Dynamic scanner visual bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-light via-primary to-primary-light animate-pulse" />

          {/* Leaf image preview */}
          {preview && (
            <div className="relative mb-6">
              <img src={preview} alt="Scanning leaf preview" className="w-32 h-32 object-cover rounded-xl border border-zinc-200 filter saturate-50" />
              <div className="absolute inset-0 border-2 border-primary rounded-xl animate-ping opacity-25" />
            </div>
          )}

          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 relative">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          <h4 className="text-sm font-bold text-zinc-800 mb-1">Analyzing Crop Specimen</h4>
          
          {/* Progress list of scanner actions */}
          <div className="flex flex-col gap-1.5 mt-3 max-w-xs w-full text-left">
            {SCAN_STEPS.map((step, idx) => {
              const isDone = idx < scanStepIndex;
              const isActive = idx === scanStepIndex;
              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${
                    isDone ? 'text-zinc-500 font-medium' : isActive ? 'text-primary font-bold animate-pulse' : 'text-zinc-300'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${isActive ? 'border-primary border-t-transparent animate-spin' : 'border-zinc-300'}`} />
                  )}
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
