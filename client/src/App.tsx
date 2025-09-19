import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { Routes, Route } from "react-router-dom";

import SignIn from "./pages/credintials/signin";
import AppTheme from "./theme/AppTheme";
import Dashboard from "./pages/dashboard/dashboard.tsx";

import Customer from "./pages/customers/Customers.js";
import AddCustomer from "./pages/customers/AddCustomer.js";
import Home from "./pages/home/Home"; // Make sure you import Home
import useAuthCheck from "./customHook/useAuthCheck.tsx"; // Import the custom hook
import ProductListing from "./pages/product/ProductListing.tsx";
import AddProduct from "./pages/product/addProduct/AddProduct.tsx";
import Settings from "./pages/settings/Settings.tsx";
import ProductDetail from "./pages/product/ProductDetails.tsx";
import EditProduct from "./pages/product/editProduct/EditProduct.tsx";
import OrderListing from "./pages/Orders/OrderListing.tsx";
import OrderDetail from "./pages/Orders/OrderDetail.tsx";

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

          <Route
            path="productManagment"
            element={
              <Dashboard>
                <ProductListing />
              </Dashboard>
            }
          />

          {/* Product Details route */}
          <Route
            path="productManagment/productDetail/:id"
            element={
              <Dashboard>
                <ProductDetail />
              </Dashboard>
            }
          />

          {/* Add Product route */}
          <Route
            path="/productManagment/addProduct"
            element={
              <Dashboard>
                <AddProduct />
              </Dashboard>
            }
          />

          {/* EDIT Product route */}
          <Route
            path="productManagment/editProduct/:id"
            element={
              <Dashboard>
                <EditProduct />
              </Dashboard>
            }
          />

          {/* Add Product route */}
          {/* User Manager */}
          <Route
            path="clients"
            element={
              <Dashboard>
                <Customer />
              </Dashboard>
            }
          />
          <Route
            path="clients/add"
            element={
              <Dashboard>
                <AddCustomer />
              </Dashboard>
            }
          />
          <Route
            path="/settings"
            element={
              <Dashboard>
                <Settings />
              </Dashboard>
            }
          />

          <Route
            path="orderManagement"
            element={
              <Dashboard>
                <OrderListing />
              </Dashboard>
            }
          />
          <Route
            path="orderManagement/orderDetail/:id"
            element={
              <Dashboard>
                <OrderDetail />
              </Dashboard>
            }
          />
        </Routes>
        {/* </Router> */}
      </AppTheme>
    </StyledEngineProvider>
  );
}

export default App;
