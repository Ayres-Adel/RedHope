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

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    nprogress.start();
    const timer = setTimeout(() => {
      nprogress.done();
    }, 500);
    return () => {
      clearTimeout(timer);
      nprogress.remove();
    };
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign" element={<Sign />} />
      <Route path="/login" element={<Login />} />
      <Route path="/map" element={<Map />} />
      <Route path="/search" element={<Search />} />

      <Route element={<PrivateRoute />}>
        <Route path="/user" element={<UserPage />} />
      </Route>
      
      <Route element={<PrivateRoute admin />}>
        <Route path="/admin/*" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<ErrorHandling />} />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const handleBlur = () => {
      document.title = "Come Back Hope ";
    };

    const handleFocus = () => {
      document.title = "Red Hope";
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    const timer = setTimeout(() => {
      setLoading(false); 
    }, 800);

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
