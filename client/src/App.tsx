import { StyledEngineProvider } from "@mui/material"
import SignIn from "./pages/credintials/signin"

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <SignIn />
    </StyledEngineProvider>
  )
}

export default App