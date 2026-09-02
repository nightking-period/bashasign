# BhashaSign (భాషాసైన్ / भाषासाइन)
### Two-Way Multilingual Indian Sign Language (ISL) Communication Platform for Public Administration

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-black.svg)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks_1.0-0097a7.svg)](https://ai.google.dev/edge/mediapipe/solutions/guide)
[![Tests](https://img.shields.io/badge/Tests-50%2F50_Passing-brightgreen.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **BhashaSign** bridges administrative communication barriers between government officers and Deaf / hard-of-hearing citizens in rural Indian public offices (such as Mandal Revenue Offices, Tehsildar offices, and Gram Panchayats). It supports **true bidirectional communication** with on-device AI, Indic Speech-to-Text/TTS, a photorealistic 3D female avatar with isolated 5-finger kinematics, and a custom-trained neural network sign recognition pipeline.

---

## 🏛️ The Problem in Rural India

In rural administrative centers across India (Gram Panchayats, MRO, RDO, Taluk offices):
- Certified Indian Sign Language (ISL) interpreters are almost entirely absent.
- Government officials and Deaf citizens often resort to fragmented writing or gestures, resulting in severe misunderstandings during critical civic services (Aadhaar verification, pension distribution, land records, grievance redressal).
- **Critical Requirement:** The solution must operate with **100% on-device edge processing** to function in rural connectivity dead zones and respect citizen biometric privacy.

---

## ⚡ Two-Way Architecture

```
                       ┌─────────────────────────────────────────────────┐
                       │               BHASHASIGN PLATFORM               │
                       └────────────────────────┬────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
  ┌──────────────────────────────┐                              ┌──────────────────────────────┐
  │  DIRECTION A: STAFF ➔ CITIZEN│                              │  DIRECTION B: CITIZEN ➔ STAFF│
  │                              │                              │                              │
  │ 1. Officer Speaks / Types    │                              │ 1. Citizen Signs to Webcam   │
  │    (Telugu / Hindi / English)│                              │    (Real-time video input)   │
  │                              │                              │                              │
  │ 2. Indic NLP Parser          │                              │ 2. MediaPipe Tasks 1.0       │
  │    (Semantic decomposition)  │                              │    (21 3D landmarks × 2 hands)
  │                              │                              │                              │
  │ 3. ISL Concept Sequence      │                              │ 3. 126-Dim Normalization     │
  │    (Grammatical ordering)    │                              │    (Wrist-centered & scaled) │
  │                              │                              │                              │
  │ 4. Photorealistic 3D Avatar  │                              │ 4. Custom Trained MLP Model  │
  │    (Isolated 5-finger rig)   │                              │    (Softmax prediction <1ms) │
  │                              │                              │                              │
  │ 5. Citizen Observes ISL Signs│                              │ 5. Regional Voice (TTS)      │
  │    (Across the counter)      │                              │    (Spoken aloud to officer) │
  └──────────────────────────────┘                              └──────────────────────────────┘
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                       ┌─────────────────────────────────────────────────┐
                       │       UNIFIED LIVE SESSION WORKSTATION          │
                       │ • Synchronized Turn-Taking Dialogue Stream      │
                       │ • Instant 3D Avatar & Audio Replay              │
                       │ • Official Record Export (JSON & Print Case)    │
                       └─────────────────────────────────────────────────┘
```

---

## 🤖 3D Female ISL Avatar with Isolated 5-Finger Rig

Unlike simplistic cartoon avatars, BhashaSign features a **photorealistic 3D human female avatar** (`female_avatar.glb`) powered by **WebGL Three.js**:
- **Full Humanoid Skeleton (Mixamo Rig):** 14 anatomical joint bones per hand (**28 hand joints** across both hands: `Thumb1..4`, `Index1..4`, `Middle1..4`, `Ring1..4`, `Pinky1..4`).
- **Finger-Isolated Sign Gestures:**
  - **`SHOW`:** Isolated extended index finger pointing directly into the open left palm (other fingers curled tight).
  - **`PENSION`:** High-frequency precision money-rubbing motion between thumb pad and index fingertip.
  - **`AADHAAR` / `CARD`:** L-shape rectangular card framing with both thumbs and index fingers.
  - **`SORRY`:** Clenched fist rubbing circular motion over the chest with an apologetic head tilt.
  - **`THANK_YOU`:** Flat hand extending smoothly from chin forward with a respectful nod.
  - **`HELLO` & `BYE`:** 5-finger spread with rhythmic wrist and arm wave.
- **Facial Blendshapes:** Natural eye blinking every 3.8s and subtle breathing chest expansion.
- **Studio 3-Point Lighting:** Directional key light, fill light, and a warm saffron rim light with ACESFilmic tone mapping.
- **Interactive Camera Controls:** Click & drag horizontal orbit inspection, zoom in/out (`+` / `-`), and compass reset.

---

## 🧠 Machine Learning Pipeline & Evaluation Report

### 1. Dataset Collection (`/collector`)
- Built-in data collection tool with 3-2-1 audio countdown, 2.5s recording window, and keyboard shortcuts (`Space`, `R`, `N`, `P`).
- Collected 36 recorded video clips (`.webm`) across 12 government concepts and 4 signers.

### 2. Landmark Normalization (126 Dimensions)
- Using Google MediaPipe Tasks v1.0 (`hand_landmarker.task`):
  - 21 3D points $\times$ 3 coordinates $(x, y, z) \times 2$ hands = **126 normalized features**.
  - **Translation Invariance:** Centered on the wrist coordinate $(0, 0, 0)$.
  - **Scale Invariance:** Scaled by the Euclidean distance between wrist and middle MCP knuckle.

### 3. Custom MLP Classifier Architecture
```
Input: 126 Normalized Landmark Features
  ├── Dense(128) + He Initialization + ReLU + Dropout(0.2)
  ├── Dense(64)  + ReLU
  └── Dense(14)  + Softmax (12 Core Concepts + IDLE + UNKNOWN)
```

### 4. Training & Validation Results (Session-Level Holdout)
*Data Splitting Rule: Zero frame leakage across train/test splits. 1 full recording clip per concept held out as unseen test data.*

| Metric | Result |
|---|---|
| **Training Frames** | 545 active hand frames |
| **Epochs Trained** | 45 epochs (Adam Optimizer, $\alpha=0.003$) |
| **Final Training Loss** | `0.0298` |
| **Final Training Accuracy** | **99.1%** |
| **Unseen Holdout Test Accuracy** | **46.3%** across 14 classes (Random guess is 7.1%) |
| **Top Sign F1-Scores** | `SHOW`: 0.67 (95.6% recall) · `COME`: 0.55 (77.3% recall) |
| **Inference Latency** | $< 1\text{ms}$ (pure JS tensor forward pass) |
| **Model Weights** | `src/models/sign_classifier_v1/model_weights.json` (757 KB) |

---

## 📱 Modules & Features

| Module | URL | Description |
|---|---|---|
| **Home & Simulation** | `/` | Hero section, interactive pipeline data-flow inspector, mini 3D avatar preview, and 1-click **Judge Demo Tour**. |
| **Live 2-Way Session** | `/session` | Turn-taking government counter workstation, officer STT, citizen camera recognition, dialogue stream, and **Print/JSON Export**. |
| **Communicate (Staff ➔ Citizen)** | `/communicate` | Web Speech voice recognition in Telugu/Hindi/English driving the 3D female avatar with speed controls (0.5×–2.0×). |
| **Sign Recognition (Citizen ➔ Staff)** | `/sign-recognition` | Camera inference running `model_v1`, probability breakdown bar chart, regional translation, and TTS voice output. |
| **Sign Practice Studio** | `/learn` | Interactive learner with 3D avatar demonstrator (0.5× slow-mo) and practice mirror computing real-time gesture match scores. |
| **Dataset Collector** | `/collector` | Video recording and 126-dim landmark extraction tool for retraining `model_v2` with conversational courtesies (`HELLO`, `BYE`, `SORRY`, `THANK_YOU`). |
| **Government Phrasebook** | `/phrasebook` | Categorized directory of 28+ government phrases with Telugu, Hindi, and English translations. |
| **Settings & Accessibility** | `/settings` | High Contrast WCAG AAA mode, font scaling (`normal`, `large`, `xl`), and audio configurations. |

---

## 🛠️ Tech Stack & Dependencies

- **Frontend:** React 19, TypeScript 5.9, Vite 8.2, Tailwind CSS
- **3D Graphics & Kinematics:** Three.js 0.185, GLTFLoader, Mixamo 5-Finger Humanoid Rig
- **Machine Learning & Computer Vision:** Google MediaPipe Tasks v1.0, OpenCV Python, NumPy, Custom Multi-Layer Perceptron (client-side JS tensor execution)
- **Speech APIs:** Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) with `te-IN`, `hi-IN`, `en-IN` support
- **State Management:** Zustand with local storage persistence
- **Testing:** Vitest 4.1, Testing Library, Jest-DOM (50/50 tests passing)

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- Python 3.10+ (for running dataset extraction scripts)
- Google Chrome or Microsoft Edge (for Web Speech API support)

### Installation & Launch
```bash
# 1. Clone repository & install dependencies
git clone https://github.com/your-username/bhashasign.git
cd bhashasign
npm install

# 2. Start the local development server
npm run dev

# 3. Open browser
http://localhost:5173
```

### Running Tests
```bash
# Run all 50 automated tests across 6 test suites
npm test

# Run TypeScript typecheck
npm run typecheck

# Run production build verification
npm run build
```

---

## 🔒 Privacy & Offline Assurance

1. **Zero Cloud Latency:** All computer vision, landmark extraction, and neural network classification execute 100% locally on the client's device using WebGL and WebAssembly.
2. **Biometric Data Protection:** No camera video frames, landmark coordinates, or voice audio are transmitted or stored remotely.
3. **PWA Offline Ready:** Equipped with `public/manifest.webmanifest` and self-contained static model weights for deployment in rural Gram Panchayats with zero internet connectivity.

---

## 📄 License & Attribution
- Licensed under the **MIT License**.
- 3D Humanoid Model based on CC-BY Ready Player Me / Mixamo humanoid armature.
