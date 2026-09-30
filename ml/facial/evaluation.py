"""
PAINSENSE-AI Facial Model Robustness Evaluation
Tests model behavior under varying lighting, angles, and facial Action Unit profiles.
"""

from ml.facial.inference import run_facial_inference

def evaluate_facial_pipeline():
    test_cases = [
        {
            "name": "Acute Pain Expression (High AU4 + AU6/7)",
            "features": {"brow_furrowing": 0.85, "orbital_tightening": 0.75, "mouth_tension": 0.65},
            "lighting": 0.60,
            "expected_level": "High"
        },
        {
            "name": "Subtle Discomfort",
            "features": {"brow_furrowing": 0.35, "orbital_tightening": 0.25, "mouth_tension": 0.15},
            "lighting": 0.50,
            "expected_level": "Mild"
        },
        {
            "name": "Neutral Baseline",
            "features": {"brow_furrowing": 0.05, "orbital_tightening": 0.05, "mouth_tension": 0.05},
            "lighting": 0.55,
            "expected_level": "Low"
        },
        {
            "name": "Low Light Degradation (Severe Under-exposure)",
            "features": {"brow_furrowing": 0.80, "orbital_tightening": 0.70, "mouth_tension": 0.60},
            "lighting": 0.10,
            "expected_warning": True
        }
    ]

    print("\n--- Evaluating Facial Pain Analysis Pipeline ---")
    all_passed = True
    for tc in test_cases:
        res = run_facial_inference(client_features=tc["features"], lighting_score=tc["lighting"])
        if "expected_level" in tc:
            match = res["tension_level"] == tc["expected_level"]
            status = "PASS" if match else "FAIL"
            print(f"[{status}] {tc['name']}: Result={res['tension_level']}, Score={res['grimace_score']}, Conf={res['confidence']}")
            if not match: all_passed = False
        elif "expected_warning" in tc:
            has_warn = len(res["quality_warnings"]) > 0
            status = "PASS" if has_warn else "FAIL"
            print(f"[{status}] {tc['name']}: Warnings={res['quality_warnings']}, Conf={res['confidence']}")
            if not has_warn: all_passed = False

    print("--- Facial Pipeline Evaluation Completed ---\n")
    return all_passed

if __name__ == "__main__":
    evaluate_facial_pipeline()
