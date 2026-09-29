import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Camera, Mic, Hand, HeartPulse, ShieldCheck, 
  ArrowRight, CheckCircle2, UserCheck, Stethoscope, Clock, Lock, Sparkles
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full text-xs font-semibold text-sky-700 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accessibility-First Multimodal AI Healthcare System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            PAINSENSE-AI
          </h1>
          <p className="mt-3 text-2xl sm:text-3xl font-semibold text-sky-600">
            Making pain easier to communicate.
          </p>

          <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            PAINSENSE-AI combines camera-based indicators, voice, speech, sign language, and self-reported symptoms to help individuals express possible discomfort and access timely, appropriate healthcare assistance.
          </p>

          {/* Quick CTA Actions */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/assess"
              className="px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base shadow-md transition-all flex items-center space-x-2"
            >
              <span>Start Multimodal Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-base border border-slate-300 transition-all"
            >
              Explore Dashboard Demo
            </Link>
            <Link
              to="/sign-language"
              className="px-6 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-base border border-emerald-300 transition-all flex items-center space-x-2"
            >
              <Hand className="w-4 h-4 text-emerald-600" />
              <span>Sign Language Mode</span>
            </Link>
          </div>

          {/* Core Philosophy Banner */}
          <div className="mt-14 py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl inline-flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-bold text-slate-600">
            <span className="text-sky-600">SEE</span>
            <span>&rarr;</span>
            <span className="text-indigo-600">HEAR</span>
            <span>&rarr;</span>
            <span className="text-purple-600">UNDERSTAND</span>
            <span>&rarr;</span>
            <span className="text-teal-600">COMMUNICATE</span>
            <span>&rarr;</span>
            <span className="text-emerald-600">ASSIST</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How PAINSENSE-AI Works</h2>
          <p className="mt-2 text-slate-600">
            Pain is profoundly subjective and complex. Rather than relying on a single fallible camera classifier, our engine fuses multiple communication channels to preserve patient autonomy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">1. Visual Scan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Extracts subtle facial tension (brow lowering, orbital tightening) and somatic guarding behaviors without assuming facial expression equals definite pain.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">2. Voice & Speech</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Listens to natural spoken complaints to extract location, duration, and severity, while acoustic analysis assesses vocal perturbation and strain.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Hand className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">3. Sign Language</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Provides dedicated ASL distress communication recognizing sequences like "Pain + Chest + Severe" and responds with accessible speech and text.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">4. Multimodal Fusion</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Synthesizes all signals into transparent evidence. Explicit patient reports take precedence over passive vision models, preventing misrepresentation.
            </p>
          </div>
        </div>
      </section>

      {/* Multimodal Core Differentiator Showcase */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-md mb-3">
                Core Differentiator
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                Never Dismissing What the Patient Tells Us
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Standard vision-based pain detectors fail when patients are stoic, non-expressive, or paralyzed. If a camera reads low facial tension but the patient signs or reports:
              </p>
              
              <div className="my-6 p-4 bg-white rounded-xl border border-slate-300 shadow-inner space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-bold text-slate-500">Camera Observation:</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-xs">Low Grimace (0.12) / Uncertain</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-bold text-red-600">Patient Signed/Reported:</span>
                  <span className="bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded">"Severe chest pain"</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-sm font-bold text-emerald-700">
                  <span>PAINSENSE Fusion Output:</span>
                  <span>Urgent Triage & Severe Pain Preserved</span>
                </div>
              </div>

              <p className="text-slate-600 text-sm">
                Our Multimodal Fusion Engine tracks explicit divergence uncertainty, ensuring patients are always heard and never silenced by machine learning heuristics.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Multi-Channel Evidence Breakdown</span>
                <span className="text-xs font-normal text-slate-400">Sample Assessment #1042</span>
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Facial Action Units (PSPI AU4/AU7)</span>
                    <span className="text-sky-600">Active</span>
                  </div>
                  <p className="text-slate-500">Subtle eyebrow furrowing detected (AU4: 0.32)</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Speech & Audio Transcription</span>
                    <span className="text-indigo-600">Extracted</span>
                  </div>
                  <p className="text-slate-500">"Sharp stabbing sensation in lower lumbar when bending"</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Sign Language ASL Sequence</span>
                    <span className="text-emerald-600">Translated</span>
                  </div>
                  <p className="text-slate-500">Gesture sequence: [Pain] + [Back] + [Severe]</p>
                </div>

                <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                  <div className="flex justify-between font-bold text-sky-900 mb-1">
                    <span>Patient Subjective Ground Truth</span>
                    <span className="text-sky-700">8/10 Severity</span>
                  </div>
                  <p className="text-sky-800">Confirmed sharp pain, duration: past 4 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Physician Handover */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Safety & Red Flags</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Autonomous red flag detection for critical conditions like acute radiating chest pain, severe dyspnea, and sudden neurological changes. Dispatches instant caregiver alerts.
              </p>
            </div>
            <Link to="/assess" className="mt-6 text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
              <span>View Safety Workflow</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Doctor Handover Summary</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instantly converts chaotic symptoms and non-verbal signs into concise, standardized clinical summaries for physicians and triage nurses.
              </p>
            </div>
            <Link to="/doctor" className="mt-6 text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
              <span>View Clinician Portal</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Privacy & Patient Rights</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Local-only processing controls, granular camera/mic permissions, and instant data deletion tools ensuring strict adherence to health privacy standards.
              </p>
            </div>
            <Link to="/settings" className="mt-6 text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
              <span>Review Privacy Controls</span>
              <span>&rarr;</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Ready to Begin Section */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to communicate with PAINSENSE-AI?
          </h2>
          <p className="mt-4 text-slate-300 text-base">
            Accessible across screen readers, high contrast, sign language, and voice. Experience the complete end-to-end multimodal workflow now.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/assess"
              className="px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg transition-all"
            >
              Start Assessment Now
            </Link>
            <Link
              to="/limitations"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700"
            >
              Read Medical & AI Boundaries
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
