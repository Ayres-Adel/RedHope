import '../styles/map.css';
import React, { useState, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import Navbar from "./Navbar";
import BloodIcon from "../assets/images/blood-donation.png";
import HospitalIcon from "../assets/images/hospital.png"; // Add hospital icon
import CitySelector from "./CitiesSelect";
import hospitalsData from "../assets/Hospitals.json";

export default function MapComponent() {
  const mapStyle = {
    width: "80%",
    height: "450px",
    borderRadius: "15px",
    margin: "20px auto",
  };

  const defaultCenter = {
    lat: 36.16215909617758,
    lng: 1.330560770492638,
  };

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

  const searchIconStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: showSearch ? 0 : 1,
    transition: 'opacity 0.2s ease',
    position: 'absolute',
    left: showSearch ? '10px' : '50%',
    top: '50%',
    transform: showSearch ? 'translateY(-50%)' : 'translate(-50%, -50%)',
  };

  const searchContainerStyle = {
    position: 'absolute',
    top: '-10px',
    left: '-180px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'white',
    borderRadius: showSearch ? '25px' : '50%',
    padding: showSearch ? '10px 15px' : '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    width: showSearch ? '300px' : '45px',
    height: showSearch ? '45px' : '45px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const searchInputStyle = {
    border: 'none',
    outline: 'none',
    width: '100%',
    padding: '0 8px',
    fontSize: '14px',
    opacity: showSearch ? 1 : 0,
    transition: 'opacity 0.2s ease 0.2s',
  };

  const suggestionsStyle = {
    position: 'absolute',
    top: 'calc(100% + 5px)',
    left: 0,
    width: '100%',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    zIndex: 1001,
    maxHeight: '200px',
    overflowY: 'auto',
  };

  const suggestionItemStyle = {
    padding: '10px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  };

  const suggestionItemHoverStyle = {
    ...suggestionItemStyle,
    backgroundColor: "#fff0f0",
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
      const filtered = hospitalsData.hospitals
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
      lat: Number(hospital.latitude),
      lng: Number(hospital.longitude),
    });

    setSelectedMarker({ ...hospital, type: "hospital" });
    setOpen(true);
    handleCloseSearch();
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setShowSuggestions(false);
    setSearchTerm("");
  };

  const bloodDonationCenters = [
    {
      name: "المركز الولائي للدم بالشلف",
      lat: 36.16215909617758,
      lng: 1.330560770492638,
    },
    {
      name: "Centre De Sang De Wilaya De Tipaza",
      lat: 36.58741763731009,
      lng: 2.438952555242627,
    },
    {
      name: "المركز الولائي للدم بومرداس",
      lat: 36.7545339057727,
      lng: 3.4415622171743987,
    },
  ];

  const renderMarkers = () => {
    return (
      <>
        {/* Blood Donation Centers Markers */}
        {bloodDonationCenters.map((center, index) => (
          <AdvancedMarker
            key={`blood-${index}`}
            position={{ lat: center.lat, lng: center.lng }}
            title={center.name}
            onClick={() => {
              setSelectedMarker({
                ...center,
                type: "blood",
              });
              setOpen(true);
            }}
          >
            <img
              src={BloodIcon}
              alt={center.name}
              style={{ width: "30px", height: "30px" }}
            />
          </AdvancedMarker>
        ))}

        {/* Hospitals Markers */}
        {hospitalsData.hospitals.map((hospital, index) => (
          <AdvancedMarker
            key={`hospital-${index}`}
            position={{
              lat: hospital.latitude,
              lng: hospital.longitude,
            }}
            title={hospital.name}
            onClick={() => {
              setSelectedMarker({
                ...hospital,
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
        ))}
      </>
    );
  };

  return (
    <>
      <Navbar />
      <CitySelector onLocationChange={handleLocationChange} />
      <APIProvider apiKey="AIzaSyAeTAUxWY5luBGsf-F6-vP8eDLqgjzmACg">
        <div style={mapStyle}>
          <Map
            ref={mapRef}
            mapId={"7e663c504dc4b013"}
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
            options={{
              gestureHandling: "cooperative",
            }}
          >
            <button 
              style={{
                ...searchContainerStyle,
                appearance: 'none',
                border: 'none',
                outline: 'none',
              }}
              onClick={() => {
                if (!showSearch) {
                  setShowSearch(true);
                  setTimeout(() => searchInputRef.current?.focus(), 300);
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
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    background: 'transparent'
                  }}
                />
              ) : (
                <svg viewBox="0 0 20 20" width="22" height="22" fill="none">
                  <path
                    d="M9 16C12.866 16 16 12.866 16 9C16 5.13401 12.866 2 9 2C5.13401 2 2 5.13401 2 9C2 12.866 5.13401 16 9 16Z"
                    stroke="#ff4747"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 18L14 14"
                    stroke="#ff4747"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  className="suggestions-container"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '100%',
                    background: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    zIndex: 1001,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '4px 0',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                        borderLeft: '2px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff474715';
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.borderLeft = '2px solid #ff4747';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderLeft = '2px solid transparent';
                      }}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                          stroke="#ff4747" 
                          strokeWidth="1.5"
                          fill="#ff474710" 
                        />
                      </svg>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <span style={{ 
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#2c3e50'
                        }}>
                          {suggestion.name}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: '#666',
                          fontWeight: '400'
                        }}>
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
                <div>
                  <h3>{selectedMarker.name}</h3>
                  {selectedMarker.type === "hospital" && (
                    <>
                      <p>Structure: {selectedMarker.structure}</p>
                      <p>Phone: {selectedMarker.telephone}</p>
                      <p>Fax: {selectedMarker.fax}</p>
                      <p>Wilaya: {selectedMarker.wilaya}</p>
                    </>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </APIProvider>
    </>
  );
}
