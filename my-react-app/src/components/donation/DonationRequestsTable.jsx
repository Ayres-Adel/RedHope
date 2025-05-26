import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTint, faCalendarAlt, faHospital, 
  faMapMarkerAlt, faBan, faInfoCircle, faSpinner, faCheckCircle,
  faPhone, faUserCircle, faExclamationCircle, faCheck, faTrash 
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import { getCityNameSync } from '../../utils/cityUtils';
import '../../styles/DonationComponents.css';

const DonationRequestsTable = ({ 
  donationRequests, 
  onCancel,
  onConfirm, 
  onViewDetails,
  onComplete,
  onDelete,
  translations, 
  isActionLoading,
  loadingDonations 
}) => {
  const [cityNames, setCityNames] = useState({});

  useEffect(() => {
    if (!donationRequests || donationRequests.length === 0) return;
    
    const uniqueCityIds = Array.from(new Set(
      donationRequests
        .filter(req => req.cityId)
        .map(req => req.cityId)
    ));
    
    const newCityNames = {};
    try {
      uniqueCityIds.forEach(cityId => {
        if (cityId) {
          const cityName = getCityNameSync(cityId);
          newCityNames[cityId] = cityName || `Wilaya ${cityId}`;
        }
      });
      
      setCityNames(newCityNames);
      setCityNamesLoaded(true);
    } catch (error) {
    }
  }, [donationRequests]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-pending';
      case 'fulfilled': return 'status-approved';
      case 'expired': return 'status-rejected';
      case 'cancelled': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return translations.pending;
      case 'fulfilled': return translations.approved;
      case 'expired': return translations.rejected;
      case 'cancelled': return translations.rejected;
      default: return status || 'Unknown';
    }
  };

  const getRequesterInfo = (request) => {
    if (request.requester && typeof request.requester === 'object') {
      return `${request.requester.username || request.requester.name || 'Unknown User'}${
        request.requester.phoneNumber ? ` (${request.requester.phoneNumber})` : ''
      }`;
    } else if (request.guestRequester && typeof request.guestRequester === 'object') {
      return `Guest (${request.guestRequester.phoneNumber || 'No Phone'})`;
    } else if (request.guestPhoneNumber) {
      return `Guest (${request.guestPhoneNumber})`;
    }
    return 'Unknown Requester';
  };

  const getCityName = (cityId) => {
    if (!cityId) return 'No Location';
    
    if (cityNames[cityId]) {
      return cityNames[cityId];
    }
    
    try {
      const directCityName = getCityNameSync(cityId);
      if (directCityName) {
        setCityNames(prev => ({...prev, [cityId]: directCityName}));
        return directCityName;
      }
    } catch (error) {
      console.warn(`Failed to get name for city ID ${cityId}:`, error);
    }
    
    return `Wilaya ${cityId}`;
  };

  if (loadingDonations) {
    return (
      <div className="donations-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>{translations.loadingDonations}</p>
      </div>
    );
  }

  if (!donationRequests || donationRequests.length === 0) {
    return (
      <div className="no-donations-message">
        <p>{translations.noDonations}</p>
      </div>
    );
  }

  return (
    <table className="donations-table">
      <thead><tr>
          <th><FontAwesomeIcon icon={faCalendarAlt} className="icon-spacing" />{translations.donationDate}</th>
          <th><FontAwesomeIcon icon={faTint} className="icon-spacing" />{translations.bloodType}</th>
          <th><FontAwesomeIcon icon={faMapMarkerAlt} className="icon-spacing" />Wilaya</th>
          <th><FontAwesomeIcon icon={faUserCircle} className="icon-spacing" />{translations.requester || 'Requester'}</th>
          <th><FontAwesomeIcon icon={faExclamationCircle} className="icon-spacing" />{translations.donationStatus}</th>
          <th>{translations.actions || 'Actions'}</th>
      </tr></thead>
      <tbody>
        {donationRequests.map(request => (
          <tr key={request._id}>
            <td data-label={translations.donationDate}>
              {formatDate(request.createdAt)}
              {request.expiryDate && (
                <div className="expiry-date">
                  <small>Expires: {formatDate(request.expiryDate)}</small>
                </div>
              )}
            </td>
            <td data-label={translations.donationBloodType}>
              <div className="blood-type-cell">
                {request.bloodType || 'Unknown'}
              </div>
            </td>
            <td data-label={translations.donationLocation}>
              {request.hospital && (
                <div className="location-cell">
                  {typeof request.hospital === 'object' 
                    ? request.hospital.name 
                    : request.hospital}
                </div>
              )}
              {(request.cityId || request.wilaya) && (
                <div className="location-cell">
                  {request.cityId 
                    ? getCityName(request.cityId) 
                    : request.wilaya || 'No Location'
                  }
                </div>
              )}
            </td>
            <td data-label={translations.requester || 'Requester'}>
              <div className="requester-cell">
                {getRequesterInfo(request)}
              </div>
              {request.guestPhoneNumber && (
                <div className="phone-cell">
                  <FontAwesomeIcon icon={faPhone} className="icon-spacing" />
                  {request.guestPhoneNumber}
                </div>
              )}
            </td>
            <td data-label={translations.donationStatus}>
              <span className={`status-badge ${getStatusClass(request.status)}`}>
                {getStatusText(request.status)}
              </span>
            </td>
            <td className="actions">
              <div className="table-actions">
                {request.status === 'Active' && (
                  <>
                    <button 
                      className="action-cancel-btn" 
                      onClick={() => onCancel(request._id)}
                      disabled={isActionLoading}
                    >
                      <FontAwesomeIcon icon={faBan} />
                      {translations.cancelRequest}
                    </button>
                    
                    <button 
                      className="action-complete-btn"
                      onClick={() => onComplete(request._id)}
                      disabled={isActionLoading}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      {translations.completeRequest || 'Complete'}
                    </button>
                    
                    {(request.userIsDonor || request.donorId) && (
                      <button 
                        className="action-confirm-btn" 
                        onClick={() => onConfirm(request._id)}
                        disabled={isActionLoading}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        {translations.confirmRequest}
                      </button>
                    )}
                  </>
                )}
                
                <button 
                  className="action-details-btn" 
                  onClick={() => onViewDetails(request)}
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  {translations.donationDetails}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

DonationRequestsTable.propTypes = {
  donationRequests: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  translations: PropTypes.object.isRequired,
  isActionLoading: PropTypes.bool,
  loadingDonations: PropTypes.bool.isRequired
};

export default DonationRequestsTable;
