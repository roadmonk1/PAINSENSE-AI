const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function analyzeCamera(clientFeatures = {}) {
  const res = await fetch(`${API_BASE}/camera/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_features: clientFeatures })
  });
  return res.json();
}

export async function analyzeVoice(transcript, acousticFeatures = {}) {
  const res = await fetch(`${API_BASE}/voice/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, acoustic_features: acousticFeatures })
  });
  return res.json();
}

export async function analyzeSignSequence(signs, confidenceScores = []) {
  const res = await fetch(`${API_BASE}/sign-language/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signs, confidence_scores: confidenceScores })
  });
  return res.json();
}

export async function submitSignFeedback(feedback) {
  const res = await fetch(`${API_BASE}/sign-language/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });
  return res.json();
}

export async function getSignVocabulary() {
  const res = await fetch(`${API_BASE}/sign-language/vocabulary`);
  return res.json();
}

export async function performFusionAndSave(data) {
  const res = await fetch(`${API_BASE}/assessment/fuse-and-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getAssessmentHistory() {
  const res = await fetch(`${API_BASE}/assessment/history`);
  return res.json();
}

export async function getTimeline(severity = null, modality = null) {
  let url = `${API_BASE}/timeline`;
  const params = new URLSearchParams();
  if (severity) params.append('severity', severity);
  if (modality) params.append('modality', modality);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url);
  return res.json();
}

export async function getDoctorSummary(assessmentId) {
  const res = await fetch(`${API_BASE}/doctor/summary/${assessmentId}`);
  return res.json();
}

export async function requestCall(target, assessmentId = null, phoneNumber = null) {
  const res = await fetch(`${API_BASE}/doctor/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, assessment_id: assessmentId, phone_number: phoneNumber })
  });
  return res.json();
}

export async function getCaregiverDashboard() {
  const res = await fetch(`${API_BASE}/caregiver/dashboard`);
  return res.json();
}

export async function triggerCaregiverAlert(patientId, alertLevel, message, assessmentId = null) {
  const res = await fetch(`${API_BASE}/caregiver/alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reported_symptoms: symptoms,
      pain_location: location,
      severity_score: severity
    })
  });
  return res.json();
}

export async function getPrivacyConsent() {
  const res = await fetch(`${API_BASE}/privacy/consent`);
  return res.json();
}

export async function updatePrivacyConsent(consent) {
  const res = await fetch(`${API_BASE}/privacy/consent`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consent)
  });
  return res.json();
}

export async function deleteUserData() {
  const res = await fetch(`${API_BASE}/privacy/data`, { method: 'DELETE' });
  return res.json();
}
