import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import '../styles/Search.css';

export default function Search() {
  const [message, setMessage] = useState('');
  const [buttonClicked, setButtonClicked] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [donors, setDonors] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    bloodType: '',
    gender: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const mapContainerRef = useRef(null); // Ref for the map container

  // Function to handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Filter donors based on selected filters
  const filteredDonors = donors.filter((donor) => {
    return (
      (!filters.bloodType || donor.bloodType === filters.bloodType) &&
      (!filters.gender || donor.gender === filters.gender)
    );
  });

  // Handle row click in the table
  const handleRowClick = (donor) => {
    setSelectedDonor(donor); // Set the selected donor for the info window
    setMapCenter({ lat: donor.latitude, lng: donor.longitude }); // Center the map on the selected donor

    // Scroll the map container into view
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fetch user's current location for map center
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
          setMapCenter({ lat: 48.8566, lng: 2.3522 }); // Fallback to Paris, France
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setMapCenter({ lat: 48.8566, lng: 2.3522 }); // Fallback to Paris, France
    }
  }, []);

  const handleFindDonorsClick = async () => {
    setButtonClicked(true);
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:3000/nearby', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedDonors = await Promise.all(
        res.data.map(async (donor) => {
          if (donor.location) {
            const [latitude, longitude] = donor.location.split(',').map(coord => coord.trim());
            const locationDetails = await fetchLocationDetails(latitude, longitude);
            return { ...donor, locationDetails, latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
          }
          return { ...donor, locationDetails: { country: 'Unknown Location', county: '', hamlet: '' } };
        })
      );

      setDonors(updatedDonors);
      setTimeout(() => {
        setShowTable(true);
      }, 300);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch nearby donors. Please try again.');
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
    toggle.addEventListener('change', () => {
      // Toggle dark theme on body
      document.body.classList.toggle('dark-theme', toggle.checked);

      // Save the dark mode preference in localStorage
      localStorage.setItem('darkMode', toggle.checked);
    });

    // Cleanup event listener
    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
        localStorage.setItem('darkMode', toggle.checked);
      });
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Redirect to sign-in if no token
        return;
      }
      try {
        const res = await axios.get('http://127.0.0.1:3000/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessage(res.data.msg);
      } catch (err) {
        console.error(err);
        setMessage('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

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
    },
  };

  return (
    <>
      {/* Section nav bar*/}
      <header>
        <nav>
          <div className="RedHope">
            <img src="/src/assets/images/RedHope_Logo.png" alt="RedHope Logo" />
            <a href="/">
              <h1>
                <span>Red</span>Hope
              </h1>
            </a>
          </div>

          {/* Hamburger Menu */}
          <div className="hamburger" onClick={toggleMenu}>
            <div></div>
            <div></div>
            <div></div>
          </div>

          <div className={`User ${isMenuOpen ? 'active' : ''}`}>
            <a href="">
              <div className={`User_Profile ${isMenuOpen ? 'active' : ''}`}>{message}</div>
            </a>
            <a href="/">
              <div className="User-Profile" onClick={logout}>
                <FontAwesomeIcon icon={faSignOutAlt} className="login-icon" />
              </div>
            </a>
          </div>

          <div className="theme_change">
            <div className={`toggle-container ${isMenuOpen ? 'active' : ''}`}>
              <input type="checkbox" id="toggle" />
              <label htmlFor="toggle" className="display">
                <div className="circle">
                  <svg className="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
                  </svg>
                  <svg className="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
                  </svg>
                </div>
              </label>
            </div>
          </div>

          <div className={`language-switcher ${isMenuOpen ? 'active' : ''}`}>
            <FontAwesomeIcon
              icon={faGlobe}
              className="language-icon"
              onClick={() => changeLanguage(language === 'en' ? 'fr' : 'en')}
              title={language === 'en' ? 'Switch to French' : 'Switch to English'}
            />
          </div>
        </nav>
      </header>

      {/* Section lean more*/}
      <div className="Lean-More" ref={mapContainerRef}>
        {/* Conditionally render the heading and paragraph */}
        {!buttonClicked && (
          <>
            <h1>{translations[language].findNearby}</h1>
            <p>{translations[language].clickToLocate}</p>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Map Integration */}
        {buttonClicked && !isLoading && (
          <div className="map-container">
           <APIProvider apiKey="AIzaSyAeTAUxWY5luBGsf-F6-vP8eDLqgjzmACg">
  <Map
    defaultCenter={mapCenter}
    defaultZoom={10}
    style={{ height: '400px', width: '100%' }}
  >
    {filteredDonors.map((donor, index) => (
      <Marker
        key={index}
        position={{ lat: donor.latitude, lng: donor.longitude }}
        title={donor.username}
        onClick={() => setSelectedDonor(donor)}
        icon={{
          url: './src/assets/images/marker.png', // Your custom logo
          scaledSize: new window.google.maps.Size(40, 40), // Adjust size as needed
        }}
      />
    ))}

    {selectedDonor && (
      <InfoWindow
        position={{ lat: selectedDonor.latitude, lng: selectedDonor.longitude }}
        onCloseClick={() => setSelectedDonor(null)}
      >
        <div>
          <h3>{selectedDonor.username}</h3>
          <p>Blood Type: {selectedDonor.bloodType}</p>
          <p>Gender: {selectedDonor.gender}</p>
          <p>Email: {selectedDonor.email}</p>
          <p>Phone: {selectedDonor.phoneNumber}</p>
        </div>
      </InfoWindow>
    )}
  </Map>
</APIProvider>
          </div>
        )}

        {/* Filter Section */}
        <div className="filters">
          <select
            name="bloodType"
            value={filters.bloodType}
            onChange={handleFilterChange}
            className="filter-select"
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

          <select
            name="gender"
            value={filters.gender}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading donors...</p>
          </div>
        )}

        {/* Button and Table */}
        <div className="button-container">
          {buttonClicked ? (
            <div className={`donor-table-wrapper ${showTable ? 'show' : ''}`}>
              <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th>{translations[language].username}</th>
                    <th>{translations[language].gender}</th>
                    <th>{translations[language].email}</th>
                    <th>{translations[language].phone}</th>
                    <th>{translations[language].bloodType}</th>
                    <th>{translations[language].country}</th>
                    <th>{translations[language].county}</th>
                    <th>{translations[language].hamlet}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.length > 0 ? (
                    filteredDonors.map((donor, index) => (
                      <tr key={index} onClick={() => handleRowClick(donor)} style={{ cursor: 'pointer' }}>
                        <td>{donor.username}</td>
                        <td>{donor.gender}</td>
                        <td>{donor.email}</td>
                        <td>{donor.phoneNumber}</td>
                        <td>{donor.bloodType}</td>
                        <td>{donor.locationDetails?.country || 'N/A'}</td>
                        <td>{donor.locationDetails?.county || 'N/A'}</td>
                        <td>{donor.locationDetails?.hamlet || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center' }}>
                        {translations[language].noDonors}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <button className="find-donors-button" onClick={handleFindDonorsClick}>
              {translations[language].findDonors}
            </button>
          )}
        </div>
      </div>
    </>
  );
}