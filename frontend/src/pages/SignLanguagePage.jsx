import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Hand, Camera, Volume2, Check, Send, 
  ShieldAlert, Sparkles, Edit3, AlertTriangle, AlertCircle, RefreshCw
} from 'lucide-react';
import { analyzeSignSequence, submitSignFeedback, getSignVocabulary } from '../services/api';
import { speakText } from '../utils/speech';

// MediaPipe 21 Hand Connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
];

/**
 * Dynamically loads MediaPipe Hands from CDN or global window object.
 */
function loadMediaPipeHands() {
  if (window.Hands) {
    return Promise.resolve(window.Hands);
  }
  return new Promise((resolve, reject) => {
    // Check if script is already present
    const existingScript = document.querySelector('script[data-mediapipe-hands]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Hands));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-mediapipe-hands', 'true');
    script.onload = () => {
      if (window.Hands) {
        resolve(window.Hands);
      } else {
        reject(new Error('MediaPipe Hands library did not define window.Hands.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load MediaPipe Hands library from CDN.'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Geometric Sign Classifier using 21 3D hand landmarks.
 * Classifies canonical postures: stop, yes, where, emergency, mild, severe, head, chest, stomach.
 */
function classifyHandGesture(landmarks, dialect = 'asl') {
  if (!landmarks || landmarks.length !== 21) return null;

  const dist = (i, j) => {
    const dx = landmarks[i].x - landmarks[j].x;
    const dy = landmarks[i].y - landmarks[j].y;
    const dz = (landmarks[i].z || 0) - (landmarks[j].z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const wrist = landmarks[0];
  const palmScale = dist(0, 9); // Distance from wrist to middle MCP
  if (palmScale < 0.04) return null; // Hand too small or out of frame

  // Finger extension tests (distance to wrist vs PIP to wrist)
  const isThumbExtended = dist(0, 4) > dist(0, 2) * 1.20 && dist(4, 5) > palmScale * 0.40;
  const isIndexExtended = dist(0, 8) > dist(0, 6) * 1.20;
  const isMiddleExtended = dist(0, 12) > dist(0, 10) * 1.20;
  const isRingExtended = dist(0, 16) > dist(0, 14) * 1.20;
  const isPinkyExtended = dist(0, 20) > dist(0, 18) * 1.20;

  const extendedCount = (isIndexExtended ? 1 : 0) + 
                        (isMiddleExtended ? 1 : 0) + 
                        (isRingExtended ? 1 : 0) + 
                        (isPinkyExtended ? 1 : 0);

  // Distance between thumb tip and index tip
  const thumbIndexDist = dist(4, 8) / palmScale;
  const handCenterY = (wrist.y + landmarks[9].y) / 2;

  // 1. Pinch / Small gap gesture -> "mild" (thoda/mild)
  if (thumbIndexDist < 0.32 && (isMiddleExtended || isRingExtended || isPinkyExtended)) {
    return {
      sign: 'mild',
      confidence: 0.88,
      label: dialect === 'isl' ? 'Mild (Thoda)' : 'Mild / Slight'
    };
  }

  // 2. Open palm / High-five facing forward -> "stop" (ruko/stop)
  if (extendedCount >= 4 && isThumbExtended) {
    return {
      sign: 'stop',
      confidence: 0.94,
      label: dialect === 'isl' ? 'Stop (Ruko)' : 'Stop / Halt'
    };
  }

  // 3. Closed fist (all 4 fingers curled) -> "yes" (S-fist / affirmative)
  if (extendedCount === 0 && !isThumbExtended) {
    return {
      sign: 'yes',
      confidence: 0.89,
      label: dialect === 'isl' ? 'Yes (Haan)' : 'Yes (Affirmative)'
    };
  }

  // 4. Index finger pointing up only -> "where" (query location)
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return {
      sign: 'where',
      confidence: 0.92,
      label: dialect === 'isl' ? 'Where (Kahan)' : 'Where / Location'
    };
  }

  // 5. Index & Middle fingers extended (V-shape) -> "emergency"
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return {
      sign: 'emergency',
      confidence: 0.91,
      label: dialect === 'isl' ? 'Emergency (Khatra)' : 'Emergency / Urgent'
    };
  }

  // 6. Claw hand (fingers curled tense) -> "severe" (bahut zyada)
  const isIndexClaw = dist(0, 8) < dist(0, 6) * 1.15 && dist(0, 8) > dist(0, 5) * 1.05;
  const isMiddleClaw = dist(0, 12) < dist(0, 10) * 1.15 && dist(0, 12) > dist(0, 9) * 1.05;
  if (isIndexClaw && isMiddleClaw && extendedCount <= 1) {
    return {
      sign: 'severe',
      confidence: 0.86,
      label: dialect === 'isl' ? 'Severe (Bahut Zyada)' : 'Severe Pain'
    };
  }

  // 7. Anatomical locations based on vertical screen position of hand
  if (extendedCount >= 3) {
    if (handCenterY < 0.28) {
      return { sign: 'head', confidence: 0.85, label: dialect === 'isl' ? 'Head (Sar)' : 'Head' };
    } else if (handCenterY > 0.68) {
      return { sign: 'stomach', confidence: 0.85, label: dialect === 'isl' ? 'Stomach (Pet)' : 'Stomach' };
    } else {
      return { sign: 'chest', confidence: 0.86, label: dialect === 'isl' ? 'Chest (Chaati)' : 'Chest' };
    }
  }

  return null;
}

export default function SignLanguagePage() {
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [recognitionResult, setRecognitionResult] = useState(null);
  
  // Camera & Pipeline States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [mediaPipeError, setMediaPipeError] = useState(null);
  const [handDetected, setHandDetected] = useState(false);
  const [holdingSign, setHoldingSign] = useState(null);
  const [lastRecognizedBadge, setLastRecognizedBadge] = useState(null);

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [vocabulary, setVocabulary] = useState({});
  const [dialect, setDialect] = useState('asl'); // 'asl' or 'isl'
  const [dialectDetails, setDialectDetails] = useState({
    name: 'American Sign Language',
    region: 'North America',
    cultural_context: 'Topic-Comment syntax with two-handed symmetry and specific non-manual facial markers.'
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [correctedPhrase, setCorrectedPhrase] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const handsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const candidateTrackerRef = useRef({ sign: null, count: 0, lastCommitted: null, cooldownUntil: 0 });

  // Load dialect vocabulary
  useEffect(() => {
    async function loadVocab() {
      try {
        const data = await getSignVocabulary(dialect);
        if (data && data.vocabulary) {
          setVocabulary(data.vocabulary);
          if (data.language_name) {
            setDialectDetails({
              name: data.language_name,
              region: data.region,
              cultural_context: data.cultural_context
            });
          }
        }
      } catch (err) {
        console.error("Vocabulary fetch failed:", err);
      }
    }
    loadVocab();
  }, [dialect]);

  // Handle sequence recognition
  const runRecognition = useCallback(async (signsToTranslate) => {
    if (!signsToTranslate || signsToTranslate.length === 0) return;
    try {
      const res = await analyzeSignSequence(signsToTranslate, [], dialect);
      setRecognitionResult(res);
      setCorrectedPhrase(res.translated_phrase);
      setFeedbackSent(false);

      if (ttsEnabled && res.two_way_response_speech) {
        speakText(res.two_way_response_speech);
      }
    } catch (err) {
      console.error("Sign recognition error:", err);
    }
  }, [dialect, ttsEnabled]);

  const addSign = useCallback((signKey) => {
    setSelectedSigns(prev => {
      const nextSigns = [...prev, signKey];
      runRecognition(nextSigns);
      return nextSigns;
    });
  }, [runRecognition]);

  // Frame processing loop
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !cameraActive) return;

    const video = videoRef.current;
    if (video.readyState >= 2 && handsRef.current) {
      try {
        await handsRef.current.send({ image: video });
      } catch (err) {
        // Ignored frame skip
      }
    }

    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(() => {
        processFrame();
      });
    }
  }, [cameraActive]);

  // MediaPipe Results Callback
  const handleMediaPipeResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];

      // Draw skeleton connections
      ctx.save();
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.lineWidth = 3;
      for (const [start, end] of HAND_CONNECTIONS) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.stroke();
        }
      }

      // Draw 21 joints
      for (let i = 0; i < landmarks.length; i++) {
        const pt = landmarks[i];
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, i === 0 ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) ? '#f59e0b' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Classify gesture
      const candidate = classifyHandGesture(landmarks, dialect);
      const now = Date.now();
      const tracker = candidateTrackerRef.current;

      if (candidate) {
        setHoldingSign(candidate.sign);

        if (tracker.sign === candidate.sign) {
          tracker.count += 1;
        } else {
          tracker.sign = candidate.sign;
          tracker.count = 1;
        }

        // Temporal steady-hold threshold (>= 6 consecutive frames, ~200-300ms hold)
        if (tracker.count >= 6 && now > tracker.cooldownUntil) {
          if (tracker.lastCommitted !== candidate.sign) {
            tracker.lastCommitted = candidate.sign;
            tracker.cooldownUntil = now + 1500; // 1.5s cooldown before repeating

            addSign(candidate.sign);
            setLastRecognizedBadge(candidate.sign);
            setTimeout(() => setLastRecognizedBadge(null), 2500);
          }
        }
      } else {
        setHoldingSign(null);
        tracker.sign = null;
        tracker.count = 0;
      }
    } else {
      setHandDetected(false);
      setHoldingSign(null);
      const tracker = candidateTrackerRef.current;
      tracker.sign = null;
      tracker.count = 0;
      tracker.lastCommitted = null;
    }
  }, [dialect, addSign]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setMediaPipeError(null);
    setCameraLoading(true);

    try {
      // 1. Request camera permission and getUserMedia stream
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported by your browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      // 2. Attach stream to <video> element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.warn("Video play error:", e));
        };
      }

      setCameraActive(true);
      setCameraLoading(false);

      // 3. Initialize MediaPipe Hands in parallel
      try {
        const HandsClass = await loadMediaPipeHands();
        const hands = new HandsClass({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(handleMediaPipeResults);
        await hands.initialize();

        handsRef.current = hands;
        setMediaPipeReady(true);
      } catch (mpErr) {
        console.warn("MediaPipe Hands initialization error:", mpErr);
        setMediaPipeError(mpErr.message || "Failed to load MediaPipe Hands WASM pipeline.");
        setMediaPipeReady(false);
      }

    } catch (err) {
      console.error("Camera acquisition failed:", err);
      setCameraLoading(false);
      setCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission denied. Please allow camera access in your browser address bar/settings to use live hand tracking.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No camera found on this device. Please connect a webcam or use the manual gesture sequence buttons below.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("Camera is currently in use by another application. Please close other camera tabs and try again.");
      } else {
        setCameraError(err.message || "Unable to access camera feed.");
      }
    }
  };

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setCameraActive(false);
    setCameraLoading(false);
    setHandDetected(false);
    setHoldingSign(null);
    setMediaPipeReady(false);
  }, []);

  // Frame processing starter effect
  useEffect(() => {
    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, processFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (handsRef.current) {
        try { handsRef.current.close(); } catch (e) { /* ignore */ }
      }
    };
  }, [stopCamera]);

  const handleDialectChange = (newDialect) => {
    if (newDialect === dialect) return;
    setDialect(newDialect);
    setSelectedSigns([]);
    setRecognitionResult(null);
    setHoldingSign(null);
    candidateTrackerRef.current = { sign: null, count: 0, lastCommitted: null, cooldownUntil: 0 };
  };

  const removeLastSign = () => {
    const nextSigns = selectedSigns.slice(0, -1);
    setSelectedSigns(nextSigns);
    if (nextSigns.length > 0) {
      runRecognition(nextSigns);
    } else {
      setRecognitionResult(null);
    }
  };

  const clearSigns = () => {
    setSelectedSigns([]);
    setRecognitionResult(null);
    setFeedbackOpen(false);
    setFeedbackSent(false);
    candidateTrackerRef.current = { sign: null, count: 0, lastCommitted: null, cooldownUntil: 0 };
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!recognitionResult) return;
    try {
      const res = await submitSignFeedback({
        recognized_signs: selectedSigns,
        suggested_phrase: recognitionResult.translated_phrase,
        corrected_phrase: correctedPhrase
      });
      setFeedbackSent(true);
      setFeedbackMsg(res.message);
      setTimeout(() => setFeedbackOpen(false), 2500);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title & Dialect Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Hand className="w-4 h-4" />
            <span>Sign Language Accessibility Interface</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign Language Communication
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Currently active: <span className="font-semibold text-slate-800">{dialectDetails.name}</span> ({dialectDetails.region}). Sequence assembler translates gestural strings into natural medical statements without conflating regional dialects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dialect Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => handleDialectChange('asl')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dialect === 'asl'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ASL (North America)
            </button>
            <button
              onClick={() => handleDialectChange('isl')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dialect === 'isl'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ISL (India & South Asia)
            </button>
          </div>

          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              ttsEnabled ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{ttsEnabled ? "Two-Way Audio On" : "Two-Way Audio Muted"}</span>
          </button>
        </div>
      </div>

      {/* Sensor & Dialect Notice Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Linguistic Grammar Note:</span> {dialectDetails.cultural_context}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between">
          <span className="font-medium text-slate-700">Sensor Tracking Status:</span>
          {cameraActive && mediaPipeReady && handDetected ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              MediaPipe Hand Mesh (21-Joint) Active
            </span>
          ) : cameraActive && mediaPipeReady ? (
            <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-semibold flex items-center gap-1.5 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Camera Active — Show your hand
            </span>
          ) : cameraActive && cameraLoading ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold flex items-center gap-1.5 border border-amber-200">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Initializing Hand Tracking...
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium flex items-center gap-1.5 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Sensor Standby (Interactive Touch / Manual Mode)
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Camera/Gesture Feed & Sequence Translation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Gesture Sequence Builder & Camera */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Live Camera & Gesture Pipeline</h3>
              <p className="text-xs text-slate-500">21 3D joint telemetry & real-time temporal sequence recognition</p>
            </div>
            <div className="flex items-center space-x-2">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-bold flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cameraLoading ? "Connecting..." : "Start Camera Preview"}</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-xl font-bold flex items-center space-x-1.5 transition-all"
                >
                  <span>Stop Preview</span>
                </button>
              )}
            </div>
          </div>

          {/* Camera Error / Warning Messages */}
          {cameraError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Camera Access Alert:</strong> {cameraError}
              </div>
            </div>
          )}

          {mediaPipeError && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Hand Tracking Warning:</strong> {mediaPipeError} Manual sequence builder remains fully available below.
              </div>
            </div>
          )}

          {/* Live Camera Video & Mesh Canvas Panel */}
          <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0 absolute'}`}
            />
            <canvas
              ref={canvasRef}
              className={`w-full h-full absolute inset-0 pointer-events-none transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {!cameraActive && (
              <div className="text-center p-6 space-y-3 z-10">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">Camera Inactive</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Click below to start live video preview and optical 21-joint MediaPipe hand tracking.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 flex items-center space-x-2 mx-auto transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{cameraLoading ? "Opening Camera..." : "Start Camera Preview"}</span>
                </button>
              </div>
            )}

            {cameraActive && (
              <>
                {/* Live Tracking Status Badge (top-left) */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-900/85 backdrop-blur border border-slate-700 text-xs font-medium flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${handDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span className="text-slate-200 font-mono text-[11px]">
                    {handDetected
                      ? `21-Joint Mesh: Tracking Hand`
                      : mediaPipeReady
                      ? 'Camera Active — Show your hand'
                      : 'Initializing Hand Tracking...'}
                  </span>
                </div>

                {/* Recognized Notification Badge (top-right) */}
                {lastRecognizedBadge && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center space-x-1.5 animate-pulse">
                    <Check className="w-3.5 h-3.5" />
                    <span>Added: {lastRecognizedBadge.toUpperCase()}</span>
                  </div>
                )}

                {/* Feedback prompt (bottom) */}
                <div className="absolute bottom-3 inset-x-3 text-center">
                  <span className="px-3.5 py-1 rounded-full bg-slate-900/85 backdrop-blur text-[11px] text-slate-300 font-medium border border-slate-700 inline-block shadow">
                    {handDetected 
                      ? (holdingSign ? `Holding "${holdingSign.toUpperCase()}" sign...` : 'Hold a gesture steady to commit it')
                      : 'Show your hand clearly within the camera frame'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Current Active Sequence Display */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[80px]">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-2">
              Active Gesture Sequence:
            </span>
            <div className="flex flex-wrap gap-2 items-center">
              {selectedSigns.length > 0 ? (
                selectedSigns.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    <span>{s.toUpperCase()}</span>
                    {idx < selectedSigns.length - 1 && <span className="ml-2 text-emerald-200">&rarr;</span>}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Perform signs in the camera or tap tiles below to assemble a medical statement.
                </span>
              )}
            </div>
          </div>

          {/* Sequence Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={removeLastSign}
              disabled={selectedSigns.length === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              Undo Last Sign
            </button>
            <button
              onClick={clearSigns}
              disabled={selectedSigns.length === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              Clear Sequence
            </button>
          </div>

          {/* Vocabulary Grid */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Supported {dialect.toUpperCase()} Distress Vocabulary:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Object.keys(vocabulary).length > 0 ? (
                Object.entries(vocabulary).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => addSign(key)}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all group"
                  >
                    <span className="block font-bold text-xs text-slate-900 group-hover:text-emerald-700 capitalize">
                      {key}
                    </span>
                    <span className="block text-[10px] text-slate-400 capitalize">
                      {item.category}
                    </span>
                  </button>
                ))
              ) : (
                ['pain', 'chest', 'severe', 'help', 'emergency', 'stomach', 'head', 'back', 'mild', 'doctor', 'yes', 'no'].map((signKey) => (
                  <button
                    key={signKey}
                    onClick={() => addSign(signKey)}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-xs font-bold capitalize text-slate-800 text-center transition-all"
                  >
                    {signKey}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Preset Sample Sequences */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">Preset Pain Phrases (One-Click Demo):</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const s = ['pain', 'chest', 'severe'];
                  setSelectedSigns(s);
                  runRecognition(s);
                }}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
              >
                [Pain] + [Chest] + [Severe]
              </button>
              <button
                onClick={() => {
                  const s = ['help', 'emergency'];
                  setSelectedSigns(s);
                  runRecognition(s);
                }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
              >
                [Help] + [Emergency]
              </button>
              <button
                onClick={() => {
                  const s = ['pain', 'stomach', 'mild'];
                  setSelectedSigns(s);
                  runRecognition(s);
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
              >
                [Pain] + [Stomach] + [Mild]
              </button>
            </div>
          </div>

        </div>

        {/* Right: Real-time Translation & Two-Way Feedback */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Translated Meaning & Two-Way Response</h3>
            <span className="text-xs font-mono text-slate-400">Two-Way Accessible UX</span>
          </div>

          {recognitionResult ? (
            <div className="space-y-6">
              
              {/* Translated Phrase Card */}
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Natural Language Translation:
                </span>
                <h4 className="text-2xl font-black text-slate-900">
                  "{recognitionResult.translated_phrase}"
                </h4>
                <div className="flex items-center justify-between text-xs text-emerald-800 pt-2 border-t border-emerald-200/60">
                  <span>Recognition Confidence: {Math.round(recognitionResult.confidence * 100)}%</span>
                  <button
                    onClick={() => speakText(recognitionResult.translated_phrase)}
                    className="flex items-center space-x-1 text-emerald-700 font-bold hover:underline"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play Audio</span>
                  </button>
                </div>
              </div>

              {/* Two-Way System Response Banner */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>PAINSENSE-AI Two-Way Response</span>
                </div>
                <p className="text-lg font-semibold leading-relaxed">
                  {recognitionResult.two_way_response_text}
                </p>

                {/* Yes / No Two-Way Quick Actions */}
                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      speakText("Contacting healthcare assistance.");
                      alert("Healthcare assistance notification initiated.");
                    }}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow"
                  >
                    [YES] Contact Doctor
                  </button>
                  <button
                    onClick={() => {
                      speakText("Response recorded as No. Continuing to monitor.");
                    }}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl transition-all"
                  >
                    [NO] Not Now
                  </button>
                </div>
              </div>

              {/* Correction Feedback Accordion */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Did the system understand you correctly?</span>
                  <button
                    onClick={() => setFeedbackOpen(!feedbackOpen)}
                    className="text-xs font-semibold text-sky-600 hover:underline flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{feedbackOpen ? "Close Correction" : "Correct Translation"}</span>
                  </button>
                </div>

                {feedbackOpen && (
                  <form onSubmit={handleFeedbackSubmit} className="pt-2 space-y-3 border-t border-slate-200">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      What did your signed sequence mean?
                    </label>
                    <input
                      type="text"
                      value={correctedPhrase}
                      onChange={(e) => setCorrectedPhrase(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                      placeholder="e.g., Severe upper chest tightening"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Correction for Model Retraining</span>
                    </button>
                  </form>
                )}

                {feedbackSent && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-medium">
                    {feedbackMsg}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <Hand className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No sign sequence selected.</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Assemble a sign sequence or pick a preset like [Pain] + [Chest] + [Severe] to see two-way communication.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
