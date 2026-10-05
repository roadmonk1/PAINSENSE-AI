import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Camera, Mic, Hand, HeartPulse, ShieldCheck, 
  ArrowRight, CheckCircle2, UserCheck, Stethoscope, Clock, Lock, Sparkles,
  ClipboardList, MapPin, LayoutDashboard, Info
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      
      {/* TYSIC Hero Section */}
      <section className="bg-white border-b border-slate-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full text-xs font-semibold text-sky-700 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tata Young Social Innovator Challenge 2026 — Health Sector</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            PAINSENSE-AI
          </h1>
          <p className="mt-3 text-2xl sm:text-3xl font-semibold text-sky-600">
            Making post-discharge care communication more accessible for rural families.
          </p>

          <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            PainSense AI helps patients communicate pain and symptom changes through accessible multimodal inputs
            and converts them into structured information that caregivers and healthcare professionals can review remotely —
            without requiring long-distance hospital travel.
          </p>

          {/* Primary CTA */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/post-discharge"
              className="px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base shadow-md transition-all flex items-center space-x-2"
            >
              <ClipboardList className="w-5 h-5" />
              <span>Post-Discharge Care</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/healthcare"
              className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-base border border-slate-300 transition-all flex items-center space-x-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Healthcare Dashboard</span>
            </Link>
            <Link
              to="/assess"
              className="px-6 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-base border border-emerald-300 transition-all"
            >
              Multimodal Assessment
            </Link>
          </div>

          {/* TYSIC Problem Statement */}
          <div className="mt-12 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left max-w-3xl mx-auto">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">TYSIC Problem Statement</p>
                <p className="text-sm text-slate-700 font-medium italic">
                  "How can rural families manage post-discharge care when hospital follow-ups require long travel?"
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  PainSense AI addresses this by enabling patients to communicate symptoms remotely through text, voice, camera, and sign language — with structured reports that healthcare professionals can review from anywhere.
                </p>
              </div>
            </div>
          </div>

          {/* Demo notice */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-amber-700">
            <Info className="w-4 h-4" />
            <span>Demo / Simulated Data is used throughout this prototype. It does not represent real patients or clinical outcomes.</span>
          </div>
        </div>
      </section>

      {/* Patient Flow Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How It Works</h2>
          <p className="mt-2 text-slate-600">
            A simple, accessible flow designed for rural patients, elderly users, and caregivers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Communicate Symptoms', desc: 'Patient reports pain and changes since discharge — in text, voice, sign language, or via caregiver.', icon: ClipboardList, color: 'sky' },
            { step: '2', title: 'Accessible Input', desc: 'Multiple communication channels ensure the system works for users with different abilities and literacy levels.', icon: Activity, color: 'indigo' },
            { step: '3', title: 'Structured Case Report', desc: 'PainSense AI organises the information into a clear, structured report. The patient\'s own words are always primary.', icon: FileTextIcon, color: 'emerald' },
            { step: '4', title: 'Remote Review', desc: 'Healthcare professionals review the report remotely — no travel required for routine follow-up communication.', icon: Stethoscope, color: 'purple' },
          ].map(({ step, title, desc, icon: Icon, color }) => (
            <div key={step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className={`w-12 h-12 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center mb-4 font-black text-xl`}>
                {step}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Multimodal Inputs Section */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-md mb-3">
                Accessibility First
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                Multiple Ways to Communicate — One System
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Not everyone can type. Not everyone can speak. PainSense AI accepts pain communication through multiple channels and combines them into a single structured report.
              </p>
              
              <div className="mt-6 space-y-3">
                {[
                  { icon: ClipboardList, color: 'sky', label: 'Self-Report (Primary)', desc: 'Text form — the most important input. Patient\'s own words.' },
                  { icon: Mic, color: 'indigo', label: 'Voice Input', desc: 'Spoken description of symptoms.' },
                  { icon: Camera, color: 'emerald', label: 'Camera / Visual', desc: 'Optional supporting facial and posture observation.' },
                  { icon: Hand, color: 'purple', label: 'Sign Language', desc: 'ASL and ISL for users with speech/hearing differences.' },
                ].map(({ icon: Icon, color, label, desc }) => (
                  <div key={label} className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-slate-200">
                    <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-lg flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{label}</span>
                      <span className="text-xs text-slate-500">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-700">
                <strong className="text-sky-800">Key Principle:</strong> Self-report is always primary. AI observations are supportive context only and never override what the patient says.
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Sample Case Summary</span>
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">DEMO DATA</span>
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                  <div className="flex justify-between font-semibold text-sky-900 mb-1">
                    <span>Case PS-1001 — Patient-Reported (Primary)</span>
                    <span className="text-sky-600">7/10</span>
                  </div>
                  <p className="text-slate-600">Lower back pain, increasing since discharge. "Pain feels worse than yesterday. Difficulty walking."</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>AI-Assisted Observations (Supportive Only)</span>
                    <span className="text-slate-500">Non-Diagnostic</span>
                  </div>
                  <p className="text-slate-500">Mild postural guarding noted. Voice note indicated reduced mobility confidence.</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="font-semibold text-amber-800 mb-1">Status for Healthcare Review</div>
                  <p className="text-amber-700">Requires professional review — Increasing pain trend</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Professional Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Remote Case Review</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Healthcare professionals review structured patient reports remotely, without requiring patients to travel for routine follow-up communication.
              </p>
            </div>
            <Link to="/healthcare" className="mt-6 text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
              <span>Open Healthcare Dashboard</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Safety & Clinical Boundaries</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                PainSense AI clearly distinguishes patient-reported information from AI-assisted observations. It does not diagnose or replace clinical judgment.
              </p>
            </div>
            <Link to="/limitations" className="mt-6 text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
              <span>Read AI Boundaries</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Privacy & Patient Control</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Local data controls, granular consent for each communication channel, and instant data deletion tools protect patient privacy.
              </p>
            </div>
            <Link to="/settings" className="mt-6 text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
              <span>Review Privacy Controls</span>
              <span>&rarr;</span>
            </Link>
          </div>

        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Try the Post-Discharge Care Demo
          </h2>
          <p className="mt-4 text-slate-300 text-base">
            Login as a patient to submit a case, or as a healthcare professional to review cases remotely.
          </p>
          <div className="mt-6 p-4 bg-slate-800 rounded-xl text-left text-sm space-y-2 border border-slate-700 max-w-sm mx-auto">
            <p className="font-bold text-slate-200">Demo Credentials:</p>
            <p className="text-slate-400"><span className="text-slate-200 font-mono">patient@painsense.ai</span> / patient123</p>
            <p className="text-slate-400"><span className="text-slate-200 font-mono">doctor@painsense.ai</span> / doctor123</p>
            <p className="text-slate-400"><span className="text-slate-200 font-mono">caregiver@painsense.ai</span> / caregiver123</p>
          </div>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg transition-all"
            >
              Login to Demo
            </Link>
            <Link
              to="/post-discharge"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700"
            >
              Post-Discharge Care
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

// Inline icon component to avoid import issues
function FileTextIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
