export default function getCroppedImg(imageSrc, croppedAreaPixels) {
    const image = new Image();
    image.src = imageSrc;
  
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    return new Promise((resolve, reject) => {
      image.onload = () => {
        const { width, height } = image;
        const { x, y, width: cropWidth, height: cropHeight } = croppedAreaPixels;
  
        canvas.width = cropWidth;
        canvas.height = cropHeight;
  
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
  