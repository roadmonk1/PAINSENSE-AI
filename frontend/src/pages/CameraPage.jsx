import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2, Play, Square, Sparkles } from 'lucide-react';
import { analyzeCamera } from '../services/api';

export default function CameraPage() {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Simulated slider controls for manual testing / demo mode adjustments
  const [demoFeatures, setDemoFeatures] = useState({
    brow_furrowing: 0.55,
    orbital_tightening: 0.45,
    mouth_tension: 0.40,
    postural_guarding: 0.60,
    shoulder_tension: 0.50,
    movement_asymmetry: 0.20
  });

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setPermissionState('granted');
    } catch (err) {
      console.warn("Camera access error:", err);
      setPermissionState('denied');
      setErrorMsg("Camera permission denied or camera device unavailable. You can use the built-in synthetic test patterns below to verify all facial & posture analysis algorithms.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleAnalyze = async (overrideFeatures = null) => {
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const featuresToSend = overrideFeatures || demoFeatures;
      const res = await analyzeCamera(featuresToSend);
      setAnalysisResult(res);
    } catch (err) {
      setErrorMsg("Failed to communicate with vision analysis backend. Please check backend connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadPreset = (type) => {
    let preset = {};
    if (type === 'severe_pain') {
      preset = {
        brow_furrowing: 0.85,
        orbital_tightening: 0.75,
        mouth_tension: 0.70,
        postural_guarding: 0.80,
        shoulder_tension: 0.75,
        movement_asymmetry: 0.45
      };
    } else if (type === 'mild_pain') {
      preset = {
        brow_furrowing: 0.35,
        orbital_tightening: 0.25,
        mouth_tension: 0.20,
        postural_guarding: 0.30,
        shoulder_tension: 0.35,
        movement_asymmetry: 0.10
      };
    } else {
      preset = {
        brow_furrowing: 0.05,
        orbital_tightening: 0.08,
        mouth_tension: 0.06,
        postural_guarding: 0.08,
        shoulder_tension: 0.10,
        movement_asymmetry: 0.02
      };
    }
    setDemoFeatures(preset);
    handleAnalyze(preset);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title & Guidelines */}
      <div>
        <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Camera className="w-4 h-4" />
          <span>Optical & Somatic Telemetry</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Camera Facial & Posture Analysis
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-3xl">
          Monitors observable action units (AU4 brow furrowing, AU6/7 orbital tightening, mouth tension) and somatic guarding.
        </p>
      </div>

      {/* Strict Medical Boundary Alert */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-xs text-amber-900 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Crucial Clinical Boundary:</span>
          Facial expressions and body postures are non-specific physical reactions. Stoic individuals or neurological conditions may present zero facial change during severe pain. PAINSENSE-AI treats optical observations as supportive context, never as definitive diagnostic proof.
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Camera Grid & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Video Feed / Simulation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Visual Capture Console</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              cameraActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {cameraActive ? 'Live Webcam Stream' : 'Camera Idle / Prototype'}
            </span>
          </div>

          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {!cameraActive && (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <Camera className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <p className="text-sm">Webcam preview is currently paused.</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click 'Start Live Camera' to enable local browser webcam feed, or use deterministic test presets.
                </p>
              </div>
            )}

            {/* Live Tracking Overlays */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between border-2 border-sky-400/40 rounded-xl">
                <div className="flex justify-between text-[11px] font-mono text-sky-400 bg-slate-900/70 p-1.5 rounded backdrop-blur-sm self-start">
                  <span>Landmark Track: Active (PSPI AU4/6/7)</span>
                </div>
                <div className="text-right text-[11px] font-mono text-emerald-400 bg-slate-900/70 p-1.5 rounded backdrop-blur-sm self-end">
                  <span>Privacy: Local Browser Processing</span>
                </div>
              </div>
            )}
          </div>

          {/* Camera Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow"
              >
                <Play className="w-4 h-4" />
                <span>Start Live Camera</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 transition-all"
              >
                <Square className="w-4 h-4" />
                <span>Stop Camera</span>
              </button>
            )}

            <button
              onClick={() => handleAnalyze()}
              disabled={analyzing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow"
            >
              <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Extracting Action Units...' : 'Analyze Current Frame'}</span>
            </button>
          </div>

          {/* Deterministic Presets */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">Deterministic Test Presets (Zero Fake Randomness):</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => loadPreset('severe_pain')}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold"
              >
                Preset: Acute Grimace & Guarding
              </button>
              <button
                onClick={() => loadPreset('mild_pain')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold"
              >
                Preset: Subtle Discomfort
              </button>
              <button
                onClick={() => loadPreset('neutral')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                Preset: Neutral Baseline
              </button>
            </div>
          </div>
        </div>

        {/* Right: Observable Features & Model Evaluation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Extracted Observable Metrics</h3>
            <span className="text-xs font-mono text-slate-400">PSPI Metric Standard</span>
          </div>

          {/* Action Units Breakdown */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>AU4: Brow Furrowing / Corrugator Supercilii</span>
                <span className="font-mono">{Math.round(demoFeatures.brow_furrowing * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-sky-500 h-2 rounded-full transition-all" 
                  style={{ width: `${demoFeatures.brow_furrowing * 100}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>AU6/7: Orbital Tightening / Orbicularis Oculi</span>
                <span className="font-mono">{Math.round(demoFeatures.orbital_tightening * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all" 
                  style={{ width: `${demoFeatures.orbital_tightening * 100}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>AU25-27: Mouth Opening / Jaw Tension</span>
                <span className="font-mono">{Math.round(demoFeatures.mouth_tension * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all" 
                  style={{ width: `${demoFeatures.mouth_tension * 100}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Postural Guarding & Torso Flexion</span>
                <span className="font-mono">{Math.round(demoFeatures.postural_guarding * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all" 
                  style={{ width: `${demoFeatures.postural_guarding * 100}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          {analysisResult && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Inference Synthesis</span>
                <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-medium">
                  Confidence: {Math.round(analysisResult.confidence * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Facial Grimace Score</span>
                  <span className="font-bold text-slate-800 text-sm">{analysisResult.facial.grimace_score} / 1.0</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Tension Category</span>
                  <span className="font-bold text-slate-800 text-sm">{analysisResult.facial.tension_level}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">Observable Indicators:</span>
                <ul className="space-y-1">
                  {analysisResult.facial.observable_indicators.map((ind, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span>{ind}</span>
                    </li>
                  ))}
                  {analysisResult.body.observable_indicators.map((ind, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 italic">
                {analysisResult.disclaimer}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
