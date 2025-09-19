import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Slider,
} from "@mui/material";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImg } from "./cropUtils"; // helper we'll create below
function CategoryUtils() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const showCroppedImage = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc!, croppedAreaPixels, {
        width: 2560,
        height: 960,
      });
      setCroppedImage(croppedImage);
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels]);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Banner Upload with Crop
        </Typography>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          id="banner-upload"
        />
        <label htmlFor="banner-upload">
          <Button variant="contained" component="span">
            Select Banner Image
          </Button>
        </label>

        {imageSrc && !croppedImage && (
          <Box sx={{ position: "relative", width: "100%", height: 400, mt: 3 }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={2560 / 960}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_, zoom) => setZoom(zoom as number)}
              sx={{ mt: 2 }}
            />
            <Button variant="contained" onClick={showCroppedImage} sx={{ mt: 2 }}>
              Crop & Preview
            </Button>
          </Box>
        )}

        {croppedImage && (
          <Paper sx={{ mt: 4, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Cropped Preview
            </Typography>
            <Box
              sx={{
                width: "100%",
                maxWidth: 600,
                overflow: "hidden",
                border: "1px solid #ccc",
                borderRadius: 1,
              }}
            >
              <img
                src={croppedImage}
                alt="Cropped"
                style={{
                  width: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default CategoryUtils;
