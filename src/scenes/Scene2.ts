// @ts-nocheck
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

let poseLandmarker = null;
let webcamRunning = false;
let score = 0;

export async function initScene(video) {
  // Configurar resolución reducida para dispositivos móviles
  video.width = 320;
  video.height = 240;

  const canvasElement = document.createElement("canvas");
  canvasElement.width = video.width;
  canvasElement.height = video.height;
  document.body.appendChild(canvasElement);

  const counterElement = document.createElement("div");
  counterElement.style.position = "absolute";
  counterElement.style.top = "10px";
  counterElement.style.left = "10px";
  counterElement.style.fontSize = "20px";
  counterElement.style.color = "white";
  counterElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  counterElement.style.padding = "10px";
  counterElement.style.borderRadius = "5px";
  counterElement.innerText = `Balls Caught: ${score}`;
  document.body.appendChild(counterElement);

  const restartButton = document.createElement("button");
  restartButton.style.position = "absolute";
  restartButton.style.top = "50px";
  restartButton.style.left = "10px";
  restartButton.style.fontSize = "16px";
  restartButton.style.padding = "10px";
  restartButton.style.backgroundColor = "blue";
  restartButton.style.color = "white";
  restartButton.style.border = "none";
  restartButton.style.borderRadius = "5px";
  restartButton.style.cursor = "pointer";
  restartButton.innerText = "Restart";
  document.body.appendChild(restartButton);

  const canvasCtx = canvasElement.getContext("2d");
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
  let balls = generateBalls(5);

  function drawBalls() {
    balls.forEach((ball) => {
      if (!ball.active) return;

      canvasCtx.beginPath();
      canvasCtx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
      canvasCtx.fillStyle = ball.color;
      canvasCtx.fill();
      canvasCtx.closePath();
    });
  }

  function updateBalls() {
    balls.forEach((ball) => {
      if (!ball.active) return;

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (
        ball.x + ball.radius > canvasElement.width ||
        ball.x - ball.radius < 0
      ) {
        ball.vx = -ball.vx;
      }
      if (
        ball.y + ball.radius > canvasElement.height ||
        ball.y - ball.radius < 0
      ) {
        ball.vy = -ball.vy;
      }
    });
  }

  function checkInteractions(landmarks) {
    landmarks.forEach((landmark) => {
      const lx = landmark.x * canvasElement.width;
      const ly = landmark.y * canvasElement.height;

      balls.forEach((ball) => {
        if (!ball.active) return;

        if (
          Math.abs(ball.x - lx) < ball.radius &&
          Math.abs(ball.y - ly) < ball.radius
        ) {
          ball.active = false;
          score++;
          counterElement.innerText = `Balls Caught: ${score}`;
        }
      });
    });
  }

  async function predictWebcam() {
    if (!poseLandmarker || !webcamRunning) return;

    const now = performance.now();

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    updateBalls();
    drawBalls();

    const result = await poseLandmarker.detectForVideo(video, now);
    if (result?.landmarks?.length) {
      const keyLandmarks = result.landmarks[0];
      checkInteractions(keyLandmarks);
    }

    if (balls.some((ball) => ball.active) && webcamRunning) {
      requestAnimationFrame(predictWebcam);
    } else if (!balls.some((ball) => ball.active)) {
      alert(`Game Over! Total Balls Caught: ${score}`);
      webcamRunning = false;
    }
  }

  restartButton.addEventListener("click", () => {
    webcamRunning = false;
    balls = generateBalls(5);
    score = 0;
    counterElement.innerText = `Balls Caught: ${score}`;
    webcamRunning = true;
    predictWebcam();
  });

  predictWebcam();

  return () => {
    webcamRunning = false;
    canvasElement.remove();
    counterElement.remove();
    restartButton.remove();
    poseLandmarker?.close();
    poseLandmarker = null;
  };
}

function generateBalls(count) {
  const balls = [];
  for (let i = 0; i < count; i++) {
    balls.push({
      x: Math.random() * 320,
      y: Math.random() * 240,
      radius: 15,
      color: "red",
      vx: (Math.random() * 2 - 1) * 2,
      vy: (Math.random() * 2 - 1) * 2,
      active: true,
    });
  }
  return balls;
}
