import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Camera, Mic, Hand, AlertTriangle, ShieldCheck, 
  Send, RefreshCw, CheckCircle2, PhoneCall, HeartHandshake, Stethoscope,
  FileCode, X, Download, HelpCircle, ShieldAlert
} from 'lucide-react';
import { performFusionAndSave, getAssessmentFhir } from '../services/api';
import { speakText } from '../utils/speech';

export default function AssessPainPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('self_report'); // self_report, camera, voice, sign, fusion
  const [fhirModalOpen, setFhirModalOpen] = useState(false);
  const [fhirData, setFhirData] = useState(null);
  const [loadingFhir, setLoadingFhir] = useState(false);

  // Self report state
  const [selfReport, setSelfReport] = useState({
    pain_location: 'Lower Back',
    severity_score: 6,
    pain_type: 'Sharp',
    duration: 'Since morning',
    onset: 'Gradual',
    additional_symptoms: ['Mild stiffness'],
    free_text: 'Pain worsens when bending or lifting objects.'
  });

  // Camera state
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraFeatures, setCameraFeatures] = useState({
    brow_furrowing: 0.45,
    orbital_tightening: 0.35,
    mouth_tension: 0.30,
    postural_guarding: 0.50,
    shoulder_tension: 0.40,
    movement_asymmetry: 0.15
  });

  // Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("I have lower back pain since this morning.");

  // Sign state
  const [signEnabled, setSignEnabled] = useState(false);
  const [selectedSigns, setSelectedSigns] = useState(['pain', 'back', 'severe']);

  // Fusion result state
  const [fusing, setFusing] = useState(false);
  const [fusionResult, setFusionResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleSymptom = (sym) => {
    setSelfReport(prev => {
      const exists = prev.additional_symptoms.includes(sym);
      const nextSymptoms = exists 
        ? prev.additional_symptoms.filter(s => s !== sym)
        : [...prev.additional_symptoms, sym];
      return { ...prev, additional_symptoms: nextSymptoms };
    });
  };

  const runMultimodalFusion = async () => {
    setFusing(true);
    setSavedSuccess(false);

    try {
      const payload = {
        self_report: selfReport,
        notes: selfReport.free_text
      };

      if (cameraEnabled) {
        payload.facial_result = {
          brow_furrowing: cameraFeatures.brow_furrowing,
          orbital_tightening: cameraFeatures.orbital_tightening,
          mouth_tension: cameraFeatures.mouth_tension,
          grimace_score: (cameraFeatures.brow_furrowing + cameraFeatures.orbital_tightening) / 2,
          tension_level: cameraFeatures.brow_furrowing > 0.5 ? 'Moderate' : 'Low',
          confidence: 0.82,
          observable_indicators: [
            cameraFeatures.brow_furrowing > 0.4 ? 'Brow lowering detected' : 'Neutral brow',
            cameraFeatures.orbital_tightening > 0.3 ? 'Orbital tightening observed' : 'Normal eye aperture'
          ]
        };
        payload.body_result = {
          postural_guarding: cameraFeatures.postural_guarding,
          shoulder_tension: cameraFeatures.shoulder_tension,
          movement_asymmetry: cameraFeatures.movement_asymmetry,
          protective_posture_detected: cameraFeatures.postural_guarding > 0.4,
          confidence: 0.78,
          observable_indicators: [
            cameraFeatures.postural_guarding > 0.4 ? 'Protective trunk guarding detected' : 'Neutral posture'
          ]
        };
      }

      if (voiceEnabled) {
        payload.voice_result = {
          transcript: voiceTranscript,
          extracted_location: selfReport.pain_location,
          extracted_severity: `${selfReport.severity_score}/10`,
          extracted_duration: selfReport.duration,
          extracted_pain_type: selfReport.pain_type,
          extracted_symptoms: selfReport.additional_symptoms,
          acoustic_strain_score: 0.42,
          vocal_tremor_detected: false,
          confidence: 0.85
        };
      }

      if (signEnabled && selectedSigns.length > 0) {
        payload.sign_result = {
          recognized_signs: selectedSigns,
          confidence: 0.88,
          translated_phrase: `${selectedSigns.map(s => s.toUpperCase()).join(' ')}`,
          two_way_response_text: `Sign sequence recorded.`,
          two_way_response_speech: `Sign sequence recorded.`
        };
      }

      const res = await performFusionAndSave(payload);
      setFusionResult(res);
      setSavedSuccess(true);
      setActiveTab('fusion');

      // Accessible speech announcement
      speakText(`Assessment processed. Perceived severity: ${res.severity}. ${res.recommended_next_step}`);
    } catch (err) {
      console.error("Fusion error:", err);
      alert("Failed to process multimodal assessment. Please verify backend connection.");
    } finally {
      setFusing(false);
    }
  };

  const handleViewFhir = async () => {
    if (!fusionResult || !fusionResult.assessment_id) return;
    setLoadingFhir(true);
    try {
      const bundle = await getAssessmentFhir(fusionResult.assessment_id);
      setFhirData(bundle);
      setFhirModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch FHIR bundle:", err);
    } finally {
      setLoadingFhir(false);
    }
  };

  const downloadFhirJson = () => {
    if (!fhirData) return;
    const blob = new Blob([JSON.stringify(fhirData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painsense-fhir-assessment-${fusionResult?.assessment_id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Integrated Multimodal Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Assess Pain & Discomfort
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Synthesizes self-reported symptoms with visual, speech, and sign-language telemetry.
          </p>
        </div>

        <button
          onClick={runMultimodalFusion}
          disabled={fusing}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${fusing ? 'animate-spin' : ''}`} />
          <span>{fusing ? 'Fusing Modalities...' : 'Run Multimodal Fusion'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        {[
          { id: 'self_report', label: '1. Self-Report (Patient Ground Truth)', icon: Activity },
          { id: 'camera', label: '2. Optical & Posture Scan', icon: Camera },
          { id: 'voice', label: '3. Voice Input', icon: Mic },
          { id: 'sign', label: '4. Sign Language', icon: Hand },
          { id: 'fusion', label: '5. Fusion Synthesis & Triage', icon: ShieldCheck, highlight: true }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                active 
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50' 
                  : tab.highlight
                  ? 'border-transparent text-indigo-600 hover:text-indigo-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SELF-REPORT */}
      {activeTab === 'self_report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Direct Patient Pain Report (Subjective Ground Truth)</h3>
            <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-semibold">Priority Channel (70% Weight)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Location Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Pain Location:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Head', 'Chest', 'Stomach / Abdomen', 'Lower Back', 'Upper Back', 'Neck', 'Shoulder', 'Knee', 'Arm / Wrist'].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setSelfReport({ ...selfReport, pain_location: loc })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      selfReport.pain_location === loc 
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity 0-10 Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Pain Severity (0 - 10 Scale):</label>
                <span className={`text-xl font-black ${
                  selfReport.severity_score >= 8 ? 'text-red-600' :
                  selfReport.severity_score >= 5 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {selfReport.severity_score} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={selfReport.severity_score}
                onChange={(e) => setSelfReport({ ...selfReport, severity_score: parseInt(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                <span>0 (No Pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Unbearable)</span>
              </div>
            </div>

            {/* Pain Character / Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Character / Type of Pain:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Sharp', 'Dull', 'Burning', 'Pressure', 'Throbbing', 'Cramping', 'Stabbing', 'Aching'].map(pt => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setSelfReport({ ...selfReport, pain_type: pt })}
                    className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                      selfReport.pain_type === pt 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration & Onset */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Duration:</label>
                <select
                  value={selfReport.duration}
                  onChange={(e) => setSelfReport({ ...selfReport, duration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  <option>Less than 1 hour</option>
                  <option>1 to 4 hours</option>
                  <option>Since morning</option>
                  <option>Past 24 hours</option>
                  <option>More than 3 days</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Onset:</label>
                <select
                  value={selfReport.onset}
                  onChange={(e) => setSelfReport({ ...selfReport, onset: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  <option>Sudden / Acute</option>
                  <option>Gradual</option>
                  <option>Intermittent</option>
                </select>
              </div>
            </div>

          </div>

          {/* Accompanying Symptoms */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Accompanying Symptoms:</label>
            <div className="flex flex-wrap gap-2">
              {['Shortness of breath', 'Nausea', 'Dizziness', 'Radiating pain', 'Fever', 'Numbness', 'Stiffness'].map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    selfReport.additional_symptoms.includes(sym)
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Free-text Description / Notes:</label>
            <textarea
              rows={2}
              value={selfReport.free_text}
              onChange={(e) => setSelfReport({ ...selfReport, free_text: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
              placeholder="Provide any additional detail..."
            />
          </div>
        </div>
      )}

      {/* TAB 2: CAMERA SETTINGS */}
      {activeTab === 'camera' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Optical Telemetry & Action Units (AU4/AU7)</h3>
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={cameraEnabled}
                onChange={(e) => setCameraEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-600"
              />
              <span>Include Camera Telemetry in Fusion</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">AU4: Brow Furrowing (Corrugator)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cameraFeatures.brow_furrowing}
                onChange={(e) => setCameraFeatures({ ...cameraFeatures, brow_furrowing: parseFloat(e.target.value) })}
                className="w-full accent-sky-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Relaxed (0.0)</span>
                <span>{cameraFeatures.brow_furrowing}</span>
                <span>Intense (1.0)</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">AU6/7: Orbital Tightening (Orbicularis)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cameraFeatures.orbital_tightening}
                onChange={(e) => setCameraFeatures({ ...cameraFeatures, orbital_tightening: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Relaxed (0.0)</span>
                <span>{cameraFeatures.orbital_tightening}</span>
                <span>Tightened (1.0)</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Postural Guarding / Flexion</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cameraFeatures.postural_guarding}
                onChange={(e) => setCameraFeatures({ ...cameraFeatures, postural_guarding: parseFloat(e.target.value) })}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Neutral (0.0)</span>
                <span>{cameraFeatures.postural_guarding}</span>
                <span>Protective Guarding (1.0)</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Shoulder Elevation / Tension</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cameraFeatures.shoulder_tension}
                onChange={(e) => setCameraFeatures({ ...cameraFeatures, shoulder_tension: parseFloat(e.target.value) })}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Neutral (0.0)</span>
                <span>{cameraFeatures.shoulder_tension}</span>
                <span>High Elevation (1.0)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VOICE SETTINGS */}
      {activeTab === 'voice' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Voice & Speech Telemetry</h3>
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              <span>Include Voice Channel in Fusion</span>
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">Voice Statement Transcript:</label>
            <input
              type="text"
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 4: SIGN LANGUAGE SETTINGS */}
      {activeTab === 'sign' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Sign Language Sequence</h3>
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={signEnabled}
                onChange={(e) => setSignEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>Include Sign Sequence in Fusion</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {['pain', 'chest', 'back', 'stomach', 'head', 'severe', 'mild', 'help', 'emergency'].map(s => {
              const active = selectedSigns.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (active) setSelectedSigns(selectedSigns.filter(item => item !== s));
                    else setSelectedSigns([...selectedSigns, s]);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                    active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: MULTIMODAL FUSION SYNTHESIS */}
      {activeTab === 'fusion' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {fusionResult ? (
            <div className="space-y-6">
              
              {/* Header Triage Status */}
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                fusionResult.triage_level === 'emergency' 
                  ? 'bg-red-50 border-red-200 text-red-900' 
                  : fusionResult.triage_level === 'urgent'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/70 border border-current">
                      SYSTEM RECOMMENDATION
                    </span>
                    <span className="text-xs font-semibold">Priority Triage</span>
                  </div>
                  <h3 className="text-2xl font-black capitalize">
                    {fusionResult.triage_level} Priority ({fusionResult.severity.toUpperCase()} Discomfort)
                  </h3>
                  <p className="text-xs mt-1.5 font-medium max-w-xl opacity-90">
                    {fusionResult.recommended_next_step}
                  </p>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-current/20">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] block font-bold uppercase tracking-wider">Uncertainty</span>
                    <span className="text-xl font-black">{Math.round(fusionResult.uncertainty * 100)}%</span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-[10px] block opacity-80">Model Confidence: {Math.round(fusionResult.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Strict Clinical Separation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Patient Ground Truth (Subjective Report) */}
                <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 bg-sky-200 text-sky-900 rounded text-[10px] font-black tracking-wider uppercase">
                        USER REPORT
                      </span>
                      <span className="font-bold text-xs text-sky-900">Direct Subjective Input</span>
                    </div>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                      Ground Truth
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-sky-900">
                    {fusionResult.reported_symptoms && fusionResult.reported_symptoms.length > 0 ? (
                      fusionResult.reported_symptoms.map((s, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="font-bold text-sky-600 mt-0.5">&bull;</span>
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">No direct verbal or written report submitted.</li>
                    )}
                  </ul>
                </div>

                {/* 2. AI Observations (Objective Telemetry) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-black tracking-wider uppercase">
                        AI OBSERVATION
                      </span>
                      <span className="font-bold text-xs text-slate-800">Supportive Telemetry</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      Non-Diagnostic
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {fusionResult.observed_indicators && fusionResult.observed_indicators.length > 0 ? (
                      fusionResult.observed_indicators.map((ind, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="font-bold text-slate-400 mt-0.5">&bull;</span>
                          <span>{ind}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">No optical or acoustic features detected.</li>
                    )}
                  </ul>
                </div>

              </div>

              {/* Explainable AI (XAI) Synthesis Panel */}
              {fusionResult.explanation && (
                <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-sm text-slate-900">Explainable AI: Why did PAINSENSE-AI produce this result?</h4>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-indigo-700">
                      Evidential Reasoning Engine
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100">
                    {fusionResult.explanation.why_this_result || fusionResult.summary_text}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Primary Evidence */}
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider mb-1">
                        Primary Ground Truth
                      </span>
                      <ul className="space-y-1 text-slate-600 text-[11px]">
                        {fusionResult.explanation.primary_evidence?.map((item, idx) => (
                          <li key={idx} className="leading-snug">&bull; {item}</li>
                        )) || <li className="italic text-slate-400">None</li>}
                      </ul>
                    </div>

                    {/* Supporting Evidence */}
                    <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
                      <span className="font-bold text-sky-800 block text-[11px] uppercase tracking-wider mb-1">
                        Supporting Telemetry
                      </span>
                      <ul className="space-y-1 text-slate-600 text-[11px]">
                        {fusionResult.explanation.supporting_evidence?.map((item, idx) => (
                          <li key={idx} className="leading-snug">&bull; {item}</li>
                        )) || <li className="italic text-slate-400">None</li>}
                      </ul>
                    </div>

                    {/* Conflicting Evidence */}
                    <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-2xs">
                      <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider mb-1">
                        Conflicting Markers
                      </span>
                      <ul className="space-y-1 text-slate-600 text-[11px]">
                        {fusionResult.explanation.conflicting_evidence?.length > 0 ? (
                          fusionResult.explanation.conflicting_evidence.map((item, idx) => (
                            <li key={idx} className="leading-snug">&bull; {item}</li>
                          ))
                        ) : (
                          <li className="text-slate-400 italic">No conflicting cues</li>
                        )}
                      </ul>
                    </div>

                    {/* Missing Evidence */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider mb-1">
                        Unchecked Channels
                      </span>
                      <ul className="space-y-1 text-slate-500 text-[11px]">
                        {fusionResult.explanation.missing_evidence?.length > 0 ? (
                          fusionResult.explanation.missing_evidence.map((item, idx) => (
                            <li key={idx} className="leading-snug">&bull; {item}</li>
                          ))
                        ) : (
                          <li className="text-emerald-600 font-semibold">All channels active</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety Assessment Audit Trail */}
              {fusionResult.safety_audit && fusionResult.safety_audit.triggered_rules?.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-red-200">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span className="font-bold text-xs text-red-900">Safety Flag Audit Trail</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-red-200 text-red-900 px-2 py-0.5 rounded font-bold">
                      Rule Action: {fusionResult.safety_audit.action_taken}
                    </span>
                  </div>
                  <div className="text-xs text-red-800 space-y-1">
                    <p className="font-semibold">Triggered Safety Rules:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fusionResult.safety_audit.triggered_rules.map((rule, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-100 rounded text-[11px] font-mono border border-red-200">
                          {rule}
                        </span>
                      ))}
                    </div>
                    <p className="pt-1 text-[11px] font-medium">
                      Recommendation: {fusionResult.safety_audit.recommended_action}
                    </p>
                  </div>
                </div>
              )}

              {/* Modalities Used */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">Fused Modality Channels:</span>
                <div className="flex flex-wrap gap-2">
                  {fusionResult.communication_methods.map((method, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200">
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/timeline')}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>View in Timeline</span>
                </button>

                <button
                  onClick={() => navigate('/doctor')}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Handover to Doctor Console</span>
                </button>

                <button
                  onClick={() => navigate('/caregiver')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Notify Caregiver</span>
                </button>

                <button
                  onClick={handleViewFhir}
                  disabled={loadingFhir}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl flex items-center space-x-2 ml-auto"
                >
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>{loadingFhir ? 'Loading FHIR...' : 'View HL7 FHIR R4 Bundle'}</span>
                </button>
              </div>

              {/* Mandatory Medical Disclaimer */}
              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
                {fusionResult.disclaimer}
              </p>

            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Ready to run Multimodal Fusion.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Configure your inputs in the tabs above and click 'Run Multimodal Fusion' to synthesize observations and triage recommendations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* HL7 FHIR R4 Modal Dialog */}
      {fhirModalOpen && fhirData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">HL7 FHIR R4 Collection Bundle</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Resource Type: Bundle / type: collection</span>
                </div>
              </div>
              <button
                onClick={() => setFhirModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-900/95 text-emerald-400 rounded-none flex-1">
              <pre className="whitespace-pre-wrap">{JSON.stringify(fhirData, null, 2)}</pre>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <span className="text-xs text-slate-500">
                Standards: LOINC 72514-3 (Pain score), LOINC 11450-4, HL7 FHIR R4
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadFhirJson}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={() => setFhirModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

