export async function initCamera(): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;

  video.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    display: none;
  `;
  document.body.appendChild(video);

  try {
    const constraints = {
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play().then(() => resolve(video));
      };
    });
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
    alert(
      "No se pudo acceder a la cámara. Verifica los permisos o el soporte del navegador."
    );
    throw error;
  }
}

export function stopCamera(video: HTMLVideoElement) {
  const stream = video.srcObject as MediaStream;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  video.srcObject = null;
}
