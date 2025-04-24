// src/components/Login.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';
import FadeInSection from './FadeInSection.jsx'; // Optional: For fade-in effect
import ScrollProgress from './ScrollProgress.jsx'; // Optional: For scroll progress
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import floating from '../assets/images/balloon.svg';

// Import images
import redHopeLogo from '../assets/images/RedHope_Logo.png';
import Navbar from './Navbar.jsx';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const navigate = useNavigate();
  const loginButton = useRef(null);

  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // Language state: reads from localStorage (defaulting to English)
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  // Poll localStorage for language changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setErrors({
      ...errors,
      [name]: '' // Clear error for the changed field
    });
  };

  useEffect(() => {
    // Update button styles and enable state based on form validity
    const isFormValid = formData.email && formData.password.length >= 6;
    setIsButtonEnabled(isFormValid);

    if (loginButton.current) {
      if (isFormValid) {
        loginButton.current.style.cursor = 'pointer';
        loginButton.current.style.backgroundColor = 'rgb(255, 71, 71)';
      } else {
        loginButton.current.style.cursor = 'not-allowed';
        loginButton.current.style.backgroundColor = '#f3b5b5';
      }
    }
  }, [formData]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
      general: ''
    };

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = language === 'fr' ? "L'email n'est pas valide" : 'Email is invalid';
      valid = false;
    }

    if (formData.password.length < 6) {
      newErrors.password = language === 'fr'
        ? 'Le mot de passe doit comporter au moins 6 caractères'
        : 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setErrors({ email: '', password: '', general: '' }); // Reset errors before submitting

    try {
      console.log('Sending login request to server...');
      
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Server response:', response.status, data);

      if (response.ok) {
        console.log('Login successful!', data);
        
        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
          
          // Also store refresh token if available
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          
          // Check if user is admin based on data returned from server
          const isAdmin = data.user?.isAdmin === true || data.user?.role === 'admin' || data.user?.role === 'superadmin';
          
          // Store role and admin status
          localStorage.setItem('userRole', data.user?.role || 'user');
          localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
          
          // Store user ID for future API calls
          if (data.user?.id) {
            localStorage.setItem('userId', data.user.id);
          }
          
          console.log('Admin status:', isAdmin);
          
          // Redirect based on admin status
          if (isAdmin) {
            console.log('Admin login detected, redirecting to admin page');
            navigate('/admin');
            return;
          } else {
            // Regular user redirect
            navigate('/search');
          }
        } else {
          // Handle missing token
          setErrors({
            ...errors,
            general: 'Authentication token not received. Please try again.'
          });
        }
      } else {
        // Handle errors from the server
        const serverErrors = {};
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(error => {
            serverErrors[error.path] = error.msg;
          });
        }
        setErrors({
          ...errors,
          ...serverErrors,
          general: data.message || (language === 'fr'
            ? 'Email ou mot de passe incorrect.'
            : 'Incorrect email or password.')
        });
      }
    } catch (error) {
      console.error('Login error details:', error);
      setErrors({
        ...errors,
        general: language === 'fr'
          ? 'Une erreur réseau est survenue. Veuillez réessayer.'
          : 'A network error occurred. Please try again.'
      });
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-specific-container">
        <FadeInSection>
          <div className="login-page-container">
            <img src={floating} alt="Floating Balloon" className="balloon" />
            <div className="auth-container">
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="logo">
                  <img src={redHopeLogo} alt="RedHope Logo" />
                  <a href="/">
                    <h1><span>Red</span>Hope</h1>
                  </a>
                </div>
                {errors.general && <div className="general error">{errors.general}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">
                      {language === 'fr' ? 'Courriel' : 'Email'}
                    </label>
                    <div className="input-icon">
                      <FontAwesomeIcon icon={faUser} className="icon" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="IrishCat122@gmail.com"
                        required
                      />
                    </div>
                    {errors.email && <div className="email error">{errors.email}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">
                      {language === 'fr' ? 'Mot de passe' : 'Password'}
                    </label>
                    <div className="input-icon">
                      <FontAwesomeIcon icon={faLock} className="icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="@123"
                        required
                      />
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="password-toggle-icon"
                        onClick={() => setShowPassword(!showPassword)}
                        role="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      />
                    </div>
                    {errors.password && <div className="password error">{errors.password}</div>}
                  </div>
                </div>

                <button className="log_in" type="submit" ref={loginButton} disabled={!isButtonEnabled}>
                  {language === 'fr' ? 'Connexion' : 'Log In'}
                </button>

                <div className="auth-links">
                  <p>
                    {language === 'fr'
                      ? "Vous n'avez pas de compte ? "
                      : "Don't have an account? "}
                    <Link to="/sign">{language === 'fr' ? 'Inscrivez-vous' : 'Sign Up'}</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </FadeInSection>
      </div>
    </>
  );
}
