// src/App.jsx
import React, { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import ErrorHandling from "./components/ErrorHandling.jsx";
import UserPage from "./components/UserPage.jsx";
import AdminPage from "./components/AdminPage.jsx";
import Sign from "./components/Sign.jsx";
import Login from "./components/Login.jsx";
import Search from "./components/Search.jsx";
import PrivateRoute from './components/PrivateRoute';
import Map from './components/Map.jsx';
import Loading from "./components/Loading.jsx"; 
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import nprogress from 'nprogress';
import './styles/nprogress.css';

// Progress bar logic moved to a child component inside the Router
const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    nprogress.start(); // Start the progress bar
    const timer = setTimeout(() => {
      nprogress.done(); // Stop the progress bar after route changes
    }, 500); // Increased from 300ms to 500ms for smoother effect

    return () => {
      clearTimeout(timer); // Clear the timeout to avoid memory leaks
      nprogress.remove(); // Clean up progress bar on component unmount
    };
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign" element={<Sign />} />
      <Route path="/login" element={<Login />} />
      <Route path="/map" element={<Map />} />
      <Route path="/search" element={<Search />} />

      {/* Group protected routes including admin under PrivateRoute */}
      <Route element={<PrivateRoute />}>
        <Route path="/user" element={<UserPage />} />
      </Route>
      
      {/* Admin routes */}
      <Route element={<PrivateRoute admin />}>
        <Route path="/admin/*" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<ErrorHandling />} />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true); 

  // Add event listeners properly with cleanup
  useEffect(() => {
    const handleBlur = () => {
      document.title = "Come Back Hope ";
    };

    const handleFocus = () => {
      document.title = "Red Hope";
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Simulate loading on app startup
    const timer = setTimeout(() => {
      setLoading(false); 
    }, 800); // Reduced from 1000ms to 800ms for faster loading

    // Clean up event listeners and timer when component unmounts
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      clearTimeout(timer); 
    };
  }, []);

  return (
    <Router>
      {loading ? <Loading /> : <AppRoutes />}
    </Router>
  );
}

export default App;
