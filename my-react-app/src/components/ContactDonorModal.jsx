import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faTimes } from '@fortawesome/free-solid-svg-icons';
import guestService from '../utils/guestService';
import { getCurrentLocation } from '../utils/LocationService';
import { donationRequestService } from '../services/api'; // Import donation request service
import '../styles/ContactDonorModal.css';

const ContactDonorModal = ({ donor, isOpen, onClose, language = 'en' }) => {
  // Initialize phoneNumber from sessionStorage or empty string
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return sessionStorage.getItem('guestPhoneNumber') || '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [requestCreated, setRequestCreated] = useState(false); // Track request creation
  
  // Translation system
  const translations = useMemo(() => ({
    en: {
      contactDonor: 'Contact Donor',
      yourInfoSaved: 'Your information has been saved!',
      contactDonorAt: 'You can now contact the donor at:',
      donationRequestCreated: 'A donation request has been created for',
      bloodType: 'blood type',
      accountCreated: 'Account created on:',
      accountRegistered: 'Account registered on:',
      providePhoneNumber: 'To contact this donor, please provide your phone number:',
      donorBloodType: 'Donor Blood Type:',
      location: 'Location:',
      yourPhoneNumber: 'Your Phone Number',
      enterPhoneNumber: 'Enter your phone number',
      saving: 'Saving...',
      submit: 'Submit',
      invalidPhone: 'Please enter a valid phone number',
      errorSaving: 'An error occurred while saving your information'
    },
    fr: {
      contactDonor: 'Contacter le Donneur',
      yourInfoSaved: 'Vos informations ont été enregistrées!',
      contactDonorAt: 'Vous pouvez maintenant contacter le donneur au:',
      donationRequestCreated: 'Une demande de don a été créée pour le groupe sanguin',
      bloodType: '',
      accountCreated: 'Compte créé le:',
      accountRegistered: 'Compte enregistré le:',
      providePhoneNumber: 'Pour contacter ce donneur, veuillez fournir votre numéro de téléphone:',
      donorBloodType: 'Groupe Sanguin du Donneur:',
      location: 'Localisation:',
      yourPhoneNumber: 'Votre Numéro de Téléphone',
      enterPhoneNumber: 'Entrez votre numéro de téléphone',
      saving: 'Enregistrement...',
      submit: 'Envoyer',
      invalidPhone: 'Veuillez entrer un numéro de téléphone valide',
      errorSaving: 'Une erreur est survenue lors de l\'enregistrement de vos informations'
    }
  }), []);

  // Get translations for current language
  const t = translations[language] || translations.en;
  
  if (!isOpen) return null;

  // Update the handleSubmit function to work for both guests and logged-in users
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setRequestCreated(false);
    
    try {
      // Format phone number - remove non-digit characters
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      if (formattedPhone.length < 10) {
        setError(t.invalidPhone);
        setIsSubmitting(false);
        return;
      }
      
      // Save validated phone number to sessionStorage for future use
      sessionStorage.setItem('guestPhoneNumber', formattedPhone);
      
      // Get current location
      let location;
      try {
        location = await new Promise((resolve, reject) => {
          getCurrentLocation({
            onSuccess: (position) => resolve(position),
            onError: (error) => reject(error),
            enableHighAccuracy: true,
            timeout: 10000
          });
        });
      } catch (locError) {
        console.error('Error getting location:', locError);
        location = { lat: 0, lng: 0 };
      }
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      
      // Whether logged in or guest, create a donation request
      try {
        // Calculate default expiry date (7 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        
        // Prepare donation request data
        const donationRequestData = {
          bloodType: donor.bloodType,
          donorId: donor._id || donor.id, // Add the selected donor's ID
          expiryDate: expiryDate.toISOString(),
          location: {
            type: 'Point',
            coordinates: [location.lng || 0, location.lat || 0]
          }
        };
        
        // For guests, we need to register them first
        if (!token) {
          // 1. Register guest
          const guestResponse = await guestService.registerGuest(formattedPhone, {
            type: 'Point',
            coordinates: [location.lng || 0, location.lat || 0]
          });
          
          // Store registration info including timestamps
          const guestInfo = {
            guestId: guestResponse._id || guestResponse.id || guestResponse.guestId,
            createdAt: guestResponse.createdAt,
            lastActive: guestResponse.lastActive || new Date().toISOString()
          };
          setRegistrationInfo(guestInfo);
          
          // Add guest-specific fields to the request
          donationRequestData.phoneNumber = formattedPhone;
          donationRequestData.guestId = guestInfo.guestId;
          
          // Create guest donation request
          const requestResponse = await donationRequestService.createGuestDonationRequest(donationRequestData);
          console.log('Guest donation request created:', requestResponse.data);
          
        } else {
          // For logged-in users, use the standard endpoint
          const requestResponse = await donationRequestService.createDonationRequest(donationRequestData);
          console.log('User donation request created:', requestResponse.data);
        }
        
        setRequestCreated(true);
        
      } catch (requestError) {
        console.error('Error creating donation request:', requestError);
        // Continue with the flow even if request creation fails
      }
      
      // Show success message
      setSuccess(true);
      
      // Store registration timestamp in local storage to track guest history
      if (!token) {
        try {
          const guestHistory = JSON.parse(localStorage.getItem('guestContactHistory') || '[]');
          guestHistory.push({
            phoneNumber: formattedPhone,
            donorId: donor.id || donor._id,
            donorBloodType: donor.bloodType,
            timestamp: new Date().toISOString(),
            registeredAt: registrationInfo?.createdAt,
            requestCreated: requestCreated
          });
          localStorage.setItem('guestContactHistory', JSON.stringify(guestHistory));
        } catch (storageErr) {
          console.error("Couldn't save guest history:", storageErr);
        }
      }
      
      // Handle direct contact if contactMethod was specified
      if (donor.contactMethod) {
        handleDirectContact(donor.contactMethod, donor.phoneNumber, formattedPhone);
      }
      
      // Close modal after 2 seconds if no specific contact method
      if (!donor.contactMethod) {
        setTimeout(() => {
          onClose();
          setSuccess(false);
          // Don't reset phoneNumber here so it stays in state
          setRegistrationInfo(null);
          setRequestCreated(false);
        }, 2000);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || t.errorSaving);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to directly contact donor after registration
  const handleDirectContact = (method, donorPhone, guestPhone) => {
    if (!donorPhone) return;
    
    try {
      // Format phone number for international dialing
      let formattedPhone = donorPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = `213${formattedPhone.substring(1)}`;
      } else if (!formattedPhone.startsWith('213') && !formattedPhone.startsWith('+213')) {
        formattedPhone = `213${formattedPhone}`;
      }
      formattedPhone = formattedPhone.replace(/^\+/, '');
      
      // Default message
      const messageText = encodeURIComponent(
        'Hello, I found you on RedHope. I need your help with a blood donation.'
      );
      
      // Create a small delay so the user sees the success message before opening contact method
      setTimeout(() => {
        switch (method) {
          case 'whatsapp':
            window.open(`https://wa.me/${formattedPhone}?text=${messageText}`, '_blank');
            break;
          
          case 'telegram':
            window.open(`https://t.me/+${formattedPhone}`, '_blank');
            break;
          
          case 'sms':
            window.open(`sms:${donorPhone}?body=${messageText}`, '_blank');
            break;
          
          case 'call':
            window.open(`tel:${donorPhone}`, '_blank');
            break;
          
          default:
            window.open(`sms:${donorPhone}?body=${messageText}`, '_blank');
        }
        
        // Close the modal after opening the contact method
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setPhoneNumber('');
          setRegistrationInfo(null);
          setRequestCreated(false);
        }, 500);
      }, 1000);
      
    } catch (error) {
      console.error("Error opening contact method:", error);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.contactDonor}</h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="modal-body">
          {success ? (
            <div className="success-message">
              <p>{t.yourInfoSaved}</p>
              <p>{t.contactDonorAt} {donor.phoneNumber}</p>
              {requestCreated && (
                <p className="request-info">{t.donationRequestCreated} {donor.bloodType} {t.bloodType}.</p>
              )}
              {registrationInfo?.createdAt && (
                <p className="registration-info">
                  <small>
                    {registrationInfo.createdAt !== registrationInfo.lastActive ? 
                      t.accountCreated : t.accountRegistered} {formatDate(registrationInfo.createdAt)}
                  </small>
                </p>
              )}
            </div>
          ) : (
            <>
              <p>{t.providePhoneNumber}</p>
              <p className="donor-info">
                <strong>{t.donorBloodType}</strong> {donor.bloodType}
                {donor.location && <><br /><strong>{t.location}</strong> {donor.location}</>}
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="phoneNumber">{t.yourPhoneNumber}</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    placeholder={t.enterPhoneNumber}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  {phoneNumber && (
                    <small className="phone-info">
                      Using previously entered phone number
                    </small>
                  )}
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button 
                  type="submit" 
                  className="contact-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.saving : (
                    <>
                      <FontAwesomeIcon icon={faPhone} /> {t.submit}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDonorModal;
