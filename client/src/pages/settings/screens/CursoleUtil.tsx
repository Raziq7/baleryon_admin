import React, { useState } from "react";
import { Box, Button, Card, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function CursoleUtil() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Banner Upload
      </Typography>

      <Card sx={{ p: 2, mb: 2 }}>
        <Box component="label">
          <Box
            sx={{
              border: "2px dashed #ccc",
              borderRadius: 1,
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": { borderColor: "primary.main" },
              width: "100%",
            }}
          >
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
            <CloudUploadIcon
              sx={{ fontSize: 40, color: "primary.main", mb: 1 }}
            />
            <Typography>Click or drag image to upload banner</Typography>
          </Box>
        </Box>
      </Card>

      {selectedImage && (
        <Card sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Preview
          </Typography>
          <Box
            component="img"
            src={selectedImage}
            alt="Banner preview"
            sx={{
              width: "100%",
              height: 300,
              objectFit: "cover",
            }}
          />
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                /* Handle upload logic here */
              }}
            >
              Upload Banner
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setSelectedImage(null)}
              sx={{ ml: 2 }}
            >
              Cancel
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
}

export default CursoleUtil;
