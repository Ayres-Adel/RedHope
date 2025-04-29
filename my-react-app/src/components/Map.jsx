import "../styles/map.css";
import React, { useState, useRef, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import Navbar from "./Navbar";
import HospitalIcon from "../assets/images/hospital.png";
import CitySelector from "./CitySelect";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone, faHospital, faClock, faSearch, faTint, faUsers, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function MapComponent() {
  const mapStyle = {
    width: "80%",
    height: "450px",
    borderRadius: "15px",
    margin: "20px auto",
    position: "relative", // Add this to make absolute positioning work correctly
  };

  const defaultCenter = {
    lat: 36.16215909617758,
    lng: 1.330560770492638,
  };

  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [open, setOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isControlled, setIsControlled] = useState(false);
  const [controlledCenter, setControlledCenter] = useState(null);
  const [isSearchHovered, setIsSearchHovered] = useState(false);

  const searchInputRef = useRef(null);
  const mapRef = useRef(null);

  // Add a state to track dark theme
  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains("dark-theme")
  );
  
  // Create a stable map ID that doesn't change when theme changes
  const stableMapId = "redhope-map-id";

  // Add state for blood statistics
  const [bloodTypeStats, setBloodTypeStats] = useState({
    "A+": { count: 0, color: "#ff4747" },
    "A-": { count: 0, color: "#ff6b6b" },
    "B+": { count: 0, color: "#2ecc71" },
    "B-": { count: 0, color: "#3dd685" },
    "AB+": { count: 0, color: "#3498db" },
    "AB-": { count: 0, color: "#4aa3df" },
    "O+": { count: 0, color: "#f39c12" },
    "O-": { count: 0, color: "#f5b041" },
  });
  const [selectedCityName, setSelectedCityName] = useState("National");
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [totalDonors, setTotalDonors] = useState(0);

  // Function to fetch blood type statistics from the backend
  const fetchBloodTypeStats = async (cityId = null) => {
    setLoadingStats(true);
    setStatsError(null);
    
    try {
      // Build the endpoint URL based on whether a city is selected
      const endpoint = cityId 
        ? `http://localhost:3000/api/stats/blood-types?cityId=${cityId}` 
        : 'http://localhost:3000/api/stats/blood-types';
      
      console.log(`Fetching blood stats from: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch blood type statistics');
      }
      
      console.log("Received blood stats:", data);
      
      // Build a standardized data object to update our state
      // Assuming API returns an object with counts for each blood type
      const newStats = { ...bloodTypeStats };
      let donorCount = 0;
      
      // Map API response based on the expected format
      // Check both possible formats: direct count objects or nested structure
      const statsData = data.data || data;
      
      if (statsData.bloodTypes) {
        // Handle nested structure
        Object.entries(statsData.bloodTypes).forEach(([type, count]) => {
          if (newStats[type]) {
            newStats[type] = { ...newStats[type], count: count };
            donorCount += count;
          }
        });
      } else {
        // Handle direct object structure
        Object.entries(statsData).forEach(([type, count]) => {
          // Normalize blood type format (API might return A_PLUS instead of A+)
          const normalizedType = type.replace('_PLUS', '+').replace('_MINUS', '-');
          if (newStats[normalizedType]) {
            newStats[normalizedType] = { 
              ...newStats[normalizedType], 
              count: typeof count === 'number' ? count : parseInt(count, 10) || 0 
            };
            donorCount += newStats[normalizedType].count;
          }
        });
      }
      
      setBloodTypeStats(newStats);
      setTotalDonors(donorCount);
      console.log("Blood stats updated:", newStats, "Total donors:", donorCount);
      
    } catch (error) {
      console.error("Error fetching blood type statistics:", error);
      setStatsError(error.message);
      // Fallback to mock data if real data fetch fails
      useMockData();
    } finally {
      setLoadingStats(false);
    }
  };
  
  // Fallback to mock data if real data fetch fails
  const useMockData = () => {
    const mockStats = {
      "A+": { count: 386, color: "#ff4747" },
      "A-": { count: 68, color: "#ff6b6b" },
      "B+": { count: 214, color: "#2ecc71" },
      "B-": { count: 42, color: "#3dd685" },
      "AB+": { count: 124, color: "#3498db" },
      "AB-": { count: 18, color: "#4aa3df" },
      "O+": { count: 452, color: "#f39c12" },
      "O-": { count: 96, color: "#f5b041" },
    };
    
    setBloodTypeStats(mockStats);
    setTotalDonors(Object.values(mockStats).reduce((sum, type) => sum + type.count, 0));
    console.log("Using mock data as fallback");
  };

  // Initial fetch of national stats
  useEffect(() => {
    fetchBloodTypeStats();
    
    const fetchHospitals = async () => {
      try {
        setIsLoading(true);
        // Hardcode the URL without using process.env
        const response = await fetch("http://localhost:3000/api/map/hospitals");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch hospitals');
        }
        
        const hospitalsData = data.data?.locations || [];
        console.log(`Loaded ${hospitalsData.length} hospitals`);
        
        if (hospitalsData.length === 0) {
          console.warn('No hospitals found in the data');
        }
        
        setHospitals(hospitalsData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        setError(`Failed to load hospitals: ${err.message}`);
        setIsLoading(false);
      }
    };

    fetchHospitals();

    // Listen for theme changes to update UI accordingly
    const handleThemeChange = () => {
      // Just update the isDarkMode state without forcing a re-render of the map
      setIsDarkMode(document.body.classList.contains("dark-theme"));
    };

    window.addEventListener("themeChange", handleThemeChange);

    return () => {
      window.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

  const applyFilters = (hospitals, filters) => {
    return hospitals.filter(hospital => {
      // Filter by search query
      if (filters.searchQuery && !hospital.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }

      // Add more filtering logic for donation status, blood type, distance
      // This is a placeholder - implement actual filtering based on your data structure

      return true;
    });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleApplyFilters = () => {
    setFilterOpen(false);
    // Filters are applied automatically via useEffect
  };

  const searchIconStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: showSearch ? 0 : 1,
    transition: "opacity 0.2s ease",
    position: "absolute",
    left: showSearch ? "10px" : "50%",
    top: "50%",
    transform: showSearch ? "translateY(-50%)" : "translate(-50%, -50%)",
  };

  const searchContainerStyle = {
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: isDarkMode ? "#333" : "white",
    borderRadius: showSearch ? "25px" : "50%",
    padding: showSearch ? "10px 15px" : "12px",
    boxShadow: isDarkMode
      ? "0 2px 6px rgba(0,0,0,0.3)"
      : "0 2px 6px rgba(0,0,0,0.1)",
    width: showSearch ? "300px" : "45px",
    height: showSearch ? "45px" : "45px",
    transition: "all 0.3s ease",
    cursor: "pointer",
  };

  const searchInputStyle = {
    border: "none",
    outline: "none",
    width: "100%",
    padding: "0 8px",
    fontSize: "14px",
    opacity: showSearch ? 1 : 0,
    transition: "opacity 0.2s ease 0.2s",
    color: isDarkMode ? "#f0f0f0" : "#333",
  };

  const suggestionsStyle = {
    position: "absolute",
    top: "calc(100% + 5px)",
    left: 0,
    width: "100%",
    background: isDarkMode ? "#333" : "white",
    borderRadius: "8px",
    boxShadow: isDarkMode
      ? "0 4px 8px rgba(0,0,0,0.3)"
      : "0 4px 8px rgba(0,0,0,0.1)",
    zIndex: 1001,
    maxHeight: "200px",
    overflowY: "auto",
  };

  const suggestionItemStyle = {
    padding: "10px 15px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    backgroundColor: isDarkMode ? "#333" : "white",
    "&:hover": {
      backgroundColor: isDarkMode ? "#444" : "#f5f5f5",
    },
  };

  const suggestionItemHoverStyle = {
    ...suggestionItemStyle,
    backgroundColor: isDarkMode ? "#444" : "#fff0f0",
    transform: "translateX(5px)",
    borderLeft: "3px solid #ff4747",
  };

  const handleLocationChange = (newLocation, cityName, cityId) => {
    console.log(`Location change: ${cityName} (${cityId}), coordinates: ${JSON.stringify(newLocation)}`);
    
    // Update the selected city name
    setSelectedCityName(cityName || "All Cities");
    
    // If All Cities is selected, we don't want to change map coordinates
    if (cityName === "All Cities" || !cityId) {
      // Just fetch national stats without changing map coordinates
      fetchBloodTypeStats(null);
      return; // Don't update map coordinates
    }
    
    // If we have coordinates, update the map
    if (newLocation) {
      // Regular city selection
      const newCenter = {
        lat: Number(newLocation.lat),
        lng: Number(newLocation.lng),
      };
      
      setControlledCenter(newCenter);
      setIsControlled(true);

      if (mapRef.current) {
        mapRef.current.panTo(newCenter);
        mapRef.current.setZoom(12); // City-level zoom
      }
      
      // Fetch city-specific stats
      fetchBloodTypeStats(cityId);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const filtered = hospitals
        .filter(
          (hospital) =>
            hospital.name.toLowerCase().includes(value.toLowerCase()) ||
            hospital.wilaya.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (hospital) => {
    setIsControlled(false);
    setMapCenter({
      lat: Number(hospital.location.coordinates[1]),
      lng: Number(hospital.location.coordinates[0]),
    });

    setSelectedMarker({
      ...hospital,
      latitude: hospital.location.coordinates[1],
      longitude: hospital.location.coordinates[0],
      type: "hospital",
    });
    setOpen(true);
    handleCloseSearch();
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setShowSuggestions(false);
    setSearchTerm("");
  };

  const renderMarkers = () => {
    if (!hospitals || hospitals.length === 0) {
      return null;
    }
    
    return (
      <>
        {hospitals.map((hospital, index) => {
          // Skip hospitals without valid position data
          if (!hospital.position || !hospital.position.lat || !hospital.position.lng) {
            console.warn(`Hospital ${hospital.name} has invalid position data`);
            return null;
          }
          
          return (
            <AdvancedMarker
              key={`hospital-${index}`}
              position={{
                lat: hospital.position.lat,
                lng: hospital.position.lng
              }}
              title={hospital.name}
              onClick={() => {
                setSelectedMarker({
                  ...hospital,
                  latitude: hospital.position.lat,
                  longitude: hospital.position.lng,
                  type: "hospital",
                });
                setOpen(true);
              }}
            >
              <img
                src={HospitalIcon}
                alt={hospital.name}
                style={{ width: "30px", height: "30px" }}
              />
            </AdvancedMarker>
          );
        })}
      </>
    );
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div
            className="loading-spinner"
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #ff4747",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
              margin: "20px auto",
            }}
          ></div>
          <p>Loading hospitals data...</p>
          <style>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Error loading hospitals</h2>
          <p>{error}</p>
          <p>Please try again later</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="hospitals-page-container">
        <div className="hospitals-header">
          <h1>Hospitals & Blood Centers</h1>
          <p>Find hospitals and blood banks across Algeria</p>
        </div>
        
        <div className="map-section">
          <div className="map-controls">
            <CitySelector 
              onLocationChange={handleLocationChange} 
              isDarkMode={isDarkMode} 
              includeAllCities={true}
            />
          </div>
          
          <div className="map-container">
            <div className="hospital-map-content">
              <APIProvider apiKey="AIzaSyAeTAUxWY5luBGsf-F6-vP8eDLqgjzmACg">
                <Map
                  ref={mapRef}
                  mapId={isDarkMode ? "8f51571e39b5d5e" : "7e663c504dc4b013"}
                  options={{
                    gestureHandling: "cooperative",
                    styles: isDarkMode ? [
                      {elementType: "geometry", stylers: [{ color: "#242f3e" }]},
                      {elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }]},
                      {elementType: "labels.text.fill", stylers: [{ color: "#746855" }]},
                    ] : undefined
                  }}
                  defaultCenter={mapCenter}
                  center={isControlled ? controlledCenter : undefined}
                  defaultZoom={12}
                  onClick={handleCloseSearch}
                  onDragStart={() => {
                    setIsControlled(false);
                    handleCloseSearch();
                  }}
                  onDrag={() => {
                    setIsControlled(false);
                    handleCloseSearch();
                  }}
                >
                  <button
                    className="map-search-button"
                    onClick={() => {
                      if (!showSearch) {
                        setShowSearch(true);
                        setTimeout(() => searchInputRef.current?.focus(), 300);
                        setOpen(false);
                        setSelectedMarker(null);
                      }
                    }}
                    aria-label="Search hospitals"
                  >
                    {showSearch ? (
                      <>
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search hospitals..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="map-search-input"
                        />
                      </>
                    ) : (
                      <FontAwesomeIcon icon={faSearch} />
                    )}

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="suggestions-container">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="suggestion-icon" />
                            <div className="suggestion-text">
                              <span className="suggestion-name">{suggestion.name}</span>
                              <span className="suggestion-wilaya">{suggestion.wilaya}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                  
                  {renderMarkers()}
                  
                  {open && selectedMarker && (
                    <InfoWindow
                      position={{
                        lat: selectedMarker.latitude,
                        lng: selectedMarker.longitude,
                      }}
                      onCloseClick={() => {
                        setOpen(false);
                        setSelectedMarker(null);
                      }}
                    >
                      <div className="hospital-info-window">
                        <h3>{selectedMarker.name}</h3>
                        {selectedMarker.type === "hospital" && (
                          <>
                            <p><FontAwesomeIcon icon={faMapMarkerAlt} /> {selectedMarker.address || 'Not available'}</p>
                            <p><FontAwesomeIcon icon={faPhone} /> {selectedMarker.contact?.phone || 'Not available'}</p>
                            <p><FontAwesomeIcon icon={faHospital} /> {selectedMarker.category || 'Hospital'}</p>
                            <div className="hospital-info-buttons">
                              <button className="donation-button accepting">Accepting Donations</button>
                              <button className="donation-button emergency">Emergency Requests</button>
                            </div>
                          </>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
              
              <div className="map-location-indicator">
                <FontAwesomeIcon icon={faMapMarkerAlt} /> 
                <span className="coordinates">
                  {isControlled && controlledCenter 
                    ? `${controlledCenter.lat.toFixed(4)}, ${controlledCenter.lng.toFixed(4)}`
                    : `${mapCenter.lat.toFixed(4)}, ${mapCenter.lng.toFixed(4)}`}
                </span>
              </div>
            </div>
            
            <div className="blood-type-stats">
              <div className="stats-header">
                <h3><FontAwesomeIcon icon={faTint} /> Blood Type Statistics</h3>
                <div className="stats-location">
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> 
                  <span>{selectedCityName} Region</span>
                </div>
                <p className="donor-count">
                  <FontAwesomeIcon icon={faUsers} /> 
                  {loadingStats ? (
                    <span className="loading-text">
                      <FontAwesomeIcon icon={faSpinner} className="fa-spin" /> Loading donor data...
                    </span>
                  ) : (
                    <span>{totalDonors.toLocaleString()} Registered Donors</span>
                  )}
                </p>
              </div>
              
              {statsError ? (
                <div className="stats-error">
                  <p>Could not load blood type statistics</p>
                  <button onClick={() => fetchBloodTypeStats()} className="retry-button">
                    Try Again
                  </button>
                </div>
              ) : loadingStats ? (
                <div className="stats-loading">
                  <div className="blood-type-grid">
                    {Array(8).fill(0).map((_, idx) => (
                      <div key={idx} className="blood-type-card skeleton"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="blood-type-grid">
                    {Object.entries(bloodTypeStats).map(([type, data]) => (
                      <div key={type} className="blood-type-card">
                        <div className="blood-type-symbol" style={{ backgroundColor: `${data.color}20`, color: data.color }}>
                          {type}
                        </div>
                        <div className="blood-type-info">
                          <div className="blood-count">{data.count.toLocaleString()}</div>
                          <div className="blood-label">donors</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="blood-chart">
                    <div className="chart-bars">
                      {Object.entries(bloodTypeStats).map(([type, data]) => {
                        const percentage = totalDonors > 0 ? (data.count / totalDonors) * 100 : 0;
                        return (
                          <div key={type} className="chart-bar-container">
                            <div className="chart-bar-label">{type}</div>
                            <div className="chart-bar-wrapper">
                              <div 
                                className="chart-bar" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: data.color
                                }}
                              ></div>
                            </div>
                            <div className="chart-bar-value">{percentage.toFixed(1)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              
              <div className="stats-footer">
                <p>Help save lives by joining our donor community</p>
                <button 
                  className="become-donor-btn"
                  onClick={() => window.location.href = '/signup'}
                >
                  Become a Donor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
