import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, Bell, ShieldCheck, CheckCircle2, 
  PhoneCall, AlertTriangle, Clock, ArrowRight, UserCheck
} from 'lucide-react';
import { getCaregiverDashboard, triggerCaregiverAlert } from '../services/api';

export default function CaregiverPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertText, setAlertText] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  const loadData = async () => {
    try {
      const res = await getCaregiverDashboard();
      setData(res);
    } catch (err) {
      console.error("Caregiver dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!alertText.trim()) return;
    try {
      await triggerCaregiverAlert(1, "warning", alertText);
      setAlertSent(true);
      setAlertText('');
      loadData();
      setTimeout(() => setAlertSent(false), 3000);
    } catch (err) {
      console.error("Failed to dispatch alert:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Authorized Caregiver Support Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Caregiver Monitoring Console
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Real-time pain alerts, observational trends, and immediate dispatch links for authorized family members and nursing staff.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            Elena Morgan (Sister) - Active Session
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Monitored Patient Overview & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Patient Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Authorized Patient: Alex Morgan</h3>
              <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Telemetry Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Recent Perceived Severity</span>
                <span className="font-extrabold text-amber-600 text-base capitalize mt-0.5 block">
                  Moderate Discomfort
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Primary Channels Used</span>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">
                  ASL Sign + Camera
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Triage Classification</span>
                <span className="font-extrabold text-sky-700 text-sm mt-0.5 block">
                  Caution / Stable
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Latest Communication Summary:</span>
              <p className="text-slate-600 italic">
                "Alex communicated 'Pain Chest Moderate' using ASL. Subtle brow lowering and shoulder tension observed. Recommended monitoring rest and comfort measures."
              </p>
            </div>
          </div>

          {/* Active Caregiver Alerts Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Recent Automated Caregiver Alerts</h3>
              </div>
              <span className="text-xs text-slate-400">Past 24 Hours</span>
            </div>

            {data && data.recent_alerts && data.recent_alerts.length > 0 ? (
              <div className="space-y-3">
                {data.recent_alerts.map((al) => (
                  <div key={al.id} className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center font-bold text-amber-900">
                      <span className="capitalize">{al.level} Alert - Patient Telemetry</span>
                      <span className="text-[11px] font-mono text-amber-700">
                        {new Date(al.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-amber-800">{al.message}</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-amber-700 border-t border-amber-200/50">
                      <span>Status: {al.acknowledged ? 'Acknowledged' : 'Active'}</span>
                      <span className="font-semibold text-emerald-700 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Delivered to Phone
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No alerts generated currently.</p>
            )}

            {/* Custom Caregiver Note / Ping */}
            <form onSubmit={handleSendAlert} className="pt-4 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Log Check-in Note or Send Patient Message:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
                  placeholder="e.g., Checked on Alex, provided warm compress..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Log Note
                </button>
              </div>
              {alertSent && (
                <span className="text-xs text-emerald-600 font-bold block">
                  Check-in note successfully logged.
                </span>
              )}
            </form>
          </div>

        </div>

        {/* Right Column: Emergency & Assistance Dispatch */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Emergency & Clinical Contacts
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div>
                  <span className="text-xs font-bold text-red-900 block">Immediate Emergency Dispatch</span>
                  <span className="text-xs text-red-700 font-mono font-bold">+1 (800) 555-0199</span>
                </div>
                <button
                  onClick={() => alert("Simulating dispatch connection to emergency services.")}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Emergency Services</span>
                </button>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">Primary Physician</span>
                  <span className="text-xs text-sky-700">Dr. Marcus Vance, MD</span>
                </div>
                <button
                  onClick={() => alert("Initiating clinical consultation handover.")}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Consult Primary Physician</span>
                </button>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500">
              Caregiver dashboard strictly complies with patient health data consent controls.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
