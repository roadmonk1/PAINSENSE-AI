import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RefreshCw, Volume2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { analyzeVoice } from '../services/api';

export default function VoicePage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("I have severe lower-back pain since this morning, making it hard to sit.");
  const [result, setResult] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Web Audio API for visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 150)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.warn("Microphone access error:", err);
      alert("Microphone permission was not granted. You can use preset phrases or type directly.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleAnalyze = async (textToAnalyze = null) => {
    const text = textToAnalyze || transcript;
    setAnalyzing(true);
    try {
      const res = await analyzeVoice(text, {
        pitch_jitter: 0.35,
        energy_fluctuation: 0.40
      });
      setResult(res);
    } catch (err) {
      console.error("Voice analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSample = (sampleText) => {
    setTranscript(sampleText);
    handleAnalyze(sampleText);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Mic className="w-4 h-4" />
          <span>Speech Recognition & Acoustic Analysis</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Voice Assessment Module
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-3xl">
          Extracts clinical indicators (location, duration, severity, character) from spoken words alongside acoustic vocal strain.
        </p>
      </div>

      {/* Grid: Audio Capture & Extracted Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Recording Console */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Audio Capture</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
              Prompt: "Tell me what you are feeling"
            </span>
          </div>

          {/* Visual Waveform Meter */}
          <div className="h-32 bg-slate-900 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
            {recording ? (
              <div className="flex items-center space-x-1.5 h-16">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-indigo-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(8, Math.min(64, (audioLevel * ((i % 5) + 1) * 0.4)))}px`
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Mic className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Microphone idle. Click 'Record' to speak.</p>
              </div>
            )}

            {recording && (
              <div className="absolute top-3 right-3 flex items-center space-x-1.5 text-xs text-red-400 font-mono animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>REC LIVE</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-2 transition-all animate-pulse"
              >
                <Square className="w-4 h-4" />
                <span>Stop Recording</span>
              </button>
            )}

            {audioUrl && (
              <audio controls src={audioUrl} className="h-9 self-center" />
            )}
          </div>

          {/* Speech Transcript Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex justify-between">
              <span>Spoken Transcript:</span>
              <span className="text-[11px] text-slate-400 font-normal">Edit or type directly</span>
            </label>
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-slate-50"
              placeholder="e.g., I have sharp stomach pain that started two hours ago..."
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={analyzing || !transcript.trim()}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Extracting Clinical Entities...' : 'Analyze Speech & Acoustic Strain'}</span>
          </button>

          {/* Deterministic Voice Samples */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">Test Spoken Presets:</span>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => loadSample("I have severe lower-back pain since this morning, difficult to walk.")}
                className="text-left p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-xs text-slate-700 transition-colors"
              >
                "I have severe lower-back pain since this morning, difficult to walk."
              </button>
              <button
                onClick={() => loadSample("Sharp chest pressure radiating down my left arm for the past 20 minutes.")}
                className="text-left p-2.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-xs text-red-800 transition-colors"
              >
                "Sharp chest pressure radiating down my left arm for the past 20 minutes."
              </button>
              <button
                onClick={() => loadSample("Mild throbbing headache since yesterday evening.")}
                className="text-left p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-xs text-slate-700 transition-colors"
              >
                "Mild throbbing headache since yesterday evening."
              </button>
            </div>
          </div>
        </div>

        {/* Right: Extracted Structured Clinical Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Structured Clinical Extraction</h3>
            <span className="text-xs font-mono text-slate-400">NLP Entity Model</span>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Identified Location</span>
                  <span className="font-bold text-slate-900 text-sm">{result.extracted_location}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Identified Severity</span>
                  <span className="font-bold text-slate-900 text-sm">{result.extracted_severity}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Reported Duration</span>
                  <span className="font-bold text-slate-900 text-sm">{result.extracted_duration}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Pain Character / Type</span>
                  <span className="font-bold text-slate-900 text-sm">{result.extracted_pain_type}</span>
                </div>
              </div>

              {/* Acoustic Strain Card */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-2">
                <div className="flex justify-between font-bold text-indigo-900">
                  <span>Acoustic Vocal Strain Index</span>
                  <span>{result.acoustic_strain_score} / 1.0</span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all" 
                    style={{ width: `${result.acoustic_strain_score * 100}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[11px] text-indigo-700 pt-1">
                  <span>Tremor Detected: {result.vocal_tremor_detected ? 'Yes (Elevated)' : 'No (Normal)'}</span>
                  <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                </div>
              </div>

              {/* Accompanying Symptoms */}
              {result.extracted_symptoms.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">Extracted Associated Symptoms:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.extracted_symptoms.map((s, idx) => (
                      <span key={idx} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 italic">
                {result.disclaimer}
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <p>Record audio or select a preset to generate structured clinical extraction.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
