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
  // This prevents the map from reloading when switching themes
  const stableMapId = "redhope-map-id";

  useEffect(() => {
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

  const handleLocationChange = (newLocation) => {
    const newCenter = {
      lat: Number(newLocation.lat),
      lng: Number(newLocation.lng),
    };
    setControlledCenter(newCenter);
    setIsControlled(true);

    if (mapRef.current) {
      mapRef.current.panTo(newCenter);
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
      <div className="map-container">
        <h2 className={isDarkMode ? "dark-mode-text" : ""}>
          Find Hospitals and Blood Centers
        </h2>
        <CitySelector onLocationChange={handleLocationChange} isDarkMode={isDarkMode} />
        {/* Use a key that doesn't change when themes change */}
        <APIProvider apiKey="AIzaSyAeTAUxWY5luBGsf-F6-vP8eDLqgjzmACg" key="api-provider">
          <div style={mapStyle} key="map-container">
            <Map
              ref={mapRef}
              /* Use a single mapId that doesn't change when theme changes */
              mapId="7e663c504dc4b013"
              /* Apply custom styling based on dark mode */
              options={{
                gestureHandling: "cooperative",
                styles: isDarkMode ? [
                  {
                    elementType: "geometry",
                    stylers: [{ color: "#242f3e" }]
                  },
                  {
                    elementType: "labels.text.stroke",
                    stylers: [{ color: "#242f3e" }]
                  },
                  {
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#746855" }]
                  },
                  // ...more dark mode styles can go here
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
                style={{
                  ...searchContainerStyle,
                  appearance: "none",
                  border: "none",
                  outline: "none",
                }}
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
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search hospitals..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      background: "transparent",
                      color: isDarkMode ? "#f0f0f0" : "#333",
                    }}
                  />
                ) : (
                  <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
                    <path
                      d="M9 16C12.866 16 16 12.866 16 9C16 5.13401 12.866 2 9 2C5.13401 2 2 5.13401 2 9C2 12.866 5.13401 16 9 16Z"
                      stroke={isDarkMode ? "#ff6b6b" : "#ff4747"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 18L14 14"
                      stroke={isDarkMode ? "#ff6b6b" : "#ff4747"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    className="suggestions-container"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      width: "100%",
                      background: isDarkMode ? "#333" : "white",
                      borderRadius: "10px",
                      boxShadow: isDarkMode
                        ? "0 6px 16px rgba(0,0,0,0.3)"
                        : "0 6px 16px rgba(0,0,0,0.08)",
                      zIndex: 1001,
                      maxHeight: "180px",
                      overflowY: "auto",
                      overflowX: "hidden",
                      padding: "4px 0",
                      border: isDarkMode
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "8px 10px",
                          cursor: "pointer",
                          backgroundColor: isDarkMode ? "#333" : "white",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textAlign: "left",
                          borderLeft: "2px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? "#444"
                            : "#ff474715";
                          e.currentTarget.style.transform = "translateX(4px)";
                          e.currentTarget.style.borderLeft =
                            "2px solid #ff4747";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode
                            ? "#333"
                            : "white";
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.borderLeft =
                            "2px solid transparent";
                        }}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                            stroke="#ff4747"
                            strokeWidth="1.5"
                            fill="#ff474710"
                          />
                        </svg>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: "500",
                              color: isDarkMode ? "#f0f0f0" : "#2c3e50",
                            }}
                          >
                            {suggestion.name}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: isDarkMode ? "#ccc" : "#666",
                              fontWeight: "400",
                            }}
                          >
                            {suggestion.wilaya}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </button>
              {renderMarkers()}
              {open && selectedMarker && (
                <InfoWindow
                  position={
                    selectedMarker.type === "blood"
                      ? { lat: selectedMarker.lat, lng: selectedMarker.lng }
                      : {
                          lat: selectedMarker.latitude,
                          lng: selectedMarker.longitude,
                        }
                  }
                  onCloseClick={() => {
                    setOpen(false);
                    setSelectedMarker(null);
                  }}
                >
                  <div style={{ color: "#333" }}>
                    <h3>{selectedMarker.name}</h3>
                    {selectedMarker.type === "hospital" && (
                      <>
                        <p>Address: {selectedMarker.address || 'Not available'}</p>
                        <p>Contact: {selectedMarker.contact?.phone || 'Not available'}</p>
                        <p>Wilaya: {selectedMarker.wilaya || 'Not specified'}</p>
                        {selectedMarker.category && <p>Type: {selectedMarker.category}</p>}
                      </>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </div>
        </APIProvider>
      </div>
    </>
  );
}
