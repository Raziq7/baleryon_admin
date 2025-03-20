import { CssBaseline, StyledEngineProvider } from "@mui/material";
import SignIn from "./pages/credintials/signin";
import AppTheme from "./theme/AppTheme";
import Dashboard from "./pages/dashboard/dashboard";

function App(props: { disableCustomTheme?: boolean }) {
  return (
    <StyledEngineProvider injectFirst>
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        {/* <SignIn /> */}
        <Dashboard />
      </AppTheme>
    </StyledEngineProvider>
  );
}

export default App;
