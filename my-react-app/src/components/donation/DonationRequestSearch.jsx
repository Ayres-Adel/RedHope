import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import '../../styles/DonationComponents.css';

const DonationRequestSearch = ({ 
  donationRequests, 
  onSearchResults,
  translations = {},
  children 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRequests, setFilteredRequests] = useState(donationRequests);
  const [activeFilter, setActiveFilter] = useState('all');

  // When donation requests change, update filtered results
  useEffect(() => {
    handleSearch(searchTerm, activeFilter);
  }, [donationRequests]);

  // Filter function for donation requests
  const handleSearch = useCallback((term, filter) => {
    if (!donationRequests || !Array.isArray(donationRequests)) {
      return;
    }

    let results = [...donationRequests];

    // Filter by search term
    if (term) {
      const searchLower = term.toLowerCase();
      results = results.filter(request => 
        (request.bloodType && request.bloodType.toLowerCase().includes(searchLower)) ||
        (request.requester && typeof request.requester === 'object' && request.requester.username && 
          request.requester.username.toLowerCase().includes(searchLower)) ||
        (request.guestPhoneNumber && request.guestPhoneNumber.includes(term)) ||
        (request.hospital && typeof request.hospital === 'object' && request.hospital.name && 
          request.hospital.name.toLowerCase().includes(searchLower)) ||
        (request.status && request.status.toLowerCase().includes(searchLower)) ||
        (typeof request.hospital === 'string' && request.hospital.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (filter !== 'all') {
      results = results.filter(request => 
        request.status && request.status.toLowerCase() === filter.toLowerCase()
      );
    }

    setFilteredRequests(results);
    onSearchResults(results);
  }, [donationRequests, onSearchResults]);

  // Handle input change
  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    handleSearch(term, activeFilter);
  };

  // Handle filter selection
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    handleSearch(searchTerm, filter);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    handleSearch('', activeFilter);
  };

  return (
    <div className="donation-search-container">
      <div className="donation-search-wrapper">
        <div className="donation-search-input-container">
          <FontAwesomeIcon icon={faSearch} className="donation-search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder={translations.searchDonations || "Search donations..."}
            className="donation-search-input"
          />
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="donation-search-clear"
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        
        <div className="donation-filter-container">
          <span className="filter-label">
            <FontAwesomeIcon icon={faFilter} /> {translations.filterStatus || "Filter:"}
          </span>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              {translations.all || "All"}
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => handleFilterChange('active')}
            >
              {translations.active || "Active"}
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'fulfilled' ? 'active' : ''}`}
              onClick={() => handleFilterChange('fulfilled')}
            >
              {translations.fulfilled || "Fulfilled"}
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => handleFilterChange('cancelled')}
            >
              {translations.cancelled || "Cancelled"}
            </button>
          </div>
        </div>
      </div>

      <div className="search-results-info">
        {searchTerm && (
          <p className="search-results-count">
            {filteredRequests.length} {translations.resultsFound || "results found"} 
            {activeFilter !== 'all' ? ` (${activeFilter})` : ''}
          </p>
        )}
      </div>

      {/* Render children (table or cards) */}
      {React.cloneElement(children, { donationRequests: filteredRequests })}
    </div>
  );
};

DonationRequestSearch.propTypes = {
  donationRequests: PropTypes.array.isRequired,
  onSearchResults: PropTypes.func.isRequired,
  translations: PropTypes.object,
  children: PropTypes.element.isRequired
};

export default DonationRequestSearch;
