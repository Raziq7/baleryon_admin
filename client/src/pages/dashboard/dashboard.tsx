import { Box, Stack } from "@mui/material";
import SideMenu from "./components/SideMenu";
import AppNavbar from "./components/AppNavbar";
import Header from "./components/Header";

function Dashboard() {
  return (
    <Box sx={{ display: "flex" }}>
      <SideMenu />
      <AppNavbar />
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: "auto",
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: "center",
            mx: 3,
            pb: 5,
            mt: { xs: 8, md: 0 },
          }}
        >
          <Header />
        </Stack>
      </Box>
    </Box>
  );
}

export default Dashboard;
