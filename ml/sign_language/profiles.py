"""
PAINSENSE-AI Sign Language Profiles (ASL & ISL)
Defines distinct sign language profiles with separate vocabularies, handshapes, and grammars.
Explicitly avoids conflating American Sign Language (ASL) and Indian Sign Language (ISL).
"""

from typing import Dict, Any, List, Optional, Tuple, Set
from pydantic import BaseModel, Field

class SignDefinition(BaseModel):
    token: str
    concept: str
    category: str  # symptom, anatomy, action, intensity, emergency, modifier, systemic
    handshape: str
    movement_description: str
    one_handed: bool = True

class SignLanguageProfile(BaseModel):
    language_code: str
    language_name: str
    region: str
    version: str = "1.2.0"
    cultural_context: str
    vocabulary: Dict[str, SignDefinition]
    phrase_patterns: List[Tuple[Set[str], str, str]]

# --- 1. AMERICAN SIGN LANGUAGE (ASL) PROFILE ---
ASL_VOCABULARY = {
    "pain": SignDefinition(token="pain", concept="Pain / Hurt", category="symptom", handshape="Index fingers pointing towards each other", movement_description="Twisting motion toward pain location", one_handed=False),
    "help": SignDefinition(token="help", concept="Request Assistance", category="action", handshape="Closed fist on flat palm", movement_description="Upward elevation", one_handed=False),
    "doctor": SignDefinition(token="doctor", concept="Physician / Clinician", category="action", handshape="Bent B-hand tap on wrist", movement_description="Double tap on radial pulse", one_handed=False),
    "emergency": SignDefinition(token="emergency", concept="Urgent Danger / Emergency", category="emergency", handshape="E-hand", movement_description="Rapid side-to-side shake", one_handed=True),
    "yes": SignDefinition(token="yes", concept="Affirmative", category="action", handshape="S-fist", movement_description="Nodding motion like a head", one_handed=True),
    "no": SignDefinition(token="no", concept="Negative", category="action", handshape="Index and middle finger tap thumb", movement_description="Closing snap", one_handed=True),
    "where": SignDefinition(token="where", concept="Query Location", category="action", handshape="Index finger extended", movement_description="Side to side wag", one_handed=True),
    "severe": SignDefinition(token="severe", concept="Severe / Intense (8-10)", category="intensity", handshape="Claw-5 hand", movement_description="Tense downward pulling motion", one_handed=True),
    "mild": SignDefinition(token="mild", concept="Mild / Slight (1-3)", category="intensity", handshape="Flat open hand", movement_description="Gentle downward stroke", one_handed=True),
    "head": SignDefinition(token="head", concept="Head / Cranial", category="anatomy", handshape="Bent palm", movement_description="Touches temple and chin", one_handed=True),
    "chest": SignDefinition(token="chest", concept="Chest / Thoracic", category="anatomy", handshape="Open palm or flat-B", movement_description="Touches center chest", one_handed=True),
    "stomach": SignDefinition(token="stomach", concept="Stomach / Abdominal", category="anatomy", handshape="Flat palm", movement_description="Circular rub over abdomen", one_handed=True),
    "back": SignDefinition(token="back", concept="Back / Spine", category="anatomy", handshape="A-hand or flat palm", movement_description="Reaches around to dorsal lumbar", one_handed=True),
    "arm": SignDefinition(token="arm", concept="Arm / Upper Limb", category="anatomy", handshape="Flat hand", movement_description="Strokes opposite forearm", one_handed=False),
    "leg": SignDefinition(token="leg", concept="Leg / Lower Limb", category="anatomy", handshape="V-hand or open palm", movement_description="Points down thigh", one_handed=True),
    "stop": SignDefinition(token="stop", concept="Halt / Cease Exam", category="action", handshape="Flat open hand strikes palm", movement_description="Definite downward chop", one_handed=False),
    "more": SignDefinition(token="more", concept="Increasing Intensity", category="modifier", handshape="Flattened O-hands", movement_description="Fingertips tap together", one_handed=False),
    "less": SignDefinition(token="less", concept="Decreasing / Subsiding", category="modifier", handshape="Flat palms horizontal", movement_description="Space between hands closes", one_handed=False),
    # Expanded healthcare concepts
    "dizziness": SignDefinition(token="dizziness", concept="Dizziness / Vertigo", category="systemic", handshape="Claw hand circling head", movement_description="Circular orbit near forehead", one_handed=True),
    "nausea": SignDefinition(token="nausea", concept="Nausea / Sick Stomach", category="systemic", handshape="Curved claw on stomach", movement_description="Upward churning motion", one_handed=True),
    "breathing_difficulty": SignDefinition(token="breathing_difficulty", concept="Shortness of Breath", category="systemic", handshape="Both open hands on chest", movement_description="Rapid shallow heave", one_handed=False),
    "fever": SignDefinition(token="fever", concept="High Temperature / Fever", category="systemic", handshape="Back of hand on forehead", movement_description="Touches forehead then shakes", one_handed=True),
    "weakness": SignDefinition(token="weakness", concept="Body Weakness / Fatigue", category="systemic", handshape="V-fingers buckling on palm", movement_description="Legs collapse", one_handed=False),
    "medication": SignDefinition(token="medication", concept="Medicine / Pill", category="action", handshape="Middle finger taps open palm", movement_description="Twisting grind", one_handed=False),
    "injury": SignDefinition(token="injury", concept="Accident / Physical Trauma", category="symptom", handshape="S-hands collide", movement_description="Impact collision", one_handed=False),
    "duration": SignDefinition(token="duration", concept="Time Duration / How Long", category="modifier", handshape="Index traces wrist watch", movement_description="Points to wrist then outward", one_handed=False),
}

ASL_PATTERNS = [
    ({"pain", "chest", "severe"}, "Severe chest pain", "emergency"),
    ({"pain", "chest", "breathing_difficulty"}, "Chest pain with shortness of breath", "emergency"),
    ({"pain", "head", "severe"}, "Severe sudden headache", "urgent"),
    ({"pain", "stomach", "severe"}, "Severe acute abdominal pain", "urgent"),
    ({"pain", "stomach", "mild"}, "Mild stomach discomfort", "routine"),
    ({"pain", "back", "severe"}, "Severe lumbar back pain", "urgent"),
    ({"pain", "back", "mild"}, "Mild back stiffness", "routine"),
    ({"help", "emergency"}, "Emergency assistance requested immediately", "emergency"),
    ({"help", "doctor"}, "Consultation with doctor requested", "call_doctor"),
    ({"fever", "weakness"}, "Fever with generalized body weakness", "urgent"),
    ({"dizziness", "nausea"}, "Dizziness accompanied by nausea", "caution"),
    ({"injury", "arm"}, "Reported arm injury / trauma", "urgent"),
    ({"injury", "leg"}, "Reported leg injury / trauma", "urgent"),
    ({"medication", "pain"}, "Inquiring or requesting pain medication", "routine"),
    ({"pain", "stop"}, "Requesting immediate pause in current movement", "pause")
]

# --- 2. INDIAN SIGN LANGUAGE (ISL) PROFILE ---
ISL_VOCABULARY = {
    "pain": SignDefinition(token="pain", concept="Dard / Pain (ISL)", category="symptom", handshape="Curved claw near body part", movement_description="Rhythmic pulsing squeeze", one_handed=True),
    "help": SignDefinition(token="help", concept="Madad / Request Help (ISL)", category="action", handshape="Both open palms facing up", movement_description="Approaching outward gesture", one_handed=False),
    "doctor": SignDefinition(token="doctor", concept="Doctor / Stethoscope (ISL)", category="action", handshape="Curved fingers from ear to chest", movement_description="Mimics stethoscope ear-to-chest motion", one_handed=False),
    "emergency": SignDefinition(token="emergency", concept="Khatra / Emergency (ISL)", category="emergency", handshape="Raised open palm with rapid waving", movement_description="Urgent oscillating motion", one_handed=True),
    "yes": SignDefinition(token="yes", concept="Haan / Yes (ISL)", category="action", handshape="Nodding closed fist or downward hand sweep", movement_description="Downward assertive stroke", one_handed=True),
    "no": SignDefinition(token="no", concept="Nahi / No (ISL)", category="action", handshape="Index finger vertical", movement_description="Horizontal sweep across chest", one_handed=True),
    "where": SignDefinition(token="where", concept="Kahan / Where (ISL)", category="action", handshape="Both open palms turning up", movement_description="Lateral outward rotation", one_handed=False),
    "severe": SignDefinition(token="severe", concept="Bahut Zyada / Intense (ISL)", category="intensity", handshape="Tight clenched fists trembling", movement_description="Intense isometric hold", one_handed=False),
    "mild": SignDefinition(token="mild", concept="Thoda / Mild (ISL)", category="intensity", handshape="Thumb and index pinch close", movement_description="Small gap gesture", one_handed=True),
    "head": SignDefinition(token="head", concept="Sar / Head (ISL)", category="anatomy", handshape="Flat hand", movement_description="Taps side of forehead", one_handed=True),
    "chest": SignDefinition(token="chest", concept="Chaati / Chest (ISL)", category="anatomy", handshape="Flat open hand", movement_description="Placed firmly on sternum", one_handed=True),
    "stomach": SignDefinition(token="stomach", concept="Pet / Abdomen (ISL)", category="anatomy", handshape="Curved palm", movement_description="Pats abdomen twice", one_handed=True),
    "back": SignDefinition(token="back", concept="Peeth / Back (ISL)", category="anatomy", handshape="Thumb pointing back over shoulder", movement_description="Backward gesture pointing to spine", one_handed=True),
    "arm": SignDefinition(token="arm", concept="Haath / Arm (ISL)", category="anatomy", handshape="Opposite hand grasps forearm", movement_description="Enclosing forearm", one_handed=False),
    "leg": SignDefinition(token="leg", concept="Tāng / Leg (ISL)", category="anatomy", handshape="Flat hand pats thigh", movement_description="Pats thigh twice", one_handed=True),
    "stop": SignDefinition(token="stop", concept="Ruko / Stop (ISL)", category="action", handshape="Vertical palm facing forward", movement_description="Pushing away barrier gesture", one_handed=True),
    "more": SignDefinition(token="more", concept="Zyada / Increasing (ISL)", category="modifier", handshape="Open hand rising upward", movement_description="Upward ascending step", one_handed=True),
    "less": SignDefinition(token="less", concept="Kam / Decreasing (ISL)", category="modifier", handshape="Flat palm descending", movement_description="Downward descending level", one_handed=True),
    # Expanded ISL concepts
    "fever": SignDefinition(token="fever", concept="Bukhar / Fever (ISL)", category="systemic", handshape="Back of hand placed on forehead", movement_description="Check temperature gesture", one_handed=True),
    "dizziness": SignDefinition(token="dizziness", concept="Chakkar / Dizziness (ISL)", category="systemic", handshape="Index finger spinning in circle near head", movement_description="Rotational vortex above crown", one_handed=True),
    "breathing_difficulty": SignDefinition(token="breathing_difficulty", concept="Saans / Breathing Distress (ISL)", category="systemic", handshape="Both hands grasping throat/chest", movement_description="Straining respiratory heave", one_handed=False),
    "nausea": SignDefinition(token="nausea", concept="Uulti / Nausea (ISL)", category="systemic", handshape="Cupped hand moving from throat outward", movement_description="Outward ejection gesture", one_handed=True),
    "weakness": SignDefinition(token="weakness", concept="Kamzori / Weakness (ISL)", category="systemic", handshape="Drooping limp hands", movement_description="Downward drooping flutter", one_handed=False),
    "medication": SignDefinition(token="medication", concept="Dawai / Medicine (ISL)", category="action", handshape="Pinching thumb and index to mouth", movement_description="Swallowing pill gesture", one_handed=True),
    "injury": SignDefinition(token="injury", concept="Chot / Injury (ISL)", category="symptom", handshape="Fist striking open palm", movement_description="Direct blunt impact", one_handed=False),
    "duration": SignDefinition(token="duration", concept="Kabse / Since When (ISL)", category="modifier", handshape="Tapping wrist watch repeatedly", movement_description="Double tap on wrist watch", one_handed=False),
}

ISL_PATTERNS = [
    ({"pain", "chest", "severe"}, "Severe chest pain (ISL)", "emergency"),
    ({"pain", "chest", "breathing_difficulty"}, "Chest pain with severe breathing distress (ISL)", "emergency"),
    ({"pain", "head", "severe"}, "Severe acute head pain (ISL)", "urgent"),
    ({"pain", "stomach", "severe"}, "Severe abdominal pain (ISL)", "urgent"),
    ({"pain", "stomach", "mild"}, "Mild stomach discomfort (ISL)", "routine"),
    ({"help", "emergency"}, "Immediate emergency help needed (ISL)", "emergency"),
    ({"help", "doctor"}, "Need to consult doctor (ISL)", "call_doctor"),
    ({"fever", "weakness"}, "Fever with severe physical weakness (ISL)", "urgent"),
    ({"dizziness", "nausea"}, "Dizziness with nausea (ISL)", "caution"),
    ({"medication", "pain"}, "Need medication for pain relief (ISL)", "routine"),
]

ASL_PROFILE = SignLanguageProfile(
    language_code="asl",
    language_name="American Sign Language",
    region="North America",
    cultural_context="Grammar typically uses Topic-Comment syntax with two-handed symmetry and specific non-manual facial markers.",
    vocabulary=ASL_VOCABULARY,
    phrase_patterns=ASL_PATTERNS
)

ISL_PROFILE = SignLanguageProfile(
    language_code="isl",
    language_name="Indian Sign Language",
    region="India & South Asia",
    cultural_context="Grammar typically follows Subject-Object-Verb (SOV) structure with distinctive culturally shared healthcare gestures.",
    vocabulary=ISL_VOCABULARY,
    phrase_patterns=ISL_PATTERNS
)

SUPPORTED_PROFILES = {
    "asl": ASL_PROFILE,
    "isl": ISL_PROFILE
}

def get_profile(language_code: str = "asl") -> SignLanguageProfile:
    return SUPPORTED_PROFILES.get(language_code.lower().strip(), ASL_PROFILE)
