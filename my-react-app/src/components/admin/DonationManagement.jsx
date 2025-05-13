import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload } from '@fortawesome/free-solid-svg-icons';
import ActionButton from '../ui/ActionButton';
import StatusBadge from '../ui/StatusBadge';

/**
 * DonationManagement component for handling blood donation data and operations
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
  EmptyStateMessage,
  Pagination,
  LoadingIndicator,
  STATUS
}) => {
  return (
    <div className="admin-donations">
      <h2>{translations.donationManagement}</h2>
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder={translations.searchDonations} 
            value={searchTerm} 
            onChange={onSearchChange} 
          />
        </div>
        <div className="action-buttons">
          <button 
            className="control-button" 
            onClick={() => onExportCSV('donations')} 
            disabled={actionLoading}
          >
            <FontAwesomeIcon icon={faDownload} /> 
            {actionLoading ? 'Exporting...' : translations.exportData}
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <LoadingIndicator message={translations.loadingData} />
        ) : donations.length === 0 ? (
          <EmptyStateMessage 
            type="donation" 
            message={searchTerm ? 'No donations match search.' : 'No donations found.'} 
          />
        ) : (
          <div className="table-wrapper">
            {/* Regular table for desktop view */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>{translations.id}</th>
                  <th>{translations.donorEmail}</th>
                  <th>{translations.bloodType}</th>
                  <th>{translations.date}</th>
                  <th>{translations.location}</th>
                  <th>{translations.status}</th>
                  <th>{translations.actions}</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(donation => (
                  <tr key={donation._id}>
                    <td data-label={translations.id}>{donation._id.slice(-6)}</td>
                    <td data-label={translations.donorEmail}>
                      {donation.donorEmail || 
                       (donation.donor && donation.donor.email) || 
                       donation.donorId || 
                       donation.donorName || 
                       'N/A'}
                    </td>
                    <td data-label={translations.bloodType} className="blood-type-cell">{donation.bloodType}</td>
                    <td data-label={translations.date}>{new Date(donation.date).toLocaleDateString()}</td>
                    <td data-label={translations.location}>{donation.location}</td>
                    <td data-label={translations.status}><StatusBadge status={donation.status} /></td>
                    <td className="actions">
                      {donation.status === STATUS.PENDING && (
                        <>
                          <ActionButton 
                            type="approve" 
                            onClick={() => onUpdateStatus(donation._id, STATUS.COMPLETED)} 
                          />
                          <ActionButton 
                            type="reject" 
                            onClick={() => onUpdateStatus(donation._id, STATUS.CANCELLED)} 
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Card view for mobile */}
            <div className="data-cards">
              {donations.map(donation => (
                <div className="data-card" key={donation._id}>
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
                      <span className="data-card-value">{donation._id.slice(-6)}</span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.date}</span>
                      <span className="data-card-value">{new Date(donation.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.location}</span>
                      <span className="data-card-value">{donation.location}</span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.status}</span>
                      <span className="data-card-value status">
                        <StatusBadge status={donation.status} />
                      </span>
                    </div>
                  </div>
                  
                  {donation.status === STATUS.PENDING && (
                    <div className="data-card-footer">
                      <div className="actions">
                        <ActionButton 
                          type="approve" 
                          onClick={() => onUpdateStatus(donation._id, STATUS.COMPLETED)} 
                        />
                        <ActionButton 
                          type="reject" 
                          onClick={() => onUpdateStatus(donation._id, STATUS.CANCELLED)} 
                        />
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
    totalItems: PropTypes.number
  }).isRequired,
  translations: PropTypes.object.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  EmptyStateMessage: PropTypes.elementType.isRequired,
  Pagination: PropTypes.elementType.isRequired,
  LoadingIndicator: PropTypes.elementType.isRequired,
  STATUS: PropTypes.object.isRequired
};

export default React.memo(DonationManagement);
