import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { formatLocation } from '../utils/LocationService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
} from '@fortawesome/free-solid-svg-icons';
import '../styles/UserPage.css';
import Navbar from './Navbar';
import Toast from './Toast';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiMapPin, FiDroplet, FiLock, FiTrash2, FiSettings, FiHome, FiShield, FiHeart, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import { getCurrentLocation, reverseGeocode } from '../utils/LocationService';

// Import our new components
import DonationRequestsTable from './donation/DonationRequestsTable';
import DonationRequestCard from './donation/DonationRequestCard';
import DonationRequestDetail from './donation/DonationRequestDetail';
import DonationRequestSearch from './donation/DonationRequestSearch';

const UserPage = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    bloodType: '',
    location: '',
    isDonor: false
  });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    bloodType: '',
    location: '',
    isDonor: false
  });
  const [messages, setMessages] = useState([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [activeSection, setActiveSection] = useState('profile');
  const [updating, setUpdating] = useState(false);
  const [donations, setDonations] = useState([]);
  const [filteredDonationRequests, setFilteredDonationRequests] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDonationDetail, setShowDonationDetail] = useState(false);
  const [donationsError, setDonationsError] = useState('');

  // Translations
  const translations = {
    en: {
      accountSettings: 'Account Settings',
      profileInformation: 'Profile Information',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      bloodType: 'Blood Type',
      location: 'Location',
      editInformation: 'Edit Information',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      changePasswordButton: 'Change Password',
      changing: 'Changing...',
      deleteAccount: 'Delete Account',
      deleteConfirmation: 'Type "DELETE" to confirm',
      deleteButton: 'Delete Account',
      cancel: 'Cancel',
      deleteWarning: 'This action cannot be undone. Please type "DELETE" to confirm account deletion.',
      loading: 'Loading...',
      passwordRequired: 'Please fill all password fields',
      passwordMismatch: 'New passwords do not match',
      passwordLength: 'Password must be at least 6 characters',
      passwordChanged: 'Password changed successfully!',
      sessionExpired: 'Session expired. Please login again.',
      deleteConfirmText: 'Please type DELETE to confirm',
      accountDeleted: 'Account deleted successfully',
      failedLoad: 'Failed to load user data',
      invalidRequest: 'Invalid request',
      networkError: 'Network error. Please try again.',
      dashboard: 'Dashboard',
      security: 'Security',
      myProfile: 'My Profile',
      myDonations: 'My Donations',
      overview: 'Overview',
      saveChanges: 'Save Changes',
      updating: 'Updating...',
      profileUpdated: 'Profile updated successfully!',
      donorStatus: 'Donor Status',
      donor: 'Donor',
      nonDonor: 'Non-Donor',
      changeDonorStatus: 'Change Status',
      donorStatusUpdated: 'Donor status updated successfully!',
      donationDate: 'Request Date',
      donationStatus: 'Status',
      donationLocation: 'Location',
      donationBloodType: 'Blood Type Required',
      donationDetails: 'View Details',
      cancelRequest: 'Cancel Request',
      confirmRequest: 'Confirm',
      pending: 'Pending',
      approved: 'Approved',
      completed: 'Completed',
      rejected: 'Rejected',
      loadingDonations: 'Loading your donation requests...',
      donationRequests: 'Donation Requests',
      noDonations: 'No donation requests found',
      completeRequest: 'Complete',
      deleteRequest: 'Delete',
      confirmDeleteRequest: 'Are you sure you want to delete this request?',
      requestCompleted: 'Request marked as completed',
      requestDeleted: 'Request deleted successfully'
    },
    fr: {
      accountSettings: 'Paramètres du Compte',
      profileInformation: 'Informations du Profil',
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      bloodType: 'Groupe Sanguin',
      location: 'Localisation',
      editInformation: 'Modifier les Informations',
      changePassword: 'Changer le Mot de Passe',
      currentPassword: 'Mot de Passe Actuel',
      newPassword: 'Nouveau Mot de Passe',
      confirmPassword: 'Confirmer le Nouveau Mot de Passe',
      changePasswordButton: 'Changer le Mot de Passe',
      changing: 'Changement en cours...',
      deleteAccount: 'Supprimer le Compte',
      deleteConfirmation: 'Tapez "DELETE" pour confirmer',
      deleteButton: 'Supprimer le Compte',
      cancel: 'Annuler',
      deleteWarning: 'Cette action est irréversible. Veuillez taper "DELETE" pour confirmer la suppression du compte.',
      loading: 'Chargement...',
      passwordRequired: 'Veuillez remplir tous les champs du mot de passe',
      passwordMismatch: 'Les nouveaux mots de passe ne correspondent pas',
      passwordLength: 'Le mot de passe doit contenir au moins 6 caractères',
      passwordChanged: 'Mot de passe changé avec succès !',
      sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
      deleteConfirmText: 'Veuillez taper DELETE pour confirmer',
      accountDeleted: 'Compte supprimé avec succès',
      failedLoad: 'Échec du chargement des données utilisateur',
      invalidRequest: 'Requête invalide',
      networkError: 'Erreur réseau. Veuillez réessayer.',
      dashboard: 'Tableau de bord',
      security: 'Sécurité',
      myProfile: 'Mon profil',
      myDonations: 'Mes dons',
      overview: 'Vue d\'ensemble',
      saveChanges: 'Enregistrer les modifications',
      updating: 'Mise à jour...',
      profileUpdated: 'Profil mis à jour avec succès!',
      donorStatus: 'Statut du donneur',
      donor: 'Donneur',
      nonDonor: 'Non-Donneur',
      changeDonorStatus: 'Changer le statut',
      donorStatusUpdated: 'Statut de donneur mis à jour avec succès!',
      donationDate: 'Date de demande',
      donationStatus: 'Statut',
      donationLocation: 'Emplacement',
      donationBloodType: 'Groupe sanguin requis',
      donationDetails: 'Voir les détails',
      cancelRequest: 'Annuler la demande',
      confirmRequest: 'Confirmer',
      pending: 'En attente',
      approved: 'Approuvé',
      completed: 'Terminé',
      rejected: 'Rejeté',
      loadingDonations: 'Chargement de vos demandes de don...',
      donationRequests: 'Demandes de Don',
      noDonations: 'Aucune demande de don trouvée',
      completeRequest: 'Compléter',
      deleteRequest: 'Supprimer',
      confirmDeleteRequest: 'Êtes-vous sûr de vouloir supprimer cette demande?',
      requestCompleted: 'Demande marquée comme complétée',
      requestDeleted: 'Demande supprimée avec succès'
    }
  };

  const t = translations[language];

  // Fetch user data when component mounts - update to also set the editForm state
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        try {
          const { data } = await axios.get(`${API_BASE_URL}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = data.user || data;
          
          if (userData) {
            let formattedLocation = userData.location || 'N/A';
            
            if (typeof formattedLocation === 'string' && formattedLocation.includes(',')) {
              try {
                // Use formatLocation instead of direct reverseGeocode calls
                const locationInfo = await formatLocation(formattedLocation, language);
                
                if (locationInfo.success) {
                  formattedLocation = locationInfo.formatted;
                }
              } catch (geoError) {
                addMessage('Could not fetch location details, showing coordinates instead', 'warning');
              }
            }
            
            const userInfoData = {
              id: userData._id,
              name: userData.username || userData.name || 'N/A',
              email: userData.email || 'N/A',
              phone: userData.phoneNumber || 'N/A',
              bloodType: userData.bloodType || 'N/A',
              location: formattedLocation,
              isDonor: Boolean(userData.isDonor)
            };
            
            setUserInfo(userInfoData);
            
            // Set edit form with the same values
            setEditForm({
              username: userData.username || userData.name || '',
              email: userData.email || '',
              phoneNumber: userData.phoneNumber || '',
              bloodType: userData.bloodType || '',
              location: userData.location || '',
              isDonor: Boolean(userData.isDonor)
            });
            
            setLoading(false);
          }
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            addMessage(t.sessionExpired, 'error');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          addMessage(t.failedLoad, 'error');
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
        addMessage(t.failedLoad, 'error');
      }
    };

    fetchUserData();
  }, [navigate, t.failedLoad, t.sessionExpired, language]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  const addMessage = (text, type) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, type }]);
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const validatePasswordChange = () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        addMessage(t.passwordRequired, 'error');
        return false;
      }
      if (newPassword !== confirmPassword) {
        addMessage(t.passwordMismatch, 'error');
        return false;
      }
      if (newPassword.length < 6) {
        addMessage(t.passwordLength, 'error');
        return false;
      }
      return true;
    };

    if (!validatePasswordChange()) return;

    setIsChangingPassword(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await axios.put(`${API_BASE_URL}/api/user/change-password`,
        {
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      addMessage(t.passwordChanged, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        addMessage(t.sessionExpired, 'error');
        navigate('/login');
      } else {
        addMessage(err.response?.data?.error || t.networkError, 'error');
      }
      console.error('Password change error:', err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      addMessage(t.deleteConfirmText, 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await axios.delete(`${API_BASE_URL}/api/user/${userInfo.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      localStorage.removeItem('token');
      addMessage(t.accountDeleted, 'success');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error deleting account:', err);
      if (err.response && err.response.data.error) {
        addMessage(err.response.data.error, 'error');
      } else {
        addMessage('Failed to delete account', 'error');
      }
    }
  };

  useEffect(() => {
    const toggle = document.getElementById('toggle');
    toggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-theme', toggle.checked);
    });

    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      });
    };
  }, []);

  // Add a function to handle clicking outside the modal
  const handleModalOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on the modal content
    if (e.target.className === 'modal-overlay') {
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  // Function to handle entering edit mode
  const handleEnterEditMode = () => {
    setEditMode(true);
  };
  
  // Function to handle canceling edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset form to current user info - include isDonor status
    setEditForm({
      username: userInfo.name,
      email: userInfo.email,
      phoneNumber: userInfo.phone,
      bloodType: userInfo.bloodType,
      location: userInfo.location,
      isDonor: userInfo.isDonor // Add this to preserve donor status
    });
  };
  
  // Function to handle input changes in the edit form
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to handle saving user information
  const handleSaveUserInfo = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // If we have new location coordinates, try to get the cityId
      if (editForm.location && editForm.location !== userInfo.location && editForm.location.includes(',')) {
        try {
          const locationInfo = await formatLocation(editForm.location, language);
          
          if (locationInfo.success && locationInfo.details?.cityId) {
            // Add cityId to the data being sent to the API
            editForm.cityId = locationInfo.details.cityId;
          }
        } catch (geoError) {
          console.error('Error extracting cityId from location:', geoError);
        }
      }
      
      // Send data to API including cityId if available
      await axios.put(
        `${API_BASE_URL}/api/user/${userInfo.id}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Handle location formatting if location was updated using LocationService
      let formattedLocation = editForm.location;
      
      if (formattedLocation && formattedLocation !== userInfo.location && formattedLocation.includes(',')) {
        try {
          // Use formatLocation function which handles parsing and reverse geocoding in one step
          const locationInfo = await formatLocation(formattedLocation, language);
          
          if (locationInfo.success) {
            formattedLocation = locationInfo.formatted;
          }
        } catch (geoError) {
          addMessage('Location coordinates saved, but address could not be formatted', 'warning');
          // If there's an error, keep the original coordinates
        }
      }
      
      // Update the user info state with the new values including properly formatted location
      setUserInfo({
        ...userInfo,
        name: editForm.username,
        email: editForm.email,
        phone: editForm.phoneNumber,
        bloodType: editForm.bloodType,
        isDonor: editForm.isDonor,
        location: formattedLocation
      });
      
      addMessage(t.profileUpdated, 'success');
      setEditMode(false);
      
      // The refresh of user data is kept as a backup but is now less critical
      // since we're already formatting and updating the location above
      const { data } = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.user || data) {
        const userData = data.user || data;
        // Update only what's needed, keeping the rest intact
        setUserInfo(prev => ({
          ...prev,
          name: userData.username || userData.name || prev.name,
          email: userData.email || prev.email,
          phone: userData.phoneNumber || prev.phone,
          bloodType: userData.bloodType || prev.bloodType,
          isDonor: Boolean(userData.isDonor) // Make sure isDonor is updated
          // Location will be updated with the formatted value during the next useEffect run
        }));
      }
      
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        addMessage(t.sessionExpired, 'error');
        navigate('/login');
      } else {
        addMessage(err.response?.data?.error || t.networkError, 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  // Function to toggle donor status
  const handleToggleDonorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const newDonorStatus = !userInfo.isDonor;
      
      await axios.put(
        `${API_BASE_URL}/api/user/${userInfo.id}`,
        { isDonor: newDonorStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the user info state with the new donor status
      setUserInfo(prev => ({
        ...prev,
        isDonor: newDonorStatus
      }));
      
      // Update the edit form state as well
      setEditForm(prev => ({
        ...prev,
        isDonor: newDonorStatus
      }));
      
      addMessage(t.donorStatusUpdated, 'success');
      
    } catch (err) {
      console.error('Error updating donor status:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        addMessage(t.sessionExpired, 'error');
        navigate('/login');
      } else {
        addMessage(err.response?.data?.error || t.networkError, 'error');
      }
    }
  };

  // Replace the local fetchUserLocation function with imported getCurrentLocation
  const handleGetLocation = () => {
    setUpdating(true);
    
    getCurrentLocation({
      onSuccess: (position) => {
        const { lat, lng } = position;
        const locationString = `${lat},${lng}`;
        
        // Update form with just coordinates first
        setEditForm(prev => ({
          ...prev,
          location: locationString
        }));
        
        // Use the improved formatLocation function instead of separate reverse geocoding
        formatLocation(position, language)
          .then(locationInfo => {
            if (locationInfo.success) {
              // Extract cityId from location details
              const cityId = locationInfo.details?.cityId || null;
              
              // Update form with cityId if available
              if (cityId) {
                setEditForm(prev => ({
                  ...prev,
                  cityId: cityId // Add cityId to form data
                }));
              }
              
              // Show the formatted address in a success message
              addMessage(`Location updated: ${locationInfo.formatted}`, 'success');
            } else {
              console.warn('Could not get formatted location:', locationInfo.message);
              addMessage('Location coordinates saved, but address details could not be retrieved', 'warning');
            }
            setUpdating(false);
          })
          .catch(error => {
            console.error('Error formatting location:', error);
            addMessage('Location coordinates saved without address details', 'warning');
            setUpdating(false);
          });
      },
      onError: (errorMsg) => {
        console.error('Error getting location:', errorMsg);
        addMessage(errorMsg, 'error');
        setUpdating(false);
      },
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  // Update the fetchUserDonations function to get all related requests
  const fetchUserDonations = async () => {
    setLoadingDonations(true);
    setDonationsError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Use the all-user endpoint to get both requests made by the user and requests where user is a donor
      const response = await axios.get(
        `${API_BASE_URL}/api/donation-request/all-user`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && Array.isArray(response.data)) {
        // API returns an array of donation requests
        setDonations(response.data);
        setFilteredDonationRequests(response.data); // Initialize filtered results
      } else if (response.data && Array.isArray(response.data.data)) {
        // API returns an object with a data property containing the array
        setDonations(response.data.data);
        setFilteredDonationRequests(response.data.data); // Initialize filtered results
      } else {
        console.error('Unexpected API response format:', response.data);
        setDonationsError('Unexpected data format received from server');
        setDonations([]);
        setFilteredDonationRequests([]); // Clear filtered results on error
      }
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      setDonationsError(error.response?.data?.message || 'Failed to load donation requests');
      setDonations([]);
      setFilteredDonationRequests([]); // Clear filtered results on error
    } finally {
      setLoadingDonations(false);
    }
  };

  // Fetch donation requests when the user navigates to the donations section
  useEffect(() => {
    if (activeSection === 'donations') {
      fetchUserDonations();
    }
  }, [activeSection]);

  // Handle search results
  const handleSearchResults = (results) => {
    setFilteredDonationRequests(results);
  };

  // Function to handle canceling a donation request
  const handleCancelDonation = async (donationId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Call the API to cancel the donation request
      const response = await axios.put(
        `${API_BASE_URL}/api/donation-request/${donationId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        // Update the local state with the canceled donation
        setDonations(prevDonations => 
          prevDonations.map(donation => 
            donation._id === donationId 
              ? { ...donation, status: 'Cancelled' } 
              : donation
          )
        );
        addMessage('Donation request canceled successfully', 'success');
      } else {
        throw new Error(response.data?.message || 'Failed to cancel donation request');
      }
    } catch (error) {
      console.error('Error canceling donation request:', error);
      addMessage(error.response?.data?.message || 'Failed to cancel donation request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add function to handle confirming a donation request
  const handleConfirmDonation = async (donationId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Call the API to confirm the donation request
      const response = await axios.put(
        `${API_BASE_URL}/api/donation-request/${donationId}/fulfill`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        // Update the local state with the confirmed donation
        setDonations(prevDonations => 
          prevDonations.map(donation => 
            donation._id === donationId 
              ? { ...donation, status: 'Fulfilled' } 
              : donation
          )
        );
        addMessage('Donation request confirmed successfully', 'success');
      } else {
        throw new Error(response.data?.message || 'Failed to confirm donation request');
      }
    } catch (error) {
      console.error('Error confirming donation request:', error);
      addMessage(error.response?.data?.message || 'Failed to confirm donation request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add function to handle completing a donation request
  const handleCompleteDonation = async (donationId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Call the API to mark donation request as completed
      const response = await axios.put(
        `${API_BASE_URL}/api/donation-request/${donationId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        // Update the local state with the completed donation
        setDonations(prevDonations => 
          prevDonations.map(donation => 
            donation._id === donationId 
              ? { ...donation, status: 'Completed' } 
              : donation
          )
        );
        addMessage(t.requestCompleted, 'success');
      } else {
        throw new Error(response.data?.message || 'Failed to complete donation request');
      }
    } catch (error) {
      console.error('Error completing donation request:', error);
      addMessage(error.response?.data?.message || 'Failed to complete donation request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add function to handle deleting a donation request
  const handleDeleteDonation = async (donationId) => {
    // Show confirmation prompt before deleting
    if (!window.confirm(t.confirmDeleteRequest)) {
      return;
    }
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Call the API to delete the donation request
      const response = await axios.delete(
        `${API_BASE_URL}/api/donation-request/${donationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.success) {
        // Remove the donation from the local state
        setDonations(prevDonations => 
          prevDonations.filter(donation => donation._id !== donationId)
        );
        
        addMessage(t.requestDeleted, 'success');
      } else {
        throw new Error(response.data?.message || 'Failed to delete donation request');
      }
    } catch (error) {
      console.error('Error deleting donation request:', error);
      addMessage(error.response?.data?.message || 'Failed to delete donation request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add these functions before the return statement:

  // Function to handle viewing donation details
  const handleViewDonationDetails = (donation) => {
    setSelectedDonation(donation);
    setShowDonationDetail(true);
  };

  // Function to handle closing donation details
  const handleCloseDonationDetails = () => {
    setShowDonationDetail(false);
    setSelectedDonation(null);
  };

  // In the render section, replace the donation container with our new components
  return (
    <>
      <Navbar />
      <div className="user-page">
        <div className="settings-wrapper">
          <div className="admin-sidebar">
            <div className="admin-profile">
              <div className="admin-avatar">
                {loading ? '?' : userInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="admin-info">
                <h3>{loading ? t.loading : userInfo.name}</h3>
                <p>{loading ? '...' : userInfo.email}</p>
              </div>
            </div>
            
            <ul className="admin-menu">
              <li 
                className={activeSection === 'profile' ? 'active' : ''}
                onClick={() => setActiveSection('profile')}
              >
                <FiUser />
                <span>{t.myProfile}</span>
              </li>
              <li 
                className={activeSection === 'donations' ? 'active' : ''}
                onClick={() => setActiveSection('donations')}
              >
                <FiHeart />
                <span>{t.myDonations}</span>
              </li>
              <li 
                className={activeSection === 'security' ? 'active' : ''}
                onClick={() => setActiveSection('security')}
              >
                <FiShield />
                <span>{t.security}</span>
              </li>
              <li 
                className={activeSection === 'danger' ? 'active' : ''}
                onClick={() => setActiveSection('danger')}
              >
                <FiTrash2 />
                <span>{t.deleteAccount}</span>
              </li>
            </ul>
          </div>
          
          <div className="admin-content-area">
            {loading ? (
              <div className="admin-loading">
                <div className="spinner"></div>
                <p>{t.loading}</p>
              </div>
            ) : (
              <>
                {activeSection === 'profile' && (
                  <section>
                    <h2>{t.profileInformation}</h2>
                    <div className="profile-box">
                      <div className="profile-header">
                        <div className="profile-icon">
                          <FiUser />
                        </div>
                        <h3>{t.overview}</h3>
                      </div>
                      
                      {!editMode ? (
                        <>
                          <div className="info-grid">
                            <div className="info-item">
                              <span className="info-label">
                                <FiUser className="info-icon" />
                                {t.name}
                              </span>
                              <span className="info-value">{userInfo.name}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">
                                <FiMail className="info-icon" />
                                {t.email}
                              </span>
                              <span className="info-value">{userInfo.email}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">
                                <FiPhone className="info-icon" />
                                {t.phone}
                              </span>
                              <span className="info-value">{userInfo.phone}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">
                                <FiDroplet className="info-icon" />
                                {t.bloodType}
                              </span>
                              <span className="info-value">{userInfo.bloodType}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">
                                <FiMapPin className="info-icon" />
                                {t.location}
                              </span>
                              <span className="info-value">{userInfo.location}</span>
                            </div>
                            {/* Add donor status info item with toggle button */}
                            <div className="info-item donor-status-item">
                              <span className="info-label">
                                <FiHeart className="info-icon" />
                                {t.donorStatus}
                              </span>
                              <div className="donor-status-container">
                                <span className={`donor-badge ${userInfo.isDonor ? 'is-donor' : 'not-donor'}`}>
                                  {userInfo.isDonor ? t.donor : t.nonDonor}
                                </span>
                                <button 
                                  className="donor-toggle-btn" 
                                  onClick={handleToggleDonorStatus}
                                  aria-label={userInfo.isDonor ? t.nonDonor : t.donor}
                                >
                                  {userInfo.isDonor ? t.nonDonor : t.donor}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="security-footer">
                            <button className="edit-info-btn" onClick={handleEnterEditMode}>
                              <FiSettings /> {t.editInformation}
                            </button>
                          </div>
                        </>
                      ) : (
                        <form onSubmit={handleSaveUserInfo} className="edit-profile-form">
                          <div className="edit-form">
                            <div className="form-field">
                              <label><FiUser className="info-icon" /> {t.name}</label>
                              <input
                                type="text"
                                name="username"
                                value={editForm.username}
                                onChange={handleEditFormChange}
                                className="profile-input"
                              />
                            </div>
                            <div className="form-field">
                              <label><FiMail className="info-icon" /> {t.email}</label>
                              <input
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleEditFormChange}
                                className="profile-input"
                              />
                            </div>
                            <div className="form-field">
                              <label><FiPhone className="info-icon" /> {t.phone}</label>
                              <input
                                type="text"
                                name="phoneNumber"
                                value={editForm.phoneNumber}
                                onChange={handleEditFormChange}
                                className="profile-input"
                              />
                            </div>
                            <div className="form-field">
                              <label><FiDroplet className="info-icon" /> {t.bloodType}</label>
                              <select 
                                name="bloodType" 
                                value={editForm.bloodType}
                                onChange={handleEditFormChange}
                                className="profile-select"
                              >
                                <option value="">Select Blood Type</option>
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
                            <div className="form-field location-field">
                              <label><FiMapPin className="info-icon" /> {t.location}</label>
                              <div className="location-input-container">
                                <input
                                  type="hidden"
                                  name="location"
                                  value={editForm.location}
                                  onChange={handleEditFormChange}
                                  placeholder="Latitude, Longitude"
                                />
                                <button 
                                  type="button" 
                                  className="get-location-btn"
                                  onClick={handleGetLocation}
                                  disabled={updating}
                                >
                                  <FiMapPin />
                                  {updating ? 'Getting...' : 'Get Current Location'}
                                </button>
                              </div>
                            </div>
                            
                            <div className="form-field">
                              <label><FiHeart className="info-icon" /> {t.donorStatus}</label>
                              <div className="donor-toggle-container">
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    name="isDonor"
                                    checked={editForm.isDonor}
                                    onChange={(e) => setEditForm(prev => ({
                                      ...prev,
                                      isDonor: e.target.checked
                                    }))}
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                                <span className={`donor-badge ${editForm.isDonor ? 'is-donor' : 'not-donor'}`}>
                                  {editForm.isDonor ? t.donor : t.nonDonor}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="security-footer edit-buttons">
                            <button 
                              type="button" 
                              className="cancel-btn" 
                              onClick={handleCancelEdit}
                            >
                              {t.cancel}
                            </button>
                            <button 
                              type="submit" 
                              className="edit-info-btn"
                              disabled={updating}
                            >
                              {updating ? t.changing : t.saveChanges}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </section>
                )}

                {activeSection === 'donations' && (
                  <div className="donations-container">
                    <h2>{t.donationRequests}</h2>
                    
                    {donationsError && (
                      <div className="error-message">{donationsError}</div>
                    )}
                    
                    {/* Remove inline styles and use CSS classes */}
                    {loadingDonations ? (
                      <div className="donations-loading">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <p>{t.loadingDonations}</p>
                      </div>
                    ) : donations.length === 0 ? (
                      <div className="no-donations-message">
                        <p>{t.noDonations}</p>
                      </div>
                    ) : (
                      <>
                        <DonationRequestSearch 
                          donationRequests={donations}
                          onSearchResults={handleSearchResults}
                          translations={t}
                        >
                          <div className="donations-wrapper">
                            {/* Remove style conditionals based on viewMode */}
                            <div className="donations-table-wrapper">
                              <DonationRequestsTable
                                donationRequests={filteredDonationRequests}
                                onCancel={handleCancelDonation}
                                onConfirm={handleConfirmDonation}
                                onViewDetails={handleViewDonationDetails}
                                onComplete={handleCompleteDonation}
                                onDelete={handleDeleteDonation}
                                translations={t}
                                isActionLoading={actionLoading}
                                loadingDonations={false}
                              />
                            </div>
                            <div className="donation-cards-container">
                              {filteredDonationRequests.map(request => (
                                <DonationRequestCard
                                  key={request._id}
                                  donationRequest={request}
                                  onCancel={handleCancelDonation}
                                  onConfirm={handleConfirmDonation}
                                  onViewDetails={handleViewDonationDetails}
                                  onComplete={handleCompleteDonation}
                                  onDelete={handleDeleteDonation}
                                  translations={t}
                                  isActionLoading={actionLoading}
                                />
                              ))}
                            </div>
                          </div>
                        </DonationRequestSearch>
                      </>
                    )}
                    
                    {/* Details modal */}
                    {showDonationDetail && selectedDonation && (
                      <DonationRequestDetail
                        donationRequest={selectedDonation}
                        onClose={handleCloseDonationDetails}
                        translations={t}
                        onDelete={handleDeleteDonation} // Add the delete handler
                      />
                    )}
                  </div>
                )}

                {activeSection === 'security' && (
                  <section>
                    <h2>{t.security}</h2>
                    <div className="security-box">
                      <div className="security-header">
                        <div className="security-icon">
                          <FiLock />
                        </div>
                        <h3>{t.changePassword}</h3>
                      </div>
                      <div className="form-field">
                        <label>{t.currentPassword}</label>
                        <div className="password-input-container">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder={t.currentPassword}
                          />
                          <span 
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                          </span>
                        </div>
                      </div>
                      <div className="form-field">
                        <label>{t.newPassword}</label>
                        <div className="password-input-container">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t.newPassword}
                          />
                          <span 
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showNewPassword ? <FiEyeOff /> : <FiEye />}
                          </span>
                        </div>
                      </div>
                      <div className="form-field">
                        <label>{t.confirmPassword}</label>
                        <div className="password-input-container">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t.confirmPassword}
                          />
                          <span 
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                          </span>
                        </div>
                      </div>
                      <div className="security-footer">
                        <button 
                          className="password-submit-btn" 
                          onClick={handlePasswordChange}
                          disabled={isChangingPassword}
                        >
                          <FiLock /> {isChangingPassword ? t.changing : t.changePasswordButton}
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === 'danger' && (
                  <section>
                    <h2>{t.deleteAccount}</h2>
                    <div className="danger-box">
                      <p>{t.deleteWarning}</p>
                      <button className="danger-action-btn" onClick={() => setShowDeleteModal(true)}>
                        <FiTrash2 /> {t.deleteButton}
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
        
        {showDeleteModal && (
          <div className="modal-overlay" onClick={handleModalOverlayClick}>
            <div className="modal">
              <div className="modal-header">
                <div className="modal-icon danger-icon">
                  <FiTrash2 />
                </div>
                <h3>{t.deleteAccount}</h3>
              </div>
              <div className="modal-content">
                <p className="modal-warning">{t.deleteWarning}</p>
                <div className="form-group">
                  <label className="info-label">{t.deleteConfirmation}</label>
                  <input
                    type="text"
                    placeholder={t.deleteConfirmation}
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="modal-buttons">
                  <button
                    className="control-button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmation('');
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    className="danger-action-btn"
                    onClick={() => {
                      if (deleteConfirmation !== 'DELETE') {
                        addMessage(t.deleteConfirmText, 'error');
                        return;
                      }
                      handleDeleteAccount();
                    }}
                  >
                    <FiTrash2 /> {t.deleteButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="toast-container">
        {messages.map(msg => (
          <Toast
            key={msg.id}
            message={msg.text}
            type={msg.type}
            onClose={() => removeMessage(msg.id)}
          />
        ))}
      </div>
    </>
  );
};

export default UserPage;