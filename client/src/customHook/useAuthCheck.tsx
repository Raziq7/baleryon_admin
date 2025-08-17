import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function useAuthCheck() {
  const { token, setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setAuth(storedToken);
    } else {
      navigate("/signin");
    }
  }, [navigate, setAuth]);

  return token;
}
