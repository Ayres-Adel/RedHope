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

  const [open, setOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isControlled, setIsControlled] = useState(false);
  const [controlledCenter, setControlledCenter] = useState(null);
  const mapRef = useRef(null);
  const [selectedCityName, setSelectedCityName] = useState("National");

  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

  const translations = useMemo(() => ({
    en: {
      pageTitle: "Hospitals & Blood Centers",
      pageSubtitle: "Find hospitals and blood banks across Algeria",
      loadingHospitals: "Loading hospitals data...",
      errorLoadingHospitals: "Error loading hospitals",
      tryAgainLater: "Please try again later",
      acceptingDonations: "Accepting Donations",
      notAvailable: "Not available",
      hospital: "Hospital"
    },
    fr: {
      pageTitle: "Hôpitaux & Centres de Sang",
      pageSubtitle: "Trouvez des hôpitaux et des banques de sang à travers l'Algérie",
      loadingHospitals: "Chargement des données des hôpitaux...",
      errorLoadingHospitals: "Erreur de chargement des hôpitaux",
      tryAgainLater: "Veuillez réessayer plus tard",
      acceptingDonations: "Accepte les Dons",
      notAvailable: "Non disponible",
      hospital: "Hôpital"
    }
  }), []);

  const t = translations[language];

  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  const { hospitals, isLoading, error } = useHospitals();
  const { 
    bloodTypeStats, 
    totalDonors, 
    loadingStats, 
    statsError,
    fetchBloodTypeStats 
  } = useBloodStatistics();

  const [isDarkMode, setIsDarkMode] = useState(
    document.body.classList.contains("dark-theme")
  );

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains("dark-theme"));
    };

    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);

  const handleLocationChange = useCallback((newLocation, cityName, cityId) => {
    setSelectedCityName(cityName || "All Cities");

    if (cityName === "All Cities" || !cityId) {
      fetchBloodTypeStats(null);
      return;
    }

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

  const handleSuggestionClick = useCallback((hospital) => {
    setIsControlled(true);

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

    if (mapRef.current) {
      mapRef.current.panTo(coordinates);
      mapRef.current.setZoom(15);
    }

    setSelectedMarker({
      ...hospital,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      type: "hospital",
    });
    
    setOpen(true);
    handleCloseSearch();
  }, []);

  const handleCloseSearch = useCallback(() => {
    setShowSearch(false);
    setShowSuggestions(false);
    setSearchTerm("");
  }, []);

  const hospitalMarkers = useMemo(() => {
    if (!hospitals || hospitals.length === 0) {
      return null;
    }
    
    return hospitals.map((hospital, index) => {
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
    }).filter(Boolean);
  }, [hospitals]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t.loadingHospitals}</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="error-container">
          <h2>{t.errorLoadingHospitals}</h2>
          <p>{error}</p>
          <p>{t.tryAgainLater}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="hospitals-page-container">
        <div className="hospitals-header">
          <h1>{t.pageTitle}</h1>
          <p>{t.pageSubtitle}</p>
        </div>
        
        <div className="map-section">
          <div className="map-controls">
            <CitySelector 
              onLocationChange={handleLocationChange} 
              isDarkMode={isDarkMode} 
              includeAllCities={true}
              language={language}
            />
          </div>
          
          <div className="map-container">
            <div className="hospital-map-content">
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
                <Map
                  className="google-map"
                  mapId={isDarkMode ? "8f51571e39b5d5e" : "7e663c504dc4b013"}
                  options={{
                    gestureHandling: "cooperative",
                    styles: isDarkMode ? [
                      {elementType: "geometry", stylers: [{ color: "#242f3e" }]},
                      {elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }]},
                      {elementType: "labels.text.fill", stylers: [{ color: "#746855" }]},
                    ] : undefined,
                    disableDefaultUI: true,
                    fullscreenControl: true, 
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
                    language={language}
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
                      <div className="accepting-donations-label">{t.acceptingDonations}</div>
                      <div className="hospital-info-window">
                        
                        <h3>{selectedMarker.name}</h3>
                        {selectedMarker.type === "hospital" && (
                          <>
                            <p><FontAwesomeIcon icon={faMapMarkerAlt} /> {selectedMarker.address || t.notAvailable}</p>
                            <p><FontAwesomeIcon icon={faPhone} /> {selectedMarker.contact?.phone || t.notAvailable}</p>
                            <p><FontAwesomeIcon icon={faHospital} /> {selectedMarker.category || t.hospital}</p>
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
              language={language}
            />
          </div>
        </div>
      </div>
    </>
  );
}
