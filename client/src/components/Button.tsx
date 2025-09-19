// CustomButton.tsx
import * as React from "react";
import { Button, ButtonProps } from "@mui/material";
import { SxProps, Theme } from "@mui/system";

type CustomButtonProps = Omit<ButtonProps, "variant" | "color" | "sx"> & {
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
  sx?: SxProps<Theme>;
};

const CustomButton: React.FC<CustomButtonProps> = ({
  variant = "contained",
  color = "primary",
  sx,
  children,
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      sx={{ mb: 2, mt: 2, ...(sx || {}) }}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default CustomButton;
