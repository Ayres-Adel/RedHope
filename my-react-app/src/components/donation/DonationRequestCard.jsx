import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTint, faCalendarAlt, faHospital, 
  faMapMarkerAlt, faBan, faInfoCircle, faCheckCircle,
  faPhone, faUserCircle, faExclamationCircle, faTrash, faCheck
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import { getCityNameSync } from '../../utils/cityUtils';
import '../../styles/DonationComponents.css';

const DonationRequestCard = ({ 
  donationRequest, 
  onCancel, 
  onConfirm,
  onViewDetails,
  onComplete,
  onDelete,
  translations, 
  isActionLoading 
}) => {
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

  const getLocationDisplay = () => {
    if (donationRequest.wilaya) return donationRequest.wilaya;
    
    if (donationRequest.cityId) {
      const cityName = getCityNameSync(donationRequest.cityId);
      return cityName || `Wilaya ${donationRequest.cityId}`;
    }
    
    return 'Unknown Location';
  };

  return (
    <div className="donation-card">
      <div className="donation-header">
        <span className={`donation-status ${getStatusClass(donationRequest.status)}`}>
          {getStatusText(donationRequest.status)}
        </span>
        <span className="donation-date">
          <FontAwesomeIcon icon={faCalendarAlt} />
          {formatDate(donationRequest.createdAt)}
        </span>
      </div>
      
      <div className="donation-details">
        <div className="donation-info">
          <span className="donation-blood-type">
            <FontAwesomeIcon icon={faTint} />
            {donationRequest.bloodType || 'Unknown'}
          </span>
          
          <span className="donation-requester">
            <FontAwesomeIcon icon={faUserCircle} />
            {getRequesterInfo(donationRequest)}
          </span>
          
          {donationRequest.hospital && (
            <span className="donation-hospital">
              <FontAwesomeIcon icon={faHospital} />
              {typeof donationRequest.hospital === 'object' 
                ? donationRequest.hospital.name 
                : donationRequest.hospital}
            </span>
          )}
          
          {(donationRequest.cityId || donationRequest.wilaya) && (
            <span className="donation-location">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              {getLocationDisplay()}
            </span>
          )}
          
          {donationRequest.guestPhoneNumber && (
            <span className="donation-phone">
              <FontAwesomeIcon icon={faPhone} />
              {donationRequest.guestPhoneNumber}
            </span>
          )}
          
          {donationRequest.expiryDate && (
            <span className="donation-expiry">
              <FontAwesomeIcon icon={faCalendarAlt} />
              Expires: {formatDate(donationRequest.expiryDate)}
            </span>
          )}
          
          {donationRequest.donorName && donationRequest.donorName !== 'Not assigned' && (
            <span className="donation-donor">
              <FontAwesomeIcon icon={faUserCircle} />
              Donor: {donationRequest.donorName}
            </span>
          )}
        </div>
      </div>
      
      <div className="donation-actions">
        {donationRequest.status === 'Active' && (
          <>
            <button 
              className="cancel-request-btn" 
              onClick={() => onCancel(donationRequest._id)}
              disabled={isActionLoading}
            >
              <FontAwesomeIcon icon={faBan} />
              {translations.cancelRequest}
            </button>
            
            <button 
              className="complete-request-btn" 
              onClick={() => onComplete(donationRequest._id)}
              disabled={isActionLoading}
            >
              <FontAwesomeIcon icon={faCheck} />
              {translations.completeRequest || 'Complete'}
            </button>
            
            {(donationRequest.userIsDonor || donationRequest.donorId) && (
              <button 
                className="confirm-request-btn" 
                onClick={() => onConfirm(donationRequest._id)}
                disabled={isActionLoading}
              >
                <FontAwesomeIcon icon={faCheckCircle} />
                {translations.confirmRequest}
              </button>
            )}
          </>
        )}
        
        <button 
          className="view-details-btn" 
          onClick={() => onViewDetails(donationRequest)}
        >
          <FontAwesomeIcon icon={faInfoCircle} />
          {translations.donationDetails}
        </button>
      </div>
    </div>
  );
};

DonationRequestCard.propTypes = {
  donationRequest: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  translations: PropTypes.object.isRequired,
  isActionLoading: PropTypes.bool
};

export default DonationRequestCard;
