import { initCamera } from "./components/Camera";
// import { initScene as initScene1 } from "./scenes/Scene1";
import { initScene as initScene2 } from "./scenes/Scene2";
// import { initScene as initScene3 } from "./scenes/Scene3";

let currentSceneCleanup: (() => void) | null = null;

async function main() {
  const video = await initCamera();

  // Crear un contenedor centrado
  const frameContainer = document.createElement("div");
  frameContainer.style.position = "absolute";
  frameContainer.style.top = "0";
  frameContainer.style.left = "0";
  frameContainer.style.width = "100%";
  frameContainer.style.height = "100%";
  frameContainer.style.zIndex = "1";
  frameContainer.style.overflow = "hidden";

  // Crear la imagen del marco
  const frameElement = document.createElement("img");
  frameElement.src = window.innerWidth <= 768 
    ? "/MARCO-EXPERIENCIAS-MOVIL.png" 
    : "/MARCO-EXPERIENCIAS.png";
  frameElement.style.position = "absolute";
  frameElement.style.top = "0";
  frameElement.style.left = "0";
  frameElement.style.width = "100%";
  frameElement.style.height = "100%";
  frameElement.style.objectFit = "contain"; 
  frameContainer.appendChild(frameElement);

  // Actualizar el marco al cambiar el tamaño de la ventana
  window.addEventListener("resize", () => {
    frameElement.src = window.innerWidth <= 768 
      ? "/MARCO-EXPERIENCIAS-MOVIL.png" 
      : "/MARCO-EXPERIENCIAS.png";
  });

  // Añadir el marco al cuerpo del documento
  document.body.appendChild(frameContainer);

  // Crear el contenedor principal para el contenido
  const contentContainer = document.createElement("div");
  contentContainer.style.position = "absolute";
  contentContainer.style.top = "0";
  contentContainer.style.left = "0";
  contentContainer.style.width = "100%";
  contentContainer.style.height = "100%";
  contentContainer.style.display = "flex";
  contentContainer.style.flexDirection = "column";
  contentContainer.style.justifyContent = "center";
  contentContainer.style.alignItems = "center";
  contentContainer.style.zIndex = "2"; // Asegura que esté encima del marco
  document.body.appendChild(contentContainer);

  // Crear texto de bienvenida
  const welcomeText = document.createElement("p");
  welcomeText.innerText = "Welcome to the interactive demo";
  welcomeText.style.fontSize = "clamp(24px, 5vw, 36px)";
  welcomeText.style.fontWeight = "bold";
  welcomeText.style.marginBottom = "10px";
  welcomeText.style.color = "#4A4A4A";
  contentContainer.appendChild(welcomeText);

  const instructions = document.createElement("ul");
  instructions.style.fontSize = "clamp(18px, 4vw, 30px)";
  instructions.style.marginBottom = "20px";
  instructions.style.padding = "0 20px";
  instructions.style.listStyleType = "none";

  // Agregar cada paso como un elemento de lista
  const steps = [
    "1. In this interactive demo you must capture the elements that appear on the screen.",
    "2. Face your hands to the camera and It will start to detect your movements.",
    "3. Use your opens hands to catch them.",
    "4. Press the down arrow button to start.",
  ];

  steps.forEach((step) => {
    const li = document.createElement("li");
    li.innerText = step;
    li.style.marginBottom = "10px";
    instructions.appendChild(li);
  });

  contentContainer.appendChild(instructions);

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
  experience2Button.innerText = "Start!";
  experience2Button.style.padding = "10px 20px";
  experience2Button.style.fontSize = "clamp(16px, 3vw, 20px)";
  experience2Button.style.cursor = "pointer";
  experience2Button.style.borderRadius = "8px";
  experience2Button.style.border = "none";
  experience2Button.style.backgroundColor = "#007BFF";
  experience2Button.style.color = "white";
  experience2Button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  experience2Button.style.transition = "background-color 0.3s";
  experience2Button.style.minWidth = "150px";
  experience2Button.style.maxWidth = "300px";

  experience2Button.addEventListener("mouseenter", () => {
    experience2Button.style.backgroundColor = "#0056b3";
  });

  experience2Button.addEventListener("mouseleave", () => {
    experience2Button.style.backgroundColor = "#007BFF";
  });
  contentContainer.appendChild(experience2Button);

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
    frameContainer.style.display = "none";
    contentContainer.style.display = "none";

    // Limpiar la escena actual si existe
    if (currentSceneCleanup) currentSceneCleanup();

    // Iniciar la nueva escena
    currentSceneCleanup = await initScene(video);

    // Mostrar el contenedor principal cuando termine la experiencia
    currentSceneCleanup = () => {
      contentContainer.style.display = "flex";
    };
  }

  // experience1Button.addEventListener("click", () => switchScene(initScene1));
  experience2Button.addEventListener("click", () => switchScene(initScene2));
  // experience3Button.addEventListener("click", () => switchScene(initScene3));
}

main().catch(console.error);
