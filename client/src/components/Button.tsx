import React from 'react';
import { Button } from '@mui/material';

// CustomButton Component
const CustomButton = ({ variant, color, sx, onClick, children }) => {
  return (
    <Button
      variant={variant || "contained"} // Default variant is "contained"
      color={color || "primary"} // Default color is "primary"
      sx={{
        mb: 2,
        mt: 2,
        ...sx, // Allows overriding or adding more styles via `sx` prop
      }}
      onClick={onClick}
    >
      {children} {/* Text passed as children */}
    </Button>
  );
};

export default CustomButton;
