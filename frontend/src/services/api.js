const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Returns standard headers with JWT Bearer token if logged in.
 */
function getHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('painsense_token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ----------------------------------------------------
// Authentication Services
// ----------------------------------------------------

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed. Please check credentials.');
  }
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('painsense_token', data.access_token);
    localStorage.setItem('painsense_user', JSON.stringify(data.user));
  }
  return data;
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed.');
  }
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('painsense_token', data.access_token);
    localStorage.setItem('painsense_user', JSON.stringify(data.user));
  }
  return data;
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('painsense_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem('painsense_token');
  localStorage.removeItem('painsense_user');
}

// ----------------------------------------------------
// Core Clinical & ML Endpoints
// ----------------------------------------------------

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`, { headers: getHeaders() });
  return res.json();
}

export async function analyzeCamera(clientFeatures = {}) {
  const res = await fetch(`${API_BASE}/camera/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ client_features: clientFeatures })
  });
  return res.json();
}

export async function analyzeVoice(transcript, acousticFeatures = {}) {
  const res = await fetch(`${API_BASE}/voice/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ transcript, acoustic_features: acousticFeatures })
  });
  return res.json();
}

export async function analyzeSignSequence(signs, confidenceScores = [], languageCode = 'asl') {
  const res = await fetch(`${API_BASE}/sign-language/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ signs, confidence_scores: confidenceScores, language_code: languageCode })
  });
  return res.json();
}

export async function submitSignFeedback(feedback) {
  const res = await fetch(`${API_BASE}/sign-language/feedback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(feedback)
  });
  return res.json();
}

export async function getSignVocabulary(lang = 'asl') {
  const res = await fetch(`${API_BASE}/sign-language/vocabulary?lang=${encodeURIComponent(lang)}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function performFusionAndSave(data) {
  const res = await fetch(`${API_BASE}/assessment/fuse-and-save`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getAssessmentHistory() {
  const res = await fetch(`${API_BASE}/assessment/history`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function getAssessmentFhir(assessmentId) {
  const res = await fetch(`${API_BASE}/assessment/${assessmentId}/fhir`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function getTimeline(severity = null, modality = null) {
  let url = `${API_BASE}/timeline`;
  const params = new URLSearchParams();
  if (severity) params.append('severity', severity);
  if (modality) params.append('modality', modality);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
}

export async function getDoctorSummary(assessmentId) {
  const res = await fetch(`${API_BASE}/doctor/summary/${assessmentId}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function requestCall(target, assessmentId = null, phoneNumber = null) {
  const res = await fetch(`${API_BASE}/doctor/call`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ target, assessment_id: assessmentId, phone_number: phoneNumber })
  });
  return res.json();
}

export async function getCaregiverDashboard() {
  const res = await fetch(`${API_BASE}/caregiver/dashboard`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function triggerCaregiverAlert(patientId, alertLevel, message, assessmentId = null) {
  const res = await fetch(`${API_BASE}/caregiver/alert`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      patient_id: patientId,
      alert_level: alertLevel,
      message,
      assessment_id: assessmentId
    })
  });
  return res.json();
}

export async function checkSafety(symptoms, location = '', severity = 0) {
  const res = await fetch(`${API_BASE}/safety/check`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      reported_symptoms: symptoms,
      pain_location: location,
      severity_score: severity
    })
  });
  return res.json();
}

export async function getPrivacyConsent() {
  const res = await fetch(`${API_BASE}/privacy/consent`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function updatePrivacyConsent(consent) {
  const res = await fetch(`${API_BASE}/privacy/consent`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(consent)
  });
  return res.json();
}

export async function deleteUserData() {
  const res = await fetch(`${API_BASE}/privacy/data`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.json();
}

export async function exportUserData() {
  const res = await fetch(`${API_BASE}/privacy/export`, {
    headers: getHeaders()
  });
  return res.json();
}

// ----------------------------------------------------
// Post-Discharge Care (TYSIC 2026)
// ----------------------------------------------------

export async function createPostDischargeCase(data) {
  const res = await fetch(`${API_BASE}/post-discharge/cases`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit case.');
  }
  return res.json();
}

export async function getPatientPostDischargeCases() {
  const res = await fetch(`${API_BASE}/post-discharge/cases`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function getPostDischargeCase(caseId) {
  const res = await fetch(`${API_BASE}/post-discharge/cases/${caseId}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function getPostDischargeCaseReportData(caseId) {
  const res = await fetch(`${API_BASE}/post-discharge/cases/${caseId}/report-data`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function getAllPostDischargeCasesForDoctor() {
  const res = await fetch(`${API_BASE}/post-discharge/doctor/all-cases`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function updateCaseStatus(caseId, status, clinicalNotes = null) {
  const params = new URLSearchParams({ status });
  if (clinicalNotes) params.append('clinical_notes', clinicalNotes);
  const res = await fetch(
    `${API_BASE}/post-discharge/doctor/cases/${caseId}/status?${params.toString()}`,
    { method: 'PUT', headers: getHeaders() }
  );
  return res.json();
}

