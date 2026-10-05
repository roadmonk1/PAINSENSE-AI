# PainSense AI — DEMO WALKTHROUGH
## TYSIC 2026 | Tata Young Social Innovator Challenge | Health Sector

> **Demo Duration:** 3–5 minutes  
> **Problem Addressed:** "How can rural families manage post-discharge care when hospital follow-ups require long travel?"  
> **Solution:** AI-assisted remote post-discharge pain and symptom communication system

---

## Quick Start

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient | `patient@painsense.ai` | `patient123` |
| Caregiver | `caregiver@painsense.ai` | `caregiver123` |
| Doctor / Healthcare | `doctor@painsense.ai` | `doctor123` |

> ⚠️ All data shown is **Demo / Simulated**. It does not represent real patients, hospitals, or clinical outcomes.

---

## 3–5 Minute Demo Walkthrough

### PART 1 — Patient Experience (~2 minutes)

**Step 1: Login as Patient**
- Navigate to `http://localhost:3000`
- Click **Login to Demo** on the landing page
- Login with `patient@painsense.ai` / `patient123`

**Step 2: View the Problem Statement**
- The landing page shows the TYSIC problem: *"How can rural families manage post-discharge care when hospital follow-ups require long travel?"*
- Point out: the solution is accessible multimodal communication — no travel needed

**Step 3: Open Post-Discharge Care**
- Click **Post-Discharge Care** in the navbar (highlighted)
- Show the two existing **demo cases**: PS-1001 (Lower Back, 7/10) and PS-1002 (Abdomen, 4/10)
- Note the **"DEMO DATA"** badge — clearly labelled simulated data

**Step 4: Start a New Assessment**
- Click **Start New Assessment**
- **Step 1 (Context):** Enter discharge date, hospital name (optional)
- **Step 2 (Symptoms):** 
  - Select pain location (e.g., "Lower Back")
  - Move severity slider to 7
  - Select pain type (e.g., "Aching")
  - Select symptoms (e.g., "Stiffness", "Difficulty moving")
  - Type changes: *"Pain is worse than yesterday"*
- **Step 3 (Communication):** Select "Self-Report (Text)" and "Caregiver Observation"
- **Step 4 (Review):** Show the structured review screen → Click **Submit Case**

**Step 5: View Case Summary**
- Success screen confirms submission with case reference (e.g., PS-1003)
- Click **View Case Details** to see the full case
- Show the clear separation:
  - **PATIENT-REPORTED INFORMATION (Primary)** — blue section
  - **AI-ASSISTED OBSERVATIONS (Supportive Only)** — grey section

**Step 6: Download PDF Report**
- Click **Download PDF Report**
- The browser opens a print-ready HTML report
- Show the safety disclaimer: *"PainSense AI is an AI-assisted communication and documentation tool and is not a medical diagnostic device..."*

---

### PART 2 — Healthcare Professional Experience (~2 minutes)

**Step 7: Switch to Healthcare Role**
- Click **Logout** in the navbar
- Login with `doctor@painsense.ai` / `doctor123`
- Navigate to **Healthcare Portal** in the navbar

**Step 8: Review Patient Cases**
- Healthcare Dashboard shows all submitted cases
- Point out:
  - Case PS-1001: 7/10 severity → "Needs Review"
  - Case PS-1002: 4/10 severity → "Reviewed"
  - Your new case (PS-1003+) is also visible
- Search/filter by status or patient name

**Step 9: Open a Case**
- Click **View Case** on PS-1001
- Demonstrate the clearly labelled sections:
  - **PATIENT-REPORTED INFORMATION** (blue, primary) — pain location, severity 7/10, changes since discharge, patient's own words
  - **AI-ASSISTED OBSERVATIONS** (grey, non-diagnostic) — supportive context only
- Show the **Clinical Responsibility** notice

**Step 10: Update Case Status**
- Change status from "Needs Review" to "Reviewed"
- Click **Update Status** — saved instantly

**Step 11: Download Healthcare Report**
- Click **Download Report**
- Shows a professionally structured report with all sections clearly labelled
- Patient-reported information is Section 1 (primary)
- AI observations are Section 2 (supportive only, non-diagnostic)

**Step 12: View Timeline (bonus)**
- Click **View Patient Timeline** from the case detail
- Shows longitudinal history of pain reports over time
- Useful for tracking trends without requiring in-person visits

---

## What PainSense AI Does

✅ Helps patients communicate pain and symptoms through text, voice, camera, and sign language  
✅ Converts patient communication into structured reports for remote healthcare review  
✅ Clearly labels patient-reported information vs AI-assisted observations  
✅ Provides downloadable PDF reports for documentation  
✅ Tracks symptom history over time through a timeline  
✅ Works for rural patients without requiring hospital travel for routine follow-up  

## What PainSense AI Does NOT Do

❌ Diagnose medical conditions  
❌ Replace qualified healthcare professionals  
❌ Guarantee clinical outcomes  
❌ Provide treatment decisions  
❌ Claim clinical validation (this is a demonstration prototype)  

---

## Technical Demo Commands

```bash
# Run the full application (one command)
npm run dev

# Check system health
npm run doctor

# Reset database (re-seeds demo data)
npm run reset
```

---

## Architecture Summary

```
npm run dev
    ↓
scripts/start.js (unified launcher)
    ↓
FastAPI Backend (port 8000)  +  Vite React Frontend (port 3000)
    ↓
SQLite Database (local, auto-seeded with TYSIC demo data)
```

**Backend:** FastAPI + SQLAlchemy + SQLite  
**Frontend:** React 19 + Vite + TailwindCSS  
**ML Modules:** Camera (facial/posture), Voice (NLP + acoustic), Sign language (ASL/ISL), Multimodal fusion  
**New for TYSIC:** Post-discharge case management, healthcare dashboard, PDF reports  

---

## Demo Data Reference

| Case | Patient | Pain | Severity | Status |
|------|---------|------|----------|--------|
| PS-1001 | Alex Morgan (Demo) | Lower Back | 7/10 | Needs Review |
| PS-1002 | Alex Morgan (Demo) | Abdomen | 4/10 | Reviewed |

> All cases are **Demo / Simulated Data** — clearly labelled throughout the application.

---

*PainSense AI — TYSIC 2026 Health Sector*  
*"Making post-discharge care communication more accessible for rural families."*
