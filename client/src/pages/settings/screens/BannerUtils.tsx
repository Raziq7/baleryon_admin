import React, { useState } from 'react'
import { Box, Button, Container, Paper, Typography } from '@mui/material'

function BannerUtils() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Banner Upload
        </Typography>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="banner-upload"
        />
        <label htmlFor="banner-upload">
          <Button variant="contained" component="span">
            Select Banner Image
          </Button>
        </label>

        {previewUrl && (
          <Paper 
            sx={{ 
              mt: 3,
              p: 2,
            //   bgcolor: '#f5f5f5'
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Mobile Preview
            </Typography>
            <Box
              sx={{
                width: '375px',
                height: '750px',
                overflow: 'hidden',
                border: '1px solid #ccc',
                borderRadius: 1,
              }}
            >
              <img
                src={previewUrl}
                alt="Banner preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  )
}

export default BannerUtils