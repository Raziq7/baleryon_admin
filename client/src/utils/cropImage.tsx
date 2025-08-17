import { Area } from "react-easy-crop";

export default function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: Area
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    image.onload = () => {
      const { x, y, width: cropWidth, height: cropHeight } = croppedAreaPixels;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(
        image,
        x,
        y,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedImageUrl = canvas.toDataURL("image/jpeg");
      resolve(croppedImageUrl);
    };

    image.onerror = reject;
  });
}
