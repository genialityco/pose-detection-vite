import { initCamera } from "./components/Camera";
import { initScene as initScene1 } from "./scenes/Scene1";
import { initScene as initScene2 } from "./scenes/Scene2";

let currentSceneCleanup: (() => void) | null = null;

async function main() {
  const video = await initCamera();

  const experience1Button = document.createElement("button");
  experience1Button.innerText = "Golpea el elemento";
  experience1Button.style.position = "absolute";
  experience1Button.style.top = "10px";
  experience1Button.style.left = "10px";
  document.body.appendChild(experience1Button);

  const experience2Button = document.createElement("button");
  experience2Button.innerText = "Captura los elementos";
  experience2Button.style.position = "absolute";
  experience2Button.style.top = "10px";
  experience2Button.style.left = "150px";
  document.body.appendChild(experience2Button);

  async function switchScene(
    initScene: (video: HTMLVideoElement) => Promise<() => void>
  ) {
    if (currentSceneCleanup) currentSceneCleanup();
    currentSceneCleanup = await initScene(video); 
  }

  experience1Button.addEventListener("click", () => switchScene(initScene1));
  experience2Button.addEventListener("click", () => switchScene(initScene2));
}

main().catch(console.error);
