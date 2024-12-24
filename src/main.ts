import { initCamera } from "./components/Camera";
// import { initScene as initScene1 } from "./scenes/Scene1";
import { initScene as initScene2 } from "./scenes/Scene2";
// import { initScene as initScene3 } from "./scenes/Scene3";

let currentSceneCleanup: (() => void) | null = null;

async function main() {
  const video = await initCamera();

  // Crear un contenedor centrado
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  container.style.height = "100vh";
  container.style.textAlign = "center";
  document.body.appendChild(container);

  // Crear texto de bienvenida
  const welcomeText = document.createElement("p");
  welcomeText.innerText = "Welcome to You Interactive";
  welcomeText.style.fontSize = "36px";
  welcomeText.style.fontWeight = "bold";
  welcomeText.style.marginBottom = "10px";
  welcomeText.style.color = "#4A4A4A"; // Color opcional para mayor personalización
  container.appendChild(welcomeText);

  // Crear texto de instrucciones
  const instructions = document.createElement("ul");
  instructions.style.fontSize = "30px";
  instructions.style.marginBottom = "20px";
  instructions.style.marginInline = "10px";
  instructions.style.listStyleType = "none";

  // Agregar cada paso como un elemento de lista
  const steps = [
    "1. In You Interactive you must capture the elements that appear on the screen.",
    "2. Use your hands and mouth to catch them.",
    "3. Press the down arrow button to start.",
  ];

  steps.forEach((step) => {
    const li = document.createElement("li");
    li.innerText = step;
    li.style.marginBottom = "10px";
    instructions.appendChild(li);
  });

  container.appendChild(instructions);

  // Crear el botón de experiencia 1 (comentado)
  // const experience1Button = document.createElement("button");
  // experience1Button.innerText = "¡Inicia la experiencia de golpear el elemento!";
  // experience1Button.style.padding = "15px 30px";
  // experience1Button.style.fontSize = "20px";
  // experience1Button.style.cursor = "pointer";
  // experience1Button.style.borderRadius = "8px";
  // experience1Button.style.border = "none";
  // experience1Button.style.backgroundColor = "#28A745";
  // experience1Button.style.color = "white";
  // experience1Button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  // experience1Button.style.transition = "background-color 0.3s";
  //
  // experience1Button.addEventListener("mouseenter", () => {
  //   experience1Button.style.backgroundColor = "#218838";
  // });
  //
  // experience1Button.addEventListener("mouseleave", () => {
  //   experience1Button.style.backgroundColor = "#28A745";
  // });
  // container.appendChild(experience1Button);

  // Crear el botón de experiencia 2
  const experience2Button = document.createElement("button");
  experience2Button.innerText = "¡Start!";
  experience2Button.style.padding = "15px 30px";
  experience2Button.style.fontSize = "20px";
  experience2Button.style.cursor = "pointer";
  experience2Button.style.borderRadius = "8px";
  experience2Button.style.border = "none";
  experience2Button.style.backgroundColor = "#007BFF";
  experience2Button.style.color = "white";
  experience2Button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  experience2Button.style.transition = "background-color 0.3s";

  experience2Button.addEventListener("mouseenter", () => {
    experience2Button.style.backgroundColor = "#0056b3";
  });

  experience2Button.addEventListener("mouseleave", () => {
    experience2Button.style.backgroundColor = "#007BFF";
  });
  container.appendChild(experience2Button);

  // Crear el botón de experiencia 3 (comentado)
  // const experience3Button = document.createElement("button");
  // experience3Button.innerText = "¡Inicia la experiencia de capturar con una extremidad!";
  // experience3Button.style.padding = "15px 30px";
  // experience3Button.style.fontSize = "20px";
  // experience3Button.style.cursor = "pointer";
  // experience3Button.style.borderRadius = "8px";
  // experience3Button.style.border = "none";
  // experience3Button.style.backgroundColor = "#DC3545";
  // experience3Button.style.color = "white";
  // experience3Button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  // experience3Button.style.transition = "background-color 0.3s";
  //
  // experience3Button.addEventListener("mouseenter", () => {
  //   experience3Button.style.backgroundColor = "#C82333";
  // });
  //
  // experience3Button.addEventListener("mouseleave", () => {
  //   experience3Button.style.backgroundColor = "#DC3545";
  // });
  // container.appendChild(experience3Button);

  async function switchScene(
    initScene: (video: HTMLVideoElement) => Promise<() => void>
  ) {
    // Ocultar el contenedor principal
    container.style.display = "none";

    // Limpiar la escena actual si existe
    if (currentSceneCleanup) currentSceneCleanup();

    // Iniciar la nueva escena
    currentSceneCleanup = await initScene(video);

    // Mostrar el contenedor principal cuando termine la experiencia
    currentSceneCleanup = () => {
      container.style.display = "flex";
    };
  }

  // experience1Button.addEventListener("click", () => switchScene(initScene1));
  experience2Button.addEventListener("click", () => switchScene(initScene2));
  // experience3Button.addEventListener("click", () => switchScene(initScene3));
}

main().catch(console.error);
