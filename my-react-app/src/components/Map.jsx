import "../styles/map.css";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import { API_BASE_URL } from '../config';
import { SearchBar } from './MapComponents/SearchBar';
import { BloodTypeStats } from './MapComponents/BloodTypeStats';
import { useHospitals } from '../hooks/useHospitals';
import { useBloodStatistics } from '../hooks/useBloodStatistics';

export default function MapComponent() {

  const defaultCenter = {
    lat: 36.16215909617758,
    lng: 1.330560770492638,
  };

  // Core state
  const [open, setOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isControlled, setIsControlled] = useState(false);
  const [controlledCenter, setControlledCenter] = useState(null);
  const mapRef = useRef(null);
  const [selectedCityName, setSelectedCityName] = useState("National");
  
  // Use custom hooks for data fetching
  const { hospitals, isLoading, error } = useHospitals();
  const { 
    bloodTypeStats, 
    totalDonors, 
    loadingStats, 
    statsError,
    fetchBloodTypeStats 
  } = useBloodStatistics();
  
  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains("dark-theme")
  );
  
  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains("dark-theme"));
    };

    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);

  // Handle location changes from CitySelector
  const handleLocationChange = useCallback((newLocation, cityName, cityId) => {
    console.log(`Location change: ${cityName} (${cityId}), coordinates: ${JSON.stringify(newLocation)}`);
    
    setSelectedCityName(cityName || "All Cities");
    
    // If All Cities is selected, only update stats
    if (cityName === "All Cities" || !cityId) {
      fetchBloodTypeStats(null);
      return;
    }
    
    // If coordinates are available, update the map
    if (newLocation) {
      const newCenter = {
        lat: Number(newLocation.lat),
        lng: Number(newLocation.lng),
      };
      
      setControlledCenter(newCenter);
      setIsControlled(true);

      if (mapRef.current) {
        mapRef.current.panTo(newCenter);
        mapRef.current.setZoom(12);
      }
      
      fetchBloodTypeStats(cityId);
    }
  }, [fetchBloodTypeStats]);

  // Search handler
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const filtered = hospitals
        ?.filter(
          (hospital) =>
            hospital.name.toLowerCase().includes(value.toLowerCase()) ||
            hospital.wilaya.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5) || [];
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [hospitals]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((hospital) => {
    setIsControlled(true);
    
    // Normalize position format
    let coordinates;
    if (hospital.position && hospital.position.lat && hospital.position.lng) {
      coordinates = {
        lat: Number(hospital.position.lat),
        lng: Number(hospital.position.lng)
      };
    } else if (hospital.location && hospital.location.coordinates) {
      coordinates = {
        lat: Number(hospital.location.coordinates[1]),
        lng: Number(hospital.location.coordinates[0])
      };
    } else {
      console.error("Hospital data doesn't have valid position information:", hospital);
      return;
    }
    
    setMapCenter(coordinates);
    setControlledCenter(coordinates);
    
    // Pan the map
    if (mapRef.current) {
      mapRef.current.panTo(coordinates);
      mapRef.current.setZoom(15);
    }
    
    // Set selected marker with normalized coordinates
    setSelectedMarker({
      ...hospital,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      type: "hospital",
    });
    
    setOpen(true);
    handleCloseSearch();
  }, []);

  // Close search
  const handleCloseSearch = useCallback(() => {
    setShowSearch(false);
    setShowSuggestions(false);
    setSearchTerm("");
  }, []);

  // Render markers efficiently with useMemo
  const hospitalMarkers = useMemo(() => {
    if (!hospitals || hospitals.length === 0) {
      return null;
    }
    
    return hospitals.map((hospital, index) => {
      // Skip hospitals without valid position data
      if (!hospital.position || !hospital.position.lat || !hospital.position.lng) {
        return null;
      }
      
      return (
        <AdvancedMarker
          key={`hospital-${index}-${hospital.name}`}
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
    }).filter(Boolean); // Filter out null values
  }, [hospitals]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading hospitals data...</p>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className="error-container">
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
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <Map
                  className="google-map"
                  // Remove the direct ref prop
                  mapId={isDarkMode ? "8f51571e39b5d5e" : "7e663c504dc4b013"}
                  options={{
                    gestureHandling: "cooperative",
                    styles: isDarkMode ? [
                      {elementType: "geometry", stylers: [{ color: "#242f3e" }]},
                      {elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }]},
                      {elementType: "labels.text.fill", stylers: [{ color: "#746855" }]},
                    ] : undefined,
                    disableDefaultUI: true,    // Disable all default UI
                    fullscreenControl: true, // Disable fullscreen control
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
                  }}
                  onMouseDown={() => {
                    setIsControlled(false);
                  }}
                  onTouchStart={() => {
                    setIsControlled(false);
                  }}
                  onLoad={(map) => {
                    mapRef.current = map;
                  }}
                >
                  <SearchBar 
                    showSearch={showSearch}
                    setShowSearch={setShowSearch}
                    searchInputRef={searchInputRef}
                    searchTerm={searchTerm}
                    handleSearch={handleSearch}
                    isDarkMode={isDarkMode}
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    handleSuggestionClick={handleSuggestionClick}
                  />
                  
                  {hospitalMarkers}
                  
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
            
            <BloodTypeStats
              bloodTypeStats={bloodTypeStats}
              selectedCityName={selectedCityName}
              loadingStats={loadingStats}
              totalDonors={totalDonors}
              statsError={statsError}
              fetchBloodTypeStats={fetchBloodTypeStats}
            />
          </div>
        </div>
      </div>
    </>
  );
}
