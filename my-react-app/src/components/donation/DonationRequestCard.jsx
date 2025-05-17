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
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get appropriate status class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-pending';
      case 'fulfilled': return 'status-approved';
      case 'expired': return 'status-rejected';
      case 'cancelled': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  // Get translated status text
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return translations.pending;
      case 'fulfilled': return translations.approved;
      case 'expired': return translations.rejected;
      case 'cancelled': return translations.rejected;
      default: return status || 'Unknown';
    }
  };

  // Get requester info (handle both registered users and guests)
  const getRequesterInfo = (request) => {
    if (request.requester && typeof request.requester === 'object') {
      // Return username with phone number if available
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

  // Helper function to get location display with city name
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
          {/* Blood type */}
          <span className="donation-blood-type">
            <FontAwesomeIcon icon={faTint} />
            {donationRequest.bloodType || 'Unknown'}
          </span>
          
          {/* Requester info */}
          <span className="donation-requester">
            <FontAwesomeIcon icon={faUserCircle} />
            {getRequesterInfo(donationRequest)}
          </span>
          
          {/* Hospital info */}
          {donationRequest.hospital && (
            <span className="donation-hospital">
              <FontAwesomeIcon icon={faHospital} />
              {typeof donationRequest.hospital === 'object' 
                ? donationRequest.hospital.name 
                : donationRequest.hospital}
            </span>
          )}
          
          {/* Location info */}
          {(donationRequest.cityId || donationRequest.wilaya) && (
            <span className="donation-location">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              {getLocationDisplay()}
            </span>
          )}
          
          {/* Phone number */}
          {donationRequest.guestPhoneNumber && (
            <span className="donation-phone">
              <FontAwesomeIcon icon={faPhone} />
              {donationRequest.guestPhoneNumber}
            </span>
          )}
          
          {/* Expiry date */}
          {donationRequest.expiryDate && (
            <span className="donation-expiry">
              <FontAwesomeIcon icon={faCalendarAlt} />
              Expires: {formatDate(donationRequest.expiryDate)}
            </span>
          )}
          
          {/* Donor information if available */}
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
            
            {/* Show confirm button conditionally */}
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
