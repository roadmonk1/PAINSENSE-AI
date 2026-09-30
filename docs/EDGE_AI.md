# PAINSENSE-AI: Edge AI & Client-Side Runtime Architecture

## 1. Overview
PAINSENSE-AI is architected with a **Privacy-Preserving Edge-First Philosophy**. Sensitive biometric telemetry—including real-time facial video feeds, microphone acoustic frames, and continuous sign gesture tracking—is evaluated on-device wherever possible, rather than transmitting raw high-resolution media across public networks.

```
+-------------------------------------------------------------------+
|                        CLIENT DEVICE (BROWSER)                    |
|                                                                   |
|   +-------------------+    +-------------------+                  |
|   | Camera Video Feed |    | Mic Audio Stream  |                  |
|   +---------+---------+    +---------+---------+                  |
|             |                        |                            |
|             v                        v                            |
|   +-------------------+    +-------------------+                  |
|   | MediaPipe FaceMesh|    | Web Audio API     |                  |
|   | & Hands Pipeline  |    | Acoustic Feature  |                  |
|   | (468 pts + 21 pts)|    | Extraction (MFCC) |                  |
|   +---------+---------+    +---------+---------+                  |
|             |                        |                            |
|             v                        v                            |
|   +--------------------------------------------+                  |
|   | ONNX Runtime Web / Local Feature Extraction |                  |
|   | - PSPI Geometric Regressor (AU4, 6/7, 9/10)|                  |
|   | - Temporal Gesture Stabilizer Buffer       |                  |
|   | - Acoustic Pitch & Strain Estimator        |                  |
|   +---------------------+----------------------+                  |
|                         |                                         |
|                         v                                         |
|              Feature Vectors Only                                 |
|         (No Raw Video / Audio Transmitted)                        |
+-------------------------+-----------------------------------------+
                          |
                          v HTTPS / TLS 1.3
+-------------------------------------------------------------------+
|                     PAINSENSE-AI SECURE BACKEND                   |
|   +-----------------------------------------------------------+   |
|   | Evidential Multimodal Fusion & Calibrated Regressors      |   |
|   | - Safety Red-Flag Evaluator                               |   |
|   | - Audit Logging & Clinical Handover Generator             |   |
|   | - HL7 FHIR R4 Bundle Serializer                           |   |
|   +-----------------------------------------------------------+   |
+-------------------------------------------------------------------+
```

---

## 2. On-Device Execution Specifications

| Modality | Client Runtime | Model / Pipeline | Latency Target | Privacy Guarantee |
| :--- | :--- | :--- | :--- | :--- |
| **Facial Analysis** | MediaPipe FaceMesh (WASM/WebGL) | 468 3D landmarks -> Action Unit extraction (AU4, AU6/7, AU9/10, AU25/26/27) | **< 16 ms** (60 FPS) | Raw camera frames never leave browser memory. Only dimensionless geometric ratios are processed. |
| **Sign Language** | MediaPipe Hands + Temporal Buffer | 21-joint 3D hand coordinates -> Velocity, orientation, holding stability | **< 20 ms** per frame | Landmark vectors processed in ring buffer; translated tokens sent to server. |
| **Acoustic Strain** | Web Audio API / ScriptProcessor | Pitch ($F_0$), RMS energy, Jitter local, Tremor index | **< 35 ms** per window | Voice clips can be analyzed locally; raw audio never stored unless patient explicitly grants consent. |

---

## 3. ONNX Runtime Web Architecture

### Model Artifacts & Graph Optimizations
For offline and low-power clinical edge environments:
- **Quantization**: Models are quantized to **INT8** via ONNX Runtime quantization toolchain, reducing binary footprints by **73%** (< 4.2 MB total) while preserving $R^2 \ge 0.94$ regression accuracy.
- **Hardware Acceleration**: Automatically selects WebGL -> WebGPU -> WASM SIMD fallback hierarchy based on client browser hardware capabilities.
- **Zero-Copy Memory Transfers**: Tensors are allocated in WASM linear memory with typed arrays (`Float32Array`) directly interfacing with WebGL framebuffers.

---

## 4. Edge-to-Cloud Privacy Enclave
1. **Local-Only Mode**: Patients may toggle "Local-Only Mode" in Settings. In this state, zero telemetry leaves the client; all fusion and triage recommendations occur in the browser.
2. **Differential Privacy**: In standard connected mode, noise perturbation ($\epsilon = 1.0$) is applied to non-critical auxiliary features to prevent facial reconstruction or voice cloning attacks.
3. **No Biometric Storage**: The PAINSENSE-AI database schema stores only extracted clinical descriptors and numerical scores (`tension_score`, `grimace_score`), never biometric image or voice recordings.
