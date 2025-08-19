import { ChangeEvent, useEffect, useState } from "react";
import {
  Fab,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Slider,
} from "@mui/material";
import PropTypes from "prop-types";
import { Area } from "react-easy-crop";
import { styled } from "@mui/material/styles";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage"; // cropping utility

/* ---------- Styled Components ---------- */
interface AvatarProps {
  width?: string | number;
  height?: string | number;
  marginTop?: string | number;
}

interface StyledFabProps {
  left?: string | number;
  top?: string | number;
}

const Avatar = styled("div")<AvatarProps>(({ width, height, marginTop }) => ({
  backgroundColor: "white",
  border: "1px dashed #000",
  boxSizing: "border-box",
  borderRadius: "5px",
  color: "transparent",
  width: width,
  height: height,
  marginTop: marginTop,
  marginBottom: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textTransform: "none",
}));

const StyledFab = styled(Fab)<StyledFabProps>(({ left, top }) => ({
  border: "none",
  backgroundColor: "white",
  color: "#4A4A4A",
  boxShadow: "none",
  textTransform: "none",
  position: "relative",
  left: left,
  top: top,
  minHeight: 17,
  "&:hover": {
    boxShadow: "none",
    backgroundColor: "white",
  },
  marginBottom: 24,
}));

const HiddenInput = styled("input")(() => ({
  display: "none",
}));

/* ---------- Props ---------- */
interface FileInputProps {
  onFileChange: (files: File[]) => void;
  cropPass: (files: File[]) => void;
  initialImages?: string[]; // preloaded URLs
}

/* ---------- Component ---------- */
function FileInput({
  cropPass,
  initialImages = [],
}: FileInputProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [croppedImages, setCroppedImages] = useState<string[]>([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [openCropper, setOpenCropper] = useState(false);

  // Initialize with existing images only once
  useEffect(() => {
    setCroppedImages(initialImages);
  }, []);

  /* ---------- Handle File Selection ---------- */
  const changeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) {
      setCropImage(URL.createObjectURL(files[0]));
      setOpenCropper(true);
    }
    setSelectedFiles(files);
  };

  const handleCropComplete = (_: unknown, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    try {
      if (!cropImage || !croppedAreaPixels) return;

      const croppedImg = await getCroppedImg(cropImage, croppedAreaPixels);

      // Add cropped image to state
      setCroppedImages((prev) => [...prev, croppedImg]);

      // Pass the actual File object(s) to parent for upload
      cropPass(selectedFiles);

      // Reset crop
      setCropImage(null);
      setOpenCropper(false);
      setSelectedFiles([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {/* Upload Button */}
      <Avatar width={160} height={200} marginTop={20}>
        <label htmlFor="contained-button-file">
          <HiddenInput
            type="file"
            accept="image/*"
            id="contained-button-file"
            name="file"
            onChange={changeHandler}
            multiple
          />
          <StyledFab variant="extended">Upload photo here</StyledFab>
        </label>
      </Avatar>

      {/* Show Existing + Cropped Images */}
      <Grid container spacing={2}>
        {croppedImages.map((image, index) => (
          <Grid key={index} item xs={3} p={1}>
            <img
              src={image}
              alt={`Image ${index}`}
              style={{ maxWidth: "100px", height: "auto", marginTop: "20px" }}
            />
            <Typography variant="body2">Image {index + 1}</Typography>
          </Grid>
        ))}
      </Grid>

      {/* Cropper Dialog */}
      <Dialog open={openCropper} onClose={() => setOpenCropper(false)} fullWidth>
        <DialogContent style={{ position: "relative", height: 400 }}>
          {cropImage && (
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={4 / 5.2}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Typography gutterBottom>Zoom:</Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value as number)}
            style={{ width: "150px", marginRight: "10px" }}
          />
          <Button onClick={() => setOpenCropper(false)}>Cancel</Button>
          <Button onClick={handleCrop} color="primary" variant="contained">
            Crop
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

FileInput.propTypes = {
  onFileChange: PropTypes.func.isRequired,
  cropPass: PropTypes.func.isRequired,
  initialImages: PropTypes.array,
};

export default FileInput;
