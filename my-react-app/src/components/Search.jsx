import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLocationArrow, 
  faExclamationTriangle,
  faMapMarkerAlt,
  faSms,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { 
  faWhatsapp, 
  faTelegram,
} from '@fortawesome/free-brands-svg-icons';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import '../styles/Search.css';
import Navbar from './Navbar';
import { API_BASE_URL } from '../config';
import { getCurrentLocation, reverseGeocode, saveCoordinates, getSavedCoordinates } from '../utils/LocationService';

export default function Search() {
  // Navigation and location
  const navigate = useNavigate();
  const location = useLocation();
  const isMapPage = location.pathname === '/map';
  
  // UI state management - removed unused variables
  const [buttonClicked, setButtonClicked] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

  // Updated language effect to listen for custom events - optimized for performance
  useEffect(() => {
    // Handle direct language change events from navbar
    const handleLanguageChange = (e) => {
      setLanguage(e.detail.language);
    };
    
    document.addEventListener('languageChanged', handleLanguageChange);
    
    // Use storage event instead of polling with setInterval for better performance
    const handleStorageChange = (e) => {
      if (e.key === 'language') {
        const newLang = e.newValue || 'en';
        if (newLang !== language) {
          setLanguage(newLang);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check once on mount
    const currentLang = localStorage.getItem('language') || 'en';
    if (currentLang !== language) {
      setLanguage(currentLang);
    }
    
    return () => {
      document.removeEventListener('languageChanged', handleLanguageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);

  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [mapZoom, setMapZoom] = useState(14);
  const [zoomControlActive, setZoomControlActive] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isControlled, setIsControlled] = useState(false);
  
  // Data state
  const [donors, setDonors] = useState([]);
  const [filters, setFilters] = useState({ bloodType: '' });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // UI refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  
  // Navigation state
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 });
  const [activeSection, setActiveSection] = useState(isMapPage ? 'map' : 'home');

  // Translation system - memoized to prevent recreation
  const translations = useMemo(() => ({
    en: {
      findNearby: 'Find Nearby Donors',
      clickToLocate: 'Click to locate blood donors near you and save lives today.',
      findDonors: 'Find Donors',
      noDonors: 'No donors found nearby.',
      username: 'Username',
      gender: 'Gender',
      email: 'Email',
      phone: 'Phone Number',
      bloodType: 'Blood Type',
      country: 'Country',
      county: 'County',
      hamlet: 'Hamlet',
      logout: 'Log Out',
      location: 'Location',
      distance: 'Distance',
      contact: 'Contact',
      // New translations
      loading: 'Loading donors...',
      nearbyDonors: 'Nearby Blood Donors',
      allBloodTypes: 'All Blood Types',
      yourLocation: 'Your location',
      bloodDonors: 'Blood donors',
      page: 'Page',
      of: 'of',
      detectingLocation: 'Detecting your location',
      locationSuccess: 'Location detected successfully!',
      locationProblem: 'Location Problem',
      reloadAndTry: 'Reload & Try Again',
      sendSms: 'Send SMS message',
      callPhone: 'Call phone number',
      contactWhatsApp: 'Contact via WhatsApp',
      contactTelegram: 'Contact via Telegram',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      // Additional translations for missing text
      aPlus: 'A+',
      aMinus: 'A-',
      bPlus: 'B+',
      bMinus: 'B-',
      abPlus: 'AB+',
      abMinus: 'AB-',
      oPlus: 'O+',
      oMinus: 'O-',
      bloodTypeLabel: 'Blood Type',
      locationLabel: 'Location',
    },
    fr: {
      findNearby: 'Trouver des donneurs à proximité',
      clickToLocate: 'Cliquez pour localiser les donneurs de sang près de chez vous et sauver des vies.',
      findDonors: 'Trouver des donneurs',
      noDonors: 'Aucun donneur trouvé à proximité.',
      username: 'Nom d\'utilisateur',
      gender: 'Genre',
      email: 'E-mail',
      phone: 'Numéro de téléphone',
      bloodType: 'Groupe sanguin',
      country: 'Pays',
      county: 'Comté',
      hamlet: 'Hameau',
      logout: 'Se déconnecter',
      location: 'Emplacement',
      distance: 'Distance',
      contact: 'Contacter',
      // New translations
      loading: 'Chargement des donneurs...',
      nearbyDonors: 'Donneurs de sang à proximité',
      allBloodTypes: 'Tous les groupes sanguins',
      yourLocation: 'Votre position',
      bloodDonors: 'Donneurs de sang',
      page: 'Page',
      of: 'sur',
      detectingLocation: 'Détection de votre position',
      locationSuccess: 'Position détectée avec succès !',
      locationProblem: 'Problème de localisation',
      reloadAndTry: 'Recharger et réessayer',
      sendSms: 'Envoyer un SMS',
      callPhone: 'Appeler',
      contactWhatsApp: 'Contacter via WhatsApp',
      contactTelegram: 'Contacter via Telegram',
      previousPage: 'Page précédente',
      nextPage: 'Page suivante',
      // Additional translations for missing text
      aPlus: 'A+',
      aMinus: 'A-',
      bPlus: 'B+',
      bMinus: 'B-',
      abPlus: 'AB+',
      abMinus: 'AB-',
      oPlus: 'O+',
      oMinus: 'O-',
      bloodTypeLabel: 'Groupe sanguin',
      locationLabel: 'Localisation',
    },
  }), []);

  // Fetch location details - optimized with proper caching
  const fetchLocationDetails = useCallback(async (latitude, longitude) => {
    try {
      const geoData = await reverseGeocode(latitude, longitude, language);
      
      if (geoData.success && geoData.details) {
        return {
          country: geoData.details.country || 'N/A',
          county: geoData.details.county || 'N/A',
          hamlet: geoData.details.hamlet || 'N/A',
          formatted: geoData.formatted || 'N/A'
        };
      }
      
      return { 
        country: 'Location details unavailable', 
        county: '', 
        hamlet: '', 
        formatted: 'N/A' 
      };
    } catch (error) {
      console.error("Error fetching location details:", error);
      return { 
        country: 'Error fetching location', 
        county: '', 
        hamlet: '', 
        formatted: 'N/A' 
      };
    }
  }, [language]);

  // Handle finding donors - improved error handling and promise structure
  const handleFindDonorsClick = useCallback(async (page = 1, filterOverrides = null) => {
    setButtonClicked(true);
    setIsLoading(true);
    
    const currentCoords = userLocation.lat !== 0 && userLocation.lng !== 0 
      ? userLocation 
      : mapCenter;

    if (currentCoords.lat === 0 || currentCoords.lng === 0) {
      setIsLoading(false);
      setError('Unable to determine your location. Please enable location services and try again.');
      return Promise.resolve(); // Return a resolved promise
    }
    
    // Use provided filters or current state
    const currentFilters = filterOverrides || filters;
    
    // Return the promise so we can use it for coordinating actions
    return new Promise(async (resolve) => {
      try {
        const token = localStorage.getItem('token');
        // Build query string with all parameters
        let queryParams = `lat=${currentCoords.lat}&lng=${currentCoords.lng}&page=${page}&limit=${pagination.itemsPerPage}`;
        
        // Add blood type filter if selected
        if (currentFilters.bloodType) {
          queryParams += `&bloodType=${encodeURIComponent(currentFilters.bloodType)}`;
        }
        
        // Add pagination parameters to the endpoint
        let endpoint = token 
          ? `${API_BASE_URL}/api/auth/nearby?${queryParams}`
          : `${API_BASE_URL}/api/auth/public/nearby?${queryParams}`;
        
        const response = await axios.get(endpoint, token ? {
          headers: { Authorization: `Bearer ${token}` }
        } : {});
        
        // Extract donor data from response, handling both array format and {data: [...]} format
        const donorData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        if (!donorData || donorData.length === 0) {
          setDonors([]);
          setShowTable(true);
          setIsLoading(false);
          resolve(); // Resolve the promise
          return;
        }

        // Extract pagination info from response if available
        if (response.data.pagination) {
          setPagination({
            currentPage: response.data.pagination.currentPage || page,
            totalPages: response.data.pagination.totalPages || 1,
            totalItems: response.data.pagination.totalItems || donorData.length,
            itemsPerPage: pagination.itemsPerPage
          });
        }

        // Process donors with basic info first for faster UI updates
        const basicDonors = donorData.map(donor => {
          let latitude = 0, longitude = 0;
          
          if (donor.location && typeof donor.location === 'string') {
            const coords = donor.location.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length === 2) {
              latitude = coords[0];
              longitude = coords[1];
            }
          } else if (donor.latitude !== undefined && donor.longitude !== undefined) {
            latitude = parseFloat(donor.latitude);
            longitude = parseFloat(donor.longitude);
          }
          
          return {
            ...donor,
            latitude,
            longitude,
            locationDetails: { country: 'Loading...', county: 'Loading...', hamlet: 'Loading...' }
          };
        });
        
        // Update UI immediately with basic data - already sorted by distance
        setDonors(basicDonors);
        setShowTable(true);
        
        // Initial data is loaded, let's resolve so we can scroll
        resolve();
        
        // Then enhance with location details in background (don't wait for this)
        // Use AbortController to manage requests that might be canceled
        const controller = new AbortController();
        const signal = controller.signal;
        
        Promise.all(
          basicDonors.map(async (donor) => {
            if (!donor.latitude || !donor.longitude) return donor;
            
            try {
              // Check if the request has been aborted
              if (signal.aborted) return donor;
              
              const locationDetails = await fetchLocationDetails(donor.latitude, donor.longitude);
              return { ...donor, locationDetails };
            } catch (err) {
              console.error(`Error fetching location details for donor ${donor.username}:`, err);
              return donor;
            }
          })
        ).then(enhancedDonors => {
          if (!signal.aborted) {
            setDonors(enhancedDonors);
          }
        }).catch(err => {
          if (!signal.aborted) {
            console.error("Error enhancing donor data:", err);
          }
        });
        
        // Return a cleanup function to abort pending requests if component unmounts
        return () => {
          controller.abort();
        };
        
      } catch (err) {
        if (err.response) {
          setError(`Server error (${err.response.status}): ${err.response.data?.message || 'Unknown error'}`);
        } else if (err.request) {
          setError('No response received from server. Please check your connection.');
        } else {
          setError(err.message || 'Failed to fetch nearby donors. Please try again.');
        }
        setDonors([]);
        resolve(); // Resolve even on error
      } finally {
        setIsLoading(false);
      }
    });
  }, [userLocation, mapCenter, filters, pagination.itemsPerPage, fetchLocationDetails]);

  // Function to handle filter changes - optimized with debounce logic
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        [name]: value,
      };
      
      // Reset to page 1 when filters change and refetch data
      if (buttonClicked) {
        // Use debounce to prevent excessive API calls
        if (window.filterTimeout) {
          clearTimeout(window.filterTimeout);
        }
        
        window.filterTimeout = setTimeout(() => {
          handleFindDonorsClick(1, newFilters);
        }, 300); // 300ms debounce
      }
      
      return newFilters;
    });
  }, [buttonClicked, handleFindDonorsClick]);

  // Handle row click in the table - optimized for better performance
  const handleRowClick = useCallback((donor) => {
    if (!donor || !donor.latitude || !donor.longitude) return;
    
    setSelectedDonor(donor);
    setMapCenter({ lat: donor.latitude, lng: donor.longitude });
    setMapZoom(15);
    setIsControlled(true);
    
    // Set a timeout to allow user zoom control after a brief period
    setTimeout(() => {
      setZoomControlActive(true);
    }, 1000);

    // Update map container scroll behavior to prevent jumping to top
    const mapElement = document.querySelector('.map-container');
    if (mapElement) {
      // Calculate the position to scroll to
      const rect = mapElement.getBoundingClientRect();
      const isVisible = 
        rect.top >= 0 && 
        rect.bottom <= window.innerHeight;
      
      // Only scroll if the map isn't fully visible
      if (!isVisible) {
        // Scroll just enough to make the map visible in the viewport
        mapElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest' // This prevents scrolling all the way to top
        });
      }
    }
  }, []);

  // Location request function - improved error handling
  const requestUserLocation = useCallback((fallbackToStored = true) => {
    setLocationStatus('loading');
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    
    // Get saved coordinates if available
    const savedCoords = getSavedCoordinates(isLoggedIn);
    
    // Use saved coordinates while waiting for fresh location
    if (savedCoords && isLoggedIn) {
      setMapCenter(savedCoords);
      setUserLocation(savedCoords);
      setMapZoom(14);
    }
    
    getCurrentLocation({
      onSuccess: (position) => {
        const newCoords = { lat: position.lat, lng: position.lng };
        
        saveCoordinates(newCoords, isLoggedIn);
        
        setMapCenter(newCoords);
        setUserLocation(newCoords);
        setMapZoom(14);
        setLocationStatus('success');
        setError('');
      },
      onError: (errorMsg) => {
        if (savedCoords && isLoggedIn && fallbackToStored) {
          setMapCenter(savedCoords);
          setUserLocation(savedCoords);
          setMapZoom(14);
          
          setLocationStatus('error');
          setError(`${errorMsg} Using your previously saved location instead.`);
        } else {
          setLocationStatus('error');
          setError(errorMsg);
          
          setMapCenter({ lat: 0, lng: 0 });
          setUserLocation({ lat: 0, lng: 0 });
        }
      },
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }, []);

  // Contact message text - use the current language for message
  const handleContactDonor = useCallback((method, donor) => {
    if (!donor || !donor.phoneNumber) {
      console.error("Missing phone number for donor");
      return;
    }
    
    // Improved phone number formatting for international numbers
    let formattedPhone = donor.phoneNumber;
    
    // Format for Algeria (213)
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `213${formattedPhone.substring(1)}`;
    } else if (!formattedPhone.startsWith('213') && !formattedPhone.startsWith('+213')) {
      formattedPhone = `213${formattedPhone}`;
    }
    
    // Remove any plus sign for services that don't need it
    formattedPhone = formattedPhone.replace(/^\+/, '');
    
    // Use localized message if available
    const messageText = encodeURIComponent(
      language === 'fr' 
        ? 'Bonjour, je vous ai trouvé sur RedHope. J\'ai besoin de votre aide pour un don de sang.'
        : 'Hello, I found you on RedHope. I need your help with a blood donation.'
    );
    
    try {
      switch (method) {
        case 'whatsapp':
          window.open(`https://wa.me/${formattedPhone}?text=${messageText}`, '_blank');
          break;
          
        case 'telegram':
          window.open(`https://t.me/+${formattedPhone}`, '_blank');
          break;
          
        case 'sms':
          window.open(`sms:${donor.phoneNumber}?body=${messageText}`, '_blank');
          break;
          
        case 'call':
          window.open(`tel:${donor.phoneNumber}`, '_blank');
          break;
          
        default:
          window.open(`sms:${donor.phoneNumber}?body=${messageText}`, '_blank');
      }
    } catch (error) {
      console.error("Error opening contact method:", error);
    }
  }, [language]); // Add language dependency

  // Improved page change handler with better scrolling coordination
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    // Show loading state
    setIsLoading(true);
    
    // Fetch donors for the new page with current filters, then scroll when basic data is ready
    handleFindDonorsClick(newPage, filters).then(() => {
      // Use requestAnimationFrame to wait for the next paint cycle
      requestAnimationFrame(() => {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
          // Scroll to slightly above the table container
          window.scrollTo({
            top: tableContainer.offsetTop - 90,
            behavior: 'smooth'
          });
        }
      });
    });
  }, [pagination.totalPages, handleFindDonorsClick, filters]);

  // Simplified helper functions
  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  }, []);
  
  // Initial location request
  useEffect(() => {
    requestUserLocation(true);
    
    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      if (window.filterTimeout) {
        clearTimeout(window.filterTimeout);
      }
    };
  }, [requestUserLocation]);

  // Update line position based on active section
  useEffect(() => {
    const updateLinePosition = () => {
      let ref;
      switch (activeSection) {
        case 'home': ref = homeRef; break;
        case 'services': ref = servicesRef; break;
        case 'about': ref = aboutRef; break;
        case 'map': ref = mapRef; break;
        default: ref = null;
      }

      if (ref && ref.current) {
        const { offsetWidth, offsetLeft } = ref.current;
        setLineStyle({ width: offsetWidth, left: offsetLeft });
      }
    };

    updateLinePosition();
    
    // Add event listener with proper cleanup
    window.addEventListener('resize', updateLinePosition);
    return () => window.removeEventListener('resize', updateLinePosition);
  }, [activeSection]);

  // Set active section to 'map' when on the map page
  useEffect(() => {
    if (isMapPage) {
      setActiveSection('map');
    }
  }, [isMapPage]);

  // Use IntersectionObserver to detect active section
  useEffect(() => {
    const sections = ['home', 'services', 'about'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Optimize marker rendering by using memo for stable marker styles
  const userLocationMarkerStyle = useMemo(() => ({
    width: "16px",
    height: "16px",
    background: "#4285F4",
    borderRadius: "50%",
    border: "2px solid white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    zIndex: 200,
  }), []);
  
  const donorMarkerStyle = useMemo(() => ({
    width: "14px",
    height: "14px",
    background: "#ff4747",
    borderRadius: "50%",
    border: "2px solid white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  }), []);

  // Main render
  return (
    <>
      <Navbar />
      <div className="search-component">
        {/* Lean More section*/}
        <div className="Lean-More" ref={mapContainerRef}>
          {/* Heading and description */}
          {!buttonClicked && (
            <>
              <h1>{translations[language].findNearby}</h1>
              <p>{translations[language].clickToLocate}</p>
            </>
          )}
          
          {/* Location status indicators */}
          {!buttonClicked && locationStatus === 'loading' && (
            <div className="location-status-container">
              <div className="location-loading">
                <div className="location-spinner-container">
                  <div className="location-spinner-inner"></div>
                </div>
                <p className="location-status-text">
                  {translations[language].detectingLocation}<span className="dot-animation">...</span>
                </p>
              </div>
            </div>
          )}

          {!buttonClicked && locationStatus === 'success' && (
            <div className="location-status-container">
              <div className="location-success">
                <div className="location-success-icon-container">
                  <FontAwesomeIcon icon={faLocationArrow} className="location-success-icon" />
                </div>
                <p className="location-status-text success">{translations[language].locationSuccess}</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && locationStatus === 'error' && (
            <div className="error-message-container">
              <div className="error-message-content">
                <div className="error-icon-container">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                </div>
                <div className="error-text-container">
                  <p className="error-title">{translations[language].locationProblem}</p>
                  <p className="error-description">{error}</p>
                </div>
              </div>
              <button 
                className="retry-location-button" 
                onClick={() => window.location.reload()}
                aria-label={translations[language].reloadAndTry}
              >
                <FontAwesomeIcon icon={faLocationArrow} className="retry-icon" spin />
                {translations[language].reloadAndTry}
              </button>
            </div>
          )}

          {/* Find donors button */}
          {!buttonClicked ? (
            <div className="button-container">
              <button 
                className={`find-donors-button ${userLocation.lat === 0 && userLocation.lng === 0 && mapCenter.lat === 0 && mapCenter.lng === 0 ? 'disabled' : ''}`}
                onClick={handleFindDonorsClick}
                disabled={userLocation.lat === 0 && userLocation.lng === 0 && mapCenter.lat === 0 && mapCenter.lng === 0}
                aria-label="Find blood donors near you"
              >
                {translations[language].findDonors}
                <svg className="find-donors-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="search-results-container">
              {/* Filters */}
              <div className="filters">
                <div className="filter-group">
                  <label htmlFor="bloodType">{translations[language].bloodType}</label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={filters.bloodType}
                    onChange={handleFilterChange}
                    className="filter-select"
                    aria-label={`Filter donors by ${translations[language].bloodType}`}
                  >
                    <option value="">{translations[language].allBloodTypes}</option>
                    <option value="A+">{translations[language].aPlus}</option>
                    <option value="A-">{translations[language].aMinus}</option>
                    <option value="B+">{translations[language].bPlus}</option>
                    <option value="B-">{translations[language].bMinus}</option>
                    <option value="AB+">{translations[language].abPlus}</option>
                    <option value="AB-">{translations[language].abMinus}</option>
                    <option value="O+">{translations[language].oPlus}</option>
                    <option value="O-">{translations[language].oMinus}</option>
                  </select>
                </div>
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="loading-spinner-container" aria-live="polite">
                  <div className="loading-spinner-animation">
                    <div className="spinner-circle"></div>
                  </div>
                  <p className="loading-text">{translations[language].loading}</p>
                </div>
              )}

              {/* Map and donors table */}
              <div className="map-table-container">
                {/* Map */}
                <div className="map-container">
                  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
                    <Map
                      className='google-map'
                      mapId={document.body.classList.contains('dark-theme') ? "8f51571e39b5d5e" : "7e663c504dc4b013"}
                      defaultCenter={mapCenter}
                      center={isControlled ? mapCenter : undefined}
                      defaultZoom={14}
                      zoom={isControlled && !zoomControlActive ? mapZoom : undefined}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "15px",
                        border: document.body.classList.contains('dark-theme') 
                          ? "1px solid rgba(255, 255, 255, 0.1)" 
                          : "1px solid rgba(0, 0, 0, 0.1)",
                      }}
                      options={{
                        gestureHandling: "cooperative",
                        disableDefaultUI: true,
                        fullscreenControl: true,
                        zoomControl: true, // Add zoom control to the map
                      }}
                      onDragStart={() => setIsControlled(false)}
                      onDrag={() => setIsControlled(false)}
                      onZoomChanged={() => {
                        setZoomControlActive(true);
                        setIsControlled(false);
                      }}
                      onClick={() => {
                        setSelectedDonor(null);
                        setZoomControlActive(false);
                        setIsControlled(false);
                      }}
                      onLoad={(map) => {
                        mapRef.current = map;
                      }}
                    >
                      {/* User location marker */}
                      {userLocation.lat !== 0 && userLocation.lng !== 0 && (
                        <AdvancedMarker position={userLocation} title={translations[language].yourLocation}>
                          <div style={userLocationMarkerStyle}></div>
                        </AdvancedMarker>
                      )}
                      
                      {/* Donor markers */}
                      {donors.map((donor, index) => {
                        // Skip if no valid coordinates
                        if (!donor.latitude || !donor.longitude) return null;
                        
                        // Create a unique ID for this donor to ensure stable reference
                        const donorId = donor._id || `index-${index}`;
                        
                        return (
                          <AdvancedMarker
                            key={donorId}
                            position={{ lat: donor.latitude, lng: donor.longitude }}
                            title={donor.username}
                            onClick={(e) => {
                              // Prevent event bubbling
                              if (e && e.stopPropagation) e.stopPropagation();
                              
                              // Find the donor by ID from the current donors array to ensure we have latest data
                              const donorToShow = donors.find(d => (d._id || `index-${donors.indexOf(d)}`) === donorId);
                              
                              // Use the found donor or fallback to the original reference
                              const targetDonor = donorToShow || donor;
                              
                              // Update state with proper centering
                              setSelectedDonor(targetDonor);
                              setMapCenter({ lat: targetDonor.latitude, lng: targetDonor.longitude });
                              setIsControlled(true);
                            }}
                          >
                            <div style={donorMarkerStyle}></div>
                          </AdvancedMarker>
                        );
                      })}

                      {/* Info window for selected donor */}
                      {selectedDonor && selectedDonor.latitude && selectedDonor.longitude && (
                        <InfoWindow
                          position={{ lat: selectedDonor.latitude, lng: selectedDonor.longitude }}
                          onCloseClick={() => {
                            setSelectedDonor(null);
                            setZoomControlActive(false);
                            setIsControlled(false);
                          }}
                          options={{ pixelOffset: { width: 0, height: -20 } }}
                        >
                          <div className="donor-info-window">
                            <h3>{selectedDonor.username}</h3>
                            <p><strong>Blood Type:</strong> {selectedDonor.bloodType}</p>
                            <p><strong>Distance:</strong> {selectedDonor.distance ? `${selectedDonor.distance.toFixed(1)} km` : 'Unknown'}</p>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </APIProvider>
                  
                  {/* Map legend */}
                  <div className="map-legend" aria-label="Map legend">
                    <div className="legend-item">
                      <div className="legend-marker your-location"></div>
                      <span>{translations[language].yourLocation}</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-marker donor-location"></div>
                      <span>{translations[language].bloodDonors}</span>
                    </div>
                  </div>
                </div>

                {/* Donors table */}
                <div className="table-container">
                  <h3 className="nearby-donors-heading">{translations[language].nearbyDonors}</h3>
                  <div className={`donor-table-wrapper ${showTable ? 'show' : ''}`}>
                    <table className="donor-table" aria-label="Blood donor information">
                      <thead>
                        <tr>
                          <th scope="col" className="responsive-header">{translations[language].username}</th>
                          <th scope="col" className="responsive-header">{translations[language].bloodType}</th>
                          <th scope="col" className="responsive-header">{translations[language].location}</th>
                          <th scope="col" className="responsive-header">{translations[language].distance}</th>
                          <th scope="col" className="responsive-header">{translations[language].contact}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donors.length > 0 ? (
                          donors.map((donor, index) => (
                            <tr key={donor._id || index} onClick={() => handleRowClick(donor)} className="donor-row">
                              <td>{donor.username}</td>
                              <td className="blood-type-cell">{donor.bloodType}</td>
                              <td>
                                {donor.locationDetails?.county || donor.locationDetails?.hamlet || donor.locationDetails?.country || 'N/A'}
                              </td>
                              <td>{donor.distance ? `${donor.distance.toFixed(1)} km` : 'N/A'}</td>
                              <td className="contact-buttons-cell">
                                {/* Contact buttons */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleContactDonor('sms', donor); }} 
                                  className="contact-btn sms-btn" 
                                  title={translations[language].sendSms}
                                  aria-label={`${translations[language].sendSms} ${donor.username}`}
                                >
                                  <FontAwesomeIcon icon={faSms} style={{color: '#e74c3c', fontSize: '1.4rem'}} />
                                </button>
                                
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleContactDonor('call', donor); }} 
                                  className="contact-btn call-btn" 
                                  title={translations[language].callPhone}
                                  aria-label={`${translations[language].callPhone} ${donor.username}`}
                                >
                                  <FontAwesomeIcon icon={faPhone} style={{color: '#e74c3c', fontSize: '1.4rem'}} />
                                </button>
                                
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleContactDonor('whatsapp', donor); }} 
                                  className="contact-btn whatsapp-btn" 
                                  title={translations[language].contactWhatsApp}
                                  aria-label={`${translations[language].contactWhatsApp} ${donor.username}`}
                                >
                                  <FontAwesomeIcon icon={faWhatsapp} style={{color: '#25D366', fontSize: '1.4rem'}} />
                                </button>
                                
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleContactDonor('telegram', donor); }} 
                                  className="contact-btn telegram-btn" 
                                  title={translations[language].contactTelegram}
                                  aria-label={`${translations[language].contactTelegram} ${donor.username}`}
                                >
                                  <FontAwesomeIcon icon={faTelegram} style={{color: '#0088cc', fontSize: '1.4rem'}} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="no-donors-message">
                              {translations[language].noDonors}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination controls - desktop version */}
                  {!isLoading && donors.length > 0 && (
                    <div className="pagination-controls desktop-pagination">
                      <button 
                        onClick={() => handlePageChange(pagination.currentPage - 1)} 
                        disabled={pagination.currentPage === 1}
                        className="pagination-button"
                        aria-label={translations[language].previousPage}
                      >
                        <span aria-hidden="true">«</span>
                      </button>
                      
                      <span className="pagination-info">
                        {translations[language].page} {pagination.currentPage} {translations[language].of} {pagination.totalPages}
                      </span>
                      
                      <button 
                        onClick={() => handlePageChange(pagination.currentPage + 1)} 
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="pagination-button"
                        aria-label={translations[language].nextPage}
                      >
                        <span aria-hidden="true">»</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Mobile view donor cards */}
                  <div className="donor-cards-container" role="list">
                    {donors.length > 0 ? (
                      donors.map((donor, index) => (
                        <div key={donor._id || index} className="donor-card" onClick={() => handleRowClick(donor)} role="listitem">
                          <div className="donor-card-header">
                            <div className="donor-avatar">
                              {donor.bloodType}
                            </div>
                            <h3 className="donor-card-name">{donor.username}</h3>
                          </div>
                          
                          <div className="donor-card-info">
                            <div>
                              <label>{translations[language].bloodTypeLabel}</label>
                              <span className="blood-type">{donor.bloodType}</span>
                            </div>
                            <div>
                              <label>{translations[language].locationLabel}</label>
                              <span>{donor.locationDetails?.county || donor.locationDetails?.hamlet || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="donor-card-actions">
                            <div className="card-contact-buttons">
                              {/* Contact buttons for mobile */}
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleContactDonor('sms', donor); }} 
                                className="contact-btn sms-btn" 
                                title={translations[language].sendSms}
                                aria-label={`Send SMS to ${donor.username}`}
                              >
                                <FontAwesomeIcon icon={faSms} style={{color: '#e74c3c', fontSize: '1.4rem'}} />
                              </button>
                              
                              <button
                                onClick={(e) => { e.stopPropagation(); handleContactDonor('call', donor); }} 
                                className="contact-btn call-btn" 
                                title={translations[language].callPhone}
                                aria-label={`Call ${donor.username}`}
                              >
                                <FontAwesomeIcon icon={faPhone} style={{color: '#e74c3c', fontSize: '1.4rem'}} />
                              </button>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleContactDonor('whatsapp', donor); }} 
                                className="contact-btn whatsapp-btn" 
                                title={translations[language].contactWhatsApp}
                                aria-label={`WhatsApp ${donor.username}`}
                              >
                                <FontAwesomeIcon icon={faWhatsapp} style={{color: '#25D366', fontSize: '1.4rem'}} />
                              </button>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleContactDonor('telegram', donor); }} 
                                className="contact-btn telegram-btn" 
                                title={translations[language].contactTelegram}
                                aria-label={`Telegram ${donor.username}`}
                              >
                                <FontAwesomeIcon icon={faTelegram} style={{color: '#0088cc', fontSize: '1.4rem'}} />
                              </button>
                            </div>
                            
                            <div className="donor-distance">
                              <FontAwesomeIcon icon={faMapMarkerAlt} style={{color: '#e74c3c', marginRight: '5px'}} aria-hidden="true" /> 
                              {donor.distance ? `${donor.distance.toFixed(1)} km` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-donors-message">
                        {translations[language].noDonors}
                      </div>
                    )}
                  </div>
                  
                  {/* Pagination controls - mobile version */}
                  {!isLoading && donors.length > 0 && (
                    <div className="pagination-controls mobile-pagination">
                      <button 
                        onClick={() => handlePageChange(pagination.currentPage - 1)} 
                        disabled={pagination.currentPage === 1}
                        className="pagination-button"
                        aria-label={translations[language].previousPage}
                      >
                        <span aria-hidden="true">«</span>
                      </button>
                      
                      <span className="pagination-info">
                        {translations[language].page} {pagination.currentPage} {translations[language].of} {pagination.totalPages}
                      </span>
                      
                      <button 
                        onClick={() => handlePageChange(pagination.currentPage + 1)} 
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="pagination-button"
                        aria-label={translations[language].nextPage}
                      >
                        <span aria-hidden="true">»</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}