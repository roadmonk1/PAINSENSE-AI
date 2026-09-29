import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, PhoneCall, ShieldAlert, CheckCircle2, 
  FileText, Clock, AlertTriangle, UserCheck, X, PhoneForwarded
} from 'lucide-react';
import { getDoctorSummary, requestCall, getAssessmentHistory } from '../services/api';

export default function DoctorAssistancePage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callTelemetry, setCallTelemetry] = useState(null);
  const [callingState, setCallingState] = useState('idle'); // idle, ringing, connected

  useEffect(() => {
    async function loadSummary() {
      try {
        const history = await getAssessmentHistory();
        const latestId = (history && history.length > 0) ? history[0].id : 1;
        const res = await getDoctorSummary(latestId);
        setSummary(res);
      } catch (err) {
        console.error("Doctor summary load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  const handleInitiateCall = async (target) => {
    setCallingState('ringing');
    setCallActive(true);
    try {
      const res = await requestCall(target, summary ? summary.assessment_id : 1);
      setTimeout(() => {
        setCallTelemetry(res.telemetry);
        setCallingState('connected');
      }, 1500);
    } catch (err) {
      console.error("Call error:", err);
      setCallingState('idle');
      setCallActive(false);
    }
  };

  const endCall = () => {
    setCallActive(false);
    setCallingState('idle');
    setCallTelemetry(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Clinical Handover & Triage Consultation</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Doctor Assistance Console
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Synthesizes multimodal patient telemetry into a standardized pre-call clinical summary for physicians and nurses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleInitiateCall('doctor')}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-2 transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Consult Doctor (Demo Mode)</span>
          </button>
          <button
            onClick={() => handleInitiateCall('emergency')}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Dispatch</span>
          </button>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Clinical Boundary */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-xs text-amber-900 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Physician Clinical Responsibility:</span>
          This AI-generated clinical assistance summary is designed solely for rapid communication handover. It does NOT formulate a medical diagnosis or treatment plan. The attending physician must independently examine the patient.
        </div>
      </div>

      {/* Main Clinical Handover Document */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Structured Handover Document */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-base text-slate-900">Patient Clinical Handover Summary</h3>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono">
              Assessment #{summary ? summary.assessment_id : '101'}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Generating clinical summary...
            </div>
          ) : summary ? (
            <div className="space-y-6">
              
              {/* Patient & Modality Meta */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Patient Name</span>
                  <span className="font-bold text-slate-800 text-sm">{summary.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Triage Priority</span>
                  <span className="font-black text-amber-600 uppercase text-sm">{summary.triage_level}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Communication Channels</span>
                  <span className="font-semibold text-slate-800">{summary.communication_methods.join(', ')}</span>
                </div>
              </div>

              {/* 1. Subjective Report (From Patient) */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs space-y-2">
                <span className="font-bold text-sky-900 block text-xs uppercase tracking-wider">
                  1. Subjective Report (Direct Patient Ground Truth):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Location</span>
                    <span className="font-bold text-slate-900">{summary.reported_pain.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Severity</span>
                    <span className="font-bold text-slate-900">{summary.reported_pain.severity}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Character / Type</span>
                    <span className="font-bold text-slate-900">{summary.reported_pain.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Duration</span>
                    <span className="font-bold text-slate-900">{summary.reported_pain.duration}</span>
                  </div>
                </div>
              </div>

              {/* 2. Objective AI Observations (Supportive Only) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider">
                  2. Objective AI Observations (Supportive Telemetry Only):
                </span>
                {summary.ai_observations && summary.ai_observations.indicators && summary.ai_observations.indicators.length > 0 ? (
                  <ul className="space-y-1 text-slate-700">
                    {summary.ai_observations.indicators.map((ind, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-sky-500 font-bold">&bull;</span>
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No marked distress or grimacing detected during optical/acoustic scan.</p>
                )}
              </div>

              {/* 3. Recommendations for Clinician */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Recommended Clinical Examination Steps:</span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {summary.recommendations_for_clinician.map((rec, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Raw Clinical Handover Text Box */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Raw EHR Handover Transcript:</label>
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {summary.clinical_summary}
                </pre>
              </div>

            </div>
          ) : (
            <p className="text-slate-400 text-sm">No summary available.</p>
          )}
        </div>

        {/* Right Column: Doctor Call Console */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Handover Telephony & Call Desk
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Before calling, the system transmits the complete structured clinical summary directly to the clinician's workstation screen.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleInitiateCall('doctor')}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-2 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Dr. Marcus Vance (Physician)</span>
              </button>

              <button
                onClick={() => handleInitiateCall('caregiver')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-2 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Elena Morgan (Caregiver)</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              <span className="font-bold text-slate-700 block mb-1">Replaceable Provider Architecture:</span>
              Integrated with <code className="bg-white px-1 py-0.5 rounded border border-slate-300">CallService</code> abstraction. In development/testing environments, operates in deterministic <strong>Demo Call Mode</strong> without placing billable telephony calls.
            </div>
          </div>
        </div>

      </div>

      {/* Active Call Modal Overlay */}
      {callActive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-sky-600">
                <PhoneForwarded className="w-5 h-5 animate-bounce" />
                <span className="font-bold text-sm">Active Consultation Session</span>
              </div>
              <button onClick={endCall} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-4 space-y-2">
              <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-600 mx-auto flex items-center justify-center animate-pulse">
                <PhoneCall className="w-8 h-8" />
              </div>

              {callingState === 'ringing' ? (
                <div>
                  <h4 className="font-bold text-lg text-slate-900">Connecting to Clinician...</h4>
                  <p className="text-xs text-slate-500">Transmitting patient handover summary and observational data</p>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-lg text-slate-900">
                    {callTelemetry ? callTelemetry.target_name : "Consultation Active"}
                  </h4>
                  <p className="text-xs text-emerald-600 font-semibold font-mono">
                    Connected (Demo Mode) • SRTP Encrypted
                  </p>
                </div>
              )}
            </div>

            {callTelemetry && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left">
                <div className="flex justify-between text-slate-600">
                  <span>Provider:</span>
                  <span className="font-bold text-slate-800">{callTelemetry.provider}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Handover Status:</span>
                  <span className="font-bold text-emerald-700">Summary Delivered to Clinician Terminal</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Target Phone:</span>
                  <span className="font-mono text-slate-700">{callTelemetry.target_phone}</span>
                </div>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                  {callTelemetry.disclaimer}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={endCall}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                End Consultation Call
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
