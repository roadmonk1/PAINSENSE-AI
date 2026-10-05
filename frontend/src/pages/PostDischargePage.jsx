/**
 * Post-Discharge Care Page — TYSIC 2026
 * Accessible AI-assisted remote post-discharge communication workflow.
 *
 * IMPORTANT: This system is a COMMUNICATION and DOCUMENTATION aid.
 * PainSense AI does NOT diagnose, treat, or replace qualified healthcare professionals.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Send, Download, Clock, CheckCircle2,
  ChevronRight, Camera, Mic,
  Hand, Activity, Info, ShieldCheck, ArrowLeft, Eye
} from 'lucide-react';
import {
  createPostDischargeCase,
  getPatientPostDischargeCases,
  getPostDischargeCaseReportData
} from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// PDF Generation (browser-native, no extra dependency)
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
  <title>PainSense AI — Post-Discharge Care Report ${c.case_ref}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; }
    .header { background: #0f172a; color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
    .demo-badge { display:inline-block; background:#fef3c7; color:#92400e; border:1px solid #fcd34d; padding:4px 12px; border-radius:4px; font-size:11px; font-weight:bold; margin-bottom:12px; }
    .body { padding: 24px 32px; }
    .case-meta { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; margin-bottom:20px; }
    .meta-item label { font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; display:block; }
    .meta-item span { font-size:14px; font-weight:bold; color:#1e293b; }
    .section { margin-bottom:20px; }
    .section-header { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; font-weight:bold; padding:8px 12px; border-radius:4px 4px 0 0; }
    .section-body { border:1px solid #e2e8f0; border-top:none; padding:16px; border-radius:0 0 4px 4px; font-size:13px; }
    .patient-section .section-header { background:#eff6ff; color:#1d4ed8; }
    .ai-section .section-header { background:#f8fafc; color:#475569; }
    .severity-score { font-size:32px; font-weight:900; }
    .disclaimer { background:#fef2f2; border:1px solid #fecaca; padding:16px; border-radius:8px; font-size:11px; color:#991b1b; margin-top:24px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#f1f5f9; font-size:11px; text-align:left; padding:8px; }
    td { padding:8px; font-size:12px; border-bottom:1px solid #f1f5f9; }
    .footer { margin-top:32px; padding-top:16px; border-top:2px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PainSense AI &mdash; Post-Discharge Care Report</h1>
    <p>AI-Assisted Communication &amp; Documentation Tool &nbsp;|&nbsp; TYSIC 2026 &nbsp;|&nbsp; Generated: ${now}</p>
  </div>
  <div class="body">
    ${c.is_demo ? '<div class="demo-badge">⚠ DEMO / SIMULATED DATA — Not a real patient record</div>' : ''}

    <div class="case-meta">
      <div class="meta-item"><label>Case Reference</label><span>${c.case_ref}</span></div>
      <div class="meta-item"><label>Patient</label><span>${reportData.patient_name}</span></div>
      <div class="meta-item"><label>Date Submitted</label><span>${new Date(c.created_at).toLocaleString()}</span></div>
      <div class="meta-item"><label>Discharge Date</label><span>${c.discharge_date || 'Not recorded'}</span></div>
      <div class="meta-item"><label>Discharge Facility</label><span>${c.discharge_hospital || 'Not recorded'}</span></div>
      <div class="meta-item"><label>Status</label><span style="text-transform:capitalize">${c.status?.replace(/_/g, ' ')}</span></div>
    </div>

    <div class="section patient-section">
      <div class="section-header">SECTION 1 &mdash; PATIENT-REPORTED INFORMATION (Primary — Ground Truth)</div>
      <div class="section-body">
        <p><strong>This section contains information as directly reported by the patient.</strong> It takes priority over all other information in this report.</p>
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
      <div class="section-header">SECTION 2 &mdash; AI-ASSISTED OBSERVATIONS (Supportive Only — Non-Diagnostic)</div>
      <div class="section-body">
        <p><strong>These are optional supportive observations produced by the PainSense AI multimodal system. They do NOT constitute a clinical finding or diagnosis.</strong></p>
        <ul>${aiObs}</ul>
        ${c.ai_observation_note ? `<p style="color:#475569;font-style:italic">${c.ai_observation_note}</p>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-header" style="background:#f0fdf4;color:#166534">SECTION 3 &mdash; COMMUNICATION METHODS USED</div>
      <div class="section-body">
        <p>${c.communication_methods}</p>
        <p>The self-report channel provides primary ground truth. Multimodal observations (camera, voice, sign language) provide supportive context only.</p>
      </div>
    </div>

    <div class="section">
      <div class="section-header" style="background:#f8fafc;color:#334155">SECTION 4 &mdash; PATIENT SYMPTOM TIMELINE (Recent History)</div>
      <div class="section-body">
        <table>
          <tr><th>Date</th><th>Event</th><th>Severity</th></tr>
          ${timeline}
        </table>
      </div>
    </div>

    <div class="disclaimer">
      <strong>IMPORTANT MEDICAL DISCLAIMER:</strong><br/>
      ${reportData.disclaimer}<br/><br/>
      <strong>Safety Notice:</strong> ${reportData.safety_notice}
    </div>

    <div class="footer">
      PainSense AI &mdash; TYSIC 2026 Health Innovation &nbsp;|&nbsp; Making post-discharge care communication more accessible for rural families.<br/>
      Report generated ${now}. Case: ${c.case_ref}.
    </div>
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
// Severity helpers
// ─────────────────────────────────────────────────────────────────────────────
const severityColor = (score) => {
  if (score >= 8) return 'text-red-600';
  if (score >= 5) return 'text-amber-600';
  return 'text-emerald-600';
};

const statusBadge = (status) => {
  const map = {
    pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
    reviewed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    actioned: 'bg-sky-100 text-sky-800 border-sky-200',
  };
  return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-screens
// ─────────────────────────────────────────────────────────────────────────────

function CaseList({ cases, onNew, onView }) {
  return (
    <div className="space-y-6">
      {/* TYSIC Header */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-100 border border-sky-300 rounded-full text-xs font-bold text-sky-800 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Post-Discharge Care — TYSIC 2026</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Post-Discharge Care</h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Communicate pain and symptom changes remotely to your healthcare team — without needing to travel to hospital for routine follow-up.
            </p>
          </div>
          <button
            onClick={onNew}
            className="flex items-center space-x-2 px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow transition-all"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Start New Assessment</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-white/70 rounded-xl border border-sky-200 text-xs text-sky-900">
          <strong>How it works:</strong> Fill in your symptoms → Review → Submit → Your healthcare team is notified.
          Your own report is always the most important information.
        </div>
      </div>

      {/* Demo badge */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span><strong>Demo / Simulated Data:</strong> Cases shown below use fictional demonstration data and do not represent real patients or clinical outcomes.</span>
      </div>

      {/* Cases grid */}
      {cases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No post-discharge cases yet.</p>
          <p className="text-slate-400 text-sm mt-1">Click "Start New Assessment" to submit your first report.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-700 text-sm">{c.case_ref}</span>
                    {c.is_demo && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200">DEMO DATA</span>
                    )}
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold capitalize ${statusBadge(c.status)}`}>
                      {c.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Pain Location</span>
                      <span className="font-bold text-slate-800">{c.pain_location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Severity (Patient-Reported)</span>
                      <span className={`font-black text-xl ${severityColor(c.severity_score)}`}>{c.severity_score}<span className="text-sm font-normal text-slate-400">/10</span></span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Duration</span>
                      <span className="font-semibold text-slate-800">{c.pain_duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Submitted</span>
                      <span className="font-semibold text-slate-800">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {c.changes_since_discharge && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{c.changes_since_discharge}"
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onView(c)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Case</span>
                  </button>
                  <Link
                    to="/timeline"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 text-center"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timeline</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentForm({ onSubmit, loading }) {
  const [step, setStep] = useState(1); // 1=context, 2=symptoms, 3=methods, 4=review
  const [form, setForm] = useState({
    discharge_date: '',
    discharge_hospital: '',
    discharge_reason: '',
    pain_location: 'Lower Back',
    severity_score: 5,
    pain_type: 'Aching',
    pain_duration: '1 to 4 hours',
    symptoms: [],
    changes_since_discharge: '',
    patient_notes: '',
    caregiver_notes: '',
    communication_methods: 'Self-Report (Text)',
    ai_observations: [],
  });

  const toggleSymptom = (s) => setForm(f => ({
    ...f,
    symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s]
  }));

  const toggleMethod = (m) => {
    const current = form.communication_methods.split(', ').filter(Boolean);
    const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
    setForm(f => ({ ...f, communication_methods: next.join(', ') || 'Self-Report (Text)' }));
  };

  const methods = form.communication_methods.split(', ').filter(Boolean);

  const steps = [
    { n: 1, label: 'Discharge Context' },
    { n: 2, label: 'Symptoms' },
    { n: 3, label: 'Communication' },
    { n: 4, label: 'Review & Submit' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={() => setStep(Math.max(1, step - 1))} className="text-slate-400 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">New Post-Discharge Assessment</h1>
          <p className="text-slate-500 text-sm">Step {step} of 4 — {steps[step - 1].label}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {steps.map(s => (
          <div key={s.n} className={`flex-1 h-1.5 rounded-full transition-all ${s.n <= step ? 'bg-sky-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span><strong>Your words matter most.</strong> Self-reported information is the primary input. AI observations are supportive only and never override what you tell us.</span>
      </div>

      {/* Step 1: Context */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-base text-slate-900">Post-Discharge Context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Approximate Discharge Date</label>
              <input type="date" value={form.discharge_date}
                onChange={e => setForm(f => ({ ...f, discharge_date: e.target.value }))}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-sky-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hospital / Health Centre (optional)</label>
              <input type="text" value={form.discharge_hospital}
                onChange={e => setForm(f => ({ ...f, discharge_hospital: e.target.value }))}
                placeholder="e.g. District General Hospital"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-sky-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Why were you admitted? (optional)</label>
            <textarea rows={2} value={form.discharge_reason}
              onChange={e => setForm(f => ({ ...f, discharge_reason: e.target.value }))}
              placeholder="e.g. Surgery, infection, injury..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-sky-400" />
          </div>
        </div>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-base text-slate-900">Your Symptoms (Patient-Reported)</h2>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Where is your pain? <span className="text-sky-600">(Select one)</span></label>
            <div className="grid grid-cols-3 gap-2">
              {['Head', 'Chest', 'Stomach / Abdomen', 'Lower Back', 'Upper Back', 'Neck', 'Shoulder', 'Knee', 'Arm / Wrist'].map(loc => (
                <button key={loc} onClick={() => setForm(f => ({ ...f, pain_location: loc }))}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    form.pain_location === loc ? 'bg-sky-600 text-white border-sky-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}>{loc}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700">How bad is the pain? <span className="text-slate-400">(0 = No pain, 10 = Worst imaginable)</span></label>
              <span className={`text-2xl font-black ${severityColor(form.severity_score)}`}>{form.severity_score}<span className="text-sm font-normal text-slate-400">/10</span></span>
            </div>
            <input type="range" min="0" max="10" value={form.severity_score}
              onChange={e => setForm(f => ({ ...f, severity_score: parseInt(e.target.value) }))}
              className="w-full accent-sky-600 cursor-pointer h-2" />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0 — No pain</span><span>5 — Moderate</span><span>10 — Severe</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Type of pain:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Sharp', 'Dull', 'Burning', 'Aching', 'Throbbing', 'Pressure'].map(pt => (
                  <button key={pt} onClick={() => setForm(f => ({ ...f, pain_type: pt }))}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                      form.pain_type === pt ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}>{pt}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">How long has it lasted?</label>
              <select value={form.pain_duration} onChange={e => setForm(f => ({ ...f, pain_duration: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none">
                <option>Less than 1 hour</option>
                <option>1 to 4 hours</option>
                <option>Since morning</option>
                <option>Past 24 hours</option>
                <option>More than 3 days</option>
                <option>Comes and goes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Other symptoms you notice:</label>
            <div className="flex flex-wrap gap-2">
              {['Fever', 'Nausea', 'Dizziness', 'Swelling', 'Shortness of breath', 'Stiffness', 'Numbness', 'Difficulty moving', 'Poor appetite'].map(sym => (
                <button key={sym} onClick={() => toggleSymptom(sym)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    form.symptoms.includes(sym) ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}>{sym}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">What has changed since you were discharged?</label>
            <textarea rows={3} value={form.changes_since_discharge}
              onChange={e => setForm(f => ({ ...f, changes_since_discharge: e.target.value }))}
              placeholder="Describe any changes — getting better, worse, or the same..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Anything else you want the doctor to know?</label>
            <textarea rows={2} value={form.patient_notes}
              onChange={e => setForm(f => ({ ...f, patient_notes: e.target.value }))}
              placeholder="Your own words — in any language or style..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none" />
          </div>
        </div>
      )}

      {/* Step 3: Communication method */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-base text-slate-900">How did you communicate? <span className="text-slate-400 font-normal text-sm">(Select all that apply)</span></h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Self-Report (Text)', icon: ClipboardList, desc: 'Written form — the primary channel' },
              { label: 'Voice', icon: Mic, desc: 'Spoken description recorded' },
              { label: 'Camera / Visual', icon: Camera, desc: 'Facial or posture observation' },
              { label: 'Sign Language', icon: Hand, desc: 'ASL or gesture communication' },
              { label: 'Caregiver Observation', icon: Activity, desc: 'Reported by family/caregiver' },
            ].map(({ label, icon: Icon, desc }) => {
              const active = methods.includes(label);
              return (
                <button key={label} onClick={() => toggleMethod(label)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                    active ? 'bg-sky-50 border-sky-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                  <div className={`p-2 rounded-lg mt-0.5 ${active ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${active ? 'text-sky-900' : 'text-slate-800'}`}>{label}</span>
                    <span className="text-xs text-slate-500">{desc}</span>
                  </div>
                  {active && <CheckCircle2 className="w-4 h-4 text-sky-600 ml-auto mt-1 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Caregiver / family notes (optional):</label>
            <textarea rows={2} value={form.caregiver_notes}
              onChange={e => setForm(f => ({ ...f, caregiver_notes: e.target.value }))}
              placeholder="What has the family or caregiver observed?"
              className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none" />
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-base text-slate-900">Review Before Submitting</h2>

          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3 text-sm">
            <div className="font-bold text-sky-900 text-xs uppercase tracking-wider border-b border-sky-200 pb-2">Patient-Reported Information (Primary)</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-slate-400 block">Pain Location</span><span className="font-bold text-slate-900">{form.pain_location}</span></div>
              <div><span className="text-slate-400 block">Severity</span><span className={`font-black text-xl ${severityColor(form.severity_score)}`}>{form.severity_score}/10</span></div>
              <div><span className="text-slate-400 block">Pain Type</span><span className="font-semibold text-slate-800">{form.pain_type}</span></div>
              <div><span className="text-slate-400 block">Duration</span><span className="font-semibold text-slate-800">{form.pain_duration}</span></div>
            </div>
            {form.symptoms.length > 0 && (
              <div className="text-xs"><span className="text-slate-400 block mb-1">Other Symptoms</span>
                <div className="flex flex-wrap gap-1.5">
                  {form.symptoms.map(s => <span key={s} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[11px] font-semibold">{s}</span>)}
                </div>
              </div>
            )}
            {form.changes_since_discharge && <div className="text-xs"><span className="text-slate-400 block">Changes since discharge:</span><p className="italic text-slate-700">"{form.changes_since_discharge}"</p></div>}
            {form.patient_notes && <div className="text-xs"><span className="text-slate-400 block">Patient notes:</span><p className="italic text-slate-700">"{form.patient_notes}"</p></div>}
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <div><span className="font-bold">Communication method:</span> {form.communication_methods}</div>
            {form.discharge_date && <div><span className="font-bold">Discharge date:</span> {form.discharge_date}</div>}
            {form.discharge_hospital && <div><span className="font-bold">Facility:</span> {form.discharge_hospital}</div>}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <strong>What happens next:</strong> Your case summary will be sent to your healthcare team for remote review.
            If your symptoms are severe or worsening quickly, please seek immediate medical attention rather than waiting for a remote review.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl">
            ← Back
          </button>
        ) : <div />}

        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl flex items-center space-x-2">
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => onSubmit(form)} disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center space-x-2 disabled:opacity-60">
            <Send className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'Submit Case'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function CaseDetail({ caseData, onBack, onDownload }) {
  const aiObs = caseData.ai_observations || [];
  const symptoms = caseData.symptoms || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 flex items-center space-x-1 text-sm">
          <ArrowLeft className="w-4 h-4" /><span>Back to Cases</span>
        </button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900">Case {caseData.case_ref}</h1>
            {caseData.is_demo && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200">DEMO DATA</span>}
            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold capitalize ${statusBadge(caseData.status)}`}>
              {caseData.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-sm">{new Date(caseData.created_at).toLocaleString()}</p>
        </div>
        <button onClick={onDownload}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl">
          <Download className="w-4 h-4" />
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* Patient-Reported (Primary) */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sky-900 text-xs uppercase tracking-wider">Patient-Reported Information <span className="text-sky-600">(Primary)</span></span>
          <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded font-bold">Ground Truth</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div><span className="text-slate-400 block">Pain Location</span><span className="font-bold text-slate-900 text-sm">{caseData.pain_location}</span></div>
          <div><span className="text-slate-400 block">Severity</span><span className={`font-black text-2xl ${severityColor(caseData.severity_score)}`}>{caseData.severity_score}<span className="text-sm font-normal text-slate-400">/10</span></span></div>
          <div><span className="text-slate-400 block">Pain Type</span><span className="font-semibold text-slate-800">{caseData.pain_type}</span></div>
          <div><span className="text-slate-400 block">Duration</span><span className="font-semibold text-slate-800">{caseData.pain_duration}</span></div>
        </div>
        {symptoms.length > 0 && (
          <div className="text-xs">
            <span className="text-slate-400 block mb-1">Other Symptoms</span>
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
            <span className="text-slate-400 block mb-1">Additional patient notes:</span>
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

      {/* AI Observations (Secondary) */}
      {aiObs.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">AI-Assisted Observations</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Non-Diagnostic / Supportive Only</span>
          </div>
          <ul className="space-y-1.5">
            {aiObs.map((obs, i) => (
              <li key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
          {caseData.ai_observation_note && (
            <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2">{caseData.ai_observation_note}</p>
          )}
        </div>
      )}

      {/* Communication methods */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Communication Methods Used</span>
        <div className="flex flex-wrap gap-2">
          {caseData.communication_methods.split(', ').filter(Boolean).map(m => (
            <span key={m} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200">{m}</span>
          ))}
        </div>
      </div>

      {/* Discharge context */}
      {(caseData.discharge_date || caseData.discharge_hospital) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs space-y-1">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-xs block mb-2">Discharge Context</span>
          {caseData.discharge_date && <div><span className="text-slate-400">Discharge date:</span> <span className="font-semibold">{caseData.discharge_date}</span></div>}
          {caseData.discharge_hospital && <div><span className="text-slate-400">Facility:</span> <span className="font-semibold">{caseData.discharge_hospital}</span></div>}
          {caseData.discharge_reason && <div><span className="text-slate-400">Reason for admission:</span> <span className="font-semibold">{caseData.discharge_reason}</span></div>}
        </div>
      )}

      <p className="text-[11px] text-slate-400 italic">{caseData.disclaimer}</p>
    </div>
  );
}

function SuccessScreen({ newCase, onViewCase, onNewCase }) {
  return (
    <div className="text-center py-16 space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Case Submitted Successfully</h2>
        <p className="text-slate-500 mt-2">Case reference: <span className="font-mono font-bold text-sky-700">{newCase?.case_ref}</span></p>
        <p className="text-slate-400 text-sm mt-1">Your healthcare team can now review your report remotely.</p>
      </div>
      <div className="flex justify-center gap-3 flex-wrap">
        <button onClick={() => onViewCase(newCase)} className="px-5 py-2.5 bg-sky-600 text-white font-bold rounded-xl text-sm">
          View Case Details
        </button>
        <button onClick={onNewCase} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">
          Submit Another
        </button>
        <Link to="/timeline" className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm flex items-center space-x-2">
          <Clock className="w-4 h-4" /><span>View Timeline</span>
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PostDischargePage() {
  const [screen, setScreen] = useState('list'); // list, new, detail, success
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newCase, setNewCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);

  async function loadCases() {
    setLoadingCases(true);
    try {
      const data = await getPatientPostDischargeCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load cases:', err);
      setCases([]);
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function handleSubmit(form) {
    setLoading(true);
    try {
      const result = await createPostDischargeCase({
        ...form,
        symptoms: form.symptoms,
        ai_observations: [],
      });
      setNewCase(result);
      setCases(prev => [result, ...prev]);
      setScreen('success');
    } catch (err) {
      alert('Failed to submit case. Please check your connection and try again.\n\n' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadReport(caseData) {
    try {
      const reportData = await getPostDischargeCaseReportData(caseData.id);
      generatePdfReport(reportData);
    } catch (err) {
      console.error('Report error:', err);
      // Fallback: generate with local data
      generatePdfReport({
        case: caseData,
        patient_name: 'Patient',
        timeline_summary: [],
        disclaimer: 'PainSense AI is an AI-assisted communication and documentation tool and is not a medical diagnostic device.',
        safety_notice: 'Seek immediate medical attention for severe or worsening symptoms.',
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loadingCases && screen === 'list' ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading cases...</div>
      ) : screen === 'list' ? (
        <CaseList cases={cases} onNew={() => setScreen('new')} onView={c => { setSelectedCase(c); setScreen('detail'); }} />
      ) : screen === 'new' ? (
        <AssessmentForm onSubmit={handleSubmit} loading={loading} />
      ) : screen === 'success' ? (
        <SuccessScreen newCase={newCase} onViewCase={c => { setSelectedCase(c); setScreen('detail'); }} onNewCase={() => setScreen('new')} />
      ) : screen === 'detail' && selectedCase ? (
        <CaseDetail caseData={selectedCase} onBack={() => setScreen('list')} onDownload={() => handleDownloadReport(selectedCase)} />
      ) : null}
    </div>
  );
}
