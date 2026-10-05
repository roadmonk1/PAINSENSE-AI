/**
 * Healthcare Professional Dashboard — TYSIC 2026
 * Enables remote review of post-discharge patient cases.
 *
 * IMPORTANT: This is a COMMUNICATION and DOCUMENTATION tool.
 * PainSense AI does NOT diagnose, treat, or replace clinical judgement.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, Search, Eye, Download, Clock,
  Info, ShieldCheck, AlertTriangle, CheckCircle2, ArrowLeft,
  FileText, User, Activity
} from 'lucide-react';
import {
  getAllPostDischargeCasesForDoctor,
  updateCaseStatus,
  getPostDischargeCaseReportData
} from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// PDF generator (same approach as patient side)
// ─────────────────────────────────────────────────────────────────────────────
function generatePdfReport(reportData) {
  const c = reportData.case;
  const now = new Date().toLocaleString();
  const symptomsList = c.symptoms?.length ? c.symptoms.join(', ') : 'None reported';
  const aiObs = c.ai_observations?.length
    ? c.ai_observations.map(o => `<li>${o}</li>`).join('')
    : '<li>No AI-assisted observations for this session.</li>';
  const timeline = reportData.timeline_summary?.length
    ? reportData.timeline_summary.map(e =>
        `<tr><td>${new Date(e.timestamp).toLocaleDateString()}</td><td>${e.title}</td><td style="text-transform:capitalize">${e.severity}</td></tr>`
      ).join('')
    : '<tr><td colspan="3">No timeline data available.</td></tr>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PainSense AI — Healthcare Provider Report ${c.case_ref}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1e293b; margin:0; padding:0; }
    .header { background:#0f172a; color:white; padding:24px 32px; }
    .header h1 { margin:0; font-size:20px; }
    .header p { margin:4px 0 0; font-size:12px; color:#94a3b8; }
    .demo-badge { display:inline-block; background:#fef3c7; color:#92400e; border:1px solid #fcd34d; padding:4px 12px; border-radius:4px; font-size:11px; font-weight:bold; margin-bottom:12px; }
    .body { padding:24px 32px; }
    .case-meta { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; margin-bottom:20px; }
    .meta-item label { font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; display:block; }
    .meta-item span { font-size:14px; font-weight:bold; color:#1e293b; }
    .section { margin-bottom:20px; }
    .section-header { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; font-weight:bold; padding:8px 12px; border-radius:4px 4px 0 0; }
    .section-body { border:1px solid #e2e8f0; border-top:none; padding:16px; border-radius:0 0 4px 4px; font-size:13px; }
    .patient-section .section-header { background:#eff6ff; color:#1d4ed8; }
    .ai-section .section-header { background:#f8fafc; color:#475569; }
    table { width:100%; border-collapse:collapse; }
    th { background:#f1f5f9; font-size:11px; text-align:left; padding:8px; }
    td { padding:8px; font-size:12px; border-bottom:1px solid #f1f5f9; }
    .disclaimer { background:#fef2f2; border:1px solid #fecaca; padding:16px; border-radius:8px; font-size:11px; color:#991b1b; margin-top:24px; }
    .footer { margin-top:32px; padding-top:16px; border-top:2px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PainSense AI &mdash; Healthcare Provider Report</h1>
    <p>Post-Discharge Care Communication Record &nbsp;|&nbsp; TYSIC 2026 &nbsp;|&nbsp; ${now}</p>
  </div>
  <div class="body">
    ${c.is_demo ? '<div class="demo-badge">⚠ DEMO / SIMULATED DATA — Not a real patient record</div>' : ''}
    <div class="case-meta">
      <div class="meta-item"><label>Case Reference</label><span>${c.case_ref}</span></div>
      <div class="meta-item"><label>Patient</label><span>${reportData.patient_name}</span></div>
      <div class="meta-item"><label>Submitted</label><span>${new Date(c.created_at).toLocaleString()}</span></div>
      <div class="meta-item"><label>Discharge Date</label><span>${c.discharge_date || 'Not recorded'}</span></div>
      <div class="meta-item"><label>Facility</label><span>${c.discharge_hospital || 'Not recorded'}</span></div>
      <div class="meta-item"><label>Status</label><span style="text-transform:capitalize">${c.status?.replace(/_/g, ' ')}</span></div>
    </div>

    <div class="section patient-section">
      <div class="section-header">SECTION 1 &mdash; PATIENT-REPORTED INFORMATION (Primary Ground Truth)</div>
      <div class="section-body">
        <p><em>The following information was directly reported by the patient. It takes precedence over AI observations.</em></p>
        <table>
          <tr><th>Field</th><th>Patient Report</th></tr>
          <tr><td>Pain Location</td><td>${c.pain_location}</td></tr>
          <tr><td>Severity (Patient-Reported)</td><td><strong>${c.severity_score} / 10</strong></td></tr>
          <tr><td>Pain Character</td><td>${c.pain_type}</td></tr>
          <tr><td>Duration</td><td>${c.pain_duration}</td></tr>
          <tr><td>Accompanying Symptoms</td><td>${symptomsList}</td></tr>
          <tr><td>Changes Since Discharge</td><td>${c.changes_since_discharge || 'Not specified'}</td></tr>
        </table>
        ${c.patient_notes ? `<p style="margin-top:12px"><strong>Patient's own words:</strong><br/><em>"${c.patient_notes}"</em></p>` : ''}
        ${c.caregiver_notes ? `<p style="margin-top:8px"><strong>Caregiver observation:</strong><br/>${c.caregiver_notes}</p>` : ''}
      </div>
    </div>

    <div class="section ai-section">
      <div class="section-header">SECTION 2 &mdash; AI-ASSISTED OBSERVATIONS (Supportive — Non-Diagnostic)</div>
      <div class="section-body">
        <p><strong>IMPORTANT:</strong> These observations are generated by the PainSense AI multimodal system. They are supportive context only and do NOT constitute a clinical finding, diagnosis, or recommendation for treatment.</p>
        <ul>${aiObs}</ul>
        ${c.ai_observation_note ? `<p style="color:#475569;font-style:italic">${c.ai_observation_note}</p>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-header" style="background:#f8fafc;color:#334155">SECTION 3 &mdash; PATIENT SYMPTOM TIMELINE</div>
      <div class="section-body">
        <table><tr><th>Date</th><th>Event</th><th>Severity</th></tr>${timeline}</table>
      </div>
    </div>

    <div class="disclaimer">
      <strong>CLINICAL RESPONSIBILITY NOTICE:</strong><br/>
      ${reportData.disclaimer}<br/><br/>
      <strong>Safety:</strong> ${reportData.safety_notice}<br/><br/>
      This report requires independent clinical examination before any clinical decision is made.
    </div>
    <div class="footer">PainSense AI &mdash; TYSIC 2026 | For demonstration purposes only | ${now}</div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const severityColor = (score) => {
  if (score >= 8) return 'text-red-600';
  if (score >= 5) return 'text-amber-600';
  return 'text-emerald-600';
};

const statusConfig = {
  pending_review: { label: 'Needs Review', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  reviewed: { label: 'Reviewed', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  actioned: { label: 'Actioned', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
};

function severityLabel(score) {
  if (score >= 8) return { text: 'High', cls: 'text-red-600' };
  if (score >= 5) return { text: 'Moderate', cls: 'text-amber-600' };
  return { text: 'Mild', cls: 'text-emerald-600' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Case Card (list view)
// ─────────────────────────────────────────────────────────────────────────────
function CaseCard({ c, onView, onDownload }) {
  const svLabel = severityLabel(c.severity_score);
  const st = statusConfig[c.status] || statusConfig.pending_review;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono font-bold text-sm text-slate-700">{c.case_ref}</span>
            {c.is_demo && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200">DEMO DATA</span>
            )}
            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
          </div>

          <p className="text-sm font-bold text-slate-900 mb-0.5">{c.patient_name}</p>
          <p className="text-xs text-slate-400 mb-3">{new Date(c.created_at).toLocaleString()}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Pain</span>
              <span className="font-bold text-slate-800">{c.pain_location}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Severity</span>
              <span className={`font-black text-xl ${severityColor(c.severity_score)}`}>
                {c.severity_score}<span className="text-sm font-normal text-slate-400">/10</span>
              </span>
              <span className={`text-[11px] block capitalize font-semibold ${svLabel.cls}`}>{svLabel.text}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Duration</span>
              <span className="font-semibold text-slate-800">{c.pain_duration}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Input Method</span>
              <span className="font-semibold text-slate-800 truncate block">{c.communication_methods?.split(', ')[0]}</span>
            </div>
          </div>

          {c.changes_since_discharge && (
            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic truncate">
              "{c.changes_since_discharge}"
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={() => onView(c)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all">
            <Eye className="w-3.5 h-3.5" /><span>View Case</span>
          </button>
          <Link to="/timeline"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" /><span>Timeline</span>
          </Link>
          <button onClick={() => onDownload(c)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5" /><span>PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Case Detail (doctor view)
// ─────────────────────────────────────────────────────────────────────────────
function CaseDetailDoctor({ caseData, onBack, onDownload, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(caseData.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const aiObs = caseData.ai_observations || [];
  const symptoms = caseData.symptoms || [];
  const st = statusConfig[caseData.status] || statusConfig.pending_review;

  async function saveStatus() {
    setSaving(true);
    try {
      await updateCaseStatus(caseData.id, newStatus);
      setSaved(true);
      onStatusChange(caseData.id, newStatus);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-slate-400 hover:text-slate-700 flex items-center space-x-1 text-sm">
        <ArrowLeft className="w-4 h-4" /><span>Back to All Cases</span>
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900">Case {caseData.case_ref}</h1>
            {caseData.is_demo && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200">DEMO DATA</span>}
            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-slate-500 text-sm">Patient: <strong>{caseData.patient_name}</strong> · {new Date(caseData.created_at).toLocaleString()}</p>
        </div>
        <button onClick={onDownload}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl">
          <Download className="w-4 h-4" /><span>Download Report</span>
        </button>
      </div>

      {/* Clinical boundary notice */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-xs text-amber-900 flex items-start space-x-3">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
        <div>
          <strong>Healthcare Professional Responsibility:</strong> This report is for communication and documentation only.
          It does NOT constitute a medical diagnosis. All clinical decisions must be made through independent patient assessment by a qualified professional.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Patient-Reported (PRIMARY) */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-900 text-xs uppercase tracking-wider">Patient-Reported Information <span className="text-sky-500">(Primary Ground Truth)</span></span>
              <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded font-bold">Subjective</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><span className="text-slate-400 block">Location</span><span className="font-bold text-slate-900">{caseData.pain_location}</span></div>
              <div><span className="text-slate-400 block">Severity (Patient)</span><span className={`font-black text-2xl ${severityColor(caseData.severity_score)}`}>{caseData.severity_score}<span className="text-sm font-normal text-slate-400">/10</span></span></div>
              <div><span className="text-slate-400 block">Pain Type</span><span className="font-semibold text-slate-800">{caseData.pain_type}</span></div>
              <div><span className="text-slate-400 block">Duration</span><span className="font-semibold text-slate-800">{caseData.pain_duration}</span></div>
            </div>
            {symptoms.length > 0 && (
              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Accompanying Symptoms</span>
                <div className="flex flex-wrap gap-1.5">
                  {symptoms.map(s => <span key={s} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-semibold">{s}</span>)}
                </div>
              </div>
            )}
            {caseData.changes_since_discharge && (
              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Changes since discharge (patient's words):</span>
                <p className="italic text-sky-900 bg-white/70 p-3 rounded-xl border border-sky-200">"{caseData.changes_since_discharge}"</p>
              </div>
            )}
            {caseData.patient_notes && (
              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Patient additional notes:</span>
                <p className="italic text-slate-700">"{caseData.patient_notes}"</p>
              </div>
            )}
            {caseData.caregiver_notes && (
              <div className="text-xs bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="text-emerald-700 font-bold block mb-1">Caregiver Observation:</span>
                <p className="text-slate-700">{caseData.caregiver_notes}</p>
              </div>
            )}
          </div>

          {/* AI Observations (SECONDARY) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">AI-Assisted Observations</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Non-Diagnostic / Supportive Only</span>
            </div>
            {aiObs.length > 0 ? (
              <ul className="space-y-1.5">
                {aiObs.map((obs, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                    <span className="text-slate-400">•</span><span>{obs}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No AI-assisted observations recorded for this session.</p>
            )}
            {caseData.ai_observation_note && (
              <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2">{caseData.ai_observation_note}</p>
            )}
          </div>

          {/* Communication methods */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">Communication Methods Used</span>
            <div className="flex flex-wrap gap-2">
              {caseData.communication_methods?.split(', ').filter(Boolean).map(m => (
                <span key={m} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200">{m}</span>
              ))}
            </div>
          </div>

          {/* Discharge context */}
          {(caseData.discharge_date || caseData.discharge_hospital) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-xs block mb-2">Discharge Context</span>
              {caseData.discharge_date && <div><span className="text-slate-400">Discharge date:</span> <span className="font-semibold">{caseData.discharge_date}</span></div>}
              {caseData.discharge_hospital && <div><span className="text-slate-400">Facility:</span> <span className="font-semibold">{caseData.discharge_hospital}</span></div>}
              {caseData.discharge_reason && <div><span className="text-slate-400">Reason:</span> <span className="font-semibold">{caseData.discharge_reason}</span></div>}
            </div>
          )}

          <p className="text-[11px] text-slate-400 italic">{caseData.disclaimer}</p>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Review status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Case Review Status</h3>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none">
              <option value="pending_review">Needs Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="actioned">Actioned</option>
            </select>
            <button onClick={saveStatus} disabled={saving}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-60">
              {saved ? <><CheckCircle2 className="w-4 h-4" /><span>Saved!</span></> : saving ? <span>Saving...</span> : <><ShieldCheck className="w-4 h-4" /><span>Update Status</span></>}
            </button>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Actions</h3>
            <button onClick={onDownload}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" /><span>Download Full Report</span>
            </button>
            <Link to="/timeline"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" /><span>View Patient Timeline</span>
            </Link>
            <Link to="/doctor"
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 border border-indigo-200">
              <Stethoscope className="w-4 h-4" /><span>Clinical Handover Console</span>
            </Link>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            <strong className="block text-slate-700 mb-1">Data Sources</strong>
            Patient-reported information is the primary ground truth.
            AI-assisted observations are supportive context only and do not replace direct patient assessment.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Healthcare Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function HealthcareDashboardPage() {
  const [screen, setScreen] = useState('list'); // list, detail
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  async function loadCases() {
    setLoading(true);
    try {
      const data = await getAllPostDischargeCasesForDoctor();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load cases:', err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function handleDownload(c) {
    try {
      const reportData = await getPostDischargeCaseReportData(c.id);
      generatePdfReport(reportData);
    } catch {
      generatePdfReport({
        case: c,
        patient_name: c.patient_name || 'Patient',
        timeline_summary: [],
        disclaimer: 'PainSense AI is an AI-assisted communication and documentation tool and is not a medical diagnostic device.',
        safety_notice: 'Seek immediate medical attention for severe or worsening symptoms.',
      });
    }
  }

  function handleStatusChange(caseId, newStatus) {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
    if (selectedCase?.id === caseId) {
      setSelectedCase(prev => ({ ...prev, status: newStatus }));
    }
  }

  const filtered = cases.filter(c => {
    const matchSearch = !search || [c.case_ref, c.patient_name, c.pain_location].some(
      f => f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = cases.filter(c => c.status === 'pending_review').length;

  if (screen === 'detail' && selectedCase) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CaseDetailDoctor
          caseData={selectedCase}
          onBack={() => setScreen('list')}
          onDownload={() => handleDownload(selectedCase)}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center space-x-2 text-sky-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>TYSIC 2026 — Remote Post-Discharge Care</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Healthcare Professional Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review post-discharge patient communications remotely — without requiring patients to travel.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-900 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{pendingCount} case{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} review</span>
          </div>
        )}
      </div>

      {/* Demo badge */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span><strong>Demo / Simulated Data:</strong> All cases shown use fictional demonstration data. They do not represent real patients, hospitals, or clinical outcomes.</span>
      </div>

      {/* Clinical boundary */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-xs text-amber-900 flex items-start space-x-3">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
        <div>
          <strong>Clinical Responsibility:</strong> PainSense AI is a communication and documentation tool only.
          All clinical decisions must be made through independent professional assessment.
          Patient-reported information is primary. AI observations are supportive context only.
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cases', value: cases.length, cls: 'text-slate-900' },
          { label: 'Needs Review', value: cases.filter(c => c.status === 'pending_review').length, cls: 'text-amber-700' },
          { label: 'Reviewed', value: cases.filter(c => c.status !== 'pending_review').length, cls: 'text-emerald-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
            <div className={`text-3xl font-black ${cls}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search cases, patients, locations..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-sky-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none">
          <option value="all">All Status</option>
          <option value="pending_review">Needs Review</option>
          <option value="reviewed">Reviewed</option>
          <option value="actioned">Actioned</option>
        </select>
      </div>

      {/* Cases list */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading patient cases...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">{cases.length === 0 ? 'No patient cases yet.' : 'No cases match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <CaseCard key={c.id} c={c}
              onView={c => { setSelectedCase(c); setScreen('detail'); }}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Links to other tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Link to="/doctor" className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 hover:border-sky-300 hover:bg-sky-50 transition-all">
          <Stethoscope className="w-5 h-5 text-sky-600" />
          <div><p className="font-bold text-sm text-slate-900">Clinical Handover</p><p className="text-xs text-slate-500">6-section structured summary</p></div>
        </Link>
        <Link to="/timeline" className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 hover:border-emerald-300 hover:bg-emerald-50 transition-all">
          <Activity className="w-5 h-5 text-emerald-600" />
          <div><p className="font-bold text-sm text-slate-900">Pain Timeline</p><p className="text-xs text-slate-500">Longitudinal symptom history</p></div>
        </Link>
        <Link to="/caregiver" className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
          <User className="w-5 h-5 text-indigo-600" />
          <div><p className="font-bold text-sm text-slate-900">Caregiver Portal</p><p className="text-xs text-slate-500">Family monitoring & alerts</p></div>
        </Link>
      </div>
    </div>
  );
}
