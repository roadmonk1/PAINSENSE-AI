import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Camera, Mic, Hand, Clock, AlertTriangle, 
  CheckCircle2, ArrowRight, Bell, PhoneCall, ShieldAlert, HeartHandshake, Stethoscope
} from 'lucide-react';
import { getAssessmentHistory, getTimeline, getCaregiverDashboard } from '../services/api';

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [caregiverData, setCaregiverData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [hist, time, cg] = await Promise.all([
          getAssessmentHistory(),
          getTimeline(),
          getCaregiverDashboard()
        ]);
        setHistory(hist || []);
        setTimeline(time || []);
        setCaregiverData(cg || null);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const latestAssessment = history.length > 0 ? history[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Quick Launch */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Communication Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Monitoring active communication channels, recent discomfort episodes, and clinician handovers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/assess"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow flex items-center space-x-2 transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-sky-200" />
            <span>Start New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: CURRENT / LATEST ASSESSMENT */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Assessment</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active Session
              </span>
            </div>

            {latestAssessment ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-500 block">Status:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    Possible pain indicators detected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Perceived Severity</span>
                    <span className={`text-base font-extrabold capitalize ${
                      latestAssessment.severity === 'severe' ? 'text-red-600' :
                      latestAssessment.severity === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {latestAssessment.severity}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Model Confidence</span>
                    <span className="text-base font-extrabold text-slate-800">
                      {Math.round(latestAssessment.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 block mb-1">Detected Modalities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {latestAssessment.communication_methods.map((method, idx) => (
                      <span key={idx} className="bg-sky-50 text-sky-800 text-xs px-2 py-0.5 rounded-md font-medium border border-sky-100">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg italic">
                  "{latestAssessment.summary_text}"
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm font-medium">No active assessment session recorded.</p>
                <p className="text-xs mt-1">Start an assessment to record visual, vocal, or sign communication.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/assess"
              className="w-full block text-center py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              [START NEW ASSESSMENT]
            </Link>
          </div>
        </div>

        {/* Card 2: CAREGIVER & DOCTOR ASSISTANCE STATUS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assistance Network</span>
              <span className="text-xs font-medium text-sky-600">Connected</span>
            </div>

            <div className="space-y-4">
              {/* Caregiver Link */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">Elena Morgan (Sister)</h4>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Designated Caregiver</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Status: Authorized & receiving instant alerts</p>
                  <Link to="/caregiver" className="text-xs font-bold text-sky-600 hover:underline mt-1 inline-block">
                    View Caregiver Portal &rarr;
                  </Link>
                </div>
              </div>

              {/* Doctor Link */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">Dr. Marcus Vance, MD</h4>
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">Primary Physician</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Clinical Handover Summary generated</p>
                  <Link to="/doctor" className="text-xs font-bold text-sky-600 hover:underline mt-1 inline-block">
                    Open Clinician Summary & Call &rarr;
                  </Link>
                </div>
              </div>

              {/* Emergency Dispatch */}
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-900 block">Emergency Dispatch</span>
                  <span className="text-xs text-red-700 font-mono">+1 (800) 555-0199</span>
                </div>
                <Link
                  to="/doctor"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Caregiver and physician notifications are routed in accordance with patient consent rules.
          </div>
        </div>

        {/* Card 3: QUICK MODALITY CHANNELS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Communication Channels</span>
            <span className="text-xs font-medium text-slate-500">Multimodal</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/camera"
              className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 hover:border-sky-300 transition-all text-left group"
            >
              <Camera className="w-5 h-5 text-sky-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-sm text-slate-900">Camera Scan</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Facial tension & posture</p>
            </Link>

            <Link
              to="/voice"
              className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all text-left group"
            >
              <Mic className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-sm text-slate-900">Voice Input</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Speech & vocal strain</p>
            </Link>

            <Link
              to="/sign-language"
              className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all text-left group"
            >
              <Hand className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-sm text-slate-900">Sign Language</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">ASL distress gestures</p>
            </Link>

            <Link
              to="/assess"
              className="p-3 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-200 hover:border-purple-300 transition-all text-left group"
            >
              <Activity className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-sm text-slate-900">Self-Report</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">0-10 scale & body map</p>
            </Link>
          </div>

          <div className="mt-6 p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900">
            <span className="font-bold block mb-1">Two-Way Accessible Feedback</span>
            The system responds in text, high contrast visual cues, and speech synthesis to confirm your messages.
          </div>
        </div>

      </div>

      {/* RECENT PAIN TIMELINE & PROGRESSION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-lg text-slate-900">Pain Progression Timeline</h3>
          </div>
          <Link to="/timeline" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
            <span>View Full Interactive History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.slice(0, 4).map((evt) => (
              <div key={evt.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                  evt.severity === 'severe' ? 'bg-red-500' :
                  evt.severity === 'moderate' ? 'bg-amber-500' :
                  evt.severity === 'mild' ? 'bg-sky-500' : 'bg-slate-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">{evt.title}</h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{evt.description}</p>
                  <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Modality: {evt.modality}</span>
                    <span className="capitalize font-semibold text-slate-700">Level: {evt.severity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            No timeline events recorded yet. Complete an assessment to begin tracking.
          </div>
        )}
      </div>

    </div>
  );
}
