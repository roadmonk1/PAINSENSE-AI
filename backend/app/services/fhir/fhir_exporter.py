"""
PAINSENSE-AI FHIR R4 Prototype Exporter
Maps multimodal pain assessments into standardized HL7 FHIR R4 JSON resources.
Resources produced:
- Patient
- Observation (Pain Numeric Rating Scale - LOINC 72514-3)
- Observation (Multimodal AI Clinical Handover Telemetry)
- Condition (Reported Symptom Presentation - VerificationStatus: unconfirmed)
- Bundle (Type: collection)
"""

import datetime
from typing import Dict, Any, Optional

class FHIRExporter:
    """Exports assessment data into FHIR R4 compliant JSON structures."""

    @classmethod
    def export_assessment_to_fhir(
        cls,
        assessment_id: int,
        patient_id: int,
        patient_name: str,
        severity_score: int,
        pain_location: str,
        pain_type: str,
        summary_text: str,
        triage_level: str,
        timestamp: Optional[datetime.datetime] = None
    ) -> Dict[str, Any]:
        dt_str = (timestamp or datetime.datetime.utcnow()).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 1. Patient Resource
        patient_resource = {
            "resourceType": "Patient",
            "id": f"painsense-patient-{patient_id}",
            "identifier": [
                {
                    "system": "urn:ietf:rfc:3986",
                    "value": f"urn:uuid:painsense-user-{patient_id}"
                }
            ],
            "active": True,
            "name": [
                {
                    "use": "usual",
                    "text": patient_name
                }
            ]
        }

        # 2. Pain Intensity Observation (LOINC 72514-3: Pain severity - 0-10 verbal numeric rating score)
        pain_observation = {
            "resourceType": "Observation",
            "id": f"obs-pain-intensity-{assessment_id}",
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                            "code": "vital-signs",
                            "display": "Vital Signs"
                        }
                    ]
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "72514-3",
                        "display": "Pain severity - 0-10 verbal numeric rating score"
                    }
                ],
                "text": "Pain Numeric Rating Scale (0-10)"
            },
            "subject": {
                "reference": f"Patient/painsense-patient-{patient_id}",
                "display": patient_name
            },
            "effectiveDateTime": dt_str,
            "valueInteger": int(severity_score),
            "bodySite": {
                "text": pain_location
            },
            "note": [
                {
                    "text": f"Subjective pain character: {pain_type}. Location: {pain_location}."
                }
            ]
        }

        # 3. Multimodal Telemetry Observation
        telemetry_observation = {
            "resourceType": "Observation",
            "id": f"obs-telemetry-{assessment_id}",
            "status": "preliminary",
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "11450-4",
                        "display": "Problem list - Reported"
                    }
                ],
                "text": "PAINSENSE-AI Multimodal Clinical Handover Telemetry"
            },
            "subject": {
                "reference": f"Patient/painsense-patient-{patient_id}",
                "display": patient_name
            },
            "effectiveDateTime": dt_str,
            "valueString": summary_text,
            "interpretation": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                            "code": "A" if triage_level in ["emergency", "urgent"] else "N",
                            "display": "Abnormal / Urgent Triage" if triage_level in ["emergency", "urgent"] else "Normal"
                        }
                    ],
                    "text": f"Triage Priority: {triage_level.upper()}"
                }
            ]
        }

        # 4. Condition Resource (Unconfirmed / Non-diagnostic Handover)
        condition_resource = {
            "resourceType": "Condition",
            "id": f"cond-presentation-{assessment_id}",
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active",
                        "display": "Active"
                    }
                ]
            },
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "unconfirmed",
                        "display": "Unconfirmed"
                    }
                ],
                "text": "Reported Symptom Episode — Not a definitive diagnosis"
            },
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                            "code": "encounter-diagnosis",
                            "display": "Encounter Finding"
                        }
                    ]
                }
            ],
            "code": {
                "text": f"Acute discomfort presentation in {pain_location}"
            },
            "subject": {
                "reference": f"Patient/painsense-patient-{patient_id}",
                "display": patient_name
            },
            "recordedDate": dt_str
        }

        # 5. FHIR R4 Bundle
        bundle = {
            "resourceType": "Bundle",
            "id": f"painsense-bundle-{assessment_id}",
            "meta": {
                "lastUpdated": dt_str,
                "profile": ["http://hl7.org/fhir/StructureDefinition/Bundle"]
            },
            "type": "collection",
            "entry": [
                {"fullUrl": f"urn:uuid:patient-{patient_id}", "resource": patient_resource},
                {"fullUrl": f"urn:uuid:obs-pain-{assessment_id}", "resource": pain_observation},
                {"fullUrl": f"urn:uuid:obs-telemetry-{assessment_id}", "resource": telemetry_observation},
                {"fullUrl": f"urn:uuid:cond-{assessment_id}", "resource": condition_resource}
            ],
            "_export_notice": "FHIR-compatible prototype export. Designed for EHR integration testing."
        }

        return bundle

fhir_exporter = FHIRExporter()
