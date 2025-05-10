// src/App.jsx
import React, { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import ErrorHandling from "./components/ErrorHandling.jsx";
import UserPage from "./components/UserPage.jsx";
import AdminPage from "./components/AdminPage.jsx";
import Sign from "./components/Sign.jsx";
import Login from "./components/Login.jsx";
import Search from "./components/Search.jsx";
import FlipCard from "./components/FlipCard.jsx";
import PrivateRoute from './components/PrivateRoute';
import Map from './components/Map.jsx';
import Loading from "./components/Loading.jsx"; 
import ScrollProgress from "./components/ScrollProgress.jsx"; // Import the ScrollProgress component
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import nprogress from 'nprogress';
import './styles/nprogress.css';

// Progress bar logic moved to a child component inside the Router
const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    nprogress.start(); // Start the progress bar
    setTimeout(() => {
      nprogress.done(); // Stop the progress bar after route changes
    }, 300); // You can adjust the time here for smoother effect

    return () => {
      nprogress.remove(); // Clean up progress bar on component unmount
    };
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign" element={<Sign />} />
      <Route path="/login" element={<Login />} />
      <Route path="map" element={<Map />} />

      {/* Group protected routes including admin under PrivateRoute */}
      <Route element={<PrivateRoute />}>
        <Route path="/search" element={<Search />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<ErrorHandling />} />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true); 

  // Change the title on blur/focus
  window.addEventListener("blur", () => {
    document.title = "Come Back Hope ";
  });

  window.addEventListener("focus", () => {
    document.title = "Red Hope";
  });

  // Simulate loading on app startup
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); 
    }, 1000); 

    return () => clearTimeout(timer); 
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/map" element={<Map />} />
        
        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/user" element={<UserPage />} />
          {/* Other protected routes */}
        </Route>
        
        {/* Admin routes */}
        <Route element={<PrivateRoute admin />}>
          <Route path="/admin/*" element={<AdminPage />} />
        </Route>
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/sign" element={<Sign />} />
      </Routes>
    </Router>
  );
}

export default App;
