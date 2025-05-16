import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTint, faCalendarAlt, faHospital, 
  faMapMarkerAlt, faUser, faNotesMedical,
  faClock, faTimes, faPhone, faIdCard,
  faUserCircle, faShieldAlt, faCheckCircle,
  faTimesCircle, faClock as faClockSolid
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import { getCityNameSync } from '../../utils/cityUtils';
import '../../styles/DonationComponents.css'; // Import the new CSS file

const DonationRequestDetail = ({ donationRequest, onClose, translations, onUpdateStatus }) => {
  const modalRef = useRef(null);
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Disable body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get appropriate status icon and class
  const getStatusInfo = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'active':
      case 'pending':
        return { 
          icon: faClock, 
          class: 'status-pending',
          text: translations.pending || 'Pending'
        };
      case 'fulfilled':
      case 'completed':
      case 'approved':
        return { 
          icon: faCheckCircle, 
          class: 'status-approved',
          text: translations.approved || 'Approved'
        };
      case 'expired':
      case 'cancelled':
      case 'rejected':
        return { 
          icon: faTimesCircle, 
          class: 'status-rejected',
          text: translations.rejected || 'Rejected'
        };
      default:
        return { 
          icon: faClockSolid, 
          class: 'status-unknown',
          text: status || 'Unknown'
        };
    }
  };

  // Helper function to get city name from cityId
  const getCityName = (cityId) => {
    if (!cityId) return null;
    return getCityNameSync(cityId) || `City ${cityId}`;
  };
  
  // Get status info
  const statusInfo = getStatusInfo(donationRequest.status);

  return (
    <div className="modal-overlay">
      <div className="donation-detail-modal" ref={modalRef}>
        <div className={`donation-detail-header ${statusInfo.class}`}>
          <h3>
            <FontAwesomeIcon icon={faTint} className="header-icon" />
            {translations.donationRequestDetails || 'Donation Request Details'}
          </h3>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="donation-detail-content">
          {/* Status badge */}
          <div className="donation-detail-status">
            <span className={`status-badge ${statusInfo.class}`}>
              <FontAwesomeIcon icon={statusInfo.icon} />
              {statusInfo.text}
            </span>
            
            {donationRequest.urgent && (
              <span className="urgency-badge">
                <FontAwesomeIcon icon={faShieldAlt} />
                {translations.urgent || 'Urgent'}
              </span>
            )}
          </div>

          {/* Request ID */}
          <div className="donation-detail-item">
            <FontAwesomeIcon icon={faIdCard} className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">{translations.requestId || 'Request ID'}</span>
              <span className="detail-value id-value">#{donationRequest._id.slice(-8)}</span>
            </div>
          </div>
          
          {/* Blood Type */}
          <div className="donation-detail-item highlight">
            <FontAwesomeIcon icon={faTint} className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">{translations.donationBloodType || 'Blood Type'}</span>
              <span className="detail-value blood-type">{donationRequest.bloodType || 'Unknown'}</span>
            </div>
          </div>
          
          {/* Created Date */}
          <div className="donation-detail-item">
            <FontAwesomeIcon icon={faCalendarAlt} className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">{translations.donationDate || 'Created Date'}</span>
              <span className="detail-value">{formatDate(donationRequest.createdAt)}</span>
            </div>
          </div>
          
          {/* Expiry Date */}
          {donationRequest.expiryDate && (
            <div className="donation-detail-item">
              <FontAwesomeIcon icon={faClock} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{translations.expiryDate || 'Expiry Date'}</span>
                <span className="detail-value">{formatDate(donationRequest.expiryDate)}</span>
                {new Date(donationRequest.expiryDate) < new Date() && (
                  <span className="detail-note expired-note">
                    {translations.expired || 'This request has expired'}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Hospital */}
          {donationRequest.hospital && (
            <div className="donation-detail-item">
              <FontAwesomeIcon icon={faHospital} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{translations.hospital || 'Hospital'}</span>
                <span className="detail-value hospital-name">
                  {typeof donationRequest.hospital === 'object' 
                    ? donationRequest.hospital.name 
                    : donationRequest.hospital}
                </span>
                {donationRequest.hospital.telephone && (
                  <a href={`tel:${donationRequest.hospital.telephone}`} className="detail-contact">
                    <FontAwesomeIcon icon={faPhone} /> {donationRequest.hospital.telephone}
                  </a>
                )}
                {donationRequest.hospital.address && (
                  <span className="detail-subvalue">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {donationRequest.hospital.address}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Location */}
          {(donationRequest.cityId || donationRequest.wilaya) && (
            <div className="donation-detail-item">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{translations.location || 'Location'}</span>
                <span className="detail-value">
                  {donationRequest.wilaya || 
                   (donationRequest.cityId && getCityName(donationRequest.cityId)) || 
                   (donationRequest.cityId ? `Wilaya ${donationRequest.cityId}` : 'N/A')}
                </span>
              </div>
            </div>
          )}
          
          {/* Requester (User) */}
          {donationRequest.requester && (
            <div className="donation-detail-item">
              <FontAwesomeIcon icon={faUserCircle} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{translations.requester || 'Requester'}</span>
                <span className="detail-value user-name">
                  {typeof donationRequest.requester === 'object' 
                    ? (donationRequest.requester.username || donationRequest.requester.name || 'Anonymous')
                    : translations.registeredUser || 'Registered User'}
                </span>
                {typeof donationRequest.requester === 'object' && donationRequest.requester.phoneNumber && (
                  <a 
                    href={`tel:${donationRequest.requester.phoneNumber}`}
                    className="detail-contact"
                  >
                    <FontAwesomeIcon icon={faPhone} /> {donationRequest.requester.phoneNumber}
                  </a>
                )}
                {typeof donationRequest.requester === 'object' && donationRequest.requester.email && (
                  <span className="detail-subvalue">{donationRequest.requester.email}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Guest Requester */}
          {donationRequest.guestRequester && (
            <div className="donation-detail-item guest-item">
              <FontAwesomeIcon icon={faUser} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{translations.guestRequester || 'Guest Requester'}</span>
                <div className="detail-value guest-name">
                  {(typeof donationRequest.guestRequester === 'object' && 
                   donationRequest.guestRequester.name) || translations.guestUser || 'Guest User'}
                  
                  {typeof donationRequest.guestRequester === 'object' && 
                    donationRequest.guestRequester.phoneNumber && (
                    <a 
                      href={`tel:${donationRequest.guestRequester.phoneNumber}`}
                      className="detail-contact"
                    >
                      <FontAwesomeIcon icon={faPhone} /> {donationRequest.guestRequester.phoneNumber}
                    </a>
                  )}
                  {donationRequest.guestPhoneNumber && (
                    <a 
                      href={`tel:${donationRequest.guestPhoneNumber}`}
                      className="detail-contact"
                    >
                      <FontAwesomeIcon icon={faPhone} /> {donationRequest.guestPhoneNumber}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Donor */}
          {(donationRequest.donor || donationRequest.donorId || donationRequest.donorName) && (
            <div className="donation-detail-item donor-item">
              <FontAwesomeIcon icon={faUserCircle} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{translations.donor || 'Donor'}</span>
                <span className="detail-value donor-name">
                  {typeof donationRequest.donor === 'object'
                    ? (donationRequest.donor.username || donationRequest.donor.name || 'Anonymous Donor')
                    : (donationRequest.donorName || translations.assignedDonor || 'Assigned Donor')}
                </span>
                
                {typeof donationRequest.donor === 'object' && donationRequest.donor.phoneNumber && (
                  <a 
                    href={`tel:${donationRequest.donor.phoneNumber}`}
                    className="detail-contact"
                  >
                    <FontAwesomeIcon icon={faPhone} /> {donationRequest.donor.phoneNumber}
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Notes (if available) */}
          {donationRequest.notes && (
            <div className="donation-detail-item notes-item">
              <FontAwesomeIcon icon={faNotesMedical} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">{translations.additionalNotes || 'Additional Notes'}</span>
                <p className="detail-notes">{donationRequest.notes}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="donation-detail-footer">
          {/* Status update buttons */}
          {onUpdateStatus && donationRequest.status === 'active' && (
            <div className="status-update-buttons">
              <button 
                className="update-status-btn approve"
                onClick={() => onUpdateStatus(donationRequest._id, 'fulfilled')}
              >
                <FontAwesomeIcon icon={faCheckCircle} />
                {translations.markFulfilled || 'Mark as Fulfilled'}
              </button>
              
              <button 
                className="update-status-btn reject"
                onClick={() => onUpdateStatus(donationRequest._id, 'cancelled')}
              >
                <FontAwesomeIcon icon={faTimesCircle} />
                {translations.markCancelled || 'Mark as Cancelled'}
              </button>
            </div>
          )}
          
          <button className="close-detail-btn" onClick={onClose}>
            {translations.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

DonationRequestDetail.propTypes = {
  donationRequest: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  translations: PropTypes.object.isRequired,
  onUpdateStatus: PropTypes.func
};

export default DonationRequestDetail;
