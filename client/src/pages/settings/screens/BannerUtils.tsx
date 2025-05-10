import React, { useState } from "react";
import { Box, Button, Card, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import api from "../../../utils/baseUrl";
import SettingsTable from "./table/SettingTable";

function BannerUtils() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("banner", imageFile);

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post("/admin/setting/bannerCreate", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Upload success:", response.data);
      alert("Banner uploaded successfully!");
      setSelectedImage(null);
      setImageFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload banner.");
    } finally {
      setUploading(false);
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
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Banner"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setSelectedImage(null);
                setImageFile(null);
              }}
              sx={{ ml: 2 }}
            >
              Cancel
            </Button>
          </Box>
        </Card>
      )}

      <SettingsTable/>
    </Box>
  );
}

export default BannerUtils;
