import pytest
from backend.app.services.fhir.fhir_exporter import FHIRExporter

def test_fhir_bundle_structure():
    bundle = FHIRExporter.export_assessment_to_fhir(
        assessment_id=42,
        patient_id=7,
        patient_name="Alex Mercer",
        severity_score=8,
        pain_location="Chest",
        pain_type="sharp",
        summary_text="Patient self-reported severe thoracic pain.",
        triage_level="urgent"
    )

    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "collection"
    assert len(bundle["entry"]) >= 3

    resource_types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
    assert "Patient" in resource_types
    assert "Observation" in resource_types
    assert "Condition" in resource_types

    # Find patient
    patient = next(e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Patient")
    assert patient["name"][0]["text"] == "Alex Mercer"

    # Find pain observation (LOINC 72514-3)
    pain_obs = next(
        e["resource"] for e in bundle["entry"] 
        if e["resource"]["resourceType"] == "Observation" and "obs-pain-intensity" in e["resource"]["id"]
    )
    assert pain_obs["code"]["coding"][0]["code"] == "72514-3"
    assert pain_obs["valueInteger"] == 8

    # Find condition and verify unconfirmed status (AI non-diagnostic rule)
    condition = next(e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Condition")
    assert condition["verificationStatus"]["coding"][0]["code"] == "unconfirmed"
