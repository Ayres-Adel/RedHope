import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faGlobe, faLocationArrow, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import '../styles/Search.css';
import Navbar from './Navbar';
import { API_BASE_URL } from '../config';


export default function Search() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [buttonClicked, setButtonClicked] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [donors, setDonors] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    bloodType: '',
    gender: '',
  });
  const isMapPage = location.pathname === '/map';
  const isSignPage = location.pathname === '/sign';
  const isLoginPage = location.pathname === '/login';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading', 'success', 'error'
  
  // Initialize map center with default coordinates
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  
  // Initialize user location separately
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  
  const [mapZoom, setMapZoom] = useState(14); 
  const [zoomControlActive, setZoomControlActive] = useState(false); // New state to track if user is manually zooming
  const [selectedDonor, setSelectedDonor] = useState(null);
  const mapContainerRef = useRef(null); // Ref for the map container
  const mapRef = useRef(null); // Add reference for the map instance
  const [isControlled, setIsControlled] = useState(false); // Track if map center is controlled
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 }); // State to control the line's position and width
  const [activeSection, setActiveSection] = useState(isMapPage ? 'map' : 'home'); // Set initial active section

    // Refs for navigation links
    const homeRef = useRef(null);
    const servicesRef = useRef(null);
    const aboutRef = useRef(null);
    

    // Function to handle smooth scrolling and update the active section
    const handleScroll = (id) => {
      // First navigate to home page if not already there
      if (location.pathname !== '/') {
        navigate('/');
        
        // Wait for navigation to complete before scrolling
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100); // Small delay to allow page transition
      } else {
        // If already on home page, just scroll
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
      
      setActiveSection(id);
    };
    
      // Update the line position and width based on the active section
      useEffect(() => {
        const updateLinePosition = () => {
          let ref;
          switch (activeSection) {
            case 'home':
              ref = homeRef;
              break;
            case 'services':
              ref = servicesRef;
              break;
            case 'about':
              ref = aboutRef;
              break;
            case 'map':
              ref = mapRef;
              break;
            default:
              ref = null;
          }
    
          if (ref && ref.current) {
            const { offsetWidth, offsetLeft } = ref.current;
            setLineStyle({ width: offsetWidth, left: offsetLeft });
          }
        };
    
        updateLinePosition();
        window.addEventListener('resize', updateLinePosition); // Update on window resize
        return () => window.removeEventListener('resize', updateLinePosition);
      }, [activeSection]);
    
      // Set active section to 'map' when on the map page
      useEffect(() => {
        if (isMapPage) {
          setActiveSection('map');
        }
      }, [isMapPage]);
    
      // Use IntersectionObserver to detect the active section (for home, services, about)
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
          { threshold: 0.5 } // Adjust the threshold as needed
        );
    
        sections.forEach((sectionId) => {
          const section = document.getElementById(sectionId);
          if (section) {
            observer.observe(section);
          }
        });
    
        // Cleanup observer
        return () => observer.disconnect();
      }, []);

  // Function to handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Filter donors based on selected filters - only use bloodType filter
  const filteredDonors = donors.filter((donor) => {
    return !filters.bloodType || donor.bloodType === filters.bloodType;
  });

  // Handle row click in the table - Modify to set less aggressive zoom and enable easier control
  const handleRowClick = (donor) => {
    setSelectedDonor(donor); // Set the selected donor for the info window
    setMapCenter({ lat: donor.latitude, lng: donor.longitude }); // Center the map on the selected donor
    setMapZoom(15); // Changed from 16 to 15 for less aggressive zoom
    setIsControlled(true); // Set map to controlled mode when selecting a donor
    
    // Set a timeout to allow user zoom control after a brief period
    setTimeout(() => {
      setZoomControlActive(true); // Allow manual zoom after brief delay
    }, 1000);

    // Scroll the map container into view
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Enhanced geolocation handling with better error reporting
  const requestUserLocation = (fallbackToStored = true) => {
    setLocationStatus('loading');
    const token = localStorage.getItem('token');
    
    // Helper function to save successfully retrieved coordinates
    const saveCoordinates = (coords) => {
      if (token) {
        localStorage.setItem('userMapCoordinates', JSON.stringify(coords));
      } else {
        // For guests, use sessionStorage
        sessionStorage.setItem('guestLocationCoordinates', JSON.stringify(coords));
      }
      console.log('Saved coordinates:', coords);
    };
    
    // Function to get any previously saved coordinates
    const getSavedCoordinates = () => {
      try {
        // First try user-specific storage
        let savedCoords = null;
        if (token) {
          const userCoords = localStorage.getItem('userMapCoordinates');
          if (userCoords) {
            savedCoords = JSON.parse(userCoords);
          }
        } else {
          const guestCoords = sessionStorage.getItem('guestLocationCoordinates');
          if (guestCoords) {
            savedCoords = JSON.parse(guestCoords);
          }
        }
        
        if (savedCoords && savedCoords.lat && savedCoords.lng && 
            savedCoords.lat !== 0 && savedCoords.lng !== 0) {
          return savedCoords;
        }
      } catch (err) {
        console.error('Error parsing saved coordinates:', err);
      }
      return null;
    };
    
    // First check if we have any previously saved coordinates
    const savedCoords = getSavedCoordinates();
    
    // Always try to get real-time location
    if (navigator.geolocation) {
      // Track if we've received a response from geolocation to handle timeout properly
      let geolocationResponseReceived = false;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Successfully got real-time location
          geolocationResponseReceived = true;
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          console.log('Using real-time geolocation:', newCoords);
          saveCoordinates(newCoords);
          
          setMapCenter(newCoords);
          setUserLocation(newCoords);
          setMapZoom(14);
          setLocationStatus('success');
          setError(''); // Clear any previous errors
        },
        (error) => {
          console.error('Error getting real-time location:', error);
          geolocationResponseReceived = true;
          
          // If we have previously saved coordinates AND the user is logged in,
          // we can use them as fallback, but still inform user of the current permission issue
          if (savedCoords && token && fallbackToStored) {
            console.log('Geolocation error but using saved coordinates for logged-in user:', savedCoords);
            setMapCenter(savedCoords);
            setUserLocation(savedCoords);
            setMapZoom(14);
            
            // Even though we're using saved coordinates, we still show the permission error
            // so the user knows their current location isn't being used
            setLocationStatus('error');
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                setError('Location access was denied. Using your previously saved location instead. To use your current location, please enable location services and refresh the page.');
                break;
              case error.POSITION_UNAVAILABLE:
                setError('Current location is unavailable. Using your previously saved location instead.');
                break;
              case error.TIMEOUT:
                setError('Request for your location timed out. Using your previously saved location instead.');
                break;
              default:
                setError('An unknown error occurred while retrieving your current location. Using your previously saved location instead.');
                break;
            }
          } else {
            // No saved coordinates or user isn't logged in - show clear error
            setLocationStatus('error');
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                setError('Location access was denied. Please enable location services to find donors near you.');
                break;
              case error.POSITION_UNAVAILABLE:
                setError('Location information is unavailable. Please try again or use a different device.');
                break;
              case error.TIMEOUT:
                setError('The request to get your location timed out. Please check your connection and try again.');
                break;
              default:
                setError('An unknown error occurred while retrieving location. Please try again.');
                break;
            }
            
            // Never use fallback coordinates - set to invalid
            setMapCenter({ lat: 0, lng: 0 });
            setUserLocation({ lat: 0, lng: 0 });
          }
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      // Only show previously saved coordinates as "success" for logged-in users
      if (savedCoords && token) {
        // For logged-in users with saved coordinates, temporarily show them while waiting
        console.log('Using saved coordinates while waiting for fresh location:', savedCoords);
        setMapCenter(savedCoords);
        setUserLocation(savedCoords);
        setMapZoom(14);
        // Don't set locationStatus to success yet - we'll wait for the geolocation response
      }
    } else {
      // Browser doesn't support geolocation
      console.error('Geolocation is not supported by this browser.');
      
      // Use saved coordinates if available for logged-in users
      if (savedCoords && token) {
        console.log('Browser doesn\'t support geolocation. Using saved coordinates:', savedCoords);
        setMapCenter(savedCoords);
        setUserLocation(savedCoords);
        setMapZoom(14);
        setLocationStatus('error'); // Still show as error to inform about the lack of geolocation support
        setError('Geolocation is not supported by your browser. Using your previously saved location instead.');
        return;
      }
      
      // Show error if no saved coordinates or user isn't logged in
      setLocationStatus('error');
      setError('Geolocation is not supported by your browser. Please use a modern browser with location services.');
      
      // Never use fallback coordinates
      setMapCenter({ lat: 0, lng: 0 });
      setUserLocation({ lat: 0, lng: 0 });
    }
  };

  // Initial location request on component mount
  useEffect(() => {
    // Always try real-time location first for everyone
    requestUserLocation(true);  // true = fallback to stored location if needed (for registered users only)
  }, []);

  const handleFindDonorsClick = async () => {
    setButtonClicked(true);
    setIsLoading(true);
    
    // Check if we have valid coordinates before proceeding
    const currentCoords = userLocation.lat !== 0 && userLocation.lng !== 0 
      ? userLocation 
      : mapCenter;

    // If we don't have valid coordinates, don't proceed with the search
    if (currentCoords.lat === 0 || currentCoords.lng === 0) {
      setIsLoading(false);
      setError('Unable to determine your location. Please enable location services and try again.');
      return;
    }
    
    // If we have coordinates but there's a location error, warn the user but proceed
    if (locationStatus === 'error') {
      // User has been shown the error already but we'll proceed with saved coordinates if available
      console.warn('Proceeding with search despite location access issues');
    }
    
    try {
      const token = localStorage.getItem('token');
      let response;
      let endpoint = '';
      
      console.log('Searching donors near:', currentCoords);
      
      // Make API call with or without token depending on user's authentication status
      if (token) {
        endpoint = `${API_BASE_URL}/api/auth/nearby?lat=${currentCoords.lat}&lng=${currentCoords.lng}`;
        console.log('Using authenticated endpoint:', endpoint);
        response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        endpoint = `${API_BASE_URL}/api/auth/public/nearby?lat=${currentCoords.lat}&lng=${currentCoords.lng}`;
        console.log('Using public endpoint:', endpoint);
        response = await axios.get(endpoint);
      }
      
      console.log('API response status:', response.status);
      
      // Get donor data from response, handling different response structures
      const donorData = Array.isArray(response.data) ? response.data : 
                       (response.data.data || []);
      
      console.log(`Retrieved ${donorData.length} donors from API`);
      
      if (!donorData || donorData.length === 0) {
        setDonors([]);
        setShowTable(true);
        setIsLoading(false);
        return;
      }

      // Process donors immediately with basic info to show UI faster
      const basicDonors = donorData.map(donor => {
        // Extract location data safely
        let latitude = 0, longitude = 0;
        
        if (donor.location && typeof donor.location === 'string') {
          const coords = donor.location.split(',').map(coord => parseFloat(coord.trim()));
          if (coords.length === 2) {
            latitude = coords[0];
            longitude = coords[1];
          }
        } else if (donor.latitude !== undefined && donor.longitude !== undefined) {
          // Some APIs might return lat/lng directly
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
      
      // Update UI immediately
      setDonors(basicDonors);
      setShowTable(true);
      
      // Then enhance with location details in background
      Promise.all(
        basicDonors.map(async (donor) => {
          if (!donor.latitude || !donor.longitude) return donor;
          
          try {
            const locationDetails = await fetchLocationDetails(donor.latitude, donor.longitude);
            return { ...donor, locationDetails };
          } catch (err) {
            console.warn(`Failed to fetch location for donor ${donor._id || donor.id}:`, err);
            return donor;
          }
        })
      ).then(enhancedDonors => {
        console.log('Donors enhanced with location details');
        setDonors(enhancedDonors);
      }).catch(err => {
        console.error('Error enhancing donors with location details:', err);
        // We already have basic donor data showing, so no need to update UI on error
      });
      
    } catch (err) {
      console.error('Error fetching nearby donors:', err);
      if (err.response) {
        console.error('Server response error:', err.response.status, err.response.data);
        setError(`Server error (${err.response.status}): ${err.response.data?.message || 'Unknown error'}`);
      } else if (err.request) {
        console.error('No response received');
        setError('No response received from server. Please check your connection.');
      } else {
        setError(err.message || 'Failed to fetch nearby donors. Please try again.');
      }
      setDonors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocationDetails = async (latitude, longitude) => {
    const apiKey = '4bcabb4ac4e54f1692c1e4d811bb29e5';
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status.code === 200 && data.results.length > 0) {
        const { country, county, hamlet } = data.results[0].components;
        return {
          country: country || 'N/A',
          county: county || 'N/A',
          hamlet: hamlet || 'N/A',
        };
      }
      return { country: 'Location details unavailable', county: '', hamlet: '' };
    } catch (error) {
      console.error('Error fetching location details:', error);
      return { country: 'Error fetching location', county: '', hamlet: '' };
    }
  };

  // Consolidate dark mode handling to avoid duplicate code
  useEffect(() => {
    const toggle = document.getElementById('toggle');
    
    // Check localStorage for saved dark mode preference
    const savedMode = localStorage.getItem('darkMode');

    // Apply the saved mode (if any) when the page is loaded
    if (savedMode === 'true') {
      document.body.classList.add('dark-theme');
      toggle.checked = true;
    } else {
      document.body.classList.remove('dark-theme');
      toggle.checked = false;
    }

    // Add event listener for the toggle button to save mode
    const handleToggleChange = () => {
      document.body.classList.toggle('dark-theme', toggle.checked);
      localStorage.setItem('darkMode', toggle.checked);
    };
    
    toggle.addEventListener('change', handleToggleChange);

    // Cleanup event listener
    return () => toggle.removeEventListener('change', handleToggleChange);
  }, []);

  // Remove the useEffect that redirects to login
  useEffect(() => {
    const fetchData = async () => {
      // Remove token check and redirect code
      const token = localStorage.getItem('token');
      try {
        if (token) {
          // Only fetch personalized data if logged in
          const res = await axios.get(`${API_BASE_URL}/dashboard`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setMessage(res.data.msg);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const logout = () => {
    localStorage.removeItem('token');
  };

  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const translations = {
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
    },
    fr: {
      findNearby: 'Trouver des donneurs à proximité',
      clickToLocate: 'Cliquez pour localiser les donneurs de sang près de chez vous et sauver des vies.',
      findDonors: 'Trouver des donneurs',
      noDonors: 'Aucun donneur trouvé à proximité.',
      username: 'Nom d’utilisateur',
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
    },
  };

  // Add contact handler functions
  const handleContactDonor = (method, donor) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      // Prompt to login before contacting
      if (window.confirm('You need to be logged in to contact donors. Would you like to login now?')) {
        navigate('/login');
      }
      return;
    }
    
    switch (method) {
      case 'whatsapp':
        // Create WhatsApp deep link with a prepared message
        window.open(`https://wa.me/${donor.phoneNumber}?text=${encodeURIComponent('Hello, I found you on RedHope. I need your help with blood donation.')}`, '_blank');
        break;
        
      case 'telegram':
        // Use Telegram deep link if available
        if (donor.telegram) {
          window.open(`https://t.me/${donor.telegram}`, '_blank');
        } else {
          // Fallback to the API to request contact
          requestDonorContact('telegram', donor.id);
        }
        break;
        
      case 'sms':
        // Create SMS deep link with a prepared message
        window.open(`sms:${donor.phoneNumber}?body=${encodeURIComponent('Hello, I found you on RedHope. I need your help with blood donation.')}`, '_blank');
        break;
        
      default:
        // Request contact through the app's messaging system
        requestDonorContact('message', donor.id);
    }
  };

  // Helper function to request contact through the API
  const requestDonorContact = async (method, donorId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/contact-requests`, {
        donorId,
        contactMethod: method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Contact request sent! The donor will be notified of your request.');
    } catch (err) {
      console.error('Error sending contact request:', err);
      alert('Failed to send contact request. Please try again later.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="search-component">
        {/* Section lean more*/}
        <div className="Lean-More" ref={mapContainerRef}>
          {/* Conditionally render the heading and paragraph */}
          {!buttonClicked && (
            <>
              <h1>{translations[language].findNearby}</h1>
              <p>{translations[language].clickToLocate}</p>
            </>
          )}
          
          {/* Enhanced Loading Indicator - with only red spinner */}
          {!buttonClicked && locationStatus === 'loading' && (
            <div className="location-status-container">
              <div className="location-loading">
                <div className="location-spinner-container">
                  {/* Removed the blue spinner, keeping only the red one */}
                  <div className="location-spinner-inner"></div>
                </div>
                <p className="location-status-text">
                  Detecting your location<span className="dot-animation">...</span>
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Success Indicator - changed to green */}
          {!buttonClicked && locationStatus === 'success' && (
            <div className="location-status-container">
              <div className="location-success">
                <div className="location-success-icon-container">
                  <FontAwesomeIcon icon={faLocationArrow} className="location-success-icon" />
                </div>
                <p className="location-status-text success">Location detected successfully!</p>
              </div>
            </div>
          )}

          {/* Improved Error Message with Centered Icon */}
          {error && locationStatus === 'error' && (
            <div className="error-message-container">
              <div className="error-message-content">
                <div className="error-icon-container">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                </div>
                <div className="error-text-container">
                  <p className="error-title">Location Problem</p>
                  <p className="error-description">{error}</p>
                </div>
              </div>
              <button 
                className="retry-location-button" 
                onClick={() => window.location.reload()}
              >
                <FontAwesomeIcon icon={faLocationArrow} className="retry-icon" spin />
                Reload & Try Again
              </button>
            </div>
          )}

          {/* Button before search - Disable if location is invalid */}
          {!buttonClicked ? (
            <div className="button-container">
              <button 
                className={`find-donors-button ${userLocation.lat === 0 && userLocation.lng === 0 && mapCenter.lat === 0 && mapCenter.lng === 0 ? 'disabled' : ''}`}
                onClick={handleFindDonorsClick}
                disabled={userLocation.lat === 0 && userLocation.lng === 0 && mapCenter.lat === 0 && mapCenter.lng === 0}
              >
                {translations[language].findDonors}
                <svg className="find-donors-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="search-results-container">
              {/* Filter Section - Only Blood Type filter */}
              <div className="filters" style={{
                display: "flex",
                justifyContent: "center",
                gap: "15px",
                margin: "20px auto",
                maxWidth: "90%",
                padding: "10px",
                background: document.body.classList.contains('dark-theme') ? "#333" : "#f5f5f5",
                borderRadius: "12px",
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
                flexWrap: "wrap"
              }}>
                <div className="filter-group" style={{ display: "flex", flexDirection: "column" }}>
                  <label htmlFor="bloodType" style={{ 
                    marginBottom: "5px", 
                    fontSize: "14px", 
                    fontWeight: "500",
                    color: document.body.classList.contains('dark-theme') ? "#ccc" : "#555"
                  }}>Blood Type</label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={filters.bloodType}
                    onChange={handleFilterChange}
                    className="filter-select"
                    style={{
                      minWidth: "150px",
                      padding: "10px 15px",
                      border: document.body.classList.contains('dark-theme') ? "1px solid #555" : "1px solid #ddd",
                      borderRadius: "8px",
                      background: document.body.classList.contains('dark-theme') ? "#444" : "white",
                      color: document.body.classList.contains('dark-theme') ? "#fff" : "#333",
                      fontSize: "15px",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${document.body.classList.contains('dark-theme') ? "%23fff" : "%23333"}' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "calc(100% - 12px) center",
                      paddingRight: "30px"
                    }}
                  >
                    <option value="">All Blood Types</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Improved Loading Spinner */}
              {isLoading && (
                <div className="loading-spinner-container">
                  <div className="loading-spinner-animation">
                    <div className="spinner-circle"></div>
                  </div>
                  <p className="loading-text">Loading donors...</p>
                </div>
              )}

              {/* Map and Table Side-by-Side Layout */}
              <div className="map-table-container">
                {/* Map on the left */}
                <div className="map-container">
                  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
                    <Map
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
                        zoomControl: true,
                        scrollwheel: true,
                        disableDefaultUI: false,
                        fullscreenControl: true,
                        styles: document.body.classList.contains('dark-theme') ? [
                          {elementType: "geometry", stylers: [{ color: "#242f3e" }]},
                          {elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }]},
                          {elementType: "labels.text.fill", stylers: [{ color: "#746855" }]}
                        ] : undefined
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
                        console.log("Map loaded successfully");
                        mapRef.current = map;
                      }}
                    >
                      {/* User location marker - Update to use userLocation instead of mapCenter */}
                      {userLocation.lat !== 0 && userLocation.lng !== 0 && (
                        <AdvancedMarker
                          position={userLocation}
                          title="Your Location"
                        >
                          <div style={{
                            width: "16px",
                            height: "16px",
                            background: "#4285F4",
                            borderRadius: "50%",
                            border: "2px solid white",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          }}></div>
                        </AdvancedMarker>
                      )}
                      
                      {/* Donor markers */}
                      {filteredDonors.map((donor, index) => (
                        donor.latitude && donor.longitude ? (
                          <AdvancedMarker
                            key={index}
                            position={{ lat: donor.latitude, lng: donor.longitude }}
                            title={donor.username}
                            onClick={() => {
                              setSelectedDonor(donor);
                              setIsControlled(true);
                            }}
                          >
                            <div style={{
                              width: "14px",
                              height: "14px",
                              background: "#ff4747",
                              borderRadius: "50%",
                              border: "2px solid white",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                            }}></div>
                          </AdvancedMarker>
                        ) : null
                      ))}

                      {/* InfoWindow */}
                      {selectedDonor && selectedDonor.latitude && selectedDonor.longitude && (
                        <InfoWindow
                          position={{ lat: selectedDonor.latitude, lng: selectedDonor.longitude }}
                          onCloseClick={() => {
                            setSelectedDonor(null);
                            setZoomControlActive(false);
                            setIsControlled(false);
                          }}
                        >
                          <div className="donor-info-window">
                            <h3>{selectedDonor.username}</h3>
                            <p><strong>Blood Type:</strong> {selectedDonor.bloodType}</p>
                            <p><strong>Gender:</strong> {selectedDonor.gender}</p>
                            <p><strong>Distance:</strong> {selectedDonor.distance ? `${selectedDonor.distance.toFixed(1)} km` : 'Unknown'}</p>
                            {localStorage.getItem('token') && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.location.href = `/contact/${selectedDonor._id}`;
                                }}
                                className="contact-donor-button"
                              >
                                Contact Donor
                              </button>
                            )}
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </APIProvider>
                  
                  {/* Map legend */}
                  <div className="map-legend">
                    <div className="legend-item">
                      <div className="legend-marker your-location"></div>
                      <span>Your location</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-marker donor-location"></div>
                      <span>Blood donors</span>
                    </div>
                  </div>
                </div>

                {/* Donors table on the right */}
                <div className="table-container">
                  <h3>Nearby Blood Donors</h3>
                  <div className={`donor-table-wrapper ${showTable ? 'show' : ''}`}>
                    <table className="donor-table">
                      <thead>
                        <tr>
                          <th>{translations[language].username}</th>
                          <th>{translations[language].gender}</th>
                          <th>{translations[language].bloodType}</th>
                          <th>{translations[language].location}</th>
                          <th>{translations[language].distance}</th>
                          <th>{translations[language].contact}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDonors.length > 0 ? (
                          filteredDonors.map((donor, index) => (
                            <tr key={index} onClick={() => handleRowClick(donor)} className="donor-row">
                              <td>{donor.username}</td>
                              <td>{donor.gender}</td>
                              <td className="blood-type-cell">{donor.bloodType}</td>
                              <td>
                                {donor.locationDetails?.county || donor.locationDetails?.hamlet || donor.locationDetails?.country || 'N/A'}
                              </td>
                              <td>{donor.distance ? `${donor.distance.toFixed(1)} km` : 'N/A'}</td>
                              <td className="contact-buttons-cell">
                                {donor.hasWhatsApp && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleContactDonor('whatsapp', donor); }} 
                                    className="contact-btn whatsapp-btn" 
                                    title="Contact via WhatsApp"
                                  >
                                    <i className="fab fa-whatsapp"></i>
                                  </button>
                                )}
                                {donor.hasTelegram && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleContactDonor('telegram', donor); }} 
                                    className="contact-btn telegram-btn" 
                                    title="Contact via Telegram"
                                  >
                                    <i className="fab fa-telegram-plane"></i>
                                  </button>
                                )}
                                {donor.hasSMS && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleContactDonor('sms', donor); }} 
                                    className="contact-btn sms-btn" 
                                    title="Contact via SMS"
                                  >
                                    <i className="fas fa-sms"></i>
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleContactDonor('message', donor); }} 
                                  className="contact-btn message-btn" 
                                  title="Send in-app message"
                                >
                                  <i className="fas fa-comment"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="no-donors-message">
                              {translations[language].noDonors}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

