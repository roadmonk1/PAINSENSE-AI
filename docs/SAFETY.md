# PAINSENSE-AI Clinical Safety & Red Flag Protocol

## 1. Non-Diagnostic Medical Boundary

PAINSENSE-AI is explicitly built under the ethical constraint:
> **The system must NOT diagnose a medical condition.**
> Language used across all interfaces:
> - *"Possible pain indicators detected."*
> - *"Reported symptoms indicate that medical attention may be appropriate."*
> - *"AI-generated assessment — not a medical diagnosis."*
> - Qualified healthcare professionals remain solely responsible for diagnosis and treatment.

## 2. Red Flag Detection Engine

`SafetyAssessmentService` evaluates reported symptoms and signals against clinical emergency triggers:

### Emergency Tier (Immediate 911 / Emergency Department Dispatch):
- Chest pain or pressure radiating to left arm, neck, or jaw
- Acute dyspnea / shortness of breath
- Sudden numbness, weakness, or facial drooping
- Thunderclap headache / sudden loss of consciousness
- Uncontrolled bleeding or deep lacerations

### Urgent Tier (Prompt Healthcare Consultation Required):
- High pain severity ($\ge 8/10$)
- High fever with stiff neck
- Persistent severe abdominal rigidity
- Rapidly spreading rash or allergic signs

## 3. Emergency Contacts & Fallbacks

The system utilizes configurable emergency dispatch routing (`settings.EMERGENCY_DISPATCH_PHONE`), never fabricating random phone numbers. In the event of network disruption or backend latency, client-side safety warnings trigger automatically.
