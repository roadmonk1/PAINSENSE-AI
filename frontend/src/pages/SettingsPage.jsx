import React, { useState, useEffect } from 'react';
import { Settings, Lock, Eye, Trash2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { getPrivacyConsent, updatePrivacyConsent, deleteUserData } from '../services/api';

export default function SettingsPage({ highContrast, setHighContrast }) {
  const [consent, setConsent] = useState({
    camera_consent: true,
    audio_consent: true,
    data_retention_consent: true,
    local_only_mode: false
  });
  const [savedMsg, setSavedMsg] = useState('');
  const [deletedMsg, setDeletedMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConsent() {
      try {
        const res = await getPrivacyConsent();
        if (res) {
          setConsent({
            camera_consent: res.camera_consent ?? true,
            audio_consent: res.audio_consent ?? true,
            data_retention_consent: res.data_retention_consent ?? true,
            local_only_mode: res.local_only_mode ?? false
          });
        }
      } catch (err) {
        console.error("Consent load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConsent();
  }, []);

  const handleSaveConsent = async () => {
    try {
      await updatePrivacyConsent(consent);
      setSavedMsg('Privacy & consent preferences updated successfully.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error("Save consent error:", err);
    }
  };

  const handleDeleteData = async () => {
    if (window.confirm("Are you sure you want to permanently erase all your assessment history and timeline logs? This cannot be undone.")) {
      try {
        const res = await deleteUserData();
        setDeletedMsg(res.message);
        setTimeout(() => setDeletedMsg(''), 4000);
      } catch (err) {
        console.error("Data deletion error:", err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Patient Preferences & Data Sovereignty</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Privacy & Accessibility Settings
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Granular consent controls, on-device processing preferences, and data privacy rights.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {deletedMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{deletedMsg}</span>
        </div>
      )}

      {/* Accessibility Preferences */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
          <Eye className="w-5 h-5 text-sky-600" />
          <span>Visual & Interaction Accessibility</span>
        </h3>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <span className="font-bold text-xs text-slate-800 block">High Contrast Mode</span>
            <span className="text-xs text-slate-500">Elevates contrast ratios for low vision and neurodivergent accessibility.</span>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              highContrast ? 'bg-yellow-400 text-black shadow' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {highContrast ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Sensor & Telemetry Consent */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
          <Lock className="w-5 h-5 text-indigo-600" />
          <span>Sensor Telemetry & Consent</span>
        </h3>

        <div className="space-y-4 text-xs">
          <label className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 block">Camera Video & Optical Telemetry Consent</span>
              <span className="text-slate-500">Allow PAINSENSE-AI to extract facial action units and body posture during assessments.</span>
            </div>
            <input
              type="checkbox"
              checked={consent.camera_consent}
              onChange={(e) => setConsent({ ...consent, camera_consent: e.target.checked })}
              className="w-5 h-5 accent-sky-600 rounded mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 block">Microphone Audio & Speech Consent</span>
              <span className="text-slate-500">Allow voice recording for clinical symptom extraction and acoustic strain estimation.</span>
            </div>
            <input
              type="checkbox"
              checked={consent.audio_consent}
              onChange={(e) => setConsent({ ...consent, audio_consent: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 block">Local-Only Processing Mode (Air-Gapped Telemetry)</span>
              <span className="text-slate-500">Restricts feature inference strictly to browser client; disables cloud telemetry transmission.</span>
            </div>
            <input
              type="checkbox"
              checked={consent.local_only_mode}
              onChange={(e) => setConsent({ ...consent, local_only_mode: e.target.checked })}
              className="w-5 h-5 accent-emerald-600 rounded mt-0.5"
            />
          </label>
        </div>

        <button
          onClick={handleSaveConsent}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
        >
          Save Privacy Preferences
        </button>
      </div>

      {/* Data Erasure / Right to be Forgotten */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-base text-red-900 pb-3 border-b border-red-100 flex items-center space-x-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <span>Data Erasure (Right to Be Forgotten)</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Permanently purge all your past multimodal pain assessments, voice transcripts, sign records, and clinical handover summaries from the application database.
        </p>

        <button
          onClick={handleDeleteData}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Permanently Delete All My Data</span>
        </button>
      </div>

    </div>
  );
}
