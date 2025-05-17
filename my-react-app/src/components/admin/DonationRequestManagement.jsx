import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faDownload, faTint, 
  faCheckCircle, faTimesCircle, faHospital,
  faUserAlt, faCalendarAlt, faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import ActionButton from '../ui/ActionButton';
import StatusBadge from '../ui/StatusBadge';
import { donationRequestService } from '../../services/api';

/**
 * DonationRequestManagement component for handling donation requests data and operations
 */
const DonationRequestManagement = ({
  translations,
  EmptyStateMessage,
  Pagination,
  LoadingIndicator,
}) => {
  // State management
  const [donationRequests, setDonationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [error, setError] = useState(null);

  // Status constants
  const STATUS = {
    ACTIVE: 'Active',
    FULFILLED: 'Fulfilled',
    CANCELLED: 'Cancelled',
  };

  // Fetch donation requests with filters
  const fetchDonationRequests = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Prepare query parameters
      const queryParams = {
        page,
        limit: pageInfo.itemsPerPage,
        ...filters
      };
      
      if (searchTerm) {
        queryParams.search = searchTerm;
      }
      
      // Get all donation requests using the getDonationRequests API
      const response = await donationRequestService.getDonationRequests(queryParams);
      
      if (response?.data) {
        // Extract data correctly depending on API response format
        const requestsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || []);
        
        // Process the donation requests - preserve ALL data from API response
        const processedRequests = requestsData.map(request => {
          let requesterInfo = 'Unknown';
          
          if (request.requester && typeof request.requester === 'object') {
            requesterInfo = `${request.requester.username || request.requester.name || 'Unknown'}`;
            if (request.requester.phoneNumber) {
              requesterInfo += ` (${request.requester.phoneNumber})`;
            }
          } else if (request.guestRequester && typeof request.guestRequester === 'object') {
            requesterInfo = `Guest (${request.guestRequester.phoneNumber || 'No Phone'})`;
          } else if (request.guestPhoneNumber) {
            requesterInfo = `Guest (${request.guestPhoneNumber})`;
          }
          
          return {
            _id: request._id,
            requester: requesterInfo,
            bloodType: request.bloodType || 'Unknown',
            hospital: request.hospital?.name || 'Not specified',
            status: request.status || 'Active',
            createdAt: request.createdAt || new Date().toISOString(),
            expiryDate: request.expiryDate || '',
            donorId: request.donor?._id || request.donor || '',
            donorName: request.donor?.username || 'Not assigned',
            guestRequester: request.guestRequester?._id || '',
            guestPhoneNumber: request.guestRequester?.phoneNumber || '',
            cityId: request.cityId || '',
            wilaya: request.wilaya || '',
            // Keep all original data to ensure nothing is lost
            ...request
          };
        });
        
        setDonationRequests(processedRequests);
        
        // Update pagination info if available
        if (response.data.pagination) {
          setPageInfo({
            page: response.data.pagination.currentPage || page,
            totalPages: response.data.pagination.totalPages || 1,
            totalItems: response.data.pagination.totalItems || processedRequests.length,
            itemsPerPage: pageInfo.itemsPerPage
          });
        }
      } else {
        setDonationRequests([]);
        console.warn("Invalid donation requests response format:", response);
      }
    } catch (err) {
      console.error("Error fetching donation requests:", err);
      setError(`Failed to fetch donation requests: ${err.message || 'Unknown error'}`);
      setDonationRequests([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pageInfo.itemsPerPage]);

  // Initial data fetch
  useEffect(() => {
    fetchDonationRequests(1);
  }, [fetchDonationRequests]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search to avoid too many API calls
    const timer = setTimeout(() => {
      fetchDonationRequests(1, { search: value });
    }, 500);
    
    return () => clearTimeout(timer);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchDonationRequests(newPage);
  };

  // Handle status update
  const handleUpdateStatus = async (requestId, newStatus) => {
    if (!requestId || !newStatus) return;
    
    if (!window.confirm(`Are you sure you want to mark this donation request as ${newStatus}?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      await donationRequestService.updateDonationRequestStatus(requestId, newStatus);
      
      // Update the local state
      setDonationRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId ? { ...req, status: newStatus } : req
        )
      );
    } catch (err) {
      console.error("Error updating donation request status:", err);
      setError(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle canceling a donation request
  const handleCancelRequest = async (requestId) => {
    if (!requestId) return;
    
    if (!window.confirm('Are you sure you want to cancel this donation request?')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await donationRequestService.cancelDonationRequest(requestId);
      
      // Update the local state
      setDonationRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId ? { ...req, status: 'Cancelled' } : req
        )
      );
    } catch (err) {
      console.error("Error canceling donation request:", err);
      setError(`Failed to cancel request: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle export to CSV
  const handleExportToCSV = async () => {
    setExportLoading(true);
    try {
      // Implementation remains the same
      const allDonationRequests = [...donationRequests];
      
      const headers = [
        'ID', 'Blood Type', 'Hospital', 'Status', 'Created At', 
        'Expiry Date', 'Donor Name', 'City'
      ];
      
      const csvRows = [
        headers.join(','),
        ...allDonationRequests.map(request => [
          request._id,
          request.bloodType,
          request.hospital,
          request.status,
          new Date(request.createdAt).toLocaleString(),
          request.expiryDate ? new Date(request.expiryDate).toLocaleString() : 'N/A',
          request.donorName,
          request.cityId || 'N/A'
        ].map(cell => `"${cell}"`).join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'donation-requests.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error exporting donation requests:", err);
      setError(`Failed to export: ${err.message || 'Unknown error'}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Format wilaya name for display
  const formatWilayaName = (request) => {
    if (request.wilaya) return request.wilaya;
    if (request.cityId) return `Wilaya ${request.cityId}`;
    return "N/A";
  };

  return (
    <div className="admin-donation-requests">
      <h2>Donation Request Management</h2>
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search donation requests..." 
            value={searchTerm} 
            onChange={handleSearchChange} 
          />
        </div>
        <div className="action-buttons">
          <button 
            className="control-button" 
            onClick={handleExportToCSV} 
            disabled={exportLoading || donationRequests.length === 0}
          >
            <FontAwesomeIcon icon={faDownload} /> 
            {exportLoading ? 'Exporting...' : translations?.exportData || 'Export Data'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        {loading ? (
          <LoadingIndicator message={translations?.loadingData || 'Loading donation requests...'} />
        ) : donationRequests.length === 0 ? (
          <EmptyStateMessage 
            type="donation request" 
            message={searchTerm ? 'No donation requests match your search.' : 'No donation requests found.'} 
          />
        ) : (
          <div className="table-wrapper">
            {/* Regular table for desktop view */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Blood Type</th>
                  <th>Requester</th>
                  <th>Hospital</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donationRequests.map(request => (
                  <tr key={request._id}>
                    <td data-label="ID">{request._id.slice(-6)}</td>
                    <td data-label="Blood Type" className="blood-type-cell">
                      <span className="blood-type-badge">
                        <FontAwesomeIcon icon={faTint} className="blood-icon" />
                        {request.bloodType}
                      </span>
                    </td>
                    <td data-label="Requester">{request.requester}</td>
                    <td data-label="Hospital">
                      {request.hospital !== 'Not specified' ? (
                        <span>
                          <FontAwesomeIcon icon={faHospital} className="icon-spacing" />
                          {request.hospital}
                        </span>
                      ) : 'Not specified'}
                    </td>
                    <td data-label="Created">{formatDate(request.createdAt)}</td>
                    <td data-label="Expires">{formatDate(request.expiryDate)}</td>
                    <td data-label="Status">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="actions">
                      {request.status === STATUS.ACTIVE && (
                        <>
                          <button 
                            className="action-btn approve"
                            onClick={() => handleUpdateStatus(request._id, STATUS.FULFILLED)}
                            disabled={actionLoading}
                            title="Mark as fulfilled"
                          >
                            <FontAwesomeIcon icon={faCheckCircle} />
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => handleCancelRequest(request._id)}
                            disabled={actionLoading}
                            title="Cancel request"
                          >
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Card view for mobile - removed inline style */}
            <div className="data-cards">
              {donationRequests.map(request => (
                <div className="data-card" key={request._id}>
                  <div className="data-card-blood-type">{request.bloodType}</div>
                  
                  <div className="data-card-header">
                    <h3 className="data-card-title">Request {request._id.slice(-6)}</h3>
                    <div className="data-card-subtitle">
                      <StatusBadge status={request.status} />
                    </div>
                  </div>
                  
                  <div className="data-card-content">
                    <div className="data-card-field">
                      <span className="data-card-label">Requester</span>
                      <span className="data-card-value">
                        <FontAwesomeIcon icon={faUserAlt} className="icon-spacing" />
                        {request.requester}
                      </span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">Hospital</span>
                      <span className="data-card-value">
                        <FontAwesomeIcon icon={faHospital} className="icon-spacing" />
                        {request.hospital}
                      </span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">Donor</span>
                      <span className="data-card-value">
                        <FontAwesomeIcon icon={faUserAlt} className="icon-spacing" />
                        {request.donorName || 'Not assigned'}
                      </span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">Created</span>
                      <span className="data-card-value">
                        <FontAwesomeIcon icon={faCalendarAlt} className="icon-spacing" />
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">Expires</span>
                      <span className="data-card-value">
                        <FontAwesomeIcon icon={faCalendarAlt} className="icon-spacing" />
                        {formatDate(request.expiryDate)}
                      </span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">Wilaya</span>
                      <span className="data-card-value">
                        {formatWilayaName(request) !== "N/A" && (
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-spacing" />
                        )}
                        {formatWilayaName(request)}
                      </span>
                    </div>
                  </div>
                  
                  {request.status === STATUS.ACTIVE && (
                    <div className="data-card-footer">
                      <div className="actions">
                        <button 
                          className="action-btn approve"
                          onClick={() => handleUpdateStatus(request._id, STATUS.FULFILLED)}
                          disabled={actionLoading}
                          title="Mark as fulfilled"
                        >
                          <FontAwesomeIcon icon={faCheckCircle} /> Fulfilled
                        </button>
                        <button 
                          className="action-btn reject"
                          onClick={() => handleCancelRequest(request._id)}
                          disabled={actionLoading}
                          title="Cancel request"
                        >
                          <FontAwesomeIcon icon={faTimesCircle} /> Cancel
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
        onPageChange={handlePageChange}
      />
    </div>
  );
};

DonationRequestManagement.propTypes = {
  translations: PropTypes.object,
  EmptyStateMessage: PropTypes.elementType.isRequired,
  Pagination: PropTypes.elementType.isRequired,
  LoadingIndicator: PropTypes.elementType.isRequired,
};

export default DonationRequestManagement;
