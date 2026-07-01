/** Draw the camera frame exactly as shown (object-cover + optional mirror). */
export function drawVideoForAnalysis(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  displayWidth: number,
  displayHeight: number,
  mirrored: boolean
): boolean {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || displayWidth < 1 || displayHeight < 1) return false;

  const videoAspect = vw / vh;
  const displayAspect = displayWidth / displayHeight;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (videoAspect > displayAspect) {
    sw = vh * displayAspect;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / displayAspect;
    sy = (vh - sh) / 2;
  }

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.save();
  if (mirrored) {
    ctx.translate(displayWidth, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, displayWidth, displayHeight);
  ctx.restore();
  return true;
}

/** Landmarks from the analysis canvas map 1:1 to the overlay canvas. */
export function landmarkToDisplay(
  x: number,
  y: number,
  displayWidth: number,
  displayHeight: number
): { x: number; y: number } {
  return { x: x * displayWidth, y: y * displayHeight };
}
