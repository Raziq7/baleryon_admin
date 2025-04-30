import React, { useState, useRef } from 'react';
import { Button, Box, Grid, IconButton, Typography } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function StatusUtils() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: MediaFile[] = [];

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          type: 'image'
        });
      } else if (file.type.startsWith('video/')) {
        const duration = await getVideoDuration(file);
        if (duration <= 60) {
          validFiles.push({
            file,
            preview: URL.createObjectURL(file),
            type: 'video'
          });
        } else {
          alert('Video duration must be 60 seconds or less');
        }
      }
    }

    setMediaFiles([...mediaFiles, ...validFiles]);
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
  };

  const handleCreateStatus = () => {
    // TODO: Implement API call to create status
    console.log('Creating status with files:', mediaFiles);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Create Status
      </Typography>
      
      <Box mb={3}>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <Button
          variant="contained"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Add Media
        </Button>
      </Box>

      <Grid container spacing={2}>
        {mediaFiles.map((media, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box position="relative">
              {media.type === 'image' ? (
                <img
                  src={media.preview}
                  alt={`Preview ${index}`}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              ) : (
                <video
                  src={media.preview}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  controls
                />
              )}
              <IconButton
                size="small"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(255,255,255,0.8)'
                }}
                onClick={() => handleRemoveMedia(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>

      {mediaFiles.length > 0 && (
        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateStatus}
          >
            Create Status
          </Button>
        </Box>
      )}
    </Box>
  );
}
