import { initCamera } from "./components/Camera";
import { initScene } from "./scenes/Scene";

async function main() {
  const video = await initCamera();
  const enableWebcamButton = document.createElement("button");
  enableWebcamButton.innerText = "ENABLE WEBCAM";
  enableWebcamButton.style.position = "absolute";
  enableWebcamButton.style.top = "10px";
  enableWebcamButton.style.left = "10px";
  document.body.appendChild(enableWebcamButton);

  enableWebcamButton.addEventListener("click", () => initScene(video, enableWebcamButton));
}

main().catch(console.error);
