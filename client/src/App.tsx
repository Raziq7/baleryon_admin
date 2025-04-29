import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { Routes, Route } from "react-router-dom";

import SignIn from "./pages/credintials/signin";
import AppTheme from "./theme/AppTheme";
import Dashboard from "./pages/dashboard/Dashboard";

import Customer from "./pages/customers/Customers.js";
import Home from "./pages/home/Home"; // Make sure you import Home
import useAuthCheck from './customHook/useAuthCheck.tsx'; // Import the custom hook
import ProductListing from "./pages/product/ProductListing.tsx";
import AddProduct from "./pages/product/addProduct/AddProduct.tsx";

function App(props: { disableCustomTheme?: boolean }) {
  useAuthCheck();
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

            <Route path="productManagment" element={<Dashboard><ProductListing /></Dashboard>} />

            {/* Add Product route */}
            <Route path="/productManagment/addProduct" element={<Dashboard><AddProduct /></Dashboard>} />

            {/* User Manager */}
            <Route path="clients" element={<Dashboard><Customer /></Dashboard>} />

          </Routes>
        {/* </Router> */}
      </AppTheme>
    </StyledEngineProvider>
  );
}

export default App;
