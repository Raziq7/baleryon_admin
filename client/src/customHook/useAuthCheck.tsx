import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

// Custom hook to check authentication
function useAuthCheck() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated (stored in localStorage, you can change it to sessionStorage if needed)
    const isAuthenticated = localStorage.getItem('isAdminExit') ? true : false;

    // If not authenticated, redirect to signin page
    if (!isAuthenticated) {
      navigate('/signin');
    }
  }, [navigate]); // Dependency on navigate to avoid stale closures
}

export default useAuthCheck;
