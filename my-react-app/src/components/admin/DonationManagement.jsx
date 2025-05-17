import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faDownload, faFilter, 
  faCalendarAlt, faTint, faMapMarkerAlt 
} from '@fortawesome/free-solid-svg-icons';
import ActionButton from '../ui/ActionButton';
import StatusBadge from '../ui/StatusBadge';

/**
 * Enhanced DonationManagement component for handling blood donation data and operations
 */
const DonationManagement = ({
  donations,
  loading,
  actionLoading,
  searchTerm,
  pageInfo,
  translations,
  onSearchChange,
  onExportCSV,
  onUpdateStatus,
  onPageChange,
  onFilterChange,
  EmptyStateMessage,
  Pagination,
  LoadingIndicator,
  STATUS,
  filters = {} // Added filters prop with default
}) => {
  return (
    <div className="admin-donations">
      <h2>{translations.donationManagement}</h2>
      
      {/* Enhanced controls section with filters */}
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder={translations.searchDonations} 
            value={searchTerm} 
            onChange={onSearchChange} 
            aria-label="Search donations"
          />
        </div>
        
        {/* New filter section */}
        <div className="filter-group">
          <div className="filter-container">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select 
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value={STATUS.PENDING}>Pending</option>
              <option value={STATUS.COMPLETED}>Completed</option>
              <option value={STATUS.CANCELLED}>Cancelled</option>
            </select>
          </div>
          
          <div className="filter-container">
            <FontAwesomeIcon icon={faTint} className="filter-icon" />
            <select 
              value={filters.bloodType || ''}
              onChange={(e) => onFilterChange('bloodType', e.target.value)}
              aria-label="Filter by blood type"
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
        
        <div className="action-buttons">
          <button 
            className="control-button" 
            onClick={() => onExportCSV('donations')} 
            disabled={actionLoading}
          >
            <FontAwesomeIcon icon={faDownload} /> 
            {actionLoading ? translations.exporting : translations.exportData}
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <LoadingIndicator message={translations.loadingData} />
        ) : donations.length === 0 ? (
          <EmptyStateMessage 
            type="donation" 
            message={searchTerm ? translations.noMatchingDonations : translations.noDonationsFound} 
            icon={faTint}
          />
        ) : (
          <div className="table-wrapper">
            {/* Enhanced table for desktop view */}
            <table className="data-table">
              <thead><tr>
                  <th>{translations.id}</th>
                  <th>{translations.donorEmail}</th>
                  <th>{translations.bloodType}</th>
                  <th>{translations.date}</th>
                  <th>{translations.location}</th>
                  <th>{translations.status}</th>
                  <th>{translations.actions}</th>
              </tr></thead>
              <tbody>
                {donations.map(donation => (
                  <tr key={donation._id} className={`status-${donation.status?.toLowerCase()}`}>
                    <td data-label={translations.id}>{donation._id.slice(-6)}</td>
                    <td data-label={translations.donorEmail}>
                      {donation.donorEmail || 
                       (donation.donor && donation.donor.email) || 
                       donation.donorId || 
                       donation.donorName || 
                       'N/A'}
                    </td>
                    <td data-label={translations.bloodType} className="blood-type-cell">
                      <span className="blood-type-badge">{donation.bloodType}</span>
                    </td>
                    <td data-label={translations.date}>
                      <div className="date-cell">
                        <FontAwesomeIcon icon={faCalendarAlt} className="cell-icon" />
                        {new Date(donation.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td data-label={translations.location}>
                      <div className="location-cell">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="cell-icon" />
                        {donation.location}
                      </div>
                    </td>
                    <td data-label={translations.status}><StatusBadge status={donation.status} /></td>
                    <td className="actions">
                      {donation.status === STATUS.PENDING && (
                        <>
                          <ActionButton 
                            type="approve" 
                            onClick={() => onUpdateStatus(donation._id, STATUS.COMPLETED)} 
                            tooltip={translations.approveDonation}
                          />
                          <ActionButton 
                            type="reject" 
                            onClick={() => onUpdateStatus(donation._id, STATUS.CANCELLED)} 
                            tooltip={translations.rejectDonation}
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Improved card view for mobile */}
            <div className="data-cards">
              {donations.map(donation => (
                <div 
                  className={`data-card status-${donation.status?.toLowerCase()}-card`} 
                  key={donation._id}
                >
                  <div className="data-card-blood-type">{donation.bloodType}</div>
                  
                  <div className="data-card-header">
                    <h3 className="data-card-title">
                      {donation.donorEmail || 
                       (donation.donor && donation.donor.email) || 
                       donation.donorId || 
                       donation.donorName || 
                       'N/A'}
                    </h3>
                  </div>
                  
                  <div className="data-card-content">
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.id}</span>
                      <span className="data-card-value">#{donation._id.slice(-6)}</span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.date}</span>
                      <span className="data-card-value date-value">
                        <FontAwesomeIcon icon={faCalendarAlt} className="card-field-icon" />
                        {new Date(donation.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.location}</span>
                      <span className="data-card-value location-value">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="card-field-icon" />
                        {donation.location}
                      </span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.status}</span>
                      <span className="data-card-value status">
                        <StatusBadge status={donation.status} showIcon={true} />
                      </span>
                    </div>
                  </div>
                  
                  {donation.status === STATUS.PENDING && (
                    <div className="data-card-footer">
                      <div className="data-card-actions">
                        <button 
                          className="card-action-btn approve"
                          onClick={() => onUpdateStatus(donation._id, STATUS.COMPLETED)}
                        >
                          {translations.approve}
                        </button>
                        <button 
                          className="card-action-btn reject"
                          onClick={() => onUpdateStatus(donation._id, STATUS.CANCELLED)}
                        >
                          {translations.reject}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Pagination
        currentPage={pageInfo.page}
        totalPages={pageInfo.totalPages}
        totalItems={pageInfo.totalItems}
        itemsPerPage={pageInfo.limit || 10}
        onPageChange={(newPage) => onPageChange('donations', newPage)}
      />
    </div>
  );
};

DonationManagement.propTypes = {
  donations: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  pageInfo: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    totalItems: PropTypes.number,
    limit: PropTypes.number
  }).isRequired,
  translations: PropTypes.object.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func,
  EmptyStateMessage: PropTypes.elementType.isRequired,
  Pagination: PropTypes.elementType.isRequired,
  LoadingIndicator: PropTypes.elementType.isRequired,
  STATUS: PropTypes.object.isRequired,
  filters: PropTypes.object
};

export default React.memo(DonationManagement);
