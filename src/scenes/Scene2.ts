// @ts-nocheck
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

let poseLandmarker: PoseLandmarker | null = null;
let webcamRunning = false;
let score = 0;

export async function initScene(video: HTMLVideoElement): Promise<() => void> {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  document.body.appendChild(canvasElement);

  // Crear el contador
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

  // Crear el botón de Restart
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
  let balls = generateBalls(10);

  function drawBalls() {
    balls.forEach((ball) => {
      if (!ball.active && ball.animationFrame === null) return;

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
      gradient.addColorStop(1, ball.color);

      canvasCtx.beginPath();
      canvasCtx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
      canvasCtx.fillStyle = gradient;
      canvasCtx.fill();
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "#FFFFFF";
      canvasCtx.stroke();
      canvasCtx.closePath();
    });
  }

  function updateBalls() {
    balls.forEach((ball) => {
      if (!ball.active) return;

      const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = (ball.vx / currentSpeed) * ball.speed;
      ball.vy = (ball.vy / currentSpeed) * ball.speed;

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

  function triggerBallAnimation(ball: any) {
    ball.active = false;
    ball.animationFrame = 0;
    score++;
    counterElement.innerText = `Balls Caught: ${score}`;
  }

  function animateBalls() {
    balls.forEach((ball) => {
      if (ball.animationFrame === null) return;

      ball.animationFrame += 1;
      ball.radius += 1;

      if (ball.animationFrame > 10) {
        ball.animationFrame = null;
        ball.visible = false;
      }
    });
  }

  function checkInteractions(landmarks: any[]) {
    landmarks.forEach((landmark) => {
      balls.forEach((ball) => {
        if (!ball.active || ball.animationFrame !== null) return;

        const dx = ball.x - landmark.x * canvasElement.width;
        const dy = ball.y - landmark.y * canvasElement.height;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius) {
          triggerBallAnimation(ball);
        }
      });
    });
  }

  async function predictWebcam() {
    if (!poseLandmarker || !webcamRunning) return;

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    updateBalls();
    drawBalls();
    animateBalls();

    const result = await poseLandmarker.detectForVideo(
      video,
      performance.now()
    );

    if (result?.landmarks?.length) {
      const keyLandmarks = result.landmarks[0];
      drawingUtils.drawLandmarks(keyLandmarks);
      drawingUtils.drawConnectors(
        keyLandmarks,
        PoseLandmarker.POSE_CONNECTIONS
      );

      checkInteractions(keyLandmarks);
    }

    if (
      balls.some((ball) => ball.active || ball.animationFrame !== null) &&
      webcamRunning
    ) {
      requestAnimationFrame(predictWebcam);
    } else if (
      !balls.some((ball) => ball.active || ball.animationFrame !== null)
    ) {
      alert(`Game Over! Total Balls Caught: ${score}`);
      webcamRunning = false;
    }
  }

  restartButton.addEventListener("click", () => {
    webcamRunning = false;
    balls = generateBalls(10); 
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

function generateBalls(count: number) {
  const balls = [];
  for (let i = 0; i < count; i++) {
    balls.push({
      x: Math.random() * 640,
      y: Math.random() * 480,
      radius: 15,
      color: "red",
      vx: (Math.random() * 2 - 1) * 5,
      vy: (Math.random() * 2 - 1) * 5,
      speed: 3,
      active: true,
      animationFrame: null,
      visible: true,
    });
  }
  return balls;
}
