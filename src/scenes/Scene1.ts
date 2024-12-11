import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

const ball = {
  x: 240,
  y: 180,
  radius: 30,
  vx: (Math.random() * 2 - 1) * 5,
  vy: (Math.random() * 2 - 1) * 5,
  color: "#FFEE00",
  speed: 5,
};

let poseLandmarker: PoseLandmarker | null = null;
let webcamRunning = false;

export async function initScene(video: HTMLVideoElement): Promise<() => void> {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  document.body.appendChild(canvasElement);

  const canvasCtx = canvasElement.getContext("2d")!;
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);
  const drawingUtils = new DrawingUtils(canvasCtx);

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });

  webcamRunning = true;

  function drawBall() {
    const gradient = canvasCtx.createRadialGradient(
      ball.x,
      ball.y,
      ball.radius * 0.5,
      ball.x,
      ball.y,
      ball.radius
    );
    gradient.addColorStop(0, "#FFFFFF");
    gradient.addColorStop(0.5, ball.color);
    gradient.addColorStop(1, "#FFEE00");

    canvasCtx.beginPath();
    canvasCtx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    canvasCtx.fillStyle = gradient;
    canvasCtx.fill();
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "#FFFFFF";
    canvasCtx.stroke();
    canvasCtx.closePath();
  }

  function updateBall() {
    const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    ball.vx = (ball.vx / currentSpeed) * ball.speed;
    ball.vy = (ball.vy / currentSpeed) * ball.speed;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x + ball.radius > canvasElement.width || ball.x - ball.radius < 0) {
      ball.vx = -ball.vx;
    }
    if (ball.y + ball.radius > canvasElement.height || ball.y - ball.radius < 0) {
      ball.vy = -ball.vy;
    }
  }

  function checkInteraction(landmarks: any[]) {
    landmarks.forEach((landmark) => {
      const dx = ball.x - landmark.x * canvasElement.width;
      const dy = ball.y - landmark.y * canvasElement.height;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ball.radius) {
        ball.vx = -ball.vx;
        ball.vy = -ball.vy;
        ball.color = "blue";
        setTimeout(() => (ball.color = "#FFEE00"), 200);
      }
    });
  }

  async function predictWebcam() {
    if (!poseLandmarker || !webcamRunning) return;

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    updateBall();
    drawBall();

    const result = await poseLandmarker.detectForVideo(video, performance.now());

    if (result?.landmarks?.length) {
      const keyLandmarks = result.landmarks[0];
      drawingUtils.drawLandmarks(keyLandmarks);
      drawingUtils.drawConnectors(
        keyLandmarks,
        PoseLandmarker.POSE_CONNECTIONS
      );

      checkInteraction(keyLandmarks);
    }

    if (webcamRunning) {
      requestAnimationFrame(predictWebcam);
    }
  }

  // Inicia la predicción
  predictWebcam();

  // Devuelve una función de limpieza
  return () => {
    webcamRunning = false;
    canvasElement.remove();
    poseLandmarker?.close(); // Cierra cualquier recurso usado por PoseLandmarker
    poseLandmarker = null;
  };
}
