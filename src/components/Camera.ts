export async function initCamera(): Promise<HTMLVideoElement> {
    const video = document.createElement("video");
    video.autoplay = true;
  
    // Detectar dimensiones de la pantalla
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
  
    // Asignar dimensiones del video en píxeles
    video.width = screenWidth;
    video.height = screenHeight; 
  
    // Aplicar estilos para ocupar toda la pantalla
    video.style.position = "absolute";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = `${screenWidth}px`; 
    video.style.height = `${screenHeight}px`;
    video.style.objectFit = "cover"; 
    video.style.display = "none"; 
    document.body.appendChild(video);
  
    // Capturar el stream de la cámara
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    video.srcObject = stream;
  
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }
  