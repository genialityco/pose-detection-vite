import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";

let detector: poseDetection.PoseDetector | null = null;

export async function initPoseDetector(): Promise<void> {
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );
}

export async function getPose(
  video: HTMLVideoElement
): Promise<poseDetection.Pose | null> {
  if (!detector) return null;
  const poses = await detector.estimatePoses(video);
  return poses[0] || null;
}
