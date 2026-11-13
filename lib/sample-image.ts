/** A locally drawn panorama used by the empty state. Nothing is fetched. */
export async function createSampleImage(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create a sample image.");

  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#14102a");
  sky.addColorStop(0.42, "#9f1239");
  sky.addColorStop(0.62, "#fb923c");
  sky.addColorStop(1, "#071422");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 244, 213, 0.18)";
  context.beginPath();
  context.arc(1680, 300, 130, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fff4d5";
  context.beginPath();
  context.arc(1680, 300, 68, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#10243d";
  context.beginPath();
  context.moveTo(0, 560);
  context.bezierCurveTo(360, 470, 720, 650, 1180, 540);
  context.bezierCurveTo(1560, 460, 1900, 640, 2400, 520);
  context.lineTo(2400, 900);
  context.lineTo(0, 900);
  context.closePath();
  context.fill();

  context.fillStyle = "#0b1c30";
  context.beginPath();
  context.moveTo(0, 690);
  context.bezierCurveTo(400, 640, 900, 760, 1400, 680);
  context.bezierCurveTo(1800, 630, 2100, 740, 2400, 700);
  context.lineTo(2400, 900);
  context.lineTo(0, 900);
  context.closePath();
  context.fill();

  context.font = "700 92px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let index = 0; index < 20; index += 1) {
    const x = ((index + 0.5) * canvas.width) / 20;
    context.fillStyle = "rgba(0, 0, 0, 0.35)";
    context.fillRect(x - 70, 96, 140, 92);
    context.fillStyle = "#fff7ed";
    context.fillText(String(index + 1).padStart(2, "0"), x, 142);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not create a sample image."));
    }, "image/png");
  });

  return new File([blob], "picsnips-sample.png", { type: "image/png" });
}
