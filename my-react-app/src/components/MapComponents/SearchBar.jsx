import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faSearch } from '@fortawesome/free-solid-svg-icons';

export const SearchBar = ({ 
  showSearch, 
  setShowSearch, 
  searchInputRef, 
  searchTerm, 
  handleSearch, 
  isDarkMode,
  suggestions, 
  showSuggestions,
  handleSuggestionClick,
  language = 'en'
}) => {
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState(null);

  const translations = useMemo(() => ({
    en: {
      searchPlaceholder: "Search hospitals...",
      searchHospitals: "Search hospitals"
    },
    fr: {
      searchPlaceholder: "Rechercher des hôpitaux...",
      searchHospitals: "Rechercher des hôpitaux"
    }
  }), []);

  const t = translations[language] || translations.en;

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
    borderRadius: showSearch ? "25px" : "50%",
    padding: showSearch ? "10px 15px" : "12px",
    width: showSearch ? "300px" : "45px",
    height: "45px",
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
    background: "transparent",
  };

  const suggestionsStyle = {
    position: "absolute",
    top: "calc(100% + 5px)",
    left: 0,
    width: "100%",
    zIndex: 1001,
    maxHeight: "300px",
    overflowY: "auto",
  };

  return (
    <button
      className="map-search-button"
      style={searchContainerStyle}
      onClick={() => {
        if (!showSearch) {
          setShowSearch(true);
          setTimeout(() => searchInputRef.current?.focus(), 500); 
        }
      }}
      aria-label={t.searchHospitals}
    >
      {showSearch ? (
        <>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="map-search-input"
            style={searchInputStyle}
            aria-label={t.searchHospitals}
          />
        </>
      ) : (
        <FontAwesomeIcon 
          icon={faSearch} 
          style={searchIconStyle}
          className="search-icon"
          aria-hidden="true"
        />
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-container" style={suggestionsStyle}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion-item ${hoveredSuggestionIndex === index ? "hovered" : ""}`}
              onMouseEnter={() => setHoveredSuggestionIndex(index)}
              onMouseLeave={() => setHoveredSuggestionIndex(null)}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={hoveredSuggestionIndex === index}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="suggestion-icon" aria-hidden="true" />
              <div className="suggestion-text">
                <span className="suggestion-name">{suggestion.name}</span>
                <span className="suggestion-wilaya">{suggestion.wilaya}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
};
