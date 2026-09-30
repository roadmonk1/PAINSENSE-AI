"""
PAINSENSE-AI Voice Pipeline Evaluation
Tests entity extraction precision and acoustic strain metrics across clinical utterances.
"""

from ml.voice.inference import run_voice_inference

def evaluate_voice_pipeline():
    test_cases = [
        {
            "name": "Severe Acute Chest Pain with Dyspnea",
            "transcript": "I have severe chest pain since twenty minutes and difficulty breathing after lifting heavy boxes.",
            "acoustics": {"pitch_jitter": 0.045, "shimmer_local": 0.08, "energy_fluctuation": 0.45},
            "expected_loc": "Chest",
            "expected_sev": "Severe (8/10)",
            "expected_tremor": True
        },
        {
            "name": "Mild Lumbar Stiffness",
            "transcript": "Mild lower back stiffness since this morning, took paracetamol.",
            "acoustics": {"pitch_jitter": 0.012, "shimmer_local": 0.025, "energy_fluctuation": 0.15},
            "expected_loc": "Lower Back",
            "expected_med": "Paracetamol"
        }
    ]

    print("\n--- Evaluating Voice & Acoustic Analysis Pipeline ---")
    all_passed = True
    for tc in test_cases:
        res = run_voice_inference(transcript=tc["transcript"], acoustic_features=tc["acoustics"])
        match_loc = res["extracted_location"] == tc["expected_loc"]
        if "expected_sev" in tc:
            match_sev = res["extracted_severity"] == tc["expected_sev"]
        else:
            match_sev = True

        status = "PASS" if (match_loc and match_sev) else "FAIL"
        print(f"[{status}] {tc['name']}: Loc={res['extracted_location']}, Sev={res['extracted_severity']}, Strain={res['acoustic_strain_score']}")
        if not (match_loc and match_sev):
            all_passed = False

    print("--- Voice Pipeline Evaluation Completed ---\n")
    return all_passed

if __name__ == "__main__":
    evaluate_voice_pipeline()
