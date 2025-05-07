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
                  <td>{donation._id.slice(-6)}</td>
                  <td>
                    {donation.donorEmail || 
                     (donation.donor && donation.donor.email) || 
                     donation.donorId || 
                     donation.donorName || 
                     'N/A'}
                  </td>
                  <td>{donation.bloodType}</td>
                  <td>{new Date(donation.date).toLocaleDateString()}</td>
                  <td>{donation.location}</td>
                  <td><StatusBadge status={donation.status} /></td>
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
