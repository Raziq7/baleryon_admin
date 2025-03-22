import React, { useState } from "react";
import { Fab, Grid, Typography, Button, Dialog, DialogActions, DialogContent, Slider } from "@mui/material";
import { styled } from "@mui/material/styles";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage"; // This utility handles the cropping logic
import PropTypes from "prop-types";

// Styled components
const Avatar = styled("div")(({ width, height, marginTop }) => ({
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

const StyledFab = styled(Fab)(({ left, top }) => ({
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

function FileInput({ onFileChange,cropPass }) {
  const [selectedFiles, setSelectedFiles] = useState();
  const [cropImage, setCropImage] = useState(null);
  const [croppedImages, setCroppedImages] = useState([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [openCropper, setOpenCropper] = useState(false);

  const dimensions = {
    width: 163,
    height: 129,
    marginTop: 20,
    left: 11,
    top: 36,
  };

  const changeHandler = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setCropImage(URL.createObjectURL(files[0])); // Use the first file for cropping
      setOpenCropper(true);
    }
    setSelectedFiles(files);
    onFileChange(files); // Notify the parent component about the file change
  };

  const handleCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    try {
      const croppedImg = await getCroppedImg(cropImage, croppedAreaPixels);
      setCroppedImages((prev) => [...prev, croppedImg]);
      cropPass(selectedFiles)
      setCropImage(null);
      setOpenCropper(false);
    } catch (e) {
      console.error(e);
    }
  };

  const textDesc = "Upload photo here";

  return (
    <div>
      <Avatar
        width={dimensions.width}
        height={dimensions.height}
        marginTop={dimensions.marginTop}
      >
        <label htmlFor="contained-button-file">
          <HiddenInput
            type="file"
            accept="image/*"
            id="contained-button-file"
            name="file"
            onChange={changeHandler}
            multiple
          />
          <StyledFab
            aria-label={textDesc}
            component="div"
            variant="extended"
            left={dimensions.left}
            top={dimensions.top}
          >
            {textDesc}
          </StyledFab>
        </label>
      </Avatar>

      <Grid container spacing={2}>
        {croppedImages.map((image, index) => (
          <Grid key={index} item xs={3} p={1}>
            <img
              src={image}
              alt={`Cropped ${index}`}
              style={{ maxWidth: "100px", height: "auto", marginTop: "20px" }}
            />
            <Typography variant="body2">Cropped Image {index + 1}</Typography>
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
              aspect={4 / 3} // Aspect ratio for the crop area
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
            onChange={(e, zoom) => setZoom(zoom)}
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
};

export default FileInput;
