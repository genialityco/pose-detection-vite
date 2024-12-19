// @ts-nocheck
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

let poseLandmarker = null;
let webcamRunning = false;
let score = 0;

const ballImage = new Image();
ballImage.src = "/PELOTA.png";

const frameImage = new Image();
frameImage.src = "/MARCO-EXPERIENCIAS.png";

const explosionSound = new Audio("/bass-drop-186085.mp3");

let scoreAnimations = [];

export async function initScene(video) {
  const loadingElement = document.createElement("div");
  loadingElement.innerText = "Cargando experiencia...";
  loadingElement.style.position = "absolute";
  loadingElement.style.top = "50%";
  loadingElement.style.left = "50%";
  loadingElement.style.transform = "translate(-50%, -50%)";
  loadingElement.style.padding = "20px";
  loadingElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  loadingElement.style.color = "#FFF";
  loadingElement.style.fontSize = "1.5rem";
  loadingElement.style.borderRadius = "10px";
  document.body.appendChild(loadingElement);

  const canvasElement = document.createElement("canvas");
  canvasElement.width = video.width;
  canvasElement.height = video.height;
  document.body.appendChild(canvasElement);

  // Contenedor para el contador y el botón
  const controlsContainer = document.createElement("div");
  controlsContainer.style.position = "absolute";
  controlsContainer.style.bottom = "10px";
  controlsContainer.style.left = "10px";
  controlsContainer.style.display = "flex";
  controlsContainer.style.alignItems = "center";
  controlsContainer.style.gap = "10px";
  document.body.appendChild(controlsContainer);

  // Contador
  const counterElement = document.createElement("div");
  counterElement.style.fontSize = "20px";
  counterElement.style.color = "white";
  counterElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  counterElement.style.padding = "10px";
  counterElement.style.borderRadius = "5px";
  counterElement.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.3)";
  counterElement.innerText = `Balls Caught: ${score}`;
  controlsContainer.appendChild(counterElement);

  // Botón de restart
  const restartImage = document.createElement("img");
  restartImage.src = "/BOTON-RESTART.png";
  restartImage.style.width = "auto";
  restartImage.style.height = "40px";
  restartImage.style.cursor = "pointer";
  restartImage.style.boxShadow =
    "0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)";
  restartImage.style.borderRadius = "25px";
  controlsContainer.appendChild(restartImage);

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

  document.body.removeChild(loadingElement);

  webcamRunning = true;
  let balls = generateBalls(5);

  function drawFrame() {
    canvasCtx.save();

    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    canvasCtx.drawImage(
      frameImage,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    canvasCtx.restore();
  }

  function drawBalls() {
    balls.forEach((ball) => {
      if (ball.exploding) {
        const progress = ball.explosionProgress;
        canvasCtx.beginPath();
        canvasCtx.arc(
          ball.x,
          ball.y,
          ball.radius + progress * 20,
          0,
          2 * Math.PI
        );
        canvasCtx.strokeStyle = `rgba(255, 69, 0, ${1 - progress})`;
        canvasCtx.lineWidth = 4;
        canvasCtx.stroke();
        canvasCtx.closePath();

        ball.explosionProgress += 0.05;

        if (ball.explosionProgress >= 1) {
          ball.exploding = false;
        }
      } else if (ball.active) {
        // Dibuja la pelota
        canvasCtx.drawImage(
          ballImage,
          ball.x - ball.radius,
          ball.y - ball.radius,
          ball.radius * 2,
          ball.radius * 2
        );
      }
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

  function drawScoreAnimations() {
    scoreAnimations.forEach((anim, index) => {
      const alpha = 1 - anim.progress;
      const offset = anim.progress * 50;
      const scale = 1 + anim.progress * 0.5;

      canvasCtx.save();

      // Mover el contexto al punto donde estará el texto
      canvasCtx.translate(anim.x, anim.y - offset);

      // Invertir horizontalmente el texto
      canvasCtx.scale(-1, 1);

      canvasCtx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      canvasCtx.font = "30px Arial";
      canvasCtx.textAlign = "center";

      canvasCtx.fillText("+1", 0, 0);

      canvasCtx.restore();

      anim.progress += 0.05;

      if (anim.progress >= 1) {
        scoreAnimations.splice(index, 1);
      }
    });
  }

  function checkInteractions(landmarks) {
    // Índices de los puntos relevantes para las manos
    const handLandmarksIndices = [
      11, 13, 15, 17, 19, 21, 12, 14, 16, 18, 20, 22,
    ];

    handLandmarksIndices.forEach((index) => {
      const landmark = landmarks[index];
      const lx = landmark.x * canvasElement.width;
      const ly = landmark.y * canvasElement.height;

      balls.forEach((ball) => {
        if (!ball.active) return;

        if (
          Math.abs(ball.x - lx) < ball.radius &&
          Math.abs(ball.y - ly) < ball.radius
        ) {
          ball.active = false;
          ball.exploding = true;

          // Agregar animación de puntuación
          scoreAnimations.push({
            x: ball.x, // Coordenadas donde explotó la pelota
            y: ball.y,
            progress: 0, // Inicia en 0
          });

          score++;

          explosionSound.currentTime = 0;
          explosionSound.play();

          counterElement.innerText = `Balls Caught: ${score}`;
        }
      });
    });
  }

  function showGameOverScreen() {
    // Crear el contenedor principal
    const gameOverContainer = document.createElement("div");
    gameOverContainer.style.position = "absolute";
    gameOverContainer.style.top = "50%";
    gameOverContainer.style.left = "50%";
    gameOverContainer.style.transform = "translate(-50%, -50%)";
    gameOverContainer.style.width = "485px";
    gameOverContainer.style.height = "231px";
    gameOverContainer.style.backgroundImage = "url('/MARGO_GAME-OVER.png')";
    gameOverContainer.style.backgroundSize = "cover";
    gameOverContainer.style.backgroundPosition = "center";
    gameOverContainer.style.textAlign = "center";
    gameOverContainer.style.display = "flex";
    gameOverContainer.style.flexDirection = "column";
    gameOverContainer.style.justifyContent = "center";
    gameOverContainer.style.color = "#004274";
    gameOverContainer.style.fontFamily = "Arial, sans-serif";
    gameOverContainer.style.fontWeight = "bold";
    gameOverContainer.style.borderRadius = "15px";
    gameOverContainer.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.6)";
    gameOverContainer.style.zIndex = "1000";

    // Finish game
    const title = document.createElement("div");
    title.innerText = "YOU WIN";
    title.style.fontSize = "2.5rem";
    title.style.marginBottom = "10px";

    // Texto con la puntuación
    const scoreText = document.createElement("div");
    scoreText.innerText = `TOTAL BALLS CAUGHT: ${score}`;
    scoreText.style.fontSize = "1.5rem";

    // Botón para cerrar el mensaje
    const acceptButton = document.createElement("button");
    acceptButton.innerText = "Aceptar";
    acceptButton.style.marginTop = "15px";
    acceptButton.style.padding = "10px 20px";
    acceptButton.style.backgroundColor = "#004274";
    acceptButton.style.color = "#FFF";
    acceptButton.style.border = "none";
    acceptButton.style.borderRadius = "5px";
    acceptButton.style.fontSize = "1rem";
    acceptButton.style.cursor = "pointer";
    acceptButton.style.fontWeight = "bold";
    acceptButton.onclick = () => {
      document.body.removeChild(gameOverContainer);
    };

    // Agregar elementos al contenedor principal
    gameOverContainer.appendChild(title);
    gameOverContainer.appendChild(scoreText);
    gameOverContainer.appendChild(acceptButton);

    // Agregar el contenedor al cuerpo del documento
    document.body.appendChild(gameOverContainer);
  }

  async function predictWebcam() {
    if (!poseLandmarker || !webcamRunning) return;

    const now = performance.now();

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    updateBalls();
    drawBalls();
    drawScoreAnimations();

    const result = await poseLandmarker.detectForVideo(video, now);
    if (result?.landmarks?.length) {
      const keyLandmarks = result.landmarks[0];
      drawingUtils.drawLandmarks(keyLandmarks, { radius: 1, color: "white" });
      drawingUtils.drawConnectors(
        keyLandmarks,
        PoseLandmarker.POSE_CONNECTIONS,
        { color: "lime", lineWidth: 1 }
      );
      checkInteractions(keyLandmarks);
    }

    drawFrame();

    if (balls.some((ball) => ball.active) && webcamRunning) {
      requestAnimationFrame(predictWebcam);
    } else if (!balls.some((ball) => ball.active)) {
      showGameOverScreen();
      webcamRunning = false;
    }
  }

  restartImage.addEventListener("click", () => {
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
      radius: 20,
      color: "red",
      vx: (Math.random() * 2 - 1) * 2,
      vy: (Math.random() * 2 - 1) * 2,
      active: true,
      exploding: false,
      explosionProgress: 0,
    });
  }
  return balls;
}
