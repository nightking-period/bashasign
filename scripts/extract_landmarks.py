"""
BhashaSign — MediaPipe Landmark Extractor (Tasks API v1.0)
Processes recorded .webm video clips and extracts 126-dimensional normalized
hand landmarks for custom ISL model training.
"""

import os
import glob
import json
import math
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

def normalize_single_hand(landmarks):
    """
    Normalize 21 landmarks:
    1. Wrist at origin (0, 0, 0)
    2. Scale normalized by wrist-to-middle-finger-MCP distance (idx 0 to 9)
    Returns: 63 floats
    """
    if not landmarks or len(landmarks) < 21:
        return [0.0] * 63

    wrist = landmarks[0]
    mcp_middle = landmarks[9]

    dx = mcp_middle.x - wrist.x
    dy = mcp_middle.y - wrist.y
    dz = mcp_middle.z - wrist.z
    scale = math.sqrt(dx * dx + dy * dy + dz * dz)
    if scale < 1e-5:
        scale = 1.0

    normalized = []
    for lm in landmarks:
        normalized.extend([
            (lm.x - wrist.x) / scale,
            (lm.y - wrist.y) / scale,
            (lm.z - wrist.z) / scale,
        ])
    return normalized

def extract_landmarks_from_video(video_path, detector):
    """
    Extracts normalized 126-dim features for each frame of a video clip.
    """
    cap = cv2.VideoCapture(video_path)
    frames_data = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        results = detector.detect(mp_image)

        right_features = [0.0] * 63
        left_features = [0.0] * 63
        hands_detected = 0

        if results.hand_landmarks and results.handedness:
            hands_detected = len(results.hand_landmarks)
            for idx, hand_cats in enumerate(results.handedness):
                label = hand_cats[0].category_name  # 'Left' or 'Right'
                lms = results.hand_landmarks[idx]
                norm_feats = normalize_single_hand(lms)
                if label == 'Right':
                    right_features = norm_feats
                else:
                    left_features = norm_feats

            # Fallback if both assigned same or single hand
            if right_features == [0.0] * 63 and left_features == [0.0] * 63 and len(results.hand_landmarks) > 0:
                right_features = normalize_single_hand(results.hand_landmarks[0])
                if len(results.hand_landmarks) > 1:
                    left_features = normalize_single_hand(results.hand_landmarks[1])

        combined_features = right_features + left_features
        frames_data.append({
            "frameIndex": frame_idx,
            "timestamp": frame_idx * 33,  # ~30fps
            "features": combined_features,
            "handsDetected": hands_detected
        })
        frame_idx += 1

    cap.release()
    return frames_data

def process_all_recordings():
    print("=" * 65)
    print("      BHASHASIGN — MEDIAPIPE VIDEO LANDMARK EXTRACTION       ")
    print("=" * 65)

    raw_dir = os.path.join("recordings", "raw")
    processed_dir = os.path.join("recordings", "processed", "landmarks")
    os.makedirs(processed_dir, exist_ok=True)

    model_path = os.path.join("scripts", "hand_landmarker.task")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.35,
        min_hand_presence_confidence=0.35,
        min_tracking_confidence=0.35
    )
    detector = vision.HandLandmarker.create_from_options(options)

    video_files = glob.glob(os.path.join(raw_dir, "**", "*.webm"), recursive=True)
    print(f"Found {len(video_files)} recorded video clips in {raw_dir}\n")

    processed_count = 0
    total_frames_extracted = 0
    total_hands_detected = 0

    for vpath in video_files:
        filename = os.path.basename(vpath)
        sample_id = os.path.splitext(filename)[0]
        concept = sample_id.split("_")[0]

        frames = extract_landmarks_from_video(vpath, detector)
        if not frames:
            print(f"  ⚠ Warning: No frames decoded for {filename}")
            continue

        # Save extracted landmarks JSON
        out_json = os.path.join(processed_dir, f"{sample_id}.json")
        data = {
            "sampleId": sample_id,
            "concept": concept,
            "frames": frames
        }
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(data, f)

        non_empty_frames = sum(1 for fr in frames if fr["handsDetected"] > 0)
        total_frames_extracted += len(frames)
        total_hands_detected += non_empty_frames

        pct = (non_empty_frames / max(len(frames), 1)) * 100
        print(f"  [OK] {concept.ljust(12)} | {sample_id} | {len(frames)} frames ({non_empty_frames} with hands: {pct:.1f}%)")
        processed_count += 1


    print("\n" + "=" * 65)
    print("Extraction Complete!")
    print(f"  - Processed videos:       {processed_count}")
    print(f"  - Total frames extracted: {total_frames_extracted}")
    print(f"  - Frames with hands:      {total_hands_detected} ({(total_hands_detected/max(total_frames_extracted,1))*100:.1f}%)")
    print(f"  - Destination directory:  {processed_dir}")
    print("=" * 65)


if __name__ == "__main__":
    process_all_recordings()
