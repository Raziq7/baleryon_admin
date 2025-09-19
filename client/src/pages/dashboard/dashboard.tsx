import { Box, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ReactNode } from "react";
import SideMenu from "./components/SideMenu";
import AppNavbar from "./components/AppNavbar";
import Header from "./components/Header";

interface DashboardProps {
  children: ReactNode;
}

function Dashboard({ children }: DashboardProps) {
  return (
    <Box sx={{ display: "flex" }}>
      <SideMenu />
      <AppNavbar />
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: alpha(theme.palette.background.default, 1),
          overflow: "auto",
        })}
      >
        <Stack
          spacing={2}
          sx={{
            mx: 3,
            pb: 5,
            mt: { xs: 8, md: 0 },
          }}
        >
          <Header />
          {children}
        </Stack>
      </Box>
    </Box>
  );
}

export default Dashboard;
