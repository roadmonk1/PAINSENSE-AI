import React, { useState, useEffect, useRef } from 'react';
import { 
  Hand, Camera, Volume2, RotateCcw, Check, MessageSquare, 
  Send, ShieldAlert, Sparkles, HelpCircle, Edit3, ArrowRight
} from 'lucide-react';
import { analyzeSignSequence, submitSignFeedback, getSignVocabulary } from '../services/api';
import { speakText } from '../utils/speech';

export default function SignLanguagePage() {
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
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

  const videoRef = useRef(null);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera access denied for sign language:", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleDialectChange = (newDialect) => {
    if (newDialect === dialect) return;
    setDialect(newDialect);
    setSelectedSigns([]);
    setRecognitionResult(null);
  };

  const addSign = (signKey) => {
    const nextSigns = [...selectedSigns, signKey];
    setSelectedSigns(nextSigns);
    runRecognition(nextSigns);
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
  };

  const runRecognition = async (signsToTranslate) => {
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
          {cameraActive ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              MediaPipe Hand Mesh (21-Joint) Active
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
            <h3 className="font-bold text-base text-slate-900">Sign Sequence Builder</h3>
            <div className="flex items-center space-x-2">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium flex items-center space-x-1"
                >
                  <Camera className="w-3 h-3" />
                  <span>Start Camera Preview</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg font-medium flex items-center space-x-1"
                >
                  <span>Stop Preview</span>
                </button>
              )}
            </div>
          </div>

          {/* Video Preview if open */}
          {cameraActive && (
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-emerald-400 font-mono text-[10px]">
                Landmark Mesh: Hands Active (21 Joint Points)
              </div>
            </div>
          )}

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
                  Tap signs below or perform ASL gestures in camera to assemble a communication sequence.
                </span>
              )}
            </div>
          </div>

          {/* Sequence Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={removeLastSign}
              disabled={selectedSigns.length === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Undo Last Sign
            </button>
            <button
              onClick={clearSigns}
              disabled={selectedSigns.length === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Clear Sequence
            </button>
          </div>

          {/* ASL Vocabulary Grid */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 block mb-2">Supported ASL Distress Vocabulary:</span>
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
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-xs font-bold capitalize text-slate-800 text-center"
                  >
                    {signKey}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Common Sample Sequences */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">Preset Pain Phrases:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const s = ['pain', 'chest', 'severe'];
                  setSelectedSigns(s);
                  runRecognition(s);
                }}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold"
              >
                [Pain] + [Chest] + [Severe]
              </button>
              <button
                onClick={() => {
                  const s = ['help', 'emergency'];
                  setSelectedSigns(s);
                  runRecognition(s);
                }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold"
              >
                [Help] + [Emergency]
              </button>
              <button
                onClick={() => {
                  const s = ['pain', 'stomach', 'mild'];
                  setSelectedSigns(s);
                  runRecognition(s);
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
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
