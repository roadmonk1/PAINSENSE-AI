import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, HeartHandshake, Eye, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AILimitationsPage() {
  const boundaries = [
    {
      title: "1. Pain is Profoundly Subjective",
      description: "Pain is a personal, multidimensional experience influenced by biology, psychology, prior trauma, culture, and individual pain tolerance. No sensor, optical camera, or algorithm can directly measure the internal sensation of another human being."
    },
    {
      title: "2. Facial Expressions Do Not Prove or Disprove Pain",
      description: "Many individuals express severe distress without observable facial grimacing (stoicism, neurodivergence, facial paralysis, chronic adaptation). Conversely, grimacing can occur during physical exertion, confusion, or intense concentration without pain. A camera reading zero tension must never be used to invalidate a patient's pain."
    },
    {
      title: "3. Vocal Perturbation is Non-Specific",
      description: "Vocal tremor, pitch jitter, and strain can stem from emotional grief, fatigue, dehydration, vocal cord pathology, or background noise. Acoustic indicators provide supportive conversational context only."
    },
    {
      title: "4. Sign Language Diversity & Dialect Nuances",
      description: "Sign language is not universal. American Sign Language (ASL), British Sign Language (BSL), Indian Sign Language (ISL), and French Sign Language (LSF) have completely distinct syntaxes and lexicons. Even within ASL, regional idioms and personal signing styles vary significantly."
    },
    {
      title: "5. Optical & Environmental Interference",
      description: "Poor lighting, occlusion, webcam angle, compression artifacts, and skin tone variations can impact computer vision landmark detection. Our multimodal fusion engine calculates explicit uncertainty scores whenever visual telemetry is degraded."
    },
    {
      title: "6. Non-Diagnostic Medical Boundary",
      description: "PAINSENSE-AI is an assistive communication technology, not a diagnostic medical device. It does not identify underlying disease etiologies (e.g., myocardial infarction vs musculoskeletal strain). Qualified human healthcare professionals retain full responsibility for medical diagnosis and clinical treatment plans."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Ethics, Clinical Boundaries & Technical Limits</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Model Limitations & Clinical Boundaries
        </h1>
        <p className="text-slate-600 text-sm mt-2 leading-relaxed">
          Transparent clinical and algorithmic boundaries are essential for patient safety, ethical AI, and medical integrity.
        </p>
      </div>

      {/* Primary Statement */}
      <div className="p-5 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl text-amber-900 space-y-2">
        <h3 className="font-bold text-base">Core Clinical Principle</h3>
        <p className="text-xs leading-relaxed">
          "The patient's subjective self-report remains the clinical gold standard for pain evaluation. Machine learning models should assist communication and speed clinical handover, never override the patient's voice."
        </p>
      </div>

      {/* Limitations List */}
      <div className="space-y-4">
        {boundaries.map((b, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900">{b.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>
          </div>
        ))}
      </div>

      {/* Navigation Links */}
      <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs">
        <Link to="/assess" className="font-bold text-sky-600 hover:underline">
          &larr; Return to Multimodal Assessment
        </Link>
        <Link to="/settings" className="font-bold text-slate-700 hover:underline">
          View Privacy & Consent Controls &rarr;
        </Link>
      </div>

    </div>
  );
}
