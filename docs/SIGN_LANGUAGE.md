# PAINSENSE-AI Sign Language Recognition Architecture

## 1. Supported Language & Linguistic Scope

PAINSENSE-AI explicitly defines its initial supported sign language as:
**American Sign Language (ASL) — Healthcare Distress & Pain Vocabulary**

### Important Linguistic Boundaries:
1. **Sign Language is Not Universal**: ASL, British Sign Language (BSL), French Sign Language (LSF), and Indian Sign Language (ISL) have distinct grammars, fingerspelling conventions, and vocabularies.
2. **Modular Dialect Architecture**: The tokenizer and sequence assembler are decoupled from landmark extractors, enabling drop-in dialect adapters for regional sign languages.

## 2. Core Healthcare Distress Vocabulary

| Sign Token | Concept Meaning | Clinical Category |
| :--- | :--- | :--- |
| `pain` | Pain / Hurt / Soreness | Symptom |
| `help` | Request Assistance | Action |
| `doctor` | Healthcare Professional / Clinician | Entity |
| `emergency` | Immediate Urgent Danger | Urgency |
| `yes` | Affirmative | Response |
| `no` | Negative | Response |
| `where` | Location Query | Query |
| `severe` | High Intensity (8-10/10) | Intensity |
| `mild` | Low Intensity (1-3/10) | Intensity |
| `head` | Cranial Region | Anatomy |
| `chest` | Thoracic Region | Anatomy |
| `stomach` | Abdominal Region | Anatomy |
| `back` | Lumbar / Spinal Region | Anatomy |
| `arm` | Upper Extremity | Anatomy |
| `leg` | Lower Extremity | Anatomy |
| `stop` | Cease Current Movement / Exam | Action |
| `more` | Increasing Intensity | Modifier |
| `less` | Decreasing Intensity | Modifier |

## 3. Sequence Assembly Examples

- `[pain] + [chest] + [severe]` &rarr; **"Severe chest pain"** (Escalates safety triage to Urgent / Emergency)
- `[help] + [emergency]` &rarr; **"Emergency assistance requested immediately"**
- `[pain] + [stomach] + [mild]` &rarr; **"Mild stomach discomfort"**
- `[help] + [doctor]` &rarr; **"Requesting healthcare professional consultation"**
- `[pain] + [more]` &rarr; **"Pain is increasing in intensity"**

## 4. Two-Way Accessibility Response

Upon recognizing a sequence, the system generates a two-way confirmation:
1. **Visual Text**: Large readable message displayed prominently.
2. **Text-to-Speech (TTS)**: Uttered via the Web Speech API (`speakText()`).
3. **Follow-Up Interactive Prompt**: E.g., *"Severe chest pain recorded. Would you like to contact a doctor? [YES] [NO]"*
4. **Correction Feedback Loop**: Users can submit corrections that are saved to `SignRecognitionRecord` for iterative model refinement.
