# PAINSENSE-AI: HL7 FHIR R4 Interoperability Specification

## 1. Overview
PAINSENSE-AI exports clinical assessments into standard **HL7 FHIR Release 4 (R4)** compliant JSON resources. This allows seamless integration into Hospital Information Systems (HIS), Electronic Health Records (EHR) like Epic, Cerner, and AthenaHealth, and telemedicine provider portals.

---

## 2. API Endpoint
```http
GET /api/assessment/{id}/fhir
Accept: application/fhir+json
```

### Response Type
`Bundle` of `type: collection`.

---

## 3. Resource Mapping Specification

### 3.1 Patient Resource
Identifies the patient associated with the assessment session without leaking extraneous personal identifiers.
- `resourceType`: `"Patient"`
- `id`: `"painsense-patient-{id}"`
- `identifier`: System `"urn:ietf:rfc:3986"` with value `"urn:uuid:painsense-user-{id}"`
- `active`: `true`
- `name`: `[{ "use": "usual", "text": "Patient Name" }]`

### 3.2 Pain Intensity Observation (LOINC 72514-3)
Standardized subjective pain intensity measurement on the Verbal Numeric Rating Scale (0 to 10).
- `resourceType`: `"Observation"`
- `code`:
  - `system`: `"http://loinc.org"`
  - `code`: `"72514-3"`
  - `display`: `"Pain severity - 0-10 verbal numeric rating score"`
- `category`: `"vital-signs"` (`http://terminology.hl7.org/CodeSystem/observation-category`)
- `valueInteger`: Integer from `0` to `10`
- `bodySite.text`: Anatomy location reported by user (e.g., `"Chest"`, `"Lower Back"`, `"Left Knee"`)
- `status`: `"final"`

### 3.3 Multimodal AI Observation (LOINC 11450-4)
Captures AI supportive telemetry, evidential confidence, uncertainty, and communication channel notes.
- `resourceType`: `"Observation"`
- `code`:
  - `system`: `"http://loinc.org"`
  - `code`: `"11450-4"`
  - `display`: `"Problem list - Reported"`
- `component`:
  - Multimodal Pain Classification (categorical: none, mild, moderate, severe)
  - Model Confidence Score (0.0 to 1.0)
  - Triage Priority Level (routine, caution, urgent, emergency)
- `interpretation`:
  - High risk / urgent flags mapped to HL7 interpretation codes (`CR` for Critical, `A` for Abnormal, `N` for Normal).

### 3.4 Condition Resource (Reported Symptom Presentation)
Records clinical presentations while maintaining strict safety disclaimers:
- `resourceType`: `"Condition"`
- `clinicalStatus`: `"active"`
- `verificationStatus`: `"unconfirmed"` (`http://terminology.hl7.org/CodeSystem/condition-ver-status`)
  > **SAFETY RULE**: The verificationStatus is deliberately hardcoded to `"unconfirmed"` because PAINSENSE-AI provides supportive observational data, not certified physician medical diagnoses.

---

## 4. Sample FHIR R4 Bundle Payload
```json
{
  "resourceType": "Bundle",
  "id": "painsense-bundle-42",
  "type": "collection",
  "timestamp": "2026-09-29T10:15:30Z",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-1",
      "resource": {
        "resourceType": "Patient",
        "id": "painsense-patient-1",
        "name": [{ "text": "Alex Morgan" }]
      }
    },
    {
      "fullUrl": "urn:uuid:obs-pain-intensity-42",
      "resource": {
        "resourceType": "Observation",
        "id": "obs-pain-intensity-42",
        "status": "final",
        "code": {
          "coding": [{
            "system": "http://loinc.org",
            "code": "72514-3",
            "display": "Pain severity - 0-10 verbal numeric rating score"
          }]
        },
        "valueInteger": 8,
        "bodySite": { "text": "Chest" }
      }
    },
    {
      "fullUrl": "urn:uuid:condition-symptom-42",
      "resource": {
        "resourceType": "Condition",
        "verificationStatus": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            "code": "unconfirmed"
          }]
        },
        "code": { "text": "Reported Pain Presentation in Chest" }
      }
    }
  ]
}
```
