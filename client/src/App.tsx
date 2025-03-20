import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SignIn from "./pages/credintials/signin";
import AppTheme from "./theme/AppTheme";
import Dashboard from "./pages/dashboard/dashboard";
import Home from "./pages/home/Home"; // Make sure you import Home

function App(props: { disableCustomTheme?: boolean }) {
  return (
    <StyledEngineProvider injectFirst>
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        {/* <Router> */}
          {/* Define Routes here */}
          <Routes>
            {/* Render Dashboard layout and display Home content inside */}
            <Route
              path="/"
              element={
                <Dashboard>
                  <Home />
                </Dashboard>
              }
            />

            {/* SignIn route */}
            <Route path="/signin" element={<SignIn />} />
          </Routes>
        {/* </Router> */}
      </AppTheme>
    </StyledEngineProvider>
  );
}

export default App;
