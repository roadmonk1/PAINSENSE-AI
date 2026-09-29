import datetime
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from backend.app.config import settings

class CallProvider(ABC):
    @abstractmethod
    def initiate_call(self, target: str, summary_text: str, phone_number: Optional[str] = None) -> Dict[str, Any]:
        pass

class DemoCallProvider(CallProvider):
    """
    Functional, deterministic demo provider clearly labeled as Demo Call Mode.
    Ensures safe demonstration without fabricating live PSTN telephone calls.
    """
    def initiate_call(self, target: str, summary_text: str, phone_number: Optional[str] = None) -> Dict[str, Any]:
        target_name = {
            "doctor": "On-Duty Clinical Triage / Dr. Sarah Lin",
            "caregiver": "Designated Family Caregiver / Emergency Contact",
            "emergency": "Emergency Medical Dispatcher (Simulated)"
        }.get(target, "Healthcare Representative")

        resolved_phone = phone_number or ("+1 (800) 555-0199" if target == "emergency" else "+1 (555) 012-3456")

        return {
            "provider": "Demo Call Mode",
            "status": "connected",
            "target_name": target_name,
            "target_phone": resolved_phone,
            "handover_summary_delivered": True,
            "simulated_latency_ms": 120,
            "connection_encryption": "Simulated TLS 1.3 / SRTP",
            "notes": "Demonstration call session active. Clinical handover summary displayed in real-time on clinician console.",
            "disclaimer": "DEMO CALL MODE: This is a prototype call simulation. No live emergency or telephony connection was dispatched."
        }

class CallService:
    def __init__(self):
        self.provider = DemoCallProvider()

    def request_call(self, target: str, summary_text: str, phone_number: Optional[str] = None) -> Dict[str, Any]:
        telemetry = self.provider.initiate_call(target, summary_text, phone_number)
        return {
            "session_id": int(datetime.datetime.utcnow().timestamp()),
            "target": target,
            "provider": telemetry["provider"],
            "status": telemetry["status"],
            "message": f"Connected to {telemetry['target_name']} ({telemetry['provider']})",
            "summary_text": summary_text,
            "telemetry": telemetry
        }

call_service = CallService()
