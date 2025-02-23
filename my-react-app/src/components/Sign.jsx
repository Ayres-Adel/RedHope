// src/components/Sign.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import '../styles/auth.css';
import FadeInSection from './FadeInSection.jsx'; // Import FadeInSection
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import floating from '../assets/images/balloon.svg';
import { 
  faUser, 
  faEnvelope, 
  faCalendarAlt, 
  faMapMarkerAlt, 
  faTint, 
  faMars, 
  faLock, 
  faEye, 
  faEyeSlash, 
  faPhone 
} from '@fortawesome/free-solid-svg-icons'; // Import necessary icons

// Import images
import redHopeLogo from '../assets/images/RedHope_Logo.png';

export default function Sign() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    dateOfBirth: '',
    location: '',
    phoneNumber: '', // Added phoneNumber to the form data state
    bloodType: '',
    gender: '',
    password: '',
    isDonor: '' // Add isDonor to the form data state
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    dateOfBirth: '',
    location: '',
    phoneNumber: '', // Added error state for phoneNumber
    bloodType: '',
    gender: '',
    password: '',
    isDonor: '', // Add error state for isDonor
    general: ''
  });
  const navigate = useNavigate();
  const signButton = useRef(null);

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
    const isFormValid = 
      formData.username &&
      formData.email &&
      formData.dateOfBirth &&
      formData.location &&
      formData.phoneNumber &&
      formData.bloodType &&
      formData.gender &&
      formData.password.length >= 6 &&
      formData.isDonor;
    setIsButtonEnabled(isFormValid);

    if (signButton.current) {
      if (isFormValid) {
        signButton.current.style.cursor = 'pointer';
        signButton.current.style.backgroundColor = 'rgb(255, 71, 71)';
      } else {
        signButton.current.style.cursor = 'not-allowed';
        signButton.current.style.backgroundColor = '#f3b5b5';
      }
    }
  }, [formData]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      username: '',
      email: '',
      dateOfBirth: '',
      location: '',
      phoneNumber: '',
      bloodType: '',
      gender: '',
      password: '',
      isDonor: '',
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

    if (!formData.isDonor) {
      newErrors.isDonor = language === 'fr'
        ? 'Veuillez sélectionner si vous souhaitez être donneur.'
        : 'Please select if you want to be a donor.';
      valid = false;
    }

    // Phone number validation: expecting exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = language === 'fr'
        ? 'Le numéro de téléphone n\'est pas valide'
        : 'Phone number is invalid';
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
  
    setErrors({
      username: '', 
      email: '', 
      dateOfBirth: '', 
      location: '', 
      phoneNumber: '', 
      bloodType: '', 
      gender: '', 
      password: '', 
      isDonor: '', 
      general: ''
    });
  
    try {
      const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/search');
      } else {
        const newErrors = { ...errors };
  
        if (data.error) {
          // If it's a single error message
          newErrors.general = data.error;
        } else if (data.errors) {
          // If the server returns validation errors
          data.errors.forEach(error => {
            if (error.toLowerCase().includes("email")) {
              newErrors.email = error;
            } else if (error.toLowerCase().includes("phone number")) {
              newErrors.phoneNumber = error;
            } else if (error.toLowerCase().includes("password")) {
              newErrors.password = error;
            }
          });
        }
  
        setErrors(newErrors);
      }
    } catch (error) {
      setErrors({ ...errors, general: language === 'fr'
        ? 'Une erreur réseau est survenue. Veuillez réessayer.'
        : 'A network error occurred. Please try again.' 
      });
      console.error('Error:', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
  
          try {
            const apiKey = '4bcabb4ac4e54f1692c1e4d811bb29e5';
            const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=${apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
  
            if (data.status.code === 200 && data.results.length > 0) {
              const { country, county, hamlet } = data.results[0].components;
  
              // Update your formData or handle the data as needed
              setFormData({
                ...formData,
                location: `${latitude}, ${longitude}`,
                formattedLocation: language === 'fr'
                  ? `Pays : ${country}, Département : ${county}, Localité : ${hamlet}`
                  : `Country: ${country}, County: ${county}, Hamlet: ${hamlet}`
              });
  
              console.log(`Country: ${country}, County: ${county}, Hamlet: ${hamlet}`);
            } else {
              setErrors({
                ...errors,
                location: language === 'fr'
                  ? 'Échec de la récupération des informations de localisation depuis l\'API.'
                  : 'Failed to retrieve location details from the API.'
              });
            }
          } catch (error) {
            setErrors({
              ...errors,
              location: language === 'fr'
                ? 'Erreur lors de la récupération de la localisation depuis l\'API.'
                : 'Error fetching location from the API.'
            });
            console.error('Error fetching location:', error);
          }
        },
        () => {
          setErrors({
            ...errors,
            location: language === 'fr'
              ? 'Impossible de récupérer votre localisation.'
              : 'Unable to retrieve your location.'
          });
        }
      );
    } else {
      setErrors({
        ...errors,
        location: language === 'fr'
          ? 'La géolocalisation n\'est pas supportée par ce navigateur.'
          : 'Geolocation is not supported by this browser.'
      });
    }
  };

  useEffect(() => {
    const toggle = document.getElementById('toggle');
    toggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-theme', toggle.checked);
    });

    // Cleanup event listener
    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      });
    };
  }, []);

  return (
    <>
      <Navbar />
      <FadeInSection>
        <img src={floating} alt="Floating Balloon" className="balloon" />
        <div className="auth-container">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className='logo'>
              <img src={redHopeLogo} alt="RedHope Logo" />
              <a href="/">
                <h1><span>Red</span>Hope</h1>
              </a>
            </div>
            {errors.general && <div className="general error">{errors.general}</div>}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">
                  {language === 'fr' ? "Nom d'utilisateur" : 'Username'}
                </label>
                <div className="input-icon">
                  <FontAwesomeIcon icon={faUser} className="icon" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={language === 'fr' ? 'Ex: Ayres123' : 'Ex: Ayres123'}
                    required
                  />
                </div>
                {errors.username && <div className="username error">{errors.username}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  {language === 'fr' ? 'Courriel' : 'Email'}
                </label>
                <div className="input-icon">
                  <FontAwesomeIcon icon={faEnvelope} className="icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="User@gmail.com"
                    required
                  />
                </div>
                {errors.email && <div className="email error">{errors.email}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">
                  {language === 'fr' ? 'Date de naissance' : 'Date of Birth'}
                </label>
                <div className="input-icon">
                  <FontAwesomeIcon icon={faCalendarAlt} className="icon" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.dateOfBirth && <div className="dateOfBirth error">{errors.dateOfBirth}</div>}
              </div>

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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bloodType">
                  {language === 'fr' ? 'Groupe sanguin' : 'Blood Type'}
                </label>
                <div className="input-icon">
                  <FontAwesomeIcon icon={faTint} className="icon" />
                  <select name="bloodType" value={formData.bloodType} onChange={handleChange} required>
                    <option value="">{language === 'fr' ? 'Sélectionnez votre groupe' : 'Select Blood Type'}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                {errors.bloodType && <div className="bloodType error">{errors.bloodType}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="gender">
                  {language === 'fr' ? 'Sexe' : 'Gender'}
                </label>
                <div className="input-icon">
                  <FontAwesomeIcon icon={faMars} className="icon" />
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">{language === 'fr' ? 'Sélectionnez votre sexe' : 'Select Gender'}</option>
                    <option value="Male">{language === 'fr' ? 'Homme' : 'Male'}</option>
                    <option value="Female">{language === 'fr' ? 'Femme' : 'Female'}</option>
                  </select>
                </div>
                {errors.gender && <div className="gender error">{errors.gender}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">
                  {language === 'fr' ? 'Localisation' : 'Location'}
                </label>
                <div className="input-icon">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="icon" />
                  <input
                    type="text"
                    name="location"
                    value={formData.formattedLocation || formData.location}
                    onChange={handleChange}
                    placeholder={language === 'fr' ? 'Appuyez sur le bouton Obtenir la localisation' : 'Press GET LOCATION button'}
                    required
                    readOnly
                  />
                </div>
                {errors.location && <div className="location error">{errors.location}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">
                  {language === 'fr' ? 'Numéro de téléphone' : 'Phone Number'}
                </label>
                <div className="input-icon">
                  <FontAwesomeIcon icon={faPhone} className="icon" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder={language === 'fr' ? 'Entrez votre numéro de téléphone' : 'Enter your phone number'}
                    required
                  />
                </div>
                {errors.phoneNumber && <div className="phoneNumber error">{errors.phoneNumber}</div>}
              </div>
            </div>

            <div className="form-row">
              <button className='btn_loc' type="button" onClick={getLocation}>
                {language === 'fr' ? 'Obtenir la localisation' : 'Get Location'}
              </button>
              <button type="submit" ref={signButton} disabled={!isButtonEnabled}>
                {language === 'fr' ? 'Inscrivez-vous' : 'Sign Up'}
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {language === 'fr'
                    ? 'Souhaitez-vous être donneur ?'
                    : 'Do you want to be a donor?'}
                </label>
                <div className="input-icon">
                  <input
                    type="radio"
                    name="isDonor"
                    value="yes"
                    checked={formData.isDonor === 'yes'}
                    onChange={handleChange}
                  />
                  <label htmlFor="isDonorYes">{language === 'fr' ? 'Oui' : 'Yes'}</label>

                  <input
                    type="radio"
                    name="isDonor"
                    value="no"
                    checked={formData.isDonor === 'no'}
                    onChange={handleChange}
                  />
                  <label htmlFor="isDonorNo">{language === 'fr' ? 'Non' : 'No'}</label>
                </div>
                {errors.isDonor && <div className="isDonor error">{errors.isDonor}</div>}
              </div>
            </div>

            <div className="auth-links">
              <p>
                {language === 'fr'
                  ? 'Vous avez déjà un compte ? '
                  : 'Already have an account? '}
                <Link to="/login">{language === 'fr' ? 'Connectez-vous' : 'Log In'}</Link>
              </p>
            </div>
          </form>
        </div>
      </FadeInSection>
    </>
  );
}
